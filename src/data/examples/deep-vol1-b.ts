import type { DesignExample } from "@/data/types";

export const vol1DeepB: DesignExample[] = [
  {
    slug: "news-feed",
    title: "Design a News Feed System",
    source: "Volume 1",
    chapter: 11,
    difficulty: "advanced",
    minutes: 24,
    tags: ["fan-out", "feed", "cache", "ranking"],
    companies: ["Facebook", "Twitter/X", "Instagram", "LinkedIn"],
    summary:
      "The feed question is really one question: do you build each user's timeline when someone posts, or when someone reads? Fan-out on write makes reads trivial and writes explosive; fan-out on read does the opposite. The correct answer is a hybrid, and being able to say exactly where the boundary sits is what the interview is testing.",
    clarifying: [
      {
        q: "Chronological or ranked?",
        a: "Assume ranked, but treat ranking as a separate component that scores an already-assembled candidate set. Mixing retrieval and ranking is how feed designs become unexplainable.",
      },
      {
        q: "How many friends or follows does a typical user have, and what is the maximum?",
        a: "Median around 200-300, with a long tail into the millions. That distribution is the entire difficulty — a design that works for the median fails badly at the tail.",
      },
      {
        q: "How fresh must the feed be?",
        a: "Seconds is fine for most content; a few minutes is acceptable for ranked feeds. This is what makes precomputation viable.",
      },
      {
        q: "What is in a feed item?",
        a: "Text plus references to media, not the media itself. Feed storage holds post ids and ranking features; the content is hydrated at read time from a separate store.",
      },
      {
        q: "Read/write ratio?",
        a: "Assume 100:1 or higher — people read far more than they post. That asymmetry is the argument for doing work at write time.",
      },
    ],
    requirements: {
      functional: [
        "Publish a post to followers",
        "Read a personalised feed, paginated",
        "Feed reflects follows and unfollows",
        "Ranking, not purely chronological",
        "Deleted and blocked content disappears from feeds",
      ],
      nonFunctional: [
        "Feed read p99 under 200 ms",
        "New posts visible within seconds for most followers",
        "Availability of reads matters far more than of writes",
        "Cost per feed read must stay flat as the graph grows",
      ],
    },
    math: [
      {
        label: "Read volume",
        expr: "300 M DAU × 10 feed loads/day ÷ 10⁵",
        result: "≈ 30,000 reads/s",
        note: "Peak ≈ 100,000/s. Every one of these must be cheap.",
      },
      {
        label: "Write volume",
        expr: "300 M DAU × 2 posts/day ÷ 10⁵",
        result: "≈ 6,000 posts/s",
        note: "Small — until you multiply by followers.",
      },
      {
        label: "Fan-out amplification",
        expr: "6,000 posts/s × 300 median followers",
        result: "≈ 1.8 M feed writes/s",
        note: "This is the real write load, and it is 300× the post rate.",
      },
      {
        label: "Celebrity case",
        expr: "1 post × 100 M followers",
        result: "100 M writes",
        note: "At 100k writes/s that is 1,000 seconds — nearly 17 minutes for one post. This is why hybrid exists.",
      },
      {
        label: "Feed cache size",
        expr: "300 M users × 800 post ids × 8 B",
        result: "≈ 1.9 TB",
        note: "Only the active fraction needs to be resident — roughly 20% is ~400 GB, a modest Redis cluster.",
      },
    ],
    apis: [
      { method: "POST", path: "/v1/posts", desc: "Publish — returns immediately; fan-out is asynchronous" },
      { method: "GET", path: "/v1/feed?cursor=&limit=20", desc: "The hot read — cursor pagination, never offset" },
      { method: "POST", path: "/v1/follows/{userId}", desc: "Follow — may trigger a partial backfill of the follower's feed" },
      { method: "DELETE", path: "/v1/posts/{id}", desc: "Delete — tombstone; feeds filter at hydration rather than rewriting" },
    ],
    dataModel: [
      {
        entity: "posts",
        fields: ["id (pk, snowflake — time-sortable)", "author_id (idx)", "body", "media_ids[]", "created_at", "deleted_at"],
      },
      { entity: "follows", fields: ["follower_id (pk part)", "followee_id (pk part)", "created_at", "→ also stored reversed for fan-out"] },
      { entity: "feed:{userId}", fields: ["Redis list or sorted set", "post_id + score", "capped at ~800 entries"] },
      { entity: "celebrity_posts", fields: ["author_id (idx)", "post_id", "created_at", "→ pulled at read time, not pushed"] },
    ],
    architecture: [
      {
        heading: "The core decision: push or pull",
        lede: "Both are wrong on their own. Saying why is the answer.",
        diagram: {
          kind: "compare",
          caption: "Where the work happens determines what breaks.",
          options: [
            {
              title: "Fan-out on write (push)",
              sub: "precompute every follower's feed",
              good: [
                "Feed read is a single cache lookup — a few milliseconds",
                "Read cost is constant regardless of how many people you follow",
                "Ranking can be applied incrementally as posts arrive",
              ],
              bad: [
                "A post by a user with 100 M followers is 100 M writes",
                "Wasted work for inactive users who never read",
                "Storage: one copy of every post id per follower",
                "Unfollow and blocking require cleanup across many feeds",
              ],
              verdict: "The default for the vast majority of users.",
            },
            {
              title: "Fan-out on read (pull)",
              sub: "assemble at query time",
              good: [
                "Writing a post is one row, regardless of follower count",
                "No wasted work for inactive readers",
                "Unfollow takes effect immediately with no cleanup",
              ],
              bad: [
                "Reading means querying N followees and merging — slow and variable",
                "Cost grows with how many people you follow",
                "Hard to cache; every read is different",
              ],
              verdict: "Celebrity accounts, and users who follow very few people.",
            },
          ],
        },
        steps: [
          {
            title: "Push for normal users",
            text: "When a user with a follower count below the threshold posts, enqueue a fan-out job that writes the post id into each follower's feed list.",
            detail: "Threshold is typically 10k-100k followers, tuned by measuring the fan-out queue.",
          },
          {
            title: "Pull for celebrities",
            text: "Above the threshold, write nothing to follower feeds. The post lands in a per-author timeline that readers query directly.",
          },
          {
            title: "Merge at read time",
            text: "A feed read takes the precomputed list, plus recent posts from the handful of celebrities this user follows, merges by score, and returns the top N.",
            detail: "The celebrity set per user is small — typically single digits — so this merge is cheap and bounded.",
          },
          {
            title: "Hydrate",
            text: "The merged list is post ids. Multi-get the post bodies and author info from cache, filter deleted and blocked content, and return.",
          },
        ],
        callout: {
          kind: "interview",
          text: "State the threshold as a tunable number and say how you would choose it: measure fan-out queue lag and read latency, and move the boundary until both are acceptable. A hard-coded 'celebrities are over a million followers' is a weaker answer than 'this is a dial with these two metrics on either side'.",
        },
      },
      {
        heading: "The write path",
        diagram: {
          kind: "sequence",
          caption: "The user's request returns before any fan-out happens.",
          actors: [
            { id: "u", label: "Author" },
            { id: "api", label: "Post service" },
            { id: "db", label: "Post store" },
            { id: "q", label: "Fan-out queue" },
            { id: "w", label: "Fan-out workers" },
            { id: "r", label: "Feed cache", sub: "Redis" },
          ],
          messages: [
            { from: "u", to: "api", label: "POST /v1/posts", kind: "call" },
            { from: "api", to: "db", label: "INSERT post + outbox row (one tx)", kind: "call", note: "durable before we promise anything" },
            { from: "api", to: "u", label: "201 {postId}", kind: "return", tone: "ok", note: "~50 ms — user is done" },
            { from: "db", to: "q", label: "relay publishes PostCreated", kind: "async" },
            { from: "q", to: "w", label: "consume", kind: "async" },
            { from: "w", to: "w", label: "load follower ids in batches of 1,000", kind: "self", note: "celebrities short-circuit here" },
            { from: "w", to: "r", label: "pipeline ZADD feed:{follower} score postId", kind: "async", tone: "accent", note: "batched; capped list trims the tail" },
          ],
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
// which matters because the queue is at-least-once.`,
        },
        bullets: [
          "Cap the feed list. An uncapped list for a user who follows thousands of active accounts grows without bound; 800 entries covers far more than anyone scrolls.",
          "Expire feeds for inactive users. Precomputing for someone who has not opened the app in a month is pure waste, and they can be rebuilt on demand.",
          "Batch and pipeline. One Redis round trip per follower would make fan-out network-bound; batches of a thousand make it throughput-bound.",
          "Fan-out is at-least-once, so the operation must be idempotent — adding the same post id twice must not duplicate it, which a sorted set gives for free.",
        ],
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
// and already-seen items, and a page that returns 14 of 20 items looks broken.`,
        },
        bullets: [
          "Cursor pagination on the score, never offset. Offset pagination in a feed that is constantly prepended shows duplicates and skips items.",
          "Filter at hydration, not at fan-out. Deleting a post should not require rewriting a million feed lists — a tombstone plus a read-time filter is far cheaper.",
          "On a feed cache miss, rebuild from the follows graph and recent posts. It is slower but correct, and it is why feed cache eviction is safe.",
          "Keep ranking behind an interface. It changes weekly, and it should be swappable without touching retrieval.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "The celebrity problem in detail",
        body: [
          "A single post from an account with 100 million followers is 100 million writes. Even at 100,000 feed writes per second that is nearly seventeen minutes of queue, during which the fan-out backlog delays everyone else's posts too. That coupling — one celebrity delaying every ordinary user's fan-out — is the real damage.",
        ],
        table: {
          headers: ["Mitigation", "How", "Cost"],
          rows: [
            [
              "Hybrid threshold",
              "Above N followers, do not push at all; readers pull",
              "Read path gains a merge step",
            ],
            [
              "Separate queues by size",
              "Large fan-outs go to their own queue and worker pool",
              "One more thing to operate — but ordinary posts stay fast",
            ],
            [
              "Push only to active followers",
              "Fan out to users seen in the last 7 days; others rebuild on demand",
              "Often removes 70-90% of the work",
            ],
            [
              "Priority by recency of interaction",
              "Push first to followers who engage with this author",
              "Ranking data on the fan-out path",
            ],
            [
              "Rate-limit fan-out per author",
              "Spread one enormous fan-out over minutes",
              "Some followers see the post later — usually acceptable",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "'Push only to active followers' is the highest-leverage mitigation and the one candidates rarely mention. Most followers of any large account are dormant; precomputing feeds they will never read is the majority of the wasted work.",
        },
      },
      {
        heading: "Ranking as a separate stage",
        bullets: [
          "Retrieval produces candidates; ranking orders them. Keeping these separate means you can change the model without touching the feed infrastructure.",
          "Score at write time for a cheap approximation (recency plus author affinity), then re-score the candidate set at read time with fresher signals. The write-time score is what makes the sorted set orderable.",
          "Feature freshness matters more than model sophistication for most products: 'did this user interact with this author in the last day' beats a heavier model with stale inputs.",
          "Diversity and dedupe rules live here too — no more than N posts from one author, suppress near-duplicates, and demote items already shown.",
          "Track 'seen' state per user so a reload does not show the same top items. A Bloom filter or a capped set of recently-shown ids per user is the usual approach.",
        ],
        diagram: {
          kind: "flow",
          caption: "Retrieval is infrastructure; ranking is product. Keep the seam.",
          rows: [
            [
              { id: "push", label: "Pushed feed", sub: "Redis zset", tone: "accent" },
              { id: "pull", label: "Celebrity timelines", sub: "queried live", tone: "accent" },
            ],
            [
              { id: "merge", label: "Merge by score", sub: "candidate set ≈ 3× page" },
              { id: "rank", label: "Ranker", sub: "affinity, recency, engagement", tone: "ok" },
              { id: "filter", label: "Filter", sub: "deleted, blocked, seen", tone: "warn" },
              { id: "hyd", label: "Hydrate", sub: "multi-get bodies + media URLs" },
            ],
          ],
        },
      },
      {
        heading: "Consistency and correctness cases",
        table: {
          headers: ["Event", "Naive behaviour", "What to do instead"],
          rows: [
            [
              "User deletes a post",
              "Rewrite every feed containing it",
              "Tombstone the post; filter at hydration",
            ],
            [
              "User unfollows",
              "Remove that author's posts from the feed list",
              "Filter at read time, and let the entries age out of the capped list",
            ],
            [
              "User blocks someone",
              "Scan and clean feeds",
              "Read-time filter — blocking must be immediate and is rare enough to check per read",
            ],
            [
              "New follow",
              "Wait for the next post",
              "Backfill a page of that author's recent posts into the feed so it feels instant",
            ],
            [
              "Fan-out worker fails mid-job",
              "Some followers have it, some do not",
              "Idempotent writes plus retry from the queue; partial progress is safe",
            ],
            [
              "Feed cache lost entirely",
              "Users see empty feeds",
              "Rebuild on read from follows + recent posts, with rate limiting to protect storage",
            ],
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Fan-out on write",
        pickWhen: "Median users; read-heavy traffic",
        cost: "Write amplification proportional to follower count; storage per follower",
      },
      {
        choice: "Fan-out on read",
        pickWhen: "Celebrity accounts; users following very few people",
        cost: "Slower, more variable reads; harder to cache",
      },
      {
        choice: "Hybrid with a threshold",
        pickWhen: "Any real system",
        cost: "Two code paths and a merge step; a threshold to tune and monitor",
      },
      {
        choice: "Push only to active users",
        pickWhen: "Large dormant follower base (always, at scale)",
        cost: "Cold-start latency for a returning user's first feed load",
      },
      {
        choice: "Chronological feed",
        pickWhen: "Product wants predictability and simplicity",
        cost: "Loses engagement; but removes the entire ranking subsystem",
      },
    ],
    wrapUp: [
      "The design is a hybrid: push for the median user, pull for celebrities, merged at read time — and the threshold between them is a tunable dial with fan-out lag on one side and read latency on the other.",
      "Feed lists hold ids, not content: capped, expiring for inactive users, and hydrated from a separate post cache at read time.",
      "Deletion, blocking and unfollowing are read-time filters, because rewriting millions of feed lists is never the right answer.",
      "The first thing to break is fan-out lag when a very large account posts, which is why large fan-outs get their own queue and worker pool.",
      "With another hour: the ranking pipeline and its feature store, the seen-state tracking, and the media delivery path.",
    ],
    followUps: [
      {
        q: "A user with 100 million followers posts. Walk me through it.",
        a: "Nothing is fanned out. The post lands in their own timeline, and readers who follow them pull it at read time and merge it into their feed. That converts one hundred million writes into a handful of extra reads per feed load, and the number of celebrities any one user follows is small enough that the merge stays cheap. Without that split, a single post would occupy the fan-out queue for a quarter of an hour and delay everyone else's posts.",
      },
      {
        q: "How does a user see a post from someone they just followed?",
        a: "Two mechanisms. New posts arrive normally through fan-out from that moment. For history, I backfill a page of that author's recent posts into the follower's feed at follow time, so the feed feels immediately different rather than slowly filling up. Backfill is bounded — one page, not the author's entire history.",
      },
      {
        q: "The feed cache goes down. What do users see?",
        a: "Slower feeds, not empty ones. On a miss, the read path rebuilds from the follows graph and recent posts, which is more expensive but correct. That means a total cache loss puts substantial load on the post store, so I would rate limit rebuilds and prioritise active sessions. It is also why feed lists must be reconstructible by design — treating them as derived data rather than as the source of truth.",
      },
      {
        q: "How do you keep the feed from showing the same posts on every refresh?",
        a: "Track seen state per user — a capped set or Bloom filter of recently shown post ids — and demote or drop those in ranking. Combined with cursor pagination on the score rather than offsets, that gives stable pagination even though the feed is constantly prepended. Offset pagination in a feed is the classic source of duplicate and skipped items.",
      },
      {
        q: "How would you A/B test a ranking change?",
        a: "Because ranking is a separate stage over an already-assembled candidate set, I can route a percentage of users to a different ranker without touching retrieval. The important part is measuring the right thing — session length and return rate rather than clicks alone — and holding the candidate set constant so the experiment isolates ranking rather than retrieval.",
      },
    ],
    related: ["/hld/caching", "/hld/message-queues", "/examples/instagram", "/hld/sharding"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "chat",
    title: "Design a Chat System",
    source: "Volume 1",
    chapter: 12,
    difficulty: "advanced",
    minutes: 24,
    tags: ["websockets", "presence", "ordering", "delivery"],
    companies: ["WhatsApp", "Slack", "Messenger", "Discord"],
    summary:
      "Chat is the question where the transport is the easy part. What is graded is what happens around it: how messages become durable before delivery, how ordering survives concurrent senders, how presence scales, and what a client does after two hours offline on a bad connection.",
    clarifying: [
      {
        q: "One-to-one, small groups, or large channels?",
        a: "Assume one-to-one plus groups up to a few hundred. Large broadcast channels — hundreds of thousands of members — are a different fan-out problem worth calling out and scoping separately.",
      },
      {
        q: "Is message history persistent?",
        a: "Yes, indefinitely, with the ability to page backwards. That makes the message store the primary system, and the socket merely a delivery optimisation.",
      },
      {
        q: "What delivery guarantees does the product promise?",
        a: "Sent, delivered and read receipts — which means three state transitions per message, each of which must survive a disconnect.",
      },
      {
        q: "End-to-end encryption?",
        a: "Assume not, and say why it changes things: with E2EE the server cannot search, rank or generate previews, and multi-device key management becomes the hardest part of the system.",
      },
      {
        q: "How many concurrent connections?",
        a: "Assume 10 million concurrent. That number, not the message rate, is what sizes the connection tier.",
      },
    ],
    requirements: {
      functional: [
        "Send and receive messages in one-to-one and group conversations",
        "Persistent, pageable history",
        "Delivery and read receipts",
        "Online/offline presence and typing indicators",
        "Push notification when the recipient is offline",
        "Multi-device: every device sees every message",
      ],
      nonFunctional: [
        "Message delivery under 500 ms when both parties are online",
        "No message is ever lost once accepted",
        "Messages in a conversation are consistently ordered for every participant",
        "Reconnect after an outage recovers everything missed",
      ],
    },
    math: [
      {
        label: "Concurrent connections",
        expr: "50 M DAU × 20% concurrent",
        result: "≈ 10 M sockets",
        note: "At ~50k connections per gateway node, that is roughly 200 nodes just to hold connections.",
      },
      {
        label: "Message volume",
        expr: "50 M users × 40 messages/day ÷ 10⁵",
        result: "≈ 20,000 msg/s",
        note: "Peak ×3 ≈ 60,000/s. Modest compared to the connection count.",
      },
      {
        label: "Storage",
        expr: "2 B messages/day × 300 B × 365",
        result: "≈ 220 TB/year",
        note: "Text only. Media goes to object storage and is referenced by id.",
      },
      {
        label: "Presence fan-out",
        expr: "10 M users × 200 contacts × 2 events/day",
        result: "≈ 4 B notifications/day",
        note: "Naive presence broadcast is larger than the message traffic — this is the trap.",
      },
      {
        label: "Group amplification",
        expr: "1 message × 200 members",
        result: "200 deliveries",
        note: "Fine at this size; a 500,000-member channel needs a different model.",
      },
    ],
    apis: [
      { method: "WS", path: "/v1/connect?since={lastEventId}", desc: "Persistent socket; the cursor is what makes reconnect lossless" },
      { method: "SEND", path: "ws: {type: 'send', convId, clientMsgId, text}", desc: "clientMsgId makes retries idempotent" },
      { method: "GET", path: "/v1/conversations/{id}/messages?before=", desc: "History paging — plain HTTP, cursor-based" },
      { method: "POST", path: "/v1/conversations/{id}/read", desc: "Advance the read cursor to a message id" },
      { method: "GET", path: "/v1/presence?userIds=", desc: "Pull presence for a visible set, rather than subscribing to everything" },
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
          "created_at",
        ],
      },
      { entity: "conversation_members", fields: ["conversation_id", "user_id", "joined_at", "last_read_seq", "muted"] },
      { entity: "user_conversations", fields: ["user_id (partition key)", "last_activity_at (clustering, desc)", "conversation_id", "→ the inbox list"] },
      { entity: "presence:{userId}", fields: ["Redis, TTL ~40 s", "gateway_id", "devices[]", "last_seen"] },
      { entity: "delivery_state", fields: ["conversation_id", "message_id", "user_id", "delivered_at", "read_at"] },
    ],
    architecture: [
      {
        heading: "The shape",
        lede: "A thin stateful connection tier in front of stateless services.",
        diagram: {
          kind: "system",
          caption: "Sockets are held by a tier that does nothing else, so business logic can deploy freely.",
          columns: [
            {
              title: "Clients",
              nodes: [
                { id: "m", label: "Mobile", sub: "WebSocket + push" },
                { id: "w", label: "Web", sub: "WebSocket" },
              ],
            },
            {
              title: "Connection tier",
              nodes: [
                { id: "g", label: "Chat gateways ×200", sub: "hold sockets only", tone: "accent" },
                { id: "p", label: "Presence registry", sub: "Redis, TTL heartbeat" },
              ],
            },
            {
              title: "Services",
              nodes: [
                { id: "svc", label: "Message service", sub: "persist, sequence, route", tone: "ok" },
                { id: "not", label: "Notification service", sub: "APNs / FCM" },
              ],
            },
            {
              title: "State",
              nodes: [
                { id: "db", label: "Message store", sub: "partitioned by conversation" },
                { id: "bus", label: "Bus", sub: "per-gateway channels" },
                { id: "s3", label: "Object storage", sub: "media" },
              ],
            },
          ],
        },
        bullets: [
          "The gateway tier holds sockets and does nothing else. It deploys rarely; everything that changes weekly lives behind it and deploys without dropping connections.",
          "Presence is a registry with a TTL, refreshed by heartbeat, mapping user to gateway. A crashed gateway's entries expire rather than pointing at nothing.",
          "Delivery between gateways goes over a bus with a channel per gateway, so a sender's gateway does not need a direct connection to every other.",
        ],
      },
      {
        heading: "Sending a message",
        diagram: {
          kind: "sequence",
          caption: "Durable first, then delivered. The socket is never the storage.",
          actors: [
            { id: "a", label: "Alice", sub: "gateway 1" },
            { id: "g1", label: "Gateway 1" },
            { id: "svc", label: "Message service" },
            { id: "db", label: "Message store" },
            { id: "g2", label: "Gateway 2", sub: "holds Bob" },
          ],
          messages: [
            { from: "a", to: "g1", label: "send {convId, clientMsgId, text}", kind: "call" },
            { from: "g1", to: "svc", label: "persist", kind: "call" },
            { from: "svc", to: "db", label: "assign seq, INSERT (idempotent on clientMsgId)", kind: "call", tone: "accent", note: "sequence assigned per conversation — this is what fixes ordering" },
            { from: "db", to: "svc", label: "seq = 8241", kind: "return" },
            { from: "svc", to: "g1", label: "ack {messageId, seq}", kind: "return", tone: "ok", note: "Alice's client marks it 'sent'" },
            { from: "svc", to: "g2", label: "route to Bob's gateway", kind: "async", note: "presence lookup → gateway 2" },
            { from: "g2", to: "g2", label: "push over Bob's socket", kind: "self", tone: "ok" },
            { from: "g2", to: "svc", label: "delivered receipt", kind: "async", note: "if Bob is offline: push notification, deliver on reconnect" },
          ],
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
// is the source of truth; timestamps are for display only.`,
        },
        callout: {
          kind: "warn",
          text: "Persisting before acknowledging is non-negotiable. If you push over the socket first and store afterwards, a crash between the two loses a message the sender was told had been sent — the one failure users never forgive.",
        },
      },
    ],
    deepDives: [
      {
        heading: "Ordering and the sequence number",
        body: [
          "Two people typing simultaneously in the same conversation produce messages whose relative order is genuinely ambiguous. What must not be ambiguous is that everyone sees the same order — otherwise two participants read a different conversation.",
        ],
        bullets: [
          "A per-conversation monotonic sequence gives total order within the conversation, which is exactly the scope that matters. Global ordering across all conversations is neither needed nor achievable cheaply.",
          "Snowflake ids give approximate time ordering and are useful as message ids, but they do not give a gap-free sequence — and clients rely on gaps to detect missed messages.",
          "The sequence also drives sync: 'give me everything after seq 8241' is one query, and gap detection is arithmetic rather than a set comparison.",
          "The incrementSeq is a per-conversation hot spot. For a very active conversation, that is a single row being updated tens of times per second — acceptable, but worth knowing. Partitioning the store by conversation keeps that contention local.",
        ],
      },
      {
        heading: "Offline delivery and reconnect",
        steps: [
          {
            title: "Client stores its last seen sequence per conversation",
            text: "Persisted locally, so it survives an app restart, not just a reconnect.",
          },
          {
            title: "On connect, send the cursor",
            text: "The gateway pulls everything after that sequence from the message store and streams it before switching to live push.",
            detail: "Bound the catch-up: past some number of missed messages, tell the client to page through history instead of streaming it all.",
          },
          {
            title: "Deliver receipts on the same channel",
            text: "Delivery and read state are messages too, with their own ordering, so a receipt that arrives before the message it refers to must be buffered or ignored.",
          },
          {
            title: "Push notification when offline",
            text: "If presence says no device is connected, hand the message to APNs or FCM. The push carries an id, not the content, when privacy matters — the app fetches it on open.",
          },
          {
            title: "Reconnect with backoff and jitter",
            text: "After a gateway restart, hundreds of thousands of clients try to reconnect simultaneously. Without jitter, they land in the same second and knock over the tier that just came back.",
          },
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

ws.onclose = () => setTimeout(connect, Math.random() * Math.min(30_000, 500 * 2 ** attempt++));`,
        },
        callout: {
          kind: "insight",
          text: "Gap detection is the feature that makes chat feel reliable. Because sequences are contiguous per conversation, a client can notice a missing message on its own and repair without any server-side session state — which is what lets gateways be disposable.",
        },
      },
      {
        heading: "Presence at scale",
        body: [
          "Presence looks trivial and is usually the largest traffic source in a naive design: ten million users times two hundred contacts times a few state changes a day is billions of notifications, dwarfing the actual messages.",
        ],
        table: {
          headers: ["Approach", "Cost", "Verdict"],
          rows: [
            [
              "Broadcast every change to every contact",
              "O(users × contacts) events",
              "Does not scale — this is the trap",
            ],
            [
              "Pull presence for what is on screen",
              "One request per view, batched",
              "Good default: users only see a handful of contacts at a time",
            ],
            [
              "Subscribe to the visible set",
              "Subscriptions bounded by screen size",
              "Best for active chat views; unsubscribe on navigate",
            ],
            [
              "Debounce and coarsen",
              "Suppress flapping; 'last seen 5m ago' instead of exact",
              "Removes most events for a barely noticeable product change",
            ],
            [
              "Heartbeat TTL rather than explicit offline",
              "Key expires if heartbeats stop",
              "Handles crashes and network loss without an offline message",
            ],
          ],
        },
        bullets: [
          "Typing indicators are presence with a much shorter TTL and should be rate limited hard — one event per few seconds per conversation, not per keystroke.",
          "A user with several devices is online if any device is; store a set and let the TTL prune it.",
          "Presence is best-effort. Do not persist it, do not make message delivery depend on it — if presence is wrong, the fallback is a push notification, which is a fine outcome.",
        ],
      },
      {
        heading: "Storage and partitioning",
        bullets: [
          "Partition by conversation_id, clustered by sequence descending. The dominant query — 'the most recent N messages in this conversation' — is then a single-partition read in stored order.",
          "The inbox list ('my conversations, most recent first') is a different access pattern and needs its own table partitioned by user, updated on each message.",
          "A wide-column store (Cassandra, DynamoDB) fits this well: high write volume, known access patterns, no cross-conversation joins.",
          "Very large group channels break the per-conversation partition — a single partition receiving all traffic for a 500,000-member channel is a hotspot. Split by time bucket or treat those as a broadcast product with different mechanics.",
          "Media never goes in the message store: upload to object storage with a signed URL, store the key in the message.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "WebSocket for everything",
        pickWhen: "Bidirectional, low latency, active chat",
        cost: "Stateful gateways: connection registry, deploy complexity, reconnect storms",
      },
      {
        choice: "Long polling fallback",
        pickWhen: "Restrictive networks where sockets are blocked",
        cost: "Higher latency and more connections; worth keeping as a fallback path only",
      },
      {
        choice: "Per-conversation sequence",
        pickWhen: "Always — ordering must be consistent for all participants",
        cost: "A per-conversation counter, and one hot row for very active chats",
      },
      {
        choice: "Pull presence",
        pickWhen: "Large contact graphs",
        cost: "Slightly stale indicators, in exchange for orders of magnitude less traffic",
      },
      {
        choice: "End-to-end encryption",
        pickWhen: "Privacy is the product",
        cost: "No server-side search, previews or moderation; multi-device key management becomes the hardest subsystem",
      },
    ],
    wrapUp: [
      "The socket is a delivery optimisation, not the system: messages are durable and sequenced before anyone is told they were sent.",
      "A per-conversation sequence number gives consistent ordering for all participants and enables gap detection on the client, which is what makes reconnect lossless.",
      "Presence is the hidden scaling problem — pull for the visible set instead of broadcasting, and let heartbeat TTLs handle crashes.",
      "The connection tier is sized by concurrent sockets, not message rate, and it must be thin so business logic can deploy without disconnecting anyone.",
      "With another hour: large broadcast channels, multi-device key management for E2EE, and media upload and delivery.",
    ],
    followUps: [
      {
        q: "How do you guarantee a message is never lost?",
        a: "Persist before acknowledging. The client only marks a message as sent after the server has committed it and returned a sequence number, and the client retries with the same clientMsgId until it gets that ack — so a retry is deduplicated rather than duplicated. Delivery to the recipient is separate and can be retried indefinitely, because the message is already durable.",
      },
      {
        q: "Two people send at the same instant. What order do they see?",
        a: "Both see the order the per-conversation sequence assigned, which is whichever write reached the counter first. The relative order is genuinely arbitrary — there is no meaningful 'true' order for concurrent events — but it is identical for every participant, which is the property that matters. I would not order by timestamp, since clock skew between senders can produce orderings that contradict causality.",
      },
      {
        q: "A user has been offline for two days. What happens when they open the app?",
        a: "They connect with their last sequence per conversation and the server streams everything after it. If the backlog is large I would cap the catch-up and tell the client to page through history over HTTP instead, so a single reconnect does not stream tens of thousands of messages over the socket. Their read cursor also syncs, so unread counts are correct immediately.",
      },
      {
        q: "How do you handle a group with 500,000 members?",
        a: "Not with the same mechanics. Per-conversation partitioning makes that channel a single hotspot, and one message becoming half a million deliveries is a broadcast problem rather than a chat one. I would treat large channels as fan-out on read — members pull recent messages when they open the channel — with push only to members currently viewing it, which is the same hybrid reasoning as a news feed.",
      },
      {
        q: "What happens when a gateway node dies?",
        a: "Its clients' sockets drop and they reconnect with backoff and jitter, landing on other gateways; their presence entries expire by TTL rather than needing cleanup. Nothing is lost, because messages are durable and clients resume from their cursor. The thing to design for is the reconnect storm — without jitter, fifty thousand clients reconnect simultaneously and destabilise the remaining nodes.",
      },
    ],
    related: ["/hld/websockets", "/hld/message-queues", "/examples/notification", "/hld/sharding"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
