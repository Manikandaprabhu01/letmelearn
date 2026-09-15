import type { Concept } from "@/data/types";

export const springTransactions: Concept = {
  slug: "spring-transactions",
  title: "@Transactional in Depth",
  subtitle:
    "Chapter 24 — thread-bound transactions, rollback rules, propagation, read-only, and keeping network calls out",
  level: "advanced",
  minutes: 30,
  tags: ["spring", "transactions", "propagation", "rollback", "hikaricp", "outbox"],
  summary:
    "@Transactional binds a database connection to the current thread for the duration of a method call, then commits or rolls back. That sentence explains its surprises: work on another thread is outside the transaction, checked exceptions commit by default, REQUIRES_NEW needs a second connection, and a slow HTTP call inside a transaction holds a pooled connection hostage for its whole duration.",
  keyPoints: [
    "The transaction lives in a ThreadLocal — @Async tasks, CompletableFutures and parallel streams are not part of it.",
    "By default only RuntimeException and Error trigger rollback; a checked exception commits the partial work.",
    "Once an inner transactional call throws, the whole transaction is rollback-only — catching the exception does not save the commit.",
    "REQUIRES_NEW suspends the outer transaction and borrows a second connection; under load that can deadlock the pool.",
    "Never call remote services while holding a transaction; do side effects after commit.",
  ],
  prerequisites: ["/java/jdbc", "/java/spring-aop"],
  sections: [
    {
      heading: "What the proxy actually does",
      lede: "A connection, bound to a thread, for one method call.",
      diagram: {
        kind: "sequence",
        caption: "@Transactional through JpaTransactionManager and HikariCP.",
        actors: [
          { id: "c", label: "Caller" },
          { id: "i", label: "TransactionInterceptor", sub: "the proxy's advice" },
          { id: "tm", label: "JpaTransactionManager" },
          { id: "pool", label: "HikariCP" },
          { id: "m", label: "Your method" },
        ],
        messages: [
          { from: "c", to: "i", label: "placeOrder()" },
          { from: "i", to: "tm", label: "getTransaction(REQUIRED)" },
          { from: "tm", to: "pool", label: "borrow connection" },
          {
            from: "tm",
            to: "tm",
            label: "bind EntityManager + connection to thread",
            kind: "self",
          },
          { from: "i", to: "m", label: "invoke" },
          { from: "m", to: "i", label: "return / throw", kind: "return" },
          { from: "i", to: "tm", label: "commit or rollback" },
          { from: "tm", to: "pool", label: "return connection", kind: "return", tone: "ok" },
        ],
      },
      bullets: [
        "Repositories do not open their own transactions inside yours: they look up the EntityManager bound to the current thread through TransactionSynchronizationManager.",
        "Because binding is per thread, code that hands work to another thread — @Async, CompletableFuture.supplyAsync, list.parallelStream() — runs without the transaction and on a different connection.",
        "Spring Data repository methods are transactional on their own (reads as read-only). Calling three of them from a non-transactional service method means three separate transactions, not one.",
      ],
      links: [
        {
          label: "Spring Framework — declarative transaction management",
          href: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html",
        },
      ],
    },
    {
      heading: "Rollback rules and the two classic traps",
      lede: "The defaults are not what most people assume.",
      code: [
        {
          title: "Trap 1 — a checked exception commits",
          lang: "java",
          source: `public class InsufficientFundsException extends Exception { ... }   // CHECKED

@Transactional
public void transfer(long from, long to, BigDecimal amount) throws InsufficientFundsException {
    accounts.debit(from, amount);          // written
    if (limits.exceeded(to, amount)) {
        throw new InsufficientFundsException();
    }                                      // → the transaction COMMITS the debit
    accounts.credit(to, amount);
}

// Default rule: roll back on RuntimeException and Error only — a convention
// inherited from EJB. Two fixes:
@Transactional(rollbackFor = Exception.class)              // per method
// …or make domain exceptions extend RuntimeException and rely on the default,
// which is what most Spring codebases settle on.`,
        },
        {
          title: "Trap 2 — catching an inner failure does not rescue the commit",
          lang: "java",
          source: `@Service
class CheckoutService {
    @Transactional
    public void checkout(Cart cart) {
        orders.create(cart);
        try {
            loyalty.awardPoints(cart);     // @Transactional (REQUIRED) on another bean
        } catch (LoyaltyException e) {     // a RuntimeException
            log.warn("points failed, continuing", e);
        }
    }   // ← commit fails: UnexpectedRollbackException
}

// WHY: awardPoints joined the SAME transaction. When the exception passed back
// through ITS proxy, the interceptor marked the shared transaction
// rollback-only. Catching the exception afterwards cannot unmark it.
//
// Fixes, depending on intent:
//  • The failure should not affect the order → run awardPoints after commit
//    (see the last section) or in REQUIRES_NEW.
//  • The failure is expected and harmless → catch it INSIDE awardPoints, before
//    it crosses the proxy boundary.
//  • Use @Transactional(noRollbackFor = LoyaltyException.class) on awardPoints.`,
        },
      ],
    },
    {
      heading: "Propagation",
      lede: "What happens when a transactional method calls another.",
      table: {
        headers: ["Propagation", "If a transaction exists", "If none exists", "Use for"],
        rows: [
          ["REQUIRED (default)", "Join it", "Start one", "Almost everything"],
          [
            "REQUIRES_NEW",
            "Suspend it; start an independent one on a second connection",
            "Start one",
            "Audit or failure records that must survive the outer rollback",
          ],
          [
            "NESTED",
            "Savepoint inside it; roll back to the savepoint on failure",
            "Start one",
            "Partial rollback with plain JDBC; limited support with JPA",
          ],
          ["MANDATORY", "Join it", "Throw", "Methods that must never run alone"],
          ["SUPPORTS", "Join it", "Run without", "Rarely right — behaviour depends on the caller"],
          [
            "NOT_SUPPORTED",
            "Suspend it",
            "Run without",
            "Long non-database work called from a transaction",
          ],
          ["NEVER", "Throw", "Run without", "Guarding against accidental transactions"],
        ],
      },
      code: {
        title: "Example — REQUIRES_NEW for an audit trail, and its hidden cost",
        lang: "java",
        source: `@Service
class PaymentAudit {
    // Records a failed attempt even when the caller's transaction rolls back.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(long orderId, String reason) {
        auditRepository.save(new AuditEntry(orderId, reason));
    }
}

// THE COST: while recordFailure runs, the outer transaction is SUSPENDED but
// still holds its connection. The inner one borrows ANOTHER connection.`,
      },
      math: [
        {
          label: "Pool size",
          expr: "spring.datasource.hikari.maximum-pool-size",
          result: "10",
        },
        {
          label: "Concurrent requests in the outer transaction",
          expr: "each holds 1 connection",
          result: "10 in use",
        },
        {
          label: "Each now needs a second connection",
          expr: "REQUIRES_NEW → borrow 1 more",
          result: "0 available",
          note: "Every thread waits for a connection that only another waiting thread can release.",
        },
        {
          label: "What users see",
          expr: "Hikari connectionTimeout (default 30 s)",
          result: "30 s, then errors",
        },
      ],
      callout: {
        kind: "warn",
        title: "Pool size must cover the deepest nesting",
        text: "If a request path can hold N connections at once, the pool needs more than threads × N at peak, or those paths must be rare. Usually the better fix is to remove the nesting — record the audit entry after the outer transaction completes.",
      },
    },
    {
      heading: "Read-only, isolation and timeouts",
      table: {
        headers: ["Attribute", "What it really does", "Watch out"],
        rows: [
          [
            "readOnly = true",
            "Hibernate skips dirty checking and flushing; the JDBC connection is flagged read-only",
            "A hint, not a guard — some drivers still permit writes. Useful for routing to replicas",
          ],
          [
            "isolation = …",
            "Sets the isolation level on the connection for this transaction",
            "Only applied when the transaction starts; ignored when joining an existing one",
          ],
          [
            "timeout = 5",
            "Rolls back when the transaction exceeds the limit, checked as statements run",
            "Does not interrupt a single statement that is already blocked — set a query timeout too",
          ],
        ],
      },
      bullets: [
        "Put @Transactional(readOnly = true) on query-heavy service classes and override writes with @Transactional. For large reads it measurably reduces Hibernate's memory and CPU, because no snapshot is kept for dirty checking.",
        "Chapter 11 covers what each isolation level permits. Choosing one per method is rarely needed; row locks or an optimistic @Version column (chapter 25) are usually the better tool.",
      ],
    },
    {
      heading: "Keep transactions short — no network calls inside",
      lede: "The most expensive @Transactional in most codebases is around an HTTP call.",
      code: {
        title: "Example — the payment call that held the database hostage",
        lang: "java",
        source: `// BEFORE — a connection is held for the full duration of the payment call.
@Transactional
public Order checkout(Cart cart) {
    Order order = orders.save(Order.pending(cart));
    Receipt receipt = paymentApi.charge(cart.total());   // 300 ms typical, 10 s on a bad day
    order.markPaid(receipt);
    return order;
}
// Also INCORRECT: if the charge succeeds and the commit then fails, the customer
// was charged for an order that does not exist.

// AFTER — short transactions around the remote call, made safe by idempotency.
public Order checkout(Cart cart) {
    Order order = tx.execute(s -> orders.save(Order.pending(cart)));        // commit 1
    Receipt receipt = paymentApi.charge(cart.total(), order.idempotencyKey());
    return tx.execute(s -> orders.markPaid(order.getId(), receipt));        // commit 2
}
// A crash between the two leaves a PENDING order; a reconciliation job checks
// the provider using the idempotency key and completes or cancels it.

// Side effects that must follow a successful commit:
@Component
class OrderNotifications {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void onPlaced(OrderPlaced event) {
        email.sendConfirmation(event.orderId());   // never sent for a rolled-back order
    }
}`,
      },
      math: [
        {
          label: "Connections",
          expr: "pool size",
          result: "10",
        },
        {
          label: "Time each checkout holds one",
          expr: "payment p99 latency",
          result: "2 s",
        },
        {
          label: "Checkout ceiling for the whole instance",
          expr: "10 connections ÷ 2 s",
          result: "5 per second",
          note: "Every other endpoint needing a connection queues behind checkout.",
        },
      ],
      callout: {
        kind: "insight",
        title: "AFTER_COMMIT is not a delivery guarantee",
        text: "If the process dies between the commit and the listener, the email or event is lost. When the side effect must happen, write it to an outbox table inside the transaction and publish from there — the transactional outbox pattern.",
      },
      links: [
        { label: "Site: transactional outbox", href: "/hld/transactional-outbox" },
        { label: "Site: idempotency", href: "/hld/idempotency" },
      ],
    },
    {
      heading: "Testing transactional code honestly",
      bullets: [
        "@Transactional on a test class rolls back after each test — convenient, and it hides real behaviour: nothing is ever committed, so AFTER_COMMIT listeners never fire and constraint violations detected at commit never surface.",
        "Lazy loading also works in such tests because the persistence context stays open for the whole test, then fails in production with LazyInitializationException.",
        "For code whose correctness depends on commit boundaries, run the test without a test transaction against a real database (Testcontainers) and clean up explicitly.",
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Does @Transactional roll back on every exception?",
          a: "No. By default it rolls back on RuntimeException and Error. Checked exceptions commit unless you declare rollbackFor, which is why many teams make domain exceptions unchecked.",
        },
        {
          q: "What causes UnexpectedRollbackException?",
          a: "An inner method joined the outer transaction and threw a RuntimeException through its proxy, marking the shared transaction rollback-only. The outer method caught the exception and tried to commit, and Spring reports that the commit could not happen.",
        },
        {
          q: "When would you use REQUIRES_NEW, and what is the risk?",
          a: "When some work must commit regardless of the outer transaction — an audit or failure record. The risk is that the outer transaction keeps its connection while the inner one takes another, which can exhaust the pool under concurrency and deadlock until the connection timeout.",
        },
        {
          q: "Is it a problem to call an external API inside a transaction?",
          a: "Yes, twice over. The pooled connection is held for the API's latency, capping throughput and starving other requests; and the external effect cannot be rolled back if the commit fails. Split into short transactions around the call, use idempotency keys, and publish side effects after commit or through an outbox.",
        },
        {
          q: "Why is data written in an @Async method not rolled back with the caller's transaction?",
          a: "The transaction is bound to the caller's thread. The async method runs on another thread with its own connection, so it is either outside any transaction or in a separate one of its own.",
        },
      ],
      takeaways: [
        "A transaction is a connection bound to a thread for one call.",
        "Know the rollback rules and the rollback-only trap before writing try/catch inside transactions.",
        "Short transactions, no remote calls inside, side effects after commit.",
      ],
    },
  ],
  related: [
    "/java/jdbc",
    "/java/jpa-hibernate",
    "/java/spring-aop",
    "/hld/transactional-outbox",
    "/hld/saga-pattern",
  ],
  furtherReading: [
    {
      label: "Spring Framework — transaction management",
      href: "https://docs.spring.io/spring-framework/reference/data-access/transaction.html",
    },
    {
      label: "HikariCP — about pool sizing",
      href: "https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing",
    },
    {
      label: "Baeldung — transaction propagation and isolation in Spring",
      href: "https://www.baeldung.com/spring-transactional-propagation-isolation",
    },
  ],
};
