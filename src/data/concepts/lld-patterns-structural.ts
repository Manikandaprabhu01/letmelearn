import type { Concept } from "@/data/types";

export const lldStructuralPatterns: Concept[] = [
  {
    slug: "decorator",
    title: "Decorator Pattern",
    subtitle: "Add behaviour by wrapping, not by subclassing.",
    level: "foundational",
    minutes: 11,
    tags: ["patterns", "structural", "resilience"],
    summary:
      "A decorator implements the same interface as the thing it wraps and adds behaviour around the delegated call. It is how retry, caching, metrics, logging, rate limiting and authorisation get composed onto a client without any of them knowing about the others — and it is the pattern most visible in real production code.",
    keyPoints: [
      "Same interface in, same interface out. That is what makes decorators stackable in any order.",
      "It replaces the subclass explosion you would get from combining N optional behaviours.",
      "Order matters and is a design decision: retry-outside-cache and cache-outside-retry behave differently.",
      "Keep each decorator single-purpose; a 'RetryAndCacheAndLog' wrapper defeats the point.",
      "Costs: deep stack traces, harder debugging, and the risk that a decorator changes semantics silently.",
    ],
    prerequisites: ["/lld/solid"],
    sections: [
      {
        heading: "Why not subclasses",
        body: [
          "With three optional behaviours you would need seven subclasses to cover every combination, and adding a fourth doubles it. Decorators turn that combinatorial problem into linear composition: N behaviours, N classes, any stacking order.",
        ],
        diagram: {
          kind: "flow",
          caption: "Each layer implements PaymentGateway and delegates inward.",
          rows: [
            [
              { id: "call", label: "Use case", sub: "sees one PaymentGateway", tone: "accent" },
              { id: "m", label: "WithMetrics", sub: "timing, counters" },
              { id: "r", label: "WithRetry", sub: "3 attempts, backoff" },
              { id: "cb", label: "WithCircuitBreaker", sub: "trip on 50% errors", tone: "warn" },
              { id: "s", label: "StripeGateway", sub: "the real call" },
            ],
          ],
        },
        code: {
          title: "Three decorators over one interface",
          lang: "ts",
          source: `interface PaymentGateway {
  charge(card: Card, amount: Money, key: IdempotencyKey): Promise<Receipt>;
}

class WithRetry implements PaymentGateway {
  constructor(private inner: PaymentGateway, private attempts = 3) {}
  async charge(card: Card, amount: Money, key: IdempotencyKey) {
    let lastErr: unknown;
    for (let i = 0; i < this.attempts; i++) {
      try { return await this.inner.charge(card, amount, key); }  // same key: safe to retry
      catch (err) {
        if (!isTransient(err)) throw err;      // never retry a declined card
        lastErr = err;
        await sleep(backoffWithJitter(i));
      }
    }
    throw lastErr;
  }
}

class WithMetrics implements PaymentGateway {
  constructor(private inner: PaymentGateway, private m: Metrics) {}
  async charge(...args: Parameters<PaymentGateway["charge"]>) {
    const stop = this.m.timer("payments.charge");
    try { const r = await this.inner.charge(...args); this.m.inc("payments.ok"); return r; }
    catch (e) { this.m.inc("payments.err", { type: errorClass(e) }); throw e; }
    finally { stop(); }
  }
}

// composition root — read it outside-in
const payments: PaymentGateway =
  new WithMetrics(
    new WithRetry(
      new WithCircuitBreaker(new StripeGateway(key), { threshold: 0.5 }),
    ),
    metrics);`,
        },
      },
      {
        heading: "Order is a design decision",
        lede: "The same three decorators in two orders are two different systems.",
        table: {
          headers: ["Stacking", "Behaviour", "Usually right when"],
          rows: [
            [
              "Retry outside cache",
              "A cache miss that fails is retried, and the retry may hit the cache",
              "The cache is a cheap local optimisation",
            ],
            [
              "Cache outside retry",
              "Cached values are returned without ever entering retry logic",
              "The expensive thing is the call; you want zero calls on a hit",
            ],
            [
              "Circuit breaker inside retry",
              "Retries are counted by the breaker and can trip it faster",
              "You want a failing dependency to open the circuit quickly",
            ],
            [
              "Circuit breaker outside retry",
              "The breaker sees one logical operation, not three attempts",
              "Retries are an implementation detail you do not want to over-count",
            ],
            [
              "Metrics outermost",
              "Timing includes retries and cache hits — true end-to-end latency",
              "Almost always; put a second metrics layer inside if you need both",
            ],
          ],
        },
        callout: {
          kind: "interview",
          text: "Volunteering that order matters, and giving one concrete pair, is a strong senior signal. Most candidates draw the stack and never mention that it is ordered.",
        },
      },
      {
        heading: "The rules that keep it honest",
        bullets: [
          "A decorator must not change the interface's contract. If WithCache can return stale data, staleness has to be part of the contract or callers will be wrong.",
          "It must be transparent to type checks: callers holding the interface must never need instanceof to find the inner object.",
          "One responsibility per decorator. If two behaviours must coordinate (retry counting into the breaker), that coupling belongs in one class, deliberately.",
          "Preserve error types. A decorator that wraps every error in its own class destroys the caller's ability to distinguish transient from permanent.",
          "Keep them cheap. A decorator on a hot inner loop adds an allocation and an indirect call per invocation.",
        ],
        code: {
          title: "Function decorators — the same pattern without classes",
          lang: "ts",
          source: `type Handler = (req: Request) => Promise<Response>;

const withAuth = (h: Handler): Handler => async (req) => {
  const user = await verify(req.headers.authorization);
  if (!user) return unauthorized();
  return h({ ...req, user });
};

const withTiming = (name: string) => (h: Handler): Handler => async (req) => {
  const t0 = performance.now();
  try { return await h(req); }
  finally { metrics.observe(name, performance.now() - t0); }
};

// This is what "middleware" is: decorators over a Handler interface.
const handler = withTiming("orders.create")(withAuth(createOrder));`,
        },
      },
      {
        heading: "Decorator vs proxy vs adapter vs middleware",
        table: {
          headers: ["Pattern", "Interface", "Intent"],
          rows: [
            ["Decorator", "Same as wrapped", "Add behaviour; designed to stack"],
            ["Proxy", "Same as wrapped", "Control access: lazy load, remote call, permission check"],
            ["Adapter", "Different from wrapped", "Make an incompatible interface fit"],
            ["Facade", "New, simpler", "Hide a subsystem behind one entry point"],
            ["Middleware", "Same as wrapped (a handler)", "Decorator applied to a request pipeline"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Retry as a decorator — what has to be true?",
            a: "The operation must be idempotent, or carry an idempotency key so the server can dedupe. Retrying a non-idempotent charge is how you double-bill someone. I also only retry transient failures — timeouts, 5xx, connection resets — never a 400 or a declined card, and I add jitter so a downstream outage does not produce a synchronised retry storm.",
          },
          {
            q: "How do you debug a five-deep decorator stack?",
            a: "Name each layer and put the name in log context and in span names, so a trace shows which layer added the latency. I also keep a way to construct the bare inner object in tests. The honest downside is stack traces get noisy, which is a real cost of the pattern and worth stating.",
          },
          {
            q: "Where does authorization belong — decorator or inside?",
            a: "A coarse check (is this caller authenticated, does it have the scope) works well as a decorator. Fine-grained rules that depend on the object's own state — 'you may cancel your own order, but only before it ships' — belong inside the domain, because the decorator would have to load and understand the aggregate to decide, and then it is not a cross-cutting concern any more.",
          },
        ],
      },
    ],
    related: ["/lld/proxy", "/lld/adapter", "/hld/circuit-breaker", "/lld/dependency-injection"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "adapter",
    title: "Adapter Pattern",
    subtitle: "Make a useful thing fit an interface it was never designed for.",
    level: "foundational",
    minutes: 10,
    tags: ["patterns", "structural", "integration"],
    summary:
      "An adapter translates between the interface your code wants and the interface a library or legacy system offers. It is the pattern that keeps a third-party SDK from spreading through your domain, and it is the single most common way to make a codebase survive a vendor change.",
    keyPoints: [
      "Your code owns the target interface, expressed in your domain's language. The adapter implements it.",
      "Translate the vocabulary too: their PaymentIntentStatus becomes your ChargeResult, their errors become your typed errors.",
      "One adapter per external system, living at the edge — never imported by the domain.",
      "Adapters are where you handle units, time zones, pagination and null-vs-missing mismatches.",
      "The anti-corruption layer is the same idea at subsystem scale.",
    ],
    sections: [
      {
        heading: "The shape",
        diagram: {
          kind: "uml",
          caption: "The domain never sees Stripe types.",
          boxes: [
            {
              name: "PaymentGateway",
              stereotype: "interface",
              tone: "accent",
              members: [
                { name: "charge(card, money, key): Receipt", kind: "method" },
                { name: "refund(receiptId, money): Refund", kind: "method" },
              ],
            },
            {
              name: "StripeAdapter",
              members: [
                { name: "sdk: Stripe", kind: "field", vis: "-" },
                { name: "charge(...)", kind: "method", note: "maps Money → cents, errors → domain errors" },
              ],
            },
            {
              name: "AdyenAdapter",
              members: [{ name: "charge(...)", kind: "method", note: "different SDK, same contract" }],
            },
            {
              name: "Stripe SDK",
              stereotype: "class",
              tone: "warn",
              members: [
                { name: "paymentIntents.create(...)", kind: "method", note: "amount in minor units, throws StripeError" },
              ],
            },
          ],
          edges: [
            { from: "StripeAdapter", to: "PaymentGateway", kind: "implements" },
            { from: "AdyenAdapter", to: "PaymentGateway", kind: "implements" },
            { from: "StripeAdapter", to: "Stripe SDK", kind: "has", label: "the adaptee" },
          ],
        },
        code: {
          title: "What a good adapter actually does",
          lang: "ts",
          source: `export class StripeAdapter implements PaymentGateway {
  constructor(private sdk: Stripe) {}

  async charge(card: Card, amount: Money, key: IdempotencyKey): Promise<Receipt> {
    try {
      const intent = await this.sdk.paymentIntents.create(
        {
          amount: amount.minorUnits(),          // unit translation
          currency: amount.currency.toLowerCase(),
          payment_method: card.token,
          confirm: true,
        },
        { idempotencyKey: key },                // their mechanism, our concept
      );
      return new Receipt({
        id: intent.id,
        capturedAt: new Date(intent.created * 1000),   // seconds → Date
        amount,
      });
    } catch (err) {
      throw toDomainError(err);                 // vocabulary translation
    }
  }
}

function toDomainError(err: unknown): DomainError {
  if (isStripeError(err)) {
    switch (err.code) {
      case "card_declined":       return new CardDeclined(err.decline_code);
      case "rate_limit":          return new TransientFailure(err.message);
      case "idempotency_key_in_use": return new DuplicateRequest();
      default:                    return new PaymentFailed(err.message);
    }
  }
  if (isTimeout(err)) return new TransientFailure("timeout");
  return new PaymentFailed(String(err));
}`,
        },
        callout: {
          kind: "insight",
          text: "The error mapping is the part that pays for the adapter. Without it, a retry decorator upstream cannot tell 'card declined' (never retry) from 'rate limited' (retry with backoff) without importing Stripe's types — and the coupling you were avoiding is back.",
        },
      },
      {
        heading: "Mismatches an adapter absorbs",
        table: {
          headers: ["Mismatch", "Example", "Adapter's job"],
          rows: [
            ["Units", "Money vs integer cents vs float dollars", "Convert once, at the boundary, with tests"],
            ["Time", "Unix seconds, ISO strings, local time", "Normalise to one type in one time zone (UTC)"],
            ["Errors", "Exceptions vs error codes vs null returns", "Map to typed domain errors, preserving transient/permanent"],
            ["Iteration", "Cursor pagination vs page numbers vs streams", "Expose one async iterator; hide the paging"],
            ["Nullability", "Missing vs null vs empty string", "Decide the domain meaning and make it explicit"],
            ["Identity", "Their id format vs yours", "Keep both; store the external id for reconciliation"],
          ],
        },
      },
      {
        heading: "Two-way adapters and the legacy case",
        body: [
          "Sometimes both sides are yours: a new service must speak to a legacy system whose model is wrong for the new domain. The adapter grows into an anti-corruption layer — a module whose whole job is to keep the legacy model from leaking into the new one, translating both requests and responses.",
          "The discipline is the same: the new domain owns its interfaces, and every legacy concept is translated at exactly one place. When the legacy system is finally retired, you delete one directory.",
        ],
        diagram: {
          kind: "layers",
          caption: "Anti-corruption layer: the only place that speaks both dialects.",
          layers: [
            { title: "New domain", items: ["Subscription", "Plan", "BillingCycle", "SubscriptionRepository (port)"] },
            { title: "Anti-corruption layer", items: ["LegacyBillingAdapter", "SUB_REC → Subscription", "status char → enum", "COBOL date → Instant"] },
            { title: "Legacy system", items: ["SOAP endpoint", "SUB_REC fixed-width record", "status: 'A' | 'S' | 'X'"] },
          ],
        },
        code: {
          title: "Object adapter vs class adapter",
          lang: "ts",
          source: `// Object adapter (composition) — the normal choice.
class LegacyBillingAdapter implements SubscriptionGateway {
  constructor(private soap: LegacyClient) {}
  async find(id: SubscriptionId) {
    const rec = await this.soap.getSubRec(id.toString());
    return new Subscription({
      id,
      status: STATUS[rec.STAT] ?? "unknown",       // 'A' -> "active"
      renewsAt: fromCobolDate(rec.NEXT_BILL_DT),
    });
  }
}

// Class adapter (inheritance) — only in languages with multiple inheritance,
// and it welds you to the adaptee's class. Rarely worth it.`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Isn't this just extra code around an SDK?",
            a: "It is extra code, and it buys three things: the domain compiles without the vendor's types, tests run against a fake with no network, and a vendor change is one class instead of a grep across the codebase. If the integration is trivial and genuinely throwaway I would skip it — but for anything a business depends on, like payments or identity, I would not.",
          },
          {
            q: "How do you test an adapter?",
            a: "Two layers. Contract tests against the real sandbox, run on a schedule rather than every commit, to catch the vendor changing behaviour. And unit tests over recorded responses for the mapping logic — especially the error mapping and the odd units. The fake used by the rest of the test suite must pass the same contract test as the real adapter, or it will drift.",
          },
          {
            q: "Where do you draw the line between adapter and decorator?",
            a: "Adapter changes the interface; decorator keeps it. In a real stack they compose: the adapter makes Stripe look like PaymentGateway, and then retry, metrics and circuit-breaker decorators wrap that. If I find an 'adapter' that also retries, I split it — the mapping and the resilience policy change for different reasons.",
          },
        ],
      },
    ],
    related: ["/lld/decorator", "/lld/proxy", "/lld/repository", "/lld/solid"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "proxy",
    title: "Proxy Pattern",
    subtitle: "Same interface, but something happens before the real object does.",
    level: "intermediate",
    minutes: 11,
    tags: ["patterns", "structural", "performance"],
    summary:
      "A proxy stands in for another object with the identical interface and controls access to it: creating it lazily, calling it over a network, checking permissions, or serving a cached answer. Structurally it is a decorator; the difference is intent — a decorator adds behaviour, a proxy governs access.",
    keyPoints: [
      "Four classic kinds: virtual (lazy), remote (network), protection (authorisation), caching.",
      "The caller must not be able to tell. That is what makes lazy loading and remote calls transparent.",
      "Transparency is also the danger: a property access that silently does IO is how N+1 queries happen.",
      "Remote proxies must expose latency and failure somehow — a synchronous signature that can hang for 30s is a lie.",
      "In practice you meet proxies as ORM lazy collections, RPC stubs, service meshes and API gateways.",
    ],
    sections: [
      {
        heading: "Four kinds, one structure",
        table: {
          headers: ["Kind", "Controls", "Real-world example", "The trap"],
          rows: [
            [
              "Virtual",
              "When the expensive object is created",
              "ORM lazy collection; image thumbnail loaded on scroll",
              "Silent IO inside a getter; N+1 queries",
            ],
            [
              "Remote",
              "Where the object lives",
              "gRPC stub, RPC client, service mesh sidecar",
              "Local-looking call with network failure modes",
            ],
            [
              "Protection",
              "Who may call",
              "API gateway auth, row-level security wrapper",
              "Checks scattered instead of centralised; bypass paths",
            ],
            [
              "Caching",
              "Whether the real call happens at all",
              "HTTP cache, memoised repository",
              "Stale reads, unbounded memory, thundering herd on expiry",
            ],
          ],
        },
      },
      {
        heading: "Virtual proxy: laziness that does not lie",
        code: {
          title: "Lazy load with single-flight, so ten callers cause one query",
          lang: "ts",
          source: `class LazyOrderLines implements OrderLines {
  private loaded?: Line[];
  private inflight?: Promise<Line[]>;

  constructor(private orderId: OrderId, private repo: LineRepository) {}

  async all(): Promise<Line[]> {
    if (this.loaded) return this.loaded;
    // single-flight: concurrent callers share one query
    this.inflight ??= this.repo.byOrder(this.orderId).then((rows) => {
      this.loaded = rows;
      this.inflight = undefined;
      return rows;
    });
    return this.inflight;
  }
}`,
        },
        callout: {
          kind: "warn",
          text: "Notice the signature is async. A lazy proxy behind a synchronous getter cannot do IO honestly — it either blocks a thread or returns a promise-shaped surprise. Make laziness visible in the type, and batch loads (a dataloader) when you are fetching for many parents.",
        },
        diagram: {
          kind: "sequence",
          caption: "The N+1 problem a virtual proxy creates, and the batch that fixes it.",
          actors: [
            { id: "v", label: "View" },
            { id: "p", label: "LazyLines", sub: "proxy per order" },
            { id: "dl", label: "DataLoader", sub: "batches per tick" },
            { id: "db", label: "Database" },
          ],
          messages: [
            { from: "v", to: "p", label: "order[1..50].lines.all()", kind: "call", note: "50 proxies, 50 calls" },
            { from: "p", to: "dl", label: "load(orderId) × 50", kind: "call" },
            { from: "dl", to: "db", label: "SELECT * FROM lines WHERE order_id = ANY($1)", kind: "call", tone: "ok", note: "one query, not fifty" },
            { from: "db", to: "dl", label: "rows", kind: "return" },
            { from: "dl", to: "p", label: "resolve each promise", kind: "return" },
          ],
        },
      },
      {
        heading: "Protection proxy: authorisation at the boundary",
        code: {
          title: "Coarse checks belong here; object-level rules do not",
          lang: "ts",
          source: `class AuthorizedDocuments implements DocumentService {
  constructor(private inner: DocumentService, private policy: Policy) {}

  async read(id: DocId, actor: Actor) {
    if (!this.policy.can(actor, "documents:read")) throw new Forbidden();
    const doc = await this.inner.read(id, actor);
    // object-level rule needs the object, so it lives with the object:
    if (!doc.visibleTo(actor)) throw new NotFound();   // NOT Forbidden — do not leak existence
    return doc;
  }
}`,
        },
        bullets: [
          "Return 404, not 403, when revealing that a resource exists is itself a leak.",
          "Centralise the coarse scope check so there is one code path to audit — that is the proxy's value.",
          "If every method needs the loaded object to decide, the check belongs in the domain and the proxy is the wrong place.",
          "Make the proxy impossible to bypass: the composition root should be the only place that can construct the unwrapped service.",
        ],
      },
      {
        heading: "Remote proxy: the local call that is not",
        body: [
          "An RPC stub is a proxy that makes a network call look like a method call. This is enormously convenient and is also the single biggest source of distributed-systems surprise: partial failure, retries, timeouts and serialisation costs all hide behind a signature that looks local.",
        ],
        bullets: [
          "Every remote proxy needs an explicit timeout. A call with no deadline will eventually hold a thread forever.",
          "Failures are not just 'the object threw' — a timeout means you do not know whether it ran. Idempotency keys turn that unknown into a safe retry.",
          "Chattiness is the design flaw laziness invites: ten property reads over a proxy is ten round trips. Design coarse-grained remote interfaces.",
          "Serialisation is part of the contract; adding a field to a returned object is a wire change, not a refactor.",
        ],
        callout: {
          kind: "interview",
          text: "'A remote proxy makes a distributed call look local, which is convenient and dishonest' is a sentence worth saying — it shows you know the fallacies of distributed computing without reciting them.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Proxy or decorator — how do you decide what you have built?",
            a: "By intent. If the wrapper's job is to add a capability the caller wants — metrics, retries, logging — it is a decorator and it stacks. If its job is to stand between the caller and the object and decide whether, when, or where the real call happens, it is a proxy. Structurally they are identical, and I would not spend interview time arguing the label.",
          },
          {
            q: "How do you avoid N+1 with lazy loading?",
            a: "Batch at the boundary with a dataloader that collects keys within a tick and issues one query with an ANY/IN clause, or load eagerly when I know the access pattern. Either way I put a query counter in tests around the hot endpoints, because N+1 is invisible in code review and obvious in a counter.",
          },
          {
            q: "A caching proxy — what do you need to specify?",
            a: "Key (including anything that varies the result, like the actor), TTL, maximum size with an eviction policy, and behaviour on a miss storm — single-flight so one expiry does not send a thousand requests downstream. And I would state whether stale reads are acceptable, because that is a product decision, not an implementation detail.",
          },
        ],
      },
    ],
    related: ["/lld/decorator", "/lld/lru-cache", "/hld/caching", "/hld/api-gateway"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },
];
