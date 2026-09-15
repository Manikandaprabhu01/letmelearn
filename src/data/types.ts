export type Level = "foundational" | "intermediate" | "advanced";

export type CalloutKind = "note" | "insight" | "warn" | "interview";

export type Tone = "default" | "accent" | "ok" | "bad" | "warn";

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  tone?: Tone;
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

export type SystemColumn = {
  title: string;
  nodes: DiagramNode[];
};

export type SystemDiagram = {
  kind: "system";
  caption?: string;
  columns: SystemColumn[];
};

/** Ordered message-passing between participants — the "who calls whom, in what order" picture. */
export type SequenceActor = {
  id: string;
  label: string;
  sub?: string;
};

export type SequenceMessage = {
  from: string;
  to: string;
  label: string;
  /** call = solid request, return = dashed response, async = fire-and-forget, self = loops back */
  kind?: "call" | "return" | "async" | "self";
  note?: string;
  tone?: Tone;
};

export type SequenceDiagram = {
  kind: "sequence";
  caption?: string;
  actors: SequenceActor[];
  messages: SequenceMessage[];
};

/** Entity-relationship sketch for data-model sections. */
export type ErField = {
  name: string;
  type: string;
  key?: "pk" | "fk" | "idx";
  note?: string;
};

export type ErEntity = {
  name: string;
  note?: string;
  fields: ErField[];
};

export type ErRelation = {
  from: string;
  to: string;
  label: string;
  cardinality?: string;
};

export type ErDiagram = {
  kind: "er";
  caption?: string;
  entities: ErEntity[];
  relations?: ErRelation[];
};

/** Side-by-side option cards with the honest wins and costs of each. */
export type CompareOption = {
  title: string;
  sub?: string;
  good: string[];
  bad: string[];
  verdict?: string;
  tone?: Tone;
};

export type CompareDiagram = {
  kind: "compare";
  caption?: string;
  options: CompareOption[];
};

/** A class/interface sketch for LLD pages — closer to UML than to prose. */
export type UmlMember = {
  name: string;
  kind?: "field" | "method";
  vis?: "+" | "-" | "#";
  note?: string;
};

export type UmlBox = {
  name: string;
  stereotype?: "interface" | "abstract" | "class" | "enum" | "record";
  members: UmlMember[];
  tone?: Tone;
};

export type UmlEdge = {
  from: string;
  to: string;
  /** implements/extends = dashed & hollow, has = composition, uses = plain dependency */
  kind?: "implements" | "extends" | "has" | "uses";
  label?: string;
};

export type UmlDiagram = {
  kind: "uml";
  caption?: string;
  boxes: UmlBox[];
  edges?: UmlEdge[];
};

export type Diagram =
  | FlowDiagram
  | LayerDiagram
  | BitDiagram
  | SystemDiagram
  | SequenceDiagram
  | ErDiagram
  | CompareDiagram
  | UmlDiagram;

export type WalkthroughStep = {
  title: string;
  text: string;
};

export type ArchitectureBoard = {
  caption: string;
  columns: SystemColumn[];
  walkthrough: WalkthroughStep[];
};

export type CodeBlock = {
  title?: string;
  source: string;
  lang?: string;
};

/** A numbered stage in a request path, with room for the detail that usually gets hand-waved. */
export type FlowStep = {
  title: string;
  text: string;
  detail?: string;
};

/** One line of back-of-the-envelope arithmetic, shown as label / working / answer. */
export type MathRow = {
  label: string;
  expr: string;
  result: string;
  note?: string;
};

/** The question an interviewer asks after you finish, and a good answer. */
export type FollowUp = {
  q: string;
  a: string;
};

export type LinkRef = { label: string; href: string };

export type Section = {
  heading: string;
  /** Short line under the heading, used by the table of contents and page scanning. */
  lede?: string;
  body?: string[];
  bullets?: string[];
  numbered?: string[];
  steps?: FlowStep[];
  math?: MathRow[];
  followUps?: FollowUp[];
  takeaways?: string[];
  table?: { headers: string[]; rows: string[][]; caption?: string };
  code?: CodeBlock | CodeBlock[];
  diagram?: Diagram | Diagram[];
  callout?: { kind: CalloutKind; title?: string; text: string };
  /** Per-concept references — videos and docs for this section specifically. */
  links?: LinkRef[];
};

export type Concept = {
  slug: string;
  title: string;
  subtitle: string;
  level: Level;
  minutes: number;
  tags: string[];
  summary: string;
  /** The 60-second version — what to say if you only get one sentence each. */
  keyPoints?: string[];
  /** Concepts worth reading first, as app paths. */
  prerequisites?: string[];
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
  /** Step 1 of the framework: the questions you ask before drawing anything. */
  clarifying?: FollowUp[];
  requirements: { functional: string[]; nonFunctional: string[] };
  estimation?: { item: string; calc: string }[];
  /** Worked arithmetic behind the estimation table. */
  math?: MathRow[];
  apis?: { method: string; path: string; desc: string }[];
  dataModel?: { entity: string; fields: string[] }[];
  architecture: Section[];
  deepDives: Section[];
  tradeoffs: { choice: string; pickWhen: string; cost: string }[];
  /** Step 4: what you say in the last five minutes. */
  wrapUp?: string[];
  followUps?: FollowUp[];
  related: string[];
  furtherReading: LinkRef[];
  playground?: string;
};

export type PlaygroundMeta = {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  /** Section on the Labs page; see LAB_GROUPS. */
  group?: string;
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
