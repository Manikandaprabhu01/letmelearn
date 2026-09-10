//#region node_modules/.nitro/vite/services/ssr/assets/examples-D1W0JN4B.js
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
var examples = [
	...vol1Examples,
	...vol2Examples,
	...awesomeExamples
];
function getExample(slug) {
	return examples.find((e) => e.slug === slug);
}
//#endregion
export { getExample as n, examples as t };
