import type { Concept } from "@/data/types";

export const hldPlatform: Concept[] = [
  {
    slug: "api-gateway",
    title: "API Gateway",
    subtitle: "One entry point for cross-cutting concerns — and one place to be careful.",
    level: "intermediate",
    minutes: 14,
    tags: ["architecture", "api-design", "edge"],
    summary:
      "An API gateway sits between clients and your services and handles what every service would otherwise implement separately: TLS, authentication, rate limiting, routing, and request logging. That consolidation is genuinely valuable and quietly dangerous — it is a single point of failure and a magnet for business logic that does not belong there.",
    keyPoints: [
      "Gateways own cross-cutting concerns: TLS, authn, rate limiting, routing, observability.",
      "Authentication belongs at the gateway; authorization on the object usually belongs in the service.",
      "Keep it thin. Business logic in the gateway couples every service to a shared deployment.",
      "It must be redundant and horizontally scaled, or it is your availability ceiling.",
      "Backend-for-frontend is a separate gateway per client type, and often better than one universal API.",
    ],
    sections: [
      {
        heading: "What belongs there, and what does not",
        diagram: {
          kind: "compare",
          caption: "The line to hold in a design review.",
          options: [
            {
              title: "Belongs in the gateway",
              tone: "ok",
              good: [
                "TLS termination and certificate management",
                "Authentication: verify the token, attach identity",
                "Rate limiting and quota enforcement per client",
                "Routing by path or host; API versioning",
                "Request/response logging, tracing headers, correlation ids",
                "Request size limits, timeouts, basic schema validation",
                "CORS, compression, header normalisation",
              ],
              bad: [],
              verdict: "Anything every service would otherwise duplicate identically.",
            },
            {
              title: "Does not belong there",
              tone: "warn",
              good: [],
              bad: [
                "Business rules — 'orders over $500 need approval'",
                "Data transformation specific to one service",
                "Object-level authorization needing domain state",
                "Orchestrating multi-service workflows",
                "Caching that requires knowing domain invalidation rules",
              ],
              verdict: "Anything that changes when one service's domain changes.",
            },
          ],
        },
        callout: {
          kind: "warn",
          text: "The failure mode to name: business logic accumulates in the gateway until every team must coordinate on its deployment. It becomes a shared bottleneck with no owner — the same problem an enterprise service bus had, wearing newer clothes.",
        },
      },
      {
        heading: "The request path",
        diagram: {
          kind: "sequence",
          caption: "Order matters: reject cheaply before doing expensive work.",
          actors: [
            { id: "c", label: "Client" },
            { id: "g", label: "Gateway" },
            { id: "a", label: "Auth", sub: "JWKS cache" },
            { id: "r", label: "Rate limiter", sub: "Redis" },
            { id: "s", label: "Service" },
          ],
          messages: [
            { from: "c", to: "g", label: "POST /v1/orders + Bearer token", kind: "call" },
            { from: "g", to: "g", label: "TLS terminate · size limit · CORS", kind: "self", note: "cheapest checks first" },
            { from: "g", to: "a", label: "verify signature (public key cached)", kind: "call", note: "local verification — no network call in the common case" },
            { from: "a", to: "g", label: "claims: sub, scopes, tenant", kind: "return", tone: "ok" },
            { from: "g", to: "r", label: "allow(tenant, /v1/orders)?", kind: "call" },
            { from: "r", to: "g", label: "ok, remaining 842", kind: "return" },
            { from: "g", to: "s", label: "forward + X-Request-Id, X-User-Id, traceparent", kind: "call", note: "identity is trusted here because the network is not reachable from outside" },
            { from: "s", to: "g", label: "201", kind: "return" },
            { from: "g", to: "c", label: "201 + RateLimit-* headers", kind: "return", tone: "ok" },
          ],
        },
        bullets: [
          "Verify JWTs locally against cached public keys (JWKS) rather than calling an auth service per request — that call would be on every request's critical path.",
          "Strip client-supplied identity headers at the edge. If a client can send X-User-Id and the gateway forwards it, you have an authentication bypass.",
          "Services should still verify identity if they are reachable from anywhere but the gateway. 'The network protects us' is only true if it actually does.",
          "Propagate a request id and W3C traceparent from the very first hop, or distributed traces start halfway through the request.",
        ],
      },
      {
        heading: "Gateway, load balancer, service mesh",
        table: {
          headers: ["", "Traffic", "Concerns", "Where it runs"],
          rows: [
            [
              "Load balancer",
              "North-south, layer 4/7",
              "Distribution, health checks, TLS",
              "In front of a pool of identical instances",
            ],
            [
              "API gateway",
              "North-south, layer 7",
              "Auth, rate limiting, routing, versioning, quotas",
              "Between clients and many different services",
            ],
            [
              "Service mesh",
              "East-west, between services",
              "mTLS, retries, circuit breaking, traffic shifting, telemetry",
              "A sidecar next to every service instance",
            ],
            [
              "BFF",
              "North-south, per client type",
              "Aggregating and shaping responses for one UI",
              "One per client: web, iOS, partner",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "They compose rather than compete: a load balancer in front of gateway instances, gateways handling client traffic, and a mesh handling service-to-service. Naming which layer owns which concern is a strong signal in an architecture discussion.",
        },
      },
      {
        heading: "Backend-for-frontend",
        body: [
          "One universal API for a web app, an iOS app and a partner integration ends up serving none of them well: the mobile client over-fetches, the web client makes six calls, and the partner sees fields meant for internal use. A BFF is a thin gateway per client type that aggregates and shapes exactly what that client needs.",
        ],
        bullets: [
          "Owned by the client team, so the shape of the API changes at the pace of the UI rather than at the pace of a shared platform.",
          "It aggregates: one BFF call becomes three parallel service calls, cutting mobile round trips from six to one.",
          "The risk is duplication across BFFs and a temptation to put business rules in them. Keep them shaping and aggregating, not deciding.",
          "GraphQL is one way to get the same benefit without a BFF per client — the client specifies the shape instead of the BFF encoding it.",
        ],
        code: {
          title: "Aggregation with independent failure",
          lang: "ts",
          source: `// One client call → parallel service calls, with per-dependency degradation.
app.get("/bff/home", async (req, res) => {
  const deadline = Date.now() + 800;

  const [user, orders, recs] = await Promise.all([
    users.get(req.userId, { deadline }),                       // critical
    orders.recent(req.userId, 5, { deadline }).catch(() => []), // optional
    recs.forUser(req.userId, { timeoutMs: 150 })
        .catch(() => staticPopular()),                          // optional + fallback
  ]);

  res.json({
    name: user.name,                       // exactly the fields this screen renders
    avatar: user.avatarUrl,
    recentOrders: orders.map(toCard),
    recommendations: recs.slice(0, 6),
  });
});`,
        },
      },
      {
        heading: "Operating it",
        bullets: [
          "Run at least two instances behind a load balancer across availability zones. A single gateway instance makes every service's availability equal to one process's.",
          "Keep it stateless: rate-limit counters in Redis, config from a control plane, no per-connection memory that matters.",
          "Config changes are deployments in disguise. A bad route rule affects every service at once, so treat gateway config with the same review and canary process as code.",
          "Watch p99 added latency as a specific metric. A gateway should add single-digit milliseconds; when it does not, something in the chain is doing a network call it should not.",
          "Have a bypass plan. For a genuinely critical path, knowing how to route around a broken gateway is worth designing before you need it.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "What would you put in the gateway?",
            a: "TLS termination, authentication, rate limiting, routing and the observability headers — the things every service would otherwise implement identically and slightly differently. What I keep out is anything that changes when a domain changes: business rules, object-level authorization that needs the entity, and multi-service orchestration. The test is whether a change to one service's logic would require deploying the gateway.",
          },
          {
            q: "Isn't the gateway a single point of failure?",
            a: "It is, which is why it runs as multiple stateless instances across availability zones behind a load balancer, and why its config changes get the same canary treatment as code. The residual risk is that a bad config affects everything at once — that is the real single point of failure, more than the process is. For very critical paths I would want a documented bypass route.",
          },
          {
            q: "Where does authorization happen?",
            a: "Authentication at the gateway — verify the token, attach the identity — because it is identical for every service. Coarse scope checks can also live there. But object-level authorization, like whether this user may cancel this particular order, needs domain state, so it belongs in the service that owns that state. Splitting it this way keeps the gateway free of domain knowledge.",
          },
          {
            q: "Would you build one or use an off-the-shelf gateway?",
            a: "Use one — Envoy, Kong, or a cloud gateway — because the hard parts are protocol edge cases, connection handling and TLS, all of which are solved. What I would write myself is a thin BFF layer for aggregation, which is application code rather than infrastructure and genuinely benefits from being owned by the client team.",
          },
        ],
      },
    ],
    related: ["/hld/load-balancing", "/hld/rate-limiting", "/hld/rest-vs-graphql", "/hld/observability"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "observability",
    title: "Observability: Metrics, Logs and Traces",
    subtitle: "Being able to answer questions you did not think to ask in advance.",
    level: "intermediate",
    minutes: 15,
    tags: ["operations", "monitoring", "reliability"],
    summary:
      "Monitoring tells you that something is wrong; observability lets you work out why without shipping new code. The three signals do different jobs — metrics show you the shape of the problem, traces show you where it lives, logs tell you what happened — and knowing which to reach for is most of the skill.",
    keyPoints: [
      "Metrics are cheap and aggregate; logs are expensive and specific; traces show causality across services.",
      "Percentiles, never averages: the average hides exactly the users who are suffering.",
      "Alert on symptoms users feel (latency, errors, saturation), not on causes like CPU.",
      "High cardinality is what makes debugging possible and what makes metrics expensive — put it in traces and logs.",
      "Correlate everything with a trace id, or you are searching three systems by hand.",
    ],
    sections: [
      {
        heading: "The three signals",
        table: {
          headers: ["Signal", "Answers", "Cost", "Cardinality"],
          rows: [
            [
              "Metrics",
              "Is something wrong? How bad? Since when?",
              "Very cheap — pre-aggregated numbers",
              "Low — every label combination is a new time series",
            ],
            [
              "Traces",
              "Where in the request path is the time going?",
              "Moderate — sampled, one span per operation",
              "High — per request, with attributes",
            ],
            [
              "Logs",
              "What exactly happened to this one request?",
              "Expensive at volume — every line stored and indexed",
              "Unlimited",
            ],
            [
              "Profiles",
              "Which code is burning the CPU or allocating?",
              "Low with continuous sampling",
              "N/A",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "The workflow that works: a metric alerts you and shows the shape, a trace narrows it to one service or dependency, and logs for that trace id tell you what happened. Skipping straight to logs at scale is how debugging takes hours instead of minutes.",
        },
      },
      {
        heading: "Metrics that are worth having",
        bullets: [
          "The RED method for request-driven services: Rate (requests/sec), Errors (failures/sec), Duration (latency distribution). Three metrics per endpoint answers most questions.",
          "The USE method for resources: Utilisation, Saturation, Errors. Queue depth and saturation predict trouble before utilisation does.",
          "The four golden signals (latency, traffic, errors, saturation) are the same idea from the SRE book — use whichever vocabulary the room uses.",
          "Record latency as a histogram, not a gauge or average. You need p50, p95, p99 and p99.9, and you cannot compute a percentile from an average after the fact.",
          "Separate success and error latency. Fast failures can drag a p99 down and make an outage look like a performance improvement.",
          "Keep label cardinality bounded: user id or request id as a metric label will multiply your time series into millions. That detail belongs in a trace.",
        ],
        math: [
          {
            label: "Why averages lie",
            expr: "99 requests at 10 ms + 1 request at 10 s",
            result: "avg 110 ms, p99 10 s",
            note: "The average looks acceptable. One in a hundred users waited ten seconds.",
          },
          {
            label: "Tail amplification",
            expr: "a page making 20 parallel calls, each p99 = 100 ms",
            result: "≈ 87% of pages hit at least one",
            note: "1 − 0.99²⁰. This is why p99 of a dependency is a p50 problem for the page.",
          },
          {
            label: "Cardinality cost",
            expr: "endpoint (50) × status (5) × region (3) × user_id (1 M)",
            result: "750 M series",
            note: "The first three are fine; the last one is why your metrics bill exploded.",
          },
        ],
      },
      {
        heading: "Tracing: the signal most teams under-invest in",
        diagram: {
          kind: "sequence",
          caption: "One trace, several spans — the waterfall shows where 800 ms went.",
          actors: [
            { id: "g", label: "Gateway", sub: "span: 840ms" },
            { id: "o", label: "Order svc", sub: "span: 820ms" },
            { id: "i", label: "Inventory", sub: "span: 30ms" },
            { id: "p", label: "Payments", sub: "span: 760ms" },
          ],
          messages: [
            { from: "g", to: "o", label: "POST /orders  [traceparent: 00-4bf92f...]", kind: "call" },
            { from: "o", to: "i", label: "check stock — 30ms", kind: "call", tone: "ok" },
            { from: "i", to: "o", label: "ok", kind: "return" },
            { from: "o", to: "p", label: "capture — 760ms", kind: "call", tone: "bad", note: "here is the latency, and it is retrying twice" },
            { from: "p", to: "o", label: "ok (attempt 3)", kind: "return", tone: "warn" },
            { from: "o", to: "g", label: "201", kind: "return" },
          ],
        },
        bullets: [
          "Context propagation is the whole game: W3C traceparent flows through every hop, including queues, or the trace ends where the async boundary begins.",
          "Sample intelligently: head-based sampling at a small percentage for normal traffic, plus tail-based sampling that keeps every trace containing an error or exceeding a latency threshold.",
          "Attach high-cardinality attributes to spans — user id, tenant, order id, cache hit or miss. This is where cardinality belongs, and it is what makes 'show me slow requests for this customer' possible.",
          "Instrument the boundaries first: incoming requests, outgoing calls, database queries, queue publish and consume. That alone answers most latency questions.",
          "Use OpenTelemetry. Vendor-neutral instrumentation means changing backends is a config change, not a re-instrumentation project.",
        ],
        code: {
          title: "Structured, correlated, and cheap to query",
          lang: "ts",
          source: `// Every log line carries the trace context, so logs and traces join up.
logger.info("payment captured", {
  traceId: span.spanContext().traceId,
  orderId, tenantId,
  provider: "stripe",
  attempt: 3,
  durationMs: 760,
});

// Span attributes carry the high-cardinality detail metrics cannot hold.
span.setAttributes({
  "order.id": orderId,
  "tenant.id": tenantId,
  "payment.provider": "stripe",
  "payment.attempt": 3,
  "cache.hit": false,
});

// The metric stays low-cardinality — no ids, bounded labels.
metrics.histogram("payment.duration_ms", 760, { provider: "stripe", outcome: "ok" });`,
        },
      },
      {
        heading: "Alerting that people do not ignore",
        bullets: [
          "Alert on symptoms, not causes. 'p99 checkout latency above 2 s for 5 minutes' is actionable; 'CPU above 80%' is often normal and trains people to ignore pages.",
          "Every alert needs a runbook link and a clear owner. An alert with no documented response is a notification, not an alert.",
          "Burn-rate alerting on error budgets catches both the fast catastrophe and the slow leak: a high burn rate over a short window pages immediately, a lower rate over a long window creates a ticket.",
          "Page only for things a human must act on now. Everything else is a dashboard or a ticket — alert fatigue is the main reason real incidents get missed.",
          "Include the query or dashboard link in the alert. Making the responder reconstruct the context at 3am costs minutes you do not have.",
        ],
        table: {
          headers: ["Symptom", "Likely first check", "Signal to use"],
          rows: [
            ["p99 latency up, p50 flat", "One slow dependency or a hot shard", "Traces — find the slow span"],
            ["Error rate up across all endpoints", "Shared dependency or a deploy", "Deploy timeline, then metrics by version"],
            ["Latency up, all percentiles", "Saturation — CPU, connections, queue depth", "Metrics: USE on the resource"],
            ["Errors for one tenant only", "Rate limit, data shape, or a hot key", "Logs and traces filtered by tenant"],
            ["Slow creep over days", "Leak, unbounded growth, index bloat", "Long-window metrics, profiles"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How would you debug a latency spike in this system?",
            a: "Start with metrics to see the shape — is it all endpoints or one, all percentiles or just the tail, and does it correlate with a deploy or a traffic change. Then traces to localise it: a waterfall usually shows one span carrying the added time. Then logs for a specific trace id to see exactly what happened. Going straight to logs at scale means searching millions of lines without knowing what for.",
          },
          {
            q: "Why not just log everything?",
            a: "Cost and signal. At high volume, logging every request costs more than the service and makes finding anything harder. Metrics answer 'how often and how bad' for a fraction of the price, traces answer 'where' with sampling, and logs are for the specific detail. I would log every error in full, sample successful requests, and make sure everything carries a trace id so the three join up.",
          },
          {
            q: "What is the difference between monitoring and observability?",
            a: "Monitoring is watching for known failure modes — dashboards and alerts you set up because you predicted the problem. Observability is being able to answer new questions from data you already collect, without deploying code. The practical test is whether you can answer 'why is this specific customer's request slow' from existing telemetry, and that usually depends on whether you kept high-cardinality attributes in traces.",
          },
          {
            q: "What would you alert on for a checkout service?",
            a: "Symptoms users feel: checkout success rate below threshold, p99 checkout latency above the budget, and payment provider error rate. I would use burn-rate alerts against an error budget so a sharp drop pages immediately and a slow degradation opens a ticket. What I would not page on is CPU or memory — those go on a dashboard, because they are causes, and alerting on them produces noise long before users notice anything.",
          },
        ],
      },
    ],
    related: ["/hld/availability", "/lld/logging", "/hld/circuit-breaker", "/examples/metrics"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "dns",
    title: "DNS and Traffic Routing",
    subtitle: "The first hop of every request, and the slowest thing to change.",
    level: "foundational",
    minutes: 12,
    tags: ["networking", "edge", "availability"],
    summary:
      "Every request begins with a name resolution, which makes DNS both the earliest place to steer traffic and the hardest place to fix a mistake. TTLs are honoured inconsistently, caches are everywhere, and a change you make now may take hours to reach everyone.",
    keyPoints: [
      "Resolution walks a hierarchy — root, TLD, authoritative — with caching at every step.",
      "TTL controls how long a change takes to propagate, and clients frequently ignore it.",
      "DNS-based failover is coarse and slow; anycast and load balancers are faster.",
      "Geo and latency routing steer users to the nearest healthy region.",
      "Never rely on DNS alone for failover — it is a routing tool, not a health system.",
    ],
    sections: [
      {
        heading: "How a lookup resolves",
        steps: [
          {
            title: "Local caches first",
            text: "Browser cache, then OS resolver cache, then the hosts file. Most lookups never leave the machine, which is also why a stale entry can persist after you fixed the record.",
          },
          {
            title: "Recursive resolver",
            text: "Usually your ISP's, or a public one like 8.8.8.8 or 1.1.1.1. It caches aggressively and does the walking on your behalf.",
          },
          {
            title: "Root and TLD servers",
            text: "The root points at the .com nameservers; those point at the domain's authoritative nameservers. Both layers are cached for a long time.",
          },
          {
            title: "Authoritative nameserver",
            text: "Your DNS provider answers with the actual record and its TTL. This is the only server whose answer you control directly.",
          },
          {
            title: "Everyone caches the answer",
            text: "For the TTL — nominally. Some resolvers clamp very low TTLs upward, some clients cache indefinitely, and some JVMs historically cached forever by default.",
          },
        ],
        diagram: {
          kind: "flow",
          caption: "Five layers of cache between your record and the user.",
          rows: [
            [
              { id: "b", label: "Browser cache", sub: "seconds to minutes" },
              { id: "os", label: "OS resolver", sub: "respects TTL, mostly" },
              { id: "r", label: "Recursive resolver", sub: "ISP or public" },
            ],
            [
              { id: "root", label: "Root servers", sub: "→ .com" },
              { id: "tld", label: "TLD servers", sub: "→ your NS" },
              { id: "auth", label: "Authoritative NS", sub: "your record", tone: "accent" },
            ],
          ],
        },
      },
      {
        heading: "Record types you will actually use",
        table: {
          headers: ["Type", "Maps to", "Notes"],
          rows: [
            ["A / AAAA", "IPv4 / IPv6 address", "The endpoint. Multiple records give crude round-robin"],
            ["CNAME", "Another name", "Cannot coexist with other records; not allowed at the zone apex"],
            ["ALIAS / ANAME", "Another name, resolved server-side", "Provider-specific way to get CNAME behaviour at the apex"],
            ["NS", "Authoritative nameservers", "Delegation; changing these is the slowest change of all"],
            ["MX", "Mail servers", "With priorities"],
            ["TXT", "Arbitrary text", "SPF, DKIM, domain verification"],
            ["SRV", "Service host and port", "Service discovery in some stacks"],
            ["CAA", "Which CAs may issue certificates", "Cheap and worth setting"],
          ],
        },
        callout: {
          kind: "warn",
          text: "The apex CNAME problem catches everyone: you cannot put a CNAME on example.com itself, only on www.example.com. Providers solve it with ALIAS/ANAME records that resolve server-side — which also means you are tied to that provider's behaviour.",
        },
      },
      {
        heading: "TTL: the trade-off you set in advance",
        math: [
          {
            label: "Long TTL (24 h)",
            expr: "fewer lookups, lower DNS cost, faster resolution",
            result: "a change takes up to a day",
            note: "Fine for records that never move.",
          },
          {
            label: "Short TTL (60 s)",
            expr: "changes propagate in about a minute",
            result: "far more queries; higher cost",
            note: "Required if you intend to use DNS for failover.",
          },
          {
            label: "Planned migration",
            expr: "lower TTL to 60 s a day before, migrate, then raise it again",
            result: "fast cutover, low steady cost",
            note: "This is the standard playbook — the low TTL must be in place before the change.",
          },
        ],
        bullets: [
          "TTL is a request, not a guarantee. Some resolvers enforce a minimum, some clients cache beyond it, and old application runtimes have cached forever.",
          "Because of that, always leave the old endpoint serving for a long tail after a migration — hours at minimum, sometimes days. Traffic will keep arriving.",
          "Very short TTLs increase your dependency on the DNS provider's availability, since every client re-resolves constantly.",
        ],
      },
      {
        heading: "Routing policies",
        table: {
          headers: ["Policy", "Chooses by", "Use for", "Caveat"],
          rows: [
            ["Simple", "One record", "Single endpoint", "No failover at all"],
            ["Weighted", "Configured proportions", "Canary and gradual rollouts, blue-green", "Coarse — caching makes real proportions drift"],
            ["Latency-based", "Measured latency to each region", "Global apps wanting the fastest region", "Based on the resolver's location, not the user's"],
            ["Geolocation", "The resolver's country/region", "Data residency, localised content", "Users on VPNs or corporate resolvers land wrong"],
            ["Failover", "Primary unless a health check fails", "Disaster recovery", "Propagation is bounded by TTL — minutes, not seconds"],
            ["Multivalue / round robin", "Several A records returned", "Crude spreading", "No health awareness in the client"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Anycast is the alternative worth naming: the same IP announced from many locations, with the network routing each user to the nearest. Failover happens in the routing layer in seconds, with no cache to wait for. It is how large CDNs and public DNS resolvers work.",
        },
      },
      {
        heading: "Operational notes",
        bullets: [
          "DNS resolution adds to first-byte latency — often 20-120 ms on a cold cache. Preconnect hints and reusing connections matter more than they look.",
          "Use at least two DNS providers for a critical domain. Outages at a single DNS provider have taken down large parts of the internet more than once.",
          "Health-checked failover in DNS is bounded by TTL and by client caching. For fast failover, put a load balancer or anycast in front and let DNS point at something stable.",
          "Expiring domains and certificates are an embarrassing but common cause of outages — monitor both, with alerts weeks in advance.",
          "Split-horizon DNS (different answers for internal and external clients) is standard in corporate networks and a frequent source of 'works on my machine' confusion.",
          "DNS is also an attack surface: enable DNSSEC where practical, set CAA records, and lock the registrar account with strong authentication — a domain hijack is a total compromise.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How would you route users to the nearest region?",
            a: "Latency-based or geolocation routing at the DNS layer, with anycast if the provider supports it, since that moves the decision into the network and fails over in seconds rather than TTL-bounded minutes. I would be explicit that DNS routing is based on the resolver's location, so a user on a corporate or VPN resolver can be sent to the wrong region — which is why the application should also handle being reached from anywhere.",
          },
          {
            q: "Would you use DNS for failover?",
            a: "As a backstop for a whole-region outage, yes, with a short TTL and health checks. Not as the primary mechanism, because propagation depends on caches you do not control and some clients ignore TTLs entirely. Within a region I want a load balancer or anycast handling failover in seconds, with DNS pointing at something that does not need to change.",
          },
          {
            q: "What TTL would you set?",
            a: "It depends on how often the record changes. Stable records get hours, since the lookups are wasted work otherwise. Anything I might need to move quickly gets 60 seconds, accepting the extra query volume. Before a planned migration I lower the TTL a day ahead so caches have expired by cutover — doing it at the same time as the change achieves nothing.",
          },
          {
            q: "You changed a record and some users still hit the old server. Why?",
            a: "Caching somewhere in the chain — a resolver enforcing a minimum TTL, a client or runtime caching beyond it, or a long-lived connection that never re-resolved. That is why the old endpoint has to stay up well past the TTL, ideally serving a redirect or proxying to the new one. Treating a DNS change as instant is one of the more reliable ways to cause a partial outage.",
          },
        ],
      },
    ],
    related: ["/hld/cdn", "/hld/load-balancing", "/hld/availability", "/hld/scaling"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "estimation",
    title: "Back-of-the-Envelope Estimation",
    subtitle: "Turn a vague problem into numbers that decide the architecture.",
    level: "foundational",
    minutes: 14,
    tags: ["interview", "fundamentals", "capacity"],
    summary:
      "Estimation is how you find out whether you are designing for 12 requests per second or 120,000 — and those need completely different systems. The arithmetic is deliberately crude: you are looking for the order of magnitude, because that is what determines whether one server suffices or you need a sharded cluster.",
    keyPoints: [
      "Round aggressively. 86,400 seconds a day is 100,000; a month is 2.5 million seconds.",
      "Always convert to peak: peak is typically 2-5× average, and systems are sized for peak.",
      "Estimate storage, bandwidth and QPS separately — different ones dominate different designs.",
      "State assumptions out loud so the interviewer can correct the input rather than the conclusion.",
      "The point is to find the constraint, then design around it.",
    ],
    sections: [
      {
        heading: "The numbers to memorise",
        table: {
          headers: ["Quantity", "Value", "Rounded to"],
          rows: [
            ["Seconds per day", "86,400", "10⁵"],
            ["Seconds per month", "2.6 million", "2.5 × 10⁶"],
            ["1 million/day", "11.6/s", "~12/s"],
            ["1 billion/day", "11,574/s", "~12k/s"],
            ["L1 cache reference", "~1 ns", ""],
            ["Main memory reference", "~100 ns", "100× L1"],
            ["SSD random read", "~100 µs", "1000× memory"],
            ["Disk seek (HDD)", "~10 ms", "100× SSD"],
            ["Same-AZ round trip", "~0.5 ms", ""],
            ["Cross-region round trip (US↔EU)", "~80 ms", ""],
            ["Read 1 MB from memory", "~50 µs", ""],
            ["Read 1 MB from SSD", "~500 µs", ""],
            ["Read 1 MB over 1 Gbps network", "~10 ms", ""],
          ],
        },
        math: [
          {
            label: "Typical row sizes",
            expr: "user record ~1 KB · tweet ~300 B · photo ~500 KB · minute of 1080p video ~50 MB",
            result: "orders of magnitude",
          },
          {
            label: "Typical throughputs",
            expr: "app server ~10³ rps · Postgres ~10⁴ writes/s · Redis ~10⁵ ops/s · Kafka ~10⁶ msg/s",
            result: "per node, roughly",
          },
        ],
        callout: {
          kind: "insight",
          text: "Latency numbers matter because they set what is possible: if a request must read from disk on a different continent, no amount of application optimisation gets you under 100 ms. Knowing the ladder tells you where the budget has to go.",
        },
      },
      {
        heading: "The procedure",
        steps: [
          {
            title: "State the user numbers and the assumption behind them",
            text: "'Assume 100 million daily active users, each performing 10 reads and 1 write.' Say it as an assumption so the interviewer can adjust the input.",
            detail: "If they give you a number, use theirs. If not, pick a round one and move on.",
          },
          {
            title: "Convert to average per second",
            text: "Divide by 100,000 rather than 86,400 — you are estimating, and the error is smaller than your input uncertainty.",
            detail: "100 M DAU × 10 reads = 1 B reads/day ÷ 10⁵ ≈ 10,000 reads/s",
          },
          {
            title: "Multiply for peak",
            text: "2-5× average depending on how spiky the traffic is. Social apps peak in the evening; a payroll system peaks monthly.",
            detail: "10,000 × 3 ≈ 30,000 reads/s at peak",
          },
          {
            title: "Estimate storage, and then storage over time",
            text: "Per-item size × items per day × retention. Then add indexes and replication — usually a 2-3× multiplier that people forget.",
            detail: "100 M writes/day × 1 KB = 100 GB/day → 36 TB/year → ~100 TB with replication",
          },
          {
            title: "Estimate bandwidth",
            text: "Requests per second × payload size. This is where media-heavy systems reveal that bandwidth, not compute, is the constraint.",
            detail: "30,000 reads/s × 5 KB ≈ 150 MB/s ≈ 1.2 Gbps egress",
          },
          {
            title: "Say what the number means",
            text: "This is the step that matters. '30,000 reads/s means I need caching and read replicas; 36 TB/year means I cannot keep it all on one machine, so partitioning by time or user.'",
          },
        ],
      },
      {
        heading: "A worked example",
        lede: "A Twitter-scale timeline, from users to architecture.",
        math: [
          {
            label: "Assumptions",
            expr: "300 M DAU · 2 posts/user/day · 100 timeline views/user/day · post ≈ 300 B text + metadata",
            result: "stated up front",
          },
          {
            label: "Write QPS",
            expr: "300 M × 2 ÷ 10⁵",
            result: "≈ 6,000/s",
            note: "Peak ×3 ≈ 18,000/s. Manageable, but not on one node without care.",
          },
          {
            label: "Read QPS",
            expr: "300 M × 100 ÷ 10⁵",
            result: "≈ 300,000/s",
            note: "Peak ×3 ≈ 1 M/s. Reads outnumber writes 50:1 — this is the defining fact.",
          },
          {
            label: "Storage per year",
            expr: "600 M posts/day × 300 B × 365",
            result: "≈ 65 TB/year",
            note: "×3 for indexes and replication ≈ 200 TB. Media is separate and far larger.",
          },
          {
            label: "Read bandwidth",
            expr: "1 M reads/s × 5 KB per timeline page",
            result: "≈ 5 GB/s",
            note: "40 Gbps. This is a CDN and cache problem before it is a database problem.",
          },
          {
            label: "Cache sizing",
            expr: "20% of users active in a 5-min window × 1 KB timeline cache",
            result: "≈ 60 GB",
            note: "Fits comfortably in a small Redis cluster — so caching timelines is clearly worth it.",
          },
        ],
        callout: {
          kind: "interview",
          text: "The conclusion is what earns credit: 50:1 read:write means precompute timelines on write (fan-out) rather than assembling them on read, cache aggressively, and treat the write path as the cheap one. The numbers chose the architecture.",
        },
      },
      {
        heading: "Common mistakes",
        table: {
          headers: ["Mistake", "Consequence", "Instead"],
          rows: [
            [
              "Sizing for average, not peak",
              "The system falls over every evening",
              "Multiply by 2-5× and say which you used",
            ],
            [
              "Forgetting replication and indexes",
              "Storage estimate off by 3×",
              "Multiply raw data by ~3 for a realistic footprint",
            ],
            [
              "Precision theatre",
              "Wasting minutes on arithmetic when the input was a guess",
              "Round hard; the input uncertainty dominates",
            ],
            [
              "Not converting to a decision",
              "Numbers with no architectural consequence",
              "End with 'therefore I need X'",
            ],
            [
              "Over-engineering for numbers you computed",
              "Kafka and 50 nodes for 12 requests/second",
              "Check whether one server would do — often it would",
            ],
            [
              "Ignoring growth",
              "A design that works today and not in 18 months",
              "Design for 10× current, not 1000×",
            ],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How many servers would you need?",
            a: "I would work from peak QPS and a per-server capacity assumption, and say both out loud. If peak is 30,000 requests per second and a server handles 2,000 with the work this endpoint does, that is 15 servers plus headroom for failure and deploys, so around 20 across three availability zones. The important part is stating the per-server number as an assumption, because it varies enormously by workload.",
          },
          {
            q: "How much storage for five years?",
            a: "Daily volume times retention, then a multiplier for indexes and replication — usually about three. I would also ask whether old data can move to cheaper storage, because five years of hot data and five years of archived data are very different bills. Then check whether the total fits one machine, since that answers whether sharding is on the table.",
          },
          {
            q: "The interviewer says your assumption is wrong. What now?",
            a: "Take their number and redo the arithmetic — it usually takes fifteen seconds and often changes the conclusion, which is the interesting part. That is exactly why I state assumptions explicitly rather than burying them: it makes the estimate correctable instead of wrong.",
          },
          {
            q: "When does estimation change your design?",
            a: "At the order-of-magnitude boundaries. Under a thousand requests per second, a single server and a single database is the right answer and anything else is over-engineering. Around ten thousand, caching and read replicas become necessary. Past a hundred thousand, or once the dataset exceeds one machine, partitioning is unavoidable. The whole point of the exercise is finding which of those three systems I am being asked to design.",
          },
        ],
      },
    ],
    related: ["/hld/scaling", "/examples/scale-to-millions", "/examples/interview-framework", "/hld/caching"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },
];
