import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaRuntime: Concept[] = [
  {
    slug: "multithreading",
    title: "Multithreading & Concurrency",
    subtitle: "Chapter 3 — threads, the executor framework, synchronisation, and virtual threads",
    level: "advanced",
    minutes: 30,
    tags: ["threads", "concurrency", "executors", "locks", "virtual threads"],
    summary:
      "Every Spring Boot request runs on a thread from a pool, so you are writing concurrent code whether or not you think about it. The rule that prevents most bugs is simple — do not share mutable state between threads — and everything else here is what to do when you must.",
    keyPoints: [
      "Never create threads directly in application code; use an ExecutorService.",
      "Shared mutable state is the source of essentially every concurrency bug.",
      "synchronized gives mutual exclusion AND visibility; volatile gives only visibility.",
      "Virtual threads (Java 21) make blocking I/O cheap and change how you size pools.",
    ],
    prerequisites: ["/java/basics"],
    sections: [
      {
        heading: "The problem: visibility and atomicity",
        lede: "Two separate failures that both look like 'the number is wrong'.",
        code: {
          title: "Example — a counter that loses increments, and three fixes",
          lang: "java",
          source: `// BROKEN — count++ is read, add, write: three steps, not one.
class Counter {
    private int count = 0;
    void increment() { count++; }        // two threads can interleave and lose updates
    int get() { return count; }
}
// 1000 threads incrementing 1000 times each → far less than 1,000,000

// FIX 1 — synchronized: mutual exclusion + visibility, simple and correct
class SyncCounter {
    private int count = 0;
    synchronized void increment() { count++; }
    synchronized int get() { return count; }   // the GETTER must sync too, for visibility
}

// FIX 2 — atomic: lock-free compare-and-swap, faster under contention
class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger();
    void increment() { count.incrementAndGet(); }
    int get() { return count.get(); }
}

// FIX 3 — do not share at all. Each thread accumulates locally and combines.
long total = IntStream.range(0, 1_000_000).parallel().count();

// volatile is NOT a fix here: it guarantees visibility but not atomicity,
// so count++ still loses updates. Use volatile for a flag, not a counter.
private volatile boolean running = true;   // correct use`,
        },
        table: {
          caption: "Choosing the right tool.",
          headers: ["Need", "Tool", "Note"],
          rows: [
            ["A simple flag other threads must see", "volatile", "Visibility only, no atomicity"],
            [
              "A counter or accumulator",
              "AtomicInteger / LongAdder",
              "LongAdder wins under heavy contention",
            ],
            [
              "A compound operation",
              "synchronized or ReentrantLock",
              "Lock gives tryLock and timeouts",
            ],
            ["A shared map", "ConcurrentHashMap", "Never a synchronized HashMap wrapper"],
            [
              "Read-mostly shared data",
              "Immutable object + volatile reference",
              "Swap the whole thing; no locking on read",
            ],
          ],
        },
        links: [
          {
            label: "Baeldung — Java concurrency guide",
            href: "https://www.baeldung.com/java-concurrency",
          },
          {
            label: "YouTube search — Java multithreading synchronized volatile atomic",
            href: YT("java multithreading synchronized volatile atomic explained"),
          },
        ],
      },
      {
        heading: "Executors, not raw threads",
        lede: "Thread creation is expensive and unbounded thread creation is an outage.",
        code: {
          title: "Example — the pool, and the shutdown people forget",
          lang: "java",
          source: `// A bounded pool with a bounded queue. Both bounds matter: an unbounded
// queue turns a traffic spike into an OutOfMemoryError instead of a rejection.
ExecutorService pool = new ThreadPoolExecutor(
    10, 20,                                  // core, max threads
    60L, TimeUnit.SECONDS,                   // idle timeout for non-core
    new ArrayBlockingQueue<>(100),           // BOUNDED queue
    new ThreadPoolExecutor.CallerRunsPolicy() // back-pressure: caller does the work
);

Future<Report> future = pool.submit(() -> buildReport(id));
Report report = future.get(30, TimeUnit.SECONDS);   // ALWAYS use the timeout form

// Shutdown, done properly — omitted, the JVM will not exit.
pool.shutdown();                                     // stop accepting new work
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
    pool.shutdownNow();                              // interrupt what is still running
}

// CompletableFuture for composing async work without blocking:
CompletableFuture
    .supplyAsync(() -> fetchUser(id), pool)
    .thenCombine(CompletableFuture.supplyAsync(() -> fetchOrders(id), pool),
                 (user, orders) -> new Profile(user, orders))
    .orTimeout(5, TimeUnit.SECONDS)                  // do not wait forever
    .exceptionally(ex -> Profile.empty());`,
        },
        bullets: [
          "Sizing: roughly CPU-count threads for CPU-bound work, many more for I/O-bound work — a thread blocked on a database call is using no CPU.",
          "Always use the timeout form of get(). An untimed get() on a hung task blocks a request thread indefinitely.",
          "CallerRunsPolicy is an underrated rejection policy: it applies back-pressure by making the submitting thread do the work rather than silently dropping it.",
          "In Spring, prefer a configured TaskExecutor bean over creating pools ad hoc, so sizing and naming are managed in one place.",
        ],
        links: [
          {
            label: "Baeldung — ExecutorService guide",
            href: "https://www.baeldung.com/java-executor-service-tutorial",
          },
          {
            label: "YouTube search — Java ExecutorService CompletableFuture tutorial",
            href: YT("java executorservice completablefuture tutorial"),
          },
        ],
      },
      {
        heading: "Virtual threads (Java 21)",
        lede: "The change that makes 'a thread per request' viable again.",
        body: [
          "A platform thread maps to an OS thread and costs around a megabyte of stack, which is why pools exist. A virtual thread is managed by the JVM, costs a few hundred bytes, and unmounts from its carrier thread whenever it blocks. You can have millions of them.",
        ],
        table: {
          caption: "What changes, and what does not.",
          headers: ["Aspect", "Platform threads", "Virtual threads"],
          rows: [
            ["Cost each", "~1 MB stack", "A few hundred bytes"],
            ["Practical count", "Thousands", "Millions"],
            ["Best for", "CPU-bound work", "Blocking I/O — database, HTTP"],
            ["Pooling", "Essential", "Unnecessary — create one per task"],
            ["synchronized blocks", "Fine", "Can pin the carrier; prefer ReentrantLock"],
          ],
        },
        bullets: [
          "Virtual threads do not make CPU-bound work faster — they make blocking I/O cheap. A service that spends its life waiting on a database is the ideal case.",
          "Do not pool virtual threads. Pooling exists to amortise creation cost, and creation is now nearly free.",
          "Long synchronized blocks around blocking calls can pin a virtual thread to its carrier, defeating the benefit — ReentrantLock does not have this problem.",
          "In Spring Boot 3.2+, one property switches the request path to virtual threads: spring.threads.virtual.enabled=true.",
        ],
        links: [
          {
            label: "Oracle — Virtual Threads",
            href: "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html",
          },
          {
            label: "YouTube search — Java 21 virtual threads explained",
            href: YT("java 21 virtual threads loom explained tutorial"),
          },
        ],
      },
    ],
    related: ["/java/exception-handling", "/java/spring-framework", "/lld/concurrency"],
    furtherReading: [
      { label: "Baeldung — concurrency", href: "https://www.baeldung.com/java-concurrency" },
      {
        label: "Oracle — concurrency tutorial",
        href: "https://docs.oracle.com/javase/tutorial/essential/concurrency/",
      },
    ],
  },

  {
    slug: "exception-handling",
    title: "Exception Handling",
    subtitle: "Chapter 4 — checked vs unchecked, try-with-resources, and designing failure",
    level: "foundational",
    minutes: 22,
    tags: ["exceptions", "errors", "try-with-resources"],
    summary:
      "Exception handling is where codebases quietly rot: an empty catch block here, a swallowed stack trace there, and eventually nobody can diagnose production. The discipline is small — catch what you can act on, never swallow, always close resources — and it pays back constantly.",
    keyPoints: [
      "Checked exceptions force the caller to decide; unchecked ones signal programming errors.",
      "An empty catch block is the single most destructive line in Java.",
      "try-with-resources is the only correct way to close things.",
      "Wrap low-level exceptions in domain ones so callers do not depend on your implementation.",
    ],
    prerequisites: ["/java/basics"],
    sections: [
      {
        heading: "The hierarchy, and what each branch means",
        diagram: {
          kind: "flow",
          caption: "Only two of these are yours to handle.",
          rows: [
            [
              { id: "t", label: "Throwable" },
              {
                id: "e",
                label: "Error",
                sub: "OutOfMemory, StackOverflow — do not catch",
                tone: "bad",
              },
              { id: "ex", label: "Exception", tone: "accent" },
            ],
            [
              { id: "c", label: "Checked", sub: "IOException, SQLException — caller must decide" },
              {
                id: "r",
                label: "RuntimeException",
                sub: "NullPointer, IllegalArgument — your bug",
                tone: "warn",
              },
            ],
          ],
        },
        bullets: [
          "Checked exceptions represent recoverable conditions the caller should think about — a file missing, a network failing.",
          "Unchecked exceptions usually mean a programming error. Catching NullPointerException to 'handle' it hides the bug rather than fixing it.",
          "Never catch Error. An OutOfMemoryError means the JVM is in an unreliable state; continuing is worse than stopping.",
          "Modern APIs and Spring lean heavily on unchecked exceptions, because checked ones compose badly with lambdas and streams.",
        ],
        links: [
          {
            label: "Baeldung — checked vs unchecked exceptions",
            href: "https://www.baeldung.com/java-checked-unchecked-exceptions",
          },
        ],
      },
      {
        heading: "The rules that actually matter",
        code: {
          title: "Example — the four mistakes, and what to do instead",
          lang: "java",
          source: `// MISTAKE 1 — swallowing. The failure becomes invisible; someone loses a day.
try { save(order); } catch (SQLException e) { }                    // NEVER

// MISTAKE 2 — logging and continuing as if nothing happened
try { save(order); } catch (SQLException e) { log.error("oops"); }  // and then?
// The caller believes the order saved. It did not.

// MISTAKE 3 — catching Exception, so you also catch bugs you meant to surface
try { save(order); } catch (Exception e) { retry(); }               // too broad

// MISTAKE 4 — losing the cause
throw new OrderException("save failed");                            // stack trace gone

// CORRECT — wrap with the cause, at the right level of abstraction
try {
    save(order);
} catch (SQLException e) {
    // The caller should not need to know we use SQL. Wrap into a domain
    // exception, and ALWAYS pass the cause so the stack trace survives.
    throw new OrderPersistenceException("could not save order " + order.id(), e);
}

// try-with-resources: closes in reverse order, even on exception, and
// suppressed exceptions from close() are attached rather than lost.
try (var conn = dataSource.getConnection();
     var stmt = conn.prepareStatement(SQL)) {
    stmt.setLong(1, id);
    return stmt.executeQuery();
}   // both closed automatically — no finally block, no leak`,
        },
        bullets: [
          "Catch only what you can act on. If you cannot do anything useful, let it propagate to a layer that can — in Spring, usually a @ControllerAdvice handler.",
          "Always pass the cause when wrapping. A stack trace that stops at your wrapper is a diagnosis you will not be able to make.",
          "Anything implementing AutoCloseable belongs in try-with-resources. A finally block that closes is legacy style and gets the suppressed-exception case wrong.",
          "Do not use exceptions for control flow — they are expensive and they obscure intent.",
        ],
        links: [
          {
            label: "Baeldung — try-with-resources",
            href: "https://www.baeldung.com/java-try-with-resources",
          },
          {
            label: "YouTube search — Java exception handling best practices",
            href: YT("java exception handling best practices tutorial"),
          },
        ],
      },
      {
        heading: "Exceptions at the service boundary",
        lede: "In a web service, an exception's job is to become the right HTTP status.",
        code: {
          title: "Example — mapping domain failures to responses, in one place",
          lang: "java",
          source: `@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ApiError> notFound(OrderNotFoundException e) {
        return ResponseEntity.status(404).body(ApiError.of("ORDER_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> invalid(ValidationException e) {
        return ResponseEntity.badRequest().body(ApiError.of("INVALID", e.getMessage()));
    }

    @ExceptionHandler(PaymentProviderException.class)
    public ResponseEntity<ApiError> upstream(PaymentProviderException e) {
        // 502, not 500 — this tells the caller's on-call team it is not our bug.
        log.error("payment provider failed", e);
        return ResponseEntity.status(502).body(ApiError.of("UPSTREAM_ERROR", "try again"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception e) {
        log.error("unhandled", e);           // log the detail...
        // ...but never leak stack traces or internals to the client.
        return ResponseEntity.status(500).body(ApiError.of("INTERNAL", "unexpected error"));
    }
}`,
        },
        bullets: [
          "Centralise mapping in one advice class rather than try/catch in every controller — it keeps status codes consistent across the API.",
          "Log the detail server-side, return a generic message to the client. Stack traces in responses are an information-disclosure finding.",
          "Include a correlation id in the error response so a user report maps directly to a log entry.",
        ],
        links: [
          {
            label: "Baeldung — error handling for REST with Spring",
            href: "https://www.baeldung.com/exception-handling-for-rest-with-spring",
          },
        ],
      },
    ],
    related: ["/java/multithreading", "/java/spring-framework", "/java/testing"],
    furtherReading: [
      { label: "Baeldung — exceptions", href: "https://www.baeldung.com/java-exceptions" },
    ],
  },
];
