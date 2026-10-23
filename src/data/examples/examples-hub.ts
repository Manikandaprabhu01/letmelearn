export interface SystemBlueprint {
  id: string;
  title: string;
  category: "Mobility & Geo" | "Streaming & Media" | "Messaging & Real-time" | "Cloud Infrastructure" | "Search & Web Scale";
  scaleMetrics: {
    traffic: string;
    storage: string;
    latency: string;
    availability: string;
  };
  summary: string;
  diagram: string;
  dataFlow: string[];
  bottlenecksAndMitigations: {
    bottleneck: string;
    mitigation: string;
    tradeoff: string;
  }[];
  techStack: { component: string; technology: string; rationale: string }[];
}

export interface EstimationRule {
  category: string;
  item: string;
  value: string;
  ruleOfThumb: string;
}

export interface CompanyDesignRound {
  company: string;
  role: string;
  problem: string;
  expectedDeliverables: string[];
  keyChallenges: string[];
  scoringCriteria: { dimension: string; whatPasses: string; whatFails: string }[];
  modelAnswerOverview: string;
}

export const SYSTEM_BLUEPRINTS: SystemBlueprint[] = [
  {
    id: "uber-dispatch",
    title: "Uber / Lyft Real-Time Geospatial Dispatch & Surge Engine",
    category: "Mobility & Geo",
    scaleMetrics: {
      traffic: "5M+ concurrent active drivers, 1M location pings/sec",
      storage: "Petabytes of trip history, 100GB hot spatial cache",
      latency: "Sub-50ms dispatch matching, sub-1s ETA calculation",
      availability: "99.999% (zero-downtime regional failover)",
    },
    summary:
      "A distributed geospatial architecture capable of ingesting high-throughput GPS location pings from millions of mobile drivers, indexing coordinates dynamically via Uber H3 hexagonal spatial cells, and executing concurrent multi-criteria matching (ETA, driver rating, vehicle tier) with zero double-booking.",
    diagram: `+---------------------------------------------------------------------------------------------------+
|                        UBER REAL-TIME GEOSPATIAL DISPATCH ARCHITECTURE                            |
+---------------------------------------------------------------------------------------------------+

 [Driver App] (GPS ping every 4s)                 [Rider App] (Request Ride)
       │                                                 │
       ▼                                                 ▼
 [Envoy Edge Gateway / SSL]                       [Envoy Edge Gateway / SSL]
       │                                                 │
       ├──(gRPC Location Stream)                         ├──(REST / HTTP/2)
       │                                                 │
       ▼                                                 ▼
+──────────────────────+                           +────────────────────────+
| Location Ingest Svc  |                           | Ride Request Service   |
+──────────────────────+                           +────────────────────────+
       │                                                 │
       ├───> [Kafka Cluster: 'driver-locations']         │  (Find nearby drivers)
       │             │                                   │
       │             ▼                                   ▼
       │      +──────────────────────+             +────────────────────────+
       │      | H3 Spatial Index Svc | <────────── | Matching Engine Svc    |
       │      +──────────────────────+             +────────────────────────+
       │             │                                   │
       │             ▼                                   │  1. Compute H3 k-ring (radius)
       │      +──────────────────────+                   │  2. Filter drivers by state & tier
       │      | Redis Geo / Memcached|                   │  3. Calculate ETAs via Routing Engine
       │      | (H3 Hex Cell -> IDs) |                   │
       │      +──────────────────────+                   ▼
       │                                           +────────────────────────+
       │                                           | Distributed Lock (DLM) |
       │                                           | (Lock driver for 15s)  |
       │                                           +────────────────────────+
       │                                                 │
       ▼                                                 ▼
+──────────────────────+                           +────────────────────────+
| Surge Pricing Engine |                           | Trip State Machine     |
| (Supply/Demand Heat) |                           | (Postgres + ScyllaDB)  |
+──────────────────────+                           +────────────────────────+
       │                                                 │
       └──────────────────> [Push Notification] <────────┘
                            (APNs / FCM Socket to Driver)
`,
    dataFlow: [
      "1. Driver ping: Mobile driver sends {driverId, lat, lon, bearing, speed} over gRPC every 4 seconds to Location Ingestion.",
      "2. Spatial Quantization: Location service maps GPS lat/lon to Uber H3 Resolution-8 hexagon index (~460-meter radius).",
      "3. Spatial Cache Update: Writes driver ID to Redis Set keyed by H3 Cell ID: `SADD h3:882685623ffffff driver_9921` with 10s TTL.",
      "4. Ride Request: Rider requests pick-up at (lat, lon). Rider service calculates Rider's H3 cell and calls `kRing(cell, radius=2)` to fetch adjacent 19 hexagons.",
      "5. Matching & ETA: Matching Engine unions driver IDs across the 19 hexagons, filters out non-available drivers, and queries Valhalla/OSRM routing engine for real road-distance ETAs.",
      "6. Atomic Reservation: Winner driver is locked via Redis Redlock / Cassandra conditional update for 15 seconds while dispatch notification is dispatched to driver app.",
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: "GPS coordinate jitter and drift causing false spatial cell thrashing",
        mitigation: "Apply Kalman filter in driver location service to smooth speed and trajectory before updating H3 spatial index.",
        tradeoff: "Adds ~12ms computational latency per ingest batch, but reduces false cell boundary crossings by 78%.",
      },
      {
        bottleneck: "High contention lock stampede on top drivers in dense areas (e.g., airport arrivals)",
        mitigation: "Batch dispatch: Aggregate ride requests in 3-second windows and solve as bipartite graph maximum matching (Hungarian algorithm).",
        tradeoff: "Introduces an intentional 3-second user delay before matching, but maximizes global driver utilization and minimizes total rider wait time.",
      },
    ],
    techStack: [
      { component: "Spatial Indexing", technology: "Uber H3 (Hexagonal Hierarchical)", rationale: "Hexagons have equidistant neighbors, eliminating diagonal distortion inherent in Quadtrees/Geohashes." },
      { component: "Event Streaming", technology: "Apache Kafka", rationale: "Buffers 1M+ pings/sec with partitioned topic retention for surge analysis." },
      { component: "Ephemeral Cache", technology: "Redis Cluster (in-memory)", rationale: "Sub-millisecond read/write latency with auto-expiring location leases." },
      { component: "Durable Store", technology: "ScyllaDB + Postgres", rationale: "ScyllaDB for linear write-scale GPS trails; Postgres for ACID financial trip ledgers." },
    ],
  },
  {
    id: "netflix-transcoding",
    title: "Netflix Global Video Transcoding & Adaptive Bitrate Streaming",
    category: "Streaming & Media",
    scaleMetrics: {
      traffic: "260M+ subscribers, 15% of all global downstream internet traffic",
      storage: "Hundreds of Petabytes across master video files and encoded chunks",
      latency: "Sub-200ms initial video play start time (TTFB), zero buffering",
      availability: "99.99% video playback availability across 190+ countries",
    },
    summary:
      "A planetary media ingestion and distribution pipeline. Raw ProRes video masters (terabytes in size) are split into parallel chunks, transcoded into hundreds of bitrate/resolution/codec permutations (H.264, HEVC, AV1), packaged into Dynamic Adaptive Streaming (DASH/HLS) manifests, and pre-positioned on ISP edge caching appliances (Open Connect).",
    diagram: `+---------------------------------------------------------------------------------------------------+
|                   NETFLIX VIDEO ENCODING & OPEN CONNECT CDN ARCHITECTURE                          |
+---------------------------------------------------------------------------------------------------+

 [Studio Production]
       │ (Upload Master ProRes 4K/HDR, ~1 TB)
       ▼
 [Amazon S3 Ingest Bucket]
       │
       ▼ (Event Trigger)
+───────────────────────────────────────────────────────────────────+
|               TITAN ORCHESTRATION PIPELINE (AWS)                  |
|                                                                   |
| 1. Video Inspection & Audio Slicing                               |
| 2. Video Chunk Splitting: Scene-based cut into 2-5 sec chunks     |
| 3. Parallel Transcoding Farm: Thousands of EC2 Spot Instances     |
|                                                                   |
|     +───────────────+   +───────────────+   +───────────────+     |
|     | Worker 1: AV1 |   | Worker 2: HEVC|   | Worker 3: H264|     |
|     | 1080p @ 2Mbps |   | 4K HDR @ 8Mbps|   | 480p @ 500kbps|     |
|     +───────────────+   +───────────────+   +───────────────+     |
|            │                   │                   │              |
|            └───────────────────┼───────────────────┘              |
|                                ▼                                  |
|            4. Assembler & Manifest Generator (DASH / HLS)         |
+───────────────────────────────────────────────────────────────────+
       │
       ├───> Master Assets Store (Amazon S3 Multi-Region)
       │
       ▼
+───────────────────────────────────────────────────────────────────+
|               PROACTIVE CDN CACHING (OFF-PEAK SYNC)               |
+───────────────────────────────────────────────────────────────────+
       │
       ├───> [Netflix Open Connect Appliance (OCA)] (Inside Comcast ISP)
       ├───> [Netflix Open Connect Appliance (OCA)] (Inside Vodafone ISP)
       └───> [Netflix Open Connect Appliance (OCA)] (Inside Jio / Airtel)
       │
       ▼
 [Subscriber TV / Phone] ──(HTTP GET chunk_042_av1_1080p.m4s)──> [Local ISP OCA Edge]
`,
    dataFlow: [
      "1. Master Upload: Film studios upload mezzanine video files (~1-2 TB per movie) to AWS S3 via Aspera high-speed UDP transfer.",
      "2. Scene-Cut Chunking: Slicing workers identify I-frames (key frames) to split the video into 2-5 second independent scene segments.",
      "3. Parallel Matrix Encoding: Titan distributes encoding jobs across 10,000+ spot EC2 instances. Each chunk is encoded into 120+ profiles (different codecs: AV1, VP9, HEVC, H.264; resolutions: 360p to 4K; dynamic audio: Dolby Atmos, 5.1).",
      "4. Per-Title Optimization: Complex action scenes receive higher bitrates, while low-motion scenes are compressed aggressively to save user bandwidth.",
      "5. Open Connect Pre-population: During ISP off-peak hours (2 AM - 6 AM), encoded chunks are proactively copied via BGP routing into custom Open Connect storage boxes deployed directly inside internet service providers.",
      "6. Playback: Client app contacts PlayAPI on AWS for DRM license (Widevine/FairPlay) and manifest URL, then fetches 100% of video bytes directly from the nearest ISP OCA box over HTTP/2.",
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: "Massive compute cost and time delay when re-encoding entire catalogs for new codecs (e.g. AV1)",
        mitigation: "Granular chunk-level work queue: Workers encode independent 3-second slices asynchronously; spot instance terminations are retried instantly with zero work lost.",
        tradeoff: "Requires sophisticated manifest stitching logic to maintain seamless audio/video timecode sync across fragmented segments.",
      },
      {
        bottleneck: "ISP peering congestion and transit provider transit fees during peak evening streaming hours",
        mitigation: "Netflix Open Connect Appliance (OCA): Custom hardware servers (100TB flash storage, 100Gbps NIC) deployed free-of-charge directly inside ISP data centers.",
        tradeoff: "Capital expenditure on physical hardware logistics and firmware updates, but bypasses internet transit transit costs for >95% of playback traffic.",
      },
    ],
    techStack: [
      { component: "Orchestration", technology: "Titan / Titus (Apache Mesos / K8s)", rationale: "Manages container scheduling across 10,000+ spot instances with spot interruption recovery." },
      { component: "Asset Store", technology: "Amazon S3", rationale: "11 9's durability for master files and global replication." },
      { component: "Edge Distribution", technology: "Netflix Open Connect (Custom FreeBSD OCAs)", rationale: "Serves video directly from ISP local racks with zero transit hops." },
      { component: "Client Adaptation", technology: "DASH (Dynamic Adaptive Streaming over HTTP)", rationale: "Client player dynamically selects optimal bitrate based on buffer fullness and packet loss." },
    ],
  },
  {
    id: "whatsapp-messaging",
    title: "WhatsApp Billion-Connection Instant Messaging & Presence Architecture",
    category: "Messaging & Real-time",
    scaleMetrics: {
      traffic: "2+ Billion users, 100 Billion messages delivered/day, 2M+ msgs/sec peak",
      storage: "Transient storage only: messages deleted from server upon delivery receipt",
      latency: "Sub-50ms round-trip delivery globally across 2G/3G/4G/5G networks",
      availability: "99.999% uptime with offline queue buffering up to 30 days",
    },
    summary:
      "A battle-tested distributed messaging fabric engineered in Erlang/Elixir on FreeBSD. Maintains over 2 million persistent TCP/TLS connections per single server node, guarantees end-to-end encryption (Signal Protocol), and enforces a zero-storage privacy model where server memory acts as an ephemeral routing switch.",
    diagram: `+---------------------------------------------------------------------------------------------------+
|                       WHATSAPP REAL-TIME MESSAGING ARCHITECTURE                                   |
+---------------------------------------------------------------------------------------------------+

 [User A: Sender]                                              [User B: Receiver]
       │                                                              │
       │ (E2EE Signal Payload: Encrypted with User B's public key)    │
       ▼                                                              ▼
+─────────────────────────────────────+            +─────────────────────────────────────+
| Edge Chat Gateway 1 (Erlang BEAM)   |            | Edge Chat Gateway 2 (Erlang BEAM)   |
| (Maintains 2M concurrent TCP conns) |            | (Holds active TCP conn for User B)  |
+─────────────────────────────────────+            +─────────────────────────────────────+
       │                                                              ▲
       │ 1. Validate auth token                                       │ 3. Forward message over
       │ 2. Lookup User B location                                    │    established TCP conn
       ▼                                                              │
+─────────────────────────────────────────────────────────────────────┼─────────────────────+
|                          ROUTING & PRESENCE FABRIC                  │                     |
|                                                                     │                     |
|   +──────────────────────────────+             +────────────────────┴──────────────+      |
|   | Session Registry (Redis /    |             | Message Router (Mnesia / BEAM)    |      |
|   | Distributed Hash Table)      |             +───────────────────────────────────+      |
|   | {User_B -> Gateway_2_IP}     |                             ▲                          |
|   +──────────────────────────────+                             │                          |
+────────────────────────────────────────────────────────────────┼──────────────────────────+
       │                                                         │
       │ (If User B is OFFLINE)                                  │ (When User B connects)
       ▼                                                         │
+─────────────────────────────────────+                          │
| Offline Message Store               | ─────────────────────────┘
| (Cassandra / ScyllaDB FIFO Queue)   |
| Retained for max 30 days            |
+─────────────────────────────────────+
       │
       ▼ (Trigger APNs / FCM Wake-up Push)
 [Apple APNs / Google FCM Push Service] ──> [User B Phone Wakes Up & Connects to Gateway 2]
`,
    dataFlow: [
      "1. End-to-End Encryption: Sender encrypts message body locally using Double Ratchet Algorithm (Signal Protocol). The server cannot read content.",
      "2. Connection Protocol: Sender sends encrypted frame over a long-lived TLS/TCP connection using a customized minimal XMPP-like protocol.",
      "3. User Lookup: Gateway queries distributed session table (hash ring) to find which cluster gateway holds User B's active TCP socket.",
      "4. Online Delivery: If User B is online on Gateway 2, the message is routed via Erlang message-passing directly to Gateway 2, forwarded over the socket to User B, and immediately flushed from server RAM.",
      "5. Offline Buffering: If User B is offline, the encrypted payload is stored in ScyllaDB FIFO offline table and a push notification (APNs/FCM) is fired to wake the client.",
      "6. Ack & Receipt: When User B sends back a delivery receipt (`delivered`), server deletes the message from offline storage and forwards delivery tick to User A.",
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: "C10M connection limits: Linux kernel default file descriptor and epoll socket table exhaust RAM",
        mitigation: "Tuned FreeBSD kernel with custom sysctl: TCP buffer sizing (`tcp_sendspace` / `tcp_recvspace`), socket reuse, and Erlang lightweight BEAM processes (~2KB per connection).",
        tradeoff: "Requires specialized Erlang engineers and OS tuning expertise rather than standard off-the-shelf Linux containers.",
      },
      {
        bottleneck: "Group chat fan-out amplification (1 message sent to group with 256 or 1024 members)",
        mitigation: "Sender-side fan-out vs server routing: Client encrypts sender key once; server duplicates encrypted packets to member gateway nodes without decrypting.",
        tradeoff: "Increases egress network bandwidth, but prevents CPU-intensive server-side re-encryption.",
      },
    ],
    techStack: [
      { component: "Core Application Server", technology: "Erlang / Elixir (BEAM VM)", rationale: "Per-process isolation, preemptive scheduler, and ultra-lightweight memory footprint." },
      { component: "Operating System", technology: "FreeBSD", rationale: "Superior network stack performance under massive concurrent socket counts." },
      { component: "Offline Buffer", technology: "ScyllaDB / Cassandra", rationale: "High append write speed with automatic TTL expiration after 30 days." },
      { component: "Encryption Standard", technology: "Signal Protocol (Double Ratchet)", rationale: "Provides perfect forward secrecy and future secrecy for all media and text." },
    ],
  },
  {
    id: "distributed-rate-limiter",
    title: "Distributed Rate Limiter & Token Bucket Cluster",
    category: "Cloud Infrastructure",
    scaleMetrics: {
      traffic: "10M+ RPS through global API gateway clusters",
      storage: "Negligible memory footprint (<10GB Redis memory for 500M rate limit keys)",
      latency: "Sub-1ms check latency overhead (P99.99 < 2ms)",
      availability: "99.999% with fail-open circuit breakers on dependency degradation",
    },
    summary:
      "A high-performance tier-1 infrastructure service enforcing rate limits (per API key, user ID, IP address, or organization) across globally distributed Envoy gateways using atomic Redis Lua sliding windows and multi-level local token bucket caching.",
    diagram: `+---------------------------------------------------------------------------------------------------+
|                        DISTRIBUTED RATE LIMITER ARCHITECTURE                                      |
+---------------------------------------------------------------------------------------------------+

 [Inbound API Requests: 10M RPS]
       │
       ▼
+───────────────────────────────────────────────────────────────────+
|               ENVOY API GATEWAY CLUSTER (EDGE / REGIONAL)         |
|                                                                   |
|  +─────────────────────────────────────────────────────────────+  |
|  | Local Memory Token Bucket Filter (L1 Cache)                 |  |
|  | - Allows fast-path requests locally if quota remains        |  |
|  | - Refills in bulk batches (e.g. 100 tokens at a time)       |  |
|  +─────────────────────────────────────────────────────────────+  |
|                                │                                  |
|                                │ (Quota exhausted or periodic sync)
|                                ▼                                  |
|  +─────────────────────────────────────────────────────────────+  |
|  | Rate Limit gRPC Filter (Async, 1ms timeout)                 |  |
|  +─────────────────────────────────────────────────────────────+  |
+────────────────────────────────┼──────────────────────────────────+
                                 │
                 (gRPC: CheckRateLimit(key, tokens))
                                 │
                                 ▼
+───────────────────────────────────────────────────────────────────+
|               RATE LIMITING SERVICE CLUSTER (GO / RUST)           |
+───────────────────────────────────────────────────────────────────+
       │                                                 │
       │ (Execute Atomic Sliding Window Lua)             │ (If Redis times out > 2ms)
       ▼                                                 ▼
+───────────────────────────────────+             +───────────────────────────────────+
| Redis Cluster (Shard by Client ID)|             | Circuit Breaker: FAIL OPEN        |
| - Key: ratelimit:{client_id}      |             | Log alert and allow request       |
| - Sliding Window Sorted Set (ZSET)|             | (Prevent gateway outage)          |
+───────────────────────────────────+             +───────────────────────────────────+
       │
       ├───> Under Limit  ──> Return HTTP 200 OK (Forward to upstream service)
       └───> Over Limit   ──> Return HTTP 429 Too Many Requests
                              (Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)
`,
    dataFlow: [
      "1. Request Interception: Envoy Edge Gateway receives HTTP/gRPC request and extracts rate-limit identity key (e.g., `api_key:sk_live_9281`).",
      "2. L1 Local Cache Evaluation: Envoy checks thread-local token bucket. If tokens remain, request is immediately forwarded with zero network hop.",
      "3. L2 Centralized Verification: If local batch is empty, Envoy issues non-blocking gRPC call to Rate Limiter Service Cluster.",
      "4. Atomic Lua Execution: Limiter runs atomic Lua script in Redis: `ZREMRANGEBYSCORE key 0 (now - window)`, `ZCARD key`, if count < max then `ZADD key now now`.",
      "5. Response Headers: Gateway attaches standard RFC headers (`RateLimit-Limit: 1000`, `RateLimit-Remaining: 42`, `RateLimit-Reset: 1718928000`).",
      "6. Graceful Degradation: If Redis cluster reaches >2ms latency or returns network timeout, circuit breaker trips to FAIL-OPEN mode to protect application availability.",
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: "Redis hot-key contention when millions of requests share one corporate API key (e.g., OpenAI or Stripe API)",
        mitigation: "Two-level hierarchical token bucket: Local gateway nodes reserve token quotas in batches (e.g., 500 tokens at once) rather than 1 round-trip per request.",
        tradeoff: "Slight quota elasticity across distributed nodes (+/- 5% transient inaccuracy), but reduces Redis load by 99%.",
      },
      {
        bottleneck: "Redis network round-trip overhead adding latency to every API call",
        mitigation: "Co-locate Redis read replicas in same cloud Availability Zone (AZ) and execute pipelined gRPC batches.",
        tradeoff: "Cross-AZ data egress costs and replica replication lag require sticky AZ routing.",
      },
    ],
    techStack: [
      { component: "Edge Proxy", technology: "Envoy Gateway", rationale: "C++ high-performance proxy with native `envoy.filters.http.ratelimit` support." },
      { component: "Rate Limit Engine", technology: "Go / Rust Service", rationale: "Low latency, concurrent garbage-collected or zero-cost abstraction runtime." },
      { component: "Shared State Store", technology: "Redis Cluster (AWS ElastiCache)", rationale: "In-memory data structures with sub-millisecond atomic Lua scripting." },
      { component: "Resilience", technology: "Resilience4j / Envoy Circuit Breakers", rationale: "Guarantees fail-open behavior so rate limiting never causes an outage." },
    ],
  },
  {
    id: "web-crawler-frontier",
    title: "Distributed Web Crawler & URL Frontier at Petabyte Scale",
    category: "Search & Web Scale",
    scaleMetrics: {
      traffic: "1 Billion pages crawled / month, 10,000 pages / sec continuous throughput",
      storage: "10+ Petabytes of raw HTML, compressed WARC format on S3 / Ceph",
      latency: "Politeness delay 1-2 sec per host; sub-10ms frontier priority dequeuing",
      availability: "99.9% fault-tolerant resume from checkpoints on worker failure",
    },
    summary:
      "A planetary-scale web crawler modeled after Mercator and Googlebot. Features a two-stage politeness & priority URL Frontier, distributed robots.txt caching, bloom filter deduplication, asynchronous DNS resolver pools, and content SimHash near-duplicate detection.",
    diagram: `+---------------------------------------------------------------------------------------------------+
|                        DISTRIBUTED WEB CRAWLER & URL FRONTIER                                     |
+---------------------------------------------------------------------------------------------------+

 [Seed URLs: 100M URLs]
       │
       ▼
+───────────────────────────────────────────────────────────────────+
|                       MERCATOR URL FRONTIER                       |
|                                                                   |
|  1. PRIORITY QUEUES (F1, F2, F3... Fn based on PageRank & Quality)|
|     Selects highest value URLs first                              |
|                                │                                  |
|                                ▼                                  |
|  2. POLITENESS ROUTER (Hash Hostname -> Politeness Queue)         |
|     - Ensures max 1 request every 1.5s per unique domain          |
|     - Enforces robots.txt crawl-delay constraints                 |
|                                                                   |
|     [Host: cnn.com]      [Host: nytimes.com]    [Host: wiki.org]  |
|     (Queue 1: FIFO)      (Queue 2: FIFO)        (Queue 3: FIFO)   |
+────────────────────────────────┼──────────────────────────────────+
                                 │
                                 ▼
+───────────────────────────────────────────────────────────────────+
|               DISTRIBUTED CRAWLER WORKERS (ASYNC I/O)             |
+───────────────────────────────────────────────────────────────────+
       │
       ├───> 1. DNS Cache Resolver (Custom unbound DNS pool, 24h TTL)
       ├───> 2. Robots.txt Evaluator (Redis cached AST parsed rules)
       ├───> 3. HTTP Client (Fetch page with stream timeout & size limit)
       │
       ▼
 [Raw HTML Document Payload]
       │
       ├───> Document Dedup: SimHash (64-bit Hamming distance <= 3) ──> Discard if duplicate
       ├───> Document Storage: Compress to WARC format ──> [Amazon S3 / Ceph Object Store]
       │
       ▼
 [HTML Parser & Link Extractor]
       │
       ▼ (Extracted New Outbound URLs)
+───────────────────────────────────────────────────────────────────+
|                      URL FILTER & DEDUP PIPELINE                  |
|                                                                   |
|  1. URL Normalization (canonicalize casing, strip anchor tags)    |
|  2. URL Seen Filter (Scalable Bloom Filter + RocksDB Index)       |
+────────────────────────────────┼──────────────────────────────────+
                                 │ (Only unseen URLs)
                                 ▼
                     (Feed back into URL Frontier)
`,
    dataFlow: [
      "1. Seed Ingestion: Frontier initializes with curated high-PageRank seed URLs.",
      "2. Priority Queuing: Priority queues categorize URLs by importance (PageRank, update frequency) to ensure high-value pages are refreshed first.",
      "3. Politeness Scheduling: Hostname router distributes URLs to per-host FIFO queues. A heap scheduler guarantees only 1 concurrent fetch per host with at least 1.5s delay.",
      "4. DNS Resolution: Custom async DNS resolvers query local caches to bypass ISP DNS rate limits and avoid blocking on name resolution.",
      "5. Fetch & Robots Check: Worker validates target URL against pre-cached `robots.txt` rules and downloads HTML payload with strict 10MB file-size cutoff.",
      "6. Dedup & Storage: Content is hashed via 64-bit SimHash. If Hamming distance to existing documents is <= 3, it is dropped as a scraper duplicate. Unique pages are written to compressed S3 WARC files, and new links are pushed into Bloom Filter for unseen URL frontier expansion.",
    ],
    bottlenecksAndMitigations: [
      {
        bottleneck: "Spider traps (infinite calendar URLs, dynamically generated query parameters causing infinite loops)",
        mitigation: "URL path depth limit (max 8 segments), max pages per domain cap (e.g., 50,000 per domain), and heuristic anti-loop regex filters.",
        tradeoff: "May miss deeply nested valid documents on massive catalog sites.",
      },
      {
        bottleneck: "Memory explosion when tracking billions of seen URLs in RAM",
        mitigation: "Multi-stage Bloom Filter backed by RocksDB on NVMe SSDs: 0.1% false positive rate requires only ~1.2 bytes per URL.",
        tradeoff: "0.1% false positive means 1 in 1,000 valid URLs may be skipped without being crawled.",
      },
    ],
    techStack: [
      { component: "Frontier Queue", technology: "Kafka + RocksDB on NVMe", rationale: "Provides persistent high-throughput disk-backed queues with zero memory leaks." },
      { component: "Async Worker Engine", technology: "Rust / C++ (tokio-based async I/O)", rationale: "Manages 50,000 concurrent HTTP sockets per machine with minimal CPU overhead." },
      { component: "Deduplication", technology: "Scalable Bloom Filter + 64-bit SimHash", rationale: "O(1) set membership test and near-duplicate text similarity detection." },
      { component: "Document Storage", technology: "Apache Parquet / WARC on Ceph / S3", rationale: "Standard archival web format with columnar compression efficiency." },
    ],
  },
];

