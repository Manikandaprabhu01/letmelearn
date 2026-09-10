import type { Concept } from "@/data/types";

export const hldConsistency: Concept[] = [
  {
    slug: "cap-theorem",
    title: "CAP Theorem (and PACELC)",
    subtitle: "During a partition you choose; the rest of the time you are choosing something else.",
    level: "intermediate",
    minutes: 13,
    tags: ["distributed", "theory", "trade-offs"],
    summary:
      "CAP says that when the network partitions, a distributed system must give up either consistency or availability. It is often recited badly — as if you pick two of three at design time. Partitions are not optional, so the real statement is narrower and more useful, and PACELC completes it by describing the trade-off you make when the network is fine.",
    keyPoints: [
      "P is not a choice. Networks partition, so every distributed system is CP or AP.",
      "C in CAP means linearizability, not the C in ACID — different words, same letter.",
      "The choice is per operation, not per system: the same database can serve a linearizable read and an eventual one.",
      "PACELC: if Partition then A or C, Else then Latency or Consistency. The 'else' branch governs 99.9% of the time.",
      "Partitions are rare; latency is constant. Most real designs are decided by the else branch.",
    ],
    sections: [
      {
        heading: "What the theorem actually says",
        body: [
          "Consider two nodes that can no longer talk to each other, and a client that writes to one and reads from the other. Either the read waits (or errors) until the nodes reconnect — that is choosing consistency — or it answers with possibly stale data — that is choosing availability. There is no third option, because the information physically has not arrived.",
          "That is the whole theorem. It says nothing about ordinary operation, nothing about latency, and nothing about the ACID guarantees of a single-node database.",
        ],
        diagram: {
          kind: "sequence",
          caption: "The partitioned moment: the node on the right must choose.",
          actors: [
            { id: "w", label: "Writer" },
            { id: "n1", label: "Node A" },
            { id: "n2", label: "Node B", sub: "partitioned from A" },
            { id: "r", label: "Reader" },
          ],
          messages: [
            { from: "w", to: "n1", label: "SET x = 2", kind: "call" },
            { from: "n1", to: "w", label: "ok", kind: "return", tone: "ok" },
            { from: "n1", to: "n2", label: "replicate x = 2", kind: "async", tone: "bad", note: "✗ network partition — never arrives" },
            { from: "r", to: "n2", label: "GET x", kind: "call" },
            { from: "n2", to: "r", label: "CP: error / timeout — refuse to answer", kind: "return", tone: "warn" },
            { from: "n2", to: "r", label: "AP: 1 — stale but available", kind: "return", tone: "warn" },
          ],
        },
        callout: {
          kind: "warn",
          text: "The classic misstatement is 'pick two of three'. You cannot pick P — the network decides that. A single-node database is not CA in any meaningful sense; it just is not distributed, so the theorem does not apply.",
        },
      },
      {
        heading: "CP and AP in practice",
        diagram: {
          kind: "compare",
          caption: "Both are correct answers. The question is what your feature can tolerate.",
          options: [
            {
              title: "CP — refuse rather than lie",
              sub: "etcd, ZooKeeper, Spanner, HBase",
              good: [
                "Reads never return stale data",
                "Safe for money, inventory, locks, leader election",
                "Reasoning is straightforward: one truth at a time",
              ],
              bad: [
                "Minority partition is unavailable for writes and often for reads",
                "Requires a majority quorum, so latency is bounded by the median node",
              ],
              verdict: "Anything where a wrong answer is worse than no answer.",
            },
            {
              title: "AP — answer with what you have",
              sub: "Cassandra, Dynamo, Riak, DNS",
              good: [
                "Every node keeps serving during a partition",
                "Write availability regardless of network state",
                "Latency stays low — no cross-node coordination on the hot path",
              ],
              bad: [
                "Stale reads, and conflicting concurrent writes to resolve",
                "Application must handle merge semantics",
              ],
              verdict: "Feeds, catalogues, metrics, presence, shopping carts.",
            },
          ],
        },
        table: {
          headers: ["Feature", "Choice", "Why"],
          rows: [
            ["Account balance / transfer", "CP", "Double-spend is unacceptable; a delay is annoying"],
            ["Social feed", "AP", "A post appearing a second late is invisible to the user"],
            ["Distributed lock / leader election", "CP", "Two leaders is the exact failure the lock exists to prevent"],
            ["Shopping cart", "AP with merge", "Amazon's original case: a re-added item beats a failed add"],
            ["Inventory 'in stock' badge", "AP", "It is an estimate — reconcile at checkout, which is CP"],
            ["Service discovery", "AP", "Stale endpoint plus health checks beats no endpoints at all"],
          ],
        },
      },
      {
        heading: "PACELC: the part that governs normal operation",
        body: [
          "Daniel Abadi's extension: if there is a Partition, choose Availability or Consistency; Else — when the network is healthy — choose Latency or Consistency. The second clause is the one that shapes your architecture, because partitions are rare and latency is every request.",
          "Any strongly consistent read must contact a quorum, which costs at least one round trip and is bounded by your slowest necessary node. Serving from a local replica is fast and stale. That is the everyday trade.",
        ],
        table: {
          headers: ["System", "Partition", "Else", "Shorthand"],
          rows: [
            ["Postgres (single leader, sync replica)", "Consistency", "Consistency", "PC/EC"],
            ["Cassandra (default tunables)", "Availability", "Latency", "PA/EL"],
            ["DynamoDB (eventual reads)", "Availability", "Latency", "PA/EL"],
            ["DynamoDB (strongly consistent reads)", "Consistency", "Consistency", "PC/EC — and you pay double"],
            ["Spanner", "Consistency", "Consistency", "PC/EC — bought with TrueTime and hardware clocks"],
            ["MongoDB (majority write, primary read)", "Consistency", "Consistency", "PC/EC"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Notice DynamoDB appears twice. Consistency is chosen per request, not per system — which is the most practically useful thing to say about CAP in an interview.",
        },
      },
      {
        heading: "Using it well in a design discussion",
        bullets: [
          "Apply it per feature, not per system. A single application usually wants CP for payments and AP for the activity feed, backed by the same or different stores.",
          "Say what 'unavailable' means concretely: read-only mode, an error, a queued write, or a degraded response. 'Unavailable' as an abstraction is not a design.",
          "Quantify the partition. A 30-second partition where writes queue and drain is very different from a 30-minute one that fills a buffer.",
          "Remember that a slow node is indistinguishable from a partitioned one. Every timeout is a small CAP decision made by a piece of code you wrote.",
          "Most 'AP' systems still need a CP component somewhere — for leader election, configuration or locks. Naming that component is a good sign.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Is your design CP or AP?",
            a: "Per feature. Checkout and payment are CP — I would rather fail a purchase than sell inventory twice — so those go through a quorum-backed store and a transaction. Browsing, recommendations and the feed are AP, served from replicas and caches, because a few seconds of staleness there is imperceptible and availability matters more. The design question is where the boundary between the two sits.",
          },
          {
            q: "Isn't a single-node Postgres CA?",
            a: "Not meaningfully — CAP is about behaviour under partition, and a single node has no partition to survive. What it has is no partition tolerance at all: if the machine or its network fails, it is simply down. Once you add a synchronous replica and failover, it becomes a CP system with a real availability trade-off during elections.",
          },
          {
            q: "How does Spanner get around CAP?",
            a: "It does not — it is CP. What it does is make the unavailable window very small and the consistent path fast, by using TrueTime: atomic clocks and GPS give a bounded uncertainty interval, so transactions can wait out the uncertainty instead of coordinating more. Google reports availability high enough that most applications treat it as always up, but under a genuine partition the minority side still refuses writes.",
          },
          {
            q: "What does eventual consistency actually mean for a user?",
            a: "That in the absence of new writes, all replicas converge — with no promise about when. In practice the interesting questions are the bounds: typical convergence time, the worst case, and which anomalies are visible. A user who posts a comment and does not see it is a read-your-writes failure, which I would fix with session-level routing rather than by making the whole system strongly consistent.",
          },
        ],
      },
    ],
    related: ["/hld/consistency", "/hld/quorum", "/hld/replication", "/playgrounds/cap-theorem"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
    playground: "cap-theorem",
  },

  {
    slug: "consistency",
    title: "Consistency Models",
    subtitle: "A ladder from linearizable to eventual, and what each rung costs.",
    level: "advanced",
    minutes: 17,
    tags: ["distributed", "consistency", "theory"],
    summary:
      "'Strongly consistent' and 'eventually consistent' are the two words most people know, and between them sits a ladder of models that let you buy exactly the guarantee a feature needs. The useful skill is naming the specific anomaly your feature cannot tolerate, then picking the weakest model that excludes it.",
    keyPoints: [
      "Linearizability: the system behaves as if there were one copy and operations happened instantly, in real-time order.",
      "Sequential and causal consistency preserve order without requiring real-time agreement — much cheaper.",
      "Session guarantees (read-your-writes, monotonic reads) fix most user-visible bugs at almost no cost.",
      "Eventual consistency alone promises convergence, not when or in what order.",
      "Stronger models cost latency and availability; pick per operation.",
    ],
    prerequisites: ["/hld/cap-theorem"],
    sections: [
      {
        heading: "The ladder",
        table: {
          headers: ["Model", "Guarantee", "Cost", "Typical use"],
          rows: [
            [
              "Linearizable (strong)",
              "One copy, real-time order; a read sees the latest completed write",
              "Quorum round trip on every operation; unavailable in a minority partition",
              "Locks, leader election, balances, unique constraints",
            ],
            [
              "Sequential",
              "All nodes see the same order, not necessarily real time",
              "Cheaper than linearizable; still needs total ordering",
              "Replicated state machines",
            ],
            [
              "Causal",
              "Causally related operations are seen in order; concurrent ones may differ",
              "Metadata per operation (version vectors); no global coordination",
              "Comments and replies, collaborative editing",
            ],
            [
              "Read-your-writes",
              "You always see your own writes",
              "Session routing or a log position; nearly free",
              "Profile edits, posting, settings",
            ],
            [
              "Monotonic reads",
              "Time never moves backwards within a session",
              "Pin a session to a replica",
              "Feeds, listings, anything paginated",
            ],
            [
              "Bounded staleness",
              "No more than T seconds or N versions behind",
              "Track lag and route away from stale replicas",
              "Dashboards, reporting, prices",
            ],
            [
              "Eventual",
              "Converges if writes stop",
              "Effectively free",
              "View counts, recommendations, presence",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "Session guarantees are the highest-value rung. Read-your-writes plus monotonic reads removes the overwhelming majority of 'the site is broken' reports from a replicated system, and costs a routing rule rather than a consensus protocol.",
        },
      },
      {
        heading: "Name the anomaly, then pick the model",
        steps: [
          {
            title: "'I saved it and it disappeared'",
            text: "A write went to the leader, the next read hit a lagging replica. This is a read-your-writes violation, not a database bug.",
            detail: "Fix: route this user's reads to the leader briefly after their write, or to a replica past that log position.",
          },
          {
            title: "'A comment appeared, then vanished'",
            text: "Consecutive reads hit replicas with different lag. Monotonic reads violated.",
            detail: "Fix: pin the session to one replica — hash(user_id) → replica.",
          },
          {
            title: "'The reply shows before the question'",
            text: "Causally related writes replicated out of order, often across partitions. Causal consistency violated.",
            detail: "Fix: keep causally related data in one partition, or carry causal metadata and buffer until dependencies arrive.",
          },
          {
            title: "'Two people booked the same seat'",
            text: "A read-then-write across replicas with no serialisation. This one needs real linearizability, or an atomic conditional write.",
            detail: "Fix: compare-and-set on the row, or a quorum write with w + r > n on that key.",
          },
          {
            title: "'The balance was briefly negative'",
            text: "An invariant spanning multiple items, checked without isolation. This is a transaction/isolation problem, not a replication one.",
            detail: "Fix: serializable transaction on one node, or a single-partition design that keeps the invariant local.",
          },
        ],
      },
      {
        heading: "Consistency versus isolation — two different words",
        body: [
          "The C in ACID means 'the database moves from one valid state to another according to its constraints'. The C in CAP means linearizability across replicas. They are unrelated, and conflating them causes a lot of confused interview answers.",
          "In practice, distributed correctness needs both: an isolation level that prevents the anomalies within a transaction, and a consistency model that governs what replicas may show.",
        ],
        table: {
          headers: ["Isolation level", "Prevents", "Still allows", "Cost"],
          rows: [
            ["Read uncommitted", "Nothing much", "Dirty reads", "None"],
            ["Read committed", "Dirty reads", "Non-repeatable reads, phantoms", "Low — the common default"],
            ["Repeatable read / snapshot", "Non-repeatable reads", "Write skew, phantoms (engine-dependent)", "Moderate; MVCC makes it cheap"],
            ["Serializable", "Everything — as if run one at a time", "Nothing", "Conflict aborts and retries; contention hurts"],
          ],
        },
        code: {
          title: "Write skew: the anomaly snapshot isolation does not prevent",
          lang: "sql",
          source: `-- Rule: at least one doctor must remain on call.
-- Both transactions read a consistent snapshot showing two on call.

-- T1 (Alice)                          -- T2 (Bob)
BEGIN;                                 BEGIN;
SELECT count(*) FROM oncall            SELECT count(*) FROM oncall
  WHERE on_call = true;   -- 2           WHERE on_call = true;   -- 2
UPDATE oncall SET on_call = false      UPDATE oncall SET on_call = false
  WHERE name = 'alice';                  WHERE name = 'bob';
COMMIT;                                COMMIT;
-- Now nobody is on call. Each transaction was individually valid.

-- Fixes: SERIALIZABLE isolation, an explicit SELECT ... FOR UPDATE on the
-- rows the decision depends on, or a constraint the database can enforce.`,
        },
      },
      {
        heading: "How systems achieve strong consistency",
        bullets: [
          "Single leader: all writes ordered by one node, reads from the leader. Simple and linearizable, limited by that node's capacity.",
          "Quorums: w + r > n guarantees a read set overlaps the write set. Overlap alone is not linearizability — you also need read repair or a coordination protocol to handle concurrent writes.",
          "Consensus (Raft, Paxos): a replicated log with a majority, giving linearizable operations and automatic leader election. This is what etcd and ZooKeeper are.",
          "Synchronised clocks (Spanner's TrueTime): bounded clock uncertainty lets transactions wait out the interval and get external consistency without extra round trips.",
          "Deterministic ordering (Calvin, VoltDB): agree on the order first, then execute deterministically everywhere.",
        ],
        math: [
          {
            label: "Linearizable read cost",
            expr: "≥ 1 quorum round trip (or a leader lease check)",
            result: "+1 RTT",
            note: "Same-region ≈ 1 ms; cross-region ≈ 50-150 ms.",
          },
          {
            label: "Eventual read cost",
            expr: "local replica read",
            result: "≈ 0 RTT",
          },
          {
            label: "Cross-region strong consistency",
            expr: "3 regions, majority = 2, farthest of the nearest two ≈ 70 ms",
            result: "≈ 70 ms per write",
            note: "This is why globally strong systems keep writes regional where they can.",
          },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Does your system need strong consistency?",
            a: "Only where an incorrect answer causes a real problem — money, inventory, locks, uniqueness. For those I would use a linearizable path: a single leader or a consensus-backed store, and a conditional write. Everything else gets eventual consistency plus session guarantees, because read-your-writes and monotonic reads remove nearly all of the user-visible weirdness at a fraction of the cost.",
          },
          {
            q: "What is the difference between the C in ACID and the C in CAP?",
            a: "They are unrelated despite the letter. ACID's C is about constraints holding within a transaction — the database will not let you violate a foreign key. CAP's C is linearizability across replicas — a read reflects the most recent completed write. A system can be fully ACID on one node and still serve stale reads from a replica, which is exactly the common production setup.",
          },
          {
            q: "How do you implement read-your-writes cheaply?",
            a: "Record the log position of the user's write in their session, and route their reads either to the leader or to a replica that has applied at least that position, for a short window. The cheaper approximation used widely is 'send this user's reads to the leader for N seconds after a write'. Both cost a routing rule rather than a change to the replication model.",
          },
          {
            q: "What is causal consistency and when do you need it?",
            a: "It guarantees that if one operation could have influenced another — a reply to a comment, an edit after a read — everyone observes them in that order, while genuinely concurrent operations may be seen differently. You need it whenever ordering is visible to users but global agreement is too expensive, like comment threads across regions. It is implemented with version vectors or by keeping causally linked data in one partition, which is usually the simpler answer.",
          },
        ],
      },
    ],
    related: ["/hld/cap-theorem", "/hld/quorum", "/hld/replication", "/hld/consensus"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "quorum",
    title: "Quorums (W + R > N)",
    subtitle: "Buy consistency per request by choosing how many replicas must answer.",
    level: "intermediate",
    minutes: 12,
    tags: ["distributed", "consistency", "replication"],
    summary:
      "In a leaderless system every replica can serve reads and accept writes. A quorum is the rule that keeps that from becoming chaos: if the number of replicas you write to plus the number you read from exceeds the total, the two sets must overlap, so a read always sees at least one copy of the latest write.",
    keyPoints: [
      "W + R > N guarantees overlap. Overlap guarantees you see the newest value — provided you can tell which one is newest.",
      "N is the replication factor, W the write quorum, R the read quorum, all tunable per request.",
      "W = N, R = 1 favours fast reads; W = 1, R = N favours fast writes; W = R = ⌈(N+1)/2⌉ balances.",
      "Overlap alone is not linearizability — concurrent writes still need version reconciliation.",
      "Sloppy quorums and hinted handoff trade the guarantee for availability during failures.",
    ],
    prerequisites: ["/hld/replication"],
    sections: [
      {
        heading: "Why overlap works",
        body: [
          "Suppose N = 3 and you write to W = 2 replicas. Any subsequent read from R = 2 replicas must include at least one of those two, because 2 + 2 > 3 means the sets cannot be disjoint. That one replica holds the new value, and a version number tells the client which of the returned values to trust.",
        ],
        math: [
          {
            label: "Overlap condition",
            expr: "W + R > N",
            result: "read set ∩ write set ≠ ∅",
          },
          {
            label: "Durability condition",
            expr: "W > N / 2",
            result: "no two conflicting write quorums",
            note: "Without it, two disjoint write quorums can both succeed and neither knows about the other.",
          },
          {
            label: "Failure tolerance",
            expr: "writes survive N − W failures; reads survive N − R",
            result: "N=3, W=R=2 → 1 failure",
          },
          {
            label: "Latency",
            expr: "wait for the W-th (or R-th) fastest replica",
            result: "the median, not the slowest",
            note: "This is why quorums beat 'wait for everyone': one slow node does not stall you.",
          },
        ],
        diagram: {
          kind: "sequence",
          caption: "N=3, W=2, R=2 — the read set is guaranteed to touch a replica with the new value.",
          actors: [
            { id: "c", label: "Client" },
            { id: "r1", label: "Replica 1" },
            { id: "r2", label: "Replica 2" },
            { id: "r3", label: "Replica 3", sub: "slow / down" },
          ],
          messages: [
            { from: "c", to: "r1", label: "write x=2 (v7)", kind: "call" },
            { from: "c", to: "r2", label: "write x=2 (v7)", kind: "call" },
            { from: "c", to: "r3", label: "write x=2 (v7)", kind: "async", tone: "warn", note: "no ack — that is fine, W=2 satisfied" },
            { from: "r2", to: "c", label: "ack (2 of 3) → write succeeds", kind: "return", tone: "ok" },
            { from: "c", to: "r2", label: "read x", kind: "call" },
            { from: "c", to: "r3", label: "read x", kind: "call", note: "returns stale v6" },
            { from: "r2", to: "c", label: "v7 = 2 · r3 says v6 = 1 → take v7", kind: "return", tone: "ok" },
            { from: "c", to: "r3", label: "read repair: write v7 back", kind: "async", note: "the stale replica is fixed as a side effect" },
          ],
        },
      },
      {
        heading: "Choosing W and R",
        table: {
          headers: ["Configuration", "Read latency", "Write latency", "Tolerates", "Use for"],
          rows: [
            ["N=3, W=2, R=2", "Median of 2", "Median of 2", "1 node down", "The balanced default"],
            ["N=3, W=3, R=1", "Fastest replica", "Slowest replica", "0 down for writes", "Read-heavy, rarely written config"],
            ["N=3, W=1, R=3", "Slowest replica", "Fastest replica", "0 down for reads", "Write-heavy logging; reads are rare"],
            ["N=3, W=1, R=1", "Fastest", "Fastest", "2 down", "No overlap — eventual only; metrics, counters"],
            ["N=5, W=3, R=3", "Median of 3", "Median of 3", "2 nodes down", "Higher durability across 3 AZs"],
          ],
        },
        callout: {
          kind: "warn",
          text: "W = 1 with R = 1 is a legitimate configuration but has no overlap, so it is plain eventual consistency. People sometimes set it for speed and then are surprised by stale reads — the arithmetic told them in advance.",
        },
      },
      {
        heading: "What quorums do not give you",
        bullets: [
          "Linearizability. Two clients writing concurrently can each satisfy W without seeing the other; a later read sees two versions and must reconcile them. That needs version vectors, last-write-wins, or application merge logic.",
          "Last-write-wins by wall clock silently loses data when clocks skew — the losing write vanishes with no error. Prefer version vectors, or an LWW field you understand the consequences of.",
          "Atomicity across keys. A quorum is per key; there is no transaction spanning several.",
          "Protection from a partial write. If a write reaches 2 of 3 and the client crashes, the value persists — quorum writes are not transactional, and 'failed' writes may still be visible.",
        ],
        code: {
          title: "Reconciling with version vectors instead of clocks",
          lang: "ts",
          source: `type Versioned<T> = { value: T; vv: Record<NodeId, number> };

function compare(a: VV, b: VV): "before" | "after" | "concurrent" | "equal" {
  let aGreater = false, bGreater = false;
  for (const node of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[node] ?? 0, y = b[node] ?? 0;
    if (x > y) aGreater = true;
    if (y > x) bGreater = true;
  }
  if (aGreater && bGreater) return "concurrent";   // <- real conflict
  if (aGreater) return "after";
  if (bGreater) return "before";
  return "equal";
}

// On a quorum read returning several versions:
//   - drop any version that is strictly "before" another
//   - if one remains, return it
//   - if several remain, they are concurrent: return all of them (siblings)
//     and let the application merge — a shopping cart unions its items.`,
        },
      },
      {
        heading: "Sloppy quorums, hinted handoff and anti-entropy",
        bullets: [
          "Sloppy quorum: if the N designated replicas for a key are unreachable, write to any N healthy nodes instead. Availability goes up; the overlap guarantee is gone until the data gets home.",
          "Hinted handoff: the temporary holder keeps a hint recording who the data really belongs to, and forwards it when that node returns.",
          "Read repair: when a read finds a stale replica, write the newer version back. Cheap, and it heals the keys that are actually being read.",
          "Anti-entropy: background comparison of replicas using Merkle trees, so rarely-read keys converge too. Read repair alone leaves cold data stale indefinitely.",
        ],
        diagram: {
          kind: "compare",
          caption: "Strict versus sloppy — an availability decision, taken explicitly.",
          options: [
            {
              title: "Strict quorum",
              good: ["The W + R > N guarantee actually holds", "Simple to reason about"],
              bad: ["Writes fail when enough of the key's home replicas are down"],
              verdict: "When a stale read would be harmful.",
            },
            {
              title: "Sloppy quorum + hinted handoff",
              good: ["Writes keep succeeding through node and zone failures", "Data reaches its home automatically on recovery"],
              bad: [
                "Reads may miss recent writes until handoff completes",
                "Hints accumulate on healthy nodes; a long outage is a memory problem",
              ],
              verdict: "Availability-first stores — Dynamo's original design.",
            },
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What W and R would you pick, and why?",
            a: "N=3 with W=2 and R=2 as the default: it tolerates one node down for both reads and writes, gives the overlap guarantee, and the latency is the median replica rather than the slowest. Then I would tune per operation — a config value read constantly and written rarely can use W=3, R=1 so reads are single-replica fast.",
          },
          {
            q: "Does W + R > N give linearizability?",
            a: "No, and this is the common trap. It guarantees the read set overlaps the write set, so the newest committed value is among the ones returned — but concurrent writes can still produce two versions that neither happened before the other. You need version vectors to detect that, and either an application merge or a coordination protocol to resolve it. Real linearizability comes from consensus, not from quorum arithmetic.",
          },
          {
            q: "Why is W > N/2 recommended even when W + R > N holds?",
            a: "Because without a majority, two disjoint write quorums can both succeed — with N=3 and W=1, two clients can write to different single nodes and neither conflicts. Requiring a majority for writes means any two write quorums intersect, so there is always a node that saw both and the conflict is at least detectable.",
          },
          {
            q: "What happens to a write that reaches only one of two required replicas?",
            a: "The client gets an error, but the value is still sitting on that one replica — quorum writes are not atomic and there is no rollback. So a later read might return the 'failed' write. Applications on these systems have to be idempotent and treat a failed write as 'unknown outcome, retry safely' rather than 'did not happen'.",
          },
        ],
      },
    ],
    related: ["/hld/replication", "/hld/consistency", "/hld/cap-theorem", "/playgrounds/quorum"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
    playground: "quorum",
  },

  {
    slug: "consensus",
    title: "Consensus: Raft and Paxos",
    subtitle: "How a group of machines agrees on one value when any of them can fail.",
    level: "advanced",
    minutes: 15,
    tags: ["distributed", "consensus", "coordination"],
    summary:
      "Consensus is the primitive underneath leader election, distributed locks, configuration stores and any database that promises linearizability across replicas. Raft is the algorithm to be able to explain: a leader, a replicated log, and a majority rule that makes split brain impossible rather than unlikely.",
    keyPoints: [
      "A majority (⌊n/2⌋ + 1) is what makes it work: two majorities of the same cluster must share a member.",
      "Raft splits the problem into leader election, log replication, and safety — deliberately, to be teachable.",
      "An entry is committed once a majority has stored it; only then may it be applied and acknowledged.",
      "Consensus is expensive — a round trip to a majority per write — so keep it off the data path.",
      "You almost never implement it. You use etcd, ZooKeeper, Consul, or a database that embeds it.",
    ],
    sections: [
      {
        heading: "What problem it solves",
        body: [
          "Several nodes must agree on a single sequence of values, with nodes crashing and messages being delayed or lost. If they can do that, they can agree on who the leader is, what the configuration says, who holds a lock, and what order writes happened in — which is nearly everything hard about distributed systems.",
          "The impossibility result worth knowing: FLP proves that in a fully asynchronous network with even one faulty process, no deterministic algorithm can guarantee consensus in bounded time. Real systems get around it with timeouts and randomisation, giving up guaranteed termination in exchange for termination in practice.",
        ],
        table: {
          headers: ["Used for", "What is agreed", "Typical system"],
          rows: [
            ["Leader election", "Which node is the primary right now", "Raft in etcd, Kafka's controller"],
            ["Configuration", "The current cluster membership and settings", "ZooKeeper, etcd"],
            ["Distributed locks", "Who holds the lease", "etcd leases, ZooKeeper ephemeral nodes"],
            ["Replicated log", "The order of writes", "Raft in CockroachDB, TiKV, Consul"],
            ["Atomic commit across shards", "Whether a transaction commits", "Paxos Commit, Spanner"],
          ],
        },
      },
      {
        heading: "Raft in one page",
        steps: [
          {
            title: "Terms and roles",
            text: "Time is divided into terms, each with at most one leader. Every node is a follower, a candidate, or the leader. Terms are the logical clock that makes stale leaders detectable.",
            detail: "Any message carrying a higher term forces the receiver to step down and become a follower.",
          },
          {
            title: "Leader election",
            text: "A follower that hears nothing from a leader for its election timeout becomes a candidate, increments the term, and asks everyone to vote. It becomes leader on receiving a majority. Timeouts are randomised (say 150-300 ms) so simultaneous candidacies are rare.",
            detail: "A node votes at most once per term, which is why two leaders in one term are impossible.",
          },
          {
            title: "Log replication",
            text: "Clients send commands to the leader, which appends to its log and sends AppendEntries to followers. Once a majority has stored the entry, it is committed; the leader applies it to its state machine and answers the client.",
            detail: "AppendEntries doubles as the heartbeat, so an idle leader still holds its position.",
          },
          {
            title: "Safety: the election restriction",
            text: "A node only grants a vote to a candidate whose log is at least as up to date as its own. This is what guarantees a new leader already holds every committed entry, so nothing committed can ever be lost.",
          },
          {
            title: "Membership changes",
            text: "Adding or removing nodes uses a joint consensus step so that old and new majorities always overlap during the change — otherwise you could briefly have two disjoint majorities and two leaders.",
          },
        ],
        diagram: {
          kind: "sequence",
          caption: "One committed write. The client's ack comes after a majority has it durably.",
          actors: [
            { id: "c", label: "Client" },
            { id: "l", label: "Leader", sub: "term 7" },
            { id: "f1", label: "Follower 1" },
            { id: "f2", label: "Follower 2" },
          ],
          messages: [
            { from: "c", to: "l", label: "SET config.timeout = 30", kind: "call" },
            { from: "l", to: "l", label: "append to local log (index 42)", kind: "self" },
            { from: "l", to: "f1", label: "AppendEntries(term=7, prev=41, entry)", kind: "call" },
            { from: "l", to: "f2", label: "AppendEntries(term=7, prev=41, entry)", kind: "call" },
            { from: "f1", to: "l", label: "ok", kind: "return", tone: "ok", note: "2 of 3 have it → committed" },
            { from: "l", to: "l", label: "apply to state machine", kind: "self", tone: "accent" },
            { from: "l", to: "c", label: "ok", kind: "return", tone: "ok" },
            { from: "f2", to: "l", label: "ok (late — already committed)", kind: "return" },
          ],
        },
        callout: {
          kind: "insight",
          text: "The whole safety argument rests on one sentence: any two majorities of the same cluster share at least one member. That shared member remembers the previous term's votes and the previous leader's entries, which is why nothing committed can be forgotten.",
        },
      },
      {
        heading: "Raft versus Paxos, and what to say",
        diagram: {
          kind: "compare",
          caption: "Same guarantees; very different to explain.",
          options: [
            {
              title: "Raft",
              tone: "ok",
              good: [
                "Designed for understandability; you can explain it in an interview",
                "Strong leader makes the normal path simple",
                "Membership change is specified, not left as an exercise",
              ],
              bad: ["Leader is a throughput bottleneck", "All writes take a leader round trip"],
              verdict: "The default for new systems: etcd, Consul, CockroachDB, TiKV.",
            },
            {
              title: "Paxos / Multi-Paxos",
              good: ["Older, deeply studied, very flexible", "Variants (Flexible, EPaxos) relax the leader bottleneck"],
              bad: [
                "Famously hard to specify completely; implementations diverge",
                "Basic Paxos agrees on one value — real use needs Multi-Paxos, which the paper does not fully describe",
              ],
              verdict: "Google's stack (Chubby, Spanner); mention it, implement Raft.",
            },
          ],
        },
        bullets: [
          "Cluster size: 3 tolerates 1 failure, 5 tolerates 2, 7 tolerates 3. Larger clusters do not increase throughput — they increase the majority you must wait for. Five is a common sweet spot.",
          "Always use an odd number. Four nodes still needs three for a majority, so it tolerates the same single failure as three while costing more.",
          "Byzantine fault tolerance is a different problem: Raft and Paxos assume nodes may crash or be slow, not lie. PBFT and blockchain protocols handle lying, at much higher cost.",
        ],
      },
      {
        heading: "Using consensus without paying for it everywhere",
        bullets: [
          "Keep it out of the data path. Use consensus to agree who the leader is, then let the leader serve traffic at normal speed — this is exactly what Kafka's controller and most databases do.",
          "Leader leases turn linearizable reads into local reads: while the leader holds a valid, time-bounded lease, it can answer reads without a quorum round trip. This depends on bounded clock drift, so understand the assumption.",
          "Batch and pipeline: a Raft leader can batch many client commands into one AppendEntries, which is what makes tens of thousands of writes per second possible despite a round trip per commit.",
          "Cross-region consensus costs a wide-area round trip per write. Keep the majority within one region, and put the far replica in as a non-voting learner if it is only there for disaster recovery.",
          "Watch out for the distributed-lock trap: a lock held over a GC pause can expire while the holder thinks it still owns it. That is why leases must be paired with fencing tokens that the storage layer checks.",
        ],
        code: {
          title: "A lease is not enough — you need a fencing token",
          lang: "ts",
          source: `// Node A acquires the lock with lease token 33, then stops the world for 20s.
const lease = await etcd.acquire("job-lock", { ttlSeconds: 10 });   // token = 33
// ... GC pause ...                       // lease expires; node B acquires (token = 34)
// Node A wakes up believing it still holds the lock and writes.

// The storage layer must reject the stale writer:
await storage.write(data, { fencingToken: lease.token });
//   store keeps the highest token it has seen (34)
//   a write arriving with token 33 is rejected

// Without the token, both A and B write and the lock guaranteed nothing.`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How does Raft prevent two leaders?",
            a: "Two ways that reinforce each other. A node votes at most once per term, and a leader needs a majority, so two leaders in the same term would require a node to vote twice. Across terms, any message with a higher term causes the older leader to step down — and because a majority already moved to the new term, the old leader cannot commit anything, since committing also requires a majority.",
          },
          {
            q: "How many nodes would you run?",
            a: "Five for something important, spread across three availability zones so losing a zone leaves a majority. Three is fine for smaller deployments and tolerates one failure. I would not go to seven without a reason — it does not add throughput, it just widens the majority you wait for on every write.",
          },
          {
            q: "Would you build consensus yourself?",
            a: "No. The algorithms are well understood but the implementations are where the subtle bugs live — log compaction, snapshot transfer, membership changes, restart recovery. I would use etcd or ZooKeeper, or a database that embeds a well-tested Raft. Being able to explain how it works matters; writing it does not.",
          },
          {
            q: "Can you do a linearizable read without a round trip?",
            a: "With a leader lease, yes: the leader knows no other leader can exist for the lease duration, so it can answer from local state. That trades a clock assumption for latency, and if clock drift exceeds the bound the guarantee breaks. The alternative Raft offers is ReadIndex — confirm leadership with a lightweight heartbeat to a majority, which is cheaper than a full log entry but still a round trip.",
          },
        ],
      },
    ],
    related: ["/hld/quorum", "/hld/consistency", "/hld/replication", "/hld/gossip"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "availability",
    title: "Availability & Fault Tolerance",
    subtitle: "Nines, failure domains, and designing for the failure you will actually have.",
    level: "intermediate",
    minutes: 14,
    tags: ["reliability", "operations", "resilience"],
    summary:
      "Availability is not a property you add at the end; it is the sum of every dependency, every single point of failure, and every retry policy in the system. The useful skills are computing what your architecture can actually deliver, spotting the correlated failures that make redundancy useless, and knowing which degradations users will accept.",
    keyPoints: [
      "Nines are a budget: 99.9% is 43 minutes of downtime a month, 99.99% is 4 minutes.",
      "Serial dependencies multiply and always reduce availability; redundancy adds nines only if failures are independent.",
      "Most real outages are correlated: shared config, shared dependency, or a deploy — redundancy does not help.",
      "Graceful degradation beats total failure: serve stale, serve partial, queue the write.",
      "MTTR is usually easier to improve than MTBF, and it moves the number just as much.",
    ],
    sections: [
      {
        heading: "The arithmetic",
        math: [
          {
            label: "Downtime budget",
            expr: "99.9% → 43.8 min/month · 99.99% → 4.4 min · 99.999% → 26 s",
            result: "per month",
            note: "One bad deploy costs more than a month of 99.99%.",
          },
          {
            label: "Serial dependencies",
            expr: "0.999 (LB) × 0.999 (app) × 0.999 (DB) × 0.999 (cache)",
            result: "99.6%",
            note: "Four 'three nines' components in series give less than three nines.",
          },
          {
            label: "Redundant components",
            expr: "1 − (1 − 0.99)² for two independent instances",
            result: "99.99%",
            note: "Only if the failures are genuinely independent — which they often are not.",
          },
          {
            label: "Availability formula",
            expr: "MTBF / (MTBF + MTTR)",
            result: "recovery time matters",
            note: "Halving recovery time improves availability exactly as much as doubling time-between-failures.",
          },
        ],
        callout: {
          kind: "insight",
          text: "The serial multiplication is the number most designs ignore. Every synchronous dependency you add lowers the ceiling — which is a strong argument for making non-critical calls asynchronous or optional rather than adding another replica.",
        },
      },
      {
        heading: "Failure domains and correlation",
        bullets: [
          "Spread across failure domains, not just across machines: three instances in one availability zone give you almost nothing when the zone loses power.",
          "Correlated failures defeat redundancy. Shared config, a shared feature flag, a shared certificate authority, a shared DNS zone, one bad deploy pushed everywhere — all of these take down every replica simultaneously.",
          "Beware shared fate through dependencies: five services that each look independent but all call the same auth service have one availability number, not five.",
          "Cell-based architecture is the strongest structural answer: partition users into independent cells, each with its own full stack, so a failure affects one cell rather than everyone.",
          "Deploy is the single most common cause of outages. Canary, gradual rollout and fast rollback are availability features, not process overhead.",
        ],
        diagram: {
          kind: "compare",
          caption: "Two architectures with the same component count and very different blast radii.",
          options: [
            {
              title: "Shared everything",
              tone: "warn",
              good: ["Simple, efficient, easy to operate", "Resource pooling"],
              bad: [
                "One bad deploy affects 100% of users",
                "A poisoned cache entry or hot tenant hurts everyone",
                "Recovery means recovering everything at once",
              ],
              verdict: "Small systems where the blast radius is acceptable.",
            },
            {
              title: "Cell-based",
              tone: "ok",
              good: [
                "Failure is contained to one cell — a fraction of users",
                "Deploys roll cell by cell, so a bad one is caught small",
                "Recovery is bounded and repeatable",
              ],
              bad: ["More infrastructure and routing complexity", "Cross-cell operations become awkward"],
              verdict: "Large multi-tenant systems where a total outage is unacceptable.",
            },
          ],
        },
      },
      {
        heading: "Designing for degradation",
        table: {
          headers: ["Dependency fails", "Total failure", "Graceful degradation"],
          rows: [
            ["Recommendations service", "Product page 500s", "Show a static best-sellers list"],
            ["Cache tier", "Every request errors", "Fall through to the database with a rate limit"],
            ["Search index", "Search page down", "Fall back to a simple database prefix query"],
            ["Payment provider", "Checkout down", "Queue the order, capture later, tell the user honestly"],
            ["A read replica", "Reads fail", "Route to another replica or to the leader"],
            ["Metrics pipeline", "Requests block on the emit", "Drop metrics; never block a request on telemetry"],
          ],
        },
        bullets: [
          "Classify every dependency as critical or optional, and make the optional ones fail open with a timeout and a fallback. Most designs have far fewer genuinely critical dependencies than they act like.",
          "Timeouts must be shorter as you go deeper: if the user-facing request has a 3-second budget, an inner call cannot have a 10-second timeout. Propagate deadlines rather than setting each timeout independently.",
          "Retries need a budget and jitter. Naive retry on a struggling dependency multiplies its load exactly when it can least handle it.",
          "Load shedding is a feature: reject a fraction of requests early with a clear error rather than accepting everything and timing out for everyone.",
          "Backpressure beats buffering. An unbounded queue in front of a slow consumer converts a latency problem into an out-of-memory crash.",
        ],
        code: {
          title: "An optional dependency, done properly",
          lang: "ts",
          source: `async function productPage(id: string) {
  const product = await catalog.get(id);              // critical: no fallback

  const recommendations = await withFallback(
    () => recs.forProduct(id, { timeoutMs: 150 }),    // short, hard timeout
    () => staticBestSellers(),                        // always available
  );

  return render(product, recommendations);
}

async function withFallback<T>(primary: () => Promise<T>, fallback: () => T): Promise<T> {
  try { return await primary(); }
  catch (err) {
    metrics.inc("fallback.used", { dep: "recs" });    // visible, not silent
    return fallback();
  }
}
// The 150ms timeout matters as much as the fallback: without it, a hung
// recommendation service holds the request until the outer timeout fires.`,
        },
      },
      {
        heading: "Measuring it honestly",
        bullets: [
          "Measure availability from the user's side, not from your load balancer's. Synthetic probes from real regions and client-reported errors catch failures that server-side metrics show as healthy.",
          "Define what 'up' means per journey: checkout succeeding matters more than the homepage rendering, and an average across all endpoints hides the one that matters.",
          "Use error budgets: 99.9% means 43 minutes of failure is acceptable per month. Spending it deliberately on faster releases is a legitimate choice; running out means slowing down.",
          "Track MTTR alongside incident count. Fast, safe rollback is usually the highest-leverage availability investment a team can make.",
          "Test the failure paths. Failover that has never been exercised does not work — this is what game days and chaos experiments are for.",
        ],
        math: [
          {
            label: "Error budget",
            expr: "(1 − 0.999) × 30 days × 24 h × 60 min",
            result: "43.2 min/month",
          },
          {
            label: "Cost of a slow rollback",
            expr: "5 min to detect + 25 min to roll back",
            result: "70% of a 99.9% budget",
            note: "One incident. Rollback speed is an availability feature.",
          },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How would you get this system to four nines?",
            a: "First I would compute what the current architecture can deliver, because serial dependencies multiply and the ceiling is often lower than people expect. Then remove single points of failure, spread across availability zones so failures are less correlated, and make non-critical dependencies optional with timeouts and fallbacks. After that the biggest lever is usually recovery time — canary deploys and fast rollback — because four nines is four minutes a month and a slow rollback spends it in one incident.",
          },
          {
            q: "You have three replicas and still had a total outage. How?",
            a: "Correlated failure. The usual candidates are a deploy that went to all three, a shared config or feature flag change, an expired certificate, a dependency they all call, or all three sitting in one availability zone. Redundancy only multiplies availability when failures are independent, and in practice most are not — which is why cell-based isolation and staged rollouts matter more than replica count.",
          },
          {
            q: "What do you do when a downstream service is down?",
            a: "It depends whether it is critical. For an optional one, short timeout, fallback, and a circuit breaker so I stop sending requests to something that is failing — plus a metric so the degradation is visible rather than silent. For a critical one, the honest options are to queue the work and complete it asynchronously, or to fail fast with a clear message. What I would avoid is retrying aggressively, which turns their outage into a longer one.",
          },
          {
            q: "How do you know your failover works?",
            a: "By running it. Scheduled failover exercises, and chaos experiments that kill instances and partition networks in a controlled way. Untested failover reliably fails in the ways nobody predicted — DNS TTLs too long, the standby never actually replicating, credentials that only exist on the primary. I would rather find those on a Tuesday afternoon than during an incident.",
          },
        ],
      },
    ],
    related: ["/hld/circuit-breaker", "/hld/load-balancing", "/hld/observability", "/hld/replication"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
