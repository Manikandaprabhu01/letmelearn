import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const EPOCH = 1288834974657;
const SEQ_MASK = 0xfff;

export function SnowflakeLab() {
  const [dc, setDc] = useState(3);
  const [worker, setWorker] = useState(7);
  const [seq, setSeq] = useState(0);
  const [lastTs, setLastTs] = useState(-1);
  const [ids, setIds] = useState<bigint[]>([]);
  const [decode, setDecode] = useState("");

  const mint = () => {
    let ts = Date.now();
    let s = seq;
    if (ts === lastTs) {
      s = (s + 1) & SEQ_MASK;
      if (s === 0) {
        while (ts <= lastTs) ts = Date.now();
      }
    } else {
      s = 0;
    }
    setLastTs(ts);
    setSeq(s);
    const id =
      (BigInt(ts - EPOCH) << 22n) |
      (BigInt(dc & 31) << 17n) |
      (BigInt(worker & 31) << 12n) |
      BigInt(s);
    setIds((xs) => [id, ...xs].slice(0, 8));
  };

  const parsed = useMemo(() => {
    try {
      const id = BigInt(decode.trim());
      const sequence = Number(id & 0xfffn);
      const w = Number((id >> 12n) & 0x1fn);
      const d = Number((id >> 17n) & 0x1fn);
      const ts = Number(id >> 22n) + EPOCH;
      return { ok: true as const, sequence, w, d, ts, iso: new Date(ts).toISOString() };
    } catch {
      return null;
    }
  }, [decode]);

  const latest = ids[0];
  const bits = latest !== undefined ? latest.toString(2).padStart(64, "0") : "0".repeat(64);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm leading-6 text-muted">
        1 sign + 41 timestamp + 5 datacenter + 5 worker + 12 sequence. Custom epoch 2010-11-04. Fits
        in a signed 64-bit integer and sorts roughly by time.
      </p>
      <div className="flex min-w-0 overflow-x-auto rounded-md border border-border font-mono text-[10px] sm:text-xs">
        <BitField label="0" bits={bits.slice(0, 1)} flex={1} />
        <BitField label="timestamp" bits={bits.slice(1, 42)} flex={8} />
        <BitField label="dc" bits={bits.slice(42, 47)} flex={2} />
        <BitField label="worker" bits={bits.slice(47, 52)} flex={2} />
        <BitField label="seq" bits={bits.slice(52)} flex={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-xs text-muted">
          Datacenter (0–31)
          <input
            type="number"
            min={0}
            max={31}
            value={dc}
            onChange={(e) => setDc(Number(e.target.value))}
            className="mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg"
          />
        </label>
        <label className="text-xs text-muted">
          Worker (0–31)
          <input
            type="number"
            min={0}
            max={31}
            value={worker}
            onChange={(e) => setWorker(Number(e.target.value))}
            className="mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg"
          />
        </label>
        <div className="flex items-end">
          <Button className="w-full" onClick={mint}>
            Mint ID
          </Button>
        </div>
      </div>
      {ids.length ? (
        <ul className="space-y-1 font-mono text-sm">
          {ids.map((id) => (
            <li key={id.toString()} className="rounded-md border border-border bg-inset px-3 py-2">
              {id.toString()}
            </li>
          ))}
        </ul>
      ) : null}
      <label className="block text-xs text-muted">
        Decode an ID
        <input
          value={decode}
          onChange={(e) => setDecode(e.target.value)}
          placeholder="Paste a 64-bit snowflake"
          className="mt-1 h-10 w-full rounded-md border border-border bg-raised px-3 font-mono text-sm text-fg placeholder:text-faint"
        />
      </label>
      {parsed?.ok ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Row k="UTC" v={parsed.iso} />
          <Row k="Datacenter" v={String(parsed.d)} />
          <Row k="Worker" v={String(parsed.w)} />
          <Row k="Sequence" v={String(parsed.sequence)} />
        </div>
      ) : null}
    </div>
  );
}

function BitField({ label, bits, flex }: { label: string; bits: string; flex: number }) {
  return (
    <div className="border-r border-border px-1 py-2 last:border-r-0" style={{ flex }}>
      <div className="text-center text-[10px] uppercase tracking-wider text-accent">{label}</div>
      <div className="mt-1 break-all text-center text-muted">{bits}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md border border-border bg-raised px-3 py-2">
      <span className="text-muted">{k}</span>
      <span className="font-mono text-xs">{v}</span>
    </div>
  );
}
