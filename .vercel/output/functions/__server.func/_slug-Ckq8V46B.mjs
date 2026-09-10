import { B as require_jsx_runtime, y as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { a as FlaskConical } from "./_libs/lucide-react.mjs";
import { c as Button, o as Route$6 } from "./_ssr/router-BZm8xvrR.mjs";
import { i as headingId, n as SectionBlock, r as Toc, t as ArchDiagram } from "./_ssr/Toc-ClLK8FBQ.mjs";
import { n as RelatedList, t as PageHeader } from "./_ssr/RelatedList-D_V4CKq5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-Ckq8V46B.js
var import_jsx_runtime = require_jsx_runtime();
function ArchitectureBoard({ board }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl font-medium tracking-tight sm:text-2xl",
			children: "Architecture"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-2xl text-sm leading-6 text-muted",
			children: "Read the board left to right. Accent boxes are the hot path. Then walk the numbered hops — that is the explanation you should give out loud in the interview."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchDiagram, { diagram: {
			kind: "system",
			caption: board.caption,
			columns: board.columns
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-2 space-y-3",
			children: board.walkthrough.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-0.5 font-mono text-xs text-accent tabular-nums",
					children: String(i + 1).padStart(2, "0")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-medium leading-snug",
					children: step.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm leading-6 text-muted",
					children: step.text
				})] })]
			}, step.title))
		})
	] });
}
function n(id, label, sub, tone) {
	return {
		id,
		label,
		sub,
		tone
	};
}
function col(title, nodes) {
	return {
		title,
		nodes
	};
}
function board(caption, columns, walkthrough) {
	return {
		caption,
		columns,
		walkthrough
	};
}
var boards = {
	"scale-to-millions": board("The ladder you redraw under every later design", [
		col("Clients", [n("c", "Web / mobile")]),
		col("Edge", [
			n("dns", "DNS"),
			n("cdn", "CDN", "static"),
			n("lb", "Load balancer", void 0, "accent")
		]),
		col("Compute", [n("app", "Stateless API fleet")]),
		col("Fast state", [n("redis", "Redis", "cache / sessions")]),
		col("Source of truth", [
			n("db", "Primary + replicas"),
			n("q", "Queue + workers"),
			n("s3", "Object store")
		])
	], [
		{
			title: "One box, then a seam",
			text: "Start with web + DB on one host. The first production move is splitting the data store so you can scale and back it up independently."
		},
		{
			title: "Hide compute behind a balancer",
			text: "Two app boxes + a load balancer. Sessions leave local disk (Redis or JWT) so any box can take any request."
		},
		{
			title: "Read path gets cheap",
			text: "Replicas for reads, cache-aside for hot keys, CDN for static. Writes still hit the primary."
		},
		{
			title: "Writes and slow work peel off",
			text: "Object store for blobs. A queue for email, thumbnails, fan-out. Shard the primary only when its write QPS or working set saturates."
		}
	]),
	"interview-framework": board("Four steps. Buy-in after the sketch. Deep-dive only two hard parts.", [
		col("01 Scope", [n("s", "Users, features", "QPS / SLA"), n("out", "Out of scope")]),
		col("02 Sketch", [n("api", "APIs"), n("box", "Boxes + stores", void 0, "accent")]),
		col("03 Deep dive", [n("h1", "Hard part A"), n("h2", "Hard part B")]),
		col("04 Wrap", [n("fail", "Failures"), n("next", "If we had an hour")])
	], [
		{
			title: "Scope is numbers",
			text: "Who, what, how many, how fresh, what is out. Write QPS and storage on the board. Ask if you do not have them."
		},
		{
			title: "Sketch until they nod",
			text: "APIs, the data stores, the request path. Pause. 'Does this match what you had in mind?' The most common failure is drawing for 25 minutes on the wrong design."
		},
		{
			title: "Deep-dive two subsystems",
			text: "Fan-out, the hash ring, the ledger, the 429 path — pick the two that make this problem itself."
		},
		{
			title: "Wrap with failure",
			text: "Name the bottleneck, the SPOF, what another hour would buy. Interviewers grade the close."
		}
	]),
	"rate-limiter": board("Every request is a decision: allow, or 429. Redis holds the buckets.", [
		col("Clients", [n("c", "Apps / IPs", "API keys")]),
		col("Edge", [n("gw", "API gateway", "or middleware", "accent")]),
		col("Rules", [n("r", "Rules cache", "per key / route")]),
		col("Counters", [n("redis", "Redis", "Lua / INCR", "ok")]),
		col("Origin", [n("api", "API fleet"), n("w", "Rules worker")])
	], [
		{
			title: "Gateway sees every call",
			text: "The limiter sits in the gateway or as middleware. It loads the rule for (key, endpoint, tier) from a memory cache, not from a database on the hot path."
		},
		{
			title: "One atomic update",
			text: "Redis INCR or a Lua script refills the token bucket and consumes one token. Two app boxes cannot both think they got the last token."
		},
		{
			title: "Allow or 429",
			text: "On allow, forward to the API. On reject, return 429 with Retry-After and remaining quota headers. Never fail open into a billing API without saying so."
		},
		{
			title: "Rules are a side channel",
			text: "A worker pulls the rule set so product can change limits without a deploy. If Redis is down, pick fail-open (availability) or fail-closed (correctness) out loud."
		}
	]),
	"consistent-hashing": board("Hash the key and the servers onto one circle. Owner = first vnode clockwise.", [
		col("Key", [n("k", "object key")]),
		col("Hash", [n("h", "hash(key)", "onto the ring", "accent")]),
		col("Ring", [n("v", "Virtual nodes", "many per host")]),
		col("Physical", [
			n("s1", "Server A"),
			n("s2", "Server B"),
			n("s3", "Server C")
		])
	], [
		{
			title: "Same hash space",
			text: "Servers (as many virtual nodes each) and keys share one circle. Lookup is 'walk clockwise to the next vnode'."
		},
		{
			title: "Join steals an arc",
			text: "A new vnode takes the range that used to belong to its successor. Everyone else keeps their keys. That is the whole point versus modulo N."
		},
		{
			title: "Weights are vnode counts",
			text: "A bigger box gets more vnodes so it owns more of the ring. One point per server is too coarse and load looks spiky."
		},
		{
			title: "Replication is clockwise neighbors",
			text: "Dynamo copies a key to the next N-1 physical hosts on the ring. Open the lab and add a node — watch how few keys move."
		}
	]),
	"kv-store": board("Dynamo-class AP store: ring, quorum, gossip, LSM on disk.", [
		col("Client", [n("c", "Smart client", "or coordinator")]),
		col("Membership", [n("ring", "Hash ring", void 0, "accent"), n("g", "Gossip")]),
		col("Replicas", [
			n("n1", "Replica 1"),
			n("n2", "Replica 2"),
			n("n3", "Replica 3", "N=3")
		]),
		col("Engine", [
			n("log", "Commit log"),
			n("mem", "Memtable"),
			n("sst", "SSTables")
		])
	], [
		{
			title: "Coordinator hashes the key",
			text: "The client or a random node finds the N successors on the ring and becomes the coordinator for this request."
		},
		{
			title: "Quorum write",
			text: "Write to N, wait for W acks, return. Hinted handoff parks a copy on a live neighbor if one replica is down."
		},
		{
			title: "Quorum read + repair",
			text: "Read R copies. If they disagree, return the merged value and write it back (read repair). Merkle trees catch drift in the background."
		},
		{
			title: "LSM on each node",
			text: "Append to a commit log + memtable, flush to immutable SSTables, compact later. Bloom filters skip files that cannot contain the key."
		}
	]),
	"unique-id": board("64-bit, roughly time-ordered, no coordination on the hot path.", [
		col("Clock", [n("t", "Timestamp", "41 bits")]),
		col("Placement", [n("dc", "Datacenter", "5 bits"), n("w", "Worker", "5 bits")]),
		col("Mint", [n("seq", "Sequence", "12 bits / ms", "accent")]),
		col("ID", [n("id", "64-bit Snowflake", void 0, "ok")])
	], [
		{
			title: "Name the foils",
			text: "UUID v4 is big and unordered. DB auto-increment does not shard. A Flickr ticket server is a bottleneck. Snowflake is the default answer."
		},
		{
			title: "Pack the 64 bits",
			text: "1 unused sign + 41 timestamp + 5 datacenter + 5 worker + 12 sequence. ~69 years, 32 DCs, 32 workers, 4096 IDs per worker per millisecond."
		},
		{
			title: "Worker IDs are assigned",
			text: "Zookeeper / etcd hands out worker numbers at boot. The hot path does not talk to them again."
		},
		{
			title: "Clock went backwards",
			text: "Refuse to mint until the clock catches up, or hold the last timestamp and increment sequence. Never emit a duplicate."
		}
	]),
	"url-shortener": board("Tiny writes, huge reads. Mint a code, cache the redirect, never block on analytics.", [
		col("Client", [n("u", "Browser / app")]),
		col("Edge", [n("lb", "LB + API")]),
		col("IDs", [n("id", "Counter / Snowflake", void 0, "accent")]),
		col("Read path", [n("cache", "Redis", "code → URL", "ok"), n("db", "Links DB")]),
		col("Side", [n("q", "Click queue")])
	], [
		{
			title: "POST mints a code",
			text: "Validate the long URL, allocate a unique integer (ticket or Snowflake), encode base62 (7 chars ≈ 3.5e12), persist, return https://host/code."
		},
		{
			title: "GET is a cache lookup",
			text: "code → long URL in Redis, else DB, then 302. 301 is CDN-friendly but painful if the mapping ever changes."
		},
		{
			title: "Analytics are fire-and-forget",
			text: "Enqueue the click. The redirect path does not wait on a warehouse write."
		},
		{
			title: "Collisions",
			text: "A hash of the long URL can collide and is only useful if you want the same URL → same code. A counter never collides."
		}
	]),
	"web-crawler": board("A polite pipeline: frontier → DNS → fetch → parse → store, with a seen-set.", [
		col("Seeds", [n("s", "Seed URLs")]),
		col("Frontier", [n("f", "Per-host queues", void 0, "accent"), n("seen", "Seen-URL", "Bloom + store")]),
		col("Fetch", [n("dns", "DNS cache"), n("ft", "Fetcher")]),
		col("Extract", [n("p", "Parser"), n("fp", "Simhash")]),
		col("Store", [n("doc", "Document store")])
	], [
		{
			title: "Frontier is the scheduler",
			text: "Priority plus per-host queues so one origin cannot monopolize the crawler, and robots.txt / crawl-delay are honored."
		},
		{
			title: "Seen-set before fetch",
			text: "Canonicalize, ask a Bloom filter, then a durable key store. False positives skip a page; false negatives waste a fetch."
		},
		{
			title: "Fetch and parse",
			text: "DNS is cached (it is otherwise the bottleneck). Parser extracts links back into the frontier and a content fingerprint (simhash) catches mirrors."
		},
		{
			title: "Workers are stateless",
			text: "The frontier and seen-set are shared. Recrawl frequency is a function of change rate and importance — news every minute, a parked domain every month."
		}
	]),
	notification: board("One event, many channels. Isolate providers so SMS cannot stall push.", [
		col("Producers", [n("p", "Product services")]),
		col("Gateway", [n("gw", "Notif API")]),
		col("Fan-out", [n("q", "Per-channel queues", void 0, "accent")]),
		col("Workers", [n("w", "Template + prefs")]),
		col("Providers", [
			n("fcm", "FCM / APNs"),
			n("ses", "Email"),
			n("sms", "SMS")
		])
	], [
		{
			title: "Ingest is a thin API",
			text: "Internal callers post { user, template, data }. The gateway authenticates and enqueues — it does not talk to Twilio on the request path."
		},
		{
			title: "Queue per channel",
			text: "Push, email, SMS each get a queue so a slow SMS provider cannot stall fire alarms. A DLQ catches poison messages."
		},
		{
			title: "Workers honor prefs",
			text: "Expand the template, check quiet hours and opt-outs, then call the channel adapter. Idempotency key = (user, template, window)."
		},
		{
			title: "Throttle both ways",
			text: "Providers throttle you. You also token-bucket per (user, channel) so a buggy loop cannot SMS someone 400 times."
		}
	]),
	"news-feed": board("Hybrid fan-out: push for normal users, pull celebrities at read time.", [
		col("Publish", [n("p", "Post API")]),
		col("Graph", [n("g", "Follow graph")]),
		col("Fan-out", [n("w", "Push workers", "normal users", "accent"), n("cel", "Celebrity IDs", "pull at read")]),
		col("Feeds", [n("cache", "Per-user feed", "Redis / Cassandra")]),
		col("Read", [n("r", "Feed mixer", void 0, "ok")])
	], [
		{
			title: "Publish is a small write",
			text: "Store the post body once. The expensive part is telling followers it exists."
		},
		{
			title: "Push for bounded graphs",
			text: "A worker writes the post ID onto each follower's precomputed timeline. Reads become lrange. This dies at 50M followers."
		},
		{
			title: "Pull for celebrities",
			text: "Do not fan-out a celebrity write. At read time, merge the user's push-feed with recent posts from the celebrity IDs they follow."
		},
		{
			title: "Mixer + ranker",
			text: "Fill bodies from a post store, attach media URLs from the CDN, optionally rank. Ranking is a separate service — do not stuff ML into the write path in 45 minutes."
		}
	]),
	chat: board("WebSocket in, a sequenced message store, pub/sub across chat servers.", [
		col("Alice", [n("a", "WS client")]),
		col("Server A", [n("sa", "Chat server A"), n("reg", "Session registry", "user → box")]),
		col("Bus", [n("bus", "Pub/sub", void 0, "accent"), n("db", "Message log")]),
		col("Server B", [n("sb", "Chat server B")]),
		col("Bob", [n("b", "WS client", void 0, "ok")])
	], [
		{
			title: "Sticky session",
			text: "Each online user lives on one chat server. A registry (Redis) maps user → server so the next hop knows where to publish."
		},
		{
			title: "Persist, then fan-out",
			text: "Alice's server assigns a per-channel sequence number, writes the message, then publishes to the channel. Client-generated IDs make retries idempotent."
		},
		{
			title: "Bob is online or not",
			text: "If Bob's server is subscribed, it pushes over the socket. If he is offline, the store holds the message; reconnect (or a push notification) pulls the gap."
		},
		{
			title: "Groups are a log",
			text: "Small groups fan-out like 1:1. Huge broadcast channels are a pull-from-log, like a feed — do not write per-member copies."
		}
	]),
	autocomplete: board("Offline trie from search logs; online is a prefix lookup under 50 ms.", [
		col("Offline", [n("log", "Search logs"), n("agg", "Aggregator")]),
		col("Index", [n("trie", "Trie snapshot", "top-k heaps", "accent")]),
		col("Serve", [n("api", "Autocomplete API"), n("cache", "Hot prefixes")]),
		col("Client", [n("c", "Keystroke")])
	], [
		{
			title: "Build offline",
			text: "Aggregate logs into (query, frequency). Cap at a frequency threshold so the dictionary stays bounded. Build a trie (or a sorted prefix table)."
		},
		{
			title: "Top-k lives on the node",
			text: "Each trie node keeps a small heap of the best completions under that prefix so a query does not walk the world."
		},
		{
			title: "Ship a snapshot",
			text: "Servers load the snapshot into memory. Shard by first character so 's' and 't' are different hosts. Rebuild on a cadence (hourly / daily)."
		},
		{
			title: "Online is a lookup",
			text: "Every keystroke hits the API. Cache 'a', 'an', 'and'. Personalization and typos are a later layer, not v1."
		}
	]),
	youtube: board("Control plane is cheap. The data plane is object storage, transcoders, and a CDN.", [
		col("Upload", [n("c", "Creator"), n("put", "Presigned PUT")]),
		col("Control", [n("api", "Metadata API"), n("sql", "Titles / ACLs")]),
		col("Process", [n("q", "Encode queue", void 0, "accent"), n("x", "Transcoders")]),
		col("Store", [n("s3", "Object store", "renditions")]),
		col("Play", [n("cdn", "CDN POPs", void 0, "ok"), n("p", "ABR player")])
	], [
		{
			title: "Upload skips the app server",
			text: "The client gets a presigned URL and PUTs the original into object storage. A completion callback enqueues transcode."
		},
		{
			title: "Encode is async",
			text: "Workers emit 360p…4K plus an HLS/DASH manifest. This is slow on purpose — it is a job, not a request."
		},
		{
			title: "Playback is a nearby POP",
			text: "The player fetches the manifest, then segments. ABR picks a bitrate from buffer health. Origin is not on this path if the CDN is healthy."
		},
		{
			title: "Hot titles dominate",
			text: "A tiny fraction of videos get almost all views. Pre-warm POPs on predicted viral uploads. Origin shield protects storage from miss storms."
		}
	]),
	"google-drive": board("A file is a list of block hashes. Metadata is CP; bytes are an object store.", [
		col("Client", [n("c", "Sync client", "chunker")]),
		col("Notify", [n("n", "Change stream")]),
		col("Metadata", [n("m", "Tree + ACLs", "strong SQL", "accent")]),
		col("Blocks", [n("b", "Block store", "content-addressed")])
	], [
		{
			title: "Split the file",
			text: "The client cuts the file into ~4 MB chunks, hashes them, and skips chunks the store already has (dedup)."
		},
		{
			title: "Commit a version",
			text: "Once blocks are up, the metadata service writes a new file version: ordered block list + ACLs. That write is strongly consistent."
		},
		{
			title: "Bytes are dumb storage",
			text: "The block store is S3-like. It does not know about folders. Losing metadata orphans bytes — treat that DB as the CP heart."
		},
		{
			title: "Sync is a notification",
			text: "Other devices subscribe to the namespace and pull new versions. Two offline edits: keep both and surface a conflict (Docs is a different design)."
		}
	]),
	proximity: board("Turn 'near me' into a handful of geo cells, then filter true distance.", [
		col("Query", [n("q", "lat, lng, r")]),
		col("Cover", [n("c", "Cell cover", "geohash / S2", "accent")]),
		col("Store", [n("sh", "Shard by cell")]),
		col("Rank", [n("f", "Filter + rank", void 0, "ok")])
	], [
		{
			title: "Index on write",
			text: "On insert, compute the cell IDs that cover the point (and maybe parents) and store the business under those cells."
		},
		{
			title: "Cover the circle",
			text: "On search, cover the radius with cells. Prefix = coarser cell. Edges need neighbor lookups for geohash."
		},
		{
			title: "Shard by coarse cell",
			text: "A city lives together so a downtown query does not scatter to 200 shards. Redis GEO is a legitimate v1 for one city."
		},
		{
			title: "Filter, then rank",
			text: "True haversine distance, then rating / price. The index is a candidate set, not the answer."
		}
	]),
	"nearby-friends": board("The points move. Ping → live geo index → intersect with the friend list → push.", [
		col("Phone", [n("p", "Duty-cycle GPS")]),
		col("Ingest", [n("i", "Location service")]),
		col("Index", [n("g", "Live geo index", "Redis GEO / cells", "accent"), n("ls", "Last seen")]),
		col("Match", [n("m", "Friend ∩ nearby")]),
		col("Push", [n("ws", "Presence / chat", void 0, "ok")])
	], [
		{
			title: "Duty-cycle the ping",
			text: "Faster when moving, slower when still. 100M users × 30s is ~3M writes/s — you only index opted-in, online sharers."
		},
		{
			title: "Write the latest point",
			text: "A cell → user map (or Redis GEO) plus a last-seen store. The disk copy is for analytics, not matching."
		},
		{
			title: "Intersect with friends",
			text: "People in nearby cells ∩ friend list. Friend lists are small, so this is cheap on read or cached per user."
		},
		{
			title: "Reuse the chat channel",
			text: "Push the update over the existing presence/websocket path. Do not open a second TCP just for dots on a map."
		}
	]),
	"google-maps": board("Two systems: vector tiles for rendering, a road graph for routing.", [
		col("Client", [n("v", "Viewport"), n("sdk", "Nav SDK")]),
		col("Tiles", [n("cdn", "Tile CDN", void 0, "ok"), n("ts", "Vector tiles")]),
		col("Routing", [n("g", "Road graph", void 0, "accent"), n("ch", "CH / A*")]),
		col("Live", [n("tr", "Traffic snapshot")])
	], [
		{
			title: "Tiles are a CDN problem",
			text: "Vector tiles (not giant PNGs) keep style on the client. The map is a cache hit; it is not a graph query."
		},
		{
			title: "Routing is shortest path",
			text: "A road graph whose edge weights mix distance, speed limit, and live traffic. Preprocess (contraction hierarchies) so a cross-city query does not walk every road."
		},
		{
			title: "Traffic is a snapshot",
			text: "Probe data from phones, smoothed, written as edge deltas. The router reads a recent snapshot — it cannot call a live system per edge per query."
		},
		{
			title: "Pick two to deep-dive",
			text: "Do not design geocoding, tiles, routing, and traffic in 45 minutes. Say so, then go deep on tiles + routing."
		}
	]),
	"distributed-mq": board("A topic is a log split into partitions. The partition is the unit of order and parallelism.", [
		col("Produce", [n("pr", "Producer")]),
		col("Control", [n("ctl", "Controller", "assignment")]),
		col("Log", [n("lead", "Partition leader", void 0, "accent"), n("isr", "ISR replicas")]),
		col("Consume", [n("cg", "Consumer group", void 0, "ok")])
	], [
		{
			title: "Hash to a partition",
			text: "Producers send a key. The partition is a sequential log on disk — that is why Kafka is fast. Order is per partition, not per topic."
		},
		{
			title: "Leader + ISR",
			text: "Replicas in the in-sync set must ack before the record is committed if acks=all. A min.insync.replicas of 2 is the money default."
		},
		{
			title: "Consumer groups",
			text: "Each partition is owned by at most one member of a group. Many groups can independently replay the same log from different offsets."
		},
		{
			title: "Controller is membership",
			text: "It assigns leaders and group members. It is not on the data path. KRaft / ZooKeeper is this box."
		}
	]),
	metrics: board("Collect, store, query, alert. Cardinality is the villain.", [
		col("Sources", [n("app", "Apps / exporters")]),
		col("Collect", [n("c", "Scrape / agent", void 0, "accent")]),
		col("Store", [n("ts", "TSDB"), n("ds", "Downsample")]),
		col("Use", [n("q", "Query"), n("a", "Alertmanager", void 0, "warn")])
	], [
		{
			title: "Push vs pull",
			text: "Prometheus scrapes long-lived targets. Datadog agents push. Lambdas and short jobs need a push gateway either way."
		},
		{
			title: "A series is a label set",
			text: "Storage is compressed (timestamp, value) columns keyed by series ID. A label like user_id explodes cardinality and will page you."
		},
		{
			title: "Downsample on purpose",
			text: "10s raw for a day, 1m for two weeks, 5m for a year. Dashboards of last year should not scan raw."
		},
		{
			title: "Alert on symptoms",
			text: "SLIs (error rate, p99, saturation), not 'CPU > 80'. Recording rules keep alert queries cheap."
		}
	]),
	"ad-click": board("Events on a log, stream windows for dashboards, a batch reconcile for money.", [
		col("Events", [n("e", "Impressions / clicks")]),
		col("Log", [n("k", "Kafka", "by campaign")]),
		col("Stream", [n("s", "Event-time windows", void 0, "accent")]),
		col("Serve", [n("olap", "OLAP / Druid")]),
		col("Money", [n("b", "Nightly batch", void 0, "ok")])
	], [
		{
			title: "Partition by campaign",
			text: "Events land on a log. Keying by campaign_id keeps one campaign's aggregations on one operator."
		},
		{
			title: "Windows use event time",
			text: "A click that arrives two hours late still belongs to the original hour. Watermarks close windows; too-late events go to a repair path."
		},
		{
			title: "Idempotent increments",
			text: "Event IDs in a seen-set (Bloom + store) before counters move. Billing cannot double-count a retry."
		},
		{
			title: "Batch is the money path",
			text: "Stream feeds dashboards. Overnight reconcilers are what finance trusts. Do not skip this in the interview."
		}
	]),
	"hotel-reservation": board("Search can be stale. Hold is a conditional decrement. Pay is a saga.", [
		col("Search", [n("idx", "Availability index", "minutes stale")]),
		col("Hold", [n("inv", "Inventory row", "TTL hold", "accent")]),
		col("Pay", [n("pay", "Payment", "idempotency key")]),
		col("Confirm", [n("res", "Reservation", void 0, "ok")])
	], [
		{
			title: "Search is a denormalized index",
			text: "Geo + dates + remaining. It can be a minute behind. Never book from this number alone."
		},
		{
			title: "Hold is atomic",
			text: "UPDATE remaining = remaining - 1 WHERE remaining > 0, or a version column. Write a hold with a 10-minute TTL. Check-then-act is the bug."
		},
		{
			title: "Pay with the reservation id",
			text: "The idempotency key is the reservation. Processor retries must not double-charge."
		},
		{
			title: "Saga, not 2PC",
			text: "On success, hold → booked. On fail or TTL, release. Compensations (void payment, release hold) are the design — not a distributed transaction across vendors."
		}
	]),
	"email-service": board("SMTP in, blob + metadata store, then notify every device.", [
		col("In", [n("mx", "MX / MTA")]),
		col("Filter", [n("sp", "Spam / virus", void 0, "warn")]),
		col("Store", [n("meta", "Headers + labels", "shard by user", "accent"), n("blob", "Body object")]),
		col("Out", [n("idx", "Per-user search"), n("n", "IMAP idle / push")])
	], [
		{
			title: "MX is the front door",
			text: "TLS, greylist, size limits. This is a mail transfer agent, not your app server."
		},
		{
			title: "Filter before inbox",
			text: "Spam and virus in a pipeline. Quarantine first; async is OK. Losing mail is a scandal, delivering a payload is worse."
		},
		{
			title: "Split body from metadata",
			text: "Body in object storage. Headers, folders, labels in a DB sharded by user. Search is a per-user inverted index — not LIKE %query%."
		},
		{
			title: "Wake the devices",
			text: "Web clients get a push. Thick clients use IMAP IDLE. Attachments are OCR'd offline for search."
		}
	]),
	"object-storage": board("HTTP API, a CP metadata index, then erasure-coded chunks on a disk fleet.", [
		col("API", [n("fe", "HTTP frontend"), n("auth", "Auth / presign")]),
		col("Metadata", [n("idx", "Bucket + object index", "CP", "accent")]),
		col("Placement", [n("pl", "Chunk map", "6+3 / 3×")]),
		col("Disks", [
			n("n1", "Storage node"),
			n("n2", "Storage node"),
			n("n3", "Storage node")
		])
	], [
		{
			title: "Control vs data",
			text: "PUT/GET/LIST hit an HTTP frontend. Presigned URLs let browsers talk to the data plane without shipping bytes through your app."
		},
		{
			title: "Metadata is the heart",
			text: "Bucket, key, version, chunk IDs. If this index lies, the bytes are orphans. It is a strongly consistent store."
		},
		{
			title: "Placement spreads failure domains",
			text: "Erasure coding (6+3) for cold large objects; 3× replication for hot small ones. Spread across disk, node, rack, AZ."
		},
		{
			title: "Multipart and scrubbers",
			text: "Huge objects upload in parts, then a complete call concatenates them logically. Background scrubbers catch bit rot."
		}
	]),
	leaderboard: board("A sorted set is the v1. Shard by mode and window; spill the tail.", [
		col("Game", [n("c", "Client / match")]),
		col("Write", [n("api", "Score API")]),
		col("Board", [n("z", "Redis ZSET", "score → player", "accent")]),
		col("Read", [n("top", "Top-N"), n("me", "Me ± 5", void 0, "ok")])
	], [
		{
			title: "ZADD is the write",
			text: "ZADD board score player. During an event this is the hot key. Shard by game mode + time window (daily / weekly)."
		},
		{
			title: "Top-N is ZREVRANGE",
			text: "ZREVRANGE 0 9 WITHSCORES. Cache it for a second if the event is huge."
		},
		{
			title: "My rank is ZREVRANK",
			text: "Plus a small window around the player. Ties: encode score * K - timestamp so earlier arrivals win and the board does not flicker."
		},
		{
			title: "Spill the tail",
			text: "A global board of 100M players keeps the top few million in Redis and the rest on disk. Nobody is looking at rank 80,000,001 in real time."
		}
	]),
	payment: board("Intent → processor → ledger → webhook. The journal is the source of truth.", [
		col("Merchant", [n("m", "Checkout", "Stripe.js token")]),
		col("API", [n("i", "Payment Intent", "Idempotency-Key", "accent")]),
		col("Processor", [n("psp", "Card network")]),
		col("Ledger", [n("j", "Journal", void 0, "ok")]),
		col("Out", [n("wh", "Signed webhooks")])
	], [
		{
			title: "Never touch PAN",
			text: "The browser talks to the processor (Stripe.js) and you receive a token. PCI scope stays small — that is architecture, not a later compliance pass."
		},
		{
			title: "Intent is a state machine",
			text: "requires_action → processing → succeeded | failed. The Idempotency-Key header makes retries the same charge."
		},
		{
			title: "Ledger first",
			text: "On success, append journal lines (merchant receivable, processor clearing, fees). Balances are projections. Do not UPDATE balance = balance + x."
		},
		{
			title: "Webhooks from the ledger",
			text: "Fire signed events from a worker, not from the request thread. Merchants retry; your event id keeps them idempotent too."
		}
	]),
	"digital-wallet": board("Double-entry journal, a clearing account for cross-shard moves, cached balances with a version.", [
		col("Client", [n("u", "Top-up / P2P")]),
		col("Txn", [n("t", "Txn + idem key", void 0, "accent")]),
		col("Journal", [n("a", "Debit A"), n("b", "Credit B", void 0, "ok")]),
		col("Projection", [n("bal", "Balance cache", "versioned")])
	], [
		{
			title: "A transfer is two lines",
			text: "Debit A, credit B, sum to zero, committed together when they share a shard. assert(available >= 0) after apply."
		},
		{
			title: "Idempotency is the txn id",
			text: "Retries with the same key return the original result. There is no second pair of journal lines."
		},
		{
			title: "Cross-shard uses clearing",
			text: "Debit A → credit clearing, then debit clearing → credit B. Reconcile the clearing account constantly. This is the saga."
		},
		{
			title: "Balance is a cache",
			text: "SUM(journal) with a snapshot + version. Conditional update on version prevents lost updates. The journal is the audit trail."
		}
	]),
	"stock-exchange": board("A sequenced log in, a single-threaded matcher per symbol, a log of trades out.", [
		col("Trader", [n("t", "OMS / gateway")]),
		col("Sequence", [n("log", "Input log", void 0, "accent")]),
		col("Match", [n("m", "1 thread / symbol", "price-time book")]),
		col("Out", [
			n("tr", "Trades"),
			n("md", "Market data", void 0, "ok"),
			n("cl", "Clearing")
		])
	], [
		{
			title: "Gateway sequences",
			text: "Assign a global order-id, persist on the input log, ack. Fairness starts here — FIFO at a price level is the matching rule."
		},
		{
			title: "One thread per symbol",
			text: "The matcher reads the log, mutates bid/ask trees, emits trades and book deltas. Two threads on AAPL is a bug, not a scale strategy."
		},
		{
			title: "Output log is truth",
			text: "Market-data publishers and the clearing/ledger follow the output log. Replicas replay; they do not match independently."
		},
		{
			title: "Memory is the book",
			text: "Bids desc, asks asc; each price is a FIFO queue. Recover by replaying the log (plus snapshots). Hot symbols get a bigger machine, not a second matcher."
		}
	]),
	"auth-system": board("Short-lived JWT on the request, opaque rotating refresh in an HttpOnly cookie, sessions in Redis.", [
		col("Client", [n("c", "Browser / app")]),
		col("BFF", [n("gw", "API / BFF")]),
		col("Auth", [n("a", "Auth service", void 0, "accent")]),
		col("Store", [n("s", "Session Redis"), n("u", "User DB")]),
		col("SSO", [n("idp", "IdP / OIDC")])
	], [
		{
			title: "Login starts a session",
			text: "Verify password (argon2id) or a code from the IdP. Write a session row (hashed refresh, device, expiry). Set the refresh cookie HttpOnly + Secure + SameSite."
		},
		{
			title: "Access token is a postcard",
			text: "A 5–15 min JWT rides on every API call. Resource servers verify the signature (kid) and do not hit Redis. Never put secrets in it."
		},
		{
			title: "Refresh rotates",
			text: "POST /refresh: check the hash, mint a new pair, revoke the old refresh. A stolen refresh token is a one-shot."
		},
		{
			title: "Revoke is a row delete",
			text: "Sign-out-everywhere deletes session rows. Access tokens linger until expiry unless you keep a denylist — say that trade-off."
		}
	]),
	"distributed-cache": board("Client-sharded memory in front of an origin. The ring, not the map, is the design.", [
		col("App", [n("a", "App fleet")]),
		col("Route", [n("r", "Hash ring", void 0, "accent")]),
		col("Cache", [
			n("n1", "Node A", "LRU + TTL"),
			n("n2", "Node B"),
			n("n3", "Node C")
		]),
		col("Origin", [n("db", "DB / service")])
	], [
		{
			title: "Hash the key onto a node",
			text: "Clients or a proxy use consistent hashing so a restart remaps ~1/N keys. Sticky routing without a coordinator."
		},
		{
			title: "Cache-aside is the default",
			text: "GET miss → load origin → SET. Write-through if you cannot tolerate a stale window. The origin remains the source of truth."
		},
		{
			title: "Evict on purpose",
			text: "Size cap + LRU/LFU + TTL. TTL alone will OOM. TinyLFU kills one-hit wonders that would pollute LRU."
		},
		{
			title: "Stampede",
			text: "A hot key expires; ten thousand misses hit origin. Mitigate with single-flight, jittered TTLs, and a short stale-serve window."
		}
	]),
	instagram: board("Media is a pipeline. The follow graph is a hybrid fan-out. They only share a user id.", [
		col("Client", [n("cam", "Camera roll")]),
		col("Upload", [n("put", "Presigned PUT"), n("x", "Transcode", void 0, "accent")]),
		col("Graph", [n("g", "Follow graph"), n("fan", "Fan-out workers")]),
		col("Feed", [n("f", "Feed cache")]),
		col("Read", [n("cdn", "CDN images", void 0, "ok")])
	], [
		{
			title: "Bytes never hit the API",
			text: "The client asks for a signed PUT URL and uploads straight to object storage. A worker transcodes variants (feed, story, permalink) and marks the post ready."
		},
		{
			title: "The post is metadata",
			text: "Caption, author, media ids. The feed stores post ids, not blobs. The client resolves URLs from the CDN."
		},
		{
			title: "Hybrid fan-out",
			text: "Push onto followers' feed caches, except celebrity accounts which stay pull-on-read — same plot as the news-feed example, with an immutable media pipeline in front."
		},
		{
			title: "Stories are TTL",
			text: "A 24h flag plus a separate index. Do not put them on the durable home-feed list."
		}
	]),
	spotify: board("Catalog is small and precious. Audio is encrypted chunks on a CDN. Entitlement sits in between.", [
		col("Player", [n("p", "Client", "prefetch")]),
		col("Control", [n("api", "API"), n("ent", "Entitlement", void 0, "accent")]),
		col("Catalog", [n("cat", "Metadata"), n("rec", "Reco")]),
		col("Audio", [n("cdn", "Chunk CDN", void 0, "ok")]),
		col("Events", [n("ev", "Play events")])
	], [
		{
			title: "Ask entitlement first",
			text: "May this user play this track in this country, on this plan, right now? Only then mint a CDN URL. License accuracy is a product requirement."
		},
		{
			title: "Manifest, then range-GETs",
			text: "The player fetches a manifest and pulls encrypted Ogg/AAC chunks ahead of the playhead. Drop bitrate on a bad cell link — same idea as video ABR, smaller ladder."
		},
		{
			title: "Catalog is not the bytes",
			text: "Track / album / artist / ISRC live in a searchable store. This is small. Getting it wrong is a lawsuit; getting it slow is a skip."
		},
		{
			title: "Keep the music going",
			text: "Prefetch 15–30s. Offline = device-bound encrypted blobs plus a periodic online check. Play events feed royalties — they cannot be best-effort forever."
		}
	]),
	netflix: board("Encode once. Sit inside the ISP (Open Connect). Control plane is an ordinary API.", [
		col("Studio", [n("in", "Mezzanine ingest")]),
		col("Encode", [n("q", "Encode farm", "ladder × codec", "accent")]),
		col("Control", [n("api", "Catalog + auth"), n("h", "Bookmarks")]),
		col("Data", [n("oc", "Open Connect", "ISP box", "ok"), n("cdn", "Public CDN")]),
		col("Player", [n("ab", "ABR + DRM")])
	], [
		{
			title: "Encode is a factory",
			text: "Every title → many bitrates × codecs × languages. A job queue, not a user-facing API. DRM licenses are minted at play time."
		},
		{
			title: "Opening night is placement",
			text: "Pre-position the title on Open Connect appliances inside the ISPs you care about. That is how a premiere does not melt a public CDN."
		},
		{
			title: "Control plane is boring",
			text: "Auth, catalog, viewing history, rows. Ordinary stateless APIs plus a history store. Do not mix it with the byte path."
		},
		{
			title: "ABR on 2–4s segments",
			text: "The player picks a rung from recent throughput. A bad guess recovers at the next segment. Downloads are encrypted and device-bound."
		}
	]),
	"job-scheduler": board("A due-index, SKIP LOCKED leases, a work queue, idempotent handlers.", [
		col("API", [n("a", "Register / cancel")]),
		col("Schedule", [n("db", "Jobs DB", "next_run_at", "accent")]),
		col("Dispatch", [n("d", "Shard poller", "SKIP LOCKED")]),
		col("Run", [n("q", "Work queue"), n("w", "Workers", void 0, "ok")])
	], [
		{
			title: "The due-index is the design",
			text: "Store jobs with (shard, next_run_at). Dispatchers poll their shard: SELECT … WHERE next_run_at <= now FOR UPDATE SKIP LOCKED — or a Redis ZSET of due times."
		},
		{
			title: "A claim is a lease",
			text: "On pick: write owner + expiry, enqueue the run, bump next_run_at for cron. Lease expiry lets another dispatcher reclaim a dead worker."
		},
		{
			title: "Exactly-once is a lie",
			text: "The worker can finish the side effect and die before ack. Handlers must be idempotent (run id). For money, pair with a ledger."
		},
		{
			title: "Do not cron-storm",
			text: "A million jobs at midnight: jitter next_run_at and cap claim batch size so you do not melt the queue."
		}
	]),
	tinder: board("Geo builds the deck. A like graph records the swipe. A match is the reverse edge.", [
		col("Ping", [n("loc", "Location")]),
		col("Deck", [n("geo", "Geo index", void 0, "accent"), n("rank", "Ranker")]),
		col("Swipe", [n("g", "Like graph")]),
		col("Match", [n("m", "Mutual pair", "CAS on the pair", "ok")]),
		col("Chat", [n("ch", "Chat channel")])
	], [
		{
			title: "Deck is a geo query",
			text: "Coarse geohash → candidates, filter prefs, rank by a model (activity, distance, prior likes). The 'already seen' set is a bloom or a time-partitioned list."
		},
		{
			title: "Like is an edge",
			text: "Write A→B. Pass is a negative you usually do not store forever."
		},
		{
			title: "Match is atomic",
			text: "On like, if B→A exists, create a match. Lock or compare-and-set on (min(A,B), max(A,B)). Then notify both. Do not poll."
		},
		{
			title: "Chat is a new channel",
			text: "Reuse the chat example. The dating product is the matching graph plus geo; messaging is a solved box."
		}
	]),
	"google-search": board("Four machines: crawl, invert, rank, serve. Serving is doc-sharded scatter-gather.", [
		col("Offline", [
			n("cr", "Crawler"),
			n("ix", "Indexer", "postings", "accent"),
			n("pr", "PageRank")
		]),
		col("Index", [n("sh", "Doc shards")]),
		col("Online", [n("fe", "Query front"), n("mix", "Mixer", void 0, "ok")]),
		col("Snippets", [n("doc", "Doc store")])
	], [
		{
			title: "Crawl is a frontier",
			text: "Reuse the web-crawler example. Politeness, canonical URLs, the seen-set."
		},
		{
			title: "Invert offline",
			text: "Documents → tokens → posting lists (doc id, tf, positions). Offline scores (PageRank, freshness) sit next to the postings."
		},
		{
			title: "Serve doc-sharded",
			text: "Every shard does a local top-k (WAND / BM25). The mixer merges. Term-sharding makes rare terms easy and hot terms painful — most web search is doc-sharded."
		},
		{
			title: "Snippets need positions",
			text: "That is why posting lists keep offsets and why a document store is not optional. Autocomplete is a separate example."
		}
	]),
	uber: board("City shard. Live geo of idle drivers. A lease so two matchers cannot hand the same car.", [
		col("Rider", [n("r", "Request trip")]),
		col("City", [n("api", "Trip API"), n("geo", "Live geo index", void 0, "accent")]),
		col("Match", [n("m", "Dispatcher", "idle → pending lease")]),
		col("Driver", [n("d", "Offer + timeout", void 0, "ok")]),
		col("Trip", [n("eta", "ETA / maps"), n("pay", "Fare")])
	], [
		{
			title: "Partition by city",
			text: "A driver is in one ring. Location pings (every 1–4s on trip, slower when idle) write an in-memory geo index for that city."
		},
		{
			title: "Cover the pickup",
			text: "Cells around the pin → idle drivers. Score by ETA, rating, destination, battery. Do not ping-pong the same car."
		},
		{
			title: "The offer is a lease",
			text: "Compare-and-set idle → pending (10s) → on_trip. Two matchers racing is the bug; a lock on driver id plus the city shard fixes it."
		},
		{
			title: "Surge is a cache",
			text: "Demand in cell / idle supply over a short window. It is a multiplier, not a transaction. ETA comes from the maps example."
		}
	]),
	"food-delivery": board("Three sides. Dispatch late so the courier arrives as the bag comes up, not twenty minutes earlier.", [
		col("Diner", [n("menu", "Menu CDN"), n("cart", "Cart")]),
		col("Order", [n("o", "Order log", "state machine", "accent")]),
		col("Merchant", [n("k", "Prep clock")]),
		col("Dispatch", [n("d", "Delayed match")]),
		col("Courier", [n("c", "Pickup → drop", void 0, "ok")])
	], [
		{
			title: "Order is a state machine",
			text: "Place → payment hold → merchant accept (timeout cancels) → preparing → ready → picked up → delivered → capture."
		},
		{
			title: "Menus are cacheable",
			text: "The diner path is a CDN. Orders are not. That split is the first sentence of the design."
		},
		{
			title: "Dispatch on ready_at",
			text: "Estimate ready_at = now + quoted prep. Send the courier so they arrive near ready_at. Naive 'match now' parks couriers in the restaurant."
		},
		{
			title: "Batching is the margin",
			text: "Score candidates on time-to-restaurant vs remaining prep, stacked orders (same merchant, nearby dropoffs). Two bags on one courier is the business."
		}
	]),
	"google-docs": board("A sticky sequencer per doc. Ops on a log, snapshots for late joiners, presence on the side.", [
		col("Peers", [n("a", "Client A"), n("b", "Client B")]),
		col("Session", [n("s", "Doc server", "sticky / doc id", "accent")]),
		col("Log", [n("op", "Op log"), n("sn", "Snapshots")]),
		col("ACL", [n("acl", "Share / ACL")])
	], [
		{
			title: "Optimistic local apply",
			text: "The keystroke lands in the local model immediately (< 50 ms). Then the op goes to the doc server."
		},
		{
			title: "One sequencer per doc",
			text: "Sticky via consistent hash on doc id. The server transforms (OT) or orders (CRDT) ops, appends the log, broadcasts to other sockets."
		},
		{
			title: "Snapshots for late joiners",
			text: "Every N ops, write a snapshot to object storage so a new tab does not replay the whole history. Undo is the log."
		},
		{
			title: "OT vs CRDT",
			text: "OT if always-online and Google-Docs-shaped (server is the doc's availability). CRDT if offline / local-first (metadata bloat, compaction). Say which and why."
		}
	]),
	zoom: board("Signaling is JSON. Media is WebRTC to an SFU. TURN is the expensive fallback.", [
		col("You", [n("a", "Client A")]),
		col("Signal", [n("sig", "Signaling", "join / mute / roster")]),
		col("Media", [n("sfu", "SFU", "simulcast", "accent"), n("turn", "TURN", "if NAT", "warn")]),
		col("Them", [n("b", "Client B", void 0, "ok")]),
		col("Side", [n("rec", "Recorder")])
	], [
		{
			title: "Signaling is easy",
			text: "Join, SDP offer/answer, mute, roster — a websocket. It is not the hard part. Say that and move on."
		},
		{
			title: "SFU forwards, it does not mix",
			text: "Each sender uploads 2–3 bitrates (simulcast). The SFU picks a rung per receiver. MCU (mix into one encode) is a fallback for phones and recordings."
		},
		{
			title: "NAT: STUN then TURN",
			text: "Most home NATs punch with STUN. Symmetric NAT needs a TURN relay — budget it, it is the expensive path."
		},
		{
			title: "Webinars are receive-only",
			text: "A thousand 'participants' are not a thousand full meshes. Recording is a hidden client of the SFU. Chat piggybacks on signaling."
		}
	]),
	"ticket-booking": board("Waiting room, then a unique hold on the seat, then pay, then a ticket.", [
		col("Crowd", [n("q", "Waiting room")]),
		col("Map", [n("ui", "Seat map cache")]),
		col("Hold", [n("h", "Hold table", "UNIQUE seat_id", "accent")]),
		col("Pay", [n("p", "Payment")]),
		col("Ticket", [n("t", "Issued ticket", void 0, "ok")])
	], [
		{
			title: "Queue the on-sale",
			text: "A virtual waiting room so only N checkouts run. The origin will not survive a fair on-sale without this."
		},
		{
			title: "The unique constraint is the design",
			text: "INSERT hold (seat, user, expiry) ON CONFLICT seat_id DO NOTHING and see if you won. Do not check-then-insert. A TTL worker releases abandoned holds."
		},
		{
			title: "The drawn map is a cache",
			text: "The UI can be slightly wrong. The hold table is truth. On a conflict, refresh the map."
		},
		{
			title: "Pay, then commit",
			text: "Idempotency key = hold id. Success: hold → sold, mint ticket, email. General admission is an atomic counter instead of a seat row."
		}
	]),
	"distributed-lock": board("A tiny Raft group. Locks are files with a lease and a fencing token. Not Redis SETNX.", [
		col("Clients", [n("c", "Services")]),
		col("Leader", [n("l", "Lock leader", void 0, "accent")]),
		col("Raft", [
			n("f1", "Follower"),
			n("f2", "Follower"),
			n("f3", "Follower")
		]),
		col("Use", [n("tok", "Fencing token", void 0, "ok"), n("w", "Watch")])
	], [
		{
			title: "A handful of replicas",
			text: "Raft/Paxos, one leader for writes. A lock is a file: {holder, fencing_token, lease_expiry}. Acquire is create-if-not-exists or CAS if expired."
		},
		{
			title: "Leases, not forever",
			text: "Clients heartbeat. A dead holder expires. This is Chubby / etcd / ZooKeeper, for thousands of locks — not billions of rows."
		},
		{
			title: "Fencing tokens",
			text: "The lock service hands out a monotonic token. The data store rejects writes with a lower token. This is how a GC-paused holder cannot write after losing the lock — SETNX cannot do this."
		},
		{
			title: "Watches for membership",
			text: "Ephemeral nodes + watches are how GFS/Bigtable and Kubernetes elect leaders. Per-row mutexes belong in the database, not here."
		}
	])
};
function getBoard(slug) {
	return boards[slug];
}
Object.keys(boards).length;
function StepLabel({ n, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-mono text-[11px] tabular-nums text-accent",
			children: n
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] font-medium uppercase tracking-[0.16em] text-faint",
			children: title
		})]
	});
}
function H2({ children, id }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		id,
		className: "scroll-mt-24 font-display text-xl font-medium tracking-tight sm:text-2xl",
		children
	});
}
function ExampleView({ example, id }) {
	const board = getBoard(example.slug);
	const toc = [
		{
			id: "requirements",
			label: "Requirements",
			group: "1 · Scope"
		},
		...example.estimation?.length || example.math?.length ? [{
			id: "estimation",
			label: "Back of the envelope",
			group: "1 · Scope"
		}] : [],
		...example.apis?.length ? [{
			id: "apis",
			label: "API design",
			group: "2 · High-level design"
		}] : [],
		...example.dataModel?.length ? [{
			id: "data-model",
			label: "Data model",
			group: "2 · High-level design"
		}] : [],
		...board ? [{
			id: "architecture-board",
			label: "Architecture",
			group: "2 · High-level design"
		}] : [],
		...example.architecture.map((s, i) => ({
			id: headingId(s.heading, i),
			label: s.heading,
			group: "2 · High-level design"
		})),
		...example.deepDives.map((s, i) => ({
			id: headingId(s.heading, 100 + i),
			label: s.heading,
			group: "3 · Deep dive"
		})),
		...example.tradeoffs.length ? [{
			id: "tradeoffs",
			label: "Trade-offs",
			group: "4 · Wrap up"
		}] : [],
		...example.wrapUp?.length ? [{
			id: "wrap-up",
			label: "What to say at the end",
			group: "4 · Wrap up"
		}] : [],
		...example.followUps?.length ? [{
			id: "follow-ups",
			label: "Follow-up questions",
			group: "4 · Wrap up"
		}] : []
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: `${example.source}${example.chapter ? ` · Chapter ${example.chapter}` : ""}`,
		title: example.title,
		subtitle: example.summary,
		minutes: example.minutes,
		tags: [example.difficulty, ...example.tags],
		id
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-5 py-8 sm:px-8 lg:px-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "lg:flex lg:gap-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1 space-y-10",
				children: [
					example.playground ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/playgrounds/$slug",
							params: { slug: example.playground },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "size-4" }), "Open the matching lab"]
						})
					}) : null,
					example.companies.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: ["In the wild: ", example.companies.join(" · ")]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepLabel, {
						n: 1,
						title: "Understand the problem, establish scope"
					}),
					example.clarifying?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, { children: "Questions to ask first" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-prose text-[14px] leading-6 text-faint",
							children: "The first five minutes decide what you build. These are the questions worth spending them on, and the answers this design assumes."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "mt-4 space-y-3",
							children: example.clarifying.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border bg-surface px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
									className: "text-[14px] font-medium leading-6 text-fg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mr-2 font-mono text-[11px] text-accent",
										children: "You"
									}), c.q]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
									className: "mt-1.5 max-w-prose text-[14px] leading-6 text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mr-2 font-mono text-[11px] text-ok",
										children: "Them"
									}), c.a]
								})]
							}, c.q))
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
						id: "requirements",
						children: "Requirements"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border bg-surface p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-[11px] uppercase tracking-[0.14em] text-accent",
								children: "Functional"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-2 text-sm leading-6 text-muted",
								children: example.requirements.functional.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-[9px] size-1 shrink-0 rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r })]
								}, r))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border bg-surface p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-[11px] uppercase tracking-[0.14em] text-accent",
								children: "Non-functional"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-2 text-sm leading-6 text-muted",
								children: example.requirements.nonFunctional.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-[9px] size-1 shrink-0 rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r })]
								}, r))
							})]
						})]
					})] }),
					example.estimation?.length || example.math?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
							id: "estimation",
							children: "Back of the envelope"
						}),
						example.math?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 overflow-x-auto rounded-lg border border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
								className: "w-full min-w-[520px] text-left text-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: example.math.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-border first:border-t-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "w-[28%] px-3 py-2 align-top font-medium text-fg",
											children: m.label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-3 py-2 align-top font-mono text-[12px] text-muted",
											children: [m.expr, m.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-0.5 font-sans text-[11.5px] text-faint",
												children: m.note
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "w-[22%] whitespace-nowrap px-3 py-2 text-right align-top font-mono text-[12.5px] font-medium text-accent",
											children: m.result
										})
									]
								}, m.label)) })
							})
						}) : null,
						example.estimation?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 overflow-x-auto rounded-lg border border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
								className: "w-full text-left text-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: example.estimation.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-border first:border-t-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2 font-medium",
										children: e.item
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-xs text-muted",
										children: e.calc
									})]
								}, e.item)) })
							})
						}) : null
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepLabel, {
						n: 2,
						title: "Propose the high-level design"
					}),
					example.apis?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
						id: "apis",
						children: "API design"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 overflow-x-auto rounded-lg border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[480px] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-raised text-xs uppercase tracking-wider text-faint",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Method"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Path"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Role"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: example.apis.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-xs text-accent",
										children: a.method
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-mono text-xs",
										children: a.path
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-muted",
										children: a.desc
									})
								]
							}, a.path + a.method)) })]
						})
					})] }) : null,
					example.dataModel?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
						id: "data-model",
						children: "Data model"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid gap-3 md:grid-cols-2",
						children: example.dataModel.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border bg-inset p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-sm text-accent",
								children: d.entity
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 space-y-1 font-mono text-xs text-muted",
								children: d.fields.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: f }, f))
							})]
						}, d.entity))
					})] }) : null,
					board ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: "architecture-board",
						className: "scroll-mt-24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchitectureBoard, { board })
					}) : null,
					example.architecture.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBlock, {
						section: s,
						index: i
					}, s.heading)),
					example.deepDives.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepLabel, {
							n: 3,
							title: "Design deep dive"
						}), example.deepDives.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBlock, {
							section: s,
							index: 100 + i
						}, s.heading))]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepLabel, {
						n: 4,
						title: "Wrap up"
					}),
					example.tradeoffs.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
						id: "tradeoffs",
						children: "Trade-offs"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 overflow-x-auto rounded-lg border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[520px] text-left text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-raised text-xs uppercase tracking-wider text-faint",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Choice"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Pick when"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-2",
										children: "Cost"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: example.tradeoffs.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 font-medium",
										children: t.choice
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-muted",
										children: t.pickWhen
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-2 text-muted",
										children: t.cost
									})
								]
							}, t.choice)) })]
						})
					})] }) : null,
					example.wrapUp?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
						id: "wrap-up",
						children: "What to say at the end"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2",
						children: example.wrapUp.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-2.5 text-[15px] leading-7 text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-[11px] size-1 shrink-0 rounded-full bg-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "max-w-prose",
								children: w
							})]
						}, w))
					})] }) : null,
					example.followUps?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(H2, {
						id: "follow-ups",
						children: "Follow-up questions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "mt-4 space-y-3",
						children: example.followUps.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border bg-surface px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
								className: "text-[14px] font-medium leading-6 text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mr-2 font-mono text-[11px] text-accent",
									children: "Q"
								}), f.q]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
								className: "mt-1.5 max-w-prose text-[14px] leading-6 text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mr-2 font-mono text-[11px] text-ok",
									children: "A"
								}), f.a]
							})]
						}, f.q))
					})] }) : null,
					example.furtherReading.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[11px] font-medium uppercase tracking-[0.16em] text-faint",
						children: "Sources"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: example.furtherReading.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: l.href,
							target: "_blank",
							rel: "noreferrer",
							className: "text-sm text-accent hover:underline",
							children: l.label
						}) }, l.href))
					})] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RelatedList, { paths: example.related })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "order-first mb-8 hidden shrink-0 lg:sticky lg:top-24 lg:order-none lg:mb-0 lg:block lg:h-fit lg:w-56",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toc, { entries: toc })
			})]
		})
	})] });
}
function ExamplePage() {
	const { example } = Route$6.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExampleView, {
		example,
		id: `ex:${example.slug}`
	});
}
//#endregion
export { ExamplePage as component };
