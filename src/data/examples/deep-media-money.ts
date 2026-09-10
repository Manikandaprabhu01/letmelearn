import type { DesignExample } from "@/data/types";

export const mediaAndMoneyExamples: DesignExample[] = [
  {
    slug: "youtube",
    title: "Design YouTube",
    source: "Volume 1",
    chapter: 14,
    difficulty: "advanced",
    minutes: 24,
    tags: ["video", "transcoding", "cdn", "pipeline"],
    companies: ["YouTube", "Netflix", "Vimeo", "TikTok"],
    summary:
      "Video is two systems joined by a pipeline: an upload and transcoding path measured in minutes, and a playback path measured in milliseconds and terabits. The interesting parts are the DAG of transcoding jobs, adaptive bitrate streaming, and the fact that the CDN — not your servers — is what actually serves the product.",
    clarifying: [
      {
        q: "Upload and playback, or playback only?",
        a: "Both, and they should be discussed as separate systems. Upload is a batch pipeline with minutes of latency; playback is a read-heavy CDN problem. Conflating them is the common mistake.",
      },
      {
        q: "Live streaming or video on demand?",
        a: "On demand. Live changes the pipeline fundamentally — transcoding becomes real-time with a latency budget of seconds, and there is no time for a multi-pass encode.",
      },
      {
        q: "Do we need recommendations, search and comments?",
        a: "Out of scope for this round, stated explicitly. Each is its own system, and trying to cover all of them produces a shallow answer everywhere.",
      },
      {
        q: "What scale?",
        a: "500 hours uploaded per minute and a billion hours watched per day. Those two numbers put the design in the 'CDN and pipeline' regime rather than the 'web app' one.",
      },
      {
        q: "Global audience?",
        a: "Yes, which makes CDN strategy and regional replication of popular content central rather than an optimisation.",
      },
    ],
    requirements: {
      functional: [
        "Upload a video of arbitrary size and format",
        "Transcode into multiple resolutions and codecs",
        "Stream with adaptive bitrate over unreliable networks",
        "Thumbnails, duration and basic metadata",
        "Resume an interrupted upload",
      ],
      nonFunctional: [
        "Playback starts within ~1 second",
        "Minimal rebuffering on variable connections",
        "Uploads never lost, even across client and worker failures",
        "Transcoding completes in minutes, not hours, for typical videos",
        "Cost per delivered gigabyte kept under control",
      ],
    },
    math: [
      {
        label: "Upload volume",
        expr: "500 hours/min × 60 × 24 = 720,000 hours/day",
        result: "≈ 30,000 h/hour",
        note: "Transcoding this in real time needs tens of thousands of concurrent encoder cores.",
      },
      {
        label: "Storage per source video",
        expr: "1 hour of 1080p source ≈ 4 GB",
        result: "≈ 2.9 PB/day raw",
        note: "Before transcoding. Keep the source in cold storage; it is rarely read again.",
      },
      {
        label: "Transcoding multiplier",
        expr: "renditions at 240p/360p/480p/720p/1080p/4K ≈ 1.5× the source",
        result: "≈ 4.4 PB/day total",
        note: "Storing every rendition of every video is why unpopular renditions are generated lazily.",
      },
      {
        label: "Delivery bandwidth",
        expr: "1 B watch-hours/day × 1.5 GB/hour ÷ 86,400 s",
        result: "≈ 17 TB/s",
        note: "≈ 140 Tbps. This is entirely a CDN number; no origin serves this.",
      },
      {
        label: "Popularity skew",
        expr: "~1% of videos ≈ 90% of views",
        result: "cache the head",
        note: "A small cached fraction serves nearly all traffic, which is what makes the economics work.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/uploads",
        desc: "Initiate — returns an upload id and a set of signed part URLs",
      },
      {
        method: "PUT",
        path: "{signedUrl}/parts/{n}",
        desc: "Client uploads chunks directly to object storage, bypassing your servers",
      },
      {
        method: "POST",
        path: "/v1/uploads/{id}/complete",
        desc: "Assemble parts, verify checksum, enqueue transcoding",
      },
      {
        method: "GET",
        path: "/v1/videos/{id}/manifest.m3u8",
        desc: "HLS manifest listing renditions — the entry point to playback",
      },
      {
        method: "GET",
        path: "{cdn}/v/{id}/{rendition}/seg-{n}.ts",
        desc: "Segment fetch — served from the edge, never from origin",
      },
      {
        method: "GET",
        path: "/v1/videos/{id}",
        desc: "Metadata: title, duration, thumbnails, available renditions",
      },
    ],
    dataModel: [
      {
        entity: "videos",
        fields: [
          "id (pk)",
          "owner_id (idx)",
          "title",
          "duration_s",
          "status",
          "source_key",
          "created_at",
          "visibility",
        ],
      },
      {
        entity: "renditions",
        fields: [
          "video_id (fk)",
          "resolution",
          "codec",
          "bitrate",
          "manifest_key",
          "state",
          "bytes",
        ],
      },
      {
        entity: "transcode_jobs",
        fields: [
          "id (pk)",
          "video_id",
          "segment_index",
          "profile",
          "state",
          "attempts",
          "worker_id",
        ],
      },
      {
        entity: "uploads",
        fields: ["id (pk)", "user_id", "parts_completed[]", "checksum", "expires_at"],
      },
      {
        entity: "view_events",
        fields: ["video_id", "ts", "position_s", "quality", "rebuffer_ms", "→ analytics stream"],
      },
    ],
    architecture: [
      {
        heading: "Two systems, one pipeline",
        diagram: {
          kind: "system",
          caption: "Upload and transcode is batch; playback is edge. They meet at object storage.",
          columns: [
            {
              title: "Upload",
              nodes: [
                { id: "cl", label: "Client", sub: "chunked, resumable" },
                {
                  id: "s3",
                  label: "Object storage",
                  sub: "direct via signed URLs",
                  tone: "accent",
                },
              ],
            },
            {
              title: "Pipeline",
              nodes: [
                { id: "insp", label: "Inspect", sub: "codec, duration, validity" },
                {
                  id: "split",
                  label: "Split into segments",
                  sub: "parallelism unit",
                  tone: "accent",
                },
                {
                  id: "enc",
                  label: "Encoder fleet",
                  sub: "one job per segment × profile",
                  tone: "ok",
                },
                { id: "pack", label: "Package", sub: "HLS/DASH manifests" },
              ],
            },
            {
              title: "Storage",
              nodes: [
                { id: "hot", label: "Hot renditions", sub: "popular, all qualities" },
                { id: "cold", label: "Source archive", sub: "glacier-class" },
              ],
            },
            {
              title: "Playback",
              nodes: [
                { id: "cdn", label: "CDN", sub: "99%+ of bytes", tone: "ok" },
                { id: "pl", label: "Player", sub: "ABR ladder switching" },
              ],
            },
          ],
        },
        steps: [
          {
            title: "Client uploads directly to object storage",
            text: "Your API issues signed URLs; the bytes never transit your servers. This removes an enormous bandwidth cost and an entire class of scaling problem.",
            detail:
              "Multipart with per-part checksums means a failed part is retried, not the whole file.",
          },
          {
            title: "Inspect and validate",
            text: "Probe the container: codec, duration, resolution, whether it is actually a video. Reject early rather than after twenty minutes of encoding.",
          },
          {
            title: "Split into segments",
            text: "Cut the source at keyframe boundaries into segments of a few seconds. Each segment is an independent transcoding unit, which is what makes the pipeline parallel.",
            detail:
              "A one-hour video becomes ~1,200 segments × 6 profiles ≈ 7,200 independent jobs.",
          },
          {
            title: "Transcode in parallel",
            text: "A fleet of encoder workers pulls jobs. Because segments are independent, a two-hour video can transcode in minutes given enough workers.",
          },
          {
            title: "Package and publish",
            text: "Assemble segments into per-rendition playlists and a master manifest, write to storage, then flip the video's status to ready.",
          },
          {
            title: "Serve from the CDN",
            text: "The player fetches the manifest, then segments. Popular content is cached at the edge; the origin sees almost nothing.",
          },
        ],
        callout: {
          kind: "insight",
          text: "Segment-level parallelism is the key idea in the whole pipeline. Transcoding a two-hour film as one job takes hours and cannot be retried cheaply; splitting it into thousands of independent segment jobs makes it fast, retryable, and schedulable on spot capacity.",
        },
      },
      {
        heading: "The transcoding DAG",
        body: [
          "Transcoding is not one operation but a graph of them, and modelling it as a DAG is what makes the pipeline extensible: adding watermarking or a new codec is a new node, not a rewrite.",
        ],
        diagram: {
          kind: "flow",
          caption: "Each node is retryable; each edge is a dependency the scheduler enforces.",
          rows: [
            [
              { id: "src", label: "Source in storage", tone: "accent" },
              { id: "probe", label: "Probe / validate" },
              { id: "seg", label: "Segment at keyframes" },
            ],
            [
              { id: "v1", label: "Encode 240p", sub: "per segment" },
              { id: "v2", label: "Encode 720p", sub: "per segment" },
              { id: "v3", label: "Encode 1080p", sub: "per segment" },
              { id: "au", label: "Encode audio", sub: "separate track" },
            ],
            [
              { id: "thumb", label: "Thumbnails", sub: "sampled frames" },
              { id: "pack2", label: "Package HLS + DASH", sub: "manifests" },
              { id: "pub", label: "Publish + invalidate", sub: "status → ready", tone: "ok" },
            ],
          ],
        },
        code: {
          title: "Job scheduling: idempotent, retryable, spot-friendly",
          lang: "ts",
          source: `// Each job is (videoId, segmentIndex, profile) — a deterministic identity,
// so a retry writes the same output key and duplicate execution is harmless.
type TranscodeJob = { videoId: string; segment: number; profile: Profile };

function outputKey(j: TranscodeJob) {
  return \`v/\${j.videoId}/\${j.profile.name}/seg-\${j.segment}.ts\`;
}

async function run(job: TranscodeJob) {
  const key = outputKey(job);
  if (await storage.exists(key)) return;          // already done: idempotent no-op

  const src = await storage.getRange(sourceKey(job.videoId), segmentRange(job.segment));
  const out = await ffmpeg.encode(src, job.profile);
  await storage.put(key, out);                     // same key on every retry

  await jobs.markComplete(job);
  if (await jobs.allComplete(job.videoId, job.profile)) {
    await enqueue({ type: "package", videoId: job.videoId, profile: job.profile });
  }
}

// Because jobs are idempotent and independent, encoders can run on
// interruptible spot instances — a worker dying costs one segment.`,
        },
        bullets: [
          "Prioritise the ladder: publish 480p and 720p first so the video becomes watchable in a minute, and let 4K finish later. Users care about availability far more than about maximum quality.",
          "Generate rare renditions lazily. Storing 4K for a video with 40 views is pure cost; transcode on first request and cache the result.",
          "Encoding is CPU-bound and embarrassingly parallel, which makes it the ideal spot-instance workload — provided jobs are idempotent and small.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Adaptive bitrate streaming",
        body: [
          "The player, not the server, decides quality. The manifest advertises a ladder of renditions; the player measures throughput and buffer level and switches between them at segment boundaries. That is why the segments must be aligned across renditions.",
        ],
        code: {
          title: "An HLS master manifest is just a list of options",
          lang: "text",
          source: `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240,CODECS="avc1.42e00a,mp4a.40.2"
240p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8

# Each rendition playlist lists segments:
#EXTINF:6.0,
seg-0001.ts
#EXTINF:6.0,
seg-0002.ts

# Segments are keyframe-aligned across renditions, so the player can switch
# from 720p to 480p at segment 42 and the video does not stutter.`,
        },
        table: {
          headers: ["Decision", "Trade-off"],
          rows: [
            [
              "Segment length 2 s",
              "Faster quality adaptation and lower startup latency; more requests and more overhead",
            ],
            [
              "Segment length 10 s",
              "Fewer requests, better compression; slow to react to bandwidth changes",
            ],
            ["Start at the lowest rendition", "Playback starts fast; first seconds look poor"],
            [
              "Start at an estimated rendition",
              "Better first impression; risks an immediate rebuffer",
            ],
            [
              "Large player buffer",
              "Resilient to bandwidth dips; wasted bandwidth if the user abandons",
            ],
            ["More ladder rungs", "Smoother adaptation; more transcoding and storage cost"],
          ],
        },
        bullets: [
          "Rebuffering is the metric that matters, far more than resolution. Users tolerate 480p; they abandon on a spinner.",
          "Segments are ordinary HTTP GETs, which is precisely why any HTTP CDN can serve video — that design choice is what made streaming cheap.",
          "Newer codecs (AV1, HEVC) cut bandwidth substantially but cost much more to encode and are not universally supported, so you ship several codec ladders and let the manifest advertise what the device can play.",
        ],
      },
      {
        heading: "Delivery economics",
        bullets: [
          "At roughly 140 Tbps, bandwidth is the dominant cost of the entire product. Every design decision on the playback path is a cost decision.",
          "Popularity is extremely skewed: caching the top small percentage of content at the edge serves the overwhelming majority of bytes. Pre-push newly popular content to edges rather than waiting for it to be pulled.",
          "Multi-CDN with traffic steering by measured performance and price is standard at this scale, and it doubles as availability: one CDN degrading is a routing change, not an outage.",
          "Tiered storage: hot renditions on fast storage, the original source in archival storage. Sources are almost never read again, but you cannot delete them because a new codec may require re-encoding.",
          "ISP peering and embedded caches inside ISP networks are the last step — that is where the largest providers get their unit costs down.",
        ],
        math: [
          {
            label: "Cache effectiveness",
            expr: "1% of catalogue ≈ 90% of views",
            result: "small cache, huge offload",
          },
          {
            label: "Lazy rendition savings",
            expr: "most videos never receive a 4K request",
            result: "~40% of transcode + storage saved",
            note: "Generate on demand for the tail; pre-generate for the head.",
          },
          {
            label: "Codec saving",
            expr: "AV1 ≈ 30% fewer bits than H.264 at similar quality",
            result: "30% of the largest cost line",
            note: "Against 5-10× the encoding CPU — worth it for popular content only.",
          },
        ],
      },
      {
        heading: "Resumable upload, and what goes wrong",
        steps: [
          {
            title: "Client requests an upload session",
            text: "The API records an upload id and returns signed URLs for parts. State is server-side so the client can resume after being closed entirely.",
          },
          {
            title: "Parts upload independently",
            text: "Each part carries a checksum. A failed part is retried on its own; a flaky mobile connection costs seconds rather than the whole file.",
          },
          {
            title: "Complete and verify",
            text: "The client signals completion, the service verifies all parts and the overall checksum, and only then enqueues transcoding.",
            detail:
              "Verify before transcoding — encoding a corrupt file wastes minutes of CPU and produces a confusing failure.",
          },
          {
            title: "Handle abandonment",
            text: "Sessions expire and orphaned parts are cleaned up, or storage slowly fills with fragments of uploads nobody finished.",
          },
        ],
        table: {
          headers: ["Failure", "User sees", "Handling"],
          rows: [
            [
              "Network drop mid-upload",
              "Progress pauses, then resumes",
              "Part-level retry against the same upload id",
            ],
            ["Corrupt part", "Nothing", "Checksum mismatch → re-upload that part only"],
            ["Encoder crash", "Nothing", "Segment job retried; idempotent output key"],
            [
              "Unsupported codec",
              "Clear error within seconds",
              "Probe and reject at inspection, before encoding",
            ],
            [
              "Transcoding backlog",
              "'Processing' for longer",
              "Prioritise low renditions so it becomes watchable sooner",
            ],
            [
              "Storage write failure",
              "Upload fails",
              "Retry with backoff; the source is the one thing that must not be lost",
            ],
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Direct-to-storage upload",
        pickWhen: "Always for large files",
        cost: "Signed-URL management and client-side complexity; saves enormous bandwidth",
      },
      {
        choice: "Segment-level transcoding",
        pickWhen: "Any non-trivial video length",
        cost: "A job scheduler and a DAG to operate; gains parallelism and cheap retries",
      },
      {
        choice: "Pre-generate all renditions",
        pickWhen: "Content is known to be popular",
        cost: "Storage and CPU for renditions nobody watches",
      },
      {
        choice: "Lazy rendition generation",
        pickWhen: "Long-tail catalogue",
        cost: "First viewer of a rare quality waits",
      },
      {
        choice: "Multi-CDN",
        pickWhen: "Large delivery volume",
        cost: "Steering logic and reconciliation across providers; buys cost leverage and availability",
      },
      {
        choice: "Newer codec (AV1)",
        pickWhen: "High-view content where bandwidth dominates",
        cost: "Much higher encoding cost and partial device support",
      },
    ],
    wrapUp: [
      "Upload and playback are separate systems joined by object storage — one is a batch pipeline, the other is an edge cache problem.",
      "Segment-level parallelism makes transcoding fast, retryable and cheap enough to run on interruptible capacity.",
      "The player drives quality through an adaptive bitrate ladder, which is why segments must be keyframe-aligned across renditions.",
      "Bandwidth is the dominant cost, so the CDN strategy is an economic design decision, not an implementation detail.",
      "With another hour: live streaming, DRM and content protection, and the recommendation pipeline.",
    ],
    followUps: [
      {
        q: "How long does a two-hour video take to transcode?",
        a: "It depends almost entirely on parallelism, which is the point of segmenting. Split into six-second segments, a two-hour video is about 1,200 segments per profile, and with a thousand workers available it completes in a few minutes rather than hours. I would also publish the mid-range renditions first so it becomes watchable before the whole ladder finishes.",
      },
      {
        q: "A video goes viral. What happens?",
        a: "Almost nothing on my infrastructure, because the CDN absorbs it — that is the entire point of segments being plain HTTP objects. What I would want is proactive pre-push of that content to edges rather than waiting for each PoP to pull it, and generation of any renditions that were left lazy. The origin only sees the first request per segment per edge.",
      },
      {
        q: "How does the player decide what quality to use?",
        a: "It measures download throughput and its own buffer level and picks a rung of the ladder at each segment boundary. Because renditions are keyframe-aligned, switching is seamless. The heuristic usually starts conservative to get playback going quickly, then steps up — since rebuffering costs far more in user terms than a few seconds of lower resolution.",
      },
      {
        q: "Where do you store the original file?",
        a: "In archival-class storage, indefinitely. It is almost never read after transcoding, but you cannot delete it, because a new codec or a re-encode with different settings requires the source. Renditions live on faster storage tiered by popularity, with rare qualities generated on demand rather than kept warm.",
      },
      {
        q: "How would live streaming change this?",
        a: "Fundamentally. There is no time for multi-pass encoding or for reordering segments, so transcoding becomes a real-time pipeline with a hard latency budget, typically producing segments of a couple of seconds. The manifest becomes a sliding window rather than a complete list, and low-latency variants push partial segments. The delivery path stays similar, which is the one piece that carries over.",
      },
    ],
    related: ["/hld/cdn", "/hld/message-queues", "/examples/netflix", "/hld/caching"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "payment",
    title: "Design a Payment System",
    source: "Volume 2",
    chapter: 11,
    difficulty: "advanced",
    minutes: 24,
    tags: ["ledger", "idempotency", "reconciliation", "correctness"],
    companies: ["Stripe", "PayPal", "Adyen", "Square"],
    summary:
      "Payments is the design where correctness beats every other consideration. The architecture is unremarkable — a service, a ledger, a queue, a provider — and the entire interview is about what happens when a call times out, whether the books balance, and how you find out when they do not.",
    clarifying: [
      {
        q: "Are we building the card network or an application on top of a PSP?",
        a: "An application on top of a provider like Stripe or Adyen. Building card-network integration is a different, much more regulated problem worth naming and setting aside.",
      },
      {
        q: "One currency or many?",
        a: "Multiple, which means every amount carries a currency, exchange rates are versioned, and you never sum across currencies without an explicit conversion.",
      },
      {
        q: "Do we need refunds, partial captures and chargebacks?",
        a: "Yes. These are what make a ledger necessary — a single status column cannot represent a partially refunded, partially captured payment with a disputed portion.",
      },
      {
        q: "What consistency do we need?",
        a: "Strong, on the ledger. This is the clearest case in system design for choosing consistency over availability: refusing a payment is recoverable, double-charging is not.",
      },
      {
        q: "What volume?",
        a: "Assume 10,000 payments per second at peak. High, but the ledger write rate is what constrains the design, not the request rate.",
      },
    ],
    requirements: {
      functional: [
        "Accept a payment, authorise and capture through a provider",
        "Full and partial refunds",
        "Double-entry ledger recording every movement of money",
        "Webhook handling for asynchronous provider events",
        "Reconciliation against provider settlement files",
        "Payouts to merchants",
      ],
      nonFunctional: [
        "No double charges, ever, under any retry or failure",
        "Every balance derivable from the ledger; the books always balance",
        "Complete audit trail — nothing is ever updated in place",
        "Payment result known within seconds",
        "PCI scope minimised — card data never touches your servers",
      ],
    },
    math: [
      {
        label: "Ledger write volume",
        expr: "10,000 payments/s × ~4 ledger entries each",
        result: "40,000 rows/s",
        note: "Append-only inserts, which is the cheapest thing a database does — and why the ledger is append-only.",
      },
      {
        label: "Storage",
        expr: "40,000/s × 200 B × 86,400 × 365",
        result: "≈ 250 TB/year",
        note: "Retained for years for regulatory reasons. Partition by month; archive cold partitions.",
      },
      {
        label: "Reconciliation window",
        expr: "provider settlement files arrive daily",
        result: "T+1 truth",
        note: "So your view and theirs can disagree for up to a day — the design must expect and detect that.",
      },
      {
        label: "Cost of one double charge",
        expr: "refund + support contact + trust",
        result: "≫ any latency saving",
        note: "This is the sentence that justifies every synchronous, careful decision in the design.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/payments",
        desc: "Create — requires Idempotency-Key; returns the payment and its state",
      },
      {
        method: "POST",
        path: "/v1/payments/{id}/capture",
        desc: "Capture an authorised payment, fully or partially",
      },
      {
        method: "POST",
        path: "/v1/payments/{id}/refund",
        desc: "Refund — also idempotent, also a ledger movement",
      },
      {
        method: "GET",
        path: "/v1/payments/{id}",
        desc: "State plus the ledger entries that produced it",
      },
      {
        method: "POST",
        path: "/webhooks/psp",
        desc: "Provider events — signature-verified, deduplicated, replayable",
      },
      {
        method: "GET",
        path: "/v1/balances/{account}",
        desc: "Derived from the ledger, never stored as a mutable field",
      },
    ],
    dataModel: [
      {
        entity: "payments",
        fields: [
          "id (pk)",
          "idempotency_key (unique)",
          "merchant_id (idx)",
          "amount_minor, currency",
          "state",
          "psp_reference",
          "created_at",
        ],
      },
      {
        entity: "ledger_entries",
        fields: [
          "id (pk)",
          "transaction_id (idx) — groups the entries of one movement",
          "account_id (idx)",
          "direction (debit|credit)",
          "amount_minor, currency",
          "created_at",
          "→ append-only, never updated",
        ],
      },
      {
        entity: "payment_events",
        fields: [
          "payment_id (idx)",
          "seq",
          "type",
          "payload",
          "occurred_at",
          "→ the state machine's history",
        ],
      },
      {
        entity: "webhook_events",
        fields: ["provider_event_id (unique)", "received_at", "processed_at", "→ dedupe key"],
      },
      {
        entity: "reconciliation",
        fields: [
          "settlement_date",
          "psp_reference",
          "our_amount",
          "their_amount",
          "status",
          "resolved_at",
        ],
      },
    ],
    architecture: [
      {
        heading: "The payment state machine",
        lede: "Every illegal transition must be impossible, not merely unlikely.",
        diagram: {
          kind: "flow",
          caption:
            "Authorise and capture are separate states for a reason: goods ship between them.",
          rows: [
            [
              { id: "init", label: "INITIATED", tone: "accent" },
              { id: "auth", label: "AUTHORISED", sub: "funds held" },
              { id: "cap", label: "CAPTURED", sub: "money moved", tone: "ok" },
              { id: "set", label: "SETTLED", sub: "confirmed by provider", tone: "ok" },
            ],
            [
              { id: "fail", label: "FAILED", sub: "declined — terminal", tone: "bad" },
              { id: "void", label: "VOIDED", sub: "auth released before capture", tone: "warn" },
              { id: "ref", label: "REFUNDED", sub: "full or partial", tone: "warn" },
              { id: "cb", label: "CHARGEBACK", sub: "disputed after settlement", tone: "bad" },
            ],
            [
              {
                id: "unk",
                label: "UNKNOWN",
                sub: "provider timed out — must be resolved",
                tone: "warn",
              },
            ],
          ],
        },
        code: {
          title: "The transition table, and the state everyone forgets",
          lang: "ts",
          source: `const ALLOWED: Record<State, State[]> = {
  INITIATED:  ["AUTHORISED", "FAILED", "UNKNOWN"],
  UNKNOWN:    ["AUTHORISED", "FAILED"],       // resolved by query or reconciliation
  AUTHORISED: ["CAPTURED", "VOIDED", "FAILED"],
  CAPTURED:   ["SETTLED", "REFUNDED"],
  SETTLED:    ["REFUNDED", "CHARGEBACK"],
  REFUNDED:   ["CHARGEBACK"],                  // yes, a refunded payment can still be disputed
  VOIDED:     [],
  FAILED:     [],
  CHARGEBACK: [],
};

// UNKNOWN is the state most designs omit and the one that causes real losses.
// It means: we sent a request to the provider and never learned the outcome.
// It is NOT failure. Treating it as failure and retrying is how you double-charge.
//
// Resolution: query the provider by our idempotency key, and if that is
// inconclusive, wait for the settlement file. Never guess.`,
        },
        callout: {
          kind: "warn",
          text: "A timeout is not a decline. If you treat an unknown outcome as failed and let the customer retry, you can charge them twice — and the second charge will look perfectly legitimate in your logs. Modelling UNKNOWN explicitly is the single most important thing in this design.",
        },
      },
      {
        heading: "Double-entry ledger",
        body: [
          "Every movement of money is recorded as balanced debits and credits across accounts. Balances are derived by summing entries, never stored as a mutable number. That one rule gives you an audit trail, makes bugs detectable by an invariant, and turns 'what happened to this money' into a query rather than an investigation.",
        ],
        code: {
          title: "One payment, four entries, sum zero",
          lang: "sql",
          source: `-- Customer pays 100.00, of which 3.00 is our fee.
-- Every transaction_id's entries must sum to zero. That invariant is checkable.

INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_minor, currency) VALUES
  ('txn_9f3', 'customer:cus_1',      'debit',  10000, 'USD'),  -- customer pays
  ('txn_9f3', 'merchant:mer_7',      'credit',  9700, 'USD'),  -- merchant receivable
  ('txn_9f3', 'revenue:fees',        'credit',   300, 'USD'),  -- our fee
  ('txn_9f3', 'psp:stripe_holding',  'debit',      0, 'USD');  -- clearing account

-- Balance is a query, not a column:
SELECT SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE -amount_minor END)
FROM ledger_entries WHERE account_id = 'merchant:mer_7' AND currency = 'USD';

-- The invariant that catches almost every bug, run continuously:
SELECT transaction_id,
       SUM(CASE WHEN direction = 'credit' THEN amount_minor ELSE -amount_minor END) AS imbalance
FROM ledger_entries GROUP BY transaction_id HAVING imbalance <> 0;
-- Any row returned is a bug. Alert on it immediately.`,
        },
        bullets: [
          "Amounts are integers in the currency's minor unit. Floating-point money is a defect, not a style choice — 0.1 + 0.2 is not 0.3.",
          "Never sum across currencies. A multi-currency balance is a set of balances, and conversion is an explicit transaction with a recorded rate.",
          "Entries are append-only. A correction is a new reversing entry, never an update — that is what makes the history trustworthy.",
          "A refund is not a deletion; it is a new transaction moving money the other way, with its own id and its own entries.",
          "Cache balances if you must, but derive the authoritative number from entries and reconcile the cache continuously.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Idempotency end to end",
        diagram: {
          kind: "sequence",
          caption:
            "The key is claimed before any provider call, and the response is stored for replay.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "Payment API" },
            { id: "db", label: "Database" },
            { id: "psp", label: "Provider" },
          ],
          messages: [
            {
              from: "c",
              to: "api",
              label: "POST /v1/payments  Idempotency-Key: 8f14…",
              kind: "call",
            },
            {
              from: "api",
              to: "db",
              label: "INSERT key ... ON CONFLICT DO NOTHING",
              kind: "call",
              tone: "accent",
              note: "the unique constraint is the lock",
            },
            { from: "db", to: "api", label: "claimed (first time)", kind: "return" },
            {
              from: "api",
              to: "psp",
              label: "charge(..., idempotencyKey: same key)",
              kind: "call",
              note: "the key travels downstream too",
            },
            {
              from: "psp",
              to: "api",
              label: "timeout ✗",
              kind: "return",
              tone: "bad",
              note: "outcome unknown — do NOT retry blindly",
            },
            { from: "api", to: "db", label: "state = UNKNOWN", kind: "call", tone: "warn" },
            {
              from: "api",
              to: "psp",
              label: "query by idempotency key",
              kind: "call",
              note: "resolve rather than guess",
            },
            {
              from: "psp",
              to: "api",
              label: "succeeded, reference ch_123",
              kind: "return",
              tone: "ok",
            },
            {
              from: "api",
              to: "db",
              label: "state = AUTHORISED + ledger entries (one tx)",
              kind: "call",
              tone: "ok",
            },
            {
              from: "c",
              to: "api",
              label: "retry with the same key → same response",
              kind: "call",
              note: "replayed, no second charge",
            },
          ],
        },
        code: {
          title: "Claim, act, store — all inside one transaction",
          lang: "ts",
          source: `async function createPayment(req: Request) {
  const key = req.header("Idempotency-Key");
  if (!key) return badRequest("Idempotency-Key required");
  const fingerprint = hash(req.body);

  return db.transaction(async (tx) => {
    const claim = await tx\`
      INSERT INTO idempotency_keys (key, fingerprint, state)
      VALUES (\${key}, \${fingerprint}, 'in_progress')
      ON CONFLICT (key) DO NOTHING RETURNING key\`;

    if (claim.length === 0) {
      const prior = await tx\`SELECT * FROM idempotency_keys WHERE key = \${key}\`;
      if (prior[0].fingerprint !== fingerprint) {
        return unprocessable("Idempotency-Key reused with a different payload");
      }
      if (prior[0].state === "in_progress") return conflict("in progress, retry shortly");
      return replay(prior[0].response);      // same status, same body, same payment id
    }

    const result = await charge(req.body, key);      // provider call carries the same key
    await writeLedgerEntries(tx, result);            // ledger + state in the SAME tx
    await tx\`UPDATE idempotency_keys SET state='completed', response=\${json(result)}
             WHERE key = \${key}\`;
    return result;
  });
}`,
        },
        bullets: [
          "The key is claimed before the provider is called, so two concurrent retries cannot both reach the provider.",
          "The provider call carries the same key, which closes the last gap: a timeout followed by a retry hits the provider's own deduplication.",
          "The stored response must include the payment id, or a retrying client cannot correlate its request with the payment that exists.",
          "Fingerprint the payload: a key reused with a different amount is a client bug and must be a clear error, not a silent replay.",
        ],
      },
      {
        heading: "Webhooks and asynchronous truth",
        bullets: [
          "Providers report the real outcome asynchronously, and your synchronous response is only a preliminary view. Design for the webhook to be the authority.",
          "Verify the signature on every webhook. An unauthenticated payment-succeeded webhook is a way to give away goods for free.",
          "Deduplicate on the provider's event id — webhooks are delivered at least once, and duplicates are routine.",
          "Handle out-of-order delivery: a 'captured' event can arrive before 'authorised'. Use the state machine to reject impossible transitions and buffer or re-fetch rather than corrupting state.",
          "Return 200 quickly and process asynchronously. A slow webhook handler causes the provider to retry, which multiplies your load during an incident.",
          "Have a replay path. When your handler has a bug, you need to reprocess a day of events — which requires storing the raw payloads.",
        ],
        code: {
          title: "Webhook handler: verify, dedupe, enqueue",
          lang: "ts",
          source: `app.post("/webhooks/psp", async (req, res) => {
  if (!verifySignature(req.rawBody, req.header("PSP-Signature"))) {
    return res.status(401).end();                 // never process an unverified webhook
  }

  const event = JSON.parse(req.rawBody);

  const inserted = await db\`
    INSERT INTO webhook_events (provider_event_id, payload, received_at)
    VALUES (\${event.id}, \${req.rawBody}, now())
    ON CONFLICT (provider_event_id) DO NOTHING RETURNING id\`;

  res.status(200).end();                          // ack fast — processing is async

  if (inserted.length === 0) return;              // duplicate delivery: already have it
  await queue.publish("psp.events", { eventId: event.id });
});`,
        },
      },
      {
        heading: "Reconciliation: assume you are wrong",
        body: [
          "Your records and the provider's will disagree — because of timeouts, dropped webhooks, manual interventions, and provider-side adjustments. Reconciliation is the process that finds those disagreements before a customer or an auditor does.",
        ],
        steps: [
          {
            title: "Ingest the settlement file",
            text: "Providers publish a daily file of everything they believe happened, with their references and amounts. This is the external source of truth.",
          },
          {
            title: "Match by reference",
            text: "Join their records to yours on the provider reference. Most match exactly and need no attention.",
          },
          {
            title: "Classify the breaks",
            text: "In their file but not ours (a charge we never recorded — usually a lost webhook), in ours but not theirs (a payment stuck in UNKNOWN), or matched with different amounts (fees, currency conversion, partial capture).",
          },
          {
            title: "Auto-resolve the known patterns",
            text: "Most breaks have a mechanical explanation — a fee line, a timing difference across the day boundary. Encode those rules so humans only see the genuinely unexplained.",
          },
          {
            title: "Escalate the rest",
            text: "Anything unexplained goes to a queue a human works. The number of open breaks and their age are first-class operational metrics.",
          },
        ],
        table: {
          headers: ["Break type", "Likely cause", "Resolution"],
          rows: [
            [
              "In provider, not in ledger",
              "Webhook lost, or we timed out and never resolved",
              "Create the missing ledger entries from their record",
            ],
            [
              "In ledger, not in provider",
              "Payment stuck in UNKNOWN that actually failed",
              "Reverse with a compensating entry",
            ],
            [
              "Amount mismatch",
              "Fees, FX, or a partial capture",
              "Usually a rule; encode it and stop paging people",
            ],
            [
              "Duplicate in provider",
              "Double submission that idempotency did not catch",
              "Refund one and investigate the gap urgently",
            ],
            [
              "Timing difference",
              "Captured near midnight, settled the next day",
              "Match across a window, not a single day",
            ],
          ],
        },
        callout: {
          kind: "interview",
          text: "Volunteering reconciliation is one of the strongest signals in this question. Most candidates design the happy path and stop; anyone who has run a payment system knows the daily break report is where the real work lives.",
        },
      },
      {
        heading: "Security and compliance boundaries",
        bullets: [
          "Card data must never touch your servers. The client tokenises directly with the provider — via their hosted fields or SDK — and you only ever see a token. That is what keeps PCI scope small.",
          "Store the last four digits and the brand for display, nothing more. If you can decrypt a card number, you are in the highest compliance tier.",
          "Encrypt at rest, restrict access by role, and log every access to payment records. Access logs are an audit requirement, not a nice-to-have.",
          "Fraud checks belong before authorisation, as a separate service with its own latency budget and a fail-open or fail-closed policy you decide in advance.",
          "Strong customer authentication (3-D Secure) adds an asynchronous redirect into the flow, which means the payment state machine needs a pending-authentication state.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Double-entry ledger",
        pickWhen: "Always for money",
        cost: "More rows and more discipline; gains auditability and a checkable invariant",
      },
      {
        choice: "Strong consistency on the ledger",
        pickWhen: "Always",
        cost: "Lower availability during a partition — the correct trade for money",
      },
      {
        choice: "Synchronous authorisation",
        pickWhen: "The user is waiting and needs an answer",
        cost: "You inherit the provider's latency and its timeouts",
      },
      {
        choice: "Asynchronous capture",
        pickWhen: "Goods ship later; you want to authorise now and capture on fulfilment",
        cost: "Authorisations expire — typically after a week — and must be tracked",
      },
      {
        choice: "Multiple providers",
        pickWhen: "Provider outage is unacceptable, or routing by cost matters",
        cost: "Two integrations, two reconciliation processes, and unified reporting to build",
      },
      {
        choice: "Store the raw webhook payloads",
        pickWhen: "Always",
        cost: "Storage — and it is what makes replay after a handler bug possible",
      },
    ],
    wrapUp: [
      "The ledger is the system: append-only double-entry, integer minor units, balances derived by query, and a continuously checked invariant that every transaction sums to zero.",
      "Idempotency runs end to end — the client's key is claimed before the provider call, travels to the provider, and the stored response is replayed on retry.",
      "UNKNOWN is a first-class state. A timeout is not a decline, and resolving it by querying rather than retrying is what prevents double charges.",
      "Reconciliation against the provider's settlement file is not optional; the open-break count and age are operational metrics like any other.",
      "With another hour: multi-provider routing and failover, payouts and their own ledger accounts, and the fraud-check path with its latency budget.",
    ],
    followUps: [
      {
        q: "The provider call times out. What do you do?",
        a: "Move the payment to UNKNOWN and resolve it rather than guess. I query the provider by our idempotency key, which is why that key must travel downstream. If the query is inconclusive, the payment stays UNKNOWN until the settlement file resolves it. What I never do is treat a timeout as a decline and let the customer retry, because that is precisely how a double charge happens and it looks legitimate afterwards.",
      },
      {
        q: "Why a double-entry ledger rather than a balance column?",
        a: "Because a balance column has no history and no invariant. With double entry, every movement is two or more balanced rows, the balance is a sum, and I can check continuously that every transaction sums to zero — which catches almost every class of bug automatically. A corrected mistake becomes a reversing entry rather than an update, so the audit trail stays intact, and 'where did this money go' is a query.",
      },
      {
        q: "A webhook arrives twice, and out of order. How do you handle it?",
        a: "Deduplicate on the provider's event id with a unique constraint, and validate every state change against the transition table so an out-of-order event cannot move a payment backwards. If a 'captured' arrives before 'authorised', I either buffer it briefly or re-fetch the payment's current state from the provider rather than applying it blindly. Both duplicates and reordering are routine, not exceptional.",
      },
      {
        q: "How do you know the system is correct?",
        a: "Three continuous checks. The ledger invariant that every transaction sums to zero, run constantly with an alert on any violation. Daily reconciliation against the provider's settlement file, with the open-break count and age as tracked metrics. And a monotonically increasing audit log so no record is ever silently changed. Correctness in payments is something you monitor, not something you assume after testing.",
      },
      {
        q: "How do you handle refunds and chargebacks?",
        a: "Both are new transactions, never edits to the original. A refund creates ledger entries moving money back, referencing the original transaction, and it can be partial — which is exactly why a single status field is insufficient. A chargeback is initiated by the customer's bank and can arrive months later, even after a refund, so the state machine has to permit it from settled and refunded states, and the ledger records the disputed amount plus any fee separately.",
      },
    ],
    related: [
      "/hld/idempotency",
      "/examples/digital-wallet",
      "/hld/consistency",
      "/lld/repository",
    ],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
