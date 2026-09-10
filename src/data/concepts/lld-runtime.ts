import type { Concept } from "@/data/types";

export const lldRuntime: Concept[] = [
  {
    slug: "logging",
    title: "Design a Logging Framework",
    subtitle: "Levels, appenders, formatters — and the async ring buffer that keeps it off the hot path.",
    level: "intermediate",
    minutes: 15,
    tags: ["machine-coding", "patterns", "observability"],
    summary:
      "A logging framework is a pattern showcase — chain of responsibility for levels, strategy for formatters, observer for appenders, decorator for enrichment — which is exactly why it is asked. The part that separates answers is what happens when the disk is slow: a synchronous logger will take your service down with it.",
    keyPoints: [
      "Level check must be the cheapest possible operation and must happen before the message is built.",
      "Appenders (where it goes) and formatters (how it looks) are independent axes — never fuse them.",
      "Structured events, not strings: log fields, render at the edge.",
      "Asynchronous by default, with a bounded queue and an explicit drop policy.",
      "Context propagation — request id, trace id, user — is what makes logs searchable in production.",
    ],
    sections: [
      {
        heading: "Requirements worth stating",
        bullets: [
          "Levels with runtime-adjustable thresholds, per logger name, so you can turn on debug for one package without restarting.",
          "Multiple destinations at once: console in development, file with rotation, and a network sink in production.",
          "Pluggable formats: human-readable in a terminal, JSON everywhere else.",
          "Thread-safe, and ordered enough that a single request's lines can be reconstructed.",
          "Bounded cost: logging must never block the request thread on IO, and must never grow memory without limit.",
          "Never lose an error-level event silently — if you drop, count the drops and say so.",
        ],
        callout: {
          kind: "warn",
          text: "The failure that takes down real services: a synchronous file appender on a full or slow disk. Every request thread blocks in write(), the pool exhausts, and the service stops serving — because of logging.",
        },
      },
      {
        heading: "The object model",
        diagram: {
          kind: "uml",
          caption: "Four independent axes: level, enrichment, format, destination.",
          boxes: [
            {
              name: "Logger",
              tone: "accent",
              members: [
                { name: "name: string", kind: "field", vis: "-" },
                { name: "level: Level", kind: "field", vis: "-", note: "volatile; changeable at runtime" },
                { name: "info(msg, fields)", kind: "method" },
                { name: "isEnabled(level): boolean", kind: "method", note: "the hot-path check" },
                { name: "with(fields): Logger", kind: "method", note: "child with bound context" },
              ],
            },
            {
              name: "LogEvent",
              stereotype: "record",
              members: [
                { name: "ts, level, logger, message", kind: "field" },
                { name: "fields: Map<string, Json>", kind: "field" },
                { name: "error?: ErrorInfo", kind: "field" },
              ],
            },
            {
              name: "Appender",
              stereotype: "interface",
              tone: "accent",
              members: [
                { name: "append(event)", kind: "method" },
                { name: "flush() / close()", kind: "method" },
              ],
            },
            {
              name: "Formatter",
              stereotype: "interface",
              tone: "accent",
              members: [{ name: "format(event): string | Bytes", kind: "method" }],
            },
            {
              name: "AsyncAppender",
              members: [
                { name: "queue: RingBuffer<LogEvent>", kind: "field", vis: "-" },
                { name: "append(event)", kind: "method", note: "enqueue, never block" },
              ],
            },
            {
              name: "RollingFileAppender",
              members: [
                { name: "rotateAtBytes / keepFiles", kind: "field", vis: "-" },
                { name: "append(event)", kind: "method" },
              ],
            },
          ],
          edges: [
            { from: "Logger", to: "Appender", kind: "uses", label: "fan-out to many" },
            { from: "AsyncAppender", to: "Appender", kind: "implements" },
            { from: "RollingFileAppender", to: "Appender", kind: "implements" },
            { from: "AsyncAppender", to: "RollingFileAppender", kind: "has", label: "decorates: queue in front of the real sink" },
            { from: "RollingFileAppender", to: "Formatter", kind: "uses" },
            { from: "Logger", to: "LogEvent", kind: "uses", label: "creates" },
          ],
        },
        code: {
          title: "The hot path: check the level before you build anything",
          lang: "ts",
          source: `class Logger {
  constructor(
    private name: string,
    private level: Level,
    private appenders: Appender[],
    private context: Fields = {},
  ) {}

  isEnabled(level: Level) { return level >= this.level; }   // one integer compare

  log(level: Level, message: string, fields?: Fields, error?: unknown) {
    if (!this.isEnabled(level)) return;                     // fast exit, no allocation
    const event: LogEvent = {
      ts: Date.now(), level, logger: this.name, message,
      fields: { ...this.context, ...fields },
      error: error ? describeError(error) : undefined,
    };
    for (const a of this.appenders) a.append(event);        // appenders must not throw
  }

  // child logger carrying request-scoped context
  with(fields: Fields) {
    return new Logger(this.name, this.level, this.appenders, { ...this.context, ...fields });
  }
}

// The expensive-argument trap:
log.debug("state: " + JSON.stringify(bigObject));   // serialises even when disabled
log.debug("state", () => ({ state: bigObject }));   // lazy: only runs if enabled`,
        },
        bullets: [
          "The lazy-argument point is the one interviewers probe: string concatenation happens before the call, so a disabled debug line still costs a serialisation. Take fields, or take a thunk.",
          "Logger levels resolve hierarchically by name — 'app.billing.stripe' inherits from 'app.billing' unless set — which is what lets you raise verbosity for one subsystem.",
          "Make level a volatile/atomic field so a runtime change is visible to all threads without a lock.",
        ],
      },
      {
        heading: "Async appender: the part that matters",
        lede: "Producers enqueue; one consumer does the IO.",
        body: [
          "Put a bounded queue between the caller and the sink. The logging call becomes an enqueue — nanoseconds, no IO — and a single background thread drains the queue, batches events, and writes them. Batching is also what makes the write efficient: a hundred lines in one syscall rather than a hundred syscalls.",
          "Bounded is the key word. An unbounded queue turns a slow disk into an out-of-memory crash, which is strictly worse than dropping log lines.",
        ],
        code: {
          title: "Bounded queue with an explicit, level-aware drop policy",
          lang: "ts",
          source: `class AsyncAppender implements Appender {
  private queue: (LogEvent | undefined)[];
  private head = 0; private tail = 0;
  private dropped = 0;

  constructor(private inner: Appender, private capacity = 8192,
              private policy: "drop-newest" | "drop-oldest" | "block" = "drop-newest") {
    this.queue = new Array(capacity);
    this.startConsumer();
  }

  append(event: LogEvent) {
    if (this.size() >= this.capacity) {
      if (event.level >= Level.ERROR && this.policy !== "block") {
        this.evictOldestBelowError();     // never silently lose an error
      } else if (this.policy === "drop-newest") {
        this.dropped++; return;
      } else if (this.policy === "drop-oldest") {
        this.head = (this.head + 1) % this.capacity; this.dropped++;
      } else {
        return this.inner.append(event);  // "block": degrade to synchronous
      }
    }
    this.queue[this.tail] = event;
    this.tail = (this.tail + 1) % this.capacity;
  }

  private async startConsumer() {
    for (;;) {
      const batch = this.drain(256);          // batch the syscall
      if (batch.length) {
        try { for (const e of batch) this.inner.append(e); this.inner.flush(); }
        catch { /* an appender must never throw into the app */ }
      } else {
        await sleep(5);
      }
      if (this.dropped > 0) {                  // make loss visible
        metrics.inc("log.dropped", this.dropped); this.dropped = 0;
      }
    }
  }
}`,
        },
        table: {
          headers: ["Back-pressure policy", "Behaviour when full", "Use when"],
          rows: [
            ["Drop newest", "New events discarded; oldest history preserved", "Default — cheapest, keeps the events leading to the incident"],
            ["Drop oldest", "Ring overwrites; you keep the most recent context", "Debugging a crash, where the last lines matter most"],
            ["Block the caller", "Back-pressure reaches the request", "Audit logs that legally cannot be lost"],
            ["Sample below a level", "Keep all errors, sample info/debug", "High-volume services; the practical hybrid"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Say the drop count is itself a metric. A logger that quietly loses 40% of its lines is worse than one that logs less, because every conclusion drawn from the logs is now wrong and nobody knows it.",
        },
      },
      {
        heading: "Structured events and context propagation",
        code: [
          {
            title: "Log fields, not sentences",
            lang: "ts",
            source: `// Unsearchable: every value is welded into a string.
log.info(\`user \${userId} placed order \${orderId} for $\${total} in \${ms}ms\`);

// Searchable, aggregatable, and cheap to render:
log.info("order placed", { userId, orderId, totalCents: total.minorUnits(), ms });
// -> {"ts":...,"level":"info","msg":"order placed","userId":"u_1","ms":142,
//     "requestId":"req_9f3","traceId":"4bf92f..."}`,
          },
          {
            title: "Request-scoped context without threading a logger through every call",
            lang: "ts",
            source: `// Node: AsyncLocalStorage. JVM: MDC / ThreadLocal. Go: context.Context.
const store = new AsyncLocalStorage<Fields>();

export function withRequestContext<T>(fields: Fields, fn: () => T): T {
  return store.run({ ...store.getStore(), ...fields }, fn);
}

class ContextualLogger extends Logger {
  log(level: Level, msg: string, fields?: Fields, err?: unknown) {
    super.log(level, msg, { ...store.getStore(), ...fields }, err);
  }
}

// middleware sets it once per request
app.use((req, res, next) =>
  withRequestContext({ requestId: req.id, traceId: req.traceId, userId: req.user?.id }, next));`,
          },
        ],
        bullets: [
          "requestId and traceId are what turn a pile of lines into a story. Without them, correlating a failure across three services is manual archaeology.",
          "Redact at the boundary: a field allowlist or a redaction formatter, so tokens, card numbers and emails never reach disk. This is a design requirement, not a code-review nit.",
          "Sample high-volume debug logs by trace id, so a sampled request keeps all of its lines rather than a random scatter.",
          "Rotation belongs to the file appender: rotate by size and by day, keep N files, and compress the old ones — otherwise the disk fills and you are back to the blocking-write failure.",
        ],
      },
      {
        heading: "Patterns on display",
        table: {
          headers: ["Pattern", "Where", "Why it fits"],
          rows: [
            ["Strategy", "Formatter (JSON, text, logfmt)", "Interchangeable rendering with one interface"],
            ["Decorator", "AsyncAppender wrapping FileAppender", "Adds queueing without the sink knowing"],
            ["Observer", "Logger fanning out to appenders", "One event, many independent destinations"],
            ["Chain of responsibility", "Hierarchical logger levels", "Resolution walks up the name hierarchy"],
            ["Builder", "Configuring appenders and rotation", "Many optional settings, validated together"],
            ["Singleton (scoped)", "LoggerFactory", "One registry — constructed once and injected, not a global"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Your log volume is 500k lines/sec. What breaks?",
            a: "Serialisation CPU and the write path, long before the disk fills. I would keep the level check first, move to a binary or pre-encoded format, batch aggressively in the consumer, and sample non-error events by trace id so a sampled request is complete rather than partial. At that volume I would also question whether these should be logs at all — counters and histograms answer 'how often' far more cheaply than a line per event.",
          },
          {
            q: "How do you guarantee ordering?",
            a: "Within one thread the queue preserves order. Across threads it does not, and chasing global ordering is expensive and rarely useful. What matters is ordering within a request, which the request id plus a monotonic sequence number per context gives you. I would say plainly that global ordering by wall-clock timestamp is a fiction across machines anyway, because of clock skew.",
          },
          {
            q: "The disk fills up. What happens?",
            a: "With a synchronous appender, every request thread blocks and the service dies — which is why async with a bounded queue is the default. With async, writes fail, the consumer catches and counts, the queue fills, and we drop by policy while continuing to serve. Rotation with a retention limit is what stops it happening; a disk-space alarm on the log volume is what tells you before it does.",
          },
          {
            q: "How do you test a logging framework?",
            a: "An in-memory appender that captures events makes assertions trivial. For the async path I inject the clock and drive the consumer manually, so I can assert on drop behaviour deterministically — fill the queue, append an error, assert the error survived and an info line was dropped. And a benchmark asserting that a disabled debug call allocates nothing, because that regression is invisible otherwise.",
          },
        ],
      },
    ],
    related: ["/hld/observability", "/lld/decorator", "/lld/strategy", "/lld/concurrency"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "concurrency",
    title: "Concurrency in Low-Level Design",
    subtitle: "Where shared state goes wrong, and the smallest fix that works.",
    level: "advanced",
    minutes: 18,
    tags: ["concurrency", "threads", "correctness"],
    summary:
      "Almost every LLD question ends in a concurrency follow-up: two people booking the last seat, two gates claiming one parking spot, two threads incrementing one counter. The answers are a small toolkit — immutability, atomics, one lock held briefly, or single-threaded ownership — and knowing which is smallest for the problem is the skill being tested.",
    keyPoints: [
      "Shared + mutable + concurrent = the bug. Remove any one of the three and it disappears.",
      "The cheapest fix in order: don't share, make it immutable, use an atomic, take one short lock, hand it to one owner thread.",
      "Read-modify-write is never atomic by default — that includes count++ and check-then-act.",
      "Lock ordering is how you prevent deadlock; a global order over resources is the only rule that scales.",
      "Never hold a lock across IO. Almost every production deadlock traces back to this.",
    ],
    sections: [
      {
        heading: "The three classic failures",
        table: {
          headers: ["Failure", "What it looks like", "Minimal fix"],
          rows: [
            [
              "Lost update",
              "Two threads read 5, both write 6; one increment vanished",
              "Atomic increment, or one lock around read-modify-write",
            ],
            [
              "Check-then-act (TOCTOU)",
              "Both threads see 'seat free' and both book it",
              "Atomic compare-and-set, or a conditional UPDATE with a WHERE clause",
            ],
            [
              "Visibility",
              "One thread's write is never seen by another; a loop spins forever",
              "volatile / atomic / memory barrier — locks provide this too",
            ],
            [
              "Deadlock",
              "Thread A holds X wants Y, thread B holds Y wants X",
              "Global lock ordering, or lock-free with retry",
            ],
            [
              "Iteration during mutation",
              "ConcurrentModificationException, or a corrupted traversal",
              "Snapshot before iterating, or a concurrent collection",
            ],
          ],
        },
        code: {
          title: "Check-then-act, and the two ways out",
          lang: "ts",
          source: `// BROKEN — the gap between check and act is where the second thread wins.
if (seat.status === "FREE") {      // T1 checks... T2 checks...
  seat.status = "BOOKED";          // T1 books...   T2 books.  Two tickets.
  seat.userId = userId;
}

// Fix A — atomic compare-and-set (single process)
const claimed = seat.status.compareAndSet("FREE", "BOOKED");
if (!claimed) throw new SeatTaken();

// Fix B — let the database do it (distributed)
//   UPDATE seats SET status='BOOKED', user_id=$2
//   WHERE id=$1 AND status='FREE';
//   rows_affected === 0  →  someone else got it`,
        },
        callout: {
          kind: "insight",
          text: "Almost every concurrency answer in an LLD round reduces to 'make the check and the act one indivisible operation'. If you can say that sentence and then name the mechanism — CAS, a lock, or a conditional UPDATE — you have answered the question.",
        },
      },
      {
        heading: "The ladder: pick the smallest tool that works",
        steps: [
          {
            title: "Don't share",
            text: "Give each thread its own state and combine at the end. A per-thread counter summed on read has no contention at all. This is why sharding and thread confinement beat clever locking so often.",
            detail: "LongAdder, thread-local accumulators, per-shard caches, actor mailboxes",
          },
          {
            title: "Make it immutable",
            text: "An object that never changes after construction is safe to share by definition. Return new instances instead of mutating; keep mutable state in one small, well-guarded place.",
            detail: "Value objects (Money, Instant), copy-on-write config, persistent data structures",
          },
          {
            title: "Use an atomic",
            text: "For a single variable, a compare-and-set loop or an atomic add is faster than a lock and cannot deadlock. Good for counters, flags, and single-reference swaps.",
            detail: "AtomicLong, AtomicReference.compareAndSet, ConcurrentHashMap.compute",
          },
          {
            title: "Take one lock, briefly",
            text: "When an invariant spans several fields, a lock is the honest tool. Hold it for the shortest possible critical section, and never across IO. If contention is the problem, shard the lock by key rather than making it cleverer.",
            detail: "synchronized / Mutex; stripe by hash(key) % 16 to cut contention",
          },
          {
            title: "Give it one owner",
            text: "Funnel all mutations into a single thread through a queue. The state machine becomes single-threaded and needs no locks at all — this is how elevator controllers, game loops and actor systems work.",
            detail: "Event loop, actor mailbox, single-writer principle",
          },
        ],
        code: {
          title: "Sharded counters: no shared write at all",
          lang: "java",
          source: `// Contended: every thread fights for one cache line.
AtomicLong requests = new AtomicLong();
requests.incrementAndGet();          // ~100ns under contention

// Uncontended: each thread hits its own cell; read sums them.
LongAdder requests = new LongAdder();
requests.increment();                // ~5ns; sum() is O(threads)

// The same idea by hand, and the same idea behind a sharded cache:
//   shard = hash(key) % 16  →  16 independent locks instead of one`,
        },
      },
      {
        heading: "Locking rules that prevent the incidents",
        bullets: [
          "Never hold a lock across IO — a network call, a disk write, a downstream RPC. A 30-second timeout under a lock is a 30-second outage for everyone waiting.",
          "Establish a global lock order (say, always by ascending account id) and take locks in that order everywhere. Two transfers in opposite directions is the textbook deadlock, and ordering is the textbook fix.",
          "Never call unknown code while holding a lock — a callback, a listener, a plugin. It may take another lock, or call back into you.",
          "Prefer tryLock with a timeout at boundaries so a deadlock degrades into a retryable error you can see, rather than a hang you cannot.",
          "Guard the invariant, not the field: if two fields must change together, one lock covers both. Two independent locks over related fields is a race with extra steps.",
          "Document what each lock protects, in a comment next to it. Locks are the one place where the invariant lives only in someone's head.",
        ],
        code: {
          title: "Deadlock, and the ordering that removes it",
          lang: "java",
          source: `// DEADLOCK: transfer(A→B) takes A then B; transfer(B→A) takes B then A.
void transfer(Account from, Account to, Money amount) {
  synchronized (from) {
    synchronized (to) { from.debit(amount); to.credit(amount); }
  }
}

// FIXED: a total order over the resources, so the cycle cannot form.
void transfer(Account from, Account to, Money amount) {
  Account first  = from.id().compareTo(to.id()) < 0 ? from : to;
  Account second = first == from ? to : from;
  synchronized (first) {
    synchronized (second) { from.debit(amount); to.credit(amount); }
  }
}
// Same-account transfer must also be handled — otherwise you deadlock on yourself.`,
        },
      },
      {
        heading: "Optimistic versus pessimistic",
        diagram: {
          kind: "compare",
          caption: "Contention level decides, not taste.",
          options: [
            {
              title: "Pessimistic — lock first",
              sub: "SELECT ... FOR UPDATE, mutex",
              good: [
                "No wasted work; the winner is decided before anything is computed",
                "Simple mental model, predictable behaviour",
              ],
              bad: [
                "Holds resources while you work; blocks readers in some engines",
                "Deadlock risk grows with the number of locks",
                "Terrible across a network — a lock plus a round trip",
              ],
              verdict: "High contention on the same rows: seat booking, inventory of one, a hot counter.",
            },
            {
              title: "Optimistic — detect on write",
              sub: "version column, CAS",
              tone: "ok",
              good: [
                "No locks held during the read or the thinking",
                "Scales beautifully when conflicts are rare",
                "No deadlocks — losers simply retry",
              ],
              bad: [
                "Work is thrown away on conflict",
                "Under high contention, retries can livelock without backoff",
                "Caller must handle the retry; it cannot be hidden entirely",
              ],
              verdict: "Low-to-moderate contention: editing a profile, updating an order, most CRUD.",
            },
          ],
        },
        code: {
          title: "Optimistic concurrency with a version column",
          lang: "sql",
          source: `-- read
SELECT id, quantity, version FROM inventory WHERE sku = $1;

-- write: only succeeds if nobody changed it in between
UPDATE inventory
SET quantity = $2, version = version + 1
WHERE sku = $1 AND version = $3;

-- rows_affected = 0 → conflict. Re-read, recompute, retry with backoff.
-- Bound the retries: 3–5 attempts, then surface a conflict error.`,
        },
      },
      {
        heading: "Async concurrency: same bugs, different clothes",
        body: [
          "Single-threaded runtimes (Node, browsers, Python's asyncio) do not have data races on individual statements, but they absolutely have check-then-act races: any await is a yield point where another task can run and change what you just checked.",
        ],
        code: {
          title: "The interleaving that surprises people on an event loop",
          lang: "ts",
          source: `// BROKEN even in single-threaded JavaScript.
async function reserve(sku: string) {
  const item = await db.get(sku);         // <- yield: another reserve() runs here
  if (item.quantity > 0) {                // both see quantity = 1
    await db.set(sku, { quantity: item.quantity - 1 });   // both write 0
  }                                       // two reservations, one item
}

// Fix 1: make it one atomic operation
await db.decrementIfPositive(sku);        // WHERE quantity > 0

// Fix 2: single-flight per key — serialise work for the same resource
const inflight = new Map<string, Promise<void>>();
function serialize(key: string, fn: () => Promise<void>) {
  const prev = inflight.get(key) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  inflight.set(key, next.finally(() => { if (inflight.get(key) === next) inflight.delete(key); }));
  return next;
}`,
        },
        callout: {
          kind: "interview",
          text: "Saying 'every await is a yield point, so check-then-act across an await is still a race' is a strong signal in any JavaScript, Python or C# interview — most candidates believe single-threaded means safe.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Two users book the last seat. Walk me through it.",
            a: "The read and the write must be one atomic step. In a database that is UPDATE seats SET status='BOOKED' WHERE id=$1 AND status='FREE' — zero rows affected means you lost, and the caller offers another seat. In one process it is a compare-and-set on the seat's status. What I would avoid is reading, deciding in application code, and writing, because that gap is the bug.",
          },
          {
            q: "How do you find a race that only appears in production?",
            a: "Reproduce it under stress: a test that runs N threads hammering the same key and asserts an invariant, run thousands of iterations. Beyond that, thread sanitizers or race detectors where the language has them, and logging the state transitions with a request id so I can see two operations interleaving. I would also look hard at every check-then-act and every lock released before an IO call — that is where they usually are.",
          },
          {
            q: "When is a lock-free approach worth it?",
            a: "When contention is high enough that lock handoff dominates, and the operation is a single-word update — a counter, a stack push, a reference swap. Beyond that, lock-free algorithms are hard to get right and harder to review, and the ABA problem is easy to miss. For most LLD problems I would take the short lock and spend my complexity budget elsewhere.",
          },
          {
            q: "Immutability sounds nice but allocates a lot. Is that acceptable?",
            a: "Usually yes: generational collectors make short-lived objects cheap, and the bugs it removes are expensive. Where it is not — a hot inner loop, a large structure copied per update — I keep the mutable state in one small owner and expose immutable snapshots to everyone else, which is copy-on-write. That gets most of the safety at a fraction of the allocation.",
          },
          {
            q: "How does this change across processes?",
            a: "Every in-process tool disappears: no shared memory, no mutex. What is left is the database's atomicity (conditional updates, transactions, SELECT ... FOR UPDATE), a distributed lock with a lease and a fencing token, or designing the operation to be idempotent so duplicate execution is harmless. I would prefer the last of those wherever possible, because a distributed lock is a consistency claim that a network partition can break.",
          },
        ],
      },
    ],
    related: ["/lld/parking-lot", "/lld/lru-cache", "/hld/consistency", "/hld/idempotency"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
