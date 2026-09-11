import assert from "node:assert/strict";
import { test } from "node:test";
import { probeSignInRedirect } from "./check-deploy.mjs";

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
