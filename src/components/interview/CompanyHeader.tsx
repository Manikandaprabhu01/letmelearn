import { Link } from "@tanstack/react-router";
import { MarkDone } from "@/components/content/MarkDone";
import { tabClass } from "@/components/interview/console-shared";
import { getSector } from "@/data/interview/meta";
import type { Company } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";
import { cn } from "@/lib/utils";

export function CompanyHeader({ company, view }: { company: Company; view: "bank" | "answers" }) {
  const sector = getSector(company.sector);
  return (
    <header className="glass-card rounded-2xl p-6 sm:p-7 relative overflow-hidden mb-6">
      <div className="mesh-glow-subtle pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 eyebrow text-accent">
            <span className={cn("size-2 rounded-full", sector.dot)} aria-hidden />
            {sector.name}
            {company.loc ? (
              <span className="font-normal normal-case tracking-normal text-faint">
                · {company.loc}
              </span>
            ) : null}
          </p>
          <MarkDone id={`ip:${company.id}`} />
        </div>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
          {company.name}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{company.tag}</p>
        {company.deep ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-xs text-accent">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Deep dive available:</span>
            <Link to="/interview-prep/freshworks-lead" className="hover:underline font-medium">
              Full Question Bank
            </Link>
            <span className="text-border-strong">&bull;</span>
            <Link
              to="/interview-prep/freshworks-lead/answers"
              className="hover:underline font-medium"
            >
              Full Answer Sheet
            </Link>
          </div>
        ) : null}
        <nav aria-label="Views" className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/interview-prep/$slug"
            params={{ slug: company.id }}
            className={tabClass(view === "bank")}
          >
            Question bank
          </Link>
          <Link
            to="/interview-prep/$slug/answers"
            params={{ slug: company.id }}
            className={tabClass(view === "answers")}
          >
            Answer sheet
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function EmptyQuestions() {
  const level = useInterviewPrefs((s) => s.level);
  const query = useInterviewPrefs((s) => s.query).trim();
  const setQuery = useInterviewPrefs((s) => s.setQuery);
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm leading-6 text-muted">
      No questions match {level}
      {query ? <> and &ldquo;{query}&rdquo;</> : null}.{" "}
      {query ? (
        <button type="button" onClick={() => setQuery("")} className="text-accent hover:underline">
          Clear the search
        </button>
      ) : (
        "Try another level."
      )}
    </div>
  );
}
