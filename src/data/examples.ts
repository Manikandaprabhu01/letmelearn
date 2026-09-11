import { deepExamples } from "@/data/examples/deep";
import { awesomeExamples } from "@/data/examples-awesome";
import { vol1Examples } from "@/data/examples-vol1";
import { vol2Examples } from "@/data/examples-vol2";
import type { DesignExample } from "@/data/types";

const base: DesignExample[] = [...vol1Examples, ...vol2Examples, ...awesomeExamples];

/**
 * Every example is now a chapter-depth rewrite, merged over the base catalogue
 * by slug so ordering, routes, related links and progress ids stay stable.
 */
const deepBySlug = new Map(deepExamples.map((e) => [e.slug, e]));

export const examples: DesignExample[] = base.map((e) => deepBySlug.get(e.slug) ?? e);

export function getExample(slug: string) {
  return examples.find((e) => e.slug === slug);
}
