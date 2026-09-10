import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export function QuorumLab() {
  const [n, setN] = useState(3);
  const [w, setW] = useState(2);
  const [r, setR] = useState(2);

  const strong = r + w > n;
  const writeAvail = w <= n;
  const readAvail = r <= n;

  const replicas = useMemo(() => Array.from({ length: n }, (_, i) => `r${i + 1}`), [n]);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        N copies, write W of them, read R of them. If R + W exceeds N the sets must overlap, so a reader sees the latest
        write (ignoring sloppy quorums and concurrent writers).
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Knob label="N replicas" value={n} min={1} max={7} onChange={setN} />
        <Knob label="W writes" value={w} min={1} max={7} onChange={setW} />
        <Knob label="R reads" value={r} min={1} max={7} onChange={setR} />
      </div>
      <div className="flex flex-wrap gap-2">
        {replicas.map((id, i) => (
          <div
            key={id}
            className={`rounded-md border px-3 py-2 font-mono text-sm ${
              i < Math.max(w, r) ? "border-accent bg-accent/15" : "border-border bg-raised"
            }`}
          >
            {id}
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Flag ok={strong} yes="Strong-enough reads (R+W exceeds N)" no="R+W at most N — a read may miss the last write" />
        <Flag ok={writeAvail && w <= n} yes={`Writes need ${w} of ${n} up`} no="W larger than N is impossible" />
        <Flag ok={readAvail} yes={`Reads need ${r} of ${n} up`} no="R larger than N is impossible" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setN(3);
            setW(2);
            setR(2);
          }}
        >
          Dynamo typical (3,2,2)
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setN(3);
            setW(1);
            setR(1);
          }}
        >
          Fast / weak (3,1,1)
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setN(3);
            setW(3);
            setR(1);
          }}
        >
          Fast reads (3,3,1)
        </Button>
      </div>
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label} · <span className="font-mono text-fg">{value}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-accent"
      />
    </label>
  );
}

function Flag({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <div className={`rounded-lg border px-3 py-3 text-sm ${ok ? "border-ok/40 bg-ok/10 text-ok" : "border-bad/40 bg-bad/10 text-bad"}`}>
      {ok ? yes : no}
    </div>
  );
}
