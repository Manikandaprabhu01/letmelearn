import type { DesignExample } from "@/data/types";

export const frameworkExamples: DesignExample[] = [
  {
    slug: "interview-framework",
    title: "A Framework for System Design Interviews",
    source: "Volume 1",
    chapter: 3,
    difficulty: "foundational",
    minutes: 16,
    tags: ["framework", "interview", "communication"],
    companies: ["FAANG-style loops", "Any senior-level backend loop"],
    summary:
      "The four-step script from Volume 1 chapter 3, expanded into what you actually say, how long each step takes, and the specific behaviours interviewers are grading. Every example in this app is written in this order so the sequence becomes muscle memory.",
    clarifying: [
      {
        q: "Who are the users and what are the top three things they do?",
        a: "This is the question that decides the design. 'Everyone posts and reads' is a different system from 'a few thousand publishers, millions of readers'. Get the read/write ratio out of this answer.",
      },
      {
        q: "How many users, and how active are they?",
        a: "Daily actives and actions per user per day. If the interviewer says 'you tell me', pick a round number, say it out loud, and use it — never leave scale undefined.",
      },
      {
        q: "Is this global or single-region?",
        a: "Global changes replication, consistency and latency budgets fundamentally. Ask early, because retrofitting multi-region into a design halfway through costs you five minutes.",
      },
      {
        q: "How fresh must reads be?",
        a: "The single most useful consistency question. 'Seconds is fine' unlocks caching and replicas; 'must be immediate' forces a leader read or a quorum on the hot path.",
      },
      {
        q: "What is explicitly out of scope?",
        a: "Say what you are not building — auth, payments, moderation, analytics — and get agreement. This buys time and prevents the interviewer thinking you forgot them.",
      },
    ],
    requirements: {
      functional: [
        "Agree on the two or three core use cases before drawing anything",
        "Write the agreed scope somewhere visible and refer back to it",
        "Name what is deliberately excluded",
      ],
      nonFunctional: [
        "Scale: DAU, peak QPS, storage growth per year",
        "Latency budget for the primary read and write path",
        "Consistency requirement, stated per feature rather than globally",
        "Availability target and what degraded mode looks like",
      ],
    },
    math: [
      {
        label: "Time budget, 45-minute round",
        expr: "scope 8 min · high level 12 min · deep dive 18 min · wrap 5 min",
        result: "43 min",
        note: "Leaves two minutes for their questions. Watch the clock; running out during the deep dive is the classic failure.",
      },
      {
        label: "How much to draw",
        expr: "6–10 boxes at the high level",
        result: "one screen",
        note: "More than that and you are designing the whole company; fewer and there is nothing to dive into.",
      },
      {
        label: "Deep dives to prepare",
        expr: "2–3 subsystems, chosen by the interviewer's interest",
        result: "not five",
        note: "Depth on two beats a survey of six every time.",
      },
    ],
    apis: [
      { method: "STEP 1", path: "Understand and scope", desc: "Ask, estimate, agree. Nothing is drawn yet." },
      { method: "STEP 2", path: "High-level design", desc: "APIs, data model, boxes and arrows. Get buy-in before going deeper." },
      { method: "STEP 3", path: "Deep dive", desc: "Two or three hard parts, in the interviewer's order of interest." },
      { method: "STEP 4", path: "Wrap up", desc: "Bottlenecks, failure modes, what you would do next." },
    ],
    architecture: [
      {
        heading: "Step 1 — Understand the problem and establish scope",
        lede: "Eight minutes that determine whether the next thirty-five are useful.",
        body: [
          "The most common way to fail this round is to design something correct that the interviewer did not ask for. They deliberately give an ambiguous prompt — 'design Twitter' — because how you narrow it is the signal.",
          "Ask questions that change the design. 'Is it read-heavy?' changes everything. 'What colour is the button?' changes nothing. If the interviewer deflects with 'what do you think?', state an assumption confidently and move on — that is also being tested.",
        ],
        steps: [
          {
            title: "Clarify the core use cases",
            text: "Two or three, in the form 'a user can X'. Write them down. Everything you build must serve one of them.",
            detail: "'Users post 280-character messages' · 'Users see a timeline of people they follow' · 'Users follow and unfollow'",
          },
          {
            title: "Get the numbers",
            text: "DAU, actions per user, payload size, retention. Then convert to peak QPS and yearly storage out loud, so the interviewer can correct an input rather than your conclusion.",
            detail: "300M DAU × 100 reads/day ÷ 10⁵ ≈ 300k reads/s average, ~1M/s peak",
          },
          {
            title: "Name the non-functional requirements",
            text: "Latency, consistency, availability, cost — with a number or a comparative for each. 'Timeline reads under 200 ms; seconds of staleness are fine' is a design constraint. 'It should be fast' is not.",
          },
          {
            title: "State what is out of scope",
            text: "Explicitly. 'I will not design auth, moderation or the ML ranking model unless you want me to.' Nearly always they say yes, and now nobody thinks you forgot.",
          },
        ],
        callout: {
          kind: "interview",
          text: "Write the agreed scope on the board and leave it there. Referring back to it mid-design — 'this serves use case two' — reads as discipline and keeps you from wandering.",
        },
      },
      {
        heading: "Step 2 — Propose a high-level design and get buy-in",
        lede: "Boxes and arrows, plus the two artefacts most candidates skip.",
        body: [
          "Before drawing infrastructure, write the API surface and the data model. Three endpoint signatures and four tables force the design to be concrete, and they surface disagreement early while it is cheap.",
          "Then draw the request path: client, edge, service, storage. Six to ten boxes. Narrate the flow of one write and one read through them, and stop to ask whether this matches what they had in mind.",
        ],
        steps: [
          {
            title: "API surface first",
            text: "Two or three endpoints with real signatures. This is where you decide what the system does; the boxes are how.",
            detail: "POST /v1/posts {text} → 201 {postId}   ·   GET /v1/timeline?cursor= → 200 {posts[], nextCursor}",
          },
          {
            title: "Data model second",
            text: "The entities, their keys, and the one or two indexes the main queries need. Choosing the primary key is often choosing the shard key.",
          },
          {
            title: "Then the boxes",
            text: "Client → CDN/LB → API → services → cache → storage, plus a queue if any work is async. Keep it to one screen.",
          },
          {
            title: "Walk one request end to end",
            text: "'A user posts. The write goes here, we do this synchronously and that asynchronously, and here is where a reader sees it.' This is where design flaws surface.",
          },
          {
            title: "Pause and ask",
            text: "'Does this match what you had in mind, or would you like me to go deeper somewhere?' Their answer tells you which deep dive they want.",
          },
        ],
        diagram: {
          kind: "system",
          caption: "The default skeleton. Almost every design is this, plus one interesting part.",
          columns: [
            {
              title: "Edge",
              nodes: [
                { id: "cdn", label: "CDN", sub: "static + media" },
                { id: "lb", label: "Load balancer", tone: "accent" },
              ],
            },
            {
              title: "API",
              nodes: [
                { id: "gw", label: "Gateway", sub: "auth, rate limit" },
                { id: "svc", label: "Services", sub: "stateless", tone: "ok" },
              ],
            },
            {
              title: "Async",
              nodes: [
                { id: "q", label: "Queue", sub: "fan-out, email, media" },
                { id: "w", label: "Workers" },
              ],
            },
            {
              title: "State",
              nodes: [
                { id: "c", label: "Cache", sub: "hot reads" },
                { id: "db", label: "Primary store", sub: "sharded" },
                { id: "blob", label: "Object storage", sub: "media" },
              ],
            },
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Step 3 — Design deep dive",
        lede: "The part you are actually graded on.",
        body: [
          "Let the interviewer choose where to go if they have an opinion; if not, pick the part that is genuinely hard and say why it is hard. For a feed that is fan-out; for a payment system it is exactly-once and reconciliation; for a chat system it is delivery and ordering.",
          "Go deep enough to be specific: name the data structure, the key, the failure, and the number. 'We cache timelines' is a sentence. 'We store the last 800 post ids per user in a Redis list, roughly 60 GB for the active set, and rebuild from the posts table on a miss' is a design.",
        ],
        table: {
          headers: ["System type", "The hard part they want", "What a shallow answer sounds like"],
          rows: [
            ["Feed / timeline", "Fan-out on write vs read, and the celebrity problem", "'We use a cache'"],
            ["Chat", "Delivery guarantees, ordering, presence at scale", "'WebSockets'"],
            ["Payments", "Idempotency, ledger integrity, reconciliation", "'A payments table'"],
            ["Search / autocomplete", "Index structure, update path, ranking", "'Elasticsearch'"],
            ["Video", "Chunked upload, transcoding pipeline, CDN strategy", "'Store it in S3'"],
            ["Rate limiter", "Distributed counter state without a round trip per request", "'Redis'"],
            ["Storage / KV", "Partitioning, replication, conflict resolution", "'Consistent hashing'"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Volunteer the failure mode before being asked. 'This breaks when one user has 50 million followers — here is what I would do about it' is worth more than any amount of correct-but-obvious architecture.",
        },
      },
      {
        heading: "Step 4 — Wrap up",
        lede: "Five minutes that change the interviewer's write-up.",
        bullets: [
          "Name the bottleneck you would hit first, and at roughly what scale. Specificity here is credibility.",
          "State the biggest trade-off you made and what you gave up. Every design sacrifices something; pretending otherwise is the tell of inexperience.",
          "Describe what happens when the riskiest dependency fails, and what users see.",
          "Say what you would do with another hour — the parts you knowingly left thin.",
          "Mention operational reality briefly: what you would monitor, and what would page someone.",
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

 I'd page on timeline p99 and on fan-out lag, since that's what users feel."`,
        },
      },
      {
        heading: "What interviewers are actually scoring",
        table: {
          headers: ["Signal", "What earns it", "What loses it"],
          rows: [
            ["Scoping", "Questions that change the design; explicit assumptions", "Starting to draw within the first minute"],
            ["Estimation", "Converting to peak QPS and storage out loud", "'It'll be a lot of traffic'"],
            ["Depth", "One subsystem specified concretely, with numbers", "Naming technologies without saying how they are used"],
            ["Trade-offs", "'I chose X, which costs me Y'", "Presenting a design as having no downsides"],
            ["Failure thinking", "Volunteering what breaks and what users see", "Only discussing the happy path"],
            ["Communication", "Narrating, pausing, checking in", "Silence, or twenty minutes of monologue"],
            ["Correcting course", "Taking a hint and adjusting quickly", "Defending a design after they signalled a problem"],
          ],
        },
        callout: {
          kind: "warn",
          text: "When an interviewer asks 'are you sure about that?' or 'what happens if…', they are handing you a hint. The wrong response is to defend; the right one is to explore it. Candidates who cannot update after a hint are rated poorly regardless of the design.",
        },
      },
      {
        heading: "Common failure patterns",
        bullets: [
          "Designing for a billion users when the requirement was a million. Over-engineering reads as inexperience, not ambition.",
          "Naming technologies as answers. 'Kafka' is not a design; 'a partitioned log keyed by user id so one user's events stay ordered' is.",
          "Silent thinking. If you go quiet for two minutes, the interviewer has nothing to grade. Narrate the options you are weighing.",
          "Never mentioning data. A design with no data model and no key choice is a diagram, not a system.",
          "Running out of time in the deep dive. Watch the clock and reserve the last five minutes.",
          "Ignoring the interviewer's steering. They know which part is interesting; go where they point.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Go deep on one subsystem",
        pickWhen: "45–60 minute rounds, senior level",
        cost: "Thin coverage elsewhere — say so explicitly so it reads as a choice",
      },
      {
        choice: "Survey the whole system",
        pickWhen: "Junior loops, or the interviewer explicitly asks for breadth",
        cost: "Looks shallow if you never commit to a hard part",
      },
      {
        choice: "Draw first, ask later",
        pickWhen: "Almost never",
        cost: "High chance of designing the wrong system",
      },
      {
        choice: "Assume and state, when they will not answer",
        pickWhen: "The interviewer deflects your scoping question",
        cost: "You own the assumption — but this is what they wanted to see",
      },
    ],
    wrapUp: [
      "Rehearse the four steps until the sequence is automatic, so your attention goes to the problem rather than to what comes next.",
      "Practise saying numbers out loud. Most candidates can do the arithmetic and forget to narrate it, which means it earns nothing.",
      "Prepare one deep dive for each of the six or seven common system archetypes — feed, chat, payments, search, video, storage, rate limiting.",
      "Practise being interrupted. Real rounds are conversations, and a rehearsed monologue falls apart the first time it is redirected.",
    ],
    followUps: [
      {
        q: "The interviewer says nothing and just watches. What do you do?",
        a: "Narrate more, not less, and force check-ins. I would say what I am about to do, do it, then ask a direct question — 'shall I go deeper on fan-out, or would you rather I cover the storage layer?' A silent interviewer is usually assessing whether I can drive the session, so the failure mode is waiting to be led.",
      },
      {
        q: "You realise 25 minutes in that your design is wrong. Now what?",
        a: "Say so immediately and explain what changed my mind — that is a strong signal, not a weak one. Then fix the specific part rather than restarting: usually one component or one key choice is wrong, not the whole thing. Candidates who quietly hope nobody notices do much worse than candidates who catch it themselves.",
      },
      {
        q: "How much detail is too much?",
        a: "If I am writing out a function body or debating a library, too much. If I have named a component but not said what its key is, what it stores, or how big it gets, not enough. The right granularity is: named components, concrete data structures, real numbers, and explicit failure behaviour.",
      },
      {
        q: "Should you mention specific technologies?",
        a: "Yes, but as an illustration rather than as the answer — 'a partitioned log, Kafka for example' rather than 'Kafka'. Naming the property I need shows I understand why, and it protects me if the interviewer knows a technology better than I do. Claiming deep expertise in something I have not run is a bad trade.",
      },
    ],
    related: ["/hld/estimation", "/examples/scale-to-millions", "/examples/url-shortener", "/examples/news-feed"],
    furtherReading: [
      { label: "roadmap.sh — system design questions", href: "https://roadmap.sh/questions/system-design" },
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "scale-to-millions",
    title: "Scale from Zero to Millions of Users",
    source: "Volume 1",
    chapter: 1,
    difficulty: "foundational",
    minutes: 20,
    tags: ["framework", "web stack", "scaling"],
    companies: ["Any web product"],
    summary:
      "Volume 1 opens by walking one application from a single box to a multi-region, sharded system — introducing each component at the moment something breaks. Learn it as a checklist you run against every other design: is there a cache on the hot path, is the compute stateless, how does the primary fail over.",
    clarifying: [
      {
        q: "What is the read/write ratio?",
        a: "Assume 10:1 or higher, which is typical for consumer products. It is the number that decides whether caching and replicas solve your problem or whether you need to shard writes.",
      },
      {
        q: "How much downtime is acceptable?",
        a: "Assume 99.9% to start — 43 minutes a month — rising to 99.99% as the product matters more. That target is what forces multi-AZ and fast rollback.",
      },
      {
        q: "Single region or global users?",
        a: "Start single-region. Going global adds latency routing, data residency and replication decisions that should be made deliberately rather than by default.",
      },
      {
        q: "How fast is growth?",
        a: "Design for 10× current traffic, not 1000×. Each step on the ladder should be the cheapest thing that survives the next order of magnitude.",
      },
    ],
    requirements: {
      functional: [
        "Users read and write the product's core objects",
        "Sessions survive across more than one app server",
        "Uploaded files are visible to every server",
        "Slow work (email, thumbnails, exports) does not block a request",
      ],
      nonFunctional: [
        "Grow from 1 to 10 million users without a rewrite",
        "Survive the loss of any single server, and of a whole availability zone",
        "Deploy without downtime",
        "Keep p95 latency interactive (under ~300 ms) throughout",
      ],
    },
    math: [
      {
        label: "1 M users, 10 actions/day",
        expr: "10,000,000 ÷ 10⁵",
        result: "≈ 100 rps avg",
        note: "Peak ×3 ≈ 300 rps. One or two application servers. Do this arithmetic before proposing a cluster.",
      },
      {
        label: "10 M users, 20 actions/day",
        expr: "200,000,000 ÷ 10⁵",
        result: "≈ 2,000 rps avg",
        note: "Peak ≈ 6,000 rps. Now you need a fleet, a cache, and replicas.",
      },
      {
        label: "Storage growth",
        expr: "10 M users × 1 KB profile + 200 M rows/yr × 500 B",
        result: "≈ 110 GB/yr",
        note: "×3 for indexes and replication ≈ 330 GB. Still one machine — do not shard yet.",
      },
      {
        label: "Cache sizing",
        expr: "hot 20% of 10 M users × 2 KB",
        result: "≈ 4 GB",
        note: "Trivially affordable, and it removes most read load. This is why caching comes before replicas.",
      },
    ],
    apis: [
      { method: "GET", path: "/v1/items?cursor=", desc: "Read path — cacheable, served from replicas" },
      { method: "POST", path: "/v1/items", desc: "Write path — primary only, idempotency key" },
      { method: "GET", path: "/healthz", desc: "Liveness — shallow, no dependency checks" },
      { method: "GET", path: "/readyz", desc: "Readiness — gates load-balancer traffic during deploy and drain" },
    ],
    dataModel: [
      { entity: "users", fields: ["id (pk)", "email (unique)", "created_at", "region"] },
      { entity: "items", fields: ["id (pk)", "user_id (fk, idx)", "body", "created_at (idx)", "version"] },
      { entity: "sessions", fields: ["token (pk)", "user_id", "expires_at", "→ Redis, not the primary DB"] },
      { entity: "media", fields: ["id (pk)", "user_id", "object_key", "→ bytes live in object storage"] },
    ],
    architecture: [
      {
        heading: "The ladder, and what forces each rung",
        lede: "Every step exists because a specific thing broke.",
        steps: [
          {
            title: "One server",
            text: "Web, application and database on a single box. Genuinely fine for early traffic, and simpler than anything that follows.",
            detail: "Breaks on: the machine dying, and every deploy being downtime.",
          },
          {
            title: "Separate the database",
            text: "Two machines, sized differently: CPU for the app, memory and IOPS for the database. They now fail and scale independently.",
            detail: "Breaks on: the app server dying, and CPU limits on one box.",
          },
          {
            title: "Load balancer plus multiple app servers",
            text: "Requires statelessness: sessions in Redis or a signed token, uploads in object storage, no local disk state. Now deploys are rolling and a server loss is invisible.",
            detail: "Breaks on: the database becoming the bottleneck for reads.",
          },
          {
            title: "Cache the hot reads",
            text: "Cache-aside in Redis. Typically removes 80-95% of read load for a fraction of the cost of another database machine.",
            detail: "Introduces: invalidation, staleness, and the stampede/penetration/avalanche failure modes.",
          },
          {
            title: "Read replicas",
            text: "Writes to the primary, reads to followers. Multiplies read capacity and introduces replication lag.",
            detail: "Introduces: read-your-writes anomalies. Route a user's reads to the primary briefly after their write.",
          },
          {
            title: "CDN and object storage",
            text: "Static assets, images and video move to the edge. Cuts latency and origin bandwidth dramatically, and takes media entirely off your servers.",
          },
          {
            title: "Queue plus workers",
            text: "Email, thumbnails, exports, fan-out and webhooks move off the request path. The user's request returns in milliseconds and the work survives a crash.",
            detail: "Introduces: eventual consistency, at-least-once delivery, and a backlog to monitor.",
          },
          {
            title: "Multiple availability zones",
            text: "App servers, cache and database replicas spread across zones, so losing one zone degrades rather than stops the service.",
          },
          {
            title: "Shard the write path",
            text: "Only when a single write leader cannot keep up or the dataset outgrows one machine. This is the expensive rung: cross-shard joins, transactions and rebalancing all become your problem.",
            detail: "Delay it. Then choose a shard key you can live with for years.",
          },
          {
            title: "Split services and regions",
            text: "Extract the pieces with genuinely different scaling profiles or ownership; replicate across regions for latency and disaster recovery.",
          },
        ],
        callout: {
          kind: "interview",
          text: "Walking this ladder out loud — naming the step, the failure that forces it, and the new problem it creates — is a complete answer to 'how would you scale this?'. The third part is what separates understanding from memorisation.",
        },
      },
      {
        heading: "The shape it converges to",
        diagram: {
          kind: "system",
          caption: "Roughly where every product lands by a few million users.",
          columns: [
            {
              title: "Edge",
              nodes: [
                { id: "dns", label: "DNS", sub: "health-checked, low TTL" },
                { id: "cdn", label: "CDN", sub: "static, media, cacheable GETs", tone: "accent" },
              ],
            },
            {
              title: "Entry",
              nodes: [
                { id: "lb", label: "Load balancer", sub: "L7, multi-AZ", tone: "accent" },
                { id: "gw", label: "Gateway", sub: "auth, rate limit" },
              ],
            },
            {
              title: "Compute",
              nodes: [
                { id: "app", label: "App servers ×N", sub: "stateless, autoscaled", tone: "ok" },
                { id: "wrk", label: "Workers", sub: "queue consumers", tone: "ok" },
              ],
            },
            {
              title: "State",
              nodes: [
                { id: "redis", label: "Redis", sub: "cache + sessions" },
                { id: "pri", label: "Primary DB", sub: "writes, multi-AZ" },
                { id: "rep", label: "Replicas", sub: "reads" },
                { id: "s3", label: "Object storage", sub: "media" },
                { id: "q", label: "Queue", sub: "async work" },
              ],
            },
          ],
        },
        table: {
          headers: ["Component", "Added at roughly", "Solves", "Costs"],
          rows: [
            ["Separate DB host", "First real users", "Independent sizing and failure", "A network hop"],
            ["Load balancer + fleet", "~100 rps or first uptime requirement", "Server loss, zero-downtime deploys", "Statelessness discipline"],
            ["Cache", "~500 rps reads", "Most read load", "Invalidation and staleness"],
            ["Read replicas", "~2,000 rps reads", "Read capacity beyond the cache", "Replication lag anomalies"],
            ["CDN", "Any media, any global user", "Latency and origin bandwidth", "Cache-control discipline"],
            ["Queue", "First slow request", "Latency and coupling", "Eventual consistency, idempotency"],
            ["Sharding", "Writes or storage exceed one machine", "Write scale", "Joins, transactions, rebalancing"],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Making the tier stateless",
        lede: "The prerequisite for every rung above the third.",
        body: [
          "Horizontal scaling is straightforward in principle and is blocked in practice by four specific things. Each has a standard fix, and naming them shows you have actually done this rather than read about it.",
        ],
        table: {
          headers: ["State that blocks scaling", "Symptom", "Fix"],
          rows: [
            ["In-memory sessions", "Users randomly logged out", "Redis session store, or a signed stateless token"],
            ["Local file uploads", "Image 404s on some page loads", "Object storage with signed URLs"],
            ["In-process cache used for correctness", "Two servers disagree", "Shared cache, or accept it as an optimisation only"],
            ["Per-instance cron", "Nightly job runs five times", "A scheduler with leader election, or a job queue"],
          ],
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
// that has closed its listener — users see 502s on every deploy.`,
        },
      },
      {
        heading: "The database is almost always the constraint",
        bullets: [
          "Before adding machines, look at queries. One missing index or one N+1 pattern routinely costs more than an entire tier of hardware.",
          "Connection limits bite before CPU does: a hundred app instances each holding twenty connections will exhaust a Postgres primary. Put a pooler (PgBouncer, RDS Proxy) in front.",
          "Cache before replicas. A cache is cheaper, removes more load, and does not introduce replication lag.",
          "Replicas multiply reads and do nothing for writes — every replica applies the full write stream.",
          "Batch and queue writes where the user does not need immediate confirmation. Ten individual inserts become one batched insert.",
          "Denormalise deliberately when a join is the bottleneck, and accept the write-time cost of keeping the copy correct.",
        ],
        math: [
          {
            label: "Connection exhaustion",
            expr: "100 app instances × 20 pool connections",
            result: "2,000 connections",
            note: "Well past a Postgres primary's comfortable limit. A pooler multiplexes them down to ~100.",
          },
          {
            label: "Cache vs replica",
            expr: "95% hit ratio on 10,000 rps",
            result: "500 rps to DB",
            note: "One cache node does what several replicas would, at a fraction of the cost.",
          },
        ],
      },
      {
        heading: "Multi-AZ, then multi-region",
        bullets: [
          "Multi-AZ is table stakes above a modest availability target: app servers in three zones, database primary with a synchronous replica in a second zone, cache replicated or accepted as lossy.",
          "Multi-region is a much bigger step. Decide first whether it is for latency, for disaster recovery, or for data residency — the architectures differ.",
          "Active-passive across regions is the common answer: all writes in one region, a warm standby elsewhere, and a documented (and practised) failover. Recovery is measured in minutes.",
          "Active-active means multi-leader writes, which means conflict resolution, and that is a substantial ongoing cost. Only take it on for genuinely global write traffic.",
          "The cheap middle ground: serve reads from regional replicas and route all writes to one region. Most read-heavy products get most of the benefit this way.",
        ],
        diagram: {
          kind: "compare",
          caption: "Choose by what you are actually buying.",
          options: [
            {
              title: "Single region, multi-AZ",
              tone: "ok",
              good: ["Simple; one source of truth", "Survives a zone failure", "No conflict resolution ever"],
              bad: ["Region outage is a full outage", "Far-away users pay the latency"],
              verdict: "Almost everyone, for a long time.",
            },
            {
              title: "Multi-region, single write region",
              good: ["Fast reads worldwide", "Warm standby for disaster recovery", "Still one write leader — no conflicts"],
              bad: ["Cross-region write latency for distant users", "Failover is a practised procedure, not automatic"],
              verdict: "Read-heavy global products.",
            },
            {
              title: "Active-active",
              good: ["Local writes everywhere", "Survives a whole region for writes"],
              bad: [
                "Write conflicts are guaranteed and must be resolved",
                "Uniqueness and sequences become hard",
                "Debugging is substantially harder",
              ],
              verdict: "Genuinely global write workloads only.",
            },
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Vertical scaling first",
        pickWhen: "Early product, strong transactional needs, small team",
        cost: "A hard ceiling and a single failure domain — but it buys a year cheaply",
      },
      {
        choice: "Cache before replicas",
        pickWhen: "Read-heavy with a skewed access pattern (almost always)",
        cost: "Invalidation and bounded staleness",
      },
      {
        choice: "Queue the slow work",
        pickWhen: "Any request doing work the user does not need to wait for",
        cost: "Eventual consistency and a backlog to operate",
      },
      {
        choice: "Shard early",
        pickWhen: "Write-heavy from day one with an obvious partition key (tenant, city)",
        cost: "Cross-shard joins and operational complexity forever",
      },
      {
        choice: "Microservices",
        pickWhen: "Team scaling problems, or genuinely different scaling profiles",
        cost: "Network calls, partial failure, distributed debugging — rarely a performance win",
      },
    ],
    wrapUp: [
      "The first bottleneck is nearly always the database — specifically its write path and its connection limit, not its storage.",
      "The largest single win is caching the hot reads, and it should come before replicas because it is cheaper and removes more load.",
      "The step to delay as long as honestly possible is sharding: everything above it is reversible, and sharding is not.",
      "Deploy safety — readiness gating, draining, canary, fast rollback — moves the availability number as much as any redundancy does.",
      "With another hour: the multi-region story, the backup and restore drill, and per-tenant isolation for the largest customers.",
    ],
    followUps: [
      {
        q: "You are at 100 rps and the CTO wants a microservices architecture. What do you say?",
        a: "That services solve organisational problems, not performance ones, and at 100 requests per second the performance argument does not exist. I would propose a modular monolith with clean internal boundaries, and extract a service when a specific piece has a genuinely different scaling profile or needs independent ownership — video transcoding or search indexing, typically. That keeps the option open without paying for network calls and distributed debugging today.",
      },
      {
        q: "Traffic just went up 10× overnight. What do you do first?",
        a: "Find the saturated resource, because the fix differs completely. If it is the app tier, autoscaling handles it. If it is the database — which it usually is — autoscaling makes it worse by adding connections, so I would put a pooler in front, raise cache hit ratios, and rate limit at the edge. Then shed load deliberately: serve degraded or cached responses for non-critical features and protect the core transaction path.",
      },
      {
        q: "How do you decide when to add a cache?",
        a: "When reads dominate and the access pattern is skewed, which is nearly always. The test is whether a small fraction of keys accounts for most reads — if so, a few gigabytes of cache removes most of the database load. I would set TTLs from how stale each piece of data may be, delete rather than update on write, and have single-flight and jittered TTLs in place from the start rather than after the first stampede.",
      },
      {
        q: "What breaks that this ladder does not cover?",
        a: "The operational things: backups nobody has restored, a deploy process without a fast rollback, no distributed tracing so a latency spike takes hours to localise, and a single hot tenant that no amount of horizontal scaling fixes. Those cause more real outages than capacity does, and none of them are on the architecture diagram.",
      },
    ],
    related: ["/hld/scaling", "/hld/caching", "/hld/load-balancing", "/examples/interview-framework"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
