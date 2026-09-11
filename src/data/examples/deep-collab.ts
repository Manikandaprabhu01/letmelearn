import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const collabDeepExamples: DesignExample[] = [
  {
    slug: "google-docs",
    title: "Design Google Docs",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 24,
    tags: ["crdt", "ot", "collaboration", "websockets", "convergence"],
    companies: ["Google Docs", "Figma", "Notion", "Linear"],
    summary:
      "Two people typing in the same paragraph at the same moment is the entire problem, and naive last-writer-wins destroys one of them. Operational transformation and CRDTs both solve it by making concurrent edits commutative, and choosing between them is the real content of this interview. Everything else — presence, sessions, persistence — is ordinary infrastructure around that one hard idea.",
    clarifying: [
      {
        q: "How many simultaneous editors?",
        a: "Usually one to five, occasionally a few dozen. That bound matters: it means a document can live on a single server with all its collaborators connected to it, which removes distributed coordination from the hard path entirely.",
      },
      {
        q: "Rich text or plain text?",
        a: "Rich text, and that is meaningfully harder. Character insertion is the easy case; overlapping formatting ranges, tables and lists have concurrent-edit semantics that are genuinely subtle, so I would design for characters and name where structure complicates it.",
      },
      {
        q: "Does it need to work offline?",
        a: "Yes for a period, which pushes towards CRDTs — a client that has been editing offline for an hour must merge without a server having ordered its operations, and that is precisely the case operational transformation handles least comfortably.",
      },
      {
        q: "What latency do we need for typing?",
        a: "Local echo must be instant, so the client applies its own edit immediately and reconciles afterwards. Remote edits appearing within about a hundred milliseconds feels live. No design where a keystroke waits for a server round trip is acceptable.",
      },
      {
        q: "Do we need full history?",
        a: "Version history and named revisions, yes. Since the system is already an ordered log of operations, history is close to free — which is a good argument for the log being the source of truth rather than the document text.",
      },
    ],
    requirements: {
      functional: [
        "Multiple people edit the same document concurrently without losing work",
        "Every client converges to an identical document",
        "Presence: cursors, selections and who is editing",
        "Version history with restore, and offline editing that merges on reconnect",
      ],
      nonFunctional: [
        "Local edits apply instantly; remote edits appear within ~100 ms",
        "Convergence is guaranteed, not merely likely",
        "No edit is silently lost, ever",
        "A server failure must not lose acknowledged operations",
      ],
    },
    math: [
      {
        label: "Operation rate",
        expr: "5 editors × ~5 keystrokes/s",
        result: "≈ 25 ops/s per document",
        note: "Tiny. This is emphatically not a throughput problem — the difficulty is entirely in correctness.",
      },
      {
        label: "Fan-out per op",
        expr: "1 op × 4 other editors",
        result: "≈ 100 messages/s per document",
        note: "Which is why operations are batched over a few tens of milliseconds rather than sent per keystroke.",
      },
      {
        label: "Op log growth",
        expr: "a long document's editing history",
        result: "100 K–1 M ops",
        note: "Replaying from zero becomes slow, so snapshots are periodic and replay runs from the latest one.",
      },
      {
        label: "CRDT metadata overhead",
        expr: "per-character id + tombstones",
        result: "2–10× the raw text size",
        note: "The main practical cost of CRDTs, and why compaction and tombstone collection matter.",
      },
      {
        label: "Concurrent document count",
        expr: "millions of documents, few editors each",
        result: "shard by document, trivially",
        note: "Documents never interact, so this partitions perfectly — the scale question is almost uninteresting.",
      },
    ],
    apis: [
      {
        method: "WS",
        path: "/v1/docs/{id}/session",
        desc: "The editing channel — operations up, operations and presence down",
      },
      {
        method: "GET",
        path: "/v1/docs/{id}?at={version}",
        desc: "Snapshot plus operations since, so a client can start editing quickly",
      },
      {
        method: "POST",
        path: "/v1/docs/{id}/ops",
        desc: "Submit operations with the version they were based on",
      },
      {
        method: "GET",
        path: "/v1/docs/{id}/history",
        desc: "Named revisions and restore — nearly free given the op log",
      },
      {
        method: "POST",
        path: "/v1/docs/{id}/permissions",
        desc: "Sharing; revocation must tear down live sessions, not just future reads",
      },
    ],
    dataModel: [
      {
        entity: "documents",
        fields: [
          "doc_id (pk)",
          "owner_id, title",
          "current_version (monotonic)",
          "assigned_server (sticky routing)",
          "→ metadata only; the text lives in ops and snapshots",
        ],
      },
      {
        entity: "operations",
        fields: [
          "doc_id, seq (pk — the server's total order)",
          "site_id, client_seq",
          "payload (insert|delete|format)",
          "→ append-only; the source of truth",
        ],
      },
      {
        entity: "snapshots",
        fields: [
          "doc_id, version (pk)",
          "content (serialised document)",
          "→ so a new client does not replay a million operations",
        ],
      },
      {
        entity: "sessions",
        fields: [
          "doc_id, session_id (pk)",
          "user_id, cursor, selection",
          "last_seen",
          "→ ephemeral, in memory, TTL on disconnect",
        ],
      },
    ],
    architecture: [
      {
        heading: "Why last-writer-wins is not an option",
        lede: "State the failure concretely before proposing a solution.",
        code: {
          title: "The same edit, three ways",
          lang: "ts",
          source: `// Document: "Hello world". Ana inserts "!" at 11. Ben deletes "world" (6-11).
// Both act on version 4, simultaneously.

// 1) LAST WRITER WINS on the whole document — Ana's change is destroyed.
//    Whoever saves second overwrites the other entirely. Unusable.

// 2) OPERATIONAL TRANSFORMATION — the server orders operations, and each is
//    TRANSFORMED against those it did not see.
//    Ben's delete(6,11) arrives first and is applied.
//    Ana's insert(11,"!") must now be transformed: 5 characters before
//    position 11 were removed, so it becomes insert(6,"!").
//    Result: "Hello!" — both intentions preserved.
transformInsertAgainstDelete(insert, del) {
  if (insert.pos <= del.start) return insert;                  // unaffected
  if (insert.pos > del.end) return { ...insert, pos: insert.pos - del.length };
  return { ...insert, pos: del.start };                        // inside the deleted range
}

// 3) CRDT — no transformation at all. Every character has a unique, globally
//    ordered id, so an insert names its neighbours rather than a position:
//    insert after id "a7" — which stays meaningful no matter what else
//    happened. Operations commute, so order of arrival does not matter.`,
        },
        bullets: [
          "The core requirement is convergence: every client must end with byte-identical content regardless of the order operations happened to arrive in.",
          "Positions are the problem. An index into the text is only meaningful relative to a specific version, so either you fix up the index (operational transformation) or you stop using indexes (CRDT).",
          "Both approaches preserve intention, which is a stronger property than merely converging — two clients agreeing on a document that neither of them wanted would be convergence without correctness.",
          "Local echo is non-negotiable: the client applies its own operation immediately and reconciles when the server responds, which is why every client holds pending operations that may need transforming.",
        ],
      },
      {
        heading: "Operational transformation versus CRDT",
        lede: "The actual decision, and both answers are defensible.",
        diagram: {
          kind: "compare",
          caption: "Same guarantee, very different engineering.",
          options: [
            {
              title: "Operational transformation",
              sub: "a central server orders and transforms",
              tone: "ok",
              good: [
                "Document is plain text — no per-character metadata, so memory is small",
                "Mature for rich text; this is what Google Docs actually uses",
                "The server's total order makes reasoning straightforward",
              ],
              bad: [
                "Transformation functions are notoriously hard to get right for every operation pair",
                "Requires a central server — offline and peer-to-peer are awkward",
                "A bug produces silent divergence that is very hard to debug",
              ],
              verdict: "Right when there is a server anyway and document size matters.",
            },
            {
              title: "CRDT",
              sub: "operations commute by construction",
              good: [
                "No central ordering needed — works offline and peer to peer",
                "Convergence is a property of the data type, not of correct transform code",
                "Much easier to be confident it is correct",
              ],
              bad: [
                "Per-character ids and tombstones inflate memory several times over",
                "Interleaving of concurrent inserts can read oddly",
                "Rich text and structure are still an active area of work",
              ],
              verdict:
                "Right when offline support matters or when you want convergence by construction.",
            },
          ],
        },
        bullets: [
          "Modern CRDT implementations have narrowed the memory gap substantially with run-length encoding of contiguous characters, so the old objection is weaker than it used to be.",
          "Tombstones are the awkward part of CRDTs: deleted characters cannot be fully removed while any peer might still reference them, so garbage collection needs all peers to have acknowledged.",
          "A practical middle path is a CRDT for the text with a server that still provides ordering, persistence and presence — you gain offline merging without giving up the operational simplicity of a central service.",
          "Either way, the server keeps an append-only operation log and periodic snapshots, which is what gives version history almost for free.",
        ],
        callout: {
          kind: "interview",
          title: "How to answer without hand-waving",
          text: '"Both solve the same problem: making concurrent edits commute so everyone converges. Operational transformation fixes up positions against operations you did not see and needs a central server; a CRDT gives every character a unique id so position never needs fixing, at the cost of per-character metadata. I would pick a CRDT if offline editing matters and operational transformation if document size and rich text do."',
        },
      },
    ],
    deepDives: [
      {
        heading: "The session: sticky, in memory, and small",
        body: [
          "Because a document has few editors, all of them can connect to one server holding the document in memory. That single decision removes almost all the distributed-systems difficulty — the hard algorithm runs in one process, against one authoritative copy.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Local echo first, server order second, reconcile third.",
          actors: [
            { id: "a", label: "Ana" },
            { id: "s", label: "Doc server", sub: "sticky, in memory" },
            { id: "b", label: "Ben" },
            { id: "db", label: "Op log" },
          ],
          messages: [
            { from: "a", to: "a", label: "1. apply locally — instant", kind: "self", tone: "ok" },
            { from: "a", to: "s", label: "2. op + base version", kind: "call" },
            {
              from: "s",
              to: "s",
              label: "3. transform against ops since that version",
              kind: "self",
              tone: "accent",
            },
            { from: "s", to: "db", label: "4. append at seq N", kind: "call" },
            { from: "s", to: "a", label: "5. ack with seq N", kind: "return" },
            { from: "s", to: "b", label: "6. broadcast transformed op", kind: "async", tone: "ok" },
            { from: "b", to: "b", label: "7. transform against own pending, apply", kind: "self" },
          ],
        },
        bullets: [
          "Routing must be sticky per document, so all editors of one document land on the same server. Two servers holding the same document independently would need distributed agreement on ordering — exactly the complexity worth avoiding.",
          "The server appends to a durable log before acknowledging. An acknowledged operation that is then lost breaks the client's model of what the server has seen, which is much worse than a rejected operation.",
          "Snapshots let a joining client start from recent state rather than replaying the entire history, and they bound recovery time after a server restart.",
          "Server failure means reconnecting clients to a new server, which rebuilds from the last snapshot plus subsequent operations. Clients resend anything unacknowledged, which is safe because operations carry client sequence numbers and can be deduplicated.",
        ],
      },
      {
        heading: "Presence is a different problem with different rules",
        body: [
          "Cursors and selections look like part of the same system and should be treated separately: presence is high-frequency, entirely disposable, and must never be persisted or allowed to slow the edit path.",
        ],
        table: {
          caption: "Edits and presence have opposite requirements.",
          headers: ["Property", "Edits", "Presence"],
          rows: [
            ["Durability", "Must never be lost", "Worthless a second later"],
            ["Ordering", "Strict total order required", "Irrelevant"],
            ["Frequency", "Keystroke rate, batched", "Continuous while moving"],
            ["On disconnect", "Pending ops resent", "Expires by TTL"],
            ["Storage", "Append-only log plus snapshots", "Memory only"],
          ],
        },
        bullets: [
          "A cursor position must be transformed exactly like an operation, or remote cursors drift to the wrong place as text is inserted above them — a small bug that looks very broken.",
          "Throttle presence updates to a few per second. Sending a cursor update per mouse movement multiplies traffic for no perceptible benefit.",
          "Presence expires by TTL for the same reason as everywhere else: a crashed tab never sends a goodbye, so absence must be inferred.",
          "Never let presence share a delivery guarantee with edits. Dropping a cursor update is fine; dropping an operation is not.",
        ],
      },
      {
        heading: "Offline editing and the merge",
        body: [
          "Editing offline for an hour and then reconnecting is where the two approaches genuinely diverge, and it is the strongest practical argument for CRDTs.",
        ],
        bullets: [
          "With a CRDT, the client simply exchanges the operations each side missed and both converge, because operations commute regardless of when they arrive — there is no transformation to compute against an hour of history.",
          "With operational transformation, the reconnecting client's operations must be transformed against everything that happened while it was away, which is correct in principle and expensive and error-prone in practice.",
          "Either way, the user's expectation is that nothing they typed is lost, which rules out any resolution that picks one side. This is the same principle as file sync keeping a conflicted copy, applied at a much finer granularity.",
          "Long offline periods also interact with tombstone collection, since a CRDT cannot safely garbage-collect deletions that a still-absent peer has not acknowledged.",
        ],
        callout: {
          kind: "warn",
          title: "Convergence is not the same as a good result",
          text: "Two clients can converge on a document neither intended — concurrent inserts at the same position can interleave character by character, producing text that is technically consistent and reads as nonsense. Good implementations bias towards keeping a user's contiguous run together. It is worth naming because it shows you understand that convergence is the floor rather than the goal.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Operational transformation",
        pickWhen: "A central server exists and document size matters",
        cost: "Transform functions are hard to get right; offline is awkward",
      },
      {
        choice: "CRDT",
        pickWhen: "Offline editing or peer-to-peer matters",
        cost: "Per-character metadata and tombstones inflate memory",
      },
      {
        choice: "Sticky single-server sessions",
        pickWhen: "Always — editors per document are few",
        cost: "Server failure disconnects everyone on that document briefly",
      },
      {
        choice: "Append-only op log plus snapshots",
        pickWhen: "Always",
        cost: "Storage grows; snapshots need scheduling and pruning",
      },
      {
        choice: "Presence separate from edits",
        pickWhen: "Always",
        cost: "Two channels with different semantics to maintain",
      },
      {
        choice: "Local echo with pending ops",
        pickWhen: "Always — typing cannot wait for the network",
        cost: "The client must transform its own pending operations",
      },
    ],
    wrapUp: [
      "The whole problem is making concurrent edits commute so every client converges; last-writer-wins is not a weaker option, it silently destroys work.",
      "Positions are what break: operational transformation fixes up indexes against operations you did not see, while a CRDT gives every character an id so positions never need fixing.",
      "Choose on constraints rather than fashion — operational transformation for compact documents with a central server, CRDTs when offline editing or convergence-by-construction matters.",
      "Few editors per document means one sticky server holds it in memory, which removes distributed coordination from the hard path entirely.",
      "The append-only operation log is the source of truth, which makes version history nearly free and recovery a matter of snapshot plus replay.",
      "Presence is a separate system with opposite requirements — disposable, throttled, TTL-expired — and must never share a delivery guarantee with edits.",
    ],
    followUps: [
      {
        q: "Two people type in the same spot at the same instant. Walk me through it.",
        a: "Each client applies its own keystroke locally and immediately, because typing cannot wait for a round trip, and sends the operation tagged with the version it was based on. The server establishes a total order — whichever arrives first is applied as-is — and the second operation is reconciled against what it did not see: under operational transformation its position index is adjusted for the characters inserted before it, and under a CRDT no adjustment is needed at all because the insert names its neighbouring character ids rather than an index. The server then broadcasts the result, and each client transforms it against its own still-unacknowledged operations before applying. Both intentions survive and everyone converges on identical text.",
      },
      {
        q: "Operational transformation or CRDT?",
        a: "It depends on two constraints. Operational transformation keeps the document as plain text with no per-character metadata, which matters for large documents and for rich text where the semantics of overlapping formatting are well understood — it is what Google Docs actually uses. Its weaknesses are that the transformation functions must be correct for every pair of operation types, which is famously easy to get subtly wrong, and that it really wants a central server, making offline and peer-to-peer awkward. CRDTs give convergence as a property of the data structure rather than of your transform code, and they merge offline edits trivially, at the cost of per-character identifiers and tombstones that inflate memory several times over. If offline editing is a requirement I would choose a CRDT; if document size and mature rich-text handling dominate, operational transformation.",
      },
      {
        q: "Why does everyone editing one document connect to the same server?",
        a: "Because it turns a distributed consensus problem into a local one. Concurrent editing needs a total order over operations, and if two servers both held the document they would have to agree on that order for every keystroke — real distributed coordination on the hot path. Since a document typically has only a handful of editors, all of them can connect to one server that holds the document in memory and orders operations trivially. Routing is therefore sticky per document. The cost is that a server failure disconnects everyone on that document, but recovery is quick: clients reconnect to a new server which rebuilds from the latest snapshot plus subsequent operations, and clients resend anything unacknowledged, deduplicated by client sequence number.",
      },
      {
        q: "Someone edits offline for an hour, then reconnects. What happens?",
        a: "Both sides exchange what the other missed, and nothing is discarded — the user's expectation is that everything they typed survives, so any resolution that picks one side is wrong. With a CRDT this is genuinely straightforward: operations commute, so applying an hour of remote operations and an hour of local ones in any order produces the same document. With operational transformation it is correct in principle but painful in practice, because each of the client's operations must be transformed against every operation that occurred while it was away, which is both expensive and the most bug-prone part of the approach. This case is the strongest practical argument for CRDTs, and it also complicates tombstone collection, since deletions cannot be safely garbage-collected while a peer that has not acknowledged them might still return.",
      },
      {
        q: "How do you show other people's cursors?",
        a: "As a completely separate channel with different rules. Presence is high-frequency, entirely disposable and must never be persisted or allowed to slow the edit path — dropping a cursor update is harmless, dropping an operation is not. Updates are throttled to a few per second rather than sent per mouse movement, and a cursor expires by TTL when a client disappears, since a closed tab never sends a goodbye. The one detail that trips people up is that a remote cursor position must be transformed exactly like an operation: if text is inserted above it, the stored index is stale and the cursor drifts to visibly the wrong place. So presence is separate in delivery and durability but shares the same positional reconciliation.",
      },
    ],
    related: [
      "/examples/zoom",
      "/examples/google-drive",
      "/hld/websockets",
      "/hld/consistency",
      "/examples/chat",
    ],
    furtherReading: [
      {
        label: "CRDTs — a comprehensive study (Shapiro et al.)",
        href: "https://inria.hal.science/inria-00555588/document",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "google-search",
    title: "Design Google Search",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 24,
    tags: ["index", "ranking", "crawl", "sharding", "inverted index"],
    companies: ["Google", "Bing", "Elasticsearch", "Brave Search"],
    summary:
      "Two systems joined by one artefact. Offline, a crawler and indexer turn the web into an inverted index; online, a query fans out to every shard, each returns its best candidates, and a ranker merges them — all in about two hundred milliseconds. The shape worth understanding is that the index is sharded by document rather than by term, because the obvious alternative concentrates every common word onto one machine.",
    clarifying: [
      {
        q: "Web-scale, or a bounded corpus?",
        a: "Web-scale — tens of billions of documents. That matters because it rules out anything requiring a single machine to hold the index and makes shard fan-out the defining pattern.",
      },
      {
        q: "How fresh must results be?",
        a: "Tiered. News and social content within minutes, ordinary pages within days. A single freshness target would be either ruinously expensive or useless, so the crawl and index pipelines are split by tier.",
      },
      {
        q: "What latency budget?",
        a: "Around two hundred milliseconds end to end. Since every query touches every shard, that budget is really a tail-latency requirement — the slowest shard determines the response.",
      },
      {
        q: "Do we need personalisation?",
        a: "Lightly. I would treat it as re-ranking a shared candidate set rather than a personalised index, exactly as with autocomplete, so the expensive retrieval stage stays cacheable and shared.",
      },
      {
        q: "Is ranking quality in scope?",
        a: "I will cover the structure — retrieval, then scoring, with signals from content, links and behaviour — without pretending to reproduce a system thousands of people work on. The architecture question is where ranking sits, not what the model contains.",
      },
    ],
    requirements: {
      functional: [
        "Crawl and index a very large corpus continuously",
        "Return ranked results for a query, with snippets",
        "Support phrase queries and basic operators",
        "Refresh rapidly-changing content within minutes",
      ],
      nonFunctional: [
        "Query latency around 200 ms at p99",
        "Availability over completeness — a partial result beats an error",
        "Index updates continuously without interrupting serving",
        "Cost per query low enough to be free to the user",
      ],
    },
    math: [
      {
        label: "Corpus size",
        expr: "~50 B documents × ~10 KB text",
        result: "≈ 500 TB of text",
        note: "The inverted index is a fraction of this, but still far beyond one machine.",
      },
      {
        label: "Index size",
        expr: "~30% of text, compressed",
        result: "≈ 100–150 TB",
        note: "Which at ~100 GB per shard means on the order of a thousand shards, each replicated.",
      },
      {
        label: "Fan-out per query",
        expr: "1 query → every shard",
        result: "≈ 1,000 parallel requests",
        note: "The defining cost. It is why tail latency, not average latency, is the engineering problem.",
      },
      {
        label: "Tail latency effect",
        expr: "p99 per shard = 100 ms, 1,000 shards",
        result: "≈ certainty one shard is slow",
        note: "With a thousand parallel calls, the 99th percentile of one becomes the common case overall.",
      },
      {
        label: "Query volume",
        expr: "~100 K QPS",
        result: "×1,000 shards = 10⁸ shard reads/s",
        note: "Which is why caching popular queries matters enormously — a large fraction repeat.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/search?q={}&start={}",
        desc: "The query path — fan out, merge, rank, snippet",
      },
      {
        method: "GET",
        path: "/v1/internal/shards/{id}/search",
        desc: "Per-shard retrieval returning top-k local candidates with scores",
      },
      {
        method: "POST",
        path: "/v1/crawl/seed",
        desc: "Submit URLs for crawling; respects politeness and robots rules",
      },
      {
        method: "GET",
        path: "/v1/index/status",
        desc: "Which index generation is serving — a swap is a pointer change",
      },
      {
        method: "GET",
        path: "/v1/suggest?q={}",
        desc: "Autocomplete — a separate system with its own index",
      },
    ],
    dataModel: [
      {
        entity: "documents",
        fields: [
          "doc_id (pk, assigned at crawl)",
          "url (unique), content_hash",
          "crawled_at, last_modified",
          "quality_signals (jsonb)",
          "→ sharded by doc_id",
        ],
      },
      {
        entity: "inverted_index",
        fields: [
          "term (pk within shard)",
          "posting list: [doc_id, term_freq, positions[]]",
          "→ positions are what make phrase queries possible",
          "→ sharded BY DOCUMENT, not by term",
        ],
      },
      {
        entity: "link_graph",
        fields: ["from_doc, to_doc (pk)", "anchor_text", "→ feeds link-based authority scoring"],
      },
      {
        entity: "doc_store",
        fields: [
          "doc_id (pk)",
          "raw_text (compressed)",
          "→ read only for snippet generation, never during retrieval",
        ],
      },
    ],
    architecture: [
      {
        heading: "Shard by document, not by term",
        lede: "The decision that determines whether this works at all.",
        diagram: {
          kind: "compare",
          caption: "Both partition the index. Only one survives contact with real query traffic.",
          options: [
            {
              title: "Partition by term",
              sub: "each shard owns some words",
              good: [
                "A single-term query touches exactly one shard",
                "Posting lists are not split",
              ],
              bad: [
                "The shard holding a common word gets enormous load and an enormous list",
                "A multi-term query must ship whole posting lists between shards to intersect them",
                "Load is as skewed as word frequency, which is extremely skewed",
              ],
              verdict: "Appealing on a whiteboard, unusable in practice.",
            },
            {
              title: "Partition by document",
              sub: "each shard indexes a slice of the corpus",
              tone: "ok",
              good: [
                "Every shard handles every query over its own documents — perfectly even load",
                "Intersection happens locally; only top candidates cross the network",
                "Adding capacity is adding shards; documents redistribute naturally",
              ],
              bad: [
                "Every query touches every shard, so tail latency dominates",
                "Global term statistics must be computed separately",
              ],
              verdict: "The right answer, and the reason the system is a fan-out problem.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "The point to make",
          text: '"I would shard by document rather than by term. Term partitioning sounds efficient until you notice that the shard owning a common word receives a share of nearly every query and holds a posting list of billions of entries, and that multi-term queries would require shipping those lists across the network to intersect. Document partitioning gives even load and local intersection, at the cost of every query touching every shard — which makes tail latency the thing to engineer."',
        },
      },
      {
        heading: "The query path",
        lede: "Retrieve cheaply and broadly, then score expensively and narrowly.",
        diagram: {
          kind: "sequence",
          caption: "Two stages: high-recall retrieval, then precise ranking on a small set.",
          actors: [
            { id: "u", label: "User" },
            { id: "fe", label: "Front end" },
            { id: "sh", label: "~1,000 shards" },
            { id: "rk", label: "Ranker" },
            { id: "ds", label: "Doc store" },
          ],
          messages: [
            { from: "u", to: "fe", label: "1. query", kind: "call" },
            {
              from: "fe",
              to: "fe",
              label: "2. cache hit? a large share repeat",
              kind: "self",
              tone: "ok",
            },
            {
              from: "fe",
              to: "sh",
              label: "3. fan out — parse, expand, scatter",
              kind: "call",
              tone: "accent",
            },
            {
              from: "sh",
              to: "fe",
              label: "4. each returns local top-k with scores",
              kind: "return",
            },
            {
              from: "fe",
              to: "fe",
              label: "5. merge; drop stragglers past the deadline",
              kind: "self",
              tone: "warn",
            },
            { from: "fe", to: "rk", label: "6. rank the merged few hundred", kind: "call" },
            {
              from: "rk",
              to: "ds",
              label: "7. fetch text for snippets — top 10 only",
              kind: "call",
            },
            { from: "fe", to: "u", label: "8. results in ~200 ms", kind: "return", tone: "ok" },
          ],
        },
        bullets: [
          "Each shard returns only its best few candidates rather than everything that matches, so the network carries hundreds of results rather than millions.",
          "Expensive ranking runs once on the merged candidate set, never per shard. Keeping retrieval cheap and ranking narrow is what makes the latency budget achievable.",
          "Snippets are generated only for the results actually shown, because extracting a relevant passage requires reading the document text — far too expensive to do for every candidate.",
          "Query caching is unusually effective here because query frequency is extremely skewed, and a cached result for a popular query costs nothing.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Tail latency is the real engineering problem",
        lede: "With a thousand parallel calls, the rare slow response becomes the normal case.",
        table: {
          caption: "Techniques for surviving fan-out, in rough order of value.",
          headers: ["Technique", "How it helps", "Cost"],
          rows: [
            [
              "Deadline and partial results",
              "Return without stragglers",
              "Slightly incomplete results",
            ],
            [
              "Hedged requests",
              "Send a duplicate to a replica after a short delay",
              "A few percent extra load",
            ],
            [
              "Replica selection by health",
              "Avoid a shard replica that is degrading",
              "Health tracking per replica",
            ],
            [
              "Tiered indexes",
              "Search a small high-quality tier first",
              "Extra index to build and maintain",
            ],
            [
              "Query caching",
              "Popular queries never fan out",
              "Staleness; cache invalidation on index swap",
            ],
          ],
        },
        bullets: [
          "Returning results without one shard is almost always better than being slow: a missing handful of candidates from one slice of the corpus is imperceptible, while an extra second is not.",
          "Hedging is remarkably effective — issuing a second request to a different replica after waiting a short time converts a rare slow response into a normal one for a small amount of extra load.",
          "A tiered index is the biggest structural win: most queries are satisfied by a small tier of high-quality documents, so the full corpus is searched only when that tier does not produce enough good results.",
          "Because completeness is already approximate, the system can be honest about it internally — partial results are a normal operating mode rather than an error condition.",
        ],
        callout: {
          kind: "insight",
          text: "This is the clearest example in the catalogue of why tail latency matters more than average. Each shard can be fast on average and the overall p99 still be dominated by whichever of a thousand shards happened to be garbage-collecting, rebalancing or sharing a machine with a noisy neighbour. Any system that fans out widely has this property, and the defences — deadlines, hedging, health-aware replica choice — are the same everywhere.",
        },
      },
      {
        heading: "Building the index",
        body: [
          "The offline half is a pipeline: crawl, parse, deduplicate, extract signals, build postings, and publish a new generation. It is a batch system with a streaming fast path for fresh content.",
        ],
        bullets: [
          "Crawling must be polite — respecting robots rules and rate-limiting per host — and prioritised, since recrawling everything uniformly wastes most of the budget on pages that never change.",
          "Deduplication is essential: a large share of the web is near-duplicate, and techniques like shingling with minhash identify near-duplicates so the index is not full of the same content.",
          "Index generations are immutable and published atomically, with serving nodes swapping a pointer — the same pattern as the autocomplete snapshot, and it gives clean rollback.",
          "Fresh content cannot wait for a full rebuild, so a small real-time index is searched alongside the main one and merged at query time, which is again the same shape as the trending overlay in autocomplete.",
        ],
      },
      {
        heading: "Ranking, in structure rather than detail",
        body: [
          "Ranking is where the product lives, and the architectural question is where it sits rather than what is inside it. The stable answer is a cheap, high-recall retrieval stage followed by progressively more expensive scoring on progressively fewer documents.",
        ],
        table: {
          caption: "Signals by family, and what each is vulnerable to.",
          headers: ["Family", "Examples", "Weakness"],
          rows: [
            ["Text relevance", "Term frequency, field weighting, proximity", "Keyword stuffing"],
            ["Link authority", "Link graph scoring, anchor text", "Link farms and purchased links"],
            [
              "Behavioural",
              "Click-through, dwell time, reformulation",
              "Position bias; needs careful normalisation",
            ],
            [
              "Freshness",
              "Recency where the query implies it",
              "Over-weighting harms evergreen queries",
            ],
            [
              "Quality",
              "Spam classifiers, site-level reputation",
              "Adversarial and constantly shifting",
            ],
          ],
        },
        bullets: [
          "Retrieval optimises recall and ranking optimises precision. Merging the two — trying to be precise during retrieval — is how latency budgets are blown.",
          "Behavioural signals carry a feedback loop: results shown at the top get clicked because they are at the top, so click data must be normalised by position before it means anything.",
          "Spam is adversarial, which makes this different from most ranking problems — every signal that works becomes a target, so the defence has to keep moving.",
          "Query understanding sits before retrieval: spelling correction, synonym expansion and intent classification change what is retrieved and often matter more than the scoring that follows.",
        ],
      },
      {
        heading: "What is genuinely reusable here",
        body: [
          "Nobody is building this, but several patterns in it recur constantly and are worth extracting explicitly.",
        ],
        bullets: [
          "Scatter-gather with deadlines and hedging applies to any system that fans out — it is the same reasoning whether there are ten shards or a thousand.",
          "Immutable index generations swapped atomically appear in autocomplete, search and recommendation systems alike, and give safe rollback for free.",
          'A batch-built index with a small real-time overlay merged at query time is the recurring answer to "correct but slow" versus "fresh but partial".',
          "Two-stage retrieval then ranking is the standard structure of every search and recommendation system, and keeping the stages separate is what keeps both affordable.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Shard by document",
        pickWhen: "Always at web scale",
        cost: "Every query touches every shard, making tail latency the problem",
      },
      {
        choice: "Deadline with partial results",
        pickWhen: "Always",
        cost: "Occasionally a shard's candidates are missing",
      },
      {
        choice: "Hedged requests",
        pickWhen: "Tail latency matters more than a little extra load",
        cost: "A few percent more traffic",
      },
      {
        choice: "Tiered index",
        pickWhen: "Most queries are satisfiable from a small high-quality subset",
        cost: "An extra index to build, maintain and keep consistent",
      },
      {
        choice: "Immutable index generations",
        pickWhen: "Always",
        cost: "Full rebuilds are expensive; needs a fresh overlay for new content",
      },
      {
        choice: "Personalisation as re-ranking",
        pickWhen: "Some personalisation is wanted",
        cost: "Personalised responses cannot be shared by the query cache",
      },
    ],
    wrapUp: [
      "Two systems joined by an immutable index: an offline crawl-and-build pipeline, and an online fan-out query path.",
      "Shard by document rather than by term — term partitioning concentrates common words onto one machine and forces posting lists across the network to intersect.",
      "Because every query touches every shard, tail latency is the engineering problem, and the defences are deadlines with partial results, hedged requests and health-aware replica selection.",
      "Retrieval is cheap and high-recall; ranking is expensive and narrow. Each shard returns only its local best, and expensive scoring runs once on the merged set.",
      "Index generations are immutable and swapped atomically, with a small real-time index merged at query time for content that cannot wait for a rebuild.",
      "Snippets are generated only for displayed results, because reading document text is far too expensive to do for every candidate.",
    ],
    followUps: [
      {
        q: "Why not shard the index by term?",
        a: "Because term frequency is extremely skewed, and the shard that owns a common word would receive a share of nearly every query while holding a posting list of billions of entries — an immediate hotspot that no amount of replication fixes cleanly. Worse, a multi-term query needs the intersection of several posting lists that now live on different machines, so you would have to ship enormous lists across the network just to compute it. Sharding by document inverts both problems: every shard runs the whole query against its own slice of the corpus, load is naturally even because documents are distributed evenly, and the intersection happens locally so only a handful of top candidates cross the network. The price is that every query touches every shard, which makes tail latency the thing you engineer against.",
      },
      {
        q: "With a thousand shards per query, how do you hit 200 milliseconds?",
        a: "By accepting that some shards will be slow and designing for it rather than trying to make every shard fast. With a thousand parallel calls, even a one-percent chance of a slow response means almost every query has one — so there is a deadline, and results are merged from whatever has returned when it expires. Losing one shard's candidates out of a thousand is imperceptible to the user, while an extra second is not. On top of that, hedged requests help enormously: after waiting a short time, send a duplicate request to a different replica and take whichever answers first, which converts rare slow responses into normal ones for a few percent extra load. Replica selection that avoids recently-degraded nodes, and a tiered index that satisfies most queries from a small high-quality subset, do the rest.",
      },
      {
        q: "How does a newly published page get into the index?",
        a: "Not by waiting for the next full rebuild, which would take far too long for anything time-sensitive. The crawl is tiered by how quickly a source changes, so news and frequently-updated sites are recrawled on a short cycle, and freshly crawled documents go into a small real-time index that is searched alongside the main one and merged at query time. The main index is rebuilt as immutable generations published atomically, with serving nodes swapping a pointer — the same pattern as the autocomplete snapshot, and it gives clean rollback. It is worth noticing that this batch-plus-overlay structure is the same answer as the trending layer in autocomplete and the streaming-plus-batch reconciliation in ad-click aggregation: a correct slow path and a fresh fast path, merged at read time.",
      },
      {
        q: "Why generate snippets separately instead of storing them with the index?",
        a: "Because a snippet depends on the query, not just on the document. The point of the snippet is to show the passage containing the user's terms, so a stored summary would be wrong for most queries, and storing a snippet per document per possible query is obviously impossible. Generating one requires reading the document text and locating the matching passage, which is far too expensive to do for every candidate — which is exactly why it happens last, on the ten results actually displayed, after ranking has narrowed the set. It is a good illustration of the general shape of the query path: each stage handles fewer documents and can therefore afford to do more per document.",
      },
      {
        q: "Where does ranking fit, and why not rank inside the shards?",
        a: "The shards do rank, but only cheaply and only locally — each returns its best few candidates with scores, which is enough to decide what is worth sending back. The expensive ranking runs once, on the merged few hundred candidates, in the front end. Pushing full ranking into the shards would mean running an expensive model a thousand times per query instead of once, and it still would not work, because good ranking needs global information — corpus-wide term statistics, cross-shard comparability of scores — that no individual shard has. The general structure is two-stage: retrieval optimises recall cheaply and broadly, ranking optimises precision expensively and narrowly, and keeping them separate is what makes both affordable. Every large search and recommendation system is shaped this way.",
      },
    ],
    related: [
      "/examples/web-crawler",
      "/examples/autocomplete",
      "/hld/sharding",
      "/examples/email-service",
      "/hld/caching",
    ],
    furtherReading: [
      {
        label: "The anatomy of a large-scale hypertextual web search engine",
        href: "http://infolab.stanford.edu/~backrub/google.html",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
