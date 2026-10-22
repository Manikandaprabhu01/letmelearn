import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const javaCore: Concept[] = [
  {
    slug: "networking",
    title: "Java Networking",
    subtitle: "Chapter 5 — sockets, HTTP clients, timeouts and connection pooling",
    level: "intermediate",
    minutes: 18,
    tags: ["networking", "http", "sockets", "timeouts"],
    summary:
      "You will rarely write a raw socket, but you will call HTTP services constantly — and the defaults will hurt you. The content that matters is timeouts, connection pooling and retry behaviour, because an un-timed-out call is how one slow dependency takes your whole service down.",
    keyPoints: [
      "Every outbound call needs both a connect timeout and a read timeout. Neither defaults to something safe.",
      "Reuse connections through a pool — TLS handshakes are expensive.",
      "Retries without backoff and jitter turn a blip into a stampede.",
      "The modern choice is java.net.http.HttpClient or Spring's RestClient / WebClient.",
    ],
    prerequisites: ["/java/basics"],
    sections: [
      {
        heading: "The HTTP client, with the settings that matter",
        code: {
          title: "Example — a client configured for production rather than a demo",
          lang: "java",
          source: `HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .connectTimeout(Duration.ofSeconds(5))       // TCP + TLS handshake budget
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();

HttpRequest request = HttpRequest.newBuilder(URI.create(url))
    .timeout(Duration.ofSeconds(10))             // READ timeout — the one people forget
    .header("Idempotency-Key", key)              // safe retries
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, BodyHandlers.ofString());

// WITHOUT the request timeout, a hung server holds your thread forever. With a
// thread-per-request server and a dependency that stops responding, that is a
// full outage caused by someone else's problem.

// Retries need backoff AND jitter. Without jitter every client retries in
// lockstep and hits the recovering service simultaneously.
long delay = (long) (Math.pow(2, attempt) * 100 + ThreadLocalRandom.current().nextInt(100));`,
        },
        bullets: [
          "Connect timeout and read timeout are different failures: one is 'cannot reach', the other is 'reached but silent'. Set both.",
          "Only retry idempotent operations, or send an idempotency key so a retried POST cannot double-charge.",
          "Pair retries with a circuit breaker — retrying into a dependency that is down adds load to something already failing.",
          "In Spring, prefer RestClient (blocking) or WebClient (reactive) over the deprecated RestTemplate for new code.",
        ],
        links: [
          {
            label: "Baeldung — Java HttpClient",
            href: "https://www.baeldung.com/java-9-http-client",
          },
          { label: "Site: circuit breakers", href: "/hld/circuit-breaker" },
          {
            label: "YouTube search — Java HttpClient timeouts retries tutorial",
            href: YT("java httpclient timeout retry connection pool tutorial"),
          },
        ],
      },
    ],
    related: ["/java/spring-framework", "/hld/circuit-breaker"],
    furtherReading: [
      {
        label: "Baeldung — networking in Java",
        href: "https://www.baeldung.com/a-guide-to-java-sockets",
      },
    ],
  },

  {
    slug: "collections",
    title: "Collections Framework",
    subtitle: "Chapter 6 — List, Set, Map, their implementations, and choosing correctly",
    level: "foundational",
    minutes: 26,
    tags: ["collections", "list", "map", "set", "performance"],
    summary:
      "Collections are the most-used part of the standard library and the easiest place to make a quiet performance mistake. Almost all of it reduces to one table — which implementation for which access pattern — plus knowing which ones are safe to share between threads.",
    keyPoints: [
      "ArrayList for almost every list; LinkedList is rarely the right answer.",
      "HashMap for lookup; TreeMap when you need order; LinkedHashMap for insertion order or LRU.",
      "A HashMap key must have correct equals and hashCode — see chapter 2.",
      "For concurrent access use ConcurrentHashMap, never a synchronized wrapper.",
    ],
    prerequisites: ["/java/oop"],
    sections: [
      {
        heading: "Choosing an implementation",
        table: {
          caption: "The table worth memorising — complexities are amortised.",
          headers: ["Type", "Use when", "Get", "Add", "Note"],
          rows: [
            ["ArrayList", "Default list", "O(1)", "O(1)*", "Contiguous, cache-friendly"],
            [
              "LinkedList",
              "Heavy insert/remove at the ends",
              "O(n)",
              "O(1)",
              "Usually still loses to ArrayList",
            ],
            ["HashMap", "Default map", "O(1)", "O(1)", "No ordering guarantee"],
            [
              "LinkedHashMap",
              "Insertion order, or LRU",
              "O(1)",
              "O(1)",
              "accessOrder=true gives LRU",
            ],
            [
              "TreeMap",
              "Sorted keys, range queries",
              "O(log n)",
              "O(log n)",
              "Needs Comparable or Comparator",
            ],
            ["HashSet", "Uniqueness", "O(1)", "O(1)", "Backed by HashMap"],
            ["ArrayDeque", "Stack or queue", "O(1)", "O(1)", "Prefer over Stack and LinkedList"],
            [
              "ConcurrentHashMap",
              "Shared across threads",
              "O(1)",
              "O(1)",
              "Lock-striped, no global lock",
            ],
          ],
        },
        code: {
          title: "Example — an LRU cache in six lines, using LinkedHashMap",
          lang: "java",
          source: `// accessOrder = true reorders on every get(), so the eldest entry is the
// least recently USED rather than the least recently inserted.
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LruCache(int capacity) {
        super(16, 0.75f, true);          // ← the third argument is the whole trick
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;        // evict once over capacity
    }
}

// Not thread-safe. For concurrent use, wrap with Collections.synchronizedMap
// and synchronize iteration too — or use Caffeine, which is what production
// code actually does.`,
        },
        bullets: [
          "LinkedList's O(1) insert only helps if you already hold the node. Finding the position is O(n), and ArrayList's contiguous memory usually wins in practice anyway.",
          "Size a HashMap up front when you know the count — new HashMap<>(expected / 0.75f + 1) avoids repeated rehashing.",
          "Prefer List.of(), Map.of() and Set.of() for immutable constants. They are compact and genuinely unmodifiable.",
          "Never mutate a collection while iterating it — use an Iterator's remove(), or removeIf().",
        ],
        links: [
          {
            label: "Baeldung — Java collections guide",
            href: "https://www.baeldung.com/java-collections",
          },
          { label: "Site: LRU cache design", href: "/lld/lru-cache" },
          {
            label: "YouTube search — Java collections framework explained",
            href: YT("java collections framework arraylist hashmap explained"),
          },
        ],
      },
    ],
    related: [
      "/java/collections-internals",
      "/java/collections-choosing",
      "/java/collections-pitfalls",
      "/java/concurrent-collections",
      "/lld/lru-cache",
    ],
    furtherReading: [
      { label: "Baeldung — collections", href: "https://www.baeldung.com/java-collections" },
    ],
  },

  {
    slug: "strings-and-regex",
    title: "Strings & Regular Expressions",
    subtitle:
      "Chapter 7 — immutability, StringBuilder, text blocks and regex that does not explode",
    level: "foundational",
    minutes: 20,
    tags: ["strings", "regex", "stringbuilder", "text blocks"],
    summary:
      "Strings are immutable, which is why concatenating in a loop is the classic Java performance bug. Regex is powerful and occasionally catastrophic — a badly written pattern can hang a thread for minutes on a crafted input, which is a denial-of-service vector.",
    keyPoints: [
      "String is immutable — every concatenation allocates a new object.",
      "Use StringBuilder in loops; the compiler only optimises simple cases.",
      "Compile regex patterns once as static finals, never per call.",
      "Catastrophic backtracking is a real DoS risk on user-supplied input.",
    ],
    prerequisites: ["/java/basics"],
    sections: [
      {
        heading: "Immutability and StringBuilder",
        code: {
          title: "Example — the loop that quietly costs quadratic time",
          lang: "java",
          source: `// BAD — each += allocates a NEW String and copies everything so far.
// 10,000 iterations means ~10,000 allocations and O(n²) copying.
String result = "";
for (String part : parts) {
    result += part + ", ";
}

// GOOD — one buffer, resized occasionally
StringBuilder sb = new StringBuilder();
for (String part : parts) {
    sb.append(part).append(", ");
}
String result = sb.toString();

// BETTER when you just want to join
String result = String.join(", ", parts);

// Text blocks (Java 15+) — no more escaped quotes in embedded JSON or SQL
String query = """
    SELECT id, email
      FROM users
     WHERE tenant_id = ?
       AND status = 'active'
    """;

// The compiler DOES optimise simple concatenation outside loops, so
// "a" + b + "c" on one line is fine. It is the loop that hurts.`,
        },
        bullets: [
          "String literals are interned in a shared pool, which is why == sometimes appears to work on strings — do not rely on it, use .equals().",
          "Use StringBuilder, not StringBuffer: the latter is synchronised and you almost never need that.",
          "For formatting, prefer String.format or a text block over long concatenation chains — it reads better and localises more easily.",
        ],
        links: [
          {
            label: "Baeldung — String performance",
            href: "https://www.baeldung.com/java-string-performance",
          },
          {
            label: "YouTube search — Java String immutability StringBuilder",
            href: YT("java string immutability stringbuilder string pool explained"),
          },
        ],
      },
      {
        heading: "Regex, and the pattern that hangs your server",
        code: {
          title: "Example — catastrophic backtracking, and how to avoid it",
          lang: "java",
          source: `// Compile ONCE. Pattern.compile is expensive; doing it per call in a hot
// path is a common and invisible performance bug.
private static final Pattern EMAIL =
    Pattern.compile("^[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]+$");

boolean valid = EMAIL.matcher(input).matches();

// CATASTROPHIC BACKTRACKING — nested quantifiers over overlapping input.
// Pattern: (a+)+$   Input: "aaaaaaaaaaaaaaaaaaaaaaaaaaX"
// The engine tries exponentially many ways to split the a's before failing.
// 30 characters can take minutes. On user input, that is a DoS.

// DEFENCES:
// 1. Avoid nested quantifiers — (a+)+ and (a|aa)+ are the classic shapes.
// 2. Use possessive quantifiers, which never backtrack:  a++  instead of  a+
// 3. Bound the input length BEFORE matching.
if (input.length() > 320) return false;      // longest valid email
// 4. For anything user-supplied and complex, prefer a real parser to a regex.`,
        },
        bullets: [
          "Declare patterns as private static final. Compiling per invocation is both slow and allocates needlessly.",
          "Never build a regex by concatenating user input — it is injection, with the same shape as SQL injection.",
          "If a pattern needs a comment to understand, it probably wants Pattern.COMMENTS mode or a parser instead.",
        ],
        links: [
          {
            label: "Baeldung — regular expressions in Java",
            href: "https://www.baeldung.com/regular-expressions-java",
          },
          {
            label: "OWASP — Regular expression denial of service",
            href: "https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS",
          },
        ],
      },
    ],
    related: ["/java/basics", "/java/security"],
    furtherReading: [{ label: "Baeldung — strings", href: "https://www.baeldung.com/java-string" }],
  },
];
