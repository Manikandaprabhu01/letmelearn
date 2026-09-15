import type { Concept } from "@/data/types";

export const springMvcInternals: Concept = {
  slug: "spring-mvc-internals",
  title: "Spring MVC Internals, Validation & Errors",
  subtitle:
    "Chapter 26 — DispatcherServlet step by step, filters versus interceptors, argument resolvers, validation, and ProblemDetail responses",
  level: "advanced",
  minutes: 28,
  tags: [
    "spring mvc",
    "dispatcherservlet",
    "filters",
    "interceptors",
    "validation",
    "problemdetail",
  ],
  summary:
    "Between Tomcat and your controller method sit a filter chain, a handler mapping, interceptors, argument resolvers, message converters and exception resolvers — each a documented extension point. Knowing which one sees what lets you put cross-cutting code in the right layer, return validation errors clients can act on, and render every failure as a consistent RFC 9457 problem response.",
  keyPoints: [
    "Filters see every request before Spring picks a handler; interceptors know which controller method was chosen.",
    "postHandle cannot change a @ResponseBody response — it has already been written. Use ResponseBodyAdvice.",
    "@Valid on a request body raises MethodArgumentNotValidException; constraints on parameters raise HandlerMethodValidationException.",
    "Render errors as ProblemDetail with a stable type URI, and never leak exception messages or stack traces.",
    "Spring Boot's Jackson ignores unknown JSON properties — a misspelled field is silently dropped.",
  ],
  prerequisites: ["/java/web-development", "/java/spring-aop"],
  sections: [
    {
      heading: "The dispatch path, in detail",
      lede: "What happens to one request inside DispatcherServlet.doDispatch().",
      steps: [
        {
          title: "Servlet filters",
          text: "Run in order before Spring MVC: encoding, Spring Security's FilterChainProxy, CORS, your correlation-id filter. A filter can reject the request without any controller being involved.",
        },
        {
          title: "Handler mapping",
          text: "RequestMappingHandlerMapping matches path, HTTP method, headers and consumes/produces to one @RequestMapping method and wraps it with the matching interceptors.",
          detail:
            "No match → 404 (NoResourceFoundException in Spring 6.1+). Method mismatch → 405.",
        },
        {
          title: "Interceptor preHandle",
          text: "Knows the chosen HandlerMethod, so it can read annotations on it. Returning false stops processing.",
        },
        {
          title: "Argument resolution",
          text: "HandlerMethodArgumentResolvers fill each parameter: @PathVariable, @RequestParam, @RequestHeader, and @RequestBody via an HttpMessageConverter such as Jackson. @Valid runs here.",
        },
        {
          title: "Invoke the controller",
          text: "Your method runs — through its AOP proxy if it has one.",
        },
        {
          title: "Return value handling",
          text: "For @ResponseBody, content negotiation picks a converter from the Accept header and the body is written. ResponseBodyAdvice can modify the body just before.",
        },
        {
          title: "Exception resolution",
          text: "If anything above threw, HandlerExceptionResolvers run in order: @ExceptionHandler methods (local, then @ControllerAdvice), @ResponseStatus exceptions, then Spring's defaults.",
        },
        {
          title: "Interceptor afterCompletion",
          text: "Always called for interceptors whose preHandle returned true, with the exception if there was one — the place to clean up request-scoped state.",
        },
      ],
      table: {
        caption: "Where cross-cutting code belongs.",
        headers: ["Layer", "Sees", "Use it for"],
        rows: [
          [
            "Servlet filter",
            "Every request, including 404s and static files; no handler",
            "Security, CORS, correlation ids, request logging",
          ],
          [
            "HandlerInterceptor",
            "The selected controller method and its annotations",
            "Handler-aware checks such as tenant or feature gates",
          ],
          [
            "HandlerMethodArgumentResolver",
            "One parameter being resolved",
            "Injecting request-derived objects, e.g. the current tenant",
          ],
          [
            "@ControllerAdvice",
            "Exceptions and bodies from controllers",
            "Error mapping, response wrapping",
          ],
          [
            "AOP on services",
            "Business method calls, from any caller",
            "Transactions, caching, auditing — not HTTP concerns",
          ],
        ],
      },
      links: [
        {
          label: "Spring Framework — DispatcherServlet",
          href: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html",
        },
      ],
    },
    {
      heading: "A filter, an interceptor and an argument resolver",
      lede: "One of each, in the layer where it belongs.",
      code: {
        title: "Example — correlation ids, tenant checks and @CurrentTenant",
        lang: "java",
        source: `// FILTER — every request gets a correlation id in the logs and the response.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String id = Optional.ofNullable(req.getHeader("X-Request-Id"))
                            .filter(v -> v.length() <= 64)
                            .orElseGet(() -> UUID.randomUUID().toString());
        MDC.put("requestId", id);
        res.setHeader("X-Request-Id", id);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove("requestId");      // threads are pooled: always clean up
        }
    }
}

// INTERCEPTOR — only for handlers annotated @TenantScoped.
@Component
class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if (handler instanceof HandlerMethod method
                && method.hasMethodAnnotation(TenantScoped.class)
                && req.getHeader("X-Tenant-Id") == null) {
            throw new MissingTenantException();   // becomes a 400 via @ControllerAdvice
        }
        return true;
    }
}

// ARGUMENT RESOLVER — controllers declare what they need instead of parsing headers.
@Component
class CurrentTenantResolver implements HandlerMethodArgumentResolver {
    private final TenantDirectory tenants;
    CurrentTenantResolver(TenantDirectory tenants) { this.tenants = tenants; }

    @Override public boolean supportsParameter(MethodParameter p) {
        return p.hasParameterAnnotation(CurrentTenant.class) && p.getParameterType() == Tenant.class;
    }
    @Override public Object resolveArgument(MethodParameter p, ModelAndViewContainer mav,
                                            NativeWebRequest req, WebDataBinderFactory binders) {
        return tenants.require(req.getHeader("X-Tenant-Id"));
    }
}

@Configuration
class WebConfig implements WebMvcConfigurer {
    private final TenantInterceptor tenantInterceptor;
    private final CurrentTenantResolver tenantResolver;
    WebConfig(TenantInterceptor i, CurrentTenantResolver r) { tenantInterceptor = i; tenantResolver = r; }

    @Override public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor).addPathPatterns("/v1/**");
    }
    @Override public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(tenantResolver);
    }
}

@GetMapping("/v1/invoices")
@TenantScoped
List<InvoiceResponse> list(@CurrentTenant Tenant tenant) { ... }`,
      },
      callout: {
        kind: "warn",
        title: "A filter declared as @Component is registered twice with Spring Security",
        text: "Spring Boot registers every Filter bean with the servlet container. If you also add the same filter inside a SecurityFilterChain with addFilterBefore, it runs twice per request. Either keep it out of the security chain, or register a FilterRegistrationBean with setEnabled(false) so only the security chain runs it.",
      },
    },
    {
      heading: "Validation that returns useful errors",
      lede: "Reject bad input at the edge, and tell the client exactly which field is wrong.",
      code: {
        title: "Example — body, parameter and cross-field validation",
        lang: "java",
        source: `public record CreateTransferRequest(
        @NotNull @Positive Long fromAccount,
        @NotNull @Positive Long toAccount,
        @NotNull @DecimalMin("0.01") @Digits(integer = 12, fraction = 2) BigDecimal amount,
        @NotBlank @ValidCurrency String currency) {

    // Class-level rule: evaluated by Bean Validation like any other constraint.
    @AssertTrue(message = "fromAccount and toAccount must differ")
    boolean isDistinctAccounts() {
        return fromAccount == null || !fromAccount.equals(toAccount);
    }
}

@RestController
@RequestMapping("/v1/transfers")
class TransferController {

    @PostMapping
    ResponseEntity<TransferResponse> create(@Valid @RequestBody CreateTransferRequest req) { ... }
    // invalid body → MethodArgumentNotValidException → 400

    @GetMapping("/{id}")
    TransferResponse get(@PathVariable @Positive long id) { ... }
    // Spring 6.1+: constraints on parameters are validated by the controller
    // itself → HandlerMethodValidationException → 400
}

// A custom constraint is an annotation plus a validator:
@Target({FIELD, PARAMETER}) @Retention(RUNTIME)
@Constraint(validatedBy = CurrencyValidator.class)
public @interface ValidCurrency {
    String message() default "must be an ISO 4217 currency code";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

class CurrencyValidator implements ConstraintValidator<ValidCurrency, String> {
    private static final Set<String> CODES = Currency.getAvailableCurrencies().stream()
        .map(Currency::getCurrencyCode).collect(Collectors.toUnmodifiableSet());
    @Override public boolean isValid(String value, ConstraintValidatorContext ctx) {
        return value == null || CODES.contains(value);    // null handled by @NotBlank
    }
}`,
      },
      bullets: [
        "Validation proves the request is well-formed; it does not prove the operation is allowed. “Account has sufficient funds” is a business rule checked in the service, not a constraint.",
        "Validate at the boundary once. Re-validating the same object in every layer adds cost and still misses rules that need the database.",
      ],
    },
    {
      heading: "Errors as ProblemDetail (RFC 9457)",
      lede: "One error shape for every failure, machine-readable and safe.",
      code: {
        title: "Example — a global handler built on Spring's defaults",
        lang: "java",
        source: `// application.yml — Spring's own exceptions (404, 405, 415, validation) are
// rendered as application/problem+json:
//   spring.mvc.problemdetails.enabled: true

@RestControllerAdvice
class ApiErrors extends ResponseEntityExceptionHandler {

    // Improve Spring's default for body validation: list the field errors.
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = ex.getBody();
        problem.setType(URI.create("https://errors.acme.com/validation"));
        problem.setProperty("errors", ex.getFieldErrors().stream()
            .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
            .toList());
        return ResponseEntity.status(status).headers(headers).body(problem);
    }

    // Domain exceptions get a stable type URI clients can switch on.
    @ExceptionHandler(InsufficientFundsException.class)
    ProblemDetail insufficientFunds(InsufficientFundsException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNPROCESSABLE_ENTITY, "The source account cannot cover this transfer.");
        problem.setType(URI.create("https://errors.acme.com/insufficient-funds"));
        problem.setProperty("accountId", ex.accountId());
        return problem;
    }

    // Everything unexpected: log with the correlation id, reveal nothing.
    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception ex) {
        log.error("unhandled", ex);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
            "Something went wrong. Quote request id " + MDC.get("requestId") + ".");
    }
}

// Response:
// HTTP/1.1 422
// Content-Type: application/problem+json
// { "type": "https://errors.acme.com/insufficient-funds",
//   "title": "Unprocessable Entity", "status": 422,
//   "detail": "The source account cannot cover this transfer.",
//   "instance": "/v1/transfers", "accountId": 42 }`,
      },
      bullets: [
        "Clients should branch on type, not on detail text — the text is for humans and will be reworded.",
        "Never put ex.getMessage() from infrastructure exceptions in a response: SQL, hostnames and class names are reconnaissance for an attacker. Spring Boot's server.error.include-message and include-stacktrace default to never for the same reason.",
        "Map each exception once, globally. Try/catch blocks that build error responses inside controllers drift apart within months.",
      ],
      links: [
        {
          label: "Spring Framework — error responses (ProblemDetail)",
          href: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html",
        },
        {
          label: "RFC 9457 — Problem Details for HTTP APIs",
          href: "https://www.rfc-editor.org/rfc/rfc9457",
        },
      ],
    },
    {
      heading: "Jackson defaults that bite",
      bullets: [
        "Spring Boot disables FAIL_ON_UNKNOWN_PROPERTIES, so a client sending “ammount” gets a 400 for the missing amount if it is @NotNull — or silently no change at all on a PATCH. For strict public APIs, enable it: spring.jackson.deserialization.fail-on-unknown-properties=true.",
        "Dates are written as ISO-8601 strings because Boot disables WRITE_DATES_AS_TIMESTAMPS. Use Instant or OffsetDateTime in APIs; LocalDateTime has no zone and invites off-by-hours bugs.",
        "Serialise BigDecimal money as a string, or JavaScript clients will round it through doubles.",
        "Customise the ObjectMapper with a Jackson2ObjectMapperBuilderCustomizer bean. Declaring your own ObjectMapper bean replaces Boot's configuration entirely, including the module registrations.",
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the difference between a filter and an interceptor in Spring MVC?",
          a: "A filter is a servlet component that runs for every request before DispatcherServlet and knows nothing about handlers. An interceptor runs inside Spring MVC after a handler has been chosen, so it can inspect the controller method and its annotations, and it gets preHandle, postHandle and afterCompletion callbacks.",
        },
        {
          q: "Why can't you modify a JSON response in postHandle?",
          a: "For @ResponseBody methods the return value is converted and written to the response before postHandle runs, so the body is already committed. Use a ResponseBodyAdvice to change the body before it is written.",
        },
        {
          q: "How do you return consistent error responses across an API?",
          a: "Enable ProblemDetail rendering, extend ResponseEntityExceptionHandler in a @RestControllerAdvice, map each domain exception to a ProblemDetail with a stable type URI and safe detail, add field errors for validation failures, and log unexpected exceptions with a correlation id while returning a generic message.",
        },
        {
          q: "Where should “the account must have enough balance” be checked — Bean Validation or the service?",
          a: "The service. Bean Validation checks that the request is well-formed without external state. A balance check depends on the database and on concurrent changes, so it belongs in the transactional business logic.",
        },
      ],
      takeaways: [
        "Put cross-cutting HTTP code in the layer that has the information it needs.",
        "Validate shape at the edge; enforce business rules in the service.",
        "Every error is a ProblemDetail with a stable type and nothing internal in it.",
      ],
    },
  ],
  related: [
    "/java/web-development",
    "/java/spring-security-internals",
    "/java/exception-handling",
    "/hld/api-contracts-versioning",
    "/hld/rest-vs-graphql",
  ],
  furtherReading: [
    {
      label: "Spring Framework — Spring Web MVC",
      href: "https://docs.spring.io/spring-framework/reference/web/webmvc.html",
    },
    {
      label: "Spring Framework — validation",
      href: "https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html",
    },
    {
      label: "RFC 9457 — Problem Details for HTTP APIs",
      href: "https://www.rfc-editor.org/rfc/rfc9457",
    },
  ],
};
