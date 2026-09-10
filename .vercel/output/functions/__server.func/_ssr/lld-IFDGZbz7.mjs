//#region node_modules/.nitro/vite/services/ssr/assets/lld-IFDGZbz7.js
var lldConcepts = [
	{
		slug: "solid",
		title: "SOLID Principles",
		subtitle: "Five constraints that keep object designs changeable.",
		level: "foundational",
		minutes: 12,
		tags: ["oop", "principles"],
		summary: "Low-level design interviews are less about drawing 20 classes and more about showing that new requirements slide in without rewriting the world. SOLID is the vocabulary for that.",
		sections: [{
			heading: "The five",
			table: {
				headers: [
					"",
					"Means",
					"Smell if you skip it"
				],
				rows: [
					[
						"S — Single responsibility",
						"A class has one reason to change",
						"God classes, untestable mix of IO + rules"
					],
					[
						"O — Open/closed",
						"Extend via new types, not edits",
						"Giant switch on type that grows forever"
					],
					[
						"L — Liskov substitution",
						"Subtypes honor the parent contract",
						"Square/rectangle, throwing NotImplemented"
					],
					[
						"I — Interface segregation",
						"Clients depend on slim surfaces",
						"Fat interfaces, dummy methods"
					],
					[
						"D — Dependency inversion",
						"Depend on abstractions, inject details",
						"new PostgresRepo() inside a domain service"
					]
				]
			}
		}, {
			heading: "How interviewers hear it",
			body: ["You rarely recite the letters. You say 'rate-limit algorithm is a strategy, the limiter depends on the interface' (O + D), 'parking-spot finder is separate from payment' (S), 'ElectricCar can be a Vehicle because it still start()s' (L)."],
			code: {
				title: "Open/closed via Strategy — not a switch",
				source: `interface FarePolicy { fare(trip: Trip): Money }

class StandardFare implements FarePolicy { ... }
class SurgeFare implements FarePolicy { ... }
class AirportFare implements FarePolicy { ... }

class PricingService {
  constructor(private policy: FarePolicy) {}
  quote(trip: Trip) { return this.policy.fare(trip) }
}`
			}
		}],
		related: [
			"/lld/strategy",
			"/lld/dependency-injection",
			"/lld/rate-limiter"
		],
		furtherReading: [{
			label: "roadmap.sh — LLD / OOP",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "strategy",
		title: "Strategy Pattern",
		subtitle: "Swap the algorithm, keep the caller.",
		level: "foundational",
		minutes: 8,
		tags: ["patterns"],
		summary: "Strategy extracts a family of algorithms behind one interface. Payment methods, rate-limit algorithms, compression codecs, and load-balancer pickers are all strategies.",
		sections: [{
			heading: "Structure",
			body: ["Context holds a Strategy and delegates. Concrete strategies are independently testable. Adding leaky-bucket next to token-bucket is a new class, not a new branch."],
			diagram: {
				kind: "flow",
				rows: [[
					{
						id: "ctx",
						label: "RateLimiter",
						sub: "context"
					},
					{
						id: "i",
						label: "LimiterStrategy",
						tone: "accent"
					},
					{
						id: "a",
						label: "TokenBucket"
					},
					{
						id: "b",
						label: "SlidingWindow"
					}
				]]
			},
			code: {
				title: "The seam every LLD rate limiter should have",
				source: `interface LimiterStrategy {
  allow(key: string, at: number): Decision
}

class RateLimiter {
  constructor(private strategy: LimiterStrategy) {}
  handle(req: Request) {
    const d = this.strategy.allow(req.userId, Date.now())
    return d.ok ? next(req) : tooMany(d.retryAfterMs)
  }
}`
			}
		}],
		related: [
			"/lld/rate-limiter",
			"/playgrounds/rate-limiter",
			"/lld/solid"
		],
		furtherReading: [{
			label: "Rate limiter playground",
			href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html"
		}],
		playground: "rate-limiter"
	},
	{
		slug: "observer",
		title: "Observer Pattern",
		subtitle: "Publish once, notify many, without the subject knowing who.",
		level: "foundational",
		minutes: 8,
		tags: ["patterns", "events"],
		summary: "Subject keeps a list of observers and pokes them on state change. UI listeners, stock-tick fans, and in-process event buses are observers. Distributed, this becomes pub/sub.",
		sections: [{
			heading: "In-process vs distributed",
			bullets: [
				"In-process: addListener / removeListener, sync callbacks. Watch re-entrancy.",
				"Distributed: Kafka / Redis pubsub / WebSocket fan-out. The 'subject' is a topic.",
				"Push vs pull: observer receives the payload, or a 'something changed' and then reads."
			],
			code: {
				title: "Stock ticker (interview classic)",
				source: `interface Observer { update(tick: Tick): void }

class Ticker {
  private observers = new Set<Observer>()
  subscribe(o: Observer) { this.observers.add(o) }
  unsubscribe(o: Observer) { this.observers.delete(o) }
  publish(tick: Tick) { for (const o of this.observers) o.update(tick) }
}`
			}
		}],
		related: [
			"/examples/stock-exchange",
			"/lld/command",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "Refactoring Guru — Observer",
			href: "https://refactoring.guru/design-patterns/observer"
		}]
	},
	{
		slug: "factory",
		title: "Factory and Abstract Factory",
		subtitle: "Callers ask for a product, not a constructor.",
		level: "foundational",
		minutes: 8,
		tags: ["patterns"],
		summary: "A factory hides which concrete class is built — notification channel, database driver, button for a look-and-feel. Abstract factory groups families (MacButton + MacCheckbox).",
		sections: [{
			heading: "When it earns its keep",
			body: ["If construction is a switch on a string ('email' | 'sms' | 'push'), that switch belongs in one factory, not in every caller. Combined with strategy, the factory picks the algorithm object."],
			code: {
				title: "Notification sender factory",
				source: `type Channel = "email" | "sms" | "push"

function senderFor(channel: Channel): Sender {
  switch (channel) {
    case "email": return new EmailSender(smtp)
    case "sms":   return new SmsSender(twilio)
    case "push":  return new PushSender(fcm)
  }
}`
			}
		}],
		related: [
			"/examples/notification",
			"/lld/builder",
			"/lld/strategy"
		],
		furtherReading: [{
			label: "Refactoring Guru — Factory",
			href: "https://refactoring.guru/design-patterns/factory-method"
		}]
	},
	{
		slug: "decorator",
		title: "Decorator Pattern",
		subtitle: "Wrap an object to add behavior without rewriting it.",
		level: "intermediate",
		minutes: 8,
		tags: ["patterns"],
		summary: "Decorators implement the same interface as the wrappee and forward calls, adding work before or after. Input streams, logging proxies, retry wrappers, and cached repositories are decorators.",
		sections: [{
			heading: "Shape",
			code: {
				title: "Retries as a decorator, not a flag",
				source: `interface UserRepo { find(id: ID): Promise<User> }

class RetryingRepo implements UserRepo {
  constructor(private inner: UserRepo, private times = 3) {}
  async find(id: ID) {
    let last: unknown
    for (let i = 0; i < this.times; i++) {
      try { return await this.inner.find(id) }
      catch (e) { last = e }
    }
    throw last
  }
}`
			},
			callout: {
				kind: "note",
				title: "vs inheritance",
				text: "A LoggingFileStream subclass explodes combinatorially (logged + buffered + compressed). Decorators compose in any order."
			}
		}],
		related: [
			"/lld/proxy",
			"/lld/solid",
			"/hld/circuit-breaker"
		],
		furtherReading: [{
			label: "Refactoring Guru — Decorator",
			href: "https://refactoring.guru/design-patterns/decorator"
		}]
	},
	{
		slug: "adapter",
		title: "Adapter Pattern",
		subtitle: "Make an existing class look like the interface you needed.",
		level: "foundational",
		minutes: 6,
		tags: ["patterns"],
		summary: "Adapters translate. Stripe's SDK does not implement your PaymentProcessor port — an adapter does. Interview designs that talk to third parties should show an adapter at the boundary.",
		sections: [{
			heading: "Ports and adapters",
			body: ["Hexagonal / clean architecture is adapter at scale: domain in the middle, adapters at the edges for HTTP, SQL, and vendors. Tests fake the port."],
			diagram: {
				kind: "layers",
				layers: [{
					title: "Domain",
					items: ["PaymentProcessor port"]
				}, {
					title: "Adapters",
					items: [
						"StripeAdapter",
						"RazorpayAdapter",
						"InMemoryFake"
					]
				}]
			}
		}],
		related: [
			"/examples/payment",
			"/lld/dependency-injection",
			"/lld/proxy"
		],
		furtherReading: [{
			label: "Alistair Cockburn — Hexagonal architecture",
			href: "https://alistair.cockburn.us/hexagonal-architecture/"
		}]
	},
	{
		slug: "proxy",
		title: "Proxy Pattern",
		subtitle: "A stand-in that controls access to the real object.",
		level: "intermediate",
		minutes: 7,
		tags: ["patterns"],
		summary: "Virtual proxies lazy-load, protection proxies check auth, remote proxies hide RPC, smart proxies count refs. An API gateway is a proxy with opinions. A cache in front of a repository is a proxy.",
		sections: [{
			heading: "Kinds",
			table: {
				headers: ["Kind", "Controls"],
				rows: [
					["Virtual", "When the expensive object is created"],
					["Protection", "Who may call"],
					["Remote", "Where the object lives"],
					["Smart / cache", "Extra bookkeeping around the call"]
				]
			},
			callout: {
				kind: "insight",
				title: "Decorator vs proxy",
				text: "Same structure (wrapper + same interface). Intent differs: decorator adds behavior, proxy controls access. In interviews, naming the intent is enough."
			}
		}],
		related: [
			"/lld/decorator",
			"/hld/api-gateway",
			"/hld/caching"
		],
		furtherReading: [{
			label: "Refactoring Guru — Proxy",
			href: "https://refactoring.guru/design-patterns/proxy"
		}]
	},
	{
		slug: "command",
		title: "Command Pattern",
		subtitle: "An object that is a request — and can be queued, undone, logged.",
		level: "intermediate",
		minutes: 8,
		tags: ["patterns"],
		summary: "A command binds a receiver and an action. Text editors, smart-home scenes, and job queues are commands. Undo is a stack of inverse commands. Distributed, a command is a message on a queue.",
		sections: [{
			heading: "Undo / redo",
			code: {
				title: "Editor actions",
				source: `interface Command { execute(): void; undo(): void }

class TypeText implements Command {
  constructor(private doc: Doc, private pos: number, private text: string) {}
  execute() { this.doc.insert(this.pos, this.text) }
  undo() { this.doc.delete(this.pos, this.text.length) }
}

class History {
  private undoStack: Command[] = []
  run(c: Command) { c.execute(); this.undoStack.push(c) }
  undo() { this.undoStack.pop()?.undo() }
}`
			}
		}],
		related: [
			"/lld/observer",
			"/examples/google-drive",
			"/hld/message-queues"
		],
		furtherReading: [{
			label: "Refactoring Guru — Command",
			href: "https://refactoring.guru/design-patterns/command"
		}]
	},
	{
		slug: "builder",
		title: "Builder Pattern",
		subtitle: "Assemble a complex object step by step.",
		level: "foundational",
		minutes: 6,
		tags: ["patterns"],
		summary: "Builders shine when constructors would take ten optional arguments (HTTP requests, SQL queries, a burger, an immutable config). Fluent withers on records are a modern cousin.",
		sections: [{
			heading: "Fluent construction",
			code: {
				title: "Query builder (LLD favorite)",
				source: `const sql = new Select()
  .from("orders")
  .where("status", "paid")
  .orderBy("created_at")
  .limit(20)
  .toSql()`
			}
		}],
		related: ["/lld/factory", "/lld/solid"],
		furtherReading: [{
			label: "Refactoring Guru — Builder",
			href: "https://refactoring.guru/design-patterns/builder"
		}]
	},
	{
		slug: "singleton-di",
		title: "Singleton vs Dependency Injection",
		subtitle: "One instance is fine. A hidden global usually is not.",
		level: "foundational",
		minutes: 8,
		tags: ["patterns", "testing"],
		summary: "Interviewers still ask for Singleton (logger, config, connection pool). The grown-up version is 'application-scoped object, injected'. That keeps tests honest and lifetimes explicit.",
		sections: [{
			heading: "The trap",
			body: ["Logger.getInstance() is convenient until you want two loggers, or a fake in a test, or to configure it before first use. Connection pools as singletons also hide shutdown."],
			code: {
				title: "Prefer this",
				source: `class Api {
  constructor(private db: Db, private clock: Clock) {}
}

// composition root (main.ts)
const api = new Api(postgres, systemClock)`
			},
			callout: {
				kind: "warn",
				title: "Thread-safe lazy singleton",
				text: "If you must write one: double-checked locking, language-level once (Go sync.Once, Java holder class, std::call_once). Mention it, then offer DI."
			}
		}],
		related: [
			"/lld/dependency-injection",
			"/lld/logging",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "Fowler — Inversion of Control",
			href: "https://martinfowler.com/articles/injection.html"
		}]
	},
	{
		slug: "dependency-injection",
		title: "Dependency Injection",
		subtitle: "Pass collaborators in. Do not construct them in the dark.",
		level: "foundational",
		minutes: 7,
		tags: ["principles"],
		summary: "DI is how Dependency Inversion hits the keyboard. Constructor injection is the default. A composition root wires the graph. Frameworks (Spring, Nest, Dagger) are optional.",
		sections: [{
			heading: "Why LLD cares",
			bullets: [
				"A RateLimiter that new TokenBucket() inside cannot be tested with a fake clock.",
				"A ParkingLot that new Gate() inside cannot simulate a stuck gate.",
				"Inject Clock, Random, and IO. Time-based code without a clock port is untestable."
			]
		}],
		related: [
			"/lld/solid",
			"/lld/singleton-di",
			"/lld/rate-limiter"
		],
		furtherReading: [{
			label: "Fowler — DI",
			href: "https://martinfowler.com/articles/injection.html"
		}]
	},
	{
		slug: "lru-cache",
		title: "LRU Cache (LLD)",
		subtitle: "O(1) get and put with a hash map plus a doubly linked list.",
		level: "intermediate",
		minutes: 12,
		tags: ["interview classic"],
		summary: "The low-level design of cache eviction. Hash map for key → node, doubly linked list for recency. Head is hottest, tail is the eviction victim. Thread-safety is a mutex or a striped lock.",
		sections: [{
			heading: "Operations",
			numbered: ["get: if missing, miss. Else move node to head, return value.", "put: if present, update and move to head. Else insert at head. If over capacity, evict tail."],
			code: {
				title: "Skeleton",
				source: `class LRU<K, V> {
  private map = new Map<K, Node<K, V>>()
  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    const n = this.map.get(key)
    if (!n) return
    this.touch(n)
    return n.value
  }

  put(key: K, value: V) {
    const n = this.map.get(key)
    if (n) { n.value = value; this.touch(n); return }
    const created = this.insertFront(key, value)
    this.map.set(key, created)
    if (this.map.size > this.capacity) this.evict()
  }
}`
			},
			callout: {
				kind: "insight",
				title: "Lab",
				text: "Open the LRU lab and watch nodes climb to the front on hit, then drop off the tail when the capacity fills."
			}
		}],
		related: [
			"/playgrounds/lru-cache",
			"/hld/caching",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "LeetCode 146 — LRU Cache",
			href: "https://leetcode.com/problems/lru-cache/"
		}],
		playground: "lru-cache"
	},
	{
		slug: "rate-limiter",
		title: "Rate Limiter (LLD)",
		subtitle: "Classes, thread safety, and the five algorithms in code.",
		level: "intermediate",
		minutes: 14,
		tags: ["interview classic", "concurrency"],
		summary: "The companion to the HLD chapter. Interviewers want a Limiter interface, per-key buckets, a clock port, and a story for races. The lab is modeled on interactive LLD playgrounds like the token-bucket visualizer.",
		sections: [{
			heading: "Class sketch",
			diagram: {
				kind: "layers",
				layers: [
					{
						title: "API",
						items: ["RateLimiter.allow(key) → Decision"]
					},
					{
						title: "Strategy",
						items: [
							"TokenBucket",
							"LeakyBucket",
							"FixedWindow",
							"SlidingLog",
							"SlidingCounter"
						]
					},
					{
						title: "Store",
						items: ["InMemoryStore", "RedisStore"]
					},
					{
						title: "Ports",
						items: ["Clock", "Lock / Lua"]
					}
				]
			},
			code: {
				title: "Token bucket, lazy refill",
				source: `class TokenBucket {
  tokens: number
  lastRefill: number
  constructor(public capacity: number, public refillPerSec: number, now: number) {
    this.tokens = capacity
    this.lastRefill = now
  }
  allow(now: number): boolean {
    const elapsed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSec)
    this.lastRefill = now
    if (this.tokens < 1) return false
    this.tokens -= 1
    return true
  }
}`
			}
		}, {
			heading: "Thread safety",
			bullets: [
				"One mutex per key beats one global mutex.",
				"In Redis, do refill + consume in a Lua script so two app boxes cannot both think a token remains.",
				"Never use a non-monotonic wall clock without defending against backward jumps (the same bug as Snowflake)."
			]
		}],
		related: [
			"/playgrounds/rate-limiter",
			"/hld/rate-limiting",
			"/examples/rate-limiter",
			"/lld/strategy"
		],
		furtherReading: [{
			label: "Interactive rate-limiter playground",
			href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html"
		}],
		playground: "rate-limiter"
	},
	{
		slug: "parking-lot",
		title: "Parking Lot",
		subtitle: "The canonical object-model interview.",
		level: "intermediate",
		minutes: 12,
		tags: ["ood"],
		summary: "Spots of different sizes, vehicles that fit some of them, tickets, fees, and gates. The trick is the assignment policy (closest, any, size-best-fit) as a strategy, and keeping occupancy indexes — not scanning every spot.",
		sections: [{
			heading: "Core types",
			bullets: [
				"Vehicle: Motorcycle, Car, Van — each declares a size.",
				"Spot: compact / regular / large, plus floor + row + index.",
				"Ticket: issued at entry, closed at exit with a FeePolicy.",
				"ParkingLot: floors, findSpot(vehicle), occupy, release.",
				"DisplayBoard: observer of occupancy counts."
			],
			code: {
				title: "Fit rule",
				source: `enum Size { MOTO, COMPACT, LARGE }

class Spot {
  constructor(readonly size: Size, public vehicle: Vehicle | null = null) {}
  fits(v: Vehicle) {
    return this.vehicle === null && v.size <= this.size
  }
}`
			}
		}, {
			heading: "What good looks like",
			numbered: [
				"Index free spots per size in a queue / heap (closest first).",
				"FeePolicy strategy: hourly, daily max, EV surcharge.",
				"Concurrency: two cars must not get the same spot — lock the spot or CAS the index.",
				"Extension: EV chargers, reserved spots, multi-entry gates without rewriting findSpot."
			]
		}],
		related: [
			"/lld/strategy",
			"/lld/observer",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "Grokking the OOD interview — parking lot (concept)",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "elevator",
		title: "Elevator System",
		subtitle: "Scheduling, not just classes named Elevator.",
		level: "advanced",
		minutes: 12,
		tags: ["ood", "scheduling"],
		summary: "Elevators are a real-time scheduler: hall calls, car calls, direction, and a dispatcher. SCAN / LOOK (elevator algorithm) beats FCFS. Design for multiple cars and a later 'peak up' mode.",
		sections: [{
			heading: "Objects",
			bullets: [
				"ElevatorCar: floor, direction, door, target set.",
				"HallPanel: up/down on each floor.",
				"Dispatcher: assigns a hall call to a car (least cost).",
				"Scheduler: within a car, SCAN in current direction, then reverse."
			],
			table: {
				headers: ["Policy", "Behavior"],
				rows: [
					["FCFS", "Starves under load; easy to code"],
					["SCAN / LOOK", "Sweep one way, then the other — default"],
					["Nearest car", "Dispatcher cost = distance + stop count + direction penalty"]
				]
			},
			callout: {
				kind: "insight",
				title: "State machine",
				text: "Door and motion are state machines (Idle, Moving, Loading). Interviewers listen for illegal transitions: moving with the door open."
			}
		}],
		related: [
			"/lld/command",
			"/lld/strategy",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "Elevator algorithm",
			href: "https://en.wikipedia.org/wiki/Elevator_algorithm"
		}]
	},
	{
		slug: "logging",
		title: "Logging Framework",
		subtitle: "Levels, sinks, formatters, and an async buffer.",
		level: "intermediate",
		minutes: 10,
		tags: ["ood"],
		summary: "A logger is Chain of Responsibility (level filter) + Strategy (formatter) + optional Singleton at the facade. Sinks: console, file, socket. Do not block the request path — a bounded queue and a flusher thread.",
		sections: [{
			heading: "Pieces",
			code: {
				title: "Minimal shape",
				source: `enum Level { DEBUG, INFO, WARN, ERROR }

interface Sink { write(record: Record): void }

class Logger {
  constructor(
    private name: string,
    private level: Level,
    private sinks: Sink[],
    private format: Formatter,
  ) {}

  log(level: Level, msg: string) {
    if (level < this.level) return
    const record = { ts: clock.now(), name: this.name, level, msg }
    for (const s of this.sinks) s.write(this.format(record))
  }
}`
			},
			bullets: ["Async sink: queue + dedicated writer. Drop or block when full — pick one and say it.", "MDC / correlation id on a thread-local or context, so traces stitch."]
		}],
		related: [
			"/lld/singleton-di",
			"/hld/observability",
			"/lld/decorator"
		],
		furtherReading: [{
			label: "log4j architecture (conceptual)",
			href: "https://logging.apache.org/log4j/2.x/manual/architecture.html"
		}]
	},
	{
		slug: "concurrency",
		title: "Thread Safety in LLD",
		subtitle: "The part of class design that actually fails in production.",
		level: "advanced",
		minutes: 12,
		tags: ["concurrency"],
		summary: "Parking lots, rate limiters, and loggers are trivial until two threads share them. Know mutex vs rwlock vs concurrent collections, deadlock, and what you will not share.",
		sections: [{
			heading: "Checklist interviewers like",
			numbered: [
				"Identify shared mutable state.",
				"Prefer immutability and confinement (don't share).",
				"If you share: one lock per invariant, lock ordering to avoid deadlock.",
				"Document what the lock guards.",
				"Time / IO out of the lock. Copy, then publish.",
				"For maps: ConcurrentHashMap / striped locks, not a global synchronized."
			],
			table: {
				headers: ["Bug", "Tell"],
				rows: [
					["Race", "Lost updates on tokens--, double-issued parking spots"],
					["Deadlock", "Lock A then B vs B then A"],
					["Livelock / starvation", "Always yielding; writer starved by readers"],
					["Visibility", "Stale cache of a flag without volatile / atomic"]
				]
			}
		}],
		related: [
			"/lld/rate-limiter",
			"/lld/lru-cache",
			"/hld/circuit-breaker"
		],
		furtherReading: [{
			label: "Java Concurrency in Practice (ideas)",
			href: "https://jcip.net/"
		}]
	},
	{
		slug: "repository",
		title: "Repository and Unit of Work",
		subtitle: "Give the domain a collection-like interface, hide SQL.",
		level: "intermediate",
		minutes: 8,
		tags: ["architecture"],
		summary: "A repository pretends the aggregate is in memory. A unit of work tracks dirty objects and flushes one transaction. Together they keep domain services off JDBC/Prisma calls.",
		sections: [{
			heading: "Sketch",
			code: {
				title: "Order aggregate",
				source: `interface OrderRepo {
  get(id: OrderId): Order | null
  save(order: Order): void
  findOpenByUser(user: UserId): Order[]
}

class PlaceOrder {
  constructor(private orders: OrderRepo, private uow: UnitOfWork) {}
  run(cmd: PlaceOrderCmd) {
    const order = Order.open(cmd)
    this.orders.save(order)
    this.uow.commit()
  }
}`
			}
		}],
		related: [
			"/lld/adapter",
			"/lld/dependency-injection",
			"/examples/hotel-reservation"
		],
		furtherReading: [{
			label: "Fowler — Repository",
			href: "https://martinfowler.com/eaaCatalog/repository.html"
		}]
	},
	{
		slug: "uml",
		title: "UML that interviewers can parse",
		subtitle: "A few boxes, honest arrows, no decoration.",
		level: "foundational",
		minutes: 8,
		tags: ["communication"],
		summary: "You will not be graded on UML 2.5. You will be graded on whether a stranger can see the types, the ownership, and the multiplicity in sixty seconds.",
		sections: [{
			heading: "Draw these, skip the rest",
			bullets: [
				"Class box: name, key fields, key methods. Drop getters.",
				"Hollow triangle: inheritance / implements.",
				"Solid diamond: composition (spot dies with the floor).",
				"Empty diamond: aggregation.",
				"Arrows with 1..* : a lot has many spots.",
				"Sequence diagram: only for a protocol (ticket in → pay → gate open)."
			],
			callout: {
				kind: "note",
				title: "HLD vs LLD diagrams",
				text: "HLD: boxes are services and stores. LLD: boxes are classes. Do not mix them on one whiteboard without saying so."
			}
		}],
		related: [
			"/lld/parking-lot",
			"/lld/solid",
			"/examples/interview-framework"
		],
		furtherReading: [{
			label: "Martin Fowler — UML distilled (ideas)",
			href: "https://martinfowler.com/bliki/UmlMode.html"
		}]
	}
];
function getLld(slug) {
	return lldConcepts.find((c) => c.slug === slug);
}
//#endregion
export { lldConcepts as n, getLld as t };
