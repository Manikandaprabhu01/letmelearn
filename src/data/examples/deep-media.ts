import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const mediaDeepExamples: DesignExample[] = [
  {
    slug: "netflix",
    title: "Design Netflix",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 22,
    tags: ["vod", "cdn", "encoding", "abr", "drm"],
    companies: ["Netflix", "Disney+", "Prime Video", "Max"],
    summary:
      "A catalogue of a few thousand titles serving a hundred million people is not a data problem — it is a bandwidth problem, and the answer is that the bytes never travel far. Netflix's actual architecture puts appliances inside internet providers' networks so a stream crosses a few kilometres rather than an ocean. The control plane is small and ordinary; the interesting content is encoding ladders, adaptive bitrate, and why catalogue immutability makes this far easier than user-generated video.",
    clarifying: [
      {
        q: "Is the catalogue user-generated or curated?",
        a: "Curated, which is an enormous simplification over something like YouTube. A few tens of thousands of titles means every one can be encoded exhaustively ahead of time, pre-positioned close to viewers, and treated as immutable — none of which is possible when users upload continuously.",
      },
      {
        q: "Live or video on demand?",
        a: "On demand. Live changes everything — you cannot pre-encode, cannot pre-position, and latency suddenly matters — so I would scope to VOD and say clearly where live diverges.",
      },
      {
        q: "How many device types and network conditions?",
        a: "Everything from a phone on a poor mobile connection to a 4K television on fibre. That range is precisely why adaptive bitrate exists and why the encoding ladder has many rungs.",
      },
      {
        q: "Does content need protection?",
        a: "Yes — licensing requires DRM, which constrains the player, the packaging and the key delivery path. It is worth naming because it rules out simply serving files from a bucket.",
      },
      {
        q: "What is the read-to-write ratio?",
        a: "Essentially infinite. A title is encoded once and streamed hundreds of millions of times, so almost any amount of preprocessing is justified if it saves bandwidth or improves playback.",
      },
    ],
    requirements: {
      functional: [
        "Browse a catalogue and play a title from any device",
        "Adapt quality continuously to available bandwidth",
        "Resume playback across devices from the same position",
        "Enforce content protection and regional licensing",
      ],
      nonFunctional: [
        "Playback starts in about two seconds and does not stall",
        "Bandwidth cost minimised — it dominates everything else",
        "Availability over freshness: serving a slightly stale catalogue beats an error",
        "Quality degrades smoothly on a poor connection rather than buffering",
      ],
    },
    math: [
      {
        label: "Peak egress",
        expr: "100 M concurrent-ish viewers × ~5 Mbps",
        result: "≈ 500 Tbps at full peak",
        note: "Far beyond any origin. This number alone dictates the entire distribution architecture.",
      },
      {
        label: "Encoding cost per title",
        expr: "~15 bitrate rungs × several codecs",
        result: "hours of compute, once",
        note: "Trivially justified — it is amortised over hundreds of millions of streams.",
      },
      {
        label: "Storage per title",
        expr: "2 h × 15 renditions × varying bitrates",
        result: "≈ 50–150 GB per title",
        note: "A catalogue of 20,000 titles is only a few petabytes — small compared with the bandwidth it serves.",
      },
      {
        label: "Catalogue vs user content",
        expr: "20 K titles vs YouTube's hourly uploads",
        result: "≈ 10⁶× smaller",
        note: "Which is why the whole catalogue can be pre-positioned and the popular part cached at the edge.",
      },
      {
        label: "Cache concentration",
        expr: "top ~2% of titles",
        result: "≈ 80% of viewing",
        note: "So a modest appliance inside an ISP serves the overwhelming majority of local demand.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/catalog/browse?profile={}",
        desc: "Personalised rows; heavily cached and precomputed, not ranked per request",
      },
      {
        method: "POST",
        path: "/v1/playback/start",
        desc: "Returns the manifest URL, DRM licence token and resume position",
      },
      {
        method: "GET",
        path: "/manifest/{titleId}.mpd",
        desc: "The rendition ladder — what the player uses to choose quality",
      },
      {
        method: "GET",
        path: "/segments/{titleId}/{rendition}/{n}.m4s",
        desc: "One segment of a few seconds — served from the nearest cache",
      },
      {
        method: "POST",
        path: "/v1/playback/heartbeat",
        desc: "Position and quality telemetry; drives resume and quality monitoring",
      },
      {
        method: "POST",
        path: "/v1/drm/license",
        desc: "Decryption key, bound to device and entitlement",
      },
    ],
    dataModel: [
      {
        entity: "titles",
        fields: [
          "title_id (pk)",
          "metadata (name, synopsis, cast, artwork)",
          "available_regions[]",
          "license_window (start, end)",
          "→ small, cacheable, changes rarely",
        ],
      },
      {
        entity: "renditions",
        fields: [
          "title_id, rendition_id (pk)",
          "codec, resolution, bitrate",
          "segment_manifest_url",
          "→ the encoding ladder; immutable once produced",
        ],
      },
      {
        entity: "playback_state",
        fields: [
          "profile_id, title_id (pk)",
          "position_seconds, updated_at",
          "device_id",
          "→ tiny, write-heavy, eventually consistent across devices",
        ],
      },
      {
        entity: "entitlements",
        fields: [
          "account_id (pk)",
          "plan, max_streams, regions[]",
          "→ checked at playback start, not per segment",
        ],
      },
    ],
    architecture: [
      {
        heading: "The bytes do not travel",
        lede: "This is the whole design, and it is unusual enough to lead with.",
        diagram: {
          kind: "system",
          caption: "Control plane in the cloud; data plane inside the viewer's ISP.",
          columns: [
            {
              title: "Control (small)",
              nodes: [
                { id: "api", label: "API", sub: "auth, entitlement" },
                { id: "cat", label: "Catalogue", sub: "cached hard" },
                { id: "rec", label: "Recommendations", sub: "precomputed rows" },
              ],
            },
            {
              title: "Preparation (offline)",
              nodes: [
                { id: "enc", label: "Encoding farm", sub: "ladder per title" },
                { id: "pkg", label: "Packager + DRM", sub: "segments, encrypted" },
                {
                  id: "pos",
                  label: "Pre-positioning",
                  sub: "push ahead of demand",
                  tone: "accent",
                },
              ],
            },
            {
              title: "Data plane (huge)",
              nodes: [
                { id: "isp", label: "ISP appliances", sub: "inside the network", tone: "ok" },
                { id: "cdn", label: "Public CDN", sub: "fallback" },
                { id: "org", label: "Origin", sub: "rarely touched" },
              ],
            },
          ],
        },
        bullets: [
          "Placing caching appliances inside internet providers' networks means a stream typically never crosses the public internet backbone at all — better for the viewer, dramatically cheaper for everyone, and the reason this scale is affordable.",
          "Content is pushed to those caches before it is popular, during off-peak hours, using predictions of what each region will watch. That is only possible because the catalogue is curated and known in advance.",
          "The control plane — authentication, catalogue, entitlement, recommendations — is a small, ordinary service. Confusing its scale with the data plane's is the usual mistake.",
          "Recommendation rows are precomputed per profile rather than ranked at request time, so browsing is a cache read rather than a model invocation.",
        ],
        callout: {
          kind: "interview",
          title: "The observation that reframes the problem",
          text: '"Five hundred terabits per second cannot be served from any origin or even from a conventional CDN economically. So the content is pushed into appliances sitting inside ISP networks before anyone asks for it — the catalogue is small and known in advance, which makes pre-positioning possible. The API is a normal service; the distribution network is the design."',
        },
      },
      {
        heading: "The encoding ladder and adaptive bitrate",
        lede: "Encode every rung once; let the player choose continuously.",
        diagram: {
          kind: "sequence",
          caption: "The player, not the server, decides quality — every few seconds.",
          actors: [
            { id: "p", label: "Player" },
            { id: "cdn", label: "Edge cache" },
            { id: "api", label: "Playback API" },
          ],
          messages: [
            { from: "p", to: "api", label: "1. start playback", kind: "call" },
            {
              from: "api",
              to: "p",
              label: "2. manifest + DRM licence + resume position",
              kind: "return",
            },
            {
              from: "p",
              to: "cdn",
              label: "3. fetch low rung first — start fast",
              kind: "call",
              tone: "accent",
            },
            { from: "p", to: "p", label: "4. measure throughput and buffer depth", kind: "self" },
            {
              from: "p",
              to: "cdn",
              label: "5. step up to a higher rung",
              kind: "call",
              tone: "ok",
            },
            {
              from: "p",
              to: "p",
              label: "6. bandwidth drops — step down before the buffer empties",
              kind: "self",
              tone: "warn",
            },
            {
              from: "p",
              to: "api",
              label: "7. heartbeat: position, quality, stalls",
              kind: "async",
            },
          ],
        },
        bullets: [
          "Start at a low rung so playback begins in about two seconds, then climb. Starting high looks better in a demo and produces a slow, stalling start in reality.",
          "Stepping down must be prompt and stepping up cautious. A stall is far more damaging to perceived quality than a few seconds at a lower resolution, and the asymmetry should be explicit in the algorithm.",
          "Per-title encoding beats a fixed ladder: an animated film and a dark action sequence have completely different complexity, so choosing bitrates per title saves substantial bandwidth at the same visual quality.",
          "Segments of a few seconds are the unit of everything — caching, switching rungs, and recovering from a failed request — which is why the ladder is expressed as aligned segment sequences.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Why this is easier than user-generated video",
        body: [
          "The comparison with YouTube is the most useful way to show understanding, because almost every simplification here comes from the same source: the catalogue is small, known and immutable.",
        ],
        table: {
          caption: "Same media pipeline, opposite constraints.",
          headers: ["Concern", "Curated catalogue", "User-generated"],
          rows: [
            ["Ingest rate", "A few titles a day", "Hundreds of hours per minute"],
            ["Encoding", "Exhaustive, per-title optimised", "Fast, generic, cost-constrained"],
            [
              "Pre-positioning",
              "Possible — demand is predictable",
              "Impossible — most uploads are never watched",
            ],
            ["Popularity", "Known in advance, marketed", "Unpredictable and extremely long-tailed"],
            ["Moderation", "Licensed and reviewed", "A large ongoing system of its own"],
            ["Cache hit rate", "Very high", "Poor in the tail"],
          ],
        },
        bullets: [
          "The long tail is the real difference. A user-generated platform must store and serve millions of videos almost nobody watches, so caching cannot help and storage tiering becomes essential.",
          "Because demand is predictable here, capacity can be planned around a known release schedule rather than reacting to unpredictable virality.",
          "Immutability means a title's segments can be cached with effectively infinite lifetimes, so there is no invalidation problem at all.",
          "The recommendation problem is genuinely harder in some ways — with a small catalogue, the goal is to surface the right few titles rather than to filter an ocean.",
        ],
      },
      {
        heading: "Playback state and the small, annoying problems",
        body: [
          "The control plane is ordinary but not trivial, and the parts users notice most are the small ones: resuming in the right place, on the right profile, without a stale position overwriting a newer one.",
        ],
        bullets: [
          "Position updates are frequent, tiny and lossy-tolerant, so they belong in a fast store with periodic durable checkpointing rather than a database write every few seconds.",
          "Resolve conflicts by taking the latest update per profile and device rather than by naive last-write-wins, since a paused device can send a stale position long after another has moved on.",
          "Concurrent stream limits are an entitlement check at playback start with a lease, not a per-segment check — checking every segment would put the control plane on the data path.",
          "Profiles rather than accounts are the unit for history and recommendations, which matters more than it sounds: a shared household account with one history produces visibly poor recommendations.",
        ],
      },
      {
        heading: "Content protection and regional licensing",
        body: [
          "DRM and regional rights are not incidental compliance details — they constrain the architecture, because they are why content cannot simply be static files on a public CDN.",
        ],
        bullets: [
          "Segments are encrypted at packaging time and the key is delivered separately, bound to the device and the entitlement, so cached segments are useless without a licence.",
          "That separation is what preserves cacheability: the encrypted bytes are identical for everyone and cache perfectly, while the personalised part is a small licence request.",
          "Licensing windows and regional rights mean the catalogue is a function of region and date, so availability must be evaluated per request rather than baked into a global cached response.",
          "Multiple DRM systems are required across platforms, which in practice means packaging each title several ways — another cost that is only tolerable because it happens once per title.",
        ],
        callout: {
          kind: "insight",
          text: "The recurring theme is that everything expensive happens once, offline, per title — encoding, packaging, pre-positioning — and everything on the request path is a cache read. That is only possible because the catalogue is small and immutable, and it is the cleanest example in the collection of trading preparation cost for serving cost.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Appliances inside ISP networks",
        pickWhen: "Sustained enormous egress to a predictable catalogue",
        cost: "Hardware deployed and operated inside third-party networks",
      },
      {
        choice: "Per-title encoding ladders",
        pickWhen: "Content is watched enough to amortise the analysis",
        cost: "Much more encoding compute than a fixed ladder",
      },
      {
        choice: "Start low and climb",
        pickWhen: "Always — fast start beats initial quality",
        cost: "The first seconds are visibly lower quality",
      },
      {
        choice: "Precomputed recommendation rows",
        pickWhen: "Browsing must be instant",
        cost: "Rows are hours stale and cannot reflect the current session",
      },
      {
        choice: "Encrypt once, licence per device",
        pickWhen: "DRM is required",
        cost: "A licence service on the playback-start path",
      },
      {
        choice: "Position state in a fast store",
        pickWhen: "Frequent small updates",
        cost: "A crash can lose a few seconds of position",
      },
    ],
    wrapUp: [
      "Peak egress in the hundreds of terabits per second means the bytes cannot travel far, so caching appliances live inside ISP networks and content is pushed there before demand arrives.",
      "That pre-positioning is only possible because the catalogue is curated, small and immutable — which is the single biggest difference from user-generated video and worth stating explicitly.",
      "Everything expensive happens once per title offline: encoding a ladder, packaging with DRM, distributing to caches. The request path is a cache read.",
      "Adaptive bitrate puts the quality decision in the player, starting low for a fast start, stepping down promptly and up cautiously because a stall costs more than a lower resolution.",
      "The control plane — catalogue, entitlement, recommendations, playback position — is a small ordinary service, and confusing its scale with the data plane's is the common error.",
      "DRM is why this cannot be static files on a public CDN, and separating encrypted segments from per-device licences is what keeps the bytes perfectly cacheable.",
    ],
    followUps: [
      {
        q: "Why not just use a normal CDN?",
        a: "At this scale the economics and the physics both push further. Peak demand is in the hundreds of terabits per second, concentrated into evening hours in each region, and pushing that through commercial CDN capacity across internet backbones is both extremely expensive and hard on the networks in between. Placing appliances directly inside internet providers' networks means the stream travels a very short distance, never crossing a peering point, which is cheaper for us, better for the provider's transit costs, and lower latency for the viewer. The reason it is possible at all is that the catalogue is small and known ahead of time, so content can be pushed out during off-peak hours before anyone requests it. A public CDN remains the fallback where no appliance exists.",
      },
      {
        q: "How is this different from designing YouTube?",
        a: "Almost every simplification here traces back to the catalogue being curated. A few tens of thousands of known titles can be encoded exhaustively with per-title optimised bitrate ladders, packaged for multiple DRM systems, and pre-positioned near viewers based on predicted demand. User-generated video inverts all of that: hundreds of hours uploaded per minute means encoding must be fast and cheap rather than optimal, most uploads are watched by almost nobody so pre-positioning is impossible and the long tail defeats caching, popularity is unpredictable, and moderation becomes a major system in its own right. The media pipeline looks similar on a diagram, but the constraints are opposite, and the honest answer names that rather than presenting one design for both.",
      },
      {
        q: "How does the player decide what quality to stream?",
        a: "It decides continuously, itself, from the manifest listing the available rungs. It starts deliberately low so playback begins within a couple of seconds, then measures actual throughput and how full its buffer is, and steps up when there is comfortable headroom. The asymmetry matters: stepping down happens quickly at the first sign of trouble, while stepping up is cautious, because a stall damages perceived quality far more than a few seconds at a lower resolution. Putting the decision in the player rather than the server is what makes it work across wildly different devices and networks without any server-side state. The rungs themselves are chosen per title rather than from a fixed ladder, since visual complexity varies enormously and that saves real bandwidth at equal quality.",
      },
      {
        q: "A new season launches at midnight and everyone watches at once. What happens?",
        a: "Very little, because this is the predictable case the architecture is built for. The content was encoded and pushed out to appliances inside ISP networks days beforehand during off-peak hours, so the launch does not generate origin traffic at all — the bytes are already sitting a few kilometres from the viewers. What does spike is the control plane: playback-start calls, entitlement checks, licence requests and catalogue browsing, all of which are small requests that scale horizontally in the ordinary way. This is the clearest illustration of the split worth emphasising — the part that spikes is cheap and conventional, and the part that is enormous was moved off the critical path entirely by doing the work in advance.",
      },
      {
        q: "Why encrypt segments if they are cached everywhere?",
        a: "Precisely because they are cached everywhere. Licensing requires that content cannot simply be downloaded and redistributed, and the segments sit in caches inside third-party networks and in browser caches, so the bytes themselves must be useless without authorisation. Encrypting at packaging time and delivering the decryption key separately, bound to the device and the account's entitlement, achieves both goals simultaneously: every viewer receives byte-identical encrypted segments that cache perfectly, while the personalised, non-cacheable part is a small licence request at playback start. If instead access control were applied to the segments themselves, every request would need authorisation and the caching model — which is the entire basis of the design — would collapse.",
      },
    ],
    related: [
      "/examples/youtube",
      "/examples/spotify",
      "/hld/cdn",
      "/examples/object-storage",
      "/hld/caching",
    ],
    furtherReading: [
      {
        label: "Netflix Open Connect — appliances inside ISP networks",
        href: "https://openconnect.netflix.com/en/",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "spotify",
    title: "Design Spotify",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["streaming", "catalog", "audio", "offline", "recommendations"],
    companies: ["Spotify", "Apple Music", "YouTube Music", "Deezer"],
    summary:
      "Audio is a thousand times smaller than video, which removes the bandwidth problem entirely and moves the difficulty somewhere unexpected: the catalogue is a hundred million tracks with an extreme long tail, playback must feel instantaneous, offline listening means encrypted local caching with licence expiry, and every single play generates a royalty obligation that must be counted accurately. It is a metadata and accounting problem wearing a streaming costume.",
    clarifying: [
      {
        q: "How large is the catalogue?",
        a: "Around a hundred million tracks, with a very long tail — most are played rarely, a small fraction accounts for most listening. That distribution is what makes caching effective while still requiring the whole catalogue to be available.",
      },
      {
        q: "Is offline listening required?",
        a: "Yes, and it is more consequential than it sounds: it means encrypted local storage, a licence with an expiry that must be renewed, and play counts that are recorded offline and reconciled later.",
      },
      {
        q: "How exactly must plays be counted?",
        a: "Exactly enough to pay royalties on, which makes this an accounting problem. A play above a threshold duration is a payable event, so the counting path needs deduplication and an audit trail rather than best-effort telemetry.",
      },
      {
        q: "How fast must playback start?",
        a: "Effectively instantly — a couple of hundred milliseconds. Users skip constantly, so start latency is the single most noticeable quality metric, far more than audio bitrate.",
      },
      {
        q: "Do we need social and playlist features?",
        a: "Playlists yes, since they are the primary navigation mechanism and a collaborative playlist introduces genuine concurrent-editing questions. I would treat deep social features as out of scope.",
      },
    ],
    requirements: {
      functional: [
        "Search and browse a catalogue of ~100 M tracks",
        "Stream audio with near-instant start and gapless transitions",
        "Create and share playlists, including collaborative ones",
        "Download for offline playback with licence expiry",
      ],
      nonFunctional: [
        "Playback starts in ~200 ms",
        "Plays counted accurately enough for royalty accounting",
        "Catalogue search and browse feel instant",
        "Offline playback works for a defined period without connectivity",
      ],
    },
    math: [
      {
        label: "Track size",
        expr: "3.5 min at 160 kbps",
        result: "≈ 4 MB",
        note: "Three orders of magnitude smaller than a video. The entire bandwidth problem disappears.",
      },
      {
        label: "Catalogue storage",
        expr: "100 M tracks × ~4 renditions × 4 MB",
        result: "≈ 1.6 PB",
        note: "Large but unremarkable — comparable to a single popular video service's daily ingest.",
      },
      {
        label: "Peak egress",
        expr: "10 M concurrent × 160 kbps",
        result: "≈ 1.6 Tbps",
        note: "Two orders of magnitude below video streaming, so a standard CDN handles it comfortably.",
      },
      {
        label: "Play events",
        expr: "500 M plays/day ÷ 10⁵",
        result: "≈ 6,000/s, peak ~25,000/s",
        note: "Each one is a payable royalty event, which is why this path needs accounting rigour.",
      },
      {
        label: "Long tail",
        expr: "top ~1% of tracks",
        result: "≈ 80–90% of plays",
        note: "So a small cache serves most listening while the full catalogue must remain available.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/search?q={}&type=track,album,artist",
        desc: "Catalogue search — the primary navigation path, heavily cached",
      },
      {
        method: "POST",
        path: "/v1/playback/prepare",
        desc: "Returns the stream URL and licence; called predictively for the next track",
      },
      {
        method: "GET",
        path: "/audio/{trackId}/{rendition}",
        desc: "Audio stream — CDN-served, immutable, cached indefinitely",
      },
      {
        method: "POST",
        path: "/v1/plays",
        desc: "Play event with a client-generated id; batched, idempotent, buffered offline",
      },
      {
        method: "PATCH",
        path: "/v1/playlists/{id}",
        desc: "Playlist edit — ordered list with concurrent-edit semantics",
      },
      {
        method: "POST",
        path: "/v1/downloads/{trackId}",
        desc: "Offline licence with expiry; audio stored encrypted on the device",
      },
    ],
    dataModel: [
      {
        entity: "tracks",
        fields: [
          "track_id (pk)",
          "album_id, artist_ids[] (idx)",
          "duration_ms, isrc",
          "available_markets[]",
          "→ small, immutable, aggressively cached",
        ],
      },
      {
        entity: "renditions",
        fields: [
          "track_id, quality (pk)",
          "codec, bitrate, cdn_url",
          "→ a handful per track; immutable",
        ],
      },
      {
        entity: "playlists",
        fields: [
          "playlist_id (pk)",
          "owner_id, is_collaborative",
          "items[] (track_id, added_by, position)",
          "version (for concurrent edits)",
        ],
      },
      {
        entity: "play_events",
        fields: [
          "event_id (pk, client-generated)",
          "user_id, track_id, played_ms",
          "occurred_at, reported_at",
          "context (playlist|album|radio)",
          "→ append-only; the royalty audit trail",
        ],
      },
      {
        entity: "offline_licenses",
        fields: [
          "user_id, track_id (pk)",
          "expires_at (idx)",
          "key_id",
          "→ renewed when the device connects",
        ],
      },
    ],
    architecture: [
      {
        heading: "Small files change everything",
        lede: "Say what this is not, then spend the time on what it is.",
        diagram: {
          kind: "compare",
          caption: "The audio-versus-video distinction determines where the difficulty sits.",
          options: [
            {
              title: "Video streaming",
              sub: "gigabytes per hour",
              good: ["Adaptive bitrate genuinely essential", "Bandwidth is the dominant cost"],
              bad: [
                "Needs ISP-level caching infrastructure",
                "Encoding is a major expense per title",
              ],
              verdict: "The bandwidth problem dominates and shapes the architecture.",
            },
            {
              title: "Audio streaming",
              sub: "a few megabytes per track",
              tone: "ok",
              good: [
                "A whole track can be prefetched during the previous one",
                "An ordinary CDN handles peak load comfortably",
                "Quality switching is rarely needed mid-track",
              ],
              bad: [
                "A hundred million items means the catalogue itself is the hard part",
                "Every play is a royalty obligation to account for",
              ],
              verdict: "The difficulty moves to catalogue scale, start latency and accounting.",
            },
          ],
        },
        bullets: [
          "Because a track is a few megabytes, the client can fetch the next one in full while the current is playing — which is how gapless playback and instant skips are achieved rather than through clever streaming.",
          "Audio files are immutable and cache with indefinite lifetimes, so there is no invalidation story and hit rates are extremely high for popular content.",
          "The catalogue is the genuinely large dataset: a hundred million tracks with rich relationships between artists, albums, and versions, all of which must be searchable instantly.",
          "Quality selection happens mostly at track start based on connection and subscription tier, rather than continuously adapting mid-playback as video requires.",
        ],
        callout: {
          kind: "interview",
          title: "Reframe it early",
          text: '"A track is about four megabytes, so this is not a bandwidth problem — a standard CDN handles peak load and the client can prefetch entire tracks. The real problems are a hundred-million-item catalogue that must be searchable instantly, a two-hundred-millisecond start budget because people skip constantly, offline playback with licence expiry, and the fact that every play is a royalty payment that has to be counted accurately."',
        },
      },
      {
        heading: "The 200 ms start budget",
        lede: "Users skip constantly, so start latency is the quality metric that matters most.",
        diagram: {
          kind: "sequence",
          caption: "The next track is usually already on the device before it is requested.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "Playback API" },
            { id: "cdn", label: "CDN" },
          ],
          messages: [
            {
              from: "c",
              to: "api",
              label: "1. prepare(nextTrack) — while current plays",
              kind: "call",
              tone: "accent",
            },
            { from: "api", to: "c", label: "2. stream URL + licence", kind: "return" },
            {
              from: "c",
              to: "cdn",
              label: "3. prefetch the first seconds, then the rest",
              kind: "async",
            },
            { from: "c", to: "c", label: "4. user taps skip", kind: "self" },
            {
              from: "c",
              to: "c",
              label: "5. play immediately from local buffer — no network",
              kind: "self",
              tone: "ok",
            },
            {
              from: "c",
              to: "api",
              label: "6. play event for the skipped track (batched)",
              kind: "async",
            },
          ],
        },
        bullets: [
          "Prediction is what buys the latency: in a playlist or album the next track is known, so it is fetched during the current one and a skip costs nothing.",
          "Fetch the first few seconds at higher priority than the remainder, so playback can begin before the whole file arrives even when prediction fails.",
          "Keep a local cache of recently and frequently played tracks. Repeat listening is extremely common, and a cache hit makes start latency effectively zero.",
          "Shuffle and radio defeat naive prediction, so the client should prefetch a small set of likely candidates rather than exactly one.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Counting plays is an accounting problem",
        lede: "Each play is money owed to a rights holder, which changes the standard of correctness.",
        bullets: [
          "A play is payable above a threshold — conventionally around thirty seconds — so the event must carry actual listened duration rather than merely that playback started.",
          "Events are generated with client-side identifiers, buffered on the device, and uploaded in batches, which means the ingestion path must be idempotent because retries and offline replay are routine.",
          "Offline listening produces events hours or days late, so the aggregation must handle late arrival with the same event-time reasoning as ad-click aggregation — this is the same problem in different clothing.",
          "Fraud detection is required: artificially inflated play counts are a real and financially motivated attack, so anomaly detection and retrospective invalidation must exist, which means aggregates have to be restatable.",
        ],
        callout: {
          kind: "warn",
          title: "The same shape as ad clicks",
          text: "Royalty counting has every characteristic of the ad-click problem: event-time aggregation, late arrival from offline devices, idempotency under retries, fraud requiring retrospective correction, and an audit trail because the numbers turn into payments. The right move in an interview is to notice the similarity out loud rather than re-deriving it, then spend the time on what is specific here — the thirty-second threshold and offline reconciliation.",
        },
      },
      {
        heading: "Offline playback",
        body: [
          "Downloading is not simply caching a file: the content is licensed, so it must be encrypted at rest and must stop working when the licence lapses, all while the device may be offline for weeks.",
        ],
        bullets: [
          "Audio is stored encrypted with a key tied to a licence that carries an expiry, typically around thirty days, renewed silently whenever the device connects.",
          "Expiry must be enforced locally against a monotonic time source, or a user can extend a licence indefinitely by changing the device clock.",
          "Play events accumulated offline are uploaded on reconnection with their original timestamps, which is exactly why the counting pipeline aggregates by event time rather than arrival.",
          "Download limits per account and device are an entitlement concern, checked at download time rather than at playback, so offline playback never needs the network.",
        ],
      },
      {
        heading: "Catalogue, search and playlists",
        body: [
          "A hundred million tracks with messy real-world metadata is the largest dataset here, and the quality problems are as much editorial as technical.",
        ],
        table: {
          caption: "Why catalogue work is harder than it looks.",
          headers: ["Problem", "Example", "Consequence"],
          rows: [
            [
              "Duplicate releases",
              "The same song on single, album and compilation",
              "Plays split across entities; royalties misattributed",
            ],
            [
              "Artist disambiguation",
              "Many artists share a name",
              "Wrong artist page, wrong recommendations",
            ],
            [
              "Regional availability",
              "Licensed in some markets only",
              "Availability must be evaluated per request",
            ],
            [
              "Metadata quality",
              "Inconsistent spellings and credits",
              "Search misses; poor browse experience",
            ],
            ["Takedowns", "Rights withdrawn", "Tracks must disappear from playlists gracefully"],
          ],
        },
        bullets: [
          "Search is the primary navigation path, so it needs typo tolerance and must handle a query matching an artist, an album and a track simultaneously with sensible ranking between types.",
          "Collaborative playlists are genuinely concurrent: two people reordering simultaneously need convergent semantics, and position-based indices conflict badly — stable item identifiers with relative ordering behave far better.",
          "A track becoming unavailable must degrade gracefully, staying visible in the playlist as unplayable rather than silently vanishing, because silent removal looks like data loss to the user.",
          "Regional licensing means the catalogue is a function of market, so availability is filtered per request and cached per region rather than globally.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Prefetch whole tracks",
        pickWhen: "Always — files are small enough",
        cost: "Wasted bandwidth when the user skips unpredictably",
      },
      {
        choice: "Standard CDN rather than custom infrastructure",
        pickWhen: "Audio-scale egress",
        cost: "None meaningful; the video answer would be over-engineering",
      },
      {
        choice: "Client-buffered, batched play events",
        pickWhen: "Offline support and skip-heavy usage",
        cost: "Late arrival, requiring event-time aggregation and idempotency",
      },
      {
        choice: "Encrypted offline downloads with expiry",
        pickWhen: "Licensed content",
        cost: "Key management and local clock-tampering defences",
      },
      {
        choice: "Stable item ids in playlists",
        pickWhen: "Collaborative editing",
        cost: "More complex than a simple ordered array",
      },
      {
        choice: "Per-region catalogue filtering",
        pickWhen: "Licensing varies by market — always",
        cost: "Cache keys multiply by region",
      },
    ],
    wrapUp: [
      "A track is about four megabytes, so bandwidth is not the problem — an ordinary CDN suffices and the client can prefetch entire tracks, which is what makes skips instant.",
      "The two-hundred-millisecond start budget is met by prediction and local caching rather than by streaming cleverness, because users skip constantly.",
      "Every play is a royalty obligation, so counting is an accounting problem with a duration threshold, idempotent ingestion, event-time aggregation and retrospective fraud correction — structurally the same as ad-click aggregation.",
      "Offline playback means encrypted local storage with an expiring licence enforced against a monotonic clock, and play events that arrive days late.",
      "The catalogue is the largest and messiest dataset: duplicates, artist ambiguity, regional licensing and takedowns are as much editorial problems as technical ones.",
      "Collaborative playlists need convergent ordering with stable item identifiers, and unavailable tracks should degrade visibly rather than disappearing.",
    ],
    followUps: [
      {
        q: "How do you make playback start in 200 milliseconds?",
        a: "Mostly by having already started. In a playlist or album the next track is known, so the client fetches it during the current one — and because a track is only a few megabytes, it can hold the whole thing, meaning a skip plays from local memory with no network involved at all. When prediction fails, as it does with shuffle or search, the client requests the first few seconds at higher priority than the rest so playback begins before the full file arrives. On top of that, a local cache of recently and frequently played tracks handles repeat listening, which is extremely common. The general point is that the latency budget is met by moving work earlier rather than by making the request faster.",
      },
      {
        q: "How is this different from designing Netflix?",
        a: "The file size changes which problem is hard. A track is about four megabytes against gigabytes per hour for video, so peak egress is a couple of terabits rather than hundreds — well within an ordinary CDN, with no need for appliances inside ISP networks and no real adaptive bitrate, since a whole track can simply be prefetched. What gets harder is everything else: the catalogue is a hundred million items rather than tens of thousands, with a long tail, messy metadata and per-market licensing; start latency matters far more because people skip constantly; offline playback with expiring licences is expected; and every single play is a royalty payment that must be counted accurately. The streaming part is easier and the accounting and catalogue parts are much harder.",
      },
      {
        q: "A user listens offline for a week. How do the plays get counted?",
        a: "The client records each play locally with a client-generated event identifier, the track, the actual listened duration and the true timestamp, then uploads them in batches when connectivity returns. The ingestion path must be idempotent on that identifier, because retries and partial uploads are routine, and the aggregation must bucket by the original event time rather than arrival time — otherwise a week of listening would all land in one day's royalty figures. That is the same event-time and late-arrival reasoning as ad-click aggregation, which is worth naming rather than re-deriving. The one piece specific here is the payable threshold: only plays past roughly thirty seconds count, so the event carries duration rather than merely the fact that playback began.",
      },
      {
        q: "What stops someone keeping downloaded tracks forever?",
        a: "The audio is stored encrypted and the key is tied to a licence with an expiry, typically around thirty days, which the app renews silently whenever the device connects. If the device never connects again, the licence lapses and the downloaded files become unplayable even though the bytes are still present. The subtlety worth mentioning is that expiry has to be checked against a monotonic time source rather than the device's wall clock, because otherwise a user can simply set the clock back and extend the licence indefinitely — a genuinely common attack on offline licensing. Download limits are enforced at download time as an entitlement check, deliberately not at playback, so offline listening never requires the network.",
      },
      {
        q: "Two people edit a collaborative playlist at the same time. What happens?",
        a: "It depends entirely on how positions are represented, and naive position indices behave badly: if one person inserts at index three while another removes index one, applying both against absolute positions produces an order neither intended. The better model gives every item a stable identifier and expresses ordering relatively, so an insert is anchored between two known items rather than at a numeric slot, and concurrent edits converge to a sensible result. Additions and removals are naturally idempotent when keyed on the item identifier. This is a lighter version of the collaborative editing problem — a playlist is a short ordered list edited occasionally, not a document edited character by character — so it does not need full operational transformation, but it does need more than an array and last-write-wins.",
      },
    ],
    related: [
      "/examples/netflix",
      "/examples/youtube",
      "/examples/ad-click",
      "/hld/cdn",
      "/examples/google-search",
    ],
    furtherReading: [
      {
        label: "algomaster — design Spotify",
        href: "https://algomaster.io/learn/system-design-interviews/design-spotify",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },

  {
    slug: "zoom",
    title: "Design Zoom",
    source: "Source 6",
    difficulty: "advanced",
    minutes: 22,
    tags: ["webrtc", "sfu", "realtime", "media", "udp"],
    companies: ["Zoom", "Google Meet", "Microsoft Teams", "Discord"],
    summary:
      "The only design here where losing data is the correct behaviour. Video is sent over UDP because a retransmitted frame arrives too late to be useful — by the time it gets there, the moment has passed. The architectural crux is topology: peer-to-peer collapses past three participants, mixing everything on a server costs far too much CPU, and the answer almost everyone lands on is a selective forwarding unit that routes streams without decoding them.",
    clarifying: [
      {
        q: "How many participants per meeting?",
        a: "Up to a few hundred active, and thousands for webinar-style broadcast. That range matters because the right topology changes with size — what works for three people is completely wrong for three hundred.",
      },
      {
        q: "What latency is acceptable?",
        a: "Under about 150 milliseconds one way for conversation to feel natural; beyond roughly 400 people start talking over each other. That budget is what rules out anything requiring retransmission or buffering.",
      },
      {
        q: "Do we need recording, transcription and screen sharing?",
        a: "Yes, and recording is architecturally significant because it is the one consumer that genuinely needs decoded, composited media — which the forwarding design otherwise avoids entirely.",
      },
      {
        q: "How important is end-to-end encryption?",
        a: "Important, and it directly conflicts with server-side features: a server that cannot decrypt cannot record, transcribe or composite. That trade should be stated rather than glossed over.",
      },
      {
        q: "What network conditions should we assume?",
        a: "Poor and variable — mobile connections, congested home links, restrictive corporate firewalls. Degrading gracefully is the primary quality requirement, not peak fidelity.",
      },
    ],
    requirements: {
      functional: [
        "Multi-party audio and video with screen sharing",
        "Join from browsers and native apps across networks and firewalls",
        "Optional server-side recording and transcription",
        "Adapt quality per participant to their own network conditions",
      ],
      nonFunctional: [
        "End-to-end latency under ~150 ms",
        "Degrade smoothly under packet loss rather than freezing",
        "Scale to hundreds of participants in one meeting",
        "Work from restrictive networks where UDP may be blocked",
      ],
    },
    math: [
      {
        label: "Mesh connection growth",
        expr: "n(n−1)/2 peer connections",
        result: "3 people → 3; 10 → 45; 50 → 1,225",
        note: "Each participant uploads n−1 copies of their own stream. Uplink is what breaks first, and it breaks fast.",
      },
      {
        label: "Upstream in a mesh",
        expr: "10 participants × 1.5 Mbps each",
        result: "≈ 13.5 Mbps upload per person",
        note: "Far beyond typical home upload capacity. This is why mesh dies past three or four people.",
      },
      {
        label: "SFU bandwidth",
        expr: "each sends 1 up, receives n−1 down",
        result: "1.5 Mbps up regardless of meeting size",
        note: "The upload stays constant no matter how many people join — the key property of forwarding.",
      },
      {
        label: "MCU CPU cost",
        expr: "decode n streams, composite, re-encode per participant",
        result: "≈ 1 core per few participants",
        note: "Orders of magnitude more expensive than forwarding, which is packet routing.",
      },
      {
        label: "Latency budget",
        expr: "capture + encode + network + jitter buffer + decode",
        result: "≈ 20 + 20 + 40 + 40 + 20 ms",
        note: "Roughly 140 ms with nothing to spare, which is why a retransmission round trip does not fit.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/meetings",
        desc: "Create a meeting; returns an id, join credentials and the assigned media region",
      },
      {
        method: "WS",
        path: "/v1/signaling/{meetingId}",
        desc: "Signalling — SDP offers and answers, ICE candidates, participant events",
      },
      {
        method: "RTP",
        path: "UDP media to the SFU",
        desc: "The media path itself — unreliable by design, never TCP if avoidable",
      },
      {
        method: "POST",
        path: "/v1/meetings/{id}/layers",
        desc: "Request which simulcast layer to receive per participant",
      },
      {
        method: "POST",
        path: "/v1/meetings/{id}/recording",
        desc: "Start recording — the one path requiring decode and compositing",
      },
      {
        method: "GET",
        path: "/v1/turn/credentials",
        desc: "Short-lived relay credentials for participants behind restrictive firewalls",
      },
    ],
    dataModel: [
      {
        entity: "meetings",
        fields: [
          "meeting_id (pk)",
          "host_id, scheduled_at",
          "settings (recording, e2ee, waiting room)",
          "assigned_region",
          "→ small and ordinary; the control plane",
        ],
      },
      {
        entity: "participants",
        fields: [
          "meeting_id, participant_id (pk)",
          "role (host|presenter|attendee)",
          "connection_state, media_state",
          "→ ephemeral, in memory, TTL on disconnect",
        ],
      },
      {
        entity: "media_routes",
        fields: [
          "meeting_id, from_participant, to_participant",
          "selected_layer (low|mid|high)",
          "→ the SFU's forwarding table; pure in-memory state",
        ],
      },
      {
        entity: "recordings",
        fields: [
          "recording_id (pk)",
          "meeting_id, started_at, duration",
          "storage_url, transcript_url",
          "→ the only durable media output",
        ],
      },
    ],
    architecture: [
      {
        heading: "Topology is the whole decision",
        lede: "Three options with wildly different cost curves; pick one and justify it.",
        diagram: {
          kind: "compare",
          caption: "The answer changes with participant count — say where each breaks.",
          options: [
            {
              title: "Mesh (peer-to-peer)",
              sub: "everyone connects to everyone",
              good: [
                "No media server at all — lowest possible latency and cost",
                "End-to-end encrypted naturally",
              ],
              bad: [
                "Upload grows linearly per participant — 10 people needs ~13 Mbps up",
                "Encoding load multiplies on the client",
                "No recording, no server-side features",
              ],
              verdict: "Perfect for two or three people; unusable beyond four.",
            },
            {
              title: "SFU (selective forwarding)",
              sub: "server routes packets without decoding",
              tone: "ok",
              good: [
                "Each client uploads once regardless of meeting size",
                "Server cost is packet forwarding, not media processing",
                "Per-receiver quality selection via simulcast",
              ],
              bad: [
                "Each client still decodes many incoming streams",
                "Server sees the media unless end-to-end encryption is used",
              ],
              verdict: "The default answer for group calls, and what real products use.",
            },
            {
              title: "MCU (mixing)",
              sub: "server decodes, composites, re-encodes one stream",
              good: [
                "Client receives and decodes exactly one stream — ideal for weak devices",
                "Uniform experience regardless of client capability",
              ],
              bad: [
                "Enormously expensive CPU per meeting",
                "Adds latency through decode and re-encode",
                "Loses per-participant layout control",
              ],
              verdict: "For very constrained endpoints, telephony bridging, or broadcast fan-out.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "The arithmetic to say out loud",
          text: '"In a mesh, each participant uploads their stream to everyone else, so ten people means about thirteen megabits of upload each — more than most home connections have. An SFU fixes exactly that: you upload once and the server forwards, so your upload is constant regardless of meeting size. And because it forwards packets rather than decoding them, the server cost is routing rather than video processing."',
        },
      },
      {
        heading: "Why UDP, and why losing packets is correct",
        lede: "The one system here where retransmission is the wrong answer.",
        diagram: {
          kind: "flow",
          caption: "A late frame is worthless, so the design drops it instead of waiting.",
          rows: [
            [
              { id: "cap", label: "Capture + encode", sub: "~40 ms" },
              { id: "net", label: "UDP transit", sub: "no retransmit", tone: "accent" },
              { id: "jit", label: "Jitter buffer", sub: "~40 ms, adaptive" },
            ],
            [
              { id: "loss", label: "Packet lost", sub: "conceal, move on", tone: "warn" },
              {
                id: "tcp",
                label: "TCP would retransmit",
                sub: "arrives 100 ms late — useless",
                tone: "bad",
              },
              { id: "out", label: "Decode + display", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "TCP guarantees delivery and ordering, both of which are actively harmful here: a retransmitted frame arrives after its moment has passed, and head-of-line blocking stalls everything behind it while waiting.",
          "The jitter buffer trades a little latency for smoothness by absorbing variance in arrival times, and it must be adaptive — too small and playback stutters, too large and conversation feels laggy.",
          "Loss is concealed rather than repaired: audio interpolates over a missing packet, video reuses the previous frame region, and the user perceives a blip rather than a freeze.",
          "The exception is keyframes. Losing one corrupts everything until the next, so the receiver explicitly requests a new keyframe — a targeted, deliberate recovery rather than general retransmission.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Simulcast: how one uplink serves many different receivers",
        body: [
          "An SFU that forwards a single high-quality stream to everyone forces the weakest participant's network to carry it. Simulcast solves this by having the sender encode several qualities at once and letting the server choose per receiver.",
        ],
        code: {
          title: "The server selects layers; it never transcodes",
          lang: "ts",
          source: `// The sender publishes 2-3 encodings of the SAME camera simultaneously.
// Costs the sender some CPU and a bit of extra uplink; saves the server
// from transcoding entirely, which is the expensive thing.
const encodings = [
  { rid: "low",  maxBitrate: 150_000,  scaleResolutionDownBy: 4 },
  { rid: "mid",  maxBitrate: 500_000,  scaleResolutionDownBy: 2 },
  { rid: "high", maxBitrate: 1_500_000, scaleResolutionDownBy: 1 },
];

// For each receiver, the SFU picks a layer from each sender based on that
// receiver's estimated bandwidth and what is actually on their screen.
function selectLayer(receiver: Receiver, sender: Sender): Layer {
  // Someone shown as a thumbnail does not need 1080p — this is where most
  // of the bandwidth saving comes from, not from clever compression.
  if (receiver.layoutFor(sender) === "thumbnail") return "low";
  if (receiver.estimatedBandwidth < 1_000_000) return "low";
  if (receiver.estimatedBandwidth < 2_500_000) return "mid";
  return "high";
}

// Forwarding is then copying packets to a different destination. The server
// never decodes, never re-encodes, and therefore costs a fraction of an MCU.`,
        },
        bullets: [
          "The largest bandwidth saving comes from layout rather than from networks: in a meeting of thirty, twenty-nine people are thumbnails and need nothing close to full resolution.",
          "Bandwidth estimation per receiver drives layer selection, and it must react quickly downwards and slowly upwards, exactly as with adaptive bitrate in video streaming.",
          "Scalable video coding is the more elegant alternative — one layered stream from which the server drops layers — but codec support is patchier, so simulcast remains the pragmatic choice.",
          "Audio is never dropped in favour of video. It is a fraction of the bandwidth and matters far more to the experience, so under congestion video quality falls first and audio is protected.",
        ],
        callout: {
          kind: "insight",
          text: "The cleanest way to express the SFU's value is that it turns a media problem into a routing problem. Because it forwards packets rather than decoding them, one modest server handles many concurrent meetings — and the moment you add a feature that requires understanding the media, such as recording or transcription, you need a separate component that pays the decoding cost for that meeting alone.",
        },
      },
      {
        heading: "Getting connected at all",
        body: [
          "A surprising share of the engineering is spent simply establishing a path between two machines that are both behind network address translation, and in corporate networks that may block UDP entirely.",
        ],
        table: {
          caption: "Connection establishment, in order of preference.",
          headers: ["Method", "How", "Cost", "Success rate"],
          rows: [
            [
              "Direct (host)",
              "Same network, direct addressing",
              "None",
              "Low — only local networks",
            ],
            [
              "STUN",
              "Discover the public address, punch through NAT",
              "Negligible",
              "Most home networks",
            ],
            ["TURN over UDP", "Relay through a server", "Server bandwidth", "Nearly all"],
            [
              "TURN over TCP/443",
              "Relay disguised as HTTPS traffic",
              "Bandwidth, plus TCP's problems",
              "Restrictive corporate networks",
            ],
          ],
        },
        bullets: [
          "Candidates are gathered and tried in parallel, with the best working path chosen — this is what ICE does, and it is why connection setup involves a flurry of attempts rather than one.",
          "Relaying through TURN is the fallback that makes the product work everywhere, and it is pure cost: bandwidth paid to route media that ideally would have gone directly.",
          "Falling back to TCP on port 443 reintroduces head-of-line blocking and retransmission, so quality is visibly worse — but a degraded call is enormously better than no call.",
          "Signalling is entirely separate from media: it is a small, reliable, ordinary WebSocket exchange of session descriptions and candidates, and it does not carry a single frame of video.",
        ],
      },
      {
        heading: "Recording, transcription and the encryption conflict",
        body: [
          "The features customers ask for most are exactly the ones that require the server to understand the media, which is in direct tension with the forwarding architecture and with end-to-end encryption.",
        ],
        bullets: [
          "Recording needs a component that subscribes as a participant, decodes every stream, composites a layout and encodes one output — effectively an MCU attached to a meeting, and priced accordingly.",
          "Because it is a separate consumer, recording failures do not affect the live meeting, which is the right isolation: a recorder crash should never end a call.",
          "End-to-end encryption means the SFU forwards packets it cannot read. That preserves routing and simulcast layer selection, because those use unencrypted headers, but eliminates server-side recording, transcription and noise suppression.",
          "The honest framing is that end-to-end encryption and server-side intelligence are mutually exclusive, so it belongs as a per-meeting choice with the consequences stated plainly rather than as a marketing checkbox.",
        ],
      },
      {
        heading: "Scaling meetings and regions",
        body: [
          "A meeting is naturally a unit of state on one server, which makes placement the main scaling question and large meetings the main exception.",
        ],
        bullets: [
          "Assign a meeting to an SFU close to the majority of its participants, since media latency is dominated by physical distance and a poorly placed server adds delay nobody can recover.",
          "Geographically distributed meetings need cascaded SFUs — a server in each region with a link between them — so participants connect locally and only one stream crosses each long link.",
          "Very large broadcast-style meetings shift shape entirely: a handful of speakers and thousands of viewers is a fan-out problem better served by cascading or by switching viewers to a streaming protocol.",
          "A meeting's state is ephemeral and in memory, so an SFU failure means reconnecting everyone to another server — disruptive for a few seconds but not data loss, which is the correct trade for real-time media.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "SFU",
        pickWhen: "Group calls of roughly 4 to a few hundred",
        cost: "Clients decode many streams; server sees media unless end-to-end encrypted",
      },
      {
        choice: "Mesh",
        pickWhen: "Two or three participants",
        cost: "Upload and encoding cost grow per participant; no server features",
      },
      {
        choice: "MCU",
        pickWhen: "Very weak endpoints, telephony bridging, broadcast",
        cost: "Large CPU cost and added latency from decode and re-encode",
      },
      {
        choice: "UDP with loss concealment",
        pickWhen: "Always for real-time media",
        cost: "Visible artefacts under loss instead of clean but late data",
      },
      {
        choice: "Simulcast",
        pickWhen: "Mixed device and network capabilities — always",
        cost: "Extra sender CPU and uplink for the additional encodings",
      },
      {
        choice: "End-to-end encryption",
        pickWhen: "Confidentiality outweighs server-side features",
        cost: "No recording, transcription or server-side processing",
      },
    ],
    wrapUp: [
      "Topology is the decision: mesh is fine for three people and collapses by ten because upload grows per participant, an MCU is far too expensive in CPU, and an SFU forwards packets without decoding them.",
      "Media runs over UDP because reliability is actively harmful — a retransmitted frame arrives after it is useful, so loss is concealed rather than repaired.",
      "Simulcast lets one uplink serve receivers with different networks and layouts, and the biggest saving comes from sending thumbnails at low resolution rather than from compression.",
      "Audio is protected ahead of video under congestion, because it costs a fraction of the bandwidth and matters far more to the conversation.",
      "A large share of the engineering is simply establishing a path — STUN, then relaying via TURN, and finally TCP on 443 for restrictive networks, each step worse but better than failing.",
      "Recording and transcription require decoding, so they run as a separate consumer attached to the meeting, and they are mutually exclusive with end-to-end encryption.",
    ],
    followUps: [
      {
        q: "Why not just connect everyone directly to each other?",
        a: "Because the upload requirement grows with the meeting. In a mesh each participant sends their own stream separately to every other participant, so with ten people you are uploading nine copies — around thirteen megabits per second, which exceeds most home connections — and you are also encoding for each peer, which loads the device. It works beautifully for two or three people and is genuinely the right answer there, since it avoids a media server entirely and gives the lowest possible latency. Beyond four it collapses, which is what an SFU fixes: you upload once regardless of how many people are in the meeting, and the server forwards your packets to everyone else.",
      },
      {
        q: "Why UDP when packets get lost?",
        a: "Because losing a packet is genuinely better than receiving it late. The end-to-end budget is about a hundred and fifty milliseconds, of which capture, encoding, the jitter buffer and decoding already consume most; a retransmission requires a full round trip, so the recovered frame arrives well after the moment it belonged to and is useless. Worse, TCP's ordering guarantee causes head-of-line blocking, so everything behind the lost packet waits too and a brief loss becomes a visible freeze. With UDP the receiver conceals the gap — interpolating audio, reusing part of the previous video frame — and the user perceives a momentary blip. The one exception is a lost keyframe, which corrupts everything until the next one, so receivers explicitly request a fresh keyframe rather than relying on general retransmission.",
      },
      {
        q: "One participant is on a poor mobile connection. Does everyone suffer?",
        a: "Not with simulcast, which is exactly the problem it solves. Each sender encodes two or three versions of their camera at different resolutions and bitrates simultaneously, and the SFU chooses per receiver which layer to forward — so the participant on a weak connection receives low-resolution versions while everyone else continues at full quality. Crucially the server never transcodes; it picks among streams the sender already produced, which is why forwarding stays cheap. The largest saving actually comes from layout rather than from network conditions: in a meeting of thirty, twenty-nine people are small thumbnails and have no need for full resolution regardless of bandwidth. And under congestion, video quality is reduced before audio, because audio is a fraction of the bandwidth and matters far more.",
      },
      {
        q: "A participant is behind a corporate firewall that blocks UDP. What happens?",
        a: "They fall back through a sequence of increasingly costly options. The connection process gathers candidate paths and tries them in parallel: a direct connection if they happen to be on the same network, then STUN to discover their public address and punch through ordinary NAT, then relaying media through a TURN server, and finally relaying over TCP on port 443 so the traffic looks like ordinary HTTPS and passes through restrictive policies. That last option reintroduces exactly the problems UDP was chosen to avoid — retransmission and head-of-line blocking — so call quality is visibly worse. But a degraded call is far better than no call, and this fallback chain is a large share of why a product like this works in practice rather than only in ideal conditions.",
      },
      {
        q: "Can you have end-to-end encryption and cloud recording?",
        a: "No, and I would state that plainly rather than promising both. End-to-end encryption means the server can forward packets but not read them, which is compatible with the core architecture — routing and even simulcast layer selection rely on unencrypted headers rather than the media itself. But recording, transcription, noise suppression and virtual backgrounds all require decoding the media, and a server that can decode is by definition not end-to-end encrypted. So it is a per-meeting choice with real consequences: a fully confidential meeting cannot be recorded in the cloud, though participants can record locally. Presenting it as a setting whose trade-offs are explained is much more honest than a checkbox that quietly disables features users expected.",
      },
    ],
    related: [
      "/examples/chat",
      "/examples/google-docs",
      "/hld/websockets",
      "/examples/youtube",
      "/hld/cdn",
    ],
    furtherReading: [
      {
        label: "WebRTC — architecture and protocols",
        href: "https://webrtc.org/architecture/",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
