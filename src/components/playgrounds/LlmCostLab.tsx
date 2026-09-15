import { useMemo, useState } from "react";

const VOLUMES = [1_000, 10_000, 50_000, 100_000, 500_000, 1_000_000];
/** A cheaper model is modelled as costing this fraction of the main model's price. */
const SMALL_MODEL_PRICE_FACTOR = 0.25;

type Inputs = {
  systemTokens: number;
  chunks: number;
  chunkTokens: number;
  historyTokens: number;
  questionTokens: number;
  outputTokens: number;
  inputPrice: number;
  outputPrice: number;
  cacheSystem: boolean;
  cachedPct: number;
  answerCacheHitPct: number;
  routedPct: number;
};

/** Cost of one request in dollars, with each lever applied only when switched on. */
function perRequest(
  i: Inputs,
  levers: { caching: boolean; answerCache: boolean; routing: boolean },
) {
  const inputTokens =
    i.systemTokens + i.chunks * i.chunkTokens + i.historyTokens + i.questionTokens;
  const cachedTokens = levers.caching && i.cacheSystem ? i.systemTokens : 0;
  const inputCost =
    ((inputTokens - cachedTokens) * i.inputPrice +
      cachedTokens * i.inputPrice * (i.cachedPct / 100)) /
    1e6;
  const outputCost = (i.outputTokens * i.outputPrice) / 1e6;
  let cost = inputCost + outputCost;
  if (levers.routing)
    cost *= 1 - i.routedPct / 100 + (i.routedPct / 100) * SMALL_MODEL_PRICE_FACTOR;
  if (levers.answerCache) cost *= 1 - i.answerCacheHitPct / 100;
  return { cost, inputTokens };
}

const usd = (n: number) =>
  n >= 100
    ? `$${Math.round(n).toLocaleString("en-US")}`
    : n >= 1
      ? `$${n.toFixed(2)}`
      : `$${n.toFixed(n >= 0.01 ? 4 : 5)}`;

