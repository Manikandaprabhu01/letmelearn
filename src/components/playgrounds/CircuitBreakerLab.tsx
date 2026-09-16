import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type BreakerState = "closed" | "open" | "half-open";
type Outcome = "success" | "failure" | "fast-fail" | "trial-success" | "trial-failure";

type Config = {
  failurePct: number;
  thresholdPct: number;
  openSeconds: number;
  enabled: boolean;
};

type Sim = {
  state: BreakerState;
  /** Most recent calls in the closed state; true = failed. */
  recent: boolean[];
  openedAt: number;
  trialsLeft: number;
  /** Simulated milliseconds since the start. */
  t: number;
  outcomes: Outcome[];
  events: { t: number; text: string }[];
  calls: number;
  failures: number;
  fastFails: number;
  successes: number;
};

const TICK_MS = 100; // one request every 100 ms = 10 requests per second
const WINDOW_SIZE = 10;
const MIN_CALLS = 5;
const HALF_OPEN_TRIALS = 3;
const TIMEOUT_S = 1; // a failing call holds a worker for the full timeout
const OUTCOMES_SHOWN = 80;

const HEALTH_PRESETS = [
  { label: "Healthy", pct: 2 },
  { label: "Degraded", pct: 35 },
  { label: "Down", pct: 100 },
];

const CELL: Record<Outcome, string> = {
  success: "bg-ok/70",
  failure: "bg-bad/80",
  "fast-fail": "bg-warn/50",
  "trial-success": "bg-accent/80",
  "trial-failure": "bg-bad",
};

const BADGE: Record<BreakerState, string> = {
  closed: "border-ok/40 bg-ok/10 text-ok",
  open: "border-bad/40 bg-bad/10 text-bad",
  "half-open": "border-warn/40 bg-warn/10 text-warn",
};

/** Small seeded PRNG so a run is reproducible after Reset. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshSim(): Sim {
  return {
    state: "closed",
    recent: [],
    openedAt: 0,
    trialsLeft: 0,
    t: 0,
    outcomes: [],
    events: [],
    calls: 0,
    failures: 0,
    fastFails: 0,
    successes: 0,
  };
}

function snapshot(s: Sim): Sim {
  return { ...s, recent: [...s.recent], outcomes: [...s.outcomes], events: [...s.events] };
}

/** Advance the simulation by one request. */
function step(s: Sim, cfg: Config, rand: () => number): void {
  s.t += TICK_MS;
  const log = (text: string) => {
    s.events = [{ t: s.t, text }, ...s.events].slice(0, 8);
  };
  const record = (o: Outcome) => {
    s.outcomes = [...s.outcomes, o].slice(-OUTCOMES_SHOWN);
  };
  const callDependency = () => {
    const failed = rand() * 100 < cfg.failurePct;
    s.calls += 1;
    if (failed) s.failures += 1;
    else s.successes += 1;
    return failed;
  };

  if (!cfg.enabled) {
    record(callDependency() ? "failure" : "success");
    return;
  }

  if (s.state === "open" && s.t - s.openedAt >= cfg.openSeconds * 1000) {
    s.state = "half-open";
    s.trialsLeft = HALF_OPEN_TRIALS;
    log(`Half-open: letting ${HALF_OPEN_TRIALS} trial calls through`);
  }

  if (s.state === "open") {
    s.fastFails += 1;
    record("fast-fail");
    return;
  }

  const failed = callDependency();

  if (s.state === "half-open") {
    s.trialsLeft -= 1;
    record(failed ? "trial-failure" : "trial-success");
    if (failed) {
      s.state = "open";
      s.openedAt = s.t;
      log("A trial call failed: open again");
    } else if (s.trialsLeft === 0) {
      s.state = "closed";
      s.recent = [];
      log("All trial calls succeeded: closed");
    }
    return;
  }

  record(failed ? "failure" : "success");
  s.recent = [...s.recent, failed].slice(-WINDOW_SIZE);
  const recentFailures = s.recent.filter(Boolean).length;
  if (
    s.recent.length >= MIN_CALLS &&
    (recentFailures / s.recent.length) * 100 >= cfg.thresholdPct
  ) {
    s.state = "open";
    s.openedAt = s.t;
    log(`Opened: ${recentFailures} of the last ${s.recent.length} calls failed`);
  }
}

