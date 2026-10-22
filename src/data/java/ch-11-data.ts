import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaData: Concept[] = [
  {
    slug: "jdbc",
    title: "JDBC & Database Access",
    subtitle: "Chapter 11 — connections, prepared statements, transactions and connection pools",
    level: "intermediate",
    minutes: 24,
    tags: ["jdbc", "sql", "transactions", "connection pool", "jpa"],
    summary:
      "JDBC is the layer everything else sits on — JPA, Hibernate and Spring Data all reduce to it eventually. Three things here are non-negotiable: prepared statements (never string concatenation), a connection pool, and understanding what a transaction actually guarantees.",
    keyPoints: [
      "PreparedStatement always — string-concatenated SQL is injection.",
      "Connections are expensive; pool them with HikariCP.",
      "A transaction is all-or-nothing, and its isolation level decides what you can see.",
      "N+1 queries are the most common ORM performance bug.",
    ],
    prerequisites: ["/java/exception-handling"],
    sections: [
      {
        heading: "Prepared statements and SQL injection",
        code: {
          title: "Example — the vulnerability and the fix",
          lang: "java",
          source: `// VULNERABLE — the classic. Input "' OR '1'='1" returns every row;
// "'; DROP TABLE users; --" does worse.
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
stmt.executeQuery(sql);

// SAFE — the parameter is sent separately from the SQL text, so the database
// never parses user input as code. This is not escaping; it is a different
// wire protocol path, which is why it cannot be bypassed.
String sql = "SELECT id, email FROM users WHERE email = ? AND tenant_id = ?";
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setString(1, email);
    ps.setLong(2, tenantId);
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) { /* ... */ }
    }
}

// Prepared statements are also FASTER on repeat execution — the database
// caches the parse and plan. There is no argument for concatenation.

// NOTE: parameters work for VALUES, not identifiers. You cannot do
//   "ORDER BY ?"  with a column name.
// For dynamic column names, validate against an allow-list:
if (!Set.of("created_at", "total", "status").contains(sortColumn)) {
    throw new IllegalArgumentException("invalid sort column");
}`,
        },
        links: [
          {
            label: "OWASP — SQL injection prevention cheat sheet",
            href: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
          },
          {
            label: "YouTube search — JDBC prepared statement SQL injection",
            href: YT("JDBC prepared statement sql injection prevention tutorial"),
          },
        ],
      },
      {
        heading: "Transactions and isolation",
        table: {
          caption: "Isolation levels and the anomalies each one still permits.",
          headers: ["Level", "Dirty read", "Non-repeatable read", "Phantom", "Typical use"],
          rows: [
            ["READ UNCOMMITTED", "Possible", "Possible", "Possible", "Essentially never"],
            ["READ COMMITTED", "No", "Possible", "Possible", "PostgreSQL default — most apps"],
            ["REPEATABLE READ", "No", "No", "Possible*", "MySQL default"],
            ["SERIALIZABLE", "No", "No", "No", "Money, inventory — correctness over throughput"],
          ],
        },
        code: {
          title: "Example — the transaction boundary in Spring",
          lang: "java",
          source: `@Service
public class TransferService {

    // The whole method is one transaction: both updates commit, or neither does.
    @Transactional
    public void transfer(long fromId, long toId, BigDecimal amount) {
        Account from = accounts.findByIdForUpdate(fromId);   // SELECT ... FOR UPDATE
        if (from.balance().compareTo(amount) < 0) {
            throw new InsufficientFundsException();           // rolls back automatically
        }
        accounts.debit(fromId, amount);
        accounts.credit(toId, amount);
    }
}

// THREE THINGS PEOPLE GET WRONG:
//
// 1. @Transactional only works through the Spring proxy. Calling this method
//    from ANOTHER method in the SAME class bypasses the proxy entirely and
//    runs with no transaction at all. Self-invocation is the classic bug.
//
// 2. By default only RUNTIME exceptions roll back. A checked exception
//    COMMITS unless you say @Transactional(rollbackFor = Exception.class).
//
// 3. Keep transactions short. Never make an HTTP call inside one — you are
//    holding a database connection and its locks for the duration of a
//    network round trip you do not control.`,
        },
        bullets: [
          "Order lock acquisition consistently across the codebase, or two transfers in opposite directions will deadlock.",
          "Use SELECT ... FOR UPDATE, or an optimistic version column, for read-then-write sequences. Reading and then writing without either is a lost-update bug.",
          "This is the same conditional-update discipline as the hotel and ticket inventory designs elsewhere on this site.",
        ],
        links: [
          {
            label: "Baeldung — Spring @Transactional",
            href: "https://www.baeldung.com/transaction-configuration-with-jpa-and-spring",
          },
          {
            label: "Site: hotel reservation inventory concurrency",
            href: "/examples/hotel-reservation",
          },
        ],
      },
      {
        heading: "Connection pooling and the N+1 problem",
        code: {
          title: "Example — the query explosion ORMs make easy",
          lang: "java",
          source: `// N+1: one query for the orders, then one MORE per order for its items.
// 100 orders = 101 queries. It looks like clean code and performs terribly.
List<Order> orders = orderRepository.findAll();          // 1 query
for (Order o : orders) {
    o.getItems().size();                                  // N lazy-load queries
}

// FIX 1 — fetch join: one query, everything loaded
@Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.status = :s")
List<Order> findWithItems(@Param("s") Status status);

// FIX 2 — entity graph
@EntityGraph(attributePaths = "items")
List<Order> findByStatus(Status status);

// FIX 3 — batch the lazy loads instead of one-at-a-time
// application.yml:  spring.jpa.properties.hibernate.default_batch_fetch_size: 50

// DETECT IT: log SQL in development and count. A page that issues 300 queries
// is almost always N+1, and it is invisible until the data grows.
//   spring.jpa.show-sql: true`,
        },
        bullets: [
          "HikariCP is the default pool in Spring Boot and the right choice. Size it deliberately: a pool far larger than the database's own connection limit just moves the queue.",
          "A good starting pool size is small — often 10–20. More connections than the database has cores rarely helps and frequently hurts.",
          "Set a connection timeout so a pool exhaustion surfaces as a fast failure rather than requests piling up invisibly.",
        ],
        links: [
          {
            label: "Baeldung — Hibernate N+1 problem",
            href: "https://www.baeldung.com/spring-hibernate-n1-problem",
          },
          {
            label: "HikariCP — pool sizing",
            href: "https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing",
          },
        ],
      },
    ],
    related: ["/java/spring-framework", "/java/security", "/hld/sql-vs-nosql"],
    furtherReading: [
      {
        label: "Baeldung — Spring Data JPA",
        href: "https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa",
      },
    ],
  },

  {
    slug: "testing",
    title: "Java Testing",
    subtitle: "Chapter 12 — JUnit 5, Mockito, Testcontainers and what to test",
    level: "intermediate",
    minutes: 24,
    tags: ["junit", "mockito", "testcontainers", "testing"],
    summary:
      "The Java testing stack is mature and the tooling is not the hard part — deciding what deserves a test is. The rule that holds up: test behaviour at the boundaries you own, mock what you do not control, and use a real database rather than an in-memory substitute.",
    keyPoints: [
      "JUnit 5 plus Mockito plus Testcontainers covers almost everything.",
      "Mock what you do not own; do not mock what you are testing.",
      "Testcontainers gives a real database — H2 lies about SQL dialects.",
      "@SpringBootTest is slow; prefer sliced tests like @DataJpaTest and @WebMvcTest.",
    ],
    prerequisites: ["/java/oop"],
    sections: [
      {
        heading: "Unit tests with JUnit 5 and Mockito",
        code: {
          title: "Example — testing the logic, faking the collaborator",
          lang: "java",
          source: `@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock  AccountRepository accounts;       // NOT under test — faked
    @Mock  AuditLog audit;
    @InjectMocks TransferService service;    // under test — real object

    @Test
    void rejectsTransferWhenBalanceTooLow() {
        when(accounts.findById(1L)).thenReturn(new Account(1L, new BigDecimal("10.00")));

        assertThatThrownBy(() -> service.transfer(1L, 2L, new BigDecimal("50.00")))
            .isInstanceOf(InsufficientFundsException.class);

        // Assert the EFFECT, not just the exception: no money moved.
        verify(accounts, never()).debit(anyLong(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "not-an-email"})
    void rejectsInvalidEmails(String input) {
        assertThat(validator.isValid(input)).isFalse();
    }
}

// WHAT NOT TO MOCK:
//  - the class under test (mock its dependencies, not itself)
//  - value objects and records — just construct them
//  - the database — use Testcontainers instead (below)`,
        },
        links: [
          { label: "Baeldung — JUnit 5 guide", href: "https://www.baeldung.com/junit-5" },
          { label: "Baeldung — Mockito", href: "https://www.baeldung.com/mockito-series" },
          {
            label: "YouTube search — JUnit 5 Mockito tutorial",
            href: YT("junit 5 mockito tutorial spring boot testing"),
          },
        ],
      },
      {
        heading: "Integration tests with Testcontainers",
        code: {
          title: "Example — a real PostgreSQL, started by the test",
          lang: "java",
          source: `@SpringBootTest
@Testcontainers
class OrderRepositoryIT {

    @Container
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16-alpine");

    // Point Spring at the container the test just started
    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", db::getJdbcUrl);
        registry.add("spring.datasource.username", db::getUsername);
        registry.add("spring.datasource.password", db::getPassword);
    }

    @Autowired OrderRepository repository;

    @Test
    void findsOrdersByStatusUsingTheRealDialect() {
        repository.save(new Order("o-1", Status.OPEN));
        assertThat(repository.findByStatus(Status.OPEN)).hasSize(1);
    }
}

// WHY NOT H2: it accepts a subset of SQL and behaves differently on JSON
// columns, upserts, array types, sequences and locking. Tests pass against H2
// and the identical query fails in production — the exact scenario tests exist
// to prevent. Containers start in seconds and are shared across the class.`,
        },
        bullets: [
          "Prefer sliced tests when you can: @DataJpaTest for repositories, @WebMvcTest for controllers. A full @SpringBootTest boots everything and is far slower.",
          "Reuse the container across the test class with a static field — starting one per test method is what makes people abandon Testcontainers.",
          "Test the failure paths: timeouts, constraint violations, rollback. Those are what break in production, and they are exactly what unit tests with mocks cannot cover.",
        ],
        links: [
          { label: "Testcontainers — official documentation", href: "https://testcontainers.com/" },
          {
            label: "Baeldung — Spring Boot Testcontainers",
            href: "https://www.baeldung.com/spring-boot-testcontainers-integration-test",
          },
        ],
      },
    ],
    related: ["/java/spring-framework", "/java/jdbc"],
    furtherReading: [
      {
        label: "Baeldung — testing in Spring Boot",
        href: "https://www.baeldung.com/spring-boot-testing",
      },
    ],
  },
];
