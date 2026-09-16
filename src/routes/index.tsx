import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import { hldConcepts } from "@/data/hld";
import { COMPANY_COUNT, COMPANY_INDEX } from "@/data/interview/meta";
import { javaConcepts } from "@/data/java";
import { lldConcepts } from "@/data/lld";
import { playgrounds } from "@/data/playgrounds";
import { pythonConcepts } from "@/data/python";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/")({ component: Home });

const STEPS = [
  {
    n: "01",
    title: "Scope",
    body: "Users, features, QPS, SLAs. Write the numbers down. Ask what is out of scope.",
  },
  {
    n: "02",
    title: "Sketch",
    body: "Boxes, APIs, stores. Get buy-in before you deep-dive the matching engine.",
  },
  {
    n: "03",
    title: "Deep dive",
    body: "The two hard parts: fan-out, the hash ring, the ledger, the 429 path.",
  },
  { n: "04", title: "Wrap", body: "Bottlenecks, failure modes, what another hour would buy." },
];

/**
 * Every id a "Mark studied" button can write, across every track, the labs and
 * the interview prep console.
 *
 * The stat counts against this set rather than the raw store: the store keeps
 * whatever was ever marked, including pages since renamed or removed, and the
 * old total left out the FDE and Java tracks entirely — so marking those made
 * the count drift past the real denominator.
 */
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

function Home() {
  const done = useProgress(
    (s) => Object.entries(s.done).filter(([id, value]) => value && STUDY_IDS.has(id)).length,
  );
  const total = STUDY_IDS.size;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="lattice-grid pointer-events-none absolute inset-0" />
        <p className="relative eyebrow">System design studio</p>
        <h1 className="relative mt-4 max-w-2xl font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
          Learn the map, then run the labs.
        </h1>
        <p className="relative mt-5 max-w-xl text-[16px] leading-7 text-muted">
          Java &amp; Spring Boot, Python end to end for AI, LLD, HLD with microservices, every
          worked example from Alex Xu&apos;s System Design Interview volumes, and an AI Forward
          Deployed Engineer roadmap — plus interactive labs.
        </p>
        <div className="relative mt-8 flex flex-wrap gap-6 text-sm">
          <Stat n={javaConcepts.length} label="Java chapters" />
          <Stat n={pythonConcepts.length} label="Python chapters" />
          <Stat n={lldConcepts.length} label="LLD concepts" />
          <Stat n={hldConcepts.length} label="HLD concepts" />
          <Stat n={examples.length} label="Worked examples" />
          <Stat n={fdeConcepts.length} label="FDE steps" />
          <Stat n={playgrounds.length} label="Labs" />
          <Stat n={COMPANY_COUNT} label="Interview banks" />
          <Stat n={done} label={`Studied of ${total}`} />
        </div>
      </section>

      {/* One door per track, in menu order. Six keeps the grid even at 2 and 3
          columns — an odd count leaves a bare cell showing the border colour. Labs
          has its own section further down. */}
      <section className="grid gap-px border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        <Door
          to="/java"
          kicker="Menu"
          title="Java & Spring Boot"
          body="Forty-nine chapters: the language core, Spring Boot internals, OOP and collections in depth, and every Java release from 8 to 26."
        />
        <Door
          to="/python"
          kicker="Menu"
          title="Python End-to-End for AI"
          body="Twenty chapters from Python basics to NumPy, PyTorch, LLM APIs, RAG, agents and a deployed FastAPI service."
        />
        <Door
          to="/lld"
          kicker="Menu"
          title="LLD Concepts"
          body="SOLID, strategy, LRU, parking lot, thread-safety. Class design that survives a whiteboard."
        />
        <Door
          to="/hld"
          kicker="Menu"
          title="HLD & Microservices"
          body="Caches, CAP, sharding and queues, then sagas, service meshes, Kubernetes and safe deployments."
        />
        <Door
          to="/examples"
          kicker="Menu"
          title="System Design Examples"
          body="Rate limiter through stock exchange, then Instagram, Uber, Docs, Zoom — Volume 1, Volume 2, and the awesome list."
        />
        <Door
          to="/fde"
          kicker="Menu"
          title="AI FDE Roadmap"
          body="Eight steps from software foundations to the customer-facing layer — RAG, agents, MCP, evals and guardrails."
        />
      </section>

      <section className="border-b border-border px-5 py-10 sm:px-8 lg:px-12">
        <p className="eyebrow">Interview prep</p>
        <h2 className="mt-2 max-w-2xl font-display text-2xl font-medium tracking-tight">
          Know the loop before you walk in
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Question banks and answer sheets for {COMPANY_COUNT} companies — Google to Goldman Sachs,
          Flipkart to Razorpay — with each loop&apos;s rounds, the level ladder, and worked answers
          filtered from SDE to Principal.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            to="/interview-prep"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong"
          >
            Open the console <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/interview-prep/freshworks-lead"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong"
          >
            Freshworks Lead SE deep dive <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="border-b border-border px-5 py-10 sm:px-8 lg:px-12">
        <p className="eyebrow">Further reading</p>
        <h2 className="mt-2 max-w-2xl font-display text-2xl font-medium tracking-tight">
          The public awesome list, mapped to the library
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          ashishps1/awesome-system-design-resources — Easy / Medium / Hard prompts, the
          Dynamo-to-Chubby paper stack, and the channels people actually watch. Unique designs
          (Instagram, Uber, Docs, Zoom, locks) are original LetMeLearn notes. The rest map onto
          Volume 1, Volume 2, or a lab.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            to="/examples"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong"
          >
            Worked problems <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/resources"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-2 hover:border-border-strong"
          >
            Full list + papers <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 lg:px-12">
        <h2 className="font-display text-2xl font-medium tracking-tight">
          The four-step interview
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Alex Xu Volume 1, chapter 3. Every example page in LetMeLearn is written in this order so
          the muscle memory transfers.
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-lg border border-border bg-surface p-4">
              <div className="font-mono text-xs text-accent">{s.n}</div>
              <div className="mt-2 font-medium">{s.title}</div>
              <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border px-5 py-12 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">Labs</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Fire a burst at a token bucket, trip a circuit breaker, run a saga, roll out a canary,
              and tune RAG retrieval — break things on purpose and watch what happens.
            </p>
          </div>
          <Link
            to="/playgrounds"
            className="hidden items-center gap-1 text-sm text-accent hover:underline sm:flex"
          >
            All labs <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {playgrounds.map((p) => (
            <Link
              key={p.slug}
              to="/playgrounds/$slug"
              params={{ slug: p.slug }}
              className="rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
            >
              <div className="eyebrow">{p.tags.join(" · ")}</div>
              <div className="mt-2 font-medium">{p.title}</div>
              <p className="mt-1 text-sm text-muted">{p.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl tabular-nums">{n}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Door({
  to,
  kicker,
  title,
  body,
}: {
  to: string;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="block bg-bg p-6 hover:bg-surface sm:p-8">
      <div className="eyebrow">{kicker}</div>
      <h2 className="mt-3 font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm text-fg">
        Open <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
