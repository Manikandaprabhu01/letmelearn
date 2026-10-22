import { useMemo, useState } from "react";

type Section = { heading: string; text: string };
type Chunk = { id: number; label: string; text: string; tokens: string[] };

/** A small, realistic knowledge base: the kind of policy handbook RAG is used for. */
const HANDBOOK: Section[] = [
  {
    heading: "Pricing",
    text: "LetMeLearn offers a single lifetime plan. The list price is ₹10,000. Students can apply the code LEARN50 at checkout for a 50% discount, which brings the price to ₹5,000. Prices include taxes for customers in India.",
  },
  {
    heading: "Refunds",
    text: "If the course is not right for you, request a full refund within 30 days of purchase from the billing page. Refunds are sent to the original payment method. After approval, the money usually reaches your bank in 5 to 7 business days. Refunds are not available after 30 days, or once more than half of the course has been completed.",
  },
  {
    heading: "Accounts",
    text: "Each licence is for one person per account. Sharing login details with friends or colleagues is not allowed and may lead to the account being suspended. Teams that need several seats should contact sales about a team plan.",
  },
  {
    heading: "Progress and certificates",
    text: "Your progress is saved automatically as you mark chapters studied. When you finish a track you receive a certificate with a unique verification link. Certificates do not expire and remain valid even when the course content is updated later.",
  },
  {
    heading: "Deleting your account",
    text: "You can delete your account from the settings page. Deletion is immediate: your progress is permanently deleted along with your certificates and cannot be restored. Purchases are not refunded when an account is deleted.",
  },
  {
    heading: "Support",
    text: "Support is available by email every day from 9 am to 9 pm IST. Most questions receive a reply within four hours. During an outage, check the status page before writing in, because known incidents are posted there first.",
  },
  {
    heading: "Devices",
    text: "The library works in any modern browser on desktop and mobile. Labs are designed for larger screens but remain usable on phones. Offline access is not supported.",
  },
  {
    heading: "Privacy",
    text: "We store your name, email address and learning progress. Payment card details are handled by the payment provider and are never stored on our servers. You can request a copy of your data at any time.",
  },
];

/** Each question carries the phrase a correct passage must contain, so retrieval can be scored. */
const QUESTIONS = [
  { q: "How much is the student discount?", answer: "50% discount" },
  { q: "How long until a refund reaches my bank?", answer: "5 to 7 business days" },
  { q: "Can I share my login with a colleague?", answer: "one person per account" },
  { q: "Do certificates expire?", answer: "Certificates do not expire" },
  { q: "What happens to my progress if I delete my account?", answer: "permanently deleted" },
  { q: "Can I get my money back?", answer: "full refund within 30 days" },
];

const STOPWORDS = new Set(
  "a an the is are am i my me you your to of in on for and or can do does how what if it be with from at by as this that get will when much long there until".split(
    " ",
  ),
);

/** Lower-case, strip punctuation, drop stopwords, and a crude plural strip applied to both sides. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9₹%]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

function buildChunks(sizeWords: number, overlapPct: number, structureAware: boolean): Chunk[] {
  const step = Math.max(1, Math.round(sizeWords * (1 - overlapPct / 100)));
  const windows = (words: string[], label: string, prefix: string, out: Chunk[]) => {
    for (let start = 0; start < words.length; start += step) {
      const text = prefix + words.slice(start, start + sizeWords).join(" ");
      out.push({ id: out.length + 1, label, text, tokens: tokenize(text) });
      if (start + sizeWords >= words.length) break;
    }
  };
  const chunks: Chunk[] = [];
  if (structureAware) {
    // Never cross a section boundary, and prefix each chunk with its heading for context.
    for (const s of HANDBOOK) windows(s.text.split(" "), s.heading, `${s.heading}: `, chunks);
  } else {
    const all = HANDBOOK.map((s) => `${s.heading}. ${s.text}`)
      .join(" ")
      .split(" ");
    windows(all, "fixed window", "", chunks);
  }
  return chunks;
}

const K1 = 1.2;
const B = 0.75;

/** BM25: the classic keyword relevance score behind most full-text search engines. */
function bm25(chunks: Chunk[], query: string[]): number[] {
  const n = chunks.length;
  const avgLength = chunks.reduce((sum, c) => sum + c.tokens.length, 0) / Math.max(1, n);
  const df = new Map<string, number>();
  for (const c of chunks)
    for (const term of new Set(c.tokens)) df.set(term, (df.get(term) ?? 0) + 1);
  return chunks.map((c) => {
    const tf = new Map<string, number>();
    for (const t of c.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const term of new Set(query)) {
      const f = tf.get(term) ?? 0;
      if (f === 0) continue;
      const docs = df.get(term) ?? 0;
      const idf = Math.log(1 + (n - docs + 0.5) / (docs + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * c.tokens.length) / avgLength)));
    }
    return score;
  });
}

