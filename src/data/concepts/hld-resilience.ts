import type { Concept } from "@/data/types";

export const hldResilience: Concept[] = [
  {
    slug: "rate-limiting",
    title: "Rate Limiting at Scale",
    subtitle: "Protect the backend, share capacity fairly, and tell clients how to behave.",
    level: "intermediate",
    minutes: 15,
    tags: ["resilience", "traffic", "api-design"],
    summary:
      "Rate limiting exists to keep one client — abusive, buggy, or just successful — from consuming capacity everyone else needs. At the HLD level the algorithm is the easy part; the design questions are where the limit is enforced, how state is shared across a fleet without adding a round trip to every request, and what happens when the limiter's own datastore fails.",
    keyPoints: [
      "Limit at the edge for volumetric abuse and at the gateway for per-client fairness; service-level limits protect specific expensive endpoints.",
      "Shared state means a round trip per request. Local approximation plus periodic synchronisation is how large systems avoid that.",
      "Always answer 429 with Retry-After and X-RateLimit headers — a limiter clients cannot cooperate with amplifies load.",
      "Decide fail-open versus fail-closed per endpoint, deliberately, before the incident.",
      "Rate limiting is not load shedding: one is fairness policy, the other is survival under overload. You need both.",
    ],
    prerequisites: ["/lld/rate-limiter"],
    sections: [
      {
        heading: "Where to enforce it",
        diagram: {
          kind: "layers",
          caption: "Each layer catches a different kind of problem, and they compose.",
          layers: [
            {
              title: "Edge / CDN",
              items: [
                "Volumetric DDoS",
                "Per-IP caps",
                "Bot detection",
                "Cheapest place to drop traffic",
              ],
            },
            {
              title: "API gateway",
              items: [
                "Per-API-key quotas",
                "Per-tenant fairness",
                "Endpoint-specific limits",
                "429 with headers",
              ],
            },
            {
              title: "Service",
              items: [
                "Expensive operations (export, search)",
                "Concurrency limits, not just rate",
                "Per-user business quotas",
              ],
            },
            {
              title: "Datastore",
              items: ["Connection pool caps", "Statement timeouts", "The last line of defence"],
            },
          ],
        },
        table: {
          headers: ["Layer", "Protects against", "Blind to"],
          rows: [
            ["Edge", "Volumetric floods, obvious abuse", "Who the user is; business quotas"],
            ["Gateway", "One tenant starving others", "Which internal call is expensive"],
            ["Service", "One endpoint overloading a dependency", "Global fleet-wide usage"],
            ["Datastore", "Total collapse", "Everything above it — by then users see errors"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Concurrency limits are often more useful than rate limits for expensive endpoints. 'At most 5 concurrent exports per tenant' bounds resource usage directly, whereas '100 exports per minute' still allows 100 simultaneous ones.",
        },
      },
      {
        heading: "Distributed state without a round trip per request",
        body: [
          "The naive design puts a Redis call in front of every request. At a gateway handling a million requests per second, that is a million extra round trips and a single hot dependency whose failure is your outage.",
        ],
        steps: [
          {
            title: "Exact: shared counter per request",
            text: "Every gateway consults Redis with an atomic script. Accurate, simple, and it adds ~0.3-1 ms plus a hard dependency to every request.",
            detail:
              "Fine up to tens of thousands of rps. Shard keys across Redis nodes so one hot tenant does not saturate one node.",
          },
          {
            title: "Local approximation with periodic sync",
            text: "Each gateway keeps a local bucket and periodically reports usage and receives an updated allowance. Zero per-request round trips; the limit is enforced approximately, overshooting by roughly the sync interval's worth of traffic.",
            detail: "This is how most large-scale API gateways actually work.",
          },
          {
            title: "Budget distribution",
            text: "Divide the global limit across N gateways — each gets limit/N — and redistribute periodically based on observed demand, so idle gateways donate to busy ones.",
            detail:
              "Simple and effective when traffic is roughly evenly balanced; poor when routing is skewed.",
          },
          {
            title: "Two-tier: local filter, shared check for hot keys",
            text: "Track locally, and only consult the shared store for keys approaching their limit. Cold keys cost nothing; hot keys stay accurate. Best of both, with more moving parts.",
          },
        ],
        code: {
          title: "Two-tier limiter: shared check only when it matters",
          lang: "ts",
          source: `const local = new TokenBucket({ capacity: limit / GATEWAY_COUNT, refillPerSec: rate / GATEWAY_COUNT });

async function allow(key: string): Promise<Decision> {
  const localDecision = local.allow(key, Date.now());

  // Comfortably under this gateway's share: no network call at all.
  if (localDecision.remaining > localDecision.limit * 0.3) return localDecision;

  // Near the limit: consult the shared store for an accurate answer.
  try {
    return await redis.evalsha(RATE_LIMIT_SCRIPT, key, Date.now());
  } catch (err) {
    metrics.inc("ratelimit.store_unavailable");
    // Fail-open for reads, fail-closed for expensive writes — decided per route.
    return route.failOpen ? { ok: true, degraded: true, ...localDecision } : DENY;
  }
}`,
        },
      },
      {
        heading: "Speaking to clients properly",
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
  "message": "Rate limit exceeded for api key ak_...9f3",
  "limit": 1000,
  "window": "1m",
  "retryAfterSeconds": 12,
  "docs": "https://api.example.com/docs/rate-limits"
}

# Also send the headers on SUCCESSFUL responses, so a well-behaved client
# can slow down before it is ever rejected.`,
        },
        bullets: [
          "Without Retry-After, clients retry immediately and your limiter becomes a load amplifier at exactly the wrong moment.",
          "Distinguish 429 (you are over your limit, back off) from 503 (we are overloaded, everyone back off). They mean different things and clients should react differently.",
          "Machine-readable error codes let SDKs implement backoff automatically; a prose message alone forces string matching.",
          "Document the limits publicly, and make them visible in a dashboard. Most limit violations are honest mistakes.",
        ],
      },
      {
        heading: "Fairness beyond a simple counter",
        bullets: [
          "Weighted limits by cost: a search query might consume 10 tokens while a health check consumes 1. This turns 'requests per minute' into 'work per minute', which is what you actually care about.",
          "Tiered limits: burst per second, sustained per minute, quota per day. Evaluate all three and report the most restrictive in the headers.",
          "Multi-dimensional keys: limit by API key, and separately by IP, and separately per endpoint. A single compromised key should not exhaust a tenant's whole quota.",
          "Fair queueing rather than rejection for internal traffic: instead of dropping, queue per tenant and serve round-robin so one tenant's burst adds latency for itself, not for others.",
          "Priority: never rate limit health checks or the auth path the same way as bulk endpoints, or a limiter can prevent recovery.",
        ],
        diagram: {
          kind: "compare",
          caption: "The policy question that arrives during an incident.",
          options: [
            {
              title: "Fail open",
              good: [
                "Limiter outage does not become a service outage",
                "Users are unaffected by an internal problem",
              ],
              bad: [
                "Abuse flows through unchecked",
                "The backend the limiter protects may then fall over",
              ],
              verdict: "Read endpoints where the backend can absorb a surge.",
            },
            {
              title: "Fail closed",
              good: ["Backend stays protected no matter what", "Predictable worst case"],
              bad: ["A Redis blip becomes a full outage", "Blast radius of the limiter is total"],
              verdict: "Expensive writes, or anything that costs money per call.",
            },
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Where would you put the rate limiter?",
            a: "Mostly at the API gateway, so every backend is protected uniformly and the policy lives in one place. On top of that, a cheap volumetric limit at the CDN or edge for obvious floods, and endpoint-specific limits inside services for genuinely expensive operations, where a concurrency limit is often more appropriate than a rate. Three layers, each catching what the others cannot see.",
          },
          {
            q: "How do you rate limit across 50 gateway instances?",
            a: "I avoid a round trip per request. Each instance keeps a local bucket sized to its share and only consults the shared store when a key gets close to its limit, so cold traffic costs nothing and hot keys stay accurate. If the shared store is unavailable, the local bucket keeps enforcing an approximate limit — which is far better than either failing everything or letting everything through.",
          },
          {
            q: "What if the Redis backing the limiter goes down?",
            a: "It has to be a decision made in advance, per route. For read endpoints I fail open, because a limiter outage should not be a service outage, and the local approximate bucket still provides a floor. For expensive writes or anything that costs money per call, I fail closed. Either way I alert loudly, because running unprotected is a temporary state, not a steady one.",
          },
          {
            q: "How is this different from load shedding?",
            a: "Rate limiting is a fairness policy applied per client regardless of system health — you get 1000 requests a minute whether we are busy or idle. Load shedding is a survival response: when latency or queue depth crosses a threshold, reject a fraction of traffic, preferring low-priority requests, so the rest succeeds. You need both, because a system can be overloaded by many clients who are each individually within their limits.",
          },
        ],
      },
    ],
    related: [
      "/lld/rate-limiter",
      "/hld/api-gateway",
      "/examples/rate-limiter",
      "/hld/circuit-breaker",
    ],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
    playground: "rate-limiter",
  },

  {
    slug: "circuit-breaker",
    title: "Circuit Breakers, Timeouts and Retries",
    subtitle: "Stop calling something that is failing, and stop making its outage worse.",
    level: "intermediate",
    minutes: 15,
    tags: ["resilience", "patterns", "reliability"],
    summary:
      "When a dependency starts failing, the instinct is to retry. At scale that instinct is what turns a degraded service into a dead one, and then takes down everything that calls it. A circuit breaker makes failure fast and cheap: after enough failures it stops trying, gives the dependency room to recover, and probes carefully before resuming.",
    keyPoints: [
      "Three states: closed (normal), open (fail fast), half-open (probe with a few requests).",
      "Trip on an error rate over a window with a minimum request count — never on a raw count.",
      "Every remote call needs a timeout, and the timeout must be shorter than the caller's remaining budget.",
      "Retries need a budget, jitter and idempotency, or they amplify the outage they are responding to.",
      "Bulkheads limit how much of your capacity one failing dependency can consume.",
    ],
    sections: [
      {
        heading: "The cascade you are preventing",
        steps: [
          {
            title: "A dependency slows down",
            text: "Not down — slow. Responses that took 50 ms now take 5 seconds, which is worse than failing, because callers wait.",
          },
          {
            title: "Caller threads or connections pile up",
            text: "Each waiting request holds a thread, a connection and memory. The caller's pool fills with requests waiting on one slow dependency.",
          },
          {
            title: "The caller becomes slow for everything",
            text: "Requests that never touch the failing dependency now queue behind those that do. One broken feature has taken the whole service down.",
          },
          {
            title: "Retries multiply the load",
            text: "Every caller retries three times, so the struggling dependency now receives three times its normal traffic at its weakest moment.",
          },
          {
            title: "It spreads upstream",
            text: "Services calling the now-slow caller repeat the pattern. This is why a single non-critical service can take down an entire platform.",
          },
        ],
        callout: {
          kind: "warn",
          text: "Slow is worse than down. A dependency returning errors in 1 ms is survivable; the same dependency taking 30 seconds to fail exhausts every caller's resources. This is why timeouts matter more than retries.",
        },
      },
      {
        heading: "The breaker state machine",
        diagram: {
          kind: "flow",
          caption:
            "Closed → open on error rate; open → half-open after a cooldown; half-open decides.",
          rows: [
            [
              { id: "c", label: "CLOSED", sub: "calls pass through, failures counted", tone: "ok" },
              { id: "o", label: "OPEN", sub: "fail fast, no calls made", tone: "bad" },
              { id: "h", label: "HALF-OPEN", sub: "a few probe calls", tone: "warn" },
            ],
            [
              {
                id: "t1",
                label: "error rate > 50% over 10s (min 20 requests)",
                sub: "closed → open",
              },
              { id: "t2", label: "cooldown 30s elapsed", sub: "open → half-open" },
              {
                id: "t3",
                label: "probes succeed → closed · any fails → open",
                sub: "half-open resolves",
              },
            ],
          ],
        },
        code: {
          title: "A breaker with the details that matter",
          lang: "ts",
          source: `class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed";
  private window = new SlidingWindow({ ms: 10_000 });   // rolling stats
  private openedAt = 0;
  private probesInFlight = 0;

  constructor(private opts = {
    failureRateThreshold: 0.5,
    minimumRequests: 20,        // never trip on 2 failures out of 2
    cooldownMs: 30_000,
    halfOpenProbes: 3,
  }) {}

  async call<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.openedAt < this.opts.cooldownMs) {
        metrics.inc("breaker.rejected");
        if (fallback) return fallback();
        throw new CircuitOpen();                 // fail fast: microseconds, not seconds
      }
      this.state = "half-open";
      this.probesInFlight = 0;
    }

    if (this.state === "half-open" && this.probesInFlight >= this.opts.halfOpenProbes) {
      if (fallback) return fallback();
      throw new CircuitOpen();                   // limit probes; do not flood a recovering service
    }

    if (this.state === "half-open") this.probesInFlight++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallback) return fallback();
      throw err;
    }
  }

  private onFailure(err: unknown) {
    if (isClientError(err)) return;              // a 400 is not the dependency's fault
    this.window.recordFailure();
    if (this.state === "half-open") return this.trip();
    const { total, failures } = this.window.stats();
    if (total >= this.opts.minimumRequests && failures / total > this.opts.failureRateThreshold) {
      this.trip();
    }
  }

  private trip() {
    this.state = "open";
    this.openedAt = Date.now();
    metrics.inc("breaker.opened");               // this should page someone
  }
}`,
        },
        bullets: [
          "Trip on rate, not count: '5 failures' trips during a quiet period on a coincidence; '50% of at least 20 requests' does not.",
          "Do not count client errors. A 400 or 404 means your request was wrong, not that the dependency is unhealthy — counting them opens breakers for the wrong reason.",
          "Limit half-open probes. Letting full traffic through the moment the cooldown expires re-kills a service that was just recovering.",
          "One breaker per dependency, and often per endpoint of that dependency: a failing /search should not open the breaker on /health.",
          "Breaker state transitions are high-signal alerts. An opening breaker is one of the most useful pages a system can send.",
        ],
      },
      {
        heading: "Timeouts and retry budgets",
        code: {
          title: "Deadline propagation and a retry that does not amplify",
          lang: "ts",
          source: `// The user-facing budget is set once and passed down.
async function handleRequest(req: Request) {
  const deadline = Date.now() + 3_000;           // total budget for this request
  return getProfile(req.userId, deadline);
}

async function getProfile(id: string, deadline: number) {
  // An inner call can never have a longer timeout than what is left.
  const remaining = deadline - Date.now();
  const timeout = Math.min(500, remaining - 100);  // leave room to respond
  if (timeout <= 0) throw new DeadlineExceeded();
  return userService.get(id, { timeoutMs: timeout });
}

async function withRetry<T>(fn: () => Promise<T>, deadline: number) {
  let attempt = 0;
  for (;;) {
    if (!retryBudget.tryConsume()) throw new RetryBudgetExhausted();  // fleet-wide cap
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (!isTransient(err) || attempt >= 3) throw err;
      // full jitter: sleep uniformly in [0, base * 2^attempt]
      const backoff = Math.random() * Math.min(8_000, 200 * 2 ** attempt);
      if (Date.now() + backoff > deadline) throw err;   // no point retrying past the deadline
      await sleep(backoff);
    }
  }
}`,
        },
        table: {
          headers: ["Rule", "Why", "Typical value"],
          rows: [
            [
              "Every remote call has a timeout",
              "An untimed call can hold a thread indefinitely",
              "p99 of the dependency × 2-3",
            ],
            [
              "Inner timeouts < outer budget",
              "Otherwise the caller gives up while you wait",
              "Propagate a deadline, do not set independently",
            ],
            [
              "Retry only transient failures",
              "Retrying a 400 will never succeed",
              "Timeouts, 502/503/504, connection reset",
            ],
            [
              "Retry budget across the fleet",
              "Per-request limits still allow fleet-wide amplification",
              "≤ 10% of total requests may be retries",
            ],
            [
              "Full jitter on backoff",
              "Synchronised retries recreate the spike",
              "sleep = rand(0, base × 2^n)",
            ],
            [
              "Retries must be idempotent",
              "Otherwise you double-charge on a timeout",
              "Idempotency key on every mutating call",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "A retry budget is the piece most designs miss. Limiting retries per request still allows 10,000 clients each retrying three times, which is 30,000 extra requests. Capping retries as a percentage of total traffic is what actually prevents amplification.",
        },
      },
      {
        heading: "Bulkheads and fallbacks",
        bullets: [
          "Bulkhead: give each dependency its own bounded pool of connections or concurrency slots. When one dependency hangs, it can consume only its own pool, and calls to everything else keep working.",
          "This is the pattern that saves you when a breaker is too slow — a hung dependency with its own 10-slot pool blocks 10 requests, not your whole thread pool.",
          "Fallbacks should be genuinely cheap and independent: a cached value, a static default, a degraded response. A fallback that calls another service has just moved the problem.",
          "Make degradation visible. A silent fallback that runs for three days is a bug nobody noticed; emit a metric and alert on sustained fallback rates.",
          "Load shedding is the inward-facing twin: when your own queues grow, reject early with 503 and Retry-After rather than accepting work you cannot finish.",
        ],
        diagram: {
          kind: "system",
          caption: "One hung dependency consumes its own bulkhead and nothing else.",
          columns: [
            {
              title: "Request",
              nodes: [{ id: "r", label: "Product page", sub: "3s budget", tone: "accent" }],
            },
            {
              title: "Bulkheads",
              nodes: [
                { id: "b1", label: "catalog pool", sub: "50 slots · critical", tone: "ok" },
                { id: "b2", label: "recs pool", sub: "10 slots · optional", tone: "warn" },
                { id: "b3", label: "reviews pool", sub: "10 slots · optional", tone: "warn" },
              ],
            },
            {
              title: "On failure",
              nodes: [
                { id: "f1", label: "catalog fails → 503", sub: "no meaningful page" },
                {
                  id: "f2",
                  label: "recs fail → best sellers",
                  sub: "breaker open, fallback",
                  tone: "ok",
                },
                {
                  id: "f3",
                  label: "reviews fail → hide section",
                  sub: "page still renders",
                  tone: "ok",
                },
              ],
            },
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you set a circuit breaker's thresholds?",
            a: "From the dependency's normal behaviour rather than from a default. The failure rate threshold sits well above the baseline error rate — 50% is common when normal is under 1% — with a minimum request count so quiet periods do not trip it. The cooldown should be roughly how long the dependency typically takes to recover, and I would rather start conservative and tune, since a breaker that trips too eagerly causes its own outages.",
          },
          {
            q: "When should you not retry?",
            a: "When the failure is permanent — a validation error, a 404, an authorisation failure — because the retry cannot succeed and just costs capacity. Also when the operation is not idempotent and carries no idempotency key, since a timeout means 'unknown outcome', and retrying a charge can double-bill. And when the deadline has nearly expired: retrying past the point where the answer is still useful only adds load.",
          },
          {
            q: "A dependency is slow but not failing. Does the breaker help?",
            a: "Only if I count timeouts as failures, which I would. But the more reliable protection is a bulkhead: a bounded concurrency pool per dependency means a hung service can consume at most its own slots. Combined with a timeout shorter than the caller's budget, slowness converts into fast failures the breaker can then act on.",
          },
          {
            q: "How do you test this?",
            a: "Fault injection — deliberately delay and fail a dependency in a staging environment or a small percentage of production traffic, and verify the breaker opens, the fallback fires, and the request budget holds. Untested resilience code is usually broken resilience code; I have seen fallbacks that themselves called the failing service. Game days are the systematic version of this.",
          },
        ],
      },
    ],
    playground: "circuit-breaker",
    related: ["/hld/availability", "/lld/decorator", "/hld/rate-limiting", "/hld/observability"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
  },

  {
    slug: "idempotency",
    title: "Idempotency",
    subtitle: "Make retries safe, because in a distributed system everything is retried.",
    level: "intermediate",
    minutes: 14,
    tags: ["reliability", "api-design", "correctness"],
    summary:
      "A timeout does not mean the operation failed — it means you do not know. The client will retry, the queue will redeliver, the user will click again. Idempotency is the property that makes all of that harmless: performing the operation twice has the same effect as performing it once.",
    keyPoints: [
      "Timeouts are the fundamental problem: the request may have succeeded, and you cannot tell.",
      "GET, PUT and DELETE are naturally idempotent; POST is not, which is why it needs a key.",
      "An idempotency key must be generated by the client, stored server-side with the result, and returned on replay.",
      "Store the key and the effect in one transaction, or a crash between them reopens the hole.",
      "Natural idempotency — set rather than increment, upsert on a unique key — is better than bolted-on keys.",
    ],
    sections: [
      {
        heading: "Why it is unavoidable",
        diagram: {
          kind: "sequence",
          caption:
            "The client cannot distinguish these two cases, so it must assume the worst and retry.",
          actors: [
            { id: "c", label: "Client" },
            { id: "s", label: "Payment service" },
            { id: "db", label: "Ledger" },
          ],
          messages: [
            { from: "c", to: "s", label: "POST /charges {amount: 5000}", kind: "call" },
            { from: "s", to: "db", label: "INSERT charge", kind: "call" },
            { from: "db", to: "s", label: "committed", kind: "return", tone: "ok" },
            {
              from: "s",
              to: "c",
              label: "200 — response lost in the network",
              kind: "return",
              tone: "bad",
              note: "✗ never arrives",
            },
            { from: "c", to: "c", label: "timeout → retry", kind: "self", tone: "warn" },
            {
              from: "c",
              to: "s",
              label: "POST /charges {amount: 5000} — again",
              kind: "call",
              tone: "warn",
              note: "without an idempotency key: customer charged twice",
            },
          ],
        },
        bullets: [
          "The client cannot know whether a timed-out request succeeded, so the only safe policies are 'retry and hope it is idempotent' or 'never retry and risk losing the operation'. Idempotency makes the first one correct.",
          "It is not only clients. Queue redelivery, load balancer retries, a user double-clicking, a mobile app resuming from background, and a proxy retrying an idle connection all produce duplicates.",
          "At-least-once delivery is the norm in every messaging system. That is a statement about your consumers, not about the broker.",
        ],
      },
      {
        heading: "Which operations are naturally safe",
        table: {
          headers: ["Operation", "Idempotent?", "Why"],
          rows: [
            ["GET /orders/42", "Yes", "No side effect"],
            [
              "PUT /users/42 {name: 'Ada'}",
              "Yes",
              "Sets an absolute value — applying twice gives the same state",
            ],
            [
              "DELETE /orders/42",
              "Yes",
              "Second delete is a no-op; return 204 either way, not 404",
            ],
            [
              "POST /orders",
              "No",
              "Creates a new resource each time — this is the one that needs a key",
            ],
            [
              "UPDATE balance SET amount = amount - 50",
              "No",
              "Relative change; applying twice subtracts 100",
            ],
            [
              "UPDATE balance SET amount = 950 WHERE version = 7",
              "Yes",
              "Absolute value plus a version guard",
            ],
            [
              "INSERT ... ON CONFLICT DO NOTHING",
              "Yes",
              "Second insert is absorbed by the unique constraint",
            ],
            [
              "queue.publish(event)",
              "No",
              "Two publishes, two messages — dedupe on the consumer side",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "Prefer designing operations to be naturally idempotent over adding keys. 'Set the status to shipped' is safe to repeat; 'advance the status' is not. That choice costs nothing at design time and removes a whole class of bug.",
        },
      },
      {
        heading: "Idempotency keys, done correctly",
        code: {
          title: "The full server-side pattern",
          lang: "ts",
          source: `// The client generates the key ONCE per logical operation and reuses it
// across every retry of that same operation.
//   POST /v1/charges
//   Idempotency-Key: 8f14e45f-ea0f-4f0b-9b3e-2c0f4b1a9d21

async function createCharge(req: Request) {
  const key = req.header("Idempotency-Key");
  if (!key) return badRequest("Idempotency-Key required");

  const fingerprint = hash(req.body);   // guard against key reuse with a different body

  return db.transaction(async (tx) => {
    // Claim the key. The unique constraint is what makes this a lock.
    const claim = await tx\`
      INSERT INTO idempotency_keys (key, fingerprint, state, created_at)
      VALUES (\${key}, \${fingerprint}, 'in_progress', now())
      ON CONFLICT (key) DO NOTHING
      RETURNING key\`;

    if (claim.length === 0) {
      const existing = await tx\`SELECT * FROM idempotency_keys WHERE key = \${key}\`;

      if (existing[0].fingerprint !== fingerprint) {
        return conflict("Idempotency-Key reused with a different payload");  // 422
      }
      if (existing[0].state === "in_progress") {
        return conflict409("Request already in progress, retry shortly");    // 409
      }
      return replay(existing[0].response);   // same status, same body, same charge id
    }

    // First time through: do the work in the SAME transaction as the claim.
    const charge = await performCharge(tx, req.body);
    const response = { status: 201, body: charge };

    await tx\`UPDATE idempotency_keys
             SET state = 'completed', response = \${JSON.stringify(response)}
             WHERE key = \${key}\`;

    return response;
  });
}

// Expire keys after 24h — long enough to cover any sane retry window,
// short enough that the table does not grow forever.`,
        },
        bullets: [
          "The claim and the effect must be in one transaction. If you record the key first and crash before doing the work, the retry sees 'completed' and returns success for something that never happened.",
          "Store the response, not just a flag. A replay should return the original status and body — including the resource id — or the client cannot correlate its retry with the resource that exists.",
          "Fingerprint the payload. If a client reuses a key with different content, that is a bug on their side and should be a clear 4xx, not a silent replay of the wrong thing.",
          "Handle the in-progress case explicitly: two concurrent retries will race, and the loser should get a 409 telling it to try again shortly rather than blocking.",
          "Key scope should include the caller: an idempotency key from tenant A must never collide with tenant B's.",
        ],
      },
      {
        heading: "External side effects",
        body: [
          "Database work is the easy case, because a transaction can cover both the key and the effect. Sending an email, calling a payment provider or publishing an event cannot be rolled back, which is where the interesting design lives.",
        ],
        bullets: [
          "Push idempotency downstream: every good payment API accepts an idempotency key. Derive it deterministically from your own operation id so a retry sends the same key.",
          "Two-phase with a record: write 'intending to send email X for order Y' in the transaction, then send it in a separate step that marks it sent. Worst case is a duplicate email, never a lost one — choose which failure you prefer and say so.",
          "For events, the transactional outbox: the event row commits with the state change, and a relay publishes at-least-once. Consumers dedupe on the event id.",
          "Design the user-visible behaviour around the residual duplicate risk. A duplicate 'your order shipped' email is a minor annoyance; a duplicate charge is not, which is why charges get keys and emails often do not.",
        ],
        code: {
          title: "Deterministic keys for downstream calls",
          lang: "ts",
          source: `// Derive the downstream key from your own operation so retries match.
const stripeKey = \`order:\${order.id}:capture:\${order.attemptNumber}\`;
await stripe.paymentIntents.create(params, { idempotencyKey: stripeKey });

// NOT this — a fresh uuid per attempt defeats the entire mechanism:
// { idempotencyKey: crypto.randomUUID() }`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How would you make this API safe to retry?",
            a: "Require an Idempotency-Key header on every mutating request, claimed with a unique constraint in the same transaction as the work, storing the response so a replay returns the original result including the resource id. I would also fingerprint the body so a key reused with different content is rejected rather than silently replayed, and expire keys after a day.",
          },
          {
            q: "The client retries and the first request is still running. What do you return?",
            a: "409 with a message telling them to retry shortly. Blocking until the first completes is tempting but ties up a connection and can cascade; returning success would be wrong because I do not yet know the outcome. The key is claimed in state 'in_progress' precisely so this case is detectable rather than racing into a duplicate.",
          },
          {
            q: "How do you handle idempotency for a message consumer?",
            a: "The consumer records the message id in the same transaction as its side effect, with a unique constraint absorbing duplicates. That converts at-least-once delivery into effectively-once processing. Where the side effect is external, I pass a deterministic idempotency key derived from the message id, so the downstream system does the deduplication.",
          },
          {
            q: "Is idempotency the same as exactly-once?",
            a: "No, and the distinction matters. Exactly-once delivery is not achievable across an unreliable network — the acknowledgement can always be lost. Idempotency accepts that messages and requests arrive more than once and makes the outcome identical to arriving once. That is why the practical guarantee everyone builds on is at-least-once delivery plus idempotent processing.",
          },
        ],
      },
    ],
    related: [
      "/hld/message-queues",
      "/examples/payment",
      "/hld/rest-vs-graphql",
      "/lld/concurrency",
    ],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "bloom-filters",
    title: "Bloom Filters & Probabilistic Structures",
    subtitle: "Answer 'have I definitely not seen this?' in a few bits per item.",
    level: "intermediate",
    minutes: 13,
    tags: ["algorithms", "performance", "data-structures"],
    summary:
      "A Bloom filter answers set membership with no false negatives and a tunable rate of false positives, using roughly 10 bits per element instead of storing the elements. That asymmetry is exactly what a cache or storage layer needs: 'definitely not here' lets you skip an expensive lookup entirely.",
    keyPoints: [
      "No false negatives, tunable false positives. 'Maybe present' or 'definitely absent' — never a wrong 'absent'.",
      "~10 bits per element gives about 1% false positives; ~14 bits gives 0.1%.",
      "Cannot delete from a standard Bloom filter — use a counting or cuckoo filter if you must.",
      "Used in front of expensive lookups: LSM-tree SSTables, cache penetration guards, duplicate detection.",
      "The family extends: HyperLogLog for cardinality, count-min sketch for frequency, quotient/cuckoo filters for deletable membership.",
    ],
    sections: [
      {
        heading: "How it works",
        steps: [
          {
            title: "A bit array and k hash functions",
            text: "Start with m bits, all zero, and k independent hash functions mapping an element to k positions.",
          },
          {
            title: "Insert: set k bits",
            text: "Hash the element k times and set each corresponding bit to 1. Bits are shared between elements, which is where the space saving and the false positives both come from.",
          },
          {
            title: "Query: check k bits",
            text: "If any of the k bits is 0, the element was definitely never inserted. If all k are 1, it is probably present — or those bits happened to be set by other elements.",
          },
          {
            title: "Tune m and k",
            text: "For n expected elements and a target false-positive rate p, the optimal sizing is m = −n·ln(p)/(ln2)² bits and k = (m/n)·ln2 hashes.",
            detail: "n=1,000,000 and p=1% → m ≈ 9.6 Mbit ≈ 1.2 MB, k ≈ 7",
          },
        ],
        diagram: {
          kind: "flow",
          caption: "Any zero bit is a definitive 'no'. All ones is a 'probably'.",
          rows: [
            [
              { id: "a", label: "insert('alice')", sub: "sets bits 3, 11, 24", tone: "accent" },
              { id: "b", label: "insert('bob')", sub: "sets bits 7, 11, 30", tone: "accent" },
            ],
            [
              {
                id: "q1",
                label: "query('carol')",
                sub: "bit 5 is 0 → definitely absent",
                tone: "ok",
              },
              {
                id: "q2",
                label: "query('dave')",
                sub: "bits 3, 7, 30 all 1 → false positive",
                tone: "warn",
              },
            ],
          ],
        },
        math: [
          {
            label: "Bits per element",
            expr: "m/n = −ln(p) / (ln 2)²",
            result: "p=1% → 9.6 bits",
            note: "p=0.1% → 14.4 bits; p=10% → 4.8 bits.",
          },
          {
            label: "Optimal hash count",
            expr: "k = (m/n) × ln 2",
            result: "≈ 7 for p=1%",
          },
          {
            label: "1 M URLs, 1% error",
            expr: "1,000,000 × 9.6 bits",
            result: "≈ 1.2 MB",
            note: "Storing the URLs themselves would be ~60 MB, plus index overhead.",
          },
          {
            label: "Cost of a false positive",
            expr: "1% × cost of the lookup you were trying to skip",
            result: "usually negligible",
            note: "You do the expensive check and find nothing — correctness is unaffected.",
          },
        ],
      },
      {
        heading: "Where it earns its place",
        table: {
          headers: ["Use", "The expensive thing it skips", "Effect of a false positive"],
          rows: [
            [
              "LSM-tree / SSTable reads",
              "Reading a file from disk to find a key that is not there",
              "One wasted disk read — this is why Cassandra and RocksDB ship them",
            ],
            [
              "Cache penetration guard",
              "A database query for a key that does not exist",
              "One wasted query; still stops the attack pattern",
            ],
            [
              "Web crawler URL seen-set",
              "Storing and checking billions of URLs",
              "A page is skipped — acceptable at crawl scale",
            ],
            [
              "Username availability",
              "A database round trip for every keystroke",
              "'Taken' shown for a free name — so confirm on submit",
            ],
            [
              "Malicious URL / password checks",
              "Downloading or querying a huge list",
              "An extra server check for a safe URL",
            ],
            [
              "Deduplicating a stream",
              "A large exact set in memory",
              "A legitimate item dropped as a duplicate — often NOT acceptable",
            ],
          ],
        },
        callout: {
          kind: "warn",
          text: "Check the direction of the error before using one. A false positive means 'maybe present' when it is absent. That is harmless for skipping a lookup and harmful for deduplication, where it silently discards real data.",
        },
        code: {
          title: "Cache penetration guard",
          lang: "ts",
          source: `// Populated with every key that exists, rebuilt periodically.
const exists = new BloomFilter({ expectedItems: 10_000_000, falsePositiveRate: 0.01 });

async function getUser(id: string) {
  if (!exists.mightContain(id)) return null;     // definitively absent: no query at all

  const cached = await cache.get(\`user:\${id}\`);
  if (cached) return cached === NULL_SENTINEL ? null : cached;

  const row = await db.users.byId(id);           // reached only for real or false-positive ids
  await cache.set(\`user:\${id}\`, row ?? NULL_SENTINEL, { ttl: row ? 300 : 30 });
  return row;
}

// New users must be added to the filter on creation, or they are
// permanently invisible — a false NEGATIVE, which the structure
// does not otherwise allow and which you would have introduced yourself.`,
        },
      },
      {
        heading: "Limits, and the variants that address them",
        table: {
          headers: ["Structure", "Answers", "Space", "Notes"],
          rows: [
            [
              "Bloom filter",
              "Membership, no deletion",
              "~10 bits/item at 1%",
              "The baseline; simple and fast",
            ],
            [
              "Counting Bloom",
              "Membership with deletion",
              "4× a Bloom filter",
              "Counters instead of bits; can overflow",
            ],
            [
              "Cuckoo filter",
              "Membership with deletion",
              "Comparable, often better at low p",
              "Deletes cleanly; supports lookups of fingerprints",
            ],
            ["Quotient filter", "Membership, mergeable", "Similar", "Cache-friendly, resizable"],
            [
              "HyperLogLog",
              "Approximate cardinality",
              "~12 KB for ±2% on billions",
              "Unique visitors without storing ids; merges across shards",
            ],
            [
              "Count-min sketch",
              "Approximate frequency",
              "Configurable",
              "Heavy hitters, hot-key detection",
            ],
            [
              "Top-K / Space-Saving",
              "The k most frequent items",
              "O(k)",
              "Trending topics, hot tenants",
            ],
          ],
        },
        bullets: [
          "You cannot resize a Bloom filter. Size for the expected count with headroom, or plan to rebuild — a filter loaded past its design capacity degrades to answering 'maybe' for everything.",
          "You cannot enumerate or delete. If the set shrinks, the only fix is to rebuild from the source of truth, so a periodic rebuild is standard operating practice.",
          "Two filters over the same parameters can be unioned with a bitwise OR — which makes them easy to build in parallel across shards and merge.",
          "Use one fast hash (murmur, xxhash) and derive k indices from two values via double hashing, rather than running k independent hashes.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Where would you use a Bloom filter in this design?",
            a: "In front of any expensive lookup where most answers are 'not found'. In a URL shortener, to check whether a custom alias is taken without hitting the database on every keystroke. In a crawler, as the seen-URL set. In a storage engine, to avoid reading SSTables that cannot contain the key. The common shape is that a false positive costs one wasted lookup and a false negative would be a correctness bug — which is exactly the error profile the structure gives.",
          },
          {
            q: "How do you size one?",
            a: "From the expected item count and the false-positive rate I can tolerate. Roughly ten bits per item gives one percent, fourteen gives a tenth of a percent, and the optimal hash count is about 0.7 times the bits per item. For a million items at one percent that is about 1.2 MB and seven hashes. I would add headroom, because loading it past its design count pushes the false-positive rate up sharply.",
          },
          {
            q: "What if an item is deleted?",
            a: "A standard Bloom filter cannot delete, because clearing bits would create false negatives for other items sharing them. If deletions are rare, I rebuild periodically from the source of truth. If they are frequent, I would use a cuckoo filter, which supports deletion at comparable space and often better false-positive rates at low thresholds.",
          },
          {
            q: "How would you count unique visitors across 100 servers?",
            a: "HyperLogLog. Each server maintains its own sketch — around 12 KB for a couple of percent error — and the sketches merge by taking the maximum per register, so a global count is a cheap union rather than a shuffle of raw ids. Exact counting would mean shipping every visitor id somewhere central, which is orders of magnitude more data for precision nobody needs on a dashboard.",
          },
        ],
      },
    ],
    playground: "bloom-filter",
    related: [
      "/hld/caching",
      "/examples/url-shortener",
      "/examples/web-crawler",
      "/hld/estimation",
    ],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "gossip",
    title: "Gossip Protocols & Failure Detection",
    subtitle: "How a cluster learns who is alive without a central registry.",
    level: "advanced",
    minutes: 12,
    tags: ["distributed", "membership", "operations"],
    summary:
      "In a large cluster, every node needs to know which other nodes exist and which are alive. Asking a central service creates a bottleneck and a single point of failure; having every node ping every other is O(n²) traffic. Gossip solves it the way rumours spread: each node periodically tells a few random peers what it knows, and information reaches everyone in logarithmic time.",
    keyPoints: [
      "Each round, every node exchanges state with a small random subset. Convergence takes O(log n) rounds.",
      "Traffic per node is constant regardless of cluster size — that is the whole point.",
      "Failure detection is a suspicion process, not a fact: a slow node and a dead node look identical.",
      "SWIM adds indirect probing to cut false positives, and a suspicion phase before declaring death.",
      "Gossip gives eventual consistency of membership — it is not a substitute for consensus.",
    ],
    sections: [
      {
        heading: "Why not the obvious alternatives",
        table: {
          headers: ["Approach", "Traffic", "Failure mode", "Used by"],
          rows: [
            [
              "Central registry (ZooKeeper, etcd)",
              "O(n) heartbeats to the registry",
              "Registry is a dependency and a bottleneck; strongly consistent though",
              "Kafka (historically), HDFS, many schedulers",
            ],
            [
              "All-to-all heartbeats",
              "O(n²) messages per round",
              "Collapses past a few hundred nodes",
              "Small clusters only",
            ],
            [
              "Gossip",
              "O(1) per node per round",
              "Eventually consistent view; false positives under load",
              "Cassandra, Consul, Serf, Riak, Redis Cluster",
            ],
          ],
        },
        math: [
          {
            label: "Convergence",
            expr: "≈ log(n) / log(fanout) rounds",
            result: "1000 nodes, fanout 3 → ~6 rounds",
            note: "At one round per second, the whole cluster knows within seconds.",
          },
          {
            label: "Traffic per node",
            expr: "fanout × message size per round",
            result: "constant in n",
            note: "This is why gossip scales where all-to-all does not.",
          },
          {
            label: "All-to-all at 1000 nodes",
            expr: "1000 × 999 messages per round",
            result: "≈ 1 M/round",
            note: "Unworkable — and each node processes 999 messages per interval.",
          },
        ],
      },
      {
        heading: "The mechanics",
        steps: [
          {
            title: "Maintain a local view",
            text: "Each node keeps a table of every peer it knows about: address, state (alive, suspect, dead), and a version — a heartbeat counter or logical clock — used to decide whose information is newer.",
          },
          {
            title: "Gossip on a fixed interval",
            text: "Every second or so, pick a small number of random peers and exchange views. Merge by taking the entry with the higher version for each node.",
            detail: "Random selection is what makes convergence exponential rather than linear.",
          },
          {
            title: "Detect failure by probing",
            text: "Send a direct ping. If it does not answer within the timeout, do not declare it dead — ask k other nodes to probe it on your behalf. This distinguishes 'the node is dead' from 'my path to it is broken'.",
            detail:
              "This indirect probe is SWIM's central idea, and it removes most false positives.",
          },
          {
            title: "Suspect before declaring dead",
            text: "Mark it suspect and gossip that suspicion. If the node hears it, it refutes with a higher version number and is restored. Only after a suspicion timeout does it become dead.",
          },
          {
            title: "Propagate the conclusion",
            text: "The death is gossiped like any other state, so within a few rounds the whole cluster stops routing to it.",
          },
        ],
        diagram: {
          kind: "sequence",
          caption: "SWIM's indirect probe: three nodes must agree before a node is suspected.",
          actors: [
            { id: "a", label: "Node A", sub: "prober" },
            { id: "b", label: "Node B", sub: "target" },
            { id: "c", label: "Node C", sub: "helper" },
            { id: "d", label: "Node D", sub: "helper" },
          ],
          messages: [
            { from: "a", to: "b", label: "ping", kind: "call" },
            { from: "a", to: "a", label: "no ack within timeout", kind: "self", tone: "warn" },
            {
              from: "a",
              to: "c",
              label: "ping-req(B)",
              kind: "call",
              note: "ask others to try — maybe it is my network",
            },
            { from: "a", to: "d", label: "ping-req(B)", kind: "call" },
            { from: "c", to: "b", label: "ping", kind: "call" },
            { from: "d", to: "b", label: "ping", kind: "call" },
            { from: "c", to: "a", label: "no ack", kind: "return", tone: "warn" },
            { from: "d", to: "a", label: "no ack", kind: "return", tone: "warn" },
            {
              from: "a",
              to: "a",
              label: "mark B suspect, gossip it",
              kind: "self",
              tone: "bad",
              note: "B can still refute with a higher incarnation number",
            },
          ],
        },
      },
      {
        heading: "The tuning problem",
        bullets: [
          "Every failure detector trades detection time against false positives. A 1-second timeout finds failures fast and flags every GC pause; a 30-second timeout is accurate and leaves traffic going to a dead node for half a minute.",
          "Phi-accrual detectors (used by Cassandra and Akka) replace a fixed timeout with a suspicion level computed from the observed distribution of heartbeat intervals — so a consistently slow network raises the threshold automatically.",
          "Under load, everything looks like a failure: a saturated node cannot answer probes, gets marked dead, its traffic moves elsewhere, and the next node saturates. That feedback loop is a real production failure mode.",
          "Cluster-wide correlated pauses — a bad deploy, a noisy neighbour, a network blip — can produce mass false suspicion. Most implementations have a guard that stops the cluster declaring too many nodes dead at once.",
          "Gossip messages should carry a bounded amount of state; piggyback recent updates rather than sending the full membership table every round.",
        ],
        callout: {
          kind: "insight",
          text: "The fundamental impossibility: a crashed node and a slow node are indistinguishable over an asynchronous network. Every failure detector is a heuristic that trades speed against accuracy, and any design that claims otherwise is hiding an assumption about timing.",
        },
      },
      {
        heading: "What gossip is and is not for",
        diagram: {
          kind: "compare",
          caption: "Two coordination tools for two different jobs.",
          options: [
            {
              title: "Gossip — eventual",
              good: [
                "Scales to thousands of nodes with constant per-node cost",
                "No single point of failure, no bootstrap dependency",
                "Robust to partial network failures",
              ],
              bad: [
                "Views converge eventually, and nodes disagree in the meantime",
                "Cannot decide anything requiring agreement",
                "Tuning false positives is a permanent chore",
              ],
              verdict: "Membership, health, and propagating configuration hints.",
            },
            {
              title: "Consensus — immediate agreement",
              good: ["One authoritative answer; linearizable", "Correct leader election and locks"],
              bad: [
                "Majority round trip per decision",
                "Cluster size practically limited to 5-7 voting members",
              ],
              verdict: "Leadership, locks, configuration that must never diverge.",
            },
          ],
        },
        bullets: [
          "Large systems use both: gossip for membership and health across hundreds of nodes, plus a small consensus group for decisions that must be unambiguous.",
          "Gossip also carries useful non-membership data: Cassandra spreads schema versions and load information the same way, and Consul spreads service health.",
          "Anti-entropy is gossip applied to data: nodes periodically compare Merkle trees of their key ranges and reconcile differences, which is how leaderless stores heal cold data that read repair never touches.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Why gossip instead of a central registry?",
            a: "Scale and failure independence. A registry is a dependency every node needs to be healthy, and its own availability becomes the cluster's ceiling. Gossip has constant per-node cost regardless of size and keeps working through partial network failures. The trade is that membership is eventually consistent, so I would still keep a small consensus group for anything requiring an authoritative decision, like who is the leader.",
          },
          {
            q: "How do you avoid declaring a healthy node dead?",
            a: "Indirect probing first — if my direct ping fails, I ask a few other nodes to try, which distinguishes a dead node from a broken path. Then a suspicion phase, gossiped so the node itself can refute it with a higher incarnation number. And an adaptive threshold rather than a fixed timeout, so a generally slower network does not produce constant false positives.",
          },
          {
            q: "How long until the whole cluster knows about a failure?",
            a: "Detection plus propagation. Detection is the probe timeout plus the suspicion window, typically a few seconds. Propagation is logarithmic in cluster size — with a fanout of three and a one-second interval, a thousand nodes converge in roughly six seconds. So the practical answer is seconds, and the tunable part is almost entirely in the detection phase.",
          },
          {
            q: "What happens during a network partition?",
            a: "Each side gossips internally and concludes the other side is dead, so you get two self-consistent views of the cluster. Gossip alone will not stop both halves acting, which is exactly why anything requiring uniqueness — a leader, a lock, ownership of a shard — must go through a majority-based mechanism instead. Membership can be eventually consistent; authority cannot.",
          },
        ],
      },
    ],
    related: [
      "/hld/consensus",
      "/hld/availability",
      "/hld/consistent-hashing",
      "/hld/observability",
    ],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
