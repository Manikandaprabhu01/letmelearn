import type { Concept } from "@/data/types";

export const hldFundamentals: Concept[] = [
  {
    slug: "scaling",
    title: "Scaling: Vertical, Horizontal, and the Order to Do It In",
    subtitle: "From one box to a tier that survives losing a machine.",
    level: "foundational",
    minutes: 16,
    tags: ["scalability", "architecture", "fundamentals"],
    summary:
      "Every system design answer is a walk up the same staircase: one server, then a separated database, then a cache, then read replicas, then stateless app servers behind a load balancer, then sharding when one write leader is no longer enough. Knowing the order — and the failure that forces each step — is more valuable than knowing any single technology.",
    keyPoints: [
      "Vertical scaling is the fastest fix and has a hard ceiling plus a single point of failure. Use it, then plan past it.",
      "Horizontal scaling requires statelessness: session in a shared store, uploads in object storage, nothing on local disk.",
      "Reads scale with caching and replicas; writes scale with sharding, and sharding is where the complexity lives.",
      "The database is the bottleneck in almost every design. Everything else is easier than it looks.",
      "Scale for the traffic you have plus one order of magnitude — not three.",
    ],
    sections: [
      {
        heading: "The staircase",
        lede: "Each step exists because a specific thing broke.",
        steps: [
          {
            title: "One server",
            text: "Web server, application and database on one box. Handles a surprising amount — thousands of requests per second for simple workloads. It fails when the machine dies, and every deploy is downtime.",
            detail: "Ceiling: one machine's CPU, RAM and disk. Availability: no redundancy at all.",
          },
          {
            title: "Split the database onto its own machine",
            text: "Application and database now scale and fail independently, and you can size each for what it needs — CPU for the app, memory and IOPS for the database. This is the first step in nearly every real system.",
            detail: "Cost: a network hop per query. Benefit: two tuning knobs instead of one.",
          },
          {
            title: "Add a load balancer and more app servers",
            text: "Requires the app to be stateless. Now you can lose a server without losing the service, and deploys become rolling rather than downtime.",
            detail:
              "Prerequisite: sessions in Redis or a signed cookie, uploads in S3, no in-process caches you depend on for correctness.",
          },
          {
            title: "Add a cache",
            text: "Most workloads are read-heavy and skewed. A cache in front of the database absorbs the hot keys and typically removes 80-95% of read load for a fraction of the cost of another replica.",
            detail: "Now you own an invalidation problem. Decide TTL and write policy explicitly.",
          },
          {
            title: "Add read replicas",
            text: "Send reads to followers, writes to the leader. Multiplies read capacity, and introduces replication lag — the first place users see 'I saved it and it disappeared'.",
            detail:
              "Route a user's reads to the leader for a few seconds after their own write (read-your-writes).",
          },
          {
            title: "Push static and media to a CDN",
            text: "Images, JS, video and API responses that can tolerate staleness move to the edge. This cuts both latency and origin bandwidth, often dramatically.",
          },
          {
            title: "Shard the write path",
            text: "When a single write leader cannot keep up, or the dataset no longer fits one machine, partition by key. This is the expensive step: cross-shard joins, transactions and rebalancing all become your problem.",
            detail:
              "Delay it as long as honestly possible. Then pick a shard key you can live with for years.",
          },
          {
            title: "Split by service and by region",
            text: "Separate teams and separate failure domains: extract the services with different scaling profiles, then replicate across regions for latency and disaster recovery.",
          },
        ],
        callout: {
          kind: "interview",
          text: "Walking this staircase out loud is a complete answer to 'how would you scale this?'. Name the step, the failure that forces it, and the new problem it creates — that last part is what separates a memorised list from understanding.",
        },
      },
      {
        heading: "Vertical versus horizontal",
        diagram: {
          kind: "compare",
          caption: "They are not alternatives — you do both, in this order.",
          options: [
            {
              title: "Vertical (bigger machine)",
              good: [
                "No code changes; works for any workload",
                "Keeps single-node consistency and simple transactions",
                "Often the cheapest fix for the next 12 months",
              ],
              bad: [
                "Hard ceiling (largest instance available)",
                "Still one machine — one failure domain",
                "Cost grows super-linearly at the top end",
                "Resize usually means a restart",
              ],
              verdict:
                "Databases, and buying time. Do it first; it is nearly free engineering-wise.",
            },
            {
              title: "Horizontal (more machines)",
              tone: "ok",
              good: [
                "No practical ceiling",
                "Failure of one node is survivable",
                "Commodity hardware, and elastic with load",
              ],
              bad: [
                "Requires statelessness and a load balancer",
                "Coordination, consistency and data partitioning become real problems",
                "Operational complexity: deploys, config, observability across N nodes",
              ],
              verdict: "Stateless tiers immediately; stateful tiers when vertical runs out.",
            },
          ],
        },
        table: {
          headers: ["Tier", "Scales by", "Limiting resource", "First thing to try"],
          rows: [
            ["Web / app", "Horizontal, easily", "CPU", "Add instances behind the load balancer"],
            [
              "Cache",
              "Horizontal with consistent hashing",
              "Memory",
              "Bigger instance, then shard",
            ],
            [
              "Database reads",
              "Replicas + cache",
              "IOPS, CPU",
              "Cache the hot keys before adding replicas",
            ],
            [
              "Database writes",
              "Sharding, or a different engine",
              "Write throughput, disk",
              "Batch, queue and denormalise before sharding",
            ],
            [
              "Object storage",
              "Effectively unlimited (managed)",
              "Bandwidth, cost",
              "Nothing — this is why it exists",
            ],
          ],
        },
      },
      {
        heading: "The stateless requirement",
        lede: "Horizontal scaling is easy in principle and blocked by four things in practice.",
        bullets: [
          "In-memory sessions: a user's second request lands on a different server and they are logged out. Move sessions to Redis, or use a signed stateless token.",
          "Local file uploads: written to server 3's disk, invisible to servers 1 and 2. Move to object storage.",
          "In-process caches used for correctness: fine as an optimisation, dangerous as a source of truth — two servers will disagree.",
          "Background jobs run per instance: five servers each running a nightly cron means five duplicate runs. Use a scheduler with leader election or a job queue.",
        ],
        diagram: {
          kind: "system",
          caption: "The shape almost every system converges to.",
          columns: [
            {
              title: "Edge",
              nodes: [
                { id: "dns", label: "DNS", sub: "geo routing" },
                { id: "cdn", label: "CDN", sub: "static + media", tone: "accent" },
              ],
            },
            {
              title: "Entry",
              nodes: [
                { id: "lb", label: "Load balancer", sub: "L7, health checks", tone: "accent" },
                { id: "gw", label: "API gateway", sub: "auth, rate limit" },
              ],
            },
            {
              title: "Compute",
              nodes: [
                { id: "app", label: "App servers ×N", sub: "stateless", tone: "ok" },
                { id: "wrk", label: "Workers", sub: "async jobs" },
              ],
            },
            {
              title: "State",
              nodes: [
                { id: "cache", label: "Cache", sub: "Redis, hot keys" },
                { id: "db", label: "Primary DB", sub: "writes" },
                { id: "rr", label: "Read replicas", sub: "reads" },
                { id: "s3", label: "Object storage", sub: "blobs" },
              ],
            },
          ],
        },
      },
      {
        heading: "Know your numbers",
        lede: "One good estimate beats ten adjectives.",
        math: [
          {
            label: "One modern app server",
            expr: "~5,000–20,000 rps for simple JSON; ~500–2,000 rps with real work per request",
            result: "order 10³",
            note: "Wildly workload-dependent — but this is the range to reason from.",
          },
          {
            label: "One Postgres primary",
            expr: "~5,000–50,000 simple writes/sec with fast disks; far less with heavy indexes",
            result: "order 10⁴",
          },
          {
            label: "Redis, single node",
            expr: "~100,000 ops/sec, sub-millisecond, single-threaded per core",
            result: "order 10⁵",
          },
          {
            label: "Network round trip",
            expr: "same AZ ≈ 0.5 ms · cross-region ≈ 50–150 ms · SSD read ≈ 0.1 ms · memory ≈ 100 ns",
            result: "latency ladder",
          },
          {
            label: "Daily to per-second",
            expr: "1 M/day ÷ 86,400 ≈ 12/s average; peak is typically 2–5× average",
            result: "≈ 60/s peak",
            note: "Always convert to peak. Systems are sized for peak, not average.",
          },
        ],
        callout: {
          kind: "insight",
          text: "1 million requests a day is about 12 per second. Candidates routinely propose Kafka and a 50-node cluster for traffic a single server handles. Doing the division out loud is one of the highest-value things you can do in an interview.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Where would you start scaling this system?",
            a: "By measuring, then by the staircase. I would find out which resource is saturated — CPU on the app tier, IOPS or CPU on the database, or bandwidth — because the fix differs completely. In most systems it is the database, and the cheapest first moves are a cache in front of the hot reads and moving media to a CDN, before adding replicas or considering shards.",
          },
          {
            q: "When do you shard?",
            a: "When a single write leader cannot keep up, or the working set no longer fits on one machine, and I have already exhausted vertical scaling, caching and read replicas. Sharding costs me cross-shard queries, distributed transactions and a rebalancing story, so it is the last step. When I do it, choosing the shard key is the decision that matters most — it should spread writes evenly and keep the common query on one shard.",
          },
          {
            q: "How do you handle a 10× traffic spike?",
            a: "Autoscaling handles the app tier if it is genuinely stateless, but it does not save the database — connections and IOPS are the real limit, so I would put a connection pooler in front and rate limit at the edge. Beyond that, shed load deliberately: serve cached or degraded responses, queue writes that can be async, and protect the core transaction path. A system that serves 80% of requests well beats one that falls over serving 100%.",
          },
          {
            q: "Microservices or a monolith?",
            a: "A modular monolith unless there is a specific reason not to. Services solve organisational scaling and independent deployment, not performance — they add network calls, partial failure and distributed debugging. I would split out the pieces with genuinely different scaling profiles or ownership, like video transcoding or search indexing, and keep the rest together.",
          },
        ],
      },
    ],
    related: ["/hld/load-balancing", "/hld/caching", "/hld/sharding", "/hld/estimation"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
  },

  {
    slug: "load-balancing",
    title: "Load Balancing",
    subtitle: "Spread traffic, remove dead servers, and do it without breaking sessions.",
    level: "foundational",
    minutes: 15,
    tags: ["networking", "availability", "traffic"],
    summary:
      "A load balancer is the component that makes horizontal scaling and zero-downtime deploys possible: it spreads requests across a pool, notices when a member stops answering, and takes it out. The algorithm matters less than most people think; health checks, connection draining and the layer you operate at matter much more.",
    keyPoints: [
      "L4 balances connections by IP and port — fast, protocol-agnostic. L7 reads the request — routing, TLS termination, retries.",
      "Least-connections beats round-robin whenever request cost varies, which is almost always.",
      "Health checks are the actual value: passive checks catch what active checks miss.",
      "Sticky sessions are a workaround for statefulness; prefer shared session storage.",
      "The load balancer is a single point of failure until it is a pair with a floating IP or DNS failover.",
    ],
    sections: [
      {
        heading: "Layer 4 versus layer 7",
        diagram: {
          kind: "compare",
          caption: "Different information, different powers.",
          options: [
            {
              title: "L4 — transport",
              sub: "TCP/UDP, sees IP and port",
              good: [
                "Very high throughput, low latency, cheap per connection",
                "Protocol-agnostic: works for gRPC, databases, anything",
                "Can pass TLS straight through untouched",
              ],
              bad: [
                "Cannot route by path, header or cookie",
                "Cannot retry a failed request — it only sees a stream",
                "No per-request metrics or content-based rules",
              ],
              verdict: "Extreme throughput, non-HTTP protocols, or in front of L7 balancers.",
            },
            {
              title: "L7 — application",
              sub: "HTTP, sees method, path, headers",
              tone: "ok",
              good: [
                "Route by path or host: /api → services, /img → media tier",
                "TLS termination, compression, header rewriting",
                "Retries, timeouts, circuit breaking, request-level metrics",
                "Sticky sessions by cookie",
              ],
              bad: [
                "More CPU per request; terminating TLS is the expensive part",
                "Must understand the protocol; HTTP/2 and gRPC need explicit support",
              ],
              verdict: "Almost all web traffic. This is what people mean by 'load balancer' today.",
            },
          ],
        },
        callout: {
          kind: "warn",
          text: "gRPC and HTTP/2 multiplex many requests over one long-lived connection. An L4 balancer will pin all of a client's requests to one backend and your load will be badly skewed — this needs an L7 proxy that balances per request.",
        },
      },
      {
        heading: "Algorithms, and when the choice matters",
        table: {
          headers: ["Algorithm", "How it picks", "Good for", "Fails when"],
          rows: [
            [
              "Round robin",
              "Next in the list",
              "Uniform requests, identical servers",
              "Request cost varies — slow requests pile up",
            ],
            [
              "Weighted round robin",
              "Proportional to capacity",
              "Mixed instance sizes, gradual rollouts",
              "Weights go stale as workloads change",
            ],
            [
              "Least connections",
              "Fewest in-flight",
              "Variable request duration — the usual default",
              "Long-polling or streaming skews the count",
            ],
            [
              "Least response time",
              "Lowest latency × connections",
              "Heterogeneous backends",
              "Reacts to noise; needs smoothing",
            ],
            [
              "IP hash",
              "hash(client IP)",
              "Crude stickiness without cookies",
              "NAT puts thousands of users on one backend",
            ],
            [
              "Consistent hashing",
              "hash(key) on a ring",
              "Cache affinity — same key to same node",
              "Hot keys still concentrate",
            ],
            [
              "Power of two choices",
              "Pick 2 at random, take the emptier",
              "Large pools; near-optimal with almost no state",
              "Rarely — this is the quiet default at scale",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "'Power of two random choices' is worth knowing: sampling two backends and taking the less loaded gets you nearly the benefit of global least-connections without any global state. It is why large-scale balancers do not need perfect information.",
        },
      },
      {
        heading: "Health checks are the real feature",
        lede: "Balancing is easy; knowing who is alive is not.",
        body: [
          "A load balancer's job is less about spreading load evenly than about not sending traffic to something broken. That means two kinds of checking, and both are needed: an active probe on a schedule, and passive observation of real traffic.",
        ],
        bullets: [
          "Active checks: GET /healthz every few seconds, mark unhealthy after N consecutive failures, healthy again after M successes. Hysteresis prevents flapping.",
          "The health endpoint must be shallow — it should check that this process can serve, not that every dependency is up. A deep check that pings the database will take your entire fleet out when the database blips.",
          "Passive checks (outlier detection): a backend returning 5xx or timing out on real traffic gets ejected temporarily, even if /healthz still returns 200. This catches the 'healthy but broken' case that active checks miss.",
          "Slow start: a newly healthy backend gets a gradually increasing share, so a cold JIT or empty cache does not get hit with full load and immediately fail again.",
          "Connection draining: on deploy or scale-down, stop sending new requests but let in-flight ones finish, with a timeout. Without it, every deploy drops requests.",
          "Never let all backends be ejected at once — most balancers have a panic threshold that reverts to sending to everyone rather than to no one.",
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
});`,
        },
      },
      {
        heading: "Sessions, stickiness and the honest advice",
        body: [
          "Sticky sessions route a given user to the same backend, usually via a cookie the balancer sets. It works, and it quietly undoes most of what a load balancer is for: load becomes uneven, a backend's death logs out its users, and scale-in drops sessions.",
        ],
        diagram: {
          kind: "flow",
          caption: "Prefer moving the state, not pinning the user.",
          rows: [
            [
              { id: "bad", label: "Sticky session", sub: "state on one server", tone: "bad" },
              { id: "s1", label: "Server dies", sub: "its users log out", tone: "bad" },
            ],
            [
              {
                id: "good",
                label: "Shared session store",
                sub: "Redis, or a signed token",
                tone: "ok",
              },
              {
                id: "s2",
                label: "Any server can serve",
                sub: "deploys and failures are invisible",
                tone: "ok",
              },
            ],
          ],
        },
        bullets: [
          "Shared store (Redis): any server serves any user; revocation is instant; costs one fast lookup per request.",
          "Signed stateless token (JWT in a cookie): no lookup at all, but revoking before expiry needs a denylist — which is a shared store again, just smaller.",
          "Legitimate stickiness: long-lived WebSocket connections, and in-memory per-connection state you genuinely cannot externalise. Say that explicitly rather than defending stickiness in general.",
        ],
      },
      {
        heading: "Making the balancer itself redundant",
        bullets: [
          "Active-passive pair sharing a floating (virtual) IP: the standby takes the IP when the active fails. Failover in seconds, and simple.",
          "DNS round robin across multiple balancer IPs: clients spread themselves, but DNS caching means failover takes as long as the TTL — minutes, not seconds.",
          "Anycast: the same IP announced from many locations, and the network routes to the nearest healthy one. This is how large CDNs and DNS providers do it.",
          "Managed cloud balancers (ALB/NLB, Cloud Load Balancing) hide all of this and are usually the right answer — say so rather than designing an HAProxy cluster nobody asked for.",
          "Client-side load balancing is a real alternative for internal service-to-service traffic: the client gets the pool from service discovery and picks, removing a hop and a dependency. It is what service meshes do with a sidecar.",
        ],
        table: {
          headers: ["Failure", "What the user sees", "Mitigation"],
          rows: [
            [
              "One backend dies",
              "Nothing, if health checks are fast",
              "Active + passive checks, retry idempotent requests",
            ],
            [
              "All backends unhealthy",
              "Total outage",
              "Panic mode: send to all rather than none; alert loudly",
            ],
            [
              "Balancer dies",
              "Total outage until failover",
              "HA pair with floating IP, or a managed balancer",
            ],
            [
              "Deploy without draining",
              "Dropped requests, 502s",
              "Readiness flip, then drain with a timeout",
            ],
            [
              "One slow backend",
              "p99 latency spike",
              "Outlier ejection, timeouts, least-connections",
            ],
            ["Retry storm", "Cascading overload", "Budgeted retries, jitter, circuit breaking"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Round robin or least connections?",
            a: "Least connections in almost every real system, because request cost is never uniform — one search query can cost 100× a health check, and round robin will keep feeding a server that is already busy. Round robin is fine when requests are genuinely homogeneous, and it is cheaper. At very large pools I would mention power-of-two-choices, which gets most of the benefit with almost no shared state.",
          },
          {
            q: "How does the load balancer know a server is down?",
            a: "Active probes on an interval with hysteresis — several consecutive failures before ejection, several successes before return — plus passive outlier detection on real traffic, which catches servers that answer /healthz but fail actual requests. The important design detail is that the health endpoint should not check downstream dependencies, or one database blip removes every server at once.",
          },
          {
            q: "How do you deploy without dropping requests?",
            a: "Rolling deploy with readiness gating and connection draining. The instance fails its readiness check first, waits long enough for the balancer to notice, then stops accepting new connections and finishes in-flight ones before exiting. Without that wait, the balancer is still routing to a process that has already closed its listener, and users see 502s.",
          },
          {
            q: "Where else do you load balance besides HTTP?",
            a: "DNS-level for geographic distribution, anycast at the network level for the edge, client-side balancing for internal service calls, and inside the database tier — a connection pooler in front of read replicas is load balancing too. Each layer answers a different question: DNS picks a region, the balancer picks a machine, the pooler picks a connection.",
          },
        ],
      },
    ],
    related: ["/hld/scaling", "/hld/dns", "/hld/api-gateway", "/playgrounds/load-balancer"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
    playground: "load-balancer",
  },

  {
    slug: "caching",
    title: "Caching",
    subtitle: "The highest-leverage optimisation, and the easiest one to get subtly wrong.",
    level: "foundational",
    minutes: 18,
    tags: ["performance", "caching", "consistency"],
    summary:
      "Caching turns an expensive computation into a cheap lookup, and typically removes 80-95% of read load in a read-heavy system. Everything hard about it comes from the same question: how do you know when the cached copy is no longer true, and what do you do while you find out?",
    keyPoints: [
      "Cache-aside is the default: the application reads through and populates on miss.",
      "TTL bounds staleness; invalidation removes it faster but is easy to miss a path.",
      "Three canonical failures: stampede (many misses at once), penetration (misses for keys that do not exist), avalanche (mass simultaneous expiry).",
      "A cache hit ratio without an eviction rate is a misleading metric.",
      "Cache the expensive and reused. Caching everything wastes memory and multiplies invalidation surface.",
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
                "~0 ms, hardest to invalidate",
              ],
            },
            { title: "Edge", items: ["CDN PoP", "Edge KV", "10–50 ms, purge API"] },
            {
              title: "Service",
              items: [
                "In-process (LRU)",
                "Per-instance, no coordination",
                "~100 ns, inconsistent across instances",
              ],
            },
            {
              title: "Shared",
              items: ["Redis / Memcached", "Consistent across instances", "~0.5 ms, network hop"],
            },
            {
              title: "Data",
              items: ["Database buffer pool", "Materialised views", "Query plan cache"],
            },
          ],
        },
        table: {
          headers: ["Layer", "Latency", "Shared?", "Invalidation"],
          rows: [
            ["Browser", "0 ms", "No — per user", "Nearly impossible; use content hashes in URLs"],
            ["CDN", "10–50 ms", "Yes — per region", "Purge API, seconds to propagate"],
            [
              "In-process",
              "~100 ns",
              "No — per instance",
              "Short TTL, or a pub/sub invalidation channel",
            ],
            ["Redis", "0.3–1 ms", "Yes", "Delete the key; immediate and reliable"],
            ["DB buffer pool", "~0.1 ms", "Per node", "Automatic"],
          ],
        },
      },
      {
        heading: "The four caching patterns",
        diagram: {
          kind: "sequence",
          caption: "Cache-aside: the pattern you should describe unless asked otherwise.",
          actors: [
            { id: "app", label: "Application" },
            { id: "c", label: "Cache", sub: "Redis" },
            { id: "db", label: "Database" },
          ],
          messages: [
            { from: "app", to: "c", label: "GET user:42", kind: "call" },
            { from: "c", to: "app", label: "miss", kind: "return", tone: "warn" },
            { from: "app", to: "db", label: "SELECT * FROM users WHERE id = 42", kind: "call" },
            { from: "db", to: "app", label: "row", kind: "return" },
            {
              from: "app",
              to: "c",
              label: "SET user:42 <row> EX 300",
              kind: "call",
              note: "TTL bounds staleness even if invalidation is missed",
            },
            {
              from: "app",
              to: "app",
              label: "on write: UPDATE db, then DEL user:42",
              kind: "self",
              tone: "accent",
              note: "delete, do not update — avoids a stale write racing a read",
            },
          ],
        },
        table: {
          headers: ["Pattern", "Read path", "Write path", "Trade-off"],
          rows: [
            [
              "Cache-aside (lazy)",
              "App checks cache, falls back to DB, populates",
              "Write DB, then delete the key",
              "Simple, resilient to cache loss; every miss pays full latency",
            ],
            [
              "Read-through",
              "Cache itself loads on miss",
              "Same as cache-aside",
              "Cleaner app code; needs a cache library that supports it",
            ],
            [
              "Write-through",
              "Always a hit for written keys",
              "Write cache and DB synchronously",
              "No stale data; every write pays cache + DB latency",
            ],
            [
              "Write-behind",
              "Always a hit",
              "Write cache, flush to DB asynchronously",
              "Fastest writes; data loss window if the cache dies",
            ],
          ],
        },
        callout: {
          kind: "warn",
          text: "On a write, delete the key rather than updating it. Two concurrent writers that both update the cache can land in the opposite order from their database writes, leaving the cache permanently wrong. Deleting makes the next reader repopulate from the truth.",
        },
      },
      {
        heading: "The three failure modes, and their fixes",
        steps: [
          {
            title: "Stampede (thundering herd)",
            text: "A hot key expires and a thousand concurrent requests all miss and all hit the database at once. The database, sized for the cached load, falls over — and every retry makes it worse.",
            detail:
              "Fix: single-flight (one loader per key, others await it), or a probabilistic early refresh before expiry, or serve stale while one request refreshes.",
          },
          {
            title: "Penetration",
            text: "Requests for keys that do not exist in the database either. Nothing is ever cached, so every request reaches storage — and this is trivially weaponised by an attacker generating random ids.",
            detail:
              "Fix: cache the negative result with a short TTL, and/or put a Bloom filter in front to answer 'definitely not present' without a lookup.",
          },
          {
            title: "Avalanche",
            text: "A large set of keys written together expires together — after a deploy, a bulk import, or a cache restart — and the whole read load lands on the database in one second.",
            detail:
              "Fix: jitter every TTL by ±10%, warm the cache before taking traffic, and stagger any bulk population.",
          },
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
}`,
        },
      },
      {
        heading: "Eviction and sizing",
        bullets: [
          "LRU is the sane default. LFU resists scans; W-TinyLFU (Caffeine, Ristretto) beats both in most real workloads. Redis offers allkeys-lru and allkeys-lfu — pick deliberately.",
          "Size by bytes, not entry count, when values vary in size. A '100k entry' cache of variable JSON blobs is an unbounded memory commitment.",
          "Watch the eviction rate alongside the hit ratio. High hits with high evictions means thrashing — the working set does not fit, and adding memory has a large payoff.",
          "Set maxmemory-policy explicitly. A Redis with noeviction that fills up starts rejecting writes, which is an outage with a confusing error.",
          "Key naming matters operationally: prefix by entity and version (user:v2:42) so a schema change can be rolled out by bumping the prefix instead of purging.",
        ],
        math: [
          {
            label: "Effective latency",
            expr: "hit_ratio × 0.5ms + (1 − hit_ratio) × 20ms",
            result: "@95%: 1.5 ms",
            note: "At 95% hits the average is 1.5 ms; at 80% it is 4.4 ms — the last few points of hit ratio matter enormously.",
          },
          {
            label: "Database load removed",
            expr: "10,000 rps × 95% cached",
            result: "500 rps to DB",
            note: "One replica instead of twenty. This is why caching is the first move.",
          },
          {
            label: "Memory for 1M sessions",
            expr: "1,000,000 × 2 KB",
            result: "≈ 2 GB",
            note: "Plus Redis overhead of roughly 50–100 bytes per key.",
          },
        ],
      },
      {
        heading: "Consistency: what a cache actually costs you",
        body: [
          "A cache is a second copy of the truth, so every cached system is eventually consistent by construction. The design question is how large the staleness window is, and whether any user-visible invariant depends on it being zero.",
        ],
        bullets: [
          "Bound staleness with TTL even when you also invalidate. Invalidation paths get missed — a background job, an admin tool, a replica write — and TTL is the backstop that limits the blast radius to minutes.",
          "Read-your-writes: after a user's own write, read from the source (or write the new value into the cache immediately for that key) or they will see their change disappear.",
          "Never cache authorisation decisions for longer than you can tolerate a revoked permission still working. This is the one place where 'a few minutes stale' can be a security incident.",
          "In-process caches across N instances are N independent stale copies. Either keep their TTLs very short, or invalidate via a pub/sub channel — and accept that the channel can drop messages.",
          "Cache the computation, not just the row: an expensive aggregation cached for 60 seconds is usually a bigger win than caching the rows it reads.",
        ],
        callout: {
          kind: "interview",
          text: "'What is the maximum staleness this feature can tolerate?' is the question that turns a caching discussion from hand-waving into design. Prices and permissions want seconds; a follower count is fine at minutes.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you invalidate a cache?",
            a: "Delete the key on write and rely on TTL as a backstop. I prefer delete over update because two concurrent writers can otherwise leave the cache holding the older value permanently. For derived or fan-out data — a feed, an aggregate — I would publish an invalidation event and let each consumer drop its keys, accepting that this is best-effort and that TTL is what actually bounds the damage.",
          },
          {
            q: "A hot key gets 50,000 requests per second. What breaks?",
            a: "One Redis node owns that key, so it becomes the bottleneck, and if it expires you get a stampede onto the database. I would add a small in-process cache in front for a second or two, which collapses most of that traffic before it leaves the app server, and use single-flight plus early refresh so the key never actually expires under load. If it is still too hot, replicate the key across N variants and pick one at random.",
          },
          {
            q: "What is your cache hit ratio target?",
            a: "It depends on the access distribution rather than on a universal number. For Zipfian traffic, 90-95% is normal and the remaining misses are the long tail, which caching cannot help much. What I would watch alongside it is the eviction rate and the miss latency — a 95% hit ratio with heavy eviction means the working set does not fit, and that is a different fix from a low hit ratio caused by poor key design.",
          },
          {
            q: "The cache goes down entirely. What happens?",
            a: "With cache-aside, correctness is fine and performance falls off a cliff — full read load hits the database, which is usually not provisioned for it. That is a real outage mode, so I would rate limit or shed load at the edge, keep a small in-process cache as a second line of defence, and warm the cache before returning it to service rather than letting it cold-start under full traffic.",
          },
        ],
      },
    ],
    related: ["/hld/cdn", "/lld/lru-cache", "/hld/consistency", "/hld/bloom-filters"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
    playground: "lru-cache",
  },

  {
    slug: "cdn",
    title: "Content Delivery Networks",
    subtitle: "Move the bytes close to the user, and stop paying for them twice.",
    level: "foundational",
    minutes: 13,
    tags: ["performance", "networking", "edge"],
    summary:
      "A CDN is a globally distributed cache in front of your origin. It exists because the speed of light is a hard limit: a round trip from Sydney to Virginia is ~200ms no matter how fast your servers are. Serving from a nearby point of presence turns that into ~10ms, and simultaneously removes most of the bandwidth bill and load from your origin.",
    keyPoints: [
      "Latency is dominated by distance and round trips, not by server speed.",
      "Cache-Control is the contract between you and the CDN — get it wrong and you either cache nothing or cache a user's private data.",
      "Content-hashed filenames plus immutable caching is the strongest pattern for static assets.",
      "Purge is slow and eventually consistent; versioned URLs are instant and reliable.",
      "Modern CDNs cache dynamic responses too, with stale-while-revalidate and per-path rules.",
    ],
    sections: [
      {
        heading: "Why distance dominates",
        math: [
          {
            label: "Speed of light in fibre",
            expr: "~200,000 km/s (about 2/3 of c)",
            result: "5 µs/km",
          },
          {
            label: "Sydney → Virginia round trip",
            expr: "~16,000 km × 2 × 5 µs/km, plus routing overhead",
            result: "≈ 200 ms",
            note: "Nothing you do on the server changes this number.",
          },
          {
            label: "TLS handshake cost",
            expr: "TCP (1 RTT) + TLS 1.3 (1 RTT) = 2 RTT before the first byte",
            result: "≈ 400 ms",
            note: "From Sydney to a US origin, before any application work happens.",
          },
          {
            label: "Same request from a Sydney PoP",
            expr: "2 RTT × ~5 ms",
            result: "≈ 10 ms",
            note: "A 40× improvement from geography alone.",
          },
          {
            label: "Origin bandwidth saved",
            expr: "10 TB/month of assets at a 95% offload rate",
            result: "500 GB from origin",
            note: "Often the larger financial win; egress is expensive.",
          },
        ],
        callout: {
          kind: "insight",
          text: "The CDN also terminates TLS at the edge and keeps warm, long-lived connections back to your origin — so even a genuine cache miss is faster than a direct connection, because the expensive handshakes happen nearby.",
        },
      },
      {
        heading: "How a request resolves",
        diagram: {
          kind: "sequence",
          caption: "Miss path once, then hits for everyone else in that region.",
          actors: [
            { id: "u", label: "User", sub: "Sydney" },
            { id: "dns", label: "DNS", sub: "anycast / geo" },
            { id: "pop", label: "Edge PoP", sub: "Sydney" },
            { id: "shield", label: "Shield / mid-tier", sub: "regional cache" },
            { id: "org", label: "Origin", sub: "Virginia" },
          ],
          messages: [
            { from: "u", to: "dns", label: "resolve cdn.example.com", kind: "call" },
            {
              from: "dns",
              to: "u",
              label: "nearest PoP address",
              kind: "return",
              note: "anycast or geo-DNS",
            },
            {
              from: "u",
              to: "pop",
              label: "GET /static/app.a3f9c1.js",
              kind: "call",
              note: "~5 ms away",
            },
            { from: "pop", to: "shield", label: "miss → fetch", kind: "call" },
            {
              from: "shield",
              to: "org",
              label: "miss → fetch",
              kind: "call",
              note: "shield collapses many PoP misses into one origin request",
            },
            {
              from: "org",
              to: "shield",
              label: "200 + Cache-Control: max-age=31536000, immutable",
              kind: "return",
            },
            { from: "shield", to: "pop", label: "store + forward", kind: "return" },
            {
              from: "pop",
              to: "u",
              label: "200 (and cached for everyone next)",
              kind: "return",
              tone: "ok",
            },
          ],
        },
        bullets: [
          "A shield (origin shield / mid-tier cache) matters more than people expect: without it, 200 PoPs each independently miss and your origin sees 200 identical requests for every new asset.",
          "Anycast routes the user to the topologically nearest PoP by BGP; geo-DNS does it by resolver location. Anycast fails over faster; geo-DNS gives more control.",
          "Cache key: by default URL plus a few headers. Adding Vary: Accept-Encoding is correct; adding Vary: User-Agent fragments the cache into thousands of copies and destroys the hit ratio.",
        ],
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
Last-Modified: Tue, 09 Sep 2026 12:00:00 GMT`,
        },
        table: {
          headers: ["Directive", "Means", "Watch out"],
          rows: [
            [
              "max-age=N",
              "Fresh for N seconds in any cache",
              "Applies to browsers too — you cannot recall it",
            ],
            [
              "s-maxage=N",
              "Freshness for shared caches only",
              "Lets you cache at the CDN but not in browsers",
            ],
            [
              "public / private",
              "May / may not be stored by shared caches",
              "Missing 'private' on a personalised page is a data leak",
            ],
            [
              "no-cache",
              "Store, but revalidate before use",
              "Does not mean 'do not cache' — that is no-store",
            ],
            ["immutable", "Do not revalidate even on reload", "Only safe with content-hashed URLs"],
            [
              "stale-while-revalidate",
              "Serve stale, refresh in background",
              "The single best directive for perceived performance",
            ],
            [
              "stale-if-error",
              "Serve stale when the origin errors",
              "Free availability during an origin outage",
            ],
          ],
        },
        callout: {
          kind: "warn",
          text: "The classic incident: a personalised page served with public, max-age=300, and the CDN hands user A's dashboard to user B. Default to private/no-store and opt specific paths into caching, rather than the reverse.",
        },
      },
      {
        heading: "Invalidation: versioning beats purging",
        bullets: [
          "Content-hashed filenames (app.a3f9c1.js) make every deploy a new URL. Old URLs stay valid for clients still running the old page, and you never purge anything. This is the right answer for static assets.",
          "Purge is eventually consistent — seconds to minutes across a global network, and rate-limited by most providers. Fine for emergencies, wrong as a routine deploy mechanism.",
          "Surrogate keys / cache tags let you purge by relation: tag every page containing product 42 and purge that tag when the product changes. This is the practical answer for dynamic content.",
          "Never purge everything on deploy. A globally cold CDN sends your entire traffic to the origin at once, which is a self-inflicted stampede.",
        ],
        diagram: {
          kind: "compare",
          caption: "Two ways to make a change visible.",
          options: [
            {
              title: "Versioned URL",
              tone: "ok",
              good: [
                "Instant, atomic, no coordination",
                "Old clients keep working",
                "Cache can be immutable for a year",
              ],
              bad: [
                "Requires a build step that rewrites references",
                "Not applicable to a stable URL like /api/products",
              ],
              verdict: "All static assets. Always.",
            },
            {
              title: "Purge / invalidate",
              good: ["Works for stable URLs", "Tag-based purge can be surgical"],
              bad: [
                "Propagation takes seconds to minutes",
                "Rate-limited; a purge-all is dangerous",
                "Failure is silent — a PoP may keep serving stale",
              ],
              verdict: "Dynamic content, keyed by tag; emergencies.",
            },
          ],
        },
      },
      {
        heading: "Beyond static files",
        bullets: [
          "Dynamic API responses: cache read-heavy public endpoints at the edge with short s-maxage plus stale-while-revalidate. A 5-second edge cache on a popular endpoint removes an enormous amount of origin load and is invisible to users.",
          "Video: segmented (HLS/DASH) so each segment is a separately cacheable file. This is why streaming works over ordinary HTTP CDNs.",
          "Large uploads and downloads: use the CDN in both directions — signed URLs let clients upload straight to storage without transiting your servers.",
          "Edge compute (Workers, Lambda@Edge) lets you personalise at the PoP — A/B assignment, auth checks, header rewriting — while keeping the underlying response cacheable.",
          "Security is part of the value: a CDN absorbs volumetric DDoS traffic, terminates TLS, and can run a WAF, all before traffic reaches your origin. Then lock the origin down so it only accepts connections from the CDN.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you handle a deploy with a CDN in front?",
            a: "Content-hash the assets so the new deploy references new URLs — nothing to purge, and clients mid-session keep working against the old files. The HTML shell is the only thing with a stable URL, so it gets a short s-maxage with stale-while-revalidate. I avoid purge-all on deploy, because a globally cold cache sends full traffic to the origin at once.",
          },
          {
            q: "Can you cache authenticated content?",
            a: "Sometimes, carefully. The safe version is caching the shared skeleton publicly and fetching the personalised fragment separately, or using edge compute to assemble a cached base with a per-user piece. What I would not do is include the auth cookie in the cache key on a shared cache — the hit ratio collapses and one misconfiguration leaks another user's data.",
          },
          {
            q: "Your CDN hit ratio is 60%. How do you diagnose it?",
            a: "Usually the cache key is too specific or the TTLs are too short. I would look for a Vary header on something high-cardinality like User-Agent, query strings that vary without changing the response (tracking parameters are the classic), and missing s-maxage on responses that could be shared. Then whether a shield tier is enabled, since without one every PoP misses independently.",
          },
          {
            q: "The origin goes down. What do users see?",
            a: "With stale-if-error configured, cached content keeps serving from the edge for as long as you allow — often the difference between an invisible incident and a total outage. Uncached paths fail. That is a good argument for caching even short-lived responses at the edge: it buys availability, not just latency.",
          },
        ],
      },
    ],
    related: ["/hld/caching", "/hld/dns", "/hld/load-balancing", "/examples/youtube"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
  },
];
