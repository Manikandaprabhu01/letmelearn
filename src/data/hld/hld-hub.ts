export type HldBlueprint = {
  title: string;
  subtitle: string;
  badge: string;
  diagram: string;
  explanation: string;
  keyComponents: { name: string; role: string; scalingTactic: string }[];
};

export type HldTopicQA = {
  id: string;
  category: string;
  question: string;
  difficulty: "M" | "H";
  summary: string;
  fullAnswer: string;
  codeOrSchema?: { lang: string; content: string };
  followUps: { q: string; a: string }[];
};

export type HldCompanyTrack = {
  id: string;
  company: string;
  companySlug: string;
  roleTitle: string;
  systemScale: string;
  roundsSummary: string;
  barRaiserTenet: string;
  questions: {
    id: string;
    title: string;
    type: "Scale & Throughput" | "Resilience & Chaos" | "Data & Consistency" | "Real-Time Streaming";
    difficulty: "M" | "H";
    scenario: string;
    whatInterviewerIsTesting: string;
    architectureBlueprint: string;
    tradeoffs: string[];
    followUps: { q: string; a: string }[];
  }[];
};

export const HLD_BLUEPRINTS: HldBlueprint[] = [
  {
    title: "Scale Evolution: From 1 Server to 10M+ Users",
    subtitle: "The canonical scaling trajectory: vertical scaling -> read replicas -> caching -> sharding -> event-driven microservices",
    badge: "10M+ Scale",
    explanation:
      "Scaling is not about inventing complex distributed systems on day one; it is an iterative journey of eliminating single points of failure (SPOF) and decoupling synchronous bottlenecks. At 10M+ users, state is moved to the edges, reads are served from multi-tier caches, and writes are decoupled via asynchronous message streams.",
    diagram: `[ Global Clients: Web, Mobile, IoT ]
                │
                ▼
  [ Global Anycast DNS / Geo-DNS (Route 53) ]
                │
  ┌─────────────┴─────────────┐
  ▼                           ▼
[ Edge CDN (Cloudflare/CloudFront) ] ── (Static Assets / Edge Caching)
  │ (Dynamic API Requests)
  ▼
[ L4 / L7 Load Balancers (HAProxy / AWS ALB) ] ── (TLS Termination, DDOS Shield)
  │
  ▼
[ API Gateway Cluster (Kong / Envoy) ] ── (JWT Auth, Rate Limiter, Path Routing)
  │
  ├──► [ Microservices Tier (Kubernetes HPA) ]
  │      ├── User Service
  │      ├── Order Service
  │      └── Payment Service
  │
  ├──► [ Distributed Cache Layer ]
  │      ├── Redis Cluster (Session, Leaderboards, Hot Reads)
  │      └── Memcached (Object Caching)
  │
  ├──► [ Asynchronous Event Mesh ]
  │      └── Apache Kafka Cluster (Partitioned Event Streams, CDC)
  │
  └──► [ Scaled Data Tier ]
         ├── Primary Database (PostgreSQL / MySQL InnoDB)
         ├── Read-Replicas (Asynchronous WAL stream)
         ├── Sharded Databases (Citus / Vitess)
         └── Data Lakehouse / OLAP (Snowflake / ClickHouse via Kafka)`,
    keyComponents: [
      {
        name: "Anycast Geo-DNS & CDN",
        role: "Routes users to nearest Point of Presence (PoP) and caches static assets",
        scalingTactic: "Absorbs 85% of edge traffic before hitting application servers",
      },
      {
        name: "L7 API Gateway & Envoy",
        role: "Performs mTLS termination, distributed rate limiting, and circuit breaking",
        scalingTactic: "Shields internal microservices from connection storms and DDoS floods",
      },
      {
        name: "Stateless Microservices (K8s)",
        role: "Executes business logic with zero session state stored in local pod memory",
        scalingTactic: "Horizontal Pod Autoscaler (HPA) scales pods from 5 to 500 based on CPU/P99 latency",
      },
      {
        name: "Multi-Tier Caching & Sharded DB",
        role: "Serves reads sub-millisecond from Redis; shards data by Tenant/User ID",
        scalingTactic: "Keeps database read load under 5% and limits shard blast radius",
      },
    ],
  },
  {
    title: "Distributed Sagas: Orchestration vs Choreography",
    subtitle: "Maintaining business transaction consistency across independent microservice databases without locking 2PC",
    badge: "Consistency",
    explanation:
      "Two-Phase Commit (2PC) blocks resources and couples microservice availability. The Saga pattern executes a series of local database transactions. If one step fails, the Saga executes compensating transactions in reverse order to roll back changes gracefully.",
    diagram: `[ SAGA ORCHESTRATION ARCHITECTURE ]

[ Client: Buy Flight + Hotel ]
          │ (POST /reservations)
          ▼
[ Saga Orchestrator (State Machine) ]
  │
  ├── 1. Reserve Flight (Flight Service DB) ──► OK
  │
  ├── 2. Reserve Hotel (Hotel Service DB) ──► OK
  │
  ├── 3. Charge Credit Card (Payment Service) ──► FAILED (Card Expired!)
  │
  └── 4. [COMPENSATION TRIGGERED]:
        ├── Undo Hotel Reservation (Hotel Service DB: CANCELLED)
        └── Undo Flight Reservation (Flight Service DB: CANCELLED)
  │
  ▼
[ Return 422: Payment Failed, All Prior Reservations Refunded ]`,
    keyComponents: [
      {
        name: "Saga Orchestrator",
        role: "Centralized coordinator tracking transaction state machine in durable storage",
        scalingTactic: "Simplifies debugging, avoids event loops, enforces timeout handling",
      },
      {
        name: "Compensating Transactions",
        role: "Semantic undo operations that restore business state (e.g. Refund rather than rollback)",
        scalingTactic: "Must be strictly idempotent to survive network retry drops",
      },
    ],
  },
];

