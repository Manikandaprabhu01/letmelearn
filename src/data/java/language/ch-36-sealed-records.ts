import type { Concept } from "@/data/types";

export const javaSealedRecords: Concept = {
  slug: "sealed-records",
  title: "Interfaces, Sealed Types & Records",
  subtitle:
    "Chapter 36 — contracts and default methods, closed hierarchies the compiler checks, data carriers, and pattern matching over a domain model",
  level: "advanced",
  minutes: 30,
  tags: [
    "interfaces",
    "sealed classes",
    "records",
    "pattern matching",
    "domain modelling",
    "java 21",
  ],
  summary:
    "Sealed interfaces plus records give Java algebraic data types: a fixed set of shapes, each holding exactly its own data, with a switch the compiler proves exhaustive. Modelling outcomes this way replaces the usual bag of nullable fields and boolean flags, and it turns “did we handle that case?” from a code review question into a compile error.",
  keyPoints: [
    "Default methods let an interface evolve without breaking implementors; they are not a substitute for state.",
    "sealed fixes the set of subtypes, so switch can be exhaustive without a default branch.",
    "A record is a transparent carrier for its components: constructor, accessors, equals, hashCode and toString come free.",
    "Record patterns destructure in switch and instanceof, including nested shapes.",
    "Add a new permitted subtype and every non-exhaustive switch stops compiling — exactly what you want.",
  ],
  prerequisites: ["/java/oop", "/java/inheritance-polymorphism"],
  sections: [
    {
      heading: "Interfaces as contracts",
      lede: "Default, static and private methods — and when each is right.",
      code: {
        title: "Example — evolving an interface without breaking implementors",
        lang: "java",
        source: `public interface PriceSource {
    Money price(String sku);                                   // abstract: the contract

    // Added in v2. A default keeps the six existing implementations compiling.
    default Map<String, Money> prices(Collection<String> skus) {
        return skus.stream().collect(Collectors.toMap(sku -> sku, this::price));
    }

    // static: a factory that belongs with the type, not with any implementation.
    static PriceSource fixed(Money everything) {
        return sku -> everything;
    }

    // private: shared helper for the default methods; invisible to implementors.
    private static void requireSku(String sku) {
        if (sku == null || sku.isBlank()) throw new IllegalArgumentException("sku");
    }
}

// DIAMOND RULE: a class inheriting the same default from two interfaces must
// override it. The compiler will not choose for you.
interface Cached  { default String describe() { return "cached"; } }
interface Remote  { default String describe() { return "remote"; } }
class CachedRemote implements Cached, Remote {
    @Override public String describe() { return Remote.super.describe(); }   // pick explicitly
}
// Class wins over interface: a method inherited from a superclass beats any
// interface default of the same signature.`,
      },
      bullets: [
        "Use a default method to add behaviour that can be expressed in terms of the other methods, or to keep source compatibility. Do not use it to smuggle in state — interfaces have no fields.",
        "A functional interface is simply one abstract method; @FunctionalInterface makes the compiler enforce that so a later addition does not silently break every lambda.",
        "Marker interfaces (no methods) still have a use where an annotation cannot: they create a type, so the compiler can require it.",
      ],
    },
    {
      heading: "Sealed hierarchies: a set the compiler knows",
      lede: "The difference between “some subclasses” and “exactly these”.",
      code: {
        title: "Example — modelling a payment outcome",
        lang: "java",
        source: `// BEFORE — one class, nullable fields, and rules that live in comments.
class PaymentResult {
    boolean success;
    String receiptId;        // only when success
    String declineCode;      // only when !success
    String redirectUrl;      // only for 3-D Secure
    Instant retryAfter;      // only when the gateway was busy
}
// Every consumer re-derives "which combination am I in?", and gets it subtly wrong.

// AFTER — the shapes are the model.
public sealed interface PaymentResult
        permits Captured, Declined, RequiresAction, GatewayBusy {}

public record Captured(String receiptId, Money amount, Instant at) implements PaymentResult {}
public record Declined(String code, String reason) implements PaymentResult {}
public record RequiresAction(URI redirect, Duration expiresIn) implements PaymentResult {}
public record GatewayBusy(Duration retryAfter) implements PaymentResult {}

// Each case carries exactly the data it needs — and nothing it does not.
// permits can be omitted when the subtypes are in the same file (or same package
// for an unnamed module); subtypes must be final, sealed, or explicitly non-sealed.`,
      },
      diagram: {
        kind: "compare",
        caption: "Two ways to say “one of several outcomes”.",
        options: [
          {
            title: "Enum + fields",
            sub: "status plus optional data",
            good: ["Familiar", "Trivially serialisable"],
            bad: [
              "Illegal combinations are representable",
              "Every reader repeats the same null checks",
              "Adding a case compiles everywhere — and breaks at runtime",
            ],
            verdict: "Fine for a flat status with no per-case data.",
          },
          {
            title: "Sealed interface + records",
            sub: "one type per outcome",
            good: [
              "Illegal states cannot be constructed",
              "switch is checked for exhaustiveness",
              "Each case names its own data",
            ],
            bad: ["More types", "Needs a mapping layer for JSON/JPA"],
            verdict: "The default for domain outcomes on Java 17+.",
            tone: "ok",
          },
        ],
      },
    },
    {
      heading: "Records: transparent carriers",
      lede: "What you get, what you must still write, and what a record must not be.",
      code: {
        title: "Example — validation, normalisation and the traps",
        lang: "java",
        source: `public record OrderLine(String sku, int quantity, Money unitPrice) {

    // Compact constructor: validate and normalise BEFORE the fields are assigned.
    public OrderLine {
        Objects.requireNonNull(sku, "sku");
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        sku = sku.trim().toUpperCase(Locale.ROOT);       // assigning the parameter is the idiom
    }

    // Derived data is a method, not a component.
    public Money lineTotal() { return unitPrice.times(quantity); }

    // Static factories read better than overloaded constructors.
    public static OrderLine single(String sku, Money price) { return new OrderLine(sku, 1, price); }
}

// FREE: private final fields, accessors sku()/quantity()/unitPrice(), equals and
// hashCode over all components, toString, and deconstruction in patterns.

// TRAPS
//  • Shallow immutability: a record holding a List is mutable through that list.
//    Copy it in the compact constructor: lines = List.copyOf(lines).
//  • Arrays as components compare by identity — equals/hashCode will surprise you.
//  • A record is not a JPA entity: entities need identity, a no-arg constructor
//    and mutability. Use records for DTOs, value objects, events and query results.
//  • Records are final and cannot extend a class — by design.`,
      },
      bullets: [
        "Records are serialisable in a safer way than ordinary classes: deserialization runs the canonical constructor, so validation cannot be bypassed — unlike classic Java serialization (chapter 9).",
        "For a record with many components, a nested Builder is still fine; the record stays the immutable result.",
        "Local records (inside a method) are the neatest way to name an intermediate tuple in a stream pipeline.",
      ],
    },
    {
      heading: "Pattern matching over the model",
      lede: "Where sealed types and records pay off — one switch, checked by the compiler.",
      code: {
        title: "Example — one outcome, three transports",
        lang: "java",
        source: `// HTTP layer: map an outcome to a response. No default branch — the compiler
// verifies every permitted subtype is covered (Java 21: JEP 441 + record patterns).
ResponseEntity<?> toResponse(PaymentResult result) {
    return switch (result) {
        case Captured(String receipt, Money amount, var at) ->
            ResponseEntity.ok(new PaidResponse(receipt, amount.toString(), at));

        case Declined(String code, String reason) when "insufficient_funds".equals(code) ->
            ResponseEntity.unprocessableEntity().body(ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY, "Your card has insufficient funds."));

        case Declined(String code, String reason) ->
            ResponseEntity.unprocessableEntity().body(ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY, reason));

        case RequiresAction(URI redirect, Duration expiresIn) ->
            ResponseEntity.status(HttpStatus.SEE_OTHER).location(redirect).build();

        case GatewayBusy(Duration retryAfter) ->
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header("Retry-After", String.valueOf(retryAfter.toSeconds())).build();
    };
}

// Nested patterns destructure a graph in one line:
String describe(Object event) {
    return switch (event) {
        case OrderPlaced(var id, Customer(var name, _), List<OrderLine> lines) when lines.size() > 5 ->
            "bulk order " + id + " from " + name;
        case OrderPlaced(var id, Customer(var name, _), var lines) ->
            "order " + id + " from " + name + " (" + lines.size() + " lines)";
        case null -> "no event";                     // switch can match null explicitly
        default -> "unhandled: " + event.getClass().getSimpleName();
    };
}
// The underscore is an unnamed pattern (JEP 456, final in Java 22): "a component
// is here and I do not need it".

// ADDING A CASE: add PartiallyCaptured to the permits clause and every exhaustive
// switch in the codebase fails to compile, listing exactly what to handle. That
// is the property you are buying.`,
      },
      callout: {
        kind: "interview",
        title: "Sealed types versus the visitor pattern",
        text: "Visitor solved the same problem before Java had sealed types: a fixed set of shapes, and a compile error when a new one is added. Pattern matching gives the same guarantee without the double-dispatch boilerplate, and it keeps the logic at the call site instead of scattering it across visit methods.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What problem do sealed types solve?",
          a: "They close a hierarchy, so the compiler knows every subtype. That makes switch exhaustiveness checkable: you can drop the default branch, and adding a new subtype turns every place that must change into a compile error rather than a runtime surprise.",
        },
        {
          q: "When would you use a record, and when not?",
          a: "Use one for a transparent value: DTOs, events, query results, value objects such as Money. Avoid one where identity and mutability matter — JPA entities, objects with lifecycle state — or where you need to hide or derive the representation, since a record's components are its public API.",
        },
        {
          q: "Are records immutable?",
          a: "Their component fields are final, so the references cannot be reassigned, but what they point at can still be mutable. A record holding a List or an array is only as immutable as what you put in it, so copy defensively in the compact constructor.",
        },
        {
          q: "Why can a default method not have state?",
          a: "Interfaces have no instance fields; a default method can only use the type's own abstract methods and its arguments. That keeps multiple inheritance of behaviour without multiple inheritance of state, which is what makes the diamond problem tractable — the compiler only has to make you choose an implementation.",
        },
        {
          q: "How would you model an operation that can succeed, fail, or need more input?",
          a: "A sealed interface with a record per outcome, each carrying only its own data, and a switch at each boundary that maps the outcome to a response. It removes nullable fields, makes illegal combinations unrepresentable, and makes new outcomes a compile-time task.",
        },
      ],
      takeaways: [
        "Model outcomes as types, not as flags plus nullable fields.",
        "sealed buys exhaustiveness; records buy transparency; patterns read them.",
        "Records are shallowly immutable — copy mutable components in.",
      ],
    },
  ],
  related: [
    "/java/oop",
    "/java/inheritance-polymorphism",
    "/java/java-17-to-21",
    "/java/objects-encapsulation",
    "/lld/strategy",
  ],
  furtherReading: [
    { label: "JEP 409 — Sealed Classes", href: "https://openjdk.org/jeps/409" },
    { label: "JEP 440 — Record Patterns", href: "https://openjdk.org/jeps/440" },
    { label: "JEP 441 — Pattern Matching for switch", href: "https://openjdk.org/jeps/441" },
  ],
};
