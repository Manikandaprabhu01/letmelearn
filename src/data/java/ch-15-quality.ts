import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaQuality: Concept[] = [
  {
    slug: "design-patterns",
    title: "Design Patterns",
    subtitle: "Chapter 15 — the handful that matter in Java, and the ones Spring already applies",
    level: "intermediate",
    minutes: 22,
    tags: ["patterns", "builder", "strategy", "factory", "singleton"],
    summary:
      "Read this after Spring, not before. Patterns learned in the abstract become cargo cult; patterns recognised in code you already use are genuinely clarifying. Most of the Gang of Four catalogue is historical — perhaps six patterns earn their place in modern Java, and Spring applies several of them for you.",
    keyPoints: [
      "Builder for objects with many optional fields — the one you will write most.",
      "Strategy is just an interface with swappable implementations; Spring injects them.",
      "Singleton is handled by the Spring container; do not hand-roll it.",
      "Recognising a pattern in existing code matters more than applying one.",
    ],
    prerequisites: ["/java/oop"],
    sections: [
      {
        heading: "The patterns worth knowing",
        table: {
          caption: "What you will actually encounter in a Spring codebase.",
          headers: ["Pattern", "Problem it solves", "Where you already use it"],
          rows: [
            [
              "Builder",
              "Many optional constructor parameters",
              "Lombok @Builder, HttpRequest.newBuilder()",
            ],
            [
              "Strategy",
              "Swappable algorithms",
              "Any interface with several @Component implementations",
            ],
            ["Factory", "Creation logic that varies", "Spring's @Bean methods"],
            ["Singleton", "One shared instance", "Spring beans — default scope"],
            ["Template method", "Fixed skeleton, varying steps", "JdbcTemplate, RestTemplate"],
            [
              "Proxy / Decorator",
              "Wrap behaviour transparently",
              "@Transactional, @Cacheable, AOP",
            ],
            ["Observer", "React to events", "ApplicationEventPublisher"],
          ],
        },
        code: {
          title: "Example — Builder and Strategy, the two you will write",
          lang: "java",
          source: `// BUILDER — for a type with many optional fields. A constructor with eight
// parameters is unreadable and easy to call wrongly.
public record Notification(String to, String subject, String body,
                           Priority priority, List<String> cc, boolean html) {
    public static Builder builder(String to) { return new Builder(to); }

    public static final class Builder {
        private final String to;                        // required
        private String subject = "";
        private Priority priority = Priority.NORMAL;    // sensible defaults
        private List<String> cc = List.of();
        private boolean html = false;

        Builder(String to) { this.to = to; }
        public Builder subject(String s)   { this.subject = s; return this; }
        public Builder priority(Priority p){ this.priority = p; return this; }
        public Builder html()              { this.html = true; return this; }
        public Notification build()        { return new Notification(to, subject, "", priority, cc, html); }
    }
}

Notification n = Notification.builder("a@b.com").subject("Welcome").html().build();

// STRATEGY — in Spring this is just an interface plus implementations, and the
// container hands you all of them.
public interface DiscountPolicy { BigDecimal apply(Order o); String code(); }

@Component class SeasonalDiscount implements DiscountPolicy { /* ... */ }
@Component class LoyaltyDiscount  implements DiscountPolicy { /* ... */ }

@Service
public class Pricing {
    private final Map<String, DiscountPolicy> policies;

    // Spring injects EVERY implementation, keyed by bean name. Adding a new
    // policy is adding a class — no switch statement to update.
    Pricing(List<DiscountPolicy> all) {
        this.policies = all.stream().collect(toMap(DiscountPolicy::code, identity()));
    }
}`,
        },
        bullets: [
          "Do not hand-roll Singleton. The double-checked-locking version is a classic source of subtle bugs, and a Spring bean is a singleton already.",
          "If you find yourself writing a switch over a type to choose behaviour, that is Strategy asking to exist.",
          "Lombok's @Builder generates the builder above; use it unless you need custom validation in build().",
        ],
        links: [
          { label: "Site: LLD design patterns worked through", href: "/lld" },
          {
            label: "Refactoring Guru — design patterns in Java",
            href: "https://refactoring.guru/design-patterns/java",
          },
          {
            label: "YouTube search — design patterns in Java Spring",
            href: YT("design patterns java spring builder strategy factory tutorial"),
          },
        ],
      },
    ],
    related: ["/java/spring-framework", "/lld/solid", "/lld/strategy"],
    furtherReading: [
      { label: "Refactoring Guru", href: "https://refactoring.guru/design-patterns/java" },
    ],
  },

  {
    slug: "security",
    title: "Java & Spring Security",
    subtitle: "Chapter 16 — authentication, authorisation, JWT, and the OWASP issues that hit Java",
    level: "advanced",
    minutes: 26,
    tags: ["security", "spring security", "jwt", "oauth", "owasp"],
    summary:
      "Security in a Spring application is mostly configuration plus discipline: never build SQL or paths from user input, hash passwords properly, and let the framework do authentication rather than inventing it. The Java-specific hazards worth knowing are deserialization, path traversal and the dependency supply chain.",
    keyPoints: [
      "Never concatenate user input into SQL, file paths or commands.",
      "Hash passwords with BCrypt or Argon2 — never MD5, SHA-256 or anything fast.",
      "Validate JWTs fully: signature, issuer, audience and expiry.",
      "Most Java CVEs arrive through dependencies, not your code.",
    ],
    prerequisites: ["/java/web-development"],
    sections: [
      {
        heading: "Spring Security configuration",
        code: {
          title: "Example — a modern filter chain",
          lang: "java",
          source: `@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/v1/public/**").permitAll()
                .requestMatchers("/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())          // DENY BY DEFAULT — the key line
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            // Stateless JWT APIs have no session for CSRF to protect, so disabling
            // it is correct HERE. For a cookie-session app, disabling CSRF is a
            // serious vulnerability — the distinction matters.
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(h -> h.frameOptions(f -> f.deny()))
            .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);   // deliberately SLOW — that is the point
    }
}

// Method-level authorisation, evaluated against the authenticated principal:
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
public User getUser(@P("userId") String userId) { ... }`,
        },
        bullets: [
          "anyRequest().authenticated() is deny-by-default. An allow-list of protected paths inevitably misses one.",
          "Password hashing must be slow: BCrypt or Argon2, never a general-purpose fast hash. Speed is the attacker's advantage.",
          "Disabling CSRF is correct for a stateless token API and dangerous for a cookie-session app. Know which one you are building.",
        ],
        links: [
          {
            label: "Spring Security — reference documentation",
            href: "https://docs.spring.io/spring-security/reference/",
          },
          {
            label: "YouTube search — Spring Security JWT tutorial",
            href: YT("spring security jwt oauth2 resource server tutorial"),
          },
        ],
      },
      {
        heading: "The Java-specific hazards",
        table: {
          caption: "OWASP issues with a particular Java flavour.",
          headers: ["Risk", "Java form", "Defence"],
          rows: [
            [
              "Injection",
              "String-concatenated SQL / JPQL",
              "PreparedStatement, parameterised queries",
            ],
            [
              "Deserialization",
              "ObjectInputStream on untrusted bytes",
              "Do not — use JSON with an explicit type",
            ],
            [
              "Path traversal",
              "new File(base, userInput)",
              "Normalise, then verify it stays under base",
            ],
            ["XXE", "XML parsers with external entities on", "Disable DTDs on every parser"],
            [
              "Vulnerable dependencies",
              "Transitive CVEs (Log4Shell)",
              "OWASP Dependency-Check, Dependabot",
            ],
            [
              "Secrets in config",
              "Passwords in application.yml",
              "Environment or a secret manager",
            ],
          ],
        },
        code: {
          title: "Example — path traversal, the one people write by accident",
          lang: "java",
          source: `// VULNERABLE — "../../etc/passwd" escapes the intended directory.
Path file = Path.of("/var/app/uploads", userSuppliedName);
return Files.readAllBytes(file);

// SAFE — resolve, normalise, then VERIFY containment. Normalising alone is
// not enough; you must check the result is still inside the base.
Path base = Path.of("/var/app/uploads").toAbsolutePath().normalize();
Path target = base.resolve(userSuppliedName).normalize();
if (!target.startsWith(base)) {
    throw new SecurityException("path traversal attempt");
}
return Files.readAllBytes(target);

// XXE — disable external entities on EVERY parser you create
DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);`,
        },
        bullets: [
          "Log4Shell is the canonical reminder that your dependency tree is your attack surface — scan it in CI, not annually.",
          "Never log secrets, tokens or full request bodies. Logs are copied to systems with broader access than the application.",
          "Keep the actuator endpoints locked down; /actuator/env and /actuator/heapdump leak configuration and memory contents.",
        ],
        links: [
          { label: "OWASP Top 10", href: "https://owasp.org/www-project-top-ten/" },
          {
            label: "OWASP — Java security cheat sheets",
            href: "https://cheatsheetseries.owasp.org/",
          },
        ],
      },
    ],
    related: ["/java/spring-framework", "/java/jdbc", "/examples/auth-system"],
    furtherReading: [
      {
        label: "Spring Security reference",
        href: "https://docs.spring.io/spring-security/reference/",
      },
    ],
  },
];
