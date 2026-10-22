import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type StepResult = {
  weight: number;
  canaryRequests: number;
  canaryErrors: number;
  baselineRequests: number;
  baselineErrors: number;
  z: number;
  decision: "promote" | "rollback";
};

const WEIGHTS = [5, 25, 50];
/** One-sided z threshold for roughly 99% confidence that the canary is worse. */
const Z_CRITICAL = 2.33;

const PRESETS = [
  { label: "Good build", baseline: 0.1, canary: 0.1 },
  { label: "Subtle regression", baseline: 0.1, canary: 0.3 },
  { label: "Bad build", baseline: 0.1, canary: 2 },
];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw an error count for n requests at probability p: Poisson when rare, normal otherwise. */
function sampleErrors(n: number, p: number, rand: () => number): number {
  const mean = n * p;
  if (mean < 30) {
    const limit = Math.exp(-mean);
    let k = 0;
    let product = rand();
    while (product > limit) {
      k += 1;
      product *= rand();
    }
    return k;
  }
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, Math.round(mean + z * Math.sqrt(mean * (1 - p))));
}

/** Two-proportion z-score: how many standard errors worse the canary looks. */
function zScore(ce: number, cn: number, be: number, bn: number): number {
  const pooled = (ce + be) / (cn + bn);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / cn + 1 / bn));
  return se === 0 ? 0 : (ce / cn - be / bn) / se;
}

function runRollout(
  rps: number,
  bakeMinutes: number,
  baselinePct: number,
  canaryPct: number,
  seed: number,
) {
  const rand = mulberry32(seed);
  const bakeSeconds = bakeMinutes * 60;
  const steps: StepResult[] = [];
  for (const weight of WEIGHTS) {
    const canaryRequests = Math.round(rps * (weight / 100) * bakeSeconds);
    const baselineRequests = Math.round(rps * (1 - weight / 100) * bakeSeconds);
    const canaryErrors = sampleErrors(canaryRequests, canaryPct / 100, rand);
    const baselineErrors = sampleErrors(baselineRequests, baselinePct / 100, rand);
    const z = zScore(canaryErrors, canaryRequests, baselineErrors, baselineRequests);
    const decision = z > Z_CRITICAL ? "rollback" : "promote";
    steps.push({
      weight,
      canaryRequests,
      canaryErrors,
      baselineRequests,
      baselineErrors,
      z,
      decision,
    });
    if (decision === "rollback") break;
  }
  const rolledBack = steps.some((s) => s.decision === "rollback");
  const extraRate = Math.max(0, canaryPct - baselinePct) / 100;
  const canaryExposure = steps.reduce((n, s) => n + s.canaryRequests, 0);
  return {
    steps,
    rolledBack,
    extraErrorsDuringCanary: Math.round(canaryExposure * extraRate),
    extraErrorsBigBang: Math.round(rps * steps.length * bakeSeconds * extraRate),
    worse: canaryPct > baselinePct,
  };
}

const fmt = (n: number) => n.toLocaleString("en-IN");

