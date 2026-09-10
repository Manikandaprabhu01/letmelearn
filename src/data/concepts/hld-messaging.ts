import type { Concept } from "@/data/types";

export const hldMessaging: Concept[] = [
  {
    slug: "message-queues",
    title: "Message Queues & Streams",
    subtitle: "Decouple producers from consumers, absorb bursts, and survive a consumer being down.",
    level: "intermediate",
    minutes: 17,
    tags: ["async", "messaging", "architecture"],
    summary:
      "A queue turns a synchronous call into a durable handoff. The producer's request finishes in milliseconds, the work happens later, and a slow or dead consumer becomes a growing backlog rather than a failed user request. What you buy with that is a long list of new questions: ordering, duplicates, retries, poison messages, and a backlog that can grow faster than you can drain it.",
    keyPoints: [
      "Use a queue when the work can be done later, must survive a crash, or would otherwise couple two services' availability.",
      "At-least-once delivery is the practical default, so every consumer must be idempotent.",
      "Ordering is only ever guaranteed within a partition or a single queue — never globally.",
      "A dead-letter queue is mandatory; without it a poison message blocks the pipeline forever.",
      "Log-based brokers (Kafka) retain and replay; queue brokers (SQS, RabbitMQ) delete on ack. Pick by whether you need history.",
    ],
    sections: [
      {
        heading: "What a queue is actually for",
        table: {
          headers: ["Reason", "Concretely", "Example"],
          rows: [
            ["Latency", "Return to the user before the slow work is done", "Sign-up returns; the welcome email is queued"],
            ["Burst absorption", "Accept at peak rate, process at sustainable rate", "Black Friday orders; workers drain steadily"],
            ["Decoupling availability", "Producer succeeds even if the consumer is down", "Analytics pipeline restart does not fail checkout"],
            ["Fan-out", "One event, many independent consumers", "Order placed → email, invoice, search index, fraud"],
            ["Retry with backoff", "Transient failures handled outside the request", "Payment provider blip retried for an hour"],
            ["Work distribution", "Many workers pull from one backlog", "Video transcoding across a worker fleet"],
            ["Ordering", "Serialise operations on one key", "All events for one account processed in order"],
          ],
        },
        callout: {
          kind: "warn",
          text: "A queue is not free. You gain a component to operate, eventual consistency for anything downstream of it, and the need for idempotency everywhere. If the work is fast, must be confirmed to the user, and the dependency is reliable, a direct call is simpler and better.",
        },
      },
      {
        heading: "Queue versus log",
        diagram: {
          kind: "compare",
          caption: "The distinction that decides which technology you name.",
          options: [
            {
              title: "Queue broker",
              sub: "SQS, RabbitMQ, Azure Service Bus",
              good: [
                "Message deleted after ack — storage stays small",
                "Competing consumers scale trivially: add workers",
                "Per-message retry, delay and DLQ are built in",
                "Visibility timeout handles a crashed worker automatically",
              ],
              bad: [
                "No replay — once acked, it is gone",
                "Ordering is per-queue at best (FIFO queues throttle throughput)",
                "Adding a new consumer type means a new queue and a fan-out",
              ],
              verdict: "Task and job processing: emails, thumbnails, webhooks.",
            },
            {
              title: "Log broker",
              sub: "Kafka, Kinesis, Pulsar, Redpanda",
              tone: "ok",
              good: [
                "Retention independent of consumption — replay from any offset",
                "Multiple independent consumer groups on the same topic",
                "Ordered within a partition; enormous throughput",
                "Enables event sourcing, CDC and stream processing",
              ],
              bad: [
                "Parallelism is capped by partition count",
                "Consumer group rebalances pause processing",
                "Per-message retry is awkward — a slow message blocks its partition",
                "More operational weight",
              ],
              verdict: "Event streams, analytics, CDC, anything replayed or fanned out.",
            },
          ],
        },
        bullets: [
          "The tell for a log: 'we need to add a new consumer later and have it read history', or 'we need to reprocess after a bug'. Only retention gives you that.",
          "The tell for a queue: 'each message is a task, done once, and per-message retry matters'.",
          "Kafka's parallelism ceiling is its partition count — 12 partitions means at most 12 consumers in a group doing useful work. Choose partition count with growth in mind; increasing it later changes key-to-partition mapping.",
        ],
      },
      {
        heading: "Delivery semantics, honestly",
        table: {
          headers: ["Semantics", "How", "Reality"],
          rows: [
            [
              "At most once",
              "Ack before processing",
              "Fast, and you lose messages when a worker dies mid-task. Acceptable only for metrics-like data.",
            ],
            [
              "At least once",
              "Ack after processing",
              "The default everywhere. Duplicates happen — a worker can finish and die before acking.",
            ],
            [
              "Exactly once",
              "Transactional broker + idempotent consumer, or dedupe by key",
              "Achievable end-to-end only when the consumer's side effect is transactional or idempotent. Broker-level 'exactly once' does not cover your database write or an outbound email.",
            ],
          ],
        },
        code: {
          title: "The consumer pattern that makes at-least-once safe",
          lang: "ts",
          source: `async function handle(msg: Message) {
  const key = msg.idempotencyKey ?? msg.id;

  // The dedupe record and the side effect must commit together, or
  // a crash between them reintroduces the duplicate you just prevented.
  await db.transaction(async (tx) => {
    const inserted = await tx\`
      INSERT INTO processed_messages (key, at)
      VALUES (\${key}, now())
      ON CONFLICT (key) DO NOTHING
      RETURNING key\`;

    if (inserted.length === 0) return;          // already handled: ack and move on

    await applyEffect(tx, msg);                  // the actual work, same transaction
  });

  await broker.ack(msg);
}

// If the side effect is NOT in a database — sending an email, calling a
// third party — pass an idempotency key to that system and let it dedupe.
// If it can do neither, accept that duplicates are possible and design the
// user-visible behaviour around it.`,
        },
        callout: {
          kind: "interview",
          text: "'Exactly once delivery does not exist; exactly once processing does, if the consumer is idempotent' is the sentence to have ready. It is the difference between reciting a feature list and understanding the guarantee.",
        },
      },
      {
        heading: "Ordering, and what it costs",
        body: [
          "Global ordering across a distributed queue would mean a single serialisation point, which is exactly what you gave up by distributing. What you get instead is ordering within a partition, and the design work is choosing a partition key such that anything that must be ordered shares one.",
        ],
        diagram: {
          kind: "flow",
          caption: "Partition by the entity whose events must stay ordered.",
          rows: [
            [
              { id: "p", label: "producer", sub: "key = account_id", tone: "accent" },
              { id: "h", label: "hash(key) % partitions" },
            ],
            [
              { id: "p0", label: "partition 0", sub: "acct 7, 19 — ordered", tone: "ok" },
              { id: "p1", label: "partition 1", sub: "acct 3, 22 — ordered", tone: "ok" },
              { id: "p2", label: "partition 2", sub: "acct 11 — ordered", tone: "ok" },
            ],
            [
              { id: "c0", label: "consumer A", sub: "owns p0" },
              { id: "c1", label: "consumer B", sub: "owns p1, p2" },
            ],
          ],
        },
        bullets: [
          "One consumer per partition within a group. That is what makes per-partition ordering meaningful, and it is also the parallelism cap.",
          "A hot key — one enormous account — fills one partition and cannot be spread without losing its ordering. Decide which matters more, per key.",
          "Retrying a failed message while continuing with later ones breaks ordering. If ordering is required, a failure must block the partition, which is why an ordered pipeline needs very fast poison-message detection.",
          "If you only need ordering between causally related events, a sequence number in the payload lets consumers detect and reorder, without constraining partitioning.",
        ],
      },
      {
        heading: "Failure handling: retries, DLQs and backlogs",
        steps: [
          {
            title: "Retry transient failures with backoff and jitter",
            text: "Exponential backoff — 1s, 2s, 4s, 8s — with randomised jitter so a downstream outage does not produce synchronised retry waves. Cap the attempts.",
            detail: "Distinguish transient (timeout, 503, connection reset) from permanent (validation error, 404). Never retry the latter.",
          },
          {
            title: "Dead-letter after N attempts",
            text: "A message that cannot be processed goes to a dead-letter queue with its error and attempt history. Without a DLQ, a poison message is retried forever and can block everything behind it.",
            detail: "Alert on DLQ depth > 0. A DLQ nobody looks at is a silent data-loss channel.",
          },
          {
            title: "Make the backlog visible",
            text: "Alert on queue depth and, more usefully, on consumer lag in time: 'we are 40 minutes behind' is actionable in a way that '2.3 million messages' is not.",
            detail: "Track oldest-message age. That is the number that maps to user impact.",
          },
          {
            title: "Have a drain plan",
            text: "When you are hours behind, decide in advance: scale consumers, shed low-priority messages, or process newest-first and backfill the rest. Discovering this during an incident is expensive.",
          },
          {
            title: "Protect the producer",
            text: "If the broker is down, does the producer fail, buffer, or drop? For critical writes, the transactional outbox pattern makes the message durable in the same transaction as the state change.",
          },
        ],
        code: {
          title: "Transactional outbox: no lost events when the process dies after commit",
          lang: "sql",
          source: `-- One local transaction, so the event exists exactly when the state change does.
BEGIN;
  INSERT INTO orders (id, customer_id, total) VALUES ($1, $2, $3);
  INSERT INTO outbox (id, topic, payload, created_at)
    VALUES (gen_random_uuid(), 'orders.placed', $4, now());
COMMIT;

-- A relay process publishes and marks sent. It may publish twice
-- (crash after publish, before update) — which is why consumers dedupe.
SELECT * FROM outbox WHERE sent_at IS NULL ORDER BY created_at LIMIT 100
  FOR UPDATE SKIP LOCKED;`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Kafka or SQS for this?",
            a: "SQS if each message is a task done once and I want per-message retry, delays and a DLQ without operating anything. Kafka if I need retention and replay, several independent consumer groups on the same stream, or ordering per key at high throughput. The question I ask is whether anyone will ever need to reprocess history — if yes, that alone points to a log.",
          },
          {
            q: "How do you guarantee a message is processed exactly once?",
            a: "I do not guarantee delivery exactly once — I make processing idempotent. The consumer records the message key and performs its side effect in the same transaction, so a redelivery is a no-op. Where the side effect is external, like a payment or an email, I pass an idempotency key to that system. Broker-level exactly-once only covers the broker's own boundary, not my database or a third party.",
          },
          {
            q: "Your consumer is 6 hours behind. What do you do?",
            a: "First find out why: is it a slow downstream dependency, a partition skew, or genuinely too little consumer capacity? Scaling consumers only helps up to the partition count, so if that is the cap I need more partitions or a different key. Then decide with the product owner whether to shed or reorder — for something like notifications, processing newest-first and dropping stale messages is often better than delivering six-hour-old alerts.",
          },
          {
            q: "When would you not use a queue?",
            a: "When the user needs the result now and the operation is fast — adding a queue there just adds a hop and eventual consistency for no benefit. Also when the work is trivially retryable at the call site and the dependency is reliable. I would rather have a clear synchronous call with a timeout than an asynchronous pipeline whose failure modes nobody on the team understands.",
          },
        ],
      },
    ],
    related: ["/hld/pub-sub", "/hld/idempotency", "/examples/distributed-mq", "/lld/command"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "pub-sub",
    title: "Publish / Subscribe",
    subtitle: "One event, many independent consumers, and none of them known to the publisher.",
    level: "intermediate",
    minutes: 13,
    tags: ["async", "messaging", "events"],
    summary:
      "Pub/sub is the observer pattern with a network in the middle. A publisher emits to a topic without knowing who listens; subscribers register interest and receive copies. It is how you add the fifth thing that must happen when an order is placed without touching the order service — and how you end up with a system nobody can trace.",
    keyPoints: [
      "Point-to-point queue: one message, one consumer. Pub/sub: one message, every subscriber gets a copy.",
      "Consumer groups combine both: fan-out across groups, competing consumers within a group.",
      "Publish facts (OrderPlaced), not commands (SendEmail) — the publisher must not know who reacts.",
      "Event schemas are a public contract; version them additively.",
      "The cost is traceability: no single place shows what happens when an event fires.",
    ],
    prerequisites: ["/hld/message-queues"],
    sections: [
      {
        heading: "The two delivery shapes",
        diagram: {
          kind: "system",
          caption: "Consumer groups give fan-out between groups and load balancing within one.",
          columns: [
            {
              title: "Publisher",
              nodes: [{ id: "o", label: "Order service", sub: "publishes OrderPlaced", tone: "accent" }],
            },
            {
              title: "Topic",
              nodes: [
                { id: "t", label: "orders.placed", sub: "12 partitions, 7-day retention", tone: "accent" },
              ],
            },
            {
              title: "Consumer groups",
              nodes: [
                { id: "g1", label: "group: email", sub: "3 workers share the partitions" },
                { id: "g2", label: "group: analytics", sub: "own offsets, own pace" },
                { id: "g3", label: "group: search-index", sub: "can replay from offset 0" },
                { id: "g4", label: "group: fraud", sub: "added later, no publisher change", tone: "ok" },
              ],
            },
          ],
        },
        table: {
          headers: ["", "Queue (point-to-point)", "Pub/sub (topic)"],
          rows: [
            ["Who receives a message", "Exactly one consumer", "Every subscriber gets a copy"],
            ["Adding a consumer", "Splits the existing work", "Adds a new independent stream"],
            ["Typical payload", "A task to perform", "A fact that occurred"],
            ["Coupling", "Producer knows work must be done", "Publisher knows nothing about subscribers"],
            ["Failure isolation", "Message retried by whoever took it", "Each subscriber retries independently"],
          ],
        },
      },
      {
        heading: "Events, not commands",
        body: [
          "The discipline that makes pub/sub work is naming: publish what happened, in the past tense, with the data a reasonable consumer needs. The moment a topic is called 'send-welcome-email', the publisher has taken on knowledge of a subscriber, and you have built an RPC with extra latency.",
        ],
        code: {
          title: "Event design that survives contact with new consumers",
          lang: "json",
          source: `{
  "eventId": "evt_01J8XK...",        // unique — consumers dedupe on this
  "type": "orders.placed",
  "version": 2,                       // schema version, additive changes only
  "occurredAt": "2026-09-10T09:31:02.114Z",
  "traceId": "4bf92f3577b34da6",      // correlation across services
  "producer": "order-service@3.4.1",
  "data": {
    "orderId": "ord_9f3",
    "customerId": "cus_1",
    "totalCents": 7098,
    "currency": "USD",
    "lineCount": 2
  }
}

// Deliberately NOT included: the customer's email address.
// Consumers that need it look it up — otherwise every event carries every
// field any consumer might ever want, and the schema becomes untouchable.`,
        },
        bullets: [
          "Include enough to act on, not everything. A fat event is a distributed join frozen at publish time, and it goes stale.",
          "Include an event id and a trace id. Without the first, consumers cannot dedupe; without the second, debugging a fan-out is guesswork.",
          "Version additively: add optional fields, never remove or repurpose one. A breaking change means a new topic or a new version field, plus a migration window where both are published.",
          "Publish after the state change is durable, not before. The outbox pattern is what makes that atomic.",
        ],
        callout: {
          kind: "warn",
          text: "The 'event-carried state transfer' pattern — putting the full entity in the event so consumers never call back — reduces coupling on the read path and increases it on the schema. It is a real trade-off, not a best practice; pick per topic and say why.",
        },
      },
      {
        heading: "The costs nobody mentions in the first design review",
        bullets: [
          "Traceability: with six subscribers, no single file describes what happens when an order is placed. Distributed tracing and an event catalogue are not optional at that point.",
          "Ordering across topics is undefined. If OrderPlaced and PaymentCaptured are separate topics, a consumer may see the payment first — design for it or keep them in one partitioned topic.",
          "Fan-out amplification: one event, six subscribers, each writing to a database, is six times the write load. Broadcast is cheap; the reactions are not.",
          "Schema drift: a producer adds a field and a strict consumer rejects it. Use a schema registry with compatibility checks, or be permissive on read.",
          "Cascading retries: six subscribers all retrying a failing downstream turns one outage into six times the load on it.",
          "Testing gets harder: an integration test now spans a broker. Contract tests per event, plus a local broker, are the usual compromise.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Independent failure and retry per subscriber — the property that makes it worth the cost.",
          actors: [
            { id: "p", label: "Publisher" },
            { id: "t", label: "Topic" },
            { id: "a", label: "Email consumer" },
            { id: "b", label: "Search consumer", sub: "downstream is down" },
          ],
          messages: [
            { from: "p", to: "t", label: "publish OrderPlaced", kind: "call" },
            { from: "t", to: "a", label: "deliver", kind: "async" },
            { from: "t", to: "b", label: "deliver", kind: "async" },
            { from: "a", to: "t", label: "commit offset", kind: "return", tone: "ok" },
            { from: "b", to: "b", label: "index fails → retry with backoff", kind: "self", tone: "warn", note: "email is unaffected; offsets are per group" },
            { from: "b", to: "t", label: "commit offset after success (or send to DLQ)", kind: "return" },
          ],
        },
      },
      {
        heading: "Choosing a technology",
        table: {
          headers: ["System", "Model", "Delivery", "Fits"],
          rows: [
            ["Kafka / Redpanda", "Partitioned log, consumer groups", "At least once, ordered per partition", "High-volume event streams, replay, CDC"],
            ["Redis Pub/Sub", "Fire and forget, no persistence", "At most once", "Live fan-out where loss is fine: presence, cache invalidation"],
            ["Redis Streams", "Log with consumer groups", "At least once", "Lightweight streaming without running Kafka"],
            ["SNS + SQS", "Topic fanning into queues", "At least once", "AWS-native fan-out with per-consumer DLQs"],
            ["Google Pub/Sub", "Managed topics and subscriptions", "At least once (exactly-once option)", "GCP-native, low operational burden"],
            ["NATS / JetStream", "Lightweight messaging", "Configurable", "Low latency, edge and IoT"],
            ["RabbitMQ (fanout exchange)", "Exchange to queues", "At least once", "Existing AMQP estate; rich routing rules"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Redis Pub/Sub is fire-and-forget: a subscriber that is disconnected when the message is published simply never sees it. That is fine for cache invalidation and disastrous for order events — and it is one of the most common misuses in production systems.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Pub/sub or a direct call?",
            a: "Direct call when the caller needs the result to complete its own work, or when there is exactly one consumer and there always will be. Pub/sub when several independent things must react, when I want them to fail and retry independently, and when the publisher genuinely should not know about them. The test I apply is: if I add a seventh reaction next quarter, do I have to modify and redeploy the publisher?",
          },
          {
            q: "How do you handle a subscriber that keeps failing?",
            a: "Retry with backoff, then dead-letter with the error and the payload, and alert on DLQ depth. Because offsets are per consumer group, that failure is contained — other subscribers are unaffected. What I watch for is a subscriber retrying hard against a failing downstream, which turns their outage into an overload, so I would put a circuit breaker in front and stop consuming while it is open.",
          },
          {
            q: "How do you evolve an event schema?",
            a: "Additively, with a version field and a schema registry enforcing compatibility. New optional fields are safe; removing or repurposing a field is not, because I do not know who is reading it. For a genuine breaking change I publish both versions for a migration window, move consumers over, then retire the old topic — which is the same discipline as versioning a public API.",
          },
          {
            q: "Two events for the same order arrive out of order. How do you handle it?",
            a: "Prevent it where I can by partitioning on order id so all of that order's events share a partition and stay ordered. Where events span topics I cannot prevent it, so consumers carry a version or sequence number per entity and either buffer briefly or discard events older than what they have applied. Making handlers commutative and idempotent where possible is the more robust answer than trying to enforce global order.",
          },
        ],
      },
    ],
    related: ["/hld/message-queues", "/lld/observer", "/hld/idempotency", "/hld/websockets"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "websockets",
    title: "Real-Time Delivery: WebSockets, SSE and Polling",
    subtitle: "Getting a server-initiated update to a client, and holding a million connections.",
    level: "intermediate",
    minutes: 15,
    tags: ["networking", "real-time", "scalability"],
    summary:
      "HTTP is client-initiated, so pushing an update requires one of four workarounds: poll repeatedly, hold a request open, stream over one response, or open a bidirectional socket. Choosing between them is easy; the hard part is that a persistent connection makes your servers stateful, which changes routing, deploys and scaling.",
    keyPoints: [
      "Polling is fine below a few seconds of tolerance and costs nothing architecturally.",
      "SSE gives server→client streaming over plain HTTP with automatic reconnect — underused.",
      "WebSockets are for genuine bidirectional, low-latency traffic; everything else is a downgrade in complexity.",
      "Persistent connections make servers stateful: you need a registry of who is connected where, and a bus to reach them.",
      "Connection count, not request rate, becomes the scaling limit — memory per connection and file descriptors.",
    ],
    sections: [
      {
        heading: "The four options",
        table: {
          headers: ["Technique", "Direction", "Latency", "Cost", "Fits"],
          rows: [
            [
              "Short polling",
              "Client pulls",
              "Half the interval on average",
              "Wasted requests when nothing changed",
              "Tolerance of seconds; simplest possible thing",
            ],
            [
              "Long polling",
              "Client pulls, server holds",
              "Near-instant",
              "One held connection per client anyway",
              "Legacy compatibility; works through anything",
            ],
            [
              "Server-sent events",
              "Server → client only",
              "Near-instant",
              "One connection; plain HTTP, auto-reconnect built in",
              "Feeds, notifications, progress, live dashboards",
            ],
            [
              "WebSocket",
              "Bidirectional",
              "Lowest",
              "Stateful servers; own protocol above the socket",
              "Chat, collaboration, games, trading",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "SSE is the answer more often than people reach for it: if updates only flow server→client, it gives you streaming over ordinary HTTP with reconnection and event ids for free, and no protocol of your own to design. Reach for WebSockets when the client genuinely needs to push too.",
        },
      },
      {
        heading: "Polling is not automatically wrong",
        math: [
          {
            label: "Polling cost",
            expr: "100,000 clients ÷ 5 s interval",
            result: "20,000 rps",
            note: "Cheap requests, but a real load — and mostly '304 Not Modified'.",
          },
          {
            label: "Same clients on WebSockets",
            expr: "100,000 concurrent connections × ~10 KB state",
            result: "≈ 1 GB + fd limits",
            note: "Roughly 10-50k connections per node, so ~4-10 nodes just for connections.",
          },
          {
            label: "When polling wins",
            expr: "update frequency ≪ poll frequency, or tolerance > 5 s",
            result: "keep it simple",
            note: "A dashboard refreshed every 30 s does not need a socket.",
          },
        ],
        bullets: [
          "Conditional polling with ETag or If-Modified-Since makes the no-change case cheap — a 304 with no body.",
          "Jitter the interval, or every client that loaded at the same time polls in the same second forever.",
          "Adaptive polling — back off when nothing has changed, speed up after activity — captures most of the benefit of push with none of the statefulness.",
        ],
      },
      {
        heading: "The real problem: your servers are now stateful",
        body: [
          "A WebSocket pins a client to one server for the life of the connection. To deliver a message to user 42, some component must know which server holds user 42's connection — and that mapping changes constantly as clients connect, disconnect and reconnect.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Message from one user to another connected to a different gateway.",
          actors: [
            { id: "a", label: "User A", sub: "→ gateway 1" },
            { id: "g1", label: "Gateway 1" },
            { id: "reg", label: "Presence registry", sub: "Redis: user → gateway" },
            { id: "bus", label: "Message bus", sub: "topic per gateway" },
            { id: "g2", label: "Gateway 2" },
          ],
          messages: [
            { from: "a", to: "g1", label: "send({to: B, text})", kind: "call" },
            { from: "g1", to: "g1", label: "persist message", kind: "self", note: "durable before delivery — the socket is not a database" },
            { from: "g1", to: "reg", label: "where is B?", kind: "call" },
            { from: "reg", to: "g1", label: "gateway-2", kind: "return" },
            { from: "g1", to: "bus", label: "publish to gateway-2 channel", kind: "async" },
            { from: "bus", to: "g2", label: "deliver", kind: "async" },
            { from: "g2", to: "g2", label: "push over B's socket", kind: "self", tone: "ok", note: "if B is offline: push notification + fetch on next open" },
          ],
        },
        bullets: [
          "Presence registry: a short-TTL key per connected user, refreshed by heartbeat, so a crashed gateway's entries expire rather than pointing at nothing.",
          "Never treat the socket as delivery confirmation. Persist first, then push, and let the client acknowledge — otherwise a message vanishes when a connection drops mid-send.",
          "Deploys disconnect everyone. Stagger restarts, and make the client reconnect with backoff and jitter or your fleet gets a synchronised reconnect storm.",
          "Reconnect must be resumable: the client sends the last event id it saw, and the server replays what it missed. Without this, every network blip loses messages.",
          "Load balancers need long idle timeouts and sticky routing for the connection's lifetime; many defaults kill idle connections at 60 seconds, which is why heartbeats exist.",
        ],
      },
      {
        heading: "Scaling connections",
        steps: [
          {
            title: "Size per connection",
            text: "Budget memory per connection — socket buffers plus your per-user state. A few kilobytes each means 100k connections is a few hundred megabytes plus buffers, and the practical ceiling is usually 10k-100k per node.",
            detail: "Raise file descriptor limits and tune TCP buffers; the defaults are for a different workload.",
          },
          {
            title: "Separate the gateway from the logic",
            text: "A thin connection-holding tier that does nothing but manage sockets, and stateless services behind it. Now business logic deploys without dropping connections, and you scale the two independently.",
          },
          {
            title: "Heartbeat, both ways",
            text: "Ping/pong every 20-30 seconds detects dead connections that TCP has not noticed and keeps intermediaries from closing an idle socket. Track missed pongs and close deliberately.",
          },
          {
            title: "Fan-out strategy",
            text: "For broadcast to a room, decide whether the gateway subscribes per room or filters locally. Per-room subscriptions scale better for many small rooms; local filtering is simpler for a few large ones.",
          },
          {
            title: "Backpressure",
            text: "A slow client whose socket buffer fills must not consume unbounded server memory. Drop, coalesce, or disconnect — and make that policy explicit rather than discovering it as an OOM.",
          },
        ],
        code: {
          title: "Resumable reconnect — the detail that makes real-time reliable",
          lang: "ts",
          source: `// Server: every pushed event carries a monotonic id per stream.
socket.send(JSON.stringify({ id: 10482, type: "message", data }));

// Client: remember the last id, and send it when reconnecting.
let lastEventId = 0;
function connect() {
  const ws = new WebSocket(\`\${url}?since=\${lastEventId}\`);
  ws.onmessage = (e) => { const m = JSON.parse(e.data); lastEventId = m.id; apply(m); };
  ws.onclose = () => setTimeout(connect, backoffWithJitter(attempt++));
}

// Server on connect: replay everything after "since" from durable storage,
// then switch to live push. Without the replay, every blip loses messages —
// and users experience that as "the app is unreliable", not "the network is".

// SSE gives you this for free: the browser sends Last-Event-ID automatically.`,
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "WebSockets or SSE for this feature?",
            a: "If updates only flow from server to client — notifications, a live feed, job progress — SSE, because it is plain HTTP, works through proxies, and gives automatic reconnect with Last-Event-ID. WebSockets when the client also sends frequently and latency matters, like chat or collaborative editing. I would not choose WebSockets just because they sound more capable; the statefulness is a real ongoing cost.",
          },
          {
            q: "How do you deliver a message to a specific user across a fleet?",
            a: "A presence registry maps user to the gateway holding their connection, with a short TTL refreshed by heartbeat so crashed gateways expire. The sender persists the message, looks up the gateway, and publishes to that gateway's channel on a bus. If the user is offline, the message stays durable and is delivered on their next connect, plus a push notification. The socket is a delivery channel, never the storage.",
          },
          {
            q: "What happens on deploy?",
            a: "Every connection drops, so this is a design consideration rather than an afterthought. I would keep the socket tier thin so it deploys rarely, restart nodes in a staggered rollout, and have clients reconnect with exponential backoff and jitter — otherwise 100,000 clients reconnect in the same second and the new instances fall over. Resumable reconnect means users see a brief pause rather than lost messages.",
          },
          {
            q: "A million concurrent connections — what breaks first?",
            a: "Memory per connection and file descriptors on the gateway nodes, which sets the number of nodes. After that, the fan-out path: a broadcast to a large room multiplies one event into a million sends, so the bus and the per-gateway subscription model matter more than the socket handling. And presence lookups become a very hot key space, so I would shard the registry by user id.",
          },
        ],
      },
    ],
    related: ["/hld/pub-sub", "/examples/chat", "/hld/load-balancing", "/examples/nearby-friends"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "rest-vs-graphql",
    title: "REST, GraphQL and gRPC",
    subtitle: "Three API styles, three different problems they were built to solve.",
    level: "intermediate",
    minutes: 14,
    tags: ["api-design", "protocols", "trade-offs"],
    summary:
      "REST is resources over HTTP and gets you caching, tooling and universal support. GraphQL lets the client specify exactly what it needs, which fixes over-fetching for diverse clients and costs you HTTP caching and predictable server cost. gRPC is fast, typed and binary, which makes it excellent between services and awkward from a browser.",
    keyPoints: [
      "REST's biggest advantage is HTTP caching — CDNs, browsers and proxies all understand it for free.",
      "GraphQL's biggest advantage is one round trip for exactly the data a screen needs.",
      "GraphQL's biggest cost is that query complexity is client-controlled — you must bound it.",
      "gRPC wins on internal service-to-service: binary, typed contracts, streaming, code generation.",
      "These coexist: gRPC internally, REST or GraphQL at the edge, is a very common shape.",
    ],
    sections: [
      {
        heading: "Side by side",
        diagram: {
          kind: "compare",
          caption: "Pick by client diversity and by where the API lives.",
          options: [
            {
              title: "REST",
              sub: "resources + HTTP verbs",
              good: [
                "HTTP caching works everywhere — CDN, browser, proxy",
                "Universally understood; every tool speaks it",
                "Simple to debug with curl and browser devtools",
                "Status codes and idempotency semantics are well-defined",
              ],
              bad: [
                "Over- and under-fetching for rich clients",
                "N+1 round trips for nested data",
                "Versioning tends to sprawl (/v1, /v2)",
              ],
              verdict: "Public APIs, cacheable reads, anything with unknown consumers.",
            },
            {
              title: "GraphQL",
              sub: "one endpoint, client-specified query",
              good: [
                "Exactly the fields the screen needs, in one round trip",
                "Strong schema and introspection; excellent client tooling",
                "Additive evolution with deprecation instead of versioning",
              ],
              bad: [
                "HTTP caching is largely lost (POST to one endpoint)",
                "Client controls server cost — needs depth and complexity limits",
                "N+1 on the server unless you use dataloaders",
                "Harder to reason about performance and to rate limit fairly",
              ],
              verdict: "Many diverse clients, deeply nested data, fast-moving front ends.",
            },
            {
              title: "gRPC",
              sub: "protobuf over HTTP/2",
              good: [
                "Binary and compact; noticeably lower latency and CPU",
                "Generated, typed clients in every language",
                "Bidirectional streaming as a first-class feature",
                "Schema is enforced, not documented",
              ],
              bad: [
                "Not natively usable from a browser (needs grpc-web + a proxy)",
                "Harder to inspect: not human-readable on the wire",
                "L4 load balancing skews badly with long-lived HTTP/2 connections",
              ],
              verdict: "Service-to-service inside your own network.",
            },
          ],
        },
      },
      {
        heading: "The over-fetching problem GraphQL was built for",
        code: [
          {
            title: "REST — three round trips for one screen",
            lang: "http",
            source: `GET /users/42                 # 40 fields; the screen needs 3
GET /users/42/orders?limit=5  # each order has 30 fields; needs 4
GET /products?ids=a,b,c       # then look up each product

# Mobile on a 200ms RTT: 600ms before render, and most bytes unused.
# The usual REST fixes: a purpose-built /screens/profile endpoint
# (fast, but a new endpoint per screen), or ?fields= sparse fieldsets.`,
          },
          {
            title: "GraphQL — one round trip, exactly the fields",
            lang: "graphql",
            source: `query ProfileScreen($id: ID!) {
  user(id: $id) {
    name
    avatarUrl
    orders(last: 5) {
      id
      totalCents
      placedAt
      items { product { title thumbnailUrl } }
    }
  }
}

# One request, ~200ms, only the fields listed.
# The cost: the server must resolve this efficiently, and a malicious
# client can ask for orders { items { product { relatedProducts { ... }}}}.`,
          },
          {
            title: "Bounding the cost — mandatory in production",
            lang: "ts",
            source: `const server = new ApolloServer({
  schema,
  validationRules: [
    depthLimit(8),                       // reject deeply nested queries
    costAnalysis({ maximumCost: 1000 }), // per-field cost, rejected before execution
  ],
  plugins: [persistedQueries()],         // only allow queries you shipped
});

// And a dataloader per request, or every nested field is its own query:
const productLoader = new DataLoader(async (ids) => {
  const rows = await db.products.whereIn("id", ids);   // one query for N ids
  return ids.map((id) => rows.find((r) => r.id === id) ?? null);
});`,
          },
        ],
        callout: {
          kind: "warn",
          text: "Persisted queries are the pragmatic answer to both problems at once: clients send a hash of a query you approved at build time, so cost is bounded, the request is small, and you can even make it a GET and cache it.",
        },
      },
      {
        heading: "REST done well",
        bullets: [
          "Resources as nouns, verbs from HTTP: GET /orders/42, POST /orders, PATCH /orders/42. Avoid /getOrder and /createOrderV2.",
          "Use status codes precisely: 400 for malformed, 404 for missing, 409 for conflict, 422 for semantically invalid, 429 for rate limited, 503 with Retry-After for overload.",
          "Make POST idempotent with an Idempotency-Key header — this is what payment APIs do, and it is the single most valuable REST convention for reliability.",
          "Cursor pagination, not offset: offset drifts as rows are inserted and gets slower the deeper you go.",
          "Version at the URL or with a header, but version something. Additive-only changes with deprecation headers keep the version count low.",
          "Return errors in a consistent shape with a machine-readable code, not just a message string clients will regex.",
        ],
        code: {
          title: "The conventions worth insisting on",
          lang: "http",
          source: `POST /v1/orders
Idempotency-Key: 8f14e45f-ea0f-4f0b-9b3e-2c0f4b1a9d21
Content-Type: application/json

201 Created
Location: /v1/orders/ord_9f3
{ "id": "ord_9f3", "status": "created" }

# Retrying the same Idempotency-Key returns the same 201 and the same id —
# never a second order.

GET /v1/orders?limit=20&cursor=eyJpZCI6...
200 OK
Cache-Control: private, max-age=30
{
  "data": [ ... ],
  "nextCursor": "eyJpZCI6Im9yZF84YTIifQ"     # null when exhausted
}

429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0`,
        },
      },
      {
        heading: "Where each belongs in one architecture",
        diagram: {
          kind: "layers",
          caption: "The common shape: typed and binary inside, cacheable and flexible at the edge.",
          layers: [
            { title: "Browsers and mobile", items: ["REST for cacheable public reads", "GraphQL for screen-shaped queries", "SSE / WebSocket for live updates"] },
            { title: "Edge", items: ["API gateway", "auth, rate limiting", "CDN cache for REST GETs"] },
            { title: "Service to service", items: ["gRPC: typed, binary, streaming", "async events over Kafka for anything not request-scoped"] },
            { title: "Third parties", items: ["REST with webhooks", "Idempotency-Key", "signed payloads"] },
          ],
        },
        bullets: [
          "Public APIs consumed by people you will never meet should be REST: the tooling, the documentation conventions and the debuggability matter more than efficiency.",
          "Webhooks are the inverse API and deserve the same care: signed payloads, retries with backoff, an id for deduplication, and a replay endpoint.",
          "gRPC through an L4 load balancer pins all of a client's requests to one backend, because HTTP/2 multiplexes over one connection. Use an L7 proxy or client-side load balancing.",
          "GraphQL federation lets several teams own parts of one schema — powerful, and a substantial operational commitment. Do not adopt it for two services.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Would you use GraphQL here?",
            a: "It depends on client diversity. With one web client whose queries I control, REST plus a couple of purpose-built endpoints is simpler and keeps HTTP caching. With several clients — web, iOS, Android, a partner integration — each wanting different shapes of the same data, GraphQL stops the endpoint proliferation and the over-fetching. What I would insist on either way is depth and cost limits plus persisted queries, because otherwise the client controls my server's cost.",
          },
          {
            q: "How do you cache GraphQL?",
            a: "Not with HTTP caching, mostly — everything is a POST to one URL. So caching moves inward: a per-request dataloader to collapse duplicate lookups, a shared cache at the resolver or entity level, and client-side normalised caches like Apollo's. Persisted queries sent as GETs restore some HTTP and CDN caching for public data, which is the one lever that gets edge caching back.",
          },
          {
            q: "Why not gRPC for the public API?",
            a: "Browsers cannot speak it natively — you need grpc-web and a translating proxy — and the ecosystem for third-party consumers is much weaker: no curl-and-read debugging, no browser devtools, fewer people who have used it. Inside my own network those costs vanish and the benefits are real, so the common answer is gRPC internally and REST or GraphQL at the edge.",
          },
          {
            q: "How do you version an API?",
            a: "Prefer additive change and deprecation over versioning: new optional fields, new endpoints, and a deprecation header with a sunset date on the old ones. When a breaking change is unavoidable, a major version in the path is the clearest option for REST, with both versions running through a migration window. For GraphQL the schema itself supports deprecation directives, which is one of its genuine advantages — but only if you actually retire deprecated fields.",
          },
        ],
      },
    ],
    related: ["/hld/api-gateway", "/hld/idempotency", "/hld/caching", "/hld/websockets"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },
];
