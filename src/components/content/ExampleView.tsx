import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/content/PageHeader";
import { RelatedList } from "@/components/content/RelatedList";
import { SectionBlock } from "@/components/content/SectionBlock";
import { Button } from "@/components/ui/button";
import type { DesignExample } from "@/data/types";

export function ExampleView({ example, id }: { example: DesignExample; id: string }) {
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
      <div className="space-y-10 px-5 py-8 sm:px-8 lg:px-12">
        {example.playground ? (
          <Button asChild variant="secondary">
            <Link to={"/playgrounds/$slug"} params={{ slug: example.playground }}>
              <FlaskConical className="size-4" />
              Open the matching lab
            </Link>
          </Button>
        ) : null}

        {example.companies.length ? (
          <p className="text-sm text-muted">
            In the wild: {example.companies.join(" · ")}
          </p>
        ) : null}

        <section>
          <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">Requirements</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-[11px] uppercase tracking-[0.14em] text-accent">Functional</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                {example.requirements.functional.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="text-[11px] uppercase tracking-[0.14em] text-accent">Non-functional</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                {example.requirements.nonFunctional.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {example.estimation?.length ? (
          <section>
            <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">Back of the envelope</h2>
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
          </section>
        ) : null}

        {example.apis?.length ? (
          <section>
            <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">APIs</h2>
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
            <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">Data model</h2>
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

        {example.architecture.map((s, i) => (
          <SectionBlock key={s.heading} section={s} index={i} />
        ))}

        {example.deepDives.length ? (
          <div className="space-y-10">
            <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">Deep dive</h2>
            {example.deepDives.map((s, i) => (
              <SectionBlock key={s.heading} section={s} index={100 + i} />
            ))}
          </div>
        ) : null}

        {example.tradeoffs.length ? (
          <section>
            <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">Trade-offs</h2>
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

        {example.furtherReading.length ? (
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Sources</h2>
            <ul className="mt-3 space-y-2">
              {example.furtherReading.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <RelatedList paths={example.related} />
      </div>
    </article>
  );
}
