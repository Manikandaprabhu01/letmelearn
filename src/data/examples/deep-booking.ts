import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const bookingDeepExamples: DesignExample[] = [
  {
    slug: "hotel-reservation",
    title: "Design a Hotel Reservation System",
    source: "Volume 2",
    chapter: 7,
    difficulty: "intermediate",
    minutes: 22,
    tags: ["inventory", "booking", "concurrency", "overbooking", "date ranges"],
    companies: ["Booking.com", "Airbnb", "Expedia", "Marriott"],
    summary:
      "Inventory is the whole problem, and it is harder than it looks because the unit is not a room — it is a room-night, and a five-night booking must atomically claim five of them. Layer on the fact that hotels deliberately overbook, that the same room is sold through a dozen channels at once, and that availability search must be fast while booking must be exactly right, and you get a system where the read path and the write path have almost nothing in common.",
    clarifying: [
      {
        q: "Are we booking a specific room, or a room type?",
        a: "A room type, which is how hotels actually work and is a large simplification: inventory becomes a count per type per night rather than a specific physical room, and the actual room number is assigned at check-in. Designing around specific rooms makes the concurrency problem much harder for no product benefit.",
      },
      {
        q: "Is overbooking allowed?",
        a: "Yes, and it is deliberate rather than a bug. Hotels routinely sell 105 to 110 percent of capacity because cancellations and no-shows are predictable, so the inventory check is against an adjusted limit and the system needs a walk-the-guest path when the gamble loses.",
      },
      {
        q: "Do we own the inventory, or syndicate it?",
        a: "Both in practice — the same room is sold on the hotel's own site and through several online travel agencies simultaneously. That makes the inventory count a shared, contended resource with external writers, which is why optimistic strategies matter more than pessimistic ones.",
      },
      {
        q: "What is the read-to-write ratio?",
        a: "Enormously read-heavy: people search far more than they book, perhaps a thousand to one. So search can be served from a cache that is seconds stale, while booking must hit the authoritative store.",
      },
      {
        q: "What happens if payment fails after we hold the room?",
        a: "The hold is released, but the interesting case is a payment timeout rather than a decline. If the outcome is unknown, releasing the room risks selling it twice, so the hold has to persist until the payment is resolved.",
      },
    ],
    requirements: {
      functional: [
        "Search available room types for a date range, with filters",
        "Hold and then confirm a reservation across consecutive nights",
        "Modify or cancel a booking, returning inventory",
        "Support deliberate overbooking with configurable limits",
      ],
      nonFunctional: [
        "Search p95 under 300 ms; stale by seconds is acceptable",
        "A booking must never exceed the overbooking limit for any night",
        "No double-charging, ever",
        "Inventory must stay correct under concurrent booking from multiple channels",
      ],
    },
    math: [
      {
        label: "Inventory rows",
        expr: "500 K hotels × 5 room types × 365 nights",
        result: "≈ 900 M rows/year",
        note: "One row per hotel, room type and night. Large but entirely ordinary — this is a well-indexed relational table.",
      },
      {
        label: "Search volume",
        expr: "10 M searches/day ÷ 10⁵",
        result: "≈ 120 QPS, peak ~600",
        note: "Small enough that the interesting question is latency per search, not throughput.",
      },
      {
        label: "Booking volume",
        expr: "~0.1% conversion on searches",
        result: "≈ 10 bookings/s",
        note: "Tiny. Which is why the write path can afford real transactions rather than clever lock-free schemes.",
      },
      {
        label: "Nights per booking",
        expr: "average stay ≈ 2.5 nights",
        result: "2–3 rows locked per booking",
        note: "The atomic unit is all nights of the stay, which is what makes this a multi-row transaction rather than a counter decrement.",
      },
      {
        label: "Overbooking headroom",
        expr: "typical no-show + cancellation rate 5–15%",
        result: "sell ~105–110% of capacity",
        note: "Data-driven per hotel and per season; getting it wrong in either direction costs real money.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/search?city={}&checkIn={}&checkOut={}&guests={}",
        desc: "Availability search — served from a cache, explicitly approximate",
      },
      {
        method: "POST",
        path: "/v1/holds",
        desc: "Reserve inventory for ~10 minutes while the guest completes checkout",
      },
      {
        method: "POST",
        path: "/v1/reservations",
        desc: "Confirm — idempotent on a client key; converts the hold into a booking",
      },
      {
        method: "DELETE",
        path: "/v1/reservations/{id}",
        desc: "Cancel and return inventory, subject to the rate's cancellation policy",
      },
      {
        method: "GET",
        path: "/v1/hotels/{id}/availability?from={}&to={}",
        desc: "Authoritative per-night availability — the slow, correct read",
      },
    ],
    dataModel: [
      {
        entity: "room_inventory",
        fields: [
          "hotel_id, room_type_id, date (pk)",
          "total_rooms",
          "booked_count",
          "overbook_limit",
          "version (optimistic concurrency)",
          "→ the contended row; one per night",
        ],
      },
      {
        entity: "reservations",
        fields: [
          "reservation_id (pk)",
          "hotel_id, room_type_id",
          "check_in, check_out (idx)",
          "guest_id, status (held|confirmed|cancelled|no_show)",
          "idempotency_key (unique)",
          "total_cents",
        ],
      },
      {
        entity: "holds",
        fields: [
          "hold_id (pk)",
          "hotel_id, room_type_id, dates[]",
          "expires_at (idx)",
          "→ short-lived; expiry returns inventory automatically",
        ],
      },
      {
        entity: "rates",
        fields: [
          "hotel_id, room_type_id, date (pk)",
          "price_cents, cancellation_policy",
          "→ separate from inventory; prices change far more often than counts",
        ],
      },
    ],
    architecture: [
      {
        heading: "The room-night is the unit",
        lede: "Getting this wrong makes every later decision wrong.",
        diagram: {
          kind: "er",
          caption: "A stay spans several inventory rows, and all of them must succeed together.",
          entities: [
            {
              name: "room_inventory",
              note: "one row per night — the contended resource",
              fields: [
                { name: "hotel_id", type: "uuid", key: "pk" },
                { name: "room_type_id", type: "uuid", key: "pk" },
                { name: "date", type: "date", key: "pk" },
                { name: "booked_count", type: "int", note: "vs total + overbook" },
                { name: "version", type: "int", note: "optimistic lock" },
              ],
            },
            {
              name: "reservations",
              note: "spans a date range",
              fields: [
                { name: "reservation_id", type: "uuid", key: "pk" },
                { name: "check_in", type: "date", key: "idx" },
                { name: "check_out", type: "date", key: "idx" },
                { name: "idempotency_key", type: "text", key: "idx" },
              ],
            },
            {
              name: "holds",
              note: "expiring claim on the same rows",
              fields: [
                { name: "hold_id", type: "uuid", key: "pk" },
                { name: "expires_at", type: "timestamp", key: "idx" },
              ],
            },
          ],
          relations: [
            {
              from: "reservations",
              to: "room_inventory",
              label: "consumes one row per night",
              cardinality: "1:N",
            },
            {
              from: "holds",
              to: "room_inventory",
              label: "temporarily claims",
              cardinality: "1:N",
            },
          ],
        },
        bullets: [
          "A three-night stay is three rows, and the booking either claims all three or none. There is no partial success — a guest with a room for two of their three nights is worse than a rejection.",
          "Storing availability as a date range rather than per-night rows seems tidier and makes the arithmetic far harder: overlapping ranges require interval logic on every check, whereas per-night rows make it a simple predicate.",
          "Counting by room type rather than by specific room means the contended value is an integer, so concurrency control operates on a count rather than on an assignment problem.",
          "Keep rates in a separate table from inventory. Prices change constantly — dynamic pricing, promotions — and coupling them would make every price update touch the contended inventory row.",
        ],
      },
      {
        heading: "Never check-then-act",
        lede: "The single most important line of code in this design.",
        code: {
          title: "The race, and the conditional update that closes it",
          lang: "ts",
          source: `// WRONG — a classic time-of-check-to-time-of-use bug. Two requests both read
// booked_count = 99 against a limit of 100, both conclude there is space,
// and both write 100. One room, two guests.
const row = await db.inventory.find({ hotelId, roomTypeId, date });
if (row.bookedCount < row.totalRooms + row.overbookLimit) {
  await db.inventory.update({ bookedCount: row.bookedCount + 1 });   // race
}

// RIGHT — the check and the write are one atomic statement, and the database
// decides. Zero rows updated means it was full; there is no window between
// deciding and acting.
async function claimNights(hotelId: string, typeId: string, dates: Date[]) {
  return db.transaction(async (tx) => {
    for (const date of dates) {
      const updated = await tx.raw(
        \`UPDATE room_inventory
            SET booked_count = booked_count + 1
          WHERE hotel_id = $1 AND room_type_id = $2 AND date = $3
            AND booked_count < total_rooms + overbook_limit\`,
        [hotelId, typeId, date],
      );
      // Any night unavailable aborts the whole stay — the transaction rolls
      // back the nights already claimed, so there is no partial booking.
      if (updated.rowCount === 0) throw new NoAvailability(date);
    }
  });
}

// Lock the nights in a consistent order (ascending date) across all callers.
// Two transactions claiming overlapping stays in opposite orders deadlock.`,
        },
        bullets: [
          "The conditional update is the whole concurrency story. It needs no distributed lock, no external coordination, and no retry logic beyond handling a failed transaction — the database enforces the invariant atomically.",
          "Ordering the per-night updates consistently is what prevents deadlock. Two overlapping stays claimed in opposite date order will deadlock under any row-locking database.",
          "Booking volume is around ten per second, so a genuine transaction is entirely affordable. The instinct to avoid transactions at scale does not apply here, and saying so is better than inventing a lock-free scheme.",
          "Optimistic concurrency with a version column is the alternative when the update must be expressed as a read-modify-write, and it fails loudly rather than silently overbooking.",
        ],
        callout: {
          kind: "interview",
          title: "The sentence that matters",
          text: '"I would never read the count, decide, and then write. The availability check and the decrement have to be one atomic conditional update — zero rows affected means it was full. That removes the race without any locking scheme, and because booking volume is low, a plain database transaction across the nights of the stay is entirely affordable."',
        },
      },
    ],
    deepDives: [
      {
        heading: "Holds, and the payment-timeout problem",
        body: [
          "A guest needs a few minutes to enter payment details, and the room must not be sold underneath them. A hold is inventory claimed with an expiry — which introduces the question of what happens when payment neither succeeds nor fails.",
        ],
        diagram: {
          kind: "sequence",
          caption: "The ambiguous case is the one worth designing for.",
          actors: [
            { id: "g", label: "Guest" },
            { id: "api", label: "Booking service" },
            { id: "inv", label: "Inventory" },
            { id: "pay", label: "Payment provider" },
          ],
          messages: [
            { from: "g", to: "api", label: "1. select room, begin checkout", kind: "call" },
            {
              from: "api",
              to: "inv",
              label: "2. claim nights, hold expires in 10 min",
              kind: "call",
              tone: "accent",
            },
            { from: "api", to: "g", label: "3. hold id, proceed to payment", kind: "return" },
            { from: "g", to: "api", label: "4. submit payment", kind: "call" },
            {
              from: "api",
              to: "pay",
              label: "5. charge (idempotency key = reservation id)",
              kind: "call",
            },
            {
              from: "pay",
              to: "api",
              label: "6. …timeout, outcome unknown",
              kind: "return",
              tone: "warn",
            },
            {
              from: "api",
              to: "inv",
              label: "7. DO NOT release — extend the hold",
              kind: "call",
              tone: "bad",
            },
            {
              from: "api",
              to: "pay",
              label: "8. query by idempotency key until resolved",
              kind: "call",
            },
            { from: "pay", to: "api", label: "9. succeeded → confirm", kind: "return", tone: "ok" },
          ],
        },
        bullets: [
          "A payment timeout is not a failure. Releasing the room on an unknown outcome risks selling it twice and then charging a guest for a room they do not have, which is far worse than briefly holding inventory that turns out to be free.",
          "Expiry must be enforced by the system, not by the client. A browser that is closed mid-checkout never sends a cancellation, so a background sweeper reclaims expired holds — and the availability check must treat an expired-but-not-yet-swept hold as free.",
          "The idempotency key should be derived from the reservation, not generated per attempt, so a retry after a timeout returns the original charge rather than creating a second one.",
          "Hold duration is a product trade: too short and legitimate guests lose their room mid-checkout, too long and inventory sits unsellable during a peak.",
        ],
      },
      {
        heading: "Search is a different system from booking",
        lede: "One is approximate and fast; the other is exact and slow. Do not merge them.",
        table: {
          caption: "The two paths share a domain and almost nothing else.",
          headers: ["Aspect", "Search", "Booking"],
          rows: [
            ["Volume", "~600 QPS peak", "~10/s"],
            ["Freshness", "Seconds stale is fine", "Must be authoritative"],
            ["Store", "Denormalised index / cache", "Transactional database"],
            ["Failure mode", "Shows a room that just sold", "Must never oversell"],
            ["Optimised for", "Latency and filtering", "Correctness"],
          ],
        },
        bullets: [
          "Search reads a denormalised index keyed by city, date range and filters, refreshed continuously from inventory changes. Querying the transactional store for every search would put read pressure on exactly the rows that booking needs to write.",
          "Accept that search can show something that is no longer available. The correct handling is a clear message at booking time, not an attempt to make search perfectly consistent — which would cost far more than the occasional disappointment.",
          "Cache aggressively at the city and date-range level, because searches cluster heavily around popular destinations and dates.",
          "Popular hotels on popular dates are hot rows for writes as well as reads, which is one more reason to keep search traffic away from them entirely.",
        ],
      },
      {
        heading: "Overbooking as a deliberate policy",
        body: [
          "Selling more rooms than exist sounds like the bug this system is meant to prevent, and it is in fact standard practice — cancellations and no-shows are statistically predictable, and an empty room earns nothing. The engineering requirement is that the limit is explicit, configurable and enforced.",
        ],
        bullets: [
          "The limit belongs in the inventory row, so the same conditional update enforces both the physical capacity and the commercial policy without special-casing.",
          "It should be per hotel, per date and ideally per segment. A conference weekend has almost no no-shows; a Tuesday in low season has many.",
          "When the gamble loses, the system needs a walk procedure: identify who to relocate, book them elsewhere, and compensate. Designing the happy path only is how this becomes an operational crisis instead of a known cost.",
          "Track the outcome and feed it back. Overbooking limits set by intuition rather than by measured no-show rates are how hotels either leave money on the table or generate a queue of angry guests at midnight.",
        ],
        callout: {
          kind: "insight",
          text: "Overbooking is a useful reminder that the database invariant and the business invariant are not the same thing. The system's job is not to prevent selling more rooms than exist — it is to enforce exactly the limit the business chose, never exceed it by accident, and make the consequences of that choice operable.",
        },
      },
      {
        heading: "Multi-channel inventory",
        body: [
          "The same room is sold on the hotel's own site, several travel agencies and possibly a global distribution system, all writing to the same counts. That makes external synchronisation, not internal concurrency, the harder half of the real problem.",
        ],
        bullets: [
          "One system must own the count. Channels that cache availability locally and reconcile later will oversell, and the reconciliation is always messier than the coordination would have been.",
          "Where a channel insists on holding allocation, give it a fixed allotment it owns exclusively and return the unsold remainder on a schedule. That converts a contention problem into a partitioning problem.",
          "Every channel needs idempotent booking, because network failures between two companies are more common than within one system and a retried booking must not become two rooms.",
          "Push availability changes rather than making channels poll, or the window in which a channel is selling a room that no longer exists is as long as its polling interval.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Per-night inventory rows",
        pickWhen: "Always",
        cost: "A stay touches several rows and needs a multi-row transaction",
      },
      {
        choice: "Conditional atomic update",
        pickWhen: "Always — this is the correct primitive",
        cost: "Requires consistent lock ordering to avoid deadlock",
      },
      {
        choice: "Holds with expiry",
        pickWhen: "Checkout takes more than a moment",
        cost: "Inventory temporarily unsellable; a sweeper to operate",
      },
      {
        choice: "Separate search index",
        pickWhen: "Read volume far exceeds writes — always here",
        cost: "Search can show inventory that has just sold",
      },
      {
        choice: "Overbooking",
        pickWhen: "No-show rates are measurable and the walk procedure exists",
        cost: "Occasionally a guest must be relocated, at real cost",
      },
      {
        choice: "Central inventory ownership across channels",
        pickWhen: "Multi-channel distribution",
        cost: "Channels depend on your availability; allotments are the fallback",
      },
    ],
    wrapUp: [
      "The unit of inventory is the room-night, not the room, so a stay is a multi-row atomic claim that must fully succeed or fully fail.",
      "Never check-then-act. One conditional update that increments only while under the limit removes the race entirely, and at ten bookings a second a real transaction is affordable.",
      "Order the per-night updates consistently, or two overlapping stays claimed in opposite directions will deadlock.",
      "Holds make checkout safe, and the case that matters is a payment timeout — an unknown outcome must extend the hold rather than release it, because selling the room twice is the worse error.",
      "Search and booking are different systems: approximate and fast against exact and slow. Keep search traffic off the rows booking needs to write.",
      "Overbooking is deliberate policy, not a defect, and the system's job is to enforce the chosen limit exactly and make the walk procedure operable.",
    ],
    followUps: [
      {
        q: "Two guests book the last room at the same instant. What happens?",
        a: "Exactly one succeeds, provided the availability check and the decrement are a single atomic statement. If the code reads the count, decides there is space, and then writes, both requests can read the same value and both conclude they may proceed — the classic time-of-check-to-time-of-use race, and it is how rooms get sold twice. Instead the update increments the booked count with a condition that it remains below the limit, and the database returns how many rows it changed: one means success, zero means it was full. The loser gets a clear out-of-availability response. No distributed lock is involved, and because the booking rate is around ten per second, an ordinary transaction is entirely affordable.",
      },
      {
        q: "A guest books three nights but only two are available. What do you do?",
        a: "Fail the whole booking. A reservation that covers part of a stay is worse than no reservation, because the guest believes they have somewhere to sleep and discovers otherwise partway through. Concretely, the claim for each night runs inside one transaction and any night that returns zero updated rows aborts it, rolling back the nights already claimed so no inventory is stranded. The subtlety worth mentioning is lock ordering: all callers must claim nights in the same order, ascending by date, because two overlapping stays claimed in opposite directions will deadlock under row locking. The product can then offer alternatives — a different room type, or shifted dates — but that is a separate search, not a partial success.",
      },
      {
        q: "The payment provider times out. Do you release the room?",
        a: "No, and this is the case worth designing for explicitly. A timeout means the outcome is unknown, not that it failed — the charge may well have succeeded with only the response lost. Releasing the room then risks selling it to someone else while the first guest has been charged, which is much worse than briefly holding inventory that turns out to be free. So the hold is extended and the provider is queried by the idempotency key until the outcome resolves, at which point the reservation is either confirmed or the hold released. The key must be derived from the reservation rather than generated per attempt, or a retry looks like a new payment. A decline, by contrast, is unambiguous and releases the hold immediately.",
      },
      {
        q: "Why not just query the inventory table for search?",
        a: "Because search is roughly sixty times the volume of booking and is aimed at exactly the rows booking needs to write — popular hotels on popular dates — so every search would contend with the writes that actually matter. Search also wants different things: filtering by amenities and price, ranking, and fast responses across a whole city, none of which the normalised inventory table is shaped for. So availability is denormalised into a search index refreshed continuously from inventory changes, and the consequence is accepted openly: search may occasionally show a room that has just sold, and the booking step reports it cleanly. Trying to make search perfectly consistent would cost far more than the occasional disappointment, and would put read load on the contended rows.",
      },
      {
        q: "Isn't overbooking exactly the bug you just spent the design preventing?",
        a: "No, and the distinction is worth being precise about. The bug is selling more rooms than the business intended, by accident, because of a race. Overbooking is selling a deliberately chosen number above physical capacity, because no-shows and cancellations are statistically predictable and an empty room earns nothing. So the limit lives in the inventory row alongside the physical capacity and the same conditional update enforces it — the system never exceeds the chosen figure, it just happens that the chosen figure is above capacity. What the design does owe is the losing case: a walk procedure that relocates and compensates the guest, and measurement of actual no-show rates per hotel and season so the limit is data-driven rather than guessed.",
      },
    ],
    related: [
      "/examples/ticket-booking",
      "/examples/payment",
      "/lld/concurrency",
      "/hld/consistency",
      "/hld/idempotency",
    ],
    furtherReading: [
      {
        label: "algomaster — design a hotel reservation system",
        href: "https://algomaster.io/learn/system-design-interviews/design-a-hotel-reservation-system",
      },
    ],
  },

  {
    slug: "ticket-booking",
    title: "Design a Ticket Booking System",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 22,
    tags: ["inventory", "holds", "flash sale", "queueing", "seat map"],
    companies: ["Ticketmaster", "BookMyShow", "IRCTC", "Dice"],
    summary:
      "The hotel problem with the difficulty turned up: seats are individually identifiable rather than interchangeable, and demand arrives as a wall. A hundred thousand people hitting the same event the instant tickets go on sale is not a traffic spike to be absorbed — it is contention on a few thousand rows, and no amount of horizontal scaling helps. The answer is admission control: shape the demand before it reaches anything transactional.",
    clarifying: [
      {
        q: "Are seats individually chosen, or is it general admission?",
        a: "Individually chosen, which is materially harder. General admission is a counter and behaves like the hotel problem; assigned seating means every seat is a distinct contended row and the UI shows other people's holds in real time.",
      },
      {
        q: "What does the on-sale spike look like?",
        a: "Six figures of concurrent users at a known instant for a popular event. Because the time is published in advance, this is a predictable, scheduled load event — which is what makes a waiting room viable rather than a hack.",
      },
      {
        q: "How long does a buyer get to complete payment?",
        a: "Five to ten minutes. That hold duration directly determines how much inventory is locked up during the peak, so it is a real capacity parameter rather than a UX detail.",
      },
      {
        q: "Can people buy adjacent seats together?",
        a: "Yes, and it is a genuine constraint — a group wants to sit together, so the system must find and atomically claim contiguous blocks, and ideally avoid fragmenting the map into unsellable single seats.",
      },
      {
        q: "How do we handle bots?",
        a: "As a first-class requirement. Scalpers are the dominant traffic source at an on-sale, and a design that ignores them produces a system that works perfectly while serving almost no real customers.",
      },
    ],
    requirements: {
      functional: [
        "Show a seat map with live availability",
        "Hold specific seats while the buyer completes payment",
        "Atomically claim contiguous blocks for groups",
        "Release holds automatically on expiry and return seats to the map",
      ],
      nonFunctional: [
        "A seat is never sold twice — no overbooking, unlike hotels",
        "Survive a hundred thousand concurrent users at a scheduled instant",
        "Fair and transparent access during high demand",
        "Seat map reads must not contend with booking writes",
      ],
    },
    math: [
      {
        label: "On-sale concurrency",
        expr: "100 K users hitting a 20 K-seat event",
        result: "5:1 demand over supply",
        note: "For a genuinely hot event it can be 50:1. Most requests must be rejected — the design question is how to reject them gracefully.",
      },
      {
        label: "Contended rows",
        expr: "20,000 seats",
        result: "20 K rows, all hot",
        note: "Tiny data, enormous contention. This is why adding application servers does not help.",
      },
      {
        label: "Hold inventory impact",
        expr: "10 K concurrent holds × 8 min",
        result: "40% of the venue locked at peak",
        note: "Hold duration is a capacity decision: double it and you halve effective throughput during the rush.",
      },
      {
        label: "Seat map reads",
        expr: "100 K users polling every 2 s",
        result: "≈ 50 K reads/s",
        note: "Must be served from cache or push; hitting the transactional store would starve the writes.",
      },
      {
        label: "Actual transaction rate",
        expr: "20 K seats sold over ~10 min",
        result: "≈ 35 purchases/s",
        note: "Trivial in isolation. All the difficulty is in the funnel above it, not in the writes themselves.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/events/{id}/queue",
        desc: "Join the waiting room; returns a position and a signed admission token",
      },
      {
        method: "GET",
        path: "/v1/events/{id}/seatmap",
        desc: "Seat availability — cached, and explicitly approximate during an on-sale",
      },
      {
        method: "POST",
        path: "/v1/events/{id}/holds",
        desc: "Claim specific seats or a contiguous block; requires a valid admission token",
      },
      {
        method: "POST",
        path: "/v1/orders",
        desc: "Convert a hold into a purchase — idempotent on a client key",
      },
      {
        method: "DELETE",
        path: "/v1/holds/{id}",
        desc: "Explicit release; expiry is the backstop when the browser simply closes",
      },
    ],
    dataModel: [
      {
        entity: "seats",
        fields: [
          "event_id, seat_id (pk)",
          "section, row, number",
          "price_tier",
          "status (available|held|sold)",
          "hold_id (nullable), hold_expires_at (idx)",
          "version (optimistic lock)",
        ],
      },
      {
        entity: "holds",
        fields: [
          "hold_id (pk)",
          "event_id, user_id",
          "seat_ids[]",
          "expires_at (idx)",
          "→ swept continuously; expiry returns seats to the map",
        ],
      },
      {
        entity: "orders",
        fields: [
          "order_id (pk)",
          "hold_id, user_id",
          "seat_ids[], total_cents",
          "idempotency_key (unique)",
          "status (pending|paid|failed)",
        ],
      },
      {
        entity: "queue_tokens",
        fields: [
          "token (pk, signed)",
          "event_id, position, admitted_at",
          "expires_at",
          "→ admission control; validated before any write path",
        ],
      },
    ],
    architecture: [
      {
        heading: "Admission control before anything transactional",
        lede: "You cannot scale your way through contention on twenty thousand rows.",
        diagram: {
          kind: "flow",
          caption: "Shape demand at the edge; let a manageable trickle reach the database.",
          rows: [
            [
              { id: "u", label: "100 K users", sub: "at the on-sale instant", tone: "warn" },
              { id: "wr", label: "Waiting room", sub: "position + signed token", tone: "accent" },
            ],
            [
              { id: "adm", label: "Admit ~2 K at a time", sub: "as capacity frees" },
              { id: "map", label: "Seat map", sub: "cached, pushed updates" },
              { id: "hold", label: "Hold", sub: "atomic claim" },
              { id: "pay", label: "Pay", sub: "~35/s", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "The waiting room is the architecture, not a UX nicety. It converts an uncontrollable arrival spike into a controlled admission rate that the transactional core can actually serve.",
          "Admission is a signed token checked before any write path, so the booking service can reject unadmitted traffic cheaply without touching the database.",
          "Giving people a position and an estimated wait is worth real engineering effort: a transparent queue keeps users waiting calmly, while an unexplained spinner produces frantic refreshing that multiplies the load.",
          "Everything non-transactional — event details, the venue map, pricing tiers — is static and belongs on a CDN, so the only traffic reaching the origin is the part that genuinely needs it.",
        ],
        callout: {
          kind: "interview",
          title: "The reframing that scores",
          text: '"A hundred thousand users against twenty thousand seats is not a throughput problem — the actual write rate is about thirty-five per second, which is nothing. It is a contention problem on a few thousand rows, and horizontal scaling makes contention worse rather than better. So the design is admission control: a waiting room that shapes demand into a rate the transactional core can serve, and everything else cached or pushed."',
        },
      },
      {
        heading: "Claiming seats atomically",
        lede: "Individual seats and contiguous blocks, without deadlock.",
        code: {
          title: "Conditional claim, ordered, all-or-nothing",
          lang: "ts",
          source: `async function holdSeats(eventId: string, seatIds: string[], userId: string) {
  // Sort so every caller locks in the same order. Two groups claiming
  // overlapping blocks in opposite directions would otherwise deadlock —
  // and at an on-sale that happens within seconds.
  const ordered = [...seatIds].sort();
  const holdId = newId();
  const expiresAt = Date.now() + 8 * 60_000;

  return db.transaction(async (tx) => {
    for (const seatId of ordered) {
      // Claim only if genuinely free: available, OR held by an expired hold
      // that the sweeper has not yet reclaimed. Without the second clause,
      // seats sit unsellable in the gap between expiry and cleanup.
      const updated = await tx.raw(
        \`UPDATE seats
            SET status = 'held', hold_id = $1, hold_expires_at = $2
          WHERE event_id = $3 AND seat_id = $4
            AND (status = 'available'
                 OR (status = 'held' AND hold_expires_at < now()))\`,
        [holdId, new Date(expiresAt), eventId, seatId],
      );
      if (updated.rowCount === 0) throw new SeatUnavailable(seatId);
    }
    await tx.holds.insert({ holdId, eventId, userId, seatIds: ordered, expiresAt });
    return { holdId, expiresAt };
  });
}`,
        },
        bullets: [
          "Treating an expired hold as claimable inside the same conditional update is what stops seats being stranded between expiry and the sweeper's next pass — during a peak that gap is the difference between selling out and not.",
          "A group booking is all-or-nothing across its seats, and the transaction gives that naturally. Partially claiming a block and then failing would fragment the map for no benefit.",
          "Consistent ordering of the seat claims is mandatory. This is the same deadlock hazard as multi-night hotel bookings, and it materialises far faster here because contention is extreme.",
          "Finding a contiguous block is a read-side search over the cached map, and the claim then verifies it atomically — optimistic, because by the time the user chooses, someone else may have taken one of the seats.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "The seat map under load",
        body: [
          "A hundred thousand people watching the same map is a read problem that must be kept entirely away from the rows being written. It is also the one place where showing stale data is unavoidable, so the design should make that explicit rather than pretending otherwise.",
        ],
        table: {
          caption: "Ways to distribute the map, and what each costs.",
          headers: ["Approach", "Load", "Freshness", "Verdict"],
          rows: [
            [
              "Poll the database",
              "50 K reads/s on hot rows",
              "Exact",
              "Starves the writes — never",
            ],
            ["Poll a cache", "50 K reads/s on cache", "1–2 s stale", "Workable and simple"],
            [
              "Push over WebSocket",
              "100 K connections, small deltas",
              "Sub-second",
              "Best experience, more infrastructure",
            ],
            [
              "Coarse availability only",
              "Tiny",
              "Section-level",
              "Good fallback under extreme load",
            ],
          ],
        },
        bullets: [
          "Publish deltas rather than the whole map. A twenty-thousand-seat map is large, and re-sending it every two seconds to a hundred thousand clients is bandwidth spent to communicate almost nothing.",
          "Tell the user the map is approximate. A seat that appears free and then fails to claim is inevitable at this contention level, and framing it honestly is better than implying a guarantee the system cannot make.",
          'Under extreme load, degrade to section-level availability — "lower tier: limited" — which is cheap to compute and still lets people choose sensibly.',
          "Never let the map read path touch the same store as the claim path, or the reads will slow exactly the writes everyone is queuing for.",
        ],
      },
      {
        heading: "Holds, expiry and fragmentation",
        body: [
          "Holds are the mechanism that makes checkout safe and simultaneously the main consumer of inventory during a rush. Both the duration and the cleanup path have direct commercial consequences.",
        ],
        bullets: [
          "Sweep expired holds continuously rather than on a slow schedule, and make the claim path treat expired holds as free so seats never wait for the sweeper.",
          "Hold duration is a capacity parameter: ten thousand concurrent eight-minute holds lock a large fraction of a venue, so shortening it increases effective throughput at the cost of rushing genuine buyers.",
          "Seat-map fragmentation is a real concern for revenue: claims that leave isolated single seats make those seats nearly unsellable, so allocation should prefer blocks that keep the remaining map contiguous.",
          "Releasing a hold explicitly when the user abandons is worth doing even though expiry is the backstop, because during a rush returning a seat eight minutes early genuinely matters.",
        ],
        callout: {
          kind: "warn",
          title: "Payment timeouts, again",
          text: "As with hotels, a payment timeout must not release the seats. The outcome is unknown, and selling a seat that has already been charged for is the worst possible failure at an event where the buyer will physically turn up expecting to sit there. Extend the hold, resolve the payment by idempotency key, and only then confirm or release.",
        },
      },
      {
        heading: "Bots, fairness and the queue",
        body: [
          "At a high-demand on-sale the majority of traffic is automated. This is not a security afterthought — if bots consume the admission slots, the entire carefully-designed funnel delivers tickets to resellers and the system has failed at its actual purpose.",
        ],
        bullets: [
          "Require authenticated accounts with some history before an on-sale, which raises the cost of operating at scale far more effectively than rate limiting by address.",
          "Rate limit by account and payment instrument rather than by IP. Residential proxy pools make address-based limits nearly useless while penalising legitimate users behind shared networks.",
          "Enforce per-account purchase limits at claim time, not at checkout, or bots hold large quantities of inventory and release it only when blocked at the end.",
          "Randomised admission from the waiting room is fairer than strict first-come ordering, because strict ordering rewards whoever has the fastest connection and the most automation — which is precisely the population you are trying to dilute.",
        ],
      },
      {
        heading: "What happens when it still breaks",
        body: [
          "On-sales fail publicly and often, so the design should include what happens when demand exceeds even the shaped capacity — degradation that is deliberate rather than emergent.",
        ],
        bullets: [
          'Shed load at the edge, before the queue. Returning a clear "we are at capacity, try again shortly" is far better than accepting the request and timing out deep in the stack.',
          "Keep the waiting room on separate infrastructure from booking, so the queue keeps working and communicating even if the transactional tier is struggling.",
          "Make the funnel observable in business terms — queue depth, admission rate, hold conversion, seats remaining — because during an incident the question is always whether people are actually getting tickets, not what the CPU is doing.",
          "Have a documented answer for overselling caused by a bug. Unlike hotels there is no walk procedure, so the recovery is refunds and reallocation, and it needs to be planned rather than improvised at midnight.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Waiting room with admission tokens",
        pickWhen: "Scheduled, extreme-demand on-sales",
        cost: "Extra infrastructure, and users wait visibly",
      },
      {
        choice: "Randomised admission",
        pickWhen: "Fairness matters more than strict arrival order",
        cost: "Feels arbitrary to users who queued early",
      },
      {
        choice: "Push seat-map deltas",
        pickWhen: "Live seat selection at scale",
        cost: "A connection tier holding a hundred thousand sockets",
      },
      {
        choice: "Short hold duration",
        pickWhen: "Demand vastly exceeds supply",
        cost: "Genuine buyers are rushed and some lose their seats",
      },
      {
        choice: "Treat expired holds as claimable inline",
        pickWhen: "Always",
        cost: "Slightly more complex claim predicate",
      },
      {
        choice: "Strict per-account limits at claim time",
        pickWhen: "Bot pressure is significant — always for hot events",
        cost: "Legitimate group purchases need an explicit path",
      },
    ],
    wrapUp: [
      "The actual transaction rate is about thirty-five per second; the problem is contention on a few thousand rows, which horizontal scaling makes worse rather than better.",
      "Admission control is the architecture. A waiting room converts an uncontrollable arrival spike into a serviceable admission rate, and a signed token lets the write path reject everything else cheaply.",
      "Seat claims are conditional, ordered and all-or-nothing, and the claim predicate treats expired holds as free so seats are never stranded waiting for a sweeper.",
      "The seat map is served from cache or pushed as deltas, never from the rows being written, and it is openly approximate during a rush.",
      "Hold duration is a capacity parameter with direct commercial impact, and a payment timeout must extend the hold rather than release the seats.",
      "Bots are a first-class design constraint: limit by account and payment instrument, enforce limits at claim time, and prefer randomised admission over rewarding the fastest automation.",
    ],
    followUps: [
      {
        q: "A hundred thousand people hit the on-sale at once. Do you just add servers?",
        a: "No, and that is the central point. The write rate is tiny — twenty thousand seats over ten minutes is around thirty-five purchases a second — so throughput was never the constraint. The constraint is contention on a few thousand seat rows, and adding application servers increases the number of clients fighting over those rows, which makes the contention worse rather than better. The fix is upstream: a waiting room that admits a controlled number of users at a time, a signed admission token that lets the booking service reject everyone else without touching the database, and everything non-transactional served from a CDN. Shape the demand, then let a manageable trickle reach the part that must be exactly right.",
      },
      {
        q: "Someone's hold expires but the sweeper has not run yet. Can another user take the seat?",
        a: "Yes, and it is important that they can. If the claim predicate only accepts seats marked available, then every expired-but-unswept hold is a seat nobody can buy until a background job notices — and during the few minutes that matter most, that could be a meaningful fraction of the venue sitting unsellable. So the conditional update accepts a seat that is either available or held with an expiry in the past, which makes the claim itself the cleanup. The sweeper still runs, because holds need tidying for reporting and to release the hold records, but correctness no longer depends on how promptly it happens.",
      },
      {
        q: "How do you sell four seats together without deadlocking?",
        a: "By claiming them inside one transaction, in a globally consistent order. The all-or-nothing part is straightforward — any seat that fails to claim aborts the transaction and rolls back the ones already taken, because a group with three of four seats is not a sale anyone wants. The deadlock hazard is the subtle half: if one request claims seats A then B while another claims B then A, they block each other, and at an on-sale that collision happens within seconds. Sorting the seat identifiers before claiming means every caller acquires locks in the same order, which makes deadlock structurally impossible. Finding the block in the first place is a read against the cached map, and the claim verifies it optimistically, since the map is stale by the time the user has chosen.",
      },
      {
        q: "How is this different from the hotel problem?",
        a: "Two ways, both of which make it harder. First, the inventory is individually identifiable rather than interchangeable: hotels sell a count of a room type and assign the physical room at check-in, whereas a specific seat is what the buyer is choosing, so every seat is its own contended row and the live map has to show other people's holds. Second, and more importantly, demand arrives as a scheduled wall rather than spread over time, so the system faces its entire load at a published instant — which is what makes admission control worthwhile and also what makes it feasible, since you know when it is coming. There is also no overbooking here: a hotel can walk a guest to another property, but there is no equivalent for a seat at a concert, so the no-double-sell invariant is absolute.",
      },
      {
        q: "Most of your traffic is bots. Does that change the design?",
        a: "It changes it substantially, because otherwise the funnel works flawlessly and delivers the tickets to resellers. Rate limiting by IP address is close to useless given residential proxy pools and it punishes legitimate users behind shared networks, so limits should attach to accounts and payment instruments instead, with a requirement that accounts exist and have some history before the on-sale — that raises the cost of operating at scale far more than any per-request check. Purchase limits have to be enforced when seats are claimed rather than at checkout, or bots tie up inventory and only discover the limit at the end. And randomised admission from the waiting room is fairer than strict arrival order, because strict ordering simply rewards whoever automated best.",
      },
    ],
    related: [
      "/examples/hotel-reservation",
      "/examples/payment",
      "/hld/idempotency",
      "/hld/rate-limiting",
      "/lld/concurrency",
    ],
    furtherReading: [
      {
        label: "algomaster — design a ticket booking system",
        href: "https://algomaster.io/learn/system-design-interviews/design-a-ticket-booking-system",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "food-delivery",
    title: "Design a Food Delivery App",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 22,
    tags: ["marketplace", "dispatch", "logistics", "state machine", "eta"],
    companies: ["DoorDash", "Uber Eats", "Swiggy", "Deliveroo"],
    summary:
      "A three-sided marketplace where the hardest problem is timing rather than scale. The courier must arrive when the food is ready — too early and they wait, too late and the food is cold — and neither the kitchen's prep time nor the courier's travel time is known in advance. Everything interesting flows from that: dispatch is a prediction problem, batching multiple orders is where the economics live, and the order state machine has to survive three independent parties dropping offline.",
    clarifying: [
      {
        q: "Do we employ the couriers or are they independent?",
        a: "Independent, which means they can decline offers and go offline at will. That rules out assignment by command and makes dispatch an offer-and-acceptance problem with the same exclusivity requirements as ride-hailing.",
      },
      {
        q: "Is the courier assigned when the order is placed, or when the food is nearly ready?",
        a: "The interesting question. Assigning immediately guarantees a courier but wastes their time waiting at the restaurant; assigning late risks nobody being available. The answer is to assign based on predicted readiness, which is why prep-time estimation is a core component rather than a detail.",
      },
      {
        q: "Can one courier carry several orders?",
        a: "Yes — batching is where delivery economics work, and it substantially changes dispatch from an assignment problem into a small routing problem with time windows.",
      },
      {
        q: "How accurate must the delivery estimate be?",
        a: "Accurate enough to be trusted, which means slightly pessimistic. A promise of twenty minutes that takes thirty-five is a much worse experience than a promise of thirty-five that arrives in thirty.",
      },
      {
        q: "What is the scale?",
        a: "Regional and partitionable — orders never cross cities. So like ride-hailing, this is many independent city-sized systems rather than one global one, and the transactional volume per city is modest.",
      },
    ],
    requirements: {
      functional: [
        "Browse menus, place an order, and pay",
        "Route the order to the restaurant and track preparation",
        "Dispatch a courier timed to food readiness, including batched deliveries",
        "Live tracking and delivery estimates for the customer",
      ],
      nonFunctional: [
        "An accepted order must never be lost, even if every party disconnects",
        "Dispatch decisions within seconds",
        "Estimates that are trustworthy rather than optimistic",
        "A restaurant or courier going offline must degrade the order, not drop it",
      ],
    },
    math: [
      {
        label: "Order volume",
        expr: "2 M orders/day ÷ 10⁵",
        result: "≈ 25/s, peak ~200/s",
        note: "Transactionally small. Peaks are extremely concentrated around meal times, which is the real capacity driver.",
      },
      {
        label: "Peak concentration",
        expr: "~40% of daily orders in two dinner hours",
        result: "≈ 8× the daily average",
        note: "Capacity must be sized for a predictable two-hour window, not for the average.",
      },
      {
        label: "Courier location updates",
        expr: "50 K active couriers ÷ 5 s",
        result: "≈ 10 K writes/s",
        note: "Same shape as ride-hailing: in-memory with a TTL, never persisted on the hot path.",
      },
      {
        label: "Dispatch timing window",
        expr: "prep 18 min, courier travel 7 min",
        result: "offer at ~11 min after order",
        note: "The whole scheduling problem in one line — and both numbers are predictions with real variance.",
      },
      {
        label: "Batching gain",
        expr: "2 orders per trip on compatible routes",
        result: "≈ 40% lower cost per delivery",
        note: "Which is why batching exists despite adding several minutes to one customer's wait.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/orders",
        desc: "Place an order — idempotent on a client key; authorises payment",
      },
      {
        method: "POST",
        path: "/v1/orders/{id}/accept",
        desc: "Restaurant accepts and commits to a prep time",
      },
      {
        method: "POST",
        path: "/v1/orders/{id}/events",
        desc: "State transitions — preparing, ready, picked up, delivered; idempotent, client-buffered",
      },
      {
        method: "POST",
        path: "/v1/courier/offers/{id}/accept",
        desc: "Courier accepts an exclusive, time-boxed offer",
      },
      {
        method: "GET",
        path: "/v1/orders/{id}/track",
        desc: "Live courier position and current estimate",
      },
      {
        method: "GET",
        path: "/v1/restaurants?lat={}&lng={}",
        desc: "Discovery — the proximity-service problem, cached hard",
      },
    ],
    dataModel: [
      {
        entity: "orders",
        fields: [
          "order_id (pk)",
          "customer_id, restaurant_id, courier_id (idx)",
          "state (placed|accepted|preparing|ready|picked_up|delivered|cancelled)",
          "items (jsonb), total_cents",
          "promised_at, prep_estimate_min",
          "→ durable and transactional; the source of truth",
        ],
      },
      {
        entity: "order_events",
        fields: [
          "order_id (idx)",
          "event_id (pk, client-generated)",
          "type, occurred_at, actor",
          "→ append-only; buffered offline and replayed",
        ],
      },
      {
        entity: "courier_state",
        fields: [
          "courier_id (pk)",
          "lat, lng, cell_id (idx)",
          "status (offline|idle|assigned|carrying)",
          "current_orders[]",
          "TTL ≈ 30 s",
          "→ in memory",
        ],
      },
      {
        entity: "prep_time_stats",
        fields: [
          "restaurant_id, hour, item_class (pk)",
          "p50_minutes, p90_minutes",
          "→ feeds both dispatch timing and the customer estimate",
        ],
      },
    ],
    architecture: [
      {
        heading: "Three parties, one state machine",
        lede: "The order is the only durable truth; everyone else is a participant that may vanish.",
        diagram: {
          kind: "sequence",
          caption:
            "Dispatch is deliberately late — timed to predicted readiness, not to order placement.",
          actors: [
            { id: "c", label: "Customer" },
            { id: "o", label: "Order service" },
            { id: "r", label: "Restaurant" },
            { id: "d", label: "Dispatch" },
            { id: "k", label: "Courier" },
          ],
          messages: [
            { from: "c", to: "o", label: "1. place order, payment authorised", kind: "call" },
            { from: "o", to: "r", label: "2. new order", kind: "async" },
            { from: "r", to: "o", label: "3. accepted, prep ≈ 18 min", kind: "call", tone: "ok" },
            {
              from: "o",
              to: "d",
              label: "4. schedule dispatch for T+11",
              kind: "async",
              tone: "accent",
            },
            { from: "d", to: "k", label: "5. exclusive offer, 20 s to accept", kind: "call" },
            { from: "k", to: "d", label: "6. accept", kind: "return", tone: "ok" },
            { from: "k", to: "r", label: "7. arrive as food is ready", kind: "call" },
            { from: "k", to: "o", label: "8. picked up → delivered", kind: "call" },
            { from: "o", to: "c", label: "9. capture payment, receipt", kind: "async" },
          ],
        },
        bullets: [
          "The order record is transactional and durable; courier positions, offers and estimates are all ephemeral. Keeping that boundary sharp is what makes the system recoverable.",
          "Restaurants disconnect constantly — a tablet on hotel wifi in a kitchen — so unacknowledged orders need escalation through another channel rather than silently waiting.",
          "Payment is authorised at placement and captured at delivery, so a card problem surfaces before the kitchen starts cooking rather than after.",
          "Shard by city. Orders, restaurants and couriers are all local, so the system is many modest independent systems rather than one large one.",
        ],
      },
      {
        heading: "Timing is the real problem",
        lede: "Dispatch too early and the courier waits; too late and the food goes cold.",
        diagram: {
          kind: "compare",
          caption: "When to commit a courier is the central trade in this design.",
          options: [
            {
              title: "Assign at order time",
              sub: "courier committed immediately",
              good: ["Guaranteed courier", "Simple to reason about and to explain"],
              bad: [
                "Courier waits at the restaurant, unpaid and unproductive",
                "Removes them from the pool for other nearby orders",
                "Terrible courier economics, which eventually means no couriers",
              ],
              verdict: "Only when supply is plentiful and prep times are very short.",
            },
            {
              title: "Assign at predicted readiness",
              sub: "offer at ready-time minus travel-time",
              tone: "ok",
              good: [
                "Courier arrives as the food does — minimal waiting on both sides",
                "Couriers stay available longer, so effective supply rises",
              ],
              bad: [
                "Depends on a prep-time prediction that can be wrong",
                "If nobody accepts near readiness, the food sits and cools",
              ],
              verdict:
                "The right default, with a safety margin and escalation if no courier accepts.",
            },
            {
              title: "Batch several orders",
              sub: "one courier, compatible pickups and drops",
              good: ["Substantially better economics", "Fewer vehicles for the same volume"],
              bad: [
                "One customer's order is delayed for another's",
                "A small routing problem with time windows",
              ],
              verdict: "Essential commercially; needs a cap on added delay per customer.",
            },
          ],
        },
        bullets: [
          "Prep time is a prediction per restaurant, per hour and per item class, and it should use a high percentile rather than the median — arriving early costs a few minutes of waiting, while arriving late means cold food and a bad review.",
          "Restaurants are systematically optimistic about their own prep times, so a learned estimate from observed ready events is more reliable than the number the kitchen reports.",
          "Escalate if no courier accepts as readiness approaches: widen the search radius, raise the incentive, and tell the customer honestly rather than letting the promised time silently pass.",
          "Batching needs an explicit cap on how much delay any single customer absorbs, or the economics quietly come out of one customer's experience.",
        ],
        callout: {
          kind: "interview",
          title: "The line that shows depth",
          text: '"The hard part is not scale — it is about twenty-five orders a second. It is that dispatch must be timed to when the food will be ready, and neither prep time nor travel time is known. So prep-time prediction is a first-class component, the courier is offered late rather than at order placement, and there has to be an escalation path for when nobody accepts near readiness."',
        },
      },
    ],
    deepDives: [
      {
        heading: "Estimates the customer can trust",
        body: [
          "The delivery estimate is a chain of predictions — restaurant acceptance, prep time, courier assignment, travel to the restaurant, waiting, travel to the customer, and finding the door — and errors compound. Presenting the sum of optimistic guesses as a precise time is the most common way this product loses trust.",
        ],
        table: {
          caption: "Where the minutes actually go, and how predictable each stage is.",
          headers: ["Stage", "Typical", "Variance", "Notes"],
          rows: [
            [
              "Restaurant acceptance",
              "1–3 min",
              "High",
              "A distracted kitchen is the first silent delay",
            ],
            [
              "Preparation",
              "10–25 min",
              "Very high",
              "Varies by item, hour and how busy the kitchen is",
            ],
            ["Courier to restaurant", "5–10 min", "Medium", "Road ETA, same as ride-hailing"],
            ["Waiting at pickup", "0–10 min", "High", "The cost of mistimed dispatch"],
            ["Travel to customer", "5–15 min", "Medium", "Traffic-dependent"],
            [
              "Handover",
              "1–5 min",
              "High",
              "Apartment blocks, lifts, gates — routinely underestimated",
            ],
          ],
        },
        bullets: [
          "Quote a range or a deliberately pessimistic point estimate. Beating the promise is a good experience; missing it is a support ticket and a refund.",
          'Update the estimate as stages resolve, and explain why when it moves — an unexplained jump from twenty-five minutes to forty reads as a broken system, while "the restaurant is running behind" reads as honesty.',
          "The handover stage is consistently underestimated and is a real component of total time, especially in dense cities with controlled-access buildings.",
          "Feed actual outcomes back into the model. Like navigation, this system predicts a duration and then observes the true value, which is an unusually clean training signal.",
        ],
      },
      {
        heading: "Batching as a routing problem",
        body: [
          "Once a courier can carry two or three orders, dispatch stops being an assignment and becomes a small vehicle-routing problem with time windows. The optimisation is real but the constraints are mostly about fairness and food quality rather than distance.",
        ],
        bullets: [
          "Only batch orders whose pickup and drop-off are genuinely compatible in both geography and timing. A second order that adds twelve minutes to the first customer's wait is not a saving, it is a cost transferred to them.",
          "Cap the added delay per order explicitly and treat it as a product parameter, so the economics cannot silently degrade the experience.",
          "Food quality is a real constraint that distance-based routing ignores: cold food after an efficient route is still a bad delivery, which argues for limiting how long any order sits in a bag.",
          "Couriers need to understand and trust the batch. An opaque sequence of pickups and drops that appears to waste their time produces declined offers, which reduces effective supply.",
        ],
        callout: {
          kind: "insight",
          text: "Almost every decision here is a three-way trade between the customer's wait, the courier's earnings per hour, and the platform's cost per delivery. Improving one usually costs another, which is why batching aggressiveness, dispatch timing and incentive levels are tunable parameters rather than fixed logic — and why they are business decisions the architecture must simply keep adjustable.",
        },
      },
      {
        heading: "Failures with three independent parties",
        body: [
          "Each participant can disappear at any moment, and each disappearance needs a defined outcome. An order that hangs because a tablet was left face-down is an operational problem the design should prevent rather than discover.",
        ],
        table: {
          caption: "Who vanished, and what the system does.",
          headers: ["Failure", "Response"],
          rows: [
            [
              "Restaurant does not acknowledge",
              "Escalate: push, then phone; auto-cancel and refund past a deadline",
            ],
            [
              "Restaurant cancels mid-preparation",
              "Refund immediately; release the courier; offer alternatives",
            ],
            [
              "No courier accepts near readiness",
              "Widen radius, raise incentive, inform the customer honestly",
            ],
            [
              "Courier goes offline carrying food",
              "Contact, then reassign from the last known position",
            ],
            [
              "Customer unreachable at delivery",
              "Defined wait, photo proof, documented disposal policy",
            ],
            [
              "Payment capture fails at delivery",
              "Complete the delivery; pursue the balance separately",
            ],
          ],
        },
        bullets: [
          "Client-generated event ids make replay safe, so a courier's phone that buffered updates in a lift replays without producing duplicate transitions or a second payment capture.",
          "Never block delivery completion on payment. The food has been handed over; recovering the money is a separate, slower process.",
          "Every one of these paths costs money, so they need measurement. The rate of restaurant non-acceptance and of unaccepted dispatch offers are leading indicators of marketplace health, not merely error counters.",
          "Support tooling is part of the system. A human resolving a stuck order needs to see the full event history and to force transitions safely, which means the state machine must expose an audited override path.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Dispatch at predicted readiness",
        pickWhen: "Courier supply is constrained — normally",
        cost: "Depends on prep prediction; needs escalation when nobody accepts",
      },
      {
        choice: "Dispatch at order placement",
        pickWhen: "Very short prep times or abundant couriers",
        cost: "Couriers wait unpaid, reducing effective supply",
      },
      {
        choice: "Batched deliveries",
        pickWhen: "Density supports compatible routes",
        cost: "One customer waits longer; needs a hard cap on added delay",
      },
      {
        choice: "Pessimistic estimates",
        pickWhen: "Always",
        cost: "Some customers order elsewhere because the quote looks slow",
      },
      {
        choice: "Authorise early, capture at delivery",
        pickWhen: "Always",
        cost: "Authorisation expiry on long orders needs handling",
      },
      {
        choice: "Shard by city",
        pickWhen: "Always",
        cost: "Boundary areas and multi-city metros need explicit rules",
      },
    ],
    wrapUp: [
      "Transactionally this is a small system — a few hundred orders a second at peak — and the difficulty is timing across three independent parties rather than scale.",
      "Dispatch is scheduled against predicted readiness rather than triggered at order placement, because a courier waiting at a restaurant is unproductive supply removed from the pool.",
      "Prep-time prediction is a first-class component, learned from observed ready events rather than taken from what the kitchen claims, and biased to a high percentile.",
      "Batching is where the economics live, and it must carry an explicit cap on how much delay a single customer absorbs.",
      "The order is a durable state machine with client-generated event ids, so any party can disconnect and replay without duplicate transitions or double charges.",
      "Estimates should be slightly pessimistic and explain themselves when they change; trust is the product, and every failure path has a defined, measured outcome.",
    ],
    followUps: [
      {
        q: "When should the courier be assigned — at order time or later?",
        a: "Later, timed to predicted readiness. Assigning at order placement guarantees a courier but parks them outside the restaurant for fifteen minutes doing nothing, which is unpaid time for them and removes them from the pool for other orders nearby, so effective supply drops and the marketplace degrades. The better approach is to predict when the food will be ready, subtract the courier's travel time, and make the offer at that point so they arrive as the food does. The cost is that the prediction can be wrong and that nobody might accept close to readiness, so there has to be a safety margin and an escalation path — widen the radius, increase the incentive, and tell the customer honestly rather than letting the promised time slide past in silence.",
      },
      {
        q: "The restaurant says twenty minutes but consistently takes thirty-five. What do you do?",
        a: "Stop using their number as the estimate. Restaurants are systematically optimistic about their own prep times, particularly when busy, so the useful estimate is learned from observed ready events per restaurant, per hour and per item class rather than taken from what the kitchen reports. I would use a high percentile rather than the median, because the asymmetry matters: dispatching slightly early costs the courier a few minutes of waiting, while dispatching late means the food sits getting cold and the customer's promise is missed. The restaurant's own figure is still useful as a signal — a sudden change from their norm tells you something — but it should be an input to the model, not the output.",
      },
      {
        q: "The courier's phone dies while carrying an order. What happens?",
        a: "The order does not disappear, because the durable order record is the source of truth rather than the courier's live session. Their location simply expires by TTL, which is also how the system notices — no position updates and no state transitions past pickup. The response is escalation rather than automation: attempt contact, and if that fails, reassign from their last known position, which is why sampled location during an active delivery is worth keeping even though the general location stream is disposable. When their phone comes back, buffered events replay with client-generated ids so a delivery confirmation sent twice is applied once, and the state machine rejects transitions that no longer make sense, such as a pickup event on an order that has already been reassigned.",
      },
      {
        q: "How do you decide whether to batch two orders together?",
        a: "By checking compatibility in both geography and time, and then by how much delay it imposes on the earlier order. Two pickups close together and two drop-offs in the same direction is a genuine saving; a second pickup that sits eight minutes away, or a drop-off that reverses the route, is not. Beyond the routing, there is a constraint that pure distance optimisation misses entirely — food quality, since an order that sits in a bag while a second is collected arrives cold regardless of how efficient the route was. So I would cap both the added delay per customer and the time any order spends waiting, and treat those caps as product parameters rather than internal constants, because they are exactly the dials that trade platform cost against customer experience.",
      },
      {
        q: "Why is the estimate deliberately pessimistic?",
        a: "Because the cost of the two errors is very unequal. Beating a thirty-five minute promise by five minutes is a small delight that costs nothing; missing a twenty-five minute promise by ten produces a support contact, often a refund, and a durable loss of trust in every future estimate the app shows. The estimate is also a chain of predictions — acceptance, preparation, courier assignment, two travel legs and a handover — and the errors compound rather than cancel, so a sum of optimistic point estimates is reliably too low. I would present a range rather than a single minute, update it as each stage resolves, and explain movements when they happen, because an unexplained jump reads as a broken system while a stated reason reads as honesty.",
      },
    ],
    related: [
      "/examples/uber",
      "/examples/payment",
      "/examples/hotel-reservation",
      "/examples/proximity",
      "/hld/idempotency",
    ],
    furtherReading: [
      {
        label: "algomaster — design a food delivery app",
        href: "https://algomaster.io/learn/system-design-interviews/design-a-food-delivery-app",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
