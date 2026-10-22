// Imported from the Interview Prep Console (lib/data-concepts-b.js).
import type { ConceptAnswer } from "../types";

export const conceptsB: ConceptAnswer[] = [
  {
    id: "c-gc",
    t: "Java: memory leaks and garbage collection",
    cat: "Java & concurrency",
    r: 1,
    src: ["S5"],
    a: "**Garbage collection.** The JVM heap is generational: new objects go into Eden in the young generation; a minor GC copies survivors between survivor spaces and promotes long-lived ones to the old generation; a major/full GC collects the old generation and is far more expensive. Collectors to name: **G1** (the default since Java 9 — region-based, pause-target driven), **ZGC** and **Shenandoah** (concurrent, sub-millisecond pauses, for large heaps), **Parallel** (throughput-oriented batch work). The reachability rule is what matters: an object is collectable when no GC root (thread stacks, statics, JNI references) can reach it.\n\n**Memory leaks in a managed language** mean unintended retention — objects still reachable but never used again. The classic sources, all of which are worth listing because interviewers look for real experience:\n- A static collection (a Map or List) that is only ever added to — the most common leak by far.\n- Unbounded caches with no eviction or TTL.\n- Listeners and callbacks registered but never removed (including EventBus subscribers).\n- ThreadLocals in a pooled thread environment: the thread never dies, so the value is never released — this is the classic leak in application servers.\n- ClassLoader leaks on hot redeploy (a static reference from the container holds the whole app's classes).\n- Unclosed resources (streams, connections) that pin native memory and buffers.\n- Long-lived collections keyed by objects with a broken equals/hashCode, so entries can never be found or removed.\n\n**Diagnosis**, in order: watch the heap-after-full-GC trend (if it climbs monotonically, it is a leak, not pressure); enable GC logging; take a heap dump (jmap or on OutOfMemoryError with -XX:+HeapDumpOnOutOfMemoryError) and open it in Eclipse MAT; look at the dominator tree and the path to GC roots for the biggest retained set. That is the workflow to describe — 'I would take a heap dump and look at the dominator tree' is the sentence that shows you have actually done it.",
    java: "// leak 1: a static cache that only grows\npublic class SessionRegistry {\n    private static final Map<String, Session> SESSIONS = new HashMap<>();   // never evicted\n    public static void put(String id, Session s) { SESSIONS.put(id, s); }\n}\n// fix: bound it and expire it\nprivate static final Cache<String, Session> SESSIONS = Caffeine.newBuilder()\n        .maximumSize(10_000)\n        .expireAfterAccess(Duration.ofMinutes(30))\n        .build();\n\n// leak 2: ThreadLocal on a pooled thread\nprivate static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();\npublic void handle(Request r) {\n    CTX.set(new UserContext(r));\n    try {\n        process(r);\n    } finally {\n        CTX.remove();        // REQUIRED: the pool thread outlives the request\n    }\n}\n\n// leak 3: listener never unregistered\nbus.register(this);\n// fix: unregister in the lifecycle callback, or hold listeners weakly\n@PreDestroy void close() { bus.unregister(this); }",
    py: "# Python's equivalents: reference cycles with __del__, and unbounded caches\nimport gc, functools, weakref\n\n# unbounded memoisation is the most common 'leak'\n@functools.lru_cache(maxsize=None)      # None = grows forever\ndef expensive(key): ...\n\n# fix: bound it\n@functools.lru_cache(maxsize=10_000)\ndef expensive(key): ...\n\n# observers held weakly so they do not keep subscribers alive\nlisteners = weakref.WeakSet()\n\n# diagnosing: tracemalloc snapshots, objgraph for reference chains\nimport tracemalloc\ntracemalloc.start()\n# ... run workload ...\nsnapshot = tracemalloc.take_snapshot()\nfor stat in snapshot.statistics('lineno')[:10]:\n    print(stat)",
    fu: [
      {
        q: "How do you tell a leak from normal memory pressure?",
        a: "Plot heap usage immediately after each full GC. Pressure oscillates and returns to a stable baseline; a leak shows a rising baseline. Also watch GC frequency and the proportion of time spent in GC — above ~10% something is wrong.",
      },
      {
        q: "What causes long GC pauses and how do you fix them?",
        a: "A large old generation with G1 or Parallel, humongous allocations (objects over half a region), or a heap sized so large that a full GC takes seconds. Fixes: reduce allocation rate and object retention, tune region size or pause targets, or switch to ZGC/Shenandoah for concurrent collection.",
      },
      {
        q: "What is the difference between heap and native memory issues?",
        a: "OutOfMemoryError: Java heap space is heap exhaustion; 'Direct buffer memory' or an RSS that grows while the heap is flat points at native allocations — NIO direct buffers, Netty pools, JNI, or too many threads. Native Memory Tracking (-XX:NativeMemoryTracking) is the tool.",
      },
    ],
  },
  {
    id: "c-locks",
    t: "Multithreading: production deadlocks and Java locking mechanisms",
    cat: "Java & concurrency",
    r: 3,
    src: ["L1", "S4"],
    a: "**The locking toolbox**, roughly in order of preference:\n1. **No shared mutable state** — immutable objects, thread confinement, message passing. The fastest lock is the one you did not take.\n2. **Atomics** (AtomicInteger, AtomicReference, LongAdder) for single-variable updates, using compare-and-set. LongAdder beats AtomicLong under heavy contention because it stripes cells.\n3. **Concurrent collections** — ConcurrentHashMap (lock-striped, with atomic compute/merge operations), CopyOnWriteArrayList for read-dominated lists, BlockingQueue for producer/consumer handoff.\n4. **synchronized** — simple intrinsic monitor, reentrant, released automatically on exception. Fine for short critical sections.\n5. **ReentrantLock** — when you need tryLock with a timeout, interruptibility, fairness, or multiple condition variables.\n6. **ReadWriteLock / StampedLock** — many readers, few writers. StampedLock adds an optimistic read mode that is very fast when writes are rare.\n7. **Semaphore / CountDownLatch / CyclicBarrier / Phaser** for coordination rather than mutual exclusion.\n\n**Deadlock** needs four conditions simultaneously (Coffman): mutual exclusion, hold-and-wait, no preemption, and circular wait. Break any one and deadlock becomes impossible. In practice you break circular wait by imposing a **global lock ordering** — for example, always lock accounts in ascending id order in a transfer — or you break hold-and-wait with tryLock plus timeout and back off.\n\n**Diagnosing a production deadlock**: threads are blocked, CPU is idle, requests time out. Take a thread dump (jstack, jcmd Thread.print, or the JFR/async-profiler equivalent); the JVM prints 'Found one Java-level deadlock' with both threads and the locks they hold and want. For the non-deadlock cousins, know **livelock** (threads keep retrying and make no progress) and **starvation** (a thread never gets the lock — use a fair lock if it matters).\n\nAlso be ready for **database deadlocks**, which application products hit far more often than JVM ones: two transactions update the same rows in opposite order, the database detects the cycle and kills one with a deadlock error. Same fix — consistent ordering of updates, shorter transactions, and retry on the deadlock error code.",
    java: "// the deadlock, and the fix by global ordering\nvoid transferDeadlockProne(Account a, Account b, BigDecimal amount) {\n    synchronized (a) {\n        synchronized (b) {                    // thread 2 calls (b, a) -> cycle\n            a.debit(amount); b.credit(amount);\n        }\n    }\n}\n\nvoid transfer(Account a, Account b, BigDecimal amount) {\n    Account first  = a.getId() < b.getId() ? a : b;   // total order on ids\n    Account second = first == a ? b : a;\n    synchronized (first) {\n        synchronized (second) {\n            a.debit(amount); b.credit(amount);\n        }\n    }\n}\n\n// alternative: break hold-and-wait with tryLock + backoff\nboolean transferWithTimeout(Account a, Account b, BigDecimal amt) throws InterruptedException {\n    while (true) {\n        if (a.lock.tryLock(50, MILLISECONDS)) {\n            try {\n                if (b.lock.tryLock(50, MILLISECONDS)) {\n                    try { a.debit(amt); b.credit(amt); return true; }\n                    finally { b.lock.unlock(); }\n                }\n            } finally { a.lock.unlock(); }\n        }\n        Thread.sleep(ThreadLocalRandom.current().nextInt(10, 50));   // jitter\n    }\n}\n\n// prefer atomics and concurrent collections where possible\nprivate final ConcurrentHashMap<String, LongAdder> counters = new ConcurrentHashMap<>();\nvoid hit(String key) { counters.computeIfAbsent(key, k -> new LongAdder()).increment(); }",
    py: "import threading, time, random\n\n# same deadlock, same fix: order the locks\ndef transfer(a, b, amount):\n    first, second = (a, b) if a.id < b.id else (b, a)\n    with first.lock:\n        with second.lock:\n            a.balance -= amount\n            b.balance += amount\n\n# tryLock equivalent with timeout + jitter\ndef transfer_with_timeout(a, b, amount):\n    while True:\n        if a.lock.acquire(timeout=0.05):\n            try:\n                if b.lock.acquire(timeout=0.05):\n                    try:\n                        a.balance -= amount\n                        b.balance += amount\n                        return True\n                    finally:\n                        b.lock.release()\n            finally:\n                a.lock.release()\n        time.sleep(random.uniform(0.01, 0.05))\n\n# note: the GIL prevents data races on single bytecode ops but NOT on\n# read-modify-write sequences - x += 1 across threads still needs a lock\n# (or use itertools.count / queue.Queue / multiprocessing for CPU-bound work)",
    fu: [
      {
        q: "Tell me about a deadlock you fixed in production.",
        a: "Structure the answer: symptom (requests timing out, CPU idle, thread pool exhausted), diagnosis (thread dump showing the cycle), immediate mitigation (restart/roll back, or raise the pool while investigating), root cause (two code paths locking the same two resources in different orders), permanent fix (lock ordering or a single coarse lock), and the guardrail (a test that runs opposing operations concurrently, plus an alert on thread pool saturation). Both reports that mention this question describe it as a real-experience probe.",
      },
      {
        q: "synchronized vs ReentrantLock — when do you pick which?",
        a: "synchronized for simple, short critical sections: less code, automatic release, and the JIT optimises it well (biased/thin locks). ReentrantLock when you need tryLock, timeouts, interruptibility, fairness or multiple Conditions. Do not reach for ReentrantLock by default.",
      },
      {
        q: "What does volatile actually guarantee?",
        a: "Visibility and ordering, not atomicity. A volatile write happens-before a subsequent volatile read of the same field, so other threads see the latest value and the writes before it; but volatile count++ is still a race because it is read-modify-write. Use an atomic for that.",
      },
      {
        q: "How do you test concurrent code?",
        a: "Deterministic tests with CountDownLatch/CyclicBarrier to force interleavings, stress tests with many threads and assertions on invariants, jcstress for JMM-level guarantees, and a deadlock watchdog in CI that fails if threads do not finish. Also run with -ea and thread sanitizers where available.",
      },
    ],
  },
  {
    id: "c-spring",
    t: "Spring Boot questions they actually ask",
    cat: "Java & concurrency",
    r: 3,
    src: ["L1", "S2"],
    a: "Most Indian product backends are Java-heavy, so bar raisers dip into Spring. The topics that recur:\n\n**Dependency injection and beans.** Constructor injection (not field injection — it makes dependencies explicit and testable), bean scopes (singleton by default, so singleton beans must be stateless or thread-safe), @Configuration versus @Component, and @Conditional/profiles for environment-specific wiring.\n\n**Auto-configuration.** Spring Boot reads `META-INF/spring/...AutoConfiguration.imports`, applies @ConditionalOnClass/@ConditionalOnMissingBean rules, and backs off whenever you define your own bean. 'Why is this bean not what I expect' is answered with `--debug` and the auto-configuration report.\n\n**Transactions.** @Transactional uses an AOP proxy, so it does not apply to self-invocation within the same class or to private methods — a favourite gotcha. Know propagation (REQUIRED vs REQUIRES_NEW), isolation, readOnly for query paths, and that rollback happens on unchecked exceptions by default (rollbackFor for checked ones).\n\n**JPA/Hibernate.** Lazy loading and LazyInitializationException outside a session, the N+1 problem and its fixes (join fetch, @EntityGraph, batch size), the first-level cache, and why you should not expose entities directly as API responses.\n\n**Web layer.** @RestController, @RequestBody validation with @Valid, a @ControllerAdvice for consistent error responses, filters versus interceptors, and thread-per-request behaviour (versus WebFlux's event loop).\n\n**Production concerns.** Actuator endpoints for health, metrics and readiness/liveness probes; graceful shutdown; connection pool sizing; and externalised configuration precedence (command line > env > profile-specific yaml > application.yaml).",
    java: '// constructor injection: no @Autowired needed on a single constructor\n@Service\npublic class TicketService {\n    private final TicketRepository repo;\n    private final ApplicationEventPublisher events;\n\n    public TicketService(TicketRepository repo, ApplicationEventPublisher events) {\n        this.repo = repo; this.events = events;\n    }\n\n    @Transactional                                  // proxy-based: see the gotcha below\n    public Ticket assign(long ticketId, long agentId) {\n        Ticket t = repo.findById(ticketId).orElseThrow(TicketNotFound::new);\n        t.assignTo(agentId);\n        // no explicit save needed: managed entity is flushed on commit\n        events.publishEvent(new TicketAssigned(ticketId, agentId));\n        return t;\n    }\n\n    // GOTCHA: calling this.assign(...) from another method in THIS class\n    // bypasses the proxy, so @Transactional does not apply.\n}\n\n// consistent error handling\n@RestControllerAdvice\nclass ApiExceptionHandler {\n    @ExceptionHandler(TicketNotFound.class)\n    ResponseEntity<ApiError> notFound(TicketNotFound e) {\n        return ResponseEntity.status(404).body(new ApiError("ticket_not_found", e.getMessage()));\n    }\n    @ExceptionHandler(MethodArgumentNotValidException.class)\n    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e) {\n        return ResponseEntity.badRequest().body(ApiError.from(e.getBindingResult()));\n    }\n}\n\n// N+1 fix with an entity graph\npublic interface TicketRepository extends JpaRepository<Ticket, Long> {\n    @EntityGraph(attributePaths = {"assignee", "tags"})\n    List<Ticket> findByStatus(Status status);\n}',
    fu: [
      {
        q: "Why constructor injection over field injection?",
        a: "Dependencies are explicit and final, the object cannot exist half-built, tests can construct it without a container, and circular dependencies fail fast at startup instead of hiding.",
      },
      {
        q: "When does @Transactional silently not work?",
        a: "Self-invocation (no proxy involved), private or final methods, a checked exception thrown without rollbackFor, and calls made from a different thread (the transaction is bound to the thread). Each of these is a real production bug pattern.",
      },
      {
        q: "How do you keep a Spring Boot service fast to start and cheap to run?",
        a: "Trim auto-configuration and dependencies, use lazy initialisation where startup dominates, set JVM heap explicitly in containers (or rely on container-aware ergonomics), and consider CDS/AOT or GraalVM native images for serverless-style workloads.",
      },
    ],
  },
  {
    id: "c-kafka",
    t: "Kafka, servlets and web servers",
    cat: "Java & concurrency",
    r: 2,
    src: ["S2"],
    a: "**Kafka.** A distributed, partitioned, replicated commit log. Producers append to a topic partition; consumers in a consumer group each own a subset of partitions and track an offset. Key points to have ready:\n- **Ordering is per partition only** — choose the message key so related events (same conversation, same order, same tenant) land on one partition.\n- **Delivery semantics**: at-most-once (commit offset before processing), at-least-once (process, then commit — the normal choice, so consumers must be idempotent), exactly-once within Kafka via transactions and idempotent producers.\n- **Consumer groups** scale by partition count: more consumers than partitions leaves some idle.\n- **Retention** is time or size based, and replay is a feature — a consumer can reset its offset and reprocess.\n- **Backpressure** is natural: the log buffers while consumers catch up, which is exactly why it sits between a fast write path and slower workers.\n- **Rebalances** pause consumption; long processing times risk being kicked from the group (max.poll.interval.ms), which is a common production incident.\n\n**Servlets and web servers.** A servlet container (Tomcat, Jetty) maps HTTP requests to threads: classically one thread per request, blocking on IO. That model is simple but caps concurrency at the thread pool size — a slow downstream call ties up a thread doing nothing. Options: async servlets (3.0+) or reactive stacks (WebFlux/Netty) that free the thread while waiting, or Java 21 virtual threads, which keep the simple blocking style while making threads cheap. Nginx in front handles TLS, static files, compression and connection multiplexing.\n\nThe sentence that ties it together in an interview: *the web server's job is to accept connections and hand off work quickly; anything slow belongs behind a queue, because thread pools are the scarce resource in a blocking stack.*",
    java: '// producer: key chooses the partition, and therefore the ordering guarantee\nProducerRecord<String, String> record =\n        new ProducerRecord<>("ticket-events", ticket.getTenantId(), payload);\nproducer.send(record, (metadata, ex) -> {\n    if (ex != null) log.error("publish failed", ex);   // handle, do not swallow\n});\n\n// consumer: at-least-once, so processing must be idempotent\nwhile (running) {\n    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));\n    for (ConsumerRecord<String, String> r : records) {\n        try {\n            handler.handleIdempotently(r.key(), r.value(), r.offset());\n        } catch (RetryableException e) {\n            // do not commit past this record; let the retry/DLQ policy handle it\n            deadLetter.publish(r);\n        }\n    }\n    consumer.commitSync();          // commit AFTER processing\n}\n\n// async servlet: release the container thread while waiting on IO\n@GetMapping("/report")\npublic CompletableFuture<ReportDto> report() {\n    return CompletableFuture.supplyAsync(() -> reportService.build(), reportExecutor);\n}',
    py: "# confluent-kafka consumer with the same at-least-once discipline\nfrom confluent_kafka import Consumer\n\nconsumer = Consumer({\n    'bootstrap.servers': 'kafka:9092',\n    'group.id': 'ticket-indexer',\n    'enable.auto.commit': False,        # commit after processing, not before\n    'auto.offset.reset': 'earliest',\n})\nconsumer.subscribe(['ticket-events'])\n\nwhile True:\n    msg = consumer.poll(1.0)\n    if msg is None:\n        continue\n    if msg.error():\n        log.error(msg.error())\n        continue\n    try:\n        handle_idempotently(msg.key(), msg.value())\n        consumer.commit(msg)            # at-least-once\n    except RetryableError:\n        dead_letter.publish(msg)",
    fu: [
      {
        q: "How do you get ordering and parallelism at the same time?",
        a: "Partition by the entity that needs ordering (conversation id, order id) and scale consumers up to the partition count. Ordering holds within a key; different keys process in parallel. If you need more parallelism than partitions, you must re-partition, not add consumers.",
      },
      {
        q: "What makes a consumer idempotent?",
        a: "A natural idempotency key (event id) recorded in the destination, upserts instead of inserts, or conditional updates that ignore stale versions. At-least-once plus idempotence is the practical substitute for exactly-once.",
      },
      {
        q: "Kafka vs RabbitMQ vs SQS?",
        a: "Kafka for high-throughput ordered logs with replay and multiple independent consumers. RabbitMQ for complex routing, per-message acknowledgement and work queues. SQS when you want a managed queue with minimal operations. Choose by whether you need the log (replay, multiple readers) or just the queue.",
      },
    ],
  },
  {
    id: "c-redis",
    t: "Redis and caching concepts (plus Grafana/monitoring)",
    cat: "Caching & performance",
    r: 3,
    src: ["S4"],
    a: "**Redis** is a single-threaded (for command execution) in-memory data-structure server: strings, hashes, lists, sets, sorted sets, bitmaps, HyperLogLog, streams. Single-threaded execution is a feature — every command is atomic, so INCR, SETNX and Lua scripts need no locking.\n\nThings to have ready:\n- **Persistence**: RDB snapshots (fast restart, can lose the window since the last snapshot) and AOF (append-only, near-durable with fsync policies). Both, usually.\n- **Eviction policies**: allkeys-lru, allkeys-lfu, volatile-ttl, noeviction. Pick based on whether Redis is a cache (evict) or a store (noeviction and alert).\n- **Cluster**: 16,384 hash slots across nodes; multi-key operations must hash to the same slot (use hash tags {tenant:42}).\n- **Common patterns**: cache-aside, distributed locks (Redlock — and its caveats), rate limiting with Lua, leaderboards with ZSET, sessions, pub/sub, and streams for lightweight queues.\n\n**Caching strategies** and when each fits:\n- **Cache-aside (lazy loading)** — the application checks the cache, loads on miss, writes back. Simple, resilient, the default.\n- **Read-through / write-through** — the cache sits in front of the store; write-through keeps the cache consistent at the cost of write latency.\n- **Write-behind** — write to the cache and flush asynchronously; fast but risks loss.\n- **Refresh-ahead** — reload before the TTL expires so hot keys never miss.\n\nThe three failure modes worth naming: **stampede** (many requests miss at once — fix with single-flight/locking or a slightly randomised TTL), **penetration** (requests for keys that do not exist — cache the negative result or use a Bloom filter), and **avalanche** (many keys expire simultaneously — jitter the TTLs).\n\n**Monitoring with Grafana** (asked in the same round): Grafana is the visualisation layer over a metrics store, usually Prometheus, which scrapes /metrics endpoints. The framing to give is the **four golden signals** — latency, traffic, errors, saturation — plus the RED method for services (Rate, Errors, Duration) and USE for resources (Utilisation, Saturation, Errors). Dashboards should show p50/p95/p99 (never averages alone), and alerts should fire on symptoms tied to SLOs with a burn-rate rule, not on every CPU spike.",
    java: '// cache-aside with single-flight to prevent a stampede\npublic Ticket getTicket(long id) {\n    String key = "ticket:" + id;\n    String cached = redis.get(key);\n    if (cached != null) return decode(cached);\n\n    // only one loader per key; others wait briefly and re-read\n    String lockKey = "lock:" + key;\n    boolean gotLock = redis.set(lockKey, token, SetParams.setParams().nx().px(3000)) != null;\n    if (!gotLock) {\n        sleepBriefly();\n        return getTicket(id);\n    }\n    try {\n        Ticket t = repo.findById(id).orElseThrow();\n        // jittered TTL so keys do not expire together (avalanche)\n        int ttl = 300 + ThreadLocalRandom.current().nextInt(60);\n        redis.setex(key, ttl, encode(t));\n        return t;\n    } finally {\n        // release only if we still own it (compare-and-delete via Lua)\n        redis.eval(UNLOCK_SCRIPT, List.of(lockKey), List.of(token));\n    }\n}',
    py: "import random, redis, json\n\nr = redis.Redis()\n\ndef get_ticket(ticket_id, loader, ttl=300):\n    key = f'ticket:{ticket_id}'\n    cached = r.get(key)\n    if cached:\n        return json.loads(cached)\n\n    lock_key = f'lock:{key}'\n    token = str(random.random())\n    if r.set(lock_key, token, nx=True, px=3000):      # single-flight\n        try:\n            value = loader(ticket_id)\n            if value is None:\n                r.setex(key, 30, 'null')              # cache the miss (penetration)\n                return None\n            r.setex(key, ttl + random.randint(0, 60), json.dumps(value))  # jitter\n            return value\n        finally:\n            # compare-and-delete so we never release someone else's lock\n            r.eval(\"if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) end\",\n                   1, lock_key, token)\n    # someone else is loading: brief wait, then re-read\n    import time; time.sleep(0.05)\n    return get_ticket(ticket_id, loader, ttl)",
    fu: [
      {
        q: "How do you invalidate a cache correctly?",
        a: "Prefer short TTLs plus explicit invalidation on write. For multi-node local caches, broadcast invalidations over pub/sub. Avoid write-then-delete races by deleting after the database commit, and consider versioned keys (ticket:42:v7) so a new version is a new key and stale entries simply age out.",
      },
      {
        q: "Is a Redis distributed lock safe?",
        a: "Good enough for coordination where a rare double execution is tolerable; not a substitute for correctness. Always set a TTL, use a unique token with compare-and-delete on release, and design the protected operation to be idempotent. Mention that Redlock is debated and that a database transaction or a fencing token is the stronger answer when money is involved.",
      },
      {
        q: "What would you put on the first dashboard for a new service?",
        a: "Request rate, error rate and p50/p95/p99 latency per endpoint; saturation (CPU, memory, thread pool, connection pool); dependency latency; queue depth and consumer lag; and one business metric (tickets created per minute). Alert on the SLO burn rate and on queue lag — not on raw CPU.",
      },
    ],
  },
  {
    id: "c-microservices",
    t: "Microservices, distributed systems and Vert.x",
    cat: "Distributed systems",
    r: 3,
    src: ["S1"],
    a: "**Microservices** are an organisational and deployment choice before they are a technical one: independent deploys, independent scaling, and a team that owns a service end to end. The costs are real — network calls instead of function calls, distributed transactions, versioning across services, more operational surface — so the honest answer includes when *not* to split: a small team, an unclear domain, or a system whose bottleneck is one component. A modular monolith with clean boundaries is often the right intermediate step, and saying so reads as experience, not conservatism.\n\nIf you do split, the patterns to name:\n- **Boundaries by aggregate/domain**, not by layer. If two services must always deploy together, they are one service.\n- **Database per service.** Sharing a database recreates the monolith with worse latency.\n- **Saga** for cross-service workflows with compensating actions, because two-phase commit does not scale across services.\n- **Outbox pattern** so 'write the row' and 'publish the event' are atomic: write the event into an outbox table in the same transaction, and a relay publishes it.\n- **API gateway** for edge concerns; **service discovery** and **client-side load balancing** for routing.\n- **Resilience**: timeouts everywhere, retries with jitter and a budget, circuit breakers, bulkheads, and graceful degradation.\n- **Observability**: correlation ids and distributed tracing, or you cannot debug anything.\n\n**Vert.x** (a candidate was tripped up by it, so know the shape): a JVM toolkit for event-driven, non-blocking applications. It runs a small number of **event loop threads**; handlers must never block, because blocking an event loop stalls every connection it serves — long or blocking work goes to `executeBlocking` or a worker verticle. Components are **verticles** (deployable units) that communicate over an in-memory or clustered **event bus** with an actor-like model, so shared mutable state is avoided by design. Compare it to Node.js on the JVM, or to Spring WebFlux/Netty. If you have not used it, say that and reason from the properties — one report shows the candidate suffering more from bluffing than from not knowing.",
    java: '// Outbox: the event and the state change commit together\n@Transactional\npublic Ticket create(CreateTicket cmd) {\n    Ticket t = repo.save(Ticket.from(cmd));\n    outbox.save(new OutboxEvent(\n            UUID.randomUUID(), "ticket.created", toJson(t), Instant.now()));\n    return t;                      // one transaction: no lost events, no phantom events\n}\n// a relay polls the outbox (or reads the WAL via CDC) and publishes to Kafka,\n// marking rows as sent; consumers deduplicate by event id.\n\n// Resilience4j: timeout + circuit breaker + bounded retry around a dependency\nSupplier<Quote> call = () -> pricingClient.quote(request);\nSupplier<Quote> guarded = Decorators.ofSupplier(call)\n        .withCircuitBreaker(circuitBreaker)\n        .withRetry(Retry.of("pricing", RetryConfig.custom()\n                .maxAttempts(3)\n                .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(100, 2))\n                .build()))\n        .withFallback(List.of(CallNotPermittedException.class), e -> Quote.cachedOrDefault())\n        .decorate();\n\n// Vert.x: never block the event loop\nvertx.createHttpServer().requestHandler(req -> {\n    vertx.executeBlocking(promise -> {\n        promise.complete(legacyBlockingCall());     // runs on a worker thread\n    }, false, res -> req.response().end(res.result().toString()));\n}).listen(8080);',
    fu: [
      {
        q: "How do you handle a transaction that spans two services?",
        a: "You do not use a distributed transaction; you use a saga — a sequence of local transactions, each with a compensating action, coordinated by choreography (events) or orchestration (a workflow service). Make every step idempotent and give the workflow a timeout with a defined terminal state.",
      },
      {
        q: "How do you version APIs between services?",
        a: "Additive changes only within a major version (add optional fields, never remove or repurpose), consumer-driven contract tests in CI, and expand/contract for breaking changes: publish both shapes, migrate consumers, then remove the old one.",
      },
      {
        q: "When would you merge microservices back together?",
        a: "When two services always change and deploy together, when the network hop between them dominates latency, or when the team owning them is one team. Saying that consolidation is a legitimate outcome is a strong, senior answer.",
      },
    ],
  },
  {
    id: "c-patterns",
    t: "Design patterns: Factory, Flyweight, Singleton (and the ones that actually come up)",
    cat: "Design patterns",
    r: 3,
    src: ["S1", "L6"],
    a: "**Factory Method / Abstract Factory** — create objects without the caller knowing the concrete class. Use it when the implementation depends on configuration or input: a RateLimiterFactory returning a token-bucket or sliding-window limiter, a PaymentGatewayFactory per country. It keeps `new ConcreteThing()` out of business logic, which is what makes the code testable.\n\n**Flyweight** — share immutable intrinsic state across many objects and keep the varying (extrinsic) state outside. Java's Integer cache (-128..127), String interning, and the glyph caches in text rendering are the standard examples. In application code: a shared, immutable configuration object referenced by millions of events rather than copied.\n\n**Singleton** — exactly one instance with a global access point. Say the caveats, because that is what is being tested: it is effectively global mutable state, it makes testing harder, and in Java the safe implementations are an enum singleton or a static holder class (lazy and thread-safe without locking); double-checked locking requires `volatile`. In practice, prefer a single bean managed by the DI container — same lifecycle, injectable, mockable.\n\nThe other patterns that genuinely appear in LLD rounds: **Strategy** (pluggable eviction/pricing/rotation), **Observer** (events and listeners), **Builder** (objects with many optional fields), **State** (order and ticket lifecycles), **Decorator** (wrapping with metrics, caching, retries), **Chain of Responsibility** (escalation and middleware), **Adapter** (third-party integrations), **Repository** (persistence boundary), **Template Method** (a fixed algorithm with pluggable steps).\n\nThe framing that lands: patterns are vocabulary for trade-offs you would make anyway. Name one only when you have used it in the design you just drew — sprinkling pattern names without a reason is a known negative signal.",
    java: '// Singleton done properly in Java\npublic enum ConfigRegistry {                       // enum: serialisation- and reflection-safe\n    INSTANCE;\n    private final Map<String, String> values = new ConcurrentHashMap<>();\n    public String get(String key) { return values.get(key); }\n}\n\npublic final class LazyHolder {                    // lazy, thread-safe, no locking\n    private LazyHolder() {}\n    private static final class Holder { static final LazyHolder INSTANCE = new LazyHolder(); }\n    public static LazyHolder getInstance() { return Holder.INSTANCE; }\n}\n\n// Factory: the caller asks for behaviour, not a class\npublic final class RateLimiterFactory {\n    public static RateLimiter create(RateLimitPolicy policy, Clock clock) {\n        return switch (policy.algorithm()) {\n            case TOKEN_BUCKET   -> new TokenBucketLimiter(policy.rate(), policy.burst(), clock);\n            case SLIDING_WINDOW -> new SlidingWindowCounterLimiter(policy.limit(), policy.window(), clock);\n            case FIXED_WINDOW   -> new FixedWindowLimiter(policy.limit(), policy.window(), clock);\n        };\n    }\n}\n\n// Flyweight: share the immutable part, pass the varying part in\npublic final class TicketType {                     // intrinsic, shared\n    private static final Map<String, TicketType> POOL = new ConcurrentHashMap<>();\n    private final String name; private final int slaMinutes;\n    public static TicketType of(String name, int sla) {\n        return POOL.computeIfAbsent(name + "#" + sla, k -> new TicketType(name, sla));\n    }\n}',
    py: "from enum import Enum\nfrom functools import lru_cache\n\n# Singleton: a module-level object is the idiomatic Python answer\nclass _ConfigRegistry:\n    def __init__(self): self._values = {}\n    def get(self, key): return self._values.get(key)\n\nconfig_registry = _ConfigRegistry()      # imported once, shared everywhere\n\n# Factory\ndef create_rate_limiter(policy, clock=None):\n    match policy.algorithm:\n        case 'token_bucket':   return TokenBucketLimiter(policy.rate, policy.burst, clock)\n        case 'sliding_window': return SlidingWindowCounterLimiter(policy.limit, policy.window, clock)\n        case _:                raise ValueError(policy.algorithm)\n\n# Flyweight via memoisation of immutable value objects\n@lru_cache(maxsize=None)\ndef ticket_type(name, sla_minutes):\n    return TicketType(name, sla_minutes)",
    fu: [
      {
        q: "Why is Singleton considered an anti-pattern by some?",
        a: "It hides dependencies (any class can reach it), it is global mutable state, it complicates testing (no easy substitution), and it can become a concurrency bottleneck. The DI-managed single instance gives the same benefit without the coupling.",
      },
      {
        q: "Give a Flyweight example from your own work.",
        a: "Any large collection of objects sharing repeated immutable data: interned tenant configuration referenced by every request object, shared immutable schema definitions in a form builder, or cached compiled regexes. The test is whether the shared part is truly immutable.",
      },
      {
        q: "Which pattern do you reach for most?",
        a: "Strategy, honestly — most real requirements changes are 'the same flow with a different rule'. Answering with a specific, frequently used pattern and a real example beats reciting the catalogue.",
      },
    ],
  },
  {
    id: "c-js",
    t: "JavaScript fundamentals (frontend track)",
    cat: "Frontend",
    r: 1,
    src: ["S7"],
    a: "A Chennai full-day Senior loop asked 'all basic to advanced JavaScript: closures, hoisting, this, event delegation, event propagation, promises, the event loop'. Short, precise answers:\n\n**Closure** — a function plus the lexical scope it captured, so inner functions keep access to outer variables after the outer function returns. Used for private state, memoisation, once-only handlers and the classic loop-variable fix (`let` creates a fresh binding per iteration; `var` does not).\n\n**Hoisting** — declarations are processed before execution. `var` is hoisted and initialised to undefined; `function` declarations are fully hoisted; `let`/`const` are hoisted but stay in the temporal dead zone, so touching them before the declaration throws a ReferenceError.\n\n**this** — determined by call site, not definition: a plain call gives undefined (strict) or globalThis; a method call gives the object; `call`/`apply`/`bind` set it explicitly; `new` gives the new instance; and arrow functions have no own `this` — they capture the enclosing lexical one, which is why they are used for callbacks.\n\n**Event propagation** — capture phase from the window down to the target, then the target, then bubbling back up. `addEventListener(fn, true)` listens in the capture phase; `stopPropagation()` halts travel; `preventDefault()` cancels the default action. **Event delegation** exploits bubbling: attach one listener to a container and inspect `event.target`, which keeps a single handler for a list of thousands of rows and works for dynamically added elements.\n\n**Promises and the event loop** — JavaScript is single-threaded with a task queue. Each tick runs one macrotask (timer, IO callback, event) and then drains the entire microtask queue (promise callbacks, queueMicrotask, MutationObserver). That is why a `.then` always runs before a `setTimeout(…, 0)` scheduled at the same moment. `async/await` is syntax over promises: everything after an `await` is a microtask continuation.",
    codeLang: "JavaScript",
    code: "// closure: private state that survives the outer call\nfunction counter() {\n  let count = 0;                       // captured, not global\n  return { inc: () => ++count, value: () => count };\n}\n\n// hoisting / TDZ\nconsole.log(a);   // undefined  (var is hoisted and initialised)\nvar a = 1;\n// console.log(b); // ReferenceError (let is in the temporal dead zone)\nlet b = 2;\n\n// this\nconst obj = {\n  name: 'freshworks',\n  regular() { return this.name; },     // 'freshworks'\n  arrow: () => this?.name,             // undefined: lexical this\n};\n\n// event delegation: one listener for a list of any size\ndocument.querySelector('#ticket-list').addEventListener('click', (e) => {\n  const row = e.target.closest('[data-ticket-id]');\n  if (!row) return;                    // clicked the gap between rows\n  openTicket(row.dataset.ticketId);\n}, false);                             // false = bubbling phase\n\n// event loop ordering\nconsole.log('1');\nsetTimeout(() => console.log('4'), 0);          // macrotask\nPromise.resolve().then(() => console.log('3')); // microtask\nconsole.log('2');\n// prints 1, 2, 3, 4 — microtasks drain before the next macrotask\n\n// promise composition\nconst [user, tickets] = await Promise.all([fetchUser(id), fetchTickets(id)]);\nconst results = await Promise.allSettled(calls);   // never rejects; inspect each",
    fu: [
      {
        q: "Why does a `for (var i…)` loop with setTimeout print the same number?",
        a: "`var` is function-scoped, so all callbacks close over one binding whose final value is the loop bound. `let` creates a new binding per iteration and prints 0,1,2. It is the standard closure test.",
      },
      {
        q: "Debounce versus throttle?",
        a: "Debounce delays until activity stops (search-as-you-type); throttle guarantees at most one call per interval (scroll handlers). Be ready to implement both in five lines — they are the most common follow-up.",
      },
      {
        q: "What does the event loop do with a long synchronous function?",
        a: "It blocks everything — rendering, input, timers — because there is one thread. Break the work into chunks with requestIdleCallback/setTimeout, or move it to a Web Worker.",
      },
    ],
  },
  {
    id: "c-tyre",
    t: "Puzzle: 4 tyres plus a spare, each lasting 20 km — how far can the car go?",
    cat: "Puzzle",
    r: 3,
    src: ["L4"],
    a: "**25 km.**\n\nThe reasoning, which is what is being graded: there are 5 tyres, each with 20 km of life, giving 100 tyre-kilometres of total wear available. The car always runs on 4 tyres at once, so it consumes 4 tyre-kilometres for every kilometre driven. Therefore the theoretical maximum is 100 / 4 = 25 km.\n\nThen show it is actually achievable, because a bound is not a solution: rotate the spare in so that each tyre is idle for the same fraction of the journey. Over 25 km, each tyre rests for 5 km and runs for 20 km — for example, swap tyres every 5 km, resting a different one each interval. Five intervals, five tyres, each rests exactly once.\n\nThe interviewer is watching for three things: converting the problem into a conserved quantity (tyre-kilometres), computing the upper bound, and then demonstrating a schedule that meets it. Stating '25' with no derivation gets much less credit than the two-step argument — and the same structure (resource bound, then a schedule that attains it) is exactly how you would answer a capacity-planning question.",
    fu: [
      {
        q: "Generalise it: n tyres on the road, m total tyres, each lasting L km.",
        a: "Distance = m · L / n, achievable when m ≥ n and the rotation is even. With 6 tyres on a 4-wheel car: 6 × 20 / 4 = 30 km.",
      },
      {
        q: "Why do interviewers ask puzzles at Lead level?",
        a: "To watch reasoning under mild pressure when there is no rehearsed answer. Narrate the model you are building, state assumptions, and sanity-check the result — a confident wrong number is worse than a slower correct derivation.",
      },
      {
        q: "What if swapping takes time or is limited?",
        a: "Then it becomes a scheduling problem with a cost per swap: the minimum number of swaps here is 4 (one per rest interval boundary), and you would trade fewer swaps against uneven wear. Offering that extension shows you understood the structure rather than remembering the answer.",
      },
    ],
  },
];
