import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { playgrounds } from "@/data/playgrounds";

export const Route = createFileRoute("/playgrounds/")({ component: LabsIndex });

function LabsIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Labs</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">Interactive playgrounds</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Algorithms you can poke. The rate-limiter lab mirrors five-algorithm visualizers used in LLD teaching — token
        bucket through sliding counter — then the rest of the map: hashing, IDs, CAP, LRU, quorum.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {playgrounds.map((p) => (
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
    </main>
  );
}
