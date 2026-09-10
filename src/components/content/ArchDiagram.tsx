import type {
  CompareDiagram,
  Diagram,
  DiagramNode,
  ErDiagram,
  SequenceDiagram,
  SystemColumn,
  Tone,
  UmlDiagram,
} from "@/data/types";
import { cn } from "@/lib/utils";

const toneClass: Record<Tone, string> = {
  default: "bg-raised border-border text-fg",
  accent: "bg-accent/12 border-accent/40 text-accent",
  ok: "bg-ok/12 border-ok/40 text-ok",
  bad: "bg-bad/12 border-bad/40 text-bad",
  warn: "bg-warn/12 border-warn/40 text-warn",
};

const strokeTone: Record<Tone, string> = {
  default: "text-faint",
  accent: "text-accent",
  ok: "text-ok",
  bad: "text-bad",
  warn: "text-warn",
};

function Figure({
  children,
  caption,
  className,
}: {
  children: React.ReactNode;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("my-5 rounded-lg border border-border bg-inset p-3 sm:p-4", className)}>
      {children}
      {caption ? <figcaption className="mt-3 text-center text-xs text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

function NodeCard({ node }: { node: DiagramNode }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border px-3 py-2 text-center",
        toneClass[node.tone ?? "default"],
      )}
    >
      <div className="text-sm font-medium leading-snug">{node.label}</div>
      {node.sub ? <div className="mt-0.5 text-xs text-muted">{node.sub}</div> : null}
    </div>
  );
}

