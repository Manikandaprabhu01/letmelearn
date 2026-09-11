import type { DesignExample } from "@/data/types";

export const vol1Examples: DesignExample[] = [
  {
    slug: "scale-to-millions",
    title: "Scale from Zero to Millions of Users",
    source: "Volume 1",
    chapter: 1,
    difficulty: "foundational",
    minutes: 14,
    tags: ["framework", "web stack"],
    companies: ["Any web product"],
    summary:
      "The opening chapter of Alex Xu Volume 1 is a tour of the standard web stack: one server, then split, load balance, cache, replica, CDN, queue, and shard. Use it as the skeleton under every later design.",
    requirements: {
      functional: [
        "Users can read and write the product's core objects",
        "Sessions survive more than one app box",
      ],
      nonFunctional: [
        "Grow from 1 to 10M users without a rewrite",
        "Survive a single-AZ app failure",
        "Keep p95 latency interactive",
      ],
    },
    architecture: [
      {
        heading: "Walk the ladder out loud",
        numbered: [
          "Single host: web + DB. Fine for a demo.",
          "Split DB. Take backups. Tune indexes.",
          "Load balancer + two app boxes. Sessions in Redis or JWT.",
          "Read replicas. Cache-aside for hot keys.",
          "CDN for static. Object store for uploads.",
          "Message queue for email, thumbnails, fan-out.",
          "Shard when the primary's write QPS or working set saturates.",
        ],
        diagram: {
          kind: "layers",
          caption: "Volume 1, chapter 1 — the stack you keep redrawing",
          layers: [
            { title: "Edge", items: ["DNS", "CDN", "Load balancer"] },
            { title: "Stateless", items: ["Web / API fleet"] },
            { title: "Stateful fast", items: ["Redis cache / sessions"] },
            { title: "Async", items: ["Queue + workers"] },
            {
              title: "Source of truth",
              items: ["Primary DB", "Replicas", "Shards", "Object storage"],
            },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "The interview use of this chapter",
        body: [
          "You almost never design 'scale from zero' as the whole question. You use it as a checklist: did I put a cache on the hot path? Did I say how we fail over the primary? Did I keep compute stateless?",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Vertical first",
        pickWhen: "Early product, strong transactions, small team",
        cost: "Ceiling and blast radius",
      },
      {
        choice: "Shard early",
        pickWhen: "Write-heavy, obvious partition key (tenant, city)",
        cost: "Joins and ops forever",
      },
    ],
    related: ["/hld/scaling", "/hld/caching", "/hld/load-balancing"],
    furtherReading: [
      { label: "roadmap.sh system design", href: "https://roadmap.sh/system-design" },
    ],
  },
  {
    slug: "interview-framework",
    title: "A Framework for System Design Interviews",
    source: "Volume 1",
    chapter: 3,
    difficulty: "foundational",
    minutes: 10,
    tags: ["interview"],
    companies: ["FAANG-style loops"],
    summary:
      "Volume 1 chapter 3 (and Volume 2's opening) is a four-step script: clarify, sketch, deep-dive, wrap. Every example in LetMeLearn is written in that order so you can reuse the muscle memory.",
    requirements: {
      functional: ["Agree on use cases and who the users are", "Agree on what is out of scope"],
      nonFunctional: ["QPS, latency, consistency, availability, cost"],
    },
    architecture: [
      {
        heading: "The four steps",
        numbered: [
          "Understand and scope (3–8 min). Users, features, scale, SLA. Ask numbers. Write them down.",
          "High-level design (8–15 min). Boxes and arrows. APIs. Data stores. Get buy-in before diving.",
          "Deep dive (15–25 min). The two or three hard parts: the feed fan-out, the hash ring, the payment ledger.",
          "Wrap (3–5 min). Bottlenecks, failure modes, what you would do with another hour.",
        ],
        callout: {
          kind: "insight",
          title: "Buy-in",
          text: "The most common failure is drawing for 25 minutes on a design the interviewer did not want. Narrate, pause, ask 'does this match what you had in mind?'",
        },
      },
    ],
    deepDives: [
      {
        heading: "Questions that buy you the right problem",
        bullets: [
          "Read-heavy or write-heavy?",
          "How fresh must reads be?",
          "Single region or global?",
          "Peak vs average QPS?",
          "What happens if we lose 60 seconds of writes?",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Go deep on one subsystem",
        pickWhen: "45–60 min interviews",
        cost: "Thin coverage of the rest — say so",
      },
      {
        choice: "Survey everything",
        pickWhen: "Junior loops, or the interviewer wants breadth",
        cost: "Looks shallow if you never pick a hard part",
      },
    ],
    related: ["/hld/estimation", "/examples/rate-limiter", "/examples/url-shortener"],
    furtherReading: [
      {
        label: "roadmap.sh interview questions",
        href: "https://roadmap.sh/questions/system-design",
      },
    ],
  },
  {
    slug: "rate-limiter",
    title: "Design a Rate Limiter",
    source: "Volume 1",
    chapter: 4,
    difficulty: "intermediate",
    minutes: 18,
    tags: ["redis", "gateway"],
    companies: ["Stripe", "Twitter", "AWS API Gateway", "Lyft"],
    summary:
      "Alex Xu Volume 1, chapter 4. Throttle clients so no neighbor starves the API. Token bucket is the default algorithm; Redis holds counters; a rules service holds limits; rejected callers get HTTP 429 plus headers.",
    requirements: {
      functional: [
        "Limit by user, IP, or API key, with different rules per endpoint and tier",
        "Return 429 with Retry-After and remaining quota headers",
        "Rules change without a deploy",
      ],
      nonFunctional: [
        "Adds < few ms on the hot path",
        "Accurate enough across a fleet of app servers",
        "Survives Redis blips without melting origin",
      ],
    },
    estimation: [
      { item: "Peak QPS", calc: "If the API is 100k QPS, the limiter sees 100k decisions/sec" },
      {
        item: "State",
        calc: "One bucket per key. 10M active keys × ~50 B ≈ 0.5 GB in Redis — small",
      },
    ],
    apis: [
      {
        method: "ANY",
        path: "/…",
        desc: "Middleware wraps existing APIs. Decision is allow or 429.",
      },
      { method: "GET", path: "/internal/rules", desc: "Workers pull the rule set into cache." },
    ],
    architecture: [
      {
        heading: "High-level path",
        body: [
          "Client hits the rate-limiting middleware (or API gateway). Middleware loads the rule for (key, endpoint), reads/updates the bucket in Redis, and either forwards or rejects. Workers pull rules from disk/config into memory so the hot path is not hitting a database.",
        ],
        diagram: {
          kind: "flow",
          caption: "Volume 1 figure-style path: client → middleware ⇄ Redis → API",
          rows: [
            [
              { id: "c", label: "Client" },
              { id: "mw", label: "Limiter MW", tone: "accent" },
              { id: "api", label: "API fleet", tone: "ok" },
            ],
            [
              { id: "rules", label: "Rules cache" },
              { id: "redis", label: "Redis", sub: "Lua / INCR" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Algorithm choice",
        table: {
          headers: ["Pick", "When"],
          rows: [
            ["Token bucket", "Public APIs that should allow short bursts (Stripe, AWS)"],
            ["Leaky bucket", "Downstream cannot burst — SMS, some payment processors"],
            ["Fixed window", "Internal, coarse limits; watch the boundary 2× spike"],
            ["Sliding log", "Need precision and can afford memory"],
            ["Sliding counter", "Good precision, O(1) memory — a common compromise"],
          ],
        },
      },
      {
        heading: "Race conditions",
        body: [
          "Two app boxes reading 1 token and both decrementing is the classic bug. Fix: Redis INCR for counters, or a Lua script that refills and consumes atomically for token bucket. Fail-open vs fail-closed if Redis is down is a product call — mention both.",
        ],
        callout: {
          kind: "insight",
          title: "Open the lab",
          text: "Fire a burst at the boundary of a fixed window, then the same burst at a token bucket. The pictures match the five-algorithm playgrounds used in LLD teaching sites.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Central Redis",
        pickWhen: "You need one global limit",
        cost: "Extra hop, a dependency",
      },
      {
        choice: "Local token buckets + periodic sync",
        pickWhen: "Ultra-low latency, approximate is OK",
        cost: "Over-allow across boxes",
      },
    ],
    related: ["/playgrounds/rate-limiter", "/hld/rate-limiting", "/lld/rate-limiter"],
    furtherReading: [
      {
        label: "LLD rate-limiter playground",
        href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html",
      },
    ],
    playground: "rate-limiter",
  },
  {
    slug: "consistent-hashing",
    title: "Design Consistent Hashing",
    source: "Volume 1",
    chapter: 5,
    difficulty: "intermediate",
    minutes: 14,
    tags: ["hash ring", "sharding"],
    companies: ["Amazon Dynamo", "Cassandra", "CDNs", "Discord"],
    summary:
      "Volume 1 chapter 5. A hash ring plus virtual nodes so adding a cache or database host remaps only a slice of keys. This is the partitioning backbone of the key-value store chapter that follows.",
    requirements: {
      functional: [
        "Map key → server",
        "Add/remove a server with minimal remapping",
        "Balance load across heterogeneous boxes",
      ],
      nonFunctional: ["O(log n) lookup", "No central rebalance coordinator required"],
    },
    architecture: [
      {
        heading: "Ring",
        numbered: [
          "Hash servers onto a circle (many virtual nodes each).",
          "Hash the key onto the same circle.",
          "Owner is the first vnode clockwise.",
          "On join, the new vnode steals the arc from its successor. Everyone else is untouched.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "k", label: "key" },
              { id: "h", label: "hash ring", tone: "accent" },
              { id: "s", label: "server / vnode" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Virtual nodes",
        body: [
          "One point per server is too coarse — a lucky hash puts a huge arc on a small box. Hundreds of vnodes per physical host smear the ring. Bigger hosts get more vnodes (weights).",
        ],
      },
      {
        heading: "Lookups in code",
        body: [
          "Keep sorted vnode hashes; binary search for the successor. In production, libraries also copy keys to the next N-1 clockwise neighbors for replication (Dynamo).",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "More vnodes",
        pickWhen: "Load looks spiky",
        cost: "Larger membership map, more remaps on a host fail",
      },
      {
        choice: "Modulo hashing",
        pickWhen: "N is fixed forever (it isn't)",
        cost: "Near-total remap on change",
      },
    ],
    related: ["/playgrounds/consistent-hashing", "/hld/consistent-hashing", "/examples/kv-store"],
    furtherReading: [
      {
        label: "Dynamo paper §4.2",
        href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
      },
    ],
    playground: "consistent-hashing",
  },
  {
    slug: "kv-store",
    title: "Design a Key-Value Store",
    source: "Volume 1",
    chapter: 6,
    difficulty: "advanced",
    minutes: 22,
    tags: ["dynamo", "distributed"],
    companies: ["Amazon DynamoDB", "Cassandra", "Riak"],
    summary:
      "Volume 1 chapter 6 is a Dynamo-class AP store: consistent hashing, replication, sloppy quorum, gossip, Merkle trees, and hinted handoff. It is the hardest 'pure infrastructure' question in the first book.",
    requirements: {
      functional: [
        "put(key, value), get(key)",
        "Tunable consistency",
        "Survive disk and node loss",
      ],
      nonFunctional: [
        "Million+ QPS class",
        "Single-digit ms gets on hot keys",
        "Always writable (AP lean)",
      ],
    },
    architecture: [
      {
        heading: "High-level",
        body: [
          "A client (or coordinator node) hashes the key onto the ring, writes to N successors, waits for W acks, and returns. Reads ask R replicas and repair on mismatch (read repair, Merkle anti-entropy).",
        ],
        diagram: {
          kind: "layers",
          layers: [
            { title: "API", items: ["Coordinator / smart client"] },
            { title: "Membership", items: ["Hash ring", "Gossip", "Failure detector"] },
            { title: "Replication", items: ["N copies", "Quorum R/W", "Hinted handoff"] },
            {
              title: "Storage engine",
              items: ["Commit log", "Memtable", "SSTables", "Compaction"],
            },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Versioning",
        body: [
          "Concurrent writes need a story: last-write-wins (clocks lie), vector clocks (Dynamo), or CRDTs. Vector clocks let the client, not the store, merge siblings — shopping carts being the textbook case.",
        ],
      },
      {
        heading: "LSM tree",
        body: [
          "Writes append to a commit log and an in-memory memtable. When the memtable fills, it flushes to an immutable SSTable. Reads check memtable then newest SSTables, using Bloom filters to skip files. Compaction merges and drops tombstones.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "W=N, R=1",
        pickWhen: "Read-heavy, can wait on writes",
        cost: "Writes fail if any replica is down",
      },
      {
        choice: "W=1, R=1",
        pickWhen: "Availability over correctness",
        cost: "Easy to lose or split values",
      },
      {
        choice: "CP leader store instead",
        pickWhen: "Need linearizable counters / locks",
        cost: "You are no longer designing Dynamo",
      },
    ],
    related: [
      "/hld/quorum",
      "/hld/consistent-hashing",
      "/hld/bloom-filters",
      "/playgrounds/quorum",
    ],
    furtherReading: [
      {
        label: "Amazon Dynamo paper",
        href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
      },
    ],
    playground: "quorum",
  },
  {
    slug: "unique-id",
    title: "Design a Unique ID Generator",
    source: "Volume 1",
    chapter: 7,
    difficulty: "intermediate",
    minutes: 14,
    tags: ["snowflake"],
    companies: ["Twitter / X", "Instagram", "Discord"],
    summary:
      "Volume 1 chapter 7. 64-bit, roughly time-ordered IDs, unique across datacenters, no coordination on the hot path. Twitter Snowflake is the default answer; ticket servers and UUIDs are the foils.",
    requirements: {
      functional: [
        "IDs unique globally",
        "Fit in 64 bits",
        "Roughly sortable by time",
        "Generate > 10k/s per machine",
      ],
      nonFunctional: ["Available across regions", "Survive clock drift with a defined policy"],
    },
    architecture: [
      {
        heading: "Options you should name",
        table: {
          headers: ["Approach", "Pros", "Cons"],
          rows: [
            ["UUID v4", "No coord, 128 bit", "Big, not time-ordered, bad as clustered PK"],
            ["DB auto-increment", "Simple, ordered", "Single writer, hard to shard"],
            ["Ticket server (Flickr)", "Compact", "Bottleneck, SPOF unless ranged"],
            ["Snowflake", "64-bit, sortable, 1k workers", "Clock, worker-id assignment"],
          ],
        },
        diagram: {
          kind: "bits",
          caption: "Twitter Snowflake — 64 bits",
          fields: [
            { label: "sign", bits: 1, note: "0" },
            { label: "timestamp", bits: 41, note: "~69y" },
            { label: "dc", bits: 5, note: "0–31" },
            { label: "worker", bits: 5, note: "0–31" },
            { label: "sequence", bits: 12, note: "4096/ms" },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Clock went backwards",
        body: [
          "Refuse to mint until the clock catches up, or increment a logical sequence while holding the last timestamp. Never emit a duplicate. NTP can jump; use a monotonic source when the OS gives you one.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Snowflake",
        pickWhen: "Need compact, sortable IDs at high QPS",
        cost: "Worker ID ops, clock care",
      },
      {
        choice: "UUID v7",
        pickWhen: "You can afford 128 bits and want less ops",
        cost: "Index bloat vs bigint",
      },
    ],
    related: ["/playgrounds/snowflake", "/hld/estimation", "/examples/url-shortener"],
    furtherReading: [{ label: "Snowflake ID", href: "https://en.wikipedia.org/wiki/Snowflake_ID" }],
    playground: "snowflake",
  },
  {
    slug: "url-shortener",
    title: "Design a URL Shortener",
    source: "Volume 1",
    chapter: 8,
    difficulty: "foundational",
    minutes: 16,
    tags: ["bit.ly", "base62"],
    companies: ["Bitly", "TinyURL", "X t.co"],
    summary:
      "Volume 1 chapter 8. Tiny write volume, huge read volume, a 301/302 redirect, and a compact ID in base62. The data model is almost one table; the interesting bits are ID generation, hashing vs counter, and analytics.",
    requirements: {
      functional: [
        "shorten(long) → short",
        "redirect(short) → long",
        "optional expiry, custom alias, click counts",
      ],
      nonFunctional: [
        "Redirect p99 of a few tens of ms",
        "Read-heavy (often 10:1 or more)",
        "Years of retention",
      ],
    },
    estimation: [
      { item: "Write QPS", calc: "100M new URLs/day ≈ 1.2k writes/s (peak ~3k)" },
      { item: "Read QPS", calc: "10× writes ≈ 12k/s (peak ~30k)" },
      { item: "IDs", calc: "62^7 ≈ 3.5e12 — 7 chars covers 100M/day for decades" },
      { item: "Storage", calc: "365B records × ~500 B ≈ 180 TB plus replicas" },
    ],
    apis: [
      {
        method: "POST",
        path: "/api/v1/links",
        desc: "{ longUrl, customAlias?, ttlDays? } → { shortUrl }",
      },
      { method: "GET", path: "/:code", desc: "302 (or 301) to the long URL" },
      { method: "GET", path: "/api/v1/links/:code/stats", desc: "Clicks, referrers, days" },
    ],
    dataModel: [
      {
        entity: "Link",
        fields: ["id (pk)", "code (unique)", "long_url", "created_at", "expires_at", "owner_id"],
      },
      { entity: "Click (optional, batched)", fields: ["code", "ts", "country", "ua"] },
    ],
    architecture: [
      {
        heading: "Happy path",
        numbered: [
          "POST: validate URL, mint a unique code, persist, return https://host/code.",
          "GET: cache lookup by code, else DB, then 302. 301 is cache-friendlier but painful if the mapping ever changes.",
          "Analytics: fire-and-forget to a queue; never block the redirect.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "u", label: "User" },
              { id: "lb", label: "LB" },
              { id: "api", label: "API" },
              { id: "cache", label: "Redis", tone: "accent" },
              { id: "db", label: "DB" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "How to mint the code",
        table: {
          headers: ["Method", "Note"],
          rows: [
            [
              "Hash long URL (MD5) then base62, take 7 chars",
              "Collisions; same URL → same code (sometimes wanted)",
            ],
            [
              "Counter + base62 (ticket / Snowflake)",
              "No collision, not deterministic from the URL",
            ],
            ["Pre-generated unused codes in a pool", "Low latency writes, workers refill the pool"],
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "302",
        pickWhen: "Mappings can change; you want every click",
        cost: "Less CDN cache",
      },
      { choice: "301", pickWhen: "Mappings are eternal", cost: "Browsers cache; stats undercount" },
    ],
    related: ["/playgrounds/url-shortener", "/examples/unique-id", "/hld/caching"],
    furtherReading: [
      { label: "roadmap.sh — URL shortener", href: "https://roadmap.sh/questions/system-design" },
    ],
    playground: "url-shortener",
  },
  {
    slug: "web-crawler",
    title: "Design a Web Crawler",
    source: "Volume 1",
    chapter: 9,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["search", "bloom"],
    companies: ["Google", "Bing", "Common Crawl"],
    summary:
      "Volume 1 chapter 9. A polite, distributed URL frontier, DNS, fetcher, renderer (maybe), parser, and duplicate URL / content detection. Bloom filters keep the 'have we seen this URL?' set in memory.",
    requirements: {
      functional: [
        "Start from seed URLs",
        "Respect robots.txt and politeness per host",
        "Extract links, store documents",
        "Detect duplicates",
      ],
      nonFunctional: [
        "Billions of pages",
        "Freshness for hot sites",
        "No thundering a small origin",
      ],
    },
    architecture: [
      {
        heading: "Pipeline",
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "f", label: "URL frontier", tone: "accent" },
              { id: "d", label: "DNS" },
              { id: "ft", label: "Fetcher" },
              { id: "p", label: "Parser" },
              { id: "s", label: "Store" },
            ],
          ],
        },
        numbered: [
          "Frontier is a priority queue + per-host queues so one host cannot monopolize.",
          "Seen-URL set: Bloom filter then canonicalization then a durable key store.",
          "Content fingerprint (simhash) catches mirrors.",
          "Workers are stateless; the frontier and seen-set are shared.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Politeness and freshness",
        body: [
          "One concurrent connection per host is a starting rule; back off on 429/5xx. Recrawl frequency is a function of change rate and PageRank-like importance — news every minute, a parked domain every month.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Headless render", pickWhen: "JS-heavy web", cost: "Orders of magnitude slower" },
      {
        choice: "Bloom-only seen set",
        pickWhen: "RAM is tight",
        cost: "False positives skip new pages",
      },
    ],
    related: ["/hld/bloom-filters", "/hld/message-queues", "/examples/autocomplete"],
    furtherReading: [
      {
        label: "Mercator / Google crawler papers (ideas)",
        href: "https://en.wikipedia.org/wiki/Web_crawler",
      },
    ],
  },
  {
    slug: "notification",
    title: "Design a Notification System",
    source: "Volume 1",
    chapter: 10,
    difficulty: "intermediate",
    minutes: 14,
    tags: ["fan-out", "queues"],
    companies: ["Uber", "Slack", "every consumer app"],
    summary:
      "Volume 1 chapter 10. One service, many channels (push, email, SMS, in-app). Ingest events, template them, honor preferences, rate-limit per user and per channel, and retry with a DLQ.",
    requirements: {
      functional: [
        "Trigger from other services",
        "User preferences and quiet hours",
        "Push / email / SMS / in-app",
        "Delivery receipts",
      ],
      nonFunctional: [
        "Millions/day, bursty",
        "At-least-once with idempotency keys",
        "Channel provider outages isolated",
      ],
    },
    apis: [
      {
        method: "POST",
        path: "/v1/notifications",
        desc: "{ userId, templateId, data, channels? } → { id }",
      },
      { method: "POST", path: "/v1/preferences", desc: "Mute, channel opt-in" },
    ],
    architecture: [
      {
        heading: "Pipeline",
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "p", label: "Producers" },
              { id: "gw", label: "Notif API" },
              { id: "q", label: "Queue", tone: "accent" },
              { id: "w", label: "Workers" },
              { id: "ch", label: "FCM / SES / Twilio" },
            ],
          ],
        },
        bullets: [
          "A gateway authenticates internal callers and enqueues.",
          "Workers expand templates, check preferences, then call a channel adapter.",
          "Each channel has its own queue so a slow SMS provider does not stall push.",
          "Idempotency key = (user, template, dedupe window) to survive retries.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Rate limits go both ways",
        body: [
          "Providers throttle you (Twilio). You also throttle yourself so a buggy loop cannot SMS a user 400 times. Token bucket per (user, channel).",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "One topic, many consumer groups",
        pickWhen: "Same event fans out to several channels",
        cost: "Harder per-channel backpressure",
      },
      { choice: "Queue per channel", pickWhen: "Isolation matters", cost: "More moving parts" },
    ],
    related: ["/hld/message-queues", "/hld/rate-limiting", "/lld/factory"],
    furtherReading: [
      {
        label: "roadmap.sh — notification system",
        href: "https://roadmap.sh/questions/system-design",
      },
    ],
  },
  {
    slug: "news-feed",
    title: "Design a News Feed",
    source: "Volume 1",
    chapter: 11,
    difficulty: "advanced",
    minutes: 18,
    tags: ["fan-out", "facebook"],
    companies: ["Facebook", "Instagram", "X"],
    summary:
      "Volume 1 chapter 11. Fan-out on write vs fan-out on read is the whole plot. Celebrities break write-fanout; quiet users make read-fanout slow. Hybrid is what production does.",
    requirements: {
      functional: [
        "Publish a post",
        "Read a personalized feed",
        "Follow / unfollow",
        "Media in posts",
      ],
      nonFunctional: [
        "Read-heavy",
        "p99 feed load under a few hundred ms",
        "Eventual consistency OK for likes",
      ],
    },
    estimation: [
      { item: "DAU", calc: "300M, 2 posts/day → ~7k writes/s average, tens of k peak" },
      { item: "Feed reads", calc: "A few opens/day/user → 10k–100k reads/s class" },
    ],
    architecture: [
      {
        heading: "Fan-out on write (push)",
        body: [
          "On publish, enqueue a job that inserts the post ID onto each follower's precomputed feed (Redis list / Cassandra). Reads are a cheap lrange. Famous users with 50M followers cannot do this — the write amplification is the product.",
        ],
      },
      {
        heading: "Fan-out on read (pull)",
        body: [
          "On read, fetch IDs from the people you follow, merge-sort, fill bodies from a post store, rank. Always-correct, slower, hammered when a celebrity posts and millions open the app.",
        ],
      },
      {
        heading: "Hybrid",
        body: [
          "Push for normal users. Pull for celebrity IDs at read time. Cache the merged page. This is the answer interviewers want after you show you know both extremes.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "pub", label: "Publish API" },
              { id: "fan", label: "Fan-out workers", tone: "accent" },
              { id: "feed", label: "Feed cache" },
              { id: "read", label: "Feed API" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Ranking",
        body: [
          "First version: time. Later: ML ranker on a candidate set (already-followed posts + some recommendations). Ranking is a separate service; do not stuff it into the write path in a 45-minute interview.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Push",
        pickWhen: "Bounded follower counts",
        cost: "Celebrity writes, storage × followers",
      },
      {
        choice: "Pull",
        pickWhen: "Celebrity graph, or a new product",
        cost: "Read latency, thundering herds",
      },
    ],
    related: ["/examples/chat", "/hld/caching", "/hld/message-queues"],
    furtherReading: [
      { label: "roadmap.sh — social feed", href: "https://roadmap.sh/questions/system-design" },
    ],
  },
  {
    slug: "chat",
    title: "Design a Chat System",
    source: "Volume 1",
    chapter: 12,
    difficulty: "advanced",
    minutes: 18,
    tags: ["websocket", "presence"],
    companies: ["WhatsApp", "Slack", "Messenger"],
    summary:
      "Volume 1 chapter 12. 1:1 and group chat, online presence, and delivery receipts. WebSockets for the online path, a message store that can take writes, and a connection service that knows which box holds each user.",
    requirements: {
      functional: [
        "1:1 and group messages",
        "Online/offline presence",
        "Delivery and read receipts",
        "Unread counts",
        "Media",
      ],
      nonFunctional: [
        "Low latency for online users",
        "Store years of history",
        "Exactly-once *effects* via client-generated IDs",
      ],
    },
    dataModel: [
      { entity: "Message", fields: ["id", "channel_id", "sender_id", "body", "ts", "seq"] },
      { entity: "Channel", fields: ["id", "type (dm|group)", "members"] },
      { entity: "Receipt", fields: ["message_id", "user_id", "delivered_at", "read_at"] },
    ],
    architecture: [
      {
        heading: "Online path",
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "a", label: "Alice WS" },
              { id: "sa", label: "Chat server A" },
              { id: "bus", label: "Pub/sub", tone: "accent" },
              { id: "sb", label: "Chat server B" },
              { id: "b", label: "Bob WS" },
            ],
          ],
        },
        bullets: [
          "Each user has a session on one chat server. A registry (Redis) maps user → server.",
          "Alice's server persists the message, then publishes to the channel. Bob's server is subscribed and pushes over the socket.",
          "If Bob is offline, the message waits in the store; he pulls on reconnect (or a push notification wakes him).",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Group chat fan-out",
        body: [
          "Small groups: store one copy, fan-out to online members via pub/sub. Huge groups (broadcast channels): do not write per-member copies; members pull from a log, like a feed.",
        ],
      },
      {
        heading: "Ordering",
        body: [
          "Per-channel sequence numbers assigned by a single writer (the channel's shard). Client IDs make retries idempotent. Casual 'last-write-wins' is not enough for chat.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Cassandra / wide-column for messages",
        pickWhen: "Huge sequential writes, range by channel+time",
        cost: "Weaker ad-hoc queries",
      },
      {
        choice: "Postgres per shard",
        pickWhen: "Smaller scale, richer queries",
        cost: "Operational sharding",
      },
    ],
    related: ["/hld/websockets", "/examples/nearby-friends", "/hld/message-queues"],
    furtherReading: [
      { label: "roadmap.sh — chat", href: "https://roadmap.sh/questions/system-design" },
    ],
  },
  {
    slug: "autocomplete",
    title: "Design Search Autocomplete",
    source: "Volume 1",
    chapter: 13,
    difficulty: "intermediate",
    minutes: 14,
    tags: ["trie", "search"],
    companies: ["Google", "Amazon", "YouTube"],
    summary:
      "Volume 1 chapter 13. Type-ahead: given a prefix, return the top-k queries. A trie (or a prefix index) in memory at the edge, rebuilt from logs, with caching on hot prefixes.",
    requirements: {
      functional: [
        "Top-k completions for a prefix",
        "Personalization optional",
        "Handle typos at the next layer",
      ],
      nonFunctional: [
        "< 100 ms, often < 50",
        "High QPS on one-letter prefixes",
        "Update popularity daily or faster",
      ],
    },
    architecture: [
      {
        heading: "Offline + online",
        bullets: [
          "Offline: aggregate search logs → (query, frequency). Build a trie or a sorted prefix table. Ship a snapshot to servers.",
          "Online: at each keystroke, look up the prefix, return top-k. Cache results for 'a', 'an', 'and'…",
          "A trie node can keep a small heap of top-k under that prefix so you do not walk the world at query time.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "log", label: "Search logs" },
              { id: "agg", label: "Aggregator" },
              { id: "trie", label: "Trie snapshot", tone: "accent" },
              { id: "api", label: "Autocomplete API" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Scale tricks",
        body: [
          "Do not store every unique query. Cap at a frequency threshold. Shard the trie by first character (or two). Gather 's' on different hosts than 't'. Analytic / Elasticsearch systems work too; a trie is the expected whiteboard answer.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "In-memory trie",
        pickWhen: "Ultra-low latency, bounded dictionary",
        cost: "RAM, rebuilds",
      },
      {
        choice: "Search engine prefix fields",
        pickWhen: "Already have ES, fuzzy needed",
        cost: "Latency, cluster ops",
      },
    ],
    related: ["/hld/caching", "/hld/cdn", "/examples/web-crawler"],
    furtherReading: [
      { label: "roadmap.sh — autocomplete", href: "https://roadmap.sh/questions/system-design" },
    ],
  },
  {
    slug: "youtube",
    title: "Design YouTube",
    source: "Volume 1",
    chapter: 14,
    difficulty: "advanced",
    minutes: 20,
    tags: ["video", "cdn"],
    companies: ["YouTube", "Netflix", "Vimeo"],
    summary:
      "Volume 1 chapter 14. Upload, transcode into many bitrates, store blobs, stream via CDN with adaptive bitrate (HLS/DASH), plus a thin metadata and recommendation plane.",
    requirements: {
      functional: [
        "Upload video",
        "Process into renditions",
        "Play with ABR",
        "Thumbnails, titles, comments",
        "Like / subscribe",
      ],
      nonFunctional: [
        "Petabytes stored",
        "Start playback fast worldwide",
        "Encode is slow and async",
      ],
    },
    estimation: [
      {
        item: "Storage",
        calc: "500 hours uploaded/min class × many renditions is PB–EB with retention. Interview: show you know original + transcodes dominate.",
      },
      { item: "Bandwidth", calc: "Playback is the cost center — hence CDN, not origin." },
    ],
    architecture: [
      {
        heading: "Two planes",
        diagram: {
          kind: "layers",
          layers: [
            {
              title: "Control (cheap)",
              items: ["Upload API", "Metadata SQL", "Comments", "Recommendations"],
            },
            {
              title: "Data (expensive)",
              items: ["Object storage", "Transcoder workers", "CDN POPs", "ABR player"],
            },
          ],
        },
        numbered: [
          "Client uploads to an object store (pre-signed URL), not through the app server.",
          "A queue kicks transcoders. They emit 360p…4K plus a manifest.",
          "Playback: client fetches the manifest from a nearby POP, then segments. ABR picks a bitrate from buffer health.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Hot videos",
        body: [
          "A tiny fraction of objects get almost all views. CDN hit rate is the design. Pre-warm POPs on predicted viral videos. Origin shield protects storage from misses.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "More renditions",
        pickWhen: "Global, mobile-heavy audience",
        cost: "Encode CPU and storage",
      },
      {
        choice: "Pre-signed direct upload",
        pickWhen: "Large files",
        cost: "You need completion callbacks and virus scan workers",
      },
    ],
    related: ["/hld/cdn", "/hld/message-queues", "/examples/object-storage"],
    furtherReading: [
      { label: "roadmap.sh — video streaming", href: "https://roadmap.sh/questions/system-design" },
    ],
  },
  {
    slug: "google-drive",
    title: "Design Google Drive",
    source: "Volume 1",
    chapter: 15,
    difficulty: "advanced",
    minutes: 18,
    tags: ["storage", "sync"],
    companies: ["Google Drive", "Dropbox", "OneDrive"],
    summary:
      "Volume 1 chapter 15. Metadata vs block storage, chunked uploads, dedup, notification of changes, and conflict stories for offline clients. Close cousin of Volume 2's object storage, with a sync client on top.",
    requirements: {
      functional: [
        "Upload / download / folder tree",
        "Share with ACLs",
        "Sync across devices",
        "Version history",
      ],
      nonFunctional: [
        "Huge files, flaky networks",
        "Dedup identical blocks",
        "Strong metadata, eventual file bits OK",
      ],
    },
    architecture: [
      {
        heading: "Split metadata from bytes",
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "c", label: "Client" },
              { id: "m", label: "Metadata service", sub: "SQL", tone: "accent" },
              { id: "b", label: "Block store", sub: "S3-like" },
            ],
          ],
        },
        bullets: [
          "A file is a list of block hashes. Blocks live in object storage. Metadata (tree, ACLs, versions) lives in a strongly consistent DB.",
          "Upload: split into ~4MB chunks, hash, skip chunks the store already has, then commit a new file version.",
          "Clients long-poll or subscribe to a notification service for the namespace they care about.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Conflicts",
        body: [
          "Two offline edits: last-writer-wins is hostile. Keep both versions and surface a conflict, or CRDT for docs (that is Google Docs, a different design — Operational Transform / CRDT — mentioned in the Drive interview as a later layer).",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Smaller chunks",
        pickWhen: "Delta-friendly, bad networks",
        cost: "More metadata, more requests",
      },
      {
        choice: "Whole-file store",
        pickWhen: "Tiny files, simpler",
        cost: "Re-upload everything on one byte change",
      },
    ],
    related: ["/examples/object-storage", "/hld/consistency", "/lld/command"],
    furtherReading: [
      { label: "roadmap.sh — Dropbox / Drive", href: "https://roadmap.sh/questions/system-design" },
    ],
  },
];
