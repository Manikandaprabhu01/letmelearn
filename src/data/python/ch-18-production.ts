import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const pythonProduction: Concept[] = [
  {
    slug: "fastapi",
    title: "Serving AI with FastAPI",
    subtitle:
      "Chapter 18 — typed endpoints, dependency injection, streaming responses, background work and auth",
    level: "advanced",
    minutes: 30,
    tags: ["fastapi", "api", "streaming", "sse", "dependency injection"],
    summary:
      "FastAPI turns type hints into a validated, documented HTTP API. For AI services it covers exactly what matters: Pydantic request and response models, async endpoints for concurrent model calls, server-sent events for streaming tokens, dependencies for auth and shared clients, and a lifespan hook for loading models once instead of on every request.",
    keyPoints: [
      "Request and response bodies are Pydantic models, so validation and OpenAPI docs come for free.",
      "Create expensive clients and models once in the lifespan, never per request.",
      "Stream tokens with server-sent events so users see progress immediately.",
      "async def endpoints must not block, and long jobs belong in a queue rather than the request.",
    ],
    prerequisites: ["/python/typing-pydantic", "/python/concurrency-asyncio"],
    sections: [
      {
        heading: "A typed endpoint",
        code: {
          title: "Validation, a response model and docs from type hints",
          lang: "python",
          source: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="docs-qa", version="1.0.0")

class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)

class AskResponse(BaseModel):
    answer: str
    sources: list[str]

@app.post("/v1/ask", response_model=AskResponse)
async def ask(body: AskRequest) -> AskResponse:
    result = await pipeline.answer(body.question, top_k=body.top_k)
    return AskResponse(answer=result.text, sources=result.source_ids)

# Run:  uv run uvicorn docs_qa.api:app --reload
# Docs: http://127.0.0.1:8000/docs  -- interactive, generated from the models above`,
        },
        bullets: [
          "An invalid body never reaches your code: FastAPI returns 422 with field-level errors from Pydantic.",
          "response_model filters the output to the declared fields, so an internal attribute cannot leak into the response by accident.",
          "Version the path (/v1/...) from day one. Changing an AI response shape later without breaking clients is much easier with a version prefix.",
        ],
        links: [
          { label: "FastAPI documentation", href: "https://fastapi.tiangolo.com/" },
          {
            label: "YouTube search — FastAPI full course",
            href: YT("FastAPI full course tutorial pydantic async"),
          },
        ],
      },
      {
        heading: "Lifespan and dependencies",
        lede: "Load once, inject everywhere.",
        code: {
          title: "Shared resources and an auth dependency",
          lang: "python",
          source: `from contextlib import asynccontextmanager
from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException, Request

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings()                                     # fails fast if config is missing
    app.state.pipeline = await RagPipeline.create(settings)   # load models and clients ONCE
    yield
    await app.state.pipeline.aclose()                         # graceful shutdown

app = FastAPI(title="docs-qa", lifespan=lifespan)

def get_pipeline(request: Request) -> RagPipeline:
    return request.app.state.pipeline

async def current_user(authorization: Annotated[str | None, Header()] = None) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    return await verify_token(authorization.removeprefix("Bearer "))

PipelineDep = Annotated[RagPipeline, Depends(get_pipeline)]
UserDep = Annotated[User, Depends(current_user)]

@app.post("/v1/ask", response_model=AskResponse)
async def ask(body: AskRequest, pipeline: PipelineDep, user: UserDep) -> AskResponse:
    result = await pipeline.answer(body.question, tenant_id=user.tenant_id)   # identity from the token
    return AskResponse(answer=result.text, sources=result.source_ids)`,
        },
        bullets: [
          "Loading an embedding model inside the endpoint adds seconds to every request and multiplies memory. The lifespan runs once per worker process.",
          "Dependencies make endpoints testable: tests replace get_pipeline and current_user with fakes (below).",
          "Take the tenant from the verified token, never from the request body. A client can put any tenant id it likes in a JSON field.",
        ],
      },
      {
        heading: "Streaming tokens with server-sent events",
        diagram: {
          kind: "sequence",
          caption: "Retrieval first, then tokens as they are generated.",
          actors: [
            { id: "b", label: "Browser" },
            { id: "api", label: "FastAPI" },
            { id: "r", label: "Retriever" },
            { id: "m", label: "Model" },
          ],
          messages: [
            { from: "b", to: "api", label: "POST /v1/ask/stream", kind: "call" },
            { from: "api", to: "r", label: "retrieve(question, tenant)", kind: "call" },
            { from: "r", to: "api", label: "5 chunks", kind: "return" },
            { from: "api", to: "m", label: "stream generation", kind: "call" },
            { from: "m", to: "api", label: "token, token, token…", kind: "async" },
            {
              from: "api",
              to: "b",
              label: "data: {type: token}",
              kind: "async",
              note: "user sees text within ~0.5s",
            },
            {
              from: "api",
              to: "b",
              label: "data: {type: done, sources}",
              kind: "async",
              tone: "ok",
            },
          ],
        },
        code: {
          title: "An async generator becomes an event stream",
          lang: "python",
          source: `import json
from fastapi import Request
from fastapi.responses import StreamingResponse

@app.post("/v1/ask/stream")
async def ask_stream(body: AskRequest, request: Request, pipeline: PipelineDep, user: UserDep):
    async def events():
        chunks = await pipeline.retrieve(body.question, tenant_id=user.tenant_id)
        async for text in pipeline.stream_answer(body.question, chunks):
            if await request.is_disconnected():          # user closed the tab: stop paying for tokens
                return
            yield f"data: {json.dumps({'type': 'token', 'text': text})}\\n\\n"
        yield f"data: {json.dumps({'type': 'done', 'sources': [c.id for c in chunks]})}\\n\\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},   # stop proxies buffering
    )`,
        },
        bullets: [
          "Each event is a line starting with data: followed by a blank line. Sending JSON per event lets you mix tokens, sources and errors on one stream.",
          "Proxies and load balancers often buffer responses, which turns a stream back into a long wait. X-Accel-Buffering: no handles nginx; check your platform's equivalent.",
          "Stopping generation on disconnect is a real cost saving: abandoned chats would otherwise keep generating tokens nobody reads.",
        ],
        links: [
          {
            label: "MDN — using server-sent events",
            href: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events",
          },
          { label: "Site: real-time delivery", href: "/hld/websockets" },
        ],
      },
      {
        heading: "Errors, timeouts and limits",
        code: {
          title: "Map domain errors to honest status codes",
          lang: "python",
          source: `import asyncio
from fastapi.responses import JSONResponse

@app.exception_handler(RateLimitedError)
async def on_rate_limited(request: Request, exc: RateLimitedError):
    return JSONResponse(
        status_code=429,
        content={"error": "rate_limited", "message": "Too many requests, try again shortly."},
        headers={"Retry-After": str(int(exc.retry_after))},
    )

@app.exception_handler(ModelOutputError)
async def on_bad_model_output(request: Request, exc: ModelOutputError):
    return JSONResponse(status_code=502, content={"error": "upstream_model_error"})

@app.post("/v1/summarise")
async def summarise(body: SummariseRequest, pipeline: PipelineDep):
    try:
        async with asyncio.timeout(25):          # 3.11+: a hard deadline for the whole operation
            return await pipeline.summarise(body.text)
    except TimeoutError:
        raise HTTPException(status_code=504, detail="generation timed out")`,
        },
        table: {
          headers: ["Situation", "Status", "Why"],
          rows: [
            ["Invalid request body", "422", "The client must fix the request (automatic)"],
            ["Missing or invalid credentials", "401", "Authenticate first"],
            ["Authenticated but not allowed", "403", "Authorisation, not authentication"],
            [
              "Per-user quota exceeded",
              "429 + Retry-After",
              "Tells well-behaved clients when to retry",
            ],
            ["Model returned unusable output", "502", "An upstream dependency failed"],
            ["Operation exceeded its deadline", "504", "Upstream too slow; the client may retry"],
          ],
        },
        links: [{ label: "Site: rate limiting", href: "/hld/rate-limiting" }],
      },
      {
        heading: "Background work and queues",
        diagram: {
          kind: "compare",
          caption: "Anything longer than a few seconds should leave the request.",
          options: [
            {
              title: "BackgroundTasks",
              sub: "Runs in the same process after the response",
              good: ["Zero infrastructure", "Fine for small side effects like sending an event"],
              bad: [
                "Lost if the process restarts",
                "No retries, no visibility, competes with requests",
              ],
              verdict: "Small, losable side effects only.",
              tone: "warn",
            },
            {
              title: "A real job queue",
              sub: "Redis-based queues, Celery, a managed queue",
              good: [
                "Survives restarts",
                "Retries and dead-letter handling",
                "Scale workers separately from the API",
              ],
              bad: ["Another component to run and monitor"],
              verdict: "Ingestion, re-embedding, batch evaluation.",
              tone: "ok",
            },
          ],
        },
        code: {
          title: "Accept the job, return a handle, let the client poll",
          lang: "python",
          source: `@app.post("/v1/documents", status_code=202)
async def upload(file: UploadFile, user: UserDep) -> dict:
    blob_key = await storage.save(file, tenant_id=user.tenant_id)
    job_id = await queue.enqueue("ingest_document", blob_key=blob_key, tenant_id=user.tenant_id)
    return {"job_id": job_id, "status_url": f"/v1/jobs/{job_id}"}

@app.get("/v1/jobs/{job_id}")
async def job_status(job_id: str, user: UserDep) -> dict:
    job = await jobs.get(job_id, tenant_id=user.tenant_id)    # scoped: no peeking at other tenants' jobs
    if job is None:
        raise HTTPException(status_code=404)
    return {"status": job.status, "chunks_indexed": job.chunks_indexed}`,
        },
        links: [{ label: "Site: message queues", href: "/hld/message-queues" }],
      },
      {
        heading: "Testing the API",
        code: {
          title: "Override dependencies with fakes",
          lang: "python",
          source: `from fastapi.testclient import TestClient

def test_ask_returns_answer_and_sources():
    app.dependency_overrides[get_pipeline] = lambda: FakePipeline(text="30 days", source_ids=["policy#2"])
    app.dependency_overrides[current_user] = lambda: User(id="u1", tenant_id="t1")
    client = TestClient(app)          # not used as a context manager, so the real lifespan does not run

    resp = client.post("/v1/ask", json={"question": "What is the refund window?"})

    assert resp.status_code == 200
    assert resp.json() == {"answer": "30 days", "sources": ["policy#2"]}
    app.dependency_overrides.clear()

def test_rejects_blank_question():
    resp = TestClient(app).post("/v1/ask", json={"question": ""})
    assert resp.status_code == 422`,
        },
      },
      {
        heading: "Running it in production",
        code: {
          title: "Processes for cores, async for waiting",
          lang: "bash",
          source: `# Several worker processes use several CPU cores;
# inside each, the event loop handles many concurrent I/O-bound requests.
uvicorn docs_qa.api:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers`,
        },
        bullets: [
          "Expose /healthz (the process is alive) and /readyz (dependencies reachable, models loaded) so orchestrators route traffic only to ready instances.",
          "Add a request-id middleware and propagate it into logs and model-call traces from the first line.",
          "Configure CORS to your real front-end origins only, never '*' together with credentials.",
          "Each worker loads its own copy of any in-process model. Four workers with a 1 GB model need 4 GB — size memory limits accordingly.",
        ],
        followUps: [
          {
            q: "Why load models in the lifespan rather than at import or per request?",
            a: "Per request adds seconds of latency and repeated memory allocation to every call. At import time it runs even for tooling and tests that never serve traffic, and failures are harder to handle. The lifespan runs once per worker at startup, can fail fast with a clear error, and pairs with a shutdown step to close clients cleanly.",
          },
          {
            q: "How do you stream an LLM response to a browser?",
            a: "An async generator consuming the provider's token stream, wrapped in a StreamingResponse with the text/event-stream media type. Each token goes out as an SSE data line, with a final event carrying sources and usage. I disable proxy buffering, stop generation when the client disconnects, and have the browser read it with EventSource or a fetch stream reader.",
          },
          {
            q: "When should work move out of the request?",
            a: "When it takes more than a few seconds, must survive a restart, needs retries, or can be batched — document ingestion, re-embedding, large evaluations. The API accepts the job, returns 202 with a job id, and workers process a durable queue while the client polls or receives a webhook.",
          },
        ],
      },
    ],
    related: [
      "/python/concurrency-asyncio",
      "/python/mlops-deployment",
      "/hld/api-gateway",
      "/java/web-development",
    ],
    furtherReading: [
      { label: "FastAPI documentation", href: "https://fastapi.tiangolo.com/" },
      {
        label: "FastAPI — lifespan events",
        href: "https://fastapi.tiangolo.com/advanced/events/",
      },
    ],
  },

  {
    slug: "mlops-deployment",
    title: "Deploying and Operating AI Services",
    subtitle:
      "Chapter 19 — containers, versioning, observability, evaluation in production, and cost control",
    level: "advanced",
    minutes: 30,
    tags: ["docker", "mlops", "observability", "deployment", "llmops", "cost"],
    summary:
      "Shipping is where AI projects succeed or quietly fail. A production AI service is a normal service — container, configuration, health checks, logs, metrics, CI/CD — plus three AI-specific disciplines: versioning prompts, models and indexes together; evaluating quality continuously; and watching cost per request as closely as latency.",
    keyPoints: [
      "Package the service as a slim, reproducible container built from the lockfile.",
      "Version prompt, model, embedding model and index together — changing any of them is a release.",
      "Monitor quality, latency and cost per request, not just whether the service is up.",
      "Roll out changes gradually, and keep an evaluation gate in CI.",
    ],
    prerequisites: ["/python/fastapi", "/python/testing"],
    sections: [
      {
        heading: "The production shape",
        diagram: {
          kind: "system",
          caption: "An AI service is a normal service with an expensive dependency.",
          columns: [
            {
              title: "Edge",
              nodes: [
                { id: "clients", label: "Web and mobile clients" },
                {
                  id: "lb",
                  label: "Load balancer / gateway",
                  sub: "TLS, auth, rate limits",
                  tone: "accent",
                },
              ],
            },
            {
              title: "Service",
              nodes: [
                { id: "api", label: "FastAPI containers", sub: "stateless, autoscaled" },
                { id: "workers", label: "Ingestion workers", sub: "scale on queue depth" },
              ],
            },
            {
              title: "Dependencies",
              nodes: [
                { id: "llm", label: "LLM provider", sub: "or self-hosted inference", tone: "warn" },
                { id: "pg", label: "Postgres + pgvector", sub: "chunks, users, jobs" },
                { id: "cache", label: "Redis", sub: "answer cache, rate limits" },
                { id: "queue", label: "Job queue" },
              ],
            },
            {
              title: "Operations",
              nodes: [
                { id: "otel", label: "Traces, metrics, logs", sub: "OpenTelemetry" },
                { id: "evals", label: "Evaluation store", sub: "scores per release", tone: "ok" },
              ],
            },
          ],
        },
      },
      {
        heading: "A good Dockerfile",
        code: {
          title: "Multi-stage, cached dependencies, non-root",
          lang: "dockerfile",
          source: `FROM python:3.12-slim AS build
# Pin a specific uv version in real builds instead of latest
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project    # dependency layer: cached until the lockfile changes
COPY src ./src
RUN uv sync --frozen --no-dev                         # now install the project itself

FROM python:3.12-slim
RUN useradd --create-home app
WORKDIR /app
COPY --from=build --chown=app:app /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER app
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz')"
CMD ["uvicorn", "docs_qa.api:app", "--host", "0.0.0.0", "--port", "8000"]`,
        },
        bullets: [
          "Copying the lockfile before the source means a code change rebuilds in seconds; only a dependency change reinstalls packages.",
          "Run as a non-root user and keep secrets out of the image entirely — they arrive as environment variables at runtime.",
          "GPU services need a CUDA base image and matching PyTorch build, and are a separate image from CPU-only API services.",
          "Model weights: baking them into the image makes start-up predictable but images huge; downloading at start keeps images small but adds a dependency on the model store. Pick deliberately.",
        ],
        links: [
          {
            label: "uv — using uv in Docker",
            href: "https://docs.astral.sh/uv/guides/integration/docker/",
          },
          { label: "Site: containers and memory limits", href: "/java/docker" },
        ],
      },
      {
        heading: "Versioning what changes behaviour",
        table: {
          headers: ["Artefact", "Why it must be versioned", "How"],
          rows: [
            [
              "Prompt",
              "A one-word edit can change quality across thousands of answers",
              "Named constant or file with an id, logged per request",
            ],
            [
              "Model id",
              "Providers update and retire models",
              "Configuration, with an explicit pinned version",
            ],
            [
              "Embedding model",
              "Vectors from different models are incompatible",
              "Stored next to every vector; a change means re-indexing",
            ],
            [
              "Index snapshot",
              "Answers depend on which documents were indexed",
              "Build id and document versions",
            ],
            [
              "Evaluation set",
              "Scores are only comparable on the same set",
              "Versioned file in the repository",
            ],
            ["Code", "Parsing, retrieval and business rules", "Git commit, as usual"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Log every version on every request: prompt id, model id, embedding model and index build. When quality drops on a Tuesday, you want to answer 'what changed?' with a query, not an archaeology project.",
        },
      },
      {
        heading: "Observability for AI features",
        table: {
          headers: ["Signal", "Why"],
          rows: [
            [
              "Latency p50 and p95, plus time to first token",
              "Users feel the first token; the tail reveals provider trouble",
            ],
            ["Input and output tokens per request", "The direct driver of cost and latency"],
            [
              "Cost per request, per feature and per tenant",
              "Finds the customer or feature consuming the budget",
            ],
            ["Errors by type: 429, timeout, validation failure", "Each has a different fix"],
            [
              "Empty-retrieval and 'I don't know' rates",
              "Early warning that the index or data changed",
            ],
            ["User feedback and escalation rate", "The closest online proxy for answer quality"],
          ],
        },
        code: {
          title: "A trace span around every model call",
          lang: "python",
          source: `from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def traced_generate(system: str, user: str) -> LLMReply:
    with tracer.start_as_current_span("llm.generate") as span:
        span.set_attribute("gen_ai.request.model", settings.llm_model)
        span.set_attribute("app.prompt.version", "support-v3")
        reply = llm.generate(system, user)
        span.set_attribute("gen_ai.usage.input_tokens", reply.input_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", reply.output_tokens)
        return reply`,
        },
        links: [
          {
            label: "OpenTelemetry — semantic conventions for generative AI",
            href: "https://opentelemetry.io/docs/specs/semconv/gen-ai/",
          },
          { label: "Site: observability", href: "/hld/observability" },
        ],
      },
      {
        heading: "Evaluation in production",
        steps: [
          {
            title: "Gate changes in CI",
            text: "Any prompt, model or retrieval change runs the offline evaluation set; the build fails below the threshold.",
          },
          {
            title: "Canary or shadow",
            text: "Send a small share of traffic to the new version, or run it silently alongside the old one and compare.",
          },
          {
            title: "Watch online signals",
            text: "Feedback, escalations, refusal rate, cost and latency — compared against the previous version.",
          },
          {
            title: "Review real traces",
            text: "Sample conversations weekly, especially low-rated and escalated ones.",
          },
          {
            title: "Close the loop",
            text: "Turn each new failure into an evaluation case, so it can never silently regress again.",
            detail:
              "This loop is what separates a demo from a product: the evaluation set grows from production failures rather than from guesses.",
          },
        ],
        links: [
          { label: "Site: AI reliability and GenAIOps", href: "/fde/ai-reliability-genaiops" },
        ],
      },
      {
        heading: "Releasing safely",
        bullets: [
          "Change one behavioural artefact at a time. Swapping the prompt, the model and the index in one release makes a regression impossible to attribute.",
          "Route model versions with a feature flag so rollback is a configuration change measured in seconds, not a redeploy.",
          "Canary by percentage of traffic with automatic comparison of error rate, latency and cost against the baseline.",
          "Keep the previous index build until the new one has proven itself; re-embedding a large corpus is slow to undo.",
        ],
        links: [{ label: "Site: deployment strategies", href: "/hld/deployment-strategies" }],
      },
      {
        heading: "Cost control and scaling",
        math: [
          {
            label: "Daily model spend",
            expr: "50,000 requests × $0.0135",
            result: "$675 / day",
            note: "illustrative per-request cost from chapter 15",
          },
          {
            label: "Answer cache at a 30% hit rate",
            expr: "50,000 × 0.30 × $0.0135",
            result: "$202.50 / day saved",
            note: "only for questions whose answer is safe to reuse",
          },
        ],
        bullets: [
          "Attribute cost per tenant and per feature, and alert on budgets. The expensive customer is rarely the one you would guess.",
          "Cache exact repeated questions safely; semantic caching of similar questions needs care, because similar questions can require different answers.",
          "Scale API containers horizontally — they are stateless. The real concurrency ceiling is usually the provider's rate limit, so put a shared limiter or queue in front of the model calls.",
          "Scale workers on queue depth, and use pooled database connections so autoscaling does not exhaust the database.",
          "Self-hosting open models (with an inference server that batches requests) makes sense at high, steady volume or under strict data-residency rules; below that, hosted APIs are usually cheaper once engineering time is counted.",
        ],
        links: [
          { label: "Site: scaling from zero to millions", href: "/examples/scale-to-millions" },
          {
            label: "YouTube search — LLMOps production monitoring evaluation",
            href: YT("LLMOps production monitoring evaluation cost"),
          },
        ],
        followUps: [
          {
            q: "What would you monitor for an LLM feature?",
            a: "Latency including time to first token, tokens and cost per request broken down by feature and tenant, errors by type, and quality proxies: user feedback, escalations, refusal and empty-retrieval rates. Every request carries the prompt, model and index versions, so any shift in those metrics can be tied to a change.",
          },
          {
            q: "How do you roll out a new prompt safely?",
            a: "It goes through the offline evaluation gate first, then ships behind a flag to a small share of traffic, where I compare quality proxies, cost and latency with the current version. If it holds, I ramp up; if not, flipping the flag rolls it back instantly. And I change only the prompt in that release.",
          },
          {
            q: "Would you self-host a model or use an API?",
            a: "Start with an API: no GPU operations, the newest models, and pay-per-use while volume is uncertain. Self-hosting becomes worth it with high and steady volume where GPU utilisation stays high, strict data-residency or privacy requirements, or a smaller fine-tuned model that is good enough for the task. The comparison must include engineering and on-call cost, not just per-token price.",
          },
        ],
      },
    ],
    related: [
      "/python/fastapi",
      "/python/testing",
      "/java/docker",
      "/fde/production-ai-engineering",
    ],
    furtherReading: [
      {
        label: "uv — Docker integration guide",
        href: "https://docs.astral.sh/uv/guides/integration/docker/",
      },
      {
        label: "OpenTelemetry — generative AI semantic conventions",
        href: "https://opentelemetry.io/docs/specs/semconv/gen-ai/",
      },
    ],
  },
];
