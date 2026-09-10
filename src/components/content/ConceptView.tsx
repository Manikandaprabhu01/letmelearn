import { Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/content/PageHeader";
import { RelatedList } from "@/components/content/RelatedList";
import { SectionBlock } from "@/components/content/SectionBlock";
import type { Concept } from "@/data/types";
import { Button } from "@/components/ui/button";

export function ConceptView({
  concept,
  kicker,
  id,
}: {
  concept: Concept;
  kicker: string;
  id: string;
}) {
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
      <div className="space-y-10 px-5 py-8 sm:px-8 lg:px-12">
        <p className="max-w-prose text-[16px] leading-7 text-fg">{concept.summary}</p>
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
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">Sources</h2>
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
    </article>
  );
}
