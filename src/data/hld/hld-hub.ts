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
    title: "Scale Evolution: 10M+ User Real-Time Request Lifecycle",
    subtitle: "End-to-end request lifecycle: Anycast DNS -> Edge CDN -> L7 Envoy Rate Limiter -> K8s Pods -> Multi-tier Cache -> Sharded Aurora",
    badge: "10M+ Scale",
    explanation:
      "A complete real-time execution trace of an API call in a production system serving 10M+ users. Shows exact network hops, protocol handshakes, sub-millisecond cache lookups, database sharding routers, and asynchronous event streaming.",
    diagram: `+--------------------------------------------------------------------------------------------------------+
| REAL-TIME REQUEST LIFECYCLE: 10M+ USER MULTI-TIER SYSTEM ARCHITECTURE                                  |
+--------------------------------------------------------------------------------------------------------+
 [1. Client: Mobile / Browser (GET /v2/feed?userId=u_9021)]
        │ (12ms global network RTT, TLS 1.3 0-RTT resumption)
        ▼
 [2. Anycast BGP Routing & Cloudflare Edge CDN PoP]
        ├── Check Edge Cache: Cache-Control: max-age=60 (Public CDN Hit? ──► Return 200 OK, 4ms)
        ├── DDoS Mitigation: Layer-4 SYN Flood Shield & WAF token inspection
        └── Cache Miss (Dynamic feed) ──► Proxy to Origin via optimized Tier-1 backbone (<22ms)
        │
        ▼
 [3. Origin L4 / L7 Load Balancers (HAProxy / AWS ALB)]
        ├── Terminate origin TLS; Balance across 3 Availability Zones (AZ-a, AZ-b, AZ-c)
        └── Health check polling: HTTP /healthz every 2000ms
        │
        ▼
 [4. API Gateway Cluster (Envoy Proxy / Kong)]
        ├── Step 4a: Distributed Rate Limiter: Redis Token Bucket (100 req/min per user) ──► Allowed
        ├── Step 4b: Cryptographic JWT Auth Verification: Verify RS256 signature in-process (<0.2ms)
        └── Step 4c: Service Mesh Routing: Forward request via gRPC to User Feed Pod in K8s
        │
        ▼
 [5. Stateless Application Pod (Go / Java Spring Boot on K8s HPA)]
        │
        ├──► Step 5a: Query L1 Local Caffeine In-Memory Cache (RAM hit? ──► <0.05ms)
        │             Miss: Query L2 Distributed Cache: Redis Cluster (read-replica, MGET key)
        │             Result: 85% of feed items found in Redis (<1.2ms)
        │
        ├──► Step 5b: Delta Query to Primary Database for remaining 15% uncached items:
        │             Database Router (Vitess / ProxySQL) hashes userId % NumShards:
        │             Target: Shard-04 (Aurora PostgreSQL Multi-AZ Primary)
        │             Query: SELECT item_id, title, payload FROM feed_items WHERE user_id = 'u_9021';
        │             Execution time: 4.8ms via B+ Tree index scan
        │
        ├──► Step 5c: Async Cache Fill: Asynchronously pipeline MSET missing keys back into Redis
        │
        └──► Step 5d: Emit User Analytics Event:
                      Kafka Producer -> [topic: user.feed_impressions, partition_key: 'u_9021']
                      acks=1 (Non-blocking async fire-and-forget, <0.8ms)
        │
        ▼
 [6. Stream Assembly & Response Compression (brotli)]
        │ (Status: 200 OK, Content-Type: application/json, Latency: 18.5ms P99)
        ▼
 [Client Receives Renderable Feed Payload]`,
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
    title: "Distributed Sagas: Real-Time Order & Rollback Flow",
    subtitle: "Maintaining transaction consistency across microservices via state machine orchestration and compensating rollbacks",
    badge: "Consistency",
    explanation:
      "A real-time trace of an e-commerce checkout transaction failing at payment. Shows how the Saga Orchestrator coordinates forward operations and triggers inverse compensating operations across independent microservice databases without distributed locking.",
    diagram: `+--------------------------------------------------------------------------------------------------------+
| REAL-TIME DISTRIBUTED SAGA TRANSACTION FLOW: ORDER CHECKOUT & FAILURE COMPENSATION                     |
+--------------------------------------------------------------------------------------------------------+
 [1. Client Submits Order]
   POST /v1/checkout
   Headers: { X-Idempotency-Key: "idemp_ord_7719", Authorization: "Bearer ..." }
   Payload: { orderId: "ord_7719", userId: "u_401", items: [{sku: "iphone16", qty: 1}], amount: $1,199 }
        │
        ▼
 [2. Saga Orchestrator Service (Temporal / Cadence State Machine)]
        │
        ├──► [STEP 1: Reserve Inventory in Warehouse Service]
        │      HTTP POST /v1/inventory/reserve {sku: "iphone16", qty: 1, reservationId: "res_901"}
        │      Database: PostgreSQL row lock \`SELECT qty FROM stock WHERE sku='iphone16' FOR UPDATE\`
        │      State: SUCCESS ──► Inventory status updated to 'HELD' (TTL: 10 mins)
        │
        ├──► [STEP 2: Create Pending Order in Order Service]
        │      HTTP POST /v1/orders {orderId: "ord_7719", status: "PENDING_PAYMENT"}
        │      Database: Insert into orders table with status = 'CREATED'
        │      State: SUCCESS ──► Order state recorded
        │
        ├──► [STEP 3: Process Credit Card Payment via Stripe / Bank]
        │      HTTP POST /v1/payments {orderId: "ord_7719", amount: 119900, token: "tok_card_declined"}
        │      External Gateway Response: 402 Payment Required {"error": "CARD_EXPIRED_OR_INSUFFICIENT_FUNDS"}
        │      State: FATAL FAILURE ──► TRIGGER COMPENSATING SAGA WORKFLOW!
        │
        ▼
 [3. Reverse Compensating Workflow (Guaranteed Idempotent Rollbacks)]
        │
        ├──► [COMPENSATION 1: Cancel Pending Order]
        │      HTTP POST /v1/orders/ord_7719/cancel {reason: "PAYMENT_REJECTED"}
        │      Database: UPDATE orders SET status = 'PAYMENT_FAILED_CANCELLED' WHERE id = 'ord_7719';
        │      State: ROLLBACK CONFIRMED
        │
        ├──► [COMPENSATION 2: Release Reserved Warehouse Inventory]
        │      HTTP POST /v1/inventory/release {reservationId: "res_901", sku: "iphone16", qty: 1}
        │      Database: UPDATE stock SET reserved_qty = reserved_qty - 1 WHERE sku = 'iphone16';
        │      State: INVENTORY UNLOCKED & RESTORED
        │
        └──► [COMPENSATION 3: Publish Order Cancellation Event]
               Kafka -> [topic: orders.cancelled, key: "ord_7719"]
               Downstream: Customer Notification Service sends SMS: "Payment declined, no charges made."
        │
        ▼
 [4. Response to Client (HTTP 422 Unprocessable Entity)]
   {"status": "FAILED", "code": "PAYMENT_DECLINED", "reverted": ["INVENTORY", "ORDER_STATE"]}`,
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
  {
    title: "Cache Stampede: Probabilistic Early Refresh (XFetch) Flow",
    subtitle: "Protecting databases from thundering herds when hot keys expire under 10k+ QPS concurrency",
    badge: "Reliability",
    explanation:
      "When a hot cached key expires under heavy traffic, hundreds of concurrent threads hit the database simultaneously. The XFetch algorithm computes an exponential probability curve to trigger background recomputation before expiration, eliminating stampedes.",
    diagram: `+--------------------------------------------------------------------------------------------------------+
| REAL-TIME CACHE STAMPEDE MITIGATION: PROBABILISTIC EARLY RECOMPUTE (XFETCH) FLOW                       |
+--------------------------------------------------------------------------------------------------------+
 [Scenario: Hot Key 'leaderboard:global' has TTL = 300s, Serving 10,000 QPS]
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ At T = 288s (12 seconds before hard expiration):                        │
 └─────────────────────────────────────────────────────────────────────────┘
        │
        ├──► [Request A arrives (Client #482)]
        │      1. Reads Redis: val = cached_data, ttl_remaining = 12.0s
        │      2. Evaluates XFetch Equation: -(delta * beta * ln(rand())) > ttl_remaining
        │         delta = 0.4s (avg DB query time), beta = 1.0, rand() = 0.84
        │         Calculated: -(0.4 * ln(0.84)) = +0.07s
        │         Test: 0.07s > 12.0s? ──► FALSE.
        │      3. Return cached data immediately (Latency: 0.8ms, DB queries: 0)
        │
        ├──► [Request B arrives (Client #791) at T = 296s (4s before expiration)]
        │      1. Reads Redis: val = cached_data, ttl_remaining = 4.0s
        │      2. Evaluates XFetch Equation: rand() = 0.00008 (statistically expected near edge)
        │         Calculated: -(0.4 * ln(0.00008)) = -(0.4 * -9.43) = +3.77s
        │         Test: 3.77s > 4.0s? ──► Close, but false. Return cached data (0.8ms).
        │
        └──► [Request C arrives (Client #810) at T = 297s (3s before expiration)]
               1. Reads Redis: val = cached_data, ttl_remaining = 3.0s
               2. Evaluates XFetch: rand() = 0.00003 ──► +4.16s
               3. Test: 4.16s > 3.0s? ──► TRUE! TRIGGER EARLY BACKGROUND REFRESH!
               4. Client #810 acquires ephemeral Redis mutex: \`SET lock:recompute:leaderboard token NX EX 5\`
               5. Asynchronously executes DB Query: \`SELECT user_id, score FROM scores ORDER BY score DESC LIMIT 100\`
               6. Recomputes leaderboard, sets new key with TTL = 300s in Redis.
               7. Releases mutex lock.
                                      │
                                      ▼
 [Zero Stampede Result: 10,000 QPS served continuously with zero downtime, DB CPU stays < 4%]`,
    keyComponents: [
      {
        name: "Probabilistic XFetch Formula",
        role: "Calculates smooth probability curve based on delta execution time and random entropy",
        scalingTactic: "Spreads out the recomputation trigger so only one thread recomputes",
      },
      {
        name: "Single-Flight Redis Mutex",
        role: "Ensures exactly one worker acquires the compute lease if multiple threads trigger",
        scalingTactic: "Guarantees database receives exactly 1 query during high load",
      },
    ],
  },
  {
    title: "Kafka Exactly-Once Semantics: 2PC Stream Processing Flow",
    subtitle: "Atomic Consume-Process-Produce loops with Producer IDs, Epochs, and Transaction Coordinators",
    badge: "Streaming",
    explanation:
      "A real-time trace of an end-to-end exactly-once payment fraud scoring pipeline in Kafka. Combines idempotent sequence numbering with Two-Phase Commit transaction markers to guarantee zero message loss and zero duplicates.",
    diagram: `+--------------------------------------------------------------------------------------------------------+
| REAL-TIME STREAMING: APACHE KAFKA EXACTLY-ONCE SEMANTICS (EOS) TRANSACTION FLOW                        |
+--------------------------------------------------------------------------------------------------------+
 [Stream Processor: Read From 'payments.inbound' ──► Compute Fraud Score ──► Write To 'payments.verified']
                                                                                └── Commit Input Offset
        │
        ▼
 [1. Initialization (Producer Startup)]
   Producer calls initTransactions()
   ├── Sends FindCoordinatorRequest(transactional.id = "fraud-detector-01") to Kafka Broker
   ├── Transaction Coordinator assigns Producer ID (PID = 10482) and increments Epoch (Epoch = 3)
   └── Fences off any previous zombie instance with PID 10482 & Epoch <= 2 (Zombie Fencing)
        │
        ▼
 [2. Transaction Boundary Begin]
   Producer calls beginTransaction()
   ├── Status transitions: Transaction state set to 'InProgress' in __transaction_state topic
        │
        ▼
 [3. Processing Loop & Dual Writes]
   Step 3a: Consume record from 'payments.inbound' (partition 2, offset 8492)
   Step 3b: Run fraud scoring rule engine in memory (<1.2ms)
   Step 3c: Publish verified record to 'payments.verified' (acks=all)
            Message appended with PID: 10482, Epoch: 3, SequenceNumber: 0
   Step 3d: Send Offsets to Transaction Coordinator:
            Producer calls sendOffsetsToTransaction(offset=8492, consumer_group="fraud-audit")
            Transaction Coordinator appends offset marker to __consumer_offsets partition
        │
        ▼
 [4. Two-Phase Commit Protocol (2PC)]
   Producer calls commitTransaction()
   ├── Phase 1 (Prepare): Coordinator writes 'PREPARE_COMMIT' to __transaction_state
   ├── Phase 2 (Write Markers): Coordinator writes 'COMMIT' control markers to:
   │     ├── Partition 0 of topic 'payments.verified'
   │     └── Partition 2 of topic '__consumer_offsets'
   └── Phase 3 (Complete): Coordinator writes 'COMMITTED' to __transaction_state log
        │
        ▼
 [5. Downstream Consumer Isolation (isolation.level = read_committed)]
   Consumers configured with \`read_committed\` buffer messages and ONLY expose records
   once the explicit 'COMMIT' control marker is processed. Uncommitted or aborted
   transactions are completely invisible to consumers.`,
    keyComponents: [
      {
        name: "Transaction Coordinator",
        role: "Dedicated broker managing transaction states in __transaction_state internal topic",
        scalingTactic: "Coordinates 2PC commit protocol without synchronous node-level locks",
      },
      {
        name: "Zombie Fencing",
        role: "Increments Producer Epoch on restart, rejecting stale writes from split-brain workers",
        scalingTactic: "Guarantees split-brain network partitions cannot emit ghost records",
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
