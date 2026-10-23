import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Sparkles,
  Terminal,
  Cpu,
  Database,
  Layers,
  Briefcase,
  Copy,
  ChevronDown,
  ShieldCheck,
  Award,
  Zap,
  BookOpen,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { LogoMark } from "@/components/layout/Logo";
import { APP_NAME } from "@/data/nav";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatPaise, priceFor } from "@/lib/billing/pricing";
import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import { hldConcepts } from "@/data/hld";
import { COMPANY_COUNT, QUESTION_COUNT } from "@/data/interview/meta";
import { javaConcepts } from "@/data/java";
import { lldConcepts } from "@/data/lld";
import { playgrounds } from "@/data/playgrounds";
import { pythonConcepts } from "@/data/python";

export const Route = createFileRoute("/welcome")({ component: Welcome });

const TRACKS = [
  {
    category: "AI & ML",
    kicker: "Customer-facing AI",
    title: "AI Forward Deployed Engineer",
    body: "Eight steps from LLM basics and structured outputs to RAG Triads, Autonomous Agent Swarms, vLLM PagedAttention, LoRA fine-tuning, and enterprise evaluation harnesses.",
    to: "/fde" as const,
    stat: "80+ concepts",
    badge: "Hot Track",
    diagramPreview: "Agent Swarm Supervisor & vLLM Serving",
  },
  {
    category: "Databases",
    kicker: "Storage Engines & Consistency",
    title: "SQL & NoSQL Concepts",
    body: "B+ Tree page splits vs LSM-Tree compaction, Distributed 2PC with Raft quorum, MVCC snapshot isolation tuple headers, and HNSW vector index graphs.",
    to: "/databases" as const,
    stat: "30+ concepts",
    badge: "Architecture",
    diagramPreview: "LSM-Tree WAL & HNSW Vector Graph",
  },
  {
    category: "Distributed Systems",
    kicker: "High-level design",
    title: "HLD & Microservices Masterclass",
    body: "From single box to 10M+ users: distributed Saga orchestration, cache stampede XFetch probabilistic early refresh, Kafka EOS, and Envoy edge gateways.",
    to: "/hld" as const,
    stat: "40 concepts",
    badge: "Core System",
    diagramPreview: "10M Scaling Evolution & Kafka EOS",
  },
  {
    category: "Architecture",
    kicker: "Worked examples",
    title: "System Design Examples",
    body: "24 production system architectures rewritten to chapter depth: Uber Geospatial Dispatch, Netflix Global ABR Video, WhatsApp Erlang BEAM, and Distributed Rate Limiters.",
    to: "/examples" as const,
    stat: "24 blueprints",
    badge: "FAANG Tested",
    diagramPreview: "Uber H3 Spatial & Netflix Open Connect",
  },
  {
    category: "Object Oriented",
    kicker: "Low-level design",
    title: "LLD & Machine Coding",
    body: "SOLID principles, design patterns, thread-safe concurrent LRU caches, extensible rate limiters, and timed 90-minute Swiggy/Uber machine-coding rounds.",
    to: "/lld" as const,
    stat: "19 concepts",
    badge: "Code Heavy",
    diagramPreview: "Concurrent LRU & Strategy Pattern",
  },
  {
    category: "Backend",
    kicker: "Enterprise Backend",
    title: "Java & Spring Boot Masterclass",
    body: "49 chapters on JVM memory models, HotSpot G1 & ZGC colored pointers, Spring DispatcherServlet lifecycle, virtual threads, and Goldman Sachs low-latency loops.",
    to: "/java" as const,
    stat: "49 chapters",
    badge: "Deep Internals",
    diagramPreview: "ZGC Load Barrier & DispatcherServlet",
  },
  {
    category: "AI & ML",
    kicker: "Language & Systems",
    title: "Python End-to-End for AI",
    body: "From core idioms to CPython PEP 703 Free-Threaded No-GIL internals, PyTorch autograd dynamic computation graphs, and OpenAI streaming token gateways.",
    to: "/python" as const,
    stat: "20 chapters",
    badge: "No-GIL 3.13",
    diagramPreview: "PyTorch Dynamic DAG & PEP 703 No-GIL",
  },
  {
    category: "Practice",
    kicker: "Interview practice",
    title: "Interview Prep Console",
    body: "Question banks and worked rubrics for 34 top tech companies (Meta, Google, Amazon, Palantir, OpenAI, Stripe) with SDE-2 to Principal scoring criteria.",
    to: "/interview-prep" as const,
    stat: `${QUESTION_COUNT} questions`,
    badge: "FAANG Rubrics",
    diagramPreview: "Meta, Google, Amazon & Palantir",
  },
];

