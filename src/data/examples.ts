import { awesomeExamples } from "@/data/examples-awesome";
import { vol1Examples } from "@/data/examples-vol1";
import { vol2Examples } from "@/data/examples-vol2";
import type { DesignExample } from "@/data/types";

export const examples: DesignExample[] = [...vol1Examples, ...vol2Examples, ...awesomeExamples];

export function getExample(slug: string) {
  return examples.find((e) => e.slug === slug);
}
