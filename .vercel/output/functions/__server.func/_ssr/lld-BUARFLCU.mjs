//#region node_modules/.nitro/vite/services/ssr/assets/lld-BUARFLCU.js
var lldDesigns = [{
	slug: "parking-lot",
	title: "Design a Parking Lot",
	subtitle: "The canonical LLD round: scope it, model it, then survive the concurrency question.",
	level: "intermediate",
	minutes: 20,
	tags: [
		"machine-coding",
		"oop",
		"modeling"
	],
	summary: "Parking lot is the most-asked LLD problem because it has just enough structure to expose how you scope a problem, where you put behaviour, and whether you have ever thought about two people trying to take the same spot. The classes are easy. The interview is won on requirements, the spot-allocation strategy, and atomic assignment.",
	keyPoints: [
		"Spend the first five minutes on scope: multi-level? multiple entrances? pricing model? reservations? EV charging?",
		"Model spot types and vehicle types separately, with a fit matrix — not a one-to-one mapping.",
		"Allocation policy is a strategy: nearest-to-entrance, first-fit, level-balanced.",
		"Assignment must be atomic. Two cars at two gates must never receive the same spot.",
		"Pricing is a strategy too, and fees are computed at exit from the ticket's timestamps."
	],
	prerequisites: ["/lld/uml", "/lld/strategy"],
	sections: [
		{
			heading: "Step 1 — Scope it out loud",
			lede: "Do not draw a class until these are answered.",
			followUps: [
				{
					q: "How big, and how many levels and entrances?",
					a: "Assume a garage: 5 levels, ~2,000 spots, 4 entry gates, 4 exit gates. Multiple gates is the important part — it is what makes assignment a concurrency problem rather than a lookup."
				},
				{
					q: "What vehicle and spot types?",
					a: "Vehicles: motorcycle, car, van/truck, plus EV as an attribute rather than a type. Spots: motorcycle, compact, large, plus handicapped and EV-charging as attributes. A larger spot can take a smaller vehicle, which is why a fit matrix beats an enum comparison."
				},
				{
					q: "How is pricing calculated?",
					a: "Per started hour with a daily cap, varying by spot type. Free for the first 15 minutes. That is enough to justify a strategy and a rounding policy without turning into a billing project."
				},
				{
					q: "Reservations, or first-come-first-served?",
					a: "Start with first-come-first-served, and mention that reservations add a hold with an expiry and turn spot state into a small state machine. Offering the extension without building it is the right move on time."
				},
				{
					q: "What happens when the lot is full?",
					a: "Reject at the gate with a clear reason, and expose per-type availability so the display board can say 'compact full, large available'. Availability per type, not a single number."
				}
			],
			callout: {
				kind: "interview",
				text: "State your assumptions as decisions, not questions you are waiting to be answered: 'I'll assume multiple entrances, because that is what makes allocation interesting — tell me if you'd rather I simplify.' That keeps you moving and shows judgement."
			}
		},
		{
			heading: "Step 2 — The API surface",
			lede: "Two methods carry the whole design.",
			code: {
				title: "Write these before any class diagram",
				lang: "ts",
				source: `interface ParkingLotService {
  // at an entry gate
  park(vehicle: Vehicle, gate: GateId, requestId: RequestId): Result<Ticket, ParkFailure>;

  // at an exit gate
  unpark(ticketId: TicketId, at: Instant): Result<Invoice, UnparkFailure>;

  // for the display board above each entrance
  availability(): Map<SpotType, number>;
}

type ParkFailure = "lot_full" | "no_spot_for_vehicle_type" | "vehicle_already_parked";
type UnparkFailure = "unknown_ticket" | "already_paid" | "ticket_lost";`
			},
			bullets: [
				"requestId makes park() idempotent: a gate that retries after a timeout must not allocate a second spot.",
				"Returning a Result rather than throwing forces you to enumerate failures — interviewers notice the list.",
				"availability() per type, because 'the lot has 12 free spots' is useless to a driver in a van."
			]
		},
		{
			heading: "Step 3 — The model",
			diagram: {
				kind: "uml",
				caption: "Composition down the physical hierarchy; strategies at the two decision points.",
				boxes: [
					{
						name: "ParkingLot",
						tone: "accent",
						members: [
							{
								name: "levels: List<Level>",
								kind: "field",
								vis: "-",
								note: "composition 1..*"
							},
							{
								name: "allocator: SpotAllocator",
								kind: "field",
								vis: "-"
							},
							{
								name: "pricing: PricingStrategy",
								kind: "field",
								vis: "-"
							},
							{
								name: "park(vehicle, gate, reqId)",
								kind: "method"
							},
							{
								name: "unpark(ticketId, at)",
								kind: "method"
							}
						]
					},
					{
						name: "Level",
						members: [
							{
								name: "number: int",
								kind: "field",
								vis: "-"
							},
							{
								name: "spots: List<Spot>",
								kind: "field",
								vis: "-"
							},
							{
								name: "freeCount(type): int",
								kind: "method"
							}
						]
					},
					{
						name: "Spot",
						members: [
							{
								name: "id: SpotId",
								kind: "field",
								vis: "-"
							},
							{
								name: "type: SpotType",
								kind: "field",
								vis: "-"
							},
							{
								name: "features: Set<Feature>",
								kind: "field",
								vis: "-",
								note: "EV, HANDICAPPED"
							},
							{
								name: "state: FREE | HELD | OCCUPIED",
								kind: "field",
								vis: "-"
							},
							{
								name: "distanceTo(gate): int",
								kind: "method"
							}
						]
					},
					{
						name: "Ticket",
						tone: "ok",
						members: [
							{
								name: "id, spotId, plate",
								kind: "field",
								vis: "-"
							},
							{
								name: "enteredAt: Instant",
								kind: "field",
								vis: "-"
							},
							{
								name: "exitedAt: Instant?",
								kind: "field",
								vis: "-"
							}
						]
					},
					{
						name: "SpotAllocator",
						stereotype: "interface",
						tone: "accent",
						members: [{
							name: "pick(free, vehicle, gate): Spot?",
							kind: "method"
						}]
					},
					{
						name: "PricingStrategy",
						stereotype: "interface",
						tone: "accent",
						members: [{
							name: "fee(ticket, at): Money",
							kind: "method"
						}]
					}
				],
				edges: [
					{
						from: "ParkingLot",
						to: "Level",
						kind: "has",
						label: "composition 1 → 1..*"
					},
					{
						from: "Level",
						to: "Spot",
						kind: "has",
						label: "composition 1 → 1..*"
					},
					{
						from: "ParkingLot",
						to: "SpotAllocator",
						kind: "uses",
						label: "injected policy"
					},
					{
						from: "ParkingLot",
						to: "PricingStrategy",
						kind: "uses",
						label: "injected policy"
					},
					{
						from: "Ticket",
						to: "Spot",
						kind: "uses",
						label: "by id"
					}
				]
			},
			code: {
				title: "The fit matrix — do not compare enums by ordinal",
				lang: "ts",
				source: `const FITS: Record<VehicleType, SpotType[]> = {
  // ordered by preference: take the tightest spot that fits
  MOTORCYCLE: ["MOTORCYCLE", "COMPACT", "LARGE"],
  CAR:        ["COMPACT", "LARGE"],
  VAN:        ["LARGE"],
};

function candidateTypes(v: Vehicle): SpotType[] {
  return FITS[v.type];
}

// Why a matrix and not "spot.size >= vehicle.size":
//   - it survives a new type (EV_COMPACT) without renumbering an enum
//   - preference order is explicit, so a motorcycle does not take a large spot
//     while large spots are scarce
//   - features (EV charger, handicapped) filter separately from size`
			}
		},
		{
			heading: "Step 4 — Allocation as a strategy",
			body: ["Which free spot to hand out is a policy that changes per customer and per building. Making it an interface costs nothing and is the clearest place to demonstrate open/closed in this problem."],
			code: {
				title: "Three allocators over one interface",
				lang: "ts",
				source: `interface SpotAllocator {
  pick(free: FreeIndex, vehicle: Vehicle, gate: GateId): SpotId | null;
}

// Nearest to the gate the driver actually entered.
class NearestFirst implements SpotAllocator {
  pick(free, vehicle, gate) {
    for (const type of candidateTypes(vehicle)) {
      const spot = free.nearest(type, gate);   // min-heap per (type, gate)
      if (spot) return spot;
    }
    return null;
  }
}

// Spread cars across levels so no ramp jams. Better throughput, worse walk.
class LevelBalanced implements SpotAllocator { /* pick from the emptiest level */ }

// Keep large spots for large vehicles until small ones run out.
class ReserveLargeForVans implements SpotAllocator {
  pick(free, vehicle, gate) {
    if (vehicle.type !== "VAN" && free.count("LARGE") <= this.reserve) {
      return free.nearest("COMPACT", gate) ?? free.nearest("MOTORCYCLE", gate);
    }
    return this.inner.pick(free, vehicle, gate);
  }
}`
			},
			table: {
				headers: [
					"Free-spot index",
					"pick() cost",
					"Memory",
					"Notes"
				],
				rows: [
					[
						"Scan all spots",
						"O(n) — 2,000 checks per car",
						"None",
						"Fine on a whiteboard; state that you would not ship it"
					],
					[
						"Set per (type, level)",
						"O(1) for 'any free', no distance",
						"Small",
						"Good default if allocation is arbitrary"
					],
					[
						"Min-heap per (type, gate) by distance",
						"O(log n) push/pop",
						"One heap per gate per type",
						"The right structure for nearest-first"
					],
					[
						"Bitset per level",
						"O(n/64) word scan, very cache-friendly",
						"Tiny",
						"Excellent for 'first free of type' at real sizes"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "Keeping a free index rather than scanning is what turns this from a toy into a design. Say out loud that the index must be updated on every park and unpark, and that the index and the spot state must move together — that is the transaction boundary."
			}
		},
		{
			heading: "Step 5 — Concurrency: the question that separates candidates",
			lede: "Four gates, one free spot. Exactly one car may get it.",
			body: ["The failure everyone can picture: two gates both read 'B12 is free', both write 'B12 occupied', and two drivers meet at the same space. The fix depends on whether this is a single process or a service with a database, and a good answer covers both."],
			diagram: {
				kind: "sequence",
				caption: "Idempotency check, then an atomic claim. Nothing is held across a slow operation.",
				actors: [
					{
						id: "g1",
						label: "Gate 1"
					},
					{
						id: "g2",
						label: "Gate 2"
					},
					{
						id: "svc",
						label: "ParkingService"
					},
					{
						id: "db",
						label: "Store",
						sub: "spots + tickets"
					}
				],
				messages: [
					{
						from: "g1",
						to: "svc",
						label: "park(car, gate1, req-a)",
						kind: "call"
					},
					{
						from: "g2",
						to: "svc",
						label: "park(car, gate2, req-b)",
						kind: "call",
						note: "same instant"
					},
					{
						from: "svc",
						to: "db",
						label: "SELECT ticket WHERE request_id = req-a",
						kind: "call",
						note: "idempotency: has this retry already parked?"
					},
					{
						from: "svc",
						to: "db",
						label: "UPDATE spot SET state='OCCUPIED' WHERE id='B12' AND state='FREE'",
						kind: "call",
						tone: "accent",
						note: "compare-and-set: rows affected decides the winner"
					},
					{
						from: "db",
						to: "svc",
						label: "1 row (gate 1) / 0 rows (gate 2)",
						kind: "return"
					},
					{
						from: "svc",
						to: "g1",
						label: "Ticket(B12)",
						kind: "return",
						tone: "ok"
					},
					{
						from: "svc",
						to: "svc",
						label: "gate 2: retry with the next candidate spot",
						kind: "self",
						tone: "warn"
					}
				]
			},
			code: [{
				title: "Single process — a lock per level, not one global lock",
				lang: "ts",
				source: `// One lock for the whole lot serialises every gate: correct, and a bottleneck.
// Lock per level lets four gates work in parallel most of the time.
park(vehicle: Vehicle, gate: GateId): Ticket {
  for (const level of this.levelsByPreference(gate)) {
    const spot = level.lock.withLock(() => {         // short, no IO inside
      const s = level.free.pick(vehicle, gate);
      if (s) { s.state = "OCCUPIED"; level.free.remove(s.id); }
      return s;
    });
    if (spot) return this.tickets.issue(vehicle, spot);  // slow work outside the lock
  }
  throw new LotFull();
}`
			}, {
				title: "Distributed — atomic claim in the database",
				lang: "sql",
				source: `-- Option A: conditional update. The winner is whoever affects a row.
UPDATE spots SET state = 'OCCUPIED', vehicle_plate = $2, updated_at = now()
WHERE id = $1 AND state = 'FREE';
-- rows_affected = 0  →  someone beat us; pick the next candidate.

-- Option B: let the database choose, skipping rows others hold.
SELECT id FROM spots
WHERE level_id = $1 AND type = ANY($2) AND state = 'FREE'
ORDER BY distance_to_gate
FOR UPDATE SKIP LOCKED
LIMIT 1;
-- SKIP LOCKED is what stops four gates from queueing on the same row.`
			}],
			bullets: [
				"Never hold a lock across IO — printing a ticket, calling a payment provider, or opening a barrier are all slow and can fail.",
				"Retry on loss, with a bounded number of attempts and the next candidate spot. Under heavy contention, fall back to 'any free spot of a fitting type' rather than fighting over the nearest one.",
				"Idempotency: a gate that times out and retries must get the same ticket, not a second spot. Key on the gate's request id.",
				"Crash recovery: a car parked but no ticket written, or a ticket written and the barrier never opened. Reconcile with a sweeper that looks for HELD spots older than a few minutes.",
				"HELD is a real state, not an implementation detail: it covers the window between choosing a spot and confirming entry, and it needs an expiry."
			]
		},
		{
			heading: "Step 6 — Pricing and exit",
			code: {
				title: "Fees computed from the ticket, with the rounding rule stated",
				lang: "ts",
				source: `class TieredHourlyPricing implements PricingStrategy {
  constructor(
    private ratePerHour: Record<SpotType, Money>,
    private freeMinutes = 15,
    private dailyCap: Money = Money.of(40, "USD"),
  ) {}

  fee(ticket: Ticket, at: Instant): Money {
    const minutes = at.minutesSince(ticket.enteredAt);
    if (minutes <= this.freeMinutes) return Money.zero("USD");

    const days  = Math.floor(minutes / (24 * 60));
    const rest  = minutes % (24 * 60);
    const hours = Math.ceil(rest / 60);            // every started hour is charged

    const perDay = this.dailyCap;
    const partial = Money.min(
      this.ratePerHour[ticket.spotType].times(hours),
      this.dailyCap,                                // cap applies within a day too
    );
    return perDay.times(days).plus(partial);
  }
}`
			},
			bullets: [
				"State the rounding rule explicitly — 'every started hour' versus 'per minute' is a product decision and a common source of disputes.",
				"Money is a value object with a currency, never a float. Saying this once is worth several minutes of credibility.",
				"Exit is also a state transition: PARKED → PAID → EXITED. Paying at a kiosk and then taking twenty minutes to reach the barrier is normal, so PAID has a grace window.",
				"Lost ticket is a real requirement: charge a flat maximum, and find the spot by plate via the entry camera."
			]
		},
		{
			heading: "Extensions to offer if there is time",
			table: {
				headers: [
					"Extension",
					"What it adds to the model",
					"Trap"
				],
				rows: [
					[
						"Reservations",
						"HELD state with expiry, a reservation entity, a release sweeper",
						"Held spots that never expire slowly starve the lot"
					],
					[
						"EV charging",
						"Feature on the spot, charging session with its own billing",
						"Cars that stay plugged in after charging; add an idle fee"
					],
					[
						"Monthly passes",
						"Subscription entity; pricing returns zero but the spot is still tracked",
						"Pass holders in a full lot — reserve a block for them"
					],
					[
						"Multiple lots",
						"Lot becomes an aggregate; availability is queried across lots",
						"Cross-lot search is a read model, not a scan of every lot"
					],
					[
						"Display boards",
						"Read model updated on park/unpark events",
						"Counting free spots on every refresh; keep counters incrementally"
					],
					[
						"Valet",
						"Attendant as an actor, spot chosen without a driver",
						"Two claims on one spot from valet and gate; same atomicity rules"
					]
				]
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "Two cars arrive at two gates at exactly the same time. Walk me through it.",
					a: "Both allocators may pick the same free spot, so the claim has to be atomic. In one process I take a per-level lock, pick and mark inside it, and issue the ticket outside it. Across services I use a conditional UPDATE that only succeeds when the spot is still FREE, or SELECT ... FOR UPDATE SKIP LOCKED so the database hands each gate a different row. The loser retries with the next candidate."
				},
				{
					q: "How do you find the nearest free spot efficiently?",
					a: "Precompute distance from every spot to every gate — it is static — and keep a min-heap per (gate, spot type) of free spots. Park pops, unpark pushes. That is O(log n) instead of scanning 2,000 spots, and the memory is a few heaps. At realistic sizes a bitset scan per level is also fine and is simpler; I would mention both."
				},
				{
					q: "The system restarts. What state do you need?",
					a: "Spots and their states, open tickets, and the free index — which I would rebuild from spot state on startup rather than persist, since a derived index that disagrees with the truth is worse than no index. The risky window is a spot marked HELD by a process that died; a sweeper releases holds older than the hold timeout."
				},
				{
					q: "Where would you put the fee calculation, and why not on Ticket?",
					a: "In a strategy the lot depends on, because pricing changes for reasons that have nothing to do with what a ticket is — promotions, new rate cards, a different building. Ticket holds the facts (spot type, entry, exit) and pricing interprets them. That also makes pricing unit-testable with a fixed clock and no lot at all."
				},
				{
					q: "How would you test this?",
					a: "Unit tests for the allocator and pricing with a fake clock. A state-machine test for spot transitions that asserts illegal ones throw. And a concurrency test that fires N parallel park() calls against a lot with one free spot and asserts exactly one ticket is issued — that test is the one that catches the bug the interviewer is really asking about."
				}
			]
		}
	],
	related: [
		"/lld/uml",
		"/lld/strategy",
		"/lld/concurrency",
		"/lld/elevator"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}, {
	slug: "elevator",
	title: "Design an Elevator System",
	subtitle: "A scheduling problem wearing a state-machine costume.",
	level: "advanced",
	minutes: 20,
	tags: [
		"machine-coding",
		"state-machine",
		"scheduling"
	],
	summary: "Elevator design is asked because it has a genuinely interesting core: a dispatcher choosing which car serves a hall call, and a per-car state machine that must never open its doors between floors. Get the two request types straight, use the SCAN/elevator algorithm, and the rest follows.",
	keyPoints: [
		"Two request types: hall calls (floor + direction, servable by any car) and car calls (destination, bound to one car).",
		"Per-car state machine: IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPENING, DOORS_OPEN, DOORS_CLOSING. Illegal transitions must be impossible.",
		"SCAN (the 'elevator algorithm') beats nearest-first: keep going in one direction, serving stops in order, then reverse.",
		"Dispatch is a strategy scored per car — direction compatibility, distance, current load.",
		"Safety rules override everything: no motion with doors open, obstruction reopens, fire mode recalls all cars."
	],
	prerequisites: ["/lld/uml", "/lld/strategy"],
	sections: [
		{
			heading: "Step 1 — Scope",
			followUps: [
				{
					q: "How many cars and floors?",
					a: "Assume 4 cars, 20 floors, with a basement. Multiple cars is the whole point — a single elevator is just a sorted set of stops."
				},
				{
					q: "What are the request sources?",
					a: "Hall panels on each floor (up/down buttons) and a keypad inside each car. This distinction drives the entire design and is the first thing to state."
				},
				{
					q: "Optimise for what?",
					a: "Average wait time is the usual objective, with a hard cap on worst-case wait so nobody is starved. I would say I am optimising average wait subject to no request waiting more than ~90 seconds."
				},
				{
					q: "Special modes?",
					a: "Fire recall (all cars to the ground floor, doors open, out of service), maintenance mode per car, and capacity limits with an overload sensor. Mentioning these shows you have thought about the real machine."
				}
			]
		},
		{
			heading: "Step 2 — Two request types, one model",
			code: {
				title: "The distinction that makes dispatch tractable",
				lang: "ts",
				source: `// From a hall panel: "someone on floor 7 wants to go down."
// Any car can serve it, and the direction is part of the request.
type HallCall = { kind: "hall"; floor: Floor; direction: "UP" | "DOWN"; at: Instant };

// From inside car 2: "take me to floor 12."
// Only that car can serve it.
type CarCall = { kind: "car"; car: CarId; floor: Floor; at: Instant };

interface ElevatorSystem {
  requestHall(floor: Floor, direction: Direction): void;   // dispatcher decides the car
  requestFloor(car: CarId, floor: Floor): void;            // goes straight to that car
  tick(now: Instant): void;                                // simulation / control loop
}`
			},
			callout: {
				kind: "warn",
				text: "Candidates who model a single 'request floor N' type get stuck immediately: a car travelling up cannot usefully serve someone who wants to go down, and without the direction the dispatcher cannot know that. Get this right in the first two minutes."
			}
		},
		{
			heading: "Step 3 — The per-car state machine",
			diagram: {
				kind: "flow",
				caption: "Six states. Every transition has a trigger; anything not drawn is illegal.",
				rows: [
					[
						{
							id: "idle",
							label: "IDLE",
							sub: "no pending stops",
							tone: "accent"
						},
						{
							id: "up",
							label: "MOVING_UP"
						},
						{
							id: "down",
							label: "MOVING_DOWN"
						}
					],
					[
						{
							id: "opening",
							label: "DOORS_OPENING",
							tone: "warn"
						},
						{
							id: "open",
							label: "DOORS_OPEN",
							sub: "dwell timer",
							tone: "warn"
						},
						{
							id: "closing",
							label: "DOORS_CLOSING",
							sub: "obstruction → reopen",
							tone: "warn"
						}
					],
					[{
						id: "maint",
						label: "MAINTENANCE",
						sub: "out of dispatch",
						tone: "bad"
					}, {
						id: "fire",
						label: "FIRE_RECALL",
						sub: "overrides all",
						tone: "bad"
					}]
				]
			},
			code: {
				title: "Encode the transitions; enforce the safety invariant in one place",
				lang: "ts",
				source: `const ALLOWED: Record<CarState, CarState[]> = {
  IDLE:          ["MOVING_UP", "MOVING_DOWN", "DOORS_OPENING", "MAINTENANCE", "FIRE_RECALL"],
  MOVING_UP:     ["MOVING_UP", "DOORS_OPENING", "IDLE", "FIRE_RECALL"],
  MOVING_DOWN:   ["MOVING_DOWN", "DOORS_OPENING", "IDLE", "FIRE_RECALL"],
  DOORS_OPENING: ["DOORS_OPEN"],
  DOORS_OPEN:    ["DOORS_CLOSING"],
  DOORS_CLOSING: ["DOORS_OPEN", "IDLE", "MOVING_UP", "MOVING_DOWN"],  // reopen on obstruction
  MAINTENANCE:   ["IDLE"],
  FIRE_RECALL:   ["MAINTENANCE"],
};

class Car {
  private state: CarState = "IDLE";

  transition(next: CarState) {
    if (!ALLOWED[this.state].includes(next)) {
      throw new IllegalTransition(this.state, next);
    }
    // the invariant that matters more than any of them:
    if ((next === "MOVING_UP" || next === "MOVING_DOWN") && this.doors !== "CLOSED") {
      throw new SafetyViolation("motion requested with doors not closed");
    }
    this.state = next;
  }
}`
			},
			bullets: [
				"DOORS_OPENING and DOORS_CLOSING are separate states, not instants: obstruction during closing is the single most common real event and needs somewhere to live.",
				"Dwell time is a timer in DOORS_OPEN, extended by the door-open button and by the obstruction sensor, with a maximum so a held door does not take the car out of service.",
				"Deceleration means a car cannot always stop at the next floor. Model a commit point: past it, the stop is fixed and a new request for that floor waits for the next pass.",
				"MAINTENANCE and FIRE_RECALL remove the car from dispatch — the dispatcher must ask each car whether it is available rather than assuming."
			]
		},
		{
			heading: "Step 4 — SCAN: why 'nearest car' is a trap",
			lede: "Serve every stop in the direction of travel before reversing.",
			body: ["The greedy answer — always send the nearest car, always go to the nearest requested floor — starves the far end of the building and produces ping-ponging: the car oscillates around a busy middle floor while floor 19 waits forever.", "SCAN, borrowed from disk scheduling, fixes both. Each car keeps two ordered sets of stops: those ahead in its current direction, and those it will pick up after reversing. It sweeps up serving every stop in order, reverses at the top of its set, and sweeps down. Wait time becomes bounded by one full sweep instead of unbounded."],
			code: {
				title: "Stops as two sorted sets, one per sweep",
				lang: "ts",
				source: `class CarStops {
  private up = new SortedSet<Floor>();     // to serve while heading up
  private down = new SortedSet<Floor>();   // to serve while heading down

  add(floor: Floor, currentFloor: Floor, direction: Direction) {
    if (direction === "UP") {
      (floor >= currentFloor ? this.up : this.down).add(floor);
    } else {
      (floor <= currentFloor ? this.down : this.up).add(floor);
    }
  }

  nextStop(currentFloor: Floor, direction: Direction): Floor | null {
    if (direction === "UP") {
      return this.up.firstAbove(currentFloor)     // keep going up
          ?? this.down.max()                       // else reverse at the top
          ?? null;
    }
    return this.down.firstBelow(currentFloor) ?? this.up.min() ?? null;
  }
}`
			},
			table: {
				headers: [
					"Policy",
					"Average wait",
					"Worst case",
					"Notes"
				],
				rows: [
					[
						"Nearest stop first (greedy)",
						"Good when idle",
						"Unbounded — far floors starve",
						"Ping-pongs around busy floors"
					],
					[
						"FCFS per car",
						"Poor",
						"Bounded",
						"Ignores that the car passes floors on the way"
					],
					[
						"SCAN / elevator",
						"Good",
						"One sweep",
						"The standard answer; simple to implement"
					],
					[
						"LOOK (SCAN, reverse early)",
						"Slightly better",
						"One sweep",
						"Reverses at the last request, not the last floor"
					],
					[
						"Destination dispatch",
						"Best",
						"Bounded",
						"Passengers enter destination in the lobby; groups by destination — mention it as the modern approach"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "Naming SCAN and its disk-scheduling origin, then noting that real modern buildings use destination dispatch, is a two-sentence answer that lands better than any amount of code."
			}
		},
		{
			heading: "Step 5 — Dispatching a hall call",
			body: ["When a hall call arrives, score every available car and give it to the best one. Scoring is a strategy: the factors are stable but the weights differ per building, and this is where you demonstrate that the design is tunable rather than hard-coded."],
			code: {
				title: "Scored dispatch with the compatibility rules first",
				lang: "ts",
				source: `interface Dispatcher {
  assign(call: HallCall, cars: readonly Car[]): CarId | null;
}

class ScoredDispatcher implements Dispatcher {
  assign(call: HallCall, cars: readonly Car[]): CarId | null {
    let best: { id: CarId; score: number } | null = null;

    for (const car of cars) {
      if (!car.availableForDispatch()) continue;          // maintenance, fire, full
      const score = this.score(car, call);
      if (score === Infinity) continue;                    // cannot serve this sweep
      if (!best || score < best.score) best = { id: car.id, score };
    }
    return best?.id ?? null;   // null: queue the call and retry next tick
  }

  private score(car: Car, call: HallCall): number {
    const distance = Math.abs(car.floor - call.floor);

    // Moving toward the call in the same direction: it is on the way.
    const onTheWay =
      (car.direction === "UP"   && call.direction === "UP"   && call.floor >= car.floor) ||
      (car.direction === "DOWN" && call.direction === "DOWN" && call.floor <= car.floor);

    if (car.state === "IDLE") return distance;                   // best case
    if (onTheWay)            return distance + car.stopsAhead * 2; // each stop costs time
    // wrong direction: must finish this sweep first
    return distance + car.remainingSweepFloors() + 10;
  }
}`
			},
			bullets: [
				"Load matters: a car at capacity will pass the floor without stopping, so a full car should score badly or be excluded.",
				"Reassignment is legitimate — if a better car becomes free before the call is served, moving it reduces wait. Cap how often, or calls thrash between cars.",
				"Starvation guard: age every waiting call and add its age to the score, so an old call eventually outranks a convenient one.",
				"Duplicate hall calls (five people pressing the same button) must collapse into one request keyed by (floor, direction)."
			],
			diagram: {
				kind: "sequence",
				caption: "A hall call from floor 7, going down.",
				actors: [
					{
						id: "p",
						label: "Hall panel",
						sub: "floor 7"
					},
					{
						id: "d",
						label: "Dispatcher"
					},
					{
						id: "c2",
						label: "Car 2",
						sub: "at 12, moving down"
					},
					{
						id: "m",
						label: "Motor + doors"
					}
				],
				messages: [
					{
						from: "p",
						to: "d",
						label: "hallCall(7, DOWN)",
						kind: "call",
						note: "deduped by (floor, direction)"
					},
					{
						from: "d",
						to: "c2",
						label: "score? → 5 + 2 stops",
						kind: "call",
						note: "on the way, same direction"
					},
					{
						from: "d",
						to: "c2",
						label: "assign(call)",
						kind: "call",
						tone: "ok"
					},
					{
						from: "c2",
						to: "c2",
						label: "stops.add(7, DOWN)",
						kind: "self"
					},
					{
						from: "c2",
						to: "m",
						label: "continue DOWN, stop at 7",
						kind: "call"
					},
					{
						from: "m",
						to: "c2",
						label: "arrived",
						kind: "return"
					},
					{
						from: "c2",
						to: "m",
						label: "DOORS_OPENING → DOORS_OPEN (dwell 4s)",
						kind: "call",
						tone: "warn"
					},
					{
						from: "c2",
						to: "d",
						label: "call served, clear indicator",
						kind: "return"
					}
				]
			}
		},
		{
			heading: "Step 6 — Safety and the things that actually fail",
			table: {
				headers: [
					"Concern",
					"Rule",
					"Where it lives"
				],
				rows: [
					[
						"Motion with doors open",
						"Physically interlocked; software must also refuse the transition",
						"Car state machine — a hard invariant, not a policy"
					],
					[
						"Obstruction while closing",
						"Reopen, restart dwell, count reopens and eventually alarm",
						"DOORS_CLOSING transition"
					],
					[
						"Overload",
						"Refuse to move, sound alarm, hold doors open",
						"Car; also excludes it from dispatch"
					],
					[
						"Fire alarm",
						"All cars to the designated floor, doors open, out of service",
						"System-level override that pre-empts the dispatcher"
					],
					[
						"Power loss",
						"Battery lowers the car to the nearest floor and opens",
						"Outside software's control; model as a state you can enter"
					],
					[
						"Car unresponsive",
						"Watchdog removes it from dispatch, reassigns its hall calls",
						"Dispatcher — hall calls must survive a car failure"
					]
				]
			},
			callout: {
				kind: "interview",
				text: "The reassignment rule is a good thing to volunteer: hall calls belong to the system, so a failed car's hall calls must be redistributed. Car calls die with the car — the people inside are a rescue problem, not a scheduling one."
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "How do you prevent starvation of a high floor?",
					a: "Two mechanisms. SCAN itself bounds waiting to one sweep, because the car serves every stop in order rather than chasing the nearest. On top of that I age requests: a call's score improves with its wait time, so an old call eventually beats a closer one. I would also monitor p99 wait, since that is where starvation shows up before anyone complains."
				},
				{
					q: "Four cars, morning rush, everyone going up from the lobby. What changes?",
					a: "Traffic pattern detection. In up-peak, idle cars should park at the lobby instead of where they last stopped, and the dispatcher should favour sending a full car rather than splitting the crowd. The general version of this is destination dispatch: passengers enter their floor in the lobby, and the system groups people going to nearby floors into the same car, which cuts the number of stops per trip dramatically."
				},
				{
					q: "How do you test a system that is fundamentally about time?",
					a: "Inject the clock and drive the system with an explicit tick(), so a simulated hour runs in milliseconds. Then I can write scenario tests — morning rush, a single request at 3am, a car failing mid-sweep — and assert on wait-time distributions rather than on exact sequences. The state machine gets its own table-driven test asserting every illegal transition throws."
				},
				{
					q: "Where would concurrency bite here?",
					a: "Button presses arrive from many panels while the control loop is mutating car state. I would funnel all events into a single queue per car and process them in the control loop, so the state machine is single-threaded by construction. That is much easier to reason about than locking a car's fields, and it matches how real controllers work."
				},
				{
					q: "How would this look as a distributed system?",
					a: "It usually should not be — a building's controller is one process for good safety reasons. If asked anyway: the dispatcher is a leader-elected service, cars are independent state machines reporting position and load, and hall calls are persisted so a dispatcher failover does not lose them. The interesting part is that safety decisions must stay local to the car; you never want a network partition deciding whether doors may open."
				}
			]
		}
	],
	related: [
		"/lld/parking-lot",
		"/lld/uml",
		"/lld/concurrency",
		"/lld/strategy"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
var lldCreationalPatterns = [{
	slug: "factory",
	title: "Factory Method & Abstract Factory",
	subtitle: "Move the decision about which class to build into one place.",
	level: "foundational",
	minutes: 11,
	tags: ["patterns", "creational"],
	summary: "A factory answers one question — which concrete type do we build, and with what wiring — so that callers can hold an interface and never learn the answer. Simple factory is a function with a switch. Factory method defers the choice to a subclass. Abstract factory builds a whole family that must stay consistent with each other.",
	keyPoints: [
		"The point is not 'avoid new'. It is to have exactly one place that knows concrete types, so adding one is a small, safe diff.",
		"Simple factory: a static function or registry. This covers most interview answers, and that is fine — say so.",
		"Factory method: the base class defines the algorithm and calls createX(); the subclass decides the type.",
		"Abstract factory: several related products that must come from the same family (Postgres pair, MySQL pair).",
		"A factory whose switch grows for every new type has just moved the problem — use a registry keyed by the discriminator."
	],
	prerequisites: ["/lld/solid"],
	sections: [
		{
			heading: "Three things called 'factory'",
			table: {
				headers: [
					"",
					"Who decides the type",
					"Use when",
					"Cost"
				],
				rows: [
					[
						"Simple factory",
						"A function, from a parameter or config",
						"Parsing a discriminated payload; picking a strategy by name",
						"Not extensible without editing it — unless it is a registry"
					],
					[
						"Factory method",
						"A subclass overrides createX()",
						"A template algorithm whose one variable step is 'which object'",
						"Requires inheritance, so it drags in a class hierarchy"
					],
					[
						"Abstract factory",
						"An injected factory object, chosen at composition",
						"Several products must be consistent: connection + dialect + migrator",
						"One interface per product; verbose for two products"
					]
				]
			}
		},
		{
			heading: "Simple factory, done as a registry",
			lede: "Keeps open/closed instead of quietly breaking it.",
			code: [{
				title: "The version that grows a case per release",
				lang: "ts",
				source: `function makeNotifier(kind: string): Notifier {
  switch (kind) {                      // every new channel edits this file
    case "email": return new EmailNotifier(smtp);
    case "sms":   return new SmsNotifier(twilio);
    case "push":  return new PushNotifier(fcm);
    default: throw new Error("unknown " + kind);
  }
}`
			}, {
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
register("sms",   (d) => new SmsNotifier(d.twilio));`
			}],
			callout: {
				kind: "note",
				text: "A registry trades compile-time exhaustiveness for runtime extensibility. If the set of types is closed and known, a switch over a union type that the compiler checks for exhaustiveness is genuinely better — say which trade you are making."
			}
		},
		{
			heading: "Factory method: the template's variable step",
			body: ["Factory method belongs to an algorithm that is fixed except for what it instantiates. The base class runs the flow; the subclass supplies the product. It is inheritance-based, which is both its point and its limitation."],
			diagram: {
				kind: "uml",
				caption: "The base class owns the flow; subclasses own the product type.",
				boxes: [
					{
						name: "ExportJob",
						stereotype: "abstract",
						tone: "accent",
						members: [{
							name: "run(rows)",
							kind: "method",
							note: "template: open → write → close → upload"
						}, {
							name: "createWriter(): Writer",
							kind: "method",
							vis: "#",
							note: "the factory method"
						}]
					},
					{
						name: "CsvExportJob",
						members: [{
							name: "createWriter()",
							kind: "method",
							vis: "#",
							note: "returns CsvWriter"
						}]
					},
					{
						name: "ParquetExportJob",
						members: [{
							name: "createWriter()",
							kind: "method",
							vis: "#",
							note: "returns ParquetWriter"
						}]
					},
					{
						name: "Writer",
						stereotype: "interface",
						tone: "accent",
						members: [{
							name: "writeRow(row)",
							kind: "method"
						}, {
							name: "close(): Bytes",
							kind: "method"
						}]
					}
				],
				edges: [
					{
						from: "CsvExportJob",
						to: "ExportJob",
						kind: "extends"
					},
					{
						from: "ParquetExportJob",
						to: "ExportJob",
						kind: "extends"
					},
					{
						from: "ExportJob",
						to: "Writer",
						kind: "uses",
						label: "created by the factory method"
					}
				]
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
new ExportJob(() => new ParquetWriter({ compression: "zstd" }), s3);`
			}
		},
		{
			heading: "Abstract factory: keeping a family consistent",
			lede: "The reason it exists is that mixing families is a bug you cannot see.",
			body: ["If a connection from Postgres is paired with a MySQL dialect, nothing fails at compile time and everything fails at 2am. Abstract factory makes the family the unit of choice: you pick PostgresFactory once, and every product you get from it is consistent by construction."],
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
                                          : new SqliteFactory(env.DATABASE_FILE);`
			},
			callout: {
				kind: "warn",
				text: "Abstract factory is the pattern most often applied speculatively. If there will only ever be one family, it is four extra interfaces buying nothing. The honest trigger is a second family that already exists — commonly 'production' and 'test/in-memory'."
			}
		},
		{
			heading: "Practical notes",
			bullets: [
				"Static factory methods on a type (Money.fromCents, Duration.ofMinutes) are the cheapest and most underused form: named constructors that validate and cannot be confused with each other.",
				"Return the interface, not the concrete class — otherwise callers bind to the implementation anyway and the factory is decoration.",
				"Failure should be typed: an unknown discriminator is a domain error, not a generic Error with a string.",
				"Factories and DI containers overlap. If you already have a composition root, most 'factories' are just functions in it — that is a fine answer.",
				"If the product needs many optional parameters, you want a builder, not a factory with fifteen arguments."
			],
			takeaways: [
				"One place knows the concrete types; everyone else holds an interface.",
				"Prefer a registry or an injected factory function over a switch that grows.",
				"Abstract factory is about consistency across products, not about creation per se."
			]
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "Factory method or abstract factory — which do you reach for?",
					a: "Usually neither in the textbook form. Most of the time I want a simple factory function or an injected creator, because that gets the seam without an inheritance hierarchy. Abstract factory earns its place when several products must come from the same family and mixing them is a silent bug. Factory method earns its place when a fixed algorithm has exactly one variable step and inheritance is already in the design."
				},
				{
					q: "How does the factory get its dependencies?",
					a: "Injected, same as anything else. The factory is constructed in the composition root with the pool, the HTTP client, the config, and it closes over them. What I avoid is a factory that reaches into a global container at call time — that turns it into a service locator and hides the graph."
				},
				{
					q: "How do you test code that uses a factory?",
					a: "Inject the factory, so the test passes one that returns fakes. If the factory is a static function I cannot substitute it, and I am back to testing through the real implementations — which is the main practical reason to prefer an injected factory object or function over a static."
				}
			]
		}
	],
	related: [
		"/lld/builder",
		"/lld/strategy",
		"/lld/dependency-injection",
		"/lld/singleton-di"
	],
	furtherReading: [{
		label: "roadmap.sh — system design",
		href: "https://roadmap.sh/system-design"
	}]
}, {
	slug: "builder",
	title: "Builder Pattern",
	subtitle: "Construct something complicated without a fifteen-argument constructor.",
	level: "foundational",
	minutes: 10,
	tags: [
		"patterns",
		"creational",
		"api-design"
	],
	summary: "Builder separates how an object is assembled from what it ends up being. Its real value is not the fluent chaining people remember, but validation at build() time and the ability to make illegal combinations impossible to express.",
	keyPoints: [
		"Trigger: many optional parameters, or several constructor overloads that differ only by which arguments you passed.",
		"Validate in build(), not in each setter — cross-field rules need the whole picture.",
		"Return an immutable product; the builder is the only mutable thing, and it is short-lived.",
		"A staged (type-safe) builder makes required fields a compile error rather than a runtime throw.",
		"In languages with named and default arguments, a builder is often unnecessary — say that rather than reciting the pattern."
	],
	sections: [
		{
			heading: "The problem it removes",
			code: [{
				title: "Telescoping constructors — what are those booleans?",
				lang: "ts",
				source: `new HttpRequest("GET", url, null, 3, 5000, true, false, null, "gzip");
//                                     ^     ^     ^     ^      ^
//              body ─┘  retries ─┘  timeout ─┘  followRedirects ─┘  ...
// Every call site is a puzzle, and swapping two booleans compiles fine.`
			}, {
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
}`
			}],
			callout: {
				kind: "insight",
				text: "Those two cross-field checks in build() are the point of the pattern. No setter could have made them, because each one only sees its own field."
			}
		},
		{
			heading: "Make illegal states unrepresentable",
			lede: "A staged builder turns a runtime throw into a compile error.",
			body: ["If url is required, the plain builder still lets you call build() without it and fail at runtime. Encoding the stage in the type means the method simply does not exist until the requirement is met — the strongest form of the pattern, and a good thing to mention even if you do not write it out."],
			code: {
				title: "Staged builder: build() only exists once the required parts are set",
				lang: "ts",
				source: `interface NeedsUrl    { url(u: string): NeedsMethod }
interface NeedsMethod { method(m: Method): Ready }
interface Ready       { header(k: string, v: string): Ready;
                        timeout(ms: number): Ready;
                        build(): HttpRequest }

// request().url("https://…").build()   ← does not compile: build() is not on NeedsMethod`
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
							"Reads well at the call site"
						],
						bad: ["No natural place for cross-field validation", "Awkward if construction happens in steps across a codebase"],
						verdict: "Default choice in a language that has them."
					},
					{
						title: "Classic fluent builder",
						good: [
							"Cross-field validation in build()",
							"Assembly can be spread across code paths",
							"Product can stay immutable"
						],
						bad: ["Missing required field fails at runtime", "Boilerplate, and two objects to keep in sync"],
						verdict: "Java-style APIs, or when assembly is genuinely multi-step."
					},
					{
						title: "Staged builder",
						good: ["Required fields enforced by the type system", "Impossible to call build() too early"],
						bad: ["One interface per stage; verbose", "Painful when ordering is not naturally linear"],
						verdict: "Public SDKs where misuse must be impossible."
					}
				]
			}
		},
		{
			heading: "Director, and when it matters",
			body: ["The Gang of Four version adds a director that knows a recipe: given a builder, produce a standard configuration. In practice this is how you get named presets without duplicating knowledge of the fields at every call site."],
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

const req = Presets.thirdParty(HttpRequest.builder(url)).method("GET").build();`
			}
		},
		{
			heading: "Mistakes reviewers flag",
			table: {
				headers: [
					"Mistake",
					"Consequence",
					"Fix"
				],
				rows: [
					[
						"Builder returns a mutable product",
						"Callers mutate a shared object after build; invariants evaporate",
						"Freeze/copy on build; no setters on the product"
					],
					[
						"Reusing one builder for many products",
						"Second product silently inherits the first's fields",
						"build() returns and resets, or make the builder single-use and say so"
					],
					[
						"Validation scattered in setters",
						"Cross-field rules cannot be expressed; error appears at the wrong step",
						"Collect in build(), and report all violations at once"
					],
					[
						"Builder for a 3-field value object",
						"Ceremony with no benefit",
						"A constructor or an object literal"
					],
					[
						"Thread-shared builder",
						"Torn state, non-deterministic products",
						"Builders are local and short-lived; never share one"
					]
				]
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "When would you not use a builder?",
					a: "When the language gives me named parameters with defaults, and there are no cross-field rules — a plain call or an options object is clearer and there is nothing to keep in sync. I would also skip it for small value objects; three required fields is a constructor."
				},
				{
					q: "How do you make required fields safe?",
					a: "Either take them in the builder's constructor (so you cannot get a builder without them) or use a staged builder where build() appears only on the final interface. I prefer the constructor approach for two or three requirements and the staged version for a public SDK where a runtime failure would be a bad first experience."
				},
				{
					q: "Is the fluent chaining important?",
					a: "It is the least important part. What matters is validating once with the full picture and returning an immutable product. Chaining is ergonomics — and it can actively hurt if it encourages very long expressions that are hard to debug, since a stack trace points at one giant statement."
				}
			]
		}
	],
	related: [
		"/lld/factory",
		"/lld/solid",
		"/lld/repository"
	],
	furtherReading: [{
		label: "roadmap.sh — system design",
		href: "https://roadmap.sh/system-design"
	}]
}];
var lldBehavioralPatterns = [
	{
		slug: "strategy",
		title: "Strategy Pattern",
		subtitle: "Swap the algorithm, keep the caller.",
		level: "foundational",
		minutes: 11,
		tags: ["patterns", "behavioral"],
		summary: "Strategy pulls a family of interchangeable algorithms out from behind a conditional and puts each one in its own class. Payment methods, rate-limit algorithms, compression codecs, pricing rules, load-balancer pickers and matching policies are all the same shape: the caller's job never changes, only the rule it applies.",
		keyPoints: [
			"The trigger is a conditional that branches on a type or mode and grows a case per requirement.",
			"The context holds a strategy and delegates; it must not know which concrete one it has.",
			"Each strategy is independently unit-testable, which is usually the real win.",
			"Selection (which strategy) is a separate concern from execution (what it does) — do not fuse them.",
			"For one-method strategies in a language with first-class functions, a function type is a legitimate strategy."
		],
		prerequisites: ["/lld/solid"],
		sections: [
			{
				heading: "The shape",
				lede: "Context, interface, family of implementations.",
				diagram: {
					kind: "uml",
					caption: "Adding leaky-bucket is a new class, not a new branch.",
					boxes: [
						{
							name: "RateLimiter",
							tone: "accent",
							members: [{
								name: "strategy: LimiterStrategy",
								kind: "field",
								vis: "-"
							}, {
								name: "handle(req): Response",
								kind: "method"
							}]
						},
						{
							name: "LimiterStrategy",
							stereotype: "interface",
							tone: "accent",
							members: [{
								name: "allow(key, at): Decision",
								kind: "method"
							}]
						},
						{
							name: "TokenBucket",
							members: [
								{
									name: "capacity: int",
									kind: "field",
									vis: "-"
								},
								{
									name: "refillPerSec: double",
									kind: "field",
									vis: "-"
								},
								{
									name: "allow(key, at)",
									kind: "method"
								}
							]
						},
						{
							name: "SlidingWindowLog",
							members: [{
								name: "windowMs: long",
								kind: "field",
								vis: "-"
							}, {
								name: "allow(key, at)",
								kind: "method"
							}]
						},
						{
							name: "FixedWindowCounter",
							members: [{
								name: "allow(key, at)",
								kind: "method"
							}]
						}
					],
					edges: [
						{
							from: "TokenBucket",
							to: "LimiterStrategy",
							kind: "implements"
						},
						{
							from: "SlidingWindowLog",
							to: "LimiterStrategy",
							kind: "implements"
						},
						{
							from: "FixedWindowCounter",
							to: "LimiterStrategy",
							kind: "implements"
						},
						{
							from: "RateLimiter",
							to: "LimiterStrategy",
							kind: "has",
							label: "injected"
						}
					]
				},
				code: {
					title: "The seam every LLD rate limiter should have",
					lang: "ts",
					source: `interface LimiterStrategy {
  allow(key: string, at: number): Decision;   // { ok, remaining, retryAfterMs }
}

class RateLimiter {
  constructor(private strategy: LimiterStrategy) {}

  handle(req: Request): Response {
    const d = this.strategy.allow(req.userId, Date.now());
    return d.ok
      ? next(req)
      : tooMany(d.retryAfterMs, { "X-RateLimit-Remaining": String(d.remaining) });
  }
}

// Swapping the algorithm is a wiring change, not a code change:
new RateLimiter(new TokenBucket({ capacity: 10, refillPerSec: 2 }));
new RateLimiter(new SlidingWindowLog({ windowMs: 60_000, limit: 100 }));`
				}
			},
			{
				heading: "Selecting a strategy without a new switch",
				lede: "Do not replace a conditional in the context with the same conditional in a factory.",
				body: ["Strategy removes the branch from the algorithm's caller. It does not remove the fact that something must choose. The trick is to make selection data-driven and put it in exactly one place, so adding a strategy is a registration, not a code path."],
				code: [{
					title: "Registry — selection is data",
					lang: "ts",
					source: `const LIMITERS: Record<Tier, () => LimiterStrategy> = {
  free:       () => new FixedWindowCounter({ limit: 60,    windowMs: 60_000 }),
  pro:        () => new TokenBucket({ capacity: 1_000, refillPerSec: 50 }),
  enterprise: () => new SlidingWindowLog({ limit: 20_000, windowMs: 60_000 }),
};

function limiterFor(tier: Tier) {
  return LIMITERS[tier] ?? LIMITERS.free;   // one place, one default
}`
				}, {
					title: "Functions are strategies too",
					lang: "ts",
					source: `type Fare = (trip: Trip) => Money;

const standard: Fare = (t) => base.plus(perKm.times(t.km));
const surge = (multiplier: number): Fare => (t) => standard(t).times(multiplier);

class Pricing {
  constructor(private fare: Fare) {}
  quote(t: Trip) { return this.fare(t); }
}

// A class earns its place when the strategy needs state, configuration,
// several methods, or a name that shows up in stack traces and metrics.`
				}],
				callout: {
					kind: "insight",
					text: "If the strategy needs data the context holds, pass it as a method parameter rather than handing the strategy a reference back to the context. A strategy that calls back into its context is no longer independently testable."
				}
			},
			{
				heading: "Strategy vs its neighbours",
				table: {
					headers: [
						"Pattern",
						"Intent",
						"Tell them apart by"
					],
					rows: [
						[
							"Strategy",
							"Interchangeable algorithms for one step",
							"Caller picks; all options are peers"
						],
						[
							"State",
							"Behaviour changes as the object's state changes",
							"The object swaps its own strategy in response to events"
						],
						[
							"Template method",
							"Fixed skeleton, subclass fills steps",
							"Inheritance; the algorithm's shape is fixed"
						],
						[
							"Decorator",
							"Add behaviour around the same interface",
							"Wraps and delegates; can stack"
						],
						[
							"Command",
							"Encapsulate an invocation for later",
							"Carries the arguments; can be queued and undone"
						]
					]
				},
				callout: {
					kind: "interview",
					text: "State and Strategy have identical class diagrams. The distinguishing sentence is: 'in Strategy the client chooses; in State the object transitions itself.' Saying that is worth more than drawing either diagram."
				}
			},
			{
				heading: "Costs and when to skip it",
				bullets: [
					"Two implementations that will never grow is often a plain if. The pattern pays off from the third, or as soon as the branches carry real state.",
					"A strategy interface designed around one implementation's needs will leak: check the second implementation can honour it before you commit.",
					"Hot paths pay for a megamorphic call site; JIT inlining degrades once several implementations are live. Rare, but real in inner loops.",
					"Configuration sprawl: every strategy with its own knobs makes the composition root grow. Give each strategy a typed config object."
				],
				takeaways: [
					"Strategy is the answer to 'what if we later want a different algorithm here' — the most common interview follow-up there is.",
					"Keep selection in a registry so adding an option touches one map plus one new file.",
					"Test strategies directly and the context with a stub; that split keeps both test suites tiny."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Where would you put strategy in a rate limiter design?",
						a: "Behind the allow() call, so the algorithm (token bucket, sliding window, fixed window) is swappable per tier or per endpoint. The limiter itself only knows the decision object. That also lets me run a sliding window for a small set of abusive keys and a cheap counter for everyone else, which is a real production pattern."
					},
					{
						q: "How do you choose a strategy at runtime per request?",
						a: "Look it up from a registry keyed by whatever varies — tier, endpoint, region — and cache the instances if construction is not trivial. I keep the lookup out of the strategies themselves so none of them knows the selection rules, and I always define an explicit default rather than letting an unknown key fall through to null."
					},
					{
						q: "Do strategies need to be stateless?",
						a: "Not necessarily, but if one holds mutable state and is shared across requests, it becomes a concurrency problem. A token bucket holding counters per key is exactly that: I would either make the state thread-safe (atomic operations, or a striped lock), or externalise it to Redis so multiple app instances share it."
					}
				]
			}
		],
		related: [
			"/lld/rate-limiter",
			"/playgrounds/rate-limiter",
			"/lld/solid",
			"/lld/command"
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
		minutes: 12,
		tags: [
			"patterns",
			"events",
			"behavioral"
		],
		summary: "The subject keeps a list of interested parties and pokes them when its state changes. UI listeners, stock tickers, cache invalidation and in-process event buses are all observers. Scale it across processes and it becomes pub/sub — same idea, with the failure modes that a network adds.",
		keyPoints: [
			"Decouples 'something happened' from 'here is everyone who cares'.",
			"Push (send the payload) vs pull (send a signal, observer reads) is the first design choice.",
			"Synchronous notification means an observer's exception or slowness becomes the publisher's problem.",
			"Always hand out an unsubscribe handle — leaked listeners are the classic memory leak.",
			"Re-entrancy: an observer that mutates the subject during notification will corrupt your iteration."
		],
		sections: [
			{
				heading: "In-process shape",
				code: {
					title: "Ticker with unsubscribe, snapshot iteration and error isolation",
					lang: "ts",
					source: `type Listener<T> = (event: T) => void;

class Emitter<T> {
  private listeners = new Set<Listener<T>>();

  subscribe(fn: Listener<T>): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);   // hand back the unsubscribe
  }

  emit(event: T) {
    // snapshot: an observer may subscribe/unsubscribe while we notify
    for (const fn of [...this.listeners]) {
      try {
        fn(event);
      } catch (err) {
        logger.error({ err }, "observer threw");  // one bad listener must not
      }                                            // break the others
    }
  }
}

const ticker = new Emitter<Tick>();
const off = ticker.subscribe((t) => chart.push(t));
// later, when the component unmounts:
off();`
				},
				callout: {
					kind: "warn",
					text: "Three bugs live in the naive version: iterating the live collection while a listener unsubscribes, one listener's exception aborting the rest, and no way to unsubscribe at all. The code above fixes all three, and interviewers look for exactly these."
				}
			},
			{
				heading: "Push or pull",
				diagram: {
					kind: "compare",
					caption: "Two ways to shape the notification.",
					options: [{
						title: "Push — send the payload",
						good: [
							"Observer needs no reference back to the subject",
							"Works across a network unchanged",
							"Event is an immutable snapshot; no torn reads"
						],
						bad: ["Subject decides what everyone needs; payloads bloat over time", "Large payloads multiply by the number of observers"],
						verdict: "Default, especially anywhere the observer may be remote."
					}, {
						title: "Pull — send a signal, observer reads",
						good: ["Small notifications; each observer reads only what it uses", "Naturally coalesces bursts — read once after N signals"],
						bad: [
							"Observer must hold a reference to the subject (coupling)",
							"State may have changed again by the time it reads",
							"Racy in a concurrent setting without a version or snapshot"
						],
						verdict: "Big state, cheap local reads — a UI model with an invalidate signal."
					}]
				}
			},
			{
				heading: "Synchronous or asynchronous",
				lede: "The single most consequential choice, and where production incidents come from.",
				body: ["Synchronous notification is simple and ordered: after emit() returns, everyone has seen it. It also means the slowest observer sets your latency, an observer's exception can unwind your transaction, and a re-entrant observer can deadlock you.", "Asynchronous notification (queue the event, notify on another thread or process) protects the publisher, but now you owe answers on ordering, retries, duplicates and back-pressure — the same questions a message queue forces."],
				diagram: {
					kind: "sequence",
					caption: "Async fan-out: the publisher's transaction commits before observers run.",
					actors: [
						{
							id: "svc",
							label: "OrderService"
						},
						{
							id: "db",
							label: "Database"
						},
						{
							id: "bus",
							label: "EventBus",
							sub: "outbox + worker"
						},
						{
							id: "mail",
							label: "EmailObserver"
						},
						{
							id: "stats",
							label: "AnalyticsObserver"
						}
					],
					messages: [
						{
							from: "svc",
							to: "db",
							label: "INSERT order + INSERT outbox row (one tx)",
							kind: "call",
							note: "event is durable exactly when the order is"
						},
						{
							from: "db",
							to: "svc",
							label: "COMMIT",
							kind: "return",
							tone: "ok"
						},
						{
							from: "bus",
							to: "db",
							label: "poll outbox",
							kind: "call"
						},
						{
							from: "bus",
							to: "mail",
							label: "OrderPlaced",
							kind: "async"
						},
						{
							from: "bus",
							to: "stats",
							label: "OrderPlaced",
							kind: "async",
							note: "independent retry per observer"
						},
						{
							from: "mail",
							to: "bus",
							label: "ack",
							kind: "return"
						}
					]
				},
				table: {
					headers: [
						"",
						"Synchronous",
						"Asynchronous"
					],
					rows: [
						[
							"Latency",
							"Publisher waits for every observer",
							"Publisher returns immediately"
						],
						[
							"Failure isolation",
							"Needs try/catch per observer",
							"Natural — separate consumers, separate retries"
						],
						[
							"Ordering",
							"Guaranteed, in subscription order",
							"Only within a partition, if at all"
						],
						[
							"Delivery",
							"Exactly once, in-memory",
							"At least once — observers must be idempotent"
						],
						[
							"Transactions",
							"Can run inside the publisher's tx",
							"Needs an outbox to avoid 'committed but never published'"
						],
						[
							"Debugging",
							"One stack trace",
							"Correlation ids and a trace, or you are guessing"
						]
					]
				}
			},
			{
				heading: "Leaks, storms and ordering",
				bullets: [
					"Listener leaks: a long-lived subject holding a reference to a short-lived observer keeps it alive forever. Return an unsubscribe function, tie it to the component lifecycle, and consider weak references where the language offers them.",
					"Notification storms: a bulk update that emits per row will emit a million events. Batch at the source, or coalesce with a dirty flag and one flush per tick.",
					"Cycles: A notifies B, B updates A, A notifies again. Guard with a re-entrancy flag or make updates queue rather than run inline.",
					"Ordering assumptions: observers that depend on running before another observer are not observers — that is a pipeline, and it should be explicit.",
					"Silent failure: if nobody subscribes, the event vanishes. In production, count published and consumed events per type so a broken subscription is visible."
				],
				code: {
					title: "Re-entrancy guard and coalescing",
					lang: "ts",
					source: `class Model {
  private dirty = false;
  private notifying = false;

  set(patch: Partial<State>) {
    Object.assign(this.state, patch);
    this.dirty = true;
    queueMicrotask(() => this.flush());   // coalesce a burst into one notify
  }

  private flush() {
    if (!this.dirty || this.notifying) return;
    this.dirty = false;
    this.notifying = true;
    try { this.emitter.emit(this.state); } finally { this.notifying = false; }
  }
}`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How does this scale beyond one process?",
						a: "The subject becomes a topic and observers become consumers — Redis pub/sub for fire-and-forget fan-out, Kafka when I need durability, replay and ordered partitions. The design questions change from 'unsubscribe' to 'consumer group, offset, retry, dead-letter', and observers must be idempotent because delivery is at-least-once."
					},
					{
						q: "An observer is slow. What breaks and what do you do?",
						a: "Synchronously, it becomes the publisher's latency and can hold a transaction open. I would move that observer off the hot path: publish to a queue and let it consume at its own pace, with its own retry. If it must stay inline, I would put a timeout and a circuit breaker around it so a hung dependency degrades one feature instead of the request."
					},
					{
						q: "How do you guarantee an event is not lost when the publisher crashes after committing?",
						a: "The transactional outbox: write the event row in the same transaction as the state change, then a relay publishes it and marks it sent. That converts 'two systems must both succeed' into one local transaction plus at-least-once delivery, which consumers handle with idempotency keys."
					},
					{
						q: "Observer vs a plain callback?",
						a: "A callback is one-to-one and usually part of the call's contract. Observer is one-to-many with dynamic registration, and the publisher does not know or care who is listening. If there will only ever be one interested party and it is known at construction, a callback or an injected collaborator is simpler and I would not reach for the pattern."
					}
				]
			}
		],
		related: [
			"/hld/message-queues",
			"/hld/pub-sub",
			"/lld/command",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "command",
		title: "Command Pattern",
		subtitle: "Turn an invocation into an object you can queue, retry, log and undo.",
		level: "intermediate",
		minutes: 12,
		tags: [
			"patterns",
			"behavioral",
			"undo"
		],
		summary: "A command packages a request — the operation plus its arguments plus the receiver — into an object. Once a call is a value, you can put it in a queue, persist it, replay it, batch it, schedule it, and undo it. Editors, job systems, transactional outboxes and CQRS write sides all run on this.",
		keyPoints: [
			"Command = receiver + parameters + execute(). Undo is optional but is the reason most people reach for it.",
			"The invoker (button, scheduler, queue consumer) knows nothing about what the command does.",
			"Undo needs either the inverse operation or the captured prior state — decide which, and know the memory cost.",
			"A persisted command log gives you replay, audit and crash recovery for free.",
			"Do not put business rules in the invoker; the command owns them."
		],
		sections: [
			{
				heading: "Structure",
				diagram: {
					kind: "uml",
					caption: "Invoker holds commands; commands hold receivers.",
					boxes: [
						{
							name: "Command",
							stereotype: "interface",
							tone: "accent",
							members: [{
								name: "execute(): void",
								kind: "method"
							}, {
								name: "undo(): void",
								kind: "method",
								note: "optional"
							}]
						},
						{
							name: "InsertText",
							members: [{
								name: "at: int, text: string",
								kind: "field",
								vis: "-"
							}, {
								name: "execute() / undo()",
								kind: "method",
								note: "undo deletes what it inserted"
							}]
						},
						{
							name: "DeleteRange",
							members: [{
								name: "removed: string",
								kind: "field",
								vis: "-",
								note: "captured for undo"
							}, {
								name: "execute() / undo()",
								kind: "method"
							}]
						},
						{
							name: "CommandHistory",
							tone: "accent",
							members: [
								{
									name: "done: Stack<Command>",
									kind: "field",
									vis: "-"
								},
								{
									name: "undone: Stack<Command>",
									kind: "field",
									vis: "-"
								},
								{
									name: "run(c) / undo() / redo()",
									kind: "method"
								}
							]
						},
						{
							name: "Document",
							stereotype: "class",
							members: [{
								name: "insert / delete",
								kind: "method",
								note: "the receiver"
							}]
						}
					],
					edges: [
						{
							from: "InsertText",
							to: "Command",
							kind: "implements"
						},
						{
							from: "DeleteRange",
							to: "Command",
							kind: "implements"
						},
						{
							from: "CommandHistory",
							to: "Command",
							kind: "has",
							label: "two stacks"
						},
						{
							from: "InsertText",
							to: "Document",
							kind: "uses",
							label: "receiver"
						}
					]
				},
				code: {
					title: "Undo/redo in ~30 lines",
					lang: "ts",
					source: `interface Command { execute(): void; undo(): void; }

class InsertText implements Command {
  constructor(private doc: Document, private at: number, private text: string) {}
  execute() { this.doc.insert(this.at, this.text); }
  undo()    { this.doc.delete(this.at, this.text.length); }
}

class DeleteRange implements Command {
  private removed = "";                      // captured at execute time
  constructor(private doc: Document, private at: number, private len: number) {}
  execute() { this.removed = this.doc.slice(this.at, this.at + this.len);
              this.doc.delete(this.at, this.len); }
  undo()    { this.doc.insert(this.at, this.removed); }
}

class CommandHistory {
  private done: Command[] = [];
  private undone: Command[] = [];

  run(c: Command) { c.execute(); this.done.push(c); this.undone.length = 0; }
  undo() { const c = this.done.pop(); if (c) { c.undo(); this.undone.push(c); } }
  redo() { const c = this.undone.pop(); if (c) { c.execute(); this.done.push(c); } }
}`
				},
				callout: {
					kind: "insight",
					text: "Note the detail in DeleteRange: undo state is captured during execute(), not in the constructor. A command constructed now and executed later must read the world at execution time, or undo restores the wrong thing."
				}
			},
			{
				heading: "Two ways to undo",
				diagram: {
					kind: "compare",
					caption: "Memento (store the state) versus inverse (compute the opposite).",
					options: [{
						title: "Inverse operation",
						sub: "undo computes the opposite",
						good: ["Tiny memory footprint", "Composes well for long histories"],
						bad: ["Not every operation has an inverse (a lossy filter, a truncate)", "Floating-point and non-deterministic ops do not round-trip exactly"],
						verdict: "Structural edits with exact inverses: insert/delete, move, rename."
					}, {
						title: "Memento / snapshot",
						sub: "undo restores captured state",
						good: ["Always works, including for lossy operations", "Simple to reason about and to test"],
						bad: ["Memory grows with document size × history depth", "Snapshotting large state is slow"],
						verdict: "Lossy or complex operations; cap the history, or snapshot only the touched region."
					}]
				},
				bullets: [
					"Hybrid in practice: inverse for cheap structural edits, snapshot for the occasional destructive one, plus a periodic full snapshot so replay never starts from zero.",
					"Bound the history explicitly (say 200 commands or 50 MB) — unbounded undo stacks are a memory leak with a friendly name.",
					"Coalesce keystrokes: 'typed hello' should be one undo step, not five. Merge adjacent compatible commands within a time window."
				]
			},
			{
				heading: "Commands as durable jobs",
				lede: "Once a call is a value, it can outlive the process.",
				body: ["This is where the pattern stops being an editor trick. A serialised command is a job: put it in a table or a queue, and a worker executes it later, on another machine, with retries and a dead-letter path. The type name becomes the routing key; the payload becomes the arguments."],
				code: {
					title: "Serialisable command + handler registry",
					lang: "ts",
					source: `type Job =
  | { type: "SendEmail";  to: string; templateId: string; vars: Json }
  | { type: "ChargeCard"; orderId: string; amountCents: number; idempotencyKey: string }
  | { type: "Reindex";    documentId: string };

const HANDLERS: { [K in Job["type"]]: (job: Extract<Job, { type: K }>) => Promise<void> } = {
  SendEmail:  async (j) => mailer.send(j.to, j.templateId, j.vars),
  ChargeCard: async (j) => payments.charge(j.orderId, j.amountCents, j.idempotencyKey),
  Reindex:    async (j) => search.index(j.documentId),
};

async function work(job: Job, attempt: number) {
  try {
    await HANDLERS[job.type](job as never);
  } catch (err) {
    if (attempt >= 5 || isPermanent(err)) return deadLetter(job, err);
    return requeue(job, backoffMs(attempt));   // 1s, 2s, 4s, 8s + jitter
  }
}`
				},
				callout: {
					kind: "warn",
					text: "A durable command will be delivered more than once — a worker can die after doing the work and before acking. Every handler needs an idempotency key or a natural dedupe, which is why ChargeCard carries one in its payload."
				}
			},
			{
				heading: "Related uses worth naming",
				table: {
					headers: [
						"Use",
						"What the command becomes",
						"What it buys"
					],
					rows: [
						[
							"Undo/redo",
							"Two stacks of commands",
							"Editor semantics with no special-casing per operation"
						],
						[
							"Job queue",
							"A serialised row or message",
							"Retry, backoff, scheduling, crash recovery"
						],
						[
							"Transactional outbox",
							"A command written in the same tx as the state change",
							"No lost events when the process dies after commit"
						],
						[
							"Macro / composite",
							"A command containing commands",
							"Batching and 'undo the whole thing' in one step"
						],
						[
							"Event sourcing",
							"An immutable log of commands' results",
							"Time travel, audit, rebuilding read models"
						],
						[
							"CQRS write side",
							"A command object validated then applied",
							"One explicit place for invariants"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "How would you implement undo in a collaborative editor?",
						a: "Single-user undo stacks break the moment someone else edits: undoing your insert must not delete their text. The usual answer is to make undo an inverse operation that is transformed against everything that happened since (OT) or expressed as a CRDT operation, and to keep a per-user undo stack rather than a global one. I would say up front that this is the hard part and not hand-wave it."
					},
					{
						q: "Command vs a plain function or closure?",
						a: "If it just runs now and nothing needs to inspect it, a function is better. The pattern earns its cost when the invocation must be stored, sent over a wire, retried, inspected for logging or audit, or reversed — closures serialise badly, and a typed payload does not."
					},
					{
						q: "Where do the business rules live?",
						a: "In the command or the receiver, never in the invoker. If a button handler validates the amount, the same rule has to be duplicated in the API and in the job worker. Validate in the command's constructor (rejecting impossible ones outright) and enforce invariants in the receiver aggregate."
					},
					{
						q: "How do you cap memory on undo history?",
						a: "Bound it by both count and estimated bytes, drop from the bottom, and take a full snapshot before dropping so the oldest reachable state is still correct. For big documents I keep snapshots every N commands and store inverses between them — the same trick as a database checkpoint plus WAL."
					}
				]
			}
		],
		related: [
			"/lld/observer",
			"/hld/message-queues",
			"/hld/idempotency",
			"/lld/strategy"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var lldStructuralPatterns = [
	{
		slug: "decorator",
		title: "Decorator Pattern",
		subtitle: "Add behaviour by wrapping, not by subclassing.",
		level: "foundational",
		minutes: 11,
		tags: [
			"patterns",
			"structural",
			"resilience"
		],
		summary: "A decorator implements the same interface as the thing it wraps and adds behaviour around the delegated call. It is how retry, caching, metrics, logging, rate limiting and authorisation get composed onto a client without any of them knowing about the others — and it is the pattern most visible in real production code.",
		keyPoints: [
			"Same interface in, same interface out. That is what makes decorators stackable in any order.",
			"It replaces the subclass explosion you would get from combining N optional behaviours.",
			"Order matters and is a design decision: retry-outside-cache and cache-outside-retry behave differently.",
			"Keep each decorator single-purpose; a 'RetryAndCacheAndLog' wrapper defeats the point.",
			"Costs: deep stack traces, harder debugging, and the risk that a decorator changes semantics silently."
		],
		prerequisites: ["/lld/solid"],
		sections: [
			{
				heading: "Why not subclasses",
				body: ["With three optional behaviours you would need seven subclasses to cover every combination, and adding a fourth doubles it. Decorators turn that combinatorial problem into linear composition: N behaviours, N classes, any stacking order."],
				diagram: {
					kind: "flow",
					caption: "Each layer implements PaymentGateway and delegates inward.",
					rows: [[
						{
							id: "call",
							label: "Use case",
							sub: "sees one PaymentGateway",
							tone: "accent"
						},
						{
							id: "m",
							label: "WithMetrics",
							sub: "timing, counters"
						},
						{
							id: "r",
							label: "WithRetry",
							sub: "3 attempts, backoff"
						},
						{
							id: "cb",
							label: "WithCircuitBreaker",
							sub: "trip on 50% errors",
							tone: "warn"
						},
						{
							id: "s",
							label: "StripeGateway",
							sub: "the real call"
						}
					]]
				},
				code: {
					title: "Three decorators over one interface",
					lang: "ts",
					source: `interface PaymentGateway {
  charge(card: Card, amount: Money, key: IdempotencyKey): Promise<Receipt>;
}

class WithRetry implements PaymentGateway {
  constructor(private inner: PaymentGateway, private attempts = 3) {}
  async charge(card: Card, amount: Money, key: IdempotencyKey) {
    let lastErr: unknown;
    for (let i = 0; i < this.attempts; i++) {
      try { return await this.inner.charge(card, amount, key); }  // same key: safe to retry
      catch (err) {
        if (!isTransient(err)) throw err;      // never retry a declined card
        lastErr = err;
        await sleep(backoffWithJitter(i));
      }
    }
    throw lastErr;
  }
}

class WithMetrics implements PaymentGateway {
  constructor(private inner: PaymentGateway, private m: Metrics) {}
  async charge(...args: Parameters<PaymentGateway["charge"]>) {
    const stop = this.m.timer("payments.charge");
    try { const r = await this.inner.charge(...args); this.m.inc("payments.ok"); return r; }
    catch (e) { this.m.inc("payments.err", { type: errorClass(e) }); throw e; }
    finally { stop(); }
  }
}

// composition root — read it outside-in
const payments: PaymentGateway =
  new WithMetrics(
    new WithRetry(
      new WithCircuitBreaker(new StripeGateway(key), { threshold: 0.5 }),
    ),
    metrics);`
				}
			},
			{
				heading: "Order is a design decision",
				lede: "The same three decorators in two orders are two different systems.",
				table: {
					headers: [
						"Stacking",
						"Behaviour",
						"Usually right when"
					],
					rows: [
						[
							"Retry outside cache",
							"A cache miss that fails is retried, and the retry may hit the cache",
							"The cache is a cheap local optimisation"
						],
						[
							"Cache outside retry",
							"Cached values are returned without ever entering retry logic",
							"The expensive thing is the call; you want zero calls on a hit"
						],
						[
							"Circuit breaker inside retry",
							"Retries are counted by the breaker and can trip it faster",
							"You want a failing dependency to open the circuit quickly"
						],
						[
							"Circuit breaker outside retry",
							"The breaker sees one logical operation, not three attempts",
							"Retries are an implementation detail you do not want to over-count"
						],
						[
							"Metrics outermost",
							"Timing includes retries and cache hits — true end-to-end latency",
							"Almost always; put a second metrics layer inside if you need both"
						]
					]
				},
				callout: {
					kind: "interview",
					text: "Volunteering that order matters, and giving one concrete pair, is a strong senior signal. Most candidates draw the stack and never mention that it is ordered."
				}
			},
			{
				heading: "The rules that keep it honest",
				bullets: [
					"A decorator must not change the interface's contract. If WithCache can return stale data, staleness has to be part of the contract or callers will be wrong.",
					"It must be transparent to type checks: callers holding the interface must never need instanceof to find the inner object.",
					"One responsibility per decorator. If two behaviours must coordinate (retry counting into the breaker), that coupling belongs in one class, deliberately.",
					"Preserve error types. A decorator that wraps every error in its own class destroys the caller's ability to distinguish transient from permanent.",
					"Keep them cheap. A decorator on a hot inner loop adds an allocation and an indirect call per invocation."
				],
				code: {
					title: "Function decorators — the same pattern without classes",
					lang: "ts",
					source: `type Handler = (req: Request) => Promise<Response>;

const withAuth = (h: Handler): Handler => async (req) => {
  const user = await verify(req.headers.authorization);
  if (!user) return unauthorized();
  return h({ ...req, user });
};

const withTiming = (name: string) => (h: Handler): Handler => async (req) => {
  const t0 = performance.now();
  try { return await h(req); }
  finally { metrics.observe(name, performance.now() - t0); }
};

// This is what "middleware" is: decorators over a Handler interface.
const handler = withTiming("orders.create")(withAuth(createOrder));`
				}
			},
			{
				heading: "Decorator vs proxy vs adapter vs middleware",
				table: {
					headers: [
						"Pattern",
						"Interface",
						"Intent"
					],
					rows: [
						[
							"Decorator",
							"Same as wrapped",
							"Add behaviour; designed to stack"
						],
						[
							"Proxy",
							"Same as wrapped",
							"Control access: lazy load, remote call, permission check"
						],
						[
							"Adapter",
							"Different from wrapped",
							"Make an incompatible interface fit"
						],
						[
							"Facade",
							"New, simpler",
							"Hide a subsystem behind one entry point"
						],
						[
							"Middleware",
							"Same as wrapped (a handler)",
							"Decorator applied to a request pipeline"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Retry as a decorator — what has to be true?",
						a: "The operation must be idempotent, or carry an idempotency key so the server can dedupe. Retrying a non-idempotent charge is how you double-bill someone. I also only retry transient failures — timeouts, 5xx, connection resets — never a 400 or a declined card, and I add jitter so a downstream outage does not produce a synchronised retry storm."
					},
					{
						q: "How do you debug a five-deep decorator stack?",
						a: "Name each layer and put the name in log context and in span names, so a trace shows which layer added the latency. I also keep a way to construct the bare inner object in tests. The honest downside is stack traces get noisy, which is a real cost of the pattern and worth stating."
					},
					{
						q: "Where does authorization belong — decorator or inside?",
						a: "A coarse check (is this caller authenticated, does it have the scope) works well as a decorator. Fine-grained rules that depend on the object's own state — 'you may cancel your own order, but only before it ships' — belong inside the domain, because the decorator would have to load and understand the aggregate to decide, and then it is not a cross-cutting concern any more."
					}
				]
			}
		],
		related: [
			"/lld/proxy",
			"/lld/adapter",
			"/hld/circuit-breaker",
			"/lld/dependency-injection"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "adapter",
		title: "Adapter Pattern",
		subtitle: "Make a useful thing fit an interface it was never designed for.",
		level: "foundational",
		minutes: 10,
		tags: [
			"patterns",
			"structural",
			"integration"
		],
		summary: "An adapter translates between the interface your code wants and the interface a library or legacy system offers. It is the pattern that keeps a third-party SDK from spreading through your domain, and it is the single most common way to make a codebase survive a vendor change.",
		keyPoints: [
			"Your code owns the target interface, expressed in your domain's language. The adapter implements it.",
			"Translate the vocabulary too: their PaymentIntentStatus becomes your ChargeResult, their errors become your typed errors.",
			"One adapter per external system, living at the edge — never imported by the domain.",
			"Adapters are where you handle units, time zones, pagination and null-vs-missing mismatches.",
			"The anti-corruption layer is the same idea at subsystem scale."
		],
		sections: [
			{
				heading: "The shape",
				diagram: {
					kind: "uml",
					caption: "The domain never sees Stripe types.",
					boxes: [
						{
							name: "PaymentGateway",
							stereotype: "interface",
							tone: "accent",
							members: [{
								name: "charge(card, money, key): Receipt",
								kind: "method"
							}, {
								name: "refund(receiptId, money): Refund",
								kind: "method"
							}]
						},
						{
							name: "StripeAdapter",
							members: [{
								name: "sdk: Stripe",
								kind: "field",
								vis: "-"
							}, {
								name: "charge(...)",
								kind: "method",
								note: "maps Money → cents, errors → domain errors"
							}]
						},
						{
							name: "AdyenAdapter",
							members: [{
								name: "charge(...)",
								kind: "method",
								note: "different SDK, same contract"
							}]
						},
						{
							name: "Stripe SDK",
							stereotype: "class",
							tone: "warn",
							members: [{
								name: "paymentIntents.create(...)",
								kind: "method",
								note: "amount in minor units, throws StripeError"
							}]
						}
					],
					edges: [
						{
							from: "StripeAdapter",
							to: "PaymentGateway",
							kind: "implements"
						},
						{
							from: "AdyenAdapter",
							to: "PaymentGateway",
							kind: "implements"
						},
						{
							from: "StripeAdapter",
							to: "Stripe SDK",
							kind: "has",
							label: "the adaptee"
						}
					]
				},
				code: {
					title: "What a good adapter actually does",
					lang: "ts",
					source: `export class StripeAdapter implements PaymentGateway {
  constructor(private sdk: Stripe) {}

  async charge(card: Card, amount: Money, key: IdempotencyKey): Promise<Receipt> {
    try {
      const intent = await this.sdk.paymentIntents.create(
        {
          amount: amount.minorUnits(),          // unit translation
          currency: amount.currency.toLowerCase(),
          payment_method: card.token,
          confirm: true,
        },
        { idempotencyKey: key },                // their mechanism, our concept
      );
      return new Receipt({
        id: intent.id,
        capturedAt: new Date(intent.created * 1000),   // seconds → Date
        amount,
      });
    } catch (err) {
      throw toDomainError(err);                 // vocabulary translation
    }
  }
}

function toDomainError(err: unknown): DomainError {
  if (isStripeError(err)) {
    switch (err.code) {
      case "card_declined":       return new CardDeclined(err.decline_code);
      case "rate_limit":          return new TransientFailure(err.message);
      case "idempotency_key_in_use": return new DuplicateRequest();
      default:                    return new PaymentFailed(err.message);
    }
  }
  if (isTimeout(err)) return new TransientFailure("timeout");
  return new PaymentFailed(String(err));
}`
				},
				callout: {
					kind: "insight",
					text: "The error mapping is the part that pays for the adapter. Without it, a retry decorator upstream cannot tell 'card declined' (never retry) from 'rate limited' (retry with backoff) without importing Stripe's types — and the coupling you were avoiding is back."
				}
			},
			{
				heading: "Mismatches an adapter absorbs",
				table: {
					headers: [
						"Mismatch",
						"Example",
						"Adapter's job"
					],
					rows: [
						[
							"Units",
							"Money vs integer cents vs float dollars",
							"Convert once, at the boundary, with tests"
						],
						[
							"Time",
							"Unix seconds, ISO strings, local time",
							"Normalise to one type in one time zone (UTC)"
						],
						[
							"Errors",
							"Exceptions vs error codes vs null returns",
							"Map to typed domain errors, preserving transient/permanent"
						],
						[
							"Iteration",
							"Cursor pagination vs page numbers vs streams",
							"Expose one async iterator; hide the paging"
						],
						[
							"Nullability",
							"Missing vs null vs empty string",
							"Decide the domain meaning and make it explicit"
						],
						[
							"Identity",
							"Their id format vs yours",
							"Keep both; store the external id for reconciliation"
						]
					]
				}
			},
			{
				heading: "Two-way adapters and the legacy case",
				body: ["Sometimes both sides are yours: a new service must speak to a legacy system whose model is wrong for the new domain. The adapter grows into an anti-corruption layer — a module whose whole job is to keep the legacy model from leaking into the new one, translating both requests and responses.", "The discipline is the same: the new domain owns its interfaces, and every legacy concept is translated at exactly one place. When the legacy system is finally retired, you delete one directory."],
				diagram: {
					kind: "layers",
					caption: "Anti-corruption layer: the only place that speaks both dialects.",
					layers: [
						{
							title: "New domain",
							items: [
								"Subscription",
								"Plan",
								"BillingCycle",
								"SubscriptionRepository (port)"
							]
						},
						{
							title: "Anti-corruption layer",
							items: [
								"LegacyBillingAdapter",
								"SUB_REC → Subscription",
								"status char → enum",
								"COBOL date → Instant"
							]
						},
						{
							title: "Legacy system",
							items: [
								"SOAP endpoint",
								"SUB_REC fixed-width record",
								"status: 'A' | 'S' | 'X'"
							]
						}
					]
				},
				code: {
					title: "Object adapter vs class adapter",
					lang: "ts",
					source: `// Object adapter (composition) — the normal choice.
class LegacyBillingAdapter implements SubscriptionGateway {
  constructor(private soap: LegacyClient) {}
  async find(id: SubscriptionId) {
    const rec = await this.soap.getSubRec(id.toString());
    return new Subscription({
      id,
      status: STATUS[rec.STAT] ?? "unknown",       // 'A' -> "active"
      renewsAt: fromCobolDate(rec.NEXT_BILL_DT),
    });
  }
}

// Class adapter (inheritance) — only in languages with multiple inheritance,
// and it welds you to the adaptee's class. Rarely worth it.`
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Isn't this just extra code around an SDK?",
						a: "It is extra code, and it buys three things: the domain compiles without the vendor's types, tests run against a fake with no network, and a vendor change is one class instead of a grep across the codebase. If the integration is trivial and genuinely throwaway I would skip it — but for anything a business depends on, like payments or identity, I would not."
					},
					{
						q: "How do you test an adapter?",
						a: "Two layers. Contract tests against the real sandbox, run on a schedule rather than every commit, to catch the vendor changing behaviour. And unit tests over recorded responses for the mapping logic — especially the error mapping and the odd units. The fake used by the rest of the test suite must pass the same contract test as the real adapter, or it will drift."
					},
					{
						q: "Where do you draw the line between adapter and decorator?",
						a: "Adapter changes the interface; decorator keeps it. In a real stack they compose: the adapter makes Stripe look like PaymentGateway, and then retry, metrics and circuit-breaker decorators wrap that. If I find an 'adapter' that also retries, I split it — the mapping and the resilience policy change for different reasons."
					}
				]
			}
		],
		related: [
			"/lld/decorator",
			"/lld/proxy",
			"/lld/repository",
			"/lld/solid"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "proxy",
		title: "Proxy Pattern",
		subtitle: "Same interface, but something happens before the real object does.",
		level: "intermediate",
		minutes: 11,
		tags: [
			"patterns",
			"structural",
			"performance"
		],
		summary: "A proxy stands in for another object with the identical interface and controls access to it: creating it lazily, calling it over a network, checking permissions, or serving a cached answer. Structurally it is a decorator; the difference is intent — a decorator adds behaviour, a proxy governs access.",
		keyPoints: [
			"Four classic kinds: virtual (lazy), remote (network), protection (authorisation), caching.",
			"The caller must not be able to tell. That is what makes lazy loading and remote calls transparent.",
			"Transparency is also the danger: a property access that silently does IO is how N+1 queries happen.",
			"Remote proxies must expose latency and failure somehow — a synchronous signature that can hang for 30s is a lie.",
			"In practice you meet proxies as ORM lazy collections, RPC stubs, service meshes and API gateways."
		],
		sections: [
			{
				heading: "Four kinds, one structure",
				table: {
					headers: [
						"Kind",
						"Controls",
						"Real-world example",
						"The trap"
					],
					rows: [
						[
							"Virtual",
							"When the expensive object is created",
							"ORM lazy collection; image thumbnail loaded on scroll",
							"Silent IO inside a getter; N+1 queries"
						],
						[
							"Remote",
							"Where the object lives",
							"gRPC stub, RPC client, service mesh sidecar",
							"Local-looking call with network failure modes"
						],
						[
							"Protection",
							"Who may call",
							"API gateway auth, row-level security wrapper",
							"Checks scattered instead of centralised; bypass paths"
						],
						[
							"Caching",
							"Whether the real call happens at all",
							"HTTP cache, memoised repository",
							"Stale reads, unbounded memory, thundering herd on expiry"
						]
					]
				}
			},
			{
				heading: "Virtual proxy: laziness that does not lie",
				code: {
					title: "Lazy load with single-flight, so ten callers cause one query",
					lang: "ts",
					source: `class LazyOrderLines implements OrderLines {
  private loaded?: Line[];
  private inflight?: Promise<Line[]>;

  constructor(private orderId: OrderId, private repo: LineRepository) {}

  async all(): Promise<Line[]> {
    if (this.loaded) return this.loaded;
    // single-flight: concurrent callers share one query
    this.inflight ??= this.repo.byOrder(this.orderId).then((rows) => {
      this.loaded = rows;
      this.inflight = undefined;
      return rows;
    });
    return this.inflight;
  }
}`
				},
				callout: {
					kind: "warn",
					text: "Notice the signature is async. A lazy proxy behind a synchronous getter cannot do IO honestly — it either blocks a thread or returns a promise-shaped surprise. Make laziness visible in the type, and batch loads (a dataloader) when you are fetching for many parents."
				},
				diagram: {
					kind: "sequence",
					caption: "The N+1 problem a virtual proxy creates, and the batch that fixes it.",
					actors: [
						{
							id: "v",
							label: "View"
						},
						{
							id: "p",
							label: "LazyLines",
							sub: "proxy per order"
						},
						{
							id: "dl",
							label: "DataLoader",
							sub: "batches per tick"
						},
						{
							id: "db",
							label: "Database"
						}
					],
					messages: [
						{
							from: "v",
							to: "p",
							label: "order[1..50].lines.all()",
							kind: "call",
							note: "50 proxies, 50 calls"
						},
						{
							from: "p",
							to: "dl",
							label: "load(orderId) × 50",
							kind: "call"
						},
						{
							from: "dl",
							to: "db",
							label: "SELECT * FROM lines WHERE order_id = ANY($1)",
							kind: "call",
							tone: "ok",
							note: "one query, not fifty"
						},
						{
							from: "db",
							to: "dl",
							label: "rows",
							kind: "return"
						},
						{
							from: "dl",
							to: "p",
							label: "resolve each promise",
							kind: "return"
						}
					]
				}
			},
			{
				heading: "Protection proxy: authorisation at the boundary",
				code: {
					title: "Coarse checks belong here; object-level rules do not",
					lang: "ts",
					source: `class AuthorizedDocuments implements DocumentService {
  constructor(private inner: DocumentService, private policy: Policy) {}

  async read(id: DocId, actor: Actor) {
    if (!this.policy.can(actor, "documents:read")) throw new Forbidden();
    const doc = await this.inner.read(id, actor);
    // object-level rule needs the object, so it lives with the object:
    if (!doc.visibleTo(actor)) throw new NotFound();   // NOT Forbidden — do not leak existence
    return doc;
  }
}`
				},
				bullets: [
					"Return 404, not 403, when revealing that a resource exists is itself a leak.",
					"Centralise the coarse scope check so there is one code path to audit — that is the proxy's value.",
					"If every method needs the loaded object to decide, the check belongs in the domain and the proxy is the wrong place.",
					"Make the proxy impossible to bypass: the composition root should be the only place that can construct the unwrapped service."
				]
			},
			{
				heading: "Remote proxy: the local call that is not",
				body: ["An RPC stub is a proxy that makes a network call look like a method call. This is enormously convenient and is also the single biggest source of distributed-systems surprise: partial failure, retries, timeouts and serialisation costs all hide behind a signature that looks local."],
				bullets: [
					"Every remote proxy needs an explicit timeout. A call with no deadline will eventually hold a thread forever.",
					"Failures are not just 'the object threw' — a timeout means you do not know whether it ran. Idempotency keys turn that unknown into a safe retry.",
					"Chattiness is the design flaw laziness invites: ten property reads over a proxy is ten round trips. Design coarse-grained remote interfaces.",
					"Serialisation is part of the contract; adding a field to a returned object is a wire change, not a refactor."
				],
				callout: {
					kind: "interview",
					text: "'A remote proxy makes a distributed call look local, which is convenient and dishonest' is a sentence worth saying — it shows you know the fallacies of distributed computing without reciting them."
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Proxy or decorator — how do you decide what you have built?",
						a: "By intent. If the wrapper's job is to add a capability the caller wants — metrics, retries, logging — it is a decorator and it stacks. If its job is to stand between the caller and the object and decide whether, when, or where the real call happens, it is a proxy. Structurally they are identical, and I would not spend interview time arguing the label."
					},
					{
						q: "How do you avoid N+1 with lazy loading?",
						a: "Batch at the boundary with a dataloader that collects keys within a tick and issues one query with an ANY/IN clause, or load eagerly when I know the access pattern. Either way I put a query counter in tests around the hot endpoints, because N+1 is invisible in code review and obvious in a counter."
					},
					{
						q: "A caching proxy — what do you need to specify?",
						a: "Key (including anything that varies the result, like the actor), TTL, maximum size with an eviction policy, and behaviour on a miss storm — single-flight so one expiry does not send a thousand requests downstream. And I would state whether stale reads are acceptable, because that is a product decision, not an implementation detail."
					}
				]
			}
		],
		related: [
			"/lld/decorator",
			"/lld/lru-cache",
			"/hld/caching",
			"/hld/api-gateway"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var lldPrinciples = [
	{
		slug: "solid",
		title: "SOLID Principles",
		subtitle: "Five constraints that keep an object design changeable.",
		level: "foundational",
		minutes: 16,
		tags: ["oop", "principles"],
		summary: "A low-level design interview is not a test of whether you can draw twenty classes. It is a test of whether the twentieth requirement can be added without rewriting the first nineteen. SOLID is the vocabulary for that property, and every one of the five letters is really the same idea seen from a different angle: put the thing that changes behind a seam, and depend on the seam.",
		keyPoints: [
			"SRP: one reason to change per class. If you cannot describe a class without 'and', split it.",
			"OCP: new behaviour arrives as a new class, not as a new branch in an old switch.",
			"LSP: a subtype must be usable through the parent's contract without the caller checking its type.",
			"ISP: clients depend on the narrow interface they actually call, not the fat one you happened to write.",
			"DIP: policy owns the interface; details implement it. The arrow of dependency points at the abstraction."
		],
		sections: [
			{
				heading: "Why these five, and not fifty",
				lede: "Each principle protects a different joint in the design.",
				body: ["Software gets hard to change for a small number of repeatable reasons. A class accumulates unrelated jobs until every change touches it. A conditional grows a new branch for every new case. A subclass quietly breaks a promise its parent made. An interface grows until implementers write stubs. A domain rule reaches out and touches a database driver directly. SOLID names one antidote for each.", "The practical test is not 'did I obey the letters' but 'when the next requirement lands, how many files do I open, and do I have to understand them all?' A good design answers: one new file, and no."],
				table: {
					headers: [
						"",
						"Means",
						"The smell when it is missing",
						"The fix"
					],
					rows: [
						[
							"S — Single responsibility",
							"One reason to change per class",
							"A 900-line service mixing HTTP parsing, business rules and SQL",
							"Split along the axes of change: transport, policy, persistence"
						],
						[
							"O — Open/closed",
							"Extend by adding types, not editing old ones",
							"switch (type) that grows a case per release",
							"Strategy, or a registry keyed by type"
						],
						[
							"L — Liskov substitution",
							"Subtypes honour the parent's contract",
							"Overrides that throw UnsupportedOperation, or callers doing instanceof",
							"Model the real hierarchy, or use composition instead of inheritance"
						],
						[
							"I — Interface segregation",
							"Clients depend on slim surfaces",
							"Implementers full of empty methods, mocks with 14 stubs",
							"Split the fat interface by client, not by data"
						],
						[
							"D — Dependency inversion",
							"Policy defines the interface, details implement it",
							"new PostgresRepo() inside a domain service; tests need a database",
							"Inject the abstraction, own it in the domain layer"
						]
					]
				}
			},
			{
				heading: "S — Single responsibility, concretely",
				lede: "Split along axes of change, not along nouns.",
				body: ["The common misreading is 'a class should do one thing', which leads to a swarm of one-method classes. The useful reading is Parnas': a module should have one reason to change — one stakeholder, one policy, one rate of change. Report formatting changes when marketing changes its mind; report arithmetic changes when finance does. Two stakeholders, two classes.", "The tell in an interview is when you describe a class and need the word 'and'. 'OrderService validates the cart and charges the card and writes the invoice and emails the customer.' That is four reasons to change, four reasons for a merge conflict, and a test that needs four fakes."],
				code: [{
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
}`
				}, {
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
}`
				}],
				callout: {
					kind: "insight",
					text: "Notice what the split bought: the notification became an event subscriber, so adding SMS later is a new subscriber class and zero edits to PlaceOrder. SRP is what makes OCP possible."
				}
			},
			{
				heading: "O — Open/closed, and the switch that grows",
				lede: "Every 'add a case here' request is a design telling you where the seam belongs.",
				body: ["Open/closed does not mean you never edit code. It means the code you edit is small and predictable: you add a class and register it, rather than reopening a well-tested algorithm and threading a new branch through it.", "The heuristic: if you can predict the shape of the next requirement ('another payment method', 'another rate-limit algorithm', 'another export format'), put that axis behind an interface now. If you cannot predict it, do not — speculative abstraction costs more than the switch would."],
				diagram: {
					kind: "uml",
					caption: "Pricing stays closed; new fare rules arrive as new classes.",
					boxes: [
						{
							name: "FarePolicy",
							stereotype: "interface",
							tone: "accent",
							members: [{
								name: "fare(trip: Trip): Money",
								kind: "method"
							}]
						},
						{
							name: "StandardFare",
							members: [{
								name: "fare(trip)",
								kind: "method",
								note: "base + per-km"
							}]
						},
						{
							name: "SurgeFare",
							members: [{
								name: "fare(trip)",
								kind: "method",
								note: "multiplier by demand"
							}]
						},
						{
							name: "AirportFare",
							members: [{
								name: "fare(trip)",
								kind: "method",
								note: "flat + toll"
							}]
						},
						{
							name: "PricingService",
							members: [{
								name: "policy: FarePolicy",
								kind: "field",
								vis: "-"
							}, {
								name: "quote(trip): Money",
								kind: "method"
							}]
						}
					],
					edges: [
						{
							from: "StandardFare",
							to: "FarePolicy",
							kind: "implements"
						},
						{
							from: "SurgeFare",
							to: "FarePolicy",
							kind: "implements"
						},
						{
							from: "AirportFare",
							to: "FarePolicy",
							kind: "implements"
						},
						{
							from: "PricingService",
							to: "FarePolicy",
							kind: "has",
							label: "injected, never constructed"
						}
					]
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
}`
				}
			},
			{
				heading: "L — Liskov, beyond square-and-rectangle",
				lede: "The contract includes preconditions, postconditions and invariants — not just method names.",
				body: ["A subtype substitutes safely when it weakens no precondition, breaks no postcondition, and preserves every invariant the parent promised. The compiler checks the signature; only you can check the promise.", "The classic failure is not Square/Rectangle but the collection that throws. ImmutableList extends List and throws on add(). Every caller that holds a List must now either avoid add() or catch — which means List's contract was a lie, and the type system stopped helping."],
				table: {
					headers: [
						"Violation",
						"What breaks",
						"Better model"
					],
					rows: [
						[
							"ReadOnlyList.add() throws",
							"Callers must know the concrete type",
							"Separate ReadableList and MutableList interfaces (this is also ISP)"
						],
						[
							"Penguin extends Bird with fly()",
							"fly() has no sane implementation",
							"Bird has no fly(); FlyingBird does"
						],
						[
							"SavingsAccount tightens withdraw() to reject below minimum",
							"A precondition got stronger, so code written against Account fails",
							"Return a Result/violation object rather than throwing new kinds of error"
						],
						[
							"Subclass caches and returns stale reads",
							"Postcondition 'returns current value' broken",
							"Make staleness explicit in the interface (getCached vs get)"
						]
					]
				},
				callout: {
					kind: "interview",
					text: "If you find yourself writing instanceof or a type tag to decide what to do with a subtype, say so out loud and fix it — that check is the runtime paying for a broken Liskov promise, and interviewers listen for it."
				}
			},
			{
				heading: "I and D — the two that show up in every design",
				lede: "Slim interfaces owned by the caller's layer.",
				body: ["Interface segregation says: split the interface by who calls it. A Printer/Scanner/Fax combo device should not force a plain printer to implement scan(). In practice, the fat interface usually appears because someone modelled the device instead of the use cases.", "Dependency inversion is the one that changes your architecture. The domain layer declares OrderRepository — an interface expressed in domain nouns, owned by the domain package. The infrastructure layer implements PostgresOrderRepository. Compile-time dependency now points inward, and the domain can be tested with an in-memory implementation in microseconds."],
				diagram: {
					kind: "flow",
					caption: "DIP: the arrow that would have pointed out to the driver now points in at the interface.",
					rows: [[{
						id: "uc",
						label: "PlaceOrder",
						sub: "use case",
						tone: "accent"
					}, {
						id: "port",
						label: "OrderRepository",
						sub: "interface, owned by domain",
						tone: "accent"
					}], [{
						id: "pg",
						label: "PostgresOrderRepository",
						sub: "infrastructure"
					}, {
						id: "mem",
						label: "InMemoryOrderRepository",
						sub: "tests",
						tone: "ok"
					}]]
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
}`
				}
			},
			{
				heading: "Where SOLID stops helping",
				lede: "The principles have costs, and a senior answer names them.",
				bullets: [
					"Every seam is indirection. Five interfaces with one implementation each is not a design, it is a maze — apply the seam when the second implementation is real or clearly imminent.",
					"SRP taken literally produces anaemic classes and a service layer that does all the thinking. Keep behaviour next to the data it guards.",
					"DIP has a floor: something has to construct the concrete classes. That job belongs in one composition root at the edge of the process, not scattered through the code.",
					"Performance-critical inner loops sometimes want the switch: a megamorphic virtual call in a hot path is a real cost. Measure before you abstract there."
				],
				takeaways: [
					"Name the axis of change before you add an interface — that is what tells you whether the seam is worth it.",
					"SRP enables OCP; ISP is how you keep DIP's interfaces honest. They are one idea, applied at four scales.",
					"In an interview, say the principle by its effect ('adding a fare rule is a new class') rather than by its letter."
				]
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Can you over-apply SOLID?",
						a: "Easily. The cost is indirection: to read one behaviour you open four files. I apply a seam when I can name the second implementation, when the axis of change is confirmed by a real requirement, or when the dependency is slow or non-deterministic (network, clock, randomness) and I need it out of the way for tests. Otherwise I keep it concrete and refactor when the second case arrives — that refactor is cheap if the class was small."
					},
					{
						q: "How is dependency inversion different from dependency injection?",
						a: "Inversion is about who owns the interface: the high-level policy declares it, so the compile-time arrow points inward. Injection is just the mechanic for handing an implementation in through the constructor. You can inject a concrete Postgres class and get injection with no inversion at all — which is the common mistake."
					},
					{
						q: "Give me an SRP violation you would deliberately leave in.",
						a: "A small entity that both holds state and serialises itself, in a service with one output format. The 'toJSON on the entity' split buys nothing until there is a second representation. I would flag it and set the trigger: the day a second format or a public API version appears, extract a presenter."
					},
					{
						q: "How do you test that Liskov holds?",
						a: "Write the test suite against the interface, not the implementation, and run the same suite for every implementation — a contract test. If InMemoryRepo and PostgresRepo both pass identical tests, substitution is real; the moment one needs a special case, the abstraction is leaking."
					}
				]
			}
		],
		related: [
			"/lld/strategy",
			"/lld/dependency-injection",
			"/lld/repository",
			"/lld/uml"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}, {
			label: "awesome-system-design-resources",
			href: "https://github.com/ashishps1/awesome-system-design-resources"
		}]
	},
	{
		slug: "uml",
		title: "UML for Interviews",
		subtitle: "The five diagrams worth drawing, and the notation that carries meaning.",
		level: "foundational",
		minutes: 12,
		tags: [
			"uml",
			"modeling",
			"communication"
		],
		summary: "Nobody will ask you to produce a conforming UML 2.5 document. But in a 45-minute LLD round you will draw boxes on a whiteboard, and the difference between a candidate who draws a class diagram and one who draws 'some boxes' is whether the arrows mean anything. Five notations do all the work.",
		keyPoints: [
			"Class diagram answers 'what exists and who owns whom'; sequence diagram answers 'what happens, in what order'.",
			"Arrow types carry information: hollow triangle = is-a, filled diamond = owns-lifecycle, plain arrow = uses.",
			"Multiplicity (1, 0..1, 1..*) on associations catches design bugs before code does.",
			"State diagrams are the fastest way to expose the illegal transitions in an order/booking/elevator problem.",
			"Draw the class diagram second — after the API surface — or you will model nouns nobody calls."
		],
		sections: [
			{
				heading: "The five diagrams and when each one earns its place",
				table: {
					headers: [
						"Diagram",
						"Answers",
						"Reach for it when"
					],
					rows: [
						[
							"Class",
							"What types exist, what they own, what they implement",
							"Always, in an LLD round — it is the backbone"
						],
						[
							"Sequence",
							"Who calls whom, in what order, and where the wait is",
							"A flow crosses 3+ objects, or concurrency matters"
						],
						[
							"State",
							"Which transitions are legal",
							"Anything with a lifecycle: order, booking, elevator, job"
						],
						[
							"Activity / flowchart",
							"Branching business logic",
							"A decision tree the interviewer keeps probing"
						],
						[
							"Component / deployment",
							"Process and machine boundaries",
							"The LLD question is drifting into HLD"
						]
					]
				}
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
					"Multiplicity at each end: ParkingLot 1 —— 1..* Floor. Write it; it is where off-by-one design errors surface."
				],
				diagram: {
					kind: "uml",
					caption: "A parking-lot slice: composition for floors and spots, interface for the fee rule.",
					boxes: [
						{
							name: "ParkingLot",
							tone: "accent",
							members: [
								{
									name: "floors: List<Floor>",
									kind: "field",
									vis: "-",
									note: "1..*, composition"
								},
								{
									name: "park(vehicle): Ticket",
									kind: "method"
								},
								{
									name: "unpark(ticket): Fee",
									kind: "method"
								}
							]
						},
						{
							name: "Floor",
							members: [{
								name: "spots: List<Spot>",
								kind: "field",
								vis: "-"
							}, {
								name: "findFree(size): Spot?",
								kind: "method"
							}]
						},
						{
							name: "Spot",
							members: [{
								name: "size: SpotSize",
								kind: "field",
								vis: "-"
							}, {
								name: "occupiedBy: Vehicle?",
								kind: "field",
								vis: "-"
							}]
						},
						{
							name: "FeeStrategy",
							stereotype: "interface",
							tone: "accent",
							members: [{
								name: "fee(ticket, now): Money",
								kind: "method"
							}]
						},
						{
							name: "HourlyFee",
							members: [{
								name: "fee(ticket, now)",
								kind: "method"
							}]
						},
						{
							name: "SpotSize",
							stereotype: "enum",
							members: [
								{
									name: "MOTORCYCLE",
									kind: "field",
									vis: "+"
								},
								{
									name: "COMPACT",
									kind: "field",
									vis: "+"
								},
								{
									name: "LARGE",
									kind: "field",
									vis: "+"
								}
							]
						}
					],
					edges: [
						{
							from: "ParkingLot",
							to: "Floor",
							kind: "has",
							label: "composition 1 → 1..*"
						},
						{
							from: "Floor",
							to: "Spot",
							kind: "has",
							label: "composition 1 → 1..*"
						},
						{
							from: "HourlyFee",
							to: "FeeStrategy",
							kind: "implements"
						},
						{
							from: "ParkingLot",
							to: "FeeStrategy",
							kind: "uses",
							label: "injected"
						},
						{
							from: "Spot",
							to: "SpotSize",
							kind: "uses"
						}
					]
				}
			},
			{
				heading: "Sequence diagrams: where the design bugs hide",
				lede: "Order and blocking are invisible in a class diagram.",
				body: ["A class diagram cannot tell you that you hold a lock across a network call, or that two objects both write the same row. A sequence diagram makes both obvious, which is why interviewers ask 'walk me through a request' after you have drawn the boxes.", "Draw the happy path first, then draw the one failure the interviewer cares about — usually a timeout or a double-submit. The second drawing is where senior candidates separate themselves."],
				diagram: {
					kind: "sequence",
					caption: "Booking a spot — note the retry-safe idempotency check before any state change.",
					actors: [
						{
							id: "c",
							label: "Client"
						},
						{
							id: "api",
							label: "ParkingAPI"
						},
						{
							id: "lot",
							label: "ParkingLot"
						},
						{
							id: "repo",
							label: "SpotRepository",
							sub: "row lock"
						}
					],
					messages: [
						{
							from: "c",
							to: "api",
							label: "POST /park {plate, requestId}",
							kind: "call"
						},
						{
							from: "api",
							to: "repo",
							label: "findTicketByRequestId(requestId)",
							kind: "call",
							note: "idempotency check first"
						},
						{
							from: "repo",
							to: "api",
							label: "null",
							kind: "return"
						},
						{
							from: "api",
							to: "lot",
							label: "park(vehicle)",
							kind: "call"
						},
						{
							from: "lot",
							to: "repo",
							label: "SELECT ... FOR UPDATE SKIP LOCKED",
							kind: "call",
							note: "claim a free spot atomically"
						},
						{
							from: "repo",
							to: "lot",
							label: "spot#B12",
							kind: "return"
						},
						{
							from: "lot",
							to: "repo",
							label: "UPDATE spot SET vehicle, INSERT ticket",
							kind: "call"
						},
						{
							from: "lot",
							to: "api",
							label: "Ticket",
							kind: "return"
						},
						{
							from: "api",
							to: "c",
							label: "201 {ticketId, spot}",
							kind: "return",
							tone: "ok"
						}
					]
				}
			},
			{
				heading: "State diagrams catch the illegal transition",
				lede: "Cheap to draw, and they always find one bug.",
				body: ["Write the states as nouns and the transitions as verbs, then ask of every pair: can this happen? The answers you did not think about — cancel after payment, park after the lot closes, call an elevator to the floor it is already on — are where the interviewer will push."],
				diagram: {
					kind: "flow",
					caption: "Order lifecycle. Every arrow you cannot name is a bug you have not found yet.",
					rows: [[
						{
							id: "created",
							label: "CREATED",
							tone: "accent"
						},
						{
							id: "paid",
							label: "PAID"
						},
						{
							id: "shipped",
							label: "SHIPPED"
						},
						{
							id: "delivered",
							label: "DELIVERED",
							tone: "ok"
						}
					], [
						{
							id: "cancelled",
							label: "CANCELLED",
							tone: "warn",
							sub: "from CREATED or PAID only"
						},
						{
							id: "refunded",
							label: "REFUNDED",
							tone: "warn",
							sub: "from PAID or DELIVERED"
						},
						{
							id: "failed",
							label: "PAYMENT_FAILED",
							tone: "bad",
							sub: "retryable back to CREATED"
						}
					]]
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
}`
				},
				callout: {
					kind: "insight",
					text: "One transition table beats fifteen if-statements sprinkled across services: it is testable in isolation, it is readable by a product manager, and adding a state is one row."
				}
			},
			{
				heading: "Whiteboard discipline",
				steps: [
					{
						title: "Say the use cases out loud first",
						text: "Three to five sentences of the form 'a <role> can <verb> a <noun>'. These become your public methods, and they stop you modelling nouns nobody calls."
					},
					{
						title: "Draw the public API surface",
						text: "Two or three entry-point methods with real signatures. This is the contract; everything else exists to serve it.",
						detail: "park(vehicle: Vehicle): Ticket   ·   unpark(ticket: Ticket): Money"
					},
					{
						title: "Now the class diagram",
						text: "Entities and value objects first, then the interfaces at the seams you can already name (pricing, storage, notification). Add multiplicities."
					},
					{
						title: "Walk one request as a sequence",
						text: "This is where you show concurrency awareness: where the lock is taken, how long it is held, and what happens on retry."
					},
					{
						title: "Then the ugly cases",
						text: "Concurrent identical requests, a failed downstream call, a restart mid-flow. Volunteer these; do not wait to be asked."
					}
				],
				takeaways: [
					"Arrows without meaning are noise. Pick composition vs aggregation deliberately and say why.",
					"Multiplicity and state tables find bugs on the whiteboard, before any code exists.",
					"Sequence diagrams are how you demonstrate concurrency thinking without writing threads."
				]
			}
		],
		related: [
			"/lld/parking-lot",
			"/lld/elevator",
			"/lld/solid",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "dependency-injection",
		title: "Dependency Injection",
		subtitle: "Hand collaborators in; never reach out and grab them.",
		level: "foundational",
		minutes: 12,
		tags: [
			"patterns",
			"testing",
			"architecture"
		],
		summary: "Dependency injection is a one-line idea — a class receives its collaborators instead of constructing or locating them — with outsized consequences: your tests stop needing a database, your composition becomes explicit and greppable, and swapping an implementation stops being a code change inside business logic.",
		keyPoints: [
			"Constructor injection is the default; it makes a missing dependency a construction-time error instead of a null at 3am.",
			"The class should not know whether the thing it received is real, fake, retrying or cached.",
			"All concrete wiring belongs in one composition root at the process edge (main, the route module, the container config).",
			"A framework is optional. Manual wiring is fine and often clearer up to a few dozen objects.",
			"Service locator is not DI: it hides the dependency inside the method body and makes the graph invisible."
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
								"Fields can be readonly/final, which helps thread-safety"
							],
							bad: ["A long parameter list is a real signal that the class does too much"],
							verdict: "Almost always. Treat a 6-argument constructor as an SRP warning, not a DI problem."
						},
						{
							title: "Setter / property injection",
							sub: "optional collaborators",
							good: ["Fits genuinely optional things like a metrics sink", "Allows late rebinding"],
							bad: ["Object exists in an invalid state between new and set", "Every use site needs a null check or a null-object default"],
							verdict: "Optional dependencies where a no-op default is sensible."
						},
						{
							title: "Method / parameter injection",
							sub: "per-call context",
							good: ["Right for values that change per call: clock, request id, tenant"],
							bad: ["Pollutes the signature if overused", "Not a home for long-lived services"],
							verdict: "Request-scoped context that genuinely varies per invocation."
						}
					]
				}
			},
			{
				heading: "What DI buys you in a test",
				lede: "This is the argument that convinces reviewers.",
				code: [{
					title: "Untestable — the dependency is welded in",
					lang: "ts",
					source: `class SubscriptionService {
  renew(userId: string) {
    const user = new PostgresUsers().byId(userId);   // needs a database
    const charge = Stripe.charge(user.card, user.plan.price); // needs network
    if (charge.ok) new SmtpMailer().send(user.email, "renewed"); // sends real mail
    return charge.ok;
  }
}`
				}, {
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
expect(await svc.renew("alice")).toBe(false);`
				}],
				callout: {
					kind: "insight",
					text: "Injecting the clock is the move that separates people who have debugged flaky tests from people who have not. Time, randomness and IDs are dependencies like any other."
				}
			},
			{
				heading: "The composition root",
				lede: "One place knows the concrete types. Exactly one.",
				body: ["If new PostgresUsers() appears in fifteen files, you have injection without inversion of control — the graph is still hard-wired, just spelled differently. Collect construction in a single module that runs once at startup. Everything below it takes interfaces.", "This is also where cross-cutting behaviour composes cleanly: retry, caching and instrumentation are decorators over the same interface, and the class using it never learns that it got three layers instead of one."],
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
}`
				},
				diagram: {
					kind: "layers",
					caption: "Dependency arrows point inward; only the outermost layer names concrete technology.",
					layers: [
						{
							title: "Composition root",
							items: [
								"buildApp()",
								"env parsing",
								"pool creation",
								"decorator stacking"
							]
						},
						{
							title: "Infrastructure",
							items: [
								"PostgresUsers",
								"StripeGateway",
								"SesMailer",
								"RedisCache"
							]
						},
						{
							title: "Ports (interfaces)",
							items: [
								"UserRepository",
								"PaymentGateway",
								"Mailer",
								"Clock"
							]
						},
						{
							title: "Domain / use cases",
							items: [
								"SubscriptionService",
								"Plan",
								"Money",
								"RenewalPolicy"
							]
						}
					]
				}
			},
			{
				heading: "Service locator, and why it is the wrong shape",
				table: {
					headers: [
						"",
						"Dependency injection",
						"Service locator"
					],
					rows: [
						[
							"Where the dependency appears",
							"Constructor signature",
							"Inside a method body: locator.get(Mailer)"
						],
						[
							"Missing dependency shows up",
							"At construction, usually at startup",
							"At runtime, on the unlucky code path"
						],
						[
							"Test setup",
							"Pass a fake in",
							"Mutate global registry, remember to reset it"
						],
						[
							"Reading the class",
							"Collaborators are listed at the top",
							"You must read every method to know what it needs"
						],
						[
							"Parallel tests",
							"Fine — no shared state",
							"Race on the shared registry"
						]
					]
				},
				callout: {
					kind: "warn",
					text: "A DI container that you call from inside domain classes has quietly become a service locator. The container should be invisible below the composition root."
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Do you need a DI framework?",
						a: "No. Manual wiring in a composition root is explicit, greppable and has zero magic — I would start there. A container earns its place when the graph is large, when scoping (singleton vs per-request) becomes fiddly to hand-roll, or when the framework already owns object creation. The cost is reflection-time failures and a graph you can no longer read top-to-bottom."
					},
					{
						q: "How do you handle a dependency needed deep in the tree?",
						a: "First ask whether it belongs there at all — a repository three layers below a use case often means a missing boundary. If it is legitimate, inject it into the object that needs it and let the parent take it too; that visible plumbing is a fair price for an honest graph. What I avoid is a global or an ambient context, which hides the coupling rather than removing it."
					},
					{
						q: "Constructor injection with eight parameters — what now?",
						a: "That is SRP telling me the class has too many reasons to change. I look for a cluster: three of them are probably 'notification' and can become one facade, or the class is doing orchestration plus rules and should split. I do not fix it by moving to setters — that hides the smell instead of removing it."
					},
					{
						q: "Singleton vs per-request lifetimes?",
						a: "Stateless collaborators (repositories over a pool, gateways) can be singletons. Anything carrying request state — a unit of work, a tenant context, a correlation id — must be per request, and mixing them is the classic leak: a singleton that captures a request-scoped object keeps the first request's data forever."
					}
				]
			}
		],
		related: [
			"/lld/singleton-di",
			"/lld/repository",
			"/lld/solid",
			"/lld/decorator"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "singleton-di",
		title: "Singleton — and What to Use Instead",
		subtitle: "One instance is often right; a global static that hides it rarely is.",
		level: "foundational",
		minutes: 10,
		tags: [
			"patterns",
			"antipattern",
			"concurrency"
		],
		summary: "Singleton is the pattern most likely to be asked about and most likely to be wrong. The requirement behind it — exactly one connection pool, one cache, one id generator — is legitimate. The classic implementation, a static getInstance() reached from anywhere, is what turns that requirement into untestable global state.",
		keyPoints: [
			"Separate the two claims: 'one instance should exist' (usually true) and 'anyone may reach it globally' (usually harmful).",
			"Enforce cardinality at the composition root: construct once, inject everywhere.",
			"If you must write one, know the thread-safe forms: eager static init, holder idiom, or double-checked locking with volatile.",
			"A singleton holding mutable state is a lock convention that nobody documented.",
			"Test smell: needing a reset() method on a singleton means the design already lost."
		],
		sections: [
			{
				heading: "The two claims hiding in one pattern",
				body: ["Ask the interviewer which one they want. 'There must be exactly one connection pool' is a lifecycle statement, and the composition root enforces it perfectly by calling new once. 'Any class may call Pool.getInstance()' is an access statement, and it is what makes the pattern notorious: it hides dependencies, couples every caller to a concrete type, and shares mutable state across tests.", "Saying this distinction out loud is most of the answer."],
				diagram: {
					kind: "compare",
					caption: "Same cardinality, very different coupling.",
					options: [{
						title: "Static singleton",
						sub: "Pool.getInstance()",
						tone: "warn",
						good: ["Zero plumbing", "Reachable from anywhere, including legacy code you cannot change"],
						bad: [
							"Dependency is invisible in the signature",
							"Tests share state; ordering bugs appear under parallel runs",
							"Initialisation order across singletons is hard to reason about",
							"Cannot substitute a fake without a static setter"
						],
						verdict: "Legacy interop, or a genuinely process-wide constant with no state."
					}, {
						title: "One instance, injected",
						sub: "constructed once in buildApp()",
						tone: "ok",
						good: [
							"Cardinality is still exactly one",
							"Callers depend on an interface and say so",
							"Tests pass a fake; no global reset needed",
							"Lifetime is explicit — you can see startup and shutdown"
						],
						bad: ["You have to pass it down, which makes over-wide sharing visible (that is a feature)"],
						verdict: "The default answer in an interview."
					}]
				}
			},
			{
				heading: "If you do write one, get the concurrency right",
				lede: "This is the part interviewers actually test.",
				body: ["Naive lazy initialisation is a data race: two threads see the null field, both construct, and one instance quietly wins while the other is used by half your callers. There are three correct shapes, and the right answer depends on whether initialisation is expensive."],
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
}`
					},
					{
						title: "Correct — eager (fine when construction is cheap)",
						lang: "java",
						source: `class Pool {
  private static final Pool INSTANCE = new Pool();  // JVM guarantees once
  static Pool getInstance() { return INSTANCE; }
}`
					},
					{
						title: "Correct — holder idiom (lazy, no locking on the read path)",
						lang: "java",
						source: `class Pool {
  private Pool() {}
  private static class Holder { static final Pool INSTANCE = new Pool(); }
  static Pool getInstance() { return Holder.INSTANCE; }  // class loaded on first use
}`
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
}`
					}
				],
				callout: {
					kind: "warn",
					text: "Without volatile, double-checked locking is broken on any JVM: another thread can observe a non-null reference to a partially constructed object, because the write to the field may be reordered before the constructor finishes."
				}
			},
			{
				heading: "Where the pattern still bites in production",
				table: {
					headers: [
						"Symptom",
						"Root cause",
						"Fix"
					],
					rows: [
						[
							"Tests pass alone, fail in the suite",
							"Mutable state carried between tests through the singleton",
							"Inject a per-test instance; delete the static"
						],
						[
							"Config read before it was loaded",
							"Static initialiser ordering between two singletons",
							"Explicit startup sequence in the composition root"
						],
						[
							"Two 'singletons' exist in one process",
							"Two classloaders, or the module was bundled twice",
							"Make the instance a value you pass, not a lookup"
						],
						[
							"Deadlock during startup",
							"Two singletons initialising each other under class-init locks",
							"Break the cycle; construct both from outside"
						],
						[
							"Cannot run two tenants in one process",
							"Global cardinality was never the real requirement",
							"Scope the instance to a tenant container"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Is Singleton an anti-pattern?",
						a: "The cardinality is not; the global access point usually is. I would phrase it as: I want one instance, so I construct one in the composition root and inject it. If someone hands me a codebase that already calls getInstance() everywhere, the incremental fix is to add an interface, have the singleton implement it, and start injecting at the edges rather than a big-bang rewrite."
					},
					{
						q: "How do you make a singleton thread-safe in Java?",
						a: "Eager static final if construction is cheap; the static holder idiom for laziness without a read-path lock; double-checked locking with a volatile field if I need laziness plus parameters. Enum is also a genuine option — serialization- and reflection-safe by construction — though it is awkward if the instance needs constructor arguments."
					},
					{
						q: "The singleton holds a mutable cache. What do you worry about?",
						a: "That its concurrency contract is undocumented. Every caller now shares it, so I would want a thread-safe map, a bounded size with an eviction policy, and clarity on whether stale reads are acceptable. And I would check nothing iterates it while another thread writes — a very common crash under load."
					}
				]
			}
		],
		related: [
			"/lld/dependency-injection",
			"/lld/concurrency",
			"/lld/factory",
			"/lld/lru-cache"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	},
	{
		slug: "repository",
		title: "Repository Pattern",
		subtitle: "A collection-shaped boundary between the domain and the database.",
		level: "intermediate",
		minutes: 13,
		tags: [
			"patterns",
			"persistence",
			"architecture"
		],
		summary: "A repository lets the domain say 'give me the order' instead of 'run this SQL'. Done well, it makes business logic testable in memory and keeps storage decisions swappable. Done badly, it becomes a thin veneer of findByXAndYOrderByZ methods that leaks the database into the domain anyway.",
		keyPoints: [
			"The interface belongs to the domain layer and speaks domain language; the implementation lives in infrastructure.",
			"Return aggregates, not rows: a repository hands back Order (with its lines), never a joined tuple.",
			"One repository per aggregate root, not one per table.",
			"Query objects or specifications keep the interface from growing a method per screen.",
			"Transactions usually span multiple repositories — that is the Unit of Work's job, not the repository's."
		],
		sections: [
			{
				heading: "What it is actually buying",
				bullets: [
					"Testability: use cases run against an in-memory implementation in microseconds, with no fixtures or containers.",
					"A named seam for storage decisions — adding a cache, a read replica, or an outbox is a decorator, not a domain edit.",
					"Vocabulary: findOverdueSubscriptions() carries intent that a WHERE clause pasted into a service does not.",
					"Aggregate integrity: loading and saving whole objects makes 'saved half of it' structurally hard."
				],
				callout: {
					kind: "note",
					text: "It is not buying database portability. Almost nobody swaps Postgres for Mongo in production, and pretending you might is how repositories end up with a uselessly abstract interface."
				}
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
//   getConnection(): Connection`
				},
				diagram: {
					kind: "er",
					caption: "Three tables, one aggregate. The repository hands back the whole thing.",
					entities: [
						{
							name: "orders",
							note: "aggregate root",
							fields: [
								{
									name: "id",
									type: "uuid",
									key: "pk"
								},
								{
									name: "customer_id",
									type: "uuid",
									key: "fk"
								},
								{
									name: "status",
									type: "text"
								},
								{
									name: "placed_at",
									type: "timestamptz",
									key: "idx"
								},
								{
									name: "version",
									type: "int",
									note: "optimistic lock"
								}
							]
						},
						{
							name: "order_lines",
							note: "part of the aggregate — no repository of its own",
							fields: [
								{
									name: "order_id",
									type: "uuid",
									key: "fk"
								},
								{
									name: "sku",
									type: "text"
								},
								{
									name: "qty",
									type: "int"
								},
								{
									name: "unit_price",
									type: "numeric"
								}
							]
						},
						{
							name: "customers",
							note: "separate aggregate — referenced by id only",
							fields: [{
								name: "id",
								type: "uuid",
								key: "pk"
							}, {
								name: "email",
								type: "text",
								key: "idx"
							}]
						}
					],
					relations: [{
						from: "orders",
						to: "order_lines",
						label: "loaded together, saved together",
						cardinality: "1..*"
					}, {
						from: "orders",
						to: "customers",
						label: "reference by id, never a join into the aggregate",
						cardinality: "*..1"
					}]
				}
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
}`
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
}`
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
orderRepositoryContract(() => new PostgresOrders(testPool));`
					}
				],
				callout: {
					kind: "insight",
					text: "The contract test is the part most candidates omit. Without it, the in-memory fake drifts from the real implementation and your fast tests start passing for the wrong reasons."
				}
			},
			{
				heading: "Transactions across repositories: Unit of Work",
				lede: "A repository per aggregate means one use case may touch several.",
				body: ["If transferring money must debit one account and credit another atomically, neither repository can own the transaction. The unit of work does: it opens the transaction, hands scoped repositories to the use case, and commits or rolls back once."],
				diagram: {
					kind: "sequence",
					caption: "The use case never sees a connection; it sees a transactional scope.",
					actors: [
						{
							id: "uc",
							label: "TransferMoney",
							sub: "use case"
						},
						{
							id: "uow",
							label: "UnitOfWork"
						},
						{
							id: "accs",
							label: "AccountRepository"
						},
						{
							id: "db",
							label: "Postgres"
						}
					],
					messages: [
						{
							from: "uc",
							to: "uow",
							label: "run(scope => ...)",
							kind: "call"
						},
						{
							from: "uow",
							to: "db",
							label: "BEGIN",
							kind: "call"
						},
						{
							from: "uc",
							to: "accs",
							label: "byId(from) / byId(to)",
							kind: "call",
							note: "repositories bound to this transaction"
						},
						{
							from: "accs",
							to: "db",
							label: "SELECT ... FOR UPDATE",
							kind: "call",
							note: "lock both rows in a fixed order to avoid deadlock"
						},
						{
							from: "uc",
							to: "accs",
							label: "save(debited) / save(credited)",
							kind: "call"
						},
						{
							from: "uow",
							to: "db",
							label: "COMMIT",
							kind: "call",
							tone: "ok"
						},
						{
							from: "uow",
							to: "uc",
							label: "result",
							kind: "return"
						}
					]
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
});`
				}
			},
			{
				heading: "Where it goes wrong",
				table: {
					headers: [
						"Anti-pattern",
						"Why it hurts",
						"Instead"
					],
					rows: [
						[
							"One repository per table",
							"OrderLineRepository lets callers save half an order and skip invariants",
							"One per aggregate root; parts are saved with the root"
						],
						[
							"IQueryable / raw SQL leaking out",
							"The domain now depends on the query engine's semantics and lazy loading",
							"Return materialised aggregates, or a read model built for the screen"
						],
						[
							"A method per screen",
							"The interface grows without bound and every new report edits the domain",
							"A specification/criteria object, or CQRS with a separate read side"
						],
						[
							"Repository opens its own transaction per call",
							"Multi-aggregate use cases lose atomicity",
							"Unit of Work owns the transaction boundary"
						],
						[
							"Fake and real drift apart",
							"Fast tests pass, production fails on a constraint the fake never had",
							"One contract test suite run against both"
						]
					]
				}
			},
			{
				heading: "Interview follow-ups",
				followUps: [
					{
						q: "Is a repository still worth it when you already have an ORM?",
						a: "Sometimes not. An ORM's DAO is already a repository of sorts, and wrapping it adds a layer with no seam. I add an explicit repository when the domain has real invariants worth protecting, when I want fast in-memory use-case tests, or when the persistence model and the domain model have genuinely diverged. For CRUD screens I would call the ORM directly and say so."
					},
					{
						q: "How do you handle a complex reporting query?",
						a: "I stop pretending it is a repository concern. Reports read across aggregates and want joins and projections the domain model does not have. I add a read side — a query service returning DTOs shaped for the screen, hitting a replica or a materialised view. Keeping writes aggregate-shaped and reads query-shaped is the useful half of CQRS."
					},
					{
						q: "Where do you put optimistic locking?",
						a: "A version column on the aggregate root, checked in the UPDATE's WHERE clause. Zero rows updated means someone else won, and the repository raises a concurrency error that the use case can retry. It belongs at the root because the root is the consistency boundary — locking individual lines would let two writers each think they had the whole order."
					},
					{
						q: "N+1 queries — whose problem is it?",
						a: "The implementation's, and it is why the interface must not expose lazy proxies. If overdue() returns 500 orders each of which lazily loads its lines, the abstraction has hidden 501 round trips. I would load lines in one query keyed by order id and hydrate in memory, and I would have a test that counts queries so a regression is visible."
					}
				]
			}
		],
		related: [
			"/lld/dependency-injection",
			"/lld/solid",
			"/hld/sql-vs-nosql",
			"/lld/concurrency"
		],
		furtherReading: [{
			label: "roadmap.sh — system design",
			href: "https://roadmap.sh/system-design"
		}]
	}
];
var lldProblems = [{
	slug: "lru-cache",
	title: "Design an LRU Cache",
	subtitle: "O(1) get and put, and the four follow-ups that decide the round.",
	level: "intermediate",
	minutes: 16,
	tags: [
		"data-structures",
		"cache",
		"machine-coding"
	],
	summary: "Hash map plus doubly linked list gets you O(1) get and put in about forty lines. Everyone knows that. The interview is decided by what comes next: making it thread-safe without one global lock, adding TTL, handling the thundering herd on eviction, and knowing when LRU is the wrong policy entirely.",
	keyPoints: [
		"Map key → node for O(1) lookup; doubly linked list for O(1) move-to-front and O(1) eviction from the tail.",
		"Every get is a write — it reorders the list. That is why a naive read lock does not help.",
		"Sentinel head and tail nodes remove every null check from the splice logic.",
		"TTL needs lazy expiry on read plus an active sweeper, or expired entries hold memory forever.",
		"LRU loses to LFU under scan-heavy workloads and to W-TinyLFU almost everywhere; know the failure mode."
	],
	sections: [
		{
			heading: "Why this data structure",
			lede: "Two requirements pull in different directions; two structures satisfy both.",
			body: ["You need to find an entry by key in constant time, which says hash map. You also need to know which entry is least recently used and remove it in constant time, which says an ordered structure with O(1) removal from one end and O(1) reordering from the middle — a doubly linked list. Neither alone is enough; the map stores pointers into the list.", "A singly linked list fails because removing a node from the middle needs its predecessor. An array fails because moving an element to the front is O(n). A heap by timestamp gives O(log n), which is the answer if you get the structure wrong."],
			diagram: {
				kind: "flow",
				caption: "Map values are list nodes, so a hit can splice in O(1) without walking anything.",
				rows: [[{
					id: "map",
					label: "HashMap<K, Node>",
					sub: "O(1) lookup",
					tone: "accent"
				}], [
					{
						id: "h",
						label: "HEAD",
						sub: "sentinel",
						tone: "warn"
					},
					{
						id: "a",
						label: "k=A",
						sub: "most recent"
					},
					{
						id: "b",
						label: "k=B"
					},
					{
						id: "c",
						label: "k=C",
						sub: "next to be evicted"
					},
					{
						id: "t",
						label: "TAIL",
						sub: "sentinel",
						tone: "warn"
					}
				]]
			},
			table: {
				headers: [
					"Operation",
					"Steps",
					"Cost"
				],
				rows: [
					[
						"get(k) hit",
						"map lookup → unlink node → insert after head",
						"O(1)"
					],
					[
						"get(k) miss",
						"map lookup",
						"O(1)"
					],
					[
						"put(k,v) existing",
						"map lookup → update value → move to front",
						"O(1)"
					],
					[
						"put(k,v) new, not full",
						"new node → insert after head → map put",
						"O(1)"
					],
					[
						"put(k,v) new, full",
						"unlink tail.prev → map delete → insert new at front",
						"O(1)"
					],
					[
						"Memory",
						"map entry + node (2 pointers + key + value) per item",
						"~O(n), 50-80 bytes overhead each"
					]
				]
			}
		},
		{
			heading: "The implementation, with the parts people get wrong",
			code: {
				title: "Sentinels remove every null check",
				lang: "ts",
				source: `class Node<K, V> {
  prev!: Node<K, V>;
  next!: Node<K, V>;
  constructor(public key: K, public value: V) {}
}

export class LruCache<K, V> {
  private map = new Map<K, Node<K, V>>();
  private head = new Node<K, V>(null as never, null as never);  // sentinel
  private tail = new Node<K, V>(null as never, null as never);  // sentinel

  constructor(private capacity: number) {
    if (capacity <= 0) throw new RangeError("capacity must be > 0");
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);          // a read mutates the structure
    return node.value;
  }

  put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }
    if (this.map.size === this.capacity) this.evict();
    const node = new Node(key, value);
    this.map.set(key, node);
    this.insertAfterHead(node);
  }

  private evict(): void {
    const lru = this.tail.prev;      // never the sentinel, because size > 0
    this.unlink(lru);
    this.map.delete(lru.key);
    this.onEvict?.(lru.key, lru.value);   // hook: flush dirty entries, emit metrics
  }

  private moveToFront(n: Node<K, V>) { this.unlink(n); this.insertAfterHead(n); }

  private unlink(n: Node<K, V>) {
    n.prev.next = n.next;
    n.next.prev = n.prev;
  }

  private insertAfterHead(n: Node<K, V>) {
    n.prev = this.head;
    n.next = this.head.next;
    this.head.next.prev = n;
    this.head.next = n;
  }

  onEvict?: (key: K, value: V) => void;
}`
			},
			bullets: [
				"Sentinels: without them, unlink and insert both need four null checks and the empty-list case is a separate branch. This is the single biggest source of bugs on a whiteboard.",
				"put on an existing key must not evict — check for the existing entry before checking capacity, or a repeated write to a full cache evicts a live entry.",
				"Delete the key from the map when evicting. Forgetting this is the classic leak: the list shrinks and the map does not.",
				"In many languages the standard library already has insertion-ordered maps (JS Map, Java LinkedHashMap with accessOrder=true) — mention it, then implement the explicit version anyway because that is what is being assessed."
			],
			callout: {
				kind: "warn",
				text: "get() is a mutation. That single fact drives the entire concurrency discussion below, and candidates who treat reads as read-only produce caches that corrupt their own list under load."
			}
		},
		{
			heading: "Making it thread-safe without killing throughput",
			lede: "One global lock works and does not scale. Here is the ladder.",
			steps: [
				{
					title: "One mutex around everything",
					text: "Correct, trivially reviewable, and it serialises every read. Fine for a cache behind a single-threaded event loop or with low contention; the first answer to give.",
					detail: "throughput ≈ 1 / (lock acquire + splice) — a few million ops/sec, but no parallel scaling"
				},
				{
					title: "Sharded (striped) cache",
					text: "N independent caches, shard = hash(key) % N, each with its own lock and its own capacity. Contention drops ~N-fold and eviction becomes per-shard, which is a slight accuracy loss for a large throughput gain. This is what most production caches do.",
					detail: "N = 16–256 shards; capacity per shard = total / N, so hot shards can evict earlier than a global LRU would"
				},
				{
					title: "Amortise the reordering",
					text: "Do not splice on every read. Record hits into a small per-thread ring buffer and drain it into the LRU list under the lock only when it fills. Reads become almost lock-free, and the ordering becomes approximate — which is fine, because LRU is a heuristic anyway.",
					detail: "This is roughly what Caffeine (Java) and Ristretto (Go) do; recency accuracy is traded for read throughput"
				},
				{
					title: "Give up strict LRU",
					text: "CLOCK / second-chance approximates LRU with a reference bit and a rotating hand, needing no reordering at all on a hit. Operating-system page caches use this precisely because a read must not take a write lock."
				}
			],
			code: {
				title: "Sharding — the practical answer",
				lang: "ts",
				source: `class ShardedLru<K, V> {
  private shards: { lock: Mutex; cache: LruCache<K, V> }[];

  constructor(capacity: number, shardCount = 16) {
    const per = Math.max(1, Math.ceil(capacity / shardCount));
    this.shards = Array.from({ length: shardCount }, () => ({
      lock: new Mutex(), cache: new LruCache<K, V>(per),
    }));
  }

  private shardFor(key: K) {
    return this.shards[(hash(key) >>> 0) % this.shards.length];
  }

  async get(key: K) {
    const s = this.shardFor(key);
    return s.lock.withLock(() => s.cache.get(key));   // contention only within a shard
  }
}`
			}
		},
		{
			heading: "TTL, and the two ways entries expire",
			body: ["Adding expiry looks trivial — store an expiresAt and check it on read — but lazy expiry alone means an entry nobody reads again occupies memory until it happens to be evicted. In a cache sized by entry count that is merely wasteful; in one sized by bytes it is a leak."],
			code: {
				title: "Lazy expiry on read plus a bounded sweeper",
				lang: "ts",
				source: `get(key: K): V | undefined {
  const node = this.map.get(key);
  if (!node) return undefined;
  if (node.expiresAt <= this.clock.now()) {   // lazy expiry
    this.unlink(node); this.map.delete(key);
    return undefined;                          // treat as a miss
  }
  this.moveToFront(node);
  return node.value;
}

// active sweeper: bounded work per tick so it never stalls the cache
private sweep(budget = 200) {
  let node = this.tail.prev, checked = 0;
  const now = this.clock.now();
  while (node !== this.head && checked++ < budget) {
    const prev = node.prev;
    if (node.expiresAt <= now) { this.unlink(node); this.map.delete(node.key); }
    node = prev;
  }
}`
			},
			bullets: [
				"Sweeping from the tail is deliberate: the least recently used entries are the most likely to be expired, so a small budget finds most of the garbage.",
				"Use an injected clock. Testing TTL with real sleeps produces slow, flaky tests.",
				"Add jitter to TTLs (±10%) so a batch of entries written together does not all expire in the same second and stampede the origin.",
				"On expiry of a hot key, single-flight the refill: one request recomputes, the rest wait on the same promise. Without this, one expiry becomes a thousand database queries."
			],
			callout: {
				kind: "insight",
				text: "TTL and LRU answer different questions. LRU asks 'what can I afford to forget?'; TTL asks 'what am I no longer allowed to believe?'. A cache with correctness requirements needs both, and TTL is the one that bounds staleness."
			}
		},
		{
			heading: "When LRU is the wrong policy",
			diagram: {
				kind: "compare",
				caption: "Recency, frequency, and the hybrid that usually wins.",
				options: [
					{
						title: "LRU — recency",
						good: [
							"O(1), simple, well understood",
							"Great for workloads with temporal locality",
							"Adapts instantly to a shifting working set"
						],
						bad: ["A single scan of cold data evicts the entire hot set", "One-hit-wonder keys are admitted at full cost"],
						verdict: "Session data, request-scoped reuse, most application caches."
					},
					{
						title: "LFU — frequency",
						good: ["Immune to scans", "Keeps genuinely hot keys through bursts"],
						bad: ["Yesterday's hot key stays resident forever without ageing", "Counters cost memory; O(1) LFU is fiddly to implement"],
						verdict: "Stable, skewed popularity: reference data, top-N lookups."
					},
					{
						title: "W-TinyLFU — hybrid",
						tone: "ok",
						good: ["Frequency sketch decides admission, LRU segments decide eviction", "Scan-resistant, near-optimal hit ratio for a few bits per key"],
						bad: ["More moving parts to explain", "Approximate counts, so pathological cases exist"],
						verdict: "What Caffeine and Ristretto ship; the right answer to 'can you do better than LRU?'"
					}
				]
			},
			table: {
				headers: [
					"Workload",
					"LRU behaviour",
					"Better choice"
				],
				rows: [
					[
						"Full-table scan through a warm cache",
						"Evicts everything hot; hit rate falls off a cliff",
						"LFU admission, or a scan-resistant segment (ARC, SLRU)"
					],
					[
						"Zipfian popularity, stable over days",
						"Fine, but wastes space on one-hit keys",
						"TinyLFU admission filter in front of LRU"
					],
					[
						"Strict working set, changes hourly",
						"Ideal",
						"Keep LRU"
					],
					[
						"Large values, variable size",
						"Entry-count capacity misrepresents memory",
						"Weigh entries by bytes; evict by weight"
					]
				]
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "How do you make it thread-safe?",
					a: "I would start with a single mutex and say why: get() mutates the list, so a read/write lock buys nothing. Then I would shard by key hash — sixteen or so independent caches, each with its own lock and capacity — which removes most contention for a small loss in global LRU accuracy. If reads still dominate, I would amortise the reordering through a per-thread buffer drained in batches, which is what Caffeine does."
				},
				{
					q: "Distributed LRU across ten app servers?",
					a: "Local LRU per server plus a shared tier — Redis or memcached — reached through consistent hashing so adding a node moves only 1/n of the keys. Local caches are then a hot layer with short TTLs, and I accept that they can be inconsistent with each other. If a write must be visible everywhere immediately, I invalidate through a pub/sub channel and treat the local layer as best-effort."
				},
				{
					q: "What breaks first at scale?",
					a: "Usually memory accounting: a capacity of 100k entries says nothing about bytes when values vary in size, so the process OOMs long before the count is reached. I would weigh entries and evict by weight. The second thing is stampede on expiry of a hot key, which single-flight plus TTL jitter fixes."
				},
				{
					q: "Implement it with only a hash map?",
					a: "You can, using an ordered map with access-order semantics — LinkedHashMap in Java or JS Map plus delete-then-set on hit, which moves the key to the end. That is O(1) amortised and is genuinely what I would use in production. I would still be able to write the explicit list version, because the point of the question is whether I understand why both structures are needed."
				},
				{
					q: "What metrics would you export?",
					a: "Hit ratio (the number everyone asks for), eviction rate, average and p99 load latency on a miss, and current size in both entries and bytes. Hit ratio alone is misleading — a cache with a 99% hit rate that evicts a million entries a minute is thrashing, and the eviction rate is what shows it."
				}
			]
		}
	],
	related: [
		"/hld/caching",
		"/playgrounds/lru-cache",
		"/lld/proxy",
		"/hld/consistent-hashing"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}],
	playground: "lru-cache"
}, {
	slug: "rate-limiter",
	title: "Design a Rate Limiter (LLD)",
	subtitle: "Four algorithms, one interface, and the distributed problem underneath.",
	level: "intermediate",
	minutes: 18,
	tags: [
		"machine-coding",
		"concurrency",
		"resilience"
	],
	summary: "Rate limiting is the interview question that spans both rounds: the LLD half is a clean strategy interface with four implementations you can write from memory, and the HLD half is what happens when the counter has to be shared by fifty servers without becoming a bottleneck.",
	keyPoints: [
		"Token bucket allows controlled bursts; leaky bucket smooths output; fixed window is cheapest and has a 2x edge flaw; sliding window log is exact and expensive.",
		"The interface is allow(key, now) → decision with remaining and retryAfter — never a bare boolean.",
		"State is per key. Memory is the real constraint: bound it, and expire idle keys.",
		"Distributed limiting needs atomic read-modify-write; Redis with a Lua script is the standard answer.",
		"Always return 429 with Retry-After and X-RateLimit-* headers — a limiter clients cannot cooperate with causes retry storms."
	],
	prerequisites: ["/lld/strategy"],
	sections: [
		{
			heading: "The interface first",
			code: {
				title: "One decision object, not a boolean",
				lang: "ts",
				source: `type Decision = {
  ok: boolean;
  remaining: number;      // for X-RateLimit-Remaining
  limit: number;          // for X-RateLimit-Limit
  resetAtMs: number;      // for X-RateLimit-Reset
  retryAfterMs?: number;  // only when !ok
};

interface LimiterStrategy {
  allow(key: string, now: number, cost?: number): Decision;
}

// cost lets one expensive endpoint consume 10 tokens while a cheap one
// consumes 1 — the same limiter then covers "requests" and "work".`
			},
			callout: {
				kind: "insight",
				text: "Returning remaining and retryAfter is not decoration. A client that knows when to come back backs off cleanly; a client that only sees 'denied' retries immediately and turns your limiter into a load amplifier."
			}
		},
		{
			heading: "Token bucket",
			lede: "The default. Allows bursts up to capacity, then settles to the refill rate.",
			body: ["Tokens accumulate at a fixed rate up to a maximum. A request takes one (or several) tokens, and is denied if there are not enough. The bucket's capacity is the burst you tolerate; the refill rate is the sustained throughput you allow.", "The implementation detail that matters: do not run a timer to add tokens. Compute them lazily from elapsed time on each call. A timer per key does not scale past a few thousand keys."],
			code: {
				title: "Lazy refill — no timers, O(1) memory per key",
				lang: "ts",
				source: `class TokenBucket implements LimiterStrategy {
  private state = new Map<string, { tokens: number; lastMs: number }>();

  constructor(private capacity: number, private refillPerSec: number) {}

  allow(key: string, now: number, cost = 1): Decision {
    const s = this.state.get(key) ?? { tokens: this.capacity, lastMs: now };

    // lazily add the tokens that "would have" accrued since the last call
    const elapsedSec = Math.max(0, now - s.lastMs) / 1000;
    s.tokens = Math.min(this.capacity, s.tokens + elapsedSec * this.refillPerSec);
    s.lastMs = now;

    if (s.tokens >= cost) {
      s.tokens -= cost;
      this.state.set(key, s);
      return { ok: true, remaining: Math.floor(s.tokens), limit: this.capacity,
               resetAtMs: now + ((this.capacity - s.tokens) / this.refillPerSec) * 1000 };
    }

    this.state.set(key, s);
    const deficit = cost - s.tokens;
    return { ok: false, remaining: 0, limit: this.capacity,
             resetAtMs: now + (deficit / this.refillPerSec) * 1000,
             retryAfterMs: Math.ceil((deficit / this.refillPerSec) * 1000) };
  }
}`
			},
			bullets: [
				"capacity = burst tolerance. A capacity of 100 with a refill of 10/s lets a client fire 100 requests instantly, then 10/s forever.",
				"Clamping to capacity is essential — without it, an idle client accrues unlimited tokens and can flood after an hour of silence.",
				"Memory is one small record per key. Expire idle keys (LRU or TTL) or the map grows with your user base times every distinct limit dimension."
			]
		},
		{
			heading: "The other three, and their exact failure modes",
			diagram: {
				kind: "compare",
				caption: "Pick by the shape of traffic you want to allow, not by which is 'best'.",
				options: [
					{
						title: "Fixed window counter",
						sub: "count per aligned minute",
						good: [
							"Cheapest: one integer per key",
							"Trivial in Redis: INCR + EXPIRE",
							"Easy to explain to users"
						],
						bad: ["Boundary flaw: 100 at 11:59:59 plus 100 at 12:00:00 is 200 in one second", "Synchronised clients hammer the top of each window"],
						verdict: "Coarse protection where 2x overshoot for one second is acceptable."
					},
					{
						title: "Sliding window log",
						sub: "timestamps in a sorted set",
						good: ["Exact — no boundary artefact at all", "Naturally supports 'N in any rolling T'"],
						bad: ["Memory is O(limit) per key: 20k timestamps for a 20k/min limit", "Every call trims the set; expensive at high limits"],
						verdict: "Low limits where exactness matters: login attempts, OTP sends."
					},
					{
						title: "Sliding window counter",
						sub: "weighted blend of two windows",
						tone: "ok",
						good: ["O(1) memory, smooths the boundary flaw", "Within a few percent of exact in practice"],
						bad: ["Approximate — assumes traffic is uniform inside the previous window"],
						verdict: "The practical default for API gateways at scale."
					}
				]
			},
			code: [{
				title: "Sliding window counter — the estimate that removes the boundary flaw",
				lang: "ts",
				source: `allow(key: string, now: number): Decision {
  const windowMs = this.windowMs;
  const currentStart = Math.floor(now / windowMs) * windowMs;
  const c = this.counts.get(key) ?? { start: currentStart, current: 0, previous: 0 };

  if (c.start !== currentStart) {
    // roll: this window's count becomes "previous"
    c.previous = c.start === currentStart - windowMs ? c.current : 0;
    c.current = 0;
    c.start = currentStart;
  }

  // how much of the previous window still overlaps the trailing window
  const overlap = 1 - (now - currentStart) / windowMs;
  const estimate = c.previous * overlap + c.current;

  if (estimate >= this.limit) {
    return { ok: false, remaining: 0, limit: this.limit,
             resetAtMs: currentStart + windowMs,
             retryAfterMs: currentStart + windowMs - now };
  }
  c.current++;
  this.counts.set(key, c);
  return { ok: true, remaining: Math.floor(this.limit - estimate - 1),
           limit: this.limit, resetAtMs: currentStart + windowMs };
}`
			}, {
				title: "Leaky bucket — when you need a smooth output rate",
				lang: "ts",
				source: `// Token bucket limits input bursts; leaky bucket guarantees output pacing.
// Requests enter a bounded queue and drain at a constant rate.
class LeakyBucket {
  private queue: Array<{ resolve: () => void }> = [];
  constructor(private capacity: number, private drainPerSec: number) {
    setInterval(() => this.queue.shift()?.resolve(), 1000 / drainPerSec);
  }
  async admit(): Promise<void> {
    if (this.queue.length >= this.capacity) throw new TooManyRequests();
    return new Promise((resolve) => this.queue.push({ resolve }));
  }
}
// Use it when the *downstream* cannot absorb bursts — a legacy API,
// an SMS provider, a printer. The cost is added latency by design.`
			}],
			table: {
				headers: [
					"Algorithm",
					"Memory per key",
					"Burst behaviour",
					"Exact?"
				],
				rows: [
					[
						"Token bucket",
						"2 numbers",
						"Allows a burst up to capacity",
						"Yes, for its own definition"
					],
					[
						"Leaky bucket",
						"Queue up to capacity",
						"Absorbs bursts, emits smoothly",
						"Yes, output rate is guaranteed"
					],
					[
						"Fixed window",
						"1 counter",
						"Up to 2x limit across a boundary",
						"No"
					],
					[
						"Sliding log",
						"O(limit) timestamps",
						"None — hard cap in any window",
						"Yes"
					],
					[
						"Sliding counter",
						"3 numbers",
						"Small overshoot, no cliff",
						"Approximate (±small %)"
					]
				]
			}
		},
		{
			heading: "Distributed: where the real problem is",
			lede: "Fifty app servers, one logical limit.",
			body: ["Per-instance limits are simple and wrong: with 50 servers and a limit of 100/min each, a client that load-balances gets 5000/min. Sharing the counter means every request does a network round trip to a shared store, and the read-modify-write must be atomic or two servers will both see 99 and both allow."],
			code: {
				title: "Redis + Lua — atomic because the script runs as one operation",
				lang: "lua",
				source: `-- KEYS[1] = bucket key, ARGV = capacity, refillPerSec, nowMs, cost
local capacity = tonumber(ARGV[1])
local refill   = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local cost     = tonumber(ARGV[4])

local state  = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1]) or capacity
local ts     = tonumber(state[2]) or now

tokens = math.min(capacity, tokens + ((now - ts) / 1000) * refill)

local allowed = tokens >= cost
if allowed then tokens = tokens - cost end

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil((capacity / refill) * 1000 * 2))  -- idle keys die

return { allowed and 1 or 0, math.floor(tokens) }`
			},
			diagram: {
				kind: "sequence",
				caption: "One round trip per request — and what to do when Redis is down.",
				actors: [
					{
						id: "c",
						label: "Client"
					},
					{
						id: "gw",
						label: "Gateway",
						sub: "50 instances"
					},
					{
						id: "r",
						label: "Redis",
						sub: "shared counters"
					},
					{
						id: "svc",
						label: "Service"
					}
				],
				messages: [
					{
						from: "c",
						to: "gw",
						label: "GET /v1/search",
						kind: "call"
					},
					{
						from: "gw",
						to: "r",
						label: "EVALSHA rate_limit(key, now)",
						kind: "call",
						note: "atomic; ~0.3ms same-AZ"
					},
					{
						from: "r",
						to: "gw",
						label: "[allowed, remaining]",
						kind: "return"
					},
					{
						from: "gw",
						to: "svc",
						label: "forward (allowed)",
						kind: "call",
						tone: "ok"
					},
					{
						from: "gw",
						to: "c",
						label: "429 + Retry-After + X-RateLimit-*",
						kind: "return",
						tone: "warn",
						note: "when denied"
					}
				]
			},
			bullets: [
				"Latency budget: one extra round trip on every request. Same-AZ Redis is ~0.3ms, which is usually acceptable at a gateway; cross-region is not.",
				"Failure policy is a product decision. Fail-open keeps the service available and lets abuse through; fail-closed protects the backend and turns a Redis blip into an outage. Most gateways fail open for read APIs and closed for expensive writes.",
				"Reduce round trips with a local pre-filter: keep an approximate local bucket and only consult Redis when a key is near its limit. Hot keys stay accurate, cold keys cost nothing.",
				"Shard by key so a single hot key does not make one Redis node the bottleneck; a celebrity tenant will find that node.",
				"Clock skew across gateways affects window alignment. Use the Redis server's own time inside the script rather than each gateway's clock."
			],
			callout: {
				kind: "warn",
				text: "A limiter that returns 429 with no Retry-After trains every client to retry immediately. Under load that converts a partial overload into a synchronised stampede — the limiter becomes the amplifier it was meant to prevent."
			}
		},
		{
			heading: "Design choices that come up every time",
			table: {
				headers: [
					"Question",
					"Options",
					"Reasonable default"
				],
				rows: [
					[
						"Limit by what?",
						"API key, user id, IP, tenant, endpoint, or a tuple",
						"API key for authenticated traffic, IP for anonymous — and say that IP is shared by NAT and proxies"
					],
					[
						"Where does it run?",
						"Client, gateway/edge, service middleware, or the datastore",
						"Gateway, so backends are protected uniformly; a second cheap limit at the edge for volumetric abuse"
					],
					[
						"Multiple limits at once?",
						"Per second (burst), per minute, per day (quota)",
						"Evaluate all, deny on the first failure, and report the most restrictive in the headers"
					],
					[
						"How to communicate?",
						"429 + Retry-After, headers, or silent drop",
						"429 with Retry-After and X-RateLimit-Limit/Remaining/Reset"
					],
					[
						"Who is exempt?",
						"Internal services, health checks, admin",
						"Explicit allowlist evaluated before the limiter, and monitored so it cannot become a bypass"
					]
				]
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "Which algorithm would you actually pick?",
					a: "Token bucket for API limits, because clients legitimately burst and it expresses 'sustained rate plus burst allowance' in two numbers. Sliding window counter if I need a strict per-minute number with no boundary cliff and O(1) memory. Sliding window log only for low-limit security controls like login attempts, where exactness matters and the volume is tiny."
				},
				{
					q: "How would you rate limit at 1M requests per second?",
					a: "Do not put a round trip on every request. Push a cheap volumetric limit to the edge, keep an approximate local bucket per gateway instance, and only synchronise with the shared store for keys close to their limit — or synchronise periodically, distributing a share of the global budget to each instance. That trades exactness for throughput, which at that volume is the correct trade."
				},
				{
					q: "A user complains they were limited unfairly. How do you debug it?",
					a: "I would want the limiter to emit, per decision, the key, the algorithm, the limit that fired, and the remaining count — sampled, not for every request. Without that, 'I got a 429' is unfalsifiable. I would also check whether the key was an IP behind NAT, which is the most common cause of a genuinely unfair limit."
				},
				{
					q: "Where do you store the state?",
					a: "In-memory when the limit is per instance or the traffic is sticky-routed. Redis for a shared limit, with a Lua script for atomicity and a TTL so idle keys evict themselves. I would avoid a relational database — the write rate is the whole traffic volume, and row locks on hot keys will collapse before the limit does."
				}
			]
		}
	],
	related: [
		"/hld/rate-limiting",
		"/examples/rate-limiter",
		"/lld/strategy",
		"/playgrounds/rate-limiter"
	],
	furtherReading: [{
		label: "Rate limiter playground",
		href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html"
	}],
	playground: "rate-limiter"
}];
var lldRuntime = [{
	slug: "logging",
	title: "Design a Logging Framework",
	subtitle: "Levels, appenders, formatters — and the async ring buffer that keeps it off the hot path.",
	level: "intermediate",
	minutes: 15,
	tags: [
		"machine-coding",
		"patterns",
		"observability"
	],
	summary: "A logging framework is a pattern showcase — chain of responsibility for levels, strategy for formatters, observer for appenders, decorator for enrichment — which is exactly why it is asked. The part that separates answers is what happens when the disk is slow: a synchronous logger will take your service down with it.",
	keyPoints: [
		"Level check must be the cheapest possible operation and must happen before the message is built.",
		"Appenders (where it goes) and formatters (how it looks) are independent axes — never fuse them.",
		"Structured events, not strings: log fields, render at the edge.",
		"Asynchronous by default, with a bounded queue and an explicit drop policy.",
		"Context propagation — request id, trace id, user — is what makes logs searchable in production."
	],
	sections: [
		{
			heading: "Requirements worth stating",
			bullets: [
				"Levels with runtime-adjustable thresholds, per logger name, so you can turn on debug for one package without restarting.",
				"Multiple destinations at once: console in development, file with rotation, and a network sink in production.",
				"Pluggable formats: human-readable in a terminal, JSON everywhere else.",
				"Thread-safe, and ordered enough that a single request's lines can be reconstructed.",
				"Bounded cost: logging must never block the request thread on IO, and must never grow memory without limit.",
				"Never lose an error-level event silently — if you drop, count the drops and say so."
			],
			callout: {
				kind: "warn",
				text: "The failure that takes down real services: a synchronous file appender on a full or slow disk. Every request thread blocks in write(), the pool exhausts, and the service stops serving — because of logging."
			}
		},
		{
			heading: "The object model",
			diagram: {
				kind: "uml",
				caption: "Four independent axes: level, enrichment, format, destination.",
				boxes: [
					{
						name: "Logger",
						tone: "accent",
						members: [
							{
								name: "name: string",
								kind: "field",
								vis: "-"
							},
							{
								name: "level: Level",
								kind: "field",
								vis: "-",
								note: "volatile; changeable at runtime"
							},
							{
								name: "info(msg, fields)",
								kind: "method"
							},
							{
								name: "isEnabled(level): boolean",
								kind: "method",
								note: "the hot-path check"
							},
							{
								name: "with(fields): Logger",
								kind: "method",
								note: "child with bound context"
							}
						]
					},
					{
						name: "LogEvent",
						stereotype: "record",
						members: [
							{
								name: "ts, level, logger, message",
								kind: "field"
							},
							{
								name: "fields: Map<string, Json>",
								kind: "field"
							},
							{
								name: "error?: ErrorInfo",
								kind: "field"
							}
						]
					},
					{
						name: "Appender",
						stereotype: "interface",
						tone: "accent",
						members: [{
							name: "append(event)",
							kind: "method"
						}, {
							name: "flush() / close()",
							kind: "method"
						}]
					},
					{
						name: "Formatter",
						stereotype: "interface",
						tone: "accent",
						members: [{
							name: "format(event): string | Bytes",
							kind: "method"
						}]
					},
					{
						name: "AsyncAppender",
						members: [{
							name: "queue: RingBuffer<LogEvent>",
							kind: "field",
							vis: "-"
						}, {
							name: "append(event)",
							kind: "method",
							note: "enqueue, never block"
						}]
					},
					{
						name: "RollingFileAppender",
						members: [{
							name: "rotateAtBytes / keepFiles",
							kind: "field",
							vis: "-"
						}, {
							name: "append(event)",
							kind: "method"
						}]
					}
				],
				edges: [
					{
						from: "Logger",
						to: "Appender",
						kind: "uses",
						label: "fan-out to many"
					},
					{
						from: "AsyncAppender",
						to: "Appender",
						kind: "implements"
					},
					{
						from: "RollingFileAppender",
						to: "Appender",
						kind: "implements"
					},
					{
						from: "AsyncAppender",
						to: "RollingFileAppender",
						kind: "has",
						label: "decorates: queue in front of the real sink"
					},
					{
						from: "RollingFileAppender",
						to: "Formatter",
						kind: "uses"
					},
					{
						from: "Logger",
						to: "LogEvent",
						kind: "uses",
						label: "creates"
					}
				]
			},
			code: {
				title: "The hot path: check the level before you build anything",
				lang: "ts",
				source: `class Logger {
  constructor(
    private name: string,
    private level: Level,
    private appenders: Appender[],
    private context: Fields = {},
  ) {}

  isEnabled(level: Level) { return level >= this.level; }   // one integer compare

  log(level: Level, message: string, fields?: Fields, error?: unknown) {
    if (!this.isEnabled(level)) return;                     // fast exit, no allocation
    const event: LogEvent = {
      ts: Date.now(), level, logger: this.name, message,
      fields: { ...this.context, ...fields },
      error: error ? describeError(error) : undefined,
    };
    for (const a of this.appenders) a.append(event);        // appenders must not throw
  }

  // child logger carrying request-scoped context
  with(fields: Fields) {
    return new Logger(this.name, this.level, this.appenders, { ...this.context, ...fields });
  }
}

// The expensive-argument trap:
log.debug("state: " + JSON.stringify(bigObject));   // serialises even when disabled
log.debug("state", () => ({ state: bigObject }));   // lazy: only runs if enabled`
			},
			bullets: [
				"The lazy-argument point is the one interviewers probe: string concatenation happens before the call, so a disabled debug line still costs a serialisation. Take fields, or take a thunk.",
				"Logger levels resolve hierarchically by name — 'app.billing.stripe' inherits from 'app.billing' unless set — which is what lets you raise verbosity for one subsystem.",
				"Make level a volatile/atomic field so a runtime change is visible to all threads without a lock."
			]
		},
		{
			heading: "Async appender: the part that matters",
			lede: "Producers enqueue; one consumer does the IO.",
			body: ["Put a bounded queue between the caller and the sink. The logging call becomes an enqueue — nanoseconds, no IO — and a single background thread drains the queue, batches events, and writes them. Batching is also what makes the write efficient: a hundred lines in one syscall rather than a hundred syscalls.", "Bounded is the key word. An unbounded queue turns a slow disk into an out-of-memory crash, which is strictly worse than dropping log lines."],
			code: {
				title: "Bounded queue with an explicit, level-aware drop policy",
				lang: "ts",
				source: `class AsyncAppender implements Appender {
  private queue: (LogEvent | undefined)[];
  private head = 0; private tail = 0;
  private dropped = 0;

  constructor(private inner: Appender, private capacity = 8192,
              private policy: "drop-newest" | "drop-oldest" | "block" = "drop-newest") {
    this.queue = new Array(capacity);
    this.startConsumer();
  }

  append(event: LogEvent) {
    if (this.size() >= this.capacity) {
      if (event.level >= Level.ERROR && this.policy !== "block") {
        this.evictOldestBelowError();     // never silently lose an error
      } else if (this.policy === "drop-newest") {
        this.dropped++; return;
      } else if (this.policy === "drop-oldest") {
        this.head = (this.head + 1) % this.capacity; this.dropped++;
      } else {
        return this.inner.append(event);  // "block": degrade to synchronous
      }
    }
    this.queue[this.tail] = event;
    this.tail = (this.tail + 1) % this.capacity;
  }

  private async startConsumer() {
    for (;;) {
      const batch = this.drain(256);          // batch the syscall
      if (batch.length) {
        try { for (const e of batch) this.inner.append(e); this.inner.flush(); }
        catch { /* an appender must never throw into the app */ }
      } else {
        await sleep(5);
      }
      if (this.dropped > 0) {                  // make loss visible
        metrics.inc("log.dropped", this.dropped); this.dropped = 0;
      }
    }
  }
}`
			},
			table: {
				headers: [
					"Back-pressure policy",
					"Behaviour when full",
					"Use when"
				],
				rows: [
					[
						"Drop newest",
						"New events discarded; oldest history preserved",
						"Default — cheapest, keeps the events leading to the incident"
					],
					[
						"Drop oldest",
						"Ring overwrites; you keep the most recent context",
						"Debugging a crash, where the last lines matter most"
					],
					[
						"Block the caller",
						"Back-pressure reaches the request",
						"Audit logs that legally cannot be lost"
					],
					[
						"Sample below a level",
						"Keep all errors, sample info/debug",
						"High-volume services; the practical hybrid"
					]
				]
			},
			callout: {
				kind: "insight",
				text: "Say the drop count is itself a metric. A logger that quietly loses 40% of its lines is worse than one that logs less, because every conclusion drawn from the logs is now wrong and nobody knows it."
			}
		},
		{
			heading: "Structured events and context propagation",
			code: [{
				title: "Log fields, not sentences",
				lang: "ts",
				source: `// Unsearchable: every value is welded into a string.
log.info(\`user \${userId} placed order \${orderId} for $\${total} in \${ms}ms\`);

// Searchable, aggregatable, and cheap to render:
log.info("order placed", { userId, orderId, totalCents: total.minorUnits(), ms });
// -> {"ts":...,"level":"info","msg":"order placed","userId":"u_1","ms":142,
//     "requestId":"req_9f3","traceId":"4bf92f..."}`
			}, {
				title: "Request-scoped context without threading a logger through every call",
				lang: "ts",
				source: `// Node: AsyncLocalStorage. JVM: MDC / ThreadLocal. Go: context.Context.
const store = new AsyncLocalStorage<Fields>();

export function withRequestContext<T>(fields: Fields, fn: () => T): T {
  return store.run({ ...store.getStore(), ...fields }, fn);
}

class ContextualLogger extends Logger {
  log(level: Level, msg: string, fields?: Fields, err?: unknown) {
    super.log(level, msg, { ...store.getStore(), ...fields }, err);
  }
}

// middleware sets it once per request
app.use((req, res, next) =>
  withRequestContext({ requestId: req.id, traceId: req.traceId, userId: req.user?.id }, next));`
			}],
			bullets: [
				"requestId and traceId are what turn a pile of lines into a story. Without them, correlating a failure across three services is manual archaeology.",
				"Redact at the boundary: a field allowlist or a redaction formatter, so tokens, card numbers and emails never reach disk. This is a design requirement, not a code-review nit.",
				"Sample high-volume debug logs by trace id, so a sampled request keeps all of its lines rather than a random scatter.",
				"Rotation belongs to the file appender: rotate by size and by day, keep N files, and compress the old ones — otherwise the disk fills and you are back to the blocking-write failure."
			]
		},
		{
			heading: "Patterns on display",
			table: {
				headers: [
					"Pattern",
					"Where",
					"Why it fits"
				],
				rows: [
					[
						"Strategy",
						"Formatter (JSON, text, logfmt)",
						"Interchangeable rendering with one interface"
					],
					[
						"Decorator",
						"AsyncAppender wrapping FileAppender",
						"Adds queueing without the sink knowing"
					],
					[
						"Observer",
						"Logger fanning out to appenders",
						"One event, many independent destinations"
					],
					[
						"Chain of responsibility",
						"Hierarchical logger levels",
						"Resolution walks up the name hierarchy"
					],
					[
						"Builder",
						"Configuring appenders and rotation",
						"Many optional settings, validated together"
					],
					[
						"Singleton (scoped)",
						"LoggerFactory",
						"One registry — constructed once and injected, not a global"
					]
				]
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "Your log volume is 500k lines/sec. What breaks?",
					a: "Serialisation CPU and the write path, long before the disk fills. I would keep the level check first, move to a binary or pre-encoded format, batch aggressively in the consumer, and sample non-error events by trace id so a sampled request is complete rather than partial. At that volume I would also question whether these should be logs at all — counters and histograms answer 'how often' far more cheaply than a line per event."
				},
				{
					q: "How do you guarantee ordering?",
					a: "Within one thread the queue preserves order. Across threads it does not, and chasing global ordering is expensive and rarely useful. What matters is ordering within a request, which the request id plus a monotonic sequence number per context gives you. I would say plainly that global ordering by wall-clock timestamp is a fiction across machines anyway, because of clock skew."
				},
				{
					q: "The disk fills up. What happens?",
					a: "With a synchronous appender, every request thread blocks and the service dies — which is why async with a bounded queue is the default. With async, writes fail, the consumer catches and counts, the queue fills, and we drop by policy while continuing to serve. Rotation with a retention limit is what stops it happening; a disk-space alarm on the log volume is what tells you before it does."
				},
				{
					q: "How do you test a logging framework?",
					a: "An in-memory appender that captures events makes assertions trivial. For the async path I inject the clock and drive the consumer manually, so I can assert on drop behaviour deterministically — fill the queue, append an error, assert the error survived and an info line was dropped. And a benchmark asserting that a disabled debug call allocates nothing, because that regression is invisible otherwise."
				}
			]
		}
	],
	related: [
		"/hld/observability",
		"/lld/decorator",
		"/lld/strategy",
		"/lld/concurrency"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}, {
	slug: "concurrency",
	title: "Concurrency in Low-Level Design",
	subtitle: "Where shared state goes wrong, and the smallest fix that works.",
	level: "advanced",
	minutes: 18,
	tags: [
		"concurrency",
		"threads",
		"correctness"
	],
	summary: "Almost every LLD question ends in a concurrency follow-up: two people booking the last seat, two gates claiming one parking spot, two threads incrementing one counter. The answers are a small toolkit — immutability, atomics, one lock held briefly, or single-threaded ownership — and knowing which is smallest for the problem is the skill being tested.",
	keyPoints: [
		"Shared + mutable + concurrent = the bug. Remove any one of the three and it disappears.",
		"The cheapest fix in order: don't share, make it immutable, use an atomic, take one short lock, hand it to one owner thread.",
		"Read-modify-write is never atomic by default — that includes count++ and check-then-act.",
		"Lock ordering is how you prevent deadlock; a global order over resources is the only rule that scales.",
		"Never hold a lock across IO. Almost every production deadlock traces back to this."
	],
	sections: [
		{
			heading: "The three classic failures",
			table: {
				headers: [
					"Failure",
					"What it looks like",
					"Minimal fix"
				],
				rows: [
					[
						"Lost update",
						"Two threads read 5, both write 6; one increment vanished",
						"Atomic increment, or one lock around read-modify-write"
					],
					[
						"Check-then-act (TOCTOU)",
						"Both threads see 'seat free' and both book it",
						"Atomic compare-and-set, or a conditional UPDATE with a WHERE clause"
					],
					[
						"Visibility",
						"One thread's write is never seen by another; a loop spins forever",
						"volatile / atomic / memory barrier — locks provide this too"
					],
					[
						"Deadlock",
						"Thread A holds X wants Y, thread B holds Y wants X",
						"Global lock ordering, or lock-free with retry"
					],
					[
						"Iteration during mutation",
						"ConcurrentModificationException, or a corrupted traversal",
						"Snapshot before iterating, or a concurrent collection"
					]
				]
			},
			code: {
				title: "Check-then-act, and the two ways out",
				lang: "ts",
				source: `// BROKEN — the gap between check and act is where the second thread wins.
if (seat.status === "FREE") {      // T1 checks... T2 checks...
  seat.status = "BOOKED";          // T1 books...   T2 books.  Two tickets.
  seat.userId = userId;
}

// Fix A — atomic compare-and-set (single process)
const claimed = seat.status.compareAndSet("FREE", "BOOKED");
if (!claimed) throw new SeatTaken();

// Fix B — let the database do it (distributed)
//   UPDATE seats SET status='BOOKED', user_id=$2
//   WHERE id=$1 AND status='FREE';
//   rows_affected === 0  →  someone else got it`
			},
			callout: {
				kind: "insight",
				text: "Almost every concurrency answer in an LLD round reduces to 'make the check and the act one indivisible operation'. If you can say that sentence and then name the mechanism — CAS, a lock, or a conditional UPDATE — you have answered the question."
			}
		},
		{
			heading: "The ladder: pick the smallest tool that works",
			steps: [
				{
					title: "Don't share",
					text: "Give each thread its own state and combine at the end. A per-thread counter summed on read has no contention at all. This is why sharding and thread confinement beat clever locking so often.",
					detail: "LongAdder, thread-local accumulators, per-shard caches, actor mailboxes"
				},
				{
					title: "Make it immutable",
					text: "An object that never changes after construction is safe to share by definition. Return new instances instead of mutating; keep mutable state in one small, well-guarded place.",
					detail: "Value objects (Money, Instant), copy-on-write config, persistent data structures"
				},
				{
					title: "Use an atomic",
					text: "For a single variable, a compare-and-set loop or an atomic add is faster than a lock and cannot deadlock. Good for counters, flags, and single-reference swaps.",
					detail: "AtomicLong, AtomicReference.compareAndSet, ConcurrentHashMap.compute"
				},
				{
					title: "Take one lock, briefly",
					text: "When an invariant spans several fields, a lock is the honest tool. Hold it for the shortest possible critical section, and never across IO. If contention is the problem, shard the lock by key rather than making it cleverer.",
					detail: "synchronized / Mutex; stripe by hash(key) % 16 to cut contention"
				},
				{
					title: "Give it one owner",
					text: "Funnel all mutations into a single thread through a queue. The state machine becomes single-threaded and needs no locks at all — this is how elevator controllers, game loops and actor systems work.",
					detail: "Event loop, actor mailbox, single-writer principle"
				}
			],
			code: {
				title: "Sharded counters: no shared write at all",
				lang: "java",
				source: `// Contended: every thread fights for one cache line.
AtomicLong requests = new AtomicLong();
requests.incrementAndGet();          // ~100ns under contention

// Uncontended: each thread hits its own cell; read sums them.
LongAdder requests = new LongAdder();
requests.increment();                // ~5ns; sum() is O(threads)

// The same idea by hand, and the same idea behind a sharded cache:
//   shard = hash(key) % 16  →  16 independent locks instead of one`
			}
		},
		{
			heading: "Locking rules that prevent the incidents",
			bullets: [
				"Never hold a lock across IO — a network call, a disk write, a downstream RPC. A 30-second timeout under a lock is a 30-second outage for everyone waiting.",
				"Establish a global lock order (say, always by ascending account id) and take locks in that order everywhere. Two transfers in opposite directions is the textbook deadlock, and ordering is the textbook fix.",
				"Never call unknown code while holding a lock — a callback, a listener, a plugin. It may take another lock, or call back into you.",
				"Prefer tryLock with a timeout at boundaries so a deadlock degrades into a retryable error you can see, rather than a hang you cannot.",
				"Guard the invariant, not the field: if two fields must change together, one lock covers both. Two independent locks over related fields is a race with extra steps.",
				"Document what each lock protects, in a comment next to it. Locks are the one place where the invariant lives only in someone's head."
			],
			code: {
				title: "Deadlock, and the ordering that removes it",
				lang: "java",
				source: `// DEADLOCK: transfer(A→B) takes A then B; transfer(B→A) takes B then A.
void transfer(Account from, Account to, Money amount) {
  synchronized (from) {
    synchronized (to) { from.debit(amount); to.credit(amount); }
  }
}

// FIXED: a total order over the resources, so the cycle cannot form.
void transfer(Account from, Account to, Money amount) {
  Account first  = from.id().compareTo(to.id()) < 0 ? from : to;
  Account second = first == from ? to : from;
  synchronized (first) {
    synchronized (second) { from.debit(amount); to.credit(amount); }
  }
}
// Same-account transfer must also be handled — otherwise you deadlock on yourself.`
			}
		},
		{
			heading: "Optimistic versus pessimistic",
			diagram: {
				kind: "compare",
				caption: "Contention level decides, not taste.",
				options: [{
					title: "Pessimistic — lock first",
					sub: "SELECT ... FOR UPDATE, mutex",
					good: ["No wasted work; the winner is decided before anything is computed", "Simple mental model, predictable behaviour"],
					bad: [
						"Holds resources while you work; blocks readers in some engines",
						"Deadlock risk grows with the number of locks",
						"Terrible across a network — a lock plus a round trip"
					],
					verdict: "High contention on the same rows: seat booking, inventory of one, a hot counter."
				}, {
					title: "Optimistic — detect on write",
					sub: "version column, CAS",
					tone: "ok",
					good: [
						"No locks held during the read or the thinking",
						"Scales beautifully when conflicts are rare",
						"No deadlocks — losers simply retry"
					],
					bad: [
						"Work is thrown away on conflict",
						"Under high contention, retries can livelock without backoff",
						"Caller must handle the retry; it cannot be hidden entirely"
					],
					verdict: "Low-to-moderate contention: editing a profile, updating an order, most CRUD."
				}]
			},
			code: {
				title: "Optimistic concurrency with a version column",
				lang: "sql",
				source: `-- read
SELECT id, quantity, version FROM inventory WHERE sku = $1;

-- write: only succeeds if nobody changed it in between
UPDATE inventory
SET quantity = $2, version = version + 1
WHERE sku = $1 AND version = $3;

-- rows_affected = 0 → conflict. Re-read, recompute, retry with backoff.
-- Bound the retries: 3–5 attempts, then surface a conflict error.`
			}
		},
		{
			heading: "Async concurrency: same bugs, different clothes",
			body: ["Single-threaded runtimes (Node, browsers, Python's asyncio) do not have data races on individual statements, but they absolutely have check-then-act races: any await is a yield point where another task can run and change what you just checked."],
			code: {
				title: "The interleaving that surprises people on an event loop",
				lang: "ts",
				source: `// BROKEN even in single-threaded JavaScript.
async function reserve(sku: string) {
  const item = await db.get(sku);         // <- yield: another reserve() runs here
  if (item.quantity > 0) {                // both see quantity = 1
    await db.set(sku, { quantity: item.quantity - 1 });   // both write 0
  }                                       // two reservations, one item
}

// Fix 1: make it one atomic operation
await db.decrementIfPositive(sku);        // WHERE quantity > 0

// Fix 2: single-flight per key — serialise work for the same resource
const inflight = new Map<string, Promise<void>>();
function serialize(key: string, fn: () => Promise<void>) {
  const prev = inflight.get(key) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  inflight.set(key, next.finally(() => { if (inflight.get(key) === next) inflight.delete(key); }));
  return next;
}`
			},
			callout: {
				kind: "interview",
				text: "Saying 'every await is a yield point, so check-then-act across an await is still a race' is a strong signal in any JavaScript, Python or C# interview — most candidates believe single-threaded means safe."
			}
		},
		{
			heading: "Interview follow-ups",
			followUps: [
				{
					q: "Two users book the last seat. Walk me through it.",
					a: "The read and the write must be one atomic step. In a database that is UPDATE seats SET status='BOOKED' WHERE id=$1 AND status='FREE' — zero rows affected means you lost, and the caller offers another seat. In one process it is a compare-and-set on the seat's status. What I would avoid is reading, deciding in application code, and writing, because that gap is the bug."
				},
				{
					q: "How do you find a race that only appears in production?",
					a: "Reproduce it under stress: a test that runs N threads hammering the same key and asserts an invariant, run thousands of iterations. Beyond that, thread sanitizers or race detectors where the language has them, and logging the state transitions with a request id so I can see two operations interleaving. I would also look hard at every check-then-act and every lock released before an IO call — that is where they usually are."
				},
				{
					q: "When is a lock-free approach worth it?",
					a: "When contention is high enough that lock handoff dominates, and the operation is a single-word update — a counter, a stack push, a reference swap. Beyond that, lock-free algorithms are hard to get right and harder to review, and the ABA problem is easy to miss. For most LLD problems I would take the short lock and spend my complexity budget elsewhere."
				},
				{
					q: "Immutability sounds nice but allocates a lot. Is that acceptable?",
					a: "Usually yes: generational collectors make short-lived objects cheap, and the bugs it removes are expensive. Where it is not — a hot inner loop, a large structure copied per update — I keep the mutable state in one small owner and expose immutable snapshots to everyone else, which is copy-on-write. That gets most of the safety at a fraction of the allocation."
				},
				{
					q: "How does this change across processes?",
					a: "Every in-process tool disappears: no shared memory, no mutex. What is left is the database's atomicity (conditional updates, transactions, SELECT ... FOR UPDATE), a distributed lock with a lease and a fencing token, or designing the operation to be idempotent so duplicate execution is harmless. I would prefer the last of those wherever possible, because a distributed lock is a consistency claim that a network partition can break."
				}
			]
		}
	],
	related: [
		"/lld/parking-lot",
		"/lld/lru-cache",
		"/hld/consistency",
		"/hld/idempotency"
	],
	furtherReading: [{
		label: "awesome-system-design-resources",
		href: "https://github.com/ashishps1/awesome-system-design-resources"
	}]
}];
/**
* Low-level design curriculum, ordered as a reading path:
* principles → patterns → applied machine-coding problems → runtime concerns.
*/
var lldConcepts = [
	...lldPrinciples,
	...lldCreationalPatterns,
	...lldStructuralPatterns,
	...lldBehavioralPatterns,
	...lldProblems,
	...lldDesigns,
	...lldRuntime
];
function getLld(slug) {
	return lldConcepts.find((c) => c.slug === slug);
}
//#endregion
export { lldConcepts as n, getLld as t };
