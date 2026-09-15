import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { FRESHWORKS_LEAD, type ConsoleLocation } from "@/components/interview/console-shared";
import { COMPANY_INDEX, LEVELS, SECTORS } from "@/data/interview/meta";
import { useInterviewPrefs, useRestoreInterviewPrefs } from "@/lib/interview-prefs";
import { cn } from "@/lib/utils";

/** Page frame for every console page: filter bar, company menu (wide screens), content. */
export function ConsoleLayout({
  current,
  showLevels = true,
  showLang = true,
  searchLabel = "Search questions",
  children,
}: {
  current?: ConsoleLocation;
  showLevels?: boolean;
  showLang?: boolean;
  searchLabel?: string;
  children: ReactNode;
}) {
  useRestoreInterviewPrefs();
  return (
    <div className="px-5 sm:px-8 lg:px-12">
      <Toolbar
        current={current}
        showLevels={showLevels}
        showLang={showLang}
        searchLabel={searchLabel}
      />
      <div className="xl:grid xl:grid-cols-[200px_minmax(0,1fr)] xl:gap-10">
        <CompanyNav current={current} />
        <main className="min-w-0 pb-16 pt-8">{children}</main>
      </div>
    </div>
  );
}

function Toolbar({
  current,
  showLevels,
  showLang,
  searchLabel,
}: {
  current?: ConsoleLocation;
  showLevels: boolean;
  showLang: boolean;
  searchLabel: string;
}) {
  const level = useInterviewPrefs((s) => s.level);
  const setLevel = useInterviewPrefs((s) => s.setLevel);
  const lang = useInterviewPrefs((s) => s.lang);
  const setLang = useInterviewPrefs((s) => s.setLang);
  const query = useInterviewPrefs((s) => s.query);
  const setQuery = useInterviewPrefs((s) => s.setQuery);

  return (
    // Sticks under the app's own top bar: h-14 below lg, h-12 from lg. On phones
    // it wraps to several rows, so it scrolls away there instead.
    <div className="z-10 -mx-5 border-b border-border bg-bg/95 px-5 py-2.5 backdrop-blur-sm sm:sticky sm:top-14 sm:-mx-8 sm:px-8 lg:top-12 lg:-mx-12 lg:px-12">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          to="/interview-prep"
          className="font-display text-[15px] tracking-tight text-fg hover:text-accent"
        >
          Interview Prep Console
        </Link>
        <CompanySelect current={current} />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {showLevels ? (
            <div role="group" aria-label="Role level" className="flex flex-wrap gap-1">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "h-8 whitespace-nowrap rounded-md border px-2.5 text-[12px] transition-colors duration-150",
                    level === l
                      ? "border-fg bg-fg text-bg"
                      : "border-border text-muted hover:text-fg",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          ) : null}
          <label className="relative flex items-center">
            <span className="sr-only">{searchLabel}</span>
            <Search className="pointer-events-none absolute left-2.5 size-3.5 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${searchLabel}…`}
              className="h-8 w-48 rounded-md border border-border bg-inset pl-8 pr-2 text-[13px] text-fg placeholder:text-faint focus:border-accent focus:outline-none"
            />
          </label>
          {showLang ? (
            <div
              role="group"
              aria-label="Code language"
              className="flex h-8 overflow-hidden rounded-md border border-border"
            >
              {(["java", "py"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2.5 font-mono text-[12px]",
                    lang === l ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {l === "java" ? "Java" : "Python"}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Company picker for screens too narrow for the side menu. */
function CompanySelect({ current }: { current?: ConsoleLocation }) {
  const navigate = useNavigate();
  return (
    <select
      aria-label="Company"
      value={current?.id ?? ""}
      onChange={(e) => {
        const slug = e.target.value;
        if (!slug) void navigate({ to: "/interview-prep" });
        else if (slug === FRESHWORKS_LEAD) void navigate({ to: "/interview-prep/freshworks-lead" });
        else if (current?.view === "answers")
          void navigate({ to: "/interview-prep/$slug/answers", params: { slug } });
        else void navigate({ to: "/interview-prep/$slug", params: { slug } });
      }}
      className="h-8 max-w-[13rem] rounded-md border border-border bg-inset px-2 text-[13px] text-fg focus:border-accent focus:outline-none xl:hidden"
    >
      <option value="">All companies</option>
      {SECTORS.map((s) => (
        <optgroup key={s.id} label={s.name}>
          {COMPANY_INDEX.filter((c) => c.sector === s.id).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
      <optgroup label="Deep dives">
        <option value={FRESHWORKS_LEAD}>Freshworks Lead SE</option>
      </optgroup>
    </select>
  );
}

const navItem = (active: boolean) =>
  cn(
    "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150",
    active ? "bg-raised text-fg" : "text-muted hover:bg-raised/60 hover:text-fg",
  );

const subItem = (active: boolean) =>
  cn(
    "block rounded-md px-2.5 py-1 text-[12.5px]",
    active ? "font-medium text-accent" : "text-muted hover:text-fg",
  );

function GroupLabel({ children, dot }: { children: ReactNode; dot?: string }) {
  return (
    <div className="mb-1 flex items-center gap-2 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
      {dot ? <span className={cn("size-1.5 rounded-full", dot)} aria-hidden /> : null}
      {children}
    </div>
  );
}

function CompanyNav({ current }: { current?: ConsoleLocation }) {
  return (
    <nav
      aria-label="Companies"
      className="hidden xl:sticky xl:top-28 xl:block xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:pb-8 xl:pr-1 xl:pt-8"
    >
      {SECTORS.map((s) => (
        <div key={s.id} className="mb-5">
          <GroupLabel dot={s.dot}>{s.name}</GroupLabel>
          {COMPANY_INDEX.filter((c) => c.sector === s.id).map((c) => (
            <div key={c.id}>
              <Link
                to="/interview-prep/$slug"
                params={{ slug: c.id }}
                className={navItem(current?.id === c.id)}
              >
                <span className="truncate">{c.name}</span>
                <span className="font-mono text-[10.5px] text-faint">{c.questions}</span>
              </Link>
              {current && current.id === c.id ? (
                <div className="my-1 ml-3 border-l border-border pl-1">
                  <Link
                    to="/interview-prep/$slug"
                    params={{ slug: c.id }}
                    className={subItem(current.view === "bank")}
                  >
                    Question bank
                  </Link>
                  <Link
                    to="/interview-prep/$slug/answers"
                    params={{ slug: c.id }}
                    className={subItem(current.view === "answers")}
                  >
                    Answer sheet
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}
      <div>
        <GroupLabel>Deep dives</GroupLabel>
        <Link
          to="/interview-prep/freshworks-lead"
          className={navItem(current?.id === FRESHWORKS_LEAD)}
        >
          Freshworks Lead SE
        </Link>
        {current && current.id === FRESHWORKS_LEAD ? (
          <div className="my-1 ml-3 border-l border-border pl-1">
            <Link to="/interview-prep/freshworks-lead" className={subItem(current.view === "bank")}>
              Question bank
            </Link>
            <Link
              to="/interview-prep/freshworks-lead/answers"
              className={subItem(current.view === "answers")}
            >
              Answer sheet
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
