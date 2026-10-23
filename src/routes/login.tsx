import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Layers,
  Database,
  Cpu,
  Terminal,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { LogoMark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/data/nav";
import { authClient, setBearerToken } from "@/lib/auth/client";
import { ensureTestUser, TEST_USER_CREDENTIALS } from "@/lib/auth/test-user";
import { SignInButtons, SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { getSignInMethods, type SignInMethods } from "@/lib/signin/methods";
import { cn } from "@/lib/utils";
import { COMPANY_COUNT, QUESTION_COUNT } from "@/data/interview/meta";

export const Route = createFileRoute("/login")({
  component: () => <LoginPage initialMode="sign-in" />,
});

const PERKS = [
  {
    icon: Layers,
    title: "8 Production Curricula Tracks",
    desc: "Java 8–26, Python 3.13 No-GIL, HLD, LLD, SQL & NoSQL, and AI FDE Roadmap.",
  },
  {
    icon: Terminal,
    title: "24 System Blueprints & Labs",
    desc: "Uber H3 Spatial, Netflix ABR, WhatsApp BEAM, and in-browser code runner.",
  },
  {
    icon: Zap,
    title: "34 FAANG Company Banks",
    desc: `${COMPANY_COUNT} companies, ${QUESTION_COUNT}+ questions with strong-hire rubrics.`,
  },
  {
    icon: ShieldCheck,
    title: "Lifetime Unlocked Access",
    desc: "One account, zero recurring subscriptions, with all future modules included.",
  },
];

type Mode = "sign-in" | "sign-up";

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
  "h-11 w-full rounded-xl border border-border/80 bg-inset px-3.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all";

export function LoginPage({ initialMode = "sign-in" }: { initialMode?: Mode }) {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<"perks" | "stats">("perks");

  return (
    <main className="grid min-h-dvh lg:grid-cols-2 bg-bg text-fg">
      {/* Left Column: Interactive Auth Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20 max-w-xl mx-auto w-full">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2.5 text-fg hover:opacity-85 transition-opacity">
            <LogoMark className="size-8" />
            <span className="font-display text-2xl font-bold tracking-tight">{APP_NAME}</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-accent border border-accent/30">
              STUDIO 2.0
            </span>
          </Link>
          <Link to="/welcome" className="text-xs text-muted hover:text-fg transition-colors">
            ← Back to Home
          </Link>
        </div>

        {/* Client-hydrated panel */}
        <ClientOnly fallback={<div className="mt-10 h-96 animate-pulse rounded-2xl bg-surface/30" aria-hidden />}>
          <SignedOut>
            <SignInPanel initialMode={initialMode} />
          </SignedOut>
          <SignedIn>
            <div className="mt-10 rounded-2xl border border-border/80 bg-surface/40 p-6 sm:p-8 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-ok animate-pulse" />
                <p className="text-sm font-semibold text-fg">Active Session Verified</p>
              </div>
              <p className="text-xs text-muted">You are currently signed in with full Studio access.</p>
              <div className="pt-2">
                <UserButton />
              </div>
              <div className="pt-4 border-t border-border/60">
                <Link to="/">
                  <Button className="w-full font-semibold shadow-lg shadow-accent/20">
                    Open Studio Dashboard →
                  </Button>
                </Link>
              </div>
            </div>
          </SignedIn>
        </ClientOnly>
      </div>

      {/* Right Column: Interactive Features Showcase */}
      <aside className="hidden flex-col justify-center border-l border-border/80 bg-gradient-to-br from-surface/60 via-surface/30 to-bg px-12 xl:px-16 lg:flex relative overflow-hidden">
        <div className="lattice-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="absolute top-1/4 right-1/4 size-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg space-y-8">
          <div>
            <span className="eyebrow text-accent">The Engineering Studio</span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight leading-snug text-fg">
              Master the system design architecture, then crack the interview.
            </h2>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Join thousands of senior, lead, and staff engineers mastering high-throughput distributed systems,
              concurrency, and AI engineering.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="space-y-4">
            <div className="grid gap-3">
              {PERKS.map((perk, idx) => {
                const Icon = perk.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-surface/40 p-4 backdrop-blur-md hover:border-accent/50 transition-colors"
                  >
                    <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-fg">{perk.title}</h3>
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">{perk.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 space-y-2">
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              {"★".repeat(5)}
            </div>
            <p className="text-xs text-fg/90 italic leading-relaxed">
              “The depth of the Kafka exactly-once blueprints and Uber dispatch state machines gave me the confidence to pass my Google L5 and Meta E5 loops.”
            </p>
            <div className="text-[11px] text-muted font-mono">— Staff Infrastructure Engineer</div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted border-t border-border/60 pt-4">
            <span>© {APP_NAME} Platform</span>
            <Link to="/pricing" className="text-accent hover:underline font-medium">
              View Lifetime Pricing →
            </Link>
          </div>
        </div>
      </aside>
    </main>
  );
}

function SignInPanel({ initialMode = "sign-in" }: { initialMode?: Mode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
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
      .catch(() => !cancelled && setMethods({ google: false, brokerCredentials: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  const brokerUsable =
    methods !== null &&
    (methods.brokerCredentials ||
      (typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com")));

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  // Password strength calculation
  const hasMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const strengthScore = [hasMinLength, hasLetter, hasNumberOrSpecial].filter(Boolean).length;

  function validate(): string | null {
    if (signingUp && !name.trim()) return "Please enter your name.";
    if (!EMAIL_PATTERN.test(email.trim())) return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    if (signingUp && password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
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
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === TEST_USER_CREDENTIALS.email.toLowerCase()) {
        await ensureTestUser();
      }

      const result = signingUp
        ? await authClient.signUp.email({ name: name.trim(), email: normalizedEmail, password })
        : await authClient.signIn.email({ email: normalizedEmail, password });

      if (result.error) {
        // Fallback retry for test user if not yet initialized in memory adapter
        if (!signingUp && normalizedEmail === TEST_USER_CREDENTIALS.email.toLowerCase()) {
          await ensureTestUser();
          const retry = await authClient.signIn.email({ email: normalizedEmail, password });
          if (!retry.error) {
            if (retry.data?.token) setBearerToken(retry.data.token);
            await navigate({ to: "/" });
            return;
          }
        }
        setError(describeError(result.error));
        setBusy(false);
        return;
      }
      if (result.data?.token) {
        setBearerToken(result.data.token);
      }
      await navigate({ to: "/" });
    } catch {
      setError("Could not reach authentication server. Check your connection.");
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
    <div className="mt-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">
          {signingUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted">
          {signingUp
            ? "Sign up to unlock the complete studio, worked examples, and interactive labs."
            : "Sign in to pick up where you left off in your curriculum."}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        role="tablist"
        aria-label="Sign in or create an account"
        className="grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-inset/60 p-1 backdrop-blur-md"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          onClick={() => switchMode("sign-in")}
          className={cn(
            "h-10 rounded-lg text-xs sm:text-sm font-medium transition-all",
            mode === "sign-in"
              ? "bg-surface text-fg shadow-sm font-semibold border border-border/60"
              : "text-muted hover:text-fg"
          )}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-up"}
          onClick={() => switchMode("sign-up")}
          className={cn(
            "h-10 rounded-lg text-xs sm:text-sm font-medium transition-all",
            mode === "sign-up"
              ? "bg-surface text-fg shadow-sm font-semibold border border-border/60"
              : "text-muted hover:text-fg"
          )}
        >
          Create Account
        </button>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {signingUp && (
          <div className="space-y-1.5">
            <label htmlFor="name-input" className="eyebrow text-muted text-[10px]">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Jane Doe"
                className={INPUT}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email-input" className="eyebrow text-muted text-[10px]">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="engineer@company.com"
              className={INPUT}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password-input" className="eyebrow text-muted text-[10px]">
              Password
            </label>
            {!signingUp && (
              <span className="text-[11px] text-muted hover:text-accent cursor-pointer">
                Forgot password?
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signingUp ? "new-password" : "current-password"}
              placeholder="••••••••"
              className={cn(INPUT, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-fg transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Interactive Password Strength Indicator */}
          {signingUp && password.length > 0 && (
            <div className="space-y-1.5 pt-1 animate-fade-in">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all",
                      strengthScore >= level
                        ? level === 1
                          ? "bg-amber-500"
                          : level === 2
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                        : "bg-border/60"
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>
                  Strength:{" "}
                  <strong className="text-fg">
                    {strengthScore === 1 ? "Weak" : strengthScore === 2 ? "Moderate" : "Strong"}
                  </strong>
                </span>
                <span className={cn(hasMinLength ? "text-ok" : "text-muted")}>
                  {hasMinLength ? "✓ 8+ chars" : "At least 8 chars"}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-bad/30 bg-bad/10 p-3 text-xs text-bad leading-relaxed flex items-start gap-2 animate-fade-in">
            <span className="shrink-0 font-bold">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold shadow-lg shadow-accent/20"
          disabled={busy}
        >
          {busy
            ? signingUp
              ? "Creating your account…"
              : "Signing in…"
            : signingUp
            ? "Create Lifetime Account"
            : "Sign In to Studio"}
        </Button>
      </form>

      {/* Social / OAuth Sign In */}
      {methods?.google || brokerUsable ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border/70" />
            or continue with
            <span className="h-px flex-1 bg-border/70" />
          </div>
          <div className="space-y-2">
            {methods?.google && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full text-xs sm:text-sm font-medium border border-border/70"
                disabled={busy}
                onClick={continueWithGoogle}
              >
                Continue with Google
              </Button>
            )}
            {brokerUsable && <SignInButtons />}
          </div>
        </div>
      ) : null}

      <div className="border-t border-border/60 pt-4 text-center">
        <p className="text-[11px] leading-5 text-muted">
          By signing in, you agree to the Terms of Service and Privacy Policy.
          Your progress, completed labs, and study notes sync across devices.
        </p>
      </div>
    </div>
  );
}
