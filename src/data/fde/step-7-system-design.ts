import type { Concept } from "@/data/types";

export const fdeSystemDesign: Concept[] = [
  {
    slug: "system-design-for-ai",
    title: "System Design for AI",
    subtitle:
      "RAG architectures, agent architectures, microservices, event-driven systems, multi-tenant AI, distributed systems, queues, model routing",
    level: "advanced",
    minutes: 30,
    tags: ["rag", "agents", "multi-tenancy", "event-driven", "model routing"],
    summary:
      "Everything in the rest of this site applies here — queues, caching, sharding, idempotency, consistency — with a handful of properties that classical system design never had to accommodate: a dependency that is slow, costly, non-deterministic and outside your control. This step is about composing the pieces into architectures that survive multi-tenancy, provider outages and a cost model where one user's request can be a thousand times more expensive than another's.",
    keyPoints: [
      "Pick the simplest retrieval architecture that answers the question; complexity in RAG is usually a retrieval failure being papered over.",
      "Prefer a deterministic workflow to an agent whenever the steps are knowable — cheaper, testable and explainable.",
      "Multi-tenancy in AI adds isolation dimensions classical systems do not have: index, cache, prompt and budget.",
      "Model routing is the main cost and reliability lever once traffic is real.",
    ],
    prerequisites: ["/fde/ai-engineering", "/fde/production-ai-engineering"],
    sections: [
      {
        heading: "Choosing a RAG architecture",
        lede: "Start simple. Each step up costs latency and money, so earn it with evidence.",
        diagram: {
          kind: "compare",
          caption: "Escalate only when evals show the simpler design failing.",
          options: [
            {
              title: "Naive RAG",
              sub: "embed → search → stuff → answer",
              good: ["Simple, fast, cheap", "Genuinely sufficient for a large share of use cases"],
              bad: [
                "Misses exact identifiers",
                "No handling of follow-up questions",
                "Poor on multi-hop questions",
              ],
              verdict: "The correct starting point — always build this first and measure it.",
            },
            {
              title: "Hybrid + rerank",
              sub: "BM25 + vector, then a cross-encoder",
              tone: "ok",
              good: [
                "Fixes identifier lookup and rare terms",
                "Reranking lifts precision substantially",
                "Still one model call for generation",
              ],
              bad: ["More moving parts", "Reranking adds latency and cost"],
              verdict: "The production default for most enterprise deployments.",
            },
            {
              title: "Agentic RAG",
              sub: "the model plans retrieval, iterates",
              good: [
                "Handles multi-hop and comparative questions",
                "Can decompose and re-query when the first attempt fails",
              ],
              bad: [
                "Several model calls — multiples of the cost and latency",
                "Much harder to evaluate and debug",
                "Can loop",
              ],
              verdict:
                "Only when evals prove single-shot retrieval genuinely cannot answer the questions users ask.",
            },
          ],
        },
        bullets: [
          "The most common architectural mistake is reaching for agentic retrieval to fix what is actually a chunking or hybrid-search problem. Fix retrieval quality first; it is cheaper and it is usually the real fault.",
          "Query rewriting is the cheapest large win available — resolving pronouns and expanding acronyms before embedding costs one small model call and lifts recall noticeably.",
          "Reranking with a cross-encoder over fifty candidates to pick five is a reliable quality improvement at modest cost, and it is what makes small context windows viable.",
          "Route by question type: aggregates and exact lookups should go to SQL, not to a vector index. A router that recognises 'how many' and hands it to a query is worth more than a better embedding model.",
        ],
      },
      {
        heading: "Workflows versus agents",
        lede: "The architectural decision with the largest effect on cost, testability and customer trust.",
        table: {
          caption: "Decide by whether the steps are knowable in advance.",
          headers: ["Property", "Deterministic workflow", "Agent loop"],
          rows: [
            ["Steps", "Known at design time", "Chosen by the model at runtime"],
            ["Cost per task", "Predictable", "Variable, often 5–15× higher"],
            ["Testability", "Ordinary integration tests", "Requires eval suites and trace review"],
            ["Debugging", "Read the code path", "Read the trace and infer intent"],
            ["Explaining to risk teams", "Straightforward", "Genuinely difficult"],
            ["Handles novelty", "Poorly", "Well — this is the actual justification"],
          ],
        },
        code: {
          title: "Most 'agent' requirements are a workflow with one model call per step",
          lang: "python",
          source: `# The requirement: "an agent that processes incoming invoices."
# The steps are entirely knowable, so an agent adds cost and risk for nothing.

async def process_invoice(document: bytes, *, acting_user: User) -> Result:
    text = await extract_text(document)                       # OCR — no LLM needed

    invoice = await llm_extract(text, schema=ExtractedInvoice) # 1 model call
    if invoice.confidence != "high":
        return await queue_for_review(invoice, text)           # explicit HITL seam

    vendor = await crm.find_vendor(invoice.vendor_tax_id)      # deterministic lookup
    if vendor is None:
        return await queue_for_review(invoice, text, reason="unknown vendor")

    po = await erp.match_purchase_order(invoice, vendor)       # deterministic rules
    if po is None or not amounts_match(po, invoice):
        return await queue_for_review(invoice, text, reason="no PO match")

    return await erp.post_invoice(invoice, po, as_user=acting_user)

# One model call, in the one place where the input is genuinely unstructured.
# Everything else is code: testable, debuggable, free, and explainable to an
# auditor. Reserve the agent loop for cases where you truly cannot enumerate
# the steps — investigating an anomaly, say, rather than processing a form.`,
        },
        bullets: [
          "Use the model where the input is unstructured and the rules are fuzzy; use code everywhere else. This one heuristic removes most unnecessary agent designs.",
          "Agentic systems consume several times more tokens than single calls when unoptimised, which is why cost ceilings belong in the architecture rather than in a dashboard.",
          "A workflow with an explicit escalation path is far easier to sell into a regulated environment than an autonomous loop, and it usually delivers the same business outcome.",
          "If an agent is genuinely warranted, bound it — step budget, cost cap, timeout, approval for writes — and instrument every step.",
        ],
      },
      {
        heading: "Multi-tenant AI systems",
        lede: "Isolation has more dimensions here than in classical multi-tenancy, and each one is a potential leak.",
        table: {
          caption: "Every row is a place tenant data can cross a boundary.",
          headers: ["Dimension", "Risk if shared", "Approach"],
          rows: [
            [
              "Vector index",
              "One tenant retrieves another's documents",
              "Namespace per tenant, or tenant id filter in the query",
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
              "Per-tenant quotas enforced at the gateway",
            ],
            [
              "Traces and logs",
              "Support sees the wrong tenant's data",
              "Tenant-scoped access to observability",
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
          text: "A semantic cache keyed only on the query embedding will happily return tenant A's answer to tenant B, because the two asked a similar question. It looks like a performance optimisation and behaves like a data breach. Tenant id — and often user entitlement scope — must be part of the cache key, and personalised or entitlement-scoped responses should not be shared-cached at all.",
        },
        bullets: [
          "Decide isolation strength per tenant tier. A shared index with a filter is efficient and acceptable for many customers; a regulated tenant may contractually require a separate index or even a separate deployment.",
          "Per-tenant budgets are both a cost control and a fairness mechanism: without them, one customer's bulk job degrades everyone's latency.",
          "Noisy-neighbour effects are more severe here because a single request can be enormous. Queue by tenant, not just by priority.",
          "Make tenant id a required parameter throughout, not an optional context value. Optional isolation is isolation that eventually gets omitted.",
        ],
      },
      {
        heading: "Reliability: routing, fallback and graceful degradation",
        lede: "Your most important dependency is operated by someone else and will have bad days.",
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
          "Model routing by task is the main cost lever: classification and extraction to a small cheap model, genuine reasoning to a frontier model. Most workloads are dominated by tasks that do not need the largest model.",
          "Keep prompts reasonably portable so failover to a second provider is realistic. Prompts tuned to one vendor's idiosyncrasies are a lock-in you will feel during their next incident.",
          "Circuit-break a failing provider rather than retrying into it. Retries during a provider outage add load to a system already struggling and burn your quota.",
          "Degrade explicitly and visibly. A slightly worse answer labelled as degraded is acceptable; a confidently wrong answer produced by a fallback nobody knew fired is not.",
          "Event-driven designs fit AI work well: emit a document-changed event, let indexing react; emit an invoice-received event, let the pipeline react. It decouples slow AI work from the systems that trigger it.",
        ],
      },
    ],
    related: [
      "/fde/fde-layer",
      "/fde/ai-reliability-genaiops",
      "/examples/news-feed",
      "/hld/message-queues",
    ],
    furtherReading: [
      {
        label: "Anthropic — building effective agents",
        href: "https://www.anthropic.com/research/building-effective-agents",
      },
      {
        label: "Google — MLOps: continuous delivery and automation pipelines",
        href: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
      },
    ],
  },
];
