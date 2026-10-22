/**
 * The menu, grouped by what the reader is doing rather than as one flat list.
 * Ten undifferentiated links stopped being scannable once the console, the
 * compiler and a 49-chapter track arrived.
 */
export const NAV_HOME = { to: "/", label: "Studio", match: "exact" as const };

const TRACKS = [
  { to: "/java", label: "Java & Spring Boot", match: "prefix" as const },
  { to: "/python", label: "Python for AI", match: "prefix" as const },
  { to: "/lld", label: "LLD Concepts", match: "prefix" as const },
  { to: "/hld", label: "HLD & Microservices", match: "prefix" as const },
  { to: "/examples", label: "System Design Examples", match: "prefix" as const },
  { to: "/fde", label: "AI FDE Roadmap", match: "prefix" as const },
] as const;

const PRACTICE = [
  { to: "/interview-prep", label: "Interview Prep", match: "prefix" as const },
  { to: "/playgrounds", label: "Labs", match: "prefix" as const },
  { to: "/compiler", label: "Code Compiler", match: "prefix" as const },
] as const;

const REFERENCE = [{ to: "/resources", label: "Sources", match: "prefix" as const }] as const;

export const NAV_GROUPS = [
  { label: "Tracks", items: TRACKS },
  { label: "Practice", items: PRACTICE },
  { label: "Reference", items: REFERENCE },
] as const;

/** Flat list, for anything that just needs every destination. */
export const NAV = [NAV_HOME, ...TRACKS, ...PRACTICE, ...REFERENCE] as const;

export const APP_NAME = "LetMeLearn";
export const APP_TAGLINE = "System design, taught like the interview.";
