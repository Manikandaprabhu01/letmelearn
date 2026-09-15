import type { PlaygroundMeta } from "@/data/types";

/** Sections on the Labs page, in the same order as the main menu's tracks. */
export const LAB_GROUPS: { title: string; blurb: string }[] = [
  {
    title: "Python for AI",
    blurb:
      "Chunk and search a handbook, price an LLM feature at real traffic, and pace API calls against a rate limit.",
  },
  {
    title: "System design fundamentals",
    blurb:
      "Rate limiters, hashing, IDs, CAP, load balancing, caches, quorums and probabilistic filters.",
  },
  {
    title: "Microservices & resilience",
    blurb:
      "Break a dependency, run a saga, starve a thread pool and roll out a canary — then fix each one.",
  },
];

export const playgrounds: PlaygroundMeta[] = [
  {
    slug: "rag-retrieval",
    title: "RAG retrieval",
    subtitle: "Chunk a handbook, run keyword search, and measure recall@k as you tune it.",
    tags: ["Python", "AI"],
    group: "Python for AI",
    relatedConcept: "/python/rag",
  },
  {
    slug: "llm-cost",
    title: "LLM cost calculator",
    subtitle: "Tokens in, tokens out, at real traffic. Which lever saves the most?",
    tags: ["Python", "AI"],
    group: "Python for AI",
    relatedConcept: "/python/llm-apis",
  },
  {
    slug: "async-concurrency",
    title: "Async calls vs rate limits",
    subtitle: "A semaphore meets a provider limit. Retry on 429, or pace on the client?",
    tags: ["Python"],
    group: "Python for AI",
    relatedConcept: "/python/concurrency-asyncio",
  },
  {
    slug: "rate-limiter",
    title: "Rate limiter lab",
    subtitle: "Token bucket, leaky bucket, fixed window, sliding log, sliding counter.",
    tags: ["HLD", "LLD"],
    group: "System design fundamentals",
    relatedConcept: "/hld/rate-limiting",
    relatedExample: "/examples/rate-limiter",
  },
  {
    slug: "consistent-hashing",
    title: "Consistent hashing ring",
    subtitle: "Add and remove nodes. Watch keys remap — or not.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedConcept: "/hld/consistent-hashing",
    relatedExample: "/examples/consistent-hashing",
  },
  {
    slug: "snowflake",
    title: "Snowflake IDs",
    subtitle: "Pack a 64-bit ID. Decode timestamp, worker, sequence.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedExample: "/examples/unique-id",
  },
  {
    slug: "url-shortener",
    title: "Base62 short codes",
    subtitle: "Counter to code, code to counter. Collision-free IDs.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedExample: "/examples/url-shortener",
  },
  {
    slug: "cap-theorem",
    title: "CAP partition",
    subtitle: "Split the network and watch CP vs AP nodes decide.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedConcept: "/hld/cap-theorem",
  },
  {
    slug: "load-balancer",
    title: "Load balancer",
    subtitle: "Round robin, least connections, consistent hash — same traffic, different picks.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedConcept: "/hld/load-balancing",
  },
  {
    slug: "lru-cache",
    title: "LRU cache",
    subtitle: "Hash map + doubly linked list. Hits climb; the tail falls off.",
    tags: ["LLD"],
    group: "System design fundamentals",
    relatedConcept: "/lld/lru-cache",
  },
  {
    slug: "quorum",
    title: "Quorum N / W / R",
    subtitle: "Tune replica counts. See when reads intersect writes.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedConcept: "/hld/quorum",
    relatedExample: "/examples/kv-store",
  },
  {
    slug: "bloom-filter",
    title: "Bloom filter",
    subtitle: "Tune bits and hash functions. False positives appear — false negatives never do.",
    tags: ["HLD"],
    group: "System design fundamentals",
    relatedConcept: "/hld/bloom-filters",
  },
  {
    slug: "circuit-breaker",
    title: "Circuit breaker",
    subtitle:
      "Degrade a dependency live. Watch closed, open and half-open — and the worker time it saves.",
    tags: ["HLD", "Microservices"],
    group: "Microservices & resilience",
    relatedConcept: "/hld/circuit-breaker",
  },
  {
    slug: "saga",
    title: "Saga orchestration",
    subtitle: "Pick what fails. Compensations run in reverse — or retries push past the pivot.",
    tags: ["Microservices"],
    group: "Microservices & resilience",
    relatedConcept: "/hld/saga-pattern",
    relatedExample: "/examples/payment",
  },
  {
    slug: "bulkhead",
    title: "Bulkheads & timeouts",
    subtitle: "Slow one dependency. Does checkout survive a shared thread pool?",
    tags: ["Microservices", "HLD"],
    group: "Microservices & resilience",
    relatedConcept: "/hld/bulkheads-load-shedding",
  },
  {
    slug: "canary-release",
    title: "Canary release",
    subtitle:
      "Ship a good, subtle or bad build. See statistical auto-rollback — and when it misses.",
    tags: ["Microservices"],
    group: "Microservices & resilience",
    relatedConcept: "/hld/deployment-strategies",
  },
];

export function getPlayground(slug: string) {
  return playgrounds.find((p) => p.slug === slug);
}
