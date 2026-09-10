import type { Concept } from "@/data/types";

export const lldProblems: Concept[] = [
  {
    slug: "lru-cache",
    title: "Design an LRU Cache",
    subtitle: "O(1) get and put, and the four follow-ups that decide the round.",
    level: "intermediate",
    minutes: 16,
    tags: ["data-structures", "cache", "machine-coding"],
    summary:
      "Hash map plus doubly linked list gets you O(1) get and put in about forty lines. Everyone knows that. The interview is decided by what comes next: making it thread-safe without one global lock, adding TTL, handling the thundering herd on eviction, and knowing when LRU is the wrong policy entirely.",
    keyPoints: [
      "Map key → node for O(1) lookup; doubly linked list for O(1) move-to-front and O(1) eviction from the tail.",
      "Every get is a write — it reorders the list. That is why a naive read lock does not help.",
      "Sentinel head and tail nodes remove every null check from the splice logic.",
      "TTL needs lazy expiry on read plus an active sweeper, or expired entries hold memory forever.",
      "LRU loses to LFU under scan-heavy workloads and to W-TinyLFU almost everywhere; know the failure mode.",
    ],
    sections: [
      {
        heading: "Why this data structure",
        lede: "Two requirements pull in different directions; two structures satisfy both.",
        body: [
          "You need to find an entry by key in constant time, which says hash map. You also need to know which entry is least recently used and remove it in constant time, which says an ordered structure with O(1) removal from one end and O(1) reordering from the middle — a doubly linked list. Neither alone is enough; the map stores pointers into the list.",
          "A singly linked list fails because removing a node from the middle needs its predecessor. An array fails because moving an element to the front is O(n). A heap by timestamp gives O(log n), which is the answer if you get the structure wrong.",
        ],
        diagram: {
          kind: "flow",
          caption: "Map values are list nodes, so a hit can splice in O(1) without walking anything.",
          rows: [
            [
              { id: "map", label: "HashMap<K, Node>", sub: "O(1) lookup", tone: "accent" },
            ],
            [
              { id: "h", label: "HEAD", sub: "sentinel", tone: "warn" },
              { id: "a", label: "k=A", sub: "most recent" },
              { id: "b", label: "k=B" },
              { id: "c", label: "k=C", sub: "next to be evicted" },
              { id: "t", label: "TAIL", sub: "sentinel", tone: "warn" },
            ],
          ],
        },
        table: {
          headers: ["Operation", "Steps", "Cost"],
          rows: [
            ["get(k) hit", "map lookup → unlink node → insert after head", "O(1)"],
            ["get(k) miss", "map lookup", "O(1)"],
            ["put(k,v) existing", "map lookup → update value → move to front", "O(1)"],
            ["put(k,v) new, not full", "new node → insert after head → map put", "O(1)"],
            ["put(k,v) new, full", "unlink tail.prev → map delete → insert new at front", "O(1)"],
            ["Memory", "map entry + node (2 pointers + key + value) per item", "~O(n), 50-80 bytes overhead each"],
          ],
        },
      },
      {
        heading: "The implementation, with the parts people get wrong",
        code: {
          title: "Sentinels remove every null check",
          lang: "ts",
          source: `class Node<K, V> {
  prev!: Node<K, V>;
  next!: Node<K, V>;
  constructor(public key: K, public value: V) {}
}

export class LruCache<K, V> {
  private map = new Map<K, Node<K, V>>();
  private head = new Node<K, V>(null as never, null as never);  // sentinel
  private tail = new Node<K, V>(null as never, null as never);  // sentinel

  constructor(private capacity: number) {
    if (capacity <= 0) throw new RangeError("capacity must be > 0");
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);          // a read mutates the structure
    return node.value;
  }

  put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    if (this.map.size === this.capacity) this.evict();
    const node = new Node(key, value);
    this.map.set(key, node);
    this.insertAfterHead(node);
  }

  private evict(): void {
    const lru = this.tail.prev;      // never the sentinel, because size > 0
    this.unlink(lru);
    this.map.delete(lru.key);
    this.onEvict?.(lru.key, lru.value);   // hook: flush dirty entries, emit metrics
  }

  private moveToFront(n: Node<K, V>) { this.unlink(n); this.insertAfterHead(n); }

  private unlink(n: Node<K, V>) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
  }

  private insertAfterHead(n: Node<K, V>) {
    n.prev = this.head;
    n.next = this.head.next;
    this.head.next.prev = n;
    this.head.next = n;
  }

  onEvict?: (key: K, value: V) => void;
}`,
        },
        bullets: [
          "Sentinels: without them, unlink and insert both need four null checks and the empty-list case is a separate branch. This is the single biggest source of bugs on a whiteboard.",
          "put on an existing key must not evict — check for the existing entry before checking capacity, or a repeated write to a full cache evicts a live entry.",
          "Delete the key from the map when evicting. Forgetting this is the classic leak: the list shrinks and the map does not.",
          "In many languages the standard library already has insertion-ordered maps (JS Map, Java LinkedHashMap with accessOrder=true) — mention it, then implement the explicit version anyway because that is what is being assessed.",
        ],
        callout: {
          kind: "warn",
          text: "get() is a mutation. That single fact drives the entire concurrency discussion below, and candidates who treat reads as read-only produce caches that corrupt their own list under load.",
        },
      },
      {
        heading: "Making it thread-safe without killing throughput",
        lede: "One global lock works and does not scale. Here is the ladder.",
        steps: [
          {
            title: "One mutex around everything",
            text: "Correct, trivially reviewable, and it serialises every read. Fine for a cache behind a single-threaded event loop or with low contention; the first answer to give.",
            detail: "throughput ≈ 1 / (lock acquire + splice) — a few million ops/sec, but no parallel scaling",
          },
          {
            title: "Sharded (striped) cache",
            text: "N independent caches, shard = hash(key) % N, each with its own lock and its own capacity. Contention drops ~N-fold and eviction becomes per-shard, which is a slight accuracy loss for a large throughput gain. This is what most production caches do.",
            detail: "N = 16–256 shards; capacity per shard = total / N, so hot shards can evict earlier than a global LRU would",
          },
          {
            title: "Amortise the reordering",
            text: "Do not splice on every read. Record hits into a small per-thread ring buffer and drain it into the LRU list under the lock only when it fills. Reads become almost lock-free, and the ordering becomes approximate — which is fine, because LRU is a heuristic anyway.",
            detail: "This is roughly what Caffeine (Java) and Ristretto (Go) do; recency accuracy is traded for read throughput",
          },
          {
            title: "Give up strict LRU",
            text: "CLOCK / second-chance approximates LRU with a reference bit and a rotating hand, needing no reordering at all on a hit. Operating-system page caches use this precisely because a read must not take a write lock.",
          },
        ],
        code: {
          title: "Sharding — the practical answer",
          lang: "ts",
          source: `class ShardedLru<K, V> {
  private shards: { lock: Mutex; cache: LruCache<K, V> }[];

  constructor(capacity: number, shardCount = 16) {
    const per = Math.max(1, Math.ceil(capacity / shardCount));
    this.shards = Array.from({ length: shardCount }, () => ({
      lock: new Mutex(), cache: new LruCache<K, V>(per),
    }));
  }

  private shardFor(key: K) {
    return this.shards[(hash(key) >>> 0) % this.shards.length];
  }

  async get(key: K) {
    const s = this.shardFor(key);
    return s.lock.withLock(() => s.cache.get(key));   // contention only within a shard
  }
}`,
        },
      },
      {
        heading: "TTL, and the two ways entries expire",
        body: [
          "Adding expiry looks trivial — store an expiresAt and check it on read — but lazy expiry alone means an entry nobody reads again occupies memory until it happens to be evicted. In a cache sized by entry count that is merely wasteful; in one sized by bytes it is a leak.",
        ],
        code: {
          title: "Lazy expiry on read plus a bounded sweeper",
          lang: "ts",
          source: `get(key: K): V | undefined {
  const node = this.map.get(key);
  if (!node) return undefined;
  if (node.expiresAt <= this.clock.now()) {   // lazy expiry
    this.unlink(node); this.map.delete(key);
    return undefined;                          // treat as a miss
  }
  this.moveToFront(node);
  return node.value;
}

// active sweeper: bounded work per tick so it never stalls the cache
private sweep(budget = 200) {
  let node = this.tail.prev, checked = 0;
  const now = this.clock.now();
  while (node !== this.head && checked++ < budget) {
    const prev = node.prev;
    if (node.expiresAt <= now) { this.unlink(node); this.map.delete(node.key); }
    node = prev;
  }
}`,
        },
        bullets: [
          "Sweeping from the tail is deliberate: the least recently used entries are the most likely to be expired, so a small budget finds most of the garbage.",
          "Use an injected clock. Testing TTL with real sleeps produces slow, flaky tests.",
          "Add jitter to TTLs (±10%) so a batch of entries written together does not all expire in the same second and stampede the origin.",
          "On expiry of a hot key, single-flight the refill: one request recomputes, the rest wait on the same promise. Without this, one expiry becomes a thousand database queries.",
        ],
        callout: {
          kind: "insight",
          text: "TTL and LRU answer different questions. LRU asks 'what can I afford to forget?'; TTL asks 'what am I no longer allowed to believe?'. A cache with correctness requirements needs both, and TTL is the one that bounds staleness.",
        },
      },
      {
        heading: "When LRU is the wrong policy",
        diagram: {
          kind: "compare",
          caption: "Recency, frequency, and the hybrid that usually wins.",
          options: [
            {
              title: "LRU — recency",
              good: ["O(1), simple, well understood", "Great for workloads with temporal locality", "Adapts instantly to a shifting working set"],
              bad: [
                "A single scan of cold data evicts the entire hot set",
                "One-hit-wonder keys are admitted at full cost",
              ],
              verdict: "Session data, request-scoped reuse, most application caches.",
            },
            {
              title: "LFU — frequency",
              good: ["Immune to scans", "Keeps genuinely hot keys through bursts"],
              bad: [
                "Yesterday's hot key stays resident forever without ageing",
                "Counters cost memory; O(1) LFU is fiddly to implement",
              ],
              verdict: "Stable, skewed popularity: reference data, top-N lookups.",
            },
            {
              title: "W-TinyLFU — hybrid",
              tone: "ok",
              good: [
                "Frequency sketch decides admission, LRU segments decide eviction",
                "Scan-resistant, near-optimal hit ratio for a few bits per key",
              ],
              bad: ["More moving parts to explain", "Approximate counts, so pathological cases exist"],
              verdict: "What Caffeine and Ristretto ship; the right answer to 'can you do better than LRU?'",
            },
          ],
        },
        table: {
          headers: ["Workload", "LRU behaviour", "Better choice"],
          rows: [
            ["Full-table scan through a warm cache", "Evicts everything hot; hit rate falls off a cliff", "LFU admission, or a scan-resistant segment (ARC, SLRU)"],
            ["Zipfian popularity, stable over days", "Fine, but wastes space on one-hit keys", "TinyLFU admission filter in front of LRU"],
            ["Strict working set, changes hourly", "Ideal", "Keep LRU"],
            ["Large values, variable size", "Entry-count capacity misrepresents memory", "Weigh entries by bytes; evict by weight"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you make it thread-safe?",
            a: "I would start with a single mutex and say why: get() mutates the list, so a read/write lock buys nothing. Then I would shard by key hash — sixteen or so independent caches, each with its own lock and capacity — which removes most contention for a small loss in global LRU accuracy. If reads still dominate, I would amortise the reordering through a per-thread buffer drained in batches, which is what Caffeine does.",
          },
          {
            q: "Distributed LRU across ten app servers?",
            a: "Local LRU per server plus a shared tier — Redis or memcached — reached through consistent hashing so adding a node moves only 1/n of the keys. Local caches are then a hot layer with short TTLs, and I accept that they can be inconsistent with each other. If a write must be visible everywhere immediately, I invalidate through a pub/sub channel and treat the local layer as best-effort.",
          },
          {
            q: "What breaks first at scale?",
            a: "Usually memory accounting: a capacity of 100k entries says nothing about bytes when values vary in size, so the process OOMs long before the count is reached. I would weigh entries and evict by weight. The second thing is stampede on expiry of a hot key, which single-flight plus TTL jitter fixes.",
          },
          {
            q: "Implement it with only a hash map?",
            a: "You can, using an ordered map with access-order semantics — LinkedHashMap in Java or JS Map plus delete-then-set on hit, which moves the key to the end. That is O(1) amortised and is genuinely what I would use in production. I would still be able to write the explicit list version, because the point of the question is whether I understand why both structures are needed.",
          },
          {
            q: "What metrics would you export?",
            a: "Hit ratio (the number everyone asks for), eviction rate, average and p99 load latency on a miss, and current size in both entries and bytes. Hit ratio alone is misleading — a cache with a 99% hit rate that evicts a million entries a minute is thrashing, and the eviction rate is what shows it.",
          },
        ],
      },
    ],
    related: ["/hld/caching", "/playgrounds/lru-cache", "/lld/proxy", "/hld/consistent-hashing"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
    playground: "lru-cache",
  },

  {
    slug: "rate-limiter",
    title: "Design a Rate Limiter (LLD)",
    subtitle: "Four algorithms, one interface, and the distributed problem underneath.",
    level: "intermediate",
    minutes: 18,
    tags: ["machine-coding", "concurrency", "resilience"],
    summary:
      "Rate limiting is the interview question that spans both rounds: the LLD half is a clean strategy interface with four implementations you can write from memory, and the HLD half is what happens when the counter has to be shared by fifty servers without becoming a bottleneck.",
    keyPoints: [
      "Token bucket allows controlled bursts; leaky bucket smooths output; fixed window is cheapest and has a 2x edge flaw; sliding window log is exact and expensive.",
      "The interface is allow(key, now) → decision with remaining and retryAfter — never a bare boolean.",
      "State is per key. Memory is the real constraint: bound it, and expire idle keys.",
      "Distributed limiting needs atomic read-modify-write; Redis with a Lua script is the standard answer.",
      "Always return 429 with Retry-After and X-RateLimit-* headers — a limiter clients cannot cooperate with causes retry storms.",
    ],
    prerequisites: ["/lld/strategy"],
    sections: [
      {
        heading: "The interface first",
        code: {
          title: "One decision object, not a boolean",
          lang: "ts",
          source: `type Decision = {
  ok: boolean;
  remaining: number;      // for X-RateLimit-Remaining
  limit: number;          // for X-RateLimit-Limit
  resetAtMs: number;      // for X-RateLimit-Reset
  retryAfterMs?: number;  // only when !ok
};

interface LimiterStrategy {
  allow(key: string, now: number, cost?: number): Decision;
}

// cost lets one expensive endpoint consume 10 tokens while a cheap one
// consumes 1 — the same limiter then covers "requests" and "work".`,
        },
        callout: {
          kind: "insight",
          text: "Returning remaining and retryAfter is not decoration. A client that knows when to come back backs off cleanly; a client that only sees 'denied' retries immediately and turns your limiter into a load amplifier.",
        },
      },
      {
        heading: "Token bucket",
        lede: "The default. Allows bursts up to capacity, then settles to the refill rate.",
        body: [
          "Tokens accumulate at a fixed rate up to a maximum. A request takes one (or several) tokens, and is denied if there are not enough. The bucket's capacity is the burst you tolerate; the refill rate is the sustained throughput you allow.",
          "The implementation detail that matters: do not run a timer to add tokens. Compute them lazily from elapsed time on each call. A timer per key does not scale past a few thousand keys.",
        ],
        code: {
          title: "Lazy refill — no timers, O(1) memory per key",
          lang: "ts",
          source: `class TokenBucket implements LimiterStrategy {
  private state = new Map<string, { tokens: number; lastMs: number }>();

  constructor(private capacity: number, private refillPerSec: number) {}

  allow(key: string, now: number, cost = 1): Decision {
    const s = this.state.get(key) ?? { tokens: this.capacity, lastMs: now };

    // lazily add the tokens that "would have" accrued since the last call
    const elapsedSec = Math.max(0, now - s.lastMs) / 1000;
    s.tokens = Math.min(this.capacity, s.tokens + elapsedSec * this.refillPerSec);
    s.lastMs = now;

    if (s.tokens >= cost) {
      s.tokens -= cost;
      this.state.set(key, s);
      return { ok: true, remaining: Math.floor(s.tokens), limit: this.capacity,
               resetAtMs: now + ((this.capacity - s.tokens) / this.refillPerSec) * 1000 };
    }

    this.state.set(key, s);
    const deficit = cost - s.tokens;
    return { ok: false, remaining: 0, limit: this.capacity,
             resetAtMs: now + (deficit / this.refillPerSec) * 1000,
             retryAfterMs: Math.ceil((deficit / this.refillPerSec) * 1000) };
  }
}`,
        },
        bullets: [
          "capacity = burst tolerance. A capacity of 100 with a refill of 10/s lets a client fire 100 requests instantly, then 10/s forever.",
          "Clamping to capacity is essential — without it, an idle client accrues unlimited tokens and can flood after an hour of silence.",
          "Memory is one small record per key. Expire idle keys (LRU or TTL) or the map grows with your user base times every distinct limit dimension.",
        ],
      },
      {
        heading: "The other three, and their exact failure modes",
        diagram: {
          kind: "compare",
          caption: "Pick by the shape of traffic you want to allow, not by which is 'best'.",
          options: [
            {
              title: "Fixed window counter",
              sub: "count per aligned minute",
              good: ["Cheapest: one integer per key", "Trivial in Redis: INCR + EXPIRE", "Easy to explain to users"],
              bad: [
                "Boundary flaw: 100 at 11:59:59 plus 100 at 12:00:00 is 200 in one second",
                "Synchronised clients hammer the top of each window",
              ],
              verdict: "Coarse protection where 2x overshoot for one second is acceptable.",
            },
            {
              title: "Sliding window log",
              sub: "timestamps in a sorted set",
              good: ["Exact — no boundary artefact at all", "Naturally supports 'N in any rolling T'"],
              bad: [
                "Memory is O(limit) per key: 20k timestamps for a 20k/min limit",
                "Every call trims the set; expensive at high limits",
              ],
              verdict: "Low limits where exactness matters: login attempts, OTP sends.",
            },
            {
              title: "Sliding window counter",
              sub: "weighted blend of two windows",
              tone: "ok",
              good: [
                "O(1) memory, smooths the boundary flaw",
                "Within a few percent of exact in practice",
              ],
              bad: ["Approximate — assumes traffic is uniform inside the previous window"],
              verdict: "The practical default for API gateways at scale.",
            },
          ],
        },
        code: [
          {
            title: "Sliding window counter — the estimate that removes the boundary flaw",
            lang: "ts",
            source: `allow(key: string, now: number): Decision {
  const windowMs = this.windowMs;
  const currentStart = Math.floor(now / windowMs) * windowMs;
  const c = this.counts.get(key) ?? { start: currentStart, current: 0, previous: 0 };

  if (c.start !== currentStart) {
    // roll: this window's count becomes "previous"
    c.previous = c.start === currentStart - windowMs ? c.current : 0;
    c.current = 0;
    c.start = currentStart;
  }

  // how much of the previous window still overlaps the trailing window
  const overlap = 1 - (now - currentStart) / windowMs;
  const estimate = c.previous * overlap + c.current;

  if (estimate >= this.limit) {
    return { ok: false, remaining: 0, limit: this.limit,
             resetAtMs: currentStart + windowMs,
             retryAfterMs: currentStart + windowMs - now };
  }
  c.current++;
  this.counts.set(key, c);
  return { ok: true, remaining: Math.floor(this.limit - estimate - 1),
           limit: this.limit, resetAtMs: currentStart + windowMs };
}`,
          },
          {
            title: "Leaky bucket — when you need a smooth output rate",
            lang: "ts",
            source: `// Token bucket limits input bursts; leaky bucket guarantees output pacing.
// Requests enter a bounded queue and drain at a constant rate.
class LeakyBucket {
  private queue: Array<{ resolve: () => void }> = [];
  constructor(private capacity: number, private drainPerSec: number) {
    setInterval(() => this.queue.shift()?.resolve(), 1000 / drainPerSec);
  }
  async admit(): Promise<void> {
    if (this.queue.length >= this.capacity) throw new TooManyRequests();
    return new Promise((resolve) => this.queue.push({ resolve }));
  }
}
// Use it when the *downstream* cannot absorb bursts — a legacy API,
// an SMS provider, a printer. The cost is added latency by design.`,
          },
        ],
        table: {
          headers: ["Algorithm", "Memory per key", "Burst behaviour", "Exact?"],
          rows: [
            ["Token bucket", "2 numbers", "Allows a burst up to capacity", "Yes, for its own definition"],
            ["Leaky bucket", "Queue up to capacity", "Absorbs bursts, emits smoothly", "Yes, output rate is guaranteed"],
            ["Fixed window", "1 counter", "Up to 2x limit across a boundary", "No"],
            ["Sliding log", "O(limit) timestamps", "None — hard cap in any window", "Yes"],
            ["Sliding counter", "3 numbers", "Small overshoot, no cliff", "Approximate (±small %)"],
          ],
        },
      },
      {
        heading: "Distributed: where the real problem is",
        lede: "Fifty app servers, one logical limit.",
        body: [
          "Per-instance limits are simple and wrong: with 50 servers and a limit of 100/min each, a client that load-balances gets 5000/min. Sharing the counter means every request does a network round trip to a shared store, and the read-modify-write must be atomic or two servers will both see 99 and both allow.",
        ],
        code: {
          title: "Redis + Lua — atomic because the script runs as one operation",
          lang: "lua",
          source: `-- KEYS[1] = bucket key, ARGV = capacity, refillPerSec, nowMs, cost
local capacity = tonumber(ARGV[1])
local refill   = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local cost     = tonumber(ARGV[4])

local state  = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1]) or capacity
local ts     = tonumber(state[2]) or now

tokens = math.min(capacity, tokens + ((now - ts) / 1000) * refill)

local allowed = tokens >= cost
if allowed then tokens = tokens - cost end

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity / refill) * 1000 * 2))  -- idle keys die

return { allowed and 1 or 0, math.floor(tokens) }`,
        },
        diagram: {
          kind: "sequence",
          caption: "One round trip per request — and what to do when Redis is down.",
          actors: [
            { id: "c", label: "Client" },
            { id: "gw", label: "Gateway", sub: "50 instances" },
            { id: "r", label: "Redis", sub: "shared counters" },
            { id: "svc", label: "Service" },
          ],
          messages: [
            { from: "c", to: "gw", label: "GET /v1/search", kind: "call" },
            { from: "gw", to: "r", label: "EVALSHA rate_limit(key, now)", kind: "call", note: "atomic; ~0.3ms same-AZ" },
            { from: "r", to: "gw", label: "[allowed, remaining]", kind: "return" },
            { from: "gw", to: "svc", label: "forward (allowed)", kind: "call", tone: "ok" },
            { from: "gw", to: "c", label: "429 + Retry-After + X-RateLimit-*", kind: "return", tone: "warn", note: "when denied" },
          ],
        },
        bullets: [
          "Latency budget: one extra round trip on every request. Same-AZ Redis is ~0.3ms, which is usually acceptable at a gateway; cross-region is not.",
          "Failure policy is a product decision. Fail-open keeps the service available and lets abuse through; fail-closed protects the backend and turns a Redis blip into an outage. Most gateways fail open for read APIs and closed for expensive writes.",
          "Reduce round trips with a local pre-filter: keep an approximate local bucket and only consult Redis when a key is near its limit. Hot keys stay accurate, cold keys cost nothing.",
          "Shard by key so a single hot key does not make one Redis node the bottleneck; a celebrity tenant will find that node.",
          "Clock skew across gateways affects window alignment. Use the Redis server's own time inside the script rather than each gateway's clock.",
        ],
        callout: {
          kind: "warn",
          text: "A limiter that returns 429 with no Retry-After trains every client to retry immediately. Under load that converts a partial overload into a synchronised stampede — the limiter becomes the amplifier it was meant to prevent.",
        },
      },
      {
        heading: "Design choices that come up every time",
        table: {
          headers: ["Question", "Options", "Reasonable default"],
          rows: [
            [
              "Limit by what?",
              "API key, user id, IP, tenant, endpoint, or a tuple",
              "API key for authenticated traffic, IP for anonymous — and say that IP is shared by NAT and proxies",
            ],
            [
              "Where does it run?",
              "Client, gateway/edge, service middleware, or the datastore",
              "Gateway, so backends are protected uniformly; a second cheap limit at the edge for volumetric abuse",
            ],
            [
              "Multiple limits at once?",
              "Per second (burst), per minute, per day (quota)",
              "Evaluate all, deny on the first failure, and report the most restrictive in the headers",
            ],
            [
              "How to communicate?",
              "429 + Retry-After, headers, or silent drop",
              "429 with Retry-After and X-RateLimit-Limit/Remaining/Reset",
            ],
            [
              "Who is exempt?",
              "Internal services, health checks, admin",
              "Explicit allowlist evaluated before the limiter, and monitored so it cannot become a bypass",
            ],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Which algorithm would you actually pick?",
            a: "Token bucket for API limits, because clients legitimately burst and it expresses 'sustained rate plus burst allowance' in two numbers. Sliding window counter if I need a strict per-minute number with no boundary cliff and O(1) memory. Sliding window log only for low-limit security controls like login attempts, where exactness matters and the volume is tiny.",
          },
          {
            q: "How would you rate limit at 1M requests per second?",
            a: "Do not put a round trip on every request. Push a cheap volumetric limit to the edge, keep an approximate local bucket per gateway instance, and only synchronise with the shared store for keys close to their limit — or synchronise periodically, distributing a share of the global budget to each instance. That trades exactness for throughput, which at that volume is the correct trade.",
          },
          {
            q: "A user complains they were limited unfairly. How do you debug it?",
            a: "I would want the limiter to emit, per decision, the key, the algorithm, the limit that fired, and the remaining count — sampled, not for every request. Without that, 'I got a 429' is unfalsifiable. I would also check whether the key was an IP behind NAT, which is the most common cause of a genuinely unfair limit.",
          },
          {
            q: "Where do you store the state?",
            a: "In-memory when the limit is per instance or the traffic is sticky-routed. Redis for a shared limit, with a Lua script for atomicity and a TTL so idle keys evict themselves. I would avoid a relational database — the write rate is the whole traffic volume, and row locks on hot keys will collapse before the limit does.",
          },
        ],
      },
    ],
    related: ["/hld/rate-limiting", "/examples/rate-limiter", "/lld/strategy", "/playgrounds/rate-limiter"],
    furtherReading: [
      {
        label: "Rate limiter playground",
        href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html",
      },
    ],
    playground: "rate-limiter",
  },
];
