import { useMemo, useState } from "react";

type Mode = "shared" | "bulkheads";
type Path = "checkout" | "recs";

type Second = {
  t: number;
  incident: boolean;
  checkoutOk: number;
  checkoutFailed: number;
  recsOk: number;
  recsFailed: number;
  recsWorkersPeak: number;
};

const DURATION_S = 40;
const INCIDENT = { start: 8, end: 24 };
const CHECKOUT_RPS = 20;
const CHECKOUT_LATENCY_MS = 150;
const RECS_RPS = 30;
const RECS_NORMAL_MS = 100;
const TIMEOUT_MS = 1000;
/** Callers give up after waiting this long in total. */
const CLIENT_PATIENCE_MS = 2000;
const TOTAL_WORKERS = 200;
const SPLIT = { checkout: 120, recs: 80 };
const STEP_MS = 10;

const LATENCY_PRESETS = [300, 2000, 10000];

type Waiting = { path: Path; arrivedAt: number };
type Pool = { size: number; busyUntil: number[]; queue: Waiting[] };

/**
 * Time-stepped simulation of one service with worker pools.
 *
 * Like a real server, a request that finds every worker busy waits in a
 * first-come-first-served queue. Callers give up after CLIENT_PATIENCE_MS —
 * but unless the server sheds load, it cannot tell, and still spends a worker
 * on the request when it reaches the front. That wasted work is what turns a
 * slow dependency into an outage.
 */
function simulate(mode: Mode, incidentLatencyMs: number, timeouts: boolean, shedding: boolean) {
  const shared: Pool = { size: TOTAL_WORKERS, busyUntil: [], queue: [] };
  const checkoutPool: Pool =
    mode === "shared" ? shared : { size: SPLIT.checkout, busyUntil: [], queue: [] };
  const recsPool: Pool =
    mode === "shared" ? shared : { size: SPLIT.recs, busyUntil: [], queue: [] };
  const pools = mode === "shared" ? [shared] : [checkoutPool, recsPool];
  const poolFor = (path: Path) => (path === "checkout" ? checkoutPool : recsPool);
  let recsHolding: number[] = [];
  let wastedWorkerMs = 0;

  const seconds: Second[] = Array.from({ length: DURATION_S }, (_, t) => ({
    t,
    incident: t >= INCIDENT.start && t < INCIDENT.end,
    checkoutOk: 0,
    checkoutFailed: 0,
    recsOk: 0,
    recsFailed: 0,
    recsWorkersPeak: 0,
  }));
  // Outcomes are attributed to the second the request arrived in.
  const secondOf = (ms: number) => seconds[Math.min(DURATION_S - 1, Math.floor(ms / 1000))];
  const record = (req: Waiting, ok: boolean) => {
    const sec = secondOf(req.arrivedAt);
    if (req.path === "checkout") {
      if (ok) sec.checkoutOk += 1;
      else sec.checkoutFailed += 1;
    } else if (ok) sec.recsOk += 1;
    else sec.recsFailed += 1;
  };

  /** A worker is free: start this request, or drop it if its caller already left and we shed load. */
  const start = (pool: Pool, req: Waiting, now: number) => {
    const abandoned = now - req.arrivedAt > CLIENT_PATIENCE_MS;
    if (abandoned && shedding) {
      record(req, false); // dropped before doing any work
      return;
    }
    let hold = CHECKOUT_LATENCY_MS;
    let ok = !abandoned;
    if (req.path === "recs") {
      const latency = secondOf(now).incident ? incidentLatencyMs : RECS_NORMAL_MS;
      const timedOut = timeouts && latency > TIMEOUT_MS;
      hold = timedOut ? TIMEOUT_MS : latency;
      if (timedOut) ok = false;
      recsHolding.push(now + hold);
    }
    pool.busyUntil.push(now + hold);
    if (abandoned) wastedWorkerMs += hold;
    record(req, ok);
  };

  const nextArrival: Record<Path, number> = { checkout: 0, recs: 7 }; // offset avoids exact ties
  const interval: Record<Path, number> = { checkout: 1000 / CHECKOUT_RPS, recs: 1000 / RECS_RPS };
  const endMs = DURATION_S * 1000;

  for (let now = 0; now < endMs; now += STEP_MS) {
    for (const pool of pools) {
      pool.busyUntil = pool.busyUntil.filter((until) => until > now);
      while (pool.queue.length > 0 && pool.busyUntil.length < pool.size) {
        start(pool, pool.queue.shift()!, now);
      }
    }
    recsHolding = recsHolding.filter((until) => until > now);

    // Admit this step's arrivals in true time order.
    for (;;) {
      const path: Path = nextArrival.checkout <= nextArrival.recs ? "checkout" : "recs";
      const at = nextArrival[path];
      if (at >= now + STEP_MS || at >= endMs) break;
      nextArrival[path] += interval[path];
      const pool = poolFor(path);
      const req = { path, arrivedAt: at };
      if (pool.queue.length === 0 && pool.busyUntil.length < pool.size) start(pool, req, now);
      else pool.queue.push(req);
    }

    const sec = secondOf(now);
    sec.recsWorkersPeak = Math.max(sec.recsWorkersPeak, recsHolding.length);
  }

  // Anything still queued at the end was never served: its caller gave up.
  for (const pool of pools) for (const req of pool.queue) record(req, false);

  return { seconds, wastedWorkerSeconds: Math.round(wastedWorkerMs / 1000) };
}

