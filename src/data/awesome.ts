/**
 * Source 6 — curated from ashishps1/awesome-system-design-resources.
 * Lattice pages where we teach the problem; otherwise the public link from the list.
 */

export type AwesomeBand = "easy" | "medium" | "hard";

export type AwesomeProblem = {
  title: string;
  band: AwesomeBand;
  href: string;
  lattice?: string;
  blurb: string;
};

export type AwesomeLink = {
  title: string;
  href: string;
  blurb: string;
};

export const awesomeRepo = {
  title: "awesome-system-design-resources",
  href: "https://github.com/ashishps1/awesome-system-design-resources",
  blurb:
    "Ashish Pratap Singh's public list: 30 core concepts, Easy/Medium/Hard interview problems, papers, and channels. Lattice uses it as source 6 — original notes here, the list for everything else.",
};

export const awesomeProblems: AwesomeProblem[] = [
  {
    title: "URL shortener (TinyURL)",
    band: "easy",
    href: "https://algomaster.io/learn/system-design-interviews/design-url-shortener",
    lattice: "/examples/url-shortener",
    blurb: "Counter → Base62, 301 vs 302, bloom filter on custom aliases.",
  },
  {
    title: "Autocomplete",
    band: "easy",
    href: "https://algomaster.io/learn/system-design-interviews/design-instagram",
    lattice: "/examples/autocomplete",
    blurb: "Trie + frequency, gathered offline, served from a prefix cache.",
  },
  {
    title: "Load balancer",
    band: "easy",
    href: "https://algomaster.io/learn/system-design-interviews/design-load-balancer",
    lattice: "/playgrounds/load-balancer",
    blurb: "L4/L7, health checks, round robin through consistent hash.",
  },
  {
    title: "Content delivery network",
    band: "easy",
    href: "https://www.youtube.com/watch?v=8zX0rue2Hic",
    lattice: "/hld/cdn",
    blurb: "PoPs, cache-control, origin shield, anycast DNS.",
  },
  {
    title: "Parking garage",
    band: "easy",
    href: "https://www.youtube.com/watch?v=NtMvNh0WFVM",
    lattice: "/lld/parking-lot",
    blurb: "Spots, tickets, fees — classic LLD object model.",
  },
  {
    title: "Vending machine",
    band: "easy",
    href: "https://www.youtube.com/watch?v=D0kDMUgo27c",
    blurb: "States, inventory, payments. An LLD favorite — pair with Strategy on the LLD menu.",
  },
  {
    title: "Distributed key-value store",
    band: "easy",
    href: "https://www.youtube.com/watch?v=rnZmdmlR-2M",
    lattice: "/examples/kv-store",
    blurb: "Consistent hash, sloppy quorum, hinted handoff — Dynamo.",
  },
  {
    title: "Distributed cache",
    band: "easy",
    href: "https://www.youtube.com/watch?v=iuqZvajTOyA",
    lattice: "/examples/distributed-cache",
    blurb: "Cache-aside, stampede, Redis Cluster, eviction.",
  },
  {
    title: "Authentication system",
    band: "easy",
    href: "https://www.youtube.com/watch?v=uj_4vxm9u90",
    lattice: "/examples/auth-system",
    blurb: "Sessions vs JWT, refresh rotation, SSO, MFA.",
  },
  {
    title: "Unified Payments Interface (UPI)",
    band: "easy",
    href: "https://www.youtube.com/watch?v=QpLy0_c_RXk",
    lattice: "/examples/payment",
    blurb: "India's real-time rails. Lattice's payment example is the adjacent money path.",
  },
  {
    title: "WhatsApp",
    band: "medium",
    href: "https://algomaster.io/learn/system-design-interviews/design-whatsapp",
    lattice: "/examples/chat",
    blurb: "1:1 and groups, presence, media via object store.",
  },
  {
    title: "Spotify",
    band: "medium",
    href: "https://algomaster.io/learn/system-design-interviews/design-spotify",
    lattice: "/examples/spotify",
    blurb: "Catalog, encrypted chunks, playlists, offline.",
  },
  {
    title: "Instagram",
    band: "medium",
    href: "https://algomaster.io/learn/system-design-interviews/design-instagram",
    lattice: "/examples/instagram",
    blurb: "Upload pipeline, follow graph, fan-out on write for celebrities.",
  },
  {
    title: "Notification service",
    band: "medium",
    href: "https://algomaster.io/learn/system-design-interviews/design-notification-service",
    lattice: "/examples/notification",
    blurb: "Fan-out to push / email / SMS with templates and quiet hours.",
  },
  {
    title: "Distributed job scheduler",
    band: "medium",
    href: "https://blog.algomaster.io/p/design-a-distributed-job-scheduler",
    lattice: "/examples/job-scheduler",
    blurb: "Cron at fleet scale: partitions, leases, retries, idempotency.",
  },
  {
    title: "Tinder",
    band: "medium",
    href: "https://www.youtube.com/watch?v=tndzLznxq40",
    lattice: "/examples/tinder",
    blurb: "Geo + swipe graph + mutual match, not just 'people near me'.",
  },
  {
    title: "News feed / Facebook / Twitter",
    band: "medium",
    href: "https://www.youtube.com/watch?v=wYk0xPP_P_8",
    lattice: "/examples/news-feed",
    blurb: "Fan-out on write vs read. Celebrity problem.",
  },
  {
    title: "Netflix",
    band: "medium",
    href: "https://www.youtube.com/watch?v=psQzyFfsUGU",
    lattice: "/examples/netflix",
    blurb: "Encode ladder, Open Connect, viewing history, DRM.",
  },
  {
    title: "YouTube",
    band: "medium",
    href: "https://www.youtube.com/watch?v=jPKTo1iGQiE",
    lattice: "/examples/youtube",
    blurb: "Upload → transcode → CDN. Comments and recommendations later.",
  },
  {
    title: "Google Search",
    band: "medium",
    href: "https://www.youtube.com/watch?v=CeGtqouT8eA",
    lattice: "/examples/google-search",
    blurb: "Crawl, invert, rank, serve. Separate the four machines.",
  },
  {
    title: "Rate limiter",
    band: "medium",
    href: "https://www.youtube.com/watch?v=mhUQe4BKZXs",
    lattice: "/examples/rate-limiter",
    blurb: "Token bucket in Redis, 429s, fail-open vs fail-closed.",
  },
  {
    title: "Distributed message queue (Kafka)",
    band: "medium",
    href: "https://www.youtube.com/watch?v=iJLL-KPqBpM",
    lattice: "/examples/distributed-mq",
    blurb: "Partitions, consumer groups, ISR, retention.",
  },
  {
    title: "Analytics / metrics platform",
    band: "medium",
    href: "https://www.youtube.com/watch?v=kIcq1_pBQSY",
    lattice: "/examples/metrics",
    blurb: "Collectors, time-series store, downsampling, alerts.",
  },
  {
    title: "Payment system",
    band: "medium",
    href: "https://www.youtube.com/watch?v=olfaBgJrUBI",
    lattice: "/examples/payment",
    blurb: "Ledger, idempotency keys, PSP, reconciliation.",
  },
  {
    title: "Digital wallet",
    band: "medium",
    href: "https://www.youtube.com/watch?v=4ijjIUeq6hE",
    lattice: "/examples/digital-wallet",
    blurb: "Double-entry, holds, exactly-once credits.",
  },
  {
    title: "Airbnb / hotel reservation",
    band: "medium",
    href: "https://www.youtube.com/watch?v=YyOXt2MEkv4",
    lattice: "/examples/hotel-reservation",
    blurb: "Inventory, overbooking, search by dates.",
  },
  {
    title: "TikTok / short video",
    band: "medium",
    href: "https://www.youtube.com/watch?v=Z-0g_aJL5Fw",
    lattice: "/examples/youtube",
    blurb:
      "For You ranking on a short-video firehose. Start from the YouTube example, then add the ranker.",
  },
  {
    title: "E-commerce (Amazon / Shopify)",
    band: "medium",
    href: "https://www.youtube.com/watch?v=EpASu_1dUdE",
    lattice: "/examples/hotel-reservation",
    blurb: "Catalog, cart, checkout. Inventory locking is the same muscle as ticket holds.",
  },
  {
    title: "Flight booking",
    band: "medium",
    href: "https://www.youtube.com/watch?v=qsGcfVGvFSs",
    lattice: "/examples/ticket-booking",
    blurb: "Seats + fares + PNR. Lattice's ticket-booking example is the hold/pay/commit path.",
  },
  {
    title: "Online code editor",
    band: "medium",
    href: "https://www.youtube.com/watch?v=07jkn4jUtso",
    lattice: "/examples/google-docs",
    blurb: "Presence + OT/CRDT, then a sandbox to run the code.",
  },
  {
    title: "Proximity (Yelp)",
    band: "hard",
    href: "https://www.youtube.com/watch?v=M4lR_Va97cQ",
    lattice: "/examples/proximity",
    blurb: "Geohash / S2 cells, shard by coarse cell, rank by distance.",
  },
  {
    title: "Uber",
    band: "hard",
    href: "https://www.youtube.com/watch?v=umWABit-wbk",
    lattice: "/examples/uber",
    blurb: "Dispatch matching, ETA, surge, live location.",
  },
  {
    title: "Food delivery (DoorDash)",
    band: "hard",
    href: "https://www.youtube.com/watch?v=iRhSAR3ldTw",
    lattice: "/examples/food-delivery",
    blurb: "Three-sided marketplace: diner, courier, merchant.",
  },
  {
    title: "Google Docs",
    band: "hard",
    href: "https://www.youtube.com/watch?v=2auwirNBvGg",
    lattice: "/examples/google-docs",
    blurb: "OT vs CRDT, presence, snapshots, offline.",
  },
  {
    title: "Google Maps",
    band: "hard",
    href: "https://www.youtube.com/watch?v=jk3yvVfNvds",
    lattice: "/examples/google-maps",
    blurb: "Vector tiles, road graph, live traffic weights.",
  },
  {
    title: "Zoom",
    band: "hard",
    href: "https://www.youtube.com/watch?v=G32ThJakeHk",
    lattice: "/examples/zoom",
    blurb: "SFU, TURN, simulcast, meeting state.",
  },
  {
    title: "File sharing (Dropbox / Drive)",
    band: "hard",
    href: "https://www.youtube.com/watch?v=U0xTu6E2CT8",
    lattice: "/examples/google-drive",
    blurb: "Chunked upload, metadata vs blob, sync, sharing.",
  },
  {
    title: "Ticket booking (BookMyShow)",
    band: "hard",
    href: "https://www.youtube.com/watch?v=lBAwJgoO3Ek",
    lattice: "/examples/ticket-booking",
    blurb: "Seat holds, oversell, flash-sale inventory.",
  },
  {
    title: "Distributed web crawler",
    band: "hard",
    href: "https://www.youtube.com/watch?v=BKZxZwUgL3Y",
    lattice: "/examples/web-crawler",
    blurb: "Frontier, politeness, canonical URLs, dedup.",
  },
  {
    title: "Code deployment system",
    band: "hard",
    href: "https://www.youtube.com/watch?v=q0KGYwNbf-0",
    blurb:
      "Build, artifact store, rolling / canary / blue-green. Not a Lattice example — watch this one.",
  },
  {
    title: "Object storage (S3)",
    band: "hard",
    href: "https://www.youtube.com/watch?v=UmWtcgC96X8",
    lattice: "/examples/object-storage",
    blurb: "Immutable blobs, metadata, erasure coding.",
  },
  {
    title: "Distributed locking service",
    band: "hard",
    href: "https://www.youtube.com/watch?v=v7x75aN9liM",
    lattice: "/examples/distributed-lock",
    blurb: "Leases, fencing tokens, Chubby / etcd / ZooKeeper.",
  },
];

