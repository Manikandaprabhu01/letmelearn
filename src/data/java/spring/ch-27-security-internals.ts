import type { Concept } from "@/data/types";

export const springSecurityInternals: Concept = {
  slug: "spring-security-internals",
  title: "Spring Security Architecture & JWT",
  subtitle:
    "Chapter 27 — the filter chain, authentication objects, JWT resource servers, multiple chains, method security, and CSRF decisions",
  level: "advanced",
  minutes: 30,
  tags: ["spring security", "jwt", "oauth2", "filter chain", "method security", "csrf"],
  summary:
    "Spring Security is a chain of servlet filters in front of your application. One of them establishes who is calling and stores an Authentication in a thread-bound SecurityContext; another decides whether that caller may proceed; a third turns failures into 401 or 403. Once you can name the filters, configuring a JWT resource server, splitting actuator and API security, and debugging a mysterious 403 become routine.",
  keyPoints: [
    "DelegatingFilterProxy hands requests to FilterChainProxy, which runs the first SecurityFilterChain whose matcher fits.",
    "The SecurityContext is a ThreadLocal — authentication is not visible on @Async or executor threads unless you propagate it.",
    "401 means “we don't know who you are”; 403 means “we know, and the answer is no”. ExceptionTranslationFilter chooses.",
    "A JWT resource server validates signature, expiry and issuer by default — audience only if you configure it.",
    "Disable CSRF only for stateless bearer-token APIs; cookie-authenticated browsers need it.",
  ],
  prerequisites: ["/java/security", "/java/spring-mvc-internals"],
  sections: [
    {
      heading: "From servlet filter to SecurityFilterChain",
      lede: "One filter registered with Tomcat, a dozen behind it.",
      diagram: {
        kind: "flow",
        caption: "The request path through Spring Security (key filters only, in order).",
        rows: [
          [
            { id: "tom", label: "Tomcat" },
            { id: "dfp", label: "DelegatingFilterProxy", sub: "servlet filter bean bridge" },
            {
              id: "fcp",
              label: "FilterChainProxy",
              sub: "picks a SecurityFilterChain",
              tone: "accent",
            },
          ],
          [
            { id: "sch", label: "SecurityContextHolderFilter", sub: "load context" },
            { id: "cors", label: "CorsFilter" },
            { id: "csrf", label: "CsrfFilter" },
            {
              id: "auth",
              label: "BearerTokenAuthenticationFilter",
              sub: "or form / basic login",
              tone: "accent",
            },
          ],
          [
            {
              id: "anon",
              label: "AnonymousAuthenticationFilter",
              sub: "no credentials → anonymous",
            },
            { id: "etf", label: "ExceptionTranslationFilter", sub: "failures → 401 / 403" },
            {
              id: "az",
              label: "AuthorizationFilter",
              sub: "authorizeHttpRequests rules",
              tone: "ok",
            },
            { id: "app", label: "DispatcherServlet" },
          ],
        ],
      },
      code: {
        title: "Example — seeing the chain for a real request",
        lang: "yaml",
        source: `# application-local.yml — never in production, it logs security decisions
logging:
  level:
    org.springframework.security: TRACE

# Output for GET /v1/invoices:
#   Securing GET /v1/invoices
#   Invoking SecurityContextHolderFilter (3/12)
#   Invoking CorsFilter (5/12)
#   Invoking BearerTokenAuthenticationFilter (8/12)
#   Authenticated token: JwtAuthenticationToken [Principal=..., Granted Authorities=[SCOPE_invoices:read]]
#   Invoking AuthorizationFilter (12/12)
#   Denied: hasAuthority('SCOPE_invoices:write')   ← the rule that produced your 403`,
      },
      bullets: [
        "Security runs before DispatcherServlet, so a @ControllerAdvice never sees authentication or authorisation failures from the filter chain — customise them with an AuthenticationEntryPoint and AccessDeniedHandler.",
        "Rules in authorizeHttpRequests are evaluated top to bottom, first match wins. A broad permitAll above a specific rule silently opens it.",
      ],
      links: [
        {
          label: "Spring Security — servlet architecture",
          href: "https://docs.spring.io/spring-security/reference/servlet/architecture.html",
        },
      ],
    },
    {
      heading: "Authentication objects and the thread-bound context",
      lede: "Who is calling, where that is stored, and why it disappears on other threads.",
      diagram: {
        kind: "sequence",
        caption: "Authenticating a bearer token.",
        actors: [
          { id: "f", label: "BearerTokenAuthenticationFilter" },
          { id: "pm", label: "ProviderManager" },
          { id: "jp", label: "JwtAuthenticationProvider" },
          { id: "dec", label: "JwtDecoder", sub: "JWKs cached" },
          { id: "ctx", label: "SecurityContextHolder" },
        ],
        messages: [
          { from: "f", to: "pm", label: "authenticate(BearerTokenAuthenticationToken)" },
          { from: "pm", to: "jp", label: "supports? → authenticate" },
          { from: "jp", to: "dec", label: "decode(token)" },
          {
            from: "dec",
            to: "jp",
            label: "Jwt: signature, exp, iss valid",
            kind: "return",
            tone: "ok",
          },
          { from: "jp", to: "pm", label: "JwtAuthenticationToken + authorities", kind: "return" },
          { from: "pm", to: "f", label: "Authentication", kind: "return" },
          { from: "f", to: "ctx", label: "setContext(...) for this thread" },
        ],
      },
      code: {
        title: "Example — the principal in a controller, and on another thread",
        lang: "java",
        source: `@GetMapping("/v1/me")
MeResponse me(@AuthenticationPrincipal Jwt jwt) {          // resolved from the context
    return new MeResponse(jwt.getSubject(), jwt.getClaimAsString("email"));
}

// The SecurityContext lives in a ThreadLocal. On a different thread it is empty:
@Async
public void exportReport(long id) {
    SecurityContextHolder.getContext().getAuthentication();   // null by default
}

// Propagate it deliberately by wrapping the executor used for @Async:
@Bean
TaskDecorator securityContextPropagation() {
    return task -> {
        SecurityContext context = SecurityContextHolder.getContext();  // captured on the caller
        return () -> {
            SecurityContextHolder.setContext(context);
            try { task.run(); } finally { SecurityContextHolder.clearContext(); }
        };
    };
}
// Spring Boot applies a single TaskDecorator bean to its auto-configured task
// executor. Simpler still: pass the user id into the async method as an argument.`,
      },
      table: {
        caption: "Which failure becomes which status.",
        headers: ["Situation", "Exception", "Handled by", "Status"],
        rows: [
          [
            "No token, protected path",
            "AccessDeniedException for an anonymous user",
            "AuthenticationEntryPoint",
            "401",
          ],
          [
            "Invalid or expired token",
            "AuthenticationException",
            "AuthenticationEntryPoint",
            "401 + WWW-Authenticate",
          ],
          ["Valid token, missing authority", "AccessDeniedException", "AccessDeniedHandler", "403"],
        ],
      },
    },
    {
      heading: "A JWT resource server, configured properly",
      lede: "The defaults check three things; production needs a fourth.",
      code: {
        title: "Example — issuer, audience and role mapping",
        lang: "java",
        source: `// application.yml
//   spring.security.oauth2.resourceserver.jwt:
//     issuer-uri: https://auth.acme.com/realms/acme   # discovers the JWK set URL
//     audiences: order-service                        # reject tokens minted for other APIs
//
// Validated by default: signature (against keys from the JWK set, cached and
// re-fetched when an unknown key id appears), exp and nbf with 60 s clock skew,
// and iss matching issuer-uri. Without 'audiences', a token issued by the same
// identity provider for ANY other service is accepted here.

@Configuration
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/v1/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/v1/invoices/**").hasAuthority("SCOPE_invoices:read")
                .requestMatchers("/v1/invoices/**").hasAuthority("SCOPE_invoices:write")
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(jwt -> jwt.jwtAuthenticationConverter(rolesAndScopes())))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())            // bearer tokens only — see the CSRF section
            .build();
    }

    // By default only the 'scope'/'scp' claim becomes SCOPE_* authorities.
    // Many identity providers put roles in a custom claim; map both.
    private JwtAuthenticationConverter rolesAndScopes() {
        JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<GrantedAuthority> authorities = new ArrayList<>(scopes.convert(jwt));
            List<String> roles = Optional.ofNullable(jwt.getClaimAsStringList("roles")).orElse(List.of());
            roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
            return authorities;
        });
        return converter;
    }
}`,
      },
      callout: {
        kind: "warn",
        title: "A JWT cannot be revoked by the resource server",
        text: "The resource server trusts any correctly signed, unexpired token. Keep access tokens short-lived (minutes), revoke refresh tokens at the identity provider, and use token introspection only where immediate revocation is a hard requirement — it costs a network call per request.",
      },
      links: [
        {
          label: "Spring Security — OAuth 2.0 resource server JWT",
          href: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html",
        },
      ],
    },
    {
      heading: "Multiple chains and method security",
      lede: "Different rules for different parts of the app, and checks that need the data.",
      code: {
        title: "Example — an actuator chain, and ownership checks on methods",
        lang: "java",
        source: `// A second chain for operational endpoints, evaluated BEFORE the API chain.
@Bean
@Order(1)
SecurityFilterChain actuator(HttpSecurity http) throws Exception {
    return http
        .securityMatcher(EndpointRequest.toAnyEndpoint())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(EndpointRequest.to("health", "info")).permitAll()
            .anyRequest().hasRole("OPS"))
        .httpBasic(Customizer.withDefaults())
        .build();
}
// Chains without a securityMatcher match everything, so put the catch-all chain
// LAST (highest @Order value), or it swallows every request.

// URL rules cannot express "only the invoice's owner". Method security can:
@Service
class InvoiceService {
    @PreAuthorize("hasRole('ADMIN') or @invoiceAccess.canView(#id, authentication)")
    public Invoice get(long id) { ... }

    @PostFilter("filterObject.ownerId == authentication.name")   // small collections only
    public List<Invoice> recent() { ... }
}

@Component("invoiceAccess")
class InvoiceAccess {
    private final InvoiceRepository invoices;
    InvoiceAccess(InvoiceRepository invoices) { this.invoices = invoices; }

    public boolean canView(long id, Authentication auth) {
        return invoices.existsByIdAndOwnerId(id, auth.getName());
    }
}
// @PreAuthorize is AOP (chapter 23): self-invocation skips it, and it belongs
// OUTSIDE caching so a cached result is never served to an unauthorised caller.`,
      },
      bullets: [
        "Broken object-level authorisation — user A reading user B's invoice by changing an id — is consistently near the top of the OWASP API Security Top 10. Scope queries by the caller (WHERE owner_id = :caller) or check ownership explicitly on every object access.",
        "@PostFilter loads everything and filters in memory. For real lists, filter in the query.",
      ],
    },
    {
      heading: "CSRF, CORS and sessions",
      lede: "Three settings people copy-paste. Decide them instead.",
      table: {
        headers: ["Client", "How it authenticates", "CSRF", "Session"],
        rows: [
          ["Server-rendered web app", "Session cookie", "Enabled (the default)", "Stateful"],
          [
            "SPA behind a backend-for-frontend",
            "HttpOnly session cookie set by the BFF",
            "Enabled — CookieCsrfTokenRepository so the SPA can send the token",
            "Stateful at the BFF",
          ],
          [
            "Mobile app or service-to-service",
            "Authorization: Bearer header",
            "Disabled",
            "STATELESS",
          ],
        ],
      },
      bullets: [
        "CSRF works because browsers attach cookies automatically to cross-site requests. A bearer token in a header is never attached automatically, so there is nothing to forge — that is the only reason disabling CSRF is safe for token APIs.",
        'CORS is a browser relaxation, not a protection for your API: non-browser clients ignore it. Configure a CorsConfigurationSource with explicit origins; allowedOrigins "*" cannot be combined with credentials, and reflecting any Origin back is the same mistake in disguise.',
        "Storing access tokens in localStorage exposes them to any XSS on the page. The BFF pattern keeps tokens server-side and gives the browser an HttpOnly cookie.",
      ],
    },
    {
      heading: "Testing security rules",
      code: {
        title: "Example — asserting 401, 403 and 200 without a real identity provider",
        lang: "java",
        source: `@WebMvcTest(InvoiceController.class)
@Import(SecurityConfig.class)
class InvoiceSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean InvoiceService invoices;

    @Test void anonymousIsUnauthorized() throws Exception {
        mvc.perform(get("/v1/invoices/1")).andExpect(status().isUnauthorized());
    }

    @Test void wrongScopeIsForbidden() throws Exception {
        mvc.perform(get("/v1/invoices/1")
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders:read"))))
           .andExpect(status().isForbidden());
    }

    @Test void readScopeIsAllowed() throws Exception {
        mvc.perform(get("/v1/invoices/1")
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_invoices:read"))))
           .andExpect(status().isOk());
    }
}`,
      },
      bullets: [
        "Test the negative cases first. A security configuration that permits everything passes every “200 OK” test.",
        "jwt() from spring-security-test builds an authenticated token directly, bypassing signature validation — so also keep one integration test with a real token from a test identity provider.",
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "How does a request reach Spring Security's filters?",
          a: "Spring Boot registers DelegatingFilterProxy as a servlet filter. It delegates to the FilterChainProxy bean, which selects the first SecurityFilterChain whose request matcher matches and runs that chain's ordered filters before the request reaches DispatcherServlet.",
        },
        {
          q: "What does a Spring JWT resource server validate by default, and what is commonly missed?",
          a: "The signature against the issuer's JWK set, the expiry and not-before times with clock skew, and the issuer when issuer-uri is configured. The audience is commonly missed; without it, a token issued for a different API by the same identity provider is accepted.",
        },
        {
          q: "Why is the authenticated user missing inside an @Async method?",
          a: "The SecurityContext is stored in a ThreadLocal on the request thread. The async executor runs the method on another thread, so its context is empty unless the executor is decorated to copy the context, or the needed identity is passed as an argument.",
        },
        {
          q: "When is it safe to disable CSRF protection?",
          a: "When the API authenticates only with credentials the browser does not attach automatically, such as a bearer token in the Authorization header, and does not use session cookies. Any cookie-based authentication needs CSRF protection.",
        },
        {
          q: "How would you stop one user from reading another user's orders?",
          a: "Enforce object-level authorisation: scope repository queries by the authenticated principal, or use method security such as @PreAuthorize with a bean that checks ownership, and cover it with tests that call the endpoint as a different user and expect 403 or 404.",
        },
      ],
      takeaways: [
        "Name the filter and you can explain the 401 or 403.",
        "Configure the audience, map roles explicitly, keep access tokens short-lived.",
        "URL rules for coarse access, method security and scoped queries for ownership.",
      ],
    },
  ],
  related: [
    "/java/security",
    "/java/spring-mvc-internals",
    "/hld/service-security",
    "/hld/api-gateway",
    "/examples/auth-system",
  ],
  furtherReading: [
    {
      label: "Spring Security — reference",
      href: "https://docs.spring.io/spring-security/reference/index.html",
    },
    {
      label: "Spring Security — method security",
      href: "https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html",
    },
    {
      label: "OWASP API Security Top 10",
      href: "https://owasp.org/API-Security/",
    },
  ],
};
