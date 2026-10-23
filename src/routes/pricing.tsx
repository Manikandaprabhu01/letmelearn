import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Tag,
  X,
  Sparkles,
  ShieldCheck,
  Copy,
  Building2,
  Users,
  Briefcase,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  FileText,
  Zap,
  Code2,
  Database,
  Layers,
  Cpu,
  Terminal,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { DisplayControl } from "@/components/layout/DisplayControl";
import { LogoMark } from "@/components/layout/Logo";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { formatPaise, priceFor } from "@/lib/billing/pricing";
import { useCheckout } from "@/lib/billing/use-checkout";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/data/nav";
import { COMPANY_COUNT, LIBRARY_ANSWER_COUNT, QUESTION_COUNT } from "@/data/interview/meta";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const MODULES_DETAILED = [
  {
    icon: Sparkles,
    title: "AI Forward Deployed Engineer (FDE) Roadmap",
    stat: "80+ Concepts · 8 Stages",
    details: [
      "Prompt Engineering & Pydantic Structured Outputs",
      "RAG Triad (Context Precision, Recall, Faithfulness) & Hybrid Search",
      "Autonomous Agent Swarms with ReAct Loops & Supervisor Pattern",
      "vLLM Serving with PagedAttention & Chunked Prefill KV-Cache",
      "Parameter-Efficient Fine-Tuning (LoRA & QLoRA) and Model Quantization",
      "Enterprise Eval Harnesses, Red-Teaming, and NeMo Guardrails",
    ],
  },
  {
    icon: Database,
    title: "SQL & NoSQL Distributed Storage Internals",
    stat: "30+ Concepts · 4 Architecture Blueprints",
    details: [
      "B+ Tree page splits & fill-factor vs LSM-Tree MemTable/SSTable compaction",
      "Distributed 2PC transactions with Raft consensus quorums",
      "MVCC Snapshot Isolation: PostgreSQL xmin/xmax tuple visibility headers",
      "Hierarchical Navigable Small World (HNSW) & IVFFlat vector indexing",
      "Single-Table DynamoDB schema design with sparse GSIs",
    ],
  },
  {
    icon: Layers,
    title: "HLD & Microservices Masterclass",
    stat: "40 Concepts · 4 Blueprints · 10M Scale",
    details: [
      "1-to-10M User scaling evolution: LB, Read-Replicas, Multi-Region Active-Active",
      "Orchestrated vs Choreographed Saga pattern with compensating transactions",
      "Cache stampede mitigation using Probabilistic Early Refresh (XFetch)",
      "Apache Kafka Exactly-Once Semantics (EOS) with Transactional Coordinator",
    ],
  },
  {
    icon: Code2,
    title: "LLD & Machine Coding Masterclass",
    stat: "19 Concepts · UML Blueprints · Timed Rounds",
    details: [
      "Clean architecture & SOLID principles applied to real microservices",
      "Thread-safe concurrent LRU Cache with lock striping and doubly-linked list",
      "Extensible distributed Rate Limiter (Token Bucket & Leaky Bucket)",
      "90-minute timed machine-coding rounds for Swiggy and Uber",
    ],
  },
  {
    icon: Cpu,
    title: "Java & Spring Boot Production Masterclass",
    stat: "49 Chapters · Java 8 to 26 · JVM Deep Dive",
    details: [
      "JVM Memory Layout: Eden, Survivor, Tenured, Metaspace",
      "Garbage Collectors: G1 GC region allocation and ZGC colored pointers",
      "Spring Boot DispatcherServlet request lifecycle and `@Transactional` CGLIB proxy pitfalls",
      "Virtual Threads (Project Loom) carrier thread pinning traps",
      "Goldman Sachs low-latency trading engine with off-heap ring buffers",
    ],
  },
  {
    icon: Terminal,
    title: "Python End-to-End for AI & Systems",
    stat: "20 Chapters · No-GIL 3.13 · PyTorch",
    details: [
      "CPython memory model, reference counting, and cyclic garbage collection",
      "PEP 703 Free-Threaded No-GIL internals & mimalloc thread-safe pools in Python 3.13",
      "PyTorch dynamic autograd computation graph construction & reverse DAG traversal",
      "OpenAI asynchronous streaming token gateway with backpressure handling",
    ],
  },
  {
    icon: Briefcase,
    title: "System Design Examples & Blueprints",
    stat: "24 Worked Production Cases · 5 Blueprints",
    details: [
      "Uber / Lyft Real-Time Geospatial Dispatch with H3 hexagonal indexing",
      "Netflix Global Video Transcoding & Adaptive Bitrate Streaming (ABR)",
      "WhatsApp Billion-Connection Real-Time Messaging on Erlang BEAM",
      "Distributed Rate Limiter with Envoy Edge & Redis atomic Lua scripts",
      "Distributed Web Crawler & URL Frontier at Petabyte Scale",
    ],
  },
  {
    icon: Award,
    title: "FAANG Interview Prep Console",
    stat: `${COMPANY_COUNT} Companies · ${QUESTION_COUNT} Questions`,
    details: [
      "Targeted question banks for Meta, Google, Amazon, Palantir, OpenAI, Stripe, Netflix",
      "Clear grading rubrics: What passes (Strong Hire) vs What fails (No Hire)",
      "Comprehensive 4-step interview structure and back-of-the-envelope estimation rules",
    ],
  },
];

