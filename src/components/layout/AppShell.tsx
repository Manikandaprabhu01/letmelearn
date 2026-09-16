import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { RequireSignIn } from "@/components/auth/RequireSignIn";
import { AccountStrip } from "@/components/layout/AccountStrip";
import { BackButton } from "@/components/layout/BackButton";
import { LogoMark } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CommandSearch } from "@/components/search/CommandSearch";
import { Button } from "@/components/ui/button";
import { APP_NAME, NAV_GROUPS, NAV_HOME } from "@/data/nav";
import { useTrackProgress } from "@/lib/track-progress";
import { cn } from "@/lib/utils";

/**
 * Routes that bring their own full-page chrome (their own header, their own
 * hero). Wrapping these in the studio sidebar would frame a landing page inside
 * the product it is trying to sell.
 */
const BARE_LAYOUT_PATHS = new Set(["/welcome", "/login"]);

/**
 * Readable without signing in. Everything else is the studio, which
 * `RequireSignIn` sends signed-out visitors away from.
 *
 * Pricing is public on purpose: asking someone to sign in before they can see
 * what the thing costs loses the sale.
 */
const PUBLIC_PATHS = new Set([...BARE_LAYOUT_PATHS, "/pricing"]);

function isActive(pathname: string, to: string, match: "exact" | "prefix") {
  if (match === "exact") return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** One row of the menu: label, how far through it you are, and the active mark. */
function NavItem({
  to,
  label,
  active,
  onNavigate,
}: {
  to: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  const progress = useTrackProgress(to);
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center justify-between gap-2 rounded-sm py-1.5 pl-3 pr-2 text-[13px] transition-colors duration-150",
        active ? "bg-raised text-fg" : "text-muted hover:bg-raised/60 hover:text-fg",
      )}
    >
      {/* The single electric accent, used as a position marker. */}
      {active ? (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-cta" aria-hidden />
      ) : null}
      <span className="truncate">{label}</span>
      {progress && progress.done > 0 ? (
        <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-faint">
          {progress.done}/{progress.total}
        </span>
      ) : null}
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <NavItem
          to={NAV_HOME.to}
          label={NAV_HOME.label}
          active={isActive(pathname, NAV_HOME.to, NAV_HOME.match)}
          onNavigate={onNavigate}
        />
      </div>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <div className="eyebrow mb-1 pl-3">{group.label}</div>
          {group.items.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              active={isActive(pathname, item.to, item.match)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const bare = BARE_LAYOUT_PATHS.has(pathname);
  const isPublic = PUBLIC_PATHS.has(pathname);

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

  const shell = (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-bg/80 px-3 backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <BackButton compact />
          <Link to="/" className="flex min-w-0 items-center gap-2 text-fg">
            <LogoMark className="size-6 shrink-0" />
            <span className="font-display text-[17px] tracking-tight">{APP_NAME}</span>
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
        <div className="fixed inset-0 z-20 overflow-y-auto bg-bg px-4 pb-8 pt-18 lg:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="mt-8 border-t border-border pt-4">
            <AccountStrip />
          </div>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh border-r border-border lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-2.5 px-4 py-5 text-fg">
            <LogoMark />
            <div>
              <div className="font-display text-[19px] leading-none tracking-tight">{APP_NAME}</div>
              <div className="eyebrow mt-1.5">System design</div>
            </div>
          </Link>
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            <NavLinks pathname={pathname} />
          </div>
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="flex h-9 w-full items-center justify-between rounded-sm bg-raised px-3 text-[13px] text-muted shadow-panel transition-colors duration-150 hover:text-fg"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" />
                Search
              </span>
              <kbd className="font-mono text-[10.5px] text-faint">⌘K</kbd>
            </button>
            <div className="mt-3">
              <AccountStrip />
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <div className="sticky top-0 z-20 hidden h-12 items-center justify-between border-b border-border bg-bg/80 px-5 backdrop-blur-md lg:flex">
            <BackButton />
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>

      {search ? <CommandSearch onClose={() => setSearch(false)} /> : null}
    </div>
  );

  if (isPublic) return shell;
  return <RequireSignIn>{shell}</RequireSignIn>;
}
