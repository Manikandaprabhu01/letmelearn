export type JavaBlueprint = {
  title: string;
  subtitle: string;
  badge: string;
  diagram: string;
  explanation: string;
  keyComponents: { name: string; role: string; productionAdvice: string }[];
};

export type JavaTopicQA = {
  id: string;
  category: string;
  question: string;
  difficulty: "M" | "H";
  summary: string;
  fullAnswer: string;
  codeSnippet?: { lang: string; snippet: string };
  followUps: { q: string; a: string }[];
};

export type JavaCompanyTrack = {
  id: string;
  company: string;
  companySlug: string;
  roleTitle: string;
  focusArea: string;
  roundsSummary: string;
  barRaiserTenet: string;
  questions: {
    id: string;
    title: string;
    difficulty: "M" | "H";
    scenario: string;
    whatInterviewerIsTesting: string;
    architectureBlueprint: string;
    codeSnippet?: { lang: string; code: string };
    tradeoffs: string[];
    followUps: { q: string; a: string }[];
  }[];
};

export const JAVA_BLUEPRINTS: JavaBlueprint[] = [
  {
    title: "JVM Memory Anatomy & Garbage Collection (G1 & ZGC)",
    subtitle: "Heap generations (Eden, Survivor, Tenured), Metaspace, and sub-millisecond ZGC colored pointers",
    badge: "JVM Internals",
    explanation:
      "Java execution performance depends on how objects move through memory. Most objects die young (Weak Generational Hypothesis). Minor GCs clean Eden and Survivor spaces in milliseconds; Old Generation collections (G1 Mixed GC or ZGC concurrent phases) manage long-lived caches and singletons.",
    diagram: `┌────────────────────────────────────────────────────────────────────────┐
│                          JVM PROCESS MEMORY                            │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                        JVM HEAP (-Xms / -Xmx)                      │ │
│ │ ┌───────────────────────────────────────┐ ┌──────────────────────┐ │ │
│ │ │            YOUNG GENERATION           │ │    OLD GENERATION    │ │ │
│ │ │ ┌───────────┬───────────┬───────────┐ │ │      (Tenured)       │ │ │
│ │ │ │   Eden    │Survivor S0│Survivor S1│ │ │                      │ │ │
│ │ │ └───────────┴───────────┴───────────┘ │ │                      │ │ │
│ │ └───────────────────────────────────────┘ └──────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ │
│ │  Metaspace (Non-Heap)│ │  Thread Stacks (1MB) │ │  JIT Code Cache  │ │
│ │ (Class Definitions)  │ │ (Local frames, ptrs) │ │ (Compiled C2 asm)│ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘`,
    keyComponents: [
      {
        name: "Eden Space & Minor GC",
        role: "New objects allocated here. Fast sequential pointer-bump allocation",
        productionAdvice: "Size Eden so short-lived request objects die before promotion to Old Gen",
      },
      {
        name: "Survivor Spaces (S0 / S1)",
        role: "Semi-space copying collector. Objects promoted after surviving aging threshold (TenuringThreshold)",
        productionAdvice: "Premature promotion happens if Survivor space is too small, bloating Old Gen",
      },
      {
        name: "ZGC (Z Garbage Collector)",
        role: "Sub-millisecond max pause time collector utilizing Colored Pointers and Load Barriers",
        productionAdvice: "Mandatory for latency-critical financial/trading microservices with large heaps (16GB - 16TB)",
      },
    ],
  },
  {
    title: "Spring Boot DispatcherServlet Request Lifecycle",
    subtitle: "Filter chain, DispatcherServlet, HandlerMapping, Interceptors, Controller, and ViewResolver/MessageConverter",
    badge: "Spring Core",
    explanation:
      "Every HTTP request in a Spring Boot application travels through a deterministic pipeline. Security filters execute first, followed by the central DispatcherServlet front controller, which dispatches to handler mappings, runs interceptors, executes the controller, and serializes responses via Jackson HttpMessageConverters.",
    diagram: `[ HTTP Request: GET /api/v1/orders ]
                │
                ▼
  [ Servlet Container (Tomcat / Jetty) ]
                │
                ▼
  [ Security Filter Chain (OncePerRequestFilter, JWT Auth) ]
                │
                ▼
  [ DispatcherServlet (Front Controller) ]
        │
        ├── 1. Query [ HandlerMapping ] -> Finds OrderController#getOrder
        │
        ├── 2. Execute [ HandlerInterceptor.preHandle() ] (Tracing, Metrics)
        │
        ├── 3. Execute [ Controller Method ] -> Invokes @Service / @Repository
        │
        ├── 4. Execute [ HandlerInterceptor.postHandle() ]
        │
        ├── 5. [ HttpMessageConverter (MappingJackson2) ] -> Serializes JSON
        │
        └── 6. Execute [ HandlerInterceptor.afterCompletion() ]
                │
                ▼
[ HTTP 200 JSON Response Streamed to Client ]`,
    keyComponents: [
      {
        name: "Security Filter Chain",
        role: "Authenticates JWT bearer tokens and rejects unauthorized requests before hitting Spring context",
        productionAdvice: "Keep filters stateless and avoid database queries inside filter loops",
      },
      {
        name: "DispatcherServlet",
        role: "Central dispatching coordinator mapping requests to handler adapters and managing exception resolvers",
        productionAdvice: "Use @ControllerAdvice / @ExceptionHandler for centralized, consistent error response payloads",
      },
    ],
  },
];

