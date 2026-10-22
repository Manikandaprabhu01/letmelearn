// Imported from the Interview Prep Console (lib/data-lld-b.js).
import type { LldAnswer } from "../types";

export const lldB: LldAnswer[] = [
  {
    id: "lld-featureflag",
    t: "Design a feature flag system (LLD)",
    src: ["S7"],
    r: 2,
    stmt: "Asked as the LLD round in a 2026 Senior loop. Design the SDK-side and service-side model for flags with targeting rules, percentage rollouts and kill switches.",
    ask: [
      "Boolean flags only, or multivariate (string / JSON variants for A/B tests)?",
      "Who evaluates — the client SDK locally, or a server call per evaluation? (Local evaluation is the realistic answer: zero added latency.)",
      "Targeting dimensions: user id, account id, plan, region, custom attributes?",
      "Must a percentage rollout be sticky — the same user always gets the same variant?",
      "How fast must a kill switch propagate? (Seconds, via streaming updates.)",
      "Do we need audit history and scheduled rollouts?",
    ],
    fr: [
      "Define a flag with variants and a default",
      "Targeting rules: individual overrides, attribute rules, percentage rollout",
      "Evaluate(flagKey, context) → variant, deterministically and locally",
      "Kill switch: turn a flag off everywhere within seconds",
      "Audit: who changed what, when; support scheduled and gradual rollouts",
      "Emit exposure events for experiment analysis",
    ],
    nfr: [
      "Evaluation in microseconds, no network call on the hot path",
      "Sticky bucketing: the same (flag, user) always resolves to the same variant, on every server, in every language SDK",
      "Fail safe: if config is unavailable, serve the last known good snapshot, then the code default",
      "Thread safe with hot config reloads — readers must never see a half-applied config",
    ],
    ent: "**Flag** (key, enabled, variants, defaultVariant, rules, version). **Variant** (key, value, weight). **TargetingRule** (ordered: predicate + variant). **Predicate** (attribute, operator, values) composed with AND/OR. **EvaluationContext** (userId, accountId, attributes). **Bucketer** (deterministic hash). **FlagStore** (immutable snapshot, atomically swapped). **FlagClient** (the SDK facade). **ExposureSink** (events).",
    cls: {
      java: 'public record Variant(String key, Object value, int weight) {}\n\npublic interface Predicate { boolean matches(EvaluationContext ctx); }\n\npublic record AttributeIn(String attribute, Set<String> values) implements Predicate {\n    public boolean matches(EvaluationContext ctx) {\n        return values.contains(ctx.attribute(attribute));\n    }\n}\npublic record AllOf(List<Predicate> all) implements Predicate {\n    public boolean matches(EvaluationContext ctx) { return all.stream().allMatch(p -> p.matches(ctx)); }\n}\n\npublic record TargetingRule(Predicate predicate, String variantKey, Integer rolloutPercent) {}\n\npublic final class Flag {                                  // immutable\n    final String key; final boolean enabled;\n    final List<TargetingRule> rules;                       // evaluated in order\n    final Map<String, String> individualOverrides;         // userId -> variantKey\n    final List<Variant> variants; final String defaultVariant;\n    final long version;\n}\n\n/** Deterministic bucketing: same input -> same bucket, in every SDK and language. */\npublic final class Bucketer {\n    private static final long MAX = 100_000L;\n\n    public static int bucket(String flagKey, String salt, String unitId) {\n        String input = flagKey + ":" + salt + ":" + unitId;\n        byte[] digest = Hashing.murmur3_128().hashString(input, StandardCharsets.UTF_8).asBytes();\n        long value = ByteBuffer.wrap(digest, 0, 8).getLong() & Long.MAX_VALUE;\n        return (int) ((value % MAX) * 100 / MAX);          // 0..99\n    }\n}\n\npublic class FlagEvaluator {\n    public Evaluation evaluate(Flag flag, EvaluationContext ctx) {\n        if (!flag.enabled)                                              // kill switch\n            return Evaluation.of(flag.defaultVariant, Reason.FLAG_OFF);\n\n        String forced = flag.individualOverrides.get(ctx.userId());     // explicit wins\n        if (forced != null) return Evaluation.of(forced, Reason.INDIVIDUAL_OVERRIDE);\n\n        for (TargetingRule rule : flag.rules) {                         // ordered\n            if (!rule.predicate().matches(ctx)) continue;\n            if (rule.rolloutPercent() == null)\n                return Evaluation.of(rule.variantKey(), Reason.RULE_MATCH);\n            int b = Bucketer.bucket(flag.key, "rollout", ctx.bucketingId());\n            return b < rule.rolloutPercent()\n                    ? Evaluation.of(rule.variantKey(), Reason.ROLLOUT_IN)\n                    : Evaluation.of(flag.defaultVariant, Reason.ROLLOUT_OUT);\n        }\n        return Evaluation.of(flag.defaultVariant, Reason.DEFAULT);\n    }\n}\n\n/** SDK facade: lock-free reads over an atomically swapped snapshot. */\npublic class FlagClient {\n    private final AtomicReference<Map<String, Flag>> snapshot = new AtomicReference<>(Map.of());\n    private final FlagEvaluator evaluator = new FlagEvaluator();\n    private final ExposureSink exposures;\n\n    public <T> T value(String flagKey, EvaluationContext ctx, T codeDefault, Class<T> type) {\n        Flag flag = snapshot.get().get(flagKey);\n        if (flag == null) return codeDefault;                 // unknown flag -> code default\n        Evaluation e = evaluator.evaluate(flag, ctx);\n        exposures.record(flagKey, e.variantKey(), ctx, e.reason());   // async, sampled\n        return type.cast(flag.valueOf(e.variantKey()));\n    }\n\n    /** called by the streaming updater; readers see old or new, never a mix */\n    void applySnapshot(Map<String, Flag> fresh) { snapshot.set(Map.copyOf(fresh)); }\n}',
      py: "from dataclasses import dataclass\nfrom typing import Any, Optional\nimport hashlib, threading\n\n@dataclass(frozen=True)\nclass Variant:\n    key: str\n    value: Any\n    weight: int = 0\n\n@dataclass(frozen=True)\nclass TargetingRule:\n    predicate: callable          # (ctx) -> bool\n    variant_key: str\n    rollout_percent: Optional[int] = None\n\n@dataclass(frozen=True)\nclass Flag:\n    key: str\n    enabled: bool\n    rules: tuple\n    individual_overrides: dict\n    variants: dict               # key -> Variant\n    default_variant: str\n    version: int\n\ndef bucket(flag_key, salt, unit_id):\n    digest = hashlib.sha1(f'{flag_key}:{salt}:{unit_id}'.encode()).digest()\n    value = int.from_bytes(digest[:8], 'big')\n    return value % 100                      # 0..99, stable across languages\n\nclass FlagEvaluator:\n    def evaluate(self, flag, ctx):\n        if not flag.enabled:\n            return flag.default_variant, 'FLAG_OFF'\n        forced = flag.individual_overrides.get(ctx.user_id)\n        if forced:\n            return forced, 'INDIVIDUAL_OVERRIDE'\n        for rule in flag.rules:\n            if not rule.predicate(ctx):\n                continue\n            if rule.rollout_percent is None:\n                return rule.variant_key, 'RULE_MATCH'\n            b = bucket(flag.key, 'rollout', ctx.bucketing_id)\n            if b < rule.rollout_percent:\n                return rule.variant_key, 'ROLLOUT_IN'\n            return flag.default_variant, 'ROLLOUT_OUT'\n        return flag.default_variant, 'DEFAULT'\n\nclass FlagClient:\n    def __init__(self, exposures):\n        self._snapshot = {}\n        self._lock = threading.Lock()\n        self._evaluator = FlagEvaluator()\n        self._exposures = exposures\n\n    def value(self, flag_key, ctx, code_default):\n        flag = self._snapshot.get(flag_key)      # dict read is atomic in CPython\n        if flag is None:\n            return code_default\n        variant_key, reason = self._evaluator.evaluate(flag, ctx)\n        self._exposures.record(flag_key, variant_key, ctx, reason)\n        return flag.variants[variant_key].value\n\n    def apply_snapshot(self, fresh):\n        with self._lock:\n            self._snapshot = dict(fresh)          # swap, never mutate in place",
    },
    pat: [
      "**Specification / Composite** — Predicate objects composed with AllOf / AnyOf instead of nested ifs.",
      "**Strategy** — rollout strategies (percentage, ring-based, attribute-based) behind one interface.",
      "**Immutable snapshot + atomic swap** — readers are lock-free and always see a consistent config.",
      "**Null Object** — an unknown flag resolves to the code default rather than throwing.",
      "**Observer** — the streaming updater pushes new snapshots; the SDK notifies listeners of changes.",
    ],
    conc: "Evaluation happens on every request thread, so the config must be read without locks: hold it in an AtomicReference to an immutable map and swap the whole map on update. Never mutate a live Flag. Exposure events go to a bounded, lossy queue with a background flusher — a blocking metrics write on the request path is how a flag system takes down the app it was meant to protect.",
    ext: [
      "Multivariate experiments: weights per variant, bucket 0..99 mapped across cumulative weights.",
      "Scheduled rollouts: a rule with a validFrom/validUntil predicate on the injected clock.",
      "Prerequisite flags: a rule that references another flag's evaluation (guard against cycles at save time).",
      "Local overrides for tests: a TestFlagClient implementation of the same interface.",
    ],
    qa: [
      {
        q: "Why must bucketing be deterministic and hashed rather than random?",
        a: "A user must stay in the same variant across requests, servers and SDKs, otherwise the UI flickers and the experiment is meaningless. Hashing (flagKey + salt + userId) gives stickiness with no stored state. Using the flag key in the hash also decorrelates flags so the same 10% of users are not always in every experiment.",
      },
      {
        q: "How does a kill switch reach 200 servers in seconds?",
        a: "Streaming updates: SSE/WebSocket from the config service to each SDK, with polling every 30–60 s as a fallback and an ETag so unchanged polls are cheap. Each snapshot carries a version; the SDK ignores older versions, which makes updates idempotent and out-of-order safe.",
      },
      {
        q: "What happens on the very first request if config has not loaded?",
        a: "Serve the code default and record it as reason=DEFAULT. Ship the SDK with an optional bootstrap file so a cold start on a new pod is not a behaviour change. Never block startup on the config service.",
      },
      {
        q: "How do you avoid flag debt?",
        a: "Every flag gets an owner and an expiry date at creation; stale flags raise a ticket automatically and the dashboard shows last-evaluated time so dead flags are visible. Interviewers like this answer because it is an operational concern, not a coding one.",
      },
      {
        q: "How would you test targeting rules?",
        a: "Table-driven tests over (context, expected variant) pairs; a golden test over the bucketing function so the hash never changes silently across SDK versions (that would reshuffle every user).",
      },
    ],
  },
  {
    id: "lld-ecommerce",
    t: "LLD for an e-commerce system like Flipkart",
    src: ["S6"],
    r: 2,
    stmt: "Asked in a Senior Backend screen as 'LLD on building a system like Flipkart'. Scope it fast or you will design for 60 minutes and finish nothing — take catalogue, cart, inventory and order placement.",
    ask: [
      "Which slice do you want in depth: catalogue and search, cart and checkout, inventory, or order fulfilment?",
      "Single seller or marketplace with many sellers per product?",
      "Do we hold inventory at checkout (reservation) or only at payment confirmation?",
      "Are prices and offers per seller, per region, time-bound?",
      "Payment: one gateway, or several with retries and webhooks?",
      "Do we need cancellation and returns today?",
    ],
    fr: [
      "Browse and search products; a product has many seller listings",
      "Cart: add, update quantity, remove; cart survives login (merge guest cart)",
      "Checkout: validate availability, apply offers, reserve inventory, create an order, take payment",
      "Order lifecycle: CREATED → PAID → PACKED → SHIPPED → DELIVERED, plus CANCELLED / RETURNED",
      "Inventory per (listing, warehouse) with reservations that expire",
    ],
    nfr: [
      "Never oversell a unit — inventory decrement must be atomic",
      "Checkout must be idempotent: a double-clicked Pay creates one order",
      "Read-heavy catalogue: cacheable, eventually consistent is fine",
      "Money arithmetic exact (BigDecimal / minor units), never double",
    ],
    ent: "**Product** (catalogue entity, attributes). **SellerListing** (product, seller, price, sla). **Inventory** (listingId, warehouseId, available, reserved). **Cart** / **CartItem**. **Order** / **OrderLine** with a state machine. **Payment** (gateway, status, idempotencyKey). **PricingEngine** + **Offer** (Strategy). **Shipment**. Repositories per aggregate.",
    cls: {
      java: "public enum OrderStatus {\n    CREATED, PAID, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURNED;\n\n    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(\n        CREATED,  EnumSet.of(PAID, CANCELLED),\n        PAID,     EnumSet.of(PACKED, CANCELLED),\n        PACKED,   EnumSet.of(SHIPPED, CANCELLED),\n        SHIPPED,  EnumSet.of(DELIVERED),\n        DELIVERED,EnumSet.of(RETURNED));\n\n    public void checkTransitionTo(OrderStatus next) {\n        if (!ALLOWED.getOrDefault(this, Set.of()).contains(next))\n            throw new IllegalStateTransition(this, next);\n    }\n}\n\npublic interface Offer { Money apply(OrderLine line, Money running); boolean appliesTo(OrderLine line); }\n\npublic class PricingEngine {                 // Strategy + Chain\n    private final List<Offer> offers;        // ordered, e.g. item -> cart -> coupon\n\n    public Money priceFor(OrderLine line) {\n        Money running = line.unitPrice().times(line.quantity());\n        for (Offer offer : offers)\n            if (offer.appliesTo(line)) running = offer.apply(line, running);\n        return running;\n    }\n}\n\npublic class InventoryService {\n    private final InventoryRepository repo;\n\n    /** Atomic conditional decrement: the only correct way to avoid overselling. */\n    public ReservationId reserve(String listingId, String warehouseId, int qty, Duration ttl) {\n        int updated = repo.tryReserve(listingId, warehouseId, qty);\n        //  UPDATE inventory SET available = available - :qty, reserved = reserved + :qty\n        //   WHERE listing_id = :l AND warehouse_id = :w AND available >= :qty\n        if (updated == 0) throw new OutOfStockException(listingId);\n        return repo.saveReservation(listingId, warehouseId, qty, Instant.now().plus(ttl));\n    }\n\n    public void commit(ReservationId id) { repo.markCommitted(id); }   // on payment success\n    public void release(ReservationId id) { repo.releaseBack(id); }    // on failure / TTL expiry\n}\n\npublic class CheckoutService {\n    private final CartRepository carts; private final InventoryService inventory;\n    private final PricingEngine pricing; private final OrderRepository orders;\n    private final PaymentGateway payments; private final IdempotencyStore idempotency;\n\n    public Order checkout(String cartId, PaymentInstrument instrument, String idempotencyKey) {\n        Optional<Order> replayed = idempotency.find(idempotencyKey);\n        if (replayed.isPresent()) return replayed.get();              // safe retry\n\n        Cart cart = carts.require(cartId);\n        List<ReservationId> holds = new ArrayList<>();\n        try {\n            Money total = Money.ZERO;\n            for (CartItem item : cart.items()) {\n                holds.add(inventory.reserve(item.listingId(), item.warehouseId(),\n                                            item.qty(), Duration.ofMinutes(15)));\n                total = total.plus(pricing.priceFor(OrderLine.from(item)));\n            }\n            Order order = Order.create(cart.userId(), cart.items(), total);   // CREATED\n            orders.save(order);\n            idempotency.put(idempotencyKey, order);\n\n            PaymentResult result = payments.charge(instrument, total, idempotencyKey);\n            if (result.isSuccess()) {\n                order.transitionTo(OrderStatus.PAID);\n                holds.forEach(inventory::commit);\n            } else {\n                order.transitionTo(OrderStatus.CANCELLED);\n                holds.forEach(inventory::release);\n            }\n            orders.save(order);\n            return order;\n        } catch (RuntimeException e) {\n            holds.forEach(inventory::release);                         // compensate\n            throw e;\n        }\n    }\n}",
      py: "from dataclasses import dataclass\nfrom datetime import timedelta\nfrom decimal import Decimal\nfrom enum import Enum\n\nclass OrderStatus(Enum):\n    CREATED='created'; PAID='paid'; PACKED='packed'; SHIPPED='shipped'\n    DELIVERED='delivered'; CANCELLED='cancelled'; RETURNED='returned'\n\nALLOWED = {\n    OrderStatus.CREATED: {OrderStatus.PAID, OrderStatus.CANCELLED},\n    OrderStatus.PAID: {OrderStatus.PACKED, OrderStatus.CANCELLED},\n    OrderStatus.PACKED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},\n    OrderStatus.SHIPPED: {OrderStatus.DELIVERED},\n    OrderStatus.DELIVERED: {OrderStatus.RETURNED},\n}\n\nclass Order:\n    def __init__(self, id_, user_id, lines, total):\n        self.id, self.user_id, self.lines, self.total = id_, user_id, lines, total\n        self.status = OrderStatus.CREATED\n\n    def transition_to(self, nxt):\n        if nxt not in ALLOWED.get(self.status, set()):\n            raise ValueError(f'illegal transition {self.status} -> {nxt}')\n        self.status = nxt\n\nclass InventoryService:\n    def __init__(self, repo): self.repo = repo\n\n    def reserve(self, listing_id, warehouse_id, qty, ttl=timedelta(minutes=15)):\n        # UPDATE inventory SET available = available - qty, reserved = reserved + qty\n        #  WHERE listing_id=? AND warehouse_id=? AND available >= qty\n        if self.repo.try_reserve(listing_id, warehouse_id, qty) == 0:\n            raise OutOfStock(listing_id)\n        return self.repo.save_reservation(listing_id, warehouse_id, qty, ttl)\n\n    def commit(self, rid): self.repo.mark_committed(rid)\n    def release(self, rid): self.repo.release_back(rid)\n\nclass CheckoutService:\n    def __init__(self, carts, inventory, pricing, orders, payments, idempotency):\n        self.carts, self.inventory, self.pricing = carts, inventory, pricing\n        self.orders, self.payments, self.idempotency = orders, payments, idempotency\n\n    def checkout(self, cart_id, instrument, idempotency_key):\n        existing = self.idempotency.find(idempotency_key)\n        if existing:\n            return existing\n        cart = self.carts.require(cart_id)\n        holds = []\n        try:\n            total = Decimal('0')\n            for item in cart.items:\n                holds.append(self.inventory.reserve(item.listing_id, item.warehouse_id, item.qty))\n                total += self.pricing.price_for(item)\n            order = Order(new_id(), cart.user_id, cart.items, total)\n            self.orders.save(order)\n            self.idempotency.put(idempotency_key, order)\n            if self.payments.charge(instrument, total, idempotency_key).success:\n                order.transition_to(OrderStatus.PAID)\n                for h in holds: self.inventory.commit(h)\n            else:\n                order.transition_to(OrderStatus.CANCELLED)\n                for h in holds: self.inventory.release(h)\n            self.orders.save(order)\n            return order\n        except Exception:\n            for h in holds: self.inventory.release(h)\n            raise",
    },
    pat: [
      "**State** — the order status machine with explicit legal transitions (no scattered if-chains).",
      "**Strategy + Chain of Responsibility** — Offer pipeline for pricing.",
      "**Repository / Unit of Work** — one aggregate per transaction boundary.",
      "**Saga with compensation** — reserve → pay → commit, releasing holds on failure, because inventory and payment live in different services.",
      "**Idempotency key** — the checkout entry point is a keyed operation, not a raw command.",
    ],
    conc: "Overselling is the interview's real subject. Never read-then-write: use a conditional UPDATE with available >= qty and check the affected row count, or SELECT ... FOR UPDATE on the inventory row. Reservations must expire (TTL sweeper) so abandoned carts return stock. Payments are external and can time out after succeeding, so make the gateway call idempotent with your own key and reconcile via webhook.",
    ext: [
      "Flash sale: pre-load inventory counters into Redis with atomic DECR, drain to the DB asynchronously; add a queue to shed load.",
      "Multi-warehouse allocation: an AllocationStrategy choosing the warehouse by distance and stock.",
      "Coupons: another Offer implementation plus a per-user redemption counter with an atomic check.",
      "Returns: a Return aggregate with its own state machine, releasing inventory back on receipt.",
    ],
    qa: [
      {
        q: "Two users buy the last unit at the same time.",
        a: "Both call reserve; the conditional UPDATE succeeds for exactly one because available >= qty fails for the other — the database row is the serialisation point. Optimistic locking with a version column is equivalent. Application-level checks (if (available > 0) then update) lose this race and that is what the interviewer is watching for.",
      },
      {
        q: "Do you reserve stock at add-to-cart or at checkout?",
        a: "At checkout, with a short TTL. Reserving at add-to-cart lets a few users freeze inventory for hours. State the product trade-off — ticketing systems do reserve early, e-commerce does not.",
      },
      {
        q: "How do you keep the cart after login?",
        a: "Guest carts are keyed by a device/session id; on login, merge into the user cart with a rule (sum quantities, keep the latest price) and delete the guest cart in one transaction.",
      },
      {
        q: "Where would you split this into microservices?",
        a: "Catalogue, cart, inventory, order, payment, shipping — split along aggregate boundaries, which are exactly the transaction boundaries. Cross-service flows become sagas with compensating actions, which is why checkout above is written as reserve/commit/release.",
      },
      {
        q: "Why BigDecimal and not double?",
        a: "Binary floating point cannot represent 0.1 exactly, so totals drift and reconciliation fails. Use BigDecimal with an explicit scale and rounding mode, or store integer minor units (paise). This is a small detail that reliably earns points in payments-adjacent designs.",
      },
    ],
  },
  {
    id: "lld-formbuilder",
    t: "Form builder — APIs to create forms, process submissions dynamically, filter fields for admins, plus DB schema",
    src: ["S9"],
    r: 2,
    stmt: "A 2025 design round: build the APIs for a dynamic form system — create forms with arbitrary fields, accept submissions validated against the definition, and expose admin-only field filtering. It mirrors the custom-field feature every SaaS product ends up building, so expect depth.",
    ask: [
      "Are field types fixed (text, number, date, dropdown, file) or user-extensible?",
      "Do form definitions version? What happens to submissions made against version 1 when the form changes?",
      "Conditional fields (show field B only when A = 'yes')?",
      "Are submissions queryable by field value, or only fetched whole? (This decides EAV vs JSONB.)",
      "Multi-tenant: are forms scoped per account, and can one account see another's fields? (No — tenant isolation.)",
      "Field-level permissions: which roles can see or edit which fields?",
    ],
    fr: [
      "POST /forms — create a form with an ordered list of field definitions",
      "GET /forms/{id} — return the definition, filtered by the caller's role",
      "POST /forms/{id}/submissions — validate the payload against the definition and store it",
      "GET /forms/{id}/submissions?filter=... — list and filter submissions by field values",
      "PATCH /forms/{id} — add / reorder / deprecate fields, producing a new version",
      "Admin-only fields: hidden from non-admin reads and rejected on non-admin writes",
    ],
    nfr: [
      "Adding a new field type must not require a schema migration",
      "Validation errors returned per field, all at once, not first-failure",
      "Submissions immutable-by-default with an audit trail of edits",
      "Tenant isolation enforced in every query",
    ],
    ent: "**Form** (id, tenantId, name, version, status). **FieldDefinition** (key, label, FieldType, required, validators, visibility, order, options). **FieldType** (enum + a FieldTypeHandler per type). **Submission** (id, formId, formVersion, submittedBy, values). **FieldValue** (fieldKey, typed value). **ValidationResult** (list of field errors). **VisibilityPolicy** (roles that may read / write a field). **FormRenderer** (returns the filtered definition).",
    cls: {
      java: 'public enum FieldType { TEXT, NUMBER, DATE, DROPDOWN, CHECKBOX, FILE }\n\n/** One handler per type: parsing + validation live together, open for extension. */\npublic interface FieldTypeHandler {\n    FieldType type();\n    Object parse(JsonNode raw) throws ValidationException;\n    void validate(FieldDefinition def, Object value, List<FieldError> errors);\n}\n\npublic class DropdownHandler implements FieldTypeHandler {\n    public FieldType type() { return FieldType.DROPDOWN; }\n\n    public Object parse(JsonNode raw) { return raw.asText(); }\n\n    public void validate(FieldDefinition def, Object value, List<FieldError> errors) {\n        if (value == null) return;\n        if (!def.options().contains(value.toString()))\n            errors.add(new FieldError(def.key(), "value must be one of " + def.options()));\n    }\n}\n\npublic record FieldDefinition(\n        String key, String label, FieldType type, boolean required,\n        List<String> options, Map<String, Object> constraints,   // min, max, regex...\n        Set<Role> readableBy, Set<Role> writableBy, int order, boolean deprecated) {}\n\npublic class FormService {\n    private final Map<FieldType, FieldTypeHandler> handlers;    // injected registry\n    private final FormRepository forms;\n    private final SubmissionRepository submissions;\n\n    /** Admin field filtering happens here, once, not in each controller. */\n    public FormView render(String formId, Role role) {\n        Form form = forms.require(formId);\n        List<FieldDefinition> visible = form.fields().stream()\n                .filter(f -> !f.deprecated())\n                .filter(f -> f.readableBy().contains(role))\n                .sorted(Comparator.comparingInt(FieldDefinition::order))\n                .toList();\n        return new FormView(form.id(), form.version(), visible);\n    }\n\n    public Submission submit(String formId, JsonNode payload, User user) {\n        Form form = forms.require(formId);\n        List<FieldError> errors = new ArrayList<>();\n        Map<String, Object> values = new LinkedHashMap<>();\n\n        for (FieldDefinition def : form.fields()) {\n            if (def.deprecated()) continue;\n            JsonNode raw = payload.get(def.key());\n\n            if (raw == null || raw.isNull()) {\n                if (def.required() && isVisibleFor(def, payload))\n                    errors.add(new FieldError(def.key(), "is required"));\n                continue;\n            }\n            if (!def.writableBy().contains(user.role())) {          // admin-only field\n                errors.add(new FieldError(def.key(), "not editable by your role"));\n                continue;\n            }\n            FieldTypeHandler handler = handlers.get(def.type());\n            Object parsed = handler.parse(raw);\n            handler.validate(def, parsed, errors);\n            values.put(def.key(), parsed);\n        }\n\n        rejectUnknownKeys(payload, form, errors);                   // strict by default\n        if (!errors.isEmpty()) throw new ValidationFailed(errors);  // all errors at once\n\n        return submissions.save(new Submission(\n                UUID.randomUUID().toString(), form.id(), form.version(),\n                user.id(), values, Instant.now()));\n    }\n}',
      py: "from abc import ABC, abstractmethod\nfrom dataclasses import dataclass, field\nfrom enum import Enum\nfrom typing import Any\nimport uuid, datetime\n\nclass FieldType(Enum):\n    TEXT='text'; NUMBER='number'; DATE='date'; DROPDOWN='dropdown'; CHECKBOX='checkbox'; FILE='file'\n\n@dataclass(frozen=True)\nclass FieldDefinition:\n    key: str\n    label: str\n    type: FieldType\n    required: bool = False\n    options: tuple = ()\n    constraints: dict = field(default_factory=dict)\n    readable_by: frozenset = frozenset()\n    writable_by: frozenset = frozenset()\n    order: int = 0\n    deprecated: bool = False\n\nclass FieldTypeHandler(ABC):\n    @abstractmethod\n    def parse(self, raw): ...\n    @abstractmethod\n    def validate(self, definition, value, errors): ...\n\nclass DropdownHandler(FieldTypeHandler):\n    def parse(self, raw): return str(raw)\n    def validate(self, d, value, errors):\n        if value is not None and value not in d.options:\n            errors.append((d.key, f'must be one of {list(d.options)}'))\n\nclass FormService:\n    def __init__(self, handlers, forms, submissions):\n        self.handlers, self.forms, self.submissions = handlers, forms, submissions\n\n    def render(self, form_id, role):\n        form = self.forms.require(form_id)\n        visible = sorted((f for f in form.fields\n                          if not f.deprecated and role in f.readable_by),\n                         key=lambda f: f.order)\n        return {'id': form.id, 'version': form.version, 'fields': visible}\n\n    def submit(self, form_id, payload, user):\n        form = self.forms.require(form_id)\n        errors, values = [], {}\n        for d in form.fields:\n            if d.deprecated:\n                continue\n            raw = payload.get(d.key)\n            if raw is None:\n                if d.required:\n                    errors.append((d.key, 'is required'))\n                continue\n            if user.role not in d.writable_by:\n                errors.append((d.key, 'not editable by your role'))\n                continue\n            handler = self.handlers[d.type]\n            value = handler.parse(raw)\n            handler.validate(d, value, errors)\n            values[d.key] = value\n        unknown = set(payload) - {f.key for f in form.fields}\n        errors += [(k, 'unknown field') for k in unknown]\n        if errors:\n            raise ValidationFailed(errors)\n        return self.submissions.save({\n            'id': str(uuid.uuid4()), 'form_id': form.id, 'form_version': form.version,\n            'submitted_by': user.id, 'values': values,\n            'created_at': datetime.datetime.utcnow()})",
    },
    pat: [
      "**Strategy + Registry** — one FieldTypeHandler per type, registered in a map; new types plug in without touching FormService.",
      "**Specification** — conditional visibility rules as composable predicates.",
      "**Builder** — FormBuilder for fluent definition creation in tests and migrations.",
      "**DTO / View model** — FormView is the role-filtered projection, so filtering is not repeated in controllers.",
      "**Versioned immutable definition** — editing a form creates a new version; submissions pin the version they were made against.",
    ],
    conc: "Mostly a read-heavy path, so cache rendered definitions per (formId, version, role) and invalidate on publish. Concurrent edits to a definition need optimistic locking on the version column; two admins publishing simultaneously must not interleave field sets. Submissions are append-only, so they need no locking.",
    ext: [
      "Conditional fields: add a VisibilityRule predicate evaluated against the partially filled payload.",
      "Computed / derived fields: a handler that evaluates an expression instead of reading the payload.",
      "Webhooks on submit: an Observer list per form.",
      "File fields: store an object key, validate size/mime, and scan asynchronously.",
    ],
    qa: [
      {
        q: "How do you store submission values — EAV, JSONB, or a table per form?",
        a: "Three real options. **JSONB column** (Postgres) on a single submissions table: simplest, supports GIN indexes for filtering by field value, and is what I would ship. **EAV** (submission_values table with field_key + typed columns): easy to index and query per field, but every read is a join and N rows per submission. **Table per form**: fastest queries and real types, but DDL at runtime, thousands of tables, and painful migrations. Say the decision rule: JSONB when fields are many and queries are few, EAV when you need heavy per-field filtering on a DB without JSON indexes.",
      },
      {
        q: "Show the JSONB schema and a filter query.",
        a: 'forms(id, tenant_id, name, version, status), form_fields(form_id, version, key, type, required, options, readable_by, writable_by, ord), submissions(id, form_id, form_version, tenant_id, submitted_by, values JSONB, created_at). Filtering: SELECT * FROM submissions WHERE tenant_id = ? AND form_id = ? AND values @> \'{"priority":"high"}\' with CREATE INDEX ON submissions USING gin (values jsonb_path_ops).',
      },
      {
        q: "A form changes after 10,000 submissions. What happens to old data?",
        a: "Never mutate old submissions. Definitions are versioned and each submission stores form_version, so rendering an old submission uses the definition it was made against. Deleting a field is a soft deprecate, not a drop.",
      },
      {
        q: "How do you enforce admin-only fields on the write path?",
        a: "Filtering on read is not enough — a client can POST the field anyway. Validate writable_by on every submitted key server-side and reject, which is what the submit method above does. Mentioning the read-filter-is-not-security point is the answer they are probing for.",
      },
      {
        q: "How do you validate 50 fields without 50 if-statements?",
        a: "The handler registry plus a per-field constraint map. Validation errors accumulate in a list so the client gets every problem in one response — a UX detail interviewers like.",
      },
    ],
  },
  {
    id: "lld-filemanager",
    t: "Design a file management system with multithreading",
    src: ["L4"],
    r: 3,
    stmt: "Asked in the Hyderabad bar raiser (whiteboard): design a file management system, with the interviewer steering into multithreading concerns. Think in-process file store with concurrent readers/writers, directory tree, search, and background indexing.",
    ask: [
      "Local filesystem abstraction, or a service storing files in object storage?",
      "Which operations must be concurrent — many readers with a single writer per file, or concurrent writers to different regions of one file?",
      "Do we need directory-level operations (move a subtree, recursive delete) while others read it?",
      "Is metadata search required (by name, tag, owner, modified date)?",
      "Consistency: must a read after a write see the new content immediately?",
      "Size limits — do we chunk large files and support resumable uploads?",
    ],
    fr: [
      "create / read / write / append / delete a file; create and list directories",
      "Move and rename, including subtrees",
      "Metadata: size, timestamps, owner, tags; search by metadata",
      "Concurrent access from many threads with defined semantics",
      "Background indexing and checksum verification without blocking callers",
    ],
    nfr: [
      "No lost updates and no torn reads",
      "No deadlock — a strict lock ordering for multi-path operations",
      "Readers should not block each other",
      "Bounded memory: stream large files, never load them whole",
    ],
    ent: "**FileSystemNode** (abstract) → **FileNode** and **DirectoryNode** (Composite). **FileMetadata** (size, timestamps, owner, checksum, tags). **FileStore** — the facade. **LockManager** — per-path ReadWriteLocks with ordering. **ChunkStore** — content in fixed-size blocks. **IndexService** — background metadata index. **FileEventBus** — created/modified/deleted events.",
    cls: {
      java: '// ---------- composite tree ----------\npublic abstract class FileSystemNode {\n    protected final String name;\n    protected DirectoryNode parent;\n    protected final FileMetadata metadata = new FileMetadata();\n    public abstract long size();\n    public String path() { return parent == null ? "/" + name : parent.path() + "/" + name; }\n}\n\npublic class DirectoryNode extends FileSystemNode {\n    private final Map<String, FileSystemNode> children = new ConcurrentHashMap<>();\n    public long size() { return children.values().stream().mapToLong(FileSystemNode::size).sum(); }\n    public Optional<FileSystemNode> child(String n) { return Optional.ofNullable(children.get(n)); }\n}\n\npublic class FileNode extends FileSystemNode {\n    private final List<Chunk> chunks = new CopyOnWriteArrayList<>();\n    private volatile long length;\n    public long size() { return length; }\n}\n\n// ---------- per-path locking with a global ordering ----------\npublic class LockManager {\n    private final ConcurrentHashMap<String, ReentrantReadWriteLock> locks = new ConcurrentHashMap<>();\n\n    private ReentrantReadWriteLock lockFor(String path) {\n        return locks.computeIfAbsent(path, p -> new ReentrantReadWriteLock(true)); // fair: no writer starvation\n    }\n\n    public <T> T withReadLock(String path, Supplier<T> action) {\n        Lock l = lockFor(path).readLock();\n        l.lock();\n        try { return action.get(); } finally { l.unlock(); }\n    }\n\n    public <T> T withWriteLock(String path, Supplier<T> action) {\n        Lock l = lockFor(path).writeLock();\n        l.lock();\n        try { return action.get(); } finally { l.unlock(); }\n    }\n\n    /** Two paths (move/copy): ALWAYS lock in lexicographic order -> no deadlock cycle. */\n    public <T> T withTwoWriteLocks(String a, String b, Supplier<T> action) {\n        String first = a.compareTo(b) <= 0 ? a : b;\n        String second = first.equals(a) ? b : a;\n        return withWriteLock(first, () -> withWriteLock(second, action));\n    }\n}\n\n// ---------- the store ----------\npublic class FileStore {\n    private final DirectoryNode root = new DirectoryNode("");\n    private final LockManager locks = new LockManager();\n    private final ChunkStore chunks;\n    private final ExecutorService indexPool = Executors.newFixedThreadPool(4);\n    private final FileEventBus events;\n\n    public byte[] read(String path, long offset, int length) {\n        return locks.withReadLock(path, () -> {\n            FileNode file = resolveFile(path);\n            return chunks.read(file, offset, length);      // many readers in parallel\n        });\n    }\n\n    public void write(String path, byte[] data, long offset) {\n        locks.withWriteLock(path, () -> {\n            FileNode file = resolveFile(path);\n            chunks.write(file, data, offset);              // exclusive\n            file.metadata().touch(Instant.now());\n            events.publish(new FileModified(path));\n            indexPool.submit(() -> reindex(file));         // never block the writer\n            return null;\n        });\n    }\n\n    public void move(String from, String to) {\n        locks.withTwoWriteLocks(from, to, () -> {\n            DirectoryNode sourceParent = resolveParent(from);\n            DirectoryNode targetParent = resolveParent(to);\n            FileSystemNode node = sourceParent.detach(nameOf(from));\n            targetParent.attach(nameOf(to), node);\n            events.publish(new FileMoved(from, to));\n            return null;\n        });\n    }\n\n    /** Copy a large file without holding a write lock for the whole transfer. */\n    public void copyLarge(String from, String to) {\n        long size = locks.withReadLock(from, () -> resolveFile(from).size());\n        String temp = to + ".part";\n        for (long off = 0; off < size; off += CHUNK) {\n            byte[] slice = read(from, off, (int) Math.min(CHUNK, size - off));  // short read lock\n            write(temp, slice, off);                                            // short write lock\n        }\n        move(temp, to);                                    // atomic-ish publish\n    }\n}',
      py: 'import threading, os\nfrom abc import ABC, abstractmethod\nfrom concurrent.futures import ThreadPoolExecutor\n\nclass RWLock:\n    """Readers-writer lock: many readers OR one writer."""\n    def __init__(self):\n        self._cond = threading.Condition()\n        self._readers = 0\n        self._writer = False\n\n    def acquire_read(self):\n        with self._cond:\n            while self._writer:\n                self._cond.wait()\n            self._readers += 1\n\n    def release_read(self):\n        with self._cond:\n            self._readers -= 1\n            if self._readers == 0:\n                self._cond.notify_all()\n\n    def acquire_write(self):\n        with self._cond:\n            while self._writer or self._readers:\n                self._cond.wait()\n            self._writer = True\n\n    def release_write(self):\n        with self._cond:\n            self._writer = False\n            self._cond.notify_all()\n\nclass LockManager:\n    def __init__(self):\n        self._locks, self._guard = {}, threading.Lock()\n\n    def _lock_for(self, path):\n        with self._guard:\n            return self._locks.setdefault(path, RWLock())\n\n    def read(self, path):\n        lock = self._lock_for(path)\n        class Ctx:\n            def __enter__(s): lock.acquire_read()\n            def __exit__(s, *a): lock.release_read()\n        return Ctx()\n\n    def write(self, path):\n        lock = self._lock_for(path)\n        class Ctx:\n            def __enter__(s): lock.acquire_write()\n            def __exit__(s, *a): lock.release_write()\n        return Ctx()\n\n    def write_two(self, a, b):\n        first, second = sorted([a, b])       # global ordering -> no deadlock\n        mgr = self\n        class Ctx:\n            def __enter__(s):\n                s.c1, s.c2 = mgr.write(first), mgr.write(second)\n                s.c1.__enter__(); s.c2.__enter__()\n            def __exit__(s, *a):\n                s.c2.__exit__(); s.c1.__exit__()\n        return Ctx()\n\nclass FileStore:\n    def __init__(self, chunks, events):\n        self.locks, self.chunks, self.events = LockManager(), chunks, events\n        self.index_pool = ThreadPoolExecutor(max_workers=4)\n\n    def read(self, path, offset, length):\n        with self.locks.read(path):\n            return self.chunks.read(path, offset, length)\n\n    def write(self, path, data, offset=0):\n        with self.locks.write(path):\n            self.chunks.write(path, data, offset)\n            self.events.publish((\'modified\', path))\n            self.index_pool.submit(self._reindex, path)\n\n    def move(self, src, dst):\n        with self.locks.write_two(src, dst):\n            self.chunks.move(src, dst)\n            self.events.publish((\'moved\', src, dst))',
    },
    pat: [
      "**Composite** — DirectoryNode and FileNode share FileSystemNode, so recursive operations are uniform.",
      "**Facade** — FileStore hides locking, chunking and indexing behind a small API.",
      "**Observer** — FileEventBus feeds the indexer, audit log and sync clients.",
      "**Proxy / lazy loading** — FileNode holds chunk references; content is fetched on demand.",
      "**Visitor** — recursive operations (du, search, checksum) as visitors over the tree.",
    ],
    conc: "This is what the round was really about. (1) **ReadWriteLock per path** so concurrent readers do not block each other while writes are exclusive; use the fair variant to avoid writer starvation. (2) **Lock ordering** for any two-path operation (move, copy, swap): always acquire in lexicographic path order — this is the standard cure for the classic two-lock deadlock, and naming it is the answer. (3) **Do not hold a lock across IO you do not control** — copy in chunks with short locks, index asynchronously on a bounded pool. (4) **ConcurrentHashMap / CopyOnWriteArrayList** for the directory children and chunk lists so traversal does not need a global lock. (5) Use a **striped lock** (Guava Striped) when the path count is huge, so the lock map itself does not grow without bound.",
    ext: [
      "Versioning: keep chunk lists per version; a write creates a new manifest (copy-on-write snapshots).",
      "Deduplication: content-addressed chunks keyed by SHA-256, refcounted.",
      "Resumable upload: chunk ids plus an upload session that records received chunks.",
      "Object storage backend: swap ChunkStore for S3 with multipart upload; the locking layer is unchanged.",
    ],
    qa: [
      {
        q: "How exactly can this deadlock, and how do you prevent it?",
        a: "Thread A moves /x to /y and locks /x then /y; thread B moves /y to /x and locks /y then /x — a cycle, so both block forever. Fix by imposing a total order on lock acquisition (sort the paths) so a cycle is impossible, which is one of the four Coffman conditions removed. Backup options: tryLock with a timeout and retry with backoff, or a single global lock for structural changes if throughput allows.",
      },
      {
        q: "Two threads append to the same file. What do you guarantee?",
        a: "With a per-file write lock, appends serialise and neither is lost. Without it you get a lost update: both read length L and write at L. If you want concurrent appends without a lock, the offset must come from an atomic counter (getAndAdd) so each writer owns a disjoint region.",
      },
      {
        q: "How do you keep readers from seeing a half-written file?",
        a: "Write to a temp path and rename (rename is atomic within a filesystem), or use copy-on-write: build a new chunk manifest and swap the reference atomically. Readers holding the old manifest finish consistently — this is MVCC applied to files.",
      },
      {
        q: "Why is the index updated asynchronously?",
        a: "Indexing is not needed for correctness of the write, and doing it inline would put full-text/metadata work on the caller's latency path. Use a bounded queue and drop-to-backlog behaviour so a slow indexer cannot exhaust memory or block writes.",
      },
      {
        q: "How would you test the concurrency?",
        a: "A CountDownLatch to release N threads simultaneously against the same path, asserting the final content is one of the legal serial outcomes; a deadlock test that runs opposing moves for a few seconds and fails if threads do not complete; and a stress run with -XX:+PrintConcurrentLocks or jstack to inspect held locks.",
      },
    ],
  },
];
