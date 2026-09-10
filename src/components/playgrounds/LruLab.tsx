import { useState } from "react";
import { Button } from "@/components/ui/button";

type Node = { key: string; value: string };

const KEYS = ["a", "b", "c", "d", "e", "f"];

export function LruLab() {
  const [cap, setCap] = useState(4);
  const [list, setList] = useState<Node[]>([
    { key: "a", value: "1" },
    { key: "b", value: "2" },
    { key: "c", value: "3" },
  ]);
  const [msg, setMsg] = useState("Head is hottest. Tail is the eviction victim.");

  const get = (key: string) => {
    const i = list.findIndex((n) => n.key === key);
    if (i < 0) {
      setMsg(`get(${key}) miss`);
      return;
    }
    const node = list[i];
    setList([node, ...list.filter((_, j) => j !== i)]);
    setMsg(`get(${key}) hit — moved to head`);
  };

  const put = (key: string) => {
    const value = String((Number(list.find((n) => n.key === key)?.value ?? "0") || 0) + 1);
    const rest = list.filter((n) => n.key !== key);
    let next = [{ key, value }, ...rest];
    let note = `put(${key}=${value}) at head`;
    if (next.length > cap) {
      const evicted = next[next.length - 1];
      next = next.slice(0, cap);
      note += ` · evicted ${evicted.key}`;
    }
    setList(next);
    setMsg(note);
  };

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        Map for O(1) lookup, doubly linked list for recency. This lab shows the list: left is MRU, right is LRU.
      </p>
      <label className="block max-w-xs text-xs text-muted">
        Capacity {cap}
        <input
          type="range"
          min={2}
          max={6}
          value={cap}
          onChange={(e) => {
            const c = Number(e.target.value);
            setCap(c);
            setList((xs) => xs.slice(0, c));
          }}
          className="mt-2 w-full accent-accent"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {list.map((n, i) => (
          <div key={n.key} className="flex items-center gap-2">
            <div className={`rounded-md border px-4 py-3 ${i === 0 ? "border-accent bg-accent/15" : "border-border bg-raised"}`}>
              <div className="font-mono text-lg">{n.key}</div>
              <div className="text-xs text-muted">val {n.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-faint">
                {i === 0 ? "head / MRU" : i === list.length - 1 ? "tail / LRU" : " "}
              </div>
            </div>
            {i < list.length - 1 ? <span className="text-faint">→</span> : null}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">{msg}</p>
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-faint">Get</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {KEYS.map((k) => (
            <Button key={k} size="sm" variant="secondary" onClick={() => get(k)}>
              get {k}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-faint">Put</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {KEYS.map((k) => (
            <Button key={k} size="sm" onClick={() => put(k)}>
              put {k}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
