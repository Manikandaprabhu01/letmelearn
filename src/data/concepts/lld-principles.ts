import type { Concept } from "@/data/types";

export const lldPrinciples: Concept[] = [
  {
    slug: "solid",
    title: "SOLID Principles",
    subtitle: "Five constraints that keep an object design changeable.",
    level: "foundational",
    minutes: 16,
    tags: ["oop", "principles"],
    summary:
      "A low-level design interview is not a test of whether you can draw twenty classes. It is a test of whether the twentieth requirement can be added without rewriting the first nineteen. SOLID is the vocabulary for that property, and every one of the five letters is really the same idea seen from a different angle: put the thing that changes behind a seam, and depend on the seam.",
    keyPoints: [
      "SRP: one reason to change per class. If you cannot describe a class without 'and', split it.",
      "OCP: new behaviour arrives as a new class, not as a new branch in an old switch.",
      "LSP: a subtype must be usable through the parent's contract without the caller checking its type.",
      "ISP: clients depend on the narrow interface they actually call, not the fat one you happened to write.",
      "DIP: policy owns the interface; details implement it. The arrow of dependency points at the abstraction.",
    ],
    sections: [
      {
        heading: "Why these five, and not fifty",
        lede: "Each principle protects a different joint in the design.",
        body: [
          "Software gets hard to change for a small number of repeatable reasons. A class accumulates unrelated jobs until every change touches it. A conditional grows a new branch for every new case. A subclass quietly breaks a promise its parent made. An interface grows until implementers write stubs. A domain rule reaches out and touches a database driver directly. SOLID names one antidote for each.",
          "The practical test is not 'did I obey the letters' but 'when the next requirement lands, how many files do I open, and do I have to understand them all?' A good design answers: one new file, and no.",
        ],
        table: {
          headers: ["", "Means", "The smell when it is missing", "The fix"],
          rows: [
            [
              "S — Single responsibility",
              "One reason to change per class",
              "A 900-line service mixing HTTP parsing, business rules and SQL",
              "Split along the axes of change: transport, policy, persistence",
            ],
            [
              "O — Open/closed",
              "Extend by adding types, not editing old ones",
              "switch (type) that grows a case per release",
              "Strategy, or a registry keyed by type",
            ],
            [
              "L — Liskov substitution",
              "Subtypes honour the parent's contract",
              "Overrides that throw UnsupportedOperation, or callers doing instanceof",
              "Model the real hierarchy, or use composition instead of inheritance",
            ],
            [
              "I — Interface segregation",
              "Clients depend on slim surfaces",
              "Implementers full of empty methods, mocks with 14 stubs",
              "Split the fat interface by client, not by data",
            ],
            [
              "D — Dependency inversion",
              "Policy defines the interface, details implement it",
              "new PostgresRepo() inside a domain service; tests need a database",
              "Inject the abstraction, own it in the domain layer",
            ],
          ],
        },
      },
      {
        heading: "S — Single responsibility, concretely",
        lede: "Split along axes of change, not along nouns.",
        body: [
          "The common misreading is 'a class should do one thing', which leads to a swarm of one-method classes. The useful reading is Parnas': a module should have one reason to change — one stakeholder, one policy, one rate of change. Report formatting changes when marketing changes its mind; report arithmetic changes when finance does. Two stakeholders, two classes.",
          "The tell in an interview is when you describe a class and need the word 'and'. 'OrderService validates the cart and charges the card and writes the invoice and emails the customer.' That is four reasons to change, four reasons for a merge conflict, and a test that needs four fakes.",
        ],
        code: [
          {
            title: "Before — one class, four stakeholders",
            lang: "ts",
            source: `class OrderService {
  place(cart: Cart, card: CardDetails) {
    if (cart.items.length === 0) throw new Error("empty");   // rules
    const total = cart.items.reduce((s, i) => s + i.price, 0); // pricing
    stripe.charge(card, total);                               // payments
    db.query("INSERT INTO invoices ...");                     // persistence
    smtp.send(cart.email, "Thanks for your order");           // notification
  }
}`,
          },
          {
            title: "After — one reason to change each, wired by the use case",
            lang: "ts",
            source: `class PlaceOrder {                 // orchestration only
  constructor(
    private pricing: PricingPolicy,
    private payments: PaymentGateway,
    private orders: OrderRepository,
    private events: EventBus,
  ) {}

  async run(cart: Cart, card: CardDetails): Promise<OrderId> {
    const total = this.pricing.total(cart);          // changes with finance
    const receipt = await this.payments.charge(card, total);
    const id = await this.orders.save(Order.from(cart, receipt));
    this.events.publish(new OrderPlaced(id));        // email is a subscriber
    return id;
  }
}`,
          },
        ],
        callout: {
          kind: "insight",
          text: "Notice what the split bought: the notification became an event subscriber, so adding SMS later is a new subscriber class and zero edits to PlaceOrder. SRP is what makes OCP possible.",
        },
      },
      {
        heading: "O — Open/closed, and the switch that grows",
        lede: "Every 'add a case here' request is a design telling you where the seam belongs.",
        body: [
          "Open/closed does not mean you never edit code. It means the code you edit is small and predictable: you add a class and register it, rather than reopening a well-tested algorithm and threading a new branch through it.",
          "The heuristic: if you can predict the shape of the next requirement ('another payment method', 'another rate-limit algorithm', 'another export format'), put that axis behind an interface now. If you cannot predict it, do not — speculative abstraction costs more than the switch would.",
        ],
        diagram: {
          kind: "uml",
          caption: "Pricing stays closed; new fare rules arrive as new classes.",
          boxes: [
            {
              name: "FarePolicy",
              stereotype: "interface",
              tone: "accent",
              members: [{ name: "fare(trip: Trip): Money", kind: "method" }],
            },
            {
              name: "StandardFare",
              members: [{ name: "fare(trip)", kind: "method", note: "base + per-km" }],
            },
            {
              name: "SurgeFare",
              members: [{ name: "fare(trip)", kind: "method", note: "multiplier by demand" }],
            },
            {
              name: "AirportFare",
              members: [{ name: "fare(trip)", kind: "method", note: "flat + toll" }],
            },
            {
              name: "PricingService",
              members: [
                { name: "policy: FarePolicy", kind: "field", vis: "-" },
                { name: "quote(trip): Money", kind: "method" },
              ],
            },
          ],
          edges: [
            { from: "StandardFare", to: "FarePolicy", kind: "implements" },
            { from: "SurgeFare", to: "FarePolicy", kind: "implements" },
            { from: "AirportFare", to: "FarePolicy", kind: "implements" },
            { from: "PricingService", to: "FarePolicy", kind: "has", label: "injected, never constructed" },
          ],
        },
        code: {
          title: "The registry variant — open/closed without a factory switch",
          lang: "ts",
          source: `const policies = new Map<TripKind, FarePolicy>([
  ["standard", new StandardFare()],
  ["airport",  new AirportFare()],
]);

// Adding "surge" is one line here plus one new file.
// PricingService never changes.
class PricingService {
  constructor(private policies: Map<TripKind, FarePolicy>) {}
  quote(trip: Trip): Money {
    const policy = this.policies.get(trip.kind) ?? this.policies.get("standard")!;
    return policy.fare(trip);
  }
}`,
        },
      },
      {
        heading: "L — Liskov, beyond square-and-rectangle",
        lede: "The contract includes preconditions, postconditions and invariants — not just method names.",
        body: [
          "A subtype substitutes safely when it weakens no precondition, breaks no postcondition, and preserves every invariant the parent promised. The compiler checks the signature; only you can check the promise.",
          "The classic failure is not Square/Rectangle but the collection that throws. ImmutableList extends List and throws on add(). Every caller that holds a List must now either avoid add() or catch — which means List's contract was a lie, and the type system stopped helping.",
        ],
        table: {
          headers: ["Violation", "What breaks", "Better model"],
          rows: [
            [
              "ReadOnlyList.add() throws",
              "Callers must know the concrete type",
              "Separate ReadableList and MutableList interfaces (this is also ISP)",
            ],
            [
              "Penguin extends Bird with fly()",
              "fly() has no sane implementation",
              "Bird has no fly(); FlyingBird does",
            ],
            [
              "SavingsAccount tightens withdraw() to reject below minimum",
              "A precondition got stronger, so code written against Account fails",
              "Return a Result/violation object rather than throwing new kinds of error",
            ],
            [
              "Subclass caches and returns stale reads",
              "Postcondition 'returns current value' broken",
              "Make staleness explicit in the interface (getCached vs get)",
            ],
          ],
        },
        callout: {
          kind: "interview",
          text: "If you find yourself writing instanceof or a type tag to decide what to do with a subtype, say so out loud and fix it — that check is the runtime paying for a broken Liskov promise, and interviewers listen for it.",
        },
      },
      {
        heading: "I and D — the two that show up in every design",
        lede: "Slim interfaces owned by the caller's layer.",
        body: [
          "Interface segregation says: split the interface by who calls it. A Printer/Scanner/Fax combo device should not force a plain printer to implement scan(). In practice, the fat interface usually appears because someone modelled the device instead of the use cases.",
          "Dependency inversion is the one that changes your architecture. The domain layer declares OrderRepository — an interface expressed in domain nouns, owned by the domain package. The infrastructure layer implements PostgresOrderRepository. Compile-time dependency now points inward, and the domain can be tested with an in-memory implementation in microseconds.",
        ],
        diagram: {
          kind: "flow",
          caption: "DIP: the arrow that would have pointed out to the driver now points in at the interface.",
          rows: [
            [
              { id: "uc", label: "PlaceOrder", sub: "use case", tone: "accent" },
              { id: "port", label: "OrderRepository", sub: "interface, owned by domain", tone: "accent" },
            ],
            [
              { id: "pg", label: "PostgresOrderRepository", sub: "infrastructure" },
              { id: "mem", label: "InMemoryOrderRepository", sub: "tests", tone: "ok" },
            ],
          ],
        },
        code: {
          title: "ISP + DIP together",
          lang: "ts",
          source: `// domain/ports.ts — owned by the domain, named in domain language
export interface OrderReader { byId(id: OrderId): Promise<Order | null> }
export interface OrderWriter { save(order: Order): Promise<OrderId> }
// A read-only report service depends on OrderReader alone.

// infra/postgres.ts — depends on the domain, not the other way round
export class PostgresOrders implements OrderReader, OrderWriter {
  constructor(private sql: Sql) {}
  async byId(id: OrderId) { /* ... */ }
  async save(order: Order) { /* ... */ }
}`,
        },
      },
      {
        heading: "Where SOLID stops helping",
        lede: "The principles have costs, and a senior answer names them.",
        bullets: [
          "Every seam is indirection. Five interfaces with one implementation each is not a design, it is a maze — apply the seam when the second implementation is real or clearly imminent.",
          "SRP taken literally produces anaemic classes and a service layer that does all the thinking. Keep behaviour next to the data it guards.",
          "DIP has a floor: something has to construct the concrete classes. That job belongs in one composition root at the edge of the process, not scattered through the code.",
          "Performance-critical inner loops sometimes want the switch: a megamorphic virtual call in a hot path is a real cost. Measure before you abstract there.",
        ],
        takeaways: [
          "Name the axis of change before you add an interface — that is what tells you whether the seam is worth it.",
          "SRP enables OCP; ISP is how you keep DIP's interfaces honest. They are one idea, applied at four scales.",
          "In an interview, say the principle by its effect ('adding a fare rule is a new class') rather than by its letter.",
        ],
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Can you over-apply SOLID?",
            a: "Easily. The cost is indirection: to read one behaviour you open four files. I apply a seam when I can name the second implementation, when the axis of change is confirmed by a real requirement, or when the dependency is slow or non-deterministic (network, clock, randomness) and I need it out of the way for tests. Otherwise I keep it concrete and refactor when the second case arrives — that refactor is cheap if the class was small.",
          },
          {
            q: "How is dependency inversion different from dependency injection?",
            a: "Inversion is about who owns the interface: the high-level policy declares it, so the compile-time arrow points inward. Injection is just the mechanic for handing an implementation in through the constructor. You can inject a concrete Postgres class and get injection with no inversion at all — which is the common mistake.",
          },
          {
            q: "Give me an SRP violation you would deliberately leave in.",
            a: "A small entity that both holds state and serialises itself, in a service with one output format. The 'toJSON on the entity' split buys nothing until there is a second representation. I would flag it and set the trigger: the day a second format or a public API version appears, extract a presenter.",
          },
          {
            q: "How do you test that Liskov holds?",
            a: "Write the test suite against the interface, not the implementation, and run the same suite for every implementation — a contract test. If InMemoryRepo and PostgresRepo both pass identical tests, substitution is real; the moment one needs a special case, the abstraction is leaking.",
          },
        ],
      },
    ],
    related: ["/lld/strategy", "/lld/dependency-injection", "/lld/repository", "/lld/uml"],
    furtherReading: [
      { label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" },
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "uml",
    title: "UML for Interviews",
    subtitle: "The five diagrams worth drawing, and the notation that carries meaning.",
    level: "foundational",
    minutes: 12,
    tags: ["uml", "modeling", "communication"],
    summary:
      "Nobody will ask you to produce a conforming UML 2.5 document. But in a 45-minute LLD round you will draw boxes on a whiteboard, and the difference between a candidate who draws a class diagram and one who draws 'some boxes' is whether the arrows mean anything. Five notations do all the work.",
    keyPoints: [
      "Class diagram answers 'what exists and who owns whom'; sequence diagram answers 'what happens, in what order'.",
      "Arrow types carry information: hollow triangle = is-a, filled diamond = owns-lifecycle, plain arrow = uses.",
      "Multiplicity (1, 0..1, 1..*) on associations catches design bugs before code does.",
      "State diagrams are the fastest way to expose the illegal transitions in an order/booking/elevator problem.",
      "Draw the class diagram second — after the API surface — or you will model nouns nobody calls.",
    ],
    sections: [
      {
        heading: "The five diagrams and when each one earns its place",
        table: {
          headers: ["Diagram", "Answers", "Reach for it when"],
          rows: [
            ["Class", "What types exist, what they own, what they implement", "Always, in an LLD round — it is the backbone"],
            ["Sequence", "Who calls whom, in what order, and where the wait is", "A flow crosses 3+ objects, or concurrency matters"],
            ["State", "Which transitions are legal", "Anything with a lifecycle: order, booking, elevator, job"],
            ["Activity / flowchart", "Branching business logic", "A decision tree the interviewer keeps probing"],
            ["Component / deployment", "Process and machine boundaries", "The LLD question is drifting into HLD"],
          ],
        },
      },
      {
        heading: "Class-diagram notation that actually carries meaning",
        lede: "Four arrows, one multiplicity annotation, done.",
        bullets: [
          "Solid line, hollow triangle → inheritance. B extends A. Use sparingly; most 'is-a' in interviews is better as composition.",
          "Dashed line, hollow triangle → implements an interface. This is the seam you want interviewers to see.",
          "Solid line, filled diamond at the owner → composition: the part cannot outlive the whole. An Order owns its OrderLines.",
          "Solid line, hollow diamond → aggregation: the whole references parts that live independently. A Team references Players.",
          "Plain arrow, no decoration → dependency: 'uses in a method signature or body'. The weakest and most common relation.",
          "Multiplicity at each end: ParkingLot 1 —— 1..* Floor. Write it; it is where off-by-one design errors surface.",
        ],
        diagram: {
          kind: "uml",
          caption: "A parking-lot slice: composition for floors and spots, interface for the fee rule.",
          boxes: [
            {
              name: "ParkingLot",
              tone: "accent",
              members: [
                { name: "floors: List<Floor>", kind: "field", vis: "-", note: "1..*, composition" },
                { name: "park(vehicle): Ticket", kind: "method" },
                { name: "unpark(ticket): Fee", kind: "method" },
              ],
            },
            {
              name: "Floor",
              members: [
                { name: "spots: List<Spot>", kind: "field", vis: "-" },
                { name: "findFree(size): Spot?", kind: "method" },
              ],
            },
            {
              name: "Spot",
              members: [
                { name: "size: SpotSize", kind: "field", vis: "-" },
                { name: "occupiedBy: Vehicle?", kind: "field", vis: "-" },
              ],
            },
            {
              name: "FeeStrategy",
              stereotype: "interface",
              tone: "accent",
              members: [{ name: "fee(ticket, now): Money", kind: "method" }],
            },
            {
              name: "HourlyFee",
              members: [{ name: "fee(ticket, now)", kind: "method" }],
            },
            {
              name: "SpotSize",
              stereotype: "enum",
              members: [
                { name: "MOTORCYCLE", kind: "field", vis: "+" },
                { name: "COMPACT", kind: "field", vis: "+" },
                { name: "LARGE", kind: "field", vis: "+" },
              ],
            },
          ],
          edges: [
            { from: "ParkingLot", to: "Floor", kind: "has", label: "composition 1 → 1..*" },
            { from: "Floor", to: "Spot", kind: "has", label: "composition 1 → 1..*" },
            { from: "HourlyFee", to: "FeeStrategy", kind: "implements" },
            { from: "ParkingLot", to: "FeeStrategy", kind: "uses", label: "injected" },
            { from: "Spot", to: "SpotSize", kind: "uses" },
          ],
        },
      },
      {
        heading: "Sequence diagrams: where the design bugs hide",
        lede: "Order and blocking are invisible in a class diagram.",
        body: [
          "A class diagram cannot tell you that you hold a lock across a network call, or that two objects both write the same row. A sequence diagram makes both obvious, which is why interviewers ask 'walk me through a request' after you have drawn the boxes.",
          "Draw the happy path first, then draw the one failure the interviewer cares about — usually a timeout or a double-submit. The second drawing is where senior candidates separate themselves.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Booking a spot — note the retry-safe idempotency check before any state change.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "ParkingAPI" },
            { id: "lot", label: "ParkingLot" },
            { id: "repo", label: "SpotRepository", sub: "row lock" },
          ],
          messages: [
            { from: "c", to: "api", label: "POST /park {plate, requestId}", kind: "call" },
            { from: "api", to: "repo", label: "findTicketByRequestId(requestId)", kind: "call", note: "idempotency check first" },
            { from: "repo", to: "api", label: "null", kind: "return" },
            { from: "api", to: "lot", label: "park(vehicle)", kind: "call" },
            { from: "lot", to: "repo", label: "SELECT ... FOR UPDATE SKIP LOCKED", kind: "call", note: "claim a free spot atomically" },
            { from: "repo", to: "lot", label: "spot#B12", kind: "return" },
            { from: "lot", to: "repo", label: "UPDATE spot SET vehicle, INSERT ticket", kind: "call" },
            { from: "lot", to: "api", label: "Ticket", kind: "return" },
            { from: "api", to: "c", label: "201 {ticketId, spot}", kind: "return", tone: "ok" },
          ],
        },
      },
      {
        heading: "State diagrams catch the illegal transition",
        lede: "Cheap to draw, and they always find one bug.",
        body: [
          "Write the states as nouns and the transitions as verbs, then ask of every pair: can this happen? The answers you did not think about — cancel after payment, park after the lot closes, call an elevator to the floor it is already on — are where the interviewer will push.",
        ],
        diagram: {
          kind: "flow",
          caption: "Order lifecycle. Every arrow you cannot name is a bug you have not found yet.",
          rows: [
            [
              { id: "created", label: "CREATED", tone: "accent" },
              { id: "paid", label: "PAID" },
              { id: "shipped", label: "SHIPPED" },
              { id: "delivered", label: "DELIVERED", tone: "ok" },
            ],
            [
              { id: "cancelled", label: "CANCELLED", tone: "warn", sub: "from CREATED or PAID only" },
              { id: "refunded", label: "REFUNDED", tone: "warn", sub: "from PAID or DELIVERED" },
              { id: "failed", label: "PAYMENT_FAILED", tone: "bad", sub: "retryable back to CREATED" },
            ],
          ],
        },
        code: {
          title: "Encode the table, do not scatter the ifs",
          lang: "ts",
          source: `const ALLOWED: Record<State, State[]> = {
  CREATED:   ["PAID", "CANCELLED", "PAYMENT_FAILED"],
  PAID:      ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED:  [],
  PAYMENT_FAILED: ["CREATED"],
};

function transition(order: Order, next: State): Order {
  if (!ALLOWED[order.state].includes(next)) {
    throw new IllegalTransition(order.state, next);
  }
  return { ...order, state: next, updatedAt: now() };
}`,
        },
        callout: {
          kind: "insight",
          text: "One transition table beats fifteen if-statements sprinkled across services: it is testable in isolation, it is readable by a product manager, and adding a state is one row.",
        },
      },
      {
        heading: "Whiteboard discipline",
        steps: [
          {
            title: "Say the use cases out loud first",
            text: "Three to five sentences of the form 'a <role> can <verb> a <noun>'. These become your public methods, and they stop you modelling nouns nobody calls.",
          },
          {
            title: "Draw the public API surface",
            text: "Two or three entry-point methods with real signatures. This is the contract; everything else exists to serve it.",
            detail: "park(vehicle: Vehicle): Ticket   ·   unpark(ticket: Ticket): Money",
          },
          {
            title: "Now the class diagram",
            text: "Entities and value objects first, then the interfaces at the seams you can already name (pricing, storage, notification). Add multiplicities.",
          },
          {
            title: "Walk one request as a sequence",
            text: "This is where you show concurrency awareness: where the lock is taken, how long it is held, and what happens on retry.",
          },
          {
            title: "Then the ugly cases",
            text: "Concurrent identical requests, a failed downstream call, a restart mid-flow. Volunteer these; do not wait to be asked.",
          },
        ],
        takeaways: [
          "Arrows without meaning are noise. Pick composition vs aggregation deliberately and say why.",
          "Multiplicity and state tables find bugs on the whiteboard, before any code exists.",
          "Sequence diagrams are how you demonstrate concurrency thinking without writing threads.",
        ],
      },
    ],
    related: ["/lld/parking-lot", "/lld/elevator", "/lld/solid", "/lld/concurrency"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "dependency-injection",
    title: "Dependency Injection",
    subtitle: "Hand collaborators in; never reach out and grab them.",
    level: "foundational",
    minutes: 12,
    tags: ["patterns", "testing", "architecture"],
    summary:
      "Dependency injection is a one-line idea — a class receives its collaborators instead of constructing or locating them — with outsized consequences: your tests stop needing a database, your composition becomes explicit and greppable, and swapping an implementation stops being a code change inside business logic.",
    keyPoints: [
      "Constructor injection is the default; it makes a missing dependency a construction-time error instead of a null at 3am.",
      "The class should not know whether the thing it received is real, fake, retrying or cached.",
      "All concrete wiring belongs in one composition root at the process edge (main, the route module, the container config).",
      "A framework is optional. Manual wiring is fine and often clearer up to a few dozen objects.",
      "Service locator is not DI: it hides the dependency inside the method body and makes the graph invisible.",
    ],
    sections: [
      {
        heading: "The three ways in, and when each fits",
        diagram: {
          kind: "compare",
          caption: "Constructor unless you have a specific reason not to.",
          options: [
            {
              title: "Constructor injection",
              sub: "the default",
              tone: "ok",
              good: [
                "Dependencies are mandatory and visible in one signature",
                "Object is fully valid the moment it exists — no half-built state",
                "Fields can be readonly/final, which helps thread-safety",
              ],
              bad: ["A long parameter list is a real signal that the class does too much"],
              verdict: "Almost always. Treat a 6-argument constructor as an SRP warning, not a DI problem.",
            },
            {
              title: "Setter / property injection",
              sub: "optional collaborators",
              good: ["Fits genuinely optional things like a metrics sink", "Allows late rebinding"],
              bad: [
                "Object exists in an invalid state between new and set",
                "Every use site needs a null check or a null-object default",
              ],
              verdict: "Optional dependencies where a no-op default is sensible.",
            },
            {
              title: "Method / parameter injection",
              sub: "per-call context",
              good: ["Right for values that change per call: clock, request id, tenant"],
              bad: ["Pollutes the signature if overused", "Not a home for long-lived services"],
              verdict: "Request-scoped context that genuinely varies per invocation.",
            },
          ],
        },
      },
      {
        heading: "What DI buys you in a test",
        lede: "This is the argument that convinces reviewers.",
        code: [
          {
            title: "Untestable — the dependency is welded in",
            lang: "ts",
            source: `class SubscriptionService {
  renew(userId: string) {
    const user = new PostgresUsers().byId(userId);   // needs a database
    const charge = Stripe.charge(user.card, user.plan.price); // needs network
    if (charge.ok) new SmtpMailer().send(user.email, "renewed"); // sends real mail
    return charge.ok;
  }
}`,
          },
          {
            title: "Testable — same logic, injected seams",
            lang: "ts",
            source: `class SubscriptionService {
  constructor(
    private users: UserRepository,
    private payments: PaymentGateway,
    private mailer: Mailer,
    private clock: Clock = systemClock,
  ) {}

  async renew(userId: string) {
    const user = await this.users.byId(userId);
    const charge = await this.payments.charge(user.card, user.plan.price);
    if (charge.ok) await this.mailer.send(user.email, "renewed");
    return charge.ok;
  }
}

// test: no database, no network, deterministic time
const svc = new SubscriptionService(
  new InMemoryUsers([alice]),
  { charge: async () => ({ ok: false, reason: "card_declined" }) },
  { send: async () => {} },
  fixedClock("2026-01-01T00:00:00Z"),
);
expect(await svc.renew("alice")).toBe(false);`,
          },
        ],
        callout: {
          kind: "insight",
          text: "Injecting the clock is the move that separates people who have debugged flaky tests from people who have not. Time, randomness and IDs are dependencies like any other.",
        },
      },
      {
        heading: "The composition root",
        lede: "One place knows the concrete types. Exactly one.",
        body: [
          "If new PostgresUsers() appears in fifteen files, you have injection without inversion of control — the graph is still hard-wired, just spelled differently. Collect construction in a single module that runs once at startup. Everything below it takes interfaces.",
          "This is also where cross-cutting behaviour composes cleanly: retry, caching and instrumentation are decorators over the same interface, and the class using it never learns that it got three layers instead of one.",
        ],
        code: {
          title: "composition-root.ts — the only file that says 'new Postgres...'",
          lang: "ts",
          source: `export function buildApp(env: Env) {
  const sql = createPool(env.DATABASE_URL);
  const clock = systemClock;

  // decorators compose over the same port
  const users: UserRepository =
    withMetrics(metrics,
      withCache(new LruCache(10_000),
        new PostgresUsers(sql)));

  const payments: PaymentGateway =
    withRetry({ attempts: 3, backoff: "exponential" },
      new StripeGateway(env.STRIPE_KEY));

  return {
    renew: new SubscriptionService(users, payments, new SesMailer(env), clock),
  };
}`,
        },
        diagram: {
          kind: "layers",
          caption: "Dependency arrows point inward; only the outermost layer names concrete technology.",
          layers: [
            { title: "Composition root", items: ["buildApp()", "env parsing", "pool creation", "decorator stacking"] },
            { title: "Infrastructure", items: ["PostgresUsers", "StripeGateway", "SesMailer", "RedisCache"] },
            { title: "Ports (interfaces)", items: ["UserRepository", "PaymentGateway", "Mailer", "Clock"] },
            { title: "Domain / use cases", items: ["SubscriptionService", "Plan", "Money", "RenewalPolicy"] },
          ],
        },
      },
      {
        heading: "Service locator, and why it is the wrong shape",
        table: {
          headers: ["", "Dependency injection", "Service locator"],
          rows: [
            ["Where the dependency appears", "Constructor signature", "Inside a method body: locator.get(Mailer)"],
            ["Missing dependency shows up", "At construction, usually at startup", "At runtime, on the unlucky code path"],
            ["Test setup", "Pass a fake in", "Mutate global registry, remember to reset it"],
            ["Reading the class", "Collaborators are listed at the top", "You must read every method to know what it needs"],
            ["Parallel tests", "Fine — no shared state", "Race on the shared registry"],
          ],
        },
        callout: {
          kind: "warn",
          text: "A DI container that you call from inside domain classes has quietly become a service locator. The container should be invisible below the composition root.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Do you need a DI framework?",
            a: "No. Manual wiring in a composition root is explicit, greppable and has zero magic — I would start there. A container earns its place when the graph is large, when scoping (singleton vs per-request) becomes fiddly to hand-roll, or when the framework already owns object creation. The cost is reflection-time failures and a graph you can no longer read top-to-bottom.",
          },
          {
            q: "How do you handle a dependency needed deep in the tree?",
            a: "First ask whether it belongs there at all — a repository three layers below a use case often means a missing boundary. If it is legitimate, inject it into the object that needs it and let the parent take it too; that visible plumbing is a fair price for an honest graph. What I avoid is a global or an ambient context, which hides the coupling rather than removing it.",
          },
          {
            q: "Constructor injection with eight parameters — what now?",
            a: "That is SRP telling me the class has too many reasons to change. I look for a cluster: three of them are probably 'notification' and can become one facade, or the class is doing orchestration plus rules and should split. I do not fix it by moving to setters — that hides the smell instead of removing it.",
          },
          {
            q: "Singleton vs per-request lifetimes?",
            a: "Stateless collaborators (repositories over a pool, gateways) can be singletons. Anything carrying request state — a unit of work, a tenant context, a correlation id — must be per request, and mixing them is the classic leak: a singleton that captures a request-scoped object keeps the first request's data forever.",
          },
        ],
      },
    ],
    related: ["/lld/singleton-di", "/lld/repository", "/lld/solid", "/lld/decorator"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "singleton-di",
    title: "Singleton — and What to Use Instead",
    subtitle: "One instance is often right; a global static that hides it rarely is.",
    level: "foundational",
    minutes: 10,
    tags: ["patterns", "antipattern", "concurrency"],
    summary:
      "Singleton is the pattern most likely to be asked about and most likely to be wrong. The requirement behind it — exactly one connection pool, one cache, one id generator — is legitimate. The classic implementation, a static getInstance() reached from anywhere, is what turns that requirement into untestable global state.",
    keyPoints: [
      "Separate the two claims: 'one instance should exist' (usually true) and 'anyone may reach it globally' (usually harmful).",
      "Enforce cardinality at the composition root: construct once, inject everywhere.",
      "If you must write one, know the thread-safe forms: eager static init, holder idiom, or double-checked locking with volatile.",
      "A singleton holding mutable state is a lock convention that nobody documented.",
      "Test smell: needing a reset() method on a singleton means the design already lost.",
    ],
    sections: [
      {
        heading: "The two claims hiding in one pattern",
        body: [
          "Ask the interviewer which one they want. 'There must be exactly one connection pool' is a lifecycle statement, and the composition root enforces it perfectly by calling new once. 'Any class may call Pool.getInstance()' is an access statement, and it is what makes the pattern notorious: it hides dependencies, couples every caller to a concrete type, and shares mutable state across tests.",
          "Saying this distinction out loud is most of the answer.",
        ],
        diagram: {
          kind: "compare",
          caption: "Same cardinality, very different coupling.",
          options: [
            {
              title: "Static singleton",
              sub: "Pool.getInstance()",
              tone: "warn",
              good: ["Zero plumbing", "Reachable from anywhere, including legacy code you cannot change"],
              bad: [
                "Dependency is invisible in the signature",
                "Tests share state; ordering bugs appear under parallel runs",
                "Initialisation order across singletons is hard to reason about",
                "Cannot substitute a fake without a static setter",
              ],
              verdict: "Legacy interop, or a genuinely process-wide constant with no state.",
            },
            {
              title: "One instance, injected",
              sub: "constructed once in buildApp()",
              tone: "ok",
              good: [
                "Cardinality is still exactly one",
                "Callers depend on an interface and say so",
                "Tests pass a fake; no global reset needed",
                "Lifetime is explicit — you can see startup and shutdown",
              ],
              bad: ["You have to pass it down, which makes over-wide sharing visible (that is a feature)"],
              verdict: "The default answer in an interview.",
            },
          ],
        },
      },
      {
        heading: "If you do write one, get the concurrency right",
        lede: "This is the part interviewers actually test.",
        body: [
          "Naive lazy initialisation is a data race: two threads see the null field, both construct, and one instance quietly wins while the other is used by half your callers. There are three correct shapes, and the right answer depends on whether initialisation is expensive.",
        ],
        code: [
          {
            title: "Broken — the classic race",
            lang: "java",
            source: `class Pool {
  private static Pool instance;
  static Pool getInstance() {
    if (instance == null) {      // two threads can both pass this
      instance = new Pool();     // two pools created
    }
    return instance;
  }
}`,
          },
          {
            title: "Correct — eager (fine when construction is cheap)",
            lang: "java",
            source: `class Pool {
  private static final Pool INSTANCE = new Pool();  // JVM guarantees once
  static Pool getInstance() { return INSTANCE; }
}`,
          },
          {
            title: "Correct — holder idiom (lazy, no locking on the read path)",
            lang: "java",
            source: `class Pool {
  private Pool() {}
  private static class Holder { static final Pool INSTANCE = new Pool(); }
  static Pool getInstance() { return Holder.INSTANCE; }  // class loaded on first use
}`,
          },
          {
            title: "Correct — double-checked locking, if you must",
            lang: "java",
            source: `class Pool {
  private static volatile Pool instance;   // volatile is NOT optional
  static Pool getInstance() {
    Pool local = instance;
    if (local == null) {
      synchronized (Pool.class) {
        local = instance;
        if (local == null) instance = local = new Pool();
      }
    }
    return local;
  }
}`,
          },
        ],
        callout: {
          kind: "warn",
          text: "Without volatile, double-checked locking is broken on any JVM: another thread can observe a non-null reference to a partially constructed object, because the write to the field may be reordered before the constructor finishes.",
        },
      },
      {
        heading: "Where the pattern still bites in production",
        table: {
          headers: ["Symptom", "Root cause", "Fix"],
          rows: [
            [
              "Tests pass alone, fail in the suite",
              "Mutable state carried between tests through the singleton",
              "Inject a per-test instance; delete the static",
            ],
            [
              "Config read before it was loaded",
              "Static initialiser ordering between two singletons",
              "Explicit startup sequence in the composition root",
            ],
            [
              "Two 'singletons' exist in one process",
              "Two classloaders, or the module was bundled twice",
              "Make the instance a value you pass, not a lookup",
            ],
            [
              "Deadlock during startup",
              "Two singletons initialising each other under class-init locks",
              "Break the cycle; construct both from outside",
            ],
            [
              "Cannot run two tenants in one process",
              "Global cardinality was never the real requirement",
              "Scope the instance to a tenant container",
            ],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Is Singleton an anti-pattern?",
            a: "The cardinality is not; the global access point usually is. I would phrase it as: I want one instance, so I construct one in the composition root and inject it. If someone hands me a codebase that already calls getInstance() everywhere, the incremental fix is to add an interface, have the singleton implement it, and start injecting at the edges rather than a big-bang rewrite.",
          },
          {
            q: "How do you make a singleton thread-safe in Java?",
            a: "Eager static final if construction is cheap; the static holder idiom for laziness without a read-path lock; double-checked locking with a volatile field if I need laziness plus parameters. Enum is also a genuine option — serialization- and reflection-safe by construction — though it is awkward if the instance needs constructor arguments.",
          },
          {
            q: "The singleton holds a mutable cache. What do you worry about?",
            a: "That its concurrency contract is undocumented. Every caller now shares it, so I would want a thread-safe map, a bounded size with an eviction policy, and clarity on whether stale reads are acceptable. And I would check nothing iterates it while another thread writes — a very common crash under load.",
          },
        ],
      },
    ],
    related: ["/lld/dependency-injection", "/lld/concurrency", "/lld/factory", "/lld/lru-cache"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },

  {
    slug: "repository",
    title: "Repository Pattern",
    subtitle: "A collection-shaped boundary between the domain and the database.",
    level: "intermediate",
    minutes: 13,
    tags: ["patterns", "persistence", "architecture"],
    summary:
      "A repository lets the domain say 'give me the order' instead of 'run this SQL'. Done well, it makes business logic testable in memory and keeps storage decisions swappable. Done badly, it becomes a thin veneer of findByXAndYOrderByZ methods that leaks the database into the domain anyway.",
    keyPoints: [
      "The interface belongs to the domain layer and speaks domain language; the implementation lives in infrastructure.",
      "Return aggregates, not rows: a repository hands back Order (with its lines), never a joined tuple.",
      "One repository per aggregate root, not one per table.",
      "Query objects or specifications keep the interface from growing a method per screen.",
      "Transactions usually span multiple repositories — that is the Unit of Work's job, not the repository's.",
    ],
    sections: [
      {
        heading: "What it is actually buying",
        bullets: [
          "Testability: use cases run against an in-memory implementation in microseconds, with no fixtures or containers.",
          "A named seam for storage decisions — adding a cache, a read replica, or an outbox is a decorator, not a domain edit.",
          "Vocabulary: findOverdueSubscriptions() carries intent that a WHERE clause pasted into a service does not.",
          "Aggregate integrity: loading and saving whole objects makes 'saved half of it' structurally hard.",
        ],
        callout: {
          kind: "note",
          text: "It is not buying database portability. Almost nobody swaps Postgres for Mongo in production, and pretending you might is how repositories end up with a uselessly abstract interface.",
        },
      },
      {
        heading: "Shape of the interface",
        lede: "Small, domain-worded, aggregate-oriented.",
        code: {
          title: "domain/orders.ts",
          lang: "ts",
          source: `export interface OrderRepository {
  byId(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;          // insert or update, caller doesn't care
  nextId(): OrderId;                          // identity is a domain concern
  overdue(asOf: Date, limit: number): Promise<Order[]>;   // named intent
}

// NOT this — the database has leaked through:
//   findByStatusAndCreatedAtBetweenOrderByTotalDesc(...)
//   executeQuery(sql: string)
//   getConnection(): Connection`,
        },
        diagram: {
          kind: "er",
          caption: "Three tables, one aggregate. The repository hands back the whole thing.",
          entities: [
            {
              name: "orders",
              note: "aggregate root",
              fields: [
                { name: "id", type: "uuid", key: "pk" },
                { name: "customer_id", type: "uuid", key: "fk" },
                { name: "status", type: "text" },
                { name: "placed_at", type: "timestamptz", key: "idx" },
                { name: "version", type: "int", note: "optimistic lock" },
              ],
            },
            {
              name: "order_lines",
              note: "part of the aggregate — no repository of its own",
              fields: [
                { name: "order_id", type: "uuid", key: "fk" },
                { name: "sku", type: "text" },
                { name: "qty", type: "int" },
                { name: "unit_price", type: "numeric" },
              ],
            },
            {
              name: "customers",
              note: "separate aggregate — referenced by id only",
              fields: [
                { name: "id", type: "uuid", key: "pk" },
                { name: "email", type: "text", key: "idx" },
              ],
            },
          ],
          relations: [
            { from: "orders", to: "order_lines", label: "loaded together, saved together", cardinality: "1..*" },
            { from: "orders", to: "customers", label: "reference by id, never a join into the aggregate", cardinality: "*..1" },
          ],
        },
      },
      {
        heading: "Two implementations, one contract test",
        code: [
          {
            title: "infra/postgres-orders.ts",
            lang: "ts",
            source: `export class PostgresOrders implements OrderRepository {
  constructor(private sql: Sql) {}

  async byId(id: OrderId): Promise<Order | null> {
    const rows = await this.sql\`
      SELECT o.*, l.sku, l.qty, l.unit_price
      FROM orders o LEFT JOIN order_lines l ON l.order_id = o.id
      WHERE o.id = \${id}\`;
    return rows.length ? hydrateOrder(rows) : null;   // rows -> aggregate
  }

  async save(order: Order): Promise<void> {
    await this.sql.begin(async (tx) => {
      const updated = await tx\`
        UPDATE orders SET status = \${order.status}, version = version + 1
        WHERE id = \${order.id} AND version = \${order.version}\`;
      if (updated.count === 0) throw new ConcurrentModification(order.id);
      await tx\`DELETE FROM order_lines WHERE order_id = \${order.id}\`;
      await tx\`INSERT INTO order_lines \${tx(order.lines)}\`;
    });
  }
}`,
          },
          {
            title: "test/in-memory-orders.ts — same contract, no database",
            lang: "ts",
            source: `export class InMemoryOrders implements OrderRepository {
  private store = new Map<OrderId, Order>();
  async byId(id: OrderId) { return structuredClone(this.store.get(id) ?? null); }
  async save(order: Order) { this.store.set(order.id, structuredClone(order)); }
  nextId() { return crypto.randomUUID() as OrderId; }
  async overdue(asOf: Date, limit: number) {
    return [...this.store.values()].filter((o) => o.dueAt < asOf).slice(0, limit);
  }
}`,
          },
          {
            title: "The contract test both must pass",
            lang: "ts",
            source: `export function orderRepositoryContract(make: () => OrderRepository) {
  test("save then byId returns an equal aggregate", async () => {
    const repo = make();
    const order = Order.draft(repo.nextId(), [line("SKU-1", 2)]);
    await repo.save(order);
    expect(await repo.byId(order.id)).toEqual(order);
  });

  test("byId returns null for unknown ids", async () => {
    expect(await make().byId("nope" as OrderId)).toBeNull();
  });
}

// run it twice — this is what makes the in-memory fake trustworthy
orderRepositoryContract(() => new InMemoryOrders());
orderRepositoryContract(() => new PostgresOrders(testPool));`,
          },
        ],
        callout: {
          kind: "insight",
          text: "The contract test is the part most candidates omit. Without it, the in-memory fake drifts from the real implementation and your fast tests start passing for the wrong reasons.",
        },
      },
      {
        heading: "Transactions across repositories: Unit of Work",
        lede: "A repository per aggregate means one use case may touch several.",
        body: [
          "If transferring money must debit one account and credit another atomically, neither repository can own the transaction. The unit of work does: it opens the transaction, hands scoped repositories to the use case, and commits or rolls back once.",
        ],
        diagram: {
          kind: "sequence",
          caption: "The use case never sees a connection; it sees a transactional scope.",
          actors: [
            { id: "uc", label: "TransferMoney", sub: "use case" },
            { id: "uow", label: "UnitOfWork" },
            { id: "accs", label: "AccountRepository" },
            { id: "db", label: "Postgres" },
          ],
          messages: [
            { from: "uc", to: "uow", label: "run(scope => ...)", kind: "call" },
            { from: "uow", to: "db", label: "BEGIN", kind: "call" },
            { from: "uc", to: "accs", label: "byId(from) / byId(to)", kind: "call", note: "repositories bound to this transaction" },
            { from: "accs", to: "db", label: "SELECT ... FOR UPDATE", kind: "call", note: "lock both rows in a fixed order to avoid deadlock" },
            { from: "uc", to: "accs", label: "save(debited) / save(credited)", kind: "call" },
            { from: "uow", to: "db", label: "COMMIT", kind: "call", tone: "ok" },
            { from: "uow", to: "uc", label: "result", kind: "return" },
          ],
        },
        code: {
          title: "Scoped repositories, one transaction",
          lang: "ts",
          source: `await unitOfWork.run(async ({ accounts, events }) => {
  const [from, to] = await accounts.lockPair(fromId, toId);  // fixed order
  from.debit(amount);        // domain rules live in the entity
  to.credit(amount);
  await accounts.save(from);
  await accounts.save(to);
  events.record(new MoneyTransferred(fromId, toId, amount)); // outbox, same tx
});`,
        },
      },
      {
        heading: "Where it goes wrong",
        table: {
          headers: ["Anti-pattern", "Why it hurts", "Instead"],
          rows: [
            [
              "One repository per table",
              "OrderLineRepository lets callers save half an order and skip invariants",
              "One per aggregate root; parts are saved with the root",
            ],
            [
              "IQueryable / raw SQL leaking out",
              "The domain now depends on the query engine's semantics and lazy loading",
              "Return materialised aggregates, or a read model built for the screen",
            ],
            [
              "A method per screen",
              "The interface grows without bound and every new report edits the domain",
              "A specification/criteria object, or CQRS with a separate read side",
            ],
            [
              "Repository opens its own transaction per call",
              "Multi-aggregate use cases lose atomicity",
              "Unit of Work owns the transaction boundary",
            ],
            [
              "Fake and real drift apart",
              "Fast tests pass, production fails on a constraint the fake never had",
              "One contract test suite run against both",
            ],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Is a repository still worth it when you already have an ORM?",
            a: "Sometimes not. An ORM's DAO is already a repository of sorts, and wrapping it adds a layer with no seam. I add an explicit repository when the domain has real invariants worth protecting, when I want fast in-memory use-case tests, or when the persistence model and the domain model have genuinely diverged. For CRUD screens I would call the ORM directly and say so.",
          },
          {
            q: "How do you handle a complex reporting query?",
            a: "I stop pretending it is a repository concern. Reports read across aggregates and want joins and projections the domain model does not have. I add a read side — a query service returning DTOs shaped for the screen, hitting a replica or a materialised view. Keeping writes aggregate-shaped and reads query-shaped is the useful half of CQRS.",
          },
          {
            q: "Where do you put optimistic locking?",
            a: "A version column on the aggregate root, checked in the UPDATE's WHERE clause. Zero rows updated means someone else won, and the repository raises a concurrency error that the use case can retry. It belongs at the root because the root is the consistency boundary — locking individual lines would let two writers each think they had the whole order.",
          },
          {
            q: "N+1 queries — whose problem is it?",
            a: "The implementation's, and it is why the interface must not expose lazy proxies. If overdue() returns 500 orders each of which lazily loads its lines, the abstraction has hidden 501 round trips. I would load lines in one query keyed by order id and hydrate in memory, and I would have a test that counts queries so a regression is visible.",
          },
        ],
      },
    ],
    related: ["/lld/dependency-injection", "/lld/solid", "/hld/sql-vs-nosql", "/lld/concurrency"],
    furtherReading: [{ label: "roadmap.sh — system design", href: "https://roadmap.sh/system-design" }],
  },
];