const HERO_SNIPPETS = {
  architecture: `+-------------------------------------------------------------------------+
|                  UBER REAL-TIME GEOSPATIAL DISPATCH                     |
+-------------------------------------------------------------------------+
 [Driver GPS] ──> [Envoy Edge] ──> [H3 Spatial Index] ──> [Redis Geo Cluster]
                                           │
 [Rider Ping] ──> [Matching Svc] ──> [kRing(Cell, r=2)] ──> [15s Redlock]
                                           │
                                  [Trip State Machine]`,
  code: `// High-Performance Concurrent LRU Cache (Lock-Striped)
public V get(K key) {
    int segment = hash(key) & (NUM_SEGMENTS - 1);
    locks[segment].readLock().lock();
    try {
        Node<K, V> node = map.get(key);
        if (node != null) {
            recordAccess(node); // Move to head of doubly-linked list
            return node.value;
        }
        return null;
    } finally {
        locks[segment].readLock().unlock();
    }
}`,
  qa: `Interviewer: "How do you prevent duplicate payments if a client network times out?"
Strong Hire Answer:
1. Client generates UUID idempotency key on Checkout click.
2. API Gateway validates key against Redis with 120s TTL (SETNX key 'PENDING').
3. Database executes within a single-row status machine with optimistic locking:
   UPDATE payments SET status='COMPLETED' WHERE id=:id AND status='INITIATED';
4. If upstream payment gateway times out, client safe-retries with identical key.`,
};

const PATHS = [
  {
    id: "backend",
    title: "Senior Backend / Distributed Systems",
    role: "Target: Google L5, Amazon SDE-3, Stripe",
    studyTime: "40 - 50 Hours",
    sequence: ["Java & Spring Boot (49 Ch)", "SQL & NoSQL Deep Internals", "HLD & Microservices (40)", "System Design Examples (24)"],
    highlight: "Emphasizes distributed consistency, Raft quorums, ZGC colored pointers, and Saga transactions.",
  },
  {
    id: "ai-fde",
    title: "AI / Forward Deployed Engineer (FDE)",
    role: "Target: Palantir FDE, OpenAI Solutions, Anthropic",
    studyTime: "30 - 40 Hours",
    sequence: ["Python for AI & PyTorch", "AI FDE 8-Step Roadmap", "Vector DBs & HNSW", "System Design Examples (RAG & Serving)"],
    highlight: "Focuses on Autonomous Agent Swarms, vLLM PagedAttention, LoRA fine-tuning, and enterprise customer deployment.",
  },
  {
    id: "staff",
    title: "Staff Engineer / Principal Architect",
    role: "Target: Meta E6, Uber Staff SDE, Netflix",
    studyTime: "45 - 60 Hours",
    sequence: ["HLD & Microservices (40)", "System Design Examples (24)", "Interview Prep (34 Companies)", "Interactive Labs"],
    highlight: "Covers planetary failure modes, back-of-the-envelope capacity estimations, and organizational trade-off rubrics.",
  },
];

const COMPARISON = [
  { feature: "Full ASCII & UML Architecture Blueprints", us: true, videos: false, leetcode: false, books: true },
  { feature: "Real Production Code & Thread-Safe Snippets", us: true, videos: "Surface level", leetcode: "Data structures only", books: false },
  { feature: "AI Forward Deployed Engineer (FDE) Curriculum", us: true, videos: false, leetcode: false, books: false },
  { feature: "Interactive In-Browser Labs & Simulators", us: true, videos: false, leetcode: false, books: false },
  { feature: "Company-Specific Interview Question Rubrics (34 Cos)", us: true, videos: false, leetcode: "Crowdsourced only", books: false },
  { feature: "Single Lifetime Payment (Zero Recurring Subscriptions)", us: true, videos: false, leetcode: false, books: true },
];

const FAQS = [
  {
    q: "How does LetMeLearn differ from standard System Design Interview books?",
    a: "Books provide static block diagrams without runnable code, internal state transitions, or modern cloud architectures like vLLM PagedAttention, Vector DBs (HNSW), or CPython 3.13 Free-Threaded No-GIL. LetMeLearn bridges high-level theory with production implementations, memory models, and actual company rubrics.",
  },
  {
    q: "Can I get this expensed with my company's learning & development budget?",
    a: "Yes! 100% of our enterprise members expense LetMeLearn under their annual professional education budget. Upon enrollment, you instantly receive a formal GST/VAT compliant invoice detailing curriculum scope for HR reimbursement.",
  },
  {
    q: "Is it truly a lifetime license or will I be charged renewals?",
    a: "Strictly lifetime. One single payment gives you permanent access to all current chapters, architecture blueprints, future track additions, and interactive labs. Zero subscriptions, zero hidden tiers.",
  },
  {
    q: "Does this cover coding or just high-level architecture?",
    a: "Both! You get comprehensive Low-Level Design (LLD) with complete class models, Java Spring Boot production code, Python AI PyTorch autograd implementations, and an integrated in-browser code compiler.",
  },
];

