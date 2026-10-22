import type { Concept } from "@/data/types";

export const javaInheritance: Concept = {
  slug: "inheritance-polymorphism",
  title: "Inheritance, Polymorphism & Dispatch",
  subtitle:
    "Chapter 35 — what the JVM does at a call site, overriding versus overloading, the fragile base class, and where inheritance still earns its place",
  level: "advanced",
  minutes: 28,
  tags: ["oop", "polymorphism", "dispatch", "inheritance", "liskov", "template method"],
  summary:
    "Polymorphism is a runtime lookup: the JVM picks the method body from the object's actual class, while the compiler already picked which overload to call from the static types. Most inheritance bugs live in that gap, or in a subclass that depends on how its superclass implements itself. Knowing both mechanisms tells you when to extend and when to delegate.",
  keyPoints: [
    "Overrides are resolved at runtime by the object's class; overloads are resolved at compile time by the declared types.",
    "@Override is not decoration — it is the compiler check that you actually overrode something.",
    "A subclass that relies on its superclass's internal call sequence breaks when that sequence changes.",
    "Extending a class you do not own is an unversioned contract with its implementation.",
    "Inheritance is right when the base class is designed and documented for it: template methods, skeletal implementations, sealed hierarchies.",
  ],
  prerequisites: ["/java/oop", "/java/objects-encapsulation"],
  sections: [
    {
      heading: "Dispatch: what happens at the call site",
      lede: "Two decisions — one by the compiler, one by the JVM.",
      diagram: {
        kind: "flow",
        caption: "From source to executed method body.",
        rows: [
          [
            { id: "src", label: "notify(payment)", sub: "source" },
            {
              id: "compile",
              label: "Compiler",
              sub: "picks the SIGNATURE from static types",
              tone: "accent",
            },
            { id: "byte", label: "invokevirtual Notifier.notify(Payment)" },
          ],
          [
            { id: "rt", label: "JVM", sub: "looks up the receiver's class", tone: "accent" },
            { id: "vt", label: "vtable / itable", sub: "per-class method table" },
            { id: "body", label: "EmailNotifier.notify", sub: "the body that runs", tone: "ok" },
          ],
        ],
      },
      bullets: [
        "invokestatic and invokespecial (constructors, private, super calls) have a single target. invokevirtual and invokeinterface look the method up on the receiver's class — that is dynamic dispatch.",
        "The JIT watches each call site. One implementation seen (monomorphic) means it can inline the body; two is still cheap; many implementations (megamorphic) forces a real lookup and blocks inlining. This is why a hot loop over a 12-implementation interface can be measurably slower than the same logic in one class.",
        "invokedynamic underpins lambdas and string concatenation: the call site is linked on first use, which is why lambdas do not create a class file per lambda at compile time.",
      ],
      callout: {
        kind: "note",
        title: "Do not design around the JIT",
        text: "Megamorphic call sites matter in the innermost loop of a parser or a serializer, not in a service that spends its time waiting on a database. Write the clear hierarchy first; measure before flattening one for speed.",
      },
    },
    {
      heading: "Overriding versus overloading",
      lede: "The compiler chooses by declared type, and that is where the surprises come from.",
      code: {
        title: "Example — three resolutions that are not what they look like",
        lang: "java",
        source: `class Notifier {
    void notify(Object event)  { System.out.println("object"); }
    void notify(Payment event) { System.out.println("payment"); }
}

Object event = new Payment();       // DECLARED Object, actual Payment
new Notifier().notify(event);       // prints "object" — overloads use the declared type

// 2. equals: the classic accidental overload.
class Point {
    int x, y;
    public boolean equals(Point other) {        // ← OVERLOAD, not an override
        return x == other.x && y == other.y;
    }
}
Set<Point> points = new HashSet<>();
points.add(new Point(1, 1));
points.contains(new Point(1, 1));   // false: HashSet calls equals(Object), which is identity
// @Override on that method would have failed to compile — which is the point of it.

// 3. Autoboxing and varargs change which overload wins.
static void handle(int value)     { System.out.println("int"); }
static void handle(Integer value) { System.out.println("Integer"); }
static void handle(int... values) { System.out.println("varargs"); }
handle(1);                          // "int" — widening beats boxing beats varargs
handle(Integer.valueOf(1));         // "Integer"
handle(1, 2);                       // "varargs"

// null is ambiguous whenever two overloads take unrelated reference types:
//   notify(null) → compile error "reference to notify is ambiguous"
//   Cast to say which you mean: notify((Payment) null)`,
      },
      table: {
        headers: ["", "Overriding", "Overloading"],
        rows: [
          [
            "Chosen by",
            "The object's runtime class",
            "The arguments' declared types, at compile time",
          ],
          ["Signature", "Must match (covariant return allowed)", "Must differ in parameters"],
          ["Access", "Cannot be more restrictive than the parent", "Unrelated"],
          ["Exceptions", "No new or broader checked exceptions", "Unrelated"],
          ["Tooling check", "@Override", "None — the compiler cannot know your intent"],
        ],
      },
    },
    {
      heading: "The fragile base class",
      lede: "A subclass can depend on how the superclass calls itself — and that is not part of the contract.",
      code: {
        title: "Example — counting inserts, and the double count",
        lang: "java",
        source: `// Looks reasonable: an ArrayList that counts everything added.
class CountingList<E> extends ArrayList<E> {
    private int added;

    @Override public boolean add(E element) {
        added++;
        return super.add(element);
    }
    @Override public boolean addAll(Collection<? extends E> elements) {
        added += elements.size();
        return super.addAll(elements);       // ← which calls this.add(...) for each element
    }
    int added() { return added; }
}

new CountingList<String>().addAll(List.of("a", "b", "c")).added();   // 6, not 3

// The bug is not in this class. It is the assumption that AbstractCollection.addAll
// does not call add() — an implementation detail that is free to change between
// JDK versions. This is "self-use", and it is why javadoc for such classes carries
// @implSpec notes describing exactly which methods call which.

// FIX — composition (delegation). No inheritance, no assumptions.
final class CountingList<E> implements List<E> {
    private final List<E> delegate;
    private int added;

    CountingList(List<E> delegate) { this.delegate = delegate; }

    @Override public boolean add(E element) { added++; return delegate.add(element); }
    @Override public boolean addAll(Collection<? extends E> elements) {
        added += elements.size();
        return delegate.addAll(elements);
    }
    // …remaining List methods delegate; or extend ForwardingList from Guava.
    int added() { return added; }
}`,
      },
      bullets: [
        "Extending a class from another library ties you to its internals. A minor version can change which methods call which, and your subclass changes behaviour without changing a line.",
        "If a class is not designed for extension, make it final. “Design and document for inheritance, or else prohibit it” (Effective Java, Item 19) is the shortest useful rule in OOP.",
        "Liskov substitution in practice: a subclass may accept more and promise more, never less. A subclass that throws UnsupportedOperationException from an inherited method — or narrows the accepted inputs — breaks every caller written against the base type.",
      ],
    },
    {
      heading: "Where inheritance still earns its place",
      lede: "Designed extension points, not accidental reuse.",
      code: {
        title: "Example — template method with documented hooks",
        lang: "java",
        source: `/**
 * Runs one import in a fixed order: validate, load, transform, write, report.
 * Subclasses supply the steps; they do not control the sequence.
 */
public abstract class ImportJob {

    /** The algorithm. final: subclasses cannot reorder or skip steps. */
    public final ImportResult run(Path file) {
        validate(file);                                   // @implSpec hook
        List<Row> rows = load(file);
        List<Record> records = rows.stream().map(this::transform).toList();
        int written = write(records);
        return new ImportResult(file, records.size(), written, warnings());
    }

    /** @implSpec Throw ImportException if the file cannot be imported at all. */
    protected void validate(Path file) { }               // optional hook, no-op default

    protected abstract List<Row> load(Path file);        // required
    protected abstract Record transform(Row row);        // required
    protected abstract int write(List<Record> records);  // required

    protected List<String> warnings() { return List.of(); }
}

// The two rules that make this safe:
//  1. run() is final — the invariant is the ORDER of the steps.
//  2. Every hook is documented with what it must and must not do (@implSpec).

// Skeletal implementations are the same idea in the JDK: AbstractList gives you
// iterator(), contains() and friends once you implement get(int) and size().

// And when the set of subtypes is FIXED, prefer a sealed hierarchy (chapter 36) —
// the compiler then checks that every case is handled.`,
      },
      bullets: [
        "Protected members are public API for subclasses: once released, they cannot change without breaking people.",
        "Prefer composition when you want to reuse behaviour, inheritance when you want a subtype — “is a” in the sense that every caller of the supertype works unchanged with the subtype.",
        "Interfaces with default methods (chapter 36) cover most of what abstract classes were used for, without consuming the single extends slot.",
      ],
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the difference between overriding and overloading?",
          a: "Overriding replaces a superclass method and is selected at runtime from the object's actual class. Overloading is several methods with the same name and different parameters, and the compiler picks one from the declared types of the arguments — so the same call can resolve differently depending on how a variable is declared.",
        },
        {
          q: "Why does @Override matter if it changes nothing at runtime?",
          a: "It makes the compiler verify that the method really overrides something. Without it, a typo or a wrong parameter type silently creates a new overload — the classic equals(MyType) bug that makes collections behave as if equality were identity.",
        },
        {
          q: "What is the fragile base class problem?",
          a: "A subclass that depends on the superclass's internal self-calls. If the superclass later changes which of its own methods it calls, the subclass's behaviour changes without any edit — the CountingList double-count. Composition avoids it because the wrapper only sees the public API.",
        },
        {
          q: "When would you choose an abstract class over an interface?",
          a: "When subtypes share state or constructor logic, or when the algorithm's order must be fixed by a final template method. Otherwise prefer an interface, possibly with default methods, since a class can implement many interfaces but extend only one class.",
        },
        {
          q: "What is a megamorphic call site?",
          a: "A virtual call site that has seen many different receiver types, so the JIT cannot cache a single target and inline it. It only matters in very hot code; it is a reason to keep inner-loop hierarchies small, not a reason to avoid polymorphism.",
        },
      ],
      takeaways: [
        "Compiler picks the signature; the JVM picks the body.",
        "Extend only what was designed and documented for extension; otherwise delegate.",
        "Final by default, hooks documented, order owned by the base class.",
      ],
    },
  ],
  related: [
    "/java/oop",
    "/java/sealed-records",
    "/java/objects-encapsulation",
    "/lld/solid",
    "/java/design-patterns",
  ],
  furtherReading: [
    {
      label: "Java Tutorials — inheritance",
      href: "https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html",
    },
    {
      label: "JLS — method invocation and overload resolution",
      href: "https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.12",
    },
  ],
};
