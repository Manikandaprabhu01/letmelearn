import { hldConsistency } from "@/data/concepts/hld-consistency";
import { hldData } from "@/data/concepts/hld-data";
import { hldFundamentals } from "@/data/concepts/hld-fundamentals";
import { hldMessaging } from "@/data/concepts/hld-messaging";
import { hldPlatform } from "@/data/concepts/hld-platform";
import { hldResilience } from "@/data/concepts/hld-resilience";
import type { Concept } from "@/data/types";

/**
 * High-level design curriculum, ordered as a reading path:
 * fundamentals → data → consistency → messaging → resilience → platform.
 */
export const hldConcepts: Concept[] = [
  ...hldFundamentals,
  ...hldData,
  ...hldConsistency,
  ...hldMessaging,
  ...hldResilience,
  ...hldPlatform,
];

export function getHld(slug: string) {
  return hldConcepts.find((c) => c.slug === slug);
}