export const awesomePapers: AwesomeLink[] = [
  {
    title: "Paxos: The Part-Time Parliament",
    href: "https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf",
    blurb: "The consensus paper. Read the Chubby / Raft versions first if this one is dense.",
  },
  {
    title: "MapReduce",
    href: "https://research.google.com/archive/mapreduce-osdi04.pdf",
    blurb: "Batch over a cluster. The ancestor of Spark and every 'shuffle' conversation.",
  },
  {
    title: "The Google File System",
    href: "https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf",
    blurb: "Chunkservers, single master, append-heavy. Parent of HDFS and Colossus.",
  },
  {
    title: "Dynamo: Amazon's Highly Available Key-value Store",
    href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
    blurb: "Consistent hashing, sloppy quorum, gossip, hinted handoff.",
  },
  {
    title: "Kafka: a Distributed Messaging System for Log Processing",
    href: "https://notes.stephenholiday.com/Kafka.pdf",
    blurb: "The log as the system. LinkedIn 2011.",
  },
  {
    title: "Spanner: Google's Globally-Distributed Database",
    href: "https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf",
    blurb: "TrueTime, external consistency, worldwide Paxos.",
  },
  {
    title: "Bigtable",
    href: "https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf",
    blurb: "Sparse, distributed, persistent map. Parent of HBase and Cassandra's table model.",
  },
  {
    title: "ZooKeeper",
    href: "https://www.usenix.org/legacy/event/usenix10/tech/full_papers/Hunt.pdf",
    blurb: "Wait-free coordination. The lock / config / membership primitive.",
  },
  {
    title: "The Log-Structured Merge-Tree",
    href: "https://www.cs.umb.edu/~poneil/lsmtree.pdf",
    blurb: "Why RocksDB, Cassandra, and LevelDB write sequentially.",
  },
  {
    title: "The Chubby lock service",
    href: "https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf",
    blurb: "Coarse-grained locks for loosely-coupled systems. GFS and Bigtable sit on it.",
  },
];

