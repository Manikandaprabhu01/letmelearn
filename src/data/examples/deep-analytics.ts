import type { DesignExample } from "@/data/types";

export const analyticsDeepExamples: DesignExample[] = [
  {
    slug: "ad-click",
    title: "Design Ad Click Event Aggregation",
    source: "Volume 2",
    chapter: 6,
    difficulty: "advanced",
    minutes: 24,
    tags: ["streaming", "ads", "windowing", "exactly-once", "watermarks"],
    companies: ["Google Ads", "Meta Ads", "Criteo", "The Trade Desk"],
    summary:
      "Counting is trivial until the count is money. Advertisers are billed from these numbers, so the aggregation has to be correct under retries, late-arriving events, out-of-order delivery and fraud — and it has to answer queries over a hundred billion rows a day in under a second. The interesting content is watermarks, the reconciliation between a fast approximate path and a slow correct one, and the honest limits of exactly-once.",
    clarifying: [
      {
        q: "What is this data used for — dashboards or billing?",
        a: "Billing, which raises the bar enormously. A dashboard can be a few percent off and nobody minds; an invoice cannot. That means the design needs a reprocessable audit trail and a reconciliation story, not just a stream job.",
      },
      {
        q: "How late can events arrive?",
        a: "Minutes normally, hours in the tail — a phone that logged a click offline and reconnected the next morning is a real case. Where the cutoff sits is a business decision, and I would push to have it stated explicitly rather than implied by whatever the pipeline happens to do.",
      },
      {
        q: "What query latency and granularity does the serving side need?",
        a: "Sub-second for dashboards, with breakdowns by advertiser, campaign, region and time. That is an OLAP problem — pre-aggregated rollups rather than scanning raw events.",
      },
      {
        q: "Do we need to deduplicate clicks?",
        a: "Yes, on two levels. Delivery duplicates from retries are an infrastructure concern solved by idempotency; fraudulent or repeated clicks by the same user are a business rule, and conflating the two is a common mistake.",
      },
      {
        q: "Is the data ever restated after the fact?",
        a: "Yes — fraud detection invalidates clicks retrospectively, sometimes days later. So aggregates cannot be treated as immutable once written, and the design needs a path to recompute a window and correct what was already reported.",
      },
    ],
    requirements: {
      functional: [
        "Ingest click events at very high volume without loss",
        "Aggregate counts per advertiser, campaign and minute",
        "Serve breakdowns and time series for dashboards in under a second",
        "Support recomputation of a window after fraud filtering or a bug fix",
      ],
      nonFunctional: [
        "No lost events — this is billing data",
        "Correct under retries, out-of-order and late arrival",
        "Near-real-time visibility (seconds to a minute) for campaign pacing",
        "Auditable: it must be possible to explain how any number was produced",
      ],
    },
    math: [
      {
        label: "Event volume",
        expr: "1 M clicks/s peak × ~200 B",
        result: "≈ 200 MB/s, 100 B events/day",
        note: "Impressions are 10–100× higher again; clicks are the expensive-to-get-right subset.",
      },
      {
        label: "Raw retention",
        expr: "100 B/day × 200 B × 30 days",
        result: "≈ 600 TB compressed",
        note: "Kept because billing disputes and reprocessing both require replaying the original events.",
      },
      {
        label: "Aggregate size",
        expr: "1 M campaigns × 1,440 min × ~50 B",
        result: "≈ 72 GB/day",
        note: "Three orders of magnitude smaller than raw. This is what the serving layer actually queries.",
      },
      {
        label: "Query fan-out avoided",
        expr: "scan 100 B rows vs read pre-aggregated minutes",
        result: "≈ 10⁵× less work",
        note: "A dashboard for a month reads ~43,000 rollup rows instead of three trillion events.",
      },
      {
        label: "Late-arrival tail",
        expr: "typical distribution of event lateness",
        result: "~99% within 5 min, ~99.9% within 1 h",
        note: "The last 0.1% is what makes watermark and cutoff policy a business decision rather than a technical one.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/events/clicks",
        desc: "Ingest — {eventId, adId, campaignId, userId, ts, context}; eventId is client-generated for dedup",
      },
      {
        method: "GET",
        path: "/v1/reports?campaign={}&from={}&to={}&groupBy=minute",
        desc: "Time series from rollups, sub-second",
      },
      {
        method: "GET",
        path: "/v1/reports/breakdown?campaign={}&dim=region",
        desc: "Slice by dimension; served from a pre-aggregated cube",
      },
      {
        method: "POST",
        path: "/v1/reprocess",
        desc: "Recompute a window from raw events — the correction path after fraud filtering",
      },
      {
        method: "GET",
        path: "/v1/reports/{id}/lineage",
        desc: "Which pipeline version and input offsets produced this number — required for disputes",
      },
    ],
    dataModel: [
      {
        entity: "raw_events",
        fields: [
          "event_id (pk, client-generated)",
          "ad_id, campaign_id, advertiser_id",
          "user_id, ip_hash, user_agent",
          "event_ts (when it happened), ingest_ts (when we saw it)",
          "→ append-only in the log and object storage; the source of truth",
        ],
      },
      {
        entity: "minute_rollups",
        fields: [
          "campaign_id, minute (pk)",
          "clicks, unique_users (HLL sketch)",
          "spend_micros",
          "version (int — bumped on recompute)",
          "→ the serving table",
        ],
      },
      {
        entity: "dedup_index",
        fields: [
          "event_id (pk)",
          "seen_at",
          "TTL ≈ 24 h",
          "→ bounded window; beyond it, dedup falls to the batch layer",
        ],
      },
      {
        entity: "corrections",
        fields: [
          "campaign_id, minute (pk)",
          "delta_clicks, reason (fraud|bug|late)",
          "applied_at",
          "→ restatements are recorded, never silently overwritten",
        ],
      },
    ],
    architecture: [
      {
        heading: "Event time is not arrival time",
        lede: "Every hard problem in this design comes from that one gap.",
        diagram: {
          kind: "compare",
          caption: "Which clock you aggregate by decides what the numbers mean.",
          options: [
            {
              title: "Processing time",
              sub: "bucket by when we received it",
              good: [
                "Trivial — no buffering, no waiting",
                "Windows close immediately and deterministically",
              ],
              bad: [
                "A network blip moves clicks into the wrong minute",
                "Replaying history produces completely different numbers",
                "Meaningless for billing, which is about when the user clicked",
              ],
              verdict: "Acceptable only for coarse operational monitoring.",
            },
            {
              title: "Event time",
              sub: "bucket by when the click happened",
              tone: "ok",
              good: [
                "Correct and stable — a replay reproduces identical results",
                "Matches what the advertiser is actually being billed for",
                "Out-of-order arrival does not corrupt the buckets",
              ],
              bad: [
                "A window can never be certain it is complete",
                "Requires watermarks, buffering and a late-data policy",
              ],
              verdict: "Mandatory for billing. The complexity is the price of correctness.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "State the core tension early",
          text: '"Aggregating by event time is the only defensible choice for billing, and it creates the central problem: you can never know a window is complete, only that it is probably complete. A watermark is an explicit, tunable guess about that — and the late-data policy that goes with it is a business decision about how much correctness you are willing to trade for timeliness."',
        },
      },
      {
        heading: "The pipeline",
        lede: "Durable log first, aggregation second, serving third — and raw events kept forever.",
        diagram: {
          kind: "system",
          caption: "The log is the source of truth; everything downstream is a derived view.",
          columns: [
            {
              title: "Ingest",
              nodes: [
                { id: "edge", label: "Edge collectors", sub: "accept fast, validate later" },
                { id: "log", label: "Durable log", sub: "partitioned by campaign", tone: "accent" },
                { id: "cold", label: "Object storage", sub: "raw, 30 days+" },
              ],
            },
            {
              title: "Aggregate",
              nodes: [
                { id: "dedup", label: "Dedup", sub: "event id, 24 h window" },
                { id: "win", label: "Windowed agg", sub: "1 min, event time" },
                { id: "hll", label: "Sketches", sub: "unique users" },
              ],
            },
            {
              title: "Serve",
              nodes: [
                { id: "olap", label: "OLAP store", sub: "rollups by dimension", tone: "ok" },
                { id: "api", label: "Report API", sub: "sub-second" },
                { id: "batch", label: "Nightly batch", sub: "recompute + reconcile" },
              ],
            },
          ],
        },
        bullets: [
          "The edge accepts events and writes them to the log with minimal validation. Rejecting a malformed event at ingest loses billing data; accepting it and quarantining it downstream does not.",
          "Partition the log by campaign so all events for a campaign are ordered and land on the same aggregator, which makes per-campaign windowing a local operation with no shuffle.",
          "Keep raw events in object storage independently of the log's retention. Reprocessing a month-old window after a fraud finding needs the originals, and a seven-day log retention will not have them.",
          "The aggregation output is a derived view that can always be rebuilt. That is what makes recomputation safe, and it is the main architectural reason to resist aggregating at the edge.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Watermarks and the late-data policy",
        lede: '"Probably complete" is the strongest guarantee available, so make it explicit.',
        code: {
          title: "A window closes on the watermark, not on the clock",
          lang: "ts",
          source: `// The watermark is an assertion: "I believe every event with event_ts below
// this has now arrived." It is derived from observed lateness, not from wall
// time — a stalled partition must hold the watermark back, or its events are
// silently declared late and dropped.
function advanceWatermark(partitions: Partition[]): number {
  // The MINIMUM across partitions. Taking the max would race ahead of the
  // slowest source and discard everything it later delivers.
  return Math.min(...partitions.map((p) => p.maxEventTs - ALLOWED_LATENESS_MS));
}

function onEvent(e: ClickEvent, state: WindowState) {
  const window = floorToMinute(e.eventTs);

  if (window < state.watermark) {
    // Late. NOT silently dropped: emit a correction against the closed window
    // and record it, so the restatement is visible and auditable.
    return emitCorrection(window, e);
  }

  state.buffer(window, e);
}

// Windows are emitted when the watermark passes them, then kept in memory for
// an extra grace period so slightly-late events update them in place rather
// than becoming corrections.`,
        },
        table: {
          caption: "Where the cutoff goes is a business decision, not a default.",
          headers: ["Policy", "Effect", "Suits"],
          rows: [
            ["Drop anything late", "Clean, fast, understates the count", "Never, for billing"],
            [
              "Grace period, then correct",
              "Accurate, with visible restatements",
              "The right default",
            ],
            ["Accept indefinitely", "Numbers never final", "Impossible to invoice against"],
            [
              "Hard cutoff at invoice time",
              "Final numbers, some events unbilled",
              "The commercial reality — state it explicitly",
            ],
          ],
        },
        bullets: [
          "A stalled or idle partition is the classic watermark bug. If the watermark is computed from the maximum event time seen, one slow source has its events declared late en masse; taking the minimum across partitions is what prevents it.",
          "Emit windows early and refine them. Advertisers need pacing data within seconds, so publish a provisional count on a short watermark and update it as the window settles.",
          'Every restatement should be recorded with a reason. "The number changed" is acceptable to an advertiser; "the number changed and we cannot say why" is not.',
          "Invoicing needs a hard cutoff regardless of what the pipeline would prefer. Naming that boundary — and the fact that a small tail of genuinely late events goes unbilled — is more honest than implying perfect accounting.",
        ],
      },
      {
        heading: "Deduplication, and what exactly-once really buys",
        body: [
          "Two distinct problems wear the same name. Delivery duplicates come from retries in the transport and are an infrastructure concern; repeated clicks by the same user are a business rule about what counts as a billable click. Solving the first does nothing for the second.",
        ],
        diagram: {
          kind: "flow",
          caption: "Two filters, two different justifications.",
          rows: [
            [
              { id: "in", label: "Incoming event", sub: "eventId, userId, adId" },
              { id: "d1", label: "Delivery dedup", sub: "seen this eventId?", tone: "accent" },
            ],
            [
              {
                id: "d2",
                label: "Business dedup",
                sub: "same user + ad within 30 s?",
                tone: "warn",
              },
              { id: "fraud", label: "Fraud scoring", sub: "async, retrospective" },
              { id: "count", label: "Counted", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "Delivery dedup uses a client-generated event id held for a bounded window — 24 hours covers essentially all retries, and the batch layer catches anything beyond it during recomputation.",
          "The dedup index must be bounded, or it grows without limit. A Bloom filter or a TTL'd key-value store is the right shape, accepting that the streaming layer is approximate and the batch layer is exact.",
          "Exactly-once within the pipeline is achievable — idempotent producers, transactional offset commits — but it stops at the pipeline boundary. The invoice is produced by a separate system, so the real guarantee is at-least-once ingestion plus idempotent aggregation.",
          "Fraud filtering is retrospective by nature, which is precisely why aggregates must be versioned and restatable rather than treated as final the moment a window closes.",
        ],
        callout: {
          kind: "warn",
          title: "The reconciliation is not optional",
          text: "A streaming layer that has been running for weeks will have drifted — a restart replayed a window, a deploy dropped a few seconds, a late partition was cut off. Running a nightly batch recomputation over the raw events and comparing it to the streaming output is what catches that. Without reconciliation the streaming numbers are plausible rather than known, and for billing data plausible is not enough.",
        },
      },
      {
        heading: "Serving a hundred billion rows",
        body: [
          "Nobody queries raw events. The serving layer is a set of pre-aggregated rollups along the dimensions people actually filter by, which turns a dashboard query from a distributed scan into a few thousand row reads.",
        ],
        table: {
          caption: "Rollup granularity is a storage-versus-flexibility trade.",
          headers: ["Rollup", "Rows/day", "Answers", "Cannot answer"],
          rows: [
            ["Campaign × minute", "~1.4 B", "Time series, pacing", "Which region drove the spike"],
            ["Campaign × region × hour", "~100 M", "Geographic breakdown", "Minute-level detail"],
            ["Campaign × creative × day", "~10 M", "Creative performance", "Intraday patterns"],
            ["Raw events", "100 B", "Anything", "Nothing in under a second"],
          ],
        },
        bullets: [
          "Pre-aggregate along the dimensions that are actually queried and keep raw events for everything else. Trying to build a cube over every dimension combination is a combinatorial explosion.",
          "Unique-user counts must be sketches — HyperLogLog — because they are not additive. Summing the unique users of two minutes double-counts anyone present in both, whereas HLL sketches merge correctly.",
          "Downsample as data ages: minute granularity for a week, hourly for a quarter, daily thereafter. Nobody dashboards last March at minute resolution.",
          "Roll up incrementally rather than recomputing a day at a time, so a correction to one minute updates the hour and the day by applying the delta rather than rescanning.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Event-time windowing",
        pickWhen: "Numbers are billed or compared across replays",
        cost: "Watermarks, buffering, and windows that are never provably complete",
      },
      {
        choice: "Emit early, refine later",
        pickWhen: "Pacing needs near-real-time visibility",
        cost: "Numbers visibly change, which requires explaining restatements",
      },
      {
        choice: "Streaming plus nightly batch reconciliation",
        pickWhen: "Billing data — always",
        cost: "Two pipelines computing the same thing, and drift to investigate",
      },
      {
        choice: "Bounded dedup window",
        pickWhen: "Retries are the dominant duplicate source",
        cost: "Duplicates older than the window rely on the batch layer",
      },
      {
        choice: "Pre-aggregated rollups",
        pickWhen: "Sub-second dashboards over enormous volume",
        cost: "Only the dimensions you chose in advance are fast",
      },
      {
        choice: "HLL sketches for uniques",
        pickWhen: "Unique counts across arbitrary time ranges",
        cost: "A couple of percent error, and a structure people find unintuitive",
      },
    ],
    wrapUp: [
      "The defining constraint is that these numbers are money, so the design is built around auditability and recomputation rather than around raw throughput.",
      "Aggregate by event time, not arrival time, and accept the consequence: a window is only ever probably complete, which is what watermarks make explicit and tunable.",
      "Keep raw events independently of log retention. Every correction — fraud, bug, late data — is a replay, and a derived aggregate that cannot be rebuilt is a liability.",
      "Separate delivery deduplication from business deduplication; they have different mechanisms and different justifications, and conflating them is a common error.",
      "Exactly-once holds inside the pipeline and stops at its boundary, so reconcile the streaming output against a batch recomputation rather than trusting it.",
      "Serving is pre-aggregated rollups along known dimensions, with sketches for non-additive measures like unique users.",
    ],
    followUps: [
      {
        q: "A click event arrives six hours late. What happens to it?",
        a: "Its window closed long ago, so it cannot simply be added to a running aggregate. The event is still recorded in the raw log — nothing is ever discarded at ingest — and the streaming layer emits it as a correction against the historical minute rather than dropping it or, worse, counting it in the current minute, which would be wrong in a way nobody would notice. The corrected aggregate gets a new version and the restatement is recorded with a reason. Whether the advertiser is actually billed depends on where the invoicing cutoff sits, and that is a commercial decision rather than a technical one — the honest position is that a small tail of very late events falls outside the billing period, and that should be stated rather than implied.",
      },
      {
        q: "Why not just aggregate by the time you received the event?",
        a: "Because the numbers would stop meaning anything. A network delay or a consumer restart would shift clicks into a different minute, so a spike in the chart could reflect an infrastructure hiccup rather than user behaviour, and re-running the pipeline over the same data would produce different results — which makes disputes impossible to resolve. Billing is about when the user clicked, so event time is the only defensible basis. The price is that you can never be certain a window is complete, which is exactly what a watermark encodes: an explicit, tunable assertion that events below a given event time have probably all arrived, plus a stated policy for what happens to the ones that have not.",
      },
      {
        q: "How do you make sure a click is not counted twice?",
        a: "It depends which duplicate is meant, and separating the two is most of the answer. Delivery duplicates come from retries — the client resent because an acknowledgement was lost, or a consumer reprocessed after a crash — and are handled by a client-generated event id checked against a bounded dedup index, typically a day's worth, with the batch layer catching anything older during recomputation. Business duplicates are a different question entirely: the same user clicking the same ad three times in ten seconds is one billable click by policy, not by infrastructure, and that rule lives in the aggregation logic. Fraud is a third layer again, scored asynchronously and applied retrospectively, which is why aggregates have to be versioned and restatable rather than final.",
      },
      {
        q: "Your streaming job has been running for three weeks. How do you know the numbers are right?",
        a: "You do not, unless you check — which is why a batch reconciliation pass is part of the design rather than an optional extra. A long-running stream job accumulates drift from restarts that replayed a window, deploys that lost a few seconds, partitions whose watermark advanced past events that were still coming, and simple bugs. So a nightly job recomputes the same windows from the raw events in object storage and compares them against what streaming produced; differences above a threshold are alerted and the batch result becomes authoritative for billing. This is the practical version of the lambda architecture argument: the fast path gives timeliness, the slow path gives correctness, and reconciliation is what converts plausible numbers into known ones.",
      },
      {
        q: "Can you count unique users per campaign by summing the per-minute uniques?",
        a: "No, and this is a genuinely common mistake. Uniqueness is not additive — a user who clicks in three different minutes appears in all three per-minute counts, so summing them triples them. Storing the exact set of user ids per minute would be correct but enormous at this volume. The right structure is a HyperLogLog sketch per minute: a few kilobytes each, mergeable across any set of minutes to give the unique count over an arbitrary range, at a couple of percent error. That error is entirely acceptable for a reach metric, and it is worth flagging the distinction explicitly — click counts are exact because they are billed, while unique-user counts are approximate because they are not.",
      },
    ],
    related: [
      "/examples/distributed-mq",
      "/examples/metrics",
      "/hld/message-queues",
      "/hld/idempotency",
      "/hld/bloom-filters",
    ],
    furtherReading: [
      {
        label: "Streaming 101 — Akidau on event time and watermarks",
        href: "https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/",
      },
      {
        label: "The Dataflow Model (VLDB)",
        href: "https://research.google/pubs/pub43864/",
      },
    ],
  },

  {
    slug: "metrics",
    title: "Design a Metrics Monitoring System",
    source: "Volume 2",
    chapter: 5,
    difficulty: "intermediate",
    minutes: 22,
    tags: ["observability", "tsdb", "cardinality", "alerting", "pull vs push"],
    companies: ["Prometheus", "Datadog", "Google Borgmon", "Grafana"],
    summary:
      "A time-series database plus a collection protocol plus an alerting engine — and the thing that actually kills these systems in production is none of those. It is cardinality: one engineer adding a user id as a label turns a thousand series into ten million overnight and takes the monitoring system down, usually during the incident it was supposed to help with. The design is mostly about making that failure bounded.",
    clarifying: [
      {
        q: "Metrics only, or logs and traces as well?",
        a: "Metrics only. They are numeric, regular and aggressively compressible, which is what makes a purpose-built time-series store worthwhile; logs and traces have completely different storage and query characteristics and belong in different systems.",
      },
      {
        q: "Pull or push collection?",
        a: "Pull by default, because it gives free health checking and makes the collector the authority on what exists. Push is necessary for short-lived jobs and anything behind a firewall, so in practice you need both and a gateway to bridge them.",
      },
      {
        q: "What resolution and retention?",
        a: "Ten-second resolution for two weeks, downsampled to a minute for a quarter and to five minutes for a year. Retention at full resolution is what drives storage cost, and downsampling is not optional at any real scale.",
      },
      {
        q: "How many distinct time series?",
        a: "This is the question that matters most. I would design for tens of millions with a hard ceiling and enforcement, because unbounded cardinality is the failure mode of every system in this category.",
      },
      {
        q: "Must alerting survive the monitored system failing?",
        a: "Yes, and it has to be independent. Monitoring that shares infrastructure with what it monitors goes down at exactly the moment it is needed, so alert evaluation and delivery need their own failure domain.",
      },
    ],
    requirements: {
      functional: [
        "Collect numeric time series from thousands of targets",
        "Store them efficiently with configurable retention and downsampling",
        "Query by metric name and label selectors, with aggregation over time and dimensions",
        "Evaluate alert rules continuously and route notifications",
      ],
      nonFunctional: [
        "Ingest millions of samples per second",
        "Dashboard queries in under a second for typical ranges",
        "Alerting must keep working when the monitored systems are failing",
        "A cardinality explosion must degrade one tenant, not the whole system",
      ],
    },
    math: [
      {
        label: "Sample rate",
        expr: "10 M series ÷ 10 s scrape interval",
        result: "≈ 1 M samples/s",
        note: "The dominant write load, and it is perfectly regular — which is what makes the compression below possible.",
      },
      {
        label: "Naive storage",
        expr: "1 M/s × 16 B (ts + float) × 86,400",
        result: "≈ 1.4 TB/day",
        note: "Unaffordable at multi-week retention, and the reason a generic database is the wrong tool here.",
      },
      {
        label: "With delta-of-delta + XOR",
        expr: "~1.4 B/sample achieved by Gorilla-style encoding",
        result: "≈ 120 GB/day",
        note: "More than a 10× reduction. Timestamps are near-constant intervals and values change little, so both compress extremely well.",
      },
      {
        label: "Cardinality blow-up",
        expr: "1 metric × 5 labels, one of which is user_id",
        result: "1,000 → 10,000,000 series",
        note: "The single most common outage in this class of system, and it arrives as a one-line code change.",
      },
      {
        label: "Query cost",
        expr: "2-week range at 10 s = 120,960 points/series",
        result: "×1,000 series ≈ 121 M points",
        note: "Which is why dashboards read downsampled data rather than raw resolution.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/metrics (on each target)",
        desc: "Exposition endpoint the collector scrapes — the target does no bookkeeping",
      },
      {
        method: "POST",
        path: "/v1/write",
        desc: "Push path for short-lived jobs and firewalled sources, via a gateway",
      },
      {
        method: "GET",
        path: "/v1/query?q={selector}&time={}",
        desc: "Instant query at a point in time",
      },
      {
        method: "GET",
        path: "/v1/query_range?q={}&start={}&end={}&step={}",
        desc: "Range query for dashboards; step drives which downsample tier is read",
      },
      {
        method: "POST",
        path: "/v1/rules",
        desc: "Alert and recording rules, evaluated continuously",
      },
      {
        method: "GET",
        path: "/v1/series?match={}",
        desc: "Series metadata — also how cardinality is audited",
      },
    ],
    dataModel: [
      {
        entity: "series",
        fields: [
          "series_id (pk, hash of name + sorted labels)",
          "metric_name (idx)",
          "labels (map)",
          "first_seen, last_seen",
          "→ the index; its size is the cardinality problem",
        ],
      },
      {
        entity: "samples",
        fields: [
          "series_id (pk)",
          "timestamp (pk)",
          "value (float64)",
          "→ stored as compressed chunks of ~2 h per series, not as rows",
        ],
      },
      {
        entity: "inverted_index",
        fields: [
          "label_name, label_value (pk)",
          "series_ids (posting list)",
          "→ how a selector resolves to a set of series",
        ],
      },
      {
        entity: "rules",
        fields: [
          "rule_id (pk)",
          "expr, for_duration, labels, annotations",
          "state (inactive|pending|firing)",
          "→ pending before firing is what suppresses flapping",
        ],
      },
    ],
    architecture: [
      {
        heading: "Pull versus push, and why you need both",
        lede: "The default should be pull, and the exceptions should be explicit.",
        diagram: {
          kind: "compare",
          caption: "Collection model decides who owns the list of what exists.",
          options: [
            {
              title: "Pull (scrape)",
              sub: "the collector fetches /metrics on a schedule",
              tone: "ok",
              good: [
                "A failed scrape is itself a health signal — target down is free",
                "The collector controls rate, so a target cannot flood it",
                "Service discovery gives one authoritative inventory of targets",
              ],
              bad: [
                "Cannot reach targets behind NAT or a firewall",
                "Short-lived jobs may exit before they are ever scraped",
              ],
              verdict: "The right default for long-running services.",
            },
            {
              title: "Push",
              sub: "the target sends samples when it chooses",
              good: [
                "Works from anywhere, including batch jobs and edge devices",
                "Captures data from processes that finish in seconds",
              ],
              bad: [
                "A misbehaving client can overwhelm ingestion",
                '"Target is down" and "target stopped pushing" are indistinguishable',
                "No inventory — you only know about what has spoken",
              ],
              verdict:
                "Necessary for short-lived and unreachable sources; route it through a gateway.",
            },
          ],
        },
        bullets: [
          "Pull makes up-ness a first-class metric for free, which is genuinely valuable: with push you cannot distinguish a crashed process from a healthy idle one.",
          "Short-lived jobs push to a gateway that holds their last values for scraping, which keeps the collection model uniform rather than building two parallel pipelines.",
          'Service discovery is doing more work than it appears. It is what turns "metrics from whoever shows up" into "metrics from the 4,000 targets that should exist", and the gap between those two sets is often the most useful alert in the system.',
          "Scrape intervals should be jittered. Thousands of targets scraped on a synchronised ten-second boundary produce a sawtooth load pattern that is entirely self-inflicted.",
        ],
      },
      {
        heading: "Storage: why a time-series database exists",
        lede: "Regular timestamps and slowly-changing values compress far better than general data.",
        code: {
          title: "Gorilla-style encoding, which is most of the 10× win",
          lang: "ts",
          source: `// Timestamps arrive at near-constant intervals, so store the delta of the
// delta — usually zero, which costs a single bit.
//   t: 10:00:00, 10:00:10, 10:00:20, 10:00:30
//   deltas:        10s       10s       10s
//   delta-of-delta: 0         0        → 1 bit each
function encodeTimestamp(prev: number, prevDelta: number, ts: number) {
  const delta = ts - prev;
  const dod = delta - prevDelta;
  if (dod === 0) return writeBits(0b0, 1);        // the overwhelmingly common case
  if (dod >= -63 && dod <= 64) return writeBits(0b10, 2) + writeBits(dod, 7);
  return writeBits(0b1111, 4) + writeBits(dod, 32);
}

// Values usually change little, and consecutive floats share most of their
// bits. XOR them and store only the differing middle section.
function encodeValue(prev: number, value: number) {
  const xor = float64Bits(prev) ^ float64Bits(value);
  if (xor === 0n) return writeBits(0b0, 1);       // unchanged — one bit
  return writeControlBits() + writeMeaningfulBits(xor);
}

// Result: ~16 bytes per sample naively becomes ~1.4 bytes in practice.`,
        },
        bullets: [
          "Data is written as compressed chunks per series covering a couple of hours, not as individual rows. Recent chunks stay in memory and are appended to; closed chunks are immutable and flushed to disk.",
          "Immutable closed chunks make retention trivial — expiring old data is deleting whole files rather than running a delete query across billions of rows.",
          "A write-ahead log covers the in-memory head chunk, so a crash loses nothing despite most recent data not yet being on disk.",
          "Downsampling produces separate lower-resolution series, and the query layer picks a tier based on the requested step — a month-long dashboard should never touch ten-second data.",
        ],
        callout: {
          kind: "insight",
          text: "The reason a generic database is the wrong tool is not that it cannot store the data — it is that it cannot exploit the shape. Timestamps at fixed intervals and values that barely change are exactly the structure delta-of-delta and XOR encoding are built for, and that structural assumption is worth more than an order of magnitude in both storage and scan speed.",
        },
      },
    ],
    deepDives: [
      {
        heading: "Cardinality: the actual failure mode",
        lede: "Not throughput, not query speed — the number of distinct series.",
        diagram: {
          kind: "flow",
          caption: "Each label multiplies. One unbounded label is unbounded series.",
          rows: [
            [
              { id: "m", label: "http_requests_total", sub: "1 metric" },
              { id: "l1", label: "× method (5)", sub: "5 series" },
              { id: "l2", label: "× status (10)", sub: "50" },
            ],
            [
              { id: "l3", label: "× endpoint (20)", sub: "1,000", tone: "ok" },
              { id: "l4", label: "× user_id (10 M)", sub: "10,000,000,000", tone: "bad" },
            ],
          ],
        },
        table: {
          caption: "Whether a label is safe depends entirely on whether its values are bounded.",
          headers: ["Label", "Bounded?", "Verdict"],
          rows: [
            ["method, status_code", "Yes — a handful", "Fine"],
            ["endpoint (templated)", "Yes, if templated", "Fine — /users/{id}, never /users/12345"],
            ["pod name", "Bounded but churning", "Risky — every deploy creates new series"],
            ["user_id, session_id, request_id", "No", "Never. This is the outage"],
            ["error message text", "Effectively unbounded", "Never — that is what logs are for"],
          ],
        },
        bullets: [
          "Enforce limits at ingestion: a maximum number of series per metric and per tenant, rejecting new series beyond the ceiling rather than accepting them and falling over. Rejecting data is painful; losing the monitoring system during an incident is worse.",
          "Churn is as damaging as raw count. Labels containing pod names or container ids create a fresh set of series on every deploy, so the index grows continuously even though the live count looks stable.",
          "Make cardinality observable and attributable — top metrics by series count, per team. Teams cannot avoid a problem they cannot see, and the person who adds the label is rarely the person paged.",
          "The correct home for high-cardinality identifiers is logs or traces, where the storage model expects them. Saying that explicitly is better than trying to make metrics do a job they are structurally unsuited to.",
        ],
        callout: {
          kind: "warn",
          title: "The failure is self-reinforcing",
          text: "A cardinality explosion slows ingestion and queries, which slows alert evaluation, which delays or drops the alerts that would have told you what was happening. It reliably occurs during a deploy — because that is when the new label ships — so the monitoring system degrades at precisely the moment the deploy needs watching. Hard limits are the only reliable defence.",
        },
      },
      {
        heading: "Alerting that survives the outage",
        body: [
          "Alert evaluation is a query engine running rules on a schedule, but its operational requirements are the opposite of a dashboard's: it must be boringly reliable, independent of the systems it watches, and resistant to producing noise nobody reads.",
        ],
        bullets: [
          "A pending state before firing is what makes alerts usable. Requiring a condition to hold for several minutes eliminates the overwhelming majority of flapping without meaningfully delaying real incidents.",
          "Group, deduplicate and inhibit at the notification layer. One failed database causing four hundred service alerts is a paging failure, and suppressing dependents when a root-cause alert fires is what prevents it.",
          "Alert on symptoms rather than causes — error rate and latency as experienced by users, not CPU utilisation. Cause-based alerts fire constantly without corresponding to anything anyone needs to act on.",
          "The alerting path must not depend on the infrastructure it monitors. Separate failure domain, separate delivery path, and a dead-man's switch that fires when the monitoring system itself stops reporting.",
        ],
      },
      {
        heading: "Scaling out",
        body: [
          "A single instance handles a surprising amount — millions of series is well within reach on one large machine — and the honest answer often begins by saying so. Beyond that, the sharding model is functional rather than global.",
        ],
        table: {
          caption: "How these systems actually scale.",
          headers: ["Approach", "Mechanism", "Trade"],
          rows: [
            [
              "Vertical first",
              "One instance, lots of memory",
              "Simplest; genuinely sufficient for most deployments",
            ],
            [
              "Functional sharding",
              "Split by team or service",
              "Easy and effective; cross-shard queries need a federation layer",
            ],
            [
              "Hash sharding by series",
              "Series distributed across nodes",
              "Even load; every query becomes scatter-gather",
            ],
            [
              "Remote write to long-term store",
              "Local for recent, object storage for history",
              "Unlimited retention; slower historical queries",
            ],
            [
              "Replication by duplicate scraping",
              "Two instances scrape the same targets",
              "Simple HA; the two copies are never byte-identical",
            ],
          ],
        },
        bullets: [
          "Duplicate scraping is an unusually pragmatic HA model: two independent instances collect the same targets, and either can serve. They will disagree slightly because their scrapes are not simultaneous, which is fine for monitoring and would not be for billing.",
          "Recording rules precompute expensive aggregations on a schedule, which is the single most effective query optimisation available — a dashboard reads a precomputed series instead of aggregating thousands at render time.",
          "Long-term storage in object storage keeps the local instance's working set small while retaining history, at the cost of slower queries over old data.",
          "Per-tenant limits are what make multi-tenancy survivable. Without them, one team's cardinality incident is everyone's outage.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Pull-based collection",
        pickWhen: "Long-running services with service discovery",
        cost: "Needs a gateway for short-lived jobs and unreachable targets",
      },
      {
        choice: "Purpose-built time-series storage",
        pickWhen: "Always at this volume",
        cost: "A specialised system to operate; poor fit for non-numeric data",
      },
      {
        choice: "Hard cardinality limits",
        pickWhen: "Always",
        cost: "Data is rejected, and someone has to be told why",
      },
      {
        choice: "Downsampling",
        pickWhen: "Retention beyond a couple of weeks",
        cost: "Historical spikes are smoothed away and cannot be recovered",
      },
      {
        choice: "Functional sharding",
        pickWhen: "One instance is no longer enough",
        cost: "Cross-shard queries need federation and are slower",
      },
      {
        choice: "Duplicate scraping for HA",
        pickWhen: "Availability matters more than exact agreement",
        cost: "Replicas disagree slightly; unsuitable if numbers are billed",
      },
    ],
    wrapUp: [
      "Three components — collection, a time-series store, and alerting — but the thing that determines whether the system survives is cardinality control, not any of them.",
      "Pull is the better default because a failed scrape is itself a health signal and the collector controls the rate; push via a gateway covers short-lived and unreachable sources.",
      "Time-series storage earns its existence by exploiting structure: delta-of-delta timestamps and XOR'd values compress samples by more than ten times, and immutable chunks make retention a file deletion.",
      "One unbounded label is an outage, and it usually arrives during a deploy — so enforce hard limits at ingestion, make cardinality attributable, and send high-cardinality identifiers to logs where they belong.",
      "Alerting needs its own failure domain, a pending state to suppress flapping, grouping and inhibition to prevent alert storms, and a dead-man's switch for the monitoring system itself.",
      "Scale vertically first and say so; then shard functionally, precompute with recording rules, and push history to object storage.",
    ],
    followUps: [
      {
        q: "An engineer adds user_id as a metric label. What happens?",
        a: "The series count for that metric goes from perhaps a thousand to the number of users — potentially tens of millions — because every distinct label combination is its own time series. The index grows enormously, memory balloons, ingestion slows, queries slow, and alert evaluation falls behind, so the monitoring system degrades right when the deploy that introduced it needs watching. The defences are layered: hard per-metric and per-tenant series limits enforced at ingestion so new series are rejected rather than accepted into failure, dashboards showing top metrics by cardinality attributed to a team, and a clear rule that unbounded identifiers belong in logs or traces where the storage model expects them. It is worth stating that rejecting data is the correct choice here — losing some metrics beats losing the monitoring system.",
      },
      {
        q: "Why pull rather than push?",
        a: "Mainly because a failed scrape is itself a signal. With pull, the collector knows what targets should exist from service discovery, so a target that stops responding is immediately distinguishable from one that is healthy but idle — with push those two look identical, and you find out something died only when someone notices the absence. Pull also puts the collector in control of the rate, so a buggy client cannot flood ingestion, and it gives one authoritative inventory to compare against reality. The genuine limitations are short-lived jobs that exit before a scrape and targets behind a firewall, and the standard answer to both is a push gateway that holds the last values and is itself scraped, which keeps a single collection model rather than two pipelines.",
      },
      {
        q: "How do you store a million samples a second affordably?",
        a: "By exploiting how regular the data is. Timestamps arrive at near-constant intervals, so storing the delta between deltas is almost always zero and costs a single bit, and consecutive float values usually share most of their bits, so XOR-ing against the previous value and storing only the differing section costs very little. Together these take roughly sixteen bytes per sample down to under one and a half in practice. On top of that, samples are written as compressed chunks per series covering a couple of hours rather than as individual rows, with a write-ahead log protecting the in-memory head chunk. Closed chunks are immutable, which makes retention a matter of deleting whole files instead of running deletes across billions of rows.",
      },
      {
        q: "Your alerting fires 400 notifications for one database outage. What is wrong?",
        a: "The notification layer is missing grouping and inhibition, and probably the alerts are cause-based rather than symptom-based. Every service that depends on the database is independently detecting failure and paging, which is technically accurate and operationally useless — four hundred pages contain no more information than one and actively obscure the root cause. The fixes are to group related alerts into a single notification, to define inhibition rules so a firing root-cause alert suppresses its known dependents, and to alert primarily on user-visible symptoms like error rate and latency rather than on every internal cause. I would also make sure alerts have a pending period before firing, since a large fraction of noise in these systems is conditions that resolve within a minute.",
      },
      {
        q: "Can you run this on a single machine?",
        a: "For most organisations, yes, and I think saying so is a stronger answer than reflexively designing a cluster. A single well-provisioned instance handles millions of active series and a million samples a second, and the operational simplicity is worth a great deal for a system whose main job is to be reliable when everything else is not. When one instance is genuinely insufficient, the first move is functional sharding — split by team or service, which requires no data-level coordination — with a federation layer for the rare cross-shard query. Hash-sharding by series distributes load evenly but makes every query a scatter-gather, and remote write to object storage is the usual answer for long retention. For availability I would run two instances scraping the same targets rather than building replication, accepting that their numbers differ slightly.",
      },
    ],
    related: [
      "/hld/observability",
      "/examples/ad-click",
      "/hld/sharding",
      "/hld/rate-limiting",
      "/examples/distributed-mq",
    ],
    furtherReading: [
      {
        label: "Prometheus — storage internals",
        href: "https://prometheus.io/docs/prometheus/latest/storage/",
      },
      {
        label: "Gorilla: a fast, scalable, in-memory time series database (Facebook)",
        href: "https://www.vldb.org/pvldb/vol8/p1816-teller.pdf",
      },
    ],
  },

  {
    slug: "leaderboard",
    title: "Design a Real-time Gaming Leaderboard",
    source: "Volume 2",
    chapter: 10,
    difficulty: "intermediate",
    minutes: 18,
    tags: ["redis", "sorted sets", "ranking", "sharding", "games"],
    companies: ["Riot", "Epic", "Supercell", "Steam"],
    summary:
      "A sorted set answers this in four Redis commands, and the interview is about what happens after that. Ranking twenty million players is easy; ranking them when one player's score changes a thousand times a second, when the answer must be exact rather than approximate, and when a single key no longer fits on one node — that is where the design work is. The most useful move is noticing that the top hundred and a player's own rank are two different problems.",
    clarifying: [
      {
        q: "Global leaderboard, or segmented?",
        a: "Both, and it matters: a single global ranking is one hot key, while per-region, per-tier and per-friend-group boards partition naturally. Most games are mostly segmented, which makes the problem far more tractable than it first appears.",
      },
      {
        q: "Does a player need their exact rank, or approximately where they stand?",
        a: 'The most important question here. Exact rank for every player is expensive at scale; "top 3%" is cheap and is what the UI usually shows. I would design exact ranks for the top few thousand and percentile estimates below that.',
      },
      {
        q: "How often do scores change?",
        a: "Constantly during play — potentially thousands of updates per second overall, and repeated updates for the same active player. That argues for coalescing updates rather than treating each as a durable ranked write.",
      },
      {
        q: "Do boards reset?",
        a: "Yes — daily, weekly and per-season. Resets are a gift architecturally: a board with a known lifetime can live entirely in memory with an expiry, and history is an archive rather than a live index.",
      },
      {
        q: "What happens on ties?",
        a: "Needs an explicit rule, usually earliest-achieved wins. Ties are common with integer scores, and an unstable ordering that shuffles on every read is a visible bug.",
      },
    ],
    requirements: {
      functional: [
        "Update a player's score with low latency",
        "Return the top N players for a board",
        "Return a specific player's rank and the players around them",
        "Support daily, weekly and seasonal boards with resets",
      ],
      nonFunctional: [
        "Score update and top-N read in single-digit milliseconds",
        "Ranks consistent enough that a player never sees themselves move backwards after gaining points",
        "Deterministic tie-breaking",
        "A hot board must not take down the service",
      ],
    },
    math: [
      {
        label: "Score updates",
        expr: "5 M DAU × 20 score events ÷ 10⁵",
        result: "≈ 1,000/s, peak ~10,000/s",
        note: "Modest — this is well within one Redis instance, which is why the naive answer works longer than people expect.",
      },
      {
        label: "Sorted set memory",
        expr: "20 M members × ~70 B overhead",
        result: "≈ 1.4 GB",
        note: "Comfortably fits in memory. The ceiling is reached by board count and churn, not by a single board's size.",
      },
      {
        label: "Rank query cost",
        expr: "ZREVRANK on a skip list",
        result: "O(log N) ≈ 25 steps",
        note: "Effectively free. Exact rank is cheap per query; the problem is volume, not per-query cost.",
      },
      {
        label: "Top-N read",
        expr: "ZREVRANGE 0 99",
        result: "O(log N + 100)",
        note: "Cacheable for a second or two, which collapses the hottest query in the system to near zero cost.",
      },
      {
        label: "Board proliferation",
        expr: "daily × weekly × season × 50 regions × 10 tiers",
        result: "thousands of live keys",
        note: "The real scaling axis. Each is small; collectively they are what forces sharding by board.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/boards/{board}/scores",
        desc: "Submit or increment a score — idempotent per (player, match)",
      },
      {
        method: "GET",
        path: "/v1/boards/{board}/top?n=100",
        desc: "Leaderboard head; cached for ~1 s, the hottest read in the system",
      },
      {
        method: "GET",
        path: "/v1/boards/{board}/players/{id}",
        desc: "A player's rank, score and neighbours",
      },
      {
        method: "GET",
        path: "/v1/boards/{board}/around/{id}?range=5",
        desc: "The slice around a player — what the UI actually renders",
      },
      {
        method: "GET",
        path: "/v1/boards/{board}/friends?ids=[]",
        desc: "Rank among a small explicit set — a different query shape entirely",
      },
    ],
    dataModel: [
      {
        entity: "board (sorted set)",
        fields: [
          "key: lb:{game}:{region}:{period}",
          "member: player_id",
          "score: composite (points, inverted timestamp)",
          "TTL matching the period",
          "→ the live ranking structure",
        ],
      },
      {
        entity: "score_events",
        fields: [
          "event_id (pk, client-generated)",
          "player_id, board, delta, occurred_at",
          "→ durable log; the sorted set is rebuildable from it",
        ],
      },
      {
        entity: "player_scores",
        fields: [
          "player_id, board (pk)",
          "score, updated_at",
          "→ authoritative score, separate from the ranking index",
        ],
      },
      {
        entity: "percentile_buckets",
        fields: [
          "board (pk), score_bucket (pk)",
          "count",
          "→ histogram used to estimate rank cheaply for the long tail",
        ],
      },
    ],
    architecture: [
      {
        heading: "The sorted set, and the composite score trick",
        lede: "Say the four commands, then immediately say what they do not solve.",
        code: {
          title: "Ties broken inside the score, not at read time",
          lang: "ts",
          source: `// The naive version: ZADD board <points> <playerId>. Two players on 5,000
// points then have an undefined relative order that can change between reads,
// so the UI shuffles them — a small bug users notice immediately.

// Pack the tiebreak INTO the score so ordering is total and stable.
// A float64 holds 53 bits of integer precision: points in the high bits,
// inverted timestamp in the low bits so that EARLIER beats later.
function compositeScore(points: number, achievedAtMs: number): number {
  const MAX_TS = 2 ** 21;                       // ~24 days of second resolution
  const seconds = Math.floor(achievedAtMs / 1000) % MAX_TS;
  return points * MAX_TS + (MAX_TS - seconds);  // higher is better, earlier wins
}

await redis.zadd(board, compositeScore(points, Date.now()), playerId);

// Reads are then unambiguous and need no secondary sort:
const top = await redis.zrevrange(board, 0, 99, "WITHSCORES");
const rank = await redis.zrevrank(board, playerId);          // O(log N)
const around = await redis.zrevrange(board, rank - 5, rank + 5);`,
        },
        bullets: [
          "Packing the tiebreak into the score keeps ordering total and stable, which removes an entire class of flickering-UI bugs without any read-time sorting.",
          "Redis is the index, not the source of truth. Scores are written durably as events first, so the sorted set can be rebuilt after a failure — treating an in-memory structure as authoritative for a player's season progress is how you lose it.",
          "Set a TTL matching the board's period. Daily and weekly boards then clean themselves up, and the archive is a separate, deliberate write.",
          "Increment rather than set where the semantics allow it, and make submissions idempotent per match so a client retry cannot award points twice.",
        ],
        callout: {
          kind: "interview",
          title: "Get past the easy answer quickly",
          text: '"A sorted set gives top-N and exact rank in O(log N), so the basic version is four commands and one Redis instance — and that genuinely serves most games. The design questions are what happens when a single board is too hot for one key, when twenty million players each want an exact rank, and how the structure survives a restart. Those are the parts worth the time."',
        },
      },
      {
        heading: "Top-N and my-rank are different problems",
        lede: "Treating them as one query is what makes this expensive.",
        diagram: {
          kind: "compare",
          caption: "Different access patterns, different solutions.",
          options: [
            {
              title: "Top 100",
              sub: "the same answer for everyone",
              tone: "ok",
              good: [
                "One result shared by every player — cache it for a second",
                "Reduces the hottest query in the system to near zero cost",
              ],
              bad: ["Slightly stale", "Still a single hot key for writes"],
              verdict:
                "Cache aggressively; nobody can perceive one second of staleness at rank 40.",
            },
            {
              title: "My exact rank",
              sub: "a different answer per player",
              good: ["Precise and motivating for players near a threshold"],
              bad: [
                "Uncacheable — 20 M distinct answers",
                "Every score change alters millions of ranks implicitly",
              ],
              verdict: "Exact for the top few thousand; estimated below that.",
            },
            {
              title: "Percentile estimate",
              sub: '"top 4%" from a score histogram',
              good: [
                "O(1) from a small bucketed histogram",
                "Perfectly adequate for the long tail, where exact rank is meaningless anyway",
              ],
              bad: ["Not exact", "Bucket boundaries can look odd near thresholds"],
              verdict: "What makes the long tail affordable — and what the UI usually needs.",
            },
          ],
        },
        bullets: [
          "A player at rank 4,318,201 does not care about the exact number; they care that they are in the top ten percent and whether they are climbing. Designing for exactness everywhere solves a problem nobody has.",
          "Maintain a coarse histogram of scores per board — a few thousand buckets — updated periodically. Rank estimation is then summing the buckets above a score, which is trivially cheap and cacheable.",
          "Exactness matters near thresholds: promotion to the next tier, or qualification for a tournament. Keep exact ranking for that band and be explicit about where the boundary sits.",
          "The slice around a player is the query the UI actually issues, and it is cheap once you have their rank — so optimise for producing a rank, not for producing a full ordering.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "When one key is too hot",
        body: [
          'A sorted set lives on one node, so a wildly popular global board concentrates both writes and the top-N read onto a single shard. Redis is fast enough that this is rarely the first problem, but when it arrives the usual sharding tools do not apply cleanly — you cannot hash-partition a ranking and still answer "top 100" without combining shards.',
        ],
        table: {
          caption: "Options once a single board exceeds one node.",
          headers: ["Approach", "How", "Cost"],
          rows: [
            [
              "Read replicas",
              "Replicate the board; reads go to replicas",
              "Writes still single-node; replicas lag slightly",
            ],
            [
              "Cache the head",
              "Top-N in a local cache for ~1 s",
              "Removes most read load; trivially effective",
            ],
            [
              "Shard by score range",
              "Each node owns a score band",
              "Rank = local rank + counts above; rebalancing is awkward",
            ],
            [
              "Shard by player, merge",
              "Partial boards merged for top-N",
              "Top-N needs a scatter-gather; exact global rank is hard",
            ],
            [
              "Segment the product",
              "Region and tier boards instead of one global",
              "Best answer — a product decision that removes the problem",
            ],
          ],
        },
        bullets: [
          "Caching the top-N is disproportionately effective because that one query is most of the traffic and the same answer serves everyone.",
          "Score-range sharding preserves rankability: a player's global rank is their rank within their shard plus the total count in all higher shards, and those counts are small numbers that can be cached.",
          "Coalesce writes for very active players. A player whose score changes fifty times a second needs one sorted-set update per second, not fifty, and the intermediate values are visible to nobody.",
          "Segmenting the product is usually the real answer. Most games do not need one global ranking of twenty million players, and per-region or per-tier boards are both more motivating and structurally easier.",
        ],
        callout: {
          kind: "insight",
          text: "Write coalescing is the cheapest major win here. Ranking updates are idempotent in effect — only the latest score matters — so buffering updates per player for a second and writing once collapses the write load on the hot key by an order of magnitude with no user-visible difference at all.",
        },
      },
      {
        heading: "Durability and rebuilding",
        body: [
          "An in-memory ranking structure is the wrong place to keep the only copy of a player's season score. The architecture that survives is to treat the sorted set as a derived index over a durable event log.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Durable first, indexed second — so a restart is a rebuild, not a loss.",
          actors: [
            { id: "g", label: "Game server" },
            { id: "api", label: "Score service" },
            { id: "db", label: "Durable store" },
            { id: "r", label: "Redis board" },
          ],
          messages: [
            { from: "g", to: "api", label: "1. score event (eventId, match)", kind: "call" },
            {
              from: "api",
              to: "db",
              label: "2. append event, update player_scores",
              kind: "call",
              tone: "accent",
            },
            { from: "db", to: "api", label: "3. committed", kind: "return" },
            { from: "api", to: "r", label: "4. ZADD composite score", kind: "async" },
            { from: "api", to: "g", label: "5. ack", kind: "return", tone: "ok" },
            {
              from: "r",
              to: "r",
              label: "6. …node restarts, board empty",
              kind: "self",
              tone: "warn",
            },
            {
              from: "db",
              to: "r",
              label: "7. rebuild from player_scores",
              kind: "call",
              tone: "ok",
            },
          ],
        },
        bullets: [
          "Rebuilding twenty million members takes seconds with a pipelined bulk load, so the recovery story is genuinely simple — which is the point of keeping the index derived.",
          "Idempotency on the score event prevents a retried submission from double-awarding points, which matters because the durable write and the index update are not one atomic operation.",
          "If the index update fails after the durable write, the board is briefly stale for that player and self-heals on the next update or rebuild — an acceptable failure, and far better than the reverse ordering.",
          "Archive completed boards to durable storage at reset. Players expect to see last season's placement, and that is a historical record rather than a live ranking structure.",
        ],
      },
      {
        heading: "Cheating, and why it is an architectural concern",
        body: [
          "A leaderboard is an incentive to cheat, so score submission cannot be trusted from the client. This is not a security footnote — it changes where scores are computed and what the API accepts.",
        ],
        bullets: [
          'Scores should be derived from authoritative game state on the server, not submitted by the client. An endpoint that accepts "my score is 9,999,999" will receive exactly that.',
          "Where the client must submit, validate against plausibility bounds — maximum achievable rate, time elapsed, match length — and flag rather than silently reject, since false positives on legitimate players are costly.",
          "Removing a cheater must be cheap: delete from the sorted set and recompute the affected slice. Because ranks are derived rather than stored per player, removal is a single operation and everyone below shifts implicitly.",
          "Keep the score event log for exactly this reason. Retrospective invalidation of a whole match or account requires replaying what happened, which is impossible if only the current aggregate was kept.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Sorted set as the ranking index",
        pickWhen: "Always — it is the right structure",
        cost: "Single-node per key; must be rebuildable from durable storage",
      },
      {
        choice: "Composite score for tie-breaking",
        pickWhen: "Integer scores where ties are common",
        cost: "Precision budgeting between points and timestamp",
      },
      {
        choice: "Exact rank only for the top band",
        pickWhen: "Millions of players",
        cost: "Two code paths and a visible boundary between exact and estimated",
      },
      {
        choice: "Percentile histogram for the tail",
        pickWhen: "The long tail needs a position, not a number",
        cost: "Approximate, and bucket edges can look strange near thresholds",
      },
      {
        choice: "Write coalescing",
        pickWhen: "Highly active players or a hot global board",
        cost: "Up to a second of staleness for that player's own score",
      },
      {
        choice: "Segmented boards",
        pickWhen: "Whenever the product allows it",
        cost: "No single global ranking — usually an improvement, not a loss",
      },
    ],
    wrapUp: [
      "A sorted set gives top-N and exact rank in logarithmic time, so state the easy answer quickly and spend the time on what it does not solve.",
      "Pack the tiebreak into the score so ordering is total and stable; an undefined order between equal scores produces a visibly flickering UI.",
      "Top-N and my-rank are different problems: one answer shared by everyone and cacheable, versus millions of distinct uncacheable answers. Exact ranks for the top band, percentile estimates for the tail.",
      "The sorted set is a derived index over a durable event log, so a node loss is a rebuild measured in seconds rather than lost season progress.",
      "A single hot board is the scaling limit, and the cheapest fixes are caching the head and coalescing writes; segmenting the product usually removes the problem entirely.",
      "Scores must be server-authoritative, and keeping the event log is what makes retrospective removal of a cheater possible.",
    ],
    followUps: [
      {
        q: "Two players have exactly the same score. What order do they appear in?",
        a: "Undefined, unless you have made it defined — and that is a real bug rather than a theoretical one, because with integer scores ties are extremely common and an undefined order can change between reads, so the UI visibly shuffles two players back and forth. The fix is to pack the tiebreak into the score itself rather than sorting at read time: use the high bits for points and the low bits for an inverted timestamp so that, among equal scores, whoever reached it first ranks higher. A float64 gives fifty-three bits of integer precision, which is plenty to budget between the two. The ordering is then total, stable and requires no secondary sort anywhere in the system.",
      },
      {
        q: "Twenty million players each want to see their exact rank. Is that affordable?",
        a: "The per-query cost is fine — a rank lookup on a skip list is logarithmic, around twenty-five steps — but the aggregate is the problem, because unlike the top-100 query every answer is different and therefore uncacheable, and every score change silently alters millions of ranks. The practical resolution is to notice that exactness only matters in a narrow band: a player near a tier promotion or tournament cut genuinely needs their precise position, while a player at rank four million needs to know they are in the top ten percent and whether they are climbing. So I would keep exact ranking for the top few thousand and serve everyone else from a coarse score histogram, where estimating rank is summing the buckets above their score — an O(1) operation on a cacheable structure.",
      },
      {
        q: "The Redis node holding the global board restarts. What is lost?",
        a: "Nothing that matters, provided the sorted set was never the source of truth. Score events are written durably first and the player's authoritative score lives in a real database; the sorted set is a derived index maintained asynchronously. So a restart loses the index, and rebuilding it is a pipelined bulk load of twenty million members, which takes seconds. The ordering of the two writes is what makes this work: durable first, index second — if the index update fails, that player's board position is briefly stale and self-heals, whereas the reverse ordering would risk acknowledging a score that was never persisted. It is also why score submissions carry an idempotency key, since the two writes are not a single atomic operation.",
      },
      {
        q: "One global board becomes a hot key. What do you do?",
        a: "In order of cost: first cache the top-N, because that single query is most of the read traffic and one cached answer serves every player, so a one-second TTL removes the bulk of the load and nobody can perceive the staleness. Next coalesce writes — a very active player generating fifty score changes a second only needs one sorted-set update per second, since only the latest value is ever read, which cuts write pressure on the key by an order of magnitude. If that is still not enough, shard by score range so each node owns a band and a global rank is the local rank plus the cached counts of everyone above. But the honest answer is usually that the product does not need one global ranking of twenty million players, and segmenting by region or tier both removes the hot key and makes the leaderboard more motivating.",
      },
      {
        q: "How do you stop players from submitting fake scores?",
        a: "By not accepting scores from the client in the first place where that is avoidable. The score should be derived from authoritative game state on the server, because an endpoint that takes a number from the player will eventually receive whatever number they like. Where the client genuinely must report — a single-player or offline mode — the submission is validated against plausibility bounds such as the maximum achievable rate for the elapsed time, and suspicious values are flagged for review rather than silently rejected, since falsely punishing legitimate players is expensive. The architectural consequence worth naming is the event log: retrospectively invalidating a match or an account requires replaying what happened, and because ranks are derived rather than stored, removing a cheater is a single deletion after which everyone below shifts up implicitly.",
      },
    ],
    related: [
      "/hld/caching",
      "/examples/unique-id",
      "/hld/sharding",
      "/lld/lru-cache",
      "/examples/distributed-cache",
    ],
    furtherReading: [
      {
        label: "Redis — sorted sets and skip lists",
        href: "https://redis.io/docs/data-types/sorted-sets/",
      },
      {
        label: "algomaster — design a leaderboard",
        href: "https://algomaster.io/learn/system-design-interviews/design-a-leaderboard",
      },
    ],
  },
];
