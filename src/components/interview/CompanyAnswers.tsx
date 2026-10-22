import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { ProGate } from "@/components/billing/ProGate";
import { InlineAnswer, LibraryAnswer } from "@/components/interview/AnswerBody";
import { AnswerCard } from "@/components/interview/AnswerCard";
import { DifficultyChip, LeetCodeChip, PlainChip, TypeChip } from "@/components/interview/Chips";
import { CompanyHeader, EmptyQuestions } from "@/components/interview/CompanyHeader";
import { MdInline } from "@/components/interview/Md";
import { useOpenCards } from "@/components/interview/use-open-cards";
import { useVisibleQuestions } from "@/components/interview/use-visible-questions";
import { Button } from "@/components/ui/button";
import { LIBRARY } from "@/data/interview/library";
import type { Company } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";

export function CompanyAnswers({ company, locked }: { company: Company; locked: boolean }) {
  const level = useInterviewPrefs((s) => s.level);
  const setLevel = useInterviewPrefs((s) => s.setLevel);
  const query = useInterviewPrefs((s) => s.query);
  const setQuery = useInterviewPrefs((s) => s.setQuery);
  const visible = useVisibleQuestions(company.bank);
  const cards = useOpenCards();
  const { reveal } = cards;
  const hash = useLocation({ select: (l) => l.hash });

  // Links land here as #q-<index>. Open the card once it is visible — which can be
  // a render late, after the saved level is restored — and say so when the
  // filters hide it, rather than landing on nothing.
  const target = /^q-\d+$/.test(hash) ? Number(hash.slice(2)) : -1;
  const linked = target >= 0 ? company.bank.at(target) : undefined;
  const linkedVisible = visible.some((v) => v.index === target);
  useEffect(() => {
    if (linkedVisible) reveal(`q-${target}`);
  }, [linkedVisible, target, reveal]);

  const ids = visible.map((v) => `q-${v.index}`);

  const list = (
    <div className="space-y-2.5">
      {visible.map(({ q, index }) => {
        const id = `q-${index}`;
        const entry = q.ans ? LIBRARY.get(q.ans) : undefined;
        return (
          <AnswerCard
            key={id}
            id={id}
            open={cards.isOpen(id)}
            onOpenChange={(open) => cards.setOpen(id, open)}
            title={q.q}
            chips={
              <>
                <TypeChip type={q.t} />
                <DifficultyChip d={q.d} />
                <LeetCodeChip lc={q.lc} slug={q.slug} />
                <PlainChip>Round {q.round}</PlainChip>
              </>
            }
          >
            {q.note ? (
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent/8 px-4 py-3 text-[14px] leading-6 text-muted">
                <span className="font-medium text-fg">At {company.name}: </span>
                <MdInline text={q.note} />
              </div>
            ) : null}
            {entry ? (
              <LibraryAnswer entry={entry} />
            ) : q.a ? (
              <InlineAnswer question={q} />
            ) : (
              <p className="mt-4 text-sm text-faint">
                Approach notes only — see the note on this question in the question bank.
              </p>
            )}
          </AnswerCard>
        );
      })}
    </div>
  );

  return (
    <>
      <CompanyHeader company={company} view="answers" />
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight">Answer sheet · {level}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              {visible.length} answered question{visible.length === 1 ? "" : "s"}. Coding answers
              give the brute force, then the optimised approach with its complexity; designs run
              clarify → requirements → architecture → data → trade-offs.
            </p>
          </div>
          {visible.length ? (
            <Button variant="secondary" size="sm" onClick={() => cards.toggleAll(ids)}>
              {cards.allOpen(ids) ? "Collapse all" : "Expand all"}
            </Button>
          ) : null}
        </div>
        {linked && !linkedVisible ? (
          <div className="mt-5 rounded-lg border border-warn/30 bg-warn/8 px-4 py-3 text-sm leading-6 text-muted">
            The linked question, <span className="text-fg">&ldquo;{linked.q}&rdquo;</span>, is
            hidden by your filters — it is asked at {linked.lv.join(", ")}.{" "}
            {linked.lv.length > 0 && !linked.lv.includes(level) ? (
              <button
                type="button"
                onClick={() => setLevel(linked.lv[0])}
                className="text-accent hover:underline"
              >
                Switch to {linked.lv[0]}
              </button>
            ) : query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-accent hover:underline"
              >
                Clear the search
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5">
          {visible.length === 0 ? (
            <EmptyQuestions />
          ) : locked ? (
            <ProGate title={`${company.name}'s answer sheet is part of the full library`}>
              {list}
            </ProGate>
          ) : (
            list
          )}
        </div>
      </section>
    </>
  );
}
