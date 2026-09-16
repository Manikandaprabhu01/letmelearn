import { useEffect, useMemo, useState } from "react";
import { DifficultyChip, LeetCodeChip } from "@/components/interview/Chips";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { FreshworksHeader } from "@/components/interview/FreshworksHeader";
import { FRESHWORKS_LEAD, chipClass, sourceChipClass } from "@/components/interview/console-shared";
import { FRESHWORKS_ROUNDS, FRESHWORKS_SOURCES } from "@/data/interview/freshworks-lead";
import type { DeepGroupType } from "@/data/interview/types";
import { useInterviewPrefs } from "@/lib/interview-prefs";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

// Outside the route file for the same reason as FreshworksAnswers: SOURCE_LABEL
// is built from data at module level, which code splitting cannot move.

type Filter = "all" | DeepGroupType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "coding", label: "Coding" },
  { id: "hld", label: "System design" },
  { id: "lld", label: "LLD" },
  { id: "concepts", label: "Concepts" },
  { id: "behavioral", label: "Behavioural" },
];

const REPEATED = [
  {
    count: "6×",
    title: "Design an API rate limiter",
    detail:
      "Came up in round 1, round 2 or the bar raiser. One panel changed the scope mid-interview.",
  },
  {
    count: "5×",
    title: "LRU cache / cache system",
    detail: "Asked as a coding problem in round 1, or as an LLD in round 2.",
  },
  {
    count: "all",
    title: "Deep dive on your current system",
    detail: "Draw its architecture, defend your choices, and say what you would improve.",
  },
  {
    count: "4×",
    title: "DB indexing & consistent hashing",
    detail: "Asked as quick concept checks inside coding and design rounds.",
  },
  {
    count: "3×",
    title: "Web crawler to depth N",
    detail:
      "Given a start URL and a depth, return up to ~100K URLs. Usually asked by a Staff engineer.",
  },
  {
    count: "2×",
    title: "Logging system design",
    detail: "Came up in Lead loops: a log management system, and distributed logging.",
  },
];

const SOURCE_LABEL = new Map(FRESHWORKS_SOURCES.map((s) => [s.id, s.label]));

