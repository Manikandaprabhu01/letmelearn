import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ProGate } from "@/components/billing/ProGate";
import { LibraryAnswer } from "@/components/interview/AnswerBody";
import { AnswerCard } from "@/components/interview/AnswerCard";
import { DifficultyChip, LeetCodeChip, PlainChip } from "@/components/interview/Chips";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { FreshworksHeader } from "@/components/interview/FreshworksHeader";
import {
  FRESHWORKS_LEAD,
  isReportId,
  plainText,
  sourceChipClass,
  tabClass,
} from "@/components/interview/console-shared";
import { useOpenCards } from "@/components/interview/use-open-cards";
import { Button } from "@/components/ui/button";
import { FRESHWORKS_SHEET } from "@/data/interview/library";
import type { LibraryEntry } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";

/*
 * Lives outside the route file on purpose. A module-level constant built from
 * the library (TABS below) in a route file stays in the route's main-bundle
 * half after code splitting, and drags the whole answer library into the
 * entry chunk with it.
 */

const TABS = [
  {
    id: "coding",
    label: "Coding",
    entries: FRESHWORKS_SHEET.coding.map((d): LibraryEntry => ({ kind: "coding", d })),
  },
  {
    id: "lld",
    label: "LLD",
    entries: FRESHWORKS_SHEET.lld.map((d): LibraryEntry => ({ kind: "lld", d })),
  },
  {
    id: "hld",
    label: "HLD",
    entries: FRESHWORKS_SHEET.hld.map((d): LibraryEntry => ({ kind: "hld", d })),
  },
  {
    id: "concepts",
    label: "Concepts & behavioural",
    entries: FRESHWORKS_SHEET.concepts.map((d): LibraryEntry => ({ kind: "concept", d })),
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

const HOW_TO = [
  {
    title: "Every coding card",
    body: "gives the brute force first, then the optimised approach, with complexity and full code in both languages.",
  },
  {
    title: "Every design card",
    body: "follows the order an interviewer expects: clarify → requirements → architecture → data → trade-offs → follow-ups.",
  },
  {
    title: "Source tags",
    body: "(L1–L7, S1–S10) point at the candidate report each question came from, listed on the question bank.",
  },
];

function summaryOf(entry: LibraryEntry): { chips: ReactNode; preview?: string; star: boolean } {
  switch (entry.kind) {
    case "coding":
      return {
        chips: (
          <>
            <DifficultyChip d={entry.d.d} />
            <LeetCodeChip lc={entry.d.lc} slug={entry.d.slug} />
          </>
        ),
        preview: entry.d.stmt,
        star: false,
      };
    case "lld":
    case "hld":
      return { chips: null, preview: entry.d.stmt, star: Boolean(entry.d.star) };
    case "concept":
      return { chips: <PlainChip>{entry.d.cat}</PlainChip>, star: false };
  }
}

export function FreshworksAnswers() {
  const [tabId, setTabId] = useState<TabId>("coding");
  const query = useInterviewPrefs((s) => s.query);
  const cards = useOpenCards();

  const tab = TABS.find((t) => t.id === tabId) ?? TABS[0];
  const texts = useMemo(() => tab.entries.map((e) => JSON.stringify(e.d).toLowerCase()), [tab]);
  const needle = query.trim().toLowerCase();
  const visible = tab.entries.filter((_, i) => !needle || texts[i].includes(needle));
  const ids = visible.map((e) => `${e.kind}-${e.d.id}`);

  const list = (
    <div className="space-y-2.5">
      {visible.map((entry) => {
        const id = `${entry.kind}-${entry.d.id}`;
        const summary = summaryOf(entry);
        return (
          <AnswerCard
            key={id}
            id={id}
            open={cards.isOpen(id)}
            onOpenChange={(open) => cards.setOpen(id, open)}
            title={
              <>
                {entry.d.t}
                {summary.star ? (
                  <span className="ml-2 whitespace-nowrap rounded border border-accent/50 px-1.5 py-px align-middle font-mono text-[10px] text-accent">
                    most asked
                  </span>
                ) : null}
              </>
            }
            chips={
              <>
                {summary.chips}
                <PlainChip>Round {entry.d.r}</PlainChip>
                {entry.d.src.map((src) =>
                  isReportId(src) ? (
                    <Link
                      key={src}
                      to="/interview-prep/freshworks-lead"
                      hash={`src-${src}`}
                      className={sourceChipClass(src)}
                    >
                      {src}
                    </Link>
                  ) : (
                    <PlainChip key={src}>{src}</PlainChip>
                  ),
                )}
              </>
            }
            preview={summary.preview ? plainText(summary.preview) : undefined}
          >
            <LibraryAnswer entry={entry} />
          </AnswerCard>
        );
      })}
    </div>
  );

  return (
    <ConsoleLayout
      current={{ id: FRESHWORKS_LEAD, view: "answers" }}
      showLevels={false}
      searchLabel="Search answers"
    >
      <FreshworksHeader view="answers" />

      <div className="mt-6 grid gap-x-6 border-b border-border md:grid-cols-3">
        {HOW_TO.map((h) => (
          <p key={h.title} className="py-3 text-[13.5px] leading-6 text-muted">
            <span className="block font-medium text-fg">{h.title}</span>
            {h.body}
          </p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Answer sections" className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tabId}
              onClick={() => setTabId(t.id)}
              className={tabClass(t.id === tabId)}
            >
              {t.label}
              <span className="ml-2 font-mono text-[11px] opacity-70">{t.entries.length}</span>
            </button>
          ))}
        </div>
        {visible.length ? (
          <Button variant="secondary" size="sm" onClick={() => cards.toggleAll(ids)}>
            {cards.allOpen(ids) ? "Collapse all" : "Expand all"}
          </Button>
        ) : null}
      </div>
      <p className="mt-4 font-mono text-xs text-faint">
        {needle
          ? `${visible.length} of ${tab.entries.length} shown`
          : `${tab.entries.length} answers`}
      </p>

      <div className="mt-3">
        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
            Nothing matches &ldquo;{query.trim()}&rdquo; in {tab.label}. The search only filters the
            open tab — try another one.
          </p>
        ) : (
          <ProGate title="The Freshworks answer sheet is part of the full library">{list}</ProGate>
        )}
      </div>

      <p className="mt-12 max-w-prose border-t border-border pt-5 text-[13px] leading-6 text-muted">
        Answers are written for the questions in the Freshworks Lead SE question bank, which lists
        the source report behind every question. Code is written to be readable on a whiteboard, and
        complexity is stated for both approaches. Freshworks often modifies problems, so practise
        the pattern rather than memorising a solution.
      </p>
    </ConsoleLayout>
  );
}
