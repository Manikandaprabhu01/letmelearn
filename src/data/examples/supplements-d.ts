import type { DesignExample } from "@/data/types";

export const supplementsD: Record<string, Partial<DesignExample>> = {
  instagram: {
    clarifying: [
      {
        q: "Is the feed chronological or ranked?",
        a: "Ranked, which means retrieval and ranking are separate stages — assemble a candidate set first, score it second.",
      },
      {
        q: "How large can a follower count get?",
        a: "Into the hundreds of millions, which is what forces a hybrid fan-out rather than pure push.",
      },
      {
        q: "How much of the payload is media?",
        a: "Nearly all of it. The feed carries ids and metadata; images and video are served entirely from a CDN, which is a separate delivery problem.",
      },
    ],
    wrapUp: [
      "Feed generation is hybrid: push to normal users' precomputed feeds, pull for accounts above a follower threshold, merged at read time.",
      "Media is uploaded directly to object storage, processed into several sizes and formats asynchronously, and served from the CDN.",
      "Feed entries hold ids; hydration into full posts happens at read time from a cache, which keeps feed storage small.",
      "Deleted, blocked and hidden content is filtered at hydration rather than by rewriting millions of feed lists.",
      "With another hour: the ranking pipeline and its feature freshness, and Stories, which have very different expiry mechanics.",
    ],
    followUps: [
      {
        q: "How is this different from Twitter's feed?",
        a: "Structurally it is the same hybrid fan-out problem, but the payload changes the emphasis: Instagram's bytes are overwhelmingly media, so CDN strategy and image processing dominate the cost, while Twitter's are text, so the feed infrastructure dominates. The celebrity fan-out problem and the push-versus-pull threshold are essentially identical.",
      },
      {
        q: "What happens when a post is deleted?",
        a: "It is tombstoned, and feeds filter it during hydration. Rewriting every feed list that contains it would be millions of writes for one delete. The media is also unlinked from the CDN, which requires a purge — that is the step people forget, and without it the image stays reachable by direct URL.",
      },
      {
        q: "How do you handle image processing at upload?",
        a: "Asynchronously, after the upload lands directly in object storage via a signed URL. A pipeline generates the sizes and formats the clients need — thumbnails, feed size, full size, modern codecs — and the post becomes visible once the essential renditions exist. Doing this synchronously would make posting slow and would couple upload availability to the processing fleet.",
      },
    ],
  },

  netflix: {
    clarifying: [
      {
        q: "Playback, catalogue, or recommendations?",
        a: "Say which. Playback is a CDN and adaptive-bitrate problem; recommendations is a machine-learning pipeline. They share almost nothing.",
      },
      {
        q: "Is the catalogue fixed or continuously changing?",
        a: "Slowly changing, which is what makes aggressive pre-positioning of content at the edge possible — you know days in advance what people will watch.",
      },
      {
        q: "What is the availability requirement during a regional failure?",
        a: "Playback must continue. That is why the architecture emphasises graceful degradation of everything except the play button.",
      },
    ],
    wrapUp: [
      "Content is transcoded once into many renditions and pre-positioned into edge caches — often inside ISP networks — before anyone requests it.",
      "Playback is adaptive bitrate over plain HTTP segments, so the player controls quality and any HTTP cache can serve video.",
      "Everything except playback degrades gracefully: recommendations, artwork and search can fail without stopping the video.",
      "Client-side resilience — retries, fallbacks, cached catalogue data — is treated as part of the system, not as the client team's problem.",
      "With another hour: the recommendation pipeline, and encoding-per-title optimisation that tunes the ladder to the content.",
    ],
    followUps: [
      {
        q: "Why pre-position content instead of caching on demand?",
        a: "Because the catalogue is known and popularity is predictable, so waiting for a cache miss wastes the one thing that is scarce — origin bandwidth at peak. Pushing new releases to edge caches during off-peak hours means the first viewer in a region gets an edge hit, and the origin never sees the surge.",
      },
      {
        q: "What degrades when something fails?",
        a: "Everything except playback. Personalised rows fall back to popular content, artwork falls back to a default, search falls back to a simpler index. The design principle is that a member should always be able to start a video, and every other feature has an explicit fallback with a short timeout so a slow dependency cannot hold up the home screen.",
      },
      {
        q: "How does the player choose quality?",
        a: "It measures throughput and buffer level and switches between renditions at segment boundaries, which are keyframe-aligned so the switch is seamless. The heuristic favours avoiding rebuffering over maximising resolution, because users tolerate lower quality far better than a spinner.",
      },
    ],
  },

  spotify: {
    clarifying: [
      {
        q: "Streaming, or also offline downloads?",
        a: "Both, which means the client caches encrypted audio locally and the licensing model has to permit it — a product constraint that shapes the design.",
      },
      {
        q: "How fast must playback start?",
        a: "Under 200 ms perceived. That drives prefetching the start of the next likely track rather than waiting for the user to press play.",
      },
      {
        q: "Personalised playlists in real time?",
        a: "Generated offline on a cycle, served from a precomputed store. Real-time generation per user per request is not necessary and not affordable.",
      },
    ],
    wrapUp: [
      "Audio files are small and immutable, so they are ideal CDN objects — the delivery problem is far easier than video.",
      "Perceived latency is managed by prefetching: the next track in a queue is fetched before the current one ends.",
      "Playlists and recommendations are precomputed offline and served as static-ish reads, which keeps the request path cheap.",
      "Play events feed both royalty accounting, which must be exact, and recommendations, which can be approximate — two consumers of one stream.",
      "With another hour: offline download and licence expiry, and the collaborative-filtering pipeline behind personalised playlists.",
    ],
    followUps: [
      {
        q: "Why is audio easier than video?",
        a: "Size. A track is a few megabytes rather than gigabytes, so it can be fetched whole or in a couple of chunks, cached almost anywhere, and does not need a complex adaptive-bitrate ladder. The interesting problems shift from delivery to discovery — search, recommendations and playlist generation — which is the opposite emphasis from a video service.",
      },
      {
        q: "How do you make playback feel instant?",
        a: "Prefetch. While a track plays, the client fetches the beginning of the next one, so pressing skip is a local operation. Combined with CDN edge caching and starting playback from a small initial buffer rather than waiting for a full download, the perceived latency is dominated by the client's own decisions rather than by the network.",
      },
      {
        q: "How are royalties counted?",
        a: "From play events, which must be exact because they are billing data. That means deduplicating on an event id, defining precisely what counts as a play — typically a minimum duration — and retaining raw events so a disputed figure can be recomputed. The same event stream feeds recommendations, where approximation is fine, so the two consumers have very different accuracy requirements.",
      },
    ],
  },

  uber: {
    clarifying: [
      {
        q: "How often do drivers report location?",
        a: "Every few seconds while online. That is the dominant write load and the first number to establish.",
      },
      {
        q: "How is a match decided?",
        a: "Not purely by distance — ETA, direction of travel, driver rating and acceptance likelihood all matter, which makes matching a scoring problem rather than a nearest-neighbour query.",
      },
      {
        q: "What happens if a driver declines?",
        a: "The request moves to the next candidate with a short timeout. That loop is the core of the matching system and needs an explicit deadline before the rider is told nobody is available.",
      },
    ],
    wrapUp: [
      "Driver locations are high-volume, short-lived and tolerant of loss, so they live in an in-memory spatial index rather than a durable store.",
      "Matching is a scored selection over candidates in nearby cells, not a nearest-neighbour lookup — ETA and acceptance probability matter more than raw distance.",
      "The offer loop needs explicit timeouts and a bounded number of attempts, or a rider waits indefinitely while offers cycle.",
      "The trip itself is a state machine with strong consistency requirements once a match is accepted; before that, everything is best-effort.",
      "With another hour: surge pricing as a feedback loop, and the ETA model that matching depends on.",
    ],
    followUps: [
      {
        q: "How do you find nearby drivers efficiently?",
        a: "A spatial index — geohash cells or an S2-style covering — held in memory and keyed by cell, so a search reads the target cell and its neighbours rather than scanning all drivers. Because positions change constantly, the index is updated in place and never persisted per update; losing it means drivers re-report within seconds.",
      },
      {
        q: "Two riders request the same driver simultaneously. What happens?",
        a: "The offer must be an atomic claim on the driver — a conditional update that succeeds for exactly one request. The loser immediately moves to its next candidate rather than waiting. Without that atomicity you get two riders told the same driver is coming, which is a much worse failure than a slightly longer wait.",
      },
      {
        q: "Why not just pick the closest driver?",
        a: "Because straight-line distance is a poor predictor of arrival time — a driver across a river or facing the wrong way on a one-way street is further in practice. Matching scores candidates on estimated time to arrive, direction of travel, and the probability they accept, since an offer that gets declined costs the rider more time than a slightly more distant driver who says yes.",
      },
    ],
  },

  "food-delivery": {
    clarifying: [
      {
        q: "How many parties are being coordinated?",
        a: "Three — customer, restaurant and courier — each with their own state and their own failure modes. That three-way coordination is what makes this harder than a ride-hailing match.",
      },
      {
        q: "Are couriers assigned before or after the restaurant accepts?",
        a: "It is a real trade: assigning early risks a wasted courier if the restaurant declines; assigning late adds delay. Say which you chose.",
      },
      {
        q: "Do we support batching multiple orders per courier?",
        a: "Yes at scale, and it changes the assignment problem from matching to routing — which is worth flagging as substantially harder.",
      },
    ],
    wrapUp: [
      "The order is a state machine spanning three parties, and every transition needs a timeout and a fallback because any party can stall.",
      "Courier assignment is timed against food readiness — assigning too early wastes courier time, too late means cold food.",
      "ETA is a composition of several estimates (preparation, pickup, travel), and errors compound, so it must be re-estimated continuously.",
      "Every party sees a different view of the same order, which means the notification and update fan-out is a first-class part of the design.",
      "With another hour: batching orders per courier as a routing problem, and dynamic pricing during demand peaks.",
    ],
    followUps: [
      {
        q: "When do you assign a courier?",
        a: "Timed against predicted food readiness rather than at order placement or at pickup. Too early and the courier waits, which wastes the scarcest resource in the system; too late and the food sits getting cold. That makes the preparation-time estimate a load-bearing part of the design, not a display detail.",
      },
      {
        q: "The restaurant never confirms the order. What happens?",
        a: "Every state needs a timeout and an escalation. After a short window the system re-pings, then escalates to a human or auto-cancels and refunds, and the customer is told early rather than left watching a status that never changes. Designing the unhappy paths explicitly is most of the work in a three-party workflow.",
      },
      {
        q: "Why is the ETA so hard?",
        a: "Because it is a sum of estimates that each have error — restaurant preparation, courier arrival at the restaurant, wait time there, and travel to the customer — and the errors compound. It also has to be recomputed continuously as reality diverges, and the product consequence of being wrong is asymmetric: quoting too short is far worse than quoting slightly long.",
      },
    ],
  },

  "google-docs": {
    clarifying: [
      {
        q: "How many concurrent editors per document?",
        a: "Tens, occasionally hundreds. That bound matters, because the merge algorithms behave very differently at ten editors than at ten thousand.",
      },
      {
        q: "Must edits work offline?",
        a: "Yes — which strongly favours a CRDT or a well-implemented operational transform, since a naive last-write-wins merge loses text.",
      },
      {
        q: "Is full version history required?",
        a: "Yes, which means the operation log is retained rather than only the current document state.",
      },
    ],
    wrapUp: [
      "The document is a sequence of operations, not a blob — that representation is what makes concurrent editing and history possible.",
      "Concurrent edits are reconciled by operational transform or a CRDT; both preserve intent where a text-level merge would lose it.",
      "A server assigns a total order to operations, which is what lets clients converge without a distributed consensus protocol per keystroke.",
      "Presence, cursors and selections are separate, ephemeral channels with much weaker delivery guarantees than the edits themselves.",
      "With another hour: rich formatting and its interaction with the merge algorithm, and snapshotting so a document does not replay millions of operations.",
    ],
    followUps: [
      {
        q: "OT or CRDT?",
        a: "Operational transform is what the established editors use — it needs a central server to order operations, which they have anyway, and it produces compact operations. CRDTs need no central authority and handle offline editing cleanly, at the cost of metadata that grows with edit history. For a server-backed document editor I would take OT for its efficiency; for peer-to-peer or heavily offline use, a CRDT.",
      },
      {
        q: "Two people type at the same position simultaneously. What happens?",
        a: "Both operations are ordered by the server, and the second is transformed against the first so its position accounts for the character that was just inserted. Without that transformation, the second insert lands at a stale offset and the text is corrupted. Every client applies operations in the same order with the same transformations, so all copies converge.",
      },
      {
        q: "How do you avoid replaying a million operations to open a document?",
        a: "Periodic snapshots. The document state is materialised and stored at intervals, and opening loads the latest snapshot plus the operations since. It is the same checkpoint-plus-log pattern a database uses, and without it, load time grows without bound as a document ages.",
      },
    ],
  },
};
