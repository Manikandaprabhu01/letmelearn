import type { Concept } from "@/data/types";

export const springObservability: Concept = {
  slug: "spring-observability",
  title: "Actuator, Micrometer & Distributed Tracing",
  subtitle:
    "Chapter 32 — exposing Actuator safely, meaningful metrics without cardinality explosions, the Observation API, trace propagation, and structured logs",
  level: "advanced",
  minutes: 26,
  tags: ["actuator", "micrometer", "tracing", "opentelemetry", "metrics", "structured logging"],
  summary:
    "Spring Boot 3 instruments HTTP servers, clients, JDBC pools, caches and Kafka through Micrometer's Observation API, producing metrics and trace spans from the same measurement. Your job is to expose it safely, add a few business observations with bounded tags, propagate trace context through every hop, and write logs that carry the trace id — so an alert leads to a trace, and the trace leads to the log line.",
  keyPoints: [
    "Serve Actuator on a separate management port and expose only what operators need.",
    "Tag values must be bounded: a user id or raw URL as a tag creates a time series per value.",
    "Percentile histograms aggregate across pods; client-side percentiles do not.",
    "Clients built from Boot's RestClient.Builder, WebClient.Builder and KafkaTemplate propagate trace context automatically.",
    "Spring Boot adds traceId and spanId to log lines when tracing is on — search logs by trace, not by timestamp.",
  ],
  prerequisites: ["/java/cloud-computing", "/hld/observability"],
  sections: [
    {
      heading: "Exposing Actuator safely",
      lede: "The endpoints that help operators also help attackers.",
      code: {
        title: "Example — a separate port and a short exposure list",
        lang: "yaml",
        source: `management:
  server:
    port: 8081                          # not reachable through the public ingress
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,loggers
  endpoint:
    health:
      probes:
        enabled: true                   # /actuator/health/liveness and /readiness
      group:
        readiness:
          include: readinessState,db    # add dependencies here deliberately, never to liveness
      show-details: never
  metrics:
    tags:
      application: \${spring.application.name}

# Never expose on a public port: heapdump (memory contents: tokens, passwords,
# customer data), env and configprops (configuration), threaddump, shutdown.`,
      },
      bullets: [
        "/actuator/loggers lets operators raise a logger to DEBUG on a running pod and lower it again — far better than redeploying to investigate.",
        "Chapter 17 covers liveness versus readiness. The short version: dependencies never belong in liveness.",
      ],
      links: [
        {
          label: "Spring Boot — Actuator endpoints",
          href: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html",
        },
      ],
    },
    {
      heading: "Metrics that answer questions",
      lede: "Rate, errors and duration for everything; a few business signals on top.",
      code: {
        title: "Example — business metrics with bounded tags",
        lang: "java",
        source: `@Service
class CheckoutMetrics {
    private final MeterRegistry registry;
    CheckoutMetrics(MeterRegistry registry) { this.registry = registry; }

    void recordCheckout(PaymentMethod method, Outcome outcome, Duration took) {
        Timer.builder("checkout.duration")
            .tag("method", method.name())       // CARD, UPI, WALLET — a handful of values
            .tag("outcome", outcome.name())     // SUCCESS, DECLINED, ERROR
            .publishPercentileHistogram()       // buckets → aggregatable p95/p99 in Prometheus
            .register(registry)
            .record(took);
    }
}

// application.yml — histograms for Spring's own HTTP timings:
//   management.metrics.distribution.percentiles-histogram.http.server.requests: true
//   management.metrics.distribution.slo.http.server.requests: 100ms,300ms,1s
//
// http.server.requests is recorded automatically with tags method, uri, status,
// outcome and exception. 'uri' is the TEMPLATE (/v1/orders/{id}), not the raw
// path — which is exactly what keeps it bounded.`,
      },
      math: [
        { label: "Tags on one timer", expr: "method × outcome", result: "3 × 3 = 9 series" },
        { label: "Histogram buckets per series", expr: "≈ 70 buckets", result: "≈ 630 series" },
        { label: "Across pods", expr: "630 × 20 pods", result: "12,600 series" },
        {
          label: "Add a userId tag",
          expr: "12,600 × 1,000,000 users",
          result: "≈ 12.6 billion",
          note: "The metrics backend falls over, or the bill does. Ids belong in traces and logs.",
        },
      ],
      bullets: [
        "Averages hide the users having a bad time; alert on p99 latency and error rate against an SLO.",
        "Client-side percentiles (publishPercentiles) are computed per pod and cannot be averaged across pods. Percentile histograms can.",
        "Built-in meters cover HikariCP (hikaricp.connections.pending is the pool-exhaustion early warning), JVM memory and GC, executors, caches and Kafka consumers.",
      ],
    },
    {
      heading: "Observations and distributed tracing",
      lede: "One instrumentation API, metrics and spans out of it.",
      diagram: {
        kind: "sequence",
        caption: "W3C trace context travelling through HTTP and Kafka.",
        actors: [
          { id: "gw", label: "API gateway" },
          { id: "o", label: "order-service" },
          { id: "p", label: "payment-service" },
          { id: "k", label: "Kafka" },
          { id: "n", label: "notification-service" },
        ],
        messages: [
          { from: "gw", to: "o", label: "POST /orders  traceparent: 00-4bf9…-01" },
          { from: "o", to: "p", label: "POST /charges  same trace id, new span" },
          { from: "p", to: "o", label: "201", kind: "return" },
          { from: "o", to: "k", label: "orders.placed  traceparent header", kind: "async" },
          { from: "k", to: "n", label: "consume  continues the trace", kind: "async" },
        ],
      },
      code: {
        title: "Example — enabling tracing and adding a business span",
        lang: "java",
        source: `// build.gradle
//   implementation 'org.springframework.boot:spring-boot-starter-actuator'
//   implementation 'io.micrometer:micrometer-tracing-bridge-otel'
//   implementation 'io.opentelemetry:opentelemetry-exporter-otlp'
//
// application.yml
//   management.tracing.sampling.probability: 0.1      # the default; 1.0 in dev
//   management.otlp.tracing.endpoint: http://otel-collector:4318/v1/traces
//   spring.kafka.template.observation-enabled: true   # Kafka is opt-in
//   spring.kafka.listener.observation-enabled: true

@Service
class FraudCheck {
    private final ObservationRegistry observations;
    FraudCheck(ObservationRegistry observations) { this.observations = observations; }

    Verdict check(Order order) {
        return Observation.createNotStarted("fraud.check", observations)
            .lowCardinalityKeyValue("channel", order.channel().name())   // → metric tag and span tag
            .highCardinalityKeyValue("order.id", order.id().toString())  // → span only, never a metric tag
            .observe(() -> rules.evaluate(order));
    }
}
// The same observation produces a 'fraud.check' timer AND a child span in the
// current trace. @Observed(name = "fraud.check") does the same declaratively.`,
      },
      callout: {
        kind: "warn",
        title: "The client that broke the trace",
        text: "Trace context is propagated by instrumentation on the clients Boot builds. A RestClient created with RestClient.create(), an HttpClient used directly, or an executor that does not propagate context starts a new trace — and the waterfall ends at that hop. Use the injected builders, and context-propagating executors for async work.",
      },
    },
    {
      heading: "Logs that join up with traces",
      code: {
        title: "Example — structured JSON logs with trace ids",
        lang: "yaml",
        source: `# Spring Boot 3.4+: structured logging in a standard format
logging:
  structured:
    format:
      console: ecs            # Elastic Common Schema; logstash and gelf are also built in
  level:
    root: info
    com.acme: info

# With tracing on, each line carries the trace and span ids:
# {"@timestamp":"2026-09-15T10:21:03.118Z","log.level":"WARN",
#  "message":"payment declined","trace.id":"4bf92f3577b34da6a3ce929d0e0e4736",
#  "span.id":"00f067aa0ba902b7","service.name":"order-service", ...}
#
# From a slow trace in the tracing UI, search logs by trace.id and read exactly
# the lines for that request across every service.`,
      },
      bullets: [
        "Log events, not narration: one line per meaningful decision or failure, with the fields needed to act on it.",
        "Never log tokens, passwords, full card numbers or personal data. Once in a log pipeline, it is copied to places with weaker access control.",
        "Log the exception once, where it is handled. Logging and rethrowing at every layer produces five stack traces for one failure.",
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is metric cardinality and why does it matter?",
          a: "The number of distinct time series a metric produces, which is the product of its tags' distinct values. Unbounded tag values such as user ids, order ids or raw URLs create millions of series that overload the metrics backend. Keep ids in traces and logs, and use bounded tags like status, method or route template.",
        },
        {
          q: "How does a trace id get from one Spring Boot service to the next?",
          a: "Micrometer Tracing instruments the HTTP server, clients built from Boot's builders, and Kafka templates and listeners when observation is enabled. Outbound requests carry the W3C traceparent header, and the receiving service continues the trace from it, creating child spans.",
        },
        {
          q: "Which Actuator endpoints would you not expose publicly, and why?",
          a: "heapdump, which contains memory including secrets and customer data; env and configprops, which reveal configuration; threaddump; and shutdown. Serve Actuator on a separate management port restricted to the cluster, and expose only health, info and metrics scraping.",
        },
        {
          q: "Why are percentile histograms preferable to percentiles computed in the application?",
          a: "Percentiles computed inside each instance cannot be combined — averaging p99s across pods is mathematically meaningless. Histograms publish bucket counts that the monitoring system can sum across instances and then compute accurate percentiles from.",
        },
      ],
      takeaways: [
        "Expose less, on a private port.",
        "Bounded tags for metrics, ids in spans and logs.",
        "Use Boot's builders so every hop propagates the trace, and log the trace id.",
      ],
    },
  ],
  related: [
    "/hld/observability",
    "/java/cloud-computing",
    "/java/spring-http-resilience",
    "/java/spring-kafka",
    "/examples/metrics",
  ],
  furtherReading: [
    {
      label: "Spring Boot — observability",
      href: "https://docs.spring.io/spring-boot/reference/actuator/observability.html",
    },
    {
      label: "Micrometer — documentation",
      href: "https://docs.micrometer.io/micrometer/reference/",
    },
    {
      label: "Spring Boot — structured logging",
      href: "https://docs.spring.io/spring-boot/reference/features/logging.html#features.logging.structured",
    },
  ],
};
