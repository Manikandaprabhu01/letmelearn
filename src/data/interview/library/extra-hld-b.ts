// Imported from the Interview Prep Console (lib/extra-hld-b.js).
import type { HldAnswer } from "../types";

export const extraHldB: HldAnswer[] = [
  {
    id: "x-kvstore",
    t: "Design a distributed key-value store",
    src: ["DesignGurus", "Educative", "ByteByteGo"],
    r: 3,
    stmt: "The purest distributed-systems question on the list: partitioning, replication, consistency and failure detection with nothing else to hide behind.",
    ask: [
      {
        q: "Consistency model — strong or eventual?",
        a: "Tunable, Dynamo-style: the caller picks per operation.",
      },
      {
        q: "Data size per value, and total?",
        a: "Values under 1 MB, total in the hundreds of TB.",
      },
      {
        q: "Access pattern — point lookups only, or ranges?",
        a: "Point lookups; range scans would push you toward ordered partitioning.",
      },
      {
        q: "Durability requirement?",
        a: "A write acknowledged must survive a node loss — so replicate before acking.",
      },
      {
        q: "Multi-region?",
        a: "Yes, with asynchronous cross-region replication.",
      },
    ],
    fr: [
      "get(key), put(key, value), delete(key)",
      "Configurable replication factor",
      "Tunable read/write quorums",
      "Automatic rebalancing when nodes join or leave",
      "Detect and repair divergent replicas",
    ],
    nfr: [
      "p99 under 10 ms for in-region operations",
      "No single point of failure; any node can serve any request",
      "Linear scalability by adding nodes",
      "Survive node, rack and region failure with defined guarantees",
    ],
    scale:
      "Say 100 TB of data, 1M ops/sec, values averaging 1 KB. With a replication factor of 3, that is 300 TB stored across, say, 300 nodes of 1 TB each — which makes rebalancing cost the key operational question, and is why consistent hashing with virtual nodes matters rather than being trivia.",
    arch: "  Client (or smart SDK) ── knows the ring / asks any node\n        │\n        ▼\n  ┌───────────────── coordinator node (any node can coordinate) ─────────┐\n  │  hash(key) → position on the consistent-hash ring                     │\n  │  → N preference-list nodes (walk clockwise, skip duplicates/racks)    │\n  └───────┬──────────────────┬──────────────────┬────────────────────────┘\n          ▼                  ▼                  ▼\n      Replica 1          Replica 2          Replica 3\n      ├ commit log (append-only)\n      ├ memtable (in memory, sorted)\n      └ SSTables on disk + compaction\n\n  Gossip protocol  ──▶ membership + failure detection\n  Hinted handoff / read repair / Merkle-tree anti-entropy ──▶ convergence",
    svc: [
      {
        n: "Partitioner",
        d: "Consistent hashing with virtual nodes so adding a node moves only 1/N of the keys and load stays even. Each key maps to a preference list of N distinct physical nodes, spread across racks.",
      },
      {
        n: "Coordinator",
        d: "Any node can take a request, forward it to the preference list, and apply the quorum rule: acknowledge a write after W replicas confirm, and answer a read after R replicas respond. R + W > N gives read-your-writes; W = N and R = 1 favours reads, and so on.",
      },
      {
        n: "Storage engine",
        d: "LSM tree — append to a commit log, buffer in a sorted memtable, flush to immutable SSTables, compact in the background. Chosen because the workload is write-heavy and append-only writes are sequential; a B-tree would be the choice for read-dominant, range-heavy workloads.",
      },
      {
        n: "Membership and failure detection",
        d: "Gossip spreads node state; a phi-accrual detector marks suspicious nodes. No master means no single point of failure and no leader election on the data path.",
      },
      {
        n: "Anti-entropy",
        d: "Hinted handoff stores writes destined for a down node and replays them; read repair fixes divergence noticed during reads; Merkle trees compare replicas in the background without shipping all data.",
      },
    ],
    seq: "put(key, value) with N=3, W=2\n────────────────────────────────────────────\nClient → Coordinator : put(k, v)\nCoordinator          : ring lookup → [A, B, C]\npar\n  Coordinator → A : write (log → memtable), version vector bump\n  Coordinator → B : write\n  Coordinator → C : write\nCoordinator ← A, B : ack (2 = W)\nCoordinator → Client : 200 OK        (C may still be catching up)\n  alt C is down\n    Coordinator → D : hinted handoff (D stores it for C)\n    later: D → C    : replay when C returns\n\nget(key) with R=2\n────────────────────────────────────────────\nClient → Coordinator : get(k)\npar\n  Coordinator → A : read (value, version)\n  Coordinator → B : read\nCoordinator : compare versions\n  alt divergent\n    Coordinator → stale replica : read repair (async)\n    Coordinator → Client : newest value (or siblings, if configured)\n  else\n    Coordinator → Client : value",
    db: {
      tables: [
        {
          n: "Commit log",
          cols: "append-only (key, value, timestamp, version)",
          notes: "Durability before acknowledgement; replayed on restart to rebuild the memtable.",
        },
        {
          n: "Memtable",
          cols: "sorted in-memory map",
          notes: "Absorbs writes; flushed to an immutable SSTable when it exceeds a threshold.",
        },
        {
          n: "SSTables + bloom filters",
          cols: "sorted immutable files with an index and a bloom filter per file",
          notes:
            "Bloom filters avoid touching files that cannot contain the key — the reason LSM reads stay fast despite many files.",
        },
        {
          n: "Ring metadata",
          cols: "node → virtual node positions, status, rack, region",
          notes: "Gossiped, not stored centrally; every node can route.",
        },
        {
          n: "Version metadata",
          cols: "vector clock or last-write-wins timestamp per key",
          notes:
            "Decides conflict resolution; vector clocks preserve concurrent siblings, LWW silently drops one — state the trade.",
        },
      ],
      sql: "There is no SQL here, and explaining why is part of the answer: you are giving up joins, transactions across keys and ad-hoc queries in exchange for linear scaling and availability during partitions. If the workload actually needs those, the right answer is a relational database with replicas and sharding, not this.",
      nosql:
        "This *is* the NoSQL design — Dynamo and Cassandra in one. The building blocks to name: consistent hashing with virtual nodes, quorum reads/writes, LSM storage, gossip membership, hinted handoff, read repair and Merkle anti-entropy.",
      verdict:
        "Say the CAP position explicitly: this is an AP system with tunable consistency. With R + W > N you approximate strong consistency at the cost of availability during partitions; with W = 1 you get the opposite. There is no setting that gives you both, and the interviewer is listening for that sentence.",
    },
    fu: [
      {
        q: "How do vector clocks resolve conflicts?",
        a: "Each replica tags writes with a counter per node; if one version's clock dominates another it wins outright, otherwise the versions are concurrent and the store returns siblings for the application to merge (Dynamo's shopping-cart example). Last-write-wins by wall clock is simpler but loses writes when clocks skew.",
      },
      {
        q: "What happens when a node joins?",
        a: "It claims virtual node positions on the ring and streams the key ranges it now owns from the previous owners, serving reads only once caught up. With virtual nodes the transfer is spread across many sources rather than hammering one neighbour.",
      },
      {
        q: "Why LSM rather than B-tree?",
        a: "Writes become sequential appends (fast on both SSD and HDD) and compaction amortises the rewriting cost; the price is read amplification and background compaction load. A B-tree gives better read latency and in-place updates, which is why relational databases use it.",
      },
      {
        q: "How do you support range scans?",
        a: "You cannot with pure hash partitioning. Use ordered partitioning (as HBase does) or a secondary ordered index — and accept hot-spotting on sequential keys, which is the reason hash partitioning was chosen in the first place.",
      },
    ],
  },
  {
    id: "x-messagequeue",
    t: "Design a distributed message queue (Kafka-like)",
    src: ["DesignGurus", "ByteByteGo", "Educative"],
    r: 3,
    stmt: "Design the log everything else in this list depends on: durable, ordered, replayable, and fast.",
    ask: [
      {
        q: "Queue semantics (each message to one consumer) or log semantics (many independent consumers)?",
        a: "Log — that is the harder and more useful design.",
      },
      {
        q: "Ordering guarantee?",
        a: "Per partition, not global — and say why global ordering does not scale.",
      },
      {
        q: "Delivery guarantee?",
        a: "At-least-once by default, with idempotent producers for effectively-once.",
      },
      {
        q: "Retention?",
        a: "Time or size based, typically 7 days, with replay from any offset.",
      },
      {
        q: "Scale?",
        a: "1M messages/sec, 1 KB each ≈ 1 GB/sec ingest.",
      },
    ],
    fr: [
      "Publish to a topic; consume from a topic",
      "Partitioned topics with per-partition ordering",
      "Consumer groups with automatic partition assignment",
      "Offset commit and replay from an arbitrary offset",
      "Configurable retention and compaction",
    ],
    nfr: [
      "Durable: an acknowledged message survives broker loss",
      "High throughput via sequential IO and batching",
      "Consumers must not slow producers (buffering is the point)",
      "Rebalances must be quick and not lose committed offsets",
    ],
    scale:
      "1 GB/sec × 7 days ≈ 600 TB with replication factor 3 ≈ 1.8 PB — so retention is a storage-cost decision. Throughput comes from sequential appends plus page cache plus zero-copy transfer (sendfile), not from clever data structures; saying that is what separates a real answer from a diagram.",
    arch: "  Producers ──(batch, compress, key → partition)──▶\n\n  ┌──────────── Broker cluster ────────────────────────────┐\n  │ Topic A                                                 │\n  │  ├ Partition 0  [leader on B1] ── replicas B2, B3        │\n  │  ├ Partition 1  [leader on B2] ── replicas B1, B3        │\n  │  └ Partition 2  [leader on B3] ── replicas B1, B2        │\n  │      each partition = append-only segmented log on disk  │\n  └───────────────┬─────────────────────────────────────────┘\n                  │\n  Consumer group X: c1 ← P0, c2 ← P1, c3 ← P2   (one owner per partition)\n  Consumer group Y: independent offsets over the same data\n\n  Metadata/controller (KRaft or ZooKeeper): leaders, ISR, assignments",
    svc: [
      {
        n: "Producer",
        d: "Chooses a partition by key hash (ordering domain), batches and compresses, and waits for the configured acks. `acks=all` plus `enable.idempotence` gives no duplicates and no loss from producer retries.",
      },
      {
        n: "Broker / partition leader",
        d: "Appends to a segmented log, replicates to followers, and tracks the in-sync replica set. A write is committed once all ISR members have it, which is what makes `acks=all` durable.",
      },
      {
        n: "Consumer group coordinator",
        d: "Assigns partitions to consumers and triggers a rebalance on membership change. Offsets are stored in the cluster itself so a restarted consumer resumes exactly where it left off.",
      },
      {
        n: "Retention and compaction",
        d: "Old segments are deleted by age or size; log-compacted topics keep the latest value per key forever, which is how you store state (like a change stream) in a log.",
      },
      {
        n: "Controller",
        d: "Elects partition leaders and propagates metadata. Keeping it off the data path is why throughput scales with brokers.",
      },
    ],
    seq: "Publish and consume\n──────────────────────────────────────────────\nProducer → Partitioner : hash(key) % partitions → P1\nProducer → Broker(P1 leader) : batch of records\nBroker → local log : append (sequential write, page cache)\npar\n  Follower1 → fetch → append\n  Follower2 → fetch → append\nBroker : all ISR have offset N → committed\nBroker → Producer : ack (acks=all)\n\nConsumer → Coordinator : join group\nCoordinator → Consumer : assigned partitions [P1]\nloop\n  Consumer → Broker : fetch from offset O (long poll)\n  Broker → Consumer : batch (zero-copy from page cache)\n  Consumer         : process idempotently\n  Consumer → Broker : commit offset O+n   ← after processing\n  alt consumer dies before commit\n    Coordinator → rebalance : another consumer re-reads from O\n                              (hence at-least-once)",
    db: {
      tables: [
        {
          n: "Partition log segments",
          cols: "base_offset.log + .index + .timeindex files",
          notes:
            "Append-only, segmented so old segments can be deleted or archived whole; the index maps offsets to file positions for O(1) seeks.",
        },
        {
          n: "__consumer_offsets (internal compacted topic)",
          cols: "(group, topic, partition) → offset",
          notes:
            "Offsets stored in the log itself, compacted so only the latest survives — an elegant reuse of the primitive.",
        },
        {
          n: "Topic metadata",
          cols: "topic, partitions, replication factor, ISR, leader per partition",
          notes: "Held by the controller quorum, cached by every client.",
        },
        {
          n: "Tiered storage (optional)",
          cols: "old segments → object storage",
          notes:
            "Modern clusters offload cold segments to S3 so retention is cheap and brokers stay small.",
        },
      ],
      sql: "Nothing relational belongs on this path. SQL appears only in the control plane around it — topic ownership, quotas, ACLs, and the catalogue that tells humans which topic means what.",
      nosql:
        "The log *is* the storage engine: append-only files plus an offset index, exploiting the OS page cache and zero-copy transfer. Object storage increasingly backs cold segments. No key–value store, no document store — and being clear about why is the point.",
      verdict:
        "The trade-off to state: ordering is per partition, so your partition key defines your ordering domain and your parallelism at once. Choosing `order_id` gives per-order ordering and lots of parallelism; choosing a constant gives global ordering and no scalability. Everything else follows from that choice.",
    },
    fu: [
      {
        q: "How do you get exactly-once?",
        a: "Idempotent producers (sequence numbers per producer per partition deduplicate retries) plus transactions spanning the consume-process-produce cycle give effectively-once *within* the system. End to end, external side effects still need idempotency keys — say that rather than claiming exactly-once.",
      },
      {
        q: "What happens when a consumer is slow?",
        a: "Lag grows; the log absorbs it up to retention. Monitor consumer lag as a first-class SLO, scale consumers up to the partition count, and if you need more parallelism than partitions you must repartition, not add consumers.",
      },
      {
        q: "Kafka vs RabbitMQ vs SQS?",
        a: "Kafka for high-throughput ordered logs with replay and multiple independent readers; RabbitMQ for per-message routing, acknowledgement and work queues; SQS when you want a managed queue and no operational burden. Pick by whether you need a log or a queue.",
      },
      {
        q: "How does a rebalance avoid duplicate processing?",
        a: "It does not entirely — that is why consumers must be idempotent. Cooperative/incremental rebalancing reduces the stop-the-world window, and committing offsets only after processing keeps the failure mode at duplicates rather than loss.",
      },
    ],
  },
  {
    id: "x-googledocs",
    t: "Design Google Docs (collaborative editing)",
    src: ["DesignGurus", "IGotAnOffer"],
    r: 4,
    stmt: "Many people editing the same document simultaneously, with every client converging to the same result. The question is really 'do you know OT and CRDTs, and can you pick one'.",
    ask: [
      {
        q: "How many concurrent editors per document?",
        a: "Tens, not thousands — that bounds the concurrency algorithm's cost.",
      },
      {
        q: "Rich text or plain text?",
        a: "Rich text, which makes operations richer than insert/delete of characters.",
      },
      {
        q: "Offline editing?",
        a: "Yes — this is the argument for CRDTs over OT.",
      },
      {
        q: "Do we need cursor presence and comments?",
        a: "Yes, presence is expected; comments anchor to positions and must survive edits.",
      },
      {
        q: "History and restore?",
        a: "Full revision history with named versions.",
      },
    ],
    fr: [
      "Multiple users edit the same document with sub-second propagation",
      "All clients converge to identical content",
      "Presence: live cursors and selections",
      "Comments anchored to text ranges",
      "Revision history, restore, and offline edits that merge on reconnect",
    ],
    nfr: [
      "Convergence is non-negotiable: no user may see a different document",
      "Edit latency under 100 ms locally (apply optimistically, reconcile after)",
      "Survive disconnection and reconnection without losing work",
      "Document size up to tens of MB of text",
    ],
    scale:
      "Concurrency per document is small, but document count is enormous, so the system is a very large number of small stateful sessions — which pushes you toward one session server owning a document at a time, with a routing registry, exactly like the chat gateway.",
    arch: "  Clients (optimistic local apply)\n     │ ops over WebSocket\n     ▼\n  Session server for document D  (single owner → serialises ops)\n     │  transform / merge  ──▶ authoritative op log\n     │                          │\n     ├──▶ broadcast to other clients (with version vector / revision id)\n     ├──▶ presence channel (cursors, selections, ephemeral)\n     └──▶ periodic snapshot ──▶ document store (S3 + metadata DB)\n\n  Routing registry (doc → session server)  •  Op log (append-only, replayable)",
    svc: [
      {
        n: "Session server",
        d: "One server owns a live document so operations are serialised in a single place. It assigns a monotonically increasing revision to every accepted operation — the sequence that makes convergence provable.",
      },
      {
        n: "Concurrency engine (OT or CRDT)",
        d: "**OT** transforms an incoming operation against operations the client had not seen (what Google Docs uses; requires the central server and careful transform functions). **CRDT** gives every character a unique, ordered identifier so concurrent inserts merge commutatively without a server (what Figma, Automerge and Yjs use; better for offline, at the cost of metadata overhead).",
      },
      {
        n: "Op log and snapshots",
        d: "Every accepted op is appended; a snapshot is written every N ops so opening a document does not replay its whole history. History and restore fall out of this for free.",
      },
      {
        n: "Presence service",
        d: "Ephemeral cursor and selection state broadcast to collaborators, kept out of the durable log — losing it costs nothing.",
      },
      {
        n: "Comments and anchors",
        d: "Comments reference stable position markers rather than character offsets, so they survive edits above them; with CRDTs the character identifier *is* the anchor.",
      },
    ],
    seq: "Concurrent edits\n──────────────────────────────────────────────\nA types 'x' at pos 5 (local revision 10)\nA → Session : op(insert 'x', 5, rev=10)\nB deletes at pos 3 (also local revision 10)\nB → Session : op(delete, 3, rev=10)\n\nSession : accepts A first → revision 11\nSession → B : A's op, transformed against B's pending op\nSession : accepts B's op, transformed against A's → revision 12\nSession → A : B's op transformed\n\nBoth clients now at revision 12 with identical text.\n\nReconnect after offline work\n──────────────────────────────────────────────\nClient → Session : here are my ops since revision 40\nSession → Client : ops 41..87 from others\nClient : transform local ops against them (OT) or merge (CRDT)\nClient → Session : rebased local ops\nSession → all    : broadcast",
    db: {
      tables: [
        {
          n: "documents",
          cols: "doc_id PK, owner_id, title, current_revision, snapshot_key, updated_at",
          notes: "Metadata in SQL; the content body lives in object storage as snapshots.",
        },
        {
          n: "operations",
          cols: "(doc_id, revision) PK, author_id, op JSONB, created_at",
          notes: "Append-only log; the source of truth between snapshots. Partitioned by document.",
        },
        {
          n: "snapshots",
          cols: "doc_id, revision, storage_key, created_at",
          notes: "Every N operations, so opening a document is snapshot + a short op replay.",
        },
        {
          n: "comments",
          cols: "comment_id, doc_id, anchor (stable id/range), author, body, resolved_at",
          notes: "Anchored to durable position markers, not offsets.",
        },
        {
          n: "acl / sharing",
          cols: "doc_id, principal, permission, link_token, expires_at",
          notes: "Checked on session join and on every reconnect.",
        },
      ],
      sql: "SQL for documents, permissions, comments and the operation log (append-only, partitioned by document). These need transactions, ordering and relational queries — 'which documents can this user see' is a join, not a scan.",
      nosql:
        "Object storage for snapshots; Redis for the doc → session-server registry and presence; a pub/sub layer for fan-out. The live document itself lives in memory on its session server, which is the only place it is mutable.",
      verdict:
        "Pick one concurrency approach and defend it: **OT** when a central server is acceptable and you want compact operations (Google Docs); **CRDT** when offline-first or peer-to-peer matters and you can afford the metadata (Figma, Yjs). Saying 'either works' without choosing is the weak answer.",
    },
    fu: [
      {
        q: "Why not just last-writer-wins on the whole document?",
        a: "Two people typing for ten seconds would destroy each other's work. The unit of concurrency has to be the operation, not the document — that is the entire premise of the question.",
      },
      {
        q: "What happens when the session server dies?",
        a: "Another server claims the document via the registry, loads the last snapshot plus the op log, and clients reconnect and rebase from their last known revision. Because the log is durable and revisions are monotonic, nothing is lost.",
      },
      {
        q: "How do you keep the op log from growing forever?",
        a: "Snapshot and truncate: keep operations since the last snapshot for live rebasing, and retain coarse historical versions for the history UI rather than every keystroke.",
      },
      {
        q: "How would you add suggestions/track changes?",
        a: "Model them as operations in a separate layer that is applied to a view rather than the base document, with accept/reject converting them into real operations — this is why keeping operations as first-class data matters.",
      },
    ],
  },
  {
    id: "x-jobscheduler",
    t: "Design a distributed job scheduler / cron service",
    src: ["DesignGurus", "InterviewBit"],
    r: 3,
    stmt: "Run tasks at a time or on a schedule, exactly once, across a fleet that can lose machines at any moment. A favourite because the failure cases are where all the marks are.",
    ask: [
      {
        q: "One-off tasks, recurring cron, or both?",
        a: "Both, plus delayed tasks (run in 30 minutes).",
      },
      {
        q: "Exactly-once execution, or at-least-once with idempotent jobs?",
        a: "At-least-once delivery with idempotent jobs — exactly-once across machines is not achievable, and saying so scores.",
      },
      {
        q: "How precise must the firing time be?",
        a: "Within a second for most jobs; sub-second needs a different design.",
      },
      {
        q: "Scale?",
        a: "10M scheduled jobs, 10K firings/second at peak (cron storms on the hour).",
      },
      {
        q: "What happens to a job whose worker dies mid-run?",
        a: "It must be retried after a visibility timeout, and the job must tolerate that.",
      },
    ],
    fr: [
      "Schedule one-off, delayed and recurring (cron) jobs",
      "Execute at the scheduled time with bounded skew",
      "Retry with backoff on failure; dead-letter after N attempts",
      "Cancel or reschedule a pending job",
      "Show execution history and status",
    ],
    nfr: [
      "No lost jobs — durability before acknowledgement",
      "No duplicate *effects*, achieved through idempotency rather than exactly-once delivery",
      "Survive worker and scheduler failure with automatic recovery",
      "Cron storms (thousands of jobs at 00:00) must not collapse the system",
    ],
    scale:
      "10M jobs with an index on next_run_at makes 'what is due in the next 10 seconds' a cheap range scan. Peak firing at 10K/sec is fine because execution is decoupled by a queue — the scheduler only enqueues. The classic failure is scanning the whole table per tick; the fix is the time-bucketed index or a timing wheel.",
    arch: "  API ──▶ Job store (SQL: job_id, schedule, next_run_at, state, version)\n            │\n            ▼\n  Scheduler replicas (leader-elected or partitioned by bucket)\n            │  every second: SELECT ... WHERE next_run_at <= now\n            │               AND state='PENDING' FOR UPDATE SKIP LOCKED\n            ▼\n       Execution queue (SQS/Kafka/Redis stream)\n            │  lease with visibility timeout\n            ▼\n       Worker fleet ── run task ── report result\n            │\n            ├── success → compute next_run_at (cron) or mark DONE\n            ├── failure → retry with backoff, attempt++\n            └── exhausted → dead-letter + alert",
    svc: [
      {
        n: "Job store",
        d: "The durable source of truth. `next_run_at` is indexed; the claim query uses `FOR UPDATE SKIP LOCKED` (or a conditional update on a version column) so multiple scheduler replicas can poll the same table without stepping on each other.",
      },
      {
        n: "Scheduler",
        d: "Polls for due jobs in small batches and enqueues them. Partition by hash of job id across replicas so each owns a slice, or use leader election if simplicity matters more than throughput. Add jitter to spread cron-storm firings.",
      },
      {
        n: "Execution queue",
        d: "Decouples scheduling from running, so a slow job type cannot delay firing. Visibility timeout plus a lease means a dead worker's job returns automatically.",
      },
      {
        n: "Workers",
        d: "Pull, extend the lease on long jobs (heartbeat), execute idempotently keyed by (job_id, scheduled_time), and report the outcome. That key is what makes the at-least-once delivery safe.",
      },
      {
        n: "Recurrence engine",
        d: "On success, computes the next occurrence from the cron expression **in the job's timezone**, handling DST transitions — the detail interviewers probe.",
      },
    ],
    seq: "Fire a recurring job\n──────────────────────────────────────────────\nScheduler (every 1 s)\n  → DB : SELECT job_id FROM jobs\n          WHERE next_run_at <= now() AND state='PENDING'\n          ORDER BY next_run_at LIMIT 500\n          FOR UPDATE SKIP LOCKED\n  → DB : UPDATE state='QUEUED', run_id=uuid\n  → Queue : enqueue {job_id, run_id, scheduled_for}\nWorker\n  → Queue : receive with 5-min visibility timeout\n  → Store : has (job_id, scheduled_for) already succeeded?   ← idempotency\n  → Task  : execute\n  alt success\n    Worker → DB : record run, next_run_at = cron.next(tz), state='PENDING'\n    Worker → Queue : delete message\n  alt failure\n    Worker → DB : attempts++, next_run_at = now + backoff(attempts)\n    alt attempts > max\n      Worker → DLQ + alert\n  alt worker dies\n    Queue : visibility timeout expires → message redelivered\n            (safe because execution is idempotent)",
    db: {
      tables: [
        {
          n: "jobs",
          cols: "job_id PK, owner, type, payload JSONB, cron_expr, timezone, next_run_at, state, attempts, max_attempts, version",
          notes:
            "INDEX (state, next_run_at) is the whole performance story. Partition by next_run_at bucket if the table is huge.",
        },
        {
          n: "job_runs",
          cols: "run_id PK, job_id, scheduled_for, started_at, finished_at, status, error, worker_id",
          notes:
            "UNIQUE (job_id, scheduled_for) turns at-least-once delivery into at-most-once *effect*.",
        },
        {
          n: "leases (or queue visibility)",
          cols: "run_id, worker_id, expires_at",
          notes:
            "Either the queue provides this, or you implement it with a heartbeat-extended lease column.",
        },
        {
          n: "dead_letters",
          cols: "run_id, job_id, payload, last_error, failed_at",
          notes: "Needs an operator UI and a replay action — otherwise failures disappear.",
        },
      ],
      sql: "SQL is the right home for the job table: you need transactions to claim a job, a conditional update for exactly-one-claim, an ordered index on next_run_at, and a unique constraint for idempotency. `SKIP LOCKED` makes a relational database a perfectly good work queue at this scale — worth saying, because candidates often reach for Kafka where Postgres is simpler.",
      nosql:
        "Redis sorted sets are an excellent scheduling primitive for very high volumes of short-lived timers (score = fire time, ZRANGEBYSCORE to poll) — but they need care around durability. A queue (SQS/Kafka) handles execution fan-out and leases.",
      verdict:
        "SQL job store + queue for execution + idempotent workers. State the honest guarantee: **at-least-once delivery, exactly-once effect through idempotency keys**. Anyone promising exactly-once execution across a network has not thought about the worker that completes the task and dies before acknowledging.",
    },
    fu: [
      {
        q: "How do you avoid a thundering herd at midnight?",
        a: "Add deterministic jitter derived from the job id (so a job fires at 00:00:37 every night rather than 00:00:00), rate-limit the enqueue loop, and scale workers on queue depth. Also spread cron expressions at creation time where the user does not care about the exact second.",
      },
      {
        q: "How do you handle DST and timezones for recurring jobs?",
        a: "Store the schedule with an IANA timezone and compute the next occurrence in that zone. A daily 02:30 job simply does not exist on a spring-forward day — decide and document whether it is skipped or fired at 03:00, because both are defensible and silence is not.",
      },
      {
        q: "Two scheduler replicas both claim a job?",
        a: "They cannot, if the claim is a conditional update guarded by state and version, or a `SELECT ... FOR UPDATE SKIP LOCKED`. Demonstrate the query — this is the concurrency core of the design.",
      },
      {
        q: "How would you support jobs that must run in order?",
        a: "Give ordered jobs a queue key (per entity) and process one at a time per key — the same partition-for-ordering idea as Kafka. Global ordering across all jobs would serialise the whole system.",
      },
    ],
  },
  {
    id: "x-proximity",
    t: "Design a proximity service (Yelp / nearby places)",
    src: ["DesignGurus", "Educative", "IGotAnOffer"],
    r: 3,
    stmt: "Find all businesses within X km of a point, fast, at global scale. The geospatial-indexing question, and the base for ride-hailing and delivery designs.",
    ask: [
      {
        q: "Search radius — fixed or user-selected?",
        a: "Selectable (0.5–50 km), which rules out a single fixed grid size.",
      },
      {
        q: "How often does the data change?",
        a: "Businesses are near-static; this is read-dominated, unlike driver locations which are write-dominated.",
      },
      {
        q: "Filters and ranking?",
        a: "Category, rating, open-now, plus ranking by distance and relevance.",
      },
      {
        q: "Scale?",
        a: "200M businesses, 5K queries/sec, 100M DAU.",
      },
      {
        q: "Do we need real-time updates (a shop closing now)?",
        a: "Minutes of staleness is fine — that unlocks heavy caching.",
      },
    ],
    fr: [
      "Search businesses within a radius of a coordinate",
      "Filter by category, rating and opening hours",
      "Rank by distance and relevance",
      "Add, update and remove businesses",
      "Show details and photos",
    ],
    nfr: [
      "Search p99 under 200 ms",
      "Read-heavy: cache aggressively, tolerate minutes of staleness",
      "Scale across regions with data locality",
      "Handle dense cities (Manhattan) and empty regions with the same index",
    ],
    scale:
      "200M businesses × ~1 KB ≈ 200 GB of metadata — small. The work is in the index: a naive `WHERE distance(lat,lng, ?, ?) < r` scans every row and cannot use an index, which is the failure the question is built around. With a geohash/quadtree index a radius query touches a handful of cells.",
    arch: "  Client ──▶ CDN ──▶ API gateway\n                        │\n         ┌──────────────┴───────────────┐\n         ▼                              ▼\n  Location search service         Business service\n    │  geohash/H3 cell lookup       (details, photos, hours)\n    ▼                                    │\n  Geo index (Redis GEO / ES geo_point /  ▼\n  Postgres+PostGIS)                  Postgres (businesses)\n         │                                │\n         └──── hydrate ids ───────────────┘\n                        │\n                        ▼\n              Cache (cell → results, 60 s TTL)",
    svc: [
      {
        n: "Geo index",
        d: "Three workable choices, and comparing them is the answer: **geohash** (string prefix per cell — neighbours are a prefix query, easy to shard); **quadtree** (adapts to density, splitting only crowded cells); **H3/S2** (hexagonal or spherical cells with clean neighbour semantics and uniform area). For a radius query, compute the covering cells at a resolution matched to the radius and query those, then filter by exact distance.",
      },
      {
        n: "Search service",
        d: "Turns (lat, lng, radius, filters) into a cell set, fetches candidate ids, applies filters and exact distance, ranks and paginates. Reads are cacheable by rounded coordinates and cell — rounding the user's position to ~100 m raises the hit rate enormously.",
      },
      {
        n: "Business service",
        d: "Owns the relational record: details, hours, categories, photos. Updates publish events that reindex the geo and search indexes.",
      },
      {
        n: "Index builder",
        d: "Consumes business change events and updates Elasticsearch/Redis; a nightly full rebuild guards against drift.",
      },
      {
        n: "Ranking",
        d: "Blends distance, rating, popularity and personalisation — kept server-side so it can change without a client release.",
      },
    ],
    seq: "Nearby search\n────────────────────────────────────────────\nClient → API : GET /search?lat&lng&radius=2km&category=cafe\nAPI → API    : round coords → cache key\nAPI → Cache  : hit? (60 s TTL)\n  alt hit → return\nAPI → GeoIdx : cells covering the 2 km circle at resolution r\nGeoIdx → API : candidate business ids (a few hundred)\nAPI → Store  : batch fetch details for candidates\nAPI → API    : exact haversine filter + category/open filters\nAPI → Rank   : distance × rating × popularity\nAPI → Cache  : store page\nAPI → Client : ranked results + next cursor\n\nBusiness update\n────────────────────────────────────────────\nOwner → API  : PATCH /business/{id} {hours, location}\nAPI → DB     : update row\nAPI → Kafka  : business.updated\nKafka → Indexer : upsert geo cell + search doc\n  alt location changed\n    Indexer : remove from old cell, add to new",
    db: {
      tables: [
        {
          n: "businesses",
          cols: "business_id PK, name, category, lat, lng, geohash, rating, price, hours JSONB, updated_at",
          notes:
            "INDEX on geohash prefix (or a PostGIS GiST index on a geography column) — that index is what makes the query possible.",
        },
        {
          n: "geo_index (Redis GEO or ES)",
          cols: "GEOADD city:{region} lng lat business_id / geo_point field",
          notes:
            "Redis GEOSEARCH does radius queries natively on a sorted set of geohash scores; Elasticsearch adds filters and ranking in the same query.",
        },
        {
          n: "reviews",
          cols: "review_id, business_id, user_id, rating, text, created_at",
          notes:
            "Separate table; aggregate rating denormalised onto the business row and recomputed asynchronously.",
        },
        {
          n: "cell_cache (Redis)",
          cols: "(cell, filters) → result page",
          notes:
            "Short TTL; the single biggest lever on p99 because searches cluster in dense areas.",
        },
      ],
      sql: "SQL with PostGIS is a genuinely good answer at this scale: 200M rows with a GiST index handles radius queries in milliseconds, and you keep joins to reviews, categories and hours. Say that before reaching for something exotic — right-sizing is a senior signal.",
      nosql:
        "Elasticsearch when ranking and text search matter alongside geo (the usual production answer for Yelp-like products); Redis GEO for very hot, simple radius lookups; Cassandra only if the business corpus were far larger and queries simpler.",
      verdict:
        "Postgres/PostGIS or Elasticsearch as the index, Redis for hot cells, and a relational source of truth. The line that matters: **never compute distance over the whole table** — precompute a cell key so the database can use an index, then refine with exact distance on a small candidate set.",
    },
    fu: [
      {
        q: "Geohash, quadtree or S2/H3 — which and why?",
        a: "Geohash is simplest and shards by prefix, but cell size is fixed per level and neighbours near cell boundaries need care. Quadtrees adapt to density, which matters when Manhattan and rural Montana share an index. S2/H3 give near-uniform cell area and clean neighbour lists, which is why Uber built H3. Pick based on density variance and whether you need uniform-area cells.",
      },
      {
        q: "What about businesses near a cell boundary?",
        a: "Always query the covering cells *plus* their neighbours, then filter by exact distance. Forgetting the neighbour ring is the classic bug — results mysteriously stop at invisible lines.",
      },
      {
        q: "How does this differ from Uber's driver index?",
        a: "Businesses are static and read-heavy, so you can index them in Elasticsearch and cache hard. Drivers move every few seconds, so the index must live in memory with constant overwrites and no durability — same geospatial idea, opposite write profile.",
      },
      {
        q: "How do you support 'open now'?",
        a: "Store hours per weekday with timezone, precompute an `open_intervals` structure, and filter in the index query rather than post-filtering — otherwise you paginate over results you then discard.",
      },
    ],
  },
];
