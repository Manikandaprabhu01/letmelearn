export type LldUmlBlueprint = {
  title: string;
  subtitle: string;
  patternsUsed: string[];
  umlDiagram: string;
  coreResponsibilities: { className: string; role: string; concurrencySafety: string }[];
  keyInvariants: string[];
};

export type LldTopicQA = {
  id: string;
  category: string;
  question: string;
  difficulty: "M" | "H";
  summary: string;
  fullAnswer: string;
  codeSnippet?: { lang: string; snippet: string };
  followUps: { q: string; a: string }[];
};

export type LldCompanyTrack = {
  id: string;
  company: string;
  companySlug: string;
  roleTitle: string;
  roundType: string;
  evaluationBar: string;
  questions: {
    id: string;
    title: string;
    difficulty: "M" | "H";
    timeLimit: string;
    problemStatement: string;
    entitiesAndDesign: string;
    classDesignCode: { lang: string; code: string };
    tradeoffsAndGotchas: string[];
    interviewerChecks: string[];
  }[];
};

export const LLD_UML_BLUEPRINTS: LldUmlBlueprint[] = [
  {
    title: "Thread-Safe LRU Cache Architecture",
    subtitle: "O(1) get and put operations with doubly linked list, hash map, and concurrent read/write locks",
    patternsUsed: ["Doubly Linked List", "Concurrent HashMap", "ReadWriteLock Strategy"],
    umlDiagram: `┌────────────────────────────────────────────────────────┐
│                      LRUCache<K, V>                    │
├────────────────────────────────────────────────────────┤
│ - capacity: int                                        │
│ - map: Map<K, Node<K, V>>                              │
│ - head: Node<K, V>                                     │
│ - tail: Node<K, V>                                     │
│ - lock: ReentrantReadWriteLock                         │
├────────────────────────────────────────────────────────┤
│ + get(key: K): Optional<V>                             │
│ + put(key: K, value: V): void                          │
│ - moveToHead(node: Node<K, V>): void                   │
│ - removeNode(node: Node<K, V>): void                   │
│ - evictTail(): Node<K, V>                              │
└────────────────────────────────────────────────────────┘
                           │ 1
                           ▼ *
┌────────────────────────────────────────────────────────┐
│                      Node<K, V>                        │
├────────────────────────────────────────────────────────┤
│ + key: K                                               │
│ + value: V                                             │
│ + prev: Node<K, V>                                     │
│ + next: Node<K, V>                                     │
└────────────────────────────────────────────────────────┘`,
    coreResponsibilities: [
      {
        className: "LRUCache",
        role: "Coordinates O(1) key lookups via Hash Map and maintains access order via Doubly Linked List",
        concurrencySafety: "Guarded by ReentrantReadWriteLock to allow concurrent reads while serializing writes and evictions",
      },
      {
        className: "Node<K, V>",
        role: "Contains key, value, and bidirectional pointers to enable O(1) removal and insertion",
        concurrencySafety: "Pointers modified strictly inside write lock critical section",
      },
    ],
    keyInvariants: [
      "Cache size must never exceed designated capacity",
      "Most recently accessed item is always moved to head immediately",
      "When capacity is breached, the node immediately before the dummy tail is atomically evicted",
    ],
  },
  {
    title: "Extensible Distributed Rate Limiter System",
    subtitle: "Strategy pattern supporting Token Bucket, Leaky Bucket, and Sliding Window Log algorithms",
    patternsUsed: ["Strategy Pattern", "Factory Pattern", "Template Method"],
    umlDiagram: `                  ┌───────────────────────────────┐
                  │      <<interface>>            │
                  │       RateLimiter             │
                  ├───────────────────────────────┤
                  │ + isAllowed(userId: str): bool│
                  └───────────────────────────────┘
                                  ▲
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ TokenBucketLimiter    │ │  LeakyBucketLimiter   │ │ SlidingWindowLimiter  │
├───────────────────────┤ ├───────────────────────┤ ├───────────────────────┤
│ - capacity: long      │ │ - queueCapacity: long │ │ - windowMillis: long  │
│ - refillRatePerSec:int│ │ - leakRatePerSec: int │ │ - maxRequests: int    │
│ - currentTokens: float│ │ - currentWater: long  │ │ - timestamps: Deque   │
├───────────────────────┤ ├───────────────────────┤ ├───────────────────────┤
│ + isAllowed(): bool   │ │ + isAllowed(): bool   │ │ + isAllowed(): bool   │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘`,
    coreResponsibilities: [
      {
        className: "RateLimiter (Interface)",
        role: "Declares contract for request admission control across all algorithms",
        concurrencySafety: "Encapsulates algorithm-specific synchronization",
      },
      {
        className: "TokenBucketLimiter",
        role: "Allows bursts of traffic up to bucket capacity, refilling smoothly across time",
        concurrencySafety: "Uses atomic compare-and-swap or synchronized refill calculation",
      },
      {
        className: "SlidingWindowLimiter",
        role: "Provides 100% boundary accuracy without burst exploits at window reset borders",
        concurrencySafety: "Synchronized deque of epoch timestamps with O(1) stale item pruning",
      },
    ],
    keyInvariants: [
      "Tokens cannot exceed maximum capacity under prolonged idle periods",
      "Time calculations must use monotonic clock (System.nanoTime) to avoid NTP backward jumps",
    ],
  },
];

