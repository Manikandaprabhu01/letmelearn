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

          {/* Visual ASCII Flow */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-surface/70 p-6">
              <h3 className="font-display text-lg font-medium text-amber-400">
                B+ Tree Slotted Page Anatomy (8KB Page)
              </h3>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-inset p-4 font-mono text-xs text-fg leading-relaxed">
{`┌───────────────────────────────────────────────┐
│ Page Header (LSN, Checksum, Flags, Free Space) │
├───────────────┬───────────────┬───────────────┤
│ Line Pointer 1│ Line Pointer 2│ Line Pointer 3│ ... (grows down)
├───────────────┴───────────────┴───────────────┤
│                 FREE SPACE                    │
│                 (Unallocated)                 │
├───────────────────────────────────────────────┤
│ Tuple 3 (xmin, xmax, data: "Alice")           │ ... (grows up)
├───────────────────────────────────────────────┤
│ Tuple 2 (xmin, xmax, data: "Bob")             │
├───────────────────────────────────────────────┤
│ Tuple 1 (xmin, xmax, data: "Charlie")         │
└───────────────────────────────────────────────┘`}
              </pre>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                Slotted pages prevent external memory fragmentation. When a row changes size, only its
                internal line pointer and byte offset are updated; the external physical page address
                remains invariant.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface/70 p-6">
              <h3 className="font-display text-lg font-medium text-emerald-400">
                LSM-Tree Compaction &amp; SSTable Hierarchy
              </h3>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-inset p-4 font-mono text-xs text-fg leading-relaxed">
{`[ Incoming Writes ]
        │
        ├──► [ Write-Ahead Log (WAL on Disk) ]
        ▼
[ MemTable in RAM (SkipList) ]
        │ (Flush when 64MB full)
        ▼
Level 0: [ SSTable 1 ] [ SSTable 2 ] [ SSTable 3 ]
        │ (Merge Sort & Deduplicate)
        ▼
Level 1: [ SSTable A (Keys: a-m) ] [ SSTable B (Keys: n-z) ]
        │ (Leveled Compaction 10x size multiplier)
        ▼
Level 2: [ SSTable 10x larger... ]`}
              </pre>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                Bloom filters in RAM allow skipping 99% of SSTables during point reads. If the Bloom
                filter reports the key is definitely absent, the engine avoids touching the disk
                altogether.
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
