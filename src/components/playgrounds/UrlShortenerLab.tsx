import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const ALPH = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function to62(n: number) {
  if (n === 0) return "0";
  let x = n;
  let out = "";
  while (x > 0) {
    out = ALPH[x % 62] + out;
    x = Math.floor(x / 62);
  }
  return out;
}

function from62(s: string) {
  let n = 0;
  for (const ch of s) {
    const i = ALPH.indexOf(ch);
    if (i < 0) return null;
    n = n * 62 + i;
  }
  return n;
}

export function UrlShortenerLab() {
  const [counter, setCounter] = useState(1_000_000_000);
  const [custom, setCustom] = useState("");
  const code = useMemo(() => to62(counter).padStart(7, "0"), [counter]);
  const decoded = from62(custom);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        A global counter (or Snowflake) converted to base62 is collision-free and compact. 62^7 ≈ 3.5 trillion codes —
        enough for 100 million new URLs a day for decades.
      </p>
      <div className="rounded-lg border border-border bg-inset p-5">
        <div className="text-[11px] uppercase tracking-[0.14em] text-faint">Counter</div>
        <div className="mt-1 font-mono text-2xl tabular-nums">{counter.toLocaleString()}</div>
        <div className="mt-4 text-[11px] uppercase tracking-[0.14em] text-faint">Base62 code</div>
        <div className="mt-1 font-mono text-3xl tracking-wide text-accent">{code}</div>
        <div className="mt-2 text-sm text-muted">https://ltc.es/{code}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setCounter((c) => c + 1)}>Next ID</Button>
          <Button variant="secondary" onClick={() => setCounter((c) => c + 1000)}>
            Skip 1k
          </Button>
        </div>
      </div>
      <label className="block text-xs text-muted">
        Decode a code
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value.trim())}
          placeholder="3j6U8n"
          className="mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg placeholder:text-faint"
        />
      </label>
      {custom ? (
        <p className="font-mono text-sm">
          {decoded === null ? "Invalid character (use 0-9 a-z A-Z)" : `counter = ${decoded.toLocaleString()}`}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border text-sm">
        <table className="w-full min-w-[480px] text-left">
          <thead className="bg-raised text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-3 py-2">Length</th>
              <th className="px-3 py-2">Space</th>
              <th className="px-3 py-2">At 100M / day</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            {[5, 6, 7, 8].map((len) => {
              const space = 62 ** len;
              const days = space / 1e8;
              return (
                <tr key={len} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-fg">{len}</td>
                  <td className="px-3 py-2 font-mono text-xs">{space.toExponential(2)}</td>
                  <td className="px-3 py-2">{days < 365 ? `${days.toFixed(0)} days` : `${(days / 365).toFixed(0)} years`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
