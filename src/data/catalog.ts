import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import { hldConcepts } from "@/data/hld";
import { lldConcepts } from "@/data/lld";
import { playgrounds } from "@/data/playgrounds";

export type CatalogHit = {
  path: string;
  title: string;
  subtitle: string;
  kind: string;
  tags: string[];
};

export const catalog: CatalogHit[] = [
  ...hldConcepts.map((c) => ({
    path: `/hld/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "HLD",
    tags: c.tags,
  })),
  ...lldConcepts.map((c) => ({
    path: `/lld/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "LLD",
    tags: c.tags,
  })),
  ...fdeConcepts.map((c) => ({
    path: `/fde/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "AI FDE",
    tags: c.tags,
  })),
  ...examples.map((c) => ({
    path: `/examples/${c.slug}`,
    title: c.title,
    subtitle: c.summary,
    kind: c.source,
    tags: c.tags,
  })),
  ...playgrounds.map((c) => ({
    path: `/playgrounds/${c.slug}`,
    title: c.title,
    subtitle: c.subtitle,
    kind: "Lab",
    tags: c.tags,
  })),
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
      const hay = `${item.title} ${item.subtitle} ${item.kind} ${item.tags.join(" ")}`.toLowerCase();
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
