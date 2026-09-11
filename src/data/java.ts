import { javaCore } from "@/data/java/ch-05-core";
import { javaData } from "@/data/java/ch-11-data";
import { javaDeploy } from "@/data/java/ch-17-deploy";
import { javaFoundations } from "@/data/java/ch-00-foundations";
import { javaPlatform } from "@/data/java/ch-08-platform";
import { javaQuality } from "@/data/java/ch-15-quality";
import { javaRuntime } from "@/data/java/ch-03-runtime";
import { javaSpring } from "@/data/java/ch-18-spring";
import { javaWeb } from "@/data/java/ch-13-web";
import type { Concept } from "@/data/types";

const all: Concept[] = [
  ...javaFoundations,
  ...javaRuntime,
  ...javaCore,
  ...javaPlatform,
  ...javaData,
  ...javaWeb,
  ...javaQuality,
  ...javaDeploy,
  ...javaSpring,
];

/**
 * Chapter order from the source guide. The concepts are grouped into files by
 * theme for editing, but the curriculum is presented in its original numbered
 * sequence — chapter numbers are how the guide refers to itself.
 */
const CHAPTER_ORDER = [
  "how-to-use-this-guide",
  "basics",
  "oop",
  "multithreading",
  "exception-handling",
  "networking",
  "collections",
  "strings-and-regex",
  "advanced-topics",
  "file-io-serialization",
  "annotations-reflection",
  "jdbc",
  "testing",
  "web-development",
  "java-8",
  "design-patterns",
  "security",
  "cloud-computing",
  "spring-framework",
  "docker",
] as const;

export const javaConcepts: Concept[] = CHAPTER_ORDER.map((slug) => {
  const found = all.find((c) => c.slug === slug);
  if (!found) throw new Error(`java: no concept for chapter slug "${slug}"`);
  return found;
});

export function getJava(slug: string) {
  return javaConcepts.find((c) => c.slug === slug);
}

/** Chapter number as the source guide numbers them, starting at 0. */
export function javaChapterNumber(slug: string): number {
  return javaConcepts.findIndex((c) => c.slug === slug);
}
