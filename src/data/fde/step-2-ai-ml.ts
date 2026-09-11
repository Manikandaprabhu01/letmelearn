import type { Concept } from "@/data/types";

export const fdeAiMl: Concept[] = [
  {
    slug: "ai-ml-fundamentals",
    title: "AI / ML Fundamentals",
    subtitle: "ML basics, deep learning basics, NLP, transformers, embeddings",
    level: "foundational",
    minutes: 24,
    tags: ["ml", "deep learning", "nlp", "transformers", "embeddings"],
    summary:
      "You will not train a foundation model as an FDE. You will constantly explain why one behaves the way it does — why it invented a policy number, why it forgot the middle of a document, why two obviously similar sentences did not match in search. This step is the mental model that turns those from mysteries into predictable consequences of how the machinery works.",
    keyPoints: [
      "A transformer predicts the next token from attention over a context window; every behaviour people call 'reasoning' or 'hallucination' follows from that.",
      "Embeddings turn meaning into geometry, which is what makes semantic search possible — and what makes it fail on exact identifiers.",
      "Tokenisation explains cost, context limits, and a surprising number of odd failures with numbers and code.",
      "Knowing when a classical ML model beats an LLM is an FDE skill: it is often cheaper, faster and more accurate.",
    ],
    prerequisites: ["/fde/software-engineering-foundation"],
    sections: [
      {
        heading: "The part that matters: what the model is actually doing",
        lede: "Next-token prediction over a context window, and nothing more mystical than that.",
        body: [
          "A large language model takes a sequence of tokens and produces a probability distribution over the next token. It samples one, appends it, and repeats. There is no lookup of facts, no internal database, no checking. When it produces a correct policy number it is because that sequence was highly probable given the context; when it invents one, the same mechanism produced a plausible sequence that happened to be false. The model has no way to tell those two cases apart, which is the single most important fact to internalise.",
        ],
        diagram: {
          kind: "flow",
          caption:
            "Everything downstream — RAG, agents, guardrails — exists to constrain this loop.",
          rows: [
            [
              { id: "t", label: "Tokenise", sub: "text → integers" },
              { id: "e", label: "Embed", sub: "integers → vectors" },
              { id: "a", label: "Attention layers", sub: "weigh the context", tone: "accent" },
            ],
            [
              { id: "p", label: "Probability distribution", sub: "over the vocabulary" },
              { id: "s", label: "Sample one token", sub: "temperature, top-p" },
              { id: "loop", label: "Append and repeat", sub: "until stop", tone: "ok" },
            ],
          ],
        },
        callout: {
          kind: "insight",
          title: "Why 'hallucination' is a design constraint, not a bug to be fixed",
          text: "The model is doing exactly the same thing when it is right and when it is wrong: producing a likely continuation. There is no internal signal distinguishing recall from invention. That is why the engineering answer is never 'prompt it not to hallucinate' — it is grounding (step 3), verification, and constrained output. Explaining this clearly to a sceptical customer executive is a genuine FDE skill.",
        },
      },
      {
        heading: "Tokenisation: the source of a surprising number of bugs",
        lede: "Models see tokens, not characters or words — and the gap causes real, diagnosable failures.",
        code: {
          title: "Why the model 'cannot count letters' and why your bill is what it is",
          lang: "python",
          source: `# Tokens are sub-word fragments. English averages ~4 characters per token,
# but the split is learned, not logical.
"strawberry"      -> ["str", "aw", "berry"]      # 3 tokens
"1234567890"      -> ["123", "456", "789", "0"]  # digits chunk arbitrarily
"Schadenfreude"   -> ["Sch", "aden", "f", "reude"]
"你好世界"          -> often 1 token PER CHARACTER — non-Latin scripts cost far more

# CONSEQUENCE 1: "how many r's in strawberry" is hard not because the model is
# stupid, but because it never sees individual letters — it sees three chunks.

# CONSEQUENCE 2: arithmetic on long numbers is unreliable because the digits
# were split at meaningless boundaries. Use a calculator tool (step 3), not
# a better prompt.

# CONSEQUENCE 3: cost and context limits are measured in tokens, so a customer
# in Japan or Greece pays materially more per page than one in the US.
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
len(enc.encode(open("contract.txt").read()))   # measure BEFORE you design the chunking`,
        },
        bullets: [
          "Always measure token counts on the customer's real documents rather than estimating from page counts. Legal PDFs, tables and code tokenise far worse than prose.",
          "Non-English content can cost two to three times more per unit of meaning, which matters when you are quoting a per-document price to a multinational.",
          "If a task needs exact character or digit manipulation, give the model a tool rather than a better prompt — the limitation is structural.",
          "Token counts drive chunk sizing in RAG, the context budget for agents, and the cost model you present to the customer. It is the unit everything else is denominated in.",
        ],
      },
      {
        heading: "Embeddings: meaning as geometry",
        lede: "The mechanism behind semantic search, and the reason it misses exact identifiers.",
        body: [
          "An embedding maps a piece of text to a vector of several hundred or a few thousand numbers, positioned so that texts with similar meaning land near each other. Similarity is then a geometric operation — usually cosine similarity. This is what lets a user search for 'how do I get my money back' and match a document titled 'Refund Policy' that shares not a single word with the query.",
        ],
        code: {
          title: "What semantic search is good at, and where it quietly fails",
          lang: "python",
          source: `from openai import OpenAI
import numpy as np

def embed(texts: list[str]) -> np.ndarray:
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return np.array([d.embedding for d in resp.data])

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

v = embed([
    "How do I get my money back?",     # 0
    "Refund Policy",                   # 1  — no shared words, close in meaning
    "Invoice INV-2024-8891",           # 2
    "Invoice INV-2024-8892",           # 3  — one digit apart, DIFFERENT invoice
])

cosine(v[0], v[1])   # ~0.82  semantic match with zero lexical overlap  ✅
cosine(v[2], v[3])   # ~0.99  near-identical vectors for two different invoices  ❌

# THE LESSON: embeddings encode meaning, and "INV-2024-8891" and "INV-2024-8892"
# MEAN almost the same thing — "an invoice identifier". For exact lookup you need
# keyword/lexical search or a database query. This is why production retrieval is
# hybrid: BM25 or SQL for identifiers, vectors for concepts.`,
        },
        table: {
          caption: "Choosing a retrieval method by what the user is actually asking for.",
          headers: ["Query type", "Example", "Right tool"],
          rows: [
            ["Conceptual", '"how do I cancel"', "Vector search"],
            [
              "Exact identifier",
              '"invoice INV-2024-8891"',
              "Keyword / SQL — vectors will confuse neighbours",
            ],
            ["Filtered", '"open tickets for this customer"', "SQL with a WHERE clause"],
            [
              "Mixed",
              '"refund policy for enterprise tier"',
              "Hybrid: filter by tier, then rank semantically",
            ],
            [
              "Aggregate",
              '"how many tickets last month"',
              "SQL — an LLM should never count by reading",
            ],
          ],
        },
        bullets: [
          "Embedding models are not interchangeable: vectors from one model are meaningless to another, so changing models means re-embedding the entire corpus. Budget for that before choosing.",
          "Chunk size is a real design decision. Too small and a chunk lacks context; too large and the specific answer is diluted by surrounding text and retrieved less reliably.",
          "Domain language degrades general embedding models. A customer whose documents are full of internal acronyms may need a fine-tuned or hybrid approach.",
          "Cosine similarity has no absolute meaning — 0.82 is not 'good' in the abstract. Calibrate the threshold against the customer's own data or you will either drown in noise or return nothing.",
        ],
      },
      {
        heading: "When not to use an LLM",
        lede: "The most valuable judgment in this step, and the one that builds customer trust fastest.",
        table: {
          caption: "Classical ML and plain code still win a great deal of the time.",
          headers: ["Task", "LLM", "Better option", "Why"],
          rows: [
            [
              "Fixed-label classification at volume",
              "Works, ~£££",
              "Fine-tuned small classifier",
              "100× cheaper, faster, more consistent",
            ],
            [
              "Numeric prediction from tabular data",
              "Poor",
              "Gradient boosting",
              "Tabular is where trees still dominate",
            ],
            [
              "Exact extraction from fixed forms",
              "Overkill",
              "Regex or a parser",
              "Deterministic and free",
            ],
            [
              "Anomaly detection on metrics",
              "Wrong tool",
              "Statistical / time-series model",
              "LLMs cannot see distributions",
            ],
            ["Open-ended reasoning over text", "Excellent", "—", "This is the genuine capability"],
            [
              "Turning ambiguous language into structure",
              "Excellent",
              "—",
              "The strongest practical use",
            ],
          ],
        },
        bullets: [
          "A customer asking for 'AI' usually means 'solve this problem'. Proposing a cheaper non-LLM solution where one fits is what makes you credible rather than a vendor pushing tokens.",
          "The genuinely strong LLM use cases share a shape: unstructured input, fuzzy rules, and tolerance for review. Look for that shape when scoping in step 8.",
          "Hybrid designs are normal and underrated — an LLM that routes to a deterministic function is often the best of both.",
          "Fine-tuning is rarely the first answer. Retrieval and prompt design solve most problems; fine-tuning is for style, format and narrow classification at volume.",
        ],
        callout: {
          kind: "interview",
          title: "The sentence that earns trust in a scoping meeting",
          text: '"Before we design an LLM solution, let me check whether this needs one — you have a fixed set of twelve categories and a hundred thousand labelled examples, which a small classifier will handle more accurately, more cheaply and more consistently than a language model. Let me use the LLM budget where the input is genuinely unstructured."',
        },
      },
    ],
    related: ["/fde/ai-engineering", "/fde/software-engineering-foundation", "/hld/caching"],
    furtherReading: [
      {
        label: "The Illustrated Transformer — Jay Alammar",
        href: "https://jalammar.github.io/illustrated-transformer/",
      },
      { label: "Attention Is All You Need", href: "https://arxiv.org/abs/1706.03762" },
    ],
  },
];