export function CircuitBreakerLab() {
  const [failurePct, setFailurePct] = useState(2);
  const [thresholdPct, setThresholdPct] = useState(50);
  const [openSeconds, setOpenSeconds] = useState(3);
  const [enabled, setEnabled] = useState(true);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<Sim>(freshSim);

  const sim = useRef<Sim>(freshSim());
  const rand = useRef(mulberry32(7));
  const config = useRef<Config>({ failurePct, thresholdPct, openSeconds, enabled });

  useEffect(() => {
    config.current = { failurePct, thresholdPct, openSeconds, enabled };
  }, [failurePct, thresholdPct, openSeconds, enabled]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      step(sim.current, config.current, rand.current);
      setView(snapshot(sim.current));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const fastForward = () => {
    for (let i = 0; i < 100; i += 1) step(sim.current, config.current, rand.current);
    setView(snapshot(sim.current));
  };

  const reset = () => {
    setRunning(false);
    sim.current = freshSim();
    rand.current = mulberry32(7);
    setView(freshSim());
  };

  const requests = view.calls + view.fastFails;
  const wastedWorkerSeconds = view.failures * TIMEOUT_S;

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Ten requests a second call a dependency. A failing call holds a worker for its full{" "}
        {TIMEOUT_S}-second timeout. Degrade the dependency and watch the breaker trip open, fail
        fast, probe with trial calls, and close again once it recovers. Then turn the breaker off
        and compare how many worker-seconds are wasted.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Knob
          label="Dependency failure rate"
          value={failurePct}
          min={0}
          max={100}
          suffix="%"
          onChange={setFailurePct}
        />
        <Knob
          label="Open when failures reach"
          value={thresholdPct}
          min={10}
          max={100}
          step={10}
          suffix="%"
          onChange={setThresholdPct}
        />
        <Knob
          label="Stay open for"
          value={openSeconds}
          min={1}
          max={10}
          suffix=" s"
          onChange={setOpenSeconds}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-faint">Dependency:</span>
        {HEALTH_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setFailurePct(p.pct)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              failurePct === p.pct
                ? "border-accent bg-accent/15 text-fg"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            {p.label} ({p.pct}%)
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="accent-accent"
          />
          Circuit breaker enabled
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start traffic"}</Button>
        <Button variant="secondary" onClick={fastForward}>
          Fast-forward 10 s
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4 rounded-lg border border-border bg-inset p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-md border px-3 py-1.5 font-mono text-sm uppercase tracking-wider ${
                enabled ? BADGE[view.state] : "border-border bg-raised text-muted"
              }`}
            >
              {enabled ? view.state : "no breaker"}
            </span>
            <span className="font-mono text-xs text-faint">t = {(view.t / 1000).toFixed(1)} s</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Requests" value={requests} />
            <Stat label="Reached dependency" value={view.calls} />
            <Stat label="Failed at dependency" value={view.failures} tone="bad" />
            <Stat label="Failed fast (breaker open)" value={view.fastFails} tone="warn" />
          </div>

          <div>
            <div className="mb-2 eyebrow">Last {OUTCOMES_SHOWN} requests</div>
            <div className="flex flex-wrap gap-1">
              {view.outcomes.map((o, i) => (
                <span key={i} title={o} className={`h-5 w-2.5 rounded-sm ${CELL[o]}`} />
              ))}
              {view.outcomes.length === 0 ? (
                <span className="text-xs text-faint">Start traffic to see requests.</span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-faint">
              <Legend className="bg-ok/70" label="success" />
              <Legend className="bg-bad/80" label="failed after timeout" />
              <Legend className="bg-warn/50" label="failed fast" />
              <Legend className="bg-accent/80" label="half-open trial" />
            </div>
          </div>

          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              wastedWorkerSeconds > 20
                ? "border-bad/40 bg-bad/10 text-bad"
                : "border-border bg-raised text-muted"
            }`}
          >
            Worker-seconds spent waiting on failing calls:{" "}
            <span className="font-mono">{wastedWorkerSeconds}</span>
            {view.fastFails > 0 ? (
              <>
                {" "}
                · saved by failing fast:{" "}
                <span className="font-mono">{view.fastFails * TIMEOUT_S}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="eyebrow">State changes</div>
          <ul className="mt-3 space-y-2">
            {view.events.map((e, i) => (
              <li key={`${e.t}-${i}`} className="text-sm leading-5">
                <span className="font-mono text-xs text-faint">{(e.t / 1000).toFixed(1)}s</span>{" "}
                <span className="text-fg">{e.text}</span>
              </li>
            ))}
            {view.events.length === 0 ? (
              <li className="text-sm text-muted">None yet. Try Degraded or Down.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try this: start traffic, choose <b>Down</b>, then switch back to <b>Healthy</b>. With the
        breaker on, failures stop within half a second and recovery is detected by three trial
        calls. With it off, every request keeps waiting a full second to fail — the pile-up that
        exhausts a caller&apos;s thread pool.
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
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
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

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  const color = tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-fg";
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className={`font-mono text-xl tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] text-faint">{label}</div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-2 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
