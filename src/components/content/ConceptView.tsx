import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/content/PageHeader";
import { RelatedList } from "@/components/content/RelatedList";
import { SectionBlock } from "@/components/content/SectionBlock";
import { Toc } from "@/components/content/Toc";
import { lookupPath } from "@/data/catalog";
import type { Concept } from "@/data/types";
import { AppLink } from "@/lib/paths";
import { tocFromSections } from "@/lib/toc";
import { Button } from "@/components/ui/button";

function Prerequisites({ paths }: { paths: string[] }) {
  const items = paths.map(lookupPath).filter((x): x is NonNullable<typeof x> => Boolean(x));
  if (!items.length) return null;
  return (
    <p className="text-sm text-muted">
      <span className="text-[11px] uppercase tracking-[0.14em] text-faint">Read first </span>
      {items.map((item, i) => (
        <span key={item.path}>
          {i > 0 ? <span className="text-faint"> · </span> : null}
          <AppLink path={item.path} className="text-accent hover:underline">
            {item.title}
          </AppLink>
        </span>
      ))}
    </p>
  );
}

export function ConceptView({
  concept,
  kicker,
  id,
}: {
  concept: Concept;
  kicker: string;
  id: string;
}) {
  const toc = tocFromSections(concept.sections);

  return (
    <article>
      <PageHeader
        kicker={kicker}
        title={concept.title}
        subtitle={concept.subtitle}
        minutes={concept.minutes}
        tags={[concept.level, ...concept.tags]}
        id={id}
      />
      <div className="px-5 py-8 sm:px-8 lg:px-12">
        <div className="lg:flex lg:gap-12">
          <div className="min-w-0 flex-1 space-y-10">
            <div className="space-y-4">
              <p className="max-w-prose text-[16px] leading-7 text-fg">{concept.summary}</p>
              {concept.prerequisites?.length ? (
                <Prerequisites paths={concept.prerequisites} />
              ) : null}
            </div>

            {concept.keyPoints?.length ? (
              <aside className="rounded-lg border border-accent/25 bg-accent/6 px-4 py-4 sm:px-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
                  The 60-second version
                </div>
                <ul className="mt-3 space-y-2">
                  {concept.keyPoints.map((p) => (
                    <li key={p} className="flex gap-2.5 text-[14.5px] leading-6 text-muted">
                      <span className="mt-[9px] size-1 shrink-0 rounded-full bg-accent" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}

            {concept.playground ? (
              <Button asChild variant="secondary">
                <Link to={"/playgrounds/$slug"} params={{ slug: concept.playground }}>
                  <FlaskConical className="size-4" />
                  Open the lab
                </Link>
              </Button>
            ) : null}

            {concept.sections.map((s, i) => (
              <SectionBlock key={s.heading} section={s} index={i} />
            ))}

            {concept.furtherReading.length ? (
              <div>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
                  Sources
                </h2>
                <ul className="mt-3 space-y-2">
                  {concept.furtherReading.map((l) => (
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

            <RelatedList paths={concept.related} />
          </div>

          <aside className="order-first mb-8 hidden shrink-0 lg:sticky lg:top-24 lg:order-none lg:mb-0 lg:block lg:h-fit lg:w-56">
            <Toc entries={toc} />
          </aside>
        </div>
      </div>
    </article>
  );
}
