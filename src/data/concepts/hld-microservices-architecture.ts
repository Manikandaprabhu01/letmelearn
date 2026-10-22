import type { Concept } from "@/data/types";

export const hldMicroservicesArchitecture: Concept[] = [
  {
    slug: "monolith-vs-microservices",
    title: "Monoliths, Modular Monoliths and Microservices",
    subtitle:
      "What microservices buy, what they cost, and how to tell when you actually need them.",
    level: "intermediate",
    minutes: 16,
    tags: ["microservices", "architecture", "monolith", "team topology"],
    summary:
      "Microservices split a system into independently deployable services that each own their data. The main benefit is organisational — teams ship without coordinating — and so are most of the costs: network calls where function calls used to be, data spread across databases, and a much larger operations bill. A modular monolith delivers most of the structure for a fraction of the cost, and is where most systems should start.",
    keyPoints: [
      "Microservices solve a team-scaling problem first and a technical problem second.",
      "Every service boundary turns a function call into a network call that can fail, time out or be slow.",
      "A modular monolith — strict internal modules, one deployment — is the right default for most teams.",
      "Split along business capabilities that change independently, never along technical layers.",
      "A distributed monolith, where services must deploy together, has the costs of both and the benefits of neither.",
    ],
    sections: [
      {
        heading: "Three architectures",
        diagram: {
          kind: "compare",
          caption: "Choose by team size, domain clarity and operational maturity.",
          options: [
            {
              title: "Monolith",
              sub: "One codebase, one deployment, one database",
              good: [
                "Simplest to build, test, debug and deploy",
                "ACID transactions and JOINs across everything",
                "Function calls: fast and never 'partially fail'",
              ],
              bad: [
                "Without discipline, becomes a big ball of mud",
                "Every team shares one release train",
                "Scales as one unit, even if only one part is hot",
              ],
              verdict: "Early products and small teams.",
            },
            {
              title: "Modular monolith",
              sub: "One deployment, hard internal boundaries",
              good: [
                "Clear ownership per module, enforced in CI",
                "Keeps transactions and simple operations",
                "Modules can be extracted later along existing seams",
              ],
              bad: [
                "Still one deployment and one scaling unit",
                "Boundaries need active enforcement",
              ],
              verdict: "The right default for most systems.",
              tone: "ok",
            },
            {
              title: "Microservices",
              sub: "Many deployments, each owning its data",
              good: [
                "Teams deploy independently",
                "Scale and choose technology per service",
                "Failures can be isolated to one capability",
              ],
              bad: [
                "Network failures, latency and eventual consistency everywhere",
                "Distributed tracing, service discovery, per-service pipelines",
                "Cross-service queries and transactions become design problems",
              ],
              verdict: "Many teams, clear domains, strong automation.",
              tone: "accent",
            },
          ],
        },
      },
      {
        heading: "What you actually pay for",
        table: {
          headers: ["Concern", "In a monolith", "With microservices"],
          rows: [
            [
              "A call between components",
              "Function call: nanoseconds, cannot partially fail",
              "Network hop: milliseconds, can time out, fail or succeed twice",
            ],
            ["Transactions", "One ACID transaction", "Sagas with compensating actions"],
            ["Queries across domains", "A JOIN", "API composition or a replicated read model"],
            [
              "Deployment",
              "One pipeline",
              "One pipeline per service, plus API compatibility between them",
            ],
            ["Debugging", "A stack trace", "A distributed trace across many services"],
            [
              "Local development",
              "Run the application",
              "Run several services, or mock their contracts",
            ],
            ["Data consistency", "Immediate", "Often eventual"],
          ],
        },
      },
      {
        heading: "The latency and availability tax",
        math: [
          { label: "An in-process function call", expr: "≈ 100 nanoseconds", result: "negligible" },
          {
            label: "A network hop inside a data centre",
            expr: "≈ 0.5–2 ms plus serialisation",
            result: "roughly 10,000× slower",
            note: "and it can fail",
          },
          {
            label: "Five services in a synchronous chain, each 99.9% available",
            expr: "0.999⁵",
            result: "≈ 99.5%",
            note: "about 3.6 hours of downtime a month instead of about 44 minutes",
          },
        ],
        callout: {
          kind: "insight",
          text: "Availability multiplies along a synchronous chain. That single fact explains why microservices push you towards asynchronous events, caching, timeouts and fallbacks: without them, adding services makes the whole system less available than any one of its parts.",
        },
      },
      {
        heading: "When microservices are worth it",
        bullets: [
          "Several teams keep blocking each other on one release train, and coordination has become the bottleneck.",
          "Parts of the system have very different scaling profiles — video transcoding versus profile pages — so scaling them together wastes money.",
          "Different reliability or compliance boundaries: isolating payment card handling keeps the rest of the system out of audit scope.",
          "Capabilities change at very different rates, and the fast-moving ones are held back by the slow ones.",
        ],
        body: [
          "Signs you are not ready: a single team, a domain you are still discovering, no automated deployments, no centralised logging or tracing. Splitting then freezes today's guesses about boundaries into network contracts that are expensive to change.",
        ],
        callout: {
          kind: "note",
          text: "Conway's law: systems end up mirroring the communication structure of the organisation that builds them. Decide how teams will own capabilities first, then draw service boundaries to match.",
        },
      },
      {
        heading: "The modular monolith",
        code: {
          title: "Hard edges inside one deployable",
          lang: "text",
          source: `shop/                          one deployment, modules with enforced boundaries
├── catalog/    api.py  internal/     owns tables: products, prices
├── ordering/   api.py  internal/     owns tables: orders, order_lines
├── payments/   api.py  internal/     owns tables: payments, refunds
└── shipping/   api.py  internal/     owns tables: shipments

Rules checked in CI (import-linter, ArchUnit, dependency-cruiser):
  - a module may import another module's api.py only -- never its internal/ package
  - a module may query only the tables it owns
  - cross-module side effects go through in-process events`,
        },
        bullets: [
          "If a module already owns its tables and talks through a narrow API, extracting it into a service later is mostly an infrastructure change.",
          "In-process domain events (OrderPlaced) prepare the codebase for asynchronous messaging without paying for a broker yet.",
          "The enforcement is the point. Without automated checks, module boundaries erode within months.",
        ],
      },
      {
        heading: "The distributed monolith",
        callout: {
          kind: "warn",
          text: "The worst outcome is services that cannot be deployed independently: a shared database, shared domain libraries that must be upgraded in lockstep, and long synchronous call chains. You pay the full cost of distribution and keep the coupling of a monolith.",
        },
        bullets: [
          "Symptom: a feature routinely requires coordinated releases of three or more services.",
          "Symptom: services read and write each other's tables.",
          "Symptom: one slow service takes down unrelated user journeys.",
          "Remedy: merge services that always change together, give each remaining service its own data, and replace synchronous chains with events where an immediate answer is not required.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Would you start a new product with microservices?",
            a: "Usually not. Early on the domain is still being discovered, and wrong boundaries are far more expensive to fix across network contracts than inside one codebase. I would build a modular monolith with enforced module boundaries and module-owned data, then extract services when a concrete pressure appears — team contention, a very different scaling profile, or a compliance boundary.",
          },
          {
            q: "How do you know your service boundaries are wrong?",
            a: "Most features need coordinated changes to several services, services are chatty — many synchronous calls to serve one request — or they reach into each other's data. Good boundaries mean most changes land in one service and cross-service interactions are few, coarse and often asynchronous.",
          },
          {
            q: "What is a distributed monolith?",
            a: "A system split into services that are still tightly coupled: shared databases, lockstep deployments, synchronous call chains. It has all the operational cost and failure modes of distribution without independent deployability, which is the main reason to have microservices at all.",
          },
        ],
      },
    ],
    related: [
      "/hld/service-decomposition",
      "/hld/service-communication",
      "/hld/database-per-service",
      "/examples/scale-to-millions",
    ],
    furtherReading: [
      {
        label: "Martin Fowler — MonolithFirst",
        href: "https://martinfowler.com/bliki/MonolithFirst.html",
      },
      { label: "microservices.io — pattern language", href: "https://microservices.io/patterns/" },
    ],
  },

  {
    slug: "service-decomposition",
    title: "Service Decomposition: Bounded Contexts and the Strangler Fig",
    subtitle:
      "Where to draw service boundaries, and how to carve services out of a running monolith.",
    level: "intermediate",
    minutes: 16,
    tags: ["microservices", "ddd", "bounded context", "migration"],
    summary:
      "Good boundaries follow business capabilities and data ownership, so that most changes touch a single service. Domain-driven design's bounded contexts give a vocabulary for finding those boundaries, and the strangler fig pattern gives a safe way to get there: move one capability at a time to a new service while the monolith keeps serving traffic.",
    keyPoints: [
      "Draw boundaries around business capabilities and the data they own, not technical layers.",
      "A bounded context is where a term has one precise meaning — 'order' in checkout is not 'order' in shipping.",
      "High cohesion inside a service, loose coupling between services: most changes should touch one.",
      "Migrate with the strangler fig: route one capability at a time. Avoid big-bang rewrites.",
    ],
    prerequisites: ["/hld/monolith-vs-microservices"],
    sections: [
      {
        heading: "Three ways to split, two of them wrong",
        diagram: {
          kind: "compare",
          caption: "The test: how many services does a typical feature change?",
          options: [
            {
              title: "By technical layer",
              sub: "UI service · logic service · data service",
              good: ["Looks tidy on a diagram"],
              bad: [
                "Every feature changes all three",
                "The data service becomes a shared bottleneck",
              ],
              verdict: "Maximum coupling.",
              tone: "bad",
            },
            {
              title: "By entity",
              sub: "UserService · OrderService · ProductService",
              good: ["Easy to name"],
              bad: [
                "Services become thin CRUD wrappers",
                "Business workflows turn into chatty call chains",
              ],
              verdict: "Anaemic and chatty.",
              tone: "warn",
            },
            {
              title: "By business capability",
              sub: "Checkout · Catalog · Fulfilment · Billing",
              good: [
                "A feature usually lives in one service",
                "Each service owns the data its rules need",
                "Matches how teams and the business think",
              ],
              bad: ["Requires understanding the domain first"],
              verdict: "The goal.",
              tone: "ok",
            },
          ],
        },
      },
      {
        heading: "Bounded contexts",
        body: [
          "The same word means different things in different parts of a business. A bounded context is a boundary inside which one model and one meaning apply. Trying to build a single universal Order model that serves checkout, warehouses and accounting produces a bloated object nobody can change safely.",
        ],
        table: {
          caption: "One word, four models — each context keeps only what it needs.",
          headers: ["Context", "What 'Order' means there", "Owns"],
          rows: [
            [
              "Checkout",
              "A cart being priced: items, promotions, taxes",
              "Prices applied, promotion codes",
            ],
            ["Fulfilment", "Parcels to pick, pack and ship", "Warehouse, carrier, tracking number"],
            [
              "Billing",
              "Invoice lines and payment state",
              "Amounts in minor units, tax records, refunds",
            ],
            ["Support", "A history a customer asks about", "Conversation links, case status"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Contexts share identifiers, not models. Fulfilment knows order_id ord_8812 and the lines to ship; it does not import Checkout's Order class. Each translates what it receives into its own model at the boundary.",
        },
      },
      {
        heading: "Heuristics for finding boundaries",
        numbered: [
          "Map capabilities with domain experts — an event-storming session listing business events ('order placed', 'parcel dispatched') reveals natural clusters.",
          "Group data that changes together and is protected by the same invariants. Things that need one ACID transaction usually belong in one service.",
          "Mine change history: files that are always committed together are telling you where the real module lives.",
          "Align with team ownership. A service two teams must both change is a boundary in the wrong place.",
          "Start coarse. Splitting one service later is much easier than merging two that have diverged.",
        ],
        callout: {
          kind: "warn",
          text: "If two services must always change and deploy together, they are one service with a network in the middle.",
        },
      },
      {
        heading: "The strangler fig migration",
        diagram: {
          kind: "system",
          caption: "The new service grows around the monolith until the old code can be removed.",
          columns: [
            {
              title: "Edge",
              nodes: [
                { id: "clients", label: "Clients" },
                { id: "router", label: "Routing layer", sub: "gateway or proxy", tone: "accent" },
              ],
            },
            {
              title: "Legacy (shrinking)",
              nodes: [
                { id: "mono", label: "Monolith", sub: "catalog, payments, users" },
                { id: "monodb", label: "Monolith database" },
              ],
            },
            {
              title: "New (growing)",
              nodes: [
                { id: "orders", label: "Orders service", sub: "/orders/* routed here", tone: "ok" },
                { id: "ordersdb", label: "Orders database" },
              ],
            },
            {
              title: "Transition",
              nodes: [
                {
                  id: "cdc",
                  label: "Change data capture",
                  sub: "keeps data in sync during cut-over",
                },
                { id: "acl", label: "Anti-corruption layer", sub: "translates legacy shapes" },
              ],
            },
          ],
        },
        steps: [
          {
            title: "Put a routing layer in front",
            text: "All traffic passes through a gateway or proxy that can send each route to either implementation.",
          },
          {
            title: "Build one capability as a service",
            text: "Pick a capability with clear boundaries and real value, not the easiest trivial one.",
          },
          {
            title: "Synchronise data during the transition",
            text: "Change data capture or events keep the new store in step while both systems run.",
            detail:
              "Decide explicitly which side is the source of truth at each stage, or you will end up with two databases that disagree.",
          },
          {
            title: "Shift traffic gradually",
            text: "Shadow-read to compare results, then canary a percentage of real traffic, watching errors and latency.",
          },
          {
            title: "Delete the old code",
            text: "Remove the monolith's implementation and tables once the new service fully owns the capability. Then repeat.",
          },
        ],
      },
      {
        heading: "The anti-corruption layer",
        code: {
          title: "Keep the legacy model's quirks out of the new service",
          lang: "python",
          source: `from decimal import Decimal

class LegacyOrderTranslator:
    """The only place that knows the monolith's column names and codes."""

    STATUS = {"N": "placed", "P": "paid", "S": "shipped", "X": "cancelled"}

    def to_domain(self, row: dict) -> Order:
        return Order(
            id=f"ord_{row['ORDER_NO']}",
            status=self.STATUS[row["STAT_CD"]],
            total_paise=int(Decimal(row["AMT"]) * 100),   # legacy stored rupees as a decimal string
            customer_id=row["CUST_REF"].strip(),          # and padded ids with spaces
        )`,
        },
        bullets: [
          "Without this layer, legacy naming and codes leak into the new service and the migration recreates the old model under a new name.",
          "When the monolith is finally gone, the translator is deleted in one place.",
        ],
        links: [{ label: "Site: adapter pattern", href: "/lld/adapter" }],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you decide service boundaries?",
            a: "From business capabilities and data ownership. I look for clusters of behaviour that change together and share invariants, check that each cluster can own its data, align them with team ownership, and verify with the question 'does a typical feature touch one service?'. I start coarse, because splitting later is cheaper than merging.",
          },
          {
            q: "How would you migrate a monolith to services?",
            a: "Incrementally with the strangler fig: a routing layer in front, one capability rebuilt as a service with its own data, synchronisation during the transition, shadow reads and a canary to validate, then deleting the old code before starting the next capability. Each step is independently reversible.",
          },
          {
            q: "Why not rewrite the whole thing from scratch?",
            a: "Because the monolith encodes years of edge cases nobody documented, the business cannot pause while you rewrite, and a big-bang cut-over concentrates all the risk into one day. An incremental migration delivers value continuously and lets you learn about boundaries while the stakes are small.",
          },
        ],
      },
    ],
    related: [
      "/hld/monolith-vs-microservices",
      "/hld/database-per-service",
      "/hld/api-gateway",
      "/lld/adapter",
    ],
    furtherReading: [
      {
        label: "Martin Fowler — StranglerFigApplication",
        href: "https://martinfowler.com/bliki/StranglerFigApplication.html",
      },
      {
        label: "Martin Fowler — BoundedContext",
        href: "https://martinfowler.com/bliki/BoundedContext.html",
      },
    ],
  },

  {
    slug: "service-communication",
    title: "Inter-Service Communication: Sync, Async and Choreography",
    subtitle:
      "Request/response or events, orchestration or choreography — and the coupling each one creates.",
    level: "intermediate",
    minutes: 18,
    tags: ["microservices", "grpc", "events", "coupling", "deadlines"],
    summary:
      "How services talk decides how failures spread. Synchronous calls are simple and immediate, but they couple availability: if the service you call is down, so are you. Asynchronous events decouple time and availability, at the cost of eventual consistency and harder debugging. Real systems use both — synchronous calls for questions that need an answer now, events for facts other services react to.",
    keyPoints: [
      "Synchronous calls couple availability and latency; asynchronous events decouple them.",
      "Use sync for queries and commands needing an immediate answer; events for 'this happened' facts.",
      "Propagate a deadline through a call chain instead of setting a fixed timeout at every hop.",
      "Orchestration centralises a workflow's logic; choreography spreads it across event handlers.",
      "Avoid long synchronous chains — every hop multiplies failure probability and adds latency.",
    ],
    prerequisites: ["/hld/monolith-vs-microservices", "/hld/message-queues"],
    sections: [
      {
        heading: "Synchronous or asynchronous",
        diagram: {
          kind: "compare",
          caption: "Not a technology choice — a coupling choice.",
          options: [
            {
              title: "Synchronous",
              sub: "REST or gRPC request/response",
              good: [
                "Simple mental model and immediate result",
                "Errors return straight to the caller",
                "Easy to trace one request",
              ],
              bad: [
                "Caller is only as available as the callee",
                "Latency adds up along the chain",
                "Retries under load can amplify outages",
              ],
              verdict: "Queries and commands that need an answer now.",
            },
            {
              title: "Asynchronous",
              sub: "Events or commands through a broker",
              good: [
                "Producer keeps working while consumers are down",
                "Natural fan-out to many consumers",
                "Absorbs bursts in the queue",
              ],
              bad: [
                "Eventual consistency",
                "Duplicates and out-of-order delivery to handle",
                "Flows are harder to follow and debug",
              ],
              verdict: "Facts other services react to, and slow work.",
              tone: "ok",
            },
          ],
        },
      },
      {
        heading: "Temporal coupling, illustrated",
        diagram: [
          {
            kind: "sequence",
            caption: "Fully synchronous: an email outage fails checkout.",
            actors: [
              { id: "co", label: "Checkout" },
              { id: "inv", label: "Inventory" },
              { id: "pay", label: "Payments" },
              { id: "mail", label: "Email" },
            ],
            messages: [
              { from: "co", to: "inv", label: "reserve items", kind: "call" },
              { from: "inv", to: "co", label: "reserved", kind: "return" },
              { from: "co", to: "pay", label: "charge ₹5,000", kind: "call" },
              { from: "pay", to: "co", label: "charged", kind: "return" },
              { from: "co", to: "mail", label: "send confirmation", kind: "call" },
              {
                from: "mail",
                to: "co",
                label: "503 — email provider down",
                kind: "return",
                tone: "bad",
              },
              {
                from: "co",
                to: "co",
                label: "checkout fails after the card was charged",
                kind: "self",
                tone: "bad",
              },
            ],
          },
          {
            kind: "sequence",
            caption: "Event for the non-critical step: checkout succeeds, email catches up.",
            actors: [
              { id: "co", label: "Checkout" },
              { id: "bus", label: "Event bus" },
              { id: "mail", label: "Email" },
            ],
            messages: [
              { from: "co", to: "co", label: "reserve + charge (sync, required)", kind: "self" },
              { from: "co", to: "bus", label: "publish OrderPlaced", kind: "async", tone: "ok" },
              {
                from: "bus",
                to: "mail",
                label: "deliver when Email recovers",
                kind: "async",
                note: "retries from the queue",
              },
            ],
          },
        ],
      },
      {
        heading: "Choosing per interaction",
        table: {
          headers: ["Interaction", "Style", "Why"],
          rows: [
            [
              "Show a product's price on a page",
              "Sync query (often cached)",
              "The page cannot render without it",
            ],
            ["Reserve stock during checkout", "Sync command", "Checkout must know before charging"],
            [
              "Charge a card",
              "Sync with an idempotency key",
              "The user waits for success or failure",
            ],
            ["Send an order confirmation", "Async event", "Can be delayed; must not fail checkout"],
            [
              "Update the search index when a product changes",
              "Async event",
              "Seconds of lag are acceptable",
            ],
            ["Recalculate recommendations", "Async batch", "Heavy work, no user waiting"],
          ],
        },
      },
      {
        heading: "Deadlines, timeouts and retry storms",
        code: {
          title: "Budget the whole request, then give each hop what is left",
          lang: "ts",
          source: `async function checkout(req: CheckoutRequest) {
  const deadline = Date.now() + 1500;          // the user waits at most 1.5 s in total

  const cart = await cartSvc.get(req.userId, { deadline });
  await inventorySvc.reserve(cart.items, { deadline, idempotencyKey: req.id });

  // Not enough time left to charge safely? Stop before the irreversible step.
  if (deadline - Date.now() < 300) throw new DeadlineExceeded("checkout");

  const payment = await paymentSvc.charge(cart.totalPaise, { deadline, idempotencyKey: req.id });

  events.publish("OrderPlaced", { orderId: payment.orderId, userId: req.userId });   // async side effects
  return { orderId: payment.orderId };
}`,
        },
        math: [
          {
            label: "Fixed 1 s timeout at each of 4 hops",
            expr: "1 s × 4",
            result: "up to 4 s",
            note: "the user gave up long before",
          },
          {
            label: "Retries at 3 layers, 3 attempts each",
            expr: "3 × 3 × 3",
            result: "27 calls",
            note: "to the bottom service per original request, during the very outage causing the failures",
          },
        ],
        bullets: [
          "Pass the deadline (gRPC does this natively) so every downstream call knows the real time remaining and stops work nobody is waiting for.",
          "Retry at one layer only — usually the one closest to the user — and use retry budgets and circuit breakers so retries cannot multiply load during an outage.",
          "Idempotency keys make retried commands safe: a charge retried after a timeout must not charge twice.",
        ],
        links: [
          { label: "Site: circuit breakers, timeouts and retries", href: "/hld/circuit-breaker" },
          { label: "Site: idempotency", href: "/hld/idempotency" },
        ],
      },
      {
        heading: "Orchestration or choreography",
        diagram: {
          kind: "compare",
          caption: "Who knows the shape of the workflow?",
          options: [
            {
              title: "Orchestration",
              sub: "A coordinator tells each service what to do",
              good: [
                "The whole workflow is visible in one place",
                "Easy to add timeouts, retries and compensation",
                "Straightforward to monitor progress",
              ],
              bad: ["The orchestrator can accumulate business logic", "One more component to run"],
              verdict: "Business-critical, multi-step workflows.",
              tone: "ok",
            },
            {
              title: "Choreography",
              sub: "Services react to each other's events",
              good: ["Very loose coupling", "Adding a new reaction needs no change elsewhere"],
              bad: [
                "The overall flow exists only implicitly",
                "Cyclic event chains are easy to create",
                "Hard to answer 'where is order 8812 stuck?'",
              ],
              verdict: "Simple fan-out reactions of two or three steps.",
            },
          ],
        },
        links: [{ label: "Site: the saga pattern", href: "/hld/saga-pattern" }],
      },
      {
        heading: "Protocols and formats",
        table: {
          headers: ["Option", "Best for", "Watch out for"],
          rows: [
            [
              "REST + JSON",
              "Public and browser-facing APIs",
              "Loose contracts unless you publish a schema",
            ],
            [
              "gRPC + Protobuf",
              "Internal service-to-service calls",
              "Needs L7 load balancing on long-lived HTTP/2 connections",
            ],
            [
              "Events with a schema registry",
              "Asynchronous contracts between teams",
              "Schema evolution rules must be enforced",
            ],
          ],
        },
        links: [{ label: "Site: REST, GraphQL and gRPC", href: "/hld/rest-vs-graphql" }],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "When would you choose asynchronous over synchronous communication?",
            a: "When the caller does not need the result to continue: notifications, search indexing, analytics, anything that can lag by seconds. Also when the work is slow or bursty and a queue should absorb it. If the user is waiting for the outcome — reserving stock, charging a card — I use a synchronous call with a deadline and an idempotency key.",
          },
          {
            q: "How do you prevent retry storms?",
            a: "Retry at a single layer, with exponential backoff and jitter, bounded by a retry budget — say retries may add at most ten percent extra load. Circuit breakers stop calling a dependency that is clearly failing, and deadline propagation stops downstream work once the caller has given up.",
          },
          {
            q: "Choreography or orchestration for order processing?",
            a: "Orchestration for the core flow — reserve, charge, confirm, with compensations — because it is business-critical and someone must be able to see where each order is and why it stalled. Choreography for the reactions around it, like sending emails or updating loyalty points, which are independent and benefit from loose coupling.",
          },
        ],
      },
    ],
    related: [
      "/hld/rest-vs-graphql",
      "/hld/message-queues",
      "/hld/saga-pattern",
      "/hld/circuit-breaker",
    ],
    furtherReading: [
      {
        label: "microservices.io — asynchronous messaging",
        href: "https://microservices.io/patterns/communication-style/messaging.html",
      },
      { label: "gRPC — deadlines", href: "https://grpc.io/docs/guides/deadlines/" },
    ],
  },

  {
    slug: "service-discovery",
    title: "Service Discovery and Client-Side Load Balancing",
    subtitle: "How services find each other when instances come and go every few minutes.",
    level: "intermediate",
    minutes: 14,
    tags: ["microservices", "service discovery", "kubernetes", "dns", "health checks"],
    summary:
      "In a microservices deployment, instances are created and destroyed constantly — autoscaling, deployments, crashes — so hard-coded addresses cannot work. Service discovery maintains a live registry of healthy instances. It is either server-side, where callers use a stable name and a load balancer picks an instance, or client-side, where callers look up instances and choose themselves. On Kubernetes, most of it is built in.",
    keyPoints: [
      "A registry maps a service name to its currently healthy instances.",
      "Server-side discovery hides instances behind a stable address; client-side lets callers choose.",
      "Health checks drive the registry: liveness restarts a process, readiness removes it from rotation.",
      "On Kubernetes, a Service name resolved through cluster DNS gives discovery for free.",
      "Stale caches send traffic to instances that no longer exist — keep TTLs short and retry elsewhere.",
    ],
    prerequisites: ["/hld/load-balancing"],
    sections: [
      {
        heading: "The problem",
        diagram: {
          kind: "flow",
          caption: "Which address should Orders call right now?",
          rows: [
            [
              { id: "orders", label: "Orders service", sub: "needs Inventory" },
              { id: "q", label: "?", tone: "warn" },
            ],
            [
              { id: "i1", label: "inventory-7f9c", sub: "10.0.3.14 · ready", tone: "ok" },
              { id: "i2", label: "inventory-2b1d", sub: "10.0.7.2 · starting" },
              { id: "i3", label: "inventory-9aa0", sub: "10.0.9.30 · terminated", tone: "bad" },
            ],
          ],
        },
        body: [
          "Addresses change on every deployment and every autoscaling event. The caller needs an up-to-date answer to 'which instances of Inventory can take a request right now?' — and a way to stop sending traffic to instances that are starting, draining or gone.",
        ],
      },
      {
        heading: "Server-side or client-side discovery",
        diagram: {
          kind: "compare",
          caption: "Where does the choice of instance happen?",
          options: [
            {
              title: "Server-side",
              sub: "Caller → stable name → load balancer → instance",
              good: [
                "Callers stay simple and language-agnostic",
                "One place to change routing policy",
                "The default on Kubernetes and cloud load balancers",
              ],
              bad: ["An extra hop", "Balancing is per connection unless the balancer is layer 7"],
              verdict: "The default.",
              tone: "ok",
            },
            {
              title: "Client-side",
              sub: "Caller queries the registry and picks an instance",
              good: [
                "No extra hop",
                "Smarter per-request balancing, such as least outstanding requests",
                "Can route around slow instances",
              ],
              bad: [
                "Discovery logic in every client and language",
                "Clients must refresh and cache correctly",
              ],
              verdict: "High-throughput internal RPC, or via a service mesh sidecar.",
            },
          ],
        },
      },
      {
        heading: "Registration and health",
        diagram: {
          kind: "sequence",
          caption: "An instance joins, serves, fails, and leaves rotation.",
          actors: [
            { id: "inst", label: "New instance" },
            { id: "reg", label: "Registry / endpoints" },
            { id: "caller", label: "Caller" },
          ],
          messages: [
            { from: "inst", to: "inst", label: "start, warm caches", kind: "self" },
            { from: "inst", to: "reg", label: "readiness probe passes", kind: "call", tone: "ok" },
            { from: "caller", to: "reg", label: "resolve inventory", kind: "call" },
            { from: "reg", to: "caller", label: "includes the new instance", kind: "return" },
            { from: "inst", to: "reg", label: "readiness fails twice", kind: "call", tone: "bad" },
            { from: "reg", to: "reg", label: "remove from endpoints", kind: "self" },
            { from: "caller", to: "reg", label: "resolve inventory", kind: "call" },
            { from: "reg", to: "caller", label: "healthy instances only", kind: "return" },
          ],
        },
        table: {
          headers: ["Probe", "Question it answers", "On failure"],
          rows: [
            ["Liveness", "Is the process stuck beyond recovery?", "Restart the container"],
            [
              "Readiness",
              "Can it serve traffic right now?",
              "Remove from load balancing — do not restart",
            ],
            ["Startup", "Is it still booting?", "Hold off the other probes until it finishes"],
          ],
        },
        callout: {
          kind: "warn",
          text: "Do not make readiness depend deeply on shared dependencies. If every instance marks itself unready whenever the database blips, the service removes all of its own capacity at once and turns a brief dependency hiccup into a full outage.",
        },
      },
      {
        heading: "Kubernetes: discovery built in",
        code: {
          title: "A Service plus probes",
          lang: "yaml",
          source: `apiVersion: v1
kind: Service
metadata:
  name: inventory
  namespace: shop
spec:
  selector:
    app: inventory          # every READY pod with this label receives traffic
  ports:
    - port: 80
      targetPort: 8080
---
# In the Deployment's container spec:
readinessProbe:
  httpGet: { path: /readyz, port: 8080 }
  periodSeconds: 5
  failureThreshold: 2       # out of rotation after about 10 s of failures
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3       # restarted after about 30 s stuck
# Callers use http://inventory.shop.svc.cluster.local -- or just http://inventory in the same namespace`,
        },
        links: [
          {
            label: "Kubernetes — Service",
            href: "https://kubernetes.io/docs/concepts/services-networking/service/",
          },
          { label: "Site: containers and Kubernetes", href: "/hld/containers-kubernetes" },
        ],
      },
      {
        heading: "Client-side load balancing and the gRPC trap",
        bullets: [
          "Round robin is fine when instances are identical and requests similar. Least outstanding requests, or 'power of two choices' — pick two instances at random and use the less loaded — handles uneven request costs much better.",
          "Outlier detection ejects an instance that returns errors or answers slowly, even while its health check still passes.",
        ],
        callout: {
          kind: "warn",
          text: "gRPC multiplexes many requests over one long-lived HTTP/2 connection. A standard Kubernetes Service balances connections, not requests, so every request from a client can land on the single pod it first connected to while new pods sit idle. Use layer-7 balancing: a headless Service with client-side balancing, or a service mesh.",
        },
        links: [{ label: "Site: service mesh", href: "/hld/service-mesh" }],
      },
      {
        heading: "Failure modes and interview follow-ups",
        table: {
          headers: ["Failure", "Symptom", "Mitigation"],
          rows: [
            [
              "Stale cached endpoints after scale-down",
              "Connection refused to vanished instances",
              "Short TTLs, retry on another instance, connection draining",
            ],
            [
              "Readiness tied to a shared dependency",
              "All instances drop out together",
              "Keep readiness about the instance itself",
            ],
            [
              "Registry unavailable",
              "New lookups fail",
              "Clients keep serving from the last known endpoint list",
            ],
            [
              "Slow but 'healthy' instance",
              "Latency tail grows",
              "Outlier detection, least-requests balancing",
            ],
          ],
        },
        followUps: [
          {
            q: "What is the difference between liveness and readiness?",
            a: "Liveness asks whether the process is stuck and should be restarted. Readiness asks whether it should receive traffic right now — it may be warming up, draining for shutdown, or temporarily overloaded — and failing it only removes the instance from rotation. Confusing the two causes restart loops or traffic to instances that cannot serve.",
          },
          {
            q: "Why can gRPC load balancing break on Kubernetes?",
            a: "Because gRPC reuses a long-lived HTTP/2 connection for many requests, while a ClusterIP Service balances at the connection level. Once connected, a client keeps sending everything to one pod. The fix is request-level balancing: client-side balancing over a headless Service's endpoints, or a mesh proxy that balances per request.",
          },
          {
            q: "What happens if the service registry goes down?",
            a: "Well-designed clients keep using their last known list of endpoints, so existing traffic continues and only topology changes stop propagating. The registry itself should be replicated. The danger is clients that treat 'cannot refresh' as 'no instances' and fail every call.",
          },
        ],
      },
    ],
    related: ["/hld/load-balancing", "/hld/service-mesh", "/hld/containers-kubernetes", "/hld/dns"],
    furtherReading: [
      {
        label: "Kubernetes — liveness, readiness and startup probes",
        href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
      },
      {
        label: "microservices.io — service discovery",
        href: "https://microservices.io/patterns/service-registry.html",
      },
    ],
  },

  {
    slug: "database-per-service",
    title: "Database per Service and Distributed Data",
    subtitle:
      "Why each service owns its data, and how to query and stay consistent across services.",
    level: "advanced",
    minutes: 18,
    tags: ["microservices", "data ownership", "api composition", "consistency"],
    summary:
      "If two services share tables, neither can change its schema alone, and independent deployment is gone. So each service owns its data and exposes it only through its API or its events. The price is that joins, transactions and reports that used to be one SQL query now span services — handled with API composition, replicated read models, sagas and a separate analytics pipeline.",
    keyPoints: [
      "A service's database is private: other services use its API or its events, never its tables.",
      "A shared database couples schemas, deployments and failures — the most common microservices anti-pattern.",
      "Cross-service queries use API composition or a read model built from events.",
      "Cross-service writes use sagas, not distributed two-phase commit.",
      "Analytics reads from a separate pipeline, not from production service databases.",
    ],
    prerequisites: ["/hld/monolith-vs-microservices", "/hld/sql-vs-nosql"],
    sections: [
      {
        heading: "Shared database or database per service",
        diagram: {
          kind: "compare",
          caption: "Data ownership is what makes independent deployment real.",
          options: [
            {
              title: "Shared database",
              sub: "Several services read and write the same tables",
              good: ["JOINs and transactions still work", "Nothing new to learn"],
              bad: [
                "A column rename breaks services owned by other teams",
                "One service's heavy query slows everyone",
                "No clear owner for data correctness",
              ],
              verdict: "A distributed monolith in disguise.",
              tone: "bad",
            },
            {
              title: "Database per service",
              sub: "Each service owns its schema and store",
              good: [
                "Schemas evolve without cross-team coordination",
                "Failure and load isolation",
                "The right store per workload",
              ],
              bad: [
                "Cross-service queries and transactions need patterns",
                "Duplicated, eventually consistent copies of some data",
              ],
              verdict: "The target — with the patterns below.",
              tone: "ok",
            },
          ],
        },
      },
      {
        heading: "What owning data means",
        bullets: [
          "A separate schema or database with its own credentials. Other services physically cannot connect, so the rule survives deadlines and reorganisations.",
          "Data leaves only through the owner's API (for queries and commands) or its published events (for facts).",
          "Each service can use the store that fits its workload — this is polyglot persistence.",
        ],
        table: {
          headers: ["Service", "Store", "Why"],
          rows: [
            ["Orders", "PostgreSQL", "Transactions and strong consistency for money"],
            ["Catalog search", "OpenSearch / Elasticsearch", "Full-text search and facets"],
            ["Sessions and carts", "Redis", "Low latency with expiry"],
            ["Activity feed", "Wide-column store", "Very high write volume by key"],
          ],
        },
      },
      {
        heading: "Querying across services: API composition",
        diagram: {
          kind: "sequence",
          caption: "An order details page assembled from three owners, in parallel.",
          actors: [
            { id: "ui", label: "Client" },
            { id: "bff", label: "BFF / composer" },
            { id: "ord", label: "Orders" },
            { id: "cust", label: "Customers" },
            { id: "ship", label: "Shipping" },
          ],
          messages: [
            { from: "ui", to: "bff", label: "GET /orders/ord_8812", kind: "call" },
            { from: "bff", to: "ord", label: "order + lines", kind: "call" },
            { from: "bff", to: "cust", label: "customer name, tier", kind: "call" },
            { from: "bff", to: "ship", label: "tracking status", kind: "call" },
            { from: "ord", to: "bff", label: "ok", kind: "return" },
            { from: "cust", to: "bff", label: "ok", kind: "return" },
            {
              from: "ship",
              to: "bff",
              label: "timeout",
              kind: "return",
              tone: "warn",
              note: "render the page with 'tracking unavailable'",
            },
            { from: "bff", to: "ui", label: "composed response", kind: "return", tone: "ok" },
          ],
        },
        bullets: [
          "Call owners in parallel and degrade gracefully: a missing optional part should not fail the page.",
          "Watch for an N+1 across the network — fetching 50 customers one call at a time. Owners should offer batch endpoints.",
          "Composition works well for detail pages; for lists with cross-service filtering and sorting, a read model is usually better.",
        ],
      },
      {
        heading: "Querying across services: replicated read models",
        body: [
          "When a service repeatedly needs another service's data — Orders showing a customer's name and tier on every order list — it can keep a local, read-only copy of just those fields, updated from the owner's events. Queries become local again, at the cost of the copy being slightly behind.",
        ],
        code: {
          title: "An idempotent, order-safe projection",
          lang: "python",
          source: `def on_customer_updated(event: dict) -> None:
    # Orders keeps only the customer fields it needs, owned elsewhere, read-only here
    db.execute(
        """
        INSERT INTO customer_snapshot (customer_id, name, tier, version)
        VALUES (%(id)s, %(name)s, %(tier)s, %(version)s)
        ON CONFLICT (customer_id) DO UPDATE
           SET name = EXCLUDED.name,
               tier = EXCLUDED.tier,
               version = EXCLUDED.version
         WHERE customer_snapshot.version < EXCLUDED.version   -- ignore duplicates and stale events
        """,
        event,
    )`,
        },
        bullets: [
          "Events can arrive twice or out of order. A version or timestamp check makes the projection correct regardless.",
          "Copy the minimum. Every replicated field is a field that can be stale, and a privacy obligation when a customer asks to be deleted.",
          "The owner remains the source of truth. Never write to the snapshot from the consuming service.",
        ],
        links: [
          { label: "Site: CQRS and event sourcing", href: "/hld/cqrs-event-sourcing" },
          { label: "Site: transactional outbox", href: "/hld/transactional-outbox" },
        ],
      },
      {
        heading: "Writing across services",
        table: {
          headers: ["Need", "Approach", "Why not the alternative"],
          rows: [
            [
              "Place an order that reserves stock and charges payment",
              "Saga with compensations",
              "Two-phase commit blocks on the slowest participant and couples availability",
            ],
            [
              "Update state and publish an event reliably",
              "Transactional outbox",
              "Writing to the database and the broker separately loses events on crashes",
            ],
            [
              "Keep a copy of another service's data",
              "Consume its events into a projection",
              "Querying its database directly re-creates the shared database",
            ],
          ],
        },
        links: [{ label: "Site: the saga pattern", href: "/hld/saga-pattern" }],
      },
      {
        heading: "Reporting, and migrating off a shared database",
        bullets: [
          "Stream changes from each service (change data capture or events) into a data warehouse. Analysts join there, and production databases stay free of heavy ad-hoc queries.",
          "Treat each service's published events as a contract with the analytics pipeline, just as with other services.",
        ],
        steps: [
          { title: "Map ownership", text: "Assign every table to exactly one owning service." },
          {
            title: "Stop the bleeding",
            text: "Block new cross-service table access with database permissions or automated checks.",
          },
          {
            title: "Replace reads",
            text: "Move other services' reads onto APIs or event-fed projections.",
          },
          { title: "Move writes", text: "Only the owner writes its tables; others send commands." },
          {
            title: "Separate physically",
            text: "Split schemas and credentials, then databases, once nothing else touches them.",
          },
        ],
        followUps: [
          {
            q: "How do you do a JOIN across two services?",
            a: "You do not, at query time. For a single entity I compose: call each owner in parallel and merge in a BFF. For lists that need filtering or sorting across both, the querying service keeps a projection of the fields it needs, updated from the owner's events, and joins locally. Heavy analytical joins happen in a warehouse fed by change data capture.",
          },
          {
            q: "Why not just share a database to keep things simple?",
            a: "Because it quietly removes the main benefit of services. Any schema change needs every consuming team to coordinate, load from one service degrades the others, and nobody clearly owns correctness. A shared database is sometimes a reasonable transitional state, but it should be recognised as a monolith with extra network hops.",
          },
          {
            q: "How do you keep a replicated copy consistent?",
            a: "Accept that it is eventually consistent and make it correct under real delivery: consume events at least once, apply them idempotently, and use a version number so duplicates and out-of-order events cannot overwrite newer data. For events published reliably in the first place, the owner uses a transactional outbox. And I monitor consumer lag so staleness has a known bound.",
          },
        ],
      },
    ],
    related: [
      "/hld/saga-pattern",
      "/hld/transactional-outbox",
      "/hld/cqrs-event-sourcing",
      "/hld/sql-vs-nosql",
    ],
    furtherReading: [
      {
        label: "microservices.io — database per service",
        href: "https://microservices.io/patterns/data/database-per-service.html",
      },
      {
        label: "microservices.io — API composition",
        href: "https://microservices.io/patterns/data/api-composition.html",
      },
    ],
  },
];
