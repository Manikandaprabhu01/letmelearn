import type { Concept } from "@/data/types";

export const springAop: Concept = {
  slug: "spring-aop",
  title: "AOP & Proxies in Depth",
  subtitle:
    "Chapter 23 — JDK versus CGLIB proxies, writing aspects, advice ordering, and every annotation that silently depends on a proxy",
  level: "advanced",
  minutes: 26,
  tags: ["spring", "aop", "proxies", "cglib", "aspects", "self-invocation"],
  summary:
    "Spring AOP does not change your bytecode. It puts a proxy object in front of your bean, and advice runs only when a call passes through that proxy. From that one fact follow all the rules: final and private methods are not advised, internal calls skip the advice, the order of proxies decides whether a retry gets a fresh transaction, and even @Configuration classes are quietly subclassed.",
  keyPoints: [
    "Spring Boot proxies classes with CGLIB subclasses by default, even when the bean implements an interface.",
    "A proxy can only intercept calls that come from outside the object, to methods it can override.",
    "@Around advice must call proceed() exactly once and must not swallow the exception by accident.",
    "Advice order is set with @Order; lower values wrap further out — put retries outside transactions.",
    "@Transactional, @Cacheable, @Async, @PreAuthorize, @Validated and @Retryable are all AOP — the same limits apply to each.",
  ],
  prerequisites: ["/java/spring-framework", "/java/bean-lifecycle", "/lld/proxy"],
  sections: [
    {
      heading: "Two kinds of proxy",
      lede: "What the container actually injects.",
      diagram: {
        kind: "compare",
        caption: "Spring Boot sets spring.aop.proxy-target-class=true, so CGLIB is the default.",
        options: [
          {
            title: "JDK dynamic proxy",
            sub: "implements the bean's interfaces",
            good: ["Standard Java — no bytecode generation", "Works with final classes"],
            bad: [
              "Only interface methods are advised",
              "Injecting the concrete class fails: the proxy is not an OrderServiceImpl",
            ],
            verdict: "Used when proxy-target-class is false and an interface exists.",
          },
          {
            title: "CGLIB subclass proxy",
            sub: "extends the bean's class at runtime",
            good: ["Injectable as the concrete type", "No interface required"],
            bad: [
              "final classes cannot be proxied at all",
              "final and private methods run WITHOUT advice, silently",
            ],
            verdict: "The Spring Boot default.",
            tone: "accent",
          },
        ],
      },
      code: {
        title: "Example — seeing the proxy, and the final-method trap",
        lang: "java",
        source: `@Service
public class OrderService {
    private final OrderRepository repository;
    OrderService(OrderRepository repository) { this.repository = repository; }

    @Transactional
    public void place(Order order) { repository.save(order); }        // advised ✅

    @Transactional
    public final void cancel(long id) { repository.deleteById(id); }  // NOT advised ❌
}

// orderService.getClass() → OrderService$$SpringCGLIB$$0
//
// WHY cancel() is dangerous, not just untransactional: a CGLIB subclass cannot
// override a final method, so the call runs on the PROXY object itself rather
// than being delegated to your bean. The proxy's own fields were never
// injected — 'repository' is null there — so you get a NullPointerException
// that seems impossible, because the constructor clearly assigns it.
//
// Kotlin classes are final by default; the kotlin-spring compiler plugin opens
// Spring-annotated classes for exactly this reason.`,
      },
      links: [
        {
          label: "Spring Framework — proxying mechanisms",
          href: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html",
        },
      ],
    },
    {
      heading: "Writing an aspect",
      lede: "Pointcut says where; advice says what.",
      code: {
        title: "Example — an audit aspect driven by a custom annotation",
        lang: "java",
        source: `@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)          // must be RUNTIME or the aspect cannot see it
public @interface Audited { String action(); }

@Aspect
@Component
@Order(10)
class AuditAspect {
    private final AuditPublisher audit;
    AuditAspect(AuditPublisher audit) { this.audit = audit; }

    // Binding the annotation as a parameter gives typed access to its values.
    @Around("@annotation(audited)")
    Object record(ProceedingJoinPoint call, Audited audited) throws Throwable {
        long start = System.nanoTime();
        try {
            Object result = call.proceed();                 // exactly once
            audit.success(audited.action(), call.getArgs(), elapsed(start));
            return result;                                  // return it, or the caller gets null
        } catch (Throwable failure) {
            audit.failure(audited.action(), failure, elapsed(start));
            throw failure;                                  // rethrow, or the failure vanishes
        }
    }
}

@Service
class RefundService {
    @Audited(action = "refund.issue")
    public Refund issue(RefundRequest request) { ... }
}`,
      },
      table: {
        caption: "Pointcut designators you will actually use.",
        headers: ["Pointcut", "Matches", "Note"],
        rows: [
          [
            "@annotation(com.acme.Audited)",
            "Methods carrying the annotation",
            "The clearest — intent is visible at the method",
          ],
          [
            "@within(org.springframework.stereotype.Service)",
            "All methods of classes with that annotation",
            "Broad cross-cutting rules",
          ],
          [
            "execution(* com.acme.billing..*Service.*(..))",
            "Methods by package and name pattern",
            "Powerful, and silently breaks when code is renamed",
          ],
          ["bean(*Client)", "Beans whose names match", "Spring-specific"],
        ],
      },
      bullets: [
        "@Around is the only advice that can change arguments, skip the call or replace the return value — and the only one where forgetting to return the result breaks the caller.",
        "Prefer annotation-based pointcuts. Package-pattern pointcuts apply to code whose authors never knew the aspect existed.",
        "Aspects run on every matching call. Anything expensive inside advice — reflection per call, synchronous I/O — multiplies across the service.",
      ],
    },
    {
      heading: "Advice ordering: which proxy wraps which",
      lede: "When two aspects match, order decides the semantics, not just the timing.",
      diagram: {
        kind: "sequence",
        caption: "Retry outside the transaction: every attempt gets a fresh transaction.",
        actors: [
          { id: "c", label: "Caller" },
          { id: "r", label: "Retry advice", sub: "@Order(1)" },
          { id: "t", label: "Transaction advice", sub: "lowest precedence" },
          { id: "m", label: "transfer()" },
        ],
        messages: [
          { from: "c", to: "r", label: "transfer()" },
          { from: "r", to: "t", label: "attempt 1" },
          { from: "t", to: "m", label: "BEGIN; invoke" },
          { from: "m", to: "t", label: "deadlock exception", kind: "return", tone: "bad" },
          { from: "t", to: "r", label: "ROLLBACK; rethrow", kind: "return" },
          { from: "r", to: "t", label: "attempt 2 after backoff" },
          { from: "t", to: "m", label: "BEGIN; invoke" },
          { from: "m", to: "t", label: "ok", kind: "return", tone: "ok" },
          { from: "t", to: "c", label: "COMMIT; return", kind: "return", tone: "ok" },
        ],
      },
      code: {
        title: "Example — getting the order right",
        lang: "java",
        source: `// The transaction advisor runs at Ordered.LOWEST_PRECEDENCE by default, which
// makes it the INNERMOST advice. Lower @Order values wrap further out.

@Aspect
@Component
@Order(1)                                  // outside the transaction
class DeadlockRetryAspect {
    @Around("@annotation(RetryOnDeadlock)")
    Object retry(ProceedingJoinPoint call) throws Throwable {
        for (int attempt = 1; ; attempt++) {
            try {
                return call.proceed();     // each proceed() passes through the tx advice again
            } catch (CannotAcquireLockException e) {
                if (attempt == 3) throw e;
                Thread.sleep(50L * attempt);
            }
        }
    }
}

// THE WRONG ORDER (retry INSIDE the transaction) retries on a transaction that
// the database has already marked as failed. In PostgreSQL every statement then
// errors with "current transaction is aborted"; with Spring it ends in
// UnexpectedRollbackException. The retry cannot succeed by construction.`,
      },
      callout: {
        kind: "insight",
        title: "The same rule for caching and security",
        text: "Put @PreAuthorize outside @Cacheable, or a cached result computed for one user can be returned to another who fails the check. In general: decide whether the call is allowed, then whether to retry it, then open the transaction.",
      },
    },
    {
      heading: "Self-invocation, and the fixes ranked",
      lede: "Chapter 18 showed the bug. These are the options, from best to worst.",
      table: {
        headers: ["Fix", "How", "Cost"],
        rows: [
          [
            "Move the method to another bean",
            "The caller injects the second bean and calls through its proxy",
            "Best — it usually reveals a missing responsibility",
          ],
          [
            "Programmatic API",
            "TransactionTemplate.execute(...) instead of @Transactional on the inner method",
            "Explicit and proxy-free; more verbose",
          ],
          [
            "Inject yourself lazily",
            "@Lazy OrderService self, then self.inner()",
            "Works; confuses readers and hides the design smell",
          ],
          [
            "AopContext.currentProxy()",
            "Requires @EnableAspectJAutoProxy(exposeProxy = true)",
            "Couples business code to Spring AOP internals",
          ],
          [
            "AspectJ weaving",
            "Compile-time or load-time weaving edits bytecode directly",
            "Advises this-calls, private and final methods; heavier build and debugging",
          ],
        ],
      },
      code: {
        title: "Example — the programmatic option",
        lang: "java",
        source: `@Service
class ReportService {
    private final TransactionTemplate tx;
    ReportService(PlatformTransactionManager manager) {
        this.tx = new TransactionTemplate(manager);
    }

    public void generateAll(List<Long> ids) {
        for (Long id : ids) {
            tx.executeWithoutResult(status -> generateOne(id));  // one transaction per report
        }
    }

    private void generateOne(Long id) { ... }   // no annotation to be bypassed
}`,
      },
    },
    {
      heading: "What else is a proxy",
      lede: "More of Spring than you might expect.",
      bullets: [
        "@Transactional, @Cacheable, @Async, @Retryable, @PreAuthorize and @Validated method validation are AOP advisors — every rule in this chapter applies to each.",
        "Spring Data repository interfaces are JDK proxies delegating to SimpleJpaRepository plus generated query methods.",
        "Scoped proxies (@RequestScope) and @Lazy injection points are proxies that look up the real target on each call.",
        "@Scheduled and @EventListener are not proxies: a post-processor registers them at startup, so self-invocation is not the issue there — scheduling on a non-bean is.",
      ],
      code: {
        title: "Example — why @Bean methods return the same instance",
        lang: "java",
        source: `@Configuration                        // the class itself is CGLIB-subclassed
class ClientConfig {
    @Bean HttpClient httpClient() { return HttpClient.newHttpClient(); }

    @Bean PaymentClient paymentClient() {
        return new PaymentClient(httpClient());    // intercepted: returns the SINGLETON
    }
    @Bean InventoryClient inventoryClient() {
        return new InventoryClient(httpClient());  // the same instance again
    }
}

// With @Configuration(proxyBeanMethods = false) — "lite mode", used throughout
// Spring Boot's own auto-configuration for faster startup — each httpClient()
// call is a plain Java call that creates a NEW client. In lite mode, take the
// dependency as a method parameter instead:
//   @Bean PaymentClient paymentClient(HttpClient httpClient) { ... }`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the difference between Spring AOP and AspectJ?",
          a: "Spring AOP is proxy-based and runtime-only: it advises public method calls that go through the proxy of a Spring bean. AspectJ weaves advice into bytecode at compile or load time, so it can advise internal calls, private and final methods, constructors and field access — at the cost of a weaving step.",
        },
        {
          q: "Why might @Transactional on a final method cause a NullPointerException rather than just no transaction?",
          a: "A CGLIB proxy cannot override a final method, so the call executes on the proxy instance itself instead of being delegated to the real bean. The proxy's fields were never injected, so dependencies are null inside that method.",
        },
        {
          q: "Two aspects apply to the same method. How do you control which runs first, and why does it matter?",
          a: "Give the aspects @Order values; the lower value is outermost. It matters because semantics change — a retry must be outside the transaction so each attempt starts a new one, and an authorisation check should be outside a cache.",
        },
        {
          q: "Why does calling a @Bean method from another @Bean method return the same object?",
          a: "Full @Configuration classes are subclassed with CGLIB, and the subclass intercepts @Bean methods to return the existing singleton from the container. With proxyBeanMethods = false the call is plain Java and creates a new object.",
        },
      ],
      takeaways: [
        "Advice runs only on calls through the proxy, to overridable methods.",
        "Order aspects by meaning: authorisation, then retry, then transaction.",
        "When self-invocation bites, move the method or use the programmatic API.",
      ],
    },
  ],
  related: [
    "/java/spring-framework",
    "/java/spring-transactions",
    "/java/bean-lifecycle",
    "/java/annotations-reflection",
    "/lld/proxy",
  ],
  furtherReading: [
    {
      label: "Spring Framework — aspect oriented programming",
      href: "https://docs.spring.io/spring-framework/reference/core/aop.html",
    },
    {
      label: "Spring Framework — proxying mechanisms",
      href: "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html",
    },
    {
      label: "Baeldung — Spring AOP vs AspectJ",
      href: "https://www.baeldung.com/spring-aop-vs-aspectj",
    },
  ],
};
