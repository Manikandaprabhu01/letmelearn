import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import {
  awesomeArticles,
  awesomeChannels,
  awesomePapers,
  awesomeProblems,
  awesomeRepo,
  type AwesomeBand,
} from "@/data/awesome";
import { resources } from "@/data/resources";
import { AppLink } from "@/lib/paths";

export const Route = createFileRoute("/resources")({ component: ResourcesPage });

const KIND: Record<string, string> = {
  roadmap: "Roadmap",
  playground: "Playground",
  book: "Book",
  course: "Course",
  article: "Paper / article",
  repo: "GitHub list",
};

const BANDS: { id: AwesomeBand; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "Warm-ups and building blocks." },
  { id: "medium", label: "Medium", hint: "The product designs most loops actually ask." },
  { id: "hard", hint: "Realtime, money-adjacent, or a moving fleet.", label: "Hard" },
];

function ResourcesPage() {
  return (
    <main className="px-5 py-10 sm:px-8 lg:px-12">
      <p className="eyebrow">Sources</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Where this atlas points
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        LetMeLearn is original teaching notes inspired by public system-design practice and the
        chapter maps of Alex Xu's books — not a reproduction of the books. Buy them. Then use the
        labs here to keep the diagrams in your hands. Source 6 is the public awesome list: problems,
        papers, and channels folded into this page.
      </p>

      <ol className="mt-8 space-y-3">
        {resources.map((r, i) => (
          <li key={r.href}>
            <a
              href={r.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="eyebrow">
                  {String(i + 1).padStart(2, "0")} · {KIND[r.kind]}
                </div>
                {r.kind === "repo" ? (
                  <span className="text-[11px] uppercase tracking-[0.14em] text-ok">Source 6</span>
                ) : null}
              </div>
              <div className="mt-1 font-medium">{r.title}</div>
              <p className="mt-1 text-sm leading-6 text-muted">{r.blurb}</p>
            </a>
          </li>
        ))}
      </ol>

      <section className="mt-16">
        <p className="eyebrow">Source 6</p>
        <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Interview problems from the awesome list
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Every prompt in{" "}
          <a
            href={awesomeRepo.href}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            ashishps1/awesome-system-design-resources
          </a>
          . Where LetMeLearn has a worked page, open that. Otherwise jump to the public walkthrough
          the list points at.
        </p>

        {BANDS.map((band) => {
          const items = awesomeProblems.filter((p) => p.band === band.id);
          return (
            <div key={band.id} className="mt-10">
              <h3 className="font-display text-xl tracking-tight">{band.label}</h3>
              <p className="mt-1 text-sm text-muted">{band.hint}</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((p) => (
                  <li key={p.title}>
                    <ProblemCard problem={p} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-medium tracking-tight">Must-read papers</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          The distributed-systems canon from the same list. Dynamo and Chubby pair with LetMeLearn's
          KV-store and lock examples.
        </p>
        <ul className="mt-5 space-y-2">
          {awesomePapers.map((l) => (
            <li key={l.href}>
              <ExtLink title={l.title} href={l.href} blurb={l.blurb} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-medium tracking-tight">Engineering articles</h2>
        <ul className="mt-5 space-y-2">
          {awesomeArticles.map((l) => (
            <li key={l.href}>
              <ExtLink title={l.title} href={l.href} blurb={l.blurb} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 pb-8">
        <h2 className="font-display text-2xl font-medium tracking-tight">YouTube channels</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {awesomeChannels.map((l) => (
            <li key={l.href}>
              <ExtLink title={l.title} href={l.href} blurb={l.blurb} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function ProblemCard({
  problem,
}: {
  problem: { title: string; href: string; lattice?: string; blurb: string };
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium leading-snug">{problem.title}</div>
        {problem.lattice ? (
          <span className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-ok">
            In LetMeLearn
          </span>
        ) : (
          <ArrowUpRight className="size-4 shrink-0 text-faint" />
        )}
      </div>
      <p className="mt-1 text-sm leading-6 text-muted">{problem.blurb}</p>
    </>
  );

  if (problem.lattice) {
    return (
      <AppLink
        path={problem.lattice}
        className="block h-full rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
      >
        {inner}
      </AppLink>
    );
  }

  return (
    <a
      href={problem.href}
      target="_blank"
      rel="noreferrer"
      className="block h-full rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
    >
      {inner}
    </a>
  );
}

function ExtLink({ title, href, blurb }: { title: string; href: string; blurb: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
    >
      <div>
        <div className="font-medium">{title}</div>
        <p className="mt-1 text-sm leading-6 text-muted">{blurb}</p>
      </div>
      <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-faint" />
    </a>
  );
}
