import type { Concept } from "@/data/types";

export const springCachingScheduling: Concept = {
  slug: "spring-caching-scheduling",
  title: "Caching with Redis & Scheduling in a Cluster",
  subtitle:
    "Chapter 29 — the cache abstraction, serialization and keys, stampedes and stale entries, and scheduled jobs that run once rather than once per pod",
  level: "advanced",
  minutes: 26,
  tags: ["spring cache", "redis", "cacheable", "cache stampede", "scheduled", "shedlock"],
  summary:
    "@Cacheable is a proxy that checks a cache before calling your method; @Scheduled is a timer on every instance. Both look like one-line features, and both change behaviour the moment you run more than one pod: caches need a serialization format that survives rolling deploys, invalidation that respects transaction boundaries, and protection from stampedes, while scheduled jobs need a lock so twenty replicas do not send twenty invoices.",
  keyPoints: [
    "@Cacheable follows every proxy rule — self-invocation bypasses the cache.",
    "Store JSON with a versioned key prefix; Java serialization breaks when classes change during a rolling deploy.",
    "Evicting before the transaction commits lets a concurrent read re-cache the old value.",
    "sync = true only prevents stampedes within one JVM.",
    "Every replica runs @Scheduled methods; use ShedLock, a Kubernetes CronJob or a clustered scheduler.",
  ],
  prerequisites: ["/java/spring-aop", "/java/spring-transactions", "/hld/caching"],
  sections: [
    {
      heading: "The cache abstraction and its proxy",
      lede: "Cache-aside, generated around your method.",
      diagram: {
        kind: "sequence",
        caption: "@Cacheable on a Redis-backed cache.",
        actors: [
          { id: "c", label: "Caller" },
          { id: "p", label: "Cache advice", sub: "proxy" },
          { id: "r", label: "Redis" },
          { id: "m", label: "ProductService.get()" },
          { id: "db", label: "Database" },
        ],
        messages: [
          { from: "c", to: "p", label: "get(tenant, sku)" },
          { from: "p", to: "r", label: "GET products::v2::t1:sku-9" },
          { from: "r", to: "p", label: "miss", kind: "return", tone: "warn" },
          { from: "p", to: "m", label: "invoke" },
          { from: "m", to: "db", label: "SELECT …" },
          { from: "db", to: "m", label: "row", kind: "return" },
          { from: "m", to: "p", label: "ProductView", kind: "return" },
          { from: "p", to: "r", label: "SET … EX 600" },
          { from: "p", to: "c", label: "ProductView", kind: "return", tone: "ok" },
        ],
      },
      code: {
        title: "Example — reads, writes and eviction",
        lang: "java",
        source: `@SpringBootApplication
@EnableCaching
public class CatalogApplication { ... }

@Service
class ProductService {

    // Key: tenant and SKU. Omitting the tenant would serve one tenant's data to another.
    @Cacheable(cacheNames = "products", key = "#tenantId + ':' + #sku", unless = "#result == null")
    public ProductView get(String tenantId, String sku) {
        return repository.findView(tenantId, sku);          // a DTO, never an entity
    }

    @CachePut(cacheNames = "products", key = "#tenantId + ':' + #command.sku()")
    @Transactional
    public ProductView update(String tenantId, UpdateProduct command) { ... }

    @CacheEvict(cacheNames = "products", key = "#tenantId + ':' + #sku")
    @Transactional
    public void delete(String tenantId, String sku) { ... }
}

// application.yml
//   spring.cache.type: redis
//   spring.cache.redis.time-to-live: 10m      # every entry expires — no TTL means forever
//   spring.data.redis.host: redis.internal`,
      },
      bullets: [
        "Cache DTOs, not JPA entities: an entity carries lazy proxies bound to a closed session and serializes the whole object graph, or fails.",
        'unless = "#result == null" avoids caching misses. For lookups that are frequently absent, cache a sentinel with a short TTL instead, or the database takes every miss.',
        "The cache advice is AOP (chapter 23). Calling a @Cacheable method from the same class goes straight to the database.",
      ],
      links: [
        {
          label: "Spring Boot — caching",
          href: "https://docs.spring.io/spring-boot/reference/io/caching.html",
        },
      ],
    },
    {
      heading: "Serialization, key design and per-cache TTLs",
      lede: "The cache outlives the code that wrote it.",
      code: {
        title: "Example — typed JSON values, versioned prefixes, TTL per cache",
        lang: "java",
        source: `@Configuration
class CacheConfig {

    @Bean
    RedisCacheManagerBuilderCustomizer caches(ObjectMapper objectMapper) {
        return builder -> builder
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                // Bump v2 → v3 when ProductView changes shape: old entries are
                // simply never read again and expire on their own.
                .prefixCacheNameWith("v2::"))
            .withCacheConfiguration("products", RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .prefixCacheNameWith("v2::")
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                    new Jackson2JsonRedisSerializer<>(objectMapper, ProductView.class))))
            .withCacheConfiguration("exchange-rates", RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(30))
                .prefixCacheNameWith("v1::"))
            .transactionAware();       // puts and evictions wait for the transaction to commit
    }
}

// WHY NOT THE DEFAULT JDK SERIALIZER: during a rolling deploy, old and new pods
// share Redis. Add a field to ProductView and the old pods throw
// SerializationException reading entries written by new pods (or vice versa).
// JSON with a versioned prefix tolerates additive changes and makes breaking
// ones explicit — and the values are readable in redis-cli.`,
      },
      table: {
        caption: "Key design checklist.",
        headers: ["Include", "Because"],
        rows: [
          ["Tenant or user scope", "Otherwise data leaks across tenants"],
          [
            "Every parameter that changes the result",
            "Locale, currency, feature flags — or the wrong variant is served",
          ],
          ["A schema version prefix", "Rolling deploys read each other's entries"],
          ["Nothing unbounded", "A free-text search term as key fills memory with one-off entries"],
        ],
      },
    },
    {
      heading: "Stampedes, staleness and invalidation",
      lede: "The three ways a cache makes the database's day worse.",
      code: {
        title: "Example — the eviction race, and local stampede protection",
        lang: "java",
        source: `// RACE without transactionAware():
//   T1 update(): UPDATE price (uncommitted) → @CacheEvict runs as the method returns
//   T2 get():    cache miss → SELECT reads the OLD committed price → caches it
//   T1:          COMMIT
// The cache now holds the old price until the TTL expires.
// transactionAware() delays the eviction until after commit, closing the window.

// STAMPEDE: a hot key expires and 500 concurrent requests all miss at once.
@Cacheable(cacheNames = "home-feed", key = "#region", sync = true)
public FeedView homeFeed(String region) { ... }
// sync = true makes other threads IN THIS JVM wait for the first load. With 20
// pods you still get up to 20 simultaneous loads — acceptable for most
// endpoints. For truly hot keys, refresh ahead of expiry in the background, or
// take a short distributed lock around the load.

// SYNCHRONISED EXPIRY: warming 10,000 keys at deploy with the same TTL makes
// them all expire in the same second. Add jitter when you populate caches
// yourself, e.g. ttl = base + random(0..10% of base).`,
      },
      bullets: [
        "Choose TTLs from how stale the data may be, not from how fast you want the page. Prices might tolerate 30 seconds; permissions often tolerate none — do not cache authorisation decisions casually.",
        "A local in-process cache (Caffeine) in front of Redis removes network hops for very hot keys, at the price of per-pod staleness. Keep its TTL short.",
        "Watch hit ratio, evictions and latency in Micrometer's cache metrics (chapter 32). A cache with a 5% hit rate is pure overhead.",
      ],
      links: [
        { label: "Site: caching strategies", href: "/hld/caching" },
        { label: "Site: distributed cache design", href: "/examples/distributed-cache" },
      ],
    },
    {
      heading: "@Scheduled in a cluster",
      lede: "Every replica has the same timer.",
      code: {
        title: "Example — running a job once across all pods with ShedLock",
        lang: "java",
        source: `@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
class SchedulingConfig {
    @Bean
    LockProvider lockProvider(DataSource dataSource) {
        // A shedlock table in your existing database; usingDbTime() avoids
        // clock skew between pods deciding who holds the lock.
        return new JdbcTemplateLockProvider(JdbcTemplateLockProvider.Configuration.builder()
            .withJdbcTemplate(new JdbcTemplate(dataSource))
            .usingDbTime()
            .build());
    }
}

@Component
class InvoiceJobs {

    // Cron with an explicit zone — the server's default zone is an accident.
    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")
    @SchedulerLock(name = "monthly-invoices", lockAtMostFor = "50m", lockAtLeastFor = "5m")
    public void generateInvoices() {
        invoices.generatePending();   // idempotent: safe if a crash causes a rerun
    }
}

// lockAtMostFor: if the pod dies mid-job, the lock is released after this —
//   it must exceed the job's longest normal runtime, or a second pod starts
//   while the first is still running.
// lockAtLeastFor: stops pods with slightly different clocks from running the
//   same short job twice in one window.

// Also: Spring Boot's scheduler has ONE thread by default
// (spring.task.scheduling.pool.size: 1). A slow job delays every other job.`,
      },
      table: {
        caption: "Where scheduled work can live.",
        headers: ["Option", "Good for", "Watch out"],
        rows: [
          [
            "@Scheduled + ShedLock",
            "Short periodic jobs inside an existing service",
            "Lock timeouts; runs only while pods are up",
          ],
          [
            "Kubernetes CronJob",
            "Batch jobs with their own resources and retries",
            "Cold start per run; concurrencyPolicy: Forbid",
          ],
          [
            "Quartz in clustered mode",
            "Many dynamic, persistent schedules (per-customer reminders)",
            "Its own schema and operational weight",
          ],
          [
            "Delayed messages on a queue",
            "“Do X in 30 minutes” per entity",
            "Needs a broker with delay support or a scheduler service",
          ],
        ],
      },
      bullets: [
        "fixedRate starts runs on a fixed cadence even if the previous run is still going (queued on a busy scheduler); fixedDelay waits after each run finishes. Use fixedDelay for work whose duration varies.",
        "Make jobs idempotent and resumable — process in batches and record progress — so a lock expiry, a deploy or a crash never corrupts the result.",
      ],
      links: [
        {
          label: "ShedLock — project documentation",
          href: "https://github.com/lukas-krecan/ShedLock",
        },
        { label: "Site: distributed job scheduler design", href: "/examples/job-scheduler" },
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Why is a @Cacheable method sometimes not cached?",
          a: "Because caching is proxy-based: calls from inside the same class bypass the proxy, and so do final or private methods. Also check that caching is enabled, the method's bean is Spring-managed, and that the unless or condition expressions are not excluding the result.",
        },
        {
          q: "How can a cache end up with stale data right after an update?",
          a: "If the eviction runs before the updating transaction commits, a concurrent read can miss the cache, read the old committed value and cache it. Make the cache manager transaction-aware so evictions happen after commit, and keep TTLs as a backstop.",
        },
        {
          q: "What is a cache stampede and how do you prevent it?",
          a: "Many concurrent requests miss the same expired hot key and all recompute it at once, hammering the database. Mitigate with sync = true for per-JVM single loading, background refresh before expiry, a short distributed lock around the load for very hot keys, and TTL jitter so keys do not expire together.",
        },
        {
          q: "A nightly job runs on every one of our twelve pods. How do you fix it?",
          a: "Add a distributed lock such as ShedLock with lockAtMostFor longer than the job's runtime, or move the job to a Kubernetes CronJob with concurrencyPolicy Forbid. In both cases make the job idempotent so an occasional rerun is harmless.",
        },
      ],
      takeaways: [
        "Cache DTOs as versioned JSON with explicit TTLs and tenant-scoped keys.",
        "Evict after commit, and plan for stampedes on hot keys.",
        "Scheduled jobs need a lock and idempotency the moment there are two pods.",
      ],
    },
  ],
  playground: "lru-cache",
  related: [
    "/hld/caching",
    "/java/spring-aop",
    "/java/spring-transactions",
    "/examples/distributed-cache",
    "/examples/job-scheduler",
  ],
  furtherReading: [
    {
      label: "Spring Framework — cache abstraction",
      href: "https://docs.spring.io/spring-framework/reference/integration/cache.html",
    },
    {
      label: "Spring Data Redis — reference",
      href: "https://docs.spring.io/spring-data/redis/reference/",
    },
    {
      label: "Spring Boot — task execution and scheduling",
      href: "https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html",
    },
  ],
};
