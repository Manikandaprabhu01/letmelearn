import type { DesignExample } from "@/data/types";

const src = "Source 6" as const;
const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const awesomeExamples: DesignExample[] = [
  {
    slug: "auth-system",
    title: "Design an Authentication System",
    source: src,
    difficulty: "foundational",
    minutes: 14,
    tags: ["sessions", "jwt", "sso"],
    companies: ["Auth0", "Okta", "every product with a login box"],
    summary:
      "Source 6, Easy. Prove a caller is who they claim, then keep proving it on every request without putting a password on the hot path. Sessions, JWT, refresh rotation, SSO, MFA — pick two and go deep.",
    requirements: {
      functional: [
        "Sign up / sign in with email+password and at least one SSO provider",
        "Stay signed in across devices, with sign-out-everywhere",
        "Optional MFA, password reset, API keys for machines",
      ],
      nonFunctional: ["Login p95 < 200 ms", "No plaintext secrets at rest", "Revoke a stolen session in seconds"],
    },
    apis: [
      { method: "POST", path: "/v1/auth/login", desc: "Verify credentials, start a session, set cookies." },
      { method: "POST", path: "/v1/auth/refresh", desc: "Rotate refresh token, mint a new access token." },
      { method: "POST", path: "/v1/auth/logout", desc: "Kill this session or all sessions for the user." },
    ],
    dataModel: [
      { entity: "User", fields: ["id", "email_hash", "password_hash (argon2id)", "mfa_secret_enc"] },
      { entity: "Session", fields: ["id", "user_id", "refresh_hash", "device", "expires_at", "revoked_at"] },
    ],
    architecture: [
      {
        heading: "Two tokens, one source of truth",
        body: [
          "Access token (JWT, 5–15 min, signed, not stored) rides on every API call. Refresh token (opaque, long-lived, hashed in the session store) is HttpOnly, Secure, SameSite. A stolen access token dies on its own; a stolen refresh token is rotated and the old hash is revoked.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "c", label: "Client" },
              { id: "gw", label: "API / BFF", tone: "accent" },
              { id: "auth", label: "Auth service" },
              { id: "id", label: "IdP / SSO" },
            ],
            [
              { id: "sess", label: "Session store", sub: "Redis" },
              { id: "user", label: "User DB" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "JWT vs session cookie",
        table: {
          headers: ["", "JWT access + opaque refresh", "Server session cookie"],
          rows: [
            ["Revoke", "Kill refresh; access lives until expiry unless you keep a denylist", "Delete the row — instant"],
            ["Scale", "Resource servers verify a signature, no hop", "Every request hits the session store (or a cache of it)"],
            ["Use when", "Many services, mobile, third-party APIs", "A single web origin, you want instant logout"],
          ],
        },
        callout: {
          kind: "warn",
          title: "Never put secrets in the JWT",
          text: "A JWT is a postcard. Roles and user id, fine. Emails you would be sad to leak, not fine. Sign with rotating keys (kid in the header).",
        },
      },
    ],
    tradeoffs: [
      { choice: "Opaque sessions only", pickWhen: "One origin, instant revoke is non-negotiable", cost: "Session store on every request" },
      { choice: "JWT access + rotating refresh", pickWhen: "Many services and mobile clients", cost: "Access tokens linger until expiry" },
    ],
    related: ["/hld/api-gateway", "/examples/distributed-lock", "/lld/singleton-di"],
    furtherReading: [
      { label: "Awesome list — auth system", href: "https://www.youtube.com/watch?v=uj_4vxm9u90" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "distributed-cache",
    title: "Design a Distributed Cache",
    source: src,
    difficulty: "foundational",
    minutes: 14,
    tags: ["redis", "eviction", "stampede"],
    companies: ["Redis", "Memcached", "CDN edges"],
    summary:
      "Source 6, Easy. A fleet of memory boxes in front of a slow store. The interview is not 'Redis exists' — it is placement, hashing, eviction, and what happens when the cache is empty all at once.",
    requirements: {
      functional: ["GET / SET / DEL by key", "TTL", "Optional pub/sub invalidation"],
      nonFunctional: ["Sub-ms p50 inside a zone", "Survive a node death without a thundering herd", "Memory bounded"],
    },
    architecture: [
      {
        heading: "Client-sharded memory",
        bullets: [
          "Clients (or a proxy) hash the key onto a ring of cache nodes. Consistent hashing so a restart remaps ~1/N keys, not all of them.",
          "Each node is a hash map + eviction (LRU / LFU / TTL). Persistence is optional: AOF/RDB if this cache is also a store.",
          "The origin (DB, service) is the source of truth. Cache-aside is the default: miss → load → SET. Write-through if you cannot tolerate a window of stale.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "app", label: "App fleet" },
              { id: "ring", label: "Hash ring", tone: "accent" },
              { id: "n", label: "Cache nodes" },
              { id: "db", label: "Origin DB" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Stampede",
        body: [
          "A hot key expires. Ten thousand requests miss and stampede the origin. Mitigations: probabilistic early expire, single-flight (one loader per key, others wait), slightly jittered TTLs, and a tiny stale-serve window.",
        ],
        table: {
          headers: ["Policy", "Kills"],
          rows: [
            ["LRU", "Keys nobody has touched — default"],
            ["LFU / TinyLFU", "One-hit wonders that would pollute LRU"],
            ["TTL only", "Nothing; you will OOM. Always pair with a size cap"],
          ],
        },
      },
    ],
    tradeoffs: [
      { choice: "Cache-aside", pickWhen: "Most product APIs", cost: "App owns fill + invalidation" },
      { choice: "Write-through", pickWhen: "Read-your-writes on the same key", cost: "Write latency includes the cache" },
    ],
    related: ["/hld/caching", "/lld/lru-cache", "/playgrounds/lru-cache", "/hld/consistent-hashing"],
    furtherReading: [
      { label: "Awesome list — distributed cache", href: "https://www.youtube.com/watch?v=iuqZvajTOyA" },
      { label: "Source 6 on GitHub", href: list },
    ],
    playground: "lru-cache",
  },
  {
    slug: "instagram",
    title: "Design Instagram",
    source: src,
    difficulty: "intermediate",
    minutes: 18,
    tags: ["media", "feed", "graph"],
    companies: ["Instagram", "Pixelfed"],
    summary:
      "Source 6, Medium. Photos are the payload; the follow graph is the fan-out problem. Upload asynchronously, serve from a CDN, and do not rebuild the news-feed chapter from scratch — call out where the media pipeline is the new hard part.",
    requirements: {
      functional: ["Upload a photo/video, caption, tags", "Follow graph, home feed, permalink", "Stories (24h) and likes"],
      nonFunctional: ["Upload ack in seconds, processing in the background", "Feed p95 < 200 ms", "Read-heavy, celebrity-safe"],
    },
    estimation: [
      { item: "DAU", calc: "Say 50M. 2 uploads/user/day → ~1.2k writes/s average, ~4k peak" },
      { item: "Read", calc: "Feed open 10×/day → ~6k QPS average. Cache or you are dead" },
      { item: "Media", calc: "2 MB × 100M new objects/day ≈ 200 TB/day into object storage + CDN" },
    ],
    architecture: [
      {
        heading: "Media path vs social path",
        diagram: {
          kind: "layers",
          caption: "Two systems that share a user id",
          layers: [
            { title: "Client", items: ["Camera roll", "Feed", "CDN images"] },
            { title: "API", items: ["Upload init", "Graph", "Feed mixer"] },
            { title: "Async", items: ["Transcode", "Thumbnails", "Fan-out workers"] },
            { title: "Stores", items: ["Object store", "Post metadata", "Follow graph", "Feed cache"] },
          ],
        },
        numbered: [
          "Client asks for a signed PUT URL, uploads bytes straight to object storage — the API never sees the blob.",
          "Worker transcodes, writes variants (feed, story, permalink), updates post metadata to 'ready'.",
          "Fan-out on write into followers' feed caches, except for celebrity accounts which stay pull-on-read.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Follow graph",
        body: [
          "Directed edges in a graph store or a pair of adjacency lists (followers, following) sharded by user id. Count caches for the profile header. The news-feed example already covers hybrid fan-out; here you add: media is immutable, so the feed entry is a post id, not a blob, and the client resolves URLs from the CDN.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Hybrid fan-out", pickWhen: "Anyone with > ~10k followers", cost: "Two code paths in the mixer" },
      { choice: "All pull-on-read", pickWhen: "A small product", cost: "Home-feed latency becomes a graph query" },
    ],
    related: ["/examples/news-feed", "/examples/youtube", "/hld/cdn", "/hld/message-queues"],
    furtherReading: [
      { label: "Awesome list — Instagram", href: "https://algomaster.io/learn/system-design-interviews/design-instagram" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "spotify",
    title: "Design Spotify",
    source: src,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["streaming", "catalog", "audio"],
    companies: ["Spotify", "Apple Music", "YouTube Music"],
    summary:
      "Source 6, Medium. A licensed catalog, encrypted audio chunks, playlists, and a recommendation side-car. The player must keep playing when the network hiccups — that is the deep dive, not the social graph.",
    requirements: {
      functional: ["Search catalog, play a track, playlists, follow artists", "Offline downloads on premium", "Skip, seek, radio"],
      nonFunctional: ["Start playback < 1s on broadband", "No unencrypted files on disk", "License-accurate royalty events"],
    },
    architecture: [
      {
        heading: "Catalog vs bytes",
        bullets: [
          "Metadata (track, album, artist, ISRC) lives in a searchable store. This is small and precious.",
          "Audio is chunked (Ogg/AAC), encrypted, sitting in object storage behind a CDN. The client fetches a manifest, then range-GETs chunks ahead of the playhead.",
          "A license / entitlement service answers 'may this user play this track in this country right now?' before the CDN URL is minted.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "app", label: "Player" },
              { id: "api", label: "API" },
              { id: "ent", label: "Entitlement", tone: "accent" },
              { id: "cdn", label: "Audio CDN" },
            ],
            [{ id: "cat", label: "Catalog" }, { id: "rec", label: "Reco" }, { id: "ev", label: "Play events" }],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Keep the music going",
        body: [
          "Prefetch the next 15–30s. On cell networks, drop to a lower bitrate ladder (not video-scale, but the same idea). Offline: encrypted blobs + a device-bound key in the secure enclave; a periodic online check stops a ripped library from living forever.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "CDN-only audio", pickWhen: "You are not in the ISP-box business", cost: "Egress bill; cache miss = origin" },
      { choice: "P2P assist (old Spotify)", pickWhen: "Egress was the company-killer", cost: "NAT, cheating, complexity — they left it" },
    ],
    related: ["/examples/youtube", "/examples/netflix", "/hld/cdn"],
    furtherReading: [
      { label: "Awesome list — Spotify", href: "https://algomaster.io/learn/system-design-interviews/design-spotify" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "netflix",
    title: "Design Netflix",
    source: src,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["vod", "cdn", "encoding"],
    companies: ["Netflix", "Disney+", "Prime Video"],
    summary:
      "Source 6, Medium. YouTube is UGC and a firehose of uploads. Netflix is a small catalog, enormous concurrency on opening night, and a CDN they own (Open Connect). Encode once, sit close to ISPs, remember the playhead.",
    requirements: {
      functional: ["Browse, resume, play, profiles, downloads", "Personalized home row"],
      nonFunctional: ["Opening-night millions of concurrent viewers", "Start in < 2s, no buffering on a decent link", "DRM"],
    },
    architecture: [
      {
        heading: "Control plane vs data plane",
        table: {
          headers: ["Plane", "Job"],
          rows: [
            ["Control", "Auth, catalog, bookmarks, ratings, A/B — ordinary stateless APIs + a viewing-history store"],
            ["Data", "Encoded ladders in Open Connect appliances inside ISPs, plus a public CDN fallback"],
            ["Offline encode", "Every title → many bitrates × codecs × languages. A job queue, not a user-facing API"],
          ],
        },
        diagram: {
          kind: "layers",
          layers: [
            { title: "Client", items: ["Player", "ABR", "DRM license"] },
            { title: "Control", items: ["API", "Catalog", "History", "Reco"] },
            { title: "Data", items: ["Open Connect", "Public CDN", "Origin store"] },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Adaptive bitrate",
        body: [
          "The player picks a rung of the ladder from recent throughput. Segments are 2–4s so a bad guess recovers quickly. Opening night: pre-position the title on the boxes in the ISPs you care about. That is the answer to 'how does Netflix survive a Stranger Things premiere'.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Own the ISP boxes", pickWhen: "You are the peak traffic of the internet", cost: "Hardware, ISP deals, ops" },
      { choice: "Rent a CDN", pickWhen: "A smaller catalog or a new region", cost: "Noisy neighbors, less control of placement" },
    ],
    related: ["/examples/youtube", "/hld/cdn", "/examples/job-scheduler"],
    furtherReading: [
      { label: "Awesome list — Netflix", href: "https://www.youtube.com/watch?v=psQzyFfsUGU" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "job-scheduler",
    title: "Design a Distributed Job Scheduler",
    source: src,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["cron", "leases", "queues"],
    companies: ["Airflow", "Quartz", "k8s CronJob", "Sidekiq"],
    summary:
      "Source 6, Medium. Cron that survives more than one box. Partition the schedule, lease the next due job, run it exactly-once-enough, retry with backoff, and never let two workers bill the same customer.",
    requirements: {
      functional: ["One-shot and recurring jobs", "At / cron / every-N", "Cancel, pause, inspect last run"],
      nonFunctional: ["No missed runs across a node death", "At-least-once delivery with idempotent handlers", "Thousands of due jobs per second"],
    },
    apis: [
      { method: "POST", path: "/v1/jobs", desc: "Register a job with schedule + handler + payload." },
      { method: "POST", path: "/v1/jobs/:id/cancel", desc: "Stop future runs; in-flight is best-effort." },
    ],
    architecture: [
      {
        heading: "The due-index",
        numbered: [
          "Store jobs in a DB. Secondary index: (shard, next_run_at). Shard by job id.",
          "Dispatchers poll their shard: SELECT … WHERE next_run_at <= now FOR UPDATE SKIP LOCKED (or a Redis ZSET of due times).",
          "On pick: write a lease (owner, expiry), enqueue to a worker queue, bump next_run_at for recurring jobs.",
          "Workers run, report status. Lease expiry → another dispatcher may reclaim.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "api", label: "API" },
              { id: "db", label: "Schedule DB", tone: "accent" },
              { id: "disp", label: "Dispatchers" },
              { id: "q", label: "Work queue" },
              { id: "w", label: "Workers" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Exactly once is a lie",
        body: [
          "A worker can finish the side effect and die before ack. Design handlers to be idempotent (idempotency key = run id) and accept at-least-once. For money, pair with a ledger. SKIP LOCKED (Postgres) is the one trick that makes polling schedulers safe.",
        ],
        callout: {
          kind: "insight",
          title: "Do not cron-storm",
          text: "A million jobs at midnight: jitter the next_run_at, and cap dispatcher claim batch size so you do not melt the queue.",
        },
      },
    ],
    tradeoffs: [
      { choice: "Polling + SKIP LOCKED", pickWhen: "You already have Postgres", cost: "Poll delay, DB load" },
      { choice: "Per-job timer in memory (k8s)", pickWhen: "Job count fits in the control plane", cost: "Does not span 10M jobs" },
    ],
    related: ["/hld/message-queues", "/examples/distributed-lock", "/hld/idempotency"],
    furtherReading: [
      { label: "Awesome list — job scheduler", href: "https://blog.algomaster.io/p/design-a-distributed-job-scheduler" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "tinder",
    title: "Design Tinder",
    source: src,
    difficulty: "intermediate",
    minutes: 15,
    tags: ["geo", "matching", "graph"],
    companies: ["Tinder", "Hinge", "Bumble"],
    summary:
      "Source 6, Medium. Not Yelp. People move, preferences are a vector, and a match is a mutual like — a tiny, precious edge. Geo for the deck, a graph for likes, a chat once it is mutual.",
    requirements: {
      functional: ["A deck of nearby candidates", "Like / pass", "Match on mutual like, then chat", "Filters: age, distance, prefs"],
      nonFunctional: ["Deck in < 200 ms", "No 'already passed' repeats for a while", "Location stale by minutes is fine"],
    },
    architecture: [
      {
        heading: "Deck, then graph",
        bullets: [
          "Location: coarse geohash → candidate set, filtered by prefs, ranked by a model (activity, distance, prior likes).",
          "Like/pass writes an edge. A match is when the reverse edge exists — check on write, then open a chat channel.",
          "The 'already seen' set is a bloom filter or a time-partitioned list per user so the deck does not repeat.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "loc", label: "Location ping" },
              { id: "geo", label: "Geo index", tone: "accent" },
              { id: "rank", label: "Ranker" },
              { id: "deck", label: "Deck" },
            ],
            [{ id: "like", label: "Like graph" }, { id: "chat", label: "Chat" }],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Double-write match",
        body: [
          "Like(A→B) must be atomic with 'if B→A exists, create match'. A transaction on (min(A,B), max(A,B)) as the lock key, or a compare-and-set on the pair. Then notify both through the chat/presence path. Do not poll.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Precompute decks", pickWhen: "Read-heavy evenings", cost: "Stale when someone moves city" },
      { choice: "Compute on swipe", pickWhen: "Prefs change a lot", cost: "Heavier reads" },
    ],
    related: ["/examples/proximity", "/examples/chat", "/examples/nearby-friends"],
    furtherReading: [
      { label: "Awesome list — Tinder", href: "https://www.youtube.com/watch?v=tndzLznxq40" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "google-search",
    title: "Design Google Search",
    source: src,
    difficulty: "intermediate",
    minutes: 18,
    tags: ["index", "rank", "crawl"],
    companies: ["Google", "Bing", "Elastic"],
    summary:
      "Source 6, Medium. Four machines: crawl, invert, rank, serve. Do not design PageRank on the whiteboard for thirty minutes — name it, then deep-dive serving a query from a sharded inverted index under a tight latency SLO.",
    requirements: {
      functional: ["Keyword query → ranked URLs + snippets", "Fresh enough for news", "Spell / autocomplete (reuse that example)"],
      nonFunctional: ["p95 < 200 ms worldwide", "Index of tens of billions of pages", "Crawl politely"],
    },
    architecture: [
      {
        heading: "The four boxes",
        numbered: [
          "Crawler: frontier queue, DNS cache, politeness per host, canonicalization, the web-crawler example.",
          "Indexer: documents → tokens → posting lists (doc id, tf, positions). Sharded by term.",
          "Ranker: BM25 + signals (pagerank, freshness, locale). Offline scores stored next to the postings.",
          "Serving: query → tokenize → fetch postings → intersect / WAND → top-k → snippets.",
        ],
        diagram: {
          kind: "layers",
          layers: [
            { title: "Online", items: ["Query front end", "Index shards", "Snippet cache"] },
            { title: "Offline", items: ["Crawler", "Indexer", "Link graph / PageRank"] },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Serving a query",
        body: [
          "Broadcast the query to index shards (term-sharded or doc-sharded). Term-sharded: rare terms hit one shard, intersection needs scatter-gather. Doc-sharded: every shard does a local top-k, the mixer merges. Most web search is doc-sharded because it parallelizes evenly.",
        ],
        callout: {
          kind: "insight",
          title: "Snippets",
          text: "You need positions or a stored field per doc to highlight. That is why posting lists keep offsets, and why the document store is not optional.",
        },
      },
    ],
    tradeoffs: [
      { choice: "Doc-sharded index", pickWhen: "Even load, simple mixer", cost: "Every query touches every shard (or a random subset)" },
      { choice: "Term-sharded index", pickWhen: "Enormous vocabulary, rare terms", cost: "Hot terms, harder intersection" },
    ],
    related: ["/examples/web-crawler", "/examples/autocomplete", "/hld/sharding"],
    furtherReading: [
      { label: "Awesome list — Google Search", href: "https://www.youtube.com/watch?v=CeGtqouT8eA" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "uber",
    title: "Design Uber",
    source: src,
    difficulty: "advanced",
    minutes: 18,
    tags: ["dispatch", "geo", "matching"],
    companies: ["Uber", "Lyft", "Grab", "Ola"],
    summary:
      "Source 6, Hard. Live location of drivers, a matching engine that does not ping-pong the same car, ETAs, and surge as a pricing valve — not a moral essay. Deep-dive dispatch.",
    requirements: {
      functional: ["Rider requests a trip", "Match a driver, show ETA and live location", "Turn-by-turn, fare, ratings"],
      nonFunctional: ["Match in a few seconds", "Location every ~1–4s while on trip", "City-scale partitions"],
    },
    estimation: [
      { item: "City", calc: "50k drivers, 200k concurrent riders peak. Location pings 50k/2s ≈ 25k writes/s for that city" },
    ],
    architecture: [
      {
        heading: "City shard + dispatch",
        bullets: [
          "Partition by city (or a large geohash). A driver is in one ring. Cross-city is rare and can be slow.",
          "Location stream: driver app → ingest → in-memory geo index (Redis GEO / custom) for that city. The disk copy is for analytics, not matching.",
          "Request: cover the pickup with cells, pull idle drivers, score (ETA, rating, destination, battery), offer to the top one with a short timeout, fall down the list.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "r", label: "Rider" },
              { id: "api", label: "Trip API" },
              { id: "m", label: "Matcher", tone: "accent" },
              { id: "d", label: "Driver" },
            ],
            [{ id: "geo", label: "Live geo index" }, { id: "map", label: "ETA / maps" }, { id: "pay", label: "Fare" }],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Do not double-dispatch",
        body: [
          "The offer is a lease on the driver ('pending', 10s). Compare-and-set from idle → pending → on_trip. Two matchers racing is the bug; the city shard + a lock on driver id fixes it. Surge is a multiplier computed from (demand in cell / idle supply) over a short window — a cache, not a transaction.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Offer one driver at a time", pickWhen: "You want acceptance quality", cost: "Slower match" },
      { choice: "Broadcast to N", pickWhen: "Supply is thin", cost: "First-accept races, unhappy drivers" },
    ],
    related: ["/examples/proximity", "/examples/food-delivery", "/examples/google-maps", "/hld/websockets"],
    furtherReading: [
      { label: "Awesome list — Uber", href: "https://www.youtube.com/watch?v=umWABit-wbk" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "food-delivery",
    title: "Design a Food Delivery App",
    source: src,
    difficulty: "advanced",
    minutes: 16,
    tags: ["marketplace", "dispatch", "logistics"],
    companies: ["DoorDash", "Uber Eats", "Swiggy", "Zomato"],
    summary:
      "Source 6, Hard. Three sides: diner, merchant, courier. The new hard part versus Uber is the merchant's prep time — you cannot dispatch a courier at request time if the burger is 18 minutes out.",
    requirements: {
      functional: ["Browse nearby menus, cart, pay, track", "Merchant accepts and marks ready", "Courier pickup → dropoff"],
      nonFunctional: ["Hot food, not just a short route", "Menu reads are cacheable; orders are not"],
    },
    architecture: [
      {
        heading: "Order as a state machine",
        numbered: [
          "Place order → payment hold → merchant accept (timeout → cancel / re-route).",
          "Estimate ready_at = now + quoted prep. Dispatch the courier so they arrive near ready_at, not now.",
          "Pickup, dropoff, capture payment, tip. Each transition is an event on the order log.",
        ],
        diagram: {
          kind: "layers",
          layers: [
            { title: "Diner", items: ["Menu CDN", "Cart", "Track"] },
            { title: "Merchant", items: ["Tablet", "Prep clock"] },
            { title: "Courier", items: ["Offer", "Nav", "Proof of drop"] },
            { title: "Platform", items: ["Order log", "Dispatch", "Payments"] },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Delayed dispatch",
        body: [
          "Naive Uber-style 'match now' parks couriers in the restaurant. Score candidates on (time-to-restaurant vs remaining prep), stacked orders (same merchant, nearby dropoffs), and courier destination. Batching two orders onto one courier is the margin.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Dispatch late", pickWhen: "Prep time is trustworthy", cost: "A late courier if the kitchen lies" },
      { choice: "Dispatch early + wait", pickWhen: "You cannot trust prep quotes", cost: "Courier utilization" },
    ],
    related: ["/examples/uber", "/examples/payment", "/examples/hotel-reservation"],
    furtherReading: [
      { label: "Awesome list — DoorDash", href: "https://www.youtube.com/watch?v=iRhSAR3ldTw" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "google-docs",
    title: "Design Google Docs",
    source: src,
    difficulty: "advanced",
    minutes: 18,
    tags: ["crdt", "ot", "collaboration"],
    companies: ["Google Docs", "Figma", "Notion"],
    summary:
      "Source 6, Hard. Concurrent edits on one document without a single 'save' button. Operational Transform (Docs historically) or CRDTs (Figma, many new tools). Presence, snapshots, offline — pick OT-vs-CRDT as the deep dive.",
    requirements: {
      functional: ["Many cursors, live characters, comments", "Share / ACL", "Offline then merge", "Version history"],
      nonFunctional: ["Keystroke feels local (< 50 ms)", "Eventual identical docs", "A 100-page doc does not download every time"],
    },
    architecture: [
      {
        heading: "A document is a stream",
        bullets: [
          "Client applies the keystroke locally (optimistic), sends an op to the doc server.",
          "Doc server is the sequencer for that doc id (sticky). It transforms / orders ops, persists the log, broadcasts to other peers on the websocket.",
          "Snapshots every N ops so a late joiner does not replay the whole history. History / undo is the log.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "a", label: "Client A" },
              { id: "s", label: "Doc server", sub: "sticky", tone: "accent" },
              { id: "b", label: "Client B" },
            ],
            [{ id: "log", label: "Op log" }, { id: "snap", label: "Snapshots" }, { id: "acl", label: "ACL" }],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "OT vs CRDT",
        table: {
          headers: ["", "Operational Transform", "CRDT"],
          rows: [
            ["Idea", "A central sequencer rewrites concurrent ops against each other", "Math that converges without a center"],
            ["Docs", "Google Docs, older Office Online", "Figma, Automerge, Yjs, many local-first apps"],
            ["Cost", "Server is a bottleneck per doc; transform code is famously subtle", "Metadata bloat; need compaction"],
          ],
        },
        callout: {
          kind: "note",
          title: "Interview move",
          text: "Say you would put a sequencer on doc id (consistent hash), keep the log in a DB, snapshot to object storage. Then pick OT if you want a Google-Docs-shaped answer, CRDT if you want offline-first.",
        },
      },
    ],
    tradeoffs: [
      { choice: "OT + sequencer", pickWhen: "Always-online, Google-Docs-like", cost: "Server availability is the doc's availability" },
      { choice: "CRDT", pickWhen: "Offline / P2P / local-first", cost: "Tombstones, compaction, larger payloads" },
    ],
    related: ["/examples/zoom", "/hld/websockets", "/hld/consistency"],
    furtherReading: [
      { label: "Awesome list — Google Docs", href: "https://www.youtube.com/watch?v=2auwirNBvGg" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "zoom",
    title: "Design Zoom",
    source: src,
    difficulty: "advanced",
    minutes: 16,
    tags: ["webrtc", "sfu", "realtime"],
    companies: ["Zoom", "Meet", "Teams"],
    summary:
      "Source 6, Hard. Real-time audio/video for 2 to a few thousand. The key word is SFU: Selective Forwarding Unit — the server forwards packets, it does not mix every tile into one video (MCU) except as a fallback.",
    requirements: {
      functional: ["Join a meeting, A/V, screen share, chat", "Mute, gallery, recording", "Waiting room, host controls"],
      nonFunctional: ["Mouth-to-ear < 150–200 ms", "Survive home NATs", "A 1k webinar is not 1k full meshes"],
    },
    architecture: [
      {
        heading: "Signal vs media",
        bullets: [
          "Signaling (join, SDP, mute, roster) is a small websocket/JSON API. Easy. Not the hard part.",
          "Media: WebRTC to an SFU in a nearby region. The SFU receives each sender's simulcast (2–3 bitrates) and forwards the appropriate rung to each receiver.",
          "NAT: STUN first, TURN (relay) if both sides are symmetric-NAT. Budget TURN — it is the expensive path.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "a", label: "Client A" },
              { id: "sfu", label: "SFU", tone: "accent" },
              { id: "b", label: "Client B" },
            ],
            [{ id: "sig", label: "Signaling" }, { id: "turn", label: "TURN" }, { id: "rec", label: "Recorder" }],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Why not mesh, why not MCU",
        table: {
          headers: ["Topology", "When"],
          rows: [
            ["Mesh", "2–3 people, no server media cost"],
            ["SFU (default)", "Meetings. Server CPU is packet-forward, not encode"],
            ["MCU", "Phone dial-in, very weak clients, composed recordings"],
          ],
        },
        body: [
          "Recording is a hidden client of the SFU (or a compositor). Chat piggybacks on signaling. For a webinar, most 'participants' are receive-only — that is how 1k works.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "SFU + simulcast", pickWhen: "Almost every meeting product", cost: "Uplink carries extra rungs" },
      { choice: "SVC (one stream, layers)", pickWhen: "You control the encoder", cost: "Harder, fewer client codecs" },
    ],
    related: ["/examples/chat", "/examples/google-docs", "/hld/websockets"],
    furtherReading: [
      { label: "Awesome list — Zoom", href: "https://www.youtube.com/watch?v=G32ThJakeHk" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "ticket-booking",
    title: "Design a Ticket Booking System",
    source: src,
    difficulty: "advanced",
    minutes: 15,
    tags: ["inventory", "holds", "flash sale"],
    companies: ["BookMyShow", "Ticketmaster", "IRCTC"],
    summary:
      "Source 6, Hard. A finite seat map, a flash crowd, and the rule that two people cannot own seat 14F. Holds with TTL, a wait-queue in front of checkout, and a ledger so a crash does not un-sell a sold seat.",
    requirements: {
      functional: ["Browse events, pick seats, pay, issue ticket", "Hold seats for a few minutes at checkout"],
      nonFunctional: ["No double-sell", "On-sale minute must not melt the origin", "Idempotent payment"],
    },
    architecture: [
      {
        heading: "Hold, then pay, then commit",
        numbered: [
          "On-sale: a waiting-room queue (virtual) so only N checkouts run at once.",
          "Select seats → write holds (seat_id, user, expires_at) with a unique constraint on seat_id. TTL worker releases.",
          "Payment with an idempotency key. On success, hold → sold, mint a ticket id, email.",
          "The seat map the UI draws is a cache; the constraint in the hold table is the truth.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "q", label: "Waiting room" },
              { id: "map", label: "Seat map cache" },
              { id: "hold", label: "Hold table", tone: "accent" },
              { id: "pay", label: "Payment" },
              { id: "tix", label: "Ticket" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "The unique constraint is the design",
        body: [
          "Do not 'check then insert'. INSERT hold … ON CONFLICT seat_id DO NOTHING and see if you won. Same energy as the hotel-reservation example; here the unit is a seat, not a night, and the crowd is spikier — hence the waiting room.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Hard unique holds", pickWhen: "Assigned seating", cost: "Hot rows on popular seats" },
      { choice: "GA inventory counter", pickWhen: "General admission", cost: "No seat map; still needs atomic decrement" },
    ],
    related: ["/examples/hotel-reservation", "/examples/payment", "/hld/idempotency"],
    furtherReading: [
      { label: "Awesome list — BookMyShow", href: "https://www.youtube.com/watch?v=lBAwJgoO3Ek" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "distributed-lock",
    title: "Design a Distributed Locking Service",
    source: src,
    difficulty: "advanced",
    minutes: 16,
    tags: ["consensus", "leases", "chubby"],
    companies: ["Chubby", "ZooKeeper", "etcd", "Consul"],
    summary:
      "Source 6, Hard. Coarse-grained locks for leaders, not for every row. Leases so a dead holder does not hold forever, and fencing tokens so a pause-then-resume holder cannot write after losing the lock. This is Chubby, not Redis SETNX.",
    requirements: {
      functional: ["Acquire / renew / release a named lock", "Ephemeral nodes / watches for membership", "Read small config files"],
      nonFunctional: ["A handful of locks, held for minutes to hours", "Survive a minority of replica deaths", "Fencing against split brains"],
    },
    architecture: [
      {
        heading: "A tiny replicated filesystem",
        body: [
          "A handful of replicas run Raft/Paxos. One leader handles writes. A lock is a file with contents = {holder, fencing_token, lease_expiry}. Acquire is 'create if not exists' or 'compare-and-set if expired'. Clients must heartbeat to renew.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "c", label: "Clients" },
              { id: "l", label: "Lock leader", tone: "accent" },
              { id: "r", label: "Raft replicas" },
            ],
          ],
        },
        table: {
          headers: ["Primitive", "Use"],
          rows: [
            ["Lock / lease", "Primary election, shard owner"],
            ["Fencing token (monotonic)", "Storage rejects lower tokens from a zombie"],
            ["Watch", "Cache invalidation, membership"],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Why SETNX is not enough",
        body: [
          "Redis SET NX EX is a single node (or a failover that can lose the last write). A GC pause can expire the key while the holder is still working. The holder then writes. The fix Kleppmann wrote up: the lock service hands out a monotonic fencing token; the data store enforces 'token ≥ last token' on every write. Mention this out loud.",
        ],
        callout: {
          kind: "warn",
          title: "Do not lock every row",
          text: "Chubby holds thousands of locks, not billions. Per-row mutual exclusion belongs in the database (transactions, compare-and-set), not in a lock service.",
        },
      },
    ],
    tradeoffs: [
      { choice: "etcd / ZooKeeper", pickWhen: "You need watches and membership too", cost: "Ops, session semantics" },
      { choice: "DB advisory locks", pickWhen: "One primary database, short critical sections", cost: "Tied to that DB's availability" },
    ],
    related: ["/hld/consensus", "/hld/availability", "/examples/kv-store", "/examples/job-scheduler"],
    furtherReading: [
      { label: "How to do distributed locking — Kleppmann", href: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html" },
      { label: "Chubby paper", href: "https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
