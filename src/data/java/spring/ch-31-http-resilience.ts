import type { Concept } from "@/data/types";

export const springHttpResilience: Concept = {
  slug: "spring-http-resilience",
  title: "HTTP Clients & Resilience4j",
  subtitle:
    "Chapter 31 — RestClient and HTTP interfaces, timeouts on every call, circuit breakers, retries without storms, and bulkheads",
  level: "advanced",
  minutes: 28,
  tags: ["restclient", "http interface", "resilience4j", "circuit breaker", "retry", "timeouts"],
  summary:
    "Every remote call can be slow, fail, or succeed after you stopped waiting. A resilient Spring Boot client sets connect and read timeouts, limits how many calls wait on one dependency, stops calling a dependency that is clearly down, and retries only what is safe to repeat — with backoff, jitter and a bound. Resilience4j provides each of these as configuration; the judgement is in the numbers and the order.",
  keyPoints: [
    "RestClient (synchronous) and HTTP interface clients are the modern defaults; RestTemplate is in maintenance.",
    "A client without a read timeout turns a hung dependency into exhausted request threads.",
    "Circuit breakers fail fast while a dependency recovers; configure slow-call thresholds, not just failures.",
    "Retry only idempotent operations, with exponential backoff and jitter, at one layer only.",
    "Resilience4j applies Retry outermost and Bulkhead innermost by default — know the order before tuning.",
  ],
  prerequisites: ["/java/networking", "/java/spring-threads", "/hld/circuit-breaker"],
  sections: [
    {
      heading: "Choosing a client, and configuring it properly",
      lede: "Build clients from Spring Boot's builders so they are instrumented.",
      table: {
        headers: ["Client", "Style", "Use when"],
        rows: [
          [
            "RestClient",
            "Synchronous, fluent (Spring 6.1+)",
            "Default for MVC services, including on virtual threads",
          ],
          [
            "HTTP interface (@HttpExchange)",
            "Declarative Java interface backed by RestClient or WebClient",
            "A partner API used from many places",
          ],
          ["WebClient", "Reactive (Mono/Flux)", "WebFlux services and streaming responses"],
          [
            "RestTemplate",
            "Synchronous, template methods",
            "Existing code only — in maintenance mode",
          ],
        ],
      },
      code: {
        title: "Example — a rates client with explicit timeouts, as an HTTP interface",
        lang: "java",
        source: `@HttpExchange("/v1/rates")
public interface RatesApi {
    @GetExchange("/{currency}")
    Rate get(@PathVariable String currency);
}

@Configuration
class RatesClientConfig {

    @Bean
    RatesApi ratesApi(RestClient.Builder builder,          // Boot's builder: metrics + tracing
                      @Value("\${rates.base-url}") String baseUrl) {
        HttpClient jdk = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(500))           // TCP/TLS handshake
            .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(jdk);
        factory.setReadTimeout(Duration.ofSeconds(2));        // waiting for the response

        RestClient client = builder
            .baseUrl(baseUrl)
            .requestFactory(factory)
            .defaultStatusHandler(HttpStatusCode::is5xxServerError, (req, res) -> {
                throw new RatesUnavailableException(res.getStatusCode());
            })
            .build();

        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(client))
            .build()
            .createClient(RatesApi.class);
    }
}

// Calling RestClient.create() yourself skips Boot's customizers: no http.client
// metrics, no trace propagation. Inject RestClient.Builder instead.`,
      },
      math: [
        {
          label: "Timeout budget for one user request",
          expr: "client-facing SLO",
          result: "3 s",
        },
        {
          label: "Minus our own work",
          expr: "3 s − 0.5 s",
          result: "2.5 s for dependencies",
        },
        {
          label: "Two sequential calls, one retry each",
          expr: "2.5 s ÷ (2 calls × 2 attempts)",
          result: "≈ 600 ms per attempt",
          note: "Timeouts are derived from the caller's deadline, not copied from library defaults.",
        },
      ],
    },
    {
      heading: "Circuit breaker, bulkhead and retry with Resilience4j",
      lede: "Three different questions: should I call, how many may wait, should I try again.",
      code: [
        {
          title: "Example — configuration",
          lang: "yaml",
          source: `resilience4j:
  circuitbreaker:
    instances:
      rates:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 50              # judge the last 50 calls
        minimum-number-of-calls: 20          # don't open on 2 failures out of 3
        failure-rate-threshold: 50           # % failed → OPEN
        slow-call-duration-threshold: 1s
        slow-call-rate-threshold: 60         # % slower than 1 s → OPEN (slow is the common failure)
        wait-duration-in-open-state: 20s     # then HALF_OPEN
        permitted-number-of-calls-in-half-open-state: 5
        ignore-exceptions:
          - com.acme.rates.UnknownCurrencyException   # a 4xx is not the dependency failing
  bulkhead:
    instances:
      rates:
        max-concurrent-calls: 20             # at most 20 threads waiting on rates
        max-wait-duration: 0                 # reject immediately when full
  retry:
    instances:
      rates:
        max-attempts: 3                      # 1 call + 2 retries
        wait-duration: 200ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        enable-randomized-wait: true         # jitter, so clients don't retry in lockstep
        retry-exceptions:
          - java.io.IOException
          - com.acme.rates.RatesUnavailableException
        ignore-exceptions:
          - io.github.resilience4j.circuitbreaker.CallNotPermittedException`,
        },
        {
          title: "Example — applying it, with a degraded fallback",
          lang: "java",
          source: `@Service
class PricingService {
    private final RatesApi rates;
    private final RateSnapshotRepository snapshots;

    PricingService(RatesApi rates, RateSnapshotRepository snapshots) {
        this.rates = rates;
        this.snapshots = snapshots;
    }

    // Default aspect order: Retry( CircuitBreaker( RateLimiter( TimeLimiter( Bulkhead( call ) ) ) ) )
    @Retry(name = "rates")
    @CircuitBreaker(name = "rates", fallbackMethod = "lastKnownRate")
    @Bulkhead(name = "rates")
    public Rate rate(String currency) {
        return rates.get(currency);
    }

    // Same parameters plus the exception. Serve a clearly-marked stale value
    // rather than failing checkout when rates are down.
    private Rate lastKnownRate(String currency, Throwable cause) {
        return snapshots.latest(currency)
            .map(Rate::stale)
            .orElseThrow(() -> new RatesUnavailableException(cause));
    }
}
// Resilience4j annotations are AOP: the chapter 23 rules (self-invocation,
// public methods, Spring beans) apply to every one of them.`,
        },
      ],
      diagram: {
        kind: "flow",
        caption: "Circuit breaker states.",
        rows: [
          [
            { id: "closed", label: "CLOSED", sub: "calls flow; outcomes recorded", tone: "ok" },
            { id: "open", label: "OPEN", sub: "calls rejected immediately", tone: "bad" },
            { id: "half", label: "HALF_OPEN", sub: "5 trial calls", tone: "warn" },
          ],
        ],
      },
      bullets: [
        "Expose the breaker's state in metrics and health (resilience4j.circuitbreaker.instances.rates.register-health-indicator: true) — but do not let an OPEN breaker fail your readiness probe, or one dependency outage removes every pod.",
        "A fallback must be genuinely safe. Returning an empty list for “user's permissions” or a zero price is worse than an error.",
      ],
      links: [
        { label: "Lab: circuit breaker", href: "/playgrounds/circuit-breaker" },
        {
          label: "Resilience4j — Spring Boot 3 getting started",
          href: "https://resilience4j.readme.io/docs/getting-started-3",
        },
      ],
    },
    {
      heading: "Retries without retry storms",
      lede: "The retry that turns a brownout into an outage.",
      math: [
        {
          label: "Layers that retry",
          expr: "gateway → orders → pricing → rates",
          result: "3 client layers",
        },
        { label: "Attempts per layer", expr: "max-attempts", result: "3" },
        {
          label: "Calls reaching rates for one user click",
          expr: "3 × 3 × 3",
          result: "27",
          note: "Exactly when rates is struggling, it receives 27 times the load.",
        },
        { label: "Retry at one layer only", expr: "1 × 1 × 3", result: "3" },
      ],
      bullets: [
        "Retry only idempotent operations: GET, PUT and DELETE by design, and POST only with an idempotency key the server honours. A retried payment without a key charges twice.",
        "Retry transient failures — connection resets, 502, 503, 504, 429 with Retry-After. Never retry 400, 401, 403, 404 or 422: the same request will fail the same way.",
        "Choose one layer to retry, usually the one closest to the failing dependency, and have outer layers fail fast.",
        "Keep a retry budget: when retries exceed a small fraction of traffic (say 10%), stop retrying. Resilience4j's circuit breaker around the retry gives a similar effect.",
      ],
      callout: {
        kind: "interview",
        title: "Timeouts, retries and breakers compose",
        text: "A good answer names all three with numbers: a read timeout below the caller's deadline, at most one or two retries with jittered backoff for idempotent calls, a bulkhead so one dependency cannot take every thread, and a circuit breaker that opens on slow calls as well as errors — plus a safe fallback or a clear error.",
      },
      links: [
        { label: "Site: idempotency", href: "/hld/idempotency" },
        { label: "Site: bulkheads and load shedding", href: "/hld/bulkheads-load-shedding" },
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What timeouts do you set on an HTTP client, and how do you choose the values?",
          a: "A connect timeout for establishing the connection and a read (response) timeout for waiting on data, both derived from the caller's own deadline minus local work and any retries. Library defaults are often infinite or far too long.",
        },
        {
          q: "How does a circuit breaker decide to open, and what happens in half-open?",
          a: "It records outcomes over a sliding window and opens when the failure rate or slow-call rate exceeds its threshold, after a minimum number of calls. While open, calls are rejected immediately. After the wait duration it lets a few trial calls through in half-open; if they succeed it closes, otherwise it opens again.",
        },
        {
          q: "Why can retries make an outage worse?",
          a: "Retries multiply load at the moment a dependency is overloaded, and retries at several layers multiply with each other. Limit retries to idempotent operations and transient errors, use exponential backoff with jitter, retry at a single layer, and cap retries with a budget or circuit breaker.",
        },
        {
          q: "What is a bulkhead and why add one if you already have a circuit breaker?",
          a: "A bulkhead caps the number of concurrent calls to a dependency so its slowness cannot consume all request threads. A circuit breaker needs a window of failures before it opens; the bulkhead protects the service during that window and during slow-but-not-failing periods.",
        },
      ],
      takeaways: [
        "Every call has a timeout derived from the caller's deadline.",
        "Bulkhead to protect threads, circuit breaker to fail fast, retry sparingly and safely.",
        "Build clients from Boot's builders so failures are visible in metrics and traces.",
      ],
    },
  ],
  playground: "circuit-breaker",
  related: [
    "/hld/circuit-breaker",
    "/hld/bulkheads-load-shedding",
    "/java/spring-threads",
    "/java/networking",
    "/hld/idempotency",
  ],
  furtherReading: [
    {
      label: "Spring Framework — REST clients",
      href: "https://docs.spring.io/spring-framework/reference/integration/rest-clients.html",
    },
    {
      label: "Resilience4j — documentation",
      href: "https://resilience4j.readme.io/docs",
    },
    {
      label: "AWS Builders' Library — timeouts, retries and backoff with jitter",
      href: "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
    },
  ],
};
