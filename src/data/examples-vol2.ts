import type { DesignExample } from "@/data/types";

export const vol2Examples: DesignExample[] = [
  {
    slug: "proximity",
    title: "Design a Proximity Service",
    source: "Volume 2",
    chapter: 1,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["geo", "yelp"],
    companies: ["Yelp", "Google Maps", "Foursquare"],
    summary:
      "Volume 2 chapter 1. 'Restaurants near me' is a geofence query. Quadtrees, geohashes, or an S2/H3 index turn 'points within radius' into a small set of cells you can fetch from a sharded store.",
    requirements: {
      functional: [
        "Search businesses by lat/lng + radius + filters",
        "Add/update a business location",
        "Rank by distance and rating",
      ],
      nonFunctional: [
        "Read-heavy",
        "Stale location of a shop by minutes is OK",
        "Worldwide coverage",
      ],
    },
    architecture: [
      {
        heading: "Index the earth",
        table: {
          headers: ["Index", "Idea"],
          rows: [
            [
              "Geohash",
              "Base32 encoding of a bounding box. Prefix = coarser cell. Neighbors are a bit fiddly at edges.",
            ],
            ["Quadtree", "Split space into four until a cell holds few enough points."],
            ["Google S2 / H3", "Spherical cells. Production default for serious geo."],
          ],
        },
        numbered: [
          "On write, compute the cell IDs that cover the point (and maybe parents) and insert.",
          "On read, cover the search circle with cells, fetch their contents, filter true distance, rank.",
          "Shard by coarse cell so a city lives together.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "q", label: "lat,lng,r" },
              { id: "c", label: "Cover with cells", tone: "accent" },
              { id: "db", label: "Shard lookup" },
              { id: "f", label: "Filter + rank" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Redis GEO",
        body: [
          "GEOADD / GEORADIUS is a fine v1 for a city. It does not replace a worldwide sharded index, but it is a legitimate stepping stone in an interview.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Coarser cells",
        pickWhen: "You want fewer round-trips",
        cost: "Over-fetch, more filtering",
      },
      { choice: "Finer cells", pickWhen: "Dense downtown", cost: "More cells to cover a radius" },
    ],
    related: ["/examples/nearby-friends", "/examples/google-maps", "/hld/sharding"],
    furtherReading: [{ label: "Geohash", href: "https://en.wikipedia.org/wiki/Geohash" }],
  },
  {
    slug: "nearby-friends",
    title: "Design Nearby Friends",
    source: "Volume 2",
    chapter: 2,
    difficulty: "advanced",
    minutes: 16,
    tags: ["geo", "realtime"],
    companies: ["Snap Map", "Find My", "WhatsApp Live Location"],
    summary:
      "Volume 2 chapter 2. Unlike Yelp, the points move. Periodic location pings, a realtime index, and push when a friend enters your radius. Presence + geo + fan-out.",
    requirements: {
      functional: [
        "Friends see each other when nearby",
        "Opt-in, with recency",
        "Battery-aware updates",
      ],
      nonFunctional: [
        "Updates every few seconds when moving",
        "Privacy: only friends, not the world",
      ],
    },
    architecture: [
      {
        heading: "Moving points",
        bullets: [
          "Client samples location on a duty cycle (faster when moving).",
          "A location service writes the latest point into a geo index (Redis GEO or a cell → user map) and into a 'last seen' store.",
          "A matcher computes nearby friends: intersection of (people in nearby cells) and (friend list). Friend lists are small — compute on read or cache per user.",
          "Push via the chat/presence channel, not a new TCP.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Load",
        body: [
          "If 100M users ping every 30s you have ~3M writes/s. That is why you duty-cycle, batch, and only index users who opted in and are online. Most designs keep 'active sharers' as a much smaller set.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Update on movement threshold", pickWhen: "Battery matters", cost: "Stale dots" },
      { choice: "Fixed 5s pings", pickWhen: "Safety use cases", cost: "Battery and write QPS" },
    ],
    related: ["/examples/proximity", "/examples/chat", "/hld/websockets"],
    furtherReading: [
      {
        label: "Volume 2 nearby friends (concept)",
        href: "https://blog.bytebytego.com/p/system-design-interview-books-volume",
      },
    ],
  },
  {
    slug: "google-maps",
    title: "Design Google Maps",
    source: "Volume 2",
    chapter: 3,
    difficulty: "advanced",
    minutes: 18,
    tags: ["geo", "routing"],
    companies: ["Google Maps", "Apple Maps", "Waze"],
    summary:
      "Volume 2 chapter 3. Tiles for rendering, a road graph for routing, traffic as live edge weights, and geocoding. Do not design all of it — pick tiles + routing as the deep dive.",
    requirements: {
      functional: [
        "Render maps at many zooms",
        "Navigate A → B with ETAs",
        "Search places",
        "Live traffic",
      ],
      nonFunctional: [
        "Tile hits from a CDN",
        "Routing under a second for city-scale",
        "Traffic freshness of minutes",
      ],
    },
    architecture: [
      {
        heading: "Tiles vs graph",
        diagram: {
          kind: "layers",
          layers: [
            { title: "Client", items: ["Viewport", "Tile cache", "Nav SDK"] },
            { title: "Render path", items: ["Tile service", "CDN", "Vector tiles"] },
            {
              title: "Routing path",
              items: ["Road graph", "Contraction hierarchies / A*", "Traffic aggregator"],
            },
          ],
        },
        bullets: [
          "Vector tiles (not giant PNGs) keep style on the client and shrink bytes.",
          "Routing is shortest path on a graph whose edge weights mix distance, speed limit, and live traffic.",
          "Preprocess (contraction hierarchies, hub labels) so a cross-city query does not walk every road.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Traffic",
        body: [
          "Probe data from phones, smoothed, written as edge deltas. Routing service reads a recent snapshot; it cannot call a live system per edge per query.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Vector tiles", pickWhen: "Interactive, themeable maps", cost: "Heavier client" },
      { choice: "Raster tiles", pickWhen: "Simple clients", cost: "One image per style per zoom" },
    ],
    related: ["/examples/proximity", "/hld/cdn", "/hld/estimation"],
    furtherReading: [{ label: "OpenStreetMap + OSRM (ideas)", href: "https://project-osrm.org/" }],
  },
  {
    slug: "distributed-mq",
    title: "Design a Distributed Message Queue",
    source: "Volume 2",
    chapter: 4,
    difficulty: "advanced",
    minutes: 20,
    tags: ["kafka"],
    companies: ["Kafka", "Pulsar", "SQS", "Kinesis"],
    summary:
      "Volume 2 chapter 4. Topics, partitions, replicas, a controller, consumer groups, and the ISR. If you can draw Kafka from memory you can design half the async systems in both books.",
    requirements: {
      functional: [
        "Publish to a topic",
        "Consume with a group",
        "Replay from an offset",
        "Order per partition key",
      ],
      nonFunctional: ["High throughput", "Durable (acks=all)", "Horizontal scale via partitions"],
    },
    architecture: [
      {
        heading: "Core",
        diagram: {
          kind: "layers",
          layers: [
            { title: "Clients", items: ["Producer", "Consumer group"] },
            { title: "Control", items: ["Controller / coordinator", "Partition assignment"] },
            { title: "Data", items: ["Partition leader + ISR replicas", "Segment files on disk"] },
          ],
        },
        bullets: [
          "A topic is a log split into partitions. The partition is the unit of ordering and parallelism.",
          "Producers hash a key to a partition. Leaders append sequentially — this is why Kafka is fast.",
          "Replicas in the ISR must ack before the record is committed if acks=all.",
          "A consumer group: each partition is owned by at most one member of the group. Many groups can independently replay.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "What to say about loss",
        body: [
          "acks=0 fire-and-forget. acks=1 leader only — lost if the leader dies before replica fetch. acks=all + min.insync.replicas is the production default for money-shaped data. Consumers are at-least-once unless you also do idempotent processing / transactions.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "More partitions",
        pickWhen: "Need more consumer parallelism",
        cost: "More files, longer recovery, slower elections",
      },
      {
        choice: "SQS-style competing queue",
        pickWhen: "No replay, simpler ops",
        cost: "No independent consumer groups",
      },
    ],
    related: ["/hld/message-queues", "/examples/ad-click", "/examples/notification"],
    furtherReading: [
      { label: "Kafka design (official)", href: "https://kafka.apache.org/documentation/#design" },
    ],
  },
  {
    slug: "metrics",
    title: "Design a Metrics Monitoring System",
    source: "Volume 2",
    chapter: 5,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["observability", "tsdb"],
    companies: ["Prometheus", "Datadog", "Google Borgmon"],
    summary:
      "Volume 2 chapter 5. Collect time series, write them cheaply, query them, alert on them, down-sample them. Cardinality is the villain.",
    requirements: {
      functional: [
        "Ingest metrics from services",
        "Graph and query",
        "Alert on rules",
        "Dashboards",
      ],
      nonFunctional: [
        "Millions of active series",
        "Alert lag of seconds to a minute",
        "Retain raw briefly, rollups for years",
      ],
    },
    architecture: [
      {
        heading: "Pipeline",
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "a", label: "Apps / exporters" },
              { id: "c", label: "Collectors", tone: "accent" },
              { id: "ts", label: "TSDB" },
              { id: "q", label: "Query + Alert" },
            ],
          ],
        },
        bullets: [
          "Push (Datadog agent) vs pull (Prometheus scrape). Pull is simpler for k8s; push is simpler for short-lived jobs (need a gateway).",
          "Storage: compressed columns of (timestamp, value) keyed by series ID. Labels → series ID is the expensive map.",
          "Downsample: 10s raw for 24h, 1m for 15d, 5m for a year.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Cardinality",
        body: [
          "A label like user_id on a counter explodes the series count and will page you. Bound label keys. This is the deep-dive interviewers want.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Pull scrape",
        pickWhen: "Long-lived, discoverable targets",
        cost: "Ephemeral jobs need a push gateway",
      },
      { choice: "Push", pickWhen: "Clients behind NAT, lambdas", cost: "You own backpressure" },
    ],
    related: ["/hld/observability", "/examples/ad-click", "/hld/sharding"],
    furtherReading: [
      {
        label: "Prometheus storage",
        href: "https://prometheus.io/docs/prometheus/latest/storage/",
      },
    ],
  },
  {
    slug: "ad-click",
    title: "Design Ad Click Event Aggregation",
    source: "Volume 2",
    chapter: 6,
    difficulty: "advanced",
    minutes: 16,
    tags: ["streaming", "ads"],
    companies: ["Google Ads", "Meta Ads", "any DSP"],
    summary:
      "Volume 2 chapter 6. Billions of impression and click events, aggregated along many dimensions (campaign, country, hour) with exactly-once money semantics and fraud filters.",
    requirements: {
      functional: [
        "Ingest impression/click events",
        "Aggregate by campaign / time / geo",
        "Support late events",
        "Fraud filter",
      ],
      nonFunctional: [
        "Exactly-once billing effects",
        "Minutes of freshness for dashboards",
        "Hours of retention for raw, years for rollups",
      ],
    },
    architecture: [
      {
        heading: "Lambda / streaming",
        bullets: [
          "Events land on a log (Kafka) partitioned by ad_id or campaign_id.",
          "A streaming job (Flink / Spark Structured Streaming) windows by event time with allowed lateness, keyed aggregates, and sink to a serving store (Cassandra / Bigtable / Druid).",
          "A batch job overnight reconciles — the money path should not trust only the stream.",
          "Idempotency: event IDs in a seen-set (Bloom + store) before incrementing counters.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "e", label: "Events" },
              { id: "k", label: "Kafka" },
              { id: "s", label: "Stream agg", tone: "accent" },
              { id: "sv", label: "Serving OLAP" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Event time vs processing time",
        body: [
          "A click that arrives two hours late still belongs to the original hour bucket. Watermarks close windows. Too-late events go to a repair path. Mention this or the design looks like a toy.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Stream only", pickWhen: "Dashboards", cost: "Billing drift" },
      { choice: "Batch only", pickWhen: "Daily invoices", cost: "No live ops view" },
    ],
    related: ["/examples/distributed-mq", "/examples/metrics", "/hld/message-queues"],
    furtherReading: [
      {
        label: "Streaming 101 (Akidau)",
        href: "https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/",
      },
    ],
  },
  {
    slug: "hotel-reservation",
    title: "Design a Hotel Reservation System",
    source: "Volume 2",
    chapter: 7,
    difficulty: "intermediate",
    minutes: 16,
    tags: ["inventory", "booking"],
    companies: ["Booking.com", "Airbnb", "hotels.com"],
    summary:
      "Volume 2 chapter 7. Inventory is a room-night. Oversell is the bug. Lock the inventory row (or use a conditional write) between hold and pay, with a TTL so abandoned carts release rooms.",
    requirements: {
      functional: ["Search availability", "Hold a room", "Pay and confirm", "Cancel / refund"],
      nonFunctional: [
        "No double-book of the same room-night",
        "Search can be slightly stale",
        "Payment is a saga",
      ],
    },
    dataModel: [
      { entity: "Hotel", fields: ["id", "geo", "stars"] },
      { entity: "RoomType", fields: ["id", "hotel_id", "capacity"] },
      { entity: "Inventory", fields: ["room_type_id", "date", "total", "held", "booked"] },
      { entity: "Reservation", fields: ["id", "user_id", "status", "nights[]"] },
    ],
    architecture: [
      {
        heading: "Hold → pay → confirm",
        numbered: [
          "Search hits a denormalized availability index (can be minutes stale).",
          "Hold: transactional decrement of remaining = total - booked - held if remaining > 0. Write a hold with TTL (10 min).",
          "Pay via payment service (idempotency key = reservation id).",
          "On success, convert hold → booked. On fail or TTL, release.",
        ],
        callout: {
          kind: "warn",
          title: "Do not check-then-act",
          text: "Read remaining=1 twice, both book. Use UPDATE … WHERE remaining > 0, or a version column, or a serializable txn on that inventory key.",
        },
      },
    ],
    deepDives: [
      {
        heading: "Sagas",
        body: [
          "Payment and inventory live in different systems. Orchestrate: hold, pay, confirm. Compensations: void payment, release hold. Two-phase commit across vendors is not on the table.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Overbooking factor", pickWhen: "No-show rates are known", cost: "Walking guests" },
      {
        choice: "Strict remaining=0",
        pickWhen: "Boutique hotels, unique rooms",
        cost: "Lower occupancy",
      },
    ],
    related: ["/examples/payment", "/lld/concurrency", "/hld/consistency"],
    furtherReading: [
      {
        label: "roadmap.sh — e-commerce checkout",
        href: "https://roadmap.sh/questions/system-design",
      },
    ],
  },
  {
    slug: "email-service",
    title: "Design a Distributed Email Service",
    source: "Volume 2",
    chapter: 8,
    difficulty: "advanced",
    minutes: 16,
    tags: ["smtp", "storage"],
    companies: ["Gmail", "Outlook", "Fastmail"],
    summary:
      "Volume 2 chapter 8. SMTP in, IMAP/web out, a metadata store, a blob store for bodies, spam, and fan-out to many devices. Mail is a large, append-mostly object with search.",
    requirements: {
      functional: [
        "Send and receive",
        "Folders / labels",
        "Search",
        "Attachments",
        "Multiple devices",
      ],
      nonFunctional: [
        "Durability (losing mail is a scandal)",
        "Spam filtering before inbox",
        "Search freshness of seconds to minutes",
      ],
    },
    architecture: [
      {
        heading: "Inbound",
        numbered: [
          "MX record → edge MTA. TLS, greylist, size limits.",
          "Spam / virus pipeline (async is OK; quarantine first).",
          "Store body in object storage, headers + labels in a DB sharded by user.",
          "Notify connected web clients; IMAP idle for thick clients.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "mx", label: "MX / MTA" },
              { id: "sp", label: "Spam pipeline" },
              { id: "st", label: "Meta + blob", tone: "accent" },
              { id: "n", label: "Notify devices" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Search",
        body: [
          "Do not LIKE %query% the metadata DB. Maintain a per-user inverted index (or a search cluster with a user routing key). Attachments are OCR'd offline.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Per-user shard",
        pickWhen: "Natural isolation, easy deletion",
        cost: "Hot users (mailing-list bombs)",
      },
      { choice: "Shared search cluster", pickWhen: "Ops simplicity", cost: "Noisy neighbor" },
    ],
    related: ["/examples/object-storage", "/examples/notification", "/hld/bloom-filters"],
    furtherReading: [
      { label: "SMTP", href: "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol" },
    ],
  },
  {
    slug: "object-storage",
    title: "Design S3-like Object Storage",
    source: "Volume 2",
    chapter: 9,
    difficulty: "advanced",
    minutes: 18,
    tags: ["s3", "storage"],
    companies: ["Amazon S3", "GCS", "Azure Blob"],
    summary:
      "Volume 2 chapter 9. Put/get/list objects in buckets. Metadata in a strongly consistent index, data in erasure-coded or replicated chunks across a storage fleet, with a placement service.",
    requirements: {
      functional: [
        "PUT / GET / DELETE object",
        "List prefix",
        "Presigned URLs",
        "Versioning, multipart",
      ],
      nonFunctional: [
        "11 nines class durability (the famous S3 number)",
        "Huge objects via multipart",
        "Cheap sequential IO",
      ],
    },
    architecture: [
      {
        heading: "Control vs data",
        diagram: {
          kind: "layers",
          layers: [
            { title: "API", items: ["HTTP frontends", "Auth", "Presign"] },
            { title: "Metadata", items: ["Bucket + object index", "Version list"] },
            { title: "Placement", items: ["Chunk IDs", "Erasure set / replica set"] },
            { title: "Storage nodes", items: ["Disks", "Bit rot checks"] },
          ],
        },
        bullets: [
          "Multipart: client uploads parts, then a complete call concatenates them logically.",
          "Erasure coding (e.g. 6+3) beats 3× replication on cold data. Replication is simpler for hot small objects.",
          "List is prefix scan on the metadata index, not a disk walk.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Durability math (say it)",
        body: [
          "Replicate across failure domains (disk, node, rack, AZ). Background scrubbers detect bit rot. The metadata store is the CP heart — if it lies, the bytes are orphans.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Erasure coding", pickWhen: "Cold, large objects", cost: "CPU, repair bandwidth" },
      { choice: "3× replica", pickWhen: "Hot, small, simple", cost: "Storage bill" },
    ],
    related: ["/examples/google-drive", "/examples/youtube", "/hld/quorum"],
    furtherReading: [
      { label: "S3 design talks / AWS architecture (ideas)", href: "https://aws.amazon.com/s3/" },
    ],
  },
  {
    slug: "leaderboard",
    title: "Design a Real-time Gaming Leaderboard",
    source: "Volume 2",
    chapter: 10,
    difficulty: "intermediate",
    minutes: 12,
    tags: ["redis", "games"],
    companies: ["Riot", "Fortnite", "mobile games"],
    summary:
      "Volume 2 chapter 10. Rank players by score with fast updates and range queries ('top 10' and 'me ±5'). Redis sorted sets are the v1; sharding and time windows are the rest.",
    requirements: {
      functional: ["Submit a score", "Top-N", "My rank and neighbors", "Daily / weekly boards"],
      nonFunctional: ["High write QPS during events", "Reads are eventually consistent by seconds"],
    },
    architecture: [
      {
        heading: "Sorted sets",
        body: [
          "ZADD board score player, ZREVRANGE 0 9, ZREVRANK player. That is the entire v1. For scale, shard by game mode + time window. A global board of 100M players may keep only the top few million in Redis and spill the tail to disk.",
        ],
        code: {
          title: "Redis sketch",
          source: `ZADD lb:weekly:42 1830 "player:9"
ZREVRANGE lb:weekly:42 0 9 WITHSCORES
ZREVRANK lb:weekly:42 "player:9"`,
        },
      },
    ],
    deepDives: [
      {
        heading: "Ties and stability",
        body: [
          "Score then timestamp (score * K - ts) so earlier arrivals win ties. Or store a tuple. Players will notice flicker.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Redis only", pickWhen: "Top-N of a modest set", cost: "RAM, persistence story" },
      {
        choice: "DB + cached top",
        pickWhen: "Huge tails",
        cost: "Rank of a random player is slower",
      },
    ],
    related: ["/hld/caching", "/examples/unique-id", "/hld/sharding"],
    furtherReading: [
      { label: "Redis sorted sets", href: "https://redis.io/docs/data-types/sorted-sets/" },
    ],
  },
  {
    slug: "payment",
    title: "Design a Payment System",
    source: "Volume 2",
    chapter: 11,
    difficulty: "advanced",
    minutes: 18,
    tags: ["money", "idempotency"],
    companies: ["Stripe", "PayPal", "Square"],
    summary:
      "Volume 2 chapter 11. Charge a card, talk to a processor, keep a ledger. Idempotency keys, state machines, and 'never lose or double-charge' beat fancy diagrams.",
    requirements: {
      functional: [
        "Authorize, capture, refund, void",
        "Idempotent retries",
        "Webhooks to merchants",
        "Reconciliation",
      ],
      nonFunctional: [
        "Exactly-once money effects",
        "PCI scope as small as possible",
        "Processor outages queued, not forgotten",
      ],
    },
    apis: [
      {
        method: "POST",
        path: "/v1/charges",
        desc: "Idempotency-Key header. { amount, currency, source }",
      },
      { method: "POST", path: "/v1/refunds", desc: "Refund a captured charge" },
    ],
    architecture: [
      {
        heading: "State machine + ledger",
        numbered: [
          "API records an Intent (requires_action | processing | succeeded | failed).",
          "A worker talks to the processor; every hop is retried with the same idempotency key.",
          "On success, append-only ledger entries (merchant receivable, processor clearing, fees).",
          "Webhooks fire from the ledger, not from the request thread, with signed retries.",
        ],
        callout: {
          kind: "insight",
          title: "Ledger first",
          text: "Balances are projections of an append-only journal. Do not UPDATE balance = balance + x without a corresponding journal row.",
        },
      },
    ],
    deepDives: [
      {
        heading: "PCI",
        body: [
          "Do not touch PAN if you can help it. Use a processor's tokenization (Stripe.js) so your servers see tokens, not card numbers. That is an architecture decision, not a compliance afterthought.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Authorize then capture",
        pickWhen: "Merchants fulfill later",
        cost: "Auth expiry, more states",
      },
      { choice: "Immediate capture", pickWhen: "Digital goods", cost: "Refunds instead of voids" },
    ],
    related: ["/examples/digital-wallet", "/examples/hotel-reservation", "/lld/adapter"],
    furtherReading: [
      { label: "roadmap.sh — payments", href: "https://roadmap.sh/questions/system-design" },
    ],
  },
  {
    slug: "digital-wallet",
    title: "Design a Digital Wallet",
    source: "Volume 2",
    chapter: 12,
    difficulty: "advanced",
    minutes: 16,
    tags: ["money", "ledger"],
    companies: ["PayPal", "Apple Pay", "PhonePe", "Venmo"],
    summary:
      "Volume 2 chapter 12. A ledger of accounts, transfers that double-entry, holds for pending payments, and end-to-end idempotency. The wallet is a money graph, not a 'balance column'.",
    requirements: {
      functional: [
        "Top up, withdraw, P2P transfer",
        "Pay a merchant",
        "See history and balance",
        "Holds / escrows",
      ],
      nonFunctional: ["No lost money", "No double spend", "Audit trail"],
    },
    dataModel: [
      { entity: "Account", fields: ["id", "user_id", "currency", "type (available|pending)"] },
      { entity: "JournalEntry", fields: ["id", "txn_id", "account_id", "amount (+/-)", "ts"] },
      { entity: "Txn", fields: ["id", "idempotency_key", "state"] },
    ],
    architecture: [
      {
        heading: "Double entry",
        body: [
          "A transfer from A to B is two journal lines that sum to zero, committed in one transaction on the ledger store (or a per-user shard plus an outgoing/incoming saga if cross-shard).",
          "Balance = SUM(journal) for that account, cached with a version. Conditional update on version prevents lost updates.",
        ],
        code: {
          title: "Invariant",
          source: `assert(sum(lines in txn) === 0)
assert(available >= 0) // after applying`,
        },
      },
    ],
    deepDives: [
      {
        heading: "Cross-shard transfers",
        body: [
          "If accounts shard by user, A and B may not share a DB. Use a saga with a clearing account: debit A → credit clearing (txn 1), debit clearing → credit B (txn 2). Reconcile the clearing account constantly.",
        ],
      },
    ],
    tradeoffs: [
      { choice: "Single-row balance", pickWhen: "Toy scale", cost: "No audit, lost updates" },
      {
        choice: "Journal + snapshot",
        pickWhen: "Real money",
        cost: "More writes, need compaction of old lines",
      },
    ],
    related: ["/examples/payment", "/examples/stock-exchange", "/hld/consistency"],
    furtherReading: [
      {
        label: "Double-entry bookkeeping",
        href: "https://en.wikipedia.org/wiki/Double-entry_bookkeeping",
      },
    ],
  },
  {
    slug: "stock-exchange",
    title: "Design a Stock Exchange",
    source: "Volume 2",
    chapter: 13,
    difficulty: "advanced",
    minutes: 20,
    tags: ["matching", "low latency"],
    companies: ["NYSE", "NASDAQ", "Binance"],
    summary:
      "Volume 2 chapter 13. The matching engine is a single-threaded, in-memory order book per symbol. Deterministic, sequenced, and persisted as a log. Everything else (gateways, market data, clearing) is around it.",
    requirements: {
      functional: [
        "Limit and market orders",
        "Cancel",
        "Trades emit to both sides",
        "Market data (L2 book)",
      ],
      nonFunctional: [
        "Microseconds to a few ms matching",
        "Fair FIFO (or configured) at a price level",
        "Recover from the log",
      ],
    },
    architecture: [
      {
        heading: "The engine is a loop",
        numbered: [
          "A sequenced gateway assigns a global order-id and appends to the input log.",
          "The matching thread for that symbol reads the log, mutates bid/ask trees, emits trades and book deltas.",
          "Output log is the source of truth for market-data publishers and the clearing/ledger service.",
          "Replicas follow the same log — they do not match independently.",
        ],
        diagram: {
          kind: "flow",
          rows: [
            [
              { id: "g", label: "Order gateway" },
              { id: "log", label: "Input log", tone: "accent" },
              { id: "m", label: "Matcher (1 thread / symbol)" },
              { id: "out", label: "Trades + market data" },
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Order book",
        body: [
          "Two price-time priority books (bids desc, asks asc). A limit order rests if it does not cross; a market order walks the other side until filled or the book is empty. Memory: skip lists or maps of price → FIFO queue.",
        ],
        callout: {
          kind: "warn",
          title: "Do not shard a symbol",
          text: "Two threads matching AAPL is a bug, not a scale strategy. Shard by symbol. Hot symbols get a bigger machine.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Single-thread matcher",
        pickWhen: "Correctness and latency (always)",
        cost: "Per-symbol ceiling",
      },
      {
        choice: "Crypto-style chain settlement",
        pickWhen: "On-chain products",
        cost: "Not an exchange matching-engine design",
      },
    ],
    related: ["/lld/observer", "/examples/digital-wallet", "/hld/consistency"],
    furtherReading: [
      {
        label: "How matching engines work (ideas)",
        href: "https://en.wikipedia.org/wiki/Order_matching_system",
      },
    ],
  },
];
