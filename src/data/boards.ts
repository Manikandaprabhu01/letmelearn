import type { ArchitectureBoard, DiagramNode, SystemColumn } from "@/data/types";

function n(id: string, label: string, sub?: string, tone?: DiagramNode["tone"]): DiagramNode {
  return { id, label, sub, tone };
}

function col(title: string, nodes: DiagramNode[]): SystemColumn {
  return { title, nodes };
}

function board(
  caption: string,
  columns: SystemColumn[],
  walkthrough: ArchitectureBoard["walkthrough"],
): ArchitectureBoard {
  return { caption, columns, walkthrough };
}

const boards: Record<string, ArchitectureBoard> = {
  "scale-to-millions": board(
    "The ladder you redraw under every later design",
    [
      col("Clients", [n("web", "Web / mobile"), n("cdn", "CDN", "static assets", "ok")]),
      col("Edge", [
        n("dns", "DNS", "geo routing"),
        n("lb", "Load balancer", "TLS, health", "accent"),
        n("gw", "API gateway", "authn, rate limit"),
      ]),
      col("Compute", [
        n("app", "Stateless API fleet", "autoscaled"),
        n("bff", "BFF / aggregation"),
      ]),
      col("Async", [
        n("q", "Queue", "email, thumbnails", "accent"),
        n("w", "Workers"),
        n("cron", "Scheduled jobs"),
      ]),
      col("Fast state", [n("redis", "Redis", "cache, sessions"), n("rl", "Rate-limit counters")]),
      col("Storage + platform", [
        n("db", "Primary + replicas", "sharded when needed"),
        n("s3", "Object store", "blobs"),
        n("olap", "Warehouse", "analytics"),
        n("obs", "Observability", "metrics, logs, tracing"),
      ]),
    ],
    [
      {
        title: "One box, then a seam",
        text: "Start with web + DB on one host. The first production move is splitting the data store so you can scale and back it up independently.",
      },
      {
        title: "Hide compute behind a balancer",
        text: "Two app boxes + a load balancer. Sessions leave local disk (Redis or JWT) so any box can take any request.",
      },
      {
        title: "Read path gets cheap",
        text: "Replicas for reads, cache-aside for hot keys, CDN for static. Writes still hit the primary.",
      },
      {
        title: "Writes and slow work peel off",
        text: "Object store for blobs. A queue for email, thumbnails, fan-out. Shard the primary only when its write QPS or working set saturates.",
      },
    ],
  ),

  "interview-framework": board(
    "Four steps. Buy-in after the sketch. Deep-dive only two hard parts.",
    [
      col("01 Scope", [n("s", "Users, features", "QPS / SLA"), n("out", "Out of scope")]),
      col("02 Sketch", [n("api", "APIs"), n("box", "Boxes + stores", undefined, "accent")]),
      col("03 Deep dive", [n("h1", "Hard part A"), n("h2", "Hard part B")]),
      col("04 Wrap", [n("fail", "Failures"), n("next", "If we had an hour")]),
    ],
    [
      {
        title: "Scope is numbers",
        text: "Who, what, how many, how fresh, what is out. Write QPS and storage on the board. Ask if you do not have them.",
      },
      {
        title: "Sketch until they nod",
        text: "APIs, the data stores, the request path. Pause. 'Does this match what you had in mind?' The most common failure is drawing for 25 minutes on the wrong design.",
      },
      {
        title: "Deep-dive two subsystems",
        text: "Fan-out, the hash ring, the ledger, the 429 path — pick the two that make this problem itself.",
      },
      {
        title: "Wrap with failure",
        text: "Name the bottleneck, the SPOF, what another hour would buy. Interviewers grade the close.",
      },
    ],
  ),

  "rate-limiter": board(
    "Every request is a decision: allow, or 429. Redis holds the buckets.",
    [
      col("Clients", [n("c", "Apps / IPs", "API keys, tiers")]),
      col("Edge", [
        n("lb", "Load balancer"),
        n("gw", "API gateway", "limiter middleware", "accent"),
      ]),
      col("Decision", [
        n("rules", "Rules cache", "per key / route, in memory"),
        n("algo", "Token bucket", "allow or 429"),
      ]),
      col("Counters", [
        n("redis", "Redis", "atomic Lua / INCR", "ok"),
        n("local", "Local shard counters", "hot-key relief"),
      ]),
      col("Origin", [n("api", "API fleet"), n("w", "Rules worker", "config without deploy")]),
      col("Platform", [
        n("cfg", "Config store", "limits per tier"),
        n("obs", "Observability", "429 rate, top talkers"),
        n("abuse", "Abuse analytics", "offline"),
      ]),
    ],
    [
      {
        title: "Gateway sees every call",
        text: "The limiter sits in the gateway or as middleware. It loads the rule for (key, endpoint, tier) from a memory cache, not from a database on the hot path.",
      },
      {
        title: "One atomic update",
        text: "Redis INCR or a Lua script refills the token bucket and consumes one token. Two app boxes cannot both think they got the last token.",
      },
      {
        title: "Allow or 429",
        text: "On allow, forward to the API. On reject, return 429 with Retry-After and remaining quota headers. Never fail open into a billing API without saying so.",
      },
      {
        title: "Rules are a side channel",
        text: "A worker pulls the rule set so product can change limits without a deploy. If Redis is down, pick fail-open (availability) or fail-closed (correctness) out loud.",
      },
    ],
  ),

  "consistent-hashing": board(
    "Hash the key and the servers onto one circle. Owner = first vnode clockwise.",
    [
      col("Callers", [n("cli", "Clients / app fleet", "ring held locally")]),
      col("Topology", [
        n("mem", "Membership service", "etcd or gossip", "accent"),
        n("ver", "Ring version", "stamped on requests"),
      ]),
      col("Lookup", [
        n("h", "hash(key)", "64-bit"),
        n("bs", "Binary search", "first token clockwise"),
        n("v", "Virtual nodes", "~200 per host"),
      ]),
      col("Placement", [
        n("pref", "Preference list", "next N distinct hosts"),
        n("zone", "Rack / zone spread", "correlated failure"),
      ]),
      col("Nodes", [n("s1", "Server A"), n("s2", "Server B"), n("s3", "Server C")]),
      col("Repair", [
        n("hint", "Hinted handoff", "writes for a down node"),
        n("merkle", "Anti-entropy", "Merkle trees"),
        n("stream", "Bootstrap streaming", "on join"),
      ]),
    ],
    [
      {
        title: "Same hash space",
        text: "Servers (as many virtual nodes each) and keys share one circle. Lookup is 'walk clockwise to the next vnode'.",
      },
      {
        title: "Join steals an arc",
        text: "A new vnode takes the range that used to belong to its successor. Everyone else keeps their keys. That is the whole point versus modulo N.",
      },
      {
        title: "Weights are vnode counts",
        text: "A bigger box gets more vnodes so it owns more of the ring. One point per server is too coarse and load looks spiky.",
      },
      {
        title: "Replication is clockwise neighbors",
        text: "Dynamo copies a key to the next N-1 physical hosts on the ring. Open the lab and add a node — watch how few keys move.",
      },
    ],
  ),

  "kv-store": board(
    "Dynamo-class AP store: ring, quorum, gossip, LSM on disk.",
    [
      col("Client", [n("c", "Smart client", "ring-aware"), n("coord", "Coordinator node")]),
      col("Membership", [
        n("ring", "Hash ring", "vnodes", "accent"),
        n("g", "Gossip", "failure detection"),
      ]),
      col("Quorum", [
        n("w", "Write W of N"),
        n("r", "Read R of N", "R + W > N"),
        n("sloppy", "Sloppy quorum", "hinted handoff"),
      ]),
      col("Replicas", [n("n1", "Replica 1"), n("n2", "Replica 2"), n("n3", "Replica 3", "N=3")]),
      col("Engine", [
        n("log", "Commit log", "durability first"),
        n("mem", "Memtable"),
        n("sst", "SSTables", "compacted"),
        n("bloom", "Bloom filters", "skip files"),
      ]),
      col("Repair", [
        n("rr", "Read repair", "on divergence"),
        n("ae", "Anti-entropy", "Merkle sync"),
        n("obs", "Observability", "lag, hinted queue"),
      ]),
    ],
    [
      {
        title: "Coordinator hashes the key",
        text: "The client or a random node finds the N successors on the ring and becomes the coordinator for this request.",
      },
      {
        title: "Quorum write",
        text: "Write to N, wait for W acks, return. Hinted handoff parks a copy on a live neighbor if one replica is down.",
      },
      {
        title: "Quorum read + repair",
        text: "Read R copies. If they disagree, return the merged value and write it back (read repair). Merkle trees catch drift in the background.",
      },
      {
        title: "LSM on each node",
        text: "Append to a commit log + memtable, flush to immutable SSTables, compact later. Bloom filters skip files that cannot contain the key.",
      },
    ],
  ),

  "unique-id": board(
    "64-bit, roughly time-ordered, no coordination on the hot path.",
    [
      col("Callers", [n("svc", "Services", "need an id")]),
      col("Assignment", [
        n("zk", "Coordination", "worker id lease", "accent"),
        n("dc", "Datacenter", "5 bits"),
        n("w", "Worker", "5 bits"),
      ]),
      col("Mint", [
        n("t", "Timestamp", "41 bits, ms"),
        n("seq", "Sequence", "12 bits / ms", "accent"),
        n("id", "64-bit id", "roughly sortable", "ok"),
      ]),
      col("Hazards", [
        n("clock", "Clock skew", "NTP step backwards", "warn"),
        n("dup", "Duplicate worker id", "the silent killer", "warn"),
      ]),
      col("Alternatives", [
        n("uuid", "UUIDv7", "no coordination"),
        n("ticket", "Ticket server", "a bottleneck"),
        n("range", "Range allocation", "per host"),
      ]),
      col("Platform", [
        n("obs", "Observability", "skew, sequence exhaustion"),
        n("mono", "Monotonic guard", "refuse to go backwards"),
      ]),
    ],
    [
      {
        title: "Name the foils",
        text: "UUID v4 is big and unordered. DB auto-increment does not shard. A Flickr ticket server is a bottleneck. Snowflake is the default answer.",
      },
      {
        title: "Pack the 64 bits",
        text: "1 unused sign + 41 timestamp + 5 datacenter + 5 worker + 12 sequence. ~69 years, 32 DCs, 32 workers, 4096 IDs per worker per millisecond.",
      },
      {
        title: "Worker IDs are assigned",
        text: "Zookeeper / etcd hands out worker numbers at boot. The hot path does not talk to them again.",
      },
      {
        title: "Clock went backwards",
        text: "Refuse to mint until the clock catches up, or hold the last timestamp and increment sequence. Never emit a duplicate.",
      },
    ],
  ),

  "url-shortener": board(
    "Tiny writes, huge reads. Mint a code, cache the redirect, never block on analytics.",
    [
      col("Clients", [n("u", "Browser / app"), n("cdn", "CDN", "cached redirects", "ok")]),
      col("Edge", [n("lb", "Load balancer"), n("gw", "API gateway", "auth, rate limit")]),
      col("Services", [
        n("create", "Create service", "alias check"),
        n("redir", "Redirect service", "the hot path", "accent"),
      ]),
      col("IDs", [
        n("range", "Counter ranges", "leased per host"),
        n("b62", "Base62 encode", "7 chars"),
        n("bloom", "Bloom filter", "custom aliases"),
      ]),
      col("Fast state", [
        n("cache", "Redis", "key → URL, 95%+ hit", "ok"),
        n("neg", "Negative cache"),
      ]),
      col("Storage + platform", [
        n("db", "Links DB", "sharded by key"),
        n("q", "Click queue", "off the hot path"),
        n("olap", "Analytics store", "HLL uniques"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "POST mints a code",
        text: "Validate the long URL, allocate a unique integer (ticket or Snowflake), encode base62 (7 chars ≈ 3.5e12), persist, return https://host/code.",
      },
      {
        title: "GET is a cache lookup",
        text: "code → long URL in Redis, else DB, then 302. 301 is CDN-friendly but painful if the mapping ever changes.",
      },
      {
        title: "Analytics are fire-and-forget",
        text: "Enqueue the click. The redirect path does not wait on a warehouse write.",
      },
      {
        title: "Collisions",
        text: "A hash of the long URL can collide and is only useful if you want the same URL → same code. A counter never collides.",
      },
    ],
  ),

  "web-crawler": board(
    "A polite pipeline: frontier → DNS → fetch → parse → store, with a seen-set.",
    [
      col("Seeds", [n("s", "Seed URLs"), n("sm", "Sitemaps / feeds")]),
      col("Frontier", [
        n("pri", "Priority queues", "by importance", "accent"),
        n("host", "Per-host queues", "politeness"),
        n("robots", "robots.txt cache"),
      ]),
      col("Fetch", [
        n("dns", "DNS cache"),
        n("ft", "Fetcher pool", "rate-limited per host"),
        n("retry", "Retry / backoff"),
      ]),
      col("Extract", [
        n("p", "Parser", "links, text"),
        n("fp", "Simhash", "near-duplicate"),
        n("seen", "URL seen filter", "Bloom"),
      ]),
      col("Storage", [
        n("doc", "Document store"),
        n("graph", "Link graph"),
        n("idx", "To indexer", undefined, "ok"),
      ]),
      col("Platform", [
        n("sched", "Recrawl scheduler", "freshness tiers"),
        n("obs", "Observability", "fetch rate, errors"),
        n("pol", "Policy", "robots, legal"),
      ]),
    ],
    [
      {
        title: "Frontier is the scheduler",
        text: "Priority plus per-host queues so one origin cannot monopolize the crawler, and robots.txt / crawl-delay are honored.",
      },
      {
        title: "Seen-set before fetch",
        text: "Canonicalize, ask a Bloom filter, then a durable key store. False positives skip a page; false negatives waste a fetch.",
      },
      {
        title: "Fetch and parse",
        text: "DNS is cached (it is otherwise the bottleneck). Parser extracts links back into the frontier and a content fingerprint (simhash) catches mirrors.",
      },
      {
        title: "Workers are stateless",
        text: "The frontier and seen-set are shared. Recrawl frequency is a function of change rate and importance — news every minute, a parked domain every month.",
      },
    ],
  ),

  notification: board(
    "One event, many channels. Isolate providers so SMS cannot stall push.",
    [
      col("Producers", [n("p", "Product services"), n("api", "Notification API")]),
      col("Edge", [n("gw", "Gateway", "authn, quota"), n("idem", "Idempotency", "dedupe keys")]),
      col("Policy", [
        n("pref", "Preferences", "opt-out, quiet hours", "accent"),
        n("tmpl", "Templates", "localised"),
        n("rate", "Per-user rate limit"),
      ]),
      col("Fan-out", [
        n("q", "Per-channel queues", "priority lanes", "accent"),
        n("w", "Workers", "retry + backoff"),
        n("dlq", "Dead letter", undefined, "warn"),
      ]),
      col("Providers", [n("fcm", "FCM / APNs"), n("ses", "Email"), n("sms", "SMS")]),
      col("Platform", [
        n("track", "Delivery tracking", "sent, opened, bounced"),
        n("olap", "Analytics"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Ingest is a thin API",
        text: "Internal callers post { user, template, data }. The gateway authenticates and enqueues — it does not talk to Twilio on the request path.",
      },
      {
        title: "Queue per channel",
        text: "Push, email, SMS each get a queue so a slow SMS provider cannot stall fire alarms. A DLQ catches poison messages.",
      },
      {
        title: "Workers honor prefs",
        text: "Expand the template, check quiet hours and opt-outs, then call the channel adapter. Idempotency key = (user, template, window).",
      },
      {
        title: "Throttle both ways",
        text: "Providers throttle you. You also token-bucket per (user, channel) so a buggy loop cannot SMS someone 400 times.",
      },
    ],
  ),

  "news-feed": board(
    "Hybrid fan-out: push for normal users, pull celebrities at read time.",
    [
      col("Clients", [n("c", "App", "scroll, cursor"), n("cdn", "CDN", "media", "ok")]),
      col("Edge", [n("lb", "Load balancer"), n("gw", "API gateway")]),
      col("Services", [
        n("post", "Post service"),
        n("graph", "Follow graph"),
        n("mix", "Feed mixer", "push + pull", "accent"),
        n("rank", "Ranker", "candidates → order"),
      ]),
      col("Async", [
        n("q", "Event queue"),
        n("fan", "Fan-out workers", "skip celebrities", "accent"),
        n("agg", "Counter aggregator"),
      ]),
      col("Fast state", [
        n("feed", "Feed cache", "post ids, capped"),
        n("post", "Post cache", "hydration"),
      ]),
      col("Storage + platform", [
        n("db", "Post / graph DB"),
        n("obj", "Object store"),
        n("ml", "Feature store", "ranking signals"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Publish is a small write",
        text: "Store the post body once. The expensive part is telling followers it exists.",
      },
      {
        title: "Push for bounded graphs",
        text: "A worker writes the post ID onto each follower's precomputed timeline. Reads become lrange. This dies at 50M followers.",
      },
      {
        title: "Pull for celebrities",
        text: "Do not fan-out a celebrity write. At read time, merge the user's push-feed with recent posts from the celebrity IDs they follow.",
      },
      {
        title: "Mixer + ranker",
        text: "Fill bodies from a post store, attach media URLs from the CDN, optionally rank. Ranking is a separate service — do not stuff ML into the write path in 45 minutes.",
      },
    ],
  ),

  chat: board(
    "WebSocket in, a sequenced message store, pub/sub across chat servers.",
    [
      col("Clients", [n("a", "Alice", "WebSocket"), n("b", "Bob", "WebSocket", "ok")]),
      col("Edge", [
        n("lb", "L4 load balancer", "sticky by user"),
        n("ws", "Connection tier", "holds sockets", "accent"),
      ]),
      col("Routing", [
        n("reg", "Session registry", "user → server"),
        n("bus", "Pub/sub bus", "cross-server", "accent"),
        n("pres", "Presence", "heartbeat + TTL"),
      ]),
      col("Services", [
        n("msg", "Message service", "ordering per chat"),
        n("grp", "Group service", "fan-out"),
        n("push", "Push bridge", "offline devices"),
      ]),
      col("Storage", [
        n("log", "Message store", "by chat, time-ordered"),
        n("inbox", "Per-user inbox", "unread cursors"),
        n("media", "Object store", "attachments"),
      ]),
      col("Platform", [
        n("obs", "Observability", "connections, lag"),
        n("mod", "Abuse / moderation"),
        n("olap", "Analytics"),
      ]),
    ],
    [
      {
        title: "Sticky session",
        text: "Each online user lives on one chat server. A registry (Redis) maps user → server so the next hop knows where to publish.",
      },
      {
        title: "Persist, then fan-out",
        text: "Alice's server assigns a per-channel sequence number, writes the message, then publishes to the channel. Client-generated IDs make retries idempotent.",
      },
      {
        title: "Bob is online or not",
        text: "If Bob's server is subscribed, it pushes over the socket. If he is offline, the store holds the message; reconnect (or a push notification) pulls the gap.",
      },
      {
        title: "Groups are a log",
        text: "Small groups fan-out like 1:1. Huge broadcast channels are a pull-from-log, like a feed — do not write per-member copies.",
      },
    ],
  ),

  autocomplete: board(
    "Offline trie from search logs; online is a prefix lookup under 50 ms.",
    [
      col("Clients", [n("c", "Keystroke", "debounced"), n("lc", "Local cache", undefined, "ok")]),
      col("Edge", [n("cdn", "CDN / edge", "hot prefixes, ~30 s", "ok"), n("gw", "API gateway")]),
      col("Serve", [
        n("api", "Suggest API", "stateless"),
        n("shard", "Trie shards", "by prefix", "accent"),
        n("trend", "Trending overlay", "last ~30 min"),
      ]),
      col("Offline build", [
        n("log", "Search logs"),
        n("agg", "Aggregate", "threshold the tail"),
        n("build", "Trie builder", "top-k per node", "accent"),
      ]),
      col("Artefacts", [
        n("snap", "Snapshot", "immutable, checksummed"),
        n("block", "Blocklist", "query-time enforced", "warn"),
      ]),
      col("Platform", [
        n("stream", "Event stream", "5-min windows"),
        n("obs", "Observability"),
        n("olap", "Analytics", "CTR by rank"),
      ]),
    ],
    [
      {
        title: "Build offline",
        text: "Aggregate logs into (query, frequency). Cap at a frequency threshold so the dictionary stays bounded. Build a trie (or a sorted prefix table).",
      },
      {
        title: "Top-k lives on the node",
        text: "Each trie node keeps a small heap of the best completions under that prefix so a query does not walk the world.",
      },
      {
        title: "Ship a snapshot",
        text: "Servers load the snapshot into memory. Shard by first character so 's' and 't' are different hosts. Rebuild on a cadence (hourly / daily).",
      },
      {
        title: "Online is a lookup",
        text: "Every keystroke hits the API. Cache 'a', 'an', 'and'. Personalization and typos are a later layer, not v1.",
      },
    ],
  ),

  youtube: board(
    "Control plane is cheap. The data plane is object storage, transcoders, and a CDN.",
    [
      col("Clients", [n("c", "Creator", "upload"), n("p", "ABR player", "viewer", "ok")]),
      col("Edge", [
        n("cdn", "CDN POPs", "segments", "ok"),
        n("lb", "Load balancer"),
        n("gw", "API gateway"),
      ]),
      col("Control", [
        n("up", "Upload service", "presigned, resumable"),
        n("meta", "Metadata API", "titles, ACLs"),
        n("rec", "Recommendations"),
      ]),
      col("Processing", [
        n("q", "Encode queue", undefined, "accent"),
        n("x", "Transcoders", "ladder per video"),
        n("thumb", "Thumbnails"),
        n("mod", "Moderation / claims", undefined, "warn"),
      ]),
      col("Storage", [
        n("s3", "Object store", "renditions"),
        n("cold", "Cold tier", "long tail"),
        n("sql", "Metadata DB"),
      ]),
      col("Platform", [
        n("view", "View counter", "stream-aggregated"),
        n("olap", "Warehouse"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Upload skips the app server",
        text: "The client gets a presigned URL and PUTs the original into object storage. A completion callback enqueues transcode.",
      },
      {
        title: "Encode is async",
        text: "Workers emit 360p…4K plus an HLS/DASH manifest. This is slow on purpose — it is a job, not a request.",
      },
      {
        title: "Playback is a nearby POP",
        text: "The player fetches the manifest, then segments. ABR picks a bitrate from buffer health. Origin is not on this path if the CDN is healthy.",
      },
      {
        title: "Hot titles dominate",
        text: "A tiny fraction of videos get almost all views. Pre-warm POPs on predicted viral uploads. Origin shield protects storage from miss storms.",
      },
    ],
  ),

  "google-drive": board(
    "A file is a list of block hashes. Metadata is CP; bytes are an object store.",
    [
      col("Clients", [
        n("c", "Sync client", "watcher + chunker"),
        n("q", "Local queue", "survives restart"),
      ]),
      col("Edge", [n("lb", "Load balancer"), n("gw", "API gateway", "auth, presign")]),
      col("Control plane", [
        n("m", "Metadata service", "tree, versions, ACLs", "accent"),
        n("j", "Change journal", "monotonic per namespace"),
        n("n", "Notification service", "long poll / WS"),
      ]),
      col("Dedup", [
        n("neg", "Chunk negotiation", "which are missing"),
        n("ref", "Refcounts", "GC after grace"),
      ]),
      col("Data plane", [
        n("b", "Object storage", "content-addressed", "ok"),
        n("cdn", "CDN", "hot downloads"),
        n("cold", "Cold tier", "> 90 days"),
      ]),
      col("Platform", [
        n("acl", "Permission cache", "ancestry walk"),
        n("obs", "Observability"),
        n("audit", "Audit log"),
      ]),
    ],
    [
      {
        title: "Split the file",
        text: "The client cuts the file into ~4 MB chunks, hashes them, and skips chunks the store already has (dedup).",
      },
      {
        title: "Commit a version",
        text: "Once blocks are up, the metadata service writes a new file version: ordered block list + ACLs. That write is strongly consistent.",
      },
      {
        title: "Bytes are dumb storage",
        text: "The block store is S3-like. It does not know about folders. Losing metadata orphans bytes — treat that DB as the CP heart.",
      },
      {
        title: "Sync is a notification",
        text: "Other devices subscribe to the namespace and pull new versions. Two offline edits: keep both and surface a conflict (Docs is a different design).",
      },
    ],
  ),

  proximity: board(
    "Turn 'near me' into a handful of geo cells, then filter true distance.",
    [
      col("Clients", [n("c", "App", "lat, lng, radius")]),
      col("Edge", [n("lb", "Load balancer"), n("gw", "API gateway")]),
      col("Query", [
        n("cov", "Cell covering", "centre + 8 neighbours", "accent"),
        n("filt", "Haversine filter", "drop the corners"),
        n("rank", "Rank", "distance × rating", "ok"),
      ]),
      col("Index", [
        n("cell", "Geo index", "cell → business ids"),
        n("sh", "Shard by cell prefix", "city stays together"),
        n("stat", "Cell stats", "adaptive precision"),
      ]),
      col("Fast state", [
        n("cache", "Cell cache", "shared by all users", "ok"),
        n("neg", "Negative cache"),
      ]),
      col("Storage + platform", [
        n("db", "Business DB"),
        n("w", "Index writer", "multi-precision"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Index on write",
        text: "On insert, compute the cell IDs that cover the point (and maybe parents) and store the business under those cells.",
      },
      {
        title: "Cover the circle",
        text: "On search, cover the radius with cells. Prefix = coarser cell. Edges need neighbor lookups for geohash.",
      },
      {
        title: "Shard by coarse cell",
        text: "A city lives together so a downtown query does not scatter to 200 shards. Redis GEO is a legitimate v1 for one city.",
      },
      {
        title: "Filter, then rank",
        text: "True haversine distance, then rating / price. The index is a candidate set, not the answer.",
      },
    ],
  ),

  "nearby-friends": board(
    "The points move. Ping → live geo index → intersect with the friend list → push.",
    [
      col("Clients", [
        n("p", "Phone", "adaptive duty cycle"),
        n("ws", "Shared socket", "reuses chat"),
      ]),
      col("Edge", [
        n("lb", "L4 balancer", "sticky by user"),
        n("gate", "Location gateway", "holds sockets", "accent"),
      ]),
      col("Live state", [
        n("loc", "Positions", "Redis, TTL ≈ 60 s", "accent"),
        n("cell", "Coarse cell", "rebuild trigger"),
        n("watch", "Watch sets", "friends in range"),
      ]),
      col("Fan-out", [
        n("ps", "Pub/sub", "per-user channels"),
        n("filt", "Distance filter", "before publish"),
        n("push", "Enter-radius push", undefined, "ok"),
      ]),
      col("Durable", [
        n("fr", "Friend graph", "small, cached"),
        n("priv", "Sharing + precision", "revocable", "warn"),
      ]),
      col("Platform", [
        n("obs", "Observability", "delivery latency"),
        n("hist", "History (opt-in)", "sampled, separate"),
      ]),
    ],
    [
      {
        title: "Duty-cycle the ping",
        text: "Faster when moving, slower when still. 100M users × 30s is ~3M writes/s — you only index opted-in, online sharers.",
      },
      {
        title: "Write the latest point",
        text: "A cell → user map (or Redis GEO) plus a last-seen store. The disk copy is for analytics, not matching.",
      },
      {
        title: "Intersect with friends",
        text: "People in nearby cells ∩ friend list. Friend lists are small, so this is cheap on read or cached per user.",
      },
      {
        title: "Reuse the chat channel",
        text: "Push the update over the existing presence/websocket path. Do not open a second TCP just for dots on a map.",
      },
    ],
  ),

  "google-maps": board(
    "Two systems: vector tiles for rendering, a road graph for routing.",
    [
      col("Clients", [n("v", "Viewport", "tile cache"), n("sdk", "Nav SDK", "offline route")]),
      col("Render", [
        n("cdn", "Tile CDN", "immutable per version", "ok"),
        n("ts", "Vector tiles", "styled on client"),
      ]),
      col("Routing", [
        n("g", "Road graph", "in memory", "accent"),
        n("ch", "Contraction hierarchy", "precomputed"),
        n("mm", "Map matching", "HMM over edges"),
      ]),
      col("Traffic", [
        n("probe", "Probe ingest", "~10 M/s"),
        n("agg", "Aggregator", "1–2 min windows"),
        n("snap", "Speed snapshot", "pulled by routing"),
      ]),
      col("Models", [
        n("hist", "Historical speeds", "by hour, weekday"),
        n("eta", "ETA model", "learned, pessimistic"),
      ]),
      col("Platform", [
        n("geo", "Geocoding"),
        n("obs", "Observability"),
        n("olap", "Warehouse", "training data"),
      ]),
    ],
    [
      {
        title: "Tiles are a CDN problem",
        text: "Vector tiles (not giant PNGs) keep style on the client. The map is a cache hit; it is not a graph query.",
      },
      {
        title: "Routing is shortest path",
        text: "A road graph whose edge weights mix distance, speed limit, and live traffic. Preprocess (contraction hierarchies) so a cross-city query does not walk every road.",
      },
      {
        title: "Traffic is a snapshot",
        text: "Probe data from phones, smoothed, written as edge deltas. The router reads a recent snapshot — it cannot call a live system per edge per query.",
      },
      {
        title: "Pick two to deep-dive",
        text: "Do not design geocoding, tiles, routing, and traffic in 45 minutes. Say so, then go deep on tiles + routing.",
      },
    ],
  ),

  "distributed-mq": board(
    "A topic is a log split into partitions. The partition is the unit of order and parallelism.",
    [
      col("Producers", [
        n("pr", "Producer", "batches, compresses"),
        n("part", "Partitioner", "hash(key)"),
      ]),
      col("Control", [
        n("ctl", "Controller", "partition assignment"),
        n("meta", "Metadata", "topics, ISR"),
      ]),
      col("Log", [
        n("lead", "Partition leader", "append-only", "accent"),
        n("isr", "ISR replicas", "followers pull"),
        n("seg", "Segments", "immutable files"),
      ]),
      col("Consume", [
        n("cg", "Consumer group", "1 partition per member", "ok"),
        n("off", "Offsets", "compacted topic"),
        n("rb", "Rebalance", "cooperative"),
      ]),
      col("Retention", [
        n("del", "Delete policy", "time / size"),
        n("comp", "Compaction", "latest per key"),
        n("tier", "Tiered storage", "object store"),
      ]),
      col("Platform", [
        n("obs", "Observability", "lag vs retention", "warn"),
        n("quota", "Quotas", "multi-tenant"),
        n("mirror", "Mirroring", "cross-cluster"),
      ]),
    ],
    [
      {
        title: "Hash to a partition",
        text: "Producers send a key. The partition is a sequential log on disk — that is why Kafka is fast. Order is per partition, not per topic.",
      },
      {
        title: "Leader + ISR",
        text: "Replicas in the in-sync set must ack before the record is committed if acks=all. A min.insync.replicas of 2 is the money default.",
      },
      {
        title: "Consumer groups",
        text: "Each partition is owned by at most one member of a group. Many groups can independently replay the same log from different offsets.",
      },
      {
        title: "Controller is membership",
        text: "It assigns leaders and group members. It is not on the data path. KRaft / ZooKeeper is this box.",
      },
    ],
  ),

  metrics: board(
    "Collect, store, query, alert. Cardinality is the villain.",
    [
      col("Sources", [
        n("app", "Apps / exporters", "/metrics"),
        n("push", "Push gateway", "short-lived jobs"),
      ]),
      col("Discovery", [
        n("sd", "Service discovery", "what should exist", "accent"),
        n("c", "Scrapers", "jittered interval"),
      ]),
      col("Guardrails", [
        n("card", "Cardinality limits", "per metric / tenant", "warn"),
        n("relabel", "Relabel / drop", "before ingest"),
      ]),
      col("Store", [
        n("ts", "TSDB", "delta-of-delta + XOR"),
        n("wal", "WAL", "head chunk"),
        n("ds", "Downsample", "10 s → 1 m → 5 m"),
      ]),
      col("Use", [
        n("q", "Query engine", "picks a tier"),
        n("rr", "Recording rules", "precomputed"),
        n("a", "Alerting", "pending → firing", "warn"),
      ]),
      col("Platform", [
        n("notify", "Notification", "group, inhibit"),
        n("lts", "Long-term store", "object storage"),
        n("dead", "Dead-man switch", undefined, "ok"),
      ]),
    ],
    [
      {
        title: "Push vs pull",
        text: "Prometheus scrapes long-lived targets. Datadog agents push. Lambdas and short jobs need a push gateway either way.",
      },
      {
        title: "A series is a label set",
        text: "Storage is compressed (timestamp, value) columns keyed by series ID. A label like user_id explodes cardinality and will page you.",
      },
      {
        title: "Downsample on purpose",
        text: "10s raw for a day, 1m for two weeks, 5m for a year. Dashboards of last year should not scan raw.",
      },
      {
        title: "Alert on symptoms",
        text: "SLIs (error rate, p99, saturation), not 'CPU > 80'. Recording rules keep alert queries cheap.",
      },
    ],
  ),

  "ad-click": board(
    "Events on a log, stream windows for dashboards, a batch reconcile for money.",
    [
      col("Sources", [n("e", "Impressions / clicks", "client event ids")]),
      col("Ingest", [
        n("edge", "Edge collectors", "accept fast", "accent"),
        n("k", "Durable log", "partitioned by campaign"),
        n("cold", "Raw archive", "30 days+, replayable"),
      ]),
      col("Clean", [
        n("dedup", "Delivery dedup", "event id, 24 h"),
        n("biz", "Business dedup", "same user + ad"),
        n("fraud", "Fraud scoring", "retrospective", "warn"),
      ]),
      col("Aggregate", [
        n("wm", "Watermarks", "event time", "accent"),
        n("s", "Windowed agg", "1-minute"),
        n("hll", "Sketches", "unique users"),
      ]),
      col("Serve", [
        n("olap", "OLAP rollups", "campaign × minute", "ok"),
        n("api", "Report API", "sub-second"),
      ]),
      col("Correctness", [
        n("b", "Nightly batch", "recompute + reconcile", "ok"),
        n("corr", "Corrections", "versioned restatements"),
        n("lin", "Lineage", "for disputes"),
      ]),
    ],
    [
      {
        title: "Partition by campaign",
        text: "Events land on a log. Keying by campaign_id keeps one campaign's aggregations on one operator.",
      },
      {
        title: "Windows use event time",
        text: "A click that arrives two hours late still belongs to the original hour. Watermarks close windows; too-late events go to a repair path.",
      },
      {
        title: "Idempotent increments",
        text: "Event IDs in a seen-set (Bloom + store) before counters move. Billing cannot double-count a retry.",
      },
      {
        title: "Batch is the money path",
        text: "Stream feeds dashboards. Overnight reconcilers are what finance trusts. Do not skip this in the interview.",
      },
    ],
  ),

  "hotel-reservation": board(
    "Search can be stale. Hold is a conditional decrement. Pay is a saga.",
    [
      col("Clients", [n("c", "Web / app"), n("ota", "OTA channels", "external writers", "warn")]),
      col("Edge", [n("lb", "Load balancer"), n("gw", "API gateway")]),
      col("Search", [
        n("idx", "Availability index", "seconds stale", "ok"),
        n("cache", "City + date cache"),
        n("rank", "Filter + rank"),
      ]),
      col("Booking", [
        n("hold", "Hold service", "TTL ≈ 10 min", "accent"),
        n("inv", "Conditional update", "never check-then-act", "accent"),
        n("res", "Reservation", "idempotency key"),
      ]),
      col("Money", [
        n("pay", "Payment", "timeout ≠ failure", "warn"),
        n("recon", "Reconciliation"),
      ]),
      col("Storage + platform", [
        n("db", "Inventory / rates", "row per night"),
        n("sweep", "Hold sweeper"),
        n("obs", "Observability", "oversell alarms"),
      ]),
    ],
    [
      {
        title: "Search is a denormalized index",
        text: "Geo + dates + remaining. It can be a minute behind. Never book from this number alone.",
      },
      {
        title: "Hold is atomic",
        text: "UPDATE remaining = remaining - 1 WHERE remaining > 0, or a version column. Write a hold with a 10-minute TTL. Check-then-act is the bug.",
      },
      {
        title: "Pay with the reservation id",
        text: "The idempotency key is the reservation. Processor retries must not double-charge.",
      },
      {
        title: "Saga, not 2PC",
        text: "On success, hold → booked. On fail or TTL, release. Compensations (void payment, release hold) are the design — not a distributed transaction across vendors.",
      },
    ],
  ),

  "email-service": board(
    "SMTP in, blob + metadata store, then notify every device.",
    [
      col("Inbound", [
        n("mx", "MX / MTA", "SMTP :25"),
        n("rep", "Reputation check", "reject early", "warn"),
      ]),
      col("Accept", [
        n("auth", "SPF / DKIM / DMARC", "authenticate"),
        n("persist", "Durable write", "BEFORE 250 OK", "accent"),
      ]),
      col("Filter", [
        n("sp", "Spam / virus", "bias to delivery", "warn"),
        n("rules", "User rules", "labels, filters"),
      ]),
      col("Store", [
        n("body", "Bodies", "content-addressed, dedup"),
        n("entry", "Mailbox entries", "the mutable view"),
        n("idx", "Per-user index", "full text", "accent"),
      ]),
      col("Outbound", [
        n("q", "Send queue", "per-domain backoff"),
        n("pool", "Sending pools", "txn vs bulk"),
        n("bnc", "Bounce handling", "hard vs soft"),
      ]),
      col("Clients", [
        n("sync", "Delta sync", "journal + cursor", "ok"),
        n("push", "Push / IMAP idle"),
        n("obs", "Observability", "deliverability"),
      ]),
    ],
    [
      {
        title: "MX is the front door",
        text: "TLS, greylist, size limits. This is a mail transfer agent, not your app server.",
      },
      {
        title: "Filter before inbox",
        text: "Spam and virus in a pipeline. Quarantine first; async is OK. Losing mail is a scandal, delivering a payload is worse.",
      },
      {
        title: "Split body from metadata",
        text: "Body in object storage. Headers, folders, labels in a DB sharded by user. Search is a per-user inverted index — not LIKE %query%.",
      },
      {
        title: "Wake the devices",
        text: "Web clients get a push. Thick clients use IMAP IDLE. Attachments are OCR'd offline for search.",
      },
    ],
  ),

  "object-storage": board(
    "HTTP API, a CP metadata index, then erasure-coded chunks on a disk fleet.",
    [
      col("Clients", [n("c", "SDK / HTTP"), n("pre", "Presigned URL", "direct to storage", "ok")]),
      col("Front", [
        n("fe", "HTTP frontends"),
        n("auth", "Auth / signing"),
        n("mp", "Multipart", "resumable, atomic commit"),
      ]),
      col("Metadata", [
        n("idx", "Object index", "hash(bucket,key)", "accent"),
        n("ver", "Version chain", "delete markers"),
        n("list", "Prefix index", "listing read model"),
      ]),
      col("Placement", [
        n("ec", "Erasure coder", "10 data + 4 parity", "accent"),
        n("dom", "Failure domains", "room / rack / host"),
        n("pack", "Small-object packing"),
      ]),
      col("Disks", [n("n1", "Storage node"), n("n2", "Storage node"), n("n3", "Storage node")]),
      col("Integrity", [
        n("scrub", "Scrubber", "continuous verification", "warn"),
        n("rep", "Repair", "rate-limited"),
        n("life", "Lifecycle", "tiering, GC"),
      ]),
    ],
    [
      {
        title: "Control vs data",
        text: "PUT/GET/LIST hit an HTTP frontend. Presigned URLs let browsers talk to the data plane without shipping bytes through your app.",
      },
      {
        title: "Metadata is the heart",
        text: "Bucket, key, version, chunk IDs. If this index lies, the bytes are orphans. It is a strongly consistent store.",
      },
      {
        title: "Placement spreads failure domains",
        text: "Erasure coding (6+3) for cold large objects; 3× replication for hot small ones. Spread across disk, node, rack, AZ.",
      },
      {
        title: "Multipart and scrubbers",
        text: "Huge objects upload in parts, then a complete call concatenates them logically. Background scrubbers catch bit rot.",
      },
    ],
  ),

  leaderboard: board(
    "A sorted set is the v1. Shard by mode and window; spill the tail.",
    [
      col("Clients", [n("c", "Game client"), n("srv", "Game server", "authoritative score")]),
      col("Edge", [n("gw", "API gateway", "auth, rate limit")]),
      col("Write", [
        n("api", "Score service", "idempotent per match"),
        n("coal", "Write coalescing", "1/s per player", "accent"),
      ]),
      col("Index", [
        n("z", "Sorted set", "composite score", "accent"),
        n("ttl", "Period TTL", "daily / weekly / season"),
        n("hist", "Percentile buckets", "for the long tail"),
      ]),
      col("Read", [
        n("top", "Top-N", "cached ~1 s", "ok"),
        n("me", "Me ± 5", "exact near the top"),
        n("fr", "Friends board"),
      ]),
      col("Durable", [
        n("ev", "Score events", "rebuildable source of truth"),
        n("arch", "Season archive"),
        n("anti", "Anti-cheat", "retrospective removal", "warn"),
      ]),
    ],
    [
      {
        title: "ZADD is the write",
        text: "ZADD board score player. During an event this is the hot key. Shard by game mode + time window (daily / weekly).",
      },
      {
        title: "Top-N is ZREVRANGE",
        text: "ZREVRANGE 0 9 WITHSCORES. Cache it for a second if the event is huge.",
      },
      {
        title: "My rank is ZREVRANK",
        text: "Plus a small window around the player. Ties: encode score * K - timestamp so earlier arrivals win and the board does not flicker.",
      },
      {
        title: "Spill the tail",
        text: "A global board of 100M players keeps the top few million in Redis and the rest on disk. Nobody is looking at rank 80,000,001 in real time.",
      },
    ],
  ),

  payment: board(
    "Intent → processor → ledger → webhook. The journal is the source of truth.",
    [
      col("Merchant", [
        n("m", "Checkout", "tokenised card"),
        n("sdk", "Client SDK", "PAN never touches us"),
      ]),
      col("Edge", [
        n("gw", "API gateway"),
        n("idem", "Idempotency-Key", "unique constraint", "accent"),
      ]),
      col("Orchestration", [
        n("i", "Payment intent", "explicit state machine", "accent"),
        n("risk", "Risk / 3DS", "before authorisation"),
        n("route", "Processor routing", "failover"),
      ]),
      col("External", [
        n("psp", "Card network", "timeout ≠ failure", "warn"),
        n("poll", "Status polling", "resolve unknowns"),
      ]),
      col("Ledger", [
        n("j", "Double-entry journal", "append-only", "ok"),
        n("set", "Settlement", "payouts"),
        n("recon", "Reconciliation", "provider vs ledger"),
      ]),
      col("Platform", [
        n("wh", "Signed webhooks", "at-least-once"),
        n("disp", "Disputes / refunds"),
        n("obs", "Observability", "auth rate, latency"),
      ]),
    ],
    [
      {
        title: "Never touch PAN",
        text: "The browser talks to the processor (Stripe.js) and you receive a token. PCI scope stays small — that is architecture, not a later compliance pass.",
      },
      {
        title: "Intent is a state machine",
        text: "requires_action → processing → succeeded | failed. The Idempotency-Key header makes retries the same charge.",
      },
      {
        title: "Ledger first",
        text: "On success, append journal lines (merchant receivable, processor clearing, fees). Balances are projections. Do not UPDATE balance = balance + x.",
      },
      {
        title: "Webhooks from the ledger",
        text: "Fire signed events from a worker, not from the request thread. Merchants retry; your event id keeps them idempotent too.",
      },
    ],
  ),

  "digital-wallet": board(
    "Double-entry journal, a clearing account for cross-shard moves, cached balances with a version.",
    [
      col("Clients", [n("u", "App", "transfer, top-up")]),
      col("Edge", [n("gw", "API gateway"), n("idem", "Idempotency key", "unique index", "accent")]),
      col("Txn", [
        n("chk", "Balance check", "strong, in-transaction", "accent"),
        n("t", "Transaction", "groups the entries"),
        n("saga", "Saga", "external rails"),
      ]),
      col("Ledger", [
        n("a", "Debit entry"),
        n("b", "Credit entry", "sums to zero", "ok"),
        n("sys", "System accounts", "clearing, fees"),
      ]),
      col("Derived", [
        n("snap", "Balance snapshots", "cache of a derived value"),
        n("stmt", "Statement view", "immutable history"),
      ]),
      col("Platform", [
        n("recon", "Reconciliation", "provider ledgers", "warn"),
        n("inv", "Invariant checks", "debits = credits"),
        n("obs", "Observability / audit"),
      ]),
    ],
    [
      {
        title: "A transfer is two lines",
        text: "Debit A, credit B, sum to zero, committed together when they share a shard. assert(available >= 0) after apply.",
      },
      {
        title: "Idempotency is the txn id",
        text: "Retries with the same key return the original result. There is no second pair of journal lines.",
      },
      {
        title: "Cross-shard uses clearing",
        text: "Debit A → credit clearing, then debit clearing → credit B. Reconcile the clearing account constantly. This is the saga.",
      },
      {
        title: "Balance is a cache",
        text: "SUM(journal) with a snapshot + version. Conditional update on version prevents lost updates. The journal is the audit trail.",
      },
    ],
  ),

  "stock-exchange": board(
    "A sequenced log in, a single-threaded matcher per symbol, a log of trades out.",
    [
      col("Participants", [n("t", "Trading systems"), n("gw", "Order gateway", "binary protocol")]),
      col("Pre-trade", [
        n("risk", "Risk checks", "credit, fat-finger", "warn"),
        n("kill", "Kill switch"),
      ]),
      col("Sequencing", [
        n("seq", "Sequencer", "assigns total order", "accent"),
        n("log", "Input log", "replicated, durable"),
      ]),
      col("Match", [
        n("m", "Matcher", "1 thread per symbol", "accent"),
        n("book", "Order book", "price-time FIFO"),
        n("rep", "Replicas", "deterministic replay"),
      ]),
      col("Out", [
        n("tr", "Trades"),
        n("md", "Market data", "sequenced multicast", "ok"),
        n("er", "Execution reports", "private"),
      ]),
      col("Platform", [
        n("cl", "Clearing / settlement"),
        n("auc", "Auctions / halts"),
        n("audit", "Replay audit", "reproduce the day"),
      ]),
    ],
    [
      {
        title: "Gateway sequences",
        text: "Assign a global order-id, persist on the input log, ack. Fairness starts here — FIFO at a price level is the matching rule.",
      },
      {
        title: "One thread per symbol",
        text: "The matcher reads the log, mutates bid/ask trees, emits trades and book deltas. Two threads on AAPL is a bug, not a scale strategy.",
      },
      {
        title: "Output log is truth",
        text: "Market-data publishers and the clearing/ledger follow the output log. Replicas replay; they do not match independently.",
      },
      {
        title: "Memory is the book",
        text: "Bids desc, asks asc; each price is a FIFO queue. Recover by replaying the log (plus snapshots). Hot symbols get a bigger machine, not a second matcher.",
      },
    ],
  ),

  "auth-system": board(
    "Short-lived JWT on the request, opaque rotating refresh in an HttpOnly cookie, sessions in Redis.",
    [
      col("Clients", [n("c", "Browser", "httpOnly cookie"), n("m", "Mobile", "platform keystore")]),
      col("Edge", [
        n("lb", "Load balancer"),
        n("gw", "API gateway", "verifies signature", "accent"),
      ]),
      col("Auth", [
        n("a", "Auth service", "login, MFA", "accent"),
        n("hash", "argon2id", "deliberately slow"),
        n("mfa", "MFA challenge", "partial state"),
      ]),
      col("Tokens", [
        n("at", "Access token", "~15 min, stateless"),
        n("rt", "Refresh token", "stateful, rotated", "ok"),
        n("jwks", "JWKS", "public keys, cached"),
      ]),
      col("Revocation", [
        n("s", "Session store", "delete to revoke", "warn"),
        n("nbf", "Not-before per user", "one entry kills all"),
      ]),
      col("Platform", [
        n("u", "User DB"),
        n("idp", "IdP / OIDC / SAML", "federation"),
        n("obs", "Auth events", "new device, failures"),
      ]),
    ],
    [
      {
        title: "Login starts a session",
        text: "Verify password (argon2id) or a code from the IdP. Write a session row (hashed refresh, device, expiry). Set the refresh cookie HttpOnly + Secure + SameSite.",
      },
      {
        title: "Access token is a postcard",
        text: "A 5–15 min JWT rides on every API call. Resource servers verify the signature (kid) and do not hit Redis. Never put secrets in it.",
      },
      {
        title: "Refresh rotates",
        text: "POST /refresh: check the hash, mint a new pair, revoke the old refresh. A stolen refresh token is a one-shot.",
      },
      {
        title: "Revoke is a row delete",
        text: "Sign-out-everywhere deletes session rows. Access tokens linger until expiry unless you keep a denylist — say that trade-off.",
      },
    ],
  ),

  "distributed-cache": board(
    "Client-sharded memory in front of an origin. The ring, not the map, is the design.",
    [
      col("App", [
        n("a", "App fleet", "ring held in process"),
        n("l1", "In-process L1", "hot keys, ~1 s", "ok"),
      ]),
      col("Route", [
        n("r", "Consistent hash ring", "200 vnodes", "accent"),
        n("ver", "Ring version", "staleness detectable"),
      ]),
      col("Cache", [n("n1", "Node A", "LRU + TTL"), n("n2", "Node B"), n("n3", "Node C")]),
      col("Stampede", [
        n("sf", "Single-flight lock", "one loader wins", "accent"),
        n("jit", "TTL jitter"),
        n("early", "Early refresh", "before the cliff"),
      ]),
      col("Origin", [
        n("db", "Database / service"),
        n("cb", "Circuit breaker", "shed rather than collapse", "warn"),
      ]),
      col("Platform", [
        n("inval", "Invalidation", "delete after write"),
        n("hot", "Hot-key detection", "sampled top keys"),
        n("obs", "Observability", "hit rate, evictions"),
      ]),
    ],
    [
      {
        title: "Hash the key onto a node",
        text: "Clients or a proxy use consistent hashing so a restart remaps ~1/N keys. Sticky routing without a coordinator.",
      },
      {
        title: "Cache-aside is the default",
        text: "GET miss → load origin → SET. Write-through if you cannot tolerate a stale window. The origin remains the source of truth.",
      },
      {
        title: "Evict on purpose",
        text: "Size cap + LRU/LFU + TTL. TTL alone will OOM. TinyLFU kills one-hit wonders that would pollute LRU.",
      },
      {
        title: "Stampede",
        text: "A hot key expires; ten thousand misses hit origin. Mitigate with single-flight, jittered TTLs, and a short stale-serve window.",
      },
    ],
  ),

  instagram: board(
    "Media is a pipeline. The follow graph is a hybrid fan-out. They only share a user id.",
    [
      col("Clients", [
        n("app", "Mobile / web", "camera roll, feed"),
        n("cdn", "CDN reads", "images, video", "ok"),
      ]),
      col("Edge", [
        n("dns", "DNS / anycast"),
        n("lb", "Load balancer", "TLS, health checks"),
        n("gw", "API gateway", "authn, rate limit, routing", "accent"),
      ]),
      col("Services", [
        n("up", "Upload service", "presigned URLs"),
        n("post", "Post service", "metadata, status"),
        n("graph", "Graph service", "follows, blocks"),
        n("feed", "Feed service", "mixer + ranking"),
      ]),
      col("Async", [
        n("q", "Event queue", "Kafka", "accent"),
        n("tx", "Transcode workers", "variants, blurhash"),
        n("fan", "Fan-out workers", "push to followers"),
        n("agg", "Counter aggregator", "likes, comments"),
      ]),
      col("Fast state", [
        n("feedc", "Feed cache", "post ids, capped"),
        n("postc", "Post cache", "hydration"),
        n("redis", "Redis", "sessions, counters"),
      ]),
      col("Storage + platform", [
        n("obj", "Object storage", "originals + variants"),
        n("pdb", "Post / graph DB", "sharded by id"),
        n("olap", "Warehouse", "engagement, ML features"),
        n("obs", "Observability", "metrics, logs, tracing"),
      ]),
    ],
    [
      {
        title: "Bytes never hit the API",
        text: "The client asks for a signed PUT URL and uploads straight to object storage. A worker transcodes variants (feed, story, permalink) and marks the post ready.",
      },
      {
        title: "The post is metadata",
        text: "Caption, author, media ids. The feed stores post ids, not blobs. The client resolves URLs from the CDN.",
      },
      {
        title: "Hybrid fan-out",
        text: "Push onto followers' feed caches, except celebrity accounts which stay pull-on-read — same plot as the news-feed example, with an immutable media pipeline in front.",
      },
      {
        title: "Stories are TTL",
        text: "A 24h flag plus a separate index. Do not put them on the durable home-feed list.",
      },
    ],
  ),

  spotify: board(
    "Catalog is small and precious. Audio is encrypted chunks on a CDN. Entitlement sits in between.",
    [
      col("Clients", [
        n("p", "Player", "prefetch next track"),
        n("off", "Offline store", "encrypted + licence"),
      ]),
      col("Edge", [n("cdn", "Audio CDN", "immutable files", "ok"), n("gw", "API gateway")]),
      col("Control", [
        n("api", "Playback API", "prepare, licence"),
        n("ent", "Entitlement", "plan, market", "accent"),
        n("pl", "Playlist service", "stable item ids"),
      ]),
      col("Catalogue", [
        n("cat", "Catalogue", "~100 M tracks"),
        n("search", "Search", "typo tolerant"),
        n("rec", "Recommendations"),
      ]),
      col("Accounting", [
        n("ev", "Play events", "buffered, batched", "accent"),
        n("agg", "Event-time aggregation", "30 s threshold"),
        n("fraud", "Fraud detection", "retrospective", "warn"),
      ]),
      col("Platform", [
        n("roy", "Royalty accounting", "the payable output"),
        n("obj", "Audio storage"),
        n("obs", "Observability", "start latency"),
      ]),
    ],
    [
      {
        title: "Ask entitlement first",
        text: "May this user play this track in this country, on this plan, right now? Only then mint a CDN URL. License accuracy is a product requirement.",
      },
      {
        title: "Manifest, then range-GETs",
        text: "The player fetches a manifest and pulls encrypted Ogg/AAC chunks ahead of the playhead. Drop bitrate on a bad cell link — same idea as video ABR, smaller ladder.",
      },
      {
        title: "Catalog is not the bytes",
        text: "Track / album / artist / ISRC live in a searchable store. This is small. Getting it wrong is a lawsuit; getting it slow is a skip.",
      },
      {
        title: "Keep the music going",
        text: "Prefetch 15–30s. Offline = device-bound encrypted blobs plus a periodic online check. Play events feed royalties — they cannot be best-effort forever.",
      },
    ],
  ),

  netflix: board(
    "Encode once. Sit inside the ISP (Open Connect). Control plane is an ordinary API.",
    [
      col("Clients", [n("p", "Player", "ABR, DRM licence"), n("tv", "TV / mobile / web")]),
      col("Control", [
        n("api", "Playback API", "entitlement, manifest"),
        n("cat", "Catalogue", "region + licence window"),
        n("rec", "Recommendations", "precomputed rows"),
      ]),
      col("Preparation", [
        n("enc", "Encoding farm", "per-title ladder"),
        n("pkg", "Packager + DRM", "encrypted segments"),
        n("pos", "Pre-positioning", "push before demand", "accent"),
      ]),
      col("Data plane", [
        n("isp", "ISP appliances", "inside the network", "ok"),
        n("cdn", "Public CDN", "fallback"),
        n("org", "Origin", "rarely touched"),
      ]),
      col("State", [
        n("pos2", "Playback position", "per profile"),
        n("drm", "Licence service", "per device"),
        n("str", "Stream limits", "lease at start"),
      ]),
      col("Platform", [
        n("tel", "QoE telemetry", "stalls, bitrate"),
        n("olap", "Warehouse"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Encode is a factory",
        text: "Every title → many bitrates × codecs × languages. A job queue, not a user-facing API. DRM licenses are minted at play time.",
      },
      {
        title: "Opening night is placement",
        text: "Pre-position the title on Open Connect appliances inside the ISPs you care about. That is how a premiere does not melt a public CDN.",
      },
      {
        title: "Control plane is boring",
        text: "Auth, catalog, viewing history, rows. Ordinary stateless APIs plus a history store. Do not mix it with the byte path.",
      },
      {
        title: "ABR on 2–4s segments",
        text: "The player picks a rung from recent throughput. A bad guess recovers at the next segment. Downloads are encrypted and device-bound.",
      },
    ],
  ),

  "job-scheduler": board(
    "A due-index, SKIP LOCKED leases, a work queue, idempotent handlers.",
    [
      col("Clients", [n("api", "Schedule API", "cron + one-off"), n("ui", "History / retry UI")]),
      col("Schedules", [
        n("db", "Schedule store", "next_run_at index", "accent"),
        n("jit", "Deterministic jitter", "spread the midnight spike", "accent"),
        n("tz", "Timezone / DST", "catch-up policy", "warn"),
      ]),
      col("Dispatch", [
        n("disp", "Dispatchers", "poll for due"),
        n("claim", "Conditional claim", "skip locked"),
        n("rate", "Dispatch rate limit", "drain backlogs"),
      ]),
      col("Execute", [
        n("lease", "Lease + heartbeat", "reclaim on crash", "accent"),
        n("w", "Workers", "idempotent jobs"),
        n("to", "Timeout", "kill runaway jobs"),
      ]),
      col("Outcomes", [
        n("ok", "Succeeded", undefined, "ok"),
        n("retry", "Backoff + jitter", "bounded attempts"),
        n("dlq", "Dead letter", "alert a human", "warn"),
      ]),
      col("Platform", [
        n("hist", "Run history", "re-run after a fix"),
        n("q", "Per-tenant queues"),
        n("obs", "Observability", "lag, failure rate"),
      ]),
    ],
    [
      {
        title: "The due-index is the design",
        text: "Store jobs with (shard, next_run_at). Dispatchers poll their shard: SELECT … WHERE next_run_at <= now FOR UPDATE SKIP LOCKED — or a Redis ZSET of due times.",
      },
      {
        title: "A claim is a lease",
        text: "On pick: write owner + expiry, enqueue the run, bump next_run_at for cron. Lease expiry lets another dispatcher reclaim a dead worker.",
      },
      {
        title: "Exactly-once is a lie",
        text: "The worker can finish the side effect and die before ack. Handlers must be idempotent (run id). For money, pair with a ledger.",
      },
      {
        title: "Do not cron-storm",
        text: "A million jobs at midnight: jitter next_run_at and cap claim batch size so you do not melt the queue.",
      },
    ],
  ),

  tinder: board(
    "Geo builds the deck. A like graph records the swipe. A match is the reverse edge.",
    [
      col("Clients", [
        n("c", "App", "deck held locally"),
        n("sw", "Swipes", "batched upload", "ok"),
      ]),
      col("Edge", [n("gw", "API gateway", "auth, rate limit")]),
      col("Deck build", [
        n("geo", "Geo candidates", "cell + neighbours"),
        n("filt", "Filters", "age, prefs, blocks"),
        n("seen", "Seen filter", "Bloom per user", "accent"),
        n("rank", "Reciprocity ranking", "exposure capped"),
      ]),
      col("Match", [
        n("sw2", "Swipe store", "idempotent"),
        n("rec", "Reciprocal check", "indexed lookup"),
        n("pair", "Ordered pair key", "race-free", "accent"),
      ]),
      col("After", [
        n("m", "Match + chat", undefined, "ok"),
        n("push", "Notification", "exactly once"),
      ]),
      col("Platform", [
        n("prof", "Profile store", "cell-indexed"),
        n("safety", "Blocks / abuse", "both directions", "warn"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Deck is a geo query",
        text: "Coarse geohash → candidates, filter prefs, rank by a model (activity, distance, prior likes). The 'already seen' set is a bloom or a time-partitioned list.",
      },
      {
        title: "Like is an edge",
        text: "Write A→B. Pass is a negative you usually do not store forever.",
      },
      {
        title: "Match is atomic",
        text: "On like, if B→A exists, create a match. Lock or compare-and-set on (min(A,B), max(A,B)). Then notify both. Do not poll.",
      },
      {
        title: "Chat is a new channel",
        text: "Reuse the chat example. The dating product is the matching graph plus geo; messaging is a solved box.",
      },
    ],
  ),

  "google-search": board(
    "Four machines: crawl, invert, rank, serve. Serving is doc-sharded scatter-gather.",
    [
      col("Users", [n("u", "Query"), n("sug", "Autocomplete", "separate system")]),
      col("Front end", [
        n("cache", "Query cache", "skew is extreme", "ok"),
        n("qu", "Query understanding", "spelling, synonyms"),
        n("scat", "Scatter", "fan out to all shards", "accent"),
      ]),
      col("Retrieval", [
        n("sh", "Index shards", "sharded BY DOCUMENT", "accent"),
        n("tier", "Tiered index", "small high-quality first"),
        n("hedge", "Hedged requests", "tail latency", "warn"),
      ]),
      col("Rank", [
        n("merge", "Merge + deadline", "partial is fine"),
        n("rk", "Ranker", "expensive, on few hundred"),
        n("snip", "Snippets", "top 10 only", "ok"),
      ]),
      col("Offline", [
        n("crawl", "Crawler", "tiered freshness"),
        n("dedup", "Dedup", "shingles / minhash"),
        n("build", "Indexer", "immutable generations"),
        n("link", "Link graph"),
      ]),
      col("Platform", [
        n("rt", "Real-time index", "merged at query time"),
        n("spam", "Spam / quality", "adversarial", "warn"),
        n("obs", "Observability"),
      ]),
    ],
    [
      {
        title: "Crawl is a frontier",
        text: "Reuse the web-crawler example. Politeness, canonical URLs, the seen-set.",
      },
      {
        title: "Invert offline",
        text: "Documents → tokens → posting lists (doc id, tf, positions). Offline scores (PageRank, freshness) sit next to the postings.",
      },
      {
        title: "Serve doc-sharded",
        text: "Every shard does a local top-k (WAND / BM25). The mixer merges. Term-sharding makes rare terms easy and hot terms painful — most web search is doc-sharded.",
      },
      {
        title: "Snippets need positions",
        text: "That is why posting lists keep offsets and why a document store is not optional. Autocomplete is a separate example.",
      },
    ],
  ),

  uber: board(
    "City shard. Live geo of idle drivers. A lease so two matchers cannot hand the same car.",
    [
      col("Clients", [n("r", "Rider app"), n("d", "Driver app", "buffers events offline")]),
      col("Edge", [
        n("ws", "Location gateway", "sticky sockets", "accent"),
        n("gw", "API gateway"),
      ]),
      col("Telemetry", [
        n("geo", "Geo index", "cell → drivers, TTL", "accent"),
        n("eta", "ETA service", "road-aware"),
      ]),
      col("Matching", [
        n("batch", "Batcher", "~3 s windows", "accent"),
        n("solve", "Assignment solver", "global, not greedy"),
        n("offer", "Offer manager", "exclusive, 15 s"),
      ]),
      col("Trips", [
        n("sm", "Trip state machine", "durable", "ok"),
        n("ev", "Trip events", "client ids, replayable"),
        n("pay", "Payments", "idempotent capture"),
      ]),
      col("Platform", [
        n("surge", "Surge pricing", "supply / demand windows"),
        n("olap", "Warehouse"),
        n("obs", "Observability", "per city"),
      ]),
    ],
    [
      {
        title: "Partition by city",
        text: "A driver is in one ring. Location pings (every 1–4s on trip, slower when idle) write an in-memory geo index for that city.",
      },
      {
        title: "Cover the pickup",
        text: "Cells around the pin → idle drivers. Score by ETA, rating, destination, battery. Do not ping-pong the same car.",
      },
      {
        title: "The offer is a lease",
        text: "Compare-and-set idle → pending (10s) → on_trip. Two matchers racing is the bug; a lock on driver id plus the city shard fixes it.",
      },
      {
        title: "Surge is a cache",
        text: "Demand in cell / idle supply over a short window. It is a multiplier, not a transaction. ETA comes from the maps example.",
      },
    ],
  ),

  "food-delivery": board(
    "Three sides. Dispatch late so the courier arrives as the bag comes up, not twenty minutes earlier.",
    [
      col("Clients", [
        n("e", "Diner", "menu, track"),
        n("m", "Merchant tablet"),
        n("k", "Courier app"),
      ]),
      col("Edge", [n("cdn", "Menu CDN", "cached hard", "ok"), n("gw", "API gateway")]),
      col("Order", [
        n("o", "Order service", "durable state machine", "accent"),
        n("ev", "Order events", "client ids, buffered"),
        n("esc", "Escalation", "unacknowledged orders", "warn"),
      ]),
      col("Timing", [
        n("prep", "Prep prediction", "learned, high percentile", "accent"),
        n("sched", "Dispatch scheduler", "offer at readiness"),
        n("batch", "Batching", "capped added delay"),
      ]),
      col("Dispatch", [
        n("geo", "Courier geo index", "TTL positions"),
        n("offer", "Exclusive offers"),
        n("eta", "ETA", "pessimistic", "ok"),
      ]),
      col("Platform", [
        n("pay", "Payments", "authorise, capture late"),
        n("obs", "Observability", "non-acceptance rate"),
        n("sup", "Support tooling", "audited overrides"),
      ]),
    ],
    [
      {
        title: "Order is a state machine",
        text: "Place → payment hold → merchant accept (timeout cancels) → preparing → ready → picked up → delivered → capture.",
      },
      {
        title: "Menus are cacheable",
        text: "The diner path is a CDN. Orders are not. That split is the first sentence of the design.",
      },
      {
        title: "Dispatch on ready_at",
        text: "Estimate ready_at = now + quoted prep. Send the courier so they arrive near ready_at. Naive 'match now' parks couriers in the restaurant.",
      },
      {
        title: "Batching is the margin",
        text: "Score candidates on time-to-restaurant vs remaining prep, stacked orders (same merchant, nearby dropoffs). Two bags on one courier is the business.",
      },
    ],
  ),

  "google-docs": board(
    "A sticky sequencer per doc. Ops on a log, snapshots for late joiners, presence on the side.",
    [
      col("Clients", [
        n("a", "Editor A", "local echo, pending ops"),
        n("b", "Editor B", undefined, "ok"),
      ]),
      col("Edge", [
        n("lb", "Load balancer", "sticky BY DOCUMENT", "accent"),
        n("ws", "WebSocket tier"),
      ]),
      col("Session", [
        n("s", "Doc server", "document in memory", "accent"),
        n("ot", "OT / CRDT", "make edits commute"),
        n("order", "Total order", "server sequence"),
      ]),
      col("Presence", [
        n("cur", "Cursors", "transformed too"),
        n("ttl", "TTL expiry", "no goodbye message"),
        n("thr", "Throttled", "few per second"),
      ]),
      col("Durable", [
        n("log", "Op log", "append-only, source of truth", "ok"),
        n("snap", "Snapshots", "bounded replay"),
        n("hist", "Version history", "nearly free"),
      ]),
      col("Platform", [
        n("acl", "Permissions", "revoke tears down sessions", "warn"),
        n("obs", "Observability", "convergence checks"),
      ]),
    ],
    [
      {
        title: "Optimistic local apply",
        text: "The keystroke lands in the local model immediately (< 50 ms). Then the op goes to the doc server.",
      },
      {
        title: "One sequencer per doc",
        text: "Sticky via consistent hash on doc id. The server transforms (OT) or orders (CRDT) ops, appends the log, broadcasts to other sockets.",
      },
      {
        title: "Snapshots for late joiners",
        text: "Every N ops, write a snapshot to object storage so a new tab does not replay the whole history. Undo is the log.",
      },
      {
        title: "OT vs CRDT",
        text: "OT if always-online and Google-Docs-shaped (server is the doc's availability). CRDT if offline / local-first (metadata bloat, compaction). Say which and why.",
      },
    ],
  ),

  zoom: board(
    "Signaling is JSON. Media is WebRTC to an SFU. TURN is the expensive fallback.",
    [
      col("Clients", [
        n("a", "Client A", "simulcast encoder"),
        n("b", "Client B", undefined, "ok"),
      ]),
      col("Connect", [
        n("sig", "Signalling", "WebSocket, SDP + ICE"),
        n("stun", "STUN", "NAT traversal"),
        n("turn", "TURN relay", "UDP, then TCP/443", "warn"),
      ]),
      col("Media", [
        n("sfu", "SFU", "forwards, never decodes", "accent"),
        n("layer", "Layer selection", "per receiver"),
        n("bwe", "Bandwidth estimation"),
      ]),
      col("Quality", [
        n("jit", "Jitter buffer", "adaptive"),
        n("conceal", "Loss concealment", "never retransmit"),
        n("aud", "Audio priority", "protected first", "ok"),
      ]),
      col("Extras", [
        n("rec", "Recorder", "decodes + composites"),
        n("tr", "Transcription"),
        n("e2e", "E2E encryption", "excludes the above", "warn"),
      ]),
      col("Platform", [
        n("meet", "Meeting control", "scheduling, roles"),
        n("casc", "Cascaded SFUs", "cross-region"),
        n("obs", "Observability", "loss, latency"),
      ]),
    ],
    [
      {
        title: "Signaling is easy",
        text: "Join, SDP offer/answer, mute, roster — a websocket. It is not the hard part. Say that and move on.",
      },
      {
        title: "SFU forwards, it does not mix",
        text: "Each sender uploads 2–3 bitrates (simulcast). The SFU picks a rung per receiver. MCU (mix into one encode) is a fallback for phones and recordings.",
      },
      {
        title: "NAT: STUN then TURN",
        text: "Most home NATs punch with STUN. Symmetric NAT needs a TURN relay — budget it, it is the expensive path.",
      },
      {
        title: "Webinars are receive-only",
        text: "A thousand 'participants' are not a thousand full meshes. Recording is a hidden client of the SFU. Chat piggybacks on signaling.",
      },
    ],
  ),

  "ticket-booking": board(
    "Waiting room, then a unique hold on the seat, then pay, then a ticket.",
    [
      col("Clients", [n("u", "100 K users", "at the on-sale instant", "warn")]),
      col("Admission", [
        n("wr", "Waiting room", "position + signed token", "accent"),
        n("adm", "Admit in batches", "randomised, fair"),
        n("shed", "Load shedding", "clear rejection"),
      ]),
      col("Browse", [
        n("cdn", "Static content", "event, venue map", "ok"),
        n("map", "Seat map", "cached / pushed deltas"),
      ]),
      col("Claim", [
        n("hold", "Hold service", "conditional, ordered", "accent"),
        n("exp", "Expired-as-free", "no stranded seats"),
        n("grp", "Contiguous blocks", "all or nothing"),
      ]),
      col("Purchase", [
        n("pay", "Payment", "timeout extends hold", "warn"),
        n("ord", "Order", "idempotent", "ok"),
        n("tix", "Ticket issue"),
      ]),
      col("Platform", [
        n("bot", "Bot defence", "account + payment limits", "warn"),
        n("sweep", "Hold sweeper"),
        n("obs", "Funnel metrics", "queue depth, conversion"),
      ]),
    ],
    [
      {
        title: "Queue the on-sale",
        text: "A virtual waiting room so only N checkouts run. The origin will not survive a fair on-sale without this.",
      },
      {
        title: "The unique constraint is the design",
        text: "INSERT hold (seat, user, expiry) ON CONFLICT seat_id DO NOTHING and see if you won. Do not check-then-insert. A TTL worker releases abandoned holds.",
      },
      {
        title: "The drawn map is a cache",
        text: "The UI can be slightly wrong. The hold table is truth. On a conflict, refresh the map.",
      },
      {
        title: "Pay, then commit",
        text: "Idempotency key = hold id. Success: hold → sold, mint ticket, email. General admission is an atomic counter instead of a seat row.",
      },
    ],
  ),

  "distributed-lock": board(
    "A tiny Raft group. Locks are files with a lease and a fencing token. Not Redis SETNX.",
    [
      col("Clients", [n("c", "Services", "want exclusivity")]),
      col("Session", [
        n("sess", "Session", "one heartbeat, many locks"),
        n("hb", "Heartbeat", "renew at TTL/3"),
      ]),
      col("Consensus", [
        n("l", "Leader", "grants under Raft", "accent"),
        n("f", "Followers", "majority commit"),
        n("cp", "CP, not AP", "unavailable > double-grant", "warn"),
      ]),
      col("Grant", [
        n("lease", "Lease", "expiry = liveness"),
        n("tok", "Fencing token", "monotonic", "accent"),
        n("queue", "Wait queue", "watch predecessor"),
      ]),
      col("Enforcement", [
        n("res", "Protected resource", "rejects lower tokens", "ok"),
        n("cas", "Or: conditional write", "often enough alone"),
      ]),
      col("Platform", [
        n("obs", "Observability", "hold time, contention"),
        n("alt", "Prefer no lock", "partition or idempotency"),
      ]),
    ],
    [
      {
        title: "A handful of replicas",
        text: "Raft/Paxos, one leader for writes. A lock is a file: {holder, fencing_token, lease_expiry}. Acquire is create-if-not-exists or CAS if expired.",
      },
      {
        title: "Leases, not forever",
        text: "Clients heartbeat. A dead holder expires. This is Chubby / etcd / ZooKeeper, for thousands of locks — not billions of rows.",
      },
      {
        title: "Fencing tokens",
        text: "The lock service hands out a monotonic token. The data store rejects writes with a lower token. This is how a GC-paused holder cannot write after losing the lock — SETNX cannot do this.",
      },
      {
        title: "Watches for membership",
        text: "Ephemeral nodes + watches are how GFS/Bigtable and Kubernetes elect leaders. Per-row mutexes belong in the database, not here.",
      },
    ],
  ),
};

export function getBoard(slug: string): ArchitectureBoard | undefined {
  return boards[slug];
}

export const boardCount = Object.keys(boards).length;
