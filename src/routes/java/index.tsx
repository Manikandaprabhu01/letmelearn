import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { javaConcepts } from "@/data/java";

export const Route = createFileRoute("/java/")({ component: JavaIndex });

function JavaIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Java &amp; Spring Boot
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        A backend guide in twenty chapters: the language core, the runtime behaviour that causes
        real production bugs, the data and web layers, and Spring Boot on top. Chapter 0 is the map
        — it tells you which chapters are load-bearing and which are reference material to look up
        when a task demands them.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {javaConcepts.map((c, i) => (
          <TopicCard
            key={c.slug}
            to="/java/$slug"
            slug={c.slug}
            kicker={`Chapter ${i} · ${c.level}`}
            title={c.title}
            subtitle={c.subtitle}
            tags={c.tags}
            id={`java:${c.slug}`}
          />
        ))}
      </div>
    </main>
  );
}
