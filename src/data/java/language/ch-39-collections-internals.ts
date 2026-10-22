import type { Concept } from "@/data/types";

export const javaCollectionsInternals: Concept = {
  slug: "collections-internals",
  title: "Collections Internals",
  subtitle:
    "Chapter 39 — how ArrayList grows, how HashMap buckets and treeifies, what LinkedHashMap and TreeMap cost, and the memory each one really uses",
  level: "advanced",
  minutes: 30,
  tags: ["collections", "hashmap", "arraylist", "treemap", "memory", "performance"],
  summary:
    "Every collection is a data structure with a specific shape in memory, and its performance follows from that shape rather than from the interface it implements. Knowing how HashMap turns a hash into a bucket, when it converts a chain into a tree, and why LinkedList loses to ArrayList even at inserting, turns collection choice from folklore into arithmetic.",
  keyPoints: [
    "ArrayList grows by about 50% and copies; sizing it up front removes every copy.",
    "HashMap index = (capacity - 1) & spread(hash), so capacity is always a power of two.",
    "A bucket becomes a red-black tree at 8 entries, but only once the table has 64 slots — below that it resizes instead.",
    "LinkedList costs roughly 40 bytes per element and defeats the CPU cache; it is almost never the right List.",
    "EnumMap and EnumSet are array- and bitmask-backed: the fastest maps and sets that exist in the JDK.",
  ],
  prerequisites: ["/java/collections", "/java/object-contracts"],
  sections: [
    {
      heading: "ArrayList and LinkedList, in memory",
      lede: "One array versus a chain of objects.",
      code: {
        title: "Example — growth, copying and the cost of remove",
        lang: "java",
        source: `// ArrayList: an Object[] plus a size. Default capacity 10 on first add.
List<Order> orders = new ArrayList<>();       // elementData is empty until the first add
// grow(): newCapacity = oldCapacity + (oldCapacity >> 1)   → 10, 15, 22, 33, 49, 73 …
// Each growth allocates a new array and System.arraycopy's everything across.

// Loading 1,000,000 rows without sizing: ~30 reallocations, and the largest copy
// moves ~700k references. Size it when you know:
List<Order> sized = new ArrayList<>(1_000_000);

// add(index, e) and remove(index) shift the tail with System.arraycopy:
orders.remove(0);       // O(n) — moves every remaining element down one slot
orders.remove(orders.size() - 1);   // O(1) — nothing to shift

// The arraycopy is fast per element (a bulk memory move), which is why ArrayList
// beats LinkedList even for mid-list inserts until the list is very large.

// LinkedList: a Node per element — prev, next, item — plus the object header.
// ~40 bytes per element against 4–8 for an ArrayList slot, and the nodes are
// scattered, so every traversal is a cache miss. get(i) walks the chain: O(n).
// Use it only as a Deque, and even then ArrayDeque is faster.`,
      },
      table: {
        caption: "Per-element cost and complexity (64-bit JVM, compressed oops).",
        headers: [
          "Structure",
          "Memory per element",
          "get(i)",
          "add at end",
          "add/remove in middle",
        ],
        rows: [
          ["ArrayList", "4 bytes (reference) + slack", "O(1)", "Amortised O(1)", "O(n) bulk move"],
          [
            "LinkedList",
            "~40 bytes (node)",
            "O(n)",
            "O(1)",
            "O(1) once positioned, O(n) to position",
          ],
          ["ArrayDeque", "4 bytes + slack", "—", "O(1) both ends", "not supported"],
          [
            "HashMap",
            "~32–40 bytes (Node + key/value refs)",
            "O(1) average",
            "O(1) average",
            "O(1) average",
          ],
          ["TreeMap", "~40 bytes (Entry with 3 refs + colour)", "O(log n)", "O(log n)", "O(log n)"],
        ],
      },
    },
    {
      heading: "Inside HashMap",
      lede: "Hash, spread, bucket, chain, tree, resize.",
      diagram: {
        kind: "flow",
        caption: "put(key, value) in a HashMap.",
        rows: [
          [
            { id: "h", label: "key.hashCode()" },
            { id: "s", label: "spread", sub: "h ^ (h >>> 16)", tone: "accent" },
            { id: "i", label: "index", sub: "(capacity - 1) & hash" },
          ],
          [
            { id: "empty", label: "Empty bucket", sub: "store the node", tone: "ok" },
            { id: "chain", label: "Collision", sub: "walk the chain, equals() each" },
            {
              id: "tree",
              label: "≥ 8 in a bucket",
              sub: "and table ≥ 64 → red-black tree",
              tone: "warn",
            },
          ],
          [
            { id: "size", label: "size > capacity × 0.75" },
            { id: "resize", label: "Resize", sub: "double capacity, redistribute", tone: "warn" },
          ],
        ],
      },
      code: {
        title: "Example — why the spread exists, and how to size a map",
        lang: "java",
        source: `// The index only uses the LOW bits: (capacity - 1) & hash. With capacity 16 that
// is the bottom 4 bits, so two keys differing only in their HIGH bits would
// collide. spread() mixes the high bits down:
//     static final int spread(int h) { return h ^ (h >>> 16); }
// That is the whole defence against a mediocre hashCode.

// TREEIFY: a bucket holding 8+ entries becomes a red-black tree, so a pathological
// bucket degrades to O(log n) instead of O(n) — mitigation for hash-collision DoS.
// But only when the table has 64+ slots; below that HashMap resizes instead.

// SIZING: the constructor takes CAPACITY, not expected size. Passing your expected
// count still resizes at 75% of it.
Map<String, Order> byId = new HashMap<>(1000);           // resizes at 750 entries
Map<String, Order> right = new HashMap<>((int) (1000 / 0.75f) + 1);
Map<String, Order> clearer = HashMap.newHashMap(1000);   // Java 19+: says what it means

// ITERATION ORDER is an implementation detail: it follows bucket layout, so it
// changes with capacity and between JDK versions. Never rely on it — use
// LinkedHashMap for insertion order or TreeMap for sorted order.

// null: HashMap allows one null key (it lands in bucket 0) and null values.
// ConcurrentHashMap, Map.of and Collectors.toMap all reject nulls.`,
      },
      callout: {
        kind: "warn",
        title: "The resize storm in a cache",
        text: "A HashMap filled on a hot path without sizing does log2(n) resizes, each copying every entry. In a request-scoped map that is noise; in a 5-million-entry startup cache it is seconds of CPU and a garbage spike. Size it, or use a library cache that sizes itself.",
      },
    },
    {
      heading: "LinkedHashMap, TreeMap, EnumMap",
      lede: "The three specialisations worth reaching for by name.",
      code: {
        title: "Example — access-ordered LRU, range queries, enum-keyed config",
        lang: "java",
        source: `// LINKEDHASHMAP — HashMap plus a doubly-linked list through the entries.
// accessOrder = true moves an entry to the end on every get, which is an LRU.
Map<String, Session> lru = new LinkedHashMap<>(64, 0.75f, true) {
    @Override protected boolean removeEldestEntry(Map.Entry<String, Session> eldest) {
        return size() > 1000;                       // evict the least recently used
    }
};
// Not thread-safe, and get() is a structural change under access order — wrap it
// or use Caffeine in production (chapter 29).

// TREEMAP — sorted by key, and the NavigableMap operations are the reason to use it.
NavigableMap<Instant, Reading> readings = new TreeMap<>();
readings.subMap(from, true, to, false);             // a time window, O(log n) to locate
readings.floorEntry(timestamp);                     // the reading at or before a moment
readings.headMap(cutoff).clear();                   // drop everything older, in place
// Rate-limit buckets, price ladders, time series and "find the band this value falls in"
// are all TreeMap problems. A HashMap cannot answer them without scanning.

// ENUMMAP / ENUMSET — backed by an array indexed by ordinal (EnumSet by a bitmask).
Map<Status, Integer> counts = new EnumMap<>(Status.class);
Set<Status> terminal = EnumSet.of(Status.PAID, Status.CANCELLED);
// No hashing, no boxing of the key, iteration in declaration order, and an EnumSet
// of up to 64 constants is a single long. Always prefer these for enum keys.

// IDENTITYHASHMAP uses == instead of equals (graph traversal, serialization).
// WEAKHASHMAP lets keys be collected — useful for metadata keyed by an object you
// do not own, dangerous as a general cache because entries vanish unpredictably.`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "How does HashMap work internally?",
          a: "The key's hashCode is spread by XOR-ing its high bits down, then masked with capacity − 1 to pick a bucket. Entries in a bucket form a chain compared with equals; a chain of 8 or more in a table of at least 64 becomes a red-black tree. When size exceeds capacity × load factor (0.75) the table doubles and entries are redistributed.",
        },
        {
          q: "Why is capacity always a power of two?",
          a: "So the bucket index can be computed with a bitmask, (capacity − 1) & hash, instead of a modulo — much cheaper. It also makes resizing a clean split of each bucket into two.",
        },
        {
          q: "When is LinkedList better than ArrayList?",
          a: "Almost never in practice. Its per-element node costs around 40 bytes and scatters memory, so traversal misses cache constantly, and positioning for a middle insert is already O(n). For queue and stack behaviour, ArrayDeque beats it on both memory and speed.",
        },
        {
          q: "How would you implement an LRU cache with the JDK?",
          a: "LinkedHashMap with accessOrder true and an overridden removeEldestEntry returning true beyond the size limit. It is not thread-safe, so synchronise it or use a purpose-built cache with per-entry expiry and metrics.",
        },
        {
          q: "You need “all events between two timestamps”. Which collection?",
          a: "A TreeMap keyed by timestamp, using subMap for the window — O(log n) to locate the boundaries and then a linear walk of just that range. A HashMap would require scanning every entry.",
        },
      ],
      takeaways: [
        "Size your lists and maps when the count is known.",
        "Bucket, chain, tree, resize — that is all HashMap does.",
        "Reach for LinkedHashMap, TreeMap, EnumMap by name when their shape fits.",
      ],
    },
  ],
  related: [
    "/java/collections",
    "/java/collections-choosing",
    "/java/collections-pitfalls",
    "/java/object-contracts",
    "/playgrounds/lru-cache",
  ],
  playground: "lru-cache",
  furtherReading: [
    {
      label: "Javadoc — HashMap",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html",
    },
    {
      label: "Javadoc — NavigableMap",
      href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/NavigableMap.html",
    },
  ],
};
