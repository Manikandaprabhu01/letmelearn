import type { Concept } from "@/data/types";

export const javaCollectionsPitfalls: Concept = {
  slug: "collections-pitfalls",
  title: "Collection Pitfalls That Reach Production",
  subtitle:
    "Chapter 41 — ConcurrentModificationException, views that write through, boxing surprises, null policies, and the leaks nobody sees",
  level: "advanced",
  minutes: 26,
  tags: [
    "collections",
    "concurrentmodificationexception",
    "autoboxing",
    "views",
    "null",
    "memory leak",
  ],
  summary:
    "Collections fail in a small number of repeatable ways, and each one has a tell. This chapter is the catalogue: the exception thrown while iterating, the overload that removes the wrong thing, the boxed comparison that is true for 127 and false for 128, the view that writes through to something else, and the map that never gives memory back.",
  keyPoints: [
    "Structural modification during a for-each throws ConcurrentModificationException — even on one thread.",
    "list.remove(int) removes by index; list.remove(Object) removes by value. With List<Integer> both compile.",
    "== on boxed Integers is true up to 127 and false from 128 because of the Integer cache.",
    "subList, keySet, values and Arrays.asList are views: writes go through to the backing structure.",
    "Collectors.toMap throws on a null value, and TreeMap throws on a null key — every collection has its own null policy.",
  ],
  prerequisites: ["/java/collections", "/java/object-contracts"],
  sections: [
    {
      heading: "Modifying while iterating",
      code: {
        title: "Example — the exception, and the three correct fixes",
        lang: "java",
        source: `List<Order> orders = new ArrayList<>(loaded);

// THROWS ConcurrentModificationException — the iterator notices modCount changed.
for (Order order : orders) {
    if (order.isCancelled()) orders.remove(order);       // structural change mid-iteration
}
// Note: it is FAIL-FAST, not a guarantee. Removing the second-to-last element can
// end the loop early without any exception, which is worse than throwing.

// FIX 1 — removeIf: clearest, and the fastest for ArrayList (single compaction pass).
orders.removeIf(Order::isCancelled);

// FIX 2 — explicit iterator, when the condition needs more than a predicate.
for (Iterator<Order> it = orders.iterator(); it.hasNext(); ) {
    Order order = it.next();
    if (order.isCancelled()) { audit(order); it.remove(); }
}

// FIX 3 — collect then apply, when you must not touch the source while reading.
List<Order> toCancel = orders.stream().filter(Order::isCancelled).toList();
orders.removeAll(toCancel);

// MAPS: iterate the entry set and remove through the view.
map.entrySet().removeIf(entry -> entry.getValue().isExpired());
map.values().removeIf(Session::isExpired);          // views write through
map.keySet().remove(key);                           // same as map.remove(key)

// ITERATOR GUARANTEES differ by collection:
//   ArrayList/HashMap        fail-fast  — throws (best effort)
//   ConcurrentHashMap        weakly consistent — never throws, may or may not see
//                            concurrent updates, traverses each element once
//   CopyOnWriteArrayList     snapshot — iterates the array present when it started`,
      },
    },
    {
      heading: "Overloads, boxing and identity",
      code: {
        title: "Example — three one-line bugs",
        lang: "java",
        source: `// 1. remove(int) versus remove(Object)
List<Integer> ids = new ArrayList<>(List.of(10, 20, 30));
ids.remove(20);                    // removes INDEX 20 → IndexOutOfBoundsException
ids.remove(Integer.valueOf(20));   // removes the VALUE 20 — what was meant
// Any List<Integer> is a trap here. A List<Long> is not: remove(long) does not exist,
// so the compiler picks remove(Object).

// 2. The Integer cache
Integer a = 127, b = 127;
a == b;                            // true  — both come from the cache (-128..127)
Integer c = 128, d = 128;
c == d;                            // false — two objects
// Real form of this bug: comparing a map lookup with a literal.
Integer count = counts.get(sku);
if (count == 1) { … }              // unboxes — fine, but NPE if the key is absent
if (count == someOtherInteger) { … }   // identity comparison — wrong above 127
// Rule: == for primitives, equals for boxed types, Objects.equals when either is null.

// 3. Arrays.asList with primitives
int[] numbers = {1, 2, 3};
List<int[]> wrong = Arrays.asList(numbers);      // ONE element: the array itself
List<Integer> right = Arrays.stream(numbers).boxed().toList();
// Integer[] works as expected — the trap is primitives only.

// 4. Autoboxing in a hot loop
Map<String, Long> totals = new HashMap<>();
totals.merge(sku, 1L, Long::sum);   // allocates a Long per update; fine for thousands,
                                    // measurable for millions — then use LongAdder or
                                    // a primitive-specialised map (Eclipse Collections, fastutil).`,
      },
    },
    {
      heading: "Views that write through",
      lede: "Several JDK methods return windows onto another structure, not copies.",
      code: {
        title: "Example — subList, unmodifiable views and the retained reference",
        lang: "java",
        source: `List<Order> page = orders.subList(0, 50);     // a VIEW of the first 50
page.clear();                                 // removes those 50 FROM orders
orders.add(newOrder);                         // structural change to the parent…
page.size();                                  // …now throws ConcurrentModificationException
// Copy when you mean a copy:
List<Order> firstPage = List.copyOf(orders.subList(0, 50));

// unmodifiableList wraps, it does not freeze:
List<String> names = new ArrayList<>(List.of("asha"));
List<String> readOnly = Collections.unmodifiableList(names);
names.add("rahul");                           // allowed — you still hold the original
readOnly.size();                              // 2: the "read-only" view changed
// List.copyOf(names) would have been a genuine snapshot.

// MEMORY: a view keeps its backing structure alive.
List<Row> everything = readMillionRows();
List<Row> sample = everything.subList(0, 10);
cache.put(key, sample);                       // the whole million-row list is retained
cache.put(key, List.copyOf(sample));          // 10 rows retained

// Map views are the same idea, and are useful:
Set<String> keys = map.keySet();
keys.retainAll(activeIds);                    // removes every other entry FROM the map`,
      },
      callout: {
        kind: "warn",
        title: "ArrayList.clear() does not release memory",
        text: "clear() nulls the elements but keeps the backing array at its high-water mark. A list that once held a million rows keeps a million-slot array alive. Call trimToSize(), or replace the reference with a new list, when a long-lived object holds a list that spiked.",
      },
    },
    {
      heading: "Null policies and equality across types",
      table: {
        caption: "Every collection has its own answer to null.",
        headers: ["Operation", "null key", "null value"],
        rows: [
          ["HashMap", "One allowed", "Allowed"],
          ["TreeMap", "NullPointerException (it must compare)", "Allowed"],
          ["ConcurrentHashMap", "Rejected", "Rejected"],
          ["Map.of / Map.entry", "Rejected", "Rejected"],
          ["Collectors.toMap", "Rejected", "Rejected — throws NullPointerException"],
          ["Collectors.groupingBy", "Rejected (classifier result)", "n/a"],
        ],
      },
      code: {
        title: "Example — the toMap NPE that looks like a data bug",
        lang: "java",
        source: `// Throws NullPointerException if ANY order has a null trackingId — and the message
// does not name the column, so it reads like a framework bug.
Map<String, String> tracking = orders.stream()
    .collect(Collectors.toMap(Order::id, Order::trackingId));

// Two honest fixes: filter first, or collect into a map that allows nulls.
Map<String, String> present = orders.stream()
    .filter(order -> order.trackingId() != null)
    .collect(Collectors.toMap(Order::id, Order::trackingId));

Map<String, String> withNulls = orders.stream().collect(
    HashMap::new, (map, order) -> map.put(order.id(), order.trackingId()), HashMap::putAll);

// toMap also throws IllegalStateException on DUPLICATE keys — deliberate, so a
// silent overwrite cannot happen. Supply a merge function when duplicates are legal:
Collectors.toMap(Order::customerId, Order::total, BigDecimal::add);

// EQUALITY ACROSS TYPES
List.of(1, 2).equals(List.of(2, 1));        // false — lists compare in order
Set.of(1, 2).equals(Set.of(2, 1));          // true  — sets ignore order
List.of(1, 2).equals(Set.of(1, 2));         // false — different interfaces never equal`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What causes ConcurrentModificationException, and is it always about threads?",
          a: "No — it is usually single-threaded: a structural modification during iteration, detected by a modCount check in the iterator. Fix it with removeIf, an explicit Iterator.remove, or by collecting the changes and applying them afterwards. It is fail-fast and best-effort, so it can also fail to trigger.",
        },
        {
          q: "list.remove(2) on a List<Integer> — what happens?",
          a: "It removes the element at index 2, because remove(int) matches exactly while remove(Object) would need boxing. To remove the value, call remove(Integer.valueOf(2)).",
        },
        {
          q: "Why can two equal Integers be == in one place and not another?",
          a: "Values from −128 to 127 come from the Integer cache, so boxing them yields the same object; outside that range boxing allocates. Comparing boxed values with == therefore works for small numbers and silently fails for larger ones. Use equals.",
        },
        {
          q: "What is the risk with subList?",
          a: "It is a view: modifying it modifies the parent, and any structural change to the parent invalidates it with ConcurrentModificationException. It also keeps the whole backing list reachable, so caching a subList of a huge list leaks memory. Copy it when you need an independent list.",
        },
        {
          q: "Why does ConcurrentHashMap reject nulls when HashMap allows them?",
          a: "Because in a concurrent map get returning null would be ambiguous: absent, or present with a null value? Without the ability to lock the map and re-check with containsKey, that ambiguity cannot be resolved, so nulls are banned outright.",
        },
      ],
      takeaways: [
        "removeIf and iterator.remove; never mutate during a for-each.",
        "equals for boxed values, and mind remove's overloads.",
        "Know what is a view and what is a copy — for correctness and for memory.",
      ],
    },
  ],
  related: [
    "/java/collections-internals",
    "/java/collections-choosing",
    "/java/concurrent-collections",
    "/java/object-contracts",
    "/java/collections",
  ],
  furtherReading: [
    {
      label: "Javadoc — Collection",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collection.html",
    },
    {
      label: "Javadoc — Collectors",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Collectors.html",
    },
  ],
};
