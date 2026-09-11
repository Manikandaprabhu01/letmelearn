import { getSql } from "@/lib/db";

/**
 * Entitlement is DERIVED from purchase history, never stored as a flag.
 * "Does this user have any paid purchase" — one indexed query.
 */
export async function hasLifetimeAccess(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql`
    select 1 from purchases
     where user_id = ${userId} and status = 'paid'
     limit 1
  `;
  return rows.length > 0;
}
