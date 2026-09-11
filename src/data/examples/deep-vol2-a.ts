import type { DesignExample } from "@/data/types";

export const vol2DeepA: DesignExample[] = [
  {
    slug: "proximity",
    title: "Design a Proximity Service",
    source: "Volume 2",
    chapter: 1,
    difficulty: "intermediate",
    minutes: 20,
    tags: ["geo", "geohash", "quadtree", "s2", "yelp"],
    companies: ["Yelp", "Google Maps", "Foursquare", "Uber"],
    summary:
      '"Restaurants within 5 km of me" is a range query on two dimensions, and databases are built for one. Every workable answer does the same trick: convert two dimensions into one by cutting the earth into cells with a name, so a spatial query becomes an ordinary key lookup on a handful of cell ids. The design work is choosing how those cells are shaped, how many you fetch to cover a circle, and what happens at the seams between them.',
    clarifying: [
      {
        q: "Is the radius fixed or arbitrary?",
        a: "If the product offers a few presets — 500 m, 1 km, 5 km, 20 km — I can precompute the cell coverage for each and the query becomes trivial. Arbitrary radii mean computing a covering at request time. I would push hard for presets, because it is a large simplification for almost no product cost.",
      },
      {
        q: "How dense can businesses get?",
        a: "Manhattan has thousands in a square kilometre; rural Montana has none for fifty. That range is the whole argument between fixed-size cells and adaptive ones, so it is worth establishing before picking an index.",
      },
      {
        q: "How often does a business location change?",
        a: "Almost never — a restaurant does not move. That is what separates this from nearby-friends: the index is essentially read-only, so I can afford an index that is expensive to build and cheap to query.",
      },
      {
        q: "What filters apply — cuisine, open now, rating?",
        a: "Yes, and where they are applied matters. Filtering after the geo fetch is simple but can return too few results; filtering inside the index means a combinatorial explosion of indexes. I will fetch by geography and filter in memory, then widen the radius if the result set is too small.",
      },
      {
        q: "Is it acceptable to return approximate results?",
        a: "For ranking, yes. But the returned set must not contain anything outside the radius — a result 8 km away when the user asked for 5 is a visible bug. So the cell fetch over-fetches deliberately and an exact distance filter runs afterwards.",
      },
    ],
    requirements: {
      functional: [
        "Return businesses within a radius of a point, ranked by distance and rating",
        "Support filters — category, price, open now",
        "Add, update and remove a business, including a change of location",
        "Work worldwide, including in extremely dense and extremely sparse regions",
      ],
      nonFunctional: [
        "p99 under 200 ms for the search path",
        "Read-heavy by orders of magnitude; the index is nearly static",
        "No false positives outside the radius; approximate ranking is acceptable",
        "Even load despite wildly uneven geographic distribution of both data and traffic",
      ],
    },
    math: [
      {
        label: "Search volume",
        expr: "100 M DAU × 5 searches/day ÷ 10⁵",
        result: "≈ 5,000 QPS",
        note: "Peak ×4 ≈ 20,000 QPS, heavily concentrated in city centres at lunchtime. Cacheable, because many people search the same cells.",
      },
      {
        label: "Index size",
        expr: "200 M businesses × ~1 KB",
        result: "≈ 200 GB",
        note: "Small enough to shard across a modest cluster, and the geo index itself (cell → id list) is a fraction of that.",
      },
      {
        label: "Geohash precision",
        expr: "each character ≈ ÷32 area",
        result: "5 chars ≈ 5 km, 6 ≈ 1.2 km, 7 ≈ 150 m",
        note: "Precision 6 is the usual working cell for a city search — small enough to be selective, large enough that a 1 km circle needs only a handful.",
      },
      {
        label: "Cells to cover a circle",
        expr: "target cell ≈ radius, plus its ring of neighbours",
        result: "typically 4–9 cells",
        note: "Nine is the number to quote: the containing cell plus its eight neighbours reliably covers a circle whose radius is at most the cell size.",
      },
      {
        label: "Over-fetch cost",
        expr: "9 cells × ~200 businesses/cell in a dense city",
        result: "≈ 1,800 candidates → filter to ~50",
        note: "Cheap in memory, and the exact Haversine filter on 1,800 points is microseconds. The alternative — a scan of 200 M rows — is not.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/search?lat={}&lng={}&radius={}&category={}&limit=50",
        desc: "The hot path — cell covering, fetch, exact-distance filter, rank",
      },
      {
        method: "GET",
        path: "/v1/businesses/{id}",
        desc: "Detail view; separate from search so the search payload stays small",
      },
      {
        method: "POST",
        path: "/v1/businesses",
        desc: "Create — computes cell ids on write and inserts into the geo index",
      },
      {
        method: "PUT",
        path: "/v1/businesses/{id}",
        desc: "Update; a location change is a delete-then-insert across two cells",
      },
      {
        method: "DELETE",
        path: "/v1/businesses/{id}",
        desc: "Remove from both the business table and every cell index it appears in",
      },
    ],
    dataModel: [
      {
        entity: "businesses",
        fields: [
          "business_id (pk)",
          "name, category, price_tier",
          "lat, lng (float)",
          "rating, review_count",
          "hours (jsonb, for 'open now')",
          "→ the source of truth; sharded by business_id",
        ],
      },
      {
        entity: "geo_index",
        fields: [
          "cell_id (pk, geohash or S2 token)",
          "business_id (pk)",
          "→ the entire spatial index: a plain two-column table",
          "→ sharded by cell_id prefix so a city stays together",
        ],
      },
      {
        entity: "cell_stats",
        fields: [
          "cell_id (pk)",
          "count",
          "→ drives adaptive precision: dense cells are queried at finer resolution",
        ],
      },
    ],
    architecture: [
      {
        heading: "Turning two dimensions into one",
        lede: "Every index here is the same idea with different geometry.",
        diagram: {
          kind: "compare",
          caption: "Pick one and be able to say why the other two lose.",
          options: [
            {
              title: "Geohash",
              sub: "interleave lat/lng bits → Base32 string",
              tone: "ok",
              good: [
                "A cell is just a string, so any database can index it — no special support needed",
                "Prefixes are a hierarchy: trim a character to zoom out",
                "Trivial to shard, trivial to cache, trivial to debug",
              ],
              bad: [
                "Fixed grid — cells do not adapt to density",
                "Neighbouring cells can have completely different prefixes near boundaries",
                "Cells are not equal area; they distort badly towards the poles",
              ],
              verdict:
                "The right default, and the right answer to give first — it works on infrastructure you already have.",
            },
            {
              title: "Quadtree",
              sub: "recursively split until a cell holds < k points",
              good: [
                "Adapts to density automatically — Manhattan subdivides, the desert does not",
                "Bounded points per leaf gives predictable query cost",
              ],
              bad: [
                "An in-memory tree that must be built and rebuilt, not a database index",
                "Rebalancing on updates, and the whole structure must be replicated per server",
              ],
              verdict:
                "When density varies enormously and the dataset is static enough to rebuild periodically.",
            },
            {
              title: "S2 / H3",
              sub: "spherical cells — S2 on a cube projection, H3 hexagonal",
              good: [
                "Near-equal area anywhere on the globe, unlike a lat/lng grid",
                "S2 cell ids are 64-bit integers on a space-filling curve — excellent locality",
                "H3's hexagons have uniform neighbour distance, which matters for coverage",
              ],
              bad: ["A real library dependency", "Harder to reason about by hand in an interview"],
              verdict:
                "What production geo systems actually use. Name it, say why, then design with geohash for clarity.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "Lead with the reframing",
          text: '"A B-tree indexes one dimension. Latitude and longitude are two, and indexing them separately is useless — a query for a box intersects two huge ranges. So I map 2D to 1D with a space-filling curve, which is what a geohash is: nearby points usually share a prefix, so a spatial query becomes a prefix lookup." That sentence is the whole chapter.',
        },
      },
      {
        heading: "The read path",
        lede: "Cover, fetch, filter, rank — and the filter is not optional.",
        diagram: {
          kind: "sequence",
          caption: "Over-fetch on purpose, then be exact in memory.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "Search service" },
            { id: "cache", label: "Cache", sub: "cell → ids" },
            { id: "db", label: "Geo index + businesses" },
          ],
          messages: [
            {
              from: "c",
              to: "api",
              label: "1. lat, lng, radius=1km, category=pizza",
              kind: "call",
            },
            {
              from: "api",
              to: "api",
              label: "2. cover circle → 9 geohash cells",
              kind: "self",
              tone: "accent",
            },
            { from: "api", to: "cache", label: "3. mget the 9 cells", kind: "call" },
            { from: "cache", to: "api", label: "4. 7 hits, 2 misses", kind: "return" },
            { from: "api", to: "db", label: "5. fetch the 2 missing cells", kind: "call" },
            { from: "db", to: "api", label: "6. ~1,800 candidate ids", kind: "return" },
            {
              from: "api",
              to: "api",
              label: "7. Haversine filter → drop the corners",
              kind: "self",
              tone: "warn",
            },
            {
              from: "api",
              to: "api",
              label: "8. apply category + open-now, rank, take 50",
              kind: "self",
            },
            { from: "api", to: "c", label: "9. 50 results", kind: "return", tone: "ok" },
          ],
        },
        code: {
          title: "Covering a circle, and why the exact filter must follow",
          lang: "ts",
          source: `function search(lat: number, lng: number, radiusM: number, limit = 50) {
  // Choose a precision whose cell is at least as big as the radius, so the
  // circle fits inside the centre cell plus its ring of eight neighbours.
  const precision = precisionForRadius(radiusM);      // 1 km → 6
  const centre = geohash.encode(lat, lng, precision);

  // Nine cells, not one. A point 50 m away can easily sit in a different cell
  // if the user happens to be standing near a boundary — this is the bug that
  // makes "the restaurant across the street didn't show up" reports.
  const cells = [centre, ...geohash.neighbors(centre)];

  const candidates = cells.flatMap((cell) => geoIndex.get(cell));

  // The cells form a square; the query is a circle. Corners of the square are
  // OUTSIDE the radius, so without this filter you return results the user
  // explicitly excluded — a visible correctness bug, not an approximation.
  const within = candidates.filter((b) => haversine(lat, lng, b.lat, b.lng) <= radiusM);

  return within
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}`,
        },
        bullets: [
          "The eight neighbours are the point of the whole algorithm. Fetching only the containing cell means a user standing near a boundary sees nothing on the other side of the street.",
          "Geohash neighbour computation is fiddly — adjacent cells can differ in every character — so use a library rather than manipulating strings, and note that this is precisely where S2 and H3 are nicer.",
          "If the filtered set is too small, retry at a coarser precision rather than returning three results. Widening beats an empty page.",
          "Cache by cell, not by query. Cell contents barely change and are shared by every user in that cell, so the hit rate is very high; caching (lat, lng, radius) tuples caches almost nothing because no two users stand in exactly the same spot.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Density, and the case for adaptive cells",
        body: [
          "A fixed grid has one precision for the whole planet, which means one cell in Manhattan holds thousands of businesses while a cell in rural Nevada holds none. Query cost therefore varies by three orders of magnitude depending on where the user is standing — a p99 problem that averages hide completely.",
        ],
        table: {
          caption: "The same query, the same code, wildly different work.",
          headers: ["Location", "Businesses in a 1 km² cell", "Candidates from 9 cells", "Fix"],
          rows: [
            ["Midtown Manhattan", "~3,000", "~27,000", "Query at precision 7, and cap per cell"],
            ["Suburban town", "~50", "~450", "Precision 6 is fine"],
            ["Rural highway", "0–2", "~10", "Widen to precision 5 or the page is empty"],
            ["Ocean", "0", "0", "Return empty fast; do not widen forever"],
          ],
        },
        bullets: [
          "The pragmatic fix on a fixed grid is a per-cell count table: if the target cell is dense, drop to a finer precision; if it is empty, widen. That is a quadtree's adaptivity bolted onto a geohash, and it is usually enough.",
          "Cap the candidates fetched per cell and prefer the highest-rated. Returning the best 200 of 3,000 is fine for a ranked list and bounds the tail.",
          "Traffic density and data density are correlated but not identical — tourist districts have far more searches per business, which matters for caching and sharding.",
          "Shard by cell prefix so that a city's data is co-located, then split the hottest prefixes further. Sharding by business_id would turn every search into a scatter-gather across every shard.",
        ],
        callout: {
          kind: "warn",
          title: "The 180th meridian and the poles",
          text: "Cell arithmetic breaks at the antimeridian, where longitude wraps from 180 to −180, and near the poles, where a degree of longitude is a few metres. Most geohash bugs in production are one of these two. S2 and H3 avoid them by working on the sphere rather than on a lat/lng rectangle — which is a concrete, non-hand-wavy reason to prefer them.",
        },
      },
      {
        heading: "Writes, and why they are the easy half",
        body: [
          "A business location is nearly immutable, so the write path can do expensive work: compute the cell id at several precisions, write one row per precision, and let reads pick whichever resolution suits the radius. Precomputing the hierarchy on write is the cleanest way to support multiple radii without recomputing coverings.",
        ],
        code: {
          title: "Write once at several precisions",
          lang: "ts",
          source: `async function upsertBusiness(b: Business) {
  await db.businesses.upsert(b);

  // Index at 5, 6 and 7 characters so a read can choose its resolution
  // without any recomputation. Three small rows instead of one, in exchange
  // for making every supported radius a single-precision lookup.
  for (const p of [5, 6, 7]) {
    await db.geoIndex.upsert({ cell: geohash.encode(b.lat, b.lng, p), businessId: b.id });
  }
}

async function moveBusiness(b: Business, lat: number, lng: number) {
  // A move is a delete and an insert, and it must be transactional — a crash
  // between them leaves the business in two places or in none. This is rare
  // for shops and constant for vehicles, which is the whole reason
  // nearby-friends is a different design rather than a variant of this one.
  await db.transaction(async (tx) => {
    await tx.geoIndex.deleteAllFor(b.id);
    await tx.businesses.update(b.id, { lat, lng });
    for (const p of [5, 6, 7]) {
      await tx.geoIndex.insert({ cell: geohash.encode(lat, lng, p), businessId: b.id });
    }
  });
}`,
        },
        bullets: [
          "Because the index is nearly static, it can be rebuilt from the business table at any time. That makes the geo index disposable, which removes an entire class of consistency worries.",
          "A Redis GEO set (GEOADD/GEOSEARCH) is a legitimate first implementation for a single city and is worth saying out loud — it is a sorted set over geohash scores, which is the same idea with the work already done.",
          "PostGIS with a GiST index is the other honest answer: real spatial indexing in a database you already run, good to tens of millions of rows before sharding becomes the topic.",
          "Denormalise the fields needed for ranking and filtering into the geo index if the candidate fetch becomes the bottleneck — category and rating are small, and it avoids a second lookup per candidate.",
        ],
      },
      {
        heading: "Ranking, filtering and the empty-result problem",
        body: [
          "Distance alone is a poor ranking. A mediocre place 100 m away should usually lose to an excellent one 400 m away, so the score blends distance, rating, review volume and often paid placement — which means ranking is a product decision that the architecture must simply leave room for.",
        ],
        diagram: {
          kind: "flow",
          caption: "Geography narrows the field; ranking decides the page.",
          rows: [
            [
              { id: "cells", label: "9 cells", sub: "~1,800 ids", tone: "accent" },
              { id: "dist", label: "Exact distance", sub: "drop corners" },
            ],
            [
              { id: "filt", label: "Filters", sub: "category, price, open now" },
              { id: "rank", label: "Score", sub: "distance × rating × freshness" },
              { id: "page", label: "Top 50", sub: "with cursor", tone: "ok" },
            ],
          ],
        },
        bullets: [
          'Apply "open now" last and compute it from stored hours in the caller\'s timezone. Indexing it would mean an index that changes validity every minute.',
          'A strict filter on a sparse area produces an empty page, which users read as a broken product. Widen the radius and label the results honestly — "nothing within 1 km, here is what is within 5".',
          "Pagination cannot be a simple offset, because the candidate set is recomputed per request and a moving user shifts it. Use a cursor encoding the last score and id.",
          "Personalisation and paid placement are re-ranking on top of the geographic candidate set, exactly as with autocomplete — the candidate stage stays shared and cacheable.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Geohash on an ordinary database index",
        pickWhen: "Default — no new infrastructure, easy to shard and cache",
        cost: "Fixed grid, awkward neighbours, distortion away from the equator",
      },
      {
        choice: "S2 or H3 cell ids",
        pickWhen: "Global coverage where equal-area cells and clean neighbours matter",
        cost: "A library dependency and ids that are harder to reason about manually",
      },
      {
        choice: "Quadtree in memory",
        pickWhen: "Extreme density variation and a mostly static dataset",
        cost: "Build and rebalance cost, and it must be replicated to every server",
      },
      {
        choice: "Index at several precisions on write",
        pickWhen: "Multiple preset radii",
        cost: "A few extra index rows per business, and all of them must be updated on a move",
      },
      {
        choice: "Cache by cell rather than by query",
        pickWhen: "Always",
        cost: "Invalidation on business updates, which is rare enough to be easy",
      },
      {
        choice: "Redis GEO or PostGIS",
        pickWhen: "One city, or under ~10 M rows",
        cost: "Becomes the thing you migrate off; say it is a stepping stone",
      },
    ],
    wrapUp: [
      "The reframing is the answer: a space-filling curve turns a two-dimensional range query into a one-dimensional prefix lookup that any database can serve.",
      "Always fetch the containing cell plus its eight neighbours, then filter by exact distance — the square of cells over-covers the circle, and skipping the filter returns results outside the requested radius.",
      "Density varies by three orders of magnitude, so either adapt the precision per cell or cap candidates per cell; otherwise p99 is set by Manhattan.",
      "Businesses barely move, which makes the index nearly static, fully rebuildable, and extremely cacheable by cell — a luxury the moving-points version of this problem does not have.",
      "Geography selects candidates; ranking decides the page. Keep them separate so the candidate stage stays shared and cacheable.",
      "With more time: the antimeridian and pole edge cases, paid placement in ranking, and a migration path from Redis GEO to a sharded cell index.",
    ],
    followUps: [
      {
        q: "Why not just index latitude and longitude as two columns?",
        a: "Because a B-tree orders one dimension, and a bounding-box query becomes an intersection of two very large ranges — every point in a latitude band, every point in a longitude band — which the planner cannot combine efficiently. You end up scanning millions of rows to find fifty. Mapping the two dimensions onto a single space-filling curve fixes it: points that are close on the ground usually share a prefix on the curve, so the query becomes a small set of prefix lookups. The word 'usually' is doing real work there, which is exactly why the neighbour cells and the exact-distance filter exist.",
      },
      {
        q: "A user is standing on a cell boundary. What goes wrong?",
        a: "If you fetch only the cell containing them, everything on the other side of the line is invisible — a restaurant thirty metres away is missing while one eight hundred metres away is shown. That is the single most common bug in this design, and it is why the covering is the centre cell plus its eight neighbours rather than just the centre. The neighbour computation itself is the fiddly part for geohashes, because adjacent cells can differ in every character, so I would use a library; it is also a concrete reason to prefer S2 or H3, where neighbours are a first-class operation.",
      },
      {
        q: "How do you keep Manhattan from setting your p99?",
        a: "By not treating every cell as equivalent. I keep a count per cell and query dense areas at a finer precision — precision 7 instead of 6 — so the candidate set stays in the hundreds regardless of where the user is. I also cap how many candidates a single cell contributes, preferring the highest-rated, because a ranked list of fifty does not need three thousand candidates to be good. If neither is enough, that city's prefix gets its own shard. The general principle is that geographic data is never uniform, so any design assuming a uniform grid has a tail problem waiting in the densest place it serves.",
      },
      {
        q: "How would this change if the businesses were moving vehicles?",
        a: "It becomes a different system, which is worth saying plainly. Right now the index is nearly static, so I can index at several precisions, cache aggressively by cell and rebuild at will. With moving points, every update is a delete and an insert across cells, the write rate goes from negligible to hundreds of thousands per second, and cell caching stops working because contents change every few seconds. The answer there is to keep current positions in memory with a TTL rather than in a durable index, accept a few seconds of staleness, and — where the query is 'which of my friends are near me' rather than 'who is near me' — invert the problem and fan out to a bounded friend list instead of running a spatial query at all.",
      },
      {
        q: "The user's filters return only two results. What do you do?",
        a: "Widen rather than return an almost-empty page, and be honest about it in the response. I would retry the covering at a coarser precision, and label the results as being from a larger radius so the UI can say 'nothing within 1 km — showing results within 5 km'. The important part is that widening happens server-side in the same request, because a client that has to notice the empty result and retry adds a full round trip to the slowest case. I would also cap the widening — two steps, then return empty — so a query in the middle of an ocean does not walk outwards forever.",
      },
    ],
    related: [
      "/examples/nearby-friends",
      "/examples/google-maps",
      "/examples/uber",
      "/hld/sharding",
      "/hld/caching",
    ],
    furtherReading: [
      {
        label: "Geohash — the encoding, explained",
        href: "https://en.wikipedia.org/wiki/Geohash",
      },
      {
        label: "Google S2 — spherical cells and the Hilbert curve",
        href: "https://s2geometry.io/devguide/s2cell_hierarchy",
      },
    ],
  },

  {
    slug: "nearby-friends",
    title: "Design Nearby Friends",
    source: "Volume 2",
    chapter: 2,
    difficulty: "advanced",
    minutes: 22,
    tags: ["geo", "realtime", "pub-sub", "presence", "privacy"],
    companies: ["Snap Map", "Find My", "WhatsApp Live Location", "Life360"],
    summary:
      "The proximity service assumed points stay still. Here they move every few seconds, which inverts the entire design: writes dominate reads, the index is worthless a minute after it is written, and the interesting realisation is that you should usually not run a spatial query at all. A friend list is a few hundred people, so publishing each update to a bounded set of subscribers beats searching the globe for who might care.",
    clarifying: [
      {
        q: "How often do clients report location, and can we negotiate it?",
        a: "Every 10 to 30 seconds while the feature is open, and yes — that interval is the first thing I would negotiate, because it sets the write volume directly. Adaptive reporting, faster when moving and much slower when stationary, cuts it dramatically for free.",
      },
      {
        q: "How large is a friend list?",
        a: "A few hundred, with a tail in the low thousands. That bound is the most important number in the design: it is what makes per-update fan-out to friends cheaper than a spatial query.",
      },
      {
        q: "Who can see a location — friends only, or anyone nearby?",
        a: "Friends only, and mutually opted in. This is not a detail; a design that indexes everyone's position in a globally queryable structure is one bug away from being a stalking tool, so the access rule has to be structural rather than a filter applied at the end.",
      },
      {
        q: "Do we need location history?",
        a: "No for this feature, which is a relief — it means positions can live in memory with a TTL and never touch durable storage. If history is a separate product, it is a sampled, asynchronous write to an analytics store, not part of this path.",
      },
      {
        q: "What does 'nearby' mean — a fixed radius, or does the user choose?",
        a: "A fixed radius of around 5 km, which lets me precompute cell coverage. It also bounds how far an update has to travel, since a friend 200 km away never needs to hear about a move at all.",
      },
    ],
    requirements: {
      functional: [
        "Show which mutual friends are currently within a radius, with their approximate position",
        "Update within seconds as people move",
        "Notify when a friend enters the radius",
        "Let a user stop sharing instantly, and expire stale positions automatically",
      ],
      nonFunctional: [
        "End-to-end update latency of a few seconds",
        "Write-dominated: location updates vastly outnumber reads",
        "Losing an update is acceptable; the next one arrives in seconds",
        "Battery cost on the client is a first-class constraint",
      ],
    },
    math: [
      {
        label: "Naive write rate",
        expr: "100 M users × 1 ping / 30 s",
        result: "≈ 3.3 M writes/s",
        note: "Unaffordable, and almost entirely wasted — most users are not actively looking at the map.",
      },
      {
        label: "Realistic active set",
        expr: "100 M × ~10% with the feature open",
        result: "≈ 10 M active → 330 K writes/s",
        note: "Only users who have opted in AND have the app foregrounded are indexed. This is the single largest saving in the design.",
      },
      {
        label: "Fan-out per update",
        expr: "~200 friends × ~10% currently nearby and online",
        result: "≈ 20 deliveries per update",
        note: "330 K updates/s × 20 ≈ 6.6 M messages/s through pub/sub — large but tractable, and far cheaper than 330 K spatial queries/s.",
      },
      {
        label: "Memory for live positions",
        expr: "10 M active × ~100 B",
        result: "≈ 1 GB",
        note: "Trivially fits in Redis. The state is tiny because it is only ever 'now' — history is what makes location data big.",
      },
      {
        label: "Battery-aware saving",
        expr: "stationary users at 1 ping / 5 min",
        result: "≈ 60% fewer writes",
        note: "Most people are stationary most of the time, so adaptive reporting is nearly free accuracy.",
      },
    ],
    apis: [
      {
        method: "WS",
        path: "/v1/location (upstream)",
        desc: "Client pushes {lat, lng, accuracy, ts} on its duty cycle over the existing socket",
      },
      {
        method: "WS",
        path: "/v1/location (downstream)",
        desc: "Server pushes {friendId, lat, lng, distance, ts} as friends move",
      },
      {
        method: "GET",
        path: "/v1/nearby",
        desc: "Initial snapshot on app open — which friends are nearby right now",
      },
      {
        method: "POST",
        path: "/v1/sharing",
        desc: "Start or stop sharing; stopping must take effect immediately, not on TTL expiry",
      },
      {
        method: "POST",
        path: "/v1/sharing/precision",
        desc: "Exact, approximate (~1 km), or city-level — a privacy control, not a performance one",
      },
    ],
    dataModel: [
      {
        entity: "live_locations",
        fields: [
          "user_id (pk)",
          "lat, lng, accuracy",
          "updated_at",
          "TTL ≈ 60 s",
          "→ Redis; never persisted, expires on its own",
        ],
      },
      {
        entity: "cell_members",
        fields: [
          "cell_id (pk)",
          "user_id",
          "→ Redis set with TTL; only for the 'who is around' fallback path",
        ],
      },
      {
        entity: "friendships",
        fields: [
          "user_id (pk)",
          "friend_id (pk)",
          "sharing_enabled (bool)",
          "precision (exact|approx|city)",
          "→ durable; small; heavily cached per user",
        ],
      },
      {
        entity: "subscriptions",
        fields: [
          "user_id (idx)",
          "watching_user_id",
          "→ derived: the friends currently near enough to be worth streaming",
        ],
      },
    ],
    architecture: [
      {
        heading: "Invert the query",
        lede: "The instinct is a spatial search per update. The friend list makes that unnecessary.",
        diagram: {
          kind: "compare",
          caption: "Same feature, two fundamentally different cost profiles.",
          options: [
            {
              title: "Spatial query per update",
              sub: '"who is near this new position?"',
              good: ["Works without a friend graph", "Handles 'strangers nearby' products"],
              bad: [
                "330 K geo queries/s against a constantly changing index",
                "Nearly all results are discarded — they are not friends",
                "The index must be globally queryable, which is a privacy hazard",
              ],
              verdict:
                "Only when the product genuinely is about strangers, like a dating or ride-hailing app.",
            },
            {
              title: "Fan-out to friend channels",
              sub: '"push my position to the friends who care"',
              tone: "ok",
              good: [
                "Work is bounded by the friend list, not by the population",
                "No global spatial index to query — or to leak",
                "Reuses the chat system's pub/sub and presence machinery",
              ],
              bad: [
                "Needs a subscription set maintained as people move in and out of range",
                "A user with thousands of friends is a fan-out hotspot",
              ],
              verdict: "The right answer for a friends-only product, which is what was asked for.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "The observation worth making early",
          text: "\"A spatial index answers 'who is near this point'. But the product question is 'which of MY FRIENDS are near me', and my friend list has a few hundred entries while the world has a hundred million. So the cheap direction is to push my position to my friends rather than to search the world for people who might care.\" That reframing is what separates this from the proximity chapter.",
        },
      },
      {
        heading: "The update path",
        lede: "Ingest, store with a TTL, fan out to a filtered subscriber set.",
        diagram: {
          kind: "sequence",
          caption: "Nothing here is durable, and that is deliberate.",
          actors: [
            { id: "a", label: "Ana's phone" },
            { id: "ws", label: "Location service", sub: "holds the socket" },
            { id: "redis", label: "Redis", sub: "position + TTL" },
            { id: "ps", label: "Pub/sub" },
            { id: "b", label: "Ben's phone", sub: "friend, 2 km away" },
          ],
          messages: [
            { from: "a", to: "ws", label: "1. {lat, lng} over the existing socket", kind: "call" },
            { from: "ws", to: "redis", label: "2. SET user:ana … EX 60", kind: "call" },
            {
              from: "ws",
              to: "ws",
              label: "3. load cached friend list, filter to nearby + online",
              kind: "self",
              tone: "accent",
            },
            { from: "ws", to: "ps", label: "4. publish to ~20 friend channels", kind: "async" },
            { from: "ps", to: "b", label: "5. Ana is now 1.8 km away", kind: "async", tone: "ok" },
            { from: "b", to: "b", label: "6. move the dot; no server round trip", kind: "self" },
            { from: "a", to: "ws", label: "7. …app backgrounded, pings stop", kind: "call" },
            {
              from: "redis",
              to: "redis",
              label: "8. key expires after 60 s → Ana disappears",
              kind: "self",
              tone: "warn",
            },
          ],
        },
        bullets: [
          "The TTL is the presence mechanism. A phone that crashes, loses signal or is force-quit never sends a goodbye, so expiry — not an explicit offline message — is the only reliable way to stop showing a stale dot.",
          "Reuse the chat or presence socket rather than opening a second connection. A phone holding two sockets doubles the radio wake-ups, which is a battery cost the user notices.",
          "Filter the fan-out by current distance before publishing. A friend in another country does not need 2,880 updates a day, and that filter is what keeps the delivery multiplier at roughly twenty rather than two hundred.",
          "Updates are fire-and-forget. There is no retry, no acknowledgement and no ordering guarantee, because a lost position is corrected by the next one three seconds later — treating them as reliable messages would cost far more than it is worth.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Maintaining the subscription set",
        body: [
          "Filtering by distance requires knowing which friends are currently close, and that set changes as people move. Recomputing it on every update means a distance calculation against every friend, which is affordable at a few hundred friends but wasteful at 330,000 updates a second.",
        ],
        code: {
          title: "Recompute the watch set on a coarse trigger, not every ping",
          lang: "ts",
          source: `// Full recompute is ~200 distance calculations. Doing it per ping is 66 M
// distance calls/s across the fleet; doing it when the user crosses a coarse
// cell boundary cuts that by orders of magnitude for the same result.
async function onLocationUpdate(userId: string, pos: Position) {
  await redis.setex(\`loc:\${userId}\`, 60, encode(pos));

  const coarseCell = geohash.encode(pos.lat, pos.lng, 5);   // ~5 km
  const prev = await redis.get(\`cell:\${userId}\`);

  if (prev !== coarseCell) {
    // Crossed into a new neighbourhood — who is in range has genuinely changed.
    await rebuildWatchSet(userId, pos);
    await redis.setex(\`cell:\${userId}\`, 300, coarseCell);
  }

  // The common case: still in the same cell, so reuse the cached watch set.
  const watchers = await redis.smembers(\`watchers:\${userId}\`);
  for (const w of watchers) {
    pubsub.publish(\`user:\${w}\`, { friendId: userId, ...applyPrecision(pos, w) });
  }
}`,
        },
        bullets: [
          "A coarse cell change is a good trigger because the radius is 5 km and a coarse cell is about 5 km — crossing one is roughly when the answer could have changed.",
          "Watch sets are symmetric in practice but must be stored per direction, because sharing can be one-way and precision can differ per friend.",
          "Entering the radius is the event worth a push notification; leaving it usually is not. Notifying on both is how the feature becomes annoying enough to be switched off.",
          "Hysteresis matters: a friend hovering at exactly 5 km should not generate an enter/leave storm. Use a slightly larger radius to leave than to enter.",
        ],
      },
      {
        heading: "Why nothing is written to disk",
        lede: "The most important storage decision here is the absence of storage.",
        table: {
          caption: "Location data is only expensive when you keep it.",
          headers: ["Property", "Live positions", "If persisted"],
          rows: [
            ["Write rate", "330 K/s to memory", "330 K/s to disk — a database problem in itself"],
            ["Volume", "~1 GB total, always", "~2 TB/day, growing forever"],
            ["Value after 60 s", "None", "None, but you are still paying to store it"],
            ["Loss of an update", "Corrected in seconds", "Corrected in seconds"],
            [
              "Regulatory exposure",
              "Minimal",
              "Substantial — subpoenas, breaches, retention rules",
            ],
          ],
        },
        bullets: [
          "The TTL does double duty: it is the presence signal and it is the retention policy. Data that expires cannot be leaked later.",
          "If location history is a product requirement, make it an explicit, separately-consented feature writing sampled points asynchronously — never a side effect of the nearby-friends path.",
          "Redis being volatile is a feature here, not a risk. A full cache loss means everyone's dot disappears and reappears within one ping interval.",
          "Keep the aggregate counters you actually need — how many users are sharing, delivery latency — as metrics, not as retained position rows.",
        ],
        callout: {
          kind: "warn",
          title: "This is a safety-critical feature, not just a fun one",
          text: "A location-sharing product is a stalking vector if the access rules are wrong. Sharing must be mutual and revocable instantly, revocation must invalidate live subscriptions rather than waiting for a TTL, approximate precision should be the default rather than an advanced setting, and there should be a visible indicator whenever sharing is active. These are architectural requirements — an access check applied only at read time is not enough when positions are already streaming to a subscriber.",
        },
      },
      {
        heading: "The client is half the system",
        body: [
          "Server design cannot fix a client that drains the battery, and a location feature that costs 15% of a phone's battery gets uninstalled regardless of how elegant the backend is. The duty cycle is therefore a real architectural component, not an implementation detail.",
        ],
        diagram: {
          kind: "flow",
          caption: "Report rate follows behaviour, not a fixed timer.",
          rows: [
            [
              { id: "stat", label: "Stationary", sub: "1 / 5 min", tone: "ok" },
              { id: "walk", label: "Walking", sub: "1 / 30 s" },
              { id: "drive", label: "Driving", sub: "1 / 10 s", tone: "accent" },
            ],
            [
              { id: "bg", label: "Backgrounded", sub: "stop entirely" },
              { id: "low", label: "Low battery", sub: "back off hard", tone: "warn" },
              { id: "none", label: "No friends near", sub: "slow right down" },
            ],
          ],
        },
        bullets: [
          "Use the platform's significant-location-change and geofence APIs rather than a timer. They are implemented in hardware and cost a fraction of an app-level polling loop.",
          "Batch and compress: several positions in one message when the network is expensive, since freshness of three seconds versus eight rarely matters.",
          "Interpolate on the client between updates so the dot moves smoothly. That is why a 30-second server interval can still look live, and it lets the server send far less.",
          "Stop reporting entirely when the app is backgrounded and no friend is nearby. The most efficient update is the one never sent.",
        ],
      },
      {
        heading: "Scaling the connection tier",
        body: [
          "Ten million concurrent sockets is the other half of the cost, and it is a different scaling problem from the location data — connections are sticky, long-lived and unevenly distributed, so the tier scales by connection count rather than by request rate.",
        ],
        bullets: [
          "Route by user id so a user's socket and their pub/sub subscription land on the same node, avoiding an extra hop on every delivery.",
          "Deploys are the hard part: restarting a node drops hundreds of thousands of sockets that all reconnect at once. Drain slowly and add reconnect jitter, or the restart becomes a self-inflicted thundering herd.",
          "A user with 5,000 friends is a fan-out hotspot. Cap the watch set at the nearest few hundred — beyond that the map is unreadable anyway, so the cap is a product improvement as well as a load control.",
          "Regionalise. Positions and subscriptions are local by nature, so a user in Europe should not be routed through a cluster in another continent for a feature measured in seconds.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Fan-out to friend channels",
        pickWhen: "Friends-only visibility with bounded friend lists",
        cost: "A watch set to maintain, and hotspots for users with huge friend lists",
      },
      {
        choice: "Spatial query per update",
        pickWhen: "The product is about strangers nearby, not friends",
        cost: "Orders of magnitude more query load and a globally queryable position index",
      },
      {
        choice: "In-memory positions with a TTL",
        pickWhen: "Always — history is not required for this feature",
        cost: "Positions vanish on a full cache loss, which recovers within one ping",
      },
      {
        choice: "Adaptive client reporting",
        pickWhen: "Always — battery is a product constraint",
        cost: "A stationary user's dot can be minutes stale, which is usually correct anyway",
      },
      {
        choice: "Approximate precision by default",
        pickWhen: "Safety and privacy are taken seriously",
        cost: '"Ana is within about a kilometre" is less magical than a precise dot',
      },
      {
        choice: "Reuse the chat socket",
        pickWhen: "A messaging product already holds a connection",
        cost: "Couples two features' availability and deploy cycles",
      },
    ],
    wrapUp: [
      "The key move is inverting the query: push each position to a bounded friend list rather than searching a global index for who might care. The friend list is the thing that makes the problem small.",
      "Positions live in memory with a TTL and are never persisted. The TTL is simultaneously the presence mechanism, the retention policy and the crash-recovery story.",
      "Updates are fire-and-forget. No retries, no ordering, no acknowledgements — a lost position is corrected by the next one, and treating them as reliable messages would cost far more than it is worth.",
      "The subscription set is recomputed on a coarse trigger rather than on every ping, which is what keeps distance calculations from dominating at a third of a million updates per second.",
      "The client's duty cycle is part of the architecture. Adaptive reporting and client-side interpolation are what make a low server update rate feel live.",
      "Privacy is structural here, not a filter: mutual opt-in, instant revocation that tears down live subscriptions, and approximate precision by default.",
    ],
    followUps: [
      {
        q: "Why not run a geo query every time someone moves?",
        a: "Because almost all of that work is discarded. At 330,000 updates a second you would be running 330,000 spatial queries against an index that is changing continuously, and then throwing away nearly every result because the people found are not friends. The friend list is a few hundred entries and is already cached, so publishing to the friends who are currently in range costs about twenty deliveries instead of a global search. The exception is a product about strangers rather than friends — ride-hailing, or dating — where there is no small subscriber set to exploit and the spatial query genuinely is the right shape.",
      },
      {
        q: "A user force-quits the app. How does their dot disappear?",
        a: "By expiry, not by a message. A force-quit, a crash, a dead battery or a tunnel all look identical from the server's side and none of them send a goodbye, so the only reliable mechanism is the TTL on the position key — about sixty seconds, or roughly two missed ping intervals. This is the same pattern as presence in a chat system, and it is worth saying that an explicit offline message is an optimisation on top, never the mechanism. I would show 'last seen two minutes ago' rather than removing the friend instantly, because that is both friendlier and a more honest statement of what the system actually knows.",
      },
      {
        q: "How do you avoid recalculating distance to 200 friends on every single ping?",
        a: "By noticing that the answer rarely changes. Someone walking for thirty seconds has not altered which friends are within five kilometres, so I recompute the watch set only when the user crosses a coarse cell boundary — a cell sized at roughly the search radius — and otherwise reuse the cached set. That turns a per-ping calculation into one every few minutes for a typical user while producing the same result, and the cached set is exactly what the fan-out iterates over. I would add hysteresis at the boundary so a friend hovering at the edge does not generate a stream of enter and leave events.",
      },
      {
        q: "Someone revokes sharing. When does their friend stop seeing them?",
        a: "Immediately, and that requires more than deleting a row. Revocation has to delete the live position key, remove the user from every watch set they appear in, and push a removal event down the existing sockets — if I only updated the friendship table and relied on the next read to apply it, a subscriber who is already streaming would keep receiving updates until the TTL expired. For a safety feature that minute matters. I would also make revocation apply to any pending fan-out already in flight, which in practice means checking authorisation at publish time as well as at subscribe time.",
      },
      {
        q: "Ten million people have the app open and you need to deploy. What happens?",
        a: "Every socket on a restarted node drops, and if they all reconnect at once you get a thundering herd that can be worse than the deploy it was meant to be safe for. So I drain gradually — stop accepting new connections on a node, shed existing ones over minutes rather than instantly — and the client reconnects with jittered exponential backoff rather than immediately. Reconnection should also be cheap: the client asks for a fresh snapshot of nearby friends rather than replaying anything, because there is no history to replay. The general point is that a connection tier scales and deploys by connection count, which is a different operational problem from a stateless request tier.",
      },
    ],
    related: [
      "/examples/proximity",
      "/examples/chat",
      "/examples/uber",
      "/hld/websockets",
      "/hld/pub-sub",
    ],
    furtherReading: [
      {
        label: "algomaster — design nearby friends",
        href: "https://algomaster.io/learn/system-design-interviews/design-nearby-friends",
      },
      {
        label: "Redis — GEO commands and sorted-set encoding",
        href: "https://redis.io/docs/latest/commands/geosearch/",
      },
    ],
  },

  {
    slug: "google-maps",
    title: "Design Google Maps",
    source: "Volume 2",
    chapter: 3,
    difficulty: "advanced",
    minutes: 24,
    tags: ["geo", "routing", "tiles", "graph", "traffic"],
    companies: ["Google Maps", "Apple Maps", "Waze", "OpenStreetMap"],
    summary:
      "Three unrelated systems wearing one app icon: tile rendering, which is a pure CDN problem; route finding, which is a graph problem solved by precomputation; and traffic, which is a streaming pipeline whose entire purpose is to invalidate that precomputation. The honest approach is to say that out loud, then go deep on routing — because that is where the interesting tension lives.",
    clarifying: [
      {
        q: "Which part am I designing — rendering, routing or search?",
        a: "All three exist, but covering them equally means covering none of them properly. I would spend two minutes each on tiles and geocoding, then go deep on routing and traffic, because that is where the genuinely hard engineering is.",
      },
      {
        q: "Does routing have to account for live traffic?",
        a: "Yes, and that is the crux. Static shortest path on a road network is a solved problem with excellent precomputation; traffic changes edge weights continuously, and the fastest known algorithms depend on weights being stable. The design is largely about reconciling those two facts.",
      },
      {
        q: "What scale of route — across a city, or across a continent?",
        a: "Both. A three-kilometre route and a three-thousand-kilometre route need different strategies, which is exactly why hierarchical routing exists rather than being an optimisation.",
      },
      {
        q: "How fresh must traffic be?",
        a: "A couple of minutes. That is loose enough to batch aggregation into windows rather than streaming per-probe updates into the routing graph, which would be both expensive and unstable.",
      },
      {
        q: "Do we need turn-by-turn navigation, or just a route?",
        a: "Turn-by-turn, which adds two requirements people forget: map matching, to snap noisy GPS onto an actual road, and rerouting, which must be fast because it happens at the worst possible moment.",
      },
    ],
    requirements: {
      functional: [
        "Render the map at many zoom levels, anywhere on earth",
        "Find a route between two points with a realistic ETA",
        "Incorporate live traffic into both route choice and ETA",
        "Turn-by-turn navigation with rerouting when the driver deviates",
      ],
      nonFunctional: [
        "Tiles feel instant — served from cache, not computed",
        "Route computation in well under a second, including intercontinental",
        "Traffic fresh within a few minutes",
        "Graceful degradation: a stale route beats no route",
      ],
    },
    math: [
      {
        label: "Tile pyramid size",
        expr: "Σ 4^z for z = 0…20",
        result: "≈ 1.4 trillion tiles",
        note: "Which is why tiles are generated on demand and cached rather than pre-rendered exhaustively — most of that pyramid is ocean nobody ever requests.",
      },
      {
        label: "Road graph",
        expr: "~60 M km of roads → nodes at junctions",
        result: "≈ 200 M nodes, 500 M edges",
        note: "Fits in roughly 20–40 GB in a compact representation — a large server, not a cluster, which is a genuinely useful thing to know.",
      },
      {
        label: "Plain Dijkstra, London to Rome",
        expr: "settles nodes in a growing circle around the origin",
        result: "≈ 10⁸ nodes visited, seconds",
        note: "Far too slow, and the reason every real router precomputes. Bidirectional search helps by roughly the square root but is not enough.",
      },
      {
        label: "With contraction hierarchies",
        expr: "search only ascends the importance hierarchy",
        result: "≈ 10³ nodes, ~1 ms",
        note: "Five orders of magnitude. This is the single most important number in the design.",
      },
      {
        label: "Traffic probe volume",
        expr: "50 M active devices × 1 report / 5 s",
        result: "≈ 10 M reports/s",
        note: "Aggregated into per-edge speeds over 1–2 minute windows; the routing tier reads snapshots, never individual probes.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/tiles/{version}/{z}/{x}/{y}.mvt",
        desc: "Vector tile — immutable per version, so it caches forever at the edge",
      },
      {
        method: "GET",
        path: "/v1/route?from={}&to={}&mode=driving&depart=now",
        desc: "Route with geometry, turn instructions and an ETA",
      },
      {
        method: "POST",
        path: "/v1/route/reroute",
        desc: "Driver deviated — recompute from the current position, latency-critical",
      },
      {
        method: "GET",
        path: "/v1/geocode?q={}",
        desc: "Text to coordinates; the search half of the product",
      },
      {
        method: "POST",
        path: "/v1/probes",
        desc: "Anonymised speed samples from navigating devices — the traffic input",
      },
    ],
    dataModel: [
      {
        entity: "road_graph",
        fields: [
          "edge_id (pk)",
          "from_node, to_node (idx)",
          "length_m, speed_limit, road_class",
          "restrictions (turn, one-way, vehicle type)",
          "→ partitioned geographically; loaded into memory by routing servers",
        ],
      },
      {
        entity: "ch_shortcuts",
        fields: [
          "shortcut_id (pk)",
          "from_node, to_node",
          "via_node, weight",
          "level (importance rank)",
          "→ the precomputed hierarchy; rebuilt periodically",
        ],
      },
      {
        entity: "edge_speeds",
        fields: [
          "edge_id (pk)",
          "window_start (pk)",
          "observed_speed, confidence, sample_count",
          "→ output of the traffic pipeline, read as a snapshot",
        ],
      },
      {
        entity: "historical_speeds",
        fields: [
          "edge_id (pk)",
          "day_of_week, hour (pk)",
          "typical_speed",
          "→ the fallback when live data is thin, and the basis for future-departure ETAs",
        ],
      },
    ],
    architecture: [
      {
        heading: "Three systems, one product",
        lede: "Separating them is most of the answer.",
        diagram: {
          kind: "system",
          caption: "They share coordinates and almost nothing else.",
          columns: [
            {
              title: "Render",
              nodes: [
                { id: "tile", label: "Tile service", sub: "vector tiles" },
                { id: "cdn", label: "CDN", sub: "immutable, versioned", tone: "ok" },
                { id: "style", label: "Client styling", sub: "labels, themes" },
              ],
            },
            {
              title: "Route",
              nodes: [
                { id: "graph", label: "Road graph", sub: "in memory, partitioned" },
                { id: "ch", label: "Hierarchy", sub: "precomputed shortcuts", tone: "accent" },
                { id: "svc", label: "Routing service", sub: "bidirectional search" },
              ],
            },
            {
              title: "Traffic",
              nodes: [
                { id: "probe", label: "Probe ingest", sub: "10 M/s, anonymised" },
                { id: "agg", label: "Aggregator", sub: "per-edge, 1–2 min windows" },
                { id: "snap", label: "Speed snapshot", sub: "read by routing" },
              ],
            },
          ],
        },
        bullets: [
          "Tiles are static files. A tile for a given version, zoom and coordinate never changes, so it is cached immutably in the browser and at the edge and there is nothing to invalidate — a map update publishes a new version and therefore new URLs.",
          "Vector tiles rather than images: the client receives geometry and applies styling, which means one tile serves every theme, labels stay crisp at any rotation, and the payload is a fraction of a raster tile.",
          "The routing graph is loaded into memory. At tens of gigabytes it fits on a large machine, and a routing query that touched disk would blow the latency budget immediately.",
          "Traffic never talks to routing synchronously. The routing tier reads a periodically-refreshed snapshot of edge speeds, because calling a live service per edge per query would be thousands of calls per route.",
        ],
        callout: {
          kind: "interview",
          title: "Scope out loud, then go deep",
          text: "\"Rendering, routing and traffic are three separate systems. Tiles are a CDN problem and I can describe that in two minutes. Routing is where the real difficulty is, and traffic is interesting precisely because it breaks routing's main optimisation. I'll go deep there.\" Trying to design all three at once produces a shallow answer to every part.",
        },
      },
      {
        heading: "Why routing needs precomputation",
        lede: "Dijkstra is correct and completely unusable at this scale.",
        diagram: {
          kind: "compare",
          caption: "The progression every routing system has made.",
          options: [
            {
              title: "Dijkstra",
              sub: "expand outward until you reach the target",
              good: [
                "Simple and provably optimal",
                "Handles arbitrary edge weights, including live traffic",
              ],
              bad: [
                "Explores a circle around the origin — a London-to-Rome route settles most of Western Europe",
                "Hundreds of millions of nodes, seconds per query",
              ],
              verdict: "Correct baseline; state it, then explain why it cannot ship.",
            },
            {
              title: "A* with a geographic heuristic",
              sub: "bias the search towards the destination",
              good: [
                "Straight-line distance is an admissible heuristic, so it stays optimal",
                "Often 5–10× fewer nodes",
              ],
              bad: [
                "Still far too slow for long routes — the heuristic is weak when motorways detour",
                "No help at all when weights change unpredictably",
              ],
              verdict: "A real improvement and easy to explain, but not sufficient on its own.",
            },
            {
              title: "Contraction hierarchies",
              sub: "rank roads by importance, precompute shortcuts",
              tone: "ok",
              good: [
                "Queries touch roughly a thousand nodes instead of a hundred million",
                "Matches intuition: leave the side streets, take the motorway, exit near the destination",
                "Sub-millisecond queries on a continental graph",
              ],
              bad: [
                "Preprocessing takes hours and must be redone when weights change materially",
                "That rebuild cost is exactly what live traffic threatens",
              ],
              verdict: "What production routers use, and the crux of the traffic trade-off.",
            },
          ],
        },
        steps: [
          {
            title: "Rank nodes by importance",
            text: "Order junctions so that motorway interchanges rank high and cul-de-sacs rank low.",
            detail:
              "Importance is computed from how many shortest paths pass through a node, which is why the hierarchy ends up mirroring the real road classification without being told about it.",
          },
          {
            title: "Contract from the bottom up",
            text: "Remove each low-importance node and add shortcut edges preserving distances between its neighbours.",
            detail:
              "The shortcut records the removed node so the full geometry can be unpacked later — the query works on the contracted graph, the answer is expanded back to real roads.",
          },
          {
            title: "Query upward from both ends",
            text: "Search only towards higher-importance nodes from the origin and the destination, and meet in the middle.",
            detail:
              "This is why it is fast: the search never wanders sideways across thousands of residential streets, it climbs to the motorway network, crosses, and descends.",
          },
          {
            title: "Unpack the shortcuts",
            text: "Expand the contracted path back into the actual sequence of road segments.",
            detail:
              "Cheap, and it is where turn instructions come from — the unpacked geometry carries the road names and junction angles the instructions are generated from.",
          },
        ],
      },
    ],
    deepDives: [
      {
        heading: "Traffic versus precomputation",
        lede: "The central tension: the fast algorithm assumes stable weights, and traffic is the opposite.",
        diagram: {
          kind: "sequence",
          caption: "Live conditions are applied as a correction, not by rebuilding the hierarchy.",
          actors: [
            { id: "dev", label: "Devices", sub: "50 M probes" },
            { id: "agg", label: "Aggregator", sub: "1–2 min windows" },
            { id: "snap", label: "Speed snapshot" },
            { id: "rt", label: "Routing service", sub: "holds the CH" },
          ],
          messages: [
            { from: "dev", to: "agg", label: "1. anonymised speed samples", kind: "async" },
            {
              from: "agg",
              to: "agg",
              label: "2. map-match to edges, median per window",
              kind: "self",
            },
            { from: "agg", to: "snap", label: "3. publish edge → speed", kind: "call" },
            {
              from: "snap",
              to: "rt",
              label: "4. routing servers pull the new snapshot",
              kind: "async",
              tone: "accent",
            },
            {
              from: "rt",
              to: "rt",
              label: "5. query CH, then adjust with live weights near the path",
              kind: "self",
              tone: "warn",
            },
            {
              from: "rt",
              to: "rt",
              label: "6. nightly / periodic full hierarchy rebuild",
              kind: "self",
            },
          ],
        },
        table: {
          caption: "How real systems reconcile the two.",
          headers: ["Strategy", "How it works", "Cost"],
          rows: [
            [
              "Rebuild the hierarchy",
              "Recompute CH with new weights",
              "Hours — far too slow for live traffic",
            ],
            [
              "Customisable route planning",
              "Split preprocessing into a topology phase and a fast weight phase",
              "Weight updates in seconds; this is the modern answer",
            ],
            [
              "Live correction on top",
              "Query the CH, then re-evaluate candidate paths with live speeds",
              "Can miss a better route the hierarchy pruned away",
            ],
            [
              "Fall back to A* locally",
              "Use live weights directly near the endpoints",
              "Slower, but accurate where traffic matters most",
            ],
            [
              "Historical speeds",
              "Typical speed for this edge, this hour, this weekday",
              "The base layer when live data is thin — and how future departures are estimated",
            ],
          ],
        },
        bullets: [
          "Customisable Route Planning is the clean answer worth naming: separate the expensive topology-only preprocessing, which depends on road geometry and rarely changes, from a cheap metric phase that absorbs new weights in seconds.",
          "Most edges have no live data at any moment — a residential street may see no probes for an hour — so historical speeds are the base layer and live data is a correction on the roads that actually have observations.",
          "Confidence matters as much as the speed value. Three probes on a rural road is noise; three hundred on a motorway is a fact, and routing should weight them differently.",
          "Never route everyone around a jam simultaneously. Doing so moves the jam to the alternative, so major rerouting is damped and spread rather than applied uniformly — the system's own advice changes the thing it is measuring.",
        ],
        callout: {
          kind: "insight",
          text: "The feedback loop is genuinely part of the design. Navigation advice changes traffic, which changes the advice. This is why routing services stagger alternative suggestions across users, damp large weight swings, and treat a sudden speed collapse as needing confirmation rather than immediate action — a naive system oscillates.",
        },
      },
      {
        heading: "Map matching and rerouting",
        body: [
          "GPS is accurate to perhaps five metres in the open and thirty in a city with tall buildings, which is easily enough to place a driver on the wrong one of two parallel roads. Every downstream feature — the blue dot, turn instructions, traffic probes, rerouting — depends on first deciding which road the device is actually on.",
        ],
        code: {
          title: "Matching is a path problem, not a nearest-point problem",
          lang: "ts",
          source: `// Picking the nearest road per sample makes the dot jump between a motorway
// and the service road beside it. The fix is to match the SEQUENCE: the most
// likely path through the road network given all recent observations.
function mapMatch(trace: GpsPoint[], graph: RoadGraph): Edge[] {
  // Hidden Markov model: states are candidate edges, emissions are how well a
  // point fits an edge, transitions are how plausible that road change is.
  let beam: Candidate[] = candidateEdges(trace[0], graph).map(seed);

  for (const point of trace.slice(1)) {
    const next: Candidate[] = [];
    for (const prev of beam) {
      for (const edge of candidateEdges(point, graph)) {
        // A transition requiring a U-turn across a central reservation, or
        // 400 m of travel in one second, is heavily penalised — that is what
        // stops the dot teleporting onto the parallel road.
        const score = prev.score + emission(point, edge) + transition(prev.edge, edge);
        next.push({ edge, score, from: prev });
      }
    }
    beam = topK(next, 20);           // beam search keeps this real-time
  }
  return backtrack(best(beam));
}`,
        },
        bullets: [
          "Rerouting is latency-critical in a way normal routing is not: the driver has already missed the turn and is moving. Recompute from the matched position immediately and prefer returning to the existing route over planning a wholly new one.",
          'Distinguish a deviation from a bad match. Snapping error is far more common than an actual wrong turn, so requiring consistency across several samples avoids the notorious "recalculating" loop when the road is simply mismatched.',
          "Matched traces are also the traffic input, which is why matching quality directly determines traffic quality — a probe attributed to the wrong road pollutes both.",
          "Download the route geometry and instructions to the client so navigation survives a tunnel or a dead zone. Turn-by-turn should never require connectivity to keep working.",
        ],
      },
      {
        heading: "ETA is a prediction, not a sum",
        body: [
          "Adding up edge traversal times gives a number that is systematically optimistic, because it ignores everything that is not an edge: traffic-light cycles, turn penalties, pedestrian crossings, the slow crawl at a motorway exit, and the driver stopping for coffee. Production ETAs are learned models over route features rather than arithmetic.",
        ],
        table: {
          caption: "What the model knows that the graph does not.",
          headers: ["Signal", "Why the naive sum misses it"],
          rows: [
            ["Number and type of intersections", "Waiting at lights is not edge traversal time"],
            [
              "Left turns across traffic",
              "Materially slower than right turns, and invisible in edge length",
            ],
            ["Time of day and day of week", "The same road is a different road at 08:00 and 23:00"],
            ["Weather", "Rain measurably slows an entire region at once"],
            [
              "Historical variance on this route",
              "An ETA should express confidence, not just a point estimate",
            ],
          ],
        },
        bullets: [
          "Report a range or a slightly pessimistic estimate rather than an optimistic point value. Arriving early is a pleasant surprise; arriving late after being promised a precise time is a product failure.",
          "For a departure in the future, live traffic is irrelevant and historical patterns are everything — a 17:00 departure should be estimated from what that road typically does at 17:00.",
          "Feed actual arrival times back in as training data. Navigation systems have an unusually clean supervised signal: they predicted a duration and then observed the real one.",
          "Keep the ETA model separate from the routing engine. Routing needs a cheap, consistent cost function for search; ETA can afford an expensive model on the single chosen path.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Vector tiles",
        pickWhen: "Interactive, themeable, rotatable maps",
        cost: "More client CPU and a heavier rendering SDK",
      },
      {
        choice: "Immutable versioned tile URLs",
        pickWhen: "Always",
        cost: "A map update changes every URL, so the CDN refills from cold",
      },
      {
        choice: "Contraction hierarchies",
        pickWhen: "Long routes needing sub-second answers",
        cost: "Hours of preprocessing that live traffic invalidates",
      },
      {
        choice: "Customisable route planning",
        pickWhen: "Live traffic must affect route choice, not just the ETA",
        cost: "A more complex two-phase pipeline to build and operate",
      },
      {
        choice: "Historical speeds as the base layer",
        pickWhen: "Always — most edges have no live probes",
        cost: "Wrong during genuinely unusual events until live data overrides it",
      },
      {
        choice: "Learned ETA model",
        pickWhen: "Accuracy matters more than explainability",
        cost: "Training infrastructure, and an estimate that is hard to debug",
      },
    ],
    wrapUp: [
      "Say early that this is three systems and pick one to go deep on. Tiles are a CDN problem, geocoding is a search problem, routing is where the engineering is.",
      "Tiles are immutable static files addressed by version, zoom and coordinate, which is why the map feels instant and why there is nothing to invalidate.",
      "Plain Dijkstra is five orders of magnitude too slow on a continental graph. Contraction hierarchies make queries sub-millisecond by precomputing an importance hierarchy that mirrors how people actually drive.",
      "Live traffic is in direct tension with that precomputation. The modern resolution is to split preprocessing into a topology phase and a fast weight phase, with historical speeds as the base layer.",
      "Map matching sits under everything — the blue dot, the instructions, the rerouting and the traffic probes all depend on correctly deciding which road the device is on.",
      "ETA is a learned prediction over route features, not a sum of edge times, and it should be reported with honest pessimism.",
    ],
    followUps: [
      {
        q: "Why can't you just run Dijkstra on the road graph?",
        a: "Because Dijkstra expands outwards in all directions until it reaches the target, so a route from London to Rome settles most of Western Europe — on the order of a hundred million nodes and several seconds. A* with a straight-line heuristic helps by biasing towards the destination but stays far too slow for long routes, since motorways often lead away from the straight line. Contraction hierarchies solve it by precomputing an importance ranking and shortcut edges so the search climbs to the motorway network, crosses, and descends near the destination — about a thousand nodes and under a millisecond. The cost is hours of preprocessing, which is precisely the thing live traffic threatens.",
      },
      {
        q: "Traffic just changed on a thousand roads. Do you rebuild the hierarchy?",
        a: "No — a rebuild takes hours and this happens continuously. The clean answer is customisable route planning, which splits preprocessing into an expensive topology-only phase that depends on road geometry and rarely changes, and a cheap metric phase that absorbs new weights in seconds. Short of that, the practical approach is to query the precomputed hierarchy for candidate paths and then re-evaluate them with live weights, accepting that you might miss a better route the hierarchy pruned. I would also point out that most edges have no live probes at any given moment, so historical speed by road, hour and weekday is the base layer and live data is a correction where observations actually exist.",
      },
      {
        q: "Why are map tiles so fast?",
        a: "Because they are not computed at request time — they are static files. A tile is addressed by map version, zoom, x and y, and that content never changes, so it can be cached immutably in the browser, at the edge and at every layer in between, with a far-future expiry and no invalidation logic at all. Publishing a map update means producing a new version, which produces new URLs, which is the same content-addressing pattern used for static assets applied to a pyramid of geographic data. The only real cost is that a new version refills the CDN from cold, which is why versions are published deliberately rather than continuously.",
      },
      {
        q: "The driver's GPS says they're on the motorway, but they're on the service road beside it. What breaks?",
        a: "Almost everything downstream. The blue dot is wrong, the turn instructions are for the wrong road, the rerouting logic may decide they deviated and start recalculating, and their speed samples pollute the traffic data for a road they are not on. The fix is to match the sequence rather than each point independently — a hidden Markov model over candidate edges, where transitions that would require an impossible manoeuvre or an implausible speed are heavily penalised. That is what stops the position jumping between parallel roads. It is also why I would require consistency across several samples before declaring a deviation, since a mismatch is far more common than an actual wrong turn.",
      },
      {
        q: "Everyone gets rerouted around the same jam. What happens?",
        a: "The jam moves to the alternative route, and if the system reacts to that it can oscillate — this feedback loop is a real, documented effect, not a theoretical one. The navigation advice changes the traffic it is measuring, so the system has to be damped: stagger alternative suggestions across users rather than giving everyone the same new route, treat a sudden collapse in observed speed as needing confirmation across windows before acting, and limit how far weights can swing in a single update. It is worth saying explicitly that this is a control problem rather than a routing problem — the optimal route for one driver and the optimal advice for a million drivers are different questions.",
      },
    ],
    related: [
      "/examples/proximity",
      "/examples/uber",
      "/hld/cdn",
      "/hld/estimation",
      "/hld/caching",
    ],
    furtherReading: [
      {
        label: "Project OSRM — open-source routing with contraction hierarchies",
        href: "https://project-osrm.org/",
      },
      {
        label: "Customizable Route Planning (Microsoft Research)",
        href: "https://www.microsoft.com/en-us/research/publication/customizable-route-planning/",
      },
    ],
  },
];
