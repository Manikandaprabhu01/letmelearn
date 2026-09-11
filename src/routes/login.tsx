import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { ClientOnly } from "@/components/auth/ClientOnly";
import { LogoMark } from "@/components/layout/Logo";
import { SignInButtons, SignedIn, SignedOut } from "@/lib/auth/gates";
import { APP_NAME } from "@/data/nav";

export const Route = createFileRoute("/login")({ component: LoginPage });

const INCLUDED = [
  "26 HLD concepts and 19 LLD concepts",
  "41 system design examples at chapter depth",
  "The AI FDE Roadmap — 8 steps, 80 concepts",
  "Java & Spring Boot — 20 chapters",
  "8 interactive labs",
];

function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: the sign-in itself */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2.5 text-fg">
            <LogoMark className="size-8" />
            <span className="font-display text-2xl tracking-tight">{APP_NAME}</span>
          </Link>

          <h1 className="mt-10 font-display text-3xl font-medium tracking-tight">Sign in</h1>
          <p className="mt-2 text-[15px] leading-7 text-muted">
            Use your existing account — no new password to remember.
          </p>

          <div className="mt-8">
            <ClientOnly fallback={<div className="h-24" aria-hidden />}>
              <SignedOut>
                <SignInButtons />
              </SignedOut>
              <SignedIn>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-sm text-fg">You are already signed in.</p>
                  <Link to="/" className="mt-3 inline-flex text-sm text-accent hover:underline">
                    Go to the studio →
                  </Link>
                </div>
              </SignedIn>
            </ClientOnly>
          </div>

          <p className="mt-8 text-xs leading-6 text-faint">
            By continuing you agree to the terms of use. We only ever read your name, email and
            avatar from the provider.
          </p>
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
