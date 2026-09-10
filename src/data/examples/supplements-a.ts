import type { DesignExample } from "@/data/types";

/** Framework sections layered onto the remaining Volume 1 and Volume 2 examples. */
export const supplementsA: Record<string, Partial<DesignExample>> = {
  "consistent-hashing": {
    clarifying: [
      {
        q: "How often do nodes join or leave?",
        a: "Assume routinely — autoscaling, deploys and failures. That frequency is exactly what makes modulo hashing unusable and consistent hashing worth the complexity.",
      },
      {
        q: "Is this for a cache or for a datastore?",
        a: "It matters: for a cache, a remapped key is a miss; for a datastore, it is a data migration. The second case needs a rebalancing plan, not just a hash function.",
      },
      {
        q: "Do all nodes have the same capacity?",
        a: "Assume not. Weighting falls out naturally by giving larger machines more virtual nodes, which is one of the scheme's quieter advantages.",
      },
    ],
    wrapUp: [
      "Modulo hashing remaps ~(N−1)/N of keys on any membership change; consistent hashing remaps ~1/N, which is the difference between a stampede and a busy afternoon.",
      "Virtual nodes are not optional — with one position per node, load varies by 30-40%; with ~150, it is a few percent.",
      "Replication is 'the next R distinct physical nodes clockwise' — the distinct-machine check is what stops all copies landing on one host.",
      "It solves rebalancing, not hotspots: one very popular key still lands on exactly one node.",
      "With another hour: how the ring is distributed (gossip versus a coordination service) and how a stale client ring is detected and corrected.",
    ],
    followUps: [
      {
        q: "How many virtual nodes would you use?",
        a: "Around 100-200 per physical node. That brings load standard deviation down to a few percent, which is close to the practical floor, while keeping the ring small enough that lookup stays a cheap binary search. Below about ten, the distribution is visibly uneven.",
      },
      {
        q: "How do all clients agree on the ring?",
        a: "Either a coordination service holds membership and clients watch it, or nodes gossip it among themselves as Dynamo-style systems do. The subtle failure is a client with a stale ring writing to the wrong node, which systems handle by having requests carry a ring version so a node can reject or forward a misrouted write.",
      },
      {
        q: "Is there a simpler alternative?",
        a: "Rendezvous hashing: for each key, compute hash(key, node) for every node and pick the highest. It is about ten lines, needs no virtual nodes, distributes evenly, and top-R gives replication for free. The cost is O(N) per lookup unless optimised, so it suits smaller clusters.",
      },
    ],
  },

  autocomplete: {
    clarifying: [
      {
        q: "How many suggestions, and how fast?",
        a: "Top five, under 100 ms end to end. That budget is what forces precomputation — you cannot rank the whole corpus per keystroke.",
      },
      {
        q: "Personalised or global?",
        a: "Start global with a personalised layer merged in at query time. Fully personalised suggestions cannot be precomputed per prefix for every user.",
      },
      {
        q: "How fresh must trending queries be?",
        a: "Minutes for trends, hours for the long tail. That split lets the bulk of the index rebuild on a slow cycle while a small hot layer updates continuously.",
      },
    ],
    wrapUp: [
      "The core structure is a trie whose nodes cache their own top-k, so a lookup is a walk to the prefix node and a read — not a subtree scan.",
      "Building is offline and serving is read-only: aggregate query logs into frequencies, build the trie, and swap it in atomically.",
      "Sharding is by prefix, which keeps a query on one shard, with the caveat that common first letters create uneven shards.",
      "Filtering — profanity, personal data, legal removals — happens at build time, not per request.",
      "With another hour: typo tolerance via edit distance or a fuzzy index, and the personalisation merge at query time.",
    ],
    followUps: [
      {
        q: "Why not query the database with a LIKE 'pre%' each keystroke?",
        a: "Because it does not fit the latency budget at scale and it cannot rank. Even with an index, a prefix scan over a large corpus plus a sort by frequency per keystroke is far more work than reading a precomputed top-k from a trie node. The whole design exists to move that work offline.",
      },
      {
        q: "How do you update the index when a query trends?",
        a: "Two layers. The main trie is rebuilt on a slow cycle from aggregated logs and swapped in atomically. A small hot layer, updated from a streaming aggregation over the last few minutes, is merged at query time. That gives minute-level freshness for trends without rebuilding a large structure constantly.",
      },
      {
        q: "How do you shard it?",
        a: "By prefix, so a query touches one shard and no scatter-gather is needed. The problem is that prefixes are not uniformly distributed, so I would shard on a hash of the first two or three characters with explicit splitting of the heaviest ranges, and monitor per-shard load rather than assuming evenness.",
      },
    ],
  },

  "google-drive": {
    clarifying: [
      {
        q: "Do we need real-time collaborative editing?",
        a: "No — that is a different problem. Assume file sync: upload, download, share, version history and conflict handling when two devices edit offline.",
      },
      {
        q: "How large can files be, and how much changes per edit?",
        a: "Files up to several gigabytes, with small edits common. That combination is the entire argument for block-level sync rather than whole-file upload.",
      },
      {
        q: "How many devices per user?",
        a: "Several, often with one offline for long periods. Offline-then-reconnect is the case that generates conflicts and must be designed for, not patched later.",
      },
    ],
    wrapUp: [
      "Files are split into content-addressed blocks, so an edit uploads only the changed blocks and identical blocks across users are stored once.",
      "Metadata and content are separate systems: a transactional store for the file tree and versions, object storage for the blocks.",
      "Sync is a cursor over a per-user change log, which makes reconnect after days offline a bounded query rather than a full comparison.",
      "Conflicts are resolved by keeping both versions rather than silently choosing — losing a user's edit is worse than an awkward filename.",
      "With another hour: sharing and permission propagation across a deep folder tree, and the delta algorithm for very large binary files.",
    ],
    followUps: [
      {
        q: "A user edits a 1 GB file by changing one paragraph. What is uploaded?",
        a: "Only the affected blocks. The client chunks the file — ideally with content-defined boundaries so an insertion does not shift every subsequent block — hashes each chunk, and asks the server which hashes it already has. A small edit becomes a few megabytes at most, and the unchanged blocks are simply referenced by the new version.",
      },
      {
        q: "Two devices edit the same file while offline. What happens?",
        a: "Both sync when they reconnect, and the second one to arrive detects that the base version it edited is no longer current. Rather than merging binary content or picking a winner, I keep both — the second becomes a conflicted copy attributed to that device — and surface it to the user. Automatic merging is only safe for formats the system understands.",
      },
      {
        q: "How does a client know what changed while it was offline?",
        a: "A per-user change log with a monotonic cursor. The client stores its position and asks for everything after it, which is one query regardless of how long it was away. Comparing full file trees would be far more expensive and would not tell you the order changes happened in.",
      },
    ],
  },

  proximity: {
    clarifying: [
      {
        q: "What radius, and how dense is the data?",
        a: "Typically a few kilometres in dense cities. Density is what matters — a fixed grid that works in a rural area returns tens of thousands of results downtown.",
      },
      {
        q: "How often do the indexed items move?",
        a: "For businesses, almost never — which allows a precomputed index. Moving objects (drivers, friends) are a different problem with a much higher write rate.",
      },
      {
        q: "Is exactness required?",
        a: "No. 'Nearby' is inherently fuzzy, which permits approximate spatial indexing and makes the problem tractable.",
      },
    ],
    wrapUp: [
      "Spatial indexing turns a two-dimensional range query into a one-dimensional prefix or key lookup: geohash and quadtrees are the two standard answers.",
      "Geohash is simple and maps cleanly onto any key-value store, at the cost of edge cases at cell boundaries — always query neighbouring cells too.",
      "Quadtrees adapt to density, which is why they handle a city centre and a rural area with the same structure.",
      "The read path is cache-friendly because business locations rarely change; the index can be rebuilt offline and served read-only.",
      "With another hour: ranking within the radius (distance, rating, opening hours) and the moving-object variant.",
    ],
    followUps: [
      {
        q: "Geohash or quadtree?",
        a: "Geohash when the store is a plain key-value or a relational index and I want prefix queries with no custom structure — it is simple and shards naturally. Quadtree when density varies dramatically, because it subdivides only where objects are dense, so a query in a city centre and one in the countryside cost about the same. Geohash's fixed grid does not adapt that way.",
      },
      {
        q: "What is the boundary problem, and how do you fix it?",
        a: "Two points a metre apart can fall in different cells with completely different prefixes, so a naive single-cell query misses the nearest result. The standard fix is to query the target cell plus its eight neighbours and filter by true distance afterwards. It is cheap and it is the detail that separates a working implementation from a subtly broken one.",
      },
      {
        q: "How would this change for moving objects?",
        a: "The write rate dominates instead of the read rate — thousands of location updates per second rather than a mostly static index. I would keep current positions in memory or in Redis keyed by cell, accept that the index is a few seconds stale, and avoid persisting every update. Precomputed static indexes stop making sense once the data moves.",
      },
    ],
  },

  "nearby-friends": {
    clarifying: [
      {
        q: "How often do clients report location?",
        a: "Every 10-30 seconds while the feature is active. That interval directly sets the write volume and is the first thing to negotiate down if the numbers do not work.",
      },
      {
        q: "How fresh must a friend's position be?",
        a: "Seconds. This is the case where staleness is visible to users — a friend shown two blocks away who left ten minutes ago is a bug in their eyes.",
      },
      {
        q: "How large is a typical friend list?",
        a: "A few hundred. That bound is what makes per-user fan-out feasible rather than requiring a global spatial join.",
      },
    ],
    wrapUp: [
      "Location updates are high-volume, short-lived and tolerant of loss — so they live in memory with a TTL rather than in a durable store.",
      "Fan-out is bounded by the friend list, which means a pub/sub channel per user rather than a spatial query per update.",
      "A subscriber only cares about friends currently nearby, so the subscription set is filtered by distance and refreshed as people move.",
      "Presence and location share a design: heartbeat with TTL, so a crashed client expires rather than needing an explicit goodbye.",
      "With another hour: battery-aware update intervals on the client, and privacy controls including precise-versus-approximate sharing.",
    ],
    followUps: [
      {
        q: "Do you persist every location update?",
        a: "No. At this volume that would be an enormous write rate for data that is worthless a minute later. Current positions live in Redis with a TTL, so a client that stops reporting simply disappears. If location history is a separate product requirement, it goes to a time-series or analytics store on a sampled basis, not on the hot path.",
      },
      {
        q: "How does a user learn a friend moved nearby?",
        a: "Each user has a channel, and when their location changes, the update is published to the channels of friends who are within the relevant radius. Because friend lists are bounded at a few hundred, that fan-out is small. The alternative — a spatial query per update across all users — would be far more expensive and mostly wasted.",
      },
      {
        q: "What happens when a user goes offline?",
        a: "Their location key expires by TTL and they stop appearing. That is better than an explicit offline message, because a crashed app or a lost network never sends one. I would show 'last seen' rather than removing them instantly, which is both friendlier and more honest about what the system actually knows.",
      },
    ],
  },

  "google-maps": {
    clarifying: [
      {
        q: "Rendering, routing, or both?",
        a: "Both, and they are separate systems: tile serving is a CDN problem, routing is a graph problem. Say which you are going deep on rather than covering both shallowly.",
      },
      {
        q: "Does routing need live traffic?",
        a: "Yes — that turns a static shortest-path problem into one where edge weights change continuously, which is what makes precomputation hard.",
      },
      {
        q: "What area and what precision?",
        a: "Global, with street-level precision. That scale is why the road graph must be partitioned and why hierarchical routing exists.",
      },
    ],
    wrapUp: [
      "Map tiles are static, pyramidal and immutable per version — pure CDN content, which is why maps feel instant.",
      "Routing is a graph search over a partitioned road network, made tractable by hierarchy: local roads near the endpoints, motorways in between.",
      "Precomputation (contraction hierarchies) makes queries fast but must be rebuilt when weights change, which is the tension live traffic creates.",
      "Traffic is a separate real-time pipeline feeding edge weights, updated on a cycle rather than per request.",
      "With another hour: ETA prediction as a learned model, and turn-by-turn rerouting when a driver deviates.",
    ],
    followUps: [
      {
        q: "How do you make routing fast on a global graph?",
        a: "Hierarchy. A plain Dijkstra over hundreds of millions of edges is far too slow, so the graph is preprocessed into levels — contraction hierarchies or similar — and the search expands local roads near the endpoints while travelling along the highest level in between. That turns a continental route into a search over a few thousand nodes instead of millions.",
      },
      {
        q: "How does live traffic fit into that?",
        a: "It changes edge weights, which invalidates precomputation — the central tension in this design. In practice the hierarchy is rebuilt on a cycle rather than per update, and live conditions are applied as adjustments on top during the query, with full rebuilds happening periodically. Perfect freshness and full precomputation are not simultaneously achievable.",
      },
      {
        q: "Why are map tiles so fast?",
        a: "Because they are static files. A tile at a given zoom, x and y for a given map version never changes, so it can be cached immutably at the edge and in the browser. Updating the map produces a new version and therefore new URLs, which means there is nothing to invalidate. It is the same content-hashing pattern as static assets, applied to a pyramid of images.",
      },
    ],
  },
};