export const ESTIMATION_RULES: EstimationRule[] = [
  { category: "Latency", item: "L1 Cache Reference", value: "0.5 ns", ruleOfThumb: "Fastest hardware access; CPU core register speed." },
  { category: "Latency", item: "Mutex Lock / Unlock", value: "17 ns", ruleOfThumb: "OS thread synchronization primitive cost." },
  { category: "Latency", item: "Main Memory (RAM) Reference", value: "100 ns", ruleOfThumb: "200x slower than L1 cache." },
  { category: "Latency", item: "Compress 1KB with Snappy", value: "2,000 ns (2 µs)", ruleOfThumb: "High-speed in-memory compression throughput." },
  { category: "Latency", item: "Send 1KB over 1 Gbps Network", value: "10,000 ns (10 µs)", ruleOfThumb: "Wire transmission delay within same data center." },
  { category: "Latency", item: "Read 1MB Sequentially from NVMe SSD", value: "49,000 ns (49 µs)", ruleOfThumb: "Modern NVMe read speed (~2GB/sec)." },
  { category: "Latency", item: "Round-Trip within Same Datacenter", value: "500,000 ns (0.5 ms)", ruleOfThumb: "Baseline RPC network latency between microservices." },
  { category: "Latency", item: "Disk Seek (Rotational HDD)", value: "10,000,000 ns (10 ms)", ruleOfThumb: "200x slower than SSD; avoid random I/O on HDDs." },
  { category: "Latency", item: "Cross-Continent RTT (SF to London)", value: "150,000,000 ns (150 ms)", ruleOfThumb: "Speed of light in fiber optics physical limit." },
  { category: "Throughput", item: "1 Million DAU to QPS", value: "~12 RPS average, ~25 RPS peak", ruleOfThumb: "Assume 1 request per user per day: 1,000,000 / 86,400 ≈ 12 QPS." },
  { category: "Throughput", item: "10 Million DAU with 10 actions/day", value: "~1,200 RPS avg, ~2,400 RPS peak", ruleOfThumb: "100,000,000 / 86,400 ≈ 1,157 QPS. Rule of thumb: Peak = 2x - 3x Average." },
  { category: "Storage", item: "1 Request of 1KB per second", value: "86.4 MB/day, 31.5 GB/year", ruleOfThumb: "86,400 seconds in a day. Convenient approximation: 10^5 seconds/day." },
  { category: "Storage", item: "1 Million Photos (2MB each) / day", value: "2 TB/day, 730 TB/year", ruleOfThumb: "Requires tiered cold storage (S3 Glacier) and CDN edge caching." },
  { category: "Capacity", item: "Single Postgres Instance Max QPS", value: "~5,000 - 15,000 QPS (read/write)", ruleOfThumb: "Beyond 15k QPS, introduce Redis read cache or read-replicas." },
  { category: "Capacity", item: "Single Redis Instance Max QPS", value: "~100,000 QPS", ruleOfThumb: "Single-threaded event loop bound by CPU core speed." },
];

