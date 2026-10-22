import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatPaise, priceFor } from "@/lib/billing/pricing";
import { useBilling } from "@/lib/billing/use-billing";

/**
 * Gates premium content behind lifetime access.
 *
 * Three things have to be true before anything is hidden:
 *   1. the paywall is live (Razorpay is connected — otherwise there is no way
 *      to buy, and a lock with no key is just a broken page),
 *   2. the session and billing state have both finished loading, and
 *   3. this user has not paid.
 *
 * Note this is presentation only. It stops the content rendering, not the data
 * reaching the browser — anything that must never be served to a non-paying
 * visitor has to be withheld by the server function that loads it.
 */
export function ProGate({
  children,
  title = "Part of the full library",
  blurb,
}: {
  children: ReactNode;
  title?: string;
  blurb?: string;
}) {
  const { state, loading } = useBilling();
  const { user, isPending } = useCurrentUserState();

  // Still resolving — render the content rather than a lock. Flashing a paywall
  // at someone who has paid is the worse of the two wrong answers, and it
  // resolves within one round-trip.
  if (loading || isPending) return <>{children}</>;
  if (!state.paywallActive || state.entitled) return <>{children}</>;

  // The lock is decided from client-only state, so the server renders the
  // content. `fallback={children}` keeps the first client paint identical to it.
  return (
    <ClientOnly fallback={children}>
      <LockedPanel signedIn={user !== null} title={title} blurb={blurb} />
    </ClientOnly>
  );
}

function LockedPanel({
  signedIn,
  title,
  blurb,
}: {
  signedIn: boolean;
  title: string;
  blurb?: string;
}) {
  const price = priceFor("LEARN50");
  return (
    <div className="rounded-xl border border-border bg-inset p-8 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-full bg-raised text-faint">
        <Lock className="size-4" />
      </span>
      <h3 className="mt-4 font-display text-lg tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-muted">
        {blurb ??
          "Unlock every concept, worked example, roadmap and lab with a single lifetime payment."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {signedIn ? (
          <Link to="/pricing">
            <Button>Unlock for {formatPaise(price.totalPaise)}</Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary">See what is included</Button>
            </Link>
          </>
        )}
      </div>
      <p className="mt-3 text-xs text-faint">
        Use code <span className="font-mono text-fg">LEARN50</span> for 50% off.
      </p>
    </div>
  );
}
