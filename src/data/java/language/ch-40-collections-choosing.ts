import type { Concept } from "@/data/types";

export const javaCollectionsChoosing: Concept = {
  slug: "collections-choosing",
  title: "Choosing & Using Collections Well",
  subtitle:
    "Chapter 40 — picking by the operation you need, the Map idioms that replace loops, sequenced collections, and immutable factories",
  level: "intermediate",
  minutes: 28,
  tags: [
    "collections",
    "map api",
    "deque",
    "priorityqueue",
    "sequenced collections",
    "immutability",
  ],
  summary:
    "Most collection code answers one of five questions: does it contain this, what is next, what is the order, how many of each, and which fall in this range. Pick the structure that answers your question directly and the code shrinks — compute, merge and computeIfAbsent replace half the loops people still write by hand.",
  keyPoints: [
    "Choose by the operation that runs most often, then by ordering, then by memory.",
    "computeIfAbsent builds multi-maps; merge counts; getOrDefault reads without null checks.",
    "ArrayDeque is the stack and the queue; Stack and LinkedList are legacy choices.",
    "PriorityQueue gives you the smallest element, not a sorted collection.",
    "List.of and friends are immutable and null-hostile; Arrays.asList is a fixed-size view of an array.",
  ],
  prerequisites: ["/java/collections", "/java/collections-internals"],
  sections: [
    {
      heading: "Pick by the question you are asking",
      table: {
        caption: "The operation that dominates decides the structure.",
        headers: ["What you need", "Use", "Why"],
        rows: [
          ["Indexed access, iteration", "ArrayList", "Contiguous memory, O(1) get"],
          ["Membership test", "HashSet", "O(1) contains, no order"],
          [
            "Membership plus insertion order",
            "LinkedHashSet",
            "Predictable iteration, same lookup cost",
          ],
          [
            "Sorted order, ranges, nearest key",
            "TreeMap / TreeSet",
            "O(log n) plus floor, ceiling, subMap",
          ],
          ["Queue or stack", "ArrayDeque", "O(1) both ends, array-backed"],
          ["Always the smallest (or largest)", "PriorityQueue", "O(log n) insert, O(1) peek"],
          [
            "Counting or grouping",
            "HashMap + merge / computeIfAbsent",
            "One pass, no intermediate lists",
          ],
          ["Enum keys", "EnumMap / EnumSet", "Array and bitmask backed"],
          [
            "Shared across threads",
            "ConcurrentHashMap (chapter 42)",
            "Lock-free reads, atomic updates",
          ],
        ],
      },
      bullets: [
        "“Which is faster, ArrayList or HashSet?” is the wrong question: they answer different ones. An ArrayList.contains is O(n) — if membership is hot, you wanted a Set.",
        "A List<Boolean> or Map<String, Boolean> is usually a Set in disguise.",
        "Iterating a Map to find one key is a missed index: key the map by that field instead.",
      ],
    },
    {
      heading: "The Map idioms that replace loops",
      code: {
        title: "Example — grouping, counting and caching, without null checks",
        lang: "java",
        source: `// MULTI-MAP — computeIfAbsent creates the inner collection on first use.
Map<String, List<Order>> byCity = new HashMap<>();
for (Order order : orders) {
    byCity.computeIfAbsent(order.city(), city -> new ArrayList<>()).add(order);
}
// The old way needed a containsKey check and a put; this is one atomic-looking line.
// Do NOT modify the same map inside the mapping function — HashMap detects the
// recursive update and throws ConcurrentModificationException.

// COUNTING — merge(key, 1, Integer::sum) is the counter idiom.
Map<Status, Integer> counts = new EnumMap<>(Status.class);
for (Order order : orders) counts.merge(order.status(), 1, Integer::sum);

// READING — no null handling at the call site.
int paid = counts.getOrDefault(Status.PAID, 0);

// UPDATING IN PLACE — compute sees the current value and decides the next.
inventory.compute(sku, (key, current) -> current == null ? 1 : current + delta);
// Returning null from compute REMOVES the entry — a neat way to expire a counter:
attempts.compute(userId, (key, count) -> count == null || count <= 1 ? null : count - 1);

// ITERATING AND EDITING VALUES safely:
for (Map.Entry<String, Integer> entry : counts.entrySet()) {
    entry.setValue(entry.getValue() * 2);        // allowed: value change, not structural
}
counts.entrySet().removeIf(entry -> entry.getValue() == 0);   // structural, done safely

// putIfAbsent for a one-time initialisation; replaceAll for a bulk transform.`,
      },
    },
    {
      heading: "Queues, deques and priority",
      code: {
        title: "Example — a work stack, a sliding window and bounded top-N",
        lang: "java",
        source: `// STACK and QUEUE are both ArrayDeque. (java.util.Stack extends Vector and
// synchronises every call — legacy.)
Deque<Path> toVisit = new ArrayDeque<>();
toVisit.push(root);                       // addFirst
while (!toVisit.isEmpty()) {
    Path current = toVisit.pop();         // removeFirst — depth first
    children(current).forEach(toVisit::push);
}
Deque<Task> queue = new ArrayDeque<>();
queue.offer(task);                        // addLast
Task next = queue.poll();                 // removeFirst — breadth first

// SLIDING WINDOW — a deque of timestamps is the classic rate limiter (see the lab).
Deque<Instant> hits = new ArrayDeque<>();
void record(Instant now) {
    hits.addLast(now);
    while (!hits.isEmpty() && hits.peekFirst().isBefore(now.minusSeconds(60))) {
        hits.removeFirst();               // drop what fell out of the window
    }
}

// PRIORITYQUEUE — a binary heap. peek() is the smallest by the comparator; the
// ITERATOR IS NOT SORTED, which surprises people every time.
PriorityQueue<Candidate> topTen = new PriorityQueue<>(Comparator.comparingDouble(Candidate::score));
for (Candidate candidate : stream) {
    topTen.offer(candidate);
    if (topTen.size() > 10) topTen.poll();     // evict the worst → O(n log 10) for top-10
}
List<Candidate> best = topTen.stream()
    .sorted(Comparator.comparingDouble(Candidate::score).reversed())
    .toList();                                  // sort only the 10 you kept

// SEQUENCED COLLECTIONS (Java 21, JEP 431) gave every ordered collection the same
// first/last vocabulary and a reversed view:
List<Order> recent = orders.reversed();         // a VIEW, not a copy
Order newest = orders.getLast();                // no more get(size() - 1)
LinkedHashMap<String, Session> sessions = …;
sessions.putFirst("priority", session);
Map.Entry<String, Session> oldest = sessions.firstEntry();`,
      },
    },
    {
      heading: "Immutable, unmodifiable and fixed-size",
      lede: "Three different things that all reject add().",
      table: {
        headers: ["Factory", "What it is", "Nulls", "Notes"],
        rows: [
          [
            "List.of, Set.of, Map.of",
            "Truly immutable copies",
            "Rejected",
            "Set.of/Map.of throw on duplicate keys; iteration order of Set.of is unspecified",
          ],
          [
            "List.copyOf(collection)",
            "Immutable snapshot",
            "Rejected",
            "Returns the same instance if it is already immutable",
          ],
          [
            "Collections.unmodifiableList(list)",
            "A read-only VIEW",
            "Allowed",
            "Changes to the backing list are visible through it",
          ],
          [
            "Arrays.asList(array)",
            "Fixed-size view of the array",
            "Allowed",
            "set() writes through to the array; add/remove throw",
          ],
          [
            "Collectors.toUnmodifiableList()",
            "Immutable result",
            "Rejected",
            "stream().toList() also returns an unmodifiable list",
          ],
        ],
      },
      callout: {
        kind: "interview",
        title: "Return immutable, accept the interface",
        text: "Accept Collection<? extends T> or List<T> in parameters, return an immutable List<T>. Callers cannot corrupt your state, you never copy defensively on the way out, and the type still says exactly what they get.",
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "How do you group a list of objects by a field?",
          a: "Either map.computeIfAbsent(key, k -> new ArrayList<>()).add(value) in a loop, or stream().collect(Collectors.groupingBy(...)) for a declarative version. Both are one pass; the collector also lets you count or sum downstream instead of materialising lists.",
        },
        {
          q: "ArrayDeque or LinkedList for a queue?",
          a: "ArrayDeque. It is array-backed, so it uses far less memory per element and is cache-friendly, and it is faster at both ends. LinkedList's only advantage is O(1) removal via an existing iterator, which is rarely the operation you need.",
        },
        {
          q: "Why is PriorityQueue's iteration order not sorted?",
          a: "It is a binary heap, which only guarantees the head is the minimum by the comparator. Iteration walks the array in heap order. To get sorted output, poll repeatedly or sort a copy.",
        },
        {
          q: "What is the difference between List.of and Arrays.asList?",
          a: "List.of builds an immutable list that rejects nulls and forbids every mutation. Arrays.asList returns a fixed-size view backed by the array: set writes through to the array, add and remove throw, and nulls are allowed.",
        },
        {
          q: "What did sequenced collections add in Java 21?",
          a: "A common supertype for collections with a defined encounter order, with getFirst, getLast, addFirst, addLast, removeFirst, removeLast and a reversed() view. It replaced the inconsistent vocabulary across List, Deque, LinkedHashMap and SortedSet.",
        },
      ],
      takeaways: [
        "Pick the structure that answers your hottest question directly.",
        "merge, compute and computeIfAbsent replace most hand-written map loops.",
        "Immutable by default on the way out; know which factory you used.",
      ],
    },
  ],
  related: [
    "/java/collections-internals",
    "/java/collections-pitfalls",
    "/java/streams-collectors",
    "/java/collections",
    "/playgrounds/rate-limiter",
  ],
  furtherReading: [
    {
      label: "Java Tutorials — the collections framework",
      href: "https://docs.oracle.com/javase/tutorial/collections/index.html",
    },
    { label: "JEP 431 — Sequenced Collections", href: "https://openjdk.org/jeps/431" },
  ],
};
