import { examples } from "@/data/examples";
import { getBoard } from "@/data/boards";
import { hldConcepts } from "@/data/hld";
import { lldConcepts } from "@/data/lld";
import { playgrounds } from "@/data/playgrounds";

export const payload = {
  hld: hldConcepts,
  lld: lldConcepts,
  examples,
  playgrounds,
  boards: Object.fromEntries(
    examples.map((e) => [e.slug, getBoard(e.slug)]).filter((p) => Boolean(p[1])),
  ),
};
