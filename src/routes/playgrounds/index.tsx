import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { LAB_GROUPS, playgrounds } from "@/data/playgrounds";
import type { PlaygroundMeta } from "@/data/types";

export const Route = createFileRoute("/playgrounds/")({ component: LabsIndex });

function LabsIndex() {
  // Anything not assigned to a known group still appears, rather than silently vanishing.
  const ungrouped = playgrounds.filter((p) => !LAB_GROUPS.some((g) => g.title === p.group));

  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Labs</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Interactive labs
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Reading about a pattern is not the same as watching it fail. Each lab lets you change the
        inputs, break something on purpose, and see the result — then links back to the page that
        explains it.
      </p>

      {LAB_GROUPS.map((group) => (
        <LabSection
          key={group.title}
          title={group.title}
          blurb={group.blurb}
          labs={playgrounds.filter((p) => p.group === group.title)}
        />
      ))}
      {ungrouped.length > 0 ? <LabSection title="More labs" blurb="" labs={ungrouped} /> : null}
    </main>
  );
}

function LabSection({
  title,
  blurb,
  labs,
}: {
  title: string;
  blurb: string;
  labs: PlaygroundMeta[];
}) {
  if (labs.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
      {blurb ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{blurb}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {labs.map((p) => (
          <TopicCard
            key={p.slug}
            to="/playgrounds/$slug"
            slug={p.slug}
            kicker={p.tags.join(" · ")}
            title={p.title}
            subtitle={p.subtitle}
            tags={p.tags}
            id={`lab:${p.slug}`}
          />
        ))}
      </div>
    </section>
  );
}
