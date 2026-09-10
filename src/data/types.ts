export type Level = "foundational" | "intermediate" | "advanced";

export type CalloutKind = "note" | "insight" | "warn";

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  tone?: "default" | "accent" | "ok" | "bad" | "warn";
};

export type FlowDiagram = {
  kind: "flow";
  caption?: string;
  rows: DiagramNode[][];
};

export type LayerDiagram = {
  kind: "layers";
  caption?: string;
  layers: { title: string; items: string[] }[];
};

export type BitDiagram = {
  kind: "bits";
  caption?: string;
  fields: { label: string; bits: number; note?: string }[];
};

export type Diagram = FlowDiagram | LayerDiagram | BitDiagram;

export type Section = {
  heading: string;
  body?: string[];
  bullets?: string[];
  numbered?: string[];
  table?: { headers: string[]; rows: string[][] };
  code?: { title?: string; source: string };
  diagram?: Diagram;
  callout?: { kind: CalloutKind; title?: string; text: string };
};

export type LinkRef = { label: string; href: string };

export type Concept = {
  slug: string;
  title: string;
  subtitle: string;
  level: Level;
  minutes: number;
  tags: string[];
  summary: string;
  sections: Section[];
  related: string[];
  furtherReading: LinkRef[];
  playground?: string;
};

export type ExampleSource = "Volume 1" | "Volume 2" | "Source 6";

export type DesignExample = {
  slug: string;
  title: string;
  source: ExampleSource;
  chapter?: number;
  difficulty: Level;
  minutes: number;
  tags: string[];
  summary: string;
  companies: string[];
  requirements: { functional: string[]; nonFunctional: string[] };
  estimation?: { item: string; calc: string }[];
  apis?: { method: string; path: string; desc: string }[];
  dataModel?: { entity: string; fields: string[] }[];
  architecture: Section[];
  deepDives: Section[];
  tradeoffs: { choice: string; pickWhen: string; cost: string }[];
  related: string[];
  furtherReading: LinkRef[];
  playground?: string;
};

export type PlaygroundMeta = {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  relatedConcept?: string;
  relatedExample?: string;
};

export type ResourceKind = "roadmap" | "playground" | "book" | "course" | "article" | "repo";

export type ResourceLink = {
  title: string;
  href: string;
  blurb: string;
  kind: ResourceKind;
};
