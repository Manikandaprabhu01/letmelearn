import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeAiEngineering: Concept[] = [
  {
    slug: "ai-engineering",
    title: "AI Engineering",
    subtitle:
      "LLMs, prompt engineering, structured outputs, RAG, vector DBs, tool/function calling, AI agents, MCP, memory, multimodal",
    level: "intermediate",
    minutes: 48,
    tags: [
      "llm",
      "prompting",
      "rag",
      "vector db",
      "tool calling",
      "agents",
      "mcp",
      "memory",
      "multimodal",
    ],
    summary:
      "The craft layer — where a model becomes a feature. The through-line is control: a raw LLM produces free text from its training distribution, and every technique here narrows that down to something an enterprise system can consume. Each of the ten concepts is broken out with a worked example and references.",
    keyPoints: [
      "Structured output turns a language model into an API you can program against — the enterprise unlock.",
      "RAG is a retrieval problem wearing an AI costume: if retrieval is wrong, no prompt saves the answer.",
      "Tool calling is the model proposing a function; your code decides whether to run it. That boundary is the safety story.",
      "MCP turns an n×m integration problem into n+m.",
      "Agents are loops, and every agent needs a step budget, a cost ceiling and an escape hatch.",
    ],
    prerequisites: ["/fde/ai-ml-fundamentals"],
    sections: [
      {
        heading: "1. LLMs — choosing and configuring them",
        lede: "Model choice is a cost, latency and accuracy decision, not a loyalty one.",
        table: {
          caption: "The parameters that actually change behaviour in production.",
          headers: ["Parameter", "What it does", "Production setting"],
          rows: [
            [
              "temperature",
              "Randomness of sampling",
              "0 for extraction/classification; 0.7 for drafting",
            ],
            ["max_tokens", "Output cap", "Set deliberately — runaway output is runaway cost"],
            ["top_p", "Nucleus sampling cutoff", "Leave alone if you are setting temperature"],
            [
              "stop sequences",
              "Hard end of generation",
              "Useful for structured or delimited output",
            ],
            [
              "system prompt",
              "Role, rules, refusal behaviour",
              "Versioned in the repo, never edited in a console",
            ],
          ],
        },
        bullets: [
          "Temperature 0 is not deterministic in practice — it is far more consistent, but do not promise a customer identical bytes on every run.",
          "Route by task: a small cheap model for classification and extraction, a frontier model only where reasoning genuinely matters. Most workloads are dominated by the former.",
          "Keep prompts reasonably portable. Prompts tuned to one vendor's quirks become lock-in you feel during their next outage.",
        ],
        links: [
          { label: "Anthropic — Claude documentation", href: "https://docs.anthropic.com/" },
          {
            label: "YouTube search — LLM parameters temperature top_p explained",
            href: YT("LLM temperature top_p sampling parameters explained"),
          },
        ],
      },
      {
        heading: "2. Prompt engineering",
        lede: "A few techniques carry almost all the value; the rest is folklore.",
        table: {
          caption: "Ranked by value per unit of effort.",
          headers: ["Technique", "What it does", "When it matters"],
          rows: [
            [
              "Be specific about the output",
              "Removes format and scope ambiguity",
              "Always — the highest-value change",
            ],
            [
              "Few-shot examples",
              "Demonstrates rather than describes",
              "Format and tone consistency; 2–5 examples",
            ],
            ["Role and context", "Shifts to the right register", "Domain language and audience"],
            [
              "Think before answering",
              "Reasoning tokens before the conclusion",
              "Multi-step logic, maths, analysis",
            ],
            [
              "Explicit 'I don't know' path",
              "Gives refusal a defined form",
              "Critical for grounded RAG answering",
            ],
            ['"Do not hallucinate"', "Nothing measurable", "Never — it is not a control surface"],
          ],
        },
        code: {
          title: "Example — prompt structure that survives production",
          lang: "python",
          source: `SYSTEM = """You are a support assistant for Acme's billing system.

Answer ONLY from the <context> provided. If the context does not contain the
answer, reply exactly: "I don't have that information."
Never guess an invoice number, amount, or date.
Cite the source id for every factual claim, like [doc:4491]."""

USER = f"""<context>
{retrieved_chunks}
</context>

<question>{question}</question>"""

# Why this shape works:
# 1. The refusal string is EXACT, so code can detect it — rather than parsing
#    fifty variants of "I'm not sure, but maybe...".
# 2. Delimiters separate instructions from data — the first line of defence
#    against prompt injection (step 5).
# 3. Citations make the answer auditable and give evals something to check.
# 4. The prohibition is SPECIFIC, not a vague plea for accuracy.`,
        },
        callout: {
          kind: "warn",
          title: "Prompts are code and must be versioned",
          text: "A prompt edited in a production console is an unversioned deployment with no review, no rollback and no way to correlate a quality regression with a change. Keep prompts in the repo, version them, and record which version served each request — that id is what turns 'it got worse this week' into a diff.",
        },
        links: [
          {
            label: "Anthropic — prompt engineering guide",
            href: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
          },
          {
            label: "YouTube search — prompt engineering techniques that work",
            href: YT("prompt engineering techniques few shot chain of thought tutorial"),
          },
        ],
      },
      {
        heading: "3. Structured outputs",
        lede: "Free text cannot be integrated. A guaranteed schema can — this is the enterprise unlock.",
        code: {
          title: "Example — schema-constrained extraction with the failure paths handled",
          lang: "python",
          source: `from pydantic import BaseModel, Field
from typing import Literal

class ExtractedInvoice(BaseModel):
    invoice_number: str = Field(pattern=r"^INV-\\d{4}-\\d{4}$")
    total_amount: float = Field(ge=0)
    currency: Literal["USD", "EUR", "GBP"]          # tight enum, not str
    due_date: str = Field(pattern=r"^\\d{4}-\\d{2}-\\d{2}$")
    # CRITICAL: let the model express uncertainty IN the schema. Without this
    # it must invent a value to satisfy the contract.
    confidence: Literal["high", "medium", "low"]
    missing_fields: list[str] = Field(default_factory=list)

response = client.messages.create(
    model="claude-sonnet-5",
    tools=[{"name": "extract_invoice",
            "input_schema": ExtractedInvoice.model_json_schema()}],
    tool_choice={"type": "tool", "name": "extract_invoice"},   # force the schema
    messages=[{"role": "user", "content": document_text}],
)
invoice = ExtractedInvoice(**response.content[0].input)

# Route by confidence — the human-in-the-loop seam that makes this deployable
# in finance, where a wrong number is a real incident.
if invoice.confidence != "high" or invoice.missing_fields:
    queue_for_human_review(invoice, document_text)
else:
    post_to_erp(invoice)`,
        },
        bullets: [
          "Always give the model a structured way to say 'I am not sure'. A schema with no uncertainty field forces confident invention.",
          "Schema validity is not correctness — a perfectly valid invoice number can be wrong. Validation checks shape; evals check truth.",
          "Routing on a confidence field is the cheapest path to a production-safe system.",
        ],
        links: [
          { label: "Pydantic — data validation documentation", href: "https://docs.pydantic.dev/" },
          {
            label: "YouTube search — structured outputs and function calling schemas",
            href: YT("LLM structured output JSON schema pydantic tutorial"),
          },
        ],
      },
      {
        heading: "4. RAG (retrieval-augmented generation)",
        lede: "When a RAG system answers badly, retrieval is wrong far more often than the model is.",
        diagram: {
          kind: "sequence",
          caption: "Most quality is won or lost before the model is involved at all.",
          actors: [
            { id: "u", label: "User" },
            { id: "r", label: "Retriever" },
            { id: "s", label: "Stores", sub: "vector + SQL" },
            { id: "m", label: "Model" },
          ],
          messages: [
            { from: "u", to: "r", label: "1. question", kind: "call" },
            {
              from: "r",
              to: "r",
              label: "2. rewrite: resolve 'it', expand acronyms",
              kind: "self",
              tone: "accent",
            },
            {
              from: "r",
              to: "s",
              label: "3. hybrid BM25 + vector, filtered by entitlement",
              kind: "call",
              tone: "accent",
            },
            { from: "s", to: "r", label: "4. ~50 candidates", kind: "return" },
            { from: "r", to: "r", label: "5. rerank → top 5", kind: "self" },
            { from: "r", to: "m", label: "6. question + grounded context", kind: "call" },
            { from: "m", to: "u", label: "7. answer with citations", kind: "return", tone: "ok" },
          ],
        },
        table: {
          caption: "Diagnosing a bad RAG answer — check in this order.",
          headers: ["Symptom", "Likely cause", "Fix"],
          rows: [
            [
              '"I don\'t have that" but the doc exists',
              "Retrieval missed it",
              "Hybrid search, query rewriting, chunk overlap",
            ],
            [
              "Confident and wrong",
              "Wrong chunks looked plausible",
              "Reranking; raise the relevance threshold",
            ],
            [
              "Ignores a retrieved fact",
              "Context too long — lost in the middle",
              "Fewer, better chunks; key context last",
            ],
            [
              "Shows another customer's data",
              "Filter applied after retrieval",
              "Filter IN the query — an access-control bug",
            ],
            [
              "Right facts, poor synthesis",
              "Genuinely the prompt",
              "Now it is worth changing the prompt",
            ],
          ],
        },
        callout: {
          kind: "insight",
          title: "Scope RAG projects as data projects",
          text: "Customers ask for 'a chatbot over our documents' and the work turns out to be 80% data engineering: finding where documents live, handling permissions, parsing PDFs and tables, deciding what is authoritative when three versions of a policy exist. Estimate accordingly and you will be far closer to reality.",
        },
        links: [
          {
            label: "RAG Explained — Retrieval Augmented Generation",
            href: "https://www.youtube.com/watch?v=IwvdDtN1gs8",
          },
          {
            label: "RAG in 20 minutes with a hands-on project",
            href: "https://www.youtube.com/watch?v=RosLeHGBLoY",
          },
          {
            label: "YouTube search — advanced RAG reranking hybrid search",
            href: YT("advanced RAG hybrid search reranking chunking strategies"),
          },
        ],
      },
      {
        heading: "5. Vector databases",
        lede: "An index over embeddings — and usually not the first thing you should reach for.",
        table: {
          caption: "Choosing a vector store for an enterprise deployment.",
          headers: ["Option", "Pick when", "Watch out"],
          rows: [
            [
              "pgvector (PostgreSQL)",
              "They already run Postgres — usually the right first answer",
              "Tune index params; plan for scale later",
            ],
            [
              "Managed (Pinecone, Weaviate)",
              "Large corpora, want it operated for you",
              "Procurement and data-residency review",
            ],
            [
              "Elasticsearch / OpenSearch",
              "They already run it and need hybrid search",
              "Vector support is newer than lexical",
            ],
            [
              "In-memory (FAISS)",
              "Prototype, or a small static corpus",
              "No persistence or multi-tenancy story",
            ],
          ],
        },
        bullets: [
          "One fewer system to procure is often worth more to an enterprise customer than marginal recall performance — pgvector wins deals for this reason.",
          "ANN indexes are approximate: HNSW and IVF trade recall for speed, and the parameters genuinely matter. Measure recall, do not assume it.",
          "Metadata filtering must happen inside the query, not after. Post-filtering means wrong-tenant documents were already fetched.",
        ],
        links: [
          {
            label: "pgvector — PostgreSQL vector extension",
            href: "https://github.com/pgvector/pgvector",
          },
          {
            label: "YouTube search — vector database HNSW indexing explained",
            href: YT("vector database HNSW ANN index explained tutorial"),
          },
        ],
      },
      {
        heading: "6. Tool / function calling",
        lede: "The model proposes a function and arguments; your code decides whether to execute.",
        code: {
          title: "Example — the loop, with the two control points marked",
          lang: "python",
          source: `tools = [{
    "name": "get_order_status",
    "description": "Look up the status of a customer order by id.",
    "input_schema": {"type": "object",
        "properties": {"order_id": {"type": "string", "pattern": "^ORD-[0-9]{6}$"}},
        "required": ["order_id"]},
}]
messages = [{"role": "user", "content": user_question}]

for step in range(MAX_STEPS):                  # ALWAYS bound the loop
    response = client.messages.create(model=MODEL, tools=tools, messages=messages)
    if response.stop_reason != "tool_use":
        return response                        # final answer

    for block in [b for b in response.content if b.type == "tool_use"]:
        # CONTROL POINT 1 — the model ASKED; you decide. Never dispatch blindly.
        if not is_allowed(current_user, block.name, block.input):
            result = {"error": "not permitted"}
        else:
            # CONTROL POINT 2 — revalidate. The schema is a hint to the model,
            # not a guarantee. Treat tool input as untrusted.
            result = dispatch(block.name, validate(block.input), as_user=current_user)

        messages.append({"role": "user", "content": [{
            "type": "tool_result", "tool_use_id": block.id, "content": str(result)}]})

raise StepBudgetExceeded()                     # loops that cannot end are outages`,
        },
        bullets: [
          "Tool descriptions are prompts. A vague description is the most common reason a model picks the wrong tool or fills arguments badly.",
          "Execute with the END USER's permissions, never the service account's — otherwise the model is a privilege-escalation path.",
          "Separate read tools from write tools, and require confirmation for anything destructive or financial.",
        ],
        links: [
          {
            label: "Anthropic — tool use documentation",
            href: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
          },
          {
            label: "YouTube search — LLM function calling tutorial",
            href: YT("LLM function calling tool use tutorial"),
          },
        ],
      },
      {
        heading: "7. AI agents",
        lede: "A model in a loop with tools. The engineering is entirely in the constraints.",
        body: [
          "Agents are genuinely useful when a task needs several steps whose sequence cannot be known in advance — investigating a ticket, reconciling a discrepancy, gathering evidence across systems. They are also the easiest way to build something that costs a fortune, loops forever, or takes an irreversible action nobody authorised.",
        ],
        table: {
          caption: "Non-negotiable limits for any agent near a customer's systems.",
          headers: ["Limit", "Why", "Typical value"],
          rows: [
            ["Step budget", "Loops that cannot terminate are outages", "10–25 steps"],
            [
              "Cost ceiling",
              "One runaway agent can cost thousands",
              "Hard cap per task, enforced in code",
            ],
            ["Wall-clock timeout", "A hung tool call blocks forever", "60–300 s"],
            [
              "Write-action approval",
              "Irreversible actions need a human",
              "Always for money, deletion, external messages",
            ],
            [
              "Full trace",
              "Debugging a loop without one is impossible",
              "Every step, tool, argument, result",
            ],
          ],
        },
        bullets: [
          "Prefer a fixed workflow whenever the steps are knowable — cheaper, testable, and far easier to explain to a risk team.",
          "Multi-agent designs multiply token cost several-fold and should be justified rather than assumed.",
          "Every agent needs an escape hatch that hands control to a human with the full trace attached.",
        ],
        links: [
          {
            label: "Anthropic — Building effective agents",
            href: "https://www.anthropic.com/research/building-effective-agents",
          },
          {
            label: "YouTube search — AI agent architectures ReAct planning",
            href: YT("AI agent architecture ReAct tool use loop tutorial"),
          },
        ],
      },
      {
        heading: "8. MCP (Model Context Protocol)",
        lede: "An open standard for exposing tools, resources and prompts — n×m becomes n+m.",
        body: [
          "MCP is a JSON-RPC protocol introduced by Anthropic that gives LLM applications a consistent way to connect to external tools and data. A host application runs a client; the client connects to servers that expose three primitives — tools (actions), resources (read-only context) and prompts (reusable templates). Build the server once and any compliant client can use it.",
        ],
        diagram: {
          kind: "compare",
          caption: "The integration arithmetic is the whole argument.",
          options: [
            {
              title: "Bespoke integrations",
              sub: "every app × every system",
              good: ["Total control over each", "No protocol to learn"],
              bad: [
                "n × m connectors to build and maintain",
                "Every assistant needs its own Salesforce integration",
                "Auth, errors and schemas reinvented each time",
              ],
              verdict: "Fine for one or two; collapses beyond that.",
            },
            {
              title: "MCP servers",
              sub: "expose once, any client consumes",
              tone: "ok",
              good: [
                "n + m instead of n × m",
                "One server for the customer's CRM serves every compliant client",
                "Standard primitives over JSON-RPC; stdio or HTTP transport",
              ],
              bad: [
                "A protocol and its versions to track",
                "Auth and permissions still designed per deployment",
              ],
              verdict: "The right default for enterprise tool exposure.",
            },
          ],
        },
        bullets: [
          "For an FDE this is the difference between integrating a customer's systems once versus once per assistant they adopt.",
          "The same permission rules apply: an MCP server must execute with the end user's authority, not a shared service account.",
          "Transports differ — stdio for local processes, HTTP for remote servers — with the same JSON-RPC payloads on both.",
        ],
        links: [
          {
            label: "Model Context Protocol — official site and specification",
            href: "https://modelcontextprotocol.io/",
          },
          {
            label: "MCP specification blog — latest revisions",
            href: "https://blog.modelcontextprotocol.io/",
          },
          {
            label: "YouTube search — Model Context Protocol explained and building servers",
            href: YT("Model Context Protocol MCP explained build server tutorial"),
          },
        ],
      },
      {
        heading: "9. Memory",
        lede: "Retrieval, not magic — which puts you back in RAG's problems and solutions.",
        table: {
          caption: "Three different things all called 'memory'.",
          headers: ["Type", "Mechanism", "Watch out"],
          rows: [
            [
              "Conversation context",
              "Recent turns in the prompt",
              "Grows until it blows the window and the budget",
            ],
            [
              "Summarised history",
              "Periodically compress older turns",
              "Summarisation loses the detail you later need",
            ],
            [
              "Long-term facts",
              "Extract facts, store, retrieve relevant ones",
              "It is RAG — with the same retrieval failure modes",
            ],
          ],
        },
        bullets: [
          "Bound the conversation window explicitly. An unbounded chat history is a slow-motion cost incident.",
          "Store extracted facts with provenance and a timestamp, or the assistant will confidently repeat something the user corrected months ago.",
          "Memory is per-user data: it inherits every privacy, retention and erasure obligation from step 6.",
        ],
        links: [
          {
            label: "YouTube search — LLM memory conversation summarisation patterns",
            href: YT("LLM agent memory conversation summarization long term memory"),
          },
          {
            label: "Site: privacy and retention obligations (step 6)",
            href: "/fde/enterprise-integration",
          },
        ],
      },
      {
        heading: "10. Multimodal AI",
        lede: "Images, audio and documents as input — and where it genuinely changes an enterprise use case.",
        body: [
          "Vision capability matters most for documents. Scanned invoices, engineering diagrams, screenshots in support tickets and photographs of damage are everywhere in enterprise workflows, and previously required separate OCR pipelines that lost table structure.",
        ],
        bullets: [
          "Vision models often beat traditional OCR on layout-heavy documents because they read the table as a table rather than as stray text.",
          "Images cost tokens too, and high-resolution pages can be expensive — measure on the customer's real documents before quoting.",
          "Ask about document quality during discovery: phone photographs of paper forms behave very differently from clean digital PDFs.",
        ],
        links: [
          {
            label: "Anthropic — vision documentation",
            href: "https://docs.anthropic.com/en/docs/build-with-claude/vision",
          },
          {
            label: "YouTube search — multimodal LLM document extraction OCR",
            href: YT("multimodal LLM vision document extraction OCR tutorial"),
          },
        ],
      },
    ],
    related: [
      "/fde/production-ai-engineering",
      "/fde/ai-reliability-genaiops",
      "/fde/system-design-for-ai",
    ],
    furtherReading: [
      { label: "Model Context Protocol — specification", href: "https://modelcontextprotocol.io/" },
      {
        label: "Anthropic — building effective agents",
        href: "https://www.anthropic.com/research/building-effective-agents",
      },
      { label: "Anthropic — documentation", href: "https://docs.anthropic.com/" },
    ],
  },
];
