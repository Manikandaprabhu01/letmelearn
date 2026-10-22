import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ExternalLink, Sparkles, Award } from "lucide-react";
import { DifficultyChip, LeetCodeChip } from "@/components/interview/Chips";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { FreshworksHeader } from "@/components/interview/FreshworksHeader";
import { LibraryAnswer } from "@/components/interview/AnswerBody";
import { Md } from "@/components/interview/Md";
import { CodeBlock, CodePair } from "@/components/interview/AnswerBody";
import { FRESHWORKS_LEAD, chipClass, sourceChipClass } from "@/components/interview/console-shared";
import { FRESHWORKS_ROUNDS, FRESHWORKS_SOURCES } from "@/data/interview/freshworks-lead";
import { LIBRARY } from "@/data/interview/library";
import type { DeepGroupType } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Filter = "all" | DeepGroupType;
type RoleFilter = "all" | "lead" | "senior" | "junior";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All Questions" },
  { id: "coding", label: "Coding & DSA" },
  { id: "hld", label: "System Design (HLD)" },
  { id: "lld", label: "Low-Level Design (LLD)" },
  { id: "concepts", label: "Core Concepts & Architecture" },
  { id: "behavioral", label: "Leadership & Culture Fit" },
];

const ROLE_FILTERS: { id: RoleFilter; label: string; badge: string }[] = [
  { id: "all", label: "All Roles", badge: "26 reports" },
  { id: "lead", label: "Lead SE / IC3 (Primary Focus)", badge: "5–12 YoE" },
  { id: "senior", label: "Senior SE / SDE 2 (IC2)", badge: "3–6 YoE" },
  { id: "junior", label: "Junior SE / SDE 1 (IC1)", badge: "0–3 YoE" },
];

const REPEATED = [
  {
    count: "6×",
    title: "Design an API rate limiter",
    detail:
      "Came up in round 1, round 2 or the bar raiser. One panel changed the scope mid-interview.",
  },
  {
    count: "5×",
    title: "LRU cache / cache system",
    detail: "Asked as a coding problem in round 1, or as an LLD in round 2.",
  },
  {
    count: "all",
    title: "Deep dive on your current system",
    detail: "Draw its architecture, defend your choices, and say what you would improve.",
  },
  {
    count: "4×",
    title: "DB indexing & consistent hashing",
    detail: "Asked as quick concept checks inside coding and design rounds.",
  },
  {
    count: "3×",
    title: "Web crawler to depth N",
    detail:
      "Given a start URL and a depth, return up to ~100K URLs. Usually asked by a Staff engineer.",
  },
  {
    count: "2×",
    title: "Logging system design",
    detail: "Came up in Lead loops: a log management system, and distributed logging.",
  },
];

