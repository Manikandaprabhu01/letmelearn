import { examples } from "@/data/examples";
import { fdeConcepts } from "@/data/fde";
import { hldConcepts } from "@/data/hld";
import { COMPANY_INDEX } from "@/data/interview/company-index";
import { javaConcepts } from "@/data/java";
import { lldConcepts } from "@/data/lld";
import { playgrounds } from "@/data/playgrounds";
import { pythonConcepts } from "@/data/python";
import { useProgress } from "@/lib/progress";

/**
 * Every "Mark studied" id a track can write, keyed by its menu path — so the
 * sidebar can answer "how far in am I?" without each page counting for itself.
 */
const TRACK_IDS: Record<string, string[]> = {
  "/java": javaConcepts.map((c) => `java:${c.slug}`),
  "/python": pythonConcepts.map((c) => `py:${c.slug}`),
  "/lld": lldConcepts.map((c) => `lld:${c.slug}`),
  "/hld": hldConcepts.map((c) => `hld:${c.slug}`),
  "/examples": examples.map((e) => `ex:${e.slug}`),
  "/fde": fdeConcepts.map((c) => `fde:${c.slug}`),
  "/playgrounds": playgrounds.map((p) => `lab:${p.slug}`),
  "/interview-prep": [...COMPANY_INDEX.map((c) => `ip:${c.id}`), "ip:freshworks-lead"],
};

export type TrackProgress = { done: number; total: number };

/** Counts for one menu path, or null when that path is not a track. */
export function useTrackProgress(path: string): TrackProgress | null {
  const ids = TRACK_IDS[path];
  const done = useProgress((state) =>
    ids ? ids.reduce((count, id) => (state.done[id] ? count + 1 : count), 0) : 0,
  );
  if (!ids) return null;
  return { done, total: ids.length };
}
