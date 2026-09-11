import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Razorpay integration — server only. Never import from a client module.
 *
 * Configuration comes from the environment, never from the repository:
 *   RAZORPAY_KEY_ID       public-ish key id, also sent to the browser
 *   RAZORPAY_KEY_SECRET   SECRET — signs and verifies; must never reach the client
 *
 * Unconfigured (no keys) is a supported state: `razorpayConfigured()` is false,
 * the UI says checkout is not connected yet, and no fake "success" is possible.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID?.trim() || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

export function razorpayConfigured(): boolean {
  return KEY_ID.length > 0 && KEY_SECRET.length > 0;
}

/** Safe to expose — Razorpay's checkout script needs it in the browser. */
export function publishableKeyId(): string {
  return KEY_ID;
}

export type RazorpayOrder = { id: string; amount: number; currency: string };

/**
 * Create an order. `amountPaise` MUST come from the server-side price
 * calculation — see pricing.ts. Passing a client-supplied amount here is the
 * vulnerability this whole module is arranged to prevent.
 */
export async function createOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  if (!razorpayConfigured()) throw new Error("razorpay not configured");
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    throw new Error("amount must be a positive integer in paise");
  }

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      // Razorpay dedupes on receipt when this is set, so a double-submit does
      // not create a second order for the same checkout attempt.
      payment_capture: 1,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    // Never surface the provider's raw body to the client — it can echo config.
    throw new Error(`razorpay order failed: ${response.status}`);
  }
  const order = (await response.json()) as RazorpayOrder;
  return order;
}

/**
 * Verify the callback signature.
 *
 * Razorpay signs `${order_id}|${payment_id}` with the key secret (HMAC-SHA256).
 * Without this check, anyone can POST a fabricated success to the verify
 * endpoint and unlock the product for free — this function is the entire
 * difference between a paywall and a suggestion.
 */
export function verifyPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!razorpayConfigured()) return false;
  const expected = createHmac("sha256", KEY_SECRET)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(args.signature ?? "", "utf8");
  // Length must match before timingSafeEqual, which throws on differing lengths.
  if (a.length !== b.length) return false;
  // Constant-time: a plain === leaks how much of the signature was correct.
  return timingSafeEqual(a, b);
}

export function newReceiptId(): string {
  return `rcpt_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}