const QUESTION_TO_LIBRARY_ID: Record<string, string> = {
  // Round 1 Coding
  "LRU Cache — get / put in O(1)": "lru",
  "Max Chunks To Make Sorted": "maxchunks",
  "Number of Islands — a modified variant": "islands",
  "Place odd numbers at odd indices and even numbers at even indices": "parity2",
  "A two-pointer problem — explain the approach before writing code on paper": "twoptr",
  "Medium-level stack and tree problems": "stacktree",
  "One easy warm-up problem after the project discussion": "revint",
  "Reverse an integer (123 → 321)": "revint",
  "Reverse the digits of a float (2453.67 → 3542.76)": "revfloat",
  "Find the next palindrome number after a given number (11 → 22)": "nextpal",
  "Kth largest element in an unbounded stream — then write the SQL for it": "kthstream",
  "Implement a snapshottable map that scales": "snapmap",
  "Nearest smaller element to the left — brute force, then O(n) with a stack": "nsl",
  "Reverse the first K elements of an array in place": "revk",
  "Meeting Rooms — can one person attend every meeting?": "meetingrooms",
  "Maximum Subarray": "maxsub",
  "Binary tree: max depth, left view, top view": "treeviews",
  "Find Peak Element": "peak",
  "Search in Rotated Sorted Array": "rotated",
  "Word Search": "wordsearch",
  "3Sum — without a hash map": "threesum",
  "Diameter of Binary Tree": "diameter",
  "Majority Element": "majority",
  "Boundary of Binary Tree": "boundary",
  "Longest Substring Without Repeating Characters": "lswr",
  "Two Medium binary-search problems that need backtracking": "binsearchback",
  "Sort an array of 0s and 1s": "sort01",
  "Intersection of Two Linked Lists": "intersect",

  // Round 1 Concepts
  "What is database indexing?": "c-indexing",
  "What is consistent hashing?": "c-consistenthash",
  "How would you speed up a slow API?": "c-apispeed",
  "Java: memory leaks and garbage collection": "c-gc",
  "Frontend track — JavaScript: closures, hoisting, this, event delegation and propagation, promises, the event loop": "c-js",
  "Walk me through your experience and your current projects": "b-why",

  // Round 2 HLD
  "Design an API rate limiter": "hld-ratelimiter",
  "Design a social media platform like Facebook": "hld-social",
  "Design an authentication system": "hld-auth",
  "Design a document upload system": "hld-upload",
  "Design a log management system": "hld-logging",
  "Design a food delivery system like Swiggy / Zomato": "hld-fooddelivery",
  "Design a WhatsApp-like chat system": "hld-whatsapp",
  "Design Instagram — APIs, database design, caching": "hld-instagram",
  "Design the YouTube comment section": "hld-youtube-comments",

  // Round 2 LLD
  "Design an employee roster / on-call management system, like PagerDuty": "lld-roster",
  "Design a cache system": "lld-cache",
  "Design a parking lot": "lld-parking",
  "Design a feature flag system": "lld-featureflag",
  "LLD for an e-commerce system like Flipkart": "lld-ecommerce",
  "Form builder — APIs to create forms, process submissions dynamically, filter fields for admins, plus the DB schemas": "lld-formbuilder",

  // Round 2 Coding
  "First Bad Version": "firstbad",
  "Minimum Number of Days to Disconnect Island": "disconnect",
  "Longest Increasing Subsequence": "lis",
  "Merge Two Sorted Lists": "mergelists",
  "Reverse a linked list": "revlist",
  "Middle of the linked list": "middle",
  "Cube root of a perfect cube without built-in functions": "cuberoot",
  "Overlapping duration between two arrays of hour ranges": "intervals",

  // Round 2 Concepts
  "Authentication vs authorization — how does each work?": "c-authnz",
  "PATCH vs PUT": "c-patchput",
  "Sharding, the celebrity (hot key) problem, and scaling servers": "c-partition-shard",
  "Partitioning vs sharding": "c-partition-shard",
  "Indexing and query optimisation": "c-indexing",
  "How would you troubleshoot a 504 Gateway Timeout?": "c-504",
  "Spring, Java, Kafka, servlets and web servers": "c-spring",
  "Walk us through your code review / PR review process": "b-pr",

  // Round 3 Bar Raiser
  "Word Ladder": "wordladder",
  "Best Time to Buy and Sell Stock — a variation": "stock",
  "A Trie-based problem — approach and pseudocode only": "trie",
  "Given a matrix, decide whether rotating it n times gives the same matrix": "rotmatrix",
  "Container With Most Water": "container",
  "Design Ola / Uber": "hld-uber",
  "Present your current project's high-level design, then say what you would improve": "hld-ownsystem",
  "Design the database for a given scenario, discuss the trade-offs, then write the queries": "c-indexing",
  "Web crawler — from a start URL, collect every URL up to depth N (max ~100K)": "hld-crawler",
  "Database design for a Quora / Medium-like feed and notifications": "hld-feed-notif",
  "Design a file management system — LLD, including multithreading concerns": "lld-filemanager",
  "Explain the CAP theorem": "c-cap",
  "When would you choose SQL vs MongoDB vs Cassandra?": "c-sqlnosql",
  "Multithreading — production deadlocks, Java locking mechanisms": "c-locks",
  "Spring Boot questions": "c-spring",
  "Redis and caching; monitoring with Grafana": "c-redis",
  "Write an SQL inner join query": "c-join",
  "Managing DB latency (connection pooling); stickiness and high availability (consistent hashing)": "c-latency-pool",
  "Encryption vs encoding": "c-encrypt-encode",
  "Design patterns — Factory, Flyweight, Singleton": "c-patterns",
  "Indexing, SQL vs NoSQL, database security; microservices and distributed systems": "c-microservices",
  "Puzzle: a car has 4 tyres plus a spare, and each tyre lasts at most 20 km. What is the longest distance you can drive?": "c-tyre",

  // Round 4 Hiring Manager / Director
  "Sketch your current company's system design, then integrate a distributed logging system into it": "hld-logging",
  "Present the high-level design of the project you're working on now": "hld-ownsystem",
  "HLD of a parking system": "hld-parking",
  "Director round: design one feature of a stock app that uses moving-average pricing, then optimise its DB design": "hld-stock",
  "One easy problem in an online compiler": "firstbad",
  "Technical leadership discussion with a Director": "b-leadership",
  "What do you expect from Freshworks, and why are you looking for a change?": "b-why",
  "Tell me about the most interesting or challenging work you've done. How would you improve its architecture?": "b-challenging",
  "Walk us through your release process": "b-release",
  "A casual conversation that is light on technical detail": "b-hm",

  // Round 5 Culture Fit / HR
  "How do your values align with the company's? What do you expect from this role?": "b-values",
  "Culture-fit conversation": "b-values",
  "Why Freshworks? Which location do you prefer?": "b-why",
  "If Freshworks had a 6-day work week, would you still join?": "b-values",
};

