import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import {
  COMPANY_COUNT,
  COMPANY_INDEX,
  LIBRARY_ANSWER_COUNT,
  QUESTION_COUNT,
  getSector,
} from "@/data/interview/meta";
import { javaConcepts } from "@/data/java";
import { hldConcepts } from "@/data/hld";
import { lldConcepts } from "@/data/lld";
import { pythonConcepts } from "@/data/python";
import { playgrounds } from "@/data/playgrounds";

export type CatalogHit = {
  path: string;
  title: string;
  subtitle: string;
  kind: string;
  tags: string[];
};

export const catalog: CatalogHit[] = [
  ...javaConcepts.map((c) => ({
    path: `/java/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "Java",
    tags: c.tags,
  })),
  ...pythonConcepts.map((c) => ({
    path: `/python/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "Python",
    tags: c.tags,
  })),
  ...lldConcepts.map((c) => ({
    path: `/lld/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "LLD",
    tags: c.tags,
  })),
  ...hldConcepts.map((c) => ({
    path: `/hld/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "HLD",
    tags: c.tags,
  })),
  ...examples.map((c) => ({
    path: `/examples/${c.slug}`,
    title: c.title,
    subtitle: c.summary,
    kind: c.source,
    tags: c.tags,
  })),
  ...fdeConcepts.map((c) => ({
    path: `/fde/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "AI FDE",
    tags: c.tags,
  })),
  {
    path: "/interview-prep",
    title: "Interview Prep Console",
    subtitle: `Question banks and answer sheets for ${COMPANY_COUNT} companies — ${QUESTION_COUNT} questions, ${LIBRARY_ANSWER_COUNT} worked answers`,
    kind: "Interview prep",
    tags: ["interview", "questions", "answers", "companies"],
  },
  {
    path: "/interview-prep/freshworks-lead",
    title: "Freshworks Lead SE question bank",
    subtitle: "101 questions from 26 candidate reports, by round, with a full answer sheet",
    kind: "Interview prep",
    tags: ["freshworks", "lead", "deep dive"],
  },
  ...COMPANY_INDEX.map((c) => ({
    path: `/interview-prep/${c.id}`,
    title: c.sector === "core" ? c.name : `${c.name} interview questions`,
    subtitle: c.tag,
    kind: "Interview prep",
    tags: [getSector(c.sector).name, `${c.questions} questions`],
  })),
  ...playgrounds.map((c) => ({
    path: `/playgrounds/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "Lab",
    tags: c.tags,
  })),
  {
    path: "/compiler",
    title: "Code Compiler",
    subtitle:
      "Run Java, Python, JavaScript, TypeScript and SQL snippets, with the chapters' examples loaded in",
    kind: "Compiler",
    tags: ["compiler", "run code", "playground", "sql", "repl"],
  },
  {
    path: "/resources",
    title: "Awesome system design resources",
    subtitle: "Source 6 — interview problems, papers, and channels from ashishps1's list",
    kind: "Sources",
    tags: ["awesome", "papers", "github", "algomaster"],
  },
];

export function lookupPath(path: string) {
  return catalog.find((c) => c.path === path);
}

export function searchCatalog(q: string, limit = 12): CatalogHit[] {
  const s = q.trim().toLowerCase();
  if (!s) return catalog.slice(0, limit);
  return catalog
    .map((item) => {
      const hay =
        `${item.title} ${item.subtitle} ${item.kind} ${item.tags.join(" ")}`.toLowerCase();
      let score = 0;
      if (item.title.toLowerCase().includes(s)) score += 5;
      if (hay.includes(s)) score += 2;
      for (const word of s.split(/\s+/)) if (hay.includes(word)) score += 1;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
