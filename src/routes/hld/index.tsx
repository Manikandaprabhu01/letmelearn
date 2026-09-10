import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { hldConcepts } from "@/data/hld";

export const Route = createFileRoute("/hld/")({ component: HldIndex });

function HldIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">HLD Concepts</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        High-level design is the language of boxes: how data, traffic, and failure move through a system. Start with
        scaling and estimation, then CAP, hashing, and queues. Source 6 adds availability, idempotency, consensus, and
        gossip. Each page ends at a related example or a lab.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {hldConcepts.map((c) => (
          <TopicCard
            key={c.slug}
            to="/hld/$slug"
            slug={c.slug}
            kicker={c.level}
            title={c.title}
            subtitle={c.subtitle}
            tags={c.tags}
            id={`hld:${c.slug}`}
          />
        ))}
      </div>
    </main>
  );
}
