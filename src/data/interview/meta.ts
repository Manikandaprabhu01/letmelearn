import { COMPANY_INDEX } from "./company-index";
import type { CompanyMeta, Difficulty, Level, QuestionType, SectorId } from "./types";

export { COMPANY_INDEX, LIBRARY_ANSWER_COUNT } from "./company-index";

export const LEVELS: readonly Level[] = ["SDE", "SDE2", "Lead SDE", "Staff SDE", "Principal SDE"];

export const DEFAULT_LEVEL: Level = "Lead SDE";

export const LEVEL_SHORT: Record<Level, string> = {
  SDE: "SDE",
  SDE2: "SDE2",
  "Lead SDE": "Lead",
  "Staff SDE": "Staff",
  "Principal SDE": "Principal",
};

/** Sections of the console, in menu order. `dot` is the sector's marker colour. */
export const SECTORS: readonly { id: SectorId; name: string; blurb: string; dot: string }[] = [
  {
    id: "core",
    name: "Cross-company core",
    blurb:
      "What gets asked everywhere — coding patterns, system design, LLD, CS fundamentals and behavioural. Start here; the company pages say which of these each one favours.",
    dot: "bg-fg",
  },
  {
    id: "product",
    name: "Product & Tech",
    blurb:
      "Big tech, Indian product companies and SaaS — from Google's algorithm rounds to Flipkart's machine coding.",
    dot: "bg-accent",
  },
  {
    id: "ib",
    name: "Global Investment Banks",
    blurb:
      "HackerRank screens, Java depth and low-latency design at the banks' technology centres.",
    dot: "bg-muted",
  },
  {
    id: "fintech",
    name: "Fintech",
    blurb:
      "Payments rails, brokerages and wallets — idempotency, ledgers and reconciliation come up early.",
    dot: "bg-ok",
  },
  {
    id: "indian-bank",
    name: "Indian Banks",
    blurb: "Core banking, UPI and compliance-heavy systems at India's largest private banks.",
    dot: "bg-warn",
  },
  {
    id: "payments",
    name: "Payments & Cards",
    blurb: "Card networks and processors — authorisation, settlement, tokenisation and PCI scope.",
    dot: "bg-bad",
  },
];

export const TYPE_NAME: Record<QuestionType, string> = {
  coding: "Coding",
  hld: "HLD",
  lld: "LLD",
  concept: "Concept",
  behavioral: "Behavioural",
};

export const DIFFICULTY_NAME: Record<Difficulty, string> = { E: "Easy", M: "Medium", H: "Hard" };

/** Real companies — the core banks are shared material, not a company. */
export const COMPANY_COUNT = COMPANY_INDEX.filter((c) => c.sector !== "core").length;

export const QUESTION_COUNT = COMPANY_INDEX.reduce((n, c) => n + c.questions, 0);

export function getCompanyMeta(id: string): CompanyMeta | undefined {
  return COMPANY_INDEX.find((c) => c.id === id);
}

export function getSector(id: SectorId) {
  return SECTORS.find((s) => s.id === id) ?? SECTORS[0];
}

export function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}