function retrieve(chunks: Chunk[], question: string, k: number) {
  const scores = bm25(chunks, tokenize(question));
  return chunks
    .map((chunk, i) => ({ chunk, score: scores[i] }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

const normalise = (s: string) => s.toLowerCase().replace(/\s+/g, " ");

export function RagRetrievalLab() {
  const [sizeWords, setSizeWords] = useState(40);
  const [overlapPct, setOverlapPct] = useState(20);
  const [structureAware, setStructureAware] = useState(false);
  const [k, setK] = useState(2);
  const [question, setQuestion] = useState(QUESTIONS[1].q);

  const chunks = useMemo(
    () => buildChunks(sizeWords, overlapPct, structureAware),
    [sizeWords, overlapPct, structureAware],
  );

  const results = useMemo(() => retrieve(chunks, question, k), [chunks, question, k]);
  const queryTerms = useMemo(() => new Set(tokenize(question)), [question]);
  const preset = QUESTIONS.find((x) => x.q === question);

  const evaluation = useMemo(
    () =>
      QUESTIONS.map(({ q, answer }) => ({
        q,
        hit: retrieve(chunks, q, k).some((r) =>
          normalise(r.chunk.text).includes(normalise(answer)),
        ),
      })),
    [chunks, k],
  );
  const recall = evaluation.filter((e) => e.hit).length / evaluation.length;

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        The retrieval half of RAG on a real policy handbook. Chunk the document, ask a question, and
        see which chunks would be handed to the model. Then check recall@k across six labelled
        questions — the number that tells you whether a chunking change actually helped. Scoring
        here is BM25 keyword search; production systems usually combine it with embeddings (hybrid
        search).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Knob
          label="Chunk size"
          value={sizeWords}
          min={10}
          max={120}
          step={5}
          suffix=" words"
          onChange={setSizeWords}
        />
        <Knob
          label="Overlap"
          value={overlapPct}
          min={0}
          max={50}
          step={5}
          suffix="%"
          onChange={setOverlapPct}
        />
        <Knob label="Top k" value={k} min={1} max={5} suffix="" onChange={setK} />
        <label className="flex items-center gap-2 self-end pb-1 text-sm text-muted">
          <input
            type="checkbox"
            checked={structureAware}
            onChange={(e) => setStructureAware(e.target.checked)}
            className="accent-accent"
          />
          Structure-aware (split by section)
        </label>
      </div>

      <div className="text-xs text-faint">
        {chunks.length} chunks ·{" "}
        {structureAware
          ? "never crossing a section, each prefixed with its heading"
          : "fixed windows across the whole document"}
      </div>

      <div className="space-y-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the handbook a question"
          className="h-11 w-full rounded-md border border-border bg-inset px-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {QUESTIONS.map((x) => (
            <button
              key={x.q}
              type="button"
              onClick={() => setQuestion(x.q)}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                question === x.q
                  ? "border-accent bg-accent/15 text-fg"
                  : "border-border text-muted hover:text-fg"
              }`}
            >
              {x.q}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="eyebrow">Retrieved context (top {k})</div>
        {results.length === 0 ? (
          <div className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
            No chunk shares a keyword with this question. This is where embeddings help: they match
            meaning, not words.
          </div>
        ) : null}
        {results.map(({ chunk, score }, rank) => {
          const containsAnswer = preset
            ? normalise(chunk.text).includes(normalise(preset.answer))
            : null;
          return (
            <div
              key={chunk.id}
              className={`rounded-lg border p-4 ${
                containsAnswer === true ? "border-ok/40 bg-ok/5" : "border-border bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                <span className="font-mono text-fg">#{rank + 1}</span>
                <span>chunk {chunk.id}</span>
                <span>· {chunk.label}</span>
                <span className="font-mono">· score {score.toFixed(2)}</span>
                {containsAnswer === true ? (
                  <span className="text-ok">· contains the answer</span>
                ) : null}
                {containsAnswer === false ? (
                  <span className="text-warn">· answer not in this chunk</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {chunk.text.split(" ").map((word, i) => {
                  const [token] = tokenize(word);
                  const hit = token !== undefined && queryTerms.has(token);
                  return (
                    <span key={i}>
                      {hit ? (
                        <mark className="rounded bg-accent/25 px-0.5 text-fg">{word}</mark>
                      ) : (
                        word
                      )}{" "}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-inset p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="eyebrow">Evaluation: recall@{k}</div>
          <div
            className={`font-mono text-2xl ${recall >= 0.8 ? "text-ok" : recall >= 0.5 ? "text-warn" : "text-bad"}`}
          >
            {Math.round(recall * 100)}%
          </div>
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {evaluation.map((e) => (
            <li key={e.q} className="flex gap-2 text-sm">
              <span className={e.hit ? "text-ok" : "text-bad"}>{e.hit ? "✓" : "✗"}</span>
              <span className="text-muted">{e.q}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try this: set chunks to 10 words with no overlap and watch recall fall — answers get split
        across chunk boundaries. Then switch on structure-aware chunking and add overlap. Finally
        ask something with no shared words, like &ldquo;is my card number kept?&rdquo;, to see why
        keyword search alone is not enough.
      </p>
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label} ·{" "}
      <span className="font-mono text-fg">
        {value}
        {suffix}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-accent"
      />
    </label>
  );
}