export const INTERVIEW_FRAMEWORK = [
  {
    step: "Step 1: Understand the Problem & Scope the Requirements",
    timeAllocation: "5 - 8 Minutes",
    goal: "Never jump directly into drawing boxes. Eliminate ambiguity, define functional vs non-functional constraints, and calculate scale numbers.",
    keyQuestionsToAsk: [
      "What are the top 2-3 core functional features? (e.g., in Twitter: Post Tweet, View Timeline, Follow User. Exclude direct messages and ads).",
      "What is the expected scale? (DAU, read vs write ratio, storage growth per year).",
      "What are the availability vs consistency requirements? (e.g., CAP theorem: Is eventual consistency acceptable, or do we need strict ACID financial balance?).",
      "What is the target latency budget? (P99 read latency < 100ms, write latency < 500ms).",
    ],
    pitfalls: [
      "Assuming requirements without confirming with the interviewer.",
      "Overcomplicating the scope by trying to design every edge case in minute 3.",
    ],
  },
  {
    step: "Step 2: Propose High-Level Design & API / Data Contracts",
    timeAllocation: "10 - 15 Minutes",
    goal: "Draw the end-to-end block diagram connecting clients, edge gateways, application services, and persistent databases. Define core REST/gRPC endpoints and schema tables.",
    keyQuestionsToAsk: [
      "Client -> Load Balancer (ALB / Envoy) -> Gateway -> Core Microservices -> Storage Tier.",
      "API endpoints: Specify methods, request body parameters, and return headers.",
      "Database schema: Relational (Postgres) vs NoSQL (Cassandra/DynamoDB). Detail primary keys, partition keys, and index keys.",
    ],
    pitfalls: [
      "Drawing an architecture without explaining the data flow from left to right.",
      "Picking a database solely because it is popular without justifying why its data model fits the access pattern.",
    ],
  },
  {
    step: "Step 3: Design Deep Dive & Bottleneck Resolution",
    timeAllocation: "15 - 20 Minutes",
    goal: "Dive deep into the most challenging engineering problems highlighted by the interviewer (e.g., fan-out on write vs read, cache stampede, hot partition keys).",
    keyQuestionsToAsk: [
      "How do we handle celebrity users with 100M followers without crashing queue workers?",
      "How do we prevent duplicate payments during transient network timeouts? (Idempotency keys + distributed locks).",
      "How do we partition the data? (Consistent hashing with virtual nodes to avoid uneven distribution).",
    ],
    pitfalls: [
      "Remaining at high level without discussing concrete data structures or concurrency algorithms.",
      "Ignoring single points of failure (SPOFs) in databases and message brokers.",
    ],
  },
  {
    step: "Step 4: Wrap-Up, Failure Modes & Operational Trade-offs",
    timeAllocation: "3 - 5 Minutes",
    goal: "Summarize the design, self-critique vulnerabilities, and outline monitoring, deployment, and future evolution.",
    keyQuestionsToAsk: [
      "Failure modes: What happens if the primary database fails over? What happens if Redis loses data?",
      "Telemetry & Observability: Distributed tracing (OpenTelemetry), rate limiting metrics, and SLA alert thresholds.",
      "Future scaling: Multi-region active-active deployment and geo-routing strategies.",
    ],
    pitfalls: [
      "Claiming the design is 'perfect' with zero weaknesses.",
      "Running out of time before summarizing how the initial scale numbers are satisfied.",
    ],
  },
];

