import type { Concept } from "@/data/types";

export const hldMicroservicesData: Concept[] = [
  {
    slug: "saga-pattern",
    title: "The Saga Pattern: Transactions Across Services",
    subtitle:
      "Replacing one ACID transaction with a sequence of local transactions and compensations.",
    level: "advanced",
    minutes: 18,
    tags: ["microservices", "saga", "distributed transactions", "compensation", "workflow"],
    summary:
      "Once orders, inventory and payments live in different services, a single ACID transaction across them is gone. A saga replaces it with a sequence of local transactions, each triggering the next, plus a compensating action that undoes each completed step if a later one fails. The result is eventual consistency with explicit, business-meaningful rollback — not the illusion of atomicity.",
    keyPoints: [
      "A saga is a sequence of local transactions, and every step that can be undone has a compensation.",
      "Compensation is a semantic undo — a refund, a stock release — not a database rollback.",
      "Orchestrated sagas centralise the flow; choreographed sagas react to each other's events.",
      "Every step and every compensation must be idempotent, because messages are retried and duplicated.",
      "Put the hardest-to-undo step last.",
    ],
    prerequisites: ["/hld/database-per-service", "/hld/service-communication"],
    sections: [
      {
        heading: "Why not two-phase commit?",
        diagram: {
          kind: "compare",
          caption: "Atomicity across services is available — at a price most systems will not pay.",
          options: [
            {
              title: "Two-phase commit",
              sub: "A coordinator locks every participant, then commits all",
              good: ["True atomicity", "Familiar transactional semantics"],
              bad: [
                "Locks held across services while waiting for the slowest",
                "A coordinator failure can leave participants blocked",
                "Unsupported by most message brokers and many NoSQL stores",
                "Overall availability is the product of every participant's",
              ],
              verdict: "Rarely viable between independently owned services.",
              tone: "warn",
            },
            {
              title: "Saga",
              sub: "Local transactions plus compensations",
              good: [
                "Each service commits locally and stays available",
                "Works with any store and any broker",
                "Failures handled in business terms",
              ],
              bad: [
                "Eventual consistency between steps",
                "Compensations must be designed per step",
                "No isolation: other requests can see intermediate states",
              ],
              verdict: "The standard approach.",
              tone: "ok",
            },
          ],
        },
      },
      {
        heading: "An order saga, step by step",
        table: {
          caption:
            "The pivot is the step after which the saga must complete rather than roll back.",
          headers: ["Step", "Service", "Local transaction", "Compensation"],
          rows: [
            ["1", "Orders", "Create order in PENDING state", "Mark order REJECTED"],
            ["2", "Inventory", "Reserve the items", "Release the reservation"],
            [
              "3",
              "Payments",
              "Charge the card (pivot)",
              "Refund — only if a later step truly cannot complete",
            ],
            ["4", "Orders", "Mark order CONFIRMED", "— (retried until it succeeds)"],
            ["5", "Shipping", "Schedule the shipment", "— (retried until it succeeds)"],
          ],
        },
        body: [
          "Steps before the pivot are compensatable: if anything fails, undo them in reverse order. The pivot is the point of no return. Steps after it are retriable: they are designed so that retrying eventually succeeds, because there is no clean way back.",
        ],
      },
      {
        heading: "Happy path and failure, orchestrated",
        diagram: {
          kind: "sequence",
          caption: "The card is declined, so the orchestrator compensates what already happened.",
          actors: [
            { id: "orch", label: "Order saga", sub: "orchestrator" },
            { id: "inv", label: "Inventory" },
            { id: "pay", label: "Payments" },
            { id: "ord", label: "Orders" },
          ],
          messages: [
            { from: "orch", to: "inv", label: "ReserveStock(ord_8812)", kind: "async" },
            { from: "inv", to: "orch", label: "StockReserved", kind: "async", tone: "ok" },
            { from: "orch", to: "pay", label: "ChargePayment(₹5,000)", kind: "async" },
            {
              from: "pay",
              to: "orch",
              label: "PaymentDeclined: insufficient funds",
              kind: "async",
              tone: "bad",
            },
            {
              from: "orch",
              to: "inv",
              label: "ReleaseStock(ord_8812)",
              kind: "async",
              tone: "warn",
              note: "compensate completed steps in reverse order",
            },
            { from: "orch", to: "ord", label: "RejectOrder(reason)", kind: "async", tone: "warn" },
            { from: "ord", to: "orch", label: "OrderRejected", kind: "async" },
          ],
        },
      },
      {
        heading: "The orchestrator as a state machine",
        code: {
          title: "A pure transition function, persisted with its outgoing commands",
          lang: "python",
          source: `from enum import Enum

class State(str, Enum):
    STARTED = "started"
    RESERVED = "reserved"
    CHARGED = "charged"
    CONFIRMED = "confirmed"
    COMPENSATING = "compensating"
    REJECTED = "rejected"

def advance(saga: "OrderSaga", event: dict) -> list[dict]:
    """Given the saga's state and an incoming event, return the commands to send next.
    The updated saga row and these commands are saved in ONE local transaction (outbox)."""
    match (saga.state, event["type"]):
        case (State.STARTED, "StockReserved"):
            saga.state = State.RESERVED
            return [{"type": "ChargePayment", "order_id": saga.order_id, "amount_paise": saga.total_paise}]
        case (State.STARTED, "StockUnavailable"):
            saga.state = State.REJECTED
            return [{"type": "RejectOrder", "order_id": saga.order_id, "reason": "out_of_stock"}]
        case (State.RESERVED, "PaymentCharged"):
            saga.state = State.CHARGED
            return [{"type": "ConfirmOrder", "order_id": saga.order_id}]
        case (State.RESERVED, "PaymentDeclined"):
            saga.state = State.COMPENSATING
            return [
                {"type": "ReleaseStock", "order_id": saga.order_id},
                {"type": "RejectOrder", "order_id": saga.order_id, "reason": event["reason"]},
            ]
        case (State.CHARGED, "OrderConfirmed"):
            saga.state = State.CONFIRMED
            return [{"type": "ScheduleShipment", "order_id": saga.order_id}]
        case _:
            return []    # a duplicate or out-of-order event: ignoring it is safe`,
        },
        bullets: [
          "Keeping transitions pure makes the saga trivially testable: feed events, assert on the state and the commands.",
          "Each step needs a timeout. If Payments never replies, the saga must decide — retry, query the payment status, or compensate — instead of waiting forever.",
          "Workflow engines such as Temporal, AWS Step Functions or Camunda provide durable state, timers and retries for exactly this, and are worth using once you have more than a handful of sagas.",
        ],
        links: [{ label: "Site: transactional outbox", href: "/hld/transactional-outbox" }],
      },
      {
        heading: "Designing compensations",
        bullets: [
          "Compensations are business actions, not rollbacks. An email cannot be unsent; its compensation is a correction email.",
          "Some actions cannot be compensated at all — a shipped parcel, an irreversible external transfer. Order steps so those happen after the pivot, when completion is already guaranteed.",
          "A compensation must eventually succeed, so it is retried with backoff and alerts after repeated failure. A failed refund is an incident, not a log line.",
          "Record why a saga compensated. Support will be asked 'why was my order cancelled?' and needs an answer.",
        ],
        callout: {
          kind: "warn",
          text: "Because sagas lack isolation, other requests can observe intermediate states — stock that is reserved but not yet paid for, an order that is charged but not yet confirmed. Design those states to be visible and meaningful rather than pretending they do not exist.",
        },
      },
      {
        heading: "Isolation anomalies and countermeasures",
        table: {
          headers: ["Countermeasure", "How it works", "Example"],
          rows: [
            [
              "Semantic lock",
              "A status flag marks a record as in-flight",
              "Order PENDING cannot be edited or cancelled by another saga",
            ],
            [
              "Commutative updates",
              "Design operations whose order does not matter",
              "Debit and credit that can apply in any order",
            ],
            [
              "Pessimistic ordering",
              "Reorder steps to reduce the risk of a dirty read",
              "Reserve stock before announcing availability",
            ],
            [
              "Reread value",
              "Check the record is unchanged before overwriting",
              "Compare a version number when confirming",
            ],
            [
              "Version file",
              "Record operations so they can be applied in the right order",
              "Handle a cancel that arrives before the create",
            ],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you roll back a saga?",
            a: "By running compensating transactions for the steps that already completed, in reverse order — release the stock reservation, then reject the order. They are business operations rather than database rollbacks, and they are idempotent, so the orchestrator can safely retry them.",
          },
          {
            q: "What happens if a compensation fails?",
            a: "It is retried with backoff until it succeeds, because leaving a saga half-compensated means inconsistent business state. Compensations are designed to be retriable and idempotent. After repeated failures the saga moves to a stuck state that alerts a human, with enough context recorded to finish it manually.",
          },
          {
            q: "Saga or two-phase commit?",
            a: "A saga, for anything spanning independently owned services. Two-phase commit holds locks across services and blocks when the coordinator or a participant fails, which couples their availability, and most brokers and NoSQL stores do not support it. Sagas accept eventual consistency and explicit compensation in exchange for services that stay available and independent.",
          },
        ],
      },
    ],
    related: [
      "/hld/transactional-outbox",
      "/hld/service-communication",
      "/hld/idempotency",
      "/examples/payment",
    ],
    furtherReading: [
      {
        label: "microservices.io — Saga",
        href: "https://microservices.io/patterns/data/saga.html",
      },
      {
        label: "Sagas (Garcia-Molina and Salem, 1987)",
        href: "https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf",
      },
    ],
  },

  {
    slug: "transactional-outbox",
    title: "Transactional Outbox and Change Data Capture",
    subtitle:
      "Updating a database and publishing an event without losing either — the dual-write problem solved.",
    level: "advanced",
    minutes: 16,
    tags: ["microservices", "outbox", "cdc", "events", "idempotency"],
    summary:
      "A service that writes to its database and then publishes to a message broker can crash between the two, leaving an order saved with no event, or an event describing an order that never committed. The transactional outbox writes the event into an outbox table in the same local transaction as the state change, and a relay publishes it afterwards. Consumers then receive every event at least once and must deduplicate.",
    keyPoints: [
      "Writing to a database and a broker separately — a dual write — will eventually lose or invent events.",
      "Outbox: insert the event row in the same transaction as the state change.",
      "A relay publishes outbox rows to the broker, by polling or through change data capture.",
      "Delivery is at least once, so consumers must be idempotent.",
    ],
    prerequisites: ["/hld/message-queues", "/hld/database-per-service"],
    sections: [
      {
        heading: "The dual-write problem",
        diagram: [
          {
            kind: "sequence",
            caption: "Failure 1: committed, then crashed — the event is lost.",
            actors: [
              { id: "svc", label: "Orders service" },
              { id: "db", label: "Database" },
              { id: "mq", label: "Broker" },
            ],
            messages: [
              { from: "svc", to: "db", label: "INSERT order; COMMIT", kind: "call" },
              { from: "db", to: "svc", label: "committed", kind: "return", tone: "ok" },
              { from: "svc", to: "svc", label: "process crashes", kind: "self", tone: "bad" },
              {
                from: "svc",
                to: "mq",
                label: "OrderPlaced never sent",
                kind: "async",
                tone: "bad",
                note: "payment and email never happen",
              },
            ],
          },
          {
            kind: "sequence",
            caption: "Failure 2: published, then the transaction failed — a phantom event.",
            actors: [
              { id: "svc", label: "Orders service" },
              { id: "mq", label: "Broker" },
              { id: "db", label: "Database" },
            ],
            messages: [
              { from: "svc", to: "mq", label: "publish OrderPlaced", kind: "async" },
              { from: "svc", to: "db", label: "INSERT order; COMMIT", kind: "call" },
              {
                from: "db",
                to: "svc",
                label: "constraint violation — rolled back",
                kind: "return",
                tone: "bad",
                note: "consumers act on an order that does not exist",
              },
            ],
          },
        ],
        callout: {
          kind: "insight",
          text: "There is no ordering of two separate writes that is safe, and wrapping both in try/except does not help — the crash can happen between any two instructions. The fix is to make it one write.",
        },
      },
      {
        heading: "The outbox",
        diagram: {
          kind: "flow",
          caption: "One local transaction, then asynchronous publication.",
          rows: [
            [
              {
                id: "tx",
                label: "Local transaction",
                sub: "UPDATE orders + INSERT outbox",
                tone: "accent",
              },
              { id: "relay", label: "Relay", sub: "polling or CDC" },
              { id: "broker", label: "Broker", sub: "topic per event type" },
              { id: "cons", label: "Consumers", sub: "deduplicate by event id", tone: "ok" },
            ],
          ],
        },
        code: [
          {
            title: "The outbox table",
            lang: "sql",
            source: `CREATE TABLE outbox (
    id            uuid PRIMARY KEY,
    aggregate_id  text        NOT NULL,          -- e.g. the order id: becomes the partition key
    event_type    text        NOT NULL,
    payload       jsonb       NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    published_at  timestamptz                    -- NULL until the relay has published it
);

CREATE INDEX outbox_unpublished ON outbox (created_at) WHERE published_at IS NULL;`,
          },
          {
            title: "State change and event, committed together",
            lang: "python",
            source: `import json, uuid

def place_order(conn, order: "Order") -> None:
    with conn.transaction():                          # ONE local transaction
        conn.execute(
            "INSERT INTO orders (id, customer_id, total_paise, status) VALUES (%s, %s, %s, 'placed')",
            (order.id, order.customer_id, order.total_paise),
        )
        conn.execute(
            "INSERT INTO outbox (id, aggregate_id, event_type, payload) VALUES (%s, %s, %s, %s)",
            (uuid.uuid4(), order.id, "OrderPlaced", json.dumps({
                "order_id": order.id,
                "customer_id": order.customer_id,
                "total_paise": order.total_paise,
            })),
        )
    # Both rows commit or neither does. There is no broker call in this function.`,
          },
        ],
      },
      {
        heading: "Publishing: polling relay or change data capture",
        diagram: {
          kind: "compare",
          caption: "Two ways to move outbox rows to the broker.",
          options: [
            {
              title: "Polling relay",
              sub: "Query unpublished rows every few hundred milliseconds",
              good: ["Simple, no extra infrastructure", "Easy to reason about and test"],
              bad: ["Adds query load to the database", "Latency is at least the polling interval"],
              verdict: "Moderate volume, or a first implementation.",
              tone: "ok",
            },
            {
              title: "Change data capture",
              sub: "Read the database's write-ahead log (for example Debezium)",
              good: ["Low latency with no polling queries", "Scales to high event volume"],
              bad: ["Another system to run and monitor", "Tied to database log configuration"],
              verdict: "High volume, or an existing CDC platform.",
            },
          ],
        },
        code: {
          title: "A polling relay that is safe to run on several instances",
          lang: "python",
          source: `def relay_once(conn, producer, batch: int = 100) -> int:
    with conn.transaction():
        rows = conn.execute(
            """
            SELECT id, aggregate_id, event_type, payload
            FROM outbox
            WHERE published_at IS NULL
            ORDER BY created_at
            LIMIT %s
            FOR UPDATE SKIP LOCKED          -- parallel relays never grab the same rows
            """,
            (batch,),
        ).fetchall()

        for row in rows:
            producer.send(
                topic=row.event_type,
                key=row.aggregate_id,          # same key = same partition = ordered per order
                value=row.payload,
                headers={"event_id": str(row.id)},
            )
        producer.flush()                       # the broker has acknowledged every message

        conn.execute("UPDATE outbox SET published_at = now() WHERE id = ANY(%s)", ([r.id for r in rows],))
    return len(rows)
    # A crash after flush but before COMMIT republishes the batch: at-least-once, by design.`,
        },
        links: [
          {
            label: "Debezium — outbox event router",
            href: "https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html",
          },
        ],
      },
      {
        heading: "Consumers: idempotent by design",
        code: {
          title: "Record the event id in the same transaction as the side effect",
          lang: "python",
          source: `def handle(conn, message) -> None:
    event_id = message.headers["event_id"]
    with conn.transaction():
        inserted = conn.execute(
            "INSERT INTO processed_events (event_id) VALUES (%s) ON CONFLICT DO NOTHING",
            (event_id,),
        ).rowcount
        if inserted == 0:
            return                       # a duplicate delivery: already handled, do nothing
        apply_side_effect(conn, message.value)
    message.ack()                        # acknowledge only after the transaction committed`,
        },
        bullets: [
          "Because the dedupe insert and the side effect commit together, a crash can never record an event as processed without its effect, or apply the effect twice.",
          "Where the side effect is external — calling a payment provider — pass the event id as the provider's idempotency key instead.",
        ],
        links: [{ label: "Site: idempotency", href: "/hld/idempotency" }],
      },
      {
        heading: "Ordering, cleanup and monitoring",
        bullets: [
          "Use the aggregate id as the partition key so all events for one order stay in order. Across different orders, ordering is neither needed nor guaranteed.",
          "Delete or archive published rows on a schedule. An outbox that grows forever eventually slows the very inserts it protects.",
          "Alert on the age of the oldest unpublished row. A stuck relay is otherwise silent until downstream teams notice missing data.",
          "Version event payloads from the start; consumers you do not know about will depend on them.",
        ],
        followUps: [
          {
            q: "Why not publish to the broker inside the database transaction?",
            a: "Because they are two different systems with no shared transaction. A publish inside the transaction cannot be rolled back if the commit then fails, and a publish after it can be lost if the process dies. Distributed transactions across a database and a broker are either unsupported or too costly, so the outbox turns the problem into a single local write.",
          },
          {
            q: "Is the outbox exactly-once?",
            a: "No — it gives at-least-once publication. A relay can crash after the broker acknowledges a message but before marking the row published, and it will send the message again. Effectively-once processing comes from pairing it with idempotent consumers that deduplicate by event id.",
          },
          {
            q: "Polling or change data capture?",
            a: "Polling first for most services: it is simple, uses tools the team already knows, and FOR UPDATE SKIP LOCKED makes it safe to scale out. I would switch to CDC when event volume or polling load becomes significant, or when the organisation already runs a CDC platform.",
          },
        ],
      },
    ],
    related: [
      "/hld/saga-pattern",
      "/hld/message-queues",
      "/hld/idempotency",
      "/hld/database-per-service",
    ],
    furtherReading: [
      {
        label: "microservices.io — transactional outbox",
        href: "https://microservices.io/patterns/data/transactional-outbox.html",
      },
      {
        label: "microservices.io — polling publisher",
        href: "https://microservices.io/patterns/data/polling-publisher.html",
      },
    ],
  },

  {
    slug: "cqrs-event-sourcing",
    title: "CQRS and Event Sourcing",
    subtitle:
      "Separate models for reads and writes, and storing what happened instead of only the current state.",
    level: "advanced",
    minutes: 18,
    tags: ["microservices", "cqrs", "event sourcing", "projections", "read models"],
    summary:
      "CQRS splits a system's write model — commands that enforce business rules — from its read models, which are queries shaped for each screen, so each side can be optimised on its own. Event sourcing goes further: the source of truth becomes an append-only log of events, and current state is derived by replaying them. Both are powerful in the right domains and a heavy tax everywhere else.",
    keyPoints: [
      "CQRS: commands go to a write model; queries read from purpose-built read models.",
      "Read models are projections updated from events, so they are eventually consistent.",
      "Event sourcing stores every change as an immutable event; state is a fold over the history.",
      "You can use CQRS without event sourcing — and usually should start there.",
      "Event schemas live forever. Plan how they will evolve before the first event is written.",
    ],
    prerequisites: ["/hld/database-per-service", "/hld/transactional-outbox"],
    sections: [
      {
        heading: "CQRS in one picture",
        diagram: {
          kind: "system",
          caption: "The write side protects invariants; read sides serve screens.",
          columns: [
            {
              title: "Commands",
              nodes: [
                { id: "client1", label: "Client", sub: "PlaceOrder, CancelOrder" },
                { id: "cmdapi", label: "Command API" },
              ],
            },
            {
              title: "Write side",
              nodes: [
                {
                  id: "model",
                  label: "Write model",
                  sub: "validates business rules",
                  tone: "accent",
                },
                { id: "store", label: "Write store", sub: "normalised, transactional" },
              ],
            },
            {
              title: "Propagation",
              nodes: [
                { id: "events", label: "Events", sub: "via outbox or event store" },
                { id: "proj", label: "Projectors", sub: "idempotent handlers" },
              ],
            },
            {
              title: "Read side",
              nodes: [
                { id: "list", label: "Order list table", sub: "denormalised" },
                { id: "search", label: "Search index" },
                { id: "dash", label: "Dashboard cache" },
                { id: "qapi", label: "Query API", tone: "ok" },
              ],
            },
          ],
        },
      },
      {
        heading: "When CQRS helps",
        table: {
          headers: ["Signal", "Example"],
          rows: [
            [
              "Reads vastly outnumber writes and need different shapes",
              "A product page read a million times, updated a few times a day",
            ],
            [
              "Several very different read patterns over the same data",
              "Full-text search, a per-customer order list and an analytics dashboard",
            ],
            [
              "Complex invariants on the write side",
              "A trading or booking system where every command enforces rules",
            ],
            [
              "Read and write load must scale independently",
              "Read replicas and caches without touching the transactional store",
            ],
          ],
        },
        callout: {
          kind: "note",
          text: "The lightweight version is common and cheap: keep your normal transactional tables, and maintain a few denormalised read tables or a search index updated from events. That is CQRS without event sourcing, and it solves most read-scaling problems.",
        },
      },
      {
        heading: "Event sourcing",
        code: {
          title: "An account whose balance is derived from its history",
          lang: "python",
          source: `from dataclasses import dataclass

@dataclass(frozen=True)
class Event:
    stream_id: str
    version: int
    type: str
    data: dict

def apply(balance: int, event: Event) -> int:
    match event.type:
        case "AccountOpened":
            return 0
        case "MoneyDeposited":
            return balance + event.data["amount_paise"]
        case "MoneyWithdrawn":
            return balance - event.data["amount_paise"]
        case _:
            return balance          # unknown event types are ignored, which keeps old code working

def current_balance(events: list[Event]) -> int:
    balance = 0
    for event in events:            # state is a left fold over the history
        balance = apply(balance, event)
    return balance

def withdraw(store, account_id: str, amount_paise: int) -> None:
    events = store.load(account_id)
    if current_balance(events) < amount_paise:
        raise InsufficientFunds(account_id)            # the invariant is checked on the write side
    store.append(
        account_id,
        Event(account_id, len(events) + 1, "MoneyWithdrawn", {"amount_paise": amount_paise}),
        expected_version=len(events),                  # optimistic concurrency: fails if another write won
    )`,
        },
        bullets: [
          "The expected version check is what stops two concurrent withdrawals both passing the balance check and overdrawing the account.",
          "The full history is the audit log, for free — which is why ledgers, trading and compliance-heavy domains adopt it.",
          "Temporal questions become easy: 'what was this account's balance on 31 March?' is a replay up to that date.",
        ],
        links: [{ label: "Site: digital wallet design", href: "/examples/digital-wallet" }],
      },
      {
        heading: "Projections and snapshots",
        bullets: [
          "Read models are projections: handlers that consume events and update query-optimised tables. Because the log is the source of truth, any projection can be deleted and rebuilt by replaying it.",
          "Adding a new read model later is a replay, not a data migration — one of event sourcing's genuine superpowers.",
          "Streams with thousands of events load slowly. Store a snapshot of the state every N events and replay only the events after it.",
          "Projections must be idempotent and tolerate duplicates, because a rebuild or a redelivery will process events again.",
        ],
      },
      {
        heading: "Costs and pitfalls",
        table: {
          headers: ["Pitfall", "Why it hurts", "Mitigation"],
          rows: [
            [
              "Event schema evolution",
              "Old events can never be rewritten",
              "Versioned event types and upcasters that convert old events on read",
            ],
            [
              "Right to be forgotten",
              "An immutable log cannot simply delete a person",
              "Crypto-shredding: encrypt personal data with a per-user key, then delete the key",
            ],
            [
              "Eventual consistency in the UI",
              "A user saves and the list does not show the change yet",
              "Return the new state from the command, or wait for the projection version",
            ],
            [
              "Querying current state",
              "There is no table to query without projections",
              "Build projections for every read pattern you need",
            ],
            [
              "Team learning curve",
              "A very different model from CRUD",
              "Use it only in the bounded contexts that need it",
            ],
          ],
        },
      },
      {
        heading: "Should you use it?",
        diagram: {
          kind: "compare",
          caption: "Match the tool to the domain, per bounded context.",
          options: [
            {
              title: "CRUD with read models (CQRS-lite)",
              good: [
                "Familiar tables and tooling",
                "Solves read scaling and different read shapes",
                "Easy to adopt incrementally",
              ],
              bad: ["No built-in history of how state changed"],
              verdict: "Most services.",
              tone: "ok",
            },
            {
              title: "Full event sourcing",
              good: [
                "Complete audit trail",
                "Replayable history and new projections",
                "Temporal queries",
              ],
              bad: [
                "Schema evolution and erasure complexity",
                "Steeper learning curve",
                "More infrastructure",
              ],
              verdict: "Ledgers, trading, compliance-heavy domains.",
              tone: "accent",
            },
          ],
        },
        followUps: [
          {
            q: "What is the difference between CQRS and event sourcing?",
            a: "CQRS separates the model used for writes from the models used for reads. Event sourcing changes how the write side stores data: as an append-only sequence of events instead of the current state. They pair naturally, because events feed the read models, but either can be used alone — and CQRS alone is far more common.",
          },
          {
            q: "How do you handle a user's right to be forgotten in an event store?",
            a: "Keep personal data out of events where possible, referring to it by id. Where it must be in events, encrypt it with a key specific to that person and store the keys separately. Deleting the key — crypto-shredding — makes that data unreadable in every event and backup, while the rest of the history stays intact.",
          },
          {
            q: "How do you give users read-your-writes consistency?",
            a: "Either return the resulting state directly from the command so the interface can show it immediately, or return the version of the write and have the query side wait until the projection has processed at least that version. For a single user's own data, reading from the write side for a short window after a change is another pragmatic option.",
          },
        ],
      },
    ],
    related: [
      "/hld/database-per-service",
      "/hld/transactional-outbox",
      "/examples/digital-wallet",
      "/examples/stock-exchange",
    ],
    furtherReading: [
      { label: "Martin Fowler — CQRS", href: "https://martinfowler.com/bliki/CQRS.html" },
      {
        label: "Martin Fowler — Event Sourcing",
        href: "https://martinfowler.com/eaaDev/EventSourcing.html",
      },
    ],
  },

  {
    slug: "api-contracts-versioning",
    title: "API Contracts, Versioning and Contract Testing",
    subtitle: "Changing a service without breaking the services that depend on it.",
    level: "intermediate",
    minutes: 15,
    tags: ["microservices", "api versioning", "contract testing", "schema evolution"],
    summary:
      "Independent deployment only works if a service can change without breaking its consumers. That takes explicit contracts — OpenAPI, Protobuf, event schemas — rules for backward-compatible evolution, a versioning strategy for the rare breaking change, and consumer-driven contract tests that catch breakage in CI rather than in production.",
    keyPoints: [
      "Additive changes are safe; removing, renaming or retyping a field breaks consumers.",
      "Be a tolerant reader: ignore unknown fields and never depend on field order.",
      "Version only for breaking changes, run old and new side by side, and retire the old one using real usage data.",
      "Consumer-driven contract tests verify a provider against what its consumers actually use.",
      "Event schemas need the same discipline, enforced by a schema registry.",
    ],
    prerequisites: ["/hld/rest-vs-graphql", "/hld/service-communication"],
    sections: [
      {
        heading: "Safe and breaking changes",
        table: {
          headers: ["Change", "Safe for existing consumers?", "Why"],
          rows: [
            [
              "Add an optional response field",
              "Yes",
              "Tolerant readers ignore fields they do not know",
            ],
            ["Add an optional request field with a default", "Yes", "Old clients simply omit it"],
            ["Add a new endpoint or event type", "Yes", "Nobody depends on it yet"],
            [
              "Remove or rename a field",
              "No",
              "Consumers reading it break or silently get nothing",
            ],
            [
              "Change a field's type or units",
              "No",
              "Rupees to paise is a breaking change even with the same name",
            ],
            [
              "Make an optional request field required",
              "No",
              "Existing requests start failing validation",
            ],
            ["Add a new enum value", "Risky", "Consumers with exhaustive switches may crash on it"],
          ],
        },
        callout: {
          kind: "warn",
          text: "Changing meaning without changing shape is the most dangerous break of all: amount switching from rupees to paise passes every schema check and corrupts every downstream calculation.",
        },
      },
      {
        heading: "Expand and contract",
        lede: "How to rename a field without a breaking release.",
        steps: [
          {
            title: "Expand",
            text: "Add amount_paise alongside the old amount, and populate both.",
          },
          {
            title: "Migrate consumers",
            text: "Each consumer switches to amount_paise at its own pace.",
          },
          {
            title: "Measure",
            text: "Confirm from contract tests and request logs that nobody still reads amount.",
            detail:
              "Tag requests with a client id so you can see exactly which consumers still use the old field, rather than guessing.",
          },
          {
            title: "Contract",
            text: "Remove the old field in a later release, once usage is zero.",
          },
        ],
      },
      {
        heading: "Versioning strategies",
        table: {
          headers: ["Strategy", "Example", "Trade-off"],
          rows: [
            ["URL path", "/v1/orders → /v2/orders", "Explicit and cache-friendly; clutters routes"],
            [
              "Header or media type",
              "Accept: application/vnd.shop.v2+json",
              "Clean URLs; harder to test by hand",
            ],
            ["Protobuf package", "package orders.v2;", "Old and new services can coexist cleanly"],
            [
              "Event type version",
              "OrderPlaced.v2 on a new topic or with a version field",
              "Consumers opt in when ready",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "Most well-run APIs have very few major versions because they evolve additively. A new version is a new product to maintain — plan to run both, and to retire the old one on a published timeline.",
        },
      },
      {
        heading: "Consumer-driven contract testing",
        diagram: {
          kind: "flow",
          caption: "Breakage is caught in the provider's CI, before deployment.",
          rows: [
            [
              { id: "ctest", label: "Consumer tests", sub: "record expectations" },
              { id: "contract", label: "Contract", sub: "published to a broker", tone: "accent" },
              { id: "verify", label: "Provider CI", sub: "replays every contract" },
              {
                id: "gate",
                label: "Deploy gate",
                sub: "compatible with production consumers?",
                tone: "ok",
              },
            ],
          ],
        },
        code: {
          title: "A contract lists only what the consumer actually uses",
          lang: "json",
          source: `{
  "consumer": "checkout-web",
  "provider": "pricing-service",
  "interactions": [
    {
      "description": "the price of an existing product",
      "request": { "method": "GET", "path": "/v1/prices/sku_123" },
      "response": {
        "status": 200,
        "body": { "sku": "sku_123", "amount_paise": 499900, "currency": "INR" }
      }
    }
  ]
}`,
        },
        bullets: [
          "Because contracts list only the fields consumers rely on, the provider remains free to change everything else — and knows precisely what it must not break.",
          "Contract tests replace most slow, flaky cross-service end-to-end suites while catching the failures those suites were meant to catch.",
          "Tools such as Pact implement this workflow, including a check that a provider version is compatible with the consumer versions currently in production.",
        ],
        links: [{ label: "Pact documentation", href: "https://docs.pact.io/" }],
      },
      {
        heading: "Evolving event schemas",
        code: {
          title: "Protobuf rules that keep old consumers working",
          lang: "protobuf",
          source: `syntax = "proto3";
package orders.v1;

message OrderPlaced {
  string order_id = 1;
  string customer_id = 2;
  int64 total_paise = 3;
  reserved 4;              // was 'coupon': the field NUMBER must never be reused
  reserved "coupon";
  string currency = 5;     // added later; older consumers simply ignore it
}`,
        },
        bullets: [
          "A schema registry rejects incompatible schemas at publish time. Backward compatibility lets new consumers read old events; forward compatibility lets old consumers read new ones; full compatibility guarantees both.",
          "In Protobuf, field numbers are the contract — names can change, numbers cannot be reused. In Avro, new fields need defaults.",
        ],
      },
      {
        heading: "Deprecation and interview follow-ups",
        bullets: [
          "Announce deprecation in documentation and in responses, using the Deprecation and Sunset HTTP headers so clients can detect it programmatically.",
          "Measure usage per consumer before removing anything. 'Nobody uses v1' should be a query result, not an assumption.",
        ],
        followUps: [
          {
            q: "How do you rename a field in an API that other teams use?",
            a: "Expand and contract. Add the new field alongside the old one and populate both, let consumers migrate, confirm from contract tests and per-client usage metrics that nothing reads the old field, then remove it. No release in that sequence breaks anyone.",
          },
          {
            q: "Contract tests or end-to-end tests?",
            a: "Contract tests for the integration surface between services: they are fast, run in each team's own pipeline, and pinpoint exactly which expectation broke. I keep a small number of end-to-end tests for the most critical user journeys, because they catch environment and wiring problems contract tests cannot — but they are too slow and flaky to be the main safety net.",
          },
          {
            q: "How do you evolve event schemas safely?",
            a: "Register every schema and enforce a compatibility mode in the registry, so an incompatible schema cannot be published. Make changes additive with defaults, never reuse Protobuf field numbers, and when a genuinely breaking change is needed, publish a new versioned event type and run both until consumers have moved.",
          },
        ],
      },
    ],
    related: [
      "/hld/rest-vs-graphql",
      "/hld/api-gateway",
      "/hld/deployment-strategies",
      "/hld/service-communication",
    ],
    furtherReading: [
      { label: "Pact documentation", href: "https://docs.pact.io/" },
      {
        label: "Martin Fowler — TolerantReader",
        href: "https://martinfowler.com/bliki/TolerantReader.html",
      },
    ],
  },
];
