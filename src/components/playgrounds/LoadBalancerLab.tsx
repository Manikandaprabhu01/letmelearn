import { useState } from "react";
import { Button } from "@/components/ui/button";

type Algo = "rr" | "lc" | "hash";

type Server = { id: string; inflight: number; hits: number };

const START: Server[] = [
  { id: "s1", inflight: 0, hits: 0 },
  { id: "s2", inflight: 0, hits: 0 },
  { id: "s3", inflight: 0, hits: 0 },
];

export function LoadBalancerLab() {
  const [algo, setAlgo] = useState<Algo>("rr");
  const [servers, setServers] = useState<Server[]>(START);
  const [rr, setRr] = useState(0);
  const [key, setKey] = useState("user:42");
  const [last, setLast] = useState<string | null>(null);

  const pick = (list: Server[]) => {
    if (algo === "rr") {
      const i = rr % list.length;
      setRr(i + 1);
      return list[i].id;
    }
    if (algo === "lc") {
      return [...list].sort((a, b) => a.inflight - b.inflight || a.id.localeCompare(b.id))[0].id;
    }
    let h = 0;
    for (const ch of key) h = (h + ch.charCodeAt(0) * 17) % list.length;
    return list[h].id;
  };

  const send = () => {
    const id = pick(servers);
    setLast(id);
    setServers((ss) =>
      ss.map((s) => (s.id === id ? { ...s, inflight: s.inflight + 1, hits: s.hits + 1 } : s)),
    );
    window.setTimeout(() => {
      setServers((ss) =>
        ss.map((s) => (s.id === id ? { ...s, inflight: Math.max(0, s.inflight - 1) } : s)),
      );
    }, 900);
  };

  const reset = () => {
    setServers(START);
    setRr(0);
    setLast(null);
  };

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Three backends, one balancer. Round robin shares equally. Least-connections chases load.
        Hash sticks a key to a box — until the fleet size changes.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["rr", "Round robin"],
            ["lc", "Least connections"],
            ["hash", "Hash"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={algo === id ? "primary" : "secondary"}
            onClick={() => setAlgo(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {algo === "hash" ? (
        <label className="block text-xs text-muted">
          Routing key
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1 h-10 w-full max-w-sm rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg"
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={send}>Send request</Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {servers.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg border p-4 ${last === s.id ? "border-accent bg-accent/10" : "border-border bg-surface"}`}
          >
            <div className="font-mono text-sm">{s.id}</div>
            <div className="mt-2 eyebrow">In flight</div>
            <div className="font-mono text-2xl tabular-nums">{s.inflight}</div>
            <div className="mt-2 text-xs text-muted">{s.hits} total hits</div>
          </div>
        ))}
      </div>
    </div>
  );
}
