import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { formatPaise, priceFor } from "@/lib/billing/pricing";
import { useCheckout } from "@/lib/billing/use-checkout";
import { cn } from "@/lib/utils";
import { COMPANY_COUNT, LIBRARY_ANSWER_COUNT, QUESTION_COUNT } from "@/data/interview/meta";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

const INCLUDED = [
  "Java & Spring Boot — 49 chapters, from basics to Spring Boot internals, collections and Java 8-26",
  "Python End-to-End for AI — 20 chapters from basics to RAG, agents and FastAPI",
  "19 LLD concepts — SOLID, patterns, concurrency, machine coding",
  "40 HLD concepts — including 14 on microservices: sagas, service mesh, Kubernetes",
  "41 system design examples rewritten to chapter depth",
  "AI FDE Roadmap — 8 steps, 80 concepts, 130+ references",
  `Interview Prep Console — ${COMPANY_COUNT} companies, ${QUESTION_COUNT} questions, ${LIBRARY_ANSWER_COUNT} worked answers`,
  "16 interactive labs — from rate limiters to sagas, canaries and RAG retrieval",
  "Full-text search across everything",
  "Lifetime access — one payment, no renewal",
];

function PricingPage() {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  const price = priceFor(applied);
  const { state, loading, buy, busy, error } = useCheckout();

  const typedPreview = priceFor(code);
  const codeIsValid = typedPreview.promo !== null;

  return (
    <main className="px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          One payment. Everything, for good.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
          No subscription and no tiers — a single lifetime unlock for the whole library, including
          everything added later.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* What you get */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-display text-xl tracking-tight">What is included</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-2.5 text-[14px] leading-6 text-muted">
                  <Check className="mt-1 size-4 shrink-0 text-ok" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* The card */}
          <aside className="h-fit rounded-xl border border-border bg-surface p-6">
            <div className="flex items-baseline gap-3">
              <span
                className={cn("font-display text-4xl tracking-tight", price.promo && "text-ok")}
              >
                {formatPaise(price.totalPaise)}
              </span>
              {price.promo ? (
                <span className="font-display text-xl text-faint line-through">
                  {formatPaise(price.listPaise)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-faint">One-time payment · lifetime access</p>

            {price.promo ? (
              <div className="mt-4 flex items-center justify-between rounded-md border border-ok/30 bg-ok/10 px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-ok">
                  <Tag className="size-3.5" />
                  {price.promo.code} — {price.promo.label}
                </span>
                <button
                  type="button"
                  aria-label="Remove discount"
                  onClick={() => {
                    setApplied(null);
                    setCode("");
                  }}
                  className="text-faint hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setApplied(code);
                }}
              >
                <label htmlFor="promo" className="eyebrow">
                  Discount code
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="promo"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="LEARN50"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 min-w-0 flex-1 rounded-md border border-border bg-inset px-3 font-mono text-sm uppercase text-fg placeholder:text-faint focus:border-accent focus:outline-none"
                  />
                  <Button type="submit" variant="secondary" disabled={!code.trim()}>
                    Apply
                  </Button>
                </div>
                {applied && price.invalidCode ? (
                  <p className="mt-2 text-xs text-bad">
                    “{price.invalidCode}” is not a valid code.
                  </p>
                ) : codeIsValid ? (
                  <p className="mt-2 text-xs text-ok">
                    {typedPreview.promo?.code} saves {formatPaise(typedPreview.discountPaise)} —
                    press Apply.
                  </p>
                ) : null}
              </form>
            )}

            <div className="mt-5 border-t border-border pt-5">
              <ClientOnly fallback={<div className="h-16" aria-hidden />}>
                <SignedOut>
                  <Link to="/login">
                    <Button className="w-full">Sign in to continue</Button>
                  </Link>
                  <p className="mt-2 text-center text-xs text-faint">
                    You need an account before you can buy.
                  </p>
                </SignedOut>

                <SignedIn>
                  {state.entitled ? (
                    <div className="rounded-md border border-ok/30 bg-ok/10 px-3 py-3 text-center">
                      <p className="text-sm font-medium text-ok">You have lifetime access.</p>
                      <Link to="/" className="mt-1 inline-flex text-xs text-accent hover:underline">
                        Start learning →
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        disabled={busy || loading || !state.checkoutConfigured}
                        onClick={() => buy(price.promo?.code ?? null)}
                      >
                        {busy ? "Opening checkout…" : `Pay ${formatPaise(price.totalPaise)}`}
                      </Button>
                      {/* Only after loading settles — otherwise this warning
                        flashes on every visit while the state is in flight. */}
                      {!loading && !state.checkoutConfigured ? (
                        <p className="mt-2 text-xs leading-5 text-warn">
                          Checkout is not connected yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
                          to enable payments.
                        </p>
                      ) : null}
                      {error ? <p className="mt-2 text-xs text-bad">{error}</p> : null}
                    </>
                  )}
                </SignedIn>
              </ClientOnly>
            </div>

            <p className="mt-4 text-center text-[11px] leading-5 text-faint">
              Payments are processed by Razorpay. We never see your card details.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
