import { useMemo } from "react";
import { TYPE_NAME } from "@/data/interview/meta";
import type { Question } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";

export type IndexedQuestion = { q: Question; index: number };

/**
 * A company's questions at the selected level that match the search. Each keeps
 * its position in the bank, which is its answer card's id — so a link from the
 * question bank lands on the same card whatever the filters are.
 */
export function useVisibleQuestions(bank: Question[]): IndexedQuestion[] {
  const level = useInterviewPrefs((s) => s.level);
  const query = useInterviewPrefs((s) => s.query);
  const haystack = useMemo(
    () => bank.map((q) => [q.q, q.note, q.a, TYPE_NAME[q.t]].join(" ").toLowerCase()),
    [bank],
  );
  return useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bank.flatMap((q, index) =>
      q.lv.includes(level) && (!needle || haystack[index].includes(needle)) ? [{ q, index }] : [],
    );
  }, [bank, haystack, level, query]);
}
