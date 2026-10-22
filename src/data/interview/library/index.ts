import type { ConceptAnswer, CodingAnswer, HldAnswer, LibraryEntry, LldAnswer } from "../types";
import { codingA } from "./coding-a";
import { codingB } from "./coding-b";
import { codingC } from "./coding-c";
import { lldA } from "./lld-a";
import { lldB } from "./lld-b";
import { hldA } from "./hld-a";
import { hldB } from "./hld-b";
import { hldC } from "./hld-c";
import { conceptsA } from "./concepts-a";
import { conceptsB } from "./concepts-b";
import { conceptsC } from "./concepts-c";
import { extraCodingA } from "./extra-coding-a";
import { extraCodingB } from "./extra-coding-b";
import { extraLld } from "./extra-lld";
import { extraHldA } from "./extra-hld-a";
import { extraHldB } from "./extra-hld-b";
import { extraConceptsA } from "./extra-concepts-a";
import { extraConceptsB } from "./extra-concepts-b";
import { extraBehavioral } from "./extra-behavioral";

export { LLD_DIAGRAMS } from "./lld-diagrams";

export const CODING: CodingAnswer[] = [
  ...codingA,
  ...codingB,
  ...codingC,
  ...extraCodingA,
  ...extraCodingB,
];
export const LLD: LldAnswer[] = [...lldA, ...lldB, ...extraLld];
export const HLD: HldAnswer[] = [...hldA, ...hldB, ...hldC, ...extraHldA, ...extraHldB];
export const CONCEPTS: ConceptAnswer[] = [
  ...conceptsA,
  ...conceptsB,
  ...conceptsC,
  ...extraConceptsA,
  ...extraConceptsB,
  ...extraBehavioral,
];

/**
 * The Freshworks Lead SE answer sheet. It is the library's first edition — the
 * cross-company "extra" files were added on top of it later.
 */
export const FRESHWORKS_SHEET = {
  coding: [...codingA, ...codingB, ...codingC] as CodingAnswer[],
  lld: [...lldA, ...lldB] as LldAnswer[],
  hld: [...hldA, ...hldB, ...hldC] as HldAnswer[],
  concepts: [...conceptsA, ...conceptsB, ...conceptsC] as ConceptAnswer[],
};

export const LIBRARY: ReadonlyMap<string, LibraryEntry> = new Map<string, LibraryEntry>([
  ...CODING.map((d) => [d.id, { kind: "coding", d }] as [string, LibraryEntry]),
  ...LLD.map((d) => [d.id, { kind: "lld", d }] as [string, LibraryEntry]),
  ...HLD.map((d) => [d.id, { kind: "hld", d }] as [string, LibraryEntry]),
  ...CONCEPTS.map((d) => [d.id, { kind: "concept", d }] as [string, LibraryEntry]),
]);
