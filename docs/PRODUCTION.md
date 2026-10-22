# Going to production

Production is `https://letmelearn.vercel.app`, deployed by Vercel from `main`.
All current work lives on `feat/ai-fde-roadmap` until it is merged.

## How people sign in

**Email and password** is the primary method. It runs on this app's own Better
Auth and database, needs no third party, and works on any host.

**Google** is optional and appears on `/login` only once `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are set, so the page never shows a button that cannot
finish.

The template's Google/X buttons federate through the Grok broker. Its consent
screen names xAI, and without per-app broker credentials it only returns to
`*.grok-sandbox.com`, so those buttons stay hidden on Vercel.

## 1. Environment variables (Vercel → Settings → Environment Variables)

Set these for **Production**. Make `DATABASE_URL` available to the **Build**
step as well: `npm run build` applies the migrations with it.

| Variable                    | Required | Value                                                                                                                                                   |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_URL`           | yes      | `https://letmelearn.vercel.app`, exactly, no trailing slash                                                                                             |
| `BETTER_AUTH_SECRET`        | yes      | output of `openssl rand -base64 32`; keep it out of chat and git                                                                                        |
| `DATABASE_URL`              | yes      | Postgres connection string (for example Neon, pooled)                                                                                                   |
| `GOOGLE_CLIENT_ID`          | optional | from Google Cloud, step 2                                                                                                                               |
| `GOOGLE_CLIENT_SECRET`      | optional | from Google Cloud, step 2                                                                                                                               |
| `RAZORPAY_KEY_ID`           | optional | Razorpay dashboard. Without it the paywall stays off                                                                                                    |
| `RAZORPAY_KEY_SECRET`       | optional | Razorpay dashboard. Never exposed to the browser                                                                                                        |
| `CODE_RUNNER_BASE_URL`      | No       | Compiler Explorer instance the Code Compiler uses for Java. Defaults to `https://godbolt.org`; point it at your own instance to keep snippets in-house. |
| `CODE_RUNNER_JAVA_COMPILER` | No       | Compiler id on that instance. Defaults to `java2501` (JDK 25).                                                                                          |

Why each required one matters:

- **`BETTER_AUTH_URL` unset:** Better Auth falls back to `http://localhost:8080`.
  Google callbacks point at localhost and email sign-in is refused as an
  untrusted origin, so nobody can log in.
- **`DATABASE_URL` unset:** Better Auth uses an in-memory database that each
  serverless instance loses, so accounts, sessions and purchases disappear.
- **`BETTER_AUTH_SECRET` unset:** sessions are signed with a per-instance
  random secret and stop validating across instances.

## 2. Google sign-in (optional, about 15 minutes)

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID
   → Web application.
2. Authorized redirect URI: `https://letmelearn.vercel.app/api/auth/callback/google`
3. Configure the OAuth consent screen with the app name LetMeLearn.
4. Copy the client ID and secret into the two `GOOGLE_*` variables.

## 3. Ship

1. Merge `feat/ai-fde-roadmap` into `main`. Vercel builds and deploys it.
2. Wait for the deployment to finish. Env changes only apply to new deployments,
   so redeploy if you set variables after the build.
3. Run the preflight against the live site:

   ```
   npm run check:deploy https://letmelearn.vercel.app
   ```

   All five checks must pass: `/welcome` and `/pricing` load, Better Auth is
   mounted, the sign-in callback points at this site, and email sign-in is
   accepted from this origin. It creates no accounts.

## 4. Smoke test by hand (5 minutes)

1. Visit `/`: a signed-out visitor lands on `/welcome`.
2. `/login` → Create account → you land in the studio.
3. Open each menu: HLD, LLD, AI FDE Roadmap, Java & Spring Boot, System Design
   Examples, Labs, Sources. Open one page in each.
4. ⌘K search, the theme toggle, and Mark studied on any page.
5. Sign out: studio pages send you back to `/welcome`.
6. Sign in again with the same email and password.
7. `/pricing` → apply `LEARN50` → total shows ₹5,000.

## Known limits at launch

- **No password reset.** There is no email provider configured, so a forgotten
  password cannot be recovered yet. Adding one (for example Resend) is the
  next auth task.
- **Checkout is off** until the Razorpay keys are set. Until then every page is
  open to signed-in users and `/pricing` says checkout is not connected.
- **Preview deployments** have different URLs from `BETTER_AUTH_URL`, so sign-in
  is expected to fail on them. Test sign-in on production.
