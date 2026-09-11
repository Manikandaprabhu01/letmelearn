import { Link } from "@tanstack/react-router";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useBilling } from "@/lib/billing/use-billing";

/**
 * Sidebar account footer: who you are, and the way to unlock if you have not.
 * The upgrade prompt is hidden while billing is loading and once the user is
 * entitled, so a paying customer never sees an "upgrade" nudge.
 */
export function AccountStrip() {
  const { state, loading } = useBilling();
  const showUpgrade = !loading && state.paywallActive && !state.entitled;

  return (
    <ClientOnly fallback={<div className="h-[4.5rem]" aria-hidden />}>
      <div className="flex flex-col gap-2">
        <SignedOut>
          <Link to="/login" className="block">
            <Button variant="secondary" className="w-full">
              Sign in
            </Button>
          </Link>
          <Link to="/pricing" className="text-center text-[11px] text-faint hover:text-fg">
            Pricing & lifetime access
          </Link>
        </SignedOut>

        <SignedIn>
          <div className="px-1">
            <UserButton />
          </div>
          {showUpgrade ? (
            <Link to="/pricing" className="block">
              <Button variant="secondary" className="w-full">
                <Sparkles className="size-3.5" />
                Unlock everything
              </Button>
            </Link>
          ) : (
            <Link to="/pricing" className="text-center text-[11px] text-faint hover:text-fg">
              Pricing
            </Link>
          )}
        </SignedIn>
      </div>
    </ClientOnly>
  );
}
