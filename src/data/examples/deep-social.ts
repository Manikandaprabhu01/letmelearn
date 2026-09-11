import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const socialDeepExamples: DesignExample[] = [
  {
    slug: "instagram",
    title: "Design Instagram",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 22,
    tags: ["media", "feed", "graph", "fan-out", "cdn"],
    companies: ["Instagram", "Pixelfed", "Flickr"],
    summary:
      "Two systems sharing a user id: a media pipeline that moves hundreds of terabytes a day and never lets a byte touch the application tier, and a social graph whose fan-out problem is the news feed chapter again. The way to answer well is to refuse to re-derive the feed from scratch — say explicitly that the hybrid fan-out is the known solution, then spend the time on what is genuinely new here, which is that the payload is large, immutable and expensive to process.",
    clarifying: [
      {
        q: "Photos only, or video and stories too?",
        a: "I will design for photos and short video, and treat stories as the same pipeline with a 24-hour TTL. That TTL is actually a simplification worth taking — ephemeral content never needs a permanent index, and it changes the storage tiering completely.",
      },
      {
        q: "How big can a following get?",
        a: "Hundreds of millions for the largest accounts, which is the entire reason a pure fan-out-on-write design fails. The celebrity case is not an edge case here, it is the defining constraint.",
      },
      {
        q: "Is the feed chronological or ranked?",
        a: "Ranked. That matters architecturally because a ranked feed cannot simply be a merge of sorted lists — it needs a candidate generation stage and a scoring stage, and the scoring needs features that are not in the post itself.",
      },
      {
        q: "How fast must a post appear to followers?",
        a: "Seconds for normal accounts is fine, and nobody notices a minute for a very large account. That tolerance is what makes asynchronous fan-out acceptable and is worth establishing before someone asks for real-time delivery to fifty million people.",
      },
      {
        q: "What is the read-to-write ratio?",
        a: "Very heavily read: people scroll far more than they post. So the write path can be slow and careful — transcoding, fan-out, indexing — while the read path must be almost entirely cache and CDN.",
      },
    ],
    requirements: {
      functional: [
        "Upload a photo or short video with a caption and tags",
        "Follow and unfollow accounts; view a profile grid",
        "A ranked home feed of posts from followed accounts",
        "Likes and comments, with counts visible on every post",
      ],
      nonFunctional: [
        "Feed p95 under 200 ms",
        "Upload acknowledged in seconds; processing may continue in the background",
        "Media served from the edge, never from the origin application",
        "A celebrity posting must not degrade the system for everyone else",
      ],
    },
    math: [
      {
        label: "Upload volume",
        expr: "50 M DAU × 2 posts/day ÷ 10⁵",
        result: "≈ 1,200 writes/s, peak ~4,000",
        note: "Tiny as a request rate. The difficulty is entirely in the bytes attached to each one.",
      },
      {
        label: "Media ingest",
        expr: "100 M posts/day × 2 MB original",
        result: "≈ 200 TB/day in",
        note: "Plus derived variants — thumbnail, feed, full, and several video renditions — which typically add 50–100% again.",
      },
      {
        label: "Feed reads",
        expr: "50 M × 10 opens/day ÷ 10⁵",
        result: "≈ 6,000 QPS, peak ~20,000",
        note: "Each open is a feed of ~30 posts, so the underlying post fetch is ~600 K/s — which must come from cache.",
      },
      {
        label: "Fan-out cost, normal user",
        expr: "1 post × ~500 followers",
        result: "500 list insertions",
        note: "Trivial. Ninety-nine percent of users are in this regime, which is why fan-out-on-write is the right default.",
      },
      {
        label: "Fan-out cost, celebrity",
        expr: "1 post × 300 M followers",
        result: "300 M insertions",
        note: "At 100 K insertions/s that is nearly an hour for one post — and a thundering herd of writes. This single number forces the hybrid design.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/uploads",
        desc: "Request a pre-signed URL; the client PUTs bytes directly to object storage",
      },
      {
        method: "POST",
        path: "/v1/posts",
        desc: "Commit — {mediaId, caption, tags}; enqueues processing and fan-out",
      },
      {
        method: "GET",
        path: "/v1/feed?cursor={}",
        desc: "Ranked home feed; cursor-based, never offset-based",
      },
      {
        method: "POST",
        path: "/v1/posts/{id}/likes",
        desc: "Idempotent per user; the count is updated asynchronously",
      },
      {
        method: "POST",
        path: "/v1/users/{id}/follow",
        desc: "Adds a graph edge and, for small accounts, backfills recent posts into the feed",
      },
      {
        method: "GET",
        path: "/v1/users/{id}/posts?cursor={}",
        desc: "Profile grid — a simple reverse-chronological index, not a ranked feed",
      },
    ],
    dataModel: [
      {
        entity: "posts",
        fields: [
          "post_id (pk, snowflake — sortable by time)",
          "author_id (fk, idx)",
          "media_ids[]",
          "caption, created_at",
          "status (processing|ready|failed)",
        ],
      },
      {
        entity: "media",
        fields: [
          "media_id (pk)",
          "variants (jsonb: thumb/feed/full URLs)",
          "width, height, duration",
          "blurhash (shown while loading)",
          "→ bytes in object storage, never in the database",
        ],
      },
      {
        entity: "follows",
        fields: [
          "follower_id (pk, idx)",
          "followee_id (pk, idx)",
          "created_at",
          "→ indexed both ways; sharded by follower_id for feed building",
        ],
      },
      {
        entity: "feed_cache",
        fields: [
          "user_id (pk)",
          "post_ids[] (~500, capped)",
          "→ Redis list; ids only, never post bodies",
        ],
      },
      {
        entity: "counters",
        fields: [
          "post_id (pk)",
          "likes, comments",
          "→ aggregated from a stream, not incremented per event",
        ],
      },
    ],
    architecture: [
      {
        heading: "The media path never touches the application",
        lede: "Two hundred terabytes a day is only affordable if you never handle it.",
        diagram: {
          kind: "sequence",
          caption: "The API sees kilobytes of metadata; object storage sees the megabytes.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "API" },
            { id: "s3", label: "Object storage" },
            { id: "q", label: "Queue" },
            { id: "w", label: "Transcode workers" },
          ],
          messages: [
            { from: "c", to: "api", label: "1. POST /uploads", kind: "call" },
            { from: "api", to: "c", label: "2. pre-signed PUT URL + mediaId", kind: "return" },
            {
              from: "c",
              to: "s3",
              label: "3. upload 2 MB directly — API not involved",
              kind: "call",
              tone: "accent",
            },
            { from: "c", to: "api", label: "4. POST /posts {mediaId, caption}", kind: "call" },
            { from: "api", to: "q", label: "5. enqueue processing", kind: "async" },
            {
              from: "api",
              to: "c",
              label: "6. 201, status=processing",
              kind: "return",
              tone: "ok",
            },
            { from: "q", to: "w", label: "7. transcode → variants", kind: "call" },
            {
              from: "w",
              to: "api",
              label: "8. status=ready → trigger fan-out",
              kind: "call",
              tone: "ok",
            },
          ],
        },
        bullets: [
          "Pre-signed URLs are the whole trick: the client authenticates with the API, receives a short-lived capability, and then talks to storage directly. A design that proxies the bytes needs an application tier sized for 200 TB a day rather than for 4,000 requests a second.",
          "The post exists before its media is ready. Showing the author their own post immediately — optimistically, from the local file — while processing continues is what makes the upload feel instant.",
          "Generate variants once, on write, not per request. On-the-fly resizing looks elegant and becomes an expensive, cacheable-but-often-missed compute tier the first time a post goes viral.",
          "A blurhash or dominant colour stored with the media lets the client render a placeholder immediately, which matters more for perceived speed than shaving milliseconds off the feed query.",
        ],
        callout: {
          kind: "insight",
          text: "Media is immutable, which is why this is easier than it looks. A processed variant never changes, so its URL can be content-addressed and cached at the edge forever, there is no invalidation story, and a retry of any step is harmless. Almost every hard problem in this design comes from the social graph rather than from the bytes.",
        },
      },
      {
        heading: "The feed: say it is the news-feed problem, then be specific",
        lede: "Do not re-derive hybrid fan-out from first principles — name it and move to what is different.",
        diagram: {
          kind: "compare",
          caption: "The follower-count distribution forces a split strategy.",
          options: [
            {
              title: "Fan-out on write",
              sub: "push the post id into every follower's list",
              good: [
                "Feed read is a single list fetch — fast and trivially cacheable",
                "Read cost is constant regardless of how many accounts you follow",
              ],
              bad: [
                "A 300 M-follower post is 300 M writes for one action",
                "Wasted work for inactive followers who never open the app",
              ],
              verdict: "Right for the ~99% of accounts with ordinary follower counts.",
            },
            {
              title: "Fan-out on read",
              sub: "query the accounts you follow at read time",
              good: [
                "Writes are O(1) — posting is instant no matter the audience",
                "No wasted work for followers who never read",
              ],
              bad: [
                "Reading merges hundreds of sources on every feed open",
                "Feed latency becomes a function of how many accounts you follow",
              ],
              verdict: "Right for the handful of accounts whose fan-out is unaffordable.",
            },
            {
              title: "Hybrid",
              sub: "push for normal accounts, pull for celebrities",
              tone: "ok",
              good: [
                "Bounded write amplification and bounded read latency",
                "The threshold is a tunable operational knob, not a redesign",
              ],
              bad: [
                "Two code paths in the feed mixer",
                "Ordering across the two sources needs care",
              ],
              verdict:
                "The answer. State the threshold — around 100 K followers — and why it exists.",
            },
          ],
        },
        code: {
          title: "The mixer is where the two paths meet",
          lang: "ts",
          source: `async function buildFeed(userId: string, cursor?: Cursor) {
  // Pushed posts are already sitting in this user's list — one Redis call.
  const pushed = await feedCache.range(userId, cursor, 200);

  // Pulled posts come from the small set of large accounts they follow.
  // Small set is the key word: a user might follow 500 accounts but only
  // three of them are above the fan-out threshold.
  const celebrities = await follows.largeAccountsFollowedBy(userId);
  const pulled = await Promise.all(
    celebrities.map((id) => postIndex.recent(id, { since: cursor?.ts, limit: 50 })),
  );

  // Merge on the id itself: snowflake ids sort by time, so no extra field and
  // no clock comparison across sources is needed.
  const candidates = dedupe([...pushed, ...pulled.flat()]).sort(descending);

  // Ranking happens AFTER candidate generation, never during it. Keeping the
  // two stages separate is what lets ranking change without touching fan-out.
  return rank(candidates, userId).slice(0, 30);
}`,
        },
        bullets: [
          "Feed lists store post ids, never post bodies. Bodies change — caption edits, deletions, counter updates — and duplicating them across millions of lists makes every edit a fan-out of its own.",
          "Cap the stored list at a few hundred ids. Nobody scrolls to post 4,000, and an uncapped list is unbounded memory growth per user.",
          "Do not fan out to dormant accounts. Maintaining lists for users who have not opened the app in months is a large fraction of total fan-out work for zero benefit; build their feed on read when they return.",
          "Use time-sortable ids — snowflake style — so merging pushed and pulled candidates is a sort on the id with no separate timestamp and no cross-source clock comparison.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "What is actually different from the news feed",
        body: [
          "If the answer stops at hybrid fan-out, it is the news feed chapter with photos attached. The genuinely distinct problems here are that the payload is enormous, that a feed entry is worthless without its media being ready, and that the media pipeline can fail independently of the post.",
        ],
        table: {
          caption: "Where the media pipeline changes the social design.",
          headers: ["Concern", "Text feed", "Photo feed"],
          rows: [
            [
              "Post is publishable",
              "Immediately on write",
              "Only once variants exist — fan-out waits for processing",
            ],
            [
              "Failure mode",
              "Write fails, user retries",
              "Upload succeeded, transcode failed — post is stuck",
            ],
            [
              "Feed payload",
              "Text inline",
              "Ids plus CDN URLs; the client fetches bytes separately",
            ],
            [
              "Scroll performance",
              "Network-bound on the API",
              "Bound by image prefetch and decode on the device",
            ],
            ["Cost driver", "Database and fan-out", "Egress bandwidth, by a wide margin"],
          ],
        },
        bullets: [
          "Fan-out must be triggered by processing completion, not by the post write. Pushing an id whose media is not ready produces a feed of grey boxes, which is worse than the post appearing a few seconds later.",
          "A failed transcode needs a real state, a retry budget and eventually a user-visible failure. Silently stuck posts are a common and very visible bug in this class of system.",
          "The client prefetches the next few posts' images while the user reads the current one. Without it, the feed feels slow no matter how fast the API is — which is a reminder that the perceived bottleneck is often not the one being optimised.",
          "Egress dominates the bill. Serving the right variant for the device and viewport, and choosing modern codecs, saves more money than any database optimisation in this design.",
        ],
      },
      {
        heading: "Counters at scale",
        lede: "A like is a trivial operation until three million people do it in a minute.",
        diagram: {
          kind: "flow",
          caption: "Never increment a row per event on a hot post.",
          rows: [
            [
              { id: "like", label: "Like event", sub: "user + post", tone: "accent" },
              { id: "dedupe", label: "Idempotent write", sub: "(user, post) unique" },
            ],
            [
              { id: "stream", label: "Stream", sub: "partitioned by post" },
              { id: "agg", label: "Windowed aggregate", sub: "per post per second" },
              { id: "cnt", label: "Counter store", sub: "read by the feed", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "A single row incremented by three million concurrent writers is a lock convoy. Aggregating in the stream layer and writing a delta per window turns millions of writes into a handful.",
          "The like itself must be idempotent and durable — a unique constraint on (user, post) — because a user retrying must not double-count and the state drives the UI's filled heart.",
          'Approximate counts are acceptable above a threshold, which is why large products show "2.4 M" rather than an exact figure. Exactness below a few hundred matters; above that nobody can tell.',
          "Read counts from a cache with a short TTL, not from the aggregate store. The feed renders thirty posts and would otherwise issue thirty counter reads per open.",
        ],
      },
      {
        heading: "Ranking and the candidate/score split",
        body: [
          "A ranked feed is two stages that should never be merged. Candidate generation is a cheap, high-recall retrieval from the feed list and the pulled sources; scoring is an expensive model applied to a few hundred candidates. Mixing them means every ranking change becomes a fan-out change.",
        ],
        bullets: [
          "Keep the candidate stage ignorant of ranking. It should produce perhaps 500 posts by recency and source; the model decides the order.",
          "Features come from three places: the post (age, media type), the viewer's history (past engagement with this author), and the author (typical engagement rate). Only the first is available in the feed list itself.",
          "Diversity constraints are applied after scoring — no more than two consecutive posts from the same author — because a purely score-ordered feed collapses onto whoever the model likes most.",
          "Ranking must degrade safely. If the model service is unavailable, fall back to reverse-chronological rather than failing the feed; an unranked feed is a worse product, not a broken one.",
        ],
        callout: {
          kind: "warn",
          title: "Deletions and the fan-out you already did",
          text: "A deleted or privacy-changed post is already sitting in millions of feed lists. Removing it from all of them is a second fan-out, so the practical approach is to filter at read time against the post's current status — which means the feed read must fetch post metadata anyway and cannot trust the cached list alone. This is the main reason feed lists hold ids rather than bodies.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Hybrid fan-out",
        pickWhen: "Follower counts span many orders of magnitude — always, in practice",
        cost: "Two paths in the mixer and a threshold to tune",
      },
      {
        choice: "Direct-to-storage uploads",
        pickWhen: "Always — media must not pass through the API",
        cost: "Pre-signed URL management and a commit step the client must complete",
      },
      {
        choice: "Pre-generated variants",
        pickWhen: "Predictable set of sizes",
        cost: "Storage multiplied by the number of variants, and reprocessing to add a new one",
      },
      {
        choice: "Ids in feed lists, bodies fetched separately",
        pickWhen: "Always — posts are mutable and deletable",
        cost: "A second fetch on the read path, which is why the post cache matters",
      },
      {
        choice: "Stream-aggregated counters",
        pickWhen: "Any post can go viral",
        cost: "Counts are seconds stale and approximate at the top end",
      },
      {
        choice: "Skip fan-out for dormant users",
        pickWhen: "A large inactive population",
        cost: "A slower first feed when they return",
      },
    ],
    wrapUp: [
      "Two systems share a user id: a media pipeline where the application never touches the bytes, and a social graph where the fan-out problem is the news feed again.",
      "Say plainly that hybrid fan-out is the known answer, name the threshold, and spend the remaining time on what is actually new — that the payload is huge, immutable, and processed asynchronously.",
      "Fan-out is triggered by processing completion rather than by the post write, or followers receive entries whose media does not exist yet.",
      "Feed lists hold ids, capped at a few hundred, because bodies are mutable and deletions would otherwise require a second fan-out across millions of lists.",
      "Counters are aggregated in a stream rather than incremented per event, and approximate counts above a threshold are a product decision that removes a hard engineering problem.",
      "With more time: the ranking model's features and training loop, abuse and content moderation in the upload path, and egress cost optimisation across codecs and variants.",
    ],
    followUps: [
      {
        q: "An account with 300 million followers posts. What happens?",
        a: "Nothing is fanned out, and that is the point. Above a threshold of around a hundred thousand followers the account is marked as pull-only, so posting is a single write to the author's own index and completes instantly. When any of those followers opens their feed, the mixer fetches the celebrity's recent posts directly and merges them with the pushed entries already in the list. The cost moves from one enormous write burst to a small extra read for each follower, which is affordable because a user typically follows only a handful of such accounts. Without this split, one post would be three hundred million list insertions — close to an hour of work at realistic throughput, during which that one action degrades everyone else.",
      },
      {
        q: "Why not store the post body in each follower's feed list?",
        a: "Because posts change and feeds are enormous. A caption edit, a privacy change, a deletion or even a like count update would each require rewriting millions of copies, turning every mutation into its own fan-out. Storing ids means the list is small, stable and cheap to cap, and the read path fetches current post data from a cache that has exactly one copy to invalidate. It also solves deletion cleanly: rather than hunting the post down in millions of lists, the read filters against the post's current status. The cost is an extra lookup per feed render, which is why a well-populated post cache is essential.",
      },
      {
        q: "The upload succeeds but transcoding fails. What does the user see?",
        a: "This is the failure mode unique to a media product and it needs an explicit state rather than being left to chance. The post is created with status processing, so the author sees it optimistically using the local file while workers do the transcode. If the job fails, it retries with backoff a bounded number of times; if it exhausts them, the post moves to failed and the author is told, with the option to retry — crucially, without re-uploading, because the original bytes are already in storage. The important design rule is that fan-out is triggered by processing completion, so a failed post never reaches anyone's feed. Silently stuck posts, visible to the author but never to followers, are the bug this structure exists to prevent.",
      },
      {
        q: "A post gets three million likes in a minute. What breaks?",
        a: "A naive design increments one row three million times, and that row becomes a lock convoy that stalls not just the counter but every transaction touching that table. The fix is to stop treating a like as a counter update: write the like itself idempotently, keyed on user and post so a retry cannot double-count, publish it to a stream partitioned by post id, and aggregate per window so the stored count is updated a few times a second with a delta rather than three million times. Reads come from a cache with a short TTL, because a feed of thirty posts would otherwise mean thirty counter lookups. Above a few thousand the count can be approximate and rounded, which is both what real products display and one less hard problem.",
      },
      {
        q: "How is this different from designing a news feed?",
        a: "The social half is genuinely the same problem, and I would say so rather than pretending otherwise — the hybrid fan-out, the capped id lists, the celebrity threshold all carry over. What is new is that the payload is two megabytes instead of two hundred bytes, which means the application tier must never touch it, so uploads go directly to object storage through pre-signed URLs and the feed carries CDN URLs rather than content. It also introduces an asynchronous processing stage between writing a post and publishing it, with its own failure states, and it moves the dominant cost from database work to egress bandwidth. The perceived performance bottleneck shifts too: it becomes image prefetch and decode on the device rather than API latency.",
      },
    ],
    related: [
      "/examples/news-feed",
      "/examples/youtube",
      "/examples/object-storage",
      "/hld/cdn",
      "/hld/message-queues",
    ],
    furtherReading: [
      {
        label: "algomaster — design Instagram",
        href: "https://algomaster.io/learn/system-design-interviews/design-instagram",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "uber",
    title: "Design Uber",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 24,
    tags: ["dispatch", "geo", "matching", "realtime", "state machine"],
    companies: ["Uber", "Lyft", "Grab", "Ola", "Bolt"],
    summary:
      "A geospatial index over moving vehicles, a matching problem where the naive answer is actively wrong, and a trip state machine that must survive a driver's phone losing signal in a tunnel. The matching is the interesting part: picking the nearest driver for each request independently is a greedy algorithm that produces worse outcomes than batching requests and solving them together, and saying so is what separates a good answer from a description of the app.",
    clarifying: [
      {
        q: "What geographic scope — one city, or global?",
        a: "Global, but the crucial property is that the problem partitions almost perfectly by city. A rider in Delhi is never matched to a driver in Berlin, so the system is really thousands of independent city-sized systems, which makes the scale far less frightening than it first sounds.",
      },
      {
        q: "How fast must a match happen?",
        a: "A few seconds. That budget is what allows batched matching — collecting requests over a short window and solving them together — rather than dispatching each one the instant it arrives.",
      },
      {
        q: "How often do drivers report location?",
        a: "Every four or five seconds while online. That is the dominant write load in the system and it has the same shape as nearby-friends: high volume, worthless after a minute, so it lives in memory rather than in a durable store.",
      },
      {
        q: "What happens if a driver's phone loses connectivity mid-trip?",
        a: "The trip must continue. That single requirement drives the design toward a durable trip state machine with an offline-capable client that buffers events, rather than a design where the server's live view is the source of truth.",
      },
      {
        q: "Do we need surge pricing?",
        a: "Yes, and it is a separate system reading supply and demand per area. It is worth scoping as its own pipeline rather than smuggling it into matching, because it operates on a different time scale and has different correctness requirements.",
      },
    ],
    requirements: {
      functional: [
        "Track online drivers' positions and availability in near real time",
        "Match a rider's request to a suitable nearby driver with an accurate ETA",
        "Run a trip through its lifecycle: accepted, arriving, in progress, completed",
        "Price the trip and charge reliably, including during network failures",
      ],
      nonFunctional: [
        "Match within a few seconds",
        "A trip must never be lost or double-charged",
        "Location updates are high volume, lossy-tolerant and never persisted on the hot path",
        "A city outage must not affect other cities",
      ],
    },
    math: [
      {
        label: "Driver location writes",
        expr: "5 M online drivers ÷ 4 s",
        result: "≈ 1.25 M writes/s",
        note: "The largest number in the system by far, and entirely in-memory with a TTL. Persisting it would be a database problem in its own right.",
      },
      {
        label: "Trip requests",
        expr: "25 M trips/day ÷ 10⁵",
        result: "≈ 250/s, peak ~1,500/s",
        note: "Four orders of magnitude smaller than location writes. The transactional system is small; the telemetry system is huge.",
      },
      {
        label: "Candidate search",
        expr: "one cell + neighbours in a dense city",
        result: "≈ 50–200 drivers",
        note: "Small enough to score exactly, which is what makes richer matching than 'nearest' affordable.",
      },
      {
        label: "Batching window",
        expr: "collect requests for ~2–5 s, then solve",
        result: "10–30% better overall ETAs",
        note: "The counterintuitive result: a short deliberate delay produces better outcomes than instant greedy dispatch.",
      },
      {
        label: "Per-city independence",
        expr: "25 M trips ÷ ~1,000 cities",
        result: "≈ 25 K trips/city/day",
        note: "Each city is a modest system. Sharding by city is the single most effective scaling decision available.",
      },
    ],
    apis: [
      {
        method: "WS",
        path: "/v1/driver/location",
        desc: "Driver pushes position every few seconds over a persistent socket",
      },
      {
        method: "POST",
        path: "/v1/trips/requests",
        desc: "Rider requests a ride — pickup, destination, product; returns a request id to poll or stream",
      },
      {
        method: "POST",
        path: "/v1/trips/{id}/offer/accept",
        desc: "Driver accepts; conditional so only one driver can win an offer",
      },
      {
        method: "POST",
        path: "/v1/trips/{id}/events",
        desc: "State transitions — arrived, started, completed; idempotent, client-buffered when offline",
      },
      {
        method: "GET",
        path: "/v1/trips/{id}/stream",
        desc: "Rider's live view of driver position and ETA",
      },
      {
        method: "GET",
        path: "/v1/pricing/quote",
        desc: "Fare estimate including any surge multiplier for the area",
      },
    ],
    dataModel: [
      {
        entity: "driver_locations",
        fields: [
          "driver_id (pk)",
          "lat, lng, heading, cell_id (idx)",
          "status (offline|available|offered|on_trip)",
          "TTL ≈ 30 s",
          "→ in memory only; never written to durable storage",
        ],
      },
      {
        entity: "trips",
        fields: [
          "trip_id (pk)",
          "rider_id, driver_id (idx)",
          "state (requested|matched|arriving|in_progress|completed|cancelled)",
          "pickup, dropoff, requested_at",
          "fare_cents, surge_multiplier",
          "→ durable, transactional, the source of truth",
        ],
      },
      {
        entity: "trip_events",
        fields: [
          "trip_id (idx)",
          "event_id (pk, client-generated for idempotency)",
          "type, occurred_at, received_at",
          "→ append-only; the client buffers these when offline",
        ],
      },
      {
        entity: "offers",
        fields: [
          "offer_id (pk)",
          "trip_id, driver_id",
          "expires_at (~15 s)",
          "state (pending|accepted|declined|expired)",
        ],
      },
      {
        entity: "area_demand",
        fields: [
          "cell_id (pk), window (pk)",
          "open_requests, available_drivers",
          "→ feeds surge pricing",
        ],
      },
    ],
    architecture: [
      {
        heading: "Two systems with opposite requirements",
        lede: "Telemetry is huge and disposable; trips are small and sacred.",
        diagram: {
          kind: "system",
          caption: "Never let the volume of the left column dictate the guarantees of the right.",
          columns: [
            {
              title: "Telemetry (1.25 M/s)",
              nodes: [
                { id: "ws", label: "Location gateway", sub: "sticky sockets" },
                { id: "geo", label: "Geo index", sub: "cell → drivers, TTL", tone: "accent" },
                { id: "eta", label: "ETA service", sub: "road-aware" },
              ],
            },
            {
              title: "Matching (250/s)",
              nodes: [
                { id: "batch", label: "Batcher", sub: "~3 s windows" },
                { id: "solve", label: "Assignment solver", sub: "global, not greedy" },
                { id: "offer", label: "Offer manager", sub: "15 s, one winner" },
              ],
            },
            {
              title: "Trips (250/s, durable)",
              nodes: [
                { id: "sm", label: "Trip state machine", sub: "transactional", tone: "ok" },
                { id: "pay", label: "Payments", sub: "idempotent" },
                { id: "hist", label: "History", sub: "receipts, disputes" },
              ],
            },
          ],
        },
        bullets: [
          "Driver positions live in memory keyed by cell with a TTL, exactly as in nearby-friends — a driver whose phone dies simply expires rather than needing an explicit offline event.",
          "The trip record is transactional and durable. It is the one thing in the system that must never be lost, and it is small enough that this is easy.",
          "Shard everything by city. It gives natural isolation, keeps geo queries local, and means an incident in one market cannot cascade globally.",
          "Persist a sampled trip route for receipts and disputes, written asynchronously — that is a product requirement, not part of the matching path.",
        ],
      },
      {
        heading: "Matching: why nearest-driver is the wrong algorithm",
        lede: "The insight the question is really testing.",
        diagram: {
          kind: "compare",
          caption: "Greedy is locally optimal and globally worse.",
          options: [
            {
              title: "Greedy nearest",
              sub: "dispatch each request the moment it arrives",
              good: ["Trivial to implement", "Lowest possible latency to first offer"],
              bad: [
                "Takes the driver who was also the only good option for a nearby request",
                "Produces worse average ETAs across the set of waiting riders",
                "No ability to trade one rider's small loss for another's large gain",
              ],
              verdict: "Fine at low density; measurably worse when several requests overlap.",
            },
            {
              title: "Batched assignment",
              sub: "collect a few seconds of requests, solve together",
              tone: "ok",
              good: [
                "Minimises total waiting time across all riders in the window",
                "Can weight for fairness, driver earnings and trip length",
                "Hungarian algorithm or min-cost flow on a small matrix is fast",
              ],
              bad: [
                "Adds a few seconds before the first offer",
                "More complex and harder to explain to drivers",
              ],
              verdict:
                "The right answer, and the trade is explicitly a small latency cost for a large efficiency gain.",
            },
          ],
        },
        code: {
          title: "The matrix is small because geography already pruned it",
          lang: "ts",
          source: `async function matchBatch(requests: TripRequest[]) {
  // Candidates come from the geo index: the pickup cell plus neighbours.
  // This is what keeps the assignment problem tiny — tens of drivers per
  // request, not five million.
  const candidates = await Promise.all(
    requests.map((r) => geoIndex.availableNear(r.pickup, { radiusM: 3000 })),
  );

  // Cost is ROAD ETA, never straight-line distance. A driver 200 m away
  // across a river with no bridge is not close in any useful sense.
  const cost = await buildCostMatrix(requests, candidates, {
    eta: etaService,
    penalties: { longIdle: -0.2, lowRating: +0.1, wrongProduct: Infinity },
  });

  // Minimise TOTAL cost, not each row independently. This is the whole point:
  // one rider waits 30 s longer so another waits three minutes less.
  const assignment = hungarian(cost);

  // Offers are exclusive and expire. A driver who does not respond in ~15 s
  // releases the offer and the request re-enters the next batch.
  return Promise.all(assignment.map(({ request, driver }) =>
    offers.create({ tripId: request.id, driverId: driver.id, ttlMs: 15_000 }),
  ));
}`,
        },
        bullets: [
          "Cost must be road-network ETA rather than straight-line distance. Straight-line distance is wrong across rivers, motorways and one-way systems, and it is the most common simplification that makes a design sound naive.",
          "Offers are exclusive and time-boxed. Broadcasting one request to several drivers produces a race, duplicated acceptances and an unhappy loser — the offer must be a lock with a TTL.",
          "A declined or expired offer returns the request to the next batch with a raised priority, so nobody waits indefinitely because they keep losing assignments.",
          "The objective is a product decision that engineering must keep tunable: pure ETA, driver earnings fairness, or a blend. Hard-coding it is how a system becomes impossible to adjust when the market changes.",
        ],
        callout: {
          kind: "interview",
          title: "The sentence to say",
          text: '"I would not dispatch the nearest driver on each request independently. Batching a few seconds of requests and solving the assignment globally gives materially better ETAs overall, because greedy matching regularly takes the driver who was the only good option for somebody else. The cost is a few seconds before the first offer, which is well inside the latency budget."',
        },
      },
    ],
    deepDives: [
      {
        heading: "The trip state machine and the tunnel problem",
        lede: "A driver loses signal for ten minutes mid-trip. The trip must be fine.",
        diagram: {
          kind: "sequence",
          caption: "The client buffers; the server deduplicates by event id.",
          actors: [
            { id: "d", label: "Driver app" },
            { id: "api", label: "Trip service" },
            { id: "db", label: "Trip store" },
            { id: "r", label: "Rider app" },
          ],
          messages: [
            { from: "d", to: "api", label: "1. event: started (id: e-91)", kind: "call" },
            { from: "api", to: "db", label: "2. requested→in_progress, record e-91", kind: "call" },
            {
              from: "d",
              to: "d",
              label: "3. …enters tunnel, buffers events locally",
              kind: "self",
              tone: "warn",
            },
            {
              from: "d",
              to: "api",
              label: "4. on reconnect: replay e-92, e-93, e-94",
              kind: "call",
            },
            {
              from: "api",
              to: "api",
              label: "5. dedupe by event id; apply in occurred_at order",
              kind: "self",
              tone: "accent",
            },
            { from: "api", to: "db", label: "6. in_progress → completed", kind: "call" },
            { from: "api", to: "r", label: "7. rider sees completion", kind: "async", tone: "ok" },
          ],
        },
        bullets: [
          'Client-generated event ids make replay safe. Without them, a retried "trip completed" can produce a second charge, which is the worst failure this system has.',
          "Record both when the event occurred and when it was received. The occurrence time is what the fare and the receipt are based on; the receipt time is only for diagnostics.",
          'Transitions must be validated against the current state, so a replayed "started" on a completed trip is rejected rather than resurrecting it. An explicit state machine, not a status column updated ad hoc.',
          'The rider\'s view should degrade honestly: "connection lost, trip continuing" rather than a frozen map that implies the system knows something it does not.',
        ],
      },
      {
        heading: "Payments without double charges",
        body: [
          "Payment is where correctness actually matters, and it is a distributed transaction across systems that cannot share a commit. The standard resolution is to authorise early, capture once on completion, and make every step idempotent on a key derived from the trip.",
        ],
        table: {
          caption: "Failure modes and what makes each survivable.",
          headers: ["Failure", "Naive outcome", "With idempotency"],
          rows: [
            [
              "Capture request times out",
              "Retry double-charges",
              "Same key → the provider returns the original result",
            ],
            [
              "Trip completed twice by replay",
              "Two captures",
              "State machine rejects the second transition",
            ],
            [
              "Provider succeeds, our write fails",
              "Charged, no record",
              "Reconciliation job matches provider records to trips",
            ],
            [
              "Rider's card declined at completion",
              "Trip in limbo",
              "Trip completes; debt recorded and retried out-of-band",
            ],
          ],
        },
        bullets: [
          "Authorise at trip start for an estimated amount so a card failure surfaces before the ride rather than after it, then capture the final fare on completion.",
          "The idempotency key must be derived from the trip and the operation — not generated per attempt — or retries look like new payments to the provider.",
          "Never block trip completion on payment success. Completing the trip and pursuing the debt separately is both better product behaviour and a simpler failure story than a driver stuck waiting.",
          "Run a reconciliation job against the provider. Distributed systems drift, and the only way to know about a charge with no matching trip is to compare the two ledgers regularly.",
        ],
      },
      {
        heading: "Surge pricing as its own pipeline",
        body: [
          "Surge is a supply-and-demand ratio per area, computed on a rolling window, and it is deliberately separate from matching. Coupling them would mean the matcher's own behaviour feeds back into prices within the same loop, which is unstable.",
        ],
        bullets: [
          "Compute per cell over a window of a few minutes: open requests against available drivers, smoothed so a momentary spike does not produce a visible price jump.",
          "Quote the multiplier and honour it for a short period. A price that changes between the estimate and the confirmation is a trust failure regardless of how defensible the arithmetic is.",
          "Damp and cap. Both a feedback loop — high prices attract drivers, which lowers prices, which sends them away — and the reputational risk of extreme multipliers during emergencies argue for hard limits.",
          "Cell boundaries create visible cliffs where crossing a street changes the price. Smoothing across neighbouring cells is worth the complexity.",
        ],
        callout: {
          kind: "insight",
          text: "Surge is the clearest example of a general principle in this design: the transactional core is small and must be exactly right, while everything around it — telemetry, pricing, ETAs, ranking — is approximate, windowed and recoverable. Keeping those two worlds apart, with queues and snapshots between them, is what makes the system operable.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Batched assignment",
        pickWhen: "Request density is high enough for overlap — any real market at peak",
        cost: "A few seconds before the first offer, and a solver to operate",
      },
      {
        choice: "Greedy nearest",
        pickWhen: "Sparse markets where batching has nothing to optimise over",
        cost: "Measurably worse aggregate ETAs once density rises",
      },
      {
        choice: "In-memory locations with TTL",
        pickWhen: "Always — position data is worthless within a minute",
        cost: "A cache loss blanks the supply view until the next round of pings",
      },
      {
        choice: "Exclusive time-boxed offers",
        pickWhen: "Always",
        cost: "A declined offer costs a full cycle, so TTLs must be short",
      },
      {
        choice: "Shard by city",
        pickWhen: "Always",
        cost: "Cross-city trips and boundary markets need explicit handling",
      },
      {
        choice: "Complete the trip even if payment fails",
        pickWhen: "Always — a driver must not be blocked",
        cost: "Debt collection and reconciliation as separate processes",
      },
    ],
    wrapUp: [
      "Two systems with opposite needs: telemetry at over a million writes a second that is disposable and in-memory, and trips at a few hundred a second that must never be lost.",
      "The matching insight is that greedy nearest-driver dispatch is worse than batching a few seconds of requests and solving the assignment globally — and the cost is a short delay well inside the latency budget.",
      "Cost must be road ETA, not straight-line distance, and offers must be exclusive with a short TTL so two drivers can never accept the same trip.",
      "The trip is an explicit state machine with client-generated event ids, so a driver in a tunnel can buffer and replay without producing duplicate transitions or double charges.",
      "Payments are idempotent on a trip-derived key, authorised early and captured once, and trip completion is never blocked on payment success.",
      "Sharding by city is the most effective scaling decision available, because the problem partitions almost perfectly along that boundary.",
    ],
    followUps: [
      {
        q: "Why not just assign the nearest available driver?",
        a: "Because dispatching each request independently is greedy, and greedy is regularly worse in aggregate. If two requests come in seconds apart and one driver is close to both while another is close to only the second, taking the shared driver for the first request forces the second rider to wait far longer than necessary. Collecting requests over a two-to-five second window and solving the assignment as a whole lets the system trade one rider's small increase for another's large decrease, which measurably improves average wait times. The matrix stays small because geography has already pruned candidates to a few dozen per request, so a Hungarian or min-cost-flow solve is fast. The cost is a few seconds before the first offer, which fits easily in the budget.",
      },
      {
        q: "The driver enters a tunnel for ten minutes mid-trip. What happens?",
        a: "The trip continues, because the server's live view is not the source of truth. The driver's app buffers events locally with client-generated ids and replays them on reconnection, and the server deduplicates by id and applies them in the order they actually occurred rather than the order they arrived. This is why event ids must come from the client: without them, a retried completion event could charge the rider twice. Location pings during the gap are simply lost, which is fine because they expire anyway, and the rider's app should say the connection was lost rather than showing a frozen map that implies knowledge the system does not have. The trip state machine also validates transitions, so a replayed start on an already-completed trip is rejected rather than reopening it.",
      },
      {
        q: "Two drivers accept the same ride. How did that happen and how do you prevent it?",
        a: "It happens when the request is broadcast to multiple drivers and acceptance is a plain write — both see the offer, both accept, and whichever write lands second either overwrites the first or creates a duplicate trip. The prevention is to treat an offer as an exclusive lock rather than a notification: one driver at a time receives an offer with a short expiry, and acceptance is a conditional update that succeeds only if the offer is still pending. If it has expired or been taken, the second acceptance fails cleanly and the driver is told the ride is gone. Broadcasting to several drivers at once can be a deliberate choice in sparse markets to reduce wait times, but then the accept must still be a compare-and-swap so exactly one wins.",
      },
      {
        q: "Where does the driver location data get stored?",
        a: "In memory, with a TTL, and nowhere else on the hot path. At five million online drivers reporting every four seconds that is over a million writes a second for data that is worthless within a minute, so persisting it would be a large database problem solving nothing. Positions are keyed by driver and indexed by cell so the matcher can find candidates near a pickup, and the TTL doubles as the presence mechanism — a driver whose phone dies stops appearing without needing to send an explicit offline event. The one exception is the route of an active trip, which is sampled and written asynchronously because receipts and dispute resolution genuinely need it, but that is a separate, much lower-volume path.",
      },
      {
        q: "The payment fails when the trip completes. What do you do?",
        a: "Complete the trip anyway. Blocking completion means the driver cannot start their next ride because of the rider's card, which is unacceptable, so the trip moves to completed, the outstanding amount is recorded as debt, and collection is retried out of band with the rider prompted to update their payment method before their next trip. The more interesting failure is a timeout rather than a decline, because then the outcome is genuinely unknown and a blind retry risks double-charging — which is why the capture uses an idempotency key derived from the trip, so the provider returns the original result rather than creating a second charge. On top of that I would run a reconciliation job comparing provider records against trips, since the only reliable way to catch a charge with no matching trip is to compare the two ledgers.",
      },
    ],
    related: [
      "/examples/proximity",
      "/examples/nearby-friends",
      "/examples/food-delivery",
      "/examples/google-maps",
      "/hld/websockets",
    ],
    furtherReading: [
      {
        label: "Uber Engineering — marketplace and dispatch",
        href: "https://www.uber.com/en-GB/blog/engineering/",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "tinder",
    title: "Design Tinder",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["geo", "matching", "recommendation", "graph"],
    companies: ["Tinder", "Hinge", "Bumble"],
    summary:
      "Superficially a geo query with a swipe on top, and the interesting details are all in what makes it hard to do well: a deck must never repeat a profile the user has already seen, the mutual-like check has to be race-free without locking, and the recommendation system has an economy problem — a small fraction of profiles absorb most of the likes, so naive ranking by popularity destroys the product for everyone else.",
    clarifying: [
      {
        q: "How is the deck generated — live query or precomputed?",
        a: "Precomputed. Generating candidates on each swipe means a geo query plus a filter plus an exclusion check every few hundred milliseconds; precomputing a deck of a few hundred profiles turns swiping into a pointer increment and makes the experience instant.",
      },
      {
        q: "What does a match mean exactly?",
        a: "Both users liked each other, and the notification must fire exactly once for both. That symmetry is the one piece of genuine concurrency in the design, since both swipes can land at the same instant.",
      },
      {
        q: "How many swipes does an active user make?",
        a: "Around a hundred a day, which makes swipes the dominant write volume — far more than matches or messages. They also must never be lost, because a repeat of an already-swiped profile is the most visible possible bug.",
      },
      {
        q: "Does the user move between sessions?",
        a: "Yes, and a stale deck built for their previous city is useless. So the deck needs a location stamp and must be invalidated when the user moves far enough.",
      },
      {
        q: "Do we need to prevent abuse and enforce safety?",
        a: "Yes — blocking must be absolute and immediate in both directions, and it is a filter that has to be applied at deck generation and again at match time rather than only in the UI.",
      },
    ],
    requirements: {
      functional: [
        "Show a deck of nearby, filter-matching profiles the user has not already seen",
        "Record a like or pass, and detect a mutual like as a match",
        "Notify both users on a match and open a conversation",
        "Respect distance, age and preference filters, and blocks in both directions",
      ],
      nonFunctional: [
        "Swiping feels instant — no network round trip in the critical path",
        "A profile must never appear twice for the same user",
        "Match detection must be exactly-once even when both swipes are simultaneous",
        "Swipes are high volume and must be durable",
      ],
    },
    math: [
      {
        label: "Swipe volume",
        expr: "10 M DAU × 100 swipes ÷ 10⁵",
        result: "≈ 10,000 writes/s, peak ~40,000",
        note: "The dominant write path. Small records, but they must be durable and fast.",
      },
      {
        label: "Match rate",
        expr: "~1–3% of likes are reciprocated",
        result: "≈ 100–300 matches/s",
        note: "Two orders of magnitude below swipes, which is why the expensive work belongs at match time rather than per swipe.",
      },
      {
        label: "Deck size",
        expr: "~300 profiles per build",
        result: "≈ 3 days of swiping",
        note: "Large enough to avoid frequent rebuilds, small enough that it does not go stale before it is consumed.",
      },
      {
        label: "Seen-set memory",
        expr: "10 M users × 10 K swipes × Bloom filter at ~10 bits",
        result: "≈ 125 GB",
        note: "A Bloom filter per user, rather than a set of ids — the exclusion problem is what dominates storage here.",
      },
      {
        label: "Like distribution",
        expr: "top ~10% of profiles receive ~80% of likes",
        result: "extreme skew",
        note: "Which is why ranking purely by popularity collapses the product: most users would never be shown to anyone.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/deck",
        desc: "Fetch the precomputed deck; returns profiles plus a deck token",
      },
      {
        method: "POST",
        path: "/v1/swipes",
        desc: "Batch of {profileId, direction}; idempotent per (user, profile)",
      },
      {
        method: "GET",
        path: "/v1/matches?cursor={}",
        desc: "The user's matches, newest first",
      },
      {
        method: "PUT",
        path: "/v1/preferences",
        desc: "Distance, age range, preferences — a change invalidates the current deck",
      },
      {
        method: "POST",
        path: "/v1/blocks",
        desc: "Block — immediate, symmetric, and applied at both deck build and match time",
      },
    ],
    dataModel: [
      {
        entity: "profiles",
        fields: [
          "user_id (pk)",
          "cell_id (idx), lat, lng",
          "age, preferences (jsonb)",
          "photos[], bio",
          "active_at (idx — inactive users are excluded)",
        ],
      },
      {
        entity: "swipes",
        fields: [
          "swiper_id (pk)",
          "target_id (pk)",
          "direction (like|pass)",
          "created_at",
          "→ sharded by swiper_id; the unique key gives idempotency",
        ],
      },
      {
        entity: "matches",
        fields: [
          "match_id (pk)",
          "user_a, user_b (ordered — a < b, so the pair has one canonical key)",
          "created_at",
          "→ the ordered pair is what makes the mutual-like check race-free",
        ],
      },
      {
        entity: "decks",
        fields: [
          "user_id (pk)",
          "profile_ids[]",
          "built_at, built_at_cell",
          "→ cached; invalidated on move or preference change",
        ],
      },
      {
        entity: "seen_filter",
        fields: [
          "user_id (pk)",
          "bloom_filter (binary)",
          "→ excludes already-swiped profiles at deck build time",
        ],
      },
    ],
    architecture: [
      {
        heading: "Precompute the deck; make swiping local",
        lede: "The product feels fast because the network is not in the loop.",
        diagram: {
          kind: "flow",
          caption: "Building is expensive and rare; swiping is cheap and constant.",
          rows: [
            [
              { id: "geo", label: "Geo candidates", sub: "cell + neighbours" },
              { id: "filt", label: "Filters", sub: "age, prefs, blocks" },
              { id: "seen", label: "Exclude seen", sub: "Bloom filter", tone: "accent" },
            ],
            [
              { id: "rank", label: "Rank + diversify", sub: "not purely by popularity" },
              { id: "deck", label: "Deck of ~300", sub: "cached", tone: "ok" },
              { id: "swipe", label: "Swipe", sub: "local, batched upload" },
            ],
          ],
        },
        bullets: [
          "The client holds the deck and records swipes locally, uploading them in small batches. A swipe therefore never waits on the network, which is the single biggest contributor to how the product feels.",
          "Batched upload must be idempotent per (user, target) so a retry after a dropped connection cannot double-record or, worse, resurrect a profile the user already dismissed.",
          "Rebuild when the deck runs low, when the user moves beyond a threshold, or when preferences change. Each of those invalidates the assumptions the deck was built under.",
          "Exclusion is the expensive part of building: the candidate set must be filtered against everything this user has already swiped, which for a heavy user is tens of thousands of ids.",
        ],
        callout: {
          kind: "insight",
          text: "A Bloom filter is the right structure for the seen-set because its error mode is harmless in exactly the right direction. A false positive means a profile the user never saw is skipped — invisible, since they cannot miss what they do not know exists. A false negative would mean showing a profile twice, which is the bug users actually notice, and Bloom filters cannot produce those.",
        },
      },
      {
        heading: "Matching without a race",
        lede: "Both users can swipe at the same millisecond. The notification must still fire once.",
        diagram: {
          kind: "sequence",
          caption: "An ordered pair key turns a distributed race into a unique constraint.",
          actors: [
            { id: "a", label: "Ana swipes Ben" },
            { id: "b", label: "Ben swipes Ana" },
            { id: "s", label: "Swipe service" },
            { id: "db", label: "Store" },
          ],
          messages: [
            { from: "a", to: "s", label: "1. like(ben)", kind: "call" },
            {
              from: "b",
              to: "s",
              label: "2. like(ana) — same instant",
              kind: "call",
              tone: "warn",
            },
            { from: "s", to: "db", label: "3. insert swipe rows (both succeed)", kind: "call" },
            { from: "s", to: "db", label: "4. both check: did the other like me?", kind: "call" },
            { from: "db", to: "s", label: "5. both see yes", kind: "return", tone: "warn" },
            {
              from: "s",
              to: "db",
              label: "6. INSERT match (min,max) — unique key",
              kind: "call",
              tone: "accent",
            },
            {
              from: "db",
              to: "s",
              label: "7. one insert wins, one conflicts",
              kind: "return",
              tone: "ok",
            },
            {
              from: "s",
              to: "a",
              label: "8. single match notification to both",
              kind: "async",
              tone: "ok",
            },
          ],
        },
        code: {
          title: "The ordered pair is the entire solution",
          lang: "ts",
          source: `async function recordLike(swiper: string, target: string) {
  await db.swipes.upsert({ swiper, target, direction: "like" });

  const reciprocal = await db.swipes.find({ swiper: target, target: swiper });
  if (reciprocal?.direction !== "like") return null;

  // Both sides can reach this line simultaneously. Ordering the pair means
  // both attempt to insert the SAME primary key, so the database — not
  // application logic, not a lock — decides there is exactly one match.
  const [userA, userB] = swiper < target ? [swiper, target] : [target, swiper];

  const created = await db.matches.insertIfAbsent({ userA, userB });

  // Only the winning insert notifies. Without the ordered key, each side would
  // create its own match row and both users would get two notifications for
  // one match — a small bug that is extremely visible.
  return created ? notifyBoth(userA, userB) : null;
}`,
        },
        bullets: [
          "No distributed lock is needed. Deriving a canonical key from the pair turns the race into a uniqueness constraint the database already enforces atomically.",
          "Doing the reciprocal check on every like is affordable because it is a single indexed lookup, and only one to three percent of them proceed any further.",
          "The expensive work — creating a conversation, sending notifications, updating recommendation signals — belongs after the match, where the volume is two orders of magnitude lower.",
          "A block must be checked at match time as well as at deck build, because a block can land between the deck being built and the swipe being processed.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "The economy problem",
        lede: "The hardest part is not technical — it is that attention distributes extremely unevenly.",
        table: {
          caption: "What each ranking strategy does to the marketplace.",
          headers: ["Strategy", "Effect", "Why it fails or works"],
          rows: [
            [
              "Rank by popularity",
              "The top few percent are shown to everyone",
              "Most users are never seen; they leave, and supply collapses",
            ],
            [
              "Pure random",
              "Perfectly fair exposure",
              "Poor relevance; match rate falls and engagement with it",
            ],
            [
              "Reciprocity prediction",
              "Show people likely to like each other back",
              "The right objective — optimises matches, not likes",
            ],
            [
              "Exposure balancing",
              "Cap how often a profile is shown",
              "Protects supply, at some cost to short-term engagement",
            ],
            [
              "Recency / activity weighting",
              "Favour recently active users",
              "Large practical win — a match with an inactive user is worthless",
            ],
          ],
        },
        bullets: [
          "The objective should be predicted mutual interest, not predicted likes. Optimising for likes concentrates attention on a few profiles and produces matches that never convert into conversations.",
          "Exposure needs an explicit cap. Without one, popularity compounds — being shown more produces more likes, which produces more exposure — and the middle of the distribution becomes invisible.",
          "Activity is one of the strongest usable signals: showing someone who has not opened the app in a month wastes a swipe, and filtering on recent activity improves perceived quality immediately.",
          "New users need a deliberate cold-start boost, both because there is no signal to rank them with and because their first session determines whether they stay.",
        ],
        callout: {
          kind: "warn",
          title: "Feedback loops are the failure mode",
          text: "Every ranking decision changes tomorrow's training data. If the model shows popular profiles more, they accumulate more likes, which the model reads as evidence they should be shown more still. Breaking that loop requires deliberate exploration — showing some profiles the model is unsure about — and measuring outcomes on held-out traffic rather than on the feed the model itself produced.",
        },
      },
      {
        heading: "The seen-set, precisely",
        body: [
          "Never showing a profile twice sounds trivial and is the storage-dominant requirement in the system. A user who has swiped fifty thousand times needs every deck build filtered against fifty thousand ids, and there are millions of such users.",
        ],
        table: {
          caption: "Options for the exclusion check.",
          headers: ["Approach", "Memory per heavy user", "Accuracy", "Verdict"],
          rows: [
            ["Full id set in Redis", "~400 KB", "Exact", "Correct but expensive at scale"],
            [
              "Bloom filter",
              "~60 KB",
              "Small false-positive rate",
              "The right trade — errors are invisible",
            ],
            ["Database anti-join at build", "None", "Exact", "Too slow for interactive rebuilds"],
            [
              "Time-windowed set",
              "Bounded",
              "Forgets old swipes",
              "Acceptable only if re-showing is a product choice",
            ],
          ],
        },
        bullets: [
          "Filter at deck build time, not at swipe time. Building is rare and can afford the work; swiping must stay instant.",
          "Bloom filters cannot be resized cleanly, so size for the heaviest users or use a scalable variant that chains filters as the population grows.",
          "Keep the exact swipe rows regardless — they are needed for the reciprocal check and for audit. The Bloom filter is an index over them, not a replacement.",
          "Some products deliberately re-show passed profiles after a long interval, on the reasonable theory that a pass six months ago carries little information. That is a product decision that materially relieves the storage pressure.",
        ],
      },
      {
        heading: "Geography and movement",
        body: [
          "The geo half is the proximity chapter with one difference: users move between sessions but not continuously within one, so this sits between the static business index and the fully live moving-points problem.",
        ],
        bullets: [
          "Index profiles by cell exactly as in the proximity service, and build decks from the user's cell plus neighbours, widening in sparse areas rather than returning a thin deck.",
          "Stamp the deck with the cell it was built for and rebuild when the user moves beyond a threshold — otherwise someone who flies to another city swipes through a deck from home.",
          "Density varies enormously: a dense city yields far more candidates than a rural area, where the radius must expand considerably to fill a deck at all.",
          "Location precision is a safety matter. Show distance in coarse bands rather than exact coordinates, and never expose a position precise enough to locate someone's home.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Precomputed deck",
        pickWhen: "Always — swiping must not wait on the network",
        cost: "Staleness, and rebuild triggers on movement and preference changes",
      },
      {
        choice: "Bloom filter for the seen-set",
        pickWhen: "Heavy users with very large swipe histories",
        cost: "A few profiles silently skipped, which nobody can detect",
      },
      {
        choice: "Ordered-pair match key",
        pickWhen: "Always — it removes the race without a lock",
        cost: "None worth mentioning; this is simply the correct model",
      },
      {
        choice: "Reciprocity-based ranking",
        pickWhen: "Match quality is the objective",
        cost: "A model to train and monitor, plus explicit exploration",
      },
      {
        choice: "Exposure caps",
        pickWhen: "Protecting the marketplace matters more than short-term engagement",
        cost: "Lower immediate engagement metrics",
      },
      {
        choice: "Client-side swipe batching",
        pickWhen: "Always",
        cost: "Idempotency handling and a window where swipes exist only on the device",
      },
    ],
    wrapUp: [
      "Decks are precomputed so swiping is local and instant; the expensive work — geo candidates, filters, exclusion, ranking — happens once per few hundred swipes.",
      "The seen-set is the storage-dominant requirement, and a Bloom filter is the right structure because its only error is silently skipping a profile, never showing one twice.",
      "The mutual-like race is solved by deriving a canonical ordered-pair key, so the database's unique constraint decides there is exactly one match without any locking.",
      "Expensive work belongs at match time, not swipe time — matches are a hundred times rarer than swipes.",
      "The genuinely hard problem is the attention economy: ranking by popularity concentrates exposure and destroys the marketplace, so the objective must be predicted reciprocity with explicit exposure caps.",
      "With more time: fraud and bot detection, photo verification, and the safety features that come with sharing location data between strangers.",
    ],
    followUps: [
      {
        q: "How do you guarantee a user never sees the same profile twice?",
        a: "By filtering candidates against a per-user seen-set at deck build time rather than at swipe time. Storing the exact id set works but is expensive — a heavy user with fifty thousand swipes needs hundreds of kilobytes, across millions of such users — so a Bloom filter is the better structure, because its error mode points the right way. A false positive silently skips a profile the user would never have known about; a false negative would show a duplicate, and Bloom filters cannot produce those. I would keep the exact swipe rows regardless, since the reciprocal check needs them, and treat the filter purely as an index over that data. The main operational wrinkle is that Bloom filters do not resize cleanly, so either size for the heaviest users or use a scalable chained variant.",
      },
      {
        q: "Two people swipe right on each other at exactly the same moment. What happens?",
        a: "Both requests write their own swipe row, both then check whether the other person has liked them, and both see yes — so without care, each side creates a match and both users get two notifications for one match. The clean fix needs no locking: order the two user ids and use the ordered pair as the primary key of the match row. Both sides then attempt to insert the same key, the database accepts exactly one and rejects the other on the unique constraint, and only the winning insert sends notifications. It is a good example of pushing a concurrency problem down to a constraint the storage layer already enforces atomically, rather than reaching for a distributed lock that would be both slower and less reliable.",
      },
      {
        q: "Why precompute the deck instead of querying on each swipe?",
        a: "Because the work per swipe would be substantial and the latency would be felt directly. Each swipe would need a geo query over nearby cells, filtering by age and preferences, exclusion against everything already seen, and ranking — a few hundred milliseconds at best, in a product where the interaction is supposed to feel like flipping through cards. Precomputing a few hundred profiles amortises that over days of swiping and lets the client hold the deck, so a swipe is a local operation with a batched background upload. The cost is staleness, which is why the deck carries the cell it was built for and is rebuilt when the user moves, changes preferences, or runs low.",
      },
      {
        q: "Should you rank profiles by how many likes they receive?",
        a: "No, and this is the most interesting part of the problem. Likes are distributed extremely unevenly, so ranking by popularity shows the same small fraction of profiles to everyone, and the rest are effectively invisible — they get no matches, they leave, and the supply side of the marketplace collapses. It also optimises the wrong thing: the goal is a match, not a like, so the model should predict reciprocal interest, which naturally shows people to others who are plausibly interested in them rather than to everyone. On top of that I would cap exposure explicitly so popularity cannot compound through the feedback loop, weight for recent activity because a match with a dormant account is worthless, and reserve some exploration traffic so the model keeps learning about profiles it is uncertain about.",
      },
      {
        q: "A user flies from London to Tokyo. What happens to their deck?",
        a: "The deck they are carrying is full of profiles in London, which is useless, so it must be invalidated. That is why the deck is stamped with the cell it was built for: on opening the app, the client compares its current location against that stamp and requests a rebuild if it has moved beyond a threshold. The rebuild runs the same pipeline against the new cell and its neighbours. Two details matter here — the threshold should be distance-based rather than a fixed timer, since someone commuting across a city should not trigger a rebuild while an intercity move should; and any swipes still buffered on the device must be uploaded before or alongside the rebuild, or those profiles could reappear in the new deck.",
      },
    ],
    related: [
      "/examples/proximity",
      "/examples/chat",
      "/examples/nearby-friends",
      "/hld/bloom-filters",
      "/hld/caching",
    ],
    furtherReading: [
      {
        label: "algomaster — design Tinder",
        href: "https://algomaster.io/learn/system-design-interviews/design-tinder",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
