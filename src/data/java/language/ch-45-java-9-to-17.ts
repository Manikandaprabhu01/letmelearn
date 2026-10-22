import type { Concept } from "@/data/types";

export const javaNineToSeventeen: Concept = {
  slug: "java-9-to-17",
  title: "Java 9–17: Modules, var, Records & Sealed Types",
  subtitle:
    "Chapter 45 — what each release added, the two LTS steps (11 and 17), and what actually breaks when you move off Java 8",
  level: "intermediate",
  minutes: 30,
  tags: ["java 9", "java 11", "java 17", "modules", "records", "text blocks", "migration"],
  summary:
    "Between 9 and 17 Java picked up the features most teams now take for granted: collection factories, var, a real HTTP client, text blocks, switch expressions, records, sealed types and pattern matching for instanceof. It also removed things — the Java EE modules and free access to JDK internals — which is where an 8-to-17 migration actually spends its time.",
  keyPoints: [
    "Java 11 and 17 are the LTS steps most codebases moved through; each removed something that breaks builds.",
    "var infers from the initialiser: it removes repetition, not the type.",
    "Text blocks end string concatenation for SQL and JSON, with explicit control over trailing whitespace.",
    "switch expressions return a value and are exhaustive — no fall-through, no forgotten break.",
    "Records and sealed types (16 and 17) are the modelling pair; see chapter 36 for how they work together.",
  ],
  prerequisites: ["/java/java-8-features"],
  sections: [
    {
      heading: "Java 9–11: the platform changes",
      table: {
        caption: "The additions people use every day.",
        headers: ["Version", "Feature", "Why it matters"],
        rows: [
          [
            "9",
            "Collection factories — List.of, Map.of",
            "Immutable literals without helper methods",
          ],
          ["9", "Module system (JPMS)", "Strong encapsulation; jlink can build a minimal runtime"],
          [
            "9",
            "Private interface methods, Stream.iterate with a predicate, Optional.stream",
            "Fills gaps left by Java 8",
          ],
          ["9", "JShell", "A REPL for trying an API without a project"],
          ["10", "var for local variables", "Less repetition in obvious declarations"],
          ["11 (LTS)", "HttpClient (final)", "HTTP/2, async, no third-party client needed"],
          [
            "11 (LTS)",
            "String.isBlank, strip, lines, repeat; Files.readString/writeString",
            "The utilities everyone had written by hand",
          ],
          ["11 (LTS)", "Single-file source launch — java Script.java", "Scripts without a build"],
          ["11 (LTS)", "Java EE and CORBA modules removed", "The most common 8→11 build break"],
        ],
      },
      code: {
        title: "Example — var, and the HTTP client that replaced three dependencies",
        lang: "java",
        source: `// var: the type is still static and still checked; it is only the source that is shorter.
var ordersByCity = new HashMap<String, List<Order>>();     // obvious from the right side
var line = reader.readLine();                              // String, clear enough

// Where var HURTS readability, write the type:
var result = service.process(input);      // what is result? Now the reader must go look.
var list = new ArrayList<>();             // ArrayList<Object> — silently wrong, compiles

// Rules: local variables only (no fields, parameters or return types), an
// initialiser is required, and null alone is not enough to infer from.

// HttpClient — built in since 11, with timeouts that actually exist (chapter 31):
HttpClient client = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .connectTimeout(Duration.ofSeconds(2))
    .build();

HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.acme.com/v1/rates/EUR"))
    .timeout(Duration.ofSeconds(3))
    .header("accept", "application/json")
    .GET()
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
if (response.statusCode() >= 400) throw new RatesUnavailableException(response.statusCode());

// Async, when you need it:
CompletableFuture<HttpResponse<String>> future =
    client.sendAsync(request, HttpResponse.BodyHandlers.ofString());`,
      },
      callout: {
        kind: "warn",
        title: "The 8 → 11 breakages",
        text: "Removed Java EE modules (javax.xml.bind, javax.activation, javax.annotation) must come back as explicit dependencies; ImageIO and JAXB usages surface as NoClassDefFoundError at runtime; and reflective access into JDK internals starts warning here before becoming an error in 17. Run jdeps --jdk-internals on your jars before the upgrade, not after.",
      },
    },
    {
      heading: "Java 12–16: the language gets shorter",
      code: {
        title: "Example — switch expressions, text blocks, instanceof patterns",
        lang: "java",
        source: `// SWITCH EXPRESSIONS (14) — a value, no fall-through, exhaustive over an enum.
int slaHours = switch (priority) {
    case P1 -> 1;
    case P2 -> 4;
    case P3, P4 -> 24;                       // multiple labels, no break needed
    // no default: the compiler checks every enum constant is covered
};

// yield for a block body:
Money fee = switch (tier) {
    case FREE -> Money.ZERO;
    case PRO -> {
        Money base = Money.inr("499");
        yield hasAddOn ? base.plus(Money.inr("199")) : base;
    }
};

// TEXT BLOCKS (15) — the closing delimiter sets the indentation to strip.
String sql = """
    SELECT o.id, o.total, c.name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.status = ?
      AND o.placed_at >= ?
    """;
// \\s keeps a trailing space; a trailing \\ joins the next line without a newline.
// Still parameterised SQL — a text block does not make concatenation safe (chapter 11).

// PATTERN MATCHING FOR instanceof (16) — test and bind in one step.
if (event instanceof PaymentCaptured captured && captured.amount().isPositive()) {
    ledger.credit(captured.amount());        // no cast, and the variable is scoped correctly
}

// HELPFUL NULL POINTER EXCEPTIONS (14, on by default from 15) turn
//   "NullPointerException" at line 42
// into
//   "Cannot invoke String.length() because the return value of Order.trackingId() is null"
// which usually removes the debugging step entirely.

// Also in this window: records (16), jpackage (16), Stream.toList (16),
// Files.mismatch (12), Collectors.teeing (12), and ZGC/Shenandoah maturing.`,
      },
    },
    {
      heading: "Java 17 (LTS): sealed types and stricter internals",
      bullets: [
        "Sealed classes and interfaces became final (JEP 409) — the other half of the modelling pair with records. Chapter 36 covers the design.",
        "Pattern matching for switch arrived as a preview here and finalised in 21, so 17 codebases usually still write if-else chains over instanceof patterns.",
        "Strong encapsulation of JDK internals (JEP 403) is the migration cost: --illegal-access no longer opens the door, so anything reaching into sun.* or unexported packages fails unless you add --add-opens. Old Lombok, Mockito, Hibernate and serialization libraries were the usual culprits; upgrading them is the fix, not the flag.",
        "The Security Manager was deprecated for removal (JEP 411) — it is permanently disabled in 24 — and always-strict floating point (JEP 306) removed the strictfp distinction.",
        "RandomGenerator (JEP 356) gave the JDK a proper family of PRNG algorithms, including splittable and jumpable generators for parallel work.",
      ],
      code: {
        title: "Example — the flags that let an old stack run on 17, and how to retire them",
        lang: "bash",
        source: `# Symptom: InaccessibleObjectException or "module java.base does not opens java.lang"
java --add-opens=java.base/java.lang=ALL-UNNAMED -jar app.jar

# These flags are a bridge, not a destination: each one is a library that has not
# been updated. Find them before the upgrade:
jdeps --jdk-internals --multi-release 17 build/libs/app.jar

# Then upgrade the offenders. A useful order for an 8 → 17 move:
#   1. Build on 8, run tests on 11 and 17 in CI (toolchains make this cheap).
#   2. Fix removed EE modules by adding explicit dependencies.
#   3. Upgrade byte-code-manipulating libraries (Lombok, Mockito, ASM, Hibernate).
#   4. Remove --add-opens flags one at a time; each removal is a small PR.
#   5. Only then switch the compiler --release to 17 and start using the new syntax.`,
      },
    },
    {
      heading: "Questions interviewers ask",
      followUps: [
        {
          q: "What does var actually do?",
          a: "It infers the static type of a local variable from its initialiser. The type is fixed and checked as always — nothing becomes dynamic. It is a readability tool: good when the right-hand side already names the type, bad when it hides what a method returned.",
        },
        {
          q: "Why do switch expressions matter beyond syntax?",
          a: "They produce a value, so there is no half-assigned variable; there is no fall-through, so a missing break cannot cause a bug; and over an enum or sealed type the compiler checks exhaustiveness, which turns a new case into a compile error instead of a silent default.",
        },
        {
          q: "What usually breaks when moving from Java 8 to 17?",
          a: "Removed Java EE modules such as javax.xml.bind, libraries that reflect into JDK internals now that strong encapsulation is enforced, and older byte-code tools. The fix is upgrading those libraries; --add-opens is a temporary bridge.",
        },
        {
          q: "Is the module system something every project should adopt?",
          a: "No. Most applications get the benefits — smaller runtimes via jlink, clearer dependencies — without declaring modules themselves, and the classpath still works. Modules pay off for libraries and for deliverables that ship their own runtime image.",
        },
      ],
      takeaways: [
        "11 and 17 are the steps; the work is dependency upgrades, not syntax.",
        "var, text blocks and switch expressions remove noise, not types.",
        "Records plus sealed types changed how domain models are written.",
      ],
    },
  ],
  related: [
    "/java/java-8-features",
    "/java/java-17-to-21",
    "/java/sealed-records",
    "/java/jdk-migration",
    "/java/java-8",
  ],
  furtherReading: [
    { label: "JDK 17 release page", href: "https://openjdk.org/projects/jdk/17/" },
    { label: "JEP 409 — Sealed Classes", href: "https://openjdk.org/jeps/409" },
    { label: "JEP 403 — Strongly Encapsulate JDK Internals", href: "https://openjdk.org/jeps/403" },
  ],
};
