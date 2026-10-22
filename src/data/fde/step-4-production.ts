import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeProduction: Concept[] = [
  {
    slug: "production-ai-engineering",
    title: "Production AI Engineering",
    subtitle:
      "Docker, CI/CD, cloud, Kubernetes, caching, async, scalability, load balancing, LLM gateways, cost & token optimization",
    level: "intermediate",
    minutes: 46,
    tags: [
      "docker",
      "ci/cd",
      "cloud",
      "kubernetes",
      "caching",
      "async",
      "load balancing",
      "llm gateway",
      "cost",
    ],
    summary:
      "AI workloads break the assumptions ordinary web infrastructure is built on: requests take seconds, cost real money, fail at a provider you do not control, and are limited by tokens rather than requests. Each of the ten concepts below is broken out for that context — with the customer's cloud, not yours, as the deployment target.",
    keyPoints: [
      "Seconds-long requests make async and queues structural, not an optimisation.",
      "Caching is the highest-ROI lever: exact, semantic and prompt-prefix caches attack different costs.",
      "An LLM gateway centralises routing, failover, budgets and keys — or every service reinvents them badly.",
      "Cost is a first-class design constraint because agentic workloads issue 10–20 calls per task.",
    ],
    prerequisites: ["/fde/ai-engineering"],
    sections: [
      {
        heading: "0. Why AI breaks normal infrastructure assumptions",
        lede: "Every default in a standard web stack is wrong here by an order of magnitude.",
        table: {
          caption: "The assumptions that stop holding.",
          headers: ["Assumption", "Normal web", "AI workload", "What breaks"],
          rows: [
            ["Request duration", "10–100 ms", "2–60 s", "Thread pools, timeouts, LB defaults"],
            [
              "Marginal cost",
              "≈ 0",
              "$0.001–$1 per call",
              "Retries get expensive; loops become invoices",
            ],
            ["Failure source", "Your code", "An upstream provider", "You can only route around it"],
            [
              "Rate limits",
              "Requests per second",
              "Tokens per minute",
              "A few long requests exhaust the budget",
            ],
            [
              "Output",
              "Deterministic",
              "Varies per run",
              "Caching and testing both need rethinking",
            ],
            ["Capacity", "Add replicas", "Provider quota", "Scaling out does not help"],
          ],
        },
        callout: {
          kind: "warn",
          title: "The default that causes the first outage",
          text: "Most load balancers and ingress controllers default to a 30–60 second timeout. A long generation exceeds it, the client retries, the original call keeps running and is still billed, and load doubles under exactly the conditions causing the slowness. Raise timeouts deliberately, stream where you can, and make retries idempotent.",
        },
        links: [{ label: "Site: rate limiting patterns", href: "/hld/rate-limiting" }],
      },
      {
        heading: "1. Docker",
        lede: "The unit of deployment — and what a customer's security team will scan.",
        code: {
          title: "Example — a Dockerfile that passes enterprise review",
          lang: "dockerfile",
          source: `# Pin by DIGEST, not a floating tag. "python:3.12" changes underneath you.
FROM python:3.12-slim@sha256:a1b2c3...

# Non-root: the first thing a security scan checks
RUN useradd --create-home --uid 10001 appuser

WORKDIR /app

# Dependencies as a SEPARATE layer — code changes do not reinstall the world
COPY requirements.lock .
RUN pip install --no-cache-dir -r requirements.lock

COPY --chown=appuser:appuser . .
USER appuser

# Health check probes YOUR service, not the model provider — otherwise a
# provider blip takes your pods out of rotation for a problem they cannot fix.
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8000/healthz

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]`,
        },
        bullets: [
          "Slim, pinned, non-root images pass security review far faster — and in an FDE engagement that review is often on the critical path.",
          "Keep the image small: enterprise registries and air-gapped transfers make a 3 GB image a genuine delivery problem.",
          "Never bake secrets into layers. They persist in the image history even if a later layer deletes them.",
        ],
        links: [
          {
            label: "TechWorld with Nana — Docker tutorials",
            href: "https://www.youtube.com/@TechWorldwithNana",
          },
          { label: "Docker — official documentation", href: "https://docs.docker.com/" },
        ],
      },
      {
        heading: "2. CI/CD",
        lede: "For AI systems the pipeline gains one stage everyone forgets: evals.",
        code: {
          title: "Example — a pipeline with a quality gate, not just a test gate",
          lang: "yaml",
          source: `jobs:
  verify:
    steps:
      - run: npm ci && npm run typecheck && npm run lint
      - run: pytest                      # deterministic code — ordinary tests

      # THE AI-SPECIFIC STAGE: prompt and retrieval changes need a quality gate,
      # because "the tests pass" says nothing about whether answers got worse.
      - run: python -m evals.run --suite regression --min-score 0.85
        # Fails the build if grounded-answer rate drops below the threshold.

      - run: python -m evals.cost_report --max-delta 15%
        # Also gate on COST: a prompt change that doubles tokens should not
        # merge silently.`,
        },
        bullets: [
          "Gate merges on eval score and on cost delta. Both regress silently otherwise, and both are visible to the customer.",
          "Version prompts with the code so a rollback restores the prompt too — otherwise you roll back the binary and keep the bad prompt.",
          "Keep eval runs cheap enough to run per-PR: sample the suite, run the full set nightly.",
        ],
        links: [
          {
            label: "YouTube search — CI/CD pipelines GitHub Actions tutorial",
            href: YT("CI CD pipeline github actions tutorial"),
          },
          { label: "Site: evals in depth (step 5)", href: "/fde/ai-reliability-genaiops" },
        ],
      },
      {
        heading: "3. Cloud",
        lede: "Usually theirs, not yours — and that constrains everything.",
        bullets: [
          "Ask in the first technical call: where will this run, what can it reach, and who approves that? Restricted egress, a mandated vendor, or a four-week security queue shapes the architecture more than any model choice.",
          "Managed model endpoints inside the customer's own cloud (Bedrock, Vertex, Azure OpenAI) are frequently what makes a deal possible — data never leaves their tenancy boundary.",
          "Expect regional or air-gapped requirements for regulated customers; that is what pushes designs to self-hosted or in-region endpoints.",
          "Cost attribution matters: tag everything per customer and per team, because 'which workload spent this' always gets asked.",
        ],
        links: [
          {
            label: "YouTube search — AWS Bedrock Azure OpenAI enterprise deployment",
            href: YT("AWS Bedrock Azure OpenAI enterprise private deployment tutorial"),
          },
        ],
      },
      {
        heading: "4. Kubernetes",
        lede: "Where your container runs — and where the mystery failures come from.",
        table: {
          caption: "The settings that actually matter for an AI service pod.",
          headers: ["Setting", "Why it matters here", "Typical mistake"],
          rows: [
            [
              "Memory requests/limits",
              "AI pods are memory-heavy, CPU-light",
              "Too low → OOMKilled, looks like random failures",
            ],
            [
              "Readiness probe",
              "Decides if you get traffic",
              "Probing the model provider → blips evict your pods",
            ],
            [
              "Liveness probe",
              "Restarts a wedged process",
              "Too aggressive → restarts during long generations",
            ],
            [
              "terminationGracePeriod",
              "Time to finish in-flight work",
              "Default 30s cuts off a running generation",
            ],
            ["HPA metric", "What you scale on", "CPU is the wrong signal; scale on queue depth"],
          ],
        },
        bullets: [
          "'OOMKilled' is the single most common mystery failure for AI service containers. Check `kubectl describe pod` before debugging your code.",
          "Scale on in-flight requests or queue depth rather than CPU — an AI pod waiting on a provider uses almost no CPU while being completely saturated.",
          "Give generous termination grace so a rolling deploy does not kill requests mid-generation.",
        ],
        links: [
          {
            label: "TechWorld with Nana — Kubernetes full course",
            href: "https://www.youtube.com/@TechWorldwithNana",
          },
          {
            label: "Kubernetes — official documentation",
            href: "https://kubernetes.io/docs/home/",
          },
        ],
      },
      {
        heading: "5. Caching",
        lede: "The highest-ROI lever available — and three different caches attack three different costs.",
        table: {
          caption: "Use all three; they are not alternatives.",
          headers: ["Layer", "Matches on", "Typical saving", "Watch out"],
          rows: [
            [
              "Exact-match",
              "Hash of the full prompt",
              "Free on a hit",
              "Low hit rate on free text",
            ],
            [
              "Semantic",
              "Embedding similarity above a threshold",
              "30–50% on repetitive traffic",
              "Too-low threshold returns WRONG answers",
            ],
            [
              "Provider prompt cache",
              "A stable prefix",
              "Up to ~90% off cached input tokens",
              "Prefix must be byte-stable and first",
            ],
            [
              "Retrieval cache",
              "Query → chunks",
              "Removes vector DB load",
              "Invalidate when documents change",
            ],
          ],
        },
        code: {
          title: "Example — prompt-prefix caching, and the mistake that silently disables it",
          lang: "python",
          source: `response = client.messages.create(
    model=MODEL,
    system=[{
        "type": "text",
        "text": LARGE_STATIC_POLICY_DOCUMENT,      # 40k tokens, same every call
        "cache_control": {"type": "ephemeral"},    # ← cache breakpoint
    }],
    messages=[{"role": "user", "content": user_question}],   # varies per call
)

# THE COMMON MISTAKE: interpolating a timestamp, request id or user name into
# the system prompt. The prefix changes every call, the cache NEVER hits, and
# the customer quietly pays full price for every token, forever.

# Semantic cache thresholds — calibrate on the customer's real queries:
#   0.99 → effectively exact matching, rarely hits
#   0.95 → good balance for FAQ-style traffic
#   0.85 → will confidently serve the answer to a DIFFERENT question`,
        },
        bullets: [
          "Never semantically cache a response that depended on who asked. Two users can phrase a question identically and be entitled to different answers — a shared cache turns that into a data leak.",
          "Track cache hit rate as a first-class metric; a regression is usually a prompt change that broke prefix stability.",
          "Cache the retrieval step too — vector search is often a bigger share of latency than assumed.",
        ],
        links: [
          {
            label: "Anthropic — prompt caching documentation",
            href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
          },
          { label: "Site: caching strategies and stampede protection", href: "/hld/caching" },
        ],
      },
      {
        heading: "6. Async",
        lede: "A 5-second blocking call saturates a synchronous worker pool almost immediately.",
        code: {
          title: "Example — bounded concurrency and a budget enforced in code",
          lang: "python",
          source: `import asyncio

# Concurrency is limited by the PROVIDER's token-per-minute quota, not your CPU.
# Launching 500 coroutines just queues 500 requests at the provider, which then
# fail together with 429s.
sem = asyncio.Semaphore(20)

async def call_model(prompt: str, budget: CostBudget) -> str:
    budget.reserve(estimate_tokens(prompt) * PRICE_PER_TOKEN)   # check BEFORE spending
    async with sem:
        try:
            return await client.messages.create(
                model=MODEL, max_tokens=1024, timeout=60.0,
                messages=[{"role": "user", "content": prompt}])
        except RateLimitError as exc:
            # Respect Retry-After. Blind exponential backoff on a per-minute
            # token limit resynchronises every client into the same window.
            await asyncio.sleep(exc.retry_after or 5)
            raise`,
        },
        bullets: [
          "Return 202 with a job id for anything that may take more than a few seconds; deliver by webhook, polling or a stream. Holding an HTTP connection for a minute is fragile through corporate proxies.",
          "Stream tokens where the UI allows — time-to-first-token is what users perceive, not total latency.",
          "Make every job idempotent on a client key. Retries are guaranteed here, and without a key each retry is a second paid generation.",
        ],
        links: [
          {
            label: "YouTube search — Python asyncio concurrency tutorial",
            href: YT("python asyncio concurrency semaphore tutorial"),
          },
        ],
      },
      {
        heading: "7. Scalability",
        lede: "Scaling out does not help when the ceiling is someone else's quota.",
        bullets: [
          "Know your provider quota before load testing. Adding pods against a fixed token-per-minute limit just moves the queue and produces 429s.",
          "Separate queues by priority and by tenant — one customer's bulk backfill must not sit in front of another's interactive request.",
          "Shed load deliberately at the edge with a clear 429 and Retry-After, rather than accepting work you cannot serve and timing out deep in the stack.",
          "Batch where the API supports it: batch endpoints are often substantially cheaper for work that is not latency-sensitive.",
        ],
        links: [
          { label: "Site: scaling fundamentals", href: "/hld/scaling" },
          {
            label: "ByteByteGo — system design and scalability",
            href: "https://www.youtube.com/@ByteByteGo",
          },
        ],
      },
      {
        heading: "8. Load balancing",
        lede: "Standard, with two AI-specific adjustments.",
        bullets: [
          "Raise the idle and read timeouts well above your longest expected generation, or the balancer will cut off requests the backend is still serving.",
          "Least-connections beats round-robin here: request durations vary enormously, so round-robin piles short requests onto a node already handling a long one.",
          "Use sticky sessions only where you genuinely hold per-connection state (streaming, WebSocket); otherwise keep the tier stateless.",
          "Health-check your own service, never the model provider — see the Kubernetes note above.",
        ],
        links: [
          { label: "Site: load balancing algorithms", href: "/hld/load-balancing" },
          {
            label: "YouTube search — load balancing algorithms explained",
            href: YT("load balancing algorithms least connections explained"),
          },
        ],
      },
      {
        heading: "9. LLM gateways",
        lede: "One place for routing, failover, budgets, keys and observability.",
        diagram: {
          kind: "system",
          caption: "Applications talk to the gateway; the gateway talks to providers.",
          columns: [
            {
              title: "Apps",
              nodes: [
                { id: "a1", label: "Support assistant" },
                { id: "a2", label: "Extraction pipeline" },
                { id: "a3", label: "Internal tools" },
              ],
            },
            {
              title: "Gateway",
              nodes: [
                {
                  id: "auth",
                  label: "Key management",
                  sub: "per-team virtual keys",
                  tone: "accent",
                },
                { id: "route", label: "Model routing", sub: "by task, cost, health" },
                { id: "cache", label: "Caching", sub: "exact + semantic", tone: "ok" },
                { id: "budget", label: "Budgets", sub: "enforced per tenant" },
              ],
            },
            {
              title: "Reliability",
              nodes: [
                { id: "fail", label: "Failover", sub: "provider outage" },
                { id: "rl", label: "Rate limiting", sub: "token-aware" },
                {
                  id: "cb",
                  label: "Circuit breaker",
                  sub: "stop hammering a dead provider",
                  tone: "warn",
                },
              ],
            },
            {
              title: "Providers",
              nodes: [
                { id: "p1", label: "Primary" },
                { id: "p2", label: "Secondary" },
                { id: "p3", label: "Self-hosted / regional", sub: "residency" },
              ],
            },
          ],
        },
        bullets: [
          "Virtual per-team keys make cost attributable. 'Which team spent $40,000 last month' is unanswerable with one shared key — and it always gets asked.",
          "For an enterprise customer the gateway is often also the compliance boundary, where residency, redaction and audit logging are enforced once rather than in twelve services.",
          "Open-source options (LiteLLM) and managed ones both exist; the decision is usually procurement, not features.",
        ],
        links: [
          { label: "LiteLLM — open-source LLM gateway", href: "https://docs.litellm.ai/" },
          {
            label: "YouTube search — LLM gateway routing failover semantic caching",
            href: YT("LLM gateway litellm routing failover semantic caching"),
          },
        ],
      },
      {
        heading: "10. Cost & token optimization",
        lede: "Token prices fall while bills rise — because agentic workloads multiply calls per task.",
        table: {
          caption: "Levers in rough order of impact.",
          headers: ["Lever", "Typical effect", "Cost to implement"],
          rows: [
            [
              "Prompt-prefix caching",
              "Up to ~90% off cached input",
              "Low — order the context correctly",
            ],
            [
              "Model routing by task",
              "Large — small models are far cheaper",
              "Medium — needs a routing policy",
            ],
            ["Semantic caching", "30–50% on repetitive traffic", "Medium — threshold calibration"],
            ["Fewer calls per task", "Proportional", "Medium — workflow instead of agent"],
            [
              "Trim retrieved context",
              "Proportional to tokens removed",
              "Low — rerank and send five chunks, not fifty",
            ],
            ["Batch APIs", "Often ~50% for non-urgent work", "Low where latency permits"],
          ],
        },
        bullets: [
          "Optimise calls-per-task, not just price-per-token. A multi-agent design that issues fifteen calls where a workflow needed one is the dominant cost factor.",
          "Set a hard per-task cost ceiling in code. A ceiling that lives only in a dashboard is a post-mortem, not a control.",
          "Report cost per business outcome — per invoice processed, per ticket resolved — because that is the number the customer's budget holder compares against the manual cost.",
        ],
        links: [
          {
            label: "Anthropic — pricing and token usage",
            href: "https://docs.anthropic.com/en/docs/about-claude/pricing",
          },
          {
            label: "YouTube search — LLM cost optimization token reduction strategies",
            href: YT("LLM cost optimization token reduction caching model routing"),
          },
        ],
      },
    ],
    related: [
      "/fde/ai-reliability-genaiops",
      "/fde/system-design-for-ai",
      "/hld/caching",
      "/hld/rate-limiting",
    ],
    furtherReading: [
      {
        label: "Anthropic — prompt caching",
        href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching",
      },
      { label: "LiteLLM — gateway documentation", href: "https://docs.litellm.ai/" },
      {
        label: "TechWorld with Nana — Docker and Kubernetes",
        href: "https://www.youtube.com/@TechWorldwithNana",
      },
    ],
  },
];
