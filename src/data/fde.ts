import { fdeAiEngineering } from "@/data/fde/step-3-ai-engineering";
import { fdeAiMl } from "@/data/fde/step-2-ai-ml";
import { fdeEnterprise } from "@/data/fde/step-6-enterprise";
import { fdeFoundation } from "@/data/fde/step-1-foundation";
import { fdeLayer } from "@/data/fde/step-8-fde-layer";
import { fdeProduction } from "@/data/fde/step-4-production";
import { fdeReliability } from "@/data/fde/step-5-reliability";
import { fdeSystemDesign } from "@/data/fde/step-7-system-design";
import type { Concept } from "@/data/types";

/**
 * The AI FDE roadmap, ordered as a progression: engineering foundation →
 * model fundamentals → AI engineering craft → running it in production →
 * keeping it reliable → integrating with the enterprise → designing whole
 * systems → the customer-facing layer that defines the role.
 */
export const fdeConcepts: Concept[] = [
  ...fdeFoundation,
  ...fdeAiMl,
  ...fdeAiEngineering,
  ...fdeProduction,
  ...fdeReliability,
  ...fdeEnterprise,
  ...fdeSystemDesign,
  ...fdeLayer,
];

export function getFde(slug: string) {
  return fdeConcepts.find((c) => c.slug === slug);
}

/** Step number for display — the roadmap is explicitly a numbered path. */
export function fdeStepNumber(slug: string): number {
  return fdeConcepts.findIndex((c) => c.slug === slug) + 1;
}
