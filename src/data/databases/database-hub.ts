export type DbModuleTopic = {
  title: string;
  desc: string;
  productionGotcha: string;
  keyConcepts: string[];
};

export type DbCourseModule = {
  step: number;
  slug: string;
  title: string;
  subtitle: string;
  level: "foundational" | "intermediate" | "advanced";
  estimatedHours: number;
  whyItMatters: string;
  architectureBlueprint: string;
  topics: DbModuleTopic[];
  productionDeliverable: string;
};

export type DbTopicQA = {
  id: string;
  moduleStep: number;
  moduleTitle: string;
  category: string;
  question: string;
  difficulty: "E" | "M" | "H";
  summary: string;
  fullAnswer: string;
  code?: {
    lang: string;
    snippet: string;
  };
  followUps: { q: string; a: string }[];
};

export type DbCompanyTrack = {
  id: string;
  company: string;
  companySlug: string;
  roleTitle: string;
  databaseTech: string;
  roundsSummary: string;
  barRaiserTenet: string;
  evaluationRubric: {
    category: string;
    expectation: string;
  }[];
  questions: {
    id: string;
    title: string;
    round: string;
    type: "RDBMS Internals" | "Distributed Systems" | "NoSQL Architecture" | "Concurrency & Locking" | "OLAP vs OLTP";
    difficulty: "M" | "H";
    whatInterviewerIsTesting: string;
    scenario: string;
    recommendedFramework: string;
    solutionBlueprint: string;
    codeSnippet?: {
      lang: string;
      code: string;
    };
    tradeoffsAndTraps: string[];
    followUpQuestions: { q: string; a: string }[];
  }[];
};