const SOURCE_LABEL = new Map(FRESHWORKS_SOURCES.map((s) => [s.id, s.label]));

/** Practice ticks come from a per-browser store the server cannot see. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function FreshworksBank() {
  const [filter, setFilter] = useState<Filter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const query = useInterviewPrefs((s) => s.query)
    .trim()
    .toLowerCase();
  const done = useProgress((s) => s.done);
  const toggle = useProgress((s) => s.toggle);
  const hydrated = useHydrated();

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const allKeys = shown.map((x) => x.key);
    setExpandedKeys(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  const rounds = useMemo(
    () =>
      FRESHWORKS_ROUNDS.map((r) => ({
        ...r,
        groups: r.groups
          .filter((g) => filter === "all" || g.type === filter)
          .map((g) => ({
            ...g,
            items: g.items
              .map((it, i) => ({ it, key: `fw:${r.n}-${g.type}-${i}` }))
              .filter(({ it }) => {
                if (roleFilter === "lead") {
                  if (!it.s.some((s) => s.startsWith("L"))) return false;
                } else if (roleFilter === "senior") {
                  if (!it.s.some((s) => s.startsWith("S"))) return false;
                } else if (roleFilter === "junior") {
                  if (it.d === "H" || it.q.includes("Director") || it.q.includes("Bar Raiser"))
                    return false;
                }
                return !query || `${it.q} ${it.n ?? ""}`.toLowerCase().includes(query);
              }),
          }))
          .filter((g) => g.items.length > 0),
      })),
    [filter, roleFilter, query],
  );

  const shown = rounds.flatMap((r) => r.groups.flatMap((g) => g.items));
  const practiced = hydrated ? shown.filter((x) => done[x.key]).length : 0;
  const pct = shown.length ? (100 * practiced) / shown.length : 0;

  return (
    <ConsoleLayout
      current={{ id: FRESHWORKS_LEAD, view: "bank" }}
      showLevels={false}
      showLang={false}
    >
      <FreshworksHeader view="bank" />

      {/* Lead Software Engineer Master Focus Banner */}
      <section className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-bg">
              <Award className="size-4" />
            </span>
            <h2 className="font-display text-lg font-semibold tracking-tight text-fg">
              Freshworks Lead Software Engineer (IC3) Loop & Bar Raiser Guide
            </h2>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            5–12 YoE · 5-Round Gate
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Freshworks evaluates Lead candidates with an intense, multi-tenant SaaS bar. The loop is scored{" "}
          <strong className="text-fg">Strong Hire / Hire / Neutral</strong> per round:
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="font-mono text-accent">Round 1</span>
            <p className="mt-1 font-medium text-fg">DSA & Systems Screen</p>
            <p className="mt-1 text-muted">Medium/Hard algorithms on paper + rapid systems diagnostics (B-Trees, Consistent Hashing).</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="font-mono text-accent">Round 2</span>
            <p className="mt-1 font-medium text-fg">Machine Coding (LLD)</p>
            <p className="mt-1 text-muted">90 min working code: On-Call Roster (PagerDuty), Rate Limiter, or Dynamic Form Builder.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="font-mono text-accent">Round 3</span>
            <p className="mt-1 font-medium text-fg">Multi-Tenant HLD</p>
            <p className="mt-1 text-muted">Freshdesk SaaS architecture, noisy-neighbor isolation, Omnichannel messaging, Web crawler.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="font-mono text-accent">Round 4</span>
            <p className="mt-1 font-medium text-fg">Staff Bar Raiser</p>
            <p className="mt-1 text-muted">Staff SE deep dive: Outage post-mortems, HikariCP connection starvation, 5-tyre puzzle.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="font-mono text-accent">Round 5</span>
            <p className="mt-1 font-medium text-fg">Director & Culture</p>
            <p className="mt-1 text-muted">Technical leadership, 20% tech debt rule, and CHATS values (genuine rejection stage).</p>
          </div>
        </div>
      </section>

      {/* Navigation Quick Jump */}
      <nav
        aria-label="Interview loop"
        className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-5"
      >
        {FRESHWORKS_ROUNDS.map((r) => (
          <a
            key={r.id}
            href={`#${r.id}`}
            className="flex flex-col gap-1 bg-surface px-4 py-3 transition-colors duration-150 hover:bg-raised"
          >
            <span className="font-mono text-[11px] text-accent">Round {r.n}</span>
            <span className="text-[13.5px] font-medium leading-5 text-fg">{r.name}</span>
            <span className="text-xs text-faint">{r.meta.split(" · ")[0]}</span>
          </a>
        ))}
      </nav>

      <section className="mt-10">
        <h2 className="font-display text-xl tracking-tight">Asked again and again</h2>
        <p className="mt-1 text-sm text-muted">
          These topics came up in the most reports. Prepare them first.
        </p>
        <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
          {REPEATED.map((r) => (
            <li
              key={r.title}
              className="grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-3 border-t border-border py-3"
            >
              <span className="font-mono text-lg tabular-nums text-accent">{r.count}</span>
              <span>
                <span className="font-medium text-fg">{r.title}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-muted">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Role Filter Tabs */}
      <div className="mt-8 border-t border-border/80 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
              Filter by Target Role:
            </span>
            {ROLE_FILTERS.map((rf) => (
              <button
                key={rf.id}
                type="button"
                onClick={() => setRoleFilter(rf.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  roleFilter === rf.id
                    ? "border-accent/60 bg-accent/20 text-accent shadow-sm"
                    : "border-border/70 bg-surface/70 text-muted hover:text-fg hover:border-accent/40 hover:bg-raised/50",
                )}
              >
                <span>{rf.label}</span>
                <span className={cn("text-[10.5px] opacity-80 font-mono")}>{rf.badge}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-lg border border-border/70 bg-surface/70 px-2.5 py-1 text-xs text-muted hover:text-fg hover:border-accent/40 transition-colors"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-lg border border-border/70 bg-surface/70 px-2.5 py-1 text-xs text-muted hover:text-fg hover:border-accent/40 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter and Progress Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-border/80 py-3">
        <div role="group" aria-label="Question type" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-8 rounded-full border px-3 text-[12.5px] font-medium transition-all duration-150",
                filter === f.id
                  ? "border-accent/60 bg-accent/20 text-accent shadow-sm"
                  : "border-border/70 text-muted hover:text-fg hover:bg-raised/40",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
          <span className="flex items-center gap-2 font-mono text-[12.5px] tabular-nums text-fg">
            {practiced} / {shown.length} practised
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-raised" aria-hidden>
              <span
                className="block h-full rounded-full bg-cta transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </span>
          </span>
        </div>
      </div>

      {rounds.map((r) => (
        <section key={r.id} id={r.id} className="mt-12 scroll-mt-32">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-b-2 border-fg pb-4">
            <span className="row-span-3 font-display text-5xl leading-none text-accent">{r.n}</span>
            <h2 className="font-display text-xl tracking-tight">{r.name}</h2>
            <p className="font-mono text-[12px] leading-5 text-faint">{r.meta}</p>
            <p className="mt-1 max-w-prose text-[14px] leading-6 text-muted">{r.tests}</p>
          </div>
          {r.groups.length === 0 ? (
            <p className="py-4 text-sm text-faint">No questions match this filter in this round.</p>
          ) : (
            r.groups.map((g) => (
              <div key={g.type} className="mt-6">
                <h3 className="eyebrow">
                  {g.title} <span className="text-faint">{g.items.length}</span>
                </h3>
                <ul className="mt-1 space-y-2">
                  {g.items.map(({ it, key }) => {
                    const isDone = hydrated && Boolean(done[key]);
                    const isExpanded = expandedKeys.has(key);
                    const libId = it.ans ?? QUESTION_TO_LIBRARY_ID[it.q];
                    const libEntry = libId ? LIBRARY.get(libId) : undefined;
                    const hasAnswer = Boolean(libEntry || it.a);

                    return (
                      <li
                        key={key}
                        className={cn(
                          "rounded-lg border transition-colors",
                          isExpanded
                            ? "border-accent/40 bg-surface/90 shadow-sm"
                            : "border-border/60 hover:border-border hover:bg-surface/40"
                        )}
                      >
                        <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 p-3 sm:grid-cols-[1.25rem_minmax(0,1fr)_auto]">
                          <input
                            id={key}
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggle(key)}
                            aria-label="Mark as practised"
                            className="mt-1 size-4 cursor-pointer accent-accent"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleExpand(key)}
                              className="text-left group flex items-start gap-1.5"
                            >
                              <span
                                className={cn(
                                  "text-[14.5px] font-medium leading-6 transition-colors group-hover:text-accent",
                                  isDone ? "text-faint line-through" : "text-fg",
                                )}
                              >
                                {it.q}
                              </span>
                              {hasAnswer ? (
                                <span className="mt-1 inline-flex shrink-0 text-faint group-hover:text-accent">
                                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                </span>
                              ) : null}
                            </button>
                            {it.n ? (
                              <p className="mt-1 text-[13px] leading-5 text-muted">
                                {it.n}
                              </p>
                            ) : null}
                          </div>
                          <div className="col-start-2 flex flex-wrap items-center gap-1 sm:col-start-3 sm:max-w-[20rem] sm:justify-end">
                            {it.s.length > 1 ? (
                              <span
                                className={cn(chipClass, "bg-fg text-bg")}
                                title={`Seen in ${it.s.length} reports`}
                              >
                                ×{it.s.length}
                              </span>
                            ) : null}
                            <DifficultyChip d={it.d} />
                            <LeetCodeChip lc={it.lc} slug={it.slug} approx={it.approx} />
                            {it.s.map((s) => (
                              <a
                                key={s}
                                href={`#src-${s}`}
                                title={SOURCE_LABEL.get(s)}
                                className={sourceChipClass(s)}
                              >
                                {s}
                              </a>
                            ))}
                            {hasAnswer ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(key)}
                                className="ml-1 rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent hover:bg-accent/20 transition-colors"
                              >
                                {isExpanded ? "Hide Answer" : "View Answer"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Expandable Worked Answer & Code Body */}
                        {isExpanded ? (
                          <div className="border-t border-border/80 bg-inset/50 p-4 sm:p-5 rounded-b-lg">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                              <span className="font-mono text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                                <Sparkles className="size-3.5" /> Worked Solution & Strategy
                              </span>
                              <Link
                                to="/interview-prep/freshworks-lead/answers"
                                className="text-xs text-accent hover:underline flex items-center gap-1"
                              >
                                Open 93-Answer Library Sheet <ExternalLink className="size-3" />
                              </Link>
                            </div>

                            {libEntry ? (
                              <div className="space-y-4 text-sm leading-relaxed text-fg">
                                <LibraryAnswer entry={libEntry} />
                              </div>
                            ) : it.a ? (
                              <div className="space-y-4 text-sm leading-relaxed text-fg">
                                <Md text={it.a} />
                                {typeof it.code === "string" ? (
                                  <CodeBlock source={it.code} label={it.codeLang ?? "Code"} />
                                ) : it.code ? (
                                  <CodePair java={it.code.java} py={it.code.py} />
                                ) : null}
                              </div>
                            ) : (
                              <div className="text-xs text-muted italic">
                                Note available: {it.n || "Prepare approach on paper and explain time/space trade-offs."}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      ))}

      {/* Sources Section */}
      <section className="mt-14 border-t-2 border-fg pt-6">
        <h2 className="font-display text-xl tracking-tight">Candidate Reports & Sources</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Highlighted tags (L1–L7) come from verified Lead and Tech Lead loops. Dashed tags (S1–S10) come
          from Senior and SDE-2 loops across Chennai, Bengaluru, and Hyderabad panels.
        </p>
        <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
          {FRESHWORKS_SOURCES.map((s) => {
            const [who, rest] = s.label.split(" — ");
            return (
              <li
                key={s.id}
                id={`src-${s.id}`}
                className="grid scroll-mt-32 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t border-border py-2.5 text-[13.5px]"
              >
                <span
                  className={cn(
                    "font-mono text-xs leading-6",
                    s.id.startsWith("L") ? "text-accent" : "text-faint",
                  )}
                >
                  {s.id}
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {who}
                  {rest ? <span className="block text-[12.5px] text-muted">{rest}</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 max-w-prose text-[13px] leading-6 text-muted">
          Candidates say Freshworks often changes LeetCode problems slightly, so practise the
          pattern rather than the exact problem. Where a candidate described a problem without
          naming it, the LeetCode number is the closest match and is marked ≈. Your ticks are saved
          in this browser.
        </p>
      </section>
    </ConsoleLayout>
  );
}
