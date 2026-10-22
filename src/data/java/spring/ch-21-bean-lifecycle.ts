import type { Concept } from "@/data/types";

export const springBeanLifecycle: Concept = {
  slug: "bean-lifecycle",
  title: "Bean Lifecycle, Scopes & Circular Dependencies",
  subtitle:
    "Chapter 21 — creation to destruction, scope mismatches, choosing beans, and shutting down cleanly",
  level: "advanced",
  minutes: 26,
  tags: ["spring", "bean lifecycle", "scopes", "circular dependencies", "graceful shutdown"],
  summary:
    "Every Spring bean goes through the same sequence: construct, inject, initialise, wrap, use, destroy. The bugs live at the seams — a request-scoped bean read from a background thread, a prototype that is only ever created once, two services that need each other, a pod killed mid-request. Each has a mechanical cause and a mechanical fix.",
  keyPoints: [
    "The object you are injected with is whatever the last BeanPostProcessor returned — often a proxy, not your class.",
    "Injecting a shorter-lived bean into a longer-lived one freezes it: use ObjectProvider or a scoped proxy.",
    "Spring Boot refuses circular references by default; the fix is a design change, not re-enabling them.",
    "Constructor cycles can never be resolved — which is one more reason to use constructor injection.",
    "Graceful shutdown drains in-flight requests, but only if Kubernetes stops routing to the pod first.",
  ],
  prerequisites: ["/java/spring-framework", "/java/spring-boot-startup"],
  sections: [
    {
      heading: "The lifecycle of one singleton",
      lede: "Seven callbacks, always in the same order.",
      steps: [
        {
          title: "Instantiate",
          text: "The constructor runs, with constructor-injected dependencies already resolved.",
        },
        {
          title: "Populate",
          text: "Field and setter injection happen. Using an @Autowired field inside the constructor gives null — it has not been set yet.",
        },
        {
          title: "Aware callbacks",
          text: "BeanNameAware, BeanFactoryAware and ApplicationContextAware hand the bean its name and container.",
        },
        {
          title: "Before initialisation",
          text: "BeanPostProcessors run postProcessBeforeInitialization. @PostConstruct is invoked here, by CommonAnnotationBeanPostProcessor.",
        },
        {
          title: "Initialise",
          text: "InitializingBean.afterPropertiesSet(), then any custom init method.",
        },
        {
          title: "After initialisation",
          text: "postProcessAfterInitialization runs. AOP proxies for @Transactional, @Async and @Cacheable are created here and replace the bean in the container.",
          detail: "From this point the container hands out the proxy.",
        },
        {
          title: "Destroy",
          text: "On context close: @PreDestroy, DisposableBean.destroy(), then the destroy method. Beans are destroyed before the beans they depend on.",
          detail:
            "Prototype beans never receive destroy callbacks — the container forgets them after creation.",
        },
      ],
      code: {
        title: "Example — the order, observed",
        lang: "java",
        source: `@Component
class PriceCache implements InitializingBean, DisposableBean {
    private final PriceClient client;
    @Autowired private MeterRegistry meters;      // field injection, for the demo only

    PriceCache(PriceClient client) {
        this.client = client;
        log.info("1 constructor, meters = {}", meters);   // null — not injected yet
    }

    @PostConstruct void postConstruct()   { log.info("2 @PostConstruct, meters set"); }
    @Override public void afterPropertiesSet() { log.info("3 afterPropertiesSet"); }

    @PreDestroy void preDestroy()         { log.info("4 @PreDestroy"); }
    @Override public void destroy()       { log.info("5 destroy"); }
}

// Keep @PostConstruct cheap and local: validate your own configuration.
// Network calls here run while the container holds its creation lock and
// before the app can report liveness — slow, and invisible to health checks.`,
      },
      links: [
        {
          label: "Spring Framework — customizing the nature of a bean",
          href: "https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html",
        },
      ],
    },
    {
      heading: "Scopes, and the scope-mismatch trap",
      lede: "A singleton captures whatever it is given, once.",
      code: {
        title: "Example — the prototype that is only created once",
        lang: "java",
        source: `@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
class ImportJob {                        // meant to be fresh per use: holds progress state
    private int processed;
    void run(Path file) { ... }
}

// WRONG — the singleton is built once, so it receives ONE ImportJob forever.
// Two concurrent imports now share 'processed'.
@Service
class ImportService {
    private final ImportJob job;
    ImportService(ImportJob job) { this.job = job; }
}

// RIGHT — ask the container each time.
@Service
class ImportService {
    private final ObjectProvider<ImportJob> jobs;
    ImportService(ObjectProvider<ImportJob> jobs) { this.jobs = jobs; }

    void importFile(Path file) {
        jobs.getObject().run(file);      // a new ImportJob per call
    }
}

// Request-scoped beans injected into singletons work only through a proxy.
// @RequestScope defaults to a class-based proxy that looks up the CURRENT
// request's instance on every method call:
@Component
@RequestScope
class RequestContext { String tenantId; }`,
      },
      table: {
        caption: "Scopes and where each one breaks.",
        headers: ["Scope", "Lifetime", "Breaks when"],
        rows: [
          [
            "singleton",
            "The whole context",
            "It holds mutable per-request state — a race under load",
          ],
          [
            "prototype",
            "Each lookup",
            "Injected directly into a singleton — it becomes a singleton",
          ],
          [
            "request",
            "One HTTP request",
            "Read from an @Async or executor thread — “No thread-bound request found”",
          ],
          [
            "session",
            "One HTTP session",
            "The app scales out without sticky sessions or a shared session store",
          ],
        ],
      },
      callout: {
        kind: "warn",
        title: "Request scope does not cross threads",
        text: "A request-scoped proxy resolves the instance from a ThreadLocal set by the servlet thread. Hand work to @Async, a CompletableFuture or a virtual thread and that ThreadLocal is empty. Pass the values you need as arguments instead — it is also easier to test.",
      },
    },
    {
      heading: "Choosing between beans",
      lede: "Two beans of one type is normal; ambiguity is a design decision.",
      code: {
        title: "Example — @Primary, @Qualifier, and injecting all of them",
        lang: "java",
        source: `interface PaymentProvider { boolean supports(Currency c); Receipt charge(Payment p); }

@Component @Order(1)             class StripeProvider   implements PaymentProvider { ... }
@Component @Order(2)             class RazorpayProvider implements PaymentProvider { ... }
@Component @Primary              class RoutingProvider  implements PaymentProvider { ... }

@Service
class CheckoutService {
    // Single injection point: @Primary wins when no qualifier is given.
    CheckoutService(PaymentProvider provider) { ... }
}

@Service
class RefundService {
    // @Qualifier overrides @Primary — it names the bean.
    RefundService(@Qualifier("razorpayProvider") PaymentProvider provider) { ... }
}

@Component
class RoutingProvider implements PaymentProvider {
    private final List<PaymentProvider> delegates;

    // A List gets EVERY matching bean, sorted by @Order — a strategy registry
    // with no hand-written map. Filter out this bean itself.
    RoutingProvider(List<PaymentProvider> all) {
        this.delegates = all.stream().filter(p -> !(p instanceof RoutingProvider)).toList();
    }

    @Override public Receipt charge(Payment p) {
        return delegates.stream()
            .filter(d -> d.supports(p.currency()))
            .findFirst()
            .orElseThrow(() -> new UnsupportedCurrencyException(p.currency()))
            .charge(p);
    }
}`,
      },
      bullets: [
        "Inject Map<String, PaymentProvider> to key implementations by bean name — useful when a request names the provider.",
        "ObjectProvider<T>.ifAvailable(...) handles an optional dependency without Optional fields or null checks.",
        "Prefer @ConditionalOnProperty over profiles for toggling an implementation: a property states what it switches, a profile name rarely does.",
        "NoUniqueBeanDefinitionException at startup is a feature. Resolve it deliberately with @Primary or @Qualifier rather than deleting a bean until it goes away.",
      ],
    },
    {
      heading: "Circular dependencies",
      lede: "Spring Boot fails fast on them — and it is right to.",
      diagram: {
        kind: "flow",
        caption: "A cycle, and the two structural ways out of it.",
        rows: [
          [
            { id: "o", label: "OrderService", sub: "needs InvoiceService" },
            { id: "i", label: "InvoiceService", sub: "needs OrderService", tone: "bad" },
          ],
          [
            { id: "o2", label: "OrderService" },
            { id: "p", label: "PricingService", sub: "extracted shared logic", tone: "ok" },
            { id: "i2", label: "InvoiceService" },
          ],
          [
            { id: "o3", label: "OrderService", sub: "publishes OrderPlaced" },
            { id: "ev", label: "Application event", tone: "accent" },
            { id: "i3", label: "InvoiceService", sub: "@EventListener" },
          ],
        ],
      },
      code: {
        title: "Example — what Spring does, and why constructor cycles are fatal",
        lang: "java",
        source: `// Since Spring Boot 2.6, spring.main.allow-circular-references is false.
// Startup fails with:
//
//   The dependencies of some of the beans in the application context form a cycle:
//   ┌─────┐
//   |  orderService
//   ↑     ↓
//   |  invoiceService
//   └─────┘
//
// HOW SPRING *CAN* RESOLVE FIELD OR SETTER CYCLES (when allowed): it constructs
// OrderService, registers an "early reference" to the half-built object, and
// injects that into InvoiceService. With AOP, the early reference must already
// be the proxy, which adds another special case. It works — and it hides a
// design problem while handing out partially initialised objects.
//
// CONSTRUCTOR CYCLES CAN NEVER BE RESOLVED: neither object can be constructed
// without the other already existing. Fail-fast is the honest behaviour.

// The last-resort escape hatch: a lazy proxy on ONE side.
@Service
class InvoiceService {
    private final OrderService orders;
    InvoiceService(@Lazy OrderService orders) {   // a proxy, resolved on first call
        this.orders = orders;
    }
}
// Acceptable as a short-term unblock. The long-term fix is the diagram above:
// extract the shared piece, or invert one direction with an event.`,
      },
      callout: {
        kind: "insight",
        title: "A cycle is usually two responsibilities in the wrong place",
        text: "When A calls B and B calls A, some logic belongs in neither — or one of the calls is really a notification. Extracting a third bean or replacing the back-call with an application event makes the dependency graph a tree again, and both classes become testable in isolation.",
      },
    },
    {
      heading: "Shutdown, gracefully and in order",
      lede: "The last lifecycle phase is where deploys drop requests.",
      code: {
        title: "Example — draining a pod without errors",
        lang: "yaml",
        source: `# application.yml
server:
  shutdown: graceful                 # the default from Spring Boot 3.4; set it on older versions
spring:
  lifecycle:
    timeout-per-shutdown-phase: 25s  # stop waiting for in-flight work after this

# On SIGTERM: readiness goes to REFUSING_TRAFFIC, the web server stops accepting
# new connections and waits for in-flight requests, SmartLifecycle beans stop
# (message listeners first), then @PreDestroy callbacks run.

# Kubernetes deployment — the part people miss:
#   lifecycle:
#     preStop:
#       exec: { command: ["sleep", "10"] }   # let endpoints drop this pod first
#   terminationGracePeriodSeconds: 45       # > preStop + shutdown phase timeout
#
# Without preStop, SIGTERM and endpoint removal race: the load balancer keeps
# sending requests to a server that has stopped accepting them.`,
      },
      bullets: [
        "Destroy callbacks run in reverse dependency order, so a bean can still use its dependencies inside @PreDestroy.",
        "Executors you create yourself are not shut down for you unless they are beans with a destroy method. A ThreadPoolTaskExecutor bean is; a raw Executors.newFixedThreadPool() field is not.",
        "Kafka and other listener containers are SmartLifecycle beans and stop before singletons are destroyed — so a consumer does not process a record with a closed DataSource.",
      ],
      links: [
        {
          label: "Spring Boot — graceful shutdown",
          href: "https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html",
        },
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Walk me through a singleton bean's lifecycle.",
          a: "Instantiate through the constructor, populate field and setter dependencies, call Aware interfaces, run BeanPostProcessor before-initialisation (which invokes @PostConstruct), call afterPropertiesSet and any init method, run after-initialisation (where AOP proxies are created), then on shutdown call @PreDestroy, destroy() and any destroy method.",
        },
        {
          q: "How do you inject a prototype bean into a singleton so that you get a new instance each time?",
          a: "Inject ObjectProvider<T> and call getObject() when you need one, or use a @Lookup method. Injecting the prototype directly gives the singleton a single instance for its whole life.",
        },
        {
          q: "Why can Spring resolve some circular dependencies but not constructor ones?",
          a: "With field or setter injection, Spring can construct one bean, expose an early reference to the unfinished object, and inject it into the other. With constructor injection neither object can be created without the other already existing. Spring Boot now rejects both by default, and the right answer is to remove the cycle.",
        },
        {
          q: "Why does reading a request-scoped bean in an @Async method fail?",
          a: "The scoped proxy looks up the current request from a ThreadLocal bound to the servlet thread. The async executor thread has no request bound, so the lookup fails. Pass the needed values into the async method as arguments.",
        },
      ],
      takeaways: [
        "Initialisation callbacks are for local validation; slow work belongs after readiness.",
        "Match scopes by lifetime, and bridge mismatches with ObjectProvider or a scoped proxy.",
        "Treat a circular-dependency failure as design feedback.",
      ],
    },
  ],
  related: [
    "/java/spring-boot-startup",
    "/java/spring-aop",
    "/java/spring-framework",
    "/lld/dependency-injection",
    "/java/multithreading",
  ],
  furtherReading: [
    {
      label: "Spring Framework — bean scopes",
      href: "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html",
    },
    {
      label: "Spring Framework — dependencies and configuration",
      href: "https://docs.spring.io/spring-framework/reference/core/beans/dependencies.html",
    },
    {
      label: "Spring Boot — graceful shutdown",
      href: "https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html",
    },
  ],
};
