// Imported from the Interview Prep Console (lib/data-lld-a.js).
import type { LldAnswer } from "../types";

export const lldA: LldAnswer[] = [
  {
    id: "lld-playbook",
    t: "How to run an LLD round (the 45-minute script)",
    src: ["L3", "L4", "S6", "S7"],
    r: 2,
    playbook: true,
    stmt: "LLD and machine-coding rounds run 60–90 minutes, sometimes on paper, often with two interviewers. They are scored on modelling, not on syntax. This is the running order that keeps you in control of the clock.",
    ask: [
      "Scope: which flows must work end to end, and which are out of scope for today?",
      "Scale: single process, or does this run behind multiple app servers? (This decides whether in-memory state is acceptable.)",
      "Persistence: in-memory for the exercise, or do you want the repository interfaces and schema too?",
      "Concurrency: multiple threads or requests hitting the same object? (The answer is nearly always yes — assume it and say so.)",
      "Extensibility: which dimension is expected to change — new policies, new types, new channels? That is where the abstraction goes.",
    ],
    fr: [
      "Minutes 0–5: clarify and write the use cases as verbs on the board (bookSlot, overrideShift, evaluateFlag).",
      "Minutes 5–10: nouns → entities, with the one-line responsibility of each. Say which are value objects and which are entities with identity.",
      "Minutes 10–20: interfaces first — the ports (repositories, notifiers, clocks) and the strategy that varies.",
      "Minutes 20–40: write the core classes. Real method bodies for the interesting logic, stubs for CRUD.",
      'Minutes 40–50: concurrency, failure handling and one extension ("if we add X tomorrow, only class Y changes").',
      "Minutes 50+: their follow-ups. Leave room for them.",
    ],
    nfr: [
      "Name patterns only where you actually used one — Strategy, Factory, Observer, Builder, State. Sprinkling pattern names without a reason is a known negative signal.",
      "Inject the clock (Clock / TimeProvider) instead of calling System.currentTimeMillis() — it makes the design testable and interviewers notice.",
      "Program to interfaces for anything that touches IO; keep domain classes free of framework annotations.",
      'Say the SOLID principle you are applying in plain words ("adding a new eviction policy should not modify the cache class") rather than reciting the acronym.',
    ],
    qa: [
      {
        q: "Should I write full code or just class skeletons?",
        a: "Skeletons plus real bodies for the 2–3 methods that carry the logic. Interviewers report that candidates who write getters and setters for 40 minutes run out of time before reaching concurrency.",
      },
      {
        q: "They keep adding requirements mid-round. Why?",
        a: "That is the test — they are checking whether your abstraction absorbs the change or forces a rewrite. Answer with 'that is a new implementation of interface X' whenever it truthfully is.",
      },
      {
        q: "Do they expect thread safety in every LLD?",
        a: "Yes at Lead level. Even if you keep the core single-threaded, say which object is shared, what the race is, and what you would use (immutability, ConcurrentHashMap, a striped lock, or an actor/queue per key).",
      },
    ],
  },
  {
    id: "lld-cache",
    t: "Design a cache system (LLD)",
    src: ["L3", "S4", "S8"],
    r: 2,
    stmt: "Design an in-process cache with pluggable eviction, TTL, and thread safety. This is the LLD form of the LRU coding question, and several companies ask both in the same loop.",
    ask: [
      "Is this in-process only, or a shared cache across app servers? (In-process → this design; shared → Redis, and the conversation becomes HLD.)",
      "Bounded by entry count or by memory footprint?",
      "Which eviction policies must be supported today — LRU only, or LRU/LFU/FIFO configurable?",
      "Do we need per-entry TTL, or one global TTL?",
      "On a miss, does the cache load the value itself (read-through) or return empty and let the caller load?",
      "Are stale reads acceptable during a refresh, or must a reader block?",
    ],
    fr: [
      "get(key), put(key, value), put(key, value, ttl), remove(key), clear()",
      "Evict by a configurable policy when capacity is reached",
      "Expire entries by TTL, lazily on read and eagerly via a sweeper",
      "Optional read-through loader and write-through writer",
      "Expose stats: hit rate, miss rate, eviction count, size",
    ],
    nfr: [
      "O(1) get and put",
      "Thread safe under concurrent readers and writers",
      "No unbounded memory growth — capacity is a hard limit",
      "Adding a new eviction policy must not modify the cache class (open/closed)",
    ],
    ent: "**Cache<K,V>** — the facade the caller uses. **CacheEntry<V>** — value + createdAt + expiresAt + lastAccess. **EvictionPolicy<K>** — strategy that tracks access order and names a victim. **Storage<K,V>** — the map behind it (so you can swap in an off-heap map). **CacheLoader<K,V>** — read-through. **StatsCounter** and **RemovalListener** — observability and callbacks.",
    cls: {
      java: '// ---------- strategy: eviction ----------\npublic interface EvictionPolicy<K> {\n    void keyAccessed(K key);     // on get or update\n    void keyAdded(K key);\n    void keyRemoved(K key);\n    K evictKey();                // which key must go\n}\n\npublic class LruPolicy<K> implements EvictionPolicy<K> {\n    private final LinkedHashSet<K> order = new LinkedHashSet<>();   // insertion order = recency\n\n    public synchronized void keyAccessed(K key) { order.remove(key); order.add(key); }\n    public synchronized void keyAdded(K key)    { order.add(key); }\n    public synchronized void keyRemoved(K key)  { order.remove(key); }\n    public synchronized K evictKey() {\n        Iterator<K> it = order.iterator();\n        if (!it.hasNext()) return null;\n        K victim = it.next(); it.remove();\n        return victim;\n    }\n}\n// LfuPolicy / FifoPolicy implement the same interface — the Cache never changes.\n\n// ---------- entry ----------\nfinal class CacheEntry<V> {\n    final V value;\n    final long expiresAt;             // Long.MAX_VALUE when no TTL\n    volatile long lastAccess;\n\n    CacheEntry(V value, long expiresAt, long now) {\n        this.value = value; this.expiresAt = expiresAt; this.lastAccess = now;\n    }\n    boolean isExpired(long now) { return now >= expiresAt; }\n}\n\n// ---------- the cache ----------\npublic class InMemoryCache<K, V> {\n    private final int capacity;\n    private final Map<K, CacheEntry<V>> store = new ConcurrentHashMap<>();\n    private final EvictionPolicy<K> policy;\n    private final Clock clock;                     // injected: testable TTL\n    private final CacheLoader<K, V> loader;        // nullable: read-through\n    private final RemovalListener<K, V> onRemoval; // nullable\n    private final LongAdder hits = new LongAdder(), misses = new LongAdder();\n\n    public InMemoryCache(int capacity, EvictionPolicy<K> policy, Clock clock,\n                         CacheLoader<K, V> loader, RemovalListener<K, V> onRemoval) {\n        if (capacity <= 0) throw new IllegalArgumentException("capacity must be > 0");\n        this.capacity = capacity; this.policy = policy; this.clock = clock;\n        this.loader = loader; this.onRemoval = onRemoval;\n    }\n\n    public Optional<V> get(K key) {\n        CacheEntry<V> e = store.get(key);\n        long now = clock.millis();\n        if (e != null && !e.isExpired(now)) {\n            e.lastAccess = now;\n            policy.keyAccessed(key);\n            hits.increment();\n            return Optional.of(e.value);\n        }\n        if (e != null) evict(key, RemovalCause.EXPIRED);   // lazy expiry\n        misses.increment();\n\n        if (loader == null) return Optional.empty();\n        // read-through, single-flight: only one thread loads a given key\n        CacheEntry<V> loaded = store.computeIfAbsent(key, k -> {\n            V v = loader.load(k);\n            policy.keyAdded(k);\n            return new CacheEntry<>(v, loader.ttlMillis() == 0\n                    ? Long.MAX_VALUE : now + loader.ttlMillis(), now);\n        });\n        enforceCapacity();\n        return Optional.ofNullable(loaded).map(x -> x.value);\n    }\n\n    public void put(K key, V value, long ttlMillis) {\n        long now = clock.millis();\n        long expiry = ttlMillis <= 0 ? Long.MAX_VALUE : now + ttlMillis;\n        CacheEntry<V> previous = store.put(key, new CacheEntry<>(value, expiry, now));\n        if (previous == null) policy.keyAdded(key); else policy.keyAccessed(key);\n        enforceCapacity();\n    }\n\n    private void enforceCapacity() {\n        while (store.size() > capacity) {\n            K victim = policy.evictKey();\n            if (victim == null) return;\n            evict(victim, RemovalCause.SIZE);\n        }\n    }\n\n    private void evict(K key, RemovalCause cause) {\n        CacheEntry<V> removed = store.remove(key);\n        policy.keyRemoved(key);\n        if (removed != null && onRemoval != null) onRemoval.onRemoval(key, removed.value, cause);\n    }\n\n    public double hitRate() {\n        long h = hits.sum(), m = misses.sum();\n        return (h + m) == 0 ? 0 : (double) h / (h + m);\n    }\n}',
      py: "from abc import ABC, abstractmethod\nfrom collections import OrderedDict\nfrom dataclasses import dataclass\nimport threading, time\n\nclass EvictionPolicy(ABC):\n    @abstractmethod\n    def key_accessed(self, key): ...\n    @abstractmethod\n    def key_added(self, key): ...\n    @abstractmethod\n    def key_removed(self, key): ...\n    @abstractmethod\n    def evict_key(self): ...\n\nclass LruPolicy(EvictionPolicy):\n    def __init__(self):\n        self.order = OrderedDict()\n    def key_accessed(self, key): self.order.move_to_end(key)\n    def key_added(self, key): self.order[key] = True\n    def key_removed(self, key): self.order.pop(key, None)\n    def evict_key(self):\n        return self.order.popitem(last=False)[0] if self.order else None\n\n@dataclass\nclass CacheEntry:\n    value: object\n    expires_at: float\n    last_access: float\n    def is_expired(self, now): return now >= self.expires_at\n\nclass InMemoryCache:\n    def __init__(self, capacity, policy=None, clock=time.time, loader=None, on_removal=None):\n        if capacity <= 0: raise ValueError('capacity must be > 0')\n        self.capacity, self.policy = capacity, policy or LruPolicy()\n        self.clock, self.loader, self.on_removal = clock, loader, on_removal\n        self.store, self.lock = {}, threading.RLock()\n        self.hits = self.misses = 0\n\n    def get(self, key):\n        with self.lock:\n            now = self.clock()\n            e = self.store.get(key)\n            if e and not e.is_expired(now):\n                e.last_access = now\n                self.policy.key_accessed(key)\n                self.hits += 1\n                return e.value\n            if e:\n                self._evict(key, 'EXPIRED')\n            self.misses += 1\n            if not self.loader:\n                return None\n            value = self.loader(key)\n            self.put(key, value)\n            return value\n\n    def put(self, key, value, ttl=None):\n        with self.lock:\n            now = self.clock()\n            expires = now + ttl if ttl else float('inf')\n            existed = key in self.store\n            self.store[key] = CacheEntry(value, expires, now)\n            self.policy.key_accessed(key) if existed else self.policy.key_added(key)\n            while len(self.store) > self.capacity:\n                victim = self.policy.evict_key()\n                if victim is None: break\n                self._evict(victim, 'SIZE')\n\n    def _evict(self, key, cause):\n        entry = self.store.pop(key, None)\n        self.policy.key_removed(key)\n        if entry and self.on_removal:\n            self.on_removal(key, entry.value, cause)\n\n    def hit_rate(self):\n        total = self.hits + self.misses\n        return self.hits / total if total else 0.0",
    },
    pat: [
      "**Strategy** — EvictionPolicy, so LRU/LFU/FIFO swap without touching the cache.",
      "**Builder** — CacheBuilder for the six optional knobs (capacity, ttl, loader, listener, policy, clock) instead of a telescoping constructor.",
      "**Observer** — RemovalListener notifies on eviction/expiry (used for write-behind and metrics).",
      "**Dependency injection** — Clock injected so TTL is testable without sleeping in tests.",
      "**Decorator** — a StatsCache or a LoggingCache can wrap any Cache implementation.",
    ],
    conc: "Say this unprompted. A single global lock is correct but serialises all readers. Three levels of answer: (1) ConcurrentHashMap for the store plus a lock only around the eviction bookkeeping; (2) **lock striping** — N segments each with its own map and policy, key routed by hash(key) % N, so contention drops by a factor of N and eviction is per segment (this is how Java 7 ConcurrentHashMap and Guava's LocalCache work); (3) buffer read events in a ring buffer and replay them under a tryLock so reads never block (Caffeine). Also mention the **cache stampede**: use computeIfAbsent or a per-key lock so only one thread loads a missing hot key.",
    ext: [
      "Write-through / write-behind: add a CacheWriter and a queue that batches writes to the DB.",
      "Refresh-ahead: reload an entry asynchronously at 80% of its TTL so readers never see a miss.",
      "Off-heap or disk tier: implement Storage over a memory-mapped file — the Cache class is untouched.",
      "Distributed: replace Storage with a Redis client, add consistent hashing and per-key TTL; now the LLD becomes the HLD question.",
    ],
    qa: [
      {
        q: "Why LinkedHashSet in the LRU policy and not a doubly linked list?",
        a: "LinkedHashSet gives O(1) remove-and-reinsert with far less code on a whiteboard. If they push on allocation, switch to an intrusive doubly linked list with a HashMap of key → node, which is the version from the coding round.",
      },
      {
        q: "How do you expire entries that are never read again?",
        a: "Lazy expiry alone leaks memory for cold keys. Add a background sweeper on a ScheduledExecutorService sampling a slice of the keyspace, or a hierarchical timing wheel keyed by expiry bucket for O(1) scheduling. Redis uses sampling plus a lazy check; say that.",
      },
      {
        q: "Cache invalidation across 20 app servers?",
        a: "In-process caches drift. Options: short TTLs and accept staleness; a pub/sub invalidation channel (Redis pub/sub or Kafka topic) that broadcasts key invalidations; or a shared Redis as the source of truth with the local cache as an L1. Name the trade-off: L1+L2 gives speed but a window of inconsistency.",
      },
      {
        q: "How do you test it?",
        a: "Inject a FakeClock to advance time without sleeping; assert eviction order with a deterministic policy; run a concurrency test with an ExecutorService and assert size never exceeds capacity; use a RemovalListener to assert the cause of each eviction.",
      },
      {
        q: "What is the difference between your cache and Guava/Caffeine?",
        a: "Caffeine uses W-TinyLFU admission (a frequency sketch decides whether a new entry is even worth admitting), which beats LRU on scan-heavy workloads. Knowing that admission policy matters, not just eviction policy, reads as senior.",
      },
    ],
  },
  {
    id: "lld-roster",
    t: "Design an employee roster / on-call management system (like PagerDuty)",
    src: ["L4"],
    r: 2,
    star: true,
    stmt: "The Hyderabad Lead loop's round-2 question, 75 minutes on paper, scored Strong Hire. Design the LLD for on-call schedules: rotations, shifts, overrides, escalation and 'who is on call right now'.",
    ask: [
      "Is this scheduling only, or does it also receive incidents and page people? (Scope to schedule + escalation; paging is a downstream service.)",
      "Rotation types needed: daily, weekly, custom N-hour rotations? Multiple layers per schedule?",
      "Do we need overrides (someone takes a colleague's shift for 3 hours)?",
      "Time zones — is a schedule defined in the team's zone with per-user display, and must it survive daylight-saving changes?",
      "Escalation: fixed levels with a timeout, or round-robin within a level?",
      "Read pattern: how often is 'who is on call' asked? (High — it is on the incident hot path, so it must be fast and cacheable.)",
      "Can two people be on call simultaneously for the same layer (primary/secondary)?",
    ],
    fr: [
      "Create a schedule for a team with one or more rotation layers",
      "Generate concrete shifts from a rotation rule for any time window",
      "Apply overrides that win over generated shifts",
      "Query: who is on call for team T at time X (and for a range)",
      "Escalation policy: level 1 → wait N minutes unacknowledged → level 2 → …",
      "Notify on shift start/end and on hand-off",
      "Show a calendar view of the next N weeks",
    ],
    nfr: [
      "'Who is on call now' must answer in single-digit milliseconds — it blocks incident routing",
      "Deterministic: the same rotation rule always generates the same shifts (idempotent generation)",
      "Correct across DST and leap seconds — store UTC instants, carry the IANA zone id for rendering",
      "Auditable: every override and escalation is recorded with who and when",
      "Extensible to new rotation types without touching the query path",
    ],
    ent: "**User** (id, name, contactMethods, timezone). **Team** (id, members). **Schedule** (id, team, timezone, layers). **RotationLayer** (order, participants, RotationRule, startAt, handoffTime). **RotationRule** (strategy: Daily / Weekly / CustomHours). **Shift** (userId, layer, start, end, source = GENERATED | OVERRIDE). **Override** (userId, start, end, createdBy). **EscalationPolicy** (ordered levels). **EscalationLevel** (targets, timeoutMinutes, target type USER | SCHEDULE | TEAM). **OnCallResolver** — the read-side service. **NotificationService** — port.",
    cls: {
      java: '// ---------- rotation strategy ----------\npublic interface RotationRule {\n    /** Shifts covering [from, to), deterministic for the same inputs. */\n    List<Shift> generate(RotationLayer layer, Instant from, Instant to);\n}\n\npublic class RoundRobinRotation implements RotationRule {\n    private final Duration period;        // 24h daily, 168h weekly, or custom\n\n    public RoundRobinRotation(Duration period) { this.period = period; }\n\n    @Override\n    public List<Shift> generate(RotationLayer layer, Instant from, Instant to) {\n        List<User> people = layer.getParticipants();\n        if (people.isEmpty()) return List.of();\n\n        List<Shift> shifts = new ArrayList<>();\n        long periodSeconds = period.getSeconds();\n        long elapsed = Duration.between(layer.getStartAt(), from).getSeconds();\n        long index = Math.floorDiv(elapsed, periodSeconds);         // floorDiv handles from < startAt\n        Instant cursor = layer.getStartAt().plusSeconds(index * periodSeconds);\n\n        while (cursor.isBefore(to)) {\n            Instant end = cursor.plus(period);\n            User person = people.get((int) Math.floorMod(index, people.size()));\n            shifts.add(new Shift(person.getId(), layer.getOrder(), cursor, end, ShiftSource.GENERATED));\n            cursor = end;\n            index++;\n        }\n        return shifts;\n    }\n}\n\n// ---------- the read path ----------\npublic class OnCallResolver {\n    private final ScheduleRepository schedules;\n    private final OverrideRepository overrides;\n    private final Cache<String, List<Shift>> shiftCache;    // key: scheduleId|dayBucket\n\n    /** Who is on call for this schedule at this instant, ordered primary first. */\n    public List<OnCallAssignment> whoIsOnCall(String scheduleId, Instant at) {\n        Schedule schedule = schedules.require(scheduleId);\n        List<OnCallAssignment> result = new ArrayList<>();\n\n        for (RotationLayer layer : schedule.getLayersOrdered()) {\n            // 1. an override always wins\n            Optional<Override> override = overrides.findCovering(scheduleId, layer.getOrder(), at);\n            if (override.isPresent()) {\n                result.add(new OnCallAssignment(override.get().getUserId(), layer.getOrder(), ShiftSource.OVERRIDE));\n                continue;\n            }\n            // 2. otherwise the generated shift for this instant\n            shiftsFor(schedule, layer, at).stream()\n                .filter(s -> s.covers(at))\n                .findFirst()\n                .ifPresent(s -> result.add(new OnCallAssignment(s.getUserId(), layer.getOrder(), ShiftSource.GENERATED)));\n        }\n        return result;    // layer 0 = primary, layer 1 = secondary\n    }\n\n    private List<Shift> shiftsFor(Schedule schedule, RotationLayer layer, Instant at) {\n        Instant dayStart = at.truncatedTo(ChronoUnit.DAYS);\n        String key = schedule.getId() + "|" + layer.getOrder() + "|" + dayStart;\n        return shiftCache.get(key, k ->\n                layer.getRule().generate(layer, dayStart, dayStart.plus(Duration.ofDays(1))));\n    }\n}\n\n// ---------- escalation ----------\npublic class EscalationPolicy {\n    private final List<EscalationLevel> levels;   // ordered\n\n    public Optional<EscalationLevel> next(int currentLevel) {\n        int n = currentLevel + 1;\n        return n < levels.size() ? Optional.of(levels.get(n)) : Optional.empty();\n    }\n}\n\npublic class EscalationEngine {\n    private final OnCallResolver resolver;\n    private final NotificationService notifier;\n    private final TimerService timers;            // injected: schedule a callback\n\n    public void start(Incident incident) { fire(incident, 0); }\n\n    private void fire(Incident incident, int levelIndex) {\n        EscalationPolicy policy = incident.getPolicy();\n        policy.next(levelIndex - 1).ifPresentOrElse(level -> {\n            for (Target target : level.getTargets())\n                for (String userId : resolveTargets(target, Instant.now()))\n                    notifier.page(userId, incident);\n\n            // re-check after the timeout; acknowledged incidents stop the chain\n            timers.schedule(level.getTimeout(), () -> {\n                if (!incident.isAcknowledged()) fire(incident, levelIndex + 1);\n            });\n        }, () -> notifier.notifyNobodyAnswered(incident));\n    }\n\n    private List<String> resolveTargets(Target target, Instant at) {\n        return switch (target.getType()) {\n            case USER     -> List.of(target.getId());\n            case SCHEDULE -> resolver.whoIsOnCall(target.getId(), at).stream()\n                                     .map(OnCallAssignment::getUserId).toList();\n            case TEAM     -> teamMembers(target.getId());\n        };\n    }\n}',
      py: "from abc import ABC, abstractmethod\nfrom dataclasses import dataclass\nfrom datetime import datetime, timedelta, timezone\nfrom enum import Enum\n\nclass ShiftSource(Enum):\n    GENERATED = 'generated'\n    OVERRIDE = 'override'\n\n@dataclass(frozen=True)\nclass Shift:\n    user_id: str\n    layer: int\n    start: datetime\n    end: datetime\n    source: ShiftSource\n    def covers(self, at): return self.start <= at < self.end\n\nclass RotationRule(ABC):\n    @abstractmethod\n    def generate(self, layer, frm, to): ...\n\nclass RoundRobinRotation(RotationRule):\n    def __init__(self, period: timedelta):\n        self.period = period\n\n    def generate(self, layer, frm, to):\n        people = layer.participants\n        if not people:\n            return []\n        secs = self.period.total_seconds()\n        elapsed = (frm - layer.start_at).total_seconds()\n        index = int(elapsed // secs)\n        cursor = layer.start_at + timedelta(seconds=index * secs)\n        out = []\n        while cursor < to:\n            end = cursor + self.period\n            out.append(Shift(people[index % len(people)].id, layer.order,\n                             cursor, end, ShiftSource.GENERATED))\n            cursor, index = end, index + 1\n        return out\n\nclass OnCallResolver:\n    def __init__(self, schedules, overrides, cache):\n        self.schedules, self.overrides, self.cache = schedules, overrides, cache\n\n    def who_is_on_call(self, schedule_id, at):\n        schedule = self.schedules.require(schedule_id)\n        result = []\n        for layer in schedule.layers_ordered():\n            ov = self.overrides.find_covering(schedule_id, layer.order, at)\n            if ov:\n                result.append((ov.user_id, layer.order, ShiftSource.OVERRIDE))\n                continue\n            day = at.replace(hour=0, minute=0, second=0, microsecond=0)\n            key = f'{schedule_id}|{layer.order}|{day.isoformat()}'\n            shifts = self.cache.get(key) or layer.rule.generate(layer, day, day + timedelta(days=1))\n            self.cache.put(key, shifts)\n            hit = next((s for s in shifts if s.covers(at)), None)\n            if hit:\n                result.append((hit.user_id, layer.order, ShiftSource.GENERATED))\n        return result",
    },
    pat: [
      "**Strategy** — RotationRule (daily / weekly / custom / follow-the-sun) behind one interface.",
      "**Chain of Responsibility** — escalation levels pass the incident along until someone acknowledges.",
      "**Repository** — ScheduleRepository / OverrideRepository keep persistence out of the domain.",
      "**Decorator / layering** — overrides decorate generated shifts rather than mutating them, so the generator stays pure.",
      "**Observer** — shift start/end and hand-off events notify subscribers (Slack, email, mobile push).",
    ],
    conc: "Generation is pure and deterministic, so it parallelises trivially and can be cached hard. The mutable points are overrides and acknowledgements. Guard overrides with an optimistic version column (or a DB exclusion constraint on overlapping ranges per layer) so two managers cannot create conflicting overrides — in Postgres, EXCLUDE USING gist (schedule_id WITH =, tstzrange(start, end) WITH &&). Acknowledgement is a compare-and-set on incident status so only the first responder wins, and the escalation timer must re-read state rather than trust a captured object.",
    ext: [
      "Follow-the-sun rotation: a new RotationRule that picks the participant whose local time falls in business hours.",
      "Shift swaps requiring approval: a SwapRequest entity plus a state machine (REQUESTED → APPROVED → APPLIED as an override).",
      "Vacation / unavailability: a filter in the resolver that skips a user and promotes the next participant.",
      "Multi-region: the resolver is read-only and cacheable, so it can run as a read replica close to the incident pipeline.",
    ],
    qa: [
      {
        q: "Why generate shifts on the fly instead of storing every shift row?",
        a: "A weekly rotation for 5 years is thousands of rows per layer that must be regenerated whenever the rule or the participant list changes. Generating from the rule keeps one row of truth; materialise only overrides and a rolling window (say 90 days) as a cache/calendar view.",
      },
      {
        q: "How do you handle daylight saving?",
        a: "Store instants in UTC, store the schedule's IANA zone (Asia/Kolkata, America/Los_Angeles), and compute hand-off times using ZonedDateTime in that zone. A 09:00 local hand-off stays 09:00 local across a DST switch, which means the underlying UTC instant moves by an hour — and one shift that week is 23 or 25 hours long. Say that explicitly; it is the detail interviewers look for.",
      },
      {
        q: "Two overrides overlap. What happens?",
        a: "Reject at write time with a range-overlap constraint, or define a precedence rule (most recently created wins) and record both in the audit log. Never silently pick one at read time — that makes 'who was paged' unexplainable after an incident.",
      },
      {
        q: "How do you make whoIsOnCall fast enough for the incident path?",
        a: "Cache per (schedule, layer, day) since generation is deterministic; invalidate on rule change or override write. Precompute the next 24 hours into Redis with the current on-call as a single key. Fall back to live generation on a miss — it is only a few microseconds of arithmetic.",
      },
      {
        q: "How would you test the escalation engine?",
        a: "Inject a FakeTimerService and a FakeClock so timeouts fire on command; assert that an acknowledgement before the timeout stops the chain, that nobody is paged twice for the same level, and that exhausting all levels triggers the fallback notification.",
      },
      {
        q: "The DB is down. What does 'who is on call' return?",
        a: "Serve the last known schedule from cache and mark the answer stale, then page the whole team as a fallback rather than nobody. Degrading to over-paging is the right failure mode for an incident system — saying that out loud is a Lead-level answer.",
      },
    ],
  },
  {
    id: "lld-ratelimiter",
    t: "Design a rate limiter (LLD)",
    src: ["L2", "L3", "L6", "S2", "S4", "S10"],
    r: 2,
    star: true,
    stmt: "The most repeated design question in the whole set. This card is the class-level answer; the distributed system answer is in the HLD tab.",
    ask: [
      "What is the limit keyed on — API key, user, IP, or (tenant, endpoint) pair? For a multi-tenant product, expect (account, endpoint).",
      "Fixed quota per window, or smooth rate with bursts allowed?",
      "One process or many app servers sharing the limit?",
      "On rejection: HTTP 429 with a Retry-After header, or queue the request?",
      "Do different plans get different limits (free vs enterprise)? — this decides whether the config is a lookup or a constant.",
      "Is exceeding slightly acceptable (approximate) or must it be exact?",
    ],
    fr: [
      "allow(key) → ALLOW or DENY with the remaining quota and reset time",
      "Per-tenant and per-endpoint configurable limits, changeable at runtime",
      "Multiple algorithms supported behind one interface",
      "Emit metrics: allowed, throttled, near-limit",
    ],
    nfr: [
      "O(1) per decision, under 1 ms added latency",
      "Thread safe; must not become the bottleneck it protects",
      "Fail open (allow) if the limiter store is unavailable — a rate limiter must not take the API down",
      "Memory bounded: keys expire",
    ],
    ent: "**RateLimiter** interface with a single method. **TokenBucket / SlidingWindowLog / SlidingWindowCounter / FixedWindowCounter / LeakyBucket** — implementations. **RateLimitPolicy** (limit, window, burst) resolved per (tenant, endpoint). **RateLimiterFactory** — picks the implementation from config. **Decision** (allowed, remaining, retryAfter). **Clock** — injected.",
    cls: {
      java: "public interface RateLimiter {\n    Decision tryAcquire(String key, int permits);\n}\n\npublic record Decision(boolean allowed, long remaining, Duration retryAfter) {}\n\n/** Token bucket: smooth rate + controlled burst. The default choice. */\npublic class TokenBucketLimiter implements RateLimiter {\n    private final double refillPerSecond;\n    private final double capacity;          // = burst size\n    private final Clock clock;\n    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();\n\n    private static final class Bucket {\n        double tokens;\n        long lastRefillNanos;\n        Bucket(double tokens, long now) { this.tokens = tokens; this.lastRefillNanos = now; }\n    }\n\n    @Override\n    public Decision tryAcquire(String key, int permits) {\n        Bucket b = buckets.computeIfAbsent(key, k -> new Bucket(capacity, clock.nanoTime()));\n        synchronized (b) {                                   // lock per key, not global\n            long now = clock.nanoTime();\n            double elapsedSeconds = (now - b.lastRefillNanos) / 1_000_000_000.0;\n            b.tokens = Math.min(capacity, b.tokens + elapsedSeconds * refillPerSecond);\n            b.lastRefillNanos = now;\n\n            if (b.tokens >= permits) {\n                b.tokens -= permits;\n                return new Decision(true, (long) b.tokens, Duration.ZERO);\n            }\n            double deficit = permits - b.tokens;\n            long waitMillis = (long) Math.ceil(deficit / refillPerSecond * 1000);\n            return new Decision(false, 0, Duration.ofMillis(waitMillis));\n        }\n    }\n}\n\n/** Sliding window counter: fixed-window memory with far less edge burst. */\npublic class SlidingWindowCounterLimiter implements RateLimiter {\n    private final int limit;\n    private final long windowMillis;\n    private final Clock clock;\n    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();\n\n    private static final class Window { long index; int current; int previous; }\n\n    @Override\n    public Decision tryAcquire(String key, int permits) {\n        Window w = windows.computeIfAbsent(key, k -> new Window());\n        synchronized (w) {\n            long now = clock.millis();\n            long idx = now / windowMillis;\n            if (idx != w.index) {\n                w.previous = (idx == w.index + 1) ? w.current : 0;\n                w.current = 0;\n                w.index = idx;\n            }\n            double overlap = 1.0 - (now % windowMillis) / (double) windowMillis;\n            double estimate = w.previous * overlap + w.current;   // weighted estimate\n\n            if (estimate + permits <= limit) {\n                w.current += permits;\n                return new Decision(true, (long) (limit - estimate - permits), Duration.ZERO);\n            }\n            return new Decision(false, 0, Duration.ofMillis(windowMillis - (now % windowMillis)));\n        }\n    }\n}",
      py: "import threading, time, math\nfrom abc import ABC, abstractmethod\nfrom dataclasses import dataclass\n\n@dataclass\nclass Decision:\n    allowed: bool\n    remaining: int\n    retry_after: float\n\nclass RateLimiter(ABC):\n    @abstractmethod\n    def try_acquire(self, key, permits=1): ...\n\nclass TokenBucketLimiter(RateLimiter):\n    def __init__(self, refill_per_second, capacity, clock=time.monotonic):\n        self.rate, self.capacity, self.clock = refill_per_second, capacity, clock\n        self.buckets, self.lock = {}, threading.Lock()\n\n    def try_acquire(self, key, permits=1):\n        with self.lock:\n            tokens, last = self.buckets.get(key, (self.capacity, self.clock()))\n            now = self.clock()\n            tokens = min(self.capacity, tokens + (now - last) * self.rate)\n            if tokens >= permits:\n                self.buckets[key] = (tokens - permits, now)\n                return Decision(True, int(tokens - permits), 0.0)\n            self.buckets[key] = (tokens, now)\n            return Decision(False, 0, math.ceil((permits - tokens) / self.rate))\n\nclass SlidingWindowCounterLimiter(RateLimiter):\n    def __init__(self, limit, window_seconds, clock=time.time):\n        self.limit, self.window, self.clock = limit, window_seconds, clock\n        self.state, self.lock = {}, threading.Lock()\n\n    def try_acquire(self, key, permits=1):\n        with self.lock:\n            now = self.clock()\n            idx = int(now // self.window)\n            prev_idx, current, previous = self.state.get(key, (idx, 0, 0))\n            if idx != prev_idx:\n                previous = current if idx == prev_idx + 1 else 0\n                current = 0\n            overlap = 1.0 - (now % self.window) / self.window\n            estimate = previous * overlap + current\n            if estimate + permits <= self.limit:\n                self.state[key] = (idx, current + permits, previous)\n                return Decision(True, int(self.limit - estimate - permits), 0.0)\n            self.state[key] = (idx, current, previous)\n            return Decision(False, 0, self.window - (now % self.window))",
    },
    pat: [
      "**Strategy** — RateLimiter interface; token bucket, leaky bucket, fixed/sliding window are interchangeable.",
      "**Factory** — RateLimiterFactory builds the right limiter from a policy record.",
      "**Decorator** — a MetricsRateLimiter wraps any limiter to record allow/deny counts.",
      "**Flyweight-ish** — one bucket object per key in a ConcurrentHashMap, with expiry so keys do not accumulate.",
    ],
    conc: "Lock per bucket, never a global lock — synchronized(b) inside a ConcurrentHashMap gives per-key serialisation with no cross-key contention. For the distributed case the whole check must be atomic, which means a Redis Lua script (read tokens, refill, compare, write, all in one round trip) or Redis INCR + EXPIRE for the counter algorithms. Mention that a non-atomic get-then-set across servers lets N replicas each allow the last token.",
    ext: [
      "Per-plan limits: resolve RateLimitPolicy from a config service with a local cache and a TTL.",
      "Concurrency limiter (max in-flight requests) instead of rate: a semaphore per key — a different implementation of the same interface.",
      "Cost-weighted limits: permits > 1 for expensive endpoints — already supported by the signature.",
      "Queueing instead of rejecting: wrap with a leaky bucket that admits at a constant rate and shed load after a max queue depth.",
    ],
    qa: [
      {
        q: "Which algorithm would you actually ship, and why?",
        a: "Token bucket for public APIs: it allows a controlled burst (real clients are bursty) while bounding the long-run rate, and it needs only two numbers per key. Sliding window counter when you must report an exact 'X requests in the last minute' to customers. Fixed window only when memory is the binding constraint — it permits 2× the limit across a window boundary.",
      },
      {
        q: "How do you make it exact across 20 app servers?",
        a: "Centralise the counter in Redis with an atomic Lua script keyed by (tenant, endpoint, window). Exactness costs a network hop per request — so many systems take the pragmatic route: each server enforces limit/N locally and reconciles asynchronously, accepting small overshoot. State the trade-off; that is the answer they grade.",
      },
      {
        q: "What happens when Redis is down?",
        a: "Fail open with a conservative local limiter. A rate limiter that fails closed turns a cache outage into a full API outage. Add a circuit breaker so you stop hammering Redis, and alert.",
      },
      {
        q: "How do you stop the map from growing forever?",
        a: "Expire idle buckets — a scheduled sweep, a Caffeine cache with expireAfterAccess, or Redis TTLs equal to the window. Interviewers ask this because it is the classic production leak.",
      },
      {
        q: "What do you return to the client?",
        a: "HTTP 429 with Retry-After, plus X-RateLimit-Limit / Remaining / Reset headers on every response, so well-behaved clients self-throttle instead of retrying blind. Add jitter guidance for client backoff to avoid a synchronised retry storm.",
      },
    ],
  },
  {
    id: "lld-parking",
    t: "Design a parking lot",
    src: ["S5", "L2"],
    r: 2,
    stmt: "The classic LLD warm-up. It is asked both as an LLD and, in senior hiring-manager rounds, as an HLD of a parking system — clarify which before you start.",
    ask: [
      "How many floors and entry/exit gates?",
      "Vehicle types and whether a bike may take a car spot (size compatibility rules)?",
      "Pricing: flat hourly, slab based (first hour X then Y), or per vehicle type?",
      "Payment: cash at exit, online, or both? Do we need refunds?",
      "Is there a display board per floor showing free counts?",
      "Reservations in advance, or first come first served?",
    ],
    fr: [
      "Park a vehicle: assign the nearest compatible free spot and issue a ticket",
      "Unpark: compute the fee from the duration and the rate strategy, take payment, free the spot",
      "Query free spots per floor and per type",
      "Support multiple entry and exit gates concurrently",
    ],
    nfr: [
      "No double allocation of a spot under concurrent gates",
      "O(1) spot allocation per type — do not scan every spot",
      "Pricing and allocation strategies pluggable without touching the lot",
      "Consistent state after a crash: a ticket is either issued with a spot held, or not issued",
    ],
    ent: "**ParkingLot** (floors, gates). **ParkingFloor** (spots, display board). **ParkingSpot** (id, type, isFree, vehicle). **Vehicle** (number, type). **Ticket** (id, spotId, vehicle, entryTime). **Invoice** (ticket, exitTime, amount). **SpotAllocationStrategy** (nearest-to-entry, lowest floor first, random). **PricingStrategy** (hourly, slab, per-type). **PaymentProcessor** (cash, card, UPI). **EntryGate / ExitGate**.",
    cls: {
      java: "public enum VehicleType { BIKE, CAR, TRUCK }\npublic enum SpotType { SMALL, MEDIUM, LARGE;\n    static SpotType smallestFor(VehicleType v) {\n        return switch (v) { case BIKE -> SMALL; case CAR -> MEDIUM; case TRUCK -> LARGE; };\n    }\n}\n\npublic class ParkingSpot {\n    private final String id; private final SpotType type; private final int floor;\n    private final AtomicReference<Vehicle> occupant = new AtomicReference<>();\n\n    /** atomic claim: two gates cannot both win */\n    boolean tryOccupy(Vehicle v) { return occupant.compareAndSet(null, v); }\n    void release() { occupant.set(null); }\n    boolean isFree() { return occupant.get() == null; }\n}\n\npublic interface SpotAllocationStrategy {\n    Optional<ParkingSpot> findSpot(List<ParkingFloor> floors, VehicleType type);\n}\n\npublic class NearestFirstAllocation implements SpotAllocationStrategy {\n    // per floor, per type: a queue of free spot ids -> O(1) pop instead of scanning\n    public Optional<ParkingSpot> findSpot(List<ParkingFloor> floors, VehicleType type) {\n        SpotType needed = SpotType.smallestFor(type);\n        for (ParkingFloor floor : floors) {                 // floors ordered by distance\n            Optional<ParkingSpot> spot = floor.pollFree(needed);\n            if (spot.isPresent()) return spot;\n        }\n        return Optional.empty();\n    }\n}\n\npublic interface PricingStrategy { Money priceFor(Ticket t, Instant exit); }\n\npublic class SlabPricing implements PricingStrategy {\n    private final Money firstHour; private final Money perExtraHour;\n    public Money priceFor(Ticket t, Instant exit) {\n        long hours = Math.max(1, Duration.between(t.getEntryTime(), exit).toHours() +\n                (Duration.between(t.getEntryTime(), exit).toMinutesPart() > 0 ? 1 : 0));\n        return firstHour.plus(perExtraHour.times(hours - 1));\n    }\n}\n\npublic class ParkingLotService {\n    private final List<ParkingFloor> floors;\n    private final SpotAllocationStrategy allocation;\n    private final PricingStrategy pricing;\n    private final TicketRepository tickets;\n    private final PaymentProcessor payments;\n    private final Clock clock;\n\n    public Ticket park(Vehicle vehicle) {\n        ParkingSpot spot = allocation.findSpot(floors, vehicle.getType())\n                .orElseThrow(() -> new LotFullException(vehicle.getType()));\n        if (!spot.tryOccupy(vehicle))                       // lost the race: retry once\n            return park(vehicle);\n        Ticket ticket = new Ticket(UUID.randomUUID().toString(), spot.getId(), vehicle, clock.instant());\n        tickets.save(ticket);\n        floors.get(spot.getFloor()).board().decrement(spot.getType());\n        return ticket;\n    }\n\n    public Invoice unpark(String ticketId, PaymentMethod method) {\n        Ticket ticket = tickets.require(ticketId);\n        Instant exit = clock.instant();\n        Money amount = pricing.priceFor(ticket, exit);\n        payments.charge(method, amount);                    // throws -> spot stays held\n        ParkingSpot spot = spotById(ticket.getSpotId());\n        spot.release();\n        floors.get(spot.getFloor()).board().increment(spot.getType());\n        return new Invoice(ticket, exit, amount);\n    }\n}",
      py: "from abc import ABC, abstractmethod\nfrom dataclasses import dataclass, field\nfrom datetime import datetime, timedelta\nfrom enum import Enum\nimport threading, uuid\n\nclass VehicleType(Enum): BIKE, CAR, TRUCK = 1, 2, 3\nclass SpotType(Enum): SMALL, MEDIUM, LARGE = 1, 2, 3\n\nSMALLEST_FOR = {VehicleType.BIKE: SpotType.SMALL,\n                VehicleType.CAR: SpotType.MEDIUM,\n                VehicleType.TRUCK: SpotType.LARGE}\n\nclass ParkingSpot:\n    def __init__(self, id_, type_, floor):\n        self.id, self.type, self.floor = id_, type_, floor\n        self.occupant, self._lock = None, threading.Lock()\n\n    def try_occupy(self, vehicle):\n        with self._lock:\n            if self.occupant is None:\n                self.occupant = vehicle\n                return True\n            return False\n\n    def release(self):\n        with self._lock:\n            self.occupant = None\n\nclass SpotAllocationStrategy(ABC):\n    @abstractmethod\n    def find_spot(self, floors, vehicle_type): ...\n\nclass NearestFirstAllocation(SpotAllocationStrategy):\n    def find_spot(self, floors, vehicle_type):\n        needed = SMALLEST_FOR[vehicle_type]\n        for floor in floors:\n            spot = floor.poll_free(needed)\n            if spot:\n                return spot\n        return None\n\nclass PricingStrategy(ABC):\n    @abstractmethod\n    def price_for(self, ticket, exit_time): ...\n\nclass SlabPricing(PricingStrategy):\n    def __init__(self, first_hour, per_extra_hour):\n        self.first, self.extra = first_hour, per_extra_hour\n    def price_for(self, ticket, exit_time):\n        minutes = (exit_time - ticket.entry_time).total_seconds() / 60\n        hours = max(1, -(-minutes // 60))       # ceil\n        return self.first + self.extra * (hours - 1)\n\nclass ParkingLotService:\n    def __init__(self, floors, allocation, pricing, tickets, payments, clock=datetime.utcnow):\n        self.floors, self.allocation, self.pricing = floors, allocation, pricing\n        self.tickets, self.payments, self.clock = tickets, payments, clock\n\n    def park(self, vehicle):\n        spot = self.allocation.find_spot(self.floors, vehicle.type)\n        if not spot:\n            raise LotFullError(vehicle.type)\n        if not spot.try_occupy(vehicle):\n            return self.park(vehicle)\n        ticket = Ticket(str(uuid.uuid4()), spot.id, vehicle, self.clock())\n        self.tickets.save(ticket)\n        return ticket\n\n    def unpark(self, ticket_id, method):\n        ticket = self.tickets.require(ticket_id)\n        exit_time = self.clock()\n        amount = self.pricing.price_for(ticket, exit_time)\n        self.payments.charge(method, amount)\n        self.spot_by_id(ticket.spot_id).release()\n        return Invoice(ticket, exit_time, amount)",
    },
    pat: [
      "**Strategy** — SpotAllocationStrategy and PricingStrategy, the two axes that change per site.",
      "**Factory** — build the right PricingStrategy per lot / per vehicle type from config.",
      "**Singleton (scoped)** — one ParkingLot aggregate per site, injected rather than a static instance.",
      "**Observer** — DisplayBoard subscribes to spot occupied/freed events.",
      "**State** — Ticket lifecycle ISSUED → PAID → CLOSED, with illegal transitions rejected.",
    ],
    conc: "Multiple gates allocate concurrently, so spot claiming must be atomic: compareAndSet on the spot (single JVM) or a conditional DB update — UPDATE spot SET status='OCCUPIED' WHERE id=? AND status='FREE' — checking that one row was affected. Keep per-floor, per-type free lists in a ConcurrentLinkedQueue so allocation is O(1) rather than scanning thousands of spots under a lock. Payment must happen before the spot is released, and the release plus board update should be in one transaction with an idempotency key on the ticket so a retried exit does not double charge.",
    ext: [
      "EV charging spots: a new SpotType plus a compatibility matrix — the allocator does not change.",
      "Reservations: a Reservation entity that holds a spot with a TTL; allocation skips held spots.",
      "Dynamic pricing (surge when occupancy > 80%): a new PricingStrategy reading live occupancy.",
      "Multiple sites: ParkingLot becomes an aggregate per site with its own repositories; add a site-selection service.",
    ],
    qa: [
      {
        q: "How do you find the nearest free spot without scanning?",
        a: "Maintain per (floor, spotType) a queue or min-heap of free spot ids ordered by distance from the gate. Allocation is a poll, release is an offer — both O(1)/O(log n). Scanning a 5,000-spot list per car is the answer that gets marked down.",
      },
      {
        q: "Two cars arrive at two gates and one spot remains.",
        a: "Both call findSpot and one wins the atomic claim; the loser retries and gets the next spot or a LotFullException. Show the CAS or the conditional UPDATE — the interviewer is checking that you noticed the race at all.",
      },
      {
        q: "Can a bike park in a car spot?",
        a: "That is a policy decision, so encode it in a compatibility map rather than in if-statements: SpotType.MEDIUM accepts {BIKE, CAR}. Then 'bikes may not take car spots at peak hours' is a config change, not a code change.",
      },
      {
        q: "The customer loses the ticket.",
        a: "Look up the open ticket by vehicle number (index it), charge a lost-ticket fee or the maximum day rate — a documented policy — and record the manual override with the operator's id for audit.",
      },
      {
        q: "Where does this become a distributed-systems problem?",
        a: "When one lot becomes 400 lots with a central app: spot state moves to a database with the conditional update as the concurrency control, the display board becomes an event stream, and payments become an external service with idempotency keys and webhooks. Offering that bridge is what the hiring-manager version of this question wants.",
      },
    ],
  },
];
