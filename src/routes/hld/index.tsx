import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { HLD_GROUPS } from "@/data/hld";

export const Route = createFileRoute("/hld/")({ component: HldIndex });

function HldIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        HLD &amp; Microservices
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        High-level design is the language of boxes: how data, traffic and failure move through a
        system. Start with scaling and caching, work through data, consistency, messaging and
        resilience, then the microservices sections — boundaries, sagas, service meshes, Kubernetes
        and safe deployments. Each page ends at a related example or a lab.
      </p>

      {HLD_GROUPS.map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="font-display text-xl tracking-tight">{group.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{group.blurb}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.concepts.map((c) => (
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
        </section>
      ))}
    </main>
  );
}
