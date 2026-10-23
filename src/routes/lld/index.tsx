import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  HelpCircle,
  Layers,
  Search,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TopicCard } from "@/components/content/TopicCard";
import { lldConcepts } from "@/data/lld";
import {
  LLD_COMPANY_TRACKS,
  LLD_TOPIC_QA_LIBRARY,
  LLD_UML_BLUEPRINTS,
  type LldCompanyTrack,
  type LldTopicQA,
  type LldUmlBlueprint,
} from "@/data/lld/lld-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lld/")({ component: LldIndex });

type TabType = "curriculum" | "blueprints" | "qa" | "companies";

function LldIndex() {
  const [activeTab, setActiveTab] = useState<TabType>("curriculum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    "lld-qa-double-checked-locking": true,
    "swiggy-food-delivery-system": true,
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

  const filteredQA = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LLD_TOPIC_QA_LIBRARY.filter((item) => {
      return (
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.fullAnswer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const filteredCompanyTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LLD_COMPANY_TRACKS.map((track) => {
      const matchesCompany = selectedCompany === "all" || track.companySlug === selectedCompany;
      if (!matchesCompany) return null;

      const filteredQuestions = track.questions.filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.problemStatement.toLowerCase().includes(q) ||
          item.entitiesAndDesign.toLowerCase().includes(q)
        );
      });

      if (!matchesCompany && filteredQuestions.length === 0) return null;
      if (q && filteredQuestions.length === 0) return null;

      return {
        ...track,
        questions: filteredQuestions,
      };
    }).filter(Boolean) as LldCompanyTrack[];
  }, [searchQuery, selectedCompany]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-12 bg-bg text-fg">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-10 backdrop-blur-xl">
        <div className="mesh-glow-subtle pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow text-purple-400 flex items-center gap-1.5">
              <Boxes className="size-3.5" />
              Low-Level Design · OOP &amp; Design Patterns · Concurrency
            </span>
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 font-mono text-[11px] font-medium text-purple-400">
              Basic to Advanced
            </span>
            <span className="rounded-full border border-border bg-inset px-2.5 py-0.5 font-mono text-[11px] text-muted">
              Clean Architecture
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-fg">
            LLD Concepts &amp; Machine Coding Masterclass
          </h1>

          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted">
            From SOLID principles and design patterns to thread-safe data structures, UML class
            diagrams, and working machine-coding implementations asked in top loops at{" "}
            <span className="font-medium text-fg">Swiggy, Uber, Amazon, and Microsoft</span>.
          </p>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-fg">{lldConcepts.length} Concepts</div>
              <div className="text-xs text-muted">Curriculum Topics</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-purple-400">Classic Patterns</div>
              <div className="text-xs text-muted">Creational / Structural / Behavioral</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-blue-400">UML Blueprints</div>
              <div className="text-xs text-muted">Architecture Class Diagrams</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-emerald-400">Machine Coding</div>
              <div className="text-xs text-muted">90-Min Problem Solutions</div>
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
            Curriculum &amp; Patterns ({lldConcepts.length})
          </button>

          <button
            onClick={() => setActiveTab("blueprints")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "blueprints"
                ? "bg-accent text-accent-contrast shadow-sm"
                : "border border-border/70 bg-surface/70 text-muted hover:bg-surface hover:text-fg"
            )}
          >
            <Workflow className="size-4" />
            Advanced UML Class Blueprints
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
            Machine Coding Rounds
            <span className="rounded-full bg-purple-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-purple-400">
              HOT
            </span>
          </button>
        </div>

        <Link
          to="/playgrounds"
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
        >
          <Code2 className="size-3.5" />
          Interactive LLD Simulator
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Global Search */}
      {(activeTab === "qa" || activeTab === "companies") && (
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              placeholder="Search LLD questions, patterns, machine coding..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/90 py-2.5 pl-10 pr-4 text-sm text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}

      {/* TAB 1: CURRICULUM */}
      {activeTab === "curriculum" && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lldConcepts.map((c) => (
            <TopicCard
              key={c.slug}
              to="/lld/$slug"
              slug={c.slug}
              kicker={c.level}
              title={c.title}
              subtitle={c.subtitle}
              tags={c.tags}
              id={`lld:${c.slug}`}
            />
          ))}
        </div>
      )}

      {/* TAB 2: ADVANCED UML BLUEPRINTS */}
      {activeTab === "blueprints" && (
        <div className="mt-8 space-y-8 max-w-5xl mx-auto">
          {LLD_UML_BLUEPRINTS.map((bp, idx) => (
            <div key={idx} className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {bp.patternsUsed.map((p) => (
                  <span key={p} className="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-0.5 font-mono text-[11px] text-purple-400 font-semibold">
                    {p}
                  </span>
                ))}
              </div>

              <h3 className="mt-3 font-display text-2xl font-medium text-fg sm:text-3xl">
                {bp.title}
              </h3>
              <p className="mt-1 text-xs text-muted">{bp.subtitle}</p>

              <div className="mt-5 rounded-xl border border-border bg-inset p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-fg leading-relaxed">
                  <code>{bp.umlDiagram}</code>
                </pre>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {bp.coreResponsibilities.map((cr, cri) => (
                  <div key={cri} className="rounded-xl border border-border/60 bg-surface/90 p-4 text-xs">
                    <div className="font-semibold text-fg flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-purple-400" />
                      {cr.className}
                    </div>
                    <p className="mt-1 text-muted">{cr.role}</p>
                    <div className="mt-2 text-[11px] text-purple-400 font-mono">
                      <strong>Thread Safety:</strong> {cr.concurrencySafety}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TOPIC Q&A LIBRARY */}
      {activeTab === "qa" && (
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            {filteredQA.map((qa) => {
              const isOpen = Boolean(openCards[qa.id]);
              return (
                <div key={qa.id} className="rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-md overflow-hidden transition-all hover:border-border">
                  <button onClick={() => toggleCard(qa.id)} className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors hover:bg-surface/80">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-purple-400">
                          {qa.category}
                        </span>
                        <span className="rounded-md bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold">
                          Diff: {qa.difficulty}
                        </span>
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-medium text-fg">{qa.question}</h3>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">{qa.summary}</p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isOpen ? <ChevronDown className="size-5 text-accent" /> : <ChevronRight className="size-5 text-muted" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/70 p-5 sm:p-7 bg-surface/30 space-y-6">
                      <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-line font-sans">
                        {qa.fullAnswer}
                      </div>

                      {qa.codeSnippet && (
                        <div className="rounded-xl border border-border bg-inset/80 overflow-hidden">
                          <pre className="p-4 overflow-x-auto text-xs font-mono text-fg leading-relaxed">
                            <code>{qa.codeSnippet.snippet}</code>
                          </pre>
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

      {/* TAB 4: MACHINE CODING */}
      {activeTab === "companies" && (
        <div className="mt-8 space-y-10">
          {filteredCompanyTracks.map((track) => (
            <div key={track.id} className="rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/80 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-5 text-accent" />
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">{track.company}</h2>
                    <span className="rounded-full bg-accent/10 border border-accent/30 px-2.5 py-0.5 font-mono text-[11px] text-accent font-medium">
                      {track.roleTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted"><strong>Format:</strong> {track.roundType}</p>
                  <p className="mt-2 text-xs sm:text-sm text-fg/80 leading-relaxed max-w-3xl">
                    <strong className="text-accent">Bar:</strong> {track.evaluationBar}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5 relative z-10">
                {track.questions.map((q) => {
                  const isOpen = Boolean(openCards[q.id]);
                  return (
                    <div key={q.id} className="rounded-2xl border border-border/80 bg-surface/70 overflow-hidden transition-all hover:border-accent/40">
                      <button onClick={() => toggleCard(q.id)} className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors hover:bg-surface">
                        <div className="space-y-2 flex-1">
                          <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-purple-400">
                            {q.timeLimit}
                          </span>
                          <h4 className="font-display text-base sm:text-lg font-medium text-fg">{q.title}</h4>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isOpen ? <ChevronDown className="size-5 text-accent" /> : <ChevronRight className="size-5 text-muted" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border/80 p-5 sm:p-7 bg-surface/30 space-y-6">
                          <div className="rounded-xl border border-border/70 bg-inset/60 p-4">
                            <p className="text-xs sm:text-sm text-fg leading-relaxed">{q.problemStatement}</p>
                          </div>
                          <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-line font-sans">
                            {q.entitiesAndDesign}
                          </div>
                          <div className="rounded-xl border border-border bg-inset/80 overflow-hidden">
                            <pre className="p-4 overflow-x-auto text-xs font-mono text-fg leading-relaxed">
                              <code>{q.classDesignCode.code}</code>
                            </pre>
                          </div>
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
