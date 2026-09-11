import type { Section } from "@/data/types";

/** Stable, readable anchor for a section heading. */
export function headingId(heading: string, index: number) {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug ? `${slug}` : `s-${index}`;
}

export type TocEntry = { id: string; label: string; group?: string };

export function tocFromSections(sections: Section[], group?: string, offset = 0): TocEntry[] {
  return sections.map((s, i) => ({
    id: headingId(s.heading, i + offset),
    label: s.heading,
    group,
  }));
}
