// Imported from the Interview Prep Console (lib/extra-concepts-b.js).
import type { ConceptAnswer } from "../types";

export const extraConceptsB: ConceptAnswer[] = [
  {
    id: "x-c-os",
    t: "Operating systems: processes, threads, scheduling, memory",
    cat: "Operating systems",
    r: 1,
    src: ["GFG OS top 50", "InterviewBit"],
    a: "**Process vs thread** — a process owns an address space, file descriptors and heap; threads share all of that and own only a stack and registers. Thread context switches skip the page-table swap and TLB flush, which is why they are cheaper. The trade: threads communicate through shared memory (fast, dangerous), processes through IPC (slower, isolated). A crash takes down one process, but any thread can corrupt its siblings.\n\n**Process states** — new → ready → running → waiting → terminated. A **zombie** has exited but its parent has not called `wait()`, so the entry lingers in the process table; an **orphan** outlives its parent and is adopted by init. Both are classic quick-fire questions.\n\n**Scheduling** — FCFS (simple, convoy effect), SJF (optimal average wait, needs prediction, can starve long jobs), Round Robin (fair, quantum size trades context-switch overhead against responsiveness), Priority (starvation, fixed by **aging**), and Multilevel Feedback Queues (what real kernels approximate: interactive tasks drift to high-priority short-quantum queues, CPU-bound ones sink). Linux's CFS instead tracks virtual runtime and always runs the thread that has had the least.\n\n**Synchronisation** — a **mutex** provides mutual exclusion with ownership (only the locker unlocks); a **semaphore** is a counter permitting N holders and has no ownership, so it can signal between threads. Counting semaphores solve producer/consumer with a bounded buffer; binary semaphores resemble a mutex but must not be used as one, because ownership matters for priority inheritance and for correctness of unlock.\n\n**Deadlock** needs all four Coffman conditions (mutual exclusion, hold and wait, no preemption, circular wait); break any one. Prevention by global lock ordering is the practical answer, avoidance by Banker's algorithm is the textbook one, and detection plus recovery is what databases do.\n\n**Virtual memory** — each process gets a private address space mapped by page tables, cached in the TLB. Page faults pull pages in on demand; **thrashing** is when the working set exceeds RAM and the system spends its time faulting rather than computing. Replacement policies (LRU, clock/second-chance) decide what to evict; **Belady's anomaly** — more frames producing more faults — happens with FIFO and is a favourite trick question.",
    fu: [
      {
        q: "Why does a context switch cost so much?",
        a: "Saving and restoring registers is cheap; the real cost is cache and TLB pollution — the new thread arrives to a cold cache. That is also why thread-per-request stacks struggle at very high concurrency and why event loops and virtual threads exist.",
      },
      {
        q: "Mutex or semaphore for a bounded buffer?",
        a: "Both: a mutex for the buffer's internal consistency, and two counting semaphores (`empty` and `full`) for the slot accounting. That classic pairing is what the question is really about.",
      },
      {
        q: "How does this show up in application work?",
        a: "Thread-pool sizing (CPU-bound ≈ cores, IO-bound much higher), why a blocking call inside an event loop is fatal, why a container's memory limit kills a JVM that ignored it, and why a slow disk turns into unbounded latency through page faults.",
      },
    ],
  },
  {
    id: "x-c-sqlpatterns",
    t: "SQL patterns: window functions, CTEs, dedup, gaps and islands",
    cat: "Databases",
    r: 2,
    src: ["DataCamp SQL 99", "GFG SQL top 100", "Hirist"],
    a: "Beyond joins and aggregates, four patterns cover most SQL interview questions.\n\n**Ranking and top-N per group** — `ROW_NUMBER()`, `RANK()` and `DENSE_RANK()` over a partition. `ROW_NUMBER` gives a unique sequence (ties broken arbitrarily), `RANK` leaves gaps after ties, `DENSE_RANK` does not. 'Second highest salary per department' and 'latest row per user' are both this pattern.\n\n**Running totals and period comparison** — `SUM(...) OVER (PARTITION BY ... ORDER BY ... ROWS UNBOUNDED PRECEDING)` for cumulative values, and `LAG`/`LEAD` for month-over-month or session gap calculations. This replaces self-joins that most candidates reach for first.\n\n**Deduplication** — number the duplicates with `ROW_NUMBER()` over the key ordered by recency, then keep rank 1 (or delete the rest). Far clearer than `GROUP BY` with a `MIN(id)` join back.\n\n**Gaps and islands** — consecutive-run problems (streaks of active days, sessionising events) solved by subtracting a row number from the value: rows in the same run share the difference, so you can group by it. This is the trick that makes 'find the longest login streak' a five-line query.\n\n**CTEs** make all of this readable, and a **recursive CTE** walks hierarchies (org charts, category trees, graph reachability) — know the anchor-plus-recursive-term shape.\n\nOn performance: a window function scans once and sorts within partitions; a correlated subquery re-executes per row. `EXISTS` beats `IN` when the subquery can be large, and `NOT IN` is a trap when the subquery can produce NULL.",
    sql: "-- 1. Top-N per group: latest order per customer\nSELECT customer_id, order_id, placed_at\nFROM (\n  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id\n                                 ORDER BY placed_at DESC) AS rn\n  FROM orders o\n) t\nWHERE rn = 1;\n\n-- 2. Running total and month-over-month change\nSELECT month,\n       revenue,\n       SUM(revenue) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) AS running_total,\n       revenue - LAG(revenue) OVER (ORDER BY month)                AS mom_change\nFROM monthly_revenue;\n\n-- 3. Deduplicate, keeping the newest row per natural key\nWITH ranked AS (\n  SELECT id, email,\n         ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY updated_at DESC) AS rn\n  FROM users\n)\nDELETE FROM users WHERE id IN (SELECT id FROM ranked WHERE rn > 1);\n\n-- 4. Gaps and islands: longest streak of consecutive active days per user\nWITH d AS (\n  SELECT DISTINCT user_id, activity_date FROM activity\n),\ngrouped AS (\n  SELECT user_id, activity_date,\n         activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id\n                                             ORDER BY activity_date))::int AS grp\n  FROM d\n)\nSELECT user_id, COUNT(*) AS streak_length,\n       MIN(activity_date) AS started, MAX(activity_date) AS ended\nFROM grouped\nGROUP BY user_id, grp\nORDER BY streak_length DESC;\n\n-- 5. Recursive CTE: the whole reporting chain under a manager\nWITH RECURSIVE reports AS (\n  SELECT employee_id, manager_id, name, 1 AS depth\n  FROM employees WHERE employee_id = :root          -- anchor\n  UNION ALL\n  SELECT e.employee_id, e.manager_id, e.name, r.depth + 1\n  FROM employees e JOIN reports r ON e.manager_id = r.employee_id   -- recursive term\n)\nSELECT * FROM reports ORDER BY depth;\n\n-- 6. The NOT IN trap\n-- returns NOTHING if the subquery yields a single NULL:\n--   SELECT * FROM a WHERE id NOT IN (SELECT b_id FROM b);\nSELECT * FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.b_id = a.id);",
    fu: [
      {
        q: "How do you find and fix a slow query?",
        a: "`EXPLAIN ANALYZE` first: compare estimated with actual rows (a big gap means stale statistics), look for sequential scans on large tables, nested loops over big inputs, and sorts spilling to disk. Then act: add or fix the composite index, rewrite correlated subqueries as joins or window functions, reduce the row count before joining, and re-run ANALYZE.",
      },
      {
        q: "When is a window function the wrong tool?",
        a: "When you need to filter on its result and could have filtered earlier — window functions run after WHERE, so you often need a subquery or QUALIFY (in engines that support it). Also when a simple GROUP BY would do; windows keep every row, which is more data to move.",
      },
      {
        q: "How would you paginate deep results efficiently?",
        a: "Keyset pagination — `WHERE (created_at, id) < (:last_created, :last_id) ORDER BY created_at DESC, id DESC LIMIT 50` — which uses the index and stays constant-time, unlike OFFSET which scans and discards.",
      },
    ],
  },
  {
    id: "x-c-testing",
    t: "Testing strategy: unit, integration, end-to-end and flaky tests",
    cat: "Engineering practice",
    r: 2,
    src: ["Tech Interview Handbook", "DevOps checklist"],
    a: "**The pyramid, and why it is shaped that way**: many fast unit tests (milliseconds, no IO, run on every save), fewer integration tests (real database, real HTTP, container-based — Testcontainers is the standard answer), very few end-to-end tests (slow, brittle, but the only ones that prove the system works). Inverting the pyramid produces suites that take an hour and fail randomly, which teams then learn to ignore — and a test suite nobody trusts is worse than none.\n\n**What to unit test** — logic with branches and edge cases: pricing rules, state machines, parsers, date handling. What not to: getters, framework wiring, or anything whose test is a mirror of the implementation (those tests break on every refactor and catch nothing).\n\n**Test doubles** — stub (canned answers), mock (asserts interactions), fake (a working lightweight implementation, such as an in-memory repository). Prefer fakes for repositories and stubs for external services; heavy mocking couples tests to implementation detail, which is the most common cause of a brittle suite.\n\n**Integration tests** should use the real database in a container rather than an in-memory substitute — SQL dialect differences are exactly where the bugs live.\n\n**Flaky tests** — the main causes are shared state between tests, time and timezone dependence, real sleeps instead of controlled clocks, and unordered collections asserted as ordered. The policy that works: quarantine a flaky test immediately (it is failing to do its job), fix or delete it within a sprint, and never add a blanket retry — retries hide real race conditions.\n\n**Coverage** is a diagnostic, not a target: 100% coverage with no assertions proves nothing, and chasing a number produces tests written for the metric. Look instead at whether a bug fix arrived with a regression test.",
    java: '// A fake beats a mock for a repository: real behaviour, no framework\nclass InMemoryTicketRepository implements TicketRepository {\n    private final Map<Long, Ticket> store = new ConcurrentHashMap<>();\n    public Ticket save(Ticket t) { store.put(t.id(), t); return t; }\n    public Optional<Ticket> findById(long id) { return Optional.ofNullable(store.get(id)); }\n}\n\n// Inject the clock so time-dependent logic is deterministic\nclass SlaService {\n    private final Clock clock;\n    boolean isBreached(Ticket t) {\n        return Duration.between(t.createdAt(), clock.instant()).toHours() > 24;\n    }\n}\n\n@Test\nvoid breachesAfter24Hours() {\n    Clock fixed = Clock.fixed(Instant.parse("2026-01-02T00:00:00Z"), ZoneOffset.UTC);\n    SlaService service = new SlaService(fixed);\n    assertTrue(service.isBreached(ticketCreatedAt("2026-01-01T00:00:00Z")));\n}\n\n// Integration test against a real database, not an in-memory substitute\n@Testcontainers\nclass TicketRepositoryIT {\n    @Container\n    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");\n\n    @Test\n    void findsByTenantAndStatus() { /* real SQL, real index behaviour */ }\n}',
    py: "# pytest: fixtures for isolation, freeze time rather than sleeping\nimport pytest\nfrom datetime import datetime, timezone\n\n@pytest.fixture\ndef repo():\n    return InMemoryTicketRepository()      # a fake, not a mock\n\ndef test_breaches_after_24_hours(repo):\n    clock = lambda: datetime(2026, 1, 2, tzinfo=timezone.utc)\n    service = SlaService(clock=clock)\n    ticket = repo.save(Ticket(created_at=datetime(2026, 1, 1, tzinfo=timezone.utc)))\n    assert service.is_breached(ticket)\n\n# parameterised tests catch edge cases without copy-paste\n@pytest.mark.parametrize('amount,expected', [\n    (0, '0.00'), (1, '0.01'), (100, '1.00'), (-250, '-2.50'),\n])\ndef test_money_formatting(amount, expected):\n    assert format_minor(amount) == expected\n\n# integration against a real database container\n@pytest.fixture(scope='session')\ndef pg():\n    with PostgresContainer('postgres:16') as container:\n        yield container",
    fu: [
      {
        q: "How do you test concurrent code?",
        a: "Force interleavings with latches and barriers rather than sleeping, assert invariants over many randomised runs, and add a watchdog that fails the test if threads do not finish (catching deadlocks). For JVM memory-model questions, jcstress.",
      },
      {
        q: "Do you practise TDD?",
        a: "Answer honestly and specifically: TDD works well for pure logic with a clear contract and poorly for exploratory or UI work. What matters more is that every bug fix ships with a test that failed before the fix — that habit is the one interviewers are actually checking for.",
      },
      {
        q: "How do you keep a large suite fast?",
        a: "Parallelise by test class with isolated data, share expensive containers across the suite rather than per test, tag slow tests to run on a schedule rather than per commit, and delete tests that no longer earn their runtime.",
      },
    ],
  },
];
