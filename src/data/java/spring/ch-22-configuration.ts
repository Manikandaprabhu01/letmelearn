import type { Concept } from "@/data/types";

export const springConfiguration: Concept = {
  slug: "spring-configuration",
  title: "Externalized Configuration & Custom Starters",
  subtitle:
    "Chapter 22 — property precedence, typed @ConfigurationProperties, profiles, secrets, and writing your own auto-configuration",
  level: "advanced",
  minutes: 26,
  tags: ["spring boot", "configuration", "profiles", "configuration properties", "starters"],
  summary:
    "A Spring Boot property can come from more than a dozen places, and the one that wins is decided by a fixed order. Bind configuration into validated, typed records rather than scattering @Value strings; use profiles for behaviour and environment variables for values; and when several services repeat the same setup, package it as a starter with conditions — exactly how Spring Boot builds its own.",
  keyPoints: [
    "Command-line arguments beat environment variables, which beat application.yml — know the order before debugging a “wrong” value.",
    "Ask /actuator/env and /actuator/configprops which source won instead of guessing.",
    "@ConfigurationProperties records give you types, validation, relaxed binding and IDE metadata; @Value gives you none of that.",
    "Secrets come from the platform at runtime (mounted files, a vault), never from a committed application.yml.",
    "A starter is an auto-configuration class plus conditions plus one imports file — test it with ApplicationContextRunner.",
  ],
  prerequisites: ["/java/spring-framework", "/java/spring-boot-startup"],
  sections: [
    {
      heading: "Where a property value comes from",
      lede: "Higher in the list wins. Most “config bugs” are two sources disagreeing.",
      table: {
        caption:
          "Property sources, highest precedence first (simplified to the ones services use).",
        headers: ["#", "Source", "Typical use"],
        rows: [
          ["1", "Command-line arguments (--server.port=9090)", "One-off overrides"],
          ["2", "SPRING_APPLICATION_JSON", "A whole JSON blob injected by a platform"],
          ["3", "Java system properties (-Dkey=value)", "JVM-level switches"],
          [
            "4",
            "OS environment variables",
            "Per-environment values in containers — the normal route",
          ],
          ["5", "application-{profile}.yml outside the jar", "Operator-supplied profile overrides"],
          ["6", "application.yml outside the jar", "Operator-supplied defaults"],
          [
            "7",
            "application-{profile}.yml inside the jar",
            "Profile behaviour shipped with the app",
          ],
          ["8", "application.yml inside the jar", "Sensible defaults"],
          [
            "9",
            "@PropertySource on a @Configuration",
            "Legacy .properties files — loaded late, so easily overridden",
          ],
          [
            "10",
            "Default properties (SpringApplication.setDefaultProperties)",
            "Last-resort fallbacks",
          ],
        ],
      },
      code: {
        title: "Example — relaxed binding, and asking which source won",
        lang: "yaml",
        source: `# application.yml (inside the jar)
orders:
  payment:
    timeout: 2s
    max-retries: 3
    providers[0]: stripe

# The same keys as environment variables — uppercase, dots and dashes become
# underscores, list indexes become _N_:
#   ORDERS_PAYMENT_TIMEOUT=5s
#   ORDERS_PAYMENT_MAXRETRIES=5        (dashes are removed, not converted)
#   ORDERS_PAYMENT_PROVIDERS_0_=razorpay
#
# The environment variable wins (source 4 beats source 8).

# To see WHICH source supplied a value, expose the endpoints to operators only:
#   management.endpoints.web.exposure.include: health,env,configprops
#   GET /actuator/env/orders.payment.timeout
#     → "propertySources": [{ "name": "systemEnvironment", "value": "5s" }, ...]
#
# Values are masked by default (management.endpoint.env.show-values: never).
# Keep it that way in production — the env endpoint is a secrets dump otherwise.`,
      },
      links: [
        {
          label: "Spring Boot — externalized configuration",
          href: "https://docs.spring.io/spring-boot/reference/features/external-config.html",
        },
      ],
    },
    {
      heading: "Typed configuration with @ConfigurationProperties",
      lede: "Configuration is an API your service exposes to operators — give it a schema.",
      code: {
        title: "Example — a validated, immutable configuration record",
        lang: "java",
        source: `@ConfigurationProperties("orders.payment")
@Validated
public record PaymentProperties(
        @NotNull @DurationMin(millis = 100) Duration timeout,   // binds "2s", "500ms", "PT2S"
        @Min(0) @Max(10) int maxRetries,
        @NotEmpty List<String> providers,
        @DefaultValue("10MB") DataSize maxPayload) {
}

@SpringBootApplication
@ConfigurationPropertiesScan          // registers every @ConfigurationProperties type
public class OrderApplication { ... }

@Service
class PaymentClient {
    private final PaymentProperties props;
    PaymentClient(PaymentProperties props) { this.props = props; }  // plain injection
}

// A typo or an out-of-range value now FAILS STARTUP with a message naming the
// property — instead of a NumberFormatException on the first payment.
//
// Compare the @Value version:
//   @Value("\${orders.payment.timeout:2s}") Duration timeout;
// — a string key repeated wherever it is used, no validation, no grouping, and
// IDE auto-completion only if you add metadata by hand.

// Add spring-boot-configuration-processor (annotationProcessor scope) to
// generate META-INF/spring-configuration-metadata.json: operators get
// completion and documentation for your keys in application.yml.`,
      },
      table: {
        headers: ["", "@ConfigurationProperties", "@Value"],
        rows: [
          ["Type conversion (Duration, DataSize, lists, maps)", "Yes", "Partly"],
          ["Bean Validation at startup", "Yes, with @Validated", "No"],
          ["Relaxed binding from environment variables", "Full", "Limited"],
          ["IDE metadata", "Generated", "No"],
          ["SpEL expressions", "No", "Yes"],
          ["Best for", "Groups of related settings", "A single, rarely used value"],
        ],
      },
    },
    {
      heading: "Profiles, config data and secrets",
      lede: "Profiles switch behaviour; environment variables carry values.",
      code: {
        title: "Example — profile groups, imports and mounted secrets",
        lang: "yaml",
        source: `spring:
  application:
    name: order-service
  profiles:
    group:
      prod: [postgres, otel]          # --spring.profiles.active=prod enables all three
  config:
    import:
      # Kubernetes mounts each Secret key as a file; configtree turns
      # /etc/secrets/db/password into the property db.password.
      - optional:configtree:/etc/secrets/

---
spring:
  config:
    activate:
      on-profile: postgres
  datasource:
    url: jdbc:postgresql://\${DB_HOST}:5432/orders
    username: orders
    password: \${db.password}          # from the mounted secret, never committed

---
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:postgresql://localhost:5432/orders`,
      },
      bullets: [
        "One profile per environment (dev, staging, prod) with different values inside each file breeds drift: the prod file is the one nobody runs locally. Keep one set of behaviour and vary values through environment variables.",
        "Profiles are good for switching real behaviour — which DataSource, whether tracing is on — and profile groups keep the active list short.",
        "optional: in spring.config.import means a missing source is skipped. Without it, a missing secrets directory fails startup, which is often what you want in production.",
        "@Profile on a @Bean is evaluated once at startup. It is not a feature flag; for runtime toggles use a flag service.",
      ],
      callout: {
        kind: "warn",
        title: "The committed secret",
        text: "A password in application.yml is in every developer clone, CI log and container image layer, forever. Git history outlives the rotation. Inject secrets at runtime from the platform and fail startup when they are absent.",
      },
    },
    {
      heading: "Writing your own starter",
      lede: "When five services copy the same @Configuration, package it the way Spring Boot does.",
      code: [
        {
          title: "Example — an audit-logging auto-configuration",
          lang: "java",
          source: `// Module: acme-audit-spring-boot-autoconfigure

@ConfigurationProperties("acme.audit")
public record AuditProperties(@DefaultValue("true") boolean enabled,
                              @DefaultValue("audit-events") String topic) { }

@AutoConfiguration(after = JacksonAutoConfiguration.class)   // ordering between auto-configs
@ConditionalOnClass(KafkaTemplate.class)                     // only if Kafka is on the classpath
@ConditionalOnProperty(prefix = "acme.audit", name = "enabled", matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean             // the application can replace it with its own
    AuditPublisher auditPublisher(KafkaTemplate<String, String> kafka,
                                  ObjectMapper json, AuditProperties props) {
        return new KafkaAuditPublisher(kafka, json, props.topic());
    }
}

// Register it — one fully qualified class name per line — in:
//   src/main/resources/META-INF/spring/
//       org.springframework.boot.autoconfigure.AutoConfiguration.imports
//
// Module: acme-audit-spring-boot-starter — no code, just dependencies on the
// autoconfigure module and the libraries it needs. Services add ONE dependency.`,
        },
        {
          title: "Example — testing every condition without starting an application",
          lang: "java",
          source: `class AuditAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(
            JacksonAutoConfiguration.class, AuditAutoConfiguration.class))
        .withBean(KafkaTemplate.class, () -> mock(KafkaTemplate.class));

    @Test void createsPublisherByDefault() {
        runner.run(ctx -> assertThat(ctx).hasSingleBean(AuditPublisher.class));
    }

    @Test void backsOffWhenDisabled() {
        runner.withPropertyValues("acme.audit.enabled=false")
              .run(ctx -> assertThat(ctx).doesNotHaveBean(AuditPublisher.class));
    }

    @Test void backsOffWhenTheAppDefinesItsOwn() {
        runner.withBean(AuditPublisher.class, () -> event -> { })
              .run(ctx -> assertThat(ctx).getBean(AuditPublisher.class)
                                         .isNotInstanceOf(KafkaAuditPublisher.class));
    }
}`,
        },
      ],
      bullets: [
        "Never @ComponentScan inside an auto-configuration. It registers beans unconditionally and can pick up the application's own classes.",
        "Put @ConditionalOnMissingBean on beans, not only on the class, so an application can override one piece without losing the rest.",
        "Name your own starter acme-audit-spring-boot-starter; the spring-boot-starter-* prefix is reserved for Spring Boot's own.",
      ],
      links: [
        {
          label: "Spring Boot — creating your own auto-configuration",
          href: "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html",
        },
      ],
    },
    {
      heading: "Changing configuration at runtime",
      bullets: [
        "The default and usually the best answer is a rolling restart: configuration changes go through the same review and rollout as code, and every instance agrees.",
        "Spring Cloud's @RefreshScope can rebuild selected beans when configuration changes, but beans that captured values elsewhere keep the old ones, and instances refresh at different moments.",
        "Values that genuinely change during the day — kill switches, percentage rollouts — belong in a feature-flag service designed for that, not in application properties.",
      ],
      callout: {
        kind: "insight",
        title: "Configuration drift is a deploy problem",
        text: "If changing a timeout requires editing a live ConfigMap and hoping pods reload, the real value in production is unknowable. Keeping configuration in the deployment manifest and rolling it out makes “what is running” a question git can answer.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "An environment variable and application.yml set the same property. Which wins, and how would you confirm it?",
          a: "The environment variable, because OS environment variables sit above config files in the precedence order. To confirm, call /actuator/env/{property} — it lists every source that defines the key, with the winning one first.",
        },
        {
          q: "Why prefer @ConfigurationProperties over @Value?",
          a: "It binds a group of settings into a typed object with conversion for durations and sizes, validates them at startup with @Validated, supports full relaxed binding from environment variables, and generates IDE metadata. @Value is a string key per field with none of those guarantees.",
        },
        {
          q: "How does Spring Boot decide to create a bean from a starter, and how does an application override it?",
          a: "The starter's auto-configuration is listed in the AutoConfiguration.imports file and guarded by conditions such as @ConditionalOnClass and @ConditionalOnProperty. Its beans carry @ConditionalOnMissingBean, so when the application defines its own bean of that type, the auto-configured one backs off.",
        },
        {
          q: "How do you get secrets into a Spring Boot app on Kubernetes?",
          a: "Mount the Secret as files and import them with spring.config.import=configtree:, or use a vault integration, or map them to environment variables. The application never contains the value, and startup fails if a required secret is missing.",
        },
      ],
      takeaways: [
        "Learn the precedence order once and use /actuator/env instead of guessing.",
        "Bind configuration into validated records so bad values fail at boot.",
        "Package repeated setup as a conditional auto-configuration, and test the conditions.",
      ],
    },
  ],
  related: [
    "/java/spring-boot-startup",
    "/java/cloud-computing",
    "/java/spring-framework",
    "/hld/service-security",
    "/hld/containers-kubernetes",
  ],
  furtherReading: [
    {
      label: "Spring Boot — externalized configuration",
      href: "https://docs.spring.io/spring-boot/reference/features/external-config.html",
    },
    {
      label: "Spring Boot — creating your own auto-configuration",
      href: "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html",
    },
    {
      label: "The Twelve-Factor App — config",
      href: "https://12factor.net/config",
    },
  ],
};
