import { createMiddleware } from "@tanstack/react-start";

/**
 * Like `authMiddleware`, but resolves `userId: string | null` instead of
 * throwing when nobody is signed in.
 *
 * Needed because the paywall has to be readable by signed-OUT visitors: if the
 * only way to learn "content is locked" is a call that 401s when signed out,
 * the client cannot tell "locked" from "billing is unreachable" and has to
 * fail open — which un-gates the library for exactly the people who have not
 * paid.
 *
 * Use this ONLY for reads whose signed-out answer is safe to give away. Every
 * write, and anything that touches money, keeps `authMiddleware`: `userId` here
 * is nullable, so it cannot be used to scope a write by accident.
 *
 * The identity still comes from the verified session server-side — never from
 * anything the client claims.
 */
export const optionalAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Same bearer forwarding as `authMiddleware`: the live preview runs in a
    // partitioned iframe whose cookies never reach the server.
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    // ONLY `*.server` imports in here — this module is dual client/server.
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    assertSameSiteRequest();
    const user = await getSessionUser(context.bearerToken);
    return next({ context: { userId: user?.id ?? null } });
  });
