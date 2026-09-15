// Imported from the Interview Prep Console (lib/extra-lld.js).
import type { LldAnswer } from "../types";

export const extraLld: LldAnswer[] = [
  {
    id: "x-lld-elevator",
    t: "Design an elevator system",
    src: ["LLDCanvas", "InterviewBit", "ServiceNow"],
    r: 3,
    stmt: "Ranked in the top three LLD questions on every list. The scheduling algorithm is the question; the class model is the frame around it.",
    ask: [
      "How many elevators and floors? (Decides whether dispatch across a fleet matters.)",
      "Optimisation goal — minimise average wait, total travel, or energy?",
      "Are there express elevators, service modes, or floor restrictions?",
      "Capacity limits (weight/people) enforced?",
      "Emergency and maintenance modes in scope?",
    ],
    fr: [
      "External request: a floor + direction button",
      "Internal request: a destination floor inside the car",
      "Move the car, open and close doors, serve stops in a sensible order",
      "Dispatch a request to the best car in a multi-car building",
      "Display current floor and direction",
    ],
    nfr: [
      "Never open doors while moving — invariants must be enforced by the state machine, not by convention",
      "Bounded wait: no floor may be starved",
      "Scheduling must be pluggable (buildings differ)",
      "Thread-safe: requests arrive concurrently from every floor",
    ],
    ent: "**Elevator** (id, currentFloor, direction, state, `TreeSet<Integer> upStops` / `downStops`, capacity). **Request** — `ExternalRequest` (floor, direction) and `InternalRequest` (targetFloor). **ElevatorController** — owns the fleet and dispatches. **SchedulingStrategy** — pluggable (LOOK, nearest-car, energy-optimal). **Direction** (UP/DOWN/IDLE) and **ElevatorState** (IDLE, MOVING, DOOR_OPEN, MAINTENANCE). **Display** — observer.",
    cls: {
      java: "public enum Direction { UP, DOWN, IDLE }\npublic enum ElevatorState { IDLE, MOVING, DOOR_OPEN, MAINTENANCE }\n\npublic class Elevator {\n    private final int id;\n    private int currentFloor = 0;\n    private Direction direction = Direction.IDLE;\n    private ElevatorState state = ElevatorState.IDLE;\n    private final NavigableSet<Integer> upStops = new TreeSet<>();\n    private final NavigableSet<Integer> downStops = new TreeSet<>(Comparator.reverseOrder());\n\n    /** LOOK algorithm: keep going in the current direction, then reverse. */\n    public synchronized void step() {\n        if (state == ElevatorState.MAINTENANCE) return;\n\n        Integer next = nextStop();\n        if (next == null) { direction = Direction.IDLE; state = ElevatorState.IDLE; return; }\n\n        if (next == currentFloor) {\n            openDoors();                      // arrive: doors only here\n            upStops.remove(currentFloor);\n            downStops.remove(currentFloor);\n            return;\n        }\n        state = ElevatorState.MOVING;\n        currentFloor += (next > currentFloor) ? 1 : -1;\n    }\n\n    private Integer nextStop() {\n        if (direction == Direction.UP) {\n            Integer above = upStops.ceiling(currentFloor);\n            if (above != null) return above;\n            direction = downStops.isEmpty() ? Direction.IDLE : Direction.DOWN;\n        }\n        if (direction == Direction.DOWN) {\n            Integer below = downStops.floor(currentFloor);\n            if (below != null) return below;\n            direction = upStops.isEmpty() ? Direction.IDLE : Direction.UP;\n        }\n        if (!upStops.isEmpty()) { direction = Direction.UP; return upStops.first(); }\n        if (!downStops.isEmpty()) { direction = Direction.DOWN; return downStops.first(); }\n        return null;\n    }\n\n    public synchronized void addStop(int floor, Direction requested) {\n        if (requested == Direction.DOWN) downStops.add(floor); else upStops.add(floor);\n        if (direction == Direction.IDLE)\n            direction = floor > currentFloor ? Direction.UP : Direction.DOWN;\n    }\n}\n\npublic interface SchedulingStrategy {\n    Elevator pick(List<Elevator> fleet, ExternalRequest request);\n}\n\npublic class NearestCarStrategy implements SchedulingStrategy {\n    public Elevator pick(List<Elevator> fleet, ExternalRequest r) {\n        return fleet.stream()\n            .filter(e -> e.getState() != ElevatorState.MAINTENANCE)\n            .min(Comparator.comparingInt(e -> cost(e, r)))\n            .orElseThrow();\n    }\n    private int cost(Elevator e, ExternalRequest r) {\n        int distance = Math.abs(e.getCurrentFloor() - r.floor());\n        boolean sameWay = e.getDirection() == r.direction()\n                && ((r.direction() == Direction.UP && r.floor() >= e.getCurrentFloor())\n                 || (r.direction() == Direction.DOWN && r.floor() <= e.getCurrentFloor()));\n        return sameWay ? distance : distance + 100;    // penalise reversals\n    }\n}",
      py: "from enum import Enum\nfrom sortedcontainers import SortedSet   # or bisect on a list\nimport threading\n\nclass Direction(Enum): UP, DOWN, IDLE = 1, -1, 0\nclass State(Enum): IDLE, MOVING, DOOR_OPEN, MAINTENANCE = 0, 1, 2, 3\n\nclass Elevator:\n    def __init__(self, id_):\n        self.id, self.floor = id_, 0\n        self.direction, self.state = Direction.IDLE, State.IDLE\n        self.up_stops, self.down_stops = SortedSet(), SortedSet()\n        self.lock = threading.Lock()\n\n    def add_stop(self, floor, requested=Direction.UP):\n        with self.lock:\n            (self.down_stops if requested is Direction.DOWN else self.up_stops).add(floor)\n            if self.direction is Direction.IDLE:\n                self.direction = Direction.UP if floor > self.floor else Direction.DOWN\n\n    def _next_stop(self):\n        if self.direction is Direction.UP:\n            above = self.up_stops.irange(self.floor)\n            nxt = next(iter(above), None)\n            if nxt is not None:\n                return nxt\n            self.direction = Direction.DOWN if self.down_stops else Direction.IDLE\n        if self.direction is Direction.DOWN:\n            below = list(self.down_stops.irange(maximum=self.floor, reverse=True))\n            if below:\n                return below[0]\n            self.direction = Direction.UP if self.up_stops else Direction.IDLE\n        if self.up_stops:   self.direction = Direction.UP;   return self.up_stops[0]\n        if self.down_stops: self.direction = Direction.DOWN; return self.down_stops[-1]\n        return None\n\n    def step(self):\n        with self.lock:\n            if self.state is State.MAINTENANCE:\n                return\n            nxt = self._next_stop()\n            if nxt is None:\n                self.direction, self.state = Direction.IDLE, State.IDLE\n                return\n            if nxt == self.floor:\n                self.state = State.DOOR_OPEN\n                self.up_stops.discard(self.floor); self.down_stops.discard(self.floor)\n                return\n            self.state = State.MOVING\n            self.floor += 1 if nxt > self.floor else -1",
    },
    pat: [
      "**Strategy** — SchedulingStrategy so LOOK, nearest-car or energy-optimal dispatch swap without touching the car.",
      "**State** — ElevatorState with legal transitions; doors cannot open while moving by construction.",
      "**Observer** — floor displays and building dashboards subscribe to movement events.",
      "**Command** — requests as objects so they can be queued, logged and replayed in tests.",
      "**Singleton (scoped)** — one ElevatorController per building, injected rather than static.",
    ],
    conc: "Requests arrive from every floor at once. The clean model is **one thread (or actor) per elevator** consuming from its own request queue, which removes shared mutable state entirely; the controller only routes. If you keep shared structures, guard each elevator's stop sets with its own lock — never one global lock, or the whole building serialises. Use a fair lock or a bounded queue so no floor starves.",
    ext: [
      "Express elevators: a filter on which floors a car may serve, applied in the dispatch cost function.",
      "Peak-hour modes (morning up-peak): a different SchedulingStrategy selected by time of day.",
      "Capacity: reject internal requests when full and skip full-car stops — a new condition, not a new class.",
      "Destination dispatch (enter your floor in the lobby): changes only the request model and the strategy.",
    ],
    qa: [
      {
        q: "What is the actual algorithm?",
        a: "SCAN/LOOK — the 'elevator algorithm', the same one used for disk head scheduling. Serve every request in the current direction in sorted order, then reverse. Two sorted sets (one per direction) make 'next stop' an O(log n) ceiling/floor lookup. A naive FIFO queue is what interviewers are hoping you avoid, because it makes the car yo-yo.",
      },
      {
        q: "How do you dispatch across multiple cars?",
        a: "Score each car for the request — distance, whether it is already travelling that way, current load — and pick the minimum. Keep it a Strategy: buildings differ, and 'minimise wait' and 'minimise energy' give different answers.",
      },
      {
        q: "How do you prevent starvation?",
        a: "Bound the number of direction reversals before an old request is served, or age requests so their priority rises with wait time. Pure LOOK can starve a floor in a busy building — noticing that unprompted is a strong signal.",
      },
      {
        q: "How would you test it?",
        a: "Inject a clock and drive `step()` manually; assert invariants over randomised request sequences — doors never open while MOVING, no stop is skipped in the current direction, every request is eventually served.",
      },
      {
        q: "Where does this become a distributed system?",
        a: "Building management across hundreds of sites: each building's controller runs locally (it must work with the network down), and the cloud gets telemetry and configuration. Saying that the safety-critical loop stays local is the right instinct.",
      },
    ],
  },
  {
    id: "x-lld-vending",
    t: "Design a vending machine",
    src: ["LLDCanvas", "InterviewBit", "Simplilearn"],
    r: 2,
    stmt: "The classic State-pattern question. Small enough to finish, and it exposes whether you model behaviour as states or as if-chains.",
    ask: [
      "Payment types — coins, notes, card, UPI?",
      "Must it give change, and can it refuse a sale when change is unavailable?",
      "Multiple items per transaction, or one?",
      "Who refills it, and does it need an admin mode?",
      "What happens on a power cut mid-transaction?",
    ],
    fr: [
      "Display items with prices and availability",
      "Accept payment incrementally (coin by coin) and show the running balance",
      "Dispense the item and the correct change",
      "Cancel and refund at any point before dispensing",
      "Admin: refill inventory and collect cash",
    ],
    nfr: [
      "Never dispense without full payment, and never take money without dispensing or refunding",
      "Change calculation must not leave the machine unable to serve the next customer (greedy is not always right)",
      "Every transition legal or rejected — no undefined states",
      "Recover cleanly from a mid-transaction restart",
    ],
    ent: "**VendingMachine** — context holding the current state, inventory, cash box and selection. **State** interface with `selectItem`, `insertCoin`, `dispense`, `cancel` — implemented by **IdleState**, **ItemSelectedState**, **HasMoneyState**, **DispensingState**, **OutOfServiceState**. **Item** / **Slot** (code, item, price, quantity). **CashBox** (denomination → count) with a change algorithm. **Transaction** (selection, amountPaid).",
    cls: {
      java: 'public interface VendingState {\n    void selectItem(VendingMachine m, String code);\n    void insertCoin(VendingMachine m, Coin coin);\n    void dispense(VendingMachine m);\n    void cancel(VendingMachine m);\n}\n\npublic class IdleState implements VendingState {\n    public void selectItem(VendingMachine m, String code) {\n        Slot slot = m.slot(code);\n        if (slot == null || slot.quantity() == 0) { m.display("Sold out"); return; }\n        m.setSelected(slot);\n        m.setState(new ItemSelectedState());\n        m.display("Insert " + slot.price());\n    }\n    public void insertCoin(VendingMachine m, Coin c) { m.refund(c); m.display("Select an item first"); }\n    public void dispense(VendingMachine m) { m.display("Nothing selected"); }\n    public void cancel(VendingMachine m) { /* no-op */ }\n}\n\npublic class HasMoneyState implements VendingState {\n    public void insertCoin(VendingMachine m, Coin c) {\n        m.addToBalance(c);\n        if (m.balance() >= m.selected().price()) m.setState(new DispensingState());\n    }\n    public void dispense(VendingMachine m) { m.display("Insert more money"); }\n    public void selectItem(VendingMachine m, String code) { m.display("Transaction in progress"); }\n    public void cancel(VendingMachine m) {\n        m.refundBalance();\n        m.reset();\n        m.setState(new IdleState());\n    }\n}\n\npublic class DispensingState implements VendingState {\n    public void dispense(VendingMachine m) {\n        int change = m.balance() - m.selected().price();\n        Optional<Map<Coin, Integer>> coins = m.cashBox().makeChange(change);   // may fail!\n        if (coins.isEmpty()) {\n            m.display("Exact change required");\n            m.refundBalance();\n            m.setState(new IdleState());\n            return;\n        }\n        m.selected().decrement();\n        m.cashBox().commit(coins.get());\n        m.deliver(m.selected().item(), coins.get());\n        m.reset();\n        m.setState(new IdleState());\n    }\n    public void selectItem(VendingMachine m, String c) { /* ignored */ }\n    public void insertCoin(VendingMachine m, Coin c) { m.refund(c); }\n    public void cancel(VendingMachine m) { m.refundBalance(); m.setState(new IdleState()); }\n}\n\n/** Change is a coin-change DP, not greedy — greedy fails for odd denominations. */\npublic class CashBox {\n    private final Map<Coin, Integer> inventory = new EnumMap<>(Coin.class);\n\n    public Optional<Map<Coin, Integer>> makeChange(int amount) {\n        // bounded coin change: minimise coins while respecting available counts\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, Integer.MAX_VALUE / 2);\n        dp[0] = 0;\n        Coin[] chosen = new Coin[amount + 1];\n        for (Coin c : inventory.keySet())\n            for (int used = 0; used < inventory.get(c); used++)\n                for (int v = amount; v >= c.value(); v--)\n                    if (dp[v - c.value()] + 1 < dp[v]) { dp[v] = dp[v - c.value()] + 1; chosen[v] = c; }\n        if (dp[amount] >= Integer.MAX_VALUE / 2) return Optional.empty();\n        Map<Coin, Integer> out = new EnumMap<>(Coin.class);\n        for (int v = amount; v > 0; v -= chosen[v].value()) out.merge(chosen[v], 1, Integer::sum);\n        return Optional.of(out);\n    }\n}',
      py: "from abc import ABC, abstractmethod\n\nclass VendingState(ABC):\n    @abstractmethod\n    def select_item(self, m, code): ...\n    @abstractmethod\n    def insert_coin(self, m, coin): ...\n    @abstractmethod\n    def dispense(self, m): ...\n    @abstractmethod\n    def cancel(self, m): ...\n\nclass IdleState(VendingState):\n    def select_item(self, m, code):\n        slot = m.slot(code)\n        if not slot or slot.quantity == 0:\n            return m.display('Sold out')\n        m.selected = slot\n        m.state = ItemSelectedState()\n        m.display(f'Insert {slot.price}')\n    def insert_coin(self, m, coin): m.refund(coin)\n    def dispense(self, m): m.display('Nothing selected')\n    def cancel(self, m): pass\n\nclass HasMoneyState(VendingState):\n    def insert_coin(self, m, coin):\n        m.balance += coin.value\n        if m.balance >= m.selected.price:\n            m.state = DispensingState()\n    def dispense(self, m): m.display('Insert more money')\n    def select_item(self, m, code): m.display('Transaction in progress')\n    def cancel(self, m):\n        m.refund_balance(); m.reset(); m.state = IdleState()\n\nclass DispensingState(VendingState):\n    def dispense(self, m):\n        change = m.balance - m.selected.price\n        coins = m.cash_box.make_change(change)\n        if coins is None:\n            m.display('Exact change required')\n            m.refund_balance()\n            m.state = IdleState()\n            return\n        m.selected.quantity -= 1\n        m.cash_box.commit(coins)\n        m.deliver(m.selected.item, coins)\n        m.reset(); m.state = IdleState()\n    def select_item(self, m, code): pass\n    def insert_coin(self, m, coin): m.refund(coin)\n    def cancel(self, m): m.refund_balance(); m.state = IdleState()",
    },
    pat: [
      "**State** — each state is a class; illegal actions are handled locally instead of by nested ifs.",
      "**Strategy** — payment methods (coin, card, UPI) behind one interface.",
      "**Observer** — display and telemetry react to state changes.",
      "**Factory** — build the machine's slots and inventory from configuration.",
      "**Command** — admin operations (refill, collect) as auditable objects.",
    ],
    conc: "A physical machine has one customer at a time, so a single lock on the transaction is enough — but say the failure mode that matters: a **power cut between taking money and dispensing**. Persist the transaction state (amount paid, selection) to non-volatile storage before dispensing so the machine can refund or complete on restart. That question separates a toy answer from a real one.",
    ext: [
      "Card and UPI payments: another PaymentStrategy plus an authorise/capture flow with a timeout.",
      "Multiple items per transaction: a cart object; the state machine gains a 'building order' state.",
      "Remote telemetry: publish stock and cash levels so refill routes are planned centrally.",
      "Dynamic pricing or promotions: a PricingStrategy consulted at selection time.",
    ],
    qa: [
      {
        q: "Why the State pattern rather than an enum and if-statements?",
        a: "Because every action has a different meaning per state, and if-chains grow quadratically as states and actions multiply. With State, adding 'maintenance mode' is one new class and no edits to existing behaviour — the open/closed principle demonstrated concretely.",
      },
      {
        q: "Is greedy change correct?",
        a: "Not with arbitrary denominations or limited counts. Greedy fails for {1, 3, 4} needing 6, and it fails when you have no 5c coins left. Use bounded coin-change DP, and if change is impossible, refuse the sale and refund — which is exactly what real machines do with 'exact change only'.",
      },
      {
        q: "How do you handle a jam (item not dispensed)?",
        a: "Sensor confirmation before completing: if the dispense sensor does not fire, refund the full amount, mark the slot out of service, and alert. Never assume the mechanical action succeeded.",
      },
      {
        q: "How do you test the state machine?",
        a: "Table-driven tests over (state, action) pairs asserting the next state and the effect, plus randomised action sequences checking invariants: money in equals items out plus change plus refunds.",
      },
    ],
  },
  {
    id: "x-lld-splitwise",
    t: "Design Splitwise (expense sharing)",
    src: ["InterviewBit", "LLDCanvas", "Chakresh list"],
    r: 2,
    stmt: "Model shared expenses, per-person balances, and the settlement that minimises transfers. The balance model is the interesting half.",
    ask: [
      "Split types: equal, exact amounts, percentages, shares?",
      "Groups as well as one-to-one expenses?",
      "Multi-currency?",
      "Do we need simplified settlement (minimum number of transfers)?",
      "Can expenses be edited or deleted after the fact?",
    ],
    fr: [
      "Create an expense with a payer, an amount and a split among participants",
      "Maintain who owes whom, per pair and per group",
      "Show a user's total balance and the breakdown",
      "Settle up (record a payment) and simplify debts",
      "Edit or delete an expense and correct balances",
    ],
    nfr: [
      "Balances must always sum to zero across participants — an invariant you can assert",
      "Money as integer minor units; never floating point",
      "Splits must reconcile exactly (rounding remainders assigned deterministically)",
      "Concurrent expenses in the same group must not corrupt balances",
    ],
    ent: "**User**, **Group** (members). **Expense** (id, groupId, paidBy, amount, currency, SplitStrategy, createdAt, deletedAt). **Split** (userId, amount) — the materialised result of applying a strategy. **SplitStrategy** interface: Equal, Exact, Percentage, Shares. **BalanceSheet** — net balance per (user, counterparty) or per user per group. **SettlementService** — computes the minimum set of transfers. **Transaction/Settlement** record.",
    cls: {
      java: 'public interface SplitStrategy {\n    /** Must return splits whose amounts sum EXACTLY to the expense amount. */\n    List<Split> split(long amountMinor, List<String> participants, List<Long> args);\n}\n\npublic class EqualSplit implements SplitStrategy {\n    public List<Split> split(long amount, List<String> people, List<Long> ignored) {\n        long base = amount / people.size();\n        long remainder = amount % people.size();          // paise that do not divide\n        List<Split> out = new ArrayList<>();\n        for (int i = 0; i < people.size(); i++)\n            out.add(new Split(people.get(i), base + (i < remainder ? 1 : 0)));  // deterministic\n        return out;\n    }\n}\n\npublic class PercentageSplit implements SplitStrategy {\n    public List<Split> split(long amount, List<String> people, List<Long> percents) {\n        if (percents.stream().mapToLong(Long::longValue).sum() != 100)\n            throw new IllegalArgumentException("percentages must total 100");\n        List<Split> out = new ArrayList<>();\n        long assigned = 0;\n        for (int i = 0; i < people.size(); i++) {\n            long share = (i == people.size() - 1) ? amount - assigned          // last absorbs rounding\n                                                  : amount * percents.get(i) / 100;\n            assigned += share;\n            out.add(new Split(people.get(i), share));\n        }\n        return out;\n    }\n}\n\npublic class BalanceSheet {\n    /** net[a][b] > 0 means a owes b */\n    private final Map<String, Map<String, Long>> net = new ConcurrentHashMap<>();\n\n    public synchronized void applyExpense(Expense e) {\n        for (Split s : e.splits()) {\n            if (s.userId().equals(e.paidBy())) continue;\n            adjust(s.userId(), e.paidBy(), s.amount());      // borrower owes payer\n        }\n    }\n\n    private void adjust(String debtor, String creditor, long amount) {\n        net.computeIfAbsent(debtor, k -> new HashMap<>()).merge(creditor, amount, Long::sum);\n        net.computeIfAbsent(creditor, k -> new HashMap<>()).merge(debtor, -amount, Long::sum);\n    }\n\n    public long balanceOf(String user) {\n        return net.getOrDefault(user, Map.of()).values().stream().mapToLong(v -> -v).sum();\n    }\n}\n\n/** Minimum-transfer settlement: net everyone, then match debtors to creditors. */\npublic class SettlementService {\n    public List<Transfer> simplify(Map<String, Long> netBalances) {\n        PriorityQueue<Map.Entry<String, Long>> debtors =\n            new PriorityQueue<>(Map.Entry.comparingByValue());                       // most negative\n        PriorityQueue<Map.Entry<String, Long>> creditors =\n            new PriorityQueue<>(Map.Entry.<String, Long>comparingByValue().reversed());\n        netBalances.forEach((u, v) -> { if (v < 0) debtors.add(Map.entry(u, v)); else if (v > 0) creditors.add(Map.entry(u, v)); });\n\n        List<Transfer> transfers = new ArrayList<>();\n        while (!debtors.isEmpty() && !creditors.isEmpty()) {\n            var d = debtors.poll(); var c = creditors.poll();\n            long amount = Math.min(-d.getValue(), c.getValue());\n            transfers.add(new Transfer(d.getKey(), c.getKey(), amount));\n            long dRem = d.getValue() + amount, cRem = c.getValue() - amount;\n            if (dRem < 0) debtors.add(Map.entry(d.getKey(), dRem));\n            if (cRem > 0) creditors.add(Map.entry(c.getKey(), cRem));\n        }\n        return transfers;\n    }\n}',
      py: "from abc import ABC, abstractmethod\nfrom collections import defaultdict\nimport heapq\n\nclass SplitStrategy(ABC):\n    @abstractmethod\n    def split(self, amount_minor, people, args=None): ...\n\nclass EqualSplit(SplitStrategy):\n    def split(self, amount, people, args=None):\n        base, remainder = divmod(amount, len(people))\n        return [(p, base + (1 if i < remainder else 0)) for i, p in enumerate(people)]\n\nclass PercentageSplit(SplitStrategy):\n    def split(self, amount, people, percents):\n        if sum(percents) != 100:\n            raise ValueError('percentages must total 100')\n        out, assigned = [], 0\n        for i, p in enumerate(people):\n            share = amount - assigned if i == len(people) - 1 else amount * percents[i] // 100\n            assigned += share\n            out.append((p, share))\n        return out\n\nclass BalanceSheet:\n    def __init__(self):\n        self.net = defaultdict(lambda: defaultdict(int))\n\n    def apply_expense(self, paid_by, splits):\n        for user, amount in splits:\n            if user == paid_by:\n                continue\n            self.net[user][paid_by] += amount\n            self.net[paid_by][user] -= amount\n\n    def balance_of(self, user):\n        return -sum(self.net[user].values())\n\ndef simplify(net_balances):\n    debtors = [(v, u) for u, v in net_balances.items() if v < 0]\n    creditors = [(-v, u) for u, v in net_balances.items() if v > 0]\n    heapq.heapify(debtors); heapq.heapify(creditors)\n    transfers = []\n    while debtors and creditors:\n        dv, du = heapq.heappop(debtors)\n        cv, cu = heapq.heappop(creditors)\n        amount = min(-dv, -cv * -1)\n        transfers.append((du, cu, amount))\n        if -dv - amount > 0: heapq.heappush(debtors, (dv + amount, du))\n        if -cv - amount > 0: heapq.heappush(creditors, (cv + amount, cu))\n    return transfers",
    },
    pat: [
      "**Strategy** — SplitStrategy for equal/exact/percentage/shares.",
      "**Command / event sourcing** — expenses as immutable events so edits are corrections, not overwrites.",
      "**Observer** — notifications when someone adds an expense involving you.",
      "**Repository** — balances derived from the expense log, cached for reads.",
    ],
    conc: "Two people adding expenses to the same group concurrently must not corrupt balances. Two workable models: recompute balances from the immutable expense log (safe, and the reason to keep expenses append-only), or update a balance row with an atomic increment / optimistic version. Never read-modify-write a balance in application code.",
    ext: [
      "Multi-currency: store the currency and the rate used at entry time; net per currency, and settle per currency.",
      "Recurring expenses: a schedule that generates expenses (the job-scheduler design applies).",
      "Receipts and attachments: an object-storage key on the expense.",
      "Simplify-debts toggle per group, since some groups prefer explicit pairwise debts.",
    ],
    qa: [
      {
        q: "How do you keep splits exact when the amount does not divide evenly?",
        a: "Work in minor units and distribute the remainder deterministically — first n participants get one extra paise, or the payer absorbs it. Never round each share independently, or the sum drifts from the total; assert `sum(splits) == amount` as an invariant.",
      },
      {
        q: "How does the minimum-transfer settlement work?",
        a: "Net every participant to a single balance, then repeatedly match the largest debtor with the largest creditor. That greedy is optimal for the common case; the truly minimal number of transactions is NP-hard (it is the Optimal Account Balancing problem), so say that the heuristic is a deliberate trade.",
      },
      {
        q: "Pairwise balances or net-per-user?",
        a: "Store pairwise (who owes whom) because users want to see it that way and because simplification should be an explicit user action, not a silent rewrite. Derive net balances from the pairwise map.",
      },
      {
        q: "What happens when an expense is deleted?",
        a: "Append a reversing entry rather than mutating history, so the balance timeline stays auditable and concurrent readers never see a half-applied change.",
      },
    ],
  },
  {
    id: "x-lld-bookmyshow",
    t: "Design BookMyShow / movie ticket booking (LLD)",
    src: ["InterviewBit", "LLDCanvas", "Chakresh list"],
    r: 2,
    stmt: "The class-level counterpart to the ticket-booking system design. Seat locking is the whole exercise.",
    ask: [
      "One cinema or a chain across cities?",
      "How long is a seat held during payment?",
      "Seat categories and dynamic pricing?",
      "Cancellations and refunds?",
      "Does the same design need to serve concerts (any seat map) or only cinema grids?",
    ],
    fr: [
      "Browse cities → cinemas → movies → shows",
      "Show a seat map with live availability",
      "Lock selected seats for a bounded time, then confirm after payment",
      "Cancel a booking and release seats",
      "Prevent double booking absolutely",
    ],
    nfr: [
      "A seat is sold at most once — enforced by the data layer, not by the UI",
      "Locks expire automatically; no client is trusted to release them",
      "Seat map reads may be stale by a second; writes may not",
      "Booking must be idempotent under client retries",
    ],
    ent: "**City → Cinema → Screen → Show** (movie, screen, startTime, pricing). **Seat** (row, number, category) belongs to a Screen; **ShowSeat** (show, seat, status, lockedBy, lockExpiresAt) is the per-show state — separating these two is the modelling insight. **Booking** (user, show, seats, amount, status). **SeatLockProvider** — the concurrency primitive. **PricingStrategy**, **PaymentService**, **NotificationService**.",
    cls: {
      java: "public enum SeatStatus { AVAILABLE, LOCKED, BOOKED }\n\npublic class ShowSeat {\n    private final String showId, seatId;\n    private SeatStatus status = SeatStatus.AVAILABLE;\n    private String lockedBy;\n    private Instant lockExpiresAt;\n    private long version;                        // optimistic lock\n}\n\npublic interface SeatLockProvider {\n    /** Atomically lock ALL seats or none. */\n    void lockSeats(String showId, List<String> seatIds, String userId);\n    void unlockSeats(String showId, List<String> seatIds, String userId);\n    boolean validateLock(String showId, List<String> seatIds, String userId);\n}\n\npublic class DbSeatLockProvider implements SeatLockProvider {\n    private final JdbcTemplate db;\n    private final Duration timeout = Duration.ofMinutes(10);\n\n    @Override\n    @Transactional\n    public void lockSeats(String showId, List<String> seatIds, String userId) {\n        int updated = db.update(\"\"\"\n            UPDATE show_seats\n               SET status = 'LOCKED', locked_by = ?, lock_expires_at = ?, version = version + 1\n             WHERE show_id = ? AND seat_id IN (%s)\n               AND (status = 'AVAILABLE'\n                    OR (status = 'LOCKED' AND lock_expires_at < now()))\n            \"\"\".formatted(placeholders(seatIds)),\n            userId, Instant.now().plus(timeout), showId, seatIds.toArray());\n\n        if (updated != seatIds.size())\n            throw new SeatUnavailableException(seatIds);   // rolls back: all or nothing\n    }\n}\n\npublic class BookingService {\n    private final SeatLockProvider locks;\n    private final PaymentService payments;\n    private final BookingRepository bookings;\n\n    public Booking book(String showId, List<String> seatIds, String userId, String idempotencyKey) {\n        return bookings.findByIdempotencyKey(idempotencyKey).orElseGet(() -> {\n            locks.lockSeats(showId, seatIds, userId);                  // step 1: hold\n            Booking booking = bookings.save(Booking.pending(showId, seatIds, userId, idempotencyKey));\n            try {\n                PaymentResult result = payments.charge(userId, price(showId, seatIds), idempotencyKey);\n                if (!result.success()) throw new PaymentFailedException();\n                if (!locks.validateLock(showId, seatIds, userId))       // step 2: still ours?\n                    throw new LockExpiredException();\n                bookings.confirm(booking, seatIds);                     // step 3: BOOKED in one txn\n                return booking;\n            } catch (RuntimeException e) {\n                locks.unlockSeats(showId, seatIds, userId);\n                bookings.fail(booking);\n                throw e;\n            }\n        });\n    }\n}",
      py: "from datetime import datetime, timedelta\nfrom enum import Enum\n\nclass SeatStatus(Enum):\n    AVAILABLE = 'available'; LOCKED = 'locked'; BOOKED = 'booked'\n\nclass DbSeatLockProvider:\n    def __init__(self, conn, timeout=timedelta(minutes=10)):\n        self.conn, self.timeout = conn, timeout\n\n    def lock_seats(self, show_id, seat_ids, user_id):\n        with self.conn.transaction():\n            updated = self.conn.execute(\n                \"\"\"UPDATE show_seats\n                      SET status='LOCKED', locked_by=%s, lock_expires_at=%s, version=version+1\n                    WHERE show_id=%s AND seat_id = ANY(%s)\n                      AND (status='AVAILABLE'\n                           OR (status='LOCKED' AND lock_expires_at < now()))\"\"\",\n                (user_id, datetime.utcnow() + self.timeout, show_id, seat_ids)).rowcount\n            if updated != len(seat_ids):\n                raise SeatUnavailable(seat_ids)      # transaction rolls back: all or nothing\n\nclass BookingService:\n    def __init__(self, locks, payments, bookings):\n        self.locks, self.payments, self.bookings = locks, payments, bookings\n\n    def book(self, show_id, seat_ids, user_id, idempotency_key):\n        existing = self.bookings.find_by_key(idempotency_key)\n        if existing:\n            return existing\n        self.locks.lock_seats(show_id, seat_ids, user_id)\n        booking = self.bookings.create_pending(show_id, seat_ids, user_id, idempotency_key)\n        try:\n            if not self.payments.charge(user_id, self.price(show_id, seat_ids), idempotency_key).success:\n                raise PaymentFailed()\n            if not self.locks.validate_lock(show_id, seat_ids, user_id):\n                raise LockExpired()\n            return self.bookings.confirm(booking, seat_ids)\n        except Exception:\n            self.locks.unlock_seats(show_id, seat_ids, user_id)\n            self.bookings.fail(booking)\n            raise",
    },
    pat: [
      "**Strategy** — PricingStrategy (weekday/weekend, seat category, dynamic).",
      "**State** — Booking lifecycle PENDING → CONFIRMED → CANCELLED with legal transitions only.",
      "**Repository** — persistence isolated so the lock provider can be swapped (DB, Redis).",
      "**Observer** — notifications and seat-map pushes on state change.",
      "**Facade** — BookingService orchestrates lock, pay, confirm behind one call.",
    ],
    conc: "This is the exam question. The lock must be **atomic across all requested seats**: one conditional UPDATE covering every seat id, checking the affected row count, inside a transaction that rolls back if the count is short. Locks carry an expiry so an abandoned checkout self-heals, and the lock is re-validated after payment because payment can take minutes. A Redis lock is an acceptable alternative for speed, but the database must still be the final arbiter — otherwise a Redis failover can sell a seat twice.",
    ext: [
      "General-admission events: the seat map becomes a counter, and the same conditional update decrements it.",
      "Waiting list for sold-out shows: a queue that grabs seats on cancellation.",
      "Seat recommendations (best available n together): a scan over the row layout — a nice extension question.",
      "Multi-city chains: shard by cinema, since a booking never spans cinemas.",
    ],
    qa: [
      {
        q: "Why not `SELECT ... FOR UPDATE`?",
        a: "It works, but it holds locks across user think-time if you are not careful, and multi-seat selections can deadlock unless you order seat ids consistently. The conditional UPDATE with an affected-row check gives the same guarantee without holding a transaction open, and it is the version I would ship.",
      },
      {
        q: "Where do you store the lock — database or Redis?",
        a: "Redis for speed and automatic TTL, the database for truth. If you use only Redis, a failover or eviction can lose a lock and oversell. A common production answer is Redis for the interactive hold and a database conditional update at confirmation.",
      },
      {
        q: "How do you show live seat availability to hundreds of users?",
        a: "Push updates over WebSocket from a cache rather than polling the database, and accept that the view is a second stale — the authoritative check happens at lock time and returns a clean 409.",
      },
      {
        q: "What if payment succeeds after the lock expired?",
        a: "Validate the lock after payment; if it expired and the seats are gone, refund automatically and tell the user immediately. This is why the payment must be idempotent and refundable, and why the check exists in the code above.",
      },
    ],
  },
  {
    id: "x-lld-logging",
    t: "Design a logging framework (log4j-style)",
    src: ["Chakresh list", "InterviewBit"],
    r: 2,
    stmt: "A small design that exposes Chain of Responsibility, Strategy and thread-safety all at once — which is why it recurs.",
    ask: [
      "Which levels, and should they be configurable per logger?",
      "Where do logs go — console, file, network, multiple at once?",
      "Synchronous or asynchronous writing?",
      "Structured (JSON) or plain text?",
      "Rolling files by size or time?",
    ],
    fr: [
      "Log at DEBUG/INFO/WARN/ERROR/FATAL",
      "Configure a minimum level per logger or package",
      "Write to multiple destinations simultaneously",
      "Pluggable formatting (plain, JSON, with context fields)",
      "Rolling and retention for file output",
    ],
    nfr: [
      "Must never crash or block the application — logging is not worth an outage",
      "Low overhead when a level is disabled (no string building)",
      "Thread safe with many concurrent writers",
      "Ordered within a thread; global ordering is not required",
    ],
    ent: "**Logger** (name, level, appenders) obtained from a **LoggerFactory** (one instance per name). **LogLevel** enum with ordering. **LogEvent** (level, message, timestamp, thread, context, throwable). **Appender** interface — Console, File, Rolling File, Network, Async wrapper. **Formatter/Layout** — plain, JSON. **Filter** chain. **LogManager** — configuration and lifecycle.",
    cls: {
      java: 'public enum LogLevel { DEBUG(10), INFO(20), WARN(30), ERROR(40), FATAL(50);\n    private final int severity;\n    LogLevel(int s) { severity = s; }\n    boolean allows(LogLevel other) { return other.severity >= this.severity; }\n}\n\npublic interface Appender extends AutoCloseable {\n    void append(LogEvent event);\n}\n\npublic interface Formatter { String format(LogEvent event); }\n\npublic class Logger {\n    private final String name;\n    private volatile LogLevel level;                       // hot-reloadable\n    private final List<Appender> appenders = new CopyOnWriteArrayList<>();\n\n    public void info(String template, Object... args) { log(LogLevel.INFO, template, args, null); }\n    public void error(String msg, Throwable t)        { log(LogLevel.ERROR, msg, new Object[0], t); }\n\n    private void log(LogLevel lvl, String template, Object[] args, Throwable t) {\n        if (!level.allows(lvl)) return;                    // cheap early exit: no formatting\n        LogEvent event = new LogEvent(lvl, format(template, args), Instant.now(),\n                                      Thread.currentThread().getName(), MDC.snapshot(), t);\n        for (Appender a : appenders) {\n            try { a.append(event); }\n            catch (Exception e) { /* never propagate a logging failure */ }\n        }\n    }\n}\n\n/** Async wrapper: the caller never touches IO. */\npublic class AsyncAppender implements Appender {\n    private final BlockingQueue<LogEvent> queue = new ArrayBlockingQueue<>(10_000);\n    private final Appender delegate;\n    private final Thread worker;\n    private volatile boolean running = true;\n\n    public AsyncAppender(Appender delegate) {\n        this.delegate = delegate;\n        this.worker = new Thread(this::drain, "log-writer");\n        worker.setDaemon(true);\n        worker.start();\n    }\n\n    @Override\n    public void append(LogEvent e) {\n        if (!queue.offer(e)) {            // BOUNDED: drop rather than block the app\n            droppedCounter.increment();\n        }\n    }\n\n    private void drain() {\n        List<LogEvent> batch = new ArrayList<>(256);\n        while (running || !queue.isEmpty()) {\n            queue.drainTo(batch, 256);\n            for (LogEvent e : batch) delegate.append(e);   // batched IO\n            batch.clear();\n        }\n    }\n}\n\npublic class RollingFileAppender implements Appender {\n    private final Formatter formatter;\n    private final long maxBytes;\n    private BufferedWriter writer;\n    private long written;\n\n    @Override\n    public synchronized void append(LogEvent e) {\n        String line = formatter.format(e);\n        writer.write(line); writer.newLine();\n        written += line.length() + 1;\n        if (written > maxBytes) roll();                   // rename + reopen\n    }\n}',
      py: "import logging_queue, threading, queue, time\nfrom abc import ABC, abstractmethod\nfrom enum import IntEnum\n\nclass LogLevel(IntEnum):\n    DEBUG = 10; INFO = 20; WARN = 30; ERROR = 40; FATAL = 50\n\nclass Appender(ABC):\n    @abstractmethod\n    def append(self, event): ...\n\nclass Logger:\n    def __init__(self, name, level=LogLevel.INFO):\n        self.name, self.level = name, level\n        self.appenders = []\n\n    def _log(self, level, template, args, exc=None):\n        if level < self.level:\n            return                                  # no formatting cost\n        event = {'level': level, 'msg': template.format(*args),\n                 'ts': time.time(), 'thread': threading.current_thread().name,\n                 'ctx': dict(CONTEXT), 'exc': exc}\n        for appender in self.appenders:\n            try:\n                appender.append(event)\n            except Exception:\n                pass                                # never propagate\n\n    def info(self, template, *args):  self._log(LogLevel.INFO, template, args)\n    def error(self, template, *args, exc=None): self._log(LogLevel.ERROR, template, args, exc)\n\nclass AsyncAppender(Appender):\n    def __init__(self, delegate, capacity=10_000):\n        self.delegate = delegate\n        self.q = queue.Queue(maxsize=capacity)      # bounded\n        self.dropped = 0\n        threading.Thread(target=self._drain, daemon=True).start()\n\n    def append(self, event):\n        try:\n            self.q.put_nowait(event)\n        except queue.Full:\n            self.dropped += 1                       # drop, never block\n\n    def _drain(self):\n        while True:\n            batch = [self.q.get()]\n            while len(batch) < 256:\n                try: batch.append(self.q.get_nowait())\n                except queue.Empty: break\n            for event in batch:\n                self.delegate.append(event)",
    },
    pat: [
      "**Strategy** — Formatter/Layout and Appender destinations.",
      "**Decorator** — AsyncAppender wraps any appender to move IO off the caller's thread.",
      "**Chain of Responsibility** — filters and parent-logger delegation by name hierarchy.",
      "**Singleton / Registry** — LoggerFactory returns one Logger per name.",
      "**Observer** — configuration changes push new levels to live loggers.",
    ],
    conc: "The rule that matters: **logging must never block or fail the application**. Use a bounded queue with a drop policy rather than an unbounded one (which turns a slow disk into an OutOfMemoryError), batch writes on a background thread, make the level field `volatile` so hot reconfiguration is visible without locking, and use `CopyOnWriteArrayList` for the appender list (read-heavy, rarely written). Guard the file writer with its own lock — not a global one.",
    ext: [
      "Structured/JSON output: another Formatter.",
      "Network appenders (syslog, HTTP) with retry and circuit breaking — and never synchronous.",
      "Sampling for noisy DEBUG logs: a Filter that passes 1 in N.",
      "Context propagation (trace id, tenant) via MDC-style thread-local or a context object.",
    ],
    qa: [
      {
        q: "Why check the level before formatting the message?",
        a: 'Because string concatenation and boxing cost more than the check itself. That is also why modern APIs use parameterised templates (`log.debug("user {} did {}", id, action)`) or supplier lambdas — the arguments are only rendered if the level passes.',
      },
      {
        q: "What happens when the disk fills or the network appender stalls?",
        a: "The bounded queue fills and events are dropped, with a counter exposed as a metric and an alert. The alternative — blocking the caller — turns a logging problem into an application outage, which is the failure mode this design exists to prevent.",
      },
      {
        q: "How do parent/child loggers work?",
        a: "Loggers are named hierarchically (`com.acme.billing`), and an unconfigured logger inherits level and appenders from its nearest configured ancestor. Chain of Responsibility, applied to configuration lookup.",
      },
      {
        q: "How would you guarantee no log is lost on crash?",
        a: "You cannot fully with an async appender — say so. Options: flush synchronously for ERROR and above, add a shutdown hook that drains the queue, or write to a local file that a shipper tails (so a process crash does not lose what the OS already has).",
      },
    ],
  },
  {
    id: "x-lld-pubsub",
    t: "Design a pub-sub system (in-process message broker)",
    src: ["InterviewBit", "LLDCanvas", "Chakresh list"],
    r: 2,
    stmt: "The LLD counterpart to the Kafka system design: topics, subscribers, offsets and backpressure at class level, with concurrency as the main event.",
    ask: [
      "In-process only, or across machines? (In-process for LLD.)",
      "Do subscribers get every message (broadcast) or is it work-sharing?",
      "Must messages be retained for replay, or discarded after delivery?",
      "Delivery guarantee — at-most-once or at-least-once?",
      "What happens when one subscriber is slow?",
    ],
    fr: [
      "Create topics; publish messages to a topic",
      "Subscribe and unsubscribe at runtime",
      "Each subscriber receives messages in publish order",
      "Consumer groups: within a group, each message goes to one member",
      "Replay from an offset (if retention is enabled)",
    ],
    nfr: [
      "A slow subscriber must not block the publisher or other subscribers",
      "Thread safe for concurrent publish and subscribe",
      "Bounded memory — retention and queue sizes are explicit",
      "Ordered per topic partition, not globally",
    ],
    ent: "**Broker** — registry of topics. **Topic** (name, partitions, retention). **Partition** — an append-only list plus a monotonic offset. **Message** (id, payload, timestamp, key). **Subscriber** (id, handler) and **SubscriberGroup** (shared offsets). **Dispatcher** — one worker per (partition, group) delivering in order. **OffsetStore**.",
    cls: {
      java: "public class Topic {\n    private final String name;\n    private final List<Partition> partitions;\n\n    Partition partitionFor(String key) {\n        int idx = key == null ? ThreadLocalRandom.current().nextInt(partitions.size())\n                              : Math.floorMod(key.hashCode(), partitions.size());\n        return partitions.get(idx);        // key decides ordering domain\n    }\n}\n\npublic class Partition {\n    private final List<Message> log = new CopyOnWriteArrayList<>();   // append-only\n    private final AtomicLong nextOffset = new AtomicLong();\n\n    long append(Message m) {\n        long offset = nextOffset.getAndIncrement();\n        log.add(m.withOffset(offset));\n        return offset;\n    }\n\n    List<Message> readFrom(long offset, int max) {\n        int from = (int) Math.min(offset, log.size());\n        return log.subList(from, Math.min(from + max, log.size()));\n    }\n}\n\npublic class Broker {\n    private final Map<String, Topic> topics = new ConcurrentHashMap<>();\n    private final Map<String, SubscriberGroup> groups = new ConcurrentHashMap<>();\n\n    public long publish(String topicName, String key, byte[] payload) {\n        Topic topic = topics.computeIfAbsent(topicName, Topic::new);\n        return topic.partitionFor(key).append(new Message(key, payload, Instant.now()));\n    }\n\n    public void subscribe(String topicName, String groupId, MessageHandler handler) {\n        SubscriberGroup group = groups.computeIfAbsent(groupId,\n                id -> new SubscriberGroup(id, topics.get(topicName)));\n        group.addSubscriber(handler);      // triggers a rebalance of partitions\n    }\n}\n\n/** One dispatcher thread per (partition, group): ordering without locks. */\npublic class Dispatcher implements Runnable {\n    private final Partition partition;\n    private final MessageHandler handler;\n    private final OffsetStore offsets;\n    private final String groupId;\n\n    public void run() {\n        while (!Thread.currentThread().isInterrupted()) {\n            long offset = offsets.get(groupId, partition.id());\n            List<Message> batch = partition.readFrom(offset, 100);\n            if (batch.isEmpty()) { sleepBriefly(); continue; }\n\n            for (Message m : batch) {\n                try {\n                    handler.onMessage(m);                        // slow handler slows only itself\n                    offsets.commit(groupId, partition.id(), m.offset() + 1);\n                } catch (Exception e) {\n                    if (!retryWithBackoff(m, handler)) {\n                        deadLetter.publish(m, e);\n                        offsets.commit(groupId, partition.id(), m.offset() + 1);  // skip poison\n                    }\n                }\n            }\n        }\n    }\n}",
      py: "import threading, queue, time\nfrom collections import defaultdict\n\nclass Partition:\n    def __init__(self, id_):\n        self.id, self.log, self.lock = id_, [], threading.Lock()\n\n    def append(self, message):\n        with self.lock:\n            message.offset = len(self.log)\n            self.log.append(message)\n            return message.offset\n\n    def read_from(self, offset, max_count=100):\n        with self.lock:\n            return self.log[offset:offset + max_count]\n\nclass Broker:\n    def __init__(self, partitions_per_topic=4):\n        self.topics = defaultdict(lambda: [Partition(i) for i in range(partitions_per_topic)])\n        self.offsets = defaultdict(int)        # (group, topic, partition) -> offset\n        self.lock = threading.Lock()\n\n    def publish(self, topic, key, payload):\n        parts = self.topics[topic]\n        idx = hash(key) % len(parts) if key is not None else 0\n        return parts[idx].append(Message(key, payload))\n\n    def subscribe(self, topic, group, handler):\n        for partition in self.topics[topic]:\n            threading.Thread(target=self._dispatch, args=(topic, partition, group, handler),\n                             daemon=True).start()\n\n    def _dispatch(self, topic, partition, group, handler):\n        key = (group, topic, partition.id)\n        while True:\n            batch = partition.read_from(self.offsets[key])\n            if not batch:\n                time.sleep(0.05); continue\n            for message in batch:\n                try:\n                    handler(message)\n                    self.offsets[key] = message.offset + 1\n                except Exception:\n                    self.offsets[key] = message.offset + 1   # or retry / dead-letter\n",
    },
    pat: [
      "**Observer** — the core publish/subscribe relationship.",
      "**Strategy** — partitioning (key hash, round robin) and retry policies.",
      "**Producer/consumer with bounded queues** — the backpressure mechanism.",
      "**Registry** — broker maps topic names to topics and group ids to groups.",
      "**Decorator** — wrap handlers with retry, metrics or tracing without changing them.",
    ],
    conc: "The design decision that answers the 'slow subscriber' question: **one dispatcher thread per (partition, group)** with its own offset, so each subscriber consumes at its own pace and ordering within a partition is preserved without any locking between subscribers. The publisher only appends — append is O(1) and lock-free (or guarded briefly). Use bounded queues or a retention limit so a subscriber that never catches up cannot exhaust memory; drop or block explicitly rather than by accident.",
    ext: [
      "Persistence: swap the in-memory log for a file-backed segment store and the design becomes a small Kafka.",
      "Wildcard topic subscriptions (`orders.*`): a matching layer at subscribe time.",
      "Priority topics: separate partitions with weighted dispatch.",
      "Dead-letter topic and replay API for poison messages.",
    ],
    qa: [
      {
        q: "Why partition at all in an in-process broker?",
        a: "To get parallelism while keeping ordering. All messages with the same key go to one partition, so order is preserved per key while different keys process concurrently — the same trade-off Kafka makes, and the reason 'global ordering' is a scalability trap.",
      },
      {
        q: "How do you stop a slow subscriber from blocking others?",
        a: "Each subscriber group has its own offset and its own dispatcher thread, so a slow handler only grows its own lag. If the handler must not fall behind, put a bounded queue in front of it and define what happens when it fills — drop, block, or shed to a dead-letter topic.",
      },
      {
        q: "At-least-once or at-most-once?",
        a: "Committing the offset *after* the handler returns gives at-least-once (a crash replays the last message), committing before gives at-most-once. Pick at-least-once and require idempotent handlers, which is what every real system does.",
      },
      {
        q: "How would you add retries without blocking the partition?",
        a: "Bounded in-line retries with backoff for transient failures, then move the message to a retry topic with a delay (or a dead-letter topic) so the partition keeps flowing. Blocking a partition on one poisoned message is the classic production incident.",
      },
    ],
  },
];
