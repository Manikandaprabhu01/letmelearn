import type { Concept } from "@/data/types";

export const fdeAiEngineering: Concept[] = [
  {
    slug: "ai-engineering",
    title: "AI Engineering",
    subtitle:
      "LLMs, prompt engineering, structured outputs, RAG, vector DBs, tool calling, agents, MCP, memory, multimodal",
    level: "intermediate",
    minutes: 34,
    tags: ["llm", "rag", "agents", "mcp", "tool calling", "structured output"],
    summary:
      "This is the craft layer — where a model becomes a feature. The through-line is control: a raw LLM produces free text from its training distribution, and every technique here narrows that down to something an enterprise system can consume. Structured outputs constrain the shape, RAG constrains the facts, tool calling constrains the actions, and agents chain those under a control loop that must itself be bounded.",
    keyPoints: [
      "Structured output turns a language model into an API you can program against — this is the unlock for enterprise integration.",
      "RAG is a retrieval problem wearing an AI costume: if retrieval is wrong, no model and no prompt can save the answer.",
      "Tool calling is the model choosing a function and arguments; your code decides whether to execute, which is where all the safety lives.",
      "MCP standardises tool exposure so one server works with any compliant client, turning an n×m integration problem into n+m.",
      "Agents are loops, and every agent needs a hard step budget, a cost ceiling and an escape hatch.",
    ],
    prerequisites: ["/fde/ai-ml-fundamentals"],
    sections: [
      {
        heading: "Prompt engineering, minus the folklore",
        lede: "A few techniques carry almost all the value; the rest is superstition.",
        table: {
          caption: "What actually moves quality, ranked by value per unit of effort.",
          headers: ["Technique", "What it does", "When it matters"],
          rows: [
            [
              "Be specific about the output",
              "Removes ambiguity about format and scope",
              "Always — the highest-value change",
            ],
            [
              "Few-shot examples",
              "Demonstrates the pattern instead of describing it",
              "Format and tone consistency; 2–5 examples",
            ],
            [
              "Give it a role and context",
              "Shifts the distribution toward the right register",
              "Domain-specific language and audience",
            ],
            [
              "Let it think before answering",
              "Reasoning tokens before the conclusion improve accuracy",
              "Multi-step logic, maths, analysis",
            ],
            [
              "Say what to do when unsure",
              "Provides an explicit 'I don't know' path",
              "Grounded answering — critical for RAG",
            ],
            ['"Do not hallucinate"', "Nothing measurable", "Never — it is not a control surface"],
          ],
        },
        code: {
          title: "Prompt structure that survives production",
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
# 1. The refusal string is EXACT, so downstream code can detect it reliably
#    rather than trying to parse "I'm not sure, but maybe..." in fifty variants.
# 2. Delimiters (<context>, <question>) separate instructions from data, which
#    is also the first line of defence against prompt injection (step 5).
# 3. Citations make the answer auditable — the customer can verify it, and your
#    evals can check whether cited chunks actually support the claim.
# 4. The prohibition is SPECIFIC ("never guess an invoice number"), not a vague
#    instruction to be accurate.`,
        },
        callout: {
          kind: "warn",
          title: "Prompts are code and must be versioned",
          text: "A prompt edited directly in a production console is an unversioned deployment with no review, no rollback and no way to correlate a quality regression with a change. Keep prompts in the repository, version them, and record which version served each request — that identifier is what turns 'it got worse this week' into a diff.",
        },
      },
      {
        heading: "Structured outputs: the enterprise unlock",
        lede: "Free text cannot be integrated. A guaranteed schema can.",
        body: [
          "The single technique that most often converts a demo into a deployable system is constraining the model to a schema. Once output is guaranteed-valid JSON matching a contract, the model becomes just another service in the customer's architecture — its response can be validated, persisted, routed and passed to systems that have no idea an LLM was involved.",
        ],
        code: {
          title: "Schema-constrained extraction, with the failure paths handled",
          lang: "python",
          source: `from pydantic import BaseModel, Field
from typing import Literal

class ExtractedInvoice(BaseModel):
    invoice_number: str = Field(pattern=r"^INV-\\d{4}-\\d{4}$")
    total_amount: float = Field(ge=0)
    currency: Literal["USD", "EUR", "GBP"]
    due_date: str = Field(pattern=r"^\\d{4}-\\d{2}-\\d{2}$")
    # CRITICAL: give the model a way to express uncertainty IN the schema.
    # Without this it must invent a value to satisfy the contract.
    confidence: Literal["high", "medium", "low"]
    missing_fields: list[str] = Field(default_factory=list)

response = client.messages.create(
    model="claude-sonnet-5",
    tools=[{
        "name": "extract_invoice",
        "input_schema": ExtractedInvoice.model_json_schema(),
    }],
    tool_choice={"type": "tool", "name": "extract_invoice"},   # force the schema
    messages=[{"role": "user", "content": document_text}],
)

invoice = ExtractedInvoice(**response.content[0].input)

# Route by confidence rather than trusting every extraction equally.
# This is the human-in-the-loop seam (step 5) and it is what makes the
# system deployable in finance, where a wrong number is a real incident.
if invoice.confidence != "high" or invoice.missing_fields:
    queue_for_human_review(invoice, document_text)
else:
    post_to_erp(invoice)`,
        },
        bullets: [
          "Always give the model a structured way to say 'I am not sure'. A schema with no uncertainty field forces confident-looking invention, because the contract demands a value.",
          "Schema validity is not correctness. The model can return a perfectly valid invoice number that is wrong — validation checks shape, evals check truth.",
          "Constrain enums tightly. 'currency: str' invites 'US Dollars', 'usd' and '$'; a Literal produces one of three exact values.",
          "Routing on a confidence field is the cheapest path to a production-safe system: high confidence flows through, anything else goes to review.",
        ],
      },
      {
        heading: "RAG: a retrieval problem, not a model problem",
        lede: "When a RAG system gives a bad answer, the retrieval is wrong far more often than the model is.",
        diagram: {
          kind: "sequence",
          caption:
            "Every stage is a place quality is won or lost — and most losses happen before the model is involved.",
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
              label: "3. hybrid: BM25 + vector, filtered by entitlement",
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
              '"I don\'t have that information" but the doc exists',
              "Retrieval missed it",
              "Hybrid search, query rewriting, chunk overlap",
            ],
            [
              "Answer is confident and wrong",
              "Wrong chunks retrieved and looked plausible",
              "Reranking; raise the relevance threshold",
            ],
            [
              "Answer ignores a retrieved fact",
              "Context too long — lost in the middle",
              "Fewer, better chunks; put key context last",
            ],
            [
              "User sees another customer's data",
              "Filter applied after retrieval, or not at all",
              "Filter at the query — an access-control bug",
            ],
            [
              "Right facts, poor synthesis",
              "Genuinely a model or prompt issue",
              "Now it is worth changing the prompt",
            ],
          ],
        },
        bullets: [
          "Query rewriting matters more than people expect: 'and what about the enterprise tier?' is meaningless without conversation context, and embedding it raw retrieves nothing useful.",
          "Entitlement filtering must happen inside the retrieval query, never as a post-filter on results. Post-filtering means the wrong documents were already fetched, and one bug away from being shown.",
          "More context is not better. Models attend unevenly across long contexts, so five precise chunks routinely beat fifty mediocre ones — and cost far less.",
          "Evaluate retrieval separately from generation. Measuring only end-to-end answer quality leaves you unable to tell which half is broken.",
        ],
        callout: {
          kind: "insight",
          title: "The FDE framing",
          text: "Customers ask for 'a chatbot over our documents' and the work turns out to be 80% data engineering: finding where documents live, handling permissions, parsing PDFs and tables, deciding what is authoritative when three versions of a policy exist. Scope RAG projects as data projects and the estimate will be far closer to reality.",
        },
      },
      {
        heading: "Tool calling and MCP",
        lede: "The model proposes a function call; your code decides whether to run it. That boundary is the entire safety story.",
        code: {
          title: "The tool-calling loop, with the control points marked",
          lang: "python",
          source: `tools = [{
    "name": "get_order_status",
    "description": "Look up the status of a customer order by id.",
    "input_schema": {
        "type": "object",
        "properties": {"order_id": {"type": "string", "pattern": "^ORD-[0-9]{6}$"}},
        "required": ["order_id"],
    },
}]

messages = [{"role": "user", "content": user_question}]

for step in range(MAX_STEPS):                      # ALWAYS bound the loop
    response = client.messages.create(model=MODEL, tools=tools, messages=messages)

    if response.stop_reason != "tool_use":
        return response                            # model produced a final answer

    for block in [b for b in response.content if b.type == "tool_use"]:
        # CONTROL POINT 1 — the model asked; you decide. Never dispatch blindly.
        if not is_allowed(current_user, block.name, block.input):
            result = {"error": "not permitted"}
        else:
            # CONTROL POINT 2 — validate arguments again. The schema is a hint to
            # the model, not a guarantee; treat tool input as untrusted.
            result = dispatch(block.name, validate(block.input), as_user=current_user)

        messages.append({"role": "user", "content": [{
            "type": "tool_result", "tool_use_id": block.id, "content": str(result),
        }]})

raise StepBudgetExceeded()                         # loops that cannot end are outages`,
        },
        bullets: [
          "Tool descriptions are prompts. A vague description is the most common reason a model picks the wrong tool or fills arguments badly — write them for the model, not for your colleagues.",
          "Execute tools with the end user's permissions, never the service account's. Otherwise the model becomes a privilege-escalation path: ask it nicely and it reads a record the user could not.",
          "Separate read tools from write tools, and require confirmation for anything destructive or financial. 'The agent refunded the wrong customer' is a career-defining incident.",
          "MCP standardises all of this: a server exposes tools, resources and prompts over JSON-RPC, and any compliant client can use it — so one integration serves every assistant rather than one per product.",
        ],
        diagram: {
          kind: "compare",
          caption: "Why MCP exists: the integration maths.",
          options: [
            {
              title: "Bespoke integrations",
              sub: "every app × every system",
              good: ["Total control over each one", "No protocol to learn"],
              bad: [
                "n × m connectors to build and maintain",
                "Each assistant needs its own version of the same Salesforce integration",
                "Auth, errors and schemas reinvented every time",
              ],
              verdict: "Fine for one or two integrations; collapses beyond that.",
            },
            {
              title: "MCP servers",
              sub: "expose once, any client consumes",
              tone: "ok",
              good: [
                "n + m instead of n × m",
                "One server for the customer's CRM works with every compliant client",
                "Tools, resources and prompts as standard primitives over JSON-RPC",
              ],
              bad: [
                "A protocol and its versions to track",
                "Still need auth and permission design per deployment",
              ],
              verdict: "The right default for enterprise tool exposure in 2026.",
            },
          ],
        },
      },
      {
        heading: "Agents and memory: loops that must be bounded",
        lede: "An agent is a model in a loop with tools. The engineering is entirely in the constraints.",
        body: [
          "Agents are genuinely useful when a task requires several steps whose sequence cannot be known in advance — investigating a support ticket, reconciling a discrepancy, gathering evidence across systems. They are also the easiest way to build something that costs a fortune, loops forever, or takes an irreversible action nobody authorised. The difference is whether the loop has hard limits.",
        ],
        table: {
          caption: "Non-negotiable limits for any agent going near a customer's systems.",
          headers: ["Limit", "Why", "Typical value"],
          rows: [
            ["Step budget", "Loops that cannot terminate are outages", "10–25 steps"],
            [
              "Token / cost ceiling",
              "One runaway agent can cost thousands",
              "Hard cap per task, enforced in code",
            ],
            ["Wall-clock timeout", "A hung tool call blocks the task forever", "60–300 s"],
            [
              "Write-action approval",
              "Irreversible actions need a human",
              "Always for money, deletion, external messages",
            ],
            [
              "Full trace",
              "Debugging a loop without one is impossible",
              "Every step, tool, argument and result",
            ],
          ],
        },
        bullets: [
          "Prefer a fixed workflow to an agent whenever the steps are known. A deterministic pipeline is cheaper, faster, testable and far easier to explain to a customer's risk team.",
          "Memory is retrieval, not magic. 'Long-term memory' in practice means summarising the conversation, storing facts, and retrieving the relevant ones — which puts you back in RAG's problems and solutions.",
          "Multi-agent designs multiply token cost several-fold and should be justified rather than assumed. Most tasks sold as multi-agent are one agent with good tools.",
          "Every agent needs an escape hatch that hands control to a human with the full trace attached, because the interesting failures are the ones you did not anticipate.",
        ],
      },
    ],
    related: [
      "/fde/production-ai-engineering",
      "/fde/ai-reliability-genaiops",
      "/fde/system-design-for-ai",
      "/examples/google-search",
    ],
    furtherReading: [
      { label: "Model Context Protocol — specification", href: "https://modelcontextprotocol.io/" },
      {
        label: "Anthropic — building effective agents",
        href: "https://www.anthropic.com/research/building-effective-agents",
      },
    ],
  },
];
