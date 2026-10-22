import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeAiMl: Concept[] = [
  {
    slug: "ai-ml-fundamentals",
    title: "AI / ML Fundamentals",
    subtitle: "ML basics, deep learning basics, NLP, transformers, embeddings",
    level: "foundational",
    minutes: 34,
    tags: ["ml", "deep learning", "nlp", "transformers", "embeddings", "tokenisation"],
    summary:
      "You will not train a foundation model as an FDE. You will constantly explain why one behaves the way it does — why it invented a policy number, why it forgot the middle of a document, why two similar sentences did not match. Each concept below is broken out with the mental model, a worked example, and where to study it properly.",
    keyPoints: [
      "A transformer predicts the next token from attention over a context window; 'reasoning' and 'hallucination' both follow from that.",
      "Embeddings turn meaning into geometry — which is why semantic search fails on exact identifiers.",
      "Tokenisation explains cost, context limits, and odd failures with numbers and non-English text.",
      "Knowing when classical ML beats an LLM is an FDE skill: often cheaper, faster and more accurate.",
    ],
    prerequisites: ["/fde/software-engineering-foundation"],
    sections: [
      {
        heading: "1. ML basics",
        lede: "Supervised learning, features, training and the one failure mode that matters: overfitting.",
        body: [
          "Classical machine learning learns a function from labelled examples. It still wins decisively on tabular data, fixed-label classification and numeric prediction — which matters because customers ask for 'AI' when a gradient-boosted tree would be cheaper, faster and more accurate.",
        ],
        table: {
          caption: "Where each approach genuinely wins — the judgment that builds customer trust.",
          headers: ["Task", "Best tool", "Why"],
          rows: [
            [
              "Fixed-label classification at volume",
              "Fine-tuned small classifier",
              "~100× cheaper and more consistent than an LLM",
            ],
            [
              "Numeric prediction from tabular data",
              "Gradient boosting (XGBoost)",
              "Trees still dominate tabular problems",
            ],
            ["Exact extraction from fixed forms", "Regex or a parser", "Deterministic and free"],
            [
              "Anomaly detection on metrics",
              "Statistical / time-series model",
              "LLMs cannot see distributions",
            ],
            ["Open-ended reasoning over text", "LLM", "This is the genuine capability"],
            ["Ambiguous language → structure", "LLM", "The strongest practical use"],
          ],
        },
        bullets: [
          "Overfitting is memorising the training set instead of learning the pattern — the reason you always hold out a test set you never train on.",
          "A customer asking for 'AI' usually means 'solve this problem'. Proposing a cheaper non-LLM solution where one fits is what makes you credible.",
          "Hybrid designs are normal: an LLM that routes to a deterministic function is often the best of both.",
        ],
        links: [
          {
            label: "StatQuest — machine learning concepts explained clearly",
            href: "https://www.youtube.com/@statquest",
          },
          {
            label: "YouTube search — supervised learning and overfitting explained",
            href: YT("supervised learning overfitting train test split explained"),
          },
        ],
      },
      {
        heading: "2. Deep learning basics",
        lede: "Neural networks, backpropagation, and why scale changed what was possible.",
        body: [
          "A neural network is layers of weighted sums and non-linearities; training adjusts the weights by gradient descent so predictions improve. You will not implement this, but the vocabulary — parameters, layers, gradients, fine-tuning — appears in every conversation about model choice and cost.",
        ],
        bullets: [
          "Parameters are the learned weights. 'A 70B model' means 70 billion of them — this is what drives memory, cost and latency.",
          "Fine-tuning adjusts an existing model's weights on your data. It is for style, format and narrow classification — not for teaching facts, which is what retrieval is for.",
          "Inference is one forward pass. Training is millions of them plus gradients, which is why one is cents and the other is millions.",
        ],
        links: [
          {
            label: "Andrej Karpathy — Neural Networks: Zero to Hero (full course)",
            href: "https://karpathy.ai/zero-to-hero.html",
          },
          {
            label: "Karpathy — the spelled-out intro to backpropagation (micrograd)",
            href: "https://youtu.be/VMj-3S1tku0",
          },
          {
            label: "3Blue1Brown — the visual neural network series",
            href: "https://www.youtube.com/@3blue1brown",
          },
        ],
      },
      {
        heading: "3. NLP and tokenisation",
        lede: "Models see tokens, not characters — and that gap causes real, diagnosable bugs.",
        code: {
          title: "Example — why it 'cannot count letters' and why your bill is what it is",
          lang: "python",
          source: `# Tokens are sub-word fragments; the split is learned, not logical.
"strawberry"    -> ["str", "aw", "berry"]        # 3 tokens
"1234567890"    -> ["123", "456", "789", "0"]    # digits chunk arbitrarily
"你好世界"        -> often 1 token PER CHARACTER   # non-Latin costs far more

# CONSEQUENCE 1: "how many r's in strawberry" is hard because the model never
# sees letters — it sees three chunks. Not stupidity; structure.
# CONSEQUENCE 2: arithmetic on long numbers is unreliable — digits were split
# at meaningless boundaries. Give it a calculator TOOL, not a better prompt.
# CONSEQUENCE 3: a customer in Japan or Greece pays materially more per page.

import tiktoken
enc = tiktoken.get_encoding("cl100k_base")
len(enc.encode(open("contract.txt").read()))   # MEASURE before you design chunking`,
        },
        bullets: [
          "Always count tokens on the customer's real documents. Legal PDFs, tables and code tokenise far worse than prose.",
          "Token counts drive chunk sizing, context budgets and the price you quote — it is the unit everything is denominated in.",
          "If a task needs exact character or digit manipulation, the limitation is structural: use a tool.",
        ],
        links: [
          {
            label: "Karpathy — Let's build the GPT Tokenizer",
            href: "https://youtu.be/zduSFxRajkE",
          },
          {
            label: "OpenAI Tokenizer — see the split interactively",
            href: "https://platform.openai.com/tokenizer",
          },
        ],
      },
      {
        heading: "4. Transformers and attention",
        lede: "Next-token prediction over a context window — and nothing more mystical than that.",
        body: [
          "A transformer takes a sequence of tokens and produces a probability distribution over the next token. It samples one, appends it, and repeats. There is no fact lookup and no internal checking. When it produces a correct policy number, that sequence was highly probable; when it invents one, the same mechanism produced a plausible sequence that happened to be false. The model cannot tell those apart — which is the single most important fact to internalise.",
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
          title: "Why 'hallucination' is a design constraint, not a bug to fix",
          text: "The model does exactly the same thing when it is right and when it is wrong: produce a likely continuation. There is no internal signal separating recall from invention. That is why the engineering answer is never 'prompt it not to hallucinate' — it is grounding, verification and constrained output. Explaining this clearly to a sceptical executive is a genuine FDE skill.",
        },
        links: [
          {
            label: "Karpathy — Let's build GPT: from scratch, in code, spelled out",
            href: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
          },
          {
            label: "3Blue1Brown — visual explanations of transformers and attention",
            href: "https://www.youtube.com/@3blue1brown",
          },
          {
            label: "Transformer Explainer — interactive, in-browser",
            href: "https://poloclub.github.io/transformer-explainer/",
          },
          {
            label: "MLU-Explain — interactive visual explanations of core ML",
            href: "https://mlu-explain.github.io",
          },
          {
            label: "The Illustrated Transformer — Jay Alammar",
            href: "https://jalammar.github.io/illustrated-transformer/",
          },
          {
            label: "Attention Is All You Need (the original paper)",
            href: "https://arxiv.org/abs/1706.03762",
          },
          {
            label: "Language Models are Few-Shot Learners — GPT-3, why prompting works",
            href: "https://arxiv.org/abs/2005.14165",
          },
          {
            label: "Chain-of-Thought Prompting Elicits Reasoning in LLMs",
            href: "https://arxiv.org/abs/2201.11903",
          },
          {
            label: "BERT — bidirectional pre-training, the encoder side of the family",
            href: "https://arxiv.org/pdf/1810.04805",
          },
        ],
      },
      {
        heading: "5. Embeddings and vector similarity",
        lede: "Meaning as geometry — the mechanism behind semantic search, and its blind spot.",
        code: {
          title: "Example — what semantic search is good at, and where it quietly fails",
          lang: "python",
          source: `v = embed([
    "How do I get my money back?",   # 0
    "Refund Policy",                 # 1  — no shared words, same meaning
    "Invoice INV-2024-8891",         # 2
    "Invoice INV-2024-8892",         # 3  — one digit apart, DIFFERENT invoice
])

cosine(v[0], v[1])   # ~0.82  semantic match, zero lexical overlap        ✅
cosine(v[2], v[3])   # ~0.99  near-identical vectors, different invoices  ❌

# THE LESSON: embeddings encode MEANING, and both invoice strings mean
# "an invoice identifier". For exact lookup you need keyword search or SQL.
# This is why production retrieval is HYBRID: BM25/SQL for identifiers,
# vectors for concepts.`,
        },
        table: {
          caption: "Choose the retrieval method by what the user is actually asking for.",
          headers: ["Query type", "Example", "Right tool"],
          rows: [
            ["Conceptual", '"how do I cancel"', "Vector search"],
            ["Exact identifier", '"invoice INV-2024-8891"', "Keyword / SQL"],
            ["Filtered", '"open tickets for this customer"', "SQL WHERE clause"],
            [
              "Mixed",
              '"refund policy for enterprise tier"',
              "Hybrid: filter, then rank semantically",
            ],
            ["Aggregate", '"how many tickets last month"', "SQL — never count by reading"],
          ],
        },
        bullets: [
          "Vectors from one embedding model are meaningless to another — changing models means re-embedding the whole corpus. Budget for that before choosing.",
          "Cosine similarity has no absolute meaning: 0.82 is not 'good' in the abstract. Calibrate the threshold on the customer's own data.",
          "Chunk size is a real decision: too small lacks context, too large dilutes the specific answer and retrieves less reliably.",
        ],
        links: [
          {
            label: "YouTube search — embeddings and vector similarity explained",
            href: YT("text embeddings vector similarity cosine explained"),
          },
          { label: "Site: how this feeds RAG (step 3)", href: "/fde/ai-engineering" },
        ],
      },
    ],
    related: ["/fde/ai-engineering", "/fde/software-engineering-foundation", "/hld/caching"],
    furtherReading: [
      {
        label: "Andrej Karpathy — Neural Networks: Zero to Hero",
        href: "https://karpathy.ai/zero-to-hero.html",
      },
      {
        label: "The Illustrated Transformer",
        href: "https://jalammar.github.io/illustrated-transformer/",
      },
      { label: "3Blue1Brown", href: "https://www.youtube.com/@3blue1brown" },
    ],
  },
];
