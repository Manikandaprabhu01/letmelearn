import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaDeploy: Concept[] = [
  {
    slug: "cloud-computing",
    title: "Cloud Computing",
    subtitle:
      "Chapter 17 — twelve-factor config, health checks, observability and running Java in the cloud",
    level: "intermediate",
    minutes: 20,
    tags: ["cloud", "twelve-factor", "config", "observability", "actuator"],
    summary:
      "Running a Spring Boot service in the cloud is mostly about externalising configuration, exposing the right health signals, and emitting telemetry someone else's platform can consume. The Java-specific trap is the JVM's relationship with container memory limits.",
    keyPoints: [
      "Configuration comes from the environment, never from a file baked into the image.",
      "Liveness and readiness are different questions and need different endpoints.",
      "Expose metrics through Actuator and Micrometer; do not invent a format.",
      "The JVM and container memory limits must be reconciled explicitly.",
    ],
    prerequisites: ["/java/spring-framework"],
    sections: [
      {
        heading: "Configuration and the twelve-factor habits that matter",
        code: {
          title: "Example — typed configuration from the environment",
          lang: "java",
          source: `# application.yml — defaults only, NEVER secrets
app:
  payments:
    base-url: https://api.example.com
    timeout: 10s
    max-retries: 3

# Overridden per environment. Spring maps APP_PAYMENTS_BASE_URL automatically,
# so the same image runs in dev, staging and production unchanged.

@ConfigurationProperties(prefix = "app.payments")
@Validated
public record PaymentProperties(
    @NotBlank String baseUrl,
    @NotNull Duration timeout,
    @Min(0) @Max(5) int maxRetries
) { }
// @Validated means a misconfigured environment fails at STARTUP with a clear
// message, rather than at 3am on the first request that needed the value.

// Profiles for environment-specific beans:
@Profile("!production")
@Bean DataSource devDataSource() { ... }`,
        },
        bullets: [
          "One immutable image promoted through environments, with configuration injected — not a separate build per environment.",
          "Secrets come from a secret manager or the platform's injection mechanism, never from application.yml in the repository.",
          "Fail fast at startup on invalid configuration. A service that starts successfully and then fails on first use is far harder to diagnose.",
        ],
        links: [
          { label: "The Twelve-Factor App", href: "https://12factor.net/" },
          {
            label: "Spring Boot — externalized configuration",
            href: "https://docs.spring.io/spring-boot/reference/features/external-config.html",
          },
        ],
      },
      {
        heading: "Health checks, metrics and tracing",
        code: {
          title: "Example — liveness and readiness are different questions",
          lang: "java",
          source: `management:
  endpoints.web.exposure.include: health,info,prometheus   # NOT "*" in production
  endpoint.health:
    probes.enabled: true          # exposes /health/liveness and /health/readiness
    show-details: when-authorized
  metrics.tags:
    application: order-service    # so metrics are attributable

# LIVENESS  — "is this process broken beyond recovery?" → failing restarts the pod
# READINESS — "can it serve traffic right now?"         → failing removes it from the LB
#
# THE CLASSIC MISTAKE: putting a downstream dependency check in LIVENESS.
# The database blips, every pod reports unhealthy, Kubernetes restarts them all,
# and a brief dependency problem becomes a full outage. Dependencies belong in
# READINESS at most — and often nowhere.

@Component
public class PaymentProviderHealth implements HealthIndicator {
    @Override public Health health() {
        return client.ping()
            ? Health.up().build()
            : Health.down().withDetail("provider", "unreachable").build();
    }
}`,
        },
        bullets: [
          "Micrometer is the metrics facade — write to it and the platform decides the backend (Prometheus, Datadog, CloudWatch).",
          "Emit a correlation id on every log line and propagate it across service calls; without it, distributed debugging is guesswork.",
          "Do not expose all actuator endpoints publicly — /env and /heapdump disclose configuration and memory contents.",
        ],
        links: [
          {
            label: "Spring Boot — Actuator documentation",
            href: "https://docs.spring.io/spring-boot/reference/actuator/index.html",
          },
          { label: "Site: observability fundamentals", href: "/hld/observability" },
        ],
      },
    ],
    related: ["/java/docker", "/java/spring-framework", "/hld/observability"],
    furtherReading: [{ label: "12 Factor App", href: "https://12factor.net/" }],
  },

  {
    slug: "docker",
    title: "Docker & Containers",
    subtitle:
      "Chapter 19 — image layers, JVM memory in containers, and shipping a Spring Boot service",
    level: "intermediate",
    minutes: 20,
    tags: ["docker", "containers", "jvm", "layers", "kubernetes"],
    summary:
      "Containerising a Spring Boot app is straightforward and has two Java-specific traps that catch everyone: a naive Dockerfile that rebuilds every dependency on each code change, and a JVM that ignores the container's memory limit until it gets killed.",
    keyPoints: [
      "Layer the image so dependencies cache separately from application code.",
      "Modern JVMs are container-aware, but you should still set limits explicitly.",
      "OOMKilled means the container limit, not the Java heap — they are different numbers.",
      "Run as a non-root user; security review will check.",
    ],
    prerequisites: ["/java/cloud-computing"],
    sections: [
      {
        heading: "A Dockerfile that caches properly",
        code: {
          title: "Example — naive versus layered",
          lang: "dockerfile",
          source: `# NAIVE — one fat JAR in one layer. Change a single line of code and the
# whole 60 MB layer is rebuilt and re-pushed.
FROM eclipse-temurin:21-jre
COPY target/app.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]

# LAYERED — Spring Boot can extract the JAR into layers that change at
# different rates. Dependencies rarely change; your code changes constantly.
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build
COPY . .
RUN ./mvnw -q package -DskipTests \\
 && java -Djarmode=layertools -jar target/app.jar extract

FROM eclipse-temurin:21-jre
RUN useradd --create-home --uid 10001 appuser      # non-root
WORKDIR /app
# Order matters: least-frequently-changed first, so caches survive.
COPY --from=builder /build/dependencies/          ./
COPY --from=builder /build/spring-boot-loader/    ./
COPY --from=builder /build/snapshot-dependencies/ ./
COPY --from=builder /build/application/           ./
USER appuser
ENTRYPOINT ["java","org.springframework.boot.loader.launch.JarLauncher"]`,
        },
        bullets: [
          "Multi-stage builds keep the JDK and build tools out of the shipped image — smaller, and a smaller attack surface for the scanner.",
          "A JRE base image rather than a JDK saves hundreds of megabytes you do not need at runtime.",
          "Pin base images by digest for reproducibility; a floating tag means the image changes underneath you.",
        ],
        links: [
          {
            label: "Spring Boot — container images",
            href: "https://docs.spring.io/spring-boot/reference/packaging/container-images/index.html",
          },
          {
            label: "YouTube search — Dockerfile Spring Boot layered image",
            href: YT("dockerfile spring boot layered image multi stage build tutorial"),
          },
        ],
      },
      {
        heading: "The JVM and container memory",
        callout: {
          kind: "warn",
          title: "OOMKilled is not an OutOfMemoryError",
          text: "An OutOfMemoryError means the Java heap filled — the JVM throws, and you get a stack trace. OOMKilled means the whole container exceeded its memory limit and the kernel killed the process — no exception, no stack trace, just a restart. The cause is usually that heap plus metaspace plus thread stacks plus native buffers exceeded the container limit while the heap alone was still under its own ceiling. Set both numbers deliberately.",
        },
        code: {
          title: "Example — reconciling the two limits",
          lang: "yaml",
          source: `# Kubernetes container limit
resources:
  requests: { memory: "512Mi", cpu: "250m" }
  limits:   { memory: "1Gi" }        # ← the kernel kills above this

# The JVM must be told to stay comfortably UNDER that limit, because the heap
# is not the only memory the process uses.
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=70 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp"

# MaxRAMPercentage=70 on a 1Gi limit gives roughly a 700Mi heap, leaving ~300Mi
# for metaspace, code cache, thread stacks, direct byte buffers and the JVM
# itself. Setting -Xmx1g inside a 1Gi container is the classic mistake: the
# heap alone is allowed to reach the limit, so anything else pushes it over.

# Always enable the heap dump on OOM. An out-of-memory in production without
# a dump is an incident you cannot diagnose after the fact.`,
        },
        bullets: [
          "Java 10+ is container-aware and reads cgroup limits, but the default heap fraction is conservative — set MaxRAMPercentage explicitly rather than relying on it.",
          "Each thread costs about 1 MB of stack. A large pool plus a modest heap can exceed the container limit even with the heap well under -Xmx.",
          "If pods restart with no stack trace and no OutOfMemoryError in the logs, check `kubectl describe pod` for OOMKilled before looking at your code.",
        ],
        links: [
          {
            label: "YouTube search — JVM memory limits containers OOMKilled",
            href: YT("JVM memory container limits OOMKilled kubernetes explained"),
          },
          { label: "Site: Kubernetes resource settings", href: "/fde/production-ai-engineering" },
        ],
      },
    ],
    related: ["/java/cloud-computing", "/java/spring-framework"],
    furtherReading: [
      {
        label: "Spring Boot — container images",
        href: "https://docs.spring.io/spring-boot/reference/packaging/container-images/index.html",
      },
    ],
  },
];
