import { chipClass as chip } from "@/components/interview/console-shared";
import { DIFFICULTY_NAME, TYPE_NAME } from "@/data/interview/meta";
import type { Difficulty, QuestionType } from "@/data/interview/types";
import { cn } from "@/lib/utils";

const TYPE_TONE: Record<QuestionType, string> = {
  coding: "bg-accent/15 text-accent",
  hld: "border border-accent/40 text-accent",
  lld: "border border-ok/40 text-ok",
  concept: "border border-border text-muted",
  behavioral: "border border-warn/40 text-warn",
};

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  E: "bg-ok/15 text-ok",
  M: "bg-warn/15 text-warn",
  H: "bg-bad/15 text-bad",
};

export function TypeChip({ type }: { type: QuestionType }) {
  return <span className={cn(chip, TYPE_TONE[type])}>{TYPE_NAME[type]}</span>;
}

export function DifficultyChip({ d }: { d?: Difficulty }) {
  if (!d) return null;
  return <span className={cn(chip, DIFFICULTY_TONE[d])}>{DIFFICULTY_NAME[d]}</span>;
}

export function PlainChip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span className={cn(chip, "border border-border text-faint")} title={title}>
      {children}
    </span>
  );
}

/** LeetCode link. `approx` marks the closest match to a problem the candidate did not name. */
export function LeetCodeChip({
  lc,
  slug,
  approx,
}: {
  lc?: number;
  slug?: string;
  approx?: boolean;
}) {
  if (!lc || !slug) return null;
  return (
    <a
      href={`https://leetcode.com/problems/${encodeURIComponent(slug)}/`}
      target="_blank"
      rel="noreferrer"
      title={approx ? "Closest LeetCode match" : "LeetCode problem"}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        chip,
        "border border-border bg-surface text-fg hover:border-accent hover:text-accent",
      )}
    >
      {approx ? "≈ " : ""}LC {lc}
    </a>
  );
}
