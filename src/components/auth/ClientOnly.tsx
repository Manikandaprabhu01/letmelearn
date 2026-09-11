import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders `fallback` on the server AND on the first client paint, swapping to
 * `children` only after hydration.
 *
 * Why this exists: the auth gates read a client-side session store. The server
 * renders the pending branch (nothing), but by the time the client's first
 * render runs the session has often already resolved — so React hydrates a
 * signed-out button onto an empty slot and throws
 * "Hydration failed because the server rendered HTML didn't match the client".
 *
 * Gating on `isPending` alone cannot fix that: the mismatch is a race, not a
 * missing check. Forcing the first client render to equal the server render
 * removes the race entirely, and the effect runs immediately afterwards.
 *
 * Give `fallback` the same footprint as the real content so the swap does not
 * shift the layout.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return <>{hydrated ? children : fallback}</>;
}
