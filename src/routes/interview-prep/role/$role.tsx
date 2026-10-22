import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Building2, HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { CodePair } from "@/components/interview/AnswerBody";
import { DifficultyChip, PlainChip, TypeChip } from "@/components/interview/Chips";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { Md } from "@/components/interview/Md";
import { getRoleTrack } from "@/data/interview/meta";
import { useInterviewPrefs } from "@/lib/interview-prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview-prep/role/$role")({
  loader: ({ params }) => {
    const track = getRoleTrack(params.role);
    if (!track) throw notFound();
    return { role: params.role };
  },
  component: RoleDetailPage,
});

function RoleDetailPage() {
  const { role } = Route.useLoaderData();
  const track = getRoleTrack(role);

  const [activeTab, setActiveTab] = useState<string>("all");
  const [openCards, setOpenCards] = useState<Record<string, boolean>>(() => ({
    [track?.questions[0]?.id || ""]: true,
  }));
  const query = useInterviewPrefs((s) => s.query);

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredQuestions = useMemo(() => {
    if (!track) return [];
    return track.questions.filter((q) => {
      const matchesTab = activeTab === "all" || q.type === activeTab;
      const qText = query.trim().toLowerCase();
      const matchesSearch =
        !qText ||
        q.q.toLowerCase().includes(qText) ||
        q.company.toLowerCase().includes(qText) ||
        q.keyTakeaway.toLowerCase().includes(qText) ||
        q.answerSummary.toLowerCase().includes(qText);
      return matchesTab && matchesSearch;
    });
  }, [track, activeTab, query]);

  if (!track) return null;

  return (
    <ConsoleLayout showLang={true} searchLabel="Search questions">
      {/* Back button */}
      <Link
        to="/interview-prep"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to Interview Prep Console
      </Link>

      {/* Role Header */}
      <div className="mt-4 glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="mesh-glow-subtle pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow text-accent">Role &amp; Experience Track</span>
            <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
              {track.badge}
            </span>
            <span className="rounded-full border border-border/80 bg-surface/80 px-2.5 py-0.5 font-mono text-[11px] text-muted">
              {track.level}
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-fg">
            {track.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{track.tagline}</p>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-fg/80">{track.overview}</p>

          {/* Skills pill strip */}
          <div className="mt-6 flex flex-wrap gap-2">
            {track.keySkills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-border/70 bg-inset/70 px-3 py-1 font-mono text-xs text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation Bar & Company Loops */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 font-medium text-fg">
            <CheckCircle2 className="size-4 text-ok" />
            <span className="font-display">What Clears the Bar</span>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-muted">{track.whatClearsBar}</p>
          <div className="mt-4 border-t border-border/60 pt-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">Filter Round:</span>
            <p className="mt-1 text-xs text-fg font-medium">{track.filterRound}</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 font-medium text-fg">
            <Building2 className="size-4 text-accent" />
            <span className="font-display">Company Loops &amp; Focus Areas</span>
          </div>
          <div className="mt-3 space-y-2.5 text-xs">
            {track.companyTrends.map((c) => (
              <div key={c.company} className="rounded-lg border border-border/60 bg-inset/60 p-3">
                <div className="flex items-center justify-between font-medium text-fg">
                  <span className="font-medium text-accent">{c.company}</span>
                  <span className="text-[10.5px] font-mono text-faint">{c.typicalRounds}</span>
                </div>
                <p className="mt-1 text-muted leading-relaxed text-[11.5px]">{c.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Questions & Worked Answers */}
      <section className="mt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight text-fg">
              Curated Question Bank &amp; Worked Answers
            </h2>
            <p className="mt-1 text-xs text-muted">
              {filteredQuestions.length} questions mapped to {track.shortTitle} loops with deep answers.
            </p>
          </div>

          {/* Type Tabs */}
          <div className="flex flex-wrap gap-1 rounded-xl border border-border/80 bg-inset/70 p-1">
            {[
              { id: "all", label: "All" },
              { id: "coding", label: "Coding" },
              { id: "lld", label: "LLD & Machine Coding" },
              { id: "hld", label: "System Design" },
              { id: "concept", label: "Concepts" },
              { id: "behavioral", label: "Behavioral" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-accent/20 text-accent border border-accent/40 shadow-sm"
                    : "text-muted hover:text-fg hover:bg-surface/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question List */}
        <div className="mt-6 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="glass-card rounded-xl border border-dashed border-border/80 p-10 text-center text-sm text-muted">
              No questions found matching the selected filter.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isOpen = Boolean(openCards[q.id]);
              return (
                <div
                  key={q.id}
                  className="glass-card overflow-hidden rounded-xl transition-all duration-150"
                >
                  {/* Card Header / Summary Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleCard(q.id)}
                    className="flex w-full items-start justify-between gap-4 p-4 text-left transition-colors hover:bg-raised/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeChip type={q.type} />
                        <DifficultyChip d={q.difficulty} />
                        <span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-medium text-accent">
                          {q.company}
                        </span>
                        <PlainChip>{q.round}</PlainChip>
                      </div>
                      <h3 className="mt-2 text-[15px] font-medium leading-snug text-fg">{q.q}</h3>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{q.keyTakeaway}</p>
                    </div>
                    <div className="mt-1 text-muted">
                      {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </div>
                  </button>

                  {/* Expanded Full Answer */}
                  {isOpen ? (
                    <div className="border-t border-border bg-inset/40 p-5">
                      {/* Summary callout */}
                      <div className="rounded-md border border-accent/20 bg-accent/5 p-3.5 text-xs text-fg leading-relaxed">
                        <span className="font-semibold text-accent uppercase tracking-wider text-[10px] block mb-1">
                          Core Strategy & Evaluation Takeaway
                        </span>
                        {q.answerSummary}
                      </div>

                      {/* Full Markdown Answer */}
                      <div className="mt-5 text-sm leading-relaxed">
                        <Md text={q.fullAnswer} />
                      </div>

                      {/* Java & Python Code */}
                      {q.code ? (
                        <div className="mt-6">
                          <CodePair java={q.code.java} py={q.code.py} />
                        </div>
                      ) : null}

                      {/* Follow-up Questions */}
                      {q.followUps && q.followUps.length > 0 ? (
                        <div className="mt-6 border-t border-border pt-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent mb-3">
                            <HelpCircle className="size-3.5" />
                            <span>Interviewer Follow-up Questions & Pro Answers</span>
                          </h4>
                          <div className="space-y-2.5">
                            {q.followUps.map((fu, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-border bg-surface p-3 text-xs"
                              >
                                <p className="font-medium text-fg">
                                  <span className="mr-1.5 text-accent font-mono font-bold">Q:</span>
                                  {fu.q}
                                </p>
                                <p className="mt-1.5 text-muted leading-relaxed">
                                  <span className="mr-1.5 text-ok font-mono font-bold">A:</span>
                                  {fu.a}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>
    </ConsoleLayout>
  );
}
