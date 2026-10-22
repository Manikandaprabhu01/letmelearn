-- One-time lifetime purchases, and the entitlement they grant.
--
-- A purchase row is the record of a completed Razorpay payment. Entitlement is
-- DERIVED from it (any row with status 'paid' for this user), rather than a
-- mutable boolean on the user — the same append-only reasoning as a ledger:
-- the history explains the state, and a bug cannot silently flip access on.

create table if not exists purchases (
  id               text primary key,
  user_id          text not null,
  -- Razorpay ids. order_id is created before payment; payment_id arrives after.
  order_id         text not null unique,
  payment_id       text,
  -- What we actually charged, in paise, computed SERVER-SIDE at order time.
  amount_paise     bigint not null,
  currency         text not null default 'INR',
  promo_code       text,
  status           text not null default 'created',  -- created | paid | failed
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);

-- Entitlement lookups are "does this user have any paid purchase" — index for it.
create index if not exists idx_purchases_user_status on purchases (user_id, status);
