import type { PlaygroundMeta } from "@/data/types";

export const playgrounds: PlaygroundMeta[] = [
  {
    slug: "rate-limiter",
    title: "Rate limiter lab",
    subtitle: "Token bucket, leaky bucket, fixed window, sliding log, sliding counter.",
    tags: ["HLD", "LLD"],
    relatedConcept: "/hld/rate-limiting",
    relatedExample: "/examples/rate-limiter",
  },
  {
    slug: "consistent-hashing",
    title: "Consistent hashing ring",
    subtitle: "Add and remove nodes. Watch keys remap — or not.",
    tags: ["HLD"],
    relatedConcept: "/hld/consistent-hashing",
    relatedExample: "/examples/consistent-hashing",
  },
  {
    slug: "snowflake",
    title: "Snowflake IDs",
    subtitle: "Pack a 64-bit ID. Decode timestamp, worker, sequence.",
    tags: ["HLD"],
    relatedExample: "/examples/unique-id",
  },
  {
    slug: "url-shortener",
    title: "Base62 short codes",
    subtitle: "Counter to code, code to counter. Collision-free IDs.",
    tags: ["HLD"],
    relatedExample: "/examples/url-shortener",
  },
  {
    slug: "cap-theorem",
    title: "CAP partition",
    subtitle: "Split the network and watch CP vs AP nodes decide.",
    tags: ["HLD"],
    relatedConcept: "/hld/cap-theorem",
  },
  {
    slug: "load-balancer",
    title: "Load balancer",
    subtitle: "Round robin, least connections, consistent hash — same traffic, different picks.",
    tags: ["HLD"],
    relatedConcept: "/hld/load-balancing",
  },
  {
    slug: "lru-cache",
    title: "LRU cache",
    subtitle: "Hash map + doubly linked list. Hits climb; the tail falls off.",
    tags: ["LLD"],
    relatedConcept: "/lld/lru-cache",
  },
  {
    slug: "quorum",
    title: "Quorum N / W / R",
    subtitle: "Tune replica counts. See when reads intersect writes.",
    tags: ["HLD"],
    relatedConcept: "/hld/quorum",
    relatedExample: "/examples/kv-store",
  },
];

export function getPlayground(slug: string) {
  return playgrounds.find((p) => p.slug === slug);
}
