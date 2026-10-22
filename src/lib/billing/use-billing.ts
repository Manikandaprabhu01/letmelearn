import { useEffect, useSyncExternalStore } from "react";
import { getBillingState } from "./api";

export type BillingState = {
  /** This user has paid (or the paywall is off — see `paywallActive`). */
  entitled: boolean;
  /** Razorpay keys are set, so a real payment can be taken. */
  checkoutConfigured: boolean;
  /**
   * Whether premium content is actually locked. Tied to `checkoutConfigured`:
   * locking people out while no payment can be taken would be a dead end with
   * no way through, so the library stays open until checkout is live.
   */
  paywallActive: boolean;
  keyId: string | null;
};

/** Safe default: locked, but `loading` keeps the UI from acting on it yet. */
const EMPTY: BillingState = {
  entitled: false,
  checkoutConfigured: false,
  paywallActive: false,
  keyId: null,
};

/**
 * One shared billing snapshot for the whole page.
 *
 * A module-level store rather than per-component state: several `<ProGate>`s
 * can be mounted at once, and each one running its own fetch would mean N
 * identical round-trips and N independent loading flickers.
 */
let snapshot: { state: BillingState; loading: boolean } = { state: EMPTY, loading: true };
const serverSnapshot: { state: BillingState; loading: boolean } = { state: EMPTY, loading: true };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function emit(next: { state: BillingState; loading: boolean }) {
  snapshot = next;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Fetch the billing state, de-duplicating concurrent callers. */
export function refreshBilling(force = false): Promise<void> {
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const state = await getBillingState();
      emit({ state, loading: false });
    } catch {
      // Signed out, or the endpoint is unreachable. Fall back to the default —
      // which leaves the library open, not locked, since `paywallActive` is false.
      emit({ state: EMPTY, loading: false });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Current billing state plus a loading flag.
 *
 * Always check `loading` before rendering a locked state: `entitled` is false
 * while the request is still in the air, and acting on it early shows a paywall
 * to someone who has already paid.
 */
export function useBilling(): { state: BillingState; loading: boolean } {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
  useEffect(() => {
    if (snapshot.loading) void refreshBilling();
  }, []);
  return value;
}