export const DB_COURSE_MODULES: DbCourseModule[] = [
  {
    step: 1,
    slug: "rdbms-internals",
    title: "Relational Database Internals & SQL Engine",
    subtitle: "B+ Tree page layout, WAL & ARIES crash recovery, MVCC xmin/xmax, buffer pools, and isolation anomalies",
    level: "foundational",
    estimatedHours: 24,
    whyItMatters:
      "Every production backend engineer writes SQL, but senior/lead engineers understand what happens when a byte hits disk. Without understanding B+ tree splits, buffer pool dirty writes, or MVCC tuple bloat, high-volume transactional databases inevitably hit catastrophic lock contention or out-of-disk crashes.",
    productionDeliverable:
      "A comprehensive PostgreSQL performance tuning blueprint featuring EXPLAIN ANALYZE query plan optimizations, partial and composite indexing strategies, autovacuum threshold configuration, and zero-downtime schema migration scripts.",
    architectureBlueprint: `[ SQL Query: SELECT / UPDATE ]
              │
              ▼
    [ Connection Pooler (PgBouncer) ]
              │
              ▼
    [ Parser -> Rewriter -> Optimizer (Cost-based Query Planner) ]
              │
              ▼
    [ Execution Engine ] ◄─── (Dirty Pages / Flush) ───► [ Buffer Pool (Shared Memory) ]
              │                                                     │
              │ (Append-Only WAL Record)                            │ (Sync checkpoint)
              ▼                                                     ▼
    [ Write-Ahead Log (WAL / Disk) ]                     [ Data Pages (Disk: 8KB Pages) ]
          (fsync before ACK)`,
    topics: [
      {
        title: "B+ Tree Storage Architecture & Page Layout",
        desc: "Fixed page sizes (8KB Postgres / 16KB InnoDB), slotted page structure, leaf node bidirectional linked lists, fill factors, and the mechanics of 50/50 page splits during random writes.",
        productionGotcha: "Using random UUIDv4 as primary keys causes random inserts across the entire B+ Tree, triggering constant page splits and dropping write throughput by 80% compared to sequential UUIDv7 or BIGSERIAL.",
        keyConcepts: ["Slotted page layout", "Fan-out & Tree depth (O(log_B N))", "Fill factor tuning", "B+ Tree vs B-Tree"],
      },
      {
        title: "Write-Ahead Logging (WAL) & ARIES Recovery",
        desc: "Steal/No-Force buffer management policy, Log Sequence Numbers (LSN), fsync durability barriers, checkpointing (sharp vs fuzzy), and the 3-phase ARIES recovery algorithm (Analysis, Redo, Undo).",
        productionGotcha: "Disabling synchronous_commit or delaying fsync gives massive benchmark write speeds but guarantees permanent, silent data corruption if power drops mid-flight.",
        keyConcepts: ["Steal/No-Force rule", "Log Sequence Number (LSN)", "Fuzzy checkpointing", "ARIES Redo/Undo passes"],
      },
      {
        title: "MVCC & Concurrency Control (Postgres vs MySQL)",
        desc: "Multi-Version Concurrency Control internals. Postgres tuple headers (xmin, xmax, infomasks), Heap-Only Tuples (HOT), autovacuum, and transaction ID wraparound freeze vs MySQL InnoDB Undo Logs and rollback segments.",
        productionGotcha: "Long-running read transactions prevent autovacuum from reclaiming dead tuples, causing table bloat where a 10MB table balloons to 200GB on disk, destroying index performance.",
        keyConcepts: ["xmin / xmax headers", "Vacuuming & Freeze threshold", "InnoDB Undo tablespace", "Heap-Only Tuples (HOT)"],
      },
      {
        title: "Transaction Isolation Levels & Real-World Anomalies",
        desc: "The ANSI SQL standard vs reality: Dirty Read, Non-Repeatable Read, Phantom Read, and the subtle Write Skew anomaly under Repeatable Read that requires Serializable Snapshot Isolation (SSI) or explicit locking.",
        productionGotcha: "Repeatable Read does NOT protect against Write Skew (e.g., two on-call doctors simultaneously checking if another is active and both resigning, leaving 0 on-call).",
        keyConcepts: ["Dirty reads & non-repeatable reads", "Write skew anomaly", "Serializable Snapshot Isolation (SSI)", "Pessimistic SELECT ... FOR UPDATE"],
      },
    ],
  },
  {
    step: 2,
    slug: "nosql-internals",
    title: "NoSQL Architectures & LSM-Tree Storage",
    subtitle: "LSM-trees vs B+ trees, SSTables, Bloom filters, compaction strategies, and the 4 NoSQL archetypes",
    level: "intermediate",
    estimatedHours: 22,
    whyItMatters:
      "When write traffic scales to hundreds of thousands of operations per second (metrics, event logs, chat streams), random-I/O B+ trees choke. You must understand how LSM-Trees turn random writes into blindingly fast sequential append-only writes, and how Bloom filters keep read amplification under control.",
    productionDeliverable:
      "A complete storage architecture evaluation matrix comparing RocksDB, DynamoDB, MongoDB, and Cassandra for an append-heavy streaming ingestion workload with calculated write/read amplification metrics.",
    architectureBlueprint: `[ Incoming Write ] ──► [ Write-Ahead Log (WAL on Disk) ] (Durability)
              │
              ▼
    [ MemTable (In-Memory SkipList) ]
              │ (Flush when full)
              ▼
    [ Level 0 SSTables (Sorted String Tables) ] ── (Compaction) ──► [ Level 1 SSTables ]
              │
        [ Bloom Filters ] (Check in RAM: "Is key definitely absent in this SSTable?")`,
    topics: [
      {
        title: "LSM-Tree Storage Engine (RocksDB / Cassandra)",
        desc: "MemTable (in-memory skiplist/red-black tree), WAL persistence, immutable SSTables, and the fundamental trade-off: trading read amplification and background compaction CPU for maximum sequential write throughput.",
        productionGotcha: "Compaction debt: if incoming write volume exceeds disk I/O throughput for background compaction, SSTables multiply, causing read latency to spike from 2ms to 2,000ms.",
        keyConcepts: ["MemTable flush", "SSTable immutability", "Write amplification factor", "Read amplification"],
      },
      {
        title: "Compaction Strategies & Bloom Filters",
        desc: "Size-Tiered Compaction Strategy (STCS - Cassandra write-heavy) vs Leveled Compaction Strategy (LCS - RocksDB read-heavy). Bloom filter bit arrays and hash functions to eliminate 99% of negative disk reads.",
        productionGotcha: "Size-Tiered Compaction requires up to 50% free disk space on the drive to merge SSTables; if disk usage exceeds 65%, compaction fails and the node enters read-only crash loops.",
        keyConcepts: ["Size-Tiered vs Leveled Compaction", "Bloom filter false positive math", "Tombstones & Delete markers", "Disk headroom requirements"],
      },
      {
        title: "The 4 NoSQL Archetypes & Selection Matrix",
        desc: "Key-Value (Redis, DynamoDB), Document (MongoDB), Wide-Column / Column-Family (Cassandra, ScyllaDB), and Graph (Neo4j). Deep architectural trade-offs per access pattern.",
        productionGotcha: "Attempting relational ad-hoc reporting and multiple JOIN queries on a Wide-Column store like Cassandra forces full-table token range scans that time out the entire cluster.",
        keyConcepts: ["Partition key + Clustering key", "Single-Table Design", "Document embedding vs referencing", "Index-free adjacency in Graph DBs"],
      },
      {
        title: "Distributed CAP Theorem & PACELC Realities",
        desc: "Why partition tolerance (P) is mandatory in distributed networks. PACELC theorem: If Partition, choose Availability or Consistency; Else, choose Latency or Consistency. Deep comparison of CP (HBase, Spanner, MongoDB) vs AP (Cassandra, DynamoDB).",
        productionGotcha: "Believing a database is 'purely CP or AP': most modern databases allow per-query consistency overrides (e.g. Cassandra QUORUM vs ONE; MongoDB w:1 vs w:majority).",
        keyConcepts: ["CAP trade-offs", "PACELC theorem", "Linearizability", "Tunable consistency"],
      },
    ],
  },
  {
    step: 3,
    slug: "distributed-databases",
    title: "Distributed Data, Sharding & Consensus",
    subtitle: "Consistent hashing, virtual nodes, quorum consensus, 2PC vs Sagas, and distributed NewSQL (Spanner / CockroachDB)",
    level: "advanced",
    estimatedHours: 26,
    whyItMatters:
      "When a single node cannot fit the data volume or write throughput, you must distribute data across nodes and regions. You must master how consistent hashing prevents massive resharding rebalances, how Paxos/Raft consensus guarantees leader election, and how to execute transactions without distributed deadlocks.",
    productionDeliverable:
      "A distributed database partitioning design for a multi-region fintech platform with consistent hashing ring topology, quorum read/write configuration, and a Saga orchestrator with compensating transactions.",
    architectureBlueprint: `          [ Distributed Client ]
                    │
                    ├── W=QUORUM (Write to 2 of 3 Replicas)
                    └── R=QUORUM (Read from 2 of 3 Replicas)
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
[ Replica Node 1 ] [ Replica Node 2 ] [ Replica Node 3 ]
(Leader / Raft)    (Follower)        (Follower)
      │
      └── Consensus: Raft Log Replication over TLS`,
    topics: [
      {
        title: "Consistent Hashing & Virtual Nodes",
        desc: "Hash rings (SHA-1/MurmurHash), token assignments, and using virtual nodes (vnodes) to prevent hot partitions and ensure non-uniform hardware gets proportional token allocation during cluster scale-out.",
        productionGotcha: "Without virtual nodes, adding a single new physical node only relieves the single node immediately behind it on the ring, leaving 90% of the cluster unchanged.",
        keyConcepts: ["Hash ring token space (0 to 2^64-1)", "Virtual nodes (vnodes)", "Rebalance replication", "Consistent hash lookup O(log N)"],
      },
      {
        title: "Quorum Consensus & Anti-Entropy Mechanics",
        desc: "The Quorum formula: W + R > N for strong consistency. What happens when W + R <= N (stale reads). Background reconciliation: Hinted Handoff, Read Repair, and Merkle tree anti-entropy background synchronization.",
        productionGotcha: "Relying on Read Repair for data consistency under low read traffic leaves silently corrupted or un-synced replicas for months until an active read touches that partition.",
        keyConcepts: ["Quorum equation W+R>N", "Hinted handoff buffers", "Read repair on mismatch", "Merkle tree hashing"],
      },
      {
        title: "Distributed Consensus: Paxos & Raft",
        desc: "State machine replication, leader election, log replication terms, split-vote resolution with randomized election timeouts, and safety invariants in Raft and Multi-Paxos.",
        productionGotcha: "Network split-brain: if a cluster partition isolates 2 nodes from 3 nodes in a 5-node cluster, the 2-node partition cannot achieve quorum (3) and must reject all write requests.",
        keyConcepts: ["Raft leader heartbeats", "Term numbers & Log indices", "Split-brain prevention", "Quorum majority floor(N/2)+1"],
      },
      {
        title: "Distributed Transactions: 2PC vs Sagas & Outbox",
        desc: "Two-Phase Commit (Prepare -> Commit) and why it blocks when the coordinator crashes. The Saga Pattern (Choreography vs Orchestration) with compensating transactions. The Transactional Outbox pattern with Debezium CDC.",
        productionGotcha: "Using 2PC across independent microservices creates an availability anti-pattern: the entire system availability becomes the product of every single service's availability.",
        keyConcepts: ["Two-Phase Commit (2PC) blocking", "Saga Orchestrator", "Compensating transactions", "Transactional Outbox with Kafka CDC"],
      },
    ],
  },
  {
    step: 4,
    slug: "olap-and-scaling",
    title: "OLAP, Columnar Storage & High-Scale Scaling",
    subtitle: "Column-oriented storage (ClickHouse / Parquet), vectorization, LSM vs B-Tree scaling, and global NewSQL",
    level: "advanced",
    estimatedHours: 20,
    whyItMatters:
      "Enterprise systems separate transactional workloads (OLTP: low-latency single-row reads and writes) from analytical workloads (OLAP: scanning billions of rows to compute aggregates, revenue forecasts, and analytics). Running analytical GROUP BY queries on an OLTP database causes immediate database outages.",
    productionDeliverable:
      "An end-to-end Change Data Capture (CDC) streaming pipeline from an OLTP PostgreSQL database to an OLAP ClickHouse / Snowflake data warehouse with columnar compression benchmarks.",
    architectureBlueprint: `[ OLTP: PostgreSQL ] (Transactional: Row-oriented, ACID)
          │
          ▼ (WAL Streaming via Debezium CDC)
  [ Apache Kafka Message Bus ]
          │
          ▼ (Batch Micro-Ingest)
[ OLAP: ClickHouse / Parquet ] (Analytical: Columnar, SIMD Vectorized, RLE Encoded)`,
    topics: [
      {
        title: "Row-Oriented vs Column-Oriented Storage Anatomy",
        desc: "How disk blocks store data. Row store: all columns for record 1, then record 2. Column store: all values for column 'age', then all values for column 'country'. SIMD vectorization and compression.",
        productionGotcha: "Running SELECT * on a columnar database destroys its performance because it forces the disk engine to seek and assemble every disparate column block from disk.",
        keyConcepts: ["Columnar layout", "Run-Length Encoding (RLE)", "Dictionary encoding", "SIMD vector instruction processing"],
      },
      {
        title: "Google Spanner & TrueTime Architecture",
        desc: "How Google achieved global external consistency (strict serializability) across distributed data centers using atomic clocks and GPS receivers with bounded uncertainty (epsilon).",
        productionGotcha: "Assuming NTP (Network Time Protocol) is sufficient for distributed ordering; NTP clock drift of 100ms can cause a banking system to process a withdrawal before a deposit.",
        keyConcepts: ["TrueTime API (earliest, latest)", "Bounded clock uncertainty (epsilon)", "Commit wait rule", "Two-Phase Locking + Multi-Paxos"],
      },
      {
        title: "Sharding Patterns & Zero-Downtime Migrations",
        desc: "Range-based vs Hash-based vs Lookup sharding. The 4-phase zero-downtime resharding protocol: Dual Writes -> Backfill -> Shadow Validation -> Primary Cutover.",
        productionGotcha: "Flipping primary database traffic to a new sharded cluster before backfill verification is 100% complete risks permanent data loss with zero rollback capability.",
        keyConcepts: ["Dual write patterns", "Backfill reconciliation scripts", "Shadow read comparisons", "Cutover routing proxies"],
      },
      {
        title: "Caching Topologies & Cache Invalidation",
        desc: "Cache-Aside vs Write-Through vs Write-Behind (Write-Back). Solving the Thundering Herd / Cache Stampede problem with mutex locks and probabilistic early expiration (XFetch).",
        productionGotcha: "Write-Behind caching buffers writes in Redis and acknowledges before DB write: if the Redis node crashes before flushing, customer updates or payments are lost forever.",
        keyConcepts: ["Cache stampede (XFetch)", "Write-through vs Cache-aside", "Cache coherence", "Redis sentinel & cluster topologies"],
      },
    ],
  },
];

