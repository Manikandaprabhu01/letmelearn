import { cn } from "@/lib/utils";

/** Route segment of the Freshworks Lead SE deep dive. */
export const FRESHWORKS_LEAD = "freshworks-lead";

/** Where the reader is in the console: a company (or the deep dive) and which view. */
export type ConsoleLocation = { id: string; view: "bank" | "answers" };

export function tabClass(active: boolean) {
  return cn(
    "inline-flex h-9 items-center rounded-md border px-3.5 text-[13px] transition-colors duration-150",
    active ? "border-fg bg-fg text-bg" : "border-border text-muted hover:text-fg",
  );
}

export const chipClass =
  "inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10.5px] leading-4";

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
