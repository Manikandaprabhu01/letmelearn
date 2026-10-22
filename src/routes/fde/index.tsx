import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { fdeConcepts } from "@/data/fde";

export const Route = createFileRoute("/fde/")({ component: FdeIndex });

function FdeIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="eyebrow">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        AI FDE Roadmap
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        An AI Forward Deployed Engineer is an AI engineer, a production engineer, a solution
        architect and a customer-facing problem solver in one role. Eight steps, in order: the
        engineering foundation everything rests on, how models actually behave, the craft of turning
        one into a feature, running it in production, keeping it reliable and safe, wiring it into
        an enterprise, designing whole systems around it, and the customer-facing layer that makes
        it the FDE job rather than an engineering one.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fdeConcepts.map((c, i) => (
          <TopicCard
            key={c.slug}
            to="/fde/$slug"
            slug={c.slug}
            kicker={`Step ${i + 1} · ${c.level}`}
            title={c.title}
            subtitle={c.subtitle}
            tags={c.tags}
            id={`fde:${c.slug}`}
          />
        ))}
      </div>
    </main>
  );
}
