import type { Concept } from "@/data/types";

export const springJpaHibernate: Concept = {
  slug: "jpa-hibernate",
  title: "JPA & Hibernate Performance",
  subtitle:
    "Chapter 25 — the persistence context, N+1 and fetch plans, pagination traps, open-in-view, batching and optimistic locking",
  level: "advanced",
  minutes: 32,
  tags: ["jpa", "hibernate", "n+1", "fetch join", "open-in-view", "batching", "optimistic locking"],
  summary:
    "Hibernate is fast when you tell it what you need and slow when it has to guess. Most JPA performance incidents come from a handful of defaults: eager to-one associations, lazy collections touched in a loop, open-in-view keeping sessions alive through JSON serialization, collection fetch joins paginated in memory, and IDENTITY ids silently disabling batch inserts. Each is visible in the SQL log and fixable in a line or two.",
  keyPoints: [
    "A managed entity is saved at flush by dirty checking — calling save() on it is redundant.",
    "Make every association LAZY, then fetch exactly what each use case needs with JOIN FETCH, @EntityGraph or a DTO projection.",
    "Paginating a query that fetch-joins a collection loads every row into memory; page the ids first.",
    "Turn off spring.jpa.open-in-view so lazy loading cannot hide inside controllers and serializers.",
    "Use SEQUENCE ids with a pooled optimizer and JDBC batching for bulk writes; add @Version for concurrent updates.",
  ],
  prerequisites: ["/java/jdbc", "/java/spring-transactions"],
  sections: [
    {
      heading: "The persistence context and dirty checking",
      lede: "The first-level cache that makes JPA feel like magic — and use memory like it.",
      diagram: {
        kind: "flow",
        caption: "Entity states. Only managed entities are tracked and written automatically.",
        rows: [
          [
            { id: "t", label: "Transient", sub: "new Order()" },
            { id: "m", label: "Managed", sub: "persist() or loaded", tone: "accent" },
            { id: "d", label: "Detached", sub: "context closed or clear()" },
          ],
          [
            { id: "r", label: "Removed", sub: "remove(), deleted at flush", tone: "bad" },
            { id: "me", label: "merge()", sub: "copies detached state onto a managed copy" },
          ],
        ],
      },
      code: {
        title: "Example — updates without save(), and batch jobs that run out of memory",
        lang: "java",
        source: `@Transactional
public void rename(long id, String name) {
    Customer customer = customers.findById(id).orElseThrow();   // managed
    customer.setName(name);
    // No save() needed: at commit, Hibernate compares every managed entity with
    // the snapshot taken when it was loaded and issues UPDATE for the changes.
}

// The snapshot is why a long-running persistence context grows without bound.
@Transactional
public void reprice(Stream<Long> productIds) {
    int n = 0;
    for (Iterator<Long> it = productIds.iterator(); it.hasNext(); ) {
        Product p = products.getReferenceById(it.next());
        p.applyPriceRule(rules);
        if (++n % 500 == 0) {
            entityManager.flush();      // write the pending UPDATEs
            entityManager.clear();      // drop 500 entities and their snapshots
        }
    }
}
// Without flush/clear, a million-row job holds a million entities plus a million
// snapshots in the heap until the transaction ends.`,
      },
      bullets: [
        "Within one persistence context, the same id always returns the same Java instance — repeated findById calls in a request hit memory, not the database.",
        "Flush happens at commit, before a JPQL or native query that could see pending changes (FlushMode AUTO), or when you call flush(). A query in the middle of a loop can therefore trigger surprising UPDATEs.",
        "Read-only transactions (chapter 24) skip snapshots entirely — the cheapest way to make large reads lighter.",
      ],
    },
    {
      heading: "N+1 and choosing a fetch plan",
      lede: "One query for the list, one more for every row in it.",
      code: {
        title: "Example — the problem, and four fixes",
        lang: "java",
        source: `@Entity
class Order {
    @Id Long id;
    @ManyToOne(fetch = FetchType.LAZY)        // JPA's default for to-one is EAGER — override it
    Customer customer;
    @OneToMany(mappedBy = "order")            // LAZY by default
    List<OrderLine> lines;
}

// THE BUG: 1 query for 50 orders + 50 queries for their lines = 51 round trips.
List<Order> recent = orders.findTop50ByOrderByCreatedAtDesc();
recent.forEach(o -> total += o.getLines().size());

// FIX 1 — JOIN FETCH for this use case
@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.lines WHERE o.status = :status")
List<Order> findWithLines(@Param("status") Status status);

// FIX 2 — @EntityGraph on a derived query
@EntityGraph(attributePaths = {"customer", "lines"})
List<Order> findByStatus(Status status);

// FIX 3 — batch fetching as a safety net for every lazy association:
//   spring.jpa.properties.hibernate.default_batch_fetch_size: 50
// 51 queries become 2: the orders, then lines WHERE order_id IN (…50 ids…).

// FIX 4 — don't load entities you will not modify: project to a DTO
public record OrderSummary(Long id, String customerName, BigDecimal total) { }

@Query("""
    SELECT new com.acme.orders.OrderSummary(o.id, c.name, o.total)
    FROM Order o JOIN o.customer c
    WHERE o.createdAt > :since
    """)
List<OrderSummary> summariesSince(@Param("since") Instant since);`,
      },
      math: [
        { label: "Rows on the page", expr: "N", result: "50" },
        { label: "Lazy collection touched per row", expr: "1 + N queries", result: "51 queries" },
        {
          label: "At 2 ms per round trip",
          expr: "51 × 2 ms",
          result: "≈ 100 ms",
          note: "Invisible on a laptop with a local database; very visible across availability zones.",
        },
        { label: "With default_batch_fetch_size = 50", expr: "1 + ⌈N / 50⌉", result: "2 queries" },
      ],
      bullets: [
        "Detect it before production: log SQL in tests (logging.level.org.hibernate.SQL=debug) or assert query counts with Hibernate statistics (hibernate.generate_statistics=true) around a repository call.",
        "Fetching two List collections in one query throws MultipleBagFetchException, and fetching two collections of any type multiplies rows. Fetch one collection per query and let batch fetching load the other.",
        "EAGER does not fix N+1 — it makes the extra queries happen on every load, including the places that never needed the data.",
      ],
    },
    {
      heading: "Pagination with collection fetches",
      lede: "The warning in the log that means “I loaded the whole table”.",
      code: {
        title: "Example — paging ids first, then fetching the graph",
        lang: "java",
        source: `// WRONG — pagination over a collection fetch join:
@Query("SELECT o FROM Order o JOIN FETCH o.lines")
Page<Order> findPage(Pageable pageable);
// Hibernate cannot LIMIT rows (one order has many line rows), so it fetches
// EVERY matching row and paginates in memory, logging:
//   HHH90003004: firstResult/maxResults specified with collection fetch;
//   applying in memory
// Make this fail loudly instead of silently:
//   spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch: true

// RIGHT — two queries: page the ids, then fetch the graph for just those ids.
@Query("SELECT o.id FROM Order o WHERE o.status = :status")
Page<Long> pageIds(@Param("status") Status status, Pageable pageable);

@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.lines WHERE o.id IN :ids")
List<Order> findWithLines(@Param("ids") Collection<Long> ids);

public Page<Order> page(Status status, Pageable pageable) {
    Page<Long> ids = orders.pageIds(status, pageable);
    Map<Long, Order> byId = orders.findWithLines(ids.getContent()).stream()
        .collect(Collectors.toMap(Order::getId, o -> o));
    return ids.map(byId::get);            // keeps the page's sort order
}`,
      },
      callout: {
        kind: "warn",
        title: "Deep pages are slow even without JPA",
        text: "OFFSET 100000 makes the database read and discard 100,000 rows. For infinite scroll and exports, use keyset pagination — WHERE created_at < :lastSeen ORDER BY created_at DESC LIMIT 50 — which Spring Data supports through its scrolling API.",
      },
    },
    {
      heading: "Open-in-view and LazyInitializationException",
      lede: "The default that hides N+1 inside your JSON serializer.",
      code: {
        title: "Example — why Spring Boot warns about it at startup",
        lang: "yaml",
        source: `# Spring Boot logs at startup:
#   spring.jpa.open-in-view is enabled by default. Therefore, database queries
#   may be performed during view rendering. Explicitly configure
#   spring.jpa.open-in-view to disable this warning
spring:
  jpa:
    open-in-view: false

# WITH open-in-view (the default): the EntityManager stays open for the whole
# HTTP request. A controller returns an entity; Jackson walks its lazy
# associations while writing JSON; each one fires a query — N+1 in the
# serializer, with the connection held until the response is written.
#
# WITHOUT it: touching an unloaded association outside the service layer throws
#   LazyInitializationException: could not initialize proxy - no Session
# That exception is the point. It tells you the use case forgot to fetch what it
# needs. Fix it in the query (JOIN FETCH, @EntityGraph, DTO projection) — not
# by re-enabling open-in-view or switching the association to EAGER.`,
      },
      bullets: [
        "Return response records from controllers, never entities (chapter 18). That alone removes most accidental lazy loading.",
        "The anti-fix hibernate.enable_lazy_load_no_trans opens a new session and connection for every lazy load outside a transaction. It makes the exception disappear and the N+1 worse.",
      ],
    },
    {
      heading: "Writes at scale: ids, batching and optimistic locking",
      table: {
        caption: "Id generation and its effect on insert batching.",
        headers: ["Strategy", "How the id is obtained", "JDBC insert batching"],
        rows: [
          [
            "IDENTITY",
            "Database auto-increment, known only after each INSERT",
            "Disabled — Hibernate must insert immediately",
          ],
          [
            "SEQUENCE + pooled optimizer",
            "One sequence call reserves a block (allocationSize = 50)",
            "Works — ids are known up front",
          ],
          [
            "UUID",
            "Generated in the application",
            "Works; random UUIDs fragment B-tree indexes — prefer time-ordered UUIDv7",
          ],
        ],
      },
      code: {
        title: "Example — batching inserts and guarding concurrent updates",
        lang: "java",
        source: `// application.yml
//   spring.jpa.properties.hibernate.jdbc.batch_size: 50
//   spring.jpa.properties.hibernate.order_inserts: true   # group by table so batches fill
//   spring.jpa.properties.hibernate.order_updates: true

@Entity
class StockItem {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "stock_seq")
    @SequenceGenerator(name = "stock_seq", sequenceName = "stock_seq", allocationSize = 50)
    Long id;

    int quantity;

    @Version                 // optimistic locking
    long version;
}

// Two admins edit the same item. Hibernate issues:
//   UPDATE stock_item SET quantity = ?, version = 8 WHERE id = ? AND version = 7
// The second update matches zero rows, so Hibernate throws
// ObjectOptimisticLockingFailureException instead of silently overwriting.
@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
ProblemDetail conflict() {
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
        "This item changed since you loaded it. Reload and try again.");
}
// For machine-driven updates (counters, stock decrements), retry the whole
// read-modify-write in a NEW transaction — or use a single conditional UPDATE.`,
      },
      links: [
        {
          label: "Site: hotel reservation — inventory under concurrency",
          href: "/examples/hotel-reservation",
        },
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the N+1 problem and how do you fix it in Spring Data JPA?",
          a: "Loading N parent rows with one query and then triggering one extra query per parent when a lazy association is touched. Fix it per use case with JOIN FETCH or @EntityGraph, set hibernate.default_batch_fetch_size as a safety net so lazy loads become IN queries, or project directly into DTOs when the entities are not being modified.",
        },
        {
          q: "Why do you get LazyInitializationException, and what is the wrong fix?",
          a: "An uninitialised lazy association was accessed after the persistence context closed — typically in a controller or serializer. The wrong fixes are switching the association to EAGER or enabling open-in-view or enable_lazy_load_no_trans; the right fix is fetching the data the use case needs inside the transaction or returning a DTO.",
        },
        {
          q: "Why can GenerationType.IDENTITY make bulk inserts slow?",
          a: "With IDENTITY the id is assigned by the database during the INSERT, and Hibernate needs the id to manage the entity, so it must execute each insert immediately and cannot batch them. A SEQUENCE with a pooled optimizer lets Hibernate assign ids in memory and send inserts in JDBC batches.",
        },
        {
          q: "How does @Version prevent lost updates?",
          a: "Every UPDATE includes the version read earlier in its WHERE clause and increments it. If another transaction committed first, the update matches no rows and Hibernate throws an optimistic locking exception, which the application maps to a conflict response or a retry.",
        },
      ],
      takeaways: [
        "LAZY everywhere; fetch per use case; DTOs for read models.",
        "Read the SQL log and the HHH warnings — they describe the bug precisely.",
        "Disable open-in-view, page ids before fetching graphs, batch with sequences, guard updates with @Version.",
      ],
    },
  ],
  related: [
    "/java/spring-transactions",
    "/java/jdbc",
    "/java/spring-framework",
    "/hld/sql-vs-nosql",
    "/examples/hotel-reservation",
  ],
  furtherReading: [
    {
      label: "Hibernate ORM — user guide",
      href: "https://hibernate.org/orm/documentation/",
    },
    {
      label: "Spring Data JPA — reference",
      href: "https://docs.spring.io/spring-data/jpa/reference/",
    },
    {
      label: "Vlad Mihalcea — high-performance Java persistence articles",
      href: "https://vladmihalcea.com/tutorials/hibernate/",
    },
  ],
};
