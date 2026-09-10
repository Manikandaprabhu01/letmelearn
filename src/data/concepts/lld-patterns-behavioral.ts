import type { Concept } from "@/data/types";

export const lldBehavioralPatterns: Concept[] = [
  {
    slug: "strategy",
    title: "Strategy Pattern",
    subtitle: "Swap the algorithm, keep the caller.",
    level: "foundational",
    minutes: 11,
    tags: ["patterns", "behavioral"],
    summary:
      "Strategy pulls a family of interchangeable algorithms out from behind a conditional and puts each one in its own class. Payment methods, rate-limit algorithms, compression codecs, pricing rules, load-balancer pickers and matching policies are all the same shape: the caller's job never changes, only the rule it applies.",
    keyPoints: [
      "The trigger is a conditional that branches on a type or mode and grows a case per requirement.",
      "The context holds a strategy and delegates; it must not know which concrete one it has.",
      "Each strategy is independently unit-testable, which is usually the real win.",
      "Selection (which strategy) is a separate concern from execution (what it does) — do not fuse them.",
      "For one-method strategies in a language with first-class functions, a function type is a legitimate strategy.",
    ],
    prerequisites: ["/lld/solid"],
    sections: [
      {
        heading: "The shape",
        lede: "Context, interface, family of implementations.",
        diagram: {
          kind: "uml",
          caption: "Adding leaky-bucket is a new class, not a new branch.",
          boxes: [
            {
              name: "RateLimiter",
              tone: "accent",
              members: [
                { name: "strategy: LimiterStrategy", kind: "field", vis: "-" },
                { name: "handle(req): Response", kind: "method" },
              ],
            },
            {
              name: "LimiterStrategy",
              stereotype: "interface",
              tone: "accent",
              members: [{ name: "allow(key, at): Decision", kind: "method" }],
            },
            {
              name: "TokenBucket",
              members: [
                { name: "capacity: int", kind: "field", vis: "-" },
                { name: "refillPerSec: double", kind: "field", vis: "-" },
                { name: "allow(key, at)", kind: "method" },
              ],
            },
            {
              name: "SlidingWindowLog",
              members: [
                { name: "windowMs: long", kind: "field", vis: "-" },
                { name: "allow(key, at)", kind: "method" },
              ],
            },
            {
              name: "FixedWindowCounter",
              members: [{ name: "allow(key, at)", kind: "method" }],
            },
          ],
          edges: [
            { from: "TokenBucket", to: "LimiterStrategy", kind: "implements" },
            { from: "SlidingWindowLog", to: "LimiterStrategy", kind: "implements" },
            { from: "FixedWindowCounter", to: "LimiterStrategy", kind: "implements" },
            { from: "RateLimiter", to: "LimiterStrategy", kind: "has", label: "injected" },
          ],
        },
        code: {
          title: "The seam every LLD rate limiter should have",
          lang: "ts",
          source: `interface LimiterStrategy {
  allow(key: string, at: number): Decision;   // { ok, remaining, retryAfterMs }
}

class RateLimiter {
  constructor(private strategy: LimiterStrategy) {}

  handle(req: Request): Response {
    const d = this.strategy.allow(req.userId, Date.now());
    return d.ok
      ? next(req)
      : tooMany(d.retryAfterMs, { "X-RateLimit-Remaining": String(d.remaining) });
  }
}

// Swapping the algorithm is a wiring change, not a code change:
new RateLimiter(new TokenBucket({ capacity: 10, refillPerSec: 2 }));
new RateLimiter(new SlidingWindowLog({ windowMs: 60_000, limit: 100 }));`,
        },
      },
      {
        heading: "Selecting a strategy without a new switch",
        lede: "Do not replace a conditional in the context with the same conditional in a factory.",
        body: [
          "Strategy removes the branch from the algorithm's caller. It does not remove the fact that something must choose. The trick is to make selection data-driven and put it in exactly one place, so adding a strategy is a registration, not a code path.",
        ],
        code: [
          {
            title: "Registry — selection is data",
            lang: "ts",
            source: `const LIMITERS: Record<Tier, () => LimiterStrategy> = {
  free:       () => new FixedWindowCounter({ limit: 60,    windowMs: 60_000 }),
  pro:        () => new TokenBucket({ capacity: 1_000, refillPerSec: 50 }),
  enterprise: () => new SlidingWindowLog({ limit: 20_000, windowMs: 60_000 }),
};

function limiterFor(tier: Tier) {
  return LIMITERS[tier] ?? LIMITERS.free;   // one place, one default
}`,
          },
          {
            title: "Functions are strategies too",
            lang: "ts",
            source: `type Fare = (trip: Trip) => Money;

const standard: Fare = (t) => base.plus(perKm.times(t.km));
const surge = (multiplier: number): Fare => (t) => standard(t).times(multiplier);

class Pricing {
  constructor(private fare: Fare) {}
  quote(t: Trip) { return this.fare(t); }
}

// A class earns its place when the strategy needs state, configuration,
// several methods, or a name that shows up in stack traces and metrics.`,
          },
        ],
        callout: {
          kind: "insight",
          text: "If the strategy needs data the context holds, pass it as a method parameter rather than handing the strategy a reference back to the context. A strategy that calls back into its context is no longer independently testable.",
        },
      },
      {
        heading: "Strategy vs its neighbours",
        table: {
          headers: ["Pattern", "Intent", "Tell them apart by"],
          rows: [
            ["Strategy", "Interchangeable algorithms for one step", "Caller picks; all options are peers"],
            ["State", "Behaviour changes as the object's state changes", "The object swaps its own strategy in response to events"],
            ["Template method", "Fixed skeleton, subclass fills steps", "Inheritance; the algorithm's shape is fixed"],
            ["Decorator", "Add behaviour around the same interface", "Wraps and delegates; can stack"],
            ["Command", "Encapsulate an invocation for later", "Carries the arguments; can be queued and undone"],
          ],
        },
        callout: {
          kind: "interview",
          text: "State and Strategy have identical class diagrams. The distinguishing sentence is: 'in Strategy the client chooses; in State the object transitions itself.' Saying that is worth more than drawing either diagram.",
        },
      },
      {
        heading: "Costs and when to skip it",
        bullets: [
          "Two implementations that will never grow is often a plain if. The pattern pays off from the third, or as soon as the branches carry real state.",
          "A strategy interface designed around one implementation's needs will leak: check the second implementation can honour it before you commit.",
          "Hot paths pay for a megamorphic call site; JIT inlining degrades once several implementations are live. Rare, but real in inner loops.",
          "Configuration sprawl: every strategy with its own knobs makes the composition root grow. Give each strategy a typed config object.",
        ],
        takeaways: [
          "Strategy is the answer to 'what if we later want a different algorithm here' — the most common interview follow-up there is.",
          "Keep selection in a registry so adding an option touches one map plus one new file.",
          "Test strategies directly and the context with a stub; that split keeps both test suites tiny.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Where would you put strategy in a rate limiter design?",
            a: "Behind the allow() call, so the algorithm (token bucket, sliding window, fixed window) is swappable per tier or per endpoint. The limiter itself only knows the decision object. That also lets me run a sliding window for a small set of abusive keys and a cheap counter for everyone else, which is a real production pattern.",
          },
          {
            q: "How do you choose a strategy at runtime per request?",
            a: "Look it up from a registry keyed by whatever varies — tier, endpoint, region — and cache the instances if construction is not trivial. I keep the lookup out of the strategies themselves so none of them knows the selection rules, and I always define an explicit default rather than letting an unknown key fall through to null.",
          },
          {
            q: "Do strategies need to be stateless?",
            a: "Not necessarily, but if one holds mutable state and is shared across requests, it becomes a concurrency problem. A token bucket holding counters per key is exactly that: I would either make the state thread-safe (atomic operations, or a striped lock), or externalise it to Redis so multiple app instances share it.",
          },
        ],
      },
    ],
    related: ["/lld/rate-limiter", "/playgrounds/rate-limiter", "/lld/solid", "/lld/command"],
    furtherReading: [
      {
        label: "Rate limiter playground",
        href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html",
      },
    ],
    playground: "rate-limiter",
  },

  {
    slug: "observer",
    title: "Observer Pattern",
    subtitle: "Publish once, notify many, without the subject knowing who.",
    level: "foundational",
    minutes: 12,
    tags: ["patterns", "events", "behavioral"],
    summary:
      "The subject keeps a list of interested parties and pokes them when its state changes. UI listeners, stock tickers, cache invalidation and in-process event buses are all observers. Scale it across processes and it becomes pub/sub — same idea, with the failure modes that a network adds.",
    keyPoints: [
      "Decouples 'something happened' from 'here is everyone who cares'.",
      "Push (send the payload) vs pull (send a signal, observer reads) is the first design choice.",
      "Synchronous notification means an observer's exception or slowness becomes the publisher's problem.",
      "Always hand out an unsubscribe handle — leaked listeners are the classic memory leak.",
      "Re-entrancy: an observer that mutates the subject during notification will corrupt your iteration.",
    ],
    sections: [
      {
        heading: "In-process shape",
        code: {
          title: "Ticker with unsubscribe, snapshot iteration and error isolation",
          lang: "ts",
          source: `type Listener<T> = (event: T) => void;

class Emitter<T> {
  private listeners = new Set<Listener<T>>();

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);   // hand back the unsubscribe
  }

  emit(event: T) {
    // snapshot: an observer may subscribe/unsubscribe while we notify
    for (const fn of [...this.listeners]) {
      try {
        fn(event);
      } catch (err) {
        logger.error({ err }, "observer threw");  // one bad listener must not
      }                                            // break the others
    }
  }
}

const ticker = new Emitter<Tick>();
const off = ticker.subscribe((t) => chart.push(t));
// later, when the component unmounts:
off();`,
        },
        callout: {
          kind: "warn",
          text: "Three bugs live in the naive version: iterating the live collection while a listener unsubscribes, one listener's exception aborting the rest, and no way to unsubscribe at all. The code above fixes all three, and interviewers look for exactly these.",
        },
      },
      {
        heading: "Push or pull",
        diagram: {
          kind: "compare",
          caption: "Two ways to shape the notification.",
          options: [
            {
              title: "Push — send the payload",
              good: [
                "Observer needs no reference back to the subject",
                "Works across a network unchanged",
                "Event is an immutable snapshot; no torn reads",
              ],
              bad: [
                "Subject decides what everyone needs; payloads bloat over time",
                "Large payloads multiply by the number of observers",
              ],
              verdict: "Default, especially anywhere the observer may be remote.",
            },
            {
              title: "Pull — send a signal, observer reads",
              good: [
                "Small notifications; each observer reads only what it uses",
                "Naturally coalesces bursts — read once after N signals",
              ],
              bad: [
                "Observer must hold a reference to the subject (coupling)",
                "State may have changed again by the time it reads",
                "Racy in a concurrent setting without a version or snapshot",
              ],
              verdict: "Big state, cheap local reads — a UI model with an invalidate signal.",
            },
          ],
        },
      },
      {
        heading: "Synchronous or asynchronous",
        lede: "The single most consequential choice, and where production incidents come from.",
        body: [
          "Synchronous notification is simple and ordered: after emit() returns, everyone has seen it. It also means the slowest observer sets your latency, an observer's exception can unwind your transaction, and a re-entrant observer can deadlock you.",
          "Asynchronous notification (queue the event, notify on another thread or process) protects the publisher, but now you owe answers on ordering, retries, duplicates and back-pressure — the same questions a message queue forces.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Async fan-out: the publisher's transaction commits before observers run.",
          actors: [
            { id: "svc", label: "OrderService" },
            { id: "db", label: "Database" },
            { id: "bus", label: "EventBus", sub: "outbox + worker" },
            { id: "mail", label: "EmailObserver" },
            { id: "stats", label: "AnalyticsObserver" },
          ],
          messages: [
            { from: "svc", to: "db", label: "INSERT order + INSERT outbox row (one tx)", kind: "call", note: "event is durable exactly when the order is" },
            { from: "db", to: "svc", label: "COMMIT", kind: "return", tone: "ok" },
            { from: "bus", to: "db", label: "poll outbox", kind: "call" },
            { from: "bus", to: "mail", label: "OrderPlaced", kind: "async" },
            { from: "bus", to: "stats", label: "OrderPlaced", kind: "async", note: "independent retry per observer" },
            { from: "mail", to: "bus", label: "ack", kind: "return" },
          ],
        },
        table: {
          headers: ["", "Synchronous", "Asynchronous"],
          rows: [
            ["Latency", "Publisher waits for every observer", "Publisher returns immediately"],
            ["Failure isolation", "Needs try/catch per observer", "Natural — separate consumers, separate retries"],
            ["Ordering", "Guaranteed, in subscription order", "Only within a partition, if at all"],
            ["Delivery", "Exactly once, in-memory", "At least once — observers must be idempotent"],
            ["Transactions", "Can run inside the publisher's tx", "Needs an outbox to avoid 'committed but never published'"],
            ["Debugging", "One stack trace", "Correlation ids and a trace, or you are guessing"],
          ],
        },
      },
      {
        heading: "Leaks, storms and ordering",
        bullets: [
          "Listener leaks: a long-lived subject holding a reference to a short-lived observer keeps it alive forever. Return an unsubscribe function, tie it to the component lifecycle, and consider weak references where the language offers them.",
          "Notification storms: a bulk update that emits per row will emit a million events. Batch at the source, or coalesce with a dirty flag and one flush per tick.",
          "Cycles: A notifies B, B updates A, A notifies again. Guard with a re-entrancy flag or make updates queue rather than run inline.",
          "Ordering assumptions: observers that depend on running before another observer are not observers — that is a pipeline, and it should be explicit.",
          "Silent failure: if nobody subscribes, the event vanishes. In production, count published and consumed events per type so a broken subscription is visible.",
        ],
        code: {
          title: "Re-entrancy guard and coalescing",
          lang: "ts",
          source: `class Model {
  private dirty = false;
  private notifying = false;

  set(patch: Partial<State>) {
    Object.assign(this.state, patch);
    this.dirty = true;
    queueMicrotask(() => this.flush());   // coalesce a burst into one notify
  }

  private flush() {
    if (!this.dirty || this.notifying) return;
    this.dirty = false;
    this.notifying = true;
    try { this.emitter.emit(this.state); } finally { this.notifying = false; }
  }
}`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How does this scale beyond one process?",
            a: "The subject becomes a topic and observers become consumers — Redis pub/sub for fire-and-forget fan-out, Kafka when I need durability, replay and ordered partitions. The design questions change from 'unsubscribe' to 'consumer group, offset, retry, dead-letter', and observers must be idempotent because delivery is at-least-once.",
          },
          {
            q: "An observer is slow. What breaks and what do you do?",
            a: "Synchronously, it becomes the publisher's latency and can hold a transaction open. I would move that observer off the hot path: publish to a queue and let it consume at its own pace, with its own retry. If it must stay inline, I would put a timeout and a circuit breaker around it so a hung dependency degrades one feature instead of the request.",
          },
          {
            q: "How do you guarantee an event is not lost when the publisher crashes after committing?",
            a: "The transactional outbox: write the event row in the same transaction as the state change, then a relay publishes it and marks it sent. That converts 'two systems must both succeed' into one local transaction plus at-least-once delivery, which consumers handle with idempotency keys.",
          },
          {
            q: "Observer vs a plain callback?",
            a: "A callback is one-to-one and usually part of the call's contract. Observer is one-to-many with dynamic registration, and the publisher does not know or care who is listening. If there will only ever be one interested party and it is known at construction, a callback or an injected collaborator is simpler and I would not reach for the pattern.",
          },
        ],
      },
    ],
    related: ["/hld/message-queues", "/hld/pub-sub", "/lld/command", "/lld/concurrency"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "command",
    title: "Command Pattern",
    subtitle: "Turn an invocation into an object you can queue, retry, log and undo.",
    level: "intermediate",
    minutes: 12,
    tags: ["patterns", "behavioral", "undo"],
    summary:
      "A command packages a request — the operation plus its arguments plus the receiver — into an object. Once a call is a value, you can put it in a queue, persist it, replay it, batch it, schedule it, and undo it. Editors, job systems, transactional outboxes and CQRS write sides all run on this.",
    keyPoints: [
      "Command = receiver + parameters + execute(). Undo is optional but is the reason most people reach for it.",
      "The invoker (button, scheduler, queue consumer) knows nothing about what the command does.",
      "Undo needs either the inverse operation or the captured prior state — decide which, and know the memory cost.",
      "A persisted command log gives you replay, audit and crash recovery for free.",
      "Do not put business rules in the invoker; the command owns them.",
    ],
    sections: [
      {
        heading: "Structure",
        diagram: {
          kind: "uml",
          caption: "Invoker holds commands; commands hold receivers.",
          boxes: [
            {
              name: "Command",
              stereotype: "interface",
              tone: "accent",
              members: [
                { name: "execute(): void", kind: "method" },
                { name: "undo(): void", kind: "method", note: "optional" },
              ],
            },
            {
              name: "InsertText",
              members: [
                { name: "at: int, text: string", kind: "field", vis: "-" },
                { name: "execute() / undo()", kind: "method", note: "undo deletes what it inserted" },
              ],
            },
            {
              name: "DeleteRange",
              members: [
                { name: "removed: string", kind: "field", vis: "-", note: "captured for undo" },
                { name: "execute() / undo()", kind: "method" },
              ],
            },
            {
              name: "CommandHistory",
              tone: "accent",
              members: [
                { name: "done: Stack<Command>", kind: "field", vis: "-" },
                { name: "undone: Stack<Command>", kind: "field", vis: "-" },
                { name: "run(c) / undo() / redo()", kind: "method" },
              ],
            },
            {
              name: "Document",
              stereotype: "class",
              members: [{ name: "insert / delete", kind: "method", note: "the receiver" }],
            },
          ],
          edges: [
            { from: "InsertText", to: "Command", kind: "implements" },
            { from: "DeleteRange", to: "Command", kind: "implements" },
            { from: "CommandHistory", to: "Command", kind: "has", label: "two stacks" },
            { from: "InsertText", to: "Document", kind: "uses", label: "receiver" },
          ],
        },
        code: {
          title: "Undo/redo in ~30 lines",
          lang: "ts",
          source: `interface Command { execute(): void; undo(): void; }

class InsertText implements Command {
  constructor(private doc: Document, private at: number, private text: string) {}
  execute() { this.doc.insert(this.at, this.text); }
  undo()    { this.doc.delete(this.at, this.text.length); }
}

class DeleteRange implements Command {
  private removed = "";                      // captured at execute time
  constructor(private doc: Document, private at: number, private len: number) {}
  execute() { this.removed = this.doc.slice(this.at, this.at + this.len);
              this.doc.delete(this.at, this.len); }
  undo()    { this.doc.insert(this.at, this.removed); }
}

class CommandHistory {
  private done: Command[] = [];
  private undone: Command[] = [];

  run(c: Command) { c.execute(); this.done.push(c); this.undone.length = 0; }
  undo() { const c = this.done.pop(); if (c) { c.undo(); this.undone.push(c); } }
  redo() { const c = this.undone.pop(); if (c) { c.execute(); this.done.push(c); } }
}`,
        },
        callout: {
          kind: "insight",
          text: "Note the detail in DeleteRange: undo state is captured during execute(), not in the constructor. A command constructed now and executed later must read the world at execution time, or undo restores the wrong thing.",
        },
      },
      {
        heading: "Two ways to undo",
        diagram: {
          kind: "compare",
          caption: "Memento (store the state) versus inverse (compute the opposite).",
          options: [
            {
              title: "Inverse operation",
              sub: "undo computes the opposite",
              good: ["Tiny memory footprint", "Composes well for long histories"],
              bad: [
                "Not every operation has an inverse (a lossy filter, a truncate)",
                "Floating-point and non-deterministic ops do not round-trip exactly",
              ],
              verdict: "Structural edits with exact inverses: insert/delete, move, rename.",
            },
            {
              title: "Memento / snapshot",
              sub: "undo restores captured state",
              good: ["Always works, including for lossy operations", "Simple to reason about and to test"],
              bad: ["Memory grows with document size × history depth", "Snapshotting large state is slow"],
              verdict: "Lossy or complex operations; cap the history, or snapshot only the touched region.",
            },
          ],
        },
        bullets: [
          "Hybrid in practice: inverse for cheap structural edits, snapshot for the occasional destructive one, plus a periodic full snapshot so replay never starts from zero.",
          "Bound the history explicitly (say 200 commands or 50 MB) — unbounded undo stacks are a memory leak with a friendly name.",
          "Coalesce keystrokes: 'typed hello' should be one undo step, not five. Merge adjacent compatible commands within a time window.",
        ],
      },
      {
        heading: "Commands as durable jobs",
        lede: "Once a call is a value, it can outlive the process.",
        body: [
          "This is where the pattern stops being an editor trick. A serialised command is a job: put it in a table or a queue, and a worker executes it later, on another machine, with retries and a dead-letter path. The type name becomes the routing key; the payload becomes the arguments.",
        ],
        code: {
          title: "Serialisable command + handler registry",
          lang: "ts",
          source: `type Job =
  | { type: "SendEmail";  to: string; templateId: string; vars: Json }
  | { type: "ChargeCard"; orderId: string; amountCents: number; idempotencyKey: string }
  | { type: "Reindex";    documentId: string };

const HANDLERS: { [K in Job["type"]]: (job: Extract<Job, { type: K }>) => Promise<void> } = {
  SendEmail:  async (j) => mailer.send(j.to, j.templateId, j.vars),
  ChargeCard: async (j) => payments.charge(j.orderId, j.amountCents, j.idempotencyKey),
  Reindex:    async (j) => search.index(j.documentId),
};

async function work(job: Job, attempt: number) {
  try {
    await HANDLERS[job.type](job as never);
  } catch (err) {
    if (attempt >= 5 || isPermanent(err)) return deadLetter(job, err);
    return requeue(job, backoffMs(attempt));   // 1s, 2s, 4s, 8s + jitter
  }
}`,
        },
        callout: {
          kind: "warn",
          text: "A durable command will be delivered more than once — a worker can die after doing the work and before acking. Every handler needs an idempotency key or a natural dedupe, which is why ChargeCard carries one in its payload.",
        },
      },
      {
        heading: "Related uses worth naming",
        table: {
          headers: ["Use", "What the command becomes", "What it buys"],
          rows: [
            ["Undo/redo", "Two stacks of commands", "Editor semantics with no special-casing per operation"],
            ["Job queue", "A serialised row or message", "Retry, backoff, scheduling, crash recovery"],
            ["Transactional outbox", "A command written in the same tx as the state change", "No lost events when the process dies after commit"],
            ["Macro / composite", "A command containing commands", "Batching and 'undo the whole thing' in one step"],
            ["Event sourcing", "An immutable log of commands' results", "Time travel, audit, rebuilding read models"],
            ["CQRS write side", "A command object validated then applied", "One explicit place for invariants"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How would you implement undo in a collaborative editor?",
            a: "Single-user undo stacks break the moment someone else edits: undoing your insert must not delete their text. The usual answer is to make undo an inverse operation that is transformed against everything that happened since (OT) or expressed as a CRDT operation, and to keep a per-user undo stack rather than a global one. I would say up front that this is the hard part and not hand-wave it.",
          },
          {
            q: "Command vs a plain function or closure?",
            a: "If it just runs now and nothing needs to inspect it, a function is better. The pattern earns its cost when the invocation must be stored, sent over a wire, retried, inspected for logging or audit, or reversed — closures serialise badly, and a typed payload does not.",
          },
          {
            q: "Where do the business rules live?",
            a: "In the command or the receiver, never in the invoker. If a button handler validates the amount, the same rule has to be duplicated in the API and in the job worker. Validate in the command's constructor (rejecting impossible ones outright) and enforce invariants in the receiver aggregate.",
          },
          {
            q: "How do you cap memory on undo history?",
            a: "Bound it by both count and estimated bytes, drop from the bottom, and take a full snapshot before dropping so the oldest reachable state is still correct. For big documents I keep snapshots every N commands and store inverses between them — the same trick as a database checkpoint plus WAL.",
          },
        ],
      },
    ],
    related: ["/lld/observer", "/hld/message-queues", "/hld/idempotency", "/lld/strategy"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },
];
