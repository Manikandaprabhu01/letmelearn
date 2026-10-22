// Imported from the Freshworks Lead SE question bank (1-freshworks-question-bank.html).
import type { DeepRound, DeepSource } from "./types";

export const FRESHWORKS_SOURCES: DeepSource[] = [
  {
    id: "L1",
    label: "LeetCode — Lead SE, Backend · 2024 · Offer",
    url: "https://leetcode.com/discuss/interview-experience/5256522/Freshworks-Interview-Experience-Lead-Software-Engineer-BackEnd/",
  },
  {
    id: "L2",
    label: "LeetCode — Lead Engineer · 2024",
    url: "https://leetcode.com/discuss/interview-experience/4532978/Freshworks-or-Lead-Engineer/",
  },
  {
    id: "L3",
    label: "LeetCode — Lead · 2024",
    url: "https://leetcode.com/discuss/interview-experience/4832058/Freshworks-or-Lead",
  },
  {
    id: "L4",
    label: "LeetCode — Lead SE, Hyderabad · Jul 2024 · Offer (6+ YOE)",
    url: "https://leetcode.com/discuss/interview-experience/5761982/Freshworks-or-Lead-Software-Engineer-or-Hyderabad-or-Jul-2024-Offer/",
  },
  {
    id: "L5",
    label: "Medium (Mukul Jha) — Tech Lead · Jan 2024",
    url: "https://medium.com/curious-developer/interview-experience-freshworks-tech-lead-jan-2024-23696a8a17e2",
  },
  {
    id: "L6",
    label: "Glassdoor — Lead Software Engineer · 3 reviews, Sep 2025 – May 2026",
    url: "https://www.glassdoor.com/Interview/Freshworks-Lead-Software-Engineer-Interview-Questions-EI_IE1680273.0,10_KO11,33.htm",
  },
  {
    id: "L7",
    label: "Glassdoor — Lead Engineer · 3 reviews, 2021 – Sep 2025",
    url: "https://www.glassdoor.co.in/Interview/Freshworks-Lead-Engineer-Interview-Questions-EI_IE1680273.0,10_KO11,24.htm",
  },
  {
    id: "S1",
    label: "LeetCode — SSE, Bangalore · Jul 2021 (5 YOE)",
    url: "https://leetcode.com/discuss/interview-experience/1362538/freshworks-sse-bangalore-july-2021-offer-declined",
  },
  {
    id: "S2",
    label: "LeetCode — SSE (IC2) · Nov 2025 · Offer",
    url: "https://leetcode.com/discuss/interview-experience/7380898",
  },
  {
    id: "S3",
    label: "LeetCode — SDE-2, interviewed by Lead & Staff engineers · Sep 2025",
    url: "https://leetcode.com/discuss/interview-experience/7225569/",
  },
  {
    id: "S4",
    label: "LeetCode — SSE, Bangalore · Aug 2025 · Rejected",
    url: "https://leetcode.com/discuss/interview-experience/7107261",
  },
  {
    id: "S5",
    label: "GeeksforGeeks — Senior Software Developer · 2019 · Offer",
    url: "https://www.geeksforgeeks.org/interview-experiences/freshworks-interview-experience-for-senior-software-developer/",
  },
  {
    id: "S6",
    label: "GeeksforGeeks — Senior Backend Developer · Dec 2020",
    url: "https://www.geeksforgeeks.org/freshworks-interview-experience-for-senior-backend-developer/",
  },
  {
    id: "S7",
    label: "Glassdoor — Senior Software Engineer · 3 reviews, 2025–2026",
    url: "https://www.glassdoor.co.in/Interview/Freshworks-Senior-Software-Engineer-Interview-Questions-EI_IE1680273.0,10_KO11,35.htm",
  },
  {
    id: "S8",
    label: "LeetCode — SSE, Chennai & Bangalore · 2025 · Selected",
    url: "https://leetcode.com/discuss/interview-experience/7031783/",
  },
  {
    id: "S9",
    label: "CodingKaro — roundup of SSE / SDE-2 reports, 2025",
    url: "https://www.codingkaro.in/jobs-internships/leetcode-interview-experience/Freshworks",
  },
  {
    id: "S10",
    label: "EngineBogie — Senior Software Engineer",
    url: "https://enginebogie.com/interview/experience/freshworks-senior-software-engineer/874",
  },
];

