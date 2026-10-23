import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopicCard } from "@/components/content/TopicCard";
import { examples } from "@/data/examples";
import {
  SYSTEM_BLUEPRINTS,
  ESTIMATION_RULES,
  INTERVIEW_FRAMEWORK,
  COMPANY_DESIGN_ROUNDS,
} from "@/data/examples/examples-hub";

export const Route = createFileRoute("/examples/")({ component: ExamplesIndex });

type TabMode = "cases" | "blueprints" | "framework" | "companies";

function ExamplesIndex() {
  const [activeTab, setActiveTab] = useState<TabMode>("cases");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("uber-dispatch");
  const [searchQuery, setSearchQuery] = useState("");

  const vol1 = examples.filter((e) => e.source === "Volume 1");
  const vol2 = examples.filter((e) => e.source === "Volume 2");
  const awesome = examples.filter((e) => e.source === "Source 6");

  const filterCases = (items: typeof examples) => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "All" ||
        (selectedCategory === "Volume 1" && item.source === "Volume 1") ||
        (selectedCategory === "Volume 2" && item.source === "Volume 2") ||
        (selectedCategory === "Source 6" && item.source === "Source 6") ||
        item.tags.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  };

  const filteredVol1 = filterCases(vol1);
  const filteredVol2 = filterCases(vol2);
  const filteredAwesome = filterCases(awesome);
  const totalCount = filteredVol1.length + filteredVol2.length + filteredAwesome.length;

  const currentBlueprint =
    SYSTEM_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) ?? SYSTEM_BLUEPRINTS[0];

  return (
    <main className="px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-10">
      {/* Header & Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface via-surface/60 to-surface/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Production Case Studies
            </span>
            <span className="text-xs text-muted">24 Production Scenarios • FAANG & Unicorn Level</span>
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl text-fg">
            System Design Examples & Blueprints
          </h1>

          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-fg/80">
            End-to-end worked system design architectures from foundational distributed scaling (Volume 1 &amp; 2)
            to high-throughput real-world production platforms (Uber, Netflix, WhatsApp, Distributed Rate Limiters).
            Explore end-to-end data pipelines, back-of-the-envelope capacity formulas, and real FAANG interview round expectations.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
            <div className="rounded-xl bg-inset/50 p-3 border border-border/40">
              <div className="text-xl sm:text-2xl font-bold font-mono text-accent">24</div>
              <div className="text-xs text-muted">Worked Cases</div>
            </div>
            <div className="rounded-xl bg-inset/50 p-3 border border-border/40">
              <div className="text-xl sm:text-2xl font-bold font-mono text-fg">5</div>
              <div className="text-xs text-muted">ASCII Blueprints</div>
            </div>
            <div className="rounded-xl bg-inset/50 p-3 border border-border/40">
              <div className="text-xl sm:text-2xl font-bold font-mono text-fg">4-Step</div>
              <div className="text-xs text-muted">FAANG Framework</div>
            </div>
            <div className="rounded-xl bg-inset/50 p-3 border border-border/40">
              <div className="text-xl sm:text-2xl font-bold font-mono text-accent">15</div>
              <div className="text-xs text-muted">Estimation Rules</div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="inline-flex rounded-xl bg-inset/80 p-1 border border-border/70 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("cases")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === "cases"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg hover:bg-surface/50"
            }`}
          >
            Worked Cases ({examples.length})
          </button>
          <button
            onClick={() => setActiveTab("blueprints")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === "blueprints"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg hover:bg-surface/50"
            }`}
          >
            Architecture Blueprints ({SYSTEM_BLUEPRINTS.length})
          </button>
          <button
            onClick={() => setActiveTab("framework")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === "framework"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg hover:bg-surface/50"
            }`}
          >
            Estimation &amp; 4-Step Framework
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === "companies"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg hover:bg-surface/50"
            }`}
          >
            FAANG Design Rounds ({COMPANY_DESIGN_ROUNDS.length})
          </button>
        </div>

        {/* Global Search Bar */}
        {activeTab === "cases" && (
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search worked cases, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-inset/60 px-4 py-2 text-xs sm:text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-muted hover:text-fg"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: WORKED CASES */}
      {activeTab === "cases" && (
        <section className="space-y-10 animate-fade-in">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted mr-1">Filter Source:</span>
            {["All", "Volume 1", "Volume 2", "Source 6"].map((source) => (
              <button
                key={source}
                onClick={() => setSelectedCategory(source)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  selectedCategory === source
                    ? "bg-fg text-bg font-medium"
                    : "border border-border/60 bg-surface/40 text-fg/70 hover:bg-surface hover:text-fg"
                }`}
              >
                {source}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted font-mono">
              Showing {totalCount} of {examples.length} cases
            </span>
          </div>

          {/* Volume 1 */}
          {(selectedCategory === "All" || selectedCategory === "Volume 1") && filteredVol1.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-fg">
                    Volume 1 — Foundational Scale &amp; Web Tier
                  </h2>
                  <p className="text-xs text-muted">
                    Scale from single server to global clusters, rate limiters, consistent hashing, and web storage.
                  </p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-mono text-accent">
                  {filteredVol1.length} Chapters
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVol1.map((e) => (
                  <TopicCard
                    key={e.slug}
                    to="/examples/$slug"
                    slug={e.slug}
                    kicker={`Ch. ${e.chapter ?? "—"}`}
                    title={e.title}
                    subtitle={e.summary}
                    tags={e.tags}
                    id={`ex:${e.slug}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Volume 2 */}
          {(selectedCategory === "All" || selectedCategory === "Volume 2") && filteredVol2.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-fg">
                    Volume 2 — Advanced Real-Time &amp; Enterprise Scale
                  </h2>
                  <p className="text-xs text-muted">
                    Proximity geohashing, financial ledgers, video transcoders, and real-time gaming leaderboards.
                  </p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-mono text-accent">
                  {filteredVol2.length} Chapters
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVol2.map((e) => (
                  <TopicCard
                    key={e.slug}
                    to="/examples/$slug"
                    slug={e.slug}
                    kicker={`Ch. ${e.chapter ?? "—"}`}
                    title={e.title}
                    subtitle={e.summary}
                    tags={e.tags}
                    id={`ex:${e.slug}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Source 6 (Awesome List) */}
          {(selectedCategory === "All" || selectedCategory === "Source 6") && filteredAwesome.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight text-fg">
                    Source 6 — Production Architectures (Awesome List)
                  </h2>
                  <p className="text-xs text-muted">
                    High-demand production systems: WhatsApp, Uber, Netflix, Distributed Locks, and Collaborative Editors.
                  </p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-mono text-accent">
                  {filteredAwesome.length} Scenarios
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAwesome.map((e) => (
                  <TopicCard
                    key={e.slug}
                    to="/examples/$slug"
                    slug={e.slug}
                    kicker={
                      e.difficulty === "foundational"
                        ? "Easy"
                        : e.difficulty === "intermediate"
                          ? "Medium"
                          : "Hard"
                    }
                    title={e.title}
                    subtitle={e.summary}
                    tags={e.tags}
                    id={`ex:${e.slug}`}
                  />
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <div className="rounded-2xl border border-border/70 bg-surface/30 p-12 text-center">
              <p className="text-sm text-muted">No cases found matching your search or filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-4 text-xs text-accent hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: ARCHITECTURE BLUEPRINTS */}
      {activeTab === "blueprints" && (
        <section className="space-y-8 animate-fade-in">
          {/* Blueprint Selector Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SYSTEM_BLUEPRINTS.map((bp) => {
              const isSelected = bp.id === selectedBlueprintId;
              return (
                <button
                  key={bp.id}
                  onClick={() => setSelectedBlueprintId(bp.id)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-lg ring-1 ring-accent"
                      : "border-border/70 bg-surface/40 hover:bg-surface/80"
                  }`}
                >
                  <span className="text-[11px] font-mono text-accent uppercase tracking-wider block">
                    {bp.category}
                  </span>
                  <h3 className="text-sm font-semibold text-fg mt-1 line-clamp-1">{bp.title}</h3>
                  <div className="mt-2 text-[11px] text-muted line-clamp-1">{bp.scaleMetrics.traffic}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Blueprint Detail */}
          <div className="rounded-3xl border border-border/80 bg-surface/40 p-6 sm:p-8 backdrop-blur-xl space-y-8 shadow-xl">
            {/* Blueprint Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-6">
              <div>
                <span className="eyebrow text-accent">{currentBlueprint.category}</span>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-fg mt-1">
                  {currentBlueprint.title}
                </h2>
                <p className="text-sm text-fg/80 max-w-3xl mt-2 leading-relaxed">
                  {currentBlueprint.summary}
                </p>
              </div>
            </div>

            {/* Scale Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/60 bg-inset/60 p-4">
                <span className="text-[10px] uppercase font-mono text-muted tracking-wider">Traffic &amp; Scale</span>
                <p className="text-xs sm:text-sm font-semibold text-fg mt-1">{currentBlueprint.scaleMetrics.traffic}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-inset/60 p-4">
                <span className="text-[10px] uppercase font-mono text-muted tracking-wider">Storage Footprint</span>
                <p className="text-xs sm:text-sm font-semibold text-fg mt-1">{currentBlueprint.scaleMetrics.storage}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-inset/60 p-4">
                <span className="text-[10px] uppercase font-mono text-muted tracking-wider">Target Latency</span>
                <p className="text-xs sm:text-sm font-semibold text-fg mt-1">{currentBlueprint.scaleMetrics.latency}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-inset/60 p-4">
                <span className="text-[10px] uppercase font-mono text-muted tracking-wider">Availability SLA</span>
                <p className="text-xs sm:text-sm font-semibold text-accent mt-1">{currentBlueprint.scaleMetrics.availability}</p>
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="eyebrow text-accent">End-to-End System Blueprint</h3>
                <span className="text-xs text-muted font-mono">High-Fidelity ASCII Topography</span>
              </div>
              <div className="rounded-2xl border border-border bg-inset/95 p-4 sm:p-6 overflow-x-auto shadow-inner">
                <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-accent/90 whitespace-pre">
                  {currentBlueprint.diagram}
                </pre>
              </div>
            </div>

            {/* Data Flow Steps */}
            <div className="space-y-4">
              <h3 className="eyebrow text-accent">Step-by-Step Execution Lifecycle</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentBlueprint.dataFlow.map((step, idx) => (
                  <div key={idx} className="rounded-xl border border-border/60 bg-inset/40 p-4 flex gap-3 items-start">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/15 text-accent font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm text-fg/90 leading-relaxed font-sans">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottlenecks, Tradeoffs & Mitigations */}
            <div className="space-y-4">
              <h3 className="eyebrow text-accent">Critical Bottlenecks &amp; Production Mitigations</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {currentBlueprint.bottlenecksAndMitigations.map((bm, idx) => (
                  <div key={idx} className="rounded-2xl border border-border/80 bg-surface/50 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <h4 className="text-xs sm:text-sm font-semibold text-fg">{bm.bottleneck}</h4>
                    </div>
                    <div className="rounded-xl bg-inset/60 p-3 border border-border/50">
                      <span className="text-[10px] uppercase font-mono text-accent block">Engineering Mitigation</span>
                      <p className="text-xs text-fg/90 mt-1 leading-relaxed">{bm.mitigation}</p>
                    </div>
                    <div className="rounded-xl bg-inset/30 p-3 border border-border/40">
                      <span className="text-[10px] uppercase font-mono text-muted block">System Tradeoff</span>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{bm.tradeoff}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack Matrix */}
            <div className="space-y-3">
              <h3 className="eyebrow text-accent">Recommended Production Tech Stack</h3>
              <div className="rounded-2xl border border-border/70 overflow-hidden bg-inset/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/80 border-b border-border/70 text-muted uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3 sm:p-4">Component</th>
                      <th className="p-3 sm:p-4">Selected Tech</th>
                      <th className="p-3 sm:p-4">Architectural Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {currentBlueprint.techStack.map((ts, idx) => (
                      <tr key={idx} className="hover:bg-surface/40">
                        <td className="p-3 sm:p-4 font-medium text-fg">{ts.component}</td>
                        <td className="p-3 sm:p-4 font-mono text-accent font-semibold">{ts.technology}</td>
                        <td className="p-3 sm:p-4 text-fg/80">{ts.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: ESTIMATION & 4-STEP FRAMEWORK */}
      {activeTab === "framework" && (
        <section className="space-y-10 animate-fade-in">
          {/* 4-Step Framework */}
          <div className="space-y-6">
            <div className="border-b border-border/60 pb-3">
              <span className="eyebrow text-accent">The Standard FAANG Method</span>
              <h2 className="font-display text-2xl font-semibold text-fg mt-1">
                The 4-Step System Design Interview Framework (45 Minutes)
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1">
                How principal engineers structure their time to ace architecture rounds at Meta, Google, Amazon, and Stripe.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {INTERVIEW_FRAMEWORK.map((stage, idx) => (
                <div key={idx} className="rounded-2xl border border-border/80 bg-surface/40 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <span className="font-mono text-xs font-semibold text-accent">{stage.timeAllocation}</span>
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-mono text-accent font-bold">
                      Part {idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-fg">{stage.step}</h3>
                  <p className="text-xs text-fg/80 leading-relaxed">{stage.goal}</p>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-mono text-muted tracking-wider block">Key Deliverables</span>
                    <ul className="space-y-1.5">
                      {stage.keyQuestionsToAsk.map((q, qIdx) => (
                        <li key={qIdx} className="text-xs text-fg/80 flex items-start gap-2">
                          <span className="text-accent">•</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">Fatal Pitfall</span>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      {stage.pitfalls.join(" ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Numbers Every Engineer Must Know */}
          <div className="space-y-6 pt-6 border-t border-border/70">
            <div className="border-b border-border/60 pb-3">
              <span className="eyebrow text-accent">Back-of-the-Envelope Math</span>
              <h2 className="font-display text-2xl font-semibold text-fg mt-1">
                Latency, Storage &amp; QPS Rules of Thumb
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1">
                Memorize these orders of magnitude to compute traffic constraints and storage costs on the whiteboard.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 overflow-hidden bg-inset/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/80 border-b border-border/70 text-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3 sm:p-4">Category</th>
                    <th className="p-3 sm:p-4">Operation / Metric</th>
                    <th className="p-3 sm:p-4">Approximate Value</th>
                    <th className="p-3 sm:p-4">Engineering Rule of Thumb</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {ESTIMATION_RULES.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-surface/40">
                      <td className="p-3 sm:p-4 font-mono text-accent text-[11px]">{rule.category}</td>
                      <td className="p-3 sm:p-4 font-medium text-fg">{rule.item}</td>
                      <td className="p-3 sm:p-4 font-mono font-bold text-fg/90">{rule.value}</td>
                      <td className="p-3 sm:p-4 text-fg/80">{rule.ruleOfThumb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: FAANG DESIGN ROUNDS */}
      {activeTab === "companies" && (
        <section className="space-y-8 animate-fade-in">
          <div className="border-b border-border/60 pb-3">
            <span className="eyebrow text-accent">Live Company Mock Rounds</span>
            <h2 className="font-display text-2xl font-semibold text-fg mt-1">
              FAANG System Design Interview Simulations
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Exact prompts, scoring criteria, and pass/fail rubrics used by senior interviewers at top tech firms.
            </p>
          </div>

          <div className="space-y-6">
            {COMPANY_DESIGN_ROUNDS.map((round, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-border/80 bg-surface/40 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-accent/20 px-3 py-1 font-mono text-xs font-semibold text-accent">
                        {round.company}
                      </span>
                      <span className="text-xs text-muted">{round.role}</span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-semibold text-fg mt-2">
                      {round.problem}
                    </h3>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-inset/50 p-4 space-y-2">
                    <span className="text-[10px] uppercase font-mono text-accent block">Expected Deliverables</span>
                    <ul className="space-y-1.5">
                      {round.expectedDeliverables.map((d, dIdx) => (
                        <li key={dIdx} className="text-xs text-fg/90 flex items-start gap-2">
                          <span className="text-accent">✓</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-inset/50 p-4 space-y-2">
                    <span className="text-[10px] uppercase font-mono text-amber-400 block">Critical Traps to Defend</span>
                    <ul className="space-y-1.5">
                      {round.keyChallenges.map((c, cIdx) => (
                        <li key={cIdx} className="text-xs text-fg/90 flex items-start gap-2">
                          <span className="text-amber-400">⚠</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Scoring Criteria Rubric */}
                <div className="space-y-3">
                  <span className="eyebrow text-accent">Interviewer Grading Rubric</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {round.scoringCriteria.map((sc, scIdx) => (
                      <div key={scIdx} className="rounded-2xl border border-border/70 bg-inset/30 p-4 space-y-3">
                        <span className="text-xs font-semibold text-fg block font-mono">{sc.dimension}</span>
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5">
                          <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">Strong Hire</span>
                          <p className="text-xs text-emerald-200/90 mt-0.5 leading-relaxed">{sc.whatPasses}</p>
                        </div>
                        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5">
                          <span className="text-[10px] uppercase font-mono text-rose-400 block font-bold">No Hire</span>
                          <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">{sc.whatFails}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Answer Overview */}
                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
                  <span className="text-[10px] uppercase font-mono text-accent font-bold block">Model Strategy Debrief</span>
                  <p className="text-xs sm:text-sm text-fg/90 mt-1 leading-relaxed">
                    {round.modelAnswerOverview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
