import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { examples } from "@/data/examples";

export const Route = createFileRoute("/examples/")({ component: ExamplesIndex });

function ExamplesIndex() {
  const vol1 = examples.filter((e) => e.source === "Volume 1");
  const vol2 = examples.filter((e) => e.source === "Volume 2");
  const awesome = examples.filter((e) => e.source === "Source 6");
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">System Design Examples</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Worked interviews in three collections. Volume 1 and 2 follow Alex Xu. Source 6 is the public{" "}
        <a
          href="https://github.com/ashishps1/awesome-system-design-resources"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          awesome-system-design-resources
        </a>{" "}
        list — original Lattice notes for the problems those books do not cover. Every page uses the four-step
        framework: scope, sketch, deep dive, wrap.
      </p>

      <h2 className="mt-10 font-display text-2xl tracking-tight">Volume 1</h2>
      <p className="mt-1 text-sm text-muted">Scale from zero through Google Drive.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {vol1.map((e) => (
          <TopicCard
            key={e.slug}
            to="/examples/$slug"
            slug={e.slug}
            kicker={`Ch. ${e.chapter ?? "—"}`}
            title={e.title}
            subtitle={e.summary}
            tags={e.tags}
            id={`ex:${e.slug}`}
          />
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl tracking-tight">Volume 2</h2>
      <p className="mt-1 text-sm text-muted">Proximity service through the stock exchange.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {vol2.map((e) => (
          <TopicCard
            key={e.slug}
            to="/examples/$slug"
            slug={e.slug}
            kicker={`Ch. ${e.chapter ?? "—"}`}
            title={e.title}
            subtitle={e.summary}
            tags={e.tags}
            id={`ex:${e.slug}`}
          />
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl tracking-tight">Source 6 — Awesome list</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Auth, Instagram, Spotify, Netflix, Uber, Docs, Zoom, locks — problems the GitHub list is famous for, written
        here as original teaching notes. The full Easy / Medium / Hard index lives on Sources.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {awesome.map((e) => (
          <TopicCard
            key={e.slug}
            to="/examples/$slug"
            slug={e.slug}
            kicker={e.difficulty === "foundational" ? "Easy" : e.difficulty === "intermediate" ? "Medium" : "Hard"}
            title={e.title}
            subtitle={e.summary}
            tags={e.tags}
            id={`ex:${e.slug}`}
          />
        ))}
      </div>
    </main>
  );
}
