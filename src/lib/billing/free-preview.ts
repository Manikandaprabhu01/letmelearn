import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import { hldConcepts } from "@/data/hld";
import { javaConcepts } from "@/data/java";
import { lldConcepts } from "@/data/lld";

/**
 * What stays readable without paying.
 *
 * The first entry of every track is free, so a visitor can judge the writing
 * at full depth before being asked for money — a paywall in front of every
 * page asks people to buy something they have not seen.
 *
 * Derived from each track's own order rather than a hardcoded slug list: a
 * list would silently start gating the sample the first time a track is
 * reordered.
 */
const FREE_SLUGS: ReadonlySet<string> = new Set(
  [
    hldConcepts[0]?.slug,
    lldConcepts[0]?.slug,
    examples[0]?.slug,
    fdeConcepts[0]?.slug,
    javaConcepts[0]?.slug,
  ].filter((slug): slug is string => Boolean(slug)),
);

/** True when this slug is one of the free samples. */
export function isFreeSample(slug: string): boolean {
  return FREE_SLUGS.has(slug);
}
