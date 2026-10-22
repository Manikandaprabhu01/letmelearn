import { createServerFn } from "@tanstack/react-start";

/**
 * Which sign-in methods can actually complete on this deployment.
 *
 * The login page asks instead of assuming, because the two OAuth options fail
 * in ways the browser cannot see coming: a button whose server-side client is
 * missing sends the visitor through Google and then dead-ends on the callback.
 * Showing only what is configured means every button on the page works.
 *
 * Public on purpose, and returns booleans only — never an id or a secret.
 */
export type SignInMethods = {
  /** The app's own Google client (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET). */
  google: boolean;
  /**
   * Per-app Grok broker credentials were injected. Without them the broker's
   * shared client only accepts *.grok-sandbox.com callbacks, so its Google/X
   * buttons cannot complete anywhere else.
   */
  brokerCredentials: boolean;
};

export const getSignInMethods = createServerFn({ method: "GET" }).handler(
  async (): Promise<SignInMethods> => {
    const has = (key: string) => Boolean(process.env[key]?.trim());
    return {
      google: has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET"),
      brokerCredentials: has("GROK_AUTH_CLIENT_ID") && has("GROK_AUTH_CLIENT_SECRET"),
    };
  },
);
