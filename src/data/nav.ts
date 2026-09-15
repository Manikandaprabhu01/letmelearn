export const NAV = [
  { to: "/", label: "Studio", match: "exact" as const },
  { to: "/java", label: "Java & Spring Boot", match: "prefix" as const },
  { to: "/python", label: "Python End-to-End for AI", match: "prefix" as const },
  { to: "/lld", label: "LLD Concepts", match: "prefix" as const },
  { to: "/hld", label: "HLD & Microservices", match: "prefix" as const },
  { to: "/examples", label: "System Design Examples", match: "prefix" as const },
  { to: "/fde", label: "AI FDE Roadmap", match: "prefix" as const },
  { to: "/interview-prep", label: "Interview Prep Console", match: "prefix" as const },
  { to: "/playgrounds", label: "Labs", match: "prefix" as const },
  { to: "/resources", label: "Sources", match: "prefix" as const },
] as const;

export const APP_NAME = "LetMeLearn";
export const APP_TAGLINE = "System design, taught like the interview.";
