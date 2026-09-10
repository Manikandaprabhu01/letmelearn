import { deepExamples } from "@/data/examples/deep";
import { exampleSupplements } from "@/data/examples/supplements";
import { awesomeExamples } from "@/data/examples-awesome";
import { vol1Examples } from "@/data/examples-vol1";
import { vol2Examples } from "@/data/examples-vol2";
import type { DesignExample } from "@/data/types";

const base: DesignExample[] = [...vol1Examples, ...vol2Examples, ...awesomeExamples];

/**
 * Chapter-depth rewrites replace their thinner counterparts by slug; everything
 * else gets the framework sections layered on. Catalogue order is preserved so
 * links and progress ids stay stable.
 */
const deepBySlug = new Map(deepExamples.map((e) => [e.slug, e]));

export const examples: DesignExample[] = base.map((e) => {
  const deep = deepBySlug.get(e.slug);
  if (deep) return deep;
  const extra = exampleSupplements[e.slug];
  return extra ? { ...e, ...extra } : e;
});

export function getExample(slug: string) {
  return examples.find((e) => e.slug === slug);
}
