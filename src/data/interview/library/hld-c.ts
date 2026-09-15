// Imported from the Interview Prep Console (lib/data-hld-c.js).
import type { HldAnswer } from "../types";

export const hldC: HldAnswer[] = [
  {
    id: "hld-crawler",
    t: "Design a web crawler — from a start URL, collect URLs up to depth N",
    src: ["S2", "S3", "S10"],
    r: 3,
    star: true,
    stmt: "Asked in three separate reports, usually by a Staff engineer in round 3: 'given one start URL and n, the level up to which you need to scrape, return the URLs — up to ~100K'. It looks like BFS and turns into a distributed systems question within two minutes.",
    ask: [
      {
        q: "Single machine or distributed? Is 100K the hard cap?",
        a: "Start single-process for clarity, then scale it out — the interviewer will steer. 100K URLs is the stated bound, which keeps the frontier in memory but not the pages.",
      },
      {
        q: "Same domain only, or the whole web?",
        a: "Ask. Same-domain is a scraper (politeness matters most); cross-domain is a crawler (dedup and prioritisation matter most).",
      },
      {
        q: "What do we store — just URLs, or page content too?",
        a: "URLs plus optional extracted content to object storage.",
      },
      {
        q: "Must we respect robots.txt and rate limits per host?",
        a: "Yes — politeness per domain is the constraint that shapes the queue design, and saying it unprompted scores well.",
      },
      {
        q: "How do we treat duplicates — same URL, or same content at different URLs?",
        a: "Both: URL normalisation plus content fingerprinting (SimHash/MinHash for near-duplicates).",
      },
      {
        q: "Must it resume after a crash, and re-crawl periodically?",
        a: "Yes — so the frontier and the visited set must be durable, not in-process.",
      },
    ],
    fr: [
      "BFS from a seed URL to depth N, respecting the depth limit",
      "Fetch, parse HTML, extract and normalise links",
      "Deduplicate URLs (and near-duplicate content)",
      "Respect robots.txt, crawl-delay and per-host concurrency limits",
      "Persist discovered URLs with their depth and status; resume after failure",
      "Handle redirects, timeouts, non-HTML content types and error codes",
    ],
    nfr: [
      "Politeness: never more than K concurrent requests or 1 request per crawl-delay per host",
      "Throughput bounded by IO, not CPU — the workers are network-bound, so use async IO or many threads",
      "Idempotent: re-processing a URL must not duplicate work or output",
      "Bounded memory: the visited set for 100M URLs cannot be a plain HashSet",
      "Traps handled: infinite calendars, session ids, redirect loops",
    ],
    scale:
      "100K URLs at ~100 KB each ≈ 10 GB of HTML — do not hold it in memory, stream to storage. A visited set of 100M URLs as raw strings is ~7 GB; as 64-bit hashes it is 800 MB; as a Bloom filter at 1% false positives it is ~120 MB. At 200 ms per fetch, one thread does 5 pages/s, so 100K pages needs ~5.5 hours single-threaded and ~3 minutes with 100 concurrent workers — politeness per host, not raw concurrency, is the real limiter.",
    arch: "  Seed URL\n     │\n     ▼\n  ┌──────────────────────────────────────────────┐\n  │ Frontier (priority + per-host queues)         │\n  │  Redis ZSET / Kafka topic per host bucket     │\n  └───────┬──────────────────────────────────────┘\n          │ lease URL (visibility timeout)\n          ▼\n   Fetcher workers (async IO)\n      │      │ robots.txt cache (per host, TTL)\n      │      └──▶ rate gate per host (token bucket)\n      ▼\n   Parser ──▶ extract links ──▶ normalise ──▶ dedup\n      │                                   (Bloom + exact store)\n      ├──▶ content store (S3)  + fingerprint (SimHash)\n      └──▶ new URLs (depth+1) ──▶ Frontier   [if depth < N]\n\n  Visited store (Redis/RocksDB/Cassandra)  •  Metrics + dead-letter",
    svc: [
      {
        n: "Frontier",
        d: "The durable queue of URLs to crawl, partitioned per host so politeness is enforceable and one slow domain cannot block others. Priority by depth (BFS) and optionally by page importance.",
      },
      {
        n: "Fetcher",
        d: "Async HTTP with timeouts, retry with exponential backoff and jitter, redirect following with a hop limit, and a content-type guard. Leases a URL so a crashed worker's URL returns to the queue.",
      },
      {
        n: "Robots/politeness gate",
        d: "Caches robots.txt per host with a TTL, enforces crawl-delay, and applies a per-host token bucket. This is the component interviewers most want to hear about.",
      },
      {
        n: "Parser/extractor",
        d: "Parses HTML, resolves relative links against the base URL, normalises (lowercase host, strip fragment, sort query params, drop session ids), and emits child URLs with depth+1.",
      },
      {
        n: "Dedup service",
        d: "Bloom filter in front of an exact store for URL dedup; SimHash for near-duplicate content so mirrored pages are not re-processed.",
      },
      {
        n: "Storage",
        d: "URLs and status in a key-value store; page bodies in object storage keyed by content hash; metrics and a dead-letter queue for permanent failures.",
      },
    ],
    seq: "Crawl loop\n──────────────────────────────────────────────────\nScheduler → Frontier : lease(URL, depth)  [visibility 60 s]\nFetcher   → Robots   : allowed(host, path)?\n  alt disallowed\n    Fetcher → Visited : mark SKIPPED_ROBOTS ; ack\n  else\n    Fetcher → RateGate: acquire(host)      [blocks per crawl-delay]\n    Fetcher → Site    : GET url (timeout 10 s)\n      alt 3xx\n        Fetcher → Frontier : push(location, same depth) [hop limit 5]\n      alt 5xx / timeout\n        Fetcher → Frontier : requeue with backoff (max 3)\n        after 3 : dead-letter\n      else 200 + text/html\n        Fetcher → S3    : store body (key = sha256)\n        Fetcher → Parser: extract links\n        Parser  → Norm  : canonicalise each URL\n        loop each child\n          Parser → Bloom : seen?\n          alt not seen and depth+1 <= N\n            Parser → Visited : add\n            Parser → Frontier: push(child, depth+1)\n    Fetcher → Frontier : ack (remove lease)\n\nTermination: frontier empty AND no in-flight leases",
    db: {
      tables: [
        {
          n: "frontier (Redis ZSET or Kafka)",
          cols: "member = url, score = priority (depth, discovery time)",
          notes:
            "One queue per host bucket so a slow host does not head-of-line block. Kafka with host-hashed partitions works too, and gives durability plus replay.",
        },
        {
          n: "visited (RocksDB / Redis / Cassandra)",
          cols: "url_hash (64-bit) PK → status, depth, last_crawled_at, http_status, content_hash",
          notes:
            "Store the hash, not the URL, for memory. Bloom filter in front to avoid a lookup for the ~90% of links already seen.",
        },
        {
          n: "pages (S3)",
          cols: "s3://crawl/{content_hash} → gzipped body; metadata sidecar",
          notes: "Content-addressed, so identical pages at different URLs store once.",
        },
        {
          n: "robots_cache (Redis)",
          cols: "host → parsed rules, crawl_delay, fetched_at, TTL 24 h",
          notes: "One fetch per host per day rather than per request.",
        },
        {
          n: "links (optional graph store)",
          cols: "from_url_hash, to_url_hash, discovered_at",
          notes:
            "Only if link-graph analysis (PageRank-like) is in scope; otherwise skip it and say why.",
        },
      ],
      sql: "SQL is a poor fit for the crawl state: the workload is a huge number of small key lookups and inserts with no joins, and the frontier is a queue, not a table. It is fine for the control plane — crawl jobs, seeds, schedules, per-domain policy and operator dashboards — which is exactly what you would keep in Postgres.",
      nosql:
        "Key-value for visited (RocksDB embedded, or Redis/Cassandra distributed), Redis or Kafka for the frontier, object storage for bodies. If asked why not Postgres for visited: 100M+ random-access rows with a write on nearly every link extraction would spend most of its time on index maintenance and WAL, for lookups that need no transactions.",
      verdict:
        "Kafka/Redis frontier + KV visited set + S3 bodies + Postgres control plane. The sentence that lands: 'the crawl state is a queue and a set, so I use a queue and a set, not a relational database.'",
    },
    fu: [
      {
        q: "Write the single-machine version first.",
        a: "A queue of (url, depth), a visited HashSet, a loop that pops, fetches, parses, and pushes children with depth+1 while depth < N — plain BFS. Then say what breaks at scale: memory for visited, politeness, crash recovery, and IO-bound throughput — and each fix becomes a component in the diagram above. Interviewers reward this progression explicitly.",
      },
      {
        q: "How do you parallelise without being rude to a host?",
        a: "Partition the frontier by host and give each host a single consumer (or a token bucket allowing K concurrent). Workers pull from many hosts at once, so total concurrency is high while per-host concurrency stays at 1–2. A naive thread pool over a global queue hammers whichever host happens to dominate the frontier.",
      },
      {
        q: "How do you deduplicate URLs at scale?",
        a: "Normalise first (scheme and host lowercase, default ports removed, fragment dropped, tracking params stripped, path segments resolved), then hash. Bloom filter for the fast negative check, backed by an exact store to resolve false positives. For content, SimHash the visible text and treat a Hamming distance under ~3 as a duplicate.",
      },
      {
        q: "How do you avoid crawler traps?",
        a: "Cap depth (already required), cap URLs per host, cap path length and repeated path segments, detect parameter explosions (calendars), honour rel=canonical, and set a redirect hop limit. Also track bytes per host so one site cannot consume the whole budget.",
      },
      {
        q: "How does it resume after a crash?",
        a: "The frontier is durable and URLs are leased with a visibility timeout, so anything in flight when a worker dies returns to the queue. Because processing is idempotent (content-addressed storage, set-based dedup), reprocessing is harmless. That combination — durable queue + lease + idempotence — is the answer to every 'what if a worker dies' question.",
      },
      {
        q: "How do you know when it has finished?",
        a: "Frontier empty and zero outstanding leases, checked twice with a delay. In a distributed setting, track in-flight counts per partition; a naive 'queue is empty' check fires early while workers still hold leases.",
      },
      {
        q: "They ask for the same thing but as a scraper for one site.",
        a: "Politeness and parsing dominate instead of dedup: respect robots and crawl-delay strictly, use sitemap.xml as the seed source, support JS-rendered pages via a headless browser pool (expensive — cap concurrency), and cache aggressively with ETag/If-Modified-Since so re-crawls are cheap.",
      },
    ],
  },
  {
    id: "hld-feed-notif",
    t: "Database design for a Quora / Medium-like feed and notifications",
    src: ["S4"],
    r: 3,
    stmt: "A bar-raiser question focused on data modelling rather than boxes: design the tables for a content platform's feed and notification system, then defend the indexes. The candidate who got this reported that weak SQL and DB design in this round caused the rejection — so this is a schema-first answer.",
    ask: [
      {
        q: "Feed sources: follows (people), topics, and recommendations?",
        a: "All three — which is exactly why a single materialised feed list is not enough.",
      },
      {
        q: "Ranked or chronological?",
        a: "Ranked. So the feed table stores candidates with a score, and ranking can be recomputed.",
      },
      {
        q: "Notification types and grouping?",
        a: "Upvotes, answers, comments, follows, mentions — grouped ('12 people upvoted your answer') and deduplicated.",
      },
      {
        q: "Read scale and freshness?",
        a: "Millions of daily readers; a feed that is seconds-to-minutes stale is acceptable.",
      },
      {
        q: "Retention on notifications?",
        a: "90 days, then archive — which makes time-partitioning natural.",
      },
      {
        q: "Do we need 'unread count' to be exact?",
        a: "Exact per user, and it is read on every page load, so it must be a cheap counter, not a COUNT(*).",
      },
    ],
    fr: [
      "Follow users and topics",
      "Publish a post/answer tagged with topics",
      "Home feed: ranked mix of followed users, followed topics and recommendations, paginated",
      "Notifications generated on upvote, comment, answer, follow and mention",
      "Grouped notifications with an accurate unread count; mark one or all as read",
      "Per-user notification preferences by type and channel",
    ],
    nfr: [
      "Feed page in under 200 ms",
      "Unread count in under 10 ms (cached counter)",
      "Notification write path must not slow the action that caused it",
      "Schema must survive new notification types without migrations",
      "No unbounded tables — partition and archive",
    ],
    scale:
      "10M users, 1M posts/day, 50M notifications/day ≈ 580/s average with peaks around viral content. Notifications are the biggest table: 50M/day × 200 bytes ≈ 10 GB/day ≈ 3.6 TB/year — partition monthly and archive after 90 days rather than deleting rows one by one.",
    arch: "  Action (upvote/comment/follow)\n        │\n        ▼\n   App service ──▶ Postgres (source of truth)\n        │\n        └──▶ Kafka: activity.created\n                 │\n     ┌───────────┼──────────────────────┐\n     ▼           ▼                      ▼\n Feed builder  Notification builder   Search index\n     │           │  (dedupe + group)\n     ▼           ▼\n Redis ZSET   notifications table + Redis unread counter\n feed:{user}       │\n     │             └──▶ Push/email workers (respecting prefs)\n     ▼\n  Feed API (hydrate posts, apply ranking, paginate)",
    svc: [
      {
        n: "Feed builder",
        d: "Consumes publish events, finds candidate audiences (followers of the author, subscribers of its topics), and writes post ids with a score into each user's Redis ZSET. Pull-at-read for very large audiences, as in the Facebook design.",
      },
      {
        n: "Ranking",
        d: "Score = affinity × quality × freshness decay; recomputed at read for the top N candidates so the model can change without rewriting stored feeds.",
      },
      {
        n: "Notification builder",
        d: "Consumes activity events, applies preferences, deduplicates (same actor + same object within a window) and groups (n actors on one object), then writes the row and increments the unread counter.",
      },
      {
        n: "Delivery workers",
        d: "Push, email digest and in-app; a digest job batches low-priority notifications into a daily email.",
      },
      {
        n: "Counter cache",
        d: "Redis per-user unread count, incremented on write and reset on mark-as-read, reconciled nightly against the table.",
      },
    ],
    seq: "Upvote → notification\n──────────────────────────────────────────────\nUser B → API   : POST /answers/42/upvote\nAPI → Postgres : INSERT votes (answer_id, user_id) ON CONFLICT DO NOTHING\nAPI → Kafka    : activity.created {type:UPVOTE, actor:B, object:42}\nAPI → User B   : 200 (fast path ends here)\nKafka → NotifBuilder\n  NotifBuilder → prefs : does the author want upvote notifications?\n  NotifBuilder → dedupe: existing unread group for (object 42, UPVOTE)?\n    alt exists\n      UPDATE notification SET actor_count = actor_count + 1,\n             last_actor_id = B, updated_at = now()\n    else\n      INSERT notification (...)\n      INCR unread:{author}\n  NotifBuilder → push  : if channel enabled and not rate-limited\n\nFeed read\n──────────────────────────────────────────────\nUser → API : GET /feed?cursor=\nAPI → Redis: ZREVRANGE feed:{user} → candidate post ids\nAPI → PG   : SELECT posts WHERE id = ANY(...)  (batch hydrate)\nAPI → Rank : rescore with freshness + affinity\nAPI → User : page + next cursor",
    db: {
      tables: [
        {
          n: "users",
          cols: "user_id PK, handle UNIQUE, name, created_at",
          notes: "—",
        },
        {
          n: "posts",
          cols: "post_id PK (time-sortable), author_id FK, title, body, status, published_at, score",
          notes:
            "INDEX (author_id, published_at DESC) for profiles; INDEX (published_at DESC) WHERE status='PUBLISHED' as a partial index for global recency.",
        },
        {
          n: "topics / post_topics",
          cols: "topic_id PK, name; (post_id, topic_id) PK",
          notes:
            "INDEX (topic_id, post_id DESC) so 'newest in this topic' is an index scan, not a join-and-sort.",
        },
        {
          n: "follows",
          cols: "(follower_id, followee_type ENUM(user,topic), followee_id) PK, created_at",
          notes:
            "One table for both user and topic follows keeps the feed query uniform. INDEX (followee_type, followee_id) for the reverse lookup used at fan-out.",
        },
        {
          n: "votes",
          cols: "(object_type, object_id, user_id) PK, value SMALLINT, created_at",
          notes:
            "PK doubles as the uniqueness guard — one vote per user per object. Counts are denormalised onto posts and reconciled.",
        },
        {
          n: "notifications",
          cols: "notification_id PK, recipient_id, type, object_type, object_id, last_actor_id, actor_count, read_at NULL, created_at, updated_at, payload JSONB",
          notes:
            "PARTITION BY RANGE (created_at) monthly. INDEX (recipient_id, created_at DESC) for the list and a partial INDEX (recipient_id) WHERE read_at IS NULL for unread queries. actor_count + last_actor_id implement grouping without a row per actor. payload JSONB lets new types ship without a migration.",
        },
        {
          n: "notification_prefs",
          cols: "(user_id, type) PK, in_app BOOL, email BOOL, push BOOL, digest_only BOOL",
          notes: "Read on every notification write — cache it.",
        },
        {
          n: "feed:{user_id} (Redis ZSET)",
          cols: "member = post_id, score = ranking score",
          notes: "Derived; rebuildable from posts + follows.",
        },
      ],
      sql: "SQL for everything relational and correctness-sensitive: users, posts, follows, votes, preferences, and the notification table itself (it needs the unique/grouping semantics, partial indexes for unread, and partitioning for retention). Postgres handles 50M rows/day comfortably when partitioned monthly and archived.",
      nosql:
        "Redis for the materialised feed and the unread counter — both derived, both read constantly. Cassandra becomes the better home for notifications only if you exceed what a partitioned Postgres can hold (billions of rows with heavy write skew); the access pattern (recipient + recent) maps to a Cassandra partition key cleanly. Elasticsearch for post search.",
      verdict:
        "Postgres-first with Redis for derived hot state, and an explicit exit strategy to Cassandra for notifications if volume demands it. Give the reasoning, not just the choice — this is the round where a candidate was rejected for weak DB answers.",
    },
    fu: [
      {
        q: "Write the SQL for a user's unread notifications, newest first.",
        a: "SELECT n.* FROM notifications n WHERE n.recipient_id = $1 AND n.read_at IS NULL AND n.created_at > now() - interval '90 days' ORDER BY n.created_at DESC LIMIT 20; — served by the partial index (recipient_id, created_at DESC) WHERE read_at IS NULL, and partition pruning restricts it to recent partitions. Say both parts: the index and the pruning.",
      },
      {
        q: "And the unread count?",
        a: "Never SELECT count(*) on every page load. Keep a Redis counter per user, INCR on insert and reset on mark-all-read, with a nightly reconciliation query. If it must be in SQL, keep a user_counters row updated in the same transaction as the insert.",
      },
      {
        q: "How do you group '12 people upvoted your answer'?",
        a: "A unique key on (recipient_id, type, object_id) for unread rows: insert, or on conflict increment actor_count and update last_actor_id and updated_at. Once read, the next event starts a new group. In Postgres, INSERT ... ON CONFLICT DO UPDATE does it in one statement, which is the answer they want to see written out.",
      },
      {
        q: "How would you build the feed query without Redis?",
        a: "SELECT p.* FROM posts p JOIN follows f ON ((f.followee_type='user' AND f.followee_id=p.author_id) OR (f.followee_type='topic' AND f.followee_id IN (SELECT topic_id FROM post_topics WHERE post_id=p.post_id))) WHERE f.follower_id=$1 AND p.published_at > now() - interval '7 days' ORDER BY p.published_at DESC LIMIT 20; — then immediately say why you would not ship it: the OR across two follow types defeats index use, and it re-runs for every reader. Precompute instead. Showing the query and its weakness is stronger than refusing to write it.",
      },
      {
        q: "How do you keep the notifications table from growing forever?",
        a: "Monthly range partitions; DROP the partition older than the retention window (instant) instead of DELETE (which bloats and vacuums). Archive to S3/Parquet first if the data is needed for analytics.",
      },
      {
        q: "Which indexes would you NOT add?",
        a: "Anything on a low-cardinality column alone (type, read flag), anything duplicating a prefix of an existing composite index, and anything on a column only used in rarely-run admin queries — each index costs write throughput and storage on a 50M-rows/day table. Volunteering the cost side of indexing is exactly what a bar raiser is listening for.",
      },
    ],
  },
  {
    id: "hld-stock",
    t: "Design one feature of a stock application with moving-average pricing",
    src: ["S1"],
    r: 4,
    stmt: "Asked in a Director round: design a feature of a stock app that shows a moving average, then optimise the database design. It is a time-series design question wearing a product costume.",
    ask: [
      {
        q: "Which moving average — simple, exponential, and over what windows?",
        a: "SMA and EMA over 5m, 1h, 1d, 50d and 200d. The window set determines the pre-aggregation strategy.",
      },
      {
        q: "How many symbols and what tick rate?",
        a: "5,000 symbols, up to 100 ticks/s each at market open → 500K writes/s peak. That number changes everything.",
      },
      {
        q: "Do users need live updating charts or on-demand queries?",
        a: "Both: a live stream for the open chart, and historical queries for backtesting.",
      },
      {
        q: "How far back must history go, and at what granularity?",
        a: "Ticks for 7 days, 1-minute candles for 2 years, daily candles forever.",
      },
      {
        q: "Accuracy and correction — can ticks arrive late or be revised?",
        a: "Yes, exchanges send corrections, so aggregates must be recomputable for a window.",
      },
      {
        q: "Is this for display only or for trading decisions?",
        a: "Display and alerts. If it were order execution, correctness and audit requirements would change the design.",
      },
    ],
    fr: [
      "Ingest a tick stream per symbol",
      "Roll ticks into 1-minute, 1-hour and 1-day OHLCV candles",
      "Compute SMA/EMA for configured windows, incrementally",
      "Serve chart queries: symbol + range + interval + indicators",
      "Push live updates to open charts",
      "Alert when price crosses a moving average (golden cross / death cross)",
    ],
    nfr: [
      "Ingest 500K ticks/s at open without loss",
      "Chart query under 100 ms for a year of daily candles",
      "Late or corrected ticks must be reconcilable",
      "Storage cost controlled by downsampling, not deletion",
      "Live updates under 250 ms end to end",
    ],
    scale:
      "500K ticks/s × 40 bytes ≈ 20 MB/s ≈ 1.7 TB/day of raw ticks — so raw ticks live for days, not years. 1-minute candles: 5,000 symbols × 390 minutes × 50 bytes ≈ 100 MB/trading day, ~25 GB/year — cheap and permanently queryable. That contrast is the whole storage argument.",
    arch: "  Exchange feeds ──▶ Ingest gateway ──▶ Kafka (partition by symbol)\n                                            │\n         ┌──────────────────────────────────┼──────────────────┐\n         ▼                                  ▼                  ▼\n   Candle aggregator              Indicator engine       Raw tick sink\n   (windowed, per symbol)         (incremental SMA/EMA)  (S3 / 7-day TSDB)\n         │                                  │\n         ▼                                  ▼\n   TimescaleDB / ClickHouse          Redis (latest values,\n   candles 1m / 1h / 1d               per symbol per window)\n         │                                  │\n         └──────────▶ Query API ◀───────────┘\n                          │\n                          ├──▶ REST: historical candles + indicators\n                          └──▶ WebSocket: live candle + MA updates\n\n   Alert engine ──▶ crossing rules ──▶ notifications",
    svc: [
      {
        n: "Ingest gateway",
        d: "Normalises exchange formats, stamps a sequence number per symbol, and produces to Kafka partitioned by symbol so all ticks for a symbol are ordered on one partition.",
      },
      {
        n: "Candle aggregator",
        d: "Stateful stream processor keeping the open candle per (symbol, interval); emits on window close and on late-arriving corrections. Uses event time, not processing time, with a small allowed lateness.",
      },
      {
        n: "Indicator engine",
        d: "Maintains SMA with a ring buffer (add new, subtract oldest) and EMA with the recurrence EMA_t = α·price + (1-α)·EMA_(t-1). Both are O(1) per tick — that is the point of the question.",
      },
      {
        n: "Time-series store",
        d: "TimescaleDB (Postgres extension, keeps SQL) or ClickHouse for candles, with continuous aggregates rolling 1m → 1h → 1d automatically and compression on older chunks.",
      },
      {
        n: "Query API",
        d: "Chooses the coarsest interval that satisfies the requested range (a year of data is served from daily candles, not from ticks) and returns indicators precomputed where possible.",
      },
      {
        n: "Live channel",
        d: "WebSocket fan-out per symbol; clients subscribe to (symbol, interval) and receive candle updates and MA values.",
      },
    ],
    seq: "Tick → candle → moving average → client\n──────────────────────────────────────────────────\nFeed → Gateway    : tick(symbol, price, volume, ts)\nGateway → Kafka   : produce to partition hash(symbol)\nKafka → Aggregator: consume in order\nAggregator        : update open 1m candle (o,h,l,c,v)\n  alt minute boundary crossed\n    Aggregator → TSDB  : INSERT closed candle\n    Aggregator → Indic : new closed value\n    Indic → Indic      : SMA: sum += new - oldest; EMA: recurrence\n    Indic → Redis      : SET sma:{symbol}:{window}\n    Indic → WS fan-out : push {candle, sma, ema}\n    Indic → Alerts     : crossing check (price vs MA)\n  alt late tick (event time < window close)\n    Aggregator → TSDB  : recompute affected candle (idempotent upsert)\n    Aggregator → Indic : recompute the affected MA suffix\n\nHistorical query\n──────────────────────────────────────────────────\nClient → API : GET /chart?symbol=X&from=-1y&interval=1d&ma=50,200\nAPI → TSDB   : SELECT from daily continuous aggregate\nAPI → API    : window function for SMA if not precomputed\nAPI → Client : candles + indicator series",
    db: {
      tables: [
        {
          n: "ticks (hot, 7 days)",
          cols: "symbol, ts, price, volume, seq — partitioned by day, compressed after 1 day",
          notes:
            "Or skip the database entirely and keep raw ticks only in Kafka + S3. Say the trade-off: raw ticks are rarely queried after the fact.",
        },
        {
          n: "candles_1m",
          cols: "PRIMARY KEY (symbol, bucket_start), open, high, low, close, volume, trade_count",
          notes:
            "Hypertable/partition by time; index is the primary key, which matches every query (symbol + time range).",
        },
        {
          n: "candles_1h / candles_1d",
          cols: "same shape",
          notes:
            "Continuous aggregates rolled up from 1m — never recomputed from ticks at query time.",
        },
        {
          n: "indicators",
          cols: "PRIMARY KEY (symbol, interval, indicator, window, bucket_start), value",
          notes:
            "Precompute the popular windows (50/200 day); compute rare ones on the fly with a SQL window function.",
        },
        {
          n: "symbols",
          cols: "symbol PK, name, exchange, currency, lot_size, active",
          notes: "Small relational reference data — plain Postgres.",
        },
        {
          n: "alerts",
          cols: "alert_id, user_id, symbol, rule (JSONB), last_fired_at, enabled",
          notes: "Relational config with a human workflow.",
        },
      ],
      sql: "SQL — specifically a time-series-extended SQL store such as TimescaleDB — is a strong fit here, and saying so with reasons beats reflexively reaching for NoSQL. Candles are naturally (symbol, time) keyed, queries are range scans with aggregation, and window functions (AVG(close) OVER (PARTITION BY symbol ORDER BY bucket ROWS 49 PRECEDING)) express moving averages directly. You also keep joins to reference data and transactions for user-facing config.",
      nosql:
        "ClickHouse or Cassandra when the tick volume is truly enormous and queries are analytical scans rather than transactional; Redis for the latest value per (symbol, window) because every open chart reads it; Kafka as the ordered ingest log; S3/Parquet for the cold archive used by backtesting jobs. A plain document store is a poor fit — it gives neither the compression nor the range-scan performance of a columnar/time-series engine.",
      verdict:
        "Kafka for ingest, a time-series store for candles, Redis for the live values, S3 for the archive. The database optimisation the Director was probing for: do not store or scan raw ticks for chart queries — pre-aggregate into candles, roll candles up, and choose the interval by the requested range.",
    },
    fu: [
      {
        q: "How do you compute a moving average incrementally?",
        a: "SMA over N closed candles: keep a ring buffer and a running sum — on each new value, sum += new - oldest, average = sum / N, which is O(1) instead of O(N). EMA: EMA_t = α·price_t + (1-α)·EMA_{t-1} with α = 2/(N+1), which needs only the previous value. Write both formulas on the board; this is the part of the question with a right answer.",
      },
      {
        q: "How do you optimise the database?",
        a: "Five things, in order of payoff: (1) pre-aggregate into candles and query the coarsest interval that answers the question; (2) make the primary key (symbol, bucket_start) so every query is a clustered range scan; (3) partition by time and compress old chunks (10× or better on OHLCV); (4) precompute the popular indicator windows; (5) cache the latest values in Redis because every open chart polls them. Then quote the numbers: 1.7 TB/day of ticks versus 100 MB/day of 1-minute candles.",
      },
      {
        q: "Late and corrected ticks?",
        a: "Use event time with a bounded allowed lateness, make candle writes idempotent upserts keyed by (symbol, bucket), and recompute the indicator suffix for affected buckets. Keep a correction log so the change is auditable — in a financial product, silently rewriting history is not acceptable.",
      },
      {
        q: "A year of 1-minute data for a chart is 390K points.",
        a: "Never send that: downsample server-side to the pixel width of the chart (roughly 1,000 points) using the coarser interval or an LTTB-style downsample. Bandwidth and client rendering, not the database, are the bottleneck at that point.",
      },
      {
        q: "How would you detect a golden cross across 5,000 symbols?",
        a: "The indicator engine already holds both MAs per symbol, so a crossing check is a comparison against the previous state at each candle close — 5,000 comparisons per minute. Do not poll the database for this; the streaming state already has everything.",
      },
      {
        q: "What if this fed real trading decisions?",
        a: "Then you need exactly-once accounting, an immutable audit trail, replayability from the raw log, clock discipline (exchange timestamps, not server time), and a reconciliation process against the exchange's own records. Saying what changes — rather than claiming the same design works — is what a Director round is testing.",
      },
    ],
  },
  {
    id: "hld-parking",
    t: "HLD of a parking system",
    src: ["L2"],
    r: 4,
    stmt: "Asked in a Lead hiring-manager round as a high-level design (the class-level answer is in the LLD tab). At HLD level it is a multi-site IoT + payments problem, not an object-modelling exercise.",
    ask: [
      {
        q: "One lot or a network of lots across cities?",
        a: "A network — that is what makes it an HLD.",
      },
      {
        q: "How do gates work: ANPR cameras, RFID, QR tickets?",
        a: "Camera-based plate recognition with a QR fallback; both emit events to the backend.",
      },
      {
        q: "Must gates work when the network is down?",
        a: "Yes — an offline mode with local buffering, which is the interesting constraint.",
      },
      {
        q: "Payments: at kiosk, in-app, or post-paid via a linked card?",
        a: "All three, so the payment state must be separate from the parking session.",
      },
      {
        q: "Do users need live availability across lots?",
        a: "Yes — a map of free spots per lot, which is a read-heavy, eventually consistent view.",
      },
      {
        q: "Scale?",
        a: "1,000 lots, 500 spots each, ~200K sessions/day.",
      },
    ],
    fr: [
      "Entry: detect the vehicle, allocate a spot or admit, create a session",
      "Exit: compute the fee, take payment, release the spot, open the gate",
      "Live availability per lot; reservations in the app",
      "Pricing and offers per site, per time of day",
      "Operator console: occupancy, revenue, incidents, manual overrides",
      "Offline tolerance at the gate",
    ],
    nfr: [
      "Gate decision under 500 ms — the car is waiting",
      "Gates must keep working during a network partition (accept and reconcile later)",
      "No double billing; exactly-once payment capture per session",
      "Availability counts may be seconds stale; billing may not be wrong",
      "Per-site isolation: one lot's outage must not affect others",
    ],
    scale:
      "200K sessions/day ≈ 2.3/s average, peaks of ~50/s across the network — tiny. The engineering difficulty is not throughput; it is edge reliability, reconciliation and money. Say that explicitly, because candidates often over-engineer this question.",
    arch: "  Lot (edge)                          Cloud\n  ┌───────────────────────┐          ┌─────────────────────────┐\n  │ Camera/ANPR ─▶ Gate   │  MQTT/   │ Ingest ─▶ Session Svc   │\n  │   controller (local   │◀════════▶│            │            │\n  │   DB + rules, offline │  HTTPS   │            ├─▶ Pricing  │\n  │   buffer)             │          │            ├─▶ Payments │\n  └───────────────────────┘          │            └─▶ Events   │\n        │ local display                             (Kafka)    │\n        ▼                             │                │        │\n   Occupancy board                    ▼                ▼        │\n                              Postgres (sessions)  Availability │\n                                                    cache(Redis)│\n  Mobile app ──▶ API ──▶ availability map, reservations, receipts",
    svc: [
      {
        n: "Gate controller (edge)",
        d: "Runs at the lot: recognises the plate, checks a local allowlist and the last known session state, opens the barrier, and buffers events when offline. Owns the 500 ms decision.",
      },
      {
        n: "Ingest / sync",
        d: "Receives buffered edge events (idempotent by event id), reconciles them into sessions, and resolves conflicts such as an exit recorded before its entry arrived.",
      },
      {
        n: "Session service",
        d: "The source of truth for parking sessions and their state machine; computes duration and applies pricing.",
      },
      {
        n: "Payments",
        d: "Authorises, captures and refunds with idempotency keys; handles post-paid linked cards and failed payments (grace period, then dunning).",
      },
      {
        n: "Availability service",
        d: "Aggregates occupancy per lot from edge heartbeats into Redis for the map; eventually consistent by design.",
      },
      {
        n: "Operator console + reporting",
        d: "Live occupancy, revenue, incident handling, manual overrides — every override written to the audit log.",
      },
    ],
    seq: "Entry and exit (with an offline window)\n──────────────────────────────────────────────────\nCar → Camera    : plate read\nCamera → Gate   : plate + timestamp\nGate → Cloud    : POST /sessions/entry {eventId, plate, lot}\n  alt cloud reachable\n    Cloud → DB  : create session (ACTIVE)\n    Cloud → Gate: OK (spot hint, display message)\n  else offline\n    Gate → local: record entry, open barrier (fail open)\n    later: Gate → Cloud : batch sync {eventIds...}\nGate → Cloud    : POST /sessions/exit {eventId, plate}\nCloud → Pricing : fee(entry, exit, tariff, offers)\nCloud → Payments: capture (idempotency = sessionId)\n  alt capture fails\n    Cloud → Gate : open anyway, mark session UNPAID\n    Cloud → Dunning: retry, notify, block on next entry\n  else\n    Cloud → Gate : open, print/send receipt\nCloud → Kafka   : session.completed → availability, analytics",
    db: {
      tables: [
        {
          n: "lots / spots",
          cols: "lot_id PK, name, location, capacity_by_type, tariff_id; spot_id, lot_id, type, status",
          notes:
            "Spot-level status only if the lot has per-spot sensors; otherwise track counts per type.",
        },
        {
          n: "sessions",
          cols: "session_id PK, lot_id, plate, entry_at, exit_at, spot_id NULL, status (ACTIVE|COMPLETED|UNPAID|DISPUTED), amount, payment_id, source (ONLINE|OFFLINE_SYNC), version",
          notes:
            "UNIQUE partial index on (lot_id, plate) WHERE status='ACTIVE' prevents two open sessions for one car.",
        },
        {
          n: "gate_events",
          cols: "event_id PK (generated at the edge), lot_id, gate_id, type, plate, occurred_at, received_at, processed",
          notes:
            "The edge-generated id is the idempotency key — replayed batches are deduplicated by the primary key.",
        },
        {
          n: "payments",
          cols: "payment_id, session_id UNIQUE, amount, state, gateway_ref, idempotency_key",
          notes: "UNIQUE(session_id) makes double capture structurally impossible.",
        },
        {
          n: "tariffs",
          cols: "tariff_id, lot_id, rules JSONB (slabs, day-of-week, max daily)",
          notes:
            "JSONB so pricing rules change without migrations; versioned so old sessions reprice identically.",
        },
        {
          n: "availability (Redis)",
          cols: "lot:{id}:free:{type} counter, TTL-refreshed by heartbeat",
          notes: "Derived, stale-tolerant, read by the map.",
        },
      ],
      sql: "SQL for sessions, payments, tariffs and gate events: money, state machines, uniqueness constraints and reconciliation queries. Volumes are small, so a single Postgres with read replicas serves the whole network.",
      nosql:
        "Redis for live availability counters; a time-series or object store for sensor/camera telemetry; Kafka for the event backbone between edge sync and consumers. Nothing here justifies a distributed database, and saying so is a point in your favour — right-sizing is a senior signal.",
      verdict:
        "Postgres plus Redis plus a queue. The interesting engineering is at the edge (offline tolerance, idempotent event ids, reconciliation), not in the datastore.",
    },
    fu: [
      {
        q: "The network drops at a lot for two hours. What happens?",
        a: "The gate fails open and buffers events locally with locally generated event ids; on reconnect it replays the batch, and the cloud deduplicates by event id and rebuilds sessions in timestamp order. Billing for offline sessions is computed after reconciliation. Explicitly choosing fail-open (let cars out, bill later) over fail-closed (trap cars) is the answer — say why.",
      },
      {
        q: "An exit event arrives before its entry.",
        a: "Create a synthetic session flagged for review with a default entry time (or the lot's opening time), bill conservatively, and let the operator console resolve it. Design for out-of-order arrival rather than assuming ordering — edge systems never guarantee it.",
      },
      {
        q: "How do you make sure nobody is billed twice?",
        a: "One payment row per session enforced by a unique constraint, an idempotency key sent to the gateway, and reconciliation against gateway webhooks. Retries then become harmless — which is the general pattern for any payment integration.",
      },
      {
        q: "How does live availability stay accurate?",
        a: "Edge heartbeats carry the authoritative count per lot; the cloud stores it in Redis with a TTL so a silent lot degrades to 'unknown' rather than showing stale free spots. Reservations decrement a soft counter with a hold TTL.",
      },
      {
        q: "When would you move to per-spot sensors?",
        a: "Only when the product needs spot-level guidance (find my free spot on level 3). It multiplies device count, telemetry volume and failure modes, so tie it to a product requirement rather than adopting it by default.",
      },
    ],
  },
  {
    id: "hld-ownsystem",
    t: "Present your current system — and say what you would improve",
    src: ["L1", "L4", "S4", "S2"],
    r: 3,
    playbook: true,
    stmt: "Every single Lead report contains this question in some form: draw your current architecture, defend the choices, and say what you would change. It is the highest-signal question in the loop because it cannot be crammed — prepare it like a talk.",
    ask: [
      {
        q: "What should I prepare in advance?",
        a: "One diagram you can draw in three minutes from memory, four numbers (traffic, data size, latency, team size), two decisions you owned with their trade-offs, one incident and what changed after it, and one improvement you would make with its expected impact.",
      },
      {
        q: "How much detail do they want?",
        a: "Start at the level of 6–10 boxes, then go deep wherever they point. Reports describe interviewers asking 'why this queue', 'why this database', 'what happens if this dies' — so every box needs a one-line justification ready.",
      },
      {
        q: "What if my system is small or boring?",
        a: "Scale is not the grading criterion; reasoning is. A modest system with a clearly explained trade-off beats a vague description of something huge. Be precise about what you personally designed versus inherited.",
      },
      {
        q: "Can I mention things that went wrong?",
        a: "Yes — it is the strongest material you have, provided you finish with the change you made and the result. Bar raisers explicitly ask about improvements to your own design.",
      },
    ],
    fr: [
      "The one-minute framing: what the system does, who uses it, what the load looks like.",
      "The diagram: clients → edge → services → stores, with async paths drawn separately.",
      "The data model: the 3–4 tables that matter and why they are shaped that way.",
      "Two decisions you owned: the alternatives, the criteria, and what you gave up.",
      "One failure: what broke, the blast radius, the fix, and the guardrail that now prevents it.",
      "The improvement list: what you would do next and why it is worth the cost.",
    ],
    nfr: [
      "Quantify: 'about 4K requests/second at peak, p99 180 ms, 2 TB in the primary database' — numbers are what make a story credible.",
      "Own the boundaries: say 'I designed X, my teammate owned Y' — overclaiming is easy to expose with one follow-up.",
      "Name the trade-off you accepted, not just the choice you made.",
      "Tie technical choices to business constraints (deadline, team size, cost, compliance) — that is what distinguishes Lead from Senior.",
      "Keep one improvement that you deliberately did not do, with the reason. Judgment about what not to build reads as maturity.",
    ],
    scale:
      "Rehearse the four numbers until they are automatic: requests per second (average and peak), data volume and growth, p50/p99 latency for the main flow, and team/deploy cadence. Reports show interviewers immediately probing 'how much traffic' and 'how big is the data' — hesitating here undermines everything after it.",
    arch: "Template to adapt to your own system (draw the write path and the read path separately,\nand mark every asynchronous hop — that is the part interviewers look for):\n\n  Clients ──▶ LB/API gateway ──▶ Service A ──▶ Primary DB ──▶ Replicas\n                    │                │\n                    │                └──▶ Cache (what, TTL, invalidation)\n                    ▼\n               Queue/Kafka ──▶ Workers ──▶ Downstream / third parties\n                                   │\n                                   └──▶ Retries, DLQ, alerting\n\nAnnotate each box with: purpose, scale, failure behaviour, and the alternative you rejected.",
    svc: [
      {
        n: "For every box, be ready with",
        d: "What it does, why it exists, what it would cost to remove, and what happens when it fails.",
      },
      {
        n: "For every datastore",
        d: "Why this engine, the size, the hottest query, the index that makes it work, and the migration you would need if it doubled.",
      },
      {
        n: "For every async hop",
        d: "Delivery semantics, idempotency strategy, what happens on repeated failure (DLQ), and how you detect backlog.",
      },
      {
        n: "For the whole system",
        d: "SLOs, what pages you at 3 a.m., and the last time it did.",
      },
    ],
    seq: "A five-minute structure that works\n──────────────────────────────────────────────\n1. Context   : 'It is the X service for Y — Z users, N requests/sec.'\n2. Diagram   : draw 6–10 boxes, narrate the main request end to end.\n3. Data      : the core tables and the access patterns they serve.\n4. Decisions : 'We chose A over B because C; the cost was D.'\n5. Incident  : 'Once E happened; we did F; now G prevents it.'\n6. Next      : 'The thing I would change is H, worth roughly I.'\nThen stop and let them steer — the follow-ups are where the points are.",
    db: {
      tables: [
        {
          n: "Prepare the real schema",
          cols: "the 3–4 tables at the centre of your system",
          notes:
            "Column names, the primary key, the one index that makes the hot query fast, and the thing you would model differently today.",
        },
        {
          n: "Know your numbers",
          cols: "rows, growth rate, largest table, slowest query",
          notes:
            "Interviewers ask 'how big is it' immediately; a precise answer buys credibility for everything else.",
        },
      ],
      sql: "Be ready to justify why your transactional store is what it is, and to write one real query from your system on the board — several reports describe exactly this.",
      nosql:
        "If your system uses Redis, Cassandra, Elasticsearch or Kafka, be ready to say what would break if you removed it and what you would replace it with. 'It was already there' is an acceptable start only if you follow it with an evaluation.",
      verdict:
        "The goal is not to present a perfect architecture — it is to show that you understand the one you have, including its weaknesses, and that you can reason about changing it.",
    },
    fu: [
      {
        q: "What would you improve, and why haven't you?",
        a: "Answer in three parts: the change, the expected impact in numbers, and the reason it has not happened (priority, risk, dependency). Ending with 'and here is how I would sequence it safely' turns a weakness question into a leadership answer.",
      },
      {
        q: "Why did you choose that database / queue / framework?",
        a: "Give criteria, not preferences: access pattern, consistency need, operational familiarity, cost, and what you rejected. 'Postgres because the workload is relational and under a terabyte, and because the team can operate it at 3 a.m.' is a Lead answer; 'Postgres because it is reliable' is not.",
      },
      {
        q: "What happens if component X goes down?",
        a: "Have a rehearsed answer for each box: blast radius, degraded mode, detection, recovery time. If you do not know, say what you would test to find out — that is a better answer than a guess.",
      },
      {
        q: "What was the hardest technical decision you made there?",
        a: "Pick one with a real trade-off and a real consequence, not one with an obvious right answer. Include who disagreed and how it was resolved — senior rounds are explicitly looking for how you handle disagreement at Lead level and above.",
      },
      {
        q: "How would you scale it 10×?",
        a: "Identify the first bottleneck from your own numbers (usually the primary database's write throughput or a synchronous third-party call), then give the ordered sequence of fixes with the cost of each. Naming which bottleneck arrives first is the answer; listing generic scaling techniques is not.",
      },
    ],
  },
];
