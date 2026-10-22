import { createServerFn } from "@tanstack/react-start";

export const TEST_USER_CREDENTIALS = {
  name: "Test Learner",
  email: "test@letmelearn.dev",
  password: "password123",
};

/**
 * Ensures the default test user exists in the database and has lifetime access.
 */
export const ensureTestUser = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const [{ auth }, { getSql }] = await Promise.all([
      import("./server"),
      import("@/lib/db"),
    ]);

    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select id from "user" where email = ${TEST_USER_CREDENTIALS.email} limit 1
    `;
    let userId = existing[0]?.id;

    if (!userId) {
      try {
        const res = await auth.api.signUpEmail({
          body: {
            name: TEST_USER_CREDENTIALS.name,
            email: TEST_USER_CREDENTIALS.email,
            password: TEST_USER_CREDENTIALS.password,
          },
        });
        userId = res?.user?.id;
      } catch {
        const recheck = await sql<{ id: string }>`
          select id from "user" where email = ${TEST_USER_CREDENTIALS.email} limit 1
        `;
        userId = recheck[0]?.id;
      }
    }

    if (userId) {
      // Ensure purchase row exists so entitlement check passes
      await sql`
        insert into purchases (id, user_id, order_id, payment_id, amount_paise, currency, status, paid_at)
        values (
          ${'purch_' + userId},
          ${userId},
          ${'order_test_' + userId},
          ${'pay_test_' + userId},
          499900,
          'INR',
          'paid',
          now()
        )
        on conflict (id) do update set status = 'paid', paid_at = now()
      `;
    }

    return {
      ok: true,
      email: TEST_USER_CREDENTIALS.email,
      password: TEST_USER_CREDENTIALS.password,
    };
  } catch (err) {
    console.error("[auth] Failed to ensure test user:", err);
    return { ok: false, error: String(err) };
  }
});
