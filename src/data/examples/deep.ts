import { frameworkExamples } from "@/data/examples/deep-framework";
import { mediaAndMoneyExamples } from "@/data/examples/deep-media-money";
import { vol1DeepA } from "@/data/examples/deep-vol1-a";
import { vol1DeepB } from "@/data/examples/deep-vol1-b";
import { vol1DeepC } from "@/data/examples/deep-vol1-c";
import { vol1DeepD } from "@/data/examples/deep-vol1-d";
import type { DesignExample } from "@/data/types";

/**
 * Examples rewritten to full chapter depth — clarifying questions, worked
 * estimation, APIs, data model, architecture, deep dives, trade-offs, wrap-up
 * and follow-up questions. Merged over the base catalogue by slug.
 */
export const deepExamples: DesignExample[] = [
  ...frameworkExamples,
  ...vol1DeepA,
  ...vol1DeepB,
  ...vol1DeepC,
  ...vol1DeepD,
  ...mediaAndMoneyExamples,
];
