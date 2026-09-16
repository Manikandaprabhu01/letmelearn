import { useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "CP" | "AP";

export function CapLab() {
  const [mode, setMode] = useState<Mode>("CP");
  const [partition, setPartition] = useState(false);
  const [valueA, setValueA] = useState("0");
  const [valueB, setValueB] = useState("0");
  const [last, setLast] = useState("Write on A: 0");

  const writeA = () => {
    const next = String(Number(valueA) + 1);
    if (partition && mode === "CP") {
      setLast("CP + partition: A refuses the write to stay consistent with B.");
      return;
    }
    setValueA(next);
    if (!partition) setValueB(next);
    setLast(partition ? `AP: A accepted ${next}. B still ${valueB}.` : `Both nodes now ${next}.`);
  };

  const heal = () => {
    setPartition(false);
    if (mode === "AP") {
      const merged = String(Math.max(Number(valueA), Number(valueB)));
      setValueA(merged);
      setValueB(merged);
      setLast(`Partition healed. Last-write-wins merge → ${merged}.`);
    } else {
      setLast("Partition healed. CP nodes resume taking writes.");
    }
  };

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Two replicas, one network. During a partition CP refuses to lie; AP keeps serving and
        repairs later. Toggle the mode, split the network, then write.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "CP" ? "primary" : "secondary"} onClick={() => setMode("CP")}>
          CP
        </Button>
        <Button variant={mode === "AP" ? "primary" : "secondary"} onClick={() => setMode("AP")}>
          AP
        </Button>
        <Button
          variant={partition ? "danger" : "outline"}
          onClick={() => (partition ? heal() : setPartition(true))}
        >
          {partition ? "Heal partition" : "Split network"}
        </Button>
        <Button onClick={writeA}>Write on A</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NodeCard name="Node A" value={valueA} isolated={partition} />
        <NodeCard name="Node B" value={valueB} isolated={partition} />
      </div>
      <p className="rounded-md border border-border bg-raised px-3 py-2 text-sm text-muted">
        {last}
      </p>
    </div>
  );
}

function NodeCard({ name, value, isolated }: { name: string; value: string; isolated: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${isolated ? "border-bad/50 bg-bad/5" : "border-border bg-surface"}`}
    >
      <div className="eyebrow">{name}</div>
      <div className="mt-2 font-mono text-4xl tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted">
        {isolated ? "Unreachable from peer" : "Replicating"}
      </div>
    </div>
  );
}
