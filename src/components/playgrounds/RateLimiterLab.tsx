import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Algo = "token" | "leaky" | "fixed" | "slog" | "scounter";

const ALGOS: { id: Algo; name: string; blurb: string }[] = [
  {
    id: "token",
    name: "Token bucket",
    blurb: "Burst up to capacity. Tokens refill at a steady rate. Empty bucket = drop.",
  },
  {
    id: "leaky",
    name: "Leaky bucket",
    blurb: "Requests add water. A constant leak drains it. Overflow = drop. Smooth output.",
  },
  {
    id: "fixed",
    name: "Fixed window",
    blurb: "Count requests in the current second. Resets on the boundary — 2× spike possible.",
  },
  {
    id: "slog",
    name: "Sliding log",
    blurb: "Keep timestamps. Allow if fewer than limit in the last window. Precise, heavier.",
  },
  {
    id: "scounter",
    name: "Sliding counter",
    blurb: "Weight the previous window + current. O(1) memory, almost as fair as the log.",
  },
];

type Decision = { t: number; ok: boolean };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function RateLimiterLab() {
  const [algo, setAlgo] = useState<Algo>("token");
  const [capacity, setCapacity] = useState(5);
  const [rate, setRate] = useState(2);
  const [auto, setAuto] = useState(false);
  const [autoRps, setAutoRps] = useState(4);
  const [accepted, setAccepted] = useState(0);
  const [dropped, setDropped] = useState(0);
  const [log, setLog] = useState<Decision[]>([]);
  const [fill, setFill] = useState(5);
  const [nowMs, setNowMs] = useState(0);

  const state = useRef({
    tokens: 5,
    last: performance.now(),
    water: 0,
    windowStart: performance.now(),
    windowCount: 0,
    prevCount: 0,
    stamps: [] as number[],
  });

  const reset = (cap = capacity) => {
    const t = performance.now();
    state.current = {
      tokens: cap,
      last: t,
      water: 0,
      windowStart: t,
      windowCount: 0,
      prevCount: 0,
      stamps: [],
    };
    setFill(algo === "leaky" ? 0 : cap);
    setAccepted(0);
    setDropped(0);
    setLog([]);
    setNowMs(t);
  };

  useEffect(() => {
    reset(capacity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, capacity, rate]);

  const windowMs = 1000;

  const decide = (at: number): boolean => {
    const s = state.current;
    const refill = rate;
    if (algo === "token") {
      const elapsed = (at - s.last) / 1000;
      s.tokens = clamp(s.tokens + elapsed * refill, 0, capacity);
      s.last = at;
      if (s.tokens >= 1) {
        s.tokens -= 1;
        setFill(s.tokens);
        return true;
      }
      setFill(s.tokens);
      return false;
    }
    if (algo === "leaky") {
      const elapsed = (at - s.last) / 1000;
      s.water = Math.max(0, s.water - elapsed * refill);
      s.last = at;
      if (s.water + 1 <= capacity) {
        s.water += 1;
        setFill(s.water);
        return true;
      }
      setFill(s.water);
      return false;
    }
    if (algo === "fixed") {
      if (at - s.windowStart >= windowMs) {
        s.windowStart = at;
        s.windowCount = 0;
      }
      if (s.windowCount < capacity) {
        s.windowCount += 1;
        setFill(s.windowCount);
        return true;
      }
      setFill(s.windowCount);
      return false;
    }
    if (algo === "slog") {
      const cut = at - windowMs;
      s.stamps = s.stamps.filter((x) => x > cut);
      if (s.stamps.length < capacity) {
        s.stamps.push(at);
        setFill(s.stamps.length);
        return true;
      }
      setFill(s.stamps.length);
      return false;
    }
    if (at - s.windowStart >= windowMs) {
      s.prevCount = s.windowCount;
      s.windowCount = 0;
      s.windowStart = at;
    }
    const weight = 1 - (at - s.windowStart) / windowMs;
    const approx = s.prevCount * weight + s.windowCount;
    if (approx < capacity) {
      s.windowCount += 1;
      setFill(approx + 1);
      return true;
    }
    setFill(approx);
    return false;
  };

  const fire = () => {
    const at = performance.now();
    setNowMs(at);
    const ok = decide(at);
    setAccepted((n) => n + (ok ? 1 : 0));
    setDropped((n) => n + (ok ? 0 : 1));
    setLog((L) => [{ t: at, ok }, ...L].slice(0, 24));
  };

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(fire, Math.max(40, 1000 / autoRps));
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, autoRps, algo, capacity, rate]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const at = performance.now();
      const s = state.current;
      if (algo === "token") {
        const elapsed = (at - s.last) / 1000;
        s.tokens = clamp(s.tokens + elapsed * rate, 0, capacity);
        s.last = at;
        setFill(s.tokens);
      } else if (algo === "leaky") {
        const elapsed = (at - s.last) / 1000;
        s.water = Math.max(0, s.water - elapsed * rate);
        s.last = at;
        setFill(s.water);
      }
      setNowMs(at);
    }, 80);
    return () => window.clearInterval(id);
  }, [algo, rate, capacity]);

  const pct = useMemo(() => {
    const max = capacity || 1;
    const v =
      algo === "leaky" || algo === "fixed" || algo === "slog" || algo === "scounter" ? fill : fill;
    return clamp((v / max) * 100, 0, 100);
  }, [fill, capacity, algo]);

  const current = ALGOS.find((a) => a.id === algo)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ALGOS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAlgo(a.id)}
            className={`rounded-md border px-3 py-2 text-sm ${
              algo === a.id
                ? "border-accent bg-accent/15 text-fg"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>
      <p className="max-w-prose text-sm leading-6 text-muted">{current.blurb}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded-lg border border-border bg-inset p-5">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center">
            <div className="flex flex-col items-center">
              <div className="eyebrow">
                {algo === "token" ? "Tokens" : algo === "leaky" ? "Water" : "In window"}
              </div>
              <div
                className="relative mt-3 h-48 w-28 overflow-hidden rounded-b-md rounded-t-sm border-2 border-border-strong bg-raised"
                aria-hidden
              >
                <div
                  className={`absolute inset-x-0 bottom-0 transition-[height] duration-150 ${
                    pct > 92 ? "bg-bad/70" : "bg-accent/50"
                  }`}
                  style={{ height: `${pct}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-2xl tabular-nums">
                  {fill.toFixed(1)}
                </div>
              </div>
              <div className="mt-2 font-mono text-xs text-muted">max {capacity}</div>
            </div>
            <div className="w-full min-w-0 flex-1">
              <div className="eyebrow">Last requests</div>
              <div className="mt-3 flex min-h-6 flex-wrap gap-1">
                {log.length === 0 ? (
                  <span className="text-sm text-muted">Fire a request to fill the tape.</span>
                ) : (
                  log.map((d, i) => (
                    <span
                      key={d.t + i}
                      className={`size-3 rounded-sm ${d.ok ? "bg-ok" : "bg-bad"}`}
                      title={d.ok ? "accepted" : "dropped"}
                    />
                  ))
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat label="Accepted" value={accepted} tone="ok" />
                <Stat label="Dropped" value={dropped} tone="bad" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <label className="block text-xs text-muted">
            Capacity / limit
            <input
              type="range"
              min={1}
              max={12}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
            <span className="font-mono text-fg">{capacity}</span>
          </label>
          <label className="block text-xs text-muted">
            {algo === "fixed" || algo === "slog" || algo === "scounter"
              ? "Window is 1s. Limit above."
              : "Refill / leak per second"}
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
            <span className="font-mono text-fg">{rate}/s</span>
          </label>
          <label className="block text-xs text-muted">
            Auto fire (req/s)
            <input
              type="range"
              min={1}
              max={12}
              value={autoRps}
              onChange={(e) => setAutoRps(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
            <span className="font-mono text-fg">{autoRps}/s</span>
          </label>
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={fire}>Fire request</Button>
            <Button variant="secondary" onClick={() => setAuto((v) => !v)}>
              {auto ? "Stop auto" : "Auto fire"}
            </Button>
            <Button variant="ghost" onClick={() => reset()}>
              Reset
            </Button>
          </div>
          <p className="text-[11px] text-faint">
            Sim clock {nowMs.toFixed(0)} ms. Try a burst, then idle, then a burst again.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-raised text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-3 py-2">Algorithm</th>
              <th className="px-3 py-2">Burst</th>
              <th className="px-3 py-2">Smoothness</th>
              <th className="px-3 py-2">Memory</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-fg">Token bucket</td>
              <td className="px-3 py-2">Yes, up to capacity</td>
              <td className="px-3 py-2">Sustained rate after burst</td>
              <td className="px-3 py-2">O(1) / key</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-fg">Leaky bucket</td>
              <td className="px-3 py-2">No (queued / dropped)</td>
              <td className="px-3 py-2">Constant drain</td>
              <td className="px-3 py-2">O(1)</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-fg">Fixed window</td>
              <td className="px-3 py-2">2× at boundary</td>
              <td className="px-3 py-2">Choppy</td>
              <td className="px-3 py-2">O(1)</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-fg">Sliding log</td>
              <td className="px-3 py-2">Accurate</td>
              <td className="px-3 py-2">Accurate</td>
              <td className="px-3 py-2">O(requests)</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-3 py-2 text-fg">Sliding counter</td>
              <td className="px-3 py-2">Mostly accurate</td>
              <td className="px-3 py-2">Good</td>
              <td className="px-3 py-2">O(1)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "ok" | "bad" }) {
  return (
    <div className="rounded-md border border-border bg-raised px-3 py-2">
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-1 font-mono text-2xl tabular-nums ${tone === "ok" ? "text-ok" : "text-bad"}`}
      >
        {value}
      </div>
    </div>
  );
}
