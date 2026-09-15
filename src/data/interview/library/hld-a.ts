// Imported from the Interview Prep Console (lib/data-hld-a.js).
import type { HldAnswer } from "../types";

export const hldA: HldAnswer[] = [
  {
    id: "hld-playbook",
    t: "How to run a system design round (the 50-minute script)",
    src: ["L1", "L2", "L4", "L6", "S2"],
    r: 2,
    playbook: true,
    stmt: "Every candidate report, at every company, describes the same shape: clarify, requirements, high-level boxes, deep dive on one or two components, data model, trade-offs, then their follow-ups. Interviewers score the ordering as much as the content — candidates who start drawing boxes in minute two are the ones who get Neutral.",
    ask: [
      {
        q: "Who uses this and for what — the one-line product statement?",
        a: "Forces the interviewer to name the core use case, which sets scope for everything else.",
      },
      {
        q: "Which flows are in scope today, and which do we skip?",
        a: "Pick 3–4 flows. Say out loud: 'I will design posting, feed read, and notification; I will skip search and ads unless you want them.'",
      },
      {
        q: "Scale: DAU, requests per second, read:write ratio, payload size, retention?",
        a: "Get numbers or propose them: '10M DAU, 100:1 read-heavy, 2 KB payloads, 1 year retention — reasonable?'",
      },
      {
        q: "Latency and availability targets?",
        a: "p99 targets per flow, plus whether reads may be stale. This single answer decides caching, replication and consistency.",
      },
      {
        q: "Consistency: is eventual consistency acceptable on reads?",
        a: "Almost always yes for feeds/timelines, no for money, quotas and auth.",
      },
      {
        q: "Multi-tenant? Multi-region? Compliance (data residency, PII)?",
        a: "For any multi-tenant SaaS product, tenant isolation and noisy-neighbour control are fair game and score well when raised unprompted.",
      },
    ],
    fr: [
      "0–5 min: clarify (the questions above) and write the numbers on the board.",
      "5–10 min: functional requirements as API-shaped bullets, then non-functional as measurable targets.",
      "10–15 min: back-of-envelope — QPS, storage/year, bandwidth, cache size. Round aggressively and say your assumptions.",
      "15–25 min: the box diagram — client, edge, services, stores, async paths. Draw the write path and the read path separately.",
      "25–35 min: data model and the one or two components they care about (the interviewer will point).",
      "35–45 min: bottlenecks, scaling, failure modes, and the trade-offs you deliberately took.",
      "45+ min: their follow-ups; leave space for them.",
    ],
    nfr: [
      "State a trade-off every time you choose something: 'Cassandra here because writes are append-only and I can live with eventual consistency; Postgres for billing because I need transactions.'",
      "Draw the async path explicitly — a queue between write and fan-out is the single most reliable way to show seniority.",
      "Name numbers, not adjectives: '~12K writes/sec' beats 'high write volume'.",
      "Cover the boring reliability items briefly: idempotency, retries with backoff and jitter, dead-letter queues, backpressure, rate limiting, circuit breakers.",
      "Finish with observability: what you log, what you page on, and the two or three SLOs.",
    ],
    scale:
      "Rehearse this arithmetic so it takes 60 seconds: 1M DAU × 10 actions/day ≈ 10M writes/day ≈ 116 writes/sec average, ~3–5× at peak. 10M × 2 KB ≈ 20 GB/day ≈ 7 TB/year before replication. 86,400 seconds in a day; 1M seconds ≈ 11.6 days. Cache the hot 20% of keys; a 100 GB working set fits comfortably in a small Redis cluster.",
    arch: "Standard skeleton to adapt (draw it left to right):\n\n  Client ─▶ CDN/edge ─▶ API Gateway ─▶ Service(s) ─▶ Cache\n                            │                  │        │\n                            │                  ▼        ▼\n                            │              Primary DB  Replicas\n                            ▼\n                      Queue / Kafka ─▶ Async workers ─▶ Stores\n                                              │\n                                              ▼\n                                     Notification / Search / Analytics",
    svc: [
      {
        n: "Edge (CDN + gateway)",
        d: "TLS, auth, rate limiting, request routing, request id injection.",
      },
      {
        n: "Write service",
        d: "Validates, persists, emits an event. Keep it thin and synchronous only for what the user must see.",
      },
      {
        n: "Async workers",
        d: "Fan-out, notifications, indexing, analytics — anything the user does not wait for.",
      },
      {
        n: "Read service",
        d: "Serves from cache, falls back to DB/replicas. Usually a separate deployment because it scales differently.",
      },
      {
        n: "Stores",
        d: "OLTP database, cache, object store for blobs, search index, and a warehouse for analytics.",
      },
    ],
    seq: "Write path                         Read path\n─────────────────────────────      ────────────────────────────\nClient → API: POST /resource       Client → API: GET /resource\nAPI → DB: insert (txn)             API → Cache: get key\nAPI → Queue: publish event         Cache → API: hit (95%)\nAPI → Client: 201 Created          API → DB: on miss, then fill\n   Queue → Worker: consume         API → Client: 200 OK\n   Worker → Store/Index: update",
    db: {
      tables: [
        {
          n: "Rules of thumb",
          cols: "—",
          notes:
            "One table per aggregate; foreign keys inside a service, ids across services. Always: created_at, updated_at, tenant_id (multi-tenant), and a version column where concurrent edits are possible.",
        },
        {
          n: "Indexing",
          cols: "—",
          notes:
            "Index every column you filter or sort on in a hot query; composite index column order follows the query's equality-then-range pattern. Mention the write cost of each index.",
        },
        {
          n: "Partitioning",
          cols: "—",
          notes:
            "Time-series data → partition by time and drop old partitions instead of DELETE. Tenant data → partition or shard by tenant_id.",
        },
      ],
      sql: "Choose SQL (Postgres/MySQL) when: you need multi-row transactions and foreign-key integrity (orders, payments, inventory, billing); the query shape will change (ad-hoc joins, reporting); the data volume fits a primary plus read replicas (comfortably into low single-digit TB); or you want strong read-after-write. With partitioning, JSONB and replicas, Postgres handles far more than candidates assume — saying that shows judgment rather than reflex.",
      nosql:
        "Choose NoSQL when the access pattern is fixed and the volume is large: Cassandra/DynamoDB for append-heavy, partition-keyed workloads (messages, feeds, events, time series) where you can model one table per query and accept eventual consistency; Redis for ephemeral hot state (counters, sessions, rate limits, leaderboards); Elasticsearch for text search and aggregations; object storage (S3) for blobs — never store files in the database.",
      verdict:
        "The strongest answer is usually polyglot and explicit: 'Postgres for the transactional core, Cassandra for the high-volume append stream, Redis for hot reads, S3 for blobs, Elasticsearch for search' — with one sentence of justification each. What loses points is picking a store without naming the access pattern it serves.",
    },
    fu: [
      {
        q: "They keep changing the requirements mid-round. Why?",
        a: "Two Lead reports mention exactly this ('scope changed mid-interview'). It is deliberate: they want to see whether your architecture absorbs change and whether you re-derive rather than defend. Respond with 'that changes X — here is what I would swap', not by protecting the first drawing.",
      },
      {
        q: "How much detail do they expect on the data model?",
        a: "Concrete tables with column names and the index you would add. Multiple reports specifically say 'database design and query writing', so be ready to write an actual SQL statement on the board.",
      },
      {
        q: "What if I do not know a technology they name?",
        a: "Say so, then reason from properties: 'I have not used Vert.x, but if it is an event-loop toolkit the concern is blocking calls on the loop thread.' One candidate reported being sunk by pretending; nobody is marked down for honest reasoning.",
      },
    ],
  },
  {
    id: "hld-ratelimiter",
    t: "Design a distributed API rate limiter",
    src: ["L2", "L3", "L6", "S2", "S4", "S10"],
    r: 2,
    star: true,
    stmt: "The most asked design question of all — it appears in round 1 or round 2 at almost every company, sometimes with the scope deliberately changed mid-interview. For any API product the real context is per-account, per-endpoint quotas.",
    ask: [
      {
        q: "What do we limit on — API key, account, user, IP, or (account, endpoint)?",
        a: "Assume (account_id, endpoint_group), with IP limits as a separate coarse layer for unauthenticated traffic.",
      },
      {
        q: "What are the limits and do they differ by plan?",
        a: "Yes: free 100 req/min, pro 1,000, enterprise custom. Limits come from a config service and can change at runtime.",
      },
      {
        q: "Exact or approximate enforcement?",
        a: "Approximate within a small percentage is fine for protection; exact matters only when we publish the number contractually. Ask which they want — the answer changes the design.",
      },
      {
        q: "What happens on rejection — 429, queue, or degrade?",
        a: "429 with Retry-After and X-RateLimit-* headers. Queueing only for internal batch clients.",
      },
      {
        q: "Scale: how many services, requests/sec, and distinct keys?",
        a: "Say 50K req/s across 200 API pods, ~500K active keys — enough that per-pod local state is insufficient alone.",
      },
      {
        q: "Must limits be enforced at the edge or inside each service?",
        a: "At the gateway for the global quota, with a cheap local pre-filter in each pod to shed obvious abuse before a network hop.",
      },
    ],
    fr: [
      "Allow or reject each request against the quota for its key",
      "Per-plan, per-endpoint limits, hot-reloadable",
      "Return remaining quota and reset time in response headers",
      "Multiple algorithms (token bucket default, sliding window where exactness matters)",
      "Support burst allowances and cost-weighted endpoints (a bulk export costs 10 permits)",
      "Expose metrics: throttle rate per tenant, top offenders",
    ],
    nfr: [
      "Under 1 ms p99 added latency — it sits on every request",
      "Fail open: if the limiter store is down, allow traffic and alert",
      "Horizontally scalable with no single hot node",
      "Memory bounded: keys expire with their window",
      "Consistent enough that a tenant cannot get 10× their quota by spreading traffic across pods",
    ],
    scale:
      "50K req/s × 1 Redis round trip = 50K ops/s — a single Redis node handles ~100K ops/s, so one node works but is a SPOF; shard by key across 3–6 nodes with replicas. State per key: ~50 bytes (tokens + timestamp). 500K keys ≈ 25 MB — trivial. The real constraint is network round trips, not storage, which is why the local pre-filter matters.",
    arch: "                    ┌──────────────────────────┐\n  Client ──▶ CDN ──▶  │  API Gateway / Envoy     │\n                      │  ┌────────────────────┐  │\n                      │  │ local token bucket │  │ ← L1: per-pod, no network\n                      │  └─────────┬──────────┘  │\n                      └────────────┼─────────────┘\n                                   │ miss / borderline\n                                   ▼\n                       ┌────────────────────────┐\n                       │ Redis cluster (Lua)    │ ← L2: global truth\n                       │ key: tenant:endpoint:w │\n                       └───────────┬────────────┘\n                                   │ async\n                                   ▼\n              Config service ─▶ limits (plan, endpoint)\n                                   │\n                                   ▼\n                   Metrics / alerts (throttle rate by tenant)",
    svc: [
      {
        n: "Edge pre-filter (L1)",
        d: "An in-process token bucket per pod sized at limit/N (N = pod count). Rejects blatant abuse with zero network cost and absorbs Redis outages. Approximate by design.",
      },
      {
        n: "Distributed limiter (L2)",
        d: "Redis with a Lua script performing read-refill-compare-write atomically in one round trip. Keyed tenant:endpoint:window. This is the authority.",
      },
      {
        n: "Config service",
        d: "Stores plan → limit mappings, pushed to gateways with a short TTL cache. Lets support raise a customer's limit without a deploy.",
      },
      {
        n: "Metrics pipeline",
        d: "Emits throttled/allowed counters per tenant and endpoint to Prometheus; alerts when a tenant is throttled for more than X minutes (usually a customer problem worth a call).",
      },
      {
        n: "Admin API",
        d: "Temporary limit overrides, allowlists for internal services, and a kill switch that disables limiting globally.",
      },
    ],
    seq: "Client → Gateway : POST /api/v2/tickets  (X-Api-Key)\nGateway → Gateway: resolve tenant + endpoint group\nGateway → Local  : tryAcquire(key)        [~200 ns]\n  alt local bucket empty\n    Gateway → Client: 429 + Retry-After\n  else\n    Gateway → Redis : EVAL rate_limit.lua key limit window now\n    Redis  → Gateway: {allowed, remaining, reset}\n    alt allowed\n      Gateway → Service: forward request\n      Service → Gateway: 200\n      Gateway → Client : 200 + X-RateLimit-Remaining\n    else\n      Gateway → Client : 429 + Retry-After: 12\n  alt Redis timeout (> 5 ms)\n    Gateway → Client : forward anyway (fail open) + emit alert",
    db: {
      tables: [
        {
          n: "Redis key: rl:{tenant}:{endpoint}:{window}",
          cols: "HASH {tokens, last_refill_ms} or STRING counter",
          notes:
            "TTL = 2 × window so idle keys evaporate. The Lua script is the atomic unit: no read-then-write race across pods.",
        },
        {
          n: "rate_limit_policy (Postgres)",
          cols: "id, tenant_id NULL, plan_id, endpoint_group, limit_per_window, window_seconds, burst, updated_at",
          notes:
            "tenant_id NULL = plan default; a row with tenant_id = override. Small table, cached in every gateway with a 30 s TTL.",
        },
        {
          n: "rate_limit_event (ClickHouse / S3)",
          cols: "ts, tenant_id, endpoint, decision, remaining",
          notes: "Sampled, for analytics and customer conversations — never on the hot path.",
        },
      ],
      sql: "SQL for the policy table only: it is small, relational (plan → limits → overrides), read constantly but written rarely, and benefits from transactions and an audit trail when support changes a customer's quota. Postgres with a 30-second cache in each gateway is ideal.",
      nosql:
        "Redis for the counters themselves. The access pattern is a single-key atomic read-modify-write with automatic expiry — precisely what Redis does and what a relational database does badly (every request would be a row lock and a WAL write). Do not put counters in Postgres: at 50K req/s you would need 50K transactions per second on hot rows, and the contention on a popular tenant's row would dominate.",
      verdict:
        "Polyglot: Redis (+Lua) for counters, Postgres for policy, ClickHouse/S3 for the audit stream. The decision rule to state: ephemeral, high-frequency, single-key state → in-memory store; durable, relational, low-frequency configuration → SQL.",
    },
    fu: [
      {
        q: "Which algorithm and why?",
        a: "Token bucket as the default: two numbers per key, allows bursts that real clients produce, and bounds the sustained rate. Sliding window counter when you must report exact usage; fixed window only if memory is critical, with the caveat that it allows 2× the limit across a boundary. Leaky bucket when you want to smooth traffic to a downstream that cannot burst.",
      },
      {
        q: "Show the Redis Lua script.",
        a: "local tokens = tonumber(redis.call('HGET', KEYS[1], 'tokens')) or capacity; local last = tonumber(redis.call('HGET', KEYS[1], 'ts')) or now; tokens = math.min(capacity, tokens + (now - last) * rate); if tokens >= 1 then tokens = tokens - 1; redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now); redis.call('PEXPIRE', KEYS[1], ttl); return 1 else return 0 end. The point: it is one round trip and atomic, so no two pods can both spend the last token.",
      },
      {
        q: "Redis goes down. What happens?",
        a: "Fail open — the L1 local buckets keep coarse protection, a circuit breaker stops hammering Redis, and we alert. A limiter that fails closed converts a cache outage into a full API outage. If some endpoints must never exceed quota (billing-sensitive), fail closed for that small set only.",
      },
      {
        q: "How do you stop one tenant from starving others?",
        a: "Per-tenant quotas are the first layer; beyond that, add per-tenant concurrency limits (max in-flight requests) and a work-queue with fair scheduling (weighted round robin over tenants) so a tenant within quota but issuing expensive calls cannot monopolise workers. This is the noisy-neighbour question, and it is the one multi-tenant SaaS panels care most about.",
      },
      {
        q: "The interviewer changes the scope: 'now limit by user, not account'.",
        a: "The key function is the only thing that changes — keyFor(request) becomes tenant:user:endpoint. Show that the design is parameterised by the key, that cardinality grows (so watch memory and TTLs), and that limits now need a per-user default. One report says the scope was changed deliberately mid-interview; this is the intended answer.",
      },
      {
        q: "How do you test and roll it out?",
        a: "Shadow mode first: evaluate and log the decision without enforcing, compare against real traffic, find the tenants that would break, then enforce per tenant behind a feature flag. Load-test with a burst profile, not a flat one.",
      },
    ],
  },
  {
    id: "hld-social",
    t: "Design a social media platform like Facebook (feed, posts, friends)",
    src: ["L1"],
    r: 2,
    stmt: "The round-2 question in a Lead Backend loop that ended in an offer: functional requirements, non-functional requirements, database design, API creation and trade-off analysis. Scope to post + friend graph + home feed.",
    ask: [
      {
        q: "Which surface: home feed, profile timeline, groups, messaging?",
        a: "Home feed and profile timeline. Messaging is a separate design (see WhatsApp).",
      },
      {
        q: "How large is the graph, and how big can one person's follower count get?",
        a: "500M users, average 300 friends, celebrities up to 50M followers — the celebrity case drives the whole design.",
      },
      {
        q: "Is the feed chronological or ranked?",
        a: "Start chronological, then add a ranking service. Say that ranking changes the read path but not the storage model.",
      },
      {
        q: "Read:write ratio?",
        a: "~100:1. Feeds are read constantly and written rarely, which argues for precomputation.",
      },
      {
        q: "Can the feed be slightly stale?",
        a: "Yes — seconds of staleness are acceptable, which unlocks async fan-out and caching.",
      },
      {
        q: "Media in posts?",
        a: "Yes: images and video go to object storage via pre-signed URLs and are served from a CDN; the post row stores only keys.",
      },
    ],
    fr: [
      "Create a post (text + media), edit, delete",
      "Friend/follow and unfollow; privacy: public, friends-only, custom",
      "Home feed: recent posts from people you follow, paginated",
      "Profile timeline: a user's own posts, newest first",
      "Like and comment, with counts visible on each post",
      "Notifications on likes, comments and mentions",
    ],
    nfr: [
      "Feed read p99 under 200 ms",
      "Availability 99.99% for reads; writes may degrade first",
      "Eventual consistency is fine for the feed; read-your-own-writes must hold for the author",
      "Scale to 500M users and ~10K posts/sec at peak",
      "Media served from the edge with signed URLs",
    ],
    scale:
      "500M users, 200M DAU, 2 posts/day average ≈ 400M posts/day ≈ 4.6K writes/s, ~15K/s peak. Feed reads: 200M × 20 refreshes ≈ 4B reads/day ≈ 46K/s, ~150K/s peak. Post row ~1 KB → 400 GB/day of text (cheap); media dominates and lives in S3. Fan-out on write for an average user = 300 inserts per post; for a celebrity with 50M followers it would be 50M inserts — which is why the hybrid model exists.",
    arch: "  Client ──▶ CDN (media) ──▶ S3\n     │\n     ▼\n  API Gateway ──▶ Post Service ──▶ Postgres (posts, shard by user)\n     │                 │\n     │                 └──▶ Kafka topic: post.created\n     │                          │\n     │                          ▼\n     │                   Fan-out Workers ──▶ Redis feed lists\n     │                          │             (per follower)\n     │                          ▼\n     │                   Notification Service\n     ▼\n  Feed Service ──▶ Redis (feed cache) ──▶ Post Store (hydrate)\n     │                 ▲\n     └── celebrity pull path (fetch at read time) ──┘\n\n  Graph Service ──▶ Graph DB / sharded Postgres (edges)",
    svc: [
      {
        n: "Post Service",
        d: "Writes the post row, uploads media keys, publishes post.created. Synchronous work is minimal so the author sees their post immediately.",
      },
      {
        n: "Graph Service",
        d: "Stores follow edges both directions (followers of X, following of X) for O(1) lookup. Sharded by user id; hot celebrity rows cached.",
      },
      {
        n: "Fan-out Workers",
        d: "Consume post.created and push the post id into each follower's feed list in Redis (fan-out on write). Skipped for accounts above a follower threshold.",
      },
      {
        n: "Feed Service",
        d: "Reads the precomputed list for the user, merges in posts pulled live from the few celebrities they follow, ranks, hydrates post bodies from cache/DB, returns a page.",
      },
      {
        n: "Notification Service",
        d: "Consumes like/comment/mention events, applies user preferences, and pushes via APNs/FCM/email.",
      },
      {
        n: "Media pipeline",
        d: "Pre-signed upload to S3, then async transcode/thumbnail; the CDN serves everything.",
      },
    ],
    seq: "Post (write)\n────────────────────────────────────────────\nClient  → API      : POST /posts {text, mediaKeys}\nAPI     → PostSvc  : validate + persist row\nPostSvc → Kafka    : publish post.created(postId, authorId)\nPostSvc → Client   : 201 {postId}            (author sees it instantly)\nKafka   → FanOut   : consume\nFanOut  → Graph    : followers(authorId)\n  alt followers < 100K\n    FanOut → Redis : LPUSH feed:{follower} postId  (capped at 1000)\n  else  (celebrity)\n    FanOut → skip  : readers will pull at read time\nFanOut  → Notify   : mentions\n\nFeed (read)\n────────────────────────────────────────────\nClient  → API      : GET /feed?cursor=...\nAPI     → FeedSvc  : build(userId, cursor)\nFeedSvc → Redis    : LRANGE feed:{userId}\nFeedSvc → Graph    : celebrities this user follows\nFeedSvc → PostStore: recent posts by those celebrities\nFeedSvc → merge + rank + hydrate (batch mget)\nFeedSvc → Client   : 200 [posts]",
    db: {
      tables: [
        {
          n: "users",
          cols: "user_id PK, handle UNIQUE, name, created_at, settings JSONB",
          notes:
            "Postgres. Sharded by user_id at very large scale; a handle → user_id lookup table keeps unique usernames global.",
        },
        {
          n: "posts",
          cols: "post_id (snowflake, time-sortable) PK, author_id, text, media_keys[], visibility, created_at, deleted_at",
          notes:
            "Shard by author_id; post_id encodes time so profile timelines sort without an extra index. Index (author_id, created_at DESC).",
        },
        {
          n: "follows",
          cols: "follower_id, followee_id, created_at, PRIMARY KEY (follower_id, followee_id)",
          notes:
            "Plus an inverse index/table (followee_id, follower_id) so 'who follows me' is also O(1). Both directions are needed: one for fan-out, one for the feed pull path.",
        },
        {
          n: "feed:{user_id} (Redis LIST/ZSET)",
          cols: "post_ids, capped at ~1000",
          notes:
            "The materialised feed. ZSET scored by post_id keeps ordering and allows cursor pagination.",
        },
        {
          n: "likes / comments",
          cols: "post_id, user_id, created_at (PK post_id,user_id for likes)",
          notes:
            "Counts kept in Redis counters and periodically reconciled; a COUNT(*) per post render does not scale.",
        },
        {
          n: "notifications",
          cols: "user_id, notif_id, type, actor_id, object_id, read_at, created_at",
          notes:
            "Cassandra or a partitioned table — append-heavy, queried only by (user_id, recent).",
        },
      ],
      sql: "SQL (sharded Postgres) for users, posts, follows and likes: they have relational integrity, need read-after-write for the author, and support varied queries (a user's posts, mutual friends, privacy checks). Postgres also gives cheap secondary indexes, which the graph queries need.",
      nosql:
        "NoSQL where the pattern is append-and-scan-by-key: Redis for materialised feeds and counters (the whole point is O(1) list operations with eviction); Cassandra for notifications and the activity log (partition by user_id, clustered by time, TTL for old rows); S3 + CDN for media; Elasticsearch for post search.",
      verdict:
        "Hybrid. The interview answer that lands: 'relational store for the source of truth, denormalised precomputed structures in Redis/Cassandra for the read path, rebuilt from the source of truth if they are lost.' Then state the key trade-off explicitly — fan-out on write costs storage and write amplification but makes reads O(1); fan-out on read costs read latency; the hybrid picks per-account by follower count.",
    },
    fu: [
      {
        q: "How do you handle celebrities (the fan-out problem)?",
        a: "Hybrid fan-out: precompute feeds for normal accounts; for accounts above a threshold (say 100K followers), skip fan-out and have the reader pull their recent posts at read time and merge. A user follows only a handful of celebrities, so the merge is cheap. Without this, one celebrity post triggers 50M Redis writes.",
      },
      {
        q: "How do you paginate a feed that keeps changing?",
        a: "Cursor pagination on the time-sortable post id, not OFFSET. Offsets skip or duplicate items when new posts arrive, and they get slower as the offset grows.",
      },
      {
        q: "How do you enforce privacy on a precomputed feed?",
        a: "Fan-out only to eligible followers (evaluate visibility at fan-out time), and re-check visibility at hydrate time as a second gate — because privacy may have changed since. Never trust the precomputed list alone.",
      },
      {
        q: "What if the Redis feed cache is lost?",
        a: "It is derived data: rebuild lazily on read from posts + follows for the first page, and backfill asynchronously. Say this explicitly — treating caches as rebuildable rather than precious is a senior signal.",
      },
      {
        q: "How do you count likes at this scale?",
        a: "Redis INCR per post with periodic flush to the database, or an approximate counter for very hot posts. A COUNT(*) on a likes table per render is the anti-pattern they are looking for.",
      },
      {
        q: "How would you add ranking later?",
        a: "Insert a ranking service between the feed list and the response: candidate generation stays as-is, then features (recency, affinity, engagement) are scored by a model. The storage design does not change, which is the point of keeping the feed a list of ids.",
      },
    ],
  },
  {
    id: "hld-auth",
    t: "Design an authentication and authorization system",
    src: ["L6", "S3"],
    r: 2,
    stmt: "A Glassdoor Lead report lists 'design an authentication system' where the requirements shifted mid-interview; a Senior report lists the concept version ('how does authentication and authorization work'). Design login, sessions/tokens, SSO and permission checks for a multi-tenant SaaS.",
    ask: [
      {
        q: "First-party login only, or social/SAML/OIDC SSO too?",
        a: "Both: email+password, Google/Microsoft OIDC, and SAML for enterprise tenants.",
      },
      {
        q: "Sessions or stateless tokens?",
        a: "JWT access tokens (short-lived) plus opaque refresh tokens stored server-side, so we can revoke.",
      },
      {
        q: "Authorization model: roles, or fine-grained resource permissions?",
        a: "RBAC with per-tenant roles, plus resource-level overrides (agent can only see tickets in their group) — which is how a helpdesk actually works.",
      },
      {
        q: "MFA required? Password policy? Account lockout?",
        a: "TOTP/SMS MFA optional per tenant, mandatory for admins; lockout with exponential backoff and CAPTCHA after N failures.",
      },
      {
        q: "Scale and latency for permission checks?",
        a: "Every API request does at least one authz check, so it must be sub-millisecond and local — no network call per check.",
      },
      {
        q: "Compliance: audit logs, data residency, session revocation SLAs?",
        a: "Full audit trail of logins and permission changes; revocation must take effect within the access-token TTL.",
      },
    ],
    fr: [
      "Register, log in, log out, reset password",
      "Issue access + refresh tokens; refresh rotation with reuse detection",
      "SSO via OIDC and SAML, with just-in-time user provisioning",
      "MFA enrolment and verification",
      "Role and permission management per tenant; authorize(user, action, resource)",
      "Session listing and remote revocation; audit log of security events",
    ],
    nfr: [
      "Authz decision under 1 ms, in-process",
      "Passwords stored with bcrypt/argon2id, never reversible",
      "Token theft contained: short access TTL (5–15 min), rotating refresh tokens, reuse detection",
      "Available 99.99% — if auth is down, everything is down",
      "Every security-relevant action audited immutably",
    ],
    scale:
      "10M users, 2M DAU, 50M API requests/day ≈ 600/s average. Logins are a fraction: ~2M/day ≈ 25/s, spiking at the start of the working day. bcrypt at cost 12 takes ~250 ms of CPU deliberately, so size the login fleet by CPU, not by request count — a detail worth saying out loud.",
    arch: "  Client ──▶ API Gateway ──(validate JWT signature locally)──▶ Services\n                 │                                        │\n                 │ login / refresh                        │ authorize()\n                 ▼                                        ▼\n         ┌──────────────────┐                   ┌────────────────────┐\n         │  Auth Service    │                   │ Policy/PDP library │\n         │  - password      │                   │ (roles + rules)    │\n         │  - OIDC / SAML   │                   └─────────┬──────────┘\n         │  - MFA           │                             │ cached\n         └───┬──────────┬───┘                             ▼\n             │          │                        Redis (role cache,\n             ▼          ▼                          revocation list)\n      Postgres      Key store (JWKS,\n      users,        rotating signing keys)\n      credentials,\n      sessions,\n      roles",
    svc: [
      {
        n: "Auth Service",
        d: "Owns credentials, MFA, token issuance and the OIDC/SAML handshakes. The only component that touches password hashes.",
      },
      {
        n: "Token layer",
        d: "Signs JWTs with a rotating key pair; publishes public keys at /.well-known/jwks.json so every service validates locally with no network call.",
      },
      {
        n: "Session store",
        d: "Refresh tokens (hashed) with device metadata, so users can list and revoke sessions. Also holds the deny-list of revoked access tokens (jti) until they expire.",
      },
      {
        n: "Policy decision point",
        d: "A library embedded in each service: evaluates (subject, action, resource, context) against cached roles and rules. Roles are pushed/cached in Redis with a short TTL.",
      },
      {
        n: "Admin / SCIM",
        d: "Role assignment, tenant settings, and SCIM provisioning so enterprise directories can create and deactivate users.",
      },
      {
        n: "Audit service",
        d: "Append-only log of logins, failures, permission changes, and token revocations — write-once storage, queryable for compliance.",
      },
    ],
    seq: "Login\n────────────────────────────────────────────────\nClient → Auth : POST /login {email, password}\nAuth   → DB   : SELECT credential WHERE email\nAuth   → Auth : argon2id verify (constant time)\n  alt MFA enabled\n    Auth → Client: 200 {mfa_required, challenge_id}\n    Client → Auth: POST /mfa {challenge_id, code}\n    Auth → Auth : verify TOTP window ±1\nAuth   → Store: create session, store hashed refresh token\nAuth   → Client: 200 {access_token (15m), refresh_token}\nAuth   → Audit : login.succeeded\n\nRequest + authorize\n────────────────────────────────────────────────\nClient  → Gateway: GET /tickets/42  (Bearer access_token)\nGateway → Gateway: verify signature via cached JWKS, check exp\nGateway → Redis  : is jti revoked?   (only for high-risk routes)\nGateway → Service: forward with claims {sub, tenant, roles}\nService → PDP    : authorize(user, 'ticket:read', ticket42)\nPDP     → Redis  : role -> permissions (cached 60 s)\nPDP     → Service: ALLOW / DENY\nService → Client : 200 / 403\n\nRefresh with reuse detection\n────────────────────────────────────────────────\nClient → Auth : POST /refresh {refresh_token}\nAuth   → Store: look up hash; already used?\n  alt reused (stolen)\n    Auth → Store : revoke the whole token family\n    Auth → Client: 401 + force re-login\n  else\n    Auth → Store : rotate (old marked used, new issued)\n    Auth → Client: 200 {new access, new refresh}",
    db: {
      tables: [
        {
          n: "users",
          cols: "user_id PK, tenant_id, email CITEXT, status, created_at, last_login_at",
          notes:
            "UNIQUE (tenant_id, email) for multi-tenant; CITEXT so case does not create duplicates.",
        },
        {
          n: "credentials",
          cols: "user_id FK, password_hash, algo, updated_at, must_reset",
          notes:
            "Separate table so a user row can be read widely without ever loading the hash. argon2id or bcrypt cost >= 12.",
        },
        {
          n: "mfa_factors",
          cols: "user_id, type (totp|sms|webauthn), secret_encrypted, verified_at",
          notes: "Secrets encrypted with a KMS data key, not stored in plaintext.",
        },
        {
          n: "sessions",
          cols: "session_id PK, user_id, refresh_token_hash, family_id, device, ip, issued_at, expires_at, used_at, revoked_at",
          notes: "family_id enables refresh-token reuse detection: reuse revokes the family.",
        },
        {
          n: "roles / permissions / user_roles",
          cols: "role_id, tenant_id, name; permission (action, resource_type); user_roles(user_id, role_id, scope)",
          notes: "Classic RBAC. scope allows 'agent in group 7' without a new role per group.",
        },
        {
          n: "audit_log",
          cols: "id, tenant_id, actor_id, action, target, ip, user_agent, created_at, metadata JSONB",
          notes: "Append-only; partition by month; ship to immutable storage for compliance.",
        },
      ],
      sql: "SQL throughout the source of truth. Identity data is highly relational (users → roles → permissions → tenants), needs transactional integrity (creating a user and assigning roles must be atomic), must support unique constraints (one email per tenant), and requires strong read-after-write — a user who changes their password must not be able to log in with the old one anywhere. Volumes are small (tens of millions of rows), so a single Postgres primary with replicas is right.",
      nosql:
        "Redis for the derived hot paths only: cached role→permission sets, the revocation deny-list keyed by jti with TTL equal to the token lifetime, login-attempt counters for lockout, and short-lived OIDC state/nonce values. These are ephemeral, key-addressed and expiring — exactly Redis's job. Do not keep the deny-list in SQL: it would add a database read to every request.",
      verdict:
        "Postgres for identity, Redis for ephemeral checks, a KMS/HSM for signing keys. The sentence to say: 'authentication data is small, relational and correctness-critical, so it stays in SQL; the per-request hot path is cache-only so that an auth check never costs a database round trip.'",
    },
    fu: [
      {
        q: "JWT vs server-side sessions — which and why?",
        a: "JWT access tokens let every service validate locally (no auth round trip), which is why they suit microservices; the cost is that they cannot be revoked before expiry. Mitigate with a short TTL (5–15 min), a jti deny-list for high-risk actions, and opaque refresh tokens held server-side. Plain server-side sessions are simpler and instantly revocable but put a shared store on every request. Say the trade-off rather than a preference.",
      },
      {
        q: "How do you revoke a token immediately?",
        a: "Keep a deny-list of jti (or a per-user 'tokens issued before T are invalid' epoch) in Redis, checked at the gateway. Cost is one cache read per request; keep entries only until the token would expire anyway. On password change or logout-everywhere, bump the user's epoch — one write revokes every token.",
      },
      {
        q: "Where is authorization actually enforced?",
        a: "In every service, never only at the gateway — the gateway does coarse routing/authn, the service owns resource-level rules because only it knows the data. Embed a policy library with cached rules (the PDP/PEP split); consider OPA/Cedar if rules get complex. Mention that a read filter alone is not security: list endpoints must filter by permission in the query, not in the response.",
      },
      {
        q: "How does SSO change the design?",
        a: "The Auth Service becomes an OIDC relying party / SAML SP: it validates the IdP assertion, provisions the user just-in-time, maps IdP groups to internal roles, and issues its own tokens. The rest of the system is unchanged — that isolation is the point. Per-tenant IdP config lives in the tenants table.",
      },
      {
        q: "How do you protect against credential stuffing?",
        a: "Per-account and per-IP rate limits with exponential backoff, device fingerprinting, CAPTCHA after N failures, breached-password checks (k-anonymity against HaveIBeenPwned), and alerting on distributed low-and-slow patterns. Never reveal whether the email exists — return the same error and take the same time.",
      },
      {
        q: "The interviewer changes the scope to 'now support API keys for machine clients'.",
        a: "Add a credential type: hashed key with a prefix for lookup, scoped permissions, no MFA, no refresh, plus rotation and last-used tracking. Authorization is unchanged because the PDP takes a subject, not a human. Show the extension point rather than redesigning.",
      },
    ],
  },
  {
    id: "hld-upload",
    t: "Design a document upload system",
    src: ["L6"],
    r: 2,
    stmt: "Listed in a Glassdoor Lead report alongside the rate limiter and auth system. Design uploads of attachments/documents: large files, resumable, virus-scanned, permission-controlled, served fast.",
    ask: [
      {
        q: "File size range and formats?",
        a: "Up to 5 GB, any type; most are under 10 MB (ticket attachments), with a long tail of large media.",
      },
      {
        q: "Do uploads pass through our servers or go directly to object storage?",
        a: "Directly to S3 with pre-signed URLs — this is the central design decision and it must be stated early.",
      },
      {
        q: "Resumable uploads needed?",
        a: "Yes for large files: multipart upload with per-part retry.",
      },
      {
        q: "Processing after upload: virus scan, thumbnails, text extraction, OCR?",
        a: "Yes — all asynchronous, with the document usable but marked 'scanning' until clean.",
      },
      {
        q: "Access control and sharing?",
        a: "Per-tenant isolation; links are signed and time-limited; optional public share links with expiry.",
      },
      {
        q: "Retention, versioning, deletion guarantees?",
        a: "Versioned; soft delete with a 30-day window; hard delete must also purge CDN copies and derived artefacts.",
      },
    ],
    fr: [
      "Request an upload → receive a pre-signed URL (or multipart plan)",
      "Upload directly to object storage, resumable, with integrity checks",
      "Complete the upload → metadata record created, processing triggered",
      "Download via a short-lived signed URL through the CDN",
      "Virus scan, thumbnail/preview generation, text extraction for search",
      "Versioning, soft delete and permanent purge",
    ],
    nfr: [
      "App servers never stream file bytes — no memory or bandwidth on the API tier",
      "Durability 11 nines (object storage), metadata durable in SQL",
      "Upload must survive client disconnects and resume",
      "A malicious or oversized file must be rejected before it costs us anything",
      "Download p95 under 100 ms from the edge for cached objects",
    ],
    scale:
      "100K uploads/day at an average 5 MB ≈ 500 GB/day ≈ 180 TB/year. Peak 10 uploads/s. Downloads 10× uploads, mostly CDN hits. If files streamed through the API tier, 500 GB/day of ingress and 5 TB/day of egress would need dedicated capacity — the pre-signed-URL design removes that entirely, which is the number to quote.",
    arch: "  Client\n    │ 1. POST /documents (name, size, mime)\n    ▼\n  API ──▶ Postgres (document row, status=PENDING)\n    │        │\n    │        └──▶ returns pre-signed PUT / multipart plan\n    │ 2. PUT parts directly\n    ▼\n  Object storage (S3)  ──(3. event)──▶ Queue ──▶ Workers\n    ▲                                              │\n    │ 5. signed GET via CDN                        ├─▶ virus scan\n    │                                              ├─▶ thumbnail / preview\n  CDN ◀── Client                                   ├─▶ text extract → search\n                                                   └─▶ status=READY / INFECTED\n                                                          │\n                                                          ▼\n                                                     Postgres update",
    svc: [
      {
        n: "Document API",
        d: "Creates the metadata row, issues pre-signed URLs scoped to one key with a size and content-type condition, and marks completion. Never touches bytes.",
      },
      {
        n: "Object storage",
        d: "S3 (or equivalent) with server-side encryption, versioning, lifecycle rules (move to infrequent access after 90 days), and per-tenant key prefixes.",
      },
      {
        n: "Event pipeline",
        d: "S3 → SNS/SQS or Kafka carries the ObjectCreated event; workers are idempotent because the same event can be delivered twice.",
      },
      {
        n: "Processing workers",
        d: "Virus scan (ClamAV or a vendor), thumbnail/preview render, text extraction and OCR, all independent consumers of the same event so one failure does not block the others.",
      },
      {
        n: "Download service",
        d: "Authorises the request, then redirects to a short-lived signed CDN URL. Signed URLs must be per-user and short (minutes) so they cannot be shared indefinitely.",
      },
      {
        n: "Cleanup / GC",
        d: "Removes orphaned objects whose metadata row never completed, purges soft-deleted files after the retention window, and invalidates CDN paths.",
      },
    ],
    seq: "Upload\n──────────────────────────────────────────────\nClient → API   : POST /documents {name, size, mime}\nAPI    → DB    : insert row (status=PENDING, key=tenant/uuid)\nAPI    → S3    : create multipart upload (if size > 100 MB)\nAPI    → Client: {uploadId, partUrls[] | putUrl, key}\nloop each part\n  Client → S3  : PUT part (retry on failure, resumable)\n  S3 → Client  : ETag\nClient → API   : POST /documents/{id}/complete {parts}\nAPI    → S3    : CompleteMultipartUpload\nAPI    → DB    : status=UPLOADED, size, checksum\nS3     → Queue : ObjectCreated\nQueue  → Scan  : clamav scan\n  alt infected\n    Scan → S3  : delete object\n    Scan → DB  : status=INFECTED\n    Scan → User: notify\n  else\n    Scan → DB  : status=READY\n    Queue → Thumb/Extract : previews, search index\n\nDownload\n──────────────────────────────────────────────\nClient → API   : GET /documents/{id}/url\nAPI    → DB    : row + permission check (tenant, ACL)\nAPI    → Client: 302 to signed CDN URL (expires 5 min)\nClient → CDN   : GET (edge cache or origin fetch from S3)",
    db: {
      tables: [
        {
          n: "documents",
          cols: "doc_id PK, tenant_id, owner_id, name, mime, size_bytes, storage_key, checksum, status (PENDING|UPLOADED|READY|INFECTED|DELETED), version, created_at, deleted_at",
          notes:
            "Index (tenant_id, created_at DESC) and (tenant_id, owner_id). Status is the state machine the workers advance.",
        },
        {
          n: "document_versions",
          cols: "doc_id, version, storage_key, size, created_by, created_at",
          notes: "New upload = new version row; the documents row points at the current version.",
        },
        {
          n: "document_acl",
          cols: "doc_id, principal_type (user|group|link), principal_id, permission (read|write), expires_at",
          notes: "Public share links are just an ACL row with a token principal and an expiry.",
        },
        {
          n: "document_derivatives",
          cols: "doc_id, kind (thumbnail|preview|text), storage_key, created_at",
          notes: "Derived artefacts are regenerable — never treat them as source of truth.",
        },
        {
          n: "upload_sessions",
          cols: "upload_id, doc_id, parts JSONB, expires_at",
          notes:
            "Lets a client resume; a sweeper aborts stale multipart uploads so S3 does not bill for orphaned parts.",
        },
        {
          n: "search index (Elasticsearch)",
          cols: "doc_id, tenant_id, name, extracted_text, tags",
          notes:
            "Filtered by tenant_id on every query — tenant isolation must be in the query, not the UI.",
        },
      ],
      sql: "SQL for metadata: it is relational (document → versions → ACL → derivatives), needs transactions (create a version and flip the current pointer atomically), needs uniqueness and foreign keys, and is queried in varied ways (by owner, by folder, by date, by status). Volume is modest — tens of millions of rows — so Postgres with partitioning by tenant or date is comfortable.",
      nosql:
        "Object storage for the bytes — never the database. A 5 GB file in a BLOB column destroys backup times, replication lag and buffer cache. Elasticsearch for extracted text search. Redis for short-lived upload session state and download URL caching. If the metadata ever outgrows Postgres (billions of files, as in a consumer drive product), DynamoDB/Cassandra keyed by (tenant_id, doc_id) is the escape hatch, at the cost of losing joins and transactions.",
      verdict:
        "Postgres for metadata + S3 for bytes + Elasticsearch for text is the answer. The line that earns the point: 'the database stores the pointer and the permissions; the object store stores the file; the CDN serves it; and none of the three is on the API server's memory path.'",
    },
    fu: [
      {
        q: "Why pre-signed URLs instead of uploading through the API?",
        a: "It removes the file bytes from the application tier entirely: no memory pressure, no request timeouts on slow clients, no bandwidth cost on the app fleet, and the upload scales with S3 rather than with your pods. The API only issues a short-lived credential scoped to a single key, size limit and content type.",
      },
      {
        q: "How do you stop someone uploading a 50 GB file or a different content type?",
        a: "Pre-signed POST policy conditions (content-length-range, content-type) are enforced by S3 itself; also validate the declared size before issuing the URL, and verify the actual object size and checksum on completion before marking READY. Client-side checks are not security.",
      },
      {
        q: "What if the client never calls complete?",
        a: "The row stays PENDING and a sweeper aborts the multipart upload and deletes the row after N hours. Orphaned multipart parts are billed by S3 until aborted, so add the lifecycle rule too — a nice operational detail to mention.",
      },
      {
        q: "How do you handle a virus found after the file is already shared?",
        a: "The document is only READY after the scan, and downloads check status. If a signature update flags a previously clean file, mark it INFECTED, purge CDN paths (invalidate by key), revoke outstanding signed URLs by rotating the signing key or using short TTLs, and notify anyone who downloaded it (the audit log exists for exactly this).",
      },
      {
        q: "How do you make processing exactly-once?",
        a: "You do not — make it idempotent instead. Key derived artefacts by (doc_id, version, kind) so reprocessing overwrites rather than duplicates, and use conditional updates on status so a replayed event cannot move the state backwards.",
      },
      {
        q: "Multi-region?",
        a: "Store in the tenant's region for residency, replicate metadata via the database's cross-region replication, and use a CDN with regional origins. Say the compliance driver out loud — for a SaaS company it is usually a contractual requirement, not an optimisation.",
      },
    ],
  },
  {
    id: "hld-logging",
    t: "Design a log management / distributed logging system",
    src: ["L6", "L4"],
    r: 2,
    stmt: "Two Lead reports: 'design a log management system' (Glassdoor, offer) and, in a hiring-manager round, 'integrate a distributed logging system into your current architecture'. Design ingestion, storage, search and alerting for logs from hundreds of services.",
    ask: [
      {
        q: "Logs only, or metrics and traces too?",
        a: "Logs primarily, with trace ids so logs can be correlated to a request — mention the three pillars but scope to logs.",
      },
      {
        q: "Volume and retention?",
        a: "Assume 1 TB/day ingest, 7 days hot searchable, 90 days warm, 1 year cold in object storage.",
      },
      {
        q: "Who searches, and how fast must it be?",
        a: "Engineers during incidents — free-text plus field filters over the last hour must return in seconds.",
      },
      {
        q: "Structured or plain text?",
        a: "Enforce structured JSON at the SDK with required fields (ts, level, service, trace_id, tenant_id); parse legacy text lines at ingest.",
      },
      {
        q: "Is log loss acceptable?",
        a: "Yes, with priority: dropping debug logs under pressure is fine, dropping audit/security logs is not — so route them differently.",
      },
      {
        q: "Multi-tenant visibility rules?",
        a: "Engineers see service logs; customer-facing logs must filter by tenant_id. Access is audited.",
      },
    ],
    fr: [
      "Collect logs from every host/pod/container with a lightweight agent",
      "Buffer, batch and ship reliably with backpressure",
      "Parse, enrich (service, env, region, trace id) and index",
      "Search by full text and by field, over a time range",
      "Alert on patterns (error rate spike, specific message) and route to on-call",
      "Tier storage and expire by retention policy",
    ],
    nfr: [
      "Ingest 1 TB/day (~12 MB/s average, 50 MB/s peak) without loss of high-priority logs",
      "Search p95 under 3 s for the last hour",
      "The logging pipeline must never take down the application — bounded buffers, drop rather than block",
      "Cost-aware: indexing is the expensive part, so index selectively",
      "End-to-end latency from emit to searchable under 30 s",
    ],
    scale:
      "1 TB/day ≈ 12 MB/s ≈ 1–2 billion lines/day at ~500 bytes each ≈ 15K lines/s average, 60K/s peak. Elasticsearch rule of thumb: ~1.2× raw size once indexed, so 7 days hot ≈ 8–9 TB — say 3 data nodes with 4 TB SSD each plus replicas. Kafka retention of 24 hours as a replay buffer ≈ 1 TB. Cold storage in S3 with compression ≈ 10:1, so a year is ~35 TB — cheap.",
    arch: "  App pods                 (structured JSON to stdout)\n     │  sidecar / DaemonSet agent (Fluent Bit, Vector)\n     ▼\n  ┌──────────────┐   backpressure + local disk buffer\n  │  Collector   │\n  └──────┬───────┘\n         ▼\n     Kafka topics  (partition by service; replay buffer, 24 h)\n         │\n    ┌────┴─────┬─────────────┬──────────────┐\n    ▼          ▼             ▼              ▼\n Enrich/    Alerting     Archiver        Sampling/\n parse      rules        (S3 parquet)    drop rules\n    │          │\n    ▼          ▼\n Elasticsearch   PagerDuty / Slack\n  (hot 7 d)\n    │\n    ▼\n  Kibana / internal search UI ──▶ engineers",
    svc: [
      {
        n: "Agent (DaemonSet)",
        d: "Tails container stdout, adds pod/node/service metadata, buffers to local disk when downstream is slow, and applies sampling rules. Must be resource-capped so it cannot starve the app.",
      },
      {
        n: "Kafka",
        d: "The shock absorber. Decouples producers from indexers so an Elasticsearch outage delays search instead of dropping logs, and allows replay after a mapping fix.",
      },
      {
        n: "Enrichment / parse workers",
        d: "Parse legacy text, normalise fields, attach tenant and trace ids, redact PII (emails, tokens, card numbers) before anything is stored.",
      },
      {
        n: "Indexer",
        d: "Bulk-writes to Elasticsearch with time-based indices (logs-2026.09.11) and ILM policies to roll over, shrink, move to warm and delete.",
      },
      {
        n: "Alerting engine",
        d: "Runs streaming rules (error rate per service > X for 5 min, or a specific pattern) and routes to the on-call schedule — this is where the PagerDuty-style LLD plugs in.",
      },
      {
        n: "Archiver",
        d: "Writes compressed Parquet to S3 for long retention and cheap analytics via Athena/Presto, independent of the search cluster.",
      },
    ],
    seq: 'Ingest\n──────────────────────────────────────────────\nApp     → stdout : {"ts":...,"level":"ERROR","trace_id":...}\nAgent   → Agent  : add pod/service/env, sample debug 1:100\nAgent   → Kafka  : produce (batch 1 MB / 1 s, acks=1)\n  alt Kafka unavailable\n    Agent → disk : buffer up to 500 MB, then drop debug first\nKafka   → Worker : consume batch\nWorker  → Worker : parse, redact PII, attach tenant_id\nWorker  → ES     : _bulk index (time-based index)\nWorker  → S3     : append parquet (async, independent)\nWorker  → Alert  : evaluate streaming rules\n  alt rule fires\n    Alert → OnCall: page via escalation policy\n\nSearch\n──────────────────────────────────────────────\nEngineer → UI  : service=billing level=ERROR last 1h "timeout"\nUI       → ES  : query with time filter first (index pruning)\nES       → UI  : hits + histogram\nEngineer → UI  : click a line → trace_id\nUI       → ES  : all logs for that trace across services',
    db: {
      tables: [
        {
          n: "Elasticsearch index logs-YYYY.MM.DD",
          cols: "@timestamp, level, service, env, host, trace_id, span_id, tenant_id, message (text), fields (object)",
          notes:
            "Time-based indices so deletion is a drop, not a query. Index only the fields you filter on; keep the rest as non-indexed source to cut cost roughly in half.",
        },
        {
          n: "Kafka topic logs.raw",
          cols: "key = service, value = JSON line",
          notes:
            "Partitions sized for parallel consumers; 24 h retention gives replay after an indexing bug.",
        },
        {
          n: "S3 archive",
          cols: "s3://logs/service=.../dt=2026-09-11/part-*.parquet",
          notes:
            "Columnar + partitioned by service and date so Athena scans little. 10:1 compression.",
        },
        {
          n: "alert_rules (Postgres)",
          cols: "id, name, query, window, threshold, severity, schedule_id, enabled, updated_by",
          notes: "Small relational config with an audit trail; joins to the on-call schedule.",
        },
        {
          n: "Retention policy",
          cols: "index pattern, hot_days, warm_days, cold_days, delete_after",
          notes: "Driven by ILM; audit/security logs get a separate, longer, immutable policy.",
        },
      ],
      sql: "SQL only for the control plane: alert rules, saved searches, dashboards, retention policies, access grants. These are small, relational, edited by humans and need an audit trail. Never for the log data itself.",
      nosql:
        "Logs go to a search engine (Elasticsearch/OpenSearch) because the query is full-text plus field filters over a time range — an inverted index is exactly right, and time-based indices make deletion free. Kafka is the durable buffer. Object storage holds the long tail. A relational table of billions of log rows would make every search a full scan and every deletion a costly DELETE; even with partitioning you would be rebuilding a search engine badly.",
      verdict:
        "Kafka → Elasticsearch (hot) → S3/Parquet (cold), with Postgres for rules and metadata. The trade-off to name: indexing everything is what makes log systems expensive, so sample debug logs, index a curated field set, and keep the raw line in cheap storage for the rare deep dive. Also mention ClickHouse as the modern alternative — cheaper at high volume, less good at free text.",
    },
    fu: [
      {
        q: "How do you integrate this with an existing architecture (the hiring-manager version)?",
        a: "Three steps and no big-bang: (1) standardise a logging library across services that emits structured JSON with trace_id from the incoming request header — this is the only application change; (2) deploy agents as a DaemonSet so nothing changes per service; (3) route through Kafka so the pipeline can be swapped later. Then show the first dashboards and alerts you would build, because that is what makes engineers adopt it.",
      },
      {
        q: "What do you do when the pipeline cannot keep up?",
        a: "Backpressure with priorities: buffer on local disk, then shed by level (debug first, then info) while always preserving error/audit. Never block the application thread on a log write — asynchronous appenders with a bounded queue and a drop policy. Alert on drop rate as an SLO.",
      },
      {
        q: "How do you correlate logs across services?",
        a: "Propagate a trace id (W3C traceparent) through every hop, including async ones via message headers, and log it on every line. Then a single query by trace id reconstructs the request. Mention OpenTelemetry as the standard and that logs, metrics and traces should share the same ids.",
      },
      {
        q: "How do you keep costs under control?",
        a: "Sample aggressively (1:100 debug, 100% errors), index fewer fields, shorten hot retention, compress and tier to S3, and charge back per team so the cost is visible. Quote the ratio: indexed hot storage can cost 20–50× cold object storage per GB.",
      },
      {
        q: "How do you keep PII out of logs?",
        a: "Redact at the agent/enrichment layer with pattern rules (emails, tokens, card numbers), enforce a lint rule that flags logging of user objects, and keep a deny-list of fields. Logs are often the largest accidental PII store in a company — saying this shows production maturity.",
      },
      {
        q: "What would you alert on?",
        a: "Symptom-based SLO alerts (error rate, p99 latency, saturation) rather than every exception; log-pattern alerts only for known-fatal signatures. Route through the on-call schedule with escalation, and require every alert to have a runbook link — otherwise it becomes noise.",
      },
    ],
  },
];