export const HLD_TOPIC_QA_LIBRARY: HldTopicQA[] = [
  {
    id: "hld-qa-cache-stampede",
    category: "Caching & Scaling",
    question: "What is the Cache Stampede (Thundering Herd) problem, and how do Mutex Locks vs Probabilistic Early Expiration (XFetch) resolve it?",
    difficulty: "H",
    summary:
      "When a popular cached key expires under heavy read concurrency (e.g. 5,000 QPS), all concurrent threads experience a cache miss simultaneously and hammer the primary database, crashing it. Mutex locks and XFetch prevent database collapse.",
    fullAnswer: `### The Anatomy of Cache Stampede
Consider a hot key \`homepage_feed\` with a 5-minute TTL serving 5,000 requests/sec.
- At $T = 300\\text{s}$, the key expires in Redis.
- Over the next 50 milliseconds, 250 concurrent requests arrive.
- Every single request experiences a cache miss!
- All 250 threads query the database simultaneously with an expensive multi-table JOIN query.
- The database CPU spikes to 100%, connection pool starves, and the service cascades into a complete outage.

### Solution 1: Distributed Mutex Locking (Single-Flight Pattern)
When a cache miss occurs, only ONE thread acquires a distributed mutex (e.g. \`SET lock:key token NX EX 5\`) to recompute the value.
- The winning thread queries the database and repopulates Redis.
- All other 249 threads wait briefly or sleep 50ms and re-check Redis.
- **Drawback:** Introduces thread contention and latency jitter for waiting requests.

### Solution 2: Optimal Solution — Probabilistic Early Expiration (XFetch)
Instead of waiting for the key to expire at $T_{\\text{TTL}}$, background requests proactively refresh the cache BEFORE it expires based on a probabilistic formula:
$$\\Delta - \\beta \\cdot \\delta \\cdot \\ln(\\text{rand}()) > \\text{TTL}$$
Where:
- $\\Delta$: Execution time required to compute the database query.
- $\\beta$: Aggressiveness constant ($> 0$).
- $\\delta$: Random floating point number between 0 and 1.
- **Result:** As expiration approaches, the probability of a read randomly triggering a background refresh increases smoothly. Exactly one client refreshes the cache transparently before expiration, achieving 0ms read latency and zero database stampedes.`,
    codeOrSchema: {
      lang: "python",
      content: `import math, random, time

def xfetch(redis_client, key, compute_fn, delta=0.05, beta=1.0):
    val, expiry = redis_client.get_with_expiry(key)
    now = time.time()
    
    # Probabilistic early recomputation check
    if val is None or (now - (delta * beta * math.log(random.random())) > expiry):
        # Refresh cache in background or inline
        val = compute_fn()
        redis_client.set(key, val, ex=300)
    return val`,
    },
    followUps: [
      {
        q: "What is Cache Penetration and how does a Bloom Filter resolve it?",
        a: "Cache Penetration occurs when malicious queries repeatedly request non-existent keys (e.g. user_id = -9999). Since the key is never in the cache, every query hits the database. A Bloom Filter at the gateway checks if the key has ever existed in < 0.1ms. If the Bloom filter says no, the query is rejected immediately without touching the database.",
      },
    ],
  },
  {
    id: "hld-qa-kafka-exactly-once",
    category: "Messaging & Streaming",
    question: "How does Apache Kafka achieve Exactly-Once Semantics (EOS)? Explain Idempotent Producers and Two-Phase Transactional Commits.",
    difficulty: "H",
    summary:
      "Kafka achieves EOS across end-to-end stream processing (Read -> Process -> Write) by combining producer sequence numbering (idempotence) with a two-phase transactional coordinator that commits offsets and messages atomically.",
    fullAnswer: `### 1. The Three Delivery Semantics
- **At-Most-Once:** Commit offset before processing. If worker crashes mid-processing, message is lost.
- **At-Least-Once (Default):** Process message, then commit offset. If worker crashes after processing but before commit, message is re-processed on restart (duplicates!).
- **Exactly-Once (EOS):** Message processing and downstream publishing succeed exactly once without loss or duplicates.

### 2. Component 1: Idempotent Producer
Prevents duplicate messages caused by network retry timeouts:
- Every producer is assigned an internal Producer ID (\`PID\`).
- Each message sent by the producer contains a monotonically increasing Sequence Number (\`SeqNum\`).
- The broker partition broker records the highest \`SeqNum\` received for each \`PID\`.
- If a network drop occurs after the broker writes the message and the producer retries sending message \`SeqNum=42\`, the broker detects the duplicate and discards it with zero duplicates.

### 3. Component 2: Transactional Coordinator & Atomic Commits
In a stream processing application that consumes from Topic A, transforms data, and writes to Topic B:
1. Producer initiates transaction with \`Transaction Coordinator\`.
2. Output messages are written to Topic B with an uncommitted marker.
3. Consumer offset for Topic A is written to the consumer offsets topic *within the same transaction*.
4. Two-Phase Commit (2PC):
   - **Prepare Phase:** Coordinator writes 'PREPARE_COMMIT' to transaction log.
   - **Commit Phase:** Coordinator writes 'COMMIT' markers to both Topic B and the consumer offset topic.
5. Downstream consumers running with \`isolation.level=read_committed\` skip uncommitted messages and only consume fully committed transactional records.`,
    followUps: [
      {
        q: "What causes a Kafka consumer group rebalance and how do static memberships prevent rebalance storms?",
        a: "A rebalance occurs when a consumer crashes, takes longer than max.poll.interval.ms to process a batch, or a new consumer joins. Rebalances freeze consumer message consumption across the entire group. Static Membership (group.instance.id) allows a restarting consumer pod to retain its partition assignment without triggering a stop-the-world rebalance.",
      },
    ],
  },
];

