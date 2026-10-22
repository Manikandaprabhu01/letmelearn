import type { Concept } from "@/data/types";

export const springTesting: Concept = {
  slug: "spring-testing",
  title: "Testing Spring Boot in Depth",
  subtitle:
    "Chapter 33 — test slices, context caching, Testcontainers with @ServiceConnection, outbound HTTP, and tests that catch the bugs from this part",
  level: "advanced",
  minutes: 26,
  tags: [
    "spring boot test",
    "test slices",
    "context caching",
    "testcontainers",
    "mockitobean",
    "wiremock",
  ],
  summary:
    "A fast, trustworthy Spring Boot suite uses the smallest context that proves each behaviour, shares application contexts instead of rebuilding them, and runs the parts that matter — SQL, transactions, serialization, security, Kafka — against real infrastructure in containers. Most slow suites are slow because every test class builds its own context; most untrustworthy suites mock exactly the layer where production breaks.",
  keyPoints: [
    "Plain unit tests for logic; @WebMvcTest, @DataJpaTest and friends for one layer; @SpringBootTest for wiring.",
    "Spring caches contexts by configuration — every unique set of @MockitoBean fields forces a new context.",
    "@ServiceConnection wires Testcontainers into Spring Boot without hand-written properties.",
    "Test timeouts and failures of outbound calls with a fake server that can be slow and fail.",
    "Write the negative tests: 403s, duplicates, rollbacks, query counts.",
  ],
  prerequisites: ["/java/testing", "/java/spring-transactions"],
  sections: [
    {
      heading: "Pick the smallest context that proves the behaviour",
      table: {
        headers: ["Annotation", "Loads", "Use it to prove"],
        rows: [
          [
            "(none)",
            "Nothing — plain JUnit",
            "Business logic; constructor injection makes this easy",
          ],
          [
            "@WebMvcTest",
            "Controllers, filters, @ControllerAdvice, converters, security config",
            "Routing, validation, status codes, JSON shape, 401/403",
          ],
          [
            "@DataJpaTest",
            "JPA, repositories, a DataSource; each test rolls back",
            "Queries, mappings, constraints, fetch plans",
          ],
          ["@JsonTest", "Jackson with Boot's configuration", "Serialization contracts"],
          [
            "@RestClientTest",
            "A RestClient/RestTemplate builder and a mock server",
            "Outbound request building and response mapping",
          ],
          [
            "@SpringBootTest",
            "The whole application context",
            "Wiring, configuration, end-to-end flows",
          ],
          [
            "@SpringBootTest(webEnvironment = RANDOM_PORT)",
            "Everything plus a real server",
            "Full HTTP stack including filters and serialization",
          ],
        ],
      },
      bullets: [
        "@DataJpaTest replaces your DataSource with an embedded database by default. SQL that works in H2 and fails in PostgreSQL is a classic false green — use @AutoConfigureTestDatabase(replace = Replace.NONE) with a Testcontainers database.",
        "Slices exclude your @Service beans. Anything a controller needs must be supplied with @MockitoBean (Spring Framework 6.2+; the older @MockBean is deprecated since Spring Boot 3.4).",
      ],
      links: [
        {
          label: "Spring Boot — testing",
          href: "https://docs.spring.io/spring-boot/reference/testing/index.html",
        },
      ],
    },
    {
      heading: "Context caching: why the suite takes ten minutes",
      lede: "Starting Spring is the expensive part of an integration test. Do it rarely.",
      math: [
        {
          label: "Distinct context configurations",
          expr: "test classes with unique mocks / properties",
          result: "40",
        },
        { label: "Startup per context", expr: "measured", result: "8 s" },
        { label: "Spent only starting Spring", expr: "40 × 8 s", result: "5 min 20 s" },
        {
          label: "After consolidating to 4 shared configurations",
          expr: "4 × 8 s",
          result: "32 s",
        },
      ],
      code: {
        title: "Example — one shared integration-test configuration",
        lang: "java",
        source: `// Spring's TestContext framework caches contexts keyed by their configuration:
// classes, active profiles, properties, context customizers — and the exact set
// of @MockitoBean / @MockitoSpyBean fields. Change any of these and a NEW
// context starts. @DirtiesContext throws the cached one away.

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public @interface IntegrationTest { }

@IntegrationTest
class CheckoutFlowTest { ... }        // shares a context with every other @IntegrationTest

@IntegrationTest
class RefundFlowTest { ... }          // same context — no restart

// Keep mocks for external systems in the shared configuration (or better, use
// fake servers), rather than adding a different @MockitoBean per test class.
//
// See what is happening:
//   logging.level.org.springframework.test.context.cache: DEBUG
// logs cache hits, misses and size — misses are your startup bill.`,
      },
    },
    {
      heading: "Real infrastructure with Testcontainers",
      lede: "Test against the database and broker you run in production.",
      code: {
        title: "Example — @ServiceConnection, reused by tests and local development",
        lang: "java",
        source: `@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection        // Boot derives spring.datasource.* from the container
    PostgreSQLContainer<?> postgres() {
        return new PostgreSQLContainer<>("postgres:16-alpine");
    }

    @Bean
    @ServiceConnection        // and spring.kafka.bootstrap-servers
    KafkaContainer kafka() {
        return new KafkaContainer(DockerImageName.parse("apache/kafka-native:3.8.0"));
    }
}

// Run the real application locally against the same containers
// (src/test/java, started from the IDE):
public class TestOrderApplication {
    public static void main(String[] args) {
        SpringApplication.from(OrderApplication::main)
                         .with(TestcontainersConfiguration.class)
                         .run(args);
    }
}

@IntegrationTest
class OrderRepositoryTest {
    @Autowired OrderRepository orders;
    @Autowired EntityManagerFactory emf;

    @Test
    void recentOrdersLoadLinesInTwoQueries() {
        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);   // or hibernate.generate_statistics in the test profile
        stats.clear();

        orders.findWithLines(Status.OPEN).forEach(o -> o.getLines().size());

        assertThat(stats.getPrepareStatementCount()).isLessThanOrEqualTo(2);   // guards against N+1
    }
}`,
      },
      bullets: [
        "Flyway or Liquibase migrations run against the container at startup, so every integration run also tests your migrations.",
        "Containers declared as beans live as long as the cached context. Combined with a shared configuration, a suite starts PostgreSQL and Kafka once.",
      ],
      links: [
        {
          label: "Spring Boot — Testcontainers support",
          href: "https://docs.spring.io/spring-boot/reference/testing/testcontainers.html",
        },
      ],
    },
    {
      heading: "Testing outbound HTTP, including failure",
      lede: "The happy path is the least interesting thing a client does.",
      code: {
        title: "Example — a fake server that is slow and fails",
        lang: "java",
        source: `@IntegrationTest
@EnableWireMock(@ConfigureWireMock(name = "rates", baseUrlProperties = "rates.base-url"))
class RatesResilienceTest {

    @InjectWireMock("rates") WireMockServer rates;
    @Autowired PricingService pricing;

    @Test
    void readTimeoutTriggersFallbackQuickly() {
        rates.stubFor(get(urlPathMatching("/v1/rates/.*"))
            .willReturn(ok().withFixedDelay(5_000)));            // slower than the 2 s timeout

        long start = System.nanoTime();
        Rate rate = pricing.rate("EUR");

        assertThat(rate.stale()).isTrue();                        // fallback served
        assertThat(Duration.ofNanos(System.nanoTime() - start))
            .isLessThan(Duration.ofSeconds(8));                   // timeout + retries, not forever
    }

    @Test
    void doesNotRetryClientErrors() {
        rates.stubFor(get(urlPathMatching("/v1/rates/.*")).willReturn(notFound()));

        assertThatThrownBy(() -> pricing.rate("XXX")).isInstanceOf(UnknownCurrencyException.class);
        rates.verify(1, getRequestedFor(urlPathMatching("/v1/rates/.*")));   // exactly one call
    }
}
// Uses the wiremock-spring-boot integration; a plain WireMock server started in
// the test plus @DynamicPropertySource works the same way.`,
      },
    },
    {
      heading: "Tests that catch the bugs from this part",
      lede: "One test per failure mode the previous chapters described.",
      table: {
        headers: ["Bug", "Chapter", "Test that catches it"],
        rows: [
          [
            "Checked exception commits partial work",
            "24",
            "Call without a test transaction, then assert nothing was persisted",
          ],
          ["N+1 on a list endpoint", "25", "Assert statement count with Hibernate statistics"],
          [
            "Lazy loading only works in tests",
            "25",
            "Disable open-in-view in the test profile; avoid @Transactional on tests",
          ],
          [
            "Object-level authorisation missing",
            "27",
            "Request another user's resource and expect 403 or 404",
          ],
          [
            "Duplicate Kafka delivery applied twice",
            "30",
            "Publish the same event twice; assert one effect",
          ],
          [
            "Missing or invalid configuration",
            "22",
            "ApplicationContextRunner with bad properties expects startup failure",
          ],
          [
            "Outbound call without a timeout",
            "31",
            "Fake server delay larger than the timeout; assert fast failure",
          ],
        ],
      },
      callout: {
        kind: "insight",
        title: "A test that mocks the repository cannot find a SQL bug",
        text: "Mocks are for the edges you do not own and cannot run. Your own database, schema, queries and serialization are exactly where integration bugs live — run them for real, and keep mocks for third-party APIs.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the difference between @WebMvcTest and @SpringBootTest?",
          a: "@WebMvcTest loads only the web layer — controllers, filters, advice, converters and security configuration — so services must be mocked, and it starts quickly. @SpringBootTest loads the full application context and is for testing wiring and end-to-end behaviour.",
        },
        {
          q: "Why is our integration test suite so slow, and how would you speed it up?",
          a: "Usually because many test classes produce distinct context configurations — different mocks, properties or profiles — so Spring starts a new context for each. Consolidate into a few shared configurations, avoid @DirtiesContext, move per-test mocks into shared fakes, and reuse containers through the cached context.",
        },
        {
          q: "Why not run repository tests against H2?",
          a: "H2 is a different database: SQL dialect, locking, constraint behaviour and features such as JSON columns or ON CONFLICT differ, so tests can pass against H2 and fail against PostgreSQL. Testcontainers runs the same database engine as production with little extra setup.",
        },
        {
          q: "How do you test that an HTTP client handles a slow dependency?",
          a: "Point the client at a fake server such as WireMock, stub a response with a delay longer than the configured read timeout, and assert that the call fails or falls back within the expected time and that retries follow the configured policy.",
        },
      ],
      takeaways: [
        "Smallest context that proves the behaviour; shared contexts for the rest.",
        "Real databases and brokers in containers; mocks only for systems you do not own.",
        "Test the failure modes, not just the happy path.",
      ],
    },
  ],
  related: [
    "/java/testing",
    "/java/spring-transactions",
    "/java/jpa-hibernate",
    "/java/spring-security-internals",
    "/java/spring-http-resilience",
  ],
  furtherReading: [
    {
      label: "Spring Boot — testing",
      href: "https://docs.spring.io/spring-boot/reference/testing/index.html",
    },
    {
      label: "Spring Framework — TestContext framework and context caching",
      href: "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/ctx-management/caching.html",
    },
    { label: "Testcontainers for Java", href: "https://java.testcontainers.org/" },
  ],
};
