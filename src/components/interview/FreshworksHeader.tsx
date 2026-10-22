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
    <header className="glass-card rounded-2xl p-6 sm:p-7 relative overflow-hidden mb-6">
      <div className="mesh-glow-subtle pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-accent">Deep dive · Lead Software Engineer · Freshworks</p>
          <MarkDone id="ip:freshworks-lead" />
        </div>
        <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
          {COPY[view].title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{COPY[view].lede}</p>
        <nav aria-label="Views" className="mt-6 flex flex-wrap items-center gap-2">
          <Link to="/interview-prep/freshworks-lead" className={tabClass(view === "bank")}>
            Question bank (101 questions)
          </Link>
          <Link to="/interview-prep/freshworks-lead/answers" className={tabClass(view === "answers")}>
            Answer sheet (93 solutions)
          </Link>
          <Link
            to="/interview-prep/$slug"
            params={{ slug: "freshworks" }}
            className="ml-2 inline-flex items-center gap-1 text-[13px] text-muted hover:text-accent transition-colors"
          >
            Freshworks standard loop <ArrowRight className="size-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