export const DB_TOPIC_QA_LIBRARY: DbTopicQA[] = [
  {
    id: "db-qa-btree-vs-lsm",
    moduleStep: 1,
    moduleTitle: "Relational Database Internals",
    category: "Storage Engines",
    question: "Deep Dive: B+ Tree vs LSM-Tree Storage Engines. Why does PostgreSQL/MySQL use B+ Trees while Cassandra/RocksDB uses LSM-Trees? Derive write and read amplification.",
    difficulty: "H",
    summary:
      "B+ Trees optimize for fast random reads with in-place updates at the expense of random write I/O. LSM-Trees optimize for maximum write throughput by turning writes into sequential appends, paying the cost in read amplification and background compaction.",
    fullAnswer: `### 1. Architectural Anatomy

#### B+ Tree (Postgres InnoDB / SQLite)
- **Structure:** Balanced tree where every leaf node is at the identical depth. Internal nodes store keys and page pointers; leaf nodes store actual row data (clustered) or tuple pointers and are linked sequentially in a doubly linked list.
- **Update Mechanism:** In-place updates. Modifying a row requires reading the 8KB/16KB page into memory, modifying the row, and writing the entire 8KB page back to disk.
- **Amplification:**
  - **Write Amplification (WA):** High. Modifying a 20-byte column forces writing an entire 8KB/16KB page to disk, plus a WAL record ($WA \\approx 8192 / 20 \\approx 400x$).
  - **Read Amplification (RA):** Low. Exact point lookups take $O(\\log_B N)$ page reads (typically 3 to 4 disk reads for billions of rows; 1 read if pages are cached in the buffer pool).

#### LSM-Tree (RocksDB, Cassandra, ScyllaDB, Bigtable)
- **Structure:** Two-tier storage. Incoming writes go to an in-memory **MemTable** (SkipList) and an append-only WAL. When the MemTable reaches 64MB, it is flushed to disk as an immutable **SSTable** (Sorted String Table).
- **Update Mechanism:** Append-only. Updates and deletes do not touch existing SSTables on disk; an update is simply a new key written at a higher timestamp, and a delete is a special marker called a **Tombstone**.
- **Amplification:**
  - **Write Amplification (WA):** Moderate to Low during ingest (pure sequential append), but increases during background compaction (typically 10x to 30x).
  - **Read Amplification (RA):** High. A point read must check the MemTable and potentially multiple SSTables on disk until the newest version of the key is found ($RA > 1$). Mitigated by **Bloom Filters** in RAM.

### 2. Comparison Matrix

| Property | B+ Tree (PostgreSQL / MySQL) | LSM-Tree (RocksDB / Cassandra) |
| :--- | :--- | :--- |
| **Write Pattern** | In-place random I/O (page rewrites) | Sequential append-only I/O |
| **Write Throughput** | Lower (limited by random disk IOPS) | Blindingly fast (saturates sequential I/O) |
| **Point Read Latency** | Ultra-low (predictable $O(\\log N)$) | Variable (checked via Bloom filters + multi-SSTable) |
| **Range Scan** | Extremely fast (traverse leaf linked list) | Slower (multi-way merge sort across SSTables) |
| **Concurrency** | Page-level latches / locks | Lock-free MemTable (SkipList) + Immutable SSTables |
| **Ideal Workload** | Read-heavy, transactional OLTP (Banking, E-commerce) | Write-heavy, event logging, metrics, chat streams |`,
    code: {
      lang: "sql",
      snippet: `-- Inspecting B+ Tree Index Depth and Page Stats in PostgreSQL
SELECT 
    indexrelid::regclass AS index_name,
    level AS tree_depth,
    root_blkno,
    internal_pages,
    leaf_pages,
    empty_pages,
    deleted_pages
FROM pgstatindex('users_pkey');`,
    },
    followUps: [
      {
        q: "What is compaction debt in an LSM-tree and how does it manifest in production?",
        a: "If incoming write throughput exceeds the disk subsystem's ability to run background compactions, uncompacted SSTables accumulate at Level 0. Read latency explodes because queries must check dozens of overlapping SSTables, and the engine eventually throttles or stalls incoming writes entirely to let compaction catch up.",
      },
    ],
  },
  {
    id: "db-qa-mvcc-internals",
    moduleStep: 1,
    moduleTitle: "Relational Database Internals",
    category: "Concurrency & Locking",
    question: "How does PostgreSQL implement Multi-Version Concurrency Control (MVCC) at the tuple level, and what causes Table Bloat and Transaction ID Wraparound?",
    difficulty: "H",
    summary:
      "PostgreSQL implements MVCC by storing multiple physical versions of rows directly in the data table (heap). Each tuple header contains xmin and xmax transaction IDs. Outdated versions remain until autovacuum reclaims them.",
    fullAnswer: `### 1. Tuple Header Architecture
In PostgreSQL, updating a row never overwrites data in-place. Instead, it inserts a brand-new row version (tuple) into the page and marks the old row version as expired.

Every tuple contains a 23-byte header with two critical fields:
- \`xmin\`: The transaction ID ($XID$) that created / inserted this tuple.
- \`xmax\`: The transaction ID ($XID$) that deleted or superseded this tuple (0 if active).

\`\`\`
[ Initial INSERT (Transaction 100) ]
(tuple 1): [xmin=100, xmax=0, data="Alice", balance=500]

[ UPDATE balance=600 (Transaction 105) ]
(tuple 1): [xmin=100, xmax=105, data="Alice", balance=500]  <-- Dead tuple
(tuple 2): [xmin=105, xmax=0,   data="Alice", balance=600]  <-- Active tuple
\`\`\`

### 2. Visibility Rules
When a query executes under \`Read Committed\` or \`Repeatable Read\`, PostgreSQL takes a **Snapshot**:
- Any transaction with $XID < \\text{Snapshot.xmin}$ is committed and visible.
- Any transaction with $XID > \\text{Snapshot.xmax}$ was in-flight or future, hence invisible.
- Any transaction in the active list is ignored.

### 3. The Root Cause of Table Bloat
When rows are updated or deleted, dead tuples remain on the disk page so active concurrent transactions can still read their historical snapshot.
- **Autovacuum's Job:** Scans pages, identifies dead tuples where $\\text{xmax} < \\text{oldest active transaction XID}$, and marks that page space as reusable.
- **The Failure Mode:** If an uncommitted developer query or analytics worker opens a transaction and stays idle for 8 hours (\`idle in transaction\`), autovacuum CANNOT reclaim ANY dead tuple created after that transaction started. The table and its B+ tree indexes balloon in size.

### 4. Transaction ID (XID) Wraparound
PostgreSQL transaction IDs are 32-bit integers (max $\\approx 4.2$ billion transactions).
- Half the space (2 billion) is considered 'past', and half is considered 'future'.
- If a database runs for years without freezing old tuples and approaches the 2-billion transaction horizon, it faces **XID Wraparound**, where old committed data would suddenly appear in the 'future' and vanish!
- **Protection:** Postgres triggers an aggressive emergency autovacuum freeze (\`VACUUM FREEZE\`). If ignored, PostgreSQL forcibly shuts down into single-user read-only mode to prevent silent data loss.`,
    code: {
      lang: "sql",
      snippet: `-- Checking for long-running idle transactions causing MVCC bloat
SELECT 
    pid, 
    now() - state_change AS idle_duration, 
    query, 
    state 
FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
ORDER BY idle_duration DESC;`,
    },
    followUps: [
      {
        q: "How does Heap-Only Tuples (HOT) optimization reduce B+ tree index bloat in Postgres?",
        a: "Normally, inserting a new tuple requires updating every index on the table to point to the new physical tuple offset. With HOT, if an update does not modify indexed columns and the new tuple fits inside the same 8KB page, Postgres creates an internal pointer from the old tuple to the new tuple, eliminating the need to modify any B+ tree indexes.",
      },
    ],
  },
  {
    id: "db-qa-dynamodb-single-table",
    moduleStep: 2,
    moduleTitle: "NoSQL Architectures",
    category: "NoSQL Architecture",
    question: "Mastering DynamoDB Single-Table Design: How do you model 1-to-N and N-to-N relationships using overloaded Partition Keys (PK) and Sort Keys (SK)?",
    difficulty: "M",
    summary:
      "DynamoDB does not support JOINs. Single-Table Design places multiple distinct entity types (Customers, Orders, OrderItems) into a single physical table, pre-joining them into adjacent item collections using generic PK and SK attributes.",
    fullAnswer: `### 1. The Philosophy of Single-Table Design
In relational databases, you normalize data into distinct tables (\`users\`, \`orders\`, \`order_items\`) and join them at query time.
In DynamoDB:
- Every table has provisioned RCU/WCU throughput overhead.
- Cross-table queries require multiple network roundtrips from your application.
- Single-Table Design models all relational access patterns in **one single table** by overloading generic string keys: \`PK\` (Partition Key) and \`SK\` (Sort Key).

### 2. Concrete E-Commerce Schema Example

| PK (Partition Key) | SK (Sort Key) | Type | Attributes (Payload) |
| :--- | :--- | :--- | :--- |
| \`USER#1001\` | \`PROFILE\` | User | Name: "Alice", Email: "alice@acme.com" |
| \`USER#1001\` | \`ORDER#ORD-901\` | Order | Date: "2026-10-23", Total: $149.00, Status: "SHIPPED" |
| \`USER#1001\` | \`ORDER#ORD-902\` | Order | Date: "2026-10-24", Total: $89.00, Status: "PENDING" |
| \`ORDER#ORD-901\` | \`METADATA\` | Order | CustomerId: "1001", ShippingAddr: "123 Main St" |
| \`ORDER#ORD-901\` | \`ITEM#SKU-77\` | Item | Title: "Mechanical Keyboard", Qty: 1, Price: $149.00 |

### 3. Fulfilling Access Patterns in a Single Query
1. **Query: Fetch User Profile and all recent Orders in 1 roundtrip:**
   \`\`\`
   KeyConditionExpression: PK = "USER#1001" AND SK BEGINS_WITH "ORDER#"
   \`\`\`
   DynamoDB scans the contiguous B-tree items on disk and returns the user's order history in 3ms.

2. **Query: Fetch an Order and all its Line Items in 1 roundtrip:**
   \`\`\`
   KeyConditionExpression: PK = "ORDER#ORD-901"
   \`\`\`
   Returns the Order Metadata record plus all \`ITEM#\` records in a single partition fetch.

3. **Inverting the relationship with a Global Secondary Index (GSI):**
   - Invert: \`GSI1-PK = SK\` and \`GSI1-SK = PK\`
   - Query: *"Find which user owns Order ORD-901"* -> Query \`GSI1\` where \`GSI1-PK = "ORDER#ORD-901"\`.`,
    code: {
      lang: "python",
      snippet: `import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("EnterpriseStore")

# Fetch user profile and all orders in a single sub-5ms query
response = table.query(
    KeyConditionExpression=Key("PK").eq("USER#1001") & Key("SK").begins_with("ORDER#")
)
orders = response.get("Items", [])`,
    },
    followUps: [
      {
        q: "What is a hot partition in DynamoDB, and what is the Write Sharding pattern to resolve it?",
        a: "A hot partition occurs when a disproportionate volume of reads or writes targets a single partition key (e.g., PK='CAMPAIGN#BLACK_FRIDAY'), exceeding the 1,000 WCU or 3,000 RCU per-partition limit. The solution is Write Sharding: append a random suffix to the PK (e.g. PK='CAMPAIGN#BLACK_FRIDAY#' + random_int(0, 19)), distributing writes across 20 distinct physical partitions, and parallel-querying all 20 when reading.",
      },
    ],
  },
  {
    id: "db-qa-quorum-math",
    moduleStep: 3,
    moduleTitle: "Distributed Data, Sharding & Consensus",
    category: "Distributed Systems",
    question: "Derive the Quorum Consensus Equation (W + R > N). What subtle consistency bugs occur if W + R <= N, and what is Sloppy Quorum with Hinted Handoff?",
    difficulty: "H",
    summary:
      "Quorum consensus uses the Pigeonhole Principle: if the write set W and the read set R overlap on at least one replica node, the reader is mathematically guaranteed to observe the latest write. A sloppy quorum trades strong consistency for write availability during network partitions.",
    fullAnswer: `### 1. The Mathematical Foundation: Pigeonhole Principle
In a distributed database with $N$ total replicas for each partition (e.g., $N=3$ or $N=5$):
- $W$ = Number of replicas that must acknowledge a write before returning success.
- $R$ = Number of replicas that must respond to a read before returning the result.

\`\`\`
Replicas: [ Node A, Node B, Node C ]  (N = 3)

Write (W = 2): Writes acknowledge on [ Node A, Node B ] with Timestamp T2
Read  (R = 2): Reads query [ Node B, Node C ]

Intersection: Node B is in BOTH the write set and read set!
Node B returns value with T2. Node C returns older value T1.
Client compares timestamps (T2 > T1) and resolves the latest value.
\`\`\`

**Condition for Strong Consistency:**
$$\\mathbf{W + R > N}$$
If $W=2$ and $R=2$ with $N=3$: $2 + 2 = 4 > 3$. Strict consistency holds.

### 2. What Happens When $W + R \\le N$? (Weak Consistency)
If you configure $N=3, W=1, R=2$ ($1 + 2 = 3 \\ngtr 3$):
- Client 1 writes to Node A ($W=1$). Node A is updated with $T2$.
- Client 2 reads from Node B and Node C ($R=2$).
- Neither Node B nor Node C received the write yet!
- **Result:** Client 2 receives stale data $T1$, violating Read-Your-Own-Writes consistency.

### 3. Strict Quorum vs Sloppy Quorum (with Hinted Handoff)
- **Strict Quorum:** A write MUST succeed on $W$ of the $N$ natural designated replica nodes on the hash ring. If 2 of the 3 replica nodes are offline due to a network partition, the write fails with a timeout.
- **Sloppy Quorum (AP Mode in Cassandra/Dynamo):** If the natural replica nodes are unreachable, the coordinator node writes the data to an arbitrary healthy node outside the natural replica set.
- **Hinted Handoff:** The temporary node stores the write in a special local buffer marked with a "hint" indicating the true intended destination. Once network connectivity is restored, the temporary node hands the write back to the true replica.
- **Critical Caveat:** Sloppy Quorum guarantees high write availability, but during a partition, $W + R > N$ does NOT guarantee strict consistency because the read set $R$ may query the natural replicas before the hinted handoff arrives.`,
    code: {
      lang: "markdown",
      snippet: `Common Quorum Trade-off Profiles (N = 3):
- W = 3, R = 1: Ultra-fast reads, expensive slow writes (write fails if ANY node down).
- W = 1, R = 3: Ultra-fast writes, slower reads.
- W = 2, R = 2 (QUORUM): Balanced, tolerates 1 node failure for both reads and writes.`,
    },
    followUps: [
      {
        q: "Can concurrent writes with identical timestamps cause data loss under Last-Write-Wins (LWW)?",
        a: "Yes. In systems relying on NTP wall-clock timestamps for LWW conflict resolution (like Cassandra), clock skew between servers can cause a write that physically occurred later to be overwritten by an earlier write with a drifted future clock. Vector clocks or version vectors are required to detect true causal concurrency.",
      },
    ],
  },
  {
    id: "db-qa-write-skew-phantom",
    moduleStep: 1,
    moduleTitle: "Relational Database Internals",
    category: "Concurrency & Locking",
    question: "Explain the Write Skew anomaly and Phantom Reads. Walk through a hospital on-call doctor failure scenario under Repeatable Read isolation.",
    difficulty: "H",
    summary:
      "Write Skew occurs when two concurrent transactions read overlapping data, make an independent decision based on that data, and write to disjoint rows that violate a shared business invariant. Repeatable Read prevents dirty and non-repeatable reads, but cannot prevent Write Skew.",
    fullAnswer: `### 1. The Real-World Failure Scenario: Hospital On-Call System
**The Business Invariant:**
*"At all times, at least one doctor must remain on call in the emergency department."*

**The Database State:**
Both Dr. Alice and Dr. Bob are currently on call (\`on_call = TRUE\`).

\`\`\`
Doctor Table:
| id | name  | on_call |
| 1  | Alice | TRUE    |
| 2  | Bob   | TRUE    |
\`\`\`

### 2. The Execution Trace under Repeatable Read Isolation

1. **Transaction 1 (Dr. Alice wants to take leave):**
   \`\`\`sql
   BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
   -- Check if at least 2 doctors are currently on call
   SELECT count(*) FROM doctors WHERE on_call = TRUE; -- Returns: 2
   -- Since 2 > 1, Alice feels safe to take leave
   UPDATE doctors SET on_call = FALSE WHERE id = 1;
   \`\`\`

2. **Transaction 2 (Dr. Bob concurrently wants to take leave):**
   \`\`\`sql
   BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
   -- Check if at least 2 doctors are currently on call
   SELECT count(*) FROM doctors WHERE on_call = TRUE; -- Returns: 2
   -- Since 2 > 1, Bob also feels safe to take leave
   UPDATE doctors SET on_call = FALSE WHERE id = 2;
   \`\`\`

3. **Both Commit Simultaneously:**
   \`\`\`sql
   -- Tx 1: COMMIT;
   -- Tx 2: COMMIT;
   \`\`\`

### 3. The Catastrophic Result
- Alice updated Row 1. Bob updated Row 2.
- Since they updated **different rows**, standard row-level lock managers detect **zero write conflict**!
- Both transactions commit successfully.
- **Invariant Violated:** \`SELECT count(*) FROM doctors WHERE on_call = TRUE\` now returns **0**! The hospital emergency room has zero doctors on call.

### 4. How to Prevent Write Skew in Production

#### Solution A: Explicit Materialized Row Locking
Lock all matching rows before checking the count:
\`\`\`sql
BEGIN;
-- Explicitly lock all active doctors
SELECT * FROM doctors WHERE on_call = TRUE FOR UPDATE;
-- Now Tx 2 must wait until Tx 1 commits or rolls back
\`\`\`

#### Solution B: True Serializable Isolation (SSI)
Use \`SERIALIZABLE\` isolation. Modern PostgreSQL uses **Serializable Snapshot Isolation (SSI)**, which tracks read-write dependencies (SIREAD locks) in memory. It detects the anti-dependency cycle (rw-antidependency) between Tx 1 and Tx 2 and forcibly aborts one of them with:
\`ERROR: could not serialize access due to read/write dependencies among transactions\`.`,
    code: {
      lang: "sql",
      snippet: `-- Testing SSI conflict detection in PostgreSQL
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM doctors WHERE on_call = TRUE;
-- If another concurrent transaction commits an update touching that predicate:
UPDATE doctors SET on_call = FALSE WHERE id = 1;
COMMIT; -- Throws serialization_failure (SQLSTATE 40001) if concurrent conflict detected`,
    },
    followUps: [
      {
        q: "What is a Phantom Read and how does it differ from a Non-Repeatable Read?",
        a: "A Non-Repeatable Read occurs when Tx 1 reads a specific existing row, Tx 2 updates or deletes that same row and commits, and Tx 1 re-reads the row to find its values changed. A Phantom Read occurs when Tx 1 executes a range query (e.g. 'WHERE age > 30'), Tx 2 inserts a brand-new row matching that range condition and commits, and Tx 1 re-runs the range query to find a new 'phantom' row that did not exist previously.",
      },
    ],
  },
];

