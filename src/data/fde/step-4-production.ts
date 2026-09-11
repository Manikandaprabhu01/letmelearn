import type { Concept } from "@/data/types";

export const fdeProduction: Concept[] = [
  {
    slug: "production-ai-engineering",
    title: "Production AI Engineering",
    subtitle:
      "Docker, CI/CD, cloud, Kubernetes, caching, async, scalability, load balancing, LLM gateways, cost & token optimization",
    level: "intermediate",
    minutes: 30,
    tags: ["docker", "kubernetes", "caching", "async", "llm gateway", "cost"],
    summary:
      "AI workloads break the assumptions ordinary web infrastructure is built on. Requests take seconds instead of milliseconds, they cost real money per call, they fail upstream at a provider you do not control, and they are rate-limited by tokens rather than requests. This step is everything needed to run that reliably and affordably in a customer's environment — where the constraint is often their cloud, their network and their procurement rules, not yours.",
    keyPoints: [
      "Seconds-long requests mean async and queues are structural, not optimisations — a synchronous worker pool saturates almost instantly.",
      "Caching is the highest-ROI lever in AI infrastructure: exact, semantic and provider-side prompt caching each attack a different slice of cost.",
      "An LLM gateway centralises routing, failover, caching, budgets and key management — without one, every service reinvents them badly.",
      "Cost is a first-class design constraint because agentic workloads issue ten to twenty calls per user task.",
    ],
    prerequisites: ["/fde/ai-engineering"],
    sections: [
      {
        heading: "Why AI workloads break normal infrastructure assumptions",
        lede: "Every default in a standard web stack is wrong here by an order of magnitude.",
        table: {
          caption: "The assumptions that stop holding, and what each one breaks.",
          headers: ["Assumption", "Normal web", "AI workload", "What breaks"],
          rows: [
            [
              "Request duration",
              "10–100 ms",
              "2–60 s",
              "Thread pools, timeouts, load balancer defaults",
            ],
            [
              "Marginal cost",
              "≈ 0",
              "$0.001–$1 per call",
              "Retries become expensive; loops become invoices",
            ],
            [
              "Failure source",
              "Your code",
              "An upstream provider",
              "You cannot fix it — only route around it",
            ],
            [
              "Rate limits",
              "Requests per second",
              "Tokens per minute",
              "A few long requests exhaust the budget",
            ],
            [
              "Output",
              "Deterministic",
              "Varies run to run",
              "Caching and testing both need rethinking",
            ],
            [
              "Capacity",
              "Add replicas",
              "Provider quota",
              "Scaling out does not help if quota is the limit",
            ],
          ],
        },
        callout: {
          kind: "warn",
          title: "The default that causes the first outage",
          text: "Most load balancers and ingress controllers default to a 30 or 60 second timeout, and many HTTP clients default to less. A long generation exceeds it, the client retries, the original call keeps running and is still billed, and load doubles under exactly the conditions that caused the slowness. Raise timeouts deliberately, stream where you can, and make retries idempotent.",
        },
      },
      {
        heading: "Async and queues: structural, not optional",
        lede: "The shape that keeps a slow, expensive backend from taking the front door down.",
        diagram: {
          kind: "flow",
          caption: "Accept fast, process out of band, notify on completion.",
          rows: [
            [
              { id: "c", label: "Client", sub: "POST job" },
              { id: "api", label: "API", sub: "validate, enqueue, 202", tone: "accent" },
              { id: "q", label: "Queue", sub: "priority lanes" },
            ],
            [
              { id: "w", label: "Workers", sub: "bounded concurrency" },
              { id: "llm", label: "Model provider", sub: "the slow, costly hop" },
              { id: "done", label: "Result + webhook", sub: "or SSE stream", tone: "ok" },
            ],
          ],
        },
        code: {
          title: "Bounded concurrency and a budget that is enforced, not hoped for",
          lang: "python",
          source: `import asyncio

# Concurrency is limited by the PROVIDER's token-per-minute quota, not by your
# CPU. Launching 500 coroutines just means 500 requests queue at the provider
# and then fail together with 429s.
sem = asyncio.Semaphore(20)

async def call_model(prompt: str, budget: CostBudget) -> str:
    estimated = estimate_tokens(prompt) * PRICE_PER_INPUT_TOKEN
    # Check the budget BEFORE spending, and enforce it in code. A cost ceiling
    # that lives only in a dashboard is a post-mortem, not a control.
    budget.reserve(estimated)

    async with sem:
        try:
            resp = await client.messages.create(
                model=MODEL, max_tokens=1024, timeout=60.0,
                messages=[{"role": "user", "content": prompt}],
            )
        except RateLimitError as exc:
            # Respect Retry-After. Blind exponential backoff on a token-per-minute
            # limit tends to resynchronise every client into the same next window.
            await asyncio.sleep(exc.retry_after or 5)
            raise
        finally:
            budget.settle(actual=resp.usage.total_tokens if 'resp' in dir() else 0)

    return resp.content[0].text`,
        },
        bullets: [
          "Return 202 with a job id for anything that may take more than a few seconds, then deliver the result by webhook, polling or a stream. Holding an HTTP connection open for a minute is fragile through corporate proxies.",
          "Stream tokens where the interface allows it. It does not reduce total latency, but time-to-first-token is what users actually perceive, and it changes a 20-second wait into something that feels responsive.",
          "Separate queues by priority and by tenant. One customer's bulk backfill must not sit in front of another's interactive request.",
          "Make every job idempotent on a client-supplied key. Retries are guaranteed in this environment, and without a key each retry is a second paid generation.",
        ],
      },
      {
        heading: "Caching: the highest-ROI lever available",
        lede: "Three different caches attack three different costs, and they compose.",
        table: {
          caption: "Use all three — they are not alternatives.",
          headers: ["Layer", "Matches on", "Typical saving", "Watch out for"],
          rows: [
            [
              "Exact-match cache",
              "Hash of the full prompt",
              "Free on a hit",
              "Low hit rate on free-text input",
            ],
            [
              "Semantic cache",
              "Embedding similarity above a threshold",
              "30–50% on repetitive workloads",
              "A too-low threshold returns wrong answers",
            ],
            [
              "Provider prompt cache",
              "A stable prefix (system prompt, docs)",
              "Up to ~90% off cached input tokens",
              "Prefix must be byte-stable and ordered first",
            ],
            [
              "Retrieval cache",
              "Query → retrieved chunks",
              "Removes vector DB load",
              "Invalidate when source documents change",
            ],
          ],
        },
        code: {
          title: "Prompt-prefix caching: order the context so the stable part comes first",
          lang: "python",
          source: `# Provider-side prompt caching keys on a STABLE PREFIX. Anything before the
# cache breakpoint must be byte-identical between calls, so put the large,
# unchanging material first and the variable part last.
response = client.messages.create(
    model=MODEL,
    system=[
        {
            "type": "text",
            "text": LARGE_STATIC_POLICY_DOCUMENT,     # 40k tokens, same every call
            "cache_control": {"type": "ephemeral"},   # ← cache breakpoint
        },
    ],
    messages=[{"role": "user", "content": user_question}],   # varies per call
)

# THE COMMON MISTAKE: interpolating a timestamp, request id or user name into
# the system prompt. It changes the prefix on every call, so the cache never
# hits and the customer quietly pays full price for every token, forever.

# Semantic caching needs a calibrated threshold:
#   0.99  → almost never hits; effectively exact matching
#   0.95  → good balance for FAQ-style traffic
#   0.85  → will confidently serve the answer to a DIFFERENT question
# Calibrate on the customer's real queries, and never semantically cache
# anything personalised or entitlement-scoped.`,
        },
        bullets: [
          "Never semantically cache a response that depended on who asked. Two users can phrase the same question identically and be entitled to different answers — a shared cache turns that into a data-leak incident.",
          "Cache the retrieval step as well as the generation. Vector search is often a larger share of latency than people assume.",
          "Measure cache hit rate as a first-class metric alongside cost per request. A hit-rate regression is usually a prompt change that broke prefix stability.",
          "Token prices have fallen sharply while total spend has risen, because agentic workflows issue many calls per task. Optimise calls-per-task, not just price-per-token.",
        ],
      },
      {
        heading: "The LLM gateway",
        lede: "One place for routing, failover, budgets, keys and observability — or every service reinvents them badly.",
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
                { id: "budget", label: "Budgets + quotas", sub: "enforced, per tenant" },
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
                { id: "p1", label: "Primary provider" },
                { id: "p2", label: "Secondary provider" },
                { id: "p3", label: "Self-hosted / regional", sub: "residency requirements" },
              ],
            },
          ],
        },
        bullets: [
          "Model routing by task is where real savings live: a cheap small model for classification and extraction, a frontier model only where reasoning genuinely matters. Routing is a policy, not a per-service decision.",
          "Failover across providers is the only practical answer to provider outages, and it is the reason to keep prompts reasonably portable rather than deeply tuned to one vendor's quirks.",
          "Virtual per-team keys make cost attributable. 'Which team spent $40,000 last month' is unanswerable with one shared key, and that question always gets asked.",
          "For an enterprise customer the gateway is often also the compliance boundary — where residency, redaction and audit logging are enforced once rather than in twelve services.",
        ],
      },
      {
        heading: "Containers, Kubernetes and the customer's cloud",
        lede: "The deployment target is usually theirs, not yours — and that constrains everything.",
        bullets: [
          "Pin the base image by digest and keep the runtime small. An FDE deployment often goes through a security scan, and a slim, pinned image passes review far faster than a fat one with a floating tag.",
          "Set resource requests and limits deliberately. AI service pods are usually memory-heavy and CPU-light; a container killed for exceeding memory shows up as mysterious request failures.",
          "Health checks need care: a readiness probe that calls the model provider will fail during a provider blip and take your pods out of rotation for a problem they cannot fix. Probe your own service, not theirs.",
          "Assume restricted egress. Many enterprise networks block outbound traffic by default, so the model endpoint, package registry and telemetry destination all need explicit allow-listing — discover this in week one, not on launch day.",
          "Expect air-gapped or regional requirements for some customers. That is what pushes designs towards self-hosted or regional endpoints, and it should be asked about during discovery in step 8.",
        ],
        callout: {
          kind: "interview",
          title: "The question to ask in the first technical call",
          text: '"Where will this run, what can it reach, and who approves that?" The answer — their cloud, an air-gapped VPC, restricted egress, a mandated vendor, a security review with a four-week queue — shapes the architecture far more than any model choice, and finding it out late is the most common cause of a slipped delivery date.',
        },
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
      { label: "LiteLLM — open-source LLM gateway", href: "https://docs.litellm.ai/" },
    ],
  },
];
