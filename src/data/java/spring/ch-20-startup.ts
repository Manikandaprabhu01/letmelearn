import type { Concept } from "@/data/types";

export const springStartup: Concept = {
  slug: "spring-boot-startup",
  title: "How Spring Boot Starts",
  subtitle: "Chapter 20 — from main() to ready: the environment, refresh(), and what slows it down",
  level: "advanced",
  minutes: 28,
  tags: ["spring boot", "startup", "application context", "bean post processor", "native image"],
  summary:
    "SpringApplication.run() is a fixed sequence: build the Environment, create the context, refresh it, start the web server, run your runners, then declare the app ready. Almost every startup question — why a property is missing, why a bean exists, why the pod is not ready yet, why boot takes nine seconds — is answered by knowing which step you are in.",
  keyPoints: [
    "The Environment is complete before a single bean exists — that is why EnvironmentPostProcessor is the only hook that can change configuration for everything.",
    "refresh() turns bean definitions into objects: BeanFactoryPostProcessors edit definitions, BeanPostProcessors wrap instances.",
    "Tomcat is created in onRefresh() but only accepts connections after every singleton is built.",
    "Readiness flips to ACCEPTING_TRAFFIC only after ApplicationRunners finish, so slow runner work keeps the pod out of the load balancer.",
    "Measure startup with ApplicationStartup and /actuator/startup before reaching for lazy init, CDS or native images.",
  ],
  prerequisites: ["/java/spring-framework", "/java/annotations-reflection"],
  sections: [
    {
      heading: "From main() to a running context",
      lede: "The eleven steps inside SpringApplication.run().",
      steps: [
        {
          title: "Construct SpringApplication",
          text: "Deduces the web application type from the classpath — SERVLET if Spring MVC and a servlet container are present, REACTIVE for WebFlux only, otherwise NONE — and loads initializers and listeners from META-INF/spring.factories.",
        },
        {
          title: "Fire ApplicationStartingEvent",
          text: "Nothing is configured yet. Logging is barely initialised, so listeners at this point must be registered programmatically or via spring.factories — a @Component cannot hear it.",
        },
        {
          title: "Prepare the Environment",
          text: "Command-line arguments, environment variables, system properties and application.yml become ordered PropertySources. EnvironmentPostProcessors run here, including the one that loads config data and spring.config.import.",
          detail: "ApplicationEnvironmentPreparedEvent fires once this is complete.",
        },
        {
          title: "Create the ApplicationContext",
          text: "For a servlet app this is a ServletWebServerApplicationContext. Primary sources — your @SpringBootApplication class — are registered as bean definitions.",
        },
        {
          title: "refresh()",
          text: "The big one: bean definitions are discovered and processed, the embedded server is created, and every non-lazy singleton is instantiated. Covered step by step in the next section.",
        },
        {
          title: "ApplicationStartedEvent",
          text: "The context is refreshed and liveness becomes CORRECT, but the app is not yet ready for traffic.",
        },
        {
          title: "Call ApplicationRunner and CommandLineRunner beans",
          text: "In @Order order, on the main thread. An exception here fails startup.",
        },
        {
          title: "ApplicationReadyEvent",
          text: "Readiness becomes ACCEPTING_TRAFFIC. /actuator/health/readiness now returns UP and Kubernetes routes traffic to the pod.",
        },
      ],
      diagram: {
        kind: "flow",
        caption: "The events you can listen for, in the order they fire.",
        rows: [
          [
            { id: "st", label: "Starting", sub: "nothing configured" },
            { id: "env", label: "EnvironmentPrepared", sub: "config loaded", tone: "accent" },
            { id: "ctx", label: "ContextPrepared", sub: "context created" },
          ],
          [
            { id: "ref", label: "refresh()", sub: "beans built, server created", tone: "accent" },
            { id: "started", label: "Started", sub: "liveness CORRECT" },
            { id: "run", label: "Runners", sub: "your startup code" },
          ],
          [
            { id: "ready", label: "Ready", sub: "readiness ACCEPTING_TRAFFIC", tone: "ok" },
            { id: "fail", label: "Failed", sub: "on any exception", tone: "bad" },
          ],
        ],
      },
      callout: {
        kind: "interview",
        title: "What @SpringBootApplication actually is",
        text: "Three annotations: @SpringBootConfiguration (a @Configuration), @EnableAutoConfiguration (import the auto-configuration classes listed in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports), and @ComponentScan rooted at the class's package. That last part is why a controller in a sibling package is silently never registered.",
      },
      links: [
        {
          label: "Spring Boot — SpringApplication",
          href: "https://docs.spring.io/spring-boot/reference/features/spring-application.html",
        },
      ],
    },
    {
      heading: "Inside refresh(): where beans come from",
      lede: "Definitions first, then objects — two different kinds of extension point.",
      table: {
        caption: "AbstractApplicationContext.refresh(), in order.",
        headers: ["Phase", "What happens", "Why you care"],
        rows: [
          [
            "invokeBeanFactoryPostProcessors",
            "ConfigurationClassPostProcessor parses @Configuration, @ComponentScan, @Import and auto-configuration imports into bean definitions; conditions are evaluated",
            "Every bean that will ever exist is decided here — no instances yet",
          ],
          [
            "registerBeanPostProcessors",
            "Post-processors are instantiated early and ordered",
            "These wrap beans later: @Autowired, @Async, AOP proxies",
          ],
          [
            "onRefresh",
            "The embedded Tomcat, Jetty or Undertow is created and initialised",
            "The port is bound, but requests are not processed yet",
          ],
          [
            "finishBeanFactoryInitialization",
            "Every non-lazy singleton is constructed, injected, initialised and proxied",
            "Most startup time is spent here; circular dependencies fail here",
          ],
          [
            "finishRefresh",
            "SmartLifecycle beans start — including the web server connector and message listeners",
            "Only now does the app process HTTP requests or consume from Kafka",
          ],
        ],
      },
      code: {
        title: "Example — editing definitions versus wrapping instances",
        lang: "java",
        source: `// BeanFactoryPostProcessor: runs on DEFINITIONS, before any bean is created.
// Declare it with a STATIC @Bean method — a non-static one forces its whole
// @Configuration class to be instantiated early, before post-processors exist,
// so that class loses @Autowired and proxying. Spring logs a warning for this.
@Bean
static BeanFactoryPostProcessor makeReportsLazy() {
    return factory -> {
        for (String name : factory.getBeanNamesForType(ReportGenerator.class)) {
            factory.getBeanDefinition(name).setLazyInit(true);
        }
    };
}

// BeanPostProcessor: runs on every INSTANCE, around its init callbacks.
// This is the mechanism behind @Transactional, @Async and @Cacheable — the
// object returned from postProcessAfterInitialization is what gets injected.
@Component
class TimingPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        if (bean instanceof PaymentGateway gateway) {
            return new TimedPaymentGateway(gateway);   // callers receive the WRAPPER
        }
        return bean;
    }
}`,
      },
      bullets: [
        "If you need to change which beans exist, you need a definition-level hook (a condition, a BeanFactoryPostProcessor, or an ImportSelector). By the time a BeanPostProcessor runs, the decision has been made.",
        "BeanPostProcessors are created before ordinary beans, so any bean a post-processor depends on is created too early and is not eligible for all post-processing — Spring logs “is not eligible for getting processed by all BeanPostProcessors”. Keep their dependencies minimal and inject lazily.",
        "Message listeners and scheduled tasks start in finishRefresh via SmartLifecycle. A consumer that starts before your caches are warm is a lifecycle-phase problem, solved with SmartLifecycle.getPhase(), not with Thread.sleep.",
      ],
      links: [
        {
          label: "Spring Framework — container extension points",
          href: "https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html",
        },
      ],
    },
    {
      heading: "Which hook to use",
      lede: "Most “startup code” belongs in exactly one of these.",
      table: {
        headers: ["Hook", "Runs", "Use it for"],
        rows: [
          [
            "EnvironmentPostProcessor",
            "Before the context exists",
            "Adding property sources everything must see — decrypted secrets, a platform's config",
          ],
          [
            "@Conditional on a @Bean",
            "While definitions are processed",
            "Choosing whether a bean exists",
          ],
          [
            "@PostConstruct",
            "After one bean is injected",
            "Validating that bean's own configuration — cheap, local work only",
          ],
          [
            "SmartInitializingSingleton",
            "After all singletons exist",
            "Cross-bean wiring that needs the whole context",
          ],
          [
            "ApplicationRunner",
            "After refresh, before ready",
            "Work that must finish before taking traffic, such as a cache warm-up",
          ],
          [
            "@EventListener(ApplicationReadyEvent)",
            "After the app is ready",
            "Work that must not delay readiness — kick it off asynchronously",
          ],
        ],
      },
      code: {
        title: "Example — the runner that kept every pod out of rotation",
        lang: "java",
        source: `// BEFORE: a 90-second backfill in a runner. Readiness stays DOWN until it
// finishes, so a rolling deploy waits 90 s per pod — or the readiness probe's
// failure threshold kills the pod and it never becomes ready at all.
@Component
class BackfillRunner implements ApplicationRunner {
    @Override public void run(ApplicationArguments args) {
        backfill.recomputeAllTotals();                      // ← blocks readiness
    }
}

// AFTER: start taking traffic, run the backfill in the background.
@Component
class Backfill {
    private final BackfillService backfill;
    private final TaskExecutor executor;
    Backfill(BackfillService backfill, TaskExecutor executor) {
        this.backfill = backfill;
        this.executor = executor;
    }

    @EventListener(ApplicationReadyEvent.class)
    void start() {
        executor.execute(backfill::recomputeAllTotals);     // readiness already UP
    }
}

// And only warm what the first request genuinely needs in a runner.`,
      },
      callout: {
        kind: "warn",
        title: "Every replica runs its startup code",
        text: "Runners and ready listeners execute on every instance. A migration or backfill started this way runs once per pod, concurrently. Anything that must happen once belongs in a migration tool (Flyway, Liquibase — which take a lock), a Kubernetes Job, or behind a distributed lock such as ShedLock.",
      },
    },
    {
      heading: "Why startup is slow, and what actually helps",
      lede: "Measure the steps first — the usual suspect is rarely the real one.",
      code: {
        title: "Example — recording every startup step",
        lang: "java",
        source: `public static void main(String[] args) {
    SpringApplication app = new SpringApplication(OrderApplication.class);
    // Buffers timing for context phases, bean creation and config-class parsing.
    app.setApplicationStartup(new BufferingApplicationStartup(4096));
    app.run(args);
}

// application.yml
//   management.endpoints.web.exposure.include: health,startup
//
// GET /actuator/startup returns every recorded step with its duration.
// Sort by duration: a single bean doing network I/O in its constructor, or
// Hibernate validating two hundred entities, usually dominates the list.`,
      },
      diagram: {
        kind: "compare",
        caption: "Three ways to start faster, and what each one costs.",
        options: [
          {
            title: "Lazy initialisation",
            sub: "spring.main.lazy-initialization=true",
            good: ["No build changes", "Beans are created only when first used"],
            bad: [
              "Misconfiguration fails on the first request, not at boot",
              "First requests are slow — the cost moved, it did not vanish",
            ],
            verdict: "Fine for local development; risky in production.",
            tone: "warn",
          },
          {
            title: "Class Data Sharing",
            sub: "Extract the jar, train an archive, run with it",
            good: ["Same JVM, same behaviour", "Loads parsed classes from a shared archive"],
            bad: ["An extra build step", "Helps class loading, not your own slow beans"],
            verdict: "The low-risk win for a normal JVM service.",
            tone: "ok",
          },
          {
            title: "GraalVM native image",
            sub: "Spring AOT + native compilation",
            good: ["Starts in a fraction of the time", "Much smaller memory footprint"],
            bad: [
              "Long builds; reflection and proxies need hints",
              "No JIT warm-up — peak throughput can be lower",
              "Some libraries are not native-ready",
            ],
            verdict: "Worth it for scale-to-zero and CLI-like workloads.",
          },
        ],
      },
      bullets: [
        "Look for I/O in constructors and @PostConstruct: remote config fetches, schema validation against a live database, or warming a cache from another service.",
        "spring.jpa.hibernate.ddl-auto=validate touches every entity at boot; that is a deliberate trade — fail fast against schema drift — so measure before removing it.",
        "Fewer auto-configurations means less condition evaluation. Excluding starters you do not use helps more than hand-excluding individual auto-configuration classes.",
        "Spring AOT processing runs the bean-definition phase at build time and generates code for it. It is required for native images, and it is also what makes behaviour that depends on runtime conditions (for example, a @Profile chosen at startup) harder.",
      ],
      links: [
        {
          label: "Spring Boot — GraalVM native images",
          href: "https://docs.spring.io/spring-boot/reference/packaging/native-image/index.html",
        },
        {
          label: "Spring Boot — class data sharing",
          href: "https://docs.spring.io/spring-boot/reference/packaging/class-data-sharing.html",
        },
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the difference between a BeanFactoryPostProcessor and a BeanPostProcessor?",
          a: "A BeanFactoryPostProcessor edits bean definitions before any bean is instantiated — it can change scope, laziness or property values, or register new definitions. A BeanPostProcessor sees each bean instance around its initialisation callbacks and may return a different object, which is how proxies for @Transactional and @Async replace your bean.",
        },
        {
          q: "When does the embedded Tomcat start accepting requests?",
          a: "It is created in onRefresh(), but the connector starts in finishRefresh() through a SmartLifecycle bean — after every non-lazy singleton has been built. So a request cannot reach a half-initialised context.",
        },
        {
          q: "Where do auto-configurations come from in Spring Boot 3?",
          a: "From META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports in each jar. @EnableAutoConfiguration imports the classes listed there, and their @Conditional annotations decide which contribute beans. Spring Boot 2.x used spring.factories for this; Boot 3 removed that route for auto-configurations.",
        },
        {
          q: "Our pods take four minutes to become ready after a deploy. Where do you look?",
          a: "First, /actuator/startup or the startup log to see whether boot itself is slow or the app is waiting on something. Then ApplicationRunners and anything blocking before ApplicationReadyEvent, because readiness only goes UP after them. Then the readiness probe's initial delay and failure threshold. Only after that would I consider lazy initialisation, CDS or native images.",
        },
      ],
      takeaways: [
        "Configuration is decided before beans; bean existence is decided before instances; wrapping happens per instance.",
        "Readiness follows runners — keep them short or move work after ApplicationReadyEvent.",
        "Startup performance work starts with the startup endpoint, not with flags.",
      ],
    },
  ],
  related: [
    "/java/bean-lifecycle",
    "/java/spring-configuration",
    "/java/spring-framework",
    "/java/cloud-computing",
    "/hld/containers-kubernetes",
  ],
  furtherReading: [
    {
      label: "Spring Boot — SpringApplication reference",
      href: "https://docs.spring.io/spring-boot/reference/features/spring-application.html",
    },
    {
      label: "Spring Framework — the IoC container",
      href: "https://docs.spring.io/spring-framework/reference/core/beans.html",
    },
    {
      label: "Spring Boot — Kubernetes probes and availability",
      href: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.kubernetes-probes",
    },
  ],
};
