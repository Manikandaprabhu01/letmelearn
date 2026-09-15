import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarkDone } from "@/components/content/MarkDone";
import { tabClass } from "@/components/interview/console-shared";

const COPY = {
  bank: {
    title: "Freshworks Lead SE question bank",
    lede: "Every question collected from 26 candidate reports (2019–2026): 11 from Lead and Tech Lead loops, and 15 from Senior and SDE-2 loops. The Senior loops are included because Lead and Staff engineers sit on those panels and ask from the same pool. Questions are grouped by round.",
  },
  answers: {
    title: "Freshworks Lead SE answer sheet",
    lede: "Worked answers to every question in the bank: 40 coding problems with brute force and optimised solutions in Java and Python, 9 low-level designs with class code and interview Q&A, 16 high-level designs from clarifying questions to the database choice, and 28 concept and behavioural answers.",
  },
};

export function FreshworksHeader({ view }: { view: "bank" | "answers" }) {
  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          Deep dive · Lead Software Engineer · Freshworks
        </p>
        <MarkDone id="ip:freshworks-lead" />
      </div>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {COPY[view].title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">{COPY[view].lede}</p>
      <nav aria-label="Views" className="mt-5 flex flex-wrap items-center gap-1.5">
        <Link to="/interview-prep/freshworks-lead" className={tabClass(view === "bank")}>
          Question bank
        </Link>
        <Link to="/interview-prep/freshworks-lead/answers" className={tabClass(view === "answers")}>
          Answer sheet
        </Link>
        <Link
          to="/interview-prep/$slug"
          params={{ slug: "freshworks" }}
          className="ml-1 inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg"
        >
          Freshworks in the console <ArrowRight className="size-3.5" />
        </Link>
      </nav>
    </header>
  );
}
