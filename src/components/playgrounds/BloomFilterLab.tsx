import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const SAMPLE = [
  "apple",
  "banana",
  "cherry",
  "mango",
  "guava",
  "papaya",
  "lychee",
  "orange",
  "grape",
  "kiwi",
  "delhi",
  "mumbai",
  "chennai",
  "kolkata",
  "pune",
  "jaipur",
  "kochi",
  "indore",
  "bhopal",
  "nagpur",
];

const PROBES = 2000;

/** FNV-1a, 32-bit. Seeding the offset basis gives independent-enough second hash. */
function fnv1a(input: string, seed: number): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Double hashing: k positions from two hashes, h1 + i·h2 — the standard Bloom filter trick. */
function positions(item: string, k: number, m: number): number[] {
  const h1 = fnv1a(item, 0);
  const h2 = fnv1a(item, 0x5bd1e995) | 1;
  return Array.from({ length: k }, (_, i) => ((h1 + Math.imul(i, h2)) >>> 0) % m);
}

export function BloomFilterLab() {
  const [m, setM] = useState(128);
  const [k, setK] = useState(3);
  const [items, setItems] = useState<string[]>(SAMPLE.slice(0, 8));
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("mango");

  const bits = useMemo(() => {
    const b = new Array<boolean>(m).fill(false);
    for (const item of items) for (const p of positions(item, k, m)) b[p] = true;
    return b;
  }, [items, k, m]);

  const n = items.length;
  const setCount = bits.filter(Boolean).length;
  const theoreticalFp = n === 0 ? 0 : Math.pow(1 - Math.exp((-k * n) / m), k);

  const measuredFp = useMemo(() => {
    let falsePositives = 0;
    for (let i = 0; i < PROBES; i += 1) {
      if (positions(`probe-${i}`, k, m).every((p) => bits[p])) falsePositives += 1;
    }
    return falsePositives / PROBES;
  }, [bits, k, m]);

  const optimalK = n === 0 ? null : Math.max(1, Math.round((m / n) * Math.LN2));

  const trimmed = query.trim().toLowerCase();
  const queryPositions = trimmed ? positions(trimmed, k, m) : [];
  const possiblyPresent = trimmed !== "" && queryPositions.every((p) => bits[p]);
  const actuallyPresent = items.includes(trimmed);
  const highlight = new Set(queryPositions);

  const add = (value: string) => {
    const v = value.trim().toLowerCase();
    if (!v || items.includes(v)) return;
    setItems((current) => [...current, v]);
  };

  const storedBytes = items.reduce((sum, s) => sum + s.length + 16, 0); // rough per-string overhead

  let verdict: { tone: string; text: string } | null = null;
  if (trimmed) {
    if (!possiblyPresent) {
      verdict = {
        tone: "border-ok/40 bg-ok/10 text-ok",
        text: "Definitely NOT in the set — at least one of its bits is 0. Bloom filters never give false negatives.",
      };
    } else if (actuallyPresent) {
      verdict = {
        tone: "border-accent/40 bg-accent/10 text-fg",
        text: "Probably in the set — and it really is (true positive).",
      };
    } else {
      verdict = {
        tone: "border-bad/40 bg-bad/10 text-bad",
        text: "Probably in the set — but it was never added. A FALSE POSITIVE: other items happened to set all of its bits.",
      };
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        A Bloom filter answers &ldquo;have I seen this?&rdquo; in a few bits per item. Each item
        sets k bits chosen by hashing. A lookup checks those k bits: any zero means definitely
        absent; all ones means probably present. Add items, tune m and k, and watch the
        false-positive rate move with the formula.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Knob label="Bits (m)" value={m} min={32} max={512} step={8} onChange={setM} />
        <Knob label="Hash functions (k)" value={k} min={1} max={8} onChange={setK} />
      </div>

      <div className="flex flex-wrap gap-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="add an item"
            className="h-10 w-40 rounded-md border border-border bg-inset px-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
        <Button
          variant="secondary"
          onClick={() => setItems((current) => [...new Set([...current, ...SAMPLE])])}
        >
          Add 20 sample words
        </Button>
        <Button variant="ghost" onClick={() => setItems([])}>
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded border border-border bg-raised px-2 py-0.5 font-mono text-xs text-muted"
          >
            {item}
          </span>
        ))}
        {items.length === 0 ? (
          <span className="text-xs text-faint">The filter is empty.</span>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-inset p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-faint">
          <span>
            Bit array · {setCount} of {m} set ({Math.round((setCount / m) * 100)}%)
          </span>
          <span className="normal-case tracking-normal">outlined = bits checked by the query</span>
        </div>
        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1 sm:grid-cols-[repeat(32,minmax(0,1fr))]">
          {bits.map((on, i) => (
            <div
              key={i}
              title={`bit ${i}`}
              className={`aspect-square rounded-[3px] ${on ? "bg-accent/70" : "bg-raised"} ${
                highlight.has(i) ? (on ? "ring-2 ring-ok" : "ring-2 ring-bad") : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="look something up, e.g. mango or zebra"
          className="h-11 w-full rounded-md border border-border bg-inset px-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
        />
        {trimmed ? (
          <div className="font-mono text-xs text-faint">
            bits checked: {queryPositions.map((p) => `${p}${bits[p] ? "=1" : "=0"}`).join(" · ")}
          </div>
        ) : null}
        {verdict ? (
          <div className={`rounded-lg border px-4 py-3 text-sm leading-6 ${verdict.tone}`}>
            {verdict.text}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Items stored (n)" value={String(n)} />
        <Stat
          label="Predicted false-positive rate"
          value={`${(theoreticalFp * 100).toFixed(1)}%`}
        />
        <Stat
          label={`Measured on ${PROBES.toLocaleString("en-US")} unseen strings`}
          value={`${(measuredFp * 100).toFixed(1)}%`}
          tone={measuredFp > 0.1 ? "bad" : measuredFp > 0.02 ? "warn" : "ok"}
        />
        <Stat label="Best k for this m and n" value={optimalK === null ? "—" : String(optimalK)} />
      </div>

      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
        Memory: <span className="font-mono text-fg">{Math.ceil(m / 8)} bytes</span> for the filter
        versus roughly <span className="font-mono text-fg">{storedBytes} bytes</span> to store the
        strings themselves. Predicted rate: (1 − e<sup>−kn/m</sup>)<sup>k</sup>.
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try this: add all 20 samples with m = 64 and k = 3, then look up words that were never added
        — false positives appear. Raise m to 256 and they mostly vanish. Now set k to 8 with m = 64:
        more hashing makes it worse, because the array fills up. (Changing m rebuilds the filter
        from the items; a real Bloom filter cannot be resized in place.)
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
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label} · <span className="font-mono text-fg">{value}</span>
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warn"
        : tone === "bad"
          ? "text-bad"
          : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className={`font-mono text-2xl tabular-nums ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
