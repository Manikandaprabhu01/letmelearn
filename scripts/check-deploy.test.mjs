import assert from "node:assert/strict";
import { test } from "node:test";
import { probeEmailSignIn, probeSignInRedirect } from "./check-deploy.mjs";

const SITE = "https://letmelearn.vercel.app";

/** A stub standing in for the deployed app's /api/auth/sign-in/oauth2. */
function stubReturning(url) {
  return async () => ({ json: async () => ({ url, redirect: true }) });
}

function authorizeUrl(redirectUri) {
  return (
    "https://auth.grok.me/api/auth/oauth2/authorize?idp=google&response_type=code" +
    `&client_id=grok_preview&state=abc&redirect_uri=${encodeURIComponent(redirectUri)}`
  );
}

test("passes when the callback returns to the site itself", async () => {
  const result = await probeSignInRedirect(
    SITE,
    stubReturning(authorizeUrl(`${SITE}/api/auth/oauth2/callback/grok-google`)),
  );
  assert.equal(result.ok, true);
  assert.equal(result.redirectOrigin, SITE);
});

test("catches the localhost fallback, which is the silent production failure", async () => {
  // What an unset BETTER_AUTH_URL produces: the build is green and pages
  // render, but the broker is told to come back to the developer's laptop.
  const result = await probeSignInRedirect(
    SITE,
    stubReturning(authorizeUrl("http://localhost:8080/api/auth/oauth2/callback/grok-google")),
  );
  assert.equal(result.ok, false);
  assert.equal(result.redirectOrigin, "http://localhost:8080");
  assert.match(result.detail, /BETTER_AUTH_URL/);
});

test("reports a stale deploy that answers with HTML instead of JSON", async () => {
  const result = await probeSignInRedirect(SITE, async () => ({
    json: async () => {
      throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON");
    },
  }));
  assert.equal(result.ok, false);
  assert.match(result.detail, /request failed/);
});

test("reports an authorize URL with no redirect_uri", async () => {
  const result = await probeSignInRedirect(
    SITE,
    stubReturning("https://auth.grok.me/api/auth/oauth2/authorize?response_type=code"),
  );
  assert.equal(result.ok, false);
  assert.match(result.detail, /no redirect_uri/);
});

/** A stub for /api/auth/sign-in/email answering with a status and body. */
function emailStub(status, body) {
  return async () => ({ status, json: async () => body });
}

test("email probe passes on a wrong-password 401 — enabled and origin trusted", async () => {
  const result = await probeEmailSignIn(
    SITE,
    emailStub(401, { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }),
  );
  assert.equal(result.ok, true);
});

test("email probe names BETTER_AUTH_URL when the origin is untrusted", async () => {
  const result = await probeEmailSignIn(SITE, emailStub(403, { code: "INVALID_ORIGIN" }));
  assert.equal(result.ok, false);
  assert.match(result.detail, /BETTER_AUTH_URL/);
});

test("email probe reports email/password off or a stale deploy on 404", async () => {
  const result = await probeEmailSignIn(SITE, emailStub(404, null));
  assert.equal(result.ok, false);
  assert.match(result.detail, /off, or the deploy is stale/);
});

test("email probe never mistakes a 200 for success", async () => {
  // A 200 would mean the throwaway credentials signed someone in — never a pass.
  const result = await probeEmailSignIn(SITE, emailStub(200, { token: "x" }));
  assert.equal(result.ok, false);
});
