/**
 * Pricing and promo-code rules — the single source of truth, shared by the
 * client (to render) and the server (to CHARGE).
 *
 * Amounts are integer paise, never floats and never rupees-as-decimal. This is
 * the same discipline as the digital-wallet chapter: money in minor units,
 * because 0.1 + 0.2 !== 0.3 in binary floating point.
 *
 * SECURITY: the client may send a promo CODE, never an amount. The server
 * recomputes the price from this module and charges that. A checkout that
 * trusts a client-supplied amount can be bought for one paise.
 */

export const CURRENCY = "INR" as const;

/** List price: ₹10,000 one-time, lifetime access. */
export const LIST_PRICE_PAISE = 10_000_00;

export type Promo = {
  code: string;
  /** Percentage off, 1–100. */
  percentOff: number;
  label: string;
};

const PROMOS: readonly Promo[] = [
  { code: "LEARN50", percentOff: 50, label: "50% off — launch offer" },
];

export type PriceBreakdown = {
  listPaise: number;
  discountPaise: number;
  totalPaise: number;
  promo: Promo | null;
  /** Set when a code was entered but did not match any promo. */
  invalidCode: string | null;
};

/** Codes are matched case-insensitively and trimmed — "learn50 " must work. */
export function findPromo(rawCode: string | null | undefined): Promo | null {
  if (!rawCode) return null;
  const code = rawCode.trim().toUpperCase();
  return PROMOS.find((p) => p.code === code) ?? null;
}

export function priceFor(rawCode?: string | null): PriceBreakdown {
  const entered = rawCode?.trim() ?? "";
  const promo = findPromo(entered);

  if (!promo) {
    return {
      listPaise: LIST_PRICE_PAISE,
      discountPaise: 0,
      totalPaise: LIST_PRICE_PAISE,
      promo: null,
      invalidCode: entered.length > 0 ? entered : null,
    };
  }

  // Round the DISCOUNT down so the total never undercharges by a rounding step.
  const discountPaise = Math.floor((LIST_PRICE_PAISE * promo.percentOff) / 100);
  return {
    listPaise: LIST_PRICE_PAISE,
    discountPaise,
    totalPaise: LIST_PRICE_PAISE - discountPaise,
    promo,
    invalidCode: null,
  };
}

/** ₹1,00,000.00 — Indian digit grouping, which Intl handles with en-IN. */
export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
