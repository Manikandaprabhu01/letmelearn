import type { Concept } from "@/data/types";

export const springKafka: Concept = {
  slug: "spring-kafka",
  title: "Event-Driven Spring with Kafka",
  subtitle:
    "Chapter 30 — listener containers and concurrency, offsets and at-least-once delivery, retries and dead-letter topics, reliable publishing, ordering and rebalances",
  level: "advanced",
  minutes: 32,
  tags: [
    "kafka",
    "spring kafka",
    "kafkalistener",
    "dead letter topic",
    "idempotent consumer",
    "outbox",
  ],
  summary:
    "A @KafkaListener is a poll loop per partition-owning thread that commits offsets after your code returns. Everything follows from that: messages arrive at least once, so consumers must be idempotent; a record that always fails must be moved aside or it blocks its partition forever; slow processing triggers rebalances; and a service that writes to its database and then to Kafka will eventually do only one of the two unless it uses an outbox.",
  keyPoints: [
    "Listener concurrency above the partition count adds idle consumers, not throughput.",
    "Spring commits offsets after the listener returns, so a crash or rebalance redelivers — design for duplicates.",
    "Configure DefaultErrorHandler with bounded retries, non-retryable exceptions and a dead-letter topic; wrap deserializers in ErrorHandlingDeserializer.",
    "Writing to the database and sending to Kafka are two systems — use the transactional outbox.",
    "Ordering holds only within a partition: key by aggregate id and never assume global order.",
  ],
  prerequisites: ["/hld/message-queues", "/java/spring-transactions"],
  sections: [
    {
      heading: "The listener container model",
      lede: "What @KafkaListener actually starts.",
      diagram: {
        kind: "flow",
        caption: "Topic with 6 partitions, consumer group of 2 pods × concurrency 3.",
        rows: [
          [
            { id: "p0", label: "P0" },
            { id: "p1", label: "P1" },
            { id: "p2", label: "P2" },
            { id: "p3", label: "P3" },
            { id: "p4", label: "P4" },
            { id: "p5", label: "P5" },
          ],
          [
            { id: "a", label: "pod-a: 3 consumer threads", sub: "P0, P1, P2", tone: "accent" },
            { id: "b", label: "pod-b: 3 consumer threads", sub: "P3, P4, P5", tone: "accent" },
          ],
          [
            {
              id: "c",
              label: "pod-c added: 3 more threads",
              sub: "rebalance; 3 threads idle — only 6 partitions",
              tone: "warn",
            },
          ],
        ],
      },
      code: {
        title: "Example — a listener and the settings that decide its behaviour",
        lang: "java",
        source: `@Component
class PaymentEvents {
    @KafkaListener(topics = "payments.captured", groupId = "orders", concurrency = "3")
    void onCaptured(PaymentCaptured event, @Header(KafkaHeaders.RECEIVED_KEY) String key) {
        handler.apply(event);
    }
}

// application.yml
//   spring.kafka:
//     bootstrap-servers: kafka:9092
//     consumer:
//       auto-offset-reset: earliest           # a brand-new group starts from the beginning
//       max-poll-records: 100                 # default 500 — smaller batches, fewer surprises
//       properties:
//         max.poll.interval.ms: 300000        # default 5 min between polls
//     listener:
//       ack-mode: batch                       # Spring's default: commit after each poll's records
//
// THE REBALANCE LOOP: if processing 500 records takes longer than
// max.poll.interval.ms, the broker considers the consumer dead and reassigns its
// partitions. Its uncommitted records are redelivered to another consumer, which
// is also too slow, and the group rebalances indefinitely. Fix the processing
// time or lower max-poll-records — do not just raise the interval.`,
      },
      bullets: [
        "One partition is consumed by one thread in a group at a time. Throughput scales with partitions, so decide partition counts from target throughput — and add them early, because adding partitions later remaps keys.",
        "Listener containers are SmartLifecycle beans (chapter 21): they start after the context refreshes and stop before beans are destroyed.",
      ],
      links: [
        {
          label: "Spring for Apache Kafka — reference",
          href: "https://docs.spring.io/spring-kafka/reference/",
        },
      ],
    },
    {
      heading: "Offsets, duplicates and idempotent consumers",
      lede: "At-least-once is the default, and the only honest promise.",
      code: {
        title: "Example — deduplicating inside the business transaction",
        lang: "java",
        source: `// Spring Kafka disables the client's auto-commit and commits offsets itself
// AFTER the listener returns. So:
//   process → crash before commit → the record is delivered again
//   process → rebalance before commit → another consumer processes it again

@Component
class PaymentCapturedHandler {

    @KafkaListener(topics = "payments.captured", groupId = "orders")
    @Transactional
    public void onCaptured(PaymentCaptured event) {
        // processed_events(event_id PRIMARY KEY). The insert and the business
        // update commit together, so "processed" and "applied" can never disagree.
        boolean firstTime = processedEvents.insertIfAbsent(event.eventId());
        //   INSERT INTO processed_events(event_id) VALUES (?) ON CONFLICT DO NOTHING
        if (!firstTime) {
            return;                                   // duplicate: already applied
        }
        orders.markPaid(event.orderId(), event.amount());
    }
}

// Alternatives when a dedup table is too heavy:
//  • Natural idempotency — "set status = PAID where id = ?" is safe to repeat.
//  • Version checks — apply only if event.version > stored version.`,
      },
      callout: {
        kind: "insight",
        title: "“Exactly once” is scoped",
        text: "Kafka transactions give exactly-once for consume-transform-produce entirely inside Kafka: read offsets and produced records commit atomically. The moment the listener writes to a database or calls an API, that side effect is outside the Kafka transaction, and idempotency is still your job.",
      },
    },
    {
      heading: "Errors: retries, backoff and dead-letter topics",
      lede: "A record that always fails must not block its partition forever.",
      code: {
        title: "Example — bounded retries, poison pills and a DLT",
        lang: "java",
        source: `@Configuration
class KafkaErrorHandling {

    // Spring Boot wires a CommonErrorHandler bean into the listener container factory.
    @Bean
    DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<?, ?> template) {
        var toDlt = new DeadLetterPublishingRecoverer(template);   // → <topic>.DLT, same partition
        var backoff = new ExponentialBackOffWithMaxRetries(4);    // 1s, 2s, 4s, 8s — then give up
        backoff.setInitialInterval(1_000);
        backoff.setMultiplier(2.0);
        backoff.setMaxInterval(10_000);

        var handler = new DefaultErrorHandler(toDlt, backoff);
        // Retrying cannot fix bad data — send these to the DLT immediately.
        handler.addNotRetryableExceptions(
            ConstraintViolationException.class, UnknownOrderException.class);
        return handler;
    }
}

// application.yml — a record that cannot be DESERIALIZED fails before your
// listener runs. Without this wrapper the container re-polls it forever:
//   spring.kafka.consumer:
//     value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
//     properties:
//       spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
//       spring.json.trusted.packages: com.acme.events`,
      },
      diagram: {
        kind: "compare",
        caption: "Two retry styles.",
        options: [
          {
            title: "Blocking retries",
            sub: "DefaultErrorHandler + BackOff",
            good: ["Preserves per-partition order", "Simple — no extra topics"],
            bad: [
              "The whole partition waits during backoff",
              "Long backoffs risk max.poll.interval.ms rebalances",
            ],
            verdict: "Default for events where order matters.",
            tone: "accent",
          },
          {
            title: "Non-blocking retries",
            sub: "@RetryableTopic → -retry topics, -dlt",
            good: ["The main partition keeps flowing", "Long delays without blocking consumers"],
            bad: [
              "Order is lost for retried records",
              "More topics to provision, monitor and replay",
            ],
            verdict: "For independent events where throughput matters more than order.",
          },
        ],
      },
      bullets: [
        "A dead-letter topic nobody watches is a slow data-loss mechanism. Alert on DLT growth and build a replay path that republishes fixed records to the original topic.",
        "Record the failure reason: DeadLetterPublishingRecoverer adds headers with the exception class, message and original topic, partition and offset.",
      ],
    },
    {
      heading: "Publishing reliably: the dual-write problem",
      lede: "Commit to the database, then send to Kafka — and one of them will eventually fail alone.",
      code: {
        title: "Example — from dual write to transactional outbox",
        lang: "java",
        source: `// BROKEN — two systems, no shared transaction.
@Transactional
public void placeOrder(Order order) {
    orders.save(order);
    kafka.send("orders.placed", order.id().toString(), OrderPlaced.from(order));
}
// send() is asynchronous: it can fail after the DB commit (event lost), or
// succeed and then the DB commit fails (event for an order that never existed).

// OUTBOX — the event is a row in the same transaction as the order.
@Transactional
public void placeOrder(Order order) {
    orders.save(order);
    outbox.save(OutboxEvent.of("orders.placed", order.id().toString(), OrderPlaced.from(order)));
}

// A relay publishes committed rows. With several pods, SKIP LOCKED lets each
// claim a different batch instead of waiting on one another.
@Scheduled(fixedDelay = 500)
@Transactional
public void relay() {
    for (OutboxEvent e : outbox.lockNextBatch(100)) {   // SELECT … FOR UPDATE SKIP LOCKED
        kafka.send(e.topic(), e.key(), e.payload()).get(5, TimeUnit.SECONDS);  // wait for the ack
        e.markPublished();
    }
}
// A crash after send but before markPublished republishes the batch — consumers
// are idempotent (previous section), so that is fine. Change-data-capture
// (Debezium reading the database log) replaces this poller at larger scale.

// Producer settings for the relay:
//   spring.kafka.producer.acks: all                       # wait for in-sync replicas
//   spring.kafka.producer.properties.enable.idempotence: true   # no duplicates from client retries`,
      },
      links: [
        { label: "Site: transactional outbox", href: "/hld/transactional-outbox" },
        { label: "Site: sagas", href: "/hld/saga-pattern" },
      ],
    },
    {
      heading: "Ordering and rebalances",
      bullets: [
        "Kafka orders records within a partition only. Use the aggregate id (orderId, accountId) as the key so all events for one entity land in one partition, in order.",
        "Increasing a topic's partition count changes which partition a key maps to; for a while, one entity's old and new events live in different partitions. Plan partition counts up front.",
        "Set partition.assignment.strategy to CooperativeStickyAssignor so a rebalance moves only the partitions that must move instead of stopping every consumer.",
        "Static membership (group.instance.id per pod, e.g. from the StatefulSet name) lets a restarting pod rejoin within session.timeout.ms without triggering a rebalance at all — useful for rolling deploys.",
        "Consumer lag per partition is the health signal that matters. Rising lag with low CPU usually means a slow dependency inside the listener, not too few consumers.",
      ],
      callout: {
        kind: "warn",
        title: "Async inside a listener breaks the offset contract",
        text: "If the listener hands the record to another thread and returns, Spring commits the offset before the work is done. A crash then loses the record. Process synchronously, or use manual acknowledgment and acknowledge only when the work completes.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Our consumer group keeps rebalancing and processing the same records. What is happening?",
          a: "Processing a poll's batch is taking longer than max.poll.interval.ms, so the broker evicts the consumer and reassigns its partitions before offsets are committed, and the next consumer repeats the work. Reduce max.poll.records, speed up or bound the processing (timeouts on dependencies), and only then consider raising the interval.",
        },
        {
          q: "How do you handle a message that always fails?",
          a: "Use bounded retries with backoff, mark validation and deserialization failures as non-retryable, and publish the record to a dead-letter topic with failure headers. Wrap deserializers in ErrorHandlingDeserializer so poison pills reach the error handler, and monitor and replay the DLT.",
        },
        {
          q: "How do you guarantee an event is published when a database row is committed?",
          a: "With a transactional outbox: write the event to an outbox table in the same database transaction, then publish committed rows with a relay or change-data-capture, marking them sent after the broker acknowledges. Consumers deduplicate because the relay can publish more than once.",
        },
        {
          q: "Does setting concurrency to 12 give twelve times the throughput?",
          a: "Only if the topic has at least twelve partitions across the consumer group. Each partition is consumed by one thread at a time, so extra threads beyond the partition count sit idle.",
        },
        {
          q: "How do you preserve ordering for a customer's events?",
          a: "Use the customer id as the message key so its events go to one partition, keep processing synchronous per partition, and use blocking retries so a failing event does not let later events for the same customer overtake it.",
        },
      ],
      takeaways: [
        "Partitions set parallelism; keys set ordering.",
        "At-least-once delivery plus idempotent consumers is the reliable baseline.",
        "Bounded retries, dead-letter topics you monitor, and an outbox for publishing.",
      ],
    },
  ],
  related: [
    "/hld/message-queues",
    "/hld/transactional-outbox",
    "/hld/idempotency",
    "/java/spring-transactions",
    "/examples/distributed-mq",
  ],
  furtherReading: [
    {
      label: "Spring for Apache Kafka — reference",
      href: "https://docs.spring.io/spring-kafka/reference/",
    },
    {
      label: "Spring Boot — Apache Kafka support",
      href: "https://docs.spring.io/spring-boot/reference/messaging/kafka.html",
    },
    {
      label: "Apache Kafka — documentation",
      href: "https://kafka.apache.org/documentation/",
    },
  ],
};
