// Imported from the Interview Prep Console (lib/data-hld-b.js).
import type { HldAnswer } from "../types";

export const hldB: HldAnswer[] = [
  {
    id: "hld-uber",
    t: "Design Ola / Uber (ride matching)",
    src: ["L2"],
    r: 3,
    stmt: "Asked in the bar raiser of a Lead Engineer loop, alongside Word Ladder. The core problems are location ingestion at scale, geospatial matching, and a trip state machine that must not lose money or double-assign a driver.",
    ask: [
      {
        q: "Which flows: rider requests a ride, driver matching, trip lifecycle, pricing, payments?",
        a: "Request → match → trip lifecycle. Payments and pricing get one slide each.",
      },
      {
        q: "Scale: active drivers, rides per second, location update frequency?",
        a: "1M active drivers, 5K ride requests/s at peak, driver pings every 4 seconds → 250K location writes/s. That number drives everything.",
      },
      {
        q: "Matching objective: nearest driver, shortest ETA, or a batched global optimum?",
        a: "ETA-based within a radius, batched every 1–2 seconds rather than greedy per request — batching gives materially better assignments.",
      },
      {
        q: "Consistency on assignment?",
        a: "Strong: a driver may be assigned to exactly one trip. This is the one place eventual consistency is unacceptable.",
      },
      {
        q: "Do we need surge pricing and driver incentives?",
        a: "Surge as a multiplier computed per hex cell per minute from supply/demand; mention it, do not design it in depth unless asked.",
      },
      {
        q: "Offline behaviour for drivers with poor networks?",
        a: "Client buffers locations and trip events; all trip transitions are idempotent with client-generated ids.",
      },
    ],
    fr: [
      "Driver app publishes location continuously while online",
      "Rider requests a ride from A to B and sees ETA and fare estimate",
      "Matching assigns exactly one nearby driver; driver accepts or declines with a timeout",
      "Trip lifecycle: REQUESTED → ASSIGNED → ARRIVED → STARTED → COMPLETED (or CANCELLED)",
      "Live tracking of the driver on the rider's map",
      "Fare computation and payment capture at completion",
    ],
    nfr: [
      "Match within 5 seconds p95",
      "Location writes must absorb 250K/s without touching the primary database",
      "No double assignment (strong consistency on the driver's state)",
      "Trip state durable and auditable — money depends on it",
      "Regional isolation: an outage in one city must not affect others",
    ],
    scale:
      "1M drivers × 1 ping / 4 s = 250K writes/s, each ~100 bytes → 25 MB/s. Storing every ping for a year is ~700 TB, so keep only a decimated trail (one point per 15 s) in cold storage and current position in memory. 5K requests/s × a 2-second matching window = 10K open requests per batch, which is small once you shard by geography.",
    arch: "  Driver app ──▶ Location Gateway (WebSocket) ──▶ Redis GEO / in-memory\n      │                                              geo index per city\n      │                                                   │\n      └──▶ Kafka: driver.location (decimated) ──▶ Trail store (Cassandra)\n\n  Rider app ──▶ API ──▶ Trip Service ──▶ Postgres (trips, strong)\n                          │   ▲\n                          ▼   │ assignment (atomic CAS)\n                    Matching Service ──▶ geo index (candidates)\n                          │              ETA service (road graph)\n                          ▼\n                    Push/Notification ──▶ driver app (offer, 15 s TTL)\n\n  Pricing Service ──▶ surge per hex/minute (stream from demand + supply)",
    svc: [
      {
        n: "Location Gateway",
        d: "Holds persistent WebSocket connections from drivers, writes the latest position to an in-memory geo index sharded by city/region, and forwards a decimated stream to Kafka. Never writes each ping to a relational database.",
      },
      {
        n: "Geo index",
        d: "Redis GEO (geohash-backed) or an in-process quadtree/H3 index per region. Supports 'drivers within 3 km of point P, status ONLINE'. Sharded by city so one hot market cannot affect others.",
      },
      {
        n: "Matching Service",
        d: "Runs a batched assignment every 1–2 s per region: collect open requests and candidate drivers, score by ETA (and driver acceptance rate), solve a small assignment problem (greedy or Hungarian on a few hundred pairs), then offer.",
      },
      {
        n: "Trip Service",
        d: "The state machine and the source of truth. Assignment uses a conditional update so only one trip can claim a driver. Emits events at every transition.",
      },
      {
        n: "ETA service",
        d: "Road-graph routing with live traffic; cached per (origin cell, destination cell) for estimates, exact for active trips.",
      },
      {
        n: "Pricing / surge",
        d: "Streaming job computing supply/demand per H3 cell per minute; the multiplier is read at request time and frozen into the trip.",
      },
    ],
    seq: "Request → match → trip\n──────────────────────────────────────────────────\nRider  → API      : POST /rides {pickup, drop}\nAPI    → Pricing  : fare estimate + surge for cell\nAPI    → Trip     : create trip (REQUESTED, idempotency key)\nTrip   → Matching : enqueue open request (region shard)\nloop every 1–2 s per region\n  Matching → Geo  : candidates within radius (status=ONLINE)\n  Matching → ETA  : ETA for each candidate\n  Matching → Trip : assign(tripId, driverId)\n  Trip → DB       : UPDATE driver SET status='OFFERED'\n                     WHERE id=? AND status='ONLINE'   ← atomic\n  alt 0 rows updated (driver taken)\n    Matching → next candidate\n  else\n    Trip → Push   : offer to driver (15 s TTL)\n    alt accepted\n      Driver → Trip: accept → status ASSIGNED\n      Trip → Rider : driver details + live ETA\n    else timeout/decline\n      Trip → DB    : driver back to ONLINE, re-enqueue request\nDriver → Trip     : arrived → started → completed (idempotent events)\nTrip   → Payments : capture fare (idempotency key = tripId)\nTrip   → Kafka    : trip.completed → analytics, receipts, ratings",
    db: {
      tables: [
        {
          n: "trips (Postgres, sharded by city)",
          cols: "trip_id PK, rider_id, driver_id, status, pickup_point, drop_point, requested_at, assigned_at, started_at, completed_at, fare, surge, payment_status, version",
          notes:
            "Source of truth. Index (driver_id, status) and (rider_id, requested_at DESC). version for optimistic locking on transitions.",
        },
        {
          n: "drivers",
          cols: "driver_id PK, status (OFFLINE|ONLINE|OFFERED|ON_TRIP), current_trip_id, vehicle, rating, city_id, updated_at",
          notes:
            "The status column is the concurrency control point: assignment is UPDATE ... WHERE status='ONLINE'.",
        },
        {
          n: "driver_location (Redis)",
          cols: "GEOADD city:{id} lon lat driver_id",
          notes:
            "Ephemeral, overwritten every ping, TTL'd if the driver disappears. Never in SQL — 250K writes/s of mutable rows would destroy any OLTP database.",
        },
        {
          n: "location_trail (Cassandra)",
          cols: "PK (trip_id), clustering (ts) → lat, lon, speed",
          notes: "Append-only, queried only by trip, TTL 90 days. Perfect Cassandra shape.",
        },
        {
          n: "trip_events",
          cols: "trip_id, seq, event_type, payload, created_at",
          notes: "Append-only audit of every transition; makes disputes and replays possible.",
        },
        {
          n: "payments",
          cols: "payment_id, trip_id UNIQUE, amount, status, gateway_ref, idempotency_key",
          notes: "UNIQUE(trip_id) is what makes double capture impossible.",
        },
      ],
      sql: "SQL for trips, drivers, payments: they need transactions, exactly-once assignment via conditional updates, and a durable audit trail. Money and assignment are the two places where eventual consistency is not acceptable, so state that plainly. Shard by city — rides are geographically local, so cross-shard queries are rare.",
      nosql:
        "Redis for the live geo index (mutable, hot, ephemeral) and Cassandra for location trails and trip events (append-only, partition-keyed, time-clustered, TTL'd). Kafka for the event backbone. Each of these would be a poor fit in SQL because of write volume or write pattern, and each is a poor fit for the trip state because they lack multi-row transactions.",
      verdict:
        "Split by mutability and consistency need: ephemeral high-frequency state in memory, append-only history in a wide-column store, transactional truth in SQL. Say the sentence 'I would not write driver pings to Postgres' explicitly — it is the fastest way to show you have thought about the write volume.",
    },
    fu: [
      {
        q: "How do you find nearby drivers efficiently?",
        a: "Geohash / H3 cells: index drivers by cell id, and a radius query becomes 'my cell plus its neighbours', which is a handful of key lookups instead of a scan. Redis GEO does this for you (GEOSEARCH). Choose the cell size so a typical cell holds tens of drivers; refine by exact distance after the coarse filter, then by ETA.",
      },
      {
        q: "Two riders are matched to the same driver.",
        a: "The conditional UPDATE on driver status (WHERE status='ONLINE') means exactly one transaction wins; the loser re-enters the matching pool. The geo index is allowed to be stale because it is only a candidate generator — correctness lives in the database row. That separation is the answer they want.",
      },
      {
        q: "Why batch matching instead of assigning greedily?",
        a: "Greedy nearest-driver is locally optimal and globally poor: it can strand a request whose only driver was taken by a request that had alternatives. Collecting requests for 1–2 seconds and solving a small assignment problem measurably reduces wait times. The cost is a couple of seconds of latency, which is worth naming as the trade-off.",
      },
      {
        q: "How does live tracking work?",
        a: "The driver's app publishes over the same WebSocket; the rider subscribes to a channel keyed by trip id. Fan-out through a pub/sub layer (Redis pub/sub or a WebSocket gateway with a routing table) rather than polling. Clients interpolate between points to keep the marker smooth at 1 update per 4 s.",
      },
      {
        q: "A whole region's matching service dies.",
        a: "Regions are isolated shards, so the blast radius is one city. Open requests are in a durable queue so they survive; drivers stay connected to the location gateway. Degrade to simple nearest-driver greedy matching if the optimiser is unavailable — a worse match beats no ride.",
      },
      {
        q: "How do you prevent fare disputes?",
        a: "Freeze the surge multiplier and the estimate into the trip at request time, record the location trail and every state transition with timestamps, and compute the final fare server-side only from recorded data. The trip_events table is what lets support answer 'why was I charged this'.",
      },
    ],
  },
  {
    id: "hld-fooddelivery",
    t: "Design a food delivery system like Swiggy / Zomato",
    src: ["S1"],
    r: 2,
    stmt: "Asked in a Senior loop's system design round: 'design food delivery, explain how services interact, the DB structure and API design'. It is Uber plus inventory plus a three-sided marketplace, so scope it fast.",
    ask: [
      {
        q: "Three actors — customer, restaurant, delivery partner. All three in scope?",
        a: "Yes, but design the order lifecycle end to end and treat search/discovery briefly.",
      },
      {
        q: "Is the menu real-time (items go out of stock mid-day)?",
        a: "Yes — availability toggles are frequent, which makes menu caching interesting.",
      },
      {
        q: "Scale?",
        a: "20M users, 1M orders/day (~12/s average, 200/s at dinner peak), 200K restaurants, 300K delivery partners.",
      },
      {
        q: "Assignment of delivery partners: at order placement or at food-ready time?",
        a: "Predictively, a few minutes before food-ready, using a prep-time estimate — this is the interesting optimisation.",
      },
      {
        q: "Payments: prepaid and cash on delivery? Refunds?",
        a: "Both, with refunds on cancellation — so the order state machine must model payment state separately.",
      },
      {
        q: "Do we need live order tracking?",
        a: "Yes, same push channel as the ride-hailing design.",
      },
    ],
    fr: [
      "Search restaurants by location, cuisine and rating; view a menu with live availability",
      "Cart and checkout with offers, taxes and delivery fee",
      "Restaurant accepts/rejects, marks food ready",
      "Assign a delivery partner and track pickup and delivery",
      "Order state machine with cancellation and refunds",
      "Notifications at each transition to all three parties",
    ],
    nfr: [
      "Menu and search reads are the heaviest traffic — cache aggressively, tolerate seconds of staleness",
      "Order writes must be transactional and idempotent",
      "Peak load is 15× average and concentrated in two windows a day — autoscale accordingly",
      "Partner assignment within 30 s of food-ready",
      "Availability over consistency for discovery; consistency over availability for orders and payments",
    ],
    scale:
      "1M orders/day ≈ 12/s average, 200/s peak. Search/menu reads: 20M users × 20 views ≈ 400M/day ≈ 5K/s, 30K/s peak — a 60:1 read:write ratio, so a CDN plus Redis absorbs most of it. Order row ~2 KB → 2 GB/day, trivial for Postgres. Location pings for 300K partners at 1 per 5 s = 60K writes/s → in-memory, exactly as in the ride design.",
    arch: "  Customer app ──▶ CDN ──▶ API Gateway\n                              │\n        ┌─────────────────────┼──────────────────────┐\n        ▼                     ▼                      ▼\n   Search Service       Order Service           Menu Service\n   (Elasticsearch,      (Postgres, saga)        (Postgres + Redis)\n    geo + filters)            │\n                              ├──▶ Payment Service ──▶ gateway\n                              ├──▶ Restaurant push (POS / partner app)\n                              ├──▶ Assignment Service ──▶ geo index (Redis)\n                              └──▶ Kafka: order.* ──▶ notifications,\n                                                      analytics, ETA model\n  Delivery partner app ──▶ Location Gateway ──▶ Redis GEO",
    svc: [
      {
        n: "Search / discovery",
        d: "Elasticsearch with geo filters, serving 'restaurants near me, open now, rated 4+'. Denormalised documents rebuilt from restaurant events; stale by seconds, which is fine.",
      },
      {
        n: "Menu Service",
        d: "Menu versions per restaurant, item availability toggles. Cached in Redis with pub/sub invalidation so an out-of-stock item disappears within a second or two.",
      },
      {
        n: "Order Service",
        d: "Owns the order state machine and orchestrates the saga: payment authorisation → restaurant acceptance → assignment → delivery → capture. Every step idempotent and compensatable.",
      },
      {
        n: "Assignment Service",
        d: "Predicts food-ready time, finds nearby partners via the geo index, batches assignments, handles decline/timeout, and supports batching two orders on one trip.",
      },
      {
        n: "Payment Service",
        d: "Authorise at checkout, capture on delivery (or on acceptance), refund on cancellation. Idempotency keys and webhook reconciliation.",
      },
      {
        n: "Notification Service",
        d: "Consumes order events and pushes to customer, restaurant and partner across push/SMS/email with per-event templates.",
      },
    ],
    seq: "Order lifecycle (saga)\n──────────────────────────────────────────────────────\nCustomer → API    : POST /orders (cart, address, idem-key)\nAPI → Menu        : validate items + prices + availability\nAPI → Payment     : authorise (hold funds)\nAPI → Order DB    : insert order (PLACED)\nOrder → Restaurant: push new order (accept within 90 s)\n  alt rejected / timeout\n    Order → Payment: void authorisation\n    Order → Customer: cancelled + suggestions\n  else accepted\n    Order → DB      : CONFIRMED, prep_time estimate\n    Order → Kafka   : order.confirmed\n    Assignment      : schedule partner search at (ready - 4 min)\n    Assignment → Geo: candidate partners\n    Assignment → DB : claim partner (UPDATE ... WHERE status='FREE')\n    Partner → Order : picked up → PICKED_UP\n    Partner → Order : delivered → DELIVERED\n    Order → Payment : capture (idem-key = order_id)\n    Order → Kafka   : order.delivered → ratings, analytics",
    db: {
      tables: [
        {
          n: "restaurants",
          cols: "id PK, name, location (geography), city_id, is_open, rating, prep_time_p50, tags[]",
          notes:
            "Postgres with PostGIS for the geo column; mirrored into Elasticsearch for search.",
        },
        {
          n: "menu_items",
          cols: "id PK, restaurant_id, name, price, category, is_available, updated_at",
          notes:
            "Index (restaurant_id, is_available). Availability flips often — cache with pub/sub invalidation rather than long TTLs.",
        },
        {
          n: "orders",
          cols: "order_id PK, customer_id, restaurant_id, partner_id, status, subtotal, taxes, delivery_fee, discount, total, payment_status, placed_at, confirmed_at, ready_at, delivered_at, version",
          notes:
            "The hub. Index (customer_id, placed_at DESC), (restaurant_id, status), (partner_id, status).",
        },
        {
          n: "order_items",
          cols: "order_id, item_id, name_snapshot, price_snapshot, qty, customisations JSONB",
          notes:
            "Snapshot name and price — the menu will change and a past order must render as it was billed.",
        },
        {
          n: "delivery_partners",
          cols: "id PK, status (OFFLINE|FREE|ASSIGNED|DELIVERING), current_order_id, city_id, vehicle",
          notes:
            "status is the atomic claim point, same pattern as the driver table in ride-hailing.",
        },
        {
          n: "payments / refunds",
          cols: "payment_id, order_id UNIQUE, amount, state, gateway_ref, idempotency_key",
          notes: "Separate lifecycle from the order; reconcile with gateway webhooks.",
        },
      ],
      sql: "SQL for orders, payments, restaurants and menus: multi-row transactions (order + items + payment state), foreign keys, and reporting queries that change constantly (restaurant dashboards, finance reconciliation). Shard by city_id when needed — orders are local, so cross-shard joins are rare.",
      nosql:
        "Elasticsearch for discovery (geo + text + filters + ranking); Redis for menu caching, partner geo index, and hot counters (live order counts per restaurant); Cassandra or S3 for the location trail and the event archive; Kafka as the backbone between services.",
      verdict:
        "The interview point: discovery is read-heavy and tolerates staleness, so it gets a denormalised search store and caches; ordering and payment are write-critical and need transactions, so they stay in SQL. Being explicit about which half of the product tolerates eventual consistency is the answer.",
    },
    fu: [
      {
        q: "How do services interact — REST everywhere, or events?",
        a: "Synchronous REST/gRPC only where the caller needs the answer now (menu validation, payment authorisation). Everything downstream of a state change — notifications, analytics, search indexing, ETA models — consumes Kafka events. Say why: it keeps the checkout path short and lets consumers fail without failing the order.",
      },
      {
        q: "How do you handle a restaurant that never responds?",
        a: "A timeout in the saga (90 s) triggers auto-cancel, voids the authorisation, and offers alternatives. Every step of the saga has a timeout and a compensating action — that is the difference between a saga and a distributed transaction, and it is worth saying.",
      },
      {
        q: "Item goes out of stock after the order is placed.",
        a: "Restaurant partially accepts; the order is recalculated, the customer approves or cancels, and the payment authorisation is adjusted (void and re-authorise if the total rises). Model it as an explicit state (AMENDED) rather than mutating the order silently.",
      },
      {
        q: "How do you batch two orders onto one delivery partner?",
        a: "Only when pickup points are close, drop points are on the way, and the second order's food-ready time is within a few minutes. Score by added detour time; cap at two orders. It is a routing optimisation on top of assignment, and mentioning the customer-experience risk (the first order arrives later) shows product judgment.",
      },
      {
        q: "Dinner peak is 15× average.",
        a: "Autoscale stateless services on queue depth rather than CPU; pre-warm before known peaks; use the queue to absorb bursts; degrade gracefully — turn off expensive personalisation in search first, keep ordering working. Also shard the geo index by city so one city's peak does not slow another's.",
      },
      {
        q: "How do you compute ETA?",
        a: "Sum of prep time (model per restaurant per hour of day) plus assignment wait plus travel time from the routing service. Learn from actuals; expose a range, not a point, and pad it — under-promising is cheaper than a late delivery.",
      },
    ],
  },
  {
    id: "hld-whatsapp",
    t: "Design a WhatsApp-like chat system",
    src: ["S3"],
    r: 2,
    stmt: "Asked as an HLD in a 2025 loop by a Lead engineer. The core is connection management at scale, message ordering and delivery receipts, plus offline delivery.",
    ask: [
      {
        q: "One-to-one only, or groups too? Group size limit?",
        a: "Both; groups capped at 256 — the cap matters because fan-out cost is linear in it.",
      },
      {
        q: "Do we store message history on the server?",
        a: "Assume yes for this design (store until delivered, plus configurable retention). Note that end-to-end encryption would change what the server can do.",
      },
      {
        q: "Delivery semantics — at-least-once with dedupe, or exactly-once?",
        a: "At-least-once transport with client-side dedupe by message id; exactly-once across a network is a fiction worth naming.",
      },
      {
        q: "Receipts: sent, delivered, read? Typing indicators and presence?",
        a: "All of them — they multiply traffic by ~3×, which is worth mentioning.",
      },
      {
        q: "Scale?",
        a: "500M users, 50M concurrent connections, 100K messages/s peak.",
      },
      {
        q: "Media?",
        a: "Uploaded separately to object storage; the message carries a key and thumbnail.",
      },
    ],
    fr: [
      "Send and receive 1:1 and group messages in real time",
      "Deliver to offline recipients when they reconnect, in order",
      "Sent / delivered / read receipts",
      "Presence (online, last seen) and typing indicators",
      "Message history sync across a user's devices",
      "Media messages via object storage",
    ],
    nfr: [
      "End-to-end delivery under 500 ms p95 when both parties are online",
      "Per-conversation ordering must be stable and identical on all devices",
      "No message loss once the server has acknowledged it",
      "50M concurrent long-lived connections — connection state is the scaling problem, not CPU",
      "Graceful reconnect with resume, not full resync",
    ],
    scale:
      "50M concurrent WebSocket connections at ~10 KB of kernel + app memory each ≈ 500 GB across the fleet; at ~500K connections per node that is ~100 gateway nodes. 100K messages/s × 200 bytes ≈ 20 MB/s. Group messages amplify: a 256-member group message is 255 deliveries, so a group-heavy workload can be 10× the 1:1 rate — quote this.",
    arch: "  Phone ──WebSocket──▶ ┌──────────────┐\n                        │ Chat Gateway │ (stateful, holds connections)\n                        └──────┬───────┘\n                               │ registers user→node\n                               ▼\n                         Session Registry (Redis)\n                               │\n  ┌────────────────────────────┼─────────────────────────┐\n  ▼                            ▼                         ▼\nMessage Service          Group Service            Presence Service\n  │  persist + seq          member lists            heartbeat + TTL\n  ▼\nCassandra (messages by conversation)\n  │\n  ├─▶ Kafka: message.created ──▶ Push workers (APNs/FCM for offline)\n  └─▶ Media: S3 + CDN (keys only in the message)",
    svc: [
      {
        n: "Chat Gateway",
        d: "Terminates WebSockets, authenticates, and maps user/device → node in a Redis session registry. Stateful and horizontally scaled; a consistent-hash or registry lookup routes a message to the node holding the recipient's connection.",
      },
      {
        n: "Message Service",
        d: "Assigns a per-conversation sequence number, persists the message, then hands it to delivery. Sequence assignment is what guarantees consistent ordering across devices.",
      },
      {
        n: "Delivery / fan-out",
        d: "For 1:1, one lookup and one push. For groups, expand membership and push per member (fan-out on write), writing to each recipient's undelivered queue if they are offline.",
      },
      {
        n: "Presence Service",
        d: "Heartbeats with a TTL key per user; publishes presence changes only to subscribers who are actually viewing that chat, otherwise presence dominates traffic.",
      },
      {
        n: "Push workers",
        d: "Send APNs/FCM notifications when the recipient has no live connection, with collapse keys so 40 queued messages do not become 40 notifications.",
      },
      {
        n: "Sync service",
        d: "On reconnect, a client sends its last seen sequence per conversation and receives only the delta.",
      },
    ],
    seq: "Send and deliver\n────────────────────────────────────────────────────\nA → Gateway1  : SEND {clientMsgId, convId, body}\nGateway1 → Msg: persist (assign seq = next for convId)\nMsg → Cassandra: INSERT (conv_id, seq, sender, body, ts)\nMsg → Gateway1: ACK {serverMsgId, seq}      → A sees ✓ sent\nMsg → Registry: where is B?\n  alt B online on Gateway7\n    Msg → Gateway7 → B : DELIVER\n    B   → Gateway7     : DELIVERED receipt\n    Gateway7 → Msg → Gateway1 → A : ✓✓ delivered\n  else B offline\n    Msg → undelivered queue (per user)\n    Msg → Kafka → Push worker → APNs/FCM\n    on reconnect:\n      B → Gateway : RESUME {lastSeq per conv}\n      Gateway → Msg : fetch delta, deliver in order\nB reads chat → READ receipt → propagated to A\n\nGroup message (256 members)\n────────────────────────────────────────────────────\nA → Msg        : SEND to groupId\nMsg → Group    : member list (cached)\nMsg → Cassandra: one row in the group conversation\nloop per member\n  Msg → Registry → Gateway_n → member  (or queue + push)",
    db: {
      tables: [
        {
          n: "messages (Cassandra)",
          cols: "PK (conversation_id), clustering (seq DESC) → message_id, sender_id, type, body, media_key, created_at",
          notes:
            "Partition per conversation, clustered by sequence: 'last 50 messages of this chat' is a single partition read. The canonical Cassandra shape.",
        },
        {
          n: "conversations",
          cols: "conversation_id PK, type (direct|group), created_at, last_message_seq, last_message_at",
          notes:
            "last_message_seq is the counter used to assign order; update with a lightweight transaction or a per-conversation sequencer.",
        },
        {
          n: "conversation_members",
          cols: "conversation_id, user_id, role, joined_at, last_read_seq, muted",
          notes:
            "Both directions needed: members of a conversation, and conversations of a user (a second table or an index).",
        },
        {
          n: "undelivered (Redis/Cassandra)",
          cols: "user_id → list of (conversation_id, seq)",
          notes: "Pointer queue, not message copies — the message body stays in one place.",
        },
        {
          n: "sessions (Redis)",
          cols: "user:{id}:devices → {device_id: gateway_node}, TTL on heartbeat",
          notes: "Routing table for delivery; expires automatically when a connection dies.",
        },
        {
          n: "users / devices (Postgres)",
          cols: "user_id, phone, display_name; device_id, push_token, platform, last_seen",
          notes: "Small, relational, rarely written — SQL is right here.",
        },
      ],
      sql: "SQL for the small relational core: users, devices, push tokens, group metadata and settings. These need uniqueness (one phone number per account), transactions (adding a member and writing a system message), and flexible queries by an admin/support tool.",
      nosql:
        "Cassandra for messages: the write rate is enormous, the access pattern is exactly one partition per conversation ordered by time, and there are no joins. Redis for session routing, presence TTLs and undelivered pointers — all ephemeral. S3+CDN for media. Kafka for the push pipeline.",
      verdict:
        "Message storage is the textbook case for a wide-column store; everything relational stays in Postgres. The trade-off to name: Cassandra gives linear write scaling and cheap time-range reads per conversation, but no joins and no transactions — which is acceptable because a message is immutable once written.",
    },
    fu: [
      {
        q: "How do you guarantee message ordering?",
        a: "Per-conversation sequence numbers assigned server-side, not client timestamps (clocks are wrong and networks reorder). Clients render by seq and detect gaps to trigger a resync. Global ordering across conversations is unnecessary and would be a bottleneck — say that explicitly.",
      },
      {
        q: "How do you route a message to the right gateway node?",
        a: "A session registry in Redis maps user/device → node, refreshed by heartbeat with a TTL. The sending node looks up and forwards over an internal RPC/pub-sub. The alternative — consistent hashing users to nodes — removes the lookup but rebalances badly on deploys; mention both.",
      },
      {
        q: "What happens when a gateway node dies with 500K connections?",
        a: "Clients reconnect (with jittered backoff to avoid a thundering herd), land on other nodes, and resume from their last sequence. Registry entries expire by TTL. Undelivered messages were persisted before the ack, so nothing is lost — that ordering (persist, then ack, then deliver) is the key design decision.",
      },
      {
        q: "Exactly-once delivery?",
        a: "Not achievable over an unreliable network; use at-least-once plus a client-generated message id for idempotent dedupe on both the server and the receiving client. Say this rather than claiming exactly-once — interviewers listen for it.",
      },
      {
        q: "How would end-to-end encryption change the design?",
        a: "The server stores ciphertext and cannot index, search or generate previews; key exchange (X3DH) and per-message ratcheting (Double Ratchet) move to the clients; multi-device becomes a per-device session problem; and server-side features like search must move to the client. Scope it out early unless asked, but knowing the consequences reads well.",
      },
      {
        q: "Presence for 50M users?",
        a: "Do not broadcast. Presence is a Redis key with a short TTL refreshed by heartbeat, and it is pushed only to clients that have the chat open (subscription-based). Naive presence fan-out to every contact is the classic scaling mistake in this question.",
      },
    ],
  },
  {
    id: "hld-instagram",
    t: "Design Instagram (photo sharing + feed)",
    src: ["S5"],
    r: 3,
    stmt: "Asked in a Senior system design round with a focus on API design, database design and caching. Most of the feed machinery matches the Facebook answer, so this card concentrates on the media pipeline, the API surface and caching.",
    ask: [
      {
        q: "Core flows: upload a photo, follow, home feed, explore, stories?",
        a: "Upload, follow, home feed. Explore and stories only if asked.",
      },
      {
        q: "Photo sizes and how many variants per upload?",
        a: "Original up to 10 MB; generate 4 variants (thumb, small, medium, large) plus WebP/AVIF.",
      },
      {
        q: "Feed: chronological or ranked? Can it be stale?",
        a: "Ranked in reality; chronological for this design. Seconds of staleness are fine.",
      },
      {
        q: "Scale?",
        a: "500M users, 100M photos/day, 1B feed reads/day.",
      },
      {
        q: "Do we need edit/delete of posts and their propagation?",
        a: "Yes — which is why feeds store ids, not copies.",
      },
      {
        q: "Are images public or permission-controlled?",
        a: "Both: private accounts need signed URLs, public ones can be cached hard at the CDN.",
      },
    ],
    fr: [
      "Upload a photo with a caption, tags and location",
      "Generate multiple resolutions asynchronously and serve from a CDN",
      "Follow / unfollow; home feed of followed accounts",
      "Like and comment with counts",
      "Profile grid, paginated",
      "Explore / hashtag search (secondary)",
    ],
    nfr: [
      "Feed p99 under 200 ms; image load from the edge under 100 ms",
      "Upload must succeed on flaky mobile networks (resumable, retryable)",
      "99.99% availability for reads; uploads may degrade before reads",
      "Storage growth of ~100 TB/day of originals must be tiered",
      "Read:write ratio of 100:1 — design for reads",
    ],
    scale:
      "100M photos/day × ~1 MB average original ≈ 100 TB/day; variants add ~40%. That is why originals move to cold storage after 30 days and only variants stay hot. Feed reads: 1B/day ≈ 12K/s average, 40K/s peak. Metadata is small: 100M rows/day × 500 bytes ≈ 50 GB/day of posts — the photos dominate, the database does not.",
    arch: "  Mobile ──1. POST /media/upload-url──▶ API ──▶ pre-signed S3 URL\n     │\n     └──2. PUT bytes──▶ S3 (originals bucket)\n                          │ event\n                          ▼\n                   Transcode workers ──▶ S3 (variants) ──▶ CDN\n                          │\n                          ▼\n  3. POST /posts ──▶ Post Service ──▶ Postgres (posts, shard by user)\n                          │\n                          └──▶ Kafka ──▶ Fan-out workers ──▶ Redis feeds\n                                       └──▶ Search index (hashtags)\n\n  GET /feed ──▶ Feed Service ──▶ Redis (post id list)\n                     └──▶ Post cache (mget) ──▶ CDN URLs in response",
    svc: [
      {
        n: "Upload service",
        d: "Issues pre-signed URLs so bytes never touch the API tier; validates size and mime; creates a media record in PENDING.",
      },
      {
        n: "Transcode pipeline",
        d: "Consumes object-created events; produces 4 variants plus modern formats; idempotent by (media_id, variant); writes keys back and flips the post to READY.",
      },
      {
        n: "Post service",
        d: "Creates the post row referencing media ids, publishes post.created.",
      },
      {
        n: "Fan-out + Feed service",
        d: "Same hybrid push/pull design as the Facebook answer: precompute for normal accounts, pull for accounts with huge follower counts.",
      },
      {
        n: "CDN",
        d: "Serves variants with long cache lifetimes and immutable URLs (hash in the path) so invalidation is never needed; private accounts get short-lived signed URLs instead.",
      },
      {
        n: "Counter service",
        d: "Likes and comment counts in Redis with periodic persistence; approximate counts for very hot posts.",
      },
    ],
    seq: "Upload and publish\n──────────────────────────────────────────────\nApp → API   : POST /media/upload-url {mime, size}\nAPI → S3    : pre-sign PUT (key = tenant/user/uuid)\nApp → S3    : PUT bytes (resumable, retried)\nS3  → Queue : ObjectCreated\nQueue → Transcoder: make thumb/small/medium/large + webp\nTranscoder → S3 : variants\nTranscoder → DB : media READY, variant keys\nApp → API   : POST /posts {mediaId, caption, tags}\nAPI → DB    : insert post\nAPI → Kafka : post.created\nKafka → FanOut: push post_id into follower feed lists\n\nFeed read\n──────────────────────────────────────────────\nApp → API   : GET /feed?cursor=\nAPI → Redis : LRANGE feed:{user} (post ids)\nAPI → Cache : MGET post:{id} (hydrate, batch)\nAPI → App   : posts + CDN URLs per variant\nApp → CDN   : GET image (edge hit ~95%)",
    db: {
      tables: [
        {
          n: "posts",
          cols: "post_id (time-sortable) PK, user_id, caption, media_ids[], location, created_at, deleted_at",
          notes: "Shard by user_id; index (user_id, created_at DESC) for the profile grid.",
        },
        {
          n: "media",
          cols: "media_id PK, user_id, status, original_key, variants JSONB {thumb, small, medium, large}, width, height, created_at",
          notes: "Variants as JSONB keeps the row compact and avoids a join per image.",
        },
        {
          n: "follows",
          cols: "(follower_id, followee_id) PK + inverse index",
          notes: "Same as the Facebook design: both directions are needed.",
        },
        {
          n: "likes",
          cols: "(post_id, user_id) PK, created_at",
          notes: "Existence check for 'did I like this'; counts live in Redis.",
        },
        {
          n: "comments",
          cols: "comment_id, post_id, user_id, text, parent_id, created_at",
          notes: "Index (post_id, created_at); top-level and replies via parent_id.",
        },
        {
          n: "feed:{user} (Redis ZSET)",
          cols: "score = post_id, capped ~1000",
          notes: "Materialised feed; rebuildable from posts + follows.",
        },
        {
          n: "hashtags (Elasticsearch)",
          cols: "post_id, tags[], caption, created_at",
          notes: "Search and explore; eventually consistent by design.",
        },
      ],
      sql: "SQL for posts, media metadata, follows, likes and comments — relational, transactional (a post and its media references must be consistent), and queried in several shapes. Sharded Postgres or Vitess-style MySQL is what the real products use.",
      nosql:
        "Object storage for images (never the database), Redis for feeds and counters, Elasticsearch for tags and search, Cassandra if the activity/notification stream grows beyond what Postgres should hold. The decision rule again: bytes → object store, hot derived lists → Redis, text search → search engine, relational truth → SQL.",
      verdict:
        "Same verdict as the Facebook question, with the media pipeline as the differentiator. If you get asked both, say so and spend the time on the parts that differ — interviewers appreciate the compression.",
    },
    fu: [
      {
        q: "How do you design the API?",
        a: "Resource-oriented and versioned: POST /v1/media/upload-url, POST /v1/posts, GET /v1/feed?cursor=&limit=, POST /v1/posts/{id}/likes, GET /v1/users/{id}/posts. Cursor pagination everywhere, idempotency keys on POST, ETags on cacheable GETs, and image URLs returned per variant so the client picks by screen density. Mention field selection or GraphQL for mobile bandwidth if they push.",
      },
      {
        q: "How do you cache images effectively?",
        a: "Immutable, content-hashed URLs with Cache-Control: public, max-age=31536000, immutable — no invalidation needed because a new image is a new URL. Private content uses short-lived signed URLs and a lower TTL. Cache the JSON feed response for a few seconds too; at 40K reads/s even a 5-second cache removes most database traffic.",
      },
      {
        q: "What about the thundering herd on a viral post?",
        a: "Hydrate posts from a cache with request coalescing (single-flight) so one miss does not become 10,000 database reads; pre-warm the cache when a post crosses a popularity threshold; serve stale-while-revalidate.",
      },
      {
        q: "How do you delete a photo everywhere?",
        a: "Soft delete the post row (feeds store ids and hydration filters deleted posts), then asynchronously delete variants and originals, and purge the CDN by path. Because feeds hold ids rather than copies, deletion propagates without touching millions of feed lists — which is exactly why the feed stores ids.",
      },
      {
        q: "How do you keep storage costs sane?",
        a: "Tier: originals to infrequent-access after 30 days and to archive after a year; keep only the variants hot; recompress to AVIF/WebP; deduplicate identical uploads by content hash. Say the number: originals are ~70% of the bytes and are almost never read after the first week.",
      },
    ],
  },
  {
    id: "hld-youtube-comments",
    t: "Design the YouTube comment section",
    src: ["S7"],
    r: 3,
    stmt: "The HLD round in a 2026 Senior loop. A deceptively deep question: nested replies, ranking, extreme write bursts on popular videos, spam filtering and counters.",
    ask: [
      {
        q: "How deep does nesting go?",
        a: "Two levels — top-level comments and replies — as YouTube actually does. Unbounded nesting changes the data model, so confirm it.",
      },
      {
        q: "Ordering: top (ranked) or newest?",
        a: "Both, with 'top' as the default — ranking by likes, replies, recency and author signals.",
      },
      {
        q: "Scale?",
        a: "1B views/day, ~1% comment → 10M comments/day, but a viral premiere can take 10K comments/minute on one video.",
      },
      {
        q: "Can comment counts be approximate?",
        a: "Yes for display, exact for moderation dashboards.",
      },
      {
        q: "Moderation: pre-publish filtering, author blocklists, held-for-review?",
        a: "Yes — spam and toxicity scoring, author-level word filters, and a held queue.",
      },
      {
        q: "Edit and delete?",
        a: "Yes, with an edited marker; deletes are soft.",
      },
    ],
    fr: [
      "Post a top-level comment or a reply",
      "List comments for a video sorted by top or newest, paginated",
      "Load replies for a comment on demand",
      "Like/dislike a comment; report it",
      "Edit and soft-delete",
      "Creator tools: pin, heart, block a user, hold for review",
    ],
    nfr: [
      "Read latency under 150 ms for the first page",
      "Absorb 10K writes/minute bursts on a single video without hotspotting",
      "Eventual consistency for counts and ranking; read-your-own-writes for the author",
      "Spam scoring must not block the write path",
      "Storage: billions of rows, so partitioning and archival are mandatory",
    ],
    scale:
      "10M comments/day ≈ 115/s average — trivial. The problem is skew: one video can take 200/s on its own while a billion videos take none. All the design pressure is on avoiding a hot partition and on read amplification (each of the 1B daily views may load the comment section).",
    arch: "  Client ──▶ CDN (cached first page JSON, ~30 s) ──▶ API\n                                                     │\n            ┌────────────────────────────────────────┼───────────┐\n            ▼                                        ▼           ▼\n      Comment Write Service                  Comment Read     Counter\n            │                                 Service         Service\n            ├──▶ Cassandra (comments by video, bucketed)      (Redis)\n            ├──▶ Kafka: comment.created\n            │        ├──▶ Spam/toxicity scorer ──▶ hide / hold\n            │        ├──▶ Ranking updater ──▶ Redis ZSET per video\n            │        ├──▶ Counter increments\n            │        └──▶ Notification to video owner / parent author\n            ▼\n     Moderation queue (creator + automated)",
    svc: [
      {
        n: "Write service",
        d: "Validates, persists, returns immediately, and publishes an event. Synchronous spam checks are limited to cheap rules (rate limits, blocklists); ML scoring happens asynchronously and can hide a comment after the fact.",
      },
      {
        n: "Read service",
        d: "Serves the ranked page from a Redis ZSET of comment ids per video and hydrates bodies in a batch. Falls back to Cassandra for cold videos and deep pagination.",
      },
      {
        n: "Ranking updater",
        d: "Consumes like/reply events and updates the score in the ZSET (score = f(likes, replies, age, creator signals)). Batched so a viral comment does not cause a write per like.",
      },
      {
        n: "Counter service",
        d: "Redis counters per video and per comment, flushed periodically; exact recount from the store during nightly reconciliation.",
      },
      {
        n: "Moderation",
        d: "Async scoring, a held queue for borderline content, creator blocklists applied at write time, and an appeals path.",
      },
      {
        n: "Notification",
        d: "Notifies the video owner and the parent comment's author, with rate limiting so a popular thread does not spam.",
      },
    ],
    seq: "Post a comment\n──────────────────────────────────────────────\nClient → API    : POST /videos/{id}/comments {text, parentId?}\nAPI → Rules     : rate limit + blocklist (cheap, synchronous)\nAPI → Cassandra : INSERT (video_id, bucket, comment_id...)\nAPI → Redis     : ZADD ranked:{video} score comment_id\nAPI → Redis     : INCR count:{video}\nAPI → Client    : 201 (author sees it immediately)\nAPI → Kafka     : comment.created\nKafka → Scorer  : toxicity/spam model\n  alt score > threshold\n    Scorer → store: status=HELD  (disappears from ranked list)\nKafka → Notify  : video owner, parent author\n\nRead the comment section\n──────────────────────────────────────────────\nClient → CDN    : GET /videos/{id}/comments?sort=top\n  alt cache hit (< 30 s old)\n    CDN → Client: cached page\n  else\n    CDN → API   : miss\n    API → Redis : ZREVRANGE ranked:{video} 0 19\n    API → Cass  : MGET comment bodies\n    API → Redis : counts + my-like flags (batch)\n    API → Client: page + cursor",
    db: {
      tables: [
        {
          n: "comments (Cassandra)",
          cols: "PK (video_id, bucket), clustering (created_at DESC, comment_id) → author_id, text, parent_id, status, like_count, reply_count",
          notes:
            "bucket = day or hash suffix to stop a viral video creating one enormous partition. This bucketing answer is the point of the question.",
        },
        {
          n: "replies",
          cols: "PK (parent_comment_id), clustering (created_at ASC) → comment_id, author_id, text",
          notes:
            "Replies are a separate partition so loading a thread does not scan the video's whole comment set.",
        },
        {
          n: "ranked:{video_id} (Redis ZSET)",
          cols: "member = comment_id, score = ranking score",
          notes:
            "Trimmed to the top few thousand; rebuildable from the store. Ranking is derived data.",
        },
        {
          n: "comment_likes",
          cols: "(comment_id, user_id) PK",
          notes: "Existence check only; counts live in Redis and are reconciled.",
        },
        {
          n: "moderation_queue (Postgres)",
          cols: "comment_id, video_id, reason, score, state, reviewed_by, reviewed_at",
          notes: "Small, relational, human workflow — SQL is correct here.",
        },
        {
          n: "creator_settings (Postgres)",
          cols: "channel_id, blocked_words[], blocked_users[], hold_all, updated_at",
          notes: "Read on every write; cached per channel.",
        },
      ],
      sql: "SQL for the human-workflow and configuration data: moderation queue, creator settings, appeals, audit. Small volumes, relational, and edited by people.",
      nosql:
        "Cassandra for the comment corpus: billions of immutable-ish rows, always read by (video, time) or (parent, time), no joins, and linear write scaling with TTL/archival. Redis for ranking and counters, which are derived and hot. A single relational table of billions of comments with an index on (video_id, score) would suffer hot-row contention on viral videos and painful index maintenance.",
      verdict:
        "Wide-column for the corpus, Redis for the ranked view and counters, SQL for moderation. Name the hot-partition risk and the bucketing fix unprompted — that is what separates a good answer here.",
    },
    fu: [
      {
        q: "How do you avoid a hot partition on a viral video?",
        a: "Add a bucket to the partition key — by day, or comment_id % N — so writes spread across N partitions, and read by querying all buckets in parallel and merging. Without it, one video's partition grows unbounded and every write hits the same node. Cassandra partitions should stay well under ~100 MB, which is the concrete reason.",
      },
      {
        q: "How do you rank without recomputing everything?",
        a: "Keep the score in a Redis ZSET and update incrementally on like/reply events, with a time-decay factor applied lazily at read (score / (age + 2)^1.5, the Hacker News shape). Recompute in batch nightly for correctness. Ranking is derived data, so losing it is a rebuild, not an outage.",
      },
      {
        q: "Counts drift between Redis and the store. What do you do?",
        a: "Accept approximate display counts, reconcile in a nightly batch from the source of truth, and make the increment idempotent by keying on (comment_id, user_id) in the likes table so a retried like cannot double count.",
      },
      {
        q: "How do you paginate deep into a comment thread?",
        a: "Cursor on (score, comment_id) for ranked order and on (created_at, comment_id) for newest — never OFFSET. For ranked pagination beyond the cached ZSET, fall back to newest-first from the store and tell the client that ordering changes past that depth; that trade-off is what real products do.",
      },
      {
        q: "Spam and abuse?",
        a: "Layers: per-user rate limits, creator word/user blocklists applied synchronously, an async ML score that can hide or hold, user reports that feed the same queue, and shadow-hiding for repeat offenders so they do not immediately create a new account. Keep the expensive model off the write path.",
      },
      {
        q: "How do you keep the first page fast for 1B views?",
        a: "Cache the rendered first page JSON at the CDN for 15–30 s keyed by (video, sort, locale), with stale-while-revalidate. Comment sections are the ideal cache target: enormous read amplification and a tolerance for seconds of staleness.",
      },
    ],
  },
];