const EXPENSE_EMAIL_TEMPLATE = `Subject: Professional Development Request: LetMeLearn System Design & AI Studio Lifetime Access

Hi [Manager Name],

I would like to request reimbursement for a one-time lifetime license to LetMeLearn (https://letmelearn.dev) using our team's annual learning & development budget.

LetMeLearn is an advanced engineering platform covering:
1. High-Level Distributed Systems & Microservices (Sagas, Kafka Exactly-Once, Caching)
2. Low-Level Design & Concurrency (Thread-safe data structures, design patterns)
3. AI Forward Deployed Engineering (vLLM, RAG Triads, Autonomous Agent Swarms)
4. Production Performance & Reliability (JVM ZGC, Python 3.13 No-GIL, SQL/NoSQL Internals)

Cost:
• Standard One-Time License: ₹4,999 (~$60 USD) with current discount code.
• Zero recurring subscriptions or annual renewal fees.

This course will directly benefit our upcoming architectural design reviews, scalability initiatives, and distributed system reliability. A full GST/tax receipt will be provided upon purchase.

Please let me know if this can be approved.

Best regards,
[Your Name]
[Your Role / Team]`;

const PRICING_FAQS = [
  {
    q: "Is this truly a one-time payment for lifetime access?",
    a: "Yes, 100%. You pay once and receive permanent lifetime access to all 8 current tracks, future chapters, architecture blueprints, and labs. We do not charge subscriptions, monthly renewals, or upgrade fees.",
  },
  {
    q: "How does the corporate reimbursement / employer expense process work?",
    a: "After purchasing, you receive an automated Razorpay invoice with GST/VAT breakdown and course description. You can submit this directly to your employer's Learning & Development (L&D) portal. Use our 1-click email template above to request approval from your manager.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support all major payment options via Razorpay: Credit Cards (Visa, MasterCard, Amex), Debit Cards, UPI (Google Pay, PhonePe, Paytm), NetBanking, and International Cards.",
  },
  {
    q: "What is your refund / satisfaction guarantee policy?",
    a: "We offer a 30-day no-questions-asked money-back guarantee. If you feel the depth, architecture blueprints, or interview banks did not meet your expectations, simply reach out to support for a prompt refund.",
  },
  {
    q: "Can I upgrade to a Team Pack later?",
    a: "Yes. If your engineering team or startup wants to purchase 5 or more licenses, contact our team and we will credit your individual purchase towards the team pack.",
  },
];

