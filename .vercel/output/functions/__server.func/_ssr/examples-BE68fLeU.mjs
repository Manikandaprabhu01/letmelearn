//#region node_modules/.nitro/vite/services/ssr/assets/examples-BE68fLeU.js
var frameworkExamples = [{
	slug: "interview-framework",
	title: "A Framework for System Design Interviews",
	source: "Volume 1",
	chapter: 3,
	difficulty: "foundational",
	minutes: 16,
	tags: [
		"framework",
		"interview",
		"communication"
	],
	companies: ["FAANG-style loops", "Any senior-level backend loop"],
	summary: "The four-step script from Volume 1 chapter 3, expanded into what you actually say, how long each step takes, and the specific behaviours interviewers are grading. Every example in this app is written in this order so the sequence becomes muscle memory.",
	clarifying: [
		{
			q: "Who are the users and what are the top three things they do?",
			a: "This is the question that decides the design. 'Everyone posts and reads' is a different system from 'a few thousand publishers, millions of readers'. Get the read/write ratio out of this answer."
		},
		{
			q: "How many users, and how active are they?",
			a: "Daily actives and actions per user per day. If the interviewer says 'you tell me', pick a round number, say it out loud, and use it — never leave scale undefined."
		},
		{
			q: "Is this global or single-region?",
			a: "Global changes replication, consistency and latency budgets fundamentally. Ask early, because retrofitting multi-region into a design halfway through costs you five minutes."
		},
		{
			q: "How fresh must reads be?",
			a: "The single most useful consistency question. 'Seconds is fine' unlocks caching and replicas; 'must be immediate' forces a leader read or a quorum on the hot path."
		},
		{
			q: "What is explicitly out of scope?",
			a: "Say what you are not building — auth, payments, moderation, analytics — and get agreement. This buys time and prevents the interviewer thinking you forgot them."
		}
	],
	requirements: {
		functional: [
			"Agree on the two or three core use cases before drawing anything",
			"Write the agreed scope somewhere visible and refer back to it",
			"Name what is deliberately excluded"
		],
		nonFunctional: [
			"Scale: DAU, peak QPS, storage growth per year",
			"Latency budget for the primary read and write path",
			"Consistency requirement, stated per feature rather than globally",
			"Availability target and what degraded mode looks like"
		]
	},
	math: [
		{
			label: "Time budget, 45-minute round",
			expr: "scope 8 min · high level 12 min · deep dive 18 min · wrap 5 min",
			result: "43 min",
			note: "Leaves two minutes for their questions. Watch the clock; running out during the deep dive is the classic failure."
		},
		{
			label: "How much to draw",
			expr: "6–10 boxes at the high level",
			result: "one screen",
			note: "More than that and you are designing the whole company; fewer and there is nothing to dive into."
		},
		{
			label: "Deep dives to prepare",
			expr: "2–3 subsystems, chosen by the interviewer's interest",
			result: "not five",
			note: "Depth on two beats a survey of six every time."
		}
	],
	apis: [
		{
			method: "STEP 1",
			path: "Understand and scope",
			desc: "Ask, estimate, agree. Nothing is drawn yet."
		},
		{
			method: "STEP 2",
			path: "High-level design",
			desc: "APIs, data model, boxes and arrows. Get buy-in before going deeper."
		},
		{
			method: "STEP 3",
			path: "Deep dive",
			desc: "Two or three hard parts, in the interviewer's order of interest."
		},
		{
			method: "STEP 4",
			path: "Wrap up",
			desc: "Bottlenecks, failure modes, what you would do next."
		}
	],
	architecture: [{
		heading: "Step 1 — Understand the problem and establish scope",
		lede: "Eight minutes that determine whether the next thirty-five are useful.",
		body: ["The most common way to fail this round is to design something correct that the interviewer did not ask for. They deliberately give an ambiguous prompt — 'design Twitter' — because how you narrow it is the signal.", "Ask questions that change the design. 'Is it read-heavy?' changes everything. 'What colour is the button?' changes nothing. If the interviewer deflects with 'what do you think?', state an assumption confidently and move on — that is also being tested."],
		steps: [
			{
				title: "Clarify the core use cases",
				text: "Two or three, in the form 'a user can X'. Write them down. Everything you build must serve one of them.",
				detail: "'Users post 280-character messages' · 'Users see a timeline of people they follow' · 'Users follow and unfollow'"
			},
			{
				title: "Get the numbers",
				text: "DAU, actions per user, payload size, retention. Then convert to peak QPS and yearly storage out loud, so the interviewer can correct an input rather than your conclusion.",
				detail: "300M DAU × 100 reads/day ÷ 10⁵ ≈ 300k reads/s average, ~1M/s peak"
			},
			{
				title: "Name the non-functional requirements",
				text: "Latency, consistency, availability, cost — with a number or a comparative for each. 'Timeline reads under 200 ms; seconds of staleness are fine' is a design constraint. 'It should be fast' is not."
			},
			{
				title: "State what is out of scope",
				text: "Explicitly. 'I will not design auth, moderation or the ML ranking model unless you want me to.' Nearly always they say yes, and now nobody thinks you forgot."
			}
		],
		callout: {
			kind: "interview",
			text: "Write the agreed scope on the board and leave it there. Referring back to it mid-design — 'this serves use case two' — reads as discipline and keeps you from wandering."
		}
	}, {
		heading: "Step 2 — Propose a high-level design and get buy-in",
		lede: "Boxes and arrows, plus the two artefacts most candidates skip.",
		body: ["Before drawing infrastructure, write the API surface and the data model. Three endpoint signatures and four tables force the design to be concrete, and they surface disagreement early while it is cheap.", "Then draw the request path: client, edge, service, storage. Six to ten boxes. Narrate the flow of one write and one read through them, and stop to ask whether this matches what they had in mind."],
		steps: [
			{
				title: "API surface first",
				text: "Two or three endpoints with real signatures. This is where you decide what the system does; the boxes are how.",
				detail: "POST /v1/posts {text} → 201 {postId}   ·   GET /v1/timeline?cursor= → 200 {posts[], nextCursor}"
			},
			{
				title: "Data model second",
				text: "The entities, their keys, and the one or two indexes the main queries need. Choosing the primary key is often choosing the shard key."
			},
			{
				title: "Then the boxes",
				text: "Client → CDN/LB → API → services → cache → storage, plus a queue if any work is async. Keep it to one screen."
			},
			{
				title: "Walk one request end to end",
				text: "'A user posts. The write goes here, we do this synchronously and that asynchronously, and here is where a reader sees it.' This is where design flaws surface."
			},
			{
				title: "Pause and ask",
				text: "'Does this match what you had in mind, or would you like me to go deeper somewhere?' Their answer tells you which deep dive they want."
			}
		],
		diagram: {
			kind: "system",
			caption: "The default skeleton. Almost every design is this, plus one interesting part.",
			columns: [
				{
					title: "Edge",
					nodes: [{
						id: "cdn",
						label: "CDN",
						sub: "static + media"
					}, {
						id: "lb",
						label: "Load balancer",
						tone: "accent"
					}]
				},
				{
					title: "API",
					nodes: [{
						id: "gw",
						label: "Gateway",
						sub: "auth, rate limit"
					}, {
						id: "svc",
						label: "Services",
						sub: "stateless",
						tone: "ok"
					}]
				},
				{
					title: "Async",
					nodes: [{
						id: "q",
						label: "Queue",
						sub: "fan-out, email, media"
					}, {
						id: "w",
						label: "Workers"
					}]
				},
				{
					title: "State",
					nodes: [
						{
							id: "c",
							label: "Cache",
							sub: "hot reads"
						},
						{
							id: "db",
							label: "Primary store",
							sub: "sharded"
						},
						{
							id: "blob",
							label: "Object storage",
							sub: "media"
						}
					]
				}
			]
		}
	}],
	deepDives: [
		{
			heading: "Step 3 — Design deep dive",
			lede: "The part you are actually graded on.",
			body: ["Let the interviewer choose where to go if they have an opinion; if not, pick the part that is genuinely hard and say why it is hard. For a feed that is fan-out; for a payment system it is exactly-once and reconciliation; for a chat system it is delivery and ordering.", "Go deep enough to be specific: name the data structure, the key, the failure, and the number. 'We cache timelines' is a sentence. 'We store the last 800 post ids per user in a Redis list, roughly 60 GB for the active set, and rebuild from the posts table on a miss' is a design."],
			table: {
				headers: [
					"System type",
					"The hard part they want",
					"What a shallow answer sounds like"
				],
				rows: [
					[
						"Feed / timeline",
						"Fan-out on write vs read, and the celebrity problem",
						"'We use a cache'"
					],
					[
						"Chat",
						"Delivery guarantees, ordering, presence at scale",
						"'WebSockets'"
					],
					[
						"Payments",
						"Idempotency, ledger integrity, reconciliation",
						"'A payments table'"
					],
					[
						"Search / autocomplete",
						"Index structure, update path, ranking",
						"'Elasticsearch'"
					],
					[
						"Video",
						"Chunked upload, transcoding pipeline, CDN strategy",
						"'Store it in S3'"
					],
					[
						"Rate limiter",
						"Distributed counter state without a round trip per request",
						"'Redis'"
					],
					[
						"Storage / KV",
						"Partitioning, replication, conflict resolution",
						"'Consistent hashing'"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "Volunteer the failure mode before being asked. 'This breaks when one user has 50 million followers — here is what I would do about it' is worth more than any amount of correct-but-obvious architecture."
			}
		},
		{
			heading: "Step 4 — Wrap up",
			lede: "Five minutes that change the interviewer's write-up.",
			bullets: [
				"Name the bottleneck you would hit first, and at roughly what scale. Specificity here is credibility.",
				"State the biggest trade-off you made and what you gave up. Every design sacrifices something; pretending otherwise is the tell of inexperience.",
				"Describe what happens when the riskiest dependency fails, and what users see.",
				"Say what you would do with another hour — the parts you knowingly left thin.",
				"Mention operational reality briefly: what you would monitor, and what would page someone."
			],
			code: {
				title: "A wrap-up that sounds senior",
				lang: "text",
				source: `"The first thing to break is fan-out for celebrity accounts — at roughly
 a million followers, one post becomes a million cache writes, so I'd move
 those to fan-out on read and merge at query time.

 The main trade-off I made was precomputing timelines: I've spent storage
 and write amplification to make reads cheap, which is right at a 50:1
 read/write ratio and wrong if that ratio flips.

 If Redis is unavailable, timelines rebuild from the posts table — slower,
 correct, and I'd rate limit at the edge so the database survives it.

 With another hour I'd design the ranking pipeline and the media path,
 both of which I've deliberately treated as black boxes today.

 I'd page on timeline p99 and on fan-out lag, since that's what users feel."`
			}
		},
		{
			heading: "What interviewers are actually scoring",
			table: {
				headers: [
					"Signal",
					"What earns it",
					"What loses it"
				],
				rows: [
					[
						"Scoping",
						"Questions that change the design; explicit assumptions",
						"Starting to draw within the first minute"
					],
					[
						"Estimation",
						"Converting to peak QPS and storage out loud",
						"'It'll be a lot of traffic'"
					],
					[
						"Depth",
						"One subsystem specified concretely, with numbers",
						"Naming technologies without saying how they are used"
					],
					[
						"Trade-offs",
						"'I chose X, which costs me Y'",
						"Presenting a design as having no downsides"
					],
					[
						"Failure thinking",
						"Volunteering what breaks and what users see",
						"Only discussing the happy path"
					],
					[
						"Communication",
						"Narrating, pausing, checking in",
						"Silence, or twenty minutes of monologue"
					],
					[
						"Correcting course",
						"Taking a hint and adjusting quickly",
						"Defending a design after they signalled a problem"
					]
				]
			},
			callout: {
				kind: "warn",
				text: "When an interviewer asks 'are you sure about that?' or 'what happens if…', they are handing you a hint. The wrong response is to defend; the right one is to explore it. Candidates who cannot update after a hint are rated poorly regardless of the design."
			}
		},
		{
			heading: "Common failure patterns",
			bullets: [
				"Designing for a billion users when the requirement was a million. Over-engineering reads as inexperience, not ambition.",
				"Naming technologies as answers. 'Kafka' is not a design; 'a partitioned log keyed by user id so one user's events stay ordered' is.",
				"Silent thinking. If you go quiet for two minutes, the interviewer has nothing to grade. Narrate the options you are weighing.",
				"Never mentioning data. A design with no data model and no key choice is a diagram, not a system.",
				"Running out of time in the deep dive. Watch the clock and reserve the last five minutes.",
				"Ignoring the interviewer's steering. They know which part is interesting; go where they point."
			]
		}
	],
	tradeoffs: [
		{
			choice: "Go deep on one subsystem",
			pickWhen: "45–60 minute rounds, senior level",
			cost: "Thin coverage elsewhere — say so explicitly so it reads as a choice"
		},
		{
			choice: "Survey the whole system",
			pickWhen: "Junior loops, or the interviewer explicitly asks for breadth",
			cost: "Looks shallow if you never commit to a hard part"
		},
		{
			choice: "Draw first, ask later",
			pickWhen: "Almost never",
			cost: "High chance of designing the wrong system"
		},
		{
			choice: "Assume and state, when they will not answer",
			pickWhen: "The interviewer deflects your scoping question",
			cost: "You own the assumption — but this is what they wanted to see"
		}
	],
	wrapUp: [
		"Rehearse the four steps until the sequence is automatic, so your attention goes to the problem rather than to what comes next.",
		"Practise saying numbers out loud. Most candidates can do the arithmetic and forget to narrate it, which means it earns nothing.",
		"Prepare one deep dive for each of the six or seven common system archetypes — feed, chat, payments, search, video, storage, rate limiting.",
		"Practise being interrupted. Real rounds are conversations, and a rehearsed monologue falls apart the first time it is redirected."
	],
	followUps: [
		{
			q: "The interviewer says nothing and just watches. What do you do?",
			a: "Narrate more, not less, and force check-ins. I would say what I am about to do, do it, then ask a direct question — 'shall I go deeper on fan-out, or would you rather I cover the storage layer?' A silent interviewer is usually assessing whether I can drive the session, so the failure mode is waiting to be led."
		},
		{
			q: "You realise 25 minutes in that your design is wrong. Now what?",
			a: "Say so immediately and explain what changed my mind — that is a strong signal, not a weak one. Then fix the specific part rather than restarting: usually one component or one key choice is wrong, not the whole thing. Candidates who quietly hope nobody notices do much worse than candidates who catch it themselves."
		},
		{
			q: "How much detail is too much?",
			a: "If I am writing out a function body or debating a library, too much. If I have named a component but not said what its key is, what it stores, or how big it gets, not enough. The right granularity is: named components, concrete data structures, real numbers, and explicit failure behaviour."
		},
		{
			q: "Should you mention specific technologies?",
			a: "Yes, but as an illustration rather than as the answer — 'a partitioned log, Kafka for example' rather than 'Kafka'. Naming the property I need shows I understand why, and it protects me if the interviewer knows a technology better than I do. Claiming deep expertise in something I have not run is a bad trade."
		}
	],
	related: [
		"/hld/estimation",
		"/examples/scale-to-millions",
		"/examples/url-shortener",
		"/examples/news-feed"
	],
	furtherReading: [{
		label: "roadmap.sh — system design questions",
		href: "https://roadmap.sh/questions/system-design"
	}, {
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}, {
	slug: "scale-to-millions",
	title: "Scale from Zero to Millions of Users",
	source: "Volume 1",
	chapter: 1,
	difficulty: "foundational",
	minutes: 20,
	tags: [
		"framework",
		"web stack",
		"scaling"
	],
	companies: ["Any web product"],
	summary: "Volume 1 opens by walking one application from a single box to a multi-region, sharded system — introducing each component at the moment something breaks. Learn it as a checklist you run against every other design: is there a cache on the hot path, is the compute stateless, how does the primary fail over.",
	clarifying: [
		{
			q: "What is the read/write ratio?",
			a: "Assume 10:1 or higher, which is typical for consumer products. It is the number that decides whether caching and replicas solve your problem or whether you need to shard writes."
		},
		{
			q: "How much downtime is acceptable?",
			a: "Assume 99.9% to start — 43 minutes a month — rising to 99.99% as the product matters more. That target is what forces multi-AZ and fast rollback."
		},
		{
			q: "Single region or global users?",
			a: "Start single-region. Going global adds latency routing, data residency and replication decisions that should be made deliberately rather than by default."
		},
		{
			q: "How fast is growth?",
			a: "Design for 10× current traffic, not 1000×. Each step on the ladder should be the cheapest thing that survives the next order of magnitude."
		}
	],
	requirements: {
		functional: [
			"Users read and write the product's core objects",
			"Sessions survive across more than one app server",
			"Uploaded files are visible to every server",
			"Slow work (email, thumbnails, exports) does not block a request"
		],
		nonFunctional: [
			"Grow from 1 to 10 million users without a rewrite",
			"Survive the loss of any single server, and of a whole availability zone",
			"Deploy without downtime",
			"Keep p95 latency interactive (under ~300 ms) throughout"
		]
	},
	math: [
		{
			label: "1 M users, 10 actions/day",
			expr: "10,000,000 ÷ 10⁵",
			result: "≈ 100 rps avg",
			note: "Peak ×3 ≈ 300 rps. One or two application servers. Do this arithmetic before proposing a cluster."
		},
		{
			label: "10 M users, 20 actions/day",
			expr: "200,000,000 ÷ 10⁵",
			result: "≈ 2,000 rps avg",
			note: "Peak ≈ 6,000 rps. Now you need a fleet, a cache, and replicas."
		},
		{
			label: "Storage growth",
			expr: "10 M users × 1 KB profile + 200 M rows/yr × 500 B",
			result: "≈ 110 GB/yr",
			note: "×3 for indexes and replication ≈ 330 GB. Still one machine — do not shard yet."
		},
		{
			label: "Cache sizing",
			expr: "hot 20% of 10 M users × 2 KB",
			result: "≈ 4 GB",
			note: "Trivially affordable, and it removes most read load. This is why caching comes before replicas."
		}
	],
	apis: [
		{
			method: "GET",
			path: "/v1/items?cursor=",
			desc: "Read path — cacheable, served from replicas"
		},
		{
			method: "POST",
			path: "/v1/items",
			desc: "Write path — primary only, idempotency key"
		},
		{
			method: "GET",
			path: "/healthz",
			desc: "Liveness — shallow, no dependency checks"
		},
		{
			method: "GET",
			path: "/readyz",
			desc: "Readiness — gates load-balancer traffic during deploy and drain"
		}
	],
	dataModel: [
		{
			entity: "users",
			fields: [
				"id (pk)",
				"email (unique)",
				"created_at",
				"region"
			]
		},
		{
			entity: "items",
			fields: [
				"id (pk)",
				"user_id (fk, idx)",
				"body",
				"created_at (idx)",
				"version"
			]
		},
		{
			entity: "sessions",
			fields: [
				"token (pk)",
				"user_id",
				"expires_at",
				"→ Redis, not the primary DB"
			]
		},
		{
			entity: "media",
			fields: [
				"id (pk)",
				"user_id",
				"object_key",
				"→ bytes live in object storage"
			]
		}
	],
	architecture: [{
		heading: "The ladder, and what forces each rung",
		lede: "Every step exists because a specific thing broke.",
		steps: [
			{
				title: "One server",
				text: "Web, application and database on a single box. Genuinely fine for early traffic, and simpler than anything that follows.",
				detail: "Breaks on: the machine dying, and every deploy being downtime."
			},
			{
				title: "Separate the database",
				text: "Two machines, sized differently: CPU for the app, memory and IOPS for the database. They now fail and scale independently.",
				detail: "Breaks on: the app server dying, and CPU limits on one box."
			},
			{
				title: "Load balancer plus multiple app servers",
				text: "Requires statelessness: sessions in Redis or a signed token, uploads in object storage, no local disk state. Now deploys are rolling and a server loss is invisible.",
				detail: "Breaks on: the database becoming the bottleneck for reads."
			},
			{
				title: "Cache the hot reads",
				text: "Cache-aside in Redis. Typically removes 80-95% of read load for a fraction of the cost of another database machine.",
				detail: "Introduces: invalidation, staleness, and the stampede/penetration/avalanche failure modes."
			},
			{
				title: "Read replicas",
				text: "Writes to the primary, reads to followers. Multiplies read capacity and introduces replication lag.",
				detail: "Introduces: read-your-writes anomalies. Route a user's reads to the primary briefly after their write."
			},
			{
				title: "CDN and object storage",
				text: "Static assets, images and video move to the edge. Cuts latency and origin bandwidth dramatically, and takes media entirely off your servers."
			},
			{
				title: "Queue plus workers",
				text: "Email, thumbnails, exports, fan-out and webhooks move off the request path. The user's request returns in milliseconds and the work survives a crash.",
				detail: "Introduces: eventual consistency, at-least-once delivery, and a backlog to monitor."
			},
			{
				title: "Multiple availability zones",
				text: "App servers, cache and database replicas spread across zones, so losing one zone degrades rather than stops the service."
			},
			{
				title: "Shard the write path",
				text: "Only when a single write leader cannot keep up or the dataset outgrows one machine. This is the expensive rung: cross-shard joins, transactions and rebalancing all become your problem.",
				detail: "Delay it. Then choose a shard key you can live with for years."
			},
			{
				title: "Split services and regions",
				text: "Extract the pieces with genuinely different scaling profiles or ownership; replicate across regions for latency and disaster recovery."
			}
		],
		callout: {
			kind: "interview",
			text: "Walking this ladder out loud — naming the step, the failure that forces it, and the new problem it creates — is a complete answer to 'how would you scale this?'. The third part is what separates understanding from memorisation."
		}
	}, {
		heading: "The shape it converges to",
		diagram: {
			kind: "system",
			caption: "Roughly where every product lands by a few million users.",
			columns: [
				{
					title: "Edge",
					nodes: [{
						id: "dns",
						label: "DNS",
						sub: "health-checked, low TTL"
					}, {
						id: "cdn",
						label: "CDN",
						sub: "static, media, cacheable GETs",
						tone: "accent"
					}]
				},
				{
					title: "Entry",
					nodes: [{
						id: "lb",
						label: "Load balancer",
						sub: "L7, multi-AZ",
						tone: "accent"
					}, {
						id: "gw",
						label: "Gateway",
						sub: "auth, rate limit"
					}]
				},
				{
					title: "Compute",
					nodes: [{
						id: "app",
						label: "App servers ×N",
						sub: "stateless, autoscaled",
						tone: "ok"
					}, {
						id: "wrk",
						label: "Workers",
						sub: "queue consumers",
						tone: "ok"
					}]
				},
				{
					title: "State",
					nodes: [
						{
							id: "redis",
							label: "Redis",
							sub: "cache + sessions"
						},
						{
							id: "pri",
							label: "Primary DB",
							sub: "writes, multi-AZ"
						},
						{
							id: "rep",
							label: "Replicas",
							sub: "reads"
						},
						{
							id: "s3",
							label: "Object storage",
							sub: "media"
						},
						{
							id: "q",
							label: "Queue",
							sub: "async work"
						}
					]
				}
			]
		},
		table: {
			headers: [
				"Component",
				"Added at roughly",
				"Solves",
				"Costs"
			],
			rows: [
				[
					"Separate DB host",
					"First real users",
					"Independent sizing and failure",
					"A network hop"
				],
				[
					"Load balancer + fleet",
					"~100 rps or first uptime requirement",
					"Server loss, zero-downtime deploys",
					"Statelessness discipline"
				],
				[
					"Cache",
					"~500 rps reads",
					"Most read load",
					"Invalidation and staleness"
				],
				[
					"Read replicas",
					"~2,000 rps reads",
					"Read capacity beyond the cache",
					"Replication lag anomalies"
				],
				[
					"CDN",
					"Any media, any global user",
					"Latency and origin bandwidth",
					"Cache-control discipline"
				],
				[
					"Queue",
					"First slow request",
					"Latency and coupling",
					"Eventual consistency, idempotency"
				],
				[
					"Sharding",
					"Writes or storage exceed one machine",
					"Write scale",
					"Joins, transactions, rebalancing"
				]
			]
		}
	}],
	deepDives: [
		{
			heading: "Making the tier stateless",
			lede: "The prerequisite for every rung above the third.",
			body: ["Horizontal scaling is straightforward in principle and is blocked in practice by four specific things. Each has a standard fix, and naming them shows you have actually done this rather than read about it."],
			table: {
				headers: [
					"State that blocks scaling",
					"Symptom",
					"Fix"
				],
				rows: [
					[
						"In-memory sessions",
						"Users randomly logged out",
						"Redis session store, or a signed stateless token"
					],
					[
						"Local file uploads",
						"Image 404s on some page loads",
						"Object storage with signed URLs"
					],
					[
						"In-process cache used for correctness",
						"Two servers disagree",
						"Shared cache, or accept it as an optimisation only"
					],
					[
						"Per-instance cron",
						"Nightly job runs five times",
						"A scheduler with leader election, or a job queue"
					]
				]
			},
			code: {
				title: "Graceful shutdown — the detail that makes deploys invisible",
				lang: "ts",
				source: `let ready = true;

app.get("/readyz", (_req, res) =>
  ready ? res.status(200).send("ready") : res.status(503).send("draining"));

process.on("SIGTERM", async () => {
  ready = false;                        // 1. fail readiness first
  await sleep(LB_CHECK_INTERVAL * 2);   // 2. wait for the LB to stop routing here
  await server.close();                 // 3. finish in-flight requests
  await queue.drain({ timeoutMs: 10_000 });
  await pool.end();
  process.exit(0);
});

// Skip step 2 and the load balancer is still sending requests to a process
// that has closed its listener — users see 502s on every deploy.`
			}
		},
		{
			heading: "The database is almost always the constraint",
			bullets: [
				"Before adding machines, look at queries. One missing index or one N+1 pattern routinely costs more than an entire tier of hardware.",
				"Connection limits bite before CPU does: a hundred app instances each holding twenty connections will exhaust a Postgres primary. Put a pooler (PgBouncer, RDS Proxy) in front.",
				"Cache before replicas. A cache is cheaper, removes more load, and does not introduce replication lag.",
				"Replicas multiply reads and do nothing for writes — every replica applies the full write stream.",
				"Batch and queue writes where the user does not need immediate confirmation. Ten individual inserts become one batched insert.",
				"Denormalise deliberately when a join is the bottleneck, and accept the write-time cost of keeping the copy correct."
			],
			math: [{
				label: "Connection exhaustion",
				expr: "100 app instances × 20 pool connections",
				result: "2,000 connections",
				note: "Well past a Postgres primary's comfortable limit. A pooler multiplexes them down to ~100."
			}, {
				label: "Cache vs replica",
				expr: "95% hit ratio on 10,000 rps",
				result: "500 rps to DB",
				note: "One cache node does what several replicas would, at a fraction of the cost."
			}]
		},
		{
			heading: "Multi-AZ, then multi-region",
			bullets: [
				"Multi-AZ is table stakes above a modest availability target: app servers in three zones, database primary with a synchronous replica in a second zone, cache replicated or accepted as lossy.",
				"Multi-region is a much bigger step. Decide first whether it is for latency, for disaster recovery, or for data residency — the architectures differ.",
				"Active-passive across regions is the common answer: all writes in one region, a warm standby elsewhere, and a documented (and practised) failover. Recovery is measured in minutes.",
				"Active-active means multi-leader writes, which means conflict resolution, and that is a substantial ongoing cost. Only take it on for genuinely global write traffic.",
				"The cheap middle ground: serve reads from regional replicas and route all writes to one region. Most read-heavy products get most of the benefit this way."
			],
			diagram: {
				kind: "compare",
				caption: "Choose by what you are actually buying.",
				options: [
					{
						title: "Single region, multi-AZ",
						tone: "ok",
						good: [
							"Simple; one source of truth",
							"Survives a zone failure",
							"No conflict resolution ever"
						],
						bad: ["Region outage is a full outage", "Far-away users pay the latency"],
						verdict: "Almost everyone, for a long time."
					},
					{
						title: "Multi-region, single write region",
						good: [
							"Fast reads worldwide",
							"Warm standby for disaster recovery",
							"Still one write leader — no conflicts"
						],
						bad: ["Cross-region write latency for distant users", "Failover is a practised procedure, not automatic"],
						verdict: "Read-heavy global products."
					},
					{
						title: "Active-active",
						good: ["Local writes everywhere", "Survives a whole region for writes"],
						bad: [
							"Write conflicts are guaranteed and must be resolved",
							"Uniqueness and sequences become hard",
							"Debugging is substantially harder"
						],
						verdict: "Genuinely global write workloads only."
					}
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "Vertical scaling first",
			pickWhen: "Early product, strong transactional needs, small team",
			cost: "A hard ceiling and a single failure domain — but it buys a year cheaply"
		},
		{
			choice: "Cache before replicas",
			pickWhen: "Read-heavy with a skewed access pattern (almost always)",
			cost: "Invalidation and bounded staleness"
		},
		{
			choice: "Queue the slow work",
			pickWhen: "Any request doing work the user does not need to wait for",
			cost: "Eventual consistency and a backlog to operate"
		},
		{
			choice: "Shard early",
			pickWhen: "Write-heavy from day one with an obvious partition key (tenant, city)",
			cost: "Cross-shard joins and operational complexity forever"
		},
		{
			choice: "Microservices",
			pickWhen: "Team scaling problems, or genuinely different scaling profiles",
			cost: "Network calls, partial failure, distributed debugging — rarely a performance win"
		}
	],
	wrapUp: [
		"The first bottleneck is nearly always the database — specifically its write path and its connection limit, not its storage.",
		"The largest single win is caching the hot reads, and it should come before replicas because it is cheaper and removes more load.",
		"The step to delay as long as honestly possible is sharding: everything above it is reversible, and sharding is not.",
		"Deploy safety — readiness gating, draining, canary, fast rollback — moves the availability number as much as any redundancy does.",
		"With another hour: the multi-region story, the backup and restore drill, and per-tenant isolation for the largest customers."
	],
	followUps: [
		{
			q: "You are at 100 rps and the CTO wants a microservices architecture. What do you say?",
			a: "That services solve organisational problems, not performance ones, and at 100 requests per second the performance argument does not exist. I would propose a modular monolith with clean internal boundaries, and extract a service when a specific piece has a genuinely different scaling profile or needs independent ownership — video transcoding or search indexing, typically. That keeps the option open without paying for network calls and distributed debugging today."
		},
		{
			q: "Traffic just went up 10× overnight. What do you do first?",
			a: "Find the saturated resource, because the fix differs completely. If it is the app tier, autoscaling handles it. If it is the database — which it usually is — autoscaling makes it worse by adding connections, so I would put a pooler in front, raise cache hit ratios, and rate limit at the edge. Then shed load deliberately: serve degraded or cached responses for non-critical features and protect the core transaction path."
		},
		{
			q: "How do you decide when to add a cache?",
			a: "When reads dominate and the access pattern is skewed, which is nearly always. The test is whether a small fraction of keys accounts for most reads — if so, a few gigabytes of cache removes most of the database load. I would set TTLs from how stale each piece of data may be, delete rather than update on write, and have single-flight and jittered TTLs in place from the start rather than after the first stampede."
		},
		{
			q: "What breaks that this ladder does not cover?",
			a: "The operational things: backups nobody has restored, a deploy process without a fast rollback, no distributed tracing so a latency spike takes hours to localise, and a single hot tenant that no amount of horizontal scaling fixes. Those cause more real outages than capacity does, and none of them are on the architecture diagram."
		}
	],
	related: [
		"/hld/scaling",
		"/hld/caching",
		"/hld/load-balancing",
		"/examples/interview-framework"
	],
	furtherReading: [{
		label: "roadmap.sh — system design",
		href: "https://roadmap.sh/system-design"
	}, {
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
var mediaAndMoneyExamples = [{
	slug: "youtube",
	title: "Design YouTube",
	source: "Volume 1",
	chapter: 14,
	difficulty: "advanced",
	minutes: 24,
	tags: [
		"video",
		"transcoding",
		"cdn",
		"pipeline"
	],
	companies: [
		"YouTube",
		"Netflix",
		"Vimeo",
		"TikTok"
	],
	summary: "Video is two systems joined by a pipeline: an upload and transcoding path measured in minutes, and a playback path measured in milliseconds and terabits. The interesting parts are the DAG of transcoding jobs, adaptive bitrate streaming, and the fact that the CDN — not your servers — is what actually serves the product.",
	clarifying: [
		{
			q: "Upload and playback, or playback only?",
			a: "Both, and they should be discussed as separate systems. Upload is a batch pipeline with minutes of latency; playback is a read-heavy CDN problem. Conflating them is the common mistake."
		},
		{
			q: "Live streaming or video on demand?",
			a: "On demand. Live changes the pipeline fundamentally — transcoding becomes real-time with a latency budget of seconds, and there is no time for a multi-pass encode."
		},
		{
			q: "Do we need recommendations, search and comments?",
			a: "Out of scope for this round, stated explicitly. Each is its own system, and trying to cover all of them produces a shallow answer everywhere."
		},
		{
			q: "What scale?",
			a: "500 hours uploaded per minute and a billion hours watched per day. Those two numbers put the design in the 'CDN and pipeline' regime rather than the 'web app' one."
		},
		{
			q: "Global audience?",
			a: "Yes, which makes CDN strategy and regional replication of popular content central rather than an optimisation."
		}
	],
	requirements: {
		functional: [
			"Upload a video of arbitrary size and format",
			"Transcode into multiple resolutions and codecs",
			"Stream with adaptive bitrate over unreliable networks",
			"Thumbnails, duration and basic metadata",
			"Resume an interrupted upload"
		],
		nonFunctional: [
			"Playback starts within ~1 second",
			"Minimal rebuffering on variable connections",
			"Uploads never lost, even across client and worker failures",
			"Transcoding completes in minutes, not hours, for typical videos",
			"Cost per delivered gigabyte kept under control"
		]
	},
	math: [
		{
			label: "Upload volume",
			expr: "500 hours/min × 60 × 24 = 720,000 hours/day",
			result: "≈ 30,000 h/hour",
			note: "Transcoding this in real time needs tens of thousands of concurrent encoder cores."
		},
		{
			label: "Storage per source video",
			expr: "1 hour of 1080p source ≈ 4 GB",
			result: "≈ 2.9 PB/day raw",
			note: "Before transcoding. Keep the source in cold storage; it is rarely read again."
		},
		{
			label: "Transcoding multiplier",
			expr: "renditions at 240p/360p/480p/720p/1080p/4K ≈ 1.5× the source",
			result: "≈ 4.4 PB/day total",
			note: "Storing every rendition of every video is why unpopular renditions are generated lazily."
		},
		{
			label: "Delivery bandwidth",
			expr: "1 B watch-hours/day × 1.5 GB/hour ÷ 86,400 s",
			result: "≈ 17 TB/s",
			note: "≈ 140 Tbps. This is entirely a CDN number; no origin serves this."
		},
		{
			label: "Popularity skew",
			expr: "~1% of videos ≈ 90% of views",
			result: "cache the head",
			note: "A small cached fraction serves nearly all traffic, which is what makes the economics work."
		}
	],
	apis: [
		{
			method: "POST",
			path: "/v1/uploads",
			desc: "Initiate — returns an upload id and a set of signed part URLs"
		},
		{
			method: "PUT",
			path: "{signedUrl}/parts/{n}",
			desc: "Client uploads chunks directly to object storage, bypassing your servers"
		},
		{
			method: "POST",
			path: "/v1/uploads/{id}/complete",
			desc: "Assemble parts, verify checksum, enqueue transcoding"
		},
		{
			method: "GET",
			path: "/v1/videos/{id}/manifest.m3u8",
			desc: "HLS manifest listing renditions — the entry point to playback"
		},
		{
			method: "GET",
			path: "{cdn}/v/{id}/{rendition}/seg-{n}.ts",
			desc: "Segment fetch — served from the edge, never from origin"
		},
		{
			method: "GET",
			path: "/v1/videos/{id}",
			desc: "Metadata: title, duration, thumbnails, available renditions"
		}
	],
	dataModel: [
		{
			entity: "videos",
			fields: [
				"id (pk)",
				"owner_id (idx)",
				"title",
				"duration_s",
				"status",
				"source_key",
				"created_at",
				"visibility"
			]
		},
		{
			entity: "renditions",
			fields: [
				"video_id (fk)",
				"resolution",
				"codec",
				"bitrate",
				"manifest_key",
				"state",
				"bytes"
			]
		},
		{
			entity: "transcode_jobs",
			fields: [
				"id (pk)",
				"video_id",
				"segment_index",
				"profile",
				"state",
				"attempts",
				"worker_id"
			]
		},
		{
			entity: "uploads",
			fields: [
				"id (pk)",
				"user_id",
				"parts_completed[]",
				"checksum",
				"expires_at"
			]
		},
		{
			entity: "view_events",
			fields: [
				"video_id",
				"ts",
				"position_s",
				"quality",
				"rebuffer_ms",
				"→ analytics stream"
			]
		}
	],
	architecture: [{
		heading: "Two systems, one pipeline",
		diagram: {
			kind: "system",
			caption: "Upload and transcode is batch; playback is edge. They meet at object storage.",
			columns: [
				{
					title: "Upload",
					nodes: [{
						id: "cl",
						label: "Client",
						sub: "chunked, resumable"
					}, {
						id: "s3",
						label: "Object storage",
						sub: "direct via signed URLs",
						tone: "accent"
					}]
				},
				{
					title: "Pipeline",
					nodes: [
						{
							id: "insp",
							label: "Inspect",
							sub: "codec, duration, validity"
						},
						{
							id: "split",
							label: "Split into segments",
							sub: "parallelism unit",
							tone: "accent"
						},
						{
							id: "enc",
							label: "Encoder fleet",
							sub: "one job per segment × profile",
							tone: "ok"
						},
						{
							id: "pack",
							label: "Package",
							sub: "HLS/DASH manifests"
						}
					]
				},
				{
					title: "Storage",
					nodes: [{
						id: "hot",
						label: "Hot renditions",
						sub: "popular, all qualities"
					}, {
						id: "cold",
						label: "Source archive",
						sub: "glacier-class"
					}]
				},
				{
					title: "Playback",
					nodes: [{
						id: "cdn",
						label: "CDN",
						sub: "99%+ of bytes",
						tone: "ok"
					}, {
						id: "pl",
						label: "Player",
						sub: "ABR ladder switching"
					}]
				}
			]
		},
		steps: [
			{
				title: "Client uploads directly to object storage",
				text: "Your API issues signed URLs; the bytes never transit your servers. This removes an enormous bandwidth cost and an entire class of scaling problem.",
				detail: "Multipart with per-part checksums means a failed part is retried, not the whole file."
			},
			{
				title: "Inspect and validate",
				text: "Probe the container: codec, duration, resolution, whether it is actually a video. Reject early rather than after twenty minutes of encoding."
			},
			{
				title: "Split into segments",
				text: "Cut the source at keyframe boundaries into segments of a few seconds. Each segment is an independent transcoding unit, which is what makes the pipeline parallel.",
				detail: "A one-hour video becomes ~1,200 segments × 6 profiles ≈ 7,200 independent jobs."
			},
			{
				title: "Transcode in parallel",
				text: "A fleet of encoder workers pulls jobs. Because segments are independent, a two-hour video can transcode in minutes given enough workers."
			},
			{
				title: "Package and publish",
				text: "Assemble segments into per-rendition playlists and a master manifest, write to storage, then flip the video's status to ready."
			},
			{
				title: "Serve from the CDN",
				text: "The player fetches the manifest, then segments. Popular content is cached at the edge; the origin sees almost nothing."
			}
		],
		callout: {
			kind: "insight",
			text: "Segment-level parallelism is the key idea in the whole pipeline. Transcoding a two-hour film as one job takes hours and cannot be retried cheaply; splitting it into thousands of independent segment jobs makes it fast, retryable, and schedulable on spot capacity."
		}
	}, {
		heading: "The transcoding DAG",
		body: ["Transcoding is not one operation but a graph of them, and modelling it as a DAG is what makes the pipeline extensible: adding watermarking or a new codec is a new node, not a rewrite."],
		diagram: {
			kind: "flow",
			caption: "Each node is retryable; each edge is a dependency the scheduler enforces.",
			rows: [
				[
					{
						id: "src",
						label: "Source in storage",
						tone: "accent"
					},
					{
						id: "probe",
						label: "Probe / validate"
					},
					{
						id: "seg",
						label: "Segment at keyframes"
					}
				],
				[
					{
						id: "v1",
						label: "Encode 240p",
						sub: "per segment"
					},
					{
						id: "v2",
						label: "Encode 720p",
						sub: "per segment"
					},
					{
						id: "v3",
						label: "Encode 1080p",
						sub: "per segment"
					},
					{
						id: "au",
						label: "Encode audio",
						sub: "separate track"
					}
				],
				[
					{
						id: "thumb",
						label: "Thumbnails",
						sub: "sampled frames"
					},
					{
						id: "pack2",
						label: "Package HLS + DASH",
						sub: "manifests"
					},
					{
						id: "pub",
						label: "Publish + invalidate",
						sub: "status → ready",
						tone: "ok"
					}
				]
			]
		},
		code: {
			title: "Job scheduling: idempotent, retryable, spot-friendly",
			lang: "ts",
			source: `// Each job is (videoId, segmentIndex, profile) — a deterministic identity,
// so a retry writes the same output key and duplicate execution is harmless.
type TranscodeJob = { videoId: string; segment: number; profile: Profile };

function outputKey(j: TranscodeJob) {
  return \`v/\${j.videoId}/\${j.profile.name}/seg-\${j.segment}.ts\`;
}

async function run(job: TranscodeJob) {
  const key = outputKey(job);
  if (await storage.exists(key)) return;          // already done: idempotent no-op

  const src = await storage.getRange(sourceKey(job.videoId), segmentRange(job.segment));
  const out = await ffmpeg.encode(src, job.profile);
  await storage.put(key, out);                     // same key on every retry

  await jobs.markComplete(job);
  if (await jobs.allComplete(job.videoId, job.profile)) {
    await enqueue({ type: "package", videoId: job.videoId, profile: job.profile });
  }
}

// Because jobs are idempotent and independent, encoders can run on
// interruptible spot instances — a worker dying costs one segment.`
		},
		bullets: [
			"Prioritise the ladder: publish 480p and 720p first so the video becomes watchable in a minute, and let 4K finish later. Users care about availability far more than about maximum quality.",
			"Generate rare renditions lazily. Storing 4K for a video with 40 views is pure cost; transcode on first request and cache the result.",
			"Encoding is CPU-bound and embarrassingly parallel, which makes it the ideal spot-instance workload — provided jobs are idempotent and small."
		]
	}],
	deepDives: [
		{
			heading: "Adaptive bitrate streaming",
			body: ["The player, not the server, decides quality. The manifest advertises a ladder of renditions; the player measures throughput and buffer level and switches between them at segment boundaries. That is why the segments must be aligned across renditions."],
			code: {
				title: "An HLS master manifest is just a list of options",
				lang: "text",
				source: `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240,CODECS="avc1.42e00a,mp4a.40.2"
240p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8

# Each rendition playlist lists segments:
#EXTINF:6.0,
seg-0001.ts
#EXTINF:6.0,
seg-0002.ts

# Segments are keyframe-aligned across renditions, so the player can switch
# from 720p to 480p at segment 42 and the video does not stutter.`
			},
			table: {
				headers: ["Decision", "Trade-off"],
				rows: [
					["Segment length 2 s", "Faster quality adaptation and lower startup latency; more requests and more overhead"],
					["Segment length 10 s", "Fewer requests, better compression; slow to react to bandwidth changes"],
					["Start at the lowest rendition", "Playback starts fast; first seconds look poor"],
					["Start at an estimated rendition", "Better first impression; risks an immediate rebuffer"],
					["Large player buffer", "Resilient to bandwidth dips; wasted bandwidth if the user abandons"],
					["More ladder rungs", "Smoother adaptation; more transcoding and storage cost"]
				]
			},
			bullets: [
				"Rebuffering is the metric that matters, far more than resolution. Users tolerate 480p; they abandon on a spinner.",
				"Segments are ordinary HTTP GETs, which is precisely why any HTTP CDN can serve video — that design choice is what made streaming cheap.",
				"Newer codecs (AV1, HEVC) cut bandwidth substantially but cost much more to encode and are not universally supported, so you ship several codec ladders and let the manifest advertise what the device can play."
			]
		},
		{
			heading: "Delivery economics",
			bullets: [
				"At roughly 140 Tbps, bandwidth is the dominant cost of the entire product. Every design decision on the playback path is a cost decision.",
				"Popularity is extremely skewed: caching the top small percentage of content at the edge serves the overwhelming majority of bytes. Pre-push newly popular content to edges rather than waiting for it to be pulled.",
				"Multi-CDN with traffic steering by measured performance and price is standard at this scale, and it doubles as availability: one CDN degrading is a routing change, not an outage.",
				"Tiered storage: hot renditions on fast storage, the original source in archival storage. Sources are almost never read again, but you cannot delete them because a new codec may require re-encoding.",
				"ISP peering and embedded caches inside ISP networks are the last step — that is where the largest providers get their unit costs down."
			],
			math: [
				{
					label: "Cache effectiveness",
					expr: "1% of catalogue ≈ 90% of views",
					result: "small cache, huge offload"
				},
				{
					label: "Lazy rendition savings",
					expr: "most videos never receive a 4K request",
					result: "~40% of transcode + storage saved",
					note: "Generate on demand for the tail; pre-generate for the head."
				},
				{
					label: "Codec saving",
					expr: "AV1 ≈ 30% fewer bits than H.264 at similar quality",
					result: "30% of the largest cost line",
					note: "Against 5-10× the encoding CPU — worth it for popular content only."
				}
			]
		},
		{
			heading: "Resumable upload, and what goes wrong",
			steps: [
				{
					title: "Client requests an upload session",
					text: "The API records an upload id and returns signed URLs for parts. State is server-side so the client can resume after being closed entirely."
				},
				{
					title: "Parts upload independently",
					text: "Each part carries a checksum. A failed part is retried on its own; a flaky mobile connection costs seconds rather than the whole file."
				},
				{
					title: "Complete and verify",
					text: "The client signals completion, the service verifies all parts and the overall checksum, and only then enqueues transcoding.",
					detail: "Verify before transcoding — encoding a corrupt file wastes minutes of CPU and produces a confusing failure."
				},
				{
					title: "Handle abandonment",
					text: "Sessions expire and orphaned parts are cleaned up, or storage slowly fills with fragments of uploads nobody finished."
				}
			],
			table: {
				headers: [
					"Failure",
					"User sees",
					"Handling"
				],
				rows: [
					[
						"Network drop mid-upload",
						"Progress pauses, then resumes",
						"Part-level retry against the same upload id"
					],
					[
						"Corrupt part",
						"Nothing",
						"Checksum mismatch → re-upload that part only"
					],
					[
						"Encoder crash",
						"Nothing",
						"Segment job retried; idempotent output key"
					],
					[
						"Unsupported codec",
						"Clear error within seconds",
						"Probe and reject at inspection, before encoding"
					],
					[
						"Transcoding backlog",
						"'Processing' for longer",
						"Prioritise low renditions so it becomes watchable sooner"
					],
					[
						"Storage write failure",
						"Upload fails",
						"Retry with backoff; the source is the one thing that must not be lost"
					]
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "Direct-to-storage upload",
			pickWhen: "Always for large files",
			cost: "Signed-URL management and client-side complexity; saves enormous bandwidth"
		},
		{
			choice: "Segment-level transcoding",
			pickWhen: "Any non-trivial video length",
			cost: "A job scheduler and a DAG to operate; gains parallelism and cheap retries"
		},
		{
			choice: "Pre-generate all renditions",
			pickWhen: "Content is known to be popular",
			cost: "Storage and CPU for renditions nobody watches"
		},
		{
			choice: "Lazy rendition generation",
			pickWhen: "Long-tail catalogue",
			cost: "First viewer of a rare quality waits"
		},
		{
			choice: "Multi-CDN",
			pickWhen: "Large delivery volume",
			cost: "Steering logic and reconciliation across providers; buys cost leverage and availability"
		},
		{
			choice: "Newer codec (AV1)",
			pickWhen: "High-view content where bandwidth dominates",
			cost: "Much higher encoding cost and partial device support"
		}
	],
	wrapUp: [
		"Upload and playback are separate systems joined by object storage — one is a batch pipeline, the other is an edge cache problem.",
		"Segment-level parallelism makes transcoding fast, retryable and cheap enough to run on interruptible capacity.",
		"The player drives quality through an adaptive bitrate ladder, which is why segments must be keyframe-aligned across renditions.",
		"Bandwidth is the dominant cost, so the CDN strategy is an economic design decision, not an implementation detail.",
		"With another hour: live streaming, DRM and content protection, and the recommendation pipeline."
	],
	followUps: [
		{
			q: "How long does a two-hour video take to transcode?",
			a: "It depends almost entirely on parallelism, which is the point of segmenting. Split into six-second segments, a two-hour video is about 1,200 segments per profile, and with a thousand workers available it completes in a few minutes rather than hours. I would also publish the mid-range renditions first so it becomes watchable before the whole ladder finishes."
		},
		{
			q: "A video goes viral. What happens?",
			a: "Almost nothing on my infrastructure, because the CDN absorbs it — that is the entire point of segments being plain HTTP objects. What I would want is proactive pre-push of that content to edges rather than waiting for each PoP to pull it, and generation of any renditions that were left lazy. The origin only sees the first request per segment per edge."
		},
		{
			q: "How does the player decide what quality to use?",
			a: "It measures download throughput and its own buffer level and picks a rung of the ladder at each segment boundary. Because renditions are keyframe-aligned, switching is seamless. The heuristic usually starts conservative to get playback going quickly, then steps up — since rebuffering costs far more in user terms than a few seconds of lower resolution."
		},
		{
			q: "Where do you store the original file?",
			a: "In archival-class storage, indefinitely. It is almost never read after transcoding, but you cannot delete it, because a new codec or a re-encode with different settings requires the source. Renditions live on faster storage tiered by popularity, with rare qualities generated on demand rather than kept warm."
		},
		{
			q: "How would live streaming change this?",
			a: "Fundamentally. There is no time for multi-pass encoding or for reordering segments, so transcoding becomes a real-time pipeline with a hard latency budget, typically producing segments of a couple of seconds. The manifest becomes a sliding window rather than a complete list, and low-latency variants push partial segments. The delivery path stays similar, which is the one piece that carries over."
		}
	],
	related: [
		"/hld/cdn",
		"/hld/message-queues",
		"/examples/netflix",
		"/hld/caching"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}, {
	slug: "payment",
	title: "Design a Payment System",
	source: "Volume 2",
	chapter: 11,
	difficulty: "advanced",
	minutes: 24,
	tags: [
		"ledger",
		"idempotency",
		"reconciliation",
		"correctness"
	],
	companies: [
		"Stripe",
		"PayPal",
		"Adyen",
		"Square"
	],
	summary: "Payments is the design where correctness beats every other consideration. The architecture is unremarkable — a service, a ledger, a queue, a provider — and the entire interview is about what happens when a call times out, whether the books balance, and how you find out when they do not.",
	clarifying: [
		{
			q: "Are we building the card network or an application on top of a PSP?",
			a: "An application on top of a provider like Stripe or Adyen. Building card-network integration is a different, much more regulated problem worth naming and setting aside."
		},
		{
			q: "One currency or many?",
			a: "Multiple, which means every amount carries a currency, exchange rates are versioned, and you never sum across currencies without an explicit conversion."
		},
		{
			q: "Do we need refunds, partial captures and chargebacks?",
			a: "Yes. These are what make a ledger necessary — a single status column cannot represent a partially refunded, partially captured payment with a disputed portion."
		},
		{
			q: "What consistency do we need?",
			a: "Strong, on the ledger. This is the clearest case in system design for choosing consistency over availability: refusing a payment is recoverable, double-charging is not."
		},
		{
			q: "What volume?",
			a: "Assume 10,000 payments per second at peak. High, but the ledger write rate is what constrains the design, not the request rate."
		}
	],
	requirements: {
		functional: [
			"Accept a payment, authorise and capture through a provider",
			"Full and partial refunds",
			"Double-entry ledger recording every movement of money",
			"Webhook handling for asynchronous provider events",
			"Reconciliation against provider settlement files",
			"Payouts to merchants"
		],
		nonFunctional: [
			"No double charges, ever, under any retry or failure",
			"Every balance derivable from the ledger; the books always balance",
			"Complete audit trail — nothing is ever updated in place",
			"Payment result known within seconds",
			"PCI scope minimised — card data never touches your servers"
		]
	},
	math: [
		{
			label: "Ledger write volume",
			expr: "10,000 payments/s × ~4 ledger entries each",
			result: "40,000 rows/s",
			note: "Append-only inserts, which is the cheapest thing a database does — and why the ledger is append-only."
		},
		{
			label: "Storage",
			expr: "40,000/s × 200 B × 86,400 × 365",
			result: "≈ 250 TB/year",
			note: "Retained for years for regulatory reasons. Partition by month; archive cold partitions."
		},
		{
			label: "Reconciliation window",
			expr: "provider settlement files arrive daily",
			result: "T+1 truth",
			note: "So your view and theirs can disagree for up to a day — the design must expect and detect that."
		},
		{
			label: "Cost of one double charge",
			expr: "refund + support contact + trust",
			result: "≫ any latency saving",
			note: "This is the sentence that justifies every synchronous, careful decision in the design."
		}
	],
	apis: [
		{
			method: "POST",
			path: "/v1/payments",
			desc: "Create — requires Idempotency-Key; returns the payment and its state"
		},
		{
			method: "POST",
			path: "/v1/payments/{id}/capture",
			desc: "Capture an authorised payment, fully or partially"
		},
		{
			method: "POST",
			path: "/v1/payments/{id}/refund",
			desc: "Refund — also idempotent, also a ledger movement"
		},
		{
			method: "GET",
			path: "/v1/payments/{id}",
			desc: "State plus the ledger entries that produced it"
		},
		{
			method: "POST",
			path: "/webhooks/psp",
			desc: "Provider events — signature-verified, deduplicated, replayable"
		},
		{
			method: "GET",
			path: "/v1/balances/{account}",
			desc: "Derived from the ledger, never stored as a mutable field"
		}
	],
	dataModel: [
		{
			entity: "payments",
			fields: [
				"id (pk)",
				"idempotency_key (unique)",
				"merchant_id (idx)",
				"amount_minor, currency",
				"state",
				"psp_reference",
				"created_at"
			]
		},
		{
			entity: "ledger_entries",
			fields: [
				"id (pk)",
				"transaction_id (idx) — groups the entries of one movement",
				"account_id (idx)",
				"direction (debit|credit)",
				"amount_minor, currency",
				"created_at",
				"→ append-only, never updated"
			]
		},
		{
			entity: "payment_events",
			fields: [
				"payment_id (idx)",
				"seq",
				"type",
				"payload",
				"occurred_at",
				"→ the state machine's history"
			]
		},
		{
			entity: "webhook_events",
			fields: [
				"provider_event_id (unique)",
				"received_at",
				"processed_at",
				"→ dedupe key"
			]
		},
		{
			entity: "reconciliation",
			fields: [
				"settlement_date",
				"psp_reference",
				"our_amount",
				"their_amount",
				"status",
				"resolved_at"
			]
		}
	],
	architecture: [{
		heading: "The payment state machine",
		lede: "Every illegal transition must be impossible, not merely unlikely.",
		diagram: {
			kind: "flow",
			caption: "Authorise and capture are separate states for a reason: goods ship between them.",
			rows: [
				[
					{
						id: "init",
						label: "INITIATED",
						tone: "accent"
					},
					{
						id: "auth",
						label: "AUTHORISED",
						sub: "funds held"
					},
					{
						id: "cap",
						label: "CAPTURED",
						sub: "money moved",
						tone: "ok"
					},
					{
						id: "set",
						label: "SETTLED",
						sub: "confirmed by provider",
						tone: "ok"
					}
				],
				[
					{
						id: "fail",
						label: "FAILED",
						sub: "declined — terminal",
						tone: "bad"
					},
					{
						id: "void",
						label: "VOIDED",
						sub: "auth released before capture",
						tone: "warn"
					},
					{
						id: "ref",
						label: "REFUNDED",
						sub: "full or partial",
						tone: "warn"
					},
					{
						id: "cb",
						label: "CHARGEBACK",
						sub: "disputed after settlement",
						tone: "bad"
					}
				],
				[{
					id: "unk",
					label: "UNKNOWN",
					sub: "provider timed out — must be resolved",
					tone: "warn"
				}]
			]
		},
		code: {
			title: "The transition table, and the state everyone forgets",
			lang: "ts",
			source: `const ALLOWED: Record<State, State[]> = {
  INITIATED:  ["AUTHORISED", "FAILED", "UNKNOWN"],
  UNKNOWN:    ["AUTHORISED", "FAILED"],       // resolved by query or reconciliation
  AUTHORISED: ["CAPTURED", "VOIDED", "FAILED"],
  CAPTURED:   ["SETTLED", "REFUNDED"],
  SETTLED:    ["REFUNDED", "CHARGEBACK"],
  REFUNDED:   ["CHARGEBACK"],                  // yes, a refunded payment can still be disputed
  VOIDED:     [],
  FAILED:     [],
  CHARGEBACK: [],
};

// UNKNOWN is the state most designs omit and the one that causes real losses.
// It means: we sent a request to the provider and never learned the outcome.
// It is NOT failure. Treating it as failure and retrying is how you double-charge.
//
// Resolution: query the provider by our idempotency key, and if that is
// inconclusive, wait for the settlement file. Never guess.`
		},
		callout: {
			kind: "warn",
			text: "A timeout is not a decline. If you treat an unknown outcome as failed and let the customer retry, you can charge them twice — and the second charge will look perfectly legitimate in your logs. Modelling UNKNOWN explicitly is the single most important thing in this design."
		}
	}, {
		heading: "Double-entry ledger",
		body: ["Every movement of money is recorded as balanced debits and credits across accounts. Balances are derived by summing entries, never stored as a mutable number. That one rule gives you an audit trail, makes bugs detectable by an invariant, and turns 'what happened to this money' into a query rather than an investigation."],
		code: {
			title: "One payment, four entries, sum zero",
			lang: "sql",
			source: `-- Customer pays 100.00, of which 3.00 is our fee.
-- Every transaction_id's entries must sum to zero. That invariant is checkable.

INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_minor, currency) VALUES
  ('txn_9f3', 'customer:cus_1',      'debit',  10000, 'USD'),  -- customer pays
  ('txn_9f3', 'merchant:mer_7',      'credit',  9700, 'USD'),  -- merchant receivable
  ('txn_9f3', 'revenue:fees',        'credit',   300, 'USD'),  -- our fee
  ('txn_9f3', 'psp:stripe_holding',  'debit',      0, 'USD');  -- clearing account

-- Balance is a query, not a column:
SELECT SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE -amount_minor END)
FROM ledger_entries WHERE account_id = 'merchant:mer_7' AND currency = 'USD';

-- The invariant that catches almost every bug, run continuously:
SELECT transaction_id,
       SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE -amount_minor END) AS imbalance
FROM ledger_entries GROUP BY transaction_id HAVING imbalance <> 0;
-- Any row returned is a bug. Alert on it immediately.`
		},
		bullets: [
			"Amounts are integers in the currency's minor unit. Floating-point money is a defect, not a style choice — 0.1 + 0.2 is not 0.3.",
			"Never sum across currencies. A multi-currency balance is a set of balances, and conversion is an explicit transaction with a recorded rate.",
			"Entries are append-only. A correction is a new reversing entry, never an update — that is what makes the history trustworthy.",
			"A refund is not a deletion; it is a new transaction moving money the other way, with its own id and its own entries.",
			"Cache balances if you must, but derive the authoritative number from entries and reconcile the cache continuously."
		]
	}],
	deepDives: [
		{
			heading: "Idempotency end to end",
			diagram: {
				kind: "sequence",
				caption: "The key is claimed before any provider call, and the response is stored for replay.",
				actors: [
					{
						id: "c",
						label: "Client"
					},
					{
						id: "api",
						label: "Payment API"
					},
					{
						id: "db",
						label: "Database"
					},
					{
						id: "psp",
						label: "Provider"
					}
				],
				messages: [
					{
						from: "c",
						to: "api",
						label: "POST /v1/payments  Idempotency-Key: 8f14…",
						kind: "call"
					},
					{
						from: "api",
						to: "db",
						label: "INSERT key ... ON CONFLICT DO NOTHING",
						kind: "call",
						tone: "accent",
						note: "the unique constraint is the lock"
					},
					{
						from: "db",
						to: "api",
						label: "claimed (first time)",
						kind: "return"
					},
					{
						from: "api",
						to: "psp",
						label: "charge(..., idempotencyKey: same key)",
						kind: "call",
						note: "the key travels downstream too"
					},
					{
						from: "psp",
						to: "api",
						label: "timeout ✗",
						kind: "return",
						tone: "bad",
						note: "outcome unknown — do NOT retry blindly"
					},
					{
						from: "api",
						to: "db",
						label: "state = UNKNOWN",
						kind: "call",
						tone: "warn"
					},
					{
						from: "api",
						to: "psp",
						label: "query by idempotency key",
						kind: "call",
						note: "resolve rather than guess"
					},
					{
						from: "psp",
						to: "api",
						label: "succeeded, reference ch_123",
						kind: "return",
						tone: "ok"
					},
					{
						from: "api",
						to: "db",
						label: "state = AUTHORISED + ledger entries (one tx)",
						kind: "call",
						tone: "ok"
					},
					{
						from: "c",
						to: "api",
						label: "retry with the same key → same response",
						kind: "call",
						note: "replayed, no second charge"
					}
				]
			},
			code: {
				title: "Claim, act, store — all inside one transaction",
				lang: "ts",
				source: `async function createPayment(req: Request) {
  const key = req.header("Idempotency-Key");
  if (!key) return badRequest("Idempotency-Key required");
  const fingerprint = hash(req.body);

  return db.transaction(async (tx) => {
    const claim = await tx\`
      INSERT INTO idempotency_keys (key, fingerprint, state)
      VALUES (\${key}, \${fingerprint}, 'in_progress')
      ON CONFLICT (key) DO NOTHING RETURNING key\`;

    if (claim.length === 0) {
      const prior = await tx\`SELECT * FROM idempotency_keys WHERE key = \${key}\`;
      if (prior[0].fingerprint !== fingerprint) {
        return unprocessable("Idempotency-Key reused with a different payload");
      }
      if (prior[0].state === "in_progress") return conflict("in progress, retry shortly");
      return replay(prior[0].response);      // same status, same body, same payment id
    }

    const result = await charge(req.body, key);      // provider call carries the same key
    await writeLedgerEntries(tx, result);            // ledger + state in the SAME tx
    await tx\`UPDATE idempotency_keys SET state='completed', response=\${json(result)}
             WHERE key = \${key}\`;
    return result;
  });
}`
			},
			bullets: [
				"The key is claimed before the provider is called, so two concurrent retries cannot both reach the provider.",
				"The provider call carries the same key, which closes the last gap: a timeout followed by a retry hits the provider's own deduplication.",
				"The stored response must include the payment id, or a retrying client cannot correlate its request with the payment that exists.",
				"Fingerprint the payload: a key reused with a different amount is a client bug and must be a clear error, not a silent replay."
			]
		},
		{
			heading: "Webhooks and asynchronous truth",
			bullets: [
				"Providers report the real outcome asynchronously, and your synchronous response is only a preliminary view. Design for the webhook to be the authority.",
				"Verify the signature on every webhook. An unauthenticated payment-succeeded webhook is a way to give away goods for free.",
				"Deduplicate on the provider's event id — webhooks are delivered at least once, and duplicates are routine.",
				"Handle out-of-order delivery: a 'captured' event can arrive before 'authorised'. Use the state machine to reject impossible transitions and buffer or re-fetch rather than corrupting state.",
				"Return 200 quickly and process asynchronously. A slow webhook handler causes the provider to retry, which multiplies your load during an incident.",
				"Have a replay path. When your handler has a bug, you need to reprocess a day of events — which requires storing the raw payloads."
			],
			code: {
				title: "Webhook handler: verify, dedupe, enqueue",
				lang: "ts",
				source: `app.post("/webhooks/psp", async (req, res) => {
  if (!verifySignature(req.rawBody, req.header("PSP-Signature"))) {
    return res.status(401).end();                 // never process an unverified webhook
  }

  const event = JSON.parse(req.rawBody);

  const inserted = await db\`
    INSERT INTO webhook_events (provider_event_id, payload, received_at)
    VALUES (\${event.id}, \${req.rawBody}, now())
    ON CONFLICT (provider_event_id) DO NOTHING RETURNING id\`;

  res.status(200).end();                          // ack fast — processing is async

  if (inserted.length === 0) return;              // duplicate delivery: already have it
  await queue.publish("psp.events", { eventId: event.id });
});`
			}
		},
		{
			heading: "Reconciliation: assume you are wrong",
			body: ["Your records and the provider's will disagree — because of timeouts, dropped webhooks, manual interventions, and provider-side adjustments. Reconciliation is the process that finds those disagreements before a customer or an auditor does."],
			steps: [
				{
					title: "Ingest the settlement file",
					text: "Providers publish a daily file of everything they believe happened, with their references and amounts. This is the external source of truth."
				},
				{
					title: "Match by reference",
					text: "Join their records to yours on the provider reference. Most match exactly and need no attention."
				},
				{
					title: "Classify the breaks",
					text: "In their file but not ours (a charge we never recorded — usually a lost webhook), in ours but not theirs (a payment stuck in UNKNOWN), or matched with different amounts (fees, currency conversion, partial capture)."
				},
				{
					title: "Auto-resolve the known patterns",
					text: "Most breaks have a mechanical explanation — a fee line, a timing difference across the day boundary. Encode those rules so humans only see the genuinely unexplained."
				},
				{
					title: "Escalate the rest",
					text: "Anything unexplained goes to a queue a human works. The number of open breaks and their age are first-class operational metrics."
				}
			],
			table: {
				headers: [
					"Break type",
					"Likely cause",
					"Resolution"
				],
				rows: [
					[
						"In provider, not in ledger",
						"Webhook lost, or we timed out and never resolved",
						"Create the missing ledger entries from their record"
					],
					[
						"In ledger, not in provider",
						"Payment stuck in UNKNOWN that actually failed",
						"Reverse with a compensating entry"
					],
					[
						"Amount mismatch",
						"Fees, FX, or a partial capture",
						"Usually a rule; encode it and stop paging people"
					],
					[
						"Duplicate in provider",
						"Double submission that idempotency did not catch",
						"Refund one and investigate the gap urgently"
					],
					[
						"Timing difference",
						"Captured near midnight, settled the next day",
						"Match across a window, not a single day"
					]
				]
			},
			callout: {
				kind: "interview",
				text: "Volunteering reconciliation is one of the strongest signals in this question. Most candidates design the happy path and stop; anyone who has run a payment system knows the daily break report is where the real work lives."
			}
		},
		{
			heading: "Security and compliance boundaries",
			bullets: [
				"Card data must never touch your servers. The client tokenises directly with the provider — via their hosted fields or SDK — and you only ever see a token. That is what keeps PCI scope small.",
				"Store the last four digits and the brand for display, nothing more. If you can decrypt a card number, you are in the highest compliance tier.",
				"Encrypt at rest, restrict access by role, and log every access to payment records. Access logs are an audit requirement, not a nice-to-have.",
				"Fraud checks belong before authorisation, as a separate service with its own latency budget and a fail-open or fail-closed policy you decide in advance.",
				"Strong customer authentication (3-D Secure) adds an asynchronous redirect into the flow, which means the payment state machine needs a pending-authentication state."
			]
		}
	],
	tradeoffs: [
		{
			choice: "Double-entry ledger",
			pickWhen: "Always for money",
			cost: "More rows and more discipline; gains auditability and a checkable invariant"
		},
		{
			choice: "Strong consistency on the ledger",
			pickWhen: "Always",
			cost: "Lower availability during a partition — the correct trade for money"
		},
		{
			choice: "Synchronous authorisation",
			pickWhen: "The user is waiting and needs an answer",
			cost: "You inherit the provider's latency and its timeouts"
		},
		{
			choice: "Asynchronous capture",
			pickWhen: "Goods ship later; you want to authorise now and capture on fulfilment",
			cost: "Authorisations expire — typically after a week — and must be tracked"
		},
		{
			choice: "Multiple providers",
			pickWhen: "Provider outage is unacceptable, or routing by cost matters",
			cost: "Two integrations, two reconciliation processes, and unified reporting to build"
		},
		{
			choice: "Store the raw webhook payloads",
			pickWhen: "Always",
			cost: "Storage — and it is what makes replay after a handler bug possible"
		}
	],
	wrapUp: [
		"The ledger is the system: append-only double-entry, integer minor units, balances derived by query, and a continuously checked invariant that every transaction sums to zero.",
		"Idempotency runs end to end — the client's key is claimed before the provider call, travels to the provider, and the stored response is replayed on retry.",
		"UNKNOWN is a first-class state. A timeout is not a decline, and resolving it by querying rather than retrying is what prevents double charges.",
		"Reconciliation against the provider's settlement file is not optional; the open-break count and age are operational metrics like any other.",
		"With another hour: multi-provider routing and failover, payouts and their own ledger accounts, and the fraud-check path with its latency budget."
	],
	followUps: [
		{
			q: "The provider call times out. What do you do?",
			a: "Move the payment to UNKNOWN and resolve it rather than guess. I query the provider by our idempotency key, which is why that key must travel downstream. If the query is inconclusive, the payment stays UNKNOWN until the settlement file resolves it. What I never do is treat a timeout as a decline and let the customer retry, because that is precisely how a double charge happens and it looks legitimate afterwards."
		},
		{
			q: "Why a double-entry ledger rather than a balance column?",
			a: "Because a balance column has no history and no invariant. With double entry, every movement is two or more balanced rows, the balance is a sum, and I can check continuously that every transaction sums to zero — which catches almost every class of bug automatically. A corrected mistake becomes a reversing entry rather than an update, so the audit trail stays intact, and 'where did this money go' is a query."
		},
		{
			q: "A webhook arrives twice, and out of order. How do you handle it?",
			a: "Deduplicate on the provider's event id with a unique constraint, and validate every state change against the transition table so an out-of-order event cannot move a payment backwards. If a 'captured' arrives before 'authorised', I either buffer it briefly or re-fetch the payment's current state from the provider rather than applying it blindly. Both duplicates and reordering are routine, not exceptional."
		},
		{
			q: "How do you know the system is correct?",
			a: "Three continuous checks. The ledger invariant that every transaction sums to zero, run constantly with an alert on any violation. Daily reconciliation against the provider's settlement file, with the open-break count and age as tracked metrics. And a monotonically increasing audit log so no record is ever silently changed. Correctness in payments is something you monitor, not something you assume after testing."
		},
		{
			q: "How do you handle refunds and chargebacks?",
			a: "Both are new transactions, never edits to the original. A refund creates ledger entries moving money back, referencing the original transaction, and it can be partial — which is exactly why a single status field is insufficient. A chargeback is initiated by the customer's bank and can arrive months later, even after a refund, so the state machine has to permit it from settled and refunded states, and the ledger records the disputed amount plus any fee separately."
		}
	],
	related: [
		"/hld/idempotency",
		"/examples/digital-wallet",
		"/hld/consistency",
		"/lld/repository"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
var vol1DeepA = [{
	slug: "url-shortener",
	title: "Design a URL Shortener",
	source: "Volume 1",
	chapter: 8,
	difficulty: "foundational",
	minutes: 20,
	tags: [
		"hashing",
		"base62",
		"redirect",
		"cache"
	],
	companies: [
		"TinyURL",
		"Bitly",
		"t.co",
		"goo.gl"
	],
	summary: "The classic warm-up: turn a long URL into a short key, and resolve that key back at very high read volume. It looks trivial and contains four real decisions — how to generate the key, how to guarantee uniqueness at scale, which redirect status to use, and how to serve a 100:1 read/write ratio without touching the database.",
	clarifying: [
		{
			q: "How short does the short link need to be?",
			a: "Assume 7 Base62 characters. That is 62⁷ ≈ 3.5 trillion keys — enough for a century at 100 million new links a day, and short enough to fit anywhere."
		},
		{
			q: "Can users choose custom aliases?",
			a: "Yes, and this matters: custom aliases need a uniqueness check on every keystroke, which is where a Bloom filter earns its place."
		},
		{
			q: "Do links expire?",
			a: "Support an optional expiry, defaulting to never. Expiry turns a pure key-value read into one that must also check a timestamp, and it gives you a deletion story."
		},
		{
			q: "Do we need analytics — click counts, referrers, geography?",
			a: "Yes, but asynchronously. Counting clicks on the redirect path would put a write on the hottest read in the system; emit an event instead."
		},
		{
			q: "What is the read/write ratio?",
			a: "Assume 100:1. Everything about the design follows from that: the write path can be relatively slow and careful, and the read path must be almost free."
		}
	],
	requirements: {
		functional: [
			"Shorten a long URL to a unique short key",
			"Redirect a short key to the original URL",
			"Optional custom alias, checked for availability",
			"Optional expiry per link",
			"Click analytics, collected off the redirect path"
		],
		nonFunctional: [
			"Redirect p99 under 50 ms — this is the product",
			"Short keys are unique, non-guessable enough to not be trivially enumerable",
			"Read availability far more important than write availability",
			"Links are effectively permanent unless an expiry is set"
		]
	},
	math: [
		{
			label: "Write volume",
			expr: "100 M new links/day ÷ 10⁵",
			result: "≈ 1,000 writes/s",
			note: "Peak ×3 ≈ 3,000/s. Comfortably a single well-indexed database."
		},
		{
			label: "Read volume",
			expr: "100:1 ratio → 10 B redirects/day ÷ 10⁵",
			result: "≈ 100,000 reads/s",
			note: "Peak ≈ 300,000/s. This is a cache and CDN problem, not a database one."
		},
		{
			label: "Key space",
			expr: "62⁷",
			result: "≈ 3.5 × 10¹²",
			note: "At 100 M/day that is roughly 95 years of keys. Six characters would give only ~1.5 years."
		},
		{
			label: "Storage",
			expr: "100 M/day × 500 B × 365 × 10 yr",
			result: "≈ 180 TB",
			note: "×2-3 for indexes and replication. This is where sharding eventually becomes necessary."
		},
		{
			label: "Cache sizing",
			expr: "hot 20% of a day's links × 500 B, plus a long tail",
			result: "≈ 20–50 GB",
			note: "Small enough that a 95%+ hit ratio is realistic and cheap."
		}
	],
	apis: [
		{
			method: "POST",
			path: "/v1/links",
			desc: "Create — body {longUrl, customAlias?, expiresAt?}, returns the short key"
		},
		{
			method: "GET",
			path: "/{key}",
			desc: "Resolve and redirect — the hot path, cached everywhere"
		},
		{
			method: "GET",
			path: "/v1/links/{key}",
			desc: "Metadata without redirecting (owner, clicks, expiry)"
		},
		{
			method: "GET",
			path: "/v1/links/{alias}/available",
			desc: "Custom alias availability — Bloom filter first"
		},
		{
			method: "DELETE",
			path: "/v1/links/{key}",
			desc: "Owner deletes; key is not reused"
		}
	],
	dataModel: [
		{
			entity: "links",
			fields: [
				"key (pk, 7 chars Base62)",
				"long_url (text)",
				"user_id (fk, idx)",
				"created_at",
				"expires_at (nullable, idx)",
				"is_custom (bool)"
			]
		},
		{
			entity: "click_events",
			fields: [
				"key (idx)",
				"ts",
				"referrer",
				"country",
				"ua_family",
				"→ analytics store, not the primary DB"
			]
		},
		{
			entity: "counters",
			fields: [
				"range_start (pk)",
				"range_end",
				"assigned_to",
				"→ id ranges handed to app servers"
			]
		}
	],
	architecture: [{
		heading: "Key generation: three approaches",
		lede: "This is the decision the whole design turns on.",
		diagram: {
			kind: "compare",
			caption: "Counter plus Base62 is the answer to give, with the caveats named.",
			options: [
				{
					title: "Hash the URL, take a prefix",
					sub: "MD5/SHA → first 43 bits → Base62",
					good: ["Same URL always yields the same key — natural deduplication", "No coordination between servers"],
					bad: ["Collisions are certain at scale; every insert needs a check-and-retry", "Keys are guessable from the URL if the hash is unsalted"],
					verdict: "Small scale, or when URL deduplication is an explicit requirement."
				},
				{
					title: "Counter → Base62",
					sub: "a distributed unique id, encoded",
					tone: "ok",
					good: [
						"Zero collisions by construction — no retry logic at all",
						"Fastest write path; a pure encode of a number",
						"Key length grows predictably with volume"
					],
					bad: ["Sequential keys are enumerable — someone can walk your entire link set", "Needs a distributed counter (ranges, or Snowflake-style ids)"],
					verdict: "The default. Mitigate enumeration by shuffling bits or using a large random range."
				},
				{
					title: "Random key with a uniqueness check",
					good: ["Non-enumerable", "No coordination for generation"],
					bad: ["A database round trip to check uniqueness on every write", "Retry rate grows as the key space fills"],
					verdict: "When unguessability is a hard requirement — private or paid links."
				}
			]
		},
		code: {
			title: "Counter ranges: coordination once per 10,000 links, not per link",
			lang: "ts",
			source: `// Each app server leases a range from a central counter, then hands out
// ids locally. One round trip per 10,000 links instead of one per link.
class IdRange {
  private next = 0n;
  private end = 0n;

  constructor(private store: RangeStore, private size = 10_000n) {}

  async nextId(): Promise<bigint> {
    if (this.next >= this.end) {
      const { start, end } = await this.store.leaseRange(this.size);  // atomic
      this.next = start;
      this.end = end;
    }
    return this.next++;
  }
}

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toBase62(n: bigint): string {
  if (n === 0n) return "0";
  let out = "";
  while (n > 0n) {
    out = BASE62[Number(n % 62n)] + out;
    n /= 62n;
  }
  return out;
}

// Sequential ids make sequential keys, which are enumerable. Two fixes:
//   1. Multiply by a large coprime and mask (a reversible scramble), or
//   2. XOR with a secret constant before encoding.
// Both keep uniqueness and destroy the visible ordering.
const KEY = toBase62((id * 2654435761n) & 0xFFFFFFFFFFFn);`
		},
		callout: {
			kind: "warn",
			text: "Lost ids are fine; duplicate ids are not. A server that crashes with 4,000 unused ids in its lease simply wastes them — at 3.5 trillion keys, that is irrelevant, and it is why range leasing beats a shared counter per write."
		}
	}, {
		heading: "The read path, which is the whole product",
		diagram: {
			kind: "sequence",
			caption: "Three layers of cache before the database sees anything.",
			actors: [
				{
					id: "u",
					label: "Browser"
				},
				{
					id: "cdn",
					label: "CDN / edge"
				},
				{
					id: "svc",
					label: "Redirect service"
				},
				{
					id: "r",
					label: "Redis"
				},
				{
					id: "db",
					label: "Database"
				}
			],
			messages: [
				{
					from: "u",
					to: "cdn",
					label: "GET /aB3xY9z",
					kind: "call"
				},
				{
					from: "cdn",
					to: "u",
					label: "301 (cached at edge)",
					kind: "return",
					tone: "ok",
					note: "most hot links never reach the origin"
				},
				{
					from: "cdn",
					to: "svc",
					label: "miss → forward",
					kind: "call"
				},
				{
					from: "svc",
					to: "r",
					label: "GET link:aB3xY9z",
					kind: "call",
					note: "~0.3 ms"
				},
				{
					from: "r",
					to: "svc",
					label: "hit → longUrl",
					kind: "return",
					tone: "ok"
				},
				{
					from: "svc",
					to: "db",
					label: "miss → SELECT ... WHERE key = $1",
					kind: "call",
					note: "~5 ms, then populate Redis"
				},
				{
					from: "svc",
					to: "u",
					label: "301 Location: <longUrl>",
					kind: "return",
					tone: "ok"
				},
				{
					from: "svc",
					to: "svc",
					label: "emit click event to the queue",
					kind: "self",
					note: "never a synchronous write on the redirect"
				}
			]
		},
		table: {
			headers: [
				"Layer",
				"Hit ratio",
				"Latency",
				"Notes"
			],
			rows: [
				[
					"CDN / edge",
					"60-80% for viral links",
					"~10 ms",
					"Cache-Control from the link's expiry; purge on delete"
				],
				[
					"Redis",
					"90%+ of the remainder",
					"~0.5 ms",
					"Key → long URL, TTL with jitter"
				],
				[
					"Database",
					"the rest",
					"~5 ms",
					"Primary key lookup only; no scans on this path"
				]
			]
		},
		bullets: [
			"Never write to the database on the redirect path. Click counting goes to a queue, and the counter is updated in batches — otherwise the hottest read in the system carries a write.",
			"Negative caching matters: an attacker requesting random keys will otherwise send every miss to the database. Cache 'not found' for a short TTL, and put a Bloom filter in front.",
			"A deleted or expired link should be evicted from Redis and purged at the CDN. Without the purge, the edge keeps redirecting to a link the owner deleted."
		]
	}],
	deepDives: [
		{
			heading: "301 or 302 — this is a real decision",
			table: {
				headers: [
					"",
					"301 Moved Permanently",
					"302 Found"
				],
				rows: [
					[
						"Browser caching",
						"Cached, often indefinitely",
						"Not cached by default"
					],
					[
						"Load on your service",
						"Much lower — repeat visits skip you entirely",
						"Every click reaches you"
					],
					[
						"Analytics",
						"You miss repeat clicks from the same browser",
						"You see every click"
					],
					[
						"Changing the destination",
						"Effectively impossible for cached clients",
						"Immediate"
					],
					[
						"SEO",
						"Passes link equity to the destination",
						"Does not"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "Bitly and most commercial shorteners use 302, because analytics is the product and destination changes must take effect. If your goal is minimising infrastructure cost and links never change, 301 is dramatically cheaper. State which you chose and why — that is the answer being looked for."
			}
		},
		{
			heading: "Custom aliases and the Bloom filter",
			body: ["A custom alias needs an availability check as the user types. Doing that as a database query per keystroke turns a UI nicety into thousands of queries per second against your primary key index — and an attacker can drive it for free."],
			code: {
				title: "Bloom filter in front of the existence check",
				lang: "ts",
				source: `// ~10 bits per key: 3 billion keys ≈ 3.5 GB, or shard it per prefix.
const taken = new BloomFilter({ expectedItems: 3_000_000_000, falsePositiveRate: 0.01 });

async function isAvailable(alias: string): Promise<boolean> {
  if (!taken.mightContain(alias)) return true;   // definitively free — no query at all

  // 1% of free aliases land here as a false positive: confirm with one lookup.
  return (await db.links.exists(alias)) === false;
}

// On successful creation, add to the filter. Missing this step would create a
// false NEGATIVE — the one error a Bloom filter otherwise cannot produce —
// and two users could claim the same alias.
await db.links.insert({ key: alias, longUrl, isCustom: true });
taken.add(alias);

// Creation itself still relies on the unique constraint for correctness:
//   INSERT ... ON CONFLICT (key) DO NOTHING  →  0 rows means someone won the race.`
			},
			bullets: [
				"The Bloom filter is an optimisation, never the source of truth. The unique constraint on the key column is what actually prevents duplicates.",
				"Reserve a denylist of aliases: reserved words, profanity, anything that looks like your own routes (/api, /admin, /login).",
				"Custom aliases and generated keys share one namespace, so a generated key must never collide with an existing custom alias — the unique constraint handles it, and the generator retries."
			]
		},
		{
			heading: "Analytics without touching the hot path",
			diagram: {
				kind: "flow",
				caption: "Fire and forget on the redirect; aggregate downstream.",
				rows: [[{
					id: "r",
					label: "Redirect",
					sub: "emit event, return 301",
					tone: "accent"
				}, {
					id: "q",
					label: "Kafka / Kinesis",
					sub: "click events"
				}], [
					{
						id: "agg",
						label: "Stream aggregator",
						sub: "counts per key per minute"
					},
					{
						id: "hll",
						label: "HyperLogLog",
						sub: "unique visitors, ~12 KB each"
					},
					{
						id: "olap",
						label: "Analytics store",
						sub: "referrer, geo, device"
					}
				]]
			},
			bullets: [
				"Emitting the event must not block the redirect. Fire into a local buffer, batch to the queue, and accept that a crash loses a few clicks — that is the right trade for the hottest path in the system.",
				"Aggregate counts in the stream layer rather than incrementing a row per click. A viral link would otherwise produce a write hotspot on one row.",
				"Unique-visitor counts use HyperLogLog: a few kilobytes per link for a couple of percent error, merged across shards, instead of storing every visitor id.",
				"Keep raw events for a bounded window and roll up beyond that — per-minute for a day, per-hour for a month, per-day forever."
			]
		},
		{
			heading: "Sharding, when it eventually matters",
			bullets: [
				"The key is the natural shard key: lookups are always by key, so hash-sharding on it keeps every read on one shard with no scatter-gather.",
				"Range-sharding by key would create a hotspot, because sequential generation means new links all land in the same range.",
				"Analytics queries ('all links for user X') do not fit that sharding, so keep a separate index keyed by user id — this is a read model, not a query against the main table.",
				"Because reads are cached at 95%+, sharding is driven by storage growth rather than by query volume: roughly 180 TB over ten years is what forces it."
			],
			table: {
				headers: [
					"Concern",
					"Approach",
					"Why not the alternative"
				],
				rows: [
					[
						"Shard key",
						"hash(key)",
						"Range on key hotspots on the newest range"
					],
					[
						"User's links",
						"Separate index table by user_id",
						"Scatter-gather across every shard otherwise"
					],
					[
						"Expiry cleanup",
						"Partition by expiry month; drop partitions",
						"A DELETE scan across 180 TB is not viable"
					],
					[
						"Global uniqueness",
						"Unique constraint within the shard, and the key determines the shard",
						"No cross-shard coordination needed"
					]
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "Counter + Base62",
			pickWhen: "Default — high write volume, collisions unacceptable",
			cost: "Keys are enumerable unless scrambled; needs a range-leasing service"
		},
		{
			choice: "Hash + collision retry",
			pickWhen: "Deduplicating identical URLs is a product requirement",
			cost: "A uniqueness check on every write, and retries as the space fills"
		},
		{
			choice: "301 redirect",
			pickWhen: "Cost matters more than per-click analytics; destinations never change",
			cost: "You lose repeat-visit analytics and the ability to change the target"
		},
		{
			choice: "302 redirect",
			pickWhen: "Analytics is the product; links may be edited or revoked",
			cost: "Every click hits your infrastructure"
		},
		{
			choice: "Bloom filter for alias checks",
			pickWhen: "Custom aliases with live availability feedback",
			cost: "~3.5 GB of memory and a rebuild story; still needs the unique constraint"
		}
	],
	wrapUp: [
		"The system is a cache with a database behind it: at a 100:1 read ratio, the redirect path should almost never reach storage.",
		"Key generation is the interesting decision, and the honest answer names the enumeration weakness of sequential keys and how to scramble it.",
		"The redirect path must stay write-free — analytics goes through a queue, counts are aggregated downstream.",
		"The first thing to break at scale is storage growth, not query volume, and the key is a clean shard key when that day comes.",
		"With another hour: abuse handling (malware and phishing links), per-user rate limits on creation, and the CDN purge path for deletions."
	],
	followUps: [
		{
			q: "Two servers generate the same key. How do you prevent it?",
			a: "By not generating independently. Each server leases a disjoint range of ids from a central counter and encodes locally, so uniqueness is structural rather than checked. If I used random or hash-based keys instead, correctness would rest on the unique constraint plus a retry loop, which works but costs a round trip on every write."
		},
		{
			q: "Someone is enumerating your links by walking sequential keys. What now?",
			a: "That is the known weakness of counter-based generation. The fix is to keep the counter for uniqueness but destroy the visible ordering — multiply by a large coprime and mask, or XOR with a secret, both of which are reversible and collision-free. For genuinely private links I would go further and use a longer random key, accepting a uniqueness check on write."
		},
		{
			q: "A link goes viral — 500,000 requests per second to one key. What happens?",
			a: "It should never reach my origin: the CDN caches that redirect and serves nearly all of it. Behind that, one Redis key would become a hotspot, so a small in-process cache on each redirect server collapses the rest. The dangerous case is the moment it expires, so I would use single-flight plus early refresh so one request repopulates and the others wait."
		},
		{
			q: "How do you delete a link?",
			a: "Soft delete in the database, evict from Redis, and purge at the CDN — the purge is the step people forget, and without it the edge keeps redirecting for as long as the cached TTL. I would not reuse the key afterwards: recycling keys means an old QR code or printed link suddenly points somewhere new, which is a security problem rather than a storage saving."
		},
		{
			q: "How would you handle malicious links?",
			a: "Check the destination against a reputation service at creation time and asynchronously re-check afterwards, since a benign URL can be repurposed later. On a match, serve an interstitial warning rather than redirecting, and give abuse reports a fast path to disable a key. Because the redirect layer is already cache-heavy, revocation needs the same eviction and purge path as deletion."
		}
	],
	related: [
		"/hld/caching",
		"/hld/bloom-filters",
		"/examples/unique-id",
		"/playgrounds/url-shortener"
	],
	furtherReading: [{
		label: "algomaster — design a URL shortener",
		href: "https://algomaster.io/learn/system-design-interviews/design-url-shortener"
	}],
	playground: "url-shortener"
}, {
	slug: "unique-id",
	title: "Design a Unique ID Generator",
	source: "Volume 1",
	chapter: 7,
	difficulty: "intermediate",
	minutes: 17,
	tags: [
		"snowflake",
		"ids",
		"distributed",
		"clocks"
	],
	companies: [
		"Twitter",
		"Instagram",
		"Discord",
		"Sony"
	],
	summary: "Generating unique ids across many machines without coordination sounds easy until you need them to be sortable, compact, and correct when a clock moves backwards. Snowflake — timestamp, machine id, sequence — is the standard answer, and the interesting parts are the failure modes it has.",
	clarifying: [
		{
			q: "Must ids be sortable by creation time?",
			a: "Assume yes. Time-sortable ids let you paginate and range-scan by id instead of maintaining a separate timestamp index, which is a large practical win."
		},
		{
			q: "How many ids per second, and across how many machines?",
			a: "Assume 10,000 per second per machine across a few hundred machines. That sizing is what determines how many bits go to the sequence versus the machine id."
		},
		{
			q: "Do ids need to be unguessable?",
			a: "Snowflake ids are not: they leak creation time and roughly how many were created. If unguessability matters, use a random id and give up sortability, or encrypt the id for external display."
		},
		{
			q: "64-bit or larger?",
			a: "64 bits fits a database bigint and a JSON number's safe range is 53 bits — so serialise as a string. 128-bit UUIDs avoid coordination entirely at the cost of size and index locality."
		}
	],
	requirements: {
		functional: [
			"Generate ids that are unique across the entire fleet",
			"Ids sort by creation time",
			"Generation is local — no network call per id",
			"Fits in 64 bits"
		],
		nonFunctional: [
			"At least 10,000 ids/second/node, with headroom for bursts",
			"Sub-microsecond generation — this is on every write path",
			"Correct across restarts, clock adjustments and node replacement",
			"No single point of failure at generation time"
		]
	},
	math: [
		{
			label: "Snowflake layout",
			expr: "1 sign + 41 timestamp + 10 machine + 12 sequence",
			result: "64 bits"
		},
		{
			label: "Timestamp range",
			expr: "2⁴¹ ms ÷ (1000 × 60 × 60 × 24 × 365)",
			result: "≈ 69 years",
			note: "From a custom epoch, so you get 69 years from your own start date rather than from 1970."
		},
		{
			label: "Throughput ceiling",
			expr: "2¹² sequence × 1000 ms",
			result: "4.096 M ids/s/node",
			note: "Three orders of magnitude above the requirement — most of the sequence bits are headroom."
		},
		{
			label: "Machine capacity",
			expr: "2¹⁰",
			result: "1,024 nodes",
			note: "If you need more nodes, take bits from the sequence — the trade is explicit."
		}
	],
	apis: [
		{
			method: "LOCAL",
			path: "nextId()",
			desc: "In-process call — no network, no lock contention beyond one atomic"
		},
		{
			method: "GET",
			path: "/v1/ids?count=1000",
			desc: "Optional service for clients that cannot embed the library"
		},
		{
			method: "GET",
			path: "/v1/ids/decode/{id}",
			desc: "Debugging — split an id back into timestamp, machine, sequence"
		}
	],
	architecture: [{
		heading: "The bit layout",
		diagram: {
			kind: "bits",
			caption: "Twitter Snowflake. Every field is a deliberate trade you can rebalance.",
			fields: [
				{
					label: "sign",
					bits: 1,
					note: "always 0 — keeps it positive in signed types"
				},
				{
					label: "timestamp (ms since custom epoch)",
					bits: 41,
					note: "69 years"
				},
				{
					label: "machine id",
					bits: 10,
					note: "1,024 nodes"
				},
				{
					label: "sequence",
					bits: 12,
					note: "4,096 per ms per node"
				}
			]
		},
		code: {
			title: "Generation, including the clock cases people miss",
			lang: "ts",
			source: `const EPOCH = 1_735_689_600_000n;   // your own epoch: 2025-01-01

class SnowflakeGenerator {
  private lastMs = -1n;
  private sequence = 0n;

  constructor(private machineId: bigint) {
    if (machineId < 0n || machineId > 1023n) throw new RangeError("machineId 0..1023");
  }

  nextId(): bigint {
    let now = BigInt(Date.now());

    if (now < this.lastMs) {
      // CLOCK WENT BACKWARDS — NTP correction or a VM migration.
      const drift = this.lastMs - now;
      if (drift > 5n) throw new ClockMovedBackwards(drift);  // refuse; do not risk duplicates
      while (BigInt(Date.now()) < this.lastMs) { /* spin out a small drift */ }
      now = this.lastMs;
    }

    if (now === this.lastMs) {
      this.sequence = (this.sequence + 1n) & 4095n;
      if (this.sequence === 0n) {
        // Exhausted this millisecond's 4,096 ids: wait for the next tick.
        while (BigInt(Date.now()) <= this.lastMs) { /* spin */ }
        now = BigInt(Date.now());
      }
    } else {
      this.sequence = 0n;
    }

    this.lastMs = now;
    return ((now - EPOCH) << 22n) | (this.machineId << 12n) | this.sequence;
  }
}

// Decoding is just shifts — useful in incident response.
const ts = Number((id >> 22n) + EPOCH);       // creation time
const machine = Number((id >> 12n) & 1023n);  // which node made it`
		},
		callout: {
			kind: "warn",
			text: "Refusing to generate on a backwards clock is the correct behaviour, and it surprises people. The alternative — generating anyway — risks duplicate ids, which is a far worse failure than a brief error. Small drifts can be waited out; large ones mean something is wrong with the host."
		}
	}, {
		heading: "Assigning machine ids",
		lede: "The part that actually causes incidents.",
		table: {
			headers: [
				"Approach",
				"How",
				"Risk"
			],
			rows: [
				[
					"Static config",
					"Machine id in an environment variable or config file",
					"Two nodes with the same id generate duplicates silently — the classic outage"
				],
				[
					"ZooKeeper / etcd sequential node",
					"Node claims an id at startup and holds it with a lease",
					"Coordination dependency at boot; ids must be released cleanly"
				],
				[
					"Derived from the host",
					"Hash of hostname or private IP into 10 bits",
					"Collisions are possible; needs a startup check"
				],
				[
					"Kubernetes StatefulSet ordinal",
					"pod-0, pod-1 → stable ordinal as the machine id",
					"Clean and simple; capped by replica count"
				]
			]
		},
		bullets: [
			"Whatever the mechanism, verify uniqueness at startup: register the id with a TTL and refuse to start if it is already held. A duplicate machine id is silent until you find two rows with the same primary key.",
			"Hold the id for the process lifetime and release it on shutdown. Recycling too eagerly, combined with a clock skew, can reproduce an id.",
			"Log the machine id at startup. During an incident, decoding an id tells you which node produced it — but only if you can map that number back to a host."
		]
	}],
	deepDives: [{
		heading: "The alternatives, and when each is right",
		diagram: {
			kind: "compare",
			caption: "Sortability, size and coordination — pick two.",
			options: [
				{
					title: "UUIDv4 (random)",
					good: [
						"Zero coordination; generate anywhere",
						"Unguessable",
						"Universally supported"
					],
					bad: [
						"128 bits — twice the storage, in every index",
						"Random order destroys B-tree locality: page splits and poor cache behaviour on insert",
						"Not sortable by time"
					],
					verdict: "When coordination is impossible and index locality does not matter."
				},
				{
					title: "UUIDv7 / ULID",
					sub: "timestamp prefix + randomness",
					tone: "ok",
					good: [
						"Time-sortable, so index inserts stay sequential",
						"No coordination at all — no machine id to assign",
						"Standardised (UUIDv7) and widely supported now"
					],
					bad: ["128 bits", "Leaks creation time, like Snowflake"],
					verdict: "Often the best modern default — Snowflake's ordering without the machine-id problem."
				},
				{
					title: "Snowflake (64-bit)",
					good: [
						"Compact: fits a bigint, half the index size of a UUID",
						"Sortable and decodable — you can see when and where it was made",
						"No coordination per id"
					],
					bad: [
						"Machine id assignment is an operational dependency",
						"Clock skew is a real failure mode",
						"Leaks creation time and volume"
					],
					verdict: "High volume where id size and index locality matter."
				}
			]
		},
		table: {
			headers: [
				"Scheme",
				"Bits",
				"Sortable",
				"Coordination",
				"Notes"
			],
			rows: [
				[
					"Database auto-increment",
					"64",
					"Yes",
					"A single writer",
					"Simple and correct until you shard"
				],
				[
					"Ticket server (Flickr)",
					"64",
					"Yes",
					"One central service",
					"Single point of failure; run two with odd/even offsets"
				],
				[
					"UUIDv4",
					"128",
					"No",
					"None",
					"Poor index locality"
				],
				[
					"UUIDv7 / ULID",
					"128",
					"Yes",
					"None",
					"The pragmatic modern choice"
				],
				[
					"Snowflake",
					"64",
					"Yes",
					"Machine id only",
					"Compact and decodable"
				],
				[
					"Range leasing",
					"64",
					"Yes",
					"Once per N ids",
					"Great when gaps are acceptable"
				]
			]
		},
		callout: {
			kind: "insight",
			text: "The index-locality argument is the one most candidates miss: random UUIDs as a primary key scatter inserts across the whole B-tree, causing page splits and pushing hot pages out of memory. Time-ordered ids append to the right-hand edge instead. On a write-heavy table the difference is large and measurable."
		}
	}, {
		heading: "Failure modes",
		steps: [
			{
				title: "Clock moves backwards",
				text: "NTP correction, a VM migration, or a manual change. Generating during that window can repeat an id that was already issued.",
				detail: "Handle: wait out drift under a few milliseconds, refuse and alert beyond that. Never generate optimistically."
			},
			{
				title: "Sequence exhaustion within a millisecond",
				text: "More than 4,096 ids in one millisecond on one node. Correct behaviour is to spin until the next millisecond, which caps throughput rather than producing duplicates.",
				detail: "If this happens regularly, rebalance bits — take from the machine id — or add nodes."
			},
			{
				title: "Duplicate machine ids",
				text: "Two processes configured identically. Silent until a unique-constraint violation or, worse, an overwritten row.",
				detail: "Handle: claim the id with a lease at startup and refuse to boot on conflict."
			},
			{
				title: "Epoch exhaustion",
				text: "41 bits of milliseconds runs out 69 years after your epoch. Distant, but the fix — changing the layout — invalidates every existing id's ordering.",
				detail: "Document the epoch and layout somewhere the next generation of engineers will find it."
			},
			{
				title: "Ids leaking information",
				text: "A Snowflake id tells anyone the creation time and roughly your volume. For public-facing ids this is a real disclosure.",
				detail: "Handle: use a separate opaque external id, or encrypt the internal one for display."
			}
		]
	}],
	tradeoffs: [
		{
			choice: "Snowflake",
			pickWhen: "High volume, 64-bit ids matter, sortability matters",
			cost: "Machine id assignment and clock skew become operational concerns"
		},
		{
			choice: "UUIDv7 / ULID",
			pickWhen: "You want sortability without coordination",
			cost: "128 bits everywhere, in every index and every foreign key"
		},
		{
			choice: "UUIDv4",
			pickWhen: "Unguessability matters more than index performance",
			cost: "Random insert locations hurt write throughput on large tables"
		},
		{
			choice: "Auto-increment",
			pickWhen: "Single writer, and you are not sharding",
			cost: "Becomes a coordination bottleneck the moment you do shard"
		},
		{
			choice: "Ticket / range service",
			pickWhen: "You want central control and can tolerate gaps",
			cost: "A dependency at startup, and a service to keep highly available"
		}
	],
	wrapUp: [
		"The design is 64 bits split between time, machine and sequence — and every interesting question is about the machine id and the clock, not the encoding.",
		"Refusing to generate during backwards clock movement is correct: a brief error beats a duplicate primary key.",
		"Index locality is the underrated reason to prefer time-ordered ids over random UUIDs on write-heavy tables.",
		"If ids are public, treat their information leakage as a design property and use a separate opaque id externally.",
		"With another hour: the machine-id lease service, the monitoring for clock drift, and a migration plan for the epoch."
	],
	followUps: [
		{
			q: "What happens if the clock jumps backwards?",
			a: "I stop generating rather than risk a duplicate. For drift of a few milliseconds — a normal NTP correction — I spin until the clock catches up, which costs a moment of latency. For anything larger I throw and alert, because that indicates a real problem with the host and generating optimistically could reissue ids that are already in the database."
		},
		{
			q: "Why not just use UUIDs?",
			a: "Often I would, specifically UUIDv7, which gives time ordering with no coordination at all. What UUIDs cost is size and index behaviour: 128 bits in every index and foreign key, and for v4 a random insert position that causes page splits and evicts hot pages. Snowflake exists because at high write volume those two costs are worth an operational dependency on machine ids."
		},
		{
			q: "How do you assign machine ids in an autoscaling group?",
			a: "By claiming rather than configuring. On startup the process takes a lease on a free id from etcd or ZooKeeper, holds it while running, and releases it on shutdown; if it cannot claim one, it refuses to start. Static configuration is what causes duplicate-id incidents, because two instances with the same environment variable fail silently until you find two rows sharing a primary key."
		},
		{
			q: "Can you generate more than 4,096 ids per millisecond on one node?",
			a: "Not with that layout — the generator spins until the next millisecond, which is the correct behaviour because it bounds throughput instead of producing duplicates. If a node genuinely needs more, I would rebalance the bits, taking some from the machine id, or add nodes. Four million ids per second per node is already far beyond most workloads, so hitting it usually means something is looping."
		}
	],
	related: [
		"/examples/url-shortener",
		"/hld/sharding",
		"/playgrounds/snowflake",
		"/hld/consistency"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}],
	playground: "snowflake"
}];
var vol1DeepB = [{
	slug: "news-feed",
	title: "Design a News Feed System",
	source: "Volume 1",
	chapter: 11,
	difficulty: "advanced",
	minutes: 24,
	tags: [
		"fan-out",
		"feed",
		"cache",
		"ranking"
	],
	companies: [
		"Facebook",
		"Twitter/X",
		"Instagram",
		"LinkedIn"
	],
	summary: "The feed question is really one question: do you build each user's timeline when someone posts, or when someone reads? Fan-out on write makes reads trivial and writes explosive; fan-out on read does the opposite. The correct answer is a hybrid, and being able to say exactly where the boundary sits is what the interview is testing.",
	clarifying: [
		{
			q: "Chronological or ranked?",
			a: "Assume ranked, but treat ranking as a separate component that scores an already-assembled candidate set. Mixing retrieval and ranking is how feed designs become unexplainable."
		},
		{
			q: "How many friends or follows does a typical user have, and what is the maximum?",
			a: "Median around 200-300, with a long tail into the millions. That distribution is the entire difficulty — a design that works for the median fails badly at the tail."
		},
		{
			q: "How fresh must the feed be?",
			a: "Seconds is fine for most content; a few minutes is acceptable for ranked feeds. This is what makes precomputation viable."
		},
		{
			q: "What is in a feed item?",
			a: "Text plus references to media, not the media itself. Feed storage holds post ids and ranking features; the content is hydrated at read time from a separate store."
		},
		{
			q: "Read/write ratio?",
			a: "Assume 100:1 or higher — people read far more than they post. That asymmetry is the argument for doing work at write time."
		}
	],
	requirements: {
		functional: [
			"Publish a post to followers",
			"Read a personalised feed, paginated",
			"Feed reflects follows and unfollows",
			"Ranking, not purely chronological",
			"Deleted and blocked content disappears from feeds"
		],
		nonFunctional: [
			"Feed read p99 under 200 ms",
			"New posts visible within seconds for most followers",
			"Availability of reads matters far more than of writes",
			"Cost per feed read must stay flat as the graph grows"
		]
	},
	math: [
		{
			label: "Read volume",
			expr: "300 M DAU × 10 feed loads/day ÷ 10⁵",
			result: "≈ 30,000 reads/s",
			note: "Peak ≈ 100,000/s. Every one of these must be cheap."
		},
		{
			label: "Write volume",
			expr: "300 M DAU × 2 posts/day ÷ 10⁵",
			result: "≈ 6,000 posts/s",
			note: "Small — until you multiply by followers."
		},
		{
			label: "Fan-out amplification",
			expr: "6,000 posts/s × 300 median followers",
			result: "≈ 1.8 M feed writes/s",
			note: "This is the real write load, and it is 300× the post rate."
		},
		{
			label: "Celebrity case",
			expr: "1 post × 100 M followers",
			result: "100 M writes",
			note: "At 100k writes/s that is 1,000 seconds — nearly 17 minutes for one post. This is why hybrid exists."
		},
		{
			label: "Feed cache size",
			expr: "300 M users × 800 post ids × 8 B",
			result: "≈ 1.9 TB",
			note: "Only the active fraction needs to be resident — roughly 20% is ~400 GB, a modest Redis cluster."
		}
	],
	apis: [
		{
			method: "POST",
			path: "/v1/posts",
			desc: "Publish — returns immediately; fan-out is asynchronous"
		},
		{
			method: "GET",
			path: "/v1/feed?cursor=&limit=20",
			desc: "The hot read — cursor pagination, never offset"
		},
		{
			method: "POST",
			path: "/v1/follows/{userId}",
			desc: "Follow — may trigger a partial backfill of the follower's feed"
		},
		{
			method: "DELETE",
			path: "/v1/posts/{id}",
			desc: "Delete — tombstone; feeds filter at hydration rather than rewriting"
		}
	],
	dataModel: [
		{
			entity: "posts",
			fields: [
				"id (pk, snowflake — time-sortable)",
				"author_id (idx)",
				"body",
				"media_ids[]",
				"created_at",
				"deleted_at"
			]
		},
		{
			entity: "follows",
			fields: [
				"follower_id (pk part)",
				"followee_id (pk part)",
				"created_at",
				"→ also stored reversed for fan-out"
			]
		},
		{
			entity: "feed:{userId}",
			fields: [
				"Redis list or sorted set",
				"post_id + score",
				"capped at ~800 entries"
			]
		},
		{
			entity: "celebrity_posts",
			fields: [
				"author_id (idx)",
				"post_id",
				"created_at",
				"→ pulled at read time, not pushed"
			]
		}
	],
	architecture: [
		{
			heading: "The core decision: push or pull",
			lede: "Both are wrong on their own. Saying why is the answer.",
			diagram: {
				kind: "compare",
				caption: "Where the work happens determines what breaks.",
				options: [{
					title: "Fan-out on write (push)",
					sub: "precompute every follower's feed",
					good: [
						"Feed read is a single cache lookup — a few milliseconds",
						"Read cost is constant regardless of how many people you follow",
						"Ranking can be applied incrementally as posts arrive"
					],
					bad: [
						"A post by a user with 100 M followers is 100 M writes",
						"Wasted work for inactive users who never read",
						"Storage: one copy of every post id per follower",
						"Unfollow and blocking require cleanup across many feeds"
					],
					verdict: "The default for the vast majority of users."
				}, {
					title: "Fan-out on read (pull)",
					sub: "assemble at query time",
					good: [
						"Writing a post is one row, regardless of follower count",
						"No wasted work for inactive readers",
						"Unfollow takes effect immediately with no cleanup"
					],
					bad: [
						"Reading means querying N followees and merging — slow and variable",
						"Cost grows with how many people you follow",
						"Hard to cache; every read is different"
					],
					verdict: "Celebrity accounts, and users who follow very few people."
				}]
			},
			steps: [
				{
					title: "Push for normal users",
					text: "When a user with a follower count below the threshold posts, enqueue a fan-out job that writes the post id into each follower's feed list.",
					detail: "Threshold is typically 10k-100k followers, tuned by measuring the fan-out queue."
				},
				{
					title: "Pull for celebrities",
					text: "Above the threshold, write nothing to follower feeds. The post lands in a per-author timeline that readers query directly."
				},
				{
					title: "Merge at read time",
					text: "A feed read takes the precomputed list, plus recent posts from the handful of celebrities this user follows, merges by score, and returns the top N.",
					detail: "The celebrity set per user is small — typically single digits — so this merge is cheap and bounded."
				},
				{
					title: "Hydrate",
					text: "The merged list is post ids. Multi-get the post bodies and author info from cache, filter deleted and blocked content, and return."
				}
			],
			callout: {
				kind: "interview",
				text: "State the threshold as a tunable number and say how you would choose it: measure fan-out queue lag and read latency, and move the boundary until both are acceptable. A hard-coded 'celebrities are over a million followers' is a weaker answer than 'this is a dial with these two metrics on either side'."
			}
		},
		{
			heading: "The write path",
			diagram: {
				kind: "sequence",
				caption: "The user's request returns before any fan-out happens.",
				actors: [
					{
						id: "u",
						label: "Author"
					},
					{
						id: "api",
						label: "Post service"
					},
					{
						id: "db",
						label: "Post store"
					},
					{
						id: "q",
						label: "Fan-out queue"
					},
					{
						id: "w",
						label: "Fan-out workers"
					},
					{
						id: "r",
						label: "Feed cache",
						sub: "Redis"
					}
				],
				messages: [
					{
						from: "u",
						to: "api",
						label: "POST /v1/posts",
						kind: "call"
					},
					{
						from: "api",
						to: "db",
						label: "INSERT post + outbox row (one tx)",
						kind: "call",
						note: "durable before we promise anything"
					},
					{
						from: "api",
						to: "u",
						label: "201 {postId}",
						kind: "return",
						tone: "ok",
						note: "~50 ms — user is done"
					},
					{
						from: "db",
						to: "q",
						label: "relay publishes PostCreated",
						kind: "async"
					},
					{
						from: "q",
						to: "w",
						label: "consume",
						kind: "async"
					},
					{
						from: "w",
						to: "w",
						label: "load follower ids in batches of 1,000",
						kind: "self",
						note: "celebrities short-circuit here"
					},
					{
						from: "w",
						to: "r",
						label: "pipeline ZADD feed:{follower} score postId",
						kind: "async",
						tone: "accent",
						note: "batched; capped list trims the tail"
					}
				]
			},
			code: {
				title: "Fan-out worker — batched, capped, and safe to retry",
				lang: "ts",
				source: `const CELEBRITY_THRESHOLD = 50_000;
const FEED_CAP = 800;

async function fanOut(post: Post) {
  const followerCount = await follows.countFollowers(post.authorId);

  if (followerCount > CELEBRITY_THRESHOLD) {
    return;                       // pull path: readers will fetch this at query time
  }

  // Page through followers so one job never holds millions of ids in memory.
  for await (const batch of follows.followersOf(post.authorId, { batchSize: 1_000 })) {
    const pipeline = redis.pipeline();
    for (const followerId of batch) {
      const key = \`feed:\${followerId}\`;
      pipeline.zadd(key, post.rankScore, post.id);   // idempotent: same member, same score
      pipeline.zremrangebyrank(key, 0, -FEED_CAP - 1);  // keep it bounded
      pipeline.expire(key, 7 * 24 * 3600);           // inactive users' feeds evaporate
    }
    await pipeline.exec();
  }
}

// ZADD with the same member is idempotent, so a redelivered job is harmless —
// which matters because the queue is at-least-once.`
			},
			bullets: [
				"Cap the feed list. An uncapped list for a user who follows thousands of active accounts grows without bound; 800 entries covers far more than anyone scrolls.",
				"Expire feeds for inactive users. Precomputing for someone who has not opened the app in a month is pure waste, and they can be rebuilt on demand.",
				"Batch and pipeline. One Redis round trip per follower would make fan-out network-bound; batches of a thousand make it throughput-bound.",
				"Fan-out is at-least-once, so the operation must be idempotent — adding the same post id twice must not duplicate it, which a sorted set gives for free."
			]
		},
		{
			heading: "The read path",
			code: {
				title: "Merge, rank, hydrate, filter",
				lang: "ts",
				source: `async function getFeed(userId: string, cursor?: string, limit = 20) {
  // 1. precomputed portion — one Redis call
  const pushed = await redis.zrevrangebyscore(
    \`feed:\${userId}\`, cursorScore(cursor), "-inf", { limit: limit * 2 });

  // 2. pull portion — the few celebrities this user follows
  const celebs = await follows.celebrityFollowees(userId);        // usually < 10
  const pulled = await Promise.all(
    celebs.map((c) => timelines.recent(c, { since: cursorScore(cursor), limit })));

  // 3. merge by score, take a candidate set larger than the page
  const candidates = mergeByScore([pushed, ...pulled]).slice(0, limit * 3);

  // 4. rank — a separate, replaceable component
  const ranked = await ranker.score(userId, candidates);

  // 5. hydrate in one multi-get, then filter
  const posts = await postCache.mget(ranked.map((r) => r.postId));
  const visible = posts.filter((p) => p && !p.deletedAt && !blocked(userId, p.authorId));

  return { posts: visible.slice(0, limit), nextCursor: cursorFor(visible.at(-1)) };
}

// Fetch more candidates than the page size: filtering removes deleted, blocked
// and already-seen items, and a page that returns 14 of 20 items looks broken.`
			},
			bullets: [
				"Cursor pagination on the score, never offset. Offset pagination in a feed that is constantly prepended shows duplicates and skips items.",
				"Filter at hydration, not at fan-out. Deleting a post should not require rewriting a million feed lists — a tombstone plus a read-time filter is far cheaper.",
				"On a feed cache miss, rebuild from the follows graph and recent posts. It is slower but correct, and it is why feed cache eviction is safe.",
				"Keep ranking behind an interface. It changes weekly, and it should be swappable without touching retrieval."
			]
		}
	],
	deepDives: [
		{
			heading: "The celebrity problem in detail",
			body: ["A single post from an account with 100 million followers is 100 million writes. Even at 100,000 feed writes per second that is nearly seventeen minutes of queue, during which the fan-out backlog delays everyone else's posts too. That coupling — one celebrity delaying every ordinary user's fan-out — is the real damage."],
			table: {
				headers: [
					"Mitigation",
					"How",
					"Cost"
				],
				rows: [
					[
						"Hybrid threshold",
						"Above N followers, do not push at all; readers pull",
						"Read path gains a merge step"
					],
					[
						"Separate queues by size",
						"Large fan-outs go to their own queue and worker pool",
						"One more thing to operate — but ordinary posts stay fast"
					],
					[
						"Push only to active followers",
						"Fan out to users seen in the last 7 days; others rebuild on demand",
						"Often removes 70-90% of the work"
					],
					[
						"Priority by recency of interaction",
						"Push first to followers who engage with this author",
						"Ranking data on the fan-out path"
					],
					[
						"Rate-limit fan-out per author",
						"Spread one enormous fan-out over minutes",
						"Some followers see the post later — usually acceptable"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "'Push only to active followers' is the highest-leverage mitigation and the one candidates rarely mention. Most followers of any large account are dormant; precomputing feeds they will never read is the majority of the wasted work."
			}
		},
		{
			heading: "Ranking as a separate stage",
			bullets: [
				"Retrieval produces candidates; ranking orders them. Keeping these separate means you can change the model without touching the feed infrastructure.",
				"Score at write time for a cheap approximation (recency plus author affinity), then re-score the candidate set at read time with fresher signals. The write-time score is what makes the sorted set orderable.",
				"Feature freshness matters more than model sophistication for most products: 'did this user interact with this author in the last day' beats a heavier model with stale inputs.",
				"Diversity and dedupe rules live here too — no more than N posts from one author, suppress near-duplicates, and demote items already shown.",
				"Track 'seen' state per user so a reload does not show the same top items. A Bloom filter or a capped set of recently-shown ids per user is the usual approach."
			],
			diagram: {
				kind: "flow",
				caption: "Retrieval is infrastructure; ranking is product. Keep the seam.",
				rows: [[{
					id: "push",
					label: "Pushed feed",
					sub: "Redis zset",
					tone: "accent"
				}, {
					id: "pull",
					label: "Celebrity timelines",
					sub: "queried live",
					tone: "accent"
				}], [
					{
						id: "merge",
						label: "Merge by score",
						sub: "candidate set ≈ 3× page"
					},
					{
						id: "rank",
						label: "Ranker",
						sub: "affinity, recency, engagement",
						tone: "ok"
					},
					{
						id: "filter",
						label: "Filter",
						sub: "deleted, blocked, seen",
						tone: "warn"
					},
					{
						id: "hyd",
						label: "Hydrate",
						sub: "multi-get bodies + media URLs"
					}
				]]
			}
		},
		{
			heading: "Consistency and correctness cases",
			table: {
				headers: [
					"Event",
					"Naive behaviour",
					"What to do instead"
				],
				rows: [
					[
						"User deletes a post",
						"Rewrite every feed containing it",
						"Tombstone the post; filter at hydration"
					],
					[
						"User unfollows",
						"Remove that author's posts from the feed list",
						"Filter at read time, and let the entries age out of the capped list"
					],
					[
						"User blocks someone",
						"Scan and clean feeds",
						"Read-time filter — blocking must be immediate and is rare enough to check per read"
					],
					[
						"New follow",
						"Wait for the next post",
						"Backfill a page of that author's recent posts into the feed so it feels instant"
					],
					[
						"Fan-out worker fails mid-job",
						"Some followers have it, some do not",
						"Idempotent writes plus retry from the queue; partial progress is safe"
					],
					[
						"Feed cache lost entirely",
						"Users see empty feeds",
						"Rebuild on read from follows + recent posts, with rate limiting to protect storage"
					]
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "Fan-out on write",
			pickWhen: "Median users; read-heavy traffic",
			cost: "Write amplification proportional to follower count; storage per follower"
		},
		{
			choice: "Fan-out on read",
			pickWhen: "Celebrity accounts; users following very few people",
			cost: "Slower, more variable reads; harder to cache"
		},
		{
			choice: "Hybrid with a threshold",
			pickWhen: "Any real system",
			cost: "Two code paths and a merge step; a threshold to tune and monitor"
		},
		{
			choice: "Push only to active users",
			pickWhen: "Large dormant follower base (always, at scale)",
			cost: "Cold-start latency for a returning user's first feed load"
		},
		{
			choice: "Chronological feed",
			pickWhen: "Product wants predictability and simplicity",
			cost: "Loses engagement; but removes the entire ranking subsystem"
		}
	],
	wrapUp: [
		"The design is a hybrid: push for the median user, pull for celebrities, merged at read time — and the threshold between them is a tunable dial with fan-out lag on one side and read latency on the other.",
		"Feed lists hold ids, not content: capped, expiring for inactive users, and hydrated from a separate post cache at read time.",
		"Deletion, blocking and unfollowing are read-time filters, because rewriting millions of feed lists is never the right answer.",
		"The first thing to break is fan-out lag when a very large account posts, which is why large fan-outs get their own queue and worker pool.",
		"With another hour: the ranking pipeline and its feature store, the seen-state tracking, and the media delivery path."
	],
	followUps: [
		{
			q: "A user with 100 million followers posts. Walk me through it.",
			a: "Nothing is fanned out. The post lands in their own timeline, and readers who follow them pull it at read time and merge it into their feed. That converts one hundred million writes into a handful of extra reads per feed load, and the number of celebrities any one user follows is small enough that the merge stays cheap. Without that split, a single post would occupy the fan-out queue for a quarter of an hour and delay everyone else's posts."
		},
		{
			q: "How does a user see a post from someone they just followed?",
			a: "Two mechanisms. New posts arrive normally through fan-out from that moment. For history, I backfill a page of that author's recent posts into the follower's feed at follow time, so the feed feels immediately different rather than slowly filling up. Backfill is bounded — one page, not the author's entire history."
		},
		{
			q: "The feed cache goes down. What do users see?",
			a: "Slower feeds, not empty ones. On a miss, the read path rebuilds from the follows graph and recent posts, which is more expensive but correct. That means a total cache loss puts substantial load on the post store, so I would rate limit rebuilds and prioritise active sessions. It is also why feed lists must be reconstructible by design — treating them as derived data rather than as the source of truth."
		},
		{
			q: "How do you keep the feed from showing the same posts on every refresh?",
			a: "Track seen state per user — a capped set or Bloom filter of recently shown post ids — and demote or drop those in ranking. Combined with cursor pagination on the score rather than offsets, that gives stable pagination even though the feed is constantly prepended. Offset pagination in a feed is the classic source of duplicate and skipped items."
		},
		{
			q: "How would you A/B test a ranking change?",
			a: "Because ranking is a separate stage over an already-assembled candidate set, I can route a percentage of users to a different ranker without touching retrieval. The important part is measuring the right thing — session length and return rate rather than clicks alone — and holding the candidate set constant so the experiment isolates ranking rather than retrieval."
		}
	],
	related: [
		"/hld/caching",
		"/hld/message-queues",
		"/examples/instagram",
		"/hld/sharding"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}, {
	slug: "chat",
	title: "Design a Chat System",
	source: "Volume 1",
	chapter: 12,
	difficulty: "advanced",
	minutes: 24,
	tags: [
		"websockets",
		"presence",
		"ordering",
		"delivery"
	],
	companies: [
		"WhatsApp",
		"Slack",
		"Messenger",
		"Discord"
	],
	summary: "Chat is the question where the transport is the easy part. What is graded is what happens around it: how messages become durable before delivery, how ordering survives concurrent senders, how presence scales, and what a client does after two hours offline on a bad connection.",
	clarifying: [
		{
			q: "One-to-one, small groups, or large channels?",
			a: "Assume one-to-one plus groups up to a few hundred. Large broadcast channels — hundreds of thousands of members — are a different fan-out problem worth calling out and scoping separately."
		},
		{
			q: "Is message history persistent?",
			a: "Yes, indefinitely, with the ability to page backwards. That makes the message store the primary system, and the socket merely a delivery optimisation."
		},
		{
			q: "What delivery guarantees does the product promise?",
			a: "Sent, delivered and read receipts — which means three state transitions per message, each of which must survive a disconnect."
		},
		{
			q: "End-to-end encryption?",
			a: "Assume not, and say why it changes things: with E2EE the server cannot search, rank or generate previews, and multi-device key management becomes the hardest part of the system."
		},
		{
			q: "How many concurrent connections?",
			a: "Assume 10 million concurrent. That number, not the message rate, is what sizes the connection tier."
		}
	],
	requirements: {
		functional: [
			"Send and receive messages in one-to-one and group conversations",
			"Persistent, pageable history",
			"Delivery and read receipts",
			"Online/offline presence and typing indicators",
			"Push notification when the recipient is offline",
			"Multi-device: every device sees every message"
		],
		nonFunctional: [
			"Message delivery under 500 ms when both parties are online",
			"No message is ever lost once accepted",
			"Messages in a conversation are consistently ordered for every participant",
			"Reconnect after an outage recovers everything missed"
		]
	},
	math: [
		{
			label: "Concurrent connections",
			expr: "50 M DAU × 20% concurrent",
			result: "≈ 10 M sockets",
			note: "At ~50k connections per gateway node, that is roughly 200 nodes just to hold connections."
		},
		{
			label: "Message volume",
			expr: "50 M users × 40 messages/day ÷ 10⁵",
			result: "≈ 20,000 msg/s",
			note: "Peak ×3 ≈ 60,000/s. Modest compared to the connection count."
		},
		{
			label: "Storage",
			expr: "2 B messages/day × 300 B × 365",
			result: "≈ 220 TB/year",
			note: "Text only. Media goes to object storage and is referenced by id."
		},
		{
			label: "Presence fan-out",
			expr: "10 M users × 200 contacts × 2 events/day",
			result: "≈ 4 B notifications/day",
			note: "Naive presence broadcast is larger than the message traffic — this is the trap."
		},
		{
			label: "Group amplification",
			expr: "1 message × 200 members",
			result: "200 deliveries",
			note: "Fine at this size; a 500,000-member channel needs a different model."
		}
	],
	apis: [
		{
			method: "WS",
			path: "/v1/connect?since={lastEventId}",
			desc: "Persistent socket; the cursor is what makes reconnect lossless"
		},
		{
			method: "SEND",
			path: "ws: {type: 'send', convId, clientMsgId, text}",
			desc: "clientMsgId makes retries idempotent"
		},
		{
			method: "GET",
			path: "/v1/conversations/{id}/messages?before=",
			desc: "History paging — plain HTTP, cursor-based"
		},
		{
			method: "POST",
			path: "/v1/conversations/{id}/read",
			desc: "Advance the read cursor to a message id"
		},
		{
			method: "GET",
			path: "/v1/presence?userIds=",
			desc: "Pull presence for a visible set, rather than subscribing to everything"
		}
	],
	dataModel: [
		{
			entity: "messages",
			fields: [
				"conversation_id (partition key)",
				"seq (clustering key, per-conversation monotonic)",
				"message_id (snowflake)",
				"sender_id",
				"body",
				"created_at"
			]
		},
		{
			entity: "conversation_members",
			fields: [
				"conversation_id",
				"user_id",
				"joined_at",
				"last_read_seq",
				"muted"
			]
		},
		{
			entity: "user_conversations",
			fields: [
				"user_id (partition key)",
				"last_activity_at (clustering, desc)",
				"conversation_id",
				"→ the inbox list"
			]
		},
		{
			entity: "presence:{userId}",
			fields: [
				"Redis, TTL ~40 s",
				"gateway_id",
				"devices[]",
				"last_seen"
			]
		},
		{
			entity: "delivery_state",
			fields: [
				"conversation_id",
				"message_id",
				"user_id",
				"delivered_at",
				"read_at"
			]
		}
	],
	architecture: [{
		heading: "The shape",
		lede: "A thin stateful connection tier in front of stateless services.",
		diagram: {
			kind: "system",
			caption: "Sockets are held by a tier that does nothing else, so business logic can deploy freely.",
			columns: [
				{
					title: "Clients",
					nodes: [{
						id: "m",
						label: "Mobile",
						sub: "WebSocket + push"
					}, {
						id: "w",
						label: "Web",
						sub: "WebSocket"
					}]
				},
				{
					title: "Connection tier",
					nodes: [{
						id: "g",
						label: "Chat gateways ×200",
						sub: "hold sockets only",
						tone: "accent"
					}, {
						id: "p",
						label: "Presence registry",
						sub: "Redis, TTL heartbeat"
					}]
				},
				{
					title: "Services",
					nodes: [{
						id: "svc",
						label: "Message service",
						sub: "persist, sequence, route",
						tone: "ok"
					}, {
						id: "not",
						label: "Notification service",
						sub: "APNs / FCM"
					}]
				},
				{
					title: "State",
					nodes: [
						{
							id: "db",
							label: "Message store",
							sub: "partitioned by conversation"
						},
						{
							id: "bus",
							label: "Bus",
							sub: "per-gateway channels"
						},
						{
							id: "s3",
							label: "Object storage",
							sub: "media"
						}
					]
				}
			]
		},
		bullets: [
			"The gateway tier holds sockets and does nothing else. It deploys rarely; everything that changes weekly lives behind it and deploys without dropping connections.",
			"Presence is a registry with a TTL, refreshed by heartbeat, mapping user to gateway. A crashed gateway's entries expire rather than pointing at nothing.",
			"Delivery between gateways goes over a bus with a channel per gateway, so a sender's gateway does not need a direct connection to every other."
		]
	}, {
		heading: "Sending a message",
		diagram: {
			kind: "sequence",
			caption: "Durable first, then delivered. The socket is never the storage.",
			actors: [
				{
					id: "a",
					label: "Alice",
					sub: "gateway 1"
				},
				{
					id: "g1",
					label: "Gateway 1"
				},
				{
					id: "svc",
					label: "Message service"
				},
				{
					id: "db",
					label: "Message store"
				},
				{
					id: "g2",
					label: "Gateway 2",
					sub: "holds Bob"
				}
			],
			messages: [
				{
					from: "a",
					to: "g1",
					label: "send {convId, clientMsgId, text}",
					kind: "call"
				},
				{
					from: "g1",
					to: "svc",
					label: "persist",
					kind: "call"
				},
				{
					from: "svc",
					to: "db",
					label: "assign seq, INSERT (idempotent on clientMsgId)",
					kind: "call",
					tone: "accent",
					note: "sequence assigned per conversation — this is what fixes ordering"
				},
				{
					from: "db",
					to: "svc",
					label: "seq = 8241",
					kind: "return"
				},
				{
					from: "svc",
					to: "g1",
					label: "ack {messageId, seq}",
					kind: "return",
					tone: "ok",
					note: "Alice's client marks it 'sent'"
				},
				{
					from: "svc",
					to: "g2",
					label: "route to Bob's gateway",
					kind: "async",
					note: "presence lookup → gateway 2"
				},
				{
					from: "g2",
					to: "g2",
					label: "push over Bob's socket",
					kind: "self",
					tone: "ok"
				},
				{
					from: "g2",
					to: "svc",
					label: "delivered receipt",
					kind: "async",
					note: "if Bob is offline: push notification, deliver on reconnect"
				}
			]
		},
		code: {
			title: "Idempotent send and per-conversation sequencing",
			lang: "ts",
			source: `async function send(msg: IncomingMessage, senderId: string) {
  return db.transaction(async (tx) => {
    // The client generates clientMsgId once and reuses it on every retry,
    // so a flaky connection cannot produce duplicate messages.
    const existing = await tx.messages.byClientMsgId(msg.convId, msg.clientMsgId);
    if (existing) return existing;                       // replay: same result

    // One monotonic sequence per conversation. Every participant then sees
    // the same order regardless of which gateway they are connected to.
    const seq = await tx.conversations.incrementSeq(msg.convId);

    return tx.messages.insert({
      conversationId: msg.convId,
      seq,
      messageId: snowflake(),
      senderId,
      body: msg.text,
      createdAt: new Date(),
    });
  });
}

// Ordering note: wall-clock timestamps do NOT order messages correctly —
// two senders on machines with slightly different clocks can produce
// timestamps that disagree with causality. The per-conversation sequence
// is the source of truth; timestamps are for display only.`
		},
		callout: {
			kind: "warn",
			text: "Persisting before acknowledging is non-negotiable. If you push over the socket first and store afterwards, a crash between the two loses a message the sender was told had been sent — the one failure users never forgive."
		}
	}],
	deepDives: [
		{
			heading: "Ordering and the sequence number",
			body: ["Two people typing simultaneously in the same conversation produce messages whose relative order is genuinely ambiguous. What must not be ambiguous is that everyone sees the same order — otherwise two participants read a different conversation."],
			bullets: [
				"A per-conversation monotonic sequence gives total order within the conversation, which is exactly the scope that matters. Global ordering across all conversations is neither needed nor achievable cheaply.",
				"Snowflake ids give approximate time ordering and are useful as message ids, but they do not give a gap-free sequence — and clients rely on gaps to detect missed messages.",
				"The sequence also drives sync: 'give me everything after seq 8241' is one query, and gap detection is arithmetic rather than a set comparison.",
				"The incrementSeq is a per-conversation hot spot. For a very active conversation, that is a single row being updated tens of times per second — acceptable, but worth knowing. Partitioning the store by conversation keeps that contention local."
			]
		},
		{
			heading: "Offline delivery and reconnect",
			steps: [
				{
					title: "Client stores its last seen sequence per conversation",
					text: "Persisted locally, so it survives an app restart, not just a reconnect."
				},
				{
					title: "On connect, send the cursor",
					text: "The gateway pulls everything after that sequence from the message store and streams it before switching to live push.",
					detail: "Bound the catch-up: past some number of missed messages, tell the client to page through history instead of streaming it all."
				},
				{
					title: "Deliver receipts on the same channel",
					text: "Delivery and read state are messages too, with their own ordering, so a receipt that arrives before the message it refers to must be buffered or ignored."
				},
				{
					title: "Push notification when offline",
					text: "If presence says no device is connected, hand the message to APNs or FCM. The push carries an id, not the content, when privacy matters — the app fetches it on open."
				},
				{
					title: "Reconnect with backoff and jitter",
					text: "After a gateway restart, hundreds of thousands of clients try to reconnect simultaneously. Without jitter, they land in the same second and knock over the tier that just came back."
				}
			],
			code: {
				title: "Resumable connection",
				lang: "ts",
				source: `// Client
const cursors = loadCursors();                    // { convId: lastSeq } from local storage
const ws = new WebSocket(\`\${url}/v1/connect\`);
ws.onopen = () => ws.send(JSON.stringify({ type: "resume", cursors }));

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.seq !== cursors[m.convId] + 1) {
    // Gap detected — a message was missed. Fetch the range explicitly.
    void fetchRange(m.convId, cursors[m.convId] + 1, m.seq - 1);
  }
  cursors[m.convId] = m.seq;
  saveCursors(cursors);
  apply(m);
};

ws.onclose = () => setTimeout(connect, Math.random() * Math.min(30_000, 500 * 2 ** attempt++));`
			},
			callout: {
				kind: "insight",
				text: "Gap detection is the feature that makes chat feel reliable. Because sequences are contiguous per conversation, a client can notice a missing message on its own and repair without any server-side session state — which is what lets gateways be disposable."
			}
		},
		{
			heading: "Presence at scale",
			body: ["Presence looks trivial and is usually the largest traffic source in a naive design: ten million users times two hundred contacts times a few state changes a day is billions of notifications, dwarfing the actual messages."],
			table: {
				headers: [
					"Approach",
					"Cost",
					"Verdict"
				],
				rows: [
					[
						"Broadcast every change to every contact",
						"O(users × contacts) events",
						"Does not scale — this is the trap"
					],
					[
						"Pull presence for what is on screen",
						"One request per view, batched",
						"Good default: users only see a handful of contacts at a time"
					],
					[
						"Subscribe to the visible set",
						"Subscriptions bounded by screen size",
						"Best for active chat views; unsubscribe on navigate"
					],
					[
						"Debounce and coarsen",
						"Suppress flapping; 'last seen 5m ago' instead of exact",
						"Removes most events for a barely noticeable product change"
					],
					[
						"Heartbeat TTL rather than explicit offline",
						"Key expires if heartbeats stop",
						"Handles crashes and network loss without an offline message"
					]
				]
			},
			bullets: [
				"Typing indicators are presence with a much shorter TTL and should be rate limited hard — one event per few seconds per conversation, not per keystroke.",
				"A user with several devices is online if any device is; store a set and let the TTL prune it.",
				"Presence is best-effort. Do not persist it, do not make message delivery depend on it — if presence is wrong, the fallback is a push notification, which is a fine outcome."
			]
		},
		{
			heading: "Storage and partitioning",
			bullets: [
				"Partition by conversation_id, clustered by sequence descending. The dominant query — 'the most recent N messages in this conversation' — is then a single-partition read in stored order.",
				"The inbox list ('my conversations, most recent first') is a different access pattern and needs its own table partitioned by user, updated on each message.",
				"A wide-column store (Cassandra, DynamoDB) fits this well: high write volume, known access patterns, no cross-conversation joins.",
				"Very large group channels break the per-conversation partition — a single partition receiving all traffic for a 500,000-member channel is a hotspot. Split by time bucket or treat those as a broadcast product with different mechanics.",
				"Media never goes in the message store: upload to object storage with a signed URL, store the key in the message."
			]
		}
	],
	tradeoffs: [
		{
			choice: "WebSocket for everything",
			pickWhen: "Bidirectional, low latency, active chat",
			cost: "Stateful gateways: connection registry, deploy complexity, reconnect storms"
		},
		{
			choice: "Long polling fallback",
			pickWhen: "Restrictive networks where sockets are blocked",
			cost: "Higher latency and more connections; worth keeping as a fallback path only"
		},
		{
			choice: "Per-conversation sequence",
			pickWhen: "Always — ordering must be consistent for all participants",
			cost: "A per-conversation counter, and one hot row for very active chats"
		},
		{
			choice: "Pull presence",
			pickWhen: "Large contact graphs",
			cost: "Slightly stale indicators, in exchange for orders of magnitude less traffic"
		},
		{
			choice: "End-to-end encryption",
			pickWhen: "Privacy is the product",
			cost: "No server-side search, previews or moderation; multi-device key management becomes the hardest subsystem"
		}
	],
	wrapUp: [
		"The socket is a delivery optimisation, not the system: messages are durable and sequenced before anyone is told they were sent.",
		"A per-conversation sequence number gives consistent ordering for all participants and enables gap detection on the client, which is what makes reconnect lossless.",
		"Presence is the hidden scaling problem — pull for the visible set instead of broadcasting, and let heartbeat TTLs handle crashes.",
		"The connection tier is sized by concurrent sockets, not message rate, and it must be thin so business logic can deploy without disconnecting anyone.",
		"With another hour: large broadcast channels, multi-device key management for E2EE, and media upload and delivery."
	],
	followUps: [
		{
			q: "How do you guarantee a message is never lost?",
			a: "Persist before acknowledging. The client only marks a message as sent after the server has committed it and returned a sequence number, and the client retries with the same clientMsgId until it gets that ack — so a retry is deduplicated rather than duplicated. Delivery to the recipient is separate and can be retried indefinitely, because the message is already durable."
		},
		{
			q: "Two people send at the same instant. What order do they see?",
			a: "Both see the order the per-conversation sequence assigned, which is whichever write reached the counter first. The relative order is genuinely arbitrary — there is no meaningful 'true' order for concurrent events — but it is identical for every participant, which is the property that matters. I would not order by timestamp, since clock skew between senders can produce orderings that contradict causality."
		},
		{
			q: "A user has been offline for two days. What happens when they open the app?",
			a: "They connect with their last sequence per conversation and the server streams everything after it. If the backlog is large I would cap the catch-up and tell the client to page through history over HTTP instead, so a single reconnect does not stream tens of thousands of messages over the socket. Their read cursor also syncs, so unread counts are correct immediately."
		},
		{
			q: "How do you handle a group with 500,000 members?",
			a: "Not with the same mechanics. Per-conversation partitioning makes that channel a single hotspot, and one message becoming half a million deliveries is a broadcast problem rather than a chat one. I would treat large channels as fan-out on read — members pull recent messages when they open the channel — with push only to members currently viewing it, which is the same hybrid reasoning as a news feed."
		},
		{
			q: "What happens when a gateway node dies?",
			a: "Its clients' sockets drop and they reconnect with backoff and jitter, landing on other gateways; their presence entries expire by TTL rather than needing cleanup. Nothing is lost, because messages are durable and clients resume from their cursor. The thing to design for is the reconnect storm — without jitter, fifty thousand clients reconnect simultaneously and destabilise the remaining nodes."
		}
	],
	related: [
		"/hld/websockets",
		"/hld/message-queues",
		"/examples/notification",
		"/hld/sharding"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
var vol1DeepC = [{
	slug: "rate-limiter",
	title: "Design a Rate Limiter",
	source: "Volume 1",
	chapter: 4,
	difficulty: "intermediate",
	minutes: 20,
	tags: [
		"redis",
		"gateway",
		"algorithms",
		"resilience"
	],
	companies: [
		"Stripe",
		"Twitter/X",
		"AWS API Gateway",
		"Cloudflare"
	],
	summary: "Throttle clients so that no one caller starves the rest. Token bucket is the default algorithm, Redis holds the counters, a rules service holds the limits, and rejected callers get a 429 with headers that tell them exactly when to come back. The interesting design work is in where the state lives and what happens when it is unavailable.",
	clarifying: [
		{
			q: "Client-side, server-side, or a middleware tier?",
			a: "Server-side at the API gateway. Client-side limits are advisory — a misbehaving or malicious client ignores them — though shipping them in the SDK reduces honest overuse."
		},
		{
			q: "What do we limit on?",
			a: "API key for authenticated traffic, IP for anonymous. Worth saying out loud that IP is shared by NAT and corporate proxies, so IP limits must be looser and are a blunt instrument."
		},
		{
			q: "One limit or several?",
			a: "Several: a burst limit per second, a sustained limit per minute, and a daily quota. Evaluate all of them and report the most restrictive in the response headers."
		},
		{
			q: "What happens when a client is over the limit — reject or queue?",
			a: "Reject with 429 for public APIs, because queuing hides the problem and consumes memory. Internal traffic can be queued with fair scheduling instead."
		},
		{
			q: "How exact must the limit be?",
			a: "Approximate is fine — nobody is harmed by 1,010 requests against a limit of 1,000. That single answer unlocks the local-approximation designs that avoid a round trip per request."
		}
	],
	requirements: {
		functional: [
			"Limit requests per client per time window",
			"Different limits per tier, per endpoint and per client",
			"Return 429 with Retry-After and rate-limit headers",
			"Limits are configurable without a deploy",
			"Exemptions for internal traffic and health checks"
		],
		nonFunctional: [
			"Adds under 1 ms to p99 latency",
			"Works across a fleet of gateway instances",
			"Highly available — the limiter must not become the outage",
			"Memory bounded regardless of how many distinct keys appear"
		]
	},
	math: [
		{
			label: "Traffic",
			expr: "1 M API calls/s at the gateway",
			result: "1 M limiter checks/s",
			note: "Every request is a check — this is why a per-request round trip is the wrong design at this scale."
		},
		{
			label: "State per key",
			expr: "token bucket = 2 numbers ≈ 100 B with overhead",
			result: "10 M keys ≈ 1 GB",
			note: "Cheap, provided idle keys expire. Without TTLs, memory grows with your total user base forever."
		},
		{
			label: "Redis round trip",
			expr: "same-AZ ≈ 0.3 ms, cross-AZ ≈ 1-2 ms",
			result: "on every request",
			note: "Acceptable at tens of thousands of rps, not at a million."
		},
		{
			label: "Local approximation error",
			expr: "sync every 1 s × 50 gateways",
			result: "≤ ~1 s of overshoot",
			note: "For a per-minute limit that is under 2% — well within 'approximate is fine'."
		}
	],
	apis: [
		{
			method: "GET",
			path: "/v1/rules?key=&endpoint=",
			desc: "Rules service — limits by tier and route, cached locally with a short TTL"
		},
		{
			method: "INTERNAL",
			path: "allow(key, endpoint, cost) → Decision",
			desc: "The hot path — returns ok, remaining, resetAt, retryAfter"
		},
		{
			method: "PUT",
			path: "/v1/rules/{tier}",
			desc: "Update limits without a deploy"
		},
		{
			method: "GET",
			path: "/v1/usage/{key}",
			desc: "Customer-facing usage, so limits are not a surprise"
		}
	],
	dataModel: [
		{
			entity: "rules",
			fields: [
				"tier (pk)",
				"endpoint",
				"limit",
				"window_seconds",
				"cost_multiplier",
				"burst"
			]
		},
		{
			entity: "bucket:{key}:{endpoint}",
			fields: [
				"Redis hash",
				"tokens (float)",
				"ts (ms)",
				"PEXPIRE ≈ 2× refill time"
			]
		},
		{
			entity: "exemptions",
			fields: [
				"key (pk)",
				"reason",
				"expires_at",
				"→ audited, never permanent by default"
			]
		}
	],
	architecture: [
		{
			heading: "Where it sits",
			diagram: {
				kind: "system",
				caption: "Three layers, each catching what the others cannot see.",
				columns: [
					{
						title: "Edge",
						nodes: [{
							id: "cdn",
							label: "CDN / WAF",
							sub: "volumetric, per-IP",
							tone: "accent"
						}]
					},
					{
						title: "Gateway",
						nodes: [{
							id: "gw",
							label: "API gateway ×50",
							sub: "per-key limits",
							tone: "accent"
						}, {
							id: "local",
							label: "Local bucket",
							sub: "in-process approximation",
							tone: "ok"
						}]
					},
					{
						title: "Shared state",
						nodes: [{
							id: "r",
							label: "Redis cluster",
							sub: "sharded by key"
						}, {
							id: "rules",
							label: "Rules service",
							sub: "cached 30 s"
						}]
					},
					{
						title: "Backends",
						nodes: [{
							id: "svc",
							label: "Services",
							sub: "endpoint-specific limits"
						}, {
							id: "db",
							label: "Datastores",
							sub: "pool caps as the last line"
						}]
					}
				]
			},
			bullets: [
				"The gateway is the primary place: every backend is protected uniformly, and the policy lives in one system.",
				"The edge catches volumetric abuse before it costs you anything — the cheapest request to drop is the one you never receive.",
				"Services still need their own limits for genuinely expensive operations, where a concurrency cap ('at most 5 concurrent exports per tenant') is often more useful than a rate."
			]
		},
		{
			heading: "Algorithm: token bucket, and why",
			lede: "It expresses 'sustained rate plus burst allowance' in two numbers.",
			code: {
				title: "Lazy refill — no timers, O(1) state per key",
				lang: "ts",
				source: `type Decision = { ok: boolean; remaining: number; limit: number;
                  resetAtMs: number; retryAfterMs?: number };

class TokenBucket {
  constructor(private capacity: number, private refillPerSec: number) {}

  allow(state: { tokens: number; lastMs: number }, now: number, cost = 1): Decision {
    // Add the tokens that would have accrued since the last call.
    const elapsed = Math.max(0, now - state.lastMs) / 1000;
    state.tokens = Math.min(this.capacity, state.tokens + elapsed * this.refillPerSec);
    state.lastMs = now;

    if (state.tokens >= cost) {
      state.tokens -= cost;
      return { ok: true, remaining: Math.floor(state.tokens), limit: this.capacity,
               resetAtMs: now + ((this.capacity - state.tokens) / this.refillPerSec) * 1000 };
    }

    const waitMs = Math.ceil(((cost - state.tokens) / this.refillPerSec) * 1000);
    return { ok: false, remaining: 0, limit: this.capacity,
             resetAtMs: now + waitMs, retryAfterMs: waitMs };
  }
}

// Two knobs with clear meaning:
//   capacity      = how large a burst you tolerate
//   refillPerSec  = the sustained rate you allow
// cost > 1 lets one expensive endpoint consume more of the same budget,
// which turns "requests per minute" into "work per minute".`
			},
			table: {
				headers: [
					"Algorithm",
					"Memory/key",
					"Burst",
					"Exact?",
					"Use"
				],
				rows: [
					[
						"Token bucket",
						"2 numbers",
						"Up to capacity",
						"Yes, by its definition",
						"The default for API limits"
					],
					[
						"Leaky bucket",
						"A bounded queue",
						"Absorbed, output smoothed",
						"Yes, on output rate",
						"Protecting a downstream that cannot burst"
					],
					[
						"Fixed window",
						"1 counter",
						"Up to 2× at a boundary",
						"No",
						"Cheapest; coarse protection"
					],
					[
						"Sliding window log",
						"O(limit) timestamps",
						"None",
						"Yes",
						"Low limits where exactness matters (logins)"
					],
					[
						"Sliding window counter",
						"3 numbers",
						"Small overshoot",
						"Approximate",
						"Per-minute limits at scale"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "The fixed-window boundary flaw is worth stating precisely: 100 requests at 11:59:59 and 100 more at 12:00:00 is 200 in one second against a limit of 100 per minute. The sliding window counter fixes it with three numbers instead of a log of timestamps."
			}
		},
		{
			heading: "Distributed state",
			diagram: {
				kind: "sequence",
				caption: "Atomic because the script runs as one operation on one node.",
				actors: [
					{
						id: "c",
						label: "Client"
					},
					{
						id: "gw",
						label: "Gateway"
					},
					{
						id: "l",
						label: "Local bucket"
					},
					{
						id: "r",
						label: "Redis"
					}
				],
				messages: [
					{
						from: "c",
						to: "gw",
						label: "GET /v1/search",
						kind: "call"
					},
					{
						from: "gw",
						to: "l",
						label: "check local share",
						kind: "call",
						note: "no network when comfortably under"
					},
					{
						from: "l",
						to: "gw",
						label: "remaining 70% → allow",
						kind: "return",
						tone: "ok"
					},
					{
						from: "gw",
						to: "r",
						label: "EVALSHA rate_limit(key, now)",
						kind: "call",
						tone: "warn",
						note: "only when the key approaches its limit"
					},
					{
						from: "r",
						to: "gw",
						label: "[allowed, remaining]",
						kind: "return"
					},
					{
						from: "gw",
						to: "c",
						label: "429 + Retry-After when denied",
						kind: "return",
						tone: "warn"
					}
				]
			},
			code: {
				title: "Redis Lua — read-modify-write in one atomic operation",
				lang: "lua",
				source: `-- KEYS[1] = bucket key
-- ARGV    = capacity, refillPerSec, nowMs, cost
local capacity = tonumber(ARGV[1])
local refill   = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local cost     = tonumber(ARGV[4])

local s      = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(s[1]) or capacity
local ts     = tonumber(s[2]) or now

tokens = math.min(capacity, tokens + ((now - ts) / 1000) * refill)

local allowed = tokens >= cost
if allowed then tokens = tokens - cost end

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
-- Idle keys must expire, or memory grows with your entire user base.
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity / refill) * 2000))

return { allowed and 1 or 0, math.floor(tokens) }`
			},
			bullets: [
				"Without atomicity, two gateways both read 99 tokens and both allow — the classic check-then-act race. A Lua script (or a Redis transaction) makes the whole operation indivisible.",
				"Use the Redis server's clock inside the script rather than each gateway's, so clock skew across the fleet does not shift window boundaries.",
				"Shard keys across Redis nodes, or one very hot tenant makes a single node the bottleneck for everyone.",
				"TTL every bucket. This is the difference between bounded memory and a slow leak that surfaces months later."
			]
		}
	],
	deepDives: [
		{
			heading: "Avoiding a round trip per request",
			steps: [
				{
					title: "Start exact",
					text: "Every gateway consults Redis for every request. Simple, accurate, ~0.3 ms, and a hard dependency. Fine to tens of thousands of requests per second."
				},
				{
					title: "Add a local pre-filter",
					text: "Keep an in-process bucket sized to this gateway's share. Only consult Redis when a key gets within, say, 30% of its limit. Cold keys cost nothing; hot keys stay accurate.",
					detail: "Typically removes 90%+ of Redis calls, because most keys are nowhere near their limit."
				},
				{
					title: "Or distribute the budget",
					text: "Divide the global limit across N gateways and redistribute periodically based on observed demand, so idle gateways donate capacity to busy ones.",
					detail: "Works well with even routing; poorly when traffic is skewed to a few gateways."
				},
				{
					title: "Decide the failure policy per route",
					text: "Fail open for reads so a Redis blip is not an outage; fail closed for expensive writes or anything that costs money per call. Either way, the local bucket keeps enforcing a floor."
				}
			],
			callout: {
				kind: "warn",
				text: "Decide fail-open versus fail-closed before the incident, per endpoint, and write it down. Making that call at 3am under pressure is how a limiter outage becomes a service outage — or how an abusive client gets a free run at your database."
			}
		},
		{
			heading: "Talking to clients",
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
  "limit": 1000,
  "window": "1m",
  "retryAfterSeconds": 12,
  "docs": "https://api.example.com/docs/rate-limits"
}

# Send the RateLimit-* headers on SUCCESSFUL responses too, so a
# well-behaved client can slow down before it is ever rejected.`
			},
			bullets: [
				"Without Retry-After, clients retry immediately and the limiter becomes a load amplifier at precisely the wrong moment.",
				"Distinguish 429 (you are over your limit) from 503 (we are overloaded). They call for different client behaviour.",
				"Give customers a usage endpoint and a dashboard. Most limit violations are honest mistakes, and visibility prevents support tickets.",
				"Never rate limit health checks or the auth path with the same policy as bulk endpoints — a limiter that blocks recovery is worse than no limiter."
			]
		},
		{
			heading: "Fairness and abuse",
			table: {
				headers: [
					"Problem",
					"Naive result",
					"Better"
				],
				rows: [
					[
						"One tenant floods a shared backend",
						"Everyone's latency rises",
						"Per-tenant limits plus per-tenant queueing for internal traffic"
					],
					[
						"Anonymous traffic behind NAT",
						"A whole office is limited as one user",
						"Looser IP limits, and prefer authenticated keys wherever possible"
					],
					[
						"Expensive endpoint drains the budget",
						"Cheap calls are blocked because of a few heavy ones",
						"Weighted cost per endpoint — one search costs 10 tokens"
					],
					[
						"Distributed abuse from many IPs",
						"Per-IP limits never trigger",
						"Behavioural detection at the edge; challenge rather than block"
					],
					[
						"Compromised API key",
						"Tenant's entire quota consumed",
						"Multi-dimensional keys: limit per key AND per tenant"
					]
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "Token bucket",
			pickWhen: "General API limiting where bursts are legitimate",
			cost: "Allows a burst up to capacity, which can spike a fragile downstream"
		},
		{
			choice: "Sliding window counter",
			pickWhen: "A strict per-minute number with no boundary cliff",
			cost: "Approximate — assumes uniform traffic within the previous window"
		},
		{
			choice: "Centralised Redis state",
			pickWhen: "Up to tens of thousands of rps; exactness matters",
			cost: "A round trip per request and a hard dependency"
		},
		{
			choice: "Local approximation with sync",
			pickWhen: "Very high throughput; approximate limits acceptable",
			cost: "Overshoot by roughly one sync interval; more moving parts"
		},
		{
			choice: "Fail open",
			pickWhen: "Read endpoints where the backend can absorb a surge",
			cost: "Abuse flows through while the limiter is down"
		}
	],
	wrapUp: [
		"Token bucket at the API gateway, counters in Redis behind a Lua script, limits from a rules service cached locally — that is the design in one sentence.",
		"The scaling move is not a faster Redis but fewer calls to it: a local bucket that only defers to shared state when a key approaches its limit.",
		"429 without Retry-After turns a limiter into an amplifier; the response headers are part of the design, not a detail.",
		"Fail-open versus fail-closed is a product decision made per endpoint, in advance.",
		"With another hour: per-tenant fair queueing for internal traffic, abuse detection at the edge, and the customer-facing usage dashboard."
	],
	followUps: [
		{
			q: "Which algorithm, and why not the others?",
			a: "Token bucket, because clients legitimately burst and it expresses sustained rate plus burst allowance in two numbers with constant memory. Fixed window is cheaper but allows double the limit across a boundary. Sliding window log is exact but costs memory proportional to the limit, so I would reserve it for low-limit security controls like login attempts. Sliding window counter is the compromise when a strict per-minute number matters."
		},
		{
			q: "How do you make this work across 50 gateways?",
			a: "Shared counters in Redis with a Lua script so the read-modify-write is atomic — otherwise two gateways both see 99 and both allow. To avoid a round trip per request, each gateway keeps a local bucket sized to its share and only consults Redis when a key is near its limit, which removes most of the traffic while keeping hot keys accurate."
		},
		{
			q: "Redis goes down. What happens?",
			a: "It depends on the route, decided in advance. Read endpoints fail open, because a limiter outage should not be a service outage, and the local approximate bucket still enforces a floor. Expensive writes fail closed. Either way I alert loudly, because running unprotected is a temporary state, and I would rate limit harder at the edge while it lasts."
		},
		{
			q: "How would you rate limit at a million requests per second?",
			a: "By not putting a network call on the request path at all. Push a cheap volumetric limit to the edge, keep local buckets per gateway, and synchronise periodically rather than per request — distributing a share of the global budget to each instance. That gives approximate enforcement, which is the correct trade at that volume since nobody is harmed by a small overshoot."
		},
		{
			q: "A customer says they were limited unfairly. How do you investigate?",
			a: "I would want the limiter to emit, on a sampled basis, which key, which rule and which limit fired, along with the remaining count. Without that the complaint is unfalsifiable. The most common genuine cause is an IP-based limit hitting a shared NAT, which is an argument for authenticating traffic and limiting per key wherever possible."
		}
	],
	related: [
		"/hld/rate-limiting",
		"/lld/rate-limiter",
		"/hld/api-gateway",
		"/playgrounds/rate-limiter"
	],
	furtherReading: [{
		label: "Rate limiter playground",
		href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html"
	}],
	playground: "rate-limiter"
}, {
	slug: "notification",
	title: "Design a Notification System",
	source: "Volume 1",
	chapter: 10,
	difficulty: "intermediate",
	minutes: 21,
	tags: [
		"queues",
		"fan-out",
		"third-party",
		"reliability"
	],
	companies: [
		"Any consumer product",
		"Braze",
		"Courier",
		"OneSignal"
	],
	summary: "Send push, SMS and email reliably to millions of devices through third-party providers you do not control. The architecture is queues and workers; the difficulty is that every provider fails differently, users have preferences and time zones, and 'send once' across retries is a real correctness requirement.",
	clarifying: [
		{
			q: "Which channels?",
			a: "Push (iOS and Android), SMS, email, and in-app. Each has a different provider, a different failure model and a different cost per message, so the design must treat them as pluggable rather than special-cased."
		},
		{
			q: "Transactional, promotional, or both?",
			a: "Both, and they need different priorities and rules: a password reset must go out in seconds and ignore quiet hours, while a marketing blast can wait and must respect them."
		},
		{
			q: "Do we need delivery tracking?",
			a: "Yes — sent, delivered, opened, failed — because otherwise you cannot answer 'did the user get it', which is the most common support question."
		},
		{
			q: "What volume, and how spiky?",
			a: "Assume 10 million notifications a day with sharp bursts: a broadcast to every user is a very different load profile from steady transactional traffic."
		},
		{
			q: "Can a user receive the same notification twice?",
			a: "It should be rare and is not catastrophic for most content — but for anything with a code or a payment, exactly-once user-visible behaviour matters, which means idempotency keys through to the provider."
		}
	],
	requirements: {
		functional: [
			"Send push, SMS, email and in-app notifications",
			"Per-user, per-channel, per-category preferences and opt-outs",
			"Templates with localisation and variable substitution",
			"Scheduling, including 'deliver at 9am in the user's time zone'",
			"Delivery status tracking and per-provider metrics",
			"Rate limits per user so nobody is spammed"
		],
		nonFunctional: [
			"Transactional notifications delivered within seconds",
			"No notification lost once accepted, even across provider outages",
			"Duplicates rare and bounded, never systematic",
			"A single failing provider must not stall the other channels"
		]
	},
	math: [
		{
			label: "Volume",
			expr: "10 M/day ÷ 10⁵",
			result: "≈ 120/s average",
			note: "Trivial on average — which is exactly why people under-design this."
		},
		{
			label: "Broadcast burst",
			expr: "50 M users in one campaign",
			result: "50 M in minutes",
			note: "Five orders of magnitude above average. The queue exists for this."
		},
		{
			label: "Provider limits",
			expr: "APNs ~1 M/s (batched) · SMS gateway ~100/s per account · SES ~14/s default",
			result: "the real ceiling",
			note: "Your throughput is set by the slowest provider, not by your own capacity."
		},
		{
			label: "Cost asymmetry",
			expr: "push ≈ free · email ≈ $0.0001 · SMS ≈ $0.01",
			result: "100× spread",
			note: "SMS cost is why channel fallback rules need thought — an accidental SMS blast is expensive."
		},
		{
			label: "Device tokens",
			expr: "50 M users × 2.5 devices × 200 B",
			result: "≈ 25 GB",
			note: "Plus churn: tokens expire constantly and must be pruned from provider feedback."
		}
	],
	apis: [
		{
			method: "POST",
			path: "/v1/notifications",
			desc: "Enqueue — body {userId, templateId, vars, channels?, idempotencyKey}"
		},
		{
			method: "POST",
			path: "/v1/notifications/bulk",
			desc: "Campaign — a segment id rather than a list of users"
		},
		{
			method: "GET",
			path: "/v1/notifications/{id}",
			desc: "Status per channel and per attempt"
		},
		{
			method: "PUT",
			path: "/v1/users/{id}/preferences",
			desc: "Per-channel, per-category opt-in and quiet hours"
		},
		{
			method: "POST",
			path: "/v1/devices",
			desc: "Register a device token; provider feedback prunes dead ones"
		},
		{
			method: "POST",
			path: "/webhooks/{provider}",
			desc: "Delivery and bounce callbacks — signature-verified"
		}
	],
	dataModel: [
		{
			entity: "notifications",
			fields: [
				"id (pk)",
				"user_id (idx)",
				"template_id",
				"vars (json)",
				"status",
				"created_at",
				"idempotency_key (unique)"
			]
		},
		{
			entity: "deliveries",
			fields: [
				"notification_id (fk)",
				"channel",
				"provider",
				"provider_message_id",
				"state",
				"attempts",
				"last_error"
			]
		},
		{
			entity: "devices",
			fields: [
				"user_id (idx)",
				"token (unique)",
				"platform",
				"app_version",
				"last_seen",
				"invalid_at"
			]
		},
		{
			entity: "preferences",
			fields: [
				"user_id (pk part)",
				"category (pk part)",
				"channels[]",
				"quiet_hours",
				"timezone"
			]
		},
		{
			entity: "templates",
			fields: [
				"id (pk)",
				"locale",
				"channel",
				"subject",
				"body",
				"version"
			]
		}
	],
	architecture: [{
		heading: "The pipeline",
		diagram: {
			kind: "system",
			caption: "Per-channel queues, so one failing provider cannot stall the others.",
			columns: [
				{
					title: "Producers",
					nodes: [{
						id: "svc",
						label: "Services",
						sub: "order shipped, mention"
					}, {
						id: "camp",
						label: "Campaign engine",
						sub: "segment → millions"
					}]
				},
				{
					title: "Ingest",
					nodes: [{
						id: "api",
						label: "Notification API",
						sub: "validate, dedupe, persist",
						tone: "accent"
					}, {
						id: "pref",
						label: "Preference filter",
						sub: "opt-out, quiet hours, caps",
						tone: "warn"
					}]
				},
				{
					title: "Per-channel queues",
					nodes: [
						{
							id: "qp",
							label: "push queue",
							sub: "high priority lane too"
						},
						{
							id: "qs",
							label: "sms queue"
						},
						{
							id: "qe",
							label: "email queue"
						}
					]
				},
				{
					title: "Workers → providers",
					nodes: [
						{
							id: "wp",
							label: "Push workers",
							sub: "APNs / FCM"
						},
						{
							id: "ws",
							label: "SMS workers",
							sub: "Twilio + backup"
						},
						{
							id: "we",
							label: "Email workers",
							sub: "SES + backup"
						},
						{
							id: "dlq",
							label: "DLQ",
							sub: "alerted on depth",
							tone: "bad"
						}
					]
				}
			]
		},
		steps: [
			{
				title: "Accept and persist",
				text: "Validate, apply the idempotency key, write the notification row, and return. The caller's request is done in milliseconds and the work is durable.",
				detail: "Use the transactional outbox so the queue message and the row commit together."
			},
			{
				title: "Resolve preferences",
				text: "Opt-outs, per-category channel choices, quiet hours in the user's time zone, and per-user frequency caps. This is the step that keeps users from unsubscribing entirely.",
				detail: "Transactional notifications bypass quiet hours; promotional ones do not. Encode that as a property of the template."
			},
			{
				title: "Render",
				text: "Template plus variables plus locale, producing a per-channel payload. Rendering failures must be caught here, not at the provider."
			},
			{
				title: "Enqueue per channel",
				text: "Separate queues per channel, and separate lanes for transactional versus promotional, so a marketing burst never delays a password reset."
			},
			{
				title: "Deliver with retry",
				text: "Workers call the provider with an idempotency key, retry transient failures with backoff, and dead-letter permanent ones."
			},
			{
				title: "Reconcile",
				text: "Provider webhooks report delivery, bounce and open. Update state, prune invalid device tokens, and feed the metrics."
			}
		],
		callout: {
			kind: "insight",
			text: "Separate queues per channel and per priority is the structural decision that matters most. With one shared queue, an SMS provider outage backs up the queue and delays every push notification behind it — a coupling nobody notices until it happens."
		}
	}, {
		heading: "Third-party providers are the hard part",
		table: {
			headers: [
				"Channel",
				"Provider",
				"Failure modes",
				"Handling"
			],
			rows: [
				[
					"iOS push",
					"APNs",
					"Invalid token, expired certificate, rate limiting",
					"Prune tokens from feedback; alert on certificate expiry well in advance"
				],
				[
					"Android push",
					"FCM",
					"Unregistered token, quota exceeded",
					"Batch sends; delete tokens on UNREGISTERED"
				],
				[
					"SMS",
					"Twilio, Vonage",
					"Carrier rejection, number blocked, per-country rules",
					"Country-specific routing; a backup provider for failover"
				],
				[
					"Email",
					"SES, SendGrid",
					"Bounces, complaints, reputation damage, sending caps",
					"Suppression list, complaint handling, warm up new IPs"
				]
			]
		},
		bullets: [
			"Every provider gets a circuit breaker. When one starts failing, stop calling it, use the backup if the channel has one, and let the queue hold the backlog rather than burning retries.",
			"Bounces and complaints are not optional for email: repeated sends to invalid addresses damage sender reputation, which degrades delivery for everyone. Maintain a suppression list and honour it before enqueueing.",
			"Provider rate limits are your real throughput ceiling. Shape traffic to them with a leaky bucket per provider, rather than discovering the limit through 429s.",
			"Wrap each provider behind one adapter interface so a second provider per channel is a configuration change, not a rewrite."
		],
		code: {
			title: "Provider adapter with idempotency, breaker and typed errors",
			lang: "ts",
			source: `interface PushProvider {
  send(token: DeviceToken, payload: PushPayload, key: IdempotencyKey): Promise<SendResult>;
}

async function deliver(job: PushJob) {
  const provider = breaker.isOpen("apns") ? providers.backup : providers.apns;

  try {
    const res = await provider.send(job.token, job.payload, job.notificationId);
    await deliveries.markSent(job.id, res.providerMessageId);
  } catch (err) {
    const classified = classify(err);

    if (classified === "invalid_token") {
      await devices.markInvalid(job.token);     // permanent: stop trying forever
      return deliveries.markFailed(job.id, "invalid_token");
    }
    if (classified === "permanent") {
      return deadLetter(job, err);              // bad payload, blocked number
    }
    if (job.attempts >= 5) return deadLetter(job, err);

    // transient: retry with full jitter so a provider outage does not
    // produce a synchronised retry wave when it recovers
    return requeue(job, Math.random() * Math.min(60_000, 1000 * 2 ** job.attempts));
  }
}

// The notificationId doubles as the provider idempotency key, so a retry
// after a timeout does not send the user a second copy.`
		}
	}],
	deepDives: [
		{
			heading: "Preferences, quiet hours and frequency caps",
			bullets: [
				"Store preferences per category, not just per channel. 'No marketing emails' must not silence a security alert, and conflating the two is how users disable everything.",
				"Quiet hours are in the user's time zone, which means a campaign for 50 million users is 24 staggered waves, not one. That scheduling requirement shapes the campaign engine.",
				"Frequency caps per user per period are what stop a bad rule from sending someone forty notifications. Enforce them centrally, after preferences and before enqueueing.",
				"Deduplicate at the semantic level too: five likes on one post should collapse into one notification, which is a digest rule rather than a delivery rule.",
				"Unsubscribe must be honoured immediately and permanently, including for messages already queued — check the suppression list at send time, not only at enqueue time."
			],
			code: {
				title: "Scheduling into the user's local morning",
				lang: "ts",
				source: `// "Deliver at 9am local" for a global segment = a rolling 24-hour send.
function scheduleFor(user: User, localHour = 9): Date {
  const now = DateTime.now().setZone(user.timezone);
  let target = now.set({ hour: localHour, minute: 0, second: 0 });
  if (target <= now) target = target.plus({ days: 1 });

  // Spread within the hour so 2 M users in one time zone do not all fire at :00
  return target.plus({ seconds: Math.random() * 3600 }).toJSDate();
}

// Consequence: the campaign engine must enqueue with a visibility delay
// per user rather than dispatching the whole segment at once.`
			}
		},
		{
			heading: "Exactly once, as far as the user is concerned",
			body: ["Queues deliver at least once and providers time out ambiguously, so duplicates are always possible. The goal is not to eliminate the mechanism but to make the user-visible outcome correct."],
			steps: [
				{
					title: "Idempotency key from the caller",
					text: "The producing service supplies a key derived from the event — 'order:9f3:shipped'. Two calls with the same key produce one notification."
				},
				{
					title: "Dedupe on the consumer",
					text: "The worker records the delivery attempt in the same transaction as marking it sent, so a redelivered job is a no-op rather than a second send."
				},
				{
					title: "Pass the key to the provider",
					text: "APNs has apns-collapse-id, SES and Twilio accept idempotency keys. That closes the last gap, where you sent successfully but never saw the response."
				},
				{
					title: "Accept the residual",
					text: "In rare cases a duplicate still gets through. For most content that is a minor annoyance; for anything with a one-time code, generate the code once and store it, so the duplicate carries the same code rather than a new one."
				}
			],
			callout: {
				kind: "warn",
				text: "The worst duplicate bug is not sending twice — it is a retry that regenerates a one-time code, invalidating the first message the user is currently reading. Generate side-effectful content once, at notification creation, never per delivery attempt."
			}
		},
		{
			heading: "Handling a 50-million broadcast",
			bullets: [
				"Do not expand the segment into 50 million queue messages up front. Store the campaign and the segment definition, then have workers page through the audience, so a paused or cancelled campaign stops immediately.",
				"Shape the rate to the providers' limits with a leaky bucket per provider, and prioritise transactional traffic on its own lane so it is never behind the campaign.",
				"Make campaigns cancellable and observable: how many sent, how many remaining, current rate, error rate by provider. A campaign you cannot stop is a serious incident waiting to happen.",
				"Time-zone staggering turns the burst into a rolling wave, which incidentally smooths the load — a rare case where the product requirement and the infrastructure requirement agree.",
				"Test with a canary segment: send to 0.1% first, check error and complaint rates, then proceed. This catches template bugs before they reach millions."
			],
			table: {
				headers: [
					"Metric",
					"Why it matters",
					"Alert on"
				],
				rows: [
					[
						"Queue depth per channel",
						"Backlog growth",
						"Oldest message age, not raw count"
					],
					[
						"Provider error rate",
						"Provider degradation",
						"Per-provider, per-error-class"
					],
					[
						"DLQ depth",
						"Silent data loss",
						"Anything above zero"
					],
					[
						"Delivery rate (webhooks)",
						"Sent ≠ delivered",
						"A drop, which often means token or reputation problems"
					],
					[
						"Complaint rate (email)",
						"Reputation damage",
						"Above ~0.1% — providers may throttle you"
					],
					[
						"Per-user send count",
						"Runaway rules",
						"Any user over the frequency cap"
					]
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "Queue per channel",
			pickWhen: "Always",
			cost: "More queues to operate — worth it to decouple provider failures"
		},
		{
			choice: "Separate transactional and promotional lanes",
			pickWhen: "Any product doing both",
			cost: "Duplicate worker pools; prevents a campaign from delaying a password reset"
		},
		{
			choice: "Backup provider per channel",
			pickWhen: "The channel is business-critical (SMS for 2FA, email for password reset)",
			cost: "Two integrations to maintain, and reconciliation across two sets of message ids"
		},
		{
			choice: "Expand segments lazily",
			pickWhen: "Campaigns over a few hundred thousand users",
			cost: "Slightly more complex workers; gains cancellability and back-pressure"
		},
		{
			choice: "At-least-once with idempotency keys",
			pickWhen: "Always — exactly-once delivery does not exist",
			cost: "Dedupe state and discipline about generating content once"
		}
	],
	wrapUp: [
		"The architecture is unremarkable — queues and workers — and everything interesting is in the edges: provider failure classification, preferences, and duplicate suppression.",
		"Per-channel and per-priority queues are what stop one degraded provider from delaying unrelated notifications.",
		"Idempotency runs end to end: from the caller's key, through the worker's dedupe, to the provider's own idempotency mechanism.",
		"Broadcasts are shaped by provider limits and by time zones rather than by your own capacity, and campaigns must be cancellable.",
		"With another hour: the digest and bundling rules, per-user frequency capping across categories, and email reputation management."
	],
	followUps: [
		{
			q: "How do you make sure a notification is not sent twice?",
			a: "An idempotency key end to end. The producing service supplies one derived from the event, the API deduplicates on it, the worker records the attempt in the same transaction that marks it sent, and the provider call carries a key so an ambiguous timeout does not resend. Duplicates can still happen in rare cases, so anything containing a one-time code generates that code once at creation, never per attempt."
		},
		{
			q: "The SMS provider goes down. What happens?",
			a: "The circuit breaker opens after enough failures, so we stop burning retries, and traffic either fails over to a backup provider or backs up in the SMS queue. Because queues are per channel, push and email are entirely unaffected — that decoupling is the main reason to split them. I would alert on the breaker opening and on the oldest message age in that queue, which maps directly to user impact."
		},
		{
			q: "How do you send to 50 million users at 9am local time?",
			a: "It becomes a rolling 24-hour wave rather than one burst, with a random spread within each hour so a whole time zone does not fire at exactly :00. I would keep the segment as a definition and have workers page through it, so the campaign can be paused or cancelled, and shape the rate to each provider's limits. That is also a natural place for a canary — send to a fraction first and check error and complaint rates."
		},
		{
			q: "A user says they did not receive a notification. How do you answer?",
			a: "By tracking state per delivery attempt: accepted, filtered by preference, sent to provider, provider-acknowledged, delivered via webhook, and failed with a reason. Most of these questions resolve to either a preference or quiet-hours filter, or an invalid device token that was never pruned. Without per-attempt state and provider webhooks, the answer is guesswork."
		},
		{
			q: "How do you stop a bug from spamming users?",
			a: "A central frequency cap enforced after preferences and before enqueueing — no user receives more than N notifications per hour regardless of what produced them. That is a safety net independent of any individual feature's logic, and it turns a runaway rule into a metric spike rather than an inbox disaster. I would alert on any user approaching the cap, because that is usually the first sign of a bad rule."
		}
	],
	related: [
		"/hld/message-queues",
		"/hld/idempotency",
		"/examples/chat",
		"/hld/circuit-breaker"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
var vol1DeepD = [{
	slug: "kv-store",
	title: "Design a Key-Value Store",
	source: "Volume 1",
	chapter: 6,
	difficulty: "advanced",
	minutes: 24,
	tags: [
		"dynamo",
		"quorum",
		"consistent-hashing",
		"storage"
	],
	companies: [
		"DynamoDB",
		"Cassandra",
		"Riak",
		"Voldemort"
	],
	summary: "This chapter is the distributed-systems syllabus in one problem: consistent hashing for placement, replication for durability, quorums for tunable consistency, vector clocks for conflicts, Merkle trees for repair, gossip for membership, and an LSM tree underneath. Nobody expects all of it in 45 minutes — they expect you to pick the parts the requirements demand and justify them.",
	clarifying: [
		{
			q: "Single-node or distributed?",
			a: "Distributed — otherwise it is a hash map with a write-ahead log. State that the interesting requirements are 'survives node loss' and 'scales past one machine'."
		},
		{
			q: "What consistency do we need?",
			a: "Tunable per operation. Assume the default is eventual with quorum options, Dynamo-style, and note where a strongly consistent read would be needed instead."
		},
		{
			q: "How big are values, and how big is the dataset?",
			a: "Values up to ~10 KB, dataset in the hundreds of terabytes. Large values would push toward storing them in an object store with a pointer in the KV."
		},
		{
			q: "What access patterns beyond get and put?",
			a: "Get, put, delete by key. Range scans change the design fundamentally — they require ordered partitioning rather than hashing, so ask explicitly."
		},
		{
			q: "Availability or consistency during a partition?",
			a: "Assume availability, which is the Dynamo choice, and be explicit that it means the application may have to resolve conflicting versions."
		}
	],
	requirements: {
		functional: [
			"get(key) → value, put(key, value), delete(key)",
			"Values up to ~10 KB",
			"Tunable consistency per request (N, W, R)",
			"Automatic partitioning and rebalancing as nodes join and leave"
		],
		nonFunctional: [
			"p99 under 10 ms for both reads and writes",
			"Survives node and rack failure with no data loss",
			"Available for writes during a network partition",
			"Scales linearly by adding nodes"
		]
	},
	math: [
		{
			label: "Dataset",
			expr: "10 B keys × 1 KB average value",
			result: "≈ 10 TB",
			note: "×3 replication ≈ 30 TB before compression and overhead."
		},
		{
			label: "Node count",
			expr: "30 TB ÷ 2 TB usable per node",
			result: "≈ 16 nodes minimum",
			note: "Plus headroom for compaction, which needs free space to work."
		},
		{
			label: "Throughput",
			expr: "100,000 ops/s ÷ 16 nodes",
			result: "≈ 6,000 ops/s/node",
			note: "Comfortable for an LSM engine on SSD."
		},
		{
			label: "Quorum latency",
			expr: "W=2 of N=3 → wait for the 2nd fastest, not the slowest",
			result: "median, not tail",
			note: "This is the whole reason quorums beat 'wait for everyone'."
		},
		{
			label: "Virtual nodes",
			expr: "16 physical × 150 vnodes",
			result: "2,400 ring positions",
			note: "Enough for load standard deviation of a few percent."
		}
	],
	apis: [
		{
			method: "GET",
			path: "get(key, {consistency})",
			desc: "Read from R replicas, reconcile versions, read-repair stale ones"
		},
		{
			method: "PUT",
			path: "put(key, value, {consistency, context})",
			desc: "Write to W replicas; context carries the version read"
		},
		{
			method: "DELETE",
			path: "delete(key)",
			desc: "Writes a tombstone — deletion is a write in a replicated store"
		},
		{
			method: "ADMIN",
			path: "addNode / removeNode",
			desc: "Ring membership change, triggering range transfer"
		}
	],
	dataModel: [
		{
			entity: "ring",
			fields: [
				"position (hash)",
				"physical_node",
				"→ 150 vnodes per node, gossiped"
			]
		},
		{
			entity: "record",
			fields: [
				"key",
				"value",
				"version_vector",
				"timestamp",
				"tombstone (bool)"
			]
		},
		{
			entity: "memtable",
			fields: ["in-memory sorted map", "flushed to an SSTable when full"]
		},
		{
			entity: "sstable",
			fields: [
				"immutable sorted file",
				"sparse index",
				"bloom filter",
				"→ merged by compaction"
			]
		}
	],
	architecture: [{
		heading: "Placement: consistent hashing with virtual nodes",
		body: ["Hash both keys and nodes onto a ring. A key belongs to the first node clockwise from its position, and its replicas are the next R distinct physical nodes. Adding a node moves roughly 1/n of the data instead of nearly all of it."],
		diagram: {
			kind: "flow",
			caption: "Coordinator for a key is the first vnode clockwise; replicas are the next distinct machines.",
			rows: [[{
				id: "k",
				label: "hash('user:42')",
				sub: "ring position 0x3F1A",
				tone: "accent"
			}], [
				{
					id: "n1",
					label: "Node B",
					sub: "coordinator",
					tone: "ok"
				},
				{
					id: "n2",
					label: "Node D",
					sub: "replica 2",
					tone: "ok"
				},
				{
					id: "n3",
					label: "Node A",
					sub: "replica 3",
					tone: "ok"
				},
				{
					id: "skip",
					label: "(skip B's other vnodes)",
					sub: "must be distinct machines",
					tone: "warn"
				}
			]]
		},
		code: {
			title: "Replica selection — the distinct-node detail that matters",
			lang: "ts",
			source: `getPreferenceList(key: string, n = 3): PhysicalNode[] {
  const out: PhysicalNode[] = [];
  let i = this.lowerBound(hash32(key));

  while (out.length < n && out.length < this.distinctNodeCount()) {
    const node = this.ring[i % this.ring.length].node;
    // Skip further vnodes belonging to a machine already chosen — otherwise
    // all three "replicas" can live on one machine and one failure loses everything.
    if (!out.includes(node)) out.push(node);
    i++;
  }
  return out;
}

// Rack awareness goes here too: prefer replicas in distinct racks or
// availability zones, so a rack failure never takes all copies.`
		},
		bullets: [
			"Virtual nodes are mandatory: with one position per node, load varies by 30-40%; with 150, it is a few percent.",
			"Membership is gossiped rather than held in a central registry, so there is no coordination service in the request path.",
			"A client with a stale ring may send a request to the wrong node; the node forwards it and the client refreshes, so staleness costs a hop rather than correctness."
		]
	}, {
		heading: "Replication and quorums",
		diagram: {
			kind: "sequence",
			caption: "N=3, W=2, R=2: the read set must intersect the write set.",
			actors: [
				{
					id: "c",
					label: "Client"
				},
				{
					id: "co",
					label: "Coordinator"
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
					sub: "slow"
				}
			],
			messages: [
				{
					from: "c",
					to: "co",
					label: "put(k, v)",
					kind: "call"
				},
				{
					from: "co",
					to: "r1",
					label: "write v7",
					kind: "call"
				},
				{
					from: "co",
					to: "r2",
					label: "write v7",
					kind: "call"
				},
				{
					from: "co",
					to: "r3",
					label: "write v7",
					kind: "async",
					tone: "warn",
					note: "no ack needed — W=2 already satisfied"
				},
				{
					from: "r2",
					to: "co",
					label: "ack (2 of 3)",
					kind: "return",
					tone: "ok"
				},
				{
					from: "co",
					to: "c",
					label: "ok",
					kind: "return",
					tone: "ok",
					note: "latency = 2nd fastest replica"
				},
				{
					from: "c",
					to: "co",
					label: "get(k)",
					kind: "call"
				},
				{
					from: "co",
					to: "r3",
					label: "returns stale v6",
					kind: "call",
					tone: "warn"
				},
				{
					from: "co",
					to: "c",
					label: "v7 wins by version",
					kind: "return",
					tone: "ok"
				},
				{
					from: "co",
					to: "r3",
					label: "read repair: write v7 back",
					kind: "async"
				}
			]
		},
		table: {
			headers: [
				"Setting",
				"Guarantee",
				"Latency",
				"Use"
			],
			rows: [
				[
					"N=3, W=2, R=2",
					"Overlap; survives 1 node down",
					"Median of 2",
					"The balanced default"
				],
				[
					"N=3, W=3, R=1",
					"Fastest reads",
					"Writes wait for the slowest",
					"Read-mostly config data"
				],
				[
					"N=3, W=1, R=1",
					"No overlap — eventual only",
					"Fastest both ways",
					"Metrics, counters, telemetry"
				],
				[
					"N=5, W=3, R=3",
					"Survives 2 nodes down",
					"Median of 3",
					"Higher durability across three AZs"
				]
			]
		},
		callout: {
			kind: "warn",
			text: "W + R > N gives overlap, not linearizability. Two clients writing concurrently can each satisfy W without seeing the other, so a later read returns two versions. Detecting that is what version vectors are for; resolving it is the application's job."
		}
	}],
	deepDives: [
		{
			heading: "Conflict detection and resolution",
			body: ["Last-write-wins by wall clock is the tempting answer and it silently loses data whenever clocks disagree — the losing write vanishes with no error anywhere. Version vectors detect genuine concurrency instead of guessing."],
			code: {
				title: "Version vectors: detect concurrency rather than paper over it",
				lang: "ts",
				source: `type VV = Record<NodeId, number>;

function compare(a: VV, b: VV): "before" | "after" | "concurrent" | "equal" {
  let aGreater = false, bGreater = false;
  for (const node of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[node] ?? 0, y = b[node] ?? 0;
    if (x > y) aGreater = true;
    if (y > x) bGreater = true;
  }
  if (aGreater && bGreater) return "concurrent";   // a real conflict
  if (aGreater) return "after";
  if (bGreater) return "before";
  return "equal";
}

// On a quorum read returning several versions:
//   1. discard any version strictly "before" another
//   2. if one remains, return it
//   3. if several remain, they are concurrent — return siblings and let
//      the application merge. A shopping cart unions its items, which is
//      why Dynamo's canonical example is a cart: merging is well-defined.

// The client passes the context (the vector it read) back on write, so the
// store can tell "I am updating what I saw" from "I am writing blind".`
			},
			table: {
				headers: [
					"Strategy",
					"Data loss?",
					"Complexity",
					"When"
				],
				rows: [
					[
						"Last-write-wins (wall clock)",
						"Yes, silently",
						"Trivial",
						"Only when overwrites are idempotent and loss is acceptable"
					],
					[
						"Version vectors + siblings",
						"No",
						"High — the app must merge",
						"Carts, sets, anything unionable"
					],
					[
						"CRDTs",
						"No",
						"Moderate; constrains the data type",
						"Counters, sets, collaborative text"
					],
					[
						"Single-key linearizability via consensus",
						"No",
						"Highest latency",
						"Counters that must be exact, locks"
					]
				]
			}
		},
		{
			heading: "Storage engine: the LSM tree",
			steps: [
				{
					title: "Write to the commit log, then the memtable",
					text: "An append to a write-ahead log makes it durable; an insert into an in-memory sorted structure makes it readable. Writes are therefore sequential on disk — this is why LSM engines have such high write throughput."
				},
				{
					title: "Flush to an immutable SSTable",
					text: "When the memtable is full, write it out as a sorted file with a sparse index and a Bloom filter. Immutability means no in-place updates and no random writes."
				},
				{
					title: "Read: memtable, then SSTables newest first",
					text: "The Bloom filter on each SSTable answers 'definitely not here' without touching the disk, which is what keeps reads from degrading as files accumulate.",
					detail: "Without Bloom filters, a read for a missing key would touch every SSTable on disk."
				},
				{
					title: "Compact in the background",
					text: "Merge SSTables, drop superseded versions and expired tombstones. This reclaims space and bounds read amplification — and it competes with live traffic for IO."
				}
			],
			diagram: {
				kind: "layers",
				caption: "Sequential writes, sorted files, Bloom filters to skip them.",
				layers: [
					{
						title: "Write path",
						items: ["commit log (append, fsync)", "memtable (sorted, in memory)"]
					},
					{
						title: "Flush",
						items: [
							"SSTable L0",
							"sparse index",
							"bloom filter"
						]
					},
					{
						title: "Compaction",
						items: [
							"L0 → L1 → L2 …",
							"merge, drop tombstones",
							"background IO"
						]
					},
					{
						title: "Read path",
						items: [
							"memtable",
							"bloom filter per SSTable",
							"sparse index → block",
							"row cache"
						]
					}
				]
			},
			bullets: [
				"LSM trades read amplification for write throughput; B-trees do the reverse. For a write-heavy KV store the LSM is the right choice, and saying why is the point.",
				"Compaction is the operational pain: it needs free disk and IO headroom, and a node that falls behind on compaction degrades reads badly.",
				"Deletes write tombstones, which take space until compaction removes them — and they must survive long enough that a resurrected replica does not reintroduce the deleted value."
			]
		},
		{
			heading: "Failure handling: hinted handoff and anti-entropy",
			bullets: [
				"Hinted handoff: if a replica is down, write to another node with a hint recording where it belongs. When the owner returns, the hint is delivered. This keeps writes available through transient failures.",
				"Sloppy quorum: with hinted handoff, W can be satisfied by nodes that are not the key's home replicas — availability rises and the strict overlap guarantee is suspended until handoff completes.",
				"Read repair: a read that finds a stale replica writes the newer version back. Cheap, and it fixes exactly the keys people are reading.",
				"Anti-entropy with Merkle trees: replicas periodically compare hash trees of their key ranges and exchange only the differing subtrees, so cold data converges too. Read repair alone leaves unread keys stale forever.",
				"Failure detection is gossip-based with indirect probing, so a slow node is not immediately declared dead — and membership converges in logarithmic time."
			],
			code: {
				title: "Merkle tree comparison — repair without shipping everything",
				lang: "text",
				source: `Replica A range [0x00, 0x40)          Replica B same range
        root  h(ABCD)                       root  h(ABC D')   <- differs
       /            \\                      /            \\
   h(AB)            h(CD)              h(AB)            h(CD')  <- differs
   /    \\           /    \\             /    \\           /    \\
  A      B         C      D           A      B         C      D'  <- differs

Compare root: differs -> descend
Compare h(AB): equal  -> skip an entire half of the range
Compare h(CD): differs -> descend
Find D vs D': exchange only those keys.

Cost is O(log n) hash comparisons plus the differing keys, instead of
streaming the whole range — which is what makes background repair viable.`
			}
		}
	],
	tradeoffs: [
		{
			choice: "Consistent hashing with vnodes",
			pickWhen: "Nodes join and leave routinely",
			cost: "Ring state must be gossiped; replica selection must skip same-machine vnodes"
		},
		{
			choice: "Quorum (W=R=2, N=3)",
			pickWhen: "The balanced default",
			cost: "Two round trips' worth of coordination; still not linearizable"
		},
		{
			choice: "Version vectors and siblings",
			pickWhen: "Concurrent writes to one key are expected and data loss is unacceptable",
			cost: "The application must implement a merge function"
		},
		{
			choice: "Last-write-wins",
			pickWhen: "Overwrites are idempotent, or the value is a full-state snapshot",
			cost: "Silent data loss under clock skew"
		},
		{
			choice: "LSM tree",
			pickWhen: "Write-heavy",
			cost: "Read amplification, and compaction competing with live traffic"
		},
		{
			choice: "Sloppy quorum + hinted handoff",
			pickWhen: "Write availability is the priority",
			cost: "Reads may miss recent writes until handoff completes"
		}
	],
	wrapUp: [
		"Placement is consistent hashing with virtual nodes and rack awareness; replication is N copies on the next distinct machines clockwise.",
		"Consistency is tunable per request through W and R, and the honest caveat is that quorum overlap detects conflicts rather than preventing them.",
		"Conflicts need version vectors and an application merge, unless you accept the silent data loss of last-write-wins.",
		"The storage engine is an LSM tree: sequential writes, immutable sorted files, Bloom filters on reads, and compaction as the ongoing operational cost.",
		"With another hour: secondary indexes, cross-region replication, and the backpressure story when compaction falls behind."
	],
	followUps: [
		{
			q: "How do you handle a node joining the cluster?",
			a: "It claims virtual node positions on the ring, gossips its membership, and streams the key ranges it now owns from the previous owners. Because it takes only the arcs between its positions and their predecessors, roughly 1/n of the data moves rather than nearly all of it. During the transfer, reads can still be served by the old owners, and the new node starts serving a range once it has caught up."
		},
		{
			q: "Two clients write to the same key at the same time. What happens?",
			a: "Both can satisfy their write quorum without seeing each other, so the store ends up holding two versions whose version vectors are concurrent. A later read returns both as siblings and the application merges them — for a shopping cart that is a union, which is why that is the canonical example. If I used last-write-wins instead, one write would silently disappear, and under clock skew it might be the newer one."
		},
		{
			q: "How does a stale replica catch up?",
			a: "Two mechanisms with different coverage. Read repair fixes keys as they are read, which handles the hot set for free. Anti-entropy with Merkle trees handles the rest: replicas compare hash trees of a range, descend only where the hashes differ, and exchange just those keys. Without the second mechanism, data that nobody reads stays divergent indefinitely."
		},
		{
			q: "Why an LSM tree and not a B-tree?",
			a: "Because the workload is write-heavy and an LSM turns random writes into sequential ones — append to a log, sort in memory, flush an immutable file. A B-tree updates pages in place, which means random IO per write and page splits. The cost is read amplification, since a read may consult several SSTables, and that is what the per-file Bloom filters and the block cache are there to bound."
		},
		{
			q: "How would you support range scans?",
			a: "Not with this design — hash partitioning destroys key ordering, so a range query becomes a scatter-gather over every node. If range scans matter I would use ordered partitioning instead, as HBase and Bigtable do, and accept the hotspot risk that comes with sequential keys. That is a genuine fork in the design, which is why it is worth asking about in the first five minutes."
		}
	],
	related: [
		"/hld/consistent-hashing",
		"/hld/quorum",
		"/hld/replication",
		"/playgrounds/quorum"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}],
	playground: "quorum"
}, {
	slug: "web-crawler",
	title: "Design a Web Crawler",
	source: "Volume 1",
	chapter: 9,
	difficulty: "advanced",
	minutes: 21,
	tags: [
		"bfs",
		"politeness",
		"dedup",
		"distributed"
	],
	companies: [
		"Google",
		"Bing",
		"Common Crawl",
		"Internet Archive"
	],
	summary: "A crawler is a distributed BFS over a hostile, unbounded graph. The algorithm is trivial; everything hard is about behaving well — not hammering one host, not crawling the same content twice under different URLs, not falling into an infinite space of generated pages, and not losing a week of work when a worker dies.",
	clarifying: [
		{
			q: "What is the crawl for — search indexing, archiving, or a targeted dataset?",
			a: "Assume search indexing. That means freshness matters, coverage matters, and the output feeds an indexing pipeline rather than being the product itself."
		},
		{
			q: "Scale and time budget?",
			a: "One billion pages a month, which is roughly 400 pages per second sustained. That number is what forces distribution and careful politeness scheduling."
		},
		{
			q: "Just HTML, or media too?",
			a: "HTML for link extraction, with media URLs recorded but fetched by a separate pipeline. Mixing them makes the fetcher's resource profile unpredictable."
		},
		{
			q: "How fresh must content be?",
			a: "Adaptive: news sites recrawled hourly, static pages monthly. A uniform recrawl interval either wastes most of your capacity or misses everything that changes."
		},
		{
			q: "Do we respect robots.txt?",
			a: "Yes, unconditionally, plus crawl-delay and per-host rate limits. This is not a nice-to-have — ignoring it gets you blocked and can be a legal problem."
		}
	],
	requirements: {
		functional: [
			"Fetch pages starting from a seed set and follow links",
			"Extract and normalise URLs; enqueue unseen ones",
			"Respect robots.txt, crawl-delay and per-host limits",
			"Detect duplicate content, not just duplicate URLs",
			"Recrawl pages on a schedule based on observed change rate"
		],
		nonFunctional: [
			"Sustain ~400 pages/second across the fleet",
			"Never overwhelm a single host regardless of how many URLs it has",
			"Survive worker failure without losing or re-crawling large amounts of work",
			"Bounded memory and storage for the seen-URL set"
		]
	},
	math: [
		{
			label: "Crawl rate",
			expr: "1 B pages/month ÷ (30 × 86,400)",
			result: "≈ 400 pages/s",
			note: "Peak higher; a fetch takes ~500 ms, so ~200 concurrent fetches minimum, realistically thousands."
		},
		{
			label: "Bandwidth",
			expr: "400/s × 500 KB average page",
			result: "≈ 200 MB/s",
			note: "1.6 Gbps sustained inbound. Bandwidth, not CPU, is often the constraint."
		},
		{
			label: "Raw storage",
			expr: "1 B × 500 KB",
			result: "≈ 500 TB/month",
			note: "Compressed to roughly 100 TB. Store raw HTML in object storage, not in a database."
		},
		{
			label: "Seen-URL set",
			expr: "10 B URLs × 10 bits (Bloom filter)",
			result: "≈ 12 GB",
			note: "Storing the URLs themselves would be ~700 GB plus index — this is why a Bloom filter is standard here."
		},
		{
			label: "Politeness ceiling",
			expr: "1 request/s/host × 10 M hosts",
			result: "10 M pages/s theoretical",
			note: "The constraint is not total rate but distribution across hosts — a queue per host is what makes it work."
		}
	],
	apis: [
		{
			method: "INTERNAL",
			path: "frontier.next() → URL",
			desc: "Returns a URL whose host is due, or blocks"
		},
		{
			method: "INTERNAL",
			path: "frontier.add(url, priority)",
			desc: "Enqueue after dedupe and robots check"
		},
		{
			method: "INTERNAL",
			path: "fetcher.get(url) → Response",
			desc: "With timeouts, size caps and redirect limits"
		},
		{
			method: "INTERNAL",
			path: "parser.extract(html) → {links, text, canonical}",
			desc: "Link extraction and content fingerprinting"
		},
		{
			method: "ADMIN",
			path: "POST /v1/seeds",
			desc: "Inject seed URLs and priority overrides"
		}
	],
	dataModel: [
		{
			entity: "frontier",
			fields: [
				"host_queue_id",
				"url",
				"priority",
				"scheduled_at",
				"→ queue per host, sorted by priority"
			]
		},
		{
			entity: "seen_urls",
			fields: ["Bloom filter (memory)", "+ exact set in a KV store for confirmation"]
		},
		{
			entity: "content_hashes",
			fields: [
				"simhash (64-bit)",
				"url",
				"first_seen",
				"→ near-duplicate detection"
			]
		},
		{
			entity: "robots_cache",
			fields: [
				"host (pk)",
				"rules",
				"crawl_delay",
				"fetched_at",
				"ttl ≈ 24 h"
			]
		},
		{
			entity: "pages",
			fields: [
				"url_hash (pk)",
				"object_key",
				"http_status",
				"fetched_at",
				"etag",
				"change_rate"
			]
		}
	],
	architecture: [{
		heading: "The loop, and the frontier that makes it polite",
		diagram: {
			kind: "system",
			caption: "The URL frontier is the heart: it decides what to fetch and, crucially, when.",
			columns: [
				{
					title: "Frontier",
					nodes: [{
						id: "pri",
						label: "Priority queues",
						sub: "importance, freshness",
						tone: "accent"
					}, {
						id: "host",
						label: "Per-host queues",
						sub: "politeness: one worker per host",
						tone: "accent"
					}]
				},
				{
					title: "Fetch",
					nodes: [
						{
							id: "dns",
							label: "DNS cache",
							sub: "resolution is a bottleneck"
						},
						{
							id: "rob",
							label: "robots.txt cache",
							sub: "24 h TTL"
						},
						{
							id: "f",
							label: "Fetchers ×N",
							sub: "async, timeouts, size caps",
							tone: "ok"
						}
					]
				},
				{
					title: "Process",
					nodes: [{
						id: "p",
						label: "Parser",
						sub: "links, text, canonical"
					}, {
						id: "d",
						label: "Dedupe",
						sub: "URL bloom + simhash",
						tone: "warn"
					}]
				},
				{
					title: "Store",
					nodes: [
						{
							id: "s3",
							label: "Object storage",
							sub: "raw HTML, compressed"
						},
						{
							id: "kv",
							label: "Metadata store",
							sub: "status, etag, change rate"
						},
						{
							id: "idx",
							label: "→ indexing pipeline",
							sub: "downstream consumer"
						}
					]
				}
			]
		},
		code: {
			title: "Frontier: two levels of queue, priority and politeness",
			lang: "ts",
			source: `// Front queues rank by importance; back queues enforce one-at-a-time per host.
class Frontier {
  private front: PriorityQueue<Url>[] = range(5).map(() => new PriorityQueue());
  private back = new Map<Host, Queue<Url>>();       // exactly one queue per host
  private due = new MinHeap<{ host: Host; at: number }>();  // when each host is next allowed

  add(url: Url, priority: number) {
    this.front[priority].push(url);
  }

  // A worker calls this; it only ever returns a URL whose host is due.
  next(now: number): Url | null {
    const head = this.due.peek();
    if (!head || head.at > now) return null;         // nothing is due yet

    this.due.pop();
    const q = this.back.get(head.host)!;
    const url = q.pop();

    if (url) {
      const delay = robots.crawlDelay(head.host) ?? DEFAULT_DELAY_MS;
      this.due.push({ host: head.host, at: now + delay });   // re-arm politeness
    }
    return url;
  }

  // Refill back queues from the front queues, preserving priority order.
  private refill() { /* pull from the highest non-empty front queue */ }
}

// The invariant: at most one in-flight request per host, spaced by crawl-delay.
// Without it, a site with a million URLs receives a million near-simultaneous
// requests and you are banned within seconds.`
		},
		bullets: [
			"One queue per host with a next-allowed timestamp is the standard structure, and it is what makes politeness an invariant rather than a hope.",
			"Priority is separate from politeness: importance decides what to crawl, politeness decides when. Fusing them produces either rudeness or starvation.",
			"The frontier must be durable and distributed — it holds billions of URLs. In practice it is backed by a partitioned store with hosts hashed to partitions, so one worker owns a host's queue.",
			"Partition by host, not by URL. That way politeness is enforced locally and requires no cross-worker coordination."
		]
	}, {
		heading: "Deduplication: URLs and content are different problems",
		table: {
			headers: [
				"Duplicate type",
				"Example",
				"Detection"
			],
			rows: [
				[
					"Exact URL",
					"The same link found on a thousand pages",
					"Bloom filter over normalised URLs, backed by an exact set"
				],
				[
					"URL variants",
					"?utm_source=, trailing slash, http vs https, session ids",
					"Aggressive normalisation before hashing"
				],
				[
					"Canonical duplicates",
					"Print view, mobile subdomain, pagination variants",
					"Respect rel=canonical and Link headers"
				],
				[
					"Exact content, different URL",
					"Mirrors, syndicated articles",
					"Hash the normalised body (MD5/SHA of extracted text)"
				],
				[
					"Near-duplicate content",
					"Same article with a different sidebar or timestamp",
					"SimHash or MinHash with a Hamming-distance threshold"
				]
			]
		},
		code: {
			title: "URL normalisation, then a Bloom filter",
			lang: "ts",
			source: `function normalise(raw: string): string {
  const u = new URL(raw);
  u.hash = "";                                     // fragments are client-side
  u.protocol = "https:";                           // treat http/https as one
  u.hostname = u.hostname.toLowerCase().replace(/^www\\./, "");
  u.pathname = u.pathname.replace(/\\/+$/, "") || "/";

  // Strip tracking parameters that never change the content
  const drop = ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "ref"];
  for (const p of drop) u.searchParams.delete(p);
  u.searchParams.sort();                            // parameter order is not meaningful

  return u.toString();
}

const seen = new BloomFilter({ expectedItems: 10_000_000_000, falsePositiveRate: 0.001 });

function shouldCrawl(raw: string): boolean {
  const url = normalise(raw);
  if (!seen.mightContain(url)) { seen.add(url); return true; }   // definitely new
  return false;   // "probably seen" — accept the 0.1% we wrongly skip
}

// The false-positive direction is safe here: we skip a page we have not
// crawled. At 0.1% over a billion pages that is a million pages missed —
// acceptable for coverage, and tunable by spending more bits.`
		},
		callout: {
			kind: "insight",
			text: "Note the deliberate acceptance of Bloom filter false positives: skipping a page you have not seen is a coverage loss, not a correctness bug. Being explicit about which direction of error you can tolerate is exactly the reasoning the structure demands."
		}
	}],
	deepDives: [
		{
			heading: "Traps: the reason crawlers need defences",
			table: {
				headers: [
					"Trap",
					"What happens",
					"Defence"
				],
				rows: [
					[
						"Infinite calendar",
						"/events?date=2026-09-11 → next month, forever",
						"Depth limit per host, URL pattern detection, budget per host"
					],
					[
						"Spider trap / soft 404",
						"Every URL returns 200 with generated content",
						"Content dedupe by simhash; drop hosts with high duplicate rates"
					],
					[
						"Redirect loop",
						"A → B → A",
						"Cap redirects at ~5 and record the chain"
					],
					[
						"Huge response",
						"A 10 GB file streamed to your fetcher",
						"Size cap; abort the stream past a few megabytes"
					],
					[
						"Slow-loris server",
						"Bytes trickle in, holding a worker open",
						"Total request timeout, not just a connect timeout"
					],
					[
						"Session ids in URLs",
						"Every crawl produces new unique URLs",
						"Normalisation rules that strip known session parameters"
					],
					[
						"Crawler-hostile host",
						"Serves different content to your user agent",
						"Nothing technical — record and deprioritise"
					]
				]
			},
			bullets: [
				"Per-host budgets are the single most effective defence: cap pages per host per crawl cycle, so an infinite space costs you a bounded amount rather than everything.",
				"Depth limits catch the pathological cases that budgets miss, particularly generated hierarchies.",
				"Track per-host duplicate rate and useful-content rate as metrics; hosts that produce nothing useful should be deprioritised automatically rather than by hand."
			]
		},
		{
			heading: "Freshness: recrawl what changes",
			body: ["Recrawling everything at the same interval wastes most of the budget on pages that never change and still misses the ones that change hourly. Track observed change rate per page and schedule adaptively."],
			bullets: [
				"Use conditional requests: If-Modified-Since and If-None-Match. A 304 costs almost nothing and tells you the page is unchanged, which feeds the change-rate estimate.",
				"Estimate change rate from history — a page that changed on 3 of the last 10 crawls gets a shorter interval; one unchanged for a year gets a very long one.",
				"Weight by importance as well as change rate: a rarely-changing but heavily-linked page still deserves a reasonable interval.",
				"Use sitemaps and change-notification protocols where hosts publish them; they turn polling into something closer to push.",
				"Cap total recrawl budget as a fraction of capacity — typically a large share, since maintaining an index is mostly recrawling."
			],
			math: [{
				label: "Recrawl share",
				expr: "1 B pages known, 30-day average interval",
				result: "≈ 380 pages/s just to maintain",
				note: "Nearly the entire budget. Adaptive scheduling is what frees capacity for discovery."
			}, {
				label: "Conditional request saving",
				expr: "70% of recrawls return 304 at ~1 KB instead of 500 KB",
				result: "~65% bandwidth saved"
			}]
		},
		{
			heading: "Distribution and failure",
			bullets: [
				"Partition the frontier by host hash, so each worker owns a set of hosts entirely and politeness needs no coordination.",
				"Workers are stateless with respect to the crawl: the frontier and the seen-set are external, so a dead worker loses only its in-flight fetches.",
				"In-flight URLs need a visibility timeout, like a queue message: if a worker dies, the URL becomes available again after the timeout rather than being lost.",
				"DNS is a genuine bottleneck at this rate — run a local caching resolver, and expect DNS failures to be a meaningful share of fetch errors.",
				"Store raw HTML in object storage keyed by URL hash and keep only metadata in the database. Putting half a petabyte of HTML in a relational store is a common early mistake.",
				"Rebalancing when workers join or leave should move whole host queues, so politeness state travels with the host."
			],
			diagram: {
				kind: "sequence",
				caption: "One page, end to end, including the checks people forget.",
				actors: [
					{
						id: "w",
						label: "Worker"
					},
					{
						id: "fr",
						label: "Frontier"
					},
					{
						id: "rb",
						label: "robots cache"
					},
					{
						id: "web",
						label: "Target host"
					},
					{
						id: "st",
						label: "Storage"
					}
				],
				messages: [
					{
						from: "w",
						to: "fr",
						label: "next() — a host that is due",
						kind: "call"
					},
					{
						from: "fr",
						to: "w",
						label: "https://example.com/page",
						kind: "return"
					},
					{
						from: "w",
						to: "rb",
						label: "allowed? crawl-delay?",
						kind: "call",
						note: "cached 24 h; fetch robots.txt on miss"
					},
					{
						from: "w",
						to: "web",
						label: "GET + If-None-Match",
						kind: "call",
						note: "timeout, size cap, redirect cap"
					},
					{
						from: "web",
						to: "w",
						label: "200 + body (or 304)",
						kind: "return"
					},
					{
						from: "w",
						to: "st",
						label: "store raw HTML by url_hash",
						kind: "async"
					},
					{
						from: "w",
						to: "w",
						label: "parse → links, simhash",
						kind: "self"
					},
					{
						from: "w",
						to: "fr",
						label: "add(new links) after normalise + bloom",
						kind: "call",
						tone: "ok"
					},
					{
						from: "w",
						to: "fr",
						label: "reschedule this URL by change rate",
						kind: "call"
					}
				]
			}
		}
	],
	tradeoffs: [
		{
			choice: "BFS from seeds",
			pickWhen: "Broad coverage; important pages are near the seeds",
			cost: "Needs politeness enforcement, because BFS naturally concentrates on one host at a time"
		},
		{
			choice: "Priority queue by importance",
			pickWhen: "Limited budget, want the valuable pages first",
			cost: "Importance is an estimate; a feedback loop can entrench it"
		},
		{
			choice: "Bloom filter for the seen set",
			pickWhen: "Billions of URLs",
			cost: "A small fraction of pages silently skipped; cannot delete entries"
		},
		{
			choice: "SimHash for near-duplicates",
			pickWhen: "Syndicated and templated content is common",
			cost: "Threshold tuning; false positives drop legitimate pages"
		},
		{
			choice: "Adaptive recrawl",
			pickWhen: "Maintaining an index rather than a one-off crawl",
			cost: "Per-page change-rate state, and a scheduler to maintain"
		}
	],
	wrapUp: [
		"The algorithm is BFS; the design is the frontier — priority queues for what to fetch and per-host queues for when, which makes politeness an invariant.",
		"Dedupe is two separate problems: URL normalisation plus a Bloom filter, and content fingerprinting with simhash for near-duplicates.",
		"Traps are not edge cases at this scale — per-host budgets, depth limits, size caps and timeouts are core requirements.",
		"Most of the capacity goes to recrawling, so adaptive scheduling driven by observed change rate is what buys room for discovery.",
		"With another hour: the importance scoring model, JavaScript rendering for client-side sites, and the handoff into the indexing pipeline."
	],
	followUps: [
		{
			q: "How do you avoid hammering a single site?",
			a: "One queue per host with a next-allowed timestamp, and at most one in-flight request per host at a time, spaced by robots.txt crawl-delay or a default. Because the frontier is partitioned by host hash, one worker owns a host entirely and no coordination is needed. Without that structure, a BFS over a site with a million pages sends a million near-simultaneous requests and gets you blocked immediately."
		},
		{
			q: "How do you know you have seen a URL before?",
			a: "Normalise it first — strip fragments and tracking parameters, lowercase the host, sort query parameters — because most 'new' URLs are variants of ones already crawled. Then a Bloom filter over the normalised form, which costs about 12 GB for ten billion URLs instead of hundreds of gigabytes for an exact set. The false positives mean we occasionally skip a genuinely new page, which is a coverage loss rather than a correctness bug."
		},
		{
			q: "The same article appears on fifty sites. How do you detect that?",
			a: "URL dedupe cannot help, so I fingerprint the extracted text. An exact hash catches perfect mirrors; simhash with a Hamming-distance threshold catches near-duplicates where the boilerplate differs. Then I keep the canonical version — preferring the original publisher where rel=canonical or first-seen timestamps indicate one — and record the rest as duplicates rather than storing them all."
		},
		{
			q: "A worker dies mid-crawl. What is lost?",
			a: "Only its in-flight fetches. The frontier and the seen-set are external, so URLs handed to a worker carry a visibility timeout and become available again if they are not completed — the same mechanism a queue uses. When the worker is replaced, its host queues are reassigned along with their politeness state, so the new owner does not reset the crawl-delay clock and accidentally burst a host."
		},
		{
			q: "How do you decide what to crawl next when everything cannot be crawled?",
			a: "Priority, from a combination of estimated importance — inbound links, host reputation, depth from a seed — and freshness need. Then per-host budgets so no single site can consume the crawl. The important structural point is that priority decides what and politeness decides when; keeping them separate is what stops a high-priority host from being crawled rudely."
		}
	],
	related: [
		"/hld/bloom-filters",
		"/hld/message-queues",
		"/examples/google-search",
		"/hld/consistent-hashing"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
/**
* Examples rewritten to full chapter depth — clarifying questions, worked
* estimation, APIs, data model, architecture, deep dives, trade-offs, wrap-up
* and follow-up questions. Merged over the base catalogue by slug.
*/
var deepExamples = [
	...frameworkExamples,
	...vol1DeepA,
	...vol1DeepB,
	...vol1DeepC,
	...vol1DeepD,
	...mediaAndMoneyExamples
];
/** Framework sections layered onto the remaining Volume 1 and Volume 2 examples. */
var supplementsA = {
	"consistent-hashing": {
		clarifying: [
			{
				q: "How often do nodes join or leave?",
				a: "Assume routinely — autoscaling, deploys and failures. That frequency is exactly what makes modulo hashing unusable and consistent hashing worth the complexity."
			},
			{
				q: "Is this for a cache or for a datastore?",
				a: "It matters: for a cache, a remapped key is a miss; for a datastore, it is a data migration. The second case needs a rebalancing plan, not just a hash function."
			},
			{
				q: "Do all nodes have the same capacity?",
				a: "Assume not. Weighting falls out naturally by giving larger machines more virtual nodes, which is one of the scheme's quieter advantages."
			}
		],
		wrapUp: [
			"Modulo hashing remaps ~(N−1)/N of keys on any membership change; consistent hashing remaps ~1/N, which is the difference between a stampede and a busy afternoon.",
			"Virtual nodes are not optional — with one position per node, load varies by 30-40%; with ~150, it is a few percent.",
			"Replication is 'the next R distinct physical nodes clockwise' — the distinct-machine check is what stops all copies landing on one host.",
			"It solves rebalancing, not hotspots: one very popular key still lands on exactly one node.",
			"With another hour: how the ring is distributed (gossip versus a coordination service) and how a stale client ring is detected and corrected."
		],
		followUps: [
			{
				q: "How many virtual nodes would you use?",
				a: "Around 100-200 per physical node. That brings load standard deviation down to a few percent, which is close to the practical floor, while keeping the ring small enough that lookup stays a cheap binary search. Below about ten, the distribution is visibly uneven."
			},
			{
				q: "How do all clients agree on the ring?",
				a: "Either a coordination service holds membership and clients watch it, or nodes gossip it among themselves as Dynamo-style systems do. The subtle failure is a client with a stale ring writing to the wrong node, which systems handle by having requests carry a ring version so a node can reject or forward a misrouted write."
			},
			{
				q: "Is there a simpler alternative?",
				a: "Rendezvous hashing: for each key, compute hash(key, node) for every node and pick the highest. It is about ten lines, needs no virtual nodes, distributes evenly, and top-R gives replication for free. The cost is O(N) per lookup unless optimised, so it suits smaller clusters."
			}
		]
	},
	autocomplete: {
		clarifying: [
			{
				q: "How many suggestions, and how fast?",
				a: "Top five, under 100 ms end to end. That budget is what forces precomputation — you cannot rank the whole corpus per keystroke."
			},
			{
				q: "Personalised or global?",
				a: "Start global with a personalised layer merged in at query time. Fully personalised suggestions cannot be precomputed per prefix for every user."
			},
			{
				q: "How fresh must trending queries be?",
				a: "Minutes for trends, hours for the long tail. That split lets the bulk of the index rebuild on a slow cycle while a small hot layer updates continuously."
			}
		],
		wrapUp: [
			"The core structure is a trie whose nodes cache their own top-k, so a lookup is a walk to the prefix node and a read — not a subtree scan.",
			"Building is offline and serving is read-only: aggregate query logs into frequencies, build the trie, and swap it in atomically.",
			"Sharding is by prefix, which keeps a query on one shard, with the caveat that common first letters create uneven shards.",
			"Filtering — profanity, personal data, legal removals — happens at build time, not per request.",
			"With another hour: typo tolerance via edit distance or a fuzzy index, and the personalisation merge at query time."
		],
		followUps: [
			{
				q: "Why not query the database with a LIKE 'pre%' each keystroke?",
				a: "Because it does not fit the latency budget at scale and it cannot rank. Even with an index, a prefix scan over a large corpus plus a sort by frequency per keystroke is far more work than reading a precomputed top-k from a trie node. The whole design exists to move that work offline."
			},
			{
				q: "How do you update the index when a query trends?",
				a: "Two layers. The main trie is rebuilt on a slow cycle from aggregated logs and swapped in atomically. A small hot layer, updated from a streaming aggregation over the last few minutes, is merged at query time. That gives minute-level freshness for trends without rebuilding a large structure constantly."
			},
			{
				q: "How do you shard it?",
				a: "By prefix, so a query touches one shard and no scatter-gather is needed. The problem is that prefixes are not uniformly distributed, so I would shard on a hash of the first two or three characters with explicit splitting of the heaviest ranges, and monitor per-shard load rather than assuming evenness."
			}
		]
	},
	"google-drive": {
		clarifying: [
			{
				q: "Do we need real-time collaborative editing?",
				a: "No — that is a different problem. Assume file sync: upload, download, share, version history and conflict handling when two devices edit offline."
			},
			{
				q: "How large can files be, and how much changes per edit?",
				a: "Files up to several gigabytes, with small edits common. That combination is the entire argument for block-level sync rather than whole-file upload."
			},
			{
				q: "How many devices per user?",
				a: "Several, often with one offline for long periods. Offline-then-reconnect is the case that generates conflicts and must be designed for, not patched later."
			}
		],
		wrapUp: [
			"Files are split into content-addressed blocks, so an edit uploads only the changed blocks and identical blocks across users are stored once.",
			"Metadata and content are separate systems: a transactional store for the file tree and versions, object storage for the blocks.",
			"Sync is a cursor over a per-user change log, which makes reconnect after days offline a bounded query rather than a full comparison.",
			"Conflicts are resolved by keeping both versions rather than silently choosing — losing a user's edit is worse than an awkward filename.",
			"With another hour: sharing and permission propagation across a deep folder tree, and the delta algorithm for very large binary files."
		],
		followUps: [
			{
				q: "A user edits a 1 GB file by changing one paragraph. What is uploaded?",
				a: "Only the affected blocks. The client chunks the file — ideally with content-defined boundaries so an insertion does not shift every subsequent block — hashes each chunk, and asks the server which hashes it already has. A small edit becomes a few megabytes at most, and the unchanged blocks are simply referenced by the new version."
			},
			{
				q: "Two devices edit the same file while offline. What happens?",
				a: "Both sync when they reconnect, and the second one to arrive detects that the base version it edited is no longer current. Rather than merging binary content or picking a winner, I keep both — the second becomes a conflicted copy attributed to that device — and surface it to the user. Automatic merging is only safe for formats the system understands."
			},
			{
				q: "How does a client know what changed while it was offline?",
				a: "A per-user change log with a monotonic cursor. The client stores its position and asks for everything after it, which is one query regardless of how long it was away. Comparing full file trees would be far more expensive and would not tell you the order changes happened in."
			}
		]
	},
	proximity: {
		clarifying: [
			{
				q: "What radius, and how dense is the data?",
				a: "Typically a few kilometres in dense cities. Density is what matters — a fixed grid that works in a rural area returns tens of thousands of results downtown."
			},
			{
				q: "How often do the indexed items move?",
				a: "For businesses, almost never — which allows a precomputed index. Moving objects (drivers, friends) are a different problem with a much higher write rate."
			},
			{
				q: "Is exactness required?",
				a: "No. 'Nearby' is inherently fuzzy, which permits approximate spatial indexing and makes the problem tractable."
			}
		],
		wrapUp: [
			"Spatial indexing turns a two-dimensional range query into a one-dimensional prefix or key lookup: geohash and quadtrees are the two standard answers.",
			"Geohash is simple and maps cleanly onto any key-value store, at the cost of edge cases at cell boundaries — always query neighbouring cells too.",
			"Quadtrees adapt to density, which is why they handle a city centre and a rural area with the same structure.",
			"The read path is cache-friendly because business locations rarely change; the index can be rebuilt offline and served read-only.",
			"With another hour: ranking within the radius (distance, rating, opening hours) and the moving-object variant."
		],
		followUps: [
			{
				q: "Geohash or quadtree?",
				a: "Geohash when the store is a plain key-value or a relational index and I want prefix queries with no custom structure — it is simple and shards naturally. Quadtree when density varies dramatically, because it subdivides only where objects are dense, so a query in a city centre and one in the countryside cost about the same. Geohash's fixed grid does not adapt that way."
			},
			{
				q: "What is the boundary problem, and how do you fix it?",
				a: "Two points a metre apart can fall in different cells with completely different prefixes, so a naive single-cell query misses the nearest result. The standard fix is to query the target cell plus its eight neighbours and filter by true distance afterwards. It is cheap and it is the detail that separates a working implementation from a subtly broken one."
			},
			{
				q: "How would this change for moving objects?",
				a: "The write rate dominates instead of the read rate — thousands of location updates per second rather than a mostly static index. I would keep current positions in memory or in Redis keyed by cell, accept that the index is a few seconds stale, and avoid persisting every update. Precomputed static indexes stop making sense once the data moves."
			}
		]
	},
	"nearby-friends": {
		clarifying: [
			{
				q: "How often do clients report location?",
				a: "Every 10-30 seconds while the feature is active. That interval directly sets the write volume and is the first thing to negotiate down if the numbers do not work."
			},
			{
				q: "How fresh must a friend's position be?",
				a: "Seconds. This is the case where staleness is visible to users — a friend shown two blocks away who left ten minutes ago is a bug in their eyes."
			},
			{
				q: "How large is a typical friend list?",
				a: "A few hundred. That bound is what makes per-user fan-out feasible rather than requiring a global spatial join."
			}
		],
		wrapUp: [
			"Location updates are high-volume, short-lived and tolerant of loss — so they live in memory with a TTL rather than in a durable store.",
			"Fan-out is bounded by the friend list, which means a pub/sub channel per user rather than a spatial query per update.",
			"A subscriber only cares about friends currently nearby, so the subscription set is filtered by distance and refreshed as people move.",
			"Presence and location share a design: heartbeat with TTL, so a crashed client expires rather than needing an explicit goodbye.",
			"With another hour: battery-aware update intervals on the client, and privacy controls including precise-versus-approximate sharing."
		],
		followUps: [
			{
				q: "Do you persist every location update?",
				a: "No. At this volume that would be an enormous write rate for data that is worthless a minute later. Current positions live in Redis with a TTL, so a client that stops reporting simply disappears. If location history is a separate product requirement, it goes to a time-series or analytics store on a sampled basis, not on the hot path."
			},
			{
				q: "How does a user learn a friend moved nearby?",
				a: "Each user has a channel, and when their location changes, the update is published to the channels of friends who are within the relevant radius. Because friend lists are bounded at a few hundred, that fan-out is small. The alternative — a spatial query per update across all users — would be far more expensive and mostly wasted."
			},
			{
				q: "What happens when a user goes offline?",
				a: "Their location key expires by TTL and they stop appearing. That is better than an explicit offline message, because a crashed app or a lost network never sends one. I would show 'last seen' rather than removing them instantly, which is both friendlier and more honest about what the system actually knows."
			}
		]
	},
	"google-maps": {
		clarifying: [
			{
				q: "Rendering, routing, or both?",
				a: "Both, and they are separate systems: tile serving is a CDN problem, routing is a graph problem. Say which you are going deep on rather than covering both shallowly."
			},
			{
				q: "Does routing need live traffic?",
				a: "Yes — that turns a static shortest-path problem into one where edge weights change continuously, which is what makes precomputation hard."
			},
			{
				q: "What area and what precision?",
				a: "Global, with street-level precision. That scale is why the road graph must be partitioned and why hierarchical routing exists."
			}
		],
		wrapUp: [
			"Map tiles are static, pyramidal and immutable per version — pure CDN content, which is why maps feel instant.",
			"Routing is a graph search over a partitioned road network, made tractable by hierarchy: local roads near the endpoints, motorways in between.",
			"Precomputation (contraction hierarchies) makes queries fast but must be rebuilt when weights change, which is the tension live traffic creates.",
			"Traffic is a separate real-time pipeline feeding edge weights, updated on a cycle rather than per request.",
			"With another hour: ETA prediction as a learned model, and turn-by-turn rerouting when a driver deviates."
		],
		followUps: [
			{
				q: "How do you make routing fast on a global graph?",
				a: "Hierarchy. A plain Dijkstra over hundreds of millions of edges is far too slow, so the graph is preprocessed into levels — contraction hierarchies or similar — and the search expands local roads near the endpoints while travelling along the highest level in between. That turns a continental route into a search over a few thousand nodes instead of millions."
			},
			{
				q: "How does live traffic fit into that?",
				a: "It changes edge weights, which invalidates precomputation — the central tension in this design. In practice the hierarchy is rebuilt on a cycle rather than per update, and live conditions are applied as adjustments on top during the query, with full rebuilds happening periodically. Perfect freshness and full precomputation are not simultaneously achievable."
			},
			{
				q: "Why are map tiles so fast?",
				a: "Because they are static files. A tile at a given zoom, x and y for a given map version never changes, so it can be cached immutably at the edge and in the browser. Updating the map produces a new version and therefore new URLs, which means there is nothing to invalidate. It is the same content-hashing pattern as static assets, applied to a pyramid of images."
			}
		]
	}
};
var supplementsB = {
	"distributed-mq": {
		clarifying: [
			{
				q: "Do consumers need to replay history?",
				a: "Assume yes — that single answer forces a log-based design with retention, rather than a queue that deletes on acknowledgement."
			},
			{
				q: "What ordering guarantee is required?",
				a: "Per key, not globally. Global ordering means a single serialisation point, which is exactly what a distributed system is trying to avoid."
			},
			{
				q: "How durable must an accepted message be?",
				a: "Replicated to a quorum before acknowledgement. That is the difference between 'we accepted it' and 'we will probably keep it'."
			}
		],
		wrapUp: [
			"The core is an append-only, partitioned log: sequential writes, offsets as cursors, and consumers that track their own position.",
			"Partitions are the unit of both ordering and parallelism, so partition count caps how many consumers can work in a group.",
			"Durability comes from replicating each partition and acknowledging after a quorum has it — the in-sync replica set is the mechanism.",
			"Retention is time- or size-based and independent of consumption, which is what makes replay and adding a new consumer group possible.",
			"With another hour: consumer group rebalancing without a stop-the-world pause, and tiered storage for old segments."
		],
		followUps: [
			{
				q: "How do you guarantee ordering?",
				a: "Only within a partition, and that is enough if the partition key is chosen so that anything requiring order shares one — all events for an account, for instance. One consumer in a group owns a partition at a time, which is what makes per-partition order meaningful. Global ordering would require a single writer and would sacrifice the scalability the design exists for."
			},
			{
				q: "What happens when a broker holding a partition leader dies?",
				a: "A new leader is elected from the in-sync replicas — those that have kept up with the log. Because acknowledgement waited for a quorum, no acknowledged message is lost. The window of unavailability is the detection timeout plus the election, and any replica that had fallen behind is excluded from candidacy precisely so it cannot truncate committed data."
			},
			{
				q: "How do you add capacity?",
				a: "More partitions, and more consumers up to that number. The catch is that increasing partitions changes the key-to-partition mapping, so a key's history is split across old and new partitions and ordering across that boundary is broken. That is why partition count should be chosen with growth in mind rather than treated as freely adjustable."
			}
		]
	},
	metrics: {
		clarifying: [
			{
				q: "What cardinality are we dealing with?",
				a: "This is the question. A metric with a user id label is millions of time series; the same metric with bounded labels is hundreds. Cardinality, not volume, is what kills metrics systems."
			},
			{
				q: "How long do we retain, and at what resolution?",
				a: "Full resolution for hours, downsampled for months. Storing per-second data for a year is orders of magnitude more expensive than anyone needs."
			},
			{
				q: "Push or pull collection?",
				a: "Pull for services you control — it gives you liveness for free — with a push gateway for short-lived jobs that die before they can be scraped."
			}
		],
		wrapUp: [
			"A metrics system is a specialised time-series database: append-heavy, timestamp-ordered, and compressed hard because adjacent values are similar.",
			"Cardinality is the dominant cost driver — every distinct label combination is a separate series with its own index entry and memory footprint.",
			"Downsampling and retention tiers are what make long-term storage affordable; nobody queries per-second data from six months ago.",
			"Querying is over ranges and aggregations, so the storage layout is columnar and partitioned by time.",
			"With another hour: the alerting evaluation loop, and how to keep queries fast when a dashboard fans out to hundreds of series."
		],
		followUps: [
			{
				q: "Why is high cardinality such a problem?",
				a: "Because each unique label combination is a separate time series with its own index entry, memory footprint and compression stream. A metric with fifty endpoints and five statuses is 250 series; add a user id and it is millions, which blows up both index memory and query time. The rule is that anything unbounded — ids, URLs with parameters, error messages — belongs in traces or logs, never in a metric label."
			},
			{
				q: "How do you store years of data affordably?",
				a: "Tiered resolution. Keep raw resolution for a short window, then continuously downsample into coarser rollups — per-minute, then per-hour — and expire the finer tier. Combined with delta-of-delta timestamp encoding and XOR compression on values, which exploit how similar consecutive samples are, the storage cost drops by more than an order of magnitude."
			},
			{
				q: "Push or pull, and why?",
				a: "Pull for long-running services, because the scrape itself tells you the target is alive, the collector controls the rate so a misbehaving service cannot flood it, and service discovery gives you the target list. Push is necessary for short-lived batch jobs that finish before any scrape, which is what a push gateway exists for — a supplement to the model rather than a replacement."
			}
		]
	},
	"ad-click": {
		clarifying: [
			{
				q: "How accurate must the counts be?",
				a: "Exact, eventually — this is billing data. That is a much stronger requirement than analytics and it drives the whole design toward deduplication and reconciliation."
			},
			{
				q: "How fresh must the dashboard be?",
				a: "Near real time for monitoring, exact by end of day for billing. Two different pipelines over the same events, which is the classic lambda-versus-kappa discussion."
			},
			{
				q: "What is the volume and the fraud exposure?",
				a: "Billions of events per day, and a meaningful fraction is fraudulent. Fraud filtering is not an afterthought — it changes what 'a click' means."
			}
		],
		wrapUp: [
			"Ingestion is append-only into a partitioned log; nothing is aggregated at the edge because raw events are needed for recount and dispute.",
			"Deduplication by event id is essential — at-least-once delivery plus retries means duplicates are routine, and duplicates are billing errors.",
			"A fast approximate path serves dashboards; a slower exact path over the same events produces billing figures, and the two are reconciled.",
			"Time windows must be handled explicitly: late events arrive for hours, so windows stay open with a watermark rather than closing on wall-clock time.",
			"With another hour: the fraud-detection pipeline and how disputed counts are recomputed from raw events."
		],
		followUps: [
			{
				q: "How do you avoid counting a click twice?",
				a: "Every click carries an id generated at the edge, and aggregation deduplicates on it within the window. Because this is billing data, I would also keep the raw events so any disputed figure can be recomputed rather than argued about. Deduplication at aggregation time plus retained raw events is what makes the number defensible."
			},
			{
				q: "An event arrives four hours late. What happens?",
				a: "It still counts, which is why windows are driven by event time with a watermark rather than by wall-clock arrival. The aggregate for that window is updated and downstream consumers see a correction. Systems that close windows on arrival time quietly undercount exactly the traffic from poor networks, which correlates with real users."
			},
			{
				q: "Do you need both a real-time and a batch path?",
				a: "Historically yes — a fast approximate path for dashboards and a batch recompute for billing. Modern streaming engines with exactly-once semantics and event-time windows can serve both from one pipeline, which removes the duplicated logic that made the two-path design painful. I would still keep the raw events, because the ability to recompute from source is what makes billing disputes resolvable."
			}
		]
	},
	"hotel-reservation": {
		clarifying: [
			{
				q: "Can we oversell?",
				a: "No. That single constraint makes this a strong-consistency problem and rules out designs that would be fine for a social feed."
			},
			{
				q: "How long is inventory held during checkout?",
				a: "Ten to fifteen minutes. That hold is a real state with an expiry, and forgetting it is how rooms become permanently unavailable."
			},
			{
				q: "What is the read/write ratio?",
				a: "Very read-heavy — searching vastly outnumbers booking. So search can be served from cache and replicas while booking takes the consistent path."
			}
		],
		wrapUp: [
			"Search and booking are separated deliberately: search reads a cached, slightly stale view, while booking takes a strongly consistent path against real inventory.",
			"Inventory is decremented with a conditional update, so overselling is prevented structurally rather than by checking first and writing after.",
			"Holds are a first-class state with an expiry and a sweeper, because a hold that never expires removes inventory permanently.",
			"Idempotency keys make a retried booking safe — a timeout during payment must not produce two reservations.",
			"With another hour: overbooking policy as a deliberate business decision, and the multi-room, multi-night atomicity case."
		],
		followUps: [
			{
				q: "Two users book the last room simultaneously. What happens?",
				a: "One conditional update succeeds and the other affects zero rows, so exactly one booking is created and the other user is told immediately. The important part is that the check and the decrement are one atomic statement — reading availability, deciding in application code, and then writing is where oversell bugs live."
			},
			{
				q: "Search says available but booking fails. Is that acceptable?",
				a: "Yes, and it is the right trade. Search is served from a cached view that may be seconds stale, which is what makes it fast at high volume; booking checks the truth. The alternative — strongly consistent search — would put the entire read load on the transactional path for a case that is rare and recoverable with a clear message."
			},
			{
				q: "How do you handle a booking that spans five nights?",
				a: "All five nights must be reserved atomically or none — a partial booking is worse than a failure. Within one shard that is a single transaction over the five inventory rows, taken in a consistent order to avoid deadlock. If inventory were partitioned such that they could land on different shards, I would keep a hotel's inventory co-located precisely so this stays a local transaction."
			}
		]
	},
	"email-service": {
		clarifying: [
			{
				q: "Sending, receiving, or both?",
				a: "Both are distinct systems: sending is a delivery pipeline with reputation management, receiving is storage plus search. Scope explicitly."
			},
			{
				q: "How much mail per user, and how long retained?",
				a: "Tens of thousands of messages, retained indefinitely. That makes search the dominant read problem and storage the dominant cost."
			},
			{
				q: "What search quality is expected?",
				a: "Full-text over headers and bodies with fast results. That means a per-user inverted index, which is a very different structure from the message store."
			}
		],
		wrapUp: [
			"Mail storage is per-user and append-heavy, with metadata separated from bodies so a mailbox listing never reads message content.",
			"Search needs a per-user inverted index built asynchronously from the message stream — the message store cannot answer full-text queries.",
			"Sending is a queue-and-retry pipeline where sender reputation, bounce handling and suppression lists matter more than throughput.",
			"Attachments go to object storage with deduplication by content hash, since the same attachment often reaches thousands of recipients.",
			"With another hour: spam filtering as a scored pipeline, and threading messages into conversations."
		],
		followUps: [
			{
				q: "How do you make search fast over a decade of mail?",
				a: "A per-user inverted index rather than scanning the message store. It is built asynchronously as messages arrive, partitioned by user so a query touches one shard, and it stores just enough to rank and locate — the bodies stay in the message store and are fetched for the results actually displayed. Search and storage are different structures answering different questions."
			},
			{
				q: "One email is sent to 10,000 recipients. How is it stored?",
				a: "The body and attachments once, content-addressed, with a per-recipient metadata row referencing it. Storing 10,000 copies of the same attachment is the naive version and it is enormously wasteful. Deduplication by content hash also means the storage cost of a broadcast is close to the cost of a single message."
			},
			{
				q: "What makes outbound delivery hard?",
				a: "Reputation, not throughput. Receiving providers throttle or reject senders based on bounce rates, complaint rates and IP history, so the pipeline needs suppression lists, bounce processing, gradual warm-up of new sending IPs, and per-domain rate shaping. A technically perfect sender with a poor reputation simply does not get delivered."
			}
		]
	},
	"object-storage": {
		clarifying: [
			{
				q: "What is the durability target?",
				a: "Eleven nines, which is the industry expectation. That number is what forces erasure coding across failure domains rather than simple replication."
			},
			{
				q: "Immutable objects or mutable files?",
				a: "Immutable objects with versioning. Allowing in-place mutation would require a completely different consistency model and is why object storage is not a filesystem."
			},
			{
				q: "What object sizes?",
				a: "Bytes to terabytes, which means multipart upload and range reads are core features rather than extras."
			}
		],
		wrapUp: [
			"Metadata and data are separate systems: a partitioned metadata store maps keys to placement, and data lives on storage nodes as immutable chunks.",
			"Durability comes from erasure coding across racks and availability zones — far cheaper than three-way replication for the same durability.",
			"Immutability makes consistency tractable: a new version is a new object, so there is no in-place update to coordinate.",
			"Background repair continuously verifies checksums and rebuilds lost fragments, because at this scale disks fail constantly.",
			"With another hour: lifecycle policies and tiering to cold storage, and the multipart upload state machine."
		],
		followUps: [
			{
				q: "Replication or erasure coding?",
				a: "Erasure coding for the bulk of the data. Three-way replication costs 200% overhead; a scheme like 10 data plus 4 parity fragments gives comparable or better durability at around 40%, spread across racks and zones so no single failure domain holds enough fragments to matter. The cost is that reconstructing a lost fragment reads from many nodes, so small hot objects are sometimes replicated instead."
			},
			{
				q: "How do you get eleven nines of durability?",
				a: "Not from any single mechanism. Fragments spread across independent failure domains, continuous background verification of checksums, automatic reconstruction when a fragment is lost, and enough redundancy that several simultaneous failures are survivable. The number comes from the probability of losing more fragments than the coding tolerates before repair completes — which makes repair speed as important as redundancy level."
			},
			{
				q: "How does a 5 TB upload work?",
				a: "Multipart: the client initiates an upload, uploads parts independently and in parallel with individual checksums, then signals completion and the service assembles the manifest. A failed part is retried alone rather than restarting five terabytes. Incomplete uploads need a lifecycle rule to clean them up, or orphaned parts accumulate silently and cost real money."
			}
		]
	}
};
var supplementsC = {
	leaderboard: {
		clarifying: [
			{
				q: "How many players, and how often do scores change?",
				a: "Millions of players with continuous updates. That write rate rules out recomputing ranks on read and is why a sorted structure is maintained incrementally."
			},
			{
				q: "Global only, or also friends and regions?",
				a: "Several leaderboards at once. Each is a separate sorted set, and a player appears in many of them — which multiplies the write cost per score update."
			},
			{
				q: "Does a player need their exact rank?",
				a: "Ask, because exact rank for a mid-table player is expensive and approximate rank is usually acceptable. Top-N is cheap; 'you are number 4,812,003' is not."
			}
		],
		wrapUp: [
			"A sorted set gives O(log n) updates and O(log n + k) top-k reads, which is why Redis is the standard answer here.",
			"Multiple leaderboards mean one score update writes to several sorted sets — global, regional, friends, weekly — so the write amplification is the real cost.",
			"Time-bounded boards (daily, weekly) are separate keys with TTLs rather than filters over one big board.",
			"Exact rank deep in the table is expensive; approximate rank via bucketing is usually the right product answer.",
			"With another hour: persistence and rebuild from the score-of-record store, and anti-cheat validation before a score is accepted."
		],
		followUps: [
			{
				q: "How do you get a player's rank without scanning?",
				a: "A sorted set maintains rank as part of its structure, so a rank query is a logarithmic operation rather than a scan. The cost appears when a single sorted set gets very large or when you need many boards, since each update touches all of them. For deep ranks I would consider bucketing — counting how many players are in each score bucket — which gives an approximate rank in constant time."
			},
			{
				q: "How do you handle ties?",
				a: "Define the rule explicitly, because the naive answer is non-deterministic. The usual approach is to encode a secondary key into the score itself — for example score plus an inverted timestamp — so earlier achievement of the same score ranks higher and the order is stable across reads. Leaving ties to the store's internal ordering produces a leaderboard that reshuffles for no visible reason."
			},
			{
				q: "What if Redis loses the data?",
				a: "The leaderboard must be reconstructible, so scores are also written to a durable store as the record of truth, and the sorted sets are treated as a derived index. Rebuilding a large board takes time, so I would rebuild the top segment first — which is what almost everyone looks at — and backfill the tail."
			}
		]
	},
	"digital-wallet": {
		clarifying: [
			{
				q: "Can a balance go negative?",
				a: "No. That constraint is the whole design: every debit must atomically check and decrement, which rules out eventually consistent balances."
			},
			{
				q: "Are transfers between users internal or through a bank?",
				a: "Internal ledger movements, which is what makes them fast and atomic. External movement is a separate, slower path with its own reconciliation."
			},
			{
				q: "What audit requirements apply?",
				a: "Full history, immutable, retained for years. That makes an append-only ledger a requirement rather than a design preference."
			}
		],
		wrapUp: [
			"The wallet is a ledger: balances are derived by summing entries, never stored as a mutable field that could drift.",
			"A transfer is one transaction with balanced debit and credit entries, and it must be atomic — a partial transfer is money created or destroyed.",
			"Locking order matters: always lock accounts in a fixed order, or two opposite transfers deadlock.",
			"Idempotency keys make retries safe, which matters because a timed-out transfer will be retried by a user or a client.",
			"With another hour: sharding accounts while keeping transfers within a shard, and the reconciliation process against external rails."
		],
		followUps: [
			{
				q: "How do you prevent a double spend?",
				a: "The check and the decrement are one atomic operation — a conditional update that only succeeds when the balance is sufficient, or a row lock held for the duration of the transaction. Reading the balance, deciding in application code, and then writing is the bug, because two concurrent transfers can both read the same sufficient balance."
			},
			{
				q: "Two users transfer to each other simultaneously. What happens?",
				a: "Without care, a deadlock: each transaction holds one account and wants the other. The fix is a total ordering — always lock the lower account id first — so the cycle cannot form. It is a small detail that is invisible in testing and shows up under production concurrency."
			},
			{
				q: "How do you shard this?",
				a: "By account, with the strong preference that both sides of a transfer live on the same shard so it stays a local transaction. Where that is impossible, cross-shard transfers need a saga with compensating entries rather than two-phase commit, and each step must be idempotent. That complexity is a good reason to delay sharding a wallet system as long as possible."
			}
		]
	},
	"stock-exchange": {
		clarifying: [
			{
				q: "What latency budget?",
				a: "Microseconds. That single answer changes everything — it rules out network hops between components, garbage-collected languages in the hot path, and disk writes on the critical path."
			},
			{
				q: "How strict is fairness?",
				a: "Strict price-time priority, and it must be auditable. Fairness here is a regulatory requirement, not a nicety."
			},
			{
				q: "What happens on a crash?",
				a: "Full recovery with no lost orders. That means a sequenced, replicated input log that can be replayed deterministically."
			}
		],
		wrapUp: [
			"The matching engine is deliberately single-threaded per symbol: determinism and fairness matter more than parallelism within a book.",
			"Everything sits in memory, and durability comes from an append-only sequenced input log rather than from writing state to disk.",
			"Recovery is replay: the same ordered inputs through the same deterministic engine reproduce the exact book state.",
			"Scaling is by symbol partitioning — different instruments run on different engines — because a single book cannot be parallelised without losing ordering.",
			"With another hour: market data fan-out to thousands of subscribers, and circuit breakers and auction states."
		],
		followUps: [
			{
				q: "Why single-threaded?",
				a: "Because price-time priority requires a total order over the book, and any concurrency introduces either locks that dominate the latency budget or non-determinism that makes replay impossible. A single thread processing a sequenced input stream is both the fastest option at this scale and the only one that reproduces exactly on recovery and in audit."
			},
			{
				q: "How is it durable without writing state to disk?",
				a: "By persisting inputs rather than state. Every order and cancellation is written to a replicated append-only log with a sequence number before being processed. Because the engine is deterministic, replaying that log rebuilds the identical book. Periodic snapshots bound how much has to be replayed, exactly like a database checkpoint plus write-ahead log."
			},
			{
				q: "How do you scale beyond one machine?",
				a: "By partitioning across symbols — each instrument's book is independent, so different symbols run on different engines. What cannot be split is a single book, since it needs a total order. Cross-symbol operations like basket orders then need coordination above the engines, which is why they carry different guarantees."
			}
		]
	},
	"auth-system": {
		clarifying: [
			{
				q: "Session tokens or JWTs?",
				a: "This is the design's central trade: sessions are revocable but need a lookup; JWTs are stateless but cannot be revoked before expiry without reintroducing state."
			},
			{
				q: "How quickly must revocation take effect?",
				a: "Ask explicitly. 'Immediately' rules out long-lived stateless tokens; 'within fifteen minutes' makes short-lived access tokens plus refresh workable."
			},
			{
				q: "Do we support third-party login and multiple devices?",
				a: "Yes to both, which means an identity that can have several credentials attached and sessions tracked per device."
			}
		],
		wrapUp: [
			"The practical shape is short-lived access tokens plus long-lived refresh tokens, which gets most of the statelessness benefit while keeping revocation possible.",
			"Passwords are stored with a slow, salted hash (argon2 or bcrypt) — never a fast general-purpose hash, and never encrypted-and-decryptable.",
			"Refresh tokens should rotate on use, so a stolen refresh token is detectable when the original is replayed.",
			"Rate limiting and lockout on the login path are part of the design, not an operational add-on.",
			"With another hour: multi-factor enrolment and recovery, and session listing and remote revocation per device."
		],
		followUps: [
			{
				q: "JWT or session token?",
				a: "Short-lived JWTs for access plus a stateful refresh token, which is the usual compromise. Pure JWTs cannot be revoked before expiry, so a compromised token stays valid — and adding a denylist reintroduces the lookup they were meant to avoid. Keeping access tokens to a few minutes bounds that exposure while still avoiding a database hit on most requests."
			},
			{
				q: "How do you store passwords?",
				a: "Hashed with a deliberately slow, memory-hard function — argon2id or bcrypt — with a per-user salt and a work factor tuned so verification takes a meaningful fraction of a second. Never a fast hash like SHA-256, which is designed for speed and therefore for offline cracking, and never anything reversible, because the goal is that a database leak does not yield passwords."
			},
			{
				q: "How do you handle a stolen refresh token?",
				a: "Rotate refresh tokens on every use and remember the previous one. If an old token is presented again, either the legitimate client or the attacker is replaying it, so the whole token family is revoked and the user re-authenticates. That turns theft from an indefinite compromise into a detectable event."
			}
		]
	},
	"distributed-cache": {
		clarifying: [
			{
				q: "Cache-aside or read-through?",
				a: "Cache-aside by default: the application controls the fallback, and a cache outage degrades performance rather than breaking correctness."
			},
			{
				q: "How stale can data be?",
				a: "The most important question, and the answer differs per key type. Prices and permissions want seconds; a follower count is fine at minutes."
			},
			{
				q: "What happens when the cache is unavailable?",
				a: "Reads fall through to the database, which must be able to survive that — or you have built a cache that is actually a dependency."
			}
		],
		wrapUp: [
			"Nodes are placed on a consistent hash ring so that adding or losing one moves ~1/N of the keys rather than nearly all of them.",
			"Eviction policy and memory limits must be set explicitly — a cache with no eviction policy that fills up starts rejecting writes.",
			"The three failure modes are stampede, penetration and avalanche, and each has a specific fix: single-flight, negative caching, and TTL jitter.",
			"Delete on write rather than update, so two concurrent writers cannot leave the cache holding the older value permanently.",
			"With another hour: replication for hot keys, and client-side near-caching with an invalidation channel."
		],
		followUps: [
			{
				q: "A single key gets 50,000 requests per second. What breaks?",
				a: "Consistent hashing sends that key to exactly one node, which becomes a hotspot no matter how well the rest is balanced. The fixes are to put a small in-process cache in front so most requests never leave the application server, or to replicate the key across several nodes and read a random replica. It is worth stating clearly that consistent hashing distributes keys, not traffic."
			},
			{
				q: "How do you avoid a stampede when a hot key expires?",
				a: "Single-flight: the first request to miss takes a lock on that key and loads it while the others wait on the same result, so one database query serves them all. Better still, refresh probabilistically before expiry so the key never actually goes cold under load, and serve the stale value while the refresh happens."
			},
			{
				q: "The whole cache tier goes down. What happens?",
				a: "With cache-aside, correctness is unaffected and the full read load lands on the database, which is usually not provisioned for it — so it is a genuine outage mode. I would rate limit or shed load at the edge while it recovers, keep a small in-process cache as a second line of defence, and warm the cache before returning it to service rather than letting it cold-start under full traffic."
			}
		]
	},
	"job-scheduler": {
		clarifying: [
			{
				q: "At-least-once or at-most-once execution?",
				a: "At-least-once with idempotent jobs is the practical answer. At-most-once means a crashed worker silently drops work, which is usually worse."
			},
			{
				q: "Do jobs have dependencies?",
				a: "If yes, this becomes a DAG scheduler rather than a queue, which is a substantially bigger system. Scope it explicitly."
			},
			{
				q: "How precise must scheduled times be?",
				a: "Seconds is usually fine. Millisecond precision across a distributed scheduler is a much harder and rarely necessary requirement."
			}
		],
		wrapUp: [
			"Scheduled jobs are rows with a due time and a lease: workers claim due jobs atomically, extend the lease while running, and release on completion.",
			"The lease is what makes worker death survivable — an expired lease means the job becomes claimable again.",
			"Exactly-once execution is not achievable, so jobs must be idempotent and the design should say so rather than pretend otherwise.",
			"Recurring jobs need catch-up policy: after downtime, do you run every missed occurrence or only the latest?",
			"With another hour: DAG dependencies and backfill, and per-tenant fairness so one customer's jobs cannot starve others."
		],
		followUps: [
			{
				q: "How do you stop two workers running the same job?",
				a: "An atomic claim — a conditional update that sets the job's lease owner and expiry only if it is currently unclaimed, or SELECT ... FOR UPDATE SKIP LOCKED so the database hands each worker a different row. Zero rows affected means someone else took it. Reading due jobs and then updating them is the version that double-runs under load."
			},
			{
				q: "A worker dies mid-job. What happens?",
				a: "Its lease expires and another worker claims the job, which is why long-running jobs must extend their lease periodically as a heartbeat. That guarantees the work is retried, at the cost of possible double execution if the original worker was merely slow rather than dead — which is exactly why jobs must be idempotent."
			},
			{
				q: "The scheduler was down for two hours. What runs?",
				a: "That is a policy decision that has to be made per job type. A nightly report should run once on recovery, not twelve times; a data sync probably should process every missed window. I would make it an explicit property of the job — catch up all, catch up latest, or skip — rather than letting the recovery behaviour be an accident of implementation."
			}
		]
	}
};
var supplementsD = {
	instagram: {
		clarifying: [
			{
				q: "Is the feed chronological or ranked?",
				a: "Ranked, which means retrieval and ranking are separate stages — assemble a candidate set first, score it second."
			},
			{
				q: "How large can a follower count get?",
				a: "Into the hundreds of millions, which is what forces a hybrid fan-out rather than pure push."
			},
			{
				q: "How much of the payload is media?",
				a: "Nearly all of it. The feed carries ids and metadata; images and video are served entirely from a CDN, which is a separate delivery problem."
			}
		],
		wrapUp: [
			"Feed generation is hybrid: push to normal users' precomputed feeds, pull for accounts above a follower threshold, merged at read time.",
			"Media is uploaded directly to object storage, processed into several sizes and formats asynchronously, and served from the CDN.",
			"Feed entries hold ids; hydration into full posts happens at read time from a cache, which keeps feed storage small.",
			"Deleted, blocked and hidden content is filtered at hydration rather than by rewriting millions of feed lists.",
			"With another hour: the ranking pipeline and its feature freshness, and Stories, which have very different expiry mechanics."
		],
		followUps: [
			{
				q: "How is this different from Twitter's feed?",
				a: "Structurally it is the same hybrid fan-out problem, but the payload changes the emphasis: Instagram's bytes are overwhelmingly media, so CDN strategy and image processing dominate the cost, while Twitter's are text, so the feed infrastructure dominates. The celebrity fan-out problem and the push-versus-pull threshold are essentially identical."
			},
			{
				q: "What happens when a post is deleted?",
				a: "It is tombstoned, and feeds filter it during hydration. Rewriting every feed list that contains it would be millions of writes for one delete. The media is also unlinked from the CDN, which requires a purge — that is the step people forget, and without it the image stays reachable by direct URL."
			},
			{
				q: "How do you handle image processing at upload?",
				a: "Asynchronously, after the upload lands directly in object storage via a signed URL. A pipeline generates the sizes and formats the clients need — thumbnails, feed size, full size, modern codecs — and the post becomes visible once the essential renditions exist. Doing this synchronously would make posting slow and would couple upload availability to the processing fleet."
			}
		]
	},
	netflix: {
		clarifying: [
			{
				q: "Playback, catalogue, or recommendations?",
				a: "Say which. Playback is a CDN and adaptive-bitrate problem; recommendations is a machine-learning pipeline. They share almost nothing."
			},
			{
				q: "Is the catalogue fixed or continuously changing?",
				a: "Slowly changing, which is what makes aggressive pre-positioning of content at the edge possible — you know days in advance what people will watch."
			},
			{
				q: "What is the availability requirement during a regional failure?",
				a: "Playback must continue. That is why the architecture emphasises graceful degradation of everything except the play button."
			}
		],
		wrapUp: [
			"Content is transcoded once into many renditions and pre-positioned into edge caches — often inside ISP networks — before anyone requests it.",
			"Playback is adaptive bitrate over plain HTTP segments, so the player controls quality and any HTTP cache can serve video.",
			"Everything except playback degrades gracefully: recommendations, artwork and search can fail without stopping the video.",
			"Client-side resilience — retries, fallbacks, cached catalogue data — is treated as part of the system, not as the client team's problem.",
			"With another hour: the recommendation pipeline, and encoding-per-title optimisation that tunes the ladder to the content."
		],
		followUps: [
			{
				q: "Why pre-position content instead of caching on demand?",
				a: "Because the catalogue is known and popularity is predictable, so waiting for a cache miss wastes the one thing that is scarce — origin bandwidth at peak. Pushing new releases to edge caches during off-peak hours means the first viewer in a region gets an edge hit, and the origin never sees the surge."
			},
			{
				q: "What degrades when something fails?",
				a: "Everything except playback. Personalised rows fall back to popular content, artwork falls back to a default, search falls back to a simpler index. The design principle is that a member should always be able to start a video, and every other feature has an explicit fallback with a short timeout so a slow dependency cannot hold up the home screen."
			},
			{
				q: "How does the player choose quality?",
				a: "It measures throughput and buffer level and switches between renditions at segment boundaries, which are keyframe-aligned so the switch is seamless. The heuristic favours avoiding rebuffering over maximising resolution, because users tolerate lower quality far better than a spinner."
			}
		]
	},
	spotify: {
		clarifying: [
			{
				q: "Streaming, or also offline downloads?",
				a: "Both, which means the client caches encrypted audio locally and the licensing model has to permit it — a product constraint that shapes the design."
			},
			{
				q: "How fast must playback start?",
				a: "Under 200 ms perceived. That drives prefetching the start of the next likely track rather than waiting for the user to press play."
			},
			{
				q: "Personalised playlists in real time?",
				a: "Generated offline on a cycle, served from a precomputed store. Real-time generation per user per request is not necessary and not affordable."
			}
		],
		wrapUp: [
			"Audio files are small and immutable, so they are ideal CDN objects — the delivery problem is far easier than video.",
			"Perceived latency is managed by prefetching: the next track in a queue is fetched before the current one ends.",
			"Playlists and recommendations are precomputed offline and served as static-ish reads, which keeps the request path cheap.",
			"Play events feed both royalty accounting, which must be exact, and recommendations, which can be approximate — two consumers of one stream.",
			"With another hour: offline download and licence expiry, and the collaborative-filtering pipeline behind personalised playlists."
		],
		followUps: [
			{
				q: "Why is audio easier than video?",
				a: "Size. A track is a few megabytes rather than gigabytes, so it can be fetched whole or in a couple of chunks, cached almost anywhere, and does not need a complex adaptive-bitrate ladder. The interesting problems shift from delivery to discovery — search, recommendations and playlist generation — which is the opposite emphasis from a video service."
			},
			{
				q: "How do you make playback feel instant?",
				a: "Prefetch. While a track plays, the client fetches the beginning of the next one, so pressing skip is a local operation. Combined with CDN edge caching and starting playback from a small initial buffer rather than waiting for a full download, the perceived latency is dominated by the client's own decisions rather than by the network."
			},
			{
				q: "How are royalties counted?",
				a: "From play events, which must be exact because they are billing data. That means deduplicating on an event id, defining precisely what counts as a play — typically a minimum duration — and retaining raw events so a disputed figure can be recomputed. The same event stream feeds recommendations, where approximation is fine, so the two consumers have very different accuracy requirements."
			}
		]
	},
	uber: {
		clarifying: [
			{
				q: "How often do drivers report location?",
				a: "Every few seconds while online. That is the dominant write load and the first number to establish."
			},
			{
				q: "How is a match decided?",
				a: "Not purely by distance — ETA, direction of travel, driver rating and acceptance likelihood all matter, which makes matching a scoring problem rather than a nearest-neighbour query."
			},
			{
				q: "What happens if a driver declines?",
				a: "The request moves to the next candidate with a short timeout. That loop is the core of the matching system and needs an explicit deadline before the rider is told nobody is available."
			}
		],
		wrapUp: [
			"Driver locations are high-volume, short-lived and tolerant of loss, so they live in an in-memory spatial index rather than a durable store.",
			"Matching is a scored selection over candidates in nearby cells, not a nearest-neighbour lookup — ETA and acceptance probability matter more than raw distance.",
			"The offer loop needs explicit timeouts and a bounded number of attempts, or a rider waits indefinitely while offers cycle.",
			"The trip itself is a state machine with strong consistency requirements once a match is accepted; before that, everything is best-effort.",
			"With another hour: surge pricing as a feedback loop, and the ETA model that matching depends on."
		],
		followUps: [
			{
				q: "How do you find nearby drivers efficiently?",
				a: "A spatial index — geohash cells or an S2-style covering — held in memory and keyed by cell, so a search reads the target cell and its neighbours rather than scanning all drivers. Because positions change constantly, the index is updated in place and never persisted per update; losing it means drivers re-report within seconds."
			},
			{
				q: "Two riders request the same driver simultaneously. What happens?",
				a: "The offer must be an atomic claim on the driver — a conditional update that succeeds for exactly one request. The loser immediately moves to its next candidate rather than waiting. Without that atomicity you get two riders told the same driver is coming, which is a much worse failure than a slightly longer wait."
			},
			{
				q: "Why not just pick the closest driver?",
				a: "Because straight-line distance is a poor predictor of arrival time — a driver across a river or facing the wrong way on a one-way street is further in practice. Matching scores candidates on estimated time to arrive, direction of travel, and the probability they accept, since an offer that gets declined costs the rider more time than a slightly more distant driver who says yes."
			}
		]
	},
	"food-delivery": {
		clarifying: [
			{
				q: "How many parties are being coordinated?",
				a: "Three — customer, restaurant and courier — each with their own state and their own failure modes. That three-way coordination is what makes this harder than a ride-hailing match."
			},
			{
				q: "Are couriers assigned before or after the restaurant accepts?",
				a: "It is a real trade: assigning early risks a wasted courier if the restaurant declines; assigning late adds delay. Say which you chose."
			},
			{
				q: "Do we support batching multiple orders per courier?",
				a: "Yes at scale, and it changes the assignment problem from matching to routing — which is worth flagging as substantially harder."
			}
		],
		wrapUp: [
			"The order is a state machine spanning three parties, and every transition needs a timeout and a fallback because any party can stall.",
			"Courier assignment is timed against food readiness — assigning too early wastes courier time, too late means cold food.",
			"ETA is a composition of several estimates (preparation, pickup, travel), and errors compound, so it must be re-estimated continuously.",
			"Every party sees a different view of the same order, which means the notification and update fan-out is a first-class part of the design.",
			"With another hour: batching orders per courier as a routing problem, and dynamic pricing during demand peaks."
		],
		followUps: [
			{
				q: "When do you assign a courier?",
				a: "Timed against predicted food readiness rather than at order placement or at pickup. Too early and the courier waits, which wastes the scarcest resource in the system; too late and the food sits getting cold. That makes the preparation-time estimate a load-bearing part of the design, not a display detail."
			},
			{
				q: "The restaurant never confirms the order. What happens?",
				a: "Every state needs a timeout and an escalation. After a short window the system re-pings, then escalates to a human or auto-cancels and refunds, and the customer is told early rather than left watching a status that never changes. Designing the unhappy paths explicitly is most of the work in a three-party workflow."
			},
			{
				q: "Why is the ETA so hard?",
				a: "Because it is a sum of estimates that each have error — restaurant preparation, courier arrival at the restaurant, wait time there, and travel to the customer — and the errors compound. It also has to be recomputed continuously as reality diverges, and the product consequence of being wrong is asymmetric: quoting too short is far worse than quoting slightly long."
			}
		]
	},
	"google-docs": {
		clarifying: [
			{
				q: "How many concurrent editors per document?",
				a: "Tens, occasionally hundreds. That bound matters, because the merge algorithms behave very differently at ten editors than at ten thousand."
			},
			{
				q: "Must edits work offline?",
				a: "Yes — which strongly favours a CRDT or a well-implemented operational transform, since a naive last-write-wins merge loses text."
			},
			{
				q: "Is full version history required?",
				a: "Yes, which means the operation log is retained rather than only the current document state."
			}
		],
		wrapUp: [
			"The document is a sequence of operations, not a blob — that representation is what makes concurrent editing and history possible.",
			"Concurrent edits are reconciled by operational transform or a CRDT; both preserve intent where a text-level merge would lose it.",
			"A server assigns a total order to operations, which is what lets clients converge without a distributed consensus protocol per keystroke.",
			"Presence, cursors and selections are separate, ephemeral channels with much weaker delivery guarantees than the edits themselves.",
			"With another hour: rich formatting and its interaction with the merge algorithm, and snapshotting so a document does not replay millions of operations."
		],
		followUps: [
			{
				q: "OT or CRDT?",
				a: "Operational transform is what the established editors use — it needs a central server to order operations, which they have anyway, and it produces compact operations. CRDTs need no central authority and handle offline editing cleanly, at the cost of metadata that grows with edit history. For a server-backed document editor I would take OT for its efficiency; for peer-to-peer or heavily offline use, a CRDT."
			},
			{
				q: "Two people type at the same position simultaneously. What happens?",
				a: "Both operations are ordered by the server, and the second is transformed against the first so its position accounts for the character that was just inserted. Without that transformation, the second insert lands at a stale offset and the text is corrupted. Every client applies operations in the same order with the same transformations, so all copies converge."
			},
			{
				q: "How do you avoid replaying a million operations to open a document?",
				a: "Periodic snapshots. The document state is materialised and stored at intervals, and opening loads the latest snapshot plus the operations since. It is the same checkpoint-plus-log pattern a database uses, and without it, load time grows without bound as a document ages."
			}
		]
	}
};
var supplementsE = {
	tinder: {
		clarifying: [
			{
				q: "How is the candidate deck generated?",
				a: "Precomputed per user rather than queried live — filtering millions of profiles on every swipe would not meet the latency budget."
			},
			{
				q: "How is a match detected?",
				a: "A mutual like, which is a read of the other person's decision at the moment you swipe. That check must be fast and must not miss a concurrent like."
			},
			{
				q: "Is swipe volume high?",
				a: "Extremely — swipes vastly outnumber matches. That asymmetry is why swipes are written cheaply and matches are handled carefully."
			}
		],
		wrapUp: [
			"Recommendation decks are precomputed and cached per user, refilled in the background so a swipe never triggers a search.",
			"Swipes are a very high-volume, low-value write — batch them and keep the write path minimal.",
			"Match detection is a lookup of the reciprocal swipe; making that check atomic avoids the case where two simultaneous likes produce no match.",
			"Geography plus filters means the candidate pool is a spatial query, which is done offline during deck generation rather than per swipe.",
			"With another hour: the ranking model behind deck ordering, and the anti-abuse and verification pipeline."
		],
		followUps: [
			{
				q: "How do you generate the deck fast enough?",
				a: "By not generating it during the swipe. A background job builds and caches a queue of candidates per active user, filtered by location and preferences and ordered by the ranking model, and refills it when it runs low. The swipe path then just pops from a cached list, which keeps it to a couple of milliseconds."
			},
			{
				q: "Two users like each other at the same instant. Do both see a match?",
				a: "They must, which means the check-and-record has to be atomic rather than 'write my swipe, then read theirs'. A conditional write on a canonical pair key — ordered by user id so both sides compute the same key — ensures exactly one match record is created and both users are notified from it."
			},
			{
				q: "Do you store every swipe?",
				a: "Yes, but cheaply and asynchronously. They are needed to avoid re-showing profiles and to train ranking, but they do not need to be durable within the request. I would write them to a fast store or batch them into a stream, and keep a compact per-user seen-set so deck generation can exclude them."
			}
		]
	},
	"google-search": {
		clarifying: [
			{
				q: "Are we designing crawling, indexing, or serving?",
				a: "Pick one. Serving a query in 100 ms over a trillion-document index is a different system from building that index, and covering both shallowly helps nobody."
			},
			{
				q: "How fresh must results be?",
				a: "Tiered: news within minutes, the long tail within weeks. A uniform freshness target either wastes capacity or misses everything that changes."
			},
			{
				q: "What is the latency budget?",
				a: "Around 100 ms including ranking. That budget is what forces index sharding with parallel fan-out and heavy caching."
			}
		],
		wrapUp: [
			"The core structure is an inverted index — term to posting list — sharded by document so every shard sees every query and returns local top-k.",
			"Query serving is scatter-gather: fan out to all shards in parallel, merge top results, then re-rank the small survivor set with expensive signals.",
			"Two-phase ranking is what makes the latency budget work: cheap scoring on millions of candidates, expensive scoring on a few hundred.",
			"Caching at the query level absorbs a large share of traffic because query popularity is extremely skewed.",
			"With another hour: index update pipelines and freshness tiers, and how personalisation interacts with caching."
		],
		followUps: [
			{
				q: "How do you serve a query in 100 ms over a trillion documents?",
				a: "By never touching most of them. The inverted index turns a query into a small number of posting-list intersections, the index is sharded by document so every shard works in parallel on its slice, and each returns only its local top results. Then a cheap first-pass score narrows millions of candidates to a few hundred, and only those get expensive ranking."
			},
			{
				q: "Why shard by document rather than by term?",
				a: "Because term-sharding means a multi-word query hits only the shards holding those terms, creating enormous load skew on common words and requiring posting lists to be shipped between shards to intersect. Document-sharding means every shard does a small, similar amount of work and returns a small result — more total machines involved, but predictable latency and even load."
			},
			{
				q: "What does the tail latency look like with hundreds of shards?",
				a: "Bad, unless you design for it. A request waits for the slowest shard, so with enough shards, some request is always hitting someone's garbage collection or slow disk. The standard mitigations are hedged requests — send a duplicate to another replica after a short delay — and returning partial results when a shard misses its deadline, since missing a fraction of results is far better than missing the deadline."
			}
		]
	},
	zoom: {
		clarifying: [
			{
				q: "How many participants per meeting?",
				a: "It changes the architecture entirely. Two people can go peer-to-peer; fifty need a media server; a webinar for ten thousand is a broadcast problem."
			},
			{
				q: "What is the latency requirement?",
				a: "Under about 200 ms one way for conversation to feel natural. That rules out anything involving buffering or store-and-forward."
			},
			{
				q: "Do we need recording and transcription?",
				a: "If yes, the media server must produce a composited stream as well as forwarding, which is a significantly higher CPU cost."
			}
		],
		wrapUp: [
			"Media is UDP-based real-time transport, not HTTP: latency matters far more than reliability, so lost packets are concealed rather than retransmitted.",
			"A selective forwarding unit forwards streams without decoding them, which is what makes many-participant meetings affordable.",
			"Simulcast — each sender publishes several qualities — lets the server give each receiver a stream matched to their connection.",
			"Signalling, media and recording are separate paths with different scaling characteristics and different failure modes.",
			"With another hour: echo cancellation and active-speaker detection, and the fallback path when UDP is blocked."
		],
		followUps: [
			{
				q: "Peer-to-peer or through a server?",
				a: "Peer-to-peer for two participants, because it is the lowest latency and costs nothing to run. Beyond a handful it stops working, since each participant must upload their stream to every other — that is quadratic in upload bandwidth. A selective forwarding unit fixes it: everyone uploads once and the server forwards, so upload cost stays constant per participant."
			},
			{
				q: "Why not mix all streams into one on the server?",
				a: "Mixing requires decoding and re-encoding every stream, which is expensive per meeting and adds latency. A forwarding unit just routes packets without touching the media, so a server can host far more meetings. The trade is that clients receive multiple streams and do their own layout, which shifts work to the endpoint — usually a good trade."
			},
			{
				q: "What happens on a poor connection?",
				a: "Quality degrades rather than the call dropping. With simulcast, the sender publishes several qualities and the server forwards the one that fits each receiver's measured bandwidth. Lost packets are concealed by the codec rather than retransmitted, because a late packet is useless in a real-time conversation — this is exactly why media runs over UDP rather than TCP."
			}
		]
	},
	"ticket-booking": {
		clarifying: [
			{
				q: "Can a seat be sold twice?",
				a: "Never. That is the hard constraint, and it makes this a consistency problem rather than an availability one at the point of purchase."
			},
			{
				q: "How long is a seat held during checkout?",
				a: "Typically ten minutes. Holds must expire automatically, or a popular event slowly becomes unbookable as abandoned carts accumulate."
			},
			{
				q: "What does the traffic profile look like?",
				a: "Extreme spikes — an on-sale can be a hundred times normal load in one second. Designing for average traffic here is designing for failure."
			}
		],
		wrapUp: [
			"Seat state is a small state machine — available, held, sold — and every transition is an atomic conditional update rather than a read-then-write.",
			"Holds have an expiry and a sweeper; without both, inventory leaks and the event appears sold out while seats remain.",
			"On-sale spikes are handled by a queue in front of the booking path, so the transactional system sees a controlled rate rather than a wall.",
			"Search and seat maps are served from cache and may be slightly stale; only the purchase path is strongly consistent.",
			"With another hour: fair queueing and bot mitigation during on-sale, and the payment failure path that must release the hold."
		],
		followUps: [
			{
				q: "How do you guarantee a seat is not sold twice?",
				a: "A conditional update that only succeeds when the seat is still available — zero rows affected means someone else got it. All the concurrency safety lives in that one statement. Reading availability, deciding in application code, and then writing is the version that oversells, and it is what a queue in front cannot fix."
			},
			{
				q: "How do you survive an on-sale spike?",
				a: "By admitting users to the booking path at a controlled rate rather than letting a hundred thousand people hit the transactional system simultaneously. A virtual waiting room issues positions and lets people through as capacity allows. Everything not transactional — the seat map, event details — is cached hard, so only the actual purchases reach the consistent path."
			},
			{
				q: "A user's payment fails after the hold. What happens?",
				a: "The hold is released immediately rather than waiting for expiry, so the seat goes back on sale. The important detail is that a payment timeout is not the same as a failure: if the outcome is unknown, the hold has to persist until it is resolved, because releasing a seat that was actually paid for is a much worse outcome than a few extra minutes of unavailability."
			}
		]
	},
	"distributed-lock": {
		clarifying: [
			{
				q: "Is the lock for correctness or for efficiency?",
				a: "The crucial distinction. For efficiency — avoiding duplicate work — a best-effort lock is fine. For correctness, you need fencing tokens and should question whether a lock is the right tool at all."
			},
			{
				q: "How long is the lock held?",
				a: "As briefly as possible, and never across an unbounded operation. Long holds make lease expiry during work far more likely."
			},
			{
				q: "What happens if the holder pauses?",
				a: "A garbage-collection pause or a VM stall can exceed the lease while the holder still believes it owns the lock. This is the failure mode the whole design has to account for."
			}
		],
		wrapUp: [
			"A distributed lock is a lease, not a mutex: it expires, and the holder can be wrong about still owning it.",
			"Fencing tokens are what make it safe — the storage layer rejects writes carrying an older token, so a resurrected holder cannot corrupt state.",
			"Consensus-backed stores (etcd, ZooKeeper) give correct leases; Redis-based locks are best-effort and should be described as such.",
			"The better answer is often to avoid the lock: make the operation idempotent, or use a conditional update on the resource itself.",
			"With another hour: lease renewal and the safe hand-off when a holder is shutting down gracefully."
		],
		followUps: [
			{
				q: "Why is a lease not enough?",
				a: "Because the holder can pause — a long garbage collection, a VM migration — past its expiry, wake up believing it still holds the lock, and write. Meanwhile another process legitimately acquired it. The fix is a fencing token: each acquisition gets a monotonically increasing number, and the storage layer rejects writes carrying an older one, so the stale writer is stopped where the damage would occur."
			},
			{
				q: "Redis or etcd for locks?",
				a: "etcd or ZooKeeper when correctness matters, because leadership and leases come from a consensus protocol with a majority, so a partitioned minority cannot grant a lock. A single-instance Redis lock is fast and simple but is best-effort — it can grant the same lock twice across a failover. I would use Redis for efficiency locks and say plainly that it is not a correctness guarantee."
			},
			{
				q: "Can you avoid the lock entirely?",
				a: "Usually, and that is generally the better design. A conditional update on the resource — succeed only if the state is what I expect — provides mutual exclusion exactly where it is needed without a separate lock service. Making the operation idempotent removes the need for exclusion altogether. A distributed lock is a consistency claim that a network partition can break, so I reach for it last."
			}
		]
	}
};
/**
* Framework sections (scoping questions, wrap-up, follow-ups) layered onto the
* examples that have not been rewritten to full chapter depth, so every example
* page walks the same four-step structure.
*/
var exampleSupplements = {
	...supplementsA,
	...supplementsB,
	...supplementsC,
	...supplementsD,
	...supplementsE
};
var src = "Source 6";
var list = "https://github.com/ashishps1/awesome-system-design-resources";
var awesomeExamples = [
	{
		slug: "auth-system",
		title: "Design an Authentication System",
		source: src,
		difficulty: "foundational",
		minutes: 14,
		tags: [
			"sessions",
			"jwt",
			"sso"
		],
		companies: [
			"Auth0",
			"Okta",
			"every product with a login box"
		],
		summary: "Source 6, Easy. Prove a caller is who they claim, then keep proving it on every request without putting a password on the hot path. Sessions, JWT, refresh rotation, SSO, MFA — pick two and go deep.",
		requirements: {
			functional: [
				"Sign up / sign in with email+password and at least one SSO provider",
				"Stay signed in across devices, with sign-out-everywhere",
				"Optional MFA, password reset, API keys for machines"
			],
			nonFunctional: [
				"Login p95 < 200 ms",
				"No plaintext secrets at rest",
				"Revoke a stolen session in seconds"
			]
		},
		apis: [
			{
				method: "POST",
				path: "/v1/auth/login",
				desc: "Verify credentials, start a session, set cookies."
			},
			{
				method: "POST",
				path: "/v1/auth/refresh",
				desc: "Rotate refresh token, mint a new access token."
			},
			{
				method: "POST",
				path: "/v1/auth/logout",
				desc: "Kill this session or all sessions for the user."
			}
		],
		dataModel: [{
			entity: "User",
			fields: [
				"id",
				"email_hash",
				"password_hash (argon2id)",
				"mfa_secret_enc"
			]
		}, {
			entity: "Session",
			fields: [
				"id",
				"user_id",
				"refresh_hash",
				"device",
				"expires_at",
				"revoked_at"
			]
		}],
		architecture: [{
			heading: "Two tokens, one source of truth",
			body: ["Access token (JWT, 5–15 min, signed, not stored) rides on every API call. Refresh token (opaque, long-lived, hashed in the session store) is HttpOnly, Secure, SameSite. A stolen access token dies on its own; a stolen refresh token is rotated and the old hash is revoked."],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "c",
						label: "Client"
					},
					{
						id: "gw",
						label: "API / BFF",
						tone: "accent"
					},
					{
						id: "auth",
						label: "Auth service"
					},
					{
						id: "id",
						label: "IdP / SSO"
					}
				], [{
					id: "sess",
					label: "Session store",
					sub: "Redis"
				}, {
					id: "user",
					label: "User DB"
				}]]
			}
		}],
		deepDives: [{
			heading: "JWT vs session cookie",
			table: {
				headers: [
					"",
					"JWT access + opaque refresh",
					"Server session cookie"
				],
				rows: [
					[
						"Revoke",
						"Kill refresh; access lives until expiry unless you keep a denylist",
						"Delete the row — instant"
					],
					[
						"Scale",
						"Resource servers verify a signature, no hop",
						"Every request hits the session store (or a cache of it)"
					],
					[
						"Use when",
						"Many services, mobile, third-party APIs",
						"A single web origin, you want instant logout"
					]
				]
			},
			callout: {
				kind: "warn",
				title: "Never put secrets in the JWT",
				text: "A JWT is a postcard. Roles and user id, fine. Emails you would be sad to leak, not fine. Sign with rotating keys (kid in the header)."
			}
		}],
		tradeoffs: [{
			choice: "Opaque sessions only",
			pickWhen: "One origin, instant revoke is non-negotiable",
			cost: "Session store on every request"
		}, {
			choice: "JWT access + rotating refresh",
			pickWhen: "Many services and mobile clients",
			cost: "Access tokens linger until expiry"
		}],
		related: [
			"/hld/api-gateway",
			"/examples/distributed-lock",
			"/lld/singleton-di"
		],
		furtherReading: [{
			label: "Awesome list — auth system",
			href: "https://www.youtube.com/watch?v=uj_4vxm9u90"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "distributed-cache",
		title: "Design a Distributed Cache",
		source: src,
		difficulty: "foundational",
		minutes: 14,
		tags: [
			"redis",
			"eviction",
			"stampede"
		],
		companies: [
			"Redis",
			"Memcached",
			"CDN edges"
		],
		summary: "Source 6, Easy. A fleet of memory boxes in front of a slow store. The interview is not 'Redis exists' — it is placement, hashing, eviction, and what happens when the cache is empty all at once.",
		requirements: {
			functional: [
				"GET / SET / DEL by key",
				"TTL",
				"Optional pub/sub invalidation"
			],
			nonFunctional: [
				"Sub-ms p50 inside a zone",
				"Survive a node death without a thundering herd",
				"Memory bounded"
			]
		},
		architecture: [{
			heading: "Client-sharded memory",
			bullets: [
				"Clients (or a proxy) hash the key onto a ring of cache nodes. Consistent hashing so a restart remaps ~1/N keys, not all of them.",
				"Each node is a hash map + eviction (LRU / LFU / TTL). Persistence is optional: AOF/RDB if this cache is also a store.",
				"The origin (DB, service) is the source of truth. Cache-aside is the default: miss → load → SET. Write-through if you cannot tolerate a window of stale."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "app",
						label: "App fleet"
					},
					{
						id: "ring",
						label: "Hash ring",
						tone: "accent"
					},
					{
						id: "n",
						label: "Cache nodes"
					},
					{
						id: "db",
						label: "Origin DB"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Stampede",
			body: ["A hot key expires. Ten thousand requests miss and stampede the origin. Mitigations: probabilistic early expire, single-flight (one loader per key, others wait), slightly jittered TTLs, and a tiny stale-serve window."],
			table: {
				headers: ["Policy", "Kills"],
				rows: [
					["LRU", "Keys nobody has touched — default"],
					["LFU / TinyLFU", "One-hit wonders that would pollute LRU"],
					["TTL only", "Nothing; you will OOM. Always pair with a size cap"]
				]
			}
		}],
		tradeoffs: [{
			choice: "Cache-aside",
			pickWhen: "Most product APIs",
			cost: "App owns fill + invalidation"
		}, {
			choice: "Write-through",
			pickWhen: "Read-your-writes on the same key",
			cost: "Write latency includes the cache"
		}],
		related: [
			"/hld/caching",
			"/lld/lru-cache",
			"/playgrounds/lru-cache",
			"/hld/consistent-hashing"
		],
		furtherReading: [{
			label: "Awesome list — distributed cache",
			href: "https://www.youtube.com/watch?v=iuqZvajTOyA"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}],
		playground: "lru-cache"
	},
	{
		slug: "instagram",
		title: "Design Instagram",
		source: src,
		difficulty: "intermediate",
		minutes: 18,
		tags: [
			"media",
			"feed",
			"graph"
		],
		companies: ["Instagram", "Pixelfed"],
		summary: "Source 6, Medium. Photos are the payload; the follow graph is the fan-out problem. Upload asynchronously, serve from a CDN, and do not rebuild the news-feed chapter from scratch — call out where the media pipeline is the new hard part.",
		requirements: {
			functional: [
				"Upload a photo/video, caption, tags",
				"Follow graph, home feed, permalink",
				"Stories (24h) and likes"
			],
			nonFunctional: [
				"Upload ack in seconds, processing in the background",
				"Feed p95 < 200 ms",
				"Read-heavy, celebrity-safe"
			]
		},
		estimation: [
			{
				item: "DAU",
				calc: "Say 50M. 2 uploads/user/day → ~1.2k writes/s average, ~4k peak"
			},
			{
				item: "Read",
				calc: "Feed open 10×/day → ~6k QPS average. Cache or you are dead"
			},
			{
				item: "Media",
				calc: "2 MB × 100M new objects/day ≈ 200 TB/day into object storage + CDN"
			}
		],
		architecture: [{
			heading: "Media path vs social path",
			diagram: {
				kind: "layers",
				caption: "Two systems that share a user id",
				layers: [
					{
						title: "Client",
						items: [
							"Camera roll",
							"Feed",
							"CDN images"
						]
					},
					{
						title: "API",
						items: [
							"Upload init",
							"Graph",
							"Feed mixer"
						]
					},
					{
						title: "Async",
						items: [
							"Transcode",
							"Thumbnails",
							"Fan-out workers"
						]
					},
					{
						title: "Stores",
						items: [
							"Object store",
							"Post metadata",
							"Follow graph",
							"Feed cache"
						]
					}
				]
			},
			numbered: [
				"Client asks for a signed PUT URL, uploads bytes straight to object storage — the API never sees the blob.",
				"Worker transcodes, writes variants (feed, story, permalink), updates post metadata to 'ready'.",
				"Fan-out on write into followers' feed caches, except for celebrity accounts which stay pull-on-read."
			]
		}],
		deepDives: [{
			heading: "Follow graph",
			body: ["Directed edges in a graph store or a pair of adjacency lists (followers, following) sharded by user id. Count caches for the profile header. The news-feed example already covers hybrid fan-out; here you add: media is immutable, so the feed entry is a post id, not a blob, and the client resolves URLs from the CDN."]
		}],
		tradeoffs: [{
			choice: "Hybrid fan-out",
			pickWhen: "Anyone with > ~10k followers",
			cost: "Two code paths in the mixer"
		}, {
			choice: "All pull-on-read",
			pickWhen: "A small product",
			cost: "Home-feed latency becomes a graph query"
		}],
		related: [
			"/examples/news-feed",
			"/examples/youtube",
			"/hld/cdn",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "Awesome list — Instagram",
			href: "https://algomaster.io/learn/system-design-interviews/design-instagram"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "spotify",
		title: "Design Spotify",
		source: src,
		difficulty: "intermediate",
		minutes: 16,
		tags: [
			"streaming",
			"catalog",
			"audio"
		],
		companies: [
			"Spotify",
			"Apple Music",
			"YouTube Music"
		],
		summary: "Source 6, Medium. A licensed catalog, encrypted audio chunks, playlists, and a recommendation side-car. The player must keep playing when the network hiccups — that is the deep dive, not the social graph.",
		requirements: {
			functional: [
				"Search catalog, play a track, playlists, follow artists",
				"Offline downloads on premium",
				"Skip, seek, radio"
			],
			nonFunctional: [
				"Start playback < 1s on broadband",
				"No unencrypted files on disk",
				"License-accurate royalty events"
			]
		},
		architecture: [{
			heading: "Catalog vs bytes",
			bullets: [
				"Metadata (track, album, artist, ISRC) lives in a searchable store. This is small and precious.",
				"Audio is chunked (Ogg/AAC), encrypted, sitting in object storage behind a CDN. The client fetches a manifest, then range-GETs chunks ahead of the playhead.",
				"A license / entitlement service answers 'may this user play this track in this country right now?' before the CDN URL is minted."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "app",
						label: "Player"
					},
					{
						id: "api",
						label: "API"
					},
					{
						id: "ent",
						label: "Entitlement",
						tone: "accent"
					},
					{
						id: "cdn",
						label: "Audio CDN"
					}
				], [
					{
						id: "cat",
						label: "Catalog"
					},
					{
						id: "rec",
						label: "Reco"
					},
					{
						id: "ev",
						label: "Play events"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Keep the music going",
			body: ["Prefetch the next 15–30s. On cell networks, drop to a lower bitrate ladder (not video-scale, but the same idea). Offline: encrypted blobs + a device-bound key in the secure enclave; a periodic online check stops a ripped library from living forever."]
		}],
		tradeoffs: [{
			choice: "CDN-only audio",
			pickWhen: "You are not in the ISP-box business",
			cost: "Egress bill; cache miss = origin"
		}, {
			choice: "P2P assist (old Spotify)",
			pickWhen: "Egress was the company-killer",
			cost: "NAT, cheating, complexity — they left it"
		}],
		related: [
			"/examples/youtube",
			"/examples/netflix",
			"/hld/cdn"
		],
		furtherReading: [{
			label: "Awesome list — Spotify",
			href: "https://algomaster.io/learn/system-design-interviews/design-spotify"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "netflix",
		title: "Design Netflix",
		source: src,
		difficulty: "intermediate",
		minutes: 16,
		tags: [
			"vod",
			"cdn",
			"encoding"
		],
		companies: [
			"Netflix",
			"Disney+",
			"Prime Video"
		],
		summary: "Source 6, Medium. YouTube is UGC and a firehose of uploads. Netflix is a small catalog, enormous concurrency on opening night, and a CDN they own (Open Connect). Encode once, sit close to ISPs, remember the playhead.",
		requirements: {
			functional: ["Browse, resume, play, profiles, downloads", "Personalized home row"],
			nonFunctional: [
				"Opening-night millions of concurrent viewers",
				"Start in < 2s, no buffering on a decent link",
				"DRM"
			]
		},
		architecture: [{
			heading: "Control plane vs data plane",
			table: {
				headers: ["Plane", "Job"],
				rows: [
					["Control", "Auth, catalog, bookmarks, ratings, A/B — ordinary stateless APIs + a viewing-history store"],
					["Data", "Encoded ladders in Open Connect appliances inside ISPs, plus a public CDN fallback"],
					["Offline encode", "Every title → many bitrates × codecs × languages. A job queue, not a user-facing API"]
				]
			},
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "Client",
						items: [
							"Player",
							"ABR",
							"DRM license"
						]
					},
					{
						title: "Control",
						items: [
							"API",
							"Catalog",
							"History",
							"Reco"
						]
					},
					{
						title: "Data",
						items: [
							"Open Connect",
							"Public CDN",
							"Origin store"
						]
					}
				]
			}
		}],
		deepDives: [{
			heading: "Adaptive bitrate",
			body: ["The player picks a rung of the ladder from recent throughput. Segments are 2–4s so a bad guess recovers quickly. Opening night: pre-position the title on the boxes in the ISPs you care about. That is the answer to 'how does Netflix survive a Stranger Things premiere'."]
		}],
		tradeoffs: [{
			choice: "Own the ISP boxes",
			pickWhen: "You are the peak traffic of the internet",
			cost: "Hardware, ISP deals, ops"
		}, {
			choice: "Rent a CDN",
			pickWhen: "A smaller catalog or a new region",
			cost: "Noisy neighbors, less control of placement"
		}],
		related: [
			"/examples/youtube",
			"/hld/cdn",
			"/examples/job-scheduler"
		],
		furtherReading: [{
			label: "Awesome list — Netflix",
			href: "https://www.youtube.com/watch?v=psQzyFfsUGU"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "job-scheduler",
		title: "Design a Distributed Job Scheduler",
		source: src,
		difficulty: "intermediate",
		minutes: 16,
		tags: [
			"cron",
			"leases",
			"queues"
		],
		companies: [
			"Airflow",
			"Quartz",
			"k8s CronJob",
			"Sidekiq"
		],
		summary: "Source 6, Medium. Cron that survives more than one box. Partition the schedule, lease the next due job, run it exactly-once-enough, retry with backoff, and never let two workers bill the same customer.",
		requirements: {
			functional: [
				"One-shot and recurring jobs",
				"At / cron / every-N",
				"Cancel, pause, inspect last run"
			],
			nonFunctional: [
				"No missed runs across a node death",
				"At-least-once delivery with idempotent handlers",
				"Thousands of due jobs per second"
			]
		},
		apis: [{
			method: "POST",
			path: "/v1/jobs",
			desc: "Register a job with schedule + handler + payload."
		}, {
			method: "POST",
			path: "/v1/jobs/:id/cancel",
			desc: "Stop future runs; in-flight is best-effort."
		}],
		architecture: [{
			heading: "The due-index",
			numbered: [
				"Store jobs in a DB. Secondary index: (shard, next_run_at). Shard by job id.",
				"Dispatchers poll their shard: SELECT … WHERE next_run_at <= now FOR UPDATE SKIP LOCKED (or a Redis ZSET of due times).",
				"On pick: write a lease (owner, expiry), enqueue to a worker queue, bump next_run_at for recurring jobs.",
				"Workers run, report status. Lease expiry → another dispatcher may reclaim."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "api",
						label: "API"
					},
					{
						id: "db",
						label: "Schedule DB",
						tone: "accent"
					},
					{
						id: "disp",
						label: "Dispatchers"
					},
					{
						id: "q",
						label: "Work queue"
					},
					{
						id: "w",
						label: "Workers"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Exactly once is a lie",
			body: ["A worker can finish the side effect and die before ack. Design handlers to be idempotent (idempotency key = run id) and accept at-least-once. For money, pair with a ledger. SKIP LOCKED (Postgres) is the one trick that makes polling schedulers safe."],
			callout: {
				kind: "insight",
				title: "Do not cron-storm",
				text: "A million jobs at midnight: jitter the next_run_at, and cap dispatcher claim batch size so you do not melt the queue."
			}
		}],
		tradeoffs: [{
			choice: "Polling + SKIP LOCKED",
			pickWhen: "You already have Postgres",
			cost: "Poll delay, DB load"
		}, {
			choice: "Per-job timer in memory (k8s)",
			pickWhen: "Job count fits in the control plane",
			cost: "Does not span 10M jobs"
		}],
		related: [
			"/hld/message-queues",
			"/examples/distributed-lock",
			"/hld/idempotency"
		],
		furtherReading: [{
			label: "Awesome list — job scheduler",
			href: "https://blog.algomaster.io/p/design-a-distributed-job-scheduler"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "tinder",
		title: "Design Tinder",
		source: src,
		difficulty: "intermediate",
		minutes: 15,
		tags: [
			"geo",
			"matching",
			"graph"
		],
		companies: [
			"Tinder",
			"Hinge",
			"Bumble"
		],
		summary: "Source 6, Medium. Not Yelp. People move, preferences are a vector, and a match is a mutual like — a tiny, precious edge. Geo for the deck, a graph for likes, a chat once it is mutual.",
		requirements: {
			functional: [
				"A deck of nearby candidates",
				"Like / pass",
				"Match on mutual like, then chat",
				"Filters: age, distance, prefs"
			],
			nonFunctional: [
				"Deck in < 200 ms",
				"No 'already passed' repeats for a while",
				"Location stale by minutes is fine"
			]
		},
		architecture: [{
			heading: "Deck, then graph",
			bullets: [
				"Location: coarse geohash → candidate set, filtered by prefs, ranked by a model (activity, distance, prior likes).",
				"Like/pass writes an edge. A match is when the reverse edge exists — check on write, then open a chat channel.",
				"The 'already seen' set is a bloom filter or a time-partitioned list per user so the deck does not repeat."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "loc",
						label: "Location ping"
					},
					{
						id: "geo",
						label: "Geo index",
						tone: "accent"
					},
					{
						id: "rank",
						label: "Ranker"
					},
					{
						id: "deck",
						label: "Deck"
					}
				], [{
					id: "like",
					label: "Like graph"
				}, {
					id: "chat",
					label: "Chat"
				}]]
			}
		}],
		deepDives: [{
			heading: "Double-write match",
			body: ["Like(A→B) must be atomic with 'if B→A exists, create match'. A transaction on (min(A,B), max(A,B)) as the lock key, or a compare-and-set on the pair. Then notify both through the chat/presence path. Do not poll."]
		}],
		tradeoffs: [{
			choice: "Precompute decks",
			pickWhen: "Read-heavy evenings",
			cost: "Stale when someone moves city"
		}, {
			choice: "Compute on swipe",
			pickWhen: "Prefs change a lot",
			cost: "Heavier reads"
		}],
		related: [
			"/examples/proximity",
			"/examples/chat",
			"/examples/nearby-friends"
		],
		furtherReading: [{
			label: "Awesome list — Tinder",
			href: "https://www.youtube.com/watch?v=tndzLznxq40"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "google-search",
		title: "Design Google Search",
		source: src,
		difficulty: "intermediate",
		minutes: 18,
		tags: [
			"index",
			"rank",
			"crawl"
		],
		companies: [
			"Google",
			"Bing",
			"Elastic"
		],
		summary: "Source 6, Medium. Four machines: crawl, invert, rank, serve. Do not design PageRank on the whiteboard for thirty minutes — name it, then deep-dive serving a query from a sharded inverted index under a tight latency SLO.",
		requirements: {
			functional: [
				"Keyword query → ranked URLs + snippets",
				"Fresh enough for news",
				"Spell / autocomplete (reuse that example)"
			],
			nonFunctional: [
				"p95 < 200 ms worldwide",
				"Index of tens of billions of pages",
				"Crawl politely"
			]
		},
		architecture: [{
			heading: "The four boxes",
			numbered: [
				"Crawler: frontier queue, DNS cache, politeness per host, canonicalization, the web-crawler example.",
				"Indexer: documents → tokens → posting lists (doc id, tf, positions). Sharded by term.",
				"Ranker: BM25 + signals (pagerank, freshness, locale). Offline scores stored next to the postings.",
				"Serving: query → tokenize → fetch postings → intersect / WAND → top-k → snippets."
			],
			diagram: {
				kind: "layers",
				layers: [{
					title: "Online",
					items: [
						"Query front end",
						"Index shards",
						"Snippet cache"
					]
				}, {
					title: "Offline",
					items: [
						"Crawler",
						"Indexer",
						"Link graph / PageRank"
					]
				}]
			}
		}],
		deepDives: [{
			heading: "Serving a query",
			body: ["Broadcast the query to index shards (term-sharded or doc-sharded). Term-sharded: rare terms hit one shard, intersection needs scatter-gather. Doc-sharded: every shard does a local top-k, the mixer merges. Most web search is doc-sharded because it parallelizes evenly."],
			callout: {
				kind: "insight",
				title: "Snippets",
				text: "You need positions or a stored field per doc to highlight. That is why posting lists keep offsets, and why the document store is not optional."
			}
		}],
		tradeoffs: [{
			choice: "Doc-sharded index",
			pickWhen: "Even load, simple mixer",
			cost: "Every query touches every shard (or a random subset)"
		}, {
			choice: "Term-sharded index",
			pickWhen: "Enormous vocabulary, rare terms",
			cost: "Hot terms, harder intersection"
		}],
		related: [
			"/examples/web-crawler",
			"/examples/autocomplete",
			"/hld/sharding"
		],
		furtherReading: [{
			label: "Awesome list — Google Search",
			href: "https://www.youtube.com/watch?v=CeGtqouT8eA"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "uber",
		title: "Design Uber",
		source: src,
		difficulty: "advanced",
		minutes: 18,
		tags: [
			"dispatch",
			"geo",
			"matching"
		],
		companies: [
			"Uber",
			"Lyft",
			"Grab",
			"Ola"
		],
		summary: "Source 6, Hard. Live location of drivers, a matching engine that does not ping-pong the same car, ETAs, and surge as a pricing valve — not a moral essay. Deep-dive dispatch.",
		requirements: {
			functional: [
				"Rider requests a trip",
				"Match a driver, show ETA and live location",
				"Turn-by-turn, fare, ratings"
			],
			nonFunctional: [
				"Match in a few seconds",
				"Location every ~1–4s while on trip",
				"City-scale partitions"
			]
		},
		estimation: [{
			item: "City",
			calc: "50k drivers, 200k concurrent riders peak. Location pings 50k/2s ≈ 25k writes/s for that city"
		}],
		architecture: [{
			heading: "City shard + dispatch",
			bullets: [
				"Partition by city (or a large geohash). A driver is in one ring. Cross-city is rare and can be slow.",
				"Location stream: driver app → ingest → in-memory geo index (Redis GEO / custom) for that city. The disk copy is for analytics, not matching.",
				"Request: cover the pickup with cells, pull idle drivers, score (ETA, rating, destination, battery), offer to the top one with a short timeout, fall down the list."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "r",
						label: "Rider"
					},
					{
						id: "api",
						label: "Trip API"
					},
					{
						id: "m",
						label: "Matcher",
						tone: "accent"
					},
					{
						id: "d",
						label: "Driver"
					}
				], [
					{
						id: "geo",
						label: "Live geo index"
					},
					{
						id: "map",
						label: "ETA / maps"
					},
					{
						id: "pay",
						label: "Fare"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Do not double-dispatch",
			body: ["The offer is a lease on the driver ('pending', 10s). Compare-and-set from idle → pending → on_trip. Two matchers racing is the bug; the city shard + a lock on driver id fixes it. Surge is a multiplier computed from (demand in cell / idle supply) over a short window — a cache, not a transaction."]
		}],
		tradeoffs: [{
			choice: "Offer one driver at a time",
			pickWhen: "You want acceptance quality",
			cost: "Slower match"
		}, {
			choice: "Broadcast to N",
			pickWhen: "Supply is thin",
			cost: "First-accept races, unhappy drivers"
		}],
		related: [
			"/examples/proximity",
			"/examples/food-delivery",
			"/examples/google-maps",
			"/hld/websockets"
		],
		furtherReading: [{
			label: "Awesome list — Uber",
			href: "https://www.youtube.com/watch?v=umWABit-wbk"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "food-delivery",
		title: "Design a Food Delivery App",
		source: src,
		difficulty: "advanced",
		minutes: 16,
		tags: [
			"marketplace",
			"dispatch",
			"logistics"
		],
		companies: [
			"DoorDash",
			"Uber Eats",
			"Swiggy",
			"Zomato"
		],
		summary: "Source 6, Hard. Three sides: diner, merchant, courier. The new hard part versus Uber is the merchant's prep time — you cannot dispatch a courier at request time if the burger is 18 minutes out.",
		requirements: {
			functional: [
				"Browse nearby menus, cart, pay, track",
				"Merchant accepts and marks ready",
				"Courier pickup → dropoff"
			],
			nonFunctional: ["Hot food, not just a short route", "Menu reads are cacheable; orders are not"]
		},
		architecture: [{
			heading: "Order as a state machine",
			numbered: [
				"Place order → payment hold → merchant accept (timeout → cancel / re-route).",
				"Estimate ready_at = now + quoted prep. Dispatch the courier so they arrive near ready_at, not now.",
				"Pickup, dropoff, capture payment, tip. Each transition is an event on the order log."
			],
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "Diner",
						items: [
							"Menu CDN",
							"Cart",
							"Track"
						]
					},
					{
						title: "Merchant",
						items: ["Tablet", "Prep clock"]
					},
					{
						title: "Courier",
						items: [
							"Offer",
							"Nav",
							"Proof of drop"
						]
					},
					{
						title: "Platform",
						items: [
							"Order log",
							"Dispatch",
							"Payments"
						]
					}
				]
			}
		}],
		deepDives: [{
			heading: "Delayed dispatch",
			body: ["Naive Uber-style 'match now' parks couriers in the restaurant. Score candidates on (time-to-restaurant vs remaining prep), stacked orders (same merchant, nearby dropoffs), and courier destination. Batching two orders onto one courier is the margin."]
		}],
		tradeoffs: [{
			choice: "Dispatch late",
			pickWhen: "Prep time is trustworthy",
			cost: "A late courier if the kitchen lies"
		}, {
			choice: "Dispatch early + wait",
			pickWhen: "You cannot trust prep quotes",
			cost: "Courier utilization"
		}],
		related: [
			"/examples/uber",
			"/examples/payment",
			"/examples/hotel-reservation"
		],
		furtherReading: [{
			label: "Awesome list — DoorDash",
			href: "https://www.youtube.com/watch?v=iRhSAR3ldTw"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "google-docs",
		title: "Design Google Docs",
		source: src,
		difficulty: "advanced",
		minutes: 18,
		tags: [
			"crdt",
			"ot",
			"collaboration"
		],
		companies: [
			"Google Docs",
			"Figma",
			"Notion"
		],
		summary: "Source 6, Hard. Concurrent edits on one document without a single 'save' button. Operational Transform (Docs historically) or CRDTs (Figma, many new tools). Presence, snapshots, offline — pick OT-vs-CRDT as the deep dive.",
		requirements: {
			functional: [
				"Many cursors, live characters, comments",
				"Share / ACL",
				"Offline then merge",
				"Version history"
			],
			nonFunctional: [
				"Keystroke feels local (< 50 ms)",
				"Eventual identical docs",
				"A 100-page doc does not download every time"
			]
		},
		architecture: [{
			heading: "A document is a stream",
			bullets: [
				"Client applies the keystroke locally (optimistic), sends an op to the doc server.",
				"Doc server is the sequencer for that doc id (sticky). It transforms / orders ops, persists the log, broadcasts to other peers on the websocket.",
				"Snapshots every N ops so a late joiner does not replay the whole history. History / undo is the log."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "a",
						label: "Client A"
					},
					{
						id: "s",
						label: "Doc server",
						sub: "sticky",
						tone: "accent"
					},
					{
						id: "b",
						label: "Client B"
					}
				], [
					{
						id: "log",
						label: "Op log"
					},
					{
						id: "snap",
						label: "Snapshots"
					},
					{
						id: "acl",
						label: "ACL"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "OT vs CRDT",
			table: {
				headers: [
					"",
					"Operational Transform",
					"CRDT"
				],
				rows: [
					[
						"Idea",
						"A central sequencer rewrites concurrent ops against each other",
						"Math that converges without a center"
					],
					[
						"Docs",
						"Google Docs, older Office Online",
						"Figma, Automerge, Yjs, many local-first apps"
					],
					[
						"Cost",
						"Server is a bottleneck per doc; transform code is famously subtle",
						"Metadata bloat; need compaction"
					]
				]
			},
			callout: {
				kind: "note",
				title: "Interview move",
				text: "Say you would put a sequencer on doc id (consistent hash), keep the log in a DB, snapshot to object storage. Then pick OT if you want a Google-Docs-shaped answer, CRDT if you want offline-first."
			}
		}],
		tradeoffs: [{
			choice: "OT + sequencer",
			pickWhen: "Always-online, Google-Docs-like",
			cost: "Server availability is the doc's availability"
		}, {
			choice: "CRDT",
			pickWhen: "Offline / P2P / local-first",
			cost: "Tombstones, compaction, larger payloads"
		}],
		related: [
			"/examples/zoom",
			"/hld/websockets",
			"/hld/consistency"
		],
		furtherReading: [{
			label: "Awesome list — Google Docs",
			href: "https://www.youtube.com/watch?v=2auwirNBvGg"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "zoom",
		title: "Design Zoom",
		source: src,
		difficulty: "advanced",
		minutes: 16,
		tags: [
			"webrtc",
			"sfu",
			"realtime"
		],
		companies: [
			"Zoom",
			"Meet",
			"Teams"
		],
		summary: "Source 6, Hard. Real-time audio/video for 2 to a few thousand. The key word is SFU: Selective Forwarding Unit — the server forwards packets, it does not mix every tile into one video (MCU) except as a fallback.",
		requirements: {
			functional: [
				"Join a meeting, A/V, screen share, chat",
				"Mute, gallery, recording",
				"Waiting room, host controls"
			],
			nonFunctional: [
				"Mouth-to-ear < 150–200 ms",
				"Survive home NATs",
				"A 1k webinar is not 1k full meshes"
			]
		},
		architecture: [{
			heading: "Signal vs media",
			bullets: [
				"Signaling (join, SDP, mute, roster) is a small websocket/JSON API. Easy. Not the hard part.",
				"Media: WebRTC to an SFU in a nearby region. The SFU receives each sender's simulcast (2–3 bitrates) and forwards the appropriate rung to each receiver.",
				"NAT: STUN first, TURN (relay) if both sides are symmetric-NAT. Budget TURN — it is the expensive path."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "a",
						label: "Client A"
					},
					{
						id: "sfu",
						label: "SFU",
						tone: "accent"
					},
					{
						id: "b",
						label: "Client B"
					}
				], [
					{
						id: "sig",
						label: "Signaling"
					},
					{
						id: "turn",
						label: "TURN"
					},
					{
						id: "rec",
						label: "Recorder"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Why not mesh, why not MCU",
			table: {
				headers: ["Topology", "When"],
				rows: [
					["Mesh", "2–3 people, no server media cost"],
					["SFU (default)", "Meetings. Server CPU is packet-forward, not encode"],
					["MCU", "Phone dial-in, very weak clients, composed recordings"]
				]
			},
			body: ["Recording is a hidden client of the SFU (or a compositor). Chat piggybacks on signaling. For a webinar, most 'participants' are receive-only — that is how 1k works."]
		}],
		tradeoffs: [{
			choice: "SFU + simulcast",
			pickWhen: "Almost every meeting product",
			cost: "Uplink carries extra rungs"
		}, {
			choice: "SVC (one stream, layers)",
			pickWhen: "You control the encoder",
			cost: "Harder, fewer client codecs"
		}],
		related: [
			"/examples/chat",
			"/examples/google-docs",
			"/hld/websockets"
		],
		furtherReading: [{
			label: "Awesome list — Zoom",
			href: "https://www.youtube.com/watch?v=G32ThJakeHk"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "ticket-booking",
		title: "Design a Ticket Booking System",
		source: src,
		difficulty: "advanced",
		minutes: 15,
		tags: [
			"inventory",
			"holds",
			"flash sale"
		],
		companies: [
			"BookMyShow",
			"Ticketmaster",
			"IRCTC"
		],
		summary: "Source 6, Hard. A finite seat map, a flash crowd, and the rule that two people cannot own seat 14F. Holds with TTL, a wait-queue in front of checkout, and a ledger so a crash does not un-sell a sold seat.",
		requirements: {
			functional: ["Browse events, pick seats, pay, issue ticket", "Hold seats for a few minutes at checkout"],
			nonFunctional: [
				"No double-sell",
				"On-sale minute must not melt the origin",
				"Idempotent payment"
			]
		},
		architecture: [{
			heading: "Hold, then pay, then commit",
			numbered: [
				"On-sale: a waiting-room queue (virtual) so only N checkouts run at once.",
				"Select seats → write holds (seat_id, user, expires_at) with a unique constraint on seat_id. TTL worker releases.",
				"Payment with an idempotency key. On success, hold → sold, mint a ticket id, email.",
				"The seat map the UI draws is a cache; the constraint in the hold table is the truth."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "q",
						label: "Waiting room"
					},
					{
						id: "map",
						label: "Seat map cache"
					},
					{
						id: "hold",
						label: "Hold table",
						tone: "accent"
					},
					{
						id: "pay",
						label: "Payment"
					},
					{
						id: "tix",
						label: "Ticket"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "The unique constraint is the design",
			body: ["Do not 'check then insert'. INSERT hold … ON CONFLICT seat_id DO NOTHING and see if you won. Same energy as the hotel-reservation example; here the unit is a seat, not a night, and the crowd is spikier — hence the waiting room."]
		}],
		tradeoffs: [{
			choice: "Hard unique holds",
			pickWhen: "Assigned seating",
			cost: "Hot rows on popular seats"
		}, {
			choice: "GA inventory counter",
			pickWhen: "General admission",
			cost: "No seat map; still needs atomic decrement"
		}],
		related: [
			"/examples/hotel-reservation",
			"/examples/payment",
			"/hld/idempotency"
		],
		furtherReading: [{
			label: "Awesome list — BookMyShow",
			href: "https://www.youtube.com/watch?v=lBAwJgoO3Ek"
		}, {
			label: "Source 6 on GitHub",
			href: list
		}]
	},
	{
		slug: "distributed-lock",
		title: "Design a Distributed Locking Service",
		source: src,
		difficulty: "advanced",
		minutes: 16,
		tags: [
			"consensus",
			"leases",
			"chubby"
		],
		companies: [
			"Chubby",
			"ZooKeeper",
			"etcd",
			"Consul"
		],
		summary: "Source 6, Hard. Coarse-grained locks for leaders, not for every row. Leases so a dead holder does not hold forever, and fencing tokens so a pause-then-resume holder cannot write after losing the lock. This is Chubby, not Redis SETNX.",
		requirements: {
			functional: [
				"Acquire / renew / release a named lock",
				"Ephemeral nodes / watches for membership",
				"Read small config files"
			],
			nonFunctional: [
				"A handful of locks, held for minutes to hours",
				"Survive a minority of replica deaths",
				"Fencing against split brains"
			]
		},
		architecture: [{
			heading: "A tiny replicated filesystem",
			body: ["A handful of replicas run Raft/Paxos. One leader handles writes. A lock is a file with contents = {holder, fencing_token, lease_expiry}. Acquire is 'create if not exists' or 'compare-and-set if expired'. Clients must heartbeat to renew."],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "c",
						label: "Clients"
					},
					{
						id: "l",
						label: "Lock leader",
						tone: "accent"
					},
					{
						id: "r",
						label: "Raft replicas"
					}
				]]
			},
			table: {
				headers: ["Primitive", "Use"],
				rows: [
					["Lock / lease", "Primary election, shard owner"],
					["Fencing token (monotonic)", "Storage rejects lower tokens from a zombie"],
					["Watch", "Cache invalidation, membership"]
				]
			}
		}],
		deepDives: [{
			heading: "Why SETNX is not enough",
			body: ["Redis SET NX EX is a single node (or a failover that can lose the last write). A GC pause can expire the key while the holder is still working. The holder then writes. The fix Kleppmann wrote up: the lock service hands out a monotonic fencing token; the data store enforces 'token ≥ last token' on every write. Mention this out loud."],
			callout: {
				kind: "warn",
				title: "Do not lock every row",
				text: "Chubby holds thousands of locks, not billions. Per-row mutual exclusion belongs in the database (transactions, compare-and-set), not in a lock service."
			}
		}],
		tradeoffs: [{
			choice: "etcd / ZooKeeper",
			pickWhen: "You need watches and membership too",
			cost: "Ops, session semantics"
		}, {
			choice: "DB advisory locks",
			pickWhen: "One primary database, short critical sections",
			cost: "Tied to that DB's availability"
		}],
		related: [
			"/hld/consensus",
			"/hld/availability",
			"/examples/kv-store",
			"/examples/job-scheduler"
		],
		furtherReading: [
			{
				label: "How to do distributed locking — Kleppmann",
				href: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html"
			},
			{
				label: "Chubby paper",
				href: "https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf"
			},
			{
				label: "Source 6 on GitHub",
				href: list
			}
		]
	}
];
var vol1Examples = [
	{
		slug: "scale-to-millions",
		title: "Scale from Zero to Millions of Users",
		source: "Volume 1",
		chapter: 1,
		difficulty: "foundational",
		minutes: 14,
		tags: ["framework", "web stack"],
		companies: ["Any web product"],
		summary: "The opening chapter of Alex Xu Volume 1 is a tour of the standard web stack: one server, then split, load balance, cache, replica, CDN, queue, and shard. Use it as the skeleton under every later design.",
		requirements: {
			functional: ["Users can read and write the product's core objects", "Sessions survive more than one app box"],
			nonFunctional: [
				"Grow from 1 to 10M users without a rewrite",
				"Survive a single-AZ app failure",
				"Keep p95 latency interactive"
			]
		},
		architecture: [{
			heading: "Walk the ladder out loud",
			numbered: [
				"Single host: web + DB. Fine for a demo.",
				"Split DB. Take backups. Tune indexes.",
				"Load balancer + two app boxes. Sessions in Redis or JWT.",
				"Read replicas. Cache-aside for hot keys.",
				"CDN for static. Object store for uploads.",
				"Message queue for email, thumbnails, fan-out.",
				"Shard when the primary's write QPS or working set saturates."
			],
			diagram: {
				kind: "layers",
				caption: "Volume 1, chapter 1 — the stack you keep redrawing",
				layers: [
					{
						title: "Edge",
						items: [
							"DNS",
							"CDN",
							"Load balancer"
						]
					},
					{
						title: "Stateless",
						items: ["Web / API fleet"]
					},
					{
						title: "Stateful fast",
						items: ["Redis cache / sessions"]
					},
					{
						title: "Async",
						items: ["Queue + workers"]
					},
					{
						title: "Source of truth",
						items: [
							"Primary DB",
							"Replicas",
							"Shards",
							"Object storage"
						]
					}
				]
			}
		}],
		deepDives: [{
			heading: "The interview use of this chapter",
			body: ["You almost never design 'scale from zero' as the whole question. You use it as a checklist: did I put a cache on the hot path? Did I say how we fail over the primary? Did I keep compute stateless?"]
		}],
		tradeoffs: [{
			choice: "Vertical first",
			pickWhen: "Early product, strong transactions, small team",
			cost: "Ceiling and blast radius"
		}, {
			choice: "Shard early",
			pickWhen: "Write-heavy, obvious partition key (tenant, city)",
			cost: "Joins and ops forever"
		}],
		related: [
			"/hld/scaling",
			"/hld/caching",
			"/hld/load-balancing"
		],
		furtherReading: [{
			label: "roadmap.sh system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "interview-framework",
		title: "A Framework for System Design Interviews",
		source: "Volume 1",
		chapter: 3,
		difficulty: "foundational",
		minutes: 10,
		tags: ["interview"],
		companies: ["FAANG-style loops"],
		summary: "Volume 1 chapter 3 (and Volume 2's opening) is a four-step script: clarify, sketch, deep-dive, wrap. Every example in Lattice is written in that order so you can reuse the muscle memory.",
		requirements: {
			functional: ["Agree on use cases and who the users are", "Agree on what is out of scope"],
			nonFunctional: ["QPS, latency, consistency, availability, cost"]
		},
		architecture: [{
			heading: "The four steps",
			numbered: [
				"Understand and scope (3–8 min). Users, features, scale, SLA. Ask numbers. Write them down.",
				"High-level design (8–15 min). Boxes and arrows. APIs. Data stores. Get buy-in before diving.",
				"Deep dive (15–25 min). The two or three hard parts: the feed fan-out, the hash ring, the payment ledger.",
				"Wrap (3–5 min). Bottlenecks, failure modes, what you would do with another hour."
			],
			callout: {
				kind: "insight",
				title: "Buy-in",
				text: "The most common failure is drawing for 25 minutes on a design the interviewer did not want. Narrate, pause, ask 'does this match what you had in mind?'"
			}
		}],
		deepDives: [{
			heading: "Questions that buy you the right problem",
			bullets: [
				"Read-heavy or write-heavy?",
				"How fresh must reads be?",
				"Single region or global?",
				"Peak vs average QPS?",
				"What happens if we lose 60 seconds of writes?"
			]
		}],
		tradeoffs: [{
			choice: "Go deep on one subsystem",
			pickWhen: "45–60 min interviews",
			cost: "Thin coverage of the rest — say so"
		}, {
			choice: "Survey everything",
			pickWhen: "Junior loops, or the interviewer wants breadth",
			cost: "Looks shallow if you never pick a hard part"
		}],
		related: [
			"/hld/estimation",
			"/examples/rate-limiter",
			"/examples/url-shortener"
		],
		furtherReading: [{
			label: "roadmap.sh interview questions",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "rate-limiter",
		title: "Design a Rate Limiter",
		source: "Volume 1",
		chapter: 4,
		difficulty: "intermediate",
		minutes: 18,
		tags: ["redis", "gateway"],
		companies: [
			"Stripe",
			"Twitter",
			"AWS API Gateway",
			"Lyft"
		],
		summary: "Alex Xu Volume 1, chapter 4. Throttle clients so no neighbor starves the API. Token bucket is the default algorithm; Redis holds counters; a rules service holds limits; rejected callers get HTTP 429 plus headers.",
		requirements: {
			functional: [
				"Limit by user, IP, or API key, with different rules per endpoint and tier",
				"Return 429 with Retry-After and remaining quota headers",
				"Rules change without a deploy"
			],
			nonFunctional: [
				"Adds < few ms on the hot path",
				"Accurate enough across a fleet of app servers",
				"Survives Redis blips without melting origin"
			]
		},
		estimation: [{
			item: "Peak QPS",
			calc: "If the API is 100k QPS, the limiter sees 100k decisions/sec"
		}, {
			item: "State",
			calc: "One bucket per key. 10M active keys × ~50 B ≈ 0.5 GB in Redis — small"
		}],
		apis: [{
			method: "ANY",
			path: "/…",
			desc: "Middleware wraps existing APIs. Decision is allow or 429."
		}, {
			method: "GET",
			path: "/internal/rules",
			desc: "Workers pull the rule set into cache."
		}],
		architecture: [{
			heading: "High-level path",
			body: ["Client hits the rate-limiting middleware (or API gateway). Middleware loads the rule for (key, endpoint), reads/updates the bucket in Redis, and either forwards or rejects. Workers pull rules from disk/config into memory so the hot path is not hitting a database."],
			diagram: {
				kind: "flow",
				caption: "Volume 1 figure-style path: client → middleware ⇄ Redis → API",
				rows: [[
					{
						id: "c",
						label: "Client"
					},
					{
						id: "mw",
						label: "Limiter MW",
						tone: "accent"
					},
					{
						id: "api",
						label: "API fleet",
						tone: "ok"
					}
				], [{
					id: "rules",
					label: "Rules cache"
				}, {
					id: "redis",
					label: "Redis",
					sub: "Lua / INCR"
				}]]
			}
		}],
		deepDives: [{
			heading: "Algorithm choice",
			table: {
				headers: ["Pick", "When"],
				rows: [
					["Token bucket", "Public APIs that should allow short bursts (Stripe, AWS)"],
					["Leaky bucket", "Downstream cannot burst — SMS, some payment processors"],
					["Fixed window", "Internal, coarse limits; watch the boundary 2× spike"],
					["Sliding log", "Need precision and can afford memory"],
					["Sliding counter", "Good precision, O(1) memory — a common compromise"]
				]
			}
		}, {
			heading: "Race conditions",
			body: ["Two app boxes reading 1 token and both decrementing is the classic bug. Fix: Redis INCR for counters, or a Lua script that refills and consumes atomically for token bucket. Fail-open vs fail-closed if Redis is down is a product call — mention both."],
			callout: {
				kind: "insight",
				title: "Open the lab",
				text: "Fire a burst at the boundary of a fixed window, then the same burst at a token bucket. The pictures match the five-algorithm playgrounds used in LLD teaching sites."
			}
		}],
		tradeoffs: [{
			choice: "Central Redis",
			pickWhen: "You need one global limit",
			cost: "Extra hop, a dependency"
		}, {
			choice: "Local token buckets + periodic sync",
			pickWhen: "Ultra-low latency, approximate is OK",
			cost: "Over-allow across boxes"
		}],
		related: [
			"/playgrounds/rate-limiter",
			"/hld/rate-limiting",
			"/lld/rate-limiter"
		],
		furtherReading: [{
			label: "LLD rate-limiter playground",
			href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html"
		}],
		playground: "rate-limiter"
	},
	{
		slug: "consistent-hashing",
		title: "Design Consistent Hashing",
		source: "Volume 1",
		chapter: 5,
		difficulty: "intermediate",
		minutes: 14,
		tags: ["hash ring", "sharding"],
		companies: [
			"Amazon Dynamo",
			"Cassandra",
			"CDNs",
			"Discord"
		],
		summary: "Volume 1 chapter 5. A hash ring plus virtual nodes so adding a cache or database host remaps only a slice of keys. This is the partitioning backbone of the key-value store chapter that follows.",
		requirements: {
			functional: [
				"Map key → server",
				"Add/remove a server with minimal remapping",
				"Balance load across heterogeneous boxes"
			],
			nonFunctional: ["O(log n) lookup", "No central rebalance coordinator required"]
		},
		architecture: [{
			heading: "Ring",
			numbered: [
				"Hash servers onto a circle (many virtual nodes each).",
				"Hash the key onto the same circle.",
				"Owner is the first vnode clockwise.",
				"On join, the new vnode steals the arc from its successor. Everyone else is untouched."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "k",
						label: "key"
					},
					{
						id: "h",
						label: "hash ring",
						tone: "accent"
					},
					{
						id: "s",
						label: "server / vnode"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Virtual nodes",
			body: ["One point per server is too coarse — a lucky hash puts a huge arc on a small box. Hundreds of vnodes per physical host smear the ring. Bigger hosts get more vnodes (weights)."]
		}, {
			heading: "Lookups in code",
			body: ["Keep sorted vnode hashes; binary search for the successor. In production, libraries also copy keys to the next N-1 clockwise neighbors for replication (Dynamo)."]
		}],
		tradeoffs: [{
			choice: "More vnodes",
			pickWhen: "Load looks spiky",
			cost: "Larger membership map, more remaps on a host fail"
		}, {
			choice: "Modulo hashing",
			pickWhen: "N is fixed forever (it isn't)",
			cost: "Near-total remap on change"
		}],
		related: [
			"/playgrounds/consistent-hashing",
			"/hld/consistent-hashing",
			"/examples/kv-store"
		],
		furtherReading: [{
			label: "Dynamo paper §4.2",
			href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"
		}],
		playground: "consistent-hashing"
	},
	{
		slug: "kv-store",
		title: "Design a Key-Value Store",
		source: "Volume 1",
		chapter: 6,
		difficulty: "advanced",
		minutes: 22,
		tags: ["dynamo", "distributed"],
		companies: [
			"Amazon DynamoDB",
			"Cassandra",
			"Riak"
		],
		summary: "Volume 1 chapter 6 is a Dynamo-class AP store: consistent hashing, replication, sloppy quorum, gossip, Merkle trees, and hinted handoff. It is the hardest 'pure infrastructure' question in the first book.",
		requirements: {
			functional: [
				"put(key, value), get(key)",
				"Tunable consistency",
				"Survive disk and node loss"
			],
			nonFunctional: [
				"Million+ QPS class",
				"Single-digit ms gets on hot keys",
				"Always writable (AP lean)"
			]
		},
		architecture: [{
			heading: "High-level",
			body: ["A client (or coordinator node) hashes the key onto the ring, writes to N successors, waits for W acks, and returns. Reads ask R replicas and repair on mismatch (read repair, Merkle anti-entropy)."],
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "API",
						items: ["Coordinator / smart client"]
					},
					{
						title: "Membership",
						items: [
							"Hash ring",
							"Gossip",
							"Failure detector"
						]
					},
					{
						title: "Replication",
						items: [
							"N copies",
							"Quorum R/W",
							"Hinted handoff"
						]
					},
					{
						title: "Storage engine",
						items: [
							"Commit log",
							"Memtable",
							"SSTables",
							"Compaction"
						]
					}
				]
			}
		}],
		deepDives: [{
			heading: "Versioning",
			body: ["Concurrent writes need a story: last-write-wins (clocks lie), vector clocks (Dynamo), or CRDTs. Vector clocks let the client, not the store, merge siblings — shopping carts being the textbook case."]
		}, {
			heading: "LSM tree",
			body: ["Writes append to a commit log and an in-memory memtable. When the memtable fills, it flushes to an immutable SSTable. Reads check memtable then newest SSTables, using Bloom filters to skip files. Compaction merges and drops tombstones."]
		}],
		tradeoffs: [
			{
				choice: "W=N, R=1",
				pickWhen: "Read-heavy, can wait on writes",
				cost: "Writes fail if any replica is down"
			},
			{
				choice: "W=1, R=1",
				pickWhen: "Availability over correctness",
				cost: "Easy to lose or split values"
			},
			{
				choice: "CP leader store instead",
				pickWhen: "Need linearizable counters / locks",
				cost: "You are no longer designing Dynamo"
			}
		],
		related: [
			"/hld/quorum",
			"/hld/consistent-hashing",
			"/hld/bloom-filters",
			"/playgrounds/quorum"
		],
		furtherReading: [{
			label: "Amazon Dynamo paper",
			href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf"
		}],
		playground: "quorum"
	},
	{
		slug: "unique-id",
		title: "Design a Unique ID Generator",
		source: "Volume 1",
		chapter: 7,
		difficulty: "intermediate",
		minutes: 14,
		tags: ["snowflake"],
		companies: [
			"Twitter / X",
			"Instagram",
			"Discord"
		],
		summary: "Volume 1 chapter 7. 64-bit, roughly time-ordered IDs, unique across datacenters, no coordination on the hot path. Twitter Snowflake is the default answer; ticket servers and UUIDs are the foils.",
		requirements: {
			functional: [
				"IDs unique globally",
				"Fit in 64 bits",
				"Roughly sortable by time",
				"Generate > 10k/s per machine"
			],
			nonFunctional: ["Available across regions", "Survive clock drift with a defined policy"]
		},
		architecture: [{
			heading: "Options you should name",
			table: {
				headers: [
					"Approach",
					"Pros",
					"Cons"
				],
				rows: [
					[
						"UUID v4",
						"No coord, 128 bit",
						"Big, not time-ordered, bad as clustered PK"
					],
					[
						"DB auto-increment",
						"Simple, ordered",
						"Single writer, hard to shard"
					],
					[
						"Ticket server (Flickr)",
						"Compact",
						"Bottleneck, SPOF unless ranged"
					],
					[
						"Snowflake",
						"64-bit, sortable, 1k workers",
						"Clock, worker-id assignment"
					]
				]
			},
			diagram: {
				kind: "bits",
				caption: "Twitter Snowflake — 64 bits",
				fields: [
					{
						label: "sign",
						bits: 1,
						note: "0"
					},
					{
						label: "timestamp",
						bits: 41,
						note: "~69y"
					},
					{
						label: "dc",
						bits: 5,
						note: "0–31"
					},
					{
						label: "worker",
						bits: 5,
						note: "0–31"
					},
					{
						label: "sequence",
						bits: 12,
						note: "4096/ms"
					}
				]
			}
		}],
		deepDives: [{
			heading: "Clock went backwards",
			body: ["Refuse to mint until the clock catches up, or increment a logical sequence while holding the last timestamp. Never emit a duplicate. NTP can jump; use a monotonic source when the OS gives you one."]
		}],
		tradeoffs: [{
			choice: "Snowflake",
			pickWhen: "Need compact, sortable IDs at high QPS",
			cost: "Worker ID ops, clock care"
		}, {
			choice: "UUID v7",
			pickWhen: "You can afford 128 bits and want less ops",
			cost: "Index bloat vs bigint"
		}],
		related: [
			"/playgrounds/snowflake",
			"/hld/estimation",
			"/examples/url-shortener"
		],
		furtherReading: [{
			label: "Snowflake ID",
			href: "https://en.wikipedia.org/wiki/Snowflake_ID"
		}],
		playground: "snowflake"
	},
	{
		slug: "url-shortener",
		title: "Design a URL Shortener",
		source: "Volume 1",
		chapter: 8,
		difficulty: "foundational",
		minutes: 16,
		tags: ["bit.ly", "base62"],
		companies: [
			"Bitly",
			"TinyURL",
			"X t.co"
		],
		summary: "Volume 1 chapter 8. Tiny write volume, huge read volume, a 301/302 redirect, and a compact ID in base62. The data model is almost one table; the interesting bits are ID generation, hashing vs counter, and analytics.",
		requirements: {
			functional: [
				"shorten(long) → short",
				"redirect(short) → long",
				"optional expiry, custom alias, click counts"
			],
			nonFunctional: [
				"Redirect p99 of a few tens of ms",
				"Read-heavy (often 10:1 or more)",
				"Years of retention"
			]
		},
		estimation: [
			{
				item: "Write QPS",
				calc: "100M new URLs/day ≈ 1.2k writes/s (peak ~3k)"
			},
			{
				item: "Read QPS",
				calc: "10× writes ≈ 12k/s (peak ~30k)"
			},
			{
				item: "IDs",
				calc: "62^7 ≈ 3.5e12 — 7 chars covers 100M/day for decades"
			},
			{
				item: "Storage",
				calc: "365B records × ~500 B ≈ 180 TB plus replicas"
			}
		],
		apis: [
			{
				method: "POST",
				path: "/api/v1/links",
				desc: "{ longUrl, customAlias?, ttlDays? } → { shortUrl }"
			},
			{
				method: "GET",
				path: "/:code",
				desc: "302 (or 301) to the long URL"
			},
			{
				method: "GET",
				path: "/api/v1/links/:code/stats",
				desc: "Clicks, referrers, days"
			}
		],
		dataModel: [{
			entity: "Link",
			fields: [
				"id (pk)",
				"code (unique)",
				"long_url",
				"created_at",
				"expires_at",
				"owner_id"
			]
		}, {
			entity: "Click (optional, batched)",
			fields: [
				"code",
				"ts",
				"country",
				"ua"
			]
		}],
		architecture: [{
			heading: "Happy path",
			numbered: [
				"POST: validate URL, mint a unique code, persist, return https://host/code.",
				"GET: cache lookup by code, else DB, then 302. 301 is cache-friendlier but painful if the mapping ever changes.",
				"Analytics: fire-and-forget to a queue; never block the redirect."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "u",
						label: "User"
					},
					{
						id: "lb",
						label: "LB"
					},
					{
						id: "api",
						label: "API"
					},
					{
						id: "cache",
						label: "Redis",
						tone: "accent"
					},
					{
						id: "db",
						label: "DB"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "How to mint the code",
			table: {
				headers: ["Method", "Note"],
				rows: [
					["Hash long URL (MD5) then base62, take 7 chars", "Collisions; same URL → same code (sometimes wanted)"],
					["Counter + base62 (ticket / Snowflake)", "No collision, not deterministic from the URL"],
					["Pre-generated unused codes in a pool", "Low latency writes, workers refill the pool"]
				]
			}
		}],
		tradeoffs: [{
			choice: "302",
			pickWhen: "Mappings can change; you want every click",
			cost: "Less CDN cache"
		}, {
			choice: "301",
			pickWhen: "Mappings are eternal",
			cost: "Browsers cache; stats undercount"
		}],
		related: [
			"/playgrounds/url-shortener",
			"/examples/unique-id",
			"/hld/caching"
		],
		furtherReading: [{
			label: "roadmap.sh — URL shortener",
			href: "https://roadmap.sh/questions/system-design"
		}],
		playground: "url-shortener"
	},
	{
		slug: "web-crawler",
		title: "Design a Web Crawler",
		source: "Volume 1",
		chapter: 9,
		difficulty: "intermediate",
		minutes: 16,
		tags: ["search", "bloom"],
		companies: [
			"Google",
			"Bing",
			"Common Crawl"
		],
		summary: "Volume 1 chapter 9. A polite, distributed URL frontier, DNS, fetcher, renderer (maybe), parser, and duplicate URL / content detection. Bloom filters keep the 'have we seen this URL?' set in memory.",
		requirements: {
			functional: [
				"Start from seed URLs",
				"Respect robots.txt and politeness per host",
				"Extract links, store documents",
				"Detect duplicates"
			],
			nonFunctional: [
				"Billions of pages",
				"Freshness for hot sites",
				"No thundering a small origin"
			]
		},
		architecture: [{
			heading: "Pipeline",
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "f",
						label: "URL frontier",
						tone: "accent"
					},
					{
						id: "d",
						label: "DNS"
					},
					{
						id: "ft",
						label: "Fetcher"
					},
					{
						id: "p",
						label: "Parser"
					},
					{
						id: "s",
						label: "Store"
					}
				]]
			},
			numbered: [
				"Frontier is a priority queue + per-host queues so one host cannot monopolize.",
				"Seen-URL set: Bloom filter then canonicalization then a durable key store.",
				"Content fingerprint (simhash) catches mirrors.",
				"Workers are stateless; the frontier and seen-set are shared."
			]
		}],
		deepDives: [{
			heading: "Politeness and freshness",
			body: ["One concurrent connection per host is a starting rule; back off on 429/5xx. Recrawl frequency is a function of change rate and PageRank-like importance — news every minute, a parked domain every month."]
		}],
		tradeoffs: [{
			choice: "Headless render",
			pickWhen: "JS-heavy web",
			cost: "Orders of magnitude slower"
		}, {
			choice: "Bloom-only seen set",
			pickWhen: "RAM is tight",
			cost: "False positives skip new pages"
		}],
		related: [
			"/hld/bloom-filters",
			"/hld/message-queues",
			"/examples/autocomplete"
		],
		furtherReading: [{
			label: "Mercator / Google crawler papers (ideas)",
			href: "https://en.wikipedia.org/wiki/Web_crawler"
		}]
	},
	{
		slug: "notification",
		title: "Design a Notification System",
		source: "Volume 1",
		chapter: 10,
		difficulty: "intermediate",
		minutes: 14,
		tags: ["fan-out", "queues"],
		companies: [
			"Uber",
			"Slack",
			"every consumer app"
		],
		summary: "Volume 1 chapter 10. One service, many channels (push, email, SMS, in-app). Ingest events, template them, honor preferences, rate-limit per user and per channel, and retry with a DLQ.",
		requirements: {
			functional: [
				"Trigger from other services",
				"User preferences and quiet hours",
				"Push / email / SMS / in-app",
				"Delivery receipts"
			],
			nonFunctional: [
				"Millions/day, bursty",
				"At-least-once with idempotency keys",
				"Channel provider outages isolated"
			]
		},
		apis: [{
			method: "POST",
			path: "/v1/notifications",
			desc: "{ userId, templateId, data, channels? } → { id }"
		}, {
			method: "POST",
			path: "/v1/preferences",
			desc: "Mute, channel opt-in"
		}],
		architecture: [{
			heading: "Pipeline",
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "p",
						label: "Producers"
					},
					{
						id: "gw",
						label: "Notif API"
					},
					{
						id: "q",
						label: "Queue",
						tone: "accent"
					},
					{
						id: "w",
						label: "Workers"
					},
					{
						id: "ch",
						label: "FCM / SES / Twilio"
					}
				]]
			},
			bullets: [
				"A gateway authenticates internal callers and enqueues.",
				"Workers expand templates, check preferences, then call a channel adapter.",
				"Each channel has its own queue so a slow SMS provider does not stall push.",
				"Idempotency key = (user, template, dedupe window) to survive retries."
			]
		}],
		deepDives: [{
			heading: "Rate limits go both ways",
			body: ["Providers throttle you (Twilio). You also throttle yourself so a buggy loop cannot SMS a user 400 times. Token bucket per (user, channel)."]
		}],
		tradeoffs: [{
			choice: "One topic, many consumer groups",
			pickWhen: "Same event fans out to several channels",
			cost: "Harder per-channel backpressure"
		}, {
			choice: "Queue per channel",
			pickWhen: "Isolation matters",
			cost: "More moving parts"
		}],
		related: [
			"/hld/message-queues",
			"/hld/rate-limiting",
			"/lld/factory"
		],
		furtherReading: [{
			label: "roadmap.sh — notification system",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "news-feed",
		title: "Design a News Feed",
		source: "Volume 1",
		chapter: 11,
		difficulty: "advanced",
		minutes: 18,
		tags: ["fan-out", "facebook"],
		companies: [
			"Facebook",
			"Instagram",
			"X"
		],
		summary: "Volume 1 chapter 11. Fan-out on write vs fan-out on read is the whole plot. Celebrities break write-fanout; quiet users make read-fanout slow. Hybrid is what production does.",
		requirements: {
			functional: [
				"Publish a post",
				"Read a personalized feed",
				"Follow / unfollow",
				"Media in posts"
			],
			nonFunctional: [
				"Read-heavy",
				"p99 feed load under a few hundred ms",
				"Eventual consistency OK for likes"
			]
		},
		estimation: [{
			item: "DAU",
			calc: "300M, 2 posts/day → ~7k writes/s average, tens of k peak"
		}, {
			item: "Feed reads",
			calc: "A few opens/day/user → 10k–100k reads/s class"
		}],
		architecture: [
			{
				heading: "Fan-out on write (push)",
				body: ["On publish, enqueue a job that inserts the post ID onto each follower's precomputed feed (Redis list / Cassandra). Reads are a cheap lrange. Famous users with 50M followers cannot do this — the write amplification is the product."]
			},
			{
				heading: "Fan-out on read (pull)",
				body: ["On read, fetch IDs from the people you follow, merge-sort, fill bodies from a post store, rank. Always-correct, slower, hammered when a celebrity posts and millions open the app."]
			},
			{
				heading: "Hybrid",
				body: ["Push for normal users. Pull for celebrity IDs at read time. Cache the merged page. This is the answer interviewers want after you show you know both extremes."],
				diagram: {
					kind: "flow",
					rows: [[
						{
							id: "pub",
							label: "Publish API"
						},
						{
							id: "fan",
							label: "Fan-out workers",
							tone: "accent"
						},
						{
							id: "feed",
							label: "Feed cache"
						},
						{
							id: "read",
							label: "Feed API"
						}
					]]
				}
			}
		],
		deepDives: [{
			heading: "Ranking",
			body: ["First version: time. Later: ML ranker on a candidate set (already-followed posts + some recommendations). Ranking is a separate service; do not stuff it into the write path in a 45-minute interview."]
		}],
		tradeoffs: [{
			choice: "Push",
			pickWhen: "Bounded follower counts",
			cost: "Celebrity writes, storage × followers"
		}, {
			choice: "Pull",
			pickWhen: "Celebrity graph, or a new product",
			cost: "Read latency, thundering herds"
		}],
		related: [
			"/examples/chat",
			"/hld/caching",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "roadmap.sh — social feed",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "chat",
		title: "Design a Chat System",
		source: "Volume 1",
		chapter: 12,
		difficulty: "advanced",
		minutes: 18,
		tags: ["websocket", "presence"],
		companies: [
			"WhatsApp",
			"Slack",
			"Messenger"
		],
		summary: "Volume 1 chapter 12. 1:1 and group chat, online presence, and delivery receipts. WebSockets for the online path, a message store that can take writes, and a connection service that knows which box holds each user.",
		requirements: {
			functional: [
				"1:1 and group messages",
				"Online/offline presence",
				"Delivery and read receipts",
				"Unread counts",
				"Media"
			],
			nonFunctional: [
				"Low latency for online users",
				"Store years of history",
				"Exactly-once *effects* via client-generated IDs"
			]
		},
		dataModel: [
			{
				entity: "Message",
				fields: [
					"id",
					"channel_id",
					"sender_id",
					"body",
					"ts",
					"seq"
				]
			},
			{
				entity: "Channel",
				fields: [
					"id",
					"type (dm|group)",
					"members"
				]
			},
			{
				entity: "Receipt",
				fields: [
					"message_id",
					"user_id",
					"delivered_at",
					"read_at"
				]
			}
		],
		architecture: [{
			heading: "Online path",
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "a",
						label: "Alice WS"
					},
					{
						id: "sa",
						label: "Chat server A"
					},
					{
						id: "bus",
						label: "Pub/sub",
						tone: "accent"
					},
					{
						id: "sb",
						label: "Chat server B"
					},
					{
						id: "b",
						label: "Bob WS"
					}
				]]
			},
			bullets: [
				"Each user has a session on one chat server. A registry (Redis) maps user → server.",
				"Alice's server persists the message, then publishes to the channel. Bob's server is subscribed and pushes over the socket.",
				"If Bob is offline, the message waits in the store; he pulls on reconnect (or a push notification wakes him)."
			]
		}],
		deepDives: [{
			heading: "Group chat fan-out",
			body: ["Small groups: store one copy, fan-out to online members via pub/sub. Huge groups (broadcast channels): do not write per-member copies; members pull from a log, like a feed."]
		}, {
			heading: "Ordering",
			body: ["Per-channel sequence numbers assigned by a single writer (the channel's shard). Client IDs make retries idempotent. Casual 'last-write-wins' is not enough for chat."]
		}],
		tradeoffs: [{
			choice: "Cassandra / wide-column for messages",
			pickWhen: "Huge sequential writes, range by channel+time",
			cost: "Weaker ad-hoc queries"
		}, {
			choice: "Postgres per shard",
			pickWhen: "Smaller scale, richer queries",
			cost: "Operational sharding"
		}],
		related: [
			"/hld/websockets",
			"/examples/nearby-friends",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "roadmap.sh — chat",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "autocomplete",
		title: "Design Search Autocomplete",
		source: "Volume 1",
		chapter: 13,
		difficulty: "intermediate",
		minutes: 14,
		tags: ["trie", "search"],
		companies: [
			"Google",
			"Amazon",
			"YouTube"
		],
		summary: "Volume 1 chapter 13. Type-ahead: given a prefix, return the top-k queries. A trie (or a prefix index) in memory at the edge, rebuilt from logs, with caching on hot prefixes.",
		requirements: {
			functional: [
				"Top-k completions for a prefix",
				"Personalization optional",
				"Handle typos at the next layer"
			],
			nonFunctional: [
				"< 100 ms, often < 50",
				"High QPS on one-letter prefixes",
				"Update popularity daily or faster"
			]
		},
		architecture: [{
			heading: "Offline + online",
			bullets: [
				"Offline: aggregate search logs → (query, frequency). Build a trie or a sorted prefix table. Ship a snapshot to servers.",
				"Online: at each keystroke, look up the prefix, return top-k. Cache results for 'a', 'an', 'and'…",
				"A trie node can keep a small heap of top-k under that prefix so you do not walk the world at query time."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "log",
						label: "Search logs"
					},
					{
						id: "agg",
						label: "Aggregator"
					},
					{
						id: "trie",
						label: "Trie snapshot",
						tone: "accent"
					},
					{
						id: "api",
						label: "Autocomplete API"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Scale tricks",
			body: ["Do not store every unique query. Cap at a frequency threshold. Shard the trie by first character (or two). Gather 's' on different hosts than 't'. Analytic / Elasticsearch systems work too; a trie is the expected whiteboard answer."]
		}],
		tradeoffs: [{
			choice: "In-memory trie",
			pickWhen: "Ultra-low latency, bounded dictionary",
			cost: "RAM, rebuilds"
		}, {
			choice: "Search engine prefix fields",
			pickWhen: "Already have ES, fuzzy needed",
			cost: "Latency, cluster ops"
		}],
		related: [
			"/hld/caching",
			"/hld/cdn",
			"/examples/web-crawler"
		],
		furtherReading: [{
			label: "roadmap.sh — autocomplete",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "youtube",
		title: "Design YouTube",
		source: "Volume 1",
		chapter: 14,
		difficulty: "advanced",
		minutes: 20,
		tags: ["video", "cdn"],
		companies: [
			"YouTube",
			"Netflix",
			"Vimeo"
		],
		summary: "Volume 1 chapter 14. Upload, transcode into many bitrates, store blobs, stream via CDN with adaptive bitrate (HLS/DASH), plus a thin metadata and recommendation plane.",
		requirements: {
			functional: [
				"Upload video",
				"Process into renditions",
				"Play with ABR",
				"Thumbnails, titles, comments",
				"Like / subscribe"
			],
			nonFunctional: [
				"Petabytes stored",
				"Start playback fast worldwide",
				"Encode is slow and async"
			]
		},
		estimation: [{
			item: "Storage",
			calc: "500 hours uploaded/min class × many renditions is PB–EB with retention. Interview: show you know original + transcodes dominate."
		}, {
			item: "Bandwidth",
			calc: "Playback is the cost center — hence CDN, not origin."
		}],
		architecture: [{
			heading: "Two planes",
			diagram: {
				kind: "layers",
				layers: [{
					title: "Control (cheap)",
					items: [
						"Upload API",
						"Metadata SQL",
						"Comments",
						"Recommendations"
					]
				}, {
					title: "Data (expensive)",
					items: [
						"Object storage",
						"Transcoder workers",
						"CDN POPs",
						"ABR player"
					]
				}]
			},
			numbered: [
				"Client uploads to an object store (pre-signed URL), not through the app server.",
				"A queue kicks transcoders. They emit 360p…4K plus a manifest.",
				"Playback: client fetches the manifest from a nearby POP, then segments. ABR picks a bitrate from buffer health."
			]
		}],
		deepDives: [{
			heading: "Hot videos",
			body: ["A tiny fraction of objects get almost all views. CDN hit rate is the design. Pre-warm POPs on predicted viral videos. Origin shield protects storage from misses."]
		}],
		tradeoffs: [{
			choice: "More renditions",
			pickWhen: "Global, mobile-heavy audience",
			cost: "Encode CPU and storage"
		}, {
			choice: "Pre-signed direct upload",
			pickWhen: "Large files",
			cost: "You need completion callbacks and virus scan workers"
		}],
		related: [
			"/hld/cdn",
			"/hld/message-queues",
			"/examples/object-storage"
		],
		furtherReading: [{
			label: "roadmap.sh — video streaming",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "google-drive",
		title: "Design Google Drive",
		source: "Volume 1",
		chapter: 15,
		difficulty: "advanced",
		minutes: 18,
		tags: ["storage", "sync"],
		companies: [
			"Google Drive",
			"Dropbox",
			"OneDrive"
		],
		summary: "Volume 1 chapter 15. Metadata vs block storage, chunked uploads, dedup, notification of changes, and conflict stories for offline clients. Close cousin of Volume 2's object storage, with a sync client on top.",
		requirements: {
			functional: [
				"Upload / download / folder tree",
				"Share with ACLs",
				"Sync across devices",
				"Version history"
			],
			nonFunctional: [
				"Huge files, flaky networks",
				"Dedup identical blocks",
				"Strong metadata, eventual file bits OK"
			]
		},
		architecture: [{
			heading: "Split metadata from bytes",
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "c",
						label: "Client"
					},
					{
						id: "m",
						label: "Metadata service",
						sub: "SQL",
						tone: "accent"
					},
					{
						id: "b",
						label: "Block store",
						sub: "S3-like"
					}
				]]
			},
			bullets: [
				"A file is a list of block hashes. Blocks live in object storage. Metadata (tree, ACLs, versions) lives in a strongly consistent DB.",
				"Upload: split into ~4MB chunks, hash, skip chunks the store already has, then commit a new file version.",
				"Clients long-poll or subscribe to a notification service for the namespace they care about."
			]
		}],
		deepDives: [{
			heading: "Conflicts",
			body: ["Two offline edits: last-writer-wins is hostile. Keep both versions and surface a conflict, or CRDT for docs (that is Google Docs, a different design — Operational Transform / CRDT — mentioned in the Drive interview as a later layer)."]
		}],
		tradeoffs: [{
			choice: "Smaller chunks",
			pickWhen: "Delta-friendly, bad networks",
			cost: "More metadata, more requests"
		}, {
			choice: "Whole-file store",
			pickWhen: "Tiny files, simpler",
			cost: "Re-upload everything on one byte change"
		}],
		related: [
			"/examples/object-storage",
			"/hld/consistency",
			"/lld/command"
		],
		furtherReading: [{
			label: "roadmap.sh — Dropbox / Drive",
			href: "https://roadmap.sh/questions/system-design"
		}]
	}
];
var vol2Examples = [
	{
		slug: "proximity",
		title: "Design a Proximity Service",
		source: "Volume 2",
		chapter: 1,
		difficulty: "intermediate",
		minutes: 16,
		tags: ["geo", "yelp"],
		companies: [
			"Yelp",
			"Google Maps",
			"Foursquare"
		],
		summary: "Volume 2 chapter 1. 'Restaurants near me' is a geofence query. Quadtrees, geohashes, or an S2/H3 index turn 'points within radius' into a small set of cells you can fetch from a sharded store.",
		requirements: {
			functional: [
				"Search businesses by lat/lng + radius + filters",
				"Add/update a business location",
				"Rank by distance and rating"
			],
			nonFunctional: [
				"Read-heavy",
				"Stale location of a shop by minutes is OK",
				"Worldwide coverage"
			]
		},
		architecture: [{
			heading: "Index the earth",
			table: {
				headers: ["Index", "Idea"],
				rows: [
					["Geohash", "Base32 encoding of a bounding box. Prefix = coarser cell. Neighbors are a bit fiddly at edges."],
					["Quadtree", "Split space into four until a cell holds few enough points."],
					["Google S2 / H3", "Spherical cells. Production default for serious geo."]
				]
			},
			numbered: [
				"On write, compute the cell IDs that cover the point (and maybe parents) and insert.",
				"On read, cover the search circle with cells, fetch their contents, filter true distance, rank.",
				"Shard by coarse cell so a city lives together."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "q",
						label: "lat,lng,r"
					},
					{
						id: "c",
						label: "Cover with cells",
						tone: "accent"
					},
					{
						id: "db",
						label: "Shard lookup"
					},
					{
						id: "f",
						label: "Filter + rank"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Redis GEO",
			body: ["GEOADD / GEORADIUS is a fine v1 for a city. It does not replace a worldwide sharded index, but it is a legitimate stepping stone in an interview."]
		}],
		tradeoffs: [{
			choice: "Coarser cells",
			pickWhen: "You want fewer round-trips",
			cost: "Over-fetch, more filtering"
		}, {
			choice: "Finer cells",
			pickWhen: "Dense downtown",
			cost: "More cells to cover a radius"
		}],
		related: [
			"/examples/nearby-friends",
			"/examples/google-maps",
			"/hld/sharding"
		],
		furtherReading: [{
			label: "Geohash",
			href: "https://en.wikipedia.org/wiki/Geohash"
		}]
	},
	{
		slug: "nearby-friends",
		title: "Design Nearby Friends",
		source: "Volume 2",
		chapter: 2,
		difficulty: "advanced",
		minutes: 16,
		tags: ["geo", "realtime"],
		companies: [
			"Snap Map",
			"Find My",
			"WhatsApp Live Location"
		],
		summary: "Volume 2 chapter 2. Unlike Yelp, the points move. Periodic location pings, a realtime index, and push when a friend enters your radius. Presence + geo + fan-out.",
		requirements: {
			functional: [
				"Friends see each other when nearby",
				"Opt-in, with recency",
				"Battery-aware updates"
			],
			nonFunctional: ["Updates every few seconds when moving", "Privacy: only friends, not the world"]
		},
		architecture: [{
			heading: "Moving points",
			bullets: [
				"Client samples location on a duty cycle (faster when moving).",
				"A location service writes the latest point into a geo index (Redis GEO or a cell → user map) and into a 'last seen' store.",
				"A matcher computes nearby friends: intersection of (people in nearby cells) and (friend list). Friend lists are small — compute on read or cache per user.",
				"Push via the chat/presence channel, not a new TCP."
			]
		}],
		deepDives: [{
			heading: "Load",
			body: ["If 100M users ping every 30s you have ~3M writes/s. That is why you duty-cycle, batch, and only index users who opted in and are online. Most designs keep 'active sharers' as a much smaller set."]
		}],
		tradeoffs: [{
			choice: "Update on movement threshold",
			pickWhen: "Battery matters",
			cost: "Stale dots"
		}, {
			choice: "Fixed 5s pings",
			pickWhen: "Safety use cases",
			cost: "Battery and write QPS"
		}],
		related: [
			"/examples/proximity",
			"/examples/chat",
			"/hld/websockets"
		],
		furtherReading: [{
			label: "Volume 2 nearby friends (concept)",
			href: "https://blog.bytebytego.com/p/system-design-interview-books-volume"
		}]
	},
	{
		slug: "google-maps",
		title: "Design Google Maps",
		source: "Volume 2",
		chapter: 3,
		difficulty: "advanced",
		minutes: 18,
		tags: ["geo", "routing"],
		companies: [
			"Google Maps",
			"Apple Maps",
			"Waze"
		],
		summary: "Volume 2 chapter 3. Tiles for rendering, a road graph for routing, traffic as live edge weights, and geocoding. Do not design all of it — pick tiles + routing as the deep dive.",
		requirements: {
			functional: [
				"Render maps at many zooms",
				"Navigate A → B with ETAs",
				"Search places",
				"Live traffic"
			],
			nonFunctional: [
				"Tile hits from a CDN",
				"Routing under a second for city-scale",
				"Traffic freshness of minutes"
			]
		},
		architecture: [{
			heading: "Tiles vs graph",
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "Client",
						items: [
							"Viewport",
							"Tile cache",
							"Nav SDK"
						]
					},
					{
						title: "Render path",
						items: [
							"Tile service",
							"CDN",
							"Vector tiles"
						]
					},
					{
						title: "Routing path",
						items: [
							"Road graph",
							"Contraction hierarchies / A*",
							"Traffic aggregator"
						]
					}
				]
			},
			bullets: [
				"Vector tiles (not giant PNGs) keep style on the client and shrink bytes.",
				"Routing is shortest path on a graph whose edge weights mix distance, speed limit, and live traffic.",
				"Preprocess (contraction hierarchies, hub labels) so a cross-city query does not walk every road."
			]
		}],
		deepDives: [{
			heading: "Traffic",
			body: ["Probe data from phones, smoothed, written as edge deltas. Routing service reads a recent snapshot; it cannot call a live system per edge per query."]
		}],
		tradeoffs: [{
			choice: "Vector tiles",
			pickWhen: "Interactive, themeable maps",
			cost: "Heavier client"
		}, {
			choice: "Raster tiles",
			pickWhen: "Simple clients",
			cost: "One image per style per zoom"
		}],
		related: [
			"/examples/proximity",
			"/hld/cdn",
			"/hld/estimation"
		],
		furtherReading: [{
			label: "OpenStreetMap + OSRM (ideas)",
			href: "https://project-osrm.org/"
		}]
	},
	{
		slug: "distributed-mq",
		title: "Design a Distributed Message Queue",
		source: "Volume 2",
		chapter: 4,
		difficulty: "advanced",
		minutes: 20,
		tags: ["kafka"],
		companies: [
			"Kafka",
			"Pulsar",
			"SQS",
			"Kinesis"
		],
		summary: "Volume 2 chapter 4. Topics, partitions, replicas, a controller, consumer groups, and the ISR. If you can draw Kafka from memory you can design half the async systems in both books.",
		requirements: {
			functional: [
				"Publish to a topic",
				"Consume with a group",
				"Replay from an offset",
				"Order per partition key"
			],
			nonFunctional: [
				"High throughput",
				"Durable (acks=all)",
				"Horizontal scale via partitions"
			]
		},
		architecture: [{
			heading: "Core",
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "Clients",
						items: ["Producer", "Consumer group"]
					},
					{
						title: "Control",
						items: ["Controller / coordinator", "Partition assignment"]
					},
					{
						title: "Data",
						items: ["Partition leader + ISR replicas", "Segment files on disk"]
					}
				]
			},
			bullets: [
				"A topic is a log split into partitions. The partition is the unit of ordering and parallelism.",
				"Producers hash a key to a partition. Leaders append sequentially — this is why Kafka is fast.",
				"Replicas in the ISR must ack before the record is committed if acks=all.",
				"A consumer group: each partition is owned by at most one member of the group. Many groups can independently replay."
			]
		}],
		deepDives: [{
			heading: "What to say about loss",
			body: ["acks=0 fire-and-forget. acks=1 leader only — lost if the leader dies before replica fetch. acks=all + min.insync.replicas is the production default for money-shaped data. Consumers are at-least-once unless you also do idempotent processing / transactions."]
		}],
		tradeoffs: [{
			choice: "More partitions",
			pickWhen: "Need more consumer parallelism",
			cost: "More files, longer recovery, slower elections"
		}, {
			choice: "SQS-style competing queue",
			pickWhen: "No replay, simpler ops",
			cost: "No independent consumer groups"
		}],
		related: [
			"/hld/message-queues",
			"/examples/ad-click",
			"/examples/notification"
		],
		furtherReading: [{
			label: "Kafka design (official)",
			href: "https://kafka.apache.org/documentation/#design"
		}]
	},
	{
		slug: "metrics",
		title: "Design a Metrics Monitoring System",
		source: "Volume 2",
		chapter: 5,
		difficulty: "intermediate",
		minutes: 16,
		tags: ["observability", "tsdb"],
		companies: [
			"Prometheus",
			"Datadog",
			"Google Borgmon"
		],
		summary: "Volume 2 chapter 5. Collect time series, write them cheaply, query them, alert on them, down-sample them. Cardinality is the villain.",
		requirements: {
			functional: [
				"Ingest metrics from services",
				"Graph and query",
				"Alert on rules",
				"Dashboards"
			],
			nonFunctional: [
				"Millions of active series",
				"Alert lag of seconds to a minute",
				"Retain raw briefly, rollups for years"
			]
		},
		architecture: [{
			heading: "Pipeline",
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "a",
						label: "Apps / exporters"
					},
					{
						id: "c",
						label: "Collectors",
						tone: "accent"
					},
					{
						id: "ts",
						label: "TSDB"
					},
					{
						id: "q",
						label: "Query + Alert"
					}
				]]
			},
			bullets: [
				"Push (Datadog agent) vs pull (Prometheus scrape). Pull is simpler for k8s; push is simpler for short-lived jobs (need a gateway).",
				"Storage: compressed columns of (timestamp, value) keyed by series ID. Labels → series ID is the expensive map.",
				"Downsample: 10s raw for 24h, 1m for 15d, 5m for a year."
			]
		}],
		deepDives: [{
			heading: "Cardinality",
			body: ["A label like user_id on a counter explodes the series count and will page you. Bound label keys. This is the deep-dive interviewers want."]
		}],
		tradeoffs: [{
			choice: "Pull scrape",
			pickWhen: "Long-lived, discoverable targets",
			cost: "Ephemeral jobs need a push gateway"
		}, {
			choice: "Push",
			pickWhen: "Clients behind NAT, lambdas",
			cost: "You own backpressure"
		}],
		related: [
			"/hld/observability",
			"/examples/ad-click",
			"/hld/sharding"
		],
		furtherReading: [{
			label: "Prometheus storage",
			href: "https://prometheus.io/docs/prometheus/latest/storage/"
		}]
	},
	{
		slug: "ad-click",
		title: "Design Ad Click Event Aggregation",
		source: "Volume 2",
		chapter: 6,
		difficulty: "advanced",
		minutes: 16,
		tags: ["streaming", "ads"],
		companies: [
			"Google Ads",
			"Meta Ads",
			"any DSP"
		],
		summary: "Volume 2 chapter 6. Billions of impression and click events, aggregated along many dimensions (campaign, country, hour) with exactly-once money semantics and fraud filters.",
		requirements: {
			functional: [
				"Ingest impression/click events",
				"Aggregate by campaign / time / geo",
				"Support late events",
				"Fraud filter"
			],
			nonFunctional: [
				"Exactly-once billing effects",
				"Minutes of freshness for dashboards",
				"Hours of retention for raw, years for rollups"
			]
		},
		architecture: [{
			heading: "Lambda / streaming",
			bullets: [
				"Events land on a log (Kafka) partitioned by ad_id or campaign_id.",
				"A streaming job (Flink / Spark Structured Streaming) windows by event time with allowed lateness, keyed aggregates, and sink to a serving store (Cassandra / Bigtable / Druid).",
				"A batch job overnight reconciles — the money path should not trust only the stream.",
				"Idempotency: event IDs in a seen-set (Bloom + store) before incrementing counters."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "e",
						label: "Events"
					},
					{
						id: "k",
						label: "Kafka"
					},
					{
						id: "s",
						label: "Stream agg",
						tone: "accent"
					},
					{
						id: "sv",
						label: "Serving OLAP"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Event time vs processing time",
			body: ["A click that arrives two hours late still belongs to the original hour bucket. Watermarks close windows. Too-late events go to a repair path. Mention this or the design looks like a toy."]
		}],
		tradeoffs: [{
			choice: "Stream only",
			pickWhen: "Dashboards",
			cost: "Billing drift"
		}, {
			choice: "Batch only",
			pickWhen: "Daily invoices",
			cost: "No live ops view"
		}],
		related: [
			"/examples/distributed-mq",
			"/examples/metrics",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "Streaming 101 (Akidau)",
			href: "https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/"
		}]
	},
	{
		slug: "hotel-reservation",
		title: "Design a Hotel Reservation System",
		source: "Volume 2",
		chapter: 7,
		difficulty: "intermediate",
		minutes: 16,
		tags: ["inventory", "booking"],
		companies: [
			"Booking.com",
			"Airbnb",
			"hotels.com"
		],
		summary: "Volume 2 chapter 7. Inventory is a room-night. Oversell is the bug. Lock the inventory row (or use a conditional write) between hold and pay, with a TTL so abandoned carts release rooms.",
		requirements: {
			functional: [
				"Search availability",
				"Hold a room",
				"Pay and confirm",
				"Cancel / refund"
			],
			nonFunctional: [
				"No double-book of the same room-night",
				"Search can be slightly stale",
				"Payment is a saga"
			]
		},
		dataModel: [
			{
				entity: "Hotel",
				fields: [
					"id",
					"geo",
					"stars"
				]
			},
			{
				entity: "RoomType",
				fields: [
					"id",
					"hotel_id",
					"capacity"
				]
			},
			{
				entity: "Inventory",
				fields: [
					"room_type_id",
					"date",
					"total",
					"held",
					"booked"
				]
			},
			{
				entity: "Reservation",
				fields: [
					"id",
					"user_id",
					"status",
					"nights[]"
				]
			}
		],
		architecture: [{
			heading: "Hold → pay → confirm",
			numbered: [
				"Search hits a denormalized availability index (can be minutes stale).",
				"Hold: transactional decrement of remaining = total - booked - held if remaining > 0. Write a hold with TTL (10 min).",
				"Pay via payment service (idempotency key = reservation id).",
				"On success, convert hold → booked. On fail or TTL, release."
			],
			callout: {
				kind: "warn",
				title: "Do not check-then-act",
				text: "Read remaining=1 twice, both book. Use UPDATE … WHERE remaining > 0, or a version column, or a serializable txn on that inventory key."
			}
		}],
		deepDives: [{
			heading: "Sagas",
			body: ["Payment and inventory live in different systems. Orchestrate: hold, pay, confirm. Compensations: void payment, release hold. Two-phase commit across vendors is not on the table."]
		}],
		tradeoffs: [{
			choice: "Overbooking factor",
			pickWhen: "No-show rates are known",
			cost: "Walking guests"
		}, {
			choice: "Strict remaining=0",
			pickWhen: "Boutique hotels, unique rooms",
			cost: "Lower occupancy"
		}],
		related: [
			"/examples/payment",
			"/lld/concurrency",
			"/hld/consistency"
		],
		furtherReading: [{
			label: "roadmap.sh — e-commerce checkout",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "email-service",
		title: "Design a Distributed Email Service",
		source: "Volume 2",
		chapter: 8,
		difficulty: "advanced",
		minutes: 16,
		tags: ["smtp", "storage"],
		companies: [
			"Gmail",
			"Outlook",
			"Fastmail"
		],
		summary: "Volume 2 chapter 8. SMTP in, IMAP/web out, a metadata store, a blob store for bodies, spam, and fan-out to many devices. Mail is a large, append-mostly object with search.",
		requirements: {
			functional: [
				"Send and receive",
				"Folders / labels",
				"Search",
				"Attachments",
				"Multiple devices"
			],
			nonFunctional: [
				"Durability (losing mail is a scandal)",
				"Spam filtering before inbox",
				"Search freshness of seconds to minutes"
			]
		},
		architecture: [{
			heading: "Inbound",
			numbered: [
				"MX record → edge MTA. TLS, greylist, size limits.",
				"Spam / virus pipeline (async is OK; quarantine first).",
				"Store body in object storage, headers + labels in a DB sharded by user.",
				"Notify connected web clients; IMAP idle for thick clients."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "mx",
						label: "MX / MTA"
					},
					{
						id: "sp",
						label: "Spam pipeline"
					},
					{
						id: "st",
						label: "Meta + blob",
						tone: "accent"
					},
					{
						id: "n",
						label: "Notify devices"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Search",
			body: ["Do not LIKE %query% the metadata DB. Maintain a per-user inverted index (or a search cluster with a user routing key). Attachments are OCR'd offline."]
		}],
		tradeoffs: [{
			choice: "Per-user shard",
			pickWhen: "Natural isolation, easy deletion",
			cost: "Hot users (mailing-list bombs)"
		}, {
			choice: "Shared search cluster",
			pickWhen: "Ops simplicity",
			cost: "Noisy neighbor"
		}],
		related: [
			"/examples/object-storage",
			"/examples/notification",
			"/hld/bloom-filters"
		],
		furtherReading: [{
			label: "SMTP",
			href: "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol"
		}]
	},
	{
		slug: "object-storage",
		title: "Design S3-like Object Storage",
		source: "Volume 2",
		chapter: 9,
		difficulty: "advanced",
		minutes: 18,
		tags: ["s3", "storage"],
		companies: [
			"Amazon S3",
			"GCS",
			"Azure Blob"
		],
		summary: "Volume 2 chapter 9. Put/get/list objects in buckets. Metadata in a strongly consistent index, data in erasure-coded or replicated chunks across a storage fleet, with a placement service.",
		requirements: {
			functional: [
				"PUT / GET / DELETE object",
				"List prefix",
				"Presigned URLs",
				"Versioning, multipart"
			],
			nonFunctional: [
				"11 nines class durability (the famous S3 number)",
				"Huge objects via multipart",
				"Cheap sequential IO"
			]
		},
		architecture: [{
			heading: "Control vs data",
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "API",
						items: [
							"HTTP frontends",
							"Auth",
							"Presign"
						]
					},
					{
						title: "Metadata",
						items: ["Bucket + object index", "Version list"]
					},
					{
						title: "Placement",
						items: ["Chunk IDs", "Erasure set / replica set"]
					},
					{
						title: "Storage nodes",
						items: ["Disks", "Bit rot checks"]
					}
				]
			},
			bullets: [
				"Multipart: client uploads parts, then a complete call concatenates them logically.",
				"Erasure coding (e.g. 6+3) beats 3× replication on cold data. Replication is simpler for hot small objects.",
				"List is prefix scan on the metadata index, not a disk walk."
			]
		}],
		deepDives: [{
			heading: "Durability math (say it)",
			body: ["Replicate across failure domains (disk, node, rack, AZ). Background scrubbers detect bit rot. The metadata store is the CP heart — if it lies, the bytes are orphans."]
		}],
		tradeoffs: [{
			choice: "Erasure coding",
			pickWhen: "Cold, large objects",
			cost: "CPU, repair bandwidth"
		}, {
			choice: "3× replica",
			pickWhen: "Hot, small, simple",
			cost: "Storage bill"
		}],
		related: [
			"/examples/google-drive",
			"/examples/youtube",
			"/hld/quorum"
		],
		furtherReading: [{
			label: "S3 design talks / AWS architecture (ideas)",
			href: "https://aws.amazon.com/s3/"
		}]
	},
	{
		slug: "leaderboard",
		title: "Design a Real-time Gaming Leaderboard",
		source: "Volume 2",
		chapter: 10,
		difficulty: "intermediate",
		minutes: 12,
		tags: ["redis", "games"],
		companies: [
			"Riot",
			"Fortnite",
			"mobile games"
		],
		summary: "Volume 2 chapter 10. Rank players by score with fast updates and range queries ('top 10' and 'me ±5'). Redis sorted sets are the v1; sharding and time windows are the rest.",
		requirements: {
			functional: [
				"Submit a score",
				"Top-N",
				"My rank and neighbors",
				"Daily / weekly boards"
			],
			nonFunctional: ["High write QPS during events", "Reads are eventually consistent by seconds"]
		},
		architecture: [{
			heading: "Sorted sets",
			body: ["ZADD board score player, ZREVRANGE 0 9, ZREVRANK player. That is the entire v1. For scale, shard by game mode + time window. A global board of 100M players may keep only the top few million in Redis and spill the tail to disk."],
			code: {
				title: "Redis sketch",
				source: `ZADD lb:weekly:42 1830 "player:9"
ZREVRANGE lb:weekly:42 0 9 WITHSCORES
ZREVRANK lb:weekly:42 "player:9"`
			}
		}],
		deepDives: [{
			heading: "Ties and stability",
			body: ["Score then timestamp (score * K - ts) so earlier arrivals win ties. Or store a tuple. Players will notice flicker."]
		}],
		tradeoffs: [{
			choice: "Redis only",
			pickWhen: "Top-N of a modest set",
			cost: "RAM, persistence story"
		}, {
			choice: "DB + cached top",
			pickWhen: "Huge tails",
			cost: "Rank of a random player is slower"
		}],
		related: [
			"/hld/caching",
			"/examples/unique-id",
			"/hld/sharding"
		],
		furtherReading: [{
			label: "Redis sorted sets",
			href: "https://redis.io/docs/data-types/sorted-sets/"
		}]
	},
	{
		slug: "payment",
		title: "Design a Payment System",
		source: "Volume 2",
		chapter: 11,
		difficulty: "advanced",
		minutes: 18,
		tags: ["money", "idempotency"],
		companies: [
			"Stripe",
			"PayPal",
			"Square"
		],
		summary: "Volume 2 chapter 11. Charge a card, talk to a processor, keep a ledger. Idempotency keys, state machines, and 'never lose or double-charge' beat fancy diagrams.",
		requirements: {
			functional: [
				"Authorize, capture, refund, void",
				"Idempotent retries",
				"Webhooks to merchants",
				"Reconciliation"
			],
			nonFunctional: [
				"Exactly-once money effects",
				"PCI scope as small as possible",
				"Processor outages queued, not forgotten"
			]
		},
		apis: [{
			method: "POST",
			path: "/v1/charges",
			desc: "Idempotency-Key header. { amount, currency, source }"
		}, {
			method: "POST",
			path: "/v1/refunds",
			desc: "Refund a captured charge"
		}],
		architecture: [{
			heading: "State machine + ledger",
			numbered: [
				"API records an Intent (requires_action | processing | succeeded | failed).",
				"A worker talks to the processor; every hop is retried with the same idempotency key.",
				"On success, append-only ledger entries (merchant receivable, processor clearing, fees).",
				"Webhooks fire from the ledger, not from the request thread, with signed retries."
			],
			callout: {
				kind: "insight",
				title: "Ledger first",
				text: "Balances are projections of an append-only journal. Do not UPDATE balance = balance + x without a corresponding journal row."
			}
		}],
		deepDives: [{
			heading: "PCI",
			body: ["Do not touch PAN if you can help it. Use a processor's tokenization (Stripe.js) so your servers see tokens, not card numbers. That is an architecture decision, not a compliance afterthought."]
		}],
		tradeoffs: [{
			choice: "Authorize then capture",
			pickWhen: "Merchants fulfill later",
			cost: "Auth expiry, more states"
		}, {
			choice: "Immediate capture",
			pickWhen: "Digital goods",
			cost: "Refunds instead of voids"
		}],
		related: [
			"/examples/digital-wallet",
			"/examples/hotel-reservation",
			"/lld/adapter"
		],
		furtherReading: [{
			label: "roadmap.sh — payments",
			href: "https://roadmap.sh/questions/system-design"
		}]
	},
	{
		slug: "digital-wallet",
		title: "Design a Digital Wallet",
		source: "Volume 2",
		chapter: 12,
		difficulty: "advanced",
		minutes: 16,
		tags: ["money", "ledger"],
		companies: [
			"PayPal",
			"Apple Pay",
			"PhonePe",
			"Venmo"
		],
		summary: "Volume 2 chapter 12. A ledger of accounts, transfers that double-entry, holds for pending payments, and end-to-end idempotency. The wallet is a money graph, not a 'balance column'.",
		requirements: {
			functional: [
				"Top up, withdraw, P2P transfer",
				"Pay a merchant",
				"See history and balance",
				"Holds / escrows"
			],
			nonFunctional: [
				"No lost money",
				"No double spend",
				"Audit trail"
			]
		},
		dataModel: [
			{
				entity: "Account",
				fields: [
					"id",
					"user_id",
					"currency",
					"type (available|pending)"
				]
			},
			{
				entity: "JournalEntry",
				fields: [
					"id",
					"txn_id",
					"account_id",
					"amount (+/-)",
					"ts"
				]
			},
			{
				entity: "Txn",
				fields: [
					"id",
					"idempotency_key",
					"state"
				]
			}
		],
		architecture: [{
			heading: "Double entry",
			body: ["A transfer from A to B is two journal lines that sum to zero, committed in one transaction on the ledger store (or a per-user shard plus an outgoing/incoming saga if cross-shard).", "Balance = SUM(journal) for that account, cached with a version. Conditional update on version prevents lost updates."],
			code: {
				title: "Invariant",
				source: `assert(sum(lines in txn) === 0)
assert(available >= 0) // after applying`
			}
		}],
		deepDives: [{
			heading: "Cross-shard transfers",
			body: ["If accounts shard by user, A and B may not share a DB. Use a saga with a clearing account: debit A → credit clearing (txn 1), debit clearing → credit B (txn 2). Reconcile the clearing account constantly."]
		}],
		tradeoffs: [{
			choice: "Single-row balance",
			pickWhen: "Toy scale",
			cost: "No audit, lost updates"
		}, {
			choice: "Journal + snapshot",
			pickWhen: "Real money",
			cost: "More writes, need compaction of old lines"
		}],
		related: [
			"/examples/payment",
			"/examples/stock-exchange",
			"/hld/consistency"
		],
		furtherReading: [{
			label: "Double-entry bookkeeping",
			href: "https://en.wikipedia.org/wiki/Double-entry_bookkeeping"
		}]
	},
	{
		slug: "stock-exchange",
		title: "Design a Stock Exchange",
		source: "Volume 2",
		chapter: 13,
		difficulty: "advanced",
		minutes: 20,
		tags: ["matching", "low latency"],
		companies: [
			"NYSE",
			"NASDAQ",
			"Binance"
		],
		summary: "Volume 2 chapter 13. The matching engine is a single-threaded, in-memory order book per symbol. Deterministic, sequenced, and persisted as a log. Everything else (gateways, market data, clearing) is around it.",
		requirements: {
			functional: [
				"Limit and market orders",
				"Cancel",
				"Trades emit to both sides",
				"Market data (L2 book)"
			],
			nonFunctional: [
				"Microseconds to a few ms matching",
				"Fair FIFO (or configured) at a price level",
				"Recover from the log"
			]
		},
		architecture: [{
			heading: "The engine is a loop",
			numbered: [
				"A sequenced gateway assigns a global order-id and appends to the input log.",
				"The matching thread for that symbol reads the log, mutates bid/ask trees, emits trades and book deltas.",
				"Output log is the source of truth for market-data publishers and the clearing/ledger service.",
				"Replicas follow the same log — they do not match independently."
			],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "g",
						label: "Order gateway"
					},
					{
						id: "log",
						label: "Input log",
						tone: "accent"
					},
					{
						id: "m",
						label: "Matcher (1 thread / symbol)"
					},
					{
						id: "out",
						label: "Trades + market data"
					}
				]]
			}
		}],
		deepDives: [{
			heading: "Order book",
			body: ["Two price-time priority books (bids desc, asks asc). A limit order rests if it does not cross; a market order walks the other side until filled or the book is empty. Memory: skip lists or maps of price → FIFO queue."],
			callout: {
				kind: "warn",
				title: "Do not shard a symbol",
				text: "Two threads matching AAPL is a bug, not a scale strategy. Shard by symbol. Hot symbols get a bigger machine."
			}
		}],
		tradeoffs: [{
			choice: "Single-thread matcher",
			pickWhen: "Correctness and latency (always)",
			cost: "Per-symbol ceiling"
		}, {
			choice: "Crypto-style chain settlement",
			pickWhen: "On-chain products",
			cost: "Not an exchange matching-engine design"
		}],
		related: [
			"/lld/observer",
			"/examples/digital-wallet",
			"/hld/consistency"
		],
		furtherReading: [{
			label: "How matching engines work (ideas)",
			href: "https://en.wikipedia.org/wiki/Order_matching_system"
		}]
	}
];
var base = [
	...vol1Examples,
	...vol2Examples,
	...awesomeExamples
];
/**
* Chapter-depth rewrites replace their thinner counterparts by slug; everything
* else gets the framework sections layered on. Catalogue order is preserved so
* links and progress ids stay stable.
*/
var deepBySlug = new Map(deepExamples.map((e) => [e.slug, e]));
var examples = base.map((e) => {
	const deep = deepBySlug.get(e.slug);
	if (deep) return deep;
	const extra = exampleSupplements[e.slug];
	return extra ? {
		...e,
		...extra
	} : e;
});
function getExample(slug) {
	return examples.find((e) => e.slug === slug);
}
//#endregion
export { getExample as n, examples as t };