export const COMPANY_DESIGN_ROUNDS: CompanyDesignRound[] = [
  {
    company: "Meta",
    role: "Senior Software Engineer (E5 / E6)",
    problem: "Design Instagram News Feed & Live Stories at 1 Billion DAU",
    expectedDeliverables: [
      "Feed Generation Pipeline: Fan-out on write vs Fan-out on read hybrid model.",
      "TAO Cache Architecture: Associations and Objects graph caching for social graph traversal.",
      "Media CDN Storage: Origin S3/Haystack storage + edge caching hierarchy for video reels.",
      "Live Video Streaming: WebRTC ingest with HLS/DASH chunking and edge transcoders.",
    ],
    keyChallenges: [
      "Celebrity Fan-out Trap: Justin Bieber posting a story should not trigger 100M write operations to follower inboxes.",
      "Ranking Latency: Scoring thousands of candidate posts with ML ranking models under 150ms.",
    ],
    scoringCriteria: [
      {
        dimension: "Data Modeling & Graph Traversal",
        whatPasses: "Utilizes graph cache (TAO-like design) separating Objects (Users, Posts) from Associations (Likes, Follows) with directional edges.",
        whatFails: "Treats social graph as a relational JOIN across 1B rows in a single SQL database.",
      },
      {
        dimension: "Fan-out Strategy",
        whatPasses: "Proposes Hybrid Push/Pull: Push for active normal users (<25k followers); Pull (fan-out on read) for celebrities with edge caching.",
        whatFails: "Insists on pure Push model, causing cascading message queue backlog on celebrity updates.",
      },
    ],
    modelAnswerOverview:
      "Meta interviewers evaluate your command of graph data models, multi-level caching (Memcached / TAO), and hybrid fan-out mechanics. Ensure you calculate the write amplification factor and discuss how client-side pagination works using cursor-based offsets rather than SQL OFFSET/LIMIT.",
  },
  {
    company: "Google",
    role: "Staff Software Engineer (L6) / Senior SDE (L5)",
    problem: "Design Google Drive & Real-Time Collaborative Document Editing",
    expectedDeliverables: [
      "Block-level Chunking & Delta Sync: File chunking (Content Defined Chunking using Rabin Fingerprints), hash dedup, delta compression.",
      "Collaborative Concurrency Engine: Operational Transformation (OT) vs Conflict-Free Replicated Data Types (CRDT).",
      "Metadata Storage & Versioning: Google Spanner / Bigtable for globally consistent atomic file metadata and permission ACL trees.",
      "Notification Service: Long-polling / WebSocket push service for file sync state changes across devices.",
    ],
    keyChallenges: [
      "Network Efficiency: Modifying 1 paragraph in a 2GB file must upload only the changed 4KB block, not the full file.",
      "Conflict Resolution: Two users typing in the exact same word simultaneously across continents without race conditions.",
    ],
    scoringCriteria: [
      {
        dimension: "File Chunking & Storage",
        whatPasses: "Explains Content Defined Chunking (CDC) with Rabin fingerprints to prevent full re-upload on prepended bytes; deduplicates chunks globally by SHA-256 hash in Google Colossus/S3.",
        whatFails: "Proposes uploading full files or fixed-size 4MB chunks that lose alignment upon single-byte inserts.",
      },
      {
        dimension: "Real-Time Collaboration",
        whatPasses: "Clearly articulates OT with a centralized ordering server or state-based CRDT (Yjs/Automerge), detailing character insert/delete transform operations.",
        whatFails: "Suggests pessimistic file locking ('User A locks the document while editing') or simple last-write-wins timestamps.",
      },
    ],
    modelAnswerOverview:
      "Google interviewers probe deeply into distributed systems principles: global consensus (Spanner TrueTime), chunk hashing math, and synchronization protocols. Emphasize bandwidth optimization and how cross-device background sync resumes interrupted transfers.",
  },
  {
    company: "Amazon",
    role: "Senior Software Development Engineer (SDE III)",
    problem: "Design Amazon Flash Sale & High-Concurrency Inventory Reservation Engine",
    expectedDeliverables: [
      "Inventory Service: Atomic decrement without overselling under 100,000 orders/second.",
      "Distributed Transaction Saga: Orchestrated Saga coordinating Payment, Inventory Reservation, and Order Creation.",
      "Queue Shock Absorber: SQS FIFO with deduplication keys to throttle burst traffic into backend order processors.",
      "DynamoDB Single-Table Design: Partitioning orders and customer items with global secondary indexes (GSI).",
    ],
    keyChallenges: [
      "Zero Overselling: Selling 1,000 discounted PS5 consoles when 500,000 concurrent users click 'Buy Now'.",
      "Zombie Reservations: Handling users who add item to cart, reserve inventory, but never complete payment.",
    ],
    scoringCriteria: [
      {
        dimension: "Inventory Concurrency",
        whatPasses: "Uses Redis atomic Lua script with local token bucket or DynamoDB conditional write (`attribute_exists(qty) AND qty >= :requested`), backed by automatic TTL release for abandoned carts.",
        whatFails: "Suggests relational database `SELECT ... FOR UPDATE` row locks, resulting in immediate database connection pool exhaustion.",
      },
      {
        dimension: "Order Saga & Idempotency",
        whatPasses: "Designs idempotent order processing using client-generated UUID idempotency keys stored in DynamoDB with compensating transactions on payment decline.",
        whatFails: "Omits idempotency, allowing double-charging when user double-clicks submit or network retries trigger duplicate requests.",
      },
    ],
    modelAnswerOverview:
      "Amazon assesses operational excellence, blast radius containment, and data consistency without distributed 2PC locks. Highlight asynchronous decoupling, circuit breakers, and DynamoDB partition key design to prevent hot partition throttling.",
  },
];
