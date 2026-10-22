/**
 * The menu, grouped by what the reader is doing rather than as one flat list.
 * Each item has an associated high-contrast 3D/SVG icon image, subtitle, and signature color.
 */

export interface NavItemConfig {
  to: string;
  label: string;
  subtitle: string;
  match: "exact" | "prefix";
  iconName:
    | "LayoutDashboard"
    | "Coffee"
    | "BrainCircuit"
    | "Boxes"
    | "Network"
    | "Workflow"
    | "Bot"
    | "Building2"
    | "FlaskConical"
    | "Terminal"
    | "BookOpen";
  image: string;
  badge?: string;
  badgeVariant?: "hot" | "new" | "accent" | "muted";
  color: {
    accent: string;
    text: string;
    bg: string;
    border: string;
    activeBorder: string;
    activeBg: string;
    glow: string;
  };
}

export const NAV_HOME: NavItemConfig = {
  to: "/",
  label: "Studio",
  subtitle: "Command Center",
  match: "exact",
  iconName: "LayoutDashboard",
  image: "/images/nav/studio.jpg",
  color: {
    accent: "#06b6d4",
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    activeBorder: "border-cyan-400",
    activeBg: "bg-cyan-500/20",
    glow: "shadow-[0_0_12px_rgba(6,182,212,0.4)]",
  },
};

const TRACKS: readonly NavItemConfig[] = [
  {
    to: "/java",
    label: "Java & Spring Boot",
    subtitle: "JVM & Microservices",
    match: "prefix",
    iconName: "Coffee",
    image: "/images/nav/java.jpg",
    badge: "49 Ch",
    badgeVariant: "accent",
    color: {
      accent: "#f97316",
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      activeBorder: "border-orange-400",
      activeBg: "bg-orange-500/20",
      glow: "shadow-[0_0_12px_rgba(249,115,22,0.4)]",
    },
  },
  {
    to: "/python",
    label: "Python for AI",
    subtitle: "PyTorch & Transformers",
    match: "prefix",
    iconName: "BrainCircuit",
    image: "/images/nav/python.jpg",
    badge: "AI",
    badgeVariant: "accent",
    color: {
      accent: "#0ea5e9",
      text: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/30",
      activeBorder: "border-sky-400",
      activeBg: "bg-sky-500/20",
      glow: "shadow-[0_0_12px_rgba(14,165,233,0.4)]",
    },
  },
  {
    to: "/lld",
    label: "LLD Concepts",
    subtitle: "Design Patterns & OOP",
    match: "prefix",
    iconName: "Boxes",
    image: "/images/nav/lld.jpg",
    color: {
      accent: "#a855f7",
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      activeBorder: "border-purple-400",
      activeBg: "bg-purple-500/20",
      glow: "shadow-[0_0_12px_rgba(168,85,247,0.4)]",
    },
  },
  {
    to: "/hld",
    label: "HLD & Microservices",
    subtitle: "Distributed Systems",
    match: "prefix",
    iconName: "Network",
    image: "/images/nav/hld.jpg",
    badge: "Core",
    badgeVariant: "accent",
    color: {
      accent: "#14b8a6",
      text: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/30",
      activeBorder: "border-teal-400",
      activeBg: "bg-teal-500/20",
      glow: "shadow-[0_0_12px_rgba(20,184,166,0.4)]",
    },
  },
  {
    to: "/examples",
    label: "System Design Examples",
    subtitle: "Uber, Netflix & More",
    match: "prefix",
    iconName: "Workflow",
    image: "/images/nav/examples.jpg",
    badge: "24 Cases",
    badgeVariant: "muted",
    color: {
      accent: "#3b82f6",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      activeBorder: "border-blue-400",
      activeBg: "bg-blue-500/20",
      glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
    },
  },
  {
    to: "/fde",
    label: "AI FDE Roadmap",
    subtitle: "Forward Deployed & Agents",
    match: "prefix",
    iconName: "Bot",
    image: "/images/nav/fde.svg",
    badge: "NEW",
    badgeVariant: "new",
    color: {
      accent: "#10b981",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      activeBorder: "border-emerald-400",
      activeBg: "bg-emerald-500/20",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    },
  },
];

const PRACTICE: readonly NavItemConfig[] = [
  {
    to: "/interview-prep",
    label: "Interview Prep",
    subtitle: "Top 40 Companies",
    match: "prefix",
    iconName: "Building2",
    image: "/images/nav/interview.svg",
    badge: "HOT",
    badgeVariant: "hot",
    color: {
      accent: "#f59e0b",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      activeBorder: "border-amber-400",
      activeBg: "bg-amber-500/20",
      glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
    },
  },
  {
    to: "/playgrounds",
    label: "Interactive Labs",
    subtitle: "Kafka, Redis & Limits",
    match: "prefix",
    iconName: "FlaskConical",
    image: "/images/nav/labs.svg",
    badge: "SIM",
    badgeVariant: "accent",
    color: {
      accent: "#ec4899",
      text: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/30",
      activeBorder: "border-pink-400",
      activeBg: "bg-pink-500/20",
      glow: "shadow-[0_0_12px_rgba(236,72,153,0.4)]",
    },
  },
  {
    to: "/compiler",
    label: "Code Compiler",
    subtitle: "Multi-Language Runner",
    match: "prefix",
    iconName: "Terminal",
    image: "/images/nav/compiler.svg",
    badge: "LIVE",
    badgeVariant: "new",
    color: {
      accent: "#84cc16",
      text: "text-lime-400",
      bg: "bg-lime-500/10",
      border: "border-lime-500/30",
      activeBorder: "border-lime-400",
      activeBg: "bg-lime-500/20",
      glow: "shadow-[0_0_12px_rgba(132,204,22,0.4)]",
    },
  },
];

const REFERENCE: readonly NavItemConfig[] = [
  {
    to: "/resources",
    label: "Sources & Papers",
    subtitle: "Whitepapers & References",
    match: "prefix",
    iconName: "BookOpen",
    image: "/images/nav/sources.svg",
    color: {
      accent: "#6366f1",
      text: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      activeBorder: "border-indigo-400",
      activeBg: "bg-indigo-500/20",
      glow: "shadow-[0_0_12px_rgba(99,102,241,0.4)]",
    },
  },
];

export const NAV_GROUPS = [
  { label: "Tracks", items: TRACKS },
  { label: "Practice", items: PRACTICE },
  { label: "Reference", items: REFERENCE },
] as const;

/** Flat list, for anything that just needs every destination. */
export const NAV = [NAV_HOME, ...TRACKS, ...PRACTICE, ...REFERENCE] as const;

export const APP_NAME = "LetMeLearn";
export const APP_TAGLINE = "System design, taught like the interview.";
