import type { Concept } from "@/data/types";

export const javaObjects: Concept = {
  slug: "objects-encapsulation",
  title: "Objects, Encapsulation & Immutability",
  subtitle:
    "Chapter 34 — what an object costs at runtime, encapsulation that protects invariants, immutable updates, construction order, and nested classes",
  level: "intermediate",
  minutes: 30,
  tags: ["oop", "encapsulation", "immutability", "constructors", "inner classes", "defensive copy"],
  summary:
    "Encapsulation is not “make fields private and add getters”. It is: decide the invariants of a type, then make it impossible to reach a state that breaks them. That means validating in the constructor, refusing to hand out references to your internals, preferring new values over mutation, and knowing exactly when a half-built object can escape.",
  keyPoints: [
    "An object with a mutable field handed out by a getter has no invariants — the caller owns them now.",
    "Validate in the constructor and the object can never exist in a broken state.",
    "final fields are safely published across threads; non-final ones are not.",
    "Calling an overridable method from a constructor runs subclass code before the subclass is initialised.",
    "A non-static inner class holds its outer instance — a classic leak in listeners and caches.",
  ],
  prerequisites: ["/java/oop", "/java/basics"],
  sections: [
    {
      heading: "What an object actually is at runtime",
      lede: "Before the design rules, the mechanics they are built on.",
      diagram: {
        kind: "layers",
        caption: "A Java object on the heap.",
        layers: [
          {
            title: "Header",
            items: [
              "Mark word — identity hash, lock state, GC age",
              "Class pointer — which class this is",
              "12 bytes typically; 8 with compact object headers (JEP 519, Java 25)",
            ],
          },
          {
            title: "Fields",
            items: [
              "Primitives inline: int 4 bytes, long 8, boolean 1",
              "References 4 bytes with compressed oops (heaps under ~32 GB), else 8",
              "Reordered by the JVM to reduce padding",
            ],
          },
          { title: "Padding", items: ["Rounded up to an 8-byte boundary"] },
        ],
      },
      bullets: [
        "A reference variable holds an address, not the object. Two variables can refer to the same object, which is why equality (chapter 37) and defensive copying matter.",
        "A small object that never escapes a method can be scalar-replaced by the JIT — its fields become registers and no allocation happens at all. Writing clear code and letting escape analysis work beats hand-pooling objects.",
        "Object identity is not the same as its hash code: System.identityHashCode is the JVM's, Object.hashCode may be overridden to mean value equality.",
      ],
      callout: {
        kind: "note",
        title: "Measuring instead of guessing",
        text: "OpenJDK's JOL (Java Object Layout) prints the real layout of a class: java -jar jol-cli.jar internals com.acme.Order. It settles arguments about field packing and header size in seconds, and it is how you discover that a “small” cache entry costs 64 bytes.",
      },
    },
    {
      heading: "Encapsulation that protects invariants",
      lede: "The test: can a caller put this object into a state its methods do not expect?",
      code: {
        title: "Example — the getter that gave away the invariant",
        lang: "java",
        source: `// BROKEN — "encapsulated" by habit, not in fact.
public class Order {
    private final List<OrderLine> lines = new ArrayList<>();
    private BigDecimal total = BigDecimal.ZERO;

    public List<OrderLine> getLines() { return lines; }   // ← hands out the internals

    public void addLine(OrderLine line) {
        lines.add(line);
        total = total.add(line.amount());                 // invariant: total == sum(lines)
    }
    public BigDecimal getTotal() { return total; }
}

// Anywhere in the codebase, and the invariant is gone — with no compile error:
order.getLines().add(new OrderLine("free-laptop", new BigDecimal("-99999")));
// total no longer matches the lines. The bug surfaces in an invoice, weeks later.

// FIXED — the type owns its state, and says so.
public final class Order {
    private final List<OrderLine> lines;
    private final BigDecimal total;

    private Order(List<OrderLine> lines) {
        // Defensive copy of the INPUT: the caller may keep mutating their list.
        this.lines = List.copyOf(lines);
        this.total = lines.stream()
            .map(OrderLine::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static Order of(List<OrderLine> lines) {
        if (lines.isEmpty()) throw new IllegalArgumentException("an order needs at least one line");
        if (lines.stream().anyMatch(line -> line.amount().signum() <= 0)) {
            throw new IllegalArgumentException("line amounts must be positive");
        }
        return new Order(lines);
    }

    public List<OrderLine> lines() { return lines; }       // already immutable
    public BigDecimal total() { return total; }
}`,
      },
      table: {
        caption: "Handing out internal state — the three options.",
        headers: ["Return", "Caller can mutate your state?", "Cost"],
        rows: [
          ["The field itself", "Yes — silently", "No copy; no encapsulation"],
          [
            "Collections.unmodifiableList(field)",
            "No, but it is a live view — your later changes are visible to them",
            "No copy",
          ],
          ["List.copyOf(field)", "No", "One copy per call — cache it if it is hot"],
        ],
      },
      bullets: [
        "Records give you shallow immutability only: a record holding a List is still mutable through that list. Copy in the compact constructor — record Order(List<OrderLine> lines) { Order { lines = List.copyOf(lines); } }.",
        "Arrays are always mutable and have no unmodifiable view. A getter returning an internal array must clone it — the java.util.Date and Calendar mistakes, made again.",
        "Package-private is a legitimate access level: it exposes state to tests and collaborators in the same package without making it public API.",
      ],
    },
    {
      heading: "Immutability, and updates without mutation",
      lede: "New value instead of new state — and the thread-safety that comes free.",
      code: {
        title: "Example — a domain type that never changes underneath you",
        lang: "java",
        source: `public record Money(BigDecimal amount, Currency currency) implements Comparable<Money> {

    public Money {                                   // compact constructor: validate + normalise
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(currency, "currency");
        amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.UNNECESSARY);
    }

    public static Money inr(String amount) {
        return new Money(new BigDecimal(amount), Currency.getInstance("INR"));
    }

    public Money plus(Money other) {
        requireSameCurrency(other);
        return new Money(amount.add(other.amount), currency);      // a NEW Money
    }

    public Money times(int quantity) {
        return new Money(amount.multiply(BigDecimal.valueOf(quantity)), currency);
    }

    private void requireSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("cannot mix " + currency + " and " + other.currency);
        }
    }

    @Override public int compareTo(Money other) {
        requireSameCurrency(other);
        return amount.compareTo(other.amount);
    }
}

// "Change" an entity by deriving the next value — the wither pattern:
public record Subscription(String id, Plan plan, Status status, Instant renewsAt) {
    public Subscription cancelled(Instant at) {
        return new Subscription(id, plan, Status.CANCELLED, at);
    }
}

// WHY IT IS WORTH IT
//  • No defensive copies, no synchronisation: an immutable object is thread-safe.
//  • Safe as a HashMap key and in a HashSet — its hash cannot drift (chapter 41).
//  • Debugging: a value that never changes cannot be changed by "something else".
//  • The JMM guarantees other threads see FINAL fields fully initialised once the
//    constructor returns; for non-final fields it guarantees nothing without
//    synchronisation (chapter 8).`,
      },
      bullets: [
        "Many withers get unreadable. Past four or five fields, use a builder or a toBuilder() on the record — the point is controlled construction, not the syntax.",
        "Mutability is a performance decision, not a default. A parser filling a 10 MB StringBuilder or a hot loop updating an array is right to mutate; a domain type shared between threads is not.",
        "BigDecimal for money, never double: 0.1 + 0.2 is 0.30000000000000004, and rounding errors in an invoice become support tickets.",
      ],
    },
    {
      heading: "Construction order, and the object that escaped early",
      lede: "A constructor can publish a half-built object. Two bugs come from that.",
      code: {
        title: "Example — the overridable call, and the escaping `this`",
        lang: "java",
        source: `// BUG 1 — a constructor calls a method the subclass overrides.
class Report {
    private final List<String> columns;
    Report() {
        this.columns = defineColumns();      // ← subclass code runs NOW
    }
    protected List<String> defineColumns() { return List.of("id"); }
}

class SalesReport extends Report {
    private final List<String> extra = List.of("region");   // assigned AFTER super()

    @Override protected List<String> defineColumns() {
        return Stream.concat(Stream.of("id"), extra.stream()).toList();  // extra is still null
    }
}
// new SalesReport() → NullPointerException, in code that looks correct in isolation.
// Order: super() runs fully (including defineColumns) BEFORE subclass fields exist.
// Fix: make the method final or private, or pass the columns into the constructor.

// BUG 2 — 'this' escapes before the constructor finishes.
class PriceWatcher {
    private final Map<String, BigDecimal> prices = new HashMap<>();
    PriceWatcher(EventBus bus) {
        bus.subscribe(this);                 // ← another thread can call us right now
        // …still initialising…
    }
}
// Fix: a static factory that constructs first, then registers.
static PriceWatcher start(EventBus bus) {
    PriceWatcher watcher = new PriceWatcher();
    bus.subscribe(watcher);                  // fully built before anyone can see it
    return watcher;
}

// Java 25 (JEP 513) allows statements BEFORE super(...), so arguments can be
// validated or transformed without a static helper:
class Payment extends Transaction {
    Payment(BigDecimal amount) {
        if (amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");
        super(amount);                        // legal from Java 25
    }
}`,
      },
      bullets: [
        "Initialisation order within a class: static fields and static blocks once at class initialisation, then per instance — field initialisers and instance blocks in source order, then the constructor body.",
        "A field declared after a constructor that uses it is null at that moment. The compiler catches direct reads, not reads through an overridden method.",
        "Registering with a listener, executor or cache inside a constructor is the most common way to leak an unfinished object into another thread.",
      ],
    },
    {
      heading: "Nested, inner, anonymous and local classes",
      lede: "Four different things with similar syntax — and one memory leak.",
      table: {
        headers: ["Form", "Holds outer instance?", "Use for"],
        rows: [
          [
            "static nested class",
            "No",
            "A helper type that belongs to the outer class conceptually",
          ],
          [
            "inner (non-static) class",
            "Yes — implicitly",
            "Rare: iterators and views that genuinely need the outer state",
          ],
          [
            "anonymous class",
            "Yes, when non-static context",
            "One-off implementations of interfaces with several methods",
          ],
          [
            "lambda",
            "No implicit reference; captures only what it uses",
            "Functional interfaces — the default choice",
          ],
          [
            "local class / local record",
            "Depends on context",
            "A named shape used only inside one method",
          ],
        ],
      },
      code: {
        title: "Example — the listener that kept a 200 MB object alive",
        lang: "java",
        source: `class ReportPage {
    private final byte[] renderedPdf;          // ~200 MB for a large report

    // INNER class: every Refresher instance holds a hidden ReportPage.this.
    class Refresher implements Runnable {
        @Override public void run() { refresh(); }
    }

    void scheduleRefresh(ScheduledExecutorService scheduler) {
        scheduler.scheduleAtFixedRate(new Refresher(), 0, 1, TimeUnit.MINUTES);
        // The scheduler holds the Runnable forever → the Runnable holds the page
        // → the 200 MB array is never collected. A heap dump shows the chain.
    }
}

// FIX — static nested class (or a lambda) capturing only what it needs.
static final class Refresher implements Runnable {
    private final String reportId;
    private final ReportService service;
    Refresher(String reportId, ReportService service) { … }
    @Override public void run() { service.refresh(reportId); }
}

// Local records are excellent for intermediate shapes inside one method:
List<Summary> summarise(List<Order> orders) {
    record CityTotal(String city, BigDecimal total) {}      // local to this method
    return orders.stream()
        .collect(Collectors.groupingBy(Order::city,
                 Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add)))
        .entrySet().stream()
        .map(e -> new CityTotal(e.getKey(), e.getValue()))
        .sorted(Comparator.comparing(CityTotal::total).reversed())
        .map(ct -> new Summary(ct.city(), ct.total()))
        .toList();
}`,
      },
      bullets: [
        "In a lambda, this refers to the enclosing instance; in an anonymous class it refers to the anonymous object. That difference bites when copying code between the two.",
        "Captured locals must be effectively final because the lambda may outlive the stack frame — the value is copied, not shared.",
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What does encapsulation actually buy you?",
          a: "The ability to guarantee invariants. If construction validates and no method or getter lets a caller reach an inconsistent state, then every instance in the system is valid by construction, and bugs cannot be introduced from outside the class.",
        },
        {
          q: "Your class has a List field and a getter. What is wrong?",
          a: "The caller can mutate the list and break any invariant tied to it. Return List.copyOf(...) for a snapshot or an unmodifiable view, and copy the input in the constructor too, because the caller may keep a reference to the list they passed in.",
        },
        {
          q: "Why should a constructor not call an overridable method?",
          a: "The superclass constructor runs before the subclass's field initialisers, so an overridden method sees the subclass's fields uninitialised — typically null — and fails in a way that is hard to trace. Make such methods final or private, or pass the values in.",
        },
        {
          q: "How does immutability help with concurrency?",
          a: "An immutable object has no writes after construction, so there are no data races to synchronise. The Java Memory Model also guarantees that final fields are visible, fully initialised, to any thread that sees the reference — which is not true for non-final fields.",
        },
        {
          q: "When is a non-static inner class the wrong choice?",
          a: "Whenever the instance can outlive the outer object — listeners, scheduled tasks, cache entries — because the implicit outer reference keeps it alive. Use a static nested class or a lambda that captures only the data it needs.",
        },
      ],
      takeaways: [
        "Validate once, in the constructor, and the type can never be invalid.",
        "Never hand out mutable internals; copy in and copy out.",
        "Immutable by default; mutate only where a measurement says to.",
      ],
    },
  ],
  related: [
    "/java/oop",
    "/java/object-contracts",
    "/java/collections-pitfalls",
    "/lld/solid",
    "/java/advanced-topics",
  ],
  furtherReading: [
    {
      label: "Java Language Specification — classes",
      href: "https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html",
    },
    {
      label: "OpenJDK JOL — object layout tool",
      href: "https://openjdk.org/projects/code-tools/jol/",
    },
    { label: "JEP 513 — Flexible Constructor Bodies", href: "https://openjdk.org/jeps/513" },
  ],
};
