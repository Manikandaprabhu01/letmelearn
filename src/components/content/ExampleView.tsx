import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { ArchitectureBoard } from "@/components/content/ArchitectureBoard";
import { PageHeader } from "@/components/content/PageHeader";
import { RelatedList } from "@/components/content/RelatedList";
import { SectionBlock } from "@/components/content/SectionBlock";
import { Toc } from "@/components/content/Toc";
import { Button } from "@/components/ui/button";
import { getBoard } from "@/data/boards";
import type { DesignExample } from "@/data/types";
import { headingId, type TocEntry } from "@/lib/toc";

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-[11px] tabular-nums text-accent">
        {n}
      </span>
      <span className="eyebrow">{title}</span>
    </div>
  );
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 font-display text-xl font-medium tracking-tight sm:text-2xl"
    >
      {children}
    </h2>
  );
}

export function ExampleView({ example, id }: { example: DesignExample; id: string }) {
  const board = getBoard(example.slug);

  const toc: TocEntry[] = [
    { id: "requirements", label: "Requirements", group: "1 · Scope" },
    ...(example.estimation?.length || example.math?.length
      ? [{ id: "estimation", label: "Back of the envelope", group: "1 · Scope" }]
      : []),
    ...(example.apis?.length
      ? [{ id: "apis", label: "API design", group: "2 · High-level design" }]
      : []),
    ...(example.dataModel?.length
      ? [{ id: "data-model", label: "Data model", group: "2 · High-level design" }]
      : []),
    ...(board
      ? [{ id: "architecture-board", label: "Architecture", group: "2 · High-level design" }]
      : []),
    ...example.architecture.map((s, i) => ({
      id: headingId(s.heading, i),
      label: s.heading,
      group: "2 · High-level design",
    })),
    ...example.deepDives.map((s, i) => ({
      id: headingId(s.heading, 100 + i),
      label: s.heading,
      group: "3 · Deep dive",
    })),
    ...(example.tradeoffs.length
      ? [{ id: "tradeoffs", label: "Trade-offs", group: "4 · Wrap up" }]
      : []),
    ...(example.wrapUp?.length
      ? [{ id: "wrap-up", label: "What to say at the end", group: "4 · Wrap up" }]
      : []),
    ...(example.followUps?.length
      ? [{ id: "follow-ups", label: "Follow-up questions", group: "4 · Wrap up" }]
      : []),
  ];

  return (
    <article>
      <PageHeader
        kicker={`${example.source}${example.chapter ? ` · Chapter ${example.chapter}` : ""}`}
        title={example.title}
        subtitle={example.summary}
        minutes={example.minutes}
        tags={[example.difficulty, ...example.tags]}
        id={id}
      />
      <div className="px-5 py-8 sm:px-8 lg:px-12">
        <div className="lg:flex lg:gap-12">
          <div className="min-w-0 flex-1 space-y-10">
            {example.playground ? (
              <Button asChild variant="secondary">
                <Link to={"/playgrounds/$slug"} params={{ slug: example.playground }}>
                  <FlaskConical className="size-4" />
                  Open the matching lab
                </Link>
              </Button>
            ) : null}

            {example.companies.length ? (
              <p className="text-sm text-muted">In the wild: {example.companies.join(" · ")}</p>
            ) : null}

            <StepLabel n={1} title="Understand the problem, establish scope" />

            {example.clarifying?.length ? (
              <section>
                <H2>Questions to ask first</H2>
                <p className="mt-2 max-w-prose text-[14px] leading-6 text-faint">
                  The first five minutes decide what you build. These are the questions worth
                  spending them on, and the answers this design assumes.
                </p>
                <dl className="mt-4 space-y-3">
                  {example.clarifying.map((c) => (
                    <div key={c.q} className="rounded-lg border border-border bg-surface px-4 py-3">
                      <dt className="text-[14px] font-medium leading-6 text-fg">
                        <span className="mr-2 font-mono text-[11px] text-accent">You</span>
                        {c.q}
                      </dt>
                      <dd className="mt-1.5 max-w-prose text-[14px] leading-6 text-muted">
                        <span className="mr-2 font-mono text-[11px] text-ok">Them</span>
                        {c.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section>
              <H2 id="requirements">Requirements</H2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="eyebrow">Functional</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                    {example.requirements.functional.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="eyebrow">Non-functional</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                    {example.requirements.nonFunctional.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {example.estimation?.length || example.math?.length ? (
              <section>
                <H2 id="estimation">Back of the envelope</H2>
                {example.math?.length ? (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <tbody>
                        {example.math.map((m) => (
                          <tr key={m.label} className="border-t border-border first:border-t-0">
                            <th className="w-[28%] px-3 py-2 align-top font-medium text-fg">
                              {m.label}
                            </th>
                            <td className="px-3 py-2 align-top font-mono text-[12px] text-muted">
                              {m.expr}
                              {m.note ? (
                                <div className="mt-0.5 font-sans text-[11.5px] text-faint">
                                  {m.note}
                                </div>
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
                {example.estimation?.length ? (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <tbody>
                        {example.estimation.map((e) => (
                          <tr key={e.item} className="border-t border-border first:border-t-0">
                            <th className="px-3 py-2 font-medium">{e.item}</th>
                            <td className="px-3 py-2 font-mono text-xs text-muted">{e.calc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            ) : null}

            <StepLabel n={2} title="Propose the high-level design" />

            {example.apis?.length ? (
              <section>
                <H2 id="apis">API design</H2>
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-raised text-xs uppercase tracking-wider text-faint">
                      <tr>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Path</th>
                        <th className="px-3 py-2">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {example.apis.map((a) => (
                        <tr key={a.path + a.method} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs text-accent">{a.method}</td>
                          <td className="px-3 py-2 font-mono text-xs">{a.path}</td>
                          <td className="px-3 py-2 text-muted">{a.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {example.dataModel?.length ? (
              <section>
                <H2 id="data-model">Data model</H2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {example.dataModel.map((d) => (
                    <div key={d.entity} className="rounded-lg border border-border bg-inset p-4">
                      <div className="font-mono text-sm text-accent">{d.entity}</div>
                      <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
                        {d.fields.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {board ? (
              <div id="architecture-board" className="scroll-mt-24">
                <ArchitectureBoard board={board} />
              </div>
            ) : null}

            {example.architecture.map((s, i) => (
              <SectionBlock key={s.heading} section={s} index={i} />
            ))}

            {example.deepDives.length ? (
              <div className="space-y-10">
                <StepLabel n={3} title="Design deep dive" />
                {example.deepDives.map((s, i) => (
                  <SectionBlock key={s.heading} section={s} index={100 + i} />
                ))}
              </div>
            ) : null}

            <StepLabel n={4} title="Wrap up" />

            {example.tradeoffs.length ? (
              <section>
                <H2 id="tradeoffs">Trade-offs</H2>
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-raised text-xs uppercase tracking-wider text-faint">
                      <tr>
                        <th className="px-3 py-2">Choice</th>
                        <th className="px-3 py-2">Pick when</th>
                        <th className="px-3 py-2">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {example.tradeoffs.map((t) => (
                        <tr key={t.choice} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{t.choice}</td>
                          <td className="px-3 py-2 text-muted">{t.pickWhen}</td>
                          <td className="px-3 py-2 text-muted">{t.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {example.wrapUp?.length ? (
              <section>
                <H2 id="wrap-up">What to say at the end</H2>
                <ul className="mt-4 space-y-2">
                  {example.wrapUp.map((w) => (
                    <li key={w} className="flex gap-2.5 text-[15px] leading-7 text-muted">
                      <span className="mt-[11px] size-1 shrink-0 rounded-full bg-accent" />
                      <span className="max-w-prose">{w}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {example.followUps?.length ? (
              <section>
                <H2 id="follow-ups">Follow-up questions</H2>
                <dl className="mt-4 space-y-3">
                  {example.followUps.map((f) => (
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
              </section>
            ) : null}

            {example.furtherReading.length ? (
              <div>
                <h2 className="eyebrow">Sources</h2>
                <ul className="mt-3 space-y-2">
                  {example.furtherReading.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-accent hover:underline"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <RelatedList paths={example.related} />
          </div>

          <aside className="order-first mb-8 hidden shrink-0 lg:sticky lg:top-24 lg:order-none lg:mb-0 lg:block lg:h-fit lg:w-56">
            <Toc entries={toc} />
          </aside>
        </div>
      </div>
    </article>
  );
}
