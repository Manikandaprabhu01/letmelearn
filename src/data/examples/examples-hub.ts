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
| REAL-TIME EVENT FLOW: UBER / LYFT GEOSPATIAL DISPATCH & SURGE ENGINE                              |
+---------------------------------------------------------------------------------------------------+

 [1. Driver Ping Stream (every 4s)]                    [2. Rider Ride Request (POST /v1/trips)]
   Payload: {driverId: "d_9912", lat: 37.7749,            Payload: {riderId: "r_3342", pickup: (37.781, -122.41),
             lon: -122.4194, bearing: 90, speed: 32}                 tier: "UberX", nonce: "req_tok_991"}
        │ (gRPC Stream over mTLS)                              │ (HTTPS / TLS 1.3 - 14ms RTT)
        ▼                                                      ▼
 [Envoy L7 Edge Gateway (DDOS / Rate Limit)]           [Envoy L7 Edge Gateway (Rate Limiter)]
        │                                                      │
        ▼ (<1.2ms)                                             ▼ (<1.8ms)
 [Location Ingestion Service (Go)]                     [Trip Orchestrator Service (K8s)]
        │                                                      │
        ├──► 1a. Spatial Quantization                          ├──► 2a. Map pickup to H3 Hex: 8828308281fffff
        │        H3.geoToH3(37.7749, -122.4194, res=8)         │        Call H3.kRing(8828308281fffff, radius=2)
        │        ──► Cell Index: 8828308281fffff               │        ──► Returns 19 neighboring Hex Cells
        │                                                      │
        ├──► 1b. Write Ephemeral Cell Location                 ├──► 2b. Query Available Drivers Across 19 Cells:
        │        Redis: SADD h3:8828308281fffff d_9912         │        Redis: SUNION h3:cell_1 h3:cell_2 ...
        │        Redis: SET driver:loc:d_9912 (lat, lon)       │        Result: 16 candidate driver IDs (<1.5ms)
        │        Redis: EXPIRE 10s (Auto-evict stale pings)    │
        │                                                      ▼
        └──► 1c. Stream to Kafka ['driver-locations']         [3. Candidate Filter & Routing ETA Calculation]
                 Partition key: driver_id                      ├── Filter: status == 'AVAILABLE' && rating >= 4.7
                 Consumed by: Surge Engine & Telemetry         ├── Query OSRM/Valhalla Engine: Matrix ETA calc
                                                               └── Winner: Driver d_9912 (ETA: 3.2 mins, Dist: 0.9mi)
                                                               │
                                                               ▼
                                                      [4. Atomic Lock Acquisition (Redis Distributed Lock)]
                                                               ├── SET lock:driver:d_9912 rider_3342 NX PX 15000
                                                               ├── If Acquired: Transition Trip ──► 'DISPATCH_OFFERED'
                                                               └── If Contested: Fallback to rank #2 candidate driver
                                                               │
                                                               ├──► [5a. Push Offer via WebSocket / Apple APNs]
                                                               │          Dispatches offer to Driver d_9912 (15s timer)
                                                               │
                                                               └──► [5b. Write Durable Ledger Record]
                                                                          PostgreSQL: INSERT into trips (ACID transaction)
                                                                          ScyllaDB: Log GPS tracking trail for audit
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
| REAL-TIME VIDEO ENCODING & ABR PLAYBACK FLOW: NETFLIX TITAN & OPEN CONNECT CDN                    |
+---------------------------------------------------------------------------------------------------+

 [PHASE A: ASYNCHRONOUS INGESTION & MATRIX TRANSCODING PIPELINE]
 [1. Film Studio Master Upload (Aspera UDP Transfer)]
   Raw Apple ProRes 4K HDR master (1.2 TB) ──► Uploaded to Amazon S3 Multi-Region Ingest Bucket
        │
        ▼ (S3 Event Notification: ObjectCreated:Put)
 [2. Titan Workflow Orchestration Engine (K8s / Mesos)]
   ├── Step 2a: Scene-Cut Analysis: Scan frames to detect scene boundaries; cut into 2-4s chunks
   ├── Step 2b: Dispatch to Transcoding Farm (10,000+ EC2 Spot Instances with Spot-Termination Handlers)
   │     ├── Worker Pool 1: 4K UHD AV1 @ 12 Mbps (High-action scenes)
   │     ├── Worker Pool 2: 1080p HEVC @ 3.5 Mbps (Mainstream TV profile)
   │     └── Worker Pool 3: 480p H.264 @ 450 kbps (Mobile cellular profile)
   └── Step 2c: Dynamic Manifest Generation: Assemble MPEG-DASH (.mpd) & HLS (.m3u8) byte-range index
        │
        ▼ (Proactive Off-Peak Cache Pre-positioning, 2 AM - 6 AM BGP Sync)
 [3. Edge Distribution to Netflix Open Connect Appliances (OCAs)]
   Custom FreeBSD Flash Storage Boxes deployed inside Comcast, Vodafone, Airtel, and Jio ISP racks

 [PHASE B: REAL-TIME SUBSCRIBER STREAMING SESSION]
 [4. Subscriber Clicks "Play" on Smart TV (Client PlayAPI Request)]
   GET /playapi/v1/license?titleId=stranger_things_s4e1
        │ (TLS 1.3 - 18ms latency to AWS Control Plane)
        ▼
   PlayAPI validates subscription & returns DRM Widevine Token + Manifest URL pointing to local OCA
        │
        ▼
 [5. Adaptive Bitrate (ABR) Chunk Streaming Loop]
   Smart TV Player initiates BOLA (Buffer Occupancy based Lyapunov Algorithm):
   ├── Chunk 001: Fetch 480p segment (Fast startup, playback begins in <180ms)
   ├── Buffer Fill Check: Network bandwidth measured at 48 Mbps, buffer level > 12s
   ├── Chunk 002: Upgrade request to 1080p HEVC (HTTP GET /chunks/chunk_002_hevc_1080p.m4s)
   └── Chunk 003+: Stable 4K AV1 stream served 100% locally from ISP OCA (0 hops, 0 buffering)
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
| REAL-TIME PACKET FLOW: WHATSAPP 2 BILLION CONNECTION INSTANT MESSAGING FABRIC                     |
+---------------------------------------------------------------------------------------------------+

 [1. User A (Sender Device)]
   ├── Step 1a: Encrypt Payload locally via Signal Protocol Double Ratchet with User B's Public Key
   │             Ciphertext: "d83f9a...c02" (Zero plaintext leaves device; server cannot read payload)
   └── Step 1b: Stream binary frame over persistent TLS/TCP Socket (Port 443, minimal XMPP-like protocol)
        │
        ▼ (<14ms network RTT)
 [2. Edge Chat Gateway Node 1 (Erlang BEAM on FreeBSD)]
   ├── Host maintains 2,000,000+ persistent TCP connections via custom FreeBSD kqueue tuning
   ├── Step 2a: Validate sender auth session & rate-limit check in local RAM (<0.08ms)
   └── Step 2b: Query Global Session Registry (Distributed Hash Table in RAM / Mnesia):
                 Lookup: Where is User B connected? ──► Returns Gateway_Node_42:Port 5222
        │
        ├──► [CASE 1: USER B IS ONLINE AT GATEWAY NODE 42]
        │      ├── Step 3a: Erlang Process Messaging: Gateway 1 passes binary tuple to Gateway 42
        │      ├── Step 3b: Gateway 42 writes frame to User B's open TCP socket (<1.5ms)
        │      ├── Step 3c: User B device decrypts message & emits Single-Tick Delivery Receipt ACK
        │      ├── Step 3d: Server immediately deallocates packet from RAM (Zero durable storage)
        │      └── Step 3e: Gateway routes Delivery Tick back to User A (User A UI shows "Double Grey Tick ✓✓")
        │
        └──► [CASE 2: USER B IS CURRENTLY OFFLINE (Airplane Mode / Dead Battery)]
               ├── Step 4a: Buffer Ciphertext in Offline Store (ScyllaDB / Cassandra FIFO Spool)
               │             INSERT INTO offline_messages (user_id, msg_id, payload, created_at)
               │             WITH TTL = 2592000 (Auto-expire after 30 days)
               ├── Step 4b: Fire Wake-Up Push Notification:
               │             Post payload notification to Apple APNs / Google FCM (Wake-up signal only)
               └── Step 4c: Reconnect Trigger: When User B regains network, client opens TCP connection
                             Gateway 42 flushes buffered FIFO queue to User B, awaits ACK, deletes rows,
                             and emits double delivery ticks back to User A.
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
| REAL-TIME EXECUTION FLOW: DISTRIBUTED RATE LIMITER & MULTI-TIER TOKEN BUCKET                      |
+---------------------------------------------------------------------------------------------------+

 [1. Inbound HTTP Request: 10,000,000 QPS Peak]
   GET /v1/payments/charges
   Headers: { Host: "api.stripe.com", Authorization: "Bearer sk_live_9921a", X-Client-IP: "198.51.100.4" }
        │
        ▼ (Edge BGP Anycast Routing)
 [2. Envoy L7 Edge Proxy Cluster]
   ├── Step 2a: Extract Rate-Limit Domain & Descriptor Tuple:
   │            Domain: "api_gateway" | Key: "api_key" | Value: "sk_live_9921a"
   │
   ├── Step 2b: L1 Thread-Local Token Bucket Check (C++ Memory)
   │            ├── Read local atomic counter in worker thread cache (<0.02ms latency)
   │            ├── If local tokens > 0: Decrement token and IMMEDIATELY forward to upstream
   │            │   (95% of traffic served locally with ZERO network round-trip overhead!)
   │            └── If local batch depleted: Proceed to Step 3 for centralized verification
   │
   └── Step 2c: Non-Blocking Async gRPC Call (envoy.service.ratelimit.v3.RateLimitService)
        │
        ▼ (<0.8ms gRPC over Unix Domain Socket / VPC Mesh)
 [3. Rate Limiting Service Cluster (Go / Rust Tokio Workers)]
   ├── Step 3a: Aggregate Token Quota Request (Batch refill request: 50 tokens)
   │
   └── Step 3b: Atomic Redis Sliding-Window Execution via EVALSHA Lua Script:
        │
        │ [Atomic Lua Execution inside Redis Memory: <0.5ms]
        │ ┌──────────────────────────────────────────────────────────────────────────────┐
        │ │ local key     = "ratelimit:" .. KEYS[1]                                      │
        │ │ local now     = tonumber(ARGV[1])   -- Current epoch ms (1719201948120)      │
        │ │ local window  = tonumber(ARGV[2])   -- 60000ms (1 minute window)             │
        │ │ local limit   = tonumber(ARGV[3])   -- 1000 requests / minute max            │
        │ │ -- 1. Purge expired request timestamps outside sliding window                │
        │ │ redis.call('ZREMRANGEBYSCORE', key, 0, now - window)                         │
        │ │ -- 2. Count active requests within current 60s sliding window                │
        │ │ local current = redis.call('ZCARD', key)                                     │
        │ │ if current < limit then                                                      │
        │ │     redis.call('ZADD', key, now, now)                                        │
        │ │     redis.call('EXPIRE', key, math.ceil(window / 1000))                      │
        │ │     return { 1, limit - current - 1, 0 } -- { ALLOWED, REMAINING, RETRY_SEC }│
        │ │ else                                                                         │
        │ │     local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')             │
        │ │     local retry_after = math.ceil((tonumber(oldest[2]) + window - now)/1000) │
        │ │     return { 0, 0, retry_after }        -- { REJECTED, 0, RETRY_SEC }        │
        │ │ end                                                                          │
        │ └──────────────────────────────────────────────────────────────────────────────┘
        │
        ├──► [Branch 4a: ALLOWED (Quota Under Limit)]
        │      ├── Redis returns: { status: 1, remaining: 482, retry_sec: 0 }
        │      ├── Envoy forwards packet to Upstream Payment Microservice
        │      └── Injects Response Headers:
        │            X-RateLimit-Limit: 1000
        │            X-RateLimit-Remaining: 482
        │            X-RateLimit-Reset: 1719202008
        │
        ├──► [Branch 4b: REJECTED (HTTP 429 Too Many Requests)]
        │      ├── Redis returns: { status: 0, remaining: 0, retry_sec: 14 }
        │      ├── Envoy short-circuits request (Upstream service NEVER touched, 0% CPU wasted)
        │      └── Returns HTTP 429 Payload:
        │            HTTP/2 429 Too Many Requests
        │            Retry-After: 14
        │            Content-Type: application/json
        │            {"error": "rate_limit_exceeded", "message": "Quota 1000 req/min reached"}
        │
        └──► [Branch 4c: RESILIENCE & FAIL-OPEN CIRCUIT BREAKER]
               ├── Scenario: Redis Cluster network partition or P99 latency > 2.0ms
               ├── Envoy Circuit Breaker trips: State ──► OPEN (Fail Open Policy)
               ├── Bypass Rate Limiter: Forward request to preserve 99.999% gateway availability
               └── Fire Prometheus Alert: [CRIT] RateLimiterDegraded_FailOpenEngaged
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
| REAL-TIME CRAWL & DEDUP PIPELINE: PLANETARY WEB CRAWLER & MERCATOR FRONTIER                       |
+---------------------------------------------------------------------------------------------------+

 [1. Frontier Priority Dequeue: 10,000 URLs / second]
   Mercator Priority Front Queues (F1...Fn: categorized by PageRank, Domain Authority, Freshness)
        │
        ▼ (Biased Lottery Selection: Top 10% highest quality seeds picked first)
 [2. Politeness Hostname Router & Per-Domain Back Queues (B1...Bm)]
   ├── Step 2a: Extract Root Domain Hash: hash("nytimes.com") % M ──► Bucket B_4091
   │
   ├── Step 2b: Politeness Min-Heap Priority Queue:
   │            ├── Key: Domain | Value: next_allowed_fetch_time (Epoch ms)
   │            ├── Enforce Host Delay: Current time >= (Last Fetch + 1500ms crawl delay)
   │            └── Check robots.txt directive: Respect "Crawl-delay: 2" if declared
   │
   └── Step 2c: Pop Ready URL: "https://nytimes.com/2026/10/deep-space-probe.html"
        │
        ▼ (Dispatched over ZeroMQ / gRPC to Worker Cluster)
 [3. Async Crawler Worker Node (Rust Tokio Runtime, 25,000 Concurrent Sockets)]
   ├── Step 3a: DNS Prefetch & Local Cache Check:
   │            ├── Query local Unbound DNS cache daemon (<0.4ms)
   │            └── Avoid external authoritative DNS timeout spikes (Prevents worker stalling)
   │
   ├── Step 3b: Robots.txt Ruleset Evaluation:
   │            ├── Redis Cache Lookup: GET robots:nytimes.com (<0.5ms)
   │            └── Fast AST Match: Disallow: /admin, Allow: /2026/* ──► Status: PERMITTED
   │
   ├── Step 3c: Non-Blocking HTTP/2 GET over TLS 1.3:
   │            ├── Request Header: User-Agent: "GrokBot/2.0 (+https://example.com/bot)"
   │            ├── Stream Read Payload (Enforce 10MB streaming size limit to prevent memory bomb)
   │            └── Response Received: HTTP 200 OK (218 KB compressed HTML, 64ms wire latency)
   │
   └── Step 3d: 64-Bit SimHash Near-Duplicate Detection:
        │
        │ [SimHash Vector Calculation: Extract 5-gram shingles & term weights]
        │ ├── Generated 64-bit fingerprint: 0x9e3779b97f4a7c15
        │ ├── Query RocksDB SimHash Index: Split 64 bits into 4 x 16-bit table lookups
        │ └── Hamming Distance Check:
        │       ├── If HammingDistance(hash, existing_hashes) <= 3:
        │       │   ──► NEAR DUPLICATE (Mirror site / syndicated article)
        │       │   ──► ACTION: Discard payload immediately (Saves petabytes of raw storage!)
        │       └── If HammingDistance > 3:
        │           ──► UNIQUE DOCUMENT: Proceed to Storage and Link Extraction
        │
        ├──► [4. Archival Compression & Durable Storage]
        │      ├── Package raw HTML + response headers into standard WARC record format
        │      ├── Gzip compress into 1GB multi-record chunks (Snappy / Zstandard)
        │      └── Append to Ceph / Amazon S3 Object Storage Bucket: s3://crawl-archive/2026-10/
        │
        └──► [5. HTML Lexer & URL Extraction Pipeline]
               ├── Fast C++ Lexbor Parser extracts all outbound <a href="..."> hyperlinks
               ├── Extracted 142 raw target URLs from document
               │
               ▼
 [6. URL Canonicalization & Seen-Filter Engine]
   ├── Step 6a: Canonicalize: Lowercase scheme/host, strip fragments (#section), remove utm_* tags
   │
   └── Step 6b: Scalable Bloom Filter Membership Test (O(1) Memory Lookup):
        │
        │ [MurmurHash3 x 8 Hash Functions across 10-Billion-Bit Bitmap]
        │ ├── If all 8 bits == 1:
        │ │   ──► ALREADY SEEN OR QUEUED (Drop URL, prevent infinite crawling loops)
        │ └── If any bit == 0:
        │     ──► UNSEEN NEW URL DISCOVERED!
        │     ──► Set all 8 bits = 1 in Bloom Filter
        │     ──► Append URL to RocksDB persistent seen-set on NVMe SSD
        │     └── Enqueue URL into Step 1 Frontier Priority Queues (Continuous Loop)
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
