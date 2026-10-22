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
  ROLE_TRACKS,
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
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface/80 px-3.5 py-1.5 backdrop-blur-md">
          <span className="flex size-2 rounded-full bg-cta animate-soft-pulse" />
          <span className="font-mono text-[11px] font-medium tracking-wider text-accent uppercase">
            Interview Intelligence Console
          </span>
          <span className="text-border-strong">•</span>
          <span className="text-[12px] text-muted">
            {COMPANY_COUNT} Company Loops &bull; 6 Role Ladders
          </span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl lg:text-5xl">
          Corporate Interview Loops &amp; <span className="gradient-text-accent">Level Ladders</span>
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-muted">
          Question banks, round formats, level expectations, and deep worked solutions reverse-engineered
          from verified candidate experiences across top product companies, global investment banks, and
          hyper-growth fintechs.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-2xl font-bold text-fg">{COMPANY_COUNT}</div>
          <div className="mt-1 text-xs text-muted font-medium">Curated Companies</div>
          <div className="text-[11px] text-faint">Big tech to fintech</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-2xl font-bold text-accent">{QUESTION_COUNT}+</div>
          <div className="mt-1 text-xs text-muted font-medium">Mapped Questions</div>
          <div className="text-[11px] text-faint">Categorized by round</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-2xl font-bold text-ok">{LIBRARY_ANSWER_COUNT}+</div>
          <div className="mt-1 text-xs text-muted font-medium">Deep Solutions</div>
          <div className="text-[11px] text-faint">Java &amp; Python pairs</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="font-mono text-2xl font-bold text-warn">{LEVELS.length}</div>
          <div className="mt-1 text-xs text-muted font-medium">Seniority Levels</div>
          <div className="text-[11px] text-faint">SDE to Principal SDE</div>
        </div>
      </div>

      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {HOW_TO.map((step, i) => (
          <li key={step.title} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-accent">STEP 0{i + 1}</span>
              <span className="size-2 rounded-full bg-accent/40" />
            </div>
            <div className="mt-3 font-medium text-fg text-base">{step.title}</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 glass-card overflow-hidden rounded-2xl border border-accent/40 p-6 relative">
        <div className="mesh-glow-subtle pointer-events-none absolute inset-0" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="rounded bg-ok/15 px-2 py-0.5 font-mono text-[10.5px] font-medium text-ok">
                Featured Deep Dive
              </span>
              <span className="font-mono text-xs text-faint">5 Rounds &bull; 101 Questions</span>
            </div>
            <div className="mt-2 font-display text-xl font-medium tracking-tight text-fg">
              Freshworks Lead Software Engineer Blueprint
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
              Live coding, multi-tenant SaaS architecture, event mesh, tech leadership scoring, and 93 worked answers in Java &amp; Python.
            </p>
          </div>
          <Link
            to="/interview-prep/freshworks-lead"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2.5 text-xs font-semibold text-cta-fg shadow-lg shadow-cta/20 hover:scale-[1.02] transition-transform"
          >
            Launch Deep Dive <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Role Tracks Hub */}
      <section className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="eyebrow text-accent">Career Progression Ladder</p>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-fg">
              Role-Wise Question Banks &amp; Evaluation Rubrics
            </h2>
          </div>
          <span className="text-xs text-muted font-mono">{ROLE_TRACKS.length} Specialized Tracks</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Targeted question sets, what clears the bar, and real interview loops tailored for each engineering level and specialization.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_TRACKS.map((r) => (
            <Link
              key={r.id}
              to="/interview-prep/role/$role"
              params={{ role: r.id }}
              className="glass-card-interactive group flex flex-col justify-between rounded-xl p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-medium text-fg group-hover:text-accent transition-colors">
                    {r.shortTitle}
                  </span>
                  <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-medium text-accent">
                    {r.badge}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                  {r.tagline}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                <span className="font-mono text-[11px] text-faint">
                  {r.questions.length} questions &bull; worked answers
                </span>
                <span className="inline-flex items-center gap-1 text-accent font-medium group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Companies by Sector */}
      <div className="mt-14 border-t border-border/80 pt-10">
        <p className="eyebrow text-accent">Company Directory</p>
        <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-fg">
          Browse by Industry &amp; Market Sector
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Interview loops and question banks mapped for {COMPANY_COUNT} companies across product tech, global investment banking, and fintech.
        </p>
      </div>

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
          <p className="eyebrow">Search</p>
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
