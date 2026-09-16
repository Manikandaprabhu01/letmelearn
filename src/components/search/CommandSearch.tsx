import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchCatalog } from "@/data/catalog";
import { AppLink } from "@/lib/paths";

export function CommandSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchCatalog(q, 10), [q]);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hits.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 px-4 pt-[12vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-panel">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-faint" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Search concepts, examples, labs"
            className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-faint hover:text-fg"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {hits.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches.</li>
          ) : (
            hits.map((hit, i) => (
              <li key={hit.path}>
                <AppLink
                  path={hit.path}
                  onClick={onClose}
                  className={`block rounded-md px-3 py-2 ${i === active ? "bg-raised" : "hover:bg-raised/60"}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{hit.title}</span>
                    <span className="eyebrow">{hit.kind}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{hit.subtitle}</p>
                </AppLink>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
