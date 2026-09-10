import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProgressState = {
  done: Record<string, true>;
  mark: (id: string) => void;
  unmark: (id: string) => void;
  toggle: (id: string) => void;
  isDone: (id: string) => boolean;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      done: {},
      mark: (id) => set((s) => ({ done: { ...s.done, [id]: true } })),
      unmark: (id) =>
        set((s) => {
          const next = { ...s.done };
          delete next[id];
          return { done: next };
        }),
      toggle: (id) => {
        if (get().done[id]) get().unmark(id);
        else get().mark(id);
      },
      isDone: (id) => Boolean(get().done[id]),
    }),
    { name: "lattice-progress" },
  ),
);
