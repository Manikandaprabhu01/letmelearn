import { useEffect, useState, type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/**
 * The studio is for signed-in visitors only — signed-out ones are sent to the
 * public front page instead.
 *
 * Three states, in this order, and the order is the whole point:
 *
 *  1. Not hydrated yet, or the session is still resolving → a placeholder.
 *     Redirecting on `user === null` before `isPending` clears would bounce a
 *     signed-in visitor to the front page on every hard reload.
 *  2. Resolved, no user → go to `/welcome`.
 *  3. Resolved, user → the app.
 *
 * The placeholder also covers the server render. The session lives in a
 * client-side store, so the server cannot know who this is; rendering the same
 * placeholder on both sides keeps hydration honest instead of letting React
 * hydrate the app onto markup the server produced for nobody.
 *
 * Deliberately client-side: resolving the session in `beforeLoad` would be
 * zero-flash when deployed, but in the live preview the session rides a bearer
 * token that cookie-SSR cannot see — so a server-side guard would redirect
 * signed-in preview users straight back out.
 */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { user, isPending } = useCurrentUserState();

  if (!hydrated || isPending) return <Waiting />;
  if (!user) return <RedirectToSignIn to="/welcome" />;
  return <>{children}</>;
}

/** Same markup on the server and on the first client paint. */
function Waiting() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg text-fg">
      <p className="text-sm text-faint">Loading…</p>
    </div>
  );
}