export const DB_COMPANY_TRACKS: DbCompanyTrack[] = [
  {
    id: "google-distributed-db",
    company: "Google",
    companySlug: "google",
    roleTitle: "Staff Systems / Database Infrastructure Engineer",
    databaseTech: "Google Spanner, Bigtable, Colossus",
    roundsSummary: "Distributed Systems Architecture + Storage Engine Internals + Concurrency Control + L7 Coding",
    barRaiserTenet:
      "Global Scale & TrueTime Consistency: Google probes whether you understand atomic physical limits of distributed consensus, global clock skew, and multi-version storage engines across worldwide datacenters.",
    evaluationRubric: [
      {
        category: "Storage Engine Internals",
        expectation: "Deep mathematical understanding of B+ trees, SSTables, Bloom filters, and compaction amplification.",
      },
      {
        category: "Distributed Consensus & Clocks",
        expectation: "Fluency in Paxos log replication, leader leasing, and TrueTime bounded uncertainty intervals.",
      },
      {
        category: "Global Transaction Coordination",
        expectation: "Combines 2PC and Multi-Paxos without creating distributed deadlock or unresolvable latencies.",
      },
    ],
    questions: [
      {
        id: "google-spanner-truetime",
        title: "Google Spanner Architecture: TrueTime & Strict Serializability",
        round: "Round 1: Distributed Systems Core",
        type: "Distributed Systems",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you explain how Google Spanner achieves external consistency (strict serializability) across globally distributed datacenters without global read locks using TrueTime API?",
        scenario:
          "Design a globally distributed database that spans 3 continents (US, Europe, Asia) and supports multi-row, multi-table ACID transactions with strict serializability. Read-only transactions must execute with zero locks and zero network roundtrips to remote datacenters.",
        recommendedFramework: "1) Hardware Infrastructure (Atomic Clocks + GPS) -> 2) TrueTime API specification [earliest, latest] -> 3) Commit-Wait Rule -> 4) Lock-Free Snapshot Reads.",
        solutionBlueprint: `### 1. The TrueTime Hardware & API Layer
Standard NTP protocol has clock drift of up to 100ms–250ms over the internet.
Google deployed physical atomic clocks (rubidium oscillators) and GPS receivers in every datacenter.
- The **TrueTime API** explicitly exposes clock uncertainty:
  \`\`\`
  TT.now() -> [t_earliest, t_latest]
  \`\`\`
  Where the true physical time is guaranteed to be within the interval:
  $$\\text{uncertainty } \\epsilon = \\frac{t_{\\text{latest}} - t_{\\text{earliest}}}{2} \\le 7\\text{ms}$$

### 2. The Commit-Wait Rule for Strict Serializability
To guarantee that if Transaction T2 starts after Transaction T1 commits, T2 is assigned a higher timestamp ($s_2 > s_1$):
1. **Acquire Locks:** T1 acquires two-phase write locks on its local Paxos leader.
2. **Assign Timestamp:** Leader samples TrueTime: $s_1 = \\text{TT.now().latest}$.
3. **Commit Wait:** The leader deliberately DELAYS acknowledging the commit to the client until:
   $$\\text{TT.now().earliest} > s_1$$
4. **Result:** The leader waits for at least $2\\epsilon$ (approx. 8–14ms) before releasing locks. By the time any client in the world learns T1 committed, the physical time is guaranteed to have passed $s_1$.

### 3. Lock-Free Snapshot Reads Globally
Because every write transaction has an exact, globally ordered timestamp:
- A client in Tokyo reading data at timestamp $T_{\\text{read}}$ reads locally from its local Tokyo read replica at that exact snapshot timestamp.
- **Zero locks, zero cross-continent network roundtrips!**`,
        tradeoffsAndTraps: [
          "Trap: Handwaving that TrueTime 'makes all clocks perfectly synchronized'. Clocks are NEVER perfectly synchronized; TrueTime's breakthrough is exposing bounded uncertainty so the system can wait out the uncertainty window.",
        ],
        followUpQuestions: [
          {
            q: "What happens if a GPS receiver antenna fails or an atomic clock drifts beyond 7ms?",
            a: "If TrueTime uncertainty epsilon exceeds a critical threshold (e.g. 100ms), Spanner automatically slows down commit-wait durations to match the wider epsilon. If uncertainty grows too large, the node takes itself out of service to prevent consistency violations.",
          },
        ],
      },
    ],
  },
  {
    id: "aws-dynamodb-aurora",
    company: "Amazon / AWS",
    companySlug: "amazon",
    roleTitle: "Principal Distributed Database Engineer",
    databaseTech: "Amazon DynamoDB, Amazon Aurora, S3",
    roundsSummary: "NoSQL Scale Architecture + Distributed Storage Engine + AWS LP Behavioral + Deep Failure Modes",
    barRaiserTenet:
      "Separation of Compute and Storage at Scale: AWS assesses whether you understand how offloading logging and replication to a dedicated multi-tenant storage fleet eliminates traditional database bottlenecks.",
    evaluationRubric: [
      {
        category: "Storage Disaggregation",
        expectation: "Articulates why 'The Log is the Database' in Amazon Aurora and how it eliminates disk write amplification.",
      },
      {
        category: "NoSQL Schema Modeling",
        expectation: "Flawless Single-Table DynamoDB modeling with zero full-table scans.",
      },
      {
        category: "High Availability & Blast Radius",
        expectation: "Designs systems where individual node or Availability Zone (AZ) loss causes zero customer downtime.",
      },
    ],
    questions: [
      {
        id: "aws-aurora-storage-architecture",
        title: "Amazon Aurora: Why 'The Log is the Database' Outperforms Traditional RDS",
        round: "Round 1: Storage Architecture Deep Dive",
        type: "RDBMS Internals",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you explain why traditional MySQL/PostgreSQL replication suffers from network and disk write amplification, and how Aurora's log-structured distributed storage layer achieves 5x throughput?",
        scenario:
          "Explain the complete write path difference between a standard multi-AZ PostgreSQL deployment and Amazon Aurora PostgreSQL. How does Aurora replicate data across 3 Availability Zones (6 copies) with lower latency and higher durability than a standard primary-standby replica pair?",
        recommendedFramework: "1) Traditional RDS write amplification (WAL + Data page + Mirroring) -> 2) Aurora 'The Log is the Database' paradigm -> 3) 4/6 Quorum Write Model -> 4) Read replica asynchronous catchup via log stream.",
        solutionBlueprint: `### 1. The Traditional Database Write Bottleneck (RDS Multi-AZ)
In standard PostgreSQL/MySQL across 2 Availability Zones:
When a transaction commits:
1. Write to WAL on Primary disk.
2. Write dirty 8KB/16KB data pages to Primary disk.
3. Synchronously stream WAL across network to Standby replica in AZ 2.
4. Standby writes to its own WAL and dirty pages.
5. If doublewrite buffer is enabled, write data pages twice.
**Result:** Gigantic network packet volume, massive disk IOPS contention, and slow commit latency.

### 2. The Aurora Paradigm: "The Log is the Database"
Aurora separates stateless SQL Compute nodes from a distributed, scale-out **Storage Fleet**:
- **Only WAL Records cross the network:** The compute node NEVER writes dirty 8KB data pages across the network. It sends only lightweight redo log records!
- **Storage Fleet Parallelism:** The storage layer is divided into 10GB protection groups across hundreds of storage nodes.
- **Background Page Materialization:** The storage nodes themselves apply redo log records asynchronously in background threads to synthesize data pages on demand.

\`\`\`
[ Aurora SQL Compute Engine ]
              │
              ├── Redo Log Record Only (Tiny Payload, Zero 8KB Page Writes)
              ▼
    [ Distributed Storage Fleet (3 AZs, 6 Replicas) ]
    AZ 1: [ Node 1 ] [ Node 2 ]
    AZ 2: [ Node 3 ] [ Node 4 ]
    AZ 3: [ Node 5 ] [ Node 6 ]
              │
              └── Quorum: Write succeeds once 4 of 6 nodes ACK (Tolerates 1 full AZ failure + 1 disk failure!)
\`\`\``,
        tradeoffsAndTraps: [
          "Trap: Believing Aurora read replicas query the primary node for updates. Aurora read replicas share the EXACT SAME underlying storage fleet; they simply read the redo log stream from the storage fleet to update their in-memory buffer pool.",
        ],
        followUpQuestions: [
          {
            q: "How does Aurora tolerate a complete Availability Zone loss without dropping write availability?",
            a: "Aurora uses a 4-of-6 write quorum. If AZ 3 completely loses power (losing 2 copies), 4 storage nodes across AZ 1 and AZ 2 remain healthy, satisfying the quorum requirement and allowing writes to continue without pause.",
          },
        ],
      },
    ],
  },
  {
    id: "stripe-fintech-db",
    company: "Stripe",
    companySlug: "stripe",
    roleTitle: "Staff Backend / Infrastructure Engineer (Ledger Core)",
    databaseTech: "PostgreSQL, Redis, Sorbet/Ruby, Java",
    roundsSummary: "Data Architecture & Concurrency + API Idempotency + Distributed Transactional Consistency + Live Debugging",
    barRaiserTenet:
      "Financial Correctness & Idempotent Concurrency: Stripe engineers must prove code cannot double-charge, drop money under network timeouts, or deadlock under concurrent authorization requests.",
    evaluationRubric: [
      {
        category: "Financial Ledger Modeling",
        expectation: "Implements strict double-entry bookkeeping with immutable credit/debit entries.",
      },
      {
        category: "Concurrency & Lock Management",
        expectation: "Handles high-concurrency wallet updates without deadlocks or race conditions.",
      },
      {
        category: "Idempotency Architecture",
        expectation: "Guarantees zero duplicate side-effects on network retries using atomic lock tokens.",
      },
    ],
    questions: [
      {
        id: "stripe-double-entry-ledger",
        title: "Design a High-Throughput Double-Entry Ledger System with Zero Balance Drift",
        round: "Round 1: Core Financial Architecture",
        type: "Concurrency & Locking",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you design a financial transaction ledger that guarantees zero balance drift, prevents concurrent double-spending on digital wallets, and eliminates deadlocks?",
        scenario:
          "Design the database schema and transaction execution protocol for Stripe's core money movement engine. Users transfer funds between accounts. The system must support 10,000 transfers/sec, guarantee that sum(credits) == sum(debits) at all times, and prevent deadlocks when User A sends money to User B while User B simultaneously sends money to User A.",
        recommendedFramework: "1) Double-Entry Bookkeeping Principles -> 2) Immutable Ledger Entries (No in-place updates) -> 3) Consistent Lock Acquisition Order -> 4) Idempotency Token Pattern.",
        solutionBlueprint: `### 1. Core Principle: Immutable Double-Entry Ledger
Never store account balances as an editable single column (\`UPDATE accounts SET balance = balance - 100\`).
Every financial movement consists of an immutable **Transaction** containing at least two **Entries**:
- Exactly one Debit and one Credit.
- Constraint: $\\sum(\\text{amount}) == 0$.

\`\`\`sql
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY,
    transaction_id UUID REFERENCES ledger_transactions(id),
    account_id UUID NOT NULL,
    amount_cents BIGINT NOT NULL, -- Negative for debit, Positive for credit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
\`\`\`

### 2. Preventing Deadlocks: Consistent Resource Ordering
If User A sends $50 to User B while User B sends $30 to User A:
- Tx 1 locks User A, attempts to lock User B.
- Tx 2 locks User B, attempts to lock User A.
- **Deadlock!** The database detects a lock cycle and aborts one transaction.

**The Fix: Strict Key Sorting Before Lock Acquisition**
Always acquire pessimistic row locks in deterministic alphabetical / numerical order of the Account IDs:
\`\`\`python
first_id, second_id = sorted([from_account_id, to_account_id])
# Locks are always acquired in identical order across all concurrent threads!
db.execute("SELECT * FROM accounts WHERE id = :id FOR UPDATE", id=first_id)
db.execute("SELECT * FROM accounts WHERE id = :id FOR UPDATE", id=second_id)
\`\`\``,
        tradeoffsAndTraps: [
          "Trap: Storing money as FLOAT or DOUBLE. Floating point IEEE 754 rounding errors (0.1 + 0.2 = 0.30000000000000004) cause massive discrepancies in financial ledgers. Always store monetary amounts as 64-bit BIGINT integers representing minor units (cents, paise).",
        ],
        followUpQuestions: [
          {
            q: "How do you calculate account balance quickly if all rows are append-only ledger entries?",
            a: "Maintain a periodic Account Snapshot table (e.g. nightly or hourly balance snapshots). Balance at time T is computed as: Last_Snapshot_Balance + sum(ledger_entries where created_at > snapshot_time). This avoids scanning years of historical transaction rows.",
          },
        ],
      },
    ],
  },
];
