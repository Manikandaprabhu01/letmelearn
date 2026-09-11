import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { LogoMark } from "@/components/layout/Logo";
import { APP_NAME } from "@/data/nav";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatPaise, priceFor } from "@/lib/billing/pricing";

export const Route = createFileRoute("/welcome")({ component: Welcome });

const TRACKS = [
  {
    kicker: "System design",
    title: "HLD & LLD concepts",
    body: "45 concepts with worked numbers, failure tables and interview follow-ups — from load balancing and CAP to SOLID and concurrency.",
    to: "/hld" as const,
    stat: "45 concepts",
  },
  {
    kicker: "Worked examples",
    title: "41 design examples",
    body: "Every Alex Xu example rewritten to chapter depth: clarifying questions, back-of-envelope maths, architecture boards and model answers.",
    to: "/examples" as const,
    stat: "41 examples",
  },
  {
    kicker: "AI engineering",
    title: "AI FDE Roadmap",
    body: "Eight steps from software foundations to the customer-facing layer — RAG, agents, MCP, evals, guardrails and enterprise integration.",
    to: "/fde" as const,
    stat: "80 concepts",
  },
  {
    kicker: "Backend",
    title: "Java & Spring Boot",
    body: "Twenty chapters aimed at the mistakes that cause production incidents — the proxy model, N+1, OOMKilled, prompt-to-SQL injection.",
    to: "/java" as const,
    stat: "20 chapters",
  },
];

const PROOF = [
  "Written for the interview, not the textbook",
  "Every claim carries the number behind it",
  "Honest trade-offs — what each choice costs",
  "Interactive labs, not just diagrams",
];

function Welcome() {
  // The signed-out page is what the server renders and what the first client
  // paint repeats; `WelcomeLive` swaps in the signed-in wording after hydration.
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

  return (
    <main className="min-h-dvh">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/welcome" className="flex items-center gap-2.5 text-fg">
          <LogoMark className="size-7" />
          <span className="font-display text-xl tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/pricing" className="px-3 py-2 text-sm text-muted hover:text-fg">
            Pricing
          </Link>
          <Link to={signedIn ? "/" : "/login"}>
            <Button size="sm">{signedIn ? "Open the studio" : "Sign in"}</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border px-6 py-20 sm:px-10 sm:py-28">
        {/* The grid is an overlay, never a class on the section: `.lattice-grid`
            carries a mask-image, which would fade out the hero copy with it. */}
        <div className="lattice-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
            System design studio
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
            Learn the map,
            <br />
            then run the labs.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-8 text-muted">
            HLD and LLD concepts, every worked example from Alex Xu&rsquo;s System Design Interview
            volumes, an AI Forward Deployed Engineer roadmap and a Java &amp; Spring Boot track —
            written the way the interview actually goes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/pricing">
              <Button size="lg">
                Get lifetime access
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </Link>
            <Link to={signedIn ? "/hld" : "/login"}>
              <Button size="lg" variant="secondary">
                {signedIn ? "Browse the concepts" : "Sign in"}
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted">
            <span className="text-faint line-through">{formatPaise(full.totalPaise)}</span>{" "}
            <span className="font-medium text-ok">{formatPaise(discounted.totalPaise)}</span> with
            code{" "}
            <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs text-fg">
              LEARN50
            </code>
          </p>
        </div>
      </section>

      {/* Tracks */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Four tracks</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-muted">
            Each page ends where the next begins — concepts link to the examples that use them, and
            examples link to the labs that let you try them.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {TRACKS.map((t) => (
              <Link
                key={t.to}
                // Signed out, the studio guard would send this straight back to
                // /welcome — so send them where they can actually get in.
                to={signedIn ? t.to : "/login"}
                className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-strong"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                    {t.kicker}
                  </span>
                  <span className="font-mono text-xs text-faint">{t.stat}</span>
                </div>
                <h3 className="mt-3 font-display text-xl tracking-tight">{t.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-muted">{t.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
                  {signedIn ? "Open" : "Sign in to open"}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-border bg-inset px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            Written to be used under pressure
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {PROOF.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-7 text-muted">
                <Check className="mt-1.5 size-4 shrink-0 text-ok" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-10 text-center">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
            One payment. Everything, for good.
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-muted">
            No subscription, no tiers — including everything added later.
          </p>
          <div className="mt-6 flex items-baseline justify-center gap-3">
            <span className="font-display text-4xl tracking-tight text-ok">
              {formatPaise(discounted.totalPaise)}
            </span>
            <span className="font-display text-xl text-faint line-through">
              {formatPaise(full.totalPaise)}
            </span>
          </div>
          <Link to="/pricing" className="mt-7 inline-flex">
            <Button size="lg">
              Apply LEARN50 and continue
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-faint sm:px-10">
        {APP_NAME} — system design, taught like the interview.
      </footer>
    </main>
  );
}
