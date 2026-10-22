import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { lldConcepts } from "@/data/lld";

export const Route = createFileRoute("/lld/")({ component: LldIndex });

function LldIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="eyebrow">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        LLD Concepts
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Low-level design is types, invariants, and thread-safety. Patterns are named only when they
        earn a seam — a rate-limiter strategy, a parking-spot index, a logger sink.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lldConcepts.map((c) => (
          <TopicCard
            key={c.slug}
            to="/lld/$slug"
            slug={c.slug}
            kicker={c.level}
            title={c.title}
            subtitle={c.subtitle}
            tags={c.tags}
            id={`lld:${c.slug}`}
          />
        ))}
      </div>
    </main>
  );
}
