import type { Section } from "@/data/types";
import { ArchDiagram } from "@/components/content/ArchDiagram";
import { cn } from "@/lib/utils";

const calloutTone = {
  note: "border-border bg-raised text-muted",
  insight: "border-accent/30 bg-accent/8 text-fg",
  warn: "border-warn/30 bg-warn/8 text-fg",
};

export function SectionBlock({ section, index }: { section: Section; index: number }) {
  return (
    <section className="scroll-mt-24" id={`s-${index}`}>
      <h2 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
        {section.heading}
      </h2>
      {section.body?.map((p) => (
        <p key={p.slice(0, 48)} className="mt-3 max-w-prose text-[15px] leading-7 text-muted">
          {p}
        </p>
      ))}
      {section.bullets ? (
        <ul className="mt-3 max-w-prose space-y-2 text-[15px] leading-6 text-muted">
          {section.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.numbered ? (
        <ol className="mt-3 max-w-prose space-y-2 text-[15px] leading-6 text-muted">
          {section.numbered.map((b, i) => (
            <li key={b} className="flex gap-3">
              <span className="font-mono text-xs text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span>{b}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {section.table ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-raised text-xs uppercase tracking-wider text-faint">
              <tr>
                {section.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-3 py-2 align-top text-muted",
                        j === 0 && "font-medium text-fg",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {section.code ? (
        <figure className="mt-4 overflow-hidden rounded-lg border border-border bg-inset">
          {section.code.title ? (
            <figcaption className="border-b border-border px-4 py-2 font-mono text-[11px] text-faint">
              {section.code.title}
            </figcaption>
          ) : null}
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg">
            <code>{section.code.source}</code>
          </pre>
        </figure>
      ) : null}
      {section.diagram ? <ArchDiagram diagram={section.diagram} /> : null}
      {section.callout ? (
        <aside
          className={cn(
            "mt-4 rounded-lg border px-4 py-3 text-sm leading-6",
            calloutTone[section.callout.kind],
          )}
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            {section.callout.title ?? section.callout.kind}
          </div>
          <p className="mt-1 text-muted">{section.callout.text}</p>
        </aside>
      ) : null}
    </section>
  );
}