export const awesomeArticles: AwesomeLink[] = [
  {
    title: "How Discord stores trillions of messages",
    href: "https://discord.com/blog/how-discord-stores-trillions-of-messages",
    blurb: "Cassandra → Scylla, channel-shaped partitions, freezing old data.",
  },
  {
    title: "Building in-video search at Netflix",
    href: "https://netflixtechblog.com/building-in-video-search-936766f0017c",
    blurb: "Embeddings over frames, not just titles.",
  },
  {
    title: "Canva: zero to 50 million media uploads/day",
    href: "https://www.canva.dev/blog/engineering/from-zero-to-50-million-uploads-per-day-scaling-media-at-canva/",
    blurb: "Object store, async processing, backpressure.",
  },
  {
    title: "Airbnb: avoiding double payments",
    href: "https://medium.com/airbnb-engineering/avoiding-double-payments-in-a-distributed-payments-system-2981f6b070bb",
    blurb: "Idempotency keys in a money path.",
  },
  {
    title: "Stripe's payments APIs — the first 10 years",
    href: "https://stripe.com/blog/payment-api-design",
    blurb: "API design as product. Idempotency, versioning, request ids.",
  },
  {
    title: "Real time messaging at Slack",
    href: "https://slack.engineering/real-time-messaging/",
    blurb: "Channel servers, presence, and why one websocket per client.",
  },
];

export const awesomeChannels: AwesomeLink[] = [
  {
    title: "Tech Dummies Narendra L",
    href: "https://www.youtube.com/@TechDummiesNarendraL",
    blurb: "Long-form HLD walkthroughs of the classic prompts.",
  },
  {
    title: "Gaurav Sen",
    href: "https://www.youtube.com/@gkcs",
    blurb: "Trade-off first. Good for CAP, queues, and ranking.",
  },
  {
    title: "codeKarle",
    href: "https://www.youtube.com/@codeKarle",
    blurb: "Interview-shaped designs with numbers.",
  },
  {
    title: "ByteByteGo",
    href: "https://www.youtube.com/@ByteByteGo",
    blurb: "Alex Xu / Sahn Lam diagrams in motion.",
  },
  {
    title: "System Design Interview",
    href: "https://www.youtube.com/@SystemDesignInterview",
    blurb: "Mock loops, not just architecture tours.",
  },
  {
    title: "sudoCODE",
    href: "https://www.youtube.com/@sudocode",
    blurb: "Distributed-systems internals.",
  },
  {
    title: "Success in Tech",
    href: "https://www.youtube.com/@SuccessinTech/videos",
    blurb: "Staff-level interview framing.",
  },
];
