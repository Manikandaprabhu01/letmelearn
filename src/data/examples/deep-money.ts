import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const moneyDeepExamples: DesignExample[] = [
  {
    slug: "digital-wallet",
    title: "Design a Digital Wallet",
    source: "Volume 2",
    chapter: 12,
    difficulty: "advanced",
    minutes: 22,
    tags: ["money", "ledger", "double-entry", "idempotency", "saga"],
    companies: ["PayPal", "Venmo", "PhonePe", "Wise"],
    summary:
      "The instinct is a balance column you add to and subtract from, and that instinct is wrong in a way that is very hard to recover from. Money systems store immutable double-entry transactions and derive balances, because a balance you can overwrite is a balance you cannot audit, cannot reconcile and cannot prove. Once the ledger is right, the remaining problems are idempotency under retries, transfers that span services, and the fact that eventual consistency is not acceptable for the one invariant that matters.",
    clarifying: [
      {
        q: "Is this a closed wallet or connected to external banking?",
        a: "Both — internal transfers between users, plus top-ups and withdrawals through external rails. That distinction matters enormously: internal transfers can be atomic in one database, while anything crossing a boundary is a distributed transaction with an unreliable, slow third party.",
      },
      {
        q: "Can balances go negative?",
        a: "No, and that is the hard invariant. Everything else in the design can be eventually consistent; the non-negative balance check cannot, because a negative balance is money created from nothing.",
      },
      {
        q: "Single currency or multi-currency?",
        a: "Multi-currency, which means a balance is per user per currency and a conversion is two ledger entries plus a rate, never a mutation of one number. Storing amounts as integer minor units throughout — never floating point.",
      },
      {
        q: "What are the auditing and regulatory requirements?",
        a: "Assume full auditability: every movement traceable, nothing ever deleted or updated in place, and the ability to reproduce any historical balance. That requirement alone dictates the storage model.",
      },
      {
        q: "What volume are we handling?",
        a: "Modest transactionally — thousands per second at peak — so this is emphatically not a throughput problem. It is a correctness problem, and I would rather spend the budget on guarantees than on scale.",
      },
    ],
    requirements: {
      functional: [
        "Transfer funds between users atomically",
        "Top up from and withdraw to external payment rails",
        "Show current balance and a complete transaction history",
        "Support multi-currency balances and conversion",
      ],
      nonFunctional: [
        "Money is never created or destroyed — debits always equal credits",
        "Balances never go negative",
        "Every operation is idempotent under retries",
        "Complete auditability: append-only, reproducible, reconcilable",
      ],
    },
    math: [
      {
        label: "Transaction volume",
        expr: "50 M transactions/day ÷ 10⁵",
        result: "≈ 600/s, peak ~3,000/s",
        note: "Small. Any competent relational database handles this, which is why correctness rather than scale drives the design.",
      },
      {
        label: "Ledger growth",
        expr: "600/s × 2 entries × ~200 B × 86,400",
        result: "≈ 20 GB/day",
        note: "Two entries per transaction because of double-entry. Append-only, so it grows forever — partitioned by month.",
      },
      {
        label: "Balance derivation",
        expr: "sum over a user's entries since inception",
        result: "too slow beyond ~10 K entries",
        note: "Which is why balances are snapshotted periodically and the sum runs only from the last snapshot.",
      },
      {
        label: "Snapshot cadence",
        expr: "snapshot daily, replay ~30 entries",
        result: "balance read in ~1 ms",
        note: "The snapshot is a cache of a derivable value, never the source of truth — it can always be recomputed.",
      },
      {
        label: "Hot account contention",
        expr: "a merchant receiving 500 payments/s",
        result: "500 writes/s to one balance",
        note: "The real scaling limit. Solved by appending entries rather than updating a row.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/transfers",
        desc: "Move funds — {from, to, amount, currency}; Idempotency-Key header required",
      },
      {
        method: "POST",
        path: "/v1/topups",
        desc: "Pull from an external rail; asynchronous, with a pending state",
      },
      {
        method: "POST",
        path: "/v1/withdrawals",
        desc: "Push to an external rail; funds are reserved before the external call",
      },
      {
        method: "GET",
        path: "/v1/accounts/{id}/balance",
        desc: "Derived from the last snapshot plus subsequent entries",
      },
      {
        method: "GET",
        path: "/v1/accounts/{id}/entries?cursor={}",
        desc: "Immutable statement — the audit trail the customer sees",
      },
    ],
    dataModel: [
      {
        entity: "accounts",
        fields: [
          "account_id (pk)",
          "user_id (idx), currency",
          "type (user|merchant|external_clearing|fees|reserve)",
          "status (active|frozen|closed)",
          "→ system accounts are how external money enters the ledger",
        ],
      },
      {
        entity: "transactions",
        fields: [
          "transaction_id (pk)",
          "idempotency_key (unique idx)",
          "type, status (pending|posted|reversed)",
          "created_at",
          "→ groups the entries that must balance",
        ],
      },
      {
        entity: "entries",
        fields: [
          "entry_id (pk)",
          "transaction_id (fk, idx)",
          "account_id (idx)",
          "direction (debit|credit)",
          "amount_minor (bigint — never float)",
          "→ APPEND ONLY; never updated, never deleted",
        ],
      },
      {
        entity: "balance_snapshots",
        fields: [
          "account_id, as_of (pk)",
          "balance_minor",
          "last_entry_id",
          "→ a cache of a derived value; always recomputable",
        ],
      },
    ],
    architecture: [
      {
        heading: "Double-entry, and why a balance column is a trap",
        lede: "The storage model is the design decision. Everything else follows.",
        diagram: {
          kind: "compare",
          caption: "Both store money. Only one can prove where it went.",
          options: [
            {
              title: "Mutable balance column",
              sub: "UPDATE accounts SET balance = balance - 50",
              good: ["Obvious", "Balance reads are a single row lookup"],
              bad: [
                "No history — you cannot answer why a balance is what it is",
                "A bug silently corrupts state with no way to detect or unwind it",
                "Hot rows: every payment to a merchant contends on one row",
                "Unauditable, and therefore unusable in a regulated context",
              ],
              verdict: "Never. This is the answer the question is checking you do not give.",
            },
            {
              title: "Append-only double entry",
              sub: "two entries per transaction, balance derived",
              tone: "ok",
              good: [
                "Complete history by construction; the audit trail IS the data",
                "Debits must equal credits, so imbalance is detectable at any moment",
                "Appends do not contend the way row updates do",
                "Corrections are reversing entries — the original is never altered",
              ],
              bad: [
                "Balance needs derivation, so snapshots are required",
                "More storage, and more concepts to hold in your head",
              ],
              verdict: "The only defensible model, and it is what every real ledger uses.",
            },
          ],
        },
        code: {
          title: "A transfer is two entries that must sum to zero",
          lang: "ts",
          source: `async function transfer(req: TransferRequest) {
  return db.transaction(async (tx) => {
    // Idempotency FIRST, inside the same transaction as the entries. A unique
    // constraint on the key means a retry conflicts rather than transferring
    // twice — the single most important line in a money system.
    const existing = await tx.transactions.findByKey(req.idempotencyKey);
    if (existing) return existing;

    const balance = await currentBalance(tx, req.fromAccount);
    // The one invariant that cannot be eventually consistent.
    if (balance < req.amountMinor) throw new InsufficientFunds();

    const txn = await tx.transactions.insert({
      idempotencyKey: req.idempotencyKey,     // unique index enforces once-only
      type: "transfer",
      status: "posted",
    });

    // Two entries, equal and opposite. Never one row updated twice.
    await tx.entries.insertMany([
      { transactionId: txn.id, accountId: req.fromAccount, direction: "debit",  amountMinor: req.amountMinor },
      { transactionId: txn.id, accountId: req.toAccount,   direction: "credit", amountMinor: req.amountMinor },
    ]);

    return txn;
  });
}

// Money is an integer count of minor units. A float cannot represent 0.10
// exactly, and cents that vanish into rounding are a genuine audit finding.`,
        },
        bullets: [
          "The unique constraint on the idempotency key is what makes retries safe. Clients retry on timeouts constantly, and without it a network blip becomes a duplicate transfer.",
          "Amounts are integers in minor units everywhere — cents, paise, satoshi. Floating point cannot represent common decimal values exactly, and the resulting drift is both a bug and a compliance problem.",
          "Corrections are reversing entries, never updates or deletes. The original transaction stays in the ledger forever with a compensating entry alongside it, which is what makes history trustworthy.",
          "External money enters through system accounts — a clearing account for the payment rail — so that even a top-up has two sides and the ledger stays balanced.",
        ],
        callout: {
          kind: "interview",
          title: "Lead with this",
          text: '"I would not store a mutable balance. The ledger is append-only double-entry: every transaction writes two entries that sum to zero, and the balance is derived. That gives auditability by construction, makes imbalance detectable, turns corrections into reversing entries rather than edits, and avoids the hot-row contention a balance column creates on busy merchant accounts."',
        },
      },
      {
        heading: "Deriving balances without scanning history",
        lede: "The one real cost of the append-only model, and it is easily paid.",
        diagram: {
          kind: "flow",
          caption: "Snapshot plus a short replay — never a full scan.",
          rows: [
            [
              {
                id: "snap",
                label: "Daily snapshot",
                sub: "balance + last_entry_id",
                tone: "accent",
              },
              { id: "delta", label: "Entries since", sub: "usually tens of rows" },
            ],
            [
              { id: "sum", label: "Snapshot + Σ delta", sub: "current balance", tone: "ok" },
              { id: "verify", label: "Nightly verify", sub: "recompute from zero" },
            ],
          ],
        },
        bullets: [
          "The snapshot is a derived cache, so a corrupted or missing snapshot is recoverable by recomputation — which is exactly the property a mutable balance column lacks.",
          "Recompute a sample of accounts from inception nightly and compare against the snapshot. A mismatch means a real bug, and finding it in a scheduled job is enormously better than finding it in a customer complaint.",
          "Very active accounts need more frequent snapshots. A merchant taking thousands of payments a day should not replay a day's worth of entries on every balance read.",
          "Reads of a balance are eventually consistent and that is fine; only the write-side check must see a consistent value, which it does because it runs inside the transaction.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Transfers that cross a boundary",
        lede: "Inside one database this is a transaction. Across services it is a saga.",
        diagram: {
          kind: "sequence",
          caption:
            "Reserve, attempt, then confirm or compensate — never a distributed two-phase commit.",
          actors: [
            { id: "c", label: "Client" },
            { id: "w", label: "Wallet" },
            { id: "l", label: "Ledger" },
            { id: "b", label: "Bank rail" },
          ],
          messages: [
            { from: "c", to: "w", label: "1. withdraw 50.00 (idempotency key)", kind: "call" },
            {
              from: "w",
              to: "l",
              label: "2. reserve: debit user, credit pending-out",
              kind: "call",
              tone: "accent",
            },
            { from: "l", to: "w", label: "3. posted — funds no longer spendable", kind: "return" },
            { from: "w", to: "b", label: "4. initiate payout (same key)", kind: "call" },
            {
              from: "b",
              to: "w",
              label: "5. …timeout, outcome unknown",
              kind: "return",
              tone: "warn",
            },
            { from: "w", to: "b", label: "6. poll by key until resolved", kind: "call" },
            { from: "b", to: "w", label: "7. settled", kind: "return", tone: "ok" },
            {
              from: "w",
              to: "l",
              label: "8. debit pending-out, credit external clearing",
              kind: "call",
              tone: "ok",
            },
          ],
        },
        bullets: [
          "Reserving into a pending account first means the funds are unspendable from the moment the withdrawal starts, which closes the window in which a user could spend the same money twice.",
          "A timeout from an external rail is not a failure. Reversing the reservation on an unknown outcome risks paying out and crediting the user back, so the saga polls until the state is known — sometimes for hours.",
          "Compensation is a new reversing transaction, not a rollback. The reservation stays in the ledger with a compensating entry, so the history shows what was attempted and what happened.",
          "Two-phase commit across a bank is not available and would not be desirable — an external provider will never hold a prepare lock for you, which is precisely why the saga pattern exists.",
        ],
        callout: {
          kind: "warn",
          title: "Reconciliation is part of the system",
          text: "Ledgers drift from external providers: a payout succeeds and the callback is lost, a refund arrives out of band, a provider restates a settlement. A daily reconciliation job that matches provider records against ledger entries and raises exceptions for unmatched items is not optional operational hygiene — it is the mechanism by which the ledger stays true, and it needs a human queue for the exceptions.",
        },
      },
      {
        heading: "Consistency: what can be relaxed and what cannot",
        body: [
          "It is tempting to apply the usual eventual-consistency reasoning here, and mostly it applies — but there is exactly one place it does not, and identifying it precisely is what a good answer does.",
        ],
        table: {
          caption: "Not all of a money system needs the same guarantees.",
          headers: ["Operation", "Consistency required", "Why"],
          rows: [
            [
              "Balance check before debit",
              "Strong, in-transaction",
              "A stale read here creates money",
            ],
            ["Displayed balance", "Eventual (seconds)", "A slightly stale display is harmless"],
            ["Transaction history", "Eventual", "Entries are immutable; late arrival is fine"],
            ["Notifications and receipts", "Eventual", "Delivery is decoupled by design"],
            ["Fraud and analytics", "Eventual (minutes)", "Operates on a stream, retrospectively"],
          ],
        },
        bullets: [
          "Because the strong requirement is confined to one check, the account can be the sharding key: both sides of an internal transfer usually live in the same shard, and when they do not, the transfer becomes a saga between two shards.",
          "Serialise per account rather than globally. Two transfers from different users have no relationship, so there is no need for a global ordering — only for per-account ordering.",
          "Reads of the displayed balance can come from a replica, and should, so that reporting traffic never contends with the write path that must be exact.",
          "Freezing an account is a state change on the account, checked in the same transaction as the debit — not a separate system that might not have caught up.",
        ],
      },
      {
        heading: "Hot accounts and contention",
        body: [
          "A popular merchant receiving hundreds of payments a second is the scaling limit, and it is another place the append-only model quietly wins over a balance column.",
        ],
        bullets: [
          "Appends to an entries table do not serialise the way updates to one balance row do, so a hot merchant account is far less contended than the naive model would make it.",
          "Where a hot account must still be checked for sufficient funds — a merchant paying out constantly — shard the account into sub-accounts and sum across them, at the cost of a more complex balance derivation.",
          "Batch settlement rather than posting every payment individually where the business allows: aggregating a merchant's receipts into periodic settlement transactions cuts the entry count substantially.",
          "Snapshot hot accounts far more frequently, since their replay window grows fastest.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Append-only double-entry ledger",
        pickWhen: "Always, for anything holding money",
        cost: "Balance derivation, snapshots, and more storage",
      },
      {
        choice: "Balance snapshots",
        pickWhen: "Accounts accumulate many entries",
        cost: "A cache that must be verified against recomputation",
      },
      {
        choice: "Saga for external transfers",
        pickWhen: "Any movement crossing a service or provider boundary",
        cost: "Pending states, polling, and compensating entries to reason about",
      },
      {
        choice: "Idempotency key with a unique constraint",
        pickWhen: "Always",
        cost: "Clients must generate and reuse stable keys across retries",
      },
      {
        choice: "Integer minor units",
        pickWhen: "Always",
        cost: "Explicit handling of currencies with different exponents",
      },
      {
        choice: "Shard by account",
        pickWhen: "Volume genuinely exceeds one database — rarely",
        cost: "Cross-shard transfers become sagas rather than transactions",
      },
    ],
    wrapUp: [
      "Never store a mutable balance. The ledger is append-only double-entry and the balance is derived, which gives auditability, detectability of imbalance, and corrections as reversing entries rather than edits.",
      "Amounts are integers in minor units; floating point loses cents and that is an audit finding, not a rounding detail.",
      "Idempotency with a unique constraint, written in the same transaction as the entries, is what makes retries safe — and clients retry constantly.",
      "Exactly one thing needs strong consistency: the balance check before a debit. Everything else — displayed balances, history, notifications, fraud — can be eventual, and saying precisely where the line sits is the point.",
      "Anything crossing an external boundary is a saga with a reservation, a polling resolution for unknown outcomes, and compensation by reversing entry rather than rollback.",
      "Reconciliation against external providers is part of the system, with a human exception queue — ledgers drift, and scheduled detection beats customer complaints.",
    ],
    followUps: [
      {
        q: "Why not just keep a balance column and update it?",
        a: "Because it destroys every property a money system needs. There is no history, so you cannot answer why a balance is what it is or reproduce it for a given date, which makes the system unauditable and therefore unusable in a regulated context. A bug corrupts state silently with no way to detect or unwind it, because the previous value is simply gone. It creates hot-row contention on exactly the busiest accounts, since every payment to a merchant updates one row. And corrections become edits, which means the record of what actually happened is being rewritten. Append-only double entry fixes all of those at the cost of deriving the balance, which snapshots make cheap.",
      },
      {
        q: "A client sends the same transfer request twice because the first timed out. What happens?",
        a: "The second one returns the original result rather than moving money again, because the idempotency key carries a unique constraint and is written in the same transaction as the entries. The second attempt either finds the existing transaction and returns it, or conflicts on the insert and is handled as a duplicate — either way there is exactly one pair of entries. The critical detail is that the key must be generated by the client per logical operation and reused across retries; a key generated fresh on each attempt makes every retry look like a new transfer, which is the most common way idempotency is implemented and silently does nothing. It also matters that the check lives inside the transaction, since checking first and inserting afterwards reopens the race.",
      },
      {
        q: "Which parts of this can be eventually consistent?",
        a: "Almost all of it, and being precise about the exception is the answer. The displayed balance can be seconds stale and should be served from a replica, transaction history can lag, notifications and receipts are decoupled by design, and fraud scoring operates retrospectively on a stream. The one thing that cannot be relaxed is the sufficient-funds check before a debit, because a stale read there allows the same money to be spent twice, which creates money from nothing. That check runs inside the transaction that writes the entries, so it sees a consistent value. Because the strong requirement is confined to a single account, the account is also the natural sharding key, and per-account serialisation is all that is needed rather than any global ordering.",
      },
      {
        q: "A withdrawal to a bank times out. What do you do with the funds?",
        a: "Leave them reserved. They were already moved out of the user's spendable balance into a pending account when the withdrawal started, which is what stops the same money being spent elsewhere while the payout is in flight. A timeout means the outcome is unknown rather than failed, so reversing the reservation risks the bank having paid out while the user is also credited back — the worst outcome available. Instead the saga polls the provider by the same idempotency key until the state resolves, which can take hours, and only then either completes the transaction by moving the pending amount to the external clearing account or compensates with a reversing entry that returns the funds. The compensation is a new transaction, never a rollback, so the history shows what was attempted.",
      },
      {
        q: "How do you know the ledger is correct?",
        a: "By checking, continuously, in two directions. Internally, every transaction's entries must sum to zero and the system-wide sum of all entries must be zero, which is a cheap invariant to assert and makes any imbalance immediately detectable — that is one of the main reasons for double entry rather than single. A nightly job also recomputes a sample of account balances from inception and compares them against the snapshots, since a mismatch indicates a real bug and finding it in a scheduled job is far better than finding it in a customer complaint. Externally, a reconciliation job matches provider settlement records against ledger entries and raises unmatched items into a human exception queue, because lost callbacks and out-of-band refunds mean drift is inevitable rather than exceptional.",
      },
    ],
    related: [
      "/examples/payment",
      "/examples/stock-exchange",
      "/hld/consistency",
      "/hld/idempotency",
      "/examples/hotel-reservation",
    ],
    furtherReading: [
      {
        label: "Double-entry bookkeeping",
        href: "https://en.wikipedia.org/wiki/Double-entry_bookkeeping",
      },
      {
        label: "Square — books: an immutable double-entry ledger",
        href: "https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/",
      },
    ],
  },

  {
    slug: "stock-exchange",
    title: "Design a Stock Exchange",
    source: "Volume 2",
    chapter: 13,
    difficulty: "advanced",
    minutes: 24,
    tags: ["matching engine", "low latency", "determinism", "order book", "sequencer"],
    companies: ["NASDAQ", "NYSE", "LSE", "Binance"],
    summary:
      "The one design in the catalogue where the right answer is a single thread. Every distributed-systems instinct — shard it, replicate it, scale it out — makes an exchange worse, because matching must be deterministic and strictly ordered per symbol, and coordination costs more than it buys. The architecture is a sequencer writing to a log, a single-threaded matcher per symbol replaying it, and replicas that stay identical because they process the same input in the same order.",
    clarifying: [
      {
        q: "What order types must we support?",
        a: "Limit and market at minimum, plus cancel and replace. Stops, icebergs and other conditional types change the matcher's complexity considerably, so I would scope to limit and market and mention where the others fit.",
      },
      {
        q: "What is the latency target?",
        a: "Microseconds inside the matching engine and sub-millisecond end to end. That target, not throughput, is what rules out the usual distributed architecture — a network hop inside the matching path costs more than the entire budget.",
      },
      {
        q: "What fairness guarantee do we owe?",
        a: "Strict price-time priority, deterministically. Two orders arriving in a given order must always produce the same trades, because this is a regulated, auditable system where 'the result depends on thread scheduling' is not an acceptable answer.",
      },
      {
        q: "How is market data distributed?",
        a: "A public feed of trades and book updates to everyone, plus private order acknowledgements. Fair distribution matters — if one participant sees prices earlier than another, that is a regulatory problem, not an optimisation.",
      },
      {
        q: "What happens on a crash mid-session?",
        a: "The book must be recovered exactly, including every resting order. That requirement is what makes the input log the centre of the design: state is rebuilt by replaying it rather than by restoring a snapshot of mutable memory.",
      },
    ],
    requirements: {
      functional: [
        "Accept limit and market orders, cancels and replacements",
        "Match by strict price-time priority",
        "Publish trades and order-book updates as market data",
        "Recover the full book exactly after a failure",
      ],
      nonFunctional: [
        "Matching latency in microseconds; deterministic, not merely fast on average",
        "Total ordering per symbol — the same input always produces the same output",
        "No lost or duplicated orders",
        "Auditable: every decision reconstructible from the input log",
      ],
    },
    math: [
      {
        label: "Order rate",
        expr: "peak across a major venue",
        result: "≈ 1 M messages/s, bursty",
        note: "Most are cancels and replacements rather than trades — quoting activity dominates.",
      },
      {
        label: "Per-symbol rate",
        expr: "spread across thousands of symbols",
        result: "hundreds to low thousands/s each",
        note: "Which is why one thread per symbol is not only viable but comfortable.",
      },
      {
        label: "Matching cost",
        expr: "price level lookup + FIFO queue pop",
        result: "≈ 100 ns–1 µs per order",
        note: "In-memory, cache-friendly, no allocation on the hot path. A network round trip is a thousand times more.",
      },
      {
        label: "Book size",
        expr: "~10 K resting orders × ~100 B",
        result: "≈ 1 MB per symbol",
        note: "Trivially fits in cache-friendly memory — the whole book is essentially a small data structure.",
      },
      {
        label: "Cost of coordination",
        expr: "one network round trip vs a match",
        result: "≈ 50 µs vs ≈ 1 µs",
        note: "This ratio is the entire argument against distributing the matching engine.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/orders (binary protocol in practice)",
        desc: "New order — symbol, side, price, quantity, type, client order id",
      },
      {
        method: "DELETE",
        path: "/v1/orders/{clientOrderId}",
        desc: "Cancel; must be as fast as placing, since stale quotes are a real risk",
      },
      {
        method: "PUT",
        path: "/v1/orders/{clientOrderId}",
        desc: "Replace — semantically a cancel plus a new order, losing time priority",
      },
      {
        method: "SUB",
        path: "/v1/marketdata/{symbol}",
        desc: "Public feed: trades and book deltas, sequenced and gap-detectable",
      },
      {
        method: "SUB",
        path: "/v1/reports",
        desc: "Private execution reports — acknowledgements, fills, cancels",
      },
    ],
    dataModel: [
      {
        entity: "input_log",
        fields: [
          "sequence (pk, monotonic per symbol)",
          "type (new|cancel|replace)",
          "payload, received_at",
          "→ THE source of truth; everything else is derived by replay",
        ],
      },
      {
        entity: "order_book (in memory)",
        fields: [
          "bids: price → FIFO queue of orders",
          "asks: price → FIFO queue of orders",
          "order_index: order_id → position",
          "→ never persisted directly; rebuilt from the log",
        ],
      },
      {
        entity: "trades",
        fields: [
          "trade_id (pk)",
          "symbol, price, quantity",
          "buy_order_id, sell_order_id",
          "sequence, executed_at",
          "→ output, published and persisted for clearing",
        ],
      },
      {
        entity: "snapshots",
        fields: [
          "symbol, sequence (pk)",
          "book_state (serialised)",
          "→ purely a recovery optimisation, so replay starts nearer the end",
        ],
      },
    ],
    architecture: [
      {
        heading: "Sequence first, then match deterministically",
        lede: "Ordering is decided once, at the front, and never again.",
        diagram: {
          kind: "system",
          caption:
            "The log is the boundary between the nondeterministic world and the deterministic one.",
          columns: [
            {
              title: "Nondeterministic",
              nodes: [
                { id: "cli", label: "Participants", sub: "arrive in any order" },
                { id: "gw", label: "Gateways", sub: "validate, risk-check" },
              ],
            },
            {
              title: "The decision point",
              nodes: [
                { id: "seq", label: "Sequencer", sub: "assigns a total order", tone: "accent" },
                { id: "log", label: "Input log", sub: "replicated, durable" },
              ],
            },
            {
              title: "Deterministic",
              nodes: [
                { id: "m", label: "Matcher", sub: "1 thread per symbol", tone: "ok" },
                { id: "rep", label: "Replicas", sub: "same input, same state" },
                { id: "md", label: "Market data", sub: "sequenced output" },
              ],
            },
          ],
        },
        bullets: [
          "Once the sequencer assigns an order, the outcome is fully determined. Every replica replaying the same log reaches byte-identical state, which is what makes hot standby trivial — no state replication protocol is needed at all.",
          "Risk checks and validation happen in the gateway, before sequencing, so the matcher does nothing but match. Anything conditional or slow in the matching loop breaks the latency budget and the determinism argument.",
          "The matcher must have no wall-clock reads, no random numbers and no external calls. Timestamps come from the log entry, or replay would diverge from the original run.",
          "Recovery is replay: load the most recent snapshot, apply subsequent log entries, and the book is exactly as it was. Snapshots are an optimisation, never the source of truth.",
        ],
        callout: {
          kind: "interview",
          title: "The counterintuitive answer",
          text: '"I would use a single thread per symbol and no distribution inside the matching engine. A match takes about a microsecond; a network round trip takes fifty. Any coordination protocol costs more than the work it coordinates, and it also destroys determinism, which a regulated venue cannot give up. Scale comes from partitioning symbols across engines, not from parallelising one book."',
        },
      },
      {
        heading: "The book, and why it is a simple data structure",
        lede: "Price-time priority is two sorted maps of FIFO queues.",
        code: {
          title: "Matching is a loop over price levels",
          lang: "ts",
          source: `// Bids sorted descending, asks ascending. Each price level is a FIFO queue,
// which is exactly what price-time priority means: better price first, and
// within a price, whoever arrived first.
class OrderBook {
  private bids = new SortedMap<number, Deque<Order>>(descending);
  private asks = new SortedMap<number, Deque<Order>>(ascending);

  match(incoming: Order): Trade[] {
    const trades: Trade[] = [];
    const opposite = incoming.side === "buy" ? this.asks : this.bids;

    while (incoming.remaining > 0 && opposite.size > 0) {
      const [bestPrice, queue] = opposite.first();
      if (!this.crosses(incoming, bestPrice)) break;   // no longer marketable

      const resting = queue.peek();
      const qty = Math.min(incoming.remaining, resting.remaining);

      // The RESTING order's price is the trade price — the passive side set
      // the terms. Getting this backwards is a classic and expensive error.
      trades.push({ price: bestPrice, quantity: qty, restingId: resting.id, incomingId: incoming.id });

      incoming.remaining -= qty;
      resting.remaining -= qty;
      if (resting.remaining === 0) queue.pop();
      if (queue.isEmpty()) opposite.removeFirst();
    }

    // A limit order with quantity left rests and gains time priority.
    // A market order with quantity left is cancelled, never rested.
    if (incoming.remaining > 0 && incoming.type === "limit") this.rest(incoming);
    return trades;
  }
}`,
        },
        bullets: [
          "The trade executes at the resting order's price, because the passive side posted the terms and the aggressor accepted them. Reversing this changes who captures the spread and is a costly mistake.",
          "A replace loses time priority, which is why it is semantically a cancel plus a new order rather than an in-place edit — and why participants care about the distinction.",
          "Avoid allocation and pointer chasing on the hot path. Pre-allocated arrays and object pools matter here in a way they do not in ordinary services, because the budget is measured in hundreds of nanoseconds.",
          "Partial fills are the norm rather than the exception, and the remaining quantity resting at the back of its price queue is what makes the FIFO structure the right one.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Determinism as an architectural property",
        body: [
          "Determinism is not a nice-to-have — it is what makes replication, recovery, testing and regulatory audit all work with one mechanism. Losing it means needing a separate, much harder solution for each.",
        ],
        table: {
          caption: "What determinism buys, and what breaks it.",
          headers: ["Benefit", "How it works", "Broken by"],
          rows: [
            ["Hot standby", "Replicas replay the same log", "Any wall-clock read in the matcher"],
            ["Exact recovery", "Snapshot plus replay", "Non-reproducible ordering"],
            ["Regulatory audit", "Replay the day and compare", "Randomness or thread scheduling"],
            [
              "Testing",
              "Record production input, replay in a test",
              "External calls from the matching path",
            ],
            ["Bug investigation", "Reproduce the exact sequence", "Concurrency in the matcher"],
          ],
        },
        bullets: [
          "Replica state is kept identical by giving them identical input, not by copying state. That is far simpler and far faster than any consensus-based replication of mutable structures.",
          "Every source of nondeterminism must be pushed outside the matcher: timestamps come from the log, identifiers are derived from the sequence number, and nothing in the loop consults the outside world.",
          "The ability to replay an entire trading day and reproduce every trade exactly is the audit story. Without determinism you would need to log every decision instead of every input, which is far more data and far weaker evidence.",
          "This is also why the matcher is single-threaded. Multi-threading the book would make outcomes depend on scheduling, which destroys all of the above to gain throughput the system does not need.",
        ],
      },
      {
        heading: "Scaling by partitioning symbols",
        body: [
          "The engine does not scale up; the venue scales out by symbol. That works because symbols are genuinely independent — an order in one instrument can never match against another.",
        ],
        bullets: [
          "Assign symbols to engines and keep each symbol wholly on one. Splitting a single book across machines would require distributed agreement on ordering, which is both slow and unnecessary.",
          "Balance by activity rather than by count. A handful of symbols carry a large share of volume, so an even split by name leaves some engines idle and others saturated.",
          "Multi-symbol orders — spreads, baskets, index arbitrage — are the genuinely hard case, since they span engines. Most venues handle them as separate orders with the coordination pushed to the participant rather than into the matcher.",
          "Gateways fan out to the right engine by symbol, which keeps the routing decision outside the latency-critical path.",
        ],
        callout: {
          kind: "insight",
          text: "This design inverts the usual lesson. Everywhere else in the catalogue, the answer to more load is to distribute; here, distribution is the thing to avoid, because the unit of work is a microsecond and coordination costs fifty. Recognising when the standard playbook does not apply is the real skill being tested.",
        },
      },
      {
        heading: "Market data and fairness",
        body: [
          "Publishing results is a distribution problem with an unusual constraint: not merely fast, but equally fast for everyone, because differential latency between participants is a regulatory concern rather than a performance one.",
        ],
        bullets: [
          "Sequence every market-data message so subscribers can detect gaps and request retransmission. A silently missing book update leaves a participant trading against a stale picture.",
          "Multicast to deliver the same bytes to everyone at effectively the same instant, rather than serialising unicast sends that inherently favour whoever is earlier in the loop.",
          "Offer both an incremental feed and periodic snapshots, so a subscriber joining mid-session or recovering from a gap can resynchronise without replaying the day.",
          "Private execution reports go only to the owning participant and must not be inferable from the public feed earlier than the public feed itself.",
        ],
      },
      {
        heading: "Risk, halts and the things that stop trading",
        body: [
          "An exchange needs controls that deliberately interrupt matching, and where they live matters: in the gateway if they are per-participant, in the matcher only if they are intrinsic to the book.",
        ],
        table: {
          caption: "Controls, and where each belongs.",
          headers: ["Control", "Location", "Rationale"],
          rows: [
            [
              "Credit and position limits",
              "Gateway, pre-sequencer",
              "Per participant; must not slow the matcher",
            ],
            [
              "Fat-finger price bounds",
              "Gateway",
              "Rejects obvious errors before they reach the book",
            ],
            ["Circuit breaker / volatility halt", "Matcher", "Depends on the book's own state"],
            ["Kill switch", "Gateway", "Must work even if a participant is misbehaving badly"],
            [
              "Auction open and close",
              "Matcher",
              "A different matching algorithm for those phases",
            ],
          ],
        },
        bullets: [
          "Opening and closing auctions are a separate algorithm — collect orders without matching, then compute the single price that maximises executed volume — and are worth naming as a distinct mode rather than a special case of continuous trading.",
          "A halt must stop matching but keep accepting cancels, or participants are trapped holding orders they cannot withdraw during exactly the period of greatest uncertainty.",
          "Per-participant checks belong in the gateway, so a slow risk lookup never enters the matching loop and one participant's limits cannot affect everyone's latency.",
          "Every control action is itself a log entry, so a halt and its resumption are part of the replayable record like anything else.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Single-threaded matcher per symbol",
        pickWhen: "Always — determinism and latency both demand it",
        cost: "One symbol's throughput is bounded by one core, which is ample",
      },
      {
        choice: "Sequencer plus input log",
        pickWhen: "Always",
        cost: "The sequencer is a throughput bottleneck and needs careful failover",
      },
      {
        choice: "Replicas by deterministic replay",
        pickWhen: "Always",
        cost: "Any nondeterminism in the matcher silently breaks replication",
      },
      {
        choice: "Partition symbols across engines",
        pickWhen: "Venue-level scale",
        cost: "Cross-symbol strategies get no atomicity from the venue",
      },
      {
        choice: "Multicast market data",
        pickWhen: "Fairness between participants is regulated",
        cost: "Needs gap detection and retransmission machinery",
      },
      {
        choice: "Risk checks in the gateway",
        pickWhen: "Always, for per-participant limits",
        cost: "A short window between the check and sequencing",
      },
    ],
    wrapUp: [
      "This is the design where distribution is the wrong instinct: a match costs a microsecond and a network round trip costs fifty, so coordination inside the matching engine costs more than the work it coordinates.",
      "A sequencer assigns total order once and writes to a durable log; everything downstream is a deterministic function of that log.",
      "Determinism is the load-bearing property — it gives hot standby, exact recovery, replayable audit and reproducible tests through a single mechanism, and any wall-clock read or randomness in the matcher destroys all of them.",
      "The book itself is simple: two sorted maps of FIFO queues, with trades executing at the resting order's price.",
      "Scale comes from partitioning symbols across engines, balanced by activity rather than by count, because symbols never match against each other.",
      "Market data must be fair as well as fast, which means sequenced multicast with gap detection rather than serialised unicast that favours whoever is first in the loop.",
    ],
    followUps: [
      {
        q: "Why single-threaded? Surely that does not scale.",
        a: "It scales exactly as far as it needs to, and parallelising would make things worse rather than better. A match is a price-level lookup and a queue operation — roughly a microsecond, entirely in cache-friendly memory — while any coordination between threads or machines costs tens of microseconds, so the synchronisation would dominate the work. More importantly, concurrency makes outcomes depend on scheduling, and a regulated venue cannot have trades that vary between runs of the same input: determinism is what gives hot standby, exact recovery and replayable audit. Per-symbol rates are in the hundreds to low thousands per second, which one thread handles comfortably, and venue-level scale comes from partitioning symbols across engines.",
      },
      {
        q: "The matching engine crashes mid-session. How do you recover the book?",
        a: "By replaying the input log, which is the reason the log is the source of truth rather than the book. The matcher loads the most recent snapshot, applies every log entry after it, and arrives at exactly the state it had — every resting order, in the right position in the right price queue. This works only because matching is deterministic: the same inputs in the same order always produce the same book, which is why the matcher must never read a wall clock, use randomness, or call anything external. Snapshots exist purely to shorten the replay and can be discarded without loss. The same property means a hot standby is simply another replica consuming the same log, so failover is promoting a process that is already in the identical state.",
      },
      {
        q: "Two orders arrive at the same microsecond. Who gets filled first?",
        a: "Whoever the sequencer ordered first, and that is the entire point of having one. Arrival is genuinely nondeterministic — it depends on network paths, interrupt timing and gateway scheduling — so the design confines all of that ambiguity to a single component that makes one decision and records it in the log. After the sequencer, there is no ambiguity anywhere in the system: every replica, every replay and every audit reaches the same answer. Within a price level the rule is strict time priority by that sequence, so the earlier-sequenced order sits ahead in the FIFO queue and fills first. It is also why a replace is a cancel plus a new order rather than an edit: changing an order means taking a new position in the queue.",
      },
      {
        q: "At what price does a trade execute when a buy at 101 hits a sell resting at 100?",
        a: "At 100 — the resting order's price. The passive side posted the terms and the aggressor accepted them, so the buyer pays less than their limit and the difference is price improvement rather than a windfall for the venue. Getting this backwards is a real and expensive error, because it changes who captures the spread on every single trade. The buyer's limit of 101 only determines whether the order is marketable at all; once it crosses, the resting price governs. If the incoming order has quantity remaining after consuming that level, it continues to the next price level and may execute at several prices, which is why a single order commonly produces multiple trades at different prices.",
      },
      {
        q: "How do you add a second matching engine?",
        a: "By giving it a different set of symbols, never by splitting a book. Symbols are genuinely independent — an order in one instrument cannot match against another — so partitioning by symbol needs no coordination at all, whereas splitting one book across machines would require distributed agreement on ordering and would reintroduce exactly the latency and nondeterminism the design exists to avoid. The allocation should be balanced by activity rather than by symbol count, since a small number of instruments carry a disproportionate share of volume. The awkward case worth naming is cross-symbol strategies such as spreads and index arbitrage, which span engines and therefore get no atomicity from the venue; most exchanges leave that coordination to the participant rather than complicating the matcher.",
      },
    ],
    related: [
      "/examples/digital-wallet",
      "/examples/payment",
      "/hld/consistency",
      "/lld/observer",
      "/examples/distributed-mq",
    ],
    furtherReading: [
      {
        label: "Order matching systems",
        href: "https://en.wikipedia.org/wiki/Order_matching_system",
      },
      {
        label: "LMAX architecture — the single-threaded business logic argument",
        href: "https://martinfowler.com/articles/lmax.html",
      },
    ],
  },

  {
    slug: "auth-system",
    title: "Design an Authentication System",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["sessions", "jwt", "oauth", "revocation", "mfa"],
    companies: ["Auth0", "Okta", "Keycloak", "every product with a login box"],
    summary:
      'Everyone reaches for JWTs and most of the interview is about the consequence: a stateless token cannot be revoked, and "log out everywhere", "disable this employee now" and "this token was stolen" are all revocation. The honest design names that trade explicitly and picks a hybrid — short-lived access tokens with a stateful refresh path — rather than pretending statelessness is free.',
    clarifying: [
      {
        q: "First-party login, social sign-in, or enterprise SSO?",
        a: "All three eventually, and they are different problems: password handling, an OAuth/OIDC client flow, and SAML or OIDC federation with an enterprise identity provider. I would design the session layer so the authentication method is pluggable and everything downstream is identical.",
      },
      {
        q: "How quickly must access revocation take effect?",
        a: "The question that decides the token design. If minutes are acceptable, short-lived stateless tokens work; if it must be immediate — an employee dismissal, a compromised account — then something stateful must sit in the request path.",
      },
      {
        q: "Web, mobile, or both?",
        a: "Both, and they have genuinely different storage constraints. A browser needs protection from cross-site scripting and request forgery, which points to httpOnly cookies; a mobile app has secure OS-level storage and no cookie semantics.",
      },
      {
        q: "Do we need multi-factor authentication?",
        a: "Yes, and it should be a step in the flow rather than bolted on, because a partially-authenticated state — password accepted, second factor pending — has to exist and must not be usable as a session.",
      },
      {
        q: "What scale?",
        a: "Modest in transactional terms; logins are rare compared with requests. But token validation happens on every single request, so that path must be extremely cheap — which is exactly the pressure that pushes people towards stateless tokens.",
      },
    ],
    requirements: {
      functional: [
        "Register and authenticate users with a password, plus social and enterprise SSO",
        "Issue credentials that services can validate on every request",
        "Support multi-factor authentication",
        "Log out from one device, and from all devices",
      ],
      nonFunctional: [
        "Validation adds negligible latency to every request",
        "Revocation takes effect within a defined, stated window",
        "Credentials are never stored recoverably",
        "Compromise of one service must not yield the ability to mint credentials",
      ],
    },
    math: [
      {
        label: "Login rate",
        expr: "10 M DAU, ~1.2 logins/day",
        result: "≈ 140/s, peak ~600/s",
        note: "Small. Password hashing dominates the cost of this path, deliberately.",
      },
      {
        label: "Validation rate",
        expr: "10 M DAU × 200 requests/day",
        result: "≈ 23,000/s",
        note: "Two orders of magnitude above logins, which is why validation cost is the thing to optimise.",
      },
      {
        label: "Hashing cost",
        expr: "bcrypt/argon2 tuned to ~100 ms",
        result: "≈ 600 × 0.1 s = 60 cores at peak",
        note: "Expensive on purpose — that is the defence against offline cracking of a leaked table.",
      },
      {
        label: "Session store",
        expr: "10 M sessions × ~500 B",
        result: "≈ 5 GB",
        note: "Small enough that a stateful session store is entirely practical, which undercuts the usual argument for JWTs.",
      },
      {
        label: "Revocation lag",
        expr: "access token TTL",
        result: "15 min TTL → up to 15 min of access",
        note: "The number to state out loud. It is the security property the design is choosing.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/auth/login",
        desc: "Credentials in, tokens out; may return an MFA challenge instead",
      },
      {
        method: "POST",
        path: "/v1/auth/mfa/verify",
        desc: "Completes a partially-authenticated state into a full session",
      },
      {
        method: "POST",
        path: "/v1/auth/refresh",
        desc: "Exchange a refresh token for a new access token — the stateful checkpoint",
      },
      {
        method: "POST",
        path: "/v1/auth/logout",
        desc: "Revoke this session; ?all=true revokes every session for the user",
      },
      {
        method: "GET",
        path: "/.well-known/jwks.json",
        desc: "Public keys so services validate signatures without calling the auth service",
      },
      {
        method: "GET",
        path: "/v1/sessions",
        desc: "Active sessions with device and location — users need to see and kill them",
      },
    ],
    dataModel: [
      {
        entity: "users",
        fields: [
          "user_id (pk)",
          "email (unique idx)",
          "password_hash (argon2id — never the password)",
          "mfa_secret (encrypted), mfa_enabled",
          "status (active|locked|disabled)",
        ],
      },
      {
        entity: "sessions",
        fields: [
          "session_id (pk)",
          "user_id (idx)",
          "refresh_token_hash (unique)",
          "device, ip, created_at, last_used_at",
          "expires_at (idx), revoked_at",
          "→ stateful: this is what makes revocation possible",
        ],
      },
      {
        entity: "revocations",
        fields: [
          "user_id (pk)",
          "not_before (timestamp)",
          "→ tokens issued before this are rejected; small and cacheable",
        ],
      },
      {
        entity: "identities",
        fields: [
          "provider, provider_user_id (pk)",
          "user_id (fk, idx)",
          "→ links Google, SAML and password logins to one account",
        ],
      },
    ],
    architecture: [
      {
        heading: "The token decision, honestly",
        lede: "Every option trades revocation speed against validation cost. Pick deliberately.",
        diagram: {
          kind: "compare",
          caption: "There is no option that is both instantly revocable and free to validate.",
          options: [
            {
              title: "Stateful sessions",
              sub: "opaque id, looked up per request",
              good: [
                "Instant revocation — delete the row",
                "Full visibility of active sessions",
                "The token itself carries no information to leak",
              ],
              bad: ["A lookup on every request", "The session store becomes a critical dependency"],
              verdict:
                "Perfectly viable — 5 GB of sessions and a Redis lookup is not the burden folklore suggests.",
            },
            {
              title: "Stateless JWT",
              sub: "signed claims, validated locally",
              good: [
                "No lookup — services verify a signature",
                "Works across services without a shared session store",
              ],
              bad: [
                "Cannot be revoked before expiry — this is the whole problem",
                "Claims go stale: a demoted user keeps their old role until expiry",
                "Tempting to put too much in, and anyone can read it",
              ],
              verdict: "Only with a short TTL, and only if the revocation window is acceptable.",
            },
            {
              title: "Hybrid",
              sub: "short access token + stateful refresh",
              tone: "ok",
              good: [
                "Cheap validation on the hot path",
                "Revocation bounded by the access token TTL, and immediate at refresh",
                "Refresh rotation detects stolen tokens",
              ],
              bad: ["Two credentials to manage", "Revocation is fast, not instant"],
              verdict:
                "The right default. State the window — fifteen minutes — as a deliberate choice.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "The thing to say out loud",
          text: '"A JWT cannot be revoked — that is not an implementation gap, it is what stateless means. So I use a fifteen-minute access token for cheap validation and a stateful refresh token as the checkpoint where revocation is enforced. The consequence is that a compromised session survives up to fifteen minutes, and if the product needs faster than that for privileged actions, those specific endpoints check state directly."',
        },
      },
      {
        heading: "The login and refresh flow",
        lede: "Refresh rotation is where stolen-token detection comes from.",
        diagram: {
          kind: "sequence",
          caption: "Rotation on every refresh makes reuse of an old token a detectable event.",
          actors: [
            { id: "c", label: "Client" },
            { id: "a", label: "Auth service" },
            { id: "s", label: "Session store" },
            { id: "api", label: "Resource service" },
          ],
          messages: [
            { from: "c", to: "a", label: "1. login (email, password)", kind: "call" },
            {
              from: "a",
              to: "a",
              label: "2. argon2 verify (~100 ms, deliberately slow)",
              kind: "self",
            },
            { from: "a", to: "s", label: "3. create session, store refresh hash", kind: "call" },
            {
              from: "a",
              to: "c",
              label: "4. access (15 min) + refresh (30 d, httpOnly)",
              kind: "return",
              tone: "ok",
            },
            { from: "c", to: "api", label: "5. request with access token", kind: "call" },
            {
              from: "api",
              to: "api",
              label: "6. verify signature with cached JWKS — no network",
              kind: "self",
              tone: "accent",
            },
            { from: "c", to: "a", label: "7. …15 min later: refresh", kind: "call" },
            {
              from: "a",
              to: "s",
              label: "8. validate, ROTATE, invalidate the old one",
              kind: "call",
              tone: "warn",
            },
            {
              from: "a",
              to: "c",
              label: "9. new access + new refresh",
              kind: "return",
              tone: "ok",
            },
          ],
        },
        bullets: [
          "Rotating the refresh token on every use turns theft into a detectable event: if an old refresh token is presented again, either the attacker or the legitimate user is replaying it, and the correct response is to revoke the entire session family.",
          "Store only a hash of the refresh token. A leaked session table should not hand out working credentials.",
          "Services validate signatures against cached public keys, so the common path involves no call to the auth service at all — which is the actual benefit of the token approach.",
          "Password verification is intentionally expensive. Argon2id or bcrypt tuned to around a hundred milliseconds makes offline cracking of a leaked table costly, and the low login rate means the system can afford it.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Revocation, precisely",
        body: [
          '"Log out everywhere" sounds like a feature and is really the hardest property in the design. Several mechanisms exist and they differ in how quickly they act and what they cost on the hot path.',
        ],
        table: {
          caption: "Pick based on how fast revocation must be and what it costs per request.",
          headers: ["Mechanism", "Speed", "Per-request cost", "Notes"],
          rows: [
            [
              "Short TTL only",
              "Up to the TTL",
              "None",
              "Simplest; the window is the security property",
            ],
            [
              "Deny-list of token ids",
              "Immediate",
              "A cache lookup",
              "List stays small — entries expire with the token",
            ],
            [
              "Per-user not-before timestamp",
              "Immediate",
              "A cached lookup per user",
              "One entry revokes all of a user's tokens",
            ],
            [
              "Stateful session lookup",
              "Immediate",
              "A store lookup",
              "Strongest and simplest to reason about",
            ],
            [
              "Rotate the signing key",
              "Immediate, global",
              "None",
              "Blunt: logs out everybody at once",
            ],
          ],
        },
        bullets: [
          "A per-user not-before timestamp is the best value: one small entry invalidates every token issued before it, the data is tiny and cacheable, and it handles password change, forced logout and account disable with the same mechanism.",
          "Deny-lists stay bounded because entries can be dropped once the token would have expired anyway — a revocation list only needs to cover the TTL window.",
          "Privileged operations should check state directly regardless of the token strategy. Changing a password, transferring money or altering permissions can afford one lookup.",
          "A password change must revoke sessions. Users reasonably believe that changing their password locks out an attacker, and a design where it does not is a security bug even if it is technically consistent.",
        ],
        callout: {
          kind: "warn",
          title: "Do not put secrets or authorisation state in the token",
          text: "A JWT is signed, not encrypted — anyone holding it can read every claim. Beyond the confidentiality issue, embedding roles and permissions means they are frozen at issue time, so a user demoted or removed from a group keeps their old access until the token expires. Keep tokens to identity and a short expiry, and resolve authorisation at request time where it can be current.",
        },
      },
      {
        heading: "Where the token lives",
        body: [
          "Storage is where most real-world authentication vulnerabilities come from, and the right answer differs between a browser and a native app.",
        ],
        table: {
          caption: "Browser storage options, and what each exposes you to.",
          headers: ["Location", "XSS", "CSRF", "Verdict"],
          rows: [
            [
              "localStorage",
              "Fully exposed — any script reads it",
              "Not applicable",
              "Common and wrong",
            ],
            [
              "httpOnly cookie",
              "Not readable by script",
              "Vulnerable without protection",
              "Right, with SameSite and CSRF tokens",
            ],
            [
              "In-memory only",
              "Lost on reload",
              "Not applicable",
              "Good for access tokens with a cookie refresh",
            ],
            ["Native secure storage", "N/A", "N/A", "The right answer on mobile"],
          ],
        },
        bullets: [
          "Keep the refresh token in an httpOnly, Secure, SameSite cookie and the access token in memory. Script-injected code then cannot exfiltrate the long-lived credential.",
          "Cookies reintroduce cross-site request forgery, so SameSite plus an explicit anti-forgery token is required — swapping one vulnerability class for another unaddressed one is not an improvement.",
          "On mobile, use the platform keychain or keystore, which is genuinely protected by the OS rather than by convention.",
          "Bind tokens to a device or client where the risk justifies it, so a stolen token is unusable elsewhere. It is not free, but it turns theft into a much smaller problem.",
        ],
      },
      {
        heading: "Federation and the enterprise path",
        body: [
          "Social sign-in and enterprise SSO both delegate authentication elsewhere, and the internal design should converge them into one session model as early as possible.",
        ],
        bullets: [
          "Use OpenID Connect with authorisation code plus PKCE for third-party sign-in. The implicit flow is deprecated for good reason — it exposes tokens in redirect URLs.",
          "Always validate the state parameter and the token's issuer, audience and expiry. Accepting a provider's token without checking its audience is a well-known path to account takeover.",
          "Account linking needs a deliberate policy. Matching purely on email address means a provider that does not verify emails can be used to take over an existing account.",
          "Enterprise customers expect just-in-time provisioning, group-to-role mapping and — importantly — deprovisioning, where an employee removed in the identity provider loses access promptly. That is another revocation requirement, arriving from a different direction.",
        ],
      },
      {
        heading: "Attacks the design must anticipate",
        body: [
          "An authentication system is attacked continuously, and several defences are architectural rather than operational.",
        ],
        bullets: [
          "Credential stuffing is the dominant threat: attackers replay passwords leaked elsewhere. Rate limit per account and per address, require a second factor for unusual sign-ins, and check credentials against known-breached password lists.",
          "Never reveal whether an email exists. Identical responses and timing for unknown users and wrong passwords, or the login form becomes an account enumeration oracle.",
          "Password reset is the weakest link in most systems: single-use, short-lived, hashed tokens, invalidated on use, and the reset must revoke existing sessions.",
          "Log authentication events as a first-class signal. New device, new country, repeated failures — these drive both user-visible alerts and automated defences, and they are what makes an intrusion visible after the fact.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Hybrid short access token plus stateful refresh",
        pickWhen: "Default — cheap validation with bounded revocation",
        cost: "Revocation lags by up to the access token TTL",
      },
      {
        choice: "Fully stateful sessions",
        pickWhen: "Instant revocation is a hard requirement",
        cost: "A store lookup on every request and a critical dependency",
      },
      {
        choice: "Per-user not-before timestamp",
        pickWhen: "Immediate revocation without full session lookups",
        cost: "A cached lookup per request and a small store to maintain",
      },
      {
        choice: "httpOnly cookie for refresh",
        pickWhen: "Browser clients",
        cost: "Requires CSRF protection and careful cross-origin handling",
      },
      {
        choice: "Refresh token rotation",
        pickWhen: "Always",
        cost: "Race conditions on concurrent refreshes need handling",
      },
      {
        choice: "Expensive password hashing",
        pickWhen: "Always",
        cost: "Real CPU at login peaks — budget for it",
      },
    ],
    wrapUp: [
      "The central trade is revocation speed against validation cost, and a stateless token cannot be revoked — that is what stateless means, not a gap to be patched.",
      "The default is hybrid: a short-lived access token validated by signature with no network call, and a stateful refresh token as the checkpoint where revocation actually bites. State the window explicitly.",
      "Rotate refresh tokens on every use, so replay of an old one is a detectable signal that the session family should be killed.",
      "Keep authorisation out of the token. Signed is not encrypted, and embedded roles go stale exactly when it matters — resolve permissions at request time.",
      "Storage is where real breaches come from: httpOnly cookie for the refresh token, access token in memory, platform keystore on mobile, and CSRF protection because cookies bring it back.",
      "Password hashing is deliberately slow, login responses must not reveal whether an account exists, and reset flows need the same rigour as login since they are a parallel path to the same access.",
    ],
    followUps: [
      {
        q: "How do you revoke a JWT?",
        a: "You cannot, and that is the honest answer — a stateless token is valid until it expires because validation is a signature check with no lookup. Anything that provides revocation reintroduces state in some form. The practical options are to keep the token short-lived so the window is bounded, to keep a deny-list of revoked token identifiers that services consult, or to keep a per-user not-before timestamp so one small entry invalidates everything issued before it. I favour the last for its economy: it handles forced logout, password change and account disable with a single cacheable value. Whichever is chosen, the design should name the resulting exposure window explicitly, because that window is a security property the product is choosing rather than an accident.",
      },
      {
        q: "Where should the browser store the token?",
        a: "Not in localStorage, which is the common choice and the wrong one, because any injected script can read it and exfiltrate a long-lived credential. The refresh token belongs in an httpOnly, Secure, SameSite cookie so script cannot touch it, and the access token can live in memory where it dies on reload and is never persisted. That combination means a cross-site scripting bug can act within the current page but cannot steal a durable credential. The catch worth stating is that cookies bring cross-site request forgery back into scope, so SameSite plus an anti-forgery token is part of the answer rather than an optional extra — swapping one vulnerability for another unmitigated one is not progress. On mobile the equivalent is the platform keychain.",
      },
      {
        q: "Why rotate refresh tokens?",
        a: "Because rotation converts token theft from an invisible compromise into a detectable event. If each refresh invalidates the old token and issues a new one, then a stolen token can only be used until the legitimate client refreshes — and when the loser of that race presents the now-invalid old token, the system knows something is wrong. The correct response is to revoke the entire session family rather than just rejecting that request, since you cannot tell which party is the attacker. Without rotation, a stolen refresh token grants access for its full lifetime, potentially months, with no signal at all. The complication to handle is a legitimate client making two concurrent refreshes, which needs a short grace period or single-flight so normal behaviour is not mistaken for theft.",
      },
      {
        q: "Should roles and permissions go in the token?",
        a: "No, for two reasons. The first is confidentiality: a JWT is signed rather than encrypted, so anyone holding it can read every claim, and a permission set is more information than you want to publish. The second and more important reason is staleness — claims are frozen at issue time, so a user who is demoted, removed from a group or has an entitlement revoked keeps their old access until the token expires, which is precisely the situation where you least want a delay. Keeping the token to identity and a short expiry, and resolving authorisation at request time against current state, costs a cheap cached lookup and means permission changes take effect immediately. The exception is coarse, slowly-changing information such as a tenant identifier.",
      },
      {
        q: "Someone's password is leaked and they change it. What should happen to their existing sessions?",
        a: "All of them should be revoked, and it is worth saying why that is not automatic. Users universally believe that changing a password locks out whoever had the old one, so a system where existing sessions continue is a security bug even if it is technically consistent with how tokens work. Concretely, changing the password updates the user's not-before timestamp, which invalidates every access token issued earlier, and deletes the session rows so refresh attempts fail. The practical wrinkle is the access token window: with a fifteen-minute TTL an attacker could retain access for that long unless the not-before check is consulted on the request path, which is exactly the case for having it. I would also notify the user on every device and surface a list of sessions that were terminated.",
      },
    ],
    related: [
      "/hld/api-gateway",
      "/examples/distributed-lock",
      "/hld/rate-limiting",
      "/lld/singleton-di",
      "/hld/caching",
    ],
    furtherReading: [
      {
        label: "OWASP — authentication cheat sheet",
        href: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