function PricingPage() {
  const [code, setCode] = useState("LEARN50");
  const [applied, setApplied] = useState<string | null>("LEARN50");
  const [activePlanTab, setActivePlanTab] = useState<"individual" | "team" | "expense">("individual");
  const [copiedExpense, setCopiedExpense] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const price = priceFor(applied);
  const { state, loading, buy, busy, error } = useCheckout();

  const typedPreview = priceFor(code);
  const codeIsValid = typedPreview.promo !== null;

  const handleCopyExpenseTemplate = () => {
    navigator.clipboard.writeText(EXPENSE_EMAIL_TEMPLATE);
    setCopiedExpense(true);
    setTimeout(() => setCopiedExpense(false), 2500);
  };

  const handleApplyPromo = (promoCode: string) => {
    setCode(promoCode);
    setApplied(promoCode);
  };

  const user = useCurrentUser();

  return (
    <div className="min-h-dvh bg-bg text-fg selection:bg-accent/20 selection:text-accent font-sans">
      {/* Standalone Distraction-Free Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/70 bg-bg/85 px-4 sm:px-8 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to={user ? "/" : "/welcome"} className="flex items-center gap-2.5 text-fg">
            <LogoMark className="size-6" />
            <span className="font-display text-lg font-bold tracking-tight">{APP_NAME}</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-accent border border-accent/30">
              STUDIO 2.0
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={user ? "/" : "/welcome"}
            className="text-xs sm:text-sm font-medium text-muted hover:text-fg transition-colors"
          >
            ← {user ? "Back to Studio" : "Back to Home"}
          </Link>
          <DisplayControl />
          <Link to={user ? "/" : "/login"}>
            <Button size="sm" className="font-medium text-xs">
              {user ? "Open Studio" : "Sign In"}
            </Button>
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent">
          <Sparkles className="size-3.5 animate-pulse" />
          Single Payment · Lifetime Access · Zero Subscriptions
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-fg">
          Invest Once in Your Engineering Career
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-muted max-w-2xl mx-auto">
          One unlock for the entire LetMeLearn Studio: 8 tracks, 24 system blueprints, 80 AI FDE concepts,
          34 FAANG company interview loops, and interactive labs.
        </p>

        {/* Plan Mode Selector Tabs */}
        <div className="inline-flex rounded-xl bg-inset p-1 border border-border/70 backdrop-blur-md pt-2">
          <button
            onClick={() => setActivePlanTab("individual")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activePlanTab === "individual"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg"
            }`}
          >
            Individual Lifetime Pro
          </button>
          <button
            onClick={() => setActivePlanTab("team")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activePlanTab === "team"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg"
            }`}
          >
            Engineering Team (5-Seat Pack)
          </button>
          <button
            onClick={() => setActivePlanTab("expense")}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activePlanTab === "expense"
                ? "bg-accent text-accent-fg shadow-lg font-semibold"
                : "text-muted hover:text-fg"
            }`}
          >
            Expense with Employer
          </button>
        </div>
      </div>

      {/* TAB 1: INDIVIDUAL LIFETIME PRO */}
      {activePlanTab === "individual" && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] items-start animate-fade-in">
          {/* Left Column: What's Included Detailed Breakdown */}
          <section className="space-y-6">
            <div className="rounded-3xl border border-border/80 bg-surface/40 p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-fg">Comprehensive Studio Access</h2>
                  <p className="text-xs text-muted mt-0.5">Every curriculum chapter, architecture blueprint, and question bank</p>
                </div>
                <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-xs text-accent font-bold">
                  All 8 Tracks
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {MODULES_DETAILED.map((mod, idx) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/60 bg-inset/40 p-5 space-y-3 hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-semibold text-fg leading-tight">{mod.title}</h3>
                          <span className="text-[11px] font-mono text-muted">{mod.stat}</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 pt-1">
                        {mod.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-[11.5px] text-muted flex items-start gap-2 leading-relaxed">
                            <span className="text-accent mt-0.5">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Value Comparison Card */}
            <div className="rounded-3xl border border-border/70 bg-inset/40 p-6 sm:p-8 space-y-4">
              <h3 className="font-display text-base font-semibold text-fg">What would this cost elsewhere?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-border/50 bg-surface/50 p-3">
                  <div className="text-muted font-mono">FAANG Bootcamp</div>
                  <div className="text-sm font-bold text-fg line-through mt-1">₹1,50,000+</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-surface/50 p-3">
                  <div className="text-muted font-mono">Annual Subscriptions</div>
                  <div className="text-sm font-bold text-fg line-through mt-1">₹40,000 / yr</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-surface/50 p-3">
                  <div className="text-muted font-mono">1-on-1 Mock Coaching</div>
                  <div className="text-sm font-bold text-fg line-through mt-1">₹25,000 / hr</div>
                </div>
                <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
                  <div className="text-accent font-mono font-bold">LetMeLearn Lifetime</div>
                  <div className="text-sm font-bold text-ok mt-1">{formatPaise(price.totalPaise)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Checkout Card */}
          <aside className="sticky top-24 rounded-3xl border border-accent/40 bg-gradient-to-b from-surface via-surface/80 to-surface/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent/20 px-3 py-1 font-mono text-xs font-bold text-accent">
                  LIFETIME UNLOCK
                </span>
                <span className="text-xs text-ok font-medium flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> 30-Day Guarantee
                </span>
              </div>

              {/* Price display */}
              <div className="pt-2">
                <div className="flex items-baseline gap-3">
                  <span className={cn("font-display text-5xl font-bold tracking-tight", price.promo && "text-ok")}>
                    {formatPaise(price.totalPaise)}
                  </span>
                  {price.promo && (
                    <span className="font-display text-2xl text-faint line-through">
                      {formatPaise(price.listPaise)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-1">Single payment · Permanent lifetime access</p>
              </div>
            </div>

            {/* Quick 1-Click Promo Pill */}
            {!price.promo && (
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-accent block">50% Off Launch Voucher</span>
                  <span className="text-[11px] text-muted">Click to apply discount</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyPromo("LEARN50")}
                  className="rounded-lg bg-accent px-3 py-1 text-xs font-mono font-bold text-accent-fg hover:opacity-90 transition-opacity"
                >
                  LEARN50
                </button>
              </div>
            )}

            {/* Promo Code Input / Applied Badge */}
            {price.promo ? (
              <div className="rounded-xl border border-ok/30 bg-ok/10 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-ok">
                  <Tag className="size-4" />
                  <span>
                    <strong>{price.promo.code}</strong> applied — Saved {formatPaise(price.discountPaise)}!
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Remove promo code"
                  onClick={() => {
                    setApplied(null);
                    setCode("");
                  }}
                  className="text-faint hover:text-fg transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setApplied(code);
                }}
                className="space-y-2"
              >
                <label htmlFor="promo-input" className="eyebrow text-muted text-[10px]">
                  Discount Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ENTER CODE"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-inset px-3.5 font-mono text-xs uppercase text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <Button type="submit" variant="secondary" size="sm" disabled={!code.trim()}>
                    Apply
                  </Button>
                </div>
                {applied && price.invalidCode ? (
                  <p className="text-xs text-bad">“{price.invalidCode}” is not a valid discount code.</p>
                ) : codeIsValid ? (
                  <p className="text-xs text-ok">
                    {typedPreview.promo?.code} saves {formatPaise(typedPreview.discountPaise)} — click Apply.
                  </p>
                ) : null}
              </form>
            )}

            {/* Checkout Action Button */}
            <div className="border-t border-border/70 pt-5 space-y-3">
              <ClientOnly fallback={<div className="h-12" aria-hidden />}>
                <SignedOut>
                  <Link to="/login">
                    <Button size="lg" className="w-full font-semibold shadow-lg shadow-accent/20">
                      Sign In to Unlock Studio
                      <ArrowRight className="ml-1.5 size-4" />
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-muted">
                    Sign in with test or personal account to proceed with checkout.
                  </p>
                </SignedOut>

                <SignedIn>
                  {state.entitled ? (
                    <div className="rounded-2xl border border-ok/30 bg-ok/10 p-4 text-center space-y-2">
                      <p className="text-sm font-semibold text-ok">✓ You have active lifetime access!</p>
                      <Link to="/" className="inline-flex text-xs text-accent hover:underline font-medium">
                        Open Studio Dashboard →
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="w-full font-semibold shadow-lg shadow-accent/20"
                        disabled={busy || loading || !state.checkoutConfigured}
                        onClick={() => buy(price.promo?.code ?? null)}
                      >
                        {busy ? "Opening Razorpay Gateway…" : `Pay ${formatPaise(price.totalPaise)} Now`}
                      </Button>
                      {!loading && !state.checkoutConfigured ? (
                        <p className="text-xs leading-5 text-warn text-center">
                          Razorpay keys not configured on server. Set <code>RAZORPAY_KEY_ID</code> to enable live payment processing.
                        </p>
                      ) : null}
                      {error ? <p className="text-xs text-bad text-center">{error}</p> : null}
                    </>
                  )}
                </SignedIn>
              </ClientOnly>

              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-muted font-mono">
                <span>🔒 256-Bit SSL</span>
                <span>•</span>
                <span>⚡ Instant Access</span>
                <span>•</span>
                <span>📄 GST Invoice</span>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="rounded-2xl border border-border/50 bg-inset/40 p-4 space-y-2">
              <div className="flex items-center gap-1 text-amber-400 text-xs">
                {"★".repeat(5)}
              </div>
              <p className="text-xs text-fg/80 italic leading-relaxed">
                “The depth of the architecture diagrams and real company questions helped me crack my Meta E5 System Design round with a Strong Hire.”
              </p>
              <div className="text-[11px] text-muted font-mono">— Senior SDE at Tier-1 Tech Firm</div>
            </div>
          </aside>
        </div>
      )}

      {/* TAB 2: TEAM / SQUAD PACK */}
      {activePlanTab === "team" && (
        <div className="rounded-3xl border border-border/80 bg-surface/40 p-8 sm:p-12 backdrop-blur-xl max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <span className="eyebrow text-accent">Engineering Organizations</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg mt-1">
                Engineering Squad Pack (5 Seats)
              </h2>
              <p className="text-sm text-muted mt-1">
                Level up your backend, AI, and systems engineering team with shared access and centralized billing.
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-bold text-ok">₹18,999</div>
              <div className="text-xs text-muted">60% Squad Discount</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-inset/40 p-5 space-y-2">
              <Users className="size-5 text-accent" />
              <h3 className="text-sm font-semibold text-fg">5 Lifetime Accounts</h3>
              <p className="text-xs text-muted leading-relaxed">
                Individual logins and progress tracking for 5 engineers on your engineering team.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-inset/40 p-5 space-y-2">
              <Building2 className="size-5 text-accent" />
              <h3 className="text-sm font-semibold text-fg">Centralized GST Invoice</h3>
              <p className="text-xs text-muted leading-relaxed">
                Single corporate tax invoice with company legal name and GST number for clean accounting.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-inset/40 p-5 space-y-2">
              <Zap className="size-5 text-accent" />
              <h3 className="text-sm font-semibold text-fg">Priority Content Updates</h3>
              <p className="text-xs text-muted leading-relaxed">
                Early access to newly released architecture tracks, benchmarks, and interactive labs.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-fg">Ready to purchase for your engineering team?</h4>
              <p className="text-xs text-muted mt-0.5">
                Contact our enterprise desk for direct purchase orders or custom seat allocations.
              </p>
            </div>
            <a
              href="mailto:support@letmelearn.dev?subject=Team%20Pack%20Inquiry%20(5%20Seats)"
              className="inline-flex"
            >
              <Button size="sm" className="whitespace-nowrap font-medium">
                Request Team Invoice →
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYER EXPENSE ASSISTANT */}
      {activePlanTab === "expense" && (
        <div className="rounded-3xl border border-border/80 bg-surface/40 p-8 sm:p-12 backdrop-blur-xl max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="space-y-2 border-b border-border/60 pb-6">
            <span className="eyebrow text-accent">100% Tax-Deductible Education</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg">
              Expense LetMeLearn with Your Learning Budget
            </h2>
            <p className="text-sm text-muted">
              Most technology employers offer annual professional education stipends ($500 – $2,000/year). LetMeLearn qualifies under technical training and distributed systems education.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-accent">Ready-to-Send Email Template for Your Manager</span>
              <button
                onClick={handleCopyExpenseTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
              >
                <Copy className="size-3.5" />
                {copiedExpense ? "✓ Copied to Clipboard!" : "Copy Email Template"}
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-inset/90 p-5 sm:p-6 overflow-x-auto">
              <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-fg/90 whitespace-pre font-sans">
                {EXPENSE_EMAIL_TEMPLATE}
              </pre>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="rounded-xl border border-border/60 bg-inset/50 p-4 space-y-1">
              <FileText className="size-4 text-accent" />
              <div className="text-xs font-semibold text-fg">Official Tax Receipt</div>
              <div className="text-[11px] text-muted">Delivered instantly to your email with company details</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-inset/50 p-4 space-y-1">
              <Briefcase className="size-4 text-accent" />
              <div className="text-xs font-semibold text-fg">L&amp;D Category</div>
              <div className="text-[11px] text-muted">Classified as Professional Software Engineering Training</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-inset/50 p-4 space-y-1">
              <ShieldCheck className="size-4 text-accent" />
              <div className="text-xs font-semibold text-fg">Full Money-Back Guarantee</div>
              <div className="text-[11px] text-muted">30 days to verify the curriculum quality risk-free</div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive FAQ Accordion */}
      <section className="max-w-4xl mx-auto space-y-8 pt-8">
        <div className="text-center space-y-2">
          <span className="eyebrow text-accent">Billing &amp; Access Details</span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-fg">
            Frequently Asked Pricing Questions
          </h2>
        </div>

        <div className="space-y-3">
          {PRICING_FAQS.map((faq, idx) => {
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

      {/* Footer Trust Bar */}
      <div className="border-t border-border/80 pt-8 pb-4 text-center text-xs text-muted space-y-2">
        <p>🔒 256-Bit SSL Encrypted Payment Processing Powered by Razorpay</p>
        <p className="text-faint">
          Need help or have questions before purchasing? Reach out anytime at{" "}
          <a href="mailto:support@letmelearn.dev" className="text-accent hover:underline">
            support@letmelearn.dev
          </a>
        </p>
      </div>
    </main>
  </div>
);
}
