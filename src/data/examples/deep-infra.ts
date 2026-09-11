import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const infraDeepExamples: DesignExample[] = [
  {
    slug: "distributed-mq",
    title: "Design a Distributed Message Queue",
    source: "Volume 2",
    chapter: 4,
    difficulty: "advanced",
    minutes: 24,
    tags: ["kafka", "log", "partitions", "delivery semantics", "consumer groups"],
    companies: ["Kafka", "Pulsar", "SQS", "Kinesis", "RabbitMQ"],
    summary:
      "The design is one idea taken seriously: a queue is an append-only log, and a consumer is a cursor into it. That single decision explains why throughput is measured in gigabytes per second on spinning-rust-era hardware, why ordering is only ever per partition, why replay is free, and why the broker is stateless about who has read what. The rest of the interview is delivery semantics, which is where almost everyone overclaims.",
    clarifying: [
      {
        q: "Point-to-point queue, or publish-subscribe?",
        a: "Both, ideally through one mechanism. A log with independent consumer cursors gives pub/sub naturally — every group reads the same records — and gives competing consumers by partitioning within a group. If it were strictly point-to-point I could delete on consumption, which is a much simpler and much less useful system.",
      },
      {
        q: "What ordering guarantee is actually required?",
        a: "I will offer total order within a partition key and nothing across keys, because global ordering across a distributed queue means a single writer and destroys throughput. In practice 'all events for one user in order' is what people actually need, and that is a partitioning decision rather than an ordering feature.",
      },
      {
        q: "At-least-once, at-most-once, or exactly-once?",
        a: "At-least-once by default with idempotent consumers, because that is honest and achievable. I will explain what exactly-once really means — idempotent producers plus transactional offset commits within the system — and why it does not extend to arbitrary side effects outside it.",
      },
      {
        q: "How long is data retained, and can consumers replay?",
        a: "Retain by time and size — say seven days — and yes, replay is a first-class feature. Retention decoupled from consumption is the main thing distinguishing a log from a traditional queue, and it is what makes reprocessing after a bug fix possible.",
      },
      {
        q: "What throughput and message size?",
        a: "Assume a million messages a second at about 1 KB. That is roughly a gigabyte a second, which immediately rules out anything that touches a message more than a couple of times and forces sequential I/O and batching.",
      },
    ],
    requirements: {
      functional: [
        "Producers publish to a topic; consumers read independently at their own pace",
        "Multiple consumer groups read the same topic without interfering",
        "Within a partition, consumers see records in the order they were written",
        "Consumers can rewind to an earlier offset and reprocess",
      ],
      nonFunctional: [
        "~1 GB/s sustained write throughput per cluster, with room to scale linearly",
        "No data loss once a write is acknowledged by the replica set",
        "Producer publish latency in low single-digit milliseconds",
        "A broker failure must not lose acknowledged data or stall the cluster for long",
      ],
    },
    math: [
      {
        label: "Throughput",
        expr: "1 M msg/s × 1 KB",
        result: "≈ 1 GB/s in",
        note: "×3 for replication ≈ 3 GB/s of disk writes across the cluster. Sequential, which is the only reason this is affordable.",
      },
      {
        label: "Sequential vs random disk",
        expr: "NVMe sequential ~3 GB/s vs random 4 KB ~200 MB/s",
        result: "≈ 15× difference",
        note: "The append-only log exists to stay on the fast side of this ratio. A queue with per-message random access gives up an order of magnitude.",
      },
      {
        label: "Retention",
        expr: "1 GB/s × 86,400 × 7 days",
        result: "≈ 600 TB",
        note: "×3 replication ≈ 1.8 PB. Retention is usually what sizes the cluster, not throughput.",
      },
      {
        label: "Partition count",
        expr: "target 10 MB/s per partition → 1 GB/s ÷ 10 MB/s",
        result: "≈ 100 partitions minimum",
        note: "Round up for consumer parallelism: a consumer group cannot have more useful members than there are partitions.",
      },
      {
        label: "Cost of a small batch",
        expr: "1 KB per request vs 64 KB batched",
        result: "≈ 64× fewer syscalls and RPCs",
        note: "Batching is not an optimisation here, it is load-bearing. Unbatched, the per-message overhead dominates everything.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/topics/{topic}/records",
        desc: "Produce a batch — {key, value, headers}[]; key decides the partition",
      },
      {
        method: "GET",
        path: "/v1/topics/{topic}/partitions/{p}/records?offset={o}&maxBytes=",
        desc: "Fetch from an offset — a range read of the log, served by sendfile",
      },
      {
        method: "POST",
        path: "/v1/groups/{group}/offsets",
        desc: "Commit progress; the broker stores it but never infers it",
      },
      {
        method: "POST",
        path: "/v1/groups/{group}/join",
        desc: "Join a consumer group and receive a partition assignment",
      },
      {
        method: "POST",
        path: "/v1/topics",
        desc: "Create — partition count and replication factor are the two decisions that matter",
      },
    ],
    dataModel: [
      {
        entity: "topics",
        fields: [
          "topic (pk)",
          "partition_count",
          "replication_factor",
          "retention_ms, retention_bytes",
          "cleanup_policy (delete|compact)",
        ],
      },
      {
        entity: "partitions",
        fields: [
          "topic, partition_id (pk)",
          "leader_broker (idx)",
          "isr[] (in-sync replicas)",
          "log_start_offset, high_watermark",
        ],
      },
      {
        entity: "segments",
        fields: [
          "topic, partition, base_offset (pk)",
          "log file (append-only)",
          "index file (offset → byte position)",
          "time index (timestamp → offset)",
          "→ immutable once rolled; deletion is unlinking a file",
        ],
      },
      {
        entity: "group_offsets",
        fields: [
          "group_id, topic, partition (pk)",
          "committed_offset",
          "→ itself stored in a compacted topic; the broker holds no other consumer state",
        ],
      },
    ],
    architecture: [
      {
        heading: "The log is the data structure",
        lede: "Everything else follows from refusing to delete on read.",
        diagram: {
          kind: "compare",
          caption: "Traditional broker versus log — the same API, a different machine underneath.",
          options: [
            {
              title: "Traditional queue",
              sub: "RabbitMQ-style: the broker owns delivery state",
              good: [
                "Per-message acknowledgement and redelivery",
                "Rich routing, priorities, dead-lettering out of the box",
              ],
              bad: [
                "The broker tracks state per message per consumer — expensive and hard to scale",
                "Consumption destroys the message, so replay is impossible",
                "Random access patterns give up sequential disk throughput",
              ],
              verdict:
                "Excellent for task queues with complex routing; wrong for high-volume streams.",
            },
            {
              title: "Append-only log",
              sub: "Kafka-style: the consumer owns its cursor",
              tone: "ok",
              good: [
                "Writes and reads are both sequential, so throughput is disk-bandwidth bound",
                "The broker stores one offset per group per partition — almost no state",
                "Replay is free, and multiple independent consumers cost nothing extra",
              ],
              bad: [
                "No per-message acknowledgement; redelivery means rewinding the cursor",
                "Ordering only within a partition",
                "Retention is a storage cost you pay whether or not anyone reads",
              ],
              verdict:
                "The default for streaming and event-driven systems, and what the question is really asking about.",
            },
          ],
        },
        callout: {
          kind: "insight",
          title: "Why sequential I/O changes the design",
          text: "A modern NVMe drive does around 3 GB/s sequentially and a fraction of that in small random reads — and page-cached sequential reads never touch the disk at all. Because the log is written once at the end and read forward, the operating system's read-ahead and page cache do almost all the work, and the broker can hand bytes straight from page cache to socket with sendfile, never copying them into user space. That is why a broker on modest hardware serves a gigabyte a second: it barely touches the data.",
        },
      },
      {
        heading: "Partitions: parallelism, ordering and placement at once",
        lede: "One concept doing three jobs, which is why partition count is the decision people regret.",
        diagram: {
          kind: "system",
          caption: "A topic is a set of independent logs that happen to share a name.",
          columns: [
            {
              title: "Produce",
              nodes: [
                { id: "p", label: "Producer", sub: "batches, compresses" },
                { id: "part", label: "Partitioner", sub: "hash(key) % N", tone: "accent" },
              ],
            },
            {
              title: "Store",
              nodes: [
                { id: "l0", label: "Partition 0", sub: "leader on B1, ISR B2 B3" },
                { id: "l1", label: "Partition 1", sub: "leader on B2, ISR B1 B3" },
                { id: "l2", label: "Partition 2", sub: "leader on B3, ISR B1 B2" },
              ],
            },
            {
              title: "Consume",
              nodes: [
                { id: "c1", label: "Group A", sub: "3 members, 1 partition each", tone: "ok" },
                { id: "c2", label: "Group B", sub: "1 member, all 3 partitions" },
                { id: "off", label: "Offsets", sub: "per group, per partition" },
              ],
            },
          ],
        },
        code: {
          title: "The partitioner is the ordering contract",
          lang: "ts",
          source: `function partitionFor(record: Record, partitionCount: number): number {
  // A key means "all records with this key go to the same partition, and are
  // therefore totally ordered relative to each other". That is the ONLY
  // ordering guarantee the system offers, and it is chosen right here.
  if (record.key != null) return murmur2(record.key) % partitionCount;

  // No key: spread round-robin for throughput and accept no ordering at all.
  return stickyRoundRobin();
}

// The consequence people miss: increasing partitionCount changes hash(key) %
// partitionCount, so a key that used to land on partition 3 may now land on
// partition 7 — and its old records are still sitting in partition 3. Ordering
// for that key is broken across the resize, permanently. This is why you
// over-provision partitions up front rather than growing them later.`,
        },
        bullets: [
          "Partition count sets the ceiling on consumer parallelism: a group with more members than partitions leaves members idle, because a partition is assigned to exactly one member within a group.",
          'Ordering is per partition and nothing more. Saying "the queue preserves order" without qualification is the single most common wrong answer here.',
          "Choose the key for the ordering you need — user id for per-user ordering, order id for per-order. A key with poor cardinality creates a hot partition that one broker must absorb alone.",
          "Partitions are also the unit of replication and placement, so more partitions means more leader elections to perform and more files to manage on a broker failure. Tens of thousands per cluster is where operational pain begins.",
        ],
      },
      {
        heading: "Replication and what an acknowledgement means",
        lede: "Durability is a producer-side choice, and each setting is a different product.",
        diagram: {
          kind: "sequence",
          caption: "acks=all: the leader waits for the in-sync replicas before confirming.",
          actors: [
            { id: "p", label: "Producer" },
            { id: "l", label: "Leader", sub: "partition 0" },
            { id: "f1", label: "Follower 1", sub: "in ISR" },
            { id: "f2", label: "Follower 2", sub: "in ISR" },
          ],
          messages: [
            { from: "p", to: "l", label: "1. produce batch, acks=all", kind: "call" },
            { from: "l", to: "l", label: "2. append to local log", kind: "self" },
            {
              from: "f1",
              to: "l",
              label: "3. fetch (followers pull, leader does not push)",
              kind: "call",
            },
            { from: "f2", to: "l", label: "4. fetch", kind: "call" },
            {
              from: "l",
              to: "l",
              label: "5. all ISR caught up → advance high watermark",
              kind: "self",
              tone: "accent",
            },
            { from: "l", to: "p", label: "6. ack", kind: "return", tone: "ok" },
            {
              from: "l",
              to: "f1",
              label: "7. consumers can now read up to the watermark",
              kind: "async",
            },
          ],
        },
        table: {
          caption: "The producer chooses where on the durability/latency curve to sit.",
          headers: ["Setting", "Acknowledged when", "Loses data if", "Use for"],
          rows: [
            [
              "acks=0",
              "The socket accepted the bytes",
              "Anything at all goes wrong",
              "Metrics you can afford to drop",
            ],
            [
              "acks=1",
              "The leader wrote to its log",
              "The leader dies before followers catch up",
              "High-volume logs; the common default",
            ],
            [
              "acks=all",
              "All in-sync replicas have it",
              "Every replica is lost simultaneously",
              "Payments, orders — anything you cannot re-derive",
            ],
          ],
        },
        bullets: [
          "Followers pull rather than being pushed to, which keeps the leader's work uniform and means a slow follower degrades only itself until it falls out of the in-sync set.",
          "Consumers can only read up to the high watermark — the offset replicated to all in-sync replicas — so a record can be in the leader's log and still be invisible. That is what prevents a consumer seeing a record that a subsequent leader election would erase.",
          "acks=all with a minimum in-sync replica count of one is a trap: if the set shrinks to just the leader, acks=all means nothing. Set the minimum to two and accept unavailability rather than silent data loss.",
          "Unclean leader election — promoting an out-of-sync replica to restore availability — trades acknowledged data for uptime. It should be off by default, and turning it on is a decision to lose records.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Delivery semantics, honestly",
        lede: "Where almost every answer overclaims. Be precise about what is guaranteed and where the guarantee stops.",
        diagram: {
          kind: "flow",
          caption: "The failure window is between processing and committing the offset.",
          rows: [
            [
              { id: "r", label: "Read record", sub: "offset 41" },
              { id: "proc", label: "Process", sub: "the side effect", tone: "accent" },
              { id: "c", label: "Commit offset 42" },
            ],
            [
              { id: "b1", label: "Crash before processing", sub: "→ redelivered, fine" },
              {
                id: "b2",
                label: "Crash after processing, before commit",
                sub: "→ processed twice",
                tone: "warn",
              },
              { id: "b3", label: "Commit before processing", sub: "→ lost on crash", tone: "bad" },
            ],
          ],
        },
        code: {
          title: "At-least-once plus idempotency is the achievable target",
          lang: "ts",
          source: `// Committing BEFORE processing gives at-most-once: a crash loses the record.
// Committing AFTER gives at-least-once: a crash reprocesses it. There is no
// third option at this boundary, so the consumer must be idempotent.
async function consume(record: Record) {
  // Derive a stable id from the record, not from the clock or a UUID —
  // a retry must produce the SAME id or deduplication does nothing.
  const opId = \`\${record.topic}:\${record.partition}:\${record.offset}\`;

  await db.transaction(async (tx) => {
    // The insert and the side effect share one transaction. On a duplicate the
    // insert conflicts, the transaction aborts, and the effect never repeats.
    const fresh = await tx.processed.insertIfAbsent({ opId });
    if (!fresh) return;

    await applyEffect(tx, record);
  });

  await consumer.commit(record.offset + 1);
}`,
        },
        table: {
          caption: 'What "exactly-once" actually means, and where it stops.',
          headers: ["Claim", "Mechanism", "Boundary"],
          rows: [
            [
              "Idempotent producer",
              "Sequence numbers per producer per partition",
              "Removes duplicates from producer retries only",
            ],
            [
              "Transactional writes",
              "Atomic across partitions plus the offset commit",
              "Only within the queue system itself",
            ],
            [
              "Exactly-once processing",
              "Consume → transform → produce, all in one transaction",
              "Works when the sink is the same system",
            ],
            [
              "Exactly-once side effects",
              "Not provided",
              "Charging a card or sending an email is outside the transaction",
            ],
          ],
        },
        bullets: [
          "The producer can retry a batch it already wrote after a network timeout, which duplicates records without anyone crashing. Idempotent producers fix exactly this with a per-producer sequence number.",
          "End-to-end exactly-once holds when the whole loop is inside the system — read, transform, write, commit offsets, all transactionally. The moment a side effect leaves it, the honest guarantee is at-least-once plus an idempotent receiver.",
          "The deduplication key must be derived from the record. A newly generated id on each attempt makes every retry look like a new operation, which is the most common way idempotency is implemented and quietly does nothing.",
          "Dead-letter after a bounded number of attempts. A poison record that fails forever blocks its partition, and because ordering is per partition, one bad record can stall everything behind it.",
        ],
      },
      {
        heading: "Consumer groups and the rebalance problem",
        body: [
          "A group divides the partitions of a topic among its members. That assignment must change when a member joins, leaves or dies — and the naive implementation stops the entire group while it does so, which at scale is a bigger outage than the failure that triggered it.",
        ],
        bullets: [
          "A stop-the-world rebalance revokes every assignment and redistributes them, so a rolling deploy of twenty consumers triggers twenty full pauses. Incremental cooperative rebalancing moves only the partitions that actually need to move.",
          "Liveness is a heartbeat, but progress is a separate timeout. A consumer stuck in a long processing loop is alive and not progressing, and conflating the two either kills healthy slow consumers or fails to notice stuck ones.",
          "Sticky assignment matters more than it sounds: a consumer that keeps its partitions keeps its local state and caches, so an assignment that reshuffles everything can be far more expensive than the rebalance itself.",
          "Lag — the distance between the log end and the committed offset — is the health metric that matters. Throughput looks fine right up until consumers fall permanently behind, and lag is the only signal that shows it early.",
        ],
        callout: {
          kind: "warn",
          title: "Retention interacts badly with lag",
          text: "If a consumer falls further behind than the retention window, the records it has not read are deleted underneath it. The consumer resumes at whatever offset still exists and silently skips everything in between. Monitor lag against retention, not just lag in absolute terms — this is a data-loss scenario that produces no errors at all.",
        },
      },
      {
        heading: "Compaction, and using the log as a table",
        body: [
          "Time-based retention suits events. But for a stream of state changes — a user's current profile, a device's latest configuration — what matters is the most recent value per key, and compaction turns the log into a durable, replayable table.",
        ],
        table: {
          caption: "Two cleanup policies for two different kinds of data.",
          headers: ["Policy", "Keeps", "Good for", "Watch out"],
          rows: [
            [
              "delete",
              "Everything within the retention window",
              "Events, metrics, clickstreams",
              "Slow consumers can be outrun",
            ],
            [
              "compact",
              "The latest record per key, forever",
              "State, configuration, offsets",
              "A key is never removed unless you write a tombstone",
            ],
            [
              "compact + delete",
              "Latest per key, bounded by time",
              "State with a legal retention limit",
              "Two sets of semantics to reason about",
            ],
          ],
        },
        bullets: [
          "Compaction is how the system stores its own consumer offsets, which is a neat demonstration: the broker needs no separate database because a compacted topic is one.",
          "A deletion is a tombstone — a record with a null value — held for a grace period so every consumer sees the delete before it disappears. Without the grace period, a rebuilding consumer misses it entirely.",
          "A compacted topic can be replayed from the beginning to rebuild an entire in-memory view, which is what makes event sourcing and materialised read models practical.",
          "Compaction is background work competing for the same disk bandwidth as the writes. On a saturated broker it falls behind, and the log grows in a way nobody is watching.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Append-only log with consumer-owned offsets",
        pickWhen: "High throughput, replay, and multiple independent consumers",
        cost: "No per-message acknowledgement or priority; redelivery means rewinding",
      },
      {
        choice: "Traditional broker with per-message acks",
        pickWhen: "Task queues needing routing, priorities and dead-lettering",
        cost: "Per-consumer state on the broker, no replay, far lower ceiling",
      },
      {
        choice: "acks=all with min-ISR of two",
        pickWhen: "Data that cannot be re-derived",
        cost: "Higher publish latency and unavailability when replicas are down",
      },
      {
        choice: "Many partitions",
        pickWhen: "Consumer parallelism is the constraint",
        cost: "More leader elections and open files; changing the count later breaks key ordering",
      },
      {
        choice: "Log compaction",
        pickWhen: "The stream represents current state per key",
        cost: "Background I/O, and deletes require explicit tombstones",
      },
      {
        choice: "At-least-once plus idempotent consumers",
        pickWhen: "Almost always — this is the honest default",
        cost: "Every consumer needs a deduplication story of its own",
      },
    ],
    wrapUp: [
      "A queue here is an append-only log and a consumer is a cursor into it. Sequential I/O, page cache and zero-copy are why a single broker moves a gigabyte a second.",
      "Partitions are simultaneously the unit of parallelism, ordering and replication — which is why partition count is the decision teams regret, since changing it later breaks per-key ordering.",
      'Ordering is per partition only. Global ordering means one writer, and saying "the queue preserves order" without that qualifier is the classic overclaim.',
      "Durability is a producer choice between acks=0, 1 and all, and acks=all is only meaningful with a minimum in-sync replica count above one.",
      "At-least-once with idempotent consumers is the achievable guarantee. Exactly-once holds only while the whole loop stays inside the system; external side effects fall outside it.",
      "With more time: tiered storage to decouple retention from broker disks, quotas for multi-tenant fairness, and cross-cluster mirroring for disaster recovery.",
    ],
    followUps: [
      {
        q: "Why is a log faster than a traditional broker?",
        a: "Because it does far less per message. Writes are appends at the end of a file and reads are forward scans, so both stay on the sequential side of a roughly fifteen-to-one disk performance gap, and recently written data is served straight from the operating system's page cache without ever reaching the disk. The broker can then use sendfile to move bytes from page cache to socket without copying them into user space, so the data is barely touched. On top of that the broker keeps almost no state — one committed offset per group per partition rather than delivery state per message per consumer — so the bookkeeping that dominates a traditional broker simply does not exist.",
      },
      {
        q: "A consumer processed a record and crashed before committing the offset. What happens?",
        a: "It is redelivered, and the side effect happens twice unless the consumer is idempotent. That window between processing and committing cannot be closed — committing first turns the duplicate into a loss instead, which is usually worse — so the correct response is to make processing idempotent rather than to chase a guarantee that does not exist. Concretely I would derive a deduplication key from the topic, partition and offset, insert it in the same transaction as the effect, and let a duplicate abort on the conflict. The subtle failure is generating that key fresh on each attempt, which makes every retry look new and quietly defeats the whole mechanism.",
      },
      {
        q: "You need to double the partition count on a live topic. What breaks?",
        a: "Per-key ordering, permanently. The partition is chosen by hashing the key modulo the partition count, so doubling it sends many keys to a different partition while their earlier records stay where they were — and since ordering is only guaranteed within a partition, that key's history is now split across two logs with no ordering between them. Consumers may process a newer record before an older one for the same entity. There is no clean fix after the fact, which is why partition counts are over-provisioned up front; the alternatives are to create a new topic and migrate, or to accept the ordering break for keys that tolerate it.",
      },
      {
        q: "One partition has ten times the traffic of the others. Why, and what do you do?",
        a: "Almost certainly a low-cardinality or skewed partition key — partitioning by country when most users are in one country, or by a tenant id when one tenant dwarfs the rest. The consequence is that one broker absorbs the load and one consumer in each group becomes the bottleneck, so the cluster looks under-utilised while that partition lags. The fix depends on whether ordering for that key is genuinely required: if it is not, add a random suffix to spread the key across partitions; if it is, split the hot tenant into its own topic with its own partitions. The general lesson is that a partition key is chosen for the ordering guarantee you need and then has to be checked for distribution, because those two goals frequently conflict.",
      },
      {
        q: "Does the system support exactly-once delivery?",
        a: "Not in the sense people usually mean, and I would rather be precise than agreeable. Idempotent producers remove duplicates caused by producer retries, and transactions make a consume-transform-produce loop atomic including the offset commit, so exactly-once processing is real when the source and sink are both inside the system. But once the effect leaves — charging a card, sending an email, calling a third party — no protocol between two machines can guarantee an action happened exactly once, because the acknowledgement itself can be lost. The achievable and honest guarantee is at-least-once delivery with an idempotent receiver, and designing for that is far safer than believing a stronger claim.",
      },
    ],
    related: [
      "/hld/message-queues",
      "/hld/pub-sub",
      "/hld/idempotency",
      "/examples/ad-click",
      "/examples/notification",
    ],
    furtherReading: [
      { label: "Kafka design (official)", href: "https://kafka.apache.org/documentation/#design" },
      {
        label: "Jay Kreps — The Log: what every engineer should know",
        href: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying",
      },
    ],
  },

  {
    slug: "distributed-cache",
    title: "Design a Distributed Cache",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["redis", "eviction", "stampede", "invalidation", "hot keys"],
    companies: ["Redis", "Memcached", "CDN edges", "Facebook TAO"],
    summary:
      "Reading from a cache is the easy half and nobody is testing it. The interesting content is everything around the miss: what happens when ten thousand requests miss the same key simultaneously, how a cached value and the database drift apart, what a single viral key does to one node, and why the obvious invalidation order is subtly wrong. A cache is a correctness problem disguised as a performance optimisation.",
    clarifying: [
      {
        q: "What is the read/write ratio and the working set?",
        a: "Assume heavily read-dominated, with a working set far smaller than the total dataset — that is what makes caching work at all. If the access pattern were uniform over a huge keyspace, the hit rate would be poor no matter how much memory I threw at it.",
      },
      {
        q: "How stale is acceptable?",
        a: "This is the question that decides the design. Seconds of staleness allows simple TTLs and gets most of the benefit; strict freshness forces explicit invalidation and a much harder consistency story. I would push for a bounded staleness of a few seconds on almost everything.",
      },
      {
        q: "Cache-aside, read-through, or write-through?",
        a: "Cache-aside, because it keeps the cache out of the write path and degrades gracefully — if the cache is down, the application still works. Read-through hides the logic but couples availability, and write-through pays a cache write on every database write regardless of whether anyone reads it.",
      },
      {
        q: "Does the cache need to survive a restart?",
        a: "Not for correctness, but very much for operations. A cold cache after a restart means every request hits the database at once, so either warm it before taking traffic or restart nodes gradually. Persistence is a restart-time optimisation, not a durability feature.",
      },
      {
        q: "Is this one cache or a tiered one?",
        a: "I would design a small in-process tier in front of a shared remote tier. The local tier absorbs hot keys at zero network cost, and the shared tier gives capacity and a consistent view — the combination is what makes viral keys survivable.",
      },
    ],
    requirements: {
      functional: [
        "get, set and delete by key, with a per-key TTL",
        "Distribute keys across nodes and survive a node failure",
        "Evict sensibly when memory is full",
        "Support explicit invalidation when the underlying data changes",
      ],
      nonFunctional: [
        "Sub-millisecond p99 on a hit, including network",
        "A cache outage must degrade performance, never correctness",
        "A hot key must not take down a node",
        "A miss storm must not take down the database",
      ],
    },
    math: [
      {
        label: "Why hit rate is nonlinear",
        expr: "database load = QPS × (1 − hit rate)",
        result: "95% → 5,000/s; 99% → 1,000/s",
        note: "At 100 K QPS, moving the hit rate from 95% to 99% removes 80% of database load. The last few points of hit rate are worth the most.",
      },
      {
        label: "Working set memory",
        expr: "20 M hot objects × 2 KB",
        result: "≈ 40 GB",
        note: "Plus overhead of roughly 50–100 bytes per key for metadata and allocator rounding — significant when values are small.",
      },
      {
        label: "Node count",
        expr: "40 GB ÷ 16 GB usable per node, × 2 for headroom",
        result: "≈ 6 nodes",
        note: "Sized by memory rather than by throughput; a single node already serves well over 100 K ops/s.",
      },
      {
        label: "Stampede blast radius",
        expr: "100 K QPS × 1 key expiring at 40% of traffic",
        result: "≈ 40 K simultaneous misses",
        note: "All for the same key, all hitting the database within milliseconds. This is the failure mode the design exists to prevent.",
      },
      {
        label: "Cold start after a restart",
        expr: "one node of six lost → 1/6 of keys miss",
        result: "≈ 17 K misses/s on a 100 K QPS service",
        note: "Enough to take down a database that was comfortably serving 5 K/s a moment earlier.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "get(key)",
        desc: "Returns the value or a miss; sub-millisecond, and the only call on the hot path",
      },
      {
        method: "PUT",
        path: "set(key, value, ttl)",
        desc: "Write with an expiry; TTL should carry jitter to avoid synchronised expiry",
      },
      {
        method: "DELETE",
        path: "delete(key)",
        desc: "Explicit invalidation — the correct primitive after a database write",
      },
      {
        method: "GET",
        path: "mget(keys[])",
        desc: "Batch read — one round trip instead of N, which usually matters more than hit rate",
      },
      {
        method: "POST",
        path: "add(key, value, ttl)",
        desc: "Set only if absent — the primitive that implements single-flight locking",
      },
    ],
    dataModel: [
      {
        entity: "entry",
        fields: [
          "key (pk, hashed to a node)",
          "value (opaque bytes)",
          "expires_at",
          "last_accessed (for LRU)",
          "size",
        ],
      },
      {
        entity: "node_ring",
        fields: [
          "token (pk)",
          "node_id",
          "→ consistent hashing so a node loss remaps only its share",
        ],
      },
      {
        entity: "inflight_locks",
        fields: [
          "key:lock (pk)",
          "holder_id",
          "short TTL (~5 s)",
          "→ single-flight: one request refills, the rest wait",
        ],
      },
    ],
    architecture: [
      {
        heading: "Cache-aside, and the invalidation order that is wrong",
        lede: "The pattern is four lines. Getting the write path backwards is the classic bug.",
        code: {
          title: "Delete after the write — never update, never delete first",
          lang: "ts",
          source: `async function read(key: string) {
  const hit = await cache.get(key);
  if (hit !== undefined) return hit;

  const value = await db.load(key);
  // Jittered TTL: a fixed TTL makes everything written together expire
  // together, which manufactures a stampede on a schedule.
  await cache.set(key, value, ttlWithJitter(300));
  return value;
}

async function write(key: string, value: Value) {
  // 1. Database first. If this fails, the cache is untouched and still correct.
  await db.save(key, value);

  // 2. DELETE, do not set. Two concurrent writers that both "set" can leave the
  //    cache holding the older value forever — the writes land in one order in
  //    the database and the opposite order in the cache.
  await cache.delete(key);
}

// Deleting BEFORE the database write is the subtle killer: between the delete
// and the commit, a reader misses, loads the OLD row, and caches it — and that
// stale value now has a full TTL to live. Delete after, and consider deleting
// twice with a short delay if replication lag can serve a stale read.`,
        },
        table: {
          caption: "Four plausible write paths; only one is routinely correct.",
          headers: ["Order", "Race", "Verdict"],
          rows: [
            [
              "Delete cache, then write DB",
              "A reader repopulates from the old row before the commit",
              "Wrong — stale for a full TTL",
            ],
            [
              "Write DB, then set cache",
              "Two writers set in the opposite order to their commits",
              "Wrong — permanently stale",
            ],
            [
              "Write DB, then delete cache",
              "A narrow window where a concurrent reader repopulates",
              "Correct in practice; the standard",
            ],
            [
              "Write DB and cache in a transaction",
              "Not possible — two systems, no atomic commit",
              "Distributed transaction; not worth it",
            ],
          ],
        },
        bullets: [
          "Delete rather than update, because a delete is idempotent and order-independent while a set encodes a value that may already be stale by the time it lands.",
          "Keep the cache out of the write path's correctness. If the delete fails, the TTL is the backstop — which is a good reason never to use an infinite TTL, even on data you invalidate explicitly.",
          "With read replicas, a delete can be followed immediately by a read that repopulates from a lagging replica. Delayed double-delete — invalidate again after a second — is the usual pragmatic fix.",
          "Negative caching matters: a key that does not exist should be cached as absent for a short time, or every lookup for a missing id becomes a database query, which is an easy denial-of-service vector.",
        ],
        callout: {
          kind: "interview",
          title: "The line that shows you have run one of these",
          text: '"I delete rather than update the cache, and I delete after the database write rather than before. Deleting before leaves a window where a reader caches the pre-write value with a full TTL, and setting instead of deleting lets two concurrent writers commit in one order and update the cache in the other." That sentence distinguishes someone who has operated a cache from someone who has read about one.',
        },
      },
      {
        heading: "Placement, and what a node loss costs",
        lede: "Consistent hashing, for the reason it was invented.",
        diagram: {
          kind: "flow",
          caption: "Clients route directly; there is no proxy on the hot path.",
          rows: [
            [
              { id: "app", label: "App fleet", sub: "ring in process" },
              { id: "l1", label: "L1: in-process", sub: "hot keys, ~1 s TTL", tone: "ok" },
            ],
            [
              { id: "ring", label: "Consistent hash ring", sub: "200 vnodes/node", tone: "accent" },
              { id: "n", label: "Cache nodes", sub: "shared L2" },
              { id: "db", label: "Origin database", sub: "must never see a storm" },
            ],
          ],
        },
        bullets: [
          "Consistent hashing means losing one of six nodes invalidates one sixth of the keyspace rather than all of it — the difference between a noticeable dip and an outage.",
          "Clients hold the ring and route directly, which removes a network hop from every operation. The cost is that clients can hold stale topology, so the ring needs a version.",
          "Replicating cache entries is usually the wrong instinct: it doubles memory to protect data that is by definition reconstructible. Spend that memory on a bigger working set instead.",
          "The exception is a hot key, where replication is exactly right — but there the copy belongs in the in-process tier, not in a second remote node.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "The stampede",
        lede: "The failure that takes down the database, and the reason caches get blamed for outages.",
        diagram: {
          kind: "sequence",
          caption: "Single-flight: one request refills, everyone else waits for it.",
          actors: [
            { id: "r", label: "40,000 requests" },
            { id: "c", label: "Cache" },
            { id: "one", label: "The elected loader" },
            { id: "db", label: "Database" },
          ],
          messages: [
            {
              from: "r",
              to: "c",
              label: "1. get(hot_key) → miss, all at once",
              kind: "call",
              tone: "warn",
            },
            {
              from: "r",
              to: "c",
              label: "2. add(hot_key:lock) — atomic, only one wins",
              kind: "call",
            },
            { from: "c", to: "one", label: "3. you hold the lock", kind: "return", tone: "accent" },
            { from: "one", to: "db", label: "4. a single query", kind: "call", tone: "ok" },
            { from: "db", to: "one", label: "5. value", kind: "return" },
            { from: "one", to: "c", label: "6. set + release lock", kind: "call" },
            {
              from: "c",
              to: "r",
              label: "7. the other 39,999 retry and hit",
              kind: "return",
              tone: "ok",
            },
          ],
        },
        table: {
          caption: "Three mechanisms; use all of them, they solve different problems.",
          headers: ["Technique", "Solves", "Cost"],
          rows: [
            [
              "Single-flight lock",
              "Many misses on the SAME key at once",
              "Waiting requests, and a lock TTL to tune",
            ],
            [
              "TTL jitter",
              "Many DIFFERENT keys expiring simultaneously",
              "Slightly less predictable freshness",
            ],
            [
              "Early recomputation",
              "The expiry moment itself",
              "Some values refreshed before they are needed",
            ],
            [
              "Serve stale while revalidating",
              "Availability during a slow origin",
              "Users briefly see old data",
            ],
          ],
        },
        code: {
          title: "Probabilistic early expiry — refresh before the cliff",
          lang: "ts",
          source: `// Rather than every request racing at the instant of expiry, each request has
// a small, growing chance of refreshing early. Close to expiry the probability
// rises, so one request usually refreshes while the value is still valid and
// nobody ever experiences a miss on a hot key.
function shouldRefreshEarly(entry: Entry, beta = 1.0): boolean {
  const now = Date.now();
  const remaining = entry.expiresAt - now;
  if (remaining <= 0) return true;

  // delta = how long the recomputation took last time. Expensive values start
  // refreshing earlier, which is exactly the behaviour you want.
  return Math.random() < Math.exp(-beta * remaining / entry.delta);
}`,
        },
        bullets: [
          "Fixed TTLs on data loaded together create synchronised expiry, so a deploy that warms the cache manufactures a stampede one TTL later. Jitter is a one-line fix for a recurring outage.",
          "Serving a stale value while one request refreshes in the background is usually the right trade: a few seconds of staleness beats a queue of blocked requests.",
          "The lock needs a short TTL of its own. A loader that crashes holding the lock must not block every other request until someone notices.",
          "The same pattern applies to a cold start. Bringing an empty node into rotation gradually, or warming it first, prevents a self-inflicted version of this.",
        ],
      },
      {
        heading: "Hot keys",
        body: [
          "Consistent hashing spreads distinct keys evenly and does nothing at all for a single key taking a large share of traffic. One celebrity, one viral post, one misconfigured client polling the same key — and one node in the cluster is saturated while the others idle.",
        ],
        bullets: [
          "The effective answer is a small in-process cache in front of the shared tier with a very short TTL. A one-second local TTL on a key receiving 40,000 requests per second collapses it to one remote read per process per second, and the staleness is invisible.",
          "Key splitting — writing the value under several suffixed keys and reading a random one — spreads a hot key across nodes at the cost of multiplying invalidation work.",
          "Detection has to exist before mitigation: sample request keys and track the top talkers, or the first sign of a hot key is a node falling over.",
          "This is also where request coalescing inside a single process helps: a thousand concurrent requests in one application instance should produce one remote fetch, not a thousand.",
        ],
        callout: {
          kind: "insight",
          text: "The in-process tier is undervalued in interviews. It has zero network cost, it absorbs exactly the traffic pattern that hurts a shared cache most, and its consistency weakness — every process holds its own copy — is bounded by making the TTL a second or two. Almost every large system that survives viral traffic has one.",
        },
      },
      {
        heading: "Eviction and memory behaviour",
        body: [
          "Eviction policy gets more interview attention than it deserves, but memory behaviour genuinely matters: a cache that fragments or that evicts the wrong things quietly loses its hit rate, and hit rate is what the whole system is buying.",
        ],
        table: {
          caption: "What each policy actually optimises for.",
          headers: ["Policy", "Keeps", "Weak against", "Use"],
          rows: [
            ["LRU", "Recently used", "A scan that touches everything once", "The sensible default"],
            [
              "LFU",
              "Frequently used",
              "Shifting popularity; needs ageing",
              "Stable skewed workloads",
            ],
            [
              "TTL only",
              "Whatever has not expired",
              "Memory pressure — nothing is evicted early",
              "Predictable freshness needs",
            ],
            [
              "Segmented / W-TinyLFU",
              "Frequent, with a scan-resistant window",
              "Complexity",
              "What modern libraries actually implement",
            ],
            [
              "Random",
              "Nothing in particular",
              "Intuition",
              "Surprisingly competitive, and trivial",
            ],
          ],
        },
        bullets: [
          "Strict LRU requires updating a list on every read, which is a write on the hot path and a contention point. Approximate LRU — sampling a handful of keys and evicting the oldest — is what production systems do.",
          "Slab allocation avoids fragmentation but wastes space when value sizes do not match slab classes, and it can produce the confusing state where one size class is full while memory is free.",
          "Watch the eviction rate as a first-class metric. Rising evictions mean the working set has outgrown memory, and the hit rate is about to fall off a cliff.",
          "Set a memory limit and an eviction policy explicitly. A cache with no limit becomes a memory exhaustion incident, and one that refuses writes when full becomes an availability incident.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Cache-aside",
        pickWhen: "Default — keeps the cache off the write path and degrades gracefully",
        cost: "Invalidation logic lives in application code, and the first read always misses",
      },
      {
        choice: "Write-through",
        pickWhen: "Reads must never miss after a write",
        cost: "Every write pays cache cost even for data nobody reads",
      },
      {
        choice: "Short TTL everywhere",
        pickWhen: "Bounded staleness is acceptable",
        cost: "Lower hit rate and more origin load than explicit invalidation",
      },
      {
        choice: "Explicit invalidation",
        pickWhen: "Freshness matters and writes are comparatively rare",
        cost: "Every write path must know which keys it affects — easy to miss one",
      },
      {
        choice: "In-process L1 tier",
        pickWhen: "Hot keys or extreme read volume",
        cost: "Per-process copies with independent staleness",
      },
      {
        choice: "Single-flight on miss",
        pickWhen: "Always, on anything expensive to compute",
        cost: "Blocked requests during a refill, and a lock TTL to get right",
      },
    ],
    wrapUp: [
      "Hit rate is nonlinear in its effect: going from 95% to 99% removes four fifths of the remaining database load, which is why the last few points are worth chasing.",
      "The write path is where correctness is won — delete rather than set, and delete after the database write, because both alternatives have races that leave the cache stale for a full TTL.",
      "The stampede is the failure that causes outages. Single-flight locking, TTL jitter and early recomputation solve different parts of it and belong together.",
      "Consistent hashing bounds the damage of a node loss to its share of the keyspace, but does nothing for a hot key — that needs an in-process tier or key splitting.",
      "Never give the cache authority over correctness. If it is empty or unavailable, the system should be slower and still right, which is why TTLs back up explicit invalidation.",
      "With more time: cross-region cache coherence, warm-up on deploy, and per-tenant quotas so one workload cannot evict everyone else's data.",
    ],
    followUps: [
      {
        q: "Why delete the cache entry instead of updating it?",
        a: "Because a delete is idempotent and order-independent while a set carries a value that may already be out of date by the time it arrives. If two writers update the same row, the database applies them in one order while their cache writes can arrive in the opposite order, leaving the cache permanently holding the older value with no mechanism to notice. A delete has no such failure mode: whichever delete lands last, the next read repopulates from the database. The cost is one extra miss after each write, which is a small price for removing an entire class of permanent staleness.",
      },
      {
        q: "Walk me through what happens when a very popular key expires.",
        a: "Without protection, every request that was being served from that key misses at the same instant and goes to the database — at a hundred thousand requests a second with one key carrying a large share, that is tens of thousands of identical queries arriving within milliseconds, which is usually enough to take the database down and then keep it down as retries pile up. The fix is layered: an atomic add operation elects a single request to do the reload while the others briefly wait or serve the stale value, jitter on TTLs so keys do not expire in lockstep, and probabilistic early refresh so a hot key is renewed slightly before it expires and never actually misses. In practice I would use all three, because they address different triggers.",
      },
      {
        q: "One key is receiving 40% of all cache traffic. Consistent hashing does not help — what does?",
        a: "Correct, and it is worth stating plainly that hashing distributes distinct keys and a single key is one point on the ring regardless of virtual nodes. The most effective fix is a small in-process cache in front of the shared tier with a one or two second TTL: forty thousand requests a second collapse to one remote read per process per second, the network cost disappears entirely, and the staleness is far below what anyone notices. If that is not enough, I would split the key into a handful of suffixed copies spread across nodes and read one at random, accepting that invalidation now has to touch all of them. Either way, detection has to come first — sampling the top keys — because otherwise the first symptom is a saturated node.",
      },
      {
        q: "Your entire cache cluster fails. What happens to the system?",
        a: "Every request falls through to the database, which is now seeing perhaps twenty times its normal load, so the realistic outcome is that the database also fails unless the design anticipated this. The mitigations are a load shedder or circuit breaker in front of the origin so it serves a reduced volume successfully rather than collapsing entirely, single-flight so that concurrent misses for the same key still produce one query, and an in-process tier that keeps serving the hottest keys even with the shared cluster gone. The principle is that a cache outage must degrade performance rather than correctness — and the honest admission is that many systems are quietly dependent on their cache for capacity, which means the cache is part of the availability story whether or not anyone designed it that way.",
      },
      {
        q: "Why is deleting the cache before writing to the database wrong?",
        a: "Because it opens a window in which a reader repopulates the cache with the pre-write value. The sequence is: writer deletes the key, reader misses, reader loads the old row because the write has not committed yet, reader caches that old value with a fresh full TTL, and then the write commits — leaving the cache stale for the entire TTL rather than for a few milliseconds. Deleting after the commit narrows the window to the gap between commit and delete, and any reader that repopulates in that window gets the new value anyway. The residual case is read replicas, where a read immediately after the delete can still see the old row through replication lag; the usual pragmatic answer there is to delete a second time after a short delay.",
      },
    ],
    related: [
      "/hld/caching",
      "/hld/consistent-hashing",
      "/lld/lru-cache",
      "/playgrounds/lru-cache",
      "/examples/consistent-hashing",
    ],
    furtherReading: [
      {
        label: "Facebook — Scaling Memcache at Facebook (NSDI)",
        href: "https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "distributed-lock",
    title: "Design a Distributed Locking Service",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 22,
    tags: ["consensus", "leases", "fencing", "chubby", "raft"],
    companies: ["Chubby", "ZooKeeper", "etcd", "Consul"],
    summary:
      'The question sounds like "implement a mutex over the network" and is really about a much sharper point: a distributed lock cannot actually prevent two processes from believing they hold it. A garbage collection pause is indistinguishable from a crash, a lease can expire while the holder is still running, and the holder finds out too late. The design that works does not try to prevent that — it makes the stale holder\'s writes harmless with a fencing token.',
    clarifying: [
      {
        q: "Is the lock for efficiency or for correctness?",
        a: "This is the first question and it changes everything. For efficiency — avoiding duplicated work like generating the same report twice — an occasional double execution is merely wasteful and a simple lock is fine. For correctness, where two holders would corrupt data, a lock alone is insufficient and the protected resource has to participate through fencing.",
      },
      {
        q: "What happens if the lock holder dies while holding it?",
        a: "It must be released automatically, which means leases with a TTL rather than locks held until explicitly freed. A lock that requires an explicit unlock deadlocks the moment a holder crashes, and holders crash.",
      },
      {
        q: "How long is a lock typically held, and at what rate?",
        a: "Seconds to minutes, at modest rates — hundreds or low thousands per second. If the answer were hundreds of thousands per second I would question the design entirely, because that usually indicates locking at the wrong granularity.",
      },
      {
        q: "Can the protected resource reject a write?",
        a: "Crucial question. If it can check and reject a token, real correctness is achievable. If it cannot — an arbitrary third-party API, say — then no locking scheme gives safety and I should say so rather than pretending otherwise.",
      },
      {
        q: "Availability or safety when the lock service is partitioned?",
        a: "Safety. A lock service that keeps granting locks during a partition is worse than useless, so it should be a consensus-backed system that becomes unavailable rather than inconsistent.",
      },
    ],
    requirements: {
      functional: [
        "Acquire a named lock with a lease, and renew it while work continues",
        "Release explicitly, and release automatically when the lease expires",
        "Hand out a monotonically increasing token with every grant",
        "Let a waiter be notified when a lock becomes available",
      ],
      nonFunctional: [
        "At most one valid holder at a time, from the protected resource's point of view",
        "A crashed holder must not block the lock indefinitely",
        "Prefer unavailability over granting the same lock twice",
        "Acquisition latency in single-digit milliseconds",
      ],
    },
    math: [
      {
        label: "Consensus write cost",
        expr: "Raft: leader + majority fsync + round trip",
        result: "≈ 2–10 ms per grant",
        note: "Every acquire is a replicated write. This is why a distributed lock at 100 K/s is the wrong design rather than a tuning problem.",
      },
      {
        label: "The dangerous pause",
        expr: "stop-the-world GC on a large heap",
        result: "hundreds of ms to several seconds",
        note: "Longer than many lease TTLs. The process resumes with no idea that time passed — the core of the safety problem.",
      },
      {
        label: "Lease TTL choice",
        expr: "TTL > max pause + clock error + network delay",
        result: "typically 10–30 s",
        note: "Too short risks losing a lease while working; too long means a crashed holder blocks others for that duration.",
      },
      {
        label: "Renewal interval",
        expr: "TTL ÷ 3",
        result: "renew every ~5 s on a 15 s lease",
        note: "Two renewals can fail before the lease is lost, which absorbs transient network trouble without weakening the bound.",
      },
      {
        label: "Failover window",
        expr: "election timeout + leader catch-up",
        result: "≈ 1–5 s of unavailability",
        note: "During which no locks are granted — and that is correct behaviour, not a bug to design around.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/locks/{name}/acquire",
        desc: "Blocking or immediate; returns {token, leaseExpiresAt} — the token is the important half",
      },
      {
        method: "POST",
        path: "/v1/locks/{name}/renew",
        desc: "Extend the lease; fails if it already expired, which the holder must treat as fatal",
      },
      {
        method: "POST",
        path: "/v1/locks/{name}/release",
        desc: "Explicit release, valid only with the current token",
      },
      {
        method: "GET",
        path: "/v1/locks/{name}",
        desc: "Current holder and token — for diagnostics, never as the basis for a decision",
      },
      {
        method: "GET",
        path: "/v1/locks/{name}/watch",
        desc: "Notify on release; a watch on the predecessor avoids a thundering herd",
      },
    ],
    dataModel: [
      {
        entity: "locks",
        fields: [
          "name (pk)",
          "holder_session_id",
          "token (monotonic, never reused)",
          "lease_expires_at",
          "→ replicated through Raft; every field change is a consensus write",
        ],
      },
      {
        entity: "sessions",
        fields: [
          "session_id (pk)",
          "client_id",
          "last_heartbeat",
          "ttl",
          "→ one heartbeat covers every lock a client holds",
        ],
      },
      {
        entity: "wait_queue",
        fields: [
          "lock_name (pk)",
          "sequence (pk, monotonic)",
          "session_id",
          "→ ordered waiters; each watches only its predecessor",
        ],
      },
    ],
    architecture: [
      {
        heading: "Leases, not locks",
        lede: "The holder cannot be trusted to release, so the grant has to expire on its own.",
        diagram: {
          kind: "sequence",
          caption: "Consensus underneath means a grant survives the failure of any single node.",
          actors: [
            { id: "c", label: "Client" },
            { id: "l", label: "Lock leader" },
            { id: "r", label: "Raft followers" },
            { id: "res", label: "Protected resource" },
          ],
          messages: [
            { from: "c", to: "l", label: '1. acquire("job:nightly")', kind: "call" },
            {
              from: "l",
              to: "r",
              label: "2. replicate {holder, token: 34, ttl: 15 s}",
              kind: "call",
            },
            { from: "r", to: "l", label: "3. majority committed", kind: "return" },
            { from: "l", to: "c", label: "4. granted, token 34", kind: "return", tone: "ok" },
            { from: "c", to: "l", label: "5. renew every 5 s", kind: "async" },
            {
              from: "c",
              to: "res",
              label: "6. write, carrying token 34",
              kind: "call",
              tone: "accent",
            },
            { from: "res", to: "res", label: "7. 34 ≥ last seen? accept and record", kind: "self" },
          ],
        },
        bullets: [
          "The lease is the only thing that makes a crashed holder recoverable. Without an expiry, a process that dies holding a lock blocks the resource until a human intervenes.",
          "Sessions generalise this: one heartbeat keeps every lock a client holds alive, so a dead client loses all of them at once rather than each on its own schedule.",
          "The service must be consensus-backed — Raft or Paxos — because a lock granted by a node that has been partitioned away is exactly the failure the lock exists to prevent. This is a CP system by necessity.",
          "Prefer unavailability during an election over granting locks optimistically. A few seconds of no grants is a correct answer; two holders is not.",
        ],
        callout: {
          kind: "warn",
          title: "Clocks are not the mechanism",
          text: "A lease is not safe because the client's clock says it has time left. Clock skew, NTP steps and virtual machine suspension all break that assumption. The safe framing is that the SERVER decides expiry and the client treats its lease as advisory — and the client should measure elapsed time with a monotonic clock, not wall time, so an NTP correction cannot appear to extend its lease.",
        },
      },
      {
        heading: "Fencing: the part that actually provides safety",
        lede: "Accept that two processes can believe they hold the lock, and make the stale one harmless.",
        diagram: {
          kind: "flow",
          caption: "The resource, not the lock service, enforces mutual exclusion.",
          rows: [
            [
              { id: "a", label: "Client A", sub: "token 33, then paused", tone: "warn" },
              { id: "b", label: "Client B", sub: "token 34", tone: "ok" },
            ],
            [
              { id: "res", label: "Resource", sub: "remembers highest token seen", tone: "accent" },
              { id: "acc", label: "accept 34", sub: "34 > 33" },
              { id: "rej", label: "reject 33", sub: "33 < 34", tone: "bad" },
            ],
          ],
        },
        code: {
          title: "Why a lock without fencing is not mutual exclusion",
          lang: "ts",
          source: `// THE FAILURE, in order:
//  1. A acquires the lock, token 33.
//  2. A pauses — a 20 s stop-the-world GC. It is alive but frozen.
//  3. A's lease expires. The service grants the lock to B, token 34.
//  4. B does its work and writes.
//  5. A resumes. From A's point of view NOTHING happened; it still "holds"
//     the lock and proceeds to write, corrupting B's work.
//
// No lock service can prevent step 5 — A never learns it was suspended until
// after it has already acted. The resource must reject the stale write.

async function writeWithFencing(resource: Resource, lock: Lock, data: Data) {
  // The token is monotonic and issued by consensus, so a later grant always
  // carries a strictly greater number than any earlier one.
  await resource.write(data, { fencingToken: lock.token });
}

// Enforcement lives in the resource:
function handleWrite(data: Data, token: number) {
  if (token < this.highestTokenSeen) {
    throw new StaleTokenError();   // A's token 33 arrives after B's 34
  }
  this.highestTokenSeen = token;
  this.apply(data);
}`,
        },
        bullets: [
          "The token must come from the lock service and be monotonic across grants — a client-generated id or a timestamp does not have the required ordering property.",
          "Many resources already support this under another name: a conditional write on a version, a compare-and-swap, an if-match header, or an object storage precondition. Reusing the existing mechanism is usually better than inventing a token field.",
          "If the resource genuinely cannot reject a stale write, then the system cannot be made safe by locking, and the honest design is to make the operation idempotent instead so that a duplicate is harmless.",
          "This is why Redlock is contested: the argument against it is not about the number of Redis nodes, it is that no lock protocol provides safety without the resource checking a token.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "What the holder must do",
        body: [
          "Most of the danger lives on the client side. A holder that assumes it still has the lock because it acquired one is the source of essentially every real incident with distributed locking.",
        ],
        code: {
          title: "Check the lease around every unit of work, not once at the start",
          lang: "ts",
          source: `async function runWithLock(name: string, work: () => Promise<void>) {
  const lock = await lockService.acquire(name, { ttlMs: 15_000 });
  const renewer = startRenewing(lock, { everyMs: 5_000 });

  try {
    for (const item of items) {
      // Re-check before EACH unit. Checking once at the start is the classic
      // bug: a five-minute job holds a fifteen-second lease it may have lost
      // in the first thirty seconds and never notices.
      if (!lock.isProbablyValid()) throw new LostLockError();
      await processItem(item, lock.token);   // token travels with the work
    }
  } finally {
    renewer.stop();
    await lock.release().catch(() => {
      // Release failing is fine — the lease expires on its own. Never retry
      // a release forever; that is how a client blocks its own shutdown.
    });
  }
}

// And if renewal fails, the holder must STOP work immediately rather than
// optimistically continuing — it is now the stale holder in the fencing story.`,
        },
        bullets: [
          "Measure remaining lease time with a monotonic clock. Wall-clock time can jump backwards or forwards under NTP and make an expired lease look valid.",
          "A failed renewal is not a retry situation, it is a stop signal. Continuing after losing the lease is precisely the scenario fencing exists to contain, and the client should not rely on being contained.",
          "Keep the work well inside the lease. If a unit of work can take longer than the TTL, either raise the TTL or make the work resumable — do not hope.",
          "Release in a finally block, but do not treat release failure as an error worth retrying: the lease expiring is the backstop, and blocking shutdown on a release is worse than an extra few seconds of lock hold.",
        ],
      },
      {
        heading: "Waiting without a thundering herd",
        body: [
          "If every waiter watches the lock itself, releasing it wakes all of them simultaneously and they all attempt to acquire — a herd that is worst exactly when the lock is most contended. The classic fix is a queue where each waiter watches only the one ahead of it.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Each waiter watches its predecessor, so a release wakes exactly one client.",
          actors: [
            { id: "c1", label: "Client 1", sub: "seq 7, holder" },
            { id: "c2", label: "Client 2", sub: "seq 8" },
            { id: "c3", label: "Client 3", sub: "seq 9" },
            { id: "s", label: "Lock service" },
          ],
          messages: [
            { from: "c2", to: "s", label: "1. enqueue → seq 8, watch seq 7", kind: "call" },
            { from: "c3", to: "s", label: "2. enqueue → seq 9, watch seq 8", kind: "call" },
            { from: "c1", to: "s", label: "3. release seq 7", kind: "call" },
            {
              from: "s",
              to: "c2",
              label: "4. predecessor gone → you hold it, token 35",
              kind: "async",
              tone: "ok",
            },
            { from: "s", to: "c3", label: "5. …not notified at all", kind: "async" },
          ],
        },
        bullets: [
          "Sequential queueing also gives fairness, which prevents the starvation that a free-for-all retry loop can produce under sustained contention.",
          "A waiter that disappears must be removed from the queue by its session expiring, or the queue head becomes a permanently stuck node blocking everyone behind it.",
          "Offer a non-blocking acquire as well. Many callers would rather skip the work than wait — a nightly job that another instance is already running should exit, not queue.",
          "Bound the wait. An unbounded blocking acquire turns lock service latency into caller latency and propagates a local problem across the system.",
        ],
      },
      {
        heading: "When not to use a distributed lock",
        lede: "The strongest answer often includes not needing one.",
        table: {
          caption: "Most locking requirements dissolve under a different framing.",
          headers: ["Goal", "Lock-free alternative", "Why it is better"],
          rows: [
            [
              "Only one worker processes a job",
              "Partition jobs by key across workers",
              "No coordination at all — ownership is structural",
            ],
            [
              "Do not apply an update twice",
              "Idempotency key on the operation",
              "Safe under retries and duplicates, not just concurrency",
            ],
            [
              "Do not overwrite a concurrent edit",
              "Conditional write on a version (CAS)",
              "The database already provides it, atomically",
            ],
            [
              "One leader for a task",
              "Leader election with a lease",
              "Same primitive, but amortised over many operations",
            ],
            [
              "Serialise access to a row",
              "A database transaction",
              "Real ACID guarantees rather than an advisory hint",
            ],
          ],
        },
        bullets: [
          "Locking at the wrong granularity is the usual smell. A lock acquired per row at high rate should almost always be a database transaction instead.",
          "Leader election is the pattern that actually scales: acquire one lease, hold it while healthy, and do many operations under it rather than acquiring a lock per operation.",
          "Partitioning removes the need for mutual exclusion entirely by making ownership a property of the key, which is why a queue with partitioned consumers rarely needs locks.",
          "If you do need a lock, prefer one that the resource can enforce — a conditional write is a lock whose enforcement point is in exactly the right place.",
        ],
        callout: {
          kind: "interview",
          title: "The answer that lands",
          text: '"A distributed lock cannot guarantee mutual exclusion on its own, because a paused process cannot tell that its lease expired. So I would use leases for liveness, fencing tokens for safety, and — before any of that — check whether partitioning or a conditional write removes the need for a lock at all." That framing shows you understand what the primitive can and cannot do.',
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Consensus-backed lock service (etcd, ZooKeeper)",
        pickWhen: "Correctness matters and unavailability is preferable to double-granting",
        cost: "A few milliseconds per grant and unavailability during elections",
      },
      {
        choice: "Single Redis instance with SET NX PX",
        pickWhen: "Efficiency locks where a rare double execution is merely wasteful",
        cost: "No safety guarantee; a failover can grant the lock twice",
      },
      {
        choice: "Fencing tokens",
        pickWhen: "Any lock protecting correctness",
        cost: "The resource must be modified to check and store the highest token",
      },
      {
        choice: "Long lease TTL",
        pickWhen: "Long operations or environments with long pauses",
        cost: "A crashed holder blocks the lock for that whole duration",
      },
      {
        choice: "Queued waiters watching a predecessor",
        pickWhen: "Contended locks with many waiters",
        cost: "More state in the service and stuck-head cases to handle",
      },
      {
        choice: "No lock — partition or use CAS",
        pickWhen: "Whenever it is possible, which is more often than expected",
        cost: "Requires restructuring the problem rather than adding a component",
      },
    ],
    wrapUp: [
      "The central fact: a distributed lock cannot prevent two processes from believing they hold it, because a paused process cannot detect that its lease expired until after it has acted.",
      "Leases give liveness — a crashed holder is recovered automatically — but they do not give safety on their own.",
      "Fencing tokens give safety, and they move enforcement to the resource, which is the only place that can actually reject a stale write. Many resources already offer this as a conditional write.",
      "The service must be consensus-backed and should choose unavailability over granting a lock twice, because an available-but-wrong lock service is worse than no lock service.",
      "Clients are where incidents originate: re-check the lease around every unit of work, use a monotonic clock, and treat a failed renewal as a stop signal rather than a retry.",
      "Best of all is not needing the lock — partitioning, idempotency keys and conditional writes remove most requirements for one.",
    ],
    followUps: [
      {
        q: "A client acquires a lock, then pauses for 20 seconds in garbage collection. What happens?",
        a: "Its lease expires, the service grants the lock to another client, that client does its work, and then the first client resumes with absolutely no indication that any time passed and proceeds to write as though it still holds the lock. This is the fundamental problem, and no lock service can prevent it — the paused process cannot observe its own suspension. The mitigation is fencing: each grant carries a monotonically increasing token, the client passes it with every write, and the resource records the highest token it has seen and rejects anything lower. The first client's write arrives with the older token and is refused. Without that, the lock is an advisory hint rather than mutual exclusion.",
      },
      {
        q: "Is Redlock safe?",
        a: "It depends entirely on what the lock is for, and the disagreement is often talked about as being about Redis when it is really about fencing. For efficiency locks — avoiding duplicated work where a rare double execution just wastes effort — Redlock is fine and the multi-node scheme reduces the chance of a failover granting the lock twice. For correctness locks it is not sufficient, but neither is any other lock protocol that does not involve the protected resource, because the pause scenario defeats all of them. Kleppmann's argument is exactly that: safety comes from the resource checking a monotonic token, so if you have fencing you do not need Redlock's complexity, and if you do not have fencing, Redlock does not rescue you.",
      },
      {
        q: "How do you choose the lease TTL?",
        a: "It has to exceed the worst realistic pause plus clock error plus network delay, which in a garbage-collected runtime with a large heap means seconds rather than milliseconds — typically ten to thirty. Too short and healthy holders lose their lease mid-operation, which causes spurious failures and, worse, trains people to ignore lost-lease errors. Too long and a genuinely crashed holder blocks the lock for that entire window, which is the direct cost of the safety margin. I would renew at about a third of the TTL so two consecutive renewal failures can be absorbed, and I would size the TTL from measured pause percentiles rather than intuition. Where operations can exceed any sensible TTL, the right answer is to make the work resumable rather than to extend the lease indefinitely.",
      },
      {
        q: "The lock service is partitioned. Should it keep granting locks?",
        a: "No. A lock service that stays available during a partition can grant the same lock on both sides, which is precisely the situation the lock was introduced to prevent — it would be actively worse than not having one, because callers believe they are protected. So it should be a CP system: a Raft or Paxos majority is required to grant, and the minority side refuses. Practically that means a few seconds of unavailability during a leader election, during which acquires fail and callers either wait or skip their work. Existing leaseholders can continue until their leases expire, which is safe because no new grant can be made without a majority. Designing callers to handle 'lock unavailable' gracefully is part of the answer.",
      },
      {
        q: "When would you tell someone not to use a distributed lock at all?",
        a: "Most of the time, honestly. If the goal is that only one worker handles a given job, partitioning by key gives that structurally with no coordination — this is why a partitioned queue rarely needs locks. If the goal is not applying an operation twice, an idempotency key is stronger, because it also protects against retries and duplicates that have nothing to do with concurrency. If the goal is not clobbering a concurrent edit, a conditional write on a version does it atomically inside the database that already owns the data. A distributed lock is the right tool mainly for coarse, long-lived exclusivity such as leader election, where one lease is amortised over a great deal of work — and even then the writes it protects should carry a fencing token.",
      },
    ],
    related: [
      "/hld/consensus",
      "/hld/availability",
      "/hld/idempotency",
      "/examples/kv-store",
      "/examples/job-scheduler",
    ],
    furtherReading: [
      {
        label: "How to do distributed locking — Kleppmann",
        href: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html",
      },
      {
        label: "The Chubby lock service — Google",
        href: "https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
