import type { Concept } from "@/data/types";

export const javaEightFeatures: Concept = {
  slug: "java-8-features",
  title: "Java 8: The Release That Changed the Language",
  subtitle:
    "Chapter 44 — lambdas and functional interfaces, method references, default methods, Optional done right, and java.time",
  level: "intermediate",
  minutes: 28,
  tags: [
    "java 8",
    "lambdas",
    "functional interfaces",
    "optional",
    "java.time",
    "completablefuture",
  ],
  summary:
    "Java 8 (2014) is still the baseline most codebases share: lambdas made behaviour a parameter, default methods let interfaces evolve, streams replaced loops that only existed to build lists, Optional gave absence a type, and java.time finally replaced Date and Calendar. Everything after 8 refines this foundation, so it pays to know exactly what each piece buys.",
  keyPoints: [
    "A lambda is an instance of a functional interface, linked at runtime by invokedynamic — not an anonymous class.",
    "Captured locals must be effectively final because the lambda can outlive the frame.",
    "Default methods exist to evolve interfaces without breaking implementors.",
    "Optional is a return type, not a field, parameter or collection element.",
    "java.time separates instants, local dates and zoned times — the distinction Date never made.",
  ],
  prerequisites: ["/java/basics", "/java/oop"],
  sections: [
    {
      heading: "Lambdas and functional interfaces",
      code: {
        title: "Example — behaviour as a parameter, and the interfaces to know",
        lang: "java",
        source: `// BEFORE: an interface, an anonymous class, five lines of ceremony per policy.
orders.sort(new Comparator<Order>() {
    @Override public int compare(Order a, Order b) { return a.total().compareTo(b.total()); }
});

// AFTER: the behaviour, and nothing else.
orders.sort(Comparator.comparing(Order::total));

// The four shapes that cover most APIs:
Predicate<Order>            isPaid      = Order::isPaid;             //  T -> boolean
Function<Order, String>     toId        = Order::id;                 //  T -> R
Consumer<Order>             audit       = auditLog::record;          //  T -> void
Supplier<Connection>        connection  = pool::acquire;             //  () -> T
BiFunction<Money, Money, Money> add     = Money::plus;               //  (T, U) -> R
UnaryOperator<String>       trim        = String::trim;              //  T -> T

// Primitive variants avoid boxing in hot code: IntPredicate, ToLongFunction,
// IntUnaryOperator, DoubleBinaryOperator …

// FOUR KINDS OF METHOD REFERENCE
Order::isPaid              // instance method of the parameter
auditLog::record           // instance method of a captured object
Integer::parseInt          // static method
Order::new                 // constructor

// CAPTURE: only effectively final locals. This does not compile —
int count = 0;
orders.forEach(o -> count++);        // "local variables referenced from a lambda must be final"
// …and that is a feature: the lambda may run later, or on another thread. Use a
// stream reduction, or an AtomicInteger when you genuinely need shared mutation.
long paid = orders.stream().filter(Order::isPaid).count();

// @FunctionalInterface documents intent and makes the compiler enforce one abstract
// method, so adding a second later fails at the definition rather than at every lambda.
@FunctionalInterface
interface RetryPolicy { Duration backoff(int attempt); }`,
      },
      bullets: [
        "A lambda is not compiled to an inner class: invokedynamic links the call site on first use, so there is no class file per lambda and the JIT can inline through it.",
        "In a lambda, this is the enclosing instance — unlike an anonymous class, where this is the anonymous object.",
        "Method references are usually clearer than the equivalent lambda, except when the argument order is not obvious.",
      ],
    },
    {
      heading: "Default and static interface methods",
      code: {
        title: "Example — why they were added, with the real case from the JDK",
        lang: "java",
        source: `// Java 8 needed to add stream() to every Collection without breaking the thousands
// of classes that implement it. A default method made that possible:
public interface Collection<E> extends Iterable<E> {
    default Stream<E> stream() { return StreamSupport.stream(spliterator(), false); }
    default boolean removeIf(Predicate<? super E> filter) { … }
}

// Your own APIs get the same escape hatch:
public interface AuditSink {
    void record(AuditEvent event);

    default void recordAll(Collection<AuditEvent> events) {   // added in v2, nothing breaks
        events.forEach(this::record);
    }

    static AuditSink noop() { return event -> { }; }          // a factory on the type itself
}

// The limits are deliberate: no fields, no constructors, and a class always wins
// over an interface default. Two interfaces offering the same default force the
// implementing class to choose explicitly (chapter 36).`,
      },
    },
    {
      heading: "Optional, used the way it was designed",
      code: {
        title: "Example — the good uses, and the three misuses",
        lang: "java",
        source: `// GOOD — a return type that says "there may be no value", with composition:
Optional<Customer> findByEmail(String email);

String label = findByEmail(email)
    .map(Customer::displayName)
    .filter(name -> !name.isBlank())
    .orElseGet(() -> "guest-" + email.hashCode());     // orElseGet: lazy

findByEmail(email).ifPresentOrElse(this::greet, this::promptSignUp);

Customer customer = findByEmail(email)
    .orElseThrow(() -> new CustomerNotFoundException(email));

// MISUSE 1 — as a field or parameter. It is not Serializable, it adds a wrapper per
// instance, and "Optional parameter" just means two overloads would be clearer.
class Order { private Optional<String> coupon; }            // no
void apply(Optional<String> coupon) { }                     // no — overload instead

// MISUSE 2 — Optional<List<T>>. An empty list already means "nothing"; two ways to
// say the same thing means every caller checks twice.

// MISUSE 3 — get() without a check. isPresent() + get() is the null check you were
// trying to escape; orElseThrow() with a meaningful exception is the honest version.
if (found.isPresent()) { use(found.get()); }                // no
found.ifPresent(this::use);                                 // yes

// Streams and Optional meet cleanly:
List<String> names = customers.stream()
    .map(Customer::preferredName)          // Optional<String>
    .flatMap(Optional::stream)             // Java 9+: drops the empties
    .toList();`,
      },
    },
    {
      heading: "java.time: the API that replaced Date and Calendar",
      code: {
        title: "Example — choosing the right type, and the bug that types prevent",
        lang: "java",
        source: `// THE OLD PROBLEMS: java.util.Date is mutable, has no time zone, counts months from
// zero and years from 1900; SimpleDateFormat is not thread-safe and has caused more
// than one production incident when shared as a static field.

// THE TYPES, and what each one means:
Instant   happenedAt = Instant.now();                 // a moment on the timeline, UTC
LocalDate invoiceDate = LocalDate.of(2026, 4, 1);     // a date with no time, no zone
LocalTime opensAt    = LocalTime.of(9, 30);           // a wall-clock time, no date
LocalDateTime local  = LocalDateTime.of(invoiceDate, opensAt);   // still no zone
ZonedDateTime meeting = local.atZone(ZoneId.of("Asia/Kolkata")); // a real instant
Duration  timeout    = Duration.ofSeconds(30);        // machine time
Period    trial      = Period.ofDays(14);             // human time — months vary in length

// STORE Instant (or a timestamptz), DISPLAY in the viewer's zone:
ZonedDateTime shown = happenedAt.atZone(user.zone());

// Why the distinction matters: "the invoice run at 02:30 on 26 October" can be
// ambiguous or non-existent in a zone with daylight saving. ZonedDateTime applies
// the zone rules explicitly; LocalDateTime cannot, and Date silently used the
// server's default zone — which changes when you deploy to a different region.

// Arithmetic is immutable and reads like the intent:
Instant deadline = happenedAt.plus(Duration.ofHours(48));
LocalDate nextBilling = invoiceDate.plusMonths(1).withDayOfMonth(1);
boolean overdue = Instant.now().isAfter(deadline);

// Formatting is thread-safe (DateTimeFormatter is immutable):
static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

// Testability: inject a Clock instead of calling now() directly.
class BillingService {
    private final Clock clock;
    BillingService(Clock clock) { this.clock = clock; }
    boolean isDue(Invoice invoice) { return Instant.now(clock).isAfter(invoice.dueAt()); }
}
// Tests then use Clock.fixed(...), and "it only fails at month end" stops being a mystery.`,
      },
      bullets: [
        "CompletableFuture also arrived in 8: thenApply, thenCompose and allOf compose asynchronous work without callback nesting. Chapter 28 covers where it fits now that virtual threads exist.",
        "Other useful additions: StringJoiner, Map.getOrDefault, Comparator.comparing chains, Arrays.parallelSort, and repeatable annotations.",
      ],
      callout: {
        kind: "insight",
        title: "What Java 8 actually bought",
        text: "Behaviour became a value you can pass, store and compose. That is why the collections API could grow stream(), why Spring could take a lambda instead of a callback interface, and why most “design patterns” written for Java 6 collapse into one line today.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "Is a lambda just syntax for an anonymous inner class?",
          a: "No. It is compiled to an invokedynamic call site linked by LambdaMetafactory at runtime, so there is no extra class file per lambda and this refers to the enclosing instance. An anonymous class creates a real class with its own identity.",
        },
        {
          q: "Why must captured variables be effectively final?",
          a: "The lambda can outlive the method call and run on another thread, so the value is copied rather than shared. Allowing mutation would give two different notions of the same variable and reintroduce data races that the compiler cannot check.",
        },
        {
          q: "When should a method return Optional?",
          a: "When absence is a normal outcome the caller must handle — a lookup that may find nothing. Not for fields, parameters or collections, and never as a wrapper around a list, since an empty list already expresses emptiness.",
        },
        {
          q: "Why was java.time added when Date already existed?",
          a: "Date is mutable, conflates an instant with a calendar date, has no zone, and its formatter is not thread-safe. java.time separates Instant, LocalDate, LocalDateTime and ZonedDateTime, is immutable throughout, and makes zone rules and daylight saving explicit rather than implicit in the server's default.",
        },
        {
          q: "What is the advantage of default methods?",
          a: "Interface evolution: new behaviour can be added to a published interface without breaking every implementor, which is how Collection gained stream() and removeIf(). They also let an interface supply useful behaviour derived from its abstract methods.",
        },
      ],
      takeaways: [
        "Behaviour as a parameter is the whole idea; the rest follows.",
        "Optional for returns, never for fields or parameters.",
        "Instant for when it happened, LocalDate for a date, Zoned for people.",
      ],
    },
  ],
  related: [
    "/java/java-8",
    "/java/streams-collectors",
    "/java/java-9-to-17",
    "/java/sealed-records",
    "/java/multithreading",
  ],
  furtherReading: [
    {
      label: "Java Tutorials — lambda expressions",
      href: "https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html",
    },
    {
      label: "Javadoc — java.time",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/time/package-summary.html",
    },
  ],
};
