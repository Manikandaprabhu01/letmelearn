import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/toc";
import { cn } from "@/lib/utils";

/**
 * Sticky "on this page" rail. Rendered beside the article on wide screens and
 * as a collapsed strip above the content on narrow ones.
 */
export function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id);

  useEffect(() => {
    const targets = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 3) return null;

  let lastGroup: string | undefined;

  return (
    <nav aria-label="On this page" className="text-sm">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">On this page</div>
      <ul className="mt-3 space-y-1 border-l border-border">
        {entries.map((e) => {
          const showGroup = e.group && e.group !== lastGroup;
          lastGroup = e.group;
          return (
            <li key={e.id}>
              {showGroup ? (
                <div className="mt-3 pl-3 text-[10px] font-medium uppercase tracking-[0.14em] text-faint first:mt-0">
                  {e.group}
                </div>
              ) : null}
              <a
                href={`#${e.id}`}
                className={cn(
                  "-ml-px block border-l py-1 pl-3 text-[13px] leading-5 transition-colors",
                  active === e.id
                    ? "border-accent text-fg"
                    : "border-transparent text-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {e.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
