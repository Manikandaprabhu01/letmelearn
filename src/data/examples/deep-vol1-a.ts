import type { DesignExample } from "@/data/types";

export const vol1DeepA: DesignExample[] = [
  {
    slug: "url-shortener",
    title: "Design a URL Shortener",
    source: "Volume 1",
    chapter: 8,
    difficulty: "foundational",
    minutes: 20,
    tags: ["hashing", "base62", "redirect", "cache"],
    companies: ["TinyURL", "Bitly", "t.co", "goo.gl"],
    summary:
      "The classic warm-up: turn a long URL into a short key, and resolve that key back at very high read volume. It looks trivial and contains four real decisions — how to generate the key, how to guarantee uniqueness at scale, which redirect status to use, and how to serve a 100:1 read/write ratio without touching the database.",
    clarifying: [
      {
        q: "How short does the short link need to be?",
        a: "Assume 7 Base62 characters. That is 62⁷ ≈ 3.5 trillion keys — enough for a century at 100 million new links a day, and short enough to fit anywhere.",
      },
      {
        q: "Can users choose custom aliases?",
        a: "Yes, and this matters: custom aliases need a uniqueness check on every keystroke, which is where a Bloom filter earns its place.",
      },
      {
        q: "Do links expire?",
        a: "Support an optional expiry, defaulting to never. Expiry turns a pure key-value read into one that must also check a timestamp, and it gives you a deletion story.",
      },
      {
        q: "Do we need analytics — click counts, referrers, geography?",
        a: "Yes, but asynchronously. Counting clicks on the redirect path would put a write on the hottest read in the system; emit an event instead.",
      },
      {
        q: "What is the read/write ratio?",
        a: "Assume 100:1. Everything about the design follows from that: the write path can be relatively slow and careful, and the read path must be almost free.",
      },
    ],
    requirements: {
      functional: [
        "Shorten a long URL to a unique short key",
        "Redirect a short key to the original URL",
        "Optional custom alias, checked for availability",
        "Optional expiry per link",
        "Click analytics, collected off the redirect path",
      ],
      nonFunctional: [
        "Redirect p99 under 50 ms — this is the product",
        "Short keys are unique, non-guessable enough to not be trivially enumerable",
        "Read availability far more important than write availability",
        "Links are effectively permanent unless an expiry is set",
      ],
    },
    math: [
      {
        label: "Write volume",
        expr: "100 M new links/day ÷ 10⁵",
        result: "≈ 1,000 writes/s",
        note: "Peak ×3 ≈ 3,000/s. Comfortably a single well-indexed database.",
      },
      {
        label: "Read volume",
        expr: "100:1 ratio → 10 B redirects/day ÷ 10⁵",
        result: "≈ 100,000 reads/s",
        note: "Peak ≈ 300,000/s. This is a cache and CDN problem, not a database one.",
      },
      {
        label: "Key space",
        expr: "62⁷",
        result: "≈ 3.5 × 10¹²",
        note: "At 100 M/day that is roughly 95 years of keys. Six characters would give only ~1.5 years.",
      },
      {
        label: "Storage",
        expr: "100 M/day × 500 B × 365 × 10 yr",
        result: "≈ 180 TB",
        note: "×2-3 for indexes and replication. This is where sharding eventually becomes necessary.",
      },
      {
        label: "Cache sizing",
        expr: "hot 20% of a day's links × 500 B, plus a long tail",
        result: "≈ 20–50 GB",
        note: "Small enough that a 95%+ hit ratio is realistic and cheap.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/links",
        desc: "Create — body {longUrl, customAlias?, expiresAt?}, returns the short key",
      },
      {
        method: "GET",
        path: "/{key}",
        desc: "Resolve and redirect — the hot path, cached everywhere",
      },
      {
        method: "GET",
        path: "/v1/links/{key}",
        desc: "Metadata without redirecting (owner, clicks, expiry)",
      },
      {
        method: "GET",
        path: "/v1/links/{alias}/available",
        desc: "Custom alias availability — Bloom filter first",
      },
      { method: "DELETE", path: "/v1/links/{key}", desc: "Owner deletes; key is not reused" },
    ],
    dataModel: [
      {
        entity: "links",
        fields: [
          "key (pk, 7 chars Base62)",
          "long_url (text)",
          "user_id (fk, idx)",
          "created_at",
          "expires_at (nullable, idx)",
          "is_custom (bool)",
        ],
      },
      {
        entity: "click_events",
        fields: [
          "key (idx)",
          "ts",
          "referrer",
          "country",
          "ua_family",
          "→ analytics store, not the primary DB",
        ],
      },
      {
        entity: "counters",
        fields: [
          "range_start (pk)",
          "range_end",
          "assigned_to",
          "→ id ranges handed to app servers",
        ],
      },
    ],
    architecture: [
      {
        heading: "Key generation: three approaches",
        lede: "This is the decision the whole design turns on.",
        diagram: {
          kind: "compare",
          caption: "Counter plus Base62 is the answer to give, with the caveats named.",
          options: [
            {
              title: "Hash the URL, take a prefix",
              sub: "MD5/SHA → first 43 bits → Base62",
              good: [
                "Same URL always yields the same key — natural deduplication",
                "No coordination between servers",
              ],
              bad: [
                "Collisions are certain at scale; every insert needs a check-and-retry",
                "Keys are guessable from the URL if the hash is unsalted",
              ],
              verdict: "Small scale, or when URL deduplication is an explicit requirement.",
            },
            {
              title: "Counter → Base62",
              sub: "a distributed unique id, encoded",
              tone: "ok",
              good: [
                "Zero collisions by construction — no retry logic at all",
                "Fastest write path; a pure encode of a number",
                "Key length grows predictably with volume",
              ],
              bad: [
                "Sequential keys are enumerable — someone can walk your entire link set",
                "Needs a distributed counter (ranges, or Snowflake-style ids)",
              ],
              verdict:
                "The default. Mitigate enumeration by shuffling bits or using a large random range.",
            },
            {
              title: "Random key with a uniqueness check",
              good: ["Non-enumerable", "No coordination for generation"],
              bad: [
                "A database round trip to check uniqueness on every write",
                "Retry rate grows as the key space fills",
              ],
              verdict: "When unguessability is a hard requirement — private or paid links.",
            },
          ],
        },
        code: {
          title: "Counter ranges: coordination once per 10,000 links, not per link",
          lang: "ts",
          source: `// Each app server leases a range from a central counter, then hands out
// ids locally. One round trip per 10,000 links instead of one per link.
class IdRange {
  private next = 0n;
  private end = 0n;

  constructor(private store: RangeStore, private size = 10_000n) {}

  async nextId(): Promise<bigint> {
    if (this.next >= this.end) {
      const { start, end } = await this.store.leaseRange(this.size);  // atomic
      this.next = start;
      this.end = end;
    }
    return this.next++;
  }
}

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase62(n: bigint): string {
  if (n === 0n) return "0";
  let out = "";
  while (n > 0n) {
    out = BASE62[Number(n % 62n)] + out;
    n /= 62n;
  }
  return out;
}

// Sequential ids make sequential keys, which are enumerable. Two fixes:
//   1. Multiply by a large coprime and mask (a reversible scramble), or
//   2. XOR with a secret constant before encoding.
// Both keep uniqueness and destroy the visible ordering.
const KEY = toBase62((id * 2654435761n) & 0xFFFFFFFFFFFn);`,
        },
        callout: {
          kind: "warn",
          text: "Lost ids are fine; duplicate ids are not. A server that crashes with 4,000 unused ids in its lease simply wastes them — at 3.5 trillion keys, that is irrelevant, and it is why range leasing beats a shared counter per write.",
        },
      },
      {
        heading: "The read path, which is the whole product",
        diagram: {
          kind: "sequence",
          caption: "Three layers of cache before the database sees anything.",
          actors: [
            { id: "u", label: "Browser" },
            { id: "cdn", label: "CDN / edge" },
            { id: "svc", label: "Redirect service" },
            { id: "r", label: "Redis" },
            { id: "db", label: "Database" },
          ],
          messages: [
            { from: "u", to: "cdn", label: "GET /aB3xY9z", kind: "call" },
            {
              from: "cdn",
              to: "u",
              label: "301 (cached at edge)",
              kind: "return",
              tone: "ok",
              note: "most hot links never reach the origin",
            },
            { from: "cdn", to: "svc", label: "miss → forward", kind: "call" },
            { from: "svc", to: "r", label: "GET link:aB3xY9z", kind: "call", note: "~0.3 ms" },
            { from: "r", to: "svc", label: "hit → longUrl", kind: "return", tone: "ok" },
            {
              from: "svc",
              to: "db",
              label: "miss → SELECT ... WHERE key = $1",
              kind: "call",
              note: "~5 ms, then populate Redis",
            },
            { from: "svc", to: "u", label: "301 Location: <longUrl>", kind: "return", tone: "ok" },
            {
              from: "svc",
              to: "svc",
              label: "emit click event to the queue",
              kind: "self",
              note: "never a synchronous write on the redirect",
            },
          ],
        },
        table: {
          headers: ["Layer", "Hit ratio", "Latency", "Notes"],
          rows: [
            [
              "CDN / edge",
              "60-80% for viral links",
              "~10 ms",
              "Cache-Control from the link's expiry; purge on delete",
            ],
            ["Redis", "90%+ of the remainder", "~0.5 ms", "Key → long URL, TTL with jitter"],
            ["Database", "the rest", "~5 ms", "Primary key lookup only; no scans on this path"],
          ],
        },
        bullets: [
          "Never write to the database on the redirect path. Click counting goes to a queue, and the counter is updated in batches — otherwise the hottest read in the system carries a write.",
          "Negative caching matters: an attacker requesting random keys will otherwise send every miss to the database. Cache 'not found' for a short TTL, and put a Bloom filter in front.",
          "A deleted or expired link should be evicted from Redis and purged at the CDN. Without the purge, the edge keeps redirecting to a link the owner deleted.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "301 or 302 — this is a real decision",
        table: {
          headers: ["", "301 Moved Permanently", "302 Found"],
          rows: [
            ["Browser caching", "Cached, often indefinitely", "Not cached by default"],
            [
              "Load on your service",
              "Much lower — repeat visits skip you entirely",
              "Every click reaches you",
            ],
            ["Analytics", "You miss repeat clicks from the same browser", "You see every click"],
            ["Changing the destination", "Effectively impossible for cached clients", "Immediate"],
            ["SEO", "Passes link equity to the destination", "Does not"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Bitly and most commercial shorteners use 302, because analytics is the product and destination changes must take effect. If your goal is minimising infrastructure cost and links never change, 301 is dramatically cheaper. State which you chose and why — that is the answer being looked for.",
        },
      },
      {
        heading: "Custom aliases and the Bloom filter",
        body: [
          "A custom alias needs an availability check as the user types. Doing that as a database query per keystroke turns a UI nicety into thousands of queries per second against your primary key index — and an attacker can drive it for free.",
        ],
        code: {
          title: "Bloom filter in front of the existence check",
          lang: "ts",
          source: `// ~10 bits per key: 3 billion keys ≈ 3.5 GB, or shard it per prefix.
const taken = new BloomFilter({ expectedItems: 3_000_000_000, falsePositiveRate: 0.01 });

async function isAvailable(alias: string): Promise<boolean> {
  if (!taken.mightContain(alias)) return true;   // definitively free — no query at all

  // 1% of free aliases land here as a false positive: confirm with one lookup.
  return (await db.links.exists(alias)) === false;
}

// On successful creation, add to the filter. Missing this step would create a
// false NEGATIVE — the one error a Bloom filter otherwise cannot produce —
// and two users could claim the same alias.
await db.links.insert({ key: alias, longUrl, isCustom: true });
taken.add(alias);

// Creation itself still relies on the unique constraint for correctness:
//   INSERT ... ON CONFLICT (key) DO NOTHING  →  0 rows means someone won the race.`,
        },
        bullets: [
          "The Bloom filter is an optimisation, never the source of truth. The unique constraint on the key column is what actually prevents duplicates.",
          "Reserve a denylist of aliases: reserved words, profanity, anything that looks like your own routes (/api, /admin, /login).",
          "Custom aliases and generated keys share one namespace, so a generated key must never collide with an existing custom alias — the unique constraint handles it, and the generator retries.",
        ],
      },
      {
        heading: "Analytics without touching the hot path",
        diagram: {
          kind: "flow",
          caption: "Fire and forget on the redirect; aggregate downstream.",
          rows: [
            [
              { id: "r", label: "Redirect", sub: "emit event, return 301", tone: "accent" },
              { id: "q", label: "Kafka / Kinesis", sub: "click events" },
            ],
            [
              { id: "agg", label: "Stream aggregator", sub: "counts per key per minute" },
              { id: "hll", label: "HyperLogLog", sub: "unique visitors, ~12 KB each" },
              { id: "olap", label: "Analytics store", sub: "referrer, geo, device" },
            ],
          ],
        },
        bullets: [
          "Emitting the event must not block the redirect. Fire into a local buffer, batch to the queue, and accept that a crash loses a few clicks — that is the right trade for the hottest path in the system.",
          "Aggregate counts in the stream layer rather than incrementing a row per click. A viral link would otherwise produce a write hotspot on one row.",
          "Unique-visitor counts use HyperLogLog: a few kilobytes per link for a couple of percent error, merged across shards, instead of storing every visitor id.",
          "Keep raw events for a bounded window and roll up beyond that — per-minute for a day, per-hour for a month, per-day forever.",
        ],
      },
      {
        heading: "Sharding, when it eventually matters",
        bullets: [
          "The key is the natural shard key: lookups are always by key, so hash-sharding on it keeps every read on one shard with no scatter-gather.",
          "Range-sharding by key would create a hotspot, because sequential generation means new links all land in the same range.",
          "Analytics queries ('all links for user X') do not fit that sharding, so keep a separate index keyed by user id — this is a read model, not a query against the main table.",
          "Because reads are cached at 95%+, sharding is driven by storage growth rather than by query volume: roughly 180 TB over ten years is what forces it.",
        ],
        table: {
          headers: ["Concern", "Approach", "Why not the alternative"],
          rows: [
            ["Shard key", "hash(key)", "Range on key hotspots on the newest range"],
            [
              "User's links",
              "Separate index table by user_id",
              "Scatter-gather across every shard otherwise",
            ],
            [
              "Expiry cleanup",
              "Partition by expiry month; drop partitions",
              "A DELETE scan across 180 TB is not viable",
            ],
            [
              "Global uniqueness",
              "Unique constraint within the shard, and the key determines the shard",
              "No cross-shard coordination needed",
            ],
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Counter + Base62",
        pickWhen: "Default — high write volume, collisions unacceptable",
        cost: "Keys are enumerable unless scrambled; needs a range-leasing service",
      },
      {
        choice: "Hash + collision retry",
        pickWhen: "Deduplicating identical URLs is a product requirement",
        cost: "A uniqueness check on every write, and retries as the space fills",
      },
      {
        choice: "301 redirect",
        pickWhen: "Cost matters more than per-click analytics; destinations never change",
        cost: "You lose repeat-visit analytics and the ability to change the target",
      },
      {
        choice: "302 redirect",
        pickWhen: "Analytics is the product; links may be edited or revoked",
        cost: "Every click hits your infrastructure",
      },
      {
        choice: "Bloom filter for alias checks",
        pickWhen: "Custom aliases with live availability feedback",
        cost: "~3.5 GB of memory and a rebuild story; still needs the unique constraint",
      },
    ],
    wrapUp: [
      "The system is a cache with a database behind it: at a 100:1 read ratio, the redirect path should almost never reach storage.",
      "Key generation is the interesting decision, and the honest answer names the enumeration weakness of sequential keys and how to scramble it.",
      "The redirect path must stay write-free — analytics goes through a queue, counts are aggregated downstream.",
      "The first thing to break at scale is storage growth, not query volume, and the key is a clean shard key when that day comes.",
      "With another hour: abuse handling (malware and phishing links), per-user rate limits on creation, and the CDN purge path for deletions.",
    ],
    followUps: [
      {
        q: "Two servers generate the same key. How do you prevent it?",
        a: "By not generating independently. Each server leases a disjoint range of ids from a central counter and encodes locally, so uniqueness is structural rather than checked. If I used random or hash-based keys instead, correctness would rest on the unique constraint plus a retry loop, which works but costs a round trip on every write.",
      },
      {
        q: "Someone is enumerating your links by walking sequential keys. What now?",
        a: "That is the known weakness of counter-based generation. The fix is to keep the counter for uniqueness but destroy the visible ordering — multiply by a large coprime and mask, or XOR with a secret, both of which are reversible and collision-free. For genuinely private links I would go further and use a longer random key, accepting a uniqueness check on write.",
      },
      {
        q: "A link goes viral — 500,000 requests per second to one key. What happens?",
        a: "It should never reach my origin: the CDN caches that redirect and serves nearly all of it. Behind that, one Redis key would become a hotspot, so a small in-process cache on each redirect server collapses the rest. The dangerous case is the moment it expires, so I would use single-flight plus early refresh so one request repopulates and the others wait.",
      },
      {
        q: "How do you delete a link?",
        a: "Soft delete in the database, evict from Redis, and purge at the CDN — the purge is the step people forget, and without it the edge keeps redirecting for as long as the cached TTL. I would not reuse the key afterwards: recycling keys means an old QR code or printed link suddenly points somewhere new, which is a security problem rather than a storage saving.",
      },
      {
        q: "How would you handle malicious links?",
        a: "Check the destination against a reputation service at creation time and asynchronously re-check afterwards, since a benign URL can be repurposed later. On a match, serve an interstitial warning rather than redirecting, and give abuse reports a fast path to disable a key. Because the redirect layer is already cache-heavy, revocation needs the same eviction and purge path as deletion.",
      },
    ],
    related: [
      "/hld/caching",
      "/hld/bloom-filters",
      "/examples/unique-id",
      "/playgrounds/url-shortener",
    ],
    furtherReading: [
      {
        label: "algomaster — design a URL shortener",
        href: "https://algomaster.io/learn/system-design-interviews/design-url-shortener",
      },
    ],
    playground: "url-shortener",
  },

  {
    slug: "unique-id",
    title: "Design a Unique ID Generator",
    source: "Volume 1",
    chapter: 7,
    difficulty: "intermediate",
    minutes: 17,
    tags: ["snowflake", "ids", "distributed", "clocks"],
    companies: ["Twitter", "Instagram", "Discord", "Sony"],
    summary:
      "Generating unique ids across many machines without coordination sounds easy until you need them to be sortable, compact, and correct when a clock moves backwards. Snowflake — timestamp, machine id, sequence — is the standard answer, and the interesting parts are the failure modes it has.",
    clarifying: [
      {
        q: "Must ids be sortable by creation time?",
        a: "Assume yes. Time-sortable ids let you paginate and range-scan by id instead of maintaining a separate timestamp index, which is a large practical win.",
      },
      {
        q: "How many ids per second, and across how many machines?",
        a: "Assume 10,000 per second per machine across a few hundred machines. That sizing is what determines how many bits go to the sequence versus the machine id.",
      },
      {
        q: "Do ids need to be unguessable?",
        a: "Snowflake ids are not: they leak creation time and roughly how many were created. If unguessability matters, use a random id and give up sortability, or encrypt the id for external display.",
      },
      {
        q: "64-bit or larger?",
        a: "64 bits fits a database bigint and a JSON number's safe range is 53 bits — so serialise as a string. 128-bit UUIDs avoid coordination entirely at the cost of size and index locality.",
      },
    ],
    requirements: {
      functional: [
        "Generate ids that are unique across the entire fleet",
        "Ids sort by creation time",
        "Generation is local — no network call per id",
        "Fits in 64 bits",
      ],
      nonFunctional: [
        "At least 10,000 ids/second/node, with headroom for bursts",
        "Sub-microsecond generation — this is on every write path",
        "Correct across restarts, clock adjustments and node replacement",
        "No single point of failure at generation time",
      ],
    },
    math: [
      {
        label: "Snowflake layout",
        expr: "1 sign + 41 timestamp + 10 machine + 12 sequence",
        result: "64 bits",
      },
      {
        label: "Timestamp range",
        expr: "2⁴¹ ms ÷ (1000 × 60 × 60 × 24 × 365)",
        result: "≈ 69 years",
        note: "From a custom epoch, so you get 69 years from your own start date rather than from 1970.",
      },
      {
        label: "Throughput ceiling",
        expr: "2¹² sequence × 1000 ms",
        result: "4.096 M ids/s/node",
        note: "Three orders of magnitude above the requirement — most of the sequence bits are headroom.",
      },
      {
        label: "Machine capacity",
        expr: "2¹⁰",
        result: "1,024 nodes",
        note: "If you need more nodes, take bits from the sequence — the trade is explicit.",
      },
    ],
    apis: [
      {
        method: "LOCAL",
        path: "nextId()",
        desc: "In-process call — no network, no lock contention beyond one atomic",
      },
      {
        method: "GET",
        path: "/v1/ids?count=1000",
        desc: "Optional service for clients that cannot embed the library",
      },
      {
        method: "GET",
        path: "/v1/ids/decode/{id}",
        desc: "Debugging — split an id back into timestamp, machine, sequence",
      },
    ],
    architecture: [
      {
        heading: "The bit layout",
        diagram: {
          kind: "bits",
          caption: "Twitter Snowflake. Every field is a deliberate trade you can rebalance.",
          fields: [
            { label: "sign", bits: 1, note: "always 0 — keeps it positive in signed types" },
            { label: "timestamp (ms since custom epoch)", bits: 41, note: "69 years" },
            { label: "machine id", bits: 10, note: "1,024 nodes" },
            { label: "sequence", bits: 12, note: "4,096 per ms per node" },
          ],
        },
        code: {
          title: "Generation, including the clock cases people miss",
          lang: "ts",
          source: `const EPOCH = 1_735_689_600_000n;   // your own epoch: 2025-01-01

class SnowflakeGenerator {
  private lastMs = -1n;
  private sequence = 0n;

  constructor(private machineId: bigint) {
    if (machineId < 0n || machineId > 1023n) throw new RangeError("machineId 0..1023");
  }

  nextId(): bigint {
    let now = BigInt(Date.now());

    if (now < this.lastMs) {
      // CLOCK WENT BACKWARDS — NTP correction or a VM migration.
      const drift = this.lastMs - now;
      if (drift > 5n) throw new ClockMovedBackwards(drift);  // refuse; do not risk duplicates
      while (BigInt(Date.now()) < this.lastMs) { /* spin out a small drift */ }
      now = this.lastMs;
    }

    if (now === this.lastMs) {
      this.sequence = (this.sequence + 1n) & 4095n;
      if (this.sequence === 0n) {
        // Exhausted this millisecond's 4,096 ids: wait for the next tick.
        while (BigInt(Date.now()) <= this.lastMs) { /* spin */ }
        now = BigInt(Date.now());
      }
    } else {
      this.sequence = 0n;
    }

    this.lastMs = now;
    return ((now - EPOCH) << 22n) | (this.machineId << 12n) | this.sequence;
  }
}

// Decoding is just shifts — useful in incident response.
const ts = Number((id >> 22n) + EPOCH);       // creation time
const machine = Number((id >> 12n) & 1023n);  // which node made it`,
        },
        callout: {
          kind: "warn",
          text: "Refusing to generate on a backwards clock is the correct behaviour, and it surprises people. The alternative — generating anyway — risks duplicate ids, which is a far worse failure than a brief error. Small drifts can be waited out; large ones mean something is wrong with the host.",
        },
      },
      {
        heading: "Assigning machine ids",
        lede: "The part that actually causes incidents.",
        table: {
          headers: ["Approach", "How", "Risk"],
          rows: [
            [
              "Static config",
              "Machine id in an environment variable or config file",
              "Two nodes with the same id generate duplicates silently — the classic outage",
            ],
            [
              "ZooKeeper / etcd sequential node",
              "Node claims an id at startup and holds it with a lease",
              "Coordination dependency at boot; ids must be released cleanly",
            ],
            [
              "Derived from the host",
              "Hash of hostname or private IP into 10 bits",
              "Collisions are possible; needs a startup check",
            ],
            [
              "Kubernetes StatefulSet ordinal",
              "pod-0, pod-1 → stable ordinal as the machine id",
              "Clean and simple; capped by replica count",
            ],
          ],
        },
        bullets: [
          "Whatever the mechanism, verify uniqueness at startup: register the id with a TTL and refuse to start if it is already held. A duplicate machine id is silent until you find two rows with the same primary key.",
          "Hold the id for the process lifetime and release it on shutdown. Recycling too eagerly, combined with a clock skew, can reproduce an id.",
          "Log the machine id at startup. During an incident, decoding an id tells you which node produced it — but only if you can map that number back to a host.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "The alternatives, and when each is right",
        diagram: {
          kind: "compare",
          caption: "Sortability, size and coordination — pick two.",
          options: [
            {
              title: "UUIDv4 (random)",
              good: [
                "Zero coordination; generate anywhere",
                "Unguessable",
                "Universally supported",
              ],
              bad: [
                "128 bits — twice the storage, in every index",
                "Random order destroys B-tree locality: page splits and poor cache behaviour on insert",
                "Not sortable by time",
              ],
              verdict: "When coordination is impossible and index locality does not matter.",
            },
            {
              title: "UUIDv7 / ULID",
              sub: "timestamp prefix + randomness",
              tone: "ok",
              good: [
                "Time-sortable, so index inserts stay sequential",
                "No coordination at all — no machine id to assign",
                "Standardised (UUIDv7) and widely supported now",
              ],
              bad: ["128 bits", "Leaks creation time, like Snowflake"],
              verdict:
                "Often the best modern default — Snowflake's ordering without the machine-id problem.",
            },
            {
              title: "Snowflake (64-bit)",
              good: [
                "Compact: fits a bigint, half the index size of a UUID",
                "Sortable and decodable — you can see when and where it was made",
                "No coordination per id",
              ],
              bad: [
                "Machine id assignment is an operational dependency",
                "Clock skew is a real failure mode",
                "Leaks creation time and volume",
              ],
              verdict: "High volume where id size and index locality matter.",
            },
          ],
        },
        table: {
          headers: ["Scheme", "Bits", "Sortable", "Coordination", "Notes"],
          rows: [
            [
              "Database auto-increment",
              "64",
              "Yes",
              "A single writer",
              "Simple and correct until you shard",
            ],
            [
              "Ticket server (Flickr)",
              "64",
              "Yes",
              "One central service",
              "Single point of failure; run two with odd/even offsets",
            ],
            ["UUIDv4", "128", "No", "None", "Poor index locality"],
            ["UUIDv7 / ULID", "128", "Yes", "None", "The pragmatic modern choice"],
            ["Snowflake", "64", "Yes", "Machine id only", "Compact and decodable"],
            ["Range leasing", "64", "Yes", "Once per N ids", "Great when gaps are acceptable"],
          ],
        },
        callout: {
          kind: "insight",
          text: "The index-locality argument is the one most candidates miss: random UUIDs as a primary key scatter inserts across the whole B-tree, causing page splits and pushing hot pages out of memory. Time-ordered ids append to the right-hand edge instead. On a write-heavy table the difference is large and measurable.",
        },
      },
      {
        heading: "Failure modes",
        steps: [
          {
            title: "Clock moves backwards",
            text: "NTP correction, a VM migration, or a manual change. Generating during that window can repeat an id that was already issued.",
            detail:
              "Handle: wait out drift under a few milliseconds, refuse and alert beyond that. Never generate optimistically.",
          },
          {
            title: "Sequence exhaustion within a millisecond",
            text: "More than 4,096 ids in one millisecond on one node. Correct behaviour is to spin until the next millisecond, which caps throughput rather than producing duplicates.",
            detail:
              "If this happens regularly, rebalance bits — take from the machine id — or add nodes.",
          },
          {
            title: "Duplicate machine ids",
            text: "Two processes configured identically. Silent until a unique-constraint violation or, worse, an overwritten row.",
            detail: "Handle: claim the id with a lease at startup and refuse to boot on conflict.",
          },
          {
            title: "Epoch exhaustion",
            text: "41 bits of milliseconds runs out 69 years after your epoch. Distant, but the fix — changing the layout — invalidates every existing id's ordering.",
            detail:
              "Document the epoch and layout somewhere the next generation of engineers will find it.",
          },
          {
            title: "Ids leaking information",
            text: "A Snowflake id tells anyone the creation time and roughly your volume. For public-facing ids this is a real disclosure.",
            detail:
              "Handle: use a separate opaque external id, or encrypt the internal one for display.",
          },
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Snowflake",
        pickWhen: "High volume, 64-bit ids matter, sortability matters",
        cost: "Machine id assignment and clock skew become operational concerns",
      },
      {
        choice: "UUIDv7 / ULID",
        pickWhen: "You want sortability without coordination",
        cost: "128 bits everywhere, in every index and every foreign key",
      },
      {
        choice: "UUIDv4",
        pickWhen: "Unguessability matters more than index performance",
        cost: "Random insert locations hurt write throughput on large tables",
      },
      {
        choice: "Auto-increment",
        pickWhen: "Single writer, and you are not sharding",
        cost: "Becomes a coordination bottleneck the moment you do shard",
      },
      {
        choice: "Ticket / range service",
        pickWhen: "You want central control and can tolerate gaps",
        cost: "A dependency at startup, and a service to keep highly available",
      },
    ],
    wrapUp: [
      "The design is 64 bits split between time, machine and sequence — and every interesting question is about the machine id and the clock, not the encoding.",
      "Refusing to generate during backwards clock movement is correct: a brief error beats a duplicate primary key.",
      "Index locality is the underrated reason to prefer time-ordered ids over random UUIDs on write-heavy tables.",
      "If ids are public, treat their information leakage as a design property and use a separate opaque id externally.",
      "With another hour: the machine-id lease service, the monitoring for clock drift, and a migration plan for the epoch.",
    ],
    followUps: [
      {
        q: "What happens if the clock jumps backwards?",
        a: "I stop generating rather than risk a duplicate. For drift of a few milliseconds — a normal NTP correction — I spin until the clock catches up, which costs a moment of latency. For anything larger I throw and alert, because that indicates a real problem with the host and generating optimistically could reissue ids that are already in the database.",
      },
      {
        q: "Why not just use UUIDs?",
        a: "Often I would, specifically UUIDv7, which gives time ordering with no coordination at all. What UUIDs cost is size and index behaviour: 128 bits in every index and foreign key, and for v4 a random insert position that causes page splits and evicts hot pages. Snowflake exists because at high write volume those two costs are worth an operational dependency on machine ids.",
      },
      {
        q: "How do you assign machine ids in an autoscaling group?",
        a: "By claiming rather than configuring. On startup the process takes a lease on a free id from etcd or ZooKeeper, holds it while running, and releases it on shutdown; if it cannot claim one, it refuses to start. Static configuration is what causes duplicate-id incidents, because two instances with the same environment variable fail silently until you find two rows sharing a primary key.",
      },
      {
        q: "Can you generate more than 4,096 ids per millisecond on one node?",
        a: "Not with that layout — the generator spins until the next millisecond, which is the correct behaviour because it bounds throughput instead of producing duplicates. If a node genuinely needs more, I would rebalance the bits, taking some from the machine id, or add nodes. Four million ids per second per node is already far beyond most workloads, so hitting it usually means something is looping.",
      },
    ],
    related: [
      "/examples/url-shortener",
      "/hld/sharding",
      "/playgrounds/snowflake",
      "/hld/consistency",
    ],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
    playground: "snowflake",
  },
];
