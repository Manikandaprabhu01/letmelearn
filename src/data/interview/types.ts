/**
 * Interview Prep Console data model.
 *
 * Field names are deliberately short — they are the console's original keys,
 * kept so the imported data stays diffable against its source. Each is
 * documented here instead.
 */

export type Level = "SDE" | "SDE2" | "Lead SDE" | "Staff SDE" | "Principal SDE";
export type Difficulty = "E" | "M" | "H";
export type QuestionType = "coding" | "hld" | "lld" | "concept" | "behavioral";
export type SectorId = "core" | "product" | "ib" | "fintech" | "indian-bank" | "payments";

export type QA = { q: string; a: string };

/* ---------- shared answer library ---------- */

/** One way to solve a coding problem. `i` is the idea; `tc`/`sc` are time and space. */
export type Approach = { i: string; tc?: string; sc?: string; java?: string; py?: string };

export type CodingAnswer = {
  id: string;
  /** Title. */
  t: string;
  /** LeetCode number and slug, when the problem has one. */
  lc?: number;
  slug?: string;
  d: Difficulty;
  /** Round it is usually asked in. */
  r: number;
  src: string[];
  /** Problem statement. */
  stmt: string;
  /** What the interviewer is testing. */
  key: string;
  brute: Approach;
  opt: Approach;
  /** Follow-up questions. */
  fu: QA[];
};

export type LldAnswer = {
  id: string;
  t: string;
  src: string[];
  r: number;
  /** A "how to run the round" script rather than a design. */
  playbook?: boolean;
  /** Most asked. */
  star?: boolean;
  stmt: string;
  /** Clarifying questions — or, for a playbook, the checklist. */
  ask: string[];
  fr: string[];
  nfr: string[];
  qa: QA[];
  /** Entities and responsibilities. */
  ent?: string;
  /** Class design code. */
  cls?: { java?: string; py?: string };
  /** Patterns used. */
  pat?: string[];
  /** Concurrency and thread safety. */
  conc?: string;
  /** Extension points. */
  ext?: string[];
};

export type HldAnswer = {
  id: string;
  t: string;
  src: string[];
  r: number;
  playbook?: boolean;
  star?: boolean;
  stmt: string;
  ask: QA[];
  fr: string[];
  nfr: string[];
  scale: string;
  /** ASCII architecture diagram. */
  arch: string;
  /** Services: name and what each does. */
  svc: { n: string; d: string }[];
  /** ASCII sequence chart. */
  seq: string;
  db: {
    tables: { n: string; cols: string; notes: string }[];
    sql: string;
    nosql: string;
    verdict: string;
  };
  fu: QA[];
};

export type ConceptAnswer = {
  id: string;
  t: string;
  /** Category, e.g. "Databases". */
  cat: string;
  r: number;
  src: string[];
  /** The answer. */
  a: string;
  /** A worked SQL or HTTP example. */
  sql?: string;
  fu: QA[];
  java?: string;
  py?: string;
  /** A single code block in some other language. */
  codeLang?: string;
  code?: string;
};

export type LibraryEntry =
  | { kind: "coding"; d: CodingAnswer }
  | { kind: "lld"; d: LldAnswer }
  | { kind: "hld"; d: HldAnswer }
  | { kind: "concept"; d: ConceptAnswer };

/* ---------- companies ---------- */

export type Question = {
  q: string;
  t: QuestionType;
  /** Levels this question is asked at. */
  lv: Level[];
  d?: Difficulty;
  lc?: number;
  slug?: string;
  round: number;
  /** Id of the shared library answer. Wins over an inline answer. */
  ans?: string;
  /** Company-specific context. */
  note?: string;
  /** Inline answer, for questions only this company asks. */
  a?: string;
  code?: { java?: string; py?: string } | string;
  codeLang?: string;
  fu?: QA[];
};

export type Company = {
  id: string;
  name: string;
  sector: SectorId;
  /** One-line summary of the loop. */
  tag: string;
  loc: string;
  ladder: { lvl: Level; internal: string; yoe: string; loop: string; bar: string }[];
  loop: { n: number; name: string; dur: string; fmt: string; tests: string; levels: Level[] }[];
  bank: Question[];
  prep: string[];
  sources: { label: string; url: string }[];
  /** Has a dedicated deep-dive question bank and answer sheet. */
  deep?: boolean;
};

/** What the menu, search and index pages need, without the question banks. */
export type CompanyMeta = {
  id: string;
  name: string;
  sector: SectorId;
  tag: string;
  loc: string;
  questions: number;
};

/* ---------- Freshworks Lead SE deep dive ---------- */

export type DeepGroupType = "coding" | "hld" | "lld" | "concepts" | "behavioral";

export type DeepQuestion = {
  q: string;
  lc?: number;
  slug?: string;
  d?: Difficulty;
  /** Source report ids, e.g. "L1" (Lead loop) or "S3" (Senior loop). */
  s: string[];
  /** Note. */
  n?: string;
  /** The LeetCode link is the closest match, not the exact problem. */
  approx?: boolean;
};

export type DeepRound = {
  n: number;
  id: string;
  name: string;
  meta: string;
  tests: string;
  groups: { type: DeepGroupType; title: string; items: DeepQuestion[] }[];
};

export type DeepSource = { id: string; label: string; url: string };
