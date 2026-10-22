import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { optionalAuthMiddleware } from "./optional-auth";

/**
 * Billing server functions.
 *
 * Every one runs behind `authMiddleware`, so `context.userId` is a verified
 * identity rather than anything the client claimed. The price is recomputed
 * here from the promo code — the client never sends an amount.
 */

/** Checkout status for the current user: are they entitled, and is Razorpay live? */
export const getBillingState = createServerFn({ method: "GET" })
  // Optional auth on purpose: a signed-out visitor must still learn that the
  // library is paywalled. Behind `authMiddleware` this call 401s when signed
  // out, the client cannot distinguish that from an outage, and the safe
  // fallback un-gates the content for everyone who has not signed in.
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context }) => {
    const [{ hasLifetimeAccess }, { razorpayConfigured, publishableKeyId }] = await Promise.all([
      import("./entitlement.server"),
      import("./razorpay.server"),
    ]);
    const configured = razorpayConfigured();
    return {
      // Signed out is never entitled — and we never ask the database about a
      // null user id.
      entitled: context.userId === null ? false : await hasLifetimeAccess(context.userId),
      checkoutConfigured: configured,
      // The paywall only switches on once payment can actually be taken.
      // Locking the library while checkout is dead would leave visitors with a
      // gate and no key.
      paywallActive: configured,
      keyId: configured ? publishableKeyId() : null,
    };
  });

/**
 * Create a Razorpay order for the current user at the SERVER-COMPUTED price.
 * The client sends only a promo code.
 */
export const createCheckoutOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ promoCode: z.string().max(40).optional() }))
  .handler(async ({ data, context }) => {
    const [{ priceFor }, { createOrder, newReceiptId, razorpayConfigured }, { getSql }] =
      await Promise.all([import("./pricing"), import("./razorpay.server"), import("@/lib/db")]);

    if (!razorpayConfigured()) {
      throw new Error("Checkout is not connected yet — RAZORPAY_KEY_ID/SECRET are unset.");
    }

    const { hasLifetimeAccess } = await import("./entitlement.server");
    if (await hasLifetimeAccess(context.userId)) {
      throw new Error("You already have lifetime access.");
    }

    // THE PRICE IS COMPUTED HERE, from the code alone. An amount sent by the
    // client is never read, so it cannot be tampered with.
    const price = priceFor(data.promoCode);
    const receipt = newReceiptId();
    const order = await createOrder(price.totalPaise, receipt);

    const sql = await getSql();
    await sql`
      insert into purchases (id, user_id, order_id, amount_paise, currency, promo_code, status)
      values (${receipt}, ${context.userId}, ${order.id}, ${price.totalPaise}, 'INR',
              ${price.promo?.code ?? null}, 'created')
    `;

    return { orderId: order.id, amountPaise: price.totalPaise, receipt };
  });

/**
 * Verify a completed payment and grant access.
 *
 * The signature check is what makes this safe: a forged POST without a valid
 * HMAC is rejected, so access cannot be granted by calling this endpoint.
 */
export const verifyCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      orderId: z.string().min(1).max(120),
      paymentId: z.string().min(1).max(120),
      signature: z.string().min(1).max(256),
    }),
  )
  .handler(async ({ data, context }) => {
    const [{ verifyPaymentSignature }, { getSql }] = await Promise.all([
      import("./razorpay.server"),
      import("@/lib/db"),
    ]);

    if (!verifyPaymentSignature(data)) {
      throw new Error("Payment signature verification failed.");
    }

    const sql = await getSql();
    // Scope by user_id as well as order_id: without it, a signed payment for
    // someone else's order could be redeemed against this account.
    const updated = await sql`
      update purchases
         set status = 'paid', payment_id = ${data.paymentId}, paid_at = now()
       where order_id = ${data.orderId}
         and user_id = ${context.userId}
         and status = 'created'
      returning id
    `;

    // Zero rows means the order is unknown, belongs to someone else, or was
    // already marked paid. Re-verifying an already-paid order is harmless and
    // must stay idempotent, so confirm entitlement rather than failing.
    const { hasLifetimeAccess } = await import("./entitlement.server");
    const entitled = await hasLifetimeAccess(context.userId);
    if (updated.length === 0 && !entitled) {
      throw new Error("No matching pending order for this account.");
    }
    return { entitled: true };
  });
