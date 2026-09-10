import type { DesignExample } from "@/data/types";

export const vol1DeepC: DesignExample[] = [
  {
    slug: "rate-limiter",
    title: "Design a Rate Limiter",
    source: "Volume 1",
    chapter: 4,
    difficulty: "intermediate",
    minutes: 20,
    tags: ["redis", "gateway", "algorithms", "resilience"],
    companies: ["Stripe", "Twitter/X", "AWS API Gateway", "Cloudflare"],
    summary:
      "Throttle clients so that no one caller starves the rest. Token bucket is the default algorithm, Redis holds the counters, a rules service holds the limits, and rejected callers get a 429 with headers that tell them exactly when to come back. The interesting design work is in where the state lives and what happens when it is unavailable.",
    clarifying: [
      {
        q: "Client-side, server-side, or a middleware tier?",
        a: "Server-side at the API gateway. Client-side limits are advisory — a misbehaving or malicious client ignores them — though shipping them in the SDK reduces honest overuse.",
      },
      {
        q: "What do we limit on?",
        a: "API key for authenticated traffic, IP for anonymous. Worth saying out loud that IP is shared by NAT and corporate proxies, so IP limits must be looser and are a blunt instrument.",
      },
      {
        q: "One limit or several?",
        a: "Several: a burst limit per second, a sustained limit per minute, and a daily quota. Evaluate all of them and report the most restrictive in the response headers.",
      },
      {
        q: "What happens when a client is over the limit — reject or queue?",
        a: "Reject with 429 for public APIs, because queuing hides the problem and consumes memory. Internal traffic can be queued with fair scheduling instead.",
      },
      {
        q: "How exact must the limit be?",
        a: "Approximate is fine — nobody is harmed by 1,010 requests against a limit of 1,000. That single answer unlocks the local-approximation designs that avoid a round trip per request.",
      },
    ],
    requirements: {
      functional: [
        "Limit requests per client per time window",
        "Different limits per tier, per endpoint and per client",
        "Return 429 with Retry-After and rate-limit headers",
        "Limits are configurable without a deploy",
        "Exemptions for internal traffic and health checks",
      ],
      nonFunctional: [
        "Adds under 1 ms to p99 latency",
        "Works across a fleet of gateway instances",
        "Highly available — the limiter must not become the outage",
        "Memory bounded regardless of how many distinct keys appear",
      ],
    },
    math: [
      {
        label: "Traffic",
        expr: "1 M API calls/s at the gateway",
        result: "1 M limiter checks/s",
        note: "Every request is a check — this is why a per-request round trip is the wrong design at this scale.",
      },
      {
        label: "State per key",
        expr: "token bucket = 2 numbers ≈ 100 B with overhead",
        result: "10 M keys ≈ 1 GB",
        note: "Cheap, provided idle keys expire. Without TTLs, memory grows with your total user base forever.",
      },
      {
        label: "Redis round trip",
        expr: "same-AZ ≈ 0.3 ms, cross-AZ ≈ 1-2 ms",
        result: "on every request",
        note: "Acceptable at tens of thousands of rps, not at a million.",
      },
      {
        label: "Local approximation error",
        expr: "sync every 1 s × 50 gateways",
        result: "≤ ~1 s of overshoot",
        note: "For a per-minute limit that is under 2% — well within 'approximate is fine'.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/rules?key=&endpoint=",
        desc: "Rules service — limits by tier and route, cached locally with a short TTL",
      },
      {
        method: "INTERNAL",
        path: "allow(key, endpoint, cost) → Decision",
        desc: "The hot path — returns ok, remaining, resetAt, retryAfter",
      },
      { method: "PUT", path: "/v1/rules/{tier}", desc: "Update limits without a deploy" },
      {
        method: "GET",
        path: "/v1/usage/{key}",
        desc: "Customer-facing usage, so limits are not a surprise",
      },
    ],
    dataModel: [
      {
        entity: "rules",
        fields: ["tier (pk)", "endpoint", "limit", "window_seconds", "cost_multiplier", "burst"],
      },
      {
        entity: "bucket:{key}:{endpoint}",
        fields: ["Redis hash", "tokens (float)", "ts (ms)", "PEXPIRE ≈ 2× refill time"],
      },
      {
        entity: "exemptions",
        fields: ["key (pk)", "reason", "expires_at", "→ audited, never permanent by default"],
      },
    ],
    architecture: [
      {
        heading: "Where it sits",
        diagram: {
          kind: "system",
          caption: "Three layers, each catching what the others cannot see.",
          columns: [
            {
              title: "Edge",
              nodes: [{ id: "cdn", label: "CDN / WAF", sub: "volumetric, per-IP", tone: "accent" }],
            },
            {
              title: "Gateway",
              nodes: [
                { id: "gw", label: "API gateway ×50", sub: "per-key limits", tone: "accent" },
                { id: "local", label: "Local bucket", sub: "in-process approximation", tone: "ok" },
              ],
            },
            {
              title: "Shared state",
              nodes: [
                { id: "r", label: "Redis cluster", sub: "sharded by key" },
                { id: "rules", label: "Rules service", sub: "cached 30 s" },
              ],
            },
            {
              title: "Backends",
              nodes: [
                { id: "svc", label: "Services", sub: "endpoint-specific limits" },
                { id: "db", label: "Datastores", sub: "pool caps as the last line" },
              ],
            },
          ],
        },
        bullets: [
          "The gateway is the primary place: every backend is protected uniformly, and the policy lives in one system.",
          "The edge catches volumetric abuse before it costs you anything — the cheapest request to drop is the one you never receive.",
          "Services still need their own limits for genuinely expensive operations, where a concurrency cap ('at most 5 concurrent exports per tenant') is often more useful than a rate.",
        ],
      },
      {
        heading: "Algorithm: token bucket, and why",
        lede: "It expresses 'sustained rate plus burst allowance' in two numbers.",
        code: {
          title: "Lazy refill — no timers, O(1) state per key",
          lang: "ts",
          source: `type Decision = { ok: boolean; remaining: number; limit: number;
                  resetAtMs: number; retryAfterMs?: number };

class TokenBucket {
  constructor(private capacity: number, private refillPerSec: number) {}

  allow(state: { tokens: number; lastMs: number }, now: number, cost = 1): Decision {
    // Add the tokens that would have accrued since the last call.
    const elapsed = Math.max(0, now - state.lastMs) / 1000;
    state.tokens = Math.min(this.capacity, state.tokens + elapsed * this.refillPerSec);
    state.lastMs = now;

    if (state.tokens >= cost) {
      state.tokens -= cost;
      return { ok: true, remaining: Math.floor(state.tokens), limit: this.capacity,
               resetAtMs: now + ((this.capacity - state.tokens) / this.refillPerSec) * 1000 };
    }

    const waitMs = Math.ceil(((cost - state.tokens) / this.refillPerSec) * 1000);
    return { ok: false, remaining: 0, limit: this.capacity,
             resetAtMs: now + waitMs, retryAfterMs: waitMs };
  }
}

// Two knobs with clear meaning:
//   capacity      = how large a burst you tolerate
//   refillPerSec  = the sustained rate you allow
// cost > 1 lets one expensive endpoint consume more of the same budget,
// which turns "requests per minute" into "work per minute".`,
        },
        table: {
          headers: ["Algorithm", "Memory/key", "Burst", "Exact?", "Use"],
          rows: [
            [
              "Token bucket",
              "2 numbers",
              "Up to capacity",
              "Yes, by its definition",
              "The default for API limits",
            ],
            [
              "Leaky bucket",
              "A bounded queue",
              "Absorbed, output smoothed",
              "Yes, on output rate",
              "Protecting a downstream that cannot burst",
            ],
            [
              "Fixed window",
              "1 counter",
              "Up to 2× at a boundary",
              "No",
              "Cheapest; coarse protection",
            ],
            [
              "Sliding window log",
              "O(limit) timestamps",
              "None",
              "Yes",
              "Low limits where exactness matters (logins)",
            ],
            [
              "Sliding window counter",
              "3 numbers",
              "Small overshoot",
              "Approximate",
              "Per-minute limits at scale",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "The fixed-window boundary flaw is worth stating precisely: 100 requests at 11:59:59 and 100 more at 12:00:00 is 200 in one second against a limit of 100 per minute. The sliding window counter fixes it with three numbers instead of a log of timestamps.",
        },
      },
      {
        heading: "Distributed state",
        diagram: {
          kind: "sequence",
          caption: "Atomic because the script runs as one operation on one node.",
          actors: [
            { id: "c", label: "Client" },
            { id: "gw", label: "Gateway" },
            { id: "l", label: "Local bucket" },
            { id: "r", label: "Redis" },
          ],
          messages: [
            { from: "c", to: "gw", label: "GET /v1/search", kind: "call" },
            {
              from: "gw",
              to: "l",
              label: "check local share",
              kind: "call",
              note: "no network when comfortably under",
            },
            { from: "l", to: "gw", label: "remaining 70% → allow", kind: "return", tone: "ok" },
            {
              from: "gw",
              to: "r",
              label: "EVALSHA rate_limit(key, now)",
              kind: "call",
              tone: "warn",
              note: "only when the key approaches its limit",
            },
            { from: "r", to: "gw", label: "[allowed, remaining]", kind: "return" },
            {
              from: "gw",
              to: "c",
              label: "429 + Retry-After when denied",
              kind: "return",
              tone: "warn",
            },
          ],
        },
        code: {
          title: "Redis Lua — read-modify-write in one atomic operation",
          lang: "lua",
          source: `-- KEYS[1] = bucket key
-- ARGV    = capacity, refillPerSec, nowMs, cost
local capacity = tonumber(ARGV[1])
local refill   = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local cost     = tonumber(ARGV[4])

local s      = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(s[1]) or capacity
local ts     = tonumber(s[2]) or now

tokens = math.min(capacity, tokens + ((now - ts) / 1000) * refill)

local allowed = tokens >= cost
if allowed then tokens = tokens - cost end

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
-- Idle keys must expire, or memory grows with your entire user base.
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity / refill) * 2000))

return { allowed and 1 or 0, math.floor(tokens) }`,
        },
        bullets: [
          "Without atomicity, two gateways both read 99 tokens and both allow — the classic check-then-act race. A Lua script (or a Redis transaction) makes the whole operation indivisible.",
          "Use the Redis server's clock inside the script rather than each gateway's, so clock skew across the fleet does not shift window boundaries.",
          "Shard keys across Redis nodes, or one very hot tenant makes a single node the bottleneck for everyone.",
          "TTL every bucket. This is the difference between bounded memory and a slow leak that surfaces months later.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Avoiding a round trip per request",
        steps: [
          {
            title: "Start exact",
            text: "Every gateway consults Redis for every request. Simple, accurate, ~0.3 ms, and a hard dependency. Fine to tens of thousands of requests per second.",
          },
          {
            title: "Add a local pre-filter",
            text: "Keep an in-process bucket sized to this gateway's share. Only consult Redis when a key gets within, say, 30% of its limit. Cold keys cost nothing; hot keys stay accurate.",
            detail:
              "Typically removes 90%+ of Redis calls, because most keys are nowhere near their limit.",
          },
          {
            title: "Or distribute the budget",
            text: "Divide the global limit across N gateways and redistribute periodically based on observed demand, so idle gateways donate capacity to busy ones.",
            detail:
              "Works well with even routing; poorly when traffic is skewed to a few gateways.",
          },
          {
            title: "Decide the failure policy per route",
            text: "Fail open for reads so a Redis blip is not an outage; fail closed for expensive writes or anything that costs money per call. Either way, the local bucket keeps enforcing a floor.",
          },
        ],
        callout: {
          kind: "warn",
          text: "Decide fail-open versus fail-closed before the incident, per endpoint, and write it down. Making that call at 3am under pressure is how a limiter outage becomes a service outage — or how an abusive client gets a free run at your database.",
        },
      },
      {
        heading: "Talking to clients",
        code: {
          title: "The response that makes clients behave",
          lang: "http",
          source: `HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Limit: 1000
RateLimit-Remaining: 0
RateLimit-Reset: 12
Content-Type: application/json

{
  "error": "rate_limited",
  "limit": 1000,
  "window": "1m",
  "retryAfterSeconds": 12,
  "docs": "https://api.example.com/docs/rate-limits"
}

# Send the RateLimit-* headers on SUCCESSFUL responses too, so a
# well-behaved client can slow down before it is ever rejected.`,
        },
        bullets: [
          "Without Retry-After, clients retry immediately and the limiter becomes a load amplifier at precisely the wrong moment.",
          "Distinguish 429 (you are over your limit) from 503 (we are overloaded). They call for different client behaviour.",
          "Give customers a usage endpoint and a dashboard. Most limit violations are honest mistakes, and visibility prevents support tickets.",
          "Never rate limit health checks or the auth path with the same policy as bulk endpoints — a limiter that blocks recovery is worse than no limiter.",
        ],
      },
      {
        heading: "Fairness and abuse",
        table: {
          headers: ["Problem", "Naive result", "Better"],
          rows: [
            [
              "One tenant floods a shared backend",
              "Everyone's latency rises",
              "Per-tenant limits plus per-tenant queueing for internal traffic",
            ],
            [
              "Anonymous traffic behind NAT",
              "A whole office is limited as one user",
              "Looser IP limits, and prefer authenticated keys wherever possible",
            ],
            [
              "Expensive endpoint drains the budget",
              "Cheap calls are blocked because of a few heavy ones",
              "Weighted cost per endpoint — one search costs 10 tokens",
            ],
            [
              "Distributed abuse from many IPs",
              "Per-IP limits never trigger",
              "Behavioural detection at the edge; challenge rather than block",
            ],
            [
              "Compromised API key",
              "Tenant's entire quota consumed",
              "Multi-dimensional keys: limit per key AND per tenant",
            ],
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Token bucket",
        pickWhen: "General API limiting where bursts are legitimate",
        cost: "Allows a burst up to capacity, which can spike a fragile downstream",
      },
      {
        choice: "Sliding window counter",
        pickWhen: "A strict per-minute number with no boundary cliff",
        cost: "Approximate — assumes uniform traffic within the previous window",
      },
      {
        choice: "Centralised Redis state",
        pickWhen: "Up to tens of thousands of rps; exactness matters",
        cost: "A round trip per request and a hard dependency",
      },
      {
        choice: "Local approximation with sync",
        pickWhen: "Very high throughput; approximate limits acceptable",
        cost: "Overshoot by roughly one sync interval; more moving parts",
      },
      {
        choice: "Fail open",
        pickWhen: "Read endpoints where the backend can absorb a surge",
        cost: "Abuse flows through while the limiter is down",
      },
    ],
    wrapUp: [
      "Token bucket at the API gateway, counters in Redis behind a Lua script, limits from a rules service cached locally — that is the design in one sentence.",
      "The scaling move is not a faster Redis but fewer calls to it: a local bucket that only defers to shared state when a key approaches its limit.",
      "429 without Retry-After turns a limiter into an amplifier; the response headers are part of the design, not a detail.",
      "Fail-open versus fail-closed is a product decision made per endpoint, in advance.",
      "With another hour: per-tenant fair queueing for internal traffic, abuse detection at the edge, and the customer-facing usage dashboard.",
    ],
    followUps: [
      {
        q: "Which algorithm, and why not the others?",
        a: "Token bucket, because clients legitimately burst and it expresses sustained rate plus burst allowance in two numbers with constant memory. Fixed window is cheaper but allows double the limit across a boundary. Sliding window log is exact but costs memory proportional to the limit, so I would reserve it for low-limit security controls like login attempts. Sliding window counter is the compromise when a strict per-minute number matters.",
      },
      {
        q: "How do you make this work across 50 gateways?",
        a: "Shared counters in Redis with a Lua script so the read-modify-write is atomic — otherwise two gateways both see 99 and both allow. To avoid a round trip per request, each gateway keeps a local bucket sized to its share and only consults Redis when a key is near its limit, which removes most of the traffic while keeping hot keys accurate.",
      },
      {
        q: "Redis goes down. What happens?",
        a: "It depends on the route, decided in advance. Read endpoints fail open, because a limiter outage should not be a service outage, and the local approximate bucket still enforces a floor. Expensive writes fail closed. Either way I alert loudly, because running unprotected is a temporary state, and I would rate limit harder at the edge while it lasts.",
      },
      {
        q: "How would you rate limit at a million requests per second?",
        a: "By not putting a network call on the request path at all. Push a cheap volumetric limit to the edge, keep local buckets per gateway, and synchronise periodically rather than per request — distributing a share of the global budget to each instance. That gives approximate enforcement, which is the correct trade at that volume since nobody is harmed by a small overshoot.",
      },
      {
        q: "A customer says they were limited unfairly. How do you investigate?",
        a: "I would want the limiter to emit, on a sampled basis, which key, which rule and which limit fired, along with the remaining count. Without that the complaint is unfalsifiable. The most common genuine cause is an IP-based limit hitting a shared NAT, which is an argument for authenticating traffic and limiting per key wherever possible.",
      },
    ],
    related: [
      "/hld/rate-limiting",
      "/lld/rate-limiter",
      "/hld/api-gateway",
      "/playgrounds/rate-limiter",
    ],
    furtherReading: [
      {
        label: "Rate limiter playground",
        href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html",
      },
    ],
    playground: "rate-limiter",
  },

  {
    slug: "notification",
    title: "Design a Notification System",
    source: "Volume 1",
    chapter: 10,
    difficulty: "intermediate",
    minutes: 21,
    tags: ["queues", "fan-out", "third-party", "reliability"],
    companies: ["Any consumer product", "Braze", "Courier", "OneSignal"],
    summary:
      "Send push, SMS and email reliably to millions of devices through third-party providers you do not control. The architecture is queues and workers; the difficulty is that every provider fails differently, users have preferences and time zones, and 'send once' across retries is a real correctness requirement.",
    clarifying: [
      {
        q: "Which channels?",
        a: "Push (iOS and Android), SMS, email, and in-app. Each has a different provider, a different failure model and a different cost per message, so the design must treat them as pluggable rather than special-cased.",
      },
      {
        q: "Transactional, promotional, or both?",
        a: "Both, and they need different priorities and rules: a password reset must go out in seconds and ignore quiet hours, while a marketing blast can wait and must respect them.",
      },
      {
        q: "Do we need delivery tracking?",
        a: "Yes — sent, delivered, opened, failed — because otherwise you cannot answer 'did the user get it', which is the most common support question.",
      },
      {
        q: "What volume, and how spiky?",
        a: "Assume 10 million notifications a day with sharp bursts: a broadcast to every user is a very different load profile from steady transactional traffic.",
      },
      {
        q: "Can a user receive the same notification twice?",
        a: "It should be rare and is not catastrophic for most content — but for anything with a code or a payment, exactly-once user-visible behaviour matters, which means idempotency keys through to the provider.",
      },
    ],
    requirements: {
      functional: [
        "Send push, SMS, email and in-app notifications",
        "Per-user, per-channel, per-category preferences and opt-outs",
        "Templates with localisation and variable substitution",
        "Scheduling, including 'deliver at 9am in the user's time zone'",
        "Delivery status tracking and per-provider metrics",
        "Rate limits per user so nobody is spammed",
      ],
      nonFunctional: [
        "Transactional notifications delivered within seconds",
        "No notification lost once accepted, even across provider outages",
        "Duplicates rare and bounded, never systematic",
        "A single failing provider must not stall the other channels",
      ],
    },
    math: [
      {
        label: "Volume",
        expr: "10 M/day ÷ 10⁵",
        result: "≈ 120/s average",
        note: "Trivial on average — which is exactly why people under-design this.",
      },
      {
        label: "Broadcast burst",
        expr: "50 M users in one campaign",
        result: "50 M in minutes",
        note: "Five orders of magnitude above average. The queue exists for this.",
      },
      {
        label: "Provider limits",
        expr: "APNs ~1 M/s (batched) · SMS gateway ~100/s per account · SES ~14/s default",
        result: "the real ceiling",
        note: "Your throughput is set by the slowest provider, not by your own capacity.",
      },
      {
        label: "Cost asymmetry",
        expr: "push ≈ free · email ≈ $0.0001 · SMS ≈ $0.01",
        result: "100× spread",
        note: "SMS cost is why channel fallback rules need thought — an accidental SMS blast is expensive.",
      },
      {
        label: "Device tokens",
        expr: "50 M users × 2.5 devices × 200 B",
        result: "≈ 25 GB",
        note: "Plus churn: tokens expire constantly and must be pruned from provider feedback.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/notifications",
        desc: "Enqueue — body {userId, templateId, vars, channels?, idempotencyKey}",
      },
      {
        method: "POST",
        path: "/v1/notifications/bulk",
        desc: "Campaign — a segment id rather than a list of users",
      },
      { method: "GET", path: "/v1/notifications/{id}", desc: "Status per channel and per attempt" },
      {
        method: "PUT",
        path: "/v1/users/{id}/preferences",
        desc: "Per-channel, per-category opt-in and quiet hours",
      },
      {
        method: "POST",
        path: "/v1/devices",
        desc: "Register a device token; provider feedback prunes dead ones",
      },
      {
        method: "POST",
        path: "/webhooks/{provider}",
        desc: "Delivery and bounce callbacks — signature-verified",
      },
    ],
    dataModel: [
      {
        entity: "notifications",
        fields: [
          "id (pk)",
          "user_id (idx)",
          "template_id",
          "vars (json)",
          "status",
          "created_at",
          "idempotency_key (unique)",
        ],
      },
      {
        entity: "deliveries",
        fields: [
          "notification_id (fk)",
          "channel",
          "provider",
          "provider_message_id",
          "state",
          "attempts",
          "last_error",
        ],
      },
      {
        entity: "devices",
        fields: [
          "user_id (idx)",
          "token (unique)",
          "platform",
          "app_version",
          "last_seen",
          "invalid_at",
        ],
      },
      {
        entity: "preferences",
        fields: [
          "user_id (pk part)",
          "category (pk part)",
          "channels[]",
          "quiet_hours",
          "timezone",
        ],
      },
      {
        entity: "templates",
        fields: ["id (pk)", "locale", "channel", "subject", "body", "version"],
      },
    ],
    architecture: [
      {
        heading: "The pipeline",
        diagram: {
          kind: "system",
          caption: "Per-channel queues, so one failing provider cannot stall the others.",
          columns: [
            {
              title: "Producers",
              nodes: [
                { id: "svc", label: "Services", sub: "order shipped, mention" },
                { id: "camp", label: "Campaign engine", sub: "segment → millions" },
              ],
            },
            {
              title: "Ingest",
              nodes: [
                {
                  id: "api",
                  label: "Notification API",
                  sub: "validate, dedupe, persist",
                  tone: "accent",
                },
                {
                  id: "pref",
                  label: "Preference filter",
                  sub: "opt-out, quiet hours, caps",
                  tone: "warn",
                },
              ],
            },
            {
              title: "Per-channel queues",
              nodes: [
                { id: "qp", label: "push queue", sub: "high priority lane too" },
                { id: "qs", label: "sms queue" },
                { id: "qe", label: "email queue" },
              ],
            },
            {
              title: "Workers → providers",
              nodes: [
                { id: "wp", label: "Push workers", sub: "APNs / FCM" },
                { id: "ws", label: "SMS workers", sub: "Twilio + backup" },
                { id: "we", label: "Email workers", sub: "SES + backup" },
                { id: "dlq", label: "DLQ", sub: "alerted on depth", tone: "bad" },
              ],
            },
          ],
        },
        steps: [
          {
            title: "Accept and persist",
            text: "Validate, apply the idempotency key, write the notification row, and return. The caller's request is done in milliseconds and the work is durable.",
            detail:
              "Use the transactional outbox so the queue message and the row commit together.",
          },
          {
            title: "Resolve preferences",
            text: "Opt-outs, per-category channel choices, quiet hours in the user's time zone, and per-user frequency caps. This is the step that keeps users from unsubscribing entirely.",
            detail:
              "Transactional notifications bypass quiet hours; promotional ones do not. Encode that as a property of the template.",
          },
          {
            title: "Render",
            text: "Template plus variables plus locale, producing a per-channel payload. Rendering failures must be caught here, not at the provider.",
          },
          {
            title: "Enqueue per channel",
            text: "Separate queues per channel, and separate lanes for transactional versus promotional, so a marketing burst never delays a password reset.",
          },
          {
            title: "Deliver with retry",
            text: "Workers call the provider with an idempotency key, retry transient failures with backoff, and dead-letter permanent ones.",
          },
          {
            title: "Reconcile",
            text: "Provider webhooks report delivery, bounce and open. Update state, prune invalid device tokens, and feed the metrics.",
          },
        ],
        callout: {
          kind: "insight",
          text: "Separate queues per channel and per priority is the structural decision that matters most. With one shared queue, an SMS provider outage backs up the queue and delays every push notification behind it — a coupling nobody notices until it happens.",
        },
      },
      {
        heading: "Third-party providers are the hard part",
        table: {
          headers: ["Channel", "Provider", "Failure modes", "Handling"],
          rows: [
            [
              "iOS push",
              "APNs",
              "Invalid token, expired certificate, rate limiting",
              "Prune tokens from feedback; alert on certificate expiry well in advance",
            ],
            [
              "Android push",
              "FCM",
              "Unregistered token, quota exceeded",
              "Batch sends; delete tokens on UNREGISTERED",
            ],
            [
              "SMS",
              "Twilio, Vonage",
              "Carrier rejection, number blocked, per-country rules",
              "Country-specific routing; a backup provider for failover",
            ],
            [
              "Email",
              "SES, SendGrid",
              "Bounces, complaints, reputation damage, sending caps",
              "Suppression list, complaint handling, warm up new IPs",
            ],
          ],
        },
        bullets: [
          "Every provider gets a circuit breaker. When one starts failing, stop calling it, use the backup if the channel has one, and let the queue hold the backlog rather than burning retries.",
          "Bounces and complaints are not optional for email: repeated sends to invalid addresses damage sender reputation, which degrades delivery for everyone. Maintain a suppression list and honour it before enqueueing.",
          "Provider rate limits are your real throughput ceiling. Shape traffic to them with a leaky bucket per provider, rather than discovering the limit through 429s.",
          "Wrap each provider behind one adapter interface so a second provider per channel is a configuration change, not a rewrite.",
        ],
        code: {
          title: "Provider adapter with idempotency, breaker and typed errors",
          lang: "ts",
          source: `interface PushProvider {
  send(token: DeviceToken, payload: PushPayload, key: IdempotencyKey): Promise<SendResult>;
}

async function deliver(job: PushJob) {
  const provider = breaker.isOpen("apns") ? providers.backup : providers.apns;

  try {
    const res = await provider.send(job.token, job.payload, job.notificationId);
    await deliveries.markSent(job.id, res.providerMessageId);
  } catch (err) {
    const classified = classify(err);

    if (classified === "invalid_token") {
      await devices.markInvalid(job.token);     // permanent: stop trying forever
      return deliveries.markFailed(job.id, "invalid_token");
    }
    if (classified === "permanent") {
      return deadLetter(job, err);              // bad payload, blocked number
    }
    if (job.attempts >= 5) return deadLetter(job, err);

    // transient: retry with full jitter so a provider outage does not
    // produce a synchronised retry wave when it recovers
    return requeue(job, Math.random() * Math.min(60_000, 1000 * 2 ** job.attempts));
  }
}

// The notificationId doubles as the provider idempotency key, so a retry
// after a timeout does not send the user a second copy.`,
        },
      },
    ],
    deepDives: [
      {
        heading: "Preferences, quiet hours and frequency caps",
        bullets: [
          "Store preferences per category, not just per channel. 'No marketing emails' must not silence a security alert, and conflating the two is how users disable everything.",
          "Quiet hours are in the user's time zone, which means a campaign for 50 million users is 24 staggered waves, not one. That scheduling requirement shapes the campaign engine.",
          "Frequency caps per user per period are what stop a bad rule from sending someone forty notifications. Enforce them centrally, after preferences and before enqueueing.",
          "Deduplicate at the semantic level too: five likes on one post should collapse into one notification, which is a digest rule rather than a delivery rule.",
          "Unsubscribe must be honoured immediately and permanently, including for messages already queued — check the suppression list at send time, not only at enqueue time.",
        ],
        code: {
          title: "Scheduling into the user's local morning",
          lang: "ts",
          source: `// "Deliver at 9am local" for a global segment = a rolling 24-hour send.
function scheduleFor(user: User, localHour = 9): Date {
  const now = DateTime.now().setZone(user.timezone);
  let target = now.set({ hour: localHour, minute: 0, second: 0 });
  if (target <= now) target = target.plus({ days: 1 });

  // Spread within the hour so 2 M users in one time zone do not all fire at :00
  return target.plus({ seconds: Math.random() * 3600 }).toJSDate();
}

// Consequence: the campaign engine must enqueue with a visibility delay
// per user rather than dispatching the whole segment at once.`,
        },
      },
      {
        heading: "Exactly once, as far as the user is concerned",
        body: [
          "Queues deliver at least once and providers time out ambiguously, so duplicates are always possible. The goal is not to eliminate the mechanism but to make the user-visible outcome correct.",
        ],
        steps: [
          {
            title: "Idempotency key from the caller",
            text: "The producing service supplies a key derived from the event — 'order:9f3:shipped'. Two calls with the same key produce one notification.",
          },
          {
            title: "Dedupe on the consumer",
            text: "The worker records the delivery attempt in the same transaction as marking it sent, so a redelivered job is a no-op rather than a second send.",
          },
          {
            title: "Pass the key to the provider",
            text: "APNs has apns-collapse-id, SES and Twilio accept idempotency keys. That closes the last gap, where you sent successfully but never saw the response.",
          },
          {
            title: "Accept the residual",
            text: "In rare cases a duplicate still gets through. For most content that is a minor annoyance; for anything with a one-time code, generate the code once and store it, so the duplicate carries the same code rather than a new one.",
          },
        ],
        callout: {
          kind: "warn",
          text: "The worst duplicate bug is not sending twice — it is a retry that regenerates a one-time code, invalidating the first message the user is currently reading. Generate side-effectful content once, at notification creation, never per delivery attempt.",
        },
      },
      {
        heading: "Handling a 50-million broadcast",
        bullets: [
          "Do not expand the segment into 50 million queue messages up front. Store the campaign and the segment definition, then have workers page through the audience, so a paused or cancelled campaign stops immediately.",
          "Shape the rate to the providers' limits with a leaky bucket per provider, and prioritise transactional traffic on its own lane so it is never behind the campaign.",
          "Make campaigns cancellable and observable: how many sent, how many remaining, current rate, error rate by provider. A campaign you cannot stop is a serious incident waiting to happen.",
          "Time-zone staggering turns the burst into a rolling wave, which incidentally smooths the load — a rare case where the product requirement and the infrastructure requirement agree.",
          "Test with a canary segment: send to 0.1% first, check error and complaint rates, then proceed. This catches template bugs before they reach millions.",
        ],
        table: {
          headers: ["Metric", "Why it matters", "Alert on"],
          rows: [
            ["Queue depth per channel", "Backlog growth", "Oldest message age, not raw count"],
            ["Provider error rate", "Provider degradation", "Per-provider, per-error-class"],
            ["DLQ depth", "Silent data loss", "Anything above zero"],
            [
              "Delivery rate (webhooks)",
              "Sent ≠ delivered",
              "A drop, which often means token or reputation problems",
            ],
            [
              "Complaint rate (email)",
              "Reputation damage",
              "Above ~0.1% — providers may throttle you",
            ],
            ["Per-user send count", "Runaway rules", "Any user over the frequency cap"],
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Queue per channel",
        pickWhen: "Always",
        cost: "More queues to operate — worth it to decouple provider failures",
      },
      {
        choice: "Separate transactional and promotional lanes",
        pickWhen: "Any product doing both",
        cost: "Duplicate worker pools; prevents a campaign from delaying a password reset",
      },
      {
        choice: "Backup provider per channel",
        pickWhen: "The channel is business-critical (SMS for 2FA, email for password reset)",
        cost: "Two integrations to maintain, and reconciliation across two sets of message ids",
      },
      {
        choice: "Expand segments lazily",
        pickWhen: "Campaigns over a few hundred thousand users",
        cost: "Slightly more complex workers; gains cancellability and back-pressure",
      },
      {
        choice: "At-least-once with idempotency keys",
        pickWhen: "Always — exactly-once delivery does not exist",
        cost: "Dedupe state and discipline about generating content once",
      },
    ],
    wrapUp: [
      "The architecture is unremarkable — queues and workers — and everything interesting is in the edges: provider failure classification, preferences, and duplicate suppression.",
      "Per-channel and per-priority queues are what stop one degraded provider from delaying unrelated notifications.",
      "Idempotency runs end to end: from the caller's key, through the worker's dedupe, to the provider's own idempotency mechanism.",
      "Broadcasts are shaped by provider limits and by time zones rather than by your own capacity, and campaigns must be cancellable.",
      "With another hour: the digest and bundling rules, per-user frequency capping across categories, and email reputation management.",
    ],
    followUps: [
      {
        q: "How do you make sure a notification is not sent twice?",
        a: "An idempotency key end to end. The producing service supplies one derived from the event, the API deduplicates on it, the worker records the attempt in the same transaction that marks it sent, and the provider call carries a key so an ambiguous timeout does not resend. Duplicates can still happen in rare cases, so anything containing a one-time code generates that code once at creation, never per attempt.",
      },
      {
        q: "The SMS provider goes down. What happens?",
        a: "The circuit breaker opens after enough failures, so we stop burning retries, and traffic either fails over to a backup provider or backs up in the SMS queue. Because queues are per channel, push and email are entirely unaffected — that decoupling is the main reason to split them. I would alert on the breaker opening and on the oldest message age in that queue, which maps directly to user impact.",
      },
      {
        q: "How do you send to 50 million users at 9am local time?",
        a: "It becomes a rolling 24-hour wave rather than one burst, with a random spread within each hour so a whole time zone does not fire at exactly :00. I would keep the segment as a definition and have workers page through it, so the campaign can be paused or cancelled, and shape the rate to each provider's limits. That is also a natural place for a canary — send to a fraction first and check error and complaint rates.",
      },
      {
        q: "A user says they did not receive a notification. How do you answer?",
        a: "By tracking state per delivery attempt: accepted, filtered by preference, sent to provider, provider-acknowledged, delivered via webhook, and failed with a reason. Most of these questions resolve to either a preference or quiet-hours filter, or an invalid device token that was never pruned. Without per-attempt state and provider webhooks, the answer is guesswork.",
      },
      {
        q: "How do you stop a bug from spamming users?",
        a: "A central frequency cap enforced after preferences and before enqueueing — no user receives more than N notifications per hour regardless of what produced them. That is a safety net independent of any individual feature's logic, and it turns a runaway rule into a metric spike rather than an inbox disaster. I would alert on any user approaching the cap, because that is usually the first sign of a bad rule.",
      },
    ],
    related: ["/hld/message-queues", "/hld/idempotency", "/examples/chat", "/hld/circuit-breaker"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
