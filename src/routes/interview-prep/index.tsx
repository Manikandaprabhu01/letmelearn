import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { TopicCard } from "@/components/content/TopicCard";
import { DifficultyChip, PlainChip, TypeChip } from "@/components/interview/Chips";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { Button } from "@/components/ui/button";
import { COMPANIES } from "@/data/interview/companies";
import {
  COMPANY_COUNT,
  COMPANY_INDEX,
  LEVELS,
  LIBRARY_ANSWER_COUNT,
  QUESTION_COUNT,
  SECTORS,
} from "@/data/interview/meta";
import { useInterviewPrefs } from "@/lib/interview-prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview-prep/")({ component: InterviewPrepHome });

const HOW_TO = [
  {
    title: "Pick a company",
    body: "Its question bank shows the loop, the level ladder and what gets asked in each round. The answer sheet answers the same questions.",
  },
  {
    title: "Set your level",
    body: "The level buttons filter everything. A question asked at SDE2 and Lead disappears when you switch to Principal.",
  },
  {
    title: "Reuse shared answers",
    body: "About two-thirds of questions repeat across companies — LRU cache, rate limiter, CAP. Each has one deep answer, used everywhere it is asked.",
  },
];

const RESULT_LIMIT = 150;

function InterviewPrepHome() {
  const query = useInterviewPrefs((s) => s.query).trim();
  return (
    <ConsoleLayout showLang={false} searchLabel="Search every company">
      {query ? <SearchResults query={query} /> : <Overview />}
    </ConsoleLayout>
  );
}

function Overview() {
  return (
    <>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Menu</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Interview Prep Console
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
        Question banks and worked answer sheets for {COMPANY_COUNT} companies — product companies,
        global investment banks, Indian banks, fintech and payment networks — plus five
        cross-company core banks, filtered by level from SDE to Principal SDE.
      </p>
      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <Stat n={COMPANY_COUNT} label="Companies" />
        <Stat n={QUESTION_COUNT} label="Questions mapped to rounds" />
        <Stat n={LIBRARY_ANSWER_COUNT} label="Deep answers" />
        <Stat n={LEVELS.length} label="Levels, SDE to Principal" />
      </div>

      <ol className="mt-8 grid gap-3 md:grid-cols-3">
        {HOW_TO.map((step, i) => (
          <li key={step.title} className="rounded-lg border border-border bg-surface p-4">
            <div className="font-mono text-xs text-accent">0{i + 1}</div>
            <div className="mt-2 font-medium">{step.title}</div>
            <p className="mt-1.5 text-sm leading-6 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <Link
        to="/interview-prep/freshworks-lead"
        className="mt-6 flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/6 p-5 transition-colors duration-150 hover:border-accent/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-accent">Deep dive</div>
          <div className="mt-1 font-display text-xl tracking-tight">Freshworks Lead SE</div>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
            101 questions from 26 candidate reports, grouped by round with practice ticks — and a
            93-answer sheet in Java and Python.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm text-fg">
          Open <ArrowRight className="size-4" />
        </span>
      </Link>

      {SECTORS.map((s) => (
        <section key={s.id} className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl tracking-tight">
            <span className={cn("size-2 rounded-full", s.dot)} aria-hidden />
            {s.name}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{s.blurb}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {COMPANY_INDEX.filter((c) => c.sector === s.id).map((c) => (
              <TopicCard
                key={c.id}
                to="/interview-prep/$slug"
                slug={c.id}
                kicker={`${c.questions} questions`}
                title={c.name}
                subtitle={c.tag}
                id={`ip:${c.id}`}
              />
            ))}
          </div>
        </section>
      ))}

      <p className="mt-12 max-w-2xl border-t border-border pt-5 text-[13px] leading-6 text-muted">
        <span className="font-medium text-fg">Accuracy note.</span> Round structures and questions
        come from published candidate reports, company guides and the major prep sites, linked at
        the bottom of every question bank. Loops change: treat this as a strong prior, and confirm
        the current format with your recruiter.
      </p>
    </>
  );
}

function SearchResults({ query }: { query: string }) {
  const level = useInterviewPrefs((s) => s.level);
  const setQuery = useInterviewPrefs((s) => s.setQuery);
  const needle = query.toLowerCase();

  const groups = useMemo(
    () =>
      COMPANIES.map((company) => ({
        company,
        hits: company.bank.flatMap((q, index) =>
          q.lv.includes(level) && `${q.q} ${q.note ?? ""}`.toLowerCase().includes(needle)
            ? [{ q, index }]
            : [],
        ),
      })).filter((g) => g.hits.length > 0),
    [level, needle],
  );
  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  let budget = RESULT_LIMIT;
  const shown = groups.map((g) => {
    const hits = g.hits.slice(0, Math.max(0, budget));
    budget -= hits.length;
    return { ...g, hits };
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Search</p>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">
            {total} question{total === 1 ? "" : "s"} matching &ldquo;{query}&rdquo; at {level}
          </h1>
          <p className="mt-1 text-sm text-muted">
            In {groups.length} of {COMPANIES.length} banks
            {total > RESULT_LIMIT ? `, showing the first ${RESULT_LIMIT}` : ""}. Change the level
            above to widen or narrow it.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
          Clear search
        </Button>
      </div>

      {total === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
          Nothing matches at {level}. Try another level or a shorter search.
        </p>
      ) : null}

      {shown
        .filter((g) => g.hits.length > 0)
        .map(({ company, hits }) => (
          <div key={company.id} className="mt-8">
            <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <Link
                to="/interview-prep/$slug"
                params={{ slug: company.id }}
                className="font-display text-lg tracking-tight hover:text-accent"
              >
                {company.name}
              </Link>
              <span className="font-mono text-xs text-faint">{hits.length}</span>
            </div>
            <ul>
              {hits.map(({ q, index }) => (
                <li
                  key={index}
                  className="flex flex-col gap-1.5 border-b border-border py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <Link
                    to="/interview-prep/$slug/answers"
                    params={{ slug: company.id }}
                    hash={`q-${index}`}
                    className="text-[14px] leading-6 text-fg hover:text-accent"
                  >
                    {q.q}
                  </Link>
                  <span className="flex shrink-0 flex-wrap gap-1">
                    <TypeChip type={q.t} />
                    <DifficultyChip d={q.d} />
                    <PlainChip>Round {q.round}</PlainChip>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl tabular-nums">{n}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
