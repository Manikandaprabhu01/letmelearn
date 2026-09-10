export const NAV = [
  { to: "/", label: "Studio", match: "exact" as const },
  { to: "/hld", label: "HLD Concepts", match: "prefix" as const },
  { to: "/lld", label: "LLD Concepts", match: "prefix" as const },
  { to: "/examples", label: "System Design Examples", match: "prefix" as const },
  { to: "/playgrounds", label: "Labs", match: "prefix" as const },
  { to: "/resources", label: "Sources", match: "prefix" as const },
] as const;

export const APP_NAME = "Lattice";
export const APP_TAGLINE = "System design, taught like the interview.";
