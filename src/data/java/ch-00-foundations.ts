import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaFoundations: Concept[] = [
  {
    slug: "how-to-use-this-guide",
    title: "How to Use This Guide",
    subtitle: "Chapter 0 — the path through forty-nine chapters, and what to skip",
    level: "foundational",
    minutes: 10,
    tags: ["orientation", "roadmap"],
    summary:
      "Forty-nine chapters is a lot, and reading them in order front to back is the slowest route to being useful. This page is the map: which chapters are load-bearing, which are reference material you look up when you hit them, and the order that gets you writing production Spring Boot services fastest.",
    keyPoints: [
      "Chapters 1, 2, 6 and 14 are the core — everything else assumes them.",
      "Chapters 3 and 4 are where real backend bugs come from: concurrency and error handling.",
      "Chapters 13 and 18 are the ones that pay the bills; get there as fast as the fundamentals allow.",
      "Chapters 5, 9, 10 and 11 are reference — read when a task demands them, not before.",
      "Chapters 20–33 go deep on Spring Boot in production — start with 24 (transactions), 25 (JPA) and 28 (threads) once your first service ships.",
      "Chapters 34–48 are the language itself in depth: objects and generics, collections internals and pitfalls, and what each Java release from 8 to 26 added.",
    ],
    sections: [
      {
        heading: "The order that actually works",
        lede: "Front-to-back is not the fastest path to writing a service.",
        table: {
          caption: "Three passes rather than one linear read.",
          headers: ["Pass", "Chapters", "Goal"],
          rows: [
            [
              "1 — Language core",
              "1 Basics, 2 OOP, 6 Collections, 7 Strings, 14 Java 8",
              "Write correct, idiomatic Java",
            ],
            [
              "2 — Backend reality",
              "4 Exceptions, 3 Multithreading, 12 Testing, 11 JDBC",
              "Survive production",
            ],
            [
              "3 — Framework and ship",
              "13 Web Dev, 18 Spring, 16 Security, 19 Docker, 17 Cloud",
              "Deliver a running service",
            ],
            [
              "4 — Spring Boot in depth",
              "24 Transactions, 25 JPA, 28 Threads, 31 Resilience, 32 Observability — then the rest of 20–33",
              "Run it well in production",
            ],
            [
              "5 — The language in depth",
              "34–38 OOP, 39–43 Collections, 44–48 the Java releases",
              "Know why, not just how",
            ],
            [
              "Reference",
              "5 Network, 8 Advanced, 9 File I/O, 10 Annotations, 15 Patterns",
              "Look up when needed",
            ],
          ],
        },
        bullets: [
          "If you already write another backend language, start at chapter 2 (OOP) and chapter 14 (Java 8) — those are where Java's idioms differ most from what you know.",
          "Do not read design patterns (15) early. Patterns learned before you have felt the problem become cargo cult; Spring will teach you several of them implicitly.",
          "Chapter 10 (annotations and reflection) is best read *after* Spring, because Spring is the reason those features matter.",
        ],
        links: [
          { label: "Official Java documentation", href: "https://docs.oracle.com/en/java/" },
          { label: "Spring Boot — official guides", href: "https://spring.io/guides" },
        ],
      },
      {
        heading: "What this guide assumes and what it does not",
        bullets: [
          "It assumes you can program — variables, loops, functions — in some language. It does not assume Java.",
          "Examples target a modern LTS Java (17 or 21). Where a feature is newer than 17, it is marked.",
          "Spring Boot 3.x is assumed for the framework chapters, which means Jakarta EE namespaces rather than the older javax.",
          "Where this site already covers a topic from a system-design angle — caching, queues, consistency — the Java chapters link across rather than repeat.",
        ],
        links: [
          { label: "Site: HLD concepts", href: "/hld" },
          { label: "Site: LLD concepts", href: "/lld" },
        ],
      },
    ],
    related: ["/java/basics", "/java/oop", "/java/objects-encapsulation", "/java/spring-framework"],
    furtherReading: [
      { label: "Oracle — Java SE documentation", href: "https://docs.oracle.com/en/java/" },
      { label: "Baeldung — Java and Spring tutorials", href: "https://www.baeldung.com/" },
    ],
  },

  {
    slug: "basics",
    title: "Java Basics",
    subtitle: "Chapter 1 — types, control flow, the JVM, and how a Java program actually runs",
    level: "foundational",
    minutes: 22,
    tags: ["jvm", "types", "syntax", "memory"],
    summary:
      "The syntax is the easy part and you will pick it up in an afternoon. What matters is the execution model underneath — compilation to bytecode, the JVM, the stack and heap split, and the primitive/reference distinction that explains a large share of surprising behaviour later.",
    keyPoints: [
      "Java compiles to bytecode, which the JVM interprets and then JIT-compiles — that is why it starts slow and gets fast.",
      "Primitives hold values; references hold addresses. Almost every 'why did that change?' bug traces back to this.",
      "Java is always pass-by-value — including for references, which is the subtlety people misremember.",
      "Strings are immutable, and that single fact drives the StringBuilder rule in chapter 7.",
    ],
    sections: [
      {
        heading: "How a Java program runs",
        lede: "Source → bytecode → JVM → JIT-compiled machine code.",
        diagram: {
          kind: "flow",
          caption: "The two-stage model is why Java is portable and why it warms up.",
          rows: [
            [
              { id: "src", label: "Foo.java", sub: "source" },
              { id: "javac", label: "javac", sub: "compiler" },
              { id: "bc", label: "Foo.class", sub: "bytecode", tone: "accent" },
            ],
            [
              { id: "jvm", label: "JVM", sub: "loads + verifies" },
              { id: "interp", label: "Interpreter", sub: "runs immediately" },
              { id: "jit", label: "JIT", sub: "hot paths → native", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "Bytecode is portable: the same .class runs on any JVM. That is the original 'write once, run anywhere' claim and it broadly holds.",
          "The JIT compiles methods that run often, which is why a benchmark's first thousand iterations are meaningless — always warm up before measuring.",
          "The JVM verifies bytecode before running it, which is a real security property and why arbitrary bytecode cannot simply corrupt memory.",
        ],
        links: [
          {
            label: "YouTube search — how the JVM works, bytecode and JIT",
            href: YT("how JVM works bytecode JIT compiler explained"),
          },
        ],
      },
      {
        heading: "Primitives, references, and pass-by-value",
        lede: "The distinction that explains the most confusing early bugs.",
        code: {
          title: "Example — what actually gets copied when you call a method",
          lang: "java",
          source: `public class PassByValue {
    static void reassign(StringBuilder sb) {
        sb = new StringBuilder("reassigned");   // changes the LOCAL copy of the reference
    }

    static void mutate(StringBuilder sb) {
        sb.append(" mutated");                  // follows the reference, changes the OBJECT
    }

    public static void main(String[] args) {
        StringBuilder a = new StringBuilder("original");
        reassign(a);
        System.out.println(a);   // "original"          ← reassignment did NOT escape
        mutate(a);
        System.out.println(a);   // "original mutated"  ← mutation DID

        int x = 5;
        increment(x);
        System.out.println(x);   // 5 — primitives are copied wholesale
    }
    static void increment(int n) { n++; }
}

// THE RULE: Java is always pass-by-value. For a reference type, the VALUE
// being copied is the reference itself. So you can change what the object
// contains, but you cannot change which object the caller's variable points at.`,
        },
        table: {
          caption: "The eight primitives, and the reference types that wrap them.",
          headers: ["Primitive", "Size", "Wrapper", "Watch out"],
          rows: [
            [
              "int",
              "32-bit",
              "Integer",
              "Integer caches −128..127 — == works by accident in that range",
            ],
            ["long", "64-bit", "Long", "Literals need the L suffix: 10000000000L"],
            ["double", "64-bit", "Double", "Never use for money — use BigDecimal"],
            ["boolean", "JVM-dependent", "Boolean", "Cannot cast to/from int, unlike C"],
            ["char", "16-bit", "Character", "UTF-16 code unit, not a full character"],
            [
              "byte / short / float",
              "8 / 16 / 32",
              "Byte / Short / Float",
              "Rarely used directly; mostly I/O and interop",
            ],
          ],
        },
        callout: {
          kind: "warn",
          title: "== versus .equals()",
          text: "For references, == compares identity — are these the same object — while .equals() compares value. Integer caches small values, so Integer a = 127, b = 127 gives a == b true, but at 128 it becomes false. This produces bugs that only appear with larger data. Use .equals() for objects, always, and == only for primitives and deliberate identity checks.",
        },
        links: [
          {
            label: "YouTube search — Java pass by value vs reference explained",
            href: YT("java pass by value vs pass by reference explained"),
          },
          {
            label: "Baeldung — == vs equals in Java",
            href: "https://www.baeldung.com/java-equals-method-operator-difference",
          },
        ],
      },
      {
        heading: "Stack, heap and garbage collection",
        lede: "Where your data lives determines its lifetime and its cost.",
        bullets: [
          "The stack holds method frames, local primitives and references. It is per-thread, fast, and automatically unwound — a StackOverflowError means recursion without a base case.",
          "The heap holds objects, shared across threads, and is managed by the garbage collector. An OutOfMemoryError means live objects exceeded the heap, usually a leak rather than genuine demand.",
          "You never free memory manually, but you can leak it: a static collection that only ever grows, or a listener never unregistered, keeps objects reachable and therefore uncollectable.",
          "Modern collectors (G1, ZGC) make pause times largely a non-issue for typical services — but in AI or data workloads a multi-gigabyte heap still deserves attention.",
        ],
        links: [
          {
            label: "YouTube search — JVM memory model heap stack garbage collection",
            href: YT("JVM memory model heap stack garbage collection explained"),
          },
        ],
      },
    ],
    related: ["/java/oop", "/java/collections", "/java/exception-handling"],
    furtherReading: [
      { label: "Oracle — The Java Tutorials", href: "https://docs.oracle.com/javase/tutorial/" },
      { label: "Baeldung — Java basics", href: "https://www.baeldung.com/java-tutorial" },
    ],
  },

  {
    slug: "oop",
    title: "Object-Oriented Programming",
    subtitle:
      "Chapter 2 — classes, interfaces, inheritance, polymorphism, and when composition wins",
    level: "foundational",
    minutes: 26,
    tags: ["oop", "interfaces", "inheritance", "polymorphism", "records"],
    summary:
      "Java is unapologetically object-oriented, and the four pillars get recited constantly. What matters in practice is narrower: program to interfaces, prefer composition to inheritance, and understand exactly what equals, hashCode and immutability buy you — because collections and frameworks depend on all three.",
    keyPoints: [
      "Interfaces define capability; classes provide it. Depend on the interface so implementations stay swappable.",
      "Inheritance is the most overused tool in Java — composition is usually the better answer.",
      "equals and hashCode must agree, or HashMap silently loses your objects.",
      "Records give you immutable data carriers with correct equals/hashCode for free.",
    ],
    prerequisites: ["/java/basics"],
    sections: [
      {
        heading: "Interfaces, abstract classes and when each fits",
        lede: "The decision comes down to whether you are sharing a contract or sharing code.",
        code: {
          title: "Example — the same design, contract-first",
          lang: "java",
          source: `// The CONTRACT — what callers depend on. No implementation detail leaks.
public interface PaymentProcessor {
    PaymentResult charge(Money amount, Card card);

    // default methods let you add behaviour without breaking implementers —
    // this is how Java evolved Collection without breaking the world.
    default PaymentResult chargeWithRetry(Money amount, Card card) {
        try {
            return charge(amount, card);
        } catch (TransientPaymentException e) {
            return charge(amount, card);
        }
    }
}

// An abstract class is right when implementations share real STATE or logic.
public abstract class AbstractProcessor implements PaymentProcessor {
    protected final AuditLog audit;                 // shared state
    protected AbstractProcessor(AuditLog audit) { this.audit = audit; }

    @Override
    public PaymentResult charge(Money amount, Card card) {
        audit.record("charge.attempt", amount);     // shared behaviour
        PaymentResult r = doCharge(amount, card);   // template method
        audit.record("charge.result", r);
        return r;
    }
    protected abstract PaymentResult doCharge(Money amount, Card card);
}

// Callers depend on the INTERFACE, so Stripe, Adyen or a test double all fit.
public class Checkout {
    private final PaymentProcessor processor;       // not StripeProcessor
    public Checkout(PaymentProcessor processor) { this.processor = processor; }
}`,
        },
        table: {
          caption: "Choosing between them.",
          headers: ["Need", "Use", "Why"],
          rows: [
            [
              "A contract many unrelated types implement",
              "Interface",
              "A class can implement many interfaces",
            ],
            [
              "Shared state or a common algorithm",
              "Abstract class",
              "Only single inheritance, so spend it wisely",
            ],
            [
              "Add behaviour without breaking implementers",
              "Interface default method",
              "How Java added streams to Collection",
            ],
            [
              "Immutable data with equals/hashCode",
              "Record",
              "No boilerplate, correct by construction",
            ],
            ["A fixed set of instances", "Enum", "Type-safe, can carry state and methods"],
          ],
        },
        links: [
          {
            label: "Baeldung — interface vs abstract class",
            href: "https://www.baeldung.com/java-interface-vs-abstract-class",
          },
          {
            label: "YouTube search — Java interfaces abstract classes explained",
            href: YT("java interface vs abstract class explained tutorial"),
          },
        ],
      },
      {
        heading: "equals, hashCode and the HashMap contract",
        lede: "Get this wrong and your objects vanish inside collections.",
        code: {
          title: "Example — the bug, and the two ways to avoid it",
          lang: "java",
          source: `// BROKEN — equals overridden, hashCode forgotten.
class UserBroken {
    final String email;
    UserBroken(String email) { this.email = email; }
    @Override public boolean equals(Object o) {
        return o instanceof UserBroken u && u.email.equals(email);
    }
    // no hashCode() → inherits Object's identity hash
}

Set<UserBroken> set = new HashSet<>();
set.add(new UserBroken("a@b.com"));
set.contains(new UserBroken("a@b.com"));   // FALSE — different bucket, never compared

// THE CONTRACT: equal objects MUST have equal hash codes. HashMap uses the
// hash to pick a bucket and only calls equals within that bucket, so an
// inconsistent hashCode means equals is never reached.

// FIX 1 — implement both, consistently
class User {
    final String email;
    User(String email) { this.email = email; }
    @Override public boolean equals(Object o) {
        return o instanceof User u && u.email.equals(email);
    }
    @Override public int hashCode() { return Objects.hash(email); }
}

// FIX 2 — a record, which generates both correctly from the components
record UserRecord(String email) { }        // equals, hashCode, toString: free`,
        },
        bullets: [
          "Use the same fields in equals and hashCode, and prefer immutable fields — mutating a field used in hashCode after insertion strands the object in the wrong bucket.",
          "Records are the right default for value types: immutable, correct equals/hashCode, concise. Use a class when you need mutability or inheritance.",
          "Never use a mutable object as a HashMap key unless you are certain the key fields never change.",
        ],
        links: [
          {
            label: "Baeldung — equals and hashCode contract",
            href: "https://www.baeldung.com/java-equals-hashcode-contracts",
          },
          {
            label: "YouTube search — Java equals hashCode HashMap explained",
            href: YT("java equals hashCode contract hashmap explained"),
          },
        ],
      },
      {
        heading: "Composition over inheritance",
        lede: "The most valuable OOP judgment in day-to-day Java.",
        diagram: {
          kind: "compare",
          caption: "Both reuse code. One couples you permanently.",
          options: [
            {
              title: "Inheritance",
              sub: "class Duck extends Bird",
              good: ["Very little code to write", "Natural for genuine is-a relationships"],
              bad: [
                "Only one superclass — you spend it once",
                "Subclass breaks when the superclass changes (fragile base class)",
                "Inherits everything, including what you did not want",
              ],
              verdict: "For a genuine, stable is-a hierarchy you control.",
            },
            {
              title: "Composition",
              sub: "class Duck { private Flight flight; }",
              tone: "ok",
              good: [
                "Combine as many behaviours as you like",
                "Swap implementations at runtime, including test doubles",
                "Expose only what you choose to delegate",
              ],
              bad: ["A little more code — delegating methods"],
              verdict:
                "The default. Reach for inheritance only when composition is genuinely awkward.",
            },
          ],
        },
        bullets: [
          "The classic smell is a subclass overriding methods to disable inherited behaviour — that means the is-a relationship was false.",
          "Spring is built on composition: you inject collaborators rather than extending framework base classes, which is why Spring code is testable.",
          "Sealed interfaces (Java 17+) give you a closed set of implementations when you genuinely want to enumerate all cases.",
        ],
        links: [
          { label: "Site: SOLID principles worked through", href: "/lld/solid" },
          {
            label: "YouTube search — composition over inheritance Java",
            href: YT("composition over inheritance java explained"),
          },
        ],
      },
    ],
    related: [
      "/java/objects-encapsulation",
      "/java/inheritance-polymorphism",
      "/java/sealed-records",
      "/java/object-contracts",
      "/lld/solid",
    ],
    furtherReading: [
      { label: "Baeldung — Java OOP", href: "https://www.baeldung.com/java-oop" },
      {
        label: "Oracle — Records",
        href: "https://docs.oracle.com/en/java/javase/17/language/records.html",
      },
    ],
  },
];
