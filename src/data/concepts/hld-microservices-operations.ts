import type { Concept } from "@/data/types";

export const hldMicroservicesOperations: Concept[] = [
  {
    slug: "bulkheads-load-shedding",
    title: "Bulkheads, Load Shedding and Backpressure",
    subtitle:
      "Containing failure so one slow dependency or traffic spike cannot sink the whole system.",
    level: "advanced",
    minutes: 16,
    tags: ["microservices", "resilience", "bulkhead", "load shedding", "backpressure"],
    summary:
      "In a system of many services, the classic way everything fails is one slow dependency: callers wait, threads and connections fill up, and the exhaustion spreads upstream until unrelated features stop working. Bulkheads isolate resources per dependency or tenant, load shedding rejects excess work early, and backpressure tells producers to slow down. Together they keep a partial failure partial.",
    keyPoints: [
      "Slow is worse than down: a hung dependency holds resources that a fast failure would release.",
      "Bulkheads give each dependency or tenant its own bounded pool, so one cannot exhaust the rest.",
      "Load shedding rejects excess work early and cheaply, preserving capacity for work that can succeed.",
      "Backpressure propagates 'slow down' upstream instead of buffering until memory runs out.",
      "Prioritise explicitly: shed analytics and recommendations before checkout.",
    ],
    prerequisites: ["/hld/circuit-breaker"],
    sections: [
      {
        heading: "How one slow dependency takes everything down",
        diagram: {
          kind: "flow",
          caption: "Resource exhaustion travels upstream.",
          rows: [
            [
              { id: "recs", label: "Recommendations", sub: "latency jumps to 10 s", tone: "warn" },
              { id: "threads", label: "Web workers", sub: "all 200 waiting on it", tone: "bad" },
              { id: "checkout", label: "Checkout requests", sub: "no free worker", tone: "bad" },
              { id: "site", label: "Whole site down", sub: "for an optional feature", tone: "bad" },
            ],
          ],
        },
        math: [
          {
            label: "Requests per second that call recommendations",
            expr: "50 requests/s, each now waiting 10 s",
            result: "500 workers needed",
            note: "only 200 exist",
          },
          {
            label: "Time until the shared pool is exhausted",
            expr: "200 workers ÷ 50 new stuck requests/s",
            result: "4 seconds",
            note: "then every endpoint on the service stalls",
          },
        ],
        callout: {
          kind: "insight",
          text: "If recommendations had simply returned errors, workers would have been released immediately and checkout would have kept working. That is why timeouts come first: they turn 'slow' into 'down', which the other patterns can handle.",
        },
      },
      {
        heading: "Bulkheads",
        diagram: {
          kind: "compare",
          caption: "Named after the watertight compartments in a ship's hull.",
          options: [
            {
              title: "One shared pool",
              good: ["Simple", "Maximum utilisation when everything is healthy"],
              bad: [
                "Any one slow dependency can take every worker",
                "A noisy tenant starves all others",
              ],
              tone: "bad",
            },
            {
              title: "Partitioned pools",
              good: [
                "A failing dependency can only exhaust its own compartment",
                "Critical paths keep reserved capacity",
                "Failures stay visible per dependency",
              ],
              bad: ["Some idle capacity by design", "Pool sizes need tuning"],
              verdict: "The default for anything with several downstream dependencies.",
              tone: "ok",
            },
          ],
        },
        code: {
          title: "Per-dependency concurrency limits that fail fast",
          lang: "python",
          source: `import asyncio

# A hung recommendations service can use at most 20 slots;
# payments keeps its 60 no matter what happens elsewhere.
BULKHEADS = {
    "payments": asyncio.Semaphore(60),
    "inventory": asyncio.Semaphore(40),
    "recommendations": asyncio.Semaphore(20),
}

class BulkheadFull(Exception):
    pass

async def call(dependency: str, fn, *, timeout_s: float):
    sem = BULKHEADS[dependency]
    if sem.locked():                      # compartment full: fail fast rather than queue
        raise BulkheadFull(dependency)
    async with sem:
        async with asyncio.timeout(timeout_s):
            return await fn()`,
        },
        table: {
          headers: ["Bulkhead by", "Protects against", "Example"],
          rows: [
            [
              "Dependency",
              "One slow downstream service",
              "Separate pools for payments and recommendations",
            ],
            ["Tenant", "A noisy neighbour", "Per-customer concurrency or queue quotas"],
            [
              "Priority",
              "Low-value work crowding out critical work",
              "Reserved capacity for checkout",
            ],
            [
              "Deployment cell",
              "A bad deploy or poison request reaching everyone",
              "Independent copies of the stack per customer segment",
            ],
          ],
        },
      },
      {
        heading: "Load shedding",
        lede: "Reject early, cheaply, and in priority order.",
        code: {
          title: "Admission control with a reserve for critical paths",
          lang: "python",
          source: `from fastapi.responses import JSONResponse

MAX_IN_FLIGHT = 400
in_flight = 0

@app.middleware("http")
async def shed_load(request, call_next):
    global in_flight
    critical = request.url.path.startswith(("/checkout", "/payments"))
    limit = MAX_IN_FLIGHT if critical else int(MAX_IN_FLIGHT * 0.7)   # 30% reserved for critical work
    if in_flight >= limit:
        return JSONResponse({"error": "overloaded"}, status_code=503, headers={"Retry-After": "2"})
    in_flight += 1
    try:
        return await call_next(request)
    finally:
        in_flight -= 1`,
        },
        bullets: [
          "Shedding a request costs microseconds; accepting it and timing out later costs a worker, memory and a worse user experience.",
          "Shed on signals that predict failure: in-flight requests, queue waiting time, or latency against a target — not just CPU.",
          "A request that has already waited longer than the client's timeout should be dropped before any work is done. Nobody is waiting for the answer.",
          "Clients must respect 503 and Retry-After with backoff, or shedding simply converts into a retry storm.",
        ],
        links: [{ label: "Site: rate limiting at scale", href: "/hld/rate-limiting" }],
      },
      {
        heading: "Backpressure",
        body: [
          "Backpressure is a signal flowing against the direction of data: 'I cannot keep up, slow down'. Bounded buffers produce it naturally — when the queue is full, the producer blocks or is told to retry later. Unbounded buffers hide it until the process runs out of memory.",
        ],
        bullets: [
          "Bound every in-memory queue. A full bounded queue is a controlled signal; an unbounded one is a delayed crash.",
          "Durable logs such as Kafka absorb bursts on disk, and consumer lag becomes a visible, alertable measure of how far behind processing is.",
          "Across HTTP, backpressure is 429 or 503 with Retry-After. Across streaming protocols it is built in, through flow control.",
        ],
        callout: {
          kind: "warn",
          text: "A queue is not capacity. It buys time to absorb a burst. If the arrival rate stays above the processing rate, the queue only grows — adding latency to every item — until something fails anyway.",
        },
      },
      {
        heading: "The resilience toolkit together",
        table: {
          headers: ["Pattern", "Protects against", "Where"],
          rows: [
            ["Timeout", "Waiting forever on a slow dependency", "Every network call"],
            [
              "Retry with backoff and budget",
              "Brief transient failures",
              "One layer, idempotent operations only",
            ],
            [
              "Circuit breaker",
              "Hammering a dependency that is clearly failing",
              "Client side of each dependency",
            ],
            [
              "Bulkhead",
              "One dependency exhausting shared resources",
              "Per dependency, tenant or priority",
            ],
            [
              "Load shedding",
              "Overload collapsing the whole service",
              "At the edge of each service",
            ],
            ["Backpressure", "Producers overwhelming consumers", "Queues and streams"],
            [
              "Fallback",
              "A non-critical feature failing loudly",
              "Degraded response or cached data",
            ],
          ],
        },
        links: [
          { label: "Site: circuit breakers, timeouts and retries", href: "/hld/circuit-breaker" },
          { label: "Site: availability and fault tolerance", href: "/hld/availability" },
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Why is a slow dependency worse than one that is down?",
            a: "A dependency that is down fails fast, so callers release their threads and connections immediately and can fall back. A slow one holds those resources for the full wait, so a modest request rate exhausts the caller's pool within seconds and every feature on that service stops — including ones that never touch the slow dependency.",
          },
          {
            q: "What is the difference between a bulkhead and a circuit breaker?",
            a: "A bulkhead limits how much of your capacity any one dependency can consume, so its failure is contained. A circuit breaker stops calling a dependency once it is clearly failing, so you stop wasting time and give it room to recover. They complement each other: the bulkhead bounds the damage while the breaker is still deciding to open.",
          },
          {
            q: "How do you decide what to shed first?",
            a: "By business value and by whether the work can still succeed. I classify endpoints — checkout and payments as critical, browsing as normal, recommendations and analytics as sheddable — and reserve capacity for the critical class. I also drop requests that have already waited past their client's timeout, since finishing them helps nobody.",
          },
        ],
      },
    ],
    related: [
      "/hld/circuit-breaker",
      "/hld/rate-limiting",
      "/hld/service-mesh",
      "/hld/availability",
    ],
    furtherReading: [
      {
        label: "AWS Builders' Library — using load shedding to avoid overload",
        href: "https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/",
      },
      {
        label: "Azure Architecture Center — bulkhead pattern",
        href: "https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead",
      },
    ],
  },

  {
    slug: "service-mesh",
    title: "Service Mesh and Sidecars",
    subtitle:
      "Moving retries, mTLS, traffic shifting and telemetry out of application code and into the network.",
    level: "advanced",
    minutes: 15,
    tags: ["microservices", "service mesh", "istio", "envoy", "mtls"],
    summary:
      "Every service needs the same networking features: mutual TLS, retries, timeouts, load balancing, traffic splitting and per-request telemetry. A service mesh provides them uniformly through proxies — a sidecar next to each instance, or a proxy per node — configured from a central control plane. It is powerful for large fleets and a real operational burden for small ones.",
    keyPoints: [
      "A data plane of proxies carries every service-to-service request; a control plane configures them.",
      "You get consistent mTLS, retries, timeouts and telemetry without changing application code.",
      "Traffic policies make canaries, mirroring and fault injection declarative.",
      "The cost is extra latency per hop, more moving parts, and a new class of misconfiguration.",
      "Adopt a mesh for a problem you actually have — often mTLS and observability — not for its feature list.",
    ],
    prerequisites: ["/hld/service-discovery", "/hld/api-gateway"],
    sections: [
      {
        heading: "Architecture",
        diagram: {
          kind: "system",
          caption: "Applications talk to localhost; proxies do the networking.",
          columns: [
            {
              title: "Control plane",
              nodes: [
                {
                  id: "config",
                  label: "Configuration",
                  sub: "routes, retries, policies",
                  tone: "accent",
                },
                {
                  id: "ca",
                  label: "Certificate authority",
                  sub: "issues and rotates workload certs",
                },
              ],
            },
            {
              title: "Pod: checkout",
              nodes: [
                { id: "app1", label: "checkout app" },
                { id: "proxy1", label: "Sidecar proxy", sub: "Envoy or similar" },
              ],
            },
            {
              title: "Pod: payments",
              nodes: [
                { id: "proxy2", label: "Sidecar proxy", sub: "verifies mTLS identity", tone: "ok" },
                { id: "app2", label: "payments app" },
              ],
            },
            {
              title: "Telemetry",
              nodes: [
                { id: "metrics", label: "Golden metrics per route" },
                { id: "traces", label: "Distributed traces" },
              ],
            },
          ],
        },
      },
      {
        heading: "What moves out of your code",
        table: {
          headers: ["Capability", "Without a mesh", "With a mesh"],
          rows: [
            [
              "Encryption between services",
              "TLS configured in every service and language",
              "Automatic mTLS with rotating certificates",
            ],
            [
              "Service identity and access",
              "Shared secrets or network trust",
              "Cryptographic workload identity and policies",
            ],
            [
              "Retries and timeouts",
              "A library per language, configured inconsistently",
              "Declarative policy per route",
            ],
            [
              "Load balancing",
              "Connection-level, unless each client implements more",
              "Request-level, with outlier detection",
            ],
            [
              "Traffic splitting",
              "Custom routing code or extra deployments",
              "Weighted routes in configuration",
            ],
            [
              "Telemetry",
              "Instrument every service",
              "Uniform metrics and trace spans from the proxies",
            ],
          ],
        },
      },
      {
        heading: "Traffic shifting and resilience policy",
        code: {
          title: "A 5% canary with timeouts, retries and outlier detection (Istio)",
          lang: "yaml",
          source: `apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: payments
spec:
  hosts: ["payments"]
  http:
    - route:
        - destination: { host: payments, subset: v1 }
          weight: 95
        - destination: { host: payments, subset: v2 }
          weight: 5
      timeout: 2s
      retries:
        attempts: 2
        perTryTimeout: 800ms
        retryOn: 5xx,reset,connect-failure
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: payments
spec:
  host: payments
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s`,
        },
        callout: {
          kind: "warn",
          text: "Retries configured in the mesh and again in application code multiply. Two mesh attempts around three application attempts is six calls to payments per request during an outage. Decide which layer owns retries and remove them from the other.",
        },
        links: [{ label: "Site: retry storms and deadlines", href: "/hld/service-communication" }],
      },
      {
        heading: "mTLS and zero trust between services",
        code: {
          title: "Only checkout may call payments",
          lang: "yaml",
          source: `apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: payments-allow-checkout
  namespace: shop
spec:
  selector:
    matchLabels: { app: payments }
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/shop/sa/checkout"]   # checkout's workload identity`,
        },
        bullets: [
          "The mesh issues each workload a certificate tied to its service account and rotates it automatically, so services authenticate each other without shared secrets.",
          "Authorisation policies on identities are far stronger than IP-based rules, which break the moment pods reschedule.",
          "The mesh proves which service is calling. Whether the end user may see this record is still the application's job.",
        ],
        links: [
          { label: "Site: securing service-to-service calls", href: "/hld/service-security" },
        ],
      },
      {
        heading: "Sidecar or sidecar-less",
        diagram: {
          kind: "compare",
          caption: "Where the proxy runs changes the resource bill.",
          options: [
            {
              title: "Sidecar per pod",
              good: [
                "Full layer-7 features for every workload",
                "Strong isolation between workloads",
                "Mature and widely deployed",
              ],
              bad: [
                "CPU and memory for every pod",
                "Proxy upgrades mean restarting pods",
                "Extra hop latency on both sides",
              ],
              verdict: "Established default.",
            },
            {
              title: "Per-node proxy (ambient mode)",
              good: [
                "Far less memory across a large fleet",
                "Upgrade proxies without restarting applications",
              ],
              bad: [
                "Layer-7 features need additional waypoint proxies",
                "Newer, with less operational history",
              ],
              verdict: "Large fleets where sidecar overhead dominates.",
              tone: "accent",
            },
          ],
        },
      },
      {
        heading: "Costs, and when to adopt",
        math: [
          {
            label: "Sidecar memory across a fleet",
            expr: "400 pods × 50 MB per proxy",
            result: "≈ 20 GB",
            note: "illustrative — measure your own proxies",
          },
          {
            label: "Latency added per call",
            expr: "two proxy hops (caller side and callee side)",
            result: "typically low milliseconds",
            note: "multiplied by every hop in a call chain",
          },
        ],
        bullets: [
          "Good fit: dozens of services in several languages, a requirement for encryption and identity between services, and a need for uniform telemetry.",
          "Poor fit: a handful of services in one language, where a shared library or gRPC interceptors provide retries and TLS with far less machinery.",
          "Budget for the mesh as a product the platform team operates: upgrades, certificate authority health, and debugging 503s that originate in proxy configuration.",
        ],
        followUps: [
          {
            q: "What problems does a service mesh solve?",
            a: "Cross-cutting network concerns between services: mutual TLS and workload identity, authorisation between services, retries, timeouts and request-level load balancing, traffic shifting for canaries, and uniform metrics and traces — all consistently across languages and without changing application code.",
          },
          {
            q: "What is the difference between a service mesh and an API gateway?",
            a: "A gateway handles north-south traffic: external clients entering the system, with concerns like client authentication, quotas and API versioning. A mesh handles east-west traffic between services inside the system. They compose: the gateway at the edge, the mesh behind it.",
          },
          {
            q: "Would you add a service mesh for ten services?",
            a: "Probably not, unless there is a specific driver such as a compliance requirement for encrypted, authenticated service-to-service traffic. For ten services, a good HTTP client library with timeouts and retries, TLS at the ingress, and OpenTelemetry instrumentation cover most needs with much less operational cost. I would revisit as the number of services, languages and teams grows.",
          },
        ],
      },
    ],
    related: [
      "/hld/api-gateway",
      "/hld/service-security",
      "/hld/service-discovery",
      "/hld/observability",
    ],
    furtherReading: [
      { label: "Istio documentation", href: "https://istio.io/latest/docs/" },
      {
        label: "Linkerd — what is a service mesh?",
        href: "https://linkerd.io/what-is-a-service-mesh/",
      },
    ],
  },

  {
    slug: "service-security",
    title: "Securing Service-to-Service Communication",
    subtitle:
      "Zero trust inside the network: workload identity, mTLS, token propagation and least privilege.",
    level: "advanced",
    minutes: 16,
    tags: ["microservices", "security", "mtls", "jwt", "zero trust", "secrets"],
    summary:
      "A perimeter firewall assumes everything inside the network can be trusted — so one compromised service can call every other. Zero trust removes that assumption: every request between services is authenticated and authorised. Services prove who they are with mTLS or signed tokens, the end user's identity travels with the request, each service checks what the caller may do, and secrets never live in code or images.",
    keyPoints: [
      "Do not trust the network. Authenticate every service-to-service call.",
      "Two identities travel with a request: the calling service and the end user.",
      "Verify JWTs locally against cached public keys, and exchange tokens rather than forwarding broad ones.",
      "Authorise at every service — object-level checks belong where the data lives.",
      "Secrets come from a secret manager at runtime, are rotated, and never appear in images or git.",
    ],
    prerequisites: ["/hld/api-gateway"],
    sections: [
      {
        heading: "Perimeter security or zero trust",
        diagram: {
          kind: "compare",
          caption: "What happens after one service is compromised?",
          options: [
            {
              title: "Perimeter",
              sub: "Firewall at the edge, open network inside",
              good: ["Simple to set up"],
              bad: [
                "One compromised service can call every other",
                "Internal traffic often unencrypted",
                "IP-based rules break as pods move",
              ],
              verdict: "A single breach becomes a full breach.",
              tone: "bad",
            },
            {
              title: "Zero trust",
              sub: "Every call authenticated and authorised",
              good: [
                "A compromised service reaches only what its identity allows",
                "Encrypted everywhere",
                "Access expressed as identity, not network location",
              ],
              bad: ["Identity infrastructure to run", "Policies to write and maintain"],
              verdict: "The standard for modern systems.",
              tone: "ok",
            },
          ],
        },
      },
      {
        heading: "Two identities on every request",
        diagram: {
          kind: "sequence",
          caption: "Payments checks both who is calling and on whose behalf.",
          actors: [
            { id: "user", label: "User" },
            { id: "gw", label: "Gateway" },
            { id: "ord", label: "Orders" },
            { id: "pay", label: "Payments" },
          ],
          messages: [
            { from: "user", to: "gw", label: "request + user access token", kind: "call" },
            {
              from: "gw",
              to: "gw",
              label: "verify token; strip client identity headers",
              kind: "self",
            },
            { from: "gw", to: "ord", label: "forward over mTLS + user context", kind: "call" },
            {
              from: "ord",
              to: "pay",
              label: "mTLS as orders + token scoped to payments",
              kind: "call",
              note: "service identity from the certificate, user identity from the token",
            },
            {
              from: "pay",
              to: "pay",
              label: "may orders call me? does this user own the order?",
              kind: "self",
              tone: "accent",
            },
            { from: "pay", to: "ord", label: "200", kind: "return", tone: "ok" },
          ],
        },
        table: {
          headers: ["Identity", "Proves", "Typical mechanism"],
          rows: [
            [
              "Workload (service)",
              "Which service is making the call",
              "mTLS certificate, often issued by a mesh",
            ],
            ["End user", "Whose behalf the call is made on", "A signed JWT with a short expiry"],
          ],
        },
      },
      {
        heading: "Verifying user tokens",
        code: {
          title: "Local verification with cached signing keys (PyJWT)",
          lang: "python",
          source: `import jwt
from jwt import PyJWKClient

jwks = PyJWKClient("https://auth.example.com/.well-known/jwks.json")   # fetches and caches public keys

def verify_user_token(token: str) -> dict:
    signing_key = jwks.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],                    # never accept the algorithm the token claims
        audience="orders-service",               # a token minted for another service is rejected
        issuer="https://auth.example.com/",
        options={"require": ["exp", "aud", "iss", "sub"]},
    )`,
        },
        bullets: [
          "Local verification needs no network call per request; only key rotation triggers a fetch.",
          "Give every service its own audience. A token accepted by any service is a skeleton key.",
          "Keep access tokens short-lived — minutes, not days — so a leaked token expires quickly.",
          "Rather than forwarding a user's broad token deeper into the system, exchange it for a narrower token scoped to the next service (the OAuth token-exchange pattern).",
          "The gateway must strip identity headers supplied by clients. If a client can send X-User-Id and it is forwarded, authentication is bypassed.",
        ],
        links: [{ label: "Site: authentication system design", href: "/examples/auth-system" }],
      },
      {
        heading: "Authorisation at every hop",
        code: {
          title: "Service-level and object-level checks",
          lang: "python",
          source: `def get_invoice(invoice_id: str, claims: dict, caller_service: str) -> "Invoice":
    if caller_service not in {"orders", "billing-portal"}:        # service level: who may call at all
        raise Forbidden("service not allowed")

    invoice = invoices.get(invoice_id)
    if invoice is None or invoice.customer_id != claims["sub"]:    # object level: this user, this invoice
        raise NotFound()                                            # 404, not 403: do not confirm it exists
    return invoice`,
        },
        callout: {
          kind: "warn",
          text: "Broken object-level authorisation — accepting any id the caller supplies and returning the record — is the top risk in the OWASP API Security Top 10. The gateway cannot prevent it, because only the service that owns the data knows who owns each record.",
        },
      },
      {
        heading: "Secrets management",
        table: {
          headers: ["Do", "Don't"],
          rows: [
            ["Load secrets at runtime from a secret manager", "Bake secrets into container images"],
            [
              "Use short-lived, automatically rotated credentials",
              "Share one long-lived key across services",
            ],
            [
              "Give each service its own least-privileged database user",
              "Let every service connect as an administrator",
            ],
            [
              "Use cloud workload identity instead of static cloud keys",
              "Commit a .env file, even to a private repository",
            ],
          ],
        },
        bullets: [
          "Kubernetes Secrets are only base64-encoded by default. Enable encryption at rest, restrict access with RBAC, or sync from an external secret manager.",
          "Scan repositories and images for leaked secrets in CI; a leaked key must be rotated, not merely deleted from history.",
        ],
      },
      {
        heading: "Defence in depth, and interview follow-ups",
        numbered: [
          "Default-deny network policies, so services can only reach what they need.",
          "mTLS between all services, with identity-based authorisation policies.",
          "Short-lived user tokens verified at every service, with a per-service audience.",
          "Object-level authorisation inside every service that owns data.",
          "Per-caller rate limits, so a compromised or buggy service cannot flood another.",
          "Audit logs of sensitive actions, including the calling service and the user.",
        ],
        followUps: [
          {
            q: "Is internal traffic safe to leave unauthenticated?",
            a: "No. It assumes the network perimeter is never breached and every service is never compromised. With unauthenticated internal traffic, one vulnerable service — or a misconfigured ingress — gives an attacker access to everything. Zero trust makes each service reachable only by identities explicitly allowed to call it.",
          },
          {
            q: "How does the user's identity flow through a chain of services?",
            a: "The gateway verifies the user's token and forwards user context. Each service verifies a signed token rather than trusting a plain header, and when calling the next service it passes a token scoped to that service — ideally exchanged for a narrower one — alongside its own mTLS identity. Every hop can then check both who is calling and on whose behalf.",
          },
          {
            q: "Where should authorisation happen?",
            a: "Coarse checks can happen early: the gateway can verify a token and required scopes, and the mesh can enforce which services may call which. But object-level authorisation — may this user read this invoice — must happen in the service that owns the data, because only it knows the relationship between users and records.",
          },
        ],
      },
    ],
    related: ["/hld/api-gateway", "/hld/service-mesh", "/examples/auth-system", "/java/security"],
    furtherReading: [
      {
        label: "NIST SP 800-207 — Zero Trust Architecture",
        href: "https://csrc.nist.gov/pubs/sp/800/207/final",
      },
      {
        label: "OWASP API Security Top 10 (2023)",
        href: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/",
      },
    ],
  },

  {
    slug: "containers-kubernetes",
    title: "Containers and Kubernetes for Microservices",
    subtitle:
      "Pods, Deployments, Services, autoscaling — and the resource limits that decide whether it all stays up.",
    level: "intermediate",
    minutes: 18,
    tags: ["microservices", "kubernetes", "containers", "autoscaling", "deployment"],
    summary:
      "Containers package a service and its dependencies into an immutable image; Kubernetes runs many of them, restarts what fails, scales with load and wires up networking. For microservices it replaces most bespoke infrastructure — but only if resource requests and limits, health probes and disruption budgets are set correctly, which is where most real incidents come from.",
    keyPoints: [
      "An image is the immutable unit of deployment: build once, promote the same image through environments.",
      "Deployments manage replicas and rolling updates; Services give those replicas a stable address.",
      "Requests drive scheduling and limits cap usage — a missing or too-low memory limit causes outages.",
      "Autoscale on a meaningful signal, and use PodDisruptionBudgets so maintenance cannot take everything down.",
      "Configuration and secrets come from the environment, never from the image.",
    ],
    prerequisites: ["/hld/service-discovery"],
    sections: [
      {
        heading: "The core objects",
        table: {
          headers: ["Object", "What it is", "You use it for"],
          rows: [
            [
              "Pod",
              "One or more containers sharing a network and storage",
              "The unit Kubernetes schedules — rarely created directly",
            ],
            [
              "Deployment",
              "Desired state for a set of identical pods",
              "Replicas, rolling updates, rollbacks",
            ],
            [
              "Service",
              "A stable virtual address over ready pods",
              "Discovery and load balancing inside the cluster",
            ],
            [
              "Ingress / Gateway",
              "HTTP routing from outside the cluster",
              "Exposing services to clients",
            ],
            [
              "ConfigMap / Secret",
              "Configuration and sensitive values",
              "Injecting environment into pods",
            ],
            ["HorizontalPodAutoscaler", "Replica count driven by metrics", "Scaling with load"],
            [
              "PodDisruptionBudget",
              "Minimum pods that must stay available",
              "Safe node maintenance and upgrades",
            ],
          ],
        },
      },
      {
        heading: "How a request reaches a pod",
        diagram: {
          kind: "flow",
          caption: "Only ready pods are ever in the endpoint list.",
          rows: [
            [
              { id: "client", label: "Client" },
              {
                id: "ingress",
                label: "Ingress / Gateway",
                sub: "TLS, host and path routing",
                tone: "accent",
              },
              { id: "svc", label: "Service", sub: "stable name: orders" },
              {
                id: "pods",
                label: "Ready pods",
                sub: "orders-7f9c, orders-2b1d, orders-9aa0",
                tone: "ok",
              },
            ],
          ],
        },
      },
      {
        heading: "A production-shaped Deployment",
        code: {
          title: "Replicas, safe rollouts, resources, probes, zones and graceful shutdown",
          lang: "yaml",
          source: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
  namespace: shop
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }     # never fewer than 3 ready pods
  selector:
    matchLabels: { app: orders }
  template:
    metadata:
      labels: { app: orders, version: v42 }
    spec:
      terminationGracePeriodSeconds: 30
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone         # spread replicas across zones
          whenUnsatisfiable: ScheduleAnyway
          labelSelector: { matchLabels: { app: orders } }
      containers:
        - name: orders
          image: registry.example.com/shop/orders:1.42.0   # an immutable tag, never :latest
          ports: [{ containerPort: 8080 }]
          envFrom:
            - configMapRef: { name: orders-config }
            - secretRef: { name: orders-secrets }
          resources:
            requests: { cpu: 250m, memory: 512Mi }         # what the scheduler reserves
            limits: { memory: 512Mi }                       # exceed it and the container is OOMKilled
          readinessProbe:
            httpGet: { path: /readyz, port: 8080 }
          livenessProbe:
            httpGet: { path: /healthz, port: 8080 }
            initialDelaySeconds: 10
          lifecycle:
            preStop:
              exec: { command: ["sleep", "5"] }            # let endpoint removal propagate first
          securityContext:
            runAsNonRoot: true
            readOnlyRootFilesystem: true`,
        },
        bullets: [
          "maxUnavailable: 0 with maxSurge: 1 means a rollout adds a new pod, waits for it to be ready, then removes an old one — capacity never dips.",
          "Immutable image tags make rollbacks exact. A :latest tag means you cannot be sure what is running.",
          "The preStop pause gives load balancers time to stop sending traffic before the process begins shutting down, avoiding errors on every deploy.",
        ],
        links: [
          {
            label: "Kubernetes — Deployments",
            href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
          },
        ],
      },
      {
        heading: "Requests, limits and the incidents they cause",
        table: {
          headers: ["Setting", "Effect", "Failure mode"],
          rows: [
            [
              "No memory limit",
              "A container can use all of a node's memory",
              "The node runs out of memory and kills unrelated neighbours",
            ],
            [
              "Memory limit too low",
              "Container killed when it exceeds the limit",
              "OOMKilled restarts and CrashLoopBackOff under real load",
            ],
            [
              "CPU limit",
              "Container throttled at the limit",
              "Latency spikes even when average CPU usage looks low",
            ],
            [
              "No requests",
              "Scheduler cannot plan capacity",
              "Overcommitted nodes and noisy neighbours",
            ],
          ],
        },
        bullets: [
          "A common practice is to set memory requests equal to limits for predictable behaviour, and to set CPU requests while treating CPU limits with care because of throttling.",
          "Runtimes must know their limit: configure the JVM heap or Python worker count from the container's memory, not the node's.",
        ],
        links: [
          {
            label: "Kubernetes — resource management for pods and containers",
            href: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
          },
          { label: "Site: JVMs in containers", href: "/java/docker" },
        ],
      },
      {
        heading: "Autoscaling",
        code: {
          title: "Scale replicas on CPU utilisation",
          lang: "yaml",
          source: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: orders
  namespace: shop
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: orders }
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }`,
        },
        math: [
          {
            label: "Pods for peak load",
            expr: "3,000 requests/s ÷ 250 requests/s per pod at 70% CPU",
            result: "12 pods",
          },
          {
            label: "Surviving the loss of one of three zones",
            expr: "12 ÷ (2 / 3)",
            result: "18 pods",
            note: "the remaining two zones must still carry peak",
          },
        ],
        bullets: [
          "Scale on the signal that actually limits you. CPU suits CPU-bound services; for I/O-bound services and workers, requests per second or queue depth (for example via KEDA) is more accurate.",
          "Autoscaling reacts in tens of seconds to minutes. Keep headroom for sudden spikes, and pair pod autoscaling with a cluster autoscaler that adds nodes.",
        ],
      },
      {
        heading: "Graceful shutdown and disruption budgets",
        steps: [
          {
            title: "SIGTERM",
            text: "Kubernetes signals the container and starts the grace period.",
          },
          {
            title: "Leave rotation",
            text: "The pod is removed from Service endpoints; the preStop pause lets that propagate.",
          },
          {
            title: "Drain",
            text: "The process stops accepting new work and finishes in-flight requests.",
          },
          {
            title: "Exit",
            text: "The process exits before the grace period ends, or it is killed forcibly.",
          },
        ],
        code: {
          title: "Never let maintenance evict too many replicas at once",
          lang: "yaml",
          source: `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: orders
  namespace: shop
spec:
  minAvailable: 2
  selector:
    matchLabels: { app: orders }`,
        },
      },
      {
        heading: "Interview follow-ups",
        bullets: [
          "Build one image and promote it from staging to production. Rebuilding per environment means production runs something that was never tested.",
          "Manage manifests with GitOps tools such as Argo CD or Flux, so the cluster's state is reviewed in pull requests and drift is visible.",
        ],
        followUps: [
          {
            q: "Why did my pod get OOMKilled?",
            a: "The container exceeded its memory limit and the kernel killed it. Common causes are a limit set below real peak usage, a runtime unaware of the container limit — a JVM sizing its heap from node memory, or too many Python workers — or a genuine leak. I check memory usage over time against the limit, confirm runtime settings respect the container, and look at whether usage grows without bound.",
          },
          {
            q: "What is the difference between requests and limits?",
            a: "Requests are what the scheduler reserves when placing a pod, so they determine capacity planning. Limits are the maximum a container may use: exceeding the memory limit kills the container, and hitting the CPU limit throttles it. Requests that are too low overcommit nodes; limits that are too low cause kills and throttling.",
          },
          {
            q: "How do you get zero-downtime deployments on Kubernetes?",
            a: "A rolling update that never removes capacity before new pods are ready (maxUnavailable 0), accurate readiness probes, graceful shutdown with a preStop pause and connection draining, a PodDisruptionBudget, replicas spread across zones, and database changes that are backward compatible so old and new versions can run together during the rollout.",
          },
        ],
      },
    ],
    related: [
      "/hld/service-discovery",
      "/hld/deployment-strategies",
      "/java/docker",
      "/python/mlops-deployment",
    ],
    furtherReading: [
      {
        label: "Kubernetes documentation — concepts",
        href: "https://kubernetes.io/docs/concepts/",
      },
      {
        label: "Kubernetes — pod disruption budgets",
        href: "https://kubernetes.io/docs/tasks/run-application/configure-pdb/",
      },
    ],
  },

  {
    slug: "deployment-strategies",
    title: "Deployment Strategies: Rolling, Blue-Green, Canary and Feature Flags",
    subtitle: "Shipping many times a day without betting the whole system on each release.",
    level: "intermediate",
    minutes: 15,
    tags: ["microservices", "deployment", "canary", "blue-green", "feature flags", "rollback"],
    summary:
      "With dozens of services deploying independently, how you release matters as much as what you release. Rolling updates replace instances gradually, blue-green switches all traffic between two environments, canaries expose a small slice of traffic first and compare metrics, and feature flags separate deploying code from releasing features. The goal is always the same: a small blast radius and a fast, boring rollback.",
    keyPoints: [
      "Separate deploy (the code is running) from release (users see the change) with feature flags.",
      "Canaries compare the new version's errors and latency against the current one before ramping up.",
      "Blue-green gives instant rollback, at the cost of double capacity during the switch.",
      "Database changes must be backward compatible, so old and new versions can run side by side.",
      "Automate rollback on metric breaches — a human watching dashboards is too slow.",
    ],
    prerequisites: ["/hld/containers-kubernetes"],
    sections: [
      {
        heading: "The strategies",
        table: {
          headers: ["Strategy", "How it works", "Rollback", "Extra cost", "Use when"],
          rows: [
            [
              "Recreate",
              "Stop old, start new",
              "Redeploy the old version",
              "Downtime",
              "Rarely — batch jobs, dev environments",
            ],
            [
              "Rolling",
              "Replace instances a few at a time",
              "Roll forward or back gradually",
              "Minimal",
              "Default for stateless services",
            ],
            [
              "Blue-green",
              "Deploy a full new environment, switch traffic at once",
              "Switch back instantly",
              "Double capacity during the switch",
              "Critical services needing instant rollback",
            ],
            [
              "Canary",
              "Send a small share of traffic to the new version, compare, ramp",
              "Shift traffic back",
              "A little extra capacity",
              "High-traffic services with good metrics",
            ],
            [
              "Shadow",
              "Mirror real traffic to the new version, discard its responses",
              "Nothing to roll back",
              "Duplicate load on dependencies",
              "Validating rewrites and performance",
            ],
            [
              "Feature flag",
              "Deploy dark, enable per user or percentage",
              "Turn the flag off",
              "Flag management and cleanup",
              "Risky features and gradual rollouts",
            ],
          ],
        },
      },
      {
        heading: "Canary analysis",
        steps: [
          {
            title: "1–5% of traffic",
            text: "Enough real traffic to surface errors, small enough to limit harm.",
          },
          { title: "Bake", text: "Wait long enough to collect a statistically meaningful sample." },
          {
            title: "Compare against the baseline",
            text: "Error rate, latency percentiles and saturation of the canary versus the current version at the same time.",
            detail:
              "Compare with the stable version running right now, not with yesterday — traffic patterns change through the day.",
          },
          { title: "Ramp", text: "25%, then 50%, then 100%, repeating the analysis at each step." },
          {
            title: "Roll back automatically",
            text: "Any breach of the agreed thresholds shifts traffic back without a human.",
          },
        ],
        math: [
          { label: "Canary traffic", expr: "5% × 2,000 requests/s", result: "100 requests/s" },
          { label: "Requests in a 10-minute bake", expr: "100 × 600 s", result: "60,000" },
          {
            label: "Expected errors at 0.1% versus 0.5% error rate",
            expr: "60,000 × 0.001 versus 60,000 × 0.005",
            result: "60 versus 300",
            note: "a clear, detectable difference within one bake step",
          },
        ],
        code: {
          title: "A stepped canary with automated analysis (Argo Rollouts)",
          lang: "yaml",
          source: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: orders
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 10m }
        - analysis:
            templates: [{ templateName: error-rate-and-latency }]   # fails the rollout on a breach
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
  # selector and pod template omitted for brevity`,
        },
      },
      {
        heading: "Blue-green or canary",
        diagram: {
          kind: "compare",
          caption: "Both avoid downtime; they differ in how risk is exposed.",
          options: [
            {
              title: "Blue-green",
              good: [
                "Instant, complete rollback",
                "The new environment is fully tested before any traffic",
              ],
              bad: [
                "Double capacity during the switch",
                "All users move at once — problems hit everyone",
                "Stateful and database changes complicate switching back",
              ],
              verdict: "When instant rollback matters more than gradual exposure.",
            },
            {
              title: "Canary",
              good: [
                "Problems affect only a small share of traffic",
                "Decisions based on real production metrics",
              ],
              bad: [
                "Needs good metrics and automated analysis",
                "Two versions serve traffic simultaneously",
              ],
              verdict: "The default for high-traffic services.",
              tone: "ok",
            },
          ],
        },
      },
      {
        heading: "Feature flags",
        code: {
          title: "Deploy dark, release gradually, keep a kill switch",
          lang: "python",
          source: `def checkout_total(cart, user) -> int:
    # Ramp to 1%, 10%, 50% of users from the flag service -- no deploy needed
    if flags.enabled("new-tax-engine", user_id=user.id, default=False):
        return new_tax_engine.total_paise(cart)
    return legacy_tax.total_paise(cart)`,
        },
        bullets: [
          "Flags turn a release into a configuration change measured in seconds, and a bad feature into a toggle rather than an emergency rollback.",
          "Bucket by a stable key such as the user id, so a user does not flip between old and new behaviour on every request.",
          "Delete flags once a rollout completes. Old flags become untested branches and a source of surprising behaviour.",
          "Test both paths while a flag is live — the off path is the rollback plan.",
        ],
      },
      {
        heading: "Databases: the part that cannot simply roll back",
        steps: [
          {
            title: "Add, do not change",
            text: "Add the new nullable column or table; old code ignores it.",
          },
          { title: "Write both", text: "Deploy code that writes the old and new shapes." },
          { title: "Backfill", text: "Populate the new column for existing rows in batches." },
          { title: "Read new", text: "Deploy code that reads the new shape, still writing both." },
          {
            title: "Remove the old",
            text: "Once no running version reads it, drop the old column in a later release.",
          },
        ],
        callout: {
          kind: "warn",
          text: "A migration that renames or drops a column in the same release as the code that stops using it breaks rolling updates — old pods are still running — and makes rollback impossible, because the previous version expects a column that no longer exists.",
        },
        links: [
          { label: "Site: expand and contract for APIs", href: "/hld/api-contracts-versioning" },
        ],
      },
      {
        heading: "Rollback hygiene and interview follow-ups",
        bullets: [
          "Automate rollback on SLO breaches and keep the previous artefact ready to redeploy.",
          "Ship one risky change at a time, so a regression points at its cause.",
          "Track deployment frequency, lead time, change failure rate and time to restore — the DORA metrics — to see whether releases are getting safer.",
        ],
        followUps: [
          {
            q: "Canary or blue-green?",
            a: "Canary for most high-traffic stateless services, because a problem reaches only a small share of users and the decision rests on real production metrics. Blue-green when an instant, complete switch back matters most and the extra capacity is affordable — and only if database changes are backward compatible, otherwise switching back is not really instant.",
          },
          {
            q: "How do you roll back a release that included a database migration?",
            a: "Design it so you never need to reverse the migration. Schema changes are expand-only in the release that ships new code: add columns and tables that the old version ignores. Rolling back is then just redeploying the previous application version. Destructive changes happen in a later release, after nothing running depends on the old shape.",
          },
          {
            q: "What is the difference between deploying and releasing?",
            a: "Deploying puts new code into production; releasing exposes the change to users. Feature flags separate the two, so code can be deployed dark, tested in production, released to a percentage of users, and turned off instantly without another deploy.",
          },
        ],
      },
    ],
    related: [
      "/hld/api-contracts-versioning",
      "/hld/containers-kubernetes",
      "/hld/observability",
      "/python/mlops-deployment",
    ],
    furtherReading: [
      {
        label: "Martin Fowler — BlueGreenDeployment",
        href: "https://martinfowler.com/bliki/BlueGreenDeployment.html",
      },
      {
        label: "Google SRE Workbook — canarying releases",
        href: "https://sre.google/workbook/canarying-releases/",
      },
    ],
  },
];
