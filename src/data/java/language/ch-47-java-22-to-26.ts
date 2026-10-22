import type { Concept } from "@/data/types";

export const javaTwentyTwoToTwentySix: Concept = {
  slug: "java-22-to-26",
  title: "Java 22–26: Gatherers, Scoped Values & Faster Startup",
  subtitle:
    "Chapter 47 — what shipped in 22, 23, 24, the 25 LTS and 26, which parts are still preview, and what was removed",
  level: "advanced",
  minutes: 30,
  tags: [
    "java 25",
    "java 26",
    "scoped values",
    "gatherers",
    "structured concurrency",
    "aot",
    "http/3",
  ],
  summary:
    "Java 25 (September 2025) is the current LTS and the first release where the Loom programme feels complete for application code: scoped values are final, startup has an ahead-of-time cache, and object headers shrank. Java 26 (March 2026) added HTTP/3 and kept structured concurrency in preview. This chapter separates what you can use today from what is still moving.",
  keyPoints: [
    "Stream gatherers went final in 24 — custom intermediate stream operations at last.",
    "Scoped values are final in 25 and are the virtual-thread-friendly replacement for ThreadLocal.",
    "Structured concurrency is still a preview in 26, and its API has changed between releases.",
    "Compact object headers (final in 25) cut heap use on object-heavy workloads with one flag.",
    "Removals matter: the Security Manager is disabled (24), the Applet API is gone (26), and 26 prepares to make final really mean final.",
  ],
  prerequisites: ["/java/java-17-to-21"],
  sections: [
    {
      heading: "Release by release",
      table: {
        caption: "The application-facing changes, with status at the time of writing.",
        headers: ["Release", "Final", "Preview / experimental"],
        rows: [
          [
            "22 (Mar 2024)",
            "Foreign Function & Memory API (454); unnamed variables and patterns (456); multi-file source launch (458); region pinning for G1 (423)",
            "Stream gatherers; structured concurrency; scoped values; statements before super; class-file API",
          ],
          [
            "23 (Sep 2024)",
            "Markdown javadoc (467); ZGC generational by default (474); deprecate sun.misc.Unsafe memory access (471)",
            "Primitive types in patterns; module import declarations; the previews above, carried forward",
          ],
          [
            "24 (Mar 2025)",
            "Stream gatherers (485); class-file API (484); AOT class loading and linking (483); virtual threads no longer pinned by synchronized (491); Security Manager permanently disabled (486); ML-KEM and ML-DSA (496, 497)",
            "Compact object headers; generational Shenandoah; key derivation API",
          ],
          [
            "25 (Sep 2025, LTS)",
            "Scoped values (506); module import declarations (511); compact source files and instance main (512); flexible constructor bodies (513); compact object headers (519); generational Shenandoah (521); KDF API (510); AOT ergonomics and method profiling (514, 515)",
            "Stable values; PEM encodings; structured concurrency (5th); primitive types in patterns (3rd)",
          ],
          [
            "26 (Mar 2026)",
            "HTTP/3 for the HTTP client (517); AOT object caching with any GC (516); G1 throughput (522); Applet API removed (504); prepare to make final mean final (500)",
            "Lazy constants (526, renamed from stable values); structured concurrency (6th); primitive types in patterns (4th)",
          ],
        ],
      },
      callout: {
        kind: "warn",
        title: "Preview is not “early access to a stable API”",
        text: "A preview feature needs --enable-preview at compile and run time, produces class files pinned to that exact JDK version, and can change or disappear — string templates were previewed twice and then withdrawn. Use previews to learn and to give feedback, never in code you have to support.",
      },
    },
    {
      heading: "Scoped values: the ThreadLocal replacement",
      lede: "Final in Java 25, and the right fit for a virtual thread per request.",
      code: {
        title: "Example — request context without a ThreadLocal leak",
        lang: "java",
        source: `// THE PROBLEM WITH ThreadLocal under virtual threads: one per task rather than one
// per pooled thread, unbounded lifetime if you forget remove(), and it is mutable
// from anywhere in the call stack.

private static final ScopedValue<Tenant> TENANT = ScopedValue.newInstance();

void handle(HttpRequest request) {
    Tenant tenant = tenants.resolve(request.header("X-Tenant-Id"));

    ScopedValue.where(TENANT, tenant).run(() -> {
        // Everything called from here — however deep — can read TENANT.
        // Nothing can change it, and it is gone when this block ends.
        repository.loadDashboard();
    });
}

class OrderRepository {
    List<Order> forCurrentTenant() {
        Tenant tenant = TENANT.get();          // no parameter threading, no leak
        return jdbc.query("SELECT … WHERE tenant_id = ?", tenant.id());
    }
}

// Why it is better here:
//   • Immutable for the duration of the block — no "who changed this?" bugs.
//   • Bounded lifetime: rebinding is scoped, and unwinding clears it.
//   • Inherited by structured-concurrency subtasks, so fan-out keeps the context.
// Spring's RequestContextHolder and MDC are still ThreadLocal-based; scoped values
// are for your own code and for libraries that have adopted them.`,
      },
    },
    {
      heading: "Startup, footprint and the flags worth knowing",
      code: {
        title: "Example — AOT cache and compact headers, measured",
        lang: "bash",
        source: `# AHEAD-OF-TIME CACHE (JEP 483 in 24, ergonomics in 25): record one training run,
# then start from the cache. Class loading and linking are done up front.
java -XX:AOTMode=record -XX:AOTConfiguration=app.aotconf -jar app.jar   # training run
java -XX:AOTMode=create -XX:AOTConfiguration=app.aotconf \
     -XX:AOTCache=app.aot -jar app.jar                                  # build the cache
java -XX:AOTCache=app.aot -jar app.jar                                  # production start

# Java 25 simplifies the two-step into one command:
java -XX:AOTCacheOutput=app.aot -jar app.jar

# Typical effect on a Spring Boot service: a meaningful cut in startup time with no
# code change and no native-image constraints. Measure yours — the win depends on
# how much of startup is class loading versus your own initialisation (chapter 20).

# COMPACT OBJECT HEADERS (JEP 519, final in 25): 12-byte headers become 8 bytes.
java -XX:+UseCompactObjectHeaders -jar app.jar
# On heaps full of small objects — caches, parsed documents, entity graphs — this is
# a straightforward reduction in live set and GC work. Benchmark before and after.

# GC selection has simplified: ZGC is generational (default since 23, only mode
# since 24), Shenandoah is generational and final in 25, G1 got throughput work in 26.
java -XX:+UseZGC -XX:MaxRAMPercentage=75 -jar app.jar`,
      },
    },
    {
      heading: "Language changes you can use now",
      code: {
        title: "Example — compact source files, module imports, flexible constructors",
        lang: "java",
        source: `// COMPACT SOURCE FILES AND INSTANCE MAIN METHODS (JEP 512, final in 25).
// A whole program, no class declaration, no String[] args, no System.out:
void main() {
    IO.println("What is your name?");
    var name = IO.readln();
    IO.println("Hello, " + name);
}
// Run it directly: java hello.java
// Aimed at learners and scripts — it removes the ceremony a beginner cannot yet
// explain. Production code still declares classes.

// MODULE IMPORT DECLARATIONS (JEP 511, final in 25):
import module java.base;        // every exported package of java.base, in one line
// Handy in scripts and prototypes; in a codebase, explicit imports still document
// dependencies better.

// FLEXIBLE CONSTRUCTOR BODIES (JEP 513, final in 25): validate before super().
class Payment extends Transaction {
    private final Money amount;
    Payment(Money amount) {
        if (amount.isNegative()) throw new IllegalArgumentException("amount");   // legal now
        super(amount.currency());
        this.amount = amount;
    }
}

// UNNAMED VARIABLES AND PATTERNS (JEP 456, final in 22): say "I do not need this".
for (var _ : tasks) count++;                       // the value is irrelevant
if (event instanceof OrderPlaced(var id, _, _)) audit(id);
try { parse(line); } catch (NumberFormatException _) { skipped++; }

// STRUCTURED CONCURRENCY is still a preview in 26 — the shape is stable enough to
// understand, the API is not stable enough to depend on:
//   try (var scope = StructuredTaskScope.open()) {
//       var price = scope.fork(() -> pricing.quote(sku));
//       var stock = scope.fork(() -> inventory.check(sku));
//       scope.join();                       // both, or the whole scope fails together
//       return new Listing(price.get(), stock.get());
//   }
// The idea: a task's subtasks live and die with it, so a failure cancels siblings
// and nothing outlives the block. Track it, prototype behind --enable-preview.`,
      },
    },
    {
      heading: "Removals and restrictions to plan for",
      bullets: [
        "The Security Manager is permanently disabled since 24 (JEP 486). Code calling System.setSecurityManager fails; sandboxing must come from the platform — containers, seccomp, a service mesh — not the JVM.",
        "sun.misc.Unsafe memory-access methods are deprecated and now warn at runtime (JEP 498, Java 24). Libraries doing off-heap work should move to the Foreign Function & Memory API, final since 22.",
        "The 32-bit x86 port is gone (25) and the Applet API is gone (26).",
        "JEP 500 (Java 26) prepares to make final mean final: reflectively mutating a final field will warn now and fail later. Frameworks and test tools that patch finals — some mocking and serialization libraries — need updating.",
        "Dynamic agent loading warns since 21 and is heading for disallowed; profilers attaching at runtime will need -XX:+EnableDynamicAgentLoading.",
      ],
      callout: {
        kind: "insight",
        title: "What to adopt today on Java 25",
        text: "Virtual threads with bulkheads, scoped values instead of ThreadLocal for your own context, gatherers where you were writing loops around streams, the AOT cache for startup, and compact object headers after a benchmark. Leave structured concurrency, primitive patterns and lazy constants as things you follow, not things you ship.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What are scoped values and why not just use ThreadLocal?",
          a: "A scoped value is bound for the duration of a block and is immutable inside it, so its lifetime is bounded by the call stack and inherited by subtasks. With a thread per request that is exactly what you want; ThreadLocal is mutable from anywhere, leaks when remove() is forgotten, and multiplies per-thread caches when threads become cheap.",
        },
        {
          q: "Is structured concurrency usable in production yet?",
          a: "Not as of Java 26 — it is still a preview, and the API has changed across releases. The concept is worth knowing: subtasks are scoped to a parent, a failure cancels siblings, and nothing leaks past the block. Prototype it behind --enable-preview and keep executors for production.",
        },
        {
          q: "How would you speed up a Spring Boot service's startup without a native image?",
          a: "Use the AOT cache introduced in 24 and simplified in 25: a training run records class loading and linking, and production starts from that cache. Combine it with reducing work in the startup path and lazy initialisation where appropriate, and measure with the startup endpoint.",
        },
        {
          q: "What is the risk of using preview features?",
          a: "They require --enable-preview at compile and run time, the class files only run on that exact JDK version, and the feature may change or be withdrawn — as string templates were. They are for learning and feedback, not for code you must support.",
        },
        {
          q: "What did compact object headers change?",
          a: "The per-object header shrank from twelve bytes to eight, which reduces live-set size and GC work on workloads with many small objects. It is a single flag in Java 25 and needs no code change, but it should be benchmarked on your own heap.",
        },
      ],
      takeaways: [
        "25 is the LTS to target; 26 adds HTTP/3 and keeps the previews moving.",
        "Scoped values and gatherers are ready; structured concurrency is not.",
        "Plan for the removals: Security Manager, Unsafe, final-means-final.",
      ],
    },
  ],
  related: [
    "/java/java-17-to-21",
    "/java/jdk-migration",
    "/java/streams-collectors",
    "/java/spring-threads",
    "/java/multithreading",
  ],
  furtherReading: [
    { label: "JDK 25 release page", href: "https://openjdk.org/projects/jdk/25/" },
    { label: "JDK 26 release page", href: "https://openjdk.org/projects/jdk/26/" },
    { label: "JEP 506 — Scoped Values", href: "https://openjdk.org/jeps/506" },
  ],
};