export const LLD_TOPIC_QA_LIBRARY: LldTopicQA[] = [
  {
    id: "lld-qa-double-checked-locking",
    category: "Concurrency & OOP",
    question: "Why is the 'volatile' keyword mandatory in Double-Checked Locking Singleton, and what is Instruction Reordering?",
    difficulty: "H",
    summary:
      "Without the volatile keyword, CPU and compiler instruction reordering allows another thread to observe a partially initialized object reference where the constructor has not completed execution.",
    fullAnswer: `### The Flawed Implementation (Without volatile)
\`\`\`java
public class Singleton {
    private static Singleton instance; // Missing volatile!

    public static Singleton getInstance() {
        if (instance == null) {                         // 1st Check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {                 // 2nd Check (with lock)
                    instance = new Singleton();         // THE DANGER POINT!
                }
            }
        }
        return instance;
    }
}
\`\`\`

### What Happens at the Bytecode / CPU Level
The statement \`instance = new Singleton()\` is NOT atomic; it compiles into 3 distinct JVM bytecode operations:
1. \`allocate_memory()\`: Allocate heap space for Singleton.
2. \`ctor_singleton()\`: Execute constructor to initialize fields.
3. \`instance = ptr\`: Assign memory address to the reference variable \`instance\`.

**The Instruction Reordering Hazard:**
The JVM JIT compiler and modern out-of-order CPUs are legally permitted to reorder operations 2 and 3:
- Step 1: Memory allocated.
- Step 3: Reference assigned (\`instance\` is now NOT null!).
- Step 2: Constructor executes.

**The Race Condition:**
If Thread A assigns the pointer (Step 3) and is suspended before the constructor finishes (Step 2):
Thread B arrives at the **1st Check** (\`if (instance == null)\`). It observes \`instance != null\`, skips synchronization, and immediately returns the uninitialized object! When Thread B accesses fields on that object, it reads garbage data or crashes with NullPointerException.

### The Fix: volatile Keyword
Declaring \`private static volatile Singleton instance;\` creates a **Memory Barrier (Happens-Before Relationship)**:
It prohibits instruction reordering around the write and forces all field writes in the constructor to be flushed to main memory before the reference write becomes visible to other CPU cores.`,
    codeSnippet: {
      lang: "java",
      snippet: `public class ThreadSafeSingleton {
    // volatile ensures memory visibility and prevents instruction reordering
    private static volatile ThreadSafeSingleton instance;

    private ThreadSafeSingleton() {
        // Private constructor prevents reflection/instantiation
    }

    public static ThreadSafeSingleton getInstance() {
        if (instance == null) {
            synchronized (ThreadSafeSingleton.class) {
                if (instance == null) {
                    instance = new ThreadSafeSingleton();
                }
            }
        }
        return instance;
    }
}`,
    },
    followUps: [
      {
        q: "Is there a better way to implement lazy thread-safe singletons without synchronized overhead?",
        a: "Yes. The Bill Pugh Singleton design pattern uses an inner static helper class: 'private static class Holder { static final Singleton INSTANCE = new Singleton(); }'. The JVM guarantees thread-safe class loading and initializes the instance only when getInstance() is called for the first time.",
      },
    ],
  },
];