export function LlmCostLab() {
  const [systemTokens, setSystemTokens] = useState(800);
  const [chunks, setChunks] = useState(5);
  const [chunkTokens, setChunkTokens] = useState(400);
  const [historyTokens, setHistoryTokens] = useState(1000);
  const [questionTokens, setQuestionTokens] = useState(60);
  const [outputTokens, setOutputTokens] = useState(400);
  const [inputPrice, setInputPrice] = useState(3);
  const [outputPrice, setOutputPrice] = useState(15);
  const [volume, setVolume] = useState(50_000);
  const [cacheSystem, setCacheSystem] = useState(false);
  const [cachedPct, setCachedPct] = useState(10);
  const [answerCacheHitPct, setAnswerCacheHitPct] = useState(0);
  const [routedPct, setRoutedPct] = useState(0);
  const [sample, setSample] = useState("");

  const inputs: Inputs = {
    systemTokens,
    chunks,
    chunkTokens,
    historyTokens,
    questionTokens,
    outputTokens,
    inputPrice,
    outputPrice,
    cacheSystem,
    cachedPct,
    answerCacheHitPct,
    routedPct,
  };

  const all = { caching: true, answerCache: true, routing: true };
  const none = { caching: false, answerCache: false, routing: false };
  const base = perRequest(inputs, none);
  const effective = perRequest(inputs, all);

  const segments = [
    {
      label: "System prompt",
      dollars: (systemTokens * inputPrice) / 1e6,
      className: "bg-accent/60",
    },
    {
      label: "Retrieved context",
      dollars: (chunks * chunkTokens * inputPrice) / 1e6,
      className: "bg-ok/60",
    },
    { label: "History", dollars: (historyTokens * inputPrice) / 1e6, className: "bg-warn/60" },
    { label: "Question", dollars: (questionTokens * inputPrice) / 1e6, className: "bg-fg/40" },
    { label: "Output", dollars: (outputTokens * outputPrice) / 1e6, className: "bg-bad/60" },
  ];
  const baseTotal = segments.reduce((n, s) => n + s.dollars, 0);

  const levers = [
    {
      label: "Prompt caching of the system prompt",
      daily: perRequest(inputs, { ...none, caching: true }).cost * volume,
    },
    {
      label: `Answer cache (${answerCacheHitPct}% hits)`,
      daily: perRequest(inputs, { ...none, answerCache: true }).cost * volume,
    },
    {
      label: `Route ${routedPct}% to a cheaper model`,
      daily: perRequest(inputs, { ...none, routing: true }).cost * volume,
    },
  ];

  const estimatedTokens = useMemo(() => Math.ceil(sample.length / 4), [sample]);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Model a single RAG request token by token, then scale it to real traffic. Prices are
        illustrative — substitute your provider&apos;s current rates — but the shape of the result
        holds: output tokens cost several times more than input, and context adds up fast.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Knob
          label="System prompt"
          value={systemTokens}
          min={0}
          max={4000}
          step={100}
          suffix=" tokens"
          onChange={setSystemTokens}
        />
        <Knob
          label="Retrieved chunks"
          value={chunks}
          min={0}
          max={10}
          suffix=""
          onChange={setChunks}
        />
        <Knob
          label="Tokens per chunk"
          value={chunkTokens}
          min={100}
          max={1000}
          step={50}
          suffix=""
          onChange={setChunkTokens}
        />
        <Knob
          label="Conversation history"
          value={historyTokens}
          min={0}
          max={8000}
          step={250}
          suffix=" tokens"
          onChange={setHistoryTokens}
        />
        <Knob
          label="User question"
          value={questionTokens}
          min={10}
          max={1000}
          step={10}
          suffix=" tokens"
          onChange={setQuestionTokens}
        />
        <Knob
          label="Max output"
          value={outputTokens}
          min={50}
          max={2000}
          step={50}
          suffix=" tokens"
          onChange={setOutputTokens}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PriceInput
          label="Input price ($ per million tokens)"
          value={inputPrice}
          onChange={setInputPrice}
        />
        <PriceInput
          label="Output price ($ per million tokens)"
          value={outputPrice}
          onChange={setOutputPrice}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-faint">Requests per day:</span>
        {VOLUMES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVolume(v)}
            className={`rounded-md border px-3 py-1.5 font-mono text-sm ${
              volume === v
                ? "border-accent bg-accent/15 text-fg"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            {v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-inset p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-faint">
          Where the money goes, per request
        </div>
        <div className="mt-3 flex h-8 overflow-hidden rounded-md">
          {segments.map((s) => (
            <div
              key={s.label}
              title={`${s.label}: ${usd(s.dollars)}`}
              className={s.className}
              style={{ width: `${baseTotal === 0 ? 0 : (s.dollars / baseTotal) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {segments.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${s.className}`} />
              {s.label} {baseTotal === 0 ? "" : `${Math.round((s.dollars / baseTotal) * 100)}%`}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Stat label="Input tokens per request" value={base.inputTokens.toLocaleString("en-US")} />
          <Stat label="Cost per request" value={usd(base.cost)} />
          <Stat label="Per day" value={usd(base.cost * volume)} />
          <Stat label="Per 30-day month" value={usd(base.cost * volume * 30)} emphasis />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-faint">Cost levers</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={cacheSystem}
                onChange={(e) => setCacheSystem(e.target.checked)}
                className="accent-accent"
              />
              Cache the system prompt
            </label>
            <Knob
              label="Cached tokens billed at"
              value={cachedPct}
              min={5}
              max={50}
              step={5}
              suffix="%"
              onChange={setCachedPct}
            />
          </div>
          <Knob
            label="Answer cache hit rate"
            value={answerCacheHitPct}
            min={0}
            max={60}
            step={5}
            suffix="%"
            onChange={setAnswerCacheHitPct}
          />
          <Knob
            label="Requests routed to a model at ¼ the price"
            value={routedPct}
            min={0}
            max={80}
            step={5}
            suffix="%"
            onChange={setRoutedPct}
          />
        </div>

        <ul className="mt-5 space-y-2">
          {levers.map((l) => {
            const saved = base.cost * volume - l.daily;
            return (
              <li
                key={l.label}
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
              >
                <span className="text-muted">{l.label}</span>
                <span className={`font-mono ${saved > 0 ? "text-ok" : "text-faint"}`}>
                  {saved > 0 ? `saves ${usd(saved)} / day` : "no effect yet"}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-4">
          <span className="text-sm text-fg">With every lever applied</span>
          <span className="font-mono text-lg text-ok">
            {usd(effective.cost * volume * 30)} / month{" "}
            <span className="text-sm text-faint">
              ({base.cost === 0 ? 0 : Math.round((1 - effective.cost / base.cost) * 100)}% less)
            </span>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-faint">
          Rough token estimate
        </div>
        <textarea
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          rows={3}
          placeholder="Paste a prompt to estimate its size"
          className="mt-3 w-full rounded-md border border-border bg-inset p-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <p className="mt-2 text-xs text-muted">
          ≈ <span className="font-mono text-fg">{estimatedTokens.toLocaleString("en-US")}</span>{" "}
          tokens using the four-characters-per-token rule of thumb for English. Use your
          model&apos;s tokenizer for exact counts — other languages and code often use more tokens.
        </p>
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try this: set history to 8,000 tokens and watch it dominate the bar — trimming or
        summarising history is often the biggest single saving. Then halve max output and compare it
        with removing two retrieved chunks. Real prompt caching also charges extra when the cache is
        first written; this model ignores that.
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
    <label className="block text-xs text-muted">
      {label} ·{" "}
      <span className="font-mono text-fg">
        {value.toLocaleString("en-US")}
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

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <input
        type="number"
        min={0}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-2 h-10 w-full rounded-md border border-border bg-inset px-3 font-mono text-sm text-fg focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div
        className={`font-mono tabular-nums ${emphasis ? "text-xl text-accent" : "text-lg text-fg"}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-faint">{label}</div>
    </div>
  );
}
