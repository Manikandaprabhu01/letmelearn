import type { Concept } from "@/data/types";

export const lldCreationalPatterns: Concept[] = [
  {
    slug: "factory",
    title: "Factory Method & Abstract Factory",
    subtitle: "Move the decision about which class to build into one place.",
    level: "foundational",
    minutes: 11,
    tags: ["patterns", "creational"],
    summary:
      "A factory answers one question — which concrete type do we build, and with what wiring — so that callers can hold an interface and never learn the answer. Simple factory is a function with a switch. Factory method defers the choice to a subclass. Abstract factory builds a whole family that must stay consistent with each other.",
    keyPoints: [
      "The point is not 'avoid new'. It is to have exactly one place that knows concrete types, so adding one is a small, safe diff.",
      "Simple factory: a static function or registry. This covers most interview answers, and that is fine — say so.",
      "Factory method: the base class defines the algorithm and calls createX(); the subclass decides the type.",
      "Abstract factory: several related products that must come from the same family (Postgres pair, MySQL pair).",
      "A factory whose switch grows for every new type has just moved the problem — use a registry keyed by the discriminator.",
    ],
    prerequisites: ["/lld/solid"],
    sections: [
      {
        heading: "Three things called 'factory'",
        table: {
          headers: ["", "Who decides the type", "Use when", "Cost"],
          rows: [
            [
              "Simple factory",
              "A function, from a parameter or config",
              "Parsing a discriminated payload; picking a strategy by name",
              "Not extensible without editing it — unless it is a registry",
            ],
            [
              "Factory method",
              "A subclass overrides createX()",
              "A template algorithm whose one variable step is 'which object'",
              "Requires inheritance, so it drags in a class hierarchy",
            ],
            [
              "Abstract factory",
              "An injected factory object, chosen at composition",
              "Several products must be consistent: connection + dialect + migrator",
              "One interface per product; verbose for two products",
            ],
          ],
        },
      },
      {
        heading: "Simple factory, done as a registry",
        lede: "Keeps open/closed instead of quietly breaking it.",
        code: [
          {
            title: "The version that grows a case per release",
            lang: "ts",
            source: `function makeNotifier(kind: string): Notifier {
  switch (kind) {                      // every new channel edits this file
    case "email": return new EmailNotifier(smtp);
    case "sms":   return new SmsNotifier(twilio);
    case "push":  return new PushNotifier(fcm);
    default: throw new Error("unknown " + kind);
  }
}`,
          },
          {
            title: "Registry — adding a channel is registration, not surgery",
            lang: "ts",
            source: `type NotifierFactory = (deps: Deps) => Notifier;

const REGISTRY = new Map<string, NotifierFactory>();
export function register(kind: string, make: NotifierFactory) { REGISTRY.set(kind, make); }

export function makeNotifier(kind: string, deps: Deps): Notifier {
  const make = REGISTRY.get(kind);
  if (!make) throw new UnknownChannel(kind);   // typed error, not a string throw
  return make(deps);
}

// each channel module registers itself at import time
register("email", (d) => new EmailNotifier(d.smtp));
register("sms",   (d) => new SmsNotifier(d.twilio));`,
          },
        ],
        callout: {
          kind: "note",
          text: "A registry trades compile-time exhaustiveness for runtime extensibility. If the set of types is closed and known, a switch over a union type that the compiler checks for exhaustiveness is genuinely better — say which trade you are making.",
        },
      },
      {
        heading: "Factory method: the template's variable step",
        body: [
          "Factory method belongs to an algorithm that is fixed except for what it instantiates. The base class runs the flow; the subclass supplies the product. It is inheritance-based, which is both its point and its limitation.",
        ],
        diagram: {
          kind: "uml",
          caption: "The base class owns the flow; subclasses own the product type.",
          boxes: [
            {
              name: "ExportJob",
              stereotype: "abstract",
              tone: "accent",
              members: [
                {
                  name: "run(rows)",
                  kind: "method",
                  note: "template: open → write → close → upload",
                },
                {
                  name: "createWriter(): Writer",
                  kind: "method",
                  vis: "#",
                  note: "the factory method",
                },
              ],
            },
            {
              name: "CsvExportJob",
              members: [
                { name: "createWriter()", kind: "method", vis: "#", note: "returns CsvWriter" },
              ],
            },
            {
              name: "ParquetExportJob",
              members: [
                { name: "createWriter()", kind: "method", vis: "#", note: "returns ParquetWriter" },
              ],
            },
            {
              name: "Writer",
              stereotype: "interface",
              tone: "accent",
              members: [
                { name: "writeRow(row)", kind: "method" },
                { name: "close(): Bytes", kind: "method" },
              ],
            },
          ],
          edges: [
            { from: "CsvExportJob", to: "ExportJob", kind: "extends" },
            { from: "ParquetExportJob", to: "ExportJob", kind: "extends" },
            {
              from: "ExportJob",
              to: "Writer",
              kind: "uses",
              label: "created by the factory method",
            },
          ],
        },
        code: {
          title: "Composition usually beats it in modern code",
          lang: "ts",
          source: `// Same behaviour, no inheritance: pass the factory in.
class ExportJob {
  constructor(private createWriter: () => Writer, private storage: Storage) {}

  async run(rows: AsyncIterable<Row>) {
    const w = this.createWriter();
    for await (const r of rows) w.writeRow(r);
    return this.storage.put(w.close());
  }
}

new ExportJob(() => new CsvWriter(), s3);
new ExportJob(() => new ParquetWriter({ compression: "zstd" }), s3);`,
        },
      },
      {
        heading: "Abstract factory: keeping a family consistent",
        lede: "The reason it exists is that mixing families is a bug you cannot see.",
        body: [
          "If a connection from Postgres is paired with a MySQL dialect, nothing fails at compile time and everything fails at 2am. Abstract factory makes the family the unit of choice: you pick PostgresFactory once, and every product you get from it is consistent by construction.",
        ],
        code: {
          title: "One choice, a consistent family",
          lang: "ts",
          source: `interface StorageFactory {
  connection(): Connection;
  dialect(): SqlDialect;
  migrator(): Migrator;
}

class PostgresFactory implements StorageFactory {
  constructor(private url: string) {}
  connection() { return new PgConnection(this.url); }
  dialect()    { return new PostgresDialect(); }
  migrator()   { return new PgMigrator(this.connection()); }
}

class SqliteFactory implements StorageFactory { /* ... */ }

// composition root picks the family exactly once
const factory: StorageFactory =
  env.DATABASE_URL.startsWith("postgres") ? new PostgresFactory(env.DATABASE_URL)
                                          : new SqliteFactory(env.DATABASE_FILE);`,
        },
        callout: {
          kind: "warn",
          text: "Abstract factory is the pattern most often applied speculatively. If there will only ever be one family, it is four extra interfaces buying nothing. The honest trigger is a second family that already exists — commonly 'production' and 'test/in-memory'.",
        },
      },
      {
        heading: "Practical notes",
        bullets: [
          "Static factory methods on a type (Money.fromCents, Duration.ofMinutes) are the cheapest and most underused form: named constructors that validate and cannot be confused with each other.",
          "Return the interface, not the concrete class — otherwise callers bind to the implementation anyway and the factory is decoration.",
          "Failure should be typed: an unknown discriminator is a domain error, not a generic Error with a string.",
          "Factories and DI containers overlap. If you already have a composition root, most 'factories' are just functions in it — that is a fine answer.",
          "If the product needs many optional parameters, you want a builder, not a factory with fifteen arguments.",
        ],
        takeaways: [
          "One place knows the concrete types; everyone else holds an interface.",
          "Prefer a registry or an injected factory function over a switch that grows.",
          "Abstract factory is about consistency across products, not about creation per se.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Factory method or abstract factory — which do you reach for?",
            a: "Usually neither in the textbook form. Most of the time I want a simple factory function or an injected creator, because that gets the seam without an inheritance hierarchy. Abstract factory earns its place when several products must come from the same family and mixing them is a silent bug. Factory method earns its place when a fixed algorithm has exactly one variable step and inheritance is already in the design.",
          },
          {
            q: "How does the factory get its dependencies?",
            a: "Injected, same as anything else. The factory is constructed in the composition root with the pool, the HTTP client, the config, and it closes over them. What I avoid is a factory that reaches into a global container at call time — that turns it into a service locator and hides the graph.",
          },
          {
            q: "How do you test code that uses a factory?",
            a: "Inject the factory, so the test passes one that returns fakes. If the factory is a static function I cannot substitute it, and I am back to testing through the real implementations — which is the main practical reason to prefer an injected factory object or function over a static.",
          },
        ],
      },
    ],
    related: ["/lld/builder", "/lld/strategy", "/lld/dependency-injection", "/lld/singleton-di"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
  },

  {
    slug: "builder",
    title: "Builder Pattern",
    subtitle: "Construct something complicated without a fifteen-argument constructor.",
    level: "foundational",
    minutes: 10,
    tags: ["patterns", "creational", "api-design"],
    summary:
      "Builder separates how an object is assembled from what it ends up being. Its real value is not the fluent chaining people remember, but validation at build() time and the ability to make illegal combinations impossible to express.",
    keyPoints: [
      "Trigger: many optional parameters, or several constructor overloads that differ only by which arguments you passed.",
      "Validate in build(), not in each setter — cross-field rules need the whole picture.",
      "Return an immutable product; the builder is the only mutable thing, and it is short-lived.",
      "A staged (type-safe) builder makes required fields a compile error rather than a runtime throw.",
      "In languages with named and default arguments, a builder is often unnecessary — say that rather than reciting the pattern.",
    ],
    sections: [
      {
        heading: "The problem it removes",
        code: [
          {
            title: "Telescoping constructors — what are those booleans?",
            lang: "ts",
            source: `new HttpRequest("GET", url, null, 3, 5000, true, false, null, "gzip");
//                                     ^     ^     ^     ^      ^
//              body ─┘  retries ─┘  timeout ─┘  followRedirects ─┘  ...
// Every call site is a puzzle, and swapping two booleans compiles fine.`,
          },
          {
            title: "Builder — each value is named, the product is immutable",
            lang: "ts",
            source: `const req = HttpRequest.builder(url)
  .method("POST")
  .header("content-type", "application/json")
  .body(JSON.stringify(payload))
  .timeout(5_000)
  .retries(3, { backoff: "exponential", jitter: true })
  .build();          // <- validation happens here, once

class HttpRequestBuilder {
  private headers = new Map<string, string>();
  private timeoutMs?: number;
  private bodyText?: string;
  private verb: Method = "GET";

  constructor(private url: string) {}

  method(m: Method) { this.verb = m; return this; }
  header(k: string, v: string) { this.headers.set(k.toLowerCase(), v); return this; }
  body(b: string) { this.bodyText = b; return this; }
  timeout(ms: number) { this.timeoutMs = ms; return this; }

  build(): HttpRequest {
    if (this.verb === "GET" && this.bodyText) throw new InvalidRequest("GET cannot have a body");
    if (this.bodyText && !this.headers.has("content-type")) {
      throw new InvalidRequest("body requires content-type");
    }
    return new HttpRequest({            // frozen, no setters
      url: this.url, method: this.verb,
      headers: Object.freeze(Object.fromEntries(this.headers)),
      body: this.bodyText, timeoutMs: this.timeoutMs ?? 30_000,
    });
  }
}`,
          },
        ],
        callout: {
          kind: "insight",
          text: "Those two cross-field checks in build() are the point of the pattern. No setter could have made them, because each one only sees its own field.",
        },
      },
      {
        heading: "Make illegal states unrepresentable",
        lede: "A staged builder turns a runtime throw into a compile error.",
        body: [
          "If url is required, the plain builder still lets you call build() without it and fail at runtime. Encoding the stage in the type means the method simply does not exist until the requirement is met — the strongest form of the pattern, and a good thing to mention even if you do not write it out.",
        ],
        code: {
          title: "Staged builder: build() only exists once the required parts are set",
          lang: "ts",
          source: `interface NeedsUrl    { url(u: string): NeedsMethod }
interface NeedsMethod { method(m: Method): Ready }
interface Ready       { header(k: string, v: string): Ready;
                        timeout(ms: number): Ready;
                        build(): HttpRequest }

// request().url("https://…").build()   ← does not compile: build() is not on NeedsMethod`,
        },
        diagram: {
          kind: "compare",
          caption: "Three ways to build a many-optioned object.",
          options: [
            {
              title: "Named / default arguments",
              sub: "Kotlin, Python, TS object literal",
              tone: "ok",
              good: [
                "No extra class",
                "Compiler checks required fields",
                "Reads well at the call site",
              ],
              bad: [
                "No natural place for cross-field validation",
                "Awkward if construction happens in steps across a codebase",
              ],
              verdict: "Default choice in a language that has them.",
            },
            {
              title: "Classic fluent builder",
              good: [
                "Cross-field validation in build()",
                "Assembly can be spread across code paths",
                "Product can stay immutable",
              ],
              bad: [
                "Missing required field fails at runtime",
                "Boilerplate, and two objects to keep in sync",
              ],
              verdict: "Java-style APIs, or when assembly is genuinely multi-step.",
            },
            {
              title: "Staged builder",
              good: [
                "Required fields enforced by the type system",
                "Impossible to call build() too early",
              ],
              bad: [
                "One interface per stage; verbose",
                "Painful when ordering is not naturally linear",
              ],
              verdict: "Public SDKs where misuse must be impossible.",
            },
          ],
        },
      },
      {
        heading: "Director, and when it matters",
        body: [
          "The Gang of Four version adds a director that knows a recipe: given a builder, produce a standard configuration. In practice this is how you get named presets without duplicating knowledge of the fields at every call site.",
        ],
        code: {
          title: "Presets as recipes over the same builder",
          lang: "ts",
          source: `const Presets = {
  internal: (b: HttpRequestBuilder) =>
    b.timeout(1_000).retries(2).header("x-internal", "1"),

  thirdParty: (b: HttpRequestBuilder) =>
    b.timeout(10_000).retries(5, { backoff: "exponential" })
     .header("user-agent", "lattice/1.0"),
};

const req = Presets.thirdParty(HttpRequest.builder(url)).method("GET").build();`,
        },
      },
      {
        heading: "Mistakes reviewers flag",
        table: {
          headers: ["Mistake", "Consequence", "Fix"],
          rows: [
            [
              "Builder returns a mutable product",
              "Callers mutate a shared object after build; invariants evaporate",
              "Freeze/copy on build; no setters on the product",
            ],
            [
              "Reusing one builder for many products",
              "Second product silently inherits the first's fields",
              "build() returns and resets, or make the builder single-use and say so",
            ],
            [
              "Validation scattered in setters",
              "Cross-field rules cannot be expressed; error appears at the wrong step",
              "Collect in build(), and report all violations at once",
            ],
            [
              "Builder for a 3-field value object",
              "Ceremony with no benefit",
              "A constructor or an object literal",
            ],
            [
              "Thread-shared builder",
              "Torn state, non-deterministic products",
              "Builders are local and short-lived; never share one",
            ],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "When would you not use a builder?",
            a: "When the language gives me named parameters with defaults, and there are no cross-field rules — a plain call or an options object is clearer and there is nothing to keep in sync. I would also skip it for small value objects; three required fields is a constructor.",
          },
          {
            q: "How do you make required fields safe?",
            a: "Either take them in the builder's constructor (so you cannot get a builder without them) or use a staged builder where build() appears only on the final interface. I prefer the constructor approach for two or three requirements and the staged version for a public SDK where a runtime failure would be a bad first experience.",
          },
          {
            q: "Is the fluent chaining important?",
            a: "It is the least important part. What matters is validating once with the full picture and returning an immutable product. Chaining is ergonomics — and it can actively hurt if it encourages very long expressions that are hard to debug, since a stack trace points at one giant statement.",
          },
        ],
      },
    ],
    related: ["/lld/factory", "/lld/solid", "/lld/repository"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
    ],
  },
];
