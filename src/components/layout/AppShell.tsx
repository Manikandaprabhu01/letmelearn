import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountStrip } from "@/components/layout/AccountStrip";
import { BackButton } from "@/components/layout/BackButton";
import { LogoMark } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CommandSearch } from "@/components/search/CommandSearch";
import { Button } from "@/components/ui/button";
import { APP_NAME, NAV } from "@/data/nav";
import { cn } from "@/lib/utils";

/**
 * Routes that bring their own full-page chrome (their own header, their own
 * hero). Wrapping these in the studio sidebar would frame a landing page inside
 * the product it is trying to sell.
 */
const BARE_LAYOUT_PATHS = new Set(["/welcome", "/login"]);

function isActive(pathname: string, to: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = isActive(pathname, item.to, item.match);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors duration-150",
              active ? "bg-raised text-fg" : "text-muted hover:bg-raised/60 hover:text-fg",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const bare = BARE_LAYOUT_PATHS.has(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // After every hook — an early return above them would change hook order
  // between a bare route and a studio route.
  if (bare) return <div className="min-h-dvh bg-bg text-fg">{children}</div>;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-bg/90 px-3 backdrop-blur-sm lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <BackButton compact />
          <Link to="/" className="flex min-w-0 items-center gap-2 text-fg">
            <LogoMark className="size-6 shrink-0" />
            <span className="font-display text-lg tracking-tight">{APP_NAME}</span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearch(true)}
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-bg/95 px-4 pb-8 pt-16 lg:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="mt-4 border-t border-border pt-4">
            <AccountStrip />
          </div>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh border-r border-border lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2.5 px-5 py-5 text-fg">
            <LogoMark />
            <div>
              <div className="font-display text-xl leading-none tracking-tight">{APP_NAME}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-faint">
                System design
              </div>
            </div>
          </Link>
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            <NavLinks pathname={pathname} />
          </div>
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-raised px-3 text-xs text-muted hover:text-fg"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" />
                Search
              </span>
              <kbd className="font-mono text-[10px] text-faint">⌘K</kbd>
            </button>
            <div className="mt-3">
              <AccountStrip />
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <div className="sticky top-0 z-20 hidden h-12 items-center justify-between border-b border-border bg-bg/90 px-5 backdrop-blur-sm lg:flex">
            <BackButton />
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>

      {search ? <CommandSearch onClose={() => setSearch(false)} /> : null}
    </div>
  );
}
