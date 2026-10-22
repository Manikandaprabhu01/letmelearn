import { useCallback, useState } from "react";

/**
 * Which answer cards are open. A card's body only renders once it is open, so
 * a 65-question sheet does not ship 65 full answers in its first HTML.
 */
export function useOpenCards() {
  const [open, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  const setOpen = useCallback((id: string, next: boolean) => {
    setOpenIds((prev) => {
      if (prev.has(id) === next) return prev;
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }, []);

  /** Open a card and bring it into view — for links like `answers#q-3`. */
  const reveal = useCallback(
    (id: string) => {
      setOpen(id, true);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    },
    [setOpen],
  );

  const isOpen = (id: string) => open.has(id);
  const allOpen = (ids: string[]) => ids.length > 0 && ids.every((id) => open.has(id));
  const toggleAll = (ids: string[]) => setOpenIds(allOpen(ids) ? new Set() : new Set(ids));

  return { isOpen, setOpen, reveal, allOpen, toggleAll };
}