/** Practice ticks come from a per-browser store the server cannot see. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function FreshworksBank() {
  const [filter, setFilter] = useState<Filter>("all");
  const [leadOnly, setLeadOnly] = useState(false);
  const query = useInterviewPrefs((s) => s.query)
    .trim()
    .toLowerCase();
  const done = useProgress((s) => s.done);
  const toggle = useProgress((s) => s.toggle);
  const hydrated = useHydrated();

  const rounds = useMemo(
    () =>
      FRESHWORKS_ROUNDS.map((r) => ({
        ...r,
        groups: r.groups
          .filter((g) => filter === "all" || g.type === filter)
          .map((g) => ({
            ...g,
            // The key is taken before filtering, so a tick survives any filter.
            items: g.items
              .map((it, i) => ({ it, key: `fw:${r.n}-${g.type}-${i}` }))
              .filter(
                ({ it }) =>
                  (!leadOnly || it.s.some((s) => s.startsWith("L"))) &&
                  (!query || `${it.q} ${it.n ?? ""}`.toLowerCase().includes(query)),
              ),
          }))
          .filter((g) => g.items.length > 0),
      })),
    [filter, leadOnly, query],
  );

  const shown = rounds.flatMap((r) => r.groups.flatMap((g) => g.items));
  const practiced = hydrated ? shown.filter((x) => done[x.key]).length : 0;
  const pct = shown.length ? (100 * practiced) / shown.length : 0;

  return (
    <ConsoleLayout
      current={{ id: FRESHWORKS_LEAD, view: "bank" }}
      showLevels={false}
      showLang={false}
    >
      <FreshworksHeader view="bank" />

      <nav
        aria-label="Interview loop"
        className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-5"
      >
        {FRESHWORKS_ROUNDS.map((r) => (
          <a
            key={r.id}
            href={`#${r.id}`}
            className="flex flex-col gap-1 bg-surface px-4 py-3 transition-colors duration-150 hover:bg-raised"
          >
            <span className="font-mono text-[11px] text-accent">Round {r.n}</span>
            <span className="text-[13.5px] font-medium leading-5 text-fg">{r.name}</span>
            <span className="text-xs text-faint">{r.meta.split(" · ")[0]}</span>
          </a>
        ))}
      </nav>
      <p className="mt-3 max-w-3xl text-[13.5px] leading-6 text-muted">
        <span className="font-medium text-fg">Hiring-drive format</span> (Bengaluru, Hyderabad,
        Chennai): rounds 1–3 run on one day, in person, with two interviewers per round and code
        written on paper. Some drives run separate LLD and HLD rounds in place of the bar raiser.
        Each round is scored Strong Hire, Hire or Neutral. Lead loops continue with a hiring manager
        round and a culture-fit round, and candidates report rejections at both.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl tracking-tight">Asked again and again</h2>
        <p className="mt-1 text-sm text-muted">
          These topics came up in the most reports. Prepare them first.
        </p>
        <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
          {REPEATED.map((r) => (
            <li
              key={r.title}
              className="grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-3 border-t border-border py-3"
            >
              <span className="font-mono text-lg tabular-nums text-accent">{r.count}</span>
              <span>
                <span className="font-medium text-fg">{r.title}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-muted">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <div role="group" aria-label="Question type" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-8 rounded-full border px-3 text-[13px] transition-colors duration-150",
                filter === f.id
                  ? "border-fg bg-fg text-bg"
                  : "border-border text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={leadOnly}
              onChange={(e) => setLeadOnly(e.target.checked)}
              className="size-4 accent-accent"
            />
            Lead reports only
          </label>
          <span className="flex items-center gap-2 font-mono text-[12.5px] tabular-nums text-fg">
            {practiced} / {shown.length} practised
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-raised" aria-hidden>
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </span>
          </span>
        </div>
      </div>

      {rounds.map((r) => (
        <section key={r.id} id={r.id} className="mt-12 scroll-mt-32">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-b-2 border-fg pb-4">
            <span className="row-span-3 font-display text-5xl leading-none text-accent">{r.n}</span>
            <h2 className="font-display text-xl tracking-tight">{r.name}</h2>
            <p className="font-mono text-[12px] leading-5 text-faint">{r.meta}</p>
            <p className="mt-1 max-w-prose text-[14px] leading-6 text-muted">{r.tests}</p>
          </div>
          {r.groups.length === 0 ? (
            <p className="py-4 text-sm text-faint">No questions match this filter in this round.</p>
          ) : (
            r.groups.map((g) => (
              <div key={g.type} className="mt-6">
                <h3 className="eyebrow">
                  {g.title} <span className="text-faint">{g.items.length}</span>
                </h3>
                <ul className="mt-1">
                  {g.items.map(({ it, key }) => {
                    const isDone = hydrated && Boolean(done[key]);
                    return (
                      <li
                        key={key}
                        className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b border-border py-3 sm:grid-cols-[1.25rem_minmax(0,1fr)_auto]"
                      >
                        <input
                          id={key}
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggle(key)}
                          aria-label="Mark as practised"
                          className="mt-1 size-4 cursor-pointer accent-accent"
                        />
                        <label
                          htmlFor={key}
                          className={cn(
                            "cursor-pointer text-[14.5px] font-medium leading-6",
                            isDone ? "text-faint line-through" : "text-fg",
                          )}
                        >
                          {it.q}
                        </label>
                        <span className="col-start-2 flex flex-wrap items-start gap-1 sm:col-start-3 sm:max-w-[16rem] sm:justify-end">
                          {it.s.length > 1 ? (
                            <span
                              className={cn(chipClass, "bg-fg text-bg")}
                              title={`Seen in ${it.s.length} reports`}
                            >
                              ×{it.s.length}
                            </span>
                          ) : null}
                          <DifficultyChip d={it.d} />
                          <LeetCodeChip lc={it.lc} slug={it.slug} approx={it.approx} />
                          {it.s.map((s) => (
                            <a
                              key={s}
                              href={`#src-${s}`}
                              title={SOURCE_LABEL.get(s)}
                              className={sourceChipClass(s)}
                            >
                              {s}
                            </a>
                          ))}
                        </span>
                        {it.n ? (
                          <p className="col-start-2 text-[13px] leading-6 text-muted sm:col-span-2">
                            {it.n}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      ))}

      <section className="mt-14 border-t-2 border-fg pt-6">
        <h2 className="font-display text-xl tracking-tight">Sources</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Highlighted tags (L1–L7) come from Lead and Tech Lead loops. Dashed tags (S1–S10) come
          from Senior and SDE-2 loops at the same panels.
        </p>
        <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
          {FRESHWORKS_SOURCES.map((s) => {
            const [who, rest] = s.label.split(" — ");
            return (
              <li
                key={s.id}
                id={`src-${s.id}`}
                className="grid scroll-mt-32 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t border-border py-2.5 text-[13.5px]"
              >
                <span
                  className={cn(
                    "font-mono text-xs leading-6",
                    s.id.startsWith("L") ? "text-accent" : "text-faint",
                  )}
                >
                  {s.id}
                </span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {who}
                  {rest ? <span className="block text-[12.5px] text-muted">{rest}</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 max-w-prose text-[13px] leading-6 text-muted">
          Candidates say Freshworks often changes LeetCode problems slightly, so practise the
          pattern rather than the exact problem. Where a candidate described a problem without
          naming it, the LeetCode number is the closest match and is marked ≈. Your ticks are saved
          in this browser.
        </p>
      </section>
    </ConsoleLayout>
  );
}
