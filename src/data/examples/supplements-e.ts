import type { DesignExample } from "@/data/types";

export const supplementsE: Record<string, Partial<DesignExample>> = {
  tinder: {
    clarifying: [
      {
        q: "How is the candidate deck generated?",
        a: "Precomputed per user rather than queried live — filtering millions of profiles on every swipe would not meet the latency budget.",
      },
      {
        q: "How is a match detected?",
        a: "A mutual like, which is a read of the other person's decision at the moment you swipe. That check must be fast and must not miss a concurrent like.",
      },
      {
        q: "Is swipe volume high?",
        a: "Extremely — swipes vastly outnumber matches. That asymmetry is why swipes are written cheaply and matches are handled carefully.",
      },
    ],
    wrapUp: [
      "Recommendation decks are precomputed and cached per user, refilled in the background so a swipe never triggers a search.",
      "Swipes are a very high-volume, low-value write — batch them and keep the write path minimal.",
      "Match detection is a lookup of the reciprocal swipe; making that check atomic avoids the case where two simultaneous likes produce no match.",
      "Geography plus filters means the candidate pool is a spatial query, which is done offline during deck generation rather than per swipe.",
      "With another hour: the ranking model behind deck ordering, and the anti-abuse and verification pipeline.",
    ],
    followUps: [
      {
        q: "How do you generate the deck fast enough?",
        a: "By not generating it during the swipe. A background job builds and caches a queue of candidates per active user, filtered by location and preferences and ordered by the ranking model, and refills it when it runs low. The swipe path then just pops from a cached list, which keeps it to a couple of milliseconds.",
      },
      {
        q: "Two users like each other at the same instant. Do both see a match?",
        a: "They must, which means the check-and-record has to be atomic rather than 'write my swipe, then read theirs'. A conditional write on a canonical pair key — ordered by user id so both sides compute the same key — ensures exactly one match record is created and both users are notified from it.",
      },
      {
        q: "Do you store every swipe?",
        a: "Yes, but cheaply and asynchronously. They are needed to avoid re-showing profiles and to train ranking, but they do not need to be durable within the request. I would write them to a fast store or batch them into a stream, and keep a compact per-user seen-set so deck generation can exclude them.",
      },
    ],
  },

  "google-search": {
    clarifying: [
      {
        q: "Are we designing crawling, indexing, or serving?",
        a: "Pick one. Serving a query in 100 ms over a trillion-document index is a different system from building that index, and covering both shallowly helps nobody.",
      },
      {
        q: "How fresh must results be?",
        a: "Tiered: news within minutes, the long tail within weeks. A uniform freshness target either wastes capacity or misses everything that changes.",
      },
      {
        q: "What is the latency budget?",
        a: "Around 100 ms including ranking. That budget is what forces index sharding with parallel fan-out and heavy caching.",
      },
    ],
    wrapUp: [
      "The core structure is an inverted index — term to posting list — sharded by document so every shard sees every query and returns local top-k.",
      "Query serving is scatter-gather: fan out to all shards in parallel, merge top results, then re-rank the small survivor set with expensive signals.",
      "Two-phase ranking is what makes the latency budget work: cheap scoring on millions of candidates, expensive scoring on a few hundred.",
      "Caching at the query level absorbs a large share of traffic because query popularity is extremely skewed.",
      "With another hour: index update pipelines and freshness tiers, and how personalisation interacts with caching.",
    ],
    followUps: [
      {
        q: "How do you serve a query in 100 ms over a trillion documents?",
        a: "By never touching most of them. The inverted index turns a query into a small number of posting-list intersections, the index is sharded by document so every shard works in parallel on its slice, and each returns only its local top results. Then a cheap first-pass score narrows millions of candidates to a few hundred, and only those get expensive ranking.",
      },
      {
        q: "Why shard by document rather than by term?",
        a: "Because term-sharding means a multi-word query hits only the shards holding those terms, creating enormous load skew on common words and requiring posting lists to be shipped between shards to intersect. Document-sharding means every shard does a small, similar amount of work and returns a small result — more total machines involved, but predictable latency and even load.",
      },
      {
        q: "What does the tail latency look like with hundreds of shards?",
        a: "Bad, unless you design for it. A request waits for the slowest shard, so with enough shards, some request is always hitting someone's garbage collection or slow disk. The standard mitigations are hedged requests — send a duplicate to another replica after a short delay — and returning partial results when a shard misses its deadline, since missing a fraction of results is far better than missing the deadline.",
      },
    ],
  },

  zoom: {
    clarifying: [
      {
        q: "How many participants per meeting?",
        a: "It changes the architecture entirely. Two people can go peer-to-peer; fifty need a media server; a webinar for ten thousand is a broadcast problem.",
      },
      {
        q: "What is the latency requirement?",
        a: "Under about 200 ms one way for conversation to feel natural. That rules out anything involving buffering or store-and-forward.",
      },
      {
        q: "Do we need recording and transcription?",
        a: "If yes, the media server must produce a composited stream as well as forwarding, which is a significantly higher CPU cost.",
      },
    ],
    wrapUp: [
      "Media is UDP-based real-time transport, not HTTP: latency matters far more than reliability, so lost packets are concealed rather than retransmitted.",
      "A selective forwarding unit forwards streams without decoding them, which is what makes many-participant meetings affordable.",
      "Simulcast — each sender publishes several qualities — lets the server give each receiver a stream matched to their connection.",
      "Signalling, media and recording are separate paths with different scaling characteristics and different failure modes.",
      "With another hour: echo cancellation and active-speaker detection, and the fallback path when UDP is blocked.",
    ],
    followUps: [
      {
        q: "Peer-to-peer or through a server?",
        a: "Peer-to-peer for two participants, because it is the lowest latency and costs nothing to run. Beyond a handful it stops working, since each participant must upload their stream to every other — that is quadratic in upload bandwidth. A selective forwarding unit fixes it: everyone uploads once and the server forwards, so upload cost stays constant per participant.",
      },
      {
        q: "Why not mix all streams into one on the server?",
        a: "Mixing requires decoding and re-encoding every stream, which is expensive per meeting and adds latency. A forwarding unit just routes packets without touching the media, so a server can host far more meetings. The trade is that clients receive multiple streams and do their own layout, which shifts work to the endpoint — usually a good trade.",
      },
      {
        q: "What happens on a poor connection?",
        a: "Quality degrades rather than the call dropping. With simulcast, the sender publishes several qualities and the server forwards the one that fits each receiver's measured bandwidth. Lost packets are concealed by the codec rather than retransmitted, because a late packet is useless in a real-time conversation — this is exactly why media runs over UDP rather than TCP.",
      },
    ],
  },

  "ticket-booking": {
    clarifying: [
      {
        q: "Can a seat be sold twice?",
        a: "Never. That is the hard constraint, and it makes this a consistency problem rather than an availability one at the point of purchase.",
      },
      {
        q: "How long is a seat held during checkout?",
        a: "Typically ten minutes. Holds must expire automatically, or a popular event slowly becomes unbookable as abandoned carts accumulate.",
      },
      {
        q: "What does the traffic profile look like?",
        a: "Extreme spikes — an on-sale can be a hundred times normal load in one second. Designing for average traffic here is designing for failure.",
      },
    ],
    wrapUp: [
      "Seat state is a small state machine — available, held, sold — and every transition is an atomic conditional update rather than a read-then-write.",
      "Holds have an expiry and a sweeper; without both, inventory leaks and the event appears sold out while seats remain.",
      "On-sale spikes are handled by a queue in front of the booking path, so the transactional system sees a controlled rate rather than a wall.",
      "Search and seat maps are served from cache and may be slightly stale; only the purchase path is strongly consistent.",
      "With another hour: fair queueing and bot mitigation during on-sale, and the payment failure path that must release the hold.",
    ],
    followUps: [
      {
        q: "How do you guarantee a seat is not sold twice?",
        a: "A conditional update that only succeeds when the seat is still available — zero rows affected means someone else got it. All the concurrency safety lives in that one statement. Reading availability, deciding in application code, and then writing is the version that oversells, and it is what a queue in front cannot fix.",
      },
      {
        q: "How do you survive an on-sale spike?",
        a: "By admitting users to the booking path at a controlled rate rather than letting a hundred thousand people hit the transactional system simultaneously. A virtual waiting room issues positions and lets people through as capacity allows. Everything not transactional — the seat map, event details — is cached hard, so only the actual purchases reach the consistent path.",
      },
      {
        q: "A user's payment fails after the hold. What happens?",
        a: "The hold is released immediately rather than waiting for expiry, so the seat goes back on sale. The important detail is that a payment timeout is not the same as a failure: if the outcome is unknown, the hold has to persist until it is resolved, because releasing a seat that was actually paid for is a much worse outcome than a few extra minutes of unavailability.",
      },
    ],
  },

  "distributed-lock": {
    clarifying: [
      {
        q: "Is the lock for correctness or for efficiency?",
        a: "The crucial distinction. For efficiency — avoiding duplicate work — a best-effort lock is fine. For correctness, you need fencing tokens and should question whether a lock is the right tool at all.",
      },
      {
        q: "How long is the lock held?",
        a: "As briefly as possible, and never across an unbounded operation. Long holds make lease expiry during work far more likely.",
      },
      {
        q: "What happens if the holder pauses?",
        a: "A garbage-collection pause or a VM stall can exceed the lease while the holder still believes it owns the lock. This is the failure mode the whole design has to account for.",
      },
    ],
    wrapUp: [
      "A distributed lock is a lease, not a mutex: it expires, and the holder can be wrong about still owning it.",
      "Fencing tokens are what make it safe — the storage layer rejects writes carrying an older token, so a resurrected holder cannot corrupt state.",
      "Consensus-backed stores (etcd, ZooKeeper) give correct leases; Redis-based locks are best-effort and should be described as such.",
      "The better answer is often to avoid the lock: make the operation idempotent, or use a conditional update on the resource itself.",
      "With another hour: lease renewal and the safe hand-off when a holder is shutting down gracefully.",
    ],
    followUps: [
      {
        q: "Why is a lease not enough?",
        a: "Because the holder can pause — a long garbage collection, a VM migration — past its expiry, wake up believing it still holds the lock, and write. Meanwhile another process legitimately acquired it. The fix is a fencing token: each acquisition gets a monotonically increasing number, and the storage layer rejects writes carrying an older one, so the stale writer is stopped where the damage would occur.",
      },
      {
        q: "Redis or etcd for locks?",
        a: "etcd or ZooKeeper when correctness matters, because leadership and leases come from a consensus protocol with a majority, so a partitioned minority cannot grant a lock. A single-instance Redis lock is fast and simple but is best-effort — it can grant the same lock twice across a failover. I would use Redis for efficiency locks and say plainly that it is not a correctness guarantee.",
      },
      {
        q: "Can you avoid the lock entirely?",
        a: "Usually, and that is generally the better design. A conditional update on the resource — succeed only if the state is what I expect — provides mutual exclusion exactly where it is needed without a separate lock service. Making the operation idempotent removes the need for exclusion altogether. A distributed lock is a consistency claim that a network partition can break, so I reach for it last.",
      },
    ],
  },
};
