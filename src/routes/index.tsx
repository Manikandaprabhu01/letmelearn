import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Flame,
  Layers,
  Network,
  Play,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import { hldConcepts } from "@/data/hld";
import { COMPANY_COUNT, COMPANY_INDEX, ROLE_TRACKS } from "@/data/interview/meta";
import { javaConcepts } from "@/data/java";
import { lldConcepts } from "@/data/lld";
import { playgrounds } from "@/data/playgrounds";
import { pythonConcepts } from "@/data/python";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const STEPS = [
  {
    n: "01",
    title: "Scope & SLAs",
    body: "Write down the QPS, DAU, read:write ratios, and SLAs. Clarify what is intentionally out of scope before sketching a single box.",
    tag: "Requirements",
  },
  {
    n: "02",
    title: "High-Level Blueprint",
    body: "Establish DNS, API gateway, stateless microservices, read caches, and persistent multi-master data stores with clear protocols (gRPC/HTTP).",
    tag: "Architecture",
  },
  {
    n: "03",
    title: "Deep Dive Hard Parts",
    body: "Confront the single points of failure: consistent hashing, Kafka partition skew, idempotent payment ledgers, and 429 rate limiting.",
    tag: "Bottlenecks",
  },
  {
    n: "04",
    title: "Resilience & Wrap",
    body: "Circuit breakers, cross-region replication lag, disaster recovery, observability (P99 metrics), and what trade-offs you would make next.",
    tag: "Production",
  },
];

const STUDY_IDS: ReadonlySet<string> = new Set([
  ...hldConcepts.map((c) => `hld:${c.slug}`),
  ...lldConcepts.map((c) => `lld:${c.slug}`),
  ...examples.map((e) => `ex:${e.slug}`),
  ...fdeConcepts.map((c) => `fde:${c.slug}`),
  ...javaConcepts.map((c) => `java:${c.slug}`),
  ...pythonConcepts.map((c) => `py:${c.slug}`),
  ...playgrounds.map((p) => `lab:${p.slug}`),
  ...COMPANY_INDEX.map((c) => `ip:${c.id}`),
  "ip:freshworks-lead",
]);

interface SimMode {
  id: string;
  label: string;
  qps: string;
  latency: string;
  cacheHit: string;
  status: string;
  topology: string[];
}

const SIM_MODES: SimMode[] = [
  {
    id: "active-active",
    label: "Active-Active Multi-Region",
    qps: "1.45M req/s",
    latency: "11.4ms p99",
    cacheHit: "99.4%",
    status: "Healthy · 3 Regions",
    topology: ["Cloudflare Anycast", "Envoy L7 Mesh", "Spring / Go Pods", "Redis Cluster", "Aurora Multi-Master"],
  },
  {
    id: "kafka-pipeline",
    label: "Event-Driven Ledger",
    qps: "620K events/s",
    latency: "4.8ms commit",
    cacheHit: "98.9%",
    status: "Zero Loss · ISR = 3",
    topology: ["Ingress Gateway", "Kafka Shards (24)", "Outbox Worker", "Idempotency Store", "Elasticsearch Sink"],
  },
  {
    id: "rag-agent",
    label: "AI Multi-Agent RAG",
    qps: "18.2K tokens/s",
    latency: "280ms TTFT",
    cacheHit: "94.2% semantic",
    status: "Dense + Sparse Hybrid",
    topology: ["FastAPI Gateway", "BGE Embeddings", "Qdrant Vector DB", "Reranker Model", "vLLM Inference"],
  },
  {
    id: "rate-limiter",
    label: "Distributed Token Bucket",
    qps: "2.1M checks/s",
    latency: "1.2ms eval",
    cacheHit: "99.8%",
    status: "Sliding Window Sync",
    topology: ["Edge CDN", "Token Bucket Lua", "Redis Sentinel", "Circuit Breaker", "Backend Cluster"],
  },
];

