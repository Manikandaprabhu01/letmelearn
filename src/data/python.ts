import { pythonData } from "@/data/python/ch-10-data";
import { pythonEngineering } from "@/data/python/ch-06-engineering";
import { pythonFoundations } from "@/data/python/ch-00-foundations";
import { pythonLanguage } from "@/data/python/ch-03-language";
import { pythonLlmApps } from "@/data/python/ch-15-llm";
import { pythonMachineLearning } from "@/data/python/ch-12-ml";
import { pythonProduction } from "@/data/python/ch-18-production";
import type { Concept } from "@/data/types";

const all: Concept[] = [
  ...pythonFoundations,
  ...pythonLanguage,
  ...pythonEngineering,
  ...pythonData,
  ...pythonMachineLearning,
  ...pythonLlmApps,
  ...pythonProduction,
];

/**
 * Chapter order. Concepts are grouped into files by theme for editing, but the
 * track reads as one numbered sequence — chapter numbers are how the chapters
 * refer to each other ("see chapter 6").
 */
const CHAPTER_ORDER = [
  "how-to-use-this-track",
  "python-basics",
  "data-structures",
  "functions-generators-decorators",
  "oop-dataclasses",
  "errors-context-logging",
  "typing-pydantic",
  "environments-packaging",
  "concurrency-asyncio",
  "testing",
  "numpy",
  "pandas-eda",
  "scikit-learn",
  "pytorch",
  "transformers-embeddings",
  "llm-apis",
  "rag",
  "agents",
  "fastapi",
  "mlops-deployment",
] as const;

export const pythonConcepts: Concept[] = CHAPTER_ORDER.map((slug) => {
  const found = all.find((c) => c.slug === slug);
  if (!found) throw new Error(`python: no concept for chapter slug "${slug}"`);
  return found;
});

export function getPython(slug: string) {
  return pythonConcepts.find((c) => c.slug === slug);
}

/** Chapter number, starting at 0. */
export function pythonChapterNumber(slug: string): number {
  return pythonConcepts.findIndex((c) => c.slug === slug);
}

/** The parts the index page groups chapters into, as inclusive chapter ranges. */
export const PYTHON_PARTS: { title: string; blurb: string; from: number; to: number }[] = [
  {
    title: "Start here",
    blurb: "The map of the track, three reading paths, and a one-time project setup.",
    from: 0,
    to: 0,
  },
  {
    title: "Part 1 — The language",
    blurb: "The object model, the built-in containers, generators, classes and error handling.",
    from: 1,
    to: 5,
  },
  {
    title: "Part 2 — Engineering Python",
    blurb:
      "Types and validation, reproducible environments, concurrency, and testing — including LLM code.",
    from: 6,
    to: 9,
  },
  {
    title: "Part 3 — Data",
    blurb: "Vectorised numerics and the exploratory work that decides whether a model can succeed.",
    from: 10,
    to: 11,
  },
  {
    title: "Part 4 — Machine learning",
    blurb: "Classic ML, deep learning, and what transformers and embeddings actually are.",
    from: 12,
    to: 14,
  },
  {
    title: "Part 5 — LLM applications in production",
    blurb: "Calling models well, RAG, agents, serving with FastAPI, and operating it all.",
    from: 15,
    to: 19,
  },
];