export const LLD_COMPANY_TRACKS: LldCompanyTrack[] = [
  {
    id: "swiggy-machine-coding",
    company: "Swiggy / Zomato",
    companySlug: "swiggy",
    roleTitle: "SDE 2 / Machine Coding Round",
    roundType: "90-minute Live Machine Coding",
    evaluationBar: "Working console code, clean domain models, SOLID principles, strategy pattern, and thread-safety.",
    questions: [
      {
        id: "swiggy-food-delivery-system",
        title: "Design a Food Delivery Fleet Matching & Dynamic Pricing Engine",
        difficulty: "H",
        timeLimit: "90 Minutes",
        problemStatement:
          "Design and implement a working in-memory food delivery platform. Support: 1) Registering Restaurants with Menus; 2) Placing Orders with promo codes; 3) Matching Delivery Partners based on proximity and vehicle type; 4) Dynamic surge delivery fee calculation.",
        entitiesAndDesign: `### Core Entities
- \`Restaurant\`: id, name, location, menu, isAcceptingOrders
- \`MenuItem\`: id, name, price, isVeg
- \`Order\`: id, customerId, restaurantId, items, status, totalAmount
- \`DeliveryPartner\`: id, name, currentLocation, status (AVAILABLE, BUSY)
- \`MatchingStrategy\` (Interface): \`findPartner(restaurantLocation, order)\`
- \`PricingStrategy\` (Interface): \`calculateFee(distanceKm, surgeMultiplier)\``,
        classDesignCode: {
          lang: "java",
          code: `// Core LLD interfaces and thread-safe dispatch
public interface MatchingStrategy {
    Optional<DeliveryPartner> match(Location restaurantLoc, List<DeliveryPartner> available);
}

public class NearestPartnerStrategy implements MatchingStrategy {
    @Override
    public Optional<DeliveryPartner> match(Location loc, List<DeliveryPartner> available) {
        return available.stream()
            .filter(DeliveryPartner::isAvailable)
            .min(Comparator.comparingDouble(p -> p.getLocation().distanceTo(loc)));
    }
}

public class OrderManager {
    private final ConcurrentHashMap<String, Order> orders = new ConcurrentHashMap<>();
    private final List<DeliveryPartner> fleet = new CopyOnWriteArrayList<>();
    private final MatchingStrategy matchingStrategy;

    public OrderManager(MatchingStrategy strategy) {
        this.matchingStrategy = strategy;
    }

    public synchronized Order placeOrder(String customerId, Restaurant restaurant, List<MenuItem> items) {
        Order order = new Order(UUID.randomUUID().toString(), customerId, restaurant, items);
        Optional<DeliveryPartner> partner = matchingStrategy.match(restaurant.getLocation(), fleet);
        
        if (partner.isPresent()) {
            partner.get().assignOrder(order.getId());
            order.setStatus(OrderStatus.ASSIGNED);
        } else {
            order.setStatus(OrderStatus.QUEUED_FOR_PARTNER);
        }
        orders.put(order.getId(), order);
        return order;
    }
}`,
        },
        tradeoffsAndGotchas: [
          "Gotcha: Assigning the same delivery partner to two concurrent orders simultaneously. Partner assignment must be atomic.",
        ],
        interviewerChecks: [
          "Separation of concerns: restaurant logic vs partner matching vs pricing",
          "Open-Closed Principle: adding a new MatchingStrategy (e.g. BatchedOrdersStrategy) does not modify OrderManager",
        ],
      },
    ],
  },
];
