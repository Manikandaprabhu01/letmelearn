import type { Concept } from "@/data/types";

export const javaConcurrentCollections: Concept = {
  slug: "concurrent-collections",
  title: "Concurrent Collections",
  subtitle:
    "Chapter 42 — why synchronized wrappers are not enough, ConcurrentHashMap's atomic operations, copy-on-write, and blocking queues as backpressure",
  level: "advanced",
  minutes: 28,
  tags: [
    "concurrency",
    "concurrenthashmap",
    "blockingqueue",
    "copyonwrite",
    "atomic",
    "backpressure",
  ],
  summary:
    "Wrapping a HashMap in synchronizedMap makes each call atomic and nothing else — every check-then-act sequence is still a race. The java.util.concurrent collections exist because the useful unit of atomicity is the operation you want (put if absent, increment, take when available), not the individual method call.",
  keyPoints: [
    "Thread-safe methods do not make thread-safe sequences: containsKey followed by put is still a race.",
    "ConcurrentHashMap gives you atomic putIfAbsent, computeIfAbsent, compute and merge.",
    "Its size() is an estimate and its iterators are weakly consistent — by design.",
    "CopyOnWriteArrayList is for read-mostly data such as listener lists, never for hot writes.",
    "A bounded BlockingQueue is backpressure: a full queue slows the producer instead of exhausting memory.",
  ],
  prerequisites: ["/java/multithreading", "/java/collections-internals"],
  sections: [
    {
      heading: "Why synchronized wrappers are not enough",
      code: {
        title: "Example — the race that survives synchronization",
        lang: "java",
        source: `Map<String, Session> sessions = Collections.synchronizedMap(new HashMap<>());

// Each call is atomic. The SEQUENCE is not: two threads can both see "absent".
if (!sessions.containsKey(userId)) {        // ← thread A and B both true
    sessions.put(userId, createSession());  // ← one session is silently discarded
}

// Iteration needs EXTERNAL synchronization on the wrapper, or it throws:
synchronized (sessions) {
    for (Session session : sessions.values()) { … }
}

// ConcurrentHashMap makes the whole operation the unit of atomicity:
Map<String, Session> better = new ConcurrentHashMap<>();
Session session = better.computeIfAbsent(userId, id -> createSession());   // exactly one wins

// And it scales: reads are lock-free, writes lock only the bucket they touch (a CAS
// for an empty bin, a synchronized block on the bin's head otherwise), so unrelated
// keys never contend. synchronizedMap serialises every operation on one lock.`,
      },
      table: {
        caption: "The three ways to share a map, and what they give you.",
        headers: ["Choice", "Reads", "Writes", "Iteration"],
        rows: [
          [
            "HashMap + external lock",
            "Blocked by writers",
            "One at a time",
            "Safe while holding the lock",
          ],
          [
            "Collections.synchronizedMap",
            "One at a time",
            "One at a time",
            "Needs manual synchronization",
          ],
          ["ConcurrentHashMap", "Lock-free", "Per-bin locking", "Weakly consistent, never throws"],
        ],
      },
    },
    {
      heading: "ConcurrentHashMap in practice",
      code: {
        title: "Example — counters, caches and the two traps",
        lang: "java",
        source: `ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();

// COUNTING — LongAdder beats AtomicLong under contention: it spreads the count over
// cells and sums on read, so threads rarely touch the same cache line.
hits.computeIfAbsent(endpoint, key -> new LongAdder()).increment();

// Or without a helper type:
ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge(endpoint, 1, Integer::sum);       // atomic read-modify-write

// TRAP 1 — the mapping function runs while the bin is locked. It must be short and
// must not touch the same map, or you deadlock the bin:
cache.computeIfAbsent(key, k -> loadFromDatabase(k));   // ← blocking I/O under the bin lock
// Every other thread hitting that bin waits behind it. For an expensive load, store a
// future instead so only one thread computes and others wait outside the lock:
ConcurrentHashMap<String, CompletableFuture<Price>> prices = new ConcurrentHashMap<>();
CompletableFuture<Price> price = prices.computeIfAbsent(
    sku, key -> CompletableFuture.supplyAsync(() -> priceService.load(key), executor));

// TRAP 2 — size() and isEmpty() are estimates under concurrent updates, and
// "if (map.size() < limit) map.put(...)" is a race whatever you do. For a bounded
// cache use a real cache library with an eviction policy (chapter 29).

// BULK OPERATIONS take a parallelism threshold: below it they run on the caller.
map.forEach(1000, (key, value) -> report(key, value));
Optional<Order> stale = Optional.ofNullable(
    map.search(1000, (key, value) -> value.isStale() ? value : null));

// keySet(dummyValue) turns it into a concurrent Set:
Set<String> activeUsers = ConcurrentHashMap.newKeySet();`,
      },
    },
    {
      heading: "Copy-on-write, and blocking queues as backpressure",
      code: {
        title: "Example — listeners, and a producer/consumer pipeline that cannot OOM",
        lang: "java",
        source: `// COPY-ON-WRITE — every write copies the array; reads never lock and never throw.
// Right for listener lists: registered rarely, iterated constantly.
private final List<PriceListener> listeners = new CopyOnWriteArrayList<>();
void publish(Price price) {
    for (PriceListener listener : listeners) listener.onPrice(price);   // snapshot iteration
}
// Wrong for anything write-heavy: appending n elements is O(n^2) copying.

// BLOCKING QUEUE — the handoff, and the backpressure.
BlockingQueue<Batch> queue = new ArrayBlockingQueue<>(100);      // BOUNDED, on purpose

// Producer: blocks when the queue is full, so it cannot outrun the consumers.
void ingest(Batch batch) throws InterruptedException {
    if (!queue.offer(batch, 2, TimeUnit.SECONDS)) {
        metrics.counter("ingest.rejected").increment();          // shed instead of queueing
        throw new IngestBusyException();
    }
}

// Consumer: blocks while empty, and stops on a poison pill.
void consume() throws InterruptedException {
    while (true) {
        Batch batch = queue.take();                              // waits for work
        if (batch == Batch.POISON) return;
        process(batch);
    }
}

// An UNBOUNDED queue (LinkedBlockingQueue with no capacity, or a thread pool's
// default) turns a slow consumer into an OutOfMemoryError, hidden behind healthy
// looking metrics. Bound it, and decide what happens when it is full.`,
      },
      table: {
        caption: "Picking a concurrent structure.",
        headers: ["Need", "Use", "Note"],
        rows: [
          ["Shared map", "ConcurrentHashMap", "Atomic compute/merge; no nulls"],
          ["Shared set", "ConcurrentHashMap.newKeySet()", "Same engine"],
          ["Sorted shared map", "ConcurrentSkipListMap", "O(log n), NavigableMap operations"],
          ["Listener list", "CopyOnWriteArrayList", "Read-mostly only"],
          ["Work handoff with backpressure", "ArrayBlockingQueue", "Fixed capacity"],
          ["Unbounded fan-in", "LinkedBlockingQueue (with a capacity)", "Always set one"],
          ["Direct handoff, no buffering", "SynchronousQueue", "What a cached thread pool uses"],
          ["Scheduled work", "DelayQueue / PriorityBlockingQueue", "Ordered by time or priority"],
          ["Counter", "LongAdder", "AtomicLong when you need compareAndSet"],
        ],
      },
      links: [{ label: "Lab: bulkheads and timeouts", href: "/playgrounds/bulkhead" }],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Why is Collections.synchronizedMap not enough for a shared cache?",
          a: "It makes individual methods atomic, not sequences. The usual pattern — check whether a key is absent, then put — is still a race, and iteration requires locking the wrapper manually. ConcurrentHashMap provides putIfAbsent and computeIfAbsent so the whole operation is atomic.",
        },
        {
          q: "How does ConcurrentHashMap achieve concurrency without one big lock?",
          a: "Reads are lock-free volatile reads. A write to an empty bin uses a compare-and-set; otherwise it synchronises on that bin's head node, so only operations hitting the same bin contend. Resizing is cooperative — threads that arrive during a resize help transfer bins.",
        },
        {
          q: "Why should the function passed to computeIfAbsent be short?",
          a: "It runs while that bin is locked, so any blocking work inside it stalls every other thread whose key hashes to the same bin, and touching the same map inside it can deadlock. Store a CompletableFuture when the value is expensive to compute.",
        },
        {
          q: "When is CopyOnWriteArrayList the right choice?",
          a: "When reads vastly outnumber writes and the collection is small — listener and configuration lists. Each write copies the whole array, so building one by repeated adds is quadratic.",
        },
        {
          q: "Why prefer a bounded BlockingQueue?",
          a: "It gives you backpressure. When consumers fall behind, the queue fills and producers block or shed load, which keeps memory bounded and surfaces the problem. An unbounded queue absorbs the backlog in the heap until the process dies.",
        },
      ],
      takeaways: [
        "Atomicity belongs to the operation, not the method call.",
        "ConcurrentHashMap for shared state; keep its mapping functions short.",
        "Bound every queue, and decide the full-queue behaviour deliberately.",
      ],
    },
  ],
  related: [
    "/java/multithreading",
    "/java/collections-internals",
    "/java/spring-threads",
    "/hld/bulkheads-load-shedding",
    "/java/advanced-topics",
  ],
  playground: "bulkhead",
  furtherReading: [
    {
      label: "Javadoc — java.util.concurrent",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/package-summary.html",
    },
    {
      label: "Javadoc — ConcurrentHashMap",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html",
    },
  ],
};
