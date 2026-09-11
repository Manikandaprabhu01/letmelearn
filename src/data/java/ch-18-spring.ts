import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaSpring: Concept[] = [
  {
    slug: "spring-framework",
    title: "Spring Framework & Spring Boot",
    subtitle:
      "Chapter 18 — dependency injection, beans, auto-configuration, data, and the proxy model",
    level: "advanced",
    minutes: 34,
    tags: ["spring", "spring boot", "dependency injection", "beans", "aop", "spring data"],
    summary:
      "Spring is a dependency-injection container with a large ecosystem grown around it, and Spring Boot is opinionated defaults plus auto-configuration on top. Almost everything that feels like magic is one of two mechanisms: the container wiring objects together, or a proxy wrapping your bean to add behaviour. Understand those two and the rest is API surface.",
    keyPoints: [
      "The container constructs and wires your objects; you declare what you need.",
      "Constructor injection is the only form worth using.",
      "@Transactional, @Cacheable and @Async all work through proxies — which is why self-invocation silently does nothing.",
      "Auto-configuration is conditional beans, and it can be inspected rather than guessed at.",
    ],
    prerequisites: ["/java/oop", "/java/annotations-reflection"],
    sections: [
      {
        heading: "Dependency injection and the container",
        lede: "The whole framework rests on this one idea.",
        code: {
          title: "Example — wiring, and why constructor injection wins",
          lang: "java",
          source: `// The container sees @Service and registers a bean. It sees the constructor
// and supplies each dependency from other registered beans.
@Service
public class OrderService {
    private final OrderRepository repository;    // final — cannot be left unset
    private final PaymentProcessor payments;

    // No @Autowired needed for a single constructor since Spring 4.3.
    OrderService(OrderRepository repository, PaymentProcessor payments) {
        this.repository = repository;
        this.payments = payments;
    }
}

// WHY CONSTRUCTOR INJECTION, not field injection:
//
// @Autowired private OrderRepository repository;      ← avoid
//
//  1. Fields cannot be final, so the object is mutable and can be half-built.
//  2. You cannot construct it in a unit test without Spring or reflection.
//  3. Hidden dependencies: a constructor with nine parameters is an obvious
//     smell; nine @Autowired fields hide the same problem.
//
// Testing constructor-injected classes needs no framework at all:
var service = new OrderService(new FakeRepository(), new FakePaymentProcessor());`,
        },
        table: {
          caption: "Bean scopes — singleton unless you have a reason.",
          headers: ["Scope", "Instances", "Use"],
          rows: [
            ["singleton", "One per container (default)", "Almost everything — stateless services"],
            ["prototype", "A new one per injection", "Stateful helpers; rare"],
            ["request", "One per HTTP request", "Request-scoped context"],
            ["session", "One per HTTP session", "Rare in stateless APIs"],
          ],
        },
        callout: {
          kind: "warn",
          title: "Singleton beans must be stateless",
          text: "A singleton bean is shared by every concurrent request. An instance field mutated during request handling is shared mutable state across threads — the exact bug from chapter 3, and it appears only under load. Keep request state in method parameters and locals.",
        },
        links: [
          {
            label: "Spring — core documentation",
            href: "https://docs.spring.io/spring-framework/reference/core.html",
          },
          {
            label: "YouTube search — Spring dependency injection explained",
            href: YT("spring dependency injection ioc container explained tutorial"),
          },
        ],
      },
      {
        heading: "The proxy model — and the bug it causes",
        lede: "Why @Transactional sometimes does nothing at all.",
        code: {
          title: "Example — self-invocation, the most common Spring bug",
          lang: "java",
          source: `@Service
public class ReportService {

    public void generateAll(List<Long> ids) {
        for (Long id : ids) {
            generateOne(id);          // ← DIRECT call: 'this.generateOne(id)'
        }                             //    The proxy is BYPASSED entirely.
    }

    @Transactional                    // ← silently has NO EFFECT when called above
    public void generateOne(Long id) { ... }
}

// WHY: Spring wraps the bean in a proxy. Callers injected with ReportService
// actually hold the PROXY, and the proxy is what starts the transaction before
// delegating to your object. An internal 'this.' call never passes through it.
//
//   caller → [proxy: begin tx] → real object.generateOne()   ✅
//   real object.generateAll() → this.generateOne()           ❌ no proxy, no tx

// FIX 1 — move the annotated method to another bean (usually the right design)
@Service
public class ReportBatch {
    private final ReportService reports;                 // injected PROXY
    ReportBatch(ReportService reports) { this.reports = reports; }
    public void generateAll(List<Long> ids) {
        ids.forEach(reports::generateOne);               // goes through the proxy ✅
    }
}

// The same applies to @Async, @Cacheable, @Retryable and @PreAuthorize —
// all proxy-based, all silently inert on self-invocation.`,
        },
        bullets: [
          "The symptom is an annotation that appears to do nothing, with no error. Knowing the proxy model is the only way to recognise it quickly.",
          "Proxy-based annotations also require the method to be public and the class to be a Spring-managed bean.",
          "This is the practical payoff of chapter 10: annotations are metadata, and the proxy is the code that reads them.",
        ],
        links: [
          {
            label: "Baeldung — Spring AOP and proxies",
            href: "https://www.baeldung.com/spring-aop-vs-aspectj",
          },
          {
            label: "Site: annotations and reflection (chapter 10)",
            href: "/java/annotations-reflection",
          },
        ],
      },
      {
        heading: "Spring Boot auto-configuration",
        lede: "Conditional beans, not magic — and you can ask it what it did.",
        code: {
          title: "Example — how a DataSource appears without you writing one",
          lang: "java",
          source: `// Roughly what Spring Boot ships:
@AutoConfiguration
@ConditionalOnClass(DataSource.class)                 // only if JDBC is on the classpath
@ConditionalOnMissingBean(DataSource.class)           // and only if YOU did not define one
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    @Bean
    DataSource dataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder().build();
    }
}

// THE RULE: adding a starter dependency puts classes on the classpath, which
// satisfies @ConditionalOnClass, which creates beans. Defining your own bean
// satisfies @ConditionalOnMissingBean and yours wins. Nothing is hidden —
// it is all conditions.

// ASK IT WHAT HAPPENED rather than guessing:
//   java -jar app.jar --debug
// prints the CONDITIONS EVALUATION REPORT: every auto-configuration, whether
// it matched, and exactly why not. This is the fastest way to answer
// "why is there no DataSource?"`,
        },
        table: {
          caption: "The starters you will actually use.",
          headers: ["Starter", "Brings in"],
          rows: [
            ["spring-boot-starter-web", "Spring MVC, embedded Tomcat, Jackson"],
            ["spring-boot-starter-data-jpa", "Hibernate, Spring Data, transaction management"],
            ["spring-boot-starter-security", "Spring Security filter chain"],
            ["spring-boot-starter-validation", "Jakarta Bean Validation (@Valid)"],
            ["spring-boot-starter-actuator", "Health, metrics, info endpoints"],
            ["spring-boot-starter-test", "JUnit 5, Mockito, AssertJ, Spring test support"],
          ],
        },
        links: [
          {
            label: "Spring Boot — reference documentation",
            href: "https://docs.spring.io/spring-boot/index.html",
          },
          {
            label: "YouTube search — Spring Boot auto configuration explained",
            href: YT("spring boot auto configuration conditional beans explained"),
          },
        ],
      },
      {
        heading: "Spring Data and the repository pattern",
        code: {
          title: "Example — derived queries, and when to stop using them",
          lang: "java",
          source: `public interface OrderRepository extends JpaRepository<Order, Long> {

    // Spring generates the implementation from the METHOD NAME at startup.
    List<Order> findByStatusAndCreatedAtAfter(Status status, Instant since);
    Optional<Order> findByExternalId(String externalId);
    long countByStatus(Status status);

    // Once a name gets this long, write the query instead — the name has
    // stopped being documentation and become an obstacle.
    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items
        WHERE o.status = :status AND o.total > :min
        """)
    List<Order> findLargeOrders(@Param("status") Status status,
                                @Param("min") BigDecimal min);

    // Modifying queries need both annotations, and they bypass the persistence
    // context — entities already loaded will be stale afterwards.
    @Modifying
    @Query("UPDATE Order o SET o.status = :status WHERE o.id IN :ids")
    int bulkUpdateStatus(@Param("ids") List<Long> ids, @Param("status") Status status);
}

// Pageable everywhere a list could grow — an unbounded findAll() is a
// production incident waiting for the data to arrive.
Page<Order> page = repository.findByStatus(Status.OPEN, PageRequest.of(0, 50));`,
        },
        bullets: [
          "Derived query names are checked at startup, so a typo fails fast rather than at runtime — one of the better things about the approach.",
          "Watch for N+1: a derived query returning entities with lazy collections will issue one query per row when you touch them. Use a fetch join (chapter 11).",
          "Never return entities from a controller. Map to a response record, or you leak the schema and break clients whenever it changes.",
        ],
        links: [
          {
            label: "Spring Data JPA — reference",
            href: "https://docs.spring.io/spring-data/jpa/reference/",
          },
          { label: "Site: JDBC, transactions and N+1 (chapter 11)", href: "/java/jdbc" },
        ],
      },
    ],
    related: ["/java/web-development", "/java/jdbc", "/java/testing", "/java/security"],
    furtherReading: [
      {
        label: "Spring Boot — official documentation",
        href: "https://docs.spring.io/spring-boot/index.html",
      },
      { label: "Spring — guides", href: "https://spring.io/guides" },
      { label: "Baeldung — Spring tutorials", href: "https://www.baeldung.com/spring-tutorial" },
    ],
  },
];
