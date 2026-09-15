import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { LogoMark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/data/nav";
import { authClient } from "@/lib/auth/client";
import { SignInButtons, SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { getSignInMethods, type SignInMethods } from "@/lib/signin/methods";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: LoginPage });

const INCLUDED = [
  "Java & Spring Boot — 20 chapters",
  "Python End-to-End for AI — 20 chapters",
  "19 LLD concepts and 40 HLD concepts, including microservices",
  "41 system design examples at chapter depth",
  "The AI FDE Roadmap — 8 steps, 80 concepts",
  "16 interactive labs",
];

type Mode = "sign-in" | "sign-up";

/** Better Auth's error codes, in words a visitor can act on. */
const ERROR_COPY: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match an account.",
  USER_ALREADY_EXISTS: "An account with this email already exists — sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists — sign in instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "That password is too long — 128 characters at most.",
  INVALID_EMAIL: "Enter a valid email address.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches Better Auth's server default; checking here only saves a round-trip —
// the server still enforces it.
const MIN_PASSWORD_LENGTH = 8;

function describeError(error: { code?: string; message?: string; status?: number }): string {
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  return (
    (error.code ? ERROR_COPY[error.code] : undefined) ??
    error.message ??
    "Something went wrong. Try again."
  );
}

const INPUT =
  "h-11 w-full rounded-md border border-border bg-inset px-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none";

function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: the sign-in itself */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/welcome" className="flex items-center gap-2.5 text-fg">
            <LogoMark className="size-8" />
            <span className="font-display text-2xl tracking-tight">{APP_NAME}</span>
          </Link>

          {/* The form reads a client-side session store, so hold the first client
              paint equal to the server's to keep hydration clean. */}
          <ClientOnly fallback={<div className="mt-10 h-96" aria-hidden />}>
            <SignedOut>
              <SignInPanel />
            </SignedOut>
            <SignedIn>
              <div className="mt-10 rounded-lg border border-border bg-surface p-5">
                <p className="text-sm text-fg">You are signed in.</p>
                <div className="mt-4">
                  <UserButton />
                </div>
                <Link to="/" className="mt-5 inline-flex text-sm text-accent hover:underline">
                  Go to the studio →
                </Link>
              </div>
            </SignedIn>
          </ClientOnly>
        </div>
      </div>

      {/* Right: what an account gets you */}
      <aside className="hidden flex-col justify-center border-l border-border bg-inset px-16 lg:flex">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          What is inside
        </p>
        <h2 className="mt-3 max-w-sm font-display text-2xl leading-snug tracking-tight">
          Learn the map, then run the labs.
        </h2>
        <ul className="mt-8 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3 text-[15px] leading-7 text-muted">
              <Check className="mt-1.5 size-4 shrink-0 text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <Link to="/pricing" className="mt-8 text-sm text-accent hover:underline">
          See pricing →
        </Link>
      </aside>
    </main>
  );
}

function SignInPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [methods, setMethods] = useState<SignInMethods | null>(null);

  const signingUp = mode === "sign-up";

  useEffect(() => {
    let cancelled = false;
    getSignInMethods()
      .then((m) => !cancelled && setMethods(m))
      // Unknown means "show email only" — every button left on the page works.
      .catch(() => !cancelled && setMethods({ google: false, brokerCredentials: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  // The broker's shared client completes only on *.grok-sandbox.com hosts.
  const brokerUsable =
    methods !== null &&
    (methods.brokerCredentials ||
      (typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com")));

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  function validate(): string | null {
    if (signingUp && !name.trim()) return "Enter your name.";
    if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
    if (!password) return "Enter your password.";
    if (signingUp && password.length < MIN_PASSWORD_LENGTH) {
      return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
    }
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = signingUp
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(describeError(result.error));
        setBusy(false);
        return;
      }
      // Sign-up signs the new account straight in, so both paths land here.
      await navigate({ to: "/" });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/login",
      });
      // Success navigates away to Google; only a failure comes back here.
      if (authError) {
        setError(describeError(authError));
        setBusy(false);
      }
    } catch {
      setError("Could not start Google sign-in. Try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="mt-10 font-display text-3xl font-medium tracking-tight">
        {signingUp ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-2 text-[15px] leading-7 text-muted">
        {signingUp
          ? "One account for the whole library — concepts, examples and labs."
          : "Welcome back. Pick up where you left off."}
      </p>

      <div
        role="tablist"
        aria-label="Sign in or create an account"
        className="mt-8 grid grid-cols-2 gap-1 rounded-lg border border-border bg-inset p-1"
      >
        {(["sign-in", "sign-up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "h-9 rounded-md text-sm transition-colors",
              mode === m ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            {m === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {signingUp ? (
          <div>
            <label htmlFor="name" className="text-sm text-fg">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={cn(INPUT, "mt-1.5")}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="text-sm text-fg">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className={cn(INPUT, "mt-1.5")}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm text-fg">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signingUp ? "new-password" : "current-password"}
              className={cn(INPUT, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint hover:text-fg"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {signingUp ? (
            <p className="mt-1.5 text-xs text-faint">At least {MIN_PASSWORD_LENGTH} characters.</p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy
            ? signingUp
              ? "Creating account…"
              : "Signing in…"
            : signingUp
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      {methods?.google || brokerUsable ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            {methods?.google ? (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={continueWithGoogle}
              >
                Continue with Google
              </Button>
            ) : null}
            {brokerUsable ? <SignInButtons /> : null}
          </div>
        </>
      ) : null}

      <p className="mt-8 text-xs leading-6 text-faint">
        By continuing you agree to the terms of use. We store your name and email to keep your
        account and purchases.
      </p>
    </>
  );
}
