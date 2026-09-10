import { lldDesigns } from "@/data/concepts/lld-designs";
import { lldCreationalPatterns } from "@/data/concepts/lld-patterns-creational";
import { lldBehavioralPatterns } from "@/data/concepts/lld-patterns-behavioral";
import { lldStructuralPatterns } from "@/data/concepts/lld-patterns-structural";
import { lldPrinciples } from "@/data/concepts/lld-principles";
import { lldProblems } from "@/data/concepts/lld-problems";
import { lldRuntime } from "@/data/concepts/lld-runtime";
import type { Concept } from "@/data/types";

/**
 * Low-level design curriculum, ordered as a reading path:
 * principles → patterns → applied machine-coding problems → runtime concerns.
 */
export const lldConcepts: Concept[] = [
  ...lldPrinciples,
  ...lldCreationalPatterns,
  ...lldStructuralPatterns,
  ...lldBehavioralPatterns,
  ...lldProblems,
  ...lldDesigns,
  ...lldRuntime,
];

export function getLld(slug: string) {
  return lldConcepts.find((c) => c.slug === slug);
}
