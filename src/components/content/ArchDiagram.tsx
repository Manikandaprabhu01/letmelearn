import type { Diagram, DiagramNode, SystemColumn } from "@/data/types";
import { cn } from "@/lib/utils";

const toneClass: Record<NonNullable<DiagramNode["tone"]>, string> = {
  default: "bg-raised border-border text-fg",
  accent: "bg-accent/12 border-accent/40 text-accent",
  ok: "bg-ok/12 border-ok/40 text-ok",
  bad: "bg-bad/12 border-bad/40 text-bad",
  warn: "bg-warn/12 border-warn/40 text-warn",
};

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
    <figure className="my-5 overflow-x-auto rounded-lg border border-border bg-inset p-3 sm:p-4">
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
      {caption ? <figcaption className="mt-3 text-center text-xs text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

export function ArchDiagram({ diagram }: { diagram: Diagram }) {
  if (diagram.kind === "system") {
    return <SystemBoard columns={diagram.columns} caption={diagram.caption} />;
  }

  if (diagram.kind === "flow") {
    return (
      <figure className="my-5 overflow-x-auto rounded-lg border border-border bg-inset p-4">
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
        {diagram.caption ? (
          <figcaption className="mt-3 text-center text-xs text-muted">{diagram.caption}</figcaption>
        ) : null}
      </figure>
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
    <figure className="my-5 overflow-x-auto rounded-lg border border-border bg-inset p-4">
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
      <figcaption className="mt-3 text-center text-xs text-muted">{diagram.caption ?? `${total}-bit layout`}</figcaption>
    </figure>
  );
}
