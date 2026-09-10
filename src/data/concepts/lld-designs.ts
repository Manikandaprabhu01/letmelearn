import type { Concept } from "@/data/types";

export const lldDesigns: Concept[] = [
  {
    slug: "parking-lot",
    title: "Design a Parking Lot",
    subtitle: "The canonical LLD round: scope it, model it, then survive the concurrency question.",
    level: "intermediate",
    minutes: 20,
    tags: ["machine-coding", "oop", "modeling"],
    summary:
      "Parking lot is the most-asked LLD problem because it has just enough structure to expose how you scope a problem, where you put behaviour, and whether you have ever thought about two people trying to take the same spot. The classes are easy. The interview is won on requirements, the spot-allocation strategy, and atomic assignment.",
    keyPoints: [
      "Spend the first five minutes on scope: multi-level? multiple entrances? pricing model? reservations? EV charging?",
      "Model spot types and vehicle types separately, with a fit matrix — not a one-to-one mapping.",
      "Allocation policy is a strategy: nearest-to-entrance, first-fit, level-balanced.",
      "Assignment must be atomic. Two cars at two gates must never receive the same spot.",
      "Pricing is a strategy too, and fees are computed at exit from the ticket's timestamps.",
    ],
    prerequisites: ["/lld/uml", "/lld/strategy"],
    sections: [
      {
        heading: "Step 1 — Scope it out loud",
        lede: "Do not draw a class until these are answered.",
        followUps: [
          {
            q: "How big, and how many levels and entrances?",
            a: "Assume a garage: 5 levels, ~2,000 spots, 4 entry gates, 4 exit gates. Multiple gates is the important part — it is what makes assignment a concurrency problem rather than a lookup.",
          },
          {
            q: "What vehicle and spot types?",
            a: "Vehicles: motorcycle, car, van/truck, plus EV as an attribute rather than a type. Spots: motorcycle, compact, large, plus handicapped and EV-charging as attributes. A larger spot can take a smaller vehicle, which is why a fit matrix beats an enum comparison.",
          },
          {
            q: "How is pricing calculated?",
            a: "Per started hour with a daily cap, varying by spot type. Free for the first 15 minutes. That is enough to justify a strategy and a rounding policy without turning into a billing project.",
          },
          {
            q: "Reservations, or first-come-first-served?",
            a: "Start with first-come-first-served, and mention that reservations add a hold with an expiry and turn spot state into a small state machine. Offering the extension without building it is the right move on time.",
          },
          {
            q: "What happens when the lot is full?",
            a: "Reject at the gate with a clear reason, and expose per-type availability so the display board can say 'compact full, large available'. Availability per type, not a single number.",
          },
        ],
        callout: {
          kind: "interview",
          text: "State your assumptions as decisions, not questions you are waiting to be answered: 'I'll assume multiple entrances, because that is what makes allocation interesting — tell me if you'd rather I simplify.' That keeps you moving and shows judgement.",
        },
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
type UnparkFailure = "unknown_ticket" | "already_paid" | "ticket_lost";`,
        },
        bullets: [
          "requestId makes park() idempotent: a gate that retries after a timeout must not allocate a second spot.",
          "Returning a Result rather than throwing forces you to enumerate failures — interviewers notice the list.",
          "availability() per type, because 'the lot has 12 free spots' is useless to a driver in a van.",
        ],
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
                { name: "levels: List<Level>", kind: "field", vis: "-", note: "composition 1..*" },
                { name: "allocator: SpotAllocator", kind: "field", vis: "-" },
                { name: "pricing: PricingStrategy", kind: "field", vis: "-" },
                { name: "park(vehicle, gate, reqId)", kind: "method" },
                { name: "unpark(ticketId, at)", kind: "method" },
              ],
            },
            {
              name: "Level",
              members: [
                { name: "number: int", kind: "field", vis: "-" },
                { name: "spots: List<Spot>", kind: "field", vis: "-" },
                { name: "freeCount(type): int", kind: "method" },
              ],
            },
            {
              name: "Spot",
              members: [
                { name: "id: SpotId", kind: "field", vis: "-" },
                { name: "type: SpotType", kind: "field", vis: "-" },
                { name: "features: Set<Feature>", kind: "field", vis: "-", note: "EV, HANDICAPPED" },
                { name: "state: FREE | HELD | OCCUPIED", kind: "field", vis: "-" },
                { name: "distanceTo(gate): int", kind: "method" },
              ],
            },
            {
              name: "Ticket",
              tone: "ok",
              members: [
                { name: "id, spotId, plate", kind: "field", vis: "-" },
                { name: "enteredAt: Instant", kind: "field", vis: "-" },
                { name: "exitedAt: Instant?", kind: "field", vis: "-" },
              ],
            },
            {
              name: "SpotAllocator",
              stereotype: "interface",
              tone: "accent",
              members: [{ name: "pick(free, vehicle, gate): Spot?", kind: "method" }],
            },
            {
              name: "PricingStrategy",
              stereotype: "interface",
              tone: "accent",
              members: [{ name: "fee(ticket, at): Money", kind: "method" }],
            },
          ],
          edges: [
            { from: "ParkingLot", to: "Level", kind: "has", label: "composition 1 → 1..*" },
            { from: "Level", to: "Spot", kind: "has", label: "composition 1 → 1..*" },
            { from: "ParkingLot", to: "SpotAllocator", kind: "uses", label: "injected policy" },
            { from: "ParkingLot", to: "PricingStrategy", kind: "uses", label: "injected policy" },
            { from: "Ticket", to: "Spot", kind: "uses", label: "by id" },
          ],
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
//   - features (EV charger, handicapped) filter separately from size`,
        },
      },
      {
        heading: "Step 4 — Allocation as a strategy",
        body: [
          "Which free spot to hand out is a policy that changes per customer and per building. Making it an interface costs nothing and is the clearest place to demonstrate open/closed in this problem.",
        ],
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
}`,
        },
        table: {
          headers: ["Free-spot index", "pick() cost", "Memory", "Notes"],
          rows: [
            ["Scan all spots", "O(n) — 2,000 checks per car", "None", "Fine on a whiteboard; state that you would not ship it"],
            ["Set per (type, level)", "O(1) for 'any free', no distance", "Small", "Good default if allocation is arbitrary"],
            ["Min-heap per (type, gate) by distance", "O(log n) push/pop", "One heap per gate per type", "The right structure for nearest-first"],
            ["Bitset per level", "O(n/64) word scan, very cache-friendly", "Tiny", "Excellent for 'first free of type' at real sizes"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Keeping a free index rather than scanning is what turns this from a toy into a design. Say out loud that the index must be updated on every park and unpark, and that the index and the spot state must move together — that is the transaction boundary.",
        },
      },
      {
        heading: "Step 5 — Concurrency: the question that separates candidates",
        lede: "Four gates, one free spot. Exactly one car may get it.",
        body: [
          "The failure everyone can picture: two gates both read 'B12 is free', both write 'B12 occupied', and two drivers meet at the same space. The fix depends on whether this is a single process or a service with a database, and a good answer covers both.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Idempotency check, then an atomic claim. Nothing is held across a slow operation.",
          actors: [
            { id: "g1", label: "Gate 1" },
            { id: "g2", label: "Gate 2" },
            { id: "svc", label: "ParkingService" },
            { id: "db", label: "Store", sub: "spots + tickets" },
          ],
          messages: [
            { from: "g1", to: "svc", label: "park(car, gate1, req-a)", kind: "call" },
            { from: "g2", to: "svc", label: "park(car, gate2, req-b)", kind: "call", note: "same instant" },
            { from: "svc", to: "db", label: "SELECT ticket WHERE request_id = req-a", kind: "call", note: "idempotency: has this retry already parked?" },
            { from: "svc", to: "db", label: "UPDATE spot SET state='OCCUPIED' WHERE id='B12' AND state='FREE'", kind: "call", tone: "accent", note: "compare-and-set: rows affected decides the winner" },
            { from: "db", to: "svc", label: "1 row (gate 1) / 0 rows (gate 2)", kind: "return" },
            { from: "svc", to: "g1", label: "Ticket(B12)", kind: "return", tone: "ok" },
            { from: "svc", to: "svc", label: "gate 2: retry with the next candidate spot", kind: "self", tone: "warn" },
          ],
        },
        code: [
          {
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
}`,
          },
          {
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
-- SKIP LOCKED is what stops four gates from queueing on the same row.`,
          },
        ],
        bullets: [
          "Never hold a lock across IO — printing a ticket, calling a payment provider, or opening a barrier are all slow and can fail.",
          "Retry on loss, with a bounded number of attempts and the next candidate spot. Under heavy contention, fall back to 'any free spot of a fitting type' rather than fighting over the nearest one.",
          "Idempotency: a gate that times out and retries must get the same ticket, not a second spot. Key on the gate's request id.",
          "Crash recovery: a car parked but no ticket written, or a ticket written and the barrier never opened. Reconcile with a sweeper that looks for HELD spots older than a few minutes.",
          "HELD is a real state, not an implementation detail: it covers the window between choosing a spot and confirming entry, and it needs an expiry.",
        ],
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
}`,
        },
        bullets: [
          "State the rounding rule explicitly — 'every started hour' versus 'per minute' is a product decision and a common source of disputes.",
          "Money is a value object with a currency, never a float. Saying this once is worth several minutes of credibility.",
          "Exit is also a state transition: PARKED → PAID → EXITED. Paying at a kiosk and then taking twenty minutes to reach the barrier is normal, so PAID has a grace window.",
          "Lost ticket is a real requirement: charge a flat maximum, and find the spot by plate via the entry camera.",
        ],
      },
      {
        heading: "Extensions to offer if there is time",
        table: {
          headers: ["Extension", "What it adds to the model", "Trap"],
          rows: [
            ["Reservations", "HELD state with expiry, a reservation entity, a release sweeper", "Held spots that never expire slowly starve the lot"],
            ["EV charging", "Feature on the spot, charging session with its own billing", "Cars that stay plugged in after charging; add an idle fee"],
            ["Monthly passes", "Subscription entity; pricing returns zero but the spot is still tracked", "Pass holders in a full lot — reserve a block for them"],
            ["Multiple lots", "Lot becomes an aggregate; availability is queried across lots", "Cross-lot search is a read model, not a scan of every lot"],
            ["Display boards", "Read model updated on park/unpark events", "Counting free spots on every refresh; keep counters incrementally"],
            ["Valet", "Attendant as an actor, spot chosen without a driver", "Two claims on one spot from valet and gate; same atomicity rules"],
          ],
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "Two cars arrive at two gates at exactly the same time. Walk me through it.",
            a: "Both allocators may pick the same free spot, so the claim has to be atomic. In one process I take a per-level lock, pick and mark inside it, and issue the ticket outside it. Across services I use a conditional UPDATE that only succeeds when the spot is still FREE, or SELECT ... FOR UPDATE SKIP LOCKED so the database hands each gate a different row. The loser retries with the next candidate.",
          },
          {
            q: "How do you find the nearest free spot efficiently?",
            a: "Precompute distance from every spot to every gate — it is static — and keep a min-heap per (gate, spot type) of free spots. Park pops, unpark pushes. That is O(log n) instead of scanning 2,000 spots, and the memory is a few heaps. At realistic sizes a bitset scan per level is also fine and is simpler; I would mention both.",
          },
          {
            q: "The system restarts. What state do you need?",
            a: "Spots and their states, open tickets, and the free index — which I would rebuild from spot state on startup rather than persist, since a derived index that disagrees with the truth is worse than no index. The risky window is a spot marked HELD by a process that died; a sweeper releases holds older than the hold timeout.",
          },
          {
            q: "Where would you put the fee calculation, and why not on Ticket?",
            a: "In a strategy the lot depends on, because pricing changes for reasons that have nothing to do with what a ticket is — promotions, new rate cards, a different building. Ticket holds the facts (spot type, entry, exit) and pricing interprets them. That also makes pricing unit-testable with a fixed clock and no lot at all.",
          },
          {
            q: "How would you test this?",
            a: "Unit tests for the allocator and pricing with a fake clock. A state-machine test for spot transitions that asserts illegal ones throw. And a concurrency test that fires N parallel park() calls against a lot with one free spot and asserts exactly one ticket is issued — that test is the one that catches the bug the interviewer is really asking about.",
          },
        ],
      },
    ],
    related: ["/lld/uml", "/lld/strategy", "/lld/concurrency", "/lld/elevator"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },

  {
    slug: "elevator",
    title: "Design an Elevator System",
    subtitle: "A scheduling problem wearing a state-machine costume.",
    level: "advanced",
    minutes: 20,
    tags: ["machine-coding", "state-machine", "scheduling"],
    summary:
      "Elevator design is asked because it has a genuinely interesting core: a dispatcher choosing which car serves a hall call, and a per-car state machine that must never open its doors between floors. Get the two request types straight, use the SCAN/elevator algorithm, and the rest follows.",
    keyPoints: [
      "Two request types: hall calls (floor + direction, servable by any car) and car calls (destination, bound to one car).",
      "Per-car state machine: IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPENING, DOORS_OPEN, DOORS_CLOSING. Illegal transitions must be impossible.",
      "SCAN (the 'elevator algorithm') beats nearest-first: keep going in one direction, serving stops in order, then reverse.",
      "Dispatch is a strategy scored per car — direction compatibility, distance, current load.",
      "Safety rules override everything: no motion with doors open, obstruction reopens, fire mode recalls all cars.",
    ],
    prerequisites: ["/lld/uml", "/lld/strategy"],
    sections: [
      {
        heading: "Step 1 — Scope",
        followUps: [
          {
            q: "How many cars and floors?",
            a: "Assume 4 cars, 20 floors, with a basement. Multiple cars is the whole point — a single elevator is just a sorted set of stops.",
          },
          {
            q: "What are the request sources?",
            a: "Hall panels on each floor (up/down buttons) and a keypad inside each car. This distinction drives the entire design and is the first thing to state.",
          },
          {
            q: "Optimise for what?",
            a: "Average wait time is the usual objective, with a hard cap on worst-case wait so nobody is starved. I would say I am optimising average wait subject to no request waiting more than ~90 seconds.",
          },
          {
            q: "Special modes?",
            a: "Fire recall (all cars to the ground floor, doors open, out of service), maintenance mode per car, and capacity limits with an overload sensor. Mentioning these shows you have thought about the real machine.",
          },
        ],
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
}`,
        },
        callout: {
          kind: "warn",
          text: "Candidates who model a single 'request floor N' type get stuck immediately: a car travelling up cannot usefully serve someone who wants to go down, and without the direction the dispatcher cannot know that. Get this right in the first two minutes.",
        },
      },
      {
        heading: "Step 3 — The per-car state machine",
        diagram: {
          kind: "flow",
          caption: "Six states. Every transition has a trigger; anything not drawn is illegal.",
          rows: [
            [
              { id: "idle", label: "IDLE", sub: "no pending stops", tone: "accent" },
              { id: "up", label: "MOVING_UP" },
              { id: "down", label: "MOVING_DOWN" },
            ],
            [
              { id: "opening", label: "DOORS_OPENING", tone: "warn" },
              { id: "open", label: "DOORS_OPEN", sub: "dwell timer", tone: "warn" },
              { id: "closing", label: "DOORS_CLOSING", sub: "obstruction → reopen", tone: "warn" },
            ],
            [
              { id: "maint", label: "MAINTENANCE", sub: "out of dispatch", tone: "bad" },
              { id: "fire", label: "FIRE_RECALL", sub: "overrides all", tone: "bad" },
            ],
          ],
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
}`,
        },
        bullets: [
          "DOORS_OPENING and DOORS_CLOSING are separate states, not instants: obstruction during closing is the single most common real event and needs somewhere to live.",
          "Dwell time is a timer in DOORS_OPEN, extended by the door-open button and by the obstruction sensor, with a maximum so a held door does not take the car out of service.",
          "Deceleration means a car cannot always stop at the next floor. Model a commit point: past it, the stop is fixed and a new request for that floor waits for the next pass.",
          "MAINTENANCE and FIRE_RECALL remove the car from dispatch — the dispatcher must ask each car whether it is available rather than assuming.",
        ],
      },
      {
        heading: "Step 4 — SCAN: why 'nearest car' is a trap",
        lede: "Serve every stop in the direction of travel before reversing.",
        body: [
          "The greedy answer — always send the nearest car, always go to the nearest requested floor — starves the far end of the building and produces ping-ponging: the car oscillates around a busy middle floor while floor 19 waits forever.",
          "SCAN, borrowed from disk scheduling, fixes both. Each car keeps two ordered sets of stops: those ahead in its current direction, and those it will pick up after reversing. It sweeps up serving every stop in order, reverses at the top of its set, and sweeps down. Wait time becomes bounded by one full sweep instead of unbounded.",
        ],
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
}`,
        },
        table: {
          headers: ["Policy", "Average wait", "Worst case", "Notes"],
          rows: [
            ["Nearest stop first (greedy)", "Good when idle", "Unbounded — far floors starve", "Ping-pongs around busy floors"],
            ["FCFS per car", "Poor", "Bounded", "Ignores that the car passes floors on the way"],
            ["SCAN / elevator", "Good", "One sweep", "The standard answer; simple to implement"],
            ["LOOK (SCAN, reverse early)", "Slightly better", "One sweep", "Reverses at the last request, not the last floor"],
            ["Destination dispatch", "Best", "Bounded", "Passengers enter destination in the lobby; groups by destination — mention it as the modern approach"],
          ],
        },
        callout: {
          kind: "insight",
          text: "Naming SCAN and its disk-scheduling origin, then noting that real modern buildings use destination dispatch, is a two-sentence answer that lands better than any amount of code.",
        },
      },
      {
        heading: "Step 5 — Dispatching a hall call",
        body: [
          "When a hall call arrives, score every available car and give it to the best one. Scoring is a strategy: the factors are stable but the weights differ per building, and this is where you demonstrate that the design is tunable rather than hard-coded.",
        ],
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
}`,
        },
        bullets: [
          "Load matters: a car at capacity will pass the floor without stopping, so a full car should score badly or be excluded.",
          "Reassignment is legitimate — if a better car becomes free before the call is served, moving it reduces wait. Cap how often, or calls thrash between cars.",
          "Starvation guard: age every waiting call and add its age to the score, so an old call eventually outranks a convenient one.",
          "Duplicate hall calls (five people pressing the same button) must collapse into one request keyed by (floor, direction).",
        ],
        diagram: {
          kind: "sequence",
          caption: "A hall call from floor 7, going down.",
          actors: [
            { id: "p", label: "Hall panel", sub: "floor 7" },
            { id: "d", label: "Dispatcher" },
            { id: "c2", label: "Car 2", sub: "at 12, moving down" },
            { id: "m", label: "Motor + doors" },
          ],
          messages: [
            { from: "p", to: "d", label: "hallCall(7, DOWN)", kind: "call", note: "deduped by (floor, direction)" },
            { from: "d", to: "c2", label: "score? → 5 + 2 stops", kind: "call", note: "on the way, same direction" },
            { from: "d", to: "c2", label: "assign(call)", kind: "call", tone: "ok" },
            { from: "c2", to: "c2", label: "stops.add(7, DOWN)", kind: "self" },
            { from: "c2", to: "m", label: "continue DOWN, stop at 7", kind: "call" },
            { from: "m", to: "c2", label: "arrived", kind: "return" },
            { from: "c2", to: "m", label: "DOORS_OPENING → DOORS_OPEN (dwell 4s)", kind: "call", tone: "warn" },
            { from: "c2", to: "d", label: "call served, clear indicator", kind: "return" },
          ],
        },
      },
      {
        heading: "Step 6 — Safety and the things that actually fail",
        table: {
          headers: ["Concern", "Rule", "Where it lives"],
          rows: [
            ["Motion with doors open", "Physically interlocked; software must also refuse the transition", "Car state machine — a hard invariant, not a policy"],
            ["Obstruction while closing", "Reopen, restart dwell, count reopens and eventually alarm", "DOORS_CLOSING transition"],
            ["Overload", "Refuse to move, sound alarm, hold doors open", "Car; also excludes it from dispatch"],
            ["Fire alarm", "All cars to the designated floor, doors open, out of service", "System-level override that pre-empts the dispatcher"],
            ["Power loss", "Battery lowers the car to the nearest floor and opens", "Outside software's control; model as a state you can enter"],
            ["Car unresponsive", "Watchdog removes it from dispatch, reassigns its hall calls", "Dispatcher — hall calls must survive a car failure"],
          ],
        },
        callout: {
          kind: "interview",
          text: "The reassignment rule is a good thing to volunteer: hall calls belong to the system, so a failed car's hall calls must be redistributed. Car calls die with the car — the people inside are a rescue problem, not a scheduling one.",
        },
      },
      {
        heading: "Interview follow-ups",
        followUps: [
          {
            q: "How do you prevent starvation of a high floor?",
            a: "Two mechanisms. SCAN itself bounds waiting to one sweep, because the car serves every stop in order rather than chasing the nearest. On top of that I age requests: a call's score improves with its wait time, so an old call eventually beats a closer one. I would also monitor p99 wait, since that is where starvation shows up before anyone complains.",
          },
          {
            q: "Four cars, morning rush, everyone going up from the lobby. What changes?",
            a: "Traffic pattern detection. In up-peak, idle cars should park at the lobby instead of where they last stopped, and the dispatcher should favour sending a full car rather than splitting the crowd. The general version of this is destination dispatch: passengers enter their floor in the lobby, and the system groups people going to nearby floors into the same car, which cuts the number of stops per trip dramatically.",
          },
          {
            q: "How do you test a system that is fundamentally about time?",
            a: "Inject the clock and drive the system with an explicit tick(), so a simulated hour runs in milliseconds. Then I can write scenario tests — morning rush, a single request at 3am, a car failing mid-sweep — and assert on wait-time distributions rather than on exact sequences. The state machine gets its own table-driven test asserting every illegal transition throws.",
          },
          {
            q: "Where would concurrency bite here?",
            a: "Button presses arrive from many panels while the control loop is mutating car state. I would funnel all events into a single queue per car and process them in the control loop, so the state machine is single-threaded by construction. That is much easier to reason about than locking a car's fields, and it matches how real controllers work.",
          },
          {
            q: "How would this look as a distributed system?",
            a: "It usually should not be — a building's controller is one process for good safety reasons. If asked anyway: the dispatcher is a leader-elected service, cars are independent state machines reporting position and load, and hall calls are persisted so a dispatcher failover does not lose them. The interesting part is that safety decisions must stay local to the car; you never want a network partition deciding whether doors may open.",
          },
        ],
      },
    ],
    related: ["/lld/parking-lot", "/lld/uml", "/lld/concurrency", "/lld/strategy"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
