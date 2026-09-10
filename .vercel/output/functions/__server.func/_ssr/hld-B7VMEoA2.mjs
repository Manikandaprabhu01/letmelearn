//#region node_modules/.nitro/vite/services/ssr/assets/hld-B7VMEoA2.js
var list = "https://github.com/ashishps1/awesome-system-design-resources";
/** Extra HLD vocabulary from source 6 (awesome-system-design-resources). */
var awesomeHldConcepts = [
	{
		slug: "availability",
		title: "Availability, Reliability, SPOF",
		subtitle: "Nines, failover, and the box whose death takes the product with it.",
		level: "foundational",
		minutes: 10,
		tags: ["reliability", "Awesome list"],
		summary: "Source 6's core-concepts spine. Availability is 'the system answers'. Reliability is 'it answers correctly over time'. A single point of failure is a box, disk, AZ, or person whose loss takes the SLO with it.",
		sections: [{
			heading: "Nines are a budget",
			table: {
				headers: [
					"Nines",
					"Downtime / year",
					"What it usually costs"
				],
				rows: [
					[
						"99% (two)",
						"3.5 days",
						"A weekend off-call, a single AZ"
					],
					[
						"99.9% (three)",
						"8.8 hours",
						"Multi-AZ, automated failover, on-call"
					],
					[
						"99.99% (four)",
						"52 minutes",
						"Multi-region or very fast AZ failover, load tests, game days"
					],
					[
						"99.999% (five)",
						"5 minutes",
						"Active-active, and you still miss it on a bad deploy"
					]
				]
			},
			body: ["Interviewers want the pairing: name the SLO, name the SPOF it implies, name the failover. 'We will be highly available' is not an answer."]
		}, {
			heading: "Failover is a designed action",
			bullets: [
				"Health check → remove from the load balancer (soft).",
				"Promote a replica, or shift DNS / anycast to a warm region (hard).",
				"RPO / RTO: how much data you may lose, how long you may be down. A replica that is 30 minutes behind is not a failover plan.",
				"Fault tolerance is remaining correct *during* a failure, not merely recovering after."
			],
			callout: {
				kind: "insight",
				title: "SPOF hunt",
				text: "Primary DB, the lock service, the CI system that cannot deploy a fix, the one person who knows the runbook. Draw them. Then say which ones you will actually fix in this interview."
			}
		}],
		related: [
			"/hld/scaling",
			"/hld/replication",
			"/hld/circuit-breaker",
			"/hld/consensus"
		],
		furtherReading: [{
			label: "Awesome list — availability",
			href: "https://algomaster.io/learn/system-design/availability"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "idempotency",
		title: "Idempotency",
		subtitle: "The same request, twice, is still one effect.",
		level: "foundational",
		minutes: 9,
		tags: ["api", "Awesome list"],
		summary: "Retries are how networks survive. Idempotency is how retries do not double-charge. An idempotency key on the write path, stored with the result, turns at-least-once delivery into exactly-once effects.",
		sections: [{
			heading: "Where it shows up",
			bullets: [
				"Client retries after a timeout — the server may have applied the write.",
				"Queue at-least-once: the worker died after the side effect, before ack.",
				"Webhook deliveries. Stripe will retry; your handler must not ship twice."
			],
			table: {
				headers: ["Pattern", "How"],
				rows: [
					["PUT / resource-id", "Natural: last write wins, same body"],
					["Idempotency-Key header", "Store (key → response). Replay the stored response on a duplicate"],
					["Idempotent consumer", "Dedup table of event ids, unique constraint"],
					["Ledger", "Insert a journal row keyed by (account, op_id) before mutating balance"]
				]
			},
			callout: {
				kind: "warn",
				title: "Keys expire",
				text: "Keep the key long enough to cover the retry window (hours, not seconds). A unique constraint in the DB beats a cache you can evict."
			}
		}],
		related: [
			"/examples/payment",
			"/examples/job-scheduler",
			"/examples/ticket-booking",
			"/hld/rate-limiting"
		],
		furtherReading: [{
			label: "Awesome list — idempotency",
			href: "https://algomaster.io/learn/system-design/idempotency"
		}, {
			label: "Stripe — idempotent requests",
			href: "https://stripe.com/blog/payment-api-design"
		}]
	},
	{
		slug: "consensus",
		title: "Consensus (Raft / Paxos)",
		subtitle: "A cluster agrees on the next byte of the log.",
		level: "advanced",
		minutes: 12,
		tags: ["distributed", "Awesome list"],
		summary: "Source 6 lists consensus next to heartbeats and gossip. In an interview you do not derive Paxos. You say: a replicated log, a leader, a majority, and why the lock service / config / metadata plane needs this when Dynamo-style quorum does not.",
		sections: [{
			heading: "What you actually use",
			table: {
				headers: ["System", "Uses consensus for"],
				rows: [
					["etcd, ZooKeeper, Chubby", "The whole API — small, strongly consistent state"],
					["Kafka (KRaft / ZK)", "Controller, membership, partition leaders"],
					["Spanner / Cockroach", "Per-range Raft groups under the SQL"],
					["Your product DB", "Usually not — you take RDS/Cloud SQL's word for it"]
				]
			},
			body: ["Raft: elect a leader, leader appends to a log, majority ack, then apply. A minority partition cannot elect a second leader because it cannot gather a majority. That is the whole trick."],
			diagram: {
				kind: "flow",
				caption: "A 5-node Raft group, majority = 3",
				rows: [[
					{
						id: "l",
						label: "Leader",
						tone: "accent"
					},
					{
						id: "f1",
						label: "Follower"
					},
					{
						id: "f2",
						label: "Follower"
					},
					{
						id: "f3",
						label: "Follower"
					},
					{
						id: "f4",
						label: "Follower"
					}
				]]
			}
		}, {
			heading: "Versus Dynamo quorum",
			body: ["Sloppy quorum (W + R > N) gives you durability and a high chance of reading the latest, not a single agreed history. If you need 'exactly one primary for this shard', that is consensus. If you need 'the shopping cart eventually merges', that is Dynamo. Do not mix the words."]
		}],
		related: [
			"/hld/quorum",
			"/hld/cap-theorem",
			"/examples/distributed-lock",
			"/hld/gossip"
		],
		furtherReading: [{
			label: "Raft paper (understand this one)",
			href: "https://raft.github.io/raft.pdf"
		}, {
			label: "Paxos (source 6)",
			href: "https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf"
		}]
	},
	{
		slug: "gossip",
		title: "Gossip Protocol",
		subtitle: "Each node tells a few peers the news. The cluster finds out.",
		level: "intermediate",
		minutes: 8,
		tags: ["distributed", "Awesome list"],
		summary: "Epidemic dissemination. Used for membership, failure detection, and eventually-consistent metadata (Dynamo, Cassandra, SWIM). Not for the money path.",
		sections: [{
			heading: "How it spreads",
			numbered: [
				"Every node keeps a view of the cluster (alive, suspect, dead, plus a version / heartbeat counter).",
				"On a tick, pick a small random set of peers and exchange views. Union, last-write-wins on versions.",
				"If you have not heard from A in T1, mark suspect; after T2, dead. A later gossip can refute."
			],
			table: {
				headers: ["Good for", "Bad for"],
				rows: [["Membership, schema version, ring state", "Leader election, once-only side effects"], ["Surviving partitions without a coordinator", "Bounded latency to 'everyone knows'"]]
			},
			callout: {
				kind: "note",
				title: "Pair with the KV example",
				text: "Dynamo gossips membership and the token ring. Hinted handoff and sloppy quorum are the write path. Gossip is how nodes learn who is back."
			}
		}],
		related: [
			"/examples/kv-store",
			"/hld/consistent-hashing",
			"/hld/consensus"
		],
		furtherReading: [{
			label: "Gossip protocol explained",
			href: "http://highscalability.com/blog/2023/7/16/gossip-protocol-explained.html"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "rest-vs-graphql",
		title: "REST vs GraphQL vs RPC",
		subtitle: "Three ways to ship a function call over the network.",
		level: "foundational",
		minutes: 9,
		tags: ["api", "Awesome list"],
		summary: "Source 6's API spine. REST is resources and verbs. GraphQL is a typed query the client shapes. RPC (gRPC) is methods and protobufs. Pick from payload shape, chattiness, and who owns the contract.",
		sections: [{
			heading: "When to open which door",
			table: {
				headers: [
					"Style",
					"Pick when",
					"Cost"
				],
				rows: [
					[
						"REST + JSON",
						"Public HTTP APIs, caching, wide client mix",
						"Over/under-fetch; versioning via URL or headers"
					],
					[
						"GraphQL",
						"Many clients, nested views, BFF-shaped products",
						"N+1 resolvers, a hard cache, auth per field"
					],
					[
						"gRPC",
						"Service-to-service, streaming, strict schemas",
						"Ugly in a browser without a gateway"
					]
				]
			},
			bullets: ["Idempotency and pagination are API design, not REST-vs-RPC. Cover them either way.", "An API gateway can present REST/GraphQL to the world and speak gRPC behind it."]
		}],
		related: [
			"/hld/api-gateway",
			"/hld/websockets",
			"/hld/idempotency"
		],
		furtherReading: [{
			label: "Awesome list — REST vs GraphQL",
			href: "https://blog.algomaster.io/p/rest-vs-graphql"
		}, {
			label: "Awesome list — REST vs RPC",
			href: "https://blog.algomaster.io/p/106604fb-b746-41de-88fb-60e932b2ff68"
		}]
	},
	{
		slug: "pub-sub",
		title: "Pub/Sub vs Message Queues",
		subtitle: "Fan-out a fact, or hand a job to one worker.",
		level: "foundational",
		minutes: 8,
		tags: ["async", "Awesome list"],
		summary: "Source 6 splits pub/sub from message queues. A queue (work queue) delivers each message to one consumer in a group. Pub/sub delivers a copy to every subscription. Kafka can be both, depending on how you assign consumer groups.",
		sections: [{
			heading: "Choose the primitive",
			table: {
				headers: ["Need", "Primitive"],
				rows: [
					["Thumbnail this upload once", "Work queue (SQS, Rabbit, a Kafka group with one group id)"],
					["Cache invalidation, 'user updated', metrics", "Pub/sub (SNS, Redis Pub/Sub, NATS, Kafka with many groups)"],
					["Replay history, several independent downstreams", "A log (Kafka) — each downstream is a consumer group"]
				]
			},
			callout: {
				kind: "insight",
				title: "CDC sits here",
				text: "Change data capture (Debezium, Dynamo streams) is pub/sub of the database's own log. Source 6 lists it next to queues on purpose."
			}
		}],
		related: [
			"/hld/message-queues",
			"/examples/distributed-mq",
			"/examples/notification"
		],
		furtherReading: [{
			label: "Awesome list — pub/sub",
			href: "https://algomaster.io/learn/system-design/pub-sub"
		}, {
			label: "Awesome list — CDC",
			href: "https://algomaster.io/learn/system-design/change-data-capture-cdc"
		}]
	}
];
var hldConcepts = [...[
	{
		slug: "scaling",
		title: "Scale from Zero to Millions",
		subtitle: "The vertical-to-horizontal path every large system walks.",
		level: "foundational",
		minutes: 12,
		tags: [
			"scale",
			"availability",
			"Alex Xu Vol 1"
		],
		summary: "Start with one server, then split concerns, add a load balancer, cache, replica reads, and finally shard writes. This is chapter 1 of Alex Xu's Volume 1 — the skeleton of almost every later design.",
		sections: [
			{
				heading: "One box, then a seam",
				body: ["A single machine that serves web, app, and database is fine for a prototype. The first production seam is almost always splitting the data store from the compute, so you can scale them independently and take backups without taking the site down.", "Vertical scaling (bigger box) is the cheapest move until you hit hardware ceilings, noisy-neighbor limits, or a single-AZ blast radius. Horizontal scaling (more boxes) is how internet products survive."],
				table: {
					headers: [
						"Move",
						"What you buy",
						"What it costs"
					],
					rows: [[
						"Vertical",
						"Simplicity, stronger transactions",
						"Hard ceiling, bigger blast radius"
					], [
						"Horizontal",
						"Linear-ish capacity, failover",
						"State, consistency, ops complexity"
					]]
				}
			},
			{
				heading: "The classic growth path",
				numbered: [
					"Users → web server → database on one host.",
					"Split web/app from database. Put the database on its own instance.",
					"Add a load balancer and a second app server. Sessions move to Redis or become JWT/stateless.",
					"Add a replica for reads. Writes still hit the primary.",
					"Put a cache in front of hot keys (Redis/Memcached).",
					"Push static assets to a CDN.",
					"When the primary cannot take more writes, shard by a well-chosen key.",
					"Decouple slow work with a message queue and workers."
				],
				diagram: {
					kind: "flow",
					caption: "A typical mid-scale web stack",
					rows: [[
						{
							id: "u",
							label: "Clients"
						},
						{
							id: "dns",
							label: "DNS + CDN",
							sub: "static"
						},
						{
							id: "lb",
							label: "Load balancer",
							tone: "accent"
						},
						{
							id: "app",
							label: "App fleet"
						}
					], [
						{
							id: "cache",
							label: "Cache",
							sub: "Redis"
						},
						{
							id: "q",
							label: "Queue",
							sub: "async"
						},
						{
							id: "db",
							label: "Primary + replicas"
						}
					]]
				}
			},
			{
				heading: "Stateless compute is the unlock",
				body: ["Horizontal scale only works if any app box can handle any request. Sticky sessions feel convenient and then become a pager. Store session state in Redis or encode it in a signed token. Keep local disk ephemeral."],
				callout: {
					kind: "insight",
					title: "Interview cue",
					text: "When an interviewer says 'scale to millions of users', walk this ladder out loud. Pause after each step and name the bottleneck it removes."
				}
			}
		],
		related: [
			"/examples/scale-to-millions",
			"/hld/load-balancing",
			"/hld/caching"
		],
		furtherReading: [{
			label: "roadmap.sh — System Design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "load-balancing",
		title: "Load Balancing",
		subtitle: "Spread traffic, hide failures, keep a single hostname.",
		level: "foundational",
		minutes: 10,
		tags: ["networking", "availability"],
		summary: "A load balancer is a reverse proxy that picks a healthy backend. Algorithms, health checks, L4 vs L7, and where you place the balancer decide whether you actually get the availability you paid for.",
		sections: [
			{
				heading: "Why it exists",
				body: ["Without a balancer, clients pin to one IP. That box dies, the product dies. A balancer gives you one stable virtual IP (or anycast address), health-checked backends, and a place to terminate TLS."],
				bullets: ["L4 (TCP/UDP): fast, connection-aware, no HTTP insight. HAProxy, NLB, IPVS.", "L7 (HTTP): path routing, header affinity, gRPC, retries, auth. Envoy, Nginx, ALB."]
			},
			{
				heading: "How a request is chosen",
				table: {
					headers: [
						"Algorithm",
						"Picks",
						"Watch-out"
					],
					rows: [
						[
							"Round robin",
							"Next server in the list",
							"Uneven if work per request varies"
						],
						[
							"Least connections",
							"Backend with fewest open conns",
							"Needs accurate connection tracking"
						],
						[
							"Least response time",
							"Fastest healthy backend",
							"Herding onto the warm cache box"
						],
						[
							"Hash (IP / cookie / key)",
							"Sticky mapping",
							"Remap on fleet change unless consistent hash"
						],
						[
							"Weighted",
							"Capacity-aware share",
							"Weights go stale"
						]
					]
				}
			},
			{
				heading: "Health and failure",
				body: ["Active health checks (HTTP /c/health) plus passive ejection (too many 5xx) keep bad boxes out of rotation. Always fail closed on a dead fleet: a balancer that sends traffic into a black hole is worse than DNS failover.", "Place balancers in pairs, across zones. For global traffic, DNS or anycast sits in front of regional balancers."],
				diagram: {
					kind: "flow",
					caption: "Two layers: global then local",
					rows: [[
						{
							id: "c",
							label: "Client"
						},
						{
							id: "g",
							label: "Global LB",
							sub: "DNS / anycast",
							tone: "accent"
						},
						{
							id: "r",
							label: "Regional LB"
						},
						{
							id: "a",
							label: "App A / B / C"
						}
					]]
				}
			}
		],
		related: [
			"/playgrounds/load-balancer",
			"/hld/api-gateway",
			"/hld/consistent-hashing"
		],
		furtherReading: [{
			label: "roadmap.sh question — load balancers",
			href: "https://roadmap.sh/questions/system-design"
		}],
		playground: "load-balancer"
	},
	{
		slug: "caching",
		title: "Caching",
		subtitle: "Store the answer next to the question.",
		level: "foundational",
		minutes: 11,
		tags: ["performance", "redis"],
		summary: "A cache trades freshness for latency and database load. Placement, invalidation, and stampede control matter more than the cache product you pick.",
		sections: [
			{
				heading: "Where a cache can live",
				table: {
					headers: [
						"Layer",
						"What you cache",
						"Who invalidates"
					],
					rows: [
						[
							"Browser / CDN",
							"Static assets, public pages",
							"TTL + purge API"
						],
						[
							"API gateway / reverse proxy",
							"Idempotent GETs",
							"Cache-Control"
						],
						[
							"Application (Redis)",
							"Sessions, rendered feeds, query results",
							"App code on write"
						],
						[
							"Database buffer pool",
							"Pages / documents",
							"Engine"
						]
					]
				}
			},
			{
				heading: "Read and write patterns",
				bullets: [
					"Cache-aside (lazy): app reads cache, on miss reads DB and fills cache. Simple, slightly stale.",
					"Read-through: cache library loads on miss. App never talks to DB for reads.",
					"Write-through: write hits cache and DB together. Consistent, slower writes.",
					"Write-behind: write hits cache, DB is flushed async. Fast, risk of loss.",
					"Refresh-ahead: refresh before TTL if the key is hot."
				],
				callout: {
					kind: "warn",
					title: "Stampede / avalanche",
					text: "When a hot key expires, thousands of requests pile onto the database. Hold a lock (or singleflight) on refill, add TTL jitter, and consider serving stale while revalidating."
				}
			},
			{
				heading: "Eviction",
				body: ["LRU and LFU cover most product caches. Size the working set, not 'all data'. Measure hit rate; a 50% hit rate on a huge keyspace is often worse than a smaller, hotter cache."]
			}
		],
		related: [
			"/playgrounds/lru-cache",
			"/lld/lru-cache",
			"/hld/cdn"
		],
		furtherReading: [{
			label: "roadmap.sh — caching",
			href: "https://roadmap.sh/system-design"
		}],
		playground: "lru-cache"
	},
	{
		slug: "cdn",
		title: "Content Delivery Networks",
		subtitle: "Put bytes next to the user.",
		level: "foundational",
		minutes: 8,
		tags: ["latency", "edge"],
		summary: "A CDN is a globally distributed cache for static — and increasingly dynamic — content. You use it when users are far from origin, objects are cacheable, or you need DDoS shelter and TLS at the edge.",
		sections: [{
			heading: "How a request is served",
			numbered: [
				"DNS (or anycast) maps the asset hostname to a nearby POP.",
				"If the object is cached and fresh, the POP returns it.",
				"On miss, the POP fetches origin (or a regional shield), stores, and serves.",
				"Invalidation is TTL, versioned filenames (hash in the path), or an explicit purge."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "u",
						label: "User in Chennai"
					},
					{
						id: "pop",
						label: "Nearby POP",
						tone: "accent"
					},
					{
						id: "shield",
						label: "Regional shield"
					},
					{
						id: "origin",
						label: "Origin",
						sub: "S3 / app"
					}
				]]
			}
		}, {
			heading: "When not to CDN",
			body: ["Highly personalized HTML with no shared fragments, or data that must be consistent to the millisecond (trading quotes, inventory locks), should stay on origin. Cache the shell; keep the payload dynamic."]
		}],
		related: [
			"/hld/caching",
			"/examples/youtube",
			"/hld/dns"
		],
		furtherReading: [{
			label: "roadmap.sh — CDN",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "replication",
		title: "Replication",
		subtitle: "Copies of the data, for reads and for disasters.",
		level: "foundational",
		minutes: 11,
		tags: ["databases", "availability"],
		summary: "Replication copies writes from a primary to one or more secondaries. It buys read scale and durability. It also creates replication lag, failover puzzles, and split-brain if you are careless with leadership.",
		sections: [{
			heading: "Topologies",
			table: {
				headers: [
					"Shape",
					"Writes",
					"Reads",
					"Typical use"
				],
				rows: [
					[
						"Single primary + replicas",
						"Primary only",
						"Replicas (async) or primary",
						"Most web apps"
					],
					[
						"Multi-primary",
						"Any node",
						"Any node",
						"Multi-region writes, conflict risk"
					],
					[
						"Leaderless (Dynamo-style)",
						"Quorum of replicas",
						"Quorum of replicas",
						"AP stores, shopping carts"
					]
				]
			}
		}, {
			heading: "Sync vs async",
			body: ["Synchronous replication waits for a replica to ack before committing. You do not lose acknowledged writes if the primary dies — at the cost of latency and availability if the replica is slow.", "Asynchronous replication is fast and can lose the last few seconds on failover. Postgres streaming, MySQL replicas, and most analytics pipelines are async."],
			callout: {
				kind: "insight",
				title: "Read-your-writes",
				text: "If a user posts then immediately refreshes, a lagging replica lies. Sticky primary for that session, or version/timestamp checks, or causal tokens solve it."
			}
		}],
		related: [
			"/hld/consistency",
			"/hld/sharding",
			"/hld/quorum"
		],
		furtherReading: [{
			label: "roadmap.sh — replication",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "sharding",
		title: "Sharding and Partitioning",
		subtitle: "Split the working set so one machine is no longer the ceiling.",
		level: "intermediate",
		minutes: 12,
		tags: ["databases", "scale"],
		summary: "Sharding splits a dataset by a key so each node owns a slice. The key you pick is the most expensive decision in the design — it decides hotspots, joins, and how painful resharding will be.",
		sections: [{
			heading: "Ways to split",
			table: {
				headers: [
					"Strategy",
					"How",
					"Failure mode"
				],
				rows: [
					[
						"Hash",
						"hash(key) mod N, or a hash ring",
						"Range queries scatter; reshard moves keys"
					],
					[
						"Range",
						"A–F on shard 1, G–L on 2",
						"Hot ranges (new IDs, recent time)"
					],
					[
						"Directory / lookup",
						"A service maps key → shard",
						"Directory is a dependency"
					],
					[
						"Geo / tenant",
						"City, company, or customer",
						"One tenant becomes a whale"
					]
				]
			},
			callout: {
				kind: "note",
				title: "Alex Xu + Dynamo",
				text: "Consistent hashing (Volume 1, chapter 5) is the usual answer when you must add or remove shards without reshuffling everything. Virtual nodes spread load."
			}
		}, {
			heading: "Cross-shard pain",
			bullets: [
				"Joins become application-side or are forbidden. Denormalize.",
				"Unique constraints are per-shard unless you add a global index.",
				"Transactions across shards need sagas or 2PC. Prefer a shard key that keeps a transaction local.",
				"Scatter-gather queries (fan out to all shards) have tail-latency equal to the slowest shard."
			]
		}],
		related: [
			"/hld/consistent-hashing",
			"/examples/kv-store",
			"/hld/sql-vs-nosql"
		],
		furtherReading: [{
			label: "roadmap.sh — sharding",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "cap-theorem",
		title: "CAP Theorem",
		subtitle: "On a partition you choose: lie, or refuse.",
		level: "foundational",
		minutes: 9,
		tags: ["distributed systems", "theory"],
		summary: "CAP says that during a network partition a distributed system can be consistent or available, not both. Partition tolerance is not optional on a real network, so the practical choice is CP vs AP — and PACELC reminds you that even without a partition you still pay a latency/consistency tax.",
		sections: [{
			heading: "The three letters",
			bullets: [
				"Consistency: every read sees the latest write (linearizable, for the original proof).",
				"Availability: every request to a non-failed node gets a (non-error) response.",
				"Partition tolerance: the system keeps choosing C or A when messages are dropped."
			],
			table: {
				headers: [
					"Lean",
					"On partition",
					"Examples"
				],
				rows: [
					[
						"CP",
						"Refuse or wait rather than serve stale/conflicting data",
						"ZooKeeper, etcd, MongoDB default, HBase, most SQL primaries"
					],
					[
						"AP",
						"Serve something; repair later",
						"Dynamo, Cassandra, Riak, DNS, shopping-cart stores"
					],
					[
						"CA (lab only)",
						"Needs a partition-free network",
						"Single-node Postgres"
					]
				]
			}
		}, {
			heading: "PACELC",
			body: ["If Partition, choose A or C; Else, choose Latency or Consistency. Spanner leans C even across regions (with TrueTime). Cassandra leans A and L, with tunable quorums when you want more C."],
			callout: {
				kind: "insight",
				title: "Interview",
				text: "Pick the business invariant first. Banks: CP. Social likes: AP. Then name the mechanism (quorum, leader, CRDT) that implements it."
			}
		}],
		related: [
			"/playgrounds/cap-theorem",
			"/hld/consistency",
			"/hld/quorum"
		],
		furtherReading: [{
			label: "roadmap.sh — CAP",
			href: "https://roadmap.sh/questions/system-design"
		}],
		playground: "cap-theorem"
	},
	{
		slug: "consistency",
		title: "Consistency Models",
		subtitle: "How stale is allowed to be, and who can notice.",
		level: "intermediate",
		minutes: 10,
		tags: ["distributed systems"],
		summary: "Strong, sequential, causal, and eventual consistency are a spectrum of promises. Stronger models cost latency and availability; weaker models require the product to tolerate ghosts.",
		sections: [{
			heading: "A usable ladder",
			table: {
				headers: [
					"Model",
					"Promise",
					"Product fit"
				],
				rows: [
					[
						"Linearizable / strong",
						"There is a single real-time order",
						"Payments, inventory locks, leader election"
					],
					[
						"Sequential",
						"All clients see the same order, not necessarily real-time",
						"Replicated state machines"
					],
					[
						"Causal",
						"Happens-before is preserved; concurrent writes may diverge",
						"Comment threads, collaborative presence"
					],
					[
						"Read-your-writes / session",
						"A client sees its own writes",
						"Profile edits, posting then refresh"
					],
					[
						"Eventual",
						"If writes stop, replicas converge",
						"DNS, like counts, shopping carts (with merge)"
					]
				]
			}
		}, {
			heading: "How you get there",
			body: ["Single-leader + sync replica ≈ strong for that region. Quorum R + W > N gives strong-enough reads if you use the same N replicas and no sloppy membership. CRDTs and version vectors merge AP writes. Idempotent writes and exactly-once *effects* (not messages) keep sagas honest."]
		}],
		related: [
			"/hld/replication",
			"/hld/cap-theorem",
			"/examples/google-drive"
		],
		furtherReading: [{
			label: "roadmap.sh — consistency",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "message-queues",
		title: "Message Queues and Streams",
		subtitle: "Decouple in time so producers do not wait on consumers.",
		level: "intermediate",
		minutes: 12,
		tags: ["async", "kafka"],
		summary: "Queues absorb spikes, isolate failures, and let you retry. Streams (log-shaped) keep history so many consumer groups can replay. Choose by whether you need competing consumers, fan-out, ordering, or long retention.",
		sections: [
			{
				heading: "Queue vs log",
				table: {
					headers: [
						"",
						"Broker queue (SQS, RabbitMQ)",
						"Log / stream (Kafka, Pulsar, Kinesis)"
					],
					rows: [
						[
							"Shape",
							"Messages disappear when acked",
							"Append-only, retained by time/size"
						],
						[
							"Consumers",
							"Competing workers share the work",
							"Consumer groups; each group has its own offset"
						],
						[
							"Replay",
							"Hard",
							"First-class"
						],
						[
							"Ordering",
							"Per-queue or FIFO variant",
							"Per partition key"
						]
					]
				}
			},
			{
				heading: "Delivery promises",
				bullets: [
					"At-most-once: fire and forget. Lost messages stay lost.",
					"At-least-once: retry until ack. Consumers must be idempotent.",
					"Effectively-once: at-least-once plus idempotency keys / transactional outbox. There is no magic network exactly-once."
				],
				callout: {
					kind: "insight",
					title: "Volume 2, ch. 4",
					text: "Alex Xu's distributed message queue design walks through topics, partitions, replicas, ISRs, and consumer groups — Kafka's model, taught as an interview question."
				}
			},
			{
				heading: "Patterns",
				numbered: [
					"Transactional outbox: write DB row + outbox row in one transaction; a publisher drains the outbox.",
					"Saga: each step emits a command; failures emit compensations.",
					"Backpressure: bound the queue; slow the producer rather than OOM the broker.",
					"Poison messages: after N retries, park on a DLQ."
				]
			}
		],
		related: [
			"/examples/distributed-mq",
			"/examples/notification",
			"/hld/circuit-breaker"
		],
		furtherReading: [{
			label: "roadmap.sh — queues",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "consistent-hashing",
		title: "Consistent Hashing",
		subtitle: "Move as little data as possible when the fleet changes.",
		level: "intermediate",
		minutes: 11,
		tags: ["Alex Xu Vol 1", "sharding"],
		summary: "Place both keys and servers on a hash ring. A key belongs to the first server clockwise. Adding a server only steals keys from its neighbor — O(1/n) movement instead of reshuffling everything. Virtual nodes smear load.",
		sections: [{
			heading: "The modulo problem",
			body: ["hash(key) mod N is simple until N changes. Almost every key remaps. Caches go cold. Databases rebalance all night. Consistent hashing was invented so DHTs and caches could grow without a fire drill."]
		}, {
			heading: "Ring + virtual nodes",
			numbered: [
				"Hash each server onto the ring (often many virtual nodes per physical box).",
				"Hash the key onto the same ring.",
				"Walk clockwise to the first vnode; that box owns the key.",
				"On add/remove, only keys in the affected arcs move."
			],
			diagram: {
				kind: "flow",
				caption: "Key K lands on the next vnode clockwise",
				rows: [[
					{
						id: "k",
						label: "hash(K)"
					},
					{
						id: "a",
						label: "vnode A"
					},
					{
						id: "b",
						label: "vnode B",
						tone: "accent",
						sub: "owner"
					},
					{
						id: "c",
						label: "vnode C"
					}
				]]
			},
			callout: {
				kind: "note",
				title: "Where it shows up",
				text: "Dynamo, Cassandra, Discord, CDNs, and request-routing layers. Alex Xu Volume 1, chapter 5 is the canonical interview write-up."
			}
		}],
		related: [
			"/playgrounds/consistent-hashing",
			"/examples/consistent-hashing",
			"/examples/kv-store"
		],
		furtherReading: [{
			label: "Karger et al. — Consistent Hashing and Random Trees",
			href: "https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf"
		}],
		playground: "consistent-hashing"
	},
	{
		slug: "sql-vs-nosql",
		title: "SQL vs NoSQL",
		subtitle: "Pick the model that matches the access pattern, not the hype cycle.",
		level: "foundational",
		minutes: 10,
		tags: ["databases"],
		summary: "Relational systems win on joins, constraints, and multi-row transactions. Non-relational systems win on flexible documents, wide-column write throughput, key-value latency, or graph traversals. Most large products run more than one.",
		sections: [{
			heading: "A decision table",
			table: {
				headers: [
					"Need",
					"Reach for",
					"Examples"
				],
				rows: [
					[
						"Transactions, reporting, strong relations",
						"SQL (row store)",
						"Postgres, MySQL"
					],
					[
						"Document blobs with sparse fields",
						"Document",
						"MongoDB, DynamoDB document"
					],
					[
						"Huge write streams, range scans by PK",
						"Wide column",
						"Cassandra, Bigtable, HBase"
					],
					[
						"Hot key get/put, sessions, leaderboards",
						"Key-value / memory",
						"Redis, DynamoDB, Memcached"
					],
					[
						"Friend-of-friend, recommendations",
						"Graph",
						"Neo4j, Neptune"
					],
					[
						"Append search / logs",
						"Search / OLAP",
						"Elasticsearch, ClickHouse, BigQuery"
					]
				]
			}
		}, {
			heading: "Polyglot is normal",
			body: ["YouTube metadata in sharded MySQL, videos in blob storage, comments in another store, search in an inverted index. The interview skill is naming the primary store for the core invariant, then satellite stores for the rest."]
		}],
		related: [
			"/hld/sharding",
			"/examples/kv-store",
			"/hld/caching"
		],
		furtherReading: [{
			label: "roadmap.sh — SQL vs NoSQL",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "api-gateway",
		title: "API Gateways and Proxies",
		subtitle: "One front door for many services.",
		level: "intermediate",
		minutes: 9,
		tags: ["microservices", "edge"],
		summary: "An API gateway is an L7 reverse proxy with product features: authn, rate limits, routing, aggregation, and observability. A reverse proxy is the same idea at a lower level of ambition (Nginx, Caddy, HAProxy).",
		sections: [{
			heading: "What belongs at the edge",
			bullets: [
				"TLS termination and HTTP/2 or HTTP/3.",
				"Authentication (JWT, session) and coarse authorization.",
				"Rate limiting and bot management.",
				"Path/host routing to services, including canaries.",
				"Request aggregation for mobile (BFF).",
				"Access logs, tracing headers, WAF."
			],
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "Client",
						items: ["iOS / Web / Partner"]
					},
					{
						title: "Edge",
						items: [
							"CDN",
							"WAF",
							"API gateway"
						]
					},
					{
						title: "Services",
						items: [
							"User",
							"Feed",
							"Media",
							"Billing"
						]
					}
				]
			}
		}, {
			heading: "What does not belong",
			body: ["Business transactions and fine-grained domain rules. If the gateway knows how an order is priced, you have built a god service at the worst possible hop."]
		}],
		related: [
			"/hld/load-balancing",
			"/hld/rate-limiting",
			"/examples/rate-limiter"
		],
		furtherReading: [{
			label: "roadmap.sh — API gateway",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "rate-limiting",
		title: "Rate Limiting (HLD)",
		subtitle: "Protect the system, price the API, keep neighbors from starving.",
		level: "intermediate",
		minutes: 14,
		tags: ["Alex Xu Vol 1", "redis"],
		summary: "A rate limiter counts work per key (user, IP, API token) and rejects or delays surplus. Alex Xu Volume 1 chapter 4 is the standard interview treatment: algorithms, Redis, rules, and 429s. Open the lab to see all five algorithms move.",
		sections: [
			{
				heading: "Where it sits",
				body: ["Usually a middleware or sidecar in front of the API, or a filter on the gateway. Rules live in config: 'premium users, 1000 req/hour; free, 100; marketing SMS, 5/day'. Counters live in Redis because they must be fast, shared across app boxes, and naturally TTL'd."],
				diagram: {
					kind: "flow",
					caption: "Alex Xu-style rate limiter path",
					rows: [[
						{
							id: "c",
							label: "Client"
						},
						{
							id: "mw",
							label: "Limiter middleware",
							tone: "accent"
						},
						{
							id: "redis",
							label: "Redis counters"
						},
						{
							id: "api",
							label: "API servers",
							tone: "ok"
						}
					]]
				}
			},
			{
				heading: "Five algorithms",
				table: {
					headers: [
						"Algorithm",
						"Burst",
						"Memory",
						"Notes"
					],
					rows: [
						[
							"Token bucket",
							"Yes, up to capacity",
							"O(1) / key",
							"Stripe, AWS APIs. Best default."
						],
						[
							"Leaky bucket",
							"No (smooth output)",
							"O(1) or queue",
							"Good for downstreams that cannot spike."
						],
						[
							"Fixed window",
							"Boundary spike (2x)",
							"O(1)",
							"Simplest. Easy to abuse at edges."
						],
						[
							"Sliding window log",
							"Accurate",
							"O(requests)",
							"Precise, expensive."
						],
						[
							"Sliding window counter",
							"Mostly accurate",
							"O(1)",
							"Weighted previous + current window."
						]
					]
				}
			},
			{
				heading: "Distributed details",
				bullets: [
					"Race conditions: INCR is atomic; token-bucket refill needs a Lua script or a lock.",
					"Response: HTTP 429, Retry-After, X-RateLimit-Remaining / Limit / Reset.",
					"Hard vs soft: drop vs queue. APIs usually drop; notifications often queue.",
					"Keys: user ID or API key, not only IP (NAT, mobile). Sometimes both."
				],
				callout: {
					kind: "insight",
					title: "Lab",
					text: "The rate-limiter lab lets you fire bursts against all five algorithms, matching the interactive playground style of the LLD rate-limiter site."
				}
			}
		],
		related: [
			"/playgrounds/rate-limiter",
			"/examples/rate-limiter",
			"/lld/rate-limiter"
		],
		furtherReading: [{
			label: "Rate limiter playground (LLD demo)",
			href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html"
		}],
		playground: "rate-limiter"
	},
	{
		slug: "bloom-filters",
		title: "Bloom Filters",
		subtitle: "A tiny, probabilistic 'definitely not' set.",
		level: "intermediate",
		minutes: 8,
		tags: ["probabilistic", "storage"],
		summary: "A Bloom filter answers 'might this key exist?' with no false negatives and a tunable false-positive rate. Used to skip disk in LSM trees, cache 'this URL was already crawled', and cheaply gate expensive lookups.",
		sections: [{
			heading: "Mechanics",
			body: ["k hash functions set k bits in a bit array. Membership checks those bits. If any is 0, the key was never inserted. If all are 1, it might be there — or some other keys collided.", "You cannot delete (without counting Bloom filters) and you cannot list the keys. Size the array from n expected items and target false-positive p."],
			code: {
				title: "false-positive ≈ (1 - e^(-kn/m))^k",
				source: `m_bits ≈ -n * ln(p) / (ln 2)^2
k_hashes ≈ (m/n) * ln 2
# n = 1e9 keys, p = 1% → ~1.2 GB, k ≈ 7`
			}
		}, {
			heading: "In system design",
			bullets: [
				"Bigtable / Cassandra / RocksDB: skip SSTables that cannot contain a key.",
				"Web crawler: 'have we seen this URL?' before hitting the URL store (Alex Xu ch. 9).",
				"CDN / cache: cheap negative cache."
			]
		}],
		related: [
			"/examples/web-crawler",
			"/examples/kv-store",
			"/hld/caching"
		],
		furtherReading: [{
			label: "Bloom filter — Wikipedia",
			href: "https://en.wikipedia.org/wiki/Bloom_filter"
		}]
	},
	{
		slug: "circuit-breaker",
		title: "Circuit Breakers and Resilience",
		subtitle: "Fail fast when the dependency is already on fire.",
		level: "intermediate",
		minutes: 8,
		tags: ["reliability"],
		summary: "Retries without a breaker amplify outages. A circuit breaker opens after an error threshold, short-circuits calls, then probes with a half-open trial. Pair with timeouts, bulkheads, and backoff.",
		sections: [{
			heading: "States",
			numbered: [
				"Closed: calls flow. Track failures in a window.",
				"Open: calls fail immediately (or hit fallback). A timer starts.",
				"Half-open: allow a trial request. Success closes; failure re-opens."
			],
			table: {
				headers: ["Tool", "Role"],
				rows: [
					["Timeout", "A hung call is a failure you have not counted yet"],
					["Retry + jitter", "Survives blips; needs idempotency"],
					["Bulkhead", "Isolate pools so one dependency cannot take all threads"],
					["Fallback", "Cached, default, or degraded UX"]
				]
			}
		}],
		related: [
			"/hld/message-queues",
			"/lld/concurrency",
			"/hld/observability"
		],
		furtherReading: [{
			label: "Release It! — circuit breaker (concept)",
			href: "https://martinfowler.com/bliki/CircuitBreaker.html"
		}]
	},
	{
		slug: "observability",
		title: "Logging, Metrics, Tracing",
		subtitle: "If you cannot see it, you cannot operate it.",
		level: "foundational",
		minutes: 9,
		tags: ["ops"],
		summary: "Logs tell stories, metrics tell numbers, traces tell journeys. A production design without a telemetry path is unfinished. Volume 2's metrics-monitoring chapter is the interview-scale version of this.",
		sections: [{
			heading: "Three pillars",
			table: {
				headers: [
					"Pillar",
					"Good for",
					"Store"
				],
				rows: [
					[
						"Metrics",
						"SLIs, alerts, capacity",
						"Prometheus, Datadog, VictoriaMetrics"
					],
					[
						"Logs",
						"Why this request failed",
						"Loki, Elasticsearch, CloudWatch"
					],
					[
						"Traces",
						"Which hop was slow",
						"Jaeger, Tempo, Zipkin, OpenTelemetry"
					]
				]
			}
		}, {
			heading: "SLIs you actually alert on",
			bullets: [
				"Availability: successful requests / total (exclude 4xx you caused on purpose).",
				"Latency: p50 is vanity; p95/p99 is what users feel.",
				"Saturation: CPU, queue depth, disk, error budget burn.",
				"Correctness: business counters (orders paid, messages delivered)."
			],
			callout: {
				kind: "note",
				title: "Volume 2",
				text: "Metrics monitoring system: collectors, time-series store, query, alerting, and downsampling. See the worked example under System Design Examples."
			}
		}],
		related: [
			"/examples/metrics",
			"/examples/distributed-mq",
			"/hld/circuit-breaker"
		],
		furtherReading: [{
			label: "Google SRE book — monitoring",
			href: "https://sre.google/sre-book/monitoring-distributed-systems/"
		}]
	},
	{
		slug: "dns",
		title: "DNS and Traffic Direction",
		subtitle: "The first distributed cache everyone forgets to design.",
		level: "foundational",
		minutes: 7,
		tags: ["networking"],
		summary: "DNS maps names to addresses and is often the global load balancer: geo DNS, weighted records, health-checked failover. TTLs are a consistency/latency knob with real blast radius.",
		sections: [{
			heading: "Resolution path",
			numbered: [
				"Stub resolver on the device asks a recursive resolver.",
				"Recursive walks root → TLD → authoritative.",
				"Answers are cached at each hop for the TTL."
			]
		}, {
			heading: "As a control plane",
			bullets: [
				"Low TTL (30–60s) lets you fail over faster and makes resolvers chatty.",
				"High TTL is cheaper and more cacheable; failover is slower.",
				"Geo / latency routing sends users to a nearby region.",
				"Never rely on DNS alone for box-level failover — pair with an LB."
			]
		}],
		related: [
			"/hld/load-balancing",
			"/hld/cdn",
			"/hld/cap-theorem"
		],
		furtherReading: [{
			label: "roadmap.sh — DNS",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "websockets",
		title: "Long Polling, SSE, WebSockets",
		subtitle: "How servers push without the client asking every 200ms.",
		level: "intermediate",
		minutes: 9,
		tags: ["realtime"],
		summary: "Chat, collab cursors, and live prices need a push channel. Pick short polling, long polling, Server-Sent Events, or WebSockets based on directionality, proxies, and fan-out cost.",
		sections: [{
			heading: "The menu",
			table: {
				headers: [
					"Transport",
					"Direction",
					"Fit"
				],
				rows: [
					[
						"Short polling",
						"Client → server",
						"Rare updates, simplest, wasteful"
					],
					[
						"Long polling",
						"Client holds; server replies when ready",
						"Works everywhere; reconnect storms"
					],
					[
						"SSE",
						"Server → client over HTTP",
						"Notifications, feeds; one-way"
					],
					[
						"WebSocket",
						"Full duplex",
						"Chat, games, collab. Sticky LB, stateful servers"
					]
				]
			}
		}, {
			heading: "Scale notes",
			body: ["Each WebSocket is a live TCP connection and some memory. Shard by user ID, keep a connection registry (user → server), and fan-out via pub/sub (Redis, NATS, Kafka) so the box that holds Alice can send to the box that holds Bob."],
			callout: {
				kind: "insight",
				title: "Chat / nearby friends",
				text: "Alex Xu's chat system (Vol 1) and nearby friends (Vol 2) both hang on this: connection management + pub/sub + presence."
			}
		}],
		related: [
			"/examples/chat",
			"/examples/nearby-friends",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "roadmap.sh — realtime",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "quorum",
		title: "Quorum, Gossip, Leader Election",
		subtitle: "How a cluster agrees it saw a write — or agrees who is in charge.",
		level: "advanced",
		minutes: 12,
		tags: ["distributed systems"],
		summary: "Quorums (R + W > N) give strong-enough reads in leaderless stores. Gossip spreads membership. Leader election (Raft, Paxos, ZooKeeper) gives a single writer when you need one.",
		sections: [{
			heading: "Quorum arithmetic",
			body: ["N replicas, write W of them, read R of them. If R + W > N, the read set and write set intersect, so a reader sees the latest write — assuming no concurrent writers and no sloppy membership.", "Common: N=3, W=2, R=2. Fast writes: W=1, R=N (risk lost writes). Fast reads: R=1, W=N."],
			diagram: {
				kind: "flow",
				caption: "N=3, W=2, R=2 — read and write sets must overlap",
				rows: [[
					{
						id: "c",
						label: "Client"
					},
					{
						id: "a",
						label: "A",
						tone: "accent"
					},
					{
						id: "b",
						label: "B",
						tone: "accent"
					},
					{
						id: "c2",
						label: "C"
					}
				]]
			}
		}, {
			heading: "Leaders and gossip",
			bullets: [
				"Raft: elected leader, replicated log, majority commit. Used in etcd, Consul, many coordination planes.",
				"Gossip: each node periodically exchanges state with a random peer. Membership, Dynamo hinted handoff, Cassandra.",
				"Split-brain: two leaders. Avoid with majority quorums and fencing tokens."
			]
		}],
		related: [
			"/playgrounds/quorum",
			"/examples/kv-store",
			"/hld/cap-theorem"
		],
		furtherReading: [{
			label: "Dynamo paper",
			href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"
		}],
		playground: "quorum"
	},
	{
		slug: "estimation",
		title: "Back-of-the-Envelope Estimation",
		subtitle: "Numbers that keep a design honest in the first ten minutes.",
		level: "foundational",
		minutes: 10,
		tags: ["Alex Xu Vol 1", "interview"],
		summary: "Chapter 2 of Volume 1. Interviewers want to see that you can bound QPS, storage, and bandwidth before drawing boxes. Powers of two, a few memorized constants, and one significant digit are enough.",
		sections: [{
			heading: "Constants worth memorizing",
			table: {
				headers: ["Thing", "Order of magnitude"],
				rows: [
					["L1 cache / branch", "~1 ns"],
					["L2 / mutex uncontended", "~10 ns"],
					["Main memory", "~100 ns"],
					["Same-AZ RTT / SSD seek-ish", "~0.1–1 ms"],
					["Disk seek (HDD) / cross-region", "~10 ms / 100 ms+"],
					["1 day in seconds", "≈ 10^5 (86400)"],
					["1 million requests/day", "≈ 12 QPS"],
					["1 KB * 1e9", "≈ 1 TB"]
				]
			}
		}, {
			heading: "A template",
			numbered: [
				"DAU × actions/day = writes/day. Divide by 86400 for QPS. Peak ≈ 2–3× average.",
				"Read:write ratio → read QPS.",
				"Record size × records × retention = storage. Add indexes (~20–50%) and replicas (×N).",
				"Payload × QPS = NIC / bandwidth.",
				"Cache working set: hot % of keys × size."
			],
			code: {
				title: "URL shortener, 100M new URLs/day, 10 years",
				source: `writes/day     = 1e8
write QPS      ≈ 1e8 / 8.64e4 ≈ 1.2e3  (peak ~3k)
reads (10:1)   ≈ 1.2e4 QPS
records        = 1e8 * 365 * 10 ≈ 3.65e11
storage        ≈ 3.65e11 * 500 B ≈ 180 TB  (+replicas)`
			},
			callout: {
				kind: "insight",
				title: "One digit",
				text: "If you need a calculator, you are over-fitting. Interview math is 'are we talking GBs or PBs, hundreds of QPS or millions?'"
			}
		}],
		related: [
			"/examples/url-shortener",
			"/examples/interview-framework",
			"/hld/scaling"
		],
		furtherReading: [{
			label: "Jeff Dean — Numbers Everyone Should Know",
			href: "http://norvig.com/21-days.html#answers"
		}]
	}
], ...awesomeHldConcepts];
function getHld(slug) {
	return hldConcepts.find((c) => c.slug === slug);
}
//#endregion
export { hldConcepts as n, getHld as t };