function Home() {
  const done = useProgress(
    (s) => Object.entries(s.done).filter(([id, value]) => value && STUDY_IDS.has(id)).length,
  );
  const total = STUDY_IDS.size;
  const progressPercent = Math.min(100, Math.round((done / Math.max(1, total)) * 100));

  const [activeSim, setActiveSim] = useState<SimMode>(SIM_MODES[0]);
  const [burstActive, setBurstActive] = useState(false);

  const triggerBurst = () => {
    setBurstActive(true);
    setTimeout(() => setBurstActive(false), 2400);
  };

  return (
    <main className="relative overflow-hidden">
      {/* Ambient background mesh glow */}
      <div className="mesh-glow-hero pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-80" />

      {/* Hero Section */}
      <section className="relative px-5 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-20 lg:px-12 border-b border-border/80">
        <div className="cyber-dots pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative max-w-4xl">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface/80 px-3.5 py-1.5 backdrop-blur-md">
            <span className="flex size-2 rounded-full bg-cta animate-soft-pulse" />
            <span className="font-mono text-[11px] font-medium tracking-wider text-accent uppercase">
              System Design Studio 2.0
            </span>
            <span className="text-border-strong">•</span>
            <span className="text-[12px] text-muted">
              {COMPANY_COUNT} Company Loops &amp; Interactive Labs
            </span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-fg sm:text-5xl lg:text-6xl text-balance">
            Architecture at Scale.{" "}
            <span className="gradient-text-accent">Zero Handwaving.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-muted sm:text-[17px]">
            Master high-throughput distributed systems, Java &amp; Spring Boot internals, Python AI
            multi-agent RAG, low-level concurrency, and {COMPANY_COUNT} real corporate interview
            blueprints with runnable sandboxes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/interview-prep"
              className="inline-flex items-center gap-2 rounded-lg bg-cta px-4 py-2.5 font-medium text-cta-fg shadow-lg shadow-cta/15 transition-transform duration-150 hover:scale-[1.02]"
            >
              <Terminal className="size-4" />
              Launch Interview Console
              <ArrowRight className="size-4" />
            </Link>

            <Link
              to="/playgrounds"
              className="glass-card-interactive inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-fg"
            >
              <Zap className="size-4 text-accent" />
              Run Interactive Labs
            </Link>

            <Link
              to="/interview-prep/freshworks-lead"
              className="glass-card-interactive inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-fg"
            >
              <Sparkles className="size-4 text-ok" />
              Freshworks Lead SE Master Guide
            </Link>
          </div>
        </div>

        {/* Live Architecture Simulator Cockpit */}
        <div className="mt-12 overflow-hidden rounded-xl border border-border/80 bg-surface/90 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between border-b border-border/80 bg-inset/50 px-4 py-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-bad/70" />
                <span className="size-3 rounded-full bg-warn/70" />
                <span className="size-3 rounded-full bg-ok/70" />
              </div>
              <span className="font-mono text-xs text-muted">
                telemetry.letmelearn.dev &bull; <span className="text-ok font-medium">{activeSim.status}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SIM_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveSim(mode)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
                    activeSim.id === mode.id
                      ? "bg-accent/20 text-accent border border-accent/40"
                      : "text-muted hover:text-fg hover:bg-raised/60",
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-inset/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Throughput</span>
                  <Activity className="size-3.5 text-accent" />
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold text-fg">
                  {burstActive ? "3.84M req/s" : activeSim.qps}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ok">
                  <span>&uarr; Peak load handled</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-inset/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>p99 Latency</span>
                  <Zap className="size-3.5 text-cta" />
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold text-fg">
                  {burstActive ? "18.2ms p99" : activeSim.latency}
                </div>
                <div className="mt-1 text-[11px] text-muted">Global edge SLA guaranteed</div>
              </div>

              <div className="rounded-lg border border-border/60 bg-inset/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Cache Efficiency</span>
                  <Database className="size-3.5 text-ok" />
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold text-fg">
                  {activeSim.cacheHit}
                </div>
                <div className="mt-1 text-[11px] text-muted">L1 in-memory + L2 distributed</div>
              </div>

              <div className="rounded-lg border border-border/60 bg-inset/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Chaos Simulator</span>
                  <Flame className="size-3.5 text-warn" />
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={triggerBurst}
                    disabled={burstActive}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    {burstActive ? "Simulating 3x Spike..." : "Inject 3x Traffic Burst"}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-faint">Tests auto-scaling &amp; rate limits</div>
              </div>
            </div>

            {/* Topology Flow Bar */}
            <div className="mt-5 rounded-lg border border-border/70 bg-inset/60 p-4">
              <div className="eyebrow mb-2">Cluster Node Pipeline</div>
              <div className="flex flex-wrap items-center gap-2">
                {activeSim.topology.map((node, i) => (
                  <div key={node} className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-xs text-fg">
                      <span className="size-1.5 rounded-full bg-ok" />
                      {node}
                    </span>
                    {i < activeSim.topology.length - 1 && (
                      <ArrowRight className="size-3.5 text-faint shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Studio Real-time Counters */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
          <StatCard
            icon={<Cpu className="size-4 text-accent" />}
            value={javaConcepts.length}
            label="Java & Spring"
            sub="49 chapters"
          />
          <StatCard
            icon={<Code2 className="size-4 text-ok" />}
            value={pythonConcepts.length}
            label="Python for AI"
            sub="20 modules"
          />
          <StatCard
            icon={<Layers className="size-4 text-warn" />}
            value={lldConcepts.length}
            label="LLD Blueprints"
            sub="19 patterns"
          />
          <StatCard
            icon={<Network className="size-4 text-accent" />}
            value={hldConcepts.length}
            label="HLD Systems"
            sub="40 chapters"
          />
          <StatCard
            icon={<BookOpen className="size-4 text-cta" />}
            value={examples.length}
            label="Worked Designs"
            sub="Volumes 1 & 2"
          />
          <StatCard
            icon={<CheckCircle2 className="size-4 text-ok" />}
            value={`${done}/${total}`}
            label="Your Progress"
            sub={`${progressPercent}% studied`}
          />
        </div>
      </section>

      {/* Six Core Track Doors */}
      <section className="relative px-5 py-12 sm:px-8 sm:py-16 lg:px-12 border-b border-border/80">
        <div>
          <div className="eyebrow">Comprehensive Curriculum</div>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
            Six Specialized Engineering Tracks
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            From the language memory model and Spring Boot internals to multi-agent AI and
            hyper-scale distributed systems.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TrackDoor
            to="/java"
            badge="Backend Foundation"
            title="Java & Spring Boot Core"
            count="49 Chapters"
            description="Deep dive on the JVM memory model, garbage collection algorithms, Spring Boot internals, virtual threads, and Java 8 through 26."
            tags={["Spring Boot 3", "Virtual Threads", "JMM", "Garbage Collection"]}
          />

          <TrackDoor
            to="/python"
            badge="AI Engineering"
            title="Python End-to-End for AI"
            count="20 Chapters"
            description="NumPy vectorized math, PyTorch fundamentals, LLM streaming APIs, hybrid RAG retrievers, agentic workflows, and production FastAPI."
            tags={["PyTorch", "Hybrid RAG", "vLLM", "Agentic Workflows"]}
          />

          <TrackDoor
            to="/lld"
            badge="Object-Oriented Design"
            title="LLD & Machine Coding"
            count="19 Blueprints"
            description="SOLID principles, design patterns, thread-safe LRU cache, parking lot, splitwise, and production-grade concurrency that survives review."
            tags={["SOLID", "Concurrency", "Lock-Free", "Machine Coding"]}
          />

          <TrackDoor
            to="/hld"
            badge="Distributed Systems"
            title="HLD & Microservices"
            count="40 Concepts"
            description="CAP theorem, consistent hashing, distributed transactions with Sagas, Kubernetes orchestration, and zero-downtime canary deployments."
            tags={["Distributed Sagas", "Consistent Hashing", "K8s", "Kafka"]}
          />

          <TrackDoor
            to="/examples"
            badge="Case Studies"
            title="System Design Blueprints"
            count="41 Worked Problems"
            description="Rate limiter, TinyURL, distributed message queue, payment gateway, Uber dispatch, and Google Docs collaborative editing."
            tags={["Payment Ledger", "Distributed Queue", "Collaborative CRDT", "Uber Dispatch"]}
          />

          <TrackDoor
            to="/fde"
            badge="Enterprise AI"
            title="AI FDE Roadmap"
            count="80 Modules"
            description="Software foundations to client-facing deployment: model evals, Model Context Protocol (MCP), semantic routing, guardrails, and latency."
            tags={["MCP Protocol", "LLM Evals", "Guardrails", "Enterprise AI"]}
          />
        </div>
      </section>

      {/* Role-Based Track Hub Spotlight */}
      <section className="relative px-5 py-12 sm:px-8 sm:py-16 lg:px-12 border-b border-border/80 bg-surface/30">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="eyebrow">Career Level Ladders</div>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
              Role-Wise Interview Question Banks
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Targeted question banks, deep worked solutions, and scoring rubrics tailored specifically
              to your target seniority level.
            </p>
          </div>
          <Link
            to="/interview-prep"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-accent hover:underline shrink-0"
          >
            All {ROLE_TRACKS.length} Role Tracks <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_TRACKS.slice(0, 6).map((role) => (
            <Link
              key={role.id}
              to="/interview-prep/role/$role"
              params={{ role: role.id }}
              className="glass-card-interactive group flex flex-col justify-between rounded-xl p-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-accent">
                    {role.badge}
                  </span>
                  <span className="rounded border border-border px-2 py-0.5 font-mono text-[10.5px] text-muted">
                    {role.level}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-medium text-fg group-hover:text-accent transition-colors">
                  {role.shortTitle}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">
                  {role.tagline}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                <span className="font-mono text-[11px] text-faint">
                  {role.questions.length} Questions &bull; Worked Answers
                </span>
                <span className="inline-flex items-center gap-1 text-accent font-medium group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Freshworks & Company Spotlight Banner */}
      <section className="relative px-5 py-12 sm:px-8 sm:py-16 lg:px-12 border-b border-border/80">
        <div className="glass-card overflow-hidden rounded-2xl border border-accent/30 p-6 sm:p-8 lg:p-10 relative">
          <div className="mesh-glow-subtle pointer-events-none absolute inset-0" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow text-accent">Featured Company Blueprint</span>
              <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
                Freshworks Lead Software Engineer Master Guide
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Complete 5-round master blueprint covering Live Machine Coding, Multi-Tenant SaaS
                System Design, Kafka Event Mesh Architecture, Tech Leadership Rubrics, and Executive
                Bar Raiser questions with verified Java &amp; Python answer sheets.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-accent/15 px-2.5 py-1 font-mono text-accent">
                  101 Curated Questions
                </span>
                <span className="rounded bg-surface px-2.5 py-1 font-mono text-muted border border-border">
                  5 Complete Rounds
                </span>
                <span className="rounded bg-surface px-2.5 py-1 font-mono text-muted border border-border">
                  Multi-Tenant SaaS
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <Link
                to="/interview-prep/freshworks-lead"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-5 py-2.5 font-medium text-cta-fg shadow-lg shadow-cta/20 hover:scale-[1.02] transition-transform"
              >
                Open Master Guide <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/interview-prep"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs text-muted hover:text-fg hover:border-border-strong transition-colors"
              >
                Browse all {COMPANY_COUNT} companies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Architecture Method */}
      <section className="relative px-5 py-12 sm:px-8 sm:py-16 lg:px-12 border-b border-border/80">
        <div>
          <div className="eyebrow">Proven Methodology</div>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
            The 4-Step Architecture Interview Framework
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Proven in top-tier tech loops and elite Principal SDE interviews. Every architecture page in
            LetMeLearn adheres to this repeatable structure.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="glass-card-interactive flex flex-col justify-between rounded-xl p-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-accent">{s.n}</span>
                  <span className="rounded bg-raised px-2 py-0.5 font-mono text-[10px] text-faint uppercase">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-medium text-fg">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Labs Spotlight */}
      <section className="relative px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="eyebrow">Real-Time Sandboxes</div>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg sm:text-3xl">
              Break Things in Interactive Labs
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Fire traffic bursts at token buckets, trip circuit breakers under network partition,
              coordinate distributed sagas, and tune semantic RAG retrieval in real time.
            </p>
          </div>
          <Link
            to="/playgrounds"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-accent hover:underline shrink-0"
          >
            All {playgrounds.length} Interactive Labs <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {playgrounds.slice(0, 8).map((p) => (
            <Link
              key={p.slug}
              to="/playgrounds/$slug"
              params={{ slug: p.slug }}
              className="glass-card-interactive group flex flex-col justify-between rounded-xl p-5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-accent/15 px-2 py-0.5 font-mono text-[10.5px] text-accent">
                    Lab
                  </span>
                  <Play className="size-3 text-muted group-hover:text-accent transition-colors" />
                </div>
                <h3 className="mt-3 font-display text-[15px] font-medium text-fg group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted line-clamp-2 leading-relaxed">
                  {p.subtitle}
                </p>
              </div>
              <div className="mt-4 border-t border-border/50 pt-2.5 flex items-center justify-between text-[11px] font-mono text-faint">
                <span>{p.tags[0] ?? "Sandbox"}</span>
                <span className="text-accent group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub: string;
}) {
  return (
    <div className="glass-card rounded-lg p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xl font-semibold text-fg">{value}</span>
        {icon}
      </div>
      <div className="mt-1.5 text-xs font-medium text-fg">{label}</div>
      <div className="text-[11px] text-muted">{sub}</div>
    </div>
  );
}

function TrackDoor({
  to,
  badge,
  title,
  count,
  description,
  tags,
}: {
  to: string;
  badge: string;
  title: string;
  count: string;
  description: string;
  tags: string[];
}) {
  return (
    <Link
      to={to}
      className="glass-card-interactive group flex flex-col justify-between rounded-xl p-6"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="rounded bg-accent/15 px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent">
            {badge}
          </span>
          <span className="font-mono text-[11px] text-muted">{count}</span>
        </div>

        <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-fg group-hover:text-accent transition-colors">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded border border-border/70 bg-inset/60 px-2 py-0.5 font-mono text-[10px] text-faint"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-accent">
        <span>Enter track</span>
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
