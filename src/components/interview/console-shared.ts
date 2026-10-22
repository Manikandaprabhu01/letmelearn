import { cn } from "@/lib/utils";

/** Route segment of the Freshworks Lead SE deep dive. */
export const FRESHWORKS_LEAD = "freshworks-lead";

/** Where the reader is in the console: a company (or the deep dive) and which view. */
export type ConsoleLocation = { id: string; view: "bank" | "answers" };

export function tabClass(active: boolean) {
  return cn(
    "inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] font-medium transition-all duration-150",
    active
      ? "border-accent/60 bg-accent/20 text-accent shadow-sm"
      : "border-border/70 text-muted hover:text-fg hover:bg-raised/40",
  );
}

export const chipClass =
  "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px] leading-4";

/** Deep-dive report ids: L1–L7 are Lead loops, S1–S10 Senior loops. */
export function isReportId(id: string) {
  return /^[LS]\d+$/.test(id);
}

export function sourceChipClass(id: string) {
  return cn(
    chipClass,
    "hover:border-accent",
    id.startsWith("L")
      ? "border border-accent/50 bg-accent/10 text-accent"
      : "border border-dashed border-border text-muted",
  );
}

/** A one-line preview of markdown text. */
export function plainText(md: string) {
  return md.replace(/\*\*|`/g, "");
}
