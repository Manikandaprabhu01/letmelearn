import type { Concept } from "@/data/types";

export const javaSeventeenToTwentyOne: Concept = {
  slug: "java-17-to-21",
  title: "Java 17–21: Virtual Threads & Pattern Matching",
  subtitle:
    "Chapter 46 — UTF-8 by default, virtual threads, sequenced collections, record patterns and exhaustive switch, and what to check before upgrading",
  level: "advanced",
  minutes: 28,
  tags: [
    "java 21",
    "virtual threads",
    "pattern matching",
    "sequenced collections",
    "zgc",
    "migration",
  ],
  summary:
    "Java 21 (September 2023) is the LTS most teams are on or moving to. Two of its features change how you write services: virtual threads make blocking code scale, and pattern matching for switch plus record patterns make a domain model something the compiler can check. The rest of the window fixed defaults — UTF-8 everywhere — and matured the garbage collectors.",
  keyPoints: [
    "Java 18 made UTF-8 the default charset everywhere, which changes behaviour on machines that were not already UTF-8.",
    "Virtual threads (JEP 444, final in 21) make a thread per request cheap; the bottleneck moves to your pools.",
    "Pattern matching for switch and record patterns went final in 21 — exhaustiveness without a default branch.",
    "Sequenced collections gave every ordered collection getFirst, getLast and reversed.",
    "Generational ZGC (21) cut pause times further; ZGC's non-generational mode was removed in 24.",
  ],
  prerequisites: ["/java/java-9-to-17", "/java/multithreading"],
  sections: [
    {
      heading: "Java 18–20: defaults and previews",
      bullets: [
        "JEP 400 (Java 18) made UTF-8 the default charset for file.encoding across platforms. Code that relied on the platform default — new FileReader(path), String.getBytes() — can change behaviour on a Windows or non-UTF-8 Linux host. Be explicit: Files.readString(path, StandardCharsets.UTF_8).",
        "A simple web server (jwebserver) shipped for static files during development, and javadoc gained @snippet for compiled, testable examples.",
        "19 and 20 carried virtual threads, structured concurrency, record patterns and scoped values as previews. Useful for experiments behind --enable-preview, never for production: preview APIs can change between releases and the class files are version-locked.",
      ],
    },
    {
      heading: "Virtual threads (JEP 444)",
      lede: "The change that matters most for a service that waits on things.",
      code: {
        title: "Example — a thread per task, and what it costs",
        lang: "java",
        source: `// A platform thread is an OS thread: ~1 MB of reserved stack, scheduled by the OS.
// A virtual thread is a JVM object that mounts onto a carrier thread only while it
// runs; blocking on I/O unmounts it, so the carrier is free.

// One virtual thread per task, closed when the block ends:
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Receipt>> receipts = orders.stream()
        .map(order -> executor.submit(() -> gateway.charge(order)))   // blocking call
        .toList();
    for (Future<Receipt> receipt : receipts) ledger.record(receipt.get());
}   // close() waits for every task

// 10,000 concurrent blocking calls: with platform threads that is a pool of 10,000
// OS threads (or a queue and a long wait). With virtual threads it is 10,000 JVM
// objects on a handful of carriers.

// WHAT CHANGES IN YOUR CODE: nothing about the style. Blocking code stays blocking
// code — that is the point. What changes is the ADVICE:
//   • Do not pool virtual threads. Create one per task; they are cheap.
//   • Thread-locals are per virtual thread, so a large ThreadLocal cache now costs
//     once per task, not once per pooled thread. Prefer scoped values (Java 25).
//   • The limit moves to your connection pool, your downstream, your rate limiter —
//     add bulkheads (chapter 31), because the thread pool is no longer the cap.
//   • On Java 21–23, blocking inside synchronized PINS the carrier thread; JEP 491
//     (Java 24) removed that. Until then, prefer ReentrantLock around blocking I/O.

// Spring Boot 3.2+: spring.threads.virtual.enabled=true switches Tomcat and the
// task executors over (chapter 28).`,
      },
    },
    {
      heading: "Pattern matching, records and sequenced collections",
      code: {
        title: "Example — the language features that went final in 21",
        lang: "java",
        source: `// PATTERN MATCHING FOR SWITCH (441) + RECORD PATTERNS (440)
sealed interface Shipment permits Dispatched, Delayed, Delivered {}
record Dispatched(String tracking, Instant at) implements Shipment {}
record Delayed(Duration by, String reason) implements Shipment {}
record Delivered(Instant at, String signedBy) implements Shipment {}

String describe(Shipment shipment) {
    return switch (shipment) {                       // exhaustive: no default needed
        case Dispatched(String tracking, var at) -> "on its way, tracking " + tracking;
        case Delayed(Duration by, var reason) when by.toHours() > 24 ->
            "delayed more than a day: " + reason;
        case Delayed(Duration by, var reason) -> "running late by " + by.toMinutes() + "m";
        case Delivered(var at, String signedBy) -> "delivered, signed by " + signedBy;
    };
}
// Adding a fourth permitted type makes this switch fail to compile — the property
// that makes sealed hierarchies worth the extra types (chapter 36).

// SEQUENCED COLLECTIONS (431) — one vocabulary for anything with an encounter order.
List<Order> orders = new ArrayList<>(loaded);
Order newest = orders.getLast();                     // was orders.get(orders.size() - 1)
List<Order> byNewest = orders.reversed();            // a VIEW, no copy
LinkedHashSet<String> tags = new LinkedHashSet<>(List.of("a", "b"));
tags.addFirst("urgent");
SortedMap<Instant, Reading> readings = new TreeMap<>(data);
Map.Entry<Instant, Reading> first = readings.firstEntry();

// Generational ZGC (439) — sub-millisecond pauses with young/old separation:
//   -XX:+UseZGC -XX:+ZGenerational        (21; generational became the default in 23,
//                                          and the non-generational mode went in 24)`,
      },
      table: {
        caption: "Java 21, at a glance.",
        headers: ["JEP", "Feature", "Status in 21"],
        rows: [
          ["444", "Virtual threads", "Final"],
          ["441", "Pattern matching for switch", "Final"],
          ["440", "Record patterns", "Final"],
          ["431", "Sequenced collections", "Final"],
          ["439", "Generational ZGC", "Final"],
          ["452", "Key Encapsulation Mechanism API", "Final"],
          ["443", "Unnamed patterns and variables", "Preview (final in 22)"],
          ["446", "Scoped values", "Preview (final in 25)"],
          ["453", "Structured concurrency", "Preview (still preview in 26)"],
          ["430", "String templates", "Preview — later WITHDRAWN, do not build on it"],
        ],
      },
    },
    {
      heading: "Upgrading to 21",
      bullets: [
        "Check charset assumptions first (Java 18's UTF-8 default), then anything that manipulates bytecode or reflects into the JDK.",
        "Before enabling virtual threads, audit for synchronized blocks around blocking I/O if you are on 21–23, and for thread-local caches sized for a small pool.",
        "Connection pools, rate limiters and downstream quotas become the limiting factor once threads are free — set them deliberately rather than discovering them under load (chapter 28).",
        "Prefer running on 21 with --release 17 in the compiler first: you get the runtime and GC improvements immediately, and adopt the syntax when the whole team is on it.",
      ],
      callout: {
        kind: "insight",
        title: "Why 21 was the big one",
        text: "Virtual threads removed the reason most teams considered a reactive rewrite. You keep straightforward blocking code — stack traces you can read, debuggers that work, try/finally that means what it says — and still handle tens of thousands of concurrent requests.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is a virtual thread and how does it differ from a platform thread?",
          a: "A platform thread maps one-to-one onto an OS thread with a large stack. A virtual thread is managed by the JVM and mounts onto a carrier thread only while running; when it blocks on I/O it unmounts and frees the carrier. That makes a thread per request affordable at tens of thousands of requests.",
        },
        {
          q: "Should you pool virtual threads?",
          a: "No. Pooling exists to amortise the cost of creating threads, and virtual threads are cheap to create. Use one per task, and put limits where the real scarcity is — the database pool, an API quota, a bulkhead.",
        },
        {
          q: "What does exhaustiveness in a switch buy you?",
          a: "Over an enum or a sealed type the compiler verifies every case is handled, so the default branch can go. Adding a new case then breaks compilation everywhere it must be handled, instead of silently falling into a default at runtime.",
        },
        {
          q: "What did sequenced collections fix?",
          a: "Inconsistent vocabulary for ordered collections — List needed get(size() − 1), Deque had getLast, LinkedHashMap had neither, and reversing meant copying. Java 21 added SequencedCollection, SequencedSet and SequencedMap with first/last accessors and a reversed view.",
        },
        {
          q: "Why was UTF-8 by default a breaking change?",
          a: "Before Java 18 the default charset came from the platform, so the same code read and wrote different bytes on different machines. Making UTF-8 the default fixed the inconsistency, but code that implicitly relied on a legacy platform encoding changes behaviour on upgrade. Always pass the charset explicitly.",
        },
      ],
      takeaways: [
        "21 is the LTS worth targeting: virtual threads and final pattern matching.",
        "Cheap threads move the bottleneck — put the limits back deliberately.",
        "Model with sealed types and let the compiler check your switches.",
      ],
    },
  ],
  related: [
    "/java/java-9-to-17",
    "/java/java-22-to-26",
    "/java/spring-threads",
    "/java/multithreading",
    "/java/sealed-records",
  ],
  furtherReading: [
    { label: "JDK 21 release page", href: "https://openjdk.org/projects/jdk/21/" },
    { label: "JEP 444 — Virtual Threads", href: "https://openjdk.org/jeps/444" },
    { label: "JEP 431 — Sequenced Collections", href: "https://openjdk.org/jeps/431" },
  ],
};