export const FRESHWORKS_ROUNDS: DeepRound[] = [
  {
    n: 1,
    id: "r1",
    name: "Problem Solving & DSA",
    meta: "60–75 min · pen & paper at hiring drives, shared editor when remote · usually opens with a resume walkthrough",
    tests:
      "You'll get one or two problems, usually Medium, and need working code with a complexity analysis. Short concept questions often come up too.",
    groups: [
      {
        type: "coding",
        title: "Coding",
        items: [
          {
            q: "LRU Cache — get / put in O(1)",
            lc: 146,
            slug: "lru-cache",
            d: "M",
            s: ["L1", "L5", "S8", "S4"],
            n: "The most repeated coding question. S4 and S8 got it as an LLD in round 2.",
          },
          {
            q: "Max Chunks To Make Sorted",
            lc: 769,
            slug: "max-chunks-to-make-sorted",
            d: "M",
            s: ["L4"],
            n: "Solved on paper at an in-person drive. Verdict: Strong Hire.",
          },
          {
            q: "Number of Islands — a modified variant",
            lc: 200,
            slug: "number-of-islands",
            d: "M",
            s: ["L4"],
          },
          {
            q: "Place odd numbers at odd indices and even numbers at even indices",
            lc: 922,
            slug: "sort-array-by-parity-ii",
            d: "E",
            s: ["L3"],
            approx: true,
          },
          {
            q: "A two-pointer problem — explain the approach before writing code on paper",
            d: "M",
            s: ["L7"],
          },
          {
            q: "Medium-level stack and tree problems",
            d: "M",
            s: ["L6"],
          },
          {
            q: "One easy warm-up problem after the project discussion",
            d: "E",
            s: ["L1"],
          },
          {
            q: "Reverse an integer (123 → 321)",
            lc: 7,
            slug: "reverse-integer",
            d: "M",
            s: ["L7"],
            n: "From a 2021 report, along with the next two questions.",
          },
          {
            q: "Reverse the digits of a float (2453.67 → 3542.76)",
            d: "E",
            s: ["L7"],
          },
          {
            q: "Find the next palindrome number after a given number (11 → 22)",
            d: "M",
            s: ["L7"],
          },
          {
            q: "Kth largest element in an unbounded stream — then write the SQL for it",
            lc: 703,
            slug: "kth-largest-element-in-a-stream",
            d: "E",
            s: ["S1"],
          },
          {
            q: "Implement a snapshottable map that scales",
            lc: 1146,
            slug: "snapshot-array",
            d: "M",
            s: ["S1"],
            approx: true,
          },
          {
            q: "Nearest smaller element to the left — brute force, then O(n) with a stack",
            d: "M",
            s: ["S2", "S10"],
          },
          {
            q: "Reverse the first K elements of an array in place",
            d: "E",
            s: ["S2"],
          },
          {
            q: "Meeting Rooms — can one person attend every meeting?",
            lc: 252,
            slug: "meeting-rooms",
            d: "E",
            s: ["S3"],
          },
          {
            q: "Maximum Subarray",
            lc: 53,
            slug: "maximum-subarray",
            d: "M",
            s: ["S3"],
          },
          {
            q: "Binary tree: max depth, left view, top view",
            lc: 104,
            slug: "maximum-depth-of-binary-tree",
            d: "M",
            s: ["S4"],
          },
          {
            q: "Find Peak Element",
            lc: 162,
            slug: "find-peak-element",
            d: "M",
            s: ["S9"],
          },
          {
            q: "Search in Rotated Sorted Array",
            lc: 33,
            slug: "search-in-rotated-sorted-array",
            d: "M",
            s: ["S9"],
          },
          {
            q: "Word Search",
            lc: 79,
            slug: "word-search",
            d: "M",
            s: ["S9"],
          },
          {
            q: "3Sum — without a hash map",
            lc: 15,
            slug: "3sum",
            d: "M",
            s: ["S9"],
          },
          {
            q: "Diameter of Binary Tree",
            lc: 543,
            slug: "diameter-of-binary-tree",
            d: "E",
            s: ["S9"],
          },
          {
            q: "Majority Element",
            lc: 169,
            slug: "majority-element",
            d: "E",
            s: ["S9"],
          },
          {
            q: "Boundary of Binary Tree",
            lc: 545,
            slug: "boundary-of-binary-tree",
            d: "M",
            s: ["S9"],
          },
          {
            q: "Longest Substring Without Repeating Characters",
            lc: 3,
            slug: "longest-substring-without-repeating-characters",
            d: "M",
            s: ["S8"],
          },
          {
            q: "Two Medium binary-search problems that need backtracking",
            d: "M",
            s: ["S7"],
          },
          {
            q: "Sort an array of 0s and 1s",
            lc: 75,
            slug: "sort-colors",
            d: "E",
            s: ["S5"],
            approx: true,
          },
          {
            q: "Intersection of Two Linked Lists",
            lc: 160,
            slug: "intersection-of-two-linked-lists",
            d: "E",
            s: ["S6"],
          },
        ],
      },
      {
        type: "concepts",
        title: "Concepts",
        items: [
          {
            q: "What is database indexing?",
            s: ["L4"],
          },
          {
            q: "What is consistent hashing?",
            s: ["L4"],
          },
          {
            q: "How would you speed up a slow API?",
            s: ["L5"],
            n: "The expected answers cover caching / CDN, rate limiting, DB indexing, load balancing, compression and async processing.",
          },
          {
            q: "Java: memory leaks and garbage collection",
            s: ["S5"],
          },
          {
            q: "Frontend track — JavaScript: closures, hoisting, this, event delegation and propagation, promises, the event loop",
            s: ["S7"],
          },
        ],
      },
      {
        type: "behavioral",
        title: "Behavioral",
        items: [
          {
            q: "Walk me through your experience and your current projects",
            s: ["L1", "L2"],
          },
        ],
      },
    ],
  },
  {
    n: 2,
    id: "r2",
    name: "System Design — HLD or LLD",
    meta: "60–75 min · whiteboard or online board · hiring drives split this into separate LLD and HLD rounds",
    tests:
      "Work through functional and non-functional requirements, APIs, the data model, scaling and trade-offs. Some panels also add a coding problem.",
    groups: [
      {
        type: "hld",
        title: "High-level design",
        items: [
          {
            q: "Design an API rate limiter",
            s: ["L2", "L3", "L6", "S2", "S4", "S10"],
            n: "Asked in 6 reports, in round 1, round 2 or the bar raiser. S2 had built one with Redis + Lua. In L6 the interviewer changed the scope mid-interview.",
          },
          {
            q: "Design a social media platform like Facebook",
            s: ["L1"],
            n: "Cover functional and non-functional requirements, database design, API design and trade-offs.",
          },
          {
            q: "Design an authentication system",
            s: ["L6"],
            n: "The requirements changed partway through.",
          },
          {
            q: "Design a document upload system",
            s: ["L6"],
          },
          {
            q: "Design a log management system",
            s: ["L6"],
          },
          {
            q: "Design a food delivery system like Swiggy / Zomato",
            s: ["S1"],
            n: "Explain how services interact, then the DB structure and the APIs.",
          },
          {
            q: "Design a WhatsApp-like chat system",
            s: ["S3"],
          },
          {
            q: "Design Instagram — APIs, database design, caching",
            s: ["S5"],
          },
          {
            q: "Design the YouTube comment section",
            s: ["S7"],
          },
        ],
      },
      {
        type: "lld",
        title: "Low-level design",
        items: [
          {
            q: "Design an employee roster / on-call management system, like PagerDuty",
            s: ["L4"],
            n: "75 min, on paper. Verdict: Strong Hire.",
          },
          {
            q: "Design a cache system",
            s: ["L3"],
          },
          {
            q: "Design a parking lot",
            s: ["S5"],
          },
          {
            q: "Design a feature flag system",
            s: ["S7"],
          },
          {
            q: "LLD for an e-commerce system like Flipkart",
            s: ["S6"],
          },
          {
            q: "Form builder — APIs to create forms, process submissions dynamically, filter fields for admins, plus the DB schemas",
            s: ["S9"],
          },
        ],
      },
      {
        type: "coding",
        title: "Coding inside the design round",
        items: [
          {
            q: "First Bad Version",
            lc: 278,
            slug: "first-bad-version",
            d: "E",
            s: ["L2"],
          },
          {
            q: "Minimum Number of Days to Disconnect Island",
            lc: 1568,
            slug: "minimum-number-of-days-to-disconnect-island",
            d: "H",
            s: ["S2"],
          },
          {
            q: "Longest Increasing Subsequence",
            lc: 300,
            slug: "longest-increasing-subsequence",
            d: "M",
            s: ["S8"],
          },
          {
            q: "Merge Two Sorted Lists",
            lc: 21,
            slug: "merge-two-sorted-lists",
            d: "E",
            s: ["S8"],
          },
          {
            q: "Reverse a linked list",
            lc: 206,
            slug: "reverse-linked-list",
            d: "E",
            s: ["S5"],
          },
          {
            q: "Middle of the linked list",
            lc: 876,
            slug: "middle-of-the-linked-list",
            d: "E",
            s: ["S6"],
          },
          {
            q: "Cube root of a perfect cube without built-in functions",
            d: "E",
            s: ["S6"],
          },
          {
            q: "Overlapping duration between two arrays of hour ranges",
            lc: 986,
            slug: "interval-list-intersections",
            d: "M",
            s: ["S6"],
            approx: true,
          },
        ],
      },
      {
        type: "concepts",
        title: "Concepts",
        items: [
          {
            q: "Authentication vs authorization — how does each work?",
            s: ["S3"],
          },
          {
            q: "PATCH vs PUT",
            s: ["S3"],
          },
          {
            q: "Sharding, the celebrity (hot key) problem, and scaling servers",
            s: ["S3"],
          },
          {
            q: "Partitioning vs sharding",
            s: ["S3"],
          },
          {
            q: "Indexing and query optimisation",
            s: ["S3"],
          },
          {
            q: "How would you troubleshoot a 504 Gateway Timeout?",
            s: ["S3"],
          },
          {
            q: "Spring, Java, Kafka, servlets and web servers",
            s: ["S2"],
          },
        ],
      },
      {
        type: "behavioral",
        title: "Behavioral",
        items: [
          {
            q: "Walk us through your code review / PR review process",
            s: ["S3"],
          },
        ],
      },
    ],
  },
  {
    n: 3,
    id: "r3",
    name: "Bar Raiser",
    meta: "60–90 min · often a Staff engineer · usually coding + design + a deep dive, with rapid-fire concept questions",
    tests:
      "The hardest round. It checks whether you raise the bar of the current team, with a harder problem, a design you'll be pushed on, and detailed questions about your own system.",
    groups: [
      {
        type: "coding",
        title: "Coding",
        items: [
          {
            q: "Word Ladder",
            lc: 127,
            slug: "word-ladder",
            d: "H",
            s: ["L2"],
          },
          {
            q: "Best Time to Buy and Sell Stock — a variation",
            lc: 121,
            slug: "best-time-to-buy-and-sell-stock",
            d: "M",
            s: ["L1"],
          },
          {
            q: "A Trie-based problem — approach and pseudocode only",
            lc: 208,
            slug: "implement-trie-prefix-tree",
            d: "M",
            s: ["L4"],
            approx: true,
          },
          {
            q: "Given a matrix, decide whether rotating it n times gives the same matrix",
            lc: 1886,
            slug: "determine-whether-matrix-can-be-obtained-by-rotation",
            d: "E",
            s: ["S1"],
            approx: true,
          },
          {
            q: "Container With Most Water",
            lc: 11,
            slug: "container-with-most-water",
            d: "M",
            s: ["S8"],
          },
        ],
      },
      {
        type: "hld",
        title: "Design & deep dive",
        items: [
          {
            q: "Design Ola / Uber",
            s: ["L2"],
          },
          {
            q: "Present your current project's high-level design, then say what you would improve",
            s: ["L1", "S4"],
          },
          {
            q: "Design the database for a given scenario, discuss the trade-offs, then write the queries",
            s: ["L1"],
          },
          {
            q: "Web crawler — from a start URL, collect every URL up to depth N (max ~100K)",
            s: ["S2", "S3", "S10"],
            n: "A Staff engineer asked this in two reports. Be ready to discuss concurrency, dedup, politeness and storage.",
          },
          {
            q: "Database design for a Quora / Medium-like feed and notifications",
            s: ["S4"],
          },
        ],
      },
      {
        type: "lld",
        title: "Low-level design",
        items: [
          {
            q: "Design a file management system — LLD, including multithreading concerns",
            s: ["L4"],
          },
        ],
      },
      {
        type: "concepts",
        title: "Concepts & puzzle",
        items: [
          {
            q: "Explain the CAP theorem",
            s: ["L4"],
          },
          {
            q: "When would you choose SQL vs MongoDB vs Cassandra?",
            s: ["L4"],
          },
          {
            q: "Multithreading — production deadlocks, Java locking mechanisms",
            s: ["L1", "S4"],
          },
          {
            q: "Spring Boot questions",
            s: ["L1"],
          },
          {
            q: "Redis and caching; monitoring with Grafana",
            s: ["S4"],
          },
          {
            q: "Write an SQL inner join query",
            s: ["S4"],
            n: "S4 said weak SQL and DB design in this round led to the rejection.",
          },
          {
            q: "Managing DB latency (connection pooling); stickiness and high availability (consistent hashing)",
            s: ["S2"],
          },
          {
            q: "Encryption vs encoding",
            s: ["S1"],
          },
          {
            q: "Design patterns — Factory, Flyweight, Singleton",
            s: ["S1"],
          },
          {
            q: "Indexing, SQL vs NoSQL, database security; microservices and distributed systems",
            s: ["S1"],
          },
          {
            q: "Puzzle: a car has 4 tyres plus a spare, and each tyre lasts at most 20 km. What is the longest distance you can drive?",
            s: ["L4"],
            n: "Hint: 5 tyres × 20 km = 100 tyre-km. The car uses 4 at a time, so rotating the spare gets you 25 km.",
          },
        ],
      },
    ],
  },
  {
    n: 4,
    id: "r4",
    name: "Hiring Manager / Director",
    meta: "~60 min · virtual · at Lead level this round is still technical",
    tests:
      "Tests leadership, how you own your current system, and your reasons for joining. One Lead candidate cleared all three technical rounds and was rejected here.",
    groups: [
      {
        type: "hld",
        title: "Design",
        items: [
          {
            q: "Sketch your current company's system design, then integrate a distributed logging system into it",
            s: ["L4"],
            n: "Done on a Google whiteboard. Verdict: Strong Hire.",
          },
          {
            q: "Present the high-level design of the project you're working on now",
            s: ["L2"],
          },
          {
            q: "HLD of a parking system",
            s: ["L2"],
          },
          {
            q: "Director round: design one feature of a stock app that uses moving-average pricing, then optimise its DB design",
            s: ["S1"],
          },
        ],
      },
      {
        type: "coding",
        title: "Coding",
        items: [
          {
            q: "One easy problem in an online compiler",
            d: "E",
            s: ["L2"],
          },
        ],
      },
      {
        type: "behavioral",
        title: "Leadership & motivation",
        items: [
          {
            q: "Technical leadership discussion with a Director",
            s: ["L6"],
            n: "The candidate was rejected here, so bring specific stories about mentoring, driving decisions and handling conflict.",
          },
          {
            q: "What do you expect from Freshworks, and why are you looking for a change?",
            s: ["L2", "S3"],
          },
          {
            q: "Tell me about the most interesting or challenging work you've done. How would you improve its architecture?",
            s: ["S5", "S6"],
          },
          {
            q: "Walk us through your release process",
            s: ["S3"],
          },
          {
            q: "A casual conversation that is light on technical detail",
            s: ["L1"],
          },
        ],
      },
    ],
  },
  {
    n: 5,
    id: "r5",
    name: "Culture Fit / HR",
    meta: "~30 min · virtual",
    tests:
      "Checks that your values fit and that you understand the role. Don't treat it as a formality: one Lead candidate saw many people rejected at this stage.",
    groups: [
      {
        type: "behavioral",
        title: "Behavioral",
        items: [
          {
            q: "How do your values align with the company's? What do you expect from this role?",
            s: ["L4"],
          },
          {
            q: "Culture-fit conversation",
            s: ["L1", "L7"],
            n: "L1 wrote that many people got rejected in this round.",
          },
          {
            q: "Why Freshworks? Which location do you prefer?",
            s: ["S5"],
          },
          {
            q: "If Freshworks had a 6-day work week, would you still join?",
            s: ["L7"],
          },
        ],
      },
    ],
  },
];
