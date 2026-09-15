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
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          <span className={cn("size-1.5 rounded-full", sector.dot)} aria-hidden />
          {sector.name}
          {company.loc ? (
            <span className="font-normal normal-case tracking-normal text-faint">
              · {company.loc}
            </span>
          ) : null}
        </p>
        <MarkDone id={`ip:${company.id}`} />
      </div>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {company.name}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">{company.tag}</p>
      {company.deep ? (
        <p className="mt-2 text-sm text-muted">
          Deep dive:{" "}
          <Link to="/interview-prep/freshworks-lead" className="text-accent hover:underline">
            full question bank
          </Link>{" "}
          ·{" "}
          <Link
            to="/interview-prep/freshworks-lead/answers"
            className="text-accent hover:underline"
          >
            full answer sheet
          </Link>
        </p>
      ) : null}
      <nav aria-label="Views" className="mt-5 flex flex-wrap gap-1.5">
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
