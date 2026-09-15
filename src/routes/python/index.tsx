import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { PYTHON_PARTS, pythonConcepts } from "@/data/python";

export const Route = createFileRoute("/python/")({ component: PythonIndex });

function PythonIndex() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Python End-to-End for AI
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Twenty chapters from your first script to a deployed AI service: the language, the
        engineering habits notebooks skip, data and machine learning, then LLM APIs, RAG, agents,
        FastAPI and operations. Chapter 0 tells you which chapters to read closely for your
        background.
      </p>

      {PYTHON_PARTS.map((part) => (
        <section key={part.title} className="mt-10">
          <h2 className="font-display text-xl tracking-tight">{part.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{part.blurb}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pythonConcepts.slice(part.from, part.to + 1).map((c, i) => (
              <TopicCard
                key={c.slug}
                to="/python/$slug"
                slug={c.slug}
                kicker={`Chapter ${part.from + i} · ${c.level}`}
                title={c.title}
                subtitle={c.subtitle}
                tags={c.tags}
                id={`py:${c.slug}`}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
