import type { CodeBlock, Diagram, Section } from "@/data/types";
import { ArchDiagram } from "@/components/content/ArchDiagram";
import { headingId } from "@/lib/toc";
import { cn } from "@/lib/utils";

const calloutTone = {
  note: "border-border bg-raised",
  insight: "border-accent/30 bg-accent/8",
  warn: "border-warn/30 bg-warn/8",
  interview: "border-ok/30 bg-ok/8",
};

const calloutLabel = {
  note: "Note",
  insight: "Insight",
  warn: "Watch out",
  interview: "In the interview",
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function Code({ block }: { block: CodeBlock }) {
  return (
    <figure className="mt-4 overflow-hidden rounded-lg border border-border bg-inset">
      {block.title ? (
        <figcaption className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <span className="font-mono text-[11px] text-faint">{block.title}</span>
          {block.lang ? (
            <span className="shrink-0 rounded border border-border bg-raised px-1.5 font-mono text-[10px] uppercase text-faint">
              {block.lang}
            </span>
          ) : null}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg">
        <code>{block.source}</code>
      </pre>
    </figure>
  );
}

export function SectionBlock({ section, index }: { section: Section; index: number }) {
  const codes = asArray<CodeBlock>(section.code);
  const diagrams = asArray<Diagram>(section.diagram);

  return (
    <section className="scroll-mt-24" id={headingId(section.heading, index)}>
      <h2 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
        {section.heading}
      </h2>
      {section.lede ? (
        <p className="mt-1.5 max-w-prose text-[13.5px] leading-6 text-faint">{section.lede}</p>
      ) : null}

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
              <span className="font-mono text-xs text-accent tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {section.steps ? (
        <ol className="mt-4 space-y-0 border-l border-border pl-0">
          {section.steps.map((s, i) => (
            <li key={s.title} className="relative pb-5 pl-6 last:pb-0">
              <span className="absolute -left-[9px] top-0.5 flex size-[18px] items-center justify-center rounded-full border border-accent/40 bg-inset font-mono text-[10px] tabular-nums text-accent">
                {i + 1}
              </span>
              <div className="text-[14.5px] font-medium leading-6 text-fg">{s.title}</div>
              <p className="mt-1 max-w-prose text-[14px] leading-6 text-muted">{s.text}</p>
              {s.detail ? (
                <p className="mt-1.5 max-w-prose rounded-md border border-border bg-inset px-3 py-2 font-mono text-[11.5px] leading-5 text-faint">
                  {s.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {section.math ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <tbody>
              {section.math.map((m) => (
                <tr key={m.label} className="border-t border-border first:border-t-0">
                  <th className="w-[28%] px-3 py-2 align-top font-medium text-fg">{m.label}</th>
                  <td className="px-3 py-2 align-top font-mono text-[12px] text-muted">
                    {m.expr}
                    {m.note ? (
                      <div className="mt-0.5 font-sans text-[11.5px] text-faint">{m.note}</div>
                    ) : null}
                  </td>
                  <td className="w-[22%] whitespace-nowrap px-3 py-2 text-right align-top font-mono text-[12.5px] font-medium text-accent">
                    {m.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {section.table ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            {section.table.caption ? (
              <caption className="border-b border-border px-3 py-2 text-left text-[11.5px] text-faint">
                {section.table.caption}
              </caption>
            ) : null}
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

      {codes.map((c) => (
        <Code key={(c.title ?? "") + c.source.slice(0, 32)} block={c} />
      ))}

      {diagrams.map((d, i) => (
        <ArchDiagram key={`${d.kind}-${i}`} diagram={d} />
      ))}

      {section.followUps ? (
        <dl className="mt-4 space-y-3">
          {section.followUps.map((f) => (
            <div key={f.q} className="rounded-lg border border-border bg-surface px-4 py-3">
              <dt className="text-[14px] font-medium leading-6 text-fg">
                <span className="mr-2 font-mono text-[11px] text-accent">Q</span>
                {f.q}
              </dt>
              <dd className="mt-1.5 max-w-prose text-[14px] leading-6 text-muted">
                <span className="mr-2 font-mono text-[11px] text-ok">A</span>
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {section.callout ? (
        <aside
          className={cn(
            "mt-4 rounded-lg border px-4 py-3 text-sm leading-6",
            calloutTone[section.callout.kind],
          )}
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            {section.callout.title ?? calloutLabel[section.callout.kind]}
          </div>
          <p className="mt-1 max-w-prose text-muted">{section.callout.text}</p>
        </aside>
      ) : null}

      {section.links?.length ? (
        <div className="mt-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
            Watch / read
          </div>
          <ul className="mt-2 space-y-1.5">
            {section.links.map((l) => (
              <li key={l.href} className="flex gap-2 text-[14px] leading-6">
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent/60" />
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.takeaways ? (
        <div className="mt-4 rounded-lg border border-accent/25 bg-accent/6 px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Takeaways
          </div>
          <ul className="mt-2 space-y-1.5">
            {section.takeaways.map((t) => (
              <li key={t} className="flex gap-2 text-[14px] leading-6 text-muted">
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
