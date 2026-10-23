import type { Difficulty, Level, QA, QuestionType } from "./types";

export type RoleTrackId =
  | "sde1"
  | "sde2"
  | "lead-sde"
  | "staff-sde"
  | "backend"
  | "ai-fde"
  | "fullstack";

export type RoleQuestion = {
  id: string;
  q: string;
  company: string;
  companySlug: string;
  type: QuestionType;
  level: Level;
  difficulty: Difficulty;
  round: string;
  keyTakeaway: string;
  answerSummary: string;
  fullAnswer: string;
  code?: { java?: string; py?: string };
  followUps?: QA[];
};

export type RoleTrack = {
  id: RoleTrackId;
  title: string;
  shortTitle: string;
  badge: string;
  yoe: string;
  level: Level;
  tagline: string;
  overview: string;
  keySkills: string[];
  filterRound: string;
  whatClearsBar: string;
  companyTrends: {
    company: string;
    focus: string;
    typicalRounds: string;
  }[];
  questions: RoleQuestion[];
};

export const ROLE_TRACKS: RoleTrack[] = [
  {
    id: "sde1",
    title: "SDE 1 / Junior Software Engineer",
    shortTitle: "SDE 1",
    badge: "0–2 YoE",
    yoe: "0–2 Years",
    level: "SDE",
    tagline: "DSA mastery, optimal space-time complexity, clean OOP and CS fundamentals.",
    overview:
      "SDE 1 loops focus heavily on problem-solving mechanics, boundary condition handling without prompts, clean modular code, and fundamentals of OS, DBMS, and HTTP.",
    keySkills: [
      "Arrays, Two Pointers & Sliding Window",
      "Trees, Graphs (BFS/DFS) & Heaps",
      "Dynamic Programming (1D & 2D)",
      "Clean Object-Oriented Code & SOLID",
      "SQL Joins, Group By & Indexing basics",
      "Basic Concurrency & Race Conditions",
    ],
    filterRound: "Technical Coding Round 1 & 2 (DSA at LeetCode Medium/Hard without hints)",
    whatClearsBar:
      "Arriving at optimal time & space complexity, communicating trade-offs out loud, dry-running edge cases proactively, and producing working, syntactically clean code without IDE autocomplete.",
    companyTrends: [
      {
        company: "Google",
        focus: "L3 loop: Arrays, Graph algorithms, Trie prefix search, DP with strict O(N) or O(N log N) bar.",
        typicalRounds: "OA + 1 Phone Screen + 3 Onsite Coding + 1 Googliness",
      },
      {
        company: "Amazon",
        focus: "SDE 1: HackerRank OA + 3 Onsite (DSA Mediums, Tree traversals, LP behavioral stories).",
        typicalRounds: "OA (2 problems + work simulation) + 3 Onsite Coding/LP rounds",
      },
      {
        company: "Microsoft",
        focus: "DSA Mediums + String processing + clean OOP class structures + basic thread safety.",
        typicalRounds: "Codility OA + 3 Technical rounds + Hiring Manager",
      },
      {
        company: "Flipkart / Swiggy",
        focus: "DSA + Machine Coding light (console app with clean entities, e.g. Snake & Ladder, In-memory Cache).",
        typicalRounds: "OA + Problem Solving + 90-min Machine Coding + HR",
      },
    ],
    questions: [
      {
        id: "sde1-trapping-water",
        q: "Trapping Rain Water (1D & 2D Grid variations)",
        company: "Google / Amazon / Meta",
        companySlug: "google",
        type: "coding",
        level: "SDE",
        difficulty: "H",
        round: "Round 1 / 2 (Problem Solving)",
        keyTakeaway: "Tests ability to move from O(N) space two-pass to O(1) space two-pointer optimal solution.",
        answerSummary:
          "Maintain left_max and right_max pointers. The water trapped at index i is governed by min(left_max, right_max) - height[i]. Advance the pointer with the smaller boundary inward.",
        fullAnswer: `### Problem Breakdown
Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Approaches & Trade-offs
1. **Brute Force:** For each element, find maximum height to the left and right. Water = \`min(maxL, maxR) - h[i]\`. Time: $O(N^2)$, Space: $O(1)$.
2. **Dynamic Programming / Prefix Max:** Precompute \`left_max[]\` and \`right_max[]\`. Time: $O(N)$, Space: $O(N)$.
3. **Optimal Two-Pointer Approach:** Maintain \`left\`, \`right\`, \`left_max\`, and \`right_max\`. If \`height[left] <= height[right]\`, we know \`left_max\` determines the ceiling regardless of what lies between. Water at \`left\` is \`max(0, left_max - height[left])\`. Advance \`left++\`. Otherwise, process \`right\` and decrement \`right--\`.
   - **Time Complexity:** $O(N)$ single pass.
   - **Space Complexity:** $O(1)$ auxiliary memory.`,
        code: {
          java: `class Solution {
    public int trap(int[] height) {
        if (height == null || height.length <= 2) return 0;
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int totalWater = 0;

        while (left < right) {
            if (height[left] <= height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    totalWater += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    totalWater += rightMax - height[right];
                }
                right--;
            }
        }
        return totalWater;
    }
}`,
          py: `class Solution:
    def trap(self, height: list[int]) -> int:
        if not height or len(height) <= 2:
            return 0
        left, right = 0, len(height) - 1
        left_max = right_max = total_water = 0

        while left < right:
            if height[left] <= height[right]:
                if height[left] >= left_max:
                    left_max = height[left]
                else:
                    total_water += left_max - height[left]
                left += 1
            else:
                if height[right] >= right_max:
                    right_max = height[right]
                else:
                    total_water += right_max - height[right]
                right -= 1
        return total_water`,
        },
        followUps: [
          {
            q: "How would you solve this if bars can be dynamically updated in real-time?",
            a: "A segment tree storing range maximums allows $O(\\log N)$ updates and $O(\\log N)$ range queries, computing water delta efficiently.",
          },
          {
            q: "How does this generalize to Trapping Rain Water II (3D Elevation Grid)?",
            a: "Use a Min-Heap initialized with all boundary cells. Greedily pop the lowest boundary cell, inspect its unvisited 4-neighbors, add trapped water, and push them with updated boundary height.",
          },
        ],
      },
      {
        id: "sde1-lru-cache",
        q: "Design In-Memory LRU Cache with O(1) Get and Put",
        company: "Amazon / Microsoft / Uber",
        companySlug: "amazon",
        type: "coding",
        level: "SDE",
        difficulty: "M",
        round: "Round 2 (Data Structures & LLD)",
        keyTakeaway: "Tests combining a HashMap with a Doubly-Linked List to achieve strict O(1) reads and evictions.",
        answerSummary:
          "HashMap stores Key -> Node pointer. Doubly Linked List keeps keys in recency order with dummy Head (MRU) and Tail (LRU). On access, detach node and move to head. On capacity overflow, remove node at tail.prev.",
        fullAnswer: `### Design Principles
- **Lookup:** $O(1)$ via \`Map<K, Node>\`.
- **Ordering:** $O(1)$ reordering via Doubly Linked List.
- **Sentinel Nodes:** Dummy \`head\` and \`tail\` avoid null-pointer checks during node insertions and deletions.`,
        code: {
          java: `import java.util.HashMap;
import java.util.Map;

class LRUCache {
    static class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head, tail;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) return -1;
        moveToHead(node);
        return node.val;
    }

    public void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {
            node.val = value;
            moveToHead(node);
        } else {
            if (map.size() >= capacity) {
                Node lru = tail.prev;
                removeNode(lru);
                map.remove(lru.key);
            }
            Node newNode = new Node(key, value);
            map.put(key, newNode);
            addFirst(newNode);
        }
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addFirst(node);
    }

    private void addFirst(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
}`,
          py: `class Node:
    def __init__(self, key: int = 0, val: int = 0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_head(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._move_to_head(node)
        else:
            if len(self.cache) >= self.capacity:
                lru = self.tail.prev
                self._remove_node(lru)
                del self.cache[lru.key]
            new_node = Node(key, value)
            self.cache[key] = new_node
            self._add_first(new_node)

    def _move_to_head(self, node: Node) -> None:
        self._remove_node(node)
        self._add_first(node)

    def _add_first(self, node: Node) -> None:
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def _remove_node(self, node: Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev`,
        },
        followUps: [
          {
            q: "How would you make this thread-safe in high-concurrency environments?",
            a: "Use ReentrantReadWriteLock or striping (multiple cache partitions hashed by key). ReadWriteLock allows concurrent readers while serializing mutations.",
          },
          {
            q: "How would you add Time-To-Live (TTL) expiration per key?",
            a: "Store expiration timestamp in Node. On get(), check if now() > expiresAt; if expired, delete lazily and return -1. Supplement with a periodic background cleaner using a min-heap on expiration times.",
          },
        ],
      },
    ],
  },
  {
    id: "sde2",
    title: "SDE 2 / Mid-Level Software Engineer",
    shortTitle: "SDE 2",
    badge: "2–5 YoE",
    yoe: "2–5 Years",
    level: "SDE2",
    tagline: "Machine coding execution, Low-Level Design (LLD), concurrency safety, and scalable microservice APIs.",
    overview:
      "SDE 2 candidates are expected to write complete, executable, clean object-oriented systems under timed machine coding rounds (Flipkart, Swiggy, PhonePe) and discuss microservice design, caching, and database indexing.",
    keySkills: [
      "Machine Coding (Complete working console apps in 90-120 min)",
      "Design Patterns (Strategy, State, Factory, Observer, Decorator)",
      "Thread Safety, Locks, Semaphores & Atomic Variables",
      "Database Schema Design, Normalization & Index Tuning",
      "Distributed Caching (Redis eviction, cache-aside, write-through)",
      "Message Queues (Kafka consumer groups, at-least-once delivery)",
    ],
    filterRound: "Machine Coding Round & Low-Level Design (LLD)",
    whatClearsBar:
      "Producing runnable, clean code with separation of concerns (Controller, Service, Repository, Models), extensible class models that permit new features without modifying existing code (OCP), and handling edge cases with custom exceptions.",
    companyTrends: [
      {
        company: "Flipkart",
        focus: "Machine Coding is the primary gate. Typical problems: BNPL System, Sprint Planner, E-commerce Order Management.",
        typicalRounds: "Machine Coding (90 min) + Problem Solving + HLD/LLD + Hiring Manager",
      },
      {
        company: "Swiggy / Zomato",
        focus: "Hyperlocal order assignment, coupon validation engine, and multi-threaded rate limiter.",
        typicalRounds: "Machine Coding + DSA + Distributed Systems HLD + Culture Fit",
      },
      {
        company: "PhonePe / Razorpay",
        focus: "In-memory database with ACID transactions, payment idempotency, and concurrent logging.",
        typicalRounds: "Machine Coding + Concurrency/LLD + System Design + Director Round",
      },
      {
        company: "Amazon",
        focus: "OOD round (Parking Lot, Locker Service, File System) + Flash Sale concurrency + LP stories.",
        typicalRounds: "4 Onsite rounds: 2 DSA + 1 OOD/LLD + 1 System Architecture",
      },
    ],
    questions: [
      {
        id: "sde2-bnpl-machine-coding",
        q: "Machine Coding: Buy Now Pay Later (BNPL) Engine",
        company: "Flipkart / PhonePe / Razorpay",
        companySlug: "flipkart",
        type: "lld",
        level: "SDE2",
        difficulty: "M",
        round: "Round 1 (90-min Machine Coding)",
        keyTakeaway: "Evaluates modular OOP architecture, state validation, transaction recording, and handling overdue interest rules.",
        answerSummary:
          "Entities: User, Merchant, Order, DuesLedger, CreditProfile. Core API: registerUser(creditLimit), buy(userId, merchantId, amount, mode), clearDues(userId, amount), getSummary(). Validates available credit, updates ledger atomically, and flags delinquencies past 30 days.",
        fullAnswer: `### Machine Coding Requirements
1. **User Registration:** Each user is assigned a credit limit (e.g. ₹5,000).
2. **Buy Transaction:**
   - \`PREPAID\`: Direct settlement, credit limit untouched.
   - \`BNPL\`: Check available credit (\`limit - currentDues\`). If amount <= available credit, deduct available credit and record outstanding order. Otherwise, reject with \`InsufficientCreditException\`.
3. **Repayment (\`clearDues\`):** User repays amount; reduces outstanding dues and frees up credit limit.
4. **Delinquency Check:** If any due is pending > 30 days, freeze account for further BNPL purchases until cleared.
5. **Design Principles:**
   - Clean separation of \`Model\`, \`Service\`, \`Repository\`.
   - Thread-safe in-memory collections (\`ConcurrentHashMap\`).`,
        code: {
          java: `import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

enum PaymentMode { PREPAID, BNPL }

class User {
    private final String id;
    private final String name;
    private final double creditLimit;
    private double currentDues = 0;
    private boolean isBlacklisted = false;

    public User(String id, String name, double creditLimit) {
        this.id = id;
        this.name = name;
        this.creditLimit = creditLimit;
    }

    public synchronized boolean canBorrow(double amount) {
        return !isBlacklisted && (creditLimit - currentDues >= amount);
    }

    public synchronized void addDues(double amount) { currentDues += amount; }
    public synchronized void repay(double amount) { currentDues = Math.max(0, currentDues - amount); }
    public double getCurrentDues() { return currentDues; }
    public double getAvailableCredit() { return creditLimit - currentDues; }
    public String getId() { return id; }
}

class BNPLService {
    private final Map<String, User> users = new ConcurrentHashMap<>();

    public void registerUser(String id, String name, double creditLimit) {
        users.put(id, new User(id, name, creditLimit));
    }

    public boolean purchase(String userId, double amount, PaymentMode mode) {
        User user = users.get(userId);
        if (user == null) throw new IllegalArgumentException("User not found");

        if (mode == PaymentMode.PREPAID) {
            System.out.printf("Prepaid purchase of ₹%.2f successful for user %s%n", amount, userId);
            return true;
        }

        synchronized (user) {
            if (!user.canBorrow(amount)) {
                System.out.printf("BNPL purchase rejected for user %s: Insufficient credit%n", userId);
                return false;
            }
            user.addDues(amount);
            System.out.printf("BNPL purchase of ₹%.2f approved. Remaining credit: ₹%.2f%n",
                amount, user.getAvailableCredit());
            return true;
        }
    }

    public void clearDues(String userId, double amount) {
        User user = users.get(userId);
        if (user == null) throw new IllegalArgumentException("User not found");
        user.repay(amount);
        System.out.printf("Repayment of ₹%.2f processed. Dues remaining: ₹%.2f%n",
            amount, user.getCurrentDues());
    }
}`,
          py: `class PaymentMode:
    PREPAID = "PREPAID"
    BNPL = "BNPL"

class User:
    def __init__(self, user_id: str, name: str, credit_limit: float):
        self.user_id = user_id
        self.name = name
        self.credit_limit = credit_limit
        self.current_dues = 0.0
        self.is_delinquent = False

    def can_borrow(self, amount: float) -> bool:
        return not self.is_delinquent and (self.credit_limit - self.current_dues >= amount)

    def add_dues(self, amount: float):
        self.current_dues += amount

    def repay(self, amount: float):
        self.current_dues = max(0.0, self.current_dues - amount)

class BNPLService:
    def __init__(self):
        self.users: dict[str, User] = {}

    def register_user(self, user_id: str, name: str, credit_limit: float):
        self.users[user_id] = User(user_id, name, credit_limit)

    def purchase(self, user_id: str, amount: float, mode: str) -> bool:
        user = self.users.get(user_id)
        if not user:
            raise ValueError("User not found")
        if mode == PaymentMode.PREPAID:
            print(f"Prepaid transaction ₹{amount:.2f} successful for {user_id}")
            return True
        if not user.can_borrow(amount):
            print(f"BNPL transaction failed: Insufficient credit limit")
            return False
        user.add_dues(amount)
        print(f"BNPL transaction ₹{amount:.2f} approved. Current dues: ₹{user.current_dues:.2f}")
        return True

    def clear_dues(self, user_id: str, amount: float):
        user = self.users.get(user_id)
        if not user:
            raise ValueError("User not found")
        user.repay(amount)
        print(f"Repaid ₹{amount:.2f}. Total dues remaining: ₹{user.current_dues:.2f}")`,
        },
        followUps: [
          {
            q: "How would you handle credit limit upgrade eligibility?",
            a: "Implement a CreditScoringStrategy interface. When a user completes 5 on-time repayments without delinquencies, trigger an auto-upgrade event evaluating their repayment velocity.",
          },
          {
            q: "How would you implement concurrency control if multiple merchant checkouts occur simultaneously?",
            a: "Use pessimistic row locking (SELECT FOR UPDATE) on the user credit record or optimistic locking with a version column to avoid double-spending credit.",
          },
        ],
      },
      {
        id: "sde2-flash-sale-inventory",
        q: "High-Level Design: Flash Sale / Lightning Deal Inventory Reservation",
        company: "Amazon / Flipkart",
        companySlug: "amazon",
        type: "hld",
        level: "SDE2",
        difficulty: "H",
        round: "Round 3 (System Architecture)",
        keyTakeaway: "Tests preventing database overselling under 100,000 QPS using Redis Lua atomic operations and transactional outbox.",
        answerSummary:
          "Direct database decrements fail under hot-row locking. Pre-warm inventory in Redis. Use atomic Lua scripts to decrement inventory (DECRBY) with 10-minute lease holds. On user payment completion, confirm reservation; on timeout, return inventory to Redis pool. Push order creation to Kafka for asynchronous DB persistence.",
        fullAnswer: `### The Challenge: Hot-Row Database Contention
During a Big Billion Day or Prime Day flash sale, 100,000 users attempt to purchase 1,000 iPhone units at the same second. Direct \`UPDATE items SET stock = stock - 1 WHERE id = 1 AND stock > 0\` causes database row lock contention, thread exhaustion, and cascading database failure.

### Architecture Blueprint
\`\`\`
[ Client ]
    │ (HTTPS / POST /checkout)
    ▼
[ API Gateway & Rate Limiter (Token Bucket) ]
    │
    ▼
[ Flash Sale Service (Stateless Pods) ]
    │
    ├── 1. Atomic Lua Script ──► [ Redis Cluster (In-Memory Inventory) ]
    │                            (Key: item:101:stock, Lua checks stock > 0 & DECR)
    │
    ├── 2. Success: Emit Event ──► [ Kafka Cluster (order-events topic) ]
    │                                  │
    │                                  ▼
    │                            [ Order Processing Consumer ]
    │                                  │
    │                                  ▼
    │                            [ PostgreSQL / Aurora DB ] (Insert Order in DB)
    │
    └── 3. Fallback: Sold Out ──► Immediate HTTP 409 "Item Sold Out" (Zero DB Load)
\`\`\`

### Step-by-Step Flow
1. **Pre-warming:** 15 minutes before the sale, inventory is synchronized into Redis: \`item:{id}:stock = 1000\`.
2. **Atomic Reservation:** API servers execute an atomic Lua script on Redis:
   - Check if \`stock >= requested_qty\`.
   - If true: \`stock = stock - qty\`, generate temporary \`hold_id\` with 10-minute TTL, return success.
   - If false: Return 0 immediately.
3. **Asynchronous Fulfillment:** Successful reservations publish an \`OrderPendingEvent\` to Kafka.
4. **Payment Window:** User has 10 minutes to complete Razorpay/UPI payment. If payment fails or expires, Redis stock is incremented back atomically.`,
        code: {
          java: `// Atomic Lua Script executed on Redis cluster to prevent overselling
public class FlashSaleLuaScript {
    public static final String LUA_DECREMENT_STOCK =
        "local current = redis.call('get', KEYS[1]) " +
        "if not current or tonumber(current) < tonumber(ARGV[1]) then " +
        "    return 0 " +
        "else " +
        "    redis.call('decrby', KEYS[1], ARGV[1]) " +
        "    redis.call('setex', KEYS[2], tonumber(ARGV[2]), ARGV[3]) " + // Hold reservation key
        "    return 1 " +
        "end";
}`,
          py: `# Python Redis Lua execution pattern
LUA_DECREMENT_STOCK = """
local current = redis.call('get', KEYS[1])
if not current or tonumber(current) < tonumber(ARGV[1]) then
    return 0
else
    redis.call('decrby', KEYS[1], ARGV[1])
    redis.call('setex', KEYS[2], tonumber(ARGV[2]), ARGV[3])
    return 1
end
"""`,
        },
        followUps: [
          {
            q: "What happens if Redis crashes mid-sale?",
            a: "Use Redis Sentinel / Cluster with Multi-AZ replicas and append-only file (AOF) with fsync every second to ensure zero inventory loss.",
          },
          {
            q: "How do you prevent bot traffic from hoarding all inventory in milliseconds?",
            a: "Add Cloudflare CAPTCHA at checkout, enforce strict per-user rate limiting (1 checkout per IP/UserID per 10 seconds), and require verified KYC/phone OTP before checkout unlocks.",
          },
        ],
      },
    ],
  },
  {
    id: "lead-sde",
    title: "Lead SDE / Senior Software Engineer",
    shortTitle: "Lead SDE",
    badge: "5–9 YoE",
    yoe: "5–9 Years",
    level: "Lead SDE",
    tagline: "End-to-end distributed system design, fault tolerance, transaction boundaries, and team leadership.",
    overview:
      "Lead SDEs own technical architecture end-to-end. Evaluated on handling distributed transactions (Saga pattern), idempotency, fault isolation (Circuit Breakers/DLQs), geo-spatial routing, and bar-raiser behavioral stories.",
    keySkills: [
      "High-Level Distributed System Design (HLD)",
      "Database Sharding, Replication & Consistency Models (PACELC)",
      "Distributed Transactions (Saga Orchestration vs Choreography)",
      "Idempotency Keys & Deduplication Windows",
      "Real-time Geo-Spatial Indexing (Uber H3 / Google S2 / Geohash)",
      "Resiliency: Bulkheads, Circuit Breakers, Exponential Backoff, DLQs",
    ],
    filterRound: "System Design Round (HLD) & Bar Raiser / Hiring Manager",
    whatClearsBar:
      "Driving requirements clarity, providing quantitative scale numbers (QPS, storage, bandwidth), establishing trade-offs between CP and AP, detailing database schemas, explaining failure modes, and demonstrating cross-team engineering leadership.",
    companyTrends: [
      {
        company: "Google",
        focus: "L5 Senior SWE: Two system design rounds (Global Distributed Locking, Video Streaming, Collaborative Docs) + Googliness leadership.",
        typicalRounds: "Phone Screen + 2 Coding Hard + 2 System Design + 1 Googliness & Leadership",
      },
      {
        company: "Uber",
        focus: "Geospatial indexing (H3/S2), real-time rider-driver dispatch, surge pricing, past architecture retrospective.",
        typicalRounds: "Technical Screen + 2 System Design + 1 Coding + 1 Architecture Retrospective",
      },
      {
        company: "Razorpay / Stripe",
        focus: "Payments gateway, double-entry ledger, webhook delivery platform, reconciliation engine.",
        typicalRounds: "Machine Coding + 2 HLD Architecture rounds + Bar Raiser Director",
      },
      {
        company: "Amazon",
        focus: "SDE 3: Multi-service architecture, Bar Raiser veto, deep dive into technical failures and Leadership Principles.",
        typicalRounds: "4 Onsite rounds: 2 HLD + 1 LLD + 1 Coding + Bar Raiser",
      },
      {
        company: "Freshworks",
        focus: "Lead SE / IC3: Multi-tenant SaaS architecture, on-call roster machine coding, Bar Raiser (Staff SE) dissecting outages, connection pool starvation, and CHATS culture fit.",
        typicalRounds: "DSA & Systems Screen + Machine Coding LLD (90 min) + Multi-Tenant HLD + Staff Bar Raiser + Hiring Manager Director + Culture Fit",
      },
    ],
    questions: [
      {
        id: "lead-uber-dispatch",
        q: "High-Level Design: Hyperlocal Delivery Tracking & Real-Time Driver-Rider Matching Engine",
        company: "Uber / Swiggy / Zomato",
        companySlug: "uber",
        type: "hld",
        level: "Lead SDE",
        difficulty: "H",
        round: "Round 2 / 3 (Core System Design)",
        keyTakeaway: "Tests geospatial partitioning using Google S2 or Uber H3, WebSockets at scale, and low-latency matching algorithms.",
        answerSummary:
          "Drivers emit location pings every 4 seconds via WebSockets. Geo-Ingestion service maps coordinates to H3 hexagonal cell IDs (resolution 8, ~460m). Redis Geo stores driver locations in spatial indexes per cell. When a rider requests a pickup, query adjacent H3 cells (k-ring 1 & 2), filter by vehicle class, and dispatch to nearest available drivers.",
        fullAnswer: `### System Requirements & Scale
- **Scale:** 5 million active drivers worldwide emitting GPS every 4 seconds = **1.25 million writes/second**.
- **Latency SLA:** Driver search query returns within 100ms.
- **Key Concepts:** Uber H3 Hexagonal Hierarchical Spatial Index, WebSockets, Redis Geohash/S2, Event-driven Dispatcher.

### Architecture Diagram
\`\`\`
[ Drivers (Mobile App) ]
    │ (WebSockets / GPS Ping every 4s)
    ▼
[ WebSocket Gateway (Netty / Epoll Cluster) ]
    │
    ▼
[ Location Ingestion Service ]
    │
    ├── 1. Compute H3 Hexagon Cell ID ──► [ Redis In-Memory Geospatial Cluster ]
    │                                     (ZSET with H3 cell key -> driver_id, lat/lon)
    │
    └── 2. Batch Buffer ──► [ Kafka Topic: driver-locations ]
                                 │
                                 ▼
                           [ Historical Location Store (S3 / ClickHouse) ]

[ Rider App: Request Ride ]
    │ (HTTPS POST /rides/request)
    ▼
[ Dispatch Matching Engine ]
    │
    ├── 1. Get Rider H3 Cell & Query Adjacent Cells (k-ring = 2)
    ├── 2. Retrieve Available Drivers from Redis Cluster
    ├── 3. Filter by ETA, rating, vehicle type
    └── 4. Send Offer via Push/WebSocket with 15s Acceptance Timer
\`\`\`

### Data Model & Geospatial Indexing
- **Why Hexagons over Rectangles?** All neighboring cells in a hexagonal grid are equidistant from the center cell (unlike square grids where diagonal neighbors are $\\sqrt{2}$ further away).
- **Storage:** Redis Geospatial \`GEOADD driver_locations lon lat driver_id\` partitioned by city or Level 6 H3 region.`,
        code: {
          java: `// Java Dispatch Matching Service Pseudocode
public class DispatchService {
    public List<String> findNearbyDrivers(double riderLat, double riderLon, int radiusMeters) {
        // Query Redis Geo radius index
        return redisTemplate.opsForGeo()
            .radius("drivers:active", new Circle(new Point(riderLon, riderLat), new Distance(radiusMeters, Metrics.KILOMETERS)))
            .getContent()
            .stream()
            .map(geoResult -> geoResult.getContent().getName())
            .limit(10)
            .toList();
    }
}`,
          py: `# Python Dispatch Service
def find_nearby_drivers(redis_client, rider_lat: float, rider_lon: float, radius_km: float = 3.0):
    # GEORADIUS query returns [(driver_id, distance), ...]
    results = redis_client.georadius(
        name="drivers:active",
        longitude=rider_lon,
        latitude=rider_lat,
        radius=radius_km,
        unit="km",
        withdist=True,
        sort="ASC",
        count=10
    )
    return [driver_id for driver_id, dist in results]`,
        },
        followUps: [
          {
            q: "How do you prevent two riders from being matched to the same driver simultaneously?",
            a: "Use an atomic Redis lease hold: when offering a ride to driver D, execute SET driver:D:reserved {rideId} NX EX 15. If the key already exists, skip to the next candidate driver.",
          },
          {
            q: "How do you calculate dynamic surge pricing during heavy rain or peak demand?",
            a: "Aggregate supply (active idle drivers) vs demand (open ride requests) per H3 cell over a 5-minute sliding window using Apache Flink. When demand/supply ratio exceeds 1.5, trigger exponential surge multipliers capped at 3.0x.",
          },
        ],
      },
      {
        id: "lead-webhook-delivery",
        q: "High-Level Design: Webhook Delivery Platform with Dead-Letter Queue (DLQ) & Circuit Breakers",
        company: "Razorpay / Stripe",
        companySlug: "razorpay",
        type: "hld",
        level: "Lead SDE",
        difficulty: "H",
        round: "Round 2 / 3 (Core Payments Architecture)",
        keyTakeaway: "Tests guaranteed at-least-once delivery, tenant isolation, handling downstream merchant outages, and exponential backoff.",
        answerSummary:
          "Internal services produce payment events to Kafka. Webhook Dispatchers consume events, sign payload with HMAC-SHA256, and HTTP POST to merchant URLs. Slow or dead merchant servers must not starve healthy tenants. Use per-tenant queues, Circuit Breaker to suspend failing endpoints, and exponential retry schedules (1m, 5m, 30m, 2h, 24h) before pushing to DLQ.",
        fullAnswer: `### Core Requirements
1. **Guaranteed Delivery:** At-least-once delivery with HMAC-SHA256 signature for verification.
2. **Tenant Isolation:** A failing or slow merchant endpoint (taking 30s to timeout) must NOT consume worker threads and block fast merchants.
3. **Retry Policy:** Exponential backoff with jitter: $T = 2^r \\times 10\\text{s} + \\text{jitter}$.
4. **Dead Letter Queue (DLQ):** After 5 failed attempts over 24 hours, move to DLQ and trigger merchant notification.

### Architecture Flow
\`\`\`
[ Payment Engine ] ──► [ Kafka Topic: payment.events ]
                             │
                             ▼
                   [ Webhook Router & Dispatcher ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Fast Lane Workers ]            [ Retry Scheduler Queue ]
   (Fresh events, 2s timeout)       (Backoff: 1m, 5m, 1h, 24h)
            │                                 │
            ├──► HTTP POST Merchant URL       ├──► HTTP POST Retry
            │    (Success: 200 OK)            │    (Success: 200 OK)
            │                                 │
            └──► Failure / Timeout            └──► Exhausted (5 fails)
                 (Enqueues to Retry)               │
                                                   ▼
                                            [ DLQ & Dashboard ]
\`\`\``,
        code: {
          java: `// Webhook Signature Generation with HMAC-SHA256
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

public class WebhookSigner {
    public static String sign(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload.getBytes());
        return HexFormat.of().formatHex(hash);
    }
}`,
          py: `# Python Webhook Signature Verification
import hmac
import hashlib

def generate_signature(payload: str, secret: str) -> str:
    return hmac.new(
        secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()`,
        },
        followUps: [
          {
            q: "How does the merchant verify the webhook was actually sent by Razorpay?",
            a: "Include headers X-Razorpay-Signature: <hmac> and X-Razorpay-Timestamp: <epoch>. Merchant recomputes HMAC using their secret key and validates timestamp within 5 minutes to prevent replay attacks.",
          },
          {
            q: "What prevents a slow merchant from causing an Out-Of-Memory error on dispatch workers?",
            a: "Use an asynchronous non-blocking HTTP client (such as Netty or Java HttpClient) with strict connect (2s) and read (5s) timeouts, bounded thread pools, and separate worker pools per merchant tier.",
          },
        ],
      },
      {
        id: "lead-freshworks-multitenant",
        q: "High-Level Design: Multi-Tenant SaaS Customer Support & Ticketing Platform (Freshdesk / Zendesk)",
        company: "Freshworks / Salesforce",
        companySlug: "freshworks",
        type: "hld",
        level: "Lead SDE",
        difficulty: "H",
        round: "Round 2 / 3 (Multi-Tenant System Design & Architecture)",
        keyTakeaway: "Tests database multi-tenancy patterns (shared schema vs isolated shards), noisy-neighbor rate limiting, tenant-aware Kafka queues, and strict PostgreSQL Row-Level Security (RLS).",
        answerSummary:
          "60,000+ business tenants. Ingress Envoy gateway inspects custom domain (support.acme.com), consults Redis tenant directory, and routes to appropriate compute pod and database shard. Tenant sharding employs a tiered model: shared PostgreSQL clusters with Row-Level Security (RLS) for SMBs, and dedicated database clusters for Enterprise tenants. Background jobs (email alerts, SLA calculations, webhook retries) are partitioned into tenant-weighted Kafka topics to prevent one runaway tenant from starving others.",
        fullAnswer: `### 1. Requirements & Multi-Tenant SaaS Scale
- **Scale:** 60,000+ businesses (tenants), 120M active tickets, 25,000 incoming tickets/second peak across all tenants.
- **Latency SLA:** Ticket creation < 100ms; full-text search < 250ms.
- **Tenant Isolation:** Zero cross-tenant data leakage (strict SOC2 / GDPR compliance). One tenant running a bulk CSV export must not degrade response times for other tenants (Noisy Neighbor protection).

### 2. Multi-Tenancy Database Architecture
1. **Tiered Tenancy Model:**
   - **SMB & Mid-Market Tenants (95% of accounts):** Shared PostgreSQL database clusters with logical partitioning. Every table includes \`tenant_id UUID\`. PostgreSQL Row-Level Security (RLS) enforces \`USING (tenant_id = current_setting('app.current_tenant_id'))\` at the kernel level, eliminating accidental cross-tenant data leakage.
   - **Enterprise Tenants (Top 5% of revenue):** Dedicated Aurora PostgreSQL instances isolated from the shared pool.
2. **Ingress & Tenant Routing:**
   - Client sends request to custom domain \`support.customer.com\` (CNAME to \`gateway.freshdesk.com\`).
   - Envoy Gateway extracts domain, queries Redis Tenant Directory (cached with 1-hour TTL), and appends \`X-Tenant-ID\` and \`X-Tenant-Shard\`.
   - Application connection pool dynamically binds database connections to the designated shard.

### 3. Noisy-Neighbor Mitigation
- **Two-Tier Rate Limiting:** Global API rate limiter + Tenant-level token bucket stored in Redis.
- **Tenant-Weighted Kafka Queues:** Webhook and email dispatch jobs are divided into \`tier1_enterprise_queue\` and \`tier2_shared_queue\`. In the shared queue, a tenant concurrency throttle limits any single tenant to at most 10 concurrent worker threads.

### 4. Real-Time Ticket SLA Tracking
- **Business Hours Calendar:** SLA clock ticks only during tenant-configured business hours (e.g., Mon–Fri 9 AM – 6 PM excluding national holidays).
- **Event-Driven SLA Recalculation:** Ticket status transitions emit domain events via Kafka. Dedicated SLA worker calculates breach deadlines and schedules delayed alert triggers in a Redis Sorted Set (\`ZADD sla_breaches <timestamp> <ticket_id>\`). A poller sweeps elapsed scores every 10 seconds to fire escalation notifications.`,
        code: {
          java: `// PostgreSQL Row-Level Security (RLS) Multi-Tenant Safety Configuration
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String tenantId = req.getHeader("X-Tenant-ID");
        if (tenantId == null || tenantId.isBlank()) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        TenantContext.setCurrentTenant(tenantId);
        // Bind session-level variable in PostgreSQL connection pool
        jdbcTemplate.execute("SET LOCAL app.current_tenant_id = '" + tenantId + "'");
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res, Object h, Exception ex) {
        TenantContext.clear();
    }
}`,
          py: `# Multi-Tenant context manager with connection-level RLS setting
from contextvars import ContextVar
import psycopg2

current_tenant = ContextVar('current_tenant', default=None)

class TenantConnectionMiddleware:
    def __init__(self, db_pool):
        self.pool = db_pool

    def execute_tenant_query(self, tenant_id, sql, params):
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                # Set session variable for PostgreSQL Row Level Security
                cur.execute("SET LOCAL app.current_tenant_id = %s;", (tenant_id,))
                cur.execute(sql, params)
                return cur.fetchall()
        finally:
            self.pool.putconn(conn)`,
        },
        followUps: [
          {
            q: "How to perform zero-downtime database migrations across 60,000 tenant schemas?",
            a: "Never run destructive DDLs directly. Follow the expand-contract pattern: Step 1 (Expand): Add nullable new column; Step 2: Dual-write from application; Step 3: Backfill past data in batches; Step 4: Switch reads to new column; Step 5 (Contract): Drop old column asynchronously.",
          },
          {
            q: "How do you handle search across tickets with custom fields per tenant?",
            a: "Stream ticket mutation events to an OpenSearch / Elasticsearch cluster where each tenant has its own isolated index or routing key with dynamic schema mappings.",
          },
        ],
      },
    ],
  },
  {
    id: "staff-sde",
    title: "Staff / Principal SDE / Architect",
    shortTitle: "Staff SDE",
    badge: "9+ YoE",
    yoe: "9+ Years",
    level: "Staff SDE",
    tagline: "Multi-region active-active architectures, global consensus, real-time collaboration engines, and strategic governance.",
    overview:
      "Staff and Principal engineers operate across organizational boundaries. Evaluated on multi-datacenter disaster recovery, distributed lock managers with fencing tokens, collaborative real-time editors (OT/CRDT), and cross-team trade-offs.",
    keySkills: [
      "Active-Active Multi-Region Database Architectures",
      "Consensus Protocols (Raft, Paxos, Spanner TrueTime)",
      "Distributed Lock Managers (Chubby, Redlock, Fencing Tokens)",
      "Real-time Collaborative Editing (Operational Transformation vs CRDT)",
      "Disaster Recovery (RPO=0, RTO < 1 min)",
      "Cost Engineering, Capacity Planning & Org-wide Technical Tenets",
    ],
    filterRound: "Architecture Panel, Ambiguity Deep Dive & Director / VP Review",
    whatClearsBar:
      "Framing high-ambiguity business problems into clean technical abstractions, proving mathematical correctness of consensus/locking, analyzing multi-datacenter network split scenarios, and demonstrating strategic technical leadership.",
    companyTrends: [
      {
        company: "Google",
        focus: "L6 Staff / L7 Principal: Global consensus (TrueTime, Spanner, Chubby), multi-system trade-offs, VP approval.",
        typicalRounds: "Architecture Panel + 2 System Design + Strategic Ambiguity + Director Review",
      },
      {
        company: "Meta",
        focus: "E6 Staff: Multi-region cache invalidation, Graph database partitioning, cost and capacity modeling.",
        typicalRounds: "System Architecture + Past Project Deep-Dive + Culture & Leadership",
      },
      {
        company: "Microsoft",
        focus: "Partner Architect (L65+): Cloud multi-tenancy, cross-service SLA governance, enterprise resilience.",
        typicalRounds: "Architecture Panel + Executive Interview + Cross-Org Strategy",
      },
      {
        company: "Amazon",
        focus: "Principal Engineer (PE): Authoring tenets, global fault isolation, Bar Raiser with organizational impact.",
        typicalRounds: "PE Panel (3 PE rounds) + Director + Bar Raiser",
      },
    ],
    questions: [
      {
        id: "staff-google-docs-crdt",
        q: "High-Level Design: Real-Time Collaborative Document Editing (Operational Transformation vs. CRDTs)",
        company: "Google / Microsoft",
        companySlug: "google",
        type: "hld",
        level: "Staff SDE",
        difficulty: "H",
        round: "Round 2 / 3 (Staff Architecture Panel)",
        keyTakeaway: "Deep architectural comparison between centralized Operational Transformation (OT) and decentralized Conflict-free Replicated Data Types (CRDTs).",
        answerSummary:
          "Google Docs historically used centralized Operational Transformation (OT) with a central sequencer server that transforms incoming character insertions/deletions against committed revisions. Modern systems like Figma and Apple Notes favor CRDTs (such as RGA or Yjs) where operations commute mathematically, allowing peer-to-peer and offline convergence without a single central lock.",
        fullAnswer: `### Theoretical Foundations
When multiple clients edit a document simultaneously:
- **Client A** at position 3 inserts "X".
- **Client B** at position 1 deletes a character.
Without reconciliation, Client A's insertion will land at the wrong offset on Client B's screen.

### 1. Operational Transformation (OT) — Google Docs Model
- **Mechanism:** Centralized server acts as the single source of truth and sequence counter.
- When operation $O_1$ arrives concurrently with $O_2$, the server transforms $O_1$ against $O_2$ to produce $O_1' = T(O_1, O_2)$ such that applying $O_2$ then $O_1'$ yields the identical document state.
- **Pros:** Minimal memory footprint (plain text strings and offsets).
- **Cons:** Server is a stateful single point of failure; complex transformation matrix ($N \\times N$ operation combinations).

### 2. Conflict-free Replicated Data Types (CRDTs) — Modern Model (Figma, Yjs)
- **Mechanism:** Characters are assigned immutable, unique, fractional positional identifiers rather than integer array offsets.
- Example: Character between position \`1.0\` and \`2.0\` receives position \`1.5\`. If two clients generate position \`1.5\`, tie-break by Client ID (\`1.5:ClientID\`).
- **Mathematical Properties:** Commutative ($A \\star B = B \\star A$), Associative, Idempotent.
- **Pros:** Works fully offline; zero central server lock; effortless P2P synchronization.
- **Cons:** Memory metadata overhead (tombstones for deletions).`,
        code: {
          java: `// Conceptual Fractional Indexing CRDT Item
public record CRDTItem(String id, String clientOrigin, double position, char character, boolean deleted) 
    implements Comparable<CRDTItem> {
    
    @Override
    public int compareTo(CRDTItem other) {
        int cmp = Double.compare(this.position, other.position);
        if (cmp != 0) return cmp;
        return this.clientOrigin.compareTo(other.clientOrigin);
    }
}`,
          py: `# Conceptual CRDT Item with Fractional Indexing
from dataclasses import dataclass

@dataclass
class CRDTItem:
    item_id: str
    client_id: str
    position: float
    char: str
    deleted: bool = False

    def __lt__(self, other: 'CRDTItem') -> bool:
        if self.position != other.position:
            return self.position < other.position
        return self.client_id < other.client_id`,
        },
        followUps: [
          {
            q: "How do you handle memory bloat caused by deletion tombstones in CRDTs?",
            a: "Perform garbage collection (GC) passes when all active clients acknowledge a vector clock milestone beyond which no concurrent edits can reference the tombstone.",
          },
          {
            q: "How does Google Docs prevent a single document from overwhelming a server pod?",
            a: "A document session is assigned to an actor on an active collaboration cluster using consistent hashing on the DocumentID. Edits are batched and snapshot checkpoints written to Spanner every 10 seconds.",
          },
        ],
      },
      {
        id: "staff-distributed-lock",
        q: "High-Level Design: Distributed Lock Manager with Leases and Fencing Tokens",
        company: "Google / Amazon",
        companySlug: "google",
        type: "hld",
        level: "Staff SDE",
        difficulty: "H",
        round: "Round 2 / 3 (Principal Systems Architecture)",
        keyTakeaway: "Proves why simple Redis TTL locks are flawed and how fencing tokens with consensus engines (Raft/Zookeeper/Chubby) guarantee linearizable safety.",
        answerSummary:
          "Simple locks (e.g. SETNX with TTL) fail under Stop-The-World (STW) GC pauses or network delays: client pauses for 15s, its 10s lease expires, another client acquires the lock, and both write concurrently to storage. Safe distributed locking requires monotonically increasing Fencing Tokens verified by the target storage.",
        fullAnswer: `### The Fundamental Flaw of TTL-Based Locks (Martin Kleppmann Analysis)
\`\`\`
Client 1: [ Acquires Lock (lease: 10s) ] ──► [ GC Pause: 15 seconds ] ──► [ Writes to DB (Corrupts Data!) ]
                                                  ▲
Client 2:                               [ Lease Expires ] ──► [ Acquires Lock ] ──► [ Writes to DB ]
\`\`\`
Client 1 wakes up unaware its lock expired, writing to the storage while Client 2 is actively writing!

### The Solution: Monotonic Fencing Tokens
1. The Lock Service (backed by Raft consensus, e.g., Chubby or ZooKeeper) issues a monotonically increasing sequence counter with every lease:
   - Client 1 receives \`Token: 34\`.
   - Client 2 receives \`Token: 35\`.
2. When writing to the shared storage (database or filesystem), the storage enforces:
   \`UPDATE storage SET value = ?, last_fencing_token = 35 WHERE last_fencing_token < 35\`.
3. When Client 1 attempts its write with \`Token: 34\`, the storage rejects the write because \`34 < 35\`.`,
        code: {
          java: `// Storage check enforcing monotonic fencing token
public class FencedStorage {
    private long highestFencingToken = 0;

    public synchronized boolean writeData(long fencingToken, String data) {
        if (fencingToken <= highestFencingToken) {
            System.err.printf("Rejected stale write: token %d <= highest %d%n", fencingToken, highestFencingToken);
            return false;
        }
        this.highestFencingToken = fencingToken;
        System.out.printf("Write accepted with token %d: %s%n", fencingToken, data);
        return true;
    }
}`,
          py: `# Python Fenced Storage enforcement
class FencedStorage:
    def __init__(self):
        self.highest_token = 0

    def write_data(self, fencing_token: int, data: str) -> bool:
        if fencing_token <= self.highest_token:
            print(f"Write rejected: Token {fencing_token} is stale (highest is {self.highest_token})")
            return False
        self.highest_token = fencing_token
        print(f"Write committed with token {fencing_token}: {data}")
        return True`,
        },
        followUps: [
          {
            q: "What consensus protocol does Chubby or ZooKeeper use to ensure lock master election?",
            a: "Chubby uses Paxos; ZooKeeper uses Zab (ZooKeeper Atomic Broadcast); etcd uses Raft. All guarantee quorum intersection ($Q_1 \\cap Q_2 \\neq \\emptyset$) so split-brain leaders are mathematically impossible.",
          },
        ],
      },
    ],
  },
  {
    id: "ai-fde",
    title: "AI & Forward Deployed Engineer (FDE / Applied AI)",
    shortTitle: "AI / FDE",
    badge: "AI Native",
    yoe: "All Levels",
    level: "Lead SDE",
    tagline: "LLM serving architectures, RAG vector retrieval, semantic caching, and AI-native engineering velocity.",
    overview:
      "Modern 2025–2026 loops across Google, Meta, Amazon, and Anthropic assess how engineers design production AI pipelines: semantic caching, chunking & re-ranking, prompt guardrails, and evaluating AI-assisted workflows.",
    keySkills: [
      "Enterprise Retrieval-Augmented Generation (RAG)",
      "Vector Databases (pgvector, Milvus, Qdrant) & Embeddings",
      "Semantic Caching (Cosine similarity thresholds)",
      "Hybrid Search (BM25 sparse + Dense Vector embeddings)",
      "Prompt Injection Defenses & Guardrails",
      "Auditing and Validating AI-Generated Code in Production",
    ],
    filterRound: "System Architecture (AI Systems) & Modern Engineering Workflow Round",
    whatClearsBar:
      "Balancing model latency vs context window, quantifying token costs, implementing semantic caching to reduce API costs by 70%, preventing data leakage in shared caches, and explaining systematic testing of AI code.",
    companyTrends: [
      {
        company: "Palantir",
        focus: "Forward Deployed SE: Raw data ingestion, Foundry ontology mapping, decomposition of messy legacy systems, high-stress live client debugging.",
        typicalRounds: "Decomposition Round + Practical Data Ingestion + Live Systems Debugging + Client Role-Play",
      },
      {
        company: "OpenAI",
        focus: "Applied AI / Solutions: Frontier API mastery, native tool-calling, strict JSON Schema, prompt prefix caching, sub-800ms TTFT.",
        typicalRounds: "LLM System Architecture + Practical Tool-Use & Coding + Structured Outputs + Customer Discovery",
      },
      {
        company: "Anthropic",
        focus: "Deployed Solutions MTS: Constitutional guardrails, 200k+ multimodal vision extraction, adversarial customer role-play, sycophancy mitigation.",
        typicalRounds: "Adversarial Customer Role-Play + Constitutional Guardrails + Multimodal Extraction + Systems Interview",
      },
      {
        company: "Databricks",
        focus: "Mosaic AI: Vector Search at scale, Delta Lake change data feed, Unity Catalog row-level security, fine-tuning vs RAG decision matrices.",
        typicalRounds: "Vector Search at Scale + Unity Catalog Governance + Fine-Tuning vs RAG + Spark Batch Ingestion",
      },
      {
        company: "Scale AI",
        focus: "Forward Deployed ML: Automated evals (Ragas triad, LLM-as-a-judge), RLHF data pipelines, air-gapped federal/defense VPC deployments.",
        typicalRounds: "Data Annotation Engine Design + Automated Evals & RLHF + Air-Gapped Defense System Design",
      },
      {
        company: "Google / DeepMind",
        focus: "Applied AI: Gemini API integration, multimodal streaming, vector indexing, hallucination benchmarks, latency budgets.",
        typicalRounds: "Coding + AI Architecture Design + ML Fundamentals + Googliness",
      },
      {
        company: "Meta",
        focus: "Llama inference serving, vLLM PagedAttention, KV cache sizing, FP8 quantization, semantic cache at scale.",
        typicalRounds: "Coding + AI System Design + ML Scaling + Leadership",
      },
    ],
    questions: [
      {
        id: "ai-semantic-cache",
        q: "Design an Enterprise Semantic Cache for LLM Queries to Cut API Costs by 70%",
        company: "OpenAI / Anthropic / Meta",
        companySlug: "meta",
        type: "hld",
        level: "Lead SDE",
        difficulty: "H",
        round: "Round 2 / 3 (AI Architecture)",
        keyTakeaway: "Tests embedding generation, vector similarity thresholds (cosine distance >= 0.92), TTL, and multi-tenant security.",
        answerSummary:
          "Traditional string caches miss rephrased queries ('How do I reset password?' vs 'Password reset steps'). Compute text embeddings using a lightweight model (e.g. text-embedding-3-small). Query vector database (pgvector / Qdrant) for cosine similarity > 0.92 within the same tenant. If matched, return cached response in 15ms instead of waiting 1.5s for LLM generation.",
        fullAnswer: `### Why String Hashing Fails for LLMs
Two users asking identical questions phrase them differently:
- Query 1: *"What is the refund policy for flights cancelled within 24 hours?"*
- Query 2: *"Can I get a full refund if I cancel my flight today?"*
MD5/SHA256 string hashing misses 85% of semantic duplicates.

### Architectural Blueprint
\`\`\`
[ User Query ]
      │
      ▼
[ Embedding Generation Service ] (Compute 512-dim vector in 8ms)
      │
      ▼
[ Vector Similarity Search (Qdrant / pgvector) ]
      │ (Filters: tenant_id == X AND cosine_similarity >= 0.92)
      │
      ├── Hit (>= 0.92) ──► Return Cached LLM Response (15ms latency, $0.00 cost)
      │
      └── Miss (< 0.92)
            │
            ▼
      [ LLM Provider (Gemini / Claude / GPT) ] (1,500ms latency, $0.02 cost)
            │
            ▼
      [ Async Write to Vector Cache ] (Store vector + response with 7-day TTL)
\`\`\`

### Critical Tenet: Tenant & Role Isolation
Never share semantic cache responses across users if the prompt depended on personal data or authorization permissions! A shared cache across users turns semantic similarity into a confidential data leak.`,
        code: {
          java: `// Java Semantic Cache Lookup Pseudocode
public class SemanticCacheService {
    public Optional<String> lookup(String query, String tenantId, double threshold) {
        float[] embedding = embeddingClient.embed(query);
        VectorResult match = vectorDb.searchNearest(embedding, tenantId);
        if (match != null && match.getSimilarity() >= threshold) {
            return Optional.of(match.getResponse());
        }
        return Optional.empty();
    }
}`,
          py: `# Python Semantic Cache Lookup
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def query_semantic_cache(vector_db, query_vector: np.ndarray, tenant_id: str, threshold: float = 0.92):
    results = vector_db.search(query_vector, filter={"tenant_id": tenant_id}, limit=1)
    if results and results[0].score >= threshold:
        return results[0].payload["cached_answer"]
    return None`,
        },
        followUps: [
          {
            q: "What cosine similarity threshold balances false positives vs false negatives?",
            a: "Empirical benchmarking shows 0.92-0.95 is optimal for factual QA. Below 0.90, subtle prompt differences (e.g. 'flight refund' vs 'hotel refund') produce incorrect cached answers.",
          },
        ],
      },
      {
        id: "ai-code-validation",
        q: "Workflow: How to Safely Validate, Test, and Audit AI-Generated Code in Production",
        company: "Google / Meta / Amazon",
        companySlug: "google",
        type: "behavioral",
        level: "Lead SDE",
        difficulty: "M",
        round: "Round 4 (Modern Engineering Workflow)",
        keyTakeaway: "Tests disciplined human oversight, automated security auditing, and preventing hallucinated dependencies or regressions.",
        answerSummary:
          "AI assistants accelerate boilerplate and test generation, but require strict human verification: 1) Verify edge cases and concurrency locks that LLMs routinely omit; 2) Scan for hallucinated package imports that invite dependency hijacking; 3) Enforce automated test coverage before merging.",
        fullAnswer: `### High-Scoring Response Framework
1. **Speed vs Rigor:** State upfront that AI tools (Cursor, Copilot) are treated as junior pair programmers: fast at drafting, but lacking holistic architecture context.
2. **Hallucination Detection:** Check for invented library functions or non-existent external package versions.
3. **Security Auditing:** Check for SQL injection, insecure deserialization, and missing authentication middleware in generated route handlers.
4. **Concrete Metric:** *"In our team, AI tools boosted code drafting velocity by 35%, but our PR review criteria and test coverage bars remained uncompromisingly human-reviewed."*`,
        followUps: [
          {
            q: "Describe a time an AI tool suggested a flawed architectural pattern and how you caught it.",
            a: "Give an example of an AI tool generating an in-memory HashMap for rate limiting in a multi-pod Kubernetes deployment, and how you replaced it with distributed Redis sliding logs to prevent pod-local memory desync.",
          },
        ],
      },
    ],
  },
  {
    id: "backend",
    title: "Backend & Distributed Systems Specialist",
    shortTitle: "Backend",
    badge: "Core Engineering",
    yoe: "All Levels",
    level: "Lead SDE",
    tagline: "Concurrency, database internals, Kafka streaming, Redis topologies, and high-throughput APIs.",
    overview:
      "Specialized backend tracks across Uber, Stripe, Razorpay, and Netflix test deep systems engineering: connection pool tuning, idempotency keys, database indexing internals (B+ trees vs LSM-trees), and Kafka partition rebalancing.",
    keySkills: [
      "High-Throughput Concurrent Systems (Netty, epoll, goroutines)",
      "Database Engine Internals (WAL, MVCC, B+ Tree, LSM-tree)",
      "Kafka Streaming, Consumer Groups & Exactly-Once Semantics",
      "Idempotency Keys & Distributed Deduplication",
      "PostgreSQL Locking (Pessimistic, Optimistic, Advisory Locks)",
    ],
    filterRound: "Low-Level Concurrency & High-Level Scalability",
    whatClearsBar:
      "Deep understanding of how operating systems and databases handle locks, memory buffers, and network I/O; designing APIs that cannot be double-charged or corrupted under network timeouts.",
    companyTrends: [
      {
        company: "Stripe / Razorpay",
        focus: "Idempotent payment creation, ledger reconciliation, double-entry bookkeeping, database transaction isolation.",
        typicalRounds: "Machine Coding + 2 Distributed Architecture rounds + Technical Director",
      },
      {
        company: "Uber",
        focus: "High-throughput ingestion, Kafka consumer lag management, Redis geo-clustering, gRPC microservices.",
        typicalRounds: "2 Coding + 2 Distributed Architecture + Retrospective",
      },
    ],
    questions: [
      {
        id: "backend-idempotency",
        q: "Design a High-Throughput Idempotent Payment API Gateway",
        company: "Stripe / Razorpay",
        companySlug: "razorpay",
        type: "hld",
        level: "Lead SDE",
        difficulty: "H",
        round: "Round 2 / 3 (Core Backend Architecture)",
        keyTakeaway: "Tests handling network timeouts where client cannot know if request succeeded without duplicating money transfers.",
        answerSummary:
          "Client supplies an `Idempotency-Key` in the HTTP header. The gateway executes an atomic Redis insertion with a 24-hour TTL: `SET idempotency:{key} 'PROCESSING' NX EX 86400`. If key exists and status is 'PROCESSING', return HTTP 409 'Request in flight'. If status is 'COMPLETED', return cached response immediately without touching payment processors.",
        fullAnswer: `### The Problem: Network Timeouts in Financial Transactions
When a client sends \`POST /v1/charges\` and experiences a 504 Gateway Timeout or TCP connection drop, did the payment succeed or fail? If the client retries blindly, the user may be charged twice.

### Idempotency Protocol Architecture
\`\`\`
[ Client ]
    │ (POST /charges with Header "Idempotency-Key: req_abc123")
    ▼
[ API Gateway / Idempotency Middleware ]
    │
    ├── 1. Check Redis: SET idempotency:req_abc123 "PROCESSING" NX EX 86400
    │
    ├── State A: Key already exists as "COMPLETED"
    │     └── Return Cached HTTP Response Immediately (Zero downstream load)
    │
    ├── State B: Key exists as "PROCESSING"
    │     └── Return HTTP 409 Conflict ("Concurrent request with same idempotency key")
    │
    └── State C: Key created successfully
          │
          ├── Execute Payment with Bank / Acquirer
          ├── Update DB Transaction with Status 'PAID'
          └── Update Redis: SET idempotency:req_abc123 "{status: 200, charge_id: 'ch_999'}"
\`\`\``,
        code: {
          java: `// Java Idempotency Middleware Filter
public class IdempotencyFilter {
    public Response handle(Request req) {
        String key = req.getHeader("Idempotency-Key");
        if (key == null || key.isBlank()) return processRequest(req);

        String redisKey = "idemp:" + key;
        Boolean acquired = redis.setIfAbsent(redisKey, "PROCESSING", Duration.ofHours(24));
        if (Boolean.FALSE.equals(acquired)) {
            String existing = redis.get(redisKey);
            if ("PROCESSING".equals(existing)) {
                return Response.status(409).entity("Request already in progress").build();
            }
            return Response.ok(existing).build(); // Return cached response
        }

        Response response = processRequest(req);
        redis.set(redisKey, response.getBody(), Duration.ofHours(24));
        return response;
    }
}`,
          py: `# Python Idempotency Handler
def process_idempotent_request(redis_client, idempotency_key: str, execute_fn):
    redis_key = f"idemp:{idempotency_key}"
    # Atomically acquire lock
    if not redis_client.set(redis_key, "PROCESSING", nx=True, ex=86400):
        val = redis_client.get(redis_key)
        if val == "PROCESSING":
            return {"status": 409, "error": "Request already in progress"}
        return {"status": 200, "cached": True, "data": val}

    response = execute_fn()
    redis_client.set(redis_key, response, ex=86400)
    return {"status": 200, "cached": False, "data": response}`,
        },
        followUps: [
          {
            q: "What if the request payload changes while reusing the same idempotency key?",
            a: "Compute SHA-256 hash of the request body and store it alongside the key. If the key matches but the payload hash differs, immediately reject with HTTP 422 Unprocessable Entity ('Idempotency key reused with different payload').",
          },
        ],
      },
    ],
  },
];

export function getRoleTrack(id: string): RoleTrack | undefined {
  return ROLE_TRACKS.find((r) => r.id === id);
}
