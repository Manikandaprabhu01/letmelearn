import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Bot,
  Boxes,
  BrainCircuit,
  Building2,
  Coffee,
  Database,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Terminal,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { RequireSignIn } from "@/components/auth/RequireSignIn";
import { AccountStrip } from "@/components/layout/AccountStrip";
import { BackButton } from "@/components/layout/BackButton";
import { DisplayControl } from "@/components/layout/DisplayControl";
import { LogoMark } from "@/components/layout/Logo";
import { CommandSearch } from "@/components/search/CommandSearch";
import { Button } from "@/components/ui/button";
import { APP_NAME, NAV_GROUPS, NAV_HOME, type NavItemConfig } from "@/data/nav";
import { useTrackProgress } from "@/lib/track-progress";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Coffee,
  BrainCircuit,
  Boxes,
  Network,
  Workflow,
  Bot,
  Building2,
  FlaskConical,
  Terminal,
  BookOpen,
  Database,
};

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

/** One item of the menu: image/icon avatar, label, subtitle, badge, and active state. */
function NavItem({
  item,
  active,
  collapsed = false,
  onNavigate,
}: {
  item: NavItemConfig;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const progress = useTrackProgress(item.to);
  const Icon = ICON_MAP[item.iconName] || LayoutDashboard;

  if (collapsed) {
    return (
      <Link
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={`${item.label} · ${item.subtitle}`}
        className={cn(
          "group relative flex size-11 items-center justify-center rounded-xl mx-auto transition-all duration-200",
          active
            ? "bg-accent/20 text-fg shadow-sm ring-1 ring-accent/40"
            : "text-muted hover:bg-raised/70 hover:text-fg hover:scale-105",
        )}
      >
        {active ? (
          <span
            className="absolute -left-1 top-2.5 bottom-2.5 w-1 rounded-r-full bg-cta shadow-[0_0_8px_rgba(228,242,34,0.7)]"
            aria-hidden
          />
        ) : null}

        <div
          className={cn(
            "relative size-8 rounded-lg overflow-hidden flex items-center justify-center border transition-all duration-200",
            item.color.bg,
            active
              ? cn(item.color.activeBorder, item.color.glow)
              : cn(item.color.border, "group-hover:border-accent/40"),
          )}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.label}
              className="size-full object-cover transition-transform duration-200 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <Icon className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:scale-110", item.color.text)} />
          )}
        </div>

        {/* Hover Tooltip in collapsed rail mode */}
        <div className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-lg bg-surface/95 px-3 py-2 text-xs shadow-xl border border-border/80 backdrop-blur-md group-hover:block whitespace-nowrap">
          <div className="font-medium text-fg flex items-center gap-1.5">
            <span>{item.label}</span>
            {item.badge ? (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-semibold bg-accent/20 text-accent">
                {item.badge}
              </span>
            ) : null}
          </div>
          <div className="text-[10.5px] text-muted">{item.subtitle}</div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-all duration-200",
        active
          ? cn("bg-accent/15 text-fg font-medium shadow-sm border border-accent/25", item.color.glow)
          : "text-muted hover:bg-raised/60 hover:text-fg hover:translate-x-0.5",
      )}
    >
      {/* Electric active line */}
      {active ? (
        <span
          className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-cta shadow-[0_0_10px_rgba(228,242,34,0.8)]"
          aria-hidden
        />
      ) : null}

      {/* Visual Image / Icon Avatar */}
      <div
        className={cn(
          "relative size-8 shrink-0 rounded-lg overflow-hidden flex items-center justify-center border transition-all duration-200 shadow-sm",
          item.color.bg,
          active
            ? cn(item.color.activeBorder, item.color.activeBg)
            : cn(item.color.border, "group-hover:border-accent/40 group-hover:scale-105"),
        )}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.label}
            className="size-full object-cover transition-transform duration-200 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <Icon className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:scale-110", item.color.text)} />
        )}
      </div>

      {/* Text Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate leading-tight font-medium text-fg/90 group-hover:text-fg">
            {item.label}
          </span>
          {item.badge ? (
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider",
                item.badgeVariant === "hot"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : item.badgeVariant === "new"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-surface text-faint border border-border",
              )}
            >
              {item.badge}
            </span>
          ) : progress && progress.done > 0 ? (
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-faint group-hover:text-muted">
              {progress.done}/{progress.total}
            </span>
          ) : null}
        </div>
        <div className="truncate text-[11px] text-muted/75 group-hover:text-muted">
          {item.subtitle}
        </div>
      </div>
    </Link>
  );
}

function NavLinks({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cn("flex flex-col", collapsed ? "gap-3" : "gap-5")}>
      <div className="flex flex-col gap-1">
        <NavItem
          item={NAV_HOME}
          active={isActive(pathname, NAV_HOME.to, NAV_HOME.match)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            <div className="my-1 h-px bg-border/50 mx-2" aria-hidden />
          ) : (
            <div className="eyebrow mb-1 px-2.5 text-[10px] font-mono tracking-wider text-faint/80 uppercase">
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              active={isActive(pathname, item.to, item.match)}
              collapsed={collapsed}
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("letmelearn.sidebar.collapsed") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const bare = BARE_LAYOUT_PATHS.has(pathname);
  const isPublic = PUBLIC_PATHS.has(pathname);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("letmelearn.sidebar.collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
      }
      if (e.key === "Escape") {
        setOpen(false);
        setSearch(false);
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
      {/* Mobile Header (< lg) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            className="text-fg"
          >
            <Menu className="size-5" />
          </Button>
          {pathname !== "/" && <BackButton compact />}
          <Link to="/" className="flex min-w-0 items-center gap-2 text-fg ml-1">
            <LogoMark className="size-6 shrink-0" />
            <span className="font-display text-[17px] font-medium tracking-tight">{APP_NAME}</span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <DisplayControl />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearch(true)}
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Overlay and Flyout (< lg) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[85vw] flex-col border-r border-border bg-bg/95 backdrop-blur-2xl shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 text-fg group"
          >
            <div className="relative">
              <LogoMark className="size-6 shrink-0" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-cta" />
            </div>
            <div>
              <div className="font-display text-[17px] font-medium leading-none tracking-tight">
                {APP_NAME}
              </div>
              <div className="eyebrow mt-1 text-[9px] text-accent tracking-widest">
                Studio 2.0
              </div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        </div>

        <div className="border-t border-border/80 p-3 bg-surface/30">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSearch(true);
            }}
            className="flex h-9 w-full items-center justify-between rounded-lg bg-inset/80 px-3 text-[13px] text-muted border border-border shadow-sm mb-3"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5 text-accent" />
              Quick Search
            </span>
            <kbd className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-faint">
              ⌘K
            </kbd>
          </button>
          <AccountStrip />
        </div>
      </aside>

      {/* Desktop Responsive Layout (>= lg) */}
      <div
        className={cn(
          "transition-[grid-template-columns] duration-200 ease-in-out lg:grid",
          collapsed
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh border-r border-border/80 bg-surface/35 backdrop-blur-xl lg:flex lg:flex-col transition-[width] duration-200 ease-in-out z-20",
            collapsed ? "w-[72px]" : "w-[260px]",
          )}
          aria-label="Sidebar navigation"
        >
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between px-3 border-b border-border/60">
            {collapsed ? (
              <Link
                to="/"
                className="mx-auto flex size-10 items-center justify-center rounded-xl bg-surface/80 hover:bg-raised transition-all"
                title={`${APP_NAME} - Studio`}
              >
                <LogoMark className="size-6 shrink-0" />
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-2.5 px-1.5 text-fg group">
                <div className="relative">
                  <LogoMark className="size-7 transition-transform group-hover:scale-105" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-cta animate-soft-pulse" />
                </div>
                <div>
                  <div className="font-display text-[18px] leading-none tracking-tight font-medium text-fg">
                    {APP_NAME}
                  </div>
                  <div className="eyebrow mt-1 text-[9.5px] tracking-widest text-accent">Studio 2.0</div>
                </div>
              </Link>
            )}

            {!collapsed ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar (⌘B)"
                title="Collapse sidebar (⌘B)"
                className="text-muted hover:text-fg"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            ) : null}
          </div>

          {/* Nav Links */}
          <div className={cn("flex-1 overflow-y-auto pb-4 pt-3", collapsed ? "px-2" : "px-3")}>
            <NavLinks pathname={pathname} collapsed={collapsed} />
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-border/70 p-2.5 bg-surface/30">
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearch(true)}
                  title="Quick Search (⌘K)"
                  className="size-9 rounded-xl text-muted hover:text-fg hover:bg-raised"
                >
                  <Search className="size-4 text-accent" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleCollapse}
                  title="Expand sidebar (⌘B)"
                  className="size-9 rounded-xl text-muted hover:text-fg hover:bg-raised"
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
                <div className="mt-1">
                  <AccountStrip compact />
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setSearch(true)}
                  className="flex h-9 w-full items-center justify-between rounded-lg bg-inset/80 px-3 text-[13px] text-muted border border-border/70 shadow-sm transition-all duration-150 hover:border-accent/40 hover:text-fg hover:bg-raised/70"
                >
                  <span className="flex items-center gap-2">
                    <Search className="size-3.5 text-accent" />
                    Quick Search
                  </span>
                  <kbd className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-faint">
                    ⌘K
                  </kbd>
                </button>
                <div className="mt-2.5">
                  <AccountStrip />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content Viewport */}
        <div className="min-w-0">
          <div className="sticky top-0 z-20 hidden h-12 items-center justify-between border-b border-border/80 bg-bg/75 px-6 backdrop-blur-xl lg:flex">
            <div className="flex items-center gap-2">
              {collapsed ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleCollapse}
                  title="Expand sidebar (⌘B)"
                  className="mr-1 text-muted hover:text-fg"
                >
                  <PanelLeftOpen className="size-4" />
                </Button>
              ) : null}
              {pathname !== "/" && <BackButton />}
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/interview-prep"
                className="text-xs font-mono text-muted hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <Building2 className="size-3.5 text-amber-400" />
                Interview Console
              </Link>
              <span className="text-border-strong">&bull;</span>
              <Link
                to="/playgrounds"
                className="text-xs font-mono text-muted hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <FlaskConical className="size-3.5 text-pink-400" />
                Labs
              </Link>
              <div className="ml-2 pl-3 border-l border-border/70 flex items-center">
                <DisplayControl />
              </div>
            </div>
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