export function CanaryLab() {
  const [rps, setRps] = useState(2000);
  const [bakeMinutes, setBakeMinutes] = useState(10);
  const [baselinePct, setBaselinePct] = useState(0.1);
  const [canaryPct, setCanaryPct] = useState(2);
  const [seed, setSeed] = useState(1);

  const result = useMemo(
    () => runRollout(rps, bakeMinutes, baselinePct, canaryPct, seed),
    [rps, bakeMinutes, baselinePct, canaryPct, seed],
  );

  const outcome = result.rolledBack
    ? {
        tone: "border-warn/40 bg-warn/10 text-warn",
        text: `Rolled back automatically at ${result.steps.at(-1)?.weight}% of traffic.`,
      }
    : result.worse
      ? {
          tone: "border-bad/40 bg-bad/10 text-bad",
          text: "Promoted to 100% — but this build IS worse. The samples were too small to separate the two error rates. Increase the bake time or traffic and run again.",
        }
      : {
          tone: "border-ok/40 bg-ok/10 text-ok",
          text: "Promoted to 100%: no statistically significant difference at any step.",
        };

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        A new version receives 5%, then 25%, then 50% of traffic. After each bake period its error
        rate is compared with the current version running at the same time, using a two-proportion
        z-test. If the canary is worse with about 99% confidence, the rollout stops and rolls back.
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setBaselinePct(p.baseline);
              setCanaryPct(p.canary);
            }}
            className={`rounded-md border px-3 py-2 text-sm ${
              baselinePct === p.baseline && canaryPct === p.canary
                ? "border-accent bg-accent/15 text-fg"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            {p.label} ({p.baseline}% → {p.canary}%)
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Knob
          label="Traffic"
          value={rps}
          min={200}
          max={5000}
          step={200}
          format={(v) => `${fmt(v)} req/s`}
          onChange={setRps}
        />
        <Knob
          label="Bake per step"
          value={bakeMinutes}
          min={1}
          max={15}
          format={(v) => `${v} min`}
          onChange={setBakeMinutes}
        />
        <Knob
          label="Current error rate"
          value={baselinePct}
          min={0.05}
          max={2}
          step={0.05}
          format={(v) => `${v.toFixed(2)}%`}
          onChange={setBaselinePct}
        />
        <Knob
          label="Canary's true error rate"
          value={canaryPct}
          min={0}
          max={5}
          step={0.05}
          format={(v) => `${v.toFixed(2)}%`}
          onChange={setCanaryPct}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setSeed((s) => s + 1)}>
          New traffic sample
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-raised text-left text-[11px] uppercase tracking-[0.12em] text-faint">
            <tr>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2">Canary requests</th>
              <th className="px-3 py-2">Canary errors</th>
              <th className="px-3 py-2">Current version errors</th>
              <th className="px-3 py-2">z</th>
              <th className="px-3 py-2">Decision</th>
            </tr>
          </thead>
          <tbody>
            {result.steps.map((s) => (
              <tr key={s.weight} className="border-t border-border">
                <td className="px-3 py-2 font-mono">{s.weight}%</td>
                <td className="px-3 py-2 font-mono">{fmt(s.canaryRequests)}</td>
                <td className="px-3 py-2 font-mono">
                  {fmt(s.canaryErrors)}{" "}
                  <span className="text-faint">
                    ({((s.canaryErrors / s.canaryRequests) * 100).toFixed(2)}%)
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">
                  {fmt(s.baselineErrors)}{" "}
                  <span className="text-faint">
                    ({((s.baselineErrors / s.baselineRequests) * 100).toFixed(2)}%)
                  </span>
                </td>
                <td
                  className={`px-3 py-2 font-mono ${s.z > Z_CRITICAL ? "text-bad" : "text-muted"}`}
                >
                  {s.z.toFixed(2)}
                </td>
                <td
                  className={`px-3 py-2 font-medium ${s.decision === "rollback" ? "text-warn" : "text-ok"}`}
                >
                  {s.decision === "rollback" ? "Roll back" : "Promote"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-sm leading-6 ${outcome.tone}`}>
        {outcome.text}
      </div>

      {result.worse ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Extra failed requests during the canary"
            value={fmt(result.extraErrorsDuringCanary)}
            tone="warn"
          />
          <Stat
            label="…if the same build had gone to 100% for the same time"
            value={fmt(result.extraErrorsBigBang)}
            tone="bad"
          />
        </div>
      ) : null}

      <p className="max-w-prose text-sm leading-6 text-muted">
        Try <b>Subtle regression</b> with a 1-minute bake, then press <b>New traffic sample</b> a
        few times: sometimes it slips through. Raise the bake to 10 minutes and it is caught
        reliably. Bake time is not ceremony — it is sample size.
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
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label} · <span className="font-mono text-fg">{format(value)}</span>
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

function Stat({ label, value, tone }: { label: string; value: string; tone: "warn" | "bad" }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div
        className={`font-mono text-2xl tabular-nums ${tone === "bad" ? "text-bad" : "text-warn"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
