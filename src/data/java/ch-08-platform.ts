import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaPlatform: Concept[] = [
  {
    slug: "advanced-topics",
    title: "Advanced Topics",
    subtitle: "Chapter 8 — generics, the JVM memory model, JMM guarantees and performance",
    level: "advanced",
    minutes: 22,
    tags: ["generics", "jvm", "memory model", "performance"],
    summary:
      "The material you can work without until suddenly you cannot: generics and type erasure, the happens-before rules that make concurrency reasoning possible, and enough JVM tuning to diagnose a memory problem rather than guess at it.",
    keyPoints: [
      "Generics are erased at compile time — the runtime does not know your type parameter.",
      "PECS: Producer Extends, Consumer Super, for wildcards that actually compose.",
      "happens-before is what makes concurrent code reasoning possible at all.",
      "Most 'JVM tuning' is fixing a leak, not changing flags.",
    ],
    prerequisites: ["/java/oop", "/java/multithreading"],
    sections: [
      {
        heading: "Generics and type erasure",
        code: {
          title: "Example — what erasure means in practice",
          lang: "java",
          source: `// At runtime BOTH of these are just List. The type parameter is erased.
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
a.getClass() == b.getClass();        // true

// CONSEQUENCES:
// 1. You cannot do this:
//      if (obj instanceof List<String>)     // compile error
// 2. You cannot create a generic array:
//      T[] items = new T[10];               // compile error
// 3. Overloads that differ only by type parameter clash:
//      void f(List<String> s) {}
//      void f(List<Integer> i) {}           // same erasure — will not compile

// PECS — Producer Extends, Consumer Super
// Reading FROM a collection? extends. Writing INTO one? super.
static double sum(List<? extends Number> source) {   // producer: we read
    double total = 0;
    for (Number n : source) total += n.doubleValue();
    return total;                     // cannot add to source — correctly forbidden
}

static void fill(List<? super Integer> sink) {       // consumer: we write
    sink.add(1);                      // safe: any Integer supertype accepts an Integer
}

sum(List.of(1, 2, 3));                // List<Integer> works thanks to extends
fill(new ArrayList<Number>());        // List<Number> works thanks to super`,
        },
        bullets: [
          "Erasure is why reflection cannot tell you a List's element type at runtime — frameworks work around it with TypeToken-style tricks.",
          "PECS is not academic: without it, a method taking List<Number> rejects a List<Integer>, which surprises everyone the first time.",
          "Prefer generic methods to casting. A cast that the compiler cannot check is a ClassCastException waiting to happen at runtime.",
        ],
        links: [
          { label: "Baeldung — Java generics", href: "https://www.baeldung.com/java-generics" },
          {
            label: "YouTube search — Java generics type erasure PECS explained",
            href: YT("java generics type erasure wildcards PECS explained"),
          },
        ],
      },
      {
        heading: "The Java Memory Model and happens-before",
        lede: "Why concurrent code can be correct at all.",
        body: [
          "Without rules, a thread has no obligation to see another thread's writes — compilers reorder instructions and CPUs cache values locally. The JMM defines happens-before edges: if A happens-before B, then B is guaranteed to see everything A did.",
        ],
        table: {
          caption: "The edges you rely on, usually without noticing.",
          headers: ["Edge", "Guarantee"],
          rows: [
            [
              "Unlocking a monitor → later locking it",
              "Everything before the unlock is visible after the lock",
            ],
            [
              "Writing a volatile → later reading it",
              "Everything before the write is visible after the read",
            ],
            ["Thread.start()", "Everything before start() is visible in the new thread"],
            ["Thread.join()", "Everything the thread did is visible after join() returns"],
            ["Constructor completing → final field read", "final fields are safely published"],
          ],
        },
        bullets: [
          "This is why making a getter synchronized matters even though it only reads — without the edge, the reader may see a stale value indefinitely.",
          "Final fields are special: a properly constructed object with final fields is safe to share without synchronisation, which is the deep reason immutability helps concurrency.",
          "Do not attempt clever lock-free code without the JMM. Use the concurrent collections and atomics — they were written by people who did the reasoning.",
        ],
        links: [
          {
            label: "YouTube search — Java memory model happens-before explained",
            href: YT("java memory model happens before visibility explained"),
          },
        ],
      },
      {
        heading: "Diagnosing memory before tuning flags",
        bullets: [
          "Reach for a heap dump before a flag. jmap -dump then Eclipse MAT will usually name the leaking structure in minutes — a static Map that only grows, a cache with no eviction, a listener never removed.",
          "Set -XX:+HeapDumpOnOutOfMemoryError in production. An OOM without a dump is an incident you cannot diagnose.",
          "-Xmx is the one flag most worth setting deliberately, especially in a container — the JVM's default heuristics and the container's memory limit can disagree, which shows up as OOMKilled (see the Docker chapter).",
          "Use G1 (the default) unless you have measured a reason not to. Collector choice is rarely the actual problem.",
        ],
        links: [
          {
            label: "YouTube search — Java heap dump analysis memory leak",
            href: YT("java heap dump analysis memory leak eclipse MAT tutorial"),
          },
          { label: "Site: Docker memory limits", href: "/java/docker" },
        ],
      },
    ],
    related: ["/java/generics-in-depth", "/java/multithreading", "/java/docker"],
    furtherReading: [{ label: "Baeldung — JVM", href: "https://www.baeldung.com/jvm-parameters" }],
  },

  {
    slug: "file-io-serialization",
    title: "File I/O & Serialization",
    subtitle: "Chapter 9 — NIO.2, streams of files, and why Java serialization is dangerous",
    level: "intermediate",
    minutes: 18,
    tags: ["file io", "nio", "serialization", "json"],
    summary:
      "Modern file work is java.nio.file, and it is genuinely pleasant. Java's built-in object serialization, by contrast, is a long-standing security problem — deserializing untrusted bytes can execute code, and the correct answer is almost always JSON instead.",
    keyPoints: [
      "Use java.nio.file.Path and Files, not the legacy java.io.File.",
      "Always use try-with-resources for streams — leaked file handles are a real outage.",
      "Never deserialize untrusted input with Java serialization.",
      "For data interchange, use JSON via Jackson.",
    ],
    prerequisites: ["/java/exception-handling"],
    sections: [
      {
        heading: "NIO.2 — the modern file API",
        code: {
          title: "Example — reading, writing and streaming files safely",
          lang: "java",
          source: `Path path = Path.of("data", "orders.csv");

// Small files: one line
String content = Files.readString(path);
List<String> lines = Files.readAllLines(path);

// LARGE files: stream, so you never hold the whole thing in memory.
// Files.lines returns a Stream that HOLDS AN OPEN FILE HANDLE — it must be
// closed, which means try-with-resources. This is the leak people miss.
try (Stream<String> stream = Files.lines(path)) {
    long errors = stream.filter(l -> l.contains("ERROR")).count();
}

// Writing atomically: write to a temp file, then move. A crash mid-write then
// leaves the original intact rather than a half-written file.
Path tmp = Files.createTempFile("orders", ".csv");
Files.writeString(tmp, content);
Files.move(tmp, path, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);

// Walking a tree — also a stream, also needs closing
try (Stream<Path> walk = Files.walk(Path.of("logs"))) {
    walk.filter(Files::isRegularFile).forEach(System.out::println);
}`,
        },
        bullets: [
          "Files.lines, Files.walk and Files.list all return streams backed by open handles. Not closing them leaks file descriptors until the process cannot open any more.",
          "Prefer atomic move for anything a reader might see mid-write — a partially written config or data file is a confusing failure.",
          "Path.of composes safely across platforms; string concatenation with slashes does not.",
        ],
        links: [
          {
            label: "Baeldung — Java NIO.2 file API",
            href: "https://www.baeldung.com/java-nio-2-file-api",
          },
        ],
      },
      {
        heading: "Serialization, and why to avoid the built-in one",
        callout: {
          kind: "warn",
          title: "Deserializing untrusted data is remote code execution",
          text: "Java's ObjectInputStream reconstructs arbitrary object graphs and invokes methods during reconstruction. Crafted bytes can chain existing classes on your classpath into code execution — this is the root of a long list of CVEs. There is no safe way to deserialize untrusted input with it. Use JSON with an explicit target type instead.",
        },
        code: {
          title: "Example — what to use instead",
          lang: "java",
          source: `// DO NOT do this with anything that came from outside your process:
// ObjectInputStream in = new ObjectInputStream(untrustedBytes);
// Object o = in.readObject();                 // ← potential RCE

// USE JSON with a known target type. Jackson will not instantiate arbitrary
// classes unless you explicitly enable polymorphic typing (do not).
ObjectMapper mapper = new ObjectMapper()
    .registerModule(new JavaTimeModule())
    .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);   // forward compatible

Order order = mapper.readValue(json, Order.class);   // explicit type, no surprises
String out  = mapper.writeValueAsString(order);

// Records serialise cleanly and are immutable — a good DTO shape:
record Order(String id, BigDecimal total, Instant createdAt) { }`,
        },
        bullets: [
          "If you must use Java serialization internally, add a serialization filter (ObjectInputFilter) to allow-list acceptable classes.",
          "Disable FAIL_ON_UNKNOWN_PROPERTIES for inbound DTOs so adding a field upstream does not break your consumer.",
          "Use BigDecimal for money in DTOs, never double — and configure Jackson to serialise it as a string if the consumer is JavaScript.",
        ],
        links: [
          {
            label: "OWASP — deserialization cheat sheet",
            href: "https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html",
          },
          { label: "Baeldung — Jackson", href: "https://www.baeldung.com/jackson" },
        ],
      },
    ],
    related: ["/java/security", "/java/jdbc"],
    furtherReading: [{ label: "Baeldung — Java IO", href: "https://www.baeldung.com/java-io" }],
  },

  {
    slug: "annotations-reflection",
    title: "Annotations & Reflection",
    subtitle: "Chapter 10 — how Spring actually works under the surface",
    level: "intermediate",
    minutes: 18,
    tags: ["annotations", "reflection", "metadata", "spring internals"],
    summary:
      "Read this after Spring, not before — it is far more interesting once you have seen @Autowired appear to conjure objects from nowhere. Annotations are metadata; reflection is the machinery that reads it and acts. Together they are the explanation for most framework magic.",
    keyPoints: [
      "Annotations do nothing on their own — something must read them.",
      "RUNTIME retention is required for reflection to see an annotation.",
      "Reflection is powerful, slow-ish, and breaks compile-time safety.",
      "This pairing is how Spring, JPA, Jackson and JUnit all work.",
    ],
    prerequisites: ["/java/oop"],
    sections: [
      {
        heading: "Writing an annotation and the code that reads it",
        code: {
          title: "Example — a tiny framework, in thirty lines",
          lang: "java",
          source: `// 1. DECLARE — metadata, and nothing more. It changes no behaviour by itself.
@Retention(RetentionPolicy.RUNTIME)     // ← without this, reflection cannot see it
@Target(ElementType.METHOD)
public @interface Timed {
    String value() default "";
}

// 2. USE
public class ReportService {
    @Timed("report.build")
    public Report build(long id) { /* ... */ }
}

// 3. READ — this is the part that makes the annotation mean something
for (Method m : ReportService.class.getDeclaredMethods()) {
    Timed timed = m.getAnnotation(Timed.class);
    if (timed != null) {
        long start = System.nanoTime();
        Object result = m.invoke(service, id);          // reflective call
        metrics.record(timed.value(), System.nanoTime() - start);
    }
}

// THIS IS SPRING. @Component is metadata; the component scan is the reflection
// that finds it and registers a bean. @Transactional is metadata; a proxy reads
// it and opens a transaction around the call. No magic — just metadata plus
// a reader.`,
        },
        bullets: [
          "RetentionPolicy.SOURCE is discarded at compile time (like @Override), CLASS is in the bytecode but not visible at runtime, RUNTIME is readable by reflection. Framework annotations are always RUNTIME.",
          "Reflection bypasses compile-time checks, so a rename that the compiler would normally catch becomes a runtime failure — this is why annotation-driven wiring fails at startup rather than during the build.",
          "Reflective calls are slower than direct ones, which is why frameworks cache the reflective lookup and why native-image builds need reflection registered explicitly.",
        ],
        links: [
          {
            label: "Baeldung — Java annotations",
            href: "https://www.baeldung.com/java-custom-annotation",
          },
          { label: "Baeldung — Java reflection", href: "https://www.baeldung.com/java-reflection" },
          {
            label: "YouTube search — Java annotations reflection how Spring works",
            href: YT("java annotations reflection how spring works internally"),
          },
        ],
      },
    ],
    related: ["/java/spring-framework", "/java/testing"],
    furtherReading: [
      { label: "Baeldung — reflection", href: "https://www.baeldung.com/java-reflection" },
    ],
  },
];
