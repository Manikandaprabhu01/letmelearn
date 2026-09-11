import type { Concept } from "@/data/types";

export const fdeFoundation: Concept[] = [
  {
    slug: "software-engineering-foundation",
    title: "Software Engineering Foundation",
    subtitle: "Python, OOP, Git, Linux, SQL, REST APIs, FastAPI, databases, testing, debugging",
    level: "foundational",
    minutes: 26,
    tags: ["python", "sql", "fastapi", "git", "linux", "testing"],
    summary:
      "Step 1 is the part people skip because it is not about AI, and it is the part that decides whether anything you build survives contact with a customer. An FDE writes code in someone else's environment, on someone else's network, under time pressure — so the ability to read a stack trace, write a clean API, reason about a query plan and use git without fear is not preparation for the job, it is the job. Everything in steps 2 to 8 is built on this layer.",
    keyPoints: [
      "Python is the lingua franca of AI work, but the skill that matters is writing code other people can run: typed, packaged, tested, with pinned dependencies.",
      "REST API design is how your AI capability becomes something the customer's systems can actually call.",
      "SQL is not legacy knowledge — enterprise context lives in relational databases, and RAG over an enterprise means joining to them.",
      "Debugging is the highest-leverage FDE skill: you will be handed failures in an environment you cannot reproduce locally.",
    ],
    prerequisites: [],
    sections: [
      {
        heading: "Why this layer decides your ceiling",
        lede: "The failure mode is an impressive prototype nobody can deploy.",
        body: [
          "The common path into AI engineering is a notebook that produces a striking demo. The common failure is that the notebook cannot be handed to anyone. It has unpinned dependencies, hardcoded keys, no error handling, no tests, and a dozen assumptions about the local machine. An FDE is measured on what runs in the customer's environment, so the gap between 'it works for me' and 'it works for them' is the gap this step closes.",
        ],
        diagram: {
          kind: "compare",
          caption: "Both produce output. Only one can be deployed by someone who is not you.",
          options: [
            {
              title: "Notebook-grade code",
              sub: "the demo that cannot travel",
              good: ["Fast to write", "Great for exploration and one-off analysis"],
              bad: [
                "Hidden state — cell order changes the result",
                "Unpinned dependencies, so it breaks on another machine",
                "No tests, so a change silently breaks something else",
                "Secrets in the file; no configuration boundary",
              ],
              verdict: "Right for exploration, wrong for anything a customer touches.",
            },
            {
              title: "Deployable code",
              sub: "a service someone else can run",
              tone: "ok",
              good: [
                "Pinned dependencies and a reproducible environment",
                "Configuration and secrets injected, never committed",
                "Typed interfaces and tests that state expected behaviour",
                "Structured logs so failures are diagnosable remotely",
              ],
              bad: ["Slower to write initially", "Requires discipline when the demo already works"],
              verdict: "The only form that survives handover.",
            },
          ],
        },
        callout: {
          kind: "insight",
          title: "The FDE-specific reason this matters",
          text: "A normal engineer debugs in an environment they control. An FDE debugs in a bank's VPC, behind a proxy they cannot inspect, on a Python version they did not choose, with logs they must request. Every foundational habit — pinned versions, structured logging, defensive configuration — exists to make that situation survivable.",
        },
      },
      {
        heading: "Python that other people can run",
        lede: "Type hints, packaging and dependency pinning are the difference between a script and software.",
        code: {
          title: "The same function, before and after",
          lang: "python",
          source: `# BEFORE — works on your laptop, fails everywhere else
import openai
openai.api_key = "sk-proj-abc123"          # secret committed to git

def summarize(text):
    r = openai.chat.completions.create(
        model="gpt-4",                      # hardcoded, no fallback
        messages=[{"role": "user", "content": text}],
    )
    return r.choices[0].message.content     # no error handling, no timeout


# AFTER — configuration injected, failures explicit, behaviour testable
from dataclasses import dataclass
from anthropic import Anthropic, APIStatusError

@dataclass(frozen=True)
class SummarizerConfig:
    model: str
    max_tokens: int = 1024
    timeout_s: float = 30.0

class Summarizer:
    def __init__(self, client: Anthropic, config: SummarizerConfig) -> None:
        # The client is INJECTED, so tests can pass a fake and never hit the network.
        self._client = client
        self._config = config

    def summarize(self, text: str) -> str:
        if not text.strip():
            raise ValueError("cannot summarize empty text")
        try:
            response = self._client.messages.create(
                model=self._config.model,
                max_tokens=self._config.max_tokens,
                timeout=self._config.timeout_s,
                messages=[{"role": "user", "content": f"Summarize:\\n\\n{text}"}],
            )
        except APIStatusError as exc:
            # Translate a vendor error into YOUR domain error, so callers do not
            # have to know which provider you happen to be using this month.
            raise SummarizationFailed(status=exc.status_code) from exc
        return response.content[0].text`,
        },
        bullets: [
          "Dependency injection is the single highest-value pattern here: passing the client in rather than constructing it inside makes the class testable without a network, and swappable when the customer mandates Azure OpenAI instead of the vendor you prototyped against.",
          "Pin dependencies with a lockfile (uv, Poetry or pip-tools). 'It worked last week' is almost always an unpinned transitive dependency that released a new version.",
          "Type hints are documentation the interpreter can check. In a codebase a customer's team will inherit, they are the cheapest form of knowledge transfer you can write.",
          "Never let a vendor exception escape your module. Wrapping it means switching providers is a one-file change rather than a search across the codebase.",
        ],
      },
      {
        heading: "REST APIs and FastAPI: how your model becomes callable",
        lede: "A model behind a well-designed endpoint is a product; a model in a notebook is a screenshot.",
        code: {
          title: "A production-shaped endpoint, annotated",
          lang: "python",
          source: `from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel, Field

app = FastAPI()

class SummarizeRequest(BaseModel):
    # Pydantic validates at the BOUNDARY, so bad input never reaches your logic.
    text: str = Field(min_length=1, max_length=100_000)
    style: str = Field(default="concise", pattern="^(concise|detailed|bullets)$")

class SummarizeResponse(BaseModel):
    summary: str
    tokens_used: int
    model: str            # echo what actually served the request — vital for debugging

@app.post("/v1/summarize", response_model=SummarizeResponse)
async def summarize(
    body: SummarizeRequest,
    idempotency_key: str | None = Header(default=None),
    svc: Summarizer = Depends(get_summarizer),
) -> SummarizeResponse:
    # Idempotency matters more for AI than for CRUD: calls are slow and expensive,
    # so clients retry, and a retry must not mean a second paid generation.
    if idempotency_key and (cached := await cache.get(idempotency_key)):
        return cached

    try:
        result = await svc.summarize(body.text, style=body.style)
    except SummarizationFailed as exc:
        # 502 not 500: the failure is upstream, and the distinction tells the
        # customer's ops team whether to page you or the model provider.
        raise HTTPException(status_code=502, detail="model provider error") from exc

    if idempotency_key:
        await cache.set(idempotency_key, result, ttl=3600)
    return result`,
        },
        table: {
          caption: "Status codes an AI endpoint actually needs, and what each tells the caller.",
          headers: ["Code", "Meaning here", "Client should"],
          rows: [
            ["400", "Input failed validation", "Fix the request; do not retry"],
            ["401 / 403", "Auth or entitlement problem", "Re-authenticate; do not retry blindly"],
            [
              "422",
              "Model produced unusable output after retries",
              "Log and surface; retry may help",
            ],
            ["429", "Rate or token budget exceeded", "Back off using Retry-After"],
            [
              "502",
              "Upstream model provider failed",
              "Retry with backoff — not the customer's fault",
            ],
            ["504", "Generation exceeded the deadline", "Retry, or request a smaller job"],
          ],
        },
        bullets: [
          "Validate at the boundary with Pydantic so malformed input fails fast and cheaply rather than after a paid model call.",
          "Return the model name and token usage in every response. When a customer reports 'it got worse yesterday', that field is often the entire investigation.",
          "Async matters here more than in ordinary web work: a model call blocks for seconds, so a synchronous worker pool saturates almost immediately.",
          "Design for idempotency from day one. AI calls are slow, clients time out and retry, and without an idempotency key the customer pays twice for one answer.",
        ],
      },
      {
        heading: "SQL and databases: where the enterprise context actually lives",
        lede: "Retrieval over an enterprise is usually a join, not a vector search.",
        body: [
          "There is a persistent assumption that AI work means vector databases. In practice, the customer's valuable context — entitlements, customers, orders, tickets, policies — sits in PostgreSQL, SQL Server or Oracle, and the best retrieval strategy is frequently a parameterised query rather than an embedding lookup. An FDE who cannot read a schema or an execution plan will reach for a vector index where a WHERE clause was the right answer.",
        ],
        code: {
          title: "The query the AI feature actually depends on",
          lang: "sql",
          source: `-- A support agent needs THIS customer's recent tickets as grounding context.
-- Semantic search cannot answer "the last five" or "still open" reliably;
-- SQL can, exactly, and far more cheaply.
SELECT t.id, t.subject, t.status, t.created_at,
       c.name AS customer_name, c.tier
  FROM tickets t
  JOIN customers c ON c.id = t.customer_id
 WHERE t.customer_id = $1                 -- parameterised: never string-format SQL
   AND t.created_at > now() - interval '90 days'
   AND t.status <> 'spam'
 ORDER BY t.created_at DESC
 LIMIT 5;

-- The index that makes it fast. Without this, the planner scans the table and
-- your "AI latency problem" is actually a missing index.
CREATE INDEX CONCURRENTLY idx_tickets_customer_created
    ON tickets (customer_id, created_at DESC)
 WHERE status <> 'spam';`,
        },
        bullets: [
          "Parameterised queries are not optional. String-formatting user input into SQL is an injection vulnerability, and an LLM generating SQL makes this dramatically more dangerous rather than less.",
          "Learn to read EXPLAIN. A large share of 'the AI feature is slow' turns out to be an unindexed query in the retrieval step, not model latency.",
          "Know the difference between transactional and analytical stores. Running a heavy aggregation against the customer's production OLTP database is a fast way to lose trust.",
          "Structured filters plus semantic search beats either alone — this is the hybrid retrieval idea that step 3 builds on directly.",
        ],
        callout: {
          kind: "warn",
          title: "Text-to-SQL needs a leash",
          text: "Letting a model generate SQL against a production database is one of the most common and most dangerous patterns in enterprise AI. At minimum: a read-only connection, a row limit, a statement timeout, an allow-list of tables, and a query plan check before execution. The model should never hold credentials that can write.",
        },
      },
      {
        heading: "Git, Linux and debugging in someone else's environment",
        lede: "The skills that only look basic until you are on a customer's VPN at 6pm.",
        table: {
          caption: "What you will actually need on a deployment day.",
          headers: ["Skill", "The FDE situation", "Command or habit"],
          rows: [
            [
              "Reading logs",
              "Something fails only in their environment",
              "journalctl -u svc, kubectl logs --previous",
            ],
            [
              "Network diagnosis",
              "The model endpoint is unreachable from their VPC",
              "curl -v, dig, traceroute, check egress rules",
            ],
            [
              "Process and resource state",
              "The container is being killed and nobody knows why",
              "dmesg, OOMKilled in kubectl describe",
            ],
            [
              "Git hygiene",
              "Handing work to their team mid-engagement",
              "Small commits, clear messages, no secrets in history",
            ],
            [
              "Environment parity",
              "Works locally, fails there",
              "Same base image, pinned deps, no local-only assumptions",
            ],
          ],
        },
        bullets: [
          "Structured logging (JSON, with a request id) is what makes remote debugging possible. Print statements are invisible once the code is running in a customer's cluster.",
          "Propagate a correlation id from the API boundary through every model call and tool call. Without it, 'this one request went wrong' is unanswerable in a multi-step agent.",
          "Assume you cannot attach a debugger. Design the system so the logs alone can answer what happened — this discipline pays for itself the first time you are denied production access.",
          "Never commit a secret, even to a private repo. Rotating a leaked customer credential is an incident conversation you do not want to have in week one.",
        ],
      },
    ],
    related: [
      "/fde/ai-ml-fundamentals",
      "/fde/ai-engineering",
      "/hld/api-gateway",
      "/lld/repository",
    ],
    furtherReading: [
      { label: "FastAPI — official documentation", href: "https://fastapi.tiangolo.com/" },
      {
        label: "Use the Index, Luke — SQL indexing and performance",
        href: "https://use-the-index-luke.com/",
      },
    ],
  },
];