function pct(ok: number, total: number): number {
  return total === 0 ? 100 : Math.round((ok / total) * 100);
}

export function BulkheadLab() {
  const [mode, setMode] = useState<Mode>("shared");
  const [latencyMs, setLatencyMs] = useState(10000);
  const [timeouts, setTimeouts] = useState(false);
  const [shedding, setShedding] = useState(false);

  const { seconds, wastedWorkerSeconds } = useMemo(
    () => simulate(mode, latencyMs, timeouts, shedding),
    [mode, latencyMs, timeouts, shedding],
  );

  // From the start of the slowdown until a few seconds after it ends.
  const affected = seconds.filter((s) => s.t >= INCIDENT.start && s.t < INCIDENT.end + 4);
  const checkoutOk = affected.reduce((n, s) => n + s.checkoutOk, 0);
  const checkoutTotal = affected.reduce((n, s) => n + s.checkoutOk + s.checkoutFailed, 0);
  const recsOk = affected.reduce((n, s) => n + s.recsOk, 0);
  const recsTotal = affected.reduce((n, s) => n + s.recsOk + s.recsFailed, 0);
  const peakRecsWorkers = Math.max(...seconds.map((s) => s.recsWorkersPeak));
  const checkoutPct = pct(checkoutOk, checkoutTotal);
  const recsPct = pct(recsOk, recsTotal);

  let verdict: { tone: string; text: string };
  if (checkoutPct < 80) {
    verdict = {
      tone: "border-bad/40 bg-bad/10 text-bad",
      text: shedding
        ? "Checkout is still failing. Shedding stopped the server wasting workers on abandoned requests, but slow recommendations calls still crowd the shared pool. Add bulkheads or timeouts to remove the cause."
        : "Checkout collapsed because of an optional feature. Slow recommendations calls filled the shared pool, the queue grew faster than it drained, and the server kept working on requests whose callers had already given up — so almost nothing was served in time.",
    };
  } else if (mode === "bulkheads") {
    verdict = {
      tone: "border-ok/40 bg-ok/10 text-ok",
      text: `The bulkhead held: recommendations could exhaust only their own ${SPLIT.recs} workers, so checkout kept its reserved capacity${timeouts ? ", and timeouts freed the recommendations workers faster too" : ""}.`,
    };
  } else if (timeouts) {
    verdict = {
      tone: "border-ok/40 bg-ok/10 text-ok",
      text: "Checkout survived. Timeouts cap how long each slow call can hold a worker, so recommendations never occupy enough of the pool to starve anyone.",
    };
  } else if (shedding && latencyMs > 2000) {
    verdict = {
      tone: "border-warn/40 bg-warn/10 text-warn",
      text: "Load shedding kept checkout mostly alive by refusing work nobody was waiting for — but recommendations still crowd the shared pool. It limits the damage; bulkheads or timeouts remove the cause.",
    };
  } else {
    verdict = {
      tone: "border-border bg-raised text-muted",
      text: "Checkout is fine at this latency: slow calls still fit in the pool. Raise the latency to 10 s to see what happens when they don't.",
    };
  }

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        One service with {TOTAL_WORKERS} workers handles checkout ({CHECKOUT_RPS}/s) and
        recommendations ({RECS_RPS}/s). Requests that find every worker busy wait in a queue, and
        callers give up after {CLIENT_PATIENCE_MS / 1000} s — but the server cannot tell unless it
        sheds load. Between {INCIDENT.start}s and {INCIDENT.end}s the recommendations dependency
        becomes slow. Does checkout, which never calls recommendations, keep working?
      </p>

      <div className="flex flex-wrap gap-2">
        <Choice active={mode === "shared"} onClick={() => setMode("shared")}>
          One shared pool ({TOTAL_WORKERS})
        </Choice>
        <Choice active={mode === "bulkheads"} onClick={() => setMode("bulkheads")}>
          Bulkheads (checkout {SPLIT.checkout} · recommendations {SPLIT.recs})
        </Choice>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={timeouts}
            onChange={(e) => setTimeouts(e.target.checked)}
            className="accent-accent"
          />
          {TIMEOUT_MS / 1000} s timeout on recommendations
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={shedding}
            onChange={(e) => setShedding(e.target.checked)}
            className="accent-accent"
          />
          Drop requests whose caller already gave up (load shedding)
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-faint">Recommendations latency during the incident:</span>
        {LATENCY_PRESETS.map((ms) => (
          <Choice key={ms} active={latencyMs === ms} onClick={() => setLatencyMs(ms)}>
            {ms >= 1000 ? `${ms / 1000} s` : `${ms} ms`}
          </Choice>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Checkout success (incident + recovery)"
          value={`${checkoutPct}%`}
          tone={checkoutPct < 80 ? "bad" : "ok"}
        />
        <Stat
          label="Recommendations success"
          value={`${recsPct}%`}
          tone={recsPct < 80 ? "warn" : "ok"}
        />
        <Stat label="Peak workers held by recommendations" value={String(peakRecsWorkers)} />
        <Stat
          label="Worker-seconds spent on abandoned requests"
          value={String(wastedWorkerSeconds)}
          tone={wastedWorkerSeconds > 0 ? "bad" : "ok"}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-inset p-5">
        <Timeline
          title="Checkout requests served in time"
          seconds={seconds}
          ratio={(s) => s.checkoutOk / Math.max(1, s.checkoutOk + s.checkoutFailed)}
        />
        <Timeline
          title="Recommendations served in time"
          seconds={seconds}
          ratio={(s) => s.recsOk / Math.max(1, s.recsOk + s.recsFailed)}
        />
        <div className="flex justify-between font-mono text-[10px] text-faint">
          <span>0s</span>
          <span className="text-warn">
            incident {INCIDENT.start}–{INCIDENT.end}s
          </span>
          <span>{DURATION_S}s</span>
        </div>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-sm leading-6 ${verdict.tone}`}>
        {verdict.text}
      </div>

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try the fixes one at a time: bulkheads, then timeouts, then load shedding on its own. Notice
        two things with a shared pool: checkout keeps working for several seconds after the slowdown
        starts, then falls off a cliff once the pool fills — and it stays broken after the slowdown
        ends, while the server works through requests nobody is waiting for any more.
      </p>
    </div>
  );
}

function Timeline({
  title,
  seconds,
  ratio,
}: {
  title: string;
  seconds: Second[];
  ratio: (s: Second) => number;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-faint">{title}</div>
      <div className="flex h-20 items-end gap-[3px]">
        {seconds.map((s) => {
          const r = ratio(s);
          return (
            <div
              key={s.t}
              title={`${s.t}s: ${Math.round(r * 100)}% served in time`}
              className={`relative flex h-full flex-1 items-end rounded-sm ${s.incident ? "bg-warn/10" : "bg-raised"}`}
            >
              <div
                className={`w-full rounded-sm ${r >= 0.95 ? "bg-ok/70" : r >= 0.5 ? "bg-warn/70" : "bg-bad/80"}`}
                style={{ height: `${Math.max(2, r * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
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
  tone?: "ok" | "bad" | "warn";
}) {
  const color =
    tone === "bad"
      ? "text-bad"
      : tone === "warn"
        ? "text-warn"
        : tone === "ok"
          ? "text-ok"
          : "text-fg";
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className={`font-mono text-2xl tabular-nums ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
