import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Node = { id: string; vnodes: number[] };

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}

const KEYS = ["user:42", "user:7", "post:9", "sess:aa", "cart:1", "img:88", "feed:3", "msg:12"];

export function HashRingLab() {
  const [nodes, setNodes] = useState<Node[]>(() => [
    { id: "A", vnodes: [hash("A:0"), hash("A:1"), hash("A:2")] },
    { id: "B", vnodes: [hash("B:0"), hash("B:1"), hash("B:2")] },
    { id: "C", vnodes: [hash("C:0"), hash("C:1"), hash("C:2")] },
  ]);
  const [next, setNext] = useState("D");

  const ownerOf = (deg: number) => {
    const pts = nodes
      .flatMap((n) => n.vnodes.map((d) => ({ d, id: n.id })))
      .sort((a, b) => a.d - b.d);
    if (!pts.length) return "?";
    const hit = pts.find((p) => p.d >= deg) ?? pts[0];
    return hit.id;
  };

  const assignments = useMemo(
    () => KEYS.map((k) => ({ key: k, deg: hash(k), owner: ownerOf(hash(k)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes],
  );

  const add = () => {
    const id = next;
    setNodes((n) => [...n, { id, vnodes: [hash(`${id}:0`), hash(`${id}:1`), hash(`${id}:2`)] }]);
    setNext(String.fromCharCode(id.charCodeAt(0) + 1));
  };

  const remove = (id: string) => {
    setNodes((n) => (n.length <= 1 ? n : n.filter((x) => x.id !== id)));
  };

  const colors: Record<string, string> = {
    A: "#9eb4c8",
    B: "#7d9b84",
    C: "#c4a574",
    D: "#c4847d",
    E: "#8b8d93",
    F: "#e8e6e1",
  };

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Keys and virtual nodes sit on a 360° ring. A key belongs to the next vnode clockwise. Add a
        server and only the keys on its new arcs should move.
      </p>
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <svg viewBox="0 0 260 260" className="w-full max-w-sm text-fg">
          <circle
            cx="130"
            cy="130"
            r="96"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          {assignments.map((a) => {
            const r = 78;
            const x = 130 + r * Math.cos(((a.deg - 90) * Math.PI) / 180);
            const y = 130 + r * Math.sin(((a.deg - 90) * Math.PI) / 180);
            return <circle key={a.key} cx={x} cy={y} r="4" fill={colors[a.owner] ?? "#9eb4c8"} />;
          })}
          {nodes.flatMap((n) =>
            n.vnodes.map((d, i) => {
              const r = 96;
              const x = 130 + r * Math.cos(((d - 90) * Math.PI) / 180);
              const y = 130 + r * Math.sin(((d - 90) * Math.PI) / 180);
              return (
                <g key={`${n.id}-${i}`}>
                  <circle cx={x} cy={y} r="7" fill={colors[n.id] ?? "#9eb4c8"} />
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#0b0c0e">
                    {n.id}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
        <div className="w-full flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={add} disabled={nodes.length >= 6}>
              Add node {next}
            </Button>
            {nodes.map((n) => (
              <Button key={n.id} variant="secondary" onClick={() => remove(n.id)}>
                Remove {n.id}
              </Button>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-raised text-xs uppercase tracking-wider text-faint">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Angle</th>
                  <th className="px-3 py-2">Owner</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.key} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{a.key}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted">{a.deg}°</td>
                    <td className="px-3 py-2 font-medium" style={{ color: colors[a.owner] }}>
                      {a.owner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
