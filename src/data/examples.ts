import { deepExamples } from "@/data/examples/deep";
import { awesomeExamples } from "@/data/examples-awesome";
import { vol1Examples } from "@/data/examples-vol1";
import { vol2Examples } from "@/data/examples-vol2";
import type { DesignExample } from "@/data/types";

const base: DesignExample[] = [...vol1Examples, ...vol2Examples, ...awesomeExamples];

/**
 * Chapter-depth rewrites replace their thinner counterparts by slug while
 * keeping the original catalogue order, so links and progress ids are stable.
 */
const deepBySlug = new Map(deepExamples.map((e) => [e.slug, e]));

export const examples: DesignExample[] = base.map((e) => deepBySlug.get(e.slug) ?? e);

export function getExample(slug: string) {
  return examples.find((e) => e.slug === slug);
}
