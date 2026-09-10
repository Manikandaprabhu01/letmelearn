import type { Concept } from "@/data/types";

export const hldData: Concept[] = [
  {
    slug: "replication",
    title: "Replication",
    subtitle: "More copies means more reads, better durability, and a lag you must design around.",
    level: "intermediate",
    minutes: 16,
    tags: ["databases", "availability", "consistency"],
    summary:
      "Replication keeps the same data on several machines. It buys read capacity, survives a machine loss, and puts data near users. It costs you consistency: the moment there is more than one copy, they can disagree, and every user-visible bug in a replicated system traces back to that gap.",
    keyPoints: [
      "Single-leader is the default: one node accepts writes, followers replicate and serve reads.",
      "Asynchronous replication is fast and can lose committed writes on failover; synchronous is durable and slow.",
      "Semi-synchronous — wait for one follower — is the practical middle ground.",
      "Replication lag causes read-your-writes and monotonic-read anomalies; route around it deliberately.",
      "Multi-leader and leaderless buy write availability at the price of conflict resolution.",
    ],
    sections: [
      {
        heading: "Three topologies",
        diagram: {
          kind: "compare",
          caption: "Who may accept a write is the question that defines each.",
          options: [
            {
              title: "Single leader",
              sub: "Postgres, MySQL, MongoDB",
              tone: "ok",
              good: [
                "No write conflicts, ever — one node orders all writes",
                "Simple mental model and mature tooling",
                "Read scaling is just adding followers",
              ],
              bad: [
                "Write throughput capped by one machine",
                "Failover has a window where writes fail",
                "Followers are stale by the replication lag",
              ],
              verdict: "Almost always the right first answer.",
            },
            {
              title: "Multi leader",
              sub: "Multi-region actives, CRDT stores",
              good: ["Writes accepted in every region — low write latency worldwide", "Survives a region loss for writes"],
              bad: [
                "Write conflicts are guaranteed and must be resolved",
                "Auto-increment ids and uniqueness constraints break",
                "Very hard to reason about; debugging is painful",
              ],
              verdict: "Genuinely global write traffic, or offline-first clients.",
            },
            {
              title: "Leaderless",
              sub: "Dynamo, Cassandra, Riak",
              good: [
                "No failover — any node takes a write",
                "Tunable consistency per query via quorums",
                "Excellent availability under partition",
              ],
              bad: [
                "Application may see conflicting versions and must merge",
                "Read repair and anti-entropy are extra machinery",
                "No transactions across keys",
              ],
              verdict: "Write-heavy, availability-first workloads at scale.",
            },
          ],
        },
      },
      {
        heading: "Synchronous, asynchronous, and the honest middle",
        diagram: {
          kind: "sequence",
          caption: "Semi-synchronous: acknowledge after one follower has it durably.",
          actors: [
            { id: "c", label: "Client" },
            { id: "l", label: "Leader" },
            { id: "f1", label: "Follower 1", sub: "sync" },
            { id: "f2", label: "Follower 2", sub: "async" },
          ],
          messages: [
            { from: "c", to: "l", label: "INSERT ...", kind: "call" },
            { from: "l", to: "l", label: "write to WAL, fsync", kind: "self" },
            { from: "l", to: "f1", label: "stream WAL record", kind: "call", tone: "accent" },
            { from: "f1", to: "l", label: "ack (durable on 2 machines)", kind: "return", tone: "ok" },
            { from: "l", to: "c", label: "COMMIT ok", kind: "return", tone: "ok", note: "latency = leader fsync + 1 RTT" },
            { from: "l", to: "f2", label: "stream WAL record", kind: "async", note: "does not block the client" },
          ],
        },
        table: {
          headers: ["Mode", "Write latency", "On leader loss", "Use when"],
          rows: [
            [
              "Asynchronous",
              "Leader fsync only",
              "Recently acknowledged writes can be lost",
              "Analytics, caches, anything where a few lost seconds is acceptable",
            ],
            [
              "Semi-synchronous",
              "+1 RTT to the nearest follower",
              "No loss if at least that follower survives",
              "The default for systems that hold money or user content",
            ],
            [
              "Fully synchronous",
              "+1 RTT to the slowest follower",
              "No loss",
              "Rarely — one slow follower stalls every write",
            ],
            [
              "Quorum (w + r > n)",
              "+1 RTT to the ⌈n/2⌉-th fastest",
              "No loss with a majority",
              "Leaderless systems; tunable per operation",
            ],
          ],
        },
        callout: {
          kind: "warn",
          text: "Fully synchronous replication means the slowest replica sets your write latency and any replica failure blocks writes entirely. Systems that claim it usually mean semi-synchronous with a timeout that silently falls back to async — which is the failure mode you must ask about.",
        },
      },
      {
        heading: "Replication lag: the anomalies users report",
        lede: "Three distinct bugs, three distinct fixes.",
        steps: [
          {
            title: "Read-your-writes violated",
            text: "A user updates their profile, the write goes to the leader, and their next read hits a follower that has not caught up. They see the old value and assume it did not save.",
            detail: "Fix: route a user's reads to the leader for a few seconds after their own write, or pin them to a replica whose log position is at least their write's.",
          },
          {
            title: "Monotonic reads violated",
            text: "Two consecutive reads land on different followers with different lag, so a comment appears and then vanishes — time appears to run backwards.",
            detail: "Fix: pin a session to one replica (hash the user id), so within a session the data only moves forward.",
          },
          {
            title: "Consistent prefix violated",
            text: "In a sharded or partitioned system, causally related writes replicate at different speeds — an answer arrives before the question it replies to.",
            detail: "Fix: keep causally related data in the same partition, or attach causal metadata (version vectors, Lamport timestamps).",
          },
        ],
        code: {
          title: "Read-your-writes without sending all reads to the leader",
          lang: "ts",
          source: `// After a write, remember the log position the write reached.
const lsn = await leader.write(sql);          // e.g. Postgres pg_current_wal_lsn()
session.minLsn = lsn;
session.minLsnUntil = Date.now() + 10_000;    // only matters briefly

// On a read, choose a replica that has caught up past that position.
function pickReplica(session: Session): Db {
  if (!session.minLsn || Date.now() > session.minLsnUntil) return anyReplica();
  const caught = replicas.filter((r) => r.appliedLsn >= session.minLsn);
  return caught.length ? pickLeastLoaded(caught) : leader;   // fall back to leader
}

// Cheaper approximation used widely: for N seconds after a write,
// send that user's reads to the leader. Simple, and usually enough.`,
        },
        bullets: [
          "Monitor lag as a first-class metric, in both seconds and bytes. Seconds tell you user impact; bytes tell you whether a replica is falling behind permanently.",
          "Lag spikes have predictable causes: a long-running transaction on the leader, a bulk import, a vacuum, or a replica doing something else with its disk.",
          "A replica that is behind should be removed from the read pool automatically, not left silently serving old data.",
        ],
      },
      {
        heading: "Failover, and the ways it hurts",
        bullets: [
          "Detection is a timeout, so it is a guess. Too short and you fail over on a network blip; too long and you are down. Typical settings are 10-30 seconds.",
          "Split brain: the old leader did not die, it was partitioned. Now two nodes accept writes. Fencing — STONITH, a lease, or a fencing token that the storage layer checks — is what prevents this, and it must exist.",
          "Lost writes: with async replication, anything acknowledged but not yet shipped is gone. The classic incident is auto-increment ids being reused by the new leader and attached to different rows.",
          "Cache poisoning after failover: caches and clients holding the old leader's address must be updated. Use a virtual IP, a proxy, or a service-discovery record rather than baking the address into config.",
          "Failover is also a scaling event — the new leader inherits the full write load plus catch-up work from every follower.",
        ],
        callout: {
          kind: "interview",
          text: "'How does the system decide the leader is dead, and what stops the old leader from continuing to accept writes?' is the question that shows you have operated one of these. Consensus (Raft) exists exactly to answer it.",
        },
      },
      {
        heading: "How it actually ships",
        table: {
          headers: ["Mechanism", "What is shipped", "Notes"],
          rows: [
            ["Statement-based", "The SQL text", "Breaks on NOW(), RAND(), and triggers; largely abandoned"],
            ["Write-ahead log (physical)", "Byte-level changes to pages", "Fast and exact; replica must run the same version"],
            ["Logical / row-based", "Row before and after images", "Version- and schema-flexible; enables CDC into Kafka or a warehouse"],
            ["Trigger-based", "Application-level capture", "Flexible, slow, and easy to get wrong"],
          ],
        },
        bullets: [
          "Logical replication is what makes change data capture possible: the same stream that feeds a replica can feed a search index, a cache invalidator or a data warehouse.",
          "Chained replication (a replica of a replica) reduces load on the leader in large fleets, at the cost of adding the two lags together.",
          "Backups are not replication. A replica faithfully replicates your DROP TABLE; point-in-time recovery is what saves you from that.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What replication mode would you choose, and why?",
            a: "Single leader with semi-synchronous replication to one follower in another availability zone, and asynchronous to the rest. That gives durability across two failure domains without letting the slowest replica set write latency. I would only reach for multi-leader if there were genuinely global write traffic that cannot tolerate cross-region latency, because conflict resolution is a large ongoing cost.",
          },
          {
            q: "A user says their update disappeared. What happened?",
            a: "Almost certainly replication lag — the write went to the leader and the subsequent read hit a stale follower. The fix is read-your-writes routing: for a short window after a user's write, serve their reads from the leader or from a replica known to have applied that log position. I would also check whether the lag itself is abnormal, since a long-running transaction on the leader is the usual root cause.",
          },
          {
            q: "How do you avoid split brain?",
            a: "Never let a node decide on its own that it is the leader. Leadership comes from a majority — Raft or ZooKeeper-style leases — so a partitioned minority cannot elect itself. On top of that, fencing: the new leader gets a monotonically increasing token, and storage rejects writes carrying an older token, so a resurrected old leader cannot corrupt anything.",
          },
          {
            q: "Ten read replicas — do reads scale ten times?",
            a: "Read throughput roughly does, but every replica applies the full write stream, so the write load is replicated everywhere and does not scale at all. Past a point, adding replicas increases leader load for shipping the log and adds lag. When reads still are not enough after caching and replicas, the answer is partitioning, not more copies.",
          },
        ],
      },
    ],
    related: ["/hld/sharding", "/hld/consistency", "/hld/quorum", "/hld/cap-theorem"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "sharding",
    title: "Sharding & Partitioning",
    subtitle: "Split the data when one machine can no longer hold it or write it.",
    level: "advanced",
    minutes: 18,
    tags: ["databases", "scalability", "partitioning"],
    summary:
      "Sharding splits one logical dataset across many machines so that writes and storage scale horizontally. It is the most consequential decision in a data-heavy design, because the shard key determines which queries stay fast, which become fan-outs, and how badly a celebrity user can hurt you.",
    keyPoints: [
      "Shard only after vertical scaling, caching and read replicas are exhausted — it costs joins, transactions and operational complexity.",
      "Hash sharding spreads evenly but destroys range scans; range sharding keeps them and invites hotspots.",
      "The shard key should appear in the majority of queries, or every read becomes a scatter-gather.",
      "Resharding is the hard part; consistent hashing or logical shards make it survivable.",
      "Celebrity keys break any scheme — plan a specific escape hatch.",
    ],
    prerequisites: ["/hld/replication"],
    sections: [
      {
        heading: "Partitioning strategies",
        table: {
          headers: ["Strategy", "Shard = f(key)", "Wins", "Loses"],
          rows: [
            [
              "Hash",
              "hash(key) mod N, or a hash ring",
              "Even distribution, no hotspots from key ordering",
              "Range queries must hit every shard",
            ],
            [
              "Range",
              "key between A and M → shard 1",
              "Range scans hit one shard; natural for time series",
              "Sequential keys (timestamps, auto-increment) hammer one shard",
            ],
            [
              "Directory / lookup",
              "An explicit map from key → shard",
              "Total flexibility; move any key at any time",
              "The lookup service is a dependency and a bottleneck",
            ],
            [
              "Geographic",
              "Region of the user",
              "Data residency, low latency, clear ownership",
              "Uneven load; cross-region users are awkward",
            ],
            [
              "Composite",
              "hash(tenant) then range(time)",
              "Even across tenants, ordered within one",
              "More complex routing; still hot on a huge tenant",
            ],
          ],
        },
        callout: {
          kind: "warn",
          text: "hash(key) mod N is the trap: adding one node changes almost every key's mapping and forces a full data reshuffle. Use consistent hashing, or fix a large number of logical shards (say 1024) and map many of them onto each physical node.",
        },
      },
      {
        heading: "Choosing the shard key",
        lede: "The single decision you will live with for years.",
        steps: [
          {
            title: "List your top queries first",
            text: "Write out the five queries that carry your traffic. The shard key must appear in most of them, or those queries become scatter-gather across every shard.",
            detail: "Example: 'messages for a conversation' → shard by conversation_id, not by message_id.",
          },
          {
            title: "Check the cardinality and the distribution",
            text: "High cardinality spreads well; low cardinality (country, status, plan) creates a handful of huge shards. Then check the distribution: even high-cardinality keys can be Zipfian.",
            detail: "user_id is high cardinality, but if 1% of users generate 50% of writes it is still skewed.",
          },
          {
            title: "Decide what must stay together",
            text: "Anything you need to read atomically or join cheaply should hash to the same shard. Putting a user's orders on the user's shard turns a distributed join into a local one.",
          },
          {
            title: "Plan for the outliers",
            text: "There will be a tenant a thousand times larger than the median. Decide now: give them a dedicated shard, or sub-shard their key with a suffix.",
            detail: "key = tenant_id + ':' + (hot ? random(0..15) : 0) — spreads a hot tenant across 16 partitions.",
          },
          {
            title: "Verify you can reshard",
            text: "How do you go from 8 to 16 shards with the system live? If the answer is 'take an outage', pick a different scheme now.",
          },
        ],
        code: {
          title: "Logical shards: reshard by moving mappings, not by rehashing keys",
          lang: "ts",
          source: `// Fix a large number of logical shards up front. They never change.
const LOGICAL_SHARDS = 1024;

function logicalShard(key: string): number {
  return murmur3(key) % LOGICAL_SHARDS;      // stable forever
}

// A small, cached map decides where each logical shard currently lives.
// Growing the cluster moves ranges of logical shards, not individual keys.
let placement: Map<number, PhysicalNode> = loadPlacement();

function nodeFor(key: string): PhysicalNode {
  return placement.get(logicalShard(key))!;
}

// 8 nodes  -> each owns 128 logical shards
// 16 nodes -> each owns 64; exactly half of each old node's data moves,
//             and only whole logical shards move, so migration is trackable.`,
        },
      },
      {
        heading: "What sharding takes away",
        diagram: {
          kind: "system",
          caption: "Queries that used to be one statement become coordination problems.",
          columns: [
            {
              title: "Single-shard query",
              nodes: [
                { id: "a", label: "WHERE user_id = 42", sub: "routed to one shard", tone: "ok" },
                { id: "b", label: "Latency = one query", tone: "ok" },
              ],
            },
            {
              title: "Scatter-gather",
              nodes: [
                { id: "c", label: "WHERE created_at > ...", sub: "hits all N shards", tone: "warn" },
                { id: "d", label: "Latency = slowest shard", tone: "warn" },
                { id: "e", label: "Merge + sort in the app" },
              ],
            },
            {
              title: "Cross-shard write",
              nodes: [
                { id: "f", label: "Transfer A → B", sub: "different shards", tone: "bad" },
                { id: "g", label: "2PC, or saga + compensation", tone: "bad" },
              ],
            },
            {
              title: "Global constraints",
              nodes: [
                { id: "h", label: "UNIQUE(email)", sub: "not enforceable per shard", tone: "bad" },
                { id: "i", label: "Separate uniqueness service", sub: "or shard by email" },
              ],
            },
          ],
        },
        bullets: [
          "Joins across shards: denormalise, keep a local copy of the small side, or do the join in the application. Accept that some are simply not worth supporting.",
          "Transactions across shards: two-phase commit is available in some engines and is slow and failure-prone; sagas with compensating actions are the usual production answer.",
          "Global uniqueness: either shard by the unique attribute, or maintain a separate index/service that owns uniqueness for that field.",
          "Global secondary indexes become their own partitioned dataset with their own consistency lag.",
          "Aggregate queries (counts, top-N) need pre-aggregation or a separate analytics store — scatter-gather over every shard for a dashboard will not survive growth.",
          "The tail latency of a scatter-gather is the slowest shard's, so p99 degrades as shard count rises. Hedged requests and per-shard timeouts help.",
        ],
      },
      {
        heading: "Resharding without downtime",
        steps: [
          {
            title: "Dual-write",
            text: "Start writing to both the old and the new placement while all reads still come from the old. This is the point of no return for correctness bugs — make it reversible with a flag.",
          },
          {
            title: "Backfill",
            text: "Copy historical data in batches, throttled so it does not starve live traffic. Track progress per logical shard so it can resume after a failure.",
          },
          {
            title: "Verify",
            text: "Compare old and new continuously — row counts, checksums, and a sampled deep comparison. Do not skip this; silent divergence is the failure mode.",
          },
          {
            title: "Shift reads",
            text: "Move reads to the new placement gradually, by percentage or by tenant, with an instant rollback path.",
          },
          {
            title: "Stop dual-writing, then clean up",
            text: "Only after reads have been on the new placement long enough to trust. Keep the old data for a rollback window before deleting.",
          },
        ],
        callout: {
          kind: "insight",
          text: "Most engines that shard for you — Vitess, Citus, MongoDB, DynamoDB, CockroachDB — implement exactly this dance internally. In an interview, saying 'I would use a system that does online resharding rather than building it' is a legitimate and senior answer.",
        },
      },
      {
        heading: "Hotspots: the failure you should design for",
        bullets: [
          "Sequential shard keys (auto-increment id, timestamp) send every new write to the same shard. Prefix with a hash, or use a time-bucketed composite key.",
          "Celebrity tenants: one account with a thousand times the traffic. Give them their own shard, or fan their key out with a random suffix and read all suffixes.",
          "Hot reads are easier than hot writes — a cache in front absorbs them. Hot writes need actual partitioning of the key.",
          "Measure per-shard QPS, storage and p99, not cluster averages. Averages hide the shard that is about to fall over.",
          "A rebalancing operation is itself load. Throttle it, and never rebalance during peak.",
        ],
        math: [
          {
            label: "When to consider sharding",
            expr: "dataset > single-node storage, or writes > single-leader capacity after tuning",
            result: "not before",
          },
          {
            label: "Shard count",
            expr: "target_data / comfortable_per_shard, then round up generously",
            result: "e.g. 20 TB / 1 TB = 20 → 32",
            note: "Powers of two make splitting simpler.",
          },
          {
            label: "Scatter-gather p99",
            expr: "p99 of max over N shards ≫ p99 of one shard",
            result: "worse with every shard",
            note: "With 100 shards, a per-shard p99 of 10 ms yields a request p99 far above 10 ms.",
          },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What shard key would you pick for a chat system?",
            a: "conversation_id, because the dominant query is 'the most recent messages in this conversation' and that keeps it on one shard, ordered. Sharding by message_id would spread every conversation across the cluster and turn the main read into a scatter-gather. The cost is that a user's list of conversations is then a cross-shard query, which I would serve from a separate per-user index.",
          },
          {
            q: "How do you handle a tenant that is 1000× bigger than the rest?",
            a: "Detect it and treat it specially rather than hoping the hash saves me. Either pin that tenant to its own physical shard, or salt the key — append a small random suffix so their writes spread across 16 partitions, and fan the read out across those 16. I would also make sure per-shard metrics exist, because otherwise the first sign is an outage.",
          },
          {
            q: "How do you go from 8 shards to 16 while live?",
            a: "By never hashing directly onto physical nodes. With a fixed set of logical shards — say 1024 — growing the cluster just moves ranges of logical shards, so exactly half of each node's data moves and the mapping stays stable. Operationally it is dual-write, backfill, verify, shift reads gradually, then stop dual-writing, with a rollback flag at every step.",
          },
          {
            q: "Can you still do transactions?",
            a: "Within a shard, yes, and that is why co-locating related data matters so much. Across shards I would avoid two-phase commit — it blocks on the coordinator and hurts availability — and use a saga: a sequence of local transactions with compensating actions, plus idempotency so retries are safe. If cross-shard transactions are genuinely core to the domain, I would consider a distributed SQL engine instead of hand-rolling it.",
          },
        ],
      },
    ],
    related: ["/hld/consistent-hashing", "/hld/replication", "/hld/sql-vs-nosql", "/examples/kv-store"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
    playground: "consistent-hashing",
  },

  {
    slug: "consistent-hashing",
    title: "Consistent Hashing",
    subtitle: "Add a node and move 1/n of the keys, not all of them.",
    level: "intermediate",
    minutes: 14,
    tags: ["distributed", "partitioning", "algorithms"],
    summary:
      "Modulo hashing remaps almost every key when the cluster size changes, which means a cold cache and a stampede on every scale event. Consistent hashing places nodes and keys on the same ring so that adding or removing a node only affects the keys between it and its neighbour — about 1/n of the data.",
    keyPoints: [
      "hash(key) mod N remaps ~(N-1)/N of keys when N changes. Consistent hashing remaps ~1/N.",
      "Virtual nodes are not optional: without them, load distribution is badly uneven.",
      "Replication is 'the next R distinct physical nodes clockwise' on the same ring.",
      "It solves rebalancing, not hotspots — a single hot key still lands on one node.",
      "Rendezvous hashing is a simpler alternative with equally good properties.",
    ],
    sections: [
      {
        heading: "The problem with modulo",
        math: [
          {
            label: "Modulo, 4 → 5 nodes",
            expr: "fraction remapped = 1 − 1/5 (approximately)",
            result: "≈ 80% of keys move",
            note: "Every moved key is a cache miss and a data transfer.",
          },
          {
            label: "Consistent hashing, 4 → 5 nodes",
            expr: "each node gives up roughly an equal share to the newcomer",
            result: "≈ 20% of keys move",
            note: "Only keys in the arc the new node takes over.",
          },
          {
            label: "Cost of the difference",
            expr: "1 TB cache, 80% vs 20% remapped",
            result: "800 GB vs 200 GB refetched",
            note: "The 80% case is an origin stampede; the 20% case is a busy afternoon.",
          },
        ],
        callout: {
          kind: "warn",
          text: "The real-world version of this: a cache node dies at peak, modulo hashing remaps almost every key, every request misses, and the database takes full traffic. The outage is caused by the hashing scheme, not by the node failure.",
        },
      },
      {
        heading: "The ring",
        body: [
          "Hash both nodes and keys into the same space — commonly a 32- or 64-bit integer treated as a circle. A key belongs to the first node found by walking clockwise from the key's position. Adding a node inserts a point on the circle and takes over only the arc between it and its predecessor.",
        ],
        diagram: {
          kind: "flow",
          caption: "Walk clockwise from the key to find its owner; only one arc changes hands.",
          rows: [
            [
              { id: "k1", label: "hash('user:42')", sub: "position 0x3F1A", tone: "accent" },
              { id: "n1", label: "Node B", sub: "first node clockwise", tone: "ok" },
            ],
            [
              { id: "n0", label: "Node A", sub: "0x1000" },
              { id: "nn", label: "Node D (new)", sub: "0x3000 — takes A→B's arc", tone: "warn" },
              { id: "nb", label: "Node B", sub: "0x8000" },
              { id: "nc", label: "Node C", sub: "0xC000" },
            ],
          ],
        },
        code: {
          title: "Ring with virtual nodes — the version you would actually write",
          lang: "ts",
          source: `class HashRing {
  // sorted positions on the ring, each mapping to a physical node
  private ring: { pos: number; node: string }[] = [];

  constructor(nodes: string[], private vnodesPerNode = 150) {
    for (const n of nodes) this.addNode(n);
  }

  addNode(node: string) {
    for (let i = 0; i < this.vnodesPerNode; i++) {
      this.ring.push({ pos: hash32(\`\${node}#\${i}\`), node });
    }
    this.ring.sort((a, b) => a.pos - b.pos);
  }

  removeNode(node: string) {
    this.ring = this.ring.filter((e) => e.node !== node);
  }

  // first vnode clockwise from the key's position
  getNode(key: string): string {
    if (!this.ring.length) throw new Error("empty ring");
    const h = hash32(key);
    const i = lowerBound(this.ring, h);          // binary search: O(log V)
    return this.ring[i % this.ring.length].node;
  }

  // replication: the next R *distinct physical* nodes clockwise
  getNodes(key: string, replicas: number): string[] {
    const out: string[] = [];
    let i = lowerBound(this.ring, hash32(key));
    while (out.length < replicas && out.length < this.distinctNodes()) {
      const node = this.ring[i % this.ring.length].node;
      if (!out.includes(node)) out.push(node);   // skip vnodes of the same machine
      i++;
    }
    return out;
  }
}`,
        },
        callout: {
          kind: "insight",
          text: "The distinct-physical-node check in getNodes is the detail interviewers look for. Without it, three 'replicas' can all be virtual nodes of the same machine, and one failure takes out every copy.",
        },
      },
      {
        heading: "Why virtual nodes are mandatory",
        table: {
          headers: ["Virtual nodes per physical node", "Load standard deviation", "Ring size (10 nodes)", "Verdict"],
          rows: [
            ["1", "~30-40% — some nodes get 2× others", "10 points", "Unusable"],
            ["10", "~10%", "100 points", "Still lumpy"],
            ["150", "~3-5%", "1,500 points", "The common production choice"],
            ["1000", "~1-2%", "10,000 points", "Diminishing returns; lookup and memory cost rises"],
          ],
        },
        bullets: [
          "With one point per node, random placement leaves large arcs to some nodes and slivers to others. More points averages the arcs out — it is the law of large numbers doing the work.",
          "Virtual nodes also make removal graceful: a dead node's keys spread across many neighbours instead of dumping entirely onto one successor.",
          "Weighting falls out for free: a machine with twice the memory gets twice the virtual nodes.",
          "Memory cost is small — 150 vnodes × 100 nodes is 15,000 entries, and lookup is a binary search over them.",
        ],
      },
      {
        heading: "Where it is used, and the alternative",
        bullets: [
          "Distributed caches (memcached clients, Redis Cluster's 16,384 hash slots — a fixed-slot variant of the same idea).",
          "Dynamo-style databases (Cassandra, Riak, DynamoDB) for both placement and replication.",
          "Load balancers with cache affinity: route the same URL to the same backend so its local cache stays warm.",
          "Sharded rate limiters and session stores, where the key must consistently reach the node holding its state.",
        ],
        diagram: {
          kind: "compare",
          caption: "Two schemes with the same guarantee.",
          options: [
            {
              title: "Consistent hashing (ring)",
              good: [
                "Well known; the vocabulary interviewers expect",
                "Natural replication: next R nodes clockwise",
                "Weighting via virtual node counts",
              ],
              bad: [
                "Needs virtual nodes to be even",
                "Ring state must be shared or gossiped",
                "Fiddly to implement correctly (distinct-node replication)",
              ],
              verdict: "The default answer, and what most systems ship.",
            },
            {
              title: "Rendezvous (HRW) hashing",
              tone: "ok",
              good: [
                "No ring, no virtual nodes: pick argmax of hash(key, node)",
                "Naturally even distribution",
                "Trivially correct, ~10 lines",
              ],
              bad: ["O(N) per lookup unless you optimise", "Less common vocabulary; may need explaining"],
              verdict: "Small node counts, or when you want simplicity over convention.",
            },
          ],
        },
        code: {
          title: "Rendezvous hashing in full",
          lang: "ts",
          source: `function pickNode(key: string, nodes: string[]): string {
  let best = nodes[0], bestScore = -Infinity;
  for (const n of nodes) {
    const score = hash64(\`\${key}:\${n}\`);       // deterministic per (key, node)
    if (score > bestScore) { bestScore = score; best = n; }
  }
  return best;
}
// Remove a node and only its keys move: every other key's winner is unchanged.
// Top-R by score gives you replication with no extra machinery.`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Why not just hash mod N?",
            a: "Because changing N remaps almost every key. For a cache that means a near-total miss storm on any scale-up or node failure, and the database sees full traffic exactly when the cluster is already degraded. For a datastore it means moving nearly all the data. Consistent hashing bounds the movement to roughly 1/N.",
          },
          {
            q: "Does consistent hashing solve hotspots?",
            a: "No, and this is the most common misunderstanding. It distributes the key space evenly, not the traffic. One extremely popular key still lands on exactly one node no matter how good the hashing is. The fixes for that are different: replicate the hot key across several nodes and read a random one, or add a small local cache in front to absorb the reads.",
          },
          {
            q: "How many virtual nodes would you use?",
            a: "On the order of 100-200 per physical node. That gets the standard deviation of load down to a few percent, which is close to the practical floor, while keeping the ring small enough that lookups stay a cheap binary search. Below about ten, the distribution is visibly uneven.",
          },
          {
            q: "How does every client agree on the ring?",
            a: "Either a coordination service holds the membership — ZooKeeper, etcd, or a config service clients watch — or the nodes gossip membership among themselves, as Dynamo-style systems do. The subtle failure is a client with a stale ring writing to the wrong node; systems handle that with a request that carries the ring version, so a node can reject or forward a misrouted write.",
          },
        ],
      },
    ],
    related: ["/hld/sharding", "/hld/caching", "/examples/consistent-hashing", "/playgrounds/consistent-hashing"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
    playground: "consistent-hashing",
  },

  {
    slug: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    subtitle: "Choose by access pattern and consistency need, not by fashion.",
    level: "foundational",
    minutes: 16,
    tags: ["databases", "modeling", "trade-offs"],
    summary:
      "The honest version of this question is not 'which is better' but 'what does my access pattern look like, and what am I willing to give up'. Relational databases give you flexible queries and real transactions on one node. NoSQL families each trade some of that away for a specific scaling or modelling property.",
    keyPoints: [
      "Start relational unless there is a concrete reason not to. Postgres scales further than most people assume.",
      "Document stores fit self-contained aggregates; the trap is needing to query across them.",
      "Wide-column stores are for enormous write volumes with known access patterns — you design tables per query.",
      "Key-value is for one lookup pattern at extreme speed; anything else needs a second index you maintain.",
      "Polyglot persistence is normal: relational as the source of truth, plus specialised stores for search, cache and analytics.",
    ],
    sections: [
      {
        heading: "The families, and what each is actually for",
        table: {
          headers: ["Family", "Data model", "Strong at", "Weak at", "Examples"],
          rows: [
            [
              "Relational",
              "Tables, rows, foreign keys",
              "Ad-hoc queries, joins, ACID transactions, constraints",
              "Horizontal write scaling; rigid schema migrations at size",
              "Postgres, MySQL",
            ],
            [
              "Document",
              "JSON-ish documents",
              "Self-contained aggregates, flexible fields, fast whole-object reads",
              "Cross-document joins, multi-document transactions (improving)",
              "MongoDB, DynamoDB (doc mode), Couchbase",
            ],
            [
              "Wide-column",
              "Row key + column families, sorted",
              "Massive write throughput, time series, known access patterns",
              "Ad-hoc queries; you must model per query",
              "Cassandra, HBase, ScyllaDB, Bigtable",
            ],
            [
              "Key-value",
              "Opaque value by key",
              "Sub-millisecond lookups, caches, sessions, counters",
              "Any query that is not by primary key",
              "Redis, Memcached, DynamoDB",
            ],
            [
              "Graph",
              "Nodes and edges",
              "Multi-hop traversal: friends-of-friends, fraud rings, permissions",
              "Bulk analytics; sharding a graph is genuinely hard",
              "Neo4j, Neptune",
            ],
            [
              "Search",
              "Inverted index",
              "Full-text relevance, faceting, fuzzy matching",
              "Source of truth — it is a derived index, not a database",
              "Elasticsearch, OpenSearch",
            ],
            [
              "Time series",
              "Timestamped points",
              "High-cardinality metrics, downsampling, retention",
              "Updates and general-purpose queries",
              "Prometheus, InfluxDB, TimescaleDB",
            ],
          ],
        },
      },
      {
        heading: "Model the same feature both ways",
        lede: "The difference is where the join happens.",
        code: [
          {
            title: "Relational — normalised, join at read time",
            lang: "sql",
            source: `-- Write once, query many ways.
SELECT o.id, o.placed_at, c.email, SUM(l.qty * l.unit_price) AS total
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_lines l ON l.order_id = o.id
WHERE o.placed_at > now() - interval '7 days'
GROUP BY o.id, c.email
ORDER BY total DESC
LIMIT 20;

-- New question next week? New query. No migration, no backfill.`,
          },
          {
            title: "Document — denormalised, join at write time",
            lang: "json",
            source: `{
  "_id": "ord_9f3",
  "placedAt": "2026-09-08T10:12:00Z",
  "customer": { "id": "cus_1", "email": "a@example.com" },
  "lines": [
    { "sku": "SKU-1", "qty": 2, "unitPrice": 1299 },
    { "sku": "SKU-7", "qty": 1, "unitPrice": 4500 }
  ],
  "total": 7098
}

// One read gets the whole order — fast and simple.
// But: the customer's email is copied into every order. Change it and you
// either fan out an update across documents or accept a stale copy.`,
          },
          {
            title: "Wide-column — one table per access pattern",
            lang: "sql",
            source: `-- Cassandra: you do not query the data, you design for the query.
CREATE TABLE orders_by_customer (
  customer_id uuid,
  placed_at   timestamp,
  order_id    uuid,
  total       int,
  PRIMARY KEY ((customer_id), placed_at)      -- partition key, clustering key
) WITH CLUSTERING ORDER BY (placed_at DESC);

-- Need orders by date across all customers? That is a *different table*,
-- written to at the same time. Duplication is the design, not a smell.`,
          },
        ],
        callout: {
          kind: "insight",
          text: "The one-sentence version: relational databases let you decide the query later; NoSQL stores make you decide it now, and reward you with predictable performance at scale. If you cannot list your queries, that is an argument for relational.",
        },
      },
      {
        heading: "The arguments that are usually wrong",
        table: {
          headers: ["Claim", "Reality"],
          rows: [
            [
              "\"NoSQL scales, SQL doesn't\"",
              "A tuned Postgres handles tens of thousands of writes/sec and terabytes. Most systems never reach the point where the engine is the limit.",
            ],
            [
              "\"NoSQL is schemaless\"",
              "The schema moved into the application, where it is enforced by nobody. You still have one — it is just implicit and versioned across live documents.",
            ],
            [
              "\"NoSQL is faster\"",
              "For its designed access pattern, yes. For a query it was not designed for, it is dramatically slower or impossible.",
            ],
            [
              "\"SQL can't do JSON\"",
              "Postgres has jsonb with indexes; you can keep an aggregate in a column and still join and transact around it.",
            ],
            [
              "\"NoSQL means no transactions\"",
              "Increasingly untrue — MongoDB and DynamoDB both offer multi-item transactions, with limits. Read the limits.",
            ],
            [
              "\"We'll migrate later if needed\"",
              "Data migrations at scale are the hardest engineering work there is. Choosing is cheap now and expensive later.",
            ],
          ],
        },
      },
      {
        heading: "A decision procedure",
        steps: [
          {
            title: "Write down the top five queries",
            text: "By expected volume. If they are diverse and likely to change, that argues strongly for relational. If there is one dominant key-based access pattern, a key-value or wide-column store becomes viable.",
          },
          {
            title: "Identify the consistency requirements",
            text: "Does anything need multi-row atomicity — money, inventory, bookings? That is an argument for a real transaction, on one node if possible.",
          },
          {
            title: "Estimate size and write rate",
            text: "Under a terabyte and under a few thousand writes per second is comfortably single-node relational territory. Do the arithmetic rather than guessing.",
          },
          {
            title: "Check the relationship shape",
            text: "Deeply connected data with multi-hop traversal is a graph problem, and expressing it as recursive SQL or repeated document lookups is painful.",
          },
          {
            title: "Then pick, and name what you gave up",
            text: "Every choice sacrifices something. Saying 'I picked DynamoDB, which means no ad-hoc queries and I will need a secondary index or a stream to Elasticsearch for search' is a complete answer.",
          },
        ],
        math: [
          {
            label: "Is this big?",
            expr: "10 M rows × 1 KB",
            result: "10 GB",
            note: "Fits in RAM on a mid-size instance. This is not a scaling problem.",
          },
          {
            label: "Is this write-heavy?",
            expr: "50 M writes/day ÷ 86,400 × 3 (peak factor)",
            result: "≈ 1,700 writes/s",
            note: "Comfortable for one Postgres primary with sensible indexing.",
          },
          {
            label: "When relational genuinely runs out",
            expr: "sustained writes ≫ 10⁴/s, or working set ≫ one machine",
            result: "then shard or change engine",
          },
        ],
      },
      {
        heading: "Polyglot persistence in practice",
        diagram: {
          kind: "system",
          caption: "One source of truth, several derived stores fed by change data capture.",
          columns: [
            {
              title: "Source of truth",
              nodes: [
                { id: "pg", label: "Postgres", sub: "orders, users, money", tone: "accent" },
              ],
            },
            {
              title: "Change stream",
              nodes: [
                { id: "cdc", label: "CDC / outbox", sub: "logical replication → Kafka" },
              ],
            },
            {
              title: "Derived stores",
              nodes: [
                { id: "es", label: "Elasticsearch", sub: "search + facets" },
                { id: "redis", label: "Redis", sub: "sessions, counters, cache" },
                { id: "ch", label: "Warehouse", sub: "analytics, BI" },
                { id: "s3", label: "Object storage", sub: "files, media" },
              ],
            },
          ],
        },
        bullets: [
          "Exactly one store owns each piece of truth. Everything else is derived and can be rebuilt — that rule is what keeps polyglot persistence from becoming chaos.",
          "Derived stores are eventually consistent by definition. Search results a few seconds behind are fine; a balance check a few seconds behind is not.",
          "Every extra store is operational cost: backups, upgrades, monitoring, on-call knowledge. Two well-run stores usually beat five badly-run ones.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Which would you pick for this system, and why?",
            a: "I would start from the access patterns. If the top queries are diverse, or anything needs multi-row atomicity, relational — and I would note that a single Postgres handles far more than people assume. If there is one dominant key-based pattern at very high write volume, like a message store keyed by conversation, then a wide-column store designed around that key. What I would avoid is picking the engine before listing the queries.",
          },
          {
            q: "How would you add full-text search?",
            a: "Not by putting the search engine in the write path. Keep the relational store as the source of truth and feed Elasticsearch from a change stream — logical replication or an outbox table — so search is a derived, rebuildable index. For modest needs, Postgres full-text search avoids a whole extra system, and I would check that first.",
          },
          {
            q: "Your document store now needs a query across documents. What do you do?",
            a: "That is the classic document-store wall. The options are: maintain a second collection shaped for that query and write to both, stream changes into a store that can answer it, or accept a scan. Which one depends on volume, but the important thing is recognising that the modelling decision made earlier is what is now expensive — and being honest about it rather than bolting on a slow aggregation pipeline.",
          },
          {
            q: "Can you get ACID in a NoSQL store?",
            a: "Increasingly yes, with limits worth reading carefully — DynamoDB transactions cap the number of items, MongoDB transactions work best within a shard, and both cost latency. The bigger point is that ACID within one partition is usually available and cheap, and it is transactions spanning partitions that are hard everywhere, including in sharded SQL.",
          },
        ],
      },
    ],
    related: ["/hld/sharding", "/hld/consistency", "/hld/replication", "/lld/repository"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },
];
