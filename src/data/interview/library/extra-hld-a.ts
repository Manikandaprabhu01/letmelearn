// Imported from the Interview Prep Console (lib/extra-hld-a.js).
import type { HldAnswer } from "../types";

export const extraHldA: HldAnswer[] = [
  {
    id: "x-urlshortener",
    t: "Design a URL shortener (TinyURL / Bit.ly)",
    src: ["DesignGurus", "InterviewBit", "IGotAnOffer"],
    r: 2,
    star: true,
    stmt: "The single most-listed system design question across every top page. Deceptively simple: the whole interview lives in key generation, the read path and expiry.",
    ask: [
      {
        q: "Custom/vanity aliases, or generated keys only?",
        a: "Both — vanity keys are a uniqueness check against the same table.",
      },
      {
        q: "Do links expire? Are they editable or deletable?",
        a: "Optional TTL, deletable by owner, not editable (a changed target breaks trust).",
      },
      {
        q: "Analytics per click?",
        a: "Yes — counts, referrer, geography — computed asynchronously, never on the redirect path.",
      },
      {
        q: "Scale?",
        a: "100M new links/month, ~10K redirects/sec peak, 100:1 read:write.",
      },
      {
        q: "Can two identical long URLs share a key?",
        a: "Deduplicating saves space but breaks per-link analytics and expiry; default to one key per creation unless asked.",
      },
      {
        q: "Latency target?",
        a: "Redirect under 50 ms p99 — it is a user-visible hop before the real page load.",
      },
    ],
    fr: [
      "Create a short link for a long URL, optionally with a custom alias and TTL",
      "Redirect a short key to the original URL",
      "Delete or expire a link",
      "Per-link click analytics",
      "Rate limit creation per account to stop abuse",
    ],
    nfr: [
      "Redirect p99 under 50 ms, availability 99.99% (a dead shortener breaks every embedded link)",
      "Keys must be unguessable enough that enumeration is impractical",
      "No key collisions, ever",
      "Analytics may lag by minutes; redirects may not",
    ],
    scale:
      "100M links/month ≈ 40/sec average creation, 10K/sec redirects. Storage: 100M × ~500 bytes ≈ 50 GB/month, ~600 GB/year — small. Key space: base62 with 7 characters = 62^7 ≈ 3.5 trillion, enough for centuries at this rate. The working set is tiny: the hot 20% of links serve most redirects, so a few GB of cache absorbs almost all reads.",
    arch: "  Client ──▶ CDN/edge ──▶ API gateway\n                              │\n              ┌───────────────┴───────────────┐\n              ▼                               ▼\n      Create service                   Redirect service\n         │      │                         │        │\n         │      └──▶ ID generator         │        └──▶ Redis (key → URL)\n         │            (counter ranges)    │              cache-aside\n         ▼                                ▼\n    Key-value store  ◀────────────────────┘\n    (short_key → long_url)\n         │\n         └──▶ Kafka: click events ──▶ Analytics (ClickHouse) ──▶ dashboards",
    svc: [
      {
        n: "ID generator",
        d: "Hands out ranges of a monotonic counter (e.g. 10,000 ids at a time) so servers allocate locally and hit the coordinator rarely. Base62-encode the id; XOR or permute it so keys are not sequentially guessable.",
      },
      {
        n: "Create service",
        d: "Validates the URL (scheme, length, blocklist), allocates or reserves a key, writes the row, returns the short link. Vanity aliases use a conditional insert that fails on duplicates.",
      },
      {
        n: "Redirect service",
        d: "Read-only and trivially scalable: cache lookup, store fallback, then 301/302. Emits a click event asynchronously — never blocks the redirect on analytics.",
      },
      {
        n: "Store",
        d: "A key–value store (DynamoDB/Cassandra) or sharded SQL keyed by short_key. One access pattern, no joins, billions of rows.",
      },
      {
        n: "Analytics pipeline",
        d: "Kafka → stream aggregation → columnar store; counters per link per hour/day, plus geo and referrer breakdowns.",
      },
    ],
    seq: "Create\n─────────────────────────────────────────────\nClient → API     : POST /links {longUrl, ttl?, alias?}\nAPI → Validator  : scheme, length, malware blocklist\n  alt vanity alias\n    API → Store  : conditional insert (fail on duplicate) → 409\n  else\n    API → IdGen  : next id from local range\n    API → API    : base62(permute(id)) → key\n    API → Store  : put(key, longUrl, owner, ttl)\nAPI → Client     : 201 {shortUrl}\n\nRedirect\n─────────────────────────────────────────────\nClient → Redirect : GET /{key}\nRedirect → Redis  : GET key\n  alt hit (≈95%)\n    Redirect → Client : 302 Location: longUrl\n  else\n    Redirect → Store  : get(key)\n    alt missing or expired\n      Redirect → Client : 404\n    else\n      Redirect → Redis  : SETEX key ttl longUrl\n      Redirect → Client : 302\nRedirect → Kafka  : click event (async, fire and forget)",
    db: {
      tables: [
        {
          n: "links (KV / sharded SQL)",
          cols: "short_key PK, long_url, owner_id, created_at, expires_at, is_active",
          notes:
            "Single access pattern (key → URL). Shard by short_key hash. TTL handled natively by DynamoDB/Cassandra, or by a partition drop in SQL.",
        },
        {
          n: "vanity_reservations",
          cols: "alias PK, owner_id, created_at",
          notes:
            "Only needed if vanity keys live in a separate namespace; otherwise the links table's primary key enforces uniqueness.",
        },
        {
          n: "id_ranges",
          cols: "range_id PK, assigned_to, start, end, assigned_at",
          notes:
            "The counter allocator — the only strongly consistent write in the system, and it is touched once per 10,000 links.",
        },
        {
          n: "click_events (Kafka → ClickHouse)",
          cols: "key, ts, referrer, country, device",
          notes: "Append-only, columnar, partitioned by day; never queried on the redirect path.",
        },
        {
          n: "link_stats",
          cols: "short_key, day, clicks, uniques",
          notes: "Pre-aggregated rollups for the dashboard.",
        },
      ],
      sql: "SQL fits the small relational parts: accounts, ownership, API keys, and the id-range allocator that needs a real transaction. It also works for the links table itself at moderate scale (hundreds of millions of rows with partitioning), and you keep secondary indexes for 'my links' listings.",
      nosql:
        "The links table is the textbook key–value workload: one key, one value, no joins, billions of rows, heavy read skew, native TTL. DynamoDB or Cassandra scales that horizontally without you building sharding. Redis fronts it for the hot set; ClickHouse holds the click stream because analytics queries are scans and aggregations, not point lookups.",
      verdict:
        "KV store for links + Redis cache + SQL for accounts and id ranges + columnar store for analytics. The sentence that lands: 'the redirect path must never touch a database that can be slowed down by analytics, so those two workloads never share a store.'",
    },
    fu: [
      {
        q: "How do you generate keys without collisions?",
        a: "Counter + base62 is collision-free by construction; hashing needs a uniqueness check and a retry salt. If keys must be unguessable, permute the counter (Feistel network or XOR with a secret) rather than switching to random keys and dealing with birthday collisions.",
      },
      {
        q: "301 or 302?",
        a: "302 keeps every click coming to you (analytics, revocation) at the cost of traffic; 301 lets browsers and CDNs cache and cuts your load but makes analytics and deletion unreliable. Most commercial shorteners choose 302 for exactly that reason.",
      },
      {
        q: "How do you stop abuse (phishing, malware)?",
        a: "Rate limit creation per account and IP, check targets against a safe-browsing blocklist at creation and re-scan asynchronously, allow reporting, and support instant revocation — which is another argument for 302.",
      },
      {
        q: "How do you expire billions of links?",
        a: "Native TTL in the KV store, or time-partitioned tables you can drop. Never a DELETE sweep. Expired keys should 410 rather than 404 if you want to distinguish 'was here' from 'never existed'.",
      },
      {
        q: "Multi-region?",
        a: "Redirects are read-only, so replicate the store to every region and serve locally; creation can stay in one region (it is 40/sec) or use region-prefixed key ranges so each region allocates independently without coordination.",
      },
    ],
  },
  {
    id: "x-typeahead",
    t: "Design search autocomplete / typeahead",
    src: ["DesignGurus", "Educative", "Exponent"],
    r: 3,
    stmt: "Suggest completions as the user types, ranked by popularity, in under 100 ms. Asked at Google, Amazon, LinkedIn and most product companies.",
    ask: [
      {
        q: "Prefix matching only, or fuzzy/typo tolerance?",
        a: "Prefix first, then discuss fuzzy as an extension (edit distance ≤ 1).",
      },
      {
        q: "How fresh must suggestions be?",
        a: "Trending terms within minutes; the long tail can be hours old.",
      },
      {
        q: "Personalised or global?",
        a: "Global ranking with a light personalisation re-rank, so the heavy index stays shared.",
      },
      {
        q: "Scale?",
        a: "10B searches/day, 10 suggestions per keystroke, ~5 keystrokes per query — so suggestion QPS is roughly 5× search QPS.",
      },
      {
        q: "Do we need to filter adult/abusive terms?",
        a: "Yes — a blocklist applied at index build and at serve time.",
      },
    ],
    fr: [
      "Return the top k completions for a prefix, ranked by popularity",
      "Update rankings as query frequencies change",
      "Support per-language and per-region suggestion sets",
      "Filter blocked terms",
      "Optional personalisation from the user's own history",
    ],
    nfr: [
      "p99 under 100 ms end to end, including the network — the box must feel instant",
      "Extremely read-heavy; writes are batch index builds",
      "Stale by minutes is fine, wrong is not",
      "Index must fit in memory on serving nodes",
    ],
    scale:
      "Assume 5B suggestion requests/day ≈ 60K/sec average, 200K/sec peak. A trie over 100M distinct queries with top-10 cached per node is roughly 100M × (term + 10 × ids) ≈ tens of GB — so shard the trie by prefix across nodes and keep it in memory. Query logs: 10B/day × 100 bytes ≈ 1 TB/day into the aggregation pipeline.",
    arch: "  Client (debounced keystrokes)\n      │  GET /suggest?q=lon\n      ▼\n  CDN / edge cache (short TTL per prefix)\n      │\n      ▼\n  Suggestion service ──▶ in-memory trie shard (by prefix)\n      │                    each node caches its top-k\n      │\n      ├──▶ personalisation re-rank (user history, optional)\n      └──▶ blocklist filter\n\n  OFFLINE / NEAR-REAL-TIME\n  Query logs ──▶ Kafka ──▶ aggregation (hourly counts, decay)\n                         ──▶ trie builder ──▶ versioned index\n                         ──▶ atomic swap into serving nodes",
    svc: [
      {
        n: "Suggestion service",
        d: "Stateless front end that routes a prefix to the trie shard owning it, applies the blocklist and optional personalisation, and returns the top k. Debouncing and a minimum prefix length happen on the client.",
      },
      {
        n: "Trie index (sharded, in memory)",
        d: "Each node stores its top-k completions precomputed, so serving is a walk of length |prefix| plus a copy — no subtree scan at query time. That precomputation is the core idea.",
      },
      {
        n: "Aggregation pipeline",
        d: "Streams query logs, counts per term per window with time decay so last month's spike fades, and emits the frequency table the builder consumes.",
      },
      {
        n: "Index builder",
        d: "Builds a new immutable trie (or FST) from the frequency table, validates it, and publishes a version; serving nodes load and swap atomically so readers never see a half-built index.",
      },
      {
        n: "Cache layer",
        d: "Edge/CDN cache keyed by (prefix, language, region) with a 60-second TTL — short prefixes are hit constantly and cache extremely well.",
      },
    ],
    seq: "Serve\n──────────────────────────────────────────\nClient  → debounce 50–100 ms, min 2 chars\nClient  → CDN     : GET /suggest?q=lon&lang=en\n  alt cached\n    CDN → Client  : 200 [suggestions]\n  else\n    CDN → Service : miss\n    Service → Router : shard for prefix 'lon'\n    Service → Trie   : walk 'l','o','n' → node.topK\n    Service → Filter : blocklist, region rules\n    Service → Rerank : blend user history (optional)\n    Service → Client : 200 [10 suggestions]\n    Service → CDN    : cache 60 s\n\nIndex refresh (every few minutes)\n──────────────────────────────────────────\nLogs → Kafka → Aggregator : counts per term, decayed\nAggregator → Builder      : frequency table\nBuilder → Validator       : size, blocklist, sanity diffs\nBuilder → Serving nodes   : publish version N+1\nNodes → swap atomically   : readers keep using N until done",
    db: {
      tables: [
        {
          n: "trie shards (in memory)",
          cols: "prefix node → {children, topK: [(term, score)]}",
          notes:
            "Immutable per version. Rebuilt offline, never mutated in place — that is what makes lock-free reads safe.",
        },
        {
          n: "term_frequencies",
          cols: "term PK, lang, region, count_1h, count_24h, decayed_score, updated_at",
          notes: "The aggregation output that drives ranking.",
        },
        {
          n: "blocklist",
          cols: "term/pattern PK, reason, added_by",
          notes:
            "Applied at build and at serve time — belt and braces, because a bad suggestion is a PR incident.",
        },
        {
          n: "user_history (optional)",
          cols: "user_id, term, last_used, count",
          notes: "Small per-user set used only for the re-rank; kept in a KV store with TTL.",
        },
      ],
      sql: "SQL is a reasonable home for the term-frequency table and the blocklist — modest size, relational, edited by humans and batch jobs. It is not on the serving path.",
      nosql:
        "Serving is in-memory data structures, not a database: a trie (or an FST/DAWG for compactness, which is what Lucene uses). Redis or a KV store holds per-user history; Kafka carries the log stream; a columnar store holds raw query logs for analysis.",
      verdict:
        "The insight to state plainly: **autocomplete is not a database query**. Any design that does `SELECT ... WHERE term LIKE 'lon%' ORDER BY count DESC LIMIT 10` fails at this latency and scale; you precompute top-k per prefix and serve from memory.",
    },
    fu: [
      {
        q: "How do you handle typos?",
        a: "Add a fuzzy layer: index terms by deletion-neighbourhood (SymSpell) or run a bounded Levenshtein automaton against the FST. Do it as a second pass only when the exact-prefix result set is thin, so the common case stays fast.",
      },
      {
        q: "How do trending terms appear quickly?",
        a: "A small hot layer in front of the main index, built every minute from recent counts and merged at serve time. Rebuilding the whole trie every minute is unnecessary and expensive.",
      },
      {
        q: "How do you rank beyond raw frequency?",
        a: "Blend frequency, recency (time decay), click-through rate on suggestions, and personalisation. Keep the blend server-side so it can be tuned without a client release.",
      },
      {
        q: "Why shard by prefix rather than by hash?",
        a: "So a single request touches exactly one shard — a hash shard would require fan-out to every node for every keystroke. The cost is skew (many terms start with 's'), fixed by splitting hot prefixes into sub-shards.",
      },
    ],
  },
  {
    id: "x-dropbox",
    t: "Design Dropbox / Google Drive (file sync)",
    src: ["DesignGurus", "IGotAnOffer", "Educative"],
    r: 3,
    stmt: "Sync files across a user's devices with conflict handling. The difficulty is not storage — it is delta sync, metadata consistency and conflicts.",
    ask: [
      {
        q: "Max file size? Many small files or few large ones?",
        a: "Up to 50 GB; both patterns, which is why chunking matters.",
      },
      {
        q: "Do we need real-time sync or periodic?",
        a: "Near real-time via long-poll/WebSocket notification, with a poll fallback.",
      },
      {
        q: "Sharing and permissions?",
        a: "Yes — per file/folder ACLs, including public links.",
      },
      {
        q: "Offline edits on two devices — how do we resolve?",
        a: "Last-writer-wins on metadata plus a conflicted copy for content, unless the product wants merge.",
      },
      {
        q: "Scale?",
        a: "500M users, 100M DAU, average 10 GB stored each.",
      },
    ],
    fr: [
      "Upload, download, rename, move and delete files and folders",
      "Sync changes to all of a user's devices",
      "Version history and restore",
      "Share with users or via link, with permissions",
      "Work offline and reconcile on reconnect",
    ],
    nfr: [
      "Never lose or corrupt a file — durability above all",
      "Bandwidth efficient: only changed bytes cross the wire",
      "Sync latency of seconds when online",
      "Metadata operations (list a folder) under 100 ms",
    ],
    scale:
      "100M DAU × 10 file changes/day ≈ 1B metadata events/day ≈ 12K/sec. Content: if 1% of 5 EB changes daily, chunk-level dedup and delta sync are the only way to keep egress sane — this is why the design is chunk-based rather than file-based.",
    arch: "  Client (watcher + local index + chunker)\n     │  1. compute chunk hashes of changed file\n     ▼\n  Metadata service ──▶ metadata DB (files, versions, chunk lists)\n     │  2. which chunks are missing?\n     ▼\n  Block service ──▶ object storage (chunk_hash → bytes)\n     │  3. upload only missing chunks (parallel, resumable)\n     ▼\n  Notification service ──▶ long-poll/WebSocket to the user's other devices\n     │\n     └──▶ 4. peers pull the new manifest and fetch missing chunks",
    svc: [
      {
        n: "Client agent",
        d: "Watches the filesystem, splits files into content-defined chunks (rolling hash, ~4 MB average), keeps a local index of chunk hashes, and uploads only chunks the server does not have. The chunking decision is what makes delta sync possible.",
      },
      {
        n: "Metadata service",
        d: "The source of truth for the namespace: files, folders, versions, chunk manifests, ACLs. Every change increments a per-user cursor so devices can ask 'what changed since X'.",
      },
      {
        n: "Block service",
        d: "Content-addressed chunk storage in S3-style object storage. Identical chunks across users store once (with care around security — see follow-ups).",
      },
      {
        n: "Notification service",
        d: "Pushes 'your namespace changed' to connected devices; devices then pull the delta. Pushing the delta itself is tempting but makes ordering and retries harder.",
      },
      {
        n: "Sync engine (client)",
        d: "Applies remote changes, detects local conflicts, and produces conflicted copies when both sides changed the same version.",
      },
    ],
    seq: "Upload a changed file\n────────────────────────────────────────────────\nClient → Client  : chunk file, hash each chunk\nClient → Meta    : POST /commit {path, chunks[], baseVersion}\nMeta → Client    : missing chunk hashes\nloop per missing chunk\n  Client → Block : PUT chunk (pre-signed, parallel, resumable)\nClient → Meta    : POST /commit again\n  alt baseVersion is stale (someone else committed)\n    Meta → Client: 409 conflict + current version\n    Client       : create 'file (conflicted copy).ext' and commit that\n  else\n    Meta → DB    : new version row, cursor++\n    Meta → Notify: fan out to the user's devices\n\nAnother device syncs\n────────────────────────────────────────────────\nDevice → Notify : long-poll (waits)\nNotify → Device : namespace changed\nDevice → Meta   : GET /delta?cursor=N\nMeta → Device   : changes + new cursor\nDevice → Block  : GET only the chunks it lacks\nDevice → disk   : assemble and write atomically (temp + rename)",
    db: {
      tables: [
        {
          n: "files",
          cols: "file_id PK, user_id/namespace_id, path, current_version, is_dir, deleted_at, updated_at",
          notes:
            "Index (namespace_id, path) for lookups and (namespace_id, updated_at) for delta queries.",
        },
        {
          n: "file_versions",
          cols: "file_id, version, size, chunk_hashes[], created_by, created_at",
          notes:
            "Version history is just the manifest list — cheap, because chunks are shared between versions.",
        },
        {
          n: "chunks",
          cols: "chunk_hash PK, size, refcount, storage_key",
          notes: "Content-addressed; refcounted so deletion is safe. The dedup layer.",
        },
        {
          n: "namespace_cursor",
          cols: "namespace_id, cursor",
          notes:
            "Monotonic per namespace; the entire sync protocol is 'give me changes after cursor N'.",
        },
        {
          n: "acl",
          cols: "file_id, principal, permission, inherited_from",
          notes: "Folder inheritance resolved at write time or at read time — say which and why.",
        },
      ],
      sql: "Metadata is strongly relational and consistency-critical: a file's version, its chunk manifest and its ACL must change atomically, and delta queries need ordered cursors. Sharded SQL (by namespace/user) is the standard answer — Dropbox itself famously runs sharded MySQL for this.",
      nosql:
        "Chunks live in object storage keyed by content hash — never in a database. A KV store or Redis caches hot metadata and holds device-connection state. The notification layer is a pub/sub system, not a table.",
      verdict:
        "Sharded SQL for metadata + object storage for content + pub/sub for notifications. The line that earns the round: 'shard by namespace so one user's entire sync is a single-shard transaction, which is what makes cursors and conflict detection simple'.",
    },
    fu: [
      {
        q: "How do you handle two devices editing offline?",
        a: "Version-based optimistic concurrency: a commit carries the base version; if it no longer matches, the server rejects and the client creates a conflicted copy. Silent last-writer-wins loses data, and true merging only works for structured formats.",
      },
      {
        q: "Is cross-user deduplication safe?",
        a: "It leaks information — an attacker can test whether a file exists by observing whether upload is skipped. Mitigate with per-user encryption keys (which kills cross-user dedup) or by always uploading and deduplicating server-side.",
      },
      {
        q: "How do you sync a 50 GB file efficiently?",
        a: "Content-defined chunking (rolling hash) so an insert in the middle shifts only local chunk boundaries rather than every chunk, plus parallel and resumable uploads. Fixed-size chunking would re-upload everything after an insertion.",
      },
      {
        q: "How do devices stay in sync without polling constantly?",
        a: "Long-poll or WebSocket with a short heartbeat, and a poll fallback for restrictive networks. The push carries only 'something changed' — the device pulls the authoritative delta, which keeps ordering correct under retries.",
      },
    ],
  },
  {
    id: "x-videostreaming",
    t: "Design YouTube / Netflix (video upload and streaming)",
    src: ["DesignGurus", "IGotAnOffer", "Educative"],
    r: 3,
    stmt: "Two distinct problems in one question: an offline transcoding pipeline for uploads, and a globally distributed delivery path for playback. Say that split in your first minute.",
    ask: [
      {
        q: "User-generated uploads (YouTube) or curated catalogue (Netflix)?",
        a: "Assume user-generated — it includes the harder ingest pipeline.",
      },
      {
        q: "Live streaming in scope?",
        a: "No, VOD only, unless they ask — live changes the pipeline to low-latency segments.",
      },
      {
        q: "Which devices and networks?",
        a: "Everything from a 2G phone to a 4K TV, which is why adaptive bitrate is mandatory.",
      },
      {
        q: "Scale?",
        a: "500M DAU, 1B hours watched daily, 500 hours uploaded per minute.",
      },
      {
        q: "DRM and geo-restrictions?",
        a: "Yes for licensed content; signed URLs plus DRM licence service.",
      },
    ],
    fr: [
      "Upload a video with metadata",
      "Transcode to multiple resolutions and bitrates",
      "Stream with adaptive bitrate on any device",
      "Search and recommend",
      "Track views and watch progress (resume where you left off)",
    ],
    nfr: [
      "Playback start under 1 second; rebuffering near zero",
      "Upload processing measured in minutes, not hours",
      "Storage and egress cost dominate the P&L — design decisions are cost decisions",
      "Availability of playback above everything; upload can degrade",
    ],
    scale:
      "500 hours uploaded/minute × ~1 GB/hour raw ≈ 500 GB/minute ingest ≈ 700 TB/day, and transcoding multiplies stored bytes by roughly 2–3× across renditions. Egress dwarfs ingest: 1B watch-hours/day at ~1 GB/hour ≈ 1 exabyte/day — which is why 95%+ must be served from CDN edges and why codec efficiency (H.265/AV1) is a business decision, not a detail.",
    arch: "UPLOAD / PROCESSING (offline)\n  Creator ──pre-signed PUT──▶ raw object storage\n                                  │ event\n                                  ▼\n                        Transcoding orchestrator\n                           │ split into GOP chunks\n                           ▼\n                    Worker fleet (parallel per chunk)\n                      ├─ renditions: 240p…4K\n                      ├─ audio tracks, thumbnails\n                      └─ HLS/DASH manifests\n                                  │\n                                  ▼\n                    Processed storage ──▶ CDN origin\n                                  │\n                                  ▼\n                        Metadata DB + search index\n\nPLAYBACK (online)\n  Client ──▶ API (auth, entitlement) ──▶ signed manifest URL\n  Client ──▶ CDN edge ──▶ segments (2–10 s each, ABR ladder)\n  Client ──▶ Playback events ──▶ Kafka ──▶ views, resume, recommendations",
    svc: [
      {
        n: "Upload service",
        d: "Issues pre-signed, resumable multipart uploads straight to object storage; the API never touches video bytes.",
      },
      {
        n: "Transcoding pipeline",
        d: "Splits the source at GOP boundaries so chunks transcode in parallel across a worker fleet, then stitches manifests. Idempotent per (video, rendition, chunk) so retries are free. This parallel-chunk design is the answer to 'how do you transcode a 2-hour film quickly'.",
      },
      {
        n: "Storage tiers",
        d: "Hot (recent/popular) on fast storage near CDN origins; cold (long tail) on cheap archival with a slower first-play path. The long tail is most of the catalogue and almost none of the traffic.",
      },
      {
        n: "CDN",
        d: "Serves segments from the edge; popular titles are pre-pushed, the tail is pulled on first request. Netflix's Open Connect appliances inside ISPs are the extreme version of this.",
      },
      {
        n: "Playback service",
        d: "Authorises the viewer, applies geo/DRM rules, returns a signed manifest with short-lived URLs, and records progress events.",
      },
    ],
    seq: "Upload → watchable\n──────────────────────────────────────────────\nCreator → API   : POST /videos {title, visibility}\nAPI → Client    : pre-signed multipart upload URLs\nCreator → S3    : PUT parts (resumable)\nS3 → Queue      : ObjectCreated\nQueue → Orchestr: split into N chunks by GOP\npar each chunk × each rendition\n  Worker → S3   : transcoded segment\nOrchestrator → S3 : HLS/DASH manifests, thumbnails\nOrchestrator → DB : status = READY (per rendition)\nDB → Search/Index : make discoverable\nAPI → Creator     : notification 'your video is live'\n\nPlayback\n──────────────────────────────────────────────\nClient → API    : GET /watch/{id}\nAPI → Entitlement: geo, subscription, age check\nAPI → Client    : signed manifest URL (short TTL)\nClient → CDN    : GET manifest → segment list per bitrate\nloop while playing\n  Client        : measure throughput/buffer → pick rendition\n  Client → CDN  : GET next segment (edge hit ~95%)\nClient → Kafka  : heartbeat every 10 s (position, quality, stalls)",
    db: {
      tables: [
        {
          n: "videos",
          cols: "video_id PK, owner_id, title, description, status, duration, visibility, created_at",
          notes: "Small relational core; index (owner_id, created_at) for a channel page.",
        },
        {
          n: "renditions",
          cols: "video_id, resolution, bitrate, codec, manifest_key, status",
          notes: "One row per output; playback only offers renditions in READY state.",
        },
        {
          n: "watch_progress",
          cols: "(user_id, video_id) PK, position_sec, updated_at",
          notes: "Write-heavy and tiny — a KV store with TTL, not a relational table.",
        },
        {
          n: "view_events (Kafka → columnar)",
          cols: "video_id, user_id, ts, position, quality, stall_ms",
          notes: "Feeds view counts, recommendations and QoE dashboards; never queried live.",
        },
        {
          n: "search index (Elasticsearch)",
          cols: "video_id, title, description, tags, popularity",
          notes: "Denormalised from the metadata DB via events.",
        },
      ],
      sql: "SQL for the metadata core: videos, channels, renditions, entitlements and billing. It is relational, modest in size, and needs transactions when publishing (a video becomes visible only when all required renditions are ready).",
      nosql:
        "Object storage for all media bytes; a KV store for watch progress and session state; Kafka plus a columnar warehouse for the event firehose; Elasticsearch for search. Each is chosen because the access pattern is nothing like a relational query.",
      verdict:
        "Polyglot, with the important framing: the *database* in this system is tiny and boring. The engineering is in the transcoding pipeline and the CDN strategy, and an answer that spends its time on schema design has misjudged the question.",
    },
    fu: [
      {
        q: "How does adaptive bitrate actually work?",
        a: "The manifest lists renditions; the player measures throughput and buffer level and picks the next segment's bitrate, switching at segment boundaries (2–10 s). Keep segments short enough to adapt quickly, long enough to keep request overhead and encoding efficiency reasonable.",
      },
      {
        q: "How do you transcode a 2-hour film in minutes?",
        a: "Split at GOP boundaries and transcode chunks in parallel across hundreds of workers, then concatenate. Because chunks are independent, retries and spot instances are safe — which is also how you cut cost.",
      },
      {
        q: "What do you cache at the edge, and what do you not?",
        a: "Push the top few percent of titles (which carry most viewing) to edges proactively; pull the tail on first request with a slower cold start. Cost forbids caching everything everywhere.",
      },
      {
        q: "How do you count views accurately?",
        a: "Client heartbeats into a stream, deduplicated per session, with a minimum watch threshold before counting. Exact real-time counts are unnecessary; approximate live counts plus a batch-corrected number is standard.",
      },
      {
        q: "Live streaming instead?",
        a: "The pipeline becomes an ingest of RTMP/SRT, low-latency transcoding to short segments (1–2 s) or LL-HLS/WebRTC for sub-second, and you lose the luxury of offline processing — say what breaks rather than reusing the VOD answer.",
      },
    ],
  },
  {
    id: "x-ticketbooking",
    t: "Design a ticket booking system (BookMyShow / Ticketmaster)",
    src: ["DesignGurus", "InterviewBit", "LLDCanvas"],
    r: 3,
    stmt: "The definitive question about contention: thousands of people want the same seat at the same second, and you must never sell it twice.",
    ask: [
      {
        q: "Assigned seats or general admission?",
        a: "Assigned — that is the interesting case.",
      },
      {
        q: "How long can a seat be held during checkout?",
        a: "A 5–10 minute hold with automatic expiry.",
      },
      {
        q: "Is a queue acceptable for high-demand events?",
        a: "Yes — a virtual waiting room is the industry answer for a 100K-seat on-sale.",
      },
      {
        q: "Payment partial failure?",
        a: "Must release the hold and never leave a seat in limbo.",
      },
      {
        q: "Scale?",
        a: "Normal load is low; on-sale spikes to 100K+ concurrent users for one event.",
      },
    ],
    fr: [
      "Browse events, venues and seat maps with live availability",
      "Hold selected seats for a bounded time",
      "Confirm the booking after payment",
      "Cancel and refund by policy",
      "Handle on-sale spikes without overselling",
    ],
    nfr: [
      "Absolutely no double booking — this is a strong-consistency problem",
      "Seat map reads can be slightly stale; writes cannot",
      "Hold expiry must be reliable even if a client disappears",
      "Handle a 1000× traffic spike on a single event without taking down other events",
    ],
    scale:
      "Ordinary traffic is trivial. The design point is the spike: 100K concurrent users hammering one event's seat map, with maybe 10K seats. Reads of the map must be cached and pushed; writes must serialise per seat. All the complexity is in that asymmetry.",
    arch: "  Clients ──▶ CDN (static seat map) ──▶ API gateway\n                                            │\n                            ┌───────────────┴──────────────┐\n                            ▼                              ▼\n                    Virtual waiting room            Availability service\n                    (token, position)               (Redis: seat states,\n                            │                        pushed via WebSocket)\n                            ▼\n                      Booking service\n                        │      │\n                        │      └──▶ Redis: hold locks with TTL\n                        ▼\n                  Postgres (seats, bookings)  ← conditional UPDATE = truth\n                        │\n                        ├──▶ Payments (idempotent, webhook)\n                        └──▶ Kafka: booking events → notifications, analytics",
    svc: [
      {
        n: "Virtual waiting room",
        d: "Admits users to the purchase flow at a controlled rate with a signed token and a position estimate. This is what protects the database during an on-sale; without it, 100K clients contend for 10K rows.",
      },
      {
        n: "Availability service",
        d: "Serves the seat map from Redis and pushes updates over WebSocket so clients see seats grey out live. Deliberately eventually consistent — the authoritative check happens at hold time.",
      },
      {
        n: "Booking service",
        d: "Places holds and confirms bookings. A hold is a conditional update: `UPDATE seats SET status='HELD', hold_id=?, hold_expires_at=? WHERE seat_id IN (...) AND status='AVAILABLE'` — if the affected row count is less than requested, the whole request rolls back and the client re-picks.",
      },
      {
        n: "Hold expiry worker",
        d: "Sweeps expired holds back to AVAILABLE (or relies on a Redis key TTL plus a reconciliation pass). Never trust the client to release.",
      },
      {
        n: "Payment integration",
        d: "Idempotent charge keyed by hold id; on success the seats move to BOOKED in the same transaction as the booking row, on failure or timeout the hold expires naturally.",
      },
    ],
    seq: "On-sale purchase\n──────────────────────────────────────────────────\nUser → WaitingRoom : join queue for event E\nWaitingRoom → User : token, position 4,312\n... admitted ...\nUser → Availability: GET seat map (cached + live push)\nUser → Booking     : POST /holds {event, seats[], token}\nBooking → DB       : UPDATE seats SET status='HELD', expires=now+10m\n                      WHERE seat_id IN (...) AND status='AVAILABLE'\n  alt rows affected < requested\n    Booking → DB   : ROLLBACK\n    Booking → User : 409 'seats just went' + fresh map\n  else\n    Booking → Redis: publish seat state change → all viewers\n    Booking → User : 201 {holdId, expiresAt}\nUser → Payments    : pay (idempotency key = holdId)\n  alt success\n    Booking → DB   : status='BOOKED', create booking row (one txn)\n    Booking → Kafka: booking.confirmed → ticket, email\n  else failure/timeout\n    Expiry worker  : release seats back to AVAILABLE",
    db: {
      tables: [
        {
          n: "events / venues / seat_maps",
          cols: "event_id PK, venue_id, starts_at, on_sale_at; seat_map_id, layout JSONB",
          notes: "Static and heavily cached; the layout can live on a CDN.",
        },
        {
          n: "seats",
          cols: "seat_id PK, event_id, section, row, number, status (AVAILABLE|HELD|BOOKED), hold_id, hold_expires_at, version",
          notes:
            "The contention point. Index (event_id, status). The conditional UPDATE on this row is the entire correctness story.",
        },
        {
          n: "holds",
          cols: "hold_id PK, user_id, event_id, seat_ids[], expires_at, created_at",
          notes: "Short-lived; also mirrored as a Redis key with TTL for fast expiry.",
        },
        {
          n: "bookings",
          cols: "booking_id PK, user_id, event_id, seat_ids[], amount, payment_id UNIQUE, status, created_at",
          notes:
            "UNIQUE(payment_id) plus an idempotency key make double-charging structurally impossible.",
        },
        {
          n: "seat_state (Redis)",
          cols: "event:{id}:seats → hash of seat → state",
          notes: "Read path only; rebuilt from the database, never the source of truth.",
        },
      ],
      sql: "SQL, unambiguously, for seats and bookings. You need a transaction that flips several seat rows and writes a booking atomically, and a conditional update as the serialisation point. This is the canonical case where eventual consistency is the wrong answer, and saying so decisively is what the interviewer wants.",
      nosql:
        "Redis for the live seat map, the waiting-room queue, and hold TTLs; Kafka for downstream events. These are all derived or ephemeral — losing them costs a rebuild, not a double-sold seat.",
      verdict:
        "Strongly consistent SQL core with a cached, eventually consistent read path in front. The trade-off to state explicitly: users may briefly see a seat that is already taken, and that is acceptable because the authoritative check happens on hold; the reverse — a seat sold twice — is not acceptable at any price.",
    },
    fu: [
      {
        q: "Pessimistic locking or optimistic?",
        a: "Optimistic via conditional update is preferred: `SELECT ... FOR UPDATE` on a hot event serialises everyone behind the same rows and can deadlock across multi-seat selections (order seat ids to avoid that). The conditional UPDATE with an affected-row check gets the same guarantee without holding locks across user think-time.",
      },
      {
        q: "How do you stop bots taking every seat?",
        a: "Waiting-room tokens tied to an authenticated account, rate limits per account and device, CAPTCHA at entry, per-user seat caps, and post-hoc cancellation of detected bot orders. Also stagger on-sales.",
      },
      {
        q: "What if payment succeeds but the confirmation write fails?",
        a: "The payment is idempotent and recorded first; a reconciliation job finds paid-but-unconfirmed holds and either completes the booking or refunds automatically. Never leave the resolution to a customer support ticket.",
      },
      {
        q: "How do you scale the seat map read path?",
        a: "Serve the static layout from a CDN and overlay live state from Redis over WebSocket, batching updates every few hundred milliseconds. Polling per client at on-sale scale is what melts these systems.",
      },
    ],
  },
];
