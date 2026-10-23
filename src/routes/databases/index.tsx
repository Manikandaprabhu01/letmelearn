import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  HelpCircle,
  Layers,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  DB_COMPANY_TRACKS,
  DB_COURSE_MODULES,
  DB_TOPIC_QA_LIBRARY,
  type DbCompanyTrack,
  type DbCourseModule,
  type DbTopicQA,
} from "@/data/databases/database-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/databases/")({ component: DatabasesHub });

type TabType = "curriculum" | "blueprint" | "qa" | "companies";

export function DatabasesHub() {
  const [activeTab, setActiveTab] = useState<TabType>("curriculum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    "db-qa-btree-vs-lsm": true,
    "google-spanner-truetime": true,
  });

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (ids: string[]) => {
    const updated: Record<string, boolean> = { ...openCards };
    for (const id of ids) updated[id] = true;
    setOpenCards(updated);
  };

  const collapseAll = (ids: string[]) => {
    const updated: Record<string, boolean> = { ...openCards };
    for (const id of ids) updated[id] = false;
    setOpenCards(updated);
  };

  // Filtered QA
  const filteredQA = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DB_TOPIC_QA_LIBRARY.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.fullAnswer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.moduleTitle.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Filtered Companies & Questions
  const filteredCompanyTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DB_COMPANY_TRACKS.map((track) => {
      const matchesCompany = selectedCompany === "all" || track.companySlug === selectedCompany;
      if (!matchesCompany) return null;

      const filteredQuestions = track.questions.filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.scenario.toLowerCase().includes(q) ||
          item.solutionBlueprint.toLowerCase().includes(q) ||
          item.whatInterviewerIsTesting.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      });

      if (!matchesCompany && filteredQuestions.length === 0) return null;
      if (q && filteredQuestions.length === 0) return null;

      return {
        ...track,
        questions: filteredQuestions,
      };
    }).filter(Boolean) as DbCompanyTrack[];
  }, [searchQuery, selectedCompany]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-12 bg-bg text-fg">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-10 backdrop-blur-xl">
        <div className="mesh-glow-subtle pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow text-amber-400 flex items-center gap-1.5">
              <Database className="size-3.5" />
              RDBMS · Storage Engines · NoSQL Archetypes · Distributed Consensus · NewSQL
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 font-mono text-[11px] font-medium text-amber-400">
              Complete Database Masterclass
            </span>
            <span className="rounded-full border border-border bg-inset px-2.5 py-0.5 font-mono text-[11px] text-muted">
              Deep Systems Engineering
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-fg">
            SQL &amp; NoSQL Concepts: In-Depth Architecture &amp; Interviews
          </h1>

          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted">
            The definitive technical guide to database storage engines, B+ Tree vs LSM-Tree mechanics,
            PostgreSQL MVCC and WAL crash recovery, DynamoDB single-table design, distributed quorum
            consensus, and real database architecture loops from{" "}
            <span className="font-medium text-fg">Google, Amazon, Meta, and Stripe</span>.
          </p>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-fg">4 Steps</div>
              <div className="text-xs text-muted">Core Modules</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-amber-400">40+ Topics</div>
              <div className="text-xs text-muted">Internals &amp; Mechanisms</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-blue-400">Deep Q&amp;As</div>
              <div className="text-xs text-muted">Technical Answers &amp; Code</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-emerald-400">Top Labs</div>
              <div className="text-xs text-muted">Company Interview Loops</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("curriculum")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "curriculum"
                ? "bg-accent text-accent-fg font-semibold shadow-md ring-1 ring-accent/50"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <Layers className="size-4" />
            Curriculum &amp; Modules
          </button>

          <button
            onClick={() => setActiveTab("blueprint")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "blueprint"
                ? "bg-accent text-accent-fg font-semibold shadow-md ring-1 ring-accent/50"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <Workflow className="size-4" />
            Storage Engine Blueprint (B+ vs LSM)
          </button>

          <button
            onClick={() => setActiveTab("qa")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "qa"
                ? "bg-accent text-accent-fg font-semibold shadow-md ring-1 ring-accent/50"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <HelpCircle className="size-4" />
            Topic Q&amp;A Library
          </button>

          <button
            onClick={() => setActiveTab("companies")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "companies"
                ? "bg-accent text-accent-fg font-semibold shadow-md ring-1 ring-accent/50"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <Building2 className="size-4" />
            Company Interview Rounds
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">
              HOT
            </span>
          </button>
        </div>

        {/* Quick HLD link */}
        <Link
          to="/hld"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <Network className="size-3.5" />
          Related: HLD &amp; Microservices
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Global Search and Filter Bar for QA & Companies */}
      {(activeTab === "qa" || activeTab === "companies") && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              placeholder={
                activeTab === "qa"
                  ? "Search topics, concepts (e.g. B+ Tree, MVCC, WAL, DynamoDB, Quorum, Write Skew)..."
                  : "Search company interview questions (e.g. Spanner TrueTime, Aurora, Stripe Ledger)..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/90 py-2.5 pl-10 pr-4 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-fg"
              >
                Clear
              </button>
            )}
          </div>

          {activeTab === "companies" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {[
                { label: "All Companies", slug: "all" },
                { label: "Google", slug: "google" },
                { label: "Amazon / AWS", slug: "amazon" },
                { label: "Stripe", slug: "stripe" },
              ].map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCompany(c.slug)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selectedCompany === c.slug
                      ? "bg-accent text-accent-fg font-semibold shadow-sm ring-1 ring-accent/40"
                      : "border border-border/70 bg-surface text-muted hover:text-fg"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "qa" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {[
                { label: "All Categories", slug: "all" },
                { label: "Storage Engines", slug: "Storage" },
                { label: "Concurrency & Locking", slug: "Concurrency" },
                { label: "NoSQL Architecture", slug: "NoSQL" },
                { label: "Distributed Systems", slug: "Distributed" },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selectedCategory === cat.slug
                      ? "bg-accent text-accent-fg font-semibold shadow-sm ring-1 ring-accent/40"
                      : "border border-border/70 bg-surface text-muted hover:text-fg"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: CURRICULUM (4 MODULES) */}
      {activeTab === "curriculum" && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {DB_COURSE_MODULES.map((mod) => (
              <div
                key={mod.slug}
                className="group relative flex flex-col rounded-2xl border border-border/80 bg-surface/50 p-6 sm:p-7 backdrop-blur-md transition-all hover:border-accent/50 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 font-mono text-xs font-semibold text-amber-400 border border-amber-500/20">
                      #{mod.step}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-muted">
                      {mod.estimatedHours} hrs · {mod.level}
                    </span>
                  </div>

                  <span className="rounded-md border border-border bg-inset px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    Production Core
                  </span>
                </div>

                <h3 className="mt-3 font-display text-xl font-medium tracking-tight text-fg group-hover:text-accent transition-colors">
                  {mod.title}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">{mod.subtitle}</p>

                {/* Why it matters block */}
                <div className="mt-4 rounded-xl border border-border/60 bg-inset/50 p-3.5 text-xs leading-relaxed text-fg/80">
                  <strong className="text-amber-400 block mb-1">Why it matters in production:</strong>
                  {mod.whyItMatters}
                </div>

                {/* Topics List */}
                <div className="mt-5 space-y-3 flex-1">
                  <h4 className="eyebrow text-muted">Core Topics &amp; Internal Mechanisms</h4>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {mod.topics.map((t) => (
                      <div
                        key={t.title}
                        className="rounded-lg border border-border/60 bg-surface/90 p-3 text-xs"
                      >
                        <div className="font-semibold text-fg flex items-start gap-1.5">
                          <CheckCircle2 className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{t.title}</span>
                        </div>
                        <p className="mt-1 text-muted line-clamp-2 leading-relaxed">{t.desc}</p>
                        <div className="mt-2 text-[11px] text-red-400/90 font-mono">
                          <span className="font-semibold text-red-400">Gotcha:</span> {t.productionGotcha}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverable */}
                <div className="mt-5 border-t border-border/60 pt-3 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    <strong className="text-fg">Deliverable:</strong> {mod.productionDeliverable}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STORAGE ENGINE BLUEPRINT (B+ TREE VS LSM-TREE) */}
      {activeTab === "blueprint" && (
        <div className="mt-8 space-y-8 max-w-5xl mx-auto">
          {/* Deep Architectural Comparison */}
          <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
              Storage Engine Blueprint: B+ Tree vs LSM-Tree Deep Dive
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              At the heart of every database is its storage engine—the low-level data structures that
              read and write bytes to physical media. Relational databases (PostgreSQL, MySQL InnoDB)
              rely on <strong className="text-fg">B+ Trees</strong>, while high-throughput distributed
              stores (Cassandra, RocksDB, ScyllaDB, Bigtable) rely on{" "}
              <strong className="text-fg">Log-Structured Merge-Trees (LSM-Trees)</strong>.
            </p>

            {/* Comparison Table */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-inset text-fg border-b border-border font-medium">
                  <tr>
                    <th className="p-3.5">Architectural Dimension</th>
                    <th className="p-3.5 text-amber-400">B+ Tree (PostgreSQL / InnoDB)</th>
                    <th className="p-3.5 text-emerald-400">LSM-Tree (RocksDB / Cassandra)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted">
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Primary Write Mechanism</td>
                    <td className="p-3.5">In-place page rewrite (8KB/16KB random I/O)</td>
                    <td className="p-3.5 text-fg font-medium">Sequential append to MemTable + WAL</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Write Amplification</td>
                    <td className="p-3.5">Very High (Writing 20B updates whole 8KB page)</td>
                    <td className="p-3.5 text-fg font-medium">Low to Moderate (compaction cost)</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Point Read Latency</td>
                    <td className="p-3.5 text-fg font-medium">Ultra-low &amp; deterministic O(log_B N)</td>
                    <td className="p-3.5">Variable (MemTable + multiple SSTables)</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Range Scan Performance</td>
                    <td className="p-3.5 text-fg font-medium">Blindingly fast via leaf linked-list</td>
                    <td className="p-3.5">Requires multi-way merge sort across SSTables</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Deletes &amp; Updates</td>
                    <td className="p-3.5">In-place modification with MVCC headers</td>
                    <td className="p-3.5 text-fg font-medium">Appends a Tombstone marker; cleaned during compaction</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Hardware Alignment</td>
                    <td className="p-3.5">Fast NVMe SSDs with buffer pool caching</td>
                    <td className="p-3.5 text-fg font-medium">Write-heavy NVMe, HDDs, and append-only media</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-Time Visual Architecture Execution Flows */}
          <div className="space-y-6">
            {/* Real-Time Flow 1: B+ Tree & WAL Lifecycle */}
            <div className="rounded-2xl border border-border/80 bg-surface/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <h3 className="font-display text-lg font-medium text-amber-400">
                  Real-Time B+ Tree Write/Commit Flow: Slotted Pages, Buffer Pool &amp; WAL (PostgreSQL / InnoDB)
                </h3>
                <span className="font-mono text-[11px] text-muted rounded-md bg-inset px-2 py-0.5 border border-border/60">
                  Write Path Latency: ~0.8ms (fsync on WAL)
                </span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-inset p-4 font-mono text-xs text-fg leading-relaxed">
{`+---------------------------------------------------------------------------------------------------+
| REAL-TIME EXECUTION FLOW: IN-PLACE B+ TREE MUTATION & ARIES COMMIT PROTOCOL                        |
+---------------------------------------------------------------------------------------------------+

 [1. Inbound SQL Write: UPDATE accounts SET balance = balance - 100 WHERE id = 42;]
        │
        ▼ (Postgres Backend Process / Query Executor)
 [2. Index Root Traversal & Buffer Pool Frame Pinning]
   ├── Step 2a: Traverse B+ Tree Root (Page 0) ──► Internal Node (Page 14) ──► Leaf Node (Page 108)
   │
   ├── Step 2b: Buffer Pool Hash Table Lookup (Page 108):
   │            ├── [Cache Hit]: Page found in shared_buffers RAM (0.05µs latency)
   │            │   ──► Acquire Exclusive Buffer Pin & Latch (Lock Page 108 in memory)
   │            └── [Cache Miss]: Allocate free frame from Clock-Sweep algorithm
   │                ──► Trigger NVMe Direct I/O read: 8KB block loaded into RAM (45µs latency)
   │
   └── Step 2c: In-Memory Slotted Page Mutation (MVCC Non-Destructive Update):
        │
        │ [Page 108 Anatomy: 8KB In-Memory Block]
        │ ┌──────────────────────────────────────────────────────────────────────────────┐
        │ │ Page Header (LSN: 0/1A92015, Checksum, lower=32, upper=7840, free_space=7808)│
        │ ├──────────────┬──────────────┬──────────────┬────────────────────────────────┤
        │ │ LinePtr 1: 0 │ LinePtr 2: 48│ LinePtr 3: 96│ LinePtr 4: (points to new tuple)│ (Grows down)
        │ ├──────────────┴──────────────┴──────────────┴────────────────────────────────┤
        │ │                                FREE SPACE                                   │
        │ ├─────────────────────────────────────────────────────────────────────────────┤
        │ │ [New Tuple #4]: xmin=CurrentXID, xmax=0, id=42, balance=900 (Grows UP)      │
        │ │ [Old Tuple #3]: xmin=OldXID, xmax=CurrentXID (Marked dead for VACUUM)       │
        │ └─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
 [3. WAL Record Generation (ARIES Redo/Undo Logging Protocol)]
   ├── Step 3a: Write Redo Vector into WAL Buffer:
   │            Record: [LSN: 0/1A92015, Type: HEAP2_UPDATE, Page: 108, Offset: 7840, Len: 64]
   │
   ├── Step 3b: Update Page Header LSN: Set Page 108 LSN = 0/1A92015
   │            (Crucial rule: WAL record LSN MUST precede dirty page flush to disk!)
   │
   └── Step 3c: Mark Buffer Pool Frame = DIRTY (Do NOT write dirty page to table disk yet!)
        │
        ▼
 [4. Transaction Commit & Synchronous WAL Flush (The fsync Barrier)]
   ├── Client sends: COMMIT;
   ├── Engine appends COMMIT Record to WAL Buffer: [LSN: 0/1A92016, Type: COMMIT]
   ├── Trigger Synchronous Disk Flush: fsync(wal_fd) on pg_wal/00000001000000000000001A (0.8ms)
   └── Return Success to Client: COMMIT OK (Guaranteed durable against crash / power loss!)
        │
        ▼ (Asynchronous Background Thread, Completely Decoupled from Client Latency)
 [5. Checkpointer & Background Writer Flushes (Every 5 Minutes / 1GB WAL)]
   ├── Scan shared_buffers for Dirty Pages
   ├── Flush Page 108 to physical tablespace disk: /base/16384/2619
   └── Record Checkpoint LSN in global control file (Allows safe truncation of older WAL logs)`}
              </pre>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                <strong className="text-amber-400">Production Key Insight:</strong> The B+ Tree architecture achieves durability with minimal latency because only the sequential WAL is flushed synchronously on <code className="text-fg">COMMIT</code>. The 8KB data pages in the buffer pool are modified in RAM and flushed asynchronously by background checkpointer threads.
              </p>
            </div>

            {/* Real-Time Flow 2: LSM-Tree Concurrent Write & Read Flow */}
            <div className="rounded-2xl border border-border/80 bg-surface/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <h3 className="font-display text-lg font-medium text-emerald-400">
                  Real-Time LSM-Tree Concurrent Write, Read &amp; Compaction Pipeline (RocksDB / Cassandra)
                </h3>
                <span className="font-mono text-[11px] text-muted rounded-md bg-inset px-2 py-0.5 border border-border/60">
                  Write Path Latency: &lt;0.2ms (Zero Disk Seeks)
                </span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-inset p-4 font-mono text-xs text-fg leading-relaxed">
{`+---------------------------------------------------------------------------------------------------+
| REAL-TIME EXECUTION FLOW: LSM-TREE CONCURRENT WRITE PATH & MULTI-LEVEL READ PIPELINE              |
+---------------------------------------------------------------------------------------------------+

 [PHASE A: HIGH-THROUGHPUT CONCURRENT WRITE PATH (150,000 writes/sec)]
 [1. Inbound Write: PUT user:9921 {"name": "Ada Lovelace", "tier": "Enterprise"}]
        │
        ├──► Step 1a: Append to Write-Ahead Log (WAL on Disk)
        │             Sequential disk append (O_DIRECT / fdatasync): Zero random head seek (<0.15ms)
        │
        └──► Step 1b: Concurrent In-Memory SkipList Insertion (Active MemTable)
                      Lock-free concurrent skiplist pointer update (0.02ms latency)
        │
        ▼
   Return HTTP 200 OK to Client (Total latency: <0.2ms with durability guarantee!)
        │
        │ (When Active MemTable reaches 64MB buffer threshold)
        ▼
 [2. Immutable MemTable Freeze & Background Disk Flush]
   ├── Transition Active MemTable ──► Immutable MemTable (Read-only snapshot)
   ├── Allocate fresh, empty Active MemTable for new incoming writes (Zero pipeline stalling)
   └── Background Flush Worker drains Immutable MemTable to Level 0 SSTable file on NVMe:
        ├── Writes sorted Key-Value blocks (Snappy compressed, 4KB blocks)
        ├── Generates Block Index Block at tail of SSTable (Enables binary search)
        └── Computes 10-bit/key Block Bloom Filter (Eliminates 99% of negative disk reads)

 [PHASE B: REAL-TIME POINT READ PIPELINE (GET user:9921)]
 [3. Inbound Read: GET user:9921]
        │
        ├──► Check 1: Active MemTable in RAM (SkipList search)
        │             ──► If Key Found: Return immediately (50ns latency - Fastest hit!)
        │
        ├──► Check 2: Immutable MemTables in RAM (Pending flush)
        │             ──► If Key Found: Return immediately (100ns latency)
        │
        ├──► Check 3: Level 0 SSTables (Uncompacted disk files with overlapping key ranges)
        │             ├── Query RAM Bloom Filter for SSTable_001.sst: bloom.test("user:9921")
        │             │   ──► Result: FALSE (Negative) ──► SKIP reading SSTable_001 entirely!
        │             └── Query RAM Bloom Filter for SSTable_002.sst:
        │                 ──► Result: TRUE (Key might be present) ──► Read 4KB block from Block Cache
        │
        └──► Check 4: Leveled SSTables (L1, L2... Ln: Non-overlapping partitioned key ranges)
                      ├── Binary search SSTable Manifest for range [user:9000 to user:9999]
                      ├── Check Level 1 SSTable Bloom Filter & Block Index
                      └── Decompress matching block from NVMe SSD (40µs) and return record!

 [PHASE C: BACKGROUND LEVELED COMPACTION (Zero Read/Write Stalling)]
 [4. Compactor Thread Wakes Up: Level 0 Size > 256MB Threshold]
   ├── Pick overlapping L0 SSTables + target L1 SSTables
   ├── Execute k-Way Merge Sort in background worker:
   │     ├── Deduplicate duplicate key updates (Keep only newest timestamp)
   │     └── Evict Tombstoned records (Purge DELETE tombstones once older levels are cleared)
   └── Write clean, sequentially sorted Level 1 SSTable files (Frees up NVMe storage)`}
              </pre>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                <strong className="text-emerald-400">Production Key Insight:</strong> LSM-Trees trade read complexity for raw write throughput. By converting random writes into sequential disk appends (WAL + MemTable flush) and using Bloom Filters in RAM to bypass 99% of SSTable disk seeks, LSM-Trees dominate write-intensive workloads like time-series, messaging, and search inverted indexes.
              </p>
            </div>

            {/* Real-Time Flow 3: Distributed Raft Consensus & 2PC */}
            <div className="rounded-2xl border border-border/80 bg-surface/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <h3 className="font-display text-lg font-medium text-blue-400">
                  Real-Time Distributed Consensus: Raft Quorum Replication &amp; State Machine Commit (Spanner / CockroachDB)
                </h3>
                <span className="font-mono text-[11px] text-muted rounded-md bg-inset px-2 py-0.5 border border-border/60">
                  Quorum Consensus: Majority (N/2 + 1)
                </span>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-inset p-4 font-mono text-xs text-fg leading-relaxed">
{`+---------------------------------------------------------------------------------------------------+
| REAL-TIME EXECUTION FLOW: RAFT LOG REPLICATION QUORUM & TWO-PHASE COMMIT (2PC)                   |
+---------------------------------------------------------------------------------------------------+

 [1. Client Issues Distributed Transaction: Transfer $500 from Account A (Node 1) to B (Node 3)]
        │
        ▼ (Coordinator Node receives gRPC request)
 [2. Phase 1: Raft Log Replication Across Range Replicas (Majority Quorum)]
   ├── Leader (Node 1, Term 4) appends command to local Raft Log:
   │     Log Entry: [Index: 1042, Term: 4, Command: "TRANSFER $500", State: UNCOMMITTED]
   │
   ├── Leader broadcasts concurrent AppendEntries RPCs over gRPC to Followers:
   │     ├── Message to Follower 1 (Node 2): AppendEntries(Term 4, PrevIndex 1041, Entry 1042)
   │     └── Message to Follower 2 (Node 3): AppendEntries(Term 4, PrevIndex 1041, Entry 1042)
   │
   └── Follower Nodes Persist Log to Disk & Return Response:
        ├── Node 2 fsyncs entry to disk ──► Returns Success ACK to Leader (0.6ms)
        └── Node 3 slow network hiccup  ──► In-flight (Pending)
        │
        ▼
 [3. Majority Quorum Check & Commit Barrier (2 out of 3 Nodes Acknowledged)]
   ├── Leader verifies Quorum: Leader (Node 1) + Follower (Node 2) = 2 nodes ACKed (Majority met!)
   ├── Leader advances commitIndex = 1042
   ├── Leader applies Log Entry 1042 to underlying Storage Engine (Pebble/RocksDB State Machine)
   └── Return HTTP 200 OK to Client: Transaction Committed! (Zero wait for slow Node 3)
        │
        ▼ (Next Heartbeat / Async Piggyback)
 [4. Leader Notifies Followers of Commit]
   ├── Leader sends heartbeat: AppendEntries(LeaderCommit = 1042)
   └── Followers 2 & 3 apply Log Entry 1042 to their local state machines (Guarantees Linearizability)`}
              </pre>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                <strong className="text-blue-400">Production Key Insight:</strong> Raft eliminates single-point-of-failure by requiring only a strict majority quorum (<code className="text-fg">(N/2) + 1</code>) to commit writes. If 1 node in a 3-node cluster crashes or experiences network partitions, write throughput continues at full speed without stalling client requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOPIC Q&A LIBRARY */}
      {activeTab === "qa" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Showing <strong className="text-fg">{filteredQA.length}</strong> in-depth database questions &amp; solutions
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => expandAll(filteredQA.map((q) => q.id))}
                className="text-accent hover:underline"
              >
                Expand all
              </button>
              <span>·</span>
              <button
                onClick={() => collapseAll(filteredQA.map((q) => q.id))}
                className="text-muted hover:underline"
              >
                Collapse all
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQA.map((qa) => {
              const isOpen = Boolean(openCards[qa.id]);
              return (
                <div
                  key={qa.id}
                  className="rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-md overflow-hidden transition-all hover:border-border"
                >
                  <button
                    onClick={() => toggleCard(qa.id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors hover:bg-surface/80"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-400">
                          Step {qa.moduleStep}: {qa.moduleTitle}
                        </span>
                        <span className="rounded-md border border-border bg-inset px-2 py-0.5 font-mono text-[11px] text-muted">
                          {qa.category}
                        </span>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold",
                            qa.difficulty === "H"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}
                        >
                          Diff: {qa.difficulty}
                        </span>
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-medium text-fg">
                        {qa.question}
                      </h3>

                      <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                        {qa.summary}
                      </p>
                    </div>

                    <div className="shrink-0 mt-1">
                      {isOpen ? (
                        <ChevronDown className="size-5 text-accent" />
                      ) : (
                        <ChevronRight className="size-5 text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Answer Body */}
                  {isOpen && (
                    <div className="border-t border-border/70 p-5 sm:p-7 bg-surface/30 space-y-6">
                      <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-line font-sans">
                        {qa.fullAnswer}
                      </div>

                      {/* Code Block if present */}
                      {qa.code && (
                        <div className="rounded-xl border border-border bg-inset/80 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-border/80 px-4 py-2 bg-inset text-[11px] font-mono text-muted">
                            <span className="flex items-center gap-1.5">
                              <Terminal className="size-3.5 text-accent" />
                              Technical Demonstration ({qa.code.lang})
                            </span>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs font-mono text-fg leading-relaxed">
                            <code>{qa.code.snippet}</code>
                          </pre>
                        </div>
                      )}

                      {/* Follow-up Questions */}
                      {qa.followUps?.length > 0 && (
                        <div className="rounded-xl border border-border/60 bg-inset/40 p-4 space-y-3">
                          <h4 className="eyebrow text-accent">Interviewer Follow-Up Questions</h4>
                          {qa.followUps.map((fu, idx) => (
                            <div key={idx} className="rounded-lg bg-surface/80 p-3 text-xs space-y-1">
                              <p className="font-medium text-fg flex items-start gap-1.5">
                                <span className="font-mono text-accent font-semibold">Q:</span>
                                <span>{fu.q}</span>
                              </p>
                              <p className="text-muted pl-4">
                                <span className="font-mono text-emerald-400 font-semibold mr-1.5">A:</span>
                                {fu.a}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: COMPANY INTERVIEW ROUNDS */}
      {activeTab === "companies" && (
        <div className="mt-8 space-y-10">
          {filteredCompanyTracks.map((track) => (
            <div
              key={track.id}
              className="rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="mesh-glow-subtle pointer-events-none absolute inset-0 opacity-40" />

              {/* Company Header */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/80 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-5 text-accent" />
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
                      {track.company}
                    </h2>
                    <span className="rounded-full bg-accent/10 border border-accent/30 px-2.5 py-0.5 font-mono text-[11px] text-accent font-medium">
                      {track.roleTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-mono text-amber-400">
                    <strong>Primary DB Tech:</strong> {track.databaseTech}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-fg/80 leading-relaxed max-w-3xl">
                    <strong className="text-accent">Bar Raiser Tenet:</strong> {track.barRaiserTenet}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    <strong>Typical Rounds:</strong> {track.roundsSummary}
                  </p>
                </div>

                {/* Rubric Pills */}
                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  {track.evaluationRubric.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/70 bg-inset/80 p-2 text-left max-w-xs"
                    >
                      <div className="font-semibold text-[11px] text-fg">{r.category}</div>
                      <div className="text-[10px] text-muted line-clamp-1">{r.expectation}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Questions */}
              <div className="mt-6 space-y-5 relative z-10">
                <h3 className="eyebrow text-muted">
                  Featured Database System Design Loops ({track.questions.length})
                </h3>

                {track.questions.map((q) => {
                  const isOpen = Boolean(openCards[q.id]);
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-border/80 bg-surface/70 overflow-hidden transition-all hover:border-accent/40"
                    >
                      <button
                        onClick={() => toggleCard(q.id)}
                        className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors hover:bg-surface"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-accent/10 border border-accent/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                              {q.round}
                            </span>
                            <span className="rounded-md border border-border bg-inset px-2 py-0.5 font-mono text-[11px] text-muted">
                              {q.type}
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold",
                                q.difficulty === "H"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              )}
                            >
                              Diff: {q.difficulty}
                            </span>
                          </div>

                          <h4 className="font-display text-base sm:text-lg font-medium text-fg">
                            {q.title}
                          </h4>

                          <p className="text-xs text-amber-400 font-mono">
                            <strong>What they are testing:</strong> {q.whatInterviewerIsTesting}
                          </p>
                        </div>

                        <div className="shrink-0 mt-1">
                          {isOpen ? (
                            <ChevronDown className="size-5 text-accent" />
                          ) : (
                            <ChevronRight className="size-5 text-muted" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Question Body */}
                      {isOpen && (
                        <div className="border-t border-border/80 p-5 sm:p-7 bg-surface/30 space-y-6">
                          {/* Scenario */}
                          <div className="rounded-xl border border-border/70 bg-inset/60 p-4">
                            <h5 className="eyebrow text-muted">The System Scenario</h5>
                            <p className="mt-1 text-xs sm:text-sm text-fg leading-relaxed">
                              {q.scenario}
                            </p>
                          </div>

                          {/* Recommended Framework */}
                          <div className="text-xs font-mono text-emerald-400">
                            <strong>Recommended Framework:</strong> {q.recommendedFramework}
                          </div>

                          {/* Solution Blueprint */}
                          <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-line font-sans">
                            {q.solutionBlueprint}
                          </div>

                          {/* Code Snippet if present */}
                          {q.codeSnippet && (
                            <div className="rounded-xl border border-border bg-inset/80 overflow-hidden">
                              <div className="flex items-center justify-between border-b border-border/80 px-4 py-2 bg-inset text-[11px] font-mono text-muted">
                                <span>Implementation ({q.codeSnippet.lang})</span>
                              </div>
                              <pre className="p-4 overflow-x-auto text-xs font-mono text-fg leading-relaxed">
                                <code>{q.codeSnippet.code}</code>
                              </pre>
                            </div>
                          )}

                          {/* Tradeoffs & Traps */}
                          {q.tradeoffsAndTraps?.length > 0 && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                              <h5 className="eyebrow text-red-400">Architectural Traps to Avoid</h5>
                              <ul className="space-y-1.5 text-xs text-fg/90 list-disc list-inside">
                                {q.tradeoffsAndTraps.map((trap, ti) => (
                                  <li key={ti}>{trap}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Follow-up Questions */}
                          {q.followUpQuestions?.length > 0 && (
                            <div className="rounded-xl border border-border/60 bg-inset/40 p-4 space-y-3">
                              <h5 className="eyebrow text-accent">Interviewer Follow-Up Drill</h5>
                              {q.followUpQuestions.map((fu, fidx) => (
                                <div key={fidx} className="rounded-lg bg-surface/80 p-3 text-xs space-y-1">
                                  <p className="font-medium text-fg flex items-start gap-1.5">
                                    <span className="font-mono text-accent font-semibold">Q:</span>
                                    <span>{fu.q}</span>
                                  </p>
                                  <p className="text-muted pl-4">
                                    <span className="font-mono text-emerald-400 font-semibold mr-1.5">A:</span>
                                    {fu.a}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
