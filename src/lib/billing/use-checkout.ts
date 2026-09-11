import { useCallback, useState } from "react";
import { createCheckoutOrder, getBillingState, verifyCheckout } from "./api";
import { refreshBilling, useBilling } from "./use-billing";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/** Load Razorpay's checkout script once, on demand — not on every page load. */
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function useCheckout() {
  const { state, loading } = useBilling();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(async (promoCode: string | null) => {
    setBusy(true);
    setError(null);
    try {
      if (!(await loadRazorpayScript())) {
        throw new Error("Could not load the payment form. Check your connection.");
      }
      // The server computes the amount from the code — we never send a price.
      const order = await createCheckoutOrder({ data: { promoCode: promoCode ?? undefined } });
      const current = await getBillingState();
      if (!current.keyId) throw new Error("Checkout is not configured.");

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: current.keyId,
          order_id: order.orderId,
          amount: order.amountPaise,
          currency: "INR",
          name: "LetMeLearn",
          description: "Lifetime access",
          handler: async (r: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Access is granted only after the SERVER verifies the signature.
              await verifyCheckout({
                data: {
                  orderId: r.razorpay_order_id,
                  paymentId: r.razorpay_payment_id,
                  signature: r.razorpay_signature,
                },
              });
              await refreshBilling(true);
              resolve();
            } catch (e) {
              reject(e instanceof Error ? e : new Error("Verification failed."));
            }
          },
          modal: { ondismiss: () => reject(new Error("Checkout closed.")) },
        } as Record<string, unknown>);
        rzp.open();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, loading, buy, busy, error, refresh: () => refreshBilling(true) };
}
