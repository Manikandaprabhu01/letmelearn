import { useMemo, useState } from "react";

type Strategy = "retry" | "limiter";

type TaskResult = {
  id: number;
  /** When a concurrency slot first became free for this task. */
  slotAt: number;
  /** When the provider finally accepted it. */
  sentAt: number;
  endAt: number;
  rejected429: number;
};

const RETRY_AFTER_MS = 1000;
const REJECT_LATENCY_MS = 50;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Exact, time-ordered simulation of N API calls through a concurrency limit
 * (a semaphore) against a provider that accepts at most `rateLimit` requests
 * in any one-second window and answers the rest with 429.
 *
 * "retry": send, and on 429 sleep for Retry-After while HOLDING the slot —
 *          exactly what the chapter's `async with sem:` retry loop does.
 * "limiter": wait client-side until the window has room, so nothing is rejected.
 */
function simulate(
  n: number,
  latencyMs: number,
  concurrency: number,
  rateLimit: number,
  strategy: Strategy,
) {
  const rand = mulberry32(11);
  const latencies = Array.from({ length: n }, () => Math.round(latencyMs * (0.7 + 0.6 * rand())));
  const accepted: number[] = [];
  const tasks: TaskResult[] = [];
  const workers = Array.from({ length: Math.min(concurrency, n) }, () => ({
    time: 0,
    task: null as TaskResult | null,
  }));
  let next = 0;
  let totalRejected = 0;

  for (;;) {
    let w: (typeof workers)[number] | null = null;
    for (const candidate of workers) {
      if (candidate.task === null && next >= n) continue;
      if (w === null || candidate.time < w.time) w = candidate;
    }
    if (w === null) break;

    if (w.task === null) {
      w.task = { id: next, slotAt: w.time, sentAt: 0, endAt: 0, rejected429: 0 };
      next += 1;
    }

    const t = w.time;
    const inWindow = accepted.filter((a) => a > t - 1000 && a <= t).sort((a, b) => a - b);

    if (inWindow.length >= rateLimit) {
      if (strategy === "limiter") {
        // Wait until enough of the window's requests age out to leave room for one more.
        w.time = inWindow[inWindow.length - rateLimit] + 1000;
      } else {
        w.task.rejected429 += 1;
        totalRejected += 1;
        w.time = t + REJECT_LATENCY_MS + RETRY_AFTER_MS;
      }
      continue;
    }

    accepted.push(t);
    w.task.sentAt = t;
    w.task.endAt = t + latencies[w.task.id];
    tasks.push(w.task);
    w.time = w.task.endAt;
    w.task = null;
  }

  tasks.sort((a, b) => a.id - b.id);
  const totalMs = Math.max(...tasks.map((x) => x.endAt));
  return { tasks, totalMs, totalRejected, sequentialMs: latencies.reduce((s, x) => s + x, 0) };
}

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

export function AsyncConcurrencyLab() {
  const [n, setN] = useState(60);
  const [latencyMs, setLatencyMs] = useState(800);
  const [concurrency, setConcurrency] = useState(10);
  const [rateLimit, setRateLimit] = useState(10);
  const [strategy, setStrategy] = useState<Strategy>("retry");

  const run = useMemo(
    () => simulate(n, latencyMs, concurrency, rateLimit, strategy),
    [n, latencyMs, concurrency, rateLimit, strategy],
  );

  const speedup = run.sequentialMs / run.totalMs;
  const throughput = (n / run.totalMs) * 1000;
  const shown = run.tasks.slice(0, 40);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Send many LLM or embedding calls with{" "}
        <code className="font-mono text-fg">asyncio.gather</code> behind a semaphore. Concurrency
        cuts the waiting — until you hit the provider&apos;s rate limit. Compare retrying on 429
        with pacing requests on the client.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Knob label="API calls" value={n} min={10} max={200} step={10} suffix="" onChange={setN} />
        <Knob
          label="Latency per call"
          value={latencyMs}
          min={200}
          max={3000}
          step={100}
          suffix=" ms"
          onChange={setLatencyMs}
        />
        <Knob
          label="Semaphore (max in flight)"
          value={concurrency}
          min={1}
          max={50}
          suffix=""
          onChange={setConcurrency}
        />
        <Knob
          label="Provider limit"
          value={rateLimit}
          min={1}
          max={50}
          suffix=" req/s"
          onChange={setRateLimit}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Choice active={strategy === "retry"} onClick={() => setStrategy("retry")}>
          Retry on 429 (wait Retry-After, holding the slot)
        </Choice>
        <Choice active={strategy === "limiter"} onClick={() => setStrategy("limiter")}>
          Client-side rate limiter (pace to {rateLimit}/s)
        </Choice>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="One at a time" value={secs(run.sequentialMs)} />
        <Stat label="With this setup" value={secs(run.totalMs)} tone="accent" />
        <Stat
          label="Speed-up"
          value={`${speedup.toFixed(1)}×`}
          tone={speedup >= 2 ? "ok" : undefined}
        />
        <Stat
          label="429 responses"
          value={String(run.totalRejected)}
          tone={run.totalRejected > 0 ? "bad" : "ok"}
        />
      </div>

      <div className="rounded-lg border border-border bg-inset p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] uppercase tracking-[0.14em] text-faint">
            Timeline of the first {shown.length} calls
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-faint">
            <Legend className="bg-raised" label="waiting for a slot" />
            <Legend
              className="bg-warn/60"
              label={strategy === "retry" ? "429s and backoff" : "paced by limiter"}
            />
            <Legend className="bg-ok/70" label="in flight" />
          </div>
        </div>
        <div className="mt-3 space-y-[3px]">
          {shown.map((task) => {
            const scale = (ms: number) => `${(ms / run.totalMs) * 100}%`;
            return (
              <div
                key={task.id}
                className="relative h-2 w-full"
                title={`call ${task.id + 1}: ${task.rejected429} × 429`}
              >
                <div
                  className="absolute inset-y-0 rounded-sm bg-raised"
                  style={{ left: 0, width: scale(task.slotAt) }}
                />
                <div
                  className="absolute inset-y-0 rounded-sm bg-warn/60"
                  style={{ left: scale(task.slotAt), width: scale(task.sentAt - task.slotAt) }}
                />
                <div
                  className="absolute inset-y-0 rounded-sm bg-ok/70"
                  style={{ left: scale(task.sentAt), width: scale(task.endAt - task.sentAt) }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
          <span>0 s</span>
          <span>{secs(run.totalMs)}</span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
        Effective throughput:{" "}
        <span className="font-mono text-fg">{throughput.toFixed(1)} calls/s</span> against a
        provider limit of <span className="font-mono text-fg">{rateLimit}/s</span>.{" "}
        {concurrency * (1000 / latencyMs) > rateLimit
          ? "The semaphore allows more requests per second than the provider accepts, so the rate limit — not concurrency — is now the bottleneck."
          : "Concurrency is still the bottleneck: raising the semaphore will help until you approach the provider limit."}
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try this: set the semaphore to 50 with a limit of 10 req/s. Retrying produces a wall of
        429s, and each rejected task sits on its slot while backing off. Switch to the client-side
        limiter: zero 429s and a total time close to the theoretical best of calls ÷ limit.
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

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm ${
        active ? "border-accent bg-accent/15 text-fg" : "border-border text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "bad" | "accent";
}) {
  const color =
    tone === "ok"
      ? "text-ok"
      : tone === "bad"
        ? "text-bad"
        : tone === "accent"
          ? "text-accent"
          : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className={`font-mono text-2xl tabular-nums ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-3 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
