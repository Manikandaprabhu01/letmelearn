import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeFoundation: Concept[] = [
  {
    slug: "software-engineering-foundation",
    title: "Software Engineering Foundation",
    subtitle:
      "Python, OOP, Git/GitHub, Linux, SQL, REST APIs, FastAPI, databases, testing, debugging",
    level: "foundational",
    minutes: 40,
    tags: ["python", "oop", "git", "linux", "sql", "rest", "fastapi", "testing", "debugging"],
    summary:
      "Step 1 is the part people skip because it is not about AI, and it is the part that decides whether anything you build survives contact with a customer. An FDE writes code in someone else's environment, on someone else's network, under time pressure. Every concept below is broken out on its own: what it is, why an FDE specifically needs it, a worked example, and where to go deeper.",
    keyPoints: [
      "Python is the lingua franca, but the skill that matters is writing code other people can run.",
      "OOP earns its place when you need to swap an LLM provider without rewriting the codebase.",
      "SQL is not legacy knowledge — enterprise context lives in relational databases.",
      "Debugging is the highest-leverage FDE skill: you inherit failures you cannot reproduce locally.",
    ],
    prerequisites: [],
    sections: [
      {
        heading: "1. Python",
        lede: "The language of AI work — and the difference between a script and software.",
        body: [
          "Python is where every AI SDK, framework and example lives, so fluency is assumed rather than impressive. What separates an FDE is writing Python that runs somewhere other than the machine it was written on: typed, packaged, with pinned dependencies and configuration injected rather than hardcoded.",
        ],
        code: {
          title: "Example — the same task, notebook-grade versus deployable",
          lang: "python",
          source: `# NOTEBOOK-GRADE — works for you, fails for everyone else
import openai
openai.api_key = "sk-proj-abc123"        # secret in the file
def summarize(text):
    r = openai.chat.completions.create(model="gpt-4",
        messages=[{"role": "user", "content": text}])
    return r.choices[0].message.content  # no timeout, no error handling

# DEPLOYABLE — config injected, failures explicit, testable without a network
from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    model: str
    timeout_s: float = 30.0

class Summarizer:
    def __init__(self, client, config: Config) -> None:
        self._client, self._config = client, config   # injected → swappable in tests

    def summarize(self, text: str) -> str:
        if not text.strip():
            raise ValueError("empty text")
        resp = self._client.messages.create(
            model=self._config.model, max_tokens=1024,
            timeout=self._config.timeout_s,
            messages=[{"role": "user", "content": text}],
        )
        return resp.content[0].text`,
        },
        bullets: [
          "Pin dependencies with a lockfile (uv, Poetry, pip-tools). 'It worked last week' is almost always an unpinned transitive dependency.",
          "Type hints are documentation the interpreter checks — the cheapest knowledge transfer to the customer's team who inherit your code.",
          "Never commit a secret. Rotating a leaked customer credential is a week-one conversation you do not want.",
        ],
        links: [
          {
            label: "Corey Schafer — Python tutorials (the gold-standard series)",
            href: "https://www.youtube.com/@coreyms",
          },
          {
            label: "ArjanCodes — writing professional, maintainable Python",
            href: "https://www.youtube.com/@ArjanCodes",
          },
          {
            label: "YouTube search — Python type hints and dependency management",
            href: YT("python type hints uv dependency management tutorial"),
          },
        ],
      },
      {
        heading: "2. OOP (object-oriented programming)",
        lede: "Not for its own sake — for the one thing FDEs do constantly: swapping implementations.",
        body: [
          "Enterprise AI work involves substitution: the customer mandates Azure OpenAI instead of the provider you prototyped against, or Bedrock, or a self-hosted model. If provider calls are scattered through the codebase, that is a rewrite. Behind an interface, it is one new class. This is the practical argument for OOP in AI work, and it is more convincing than any textbook example.",
        ],
        code: {
          title: "Example — an interface that makes the provider swappable",
          lang: "python",
          source: `from typing import Protocol

class LLMProvider(Protocol):
    """The contract. Application code depends on THIS, never on a vendor SDK."""
    def complete(self, prompt: str, *, max_tokens: int) -> str: ...

class AnthropicProvider:
    def __init__(self, client): self._client = client
    def complete(self, prompt: str, *, max_tokens: int) -> str:
        r = self._client.messages.create(model="claude-sonnet-5",
            max_tokens=max_tokens, messages=[{"role": "user", "content": prompt}])
        return r.content[0].text

class AzureOpenAIProvider:                      # the customer mandates Azure
    def __init__(self, client): self._client = client
    def complete(self, prompt: str, *, max_tokens: int) -> str:
        r = self._client.chat.completions.create(model="gpt-4o",
            max_tokens=max_tokens, messages=[{"role": "user", "content": prompt}])
        return r.choices[0].message.content

class FakeProvider:                             # tests run with no network at all
    def complete(self, prompt: str, *, max_tokens: int) -> str:
        return "canned response"

# Application code never changes when the provider does:
def summarize(provider: LLMProvider, text: str) -> str:
    return provider.complete(f"Summarize: {text}", max_tokens=512)`,
        },
        bullets: [
          "Favour composition and small interfaces over deep inheritance hierarchies — you are isolating a dependency, not modelling a taxonomy.",
          "The test double is the giveaway that the design is right: if you cannot fake it, your code is welded to a vendor.",
          "Wrap vendor exceptions into your own error types, so switching providers does not ripple through every caller.",
        ],
        links: [
          {
            label: "Corey Schafer — OOP in Python series",
            href: "https://www.youtube.com/@coreyms",
          },
          {
            label: "ArjanCodes — SOLID, composition and dependency injection",
            href: "https://www.youtube.com/@ArjanCodes",
          },
          { label: "Site: SOLID principles, worked through", href: "/lld/solid" },
        ],
      },
      {
        heading: "3. Git and GitHub",
        lede: "You will hand work to the customer's team mid-engagement. History is the handover.",
        body: [
          "An FDE's git history is read by people who were not there. Small, well-described commits are how a customer's engineers pick up what you built after you rotate off. The mechanics that matter are unglamorous: branching, rebasing cleanly, resolving conflicts rather than discarding them, and never committing a secret.",
        ],
        code: {
          title: "Example — the commands that matter on a live engagement",
          lang: "bash",
          source: `# Review what you are about to hand over — ALWAYS before pushing
git status                      # anything unexpected staged?
git diff --cached               # read the actual diff, not just filenames

# A secret slipped into a commit that is not yet pushed
git reset --soft HEAD~1         # undo the commit, keep the changes staged
# ...remove the secret, then recommit. If it was ALREADY pushed: rotate the
# credential immediately. Rewriting history does not un-leak it.

# Find when a behaviour broke, without guessing
git log --oneline -- src/data/pipeline.py    # history for one file
git bisect start && git bisect bad && git bisect good v1.2.0

# Who wrote this, and why — the question you ask in someone else's codebase
git log -p -S "retry_with_backoff"    # every commit touching that string`,
        },
        bullets: [
          "Write commit messages for the customer's engineer in six months, not for yourself today: what changed and why, never just 'fix'.",
          "Prefer resolving a merge conflict to discarding one side. Discarded work in a customer repo is a trust problem, not just a code problem.",
          "Never force-push a shared branch on a customer's repository without saying so first.",
        ],
        links: [
          {
            label: "Corey Schafer — Git and GitHub tutorials",
            href: "https://www.youtube.com/@coreyms",
          },
          { label: "Official Pro Git book (free)", href: "https://git-scm.com/book/en/v2" },
          {
            label: "YouTube search — git rebase, bisect and conflict resolution",
            href: YT("git rebase bisect merge conflict tutorial"),
          },
        ],
      },
      {
        heading: "4. Linux",
        lede: "Your code runs on Linux, in a container, on their infrastructure — usually without a debugger.",
        body: [
          "The FDE-specific Linux skill is diagnosis at a distance. You often cannot attach a debugger to a customer's production pod, so the ability to read logs, inspect processes, test network reachability and check resource state from a shell is what stands between you and guessing.",
        ],
        code: {
          title: "Example — diagnosing 'it works locally but not here'",
          lang: "bash",
          source: `# 1. Is the service even reachable from inside their network?
curl -v https://api.anthropic.com/v1/messages   # TLS? DNS? proxy? 403 from egress rules?
dig api.anthropic.com                            # DNS resolving at all?

# 2. Why did the container die? (the answer is usually memory)
kubectl describe pod my-svc-7d4b | grep -A3 "Last State"
#   Reason: OOMKilled        ← not a code bug; the memory limit is too low
kubectl logs my-svc-7d4b --previous              # logs from BEFORE the restart

# 3. What is actually consuming resources?
top -o %MEM                                      # memory-heavy is normal for AI services
df -h                                            # a full disk presents as weird I/O errors

# 4. Is it the proxy? Enterprise networks almost always have one.
env | grep -i proxy                              # HTTPS_PROXY / NO_PROXY set correctly?`,
        },
        bullets: [
          "'OOMKilled' is the single most common mystery failure for AI service containers — model clients and document parsing are memory-hungry.",
          "Corporate proxies and egress allow-lists break outbound model calls constantly. Check them in week one, not on launch day.",
          "Structured JSON logs with a request id are what make remote diagnosis possible; print statements vanish into a cluster.",
        ],
        links: [
          {
            label: "TechWorld with Nana — Linux and DevOps fundamentals",
            href: "https://www.youtube.com/@TechWorldwithNana",
          },
          {
            label: "YouTube search — Linux troubleshooting for developers",
            href: YT("linux command line troubleshooting for developers tutorial"),
          },
        ],
      },
      {
        heading: "5. SQL",
        lede: "Enterprise context lives in relational databases — retrieval is often a join, not a vector search.",
        body: [
          "There is a persistent assumption that AI work means vector databases. In practice the customer's valuable context — entitlements, customers, orders, tickets — sits in PostgreSQL, SQL Server or Oracle. Questions like 'the last five open tickets for this account' are answered exactly by SQL and only approximately by semantic search.",
        ],
        code: {
          title: "Example — the query an AI support feature actually depends on",
          lang: "sql",
          source: `-- Grounding context for a support assistant. Semantic search cannot reliably
-- answer "the last five" or "still open"; SQL can, exactly and cheaply.
SELECT t.id, t.subject, t.status, t.created_at, c.name, c.tier
  FROM tickets t
  JOIN customers c ON c.id = t.customer_id
 WHERE t.customer_id = $1                  -- parameterised, NEVER string-formatted
   AND t.created_at > now() - interval '90 days'
   AND t.status <> 'spam'
 ORDER BY t.created_at DESC
 LIMIT 5;

-- The index that makes it fast. Without it the planner scans the table, and
-- your "AI latency problem" is actually a missing index.
CREATE INDEX CONCURRENTLY idx_tickets_customer_created
    ON tickets (customer_id, created_at DESC) WHERE status <> 'spam';

-- Read the plan before blaming the model:
EXPLAIN ANALYZE SELECT ...;   -- "Seq Scan" on a large table = you found the bug`,
        },
        bullets: [
          "Parameterised queries are mandatory, and doubly so when an LLM is involved in generating them.",
          "Text-to-SQL needs a leash: read-only connection, row limit, statement timeout, table allow-list, and a plan check before execution.",
          "Never run a heavy analytical aggregation against the customer's production transactional database — it is a fast way to lose trust.",
        ],
        links: [
          {
            label: "Use the Index, Luke — indexing and query performance",
            href: "https://use-the-index-luke.com/",
          },
          {
            label: "YouTube search — SQL joins, indexes and EXPLAIN",
            href: YT("SQL joins indexes EXPLAIN query plan tutorial"),
          },
          { label: "Site: SQL vs NoSQL, and when each wins", href: "/hld/sql-vs-nosql" },
        ],
      },
      {
        heading: "6. REST APIs",
        lede: "How your model capability becomes something the customer's systems can call.",
        body: [
          "A model behind a well-designed endpoint is a product; a model in a notebook is a screenshot. REST is the contract the customer's existing systems already know how to consume, and designing it well is what lets their developers integrate without understanding anything about AI.",
        ],
        table: {
          caption: "Status codes an AI endpoint actually needs — each tells the caller what to do.",
          headers: ["Code", "Meaning here", "Client should"],
          rows: [
            ["400", "Input failed validation", "Fix the request; do not retry"],
            ["401 / 403", "Auth or entitlement problem", "Re-authenticate; do not retry blindly"],
            ["422", "Model output unusable after retries", "Surface it; a retry may help"],
            ["429", "Rate or token budget exceeded", "Back off using Retry-After"],
            [
              "502",
              "Upstream model provider failed",
              "Retry with backoff — not the customer's fault",
            ],
            ["504", "Generation exceeded the deadline", "Retry, or submit a smaller job"],
          ],
        },
        bullets: [
          "Return the model name and token usage in every response. When a customer says 'it got worse yesterday', that field is often the whole investigation.",
          "Distinguish 502 from 500 deliberately: it tells the customer's on-call team whether to page you or the model provider.",
          "Version the API from the first release. You will change the response shape, and their integration will already be live.",
        ],
        links: [
          {
            label: "YouTube search — REST API design best practices",
            href: YT("REST API design best practices status codes versioning"),
          },
          { label: "Site: API gateway patterns", href: "/hld/api-gateway" },
        ],
      },
      {
        heading: "7. FastAPI",
        lede: "The Python framework that fits AI work: async by default, validation at the boundary.",
        body: [
          "FastAPI matters here for two specific reasons. Model calls block for seconds, so native async support prevents a worker pool saturating immediately. And Pydantic validation at the boundary means malformed input fails fast and free, before you pay for a model call.",
        ],
        code: {
          title: "Example — a production-shaped endpoint, annotated",
          lang: "python",
          source: `from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel, Field

app = FastAPI()

class SummarizeRequest(BaseModel):
    # Validation at the BOUNDARY — bad input never reaches your logic or your bill
    text: str = Field(min_length=1, max_length=100_000)
    style: str = Field(default="concise", pattern="^(concise|detailed|bullets)$")

class SummarizeResponse(BaseModel):
    summary: str
    tokens_used: int
    model: str                   # echo what served it — vital for debugging later

@app.post("/v1/summarize", response_model=SummarizeResponse)
async def summarize(                       # async: a 5s model call must not block
    body: SummarizeRequest,
    idempotency_key: str | None = Header(default=None),
    svc: Summarizer = Depends(get_summarizer),     # DI → testable
) -> SummarizeResponse:
    # Idempotency matters more for AI than for CRUD: calls are slow and costly,
    # so clients time out and retry — and a retry must not bill twice.
    if idempotency_key and (hit := await cache.get(idempotency_key)):
        return hit
    try:
        result = await svc.summarize(body.text, style=body.style)
    except SummarizationFailed as exc:
        raise HTTPException(status_code=502, detail="model provider error") from exc
    if idempotency_key:
        await cache.set(idempotency_key, result, ttl=3600)
    return result`,
        },
        bullets: [
          "Use dependency injection (Depends) for clients and config — it is what makes the endpoint testable without a network.",
          "Stream responses where the interface allows it: time-to-first-token is what users perceive, not total latency.",
          "Raise the server and proxy timeouts deliberately. Defaults of 30–60s will cut off long generations mid-flight.",
        ],
        links: [
          {
            label: "FastAPI — official documentation and tutorial",
            href: "https://fastapi.tiangolo.com/",
          },
          {
            label: "freeCodeCamp — full FastAPI courses",
            href: "https://www.youtube.com/@freecodecamp",
          },
          {
            label: "Tech With Tim — FastAPI walkthroughs",
            href: "https://www.youtube.com/@TechWithTim",
          },
        ],
      },
      {
        heading: "8. Databases",
        lede: "Knowing which store to reach for — and which one the customer already runs.",
        table: {
          caption: "The stores an AI deployment typically touches, and what each is for.",
          headers: ["Store", "Used for", "FDE watch-out"],
          rows: [
            [
              "PostgreSQL / SQL Server",
              "Entitlements, records, transactional state",
              "Usually the system of record — do not overload it",
            ],
            [
              "Redis",
              "Cache, sessions, rate limits, queues",
              "Volatile by design; never the source of truth",
            ],
            [
              "Vector DB (pgvector, Pinecone)",
              "Semantic retrieval",
              "Changing embedding model = re-embed everything",
            ],
            [
              "Object storage (S3)",
              "Documents, artefacts, raw files",
              "Where the customer's PDFs actually live",
            ],
            [
              "OLAP (Snowflake, BigQuery)",
              "Analytics, usage reporting",
              "Where the business-impact numbers come from",
            ],
          ],
        },
        bullets: [
          "pgvector is frequently the right first answer: the customer already runs PostgreSQL, and one fewer system to procure is often worth more than marginal performance.",
          "Transactional and analytical workloads must be separated — an AI feature querying the production OLTP database at volume will be noticed.",
          "Know where the customer's documents physically live before promising a RAG timeline. It is rarely one place.",
        ],
        links: [
          {
            label: "YouTube search — database internals and indexing explained",
            href: YT("database indexing b-tree internals explained"),
          },
          { label: "Site: replication, sharding and consistency", href: "/hld/replication" },
        ],
      },
      {
        heading: "9. Testing",
        lede: "Deterministic code gets normal tests; the model gets evals (step 5). Know which is which.",
        body: [
          "The mistake is treating an AI system as untestable because the model is non-deterministic. Most of the system is ordinary code — parsing, routing, permissions, retries, formatting — and all of it is testable in the usual way. Only the model's output quality needs the eval machinery from step 5.",
        ],
        code: {
          title: "Example — test the deterministic parts properly, fake the model",
          lang: "python",
          source: `import pytest

class FakeProvider:
    """No network, no cost, no flakiness — and you control the edge cases."""
    def __init__(self, response: str): self._response = response
    def complete(self, prompt: str, *, max_tokens: int) -> str: return self._response

def test_rejects_empty_input():
    svc = Summarizer(FakeProvider("x"), Config(model="m"))
    with pytest.raises(ValueError):
        svc.summarize("   ")                    # deterministic — assert exactly

def test_wraps_provider_failure():
    class Boom:
        def complete(self, *a, **k): raise APIStatusError(status_code=503)
    svc = Summarizer(Boom(), Config(model="m"))
    with pytest.raises(SummarizationFailed):    # vendor error → domain error
        svc.summarize("hello")

def test_low_confidence_routes_to_review():
    # The BUSINESS RULE is deterministic even though the model is not.
    result = route(Extraction(confidence="low"))
    assert result.destination == "human_review"`,
        },
        bullets: [
          "Fake the model in unit tests. Tests that call a real provider are slow, flaky, costly, and fail when you are offline on a customer site.",
          "Test the failure paths hardest: timeouts, 429s, malformed model output, partial results. Those are what actually happen in production.",
          "Keep eval suites separate from unit tests — different cadence, different pass criteria, different meaning of failure.",
        ],
        links: [
          {
            label: "YouTube search — pytest fixtures, mocking and test design",
            href: YT("pytest tutorial fixtures mocking best practices"),
          },
          { label: "Site: evals for AI systems (step 5)", href: "/fde/ai-reliability-genaiops" },
        ],
      },
      {
        heading: "10. Debugging",
        lede: "The highest-leverage FDE skill: diagnosing a failure you cannot reproduce.",
        body: [
          "A normal engineer debugs in an environment they control. An FDE is handed a failure inside a bank's VPC, on a Python version they did not choose, with logs they must request. The discipline is to design the system so the logs alone can answer what happened, because often that is all you will be given.",
        ],
        code: {
          title: "Example — correlation ids make a multi-step failure reconstructable",
          lang: "python",
          source: `import structlog, uuid
log = structlog.get_logger()

async def handle(request):
    # ONE id, generated at the boundary, attached to every downstream step.
    trace_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    logger = log.bind(trace_id=trace_id, user_id=request.user.id)

    logger.info("retrieval.start", query=request.query)
    chunks = await retrieve(request.query, logger=logger)
    # Log the DECISION INPUTS, not just the outcome — chunk ids and scores are
    # what let you answer "why did it say that?" a week later.
    logger.info("retrieval.done", chunk_ids=[c.id for c in chunks],
                scores=[round(c.score, 3) for c in chunks])

    answer = await generate(request.query, chunks, logger=logger)
    logger.info("generation.done", model=MODEL, prompt_version=PROMPT_VERSION,
                tokens=answer.usage.total, cost_usd=answer.cost)
    return answer

# Without trace_id, "this one request went wrong" is unanswerable in a system
# handling thousands of concurrent multi-step requests.`,
        },
        bullets: [
          "Log the inputs to decisions, not just the results. 'Returned 5 chunks' is useless; 'returned chunks 44, 91, 12 with scores 0.81, 0.62, 0.60' is a diagnosis.",
          "Record the prompt version and model with every request — the two most common causes of 'it changed' are a prompt edit and a provider default change.",
          "Assume no debugger access and design for it. This discipline pays the first time production access is refused.",
        ],
        links: [
          {
            label: "YouTube search — structured logging and observability in Python",
            href: YT("structured logging python observability tracing tutorial"),
          },
          {
            label: "Site: observability and tracing for AI systems",
            href: "/fde/ai-reliability-genaiops",
          },
        ],
      },
    ],
    related: ["/fde/ai-ml-fundamentals", "/fde/ai-engineering", "/hld/api-gateway", "/lld/solid"],
    furtherReading: [
      { label: "FastAPI — official documentation", href: "https://fastapi.tiangolo.com/" },
      { label: "Pro Git — the free official book", href: "https://git-scm.com/book/en/v2" },
      {
        label: "Corey Schafer — Python, Git and SQL tutorials",
        href: "https://www.youtube.com/@coreyms",
      },
      {
        label: "freeCodeCamp — full-length engineering courses",
        href: "https://www.youtube.com/@freecodecamp",
      },
    ],
  },
];