export const JAVA_TOPIC_QA_LIBRARY: JavaTopicQA[] = [
  {
    id: "java-qa-transactional-self-invocation",
    category: "Spring Framework",
    question: "Why does calling an internal @Transactional method from another method in the same class fail to start a database transaction?",
    difficulty: "H",
    summary:
      "Spring @Transactional relies on Dynamic Proxies (CGLIB or JDK dynamic proxies). When a method calls another method within the same class (this.method()), the call bypasses the Spring proxy and invokes the raw target instance directly.",
    fullAnswer: `### The Classic Spring Pitfall
\`\`\`java
@Service
public class OrderService {

    public void processOrder(Order order) {
        // Validation logic...
        saveOrderWithAudit(order); // SELF-INVOCATION!
    }

    @Transactional
    public void saveOrderWithAudit(Order order) {
        orderRepository.save(order);
        auditRepository.record(order.getId());
        // If an exception throws here, transaction does NOT rollback!
    }
}
\`\`\`

### Why It Fails
Spring implements declarative transaction management via **AOP Proxies**:
\`\`\`
[ Caller ] ──► [ Spring CGLIB Proxy ($OrderService$$EnhancerBySpringCGLIB) ]
                      │ (Begins Transaction: DataSourceUtils.getConnection())
                      ▼
               [ Target Real OrderService Instance ]
                      │ (processOrder method executes)
                      │
                      └── Calls this.saveOrderWithAudit()  <-- DIRECT POINTER!
\`\`\`
Because \`processOrder\` invokes \`this.saveOrderWithAudit()\`, execution remains entirely inside the raw target instance, completely bypassing the Spring proxy wrapper. The \`@Transactional\` annotation on \`saveOrderWithAudit\` is completely ignored!

### The Three Production Solutions
1. **Refactor into a Separate Service (Recommended):** Move \`saveOrderWithAudit\` to a separate \`OrderWriterService\`. The proxy intercepts the call cleanly.
2. **Self-Injection:** Inject \`@Lazy private OrderService self;\` and invoke \`self.saveOrderWithAudit()\`.
3. **TransactionTemplate:** Use programmatic transaction management instead of annotations for dynamic scenarios:
   \`transactionTemplate.execute(status -> { ... });\`.`,
    codeSnippet: {
      lang: "java",
      snippet: `// Solution: Refactoring into clean seam with separate transactional delegate
@Service
public class OrderService {
    private final OrderPersistenceService persistenceService;

    public OrderService(OrderPersistenceService persistenceService) {
        this.persistenceService = persistenceService;
    }

    public void processOrder(Order order) {
        // Proxy intercepts persistenceService call properly!
        persistenceService.saveOrderWithAudit(order);
    }
}`,
    },
    followUps: [
      {
        q: "How does @Transactional propagation REQUIRED differ from REQUIRES_NEW?",
        a: "REQUIRED joins the existing transaction if one exists, or creates a new one if none exists. REQUIRES_NEW always suspends any existing outer transaction and starts an independent physical database transaction. If the inner REQUIRES_NEW transaction commits, its data remains committed even if the outer transaction subsequently rolls back.",
      },
    ],
  },
];

export const JAVA_COMPANY_TRACKS: JavaCompanyTrack[] = [
  {
    id: "goldman-java-fintech",
    company: "Goldman Sachs / Morgan Stanley",
    companySlug: "goldman",
    roleTitle: "Vice President / Lead Java Systems Engineer",
    focusArea: "Ultra-Low-Latency Order Execution & Concurrency",
    roundsSummary: "Core Java Internals + Concurrency & JMM + Low-Latency System Design + Live Problem Solving",
    barRaiserTenet:
      "Zero-GC Allocation & Lock-Free Concurrency: Financial engineering loops test whether you can design trading engines that process 100k events/sec without triggering Garbage Collection stop-the-world pauses.",
    questions: [
      {
        id: "goldman-low-latency-trading",
        title: "Design a Zero-GC In-Memory Order Book with LMAX Disruptor",
        difficulty: "H",
        whatInterviewerIsTesting:
          "Can you design a lock-free, single-writer order book that eliminates thread contention and avoids object allocations in the hot path?",
        scenario:
          "Design a matching engine for high-frequency stock trading processing 500,000 orders/sec with a p99 latency target under 15 microseconds. Traditional synchronized queues and object instantiations (new Order()) cause GC pause spikes that violate trading exchange regulations.",
        architectureBlueprint: `### 1. Eliminating Lock Contention: The LMAX Disruptor Pattern
Standard \`BlockingQueue\` uses locks and condition variables, causing context switches and CPU cache invalidations (false sharing).
- **RingBuffer:** Fixed-size pre-allocated circular buffer (power of 2) residing in contiguous CPU L1/L2/L3 cache lines.
- **Lock-Free Sequencing:** Uses atomic memory barriers and single-writer sequence counters without mutex locks.

### 2. Zero-GC Memory Pre-allocation
- Pre-allocate all Order events at startup: \`OrderEvent[] events = new OrderEvent[1024 * 1024];\`
- During live trading, the engine never calls \`new\`. It claims an empty slot on the RingBuffer and populates primitive fields directly.
- **Cache-Line Padding:** Pad sequence counters with 56 dummy bytes (7 longs) to guarantee the sequence number occupies its own 64-byte CPU cache line, eliminating **False Sharing** across CPU cores.`,
        tradeoffs: [
          "Avoid using java.util.Date or BigDecimal in high-frequency trading hot paths; use primitive long integer timestamps and fixed-point integers (e.g. price in cents).",
        ],
        followUps: [
          {
            q: "What is False Sharing and how does @Contended prevent it in Java 8+?",
            a: "False Sharing occurs when two threads on different CPU cores modify independent variables that happen to reside on the same 64-byte hardware cache line. Core 1 modifying Variable A forces Core 2's cache line to invalidate, destroying performance. @Contended adds hardware cache-line padding to isolate variables onto distinct cache lines.",
          },
        ],
      },
    ],
  },
];
