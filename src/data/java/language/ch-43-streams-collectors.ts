import type { Concept } from "@/data/types";

export const javaStreamsCollectors: Concept = {
  slug: "streams-collectors",
  title: "Streams & Collectors in Depth",
  subtitle:
    "Chapter 43 — pipeline mechanics, the collectors worth knowing, primitive streams, when parallel actually helps, and gatherers",
  level: "advanced",
  minutes: 30,
  tags: ["streams", "collectors", "parallel", "gatherers", "performance", "java 24"],
  summary:
    "A stream is a pipeline description, not a collection: nothing happens until a terminal operation pulls, each element flows through the whole chain, and stateful stages like sorted() have to buffer. Collectors are where most real work lands — grouping, counting and summarising in one pass — and gatherers (Java 24) finally let you write custom intermediate steps like sliding windows.",
  keyPoints: [
    "Intermediate operations are lazy; without a terminal operation nothing runs.",
    "filter before map before sorted — order changes how much work each stage does.",
    "groupingBy with a downstream collector counts and sums without building intermediate lists.",
    "Parallel streams share one common ForkJoinPool across the JVM; blocking inside them starves everything else.",
    "Gatherers (JEP 485, final in Java 24) add custom intermediate operations such as fixed and sliding windows.",
  ],
  prerequisites: ["/java/java-8", "/java/collections-choosing"],
  sections: [
    {
      heading: "How a pipeline actually runs",
      lede: "One element at a time, not one stage at a time.",
      code: {
        title: "Example — laziness, short-circuiting and stage order",
        lang: "java",
        source: `List<String> result = orders.stream()
    .peek(o -> System.out.println("filter sees " + o.id()))
    .filter(Order::isPaid)
    .peek(o -> System.out.println("map sees " + o.id()))
    .map(Order::id)
    .limit(2)
    .toList();
// Prints interleaved — each element is pushed through the whole chain, and the
// pipeline STOPS as soon as limit(2) is satisfied. It does not filter everything
// and then map everything.

// STAGE ORDER MATTERS
orders.stream().sorted(byTotal).filter(Order::isPaid).limit(10)   // sorts EVERYTHING
orders.stream().filter(Order::isPaid).sorted(byTotal).limit(10)   // sorts only paid ones
// sorted() and distinct() are stateful: they buffer to do their job. Put cheap,
// selective filters before them.

// A stream is consumed once:
Stream<Order> stream = orders.stream();
stream.count();
stream.findFirst();      // IllegalStateException: stream has already been operated upon

// Infinite sources need a limit or a short-circuiting terminal:
Stream.iterate(1, n -> n * 2).limit(10).toList();
Stream.iterate(1, n -> n < 1000, n -> n * 2).toList();   // Java 9+: a predicate instead`,
      },
      bullets: [
        "Terminal operations that short-circuit: findFirst, findAny, anyMatch, allMatch, noneMatch, limit with a bounded source.",
        "Encounter order is preserved for ordered sources unless you call unordered(); forEachOrdered costs more than forEach for exactly that reason.",
        "Do not mutate the source inside a pipeline, and avoid side effects in map or filter — the whole model assumes stages are pure.",
      ],
    },
    {
      heading: "Collectors: one pass, real answers",
      code: {
        title: "Example — a revenue report in a single traversal",
        lang: "java",
        source: `// Group and summarise without intermediate lists.
Map<String, Long> ordersPerCity = orders.stream()
    .collect(Collectors.groupingBy(Order::city, Collectors.counting()));

Map<Status, BigDecimal> revenueByStatus = orders.stream()
    .collect(Collectors.groupingBy(
        Order::status,
        () -> new EnumMap<>(Status.class),                        // pick the map type
        Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add)));

// Two levels, then sort the result by value:
Map<String, Map<Status, Long>> byCityAndStatus = orders.stream()
    .collect(Collectors.groupingBy(Order::city,
             Collectors.groupingBy(Order::status, Collectors.counting())));

// teeing runs TWO collectors over the same stream and merges the results (Java 12+):
record Summary(long count, BigDecimal total, BigDecimal average) {}
Summary summary = orders.stream().collect(Collectors.teeing(
    Collectors.counting(),
    Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add),
    (count, total) -> new Summary(count, total,
        count == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP))));

// toMap needs a merge function whenever duplicate keys are possible:
Map<String, BigDecimal> spendByCustomer = orders.stream()
    .collect(Collectors.toMap(Order::customerId, Order::total, BigDecimal::add, TreeMap::new));

// collectingAndThen finishes with a transformation — here, make the result immutable:
List<String> cities = orders.stream()
    .map(Order::city).distinct().sorted()
    .collect(Collectors.collectingAndThen(Collectors.toList(), List::copyOf));

// mapping and filtering as DOWNSTREAM collectors keep the grouping intact:
Map<String, List<String>> skusByCity = orders.stream()
    .collect(Collectors.groupingBy(Order::city,
             Collectors.mapping(Order::sku, Collectors.toList())));
Map<String, Long> largeOrdersByCity = orders.stream()
    .collect(Collectors.groupingBy(Order::city,
             Collectors.filtering(o -> o.total().compareTo(THRESHOLD) > 0, Collectors.counting())));`,
      },
      bullets: [
        "stream().toList() (Java 16+) returns an unmodifiable list and is the shortest correct terminal for most pipelines. Collectors.toList() returns a mutable ArrayList, which is occasionally what you want.",
        "For numbers, summaryStatistics gives count, sum, min, average and max in one pass: orders.stream().mapToLong(Order::paise).summaryStatistics().",
        "A custom Collector.of(supplier, accumulator, combiner, finisher) is rarely needed — reach for it only when no combination of the built-ins fits.",
      ],
    },
    {
      heading: "Primitive streams and boxing",
      code: {
        title: "Example — where the allocations go",
        lang: "java",
        source: `// Boxes every element into an Integer, then unboxes to sum:
int total = orders.stream().map(Order::quantity).reduce(0, Integer::sum);

// No boxing at all:
int total = orders.stream().mapToInt(Order::quantity).sum();

IntSummaryStatistics stats = orders.stream().mapToInt(Order::quantity).summaryStatistics();
stats.getMax(); stats.getAverage(); stats.getCount();

// Ranges without a loop, and without boxing:
IntStream.range(0, partitions).forEach(this::rebuildPartition);
IntStream.rangeClosed(1, 12).mapToObj(Month::of).toList();

// boxed() when you need objects again:
List<Integer> quantities = orders.stream().mapToInt(Order::quantity).boxed().toList();

// Watch out: average() and max() return OptionalDouble / OptionalInt, because an
// empty stream has no answer — a good reminder to handle the empty case.`,
      },
    },
    {
      heading: "Parallel streams: when, and when not",
      lede: "The easiest way to make code slower — or to starve the whole JVM.",
      diagram: {
        kind: "compare",
        caption: "Sequential versus parallel for the same pipeline.",
        options: [
          {
            title: "Sequential",
            sub: "the default",
            good: ["Predictable", "No coordination overhead", "Works with blocking calls"],
            bad: ["One core"],
            verdict: "Correct until a measurement says otherwise.",
            tone: "ok",
          },
          {
            title: "parallel()",
            sub: "common ForkJoinPool",
            good: ["Uses every core for CPU-bound work", "Free to try"],
            bad: [
              "Shared pool: one blocking task starves every other parallel stream",
              "Splitting costs; LinkedList and iterators split badly",
              "Ordered collection + ordered terminal = merge overhead",
            ],
            verdict: "Large, CPU-bound, array-backed, no I/O.",
          },
        ],
      },
      code: {
        title: "Example — the checklist, and the safe way to run blocking work in parallel",
        lang: "java",
        source: `// Parallel is worth testing when ALL of these hold:
//   • the source splits cheaply (array, ArrayList, IntStream.range)
//   • elements number in the tens of thousands or more
//   • per-element work is CPU-bound and independent
//   • the terminal operation is not order-sensitive (forEach, not forEachOrdered)
long matches = prices.parallelStream().filter(this::expensiveCheck).count();

// NEVER do blocking I/O in a parallel stream: it runs on the COMMON pool, shared by
// every parallel stream in the JVM, sized to cores − 1.
orders.parallelStream().forEach(order -> httpClient.send(...));   // starves everything

// Use an executor you own (or virtual threads, chapter 28):
try (var scope = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Receipt>> futures = orders.stream()
        .map(order -> scope.submit(() -> httpClient.charge(order)))
        .toList();
    for (Future<Receipt> future : futures) receipts.add(future.get());
}

// Collecting into a shared mutable structure from a parallel stream is a race unless
// the collector is designed for it:
List<String> ids = new ArrayList<>();
orders.parallelStream().forEach(o -> ids.add(o.id()));   // BROKEN
List<String> ids = orders.parallelStream().map(Order::id).toList();   // correct`,
      },
    },
    {
      heading: "Gatherers: custom intermediate operations",
      lede: "Java 24 (JEP 485) filled the gap streams always had.",
      code: {
        title: "Example — sliding windows, running totals and dedupe by key",
        lang: "java",
        source: `// Before gatherers, a moving average meant leaving the stream (an indexed loop, or
// collecting to a list first). Now it is a stage:
List<Double> movingAverage = readings.stream()
    .gather(Gatherers.windowSliding(5))                       // List<Reading> per window
    .map(window -> window.stream().mapToDouble(Reading::value).average().orElse(0))
    .toList();

// Fixed batches — for bulk inserts or API calls with a size limit:
orders.stream()
    .gather(Gatherers.windowFixed(500))
    .forEach(batch -> repository.saveAll(batch));

// Running total, emitting each intermediate state:
List<BigDecimal> runningTotal = payments.stream()
    .gather(Gatherers.scan(() -> BigDecimal.ZERO, BigDecimal::add))
    .toList();

// A custom gatherer: keep the first element for each key, in encounter order.
static <T, K> Gatherer<T, ?, T> distinctBy(Function<T, K> key) {
    return Gatherer.ofSequential(
        HashSet<K>::new,
        (seen, element, downstream) ->
            seen.add(key.apply(element)) ? downstream.push(element) : true);
}
List<Order> firstPerCustomer = orders.stream().gather(distinctBy(Order::customerId)).toList();

// Gatherers compose and can short-circuit, which is what separates them from
// "collect to a list and loop".`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Are streams lazy, and what does that mean in practice?",
          a: "Intermediate operations only build the pipeline; nothing executes until a terminal operation runs, and then each element is pushed through the whole chain. That is why limit and findFirst can stop early, and why putting a filter before a sort avoids sorting rows you are going to discard.",
        },
        {
          q: "When does a parallel stream help?",
          a: "Large, CPU-bound, independent work over a source that splits cheaply, with an order-insensitive terminal. It hurts when the work blocks — it runs on the shared common ForkJoinPool — or when the source splits poorly, or when the data is small enough that coordination dominates.",
        },
        {
          q: "How would you count orders per city and sum their totals in one pass?",
          a: "groupingBy with a downstream collector — counting for the count, reducing or summingLong for the total — or Collectors.teeing to compute two aggregates over the same stream and merge them into one record.",
        },
        {
          q: "Why does Collectors.toMap throw on duplicate keys?",
          a: "Because silently keeping one of two values is almost always a bug. The three-argument form takes a merge function so you state what should happen — sum them, keep the newest, or fail loudly.",
        },
        {
          q: "What do gatherers add that map and filter cannot do?",
          a: "Stateful, possibly many-to-many intermediate stages: sliding and fixed windows, running scans, dedupe by key, take-while variants with custom state. Before Java 24 those required leaving the stream or writing a Spliterator.",
        },
      ],
      takeaways: [
        "Filter early, sort late, and let the terminal pull.",
        "Collectors do the aggregation — groupingBy with a downstream is the workhorse.",
        "Parallel only for big CPU-bound work; never for I/O.",
      ],
    },
  ],
  related: [
    "/java/java-8",
    "/java/collections-choosing",
    "/java/spring-threads",
    "/java/java-22-to-26",
    "/java/multithreading",
  ],
  furtherReading: [
    {
      label: "Javadoc — java.util.stream",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html",
    },
    { label: "JEP 485 — Stream Gatherers", href: "https://openjdk.org/jeps/485" },
  ],
};
