import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LEVEL, isLevel } from "@/data/interview/meta";
import type { Level } from "@/data/interview/types";

export type CodeLang = "java" | "py";

type InterviewPrefs = {
  level: Level;
  lang: CodeLang;
  query: string;
  setLevel: (level: Level) => void;
  setLang: (lang: CodeLang) => void;
  setQuery: (query: string) => void;
};

/**
 * The console's filters: role level, code language and search.
 *
 * Level and language persist per browser. Search does not — it would come back
 * as a mysteriously empty question bank a week later.
 */
export const useInterviewPrefs = create<InterviewPrefs>()(
  persist(
    (set) => ({
      level: DEFAULT_LEVEL,
      lang: "java",
      query: "",
      setLevel: (level) => set({ level }),
      setLang: (lang) => set({ lang }),
      setQuery: (query) => set({ query }),
    }),
    {
      name: "letmelearn-interview-prefs",
      partialize: (s) => ({ level: s.level, lang: s.lang }),
      // Storage is user-editable, so validate rather than trust it.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<InterviewPrefs>;
        return {
          ...current,
          level: isLevel(p.level) ? p.level : current.level,
          lang: p.lang === "py" ? "py" : "java",
        };
      },
      // The level decides which questions render, so restoring it during the
      // first client render would not match the server's HTML. Rehydrate after
      // mount instead — see useRestoreInterviewPrefs.
      skipHydration: true,
    },
  ),
);

/** Call once per console page to restore the saved level and language. */
export function useRestoreInterviewPrefs() {
  useEffect(() => {
    void useInterviewPrefs.persist.rehydrate();
  }, []);
}
