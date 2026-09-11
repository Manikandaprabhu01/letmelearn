import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeSystemDesign: Concept[] = [
  {
    slug: "system-design-for-ai",
    title: "System Design for AI",
    subtitle:
      "RAG architectures, agent architectures, microservices, event-driven systems, multi-tenant AI, distributed systems, queues, model routing",
    level: "advanced",
    minutes: 42,
    tags: [
      "rag",
      "agents",
      "microservices",
      "event-driven",
      "multi-tenant",
      "queues",
      "model routing",
    ],
    summary:
      "Everything in the rest of this site applies here — queues, caching, sharding, idempotency — with one dependency classical system design never had: slow, costly, non-deterministic and outside your control. Each of the eight architectural concepts is broken out with the decision it turns on.",
    keyPoints: [
      "Pick the simplest retrieval architecture that answers the question; complexity usually papers over a retrieval failure.",
      "Prefer a deterministic workflow to an agent whenever the steps are knowable.",
      "Multi-tenancy in AI adds isolation dimensions classical systems do not have: index, cache, prompt and budget.",
      "Model routing is the main cost and reliability lever once traffic is real.",
    ],
    prerequisites: ["/fde/ai-engineering", "/fde/production-ai-engineering"],
    sections: [
      {
        heading: "1. RAG architectures",
        lede: "Start simple. Each step up costs latency and money, so earn it with evidence.",
        diagram: {
          kind: "compare",
          caption: "Escalate only when evals show the simpler design failing.",
          options: [
            {
              title: "Naive RAG",
              sub: "embed → search → stuff → answer",
              good: ["Simple, fast, cheap", "Genuinely sufficient for many use cases"],
              bad: ["Misses exact identifiers", "No follow-up handling", "Poor on multi-hop"],
              verdict: "The correct starting point — build and measure this first.",
            },
            {
              title: "Hybrid + rerank",
              sub: "BM25 + vector, then a cross-encoder",
              tone: "ok",
              good: [
                "Fixes identifier lookup and rare terms",
                "Reranking lifts precision substantially",
                "Still one generation call",
              ],
              bad: ["More moving parts", "Reranking adds latency and cost"],
              verdict: "The production default for most enterprise deployments.",
            },
            {
              title: "Agentic RAG",
              sub: "the model plans retrieval and iterates",
              good: [
                "Handles multi-hop and comparative questions",
                "Can re-query when the first attempt fails",
              ],
              bad: [
                "Several model calls — multiples of cost and latency",
                "Much harder to evaluate",
                "Can loop",
              ],
              verdict: "Only when evals prove single-shot retrieval cannot answer real questions.",
            },
          ],
        },
        bullets: [
          "The most common architectural mistake is reaching for agentic retrieval to fix what is actually a chunking or hybrid-search problem.",
          "Query rewriting is the cheapest large win: resolving pronouns and expanding acronyms before embedding costs one small call and lifts recall noticeably.",
          "Route by question type — aggregates and exact lookups go to SQL, not a vector index.",
        ],
        links: [
          {
            label: "YouTube search — advanced RAG architecture patterns",
            href: YT("advanced RAG architecture reranking agentic RAG patterns"),
          },
          { label: "Site: RAG fundamentals (step 3)", href: "/fde/ai-engineering" },
        ],
      },
      {
        heading: "2. Agent architectures",
        lede: "The decision with the largest effect on cost, testability and customer trust.",
        table: {
          caption: "Decide by whether the steps are knowable in advance.",
          headers: ["Property", "Deterministic workflow", "Agent loop"],
          rows: [
            ["Steps", "Known at design time", "Chosen by the model at runtime"],
            ["Cost per task", "Predictable", "Variable, often 5–15× higher"],
            ["Testability", "Ordinary integration tests", "Needs eval suites and trace review"],
            ["Debugging", "Read the code path", "Read the trace and infer intent"],
            ["Explaining to risk teams", "Straightforward", "Genuinely difficult"],
            ["Handles novelty", "Poorly", "Well — this is the actual justification"],
          ],
        },
        code: {
          title: "Example — most 'agent' requirements are a workflow with one model call per step",
          lang: "python",
          source: `# Requirement: "an agent that processes incoming invoices."
# The steps are entirely knowable, so an agent adds cost and risk for nothing.

async def process_invoice(document: bytes, *, acting_user) -> Result:
    text = await extract_text(document)                        # OCR — no LLM

    invoice = await llm_extract(text, schema=ExtractedInvoice)  # 1 model call
    if invoice.confidence != "high":
        return await queue_for_review(invoice, text)            # explicit HITL seam

    vendor = await crm.find_vendor(invoice.vendor_tax_id)       # deterministic
    if vendor is None:
        return await queue_for_review(invoice, text, reason="unknown vendor")

    po = await erp.match_purchase_order(invoice, vendor)        # deterministic rules
    if po is None or not amounts_match(po, invoice):
        return await queue_for_review(invoice, text, reason="no PO match")

    return await erp.post_invoice(invoice, po, as_user=acting_user)

# One model call, where the input is genuinely unstructured. Everything else is
# code: testable, debuggable, free, and explainable to an auditor.`,
        },
        bullets: [
          "Use the model where the input is unstructured and the rules are fuzzy; use code everywhere else. That heuristic removes most unnecessary agent designs.",
          "A workflow with an explicit escalation path is far easier to sell into a regulated environment and usually delivers the same outcome.",
          "If an agent is warranted, bound it — step budget, cost cap, timeout, write approval — and instrument every step.",
        ],
        links: [
          {
            label: "Anthropic — Building effective agents",
            href: "https://www.anthropic.com/research/building-effective-agents",
          },
          {
            label: "YouTube search — agentic workflow vs agent design patterns",
            href: YT("agentic workflow vs autonomous agent design patterns"),
          },
        ],
      },
      {
        heading: "3. Microservices",
        lede: "Split by failure domain and scaling profile, not by fashion.",
        bullets: [
          "The natural seams in an AI system are: the API tier, the retrieval service, the model gateway, async workers and the indexing pipeline. Each has a genuinely different scaling and failure profile.",
          "Keep the model gateway separate — it is where keys, budgets, routing and failover live, and it should be changeable without redeploying applications.",
          "Do not split so finely that one user request fans out to eight synchronous hops; latency budget is already spent on the model.",
          "For an FDE deployment, fewer services is usually better: every service is another thing the customer's team must operate after you leave.",
        ],
        links: [
          { label: "Site: microservice boundaries and trade-offs", href: "/hld/api-gateway" },
          {
            label: "ByteByteGo — architecture patterns",
            href: "https://www.youtube.com/@ByteByteGo",
          },
        ],
      },
      {
        heading: "4. Event-driven systems",
        lede: "Decouples slow AI work from the systems that trigger it.",
        bullets: [
          "Emit a document-changed event and let indexing react; emit an invoice-received event and let the pipeline react. The producer never waits for the AI work.",
          "Events give you replay: after a bug fix, reprocess the stream rather than asking the customer to resubmit.",
          "Order is not guaranteed and delivery is at-least-once, so consumers must be idempotent — the same discipline as webhooks in step 6.",
          "This is what makes retrofitting AI into an existing enterprise system tractable: you subscribe to events they already emit rather than modifying their code.",
        ],
        links: [
          { label: "Site: message queues and delivery semantics", href: "/hld/message-queues" },
          {
            label: "Site: designing a distributed message queue",
            href: "/examples/distributed-mq",
          },
        ],
      },
      {
        heading: "5. Multi-tenant AI systems",
        lede: "More isolation dimensions than classical multi-tenancy — each one a potential leak.",
        table: {
          caption: "Every row is a place tenant data can cross a boundary.",
          headers: ["Dimension", "Risk if shared", "Approach"],
          rows: [
            [
              "Vector index",
              "One tenant retrieves another's documents",
              "Namespace per tenant, or tenant filter in the query",
            ],
            [
              "Semantic cache",
              "Cached answer served across tenants",
              "Tenant id in the cache key — never omit it",
            ],
            [
              "Prompt / config",
              "One tenant's customisation affects another",
              "Versioned config per tenant",
            ],
            [
              "Token budget",
              "A noisy tenant exhausts shared quota",
              "Per-tenant quotas at the gateway",
            ],
            [
              "Traces and logs",
              "Support sees the wrong tenant's data",
              "Tenant-scoped observability access",
            ],
            [
              "Fine-tuned models",
              "Model memorises one tenant's data",
              "Separate models, or do not fine-tune on tenant data",
            ],
          ],
        },
        callout: {
          kind: "warn",
          title: "The semantic cache is the sharpest edge",
          text: "A semantic cache keyed only on the query embedding will return tenant A's answer to tenant B, because the two asked a similar question. It looks like a performance optimisation and behaves like a data breach. Tenant id must be part of the cache key, and entitlement-scoped responses should not be shared-cached at all.",
        },
        links: [
          {
            label: "YouTube search — multi-tenant SaaS architecture isolation",
            href: YT("multi tenant SaaS architecture data isolation patterns"),
          },
        ],
      },
      {
        heading: "6. Distributed systems fundamentals",
        lede: "The classical material still applies — with an expensive, non-deterministic dependency added.",
        bullets: [
          "Idempotency matters more here than anywhere: retries are guaranteed, and each duplicate is a paid generation as well as a possible double action.",
          "Timeouts must be set deliberately at every hop; the defaults assume millisecond work and will cut off generations.",
          "Circuit-break a failing provider rather than retrying into it — retries during an outage add load and burn quota.",
          "Consistency requirements are usually narrow: one entitlement check must be strong, while displayed results can be eventually consistent.",
        ],
        links: [
          { label: "Site: idempotency, consistency and availability", href: "/hld/idempotency" },
          { label: "Site: circuit breakers", href: "/hld/circuit-breaker" },
        ],
      },
      {
        heading: "7. Queues",
        lede: "The buffer between fast producers and a slow, rate-limited backend.",
        bullets: [
          "Separate queues by priority and by tenant — one customer's bulk backfill must not block another's interactive request.",
          "Size worker concurrency to the provider's token-per-minute quota, not to CPU. Beyond that you are just queueing at the provider and collecting 429s.",
          "Dead-letter anything that exhausts retries, and alert on it. A poison message that fails forever blocks its partition.",
          "Make queue depth the autoscaling signal; CPU is meaningless for a worker that spends its life awaiting a network call.",
        ],
        links: [
          { label: "Site: message queues in depth", href: "/hld/message-queues" },
          { label: "Site: distributed job scheduling", href: "/examples/job-scheduler" },
        ],
      },
      {
        heading: "8. Model routing",
        lede: "The main cost and reliability lever once traffic is real.",
        diagram: {
          kind: "flow",
          caption: "Degrade in steps rather than failing outright.",
          rows: [
            [
              { id: "req", label: "Request" },
              { id: "route", label: "Router", sub: "by task, cost, health", tone: "accent" },
              { id: "cache", label: "Cache hit?", sub: "free and instant", tone: "ok" },
            ],
            [
              { id: "p1", label: "Primary model" },
              { id: "p2", label: "Secondary provider", sub: "on 5xx or timeout" },
              { id: "small", label: "Smaller model", sub: "degraded but answering", tone: "warn" },
            ],
            [
              { id: "cached", label: "Stale cached answer", sub: "labelled as such", tone: "warn" },
              { id: "human", label: "Route to a human", sub: "final fallback" },
              {
                id: "fail",
                label: "Honest failure",
                sub: "never a fabricated answer",
                tone: "bad",
              },
            ],
          ],
        },
        bullets: [
          "Route by task: classification and extraction to a small cheap model, genuine reasoning to a frontier model. Most workloads are dominated by tasks that do not need the largest model.",
          "Keep prompts reasonably portable so failover to a second provider is realistic rather than theoretical.",
          "Degrade explicitly and visibly. A slightly worse answer labelled as degraded is acceptable; a confidently wrong answer from a silent fallback is not.",
        ],
        links: [
          {
            label: "LiteLLM — routing and fallbacks",
            href: "https://docs.litellm.ai/docs/routing",
          },
          {
            label: "YouTube search — LLM model routing cost optimization architecture",
            href: YT("LLM model routing fallback cost optimization architecture"),
          },
        ],
      },
    ],
    related: ["/fde/fde-layer", "/fde/ai-reliability-genaiops", "/hld/message-queues"],
    furtherReading: [
      {
        label: "Anthropic — building effective agents",
        href: "https://www.anthropic.com/research/building-effective-agents",
      },
      { label: "ByteByteGo — system design", href: "https://www.youtube.com/@ByteByteGo" },
    ],
  },
];
