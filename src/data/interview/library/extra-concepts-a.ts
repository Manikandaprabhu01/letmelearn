// Imported from the Interview Prep Console (lib/extra-concepts-a.js).
import type { ConceptAnswer } from "../types";

export const extraConceptsA: ConceptAnswer[] = [
  {
    id: "x-c-typeurl",
    t: "What happens when you type google.com and press Enter?",
    cat: "Networking",
    r: 2,
    src: ["GFG CN top 50", "InterviewBit"],
    a: "The most-asked networking question because it lets the interviewer probe wherever they like. Give the chain, then let them pick a link to go deep on.\n\n1. **URL parsing** — scheme, host, port, path. The browser checks HSTS and may upgrade http to https before anything leaves the machine.\n2. **DNS resolution** — browser cache → OS cache → hosts file → resolver (usually your ISP or 8.8.8.8). On a miss the resolver walks root → TLD (.com) → authoritative nameserver, caching each answer for its TTL. Returns an A/AAAA record; often a CDN's anycast address.\n3. **TCP connection** — three-way handshake (SYN, SYN-ACK, ACK) to port 443. With TCP Fast Open or QUIC/HTTP3 this collapses into fewer round trips.\n4. **TLS handshake** — ClientHello with supported ciphers and SNI, server certificate, chain validated against trusted roots, key exchange (ECDHE for forward secrecy), then symmetric keys. TLS 1.3 does this in one round trip, or zero on resumption.\n5. **HTTP request** — GET / with headers (Host, cookies, Accept-Encoding). Often handled by a CDN edge node, which may serve from cache.\n6. **Server side** — load balancer → application server → cache/database → response, with Cache-Control and ETag headers deciding what the browser stores.\n7. **Browser rendering** — parse HTML into the DOM, CSS into the CSSOM, run blocking scripts, build the render tree, layout, paint, composite. Subresources trigger more of steps 2–6, over the same connection thanks to HTTP/2 multiplexing.\n\nThe strongest answers name where things usually go wrong: DNS TTL during a migration, TLS certificate chain issues, and render-blocking scripts.",
    fu: [
      {
        q: "Where would you look first if the page is slow?",
        a: "Split the time: DNS, connect, TLS, TTFB (server), then content download and render. Browser devtools or `curl -w` gives all of these — the answer is almost always in one bucket, and naming the buckets is the skill.",
      },
      {
        q: "What does a CDN change in this flow?",
        a: "DNS returns an edge address (anycast or geo-DNS), the TCP and TLS handshakes terminate at the edge rather than the origin — which is most of the latency saving — and static content is served locally, with dynamic requests proxied back over a warm connection.",
      },
      {
        q: "Why is HTTP/3 faster?",
        a: "It runs over QUIC on UDP: connection setup and TLS combine into one round trip, and streams are independent, so a lost packet no longer blocks every other stream (TCP head-of-line blocking).",
      },
    ],
  },
  {
    id: "x-c-tcpudp",
    t: "TCP vs UDP, the three-way handshake, and the OSI model",
    cat: "Networking",
    r: 2,
    src: ["GFG CN top 50"],
    a: "**TCP** is connection-oriented, reliable and ordered: handshake to establish, sequence numbers and acknowledgements to guarantee delivery and order, retransmission on loss, flow control (receiver window) and congestion control (slow start, congestion avoidance, fast recovery). The costs are setup latency and head-of-line blocking.\n\n**UDP** is a thin wrapper over IP: no handshake, no ordering, no retransmission, no congestion control. You use it when latency matters more than completeness, or when you want to build your own reliability — DNS, VoIP and video calls, gaming, QUIC (which reimplements reliability in user space on top of UDP).\n\n**Three-way handshake**: client sends SYN with an initial sequence number; server replies SYN-ACK with its own; client ACKs. Three messages are the minimum to synchronise sequence numbers in both directions. Teardown is four (FIN/ACK each way) and leaves the initiator in TIME_WAIT for 2×MSL so late packets cannot corrupt a new connection on the same tuple — that TIME_WAIT detail is a favourite follow-up on servers that run out of ports.\n\n**OSI vs TCP/IP**: OSI has seven layers (physical, data link, network, transport, session, presentation, application); the TCP/IP model collapses these into four (link, internet, transport, application). Know which protocols sit where — IP at network, TCP/UDP at transport, HTTP/DNS/TLS at the top — and that 'layer 4 load balancer' means it routes on IP/port while 'layer 7' means it reads the HTTP request.",
    fu: [
      {
        q: "Why does TCP need congestion control at all?",
        a: "Without it, senders push until the network collapses (congestion collapse, observed on the early internet). Slow start probes capacity exponentially, then additive-increase/multiplicative-decrease backs off on loss. Modern stacks use CUBIC or BBR, which models bandwidth and round-trip time rather than treating loss as the only signal.",
      },
      {
        q: "When would you choose UDP in a backend system?",
        a: "Metrics and log shipping where losing a sample is acceptable (StatsD), service discovery and gossip, real-time media, and anything where you need multicast. Also anything on QUIC/HTTP3, which is UDP underneath.",
      },
      {
        q: "What is head-of-line blocking?",
        a: "In TCP, one lost segment stalls everything behind it because bytes must be delivered in order — even data for unrelated HTTP/2 streams on the same connection. QUIC gives each stream its own sequencing, which is why HTTP/3 exists.",
      },
    ],
  },
  {
    id: "x-c-acid",
    t: "ACID, isolation levels and locking",
    cat: "Databases",
    r: 2,
    src: ["GFG DBMS top 50", "DataCamp SQL"],
    a: "**ACID**: **Atomicity** (all or nothing, via the write-ahead log and rollback), **Consistency** (constraints hold before and after — the application's job as much as the database's), **Isolation** (concurrent transactions do not see each other's intermediate state), **Durability** (a committed transaction survives a crash, via WAL fsync).\n\nIsolation is the one with real trade-offs, and the anomalies define the levels:\n- **Read Uncommitted** — dirty reads allowed. Almost never used.\n- **Read Committed** — you only see committed data, but two reads in the same transaction can differ (non-repeatable read). **Postgres default.**\n- **Repeatable Read** — a row read twice reads the same, but new rows matching your predicate can appear (phantom reads). **MySQL/InnoDB default**, where it also blocks phantoms via next-key locking.\n- **Serializable** — behaves as if transactions ran one at a time. Implemented with strict two-phase locking or, in Postgres, Serializable Snapshot Isolation, which aborts transactions that would violate serialisability rather than blocking them.\n\n**Locking**: shared (read) locks are compatible with each other; exclusive (write) locks are not compatible with anything. Databases also take intent locks at coarser granularity and gap/next-key locks to prevent phantoms. **MVCC** (Postgres, InnoDB, Oracle) sidesteps most read locking by keeping row versions, which is why readers do not block writers and vice versa.\n\nThe practical framing: pick Read Committed by default, raise the level only where an anomaly actually matters, and know that higher isolation means more aborts or more blocking — never free.",
    sql: "-- the anomaly each level prevents, demonstrated\n-- Session A                          -- Session B\nBEGIN;                                 BEGIN;\nSELECT balance FROM accounts           \n  WHERE id = 1;          -- 100\n                                       UPDATE accounts SET balance = 50\n                                         WHERE id = 1;\n                                       COMMIT;\nSELECT balance FROM accounts\n  WHERE id = 1;          -- READ COMMITTED: 50   (non-repeatable read)\n                         -- REPEATABLE READ: 100 (snapshot held)\nCOMMIT;\n\n-- explicit locking when you genuinely need it\nBEGIN;\nSELECT * FROM inventory WHERE sku = 'X' FOR UPDATE;   -- exclusive row lock\nUPDATE inventory SET qty = qty - 1 WHERE sku = 'X';\nCOMMIT;\n\n-- usually better: a conditional update, no lock held across think-time\nUPDATE inventory SET qty = qty - 1\n WHERE sku = 'X' AND qty >= 1;      -- check affected row count",
    fu: [
      {
        q: "What is a deadlock in a database and how do you avoid it?",
        a: "Two transactions hold locks the other needs. Databases detect the cycle and kill one with a deadlock error. Avoid it by touching rows in a consistent order, keeping transactions short, and retrying on the deadlock error code — retry is expected, not exceptional.",
      },
      {
        q: "How does MVCC work?",
        a: "Each row version carries transaction ids for creation and deletion; a reader sees the versions visible to its snapshot. Old versions are reclaimed later (VACUUM in Postgres, purge in InnoDB), which is why long-running transactions cause bloat.",
      },
      {
        q: "Optimistic or pessimistic locking?",
        a: "Optimistic (version column, retry on conflict) when conflicts are rare — better throughput, no held locks. Pessimistic (SELECT FOR UPDATE) when conflicts are common and retries would thrash, such as a hot inventory row on a flash sale.",
      },
    ],
  },
  {
    id: "x-c-normalization",
    t: "Normalization, denormalization and schema design",
    cat: "Databases",
    r: 2,
    src: ["GFG DBMS top 50", "DataCamp SQL"],
    a: '**Normalization** removes redundancy so a fact lives in one place.\n- **1NF** — atomic values, no repeating groups (no comma-separated lists in a column).\n- **2NF** — 1NF plus no partial dependency on part of a composite key.\n- **3NF** — 2NF plus no transitive dependency (non-key attributes depend only on the key). *"Every non-key attribute depends on the key, the whole key, and nothing but the key."*\n- **BCNF** — a stricter 3NF where every determinant is a candidate key.\n\nIn practice you design to 3NF and stop, because the benefits — no update anomalies, smaller writes, clear ownership of each fact — are already captured.\n\n**Denormalization** deliberately reintroduces redundancy for read performance: a cached `comment_count` on a post, a copy of the product name on an order line, a materialised view for a dashboard. The rules that make it safe: only denormalise after a measured read problem, decide who owns the update path (usually an event or a trigger), and accept that the copy can lag.\n\nThe order-line example is the one to give: you copy the product\'s **name and price** onto the order line not for speed but for **correctness** — an order must render as it was billed, even after the product changes. That distinction, between denormalising for performance and snapshotting for history, is what separates a textbook answer from an engineering one.',
    sql: "-- 1NF violation and fix\n-- BAD:  orders(id, items TEXT)  -- 'sku1,sku2,sku3'\n-- GOOD: order_items(order_id, sku, qty, PRIMARY KEY(order_id, sku))\n\n-- 3NF violation: city and pincode depend on each other, not on the order\n-- BAD:  orders(id, customer_id, pincode, city)\n-- GOOD: orders(id, customer_id, address_id)  +  addresses(id, pincode, city)\n\n-- deliberate denormalisation for history (a snapshot, not a cache)\nCREATE TABLE order_items (\n  order_id     bigint REFERENCES orders(id),\n  product_id   bigint REFERENCES products(id),\n  name_snapshot text    NOT NULL,      -- what the customer saw\n  price_minor   bigint  NOT NULL,      -- what they were charged\n  qty           int     NOT NULL,\n  PRIMARY KEY (order_id, product_id)\n);\n\n-- deliberate denormalisation for reads (a cache, updated by events)\nALTER TABLE posts ADD COLUMN comment_count int NOT NULL DEFAULT 0;",
    fu: [
      {
        q: "When do you denormalise?",
        a: "When a read query is measurably too slow and the alternatives (index, cache, materialised view) do not fit, or when you need a point-in-time snapshot. Never pre-emptively — the update path is where denormalised schemas rot.",
      },
      {
        q: "What are the anomalies normalization prevents?",
        a: "Update anomaly (the same fact stored twice drifts), insertion anomaly (you cannot record a fact without inventing unrelated data), deletion anomaly (removing a row destroys an unrelated fact). Naming all three is the textbook answer they are checking for.",
      },
      {
        q: "Star schema vs normalized for analytics?",
        a: "OLTP wants 3NF for write integrity; analytics wants a star schema (fact table plus denormalised dimensions) because scans and joins on wide dimension tables are the query pattern. Different workloads, different shapes — that is the point of a warehouse.",
      },
    ],
  },
  {
    id: "x-c-restdesign",
    t: "REST API design: idempotency, versioning, pagination and status codes",
    cat: "API & web",
    r: 2,
    src: ["DesignGurus REST", "Educative", "DataCamp"],
    a: "**Resources and verbs** — nouns in paths, verbs in methods: `GET /orders/42`, `POST /orders`, `PATCH /orders/42`, `DELETE /orders/42`. Sub-resources for relationships (`/orders/42/items`), and actions that are genuinely not CRUD get a verb sub-resource (`POST /orders/42/cancel`) rather than a query parameter.\n\n**Idempotency** — GET, PUT, DELETE and HEAD are idempotent by definition; POST and PATCH are not. For anything that moves money or creates records, accept an `Idempotency-Key` header, store the key with the response, and replay the stored response on retry. This is the single most valuable API habit and it comes up in every payments interview.\n\n**Status codes that matter**: 200 (OK), 201 (created, with a Location header), 202 (accepted — async), 204 (no content), 400 (malformed), 401 (not authenticated) vs 403 (authenticated but not allowed), 404, 409 (conflict — duplicate or version mismatch), 412 (precondition failed, from If-Match), 422 (semantically invalid), 429 (rate limited, with Retry-After), 500 vs 503 (503 means try again).\n\n**Pagination** — cursor-based (`?cursor=opaque&limit=50`) rather than offset, because offsets skip or duplicate rows when data changes underneath and get slower as they grow. Return the next cursor in the response, never make the client construct it.\n\n**Versioning** — `/v1/` in the path is the pragmatic default (visible, cacheable, trivially debuggable); header or media-type versioning is purer and harder to operate. Inside a version, only make additive changes; for breaking ones use expand/contract: ship the new field alongside the old, migrate consumers, remove later with a sunset header.\n\n**Errors** — a consistent envelope: a machine-readable code, a human message, and a field-level list for validation. Clients should never parse your prose.",
    sql: '# idempotent create\nPOST /v1/payments\nIdempotency-Key: 8f14e45f-ea2b-4d1a-9a1c-1f2b3c4d5e6f\nContent-Type: application/json\n{ "amount_minor": 129900, "currency": "INR", "order_id": "ord_42" }\n\n201 Created\nLocation: /v1/payments/pay_9Kd\n{ "id": "pay_9Kd", "status": "captured" }\n\n# the same call retried → the SAME response, no second charge\n\n# optimistic concurrency\nPATCH /v1/orders/42\nIf-Match: "v7"\n{ "status": "shipped" }\n\n412 Precondition Failed        # someone else updated it; re-read and retry\n\n# cursor pagination\nGET /v1/orders?limit=50&cursor=eyJpZCI6MTIzNH0\n200 OK\n{ "data": [ ... ], "next_cursor": "eyJpZCI6MTI4NH0", "has_more": true }\n\n# rate limited\n429 Too Many Requests\nRetry-After: 12\nX-RateLimit-Limit: 1000\nX-RateLimit-Remaining: 0\nX-RateLimit-Reset: 1735689600\n\n# error envelope\n422 Unprocessable Entity\n{ "code": "validation_failed",\n  "message": "The request could not be processed",\n  "errors": [ { "field": "currency", "code": "unsupported", "message": "Use INR or USD" } ] }',
    fu: [
      {
        q: "REST vs GraphQL vs gRPC?",
        a: "REST for public, cacheable, resource-shaped APIs with wide client support. GraphQL when clients need to shape their own payloads and you want to avoid endpoint sprawl — at the cost of caching and query-cost control (guard with depth limits and persisted queries). gRPC for internal service-to-service: binary, schema-first, streaming, low latency, but not browser-friendly without a proxy.",
      },
      {
        q: "How do you design an API that will be public for ten years?",
        a: "Additive-only evolution, explicit versioning, a documented deprecation policy with sunset headers, idempotency on writes, cursor pagination from day one, and a schema (OpenAPI) that is generated from — or generates — the code so the docs cannot drift.",
      },
      {
        q: "Should errors return 200 with a body?",
        a: 'No. HTTP status codes exist so intermediaries (proxies, retries, monitoring) can act without parsing your payload. Returning 200 with `{"error": ...}` breaks every layer of tooling above you.',
      },
    ],
  },
  {
    id: "x-c-microservicepatterns",
    t: "Microservices patterns: saga, circuit breaker, service discovery, outbox",
    cat: "Distributed systems",
    r: 3,
    src: ["DataCamp microservices", "Medium top 25"],
    a: "**Saga** — a business transaction spanning services, implemented as local transactions plus compensating actions. **Choreography** (services react to each other's events) is simple with few steps and becomes impossible to reason about beyond three or four; **orchestration** (a coordinator service drives the steps) is easier to observe and to debug. Every step must be idempotent and every compensation must be safe to run twice.\n\n**Outbox** — write the domain change and the event to publish in the *same* database transaction, into an `outbox` table; a relay (polling or change-data-capture) publishes from that table to the broker. It is the standard fix for the dual-write problem: without it, you either write the row and fail to publish, or publish and fail to commit.\n\n**Circuit breaker** — wrap a remote dependency with a state machine: CLOSED (calls pass, failures counted), OPEN (calls fail fast, no traffic to the sick service), HALF-OPEN (a few probes decide whether to close). It converts a slow cascading failure into a fast local one, and pairs with **timeouts**, **bulkheads** (separate thread pools or connection pools per dependency) and **retries with jittered backoff and a retry budget**.\n\n**Service discovery** — client-side (the client asks a registry such as Consul/Eureka and load-balances itself) or server-side (a load balancer or service mesh does it). Kubernetes gives you DNS-based discovery plus a virtual IP per service, which is why most teams no longer run a separate registry.\n\n**API gateway** — one entry point for auth, rate limiting, routing and aggregation, so cross-cutting concerns are not reimplemented per service. Keep business logic out of it or it becomes the monolith you were trying to avoid.\n\n**Strangler fig** — the migration pattern: route slices of traffic from the monolith to new services behind a facade until nothing is left. Name it when asked how you would decompose a monolith.",
    java: '// Outbox: state change and event committed together\n@Transactional\npublic Order placeOrder(OrderRequest req) {\n    Order order = orderRepository.save(Order.from(req));\n    outboxRepository.save(new OutboxEvent(\n            UUID.randomUUID(), "order.placed", toJson(order), Instant.now()));\n    return order;                        // one transaction: no lost or phantom events\n}\n\n// Relay (separate process): poll, publish, mark sent — at-least-once, consumers dedupe\n@Scheduled(fixedDelay = 500)\npublic void relay() {\n    for (OutboxEvent e : outboxRepository.findUnsent(100)) {\n        broker.publish(e.topic(), e.id().toString(), e.payload());\n        outboxRepository.markSent(e.id());\n    }\n}\n\n// Circuit breaker + timeout + bounded retry around a dependency\nSupplier<Quote> guarded = Decorators\n    .ofSupplier(() -> pricingClient.quote(request))\n    .withTimeLimiter(TimeLimiter.of(Duration.ofMillis(800)))\n    .withCircuitBreaker(CircuitBreaker.of("pricing", CircuitBreakerConfig.custom()\n            .failureRateThreshold(50)\n            .waitDurationInOpenState(Duration.ofSeconds(10))\n            .permittedNumberOfCallsInHalfOpenState(3)\n            .build()))\n    .withRetry(Retry.of("pricing", RetryConfig.custom()\n            .maxAttempts(3)\n            .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(100, 2))\n            .build()))\n    .withFallback(List.of(CallNotPermittedException.class), e -> Quote.cached())\n    .decorate();',
    py: "# Outbox with SQLAlchemy: same transaction for state and event\ndef place_order(session, req):\n    order = Order.from_request(req)\n    session.add(order)\n    session.add(OutboxEvent(topic='order.placed', payload=order.to_json()))\n    session.commit()          # atomic: both rows or neither\n    return order\n\n# Circuit breaker sketch (pybreaker-style)\nimport pybreaker, requests\n\npricing_breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=10)\n\n@pricing_breaker\ndef get_quote(payload):\n    return requests.post('http://pricing/quote', json=payload, timeout=0.8).json()\n\ndef quote_with_fallback(payload):\n    try:\n        return get_quote(payload)\n    except (pybreaker.CircuitBreakerError, requests.Timeout):\n        return cached_quote(payload)      # degrade, do not cascade",
    fu: [
      {
        q: "How do you decide service boundaries?",
        a: "Along business capabilities and transaction boundaries — if two things must change together atomically, they belong in one service. If two services always deploy together, merge them. Conway's law means the boundary you pick becomes the team boundary, so choose deliberately.",
      },
      {
        q: "Saga rollback when a compensation itself fails?",
        a: "Retry the compensation with backoff, then escalate to a dead-letter queue with an operator UI. Some steps are not compensable (an email is sent) — design those to be last, or make them reversible in business terms (a correction email).",
      },
      {
        q: "Do you always need a service mesh?",
        a: "No. A mesh buys mTLS, retries, traffic shifting and telemetry without library changes, at the cost of real operational complexity. With fewer than ~20 services, libraries plus a gateway are usually simpler — saying that is a sign of judgment rather than fashion.",
      },
    ],
  },
  {
    id: "x-c-docker-k8s",
    t: "Docker, Kubernetes and CI/CD",
    cat: "DevOps",
    r: 2,
    src: ["DataCamp Docker", "Spacelift K8s", "DevOps checklist"],
    a: "**Containers vs VMs** — a container shares the host kernel and isolates with namespaces (pid, net, mnt, user) and cgroups (cpu, memory); a VM virtualises hardware and runs its own kernel. Containers start in milliseconds and are the unit of deployment; VMs give stronger isolation, which is why cloud providers run your containers inside their VMs.\n\n**Images** are layered and content-addressed: each Dockerfile instruction adds a layer, layers are cached and shared, and a multi-stage build keeps compilers out of the final image. Practical rules: pin base image versions, order instructions so dependencies cache well, run as a non-root user, and keep images small (distroless/alpine) because image size is deploy latency.\n\n**Kubernetes objects worth knowing**: Pod (one or more containers sharing a network namespace), Deployment (declarative rollout with ReplicaSets), Service (stable virtual IP and DNS name), Ingress (HTTP routing), ConfigMap/Secret (configuration), StatefulSet (stable identities and volumes), DaemonSet (one pod per node), HPA (autoscaling on metrics), PersistentVolumeClaim (storage). The control loop idea underpins all of it: you declare desired state, controllers continuously reconcile actual state toward it.\n\n**Probes** — liveness (restart if it fails), readiness (remove from the Service's endpoints while failing), startup (grace period for slow boots). Getting readiness wrong is the most common cause of a bad deploy taking traffic.\n\n**CI/CD** — build once, promote the same artefact through environments; run tests and security scans in the pipeline; deploy with a strategy: **rolling** (default, gradual), **blue-green** (two full environments, instant switch and rollback), **canary** (small traffic percentage first, automated rollback on error-rate regression). Separate deploy from release with feature flags so shipping code and enabling behaviour are different decisions.",
    sql: '# multi-stage Dockerfile: small, cached, non-root\nFROM maven:3.9-eclipse-temurin-21 AS build\nWORKDIR /src\nCOPY pom.xml .\nRUN mvn -B dependency:go-offline          # cached unless pom.xml changes\nCOPY src ./src\nRUN mvn -B package -DskipTests\n\nFROM eclipse-temurin:21-jre-alpine\nRUN addgroup -S app && adduser -S app -G app\nUSER app\nCOPY --from=build /src/target/app.jar /app/app.jar\nEXPOSE 8080\nENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]\n\n# Deployment with probes and a rolling strategy\napiVersion: apps/v1\nkind: Deployment\nspec:\n  replicas: 6\n  strategy:\n    type: RollingUpdate\n    rollingUpdate: { maxSurge: 2, maxUnavailable: 0 }   # never lose capacity\n  template:\n    spec:\n      containers:\n        - name: api\n          image: registry/api:1.42.0                    # pinned, never :latest\n          readinessProbe:\n            httpGet: { path: /readyz, port: 8080 }\n            periodSeconds: 5\n          livenessProbe:\n            httpGet: { path: /livez, port: 8080 }\n            initialDelaySeconds: 30\n          resources:\n            requests: { cpu: 200m, memory: 512Mi }\n            limits:   { memory: 1Gi }',
    fu: [
      {
        q: "Why is my pod in CrashLoopBackOff?",
        a: "Walk the ladder: `kubectl describe pod` for events (image pull, OOMKilled, failed mount), `kubectl logs --previous` for the crash output, then check the liveness probe (too aggressive a probe restarts a healthy but slow-starting app) and resource limits. OOMKilled with a JVM usually means heap was sized without regard to the container limit.",
      },
      {
        q: "Requests vs limits?",
        a: "Requests drive scheduling and guarantee capacity; limits cap usage. CPU over the limit is throttled, memory over the limit is killed. A common production choice is to set memory request = limit (avoid eviction surprises) and leave CPU limits off or generous to avoid throttling latency-sensitive services.",
      },
      {
        q: "Blue-green or canary?",
        a: "Canary when you can measure error rate and latency per version and want a gradual, automated rollback — the default for high-traffic services. Blue-green when the change is all-or-nothing (a schema cutover) and you want an instant switch, at the cost of running two full environments.",
      },
    ],
  },
  {
    id: "x-c-security",
    t: "Application security: OWASP basics, SQL injection, XSS, CSRF, OAuth",
    cat: "Security",
    r: 2,
    src: ["GFG SQL", "DataCamp REST", "InterviewBit"],
    a: "**SQL injection** — caused by building queries with string concatenation. The fix is parameterised statements (bind variables), always, including in ORMs' raw-query escape hatches. Input validation and least-privilege database users are defence in depth, not the fix.\n\n**XSS** — untrusted data rendered as markup. Contextual output encoding (HTML, attribute, JS, URL contexts differ), a Content-Security-Policy, and framework auto-escaping. Store-then-render is where stored XSS hides. Never build DOM with `innerHTML` from user data.\n\n**CSRF** — the browser sends cookies automatically, so a third-party page can trigger authenticated requests. Fixes: `SameSite=Lax/Strict` cookies (now the default in modern browsers), anti-CSRF tokens for state-changing forms, and requiring a custom header for APIs (which cross-origin forms cannot set). Token-in-header auth (Bearer) is not vulnerable in the same way — which is part of why APIs use it.\n\n**AuthN vs AuthZ** — see the dedicated card; the security point here is that authorisation must be enforced server-side on every request, and list endpoints must filter in the query, not in the response.\n\n**OAuth2 / OIDC** — OAuth2 delegates *authorisation* (a third party acts on your behalf); OIDC adds an ID token so you can *authenticate*. Know the **authorization code flow with PKCE** as the modern default for web and mobile (the implicit flow is deprecated), and client credentials for machine-to-machine. Tokens should be short-lived, scoped, and validated by signature and audience.\n\n**Secrets and data** — never in source control or logs; use a secret manager with rotation, encrypt at rest with KMS-managed keys, TLS everywhere including internal hops, and hash passwords with argon2id/bcrypt. The OWASP Top 10 to name if asked: broken access control, cryptographic failures, injection, insecure design, misconfiguration, vulnerable components, auth failures, integrity failures, logging failures, SSRF.",
    sql: "-- SQL injection: the vulnerability and the fix\n-- VULNERABLE (string building)\n--   \"SELECT * FROM users WHERE email = '\" + email + \"'\"\n--   email = \"x' OR '1'='1\"  →  returns every row\n\n-- SAFE (parameterised; the driver never mixes data with SQL text)\nPREPARE stmt FROM 'SELECT * FROM users WHERE email = ?';\n\n-- least privilege: the app user cannot drop anything\nCREATE ROLE app_rw LOGIN PASSWORD '...';\nGRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;\nREVOKE CREATE ON SCHEMA public FROM app_rw;\n\n-- cookies that resist CSRF and theft\nSet-Cookie: session=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600\n\n-- OAuth2 authorization code + PKCE (the modern default)\n1. client → /authorize?response_type=code&code_challenge=S256(verifier)&scope=openid\n2. user authenticates at the IdP\n3. IdP → client: ?code=abc\n4. client → /token  {code, code_verifier}    ← proves it is the same client\n5. IdP → client: {access_token, id_token, refresh_token}",
    fu: [
      {
        q: "Where do you store a JWT in a browser?",
        a: "Prefer an httpOnly, Secure, SameSite cookie for the refresh token and keep the access token in memory. localStorage is readable by any XSS, and a single XSS then becomes full account takeover. If you use cookies, add CSRF protection.",
      },
      {
        q: "How do you prevent SSRF?",
        a: "Validate and allow-list outbound destinations, resolve DNS and check the resolved IP against private ranges (including the cloud metadata endpoint), disable redirects or re-validate after each hop, and run outbound fetches from a network segment with no access to internal services.",
      },
      {
        q: "How do you handle secrets rotation?",
        a: "Short-lived credentials issued by a secret manager, with the application re-reading on a schedule; support two valid secrets at once so rotation is not a cutover. Never rotate by redeploying with a new hard-coded value.",
      },
    ],
  },
  {
    id: "x-c-loadbalancing",
    t: "Load balancers, proxies, CDNs and scaling basics",
    cat: "Distributed systems",
    r: 2,
    src: ["DesignGurus entry-level", "ByteByteGo"],
    a: "**Vertical vs horizontal scaling** — bigger machines versus more machines. Vertical is simpler and hits a hard ceiling plus a single point of failure; horizontal is the default for stateless services and requires you to remove local state (sessions, in-process caches, uploaded files) first. State the prerequisite, not just the preference.\n\n**Load balancer layers** — **L4** routes on IP/port, cheap and protocol-agnostic; **L7** reads the HTTP request, so it can route by path or header, terminate TLS, retry idempotent requests and do sticky sessions. Algorithms: round robin, least connections (better with uneven request cost), consistent hashing (cache affinity), and weighted variants for heterogeneous fleets. Health checks remove bad instances; **passive** checks (observing real traffic) catch what a synthetic `/health` misses.\n\n**Forward vs reverse proxy** — a forward proxy sits in front of *clients* (egress control, corporate filtering); a reverse proxy sits in front of *servers* (TLS termination, caching, compression, WAF, load balancing). Nginx/Envoy are reverse proxies; this distinction is a common quick-fire question.\n\n**API gateway vs load balancer** — the load balancer distributes traffic; the gateway adds API concerns: authentication, rate limiting, request transformation, aggregation and per-route policy. In practice the gateway sits behind a load balancer.\n\n**CDN** — caches static (and increasingly dynamic) content at edge locations near users. Push (you upload) versus pull (the edge fetches on first miss) — pull is the default. The two levers: cache keys (do not let query strings fragment your cache) and TTL/invalidation (prefer content-hashed immutable URLs so you never need to purge).\n\n**Stateless services** are what make all of this work: any instance can serve any request, so scaling, restarts and failures are boring. Sessions go to Redis, files to object storage, and anything that must be sticky is an explicit, justified exception.",
    fu: [
      {
        q: "Sticky sessions — yes or no?",
        a: "Avoid them for application state (put the session in Redis); accept them where they buy something real, such as WebSocket connections or a large per-user local cache. The cost is uneven load and losing users' state when an instance dies.",
      },
      {
        q: "How do you scale writes when the database is the bottleneck?",
        a: "In order: fix the query and indexes, batch and reduce round trips, move reads to replicas, cache, then partition or shard by a key that keeps most transactions single-shard. Adding application instances does nothing if the database is saturated — saying that shows you have found a real bottleneck before.",
      },
      {
        q: "What does 'cache invalidation is hard' actually mean here?",
        a: "Multiple layers (browser, CDN, gateway, application, database) each hold copies with different lifetimes, so a change must either propagate through all of them or be designed away with immutable, content-addressed URLs. The second option is why every modern asset pipeline hashes filenames.",
      },
    ],
  },
  {
    id: "x-c-javacore",
    t: "Java core: collections, equals/hashCode, streams and immutability",
    cat: "Java & concurrency",
    r: 1,
    src: ["GFG Java collections", "InterviewBit Java"],
    a: "**Collections** — `ArrayList` (contiguous array: O(1) random access, O(n) middle insert, resize by ~1.5×) versus `LinkedList` (O(1) insert given a node, O(n) access, terrible cache locality — in practice ArrayList wins almost always). `HashMap` (O(1) average, treeified buckets since Java 8), `LinkedHashMap` (insertion or access order — the basis of a simple LRU), `TreeMap` (sorted, O(log n), gives you `floorKey`/`ceilingKey`). `ArrayDeque` is the right stack and queue; `Stack` and `Vector` are legacy synchronised classes.\n\n**equals and hashCode** — the contract: equal objects must have equal hash codes; unequal objects may collide. Violate it and your object vanishes inside a `HashMap`. Always override them together, use the same fields in both, and prefer immutable fields — mutating a key after insertion makes it unreachable. `record` types generate both correctly, which is a good reason to use them for value objects.\n\n**Fail-fast vs fail-safe iterators** — collections from `java.util` throw `ConcurrentModificationException` when structurally modified during iteration (fail-fast, via a modCount check); `CopyOnWriteArrayList` and `ConcurrentHashMap` iterate over a snapshot or tolerate concurrent updates (fail-safe, possibly stale). Removing during iteration is done via `Iterator.remove()` or `removeIf`.\n\n**Comparable vs Comparator** — `Comparable` is the type's natural order (one per class); `Comparator` is an external, composable ordering (`comparing(...).thenComparing(...).reversed()`). Keep `compareTo` consistent with `equals` or sorted collections behave surprisingly.\n\n**Streams** — declarative pipelines with lazy intermediate operations and one terminal operation. Use them for readability, not as a performance claim; a simple loop is often faster. Avoid side effects inside streams, and use `parallelStream` only for large, CPU-bound, side-effect-free work — it shares the common ForkJoinPool, so a blocking call inside it can stall unrelated code.\n\n**Immutability** — final fields, no setters, defensive copies of mutable inputs and outputs, and `List.copyOf`/`Map.copyOf` for unmodifiable views. Immutable objects are automatically thread-safe, which removes most of the need for the locking discussion in the first place.",
    java: '// the equals/hashCode contract, and why records help\nrecord Money(long minor, Currency currency) { }        // equals + hashCode generated\n\n// manual version, same fields in both\npublic final class Money {\n    private final long minor;\n    private final Currency currency;\n\n    @Override public boolean equals(Object o) {\n        if (this == o) return true;\n        if (!(o instanceof Money other)) return false;\n        return minor == other.minor && currency.equals(other.currency);\n    }\n    @Override public int hashCode() { return Objects.hash(minor, currency); }\n}\n\n// LRU in three lines using LinkedHashMap\'s access order\nclass Lru<K, V> extends LinkedHashMap<K, V> {\n    private final int capacity;\n    Lru(int capacity) { super(capacity, 0.75f, true); this.capacity = capacity; }\n    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {\n        return size() > capacity;\n    }\n}\n\n// fail-fast vs safe removal\nList<String> names = new ArrayList<>(List.of("a", "b", "c"));\n// for (String n : names) if (n.equals("b")) names.remove(n);  // ConcurrentModificationException\nnames.removeIf(n -> n.equals("b"));                            // correct\n\n// streams: grouping and summarising without a loop\nMap<String, Long> ticketsByStatus = tickets.stream()\n        .collect(Collectors.groupingBy(Ticket::status, Collectors.counting()));\n\n// defensive copies keep an object genuinely immutable\npublic final class Order {\n    private final List<Item> items;\n    public Order(List<Item> items) { this.items = List.copyOf(items); }   // copy in\n    public List<Item> items() { return items; }                           // already unmodifiable\n}',
    py: "# Python equivalents of the same ideas\nfrom dataclasses import dataclass, field\nfrom collections import OrderedDict, deque\nfrom functools import total_ordering\n\n@dataclass(frozen=True)            # immutable, __eq__ and __hash__ generated\nclass Money:\n    minor: int\n    currency: str\n\nclass Lru(OrderedDict):            # LRU via move_to_end / popitem\n    def __init__(self, capacity):\n        super().__init__(); self.capacity = capacity\n    def get(self, key, default=None):\n        if key not in self: return default\n        self.move_to_end(key)\n        return self[key]\n    def put(self, key, value):\n        if key in self: self.move_to_end(key)\n        self[key] = value\n        if len(self) > self.capacity:\n            self.popitem(last=False)\n\n# fail-fast equivalent: never mutate while iterating\nnames = ['a', 'b', 'c']\nnames = [n for n in names if n != 'b']      # rebuild, do not mutate in place\n\n# grouping without a loop\nfrom collections import Counter\ntickets_by_status = Counter(t.status for t in tickets)",
    fu: [
      {
        q: "Why is ArrayList almost always faster than LinkedList?",
        a: "Cache locality. Even where LinkedList has better asymptotics (middle insertion), you pay O(n) to *find* the position and every node is a pointer chase into a different cache line. Benchmarks consistently favour ArrayList except for queue/deque use, where ArrayDeque wins anyway.",
      },
      {
        q: "What breaks if hashCode is inconsistent with equals?",
        a: "Two equal objects land in different buckets, so `map.get(key)` misses and `set.add` inserts duplicates. Mutating a field used in hashCode after insertion causes the same bug and is much harder to find.",
      },
      {
        q: "When would you use parallelStream?",
        a: "Large datasets, CPU-bound work, no shared mutable state, and no blocking IO — and even then, measure. It uses the shared common pool, so a blocking task inside it degrades unrelated parallel work across the JVM.",
      },
    ],
  },
];