function Welcome() {
  return (
    <ClientOnly fallback={<WelcomeBody signedIn={false} />}>
      <WelcomeLive />
    </ClientOnly>
  );
}

function WelcomeLive() {
  const { user } = useCurrentUserState();
  return <WelcomeBody signedIn={user !== null} />;
}

function WelcomeBody({ signedIn }: { signedIn: boolean }) {
  const full = priceFor(null);
  const discounted = priceFor("LEARN50");

  const [heroTab, setHeroTab] = useState<"architecture" | "code" | "qa">("architecture");
  const [selectedPath, setSelectedPath] = useState("backend");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState("All");
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activePath = PATHS.find((p) => p.id === selectedPath) ?? PATHS[0];

  const filteredTracks = TRACKS.filter((t) => {
    if (selectedTrackFilter === "All") return true;
    return t.category === selectedTrackFilter;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText("LEARN50");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <main className="min-h-dvh bg-bg text-fg selection:bg-accent/20 selection:text-accent font-sans">
      {/* Sticky Discount Banner */}
      <div className="bg-gradient-to-r from-accent/20 via-surface to-accent/20 border-b border-border/80 px-4 py-2.5 text-center text-xs backdrop-blur-md">
        <span className="inline-flex items-center gap-1.5 font-medium text-fg">
          <Sparkles className="size-3.5 text-accent animate-pulse" />
          <span className="font-semibold text-accent">Launch Offer:</span> Get 50% lifetime discount with code{" "}
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 rounded bg-accent/20 px-2 py-0.5 font-mono font-bold text-accent hover:bg-accent/30 transition-colors"
            title="Click to copy promo code"
          >
            LEARN50
            <Copy className="size-2.5" />
          </button>{" "}
          {copiedCode ? <span className="text-ok font-semibold">✓ Copied!</span> : <span className="text-muted hidden sm:inline">(Click to copy)</span>}
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/70 bg-bg/85 px-6 py-4 backdrop-blur-xl sm:px-10">
        <Link to="/welcome" className="flex items-center gap-2.5 text-fg">
          <LogoMark className="size-7" />
          <span className="font-display text-xl font-bold tracking-tight">{APP_NAME}</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-accent border border-accent/30">
            STUDIO 2.0
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/pricing" className="px-3 py-1.5 text-xs sm:text-sm font-medium text-muted hover:text-fg transition-colors">
            Pricing &amp; Plans
          </Link>
          <Link to={signedIn ? "/" : "/login"}>
            <Button size="sm" className="font-medium">
              {signedIn ? "Open Studio" : "Sign In"}
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/80 px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
        <div className="lattice-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl space-y-12">
          {/* Hero Pitch */}
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              Production Engineering &amp; FAANG System Design
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.05] text-fg">
              Learn the architecture.
              <br />
              <span className="bg-gradient-to-r from-accent via-fg to-accent bg-clip-text text-transparent">
                Then master the interview.
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-muted max-w-2xl">
              From Java &amp; Spring Boot internals and CPython No-GIL systems to High-Level Microservices,
              Vector Databases, and the modern AI Forward Deployed Engineer (FDE) curriculum — taught with
              deep architecture blueprints and real FAANG company rubrics.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/pricing">
                <Button size="lg" className="shadow-lg shadow-accent/20 font-semibold">
                  Get Lifetime Access
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </Link>
              <Link to={signedIn ? "/hld" : "/login"}>
                <Button size="lg" variant="secondary" className="border-border">
                  {signedIn ? "Explore Curriculum" : "Test Sign-In"}
                </Button>
              </Link>
              <div className="text-xs text-muted pl-2">
                <span className="text-faint line-through">{formatPaise(full.totalPaise)}</span>{" "}
                <span className="font-bold text-ok text-sm">{formatPaise(discounted.totalPaise)}</span>{" "}
                (50% off with <code className="font-mono text-accent">LEARN50</code>)
              </div>
            </div>
          </div>

          {/* Interactive Hero Preview Playground */}
          <div className="rounded-3xl border border-border/80 bg-surface/50 p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-rose-500/80" />
                <span className="size-3 rounded-full bg-amber-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-muted">studio-preview.internal</span>
              </div>

              {/* Tab Selector */}
              <div className="inline-flex rounded-xl bg-inset p-1 border border-border/60">
                <button
                  onClick={() => setHeroTab("architecture")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    heroTab === "architecture" ? "bg-accent text-accent-fg shadow" : "text-muted hover:text-fg"
                  }`}
                >
                  <Layers className="size-3.5" />
                  Live ASCII Architecture
                </button>
                <button
                  onClick={() => setHeroTab("code")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    heroTab === "code" ? "bg-accent text-accent-fg shadow" : "text-muted hover:text-fg"
                  }`}
                >
                  <Code2 className="size-3.5" />
                  Production Code
                </button>
                <button
                  onClick={() => setHeroTab("qa")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    heroTab === "qa" ? "bg-accent text-accent-fg shadow" : "text-muted hover:text-fg"
                  }`}
                >
                  <Briefcase className="size-3.5" />
                  FAANG Interview Q&amp;A
                </button>
              </div>
            </div>

            {/* Playground Viewer */}
            <div className="rounded-2xl border border-border/80 bg-inset/90 p-4 sm:p-6 overflow-x-auto min-h-[220px]">
              <pre className="font-mono text-xs sm:text-sm leading-relaxed text-accent/90 whitespace-pre">
                {HERO_SNIPPETS[heroTab]}
              </pre>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/60">
            <div>
              <div className="font-display text-3xl font-bold font-mono text-accent">
                {javaConcepts.length + pythonConcepts.length + 80}+
              </div>
              <div className="text-xs text-muted mt-0.5">Chapters &amp; Step Guides</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold font-mono text-fg">
                {hldConcepts.length + lldConcepts.length + fdeConcepts.length}+
              </div>
              <div className="text-xs text-muted mt-0.5">Deep Architectural Concepts</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold font-mono text-accent">
                {examples.length}
              </div>
              <div className="text-xs text-muted mt-0.5">Worked System Blueprints</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold font-mono text-fg">
                {COMPANY_COUNT}
              </div>
              <div className="text-xs text-muted mt-0.5">FAANG &amp; Tech Interview Loops</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Path Finder / Role Customizer */}
      <section className="border-b border-border/80 bg-surface/20 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <span className="eyebrow text-accent">Tailored Preparation</span>
            <h2 className="font-display text-2xl sm:text-4xl font-semibold text-fg">
              Choose Your Engineering Career Track
            </h2>
            <p className="text-sm text-muted">
              Select your target role to inspect the exact progression roadmap and interview loops.
            </p>
          </div>

          {/* Path Buttons */}
          <div className="grid gap-3 sm:grid-cols-3">
            {PATHS.map((p) => {
              const active = p.id === selectedPath;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPath(p.id)}
                  className={`text-left p-5 rounded-2xl border transition-all ${
                    active
                      ? "border-accent bg-accent/10 shadow-lg ring-1 ring-accent"
                      : "border-border/70 bg-surface/50 hover:bg-surface hover:border-border-strong"
                  }`}
                >
                  <span className="text-[11px] font-mono text-accent block font-medium">{p.role}</span>
                  <h3 className="font-display text-base font-semibold text-fg mt-1">{p.title}</h3>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted font-mono">
                    <Zap className="size-3 text-accent" />
                    {p.studyTime}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Path Details Box */}
          <div className="rounded-3xl border border-border/80 bg-surface/40 p-6 sm:p-8 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <span className="eyebrow text-accent">Recommended Curriculum Sequence</span>
                <h3 className="font-display text-xl font-semibold text-fg mt-1">{activePath.title}</h3>
                <p className="text-xs text-muted mt-1">{activePath.highlight}</p>
              </div>
              <Link to={signedIn ? "/" : "/login"}>
                <Button size="sm" className="whitespace-nowrap">
                  Start This Track →
                </Button>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {activePath.sequence.map((step, idx) => (
                <div key={idx} className="rounded-xl border border-border/60 bg-inset/50 p-4 space-y-1">
                  <span className="text-[10px] font-mono text-accent font-bold uppercase">Step {idx + 1}</span>
                  <p className="text-xs font-semibold text-fg">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Curriculum Tracks Explorer */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-accent">Curriculum Library</span>
              <h2 className="font-display text-2xl sm:text-4xl font-semibold text-fg mt-1">
                Everything Inside the Studio
              </h2>
              <p className="text-sm text-muted mt-1 max-w-xl">
                Every track features comprehensive theory, runnable code snippets, advanced architecture blueprints, and real interview rounds.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-inset/60 border border-border/60">
              {["All", "AI & ML", "Distributed Systems", "Databases", "Backend", "Architecture", "Object Oriented"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTrackFilter(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedTrackFilter === cat ? "bg-accent text-accent-fg shadow" : "text-muted hover:text-fg"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Tracks Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTracks.map((t) => (
              <Link
                key={t.to}
                to={signedIn ? t.to : "/login"}
                className="group relative rounded-2xl border border-border/80 bg-surface/50 p-6 transition-all hover:border-accent hover:bg-surface hover:shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
                      {t.kicker}
                    </span>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono text-accent font-bold">
                      {t.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-fg group-hover:text-accent transition-colors">
                    {t.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] leading-relaxed text-muted">{t.body}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="font-mono text-muted">{t.stat}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-accent group-hover:translate-x-1 transition-transform">
                    {signedIn ? "Open Track" : "Preview Track"}
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className="border-t border-border/80 bg-surface/30 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="eyebrow text-accent">Honest Comparison</span>
            <h2 className="font-display text-2xl sm:text-4xl font-semibold text-fg">
              Why Engineers Choose LetMeLearn
            </h2>
            <p className="text-sm text-muted">
              Built specifically for modern senior and staff interview loops where generic diagrams are not enough.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 overflow-hidden bg-inset/40 shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface/90 border-b border-border/70 text-muted uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4 sm:p-5">Capability / Resource</th>
                  <th className="p-4 sm:p-5 text-accent font-bold">LetMeLearn</th>
                  <th className="p-4 sm:p-5 hidden sm:table-cell">Video Courses</th>
                  <th className="p-4 sm:p-5 hidden md:table-cell">LeetCode</th>
                  <th className="p-4 sm:p-5 hidden lg:table-cell">Standard Books</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {COMPARISON.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface/40 transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-fg">{row.feature}</td>
                    <td className="p-4 sm:p-5 font-bold text-ok flex items-center gap-1.5">
                      <Check className="size-4 text-ok" />
                      <span>Included</span>
                    </td>
                    <td className="p-4 sm:p-5 text-muted hidden sm:table-cell">
                      {typeof row.videos === "boolean" ? (row.videos ? "Yes" : "No") : row.videos}
                    </td>
                    <td className="p-4 sm:p-5 text-muted hidden md:table-cell">
                      {typeof row.leetcode === "boolean" ? (row.leetcode ? "Yes" : "No") : row.leetcode}
                    </td>
                    <td className="p-4 sm:p-5 text-muted hidden lg:table-cell">
                      {typeof row.books === "boolean" ? (row.books ? "Yes" : "No") : row.books}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-5 py-20 sm:px-8 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="eyebrow text-accent">Frequently Asked Questions</span>
          <h2 className="font-display text-2xl sm:text-4xl font-semibold text-fg">
            Everything You Need to Know
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-surface/40 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-display text-sm sm:text-base font-semibold text-fg hover:text-accent transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-muted border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-5 py-20 sm:px-8 border-t border-border/80 bg-surface/20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-accent/40 bg-gradient-to-br from-surface via-surface/60 to-surface/30 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 size-60 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-xs font-semibold text-accent border border-accent/30 inline-block">
              Single Payment · Lifetime Access
            </span>

            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-fg">
              Join Engineers Preparing for FAANG &amp; Unicorns
            </h2>

            <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
              Unlock the complete studio: 8 tracks, 24 blueprints, 80 AI FDE concepts, 34 company interview loops, and interactive labs.
            </p>

            <div className="pt-2 flex items-baseline justify-center gap-3">
              <span className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ok">
                {formatPaise(discounted.totalPaise)}
              </span>
              <span className="font-display text-xl sm:text-2xl text-faint line-through">
                {formatPaise(full.totalPaise)}
              </span>
            </div>

            <p className="text-xs text-muted">
              Use code <code className="font-mono text-accent font-bold">LEARN50</code> at checkout for 50% discount.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link to="/pricing">
                <Button size="lg" className="shadow-lg shadow-accent/20 font-semibold">
                  Get Lifetime Access
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </Link>
              <Link to={signedIn ? "/" : "/login"}>
                <Button size="lg" variant="secondary">
                  {signedIn ? "Open Studio" : "Try Free Sign In"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 px-6 py-8 text-center text-xs text-muted space-y-2">
        <p className="font-display font-medium text-fg">{APP_NAME} — System Design, Taught Like the Interview.</p>
        <p className="text-faint">
          Zero recurring subscriptions. All trademarks, company names, and logos belong to their respective owners.
        </p>
      </footer>
    </main>
  );
}
