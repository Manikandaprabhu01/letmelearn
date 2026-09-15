import type { Concept } from "@/data/types";

export const springThreads: Concept = {
  slug: "spring-threads",
  title: "Threads in Spring Boot: Pools, Virtual Threads, @Async & WebFlux",
  subtitle:
    "Chapter 28 — Tomcat's request pool, virtual threads and where the bottleneck moves, @Async executors, event loops, and sizing with arithmetic",
  level: "advanced",
  minutes: 30,
  tags: [
    "spring boot",
    "tomcat",
    "virtual threads",
    "async",
    "webflux",
    "thread pools",
    "hikaricp",
  ],
  summary:
    "A Spring MVC request occupies a thread from start to finish, so throughput is threads divided by latency — until something smaller runs out first, usually the database pool. Virtual threads make request threads nearly free but move the limit to whatever they wait on. @Async ships with an unbounded queue. WebFlux scales connections on a few event-loop threads and punishes a single blocking call. All of it is arithmetic you can do before the incident.",
  keyPoints: [
    "Tomcat defaults to 200 request threads; a slow dependency without a timeout consumes all of them.",
    "spring.threads.virtual.enabled=true makes blocking cheap — so bound concurrency to databases and APIs explicitly.",
    "The auto-configured @Async executor has 8 core threads and an unbounded queue: it never grows and never rejects.",
    "One blocking call on a Netty event loop stalls every connection on that loop.",
    "Size the database pool to the database, not to the request threads, and fail fast when it is exhausted.",
  ],
  prerequisites: ["/java/multithreading", "/java/spring-transactions"],
  sections: [
    {
      heading: "Thread-per-request and the Tomcat pool",
      lede: "The ceiling is threads divided by time spent per request.",
      code: {
        title: "Example — Tomcat's knobs and their defaults",
        lang: "yaml",
        source: `server:
  tomcat:
    threads:
      max: 200            # request-processing threads (default 200)
      min-spare: 10       # kept warm (default 10)
    max-connections: 8192 # connections accepted and held by the NIO connector (default)
    accept-count: 100     # OS backlog once max-connections is reached (default)
    connection-timeout: 20s

# A request holds its thread while it waits on the database or an HTTP call.
# Waiting is the dominant cost in most services, so threads run out long
# before CPU does.`,
      },
      math: [
        { label: "Request threads", expr: "server.tomcat.threads.max", result: "200" },
        { label: "Healthy latency", expr: "200 threads ÷ 0.1 s", result: "2,000 req/s ceiling" },
        {
          label: "A dependency slows to 5 s",
          expr: "200 threads ÷ 5 s",
          result: "40 req/s",
          note: "Every endpoint shares the pool, so health checks and unrelated APIs time out too.",
        },
        {
          label: "With a 1 s client timeout on that call",
          expr: "200 ÷ ~1 s",
          result: "≈ 200 req/s and recovering",
        },
      ],
      bullets: [
        "The first defence is a timeout on every outbound call (chapter 31). Without one, a hung dependency converts all request threads into waiting threads.",
        "Raising threads.max rarely helps: more threads waiting on the same saturated database only lengthens the queue at the connection pool.",
      ],
      links: [{ label: "Lab: bulkheads and timeouts", href: "/playgrounds/bulkhead" }],
    },
    {
      heading: "Virtual threads, and where the bottleneck moves",
      lede: "Java 21 and Spring Boot 3.2 make a thread per request almost free.",
      code: {
        title: "Example — turning them on, and bounding what they wait on",
        lang: "java",
        source: `// application.yml
//   spring.threads.virtual.enabled: true
//
// Spring Boot then runs Tomcat request handling, the applicationTaskExecutor
// (@Async), and the task scheduler on virtual threads. Blocking I/O parks a
// virtual thread cheaply instead of holding an OS thread.

// THE CATCH: 10,000 concurrent requests now reach your code instead of 200.
// They all ask HikariCP for one of its 10 connections, or call a partner API
// that allows 50 concurrent requests. The limit did not disappear — it moved.

@Component
class PartnerApiClient {
    private final RestClient http;
    private final Semaphore permits = new Semaphore(50);   // the partner's real limit

    PartnerApiClient(RestClient.Builder builder) { this.http = builder.build(); }

    Quote quote(QuoteRequest request) {
        if (!permits.tryAcquire()) {                   // fail fast instead of queueing forever
            throw new PartnerBusyException();
        }
        try {
            return http.post().uri("/quotes").body(request).retrieve().body(Quote.class);
        } finally {
            permits.release();
        }
    }
}
// Resilience4j's bulkhead (chapter 31) is the configurable version of this.`,
      },
      diagram: {
        kind: "compare",
        caption: "Platform thread pool versus virtual threads for a blocking MVC service.",
        options: [
          {
            title: "Platform threads (default)",
            sub: "200 Tomcat threads",
            good: ["The pool itself caps concurrency", "Mature profiling and debugging"],
            bad: [
              "Throughput limited by waiting threads",
              "Each thread reserves stack memory; thousands are expensive",
            ],
            verdict: "Fine when latency is low and dependencies are fast.",
          },
          {
            title: "Virtual threads",
            sub: "spring.threads.virtual.enabled=true",
            good: [
              "Waiting is cheap — throughput tracks real downstream capacity",
              "Keeps simple blocking code; no reactive rewrite",
            ],
            bad: [
              "No implicit concurrency cap — add bulkheads and pool timeouts",
              "Blocking inside synchronized pins the carrier thread on JDK 21–23",
              "Large per-thread ThreadLocal caches multiply by the number of threads",
            ],
            verdict: "The default choice for new I/O-heavy MVC services on Java 21+.",
            tone: "ok",
          },
        ],
      },
      callout: {
        kind: "warn",
        title: "Pinning",
        text: "On JDK 21 to 23, a virtual thread that blocks while inside a synchronized block cannot unmount and keeps its carrier OS thread busy; enough of these and the few carrier threads are exhausted. Diagnose with -Djdk.tracePinnedThreads=full or JFR's jdk.VirtualThreadPinned event, and prefer ReentrantLock around blocking I/O. JDK 24 (JEP 491) removed this limitation for synchronized.",
      },
    },
    {
      heading: "@Async done right",
      lede: "The default executor accepts everything and remembers it all in memory.",
      code: {
        title: "Example — a bounded executor per workload",
        lang: "java",
        source: `// Spring Boot's auto-configured "applicationTaskExecutor" (platform threads):
//   spring.task.execution.pool.core-size: 8
//   spring.task.execution.pool.queue-capacity: unbounded
//   spring.task.execution.pool.max-size: unbounded
// A ThreadPoolExecutor only grows past core-size when the queue is FULL, and
// an unbounded queue is never full: 8 threads, an ever-growing backlog in the
// heap, and every queued task lost on restart.

@Configuration
@EnableAsync
class AsyncConfig {
    @Bean(name = "reportExecutor")
    ThreadPoolTaskExecutor reportExecutor(TaskDecorator mdcPropagation) {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("report-");
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(100);                                  // bounded
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy()); // tell the caller
        ex.setTaskDecorator(mdcPropagation);                       // carry the request id
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(20);
        return ex;
    }

    @Bean
    TaskDecorator mdcPropagation() {
        return task -> {
            Map<String, String> mdc = MDC.getCopyOfContextMap();
            return () -> {
                if (mdc != null) MDC.setContextMap(mdc);
                try { task.run(); } finally { MDC.clear(); }
            };
        };
    }
}

@Service
class ReportService {
    @Async("reportExecutor")                           // a separate pool = a bulkhead
    public CompletableFuture<Report> build(long id) {  // failures reach the caller
        return CompletableFuture.completedFuture(generate(id));
    }
}
// A void @Async method's exception goes only to AsyncUncaughtExceptionHandler —
// by default a log line. Return CompletableFuture when the caller must know.`,
      },
      bullets: [
        "@Async is for fire-and-forget work that may be lost on restart. Work that must happen belongs in a durable queue or an outbox, not in an in-memory executor.",
        "@Async methods are proxied (chapter 23): self-invocation runs them synchronously, and they do not share the caller's transaction or security context (chapters 24 and 27).",
      ],
    },
    {
      heading: "WebFlux and the event loop",
      lede: "A few threads serve many connections — as long as nobody blocks them.",
      code: {
        title: "Example — the blocking call that froze a gateway",
        lang: "java",
        source: `// Netty runs a small number of event-loop threads (roughly one per CPU core).
// Every connection assigned to a loop is served by that one thread.

@GetMapping("/v1/prices/{sku}")
Mono<Price> price(@PathVariable String sku) {
    return catalog.find(sku)                               // non-blocking
        .map(item -> legacyTaxService.computeBlocking(item)); // ← BLOCKS the event loop
}
// While computeBlocking waits 300 ms on a socket, every other request on that
// loop waits too. Latency for unrelated endpoints jumps by the full duration.

// If a blocking call is unavoidable, move it to a thread pool meant for it:
@GetMapping("/v1/prices/{sku}")
Mono<Price> price(@PathVariable String sku) {
    return catalog.find(sku)
        .flatMap(item -> Mono.fromCallable(() -> legacyTaxService.computeBlocking(item))
                             .subscribeOn(Schedulers.boundedElastic()));
}
// In tests, BlockHound fails the build when a blocking call runs on a
// non-blocking thread — the only reliable way to keep a reactive codebase honest.`,
      },
      table: {
        caption: "Choosing a model for a new service.",
        headers: ["Workload", "Spring MVC + virtual threads", "WebFlux"],
        rows: [
          ["CRUD over JDBC/JPA", "Natural fit", "Needs R2DBC; little benefit"],
          ["Calls several blocking SDKs", "Natural fit", "Every SDK call needs offloading"],
          [
            "Tens of thousands of idle streaming connections (SSE, WebSocket)",
            "Workable",
            "Natural fit",
          ],
          ["API gateway / proxy", "Workable", "Natural fit (Spring Cloud Gateway)"],
          ["Backpressure across a streaming pipeline", "Manual", "Built in"],
          [
            "Team debugging and stack traces",
            "Plain stack traces",
            "Operator chains; harder to read",
          ],
        ],
      },
    },
    {
      heading: "Sizing pools with arithmetic",
      lede: "Start from the scarcest resource and work outwards.",
      math: [
        {
          label: "Database pool (HikariCP guidance)",
          expr: "(DB CPU cores × 2) + effective spindles",
          result: "≈ 10–20 for a typical database",
          note: "This is per database, shared across ALL instances of the service.",
        },
        {
          label: "Instances × pool size",
          expr: "12 pods × 20 connections",
          result: "240 connections",
          note: "Compare with the database's max_connections and its CPU — this is what the database feels.",
        },
        {
          label: "Queueing at the pool",
          expr: "200 request threads → 20 connections",
          result: "180 threads waiting",
          note: "Set spring.datasource.hikari.connection-timeout to ~2–3 s so they fail fast instead of piling up for the default 30 s.",
        },
        {
          label: "Downstream bulkhead",
          expr: "partner limit 50 ÷ 12 pods",
          result: "≈ 4 permits per pod",
          note: "Per-instance limits must add up to the shared limit, or retries amplify the overload.",
        },
      ],
      callout: {
        kind: "insight",
        title: "Bigger pools usually make it slower",
        text: "A database with 8 cores does not do more work because 200 connections ask at once; it context-switches and contends on locks. A small pool with a short acquisition timeout keeps latency predictable and turns overload into fast, retryable errors.",
      },
      links: [
        {
          label: "HikariCP — about pool sizing",
          href: "https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing",
        },
        { label: "Lab: async calls versus rate limits", href: "/playgrounds/async-concurrency" },
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What happens to a Spring MVC service when a downstream API becomes slow?",
          a: "Each request holds a Tomcat thread while it waits, so the 200 threads fill up with waiting requests and throughput collapses for every endpoint, including unrelated ones. The fixes are timeouts on outbound calls, a bulkhead that limits concurrent calls to that dependency, and a circuit breaker to fail fast.",
        },
        {
          q: "Do virtual threads make a service faster?",
          a: "They do not make individual requests faster; they make waiting cheap, so throughput is no longer capped by a thread pool. The bottleneck moves to databases and downstream services, which is why you must bound concurrency to those explicitly and watch for pinning on older JDKs.",
        },
        {
          q: "What is wrong with Spring Boot's default @Async executor for production?",
          a: "It uses an unbounded queue, so it runs at most its core-size threads, never rejects work, and accumulates a backlog in memory that is lost on restart. Define bounded executors per workload with a rejection policy and a task decorator for context propagation.",
        },
        {
          q: "Why is calling JDBC inside a WebFlux handler a problem?",
          a: "JDBC blocks the thread, and WebFlux serves many connections on a few event-loop threads. Blocking one loop stalls every connection assigned to it. Use a reactive driver such as R2DBC, or offload the call with subscribeOn(Schedulers.boundedElastic()).",
        },
        {
          q: "How would you size a HikariCP pool?",
          a: "From the database's capacity, not the number of request threads: start around twice the database's CPU cores, remember the total is multiplied by the number of service instances, set a short connection timeout so exhaustion fails fast, and adjust from measured wait times rather than guesses.",
        },
      ],
      takeaways: [
        "Throughput is threads ÷ latency until a smaller pool runs out — find the smallest one.",
        "Virtual threads remove the thread cap; bulkheads put the right cap back.",
        "Bound every executor and queue, and never block an event loop.",
      ],
    },
  ],
  playground: "bulkhead",
  related: [
    "/java/multithreading",
    "/java/spring-http-resilience",
    "/java/spring-transactions",
    "/hld/bulkheads-load-shedding",
    "/hld/scaling",
  ],
  furtherReading: [
    {
      label: "Spring Boot — task execution and scheduling",
      href: "https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html",
    },
    {
      label: "JEP 444 — Virtual Threads",
      href: "https://openjdk.org/jeps/444",
    },
    {
      label: "Spring Framework — Spring WebFlux",
      href: "https://docs.spring.io/spring-framework/reference/web/webflux.html",
    },
  ],
};
