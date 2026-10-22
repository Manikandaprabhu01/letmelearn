import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaWeb: Concept[] = [
  {
    slug: "web-development",
    title: "Web Development",
    subtitle: "Chapter 13 — servlets, the request lifecycle, REST and what Spring MVC hides",
    level: "intermediate",
    minutes: 22,
    tags: ["servlet", "http", "rest", "spring mvc"],
    summary:
      "Spring MVC is a very thin layer over the Servlet API, and knowing what sits underneath is what lets you debug a filter ordering problem or a threading surprise. This chapter is the request lifecycle — from socket to controller method and back — plus REST design that a customer's integration team can actually consume.",
    keyPoints: [
      "A servlet container hands each request to a thread; your controller runs on it.",
      "Filters wrap every request and are where cross-cutting concerns live.",
      "DispatcherServlet is the front controller Spring MVC is built around.",
      "Design the API contract before the implementation — the contract outlives the code.",
    ],
    prerequisites: ["/java/oop", "/java/exception-handling"],
    sections: [
      {
        heading: "The request lifecycle",
        diagram: {
          kind: "flow",
          caption: "Everything Spring MVC does sits between the container and your method.",
          rows: [
            [
              { id: "c", label: "Client" },
              { id: "tc", label: "Servlet container", sub: "Tomcat — thread per request" },
              { id: "f", label: "Filter chain", sub: "auth, CORS, logging", tone: "accent" },
            ],
            [
              { id: "ds", label: "DispatcherServlet", sub: "front controller" },
              { id: "hm", label: "Handler mapping", sub: "URL → method" },
              { id: "ctl", label: "@RestController", sub: "your code", tone: "ok" },
            ],
            [
              { id: "conv", label: "Message converter", sub: "object → JSON" },
              { id: "adv", label: "@ControllerAdvice", sub: "exception mapping" },
              { id: "resp", label: "Response", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "Filters run before Spring's dispatcher and see every request including static resources — the right place for security, CORS and correlation ids.",
          "Interceptors run inside Spring and know which handler was selected — better for anything handler-aware.",
          "Each request occupies a container thread for its entire duration, which is why a slow downstream call without a timeout consumes the pool (see chapter 5).",
        ],
        links: [
          {
            label: "Baeldung — Spring MVC tutorial",
            href: "https://www.baeldung.com/spring-mvc-tutorial",
          },
          {
            label: "YouTube search — Spring MVC DispatcherServlet request lifecycle",
            href: YT("spring mvc dispatcherservlet request lifecycle explained"),
          },
        ],
      },
      {
        heading: "REST endpoints that survive integration",
        code: {
          title: "Example — validation, status codes and pagination done properly",
          lang: "java",
          source: `@RestController
@RequestMapping("/v1/orders")            // version from day one — you WILL change shape
public class OrderController {

    private final OrderService service;
    OrderController(OrderService service) { this.service = service; }  // constructor injection

    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @Valid @RequestBody CreateOrderRequest body,        // @Valid → 400 on bad input
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {

        Order order = service.create(body.toCommand(), key);
        return ResponseEntity
            .created(URI.create("/v1/orders/" + order.id()))    // 201 + Location
            .body(OrderResponse.from(order));
    }

    @GetMapping
    public Page<OrderResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") @Max(100) int size,   // CAP the page size
            @RequestParam(required = false) Status status) {
        return service.find(status, PageRequest.of(page, size)).map(OrderResponse::from);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable String id) {
        return service.findById(id)
            .map(OrderResponse::from)
            .orElseThrow(() -> new OrderNotFoundException(id));   // → 404 via advice
    }
}

record CreateOrderRequest(
    @NotBlank String customerId,
    @NotEmpty List<@Valid LineItem> items,
    @DecimalMin("0.01") BigDecimal total
) { }`,
        },
        bullets: [
          "Cap the page size. An uncapped size parameter is a denial-of-service vector — someone will request a million rows.",
          "Never expose entities directly; map to a response record. An entity leaks your schema and changes break clients.",
          "Use constructor injection rather than @Autowired on fields — it makes dependencies explicit and the class testable without Spring.",
          "Return 201 with a Location header on creation. Integration teams expect it and some clients depend on it.",
        ],
        links: [
          {
            label: "Baeldung — REST with Spring",
            href: "https://www.baeldung.com/rest-with-spring-series",
          },
          { label: "Site: API gateway patterns", href: "/hld/api-gateway" },
        ],
      },
    ],
    related: ["/java/spring-framework", "/java/security"],
    furtherReading: [
      { label: "Baeldung — Spring MVC", href: "https://www.baeldung.com/spring-mvc" },
    ],
  },

  {
    slug: "java-8",
    title: "Java 8 and Modern Java",
    subtitle: "Chapter 14 — lambdas, streams, Optional, and the features since 8 worth using",
    level: "foundational",
    minutes: 24,
    tags: ["java 8", "lambdas", "streams", "optional", "records"],
    summary:
      "Java 8 changed how the language reads, and everything since has continued in that direction. Streams and Optional are the two that most change day-to-day code — and both are misused in characteristic ways that this chapter aims to prevent.",
    keyPoints: [
      "Streams describe what, not how — and they are lazy until a terminal operation.",
      "Optional is a return type, not a field type and not a parameter type.",
      "Never call Optional.get() without checking; that is just a null pointer with extra steps.",
      "Records, var, switch expressions and text blocks are the modern additions worth adopting.",
    ],
    prerequisites: ["/java/collections"],
    sections: [
      {
        heading: "Streams",
        code: {
          title: "Example — the same task, and where streams stop helping",
          lang: "java",
          source: `// Imperative
List<String> result = new ArrayList<>();
for (Order o : orders) {
    if (o.total().compareTo(THRESHOLD) > 0) result.add(o.customerEmail());
}
Collections.sort(result);

// Stream — reads as a description of the outcome
List<String> result = orders.stream()
    .filter(o -> o.total().compareTo(THRESHOLD) > 0)
    .map(Order::customerEmail)
    .sorted()
    .toList();                               // Java 16+; before that .collect(toList())

// Grouping is where streams genuinely win
Map<Status, List<Order>> byStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::status));

Map<Status, BigDecimal> revenueByStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::status,
             Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add)));

// LAZY: nothing runs until the terminal operation. This does nothing at all:
orders.stream().filter(o -> { log.info("checking"); return true; });   // no terminal op

// parallel() is NOT free. It uses the common ForkJoinPool, so a blocking call
// inside a parallel stream can starve every other parallel stream in the JVM.
// Use it for CPU-bound work on large collections, and measure rather than assume.`,
        },
        bullets: [
          "Do not force a stream where a loop is clearer. A stream with a side effect in forEach is usually a loop wearing a costume.",
          "Streams are single-use — consuming one twice throws IllegalStateException.",
          "Avoid parallel streams for anything I/O-bound; the common pool is shared JVM-wide and blocking it affects unrelated code.",
        ],
        links: [
          { label: "Baeldung — Java 8 Streams", href: "https://www.baeldung.com/java-8-streams" },
          {
            label: "YouTube search — Java streams tutorial collectors groupingBy",
            href: YT("java streams tutorial collectors groupingby explained"),
          },
        ],
      },
      {
        heading: "Optional, used correctly",
        code: {
          title: "Example — the misuses, and the intended shape",
          lang: "java",
          source: `// MISUSE 1 — get() without checking. This is a NullPointerException with
// extra ceremony, and it is the single most common Optional mistake.
Optional<User> u = repo.findById(id);
return u.get();                                   // throws if empty

// MISUSE 2 — Optional as a FIELD. It is not serialisable and adds a wrapper
// object per instance for no benefit.
class Order { private Optional<String> note; }     // no

// MISUSE 3 — Optional as a PARAMETER. Callers now must wrap; use an overload.
void process(Optional<Config> config) { }          // no

// INTENDED USE — a return type that says "this might legitimately be absent"
public Optional<User> findByEmail(String email) { ... }

// And consume it without ever calling get():
String name = repo.findByEmail(email)
    .map(User::displayName)
    .orElse("unknown");

repo.findByEmail(email)
    .ifPresentOrElse(this::sendWelcome,
                     () -> log.warn("no user for {}", email));

User user = repo.findByEmail(email)
    .orElseThrow(() -> new UserNotFoundException(email));   // → 404 at the boundary

// orElseGet vs orElse: orElse ALWAYS evaluates its argument, even on a hit.
return cache.find(key).orElseGet(() -> expensiveLoad(key));   // lazy — correct`,
        },
        bullets: [
          "orElse evaluates eagerly; orElseGet takes a supplier and only runs on absence. With an expensive fallback, the difference is real.",
          "Optional exists to make absence explicit in a method signature. Using it for fields and parameters defeats that purpose and adds noise.",
          "Spring Data repositories return Optional for single-result finders — lean into it rather than unwrapping immediately.",
        ],
        links: [
          { label: "Baeldung — Java Optional", href: "https://www.baeldung.com/java-optional" },
        ],
      },
      {
        heading: "What came after 8, and what to adopt",
        table: {
          caption: "The modern features that change everyday code.",
          headers: ["Feature", "Version", "Why it matters"],
          rows: [
            ["var", "10", "Less noise for obvious types; do not use where the type is unclear"],
            ["Text blocks", "15", "Multi-line SQL and JSON without escaping"],
            ["Records", "16", "Immutable data carriers with correct equals/hashCode"],
            ["Sealed classes", "17", "A closed set of subtypes the compiler can check"],
            [
              "Pattern matching for switch",
              "21",
              "Replaces instanceof chains, exhaustively checked",
            ],
            ["Virtual threads", "21", "Cheap blocking I/O — see chapter 3"],
          ],
        },
        code: {
          title: "Example — sealed types plus pattern matching",
          lang: "java",
          source: `sealed interface PaymentResult
    permits Approved, Declined, PendingReview { }

record Approved(String authCode) implements PaymentResult { }
record Declined(String reason) implements PaymentResult { }
record PendingReview(Duration eta) implements PaymentResult { }

// The compiler knows the set is closed, so it verifies exhaustiveness. Add a
// fourth case later and every switch fails to COMPILE — which is exactly what
// you want, rather than a runtime surprise.
String describe(PaymentResult result) {
    return switch (result) {
        case Approved a      -> "approved: " + a.authCode();
        case Declined d      -> "declined: " + d.reason();
        case PendingReview p -> "pending, eta " + p.eta();
    };   // no default needed — and adding one would defeat the check
}`,
        },
        links: [
          {
            label: "Oracle — Java language updates",
            href: "https://docs.oracle.com/en/java/javase/21/language/java-language-changes.html",
          },
          {
            label: "YouTube search — modern Java records sealed pattern matching",
            href: YT("modern java records sealed classes pattern matching tutorial"),
          },
        ],
      },
    ],
    related: [
      "/java/java-8-features",
      "/java/streams-collectors",
      "/java/java-9-to-17",
      "/java/java-17-to-21",
    ],
    furtherReading: [
      {
        label: "Baeldung — Java 8 and beyond",
        href: "https://www.baeldung.com/java-8-new-features",
      },
    ],
  },
];