export const HLD_COMPANY_TRACKS: HldCompanyTrack[] = [
  {
    id: "netflix-hld-streaming",
    company: "Netflix",
    companySlug: "netflix",
    roleTitle: "Senior / Staff Distributed Systems Engineer",
    systemScale: "300M+ Global Subscribers · 100M+ Concurrent Streams",
    roundsSummary: "Video Streaming Architecture + Chaos Engineering + Global Active-Active Multi-Region",
    barRaiserTenet:
      "Global Resilience & Graceful Degradation: Netflix evaluates whether your architecture can survive entire AWS region outages without interrupting playback for active viewers.",
    questions: [
      {
        id: "netflix-video-cdn-architecture",
        title: "Design a Global Video Streaming Platform (Netflix Open Connect CDN)",
        type: "Scale & Throughput",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you design the complete streaming lifecycle: ingestion, adaptive bitrate transcoding (DASH/HLS), and custom edge CDN appliances (Open Connect) embedded inside ISPs?",
        scenario:
          "Design a global video streaming platform capable of delivering 4K HDR streams to 100 million concurrent viewers during a major series release. The system must eliminate buffering, minimize cross-oceanic bandwidth costs, and automatically adapt to cellular network fluctuations.",
        architectureBlueprint: `### 1. Dual-Architecture Paradigm: Control Plane vs Data Plane
- **Control Plane (AWS Cloud):** User auth, billing, recommendation engine, metadata search, and DRM license validation.
- **Data Plane (Open Connect CDN):** Custom storage appliances (OCAs) deployed directly inside Internet Service Provider (ISP) datacenters worldwide.

### 2. End-to-End Streaming Architecture
\`\`\`
[ Master 8K Video Upload ]
            │
            ▼
[ Distributed Transcoding Pipeline (AWS EC2 / GPU Spot Fleet) ]
  ├── Chunks video into 2-4 second segments
  ├── Encodes into multiple bitrates & resolutions (AVC, HEVC, AV1)
  │     ├── 1080p @ 3 Mbps, 720p @ 1.5 Mbps, 480p @ 500 Kbps
  └── Generates Manifest Files (HLS / MPEG-DASH: .m3u8 / .mpd)
            │
            ▼
[ Content Delivery: Open Connect Appliance (OCA) Ingestion ]
  ├── Nightly Pre-Positioning: Proactively pushes popular shows to edge ISPs at 3 AM
  └── Cache Routing Service: Assigns player to the closest healthy OCA based on BGP routing
            │
            ▼
[ Client Video Player (Smart TV / Mobile) ]
  ├── Adaptive Bitrate Algorithm (ABR): Monitors buffer fullness & throughput
  └── Dynamic resolution switching without pause or rebuffering
\`\`\``,
        tradeoffs: [
          "Do NOT stream video files through application API gateways or PostgreSQL databases. Video chunks are static blobs served directly from edge Open Connect caches via HTTP/2.",
        ],
        followUps: [
          {
            q: "How does Netflix handle an entire AWS region failing during peak evening streaming?",
            a: "Zuul API Gateway and Eureka service discovery use Global Active-Active multi-region traffic shifting. When US-East-1 fails, Route 53 and latency-based DNS automatically divert traffic to US-West-2 and EU-West-1 in under 6 minutes, while Cassandra multi-region clusters keep user viewing state synchronized.",
          },
        ],
      },
    ],
  },
  {
    id: "uber-hld-dispatch",
    company: "Uber",
    companySlug: "uber",
    roleTitle: "Staff Systems / Backend Infrastructure Engineer",
    systemScale: "30M+ Trips Daily · 5M Active Drivers · Sub-second Geospatial Tracking",
    roundsSummary: "Geospatial Indexing + Real-Time Location Ingestion + Surge Pricing Architecture",
    barRaiserTenet:
      "Ultra-Low-Latency Geospatial Sharding: Uber evaluates whether you can partition high-frequency moving entities without incurring full-table scans or lock deadlocks.",
    questions: [
      {
        id: "uber-geospatial-dispatch",
        title: "Design Real-Time Geospatial Driver Location Ingestion & Matching",
        type: "Real-Time Streaming",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you design a geospatial indexing architecture that ingests 5 million driver GPS pings every 4 seconds and finds the nearest 10 drivers to a rider in under 20ms?",
        scenario:
          "5 million active drivers transmit their latitude and longitude every 4 seconds (1.25M QPS). Riders request pickups and must be matched with the 10 closest available drivers within a 3-mile radius within 20 milliseconds.",
        architectureBlueprint: `### 1. Why SQL Spatial Queries (PostGIS) Fail at 1.25M QPS
Executing \`ST_DWithin(driver_loc, rider_loc, 5000)\` at 1.25 million writes/second causes massive B-Tree / R-Tree lock contention and disk I/O exhaustion.

### 2. The Solution: Hexagonal Spatial Partitioning (Uber H3 / Google S2)
- The entire globe is divided into hierarchical hexagonal cells using **H3**.
- A latitude and longitude coordinate maps directly to a discrete 64-bit integer H3 Cell ID in microsecond CPU time.
- **In-Memory Geo-Index (Redis / Custom Memory Ring):**
  Drivers are indexed by their current H3 cell ID:
  \`SET driver_locations:{h3_cell_id} driver_101\`

\`\`\`
[ 5M Drivers transmitting GPS every 4s ]
            │ (1.25M QPS via WebSocket / gRPC)
            ▼
[ Location Ingestion Gateway (Netty / Go) ]
  ├── 1. Compute H3 Cell Index (Resolution 8: ~460m edge length)
  ├── 2. Write to Kafka Topic "driver-locations"
  └── 3. Update Redis In-Memory Geo-Cluster (TTL: 15 seconds)
            │
[ Rider Pickup Request ]
            │ (POST /trips/request)
            ▼
[ Dispatch Matching Service ]
  ├── 1. Compute Rider's H3 Cell ID
  ├── 2. Fetch Driver IDs from Rider Cell + 6 Adjacent Hexagonal Cells (k-ring 1)
  ├── 3. Filter only drivers with status "AVAILABLE"
  └── 4. Calculate ETA using routing distance matrix
\`\`\``,
        tradeoffs: [
          "Hexagonal cells (H3) are vastly superior to square grid partitions because all adjacent neighbors are equidistant, eliminating boundary anomalies.",
        ],
        followUps: [
          {
            q: "How do you handle flash crowds at a stadium where 20,000 riders open the app simultaneously in a single H3 cell?",
            a: "Implement Dynamic Resolution Scaling: when query density in a single cell exceeds threshold, dynamically subdivide the cell into Resolution 9 or 10 sub-cells and distribute load across distinct Redis shards.",
          },
        ],
      },
    ],
  },
];