function Arrow({ axis = "x" }: { axis?: "x" | "y" }) {
  if (axis === "y") {
    return (
      <div className="flex items-center justify-center py-1 text-faint" aria-hidden="true">
        <svg width="10" height="16" viewBox="0 0 10 16">
          <path d="M5 0v14M1 10l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center text-faint" aria-hidden="true">
      <svg width="18" height="10" viewBox="0 0 18 10" className="hidden sm:block">
        <path d="M0 5h16M12 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <svg width="10" height="16" viewBox="0 0 10 16" className="sm:hidden">
        <path d="M5 0v14M1 10l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

const colCount: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};

function SystemBoard({ columns, caption }: { columns: SystemColumn[]; caption?: string }) {
  return (
    <Figure caption={caption} className="overflow-x-auto">
      <div className={cn("grid grid-cols-1 gap-3", colCount[columns.length] ?? "sm:grid-cols-4")}>
        {columns.map((col, i) => (
          <div key={col.title} className="flex flex-col">
            {i > 0 ? (
              <div className="flex justify-center sm:hidden">
                <Arrow axis="y" />
              </div>
            ) : null}
            <div className="flex min-h-full flex-col rounded-md border border-border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{col.title}</div>
                {i < columns.length - 1 ? (
                  <span className="hidden text-faint sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {col.nodes.map((node) => (
                  <NodeCard key={node.id} node={node} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------ sequence */

function SequenceBoard({ diagram }: { diagram: SequenceDiagram }) {
  const { actors, messages, caption } = diagram;
  const index = new Map(actors.map((a, i) => [a.id, i]));
  const cols = `repeat(${actors.length}, minmax(104px, 1fr))`;

  return (
    <Figure caption={caption} className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid gap-2" style={{ gridTemplateColumns: cols }}>
          {actors.map((a) => (
            <div key={a.id} className="rounded-md border border-accent/30 bg-accent/8 px-2 py-2 text-center">
              <div className="text-[13px] font-medium leading-snug text-fg">{a.label}</div>
              {a.sub ? <div className="mt-0.5 text-[10px] text-muted">{a.sub}</div> : null}
            </div>
          ))}
        </div>

        <div className="relative mt-2">
          {/* lifelines */}
          <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: cols }} aria-hidden>
            {actors.map((a) => (
              <div key={a.id} className="flex justify-center">
                <span className="h-full w-px bg-border" />
              </div>
            ))}
          </div>

          <div className="relative grid" style={{ gridTemplateColumns: cols }}>
            {messages.map((m, i) => {
              const from = index.get(m.from) ?? 0;
              const to = index.get(m.to) ?? from;
              const self = m.kind === "self" || from === to;
              const start = Math.min(from, to);
              const end = Math.max(from, to);
              const rightward = to >= from;
              const dashed = m.kind === "return" || m.kind === "async";
              const stroke = strokeTone[m.tone ?? (m.kind === "return" ? "default" : "accent")];

              return (
                <div
                  key={`${i}-${m.label}`}
                  className="px-1 py-2"
                  style={{ gridRow: i + 1, gridColumn: `${start + 1} / ${end + 2}` }}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="mt-px font-mono text-[10px] tabular-nums text-faint">{i + 1}</span>
                    <span className="text-[12px] leading-snug text-fg">{m.label}</span>
                  </div>
                  {self ? (
                    <div className={cn("mt-1 flex items-center gap-1", stroke)} aria-hidden>
                      <svg width="34" height="14" viewBox="0 0 34 14" className="shrink-0">
                        <path
                          d="M2 3h26a4 4 0 0 1 0 8H10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeDasharray={dashed ? "3 3" : undefined}
                        />
                        <path d="M14 7l-4 4-0-8z" fill="currentColor" />
                      </svg>
                      <span className="text-[10px] text-faint">self</span>
                    </div>
                  ) : (
                    <div className={cn("mt-1 flex items-center", stroke)} aria-hidden>
                      {!rightward ? <span className="-mr-px text-[10px] leading-none">◀</span> : null}
                      <span
                        className={cn("h-px flex-1", dashed ? "bg-transparent" : "bg-current")}
                        style={
                          dashed
                            ? {
                                backgroundImage:
                                  "repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 8px)",
                                height: "1px",
                              }
                            : undefined
                        }
                      />
                      {rightward ? <span className="-ml-px text-[10px] leading-none">▶</span> : null}
                    </div>
                  )}
                  {m.note ? <div className="mt-1 text-[11px] leading-snug text-muted">{m.note}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Figure>
  );
}

/* ------------------------------------------------------------------------ er */

const keyBadge: Record<NonNullable<import("@/data/types").ErField["key"]>, string> = {
  pk: "border-accent/40 bg-accent/12 text-accent",
  fk: "border-warn/40 bg-warn/12 text-warn",
  idx: "border-border bg-raised text-muted",
};

function ErBoard({ diagram }: { diagram: ErDiagram }) {
  return (
    <Figure caption={diagram.caption}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {diagram.entities.map((e) => (
          <div key={e.name} className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="border-b border-border bg-raised px-3 py-2">
              <div className="font-mono text-[13px] font-medium text-accent">{e.name}</div>
              {e.note ? <div className="mt-0.5 text-[11px] text-muted">{e.note}</div> : null}
            </div>
            <ul className="divide-y divide-border">
              {e.fields.map((f) => (
                <li key={f.name} className="flex items-baseline gap-2 px-3 py-1.5">
                  {f.key ? (
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1 font-mono text-[9px] uppercase leading-4",
                        keyBadge[f.key],
                      )}
                    >
                      {f.key}
                    </span>
                  ) : (
                    <span className="w-[26px] shrink-0" aria-hidden />
                  )}
                  <span className="font-mono text-[12px] text-fg">{f.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-faint">{f.type}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {diagram.relations?.length ? (
        <ul className="mt-3 space-y-1.5 rounded-md border border-border bg-surface px-3 py-2">
          {diagram.relations.map((r) => (
            <li key={`${r.from}-${r.to}-${r.label}`} className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
              <span className="font-mono text-fg">{r.from}</span>
              <span className="text-faint" aria-hidden>
                ──▶
              </span>
              <span className="font-mono text-fg">{r.to}</span>
              {r.cardinality ? (
                <span className="rounded border border-border bg-raised px-1 font-mono text-[10px] text-muted">
                  {r.cardinality}
                </span>
              ) : null}
              <span className="text-muted">{r.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Figure>
  );
}

/* ------------------------------------------------------------------- compare */

function CompareBoard({ diagram }: { diagram: CompareDiagram }) {
  const n = diagram.options.length;
  return (
    <Figure caption={diagram.caption}>
      <div className={cn("grid gap-3", n >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {diagram.options.map((o) => (
          <div
            key={o.title}
            className={cn("flex flex-col rounded-md border bg-surface p-3", toneClass[o.tone ?? "default"])}
          >
            <div className="text-sm font-medium text-fg">{o.title}</div>
            {o.sub ? <div className="mt-0.5 text-[11px] text-muted">{o.sub}</div> : null}
            <ul className="mt-2.5 space-y-1.5">
              {o.good.map((g) => (
                <li key={g} className="flex gap-2 text-[12.5px] leading-5 text-muted">
                  <span className="mt-px shrink-0 font-mono text-[11px] text-ok" aria-hidden>
                    +
                  </span>
                  <span>{g}</span>
                </li>
              ))}
              {o.bad.map((b) => (
                <li key={b} className="flex gap-2 text-[12.5px] leading-5 text-muted">
                  <span className="mt-px shrink-0 font-mono text-[11px] text-bad" aria-hidden>
                    −
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {o.verdict ? (
              <div className="mt-auto border-t border-border pt-2 text-[11.5px] leading-5 text-fg">
                <span className="text-[10px] uppercase tracking-[0.14em] text-faint">Pick when </span>
                {o.verdict}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Figure>
  );
}

/* ----------------------------------------------------------------------- uml */

const stereotypeLabel: Record<string, string> = {
  interface: "«interface»",
  abstract: "«abstract»",
  enum: "«enum»",
  record: "«record»",
  class: "",
};

const edgeGlyph: Record<string, string> = {
  implements: "┈┈▷",
  extends: "───▷",
  has: "───◆",
  uses: "───▶",
};

function UmlBoard({ diagram }: { diagram: UmlDiagram }) {
  return (
    <Figure caption={diagram.caption}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {diagram.boxes.map((b) => (
          <div
            key={b.name}
            className={cn("overflow-hidden rounded-md border bg-surface", toneClass[b.tone ?? "default"])}
          >
            <div className="border-b border-border bg-raised px-3 py-2 text-center">
              {b.stereotype && stereotypeLabel[b.stereotype] ? (
                <div className="font-mono text-[10px] text-faint">{stereotypeLabel[b.stereotype]}</div>
              ) : null}
              <div className="font-mono text-[13px] font-medium text-fg">{b.name}</div>
            </div>
            <ul className="px-3 py-2">
              {b.members.map((m) => (
                <li key={m.name} className="py-0.5">
                  <span className="font-mono text-[11px] text-accent">{m.vis ?? "+"}</span>{" "}
                  <span
                    className={cn(
                      "font-mono text-[11.5px]",
                      m.kind === "field" ? "text-muted" : "text-fg",
                    )}
                  >
                    {m.name}
                  </span>
                  {m.note ? <span className="ml-1 text-[10.5px] text-faint">— {m.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {diagram.edges?.length ? (
        <ul className="mt-3 space-y-1.5 rounded-md border border-border bg-surface px-3 py-2">
          {diagram.edges.map((e) => (
            <li key={`${e.from}-${e.to}-${e.kind}`} className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
              <span className="font-mono text-fg">{e.from}</span>
              <span className="font-mono text-faint" aria-hidden>
                {edgeGlyph[e.kind ?? "uses"]}
              </span>
              <span className="font-mono text-fg">{e.to}</span>
              <span className="text-muted">{e.label ?? e.kind ?? "uses"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Figure>
  );
}

/* -------------------------------------------------------------------- export */

export function ArchDiagram({ diagram }: { diagram: Diagram }) {
  if (diagram.kind === "system") {
    return <SystemBoard columns={diagram.columns} caption={diagram.caption} />;
  }

  if (diagram.kind === "sequence") return <SequenceBoard diagram={diagram} />;
  if (diagram.kind === "er") return <ErBoard diagram={diagram} />;
  if (diagram.kind === "compare") return <CompareBoard diagram={diagram} />;
  if (diagram.kind === "uml") return <UmlBoard diagram={diagram} />;

  if (diagram.kind === "flow") {
    return (
      <Figure caption={diagram.caption} className="overflow-x-auto">
        <div className="flex min-w-min flex-col gap-3">
          {diagram.rows.map((row, i) => (
            <div key={i} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
              {row.map((node, j) => (
                <div key={node.id} className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  {j > 0 ? <Arrow /> : null}
                  <NodeCard node={node} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Figure>
    );
  }

  if (diagram.kind === "layers") {
    return (
      <figure className="my-5 overflow-hidden rounded-lg border border-border bg-inset">
        {diagram.layers.map((layer, i) => (
          <div key={layer.title} className={cn("px-4 py-3", i > 0 && "border-t border-border")}>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{layer.title}</div>
            <div className="flex flex-wrap gap-2">
              {layer.items.map((item) => (
                <span key={item} className="rounded-md border border-border bg-raised px-2.5 py-1 text-xs text-fg">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
        {diagram.caption ? (
          <figcaption className="border-t border-border px-4 py-2 text-xs text-muted">{diagram.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  const total = diagram.fields.reduce((s, f) => s + f.bits, 0);
  return (
    <Figure caption={diagram.caption ?? `${total}-bit layout`} className="overflow-x-auto">
      <div className="flex min-w-[520px] overflow-hidden rounded-md border border-border">
        {diagram.fields.map((field) => (
          <div
            key={field.label}
            className="border-r border-border bg-raised px-2 py-3 text-center last:border-r-0"
            style={{ flex: field.bits }}
          >
            <div className="font-mono text-[11px] text-accent">{field.bits}b</div>
            <div className="mt-1 text-xs font-medium">{field.label}</div>
            {field.note ? <div className="mt-1 text-[10px] text-muted">{field.note}</div> : null}
          </div>
        ))}
      </div>
    </Figure>
  );
}
