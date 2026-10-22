import type { Concept } from "@/data/types";

export const javaObjectContracts: Concept = {
  slug: "object-contracts",
  title: "Object Contracts: equals, hashCode, compareTo",
  subtitle:
    "Chapter 37 — the rules collections rely on, mutable keys, ordering that stays consistent, and why clone() is not the answer",
  level: "advanced",
  minutes: 28,
  tags: ["equals", "hashcode", "comparable", "comparator", "collections", "clone"],
  summary:
    "HashMap, HashSet, TreeMap and every sort in the JDK are built on contracts your classes promise to keep. Break the equals/hashCode pair and lookups miss objects that are in the map. Break the comparator contract and a sort throws in production on data that was fine in testing. These are the rules, the failures each one produces, and how records remove most of the work.",
  keyPoints: [
    "Equal objects must have equal hash codes — the reverse is not required.",
    "A key whose fields change after insertion is effectively lost: its bucket no longer matches.",
    "equals on a subclass either breaks symmetry or breaks substitutability; composition or records avoid the choice.",
    "TreeMap and TreeSet use compareTo, not equals — inconsistency silently drops or duplicates entries.",
    "An inconsistent comparator makes sort throw “Comparison method violates its general contract!”.",
  ],
  prerequisites: ["/java/oop", "/java/objects-encapsulation"],
  sections: [
    {
      heading: "The equals contract, and the inheritance trap",
      lede: "Five rules, one of which subclassing cannot keep.",
      bullets: [
        "Reflexive: x.equals(x) is true. Symmetric: x.equals(y) implies y.equals(x). Transitive. Consistent across calls when nothing changes. And x.equals(null) is false, never a NullPointerException.",
        "Symmetry is what subclassing breaks: if ColorPoint.equals compares colour but Point.equals does not, point.equals(colorPoint) can be true while colorPoint.equals(point) is false — and a List.contains result then depends on which object is the receiver.",
      ],
      code: {
        title: "Example — three ways to write it, and what each costs",
        lang: "java",
        source: `// 1. instanceof — allows subclasses to be equal to the base; breaks symmetry if a
//    subclass adds fields to the comparison.
@Override public boolean equals(Object o) {
    if (this == o) return true;                       // cheap identity fast path
    if (!(o instanceof Point other)) return false;    // pattern variable: no cast needed
    return x == other.x && y == other.y;
}

// 2. getClass() — symmetric, but a proxy or subclass is never equal to the base,
//    which breaks Hibernate proxies and some mocking frameworks.
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Point other = (Point) o;
    return x == other.x && y == other.y;
}

// 3. RECORD — the compiler writes it, over all components, and the class is final,
//    so the subclass question cannot arise.
public record Point(int x, int y) {}

@Override public int hashCode() { return Objects.hash(x, y); }
// Objects.hash allocates a varargs array on every call. In a hot path (a key used
// in millions of map lookups) write it out:
//   int result = Integer.hashCode(x);
//   result = 31 * result + Integer.hashCode(y);
// For an immutable class whose hash is expensive, cache it in a non-final field —
// String does exactly this.`,
      },
      callout: {
        kind: "warn",
        title: "Getting equals wrong is silent",
        text: "Nothing fails loudly. A HashSet simply accepts a duplicate, a cache misses every time, distinct() returns everything, and a removal does nothing. The symptom is usually “our numbers are slightly wrong”, which is the most expensive kind of bug to find.",
      },
    },
    {
      heading: "hashCode, buckets and the key that disappeared",
      lede: "Where the two contracts meet the data structure.",
      code: {
        title: "Example — mutating a key after it is in the map",
        lang: "java",
        source: `class MutableSku {
    String code;                       // not final — the whole problem
    MutableSku(String code) { this.code = code; }
    @Override public boolean equals(Object o) {
        return o instanceof MutableSku s && Objects.equals(code, s.code);
    }
    @Override public int hashCode() { return Objects.hash(code); }
}

Map<MutableSku, Integer> stock = new HashMap<>();
MutableSku sku = new MutableSku("SKU-1");
stock.put(sku, 42);

sku.code = "SKU-2";                    // the hash changes; the entry does not move

stock.get(sku);                        // null — we look in the new bucket, it is in the old
stock.get(new MutableSku("SKU-1"));    // null — right bucket, but equals compares "SKU-2"
stock.containsValue(42);               // true — the entry is still there, unreachable by key
stock.remove(sku);                     // does nothing: a slow leak

// RULES THAT FOLLOW
//  • Map and Set keys must be immutable, or at least never mutated while stored.
//  • Prefer records, String, enums and boxed primitives as keys.
//  • If a key must change, remove it, change it, and put it back.`,
      },
      table: {
        caption: "What each collection actually calls.",
        headers: ["Collection", "Uses", "If the contract is broken"],
        rows: [
          [
            "HashMap / HashSet",
            "hashCode, then equals within the bucket",
            "Lookups miss; duplicates accumulate",
          ],
          [
            "LinkedHashMap",
            "Same, plus insertion or access order",
            "Same, plus surprising iteration order",
          ],
          [
            "TreeMap / TreeSet",
            "compareTo or the Comparator — never equals",
            "Entries merge or duplicate silently",
          ],
          ["List.contains / indexOf", "equals", "Membership answers are wrong"],
          [
            "Collectors.toMap, distinct()",
            "equals and hashCode",
            "Unexpected merges or duplicates",
          ],
        ],
      },
    },
    {
      heading: "Ordering: Comparable, Comparator and the sort that throws",
      lede: "Ordering has its own contract, and TimSort enforces it.",
      code: {
        title: "Example — a comparator that fails in production",
        lang: "java",
        source: `// BROKEN — not transitive, and not antisymmetric for equal scores.
Comparator<Candidate> byScore = (a, b) -> a.score() > b.score() ? 1 : -1;
//  • Two candidates with the SAME score compare as -1 in both directions.
//  • With fewer than 32 elements insertion sort tolerates it; above that TimSort
//    detects the inconsistency and throws:
//        java.lang.IllegalArgumentException: Comparison method violates its general contract!
//    …which is why it passed tests on 10 rows and failed on the 2,000-row report.

// CORRECT — return 0 for equal, and use the library instead of hand-rolling.
Comparator<Candidate> byScore = Comparator.comparingDouble(Candidate::score);

// Realistic multi-key ordering, nulls handled explicitly:
Comparator<Order> ordering = Comparator
    .comparing(Order::priority)                                  // natural order of an enum
    .thenComparing(Order::placedAt, Comparator.reverseOrder())   // newest first
    .thenComparing(Order::customerName,
                   Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
    .thenComparing(Order::id);                                   // total order: stable paging

// CONSISTENCY WITH equals: TreeSet treats "compare == 0" as the same element.
record Version(int major, int minor) implements Comparable<Version> {
    @Override public int compareTo(Version other) {
        return Integer.compare(major, other.major);              // ignores minor!
    }
}
new TreeSet<>(List.of(new Version(1, 0), new Version(1, 7))).size();   // 1 — the second is dropped
// Either compare every component that equals compares, or document the
// inconsistency loudly (BigDecimal is the JDK's own famous example:
// new BigDecimal("1.0").equals(new BigDecimal("1.00")) is false, compareTo is 0).`,
      },
      bullets: [
        "Comparator.comparing with a key extractor is not free in a hot sort — it boxes. comparingInt, comparingLong and comparingDouble avoid that.",
        "Sorting on a mutable field while other threads mutate it produces the same contract violation. Sort a snapshot.",
        "For paging, always end the comparator with a unique key. Otherwise rows with equal sort keys can appear on two pages or none.",
      ],
    },
    {
      heading: "Copying: why clone() is not the answer",
      lede: "Cloneable is a design mistake the JDK carries; do not build on it.",
      code: {
        title: "Example — copy constructors and factories instead",
        lang: "java",
        source: `// clone() problems: Cloneable has no clone method (it is a marker that changes
// Object.clone's behaviour), the default copy is SHALLOW, final fields cannot be
// reassigned in it, and a subclass that forgets to override it returns the wrong type.

// Preferred: a copy constructor, or a static factory.
public final class Invoice {
    private final String id;
    private final List<InvoiceLine> lines;

    public Invoice(Invoice original) {                  // copy constructor
        this.id = original.id;
        this.lines = List.copyOf(original.lines);       // deep enough: lines are immutable
    }

    public static Invoice copyOf(Invoice original) { return new Invoice(original); }
}

// Shallow vs deep matters: copying the list copies the REFERENCES. If InvoiceLine
// were mutable, both invoices would share lines — copy those too, or make the
// element type immutable (chapter 34) so sharing is safe.

// For records, "copy with a change" is a wither:
public record Invoice(String id, Status status, List<InvoiceLine> lines) {
    public Invoice {
        lines = List.copyOf(lines);
    }
    public Invoice withStatus(Status next) { return new Invoice(id, next, lines); }
}`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What is the contract between equals and hashCode?",
          a: "If two objects are equal they must return the same hash code; unequal objects may share one. Break it and a HashMap looks in the wrong bucket, so it cannot find an entry that is present — lookups miss, duplicates accumulate, and removals do nothing.",
        },
        {
          q: "What happens if you mutate an object that is a key in a HashMap?",
          a: "Its hash code changes, but it stays in the bucket chosen at insertion. It becomes unreachable by key: get returns null for both the old and new value, remove does nothing, and the entry leaks. Keys should be immutable.",
        },
        {
          q: "Why can a subclass not add fields to equals without breaking it?",
          a: "Because symmetry fails: the base instance compares equal to the subclass instance while the subclass instance does not compare equal back. Using getClass() restores symmetry but means a proxy or subclass is never equal to the base. Composition, or a final record, avoids the dilemma.",
        },
        {
          q: "When does sorting throw “Comparison method violates its general contract”?",
          a: "When the comparator is not transitive or not antisymmetric — commonly returning 1 or -1 with no 0 case, or comparing on a value that changes during the sort. TimSort detects the inconsistency on larger inputs, which is why such bugs appear only in production volumes.",
        },
        {
          q: "Why is compareTo being inconsistent with equals a problem?",
          a: "Sorted collections use ordering, not equality. TreeSet treats compare == 0 as a duplicate and drops it, and TreeMap overwrites the value. BigDecimal in a TreeSet versus a HashSet is the canonical demonstration.",
        },
      ],
      takeaways: [
        "Keys immutable, equals and hashCode derived from the same fields.",
        "Use the library's comparator builders; end with a unique key.",
        "Copy constructors and withers, never Cloneable.",
      ],
    },
  ],
  related: [
    "/java/collections-internals",
    "/java/collections-pitfalls",
    "/java/objects-encapsulation",
    "/java/oop",
    "/java/collections",
  ],
  furtherReading: [
    {
      label: "Javadoc — Object.equals contract",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html#equals(java.lang.Object)",
    },
    {
      label: "Javadoc — Comparator",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Comparator.html",
    },
  ],
};
