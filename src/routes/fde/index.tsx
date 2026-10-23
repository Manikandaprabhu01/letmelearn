import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  ExternalLink,
  Flame,
  HelpCircle,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  COMPANY_INTERVIEW_TRACKS,
  FDE_COURSE_MODULES,
  FDE_TOPIC_QA_LIBRARY,
  type CompanyInterviewTrack,
  type FdeCourseModule,
  type FdeTopicQA,
} from "@/data/fde/course-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fde/")({ component: FdeCourseHub });

type TabType = "curriculum" | "blueprint" | "qa" | "companies";

export function FdeCourseHub() {
  const [activeTab, setActiveTab] = useState<TabType>("curriculum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    "fde-qa-paged-attention": true,
    "palantir-decomp-defense-logistics": true,
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
    return FDE_TOPIC_QA_LIBRARY.filter((item) => {
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
    return COMPANY_INTERVIEW_TRACKS.map((track) => {
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
    }).filter(Boolean) as CompanyInterviewTrack[];
  }, [searchQuery, selectedCompany]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-12 bg-bg text-fg">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-10 backdrop-blur-xl">
        <div className="mesh-glow-subtle pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              Applied AI · Systems · Architecture · Enterprise Deployment
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 font-mono text-[11px] font-medium text-emerald-400">
              End-to-End Masterclass
            </span>
            <span className="rounded-full border border-border bg-inset px-2.5 py-0.5 font-mono text-[11px] text-muted">
              2025–2026 Industry Standard
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-fg">
            AI Forward Deployed Engineer (FDE) Roadmap
          </h1>

          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted">
            The comprehensive curriculum bridging applied AI craft, production distributed systems,
            and customer problem decomposition. Master everything from PagedAttention and RAG
            evaluation triads to live client role-plays and technical loops at{" "}
            <span className="font-medium text-fg">Palantir, OpenAI, Anthropic, Databricks, Scale AI, and Meta</span>.
          </p>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-fg">8 Steps</div>
              <div className="text-xs text-muted">Progression Modules</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-emerald-400">80+ Topics</div>
              <div className="text-xs text-muted">Core Production Skills</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-blue-400">30+ Q&amp;As</div>
              <div className="text-xs text-muted">In-Depth Technical Bank</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-amber-400">6 Top Labs</div>
              <div className="text-xs text-muted">Company Interview Tracks</div>
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
                ? "bg-accent text-accent-contrast shadow-sm"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <Layers className="size-4" />
            Curriculum (8 Steps)
          </button>

          <button
            onClick={() => setActiveTab("blueprint")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "blueprint"
                ? "bg-accent text-accent-contrast shadow-sm"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <Workflow className="size-4" />
            End-to-End Course Blueprint
          </button>

          <button
            onClick={() => setActiveTab("qa")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "qa"
                ? "bg-accent text-accent-contrast shadow-sm"
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
                ? "bg-accent text-accent-contrast shadow-sm"
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

        {/* Console Practice Link */}
        <Link
          to="/interview-prep/role/$role"
          params={{ role: "ai-fde" }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <Terminal className="size-3.5" />
          Interactive Practice Console
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
                  ? "Search topics, questions, concepts (e.g., PagedAttention, RAG triad, MCP)..."
                  : "Search company questions, scenarios, architecture (e.g., Palantir, vLLM, Air-gap)..."
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
                { label: "All Labs", slug: "all" },
                { label: "Palantir", slug: "palantir" },
                { label: "OpenAI", slug: "openai" },
                { label: "Anthropic", slug: "anthropic" },
                { label: "Databricks", slug: "databricks" },
                { label: "Scale AI", slug: "scale-ai" },
                { label: "Meta", slug: "meta" },
              ].map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCompany(c.slug)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selectedCompany === c.slug
                      ? "bg-accent text-accent-contrast"
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
                { label: "All", slug: "all" },
                { label: "Inference & Latency", slug: "Inference" },
                { label: "Evals & RAG", slug: "Evals" },
                { label: "Vector Retrieval", slug: "Retrieval" },
                { label: "Security & Safety", slug: "Security" },
                { label: "Decomposition", slug: "Decomposition" },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                    selectedCategory === cat.slug
                      ? "bg-accent text-accent-contrast"
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

      {/* TAB 1: CURRICULUM (8 STEPS) */}
      {activeTab === "curriculum" && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {FDE_COURSE_MODULES.map((mod) => (
              <div
                key={mod.slug}
                className="group relative flex flex-col rounded-2xl border border-border/80 bg-surface/50 p-6 sm:p-7 backdrop-blur-md transition-all hover:border-accent/50 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                      #{mod.step}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-muted">
                      {mod.estimatedHours} hrs · {mod.level}
                    </span>
                  </div>

                  <Link
                    to="/fde/$slug"
                    params={{ slug: mod.slug }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    View Full Lesson
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <h3 className="mt-3 font-display text-xl font-medium tracking-tight text-fg group-hover:text-accent transition-colors">
                  {mod.title}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">{mod.subtitle}</p>

                {/* Why it matters block */}
                <div className="mt-4 rounded-xl border border-border/60 bg-inset/50 p-3.5 text-xs leading-relaxed text-fg/80">
                  <strong className="text-emerald-400 block mb-1">Why it matters for an FDE:</strong>
                  {mod.whyItMattersForFde}
                </div>

                {/* Topics List */}
                <div className="mt-5 space-y-3 flex-1">
                  <h4 className="eyebrow text-muted">Core Topics &amp; In-Depth Subtopics</h4>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {mod.topics.map((t) => (
                      <div
                        key={t.title}
                        className="rounded-lg border border-border/60 bg-surface/90 p-3 text-xs"
                      >
                        <div className="font-semibold text-fg flex items-start gap-1.5">
                          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{t.title}</span>
                        </div>
                        <p className="mt-1 text-muted line-clamp-2 leading-relaxed">{t.desc}</p>
                        <div className="mt-2 text-[11px] text-amber-400/90 font-mono">
                          <span className="font-semibold text-amber-400">Gotcha:</span> {t.productionGotcha}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Production Deliverable */}
                <div className="mt-5 border-t border-border/60 pt-3 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    <strong className="text-fg">Deliverable:</strong> {mod.productionDeliverable}
                  </span>
                  <Link
                    to="/fde/$slug"
                    params={{ slug: mod.slug }}
                    className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors shrink-0 ml-3"
                  >
                    Start Step {mod.step} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: END-TO-END COURSE BLUEPRINT */}
      {activeTab === "blueprint" && (
        <div className="mt-8 space-y-8 max-w-5xl mx-auto">
          {/* Executive Overview */}
          <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
              The AI Forward Deployed Engineer (FDE) Role: Complete Blueprint
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              The Forward Deployed Engineer is neither a pure research scientist nor a traditional core
              product SWE. Originating from Palantir and now the most critical hire at frontier AI labs
              (OpenAI, Anthropic, Scale AI, Databricks), an FDE operates as a{" "}
              <strong className="text-fg">"Startup CTO inside the customer's boardroom."</strong> You
              embed with high-value enterprise clients, decompose messy legacy workflows, deploy secure
              AI pipelines into air-gapped VPCs, and build production software under tight deadlines.
            </p>

            {/* Role Taxonomy Comparison Table */}
            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-inset text-fg border-b border-border font-medium">
                  <tr>
                    <th className="p-3.5">Dimension</th>
                    <th className="p-3.5 text-muted">Core Product SWE</th>
                    <th className="p-3.5 text-muted">AI Research Scientist</th>
                    <th className="p-3.5 text-emerald-400">Forward Deployed Engineer (FDE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted">
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Primary Location</td>
                    <td className="p-3.5">Internal HQ office</td>
                    <td className="p-3.5">Lab / Compute cluster</td>
                    <td className="p-3.5 text-fg font-medium">Embedded on-site in customer VPC/room</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Core Deliverable</td>
                    <td className="p-3.5">Scalable generic SaaS feature</td>
                    <td className="p-3.5">New model architecture / weights</td>
                    <td className="p-3.5 text-fg font-medium">Working client PoC, data pipelines &amp; ROI</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Data Environment</td>
                    <td className="p-3.5">Clean internal schema &amp; APIs</td>
                    <td className="p-3.5">Curated pre-training web scrape</td>
                    <td className="p-3.5 text-fg font-medium">Messy 20-year legacy SAP, Oracle &amp; PDFs</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Evaluation Standard</td>
                    <td className="p-3.5">Unit test coverage &amp; p99 latency</td>
                    <td className="p-3.5">MMLU / GSM8k benchmark scores</td>
                    <td className="p-3.5 text-fg font-medium">Domain faithfulness, customer sign-off &amp; safety</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-fg">Dealing with Ambiguity</td>
                    <td className="p-3.5">Waits for PM spec ticket</td>
                    <td className="p-3.5">Academic hypothesis testing</td>
                    <td className="p-3.5 text-fg font-medium">Decomposes vague anxiety into 2-week MVP</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* The 5-Phase Customer Engagement Lifecycle */}
          <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8">
            <h3 className="font-display text-xl font-medium tracking-tight text-fg sm:text-2xl">
              The 5-Phase End-to-End Engagement Lifecycle
            </h3>
            <p className="mt-2 text-sm text-muted">
              How an FDE takes an enterprise engagement from the initial vague executive pitch to full
              production cutover and multi-million dollar annual recurring revenue.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  phase: "Phase 1: Discovery & Problem Decomposition ('Decomp')",
                  time: "Week 1",
                  focus:
                    "Anchor to the business North Star. Identify the single workflow that yields 80% of value. Interview ground-level operators to find the fatal 'PoC-killing question' (data permissions, air-gap, latency).",
                  deliverable: "1-Page PoC Charter with frozen scope, golden test set, and kill-criteria.",
                },
                {
                  phase: "Phase 2: VPC Infrastructure & Data Plumbing",
                  time: "Week 1–2",
                  focus:
                    "Deploy into customer's AWS GovCloud / Azure Confidential VPC. Establish mTLS, IAM roles, and vector storage (pgvector / Qdrant). Ingest messy PDFs, SAP dumps, and SQL tables with entity resolution.",
                  deliverable: "Clean unified data pipeline with automated schema validation.",
                },
                {
                  phase: "Phase 3: Rapid PoC & Interactive Sandbox",
                  time: "Week 2–3",
                  focus:
                    "Build the working prototype (FastAPI + React). Implement Hybrid Search (BM25 + Dense) and tool-calling agents. Keep deterministic rules deterministic and use LLMs only for synthesis.",
                  deliverable: "Interactive web dashboard tested on 50 real customer edge cases.",
                },
                {
                  phase: "Phase 4: Systematic Evals (Ragas / G-Eval) & Security Hardening",
                  time: "Week 3–4",
                  focus:
                    "Run automated evaluation pipelines asserting Faithfulness >= 0.95. Implement Llama Guard input defenses, document-level RBAC, and prompt prefix caching to cut token bills by 70%.",
                  deliverable: "Automated regression eval report proving AI accuracy vs human baseline.",
                },
                {
                  phase: "Phase 5: Executive Demo, Cutover & ROI Hand-Off",
                  time: "Week 4+",
                  focus:
                    "Deliver the live executive demo. Demonstrate graceful failures and transparent fallback UI. Transition ownership to client's internal engineering team with architecture runbooks.",
                  deliverable: "Full production deployment signed off by CISO, Head of Ops, and CFO.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/70 bg-inset/50 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start"
                >
                  <div className="flex items-center gap-2 sm:flex-col sm:items-start shrink-0">
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                      {item.time}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-fg">{item.phase}</h4>
                    <p className="mt-1 text-xs sm:text-sm text-muted leading-relaxed">{item.focus}</p>
                    <div className="mt-2 text-xs font-mono text-emerald-400">
                      <strong>Deliverable:</strong> {item.deliverable}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The 2-Week PoC Playbook */}
          <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8">
            <h3 className="font-display text-xl font-medium tracking-tight text-fg">
              The 2-Week PoC Execution Playbook: Day 1 to Day 14
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-inset/50 p-4">
                <span className="font-mono text-xs font-semibold text-accent">Day 1–3: The Ground Truth</span>
                <ul className="mt-2 space-y-1 text-xs text-muted list-disc list-inside">
                  <li>Shadow end-users (underwriters, dispatchers, mechanics)</li>
                  <li>Collect 50 historical sample files with known human answers</li>
                  <li>Freeze the evaluation dataset into JSONL format</li>
                  <li>Get Infosec sign-off on data boundaries &amp; zero-data-retention</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/70 bg-inset/50 p-4">
                <span className="font-mono text-xs font-semibold text-accent">Day 4–7: Data &amp; Retrieval Engine</span>
                <ul className="mt-2 space-y-1 text-xs text-muted list-disc list-inside">
                  <li>Parse scanned PDFs with layout-aware chunking</li>
                  <li>Index into vector DB with BM25 hybrid search</li>
                  <li>Tune reciprocal rank fusion (k=60) and cross-encoder rerank</li>
                  <li>Validate that top-3 chunks contain the ground-truth answers</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/70 bg-inset/50 p-4">
                <span className="font-mono text-xs font-semibold text-accent">Day 8–11: Agent Logic &amp; UI</span>
                <ul className="mt-2 space-y-1 text-xs text-muted list-disc list-inside">
                  <li>Write strict Pydantic schemas for structured extraction</li>
                  <li>Build simple, responsive React/FastAPI interface</li>
                  <li>Add source citation highlights linking directly to source PDF page</li>
                  <li>Enforce confidence routing for Human-in-the-Loop review</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/70 bg-inset/50 p-4">
                <span className="font-mono text-xs font-semibold text-accent">Day 12–14: The Executive Win</span>
                <ul className="mt-2 space-y-1 text-xs text-muted list-disc list-inside">
                  <li>Run the 50-file benchmark: prove 90%+ match with human experts</li>
                  <li>Dry-run the demo on edge cases to practice handling failures</li>
                  <li>Present live ROI calculator: time saved, errors caught, cost per query</li>
                  <li>Hand over 1-page architecture whitepaper &amp; rollout contract</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOPIC Q&A LIBRARY */}
      {activeTab === "qa" && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Showing <strong className="text-fg">{filteredQA.length}</strong> technical questions &amp; worked answers
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
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
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
                              Production Implementation ({qa.code.lang})
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
              key={track.companySlug}
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
                  <p className="mt-1 text-xs text-muted">{track.headquarters}</p>
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
                  Featured Interview Loops &amp; Scenarios ({track.questions.length})
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
                            <h5 className="eyebrow text-muted">The Client Scenario</h5>
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
                                <span>Code Solution ({q.codeSnippet.lang})</span>
                              </div>
                              <pre className="p-4 overflow-x-auto text-xs font-mono text-fg leading-relaxed">
                                <code>{q.codeSnippet.code}</code>
                              </pre>
                            </div>
                          )}

                          {/* Tradeoffs & Traps */}
                          {q.tradeoffsAndTraps?.length > 0 && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                              <h5 className="eyebrow text-red-400">Interview Traps to Avoid</h5>
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
