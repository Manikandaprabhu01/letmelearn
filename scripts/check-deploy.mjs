// @ts-check
/**
 * Verify a DEPLOYED LetMeLearn instance is configured correctly.
 *
 *   node scripts/check-deploy.mjs https://letmelearn.vercel.app
 *
 * Exists because the way this app fails in production is silent: with
 * `BETTER_AUTH_URL` unset, Better Auth's dynamic baseURL accepts only
 * `*.grok-sandbox.com` and loopback (see `src/lib/auth/preview.ts`), so on any
 * other host it falls back to `http://localhost:8080` and hands the broker a
 * `redirect_uri` pointing at localhost. Pages render, the build is green, and
 * sign-in simply never completes — and with the studio behind a sign-in gate,
 * that means the whole app is unreachable.
 *
 * So the decisive check is not "does it load" but "where does sign-in say to
 * come back to". Nothing here signs anyone in or sends credentials.
 */

import { isMainModule } from "./with-app-env.mjs";

const CALLBACK_PREFIX = "/api/auth/oauth2/callback/";

/** @param {string} raw */
function redact(raw) {
  return raw
    .replace(/(client_id=)[^&]*/g, "$1<redacted>")
    .replace(/(state=)[^&]*/g, "$1<redacted>");
}

/**
 * @param {string} base
 * @param {string} path
 * @returns {Promise<number>}
 */
async function status(base, path) {
  try {
    const res = await fetch(new URL(path, base), { redirect: "manual" });
    return res.status;
  } catch {
    return 0;
  }
}

/**
 * Ask the deployed app to start OAuth and report the `redirect_uri` it would
 * send. A POST, but it only mints a URL — no credentials, no session.
 * @param {string} base
 * @returns {Promise<{ ok: boolean, detail: string, redirectOrigin?: string }>}
 */
export async function probeSignInRedirect(base, fetchImpl = fetch) {
  const origin = new URL(base).origin;
  let body;
  try {
    const res = await fetchImpl(new URL("/api/auth/sign-in/oauth2", base), {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ providerId: "grok-google", callbackURL: "/" }),
    });
    body = await res.json();
  } catch (err) {
    return { ok: false, detail: `request failed: ${err instanceof Error ? err.message : err}` };
  }
  const url = body && typeof body === "object" ? body.url : undefined;
  if (typeof url !== "string") {
    return {
      ok: false,
      detail: `no authorize URL returned (${redact(JSON.stringify(body ?? null))})`,
    };
  }
  const redirectUri = new URL(url).searchParams.get("redirect_uri");
  if (!redirectUri) return { ok: false, detail: "authorize URL carries no redirect_uri" };
  const redirectOrigin = new URL(redirectUri).origin;
  if (redirectOrigin !== origin) {
    return {
      ok: false,
      redirectOrigin,
      detail:
        `sign-in would send the broker back to ${redirectOrigin}, not ${origin}. ` +
        "Set BETTER_AUTH_URL to the site's own origin and redeploy.",
    };
  }
  if (!new URL(redirectUri).pathname.startsWith(CALLBACK_PREFIX)) {
    return {
      ok: false,
      redirectOrigin,
      detail: `unexpected callback path ${new URL(redirectUri).pathname}`,
    };
  }
  return { ok: true, redirectOrigin, detail: `callback returns to ${redirectOrigin}` };
}

/**
 * Probe email/password sign-in with a wrong password for an address that cannot
 * exist. It creates nothing and signs nobody in, yet the answer separates the
 * three states that matter:
 *   401 INVALID_EMAIL_OR_PASSWORD -> email/password is on, and this origin is trusted
 *   403 INVALID_ORIGIN            -> BETTER_AUTH_URL does not match the site
 *   404                           -> email/password is off, or the deploy is stale
 * @param {string} base
 * @returns {Promise<{ ok: boolean, detail: string }>}
 */
export async function probeEmailSignIn(base, fetchImpl = fetch) {
  const origin = new URL(base).origin;
  let res;
  let body = null;
  try {
    res = await fetchImpl(new URL("/api/auth/sign-in/email", base), {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({
        email: "deploy-check@invalid.example",
        password: "deploy-check-not-a-real-password",
      }),
    });
    body = await res.json().catch(() => null);
  } catch (err) {
    return { ok: false, detail: `request failed: ${err instanceof Error ? err.message : err}` };
  }
  const code = body && typeof body === "object" ? body.code : undefined;
  if (res.status === 401 && code === "INVALID_EMAIL_OR_PASSWORD") {
    return { ok: true, detail: "enabled, and requests from this origin are trusted" };
  }
  if (res.status === 403 || code === "INVALID_ORIGIN") {
    return {
      ok: false,
      detail:
        "rejected as an untrusted origin. Set BETTER_AUTH_URL to this site's origin and redeploy.",
    };
  }
  if (res.status === 404) {
    return { ok: false, detail: "not found: email/password is off, or the deploy is stale" };
  }
  if (res.status === 429) {
    return { ok: false, detail: "rate-limited. Wait a minute and re-run." };
  }
  return { ok: false, detail: `unexpected ${res.status}${code ? ` ${code}` : ""}` };
}

async function main() {
  const base = process.argv[2];
  if (!base) {
    console.error("usage: node scripts/check-deploy.mjs <https://your-deployment>");
    process.exit(2);
  }

  /** @type {Array<{ name: string, ok: boolean, detail: string }>} */
  const results = [];

  for (const path of ["/welcome", "/pricing"]) {
    const code = await status(base, path);
    results.push({
      name: `public page ${path}`,
      ok: code === 200,
      detail: code === 200 ? "200" : `got ${code || "no response"} — expected 200`,
    });
  }

  const sessionCode = await status(base, "/api/auth/get-session");
  results.push({
    name: "Better Auth mounted (/api/auth/get-session)",
    ok: sessionCode === 200,
    detail:
      sessionCode === 200
        ? "200"
        : `got ${sessionCode || "no response"} — src/routes/api/auth/$.ts missing, or the deploy is stale`,
  });

  const redirect = await probeSignInRedirect(base);
  results.push({ name: "sign-in redirect_uri points at this site", ...redirect });

  results.push({
    name: "email/password sign-in reachable from this site",
    ...(await probeEmailSignIn(base)),
  });

  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}\n      ${r.detail}`);
  }
  console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

// The shared helper realpaths both sides, so running this through a symlinked
// path still executes instead of silently no-opping to exit 0.
if (isMainModule(import.meta.url)) {
  await main();
}
