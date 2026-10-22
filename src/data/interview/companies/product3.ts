// Imported from the Interview Prep Console (companies-product3.js).
import type { Company } from "../types";

export const product3Companies: Company[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    sector: "product",
    tag: "Clean DSA, a real LLD round, and distributed-systems depth at senior levels.",
    loc: "Bengaluru",
    ladder: [
      {
        lvl: "SDE",
        internal: "SWE",
        yoe: "0–3",
        loop: "OA + 2 technical + HM",
        bar: "Medium DSA with tests; clear communication.",
      },
      {
        lvl: "SDE2",
        internal: "Senior SWE-track",
        yoe: "3–6",
        loop: "Screen + 4 onsite (2 coding, 1 LLD, 1 HM)",
        bar: "Production-quality code, testability, API design.",
      },
      {
        lvl: "Lead SDE",
        internal: "Senior SWE",
        yoe: "6–10",
        loop: "Coding + LLD + distributed system design + HM",
        bar: "Owns design for a service; feed/graph/messaging domain depth.",
      },
      {
        lvl: "Staff SDE",
        internal: "Staff SWE",
        yoe: "10–14",
        loop: "Two design rounds + architecture + leadership",
        bar: "Cross-team architecture, data-infrastructure decisions.",
      },
      {
        lvl: "Principal SDE",
        internal: "Principal / Distinguished",
        yoe: "14+",
        loop: "Architecture + org panel",
        bar: "Platform direction, technical strategy across orgs.",
      },
    ],
    loop: [
      {
        n: 1,
        name: "Technical screen",
        dur: "45–60 min",
        fmt: "CoderPad",
        tests: "One or two Medium problems; they care about running, tested code.",
        levels: ["SDE", "SDE2", "Lead SDE"],
      },
      {
        n: 2,
        name: "Coding × 2",
        dur: "60 min each",
        fmt: "Live coding",
        tests:
          "Strings, graphs, heaps; often a follow-up asking you to productionise the solution.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE"],
      },
      {
        n: 3,
        name: "Low-level design",
        dur: "60 min",
        fmt: "Coding + design",
        tests: "Model a service component with clean interfaces and testability.",
        levels: ["SDE2", "Lead SDE", "Staff SDE"],
      },
      {
        n: 4,
        name: "Distributed system design",
        dur: "60 min",
        fmt: "Whiteboard",
        tests: "Feed, connection graph, messaging, notification, search — their own domain.",
        levels: ["Lead SDE", "Staff SDE", "Principal SDE"],
      },
      {
        n: 5,
        name: "Hiring manager / values",
        dur: "45 min",
        fmt: "Conversation",
        tests:
          "Impact, collaboration, mentorship; LinkedIn weighs 'members first' style product reasoning.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
    ],
    bank: [
      {
        q: "Design a news feed",
        t: "hld",
        lv: ["SDE2", "Lead SDE", "Staff SDE"],
        d: "H",
        round: 4,
        ans: "hld-social",
      },
      {
        q: "Design a notification system with user preferences and digests",
        t: "hld",
        lv: ["SDE2", "Lead SDE"],
        d: "M",
        round: 4,
        ans: "hld-feed-notif",
      },
      {
        q: "Design a connection/people-you-may-know graph service",
        t: "hld",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        round: 4,
        a: "**Clarify**: degree of separation needed (1st/2nd/3rd), read:write ratio (overwhelmingly read), freshness tolerance (minutes is fine), and scale — say 1B members, average 500 connections, so ~500B edges.\n\n**Storage**: the edge list is the source of truth in a sharded store keyed by member id, with edges written **both directions** so 'my connections' is one partition read. For traversal, a dedicated graph service holds adjacency in memory (compressed id arrays) because a 2nd-degree query is a set intersection over hundreds of thousands of ids — a relational join cannot do this at latency.\n\n**PYMK** is computed offline: a batch job (Spark) scores candidate pairs by mutual connections, company/school overlap and interaction signals, writing the top N per member into a key–value store that the API reads directly. Online you only re-rank and filter (already connected, dismissed, privacy).\n\n**The interesting probes**: 2nd-degree for a member with 30K connections (cap the fan-out, sample, or precompute), privacy filtering applied at read (you must not leak a blocked member), and incremental updates — a new connection invalidates that member's PYMK but you rebuild lazily, not synchronously.",
        fu: [
          {
            q: "Why not a graph database?",
            a: "At this scale the hot path is a small number of fixed traversals, so a purpose-built in-memory service with compressed adjacency beats a general graph database's flexibility. Say you would use one for exploratory/analytical traversals, not for the 10 ms online path.",
          },
          {
            q: "How do you keep both edge directions consistent?",
            a: "Write them in one transaction if co-located, otherwise write one and emit an event that creates the mirror, with a reconciliation job. Accept a brief window of asymmetry and make readers tolerant.",
          },
        ],
      },
      {
        q: "Design a rate limiter for the public API",
        t: "lld",
        lv: ["SDE2", "Lead SDE"],
        d: "M",
        round: 3,
        ans: "lld-ratelimiter",
      },
      {
        q: "Design an LRU/LFU cache",
        t: "coding",
        lv: ["SDE", "SDE2"],
        d: "M",
        lc: 146,
        slug: "lru-cache",
        round: 2,
        ans: "lru",
      },
      {
        q: "Word/string processing at Medium (e.g. shortest word distance, text justification)",
        t: "coding",
        lv: ["SDE", "SDE2", "Lead SDE"],
        d: "M",
        lc: 68,
        slug: "text-justification",
        round: 2,
        ans: "lswr",
        note: "LinkedIn's string questions reward careful edge-case handling over cleverness — greedy line packing, spacing distribution, last-line rules.",
      },
      {
        q: "Tell me about a time you improved something for members/users",
        t: "behavioral",
        lv: ["SDE2", "Lead SDE", "Staff SDE"],
        round: 5,
        ans: "b-challenging",
      },
    ],
    prep: [
      "They value tested, production-shaped code — write the test cases unprompted in the coding rounds.",
      "Know feed, graph and notification designs cold; the design round usually comes from their own product surface.",
      "Prepare a mentorship story — LinkedIn weighs growing others at senior levels.",
    ],
    sources: [
      {
        label: "Glassdoor — LinkedIn senior SWE interviews",
        url: "https://www.glassdoor.co.in/Interview/LinkedIn-Senior-Software-Engineer-Interview-Questions-EI_IE34865.0,8_KO9,33.htm",
      },
    ],
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    sector: "product",
    tag: "Platform company: JavaScript, workflow modelling and multi-instance architecture.",
    loc: "Hyderabad · Bengaluru",
    ladder: [
      {
        lvl: "SDE",
        internal: "SWE",
        yoe: "0–3",
        loop: "Screen + technical + onsite",
        bar: "DSA, JavaScript, SQL basics.",
      },
      {
        lvl: "SDE2",
        internal: "SWE II",
        yoe: "3–6",
        loop: "Technical ×2 + design + HM",
        bar: "LLD of a platform component; JS and framework depth.",
      },
      {
        lvl: "Lead SDE",
        internal: "Senior SWE",
        yoe: "6–10",
        loop: "Coding + design + platform architecture + HM",
        bar: "Instance architecture, workflow engines, upgrade-safe customisation.",
      },
      {
        lvl: "Staff SDE",
        internal: "Staff / Principal",
        yoe: "10–15",
        loop: "Design ×2 + architecture panel",
        bar: "Multi-instance platform concerns, performance at customer scale.",
      },
      {
        lvl: "Principal SDE",
        internal: "Principal / Distinguished",
        yoe: "15+",
        loop: "Architecture panel",
        bar: "Platform direction and standards.",
      },
    ],
    loop: [
      {
        n: 1,
        name: "Recruiter / HM screen",
        dur: "30 min",
        fmt: "Call",
        tests: "Experience check plus light technical and behavioural questions.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
      {
        n: 2,
        name: "Technical virtual round",
        dur: "60 min",
        fmt: "Live coding or take-home",
        tests:
          "Algorithms and data structures, JavaScript, sometimes React/Angular/Node for UI roles.",
        levels: ["SDE", "SDE2", "Lead SDE"],
      },
      {
        n: 3,
        name: "Onsite rounds",
        dur: "45–60 min each",
        fmt: "Mixed",
        tests:
          "Coding, LLD (elevator, cache, workflow engine), system design, plus framework knowledge and project discussion.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE"],
      },
      {
        n: 4,
        name: "Behavioural",
        dur: "45 min",
        fmt: "Conversation",
        tests: "Collaboration, customer focus, handling ambiguity.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
    ],
    bank: [
      {
        q: "Design an elevator system",
        t: "lld",
        lv: ["SDE", "SDE2", "Lead SDE"],
        d: "M",
        round: 3,
        a: '**Clarify**: number of elevators and floors, scheduling goal (minimise wait vs minimise travel), express/service modes, and capacity limits.\n\n**Model**: `Elevator` (id, currentFloor, direction, doorState, `TreeSet<Integer> upStops/downStops`), `Request` (external: floor + direction; internal: target floor), `ElevatorController` holding the fleet, and a pluggable `SchedulingStrategy`.\n\n**The algorithm is the question**: the classic answer is **SCAN/LOOK (the elevator algorithm)** — keep moving in the current direction serving stops in sorted order, then reverse. Two sorted sets per elevator (one per direction) make "next stop" O(log n). For dispatch across a fleet, score each elevator for a request (distance, direction compatibility, current load) and assign the best — that is a Strategy so it can change.\n\n**States** are a state machine: IDLE → MOVING_UP/DOWN → DOOR_OPEN → IDLE, with illegal transitions rejected; doors never open while moving.\n\n**Concurrency**: requests arrive from many floors concurrently, so the controller queues them and a single thread per elevator advances its state — an actor-per-elevator model avoids locks entirely, which is worth saying.',
        fu: [
          {
            q: "How would you handle a fire-alarm mode?",
            a: "A priority override that clears all stops and sends every car to the ground floor, refusing new requests — model it as a mode on the controller, not as special cases inside the scheduler.",
          },
          {
            q: "How do you test it?",
            a: "Inject a fake clock and drive ticks manually; assert invariants (never skips a stop in its direction, never opens doors while moving) over randomised request sequences.",
          },
        ],
      },
      {
        q: "Design a workflow / approval engine",
        t: "lld",
        lv: ["SDE2", "Lead SDE", "Staff SDE"],
        d: "H",
        round: 3,
        ans: "lld-formbuilder",
        note: "ServiceNow's core product. Reuse the form-builder shape for the definition side (versioned, user-defined states and transitions), then add: a state machine stored as data rather than code, per-transition conditions and actions, an execution log per instance for audit, and idempotent action execution so a retried transition does not re-send approvals.",
      },
      {
        q: "Implement an LRU cache",
        t: "coding",
        lv: ["SDE", "SDE2"],
        d: "M",
        lc: 146,
        slug: "lru-cache",
        round: 2,
        ans: "lru",
      },
      {
        q: "Merge sorted lists / search in rotated array",
        t: "coding",
        lv: ["SDE", "SDE2"],
        d: "M",
        lc: 21,
        slug: "merge-two-sorted-lists",
        round: 2,
        ans: "mergelists",
      },
      {
        q: "Weighted random selection: return a key with probability proportional to its weight",
        t: "coding",
        lv: ["SDE2", "Lead SDE"],
        d: "M",
        round: 2,
        a: "**Prefix sums + binary search**: build the cumulative weight array once (O(n)), then each draw picks a uniform value in `[0, total)` and binary searches for the first prefix greater than it — O(log n) per draw. This is the expected answer.\n\n**Alias method** gives O(1) per draw after O(n) setup, and is the right answer when you draw millions of samples from a fixed distribution — worth naming.\n\nIf weights change frequently, use a Fenwick tree (BIT) over weights so both update and sample are O(log n).",
        code: {
          java: "class WeightedPicker {\n    private final String[] keys;\n    private final int[] prefix;      // cumulative weights\n    private final Random rnd = new Random();\n\n    WeightedPicker(Map<String, Integer> weights) {\n        keys = weights.keySet().toArray(new String[0]);\n        prefix = new int[keys.length];\n        int running = 0;\n        for (int i = 0; i < keys.length; i++) {\n            running += weights.get(keys[i]);\n            prefix[i] = running;\n        }\n    }\n\n    String pick() {\n        int target = rnd.nextInt(prefix[prefix.length - 1]);   // [0, total)\n        int lo = 0, hi = prefix.length - 1;\n        while (lo < hi) {                                      // first prefix > target\n            int mid = (lo + hi) >>> 1;\n            if (prefix[mid] <= target) lo = mid + 1; else hi = mid;\n        }\n        return keys[lo];\n    }\n}",
          py: "import bisect, random\n\nclass WeightedPicker:\n    def __init__(self, weights: dict):\n        self.keys = list(weights)\n        self.prefix = []\n        running = 0\n        for k in self.keys:\n            running += weights[k]\n            self.prefix.append(running)\n\n    def pick(self):\n        target = random.randrange(self.prefix[-1])\n        i = bisect.bisect_right(self.prefix, target)\n        return self.keys[i]",
        },
      },
      {
        q: "JavaScript fundamentals: closures, the event loop, async patterns",
        t: "concept",
        lv: ["SDE", "SDE2", "Lead SDE"],
        round: 2,
        ans: "c-js",
      },
      {
        q: "SQL: second highest salary per department",
        t: "concept",
        lv: ["SDE", "SDE2"],
        round: 2,
        ans: "c-join",
      },
      {
        q: "Design a multi-tenant platform where customers customise the data model",
        t: "hld",
        lv: ["Lead SDE", "Staff SDE", "Principal SDE"],
        d: "H",
        round: 3,
        ans: "lld-formbuilder",
        note: "The ServiceNow-specific angle on top: customisations must survive platform upgrades, so customer changes live in a separate layer merged at runtime, with a conflict report at upgrade time rather than silent overwrite.",
      },
    ],
    prep: [
      "JavaScript depth is expected even for backend roles — closures, event loop, promises.",
      "LLD questions lean toward workflow/state-machine modelling; practise engines driven by data, not code.",
      "Know multi-instance/multi-tenant architecture and upgrade-safe customisation.",
    ],
    sources: [
      {
        label: "InterviewQuery — ServiceNow SWE guide",
        url: "https://www.interviewquery.com/interview-guides/servicenow-software-engineer",
      },
      {
        label: "Glassdoor — ServiceNow senior SWE interviews",
        url: "https://www.glassdoor.co.in/Interview/ServiceNow-Senior-Software-Engineer-Interview-Questions-EI_IE403326.0,10_KO11,35.htm",
      },
    ],
  },
  {
    id: "zoho",
    name: "Zoho",
    sector: "product",
    tag: "Long multi-stage day: aptitude, raw C-style programming, then an advanced build round.",
    loc: "Chennai · Tenkasi",
    ladder: [
      {
        lvl: "SDE",
        internal: "Member Technical Staff",
        yoe: "0–3",
        loop: "Aptitude → basic programming → advanced programming → technical HR → HR",
        bar: "Write working programs without libraries; strong logic on paper.",
      },
      {
        lvl: "SDE2",
        internal: "MTS-2",
        yoe: "3–6",
        loop: "Programming + design + technical HR",
        bar: "Data structure implementation from scratch, OOP modelling, DB design.",
      },
      {
        lvl: "Lead SDE",
        internal: "Technical Lead",
        yoe: "6–10",
        loop: "Design + architecture + managerial",
        bar: "Owns a product module end to end; pragmatic design, cost awareness.",
      },
      {
        lvl: "Staff SDE",
        internal: "Principal",
        yoe: "10–15",
        loop: "Architecture + leadership",
        bar: "Multi-product architecture, infrastructure ownership (Zoho runs its own data centres).",
      },
      {
        lvl: "Principal SDE",
        internal: "Distinguished",
        yoe: "15+",
        loop: "Architecture panel",
        bar: "Long-range platform direction.",
      },
    ],
    loop: [
      {
        n: 1,
        name: "Aptitude + written test",
        dur: "60–90 min",
        fmt: "Written/online",
        tests: "Quant, logic, and basic programming output prediction.",
        levels: ["SDE"],
      },
      {
        n: 2,
        name: "Basic programming",
        dur: "2–3 hours",
        fmt: "Machine, no internet",
        tests:
          "5–10 problems written in C/Java/Python without library shortcuts: string manipulation, matrices, number theory, pattern printing.",
        levels: ["SDE"],
      },
      {
        n: 3,
        name: "Advanced programming",
        dur: "3 hours",
        fmt: "Machine",
        tests:
          "One larger application — a text editor, a bank simulation, a mini file system, a scheduling tool — built end to end.",
        levels: ["SDE", "SDE2"],
      },
      {
        n: 4,
        name: "Technical HR",
        dur: "45 min",
        fmt: "Conversation",
        tests:
          "Your code walkthrough, CS fundamentals, DB design, and a lot of 'why did you do it this way'.",
        levels: ["SDE", "SDE2", "Lead SDE"],
      },
      {
        n: 5,
        name: "Design / architecture",
        dur: "60 min",
        fmt: "Discussion",
        tests:
          "For experienced hires: module design, schema design, scaling within a self-hosted data centre model.",
        levels: ["SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
    ],
    bank: [
      {
        q: "Advanced round: build a mini text editor / file utility from scratch",
        t: "lld",
        lv: ["SDE", "SDE2"],
        d: "H",
        round: 3,
        ans: "lld-filemanager",
        note: "Zoho's advanced round expects a working program in 3 hours with no libraries: file I/O, an in-memory buffer, undo, and a command loop. The library answer's composite tree and command/undo structure is the model; keep the implementation simple and runnable.",
      },
      {
        q: "Implement a data structure from scratch (linked list, hash map, LRU) without library classes",
        t: "coding",
        lv: ["SDE", "SDE2"],
        d: "M",
        round: 2,
        ans: "lru",
        note: "Zoho explicitly bans collections in the early rounds — implement the buckets, the chaining and the resize yourself. Know the load factor and why resizing rehashes.",
      },
      {
        q: "String and matrix manipulation without built-ins (reverse words, spiral print, pattern printing)",
        t: "coding",
        lv: ["SDE"],
        d: "E",
        round: 2,
        a: "The basic round is a volume test: 5–10 small programs in a couple of hours. What fails candidates is not difficulty but **edge cases and compilation**: multiple spaces in a sentence, empty input, odd-sized matrices, and off-by-one on the spiral boundaries.\n\nA fast template for spiral order: keep `top, bottom, left, right` and walk four edges, shrinking after each, with a guard before the two reverse passes so a single remaining row or column is not printed twice. For word reversal without `split`, walk the string tracking word boundaries and write into a buffer from the end.\n\nWrite a `main` that runs your examples — Zoho grades on the program actually producing the expected output.",
        code: {
          java: 'void spiralPrint(int[][] m) {\n    int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;\n    while (top <= bottom && left <= right) {\n        for (int c = left; c <= right; c++) System.out.print(m[top][c] + " ");\n        top++;\n        for (int r = top; r <= bottom; r++) System.out.print(m[r][right] + " ");\n        right--;\n        if (top <= bottom) {                       // guard: single row left\n            for (int c = right; c >= left; c--) System.out.print(m[bottom][c] + " ");\n            bottom--;\n        }\n        if (left <= right) {                       // guard: single column left\n            for (int r = bottom; r >= top; r--) System.out.print(m[r][left] + " ");\n            left++;\n        }\n    }\n}',
          py: "def spiral(m):\n    top, bottom, left, right = 0, len(m) - 1, 0, len(m[0]) - 1\n    out = []\n    while top <= bottom and left <= right:\n        out += [m[top][c] for c in range(left, right + 1)]; top += 1\n        out += [m[r][right] for r in range(top, bottom + 1)]; right -= 1\n        if top <= bottom:\n            out += [m[bottom][c] for c in range(right, left - 1, -1)]; bottom -= 1\n        if left <= right:\n            out += [m[r][left] for r in range(bottom, top - 1, -1)]; left += 1\n    return out",
        },
      },
      {
        q: "Design the schema for a small business app (invoicing, CRM, inventory)",
        t: "concept",
        lv: ["SDE2", "Lead SDE"],
        round: 5,
        ans: "c-sqlnosql",
        note: "Zoho builds business software, so schema design questions are concrete: normalise to 3NF, then justify any denormalisation; know indexing and the queries the app will actually run.",
      },
      {
        q: "Explain OOP with an example from your own code",
        t: "concept",
        lv: ["SDE", "SDE2"],
        round: 4,
        ans: "c-patterns",
      },
      {
        q: "Why Zoho, and would you relocate to Chennai/Tenkasi?",
        t: "behavioral",
        lv: ["SDE", "SDE2", "Lead SDE"],
        round: 5,
        ans: "b-why",
        note: "Location and long-term intent are asked seriously here — Zoho hires for retention and runs its own campuses outside metros.",
      },
    ],
    prep: [
      "Practise writing programs without library helpers — implement collections, string ops and I/O yourself.",
      "The advanced round is a build sprint: rehearse producing a runnable console application in three hours.",
      "Be ready to defend every line in the technical HR round; they walk through your own submission.",
    ],
    sources: [
      {
        label: "GeeksforGeeks — Zoho interview experience 2025",
        url: "https://www.geeksforgeeks.org/interview-experiences/zoho-interview-experience-software-developer-intern-fte-2025/",
      },
      {
        label: "InterviewBit — Zoho interview questions",
        url: "https://www.interviewbit.com/zoho-interview-questions/",
      },
    ],
  },
  {
    id: "freshworks",
    name: "Freshworks",
    sector: "product",
    tag: "Five rounds with a bar raiser and a culture-fit round that genuinely rejects people.",
    loc: "Chennai · Bengaluru · Hyderabad",
    deep: true,
    ladder: [
      {
        lvl: "SDE",
        internal: "SE / IC1",
        yoe: "0–3",
        loop: "OA + DSA + design + HM",
        bar: "Medium DSA, basic API/DB design.",
      },
      {
        lvl: "SDE2",
        internal: "SDE-2 / IC2",
        yoe: "3–6",
        loop: "DSA + design + HLD/LLD + hiring manager",
        bar: "Rate limiting, LRU, web scraper, DB design; 'Strong Hire / Hire / Neutral' scoring per round.",
      },
      {
        lvl: "Lead SDE",
        internal: "Lead SE / IC3",
        yoe: "5–12",
        loop: "DSA → system design → bar raiser → hiring manager → culture fit",
        bar: "The bar raiser (a Staff engineer) mixes a Hard problem, a design and a deep dive; rounds 4 and 5 reject candidates who cleared all technical rounds.",
      },
      {
        lvl: "Staff SDE",
        internal: "Staff / IC4",
        yoe: "10–14",
        loop: "Two designs + architecture + leadership + culture",
        bar: "Multi-tenant platform design, noisy-neighbour isolation, cross-team influence.",
      },
      {
        lvl: "Principal SDE",
        internal: "Principal / IC5",
        yoe: "14+",
        loop: "Architecture + director panel",
        bar: "Product-line architecture and technical strategy.",
      },
    ],
    loop: [
      {
        n: 1,
        name: "Problem solving & DSA",
        dur: "60–75 min",
        fmt: "Pen and paper at hiring drives; shared editor when remote",
        tests: "One or two problems plus quick concept checks (indexing, consistent hashing).",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE"],
      },
      {
        n: 2,
        name: "System design (HLD or LLD)",
        dur: "60–75 min",
        fmt: "Whiteboard",
        tests: "Rate limiter, social feed, auth, log management, on-call roster, cache.",
        levels: ["SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
      {
        n: 3,
        name: "Bar raiser",
        dur: "60–90 min",
        fmt: "Mixed, usually a Staff engineer",
        tests:
          "A Hard problem, a design, and a deep dive into your current system with rapid-fire concepts.",
        levels: ["SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
      {
        n: 4,
        name: "Hiring manager / director",
        dur: "~60 min",
        fmt: "Conversation + whiteboard",
        tests:
          "Still technical at Lead level: sketch your current architecture, integrate a new subsystem, leadership stories.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
      {
        n: 5,
        name: "Culture fit",
        dur: "~30 min",
        fmt: "Conversation",
        tests: "The five published values; candidates report rejections here.",
        levels: ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
      },
    ],
    bank: [
      {
        q: "Design an API rate limiter",
        t: "hld",
        lv: ["SDE2", "Lead SDE", "Staff SDE"],
        d: "M",
        round: 2,
        ans: "hld-ratelimiter",
        note: "Appeared in 6 of 26 candidate reports — the single most repeated Freshworks question.",
      },
      {
        q: "LRU Cache",
        t: "coding",
        lv: ["SDE", "SDE2", "Lead SDE"],
        d: "M",
        lc: 146,
        slug: "lru-cache",
        round: 1,
        ans: "lru",
      },
      {
        q: "Design a web crawler to depth N",
        t: "hld",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        round: 3,
        ans: "hld-crawler",
      },
      {
        q: "Design an on-call roster (PagerDuty-like)",
        t: "lld",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        round: 2,
        ans: "lld-roster",
      },
      {
        q: "Design a social media feed",
        t: "hld",
        lv: ["SDE2", "Lead SDE"],
        d: "H",
        round: 2,
        ans: "hld-social",
      },
      {
        q: "Word Ladder",
        t: "coding",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        lc: 127,
        slug: "word-ladder",
        round: 3,
        ans: "wordladder",
      },
      {
        q: "Max Chunks To Make Sorted",
        t: "coding",
        lv: ["SDE2", "Lead SDE"],
        d: "M",
        lc: 769,
        slug: "max-chunks-to-make-sorted",
        round: 1,
        ans: "maxchunks",
      },
      {
        q: "Explain the CAP theorem",
        t: "concept",
        lv: ["Lead SDE", "Staff SDE"],
        round: 3,
        ans: "c-cap",
      },
      {
        q: "SQL vs MongoDB vs Cassandra — when would you pick each?",
        t: "concept",
        lv: ["Lead SDE", "Staff SDE"],
        round: 3,
        ans: "c-sqlnosql",
      },
      {
        q: "Culture fit: values alignment and role expectations",
        t: "behavioral",
        lv: ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"],
        round: 5,
        ans: "b-values",
      },
      {
        q: "Nearest Smaller Element to the Left using Monotonic Stack",
        t: "coding",
        lv: ["SDE2", "Lead SDE"],
        d: "M",
        round: 1,
        a: "**Problem**: Given an array of integers, for each element find the closest smaller element that appears to its left. If none exists, output -1.\n\n**Optimal Monotonic Stack Approach**: Maintain a stack of elements strictly in increasing order. When inspecting `arr[i]`, pop all elements from the stack that are `>= arr[i]` (since they can never be the nearest smaller element for `arr[i]` or any element to its right). The current stack top is the nearest smaller element to the left. Then push `arr[i]`. O(N) time (each element pushed and popped at most once), O(N) space.\n\n**Interviewer Signals**: State the amortized $O(N)$ proof out loud; do not stop at the $O(N^2)$ brute force. SDE 2 and Lead candidates are asked this on paper in in-person Chennai/Bengaluru drives.",
        code: {
          java: `public int[] nearestSmallerLeft(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && stack.peek() >= arr[i]) {
            stack.pop();
        }
        result[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(arr[i]);
    }
    return result;
}`,
          py: `def nearest_smaller_left(arr):
    result = []
    stack = []
    for x in arr:
        while stack and stack[-1] >= x:
            stack.pop()
        result.append(stack[-1] if stack else -1)
        stack.append(x)
    return result`,
        },
        fu: [
          {
            q: "How to handle an unbounded streaming incoming sequence?",
            a: "Keep the monotonic stack in memory. If elements must also have an expiry or window (e.g. nearest smaller within last K seconds), store pairs (value, timestamp) and evict outdated timestamps from the bottom with a Deque.",
          },
        ],
      },
      {
        q: "How do you diagnose and speed up a high-latency API endpoint in a multi-tenant SaaS?",
        t: "concept",
        lv: ["Lead SDE", "Staff SDE"],
        round: 1,
        a: "**Diagnostic Protocol (Methodical 6-Step Hierarchy)**:\n1. **Telemetry & Distributed Tracing**: Inspect APM spans (OpenTelemetry/Datadog) to isolate p99 latency contribution: Downstream HTTP vs Database Query vs JVM Garbage Collection pause vs Lock contention.\n2. **Query Plan & Database Indexing**: Execute `EXPLAIN ANALYZE` on slowest SQL queries. Inspect for Table Scans (lack of composite index on `(tenant_id, status, created_at)`), Filesorts, and N+1 query loops in ORM models.\n3. **Noisy Neighbor Check**: In a shared multi-tenant database, check if a single high-volume tenant is consuming 80%+ of DB buffer pool or running un-indexed bulk exports. Mitigate using per-tenant rate limiters and dedicated replica pools.\n4. **Caching & Stampede Protection**: Cache read-heavy tenant configurations in Redis with key prefix `tenant:{id}:cache:{key}`. Use distributed mutex / singleflight pattern to prevent cache stampedes during key invalidation.\n5. **Connection Pool Starvation**: Check HikariCP active vs idle connections. Connection leaks or holding DB connections across slow third-party webhook calls rapidly exhausts the pool.\n6. **Asynchronous Offloading**: Move non-critical synchronous processing (email dispatch, auditing, search indexing) into background Kafka workers.",
      },
      {
        q: "Machine Coding: Multi-Tenant Ticket SLA Tracker & Escalation Policy Engine",
        t: "lld",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        round: 2,
        a: "**Problem**: Build Freshdesk's core SLA engine in 90 minutes. Must handle: (1) Per-tenant SLA policies (First Response SLA, Resolution SLA); (2) Business hours calculation (skipping weekends, holidays, and night hours); (3) Dynamic status changes (e.g. ticket moving to 'Waiting on Customer' pauses SLA timer; moving to 'Open' resumes it); (4) Escalation ladder when breach threshold is approached.\n\n**Grading Standards**: Thread-safe timer management, accurate calendar/business hours arithmetic, extensible notification hooks, and JUnit/pytest test suites.",
        code: {
          java: `public class SlaEngine {
    public enum TicketStatus { OPEN, PENDING_CUSTOMER, RESOLVED, CLOSED }
    public enum SlaState { RUNNING, PAUSED, BREACHED, MET }

    public record BusinessHours(LocalTime workStart, LocalTime workEnd, Set<DayOfWeek> workDays) {
        public boolean isWorking(LocalDateTime dt) {
            return workDays.contains(dt.getDayOfWeek())
                && !dt.toLocalTime().isBefore(workStart)
                && dt.toLocalTime().isBefore(workEnd);
        }
    }

    public static class SlaTracker {
        final String ticketId;
        final long targetResponseMins;
        long elapsedWorkingMins = 0;
        LocalDateTime lastEventTime;
        SlaState state = SlaState.RUNNING;
        final ReentrantLock lock = new ReentrantLock();

        public SlaTracker(String ticketId, long targetResponseMins, LocalDateTime now) {
            this.ticketId = ticketId;
            this.targetResponseMins = targetResponseMins;
            this.lastEventTime = now;
        }

        public void onStatusChange(TicketStatus status, LocalDateTime now, BusinessHours hours) {
            lock.lock();
            try {
                if (state == SlaState.RUNNING && hours.isWorking(lastEventTime)) {
                    long addedMins = Duration.between(lastEventTime, now).toMinutes();
                    elapsedWorkingMins += addedMins;
                    if (elapsedWorkingMins > targetResponseMins) state = SlaState.BREACHED;
                }
                lastEventTime = now;
                if (status == TicketStatus.PENDING_CUSTOMER) state = SlaState.PAUSED;
                else if (status == TicketStatus.OPEN && state == SlaState.PAUSED) state = SlaState.RUNNING;
                else if (status == TicketStatus.RESOLVED) state = (elapsedWorkingMins <= targetResponseMins) ? SlaState.MET : SlaState.BREACHED;
            } finally { lock.unlock(); }
        }
    }
}`,
          py: `from datetime import datetime, time, timedelta
import threading

class SlaTracker:
    def __init__(self, ticket_id, target_minutes, work_start=time(9,0), work_end=time(18,0)):
        self.ticket_id = ticket_id
        self.target_minutes = target_minutes
        self.work_start = work_start
        self.work_end = work_end
        self.elapsed_minutes = 0
        self.last_ts = datetime.now()
        self.state = "RUNNING"
        self.lock = threading.Lock()

    def update_status(self, new_status, now):
        with self.lock:
            if self.state == "RUNNING":
                # calculate working minutes elapsed
                delta = (now - self.last_ts).total_seconds() / 60.0
                self.elapsed_minutes += delta
                if self.elapsed_minutes > self.target_minutes:
                    self.state = "BREACHED"
            self.last_ts = now
            if new_status == "PENDING_CUSTOMER":
                self.state = "PAUSED"
            elif new_status == "OPEN" and self.state == "PAUSED":
                self.state = "RUNNING"
            elif new_status == "RESOLVED":
                self.state = "MET" if self.elapsed_minutes <= self.target_minutes else "BREACHED"`,
        },
      },
      {
        q: "Machine Coding: Dynamic Form Builder with Schema Validation & Admin Field Filters",
        t: "lld",
        lv: ["SDE2", "Lead SDE"],
        d: "H",
        round: 2,
        a: "**Problem**: Freshworks products (Freshdesk/Freshservice) allow tenant admins to define custom ticket form fields with validation rules (e.g., dropdowns, regex text fields, required checkboxes, nested sub-categories).\n\n**Architecture**: Composite Pattern with `FormField<T>`, `FieldValidator` (RegexValidator, NumberRangeValidator, RequiredValidator), `FormSchema` definition per tenant, and `FormSubmission` validator returning a structured list of validation errors.",
        code: {
          java: `public class FormBuilder {
    public interface Validator {
        Optional<String> validate(Object value);
    }

    public record RegexValidator(String pattern, String errorMsg) implements Validator {
        public Optional<String> validate(Object value) {
            if (value == null || !value.toString().matches(pattern)) return Optional.of(errorMsg);
            return Optional.empty();
        }
    }

    public static class FormField {
        final String fieldId;
        final String label;
        final boolean required;
        final List<Validator> validators = new ArrayList<>();

        public FormField(String id, String label, boolean req) {
            this.fieldId = id; this.label = label; this.required = req;
        }

        public List<String> validate(Object input) {
            List<String> errors = new ArrayList<>();
            if (required && (input == null || input.toString().isBlank())) {
                errors.add(label + " is required.");
                return errors;
            }
            if (input != null) {
                for (Validator v : validators) v.validate(input).ifPresent(errors::add);
            }
            return errors;
        }
    }
}`,
          py: `import re

class FormField:
    def __init__(self, field_id, label, required=False, regex_pattern=None):
        self.field_id = field_id
        self.label = label
        self.required = required
        self.regex = re.compile(regex_pattern) if regex_pattern else None

    def validate(self, value):
        errors = []
        if self.required and (value is None or str(value).strip() == ""):
            errors.append(f"{self.label} is required.")
            return errors
        if value is not None and self.regex:
            if not self.regex.match(str(value)):
                errors.append(f"{self.label} format is invalid.")
        return errors`,
        },
      },
      {
        q: "Design Multi-Tenant SaaS Architecture for Freshdesk (Tenant Isolation & Noisy Neighbor Mitigation)",
        t: "hld",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        round: 3,
        a: "**Scale**: 60,000+ businesses (tenants), 100M+ tickets/month, sub-100 ms API response, zero cross-tenant data leakage.\n\n**Three Database Tenancy Models & Trade-Offs**:\n1. *Database-per-tenant*: Maximum security/isolation, but severe connection pool exhaustion and unmanageable database migration scripts across 60,000 schemas.\n2. *Shared DB, Shared Schema with `tenant_id` column*: Maximum packing density and cost-efficiency; risk of cross-tenant query bugs and noisy neighbor resource monopolization.\n3. *Freshworks Tiered Hybrid Approach*: Shared database clusters with logical tenant sharding for SMB/Mid-market; Dedicated isolated physical clusters for Top 5% Enterprise tenants.\n\n**Ingress & Routing Architecture**:\n- **Gateway & Domain Resolution**: Ingress Envoy gateway inspects custom domain (e.g. `support.acme.com`) or subdomain (`acme.freshdesk.com`). Checks Redis Tenant Directory cache to inject `X-Tenant-ID` and `X-Tenant-Shard` headers.\n- **Noisy Neighbor Protection**: Two-tier Token Bucket rate limiting (Global tier + Per-tenant tier). Kafka ingestion queues separated into High-Priority (real-time user actions) and Bulk/Background queues (batch CSV imports).\n- **Database Security**: PostgreSQL Row-Level Security (RLS) enforcing `USING (tenant_id = current_setting('app.current_tenant_id'))` at the engine level, guaranteeing zero application-level data leakage even if developer forgets a WHERE clause.",
        fu: [
          {
            q: "How to migrate an enterprise tenant from shared DB to a dedicated cluster with zero downtime?",
            a: "1. Snapshot & backfill past data to dedicated DB. 2. Enable dual-write via Change Data Capture (Debezium/Kafka) to mirror incoming changes. 3. Verify replication lag = 0. 4. Flip tenant routing pointer in Redis atomically (takes < 1 ms). 5. Decommission old tenant rows asynchronously.",
          },
        ],
      },
      {
        q: "Design an Omnichannel Real-Time Messaging Platform (WhatsApp, Live Chat, Email)",
        t: "hld",
        lv: ["Lead SDE", "Staff SDE"],
        d: "H",
        round: 3,
        a: "**Problem**: Freshchat aggregates WhatsApp Business API, Live Chat WebSockets, Apple Messages for Business, and Email into a single agent console.\n\n**Architecture**:\n1. **Channel Adapters**: Ingress webhooks from Meta WhatsApp, SendGrid, Apple Business Chat parsed into a standardized `OmnichannelEvent(tenantId, channelType, senderId, conversationId, messageBody, attachments)`.\n2. **Conversation Manager**: Stateful actor / state machine holding conversation context (Active, Bot-Handled, Agent-Assigned, Resolved). Keyed by `tenant_id:conversation_id`.\n3. **Agent Routing & Presence Engine**: Matches unassigned conversations to agents based on skills, channel capacity (e.g. max 4 active WhatsApp chats per agent), and real-time WebSocket connection presence.\n4. **WebSocket Fan-out Gateway**: Distributed Netty/Node.js WebSocket cluster backed by Redis Pub/Sub channels per tenant to stream agent typing indicators and live messages sub-50 ms.",
      },
      {
        q: "Bar Raiser: Outage Post-Mortem, Connection Pool Starvation & Distributed Deadlock Resolution",
        t: "behavioral",
        lv: ["Lead SDE", "Staff SDE"],
        round: 4,
        a: "**Bar Raiser Scenario (Conducted by Staff/Principal Engineer)**: Walk through a real production crisis you resolved.\n\n**Strong STAR Response (HikariCP Connection Pool Exhaustion)**:\n- **Situation**: During a product launch, our core API began failing with HTTP 504 Gateway Timeouts across all tenants, despite DB CPU being only at 25%.\n- **Task**: Lead emergency triage and restore availability within 15 minutes.\n- **Action**: Pulled thread dumps and HikariCP connection pool metrics. Discovered 100% of connections were in `ACTIVE` state and 0 `IDLE`. Root cause: A recent feature called a third-party CRM webhook synchronously inside an open `@Transactional` database method. When the external webhook had a 15-second latency hiccup, DB connections were held idle waiting on network I/O, rapidly exhausting our 50-connection pool.\n- **Resolution**: (1) Severed the webhook call from the transactional boundary using an asynchronous Outbox pattern with Kafka; (2) Added Resilience4j circuit breakers with a 1.5s timeout; (3) Added HikariCP connection acquisition latency alarms in Grafana.\n\n**Database Locking Probe**: Why pessimistic locking (`SELECT ... FOR UPDATE`) causes deadlocks across related tables under high concurrency, and why Optimistic Concurrency Control (`UPDATE ... WHERE version = ?`) with exponential backoff retries is superior for multi-tenant SaaS ticket updates.",
      },
      {
        q: "Bar Raiser Puzzle: The 5-Tyre Car Rotation Puzzle (Each tyre lasts 20 km — how to drive 25 km?)",
        t: "concept",
        lv: ["Lead SDE"],
        round: 4,
        a: "**Problem**: A car has 4 wheels in active use, plus 1 spare tyre in the boot. Each tyre has a maximum tread lifespan of 20 km. What is the maximum distance the car can drive, and what is the rotation schedule?\n\n**Mathematical Proof**:\n- Total available tyre wear capacity = 5 tyres × 20 km = 100 tyre-km.\n- The car requires 4 active tyres on the road at any given moment.\n- Maximum theoretical distance = 100 tyre-km / 4 tyres = **25 km**.\n\n**Optimal 5-Stage Rotation Schedule (Rotate every 5 km)**:\n- Stage 1 (0 to 5 km): Tyres 1, 2, 3, 4 run on the car. Tyre 5 rests in boot.\n- Stage 2 (5 to 10 km): Tyres 1, 2, 3, 5 run. Tyre 4 rests.\n- Stage 3 (10 to 15 km): Tyres 1, 2, 4, 5 run. Tyre 3 rests.\n- Stage 4 (15 to 20 km): Tyres 1, 3, 4, 5 run. Tyre 2 rests.\n- Stage 5 (20 to 25 km): Tyres 2, 3, 4, 5 run. Tyre 1 rests.\n\nAt 25 km, each of the 5 tyres has run exactly 4 stages × 5 km = 20 km, perfectly exhausting all tyres simultaneously.",
      },
      {
        q: "Technical Leadership: Balancing Tech Debt vs Product Roadmap, Code Reviews & Team Mentorship",
        t: "behavioral",
        lv: ["Lead SDE", "Staff SDE"],
        round: 5,
        a: "**Director / Engineering Manager Round Framework**:\n1. **Managing Tech Debt vs Velocity**: Negotiate an explicit 20% engineering allocation in each sprint for refactoring, dependency upgrades, and performance tuning. Quantify tech debt in business terms: *'Fixing this query reduces cloud database spend by $4,000/month and drops p99 latency from 1.2s to 80ms.'*\n2. **Driving Zero-Downtime Migrations**: Use the **Strangler Fig pattern** and feature flags rather than high-risk big-bang releases.\n3. **Code Review Standards**: Tier PR reviews into (a) Functional correctness and test coverage, (b) Non-functional safety (multi-tenant RLS checks, query plan impact, N+1 query elimination), and (c) Automated style checks enforced strictly by CI linters so senior engineers focus only on architecture.\n4. **Mentoring Underperforming Engineers**: Establish clear, unambiguous goals; identify if the bottleneck is skill gap vs motivation vs unclear PRDs; establish a 30-day paired-programming checkpoint plan with weekly written feedback.",
      },
      {
        q: "Sort Colors / Dutch National Flag Algorithm (0s, 1s, 2s in one pass)",
        t: "coding",
        lv: ["SDE", "SDE2"],
        d: "M",
        lc: 75,
        slug: "sort-colors",
        round: 1,
        a: "**Problem**: Given an array with `n` objects colored red, white, or blue (represented by 0, 1, 2), sort them in-place so that objects of the same color are adjacent, with 0s first, then 1s, then 2s.\n\n**Three-Pointer Approach (Dutch National Flag)**: Maintain `low = 0`, `mid = 0`, and `high = n - 1`.\n- If `nums[mid] == 0`: swap `nums[low]` and `nums[mid]`, increment `low++` and `mid++`.\n- If `nums[mid] == 1`: increment `mid++`.\n- If `nums[mid] == 2`: swap `nums[mid]` and `nums[high]`, decrement `high--` (do NOT increment `mid`, as the swapped element must be checked).\nO(N) time in a single pass, O(1) space.",
        code: {
          java: `public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] == 0) {
            int tmp = nums[low]; nums[low++] = nums[mid]; nums[mid++] = tmp;
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            int tmp = nums[mid]; nums[mid] = nums[high]; nums[high--] = tmp;
        }
    }
}`,
          py: `def sort_colors(nums):
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1; mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1`,
        },
      },
      {
        q: "REST Verbs: PUT vs PATCH vs POST, and Idempotency Guarantees",
        t: "concept",
        lv: ["SDE", "SDE2"],
        round: 1,
        a: "**Core Differences**:\n- **POST**: Creates a subordinate resource; **non-idempotent** (calling POST twice creates two separate resources with different IDs).\n- **PUT**: Complete replacement of the resource; **idempotent** (calling PUT multiple times with the same payload results in the exact same resource state).\n- **PATCH**: Partial modification/delta of the resource; **not inherently idempotent** (e.g. `PATCH /items/1 {\"count\": {\"$inc\": 1}}` increments each time, though `PATCH /items/1 {\"status\": \"ACTIVE\"}` is idempotent).\n\n**Production Idempotency Pattern**: For mutating financial or ticket operations over POST/PATCH, client sends an `Idempotency-Key` header (UUID). Server saves key with response in a 24-hour Redis/DB cache. If duplicate request arrives, returns saved response without re-executing business logic.",
      },
      {
        q: "Cell-Based Architecture for Global SaaS: Limiting Blast Radius across 100,000 Tenants",
        t: "hld",
        lv: ["Staff SDE", "Principal SDE"],
        d: "H",
        round: 3,
        a: "**Architectural Principle**: A single global monolithic cluster means a fatal database bug or bad config rollout takes down 100,000 tenants simultaneously. Cell-Based Architecture partitions the entire platform into independent, self-contained, deployable mini-instances ('Cells').\n\n**Cell Composition**:\n- Each Cell hosts ~5,000 tenants and possesses its own dedicated Kubernetes cluster, Aurora PostgreSQL database cluster, Redis cluster, and Kafka brokers.\n- **Routing Layer**: Edge Envoy proxies consult an in-memory Global Tenant Mapping cache to route traffic to Cell-1, Cell-2, etc.\n- **Blast Radius**: A P0 database crash in Cell-2 affects only 5% of customers; 95% of tenants in other cells experience zero degradation.\n- **Upgrades**: Deployments roll out to a canary cell first, soak for 2 hours, and proceed cell-by-cell.",
      },
      {
        q: "Design Freddy AI: Multi-Tenant RAG & LLM Customer Service Copilot",
        t: "hld",
        lv: ["Staff SDE", "Principal SDE"],
        d: "H",
        round: 3,
        a: "**Problem**: Freshworks Freddy AI drafts contextual ticket responses for customer service agents using company knowledge base articles and past resolved tickets, with sub-2s latency and zero cross-tenant leakage.\n\n**Pipeline Architecture**:\n1. **Document Ingestion & Chunking**: Articles and ticket conversations cleaned, PII masked, chunked into 512-token segments with 50-token overlap.\n2. **Multi-Tenant Vector Index**: Generate text embeddings via text-embedding-3-small. Store in vector database (OpenSearch / Pinecone) with **mandatory tenant metadata filter** (`metadata.tenant_id = 'acme'`). The vector query strictly partitions vector search spaces so Tenant A's documents can never be retrieved by Tenant B.\n3. **Hybrid Search**: Combine Dense Semantic Vector search with BM25 Lexical Keyword search using Reciprocal Rank Fusion (RRF).\n4. **LLM Generation & Safety**: Retrieve top 4 context chunks, assemble system prompt with strict ground-truth instructions ('Answer only using the provided documentation. If unknown, say I do not have enough information.'). Stream generated tokens to agent frontend via Server-Sent Events (SSE).",
      },
    ],
    prep: [
      "This company has a full 93-answer sheet already built — use the deep-dive links above for the complete question bank and worked answers.",
      "Rate limiter, LRU cache and the depth-N web crawler cover the three most repeated questions.",
      "Rounds 4 and 5 reject candidates who cleared the technical rounds; prepare leadership stories and the five values.",
    ],
    sources: [
      {
        label: "Full Freshworks question bank (26 candidate reports)",
        url: "https://claude.ai/code/artifact/e5750d96-b192-4dc8-b4aa-f853716c2c27",
      },
      {
        label: "Full Freshworks answer sheet (93 worked answers)",
        url: "https://claude.ai/code/artifact/a43ad724-d04d-485a-a17e-5d14e23d77b7",
      },
    ],
  },
];
