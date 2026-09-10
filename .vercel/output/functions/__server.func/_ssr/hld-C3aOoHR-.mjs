//#region node_modules/.nitro/vite/services/ssr/assets/hld-C3aOoHR-.js
var hldConsistency = [
	{
		slug: "cap-theorem",
		title: "CAP Theorem (and PACELC)",
		subtitle: "During a partition you choose; the rest of the time you are choosing something else.",
		level: "intermediate",
		minutes: 13,
		tags: [
			"distributed",
			"theory",
			"trade-offs"
		],
		summary: "CAP says that when the network partitions, a distributed system must give up either consistency or availability. It is often recited badly — as if you pick two of three at design time. Partitions are not optional, so the real statement is narrower and more useful, and PACELC completes it by describing the trade-off you make when the network is fine.",
		keyPoints: [
			"P is not a choice. Networks partition, so every distributed system is CP or AP.",
			"C in CAP means linearizability, not the C in ACID — different words, same letter.",
			"The choice is per operation, not per system: the same database can serve a linearizable read and an eventual one.",
			"PACELC: if Partition then A or C, Else then Latency or Consistency. The 'else' branch governs 99.9% of the time.",
			"Partitions are rare; latency is constant. Most real designs are decided by the else branch."
		],
		sections: [
			{
				heading: "What the theorem actually says",
				body: ["Consider two nodes that can no longer talk to each other, and a client that writes to one and reads from the other. Either the read waits (or errors) until the nodes reconnect — that is choosing consistency — or it answers with possibly stale data — that is choosing availability. There is no third option, because the information physically has not arrived.", "That is the whole theorem. It says nothing about ordinary operation, nothing about latency, and nothing about the ACID guarantees of a single-node database."],
				diagram: {
					kind: "sequence",
					caption: "The partitioned moment: the node on the right must choose.",
					actors: [
						{
							id: "w",
							label: "Writer"
						},
						{
							id: "n1",
							label: "Node A"
						},
						{
							id: "n2",
							label: "Node B",
							sub: "partitioned from A"
						},
						{
							id: "r",
							label: "Reader"
						}
					],
					messages: [
						{
							from: "w",
							to: "n1",
							label: "SET x = 2",
							kind: "call"
						},
						{
							from: "n1",
							to: "w",
							label: "ok",
							kind: "return",
							tone: "ok"
						},
						{
							from: "n1",
							to: "n2",
							label: "replicate x = 2",
							kind: "async",
							tone: "bad",
							note: "✗ network partition — never arrives"
						},
						{
							from: "r",
							to: "n2",
							label: "GET x",
							kind: "call"
						},
						{
							from: "n2",
							to: "r",
							label: "CP: error / timeout — refuse to answer",
							kind: "return",
							tone: "warn"
						},
						{
							from: "n2",
							to: "r",
							label: "AP: 1 — stale but available",
							kind: "return",
							tone: "warn"
						}
					]
				},
				callout: {
					kind: "warn",
					text: "The classic misstatement is 'pick two of three'. You cannot pick P — the network decides that. A single-node database is not CA in any meaningful sense; it just is not distributed, so the theorem does not apply."
				}
			},
			{
				heading: "CP and AP in practice",
				diagram: {
					kind: "compare",
					caption: "Both are correct answers. The question is what your feature can tolerate.",
					options: [{
						title: "CP — refuse rather than lie",
						sub: "etcd, ZooKeeper, Spanner, HBase",
						good: [
							"Reads never return stale data",
							"Safe for money, inventory, locks, leader election",
							"Reasoning is straightforward: one truth at a time"
						],
						bad: ["Minority partition is unavailable for writes and often for reads", "Requires a majority quorum, so latency is bounded by the median node"],
						verdict: "Anything where a wrong answer is worse than no answer."
					}, {
						title: "AP — answer with what you have",
						sub: "Cassandra, Dynamo, Riak, DNS",
						good: [
							"Every node keeps serving during a partition",
							"Write availability regardless of network state",
							"Latency stays low — no cross-node coordination on the hot path"
						],
						bad: ["Stale reads, and conflicting concurrent writes to resolve", "Application must handle merge semantics"],
						verdict: "Feeds, catalogues, metrics, presence, shopping carts."
					}]
				},
				table: {
					headers: [
						"Feature",
						"Choice",
						"Why"
					],
					rows: [
						[
							"Account balance / transfer",
							"CP",
							"Double-spend is unacceptable; a delay is annoying"
						],
						[
							"Social feed",
							"AP",
							"A post appearing a second late is invisible to the user"
						],
						[
							"Distributed lock / leader election",
							"CP",
							"Two leaders is the exact failure the lock exists to prevent"
						],
						[
							"Shopping cart",
							"AP with merge",
							"Amazon's original case: a re-added item beats a failed add"
						],
						[
							"Inventory 'in stock' badge",
							"AP",
							"It is an estimate — reconcile at checkout, which is CP"
						],
						[
							"Service discovery",
							"AP",
							"Stale endpoint plus health checks beats no endpoints at all"
						]
					]
				}
			},
			{
				heading: "PACELC: the part that governs normal operation",
				body: ["Daniel Abadi's extension: if there is a Partition, choose Availability or Consistency; Else — when the network is healthy — choose Latency or Consistency. The second clause is the one that shapes your architecture, because partitions are rare and latency is every request.", "Any strongly consistent read must contact a quorum, which costs at least one round trip and is bounded by your slowest necessary node. Serving from a local replica is fast and stale. That is the everyday trade."],
				table: {
					headers: [
						"System",
						"Partition",
						"Else",
						"Shorthand"
					],
					rows: [
						[
							"Postgres (single leader, sync replica)",
							"Consistency",
							"Consistency",
							"PC/EC"
						],
						[
							"Cassandra (default tunables)",
							"Availability",
							"Latency",
							"PA/EL"
						],
						[
							"DynamoDB (eventual reads)",
							"Availability",
							"Latency",
							"PA/EL"
						],
						[
							"DynamoDB (strongly consistent reads)",
							"Consistency",
							"Consistency",
							"PC/EC — and you pay double"
						],
						[
							"Spanner",
							"Consistency",
							"Consistency",
							"PC/EC — bought with TrueTime and hardware clocks"
						],
						[
							"MongoDB (majority write, primary read)",
							"Consistency",
							"Consistency",
							"PC/EC"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "Notice DynamoDB appears twice. Consistency is chosen per request, not per system — which is the most practically useful thing to say about CAP in an interview."
				}
			},
			{
				heading: "Using it well in a design discussion",
				bullets: [
					"Apply it per feature, not per system. A single application usually wants CP for payments and AP for the activity feed, backed by the same or different stores.",
					"Say what 'unavailable' means concretely: read-only mode, an error, a queued write, or a degraded response. 'Unavailable' as an abstraction is not a design.",
					"Quantify the partition. A 30-second partition where writes queue and drain is very different from a 30-minute one that fills a buffer.",
					"Remember that a slow node is indistinguishable from a partitioned one. Every timeout is a small CAP decision made by a piece of code you wrote.",
					"Most 'AP' systems still need a CP component somewhere — for leader election, configuration or locks. Naming that component is a good sign."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Is your design CP or AP?",
						a: "Per feature. Checkout and payment are CP — I would rather fail a purchase than sell inventory twice — so those go through a quorum-backed store and a transaction. Browsing, recommendations and the feed are AP, served from replicas and caches, because a few seconds of staleness there is imperceptible and availability matters more. The design question is where the boundary between the two sits."
					},
					{
						q: "Isn't a single-node Postgres CA?",
						a: "Not meaningfully — CAP is about behaviour under partition, and a single node has no partition to survive. What it has is no partition tolerance at all: if the machine or its network fails, it is simply down. Once you add a synchronous replica and failover, it becomes a CP system with a real availability trade-off during elections."
					},
					{
						q: "How does Spanner get around CAP?",
						a: "It does not — it is CP. What it does is make the unavailable window very small and the consistent path fast, by using TrueTime: atomic clocks and GPS give a bounded uncertainty interval, so transactions can wait out the uncertainty instead of coordinating more. Google reports availability high enough that most applications treat it as always up, but under a genuine partition the minority side still refuses writes."
					},
					{
						q: "What does eventual consistency actually mean for a user?",
						a: "That in the absence of new writes, all replicas converge — with no promise about when. In practice the interesting questions are the bounds: typical convergence time, the worst case, and which anomalies are visible. A user who posts a comment and does not see it is a read-your-writes failure, which I would fix with session-level routing rather than by making the whole system strongly consistent."
					}
				]
			}
		],
		related: [
			"/hld/consistency",
			"/hld/quorum",
			"/hld/replication",
			"/playgrounds/cap-theorem"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "cap-theorem"
	},
	{
		slug: "consistency",
		title: "Consistency Models",
		subtitle: "A ladder from linearizable to eventual, and what each rung costs.",
		level: "advanced",
		minutes: 17,
		tags: [
			"distributed",
			"consistency",
			"theory"
		],
		summary: "'Strongly consistent' and 'eventually consistent' are the two words most people know, and between them sits a ladder of models that let you buy exactly the guarantee a feature needs. The useful skill is naming the specific anomaly your feature cannot tolerate, then picking the weakest model that excludes it.",
		keyPoints: [
			"Linearizability: the system behaves as if there were one copy and operations happened instantly, in real-time order.",
			"Sequential and causal consistency preserve order without requiring real-time agreement — much cheaper.",
			"Session guarantees (read-your-writes, monotonic reads) fix most user-visible bugs at almost no cost.",
			"Eventual consistency alone promises convergence, not when or in what order.",
			"Stronger models cost latency and availability; pick per operation."
		],
		prerequisites: ["/hld/cap-theorem"],
		sections: [
			{
				heading: "The ladder",
				table: {
					headers: [
						"Model",
						"Guarantee",
						"Cost",
						"Typical use"
					],
					rows: [
						[
							"Linearizable (strong)",
							"One copy, real-time order; a read sees the latest completed write",
							"Quorum round trip on every operation; unavailable in a minority partition",
							"Locks, leader election, balances, unique constraints"
						],
						[
							"Sequential",
							"All nodes see the same order, not necessarily real time",
							"Cheaper than linearizable; still needs total ordering",
							"Replicated state machines"
						],
						[
							"Causal",
							"Causally related operations are seen in order; concurrent ones may differ",
							"Metadata per operation (version vectors); no global coordination",
							"Comments and replies, collaborative editing"
						],
						[
							"Read-your-writes",
							"You always see your own writes",
							"Session routing or a log position; nearly free",
							"Profile edits, posting, settings"
						],
						[
							"Monotonic reads",
							"Time never moves backwards within a session",
							"Pin a session to a replica",
							"Feeds, listings, anything paginated"
						],
						[
							"Bounded staleness",
							"No more than T seconds or N versions behind",
							"Track lag and route away from stale replicas",
							"Dashboards, reporting, prices"
						],
						[
							"Eventual",
							"Converges if writes stop",
							"Effectively free",
							"View counts, recommendations, presence"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "Session guarantees are the highest-value rung. Read-your-writes plus monotonic reads removes the overwhelming majority of 'the site is broken' reports from a replicated system, and costs a routing rule rather than a consensus protocol."
				}
			},
			{
				heading: "Name the anomaly, then pick the model",
				steps: [
					{
						title: "'I saved it and it disappeared'",
						text: "A write went to the leader, the next read hit a lagging replica. This is a read-your-writes violation, not a database bug.",
						detail: "Fix: route this user's reads to the leader briefly after their write, or to a replica past that log position."
					},
					{
						title: "'A comment appeared, then vanished'",
						text: "Consecutive reads hit replicas with different lag. Monotonic reads violated.",
						detail: "Fix: pin the session to one replica — hash(user_id) → replica."
					},
					{
						title: "'The reply shows before the question'",
						text: "Causally related writes replicated out of order, often across partitions. Causal consistency violated.",
						detail: "Fix: keep causally related data in one partition, or carry causal metadata and buffer until dependencies arrive."
					},
					{
						title: "'Two people booked the same seat'",
						text: "A read-then-write across replicas with no serialisation. This one needs real linearizability, or an atomic conditional write.",
						detail: "Fix: compare-and-set on the row, or a quorum write with w + r > n on that key."
					},
					{
						title: "'The balance was briefly negative'",
						text: "An invariant spanning multiple items, checked without isolation. This is a transaction/isolation problem, not a replication one.",
						detail: "Fix: serializable transaction on one node, or a single-partition design that keeps the invariant local."
					}
				]
			},
			{
				heading: "Consistency versus isolation — two different words",
				body: ["The C in ACID means 'the database moves from one valid state to another according to its constraints'. The C in CAP means linearizability across replicas. They are unrelated, and conflating them causes a lot of confused interview answers.", "In practice, distributed correctness needs both: an isolation level that prevents the anomalies within a transaction, and a consistency model that governs what replicas may show."],
				table: {
					headers: [
						"Isolation level",
						"Prevents",
						"Still allows",
						"Cost"
					],
					rows: [
						[
							"Read uncommitted",
							"Nothing much",
							"Dirty reads",
							"None"
						],
						[
							"Read committed",
							"Dirty reads",
							"Non-repeatable reads, phantoms",
							"Low — the common default"
						],
						[
							"Repeatable read / snapshot",
							"Non-repeatable reads",
							"Write skew, phantoms (engine-dependent)",
							"Moderate; MVCC makes it cheap"
						],
						[
							"Serializable",
							"Everything — as if run one at a time",
							"Nothing",
							"Conflict aborts and retries; contention hurts"
						]
					]
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
-- rows the decision depends on, or a constraint the database can enforce.`
				}
			},
			{
				heading: "How systems achieve strong consistency",
				bullets: [
					"Single leader: all writes ordered by one node, reads from the leader. Simple and linearizable, limited by that node's capacity.",
					"Quorums: w + r > n guarantees a read set overlaps the write set. Overlap alone is not linearizability — you also need read repair or a coordination protocol to handle concurrent writes.",
					"Consensus (Raft, Paxos): a replicated log with a majority, giving linearizable operations and automatic leader election. This is what etcd and ZooKeeper are.",
					"Synchronised clocks (Spanner's TrueTime): bounded clock uncertainty lets transactions wait out the interval and get external consistency without extra round trips.",
					"Deterministic ordering (Calvin, VoltDB): agree on the order first, then execute deterministically everywhere."
				],
				math: [
					{
						label: "Linearizable read cost",
						expr: "≥ 1 quorum round trip (or a leader lease check)",
						result: "+1 RTT",
						note: "Same-region ≈ 1 ms; cross-region ≈ 50-150 ms."
					},
					{
						label: "Eventual read cost",
						expr: "local replica read",
						result: "≈ 0 RTT"
					},
					{
						label: "Cross-region strong consistency",
						expr: "3 regions, majority = 2, farthest of the nearest two ≈ 70 ms",
						result: "≈ 70 ms per write",
						note: "This is why globally strong systems keep writes regional where they can."
					}
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Does your system need strong consistency?",
						a: "Only where an incorrect answer causes a real problem — money, inventory, locks, uniqueness. For those I would use a linearizable path: a single leader or a consensus-backed store, and a conditional write. Everything else gets eventual consistency plus session guarantees, because read-your-writes and monotonic reads remove nearly all of the user-visible weirdness at a fraction of the cost."
					},
					{
						q: "What is the difference between the C in ACID and the C in CAP?",
						a: "They are unrelated despite the letter. ACID's C is about constraints holding within a transaction — the database will not let you violate a foreign key. CAP's C is linearizability across replicas — a read reflects the most recent completed write. A system can be fully ACID on one node and still serve stale reads from a replica, which is exactly the common production setup."
					},
					{
						q: "How do you implement read-your-writes cheaply?",
						a: "Record the log position of the user's write in their session, and route their reads either to the leader or to a replica that has applied at least that position, for a short window. The cheaper approximation used widely is 'send this user's reads to the leader for N seconds after a write'. Both cost a routing rule rather than a change to the replication model."
					},
					{
						q: "What is causal consistency and when do you need it?",
						a: "It guarantees that if one operation could have influenced another — a reply to a comment, an edit after a read — everyone observes them in that order, while genuinely concurrent operations may be seen differently. You need it whenever ordering is visible to users but global agreement is too expensive, like comment threads across regions. It is implemented with version vectors or by keeping causally linked data in one partition, which is usually the simpler answer."
					}
				]
			}
		],
		related: [
			"/hld/cap-theorem",
			"/hld/quorum",
			"/hld/replication",
			"/hld/consensus"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "quorum",
		title: "Quorums (W + R > N)",
		subtitle: "Buy consistency per request by choosing how many replicas must answer.",
		level: "intermediate",
		minutes: 12,
		tags: [
			"distributed",
			"consistency",
			"replication"
		],
		summary: "In a leaderless system every replica can serve reads and accept writes. A quorum is the rule that keeps that from becoming chaos: if the number of replicas you write to plus the number you read from exceeds the total, the two sets must overlap, so a read always sees at least one copy of the latest write.",
		keyPoints: [
			"W + R > N guarantees overlap. Overlap guarantees you see the newest value — provided you can tell which one is newest.",
			"N is the replication factor, W the write quorum, R the read quorum, all tunable per request.",
			"W = N, R = 1 favours fast reads; W = 1, R = N favours fast writes; W = R = ⌈(N+1)/2⌉ balances.",
			"Overlap alone is not linearizability — concurrent writes still need version reconciliation.",
			"Sloppy quorums and hinted handoff trade the guarantee for availability during failures."
		],
		prerequisites: ["/hld/replication"],
		sections: [
			{
				heading: "Why overlap works",
				body: ["Suppose N = 3 and you write to W = 2 replicas. Any subsequent read from R = 2 replicas must include at least one of those two, because 2 + 2 > 3 means the sets cannot be disjoint. That one replica holds the new value, and a version number tells the client which of the returned values to trust."],
				math: [
					{
						label: "Overlap condition",
						expr: "W + R > N",
						result: "read set ∩ write set ≠ ∅"
					},
					{
						label: "Durability condition",
						expr: "W > N / 2",
						result: "no two conflicting write quorums",
						note: "Without it, two disjoint write quorums can both succeed and neither knows about the other."
					},
					{
						label: "Failure tolerance",
						expr: "writes survive N − W failures; reads survive N − R",
						result: "N=3, W=R=2 → 1 failure"
					},
					{
						label: "Latency",
						expr: "wait for the W-th (or R-th) fastest replica",
						result: "the median, not the slowest",
						note: "This is why quorums beat 'wait for everyone': one slow node does not stall you."
					}
				],
				diagram: {
					kind: "sequence",
					caption: "N=3, W=2, R=2 — the read set is guaranteed to touch a replica with the new value.",
					actors: [
						{
							id: "c",
							label: "Client"
						},
						{
							id: "r1",
							label: "Replica 1"
						},
						{
							id: "r2",
							label: "Replica 2"
						},
						{
							id: "r3",
							label: "Replica 3",
							sub: "slow / down"
						}
					],
					messages: [
						{
							from: "c",
							to: "r1",
							label: "write x=2 (v7)",
							kind: "call"
						},
						{
							from: "c",
							to: "r2",
							label: "write x=2 (v7)",
							kind: "call"
						},
						{
							from: "c",
							to: "r3",
							label: "write x=2 (v7)",
							kind: "async",
							tone: "warn",
							note: "no ack — that is fine, W=2 satisfied"
						},
						{
							from: "r2",
							to: "c",
							label: "ack (2 of 3) → write succeeds",
							kind: "return",
							tone: "ok"
						},
						{
							from: "c",
							to: "r2",
							label: "read x",
							kind: "call"
						},
						{
							from: "c",
							to: "r3",
							label: "read x",
							kind: "call",
							note: "returns stale v6"
						},
						{
							from: "r2",
							to: "c",
							label: "v7 = 2 · r3 says v6 = 1 → take v7",
							kind: "return",
							tone: "ok"
						},
						{
							from: "c",
							to: "r3",
							label: "read repair: write v7 back",
							kind: "async",
							note: "the stale replica is fixed as a side effect"
						}
					]
				}
			},
			{
				heading: "Choosing W and R",
				table: {
					headers: [
						"Configuration",
						"Read latency",
						"Write latency",
						"Tolerates",
						"Use for"
					],
					rows: [
						[
							"N=3, W=2, R=2",
							"Median of 2",
							"Median of 2",
							"1 node down",
							"The balanced default"
						],
						[
							"N=3, W=3, R=1",
							"Fastest replica",
							"Slowest replica",
							"0 down for writes",
							"Read-heavy, rarely written config"
						],
						[
							"N=3, W=1, R=3",
							"Slowest replica",
							"Fastest replica",
							"0 down for reads",
							"Write-heavy logging; reads are rare"
						],
						[
							"N=3, W=1, R=1",
							"Fastest",
							"Fastest",
							"2 down",
							"No overlap — eventual only; metrics, counters"
						],
						[
							"N=5, W=3, R=3",
							"Median of 3",
							"Median of 3",
							"2 nodes down",
							"Higher durability across 3 AZs"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "W = 1 with R = 1 is a legitimate configuration but has no overlap, so it is plain eventual consistency. People sometimes set it for speed and then are surprised by stale reads — the arithmetic told them in advance."
				}
			},
			{
				heading: "What quorums do not give you",
				bullets: [
					"Linearizability. Two clients writing concurrently can each satisfy W without seeing the other; a later read sees two versions and must reconcile them. That needs version vectors, last-write-wins, or application merge logic.",
					"Last-write-wins by wall clock silently loses data when clocks skew — the losing write vanishes with no error. Prefer version vectors, or an LWW field you understand the consequences of.",
					"Atomicity across keys. A quorum is per key; there is no transaction spanning several.",
					"Protection from a partial write. If a write reaches 2 of 3 and the client crashes, the value persists — quorum writes are not transactional, and 'failed' writes may still be visible."
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
//     and let the application merge — a shopping cart unions its items.`
				}
			},
			{
				heading: "Sloppy quorums, hinted handoff and anti-entropy",
				bullets: [
					"Sloppy quorum: if the N designated replicas for a key are unreachable, write to any N healthy nodes instead. Availability goes up; the overlap guarantee is gone until the data gets home.",
					"Hinted handoff: the temporary holder keeps a hint recording who the data really belongs to, and forwards it when that node returns.",
					"Read repair: when a read finds a stale replica, write the newer version back. Cheap, and it heals the keys that are actually being read.",
					"Anti-entropy: background comparison of replicas using Merkle trees, so rarely-read keys converge too. Read repair alone leaves cold data stale indefinitely."
				],
				diagram: {
					kind: "compare",
					caption: "Strict versus sloppy — an availability decision, taken explicitly.",
					options: [{
						title: "Strict quorum",
						good: ["The W + R > N guarantee actually holds", "Simple to reason about"],
						bad: ["Writes fail when enough of the key's home replicas are down"],
						verdict: "When a stale read would be harmful."
					}, {
						title: "Sloppy quorum + hinted handoff",
						good: ["Writes keep succeeding through node and zone failures", "Data reaches its home automatically on recovery"],
						bad: ["Reads may miss recent writes until handoff completes", "Hints accumulate on healthy nodes; a long outage is a memory problem"],
						verdict: "Availability-first stores — Dynamo's original design."
					}]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "What W and R would you pick, and why?",
						a: "N=3 with W=2 and R=2 as the default: it tolerates one node down for both reads and writes, gives the overlap guarantee, and the latency is the median replica rather than the slowest. Then I would tune per operation — a config value read constantly and written rarely can use W=3, R=1 so reads are single-replica fast."
					},
					{
						q: "Does W + R > N give linearizability?",
						a: "No, and this is the common trap. It guarantees the read set overlaps the write set, so the newest committed value is among the ones returned — but concurrent writes can still produce two versions that neither happened before the other. You need version vectors to detect that, and either an application merge or a coordination protocol to resolve it. Real linearizability comes from consensus, not from quorum arithmetic."
					},
					{
						q: "Why is W > N/2 recommended even when W + R > N holds?",
						a: "Because without a majority, two disjoint write quorums can both succeed — with N=3 and W=1, two clients can write to different single nodes and neither conflicts. Requiring a majority for writes means any two write quorums intersect, so there is always a node that saw both and the conflict is at least detectable."
					},
					{
						q: "What happens to a write that reaches only one of two required replicas?",
						a: "The client gets an error, but the value is still sitting on that one replica — quorum writes are not atomic and there is no rollback. So a later read might return the 'failed' write. Applications on these systems have to be idempotent and treat a failed write as 'unknown outcome, retry safely' rather than 'did not happen'."
					}
				]
			}
		],
		related: [
			"/hld/replication",
			"/hld/consistency",
			"/hld/cap-theorem",
			"/playgrounds/quorum"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "quorum"
	},
	{
		slug: "consensus",
		title: "Consensus: Raft and Paxos",
		subtitle: "How a group of machines agrees on one value when any of them can fail.",
		level: "advanced",
		minutes: 15,
		tags: [
			"distributed",
			"consensus",
			"coordination"
		],
		summary: "Consensus is the primitive underneath leader election, distributed locks, configuration stores and any database that promises linearizability across replicas. Raft is the algorithm to be able to explain: a leader, a replicated log, and a majority rule that makes split brain impossible rather than unlikely.",
		keyPoints: [
			"A majority (⌊n/2⌋ + 1) is what makes it work: two majorities of the same cluster must share a member.",
			"Raft splits the problem into leader election, log replication, and safety — deliberately, to be teachable.",
			"An entry is committed once a majority has stored it; only then may it be applied and acknowledged.",
			"Consensus is expensive — a round trip to a majority per write — so keep it off the data path.",
			"You almost never implement it. You use etcd, ZooKeeper, Consul, or a database that embeds it."
		],
		sections: [
			{
				heading: "What problem it solves",
				body: ["Several nodes must agree on a single sequence of values, with nodes crashing and messages being delayed or lost. If they can do that, they can agree on who the leader is, what the configuration says, who holds a lock, and what order writes happened in — which is nearly everything hard about distributed systems.", "The impossibility result worth knowing: FLP proves that in a fully asynchronous network with even one faulty process, no deterministic algorithm can guarantee consensus in bounded time. Real systems get around it with timeouts and randomisation, giving up guaranteed termination in exchange for termination in practice."],
				table: {
					headers: [
						"Used for",
						"What is agreed",
						"Typical system"
					],
					rows: [
						[
							"Leader election",
							"Which node is the primary right now",
							"Raft in etcd, Kafka's controller"
						],
						[
							"Configuration",
							"The current cluster membership and settings",
							"ZooKeeper, etcd"
						],
						[
							"Distributed locks",
							"Who holds the lease",
							"etcd leases, ZooKeeper ephemeral nodes"
						],
						[
							"Replicated log",
							"The order of writes",
							"Raft in CockroachDB, TiKV, Consul"
						],
						[
							"Atomic commit across shards",
							"Whether a transaction commits",
							"Paxos Commit, Spanner"
						]
					]
				}
			},
			{
				heading: "Raft in one page",
				steps: [
					{
						title: "Terms and roles",
						text: "Time is divided into terms, each with at most one leader. Every node is a follower, a candidate, or the leader. Terms are the logical clock that makes stale leaders detectable.",
						detail: "Any message carrying a higher term forces the receiver to step down and become a follower."
					},
					{
						title: "Leader election",
						text: "A follower that hears nothing from a leader for its election timeout becomes a candidate, increments the term, and asks everyone to vote. It becomes leader on receiving a majority. Timeouts are randomised (say 150-300 ms) so simultaneous candidacies are rare.",
						detail: "A node votes at most once per term, which is why two leaders in one term are impossible."
					},
					{
						title: "Log replication",
						text: "Clients send commands to the leader, which appends to its log and sends AppendEntries to followers. Once a majority has stored the entry, it is committed; the leader applies it to its state machine and answers the client.",
						detail: "AppendEntries doubles as the heartbeat, so an idle leader still holds its position."
					},
					{
						title: "Safety: the election restriction",
						text: "A node only grants a vote to a candidate whose log is at least as up to date as its own. This is what guarantees a new leader already holds every committed entry, so nothing committed can ever be lost."
					},
					{
						title: "Membership changes",
						text: "Adding or removing nodes uses a joint consensus step so that old and new majorities always overlap during the change — otherwise you could briefly have two disjoint majorities and two leaders."
					}
				],
				diagram: {
					kind: "sequence",
					caption: "One committed write. The client's ack comes after a majority has it durably.",
					actors: [
						{
							id: "c",
							label: "Client"
						},
						{
							id: "l",
							label: "Leader",
							sub: "term 7"
						},
						{
							id: "f1",
							label: "Follower 1"
						},
						{
							id: "f2",
							label: "Follower 2"
						}
					],
					messages: [
						{
							from: "c",
							to: "l",
							label: "SET config.timeout = 30",
							kind: "call"
						},
						{
							from: "l",
							to: "l",
							label: "append to local log (index 42)",
							kind: "self"
						},
						{
							from: "l",
							to: "f1",
							label: "AppendEntries(term=7, prev=41, entry)",
							kind: "call"
						},
						{
							from: "l",
							to: "f2",
							label: "AppendEntries(term=7, prev=41, entry)",
							kind: "call"
						},
						{
							from: "f1",
							to: "l",
							label: "ok",
							kind: "return",
							tone: "ok",
							note: "2 of 3 have it → committed"
						},
						{
							from: "l",
							to: "l",
							label: "apply to state machine",
							kind: "self",
							tone: "accent"
						},
						{
							from: "l",
							to: "c",
							label: "ok",
							kind: "return",
							tone: "ok"
						},
						{
							from: "f2",
							to: "l",
							label: "ok (late — already committed)",
							kind: "return"
						}
					]
				},
				callout: {
					kind: "insight",
					text: "The whole safety argument rests on one sentence: any two majorities of the same cluster share at least one member. That shared member remembers the previous term's votes and the previous leader's entries, which is why nothing committed can be forgotten."
				}
			},
			{
				heading: "Raft versus Paxos, and what to say",
				diagram: {
					kind: "compare",
					caption: "Same guarantees; very different to explain.",
					options: [{
						title: "Raft",
						tone: "ok",
						good: [
							"Designed for understandability; you can explain it in an interview",
							"Strong leader makes the normal path simple",
							"Membership change is specified, not left as an exercise"
						],
						bad: ["Leader is a throughput bottleneck", "All writes take a leader round trip"],
						verdict: "The default for new systems: etcd, Consul, CockroachDB, TiKV."
					}, {
						title: "Paxos / Multi-Paxos",
						good: ["Older, deeply studied, very flexible", "Variants (Flexible, EPaxos) relax the leader bottleneck"],
						bad: ["Famously hard to specify completely; implementations diverge", "Basic Paxos agrees on one value — real use needs Multi-Paxos, which the paper does not fully describe"],
						verdict: "Google's stack (Chubby, Spanner); mention it, implement Raft."
					}]
				},
				bullets: [
					"Cluster size: 3 tolerates 1 failure, 5 tolerates 2, 7 tolerates 3. Larger clusters do not increase throughput — they increase the majority you must wait for. Five is a common sweet spot.",
					"Always use an odd number. Four nodes still needs three for a majority, so it tolerates the same single failure as three while costing more.",
					"Byzantine fault tolerance is a different problem: Raft and Paxos assume nodes may crash or be slow, not lie. PBFT and blockchain protocols handle lying, at much higher cost."
				]
			},
			{
				heading: "Using consensus without paying for it everywhere",
				bullets: [
					"Keep it out of the data path. Use consensus to agree who the leader is, then let the leader serve traffic at normal speed — this is exactly what Kafka's controller and most databases do.",
					"Leader leases turn linearizable reads into local reads: while the leader holds a valid, time-bounded lease, it can answer reads without a quorum round trip. This depends on bounded clock drift, so understand the assumption.",
					"Batch and pipeline: a Raft leader can batch many client commands into one AppendEntries, which is what makes tens of thousands of writes per second possible despite a round trip per commit.",
					"Cross-region consensus costs a wide-area round trip per write. Keep the majority within one region, and put the far replica in as a non-voting learner if it is only there for disaster recovery.",
					"Watch out for the distributed-lock trap: a lock held over a GC pause can expire while the holder thinks it still owns it. That is why leases must be paired with fencing tokens that the storage layer checks."
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

// Without the token, both A and B write and the lock guaranteed nothing.`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How does Raft prevent two leaders?",
						a: "Two ways that reinforce each other. A node votes at most once per term, and a leader needs a majority, so two leaders in the same term would require a node to vote twice. Across terms, any message with a higher term causes the older leader to step down — and because a majority already moved to the new term, the old leader cannot commit anything, since committing also requires a majority."
					},
					{
						q: "How many nodes would you run?",
						a: "Five for something important, spread across three availability zones so losing a zone leaves a majority. Three is fine for smaller deployments and tolerates one failure. I would not go to seven without a reason — it does not add throughput, it just widens the majority you wait for on every write."
					},
					{
						q: "Would you build consensus yourself?",
						a: "No. The algorithms are well understood but the implementations are where the subtle bugs live — log compaction, snapshot transfer, membership changes, restart recovery. I would use etcd or ZooKeeper, or a database that embeds a well-tested Raft. Being able to explain how it works matters; writing it does not."
					},
					{
						q: "Can you do a linearizable read without a round trip?",
						a: "With a leader lease, yes: the leader knows no other leader can exist for the lease duration, so it can answer from local state. That trades a clock assumption for latency, and if clock drift exceeds the bound the guarantee breaks. The alternative Raft offers is ReadIndex — confirm leadership with a lightweight heartbeat to a majority, which is cheaper than a full log entry but still a round trip."
					}
				]
			}
		],
		related: [
			"/hld/quorum",
			"/hld/consistency",
			"/hld/replication",
			"/hld/gossip"
		],
		furtherReading: [{
			label: "awesome-system-design-resources",
			href: "https://github.com/ashishps1/awesome-system-design-resources"
		}]
	},
	{
		slug: "availability",
		title: "Availability & Fault Tolerance",
		subtitle: "Nines, failure domains, and designing for the failure you will actually have.",
		level: "intermediate",
		minutes: 14,
		tags: [
			"reliability",
			"operations",
			"resilience"
		],
		summary: "Availability is not a property you add at the end; it is the sum of every dependency, every single point of failure, and every retry policy in the system. The useful skills are computing what your architecture can actually deliver, spotting the correlated failures that make redundancy useless, and knowing which degradations users will accept.",
		keyPoints: [
			"Nines are a budget: 99.9% is 43 minutes of downtime a month, 99.99% is 4 minutes.",
			"Serial dependencies multiply and always reduce availability; redundancy adds nines only if failures are independent.",
			"Most real outages are correlated: shared config, shared dependency, or a deploy — redundancy does not help.",
			"Graceful degradation beats total failure: serve stale, serve partial, queue the write.",
			"MTTR is usually easier to improve than MTBF, and it moves the number just as much."
		],
		sections: [
			{
				heading: "The arithmetic",
				math: [
					{
						label: "Downtime budget",
						expr: "99.9% → 43.8 min/month · 99.99% → 4.4 min · 99.999% → 26 s",
						result: "per month",
						note: "One bad deploy costs more than a month of 99.99%."
					},
					{
						label: "Serial dependencies",
						expr: "0.999 (LB) × 0.999 (app) × 0.999 (DB) × 0.999 (cache)",
						result: "99.6%",
						note: "Four 'three nines' components in series give less than three nines."
					},
					{
						label: "Redundant components",
						expr: "1 − (1 − 0.99)² for two independent instances",
						result: "99.99%",
						note: "Only if the failures are genuinely independent — which they often are not."
					},
					{
						label: "Availability formula",
						expr: "MTBF / (MTBF + MTTR)",
						result: "recovery time matters",
						note: "Halving recovery time improves availability exactly as much as doubling time-between-failures."
					}
				],
				callout: {
					kind: "insight",
					text: "The serial multiplication is the number most designs ignore. Every synchronous dependency you add lowers the ceiling — which is a strong argument for making non-critical calls asynchronous or optional rather than adding another replica."
				}
			},
			{
				heading: "Failure domains and correlation",
				bullets: [
					"Spread across failure domains, not just across machines: three instances in one availability zone give you almost nothing when the zone loses power.",
					"Correlated failures defeat redundancy. Shared config, a shared feature flag, a shared certificate authority, a shared DNS zone, one bad deploy pushed everywhere — all of these take down every replica simultaneously.",
					"Beware shared fate through dependencies: five services that each look independent but all call the same auth service have one availability number, not five.",
					"Cell-based architecture is the strongest structural answer: partition users into independent cells, each with its own full stack, so a failure affects one cell rather than everyone.",
					"Deploy is the single most common cause of outages. Canary, gradual rollout and fast rollback are availability features, not process overhead."
				],
				diagram: {
					kind: "compare",
					caption: "Two architectures with the same component count and very different blast radii.",
					options: [{
						title: "Shared everything",
						tone: "warn",
						good: ["Simple, efficient, easy to operate", "Resource pooling"],
						bad: [
							"One bad deploy affects 100% of users",
							"A poisoned cache entry or hot tenant hurts everyone",
							"Recovery means recovering everything at once"
						],
						verdict: "Small systems where the blast radius is acceptable."
					}, {
						title: "Cell-based",
						tone: "ok",
						good: [
							"Failure is contained to one cell — a fraction of users",
							"Deploys roll cell by cell, so a bad one is caught small",
							"Recovery is bounded and repeatable"
						],
						bad: ["More infrastructure and routing complexity", "Cross-cell operations become awkward"],
						verdict: "Large multi-tenant systems where a total outage is unacceptable."
					}]
				}
			},
			{
				heading: "Designing for degradation",
				table: {
					headers: [
						"Dependency fails",
						"Total failure",
						"Graceful degradation"
					],
					rows: [
						[
							"Recommendations service",
							"Product page 500s",
							"Show a static best-sellers list"
						],
						[
							"Cache tier",
							"Every request errors",
							"Fall through to the database with a rate limit"
						],
						[
							"Search index",
							"Search page down",
							"Fall back to a simple database prefix query"
						],
						[
							"Payment provider",
							"Checkout down",
							"Queue the order, capture later, tell the user honestly"
						],
						[
							"A read replica",
							"Reads fail",
							"Route to another replica or to the leader"
						],
						[
							"Metrics pipeline",
							"Requests block on the emit",
							"Drop metrics; never block a request on telemetry"
						]
					]
				},
				bullets: [
					"Classify every dependency as critical or optional, and make the optional ones fail open with a timeout and a fallback. Most designs have far fewer genuinely critical dependencies than they act like.",
					"Timeouts must be shorter as you go deeper: if the user-facing request has a 3-second budget, an inner call cannot have a 10-second timeout. Propagate deadlines rather than setting each timeout independently.",
					"Retries need a budget and jitter. Naive retry on a struggling dependency multiplies its load exactly when it can least handle it.",
					"Load shedding is a feature: reject a fraction of requests early with a clear error rather than accepting everything and timing out for everyone.",
					"Backpressure beats buffering. An unbounded queue in front of a slow consumer converts a latency problem into an out-of-memory crash."
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
// recommendation service holds the request until the outer timeout fires.`
				}
			},
			{
				heading: "Measuring it honestly",
				bullets: [
					"Measure availability from the user's side, not from your load balancer's. Synthetic probes from real regions and client-reported errors catch failures that server-side metrics show as healthy.",
					"Define what 'up' means per journey: checkout succeeding matters more than the homepage rendering, and an average across all endpoints hides the one that matters.",
					"Use error budgets: 99.9% means 43 minutes of failure is acceptable per month. Spending it deliberately on faster releases is a legitimate choice; running out means slowing down.",
					"Track MTTR alongside incident count. Fast, safe rollback is usually the highest-leverage availability investment a team can make.",
					"Test the failure paths. Failover that has never been exercised does not work — this is what game days and chaos experiments are for."
				],
				math: [{
					label: "Error budget",
					expr: "(1 − 0.999) × 30 days × 24 h × 60 min",
					result: "43.2 min/month"
				}, {
					label: "Cost of a slow rollback",
					expr: "5 min to detect + 25 min to roll back",
					result: "70% of a 99.9% budget",
					note: "One incident. Rollback speed is an availability feature."
				}]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How would you get this system to four nines?",
						a: "First I would compute what the current architecture can deliver, because serial dependencies multiply and the ceiling is often lower than people expect. Then remove single points of failure, spread across availability zones so failures are less correlated, and make non-critical dependencies optional with timeouts and fallbacks. After that the biggest lever is usually recovery time — canary deploys and fast rollback — because four nines is four minutes a month and a slow rollback spends it in one incident."
					},
					{
						q: "You have three replicas and still had a total outage. How?",
						a: "Correlated failure. The usual candidates are a deploy that went to all three, a shared config or feature flag change, an expired certificate, a dependency they all call, or all three sitting in one availability zone. Redundancy only multiplies availability when failures are independent, and in practice most are not — which is why cell-based isolation and staged rollouts matter more than replica count."
					},
					{
						q: "What do you do when a downstream service is down?",
						a: "It depends whether it is critical. For an optional one, short timeout, fallback, and a circuit breaker so I stop sending requests to something that is failing — plus a metric so the degradation is visible rather than silent. For a critical one, the honest options are to queue the work and complete it asynchronously, or to fail fast with a clear message. What I would avoid is retrying aggressively, which turns their outage into a longer one."
					},
					{
						q: "How do you know your failover works?",
						a: "By running it. Scheduled failover exercises, and chaos experiments that kill instances and partition networks in a controlled way. Untested failover reliably fails in the ways nobody predicted — DNS TTLs too long, the standby never actually replicating, credentials that only exist on the primary. I would rather find those on a Tuesday afternoon than during an incident."
					}
				]
			}
		],
		related: [
			"/hld/circuit-breaker",
			"/hld/load-balancing",
			"/hld/observability",
			"/hld/replication"
		],
		furtherReading: [{
			label: "awesome-system-design-resources",
			href: "https://github.com/ashishps1/awesome-system-design-resources"
		}]
	}
];
var hldData = [
	{
		slug: "replication",
		title: "Replication",
		subtitle: "More copies means more reads, better durability, and a lag you must design around.",
		level: "intermediate",
		minutes: 16,
		tags: [
			"databases",
			"availability",
			"consistency"
		],
		summary: "Replication keeps the same data on several machines. It buys read capacity, survives a machine loss, and puts data near users. It costs you consistency: the moment there is more than one copy, they can disagree, and every user-visible bug in a replicated system traces back to that gap.",
		keyPoints: [
			"Single-leader is the default: one node accepts writes, followers replicate and serve reads.",
			"Asynchronous replication is fast and can lose committed writes on failover; synchronous is durable and slow.",
			"Semi-synchronous — wait for one follower — is the practical middle ground.",
			"Replication lag causes read-your-writes and monotonic-read anomalies; route around it deliberately.",
			"Multi-leader and leaderless buy write availability at the price of conflict resolution."
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
								"Read scaling is just adding followers"
							],
							bad: [
								"Write throughput capped by one machine",
								"Failover has a window where writes fail",
								"Followers are stale by the replication lag"
							],
							verdict: "Almost always the right first answer."
						},
						{
							title: "Multi leader",
							sub: "Multi-region actives, CRDT stores",
							good: ["Writes accepted in every region — low write latency worldwide", "Survives a region loss for writes"],
							bad: [
								"Write conflicts are guaranteed and must be resolved",
								"Auto-increment ids and uniqueness constraints break",
								"Very hard to reason about; debugging is painful"
							],
							verdict: "Genuinely global write traffic, or offline-first clients."
						},
						{
							title: "Leaderless",
							sub: "Dynamo, Cassandra, Riak",
							good: [
								"No failover — any node takes a write",
								"Tunable consistency per query via quorums",
								"Excellent availability under partition"
							],
							bad: [
								"Application may see conflicting versions and must merge",
								"Read repair and anti-entropy are extra machinery",
								"No transactions across keys"
							],
							verdict: "Write-heavy, availability-first workloads at scale."
						}
					]
				}
			},
			{
				heading: "Synchronous, asynchronous, and the honest middle",
				diagram: {
					kind: "sequence",
					caption: "Semi-synchronous: acknowledge after one follower has it durably.",
					actors: [
						{
							id: "c",
							label: "Client"
						},
						{
							id: "l",
							label: "Leader"
						},
						{
							id: "f1",
							label: "Follower 1",
							sub: "sync"
						},
						{
							id: "f2",
							label: "Follower 2",
							sub: "async"
						}
					],
					messages: [
						{
							from: "c",
							to: "l",
							label: "INSERT ...",
							kind: "call"
						},
						{
							from: "l",
							to: "l",
							label: "write to WAL, fsync",
							kind: "self"
						},
						{
							from: "l",
							to: "f1",
							label: "stream WAL record",
							kind: "call",
							tone: "accent"
						},
						{
							from: "f1",
							to: "l",
							label: "ack (durable on 2 machines)",
							kind: "return",
							tone: "ok"
						},
						{
							from: "l",
							to: "c",
							label: "COMMIT ok",
							kind: "return",
							tone: "ok",
							note: "latency = leader fsync + 1 RTT"
						},
						{
							from: "l",
							to: "f2",
							label: "stream WAL record",
							kind: "async",
							note: "does not block the client"
						}
					]
				},
				table: {
					headers: [
						"Mode",
						"Write latency",
						"On leader loss",
						"Use when"
					],
					rows: [
						[
							"Asynchronous",
							"Leader fsync only",
							"Recently acknowledged writes can be lost",
							"Analytics, caches, anything where a few lost seconds is acceptable"
						],
						[
							"Semi-synchronous",
							"+1 RTT to the nearest follower",
							"No loss if at least that follower survives",
							"The default for systems that hold money or user content"
						],
						[
							"Fully synchronous",
							"+1 RTT to the slowest follower",
							"No loss",
							"Rarely — one slow follower stalls every write"
						],
						[
							"Quorum (w + r > n)",
							"+1 RTT to the ⌈n/2⌉-th fastest",
							"No loss with a majority",
							"Leaderless systems; tunable per operation"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "Fully synchronous replication means the slowest replica sets your write latency and any replica failure blocks writes entirely. Systems that claim it usually mean semi-synchronous with a timeout that silently falls back to async — which is the failure mode you must ask about."
				}
			},
			{
				heading: "Replication lag: the anomalies users report",
				lede: "Three distinct bugs, three distinct fixes.",
				steps: [
					{
						title: "Read-your-writes violated",
						text: "A user updates their profile, the write goes to the leader, and their next read hits a follower that has not caught up. They see the old value and assume it did not save.",
						detail: "Fix: route a user's reads to the leader for a few seconds after their own write, or pin them to a replica whose log position is at least their write's."
					},
					{
						title: "Monotonic reads violated",
						text: "Two consecutive reads land on different followers with different lag, so a comment appears and then vanishes — time appears to run backwards.",
						detail: "Fix: pin a session to one replica (hash the user id), so within a session the data only moves forward."
					},
					{
						title: "Consistent prefix violated",
						text: "In a sharded or partitioned system, causally related writes replicate at different speeds — an answer arrives before the question it replies to.",
						detail: "Fix: keep causally related data in the same partition, or attach causal metadata (version vectors, Lamport timestamps)."
					}
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
// send that user's reads to the leader. Simple, and usually enough.`
				},
				bullets: [
					"Monitor lag as a first-class metric, in both seconds and bytes. Seconds tell you user impact; bytes tell you whether a replica is falling behind permanently.",
					"Lag spikes have predictable causes: a long-running transaction on the leader, a bulk import, a vacuum, or a replica doing something else with its disk.",
					"A replica that is behind should be removed from the read pool automatically, not left silently serving old data."
				]
			},
			{
				heading: "Failover, and the ways it hurts",
				bullets: [
					"Detection is a timeout, so it is a guess. Too short and you fail over on a network blip; too long and you are down. Typical settings are 10-30 seconds.",
					"Split brain: the old leader did not die, it was partitioned. Now two nodes accept writes. Fencing — STONITH, a lease, or a fencing token that the storage layer checks — is what prevents this, and it must exist.",
					"Lost writes: with async replication, anything acknowledged but not yet shipped is gone. The classic incident is auto-increment ids being reused by the new leader and attached to different rows.",
					"Cache poisoning after failover: caches and clients holding the old leader's address must be updated. Use a virtual IP, a proxy, or a service-discovery record rather than baking the address into config.",
					"Failover is also a scaling event — the new leader inherits the full write load plus catch-up work from every follower."
				],
				callout: {
					kind: "interview",
					text: "'How does the system decide the leader is dead, and what stops the old leader from continuing to accept writes?' is the question that shows you have operated one of these. Consensus (Raft) exists exactly to answer it."
				}
			},
			{
				heading: "How it actually ships",
				table: {
					headers: [
						"Mechanism",
						"What is shipped",
						"Notes"
					],
					rows: [
						[
							"Statement-based",
							"The SQL text",
							"Breaks on NOW(), RAND(), and triggers; largely abandoned"
						],
						[
							"Write-ahead log (physical)",
							"Byte-level changes to pages",
							"Fast and exact; replica must run the same version"
						],
						[
							"Logical / row-based",
							"Row before and after images",
							"Version- and schema-flexible; enables CDC into Kafka or a warehouse"
						],
						[
							"Trigger-based",
							"Application-level capture",
							"Flexible, slow, and easy to get wrong"
						]
					]
				},
				bullets: [
					"Logical replication is what makes change data capture possible: the same stream that feeds a replica can feed a search index, a cache invalidator or a data warehouse.",
					"Chained replication (a replica of a replica) reduces load on the leader in large fleets, at the cost of adding the two lags together.",
					"Backups are not replication. A replica faithfully replicates your DROP TABLE; point-in-time recovery is what saves you from that."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "What replication mode would you choose, and why?",
						a: "Single leader with semi-synchronous replication to one follower in another availability zone, and asynchronous to the rest. That gives durability across two failure domains without letting the slowest replica set write latency. I would only reach for multi-leader if there were genuinely global write traffic that cannot tolerate cross-region latency, because conflict resolution is a large ongoing cost."
					},
					{
						q: "A user says their update disappeared. What happened?",
						a: "Almost certainly replication lag — the write went to the leader and the subsequent read hit a stale follower. The fix is read-your-writes routing: for a short window after a user's write, serve their reads from the leader or from a replica known to have applied that log position. I would also check whether the lag itself is abnormal, since a long-running transaction on the leader is the usual root cause."
					},
					{
						q: "How do you avoid split brain?",
						a: "Never let a node decide on its own that it is the leader. Leadership comes from a majority — Raft or ZooKeeper-style leases — so a partitioned minority cannot elect itself. On top of that, fencing: the new leader gets a monotonically increasing token, and storage rejects writes carrying an older token, so a resurrected old leader cannot corrupt anything."
					},
					{
						q: "Ten read replicas — do reads scale ten times?",
						a: "Read throughput roughly does, but every replica applies the full write stream, so the write load is replicated everywhere and does not scale at all. Past a point, adding replicas increases leader load for shipping the log and adds lag. When reads still are not enough after caching and replicas, the answer is partitioning, not more copies."
					}
				]
			}
		],
		related: [
			"/hld/sharding",
			"/hld/consistency",
			"/hld/quorum",
			"/hld/cap-theorem"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "sharding",
		title: "Sharding & Partitioning",
		subtitle: "Split the data when one machine can no longer hold it or write it.",
		level: "advanced",
		minutes: 18,
		tags: [
			"databases",
			"scalability",
			"partitioning"
		],
		summary: "Sharding splits one logical dataset across many machines so that writes and storage scale horizontally. It is the most consequential decision in a data-heavy design, because the shard key determines which queries stay fast, which become fan-outs, and how badly a celebrity user can hurt you.",
		keyPoints: [
			"Shard only after vertical scaling, caching and read replicas are exhausted — it costs joins, transactions and operational complexity.",
			"Hash sharding spreads evenly but destroys range scans; range sharding keeps them and invites hotspots.",
			"The shard key should appear in the majority of queries, or every read becomes a scatter-gather.",
			"Resharding is the hard part; consistent hashing or logical shards make it survivable.",
			"Celebrity keys break any scheme — plan a specific escape hatch."
		],
		prerequisites: ["/hld/replication"],
		sections: [
			{
				heading: "Partitioning strategies",
				table: {
					headers: [
						"Strategy",
						"Shard = f(key)",
						"Wins",
						"Loses"
					],
					rows: [
						[
							"Hash",
							"hash(key) mod N, or a hash ring",
							"Even distribution, no hotspots from key ordering",
							"Range queries must hit every shard"
						],
						[
							"Range",
							"key between A and M → shard 1",
							"Range scans hit one shard; natural for time series",
							"Sequential keys (timestamps, auto-increment) hammer one shard"
						],
						[
							"Directory / lookup",
							"An explicit map from key → shard",
							"Total flexibility; move any key at any time",
							"The lookup service is a dependency and a bottleneck"
						],
						[
							"Geographic",
							"Region of the user",
							"Data residency, low latency, clear ownership",
							"Uneven load; cross-region users are awkward"
						],
						[
							"Composite",
							"hash(tenant) then range(time)",
							"Even across tenants, ordered within one",
							"More complex routing; still hot on a huge tenant"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "hash(key) mod N is the trap: adding one node changes almost every key's mapping and forces a full data reshuffle. Use consistent hashing, or fix a large number of logical shards (say 1024) and map many of them onto each physical node."
				}
			},
			{
				heading: "Choosing the shard key",
				lede: "The single decision you will live with for years.",
				steps: [
					{
						title: "List your top queries first",
						text: "Write out the five queries that carry your traffic. The shard key must appear in most of them, or those queries become scatter-gather across every shard.",
						detail: "Example: 'messages for a conversation' → shard by conversation_id, not by message_id."
					},
					{
						title: "Check the cardinality and the distribution",
						text: "High cardinality spreads well; low cardinality (country, status, plan) creates a handful of huge shards. Then check the distribution: even high-cardinality keys can be Zipfian.",
						detail: "user_id is high cardinality, but if 1% of users generate 50% of writes it is still skewed."
					},
					{
						title: "Decide what must stay together",
						text: "Anything you need to read atomically or join cheaply should hash to the same shard. Putting a user's orders on the user's shard turns a distributed join into a local one."
					},
					{
						title: "Plan for the outliers",
						text: "There will be a tenant a thousand times larger than the median. Decide now: give them a dedicated shard, or sub-shard their key with a suffix.",
						detail: "key = tenant_id + ':' + (hot ? random(0..15) : 0) — spreads a hot tenant across 16 partitions."
					},
					{
						title: "Verify you can reshard",
						text: "How do you go from 8 to 16 shards with the system live? If the answer is 'take an outage', pick a different scheme now."
					}
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
//             and only whole logical shards move, so migration is trackable.`
				}
			},
			{
				heading: "What sharding takes away",
				diagram: {
					kind: "system",
					caption: "Queries that used to be one statement become coordination problems.",
					columns: [
						{
							title: "Single-shard query",
							nodes: [{
								id: "a",
								label: "WHERE user_id = 42",
								sub: "routed to one shard",
								tone: "ok"
							}, {
								id: "b",
								label: "Latency = one query",
								tone: "ok"
							}]
						},
						{
							title: "Scatter-gather",
							nodes: [
								{
									id: "c",
									label: "WHERE created_at > ...",
									sub: "hits all N shards",
									tone: "warn"
								},
								{
									id: "d",
									label: "Latency = slowest shard",
									tone: "warn"
								},
								{
									id: "e",
									label: "Merge + sort in the app"
								}
							]
						},
						{
							title: "Cross-shard write",
							nodes: [{
								id: "f",
								label: "Transfer A → B",
								sub: "different shards",
								tone: "bad"
							}, {
								id: "g",
								label: "2PC, or saga + compensation",
								tone: "bad"
							}]
						},
						{
							title: "Global constraints",
							nodes: [{
								id: "h",
								label: "UNIQUE(email)",
								sub: "not enforceable per shard",
								tone: "bad"
							}, {
								id: "i",
								label: "Separate uniqueness service",
								sub: "or shard by email"
							}]
						}
					]
				},
				bullets: [
					"Joins across shards: denormalise, keep a local copy of the small side, or do the join in the application. Accept that some are simply not worth supporting.",
					"Transactions across shards: two-phase commit is available in some engines and is slow and failure-prone; sagas with compensating actions are the usual production answer.",
					"Global uniqueness: either shard by the unique attribute, or maintain a separate index/service that owns uniqueness for that field.",
					"Global secondary indexes become their own partitioned dataset with their own consistency lag.",
					"Aggregate queries (counts, top-N) need pre-aggregation or a separate analytics store — scatter-gather over every shard for a dashboard will not survive growth.",
					"The tail latency of a scatter-gather is the slowest shard's, so p99 degrades as shard count rises. Hedged requests and per-shard timeouts help."
				]
			},
			{
				heading: "Resharding without downtime",
				steps: [
					{
						title: "Dual-write",
						text: "Start writing to both the old and the new placement while all reads still come from the old. This is the point of no return for correctness bugs — make it reversible with a flag."
					},
					{
						title: "Backfill",
						text: "Copy historical data in batches, throttled so it does not starve live traffic. Track progress per logical shard so it can resume after a failure."
					},
					{
						title: "Verify",
						text: "Compare old and new continuously — row counts, checksums, and a sampled deep comparison. Do not skip this; silent divergence is the failure mode."
					},
					{
						title: "Shift reads",
						text: "Move reads to the new placement gradually, by percentage or by tenant, with an instant rollback path."
					},
					{
						title: "Stop dual-writing, then clean up",
						text: "Only after reads have been on the new placement long enough to trust. Keep the old data for a rollback window before deleting."
					}
				],
				callout: {
					kind: "insight",
					text: "Most engines that shard for you — Vitess, Citus, MongoDB, DynamoDB, CockroachDB — implement exactly this dance internally. In an interview, saying 'I would use a system that does online resharding rather than building it' is a legitimate and senior answer."
				}
			},
			{
				heading: "Hotspots: the failure you should design for",
				bullets: [
					"Sequential shard keys (auto-increment id, timestamp) send every new write to the same shard. Prefix with a hash, or use a time-bucketed composite key.",
					"Celebrity tenants: one account with a thousand times the traffic. Give them their own shard, or fan their key out with a random suffix and read all suffixes.",
					"Hot reads are easier than hot writes — a cache in front absorbs them. Hot writes need actual partitioning of the key.",
					"Measure per-shard QPS, storage and p99, not cluster averages. Averages hide the shard that is about to fall over.",
					"A rebalancing operation is itself load. Throttle it, and never rebalance during peak."
				],
				math: [
					{
						label: "When to consider sharding",
						expr: "dataset > single-node storage, or writes > single-leader capacity after tuning",
						result: "not before"
					},
					{
						label: "Shard count",
						expr: "target_data / comfortable_per_shard, then round up generously",
						result: "e.g. 20 TB / 1 TB = 20 → 32",
						note: "Powers of two make splitting simpler."
					},
					{
						label: "Scatter-gather p99",
						expr: "p99 of max over N shards ≫ p99 of one shard",
						result: "worse with every shard",
						note: "With 100 shards, a per-shard p99 of 10 ms yields a request p99 far above 10 ms."
					}
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "What shard key would you pick for a chat system?",
						a: "conversation_id, because the dominant query is 'the most recent messages in this conversation' and that keeps it on one shard, ordered. Sharding by message_id would spread every conversation across the cluster and turn the main read into a scatter-gather. The cost is that a user's list of conversations is then a cross-shard query, which I would serve from a separate per-user index."
					},
					{
						q: "How do you handle a tenant that is 1000× bigger than the rest?",
						a: "Detect it and treat it specially rather than hoping the hash saves me. Either pin that tenant to its own physical shard, or salt the key — append a small random suffix so their writes spread across 16 partitions, and fan the read out across those 16. I would also make sure per-shard metrics exist, because otherwise the first sign is an outage."
					},
					{
						q: "How do you go from 8 shards to 16 while live?",
						a: "By never hashing directly onto physical nodes. With a fixed set of logical shards — say 1024 — growing the cluster just moves ranges of logical shards, so exactly half of each node's data moves and the mapping stays stable. Operationally it is dual-write, backfill, verify, shift reads gradually, then stop dual-writing, with a rollback flag at every step."
					},
					{
						q: "Can you still do transactions?",
						a: "Within a shard, yes, and that is why co-locating related data matters so much. Across shards I would avoid two-phase commit — it blocks on the coordinator and hurts availability — and use a saga: a sequence of local transactions with compensating actions, plus idempotency so retries are safe. If cross-shard transactions are genuinely core to the domain, I would consider a distributed SQL engine instead of hand-rolling it."
					}
				]
			}
		],
		related: [
			"/hld/consistent-hashing",
			"/hld/replication",
			"/hld/sql-vs-nosql",
			"/examples/kv-store"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "consistent-hashing"
	},
	{
		slug: "consistent-hashing",
		title: "Consistent Hashing",
		subtitle: "Add a node and move 1/n of the keys, not all of them.",
		level: "intermediate",
		minutes: 14,
		tags: [
			"distributed",
			"partitioning",
			"algorithms"
		],
		summary: "Modulo hashing remaps almost every key when the cluster size changes, which means a cold cache and a stampede on every scale event. Consistent hashing places nodes and keys on the same ring so that adding or removing a node only affects the keys between it and its neighbour — about 1/n of the data.",
		keyPoints: [
			"hash(key) mod N remaps ~(N-1)/N of keys when N changes. Consistent hashing remaps ~1/N.",
			"Virtual nodes are not optional: without them, load distribution is badly uneven.",
			"Replication is 'the next R distinct physical nodes clockwise' on the same ring.",
			"It solves rebalancing, not hotspots — a single hot key still lands on one node.",
			"Rendezvous hashing is a simpler alternative with equally good properties."
		],
		sections: [
			{
				heading: "The problem with modulo",
				math: [
					{
						label: "Modulo, 4 → 5 nodes",
						expr: "fraction remapped = 1 − 1/5 (approximately)",
						result: "≈ 80% of keys move",
						note: "Every moved key is a cache miss and a data transfer."
					},
					{
						label: "Consistent hashing, 4 → 5 nodes",
						expr: "each node gives up roughly an equal share to the newcomer",
						result: "≈ 20% of keys move",
						note: "Only keys in the arc the new node takes over."
					},
					{
						label: "Cost of the difference",
						expr: "1 TB cache, 80% vs 20% remapped",
						result: "800 GB vs 200 GB refetched",
						note: "The 80% case is an origin stampede; the 20% case is a busy afternoon."
					}
				],
				callout: {
					kind: "warn",
					text: "The real-world version of this: a cache node dies at peak, modulo hashing remaps almost every key, every request misses, and the database takes full traffic. The outage is caused by the hashing scheme, not by the node failure."
				}
			},
			{
				heading: "The ring",
				body: ["Hash both nodes and keys into the same space — commonly a 32- or 64-bit integer treated as a circle. A key belongs to the first node found by walking clockwise from the key's position. Adding a node inserts a point on the circle and takes over only the arc between it and its predecessor."],
				diagram: {
					kind: "flow",
					caption: "Walk clockwise from the key to find its owner; only one arc changes hands.",
					rows: [[{
						id: "k1",
						label: "hash('user:42')",
						sub: "position 0x3F1A",
						tone: "accent"
					}, {
						id: "n1",
						label: "Node B",
						sub: "first node clockwise",
						tone: "ok"
					}], [
						{
							id: "n0",
							label: "Node A",
							sub: "0x1000"
						},
						{
							id: "nn",
							label: "Node D (new)",
							sub: "0x3000 — takes A→B's arc",
							tone: "warn"
						},
						{
							id: "nb",
							label: "Node B",
							sub: "0x8000"
						},
						{
							id: "nc",
							label: "Node C",
							sub: "0xC000"
						}
					]]
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
}`
				},
				callout: {
					kind: "insight",
					text: "The distinct-physical-node check in getNodes is the detail interviewers look for. Without it, three 'replicas' can all be virtual nodes of the same machine, and one failure takes out every copy."
				}
			},
			{
				heading: "Why virtual nodes are mandatory",
				table: {
					headers: [
						"Virtual nodes per physical node",
						"Load standard deviation",
						"Ring size (10 nodes)",
						"Verdict"
					],
					rows: [
						[
							"1",
							"~30-40% — some nodes get 2× others",
							"10 points",
							"Unusable"
						],
						[
							"10",
							"~10%",
							"100 points",
							"Still lumpy"
						],
						[
							"150",
							"~3-5%",
							"1,500 points",
							"The common production choice"
						],
						[
							"1000",
							"~1-2%",
							"10,000 points",
							"Diminishing returns; lookup and memory cost rises"
						]
					]
				},
				bullets: [
					"With one point per node, random placement leaves large arcs to some nodes and slivers to others. More points averages the arcs out — it is the law of large numbers doing the work.",
					"Virtual nodes also make removal graceful: a dead node's keys spread across many neighbours instead of dumping entirely onto one successor.",
					"Weighting falls out for free: a machine with twice the memory gets twice the virtual nodes.",
					"Memory cost is small — 150 vnodes × 100 nodes is 15,000 entries, and lookup is a binary search over them."
				]
			},
			{
				heading: "Where it is used, and the alternative",
				bullets: [
					"Distributed caches (memcached clients, Redis Cluster's 16,384 hash slots — a fixed-slot variant of the same idea).",
					"Dynamo-style databases (Cassandra, Riak, DynamoDB) for both placement and replication.",
					"Load balancers with cache affinity: route the same URL to the same backend so its local cache stays warm.",
					"Sharded rate limiters and session stores, where the key must consistently reach the node holding its state."
				],
				diagram: {
					kind: "compare",
					caption: "Two schemes with the same guarantee.",
					options: [{
						title: "Consistent hashing (ring)",
						good: [
							"Well known; the vocabulary interviewers expect",
							"Natural replication: next R nodes clockwise",
							"Weighting via virtual node counts"
						],
						bad: [
							"Needs virtual nodes to be even",
							"Ring state must be shared or gossiped",
							"Fiddly to implement correctly (distinct-node replication)"
						],
						verdict: "The default answer, and what most systems ship."
					}, {
						title: "Rendezvous (HRW) hashing",
						tone: "ok",
						good: [
							"No ring, no virtual nodes: pick argmax of hash(key, node)",
							"Naturally even distribution",
							"Trivially correct, ~10 lines"
						],
						bad: ["O(N) per lookup unless you optimise", "Less common vocabulary; may need explaining"],
						verdict: "Small node counts, or when you want simplicity over convention."
					}]
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
// Top-R by score gives you replication with no extra machinery.`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Why not just hash mod N?",
						a: "Because changing N remaps almost every key. For a cache that means a near-total miss storm on any scale-up or node failure, and the database sees full traffic exactly when the cluster is already degraded. For a datastore it means moving nearly all the data. Consistent hashing bounds the movement to roughly 1/N."
					},
					{
						q: "Does consistent hashing solve hotspots?",
						a: "No, and this is the most common misunderstanding. It distributes the key space evenly, not the traffic. One extremely popular key still lands on exactly one node no matter how good the hashing is. The fixes for that are different: replicate the hot key across several nodes and read a random one, or add a small local cache in front to absorb the reads."
					},
					{
						q: "How many virtual nodes would you use?",
						a: "On the order of 100-200 per physical node. That gets the standard deviation of load down to a few percent, which is close to the practical floor, while keeping the ring small enough that lookups stay a cheap binary search. Below about ten, the distribution is visibly uneven."
					},
					{
						q: "How does every client agree on the ring?",
						a: "Either a coordination service holds the membership — ZooKeeper, etcd, or a config service clients watch — or the nodes gossip membership among themselves, as Dynamo-style systems do. The subtle failure is a client with a stale ring writing to the wrong node; systems handle that with a request that carries the ring version, so a node can reject or forward a misrouted write."
					}
				]
			}
		],
		related: [
			"/hld/sharding",
			"/hld/caching",
			"/examples/consistent-hashing",
			"/playgrounds/consistent-hashing"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "consistent-hashing"
	},
	{
		slug: "sql-vs-nosql",
		title: "SQL vs NoSQL",
		subtitle: "Choose by access pattern and consistency need, not by fashion.",
		level: "foundational",
		minutes: 16,
		tags: [
			"databases",
			"modeling",
			"trade-offs"
		],
		summary: "The honest version of this question is not 'which is better' but 'what does my access pattern look like, and what am I willing to give up'. Relational databases give you flexible queries and real transactions on one node. NoSQL families each trade some of that away for a specific scaling or modelling property.",
		keyPoints: [
			"Start relational unless there is a concrete reason not to. Postgres scales further than most people assume.",
			"Document stores fit self-contained aggregates; the trap is needing to query across them.",
			"Wide-column stores are for enormous write volumes with known access patterns — you design tables per query.",
			"Key-value is for one lookup pattern at extreme speed; anything else needs a second index you maintain.",
			"Polyglot persistence is normal: relational as the source of truth, plus specialised stores for search, cache and analytics."
		],
		sections: [
			{
				heading: "The families, and what each is actually for",
				table: {
					headers: [
						"Family",
						"Data model",
						"Strong at",
						"Weak at",
						"Examples"
					],
					rows: [
						[
							"Relational",
							"Tables, rows, foreign keys",
							"Ad-hoc queries, joins, ACID transactions, constraints",
							"Horizontal write scaling; rigid schema migrations at size",
							"Postgres, MySQL"
						],
						[
							"Document",
							"JSON-ish documents",
							"Self-contained aggregates, flexible fields, fast whole-object reads",
							"Cross-document joins, multi-document transactions (improving)",
							"MongoDB, DynamoDB (doc mode), Couchbase"
						],
						[
							"Wide-column",
							"Row key + column families, sorted",
							"Massive write throughput, time series, known access patterns",
							"Ad-hoc queries; you must model per query",
							"Cassandra, HBase, ScyllaDB, Bigtable"
						],
						[
							"Key-value",
							"Opaque value by key",
							"Sub-millisecond lookups, caches, sessions, counters",
							"Any query that is not by primary key",
							"Redis, Memcached, DynamoDB"
						],
						[
							"Graph",
							"Nodes and edges",
							"Multi-hop traversal: friends-of-friends, fraud rings, permissions",
							"Bulk analytics; sharding a graph is genuinely hard",
							"Neo4j, Neptune"
						],
						[
							"Search",
							"Inverted index",
							"Full-text relevance, faceting, fuzzy matching",
							"Source of truth — it is a derived index, not a database",
							"Elasticsearch, OpenSearch"
						],
						[
							"Time series",
							"Timestamped points",
							"High-cardinality metrics, downsampling, retention",
							"Updates and general-purpose queries",
							"Prometheus, InfluxDB, TimescaleDB"
						]
					]
				}
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

-- New question next week? New query. No migration, no backfill.`
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
// either fan out an update across documents or accept a stale copy.`
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
-- written to at the same time. Duplication is the design, not a smell.`
					}
				],
				callout: {
					kind: "insight",
					text: "The one-sentence version: relational databases let you decide the query later; NoSQL stores make you decide it now, and reward you with predictable performance at scale. If you cannot list your queries, that is an argument for relational."
				}
			},
			{
				heading: "The arguments that are usually wrong",
				table: {
					headers: ["Claim", "Reality"],
					rows: [
						["\"NoSQL scales, SQL doesn't\"", "A tuned Postgres handles tens of thousands of writes/sec and terabytes. Most systems never reach the point where the engine is the limit."],
						["\"NoSQL is schemaless\"", "The schema moved into the application, where it is enforced by nobody. You still have one — it is just implicit and versioned across live documents."],
						["\"NoSQL is faster\"", "For its designed access pattern, yes. For a query it was not designed for, it is dramatically slower or impossible."],
						["\"SQL can't do JSON\"", "Postgres has jsonb with indexes; you can keep an aggregate in a column and still join and transact around it."],
						["\"NoSQL means no transactions\"", "Increasingly untrue — MongoDB and DynamoDB both offer multi-item transactions, with limits. Read the limits."],
						["\"We'll migrate later if needed\"", "Data migrations at scale are the hardest engineering work there is. Choosing is cheap now and expensive later."]
					]
				}
			},
			{
				heading: "A decision procedure",
				steps: [
					{
						title: "Write down the top five queries",
						text: "By expected volume. If they are diverse and likely to change, that argues strongly for relational. If there is one dominant key-based access pattern, a key-value or wide-column store becomes viable."
					},
					{
						title: "Identify the consistency requirements",
						text: "Does anything need multi-row atomicity — money, inventory, bookings? That is an argument for a real transaction, on one node if possible."
					},
					{
						title: "Estimate size and write rate",
						text: "Under a terabyte and under a few thousand writes per second is comfortably single-node relational territory. Do the arithmetic rather than guessing."
					},
					{
						title: "Check the relationship shape",
						text: "Deeply connected data with multi-hop traversal is a graph problem, and expressing it as recursive SQL or repeated document lookups is painful."
					},
					{
						title: "Then pick, and name what you gave up",
						text: "Every choice sacrifices something. Saying 'I picked DynamoDB, which means no ad-hoc queries and I will need a secondary index or a stream to Elasticsearch for search' is a complete answer."
					}
				],
				math: [
					{
						label: "Is this big?",
						expr: "10 M rows × 1 KB",
						result: "10 GB",
						note: "Fits in RAM on a mid-size instance. This is not a scaling problem."
					},
					{
						label: "Is this write-heavy?",
						expr: "50 M writes/day ÷ 86,400 × 3 (peak factor)",
						result: "≈ 1,700 writes/s",
						note: "Comfortable for one Postgres primary with sensible indexing."
					},
					{
						label: "When relational genuinely runs out",
						expr: "sustained writes ≫ 10⁴/s, or working set ≫ one machine",
						result: "then shard or change engine"
					}
				]
			},
			{
				heading: "Polyglot persistence in practice",
				diagram: {
					kind: "system",
					caption: "One source of truth, several derived stores fed by change data capture.",
					columns: [
						{
							title: "Source of truth",
							nodes: [{
								id: "pg",
								label: "Postgres",
								sub: "orders, users, money",
								tone: "accent"
							}]
						},
						{
							title: "Change stream",
							nodes: [{
								id: "cdc",
								label: "CDC / outbox",
								sub: "logical replication → Kafka"
							}]
						},
						{
							title: "Derived stores",
							nodes: [
								{
									id: "es",
									label: "Elasticsearch",
									sub: "search + facets"
								},
								{
									id: "redis",
									label: "Redis",
									sub: "sessions, counters, cache"
								},
								{
									id: "ch",
									label: "Warehouse",
									sub: "analytics, BI"
								},
								{
									id: "s3",
									label: "Object storage",
									sub: "files, media"
								}
							]
						}
					]
				},
				bullets: [
					"Exactly one store owns each piece of truth. Everything else is derived and can be rebuilt — that rule is what keeps polyglot persistence from becoming chaos.",
					"Derived stores are eventually consistent by definition. Search results a few seconds behind are fine; a balance check a few seconds behind is not.",
					"Every extra store is operational cost: backups, upgrades, monitoring, on-call knowledge. Two well-run stores usually beat five badly-run ones."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Which would you pick for this system, and why?",
						a: "I would start from the access patterns. If the top queries are diverse, or anything needs multi-row atomicity, relational — and I would note that a single Postgres handles far more than people assume. If there is one dominant key-based pattern at very high write volume, like a message store keyed by conversation, then a wide-column store designed around that key. What I would avoid is picking the engine before listing the queries."
					},
					{
						q: "How would you add full-text search?",
						a: "Not by putting the search engine in the write path. Keep the relational store as the source of truth and feed Elasticsearch from a change stream — logical replication or an outbox table — so search is a derived, rebuildable index. For modest needs, Postgres full-text search avoids a whole extra system, and I would check that first."
					},
					{
						q: "Your document store now needs a query across documents. What do you do?",
						a: "That is the classic document-store wall. The options are: maintain a second collection shaped for that query and write to both, stream changes into a store that can answer it, or accept a scan. Which one depends on volume, but the important thing is recognising that the modelling decision made earlier is what is now expensive — and being honest about it rather than bolting on a slow aggregation pipeline."
					},
					{
						q: "Can you get ACID in a NoSQL store?",
						a: "Increasingly yes, with limits worth reading carefully — DynamoDB transactions cap the number of items, MongoDB transactions work best within a shard, and both cost latency. The bigger point is that ACID within one partition is usually available and cheap, and it is transactions spanning partitions that are hard everywhere, including in sharded SQL."
					}
				]
			}
		],
		related: [
			"/hld/sharding",
			"/hld/consistency",
			"/hld/replication",
			"/lld/repository"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var hldFundamentals = [
	{
		slug: "scaling",
		title: "Scaling: Vertical, Horizontal, and the Order to Do It In",
		subtitle: "From one box to a tier that survives losing a machine.",
		level: "foundational",
		minutes: 16,
		tags: [
			"scalability",
			"architecture",
			"fundamentals"
		],
		summary: "Every system design answer is a walk up the same staircase: one server, then a separated database, then a cache, then read replicas, then stateless app servers behind a load balancer, then sharding when one write leader is no longer enough. Knowing the order — and the failure that forces each step — is more valuable than knowing any single technology.",
		keyPoints: [
			"Vertical scaling is the fastest fix and has a hard ceiling plus a single point of failure. Use it, then plan past it.",
			"Horizontal scaling requires statelessness: session in a shared store, uploads in object storage, nothing on local disk.",
			"Reads scale with caching and replicas; writes scale with sharding, and sharding is where the complexity lives.",
			"The database is the bottleneck in almost every design. Everything else is easier than it looks.",
			"Scale for the traffic you have plus one order of magnitude — not three."
		],
		sections: [
			{
				heading: "The staircase",
				lede: "Each step exists because a specific thing broke.",
				steps: [
					{
						title: "One server",
						text: "Web server, application and database on one box. Handles a surprising amount — thousands of requests per second for simple workloads. It fails when the machine dies, and every deploy is downtime.",
						detail: "Ceiling: one machine's CPU, RAM and disk. Availability: no redundancy at all."
					},
					{
						title: "Split the database onto its own machine",
						text: "Application and database now scale and fail independently, and you can size each for what it needs — CPU for the app, memory and IOPS for the database. This is the first step in nearly every real system.",
						detail: "Cost: a network hop per query. Benefit: two tuning knobs instead of one."
					},
					{
						title: "Add a load balancer and more app servers",
						text: "Requires the app to be stateless. Now you can lose a server without losing the service, and deploys become rolling rather than downtime.",
						detail: "Prerequisite: sessions in Redis or a signed cookie, uploads in S3, no in-process caches you depend on for correctness."
					},
					{
						title: "Add a cache",
						text: "Most workloads are read-heavy and skewed. A cache in front of the database absorbs the hot keys and typically removes 80-95% of read load for a fraction of the cost of another replica.",
						detail: "Now you own an invalidation problem. Decide TTL and write policy explicitly."
					},
					{
						title: "Add read replicas",
						text: "Send reads to followers, writes to the leader. Multiplies read capacity, and introduces replication lag — the first place users see 'I saved it and it disappeared'.",
						detail: "Route a user's reads to the leader for a few seconds after their own write (read-your-writes)."
					},
					{
						title: "Push static and media to a CDN",
						text: "Images, JS, video and API responses that can tolerate staleness move to the edge. This cuts both latency and origin bandwidth, often dramatically."
					},
					{
						title: "Shard the write path",
						text: "When a single write leader cannot keep up, or the dataset no longer fits one machine, partition by key. This is the expensive step: cross-shard joins, transactions and rebalancing all become your problem.",
						detail: "Delay it as long as honestly possible. Then pick a shard key you can live with for years."
					},
					{
						title: "Split by service and by region",
						text: "Separate teams and separate failure domains: extract the services with different scaling profiles, then replicate across regions for latency and disaster recovery."
					}
				],
				callout: {
					kind: "interview",
					text: "Walking this staircase out loud is a complete answer to 'how would you scale this?'. Name the step, the failure that forces it, and the new problem it creates — that last part is what separates a memorised list from understanding."
				}
			},
			{
				heading: "Vertical versus horizontal",
				diagram: {
					kind: "compare",
					caption: "They are not alternatives — you do both, in this order.",
					options: [{
						title: "Vertical (bigger machine)",
						good: [
							"No code changes; works for any workload",
							"Keeps single-node consistency and simple transactions",
							"Often the cheapest fix for the next 12 months"
						],
						bad: [
							"Hard ceiling (largest instance available)",
							"Still one machine — one failure domain",
							"Cost grows super-linearly at the top end",
							"Resize usually means a restart"
						],
						verdict: "Databases, and buying time. Do it first; it is nearly free engineering-wise."
					}, {
						title: "Horizontal (more machines)",
						tone: "ok",
						good: [
							"No practical ceiling",
							"Failure of one node is survivable",
							"Commodity hardware, and elastic with load"
						],
						bad: [
							"Requires statelessness and a load balancer",
							"Coordination, consistency and data partitioning become real problems",
							"Operational complexity: deploys, config, observability across N nodes"
						],
						verdict: "Stateless tiers immediately; stateful tiers when vertical runs out."
					}]
				},
				table: {
					headers: [
						"Tier",
						"Scales by",
						"Limiting resource",
						"First thing to try"
					],
					rows: [
						[
							"Web / app",
							"Horizontal, easily",
							"CPU",
							"Add instances behind the load balancer"
						],
						[
							"Cache",
							"Horizontal with consistent hashing",
							"Memory",
							"Bigger instance, then shard"
						],
						[
							"Database reads",
							"Replicas + cache",
							"IOPS, CPU",
							"Cache the hot keys before adding replicas"
						],
						[
							"Database writes",
							"Sharding, or a different engine",
							"Write throughput, disk",
							"Batch, queue and denormalise before sharding"
						],
						[
							"Object storage",
							"Effectively unlimited (managed)",
							"Bandwidth, cost",
							"Nothing — this is why it exists"
						]
					]
				}
			},
			{
				heading: "The stateless requirement",
				lede: "Horizontal scaling is easy in principle and blocked by four things in practice.",
				bullets: [
					"In-memory sessions: a user's second request lands on a different server and they are logged out. Move sessions to Redis, or use a signed stateless token.",
					"Local file uploads: written to server 3's disk, invisible to servers 1 and 2. Move to object storage.",
					"In-process caches used for correctness: fine as an optimisation, dangerous as a source of truth — two servers will disagree.",
					"Background jobs run per instance: five servers each running a nightly cron means five duplicate runs. Use a scheduler with leader election or a job queue."
				],
				diagram: {
					kind: "system",
					caption: "The shape almost every system converges to.",
					columns: [
						{
							title: "Edge",
							nodes: [{
								id: "dns",
								label: "DNS",
								sub: "geo routing"
							}, {
								id: "cdn",
								label: "CDN",
								sub: "static + media",
								tone: "accent"
							}]
						},
						{
							title: "Entry",
							nodes: [{
								id: "lb",
								label: "Load balancer",
								sub: "L7, health checks",
								tone: "accent"
							}, {
								id: "gw",
								label: "API gateway",
								sub: "auth, rate limit"
							}]
						},
						{
							title: "Compute",
							nodes: [{
								id: "app",
								label: "App servers ×N",
								sub: "stateless",
								tone: "ok"
							}, {
								id: "wrk",
								label: "Workers",
								sub: "async jobs"
							}]
						},
						{
							title: "State",
							nodes: [
								{
									id: "cache",
									label: "Cache",
									sub: "Redis, hot keys"
								},
								{
									id: "db",
									label: "Primary DB",
									sub: "writes"
								},
								{
									id: "rr",
									label: "Read replicas",
									sub: "reads"
								},
								{
									id: "s3",
									label: "Object storage",
									sub: "blobs"
								}
							]
						}
					]
				}
			},
			{
				heading: "Know your numbers",
				lede: "One good estimate beats ten adjectives.",
				math: [
					{
						label: "One modern app server",
						expr: "~5,000–20,000 rps for simple JSON; ~500–2,000 rps with real work per request",
						result: "order 10³",
						note: "Wildly workload-dependent — but this is the range to reason from."
					},
					{
						label: "One Postgres primary",
						expr: "~5,000–50,000 simple writes/sec with fast disks; far less with heavy indexes",
						result: "order 10⁴"
					},
					{
						label: "Redis, single node",
						expr: "~100,000 ops/sec, sub-millisecond, single-threaded per core",
						result: "order 10⁵"
					},
					{
						label: "Network round trip",
						expr: "same AZ ≈ 0.5 ms · cross-region ≈ 50–150 ms · SSD read ≈ 0.1 ms · memory ≈ 100 ns",
						result: "latency ladder"
					},
					{
						label: "Daily to per-second",
						expr: "1 M/day ÷ 86,400 ≈ 12/s average; peak is typically 2–5× average",
						result: "≈ 60/s peak",
						note: "Always convert to peak. Systems are sized for peak, not average."
					}
				],
				callout: {
					kind: "insight",
					text: "1 million requests a day is about 12 per second. Candidates routinely propose Kafka and a 50-node cluster for traffic a single server handles. Doing the division out loud is one of the highest-value things you can do in an interview."
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Where would you start scaling this system?",
						a: "By measuring, then by the staircase. I would find out which resource is saturated — CPU on the app tier, IOPS or CPU on the database, or bandwidth — because the fix differs completely. In most systems it is the database, and the cheapest first moves are a cache in front of the hot reads and moving media to a CDN, before adding replicas or considering shards."
					},
					{
						q: "When do you shard?",
						a: "When a single write leader cannot keep up, or the working set no longer fits on one machine, and I have already exhausted vertical scaling, caching and read replicas. Sharding costs me cross-shard queries, distributed transactions and a rebalancing story, so it is the last step. When I do it, choosing the shard key is the decision that matters most — it should spread writes evenly and keep the common query on one shard."
					},
					{
						q: "How do you handle a 10× traffic spike?",
						a: "Autoscaling handles the app tier if it is genuinely stateless, but it does not save the database — connections and IOPS are the real limit, so I would put a connection pooler in front and rate limit at the edge. Beyond that, shed load deliberately: serve cached or degraded responses, queue writes that can be async, and protect the core transaction path. A system that serves 80% of requests well beats one that falls over serving 100%."
					},
					{
						q: "Microservices or a monolith?",
						a: "A modular monolith unless there is a specific reason not to. Services solve organisational scaling and independent deployment, not performance — they add network calls, partial failure and distributed debugging. I would split out the pieces with genuinely different scaling profiles or ownership, like video transcoding or search indexing, and keep the rest together."
					}
				]
			}
		],
		related: [
			"/hld/load-balancing",
			"/hld/caching",
			"/hld/sharding",
			"/hld/estimation"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "load-balancing",
		title: "Load Balancing",
		subtitle: "Spread traffic, remove dead servers, and do it without breaking sessions.",
		level: "foundational",
		minutes: 15,
		tags: [
			"networking",
			"availability",
			"traffic"
		],
		summary: "A load balancer is the component that makes horizontal scaling and zero-downtime deploys possible: it spreads requests across a pool, notices when a member stops answering, and takes it out. The algorithm matters less than most people think; health checks, connection draining and the layer you operate at matter much more.",
		keyPoints: [
			"L4 balances connections by IP and port — fast, protocol-agnostic. L7 reads the request — routing, TLS termination, retries.",
			"Least-connections beats round-robin whenever request cost varies, which is almost always.",
			"Health checks are the actual value: passive checks catch what active checks miss.",
			"Sticky sessions are a workaround for statefulness; prefer shared session storage.",
			"The load balancer is a single point of failure until it is a pair with a floating IP or DNS failover."
		],
		sections: [
			{
				heading: "Layer 4 versus layer 7",
				diagram: {
					kind: "compare",
					caption: "Different information, different powers.",
					options: [{
						title: "L4 — transport",
						sub: "TCP/UDP, sees IP and port",
						good: [
							"Very high throughput, low latency, cheap per connection",
							"Protocol-agnostic: works for gRPC, databases, anything",
							"Can pass TLS straight through untouched"
						],
						bad: [
							"Cannot route by path, header or cookie",
							"Cannot retry a failed request — it only sees a stream",
							"No per-request metrics or content-based rules"
						],
						verdict: "Extreme throughput, non-HTTP protocols, or in front of L7 balancers."
					}, {
						title: "L7 — application",
						sub: "HTTP, sees method, path, headers",
						tone: "ok",
						good: [
							"Route by path or host: /api → services, /img → media tier",
							"TLS termination, compression, header rewriting",
							"Retries, timeouts, circuit breaking, request-level metrics",
							"Sticky sessions by cookie"
						],
						bad: ["More CPU per request; terminating TLS is the expensive part", "Must understand the protocol; HTTP/2 and gRPC need explicit support"],
						verdict: "Almost all web traffic. This is what people mean by 'load balancer' today."
					}]
				},
				callout: {
					kind: "warn",
					text: "gRPC and HTTP/2 multiplex many requests over one long-lived connection. An L4 balancer will pin all of a client's requests to one backend and your load will be badly skewed — this needs an L7 proxy that balances per request."
				}
			},
			{
				heading: "Algorithms, and when the choice matters",
				table: {
					headers: [
						"Algorithm",
						"How it picks",
						"Good for",
						"Fails when"
					],
					rows: [
						[
							"Round robin",
							"Next in the list",
							"Uniform requests, identical servers",
							"Request cost varies — slow requests pile up"
						],
						[
							"Weighted round robin",
							"Proportional to capacity",
							"Mixed instance sizes, gradual rollouts",
							"Weights go stale as workloads change"
						],
						[
							"Least connections",
							"Fewest in-flight",
							"Variable request duration — the usual default",
							"Long-polling or streaming skews the count"
						],
						[
							"Least response time",
							"Lowest latency × connections",
							"Heterogeneous backends",
							"Reacts to noise; needs smoothing"
						],
						[
							"IP hash",
							"hash(client IP)",
							"Crude stickiness without cookies",
							"NAT puts thousands of users on one backend"
						],
						[
							"Consistent hashing",
							"hash(key) on a ring",
							"Cache affinity — same key to same node",
							"Hot keys still concentrate"
						],
						[
							"Power of two choices",
							"Pick 2 at random, take the emptier",
							"Large pools; near-optimal with almost no state",
							"Rarely — this is the quiet default at scale"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "'Power of two random choices' is worth knowing: sampling two backends and taking the less loaded gets you nearly the benefit of global least-connections without any global state. It is why large-scale balancers do not need perfect information."
				}
			},
			{
				heading: "Health checks are the real feature",
				lede: "Balancing is easy; knowing who is alive is not.",
				body: ["A load balancer's job is less about spreading load evenly than about not sending traffic to something broken. That means two kinds of checking, and both are needed: an active probe on a schedule, and passive observation of real traffic."],
				bullets: [
					"Active checks: GET /healthz every few seconds, mark unhealthy after N consecutive failures, healthy again after M successes. Hysteresis prevents flapping.",
					"The health endpoint must be shallow — it should check that this process can serve, not that every dependency is up. A deep check that pings the database will take your entire fleet out when the database blips.",
					"Passive checks (outlier detection): a backend returning 5xx or timing out on real traffic gets ejected temporarily, even if /healthz still returns 200. This catches the 'healthy but broken' case that active checks miss.",
					"Slow start: a newly healthy backend gets a gradually increasing share, so a cold JIT or empty cache does not get hit with full load and immediately fail again.",
					"Connection draining: on deploy or scale-down, stop sending new requests but let in-flight ones finish, with a timeout. Without it, every deploy drops requests.",
					"Never let all backends be ejected at once — most balancers have a panic threshold that reverts to sending to everyone rather than to no one."
				],
				code: {
					title: "A health endpoint that does not cause outages",
					lang: "ts",
					source: `// Liveness — "is this process wedged?" Restart if this fails.
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Readiness — "should I get traffic right now?"
app.get("/readyz", async (_req, res) => {
  if (shuttingDown) return res.status(503).send("draining");
  if (!warmedUp)   return res.status(503).send("warming");
  // Deliberately does NOT check the database: if the DB is down,
  // taking every app server out of rotation makes it strictly worse.
  res.status(200).send("ready");
});

// Graceful shutdown: fail readiness first, then drain.
process.on("SIGTERM", async () => {
  shuttingDown = true;                    // LB stops sending new requests
  await sleep(LB_CHECK_INTERVAL * 2);     // wait for it to notice
  await server.close();                   // finish in-flight requests
  await pool.end();
  process.exit(0);
});`
				}
			},
			{
				heading: "Sessions, stickiness and the honest advice",
				body: ["Sticky sessions route a given user to the same backend, usually via a cookie the balancer sets. It works, and it quietly undoes most of what a load balancer is for: load becomes uneven, a backend's death logs out its users, and scale-in drops sessions."],
				diagram: {
					kind: "flow",
					caption: "Prefer moving the state, not pinning the user.",
					rows: [[{
						id: "bad",
						label: "Sticky session",
						sub: "state on one server",
						tone: "bad"
					}, {
						id: "s1",
						label: "Server dies",
						sub: "its users log out",
						tone: "bad"
					}], [{
						id: "good",
						label: "Shared session store",
						sub: "Redis, or a signed token",
						tone: "ok"
					}, {
						id: "s2",
						label: "Any server can serve",
						sub: "deploys and failures are invisible",
						tone: "ok"
					}]]
				},
				bullets: [
					"Shared store (Redis): any server serves any user; revocation is instant; costs one fast lookup per request.",
					"Signed stateless token (JWT in a cookie): no lookup at all, but revoking before expiry needs a denylist — which is a shared store again, just smaller.",
					"Legitimate stickiness: long-lived WebSocket connections, and in-memory per-connection state you genuinely cannot externalise. Say that explicitly rather than defending stickiness in general."
				]
			},
			{
				heading: "Making the balancer itself redundant",
				bullets: [
					"Active-passive pair sharing a floating (virtual) IP: the standby takes the IP when the active fails. Failover in seconds, and simple.",
					"DNS round robin across multiple balancer IPs: clients spread themselves, but DNS caching means failover takes as long as the TTL — minutes, not seconds.",
					"Anycast: the same IP announced from many locations, and the network routes to the nearest healthy one. This is how large CDNs and DNS providers do it.",
					"Managed cloud balancers (ALB/NLB, Cloud Load Balancing) hide all of this and are usually the right answer — say so rather than designing an HAProxy cluster nobody asked for.",
					"Client-side load balancing is a real alternative for internal service-to-service traffic: the client gets the pool from service discovery and picks, removing a hop and a dependency. It is what service meshes do with a sidecar."
				],
				table: {
					headers: [
						"Failure",
						"What the user sees",
						"Mitigation"
					],
					rows: [
						[
							"One backend dies",
							"Nothing, if health checks are fast",
							"Active + passive checks, retry idempotent requests"
						],
						[
							"All backends unhealthy",
							"Total outage",
							"Panic mode: send to all rather than none; alert loudly"
						],
						[
							"Balancer dies",
							"Total outage until failover",
							"HA pair with floating IP, or a managed balancer"
						],
						[
							"Deploy without draining",
							"Dropped requests, 502s",
							"Readiness flip, then drain with a timeout"
						],
						[
							"One slow backend",
							"p99 latency spike",
							"Outlier ejection, timeouts, least-connections"
						],
						[
							"Retry storm",
							"Cascading overload",
							"Budgeted retries, jitter, circuit breaking"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Round robin or least connections?",
						a: "Least connections in almost every real system, because request cost is never uniform — one search query can cost 100× a health check, and round robin will keep feeding a server that is already busy. Round robin is fine when requests are genuinely homogeneous, and it is cheaper. At very large pools I would mention power-of-two-choices, which gets most of the benefit with almost no shared state."
					},
					{
						q: "How does the load balancer know a server is down?",
						a: "Active probes on an interval with hysteresis — several consecutive failures before ejection, several successes before return — plus passive outlier detection on real traffic, which catches servers that answer /healthz but fail actual requests. The important design detail is that the health endpoint should not check downstream dependencies, or one database blip removes every server at once."
					},
					{
						q: "How do you deploy without dropping requests?",
						a: "Rolling deploy with readiness gating and connection draining. The instance fails its readiness check first, waits long enough for the balancer to notice, then stops accepting new connections and finishes in-flight ones before exiting. Without that wait, the balancer is still routing to a process that has already closed its listener, and users see 502s."
					},
					{
						q: "Where else do you load balance besides HTTP?",
						a: "DNS-level for geographic distribution, anycast at the network level for the edge, client-side balancing for internal service calls, and inside the database tier — a connection pooler in front of read replicas is load balancing too. Each layer answers a different question: DNS picks a region, the balancer picks a machine, the pooler picks a connection."
					}
				]
			}
		],
		related: [
			"/hld/scaling",
			"/hld/dns",
			"/hld/api-gateway",
			"/playgrounds/load-balancer"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "load-balancer"
	},
	{
		slug: "caching",
		title: "Caching",
		subtitle: "The highest-leverage optimisation, and the easiest one to get subtly wrong.",
		level: "foundational",
		minutes: 18,
		tags: [
			"performance",
			"caching",
			"consistency"
		],
		summary: "Caching turns an expensive computation into a cheap lookup, and typically removes 80-95% of read load in a read-heavy system. Everything hard about it comes from the same question: how do you know when the cached copy is no longer true, and what do you do while you find out?",
		keyPoints: [
			"Cache-aside is the default: the application reads through and populates on miss.",
			"TTL bounds staleness; invalidation removes it faster but is easy to miss a path.",
			"Three canonical failures: stampede (many misses at once), penetration (misses for keys that do not exist), avalanche (mass simultaneous expiry).",
			"A cache hit ratio without an eviction rate is a misleading metric.",
			"Cache the expensive and reused. Caching everything wastes memory and multiplies invalidation surface."
		],
		sections: [
			{
				heading: "Where caches live",
				diagram: {
					kind: "layers",
					caption: "Every layer is a cache; each is faster and less consistent than the one below.",
					layers: [
						{
							title: "Client",
							items: [
								"Browser HTTP cache",
								"Service worker",
								"App-local store",
								"~0 ms, hardest to invalidate"
							]
						},
						{
							title: "Edge",
							items: [
								"CDN PoP",
								"Edge KV",
								"10–50 ms, purge API"
							]
						},
						{
							title: "Service",
							items: [
								"In-process (LRU)",
								"Per-instance, no coordination",
								"~100 ns, inconsistent across instances"
							]
						},
						{
							title: "Shared",
							items: [
								"Redis / Memcached",
								"Consistent across instances",
								"~0.5 ms, network hop"
							]
						},
						{
							title: "Data",
							items: [
								"Database buffer pool",
								"Materialised views",
								"Query plan cache"
							]
						}
					]
				},
				table: {
					headers: [
						"Layer",
						"Latency",
						"Shared?",
						"Invalidation"
					],
					rows: [
						[
							"Browser",
							"0 ms",
							"No — per user",
							"Nearly impossible; use content hashes in URLs"
						],
						[
							"CDN",
							"10–50 ms",
							"Yes — per region",
							"Purge API, seconds to propagate"
						],
						[
							"In-process",
							"~100 ns",
							"No — per instance",
							"Short TTL, or a pub/sub invalidation channel"
						],
						[
							"Redis",
							"0.3–1 ms",
							"Yes",
							"Delete the key; immediate and reliable"
						],
						[
							"DB buffer pool",
							"~0.1 ms",
							"Per node",
							"Automatic"
						]
					]
				}
			},
			{
				heading: "The four caching patterns",
				diagram: {
					kind: "sequence",
					caption: "Cache-aside: the pattern you should describe unless asked otherwise.",
					actors: [
						{
							id: "app",
							label: "Application"
						},
						{
							id: "c",
							label: "Cache",
							sub: "Redis"
						},
						{
							id: "db",
							label: "Database"
						}
					],
					messages: [
						{
							from: "app",
							to: "c",
							label: "GET user:42",
							kind: "call"
						},
						{
							from: "c",
							to: "app",
							label: "miss",
							kind: "return",
							tone: "warn"
						},
						{
							from: "app",
							to: "db",
							label: "SELECT * FROM users WHERE id = 42",
							kind: "call"
						},
						{
							from: "db",
							to: "app",
							label: "row",
							kind: "return"
						},
						{
							from: "app",
							to: "c",
							label: "SET user:42 <row> EX 300",
							kind: "call",
							note: "TTL bounds staleness even if invalidation is missed"
						},
						{
							from: "app",
							to: "app",
							label: "on write: UPDATE db, then DEL user:42",
							kind: "self",
							tone: "accent",
							note: "delete, do not update — avoids a stale write racing a read"
						}
					]
				},
				table: {
					headers: [
						"Pattern",
						"Read path",
						"Write path",
						"Trade-off"
					],
					rows: [
						[
							"Cache-aside (lazy)",
							"App checks cache, falls back to DB, populates",
							"Write DB, then delete the key",
							"Simple, resilient to cache loss; every miss pays full latency"
						],
						[
							"Read-through",
							"Cache itself loads on miss",
							"Same as cache-aside",
							"Cleaner app code; needs a cache library that supports it"
						],
						[
							"Write-through",
							"Always a hit for written keys",
							"Write cache and DB synchronously",
							"No stale data; every write pays cache + DB latency"
						],
						[
							"Write-behind",
							"Always a hit",
							"Write cache, flush to DB asynchronously",
							"Fastest writes; data loss window if the cache dies"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "On a write, delete the key rather than updating it. Two concurrent writers that both update the cache can land in the opposite order from their database writes, leaving the cache permanently wrong. Deleting makes the next reader repopulate from the truth."
				}
			},
			{
				heading: "The three failure modes, and their fixes",
				steps: [
					{
						title: "Stampede (thundering herd)",
						text: "A hot key expires and a thousand concurrent requests all miss and all hit the database at once. The database, sized for the cached load, falls over — and every retry makes it worse.",
						detail: "Fix: single-flight (one loader per key, others await it), or a probabilistic early refresh before expiry, or serve stale while one request refreshes."
					},
					{
						title: "Penetration",
						text: "Requests for keys that do not exist in the database either. Nothing is ever cached, so every request reaches storage — and this is trivially weaponised by an attacker generating random ids.",
						detail: "Fix: cache the negative result with a short TTL, and/or put a Bloom filter in front to answer 'definitely not present' without a lookup."
					},
					{
						title: "Avalanche",
						text: "A large set of keys written together expires together — after a deploy, a bulk import, or a cache restart — and the whole read load lands on the database in one second.",
						detail: "Fix: jitter every TTL by ±10%, warm the cache before taking traffic, and stagger any bulk population."
					}
				],
				code: {
					title: "Single-flight plus stale-while-revalidate",
					lang: "ts",
					source: `const inflight = new Map<string, Promise<Value>>();

async function get(key: string): Promise<Value> {
  const entry = await cache.get(key);

  if (entry && entry.freshUntil > Date.now()) return entry.value;      // fresh

  if (entry) {
    // stale but usable: return it now, refresh in the background.
    void refresh(key);
    return entry.value;
  }

  // cold miss: exactly one loader per key, everyone else waits on it.
  let p = inflight.get(key);
  if (!p) {
    p = load(key).finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

async function load(key: string) {
  const value = await db.fetch(key);
  if (value === null) {
    await cache.set(key, NULL_SENTINEL, { ttl: 30 });   // negative cache: penetration
    throw new NotFound(key);
  }
  const ttl = 300 * (0.9 + Math.random() * 0.2);        // ±10% jitter: avalanche
  await cache.set(key, value, { ttl, freshFor: ttl * 0.8 });
  return value;
}`
				}
			},
			{
				heading: "Eviction and sizing",
				bullets: [
					"LRU is the sane default. LFU resists scans; W-TinyLFU (Caffeine, Ristretto) beats both in most real workloads. Redis offers allkeys-lru and allkeys-lfu — pick deliberately.",
					"Size by bytes, not entry count, when values vary in size. A '100k entry' cache of variable JSON blobs is an unbounded memory commitment.",
					"Watch the eviction rate alongside the hit ratio. High hits with high evictions means thrashing — the working set does not fit, and adding memory has a large payoff.",
					"Set maxmemory-policy explicitly. A Redis with noeviction that fills up starts rejecting writes, which is an outage with a confusing error.",
					"Key naming matters operationally: prefix by entity and version (user:v2:42) so a schema change can be rolled out by bumping the prefix instead of purging."
				],
				math: [
					{
						label: "Effective latency",
						expr: "hit_ratio × 0.5ms + (1 − hit_ratio) × 20ms",
						result: "@95%: 1.5 ms",
						note: "At 95% hits the average is 1.5 ms; at 80% it is 4.4 ms — the last few points of hit ratio matter enormously."
					},
					{
						label: "Database load removed",
						expr: "10,000 rps × 95% cached",
						result: "500 rps to DB",
						note: "One replica instead of twenty. This is why caching is the first move."
					},
					{
						label: "Memory for 1M sessions",
						expr: "1,000,000 × 2 KB",
						result: "≈ 2 GB",
						note: "Plus Redis overhead of roughly 50–100 bytes per key."
					}
				]
			},
			{
				heading: "Consistency: what a cache actually costs you",
				body: ["A cache is a second copy of the truth, so every cached system is eventually consistent by construction. The design question is how large the staleness window is, and whether any user-visible invariant depends on it being zero."],
				bullets: [
					"Bound staleness with TTL even when you also invalidate. Invalidation paths get missed — a background job, an admin tool, a replica write — and TTL is the backstop that limits the blast radius to minutes.",
					"Read-your-writes: after a user's own write, read from the source (or write the new value into the cache immediately for that key) or they will see their change disappear.",
					"Never cache authorisation decisions for longer than you can tolerate a revoked permission still working. This is the one place where 'a few minutes stale' can be a security incident.",
					"In-process caches across N instances are N independent stale copies. Either keep their TTLs very short, or invalidate via a pub/sub channel — and accept that the channel can drop messages.",
					"Cache the computation, not just the row: an expensive aggregation cached for 60 seconds is usually a bigger win than caching the rows it reads."
				],
				callout: {
					kind: "interview",
					text: "'What is the maximum staleness this feature can tolerate?' is the question that turns a caching discussion from hand-waving into design. Prices and permissions want seconds; a follower count is fine at minutes."
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How do you invalidate a cache?",
						a: "Delete the key on write and rely on TTL as a backstop. I prefer delete over update because two concurrent writers can otherwise leave the cache holding the older value permanently. For derived or fan-out data — a feed, an aggregate — I would publish an invalidation event and let each consumer drop its keys, accepting that this is best-effort and that TTL is what actually bounds the damage."
					},
					{
						q: "A hot key gets 50,000 requests per second. What breaks?",
						a: "One Redis node owns that key, so it becomes the bottleneck, and if it expires you get a stampede onto the database. I would add a small in-process cache in front for a second or two, which collapses most of that traffic before it leaves the app server, and use single-flight plus early refresh so the key never actually expires under load. If it is still too hot, replicate the key across N variants and pick one at random."
					},
					{
						q: "What is your cache hit ratio target?",
						a: "It depends on the access distribution rather than on a universal number. For Zipfian traffic, 90-95% is normal and the remaining misses are the long tail, which caching cannot help much. What I would watch alongside it is the eviction rate and the miss latency — a 95% hit ratio with heavy eviction means the working set does not fit, and that is a different fix from a low hit ratio caused by poor key design."
					},
					{
						q: "The cache goes down entirely. What happens?",
						a: "With cache-aside, correctness is fine and performance falls off a cliff — full read load hits the database, which is usually not provisioned for it. That is a real outage mode, so I would rate limit or shed load at the edge, keep a small in-process cache as a second line of defence, and warm the cache before returning it to service rather than letting it cold-start under full traffic."
					}
				]
			}
		],
		related: [
			"/hld/cdn",
			"/lld/lru-cache",
			"/hld/consistency",
			"/hld/bloom-filters"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "lru-cache"
	},
	{
		slug: "cdn",
		title: "Content Delivery Networks",
		subtitle: "Move the bytes close to the user, and stop paying for them twice.",
		level: "foundational",
		minutes: 13,
		tags: [
			"performance",
			"networking",
			"edge"
		],
		summary: "A CDN is a globally distributed cache in front of your origin. It exists because the speed of light is a hard limit: a round trip from Sydney to Virginia is ~200ms no matter how fast your servers are. Serving from a nearby point of presence turns that into ~10ms, and simultaneously removes most of the bandwidth bill and load from your origin.",
		keyPoints: [
			"Latency is dominated by distance and round trips, not by server speed.",
			"Cache-Control is the contract between you and the CDN — get it wrong and you either cache nothing or cache a user's private data.",
			"Content-hashed filenames plus immutable caching is the strongest pattern for static assets.",
			"Purge is slow and eventually consistent; versioned URLs are instant and reliable.",
			"Modern CDNs cache dynamic responses too, with stale-while-revalidate and per-path rules."
		],
		sections: [
			{
				heading: "Why distance dominates",
				math: [
					{
						label: "Speed of light in fibre",
						expr: "~200,000 km/s (about 2/3 of c)",
						result: "5 µs/km"
					},
					{
						label: "Sydney → Virginia round trip",
						expr: "~16,000 km × 2 × 5 µs/km, plus routing overhead",
						result: "≈ 200 ms",
						note: "Nothing you do on the server changes this number."
					},
					{
						label: "TLS handshake cost",
						expr: "TCP (1 RTT) + TLS 1.3 (1 RTT) = 2 RTT before the first byte",
						result: "≈ 400 ms",
						note: "From Sydney to a US origin, before any application work happens."
					},
					{
						label: "Same request from a Sydney PoP",
						expr: "2 RTT × ~5 ms",
						result: "≈ 10 ms",
						note: "A 40× improvement from geography alone."
					},
					{
						label: "Origin bandwidth saved",
						expr: "10 TB/month of assets at a 95% offload rate",
						result: "500 GB from origin",
						note: "Often the larger financial win; egress is expensive."
					}
				],
				callout: {
					kind: "insight",
					text: "The CDN also terminates TLS at the edge and keeps warm, long-lived connections back to your origin — so even a genuine cache miss is faster than a direct connection, because the expensive handshakes happen nearby."
				}
			},
			{
				heading: "How a request resolves",
				diagram: {
					kind: "sequence",
					caption: "Miss path once, then hits for everyone else in that region.",
					actors: [
						{
							id: "u",
							label: "User",
							sub: "Sydney"
						},
						{
							id: "dns",
							label: "DNS",
							sub: "anycast / geo"
						},
						{
							id: "pop",
							label: "Edge PoP",
							sub: "Sydney"
						},
						{
							id: "shield",
							label: "Shield / mid-tier",
							sub: "regional cache"
						},
						{
							id: "org",
							label: "Origin",
							sub: "Virginia"
						}
					],
					messages: [
						{
							from: "u",
							to: "dns",
							label: "resolve cdn.example.com",
							kind: "call"
						},
						{
							from: "dns",
							to: "u",
							label: "nearest PoP address",
							kind: "return",
							note: "anycast or geo-DNS"
						},
						{
							from: "u",
							to: "pop",
							label: "GET /static/app.a3f9c1.js",
							kind: "call",
							note: "~5 ms away"
						},
						{
							from: "pop",
							to: "shield",
							label: "miss → fetch",
							kind: "call"
						},
						{
							from: "shield",
							to: "org",
							label: "miss → fetch",
							kind: "call",
							note: "shield collapses many PoP misses into one origin request"
						},
						{
							from: "org",
							to: "shield",
							label: "200 + Cache-Control: max-age=31536000, immutable",
							kind: "return"
						},
						{
							from: "shield",
							to: "pop",
							label: "store + forward",
							kind: "return"
						},
						{
							from: "pop",
							to: "u",
							label: "200 (and cached for everyone next)",
							kind: "return",
							tone: "ok"
						}
					]
				},
				bullets: [
					"A shield (origin shield / mid-tier cache) matters more than people expect: without it, 200 PoPs each independently miss and your origin sees 200 identical requests for every new asset.",
					"Anycast routes the user to the topologically nearest PoP by BGP; geo-DNS does it by resolver location. Anycast fails over faster; geo-DNS gives more control.",
					"Cache key: by default URL plus a few headers. Adding Vary: Accept-Encoding is correct; adding Vary: User-Agent fragments the cache into thousands of copies and destroys the hit ratio."
				]
			},
			{
				heading: "Cache-Control, precisely",
				code: {
					title: "The headers that decide everything",
					lang: "http",
					source: `# Static asset with a content hash in the filename — never changes.
Cache-Control: public, max-age=31536000, immutable
# "immutable" tells the browser not to even revalidate on reload.

# HTML shell — must be fresh, but tolerate a moment of staleness on error.
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400
# max-age=0    -> browsers revalidate
# s-maxage=60  -> the CDN may serve it for 60s
# swr=300      -> serve stale up to 5 min while refreshing in the background
# stale-if-error -> serve stale for a day if the origin is down

# Anything user-specific.
Cache-Control: private, no-store
# "private" = browser only, never a shared cache. "no-store" = do not write it down.

# Conditional revalidation (cheap: 304 with no body)
ETag: "a3f9c1"
Last-Modified: Tue, 09 Sep 2026 12:00:00 GMT`
				},
				table: {
					headers: [
						"Directive",
						"Means",
						"Watch out"
					],
					rows: [
						[
							"max-age=N",
							"Fresh for N seconds in any cache",
							"Applies to browsers too — you cannot recall it"
						],
						[
							"s-maxage=N",
							"Freshness for shared caches only",
							"Lets you cache at the CDN but not in browsers"
						],
						[
							"public / private",
							"May / may not be stored by shared caches",
							"Missing 'private' on a personalised page is a data leak"
						],
						[
							"no-cache",
							"Store, but revalidate before use",
							"Does not mean 'do not cache' — that is no-store"
						],
						[
							"immutable",
							"Do not revalidate even on reload",
							"Only safe with content-hashed URLs"
						],
						[
							"stale-while-revalidate",
							"Serve stale, refresh in background",
							"The single best directive for perceived performance"
						],
						[
							"stale-if-error",
							"Serve stale when the origin errors",
							"Free availability during an origin outage"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "The classic incident: a personalised page served with public, max-age=300, and the CDN hands user A's dashboard to user B. Default to private/no-store and opt specific paths into caching, rather than the reverse."
				}
			},
			{
				heading: "Invalidation: versioning beats purging",
				bullets: [
					"Content-hashed filenames (app.a3f9c1.js) make every deploy a new URL. Old URLs stay valid for clients still running the old page, and you never purge anything. This is the right answer for static assets.",
					"Purge is eventually consistent — seconds to minutes across a global network, and rate-limited by most providers. Fine for emergencies, wrong as a routine deploy mechanism.",
					"Surrogate keys / cache tags let you purge by relation: tag every page containing product 42 and purge that tag when the product changes. This is the practical answer for dynamic content.",
					"Never purge everything on deploy. A globally cold CDN sends your entire traffic to the origin at once, which is a self-inflicted stampede."
				],
				diagram: {
					kind: "compare",
					caption: "Two ways to make a change visible.",
					options: [{
						title: "Versioned URL",
						tone: "ok",
						good: [
							"Instant, atomic, no coordination",
							"Old clients keep working",
							"Cache can be immutable for a year"
						],
						bad: ["Requires a build step that rewrites references", "Not applicable to a stable URL like /api/products"],
						verdict: "All static assets. Always."
					}, {
						title: "Purge / invalidate",
						good: ["Works for stable URLs", "Tag-based purge can be surgical"],
						bad: [
							"Propagation takes seconds to minutes",
							"Rate-limited; a purge-all is dangerous",
							"Failure is silent — a PoP may keep serving stale"
						],
						verdict: "Dynamic content, keyed by tag; emergencies."
					}]
				}
			},
			{
				heading: "Beyond static files",
				bullets: [
					"Dynamic API responses: cache read-heavy public endpoints at the edge with short s-maxage plus stale-while-revalidate. A 5-second edge cache on a popular endpoint removes an enormous amount of origin load and is invisible to users.",
					"Video: segmented (HLS/DASH) so each segment is a separately cacheable file. This is why streaming works over ordinary HTTP CDNs.",
					"Large uploads and downloads: use the CDN in both directions — signed URLs let clients upload straight to storage without transiting your servers.",
					"Edge compute (Workers, Lambda@Edge) lets you personalise at the PoP — A/B assignment, auth checks, header rewriting — while keeping the underlying response cacheable.",
					"Security is part of the value: a CDN absorbs volumetric DDoS traffic, terminates TLS, and can run a WAF, all before traffic reaches your origin. Then lock the origin down so it only accepts connections from the CDN."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How do you handle a deploy with a CDN in front?",
						a: "Content-hash the assets so the new deploy references new URLs — nothing to purge, and clients mid-session keep working against the old files. The HTML shell is the only thing with a stable URL, so it gets a short s-maxage with stale-while-revalidate. I avoid purge-all on deploy, because a globally cold cache sends full traffic to the origin at once."
					},
					{
						q: "Can you cache authenticated content?",
						a: "Sometimes, carefully. The safe version is caching the shared skeleton publicly and fetching the personalised fragment separately, or using edge compute to assemble a cached base with a per-user piece. What I would not do is include the auth cookie in the cache key on a shared cache — the hit ratio collapses and one misconfiguration leaks another user's data."
					},
					{
						q: "Your CDN hit ratio is 60%. How do you diagnose it?",
						a: "Usually the cache key is too specific or the TTLs are too short. I would look for a Vary header on something high-cardinality like User-Agent, query strings that vary without changing the response (tracking parameters are the classic), and missing s-maxage on responses that could be shared. Then whether a shield tier is enabled, since without one every PoP misses independently."
					},
					{
						q: "The origin goes down. What do users see?",
						a: "With stale-if-error configured, cached content keeps serving from the edge for as long as you allow — often the difference between an invisible incident and a total outage. Uncached paths fail. That is a good argument for caching even short-lived responses at the edge: it buys availability, not just latency."
					}
				]
			}
		],
		related: [
			"/hld/caching",
			"/hld/dns",
			"/hld/load-balancing",
			"/examples/youtube"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var hldMessaging = [
	{
		slug: "message-queues",
		title: "Message Queues & Streams",
		subtitle: "Decouple producers from consumers, absorb bursts, and survive a consumer being down.",
		level: "intermediate",
		minutes: 17,
		tags: [
			"async",
			"messaging",
			"architecture"
		],
		summary: "A queue turns a synchronous call into a durable handoff. The producer's request finishes in milliseconds, the work happens later, and a slow or dead consumer becomes a growing backlog rather than a failed user request. What you buy with that is a long list of new questions: ordering, duplicates, retries, poison messages, and a backlog that can grow faster than you can drain it.",
		keyPoints: [
			"Use a queue when the work can be done later, must survive a crash, or would otherwise couple two services' availability.",
			"At-least-once delivery is the practical default, so every consumer must be idempotent.",
			"Ordering is only ever guaranteed within a partition or a single queue — never globally.",
			"A dead-letter queue is mandatory; without it a poison message blocks the pipeline forever.",
			"Log-based brokers (Kafka) retain and replay; queue brokers (SQS, RabbitMQ) delete on ack. Pick by whether you need history."
		],
		sections: [
			{
				heading: "What a queue is actually for",
				table: {
					headers: [
						"Reason",
						"Concretely",
						"Example"
					],
					rows: [
						[
							"Latency",
							"Return to the user before the slow work is done",
							"Sign-up returns; the welcome email is queued"
						],
						[
							"Burst absorption",
							"Accept at peak rate, process at sustainable rate",
							"Black Friday orders; workers drain steadily"
						],
						[
							"Decoupling availability",
							"Producer succeeds even if the consumer is down",
							"Analytics pipeline restart does not fail checkout"
						],
						[
							"Fan-out",
							"One event, many independent consumers",
							"Order placed → email, invoice, search index, fraud"
						],
						[
							"Retry with backoff",
							"Transient failures handled outside the request",
							"Payment provider blip retried for an hour"
						],
						[
							"Work distribution",
							"Many workers pull from one backlog",
							"Video transcoding across a worker fleet"
						],
						[
							"Ordering",
							"Serialise operations on one key",
							"All events for one account processed in order"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "A queue is not free. You gain a component to operate, eventual consistency for anything downstream of it, and the need for idempotency everywhere. If the work is fast, must be confirmed to the user, and the dependency is reliable, a direct call is simpler and better."
				}
			},
			{
				heading: "Queue versus log",
				diagram: {
					kind: "compare",
					caption: "The distinction that decides which technology you name.",
					options: [{
						title: "Queue broker",
						sub: "SQS, RabbitMQ, Azure Service Bus",
						good: [
							"Message deleted after ack — storage stays small",
							"Competing consumers scale trivially: add workers",
							"Per-message retry, delay and DLQ are built in",
							"Visibility timeout handles a crashed worker automatically"
						],
						bad: [
							"No replay — once acked, it is gone",
							"Ordering is per-queue at best (FIFO queues throttle throughput)",
							"Adding a new consumer type means a new queue and a fan-out"
						],
						verdict: "Task and job processing: emails, thumbnails, webhooks."
					}, {
						title: "Log broker",
						sub: "Kafka, Kinesis, Pulsar, Redpanda",
						tone: "ok",
						good: [
							"Retention independent of consumption — replay from any offset",
							"Multiple independent consumer groups on the same topic",
							"Ordered within a partition; enormous throughput",
							"Enables event sourcing, CDC and stream processing"
						],
						bad: [
							"Parallelism is capped by partition count",
							"Consumer group rebalances pause processing",
							"Per-message retry is awkward — a slow message blocks its partition",
							"More operational weight"
						],
						verdict: "Event streams, analytics, CDC, anything replayed or fanned out."
					}]
				},
				bullets: [
					"The tell for a log: 'we need to add a new consumer later and have it read history', or 'we need to reprocess after a bug'. Only retention gives you that.",
					"The tell for a queue: 'each message is a task, done once, and per-message retry matters'.",
					"Kafka's parallelism ceiling is its partition count — 12 partitions means at most 12 consumers in a group doing useful work. Choose partition count with growth in mind; increasing it later changes key-to-partition mapping."
				]
			},
			{
				heading: "Delivery semantics, honestly",
				table: {
					headers: [
						"Semantics",
						"How",
						"Reality"
					],
					rows: [
						[
							"At most once",
							"Ack before processing",
							"Fast, and you lose messages when a worker dies mid-task. Acceptable only for metrics-like data."
						],
						[
							"At least once",
							"Ack after processing",
							"The default everywhere. Duplicates happen — a worker can finish and die before acking."
						],
						[
							"Exactly once",
							"Transactional broker + idempotent consumer, or dedupe by key",
							"Achievable end-to-end only when the consumer's side effect is transactional or idempotent. Broker-level 'exactly once' does not cover your database write or an outbound email."
						]
					]
				},
				code: {
					title: "The consumer pattern that makes at-least-once safe",
					lang: "ts",
					source: `async function handle(msg: Message) {
  const key = msg.idempotencyKey ?? msg.id;

  // The dedupe record and the side effect must commit together, or
  // a crash between them reintroduces the duplicate you just prevented.
  await db.transaction(async (tx) => {
    const inserted = await tx\`
      INSERT INTO processed_messages (key, at)
      VALUES (\${key}, now())
      ON CONFLICT (key) DO NOTHING
      RETURNING key\`;

    if (inserted.length === 0) return;          // already handled: ack and move on

    await applyEffect(tx, msg);                  // the actual work, same transaction
  });

  await broker.ack(msg);
}

// If the side effect is NOT in a database — sending an email, calling a
// third party — pass an idempotency key to that system and let it dedupe.
// If it can do neither, accept that duplicates are possible and design the
// user-visible behaviour around it.`
				},
				callout: {
					kind: "interview",
					text: "'Exactly once delivery does not exist; exactly once processing does, if the consumer is idempotent' is the sentence to have ready. It is the difference between reciting a feature list and understanding the guarantee."
				}
			},
			{
				heading: "Ordering, and what it costs",
				body: ["Global ordering across a distributed queue would mean a single serialisation point, which is exactly what you gave up by distributing. What you get instead is ordering within a partition, and the design work is choosing a partition key such that anything that must be ordered shares one."],
				diagram: {
					kind: "flow",
					caption: "Partition by the entity whose events must stay ordered.",
					rows: [
						[{
							id: "p",
							label: "producer",
							sub: "key = account_id",
							tone: "accent"
						}, {
							id: "h",
							label: "hash(key) % partitions"
						}],
						[
							{
								id: "p0",
								label: "partition 0",
								sub: "acct 7, 19 — ordered",
								tone: "ok"
							},
							{
								id: "p1",
								label: "partition 1",
								sub: "acct 3, 22 — ordered",
								tone: "ok"
							},
							{
								id: "p2",
								label: "partition 2",
								sub: "acct 11 — ordered",
								tone: "ok"
							}
						],
						[{
							id: "c0",
							label: "consumer A",
							sub: "owns p0"
						}, {
							id: "c1",
							label: "consumer B",
							sub: "owns p1, p2"
						}]
					]
				},
				bullets: [
					"One consumer per partition within a group. That is what makes per-partition ordering meaningful, and it is also the parallelism cap.",
					"A hot key — one enormous account — fills one partition and cannot be spread without losing its ordering. Decide which matters more, per key.",
					"Retrying a failed message while continuing with later ones breaks ordering. If ordering is required, a failure must block the partition, which is why an ordered pipeline needs very fast poison-message detection.",
					"If you only need ordering between causally related events, a sequence number in the payload lets consumers detect and reorder, without constraining partitioning."
				]
			},
			{
				heading: "Failure handling: retries, DLQs and backlogs",
				steps: [
					{
						title: "Retry transient failures with backoff and jitter",
						text: "Exponential backoff — 1s, 2s, 4s, 8s — with randomised jitter so a downstream outage does not produce synchronised retry waves. Cap the attempts.",
						detail: "Distinguish transient (timeout, 503, connection reset) from permanent (validation error, 404). Never retry the latter."
					},
					{
						title: "Dead-letter after N attempts",
						text: "A message that cannot be processed goes to a dead-letter queue with its error and attempt history. Without a DLQ, a poison message is retried forever and can block everything behind it.",
						detail: "Alert on DLQ depth > 0. A DLQ nobody looks at is a silent data-loss channel."
					},
					{
						title: "Make the backlog visible",
						text: "Alert on queue depth and, more usefully, on consumer lag in time: 'we are 40 minutes behind' is actionable in a way that '2.3 million messages' is not.",
						detail: "Track oldest-message age. That is the number that maps to user impact."
					},
					{
						title: "Have a drain plan",
						text: "When you are hours behind, decide in advance: scale consumers, shed low-priority messages, or process newest-first and backfill the rest. Discovering this during an incident is expensive."
					},
					{
						title: "Protect the producer",
						text: "If the broker is down, does the producer fail, buffer, or drop? For critical writes, the transactional outbox pattern makes the message durable in the same transaction as the state change."
					}
				],
				code: {
					title: "Transactional outbox: no lost events when the process dies after commit",
					lang: "sql",
					source: `-- One local transaction, so the event exists exactly when the state change does.
BEGIN;
  INSERT INTO orders (id, customer_id, total) VALUES ($1, $2, $3);
  INSERT INTO outbox (id, topic, payload, created_at)
    VALUES (gen_random_uuid(), 'orders.placed', $4, now());
COMMIT;

-- A relay process publishes and marks sent. It may publish twice
-- (crash after publish, before update) — which is why consumers dedupe.
SELECT * FROM outbox WHERE sent_at IS NULL ORDER BY created_at LIMIT 100
  FOR UPDATE SKIP LOCKED;`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Kafka or SQS for this?",
						a: "SQS if each message is a task done once and I want per-message retry, delays and a DLQ without operating anything. Kafka if I need retention and replay, several independent consumer groups on the same stream, or ordering per key at high throughput. The question I ask is whether anyone will ever need to reprocess history — if yes, that alone points to a log."
					},
					{
						q: "How do you guarantee a message is processed exactly once?",
						a: "I do not guarantee delivery exactly once — I make processing idempotent. The consumer records the message key and performs its side effect in the same transaction, so a redelivery is a no-op. Where the side effect is external, like a payment or an email, I pass an idempotency key to that system. Broker-level exactly-once only covers the broker's own boundary, not my database or a third party."
					},
					{
						q: "Your consumer is 6 hours behind. What do you do?",
						a: "First find out why: is it a slow downstream dependency, a partition skew, or genuinely too little consumer capacity? Scaling consumers only helps up to the partition count, so if that is the cap I need more partitions or a different key. Then decide with the product owner whether to shed or reorder — for something like notifications, processing newest-first and dropping stale messages is often better than delivering six-hour-old alerts."
					},
					{
						q: "When would you not use a queue?",
						a: "When the user needs the result now and the operation is fast — adding a queue there just adds a hop and eventual consistency for no benefit. Also when the work is trivially retryable at the call site and the dependency is reliable. I would rather have a clear synchronous call with a timeout than an asynchronous pipeline whose failure modes nobody on the team understands."
					}
				]
			}
		],
		related: [
			"/hld/pub-sub",
			"/hld/idempotency",
			"/examples/distributed-mq",
			"/lld/command"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "pub-sub",
		title: "Publish / Subscribe",
		subtitle: "One event, many independent consumers, and none of them known to the publisher.",
		level: "intermediate",
		minutes: 13,
		tags: [
			"async",
			"messaging",
			"events"
		],
		summary: "Pub/sub is the observer pattern with a network in the middle. A publisher emits to a topic without knowing who listens; subscribers register interest and receive copies. It is how you add the fifth thing that must happen when an order is placed without touching the order service — and how you end up with a system nobody can trace.",
		keyPoints: [
			"Point-to-point queue: one message, one consumer. Pub/sub: one message, every subscriber gets a copy.",
			"Consumer groups combine both: fan-out across groups, competing consumers within a group.",
			"Publish facts (OrderPlaced), not commands (SendEmail) — the publisher must not know who reacts.",
			"Event schemas are a public contract; version them additively.",
			"The cost is traceability: no single place shows what happens when an event fires."
		],
		prerequisites: ["/hld/message-queues"],
		sections: [
			{
				heading: "The two delivery shapes",
				diagram: {
					kind: "system",
					caption: "Consumer groups give fan-out between groups and load balancing within one.",
					columns: [
						{
							title: "Publisher",
							nodes: [{
								id: "o",
								label: "Order service",
								sub: "publishes OrderPlaced",
								tone: "accent"
							}]
						},
						{
							title: "Topic",
							nodes: [{
								id: "t",
								label: "orders.placed",
								sub: "12 partitions, 7-day retention",
								tone: "accent"
							}]
						},
						{
							title: "Consumer groups",
							nodes: [
								{
									id: "g1",
									label: "group: email",
									sub: "3 workers share the partitions"
								},
								{
									id: "g2",
									label: "group: analytics",
									sub: "own offsets, own pace"
								},
								{
									id: "g3",
									label: "group: search-index",
									sub: "can replay from offset 0"
								},
								{
									id: "g4",
									label: "group: fraud",
									sub: "added later, no publisher change",
									tone: "ok"
								}
							]
						}
					]
				},
				table: {
					headers: [
						"",
						"Queue (point-to-point)",
						"Pub/sub (topic)"
					],
					rows: [
						[
							"Who receives a message",
							"Exactly one consumer",
							"Every subscriber gets a copy"
						],
						[
							"Adding a consumer",
							"Splits the existing work",
							"Adds a new independent stream"
						],
						[
							"Typical payload",
							"A task to perform",
							"A fact that occurred"
						],
						[
							"Coupling",
							"Producer knows work must be done",
							"Publisher knows nothing about subscribers"
						],
						[
							"Failure isolation",
							"Message retried by whoever took it",
							"Each subscriber retries independently"
						]
					]
				}
			},
			{
				heading: "Events, not commands",
				body: ["The discipline that makes pub/sub work is naming: publish what happened, in the past tense, with the data a reasonable consumer needs. The moment a topic is called 'send-welcome-email', the publisher has taken on knowledge of a subscriber, and you have built an RPC with extra latency."],
				code: {
					title: "Event design that survives contact with new consumers",
					lang: "json",
					source: `{
  "eventId": "evt_01J8XK...",        // unique — consumers dedupe on this
  "type": "orders.placed",
  "version": 2,                       // schema version, additive changes only
  "occurredAt": "2026-09-10T09:31:02.114Z",
  "traceId": "4bf92f3577b34da6",      // correlation across services
  "producer": "order-service@3.4.1",
  "data": {
    "orderId": "ord_9f3",
    "customerId": "cus_1",
    "totalCents": 7098,
    "currency": "USD",
    "lineCount": 2
  }
}

// Deliberately NOT included: the customer's email address.
// Consumers that need it look it up — otherwise every event carries every
// field any consumer might ever want, and the schema becomes untouchable.`
				},
				bullets: [
					"Include enough to act on, not everything. A fat event is a distributed join frozen at publish time, and it goes stale.",
					"Include an event id and a trace id. Without the first, consumers cannot dedupe; without the second, debugging a fan-out is guesswork.",
					"Version additively: add optional fields, never remove or repurpose one. A breaking change means a new topic or a new version field, plus a migration window where both are published.",
					"Publish after the state change is durable, not before. The outbox pattern is what makes that atomic."
				],
				callout: {
					kind: "warn",
					text: "The 'event-carried state transfer' pattern — putting the full entity in the event so consumers never call back — reduces coupling on the read path and increases it on the schema. It is a real trade-off, not a best practice; pick per topic and say why."
				}
			},
			{
				heading: "The costs nobody mentions in the first design review",
				bullets: [
					"Traceability: with six subscribers, no single file describes what happens when an order is placed. Distributed tracing and an event catalogue are not optional at that point.",
					"Ordering across topics is undefined. If OrderPlaced and PaymentCaptured are separate topics, a consumer may see the payment first — design for it or keep them in one partitioned topic.",
					"Fan-out amplification: one event, six subscribers, each writing to a database, is six times the write load. Broadcast is cheap; the reactions are not.",
					"Schema drift: a producer adds a field and a strict consumer rejects it. Use a schema registry with compatibility checks, or be permissive on read.",
					"Cascading retries: six subscribers all retrying a failing downstream turns one outage into six times the load on it.",
					"Testing gets harder: an integration test now spans a broker. Contract tests per event, plus a local broker, are the usual compromise."
				],
				diagram: {
					kind: "sequence",
					caption: "Independent failure and retry per subscriber — the property that makes it worth the cost.",
					actors: [
						{
							id: "p",
							label: "Publisher"
						},
						{
							id: "t",
							label: "Topic"
						},
						{
							id: "a",
							label: "Email consumer"
						},
						{
							id: "b",
							label: "Search consumer",
							sub: "downstream is down"
						}
					],
					messages: [
						{
							from: "p",
							to: "t",
							label: "publish OrderPlaced",
							kind: "call"
						},
						{
							from: "t",
							to: "a",
							label: "deliver",
							kind: "async"
						},
						{
							from: "t",
							to: "b",
							label: "deliver",
							kind: "async"
						},
						{
							from: "a",
							to: "t",
							label: "commit offset",
							kind: "return",
							tone: "ok"
						},
						{
							from: "b",
							to: "b",
							label: "index fails → retry with backoff",
							kind: "self",
							tone: "warn",
							note: "email is unaffected; offsets are per group"
						},
						{
							from: "b",
							to: "t",
							label: "commit offset after success (or send to DLQ)",
							kind: "return"
						}
					]
				}
			},
			{
				heading: "Choosing a technology",
				table: {
					headers: [
						"System",
						"Model",
						"Delivery",
						"Fits"
					],
					rows: [
						[
							"Kafka / Redpanda",
							"Partitioned log, consumer groups",
							"At least once, ordered per partition",
							"High-volume event streams, replay, CDC"
						],
						[
							"Redis Pub/Sub",
							"Fire and forget, no persistence",
							"At most once",
							"Live fan-out where loss is fine: presence, cache invalidation"
						],
						[
							"Redis Streams",
							"Log with consumer groups",
							"At least once",
							"Lightweight streaming without running Kafka"
						],
						[
							"SNS + SQS",
							"Topic fanning into queues",
							"At least once",
							"AWS-native fan-out with per-consumer DLQs"
						],
						[
							"Google Pub/Sub",
							"Managed topics and subscriptions",
							"At least once (exactly-once option)",
							"GCP-native, low operational burden"
						],
						[
							"NATS / JetStream",
							"Lightweight messaging",
							"Configurable",
							"Low latency, edge and IoT"
						],
						[
							"RabbitMQ (fanout exchange)",
							"Exchange to queues",
							"At least once",
							"Existing AMQP estate; rich routing rules"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "Redis Pub/Sub is fire-and-forget: a subscriber that is disconnected when the message is published simply never sees it. That is fine for cache invalidation and disastrous for order events — and it is one of the most common misuses in production systems."
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Pub/sub or a direct call?",
						a: "Direct call when the caller needs the result to complete its own work, or when there is exactly one consumer and there always will be. Pub/sub when several independent things must react, when I want them to fail and retry independently, and when the publisher genuinely should not know about them. The test I apply is: if I add a seventh reaction next quarter, do I have to modify and redeploy the publisher?"
					},
					{
						q: "How do you handle a subscriber that keeps failing?",
						a: "Retry with backoff, then dead-letter with the error and the payload, and alert on DLQ depth. Because offsets are per consumer group, that failure is contained — other subscribers are unaffected. What I watch for is a subscriber retrying hard against a failing downstream, which turns their outage into an overload, so I would put a circuit breaker in front and stop consuming while it is open."
					},
					{
						q: "How do you evolve an event schema?",
						a: "Additively, with a version field and a schema registry enforcing compatibility. New optional fields are safe; removing or repurposing a field is not, because I do not know who is reading it. For a genuine breaking change I publish both versions for a migration window, move consumers over, then retire the old topic — which is the same discipline as versioning a public API."
					},
					{
						q: "Two events for the same order arrive out of order. How do you handle it?",
						a: "Prevent it where I can by partitioning on order id so all of that order's events share a partition and stay ordered. Where events span topics I cannot prevent it, so consumers carry a version or sequence number per entity and either buffer briefly or discard events older than what they have applied. Making handlers commutative and idempotent where possible is the more robust answer than trying to enforce global order."
					}
				]
			}
		],
		related: [
			"/hld/message-queues",
			"/lld/observer",
			"/hld/idempotency",
			"/hld/websockets"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "websockets",
		title: "Real-Time Delivery: WebSockets, SSE and Polling",
		subtitle: "Getting a server-initiated update to a client, and holding a million connections.",
		level: "intermediate",
		minutes: 15,
		tags: [
			"networking",
			"real-time",
			"scalability"
		],
		summary: "HTTP is client-initiated, so pushing an update requires one of four workarounds: poll repeatedly, hold a request open, stream over one response, or open a bidirectional socket. Choosing between them is easy; the hard part is that a persistent connection makes your servers stateful, which changes routing, deploys and scaling.",
		keyPoints: [
			"Polling is fine below a few seconds of tolerance and costs nothing architecturally.",
			"SSE gives server→client streaming over plain HTTP with automatic reconnect — underused.",
			"WebSockets are for genuine bidirectional, low-latency traffic; everything else is a downgrade in complexity.",
			"Persistent connections make servers stateful: you need a registry of who is connected where, and a bus to reach them.",
			"Connection count, not request rate, becomes the scaling limit — memory per connection and file descriptors."
		],
		sections: [
			{
				heading: "The four options",
				table: {
					headers: [
						"Technique",
						"Direction",
						"Latency",
						"Cost",
						"Fits"
					],
					rows: [
						[
							"Short polling",
							"Client pulls",
							"Half the interval on average",
							"Wasted requests when nothing changed",
							"Tolerance of seconds; simplest possible thing"
						],
						[
							"Long polling",
							"Client pulls, server holds",
							"Near-instant",
							"One held connection per client anyway",
							"Legacy compatibility; works through anything"
						],
						[
							"Server-sent events",
							"Server → client only",
							"Near-instant",
							"One connection; plain HTTP, auto-reconnect built in",
							"Feeds, notifications, progress, live dashboards"
						],
						[
							"WebSocket",
							"Bidirectional",
							"Lowest",
							"Stateful servers; own protocol above the socket",
							"Chat, collaboration, games, trading"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "SSE is the answer more often than people reach for it: if updates only flow server→client, it gives you streaming over ordinary HTTP with reconnection and event ids for free, and no protocol of your own to design. Reach for WebSockets when the client genuinely needs to push too."
				}
			},
			{
				heading: "Polling is not automatically wrong",
				math: [
					{
						label: "Polling cost",
						expr: "100,000 clients ÷ 5 s interval",
						result: "20,000 rps",
						note: "Cheap requests, but a real load — and mostly '304 Not Modified'."
					},
					{
						label: "Same clients on WebSockets",
						expr: "100,000 concurrent connections × ~10 KB state",
						result: "≈ 1 GB + fd limits",
						note: "Roughly 10-50k connections per node, so ~4-10 nodes just for connections."
					},
					{
						label: "When polling wins",
						expr: "update frequency ≪ poll frequency, or tolerance > 5 s",
						result: "keep it simple",
						note: "A dashboard refreshed every 30 s does not need a socket."
					}
				],
				bullets: [
					"Conditional polling with ETag or If-Modified-Since makes the no-change case cheap — a 304 with no body.",
					"Jitter the interval, or every client that loaded at the same time polls in the same second forever.",
					"Adaptive polling — back off when nothing has changed, speed up after activity — captures most of the benefit of push with none of the statefulness."
				]
			},
			{
				heading: "The real problem: your servers are now stateful",
				body: ["A WebSocket pins a client to one server for the life of the connection. To deliver a message to user 42, some component must know which server holds user 42's connection — and that mapping changes constantly as clients connect, disconnect and reconnect."],
				diagram: {
					kind: "sequence",
					caption: "Message from one user to another connected to a different gateway.",
					actors: [
						{
							id: "a",
							label: "User A",
							sub: "→ gateway 1"
						},
						{
							id: "g1",
							label: "Gateway 1"
						},
						{
							id: "reg",
							label: "Presence registry",
							sub: "Redis: user → gateway"
						},
						{
							id: "bus",
							label: "Message bus",
							sub: "topic per gateway"
						},
						{
							id: "g2",
							label: "Gateway 2"
						}
					],
					messages: [
						{
							from: "a",
							to: "g1",
							label: "send({to: B, text})",
							kind: "call"
						},
						{
							from: "g1",
							to: "g1",
							label: "persist message",
							kind: "self",
							note: "durable before delivery — the socket is not a database"
						},
						{
							from: "g1",
							to: "reg",
							label: "where is B?",
							kind: "call"
						},
						{
							from: "reg",
							to: "g1",
							label: "gateway-2",
							kind: "return"
						},
						{
							from: "g1",
							to: "bus",
							label: "publish to gateway-2 channel",
							kind: "async"
						},
						{
							from: "bus",
							to: "g2",
							label: "deliver",
							kind: "async"
						},
						{
							from: "g2",
							to: "g2",
							label: "push over B's socket",
							kind: "self",
							tone: "ok",
							note: "if B is offline: push notification + fetch on next open"
						}
					]
				},
				bullets: [
					"Presence registry: a short-TTL key per connected user, refreshed by heartbeat, so a crashed gateway's entries expire rather than pointing at nothing.",
					"Never treat the socket as delivery confirmation. Persist first, then push, and let the client acknowledge — otherwise a message vanishes when a connection drops mid-send.",
					"Deploys disconnect everyone. Stagger restarts, and make the client reconnect with backoff and jitter or your fleet gets a synchronised reconnect storm.",
					"Reconnect must be resumable: the client sends the last event id it saw, and the server replays what it missed. Without this, every network blip loses messages.",
					"Load balancers need long idle timeouts and sticky routing for the connection's lifetime; many defaults kill idle connections at 60 seconds, which is why heartbeats exist."
				]
			},
			{
				heading: "Scaling connections",
				steps: [
					{
						title: "Size per connection",
						text: "Budget memory per connection — socket buffers plus your per-user state. A few kilobytes each means 100k connections is a few hundred megabytes plus buffers, and the practical ceiling is usually 10k-100k per node.",
						detail: "Raise file descriptor limits and tune TCP buffers; the defaults are for a different workload."
					},
					{
						title: "Separate the gateway from the logic",
						text: "A thin connection-holding tier that does nothing but manage sockets, and stateless services behind it. Now business logic deploys without dropping connections, and you scale the two independently."
					},
					{
						title: "Heartbeat, both ways",
						text: "Ping/pong every 20-30 seconds detects dead connections that TCP has not noticed and keeps intermediaries from closing an idle socket. Track missed pongs and close deliberately."
					},
					{
						title: "Fan-out strategy",
						text: "For broadcast to a room, decide whether the gateway subscribes per room or filters locally. Per-room subscriptions scale better for many small rooms; local filtering is simpler for a few large ones."
					},
					{
						title: "Backpressure",
						text: "A slow client whose socket buffer fills must not consume unbounded server memory. Drop, coalesce, or disconnect — and make that policy explicit rather than discovering it as an OOM."
					}
				],
				code: {
					title: "Resumable reconnect — the detail that makes real-time reliable",
					lang: "ts",
					source: `// Server: every pushed event carries a monotonic id per stream.
socket.send(JSON.stringify({ id: 10482, type: "message", data }));

// Client: remember the last id, and send it when reconnecting.
let lastEventId = 0;
function connect() {
  const ws = new WebSocket(\`\${url}?since=\${lastEventId}\`);
  ws.onmessage = (e) => { const m = JSON.parse(e.data); lastEventId = m.id; apply(m); };
  ws.onclose = () => setTimeout(connect, backoffWithJitter(attempt++));
}

// Server on connect: replay everything after "since" from durable storage,
// then switch to live push. Without the replay, every blip loses messages —
// and users experience that as "the app is unreliable", not "the network is".

// SSE gives you this for free: the browser sends Last-Event-ID automatically.`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "WebSockets or SSE for this feature?",
						a: "If updates only flow from server to client — notifications, a live feed, job progress — SSE, because it is plain HTTP, works through proxies, and gives automatic reconnect with Last-Event-ID. WebSockets when the client also sends frequently and latency matters, like chat or collaborative editing. I would not choose WebSockets just because they sound more capable; the statefulness is a real ongoing cost."
					},
					{
						q: "How do you deliver a message to a specific user across a fleet?",
						a: "A presence registry maps user to the gateway holding their connection, with a short TTL refreshed by heartbeat so crashed gateways expire. The sender persists the message, looks up the gateway, and publishes to that gateway's channel on a bus. If the user is offline, the message stays durable and is delivered on their next connect, plus a push notification. The socket is a delivery channel, never the storage."
					},
					{
						q: "What happens on deploy?",
						a: "Every connection drops, so this is a design consideration rather than an afterthought. I would keep the socket tier thin so it deploys rarely, restart nodes in a staggered rollout, and have clients reconnect with exponential backoff and jitter — otherwise 100,000 clients reconnect in the same second and the new instances fall over. Resumable reconnect means users see a brief pause rather than lost messages."
					},
					{
						q: "A million concurrent connections — what breaks first?",
						a: "Memory per connection and file descriptors on the gateway nodes, which sets the number of nodes. After that, the fan-out path: a broadcast to a large room multiplies one event into a million sends, so the bus and the per-gateway subscription model matter more than the socket handling. And presence lookups become a very hot key space, so I would shard the registry by user id."
					}
				]
			}
		],
		related: [
			"/hld/pub-sub",
			"/examples/chat",
			"/hld/load-balancing",
			"/examples/nearby-friends"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "rest-vs-graphql",
		title: "REST, GraphQL and gRPC",
		subtitle: "Three API styles, three different problems they were built to solve.",
		level: "intermediate",
		minutes: 14,
		tags: [
			"api-design",
			"protocols",
			"trade-offs"
		],
		summary: "REST is resources over HTTP and gets you caching, tooling and universal support. GraphQL lets the client specify exactly what it needs, which fixes over-fetching for diverse clients and costs you HTTP caching and predictable server cost. gRPC is fast, typed and binary, which makes it excellent between services and awkward from a browser.",
		keyPoints: [
			"REST's biggest advantage is HTTP caching — CDNs, browsers and proxies all understand it for free.",
			"GraphQL's biggest advantage is one round trip for exactly the data a screen needs.",
			"GraphQL's biggest cost is that query complexity is client-controlled — you must bound it.",
			"gRPC wins on internal service-to-service: binary, typed contracts, streaming, code generation.",
			"These coexist: gRPC internally, REST or GraphQL at the edge, is a very common shape."
		],
		sections: [
			{
				heading: "Side by side",
				diagram: {
					kind: "compare",
					caption: "Pick by client diversity and by where the API lives.",
					options: [
						{
							title: "REST",
							sub: "resources + HTTP verbs",
							good: [
								"HTTP caching works everywhere — CDN, browser, proxy",
								"Universally understood; every tool speaks it",
								"Simple to debug with curl and browser devtools",
								"Status codes and idempotency semantics are well-defined"
							],
							bad: [
								"Over- and under-fetching for rich clients",
								"N+1 round trips for nested data",
								"Versioning tends to sprawl (/v1, /v2)"
							],
							verdict: "Public APIs, cacheable reads, anything with unknown consumers."
						},
						{
							title: "GraphQL",
							sub: "one endpoint, client-specified query",
							good: [
								"Exactly the fields the screen needs, in one round trip",
								"Strong schema and introspection; excellent client tooling",
								"Additive evolution with deprecation instead of versioning"
							],
							bad: [
								"HTTP caching is largely lost (POST to one endpoint)",
								"Client controls server cost — needs depth and complexity limits",
								"N+1 on the server unless you use dataloaders",
								"Harder to reason about performance and to rate limit fairly"
							],
							verdict: "Many diverse clients, deeply nested data, fast-moving front ends."
						},
						{
							title: "gRPC",
							sub: "protobuf over HTTP/2",
							good: [
								"Binary and compact; noticeably lower latency and CPU",
								"Generated, typed clients in every language",
								"Bidirectional streaming as a first-class feature",
								"Schema is enforced, not documented"
							],
							bad: [
								"Not natively usable from a browser (needs grpc-web + a proxy)",
								"Harder to inspect: not human-readable on the wire",
								"L4 load balancing skews badly with long-lived HTTP/2 connections"
							],
							verdict: "Service-to-service inside your own network."
						}
					]
				}
			},
			{
				heading: "The over-fetching problem GraphQL was built for",
				code: [
					{
						title: "REST — three round trips for one screen",
						lang: "http",
						source: `GET /users/42                 # 40 fields; the screen needs 3
GET /users/42/orders?limit=5  # each order has 30 fields; needs 4
GET /products?ids=a,b,c       # then look up each product

# Mobile on a 200ms RTT: 600ms before render, and most bytes unused.
# The usual REST fixes: a purpose-built /screens/profile endpoint
# (fast, but a new endpoint per screen), or ?fields= sparse fieldsets.`
					},
					{
						title: "GraphQL — one round trip, exactly the fields",
						lang: "graphql",
						source: `query ProfileScreen($id: ID!) {
  user(id: $id) {
    name
    avatarUrl
    orders(last: 5) {
      id
      totalCents
      placedAt
      items { product { title thumbnailUrl } }
    }
  }
}

# One request, ~200ms, only the fields listed.
# The cost: the server must resolve this efficiently, and a malicious
# client can ask for orders { items { product { relatedProducts { ... }}}}.`
					},
					{
						title: "Bounding the cost — mandatory in production",
						lang: "ts",
						source: `const server = new ApolloServer({
  schema,
  validationRules: [
    depthLimit(8),                       // reject deeply nested queries
    costAnalysis({ maximumCost: 1000 }), // per-field cost, rejected before execution
  ],
  plugins: [persistedQueries()],         // only allow queries you shipped
});

// And a dataloader per request, or every nested field is its own query:
const productLoader = new DataLoader(async (ids) => {
  const rows = await db.products.whereIn("id", ids);   // one query for N ids
  return ids.map((id) => rows.find((r) => r.id === id) ?? null);
});`
					}
				],
				callout: {
					kind: "warn",
					text: "Persisted queries are the pragmatic answer to both problems at once: clients send a hash of a query you approved at build time, so cost is bounded, the request is small, and you can even make it a GET and cache it."
				}
			},
			{
				heading: "REST done well",
				bullets: [
					"Resources as nouns, verbs from HTTP: GET /orders/42, POST /orders, PATCH /orders/42. Avoid /getOrder and /createOrderV2.",
					"Use status codes precisely: 400 for malformed, 404 for missing, 409 for conflict, 422 for semantically invalid, 429 for rate limited, 503 with Retry-After for overload.",
					"Make POST idempotent with an Idempotency-Key header — this is what payment APIs do, and it is the single most valuable REST convention for reliability.",
					"Cursor pagination, not offset: offset drifts as rows are inserted and gets slower the deeper you go.",
					"Version at the URL or with a header, but version something. Additive-only changes with deprecation headers keep the version count low.",
					"Return errors in a consistent shape with a machine-readable code, not just a message string clients will regex."
				],
				code: {
					title: "The conventions worth insisting on",
					lang: "http",
					source: `POST /v1/orders
Idempotency-Key: 8f14e45f-ea0f-4f0b-9b3e-2c0f4b1a9d21
Content-Type: application/json

201 Created
Location: /v1/orders/ord_9f3
{ "id": "ord_9f3", "status": "created" }

# Retrying the same Idempotency-Key returns the same 201 and the same id —
# never a second order.

GET /v1/orders?limit=20&cursor=eyJpZCI6...
200 OK
Cache-Control: private, max-age=30
{
  "data": [ ... ],
  "nextCursor": "eyJpZCI6Im9yZF84YTIifQ"     # null when exhausted
}

429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0`
				}
			},
			{
				heading: "Where each belongs in one architecture",
				diagram: {
					kind: "layers",
					caption: "The common shape: typed and binary inside, cacheable and flexible at the edge.",
					layers: [
						{
							title: "Browsers and mobile",
							items: [
								"REST for cacheable public reads",
								"GraphQL for screen-shaped queries",
								"SSE / WebSocket for live updates"
							]
						},
						{
							title: "Edge",
							items: [
								"API gateway",
								"auth, rate limiting",
								"CDN cache for REST GETs"
							]
						},
						{
							title: "Service to service",
							items: ["gRPC: typed, binary, streaming", "async events over Kafka for anything not request-scoped"]
						},
						{
							title: "Third parties",
							items: [
								"REST with webhooks",
								"Idempotency-Key",
								"signed payloads"
							]
						}
					]
				},
				bullets: [
					"Public APIs consumed by people you will never meet should be REST: the tooling, the documentation conventions and the debuggability matter more than efficiency.",
					"Webhooks are the inverse API and deserve the same care: signed payloads, retries with backoff, an id for deduplication, and a replay endpoint.",
					"gRPC through an L4 load balancer pins all of a client's requests to one backend, because HTTP/2 multiplexes over one connection. Use an L7 proxy or client-side load balancing.",
					"GraphQL federation lets several teams own parts of one schema — powerful, and a substantial operational commitment. Do not adopt it for two services."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Would you use GraphQL here?",
						a: "It depends on client diversity. With one web client whose queries I control, REST plus a couple of purpose-built endpoints is simpler and keeps HTTP caching. With several clients — web, iOS, Android, a partner integration — each wanting different shapes of the same data, GraphQL stops the endpoint proliferation and the over-fetching. What I would insist on either way is depth and cost limits plus persisted queries, because otherwise the client controls my server's cost."
					},
					{
						q: "How do you cache GraphQL?",
						a: "Not with HTTP caching, mostly — everything is a POST to one URL. So caching moves inward: a per-request dataloader to collapse duplicate lookups, a shared cache at the resolver or entity level, and client-side normalised caches like Apollo's. Persisted queries sent as GETs restore some HTTP and CDN caching for public data, which is the one lever that gets edge caching back."
					},
					{
						q: "Why not gRPC for the public API?",
						a: "Browsers cannot speak it natively — you need grpc-web and a translating proxy — and the ecosystem for third-party consumers is much weaker: no curl-and-read debugging, no browser devtools, fewer people who have used it. Inside my own network those costs vanish and the benefits are real, so the common answer is gRPC internally and REST or GraphQL at the edge."
					},
					{
						q: "How do you version an API?",
						a: "Prefer additive change and deprecation over versioning: new optional fields, new endpoints, and a deprecation header with a sunset date on the old ones. When a breaking change is unavoidable, a major version in the path is the clearest option for REST, with both versions running through a migration window. For GraphQL the schema itself supports deprecation directives, which is one of its genuine advantages — but only if you actually retire deprecated fields."
					}
				]
			}
		],
		related: [
			"/hld/api-gateway",
			"/hld/idempotency",
			"/hld/caching",
			"/hld/websockets"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var hldPlatform = [
	{
		slug: "api-gateway",
		title: "API Gateway",
		subtitle: "One entry point for cross-cutting concerns — and one place to be careful.",
		level: "intermediate",
		minutes: 14,
		tags: [
			"architecture",
			"api-design",
			"edge"
		],
		summary: "An API gateway sits between clients and your services and handles what every service would otherwise implement separately: TLS, authentication, rate limiting, routing, and request logging. That consolidation is genuinely valuable and quietly dangerous — it is a single point of failure and a magnet for business logic that does not belong there.",
		keyPoints: [
			"Gateways own cross-cutting concerns: TLS, authn, rate limiting, routing, observability.",
			"Authentication belongs at the gateway; authorization on the object usually belongs in the service.",
			"Keep it thin. Business logic in the gateway couples every service to a shared deployment.",
			"It must be redundant and horizontally scaled, or it is your availability ceiling.",
			"Backend-for-frontend is a separate gateway per client type, and often better than one universal API."
		],
		sections: [
			{
				heading: "What belongs there, and what does not",
				diagram: {
					kind: "compare",
					caption: "The line to hold in a design review.",
					options: [{
						title: "Belongs in the gateway",
						tone: "ok",
						good: [
							"TLS termination and certificate management",
							"Authentication: verify the token, attach identity",
							"Rate limiting and quota enforcement per client",
							"Routing by path or host; API versioning",
							"Request/response logging, tracing headers, correlation ids",
							"Request size limits, timeouts, basic schema validation",
							"CORS, compression, header normalisation"
						],
						bad: [],
						verdict: "Anything every service would otherwise duplicate identically."
					}, {
						title: "Does not belong there",
						tone: "warn",
						good: [],
						bad: [
							"Business rules — 'orders over $500 need approval'",
							"Data transformation specific to one service",
							"Object-level authorization needing domain state",
							"Orchestrating multi-service workflows",
							"Caching that requires knowing domain invalidation rules"
						],
						verdict: "Anything that changes when one service's domain changes."
					}]
				},
				callout: {
					kind: "warn",
					text: "The failure mode to name: business logic accumulates in the gateway until every team must coordinate on its deployment. It becomes a shared bottleneck with no owner — the same problem an enterprise service bus had, wearing newer clothes."
				}
			},
			{
				heading: "The request path",
				diagram: {
					kind: "sequence",
					caption: "Order matters: reject cheaply before doing expensive work.",
					actors: [
						{
							id: "c",
							label: "Client"
						},
						{
							id: "g",
							label: "Gateway"
						},
						{
							id: "a",
							label: "Auth",
							sub: "JWKS cache"
						},
						{
							id: "r",
							label: "Rate limiter",
							sub: "Redis"
						},
						{
							id: "s",
							label: "Service"
						}
					],
					messages: [
						{
							from: "c",
							to: "g",
							label: "POST /v1/orders + Bearer token",
							kind: "call"
						},
						{
							from: "g",
							to: "g",
							label: "TLS terminate · size limit · CORS",
							kind: "self",
							note: "cheapest checks first"
						},
						{
							from: "g",
							to: "a",
							label: "verify signature (public key cached)",
							kind: "call",
							note: "local verification — no network call in the common case"
						},
						{
							from: "a",
							to: "g",
							label: "claims: sub, scopes, tenant",
							kind: "return",
							tone: "ok"
						},
						{
							from: "g",
							to: "r",
							label: "allow(tenant, /v1/orders)?",
							kind: "call"
						},
						{
							from: "r",
							to: "g",
							label: "ok, remaining 842",
							kind: "return"
						},
						{
							from: "g",
							to: "s",
							label: "forward + X-Request-Id, X-User-Id, traceparent",
							kind: "call",
							note: "identity is trusted here because the network is not reachable from outside"
						},
						{
							from: "s",
							to: "g",
							label: "201",
							kind: "return"
						},
						{
							from: "g",
							to: "c",
							label: "201 + RateLimit-* headers",
							kind: "return",
							tone: "ok"
						}
					]
				},
				bullets: [
					"Verify JWTs locally against cached public keys (JWKS) rather than calling an auth service per request — that call would be on every request's critical path.",
					"Strip client-supplied identity headers at the edge. If a client can send X-User-Id and the gateway forwards it, you have an authentication bypass.",
					"Services should still verify identity if they are reachable from anywhere but the gateway. 'The network protects us' is only true if it actually does.",
					"Propagate a request id and W3C traceparent from the very first hop, or distributed traces start halfway through the request."
				]
			},
			{
				heading: "Gateway, load balancer, service mesh",
				table: {
					headers: [
						"",
						"Traffic",
						"Concerns",
						"Where it runs"
					],
					rows: [
						[
							"Load balancer",
							"North-south, layer 4/7",
							"Distribution, health checks, TLS",
							"In front of a pool of identical instances"
						],
						[
							"API gateway",
							"North-south, layer 7",
							"Auth, rate limiting, routing, versioning, quotas",
							"Between clients and many different services"
						],
						[
							"Service mesh",
							"East-west, between services",
							"mTLS, retries, circuit breaking, traffic shifting, telemetry",
							"A sidecar next to every service instance"
						],
						[
							"BFF",
							"North-south, per client type",
							"Aggregating and shaping responses for one UI",
							"One per client: web, iOS, partner"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "They compose rather than compete: a load balancer in front of gateway instances, gateways handling client traffic, and a mesh handling service-to-service. Naming which layer owns which concern is a strong signal in an architecture discussion."
				}
			},
			{
				heading: "Backend-for-frontend",
				body: ["One universal API for a web app, an iOS app and a partner integration ends up serving none of them well: the mobile client over-fetches, the web client makes six calls, and the partner sees fields meant for internal use. A BFF is a thin gateway per client type that aggregates and shapes exactly what that client needs."],
				bullets: [
					"Owned by the client team, so the shape of the API changes at the pace of the UI rather than at the pace of a shared platform.",
					"It aggregates: one BFF call becomes three parallel service calls, cutting mobile round trips from six to one.",
					"The risk is duplication across BFFs and a temptation to put business rules in them. Keep them shaping and aggregating, not deciding.",
					"GraphQL is one way to get the same benefit without a BFF per client — the client specifies the shape instead of the BFF encoding it."
				],
				code: {
					title: "Aggregation with independent failure",
					lang: "ts",
					source: `// One client call → parallel service calls, with per-dependency degradation.
app.get("/bff/home", async (req, res) => {
  const deadline = Date.now() + 800;

  const [user, orders, recs] = await Promise.all([
    users.get(req.userId, { deadline }),                       // critical
    orders.recent(req.userId, 5, { deadline }).catch(() => []), // optional
    recs.forUser(req.userId, { timeoutMs: 150 })
        .catch(() => staticPopular()),                          // optional + fallback
  ]);

  res.json({
    name: user.name,                       // exactly the fields this screen renders
    avatar: user.avatarUrl,
    recentOrders: orders.map(toCard),
    recommendations: recs.slice(0, 6),
  });
});`
				}
			},
			{
				heading: "Operating it",
				bullets: [
					"Run at least two instances behind a load balancer across availability zones. A single gateway instance makes every service's availability equal to one process's.",
					"Keep it stateless: rate-limit counters in Redis, config from a control plane, no per-connection memory that matters.",
					"Config changes are deployments in disguise. A bad route rule affects every service at once, so treat gateway config with the same review and canary process as code.",
					"Watch p99 added latency as a specific metric. A gateway should add single-digit milliseconds; when it does not, something in the chain is doing a network call it should not.",
					"Have a bypass plan. For a genuinely critical path, knowing how to route around a broken gateway is worth designing before you need it."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "What would you put in the gateway?",
						a: "TLS termination, authentication, rate limiting, routing and the observability headers — the things every service would otherwise implement identically and slightly differently. What I keep out is anything that changes when a domain changes: business rules, object-level authorization that needs the entity, and multi-service orchestration. The test is whether a change to one service's logic would require deploying the gateway."
					},
					{
						q: "Isn't the gateway a single point of failure?",
						a: "It is, which is why it runs as multiple stateless instances across availability zones behind a load balancer, and why its config changes get the same canary treatment as code. The residual risk is that a bad config affects everything at once — that is the real single point of failure, more than the process is. For very critical paths I would want a documented bypass route."
					},
					{
						q: "Where does authorization happen?",
						a: "Authentication at the gateway — verify the token, attach the identity — because it is identical for every service. Coarse scope checks can also live there. But object-level authorization, like whether this user may cancel this particular order, needs domain state, so it belongs in the service that owns that state. Splitting it this way keeps the gateway free of domain knowledge."
					},
					{
						q: "Would you build one or use an off-the-shelf gateway?",
						a: "Use one — Envoy, Kong, or a cloud gateway — because the hard parts are protocol edge cases, connection handling and TLS, all of which are solved. What I would write myself is a thin BFF layer for aggregation, which is application code rather than infrastructure and genuinely benefits from being owned by the client team."
					}
				]
			}
		],
		related: [
			"/hld/load-balancing",
			"/hld/rate-limiting",
			"/hld/rest-vs-graphql",
			"/hld/observability"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "observability",
		title: "Observability: Metrics, Logs and Traces",
		subtitle: "Being able to answer questions you did not think to ask in advance.",
		level: "intermediate",
		minutes: 15,
		tags: [
			"operations",
			"monitoring",
			"reliability"
		],
		summary: "Monitoring tells you that something is wrong; observability lets you work out why without shipping new code. The three signals do different jobs — metrics show you the shape of the problem, traces show you where it lives, logs tell you what happened — and knowing which to reach for is most of the skill.",
		keyPoints: [
			"Metrics are cheap and aggregate; logs are expensive and specific; traces show causality across services.",
			"Percentiles, never averages: the average hides exactly the users who are suffering.",
			"Alert on symptoms users feel (latency, errors, saturation), not on causes like CPU.",
			"High cardinality is what makes debugging possible and what makes metrics expensive — put it in traces and logs.",
			"Correlate everything with a trace id, or you are searching three systems by hand."
		],
		sections: [
			{
				heading: "The three signals",
				table: {
					headers: [
						"Signal",
						"Answers",
						"Cost",
						"Cardinality"
					],
					rows: [
						[
							"Metrics",
							"Is something wrong? How bad? Since when?",
							"Very cheap — pre-aggregated numbers",
							"Low — every label combination is a new time series"
						],
						[
							"Traces",
							"Where in the request path is the time going?",
							"Moderate — sampled, one span per operation",
							"High — per request, with attributes"
						],
						[
							"Logs",
							"What exactly happened to this one request?",
							"Expensive at volume — every line stored and indexed",
							"Unlimited"
						],
						[
							"Profiles",
							"Which code is burning the CPU or allocating?",
							"Low with continuous sampling",
							"N/A"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "The workflow that works: a metric alerts you and shows the shape, a trace narrows it to one service or dependency, and logs for that trace id tell you what happened. Skipping straight to logs at scale is how debugging takes hours instead of minutes."
				}
			},
			{
				heading: "Metrics that are worth having",
				bullets: [
					"The RED method for request-driven services: Rate (requests/sec), Errors (failures/sec), Duration (latency distribution). Three metrics per endpoint answers most questions.",
					"The USE method for resources: Utilisation, Saturation, Errors. Queue depth and saturation predict trouble before utilisation does.",
					"The four golden signals (latency, traffic, errors, saturation) are the same idea from the SRE book — use whichever vocabulary the room uses.",
					"Record latency as a histogram, not a gauge or average. You need p50, p95, p99 and p99.9, and you cannot compute a percentile from an average after the fact.",
					"Separate success and error latency. Fast failures can drag a p99 down and make an outage look like a performance improvement.",
					"Keep label cardinality bounded: user id or request id as a metric label will multiply your time series into millions. That detail belongs in a trace."
				],
				math: [
					{
						label: "Why averages lie",
						expr: "99 requests at 10 ms + 1 request at 10 s",
						result: "avg 110 ms, p99 10 s",
						note: "The average looks acceptable. One in a hundred users waited ten seconds."
					},
					{
						label: "Tail amplification",
						expr: "a page making 20 parallel calls, each p99 = 100 ms",
						result: "≈ 87% of pages hit at least one",
						note: "1 − 0.99²⁰. This is why p99 of a dependency is a p50 problem for the page."
					},
					{
						label: "Cardinality cost",
						expr: "endpoint (50) × status (5) × region (3) × user_id (1 M)",
						result: "750 M series",
						note: "The first three are fine; the last one is why your metrics bill exploded."
					}
				]
			},
			{
				heading: "Tracing: the signal most teams under-invest in",
				diagram: {
					kind: "sequence",
					caption: "One trace, several spans — the waterfall shows where 800 ms went.",
					actors: [
						{
							id: "g",
							label: "Gateway",
							sub: "span: 840ms"
						},
						{
							id: "o",
							label: "Order svc",
							sub: "span: 820ms"
						},
						{
							id: "i",
							label: "Inventory",
							sub: "span: 30ms"
						},
						{
							id: "p",
							label: "Payments",
							sub: "span: 760ms"
						}
					],
					messages: [
						{
							from: "g",
							to: "o",
							label: "POST /orders  [traceparent: 00-4bf92f...]",
							kind: "call"
						},
						{
							from: "o",
							to: "i",
							label: "check stock — 30ms",
							kind: "call",
							tone: "ok"
						},
						{
							from: "i",
							to: "o",
							label: "ok",
							kind: "return"
						},
						{
							from: "o",
							to: "p",
							label: "capture — 760ms",
							kind: "call",
							tone: "bad",
							note: "here is the latency, and it is retrying twice"
						},
						{
							from: "p",
							to: "o",
							label: "ok (attempt 3)",
							kind: "return",
							tone: "warn"
						},
						{
							from: "o",
							to: "g",
							label: "201",
							kind: "return"
						}
					]
				},
				bullets: [
					"Context propagation is the whole game: W3C traceparent flows through every hop, including queues, or the trace ends where the async boundary begins.",
					"Sample intelligently: head-based sampling at a small percentage for normal traffic, plus tail-based sampling that keeps every trace containing an error or exceeding a latency threshold.",
					"Attach high-cardinality attributes to spans — user id, tenant, order id, cache hit or miss. This is where cardinality belongs, and it is what makes 'show me slow requests for this customer' possible.",
					"Instrument the boundaries first: incoming requests, outgoing calls, database queries, queue publish and consume. That alone answers most latency questions.",
					"Use OpenTelemetry. Vendor-neutral instrumentation means changing backends is a config change, not a re-instrumentation project."
				],
				code: {
					title: "Structured, correlated, and cheap to query",
					lang: "ts",
					source: `// Every log line carries the trace context, so logs and traces join up.
logger.info("payment captured", {
  traceId: span.spanContext().traceId,
  orderId, tenantId,
  provider: "stripe",
  attempt: 3,
  durationMs: 760,
});

// Span attributes carry the high-cardinality detail metrics cannot hold.
span.setAttributes({
  "order.id": orderId,
  "tenant.id": tenantId,
  "payment.provider": "stripe",
  "payment.attempt": 3,
  "cache.hit": false,
});

// The metric stays low-cardinality — no ids, bounded labels.
metrics.histogram("payment.duration_ms", 760, { provider: "stripe", outcome: "ok" });`
				}
			},
			{
				heading: "Alerting that people do not ignore",
				bullets: [
					"Alert on symptoms, not causes. 'p99 checkout latency above 2 s for 5 minutes' is actionable; 'CPU above 80%' is often normal and trains people to ignore pages.",
					"Every alert needs a runbook link and a clear owner. An alert with no documented response is a notification, not an alert.",
					"Burn-rate alerting on error budgets catches both the fast catastrophe and the slow leak: a high burn rate over a short window pages immediately, a lower rate over a long window creates a ticket.",
					"Page only for things a human must act on now. Everything else is a dashboard or a ticket — alert fatigue is the main reason real incidents get missed.",
					"Include the query or dashboard link in the alert. Making the responder reconstruct the context at 3am costs minutes you do not have."
				],
				table: {
					headers: [
						"Symptom",
						"Likely first check",
						"Signal to use"
					],
					rows: [
						[
							"p99 latency up, p50 flat",
							"One slow dependency or a hot shard",
							"Traces — find the slow span"
						],
						[
							"Error rate up across all endpoints",
							"Shared dependency or a deploy",
							"Deploy timeline, then metrics by version"
						],
						[
							"Latency up, all percentiles",
							"Saturation — CPU, connections, queue depth",
							"Metrics: USE on the resource"
						],
						[
							"Errors for one tenant only",
							"Rate limit, data shape, or a hot key",
							"Logs and traces filtered by tenant"
						],
						[
							"Slow creep over days",
							"Leak, unbounded growth, index bloat",
							"Long-window metrics, profiles"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How would you debug a latency spike in this system?",
						a: "Start with metrics to see the shape — is it all endpoints or one, all percentiles or just the tail, and does it correlate with a deploy or a traffic change. Then traces to localise it: a waterfall usually shows one span carrying the added time. Then logs for a specific trace id to see exactly what happened. Going straight to logs at scale means searching millions of lines without knowing what for."
					},
					{
						q: "Why not just log everything?",
						a: "Cost and signal. At high volume, logging every request costs more than the service and makes finding anything harder. Metrics answer 'how often and how bad' for a fraction of the price, traces answer 'where' with sampling, and logs are for the specific detail. I would log every error in full, sample successful requests, and make sure everything carries a trace id so the three join up."
					},
					{
						q: "What is the difference between monitoring and observability?",
						a: "Monitoring is watching for known failure modes — dashboards and alerts you set up because you predicted the problem. Observability is being able to answer new questions from data you already collect, without deploying code. The practical test is whether you can answer 'why is this specific customer's request slow' from existing telemetry, and that usually depends on whether you kept high-cardinality attributes in traces."
					},
					{
						q: "What would you alert on for a checkout service?",
						a: "Symptoms users feel: checkout success rate below threshold, p99 checkout latency above the budget, and payment provider error rate. I would use burn-rate alerts against an error budget so a sharp drop pages immediately and a slow degradation opens a ticket. What I would not page on is CPU or memory — those go on a dashboard, because they are causes, and alerting on them produces noise long before users notice anything."
					}
				]
			}
		],
		related: [
			"/hld/availability",
			"/lld/logging",
			"/hld/circuit-breaker",
			"/examples/metrics"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "dns",
		title: "DNS and Traffic Routing",
		subtitle: "The first hop of every request, and the slowest thing to change.",
		level: "foundational",
		minutes: 12,
		tags: [
			"networking",
			"edge",
			"availability"
		],
		summary: "Every request begins with a name resolution, which makes DNS both the earliest place to steer traffic and the hardest place to fix a mistake. TTLs are honoured inconsistently, caches are everywhere, and a change you make now may take hours to reach everyone.",
		keyPoints: [
			"Resolution walks a hierarchy — root, TLD, authoritative — with caching at every step.",
			"TTL controls how long a change takes to propagate, and clients frequently ignore it.",
			"DNS-based failover is coarse and slow; anycast and load balancers are faster.",
			"Geo and latency routing steer users to the nearest healthy region.",
			"Never rely on DNS alone for failover — it is a routing tool, not a health system."
		],
		sections: [
			{
				heading: "How a lookup resolves",
				steps: [
					{
						title: "Local caches first",
						text: "Browser cache, then OS resolver cache, then the hosts file. Most lookups never leave the machine, which is also why a stale entry can persist after you fixed the record."
					},
					{
						title: "Recursive resolver",
						text: "Usually your ISP's, or a public one like 8.8.8.8 or 1.1.1.1. It caches aggressively and does the walking on your behalf."
					},
					{
						title: "Root and TLD servers",
						text: "The root points at the .com nameservers; those point at the domain's authoritative nameservers. Both layers are cached for a long time."
					},
					{
						title: "Authoritative nameserver",
						text: "Your DNS provider answers with the actual record and its TTL. This is the only server whose answer you control directly."
					},
					{
						title: "Everyone caches the answer",
						text: "For the TTL — nominally. Some resolvers clamp very low TTLs upward, some clients cache indefinitely, and some JVMs historically cached forever by default."
					}
				],
				diagram: {
					kind: "flow",
					caption: "Five layers of cache between your record and the user.",
					rows: [[
						{
							id: "b",
							label: "Browser cache",
							sub: "seconds to minutes"
						},
						{
							id: "os",
							label: "OS resolver",
							sub: "respects TTL, mostly"
						},
						{
							id: "r",
							label: "Recursive resolver",
							sub: "ISP or public"
						}
					], [
						{
							id: "root",
							label: "Root servers",
							sub: "→ .com"
						},
						{
							id: "tld",
							label: "TLD servers",
							sub: "→ your NS"
						},
						{
							id: "auth",
							label: "Authoritative NS",
							sub: "your record",
							tone: "accent"
						}
					]]
				}
			},
			{
				heading: "Record types you will actually use",
				table: {
					headers: [
						"Type",
						"Maps to",
						"Notes"
					],
					rows: [
						[
							"A / AAAA",
							"IPv4 / IPv6 address",
							"The endpoint. Multiple records give crude round-robin"
						],
						[
							"CNAME",
							"Another name",
							"Cannot coexist with other records; not allowed at the zone apex"
						],
						[
							"ALIAS / ANAME",
							"Another name, resolved server-side",
							"Provider-specific way to get CNAME behaviour at the apex"
						],
						[
							"NS",
							"Authoritative nameservers",
							"Delegation; changing these is the slowest change of all"
						],
						[
							"MX",
							"Mail servers",
							"With priorities"
						],
						[
							"TXT",
							"Arbitrary text",
							"SPF, DKIM, domain verification"
						],
						[
							"SRV",
							"Service host and port",
							"Service discovery in some stacks"
						],
						[
							"CAA",
							"Which CAs may issue certificates",
							"Cheap and worth setting"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "The apex CNAME problem catches everyone: you cannot put a CNAME on example.com itself, only on www.example.com. Providers solve it with ALIAS/ANAME records that resolve server-side — which also means you are tied to that provider's behaviour."
				}
			},
			{
				heading: "TTL: the trade-off you set in advance",
				math: [
					{
						label: "Long TTL (24 h)",
						expr: "fewer lookups, lower DNS cost, faster resolution",
						result: "a change takes up to a day",
						note: "Fine for records that never move."
					},
					{
						label: "Short TTL (60 s)",
						expr: "changes propagate in about a minute",
						result: "far more queries; higher cost",
						note: "Required if you intend to use DNS for failover."
					},
					{
						label: "Planned migration",
						expr: "lower TTL to 60 s a day before, migrate, then raise it again",
						result: "fast cutover, low steady cost",
						note: "This is the standard playbook — the low TTL must be in place before the change."
					}
				],
				bullets: [
					"TTL is a request, not a guarantee. Some resolvers enforce a minimum, some clients cache beyond it, and old application runtimes have cached forever.",
					"Because of that, always leave the old endpoint serving for a long tail after a migration — hours at minimum, sometimes days. Traffic will keep arriving.",
					"Very short TTLs increase your dependency on the DNS provider's availability, since every client re-resolves constantly."
				]
			},
			{
				heading: "Routing policies",
				table: {
					headers: [
						"Policy",
						"Chooses by",
						"Use for",
						"Caveat"
					],
					rows: [
						[
							"Simple",
							"One record",
							"Single endpoint",
							"No failover at all"
						],
						[
							"Weighted",
							"Configured proportions",
							"Canary and gradual rollouts, blue-green",
							"Coarse — caching makes real proportions drift"
						],
						[
							"Latency-based",
							"Measured latency to each region",
							"Global apps wanting the fastest region",
							"Based on the resolver's location, not the user's"
						],
						[
							"Geolocation",
							"The resolver's country/region",
							"Data residency, localised content",
							"Users on VPNs or corporate resolvers land wrong"
						],
						[
							"Failover",
							"Primary unless a health check fails",
							"Disaster recovery",
							"Propagation is bounded by TTL — minutes, not seconds"
						],
						[
							"Multivalue / round robin",
							"Several A records returned",
							"Crude spreading",
							"No health awareness in the client"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "Anycast is the alternative worth naming: the same IP announced from many locations, with the network routing each user to the nearest. Failover happens in the routing layer in seconds, with no cache to wait for. It is how large CDNs and public DNS resolvers work."
				}
			},
			{
				heading: "Operational notes",
				bullets: [
					"DNS resolution adds to first-byte latency — often 20-120 ms on a cold cache. Preconnect hints and reusing connections matter more than they look.",
					"Use at least two DNS providers for a critical domain. Outages at a single DNS provider have taken down large parts of the internet more than once.",
					"Health-checked failover in DNS is bounded by TTL and by client caching. For fast failover, put a load balancer or anycast in front and let DNS point at something stable.",
					"Expiring domains and certificates are an embarrassing but common cause of outages — monitor both, with alerts weeks in advance.",
					"Split-horizon DNS (different answers for internal and external clients) is standard in corporate networks and a frequent source of 'works on my machine' confusion.",
					"DNS is also an attack surface: enable DNSSEC where practical, set CAA records, and lock the registrar account with strong authentication — a domain hijack is a total compromise."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How would you route users to the nearest region?",
						a: "Latency-based or geolocation routing at the DNS layer, with anycast if the provider supports it, since that moves the decision into the network and fails over in seconds rather than TTL-bounded minutes. I would be explicit that DNS routing is based on the resolver's location, so a user on a corporate or VPN resolver can be sent to the wrong region — which is why the application should also handle being reached from anywhere."
					},
					{
						q: "Would you use DNS for failover?",
						a: "As a backstop for a whole-region outage, yes, with a short TTL and health checks. Not as the primary mechanism, because propagation depends on caches you do not control and some clients ignore TTLs entirely. Within a region I want a load balancer or anycast handling failover in seconds, with DNS pointing at something that does not need to change."
					},
					{
						q: "What TTL would you set?",
						a: "It depends on how often the record changes. Stable records get hours, since the lookups are wasted work otherwise. Anything I might need to move quickly gets 60 seconds, accepting the extra query volume. Before a planned migration I lower the TTL a day ahead so caches have expired by cutover — doing it at the same time as the change achieves nothing."
					},
					{
						q: "You changed a record and some users still hit the old server. Why?",
						a: "Caching somewhere in the chain — a resolver enforcing a minimum TTL, a client or runtime caching beyond it, or a long-lived connection that never re-resolved. That is why the old endpoint has to stay up well past the TTL, ideally serving a redirect or proxying to the new one. Treating a DNS change as instant is one of the more reliable ways to cause a partial outage."
					}
				]
			}
		],
		related: [
			"/hld/cdn",
			"/hld/load-balancing",
			"/hld/availability",
			"/hld/scaling"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "estimation",
		title: "Back-of-the-Envelope Estimation",
		subtitle: "Turn a vague problem into numbers that decide the architecture.",
		level: "foundational",
		minutes: 14,
		tags: [
			"interview",
			"fundamentals",
			"capacity"
		],
		summary: "Estimation is how you find out whether you are designing for 12 requests per second or 120,000 — and those need completely different systems. The arithmetic is deliberately crude: you are looking for the order of magnitude, because that is what determines whether one server suffices or you need a sharded cluster.",
		keyPoints: [
			"Round aggressively. 86,400 seconds a day is 100,000; a month is 2.5 million seconds.",
			"Always convert to peak: peak is typically 2-5× average, and systems are sized for peak.",
			"Estimate storage, bandwidth and QPS separately — different ones dominate different designs.",
			"State assumptions out loud so the interviewer can correct the input rather than the conclusion.",
			"The point is to find the constraint, then design around it."
		],
		sections: [
			{
				heading: "The numbers to memorise",
				table: {
					headers: [
						"Quantity",
						"Value",
						"Rounded to"
					],
					rows: [
						[
							"Seconds per day",
							"86,400",
							"10⁵"
						],
						[
							"Seconds per month",
							"2.6 million",
							"2.5 × 10⁶"
						],
						[
							"1 million/day",
							"11.6/s",
							"~12/s"
						],
						[
							"1 billion/day",
							"11,574/s",
							"~12k/s"
						],
						[
							"L1 cache reference",
							"~1 ns",
							""
						],
						[
							"Main memory reference",
							"~100 ns",
							"100× L1"
						],
						[
							"SSD random read",
							"~100 µs",
							"1000× memory"
						],
						[
							"Disk seek (HDD)",
							"~10 ms",
							"100× SSD"
						],
						[
							"Same-AZ round trip",
							"~0.5 ms",
							""
						],
						[
							"Cross-region round trip (US↔EU)",
							"~80 ms",
							""
						],
						[
							"Read 1 MB from memory",
							"~50 µs",
							""
						],
						[
							"Read 1 MB from SSD",
							"~500 µs",
							""
						],
						[
							"Read 1 MB over 1 Gbps network",
							"~10 ms",
							""
						]
					]
				},
				math: [{
					label: "Typical row sizes",
					expr: "user record ~1 KB · tweet ~300 B · photo ~500 KB · minute of 1080p video ~50 MB",
					result: "orders of magnitude"
				}, {
					label: "Typical throughputs",
					expr: "app server ~10³ rps · Postgres ~10⁴ writes/s · Redis ~10⁵ ops/s · Kafka ~10⁶ msg/s",
					result: "per node, roughly"
				}],
				callout: {
					kind: "insight",
					text: "Latency numbers matter because they set what is possible: if a request must read from disk on a different continent, no amount of application optimisation gets you under 100 ms. Knowing the ladder tells you where the budget has to go."
				}
			},
			{
				heading: "The procedure",
				steps: [
					{
						title: "State the user numbers and the assumption behind them",
						text: "'Assume 100 million daily active users, each performing 10 reads and 1 write.' Say it as an assumption so the interviewer can adjust the input.",
						detail: "If they give you a number, use theirs. If not, pick a round one and move on."
					},
					{
						title: "Convert to average per second",
						text: "Divide by 100,000 rather than 86,400 — you are estimating, and the error is smaller than your input uncertainty.",
						detail: "100 M DAU × 10 reads = 1 B reads/day ÷ 10⁵ ≈ 10,000 reads/s"
					},
					{
						title: "Multiply for peak",
						text: "2-5× average depending on how spiky the traffic is. Social apps peak in the evening; a payroll system peaks monthly.",
						detail: "10,000 × 3 ≈ 30,000 reads/s at peak"
					},
					{
						title: "Estimate storage, and then storage over time",
						text: "Per-item size × items per day × retention. Then add indexes and replication — usually a 2-3× multiplier that people forget.",
						detail: "100 M writes/day × 1 KB = 100 GB/day → 36 TB/year → ~100 TB with replication"
					},
					{
						title: "Estimate bandwidth",
						text: "Requests per second × payload size. This is where media-heavy systems reveal that bandwidth, not compute, is the constraint.",
						detail: "30,000 reads/s × 5 KB ≈ 150 MB/s ≈ 1.2 Gbps egress"
					},
					{
						title: "Say what the number means",
						text: "This is the step that matters. '30,000 reads/s means I need caching and read replicas; 36 TB/year means I cannot keep it all on one machine, so partitioning by time or user.'"
					}
				]
			},
			{
				heading: "A worked example",
				lede: "A Twitter-scale timeline, from users to architecture.",
				math: [
					{
						label: "Assumptions",
						expr: "300 M DAU · 2 posts/user/day · 100 timeline views/user/day · post ≈ 300 B text + metadata",
						result: "stated up front"
					},
					{
						label: "Write QPS",
						expr: "300 M × 2 ÷ 10⁵",
						result: "≈ 6,000/s",
						note: "Peak ×3 ≈ 18,000/s. Manageable, but not on one node without care."
					},
					{
						label: "Read QPS",
						expr: "300 M × 100 ÷ 10⁵",
						result: "≈ 300,000/s",
						note: "Peak ×3 ≈ 1 M/s. Reads outnumber writes 50:1 — this is the defining fact."
					},
					{
						label: "Storage per year",
						expr: "600 M posts/day × 300 B × 365",
						result: "≈ 65 TB/year",
						note: "×3 for indexes and replication ≈ 200 TB. Media is separate and far larger."
					},
					{
						label: "Read bandwidth",
						expr: "1 M reads/s × 5 KB per timeline page",
						result: "≈ 5 GB/s",
						note: "40 Gbps. This is a CDN and cache problem before it is a database problem."
					},
					{
						label: "Cache sizing",
						expr: "20% of users active in a 5-min window × 1 KB timeline cache",
						result: "≈ 60 GB",
						note: "Fits comfortably in a small Redis cluster — so caching timelines is clearly worth it."
					}
				],
				callout: {
					kind: "interview",
					text: "The conclusion is what earns credit: 50:1 read:write means precompute timelines on write (fan-out) rather than assembling them on read, cache aggressively, and treat the write path as the cheap one. The numbers chose the architecture."
				}
			},
			{
				heading: "Common mistakes",
				table: {
					headers: [
						"Mistake",
						"Consequence",
						"Instead"
					],
					rows: [
						[
							"Sizing for average, not peak",
							"The system falls over every evening",
							"Multiply by 2-5× and say which you used"
						],
						[
							"Forgetting replication and indexes",
							"Storage estimate off by 3×",
							"Multiply raw data by ~3 for a realistic footprint"
						],
						[
							"Precision theatre",
							"Wasting minutes on arithmetic when the input was a guess",
							"Round hard; the input uncertainty dominates"
						],
						[
							"Not converting to a decision",
							"Numbers with no architectural consequence",
							"End with 'therefore I need X'"
						],
						[
							"Over-engineering for numbers you computed",
							"Kafka and 50 nodes for 12 requests/second",
							"Check whether one server would do — often it would"
						],
						[
							"Ignoring growth",
							"A design that works today and not in 18 months",
							"Design for 10× current, not 1000×"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How many servers would you need?",
						a: "I would work from peak QPS and a per-server capacity assumption, and say both out loud. If peak is 30,000 requests per second and a server handles 2,000 with the work this endpoint does, that is 15 servers plus headroom for failure and deploys, so around 20 across three availability zones. The important part is stating the per-server number as an assumption, because it varies enormously by workload."
					},
					{
						q: "How much storage for five years?",
						a: "Daily volume times retention, then a multiplier for indexes and replication — usually about three. I would also ask whether old data can move to cheaper storage, because five years of hot data and five years of archived data are very different bills. Then check whether the total fits one machine, since that answers whether sharding is on the table."
					},
					{
						q: "The interviewer says your assumption is wrong. What now?",
						a: "Take their number and redo the arithmetic — it usually takes fifteen seconds and often changes the conclusion, which is the interesting part. That is exactly why I state assumptions explicitly rather than burying them: it makes the estimate correctable instead of wrong."
					},
					{
						q: "When does estimation change your design?",
						a: "At the order-of-magnitude boundaries. Under a thousand requests per second, a single server and a single database is the right answer and anything else is over-engineering. Around ten thousand, caching and read replicas become necessary. Past a hundred thousand, or once the dataset exceeds one machine, partitioning is unavoidable. The whole point of the exercise is finding which of those three systems I am being asked to design."
					}
				]
			}
		],
		related: [
			"/hld/scaling",
			"/examples/scale-to-millions",
			"/examples/interview-framework",
			"/hld/caching"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var hldResilience = [
	{
		slug: "rate-limiting",
		title: "Rate Limiting at Scale",
		subtitle: "Protect the backend, share capacity fairly, and tell clients how to behave.",
		level: "intermediate",
		minutes: 15,
		tags: [
			"resilience",
			"traffic",
			"api-design"
		],
		summary: "Rate limiting exists to keep one client — abusive, buggy, or just successful — from consuming capacity everyone else needs. At the HLD level the algorithm is the easy part; the design questions are where the limit is enforced, how state is shared across a fleet without adding a round trip to every request, and what happens when the limiter's own datastore fails.",
		keyPoints: [
			"Limit at the edge for volumetric abuse and at the gateway for per-client fairness; service-level limits protect specific expensive endpoints.",
			"Shared state means a round trip per request. Local approximation plus periodic synchronisation is how large systems avoid that.",
			"Always answer 429 with Retry-After and X-RateLimit headers — a limiter clients cannot cooperate with amplifies load.",
			"Decide fail-open versus fail-closed per endpoint, deliberately, before the incident.",
			"Rate limiting is not load shedding: one is fairness policy, the other is survival under overload. You need both."
		],
		prerequisites: ["/lld/rate-limiter"],
		sections: [
			{
				heading: "Where to enforce it",
				diagram: {
					kind: "layers",
					caption: "Each layer catches a different kind of problem, and they compose.",
					layers: [
						{
							title: "Edge / CDN",
							items: [
								"Volumetric DDoS",
								"Per-IP caps",
								"Bot detection",
								"Cheapest place to drop traffic"
							]
						},
						{
							title: "API gateway",
							items: [
								"Per-API-key quotas",
								"Per-tenant fairness",
								"Endpoint-specific limits",
								"429 with headers"
							]
						},
						{
							title: "Service",
							items: [
								"Expensive operations (export, search)",
								"Concurrency limits, not just rate",
								"Per-user business quotas"
							]
						},
						{
							title: "Datastore",
							items: [
								"Connection pool caps",
								"Statement timeouts",
								"The last line of defence"
							]
						}
					]
				},
				table: {
					headers: [
						"Layer",
						"Protects against",
						"Blind to"
					],
					rows: [
						[
							"Edge",
							"Volumetric floods, obvious abuse",
							"Who the user is; business quotas"
						],
						[
							"Gateway",
							"One tenant starving others",
							"Which internal call is expensive"
						],
						[
							"Service",
							"One endpoint overloading a dependency",
							"Global fleet-wide usage"
						],
						[
							"Datastore",
							"Total collapse",
							"Everything above it — by then users see errors"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "Concurrency limits are often more useful than rate limits for expensive endpoints. 'At most 5 concurrent exports per tenant' bounds resource usage directly, whereas '100 exports per minute' still allows 100 simultaneous ones."
				}
			},
			{
				heading: "Distributed state without a round trip per request",
				body: ["The naive design puts a Redis call in front of every request. At a gateway handling a million requests per second, that is a million extra round trips and a single hot dependency whose failure is your outage."],
				steps: [
					{
						title: "Exact: shared counter per request",
						text: "Every gateway consults Redis with an atomic script. Accurate, simple, and it adds ~0.3-1 ms plus a hard dependency to every request.",
						detail: "Fine up to tens of thousands of rps. Shard keys across Redis nodes so one hot tenant does not saturate one node."
					},
					{
						title: "Local approximation with periodic sync",
						text: "Each gateway keeps a local bucket and periodically reports usage and receives an updated allowance. Zero per-request round trips; the limit is enforced approximately, overshooting by roughly the sync interval's worth of traffic.",
						detail: "This is how most large-scale API gateways actually work."
					},
					{
						title: "Budget distribution",
						text: "Divide the global limit across N gateways — each gets limit/N — and redistribute periodically based on observed demand, so idle gateways donate to busy ones.",
						detail: "Simple and effective when traffic is roughly evenly balanced; poor when routing is skewed."
					},
					{
						title: "Two-tier: local filter, shared check for hot keys",
						text: "Track locally, and only consult the shared store for keys approaching their limit. Cold keys cost nothing; hot keys stay accurate. Best of both, with more moving parts."
					}
				],
				code: {
					title: "Two-tier limiter: shared check only when it matters",
					lang: "ts",
					source: `const local = new TokenBucket({ capacity: limit / GATEWAY_COUNT, refillPerSec: rate / GATEWAY_COUNT });

async function allow(key: string): Promise<Decision> {
  const localDecision = local.allow(key, Date.now());

  // Comfortably under this gateway's share: no network call at all.
  if (localDecision.remaining > localDecision.limit * 0.3) return localDecision;

  // Near the limit: consult the shared store for an accurate answer.
  try {
    return await redis.evalsha(RATE_LIMIT_SCRIPT, key, Date.now());
  } catch (err) {
    metrics.inc("ratelimit.store_unavailable");
    // Fail-open for reads, fail-closed for expensive writes — decided per route.
    return route.failOpen ? { ok: true, degraded: true, ...localDecision } : DENY;
  }
}`
				}
			},
			{
				heading: "Speaking to clients properly",
				code: {
					title: "The response that makes clients behave",
					lang: "http",
					source: `HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Limit: 1000
RateLimit-Remaining: 0
RateLimit-Reset: 12
Content-Type: application/json

{
  "error": "rate_limited",
  "message": "Rate limit exceeded for api key ak_...9f3",
  "limit": 1000,
  "window": "1m",
  "retryAfterSeconds": 12,
  "docs": "https://api.example.com/docs/rate-limits"
}

# Also send the headers on SUCCESSFUL responses, so a well-behaved client
# can slow down before it is ever rejected.`
				},
				bullets: [
					"Without Retry-After, clients retry immediately and your limiter becomes a load amplifier at exactly the wrong moment.",
					"Distinguish 429 (you are over your limit, back off) from 503 (we are overloaded, everyone back off). They mean different things and clients should react differently.",
					"Machine-readable error codes let SDKs implement backoff automatically; a prose message alone forces string matching.",
					"Document the limits publicly, and make them visible in a dashboard. Most limit violations are honest mistakes."
				]
			},
			{
				heading: "Fairness beyond a simple counter",
				bullets: [
					"Weighted limits by cost: a search query might consume 10 tokens while a health check consumes 1. This turns 'requests per minute' into 'work per minute', which is what you actually care about.",
					"Tiered limits: burst per second, sustained per minute, quota per day. Evaluate all three and report the most restrictive in the headers.",
					"Multi-dimensional keys: limit by API key, and separately by IP, and separately per endpoint. A single compromised key should not exhaust a tenant's whole quota.",
					"Fair queueing rather than rejection for internal traffic: instead of dropping, queue per tenant and serve round-robin so one tenant's burst adds latency for itself, not for others.",
					"Priority: never rate limit health checks or the auth path the same way as bulk endpoints, or a limiter can prevent recovery."
				],
				diagram: {
					kind: "compare",
					caption: "The policy question that arrives during an incident.",
					options: [{
						title: "Fail open",
						good: ["Limiter outage does not become a service outage", "Users are unaffected by an internal problem"],
						bad: ["Abuse flows through unchecked", "The backend the limiter protects may then fall over"],
						verdict: "Read endpoints where the backend can absorb a surge."
					}, {
						title: "Fail closed",
						good: ["Backend stays protected no matter what", "Predictable worst case"],
						bad: ["A Redis blip becomes a full outage", "Blast radius of the limiter is total"],
						verdict: "Expensive writes, or anything that costs money per call."
					}]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Where would you put the rate limiter?",
						a: "Mostly at the API gateway, so every backend is protected uniformly and the policy lives in one place. On top of that, a cheap volumetric limit at the CDN or edge for obvious floods, and endpoint-specific limits inside services for genuinely expensive operations, where a concurrency limit is often more appropriate than a rate. Three layers, each catching what the others cannot see."
					},
					{
						q: "How do you rate limit across 50 gateway instances?",
						a: "I avoid a round trip per request. Each instance keeps a local bucket sized to its share and only consults the shared store when a key gets close to its limit, so cold traffic costs nothing and hot keys stay accurate. If the shared store is unavailable, the local bucket keeps enforcing an approximate limit — which is far better than either failing everything or letting everything through."
					},
					{
						q: "What if the Redis backing the limiter goes down?",
						a: "It has to be a decision made in advance, per route. For read endpoints I fail open, because a limiter outage should not be a service outage, and the local approximate bucket still provides a floor. For expensive writes or anything that costs money per call, I fail closed. Either way I alert loudly, because running unprotected is a temporary state, not a steady one."
					},
					{
						q: "How is this different from load shedding?",
						a: "Rate limiting is a fairness policy applied per client regardless of system health — you get 1000 requests a minute whether we are busy or idle. Load shedding is a survival response: when latency or queue depth crosses a threshold, reject a fraction of traffic, preferring low-priority requests, so the rest succeeds. You need both, because a system can be overloaded by many clients who are each individually within their limits."
					}
				]
			}
		],
		related: [
			"/lld/rate-limiter",
			"/hld/api-gateway",
			"/examples/rate-limiter",
			"/hld/circuit-breaker"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "rate-limiter"
	},
	{
		slug: "circuit-breaker",
		title: "Circuit Breakers, Timeouts and Retries",
		subtitle: "Stop calling something that is failing, and stop making its outage worse.",
		level: "intermediate",
		minutes: 15,
		tags: [
			"resilience",
			"patterns",
			"reliability"
		],
		summary: "When a dependency starts failing, the instinct is to retry. At scale that instinct is what turns a degraded service into a dead one, and then takes down everything that calls it. A circuit breaker makes failure fast and cheap: after enough failures it stops trying, gives the dependency room to recover, and probes carefully before resuming.",
		keyPoints: [
			"Three states: closed (normal), open (fail fast), half-open (probe with a few requests).",
			"Trip on an error rate over a window with a minimum request count — never on a raw count.",
			"Every remote call needs a timeout, and the timeout must be shorter than the caller's remaining budget.",
			"Retries need a budget, jitter and idempotency, or they amplify the outage they are responding to.",
			"Bulkheads limit how much of your capacity one failing dependency can consume."
		],
		sections: [
			{
				heading: "The cascade you are preventing",
				steps: [
					{
						title: "A dependency slows down",
						text: "Not down — slow. Responses that took 50 ms now take 5 seconds, which is worse than failing, because callers wait."
					},
					{
						title: "Caller threads or connections pile up",
						text: "Each waiting request holds a thread, a connection and memory. The caller's pool fills with requests waiting on one slow dependency."
					},
					{
						title: "The caller becomes slow for everything",
						text: "Requests that never touch the failing dependency now queue behind those that do. One broken feature has taken the whole service down."
					},
					{
						title: "Retries multiply the load",
						text: "Every caller retries three times, so the struggling dependency now receives three times its normal traffic at its weakest moment."
					},
					{
						title: "It spreads upstream",
						text: "Services calling the now-slow caller repeat the pattern. This is why a single non-critical service can take down an entire platform."
					}
				],
				callout: {
					kind: "warn",
					text: "Slow is worse than down. A dependency returning errors in 1 ms is survivable; the same dependency taking 30 seconds to fail exhausts every caller's resources. This is why timeouts matter more than retries."
				}
			},
			{
				heading: "The breaker state machine",
				diagram: {
					kind: "flow",
					caption: "Closed → open on error rate; open → half-open after a cooldown; half-open decides.",
					rows: [[
						{
							id: "c",
							label: "CLOSED",
							sub: "calls pass through, failures counted",
							tone: "ok"
						},
						{
							id: "o",
							label: "OPEN",
							sub: "fail fast, no calls made",
							tone: "bad"
						},
						{
							id: "h",
							label: "HALF-OPEN",
							sub: "a few probe calls",
							tone: "warn"
						}
					], [
						{
							id: "t1",
							label: "error rate > 50% over 10s (min 20 requests)",
							sub: "closed → open"
						},
						{
							id: "t2",
							label: "cooldown 30s elapsed",
							sub: "open → half-open"
						},
						{
							id: "t3",
							label: "probes succeed → closed · any fails → open",
							sub: "half-open resolves"
						}
					]]
				},
				code: {
					title: "A breaker with the details that matter",
					lang: "ts",
					source: `class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed";
  private window = new SlidingWindow({ ms: 10_000 });   // rolling stats
  private openedAt = 0;
  private probesInFlight = 0;

  constructor(private opts = {
    failureRateThreshold: 0.5,
    minimumRequests: 20,        // never trip on 2 failures out of 2
    cooldownMs: 30_000,
    halfOpenProbes: 3,
  }) {}

  async call<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.openedAt < this.opts.cooldownMs) {
        metrics.inc("breaker.rejected");
        if (fallback) return fallback();
        throw new CircuitOpen();                 // fail fast: microseconds, not seconds
      }
      this.state = "half-open";
      this.probesInFlight = 0;
    }

    if (this.state === "half-open" && this.probesInFlight >= this.opts.halfOpenProbes) {
      if (fallback) return fallback();
      throw new CircuitOpen();                   // limit probes; do not flood a recovering service
    }

    if (this.state === "half-open") this.probesInFlight++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallback) return fallback();
      throw err;
    }
  }

  private onFailure(err: unknown) {
    if (isClientError(err)) return;              // a 400 is not the dependency's fault
    this.window.recordFailure();
    if (this.state === "half-open") return this.trip();
    const { total, failures } = this.window.stats();
    if (total >= this.opts.minimumRequests && failures / total > this.opts.failureRateThreshold) {
      this.trip();
    }
  }

  private trip() {
    this.state = "open";
    this.openedAt = Date.now();
    metrics.inc("breaker.opened");               // this should page someone
  }
}`
				},
				bullets: [
					"Trip on rate, not count: '5 failures' trips during a quiet period on a coincidence; '50% of at least 20 requests' does not.",
					"Do not count client errors. A 400 or 404 means your request was wrong, not that the dependency is unhealthy — counting them opens breakers for the wrong reason.",
					"Limit half-open probes. Letting full traffic through the moment the cooldown expires re-kills a service that was just recovering.",
					"One breaker per dependency, and often per endpoint of that dependency: a failing /search should not open the breaker on /health.",
					"Breaker state transitions are high-signal alerts. An opening breaker is one of the most useful pages a system can send."
				]
			},
			{
				heading: "Timeouts and retry budgets",
				code: {
					title: "Deadline propagation and a retry that does not amplify",
					lang: "ts",
					source: `// The user-facing budget is set once and passed down.
async function handleRequest(req: Request) {
  const deadline = Date.now() + 3_000;           // total budget for this request
  return getProfile(req.userId, deadline);
}

async function getProfile(id: string, deadline: number) {
  // An inner call can never have a longer timeout than what is left.
  const remaining = deadline - Date.now();
  const timeout = Math.min(500, remaining - 100);  // leave room to respond
  if (timeout <= 0) throw new DeadlineExceeded();
  return userService.get(id, { timeoutMs: timeout });
}

async function withRetry<T>(fn: () => Promise<T>, deadline: number) {
  let attempt = 0;
  for (;;) {
    if (!retryBudget.tryConsume()) throw new RetryBudgetExhausted();  // fleet-wide cap
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (!isTransient(err) || attempt >= 3) throw err;
      // full jitter: sleep uniformly in [0, base * 2^attempt]
      const backoff = Math.random() * Math.min(8_000, 200 * 2 ** attempt);
      if (Date.now() + backoff > deadline) throw err;   // no point retrying past the deadline
      await sleep(backoff);
    }
  }
}`
				},
				table: {
					headers: [
						"Rule",
						"Why",
						"Typical value"
					],
					rows: [
						[
							"Every remote call has a timeout",
							"An untimed call can hold a thread indefinitely",
							"p99 of the dependency × 2-3"
						],
						[
							"Inner timeouts < outer budget",
							"Otherwise the caller gives up while you wait",
							"Propagate a deadline, do not set independently"
						],
						[
							"Retry only transient failures",
							"Retrying a 400 will never succeed",
							"Timeouts, 502/503/504, connection reset"
						],
						[
							"Retry budget across the fleet",
							"Per-request limits still allow fleet-wide amplification",
							"≤ 10% of total requests may be retries"
						],
						[
							"Full jitter on backoff",
							"Synchronised retries recreate the spike",
							"sleep = rand(0, base × 2^n)"
						],
						[
							"Retries must be idempotent",
							"Otherwise you double-charge on a timeout",
							"Idempotency key on every mutating call"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "A retry budget is the piece most designs miss. Limiting retries per request still allows 10,000 clients each retrying three times, which is 30,000 extra requests. Capping retries as a percentage of total traffic is what actually prevents amplification."
				}
			},
			{
				heading: "Bulkheads and fallbacks",
				bullets: [
					"Bulkhead: give each dependency its own bounded pool of connections or concurrency slots. When one dependency hangs, it can consume only its own pool, and calls to everything else keep working.",
					"This is the pattern that saves you when a breaker is too slow — a hung dependency with its own 10-slot pool blocks 10 requests, not your whole thread pool.",
					"Fallbacks should be genuinely cheap and independent: a cached value, a static default, a degraded response. A fallback that calls another service has just moved the problem.",
					"Make degradation visible. A silent fallback that runs for three days is a bug nobody noticed; emit a metric and alert on sustained fallback rates.",
					"Load shedding is the inward-facing twin: when your own queues grow, reject early with 503 and Retry-After rather than accepting work you cannot finish."
				],
				diagram: {
					kind: "system",
					caption: "One hung dependency consumes its own bulkhead and nothing else.",
					columns: [
						{
							title: "Request",
							nodes: [{
								id: "r",
								label: "Product page",
								sub: "3s budget",
								tone: "accent"
							}]
						},
						{
							title: "Bulkheads",
							nodes: [
								{
									id: "b1",
									label: "catalog pool",
									sub: "50 slots · critical",
									tone: "ok"
								},
								{
									id: "b2",
									label: "recs pool",
									sub: "10 slots · optional",
									tone: "warn"
								},
								{
									id: "b3",
									label: "reviews pool",
									sub: "10 slots · optional",
									tone: "warn"
								}
							]
						},
						{
							title: "On failure",
							nodes: [
								{
									id: "f1",
									label: "catalog fails → 503",
									sub: "no meaningful page"
								},
								{
									id: "f2",
									label: "recs fail → best sellers",
									sub: "breaker open, fallback",
									tone: "ok"
								},
								{
									id: "f3",
									label: "reviews fail → hide section",
									sub: "page still renders",
									tone: "ok"
								}
							]
						}
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How do you set a circuit breaker's thresholds?",
						a: "From the dependency's normal behaviour rather than from a default. The failure rate threshold sits well above the baseline error rate — 50% is common when normal is under 1% — with a minimum request count so quiet periods do not trip it. The cooldown should be roughly how long the dependency typically takes to recover, and I would rather start conservative and tune, since a breaker that trips too eagerly causes its own outages."
					},
					{
						q: "When should you not retry?",
						a: "When the failure is permanent — a validation error, a 404, an authorisation failure — because the retry cannot succeed and just costs capacity. Also when the operation is not idempotent and carries no idempotency key, since a timeout means 'unknown outcome', and retrying a charge can double-bill. And when the deadline has nearly expired: retrying past the point where the answer is still useful only adds load."
					},
					{
						q: "A dependency is slow but not failing. Does the breaker help?",
						a: "Only if I count timeouts as failures, which I would. But the more reliable protection is a bulkhead: a bounded concurrency pool per dependency means a hung service can consume at most its own slots. Combined with a timeout shorter than the caller's budget, slowness converts into fast failures the breaker can then act on."
					},
					{
						q: "How do you test this?",
						a: "Fault injection — deliberately delay and fail a dependency in a staging environment or a small percentage of production traffic, and verify the breaker opens, the fallback fires, and the request budget holds. Untested resilience code is usually broken resilience code; I have seen fallbacks that themselves called the failing service. Game days are the systematic version of this."
					}
				]
			}
		],
		related: [
			"/hld/availability",
			"/lld/decorator",
			"/hld/rate-limiting",
			"/hld/observability"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "idempotency",
		title: "Idempotency",
		subtitle: "Make retries safe, because in a distributed system everything is retried.",
		level: "intermediate",
		minutes: 14,
		tags: [
			"reliability",
			"api-design",
			"correctness"
		],
		summary: "A timeout does not mean the operation failed — it means you do not know. The client will retry, the queue will redeliver, the user will click again. Idempotency is the property that makes all of that harmless: performing the operation twice has the same effect as performing it once.",
		keyPoints: [
			"Timeouts are the fundamental problem: the request may have succeeded, and you cannot tell.",
			"GET, PUT and DELETE are naturally idempotent; POST is not, which is why it needs a key.",
			"An idempotency key must be generated by the client, stored server-side with the result, and returned on replay.",
			"Store the key and the effect in one transaction, or a crash between them reopens the hole.",
			"Natural idempotency — set rather than increment, upsert on a unique key — is better than bolted-on keys."
		],
		sections: [
			{
				heading: "Why it is unavoidable",
				diagram: {
					kind: "sequence",
					caption: "The client cannot distinguish these two cases, so it must assume the worst and retry.",
					actors: [
						{
							id: "c",
							label: "Client"
						},
						{
							id: "s",
							label: "Payment service"
						},
						{
							id: "db",
							label: "Ledger"
						}
					],
					messages: [
						{
							from: "c",
							to: "s",
							label: "POST /charges {amount: 5000}",
							kind: "call"
						},
						{
							from: "s",
							to: "db",
							label: "INSERT charge",
							kind: "call"
						},
						{
							from: "db",
							to: "s",
							label: "committed",
							kind: "return",
							tone: "ok"
						},
						{
							from: "s",
							to: "c",
							label: "200 — response lost in the network",
							kind: "return",
							tone: "bad",
							note: "✗ never arrives"
						},
						{
							from: "c",
							to: "c",
							label: "timeout → retry",
							kind: "self",
							tone: "warn"
						},
						{
							from: "c",
							to: "s",
							label: "POST /charges {amount: 5000} — again",
							kind: "call",
							tone: "warn",
							note: "without an idempotency key: customer charged twice"
						}
					]
				},
				bullets: [
					"The client cannot know whether a timed-out request succeeded, so the only safe policies are 'retry and hope it is idempotent' or 'never retry and risk losing the operation'. Idempotency makes the first one correct.",
					"It is not only clients. Queue redelivery, load balancer retries, a user double-clicking, a mobile app resuming from background, and a proxy retrying an idle connection all produce duplicates.",
					"At-least-once delivery is the norm in every messaging system. That is a statement about your consumers, not about the broker."
				]
			},
			{
				heading: "Which operations are naturally safe",
				table: {
					headers: [
						"Operation",
						"Idempotent?",
						"Why"
					],
					rows: [
						[
							"GET /orders/42",
							"Yes",
							"No side effect"
						],
						[
							"PUT /users/42 {name: 'Ada'}",
							"Yes",
							"Sets an absolute value — applying twice gives the same state"
						],
						[
							"DELETE /orders/42",
							"Yes",
							"Second delete is a no-op; return 204 either way, not 404"
						],
						[
							"POST /orders",
							"No",
							"Creates a new resource each time — this is the one that needs a key"
						],
						[
							"UPDATE balance SET amount = amount - 50",
							"No",
							"Relative change; applying twice subtracts 100"
						],
						[
							"UPDATE balance SET amount = 950 WHERE version = 7",
							"Yes",
							"Absolute value plus a version guard"
						],
						[
							"INSERT ... ON CONFLICT DO NOTHING",
							"Yes",
							"Second insert is absorbed by the unique constraint"
						],
						[
							"queue.publish(event)",
							"No",
							"Two publishes, two messages — dedupe on the consumer side"
						]
					]
				},
				callout: {
					kind: "insight",
					text: "Prefer designing operations to be naturally idempotent over adding keys. 'Set the status to shipped' is safe to repeat; 'advance the status' is not. That choice costs nothing at design time and removes a whole class of bug."
				}
			},
			{
				heading: "Idempotency keys, done correctly",
				code: {
					title: "The full server-side pattern",
					lang: "ts",
					source: `// The client generates the key ONCE per logical operation and reuses it
// across every retry of that same operation.
//   POST /v1/charges
//   Idempotency-Key: 8f14e45f-ea0f-4f0b-9b3e-2c0f4b1a9d21

async function createCharge(req: Request) {
  const key = req.header("Idempotency-Key");
  if (!key) return badRequest("Idempotency-Key required");

  const fingerprint = hash(req.body);   // guard against key reuse with a different body

  return db.transaction(async (tx) => {
    // Claim the key. The unique constraint is what makes this a lock.
    const claim = await tx\`
      INSERT INTO idempotency_keys (key, fingerprint, state, created_at)
      VALUES (\${key}, \${fingerprint}, 'in_progress', now())
      ON CONFLICT (key) DO NOTHING
      RETURNING key\`;

    if (claim.length === 0) {
      const existing = await tx\`SELECT * FROM idempotency_keys WHERE key = \${key}\`;

      if (existing[0].fingerprint !== fingerprint) {
        return conflict("Idempotency-Key reused with a different payload");  // 422
      }
      if (existing[0].state === "in_progress") {
        return conflict409("Request already in progress, retry shortly");    // 409
      }
      return replay(existing[0].response);   // same status, same body, same charge id
    }

    // First time through: do the work in the SAME transaction as the claim.
    const charge = await performCharge(tx, req.body);
    const response = { status: 201, body: charge };

    await tx\`UPDATE idempotency_keys
             SET state = 'completed', response = \${JSON.stringify(response)}
             WHERE key = \${key}\`;

    return response;
  });
}

// Expire keys after 24h — long enough to cover any sane retry window,
// short enough that the table does not grow forever.`
				},
				bullets: [
					"The claim and the effect must be in one transaction. If you record the key first and crash before doing the work, the retry sees 'completed' and returns success for something that never happened.",
					"Store the response, not just a flag. A replay should return the original status and body — including the resource id — or the client cannot correlate its retry with the resource that exists.",
					"Fingerprint the payload. If a client reuses a key with different content, that is a bug on their side and should be a clear 4xx, not a silent replay of the wrong thing.",
					"Handle the in-progress case explicitly: two concurrent retries will race, and the loser should get a 409 telling it to try again shortly rather than blocking.",
					"Key scope should include the caller: an idempotency key from tenant A must never collide with tenant B's."
				]
			},
			{
				heading: "External side effects",
				body: ["Database work is the easy case, because a transaction can cover both the key and the effect. Sending an email, calling a payment provider or publishing an event cannot be rolled back, which is where the interesting design lives."],
				bullets: [
					"Push idempotency downstream: every good payment API accepts an idempotency key. Derive it deterministically from your own operation id so a retry sends the same key.",
					"Two-phase with a record: write 'intending to send email X for order Y' in the transaction, then send it in a separate step that marks it sent. Worst case is a duplicate email, never a lost one — choose which failure you prefer and say so.",
					"For events, the transactional outbox: the event row commits with the state change, and a relay publishes at-least-once. Consumers dedupe on the event id.",
					"Design the user-visible behaviour around the residual duplicate risk. A duplicate 'your order shipped' email is a minor annoyance; a duplicate charge is not, which is why charges get keys and emails often do not."
				],
				code: {
					title: "Deterministic keys for downstream calls",
					lang: "ts",
					source: `// Derive the downstream key from your own operation so retries match.
const stripeKey = \`order:\${order.id}:capture:\${order.attemptNumber}\`;
await stripe.paymentIntents.create(params, { idempotencyKey: stripeKey });

// NOT this — a fresh uuid per attempt defeats the entire mechanism:
// { idempotencyKey: crypto.randomUUID() }`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How would you make this API safe to retry?",
						a: "Require an Idempotency-Key header on every mutating request, claimed with a unique constraint in the same transaction as the work, storing the response so a replay returns the original result including the resource id. I would also fingerprint the body so a key reused with different content is rejected rather than silently replayed, and expire keys after a day."
					},
					{
						q: "The client retries and the first request is still running. What do you return?",
						a: "409 with a message telling them to retry shortly. Blocking until the first completes is tempting but ties up a connection and can cascade; returning success would be wrong because I do not yet know the outcome. The key is claimed in state 'in_progress' precisely so this case is detectable rather than racing into a duplicate."
					},
					{
						q: "How do you handle idempotency for a message consumer?",
						a: "The consumer records the message id in the same transaction as its side effect, with a unique constraint absorbing duplicates. That converts at-least-once delivery into effectively-once processing. Where the side effect is external, I pass a deterministic idempotency key derived from the message id, so the downstream system does the deduplication."
					},
					{
						q: "Is idempotency the same as exactly-once?",
						a: "No, and the distinction matters. Exactly-once delivery is not achievable across an unreliable network — the acknowledgement can always be lost. Idempotency accepts that messages and requests arrive more than once and makes the outcome identical to arriving once. That is why the practical guarantee everyone builds on is at-least-once delivery plus idempotent processing."
					}
				]
			}
		],
		related: [
			"/hld/message-queues",
			"/examples/payment",
			"/hld/rest-vs-graphql",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "awesome-system-design-resources",
			href: "https://github.com/ashishps1/awesome-system-design-resources"
		}]
	},
	{
		slug: "bloom-filters",
		title: "Bloom Filters & Probabilistic Structures",
		subtitle: "Answer 'have I definitely not seen this?' in a few bits per item.",
		level: "intermediate",
		minutes: 13,
		tags: [
			"algorithms",
			"performance",
			"data-structures"
		],
		summary: "A Bloom filter answers set membership with no false negatives and a tunable rate of false positives, using roughly 10 bits per element instead of storing the elements. That asymmetry is exactly what a cache or storage layer needs: 'definitely not here' lets you skip an expensive lookup entirely.",
		keyPoints: [
			"No false negatives, tunable false positives. 'Maybe present' or 'definitely absent' — never a wrong 'absent'.",
			"~10 bits per element gives about 1% false positives; ~14 bits gives 0.1%.",
			"Cannot delete from a standard Bloom filter — use a counting or cuckoo filter if you must.",
			"Used in front of expensive lookups: LSM-tree SSTables, cache penetration guards, duplicate detection.",
			"The family extends: HyperLogLog for cardinality, count-min sketch for frequency, quotient/cuckoo filters for deletable membership."
		],
		sections: [
			{
				heading: "How it works",
				steps: [
					{
						title: "A bit array and k hash functions",
						text: "Start with m bits, all zero, and k independent hash functions mapping an element to k positions."
					},
					{
						title: "Insert: set k bits",
						text: "Hash the element k times and set each corresponding bit to 1. Bits are shared between elements, which is where the space saving and the false positives both come from."
					},
					{
						title: "Query: check k bits",
						text: "If any of the k bits is 0, the element was definitely never inserted. If all k are 1, it is probably present — or those bits happened to be set by other elements."
					},
					{
						title: "Tune m and k",
						text: "For n expected elements and a target false-positive rate p, the optimal sizing is m = −n·ln(p)/(ln2)² bits and k = (m/n)·ln2 hashes.",
						detail: "n=1,000,000 and p=1% → m ≈ 9.6 Mbit ≈ 1.2 MB, k ≈ 7"
					}
				],
				diagram: {
					kind: "flow",
					caption: "Any zero bit is a definitive 'no'. All ones is a 'probably'.",
					rows: [[{
						id: "a",
						label: "insert('alice')",
						sub: "sets bits 3, 11, 24",
						tone: "accent"
					}, {
						id: "b",
						label: "insert('bob')",
						sub: "sets bits 7, 11, 30",
						tone: "accent"
					}], [{
						id: "q1",
						label: "query('carol')",
						sub: "bit 5 is 0 → definitely absent",
						tone: "ok"
					}, {
						id: "q2",
						label: "query('dave')",
						sub: "bits 3, 7, 30 all 1 → false positive",
						tone: "warn"
					}]]
				},
				math: [
					{
						label: "Bits per element",
						expr: "m/n = −ln(p) / (ln 2)²",
						result: "p=1% → 9.6 bits",
						note: "p=0.1% → 14.4 bits; p=10% → 4.8 bits."
					},
					{
						label: "Optimal hash count",
						expr: "k = (m/n) × ln 2",
						result: "≈ 7 for p=1%"
					},
					{
						label: "1 M URLs, 1% error",
						expr: "1,000,000 × 9.6 bits",
						result: "≈ 1.2 MB",
						note: "Storing the URLs themselves would be ~60 MB, plus index overhead."
					},
					{
						label: "Cost of a false positive",
						expr: "1% × cost of the lookup you were trying to skip",
						result: "usually negligible",
						note: "You do the expensive check and find nothing — correctness is unaffected."
					}
				]
			},
			{
				heading: "Where it earns its place",
				table: {
					headers: [
						"Use",
						"The expensive thing it skips",
						"Effect of a false positive"
					],
					rows: [
						[
							"LSM-tree / SSTable reads",
							"Reading a file from disk to find a key that is not there",
							"One wasted disk read — this is why Cassandra and RocksDB ship them"
						],
						[
							"Cache penetration guard",
							"A database query for a key that does not exist",
							"One wasted query; still stops the attack pattern"
						],
						[
							"Web crawler URL seen-set",
							"Storing and checking billions of URLs",
							"A page is skipped — acceptable at crawl scale"
						],
						[
							"Username availability",
							"A database round trip for every keystroke",
							"'Taken' shown for a free name — so confirm on submit"
						],
						[
							"Malicious URL / password checks",
							"Downloading or querying a huge list",
							"An extra server check for a safe URL"
						],
						[
							"Deduplicating a stream",
							"A large exact set in memory",
							"A legitimate item dropped as a duplicate — often NOT acceptable"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "Check the direction of the error before using one. A false positive means 'maybe present' when it is absent. That is harmless for skipping a lookup and harmful for deduplication, where it silently discards real data."
				},
				code: {
					title: "Cache penetration guard",
					lang: "ts",
					source: `// Populated with every key that exists, rebuilt periodically.
const exists = new BloomFilter({ expectedItems: 10_000_000, falsePositiveRate: 0.01 });

async function getUser(id: string) {
  if (!exists.mightContain(id)) return null;     // definitively absent: no query at all

  const cached = await cache.get(\`user:\${id}\`);
  if (cached) return cached === NULL_SENTINEL ? null : cached;

  const row = await db.users.byId(id);           // reached only for real or false-positive ids
  await cache.set(\`user:\${id}\`, row ?? NULL_SENTINEL, { ttl: row ? 300 : 30 });
  return row;
}

// New users must be added to the filter on creation, or they are
// permanently invisible — a false NEGATIVE, which the structure
// does not otherwise allow and which you would have introduced yourself.`
				}
			},
			{
				heading: "Limits, and the variants that address them",
				table: {
					headers: [
						"Structure",
						"Answers",
						"Space",
						"Notes"
					],
					rows: [
						[
							"Bloom filter",
							"Membership, no deletion",
							"~10 bits/item at 1%",
							"The baseline; simple and fast"
						],
						[
							"Counting Bloom",
							"Membership with deletion",
							"4× a Bloom filter",
							"Counters instead of bits; can overflow"
						],
						[
							"Cuckoo filter",
							"Membership with deletion",
							"Comparable, often better at low p",
							"Deletes cleanly; supports lookups of fingerprints"
						],
						[
							"Quotient filter",
							"Membership, mergeable",
							"Similar",
							"Cache-friendly, resizable"
						],
						[
							"HyperLogLog",
							"Approximate cardinality",
							"~12 KB for ±2% on billions",
							"Unique visitors without storing ids; merges across shards"
						],
						[
							"Count-min sketch",
							"Approximate frequency",
							"Configurable",
							"Heavy hitters, hot-key detection"
						],
						[
							"Top-K / Space-Saving",
							"The k most frequent items",
							"O(k)",
							"Trending topics, hot tenants"
						]
					]
				},
				bullets: [
					"You cannot resize a Bloom filter. Size for the expected count with headroom, or plan to rebuild — a filter loaded past its design capacity degrades to answering 'maybe' for everything.",
					"You cannot enumerate or delete. If the set shrinks, the only fix is to rebuild from the source of truth, so a periodic rebuild is standard operating practice.",
					"Two filters over the same parameters can be unioned with a bitwise OR — which makes them easy to build in parallel across shards and merge.",
					"Use one fast hash (murmur, xxhash) and derive k indices from two values via double hashing, rather than running k independent hashes."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Where would you use a Bloom filter in this design?",
						a: "In front of any expensive lookup where most answers are 'not found'. In a URL shortener, to check whether a custom alias is taken without hitting the database on every keystroke. In a crawler, as the seen-URL set. In a storage engine, to avoid reading SSTables that cannot contain the key. The common shape is that a false positive costs one wasted lookup and a false negative would be a correctness bug — which is exactly the error profile the structure gives."
					},
					{
						q: "How do you size one?",
						a: "From the expected item count and the false-positive rate I can tolerate. Roughly ten bits per item gives one percent, fourteen gives a tenth of a percent, and the optimal hash count is about 0.7 times the bits per item. For a million items at one percent that is about 1.2 MB and seven hashes. I would add headroom, because loading it past its design count pushes the false-positive rate up sharply."
					},
					{
						q: "What if an item is deleted?",
						a: "A standard Bloom filter cannot delete, because clearing bits would create false negatives for other items sharing them. If deletions are rare, I rebuild periodically from the source of truth. If they are frequent, I would use a cuckoo filter, which supports deletion at comparable space and often better false-positive rates at low thresholds."
					},
					{
						q: "How would you count unique visitors across 100 servers?",
						a: "HyperLogLog. Each server maintains its own sketch — around 12 KB for a couple of percent error — and the sketches merge by taking the maximum per register, so a global count is a cheap union rather than a shuffle of raw ids. Exact counting would mean shipping every visitor id somewhere central, which is orders of magnitude more data for precision nobody needs on a dashboard."
					}
				]
			}
		],
		related: [
			"/hld/caching",
			"/examples/url-shortener",
			"/examples/web-crawler",
			"/hld/estimation"
		],
		furtherReading: [{
			label: "awesome-system-design-resources",
			href: "https://github.com/ashishps1/awesome-system-design-resources"
		}]
	},
	{
		slug: "gossip",
		title: "Gossip Protocols & Failure Detection",
		subtitle: "How a cluster learns who is alive without a central registry.",
		level: "advanced",
		minutes: 12,
		tags: [
			"distributed",
			"membership",
			"operations"
		],
		summary: "In a large cluster, every node needs to know which other nodes exist and which are alive. Asking a central service creates a bottleneck and a single point of failure; having every node ping every other is O(n²) traffic. Gossip solves it the way rumours spread: each node periodically tells a few random peers what it knows, and information reaches everyone in logarithmic time.",
		keyPoints: [
			"Each round, every node exchanges state with a small random subset. Convergence takes O(log n) rounds.",
			"Traffic per node is constant regardless of cluster size — that is the whole point.",
			"Failure detection is a suspicion process, not a fact: a slow node and a dead node look identical.",
			"SWIM adds indirect probing to cut false positives, and a suspicion phase before declaring death.",
			"Gossip gives eventual consistency of membership — it is not a substitute for consensus."
		],
		sections: [
			{
				heading: "Why not the obvious alternatives",
				table: {
					headers: [
						"Approach",
						"Traffic",
						"Failure mode",
						"Used by"
					],
					rows: [
						[
							"Central registry (ZooKeeper, etcd)",
							"O(n) heartbeats to the registry",
							"Registry is a dependency and a bottleneck; strongly consistent though",
							"Kafka (historically), HDFS, many schedulers"
						],
						[
							"All-to-all heartbeats",
							"O(n²) messages per round",
							"Collapses past a few hundred nodes",
							"Small clusters only"
						],
						[
							"Gossip",
							"O(1) per node per round",
							"Eventually consistent view; false positives under load",
							"Cassandra, Consul, Serf, Riak, Redis Cluster"
						]
					]
				},
				math: [
					{
						label: "Convergence",
						expr: "≈ log(n) / log(fanout) rounds",
						result: "1000 nodes, fanout 3 → ~6 rounds",
						note: "At one round per second, the whole cluster knows within seconds."
					},
					{
						label: "Traffic per node",
						expr: "fanout × message size per round",
						result: "constant in n",
						note: "This is why gossip scales where all-to-all does not."
					},
					{
						label: "All-to-all at 1000 nodes",
						expr: "1000 × 999 messages per round",
						result: "≈ 1 M/round",
						note: "Unworkable — and each node processes 999 messages per interval."
					}
				]
			},
			{
				heading: "The mechanics",
				steps: [
					{
						title: "Maintain a local view",
						text: "Each node keeps a table of every peer it knows about: address, state (alive, suspect, dead), and a version — a heartbeat counter or logical clock — used to decide whose information is newer."
					},
					{
						title: "Gossip on a fixed interval",
						text: "Every second or so, pick a small number of random peers and exchange views. Merge by taking the entry with the higher version for each node.",
						detail: "Random selection is what makes convergence exponential rather than linear."
					},
					{
						title: "Detect failure by probing",
						text: "Send a direct ping. If it does not answer within the timeout, do not declare it dead — ask k other nodes to probe it on your behalf. This distinguishes 'the node is dead' from 'my path to it is broken'.",
						detail: "This indirect probe is SWIM's central idea, and it removes most false positives."
					},
					{
						title: "Suspect before declaring dead",
						text: "Mark it suspect and gossip that suspicion. If the node hears it, it refutes with a higher version number and is restored. Only after a suspicion timeout does it become dead."
					},
					{
						title: "Propagate the conclusion",
						text: "The death is gossiped like any other state, so within a few rounds the whole cluster stops routing to it."
					}
				],
				diagram: {
					kind: "sequence",
					caption: "SWIM's indirect probe: three nodes must agree before a node is suspected.",
					actors: [
						{
							id: "a",
							label: "Node A",
							sub: "prober"
						},
						{
							id: "b",
							label: "Node B",
							sub: "target"
						},
						{
							id: "c",
							label: "Node C",
							sub: "helper"
						},
						{
							id: "d",
							label: "Node D",
							sub: "helper"
						}
					],
					messages: [
						{
							from: "a",
							to: "b",
							label: "ping",
							kind: "call"
						},
						{
							from: "a",
							to: "a",
							label: "no ack within timeout",
							kind: "self",
							tone: "warn"
						},
						{
							from: "a",
							to: "c",
							label: "ping-req(B)",
							kind: "call",
							note: "ask others to try — maybe it is my network"
						},
						{
							from: "a",
							to: "d",
							label: "ping-req(B)",
							kind: "call"
						},
						{
							from: "c",
							to: "b",
							label: "ping",
							kind: "call"
						},
						{
							from: "d",
							to: "b",
							label: "ping",
							kind: "call"
						},
						{
							from: "c",
							to: "a",
							label: "no ack",
							kind: "return",
							tone: "warn"
						},
						{
							from: "d",
							to: "a",
							label: "no ack",
							kind: "return",
							tone: "warn"
						},
						{
							from: "a",
							to: "a",
							label: "mark B suspect, gossip it",
							kind: "self",
							tone: "bad",
							note: "B can still refute with a higher incarnation number"
						}
					]
				}
			},
			{
				heading: "The tuning problem",
				bullets: [
					"Every failure detector trades detection time against false positives. A 1-second timeout finds failures fast and flags every GC pause; a 30-second timeout is accurate and leaves traffic going to a dead node for half a minute.",
					"Phi-accrual detectors (used by Cassandra and Akka) replace a fixed timeout with a suspicion level computed from the observed distribution of heartbeat intervals — so a consistently slow network raises the threshold automatically.",
					"Under load, everything looks like a failure: a saturated node cannot answer probes, gets marked dead, its traffic moves elsewhere, and the next node saturates. That feedback loop is a real production failure mode.",
					"Cluster-wide correlated pauses — a bad deploy, a noisy neighbour, a network blip — can produce mass false suspicion. Most implementations have a guard that stops the cluster declaring too many nodes dead at once.",
					"Gossip messages should carry a bounded amount of state; piggyback recent updates rather than sending the full membership table every round."
				],
				callout: {
					kind: "insight",
					text: "The fundamental impossibility: a crashed node and a slow node are indistinguishable over an asynchronous network. Every failure detector is a heuristic that trades speed against accuracy, and any design that claims otherwise is hiding an assumption about timing."
				}
			},
			{
				heading: "What gossip is and is not for",
				diagram: {
					kind: "compare",
					caption: "Two coordination tools for two different jobs.",
					options: [{
						title: "Gossip — eventual",
						good: [
							"Scales to thousands of nodes with constant per-node cost",
							"No single point of failure, no bootstrap dependency",
							"Robust to partial network failures"
						],
						bad: [
							"Views converge eventually, and nodes disagree in the meantime",
							"Cannot decide anything requiring agreement",
							"Tuning false positives is a permanent chore"
						],
						verdict: "Membership, health, and propagating configuration hints."
					}, {
						title: "Consensus — immediate agreement",
						good: ["One authoritative answer; linearizable", "Correct leader election and locks"],
						bad: ["Majority round trip per decision", "Cluster size practically limited to 5-7 voting members"],
						verdict: "Leadership, locks, configuration that must never diverge."
					}]
				},
				bullets: [
					"Large systems use both: gossip for membership and health across hundreds of nodes, plus a small consensus group for decisions that must be unambiguous.",
					"Gossip also carries useful non-membership data: Cassandra spreads schema versions and load information the same way, and Consul spreads service health.",
					"Anti-entropy is gossip applied to data: nodes periodically compare Merkle trees of their key ranges and reconcile differences, which is how leaderless stores heal cold data that read repair never touches."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Why gossip instead of a central registry?",
						a: "Scale and failure independence. A registry is a dependency every node needs to be healthy, and its own availability becomes the cluster's ceiling. Gossip has constant per-node cost regardless of size and keeps working through partial network failures. The trade is that membership is eventually consistent, so I would still keep a small consensus group for anything requiring an authoritative decision, like who is the leader."
					},
					{
						q: "How do you avoid declaring a healthy node dead?",
						a: "Indirect probing first — if my direct ping fails, I ask a few other nodes to try, which distinguishes a dead node from a broken path. Then a suspicion phase, gossiped so the node itself can refute it with a higher incarnation number. And an adaptive threshold rather than a fixed timeout, so a generally slower network does not produce constant false positives."
					},
					{
						q: "How long until the whole cluster knows about a failure?",
						a: "Detection plus propagation. Detection is the probe timeout plus the suspicion window, typically a few seconds. Propagation is logarithmic in cluster size — with a fanout of three and a one-second interval, a thousand nodes converge in roughly six seconds. So the practical answer is seconds, and the tunable part is almost entirely in the detection phase."
					},
					{
						q: "What happens during a network partition?",
						a: "Each side gossips internally and concludes the other side is dead, so you get two self-consistent views of the cluster. Gossip alone will not stop both halves acting, which is exactly why anything requiring uniqueness — a leader, a lock, ownership of a shard — must go through a majority-based mechanism instead. Membership can be eventually consistent; authority cannot."
					}
				]
			}
		],
		related: [
			"/hld/consensus",
			"/hld/availability",
			"/hld/consistent-hashing",
			"/hld/observability"
		],
		furtherReading: [{
			label: "awesome-system-design-resources",
			href: "https://github.com/ashishps1/awesome-system-design-resources"
		}]
	}
];
/**
* High-level design curriculum, ordered as a reading path:
* fundamentals → data → consistency → messaging → resilience → platform.
*/
var hldConcepts = [
	...hldFundamentals,
	...hldData,
	...hldConsistency,
	...hldMessaging,
	...hldResilience,
	...hldPlatform
];
function getHld(slug) {
	return hldConcepts.find((c) => c.slug === slug);
}
//#endregion
export { hldConcepts as n, getHld as t };
