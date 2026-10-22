import type { Concept } from "@/data/types";

export const javaGenerics: Concept = {
  slug: "generics-in-depth",
  title: "Generics in Depth",
  subtitle:
    "Chapter 38 — erasure and what survives it, PECS and variance, inference, heap pollution, and designing generic APIs people can use",
  level: "advanced",
  minutes: 30,
  tags: ["generics", "erasure", "wildcards", "pecs", "variance", "type safety"],
  summary:
    "Java's generics are a compile-time device: the compiler proves your types line up, then erases them. That single fact explains the rules people memorise — no new T[], no instanceof List<String>, wildcards for flexible parameters, and the occasional unavoidable unchecked cast. Once erasure makes sense, PECS stops being a mnemonic and becomes obvious.",
  keyPoints: [
    "Generic types exist at compile time; at runtime a List<String> is just a List.",
    "Generics are invariant: List<String> is not a List<Object>, which is what makes them safe.",
    "PECS: use ? extends T to read from a source, ? super T to write into a sink.",
    "Arrays are covariant and reified, generics are invariant and erased — never mix them.",
    "An unchecked cast is sometimes correct; it needs a comment saying why it is safe.",
  ],
  prerequisites: ["/java/advanced-topics", "/java/oop"],
  sections: [
    {
      heading: "Erasure: what the JVM actually sees",
      lede: "Every rule in this chapter follows from this.",
      code: {
        title: "Example — what the compiler removes, and the consequences",
        lang: "java",
        source: `// You write:
class Box<T extends Number> {
    private T value;
    T get() { return value; }
    void set(T value) { this.value = value; }
}

// The JVM sees (roughly):
class Box {
    private Number value;                   // T erased to its bound
    Number get() { return value; }
    void set(Number value) { this.value = value; }
}
// Unbounded T erases to Object; casts are inserted at the CALL SITES.

// CONSEQUENCE 1 — no runtime type information
List<String> names = new ArrayList<>();
names instanceof List<String>            // does not compile
names.getClass() == new ArrayList<Integer>().getClass()   // true: same class

// CONSEQUENCE 2 — no generic array creation
T[] items = new T[10];                   // does not compile
@SuppressWarnings("unchecked")           // the standard workaround, with the cast documented
T[] items = (T[]) new Object[10];        // safe while it never escapes as T[]

// CONSEQUENCE 3 — no overloading on type arguments
void handle(List<String> ids) { }
void handle(List<Integer> ids) { }       // "have the same erasure" — does not compile

// CONSEQUENCE 4 — bridge methods
class StringBox extends Box<Integer> {
    @Override void set(Integer value) { … }
    // The compiler adds a synthetic set(Number) that casts and delegates, so
    // dynamic dispatch through the erased signature still lands here. You see these
    // in stack traces and in reflection results.
}

// WHAT SURVIVES: generic signatures of fields, methods and supertypes are kept in
// the class file as metadata. That is how frameworks read them:
//   class OrderRepository implements Repository<Order, Long>
// Spring Data finds Order and Long via the generic supertype, not via an instance.`,
      },
    },
    {
      heading: "Variance: PECS, and why arrays are the counterexample",
      lede: "Invariance is not a limitation; it is the guarantee.",
      code: {
        title: "Example — the store that breaks arrays, and what generics do instead",
        lang: "java",
        source: `// ARRAYS ARE COVARIANT — and unsound. This compiles:
Object[] objects = new String[3];
objects[0] = 42;                      // ArrayStoreException at RUNTIME

// GENERICS ARE INVARIANT — the same mistake is a compile error:
List<Object> objects = new ArrayList<String>();   // does not compile. Good.

// PECS — Producer Extends, Consumer Super.
static <T> void copy(List<? extends T> source,     // PRODUCES T: read from it
                     List<? super T> target) {     // CONSUMES T: write into it
    for (T item : source) target.add(item);
}

List<Integer> ints = List.of(1, 2, 3);
List<Number> numbers = new ArrayList<>();
copy(ints, numbers);                  // Integer extends Number: both bounds satisfied

// What each wildcard permits:
List<? extends Number> producer = List.of(1, 2, 3);
Number first = producer.get(0);       // reading is fine — it is at least a Number
producer.add(4);                      // NOT allowed: the list might be List<Double>

List<? super Integer> consumer = new ArrayList<Number>();
consumer.add(42);                     // writing an Integer is fine
Object value = consumer.get(0);       // reading gives only Object

// THE RULE OF THUMB for API design: parameters use wildcards, return types do not.
// Collection<? extends T> as a parameter accepts more callers; returning
// List<? extends T> just forces every caller to write wildcards too.

// Comparable is the standard recursive bound:
static <T extends Comparable<? super T>> T max(Collection<? extends T> values) { … }
// "? super T" lets a Employee compare with a Comparable<Person> implementation.`,
      },
      diagram: {
        kind: "flow",
        caption: "Choosing a wildcard.",
        rows: [
          [
            { id: "q", label: "Which direction does data flow?" },
            { id: "in", label: "You READ from it", sub: "? extends T", tone: "accent" },
            { id: "out", label: "You WRITE into it", sub: "? super T", tone: "accent" },
            { id: "both", label: "Both", sub: "exact T — no wildcard", tone: "ok" },
          ],
        ],
      },
    },
    {
      heading: "Inference, and where it stops helping",
      bullets: [
        "The diamond infers from the target type: Map<String, List<Order>> byCity = new HashMap<>(); needs no repetition.",
        "var infers from the initialiser, so var orders = new ArrayList<Order>(); keeps the element type — but var orders = new ArrayList<>(); infers ArrayList<Object>, which compiles and then fails you later.",
        "When inference picks something too narrow, supply a type witness: Collections.<String>emptyList(), or List.<Order>of().",
        "Capture errors (“capture of ? extends Number”) mean the compiler cannot prove two wildcards are the same type. The fix is a private generic helper method that names the type: <T> void swapHelper(List<T> list, int i, int j).",
      ],
      code: {
        title: "Example — the capture helper",
        lang: "java",
        source: `// Does not compile: each ? is a distinct unknown type.
static void swap(List<?> list, int i, int j) {
    list.set(i, list.set(j, list.get(i)));       // error: capture of ?
}

// Compiles: the helper gives the unknown type a name.
static void swap(List<?> list, int i, int j) { swapHelper(list, i, j); }

private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}`,
      },
    },
    {
      heading: "Heap pollution, varargs and honest unchecked casts",
      code: {
        title: "Example — @SafeVarargs and a typed heterogeneous container",
        lang: "java",
        source: `// Generic varargs create an array of a non-reifiable type — the compiler warns
// because the array can be polluted through an aliased Object[].
@SafeVarargs                                   // "I only READ from the array"
static <T> List<T> listOf(T... items) {        // must be static, final or private
    return List.of(items);
}

// UNSAFE version of the same idea:
static <T> T[] toArray(T... items) { return items; }   // leaks the array — do not

// TYPED HETEROGENEOUS CONTAINER: one map, many value types, all checked.
public final class Attributes {
    private final Map<Class<?>, Object> values = new HashMap<>();

    public <T> void put(Class<T> type, T value) {
        values.put(Objects.requireNonNull(type), type.cast(value));   // runtime check
    }

    public <T> Optional<T> get(Class<T> type) {
        return Optional.ofNullable(type.cast(values.get(type)));      // cast, not (T)
    }
}
Attributes attributes = new Attributes();
attributes.put(Tenant.class, tenant);
attributes.put(TraceId.class, traceId);
Optional<Tenant> current = attributes.get(Tenant.class);   // no cast at the call site

// When an unchecked cast is genuinely required, isolate and justify it:
@SuppressWarnings("unchecked")   // safe: the cache only ever stores V under this key
V cached = (V) cache.get(key);`,
      },
      callout: {
        kind: "insight",
        title: "Design rule for generic APIs",
        text: "Add a type parameter when the caller decides the type and you must give it back. If a method only ever consumes values and returns nothing type-dependent, a wildcard parameter is simpler for everyone: void printAll(Collection<?> values) beats <T> void printAll(Collection<T> values).",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is type erasure and what does it prevent?",
          a: "Generic type arguments are checked at compile time and removed from the bytecode, leaving the bound (or Object). That prevents runtime type tests on parameterised types, generic array creation, overloading on type arguments, and static state per parameterisation — while keeping generics backwards compatible with pre-generic code.",
        },
        {
          q: "Explain PECS with an example.",
          a: "Producer Extends, Consumer Super. A parameter you only read from is Collection<? extends T>, because anything that produces T or a subtype works. A parameter you only write into is Collection<? super T>. Collections.copy(List<? super T> dest, List<? extends T> src) is the canonical signature.",
        },
        {
          q: "Why are arrays covariant but generics invariant?",
          a: "Array covariance predates generics and is checked at runtime, so storing the wrong type throws ArrayStoreException. Generics chose compile-time safety instead: List<String> is not a List<Object>, so the equivalent mistake cannot compile. It also means arrays and generics mix badly — prefer List over T[].",
        },
        {
          q: "What is heap pollution?",
          a: "A variable of a parameterised type referring to an object that is not of that type, which is possible because of erasure — typically through generic varargs arrays or an unchecked cast. It surfaces later as a ClassCastException at a point that has no cast in the source.",
        },
        {
          q: "How do frameworks read generic types at runtime if they are erased?",
          a: "Generic signatures of classes, fields and methods are kept in the class file as metadata. Code can read them reflectively — for example, a repository interface that extends Repository<Order, Long> tells Spring Data the entity and id types, even though no instance carries them.",
        },
      ],
      takeaways: [
        "Erasure explains every generics restriction you will hit.",
        "Wildcards in parameters, concrete types in returns.",
        "Prefer List to arrays in generic code; justify every unchecked cast.",
      ],
    },
  ],
  related: [
    "/java/advanced-topics",
    "/java/collections-internals",
    "/java/object-contracts",
    "/java/streams-collectors",
    "/java/oop",
  ],
  furtherReading: [
    {
      label: "Java Tutorials — generics",
      href: "https://docs.oracle.com/javase/tutorial/java/generics/index.html",
    },
    {
      label: "Angelika Langer — Java generics FAQ",
      href: "https://angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html",
    },
  ],
};
