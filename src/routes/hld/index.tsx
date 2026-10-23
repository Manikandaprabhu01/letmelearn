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
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TopicCard } from "@/components/content/TopicCard";
import { HLD_GROUPS } from "@/data/hld";
import {
  HLD_BLUEPRINTS,
  HLD_COMPANY_TRACKS,
  HLD_TOPIC_QA_LIBRARY,
  type HldBlueprint,
  type HldCompanyTrack,
  type HldTopicQA,
} from "@/data/hld/hld-hub";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hld/")({ component: HldIndex });

type TabType = "curriculum" | "blueprints" | "qa" | "companies";

function HldIndex() {
  const [activeTab, setActiveTab] = useState<TabType>("curriculum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    "hld-qa-cache-stampede": true,
    "netflix-video-cdn-architecture": true,
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
    return HLD_TOPIC_QA_LIBRARY.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.fullAnswer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const filteredCompanyTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HLD_COMPANY_TRACKS.map((track) => {
      const matchesCompany = selectedCompany === "all" || track.companySlug === selectedCompany;
      if (!matchesCompany) return null;

      const filteredQuestions = track.questions.filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.scenario.toLowerCase().includes(q) ||
          item.architectureBlueprint.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      });

      if (!matchesCompany && filteredQuestions.length === 0) return null;
      if (q && filteredQuestions.length === 0) return null;

      return {
        ...track,
        questions: filteredQuestions,
      };
    }).filter(Boolean) as HldCompanyTrack[];
  }, [searchQuery, selectedCompany]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-12 bg-bg text-fg">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-10 backdrop-blur-xl">
        <div className="mesh-glow-subtle pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow text-teal-400 flex items-center gap-1.5">
              <Network className="size-3.5" />
              High-Level Design &amp; Microservices Architecture
            </span>
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 font-mono text-[11px] font-medium text-teal-400">
              Basic to Advanced
            </span>
            <span className="rounded-full border border-border bg-inset px-2.5 py-0.5 font-mono text-[11px] text-muted">
              Production Scalability
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-fg">
            HLD &amp; Distributed Microservices Masterclass
          </h1>

          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted">
            The language of distributed boxes, queues, and networks: scaling from 1 to 10M+ users,
            caching topologies, consistent hashing, distributed Sagas, Kafka streaming, and
            real-world architecture loops from{" "}
            <span className="font-medium text-fg">Netflix, Uber, Meta, and Amazon</span>.
          </p>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-fg">40 Concepts</div>
              <div className="text-xs text-muted">Core Topics</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-teal-400">9 Tracks</div>
              <div className="text-xs text-muted">Themed Curricula</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-blue-400">10M+ Scale</div>
              <div className="text-xs text-muted">Architectural Blueprints</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-inset/60 p-3.5">
              <div className="font-mono text-2xl font-semibold text-emerald-400">Top Labs</div>
              <div className="text-xs text-muted">Company System Designs</div>
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
            Curriculum &amp; Tracks (9 Groups)
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
            Advanced Architecture Blueprints
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
            Company System Design Loops
            <span className="rounded-full bg-teal-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-teal-400">
              HOT
            </span>
          </button>
        </div>

        <Link
          to="/examples"
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-500/20 transition-colors"
        >
          <Workflow className="size-3.5" />
          Worked Design Cases (Uber, Netflix)
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
                  ? "Search HLD topics, caching, consensus, Sagas, Kafka..."
                  : "Search company systems (Netflix video, Uber geospatial, etc.)..."
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
                { label: "Netflix", slug: "netflix" },
                { label: "Uber", slug: "uber" },
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
        </div>
      )}

      {/* TAB 1: CURRICULUM & TRACKS */}
      {activeTab === "curriculum" && (
        <div className="mt-8 space-y-10">
          {HLD_GROUPS.map((group) => (
            <section key={group.title} className="rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-7 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-medium tracking-tight text-fg">{group.title}</h2>
                <span className="font-mono text-xs text-muted">{group.concepts.length} concepts</span>
              </div>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-6 text-muted">{group.blurb}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.concepts.map((c) => (
                  <TopicCard
                    key={c.slug}
                    to="/hld/$slug"
                    slug={c.slug}
                    kicker={c.level}
                    title={c.title}
                    subtitle={c.subtitle}
                    tags={c.tags}
                    id={`hld:${c.slug}`}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* TAB 2: ADVANCED ARCHITECTURE BLUEPRINTS */}
      {activeTab === "blueprints" && (
        <div className="mt-8 space-y-8 max-w-5xl mx-auto">
          {HLD_BLUEPRINTS.map((bp, idx) => (
            <div key={idx} className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-0.5 font-mono text-[11px] text-teal-400 font-semibold">
                  {bp.badge}
                </span>
              </div>

              <h3 className="mt-3 font-display text-2xl font-medium text-fg sm:text-3xl">
                {bp.title}
              </h3>
              <p className="mt-1 text-xs text-muted">{bp.subtitle}</p>
              <p className="mt-3 text-xs sm:text-sm text-fg/80 leading-relaxed">{bp.explanation}</p>

              <div className="mt-5 rounded-xl border border-border bg-inset p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-fg leading-relaxed">
                  <code>{bp.diagram}</code>
                </pre>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {bp.keyComponents.map((kc, kci) => (
                  <div key={kci} className="rounded-xl border border-border/60 bg-surface/90 p-4 text-xs">
                    <div className="font-semibold text-fg flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-teal-400" />
                      {kc.name}
                    </div>
                    <p className="mt-1 text-muted">{kc.role}</p>
                    <div className="mt-2 text-[11px] text-teal-400 font-mono">
                      <strong>Scaling:</strong> {kc.scalingTactic}
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
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Showing <strong className="text-fg">{filteredQA.length}</strong> system design questions &amp; solutions</span>
            <div className="flex gap-2">
              <button onClick={() => expandAll(filteredQA.map((q) => q.id))} className="text-accent hover:underline">
                Expand all
              </button>
              <span>·</span>
              <button onClick={() => collapseAll(filteredQA.map((q) => q.id))} className="text-muted hover:underline">
                Collapse all
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQA.map((qa) => {
              const isOpen = Boolean(openCards[qa.id]);
              return (
                <div key={qa.id} className="rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-md overflow-hidden transition-all hover:border-border">
                  <button onClick={() => toggleCard(qa.id)} className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors hover:bg-surface/80">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-400">
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

                      {qa.codeOrSchema && (
                        <div className="rounded-xl border border-border bg-inset/80 overflow-hidden">
                          <pre className="p-4 overflow-x-auto text-xs font-mono text-fg leading-relaxed">
                            <code>{qa.codeOrSchema.content}</code>
                          </pre>
                        </div>
                      )}

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

      {/* TAB 4: COMPANY SYSTEM DESIGN LOOPS */}
      {activeTab === "companies" && (
        <div className="mt-8 space-y-10">
          {filteredCompanyTracks.map((track) => (
            <div key={track.id} className="rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="mesh-glow-subtle pointer-events-none absolute inset-0 opacity-40" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/80 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="size-5 text-accent" />
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">{track.company}</h2>
                    <span className="rounded-full bg-accent/10 border border-accent/30 px-2.5 py-0.5 font-mono text-[11px] text-accent font-medium">
                      {track.roleTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-mono text-teal-400">Scale: {track.systemScale}</p>
                  <p className="mt-2 text-xs sm:text-sm text-fg/80 leading-relaxed max-w-3xl">
                    <strong className="text-accent">Bar Raiser Tenet:</strong> {track.barRaiserTenet}
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-accent/10 border border-accent/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                              {q.type}
                            </span>
                            <span className="rounded-md bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold">
                              Diff: {q.difficulty}
                            </span>
                          </div>
                          <h4 className="font-display text-base sm:text-lg font-medium text-fg">{q.title}</h4>
                          <p className="text-xs text-amber-400 font-mono">
                            <strong>Testing:</strong> {q.whatInterviewerIsTesting}
                          </p>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isOpen ? <ChevronDown className="size-5 text-accent" /> : <ChevronRight className="size-5 text-muted" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-border/80 p-5 sm:p-7 bg-surface/30 space-y-6">
                          <div className="rounded-xl border border-border/70 bg-inset/60 p-4">
                            <p className="text-xs sm:text-sm text-fg leading-relaxed">{q.scenario}</p>
                          </div>
                          <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-fg/90 whitespace-pre-line font-sans">
                            {q.architectureBlueprint}
                          </div>
                          {q.tradeoffs?.length > 0 && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                              <h5 className="eyebrow text-red-400">Architectural Traps</h5>
                              <ul className="space-y-1 text-xs text-fg/90 list-disc list-inside">
                                {q.tradeoffs.map((t, ti) => (
                                  <li key={ti}>{t}</li>
                                ))}
                              </ul>
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
