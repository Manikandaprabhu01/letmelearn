import { analyticsDeepExamples } from "@/data/examples/deep-analytics";
import { bookingDeepExamples } from "@/data/examples/deep-booking";
import { collabDeepExamples } from "@/data/examples/deep-collab";
import { frameworkExamples } from "@/data/examples/deep-framework";
import { infraDeepExamples } from "@/data/examples/deep-infra";
import { socialDeepExamples } from "@/data/examples/deep-social";
import { storageDeepExamples } from "@/data/examples/deep-storage";
import { mediaDeepExamples } from "@/data/examples/deep-media";
import { mediaAndMoneyExamples } from "@/data/examples/deep-media-money";
import { moneyDeepExamples } from "@/data/examples/deep-money";
import { vol1DeepA } from "@/data/examples/deep-vol1-a";
import { vol1DeepB } from "@/data/examples/deep-vol1-b";
import { vol1DeepC } from "@/data/examples/deep-vol1-c";
import { vol1DeepD } from "@/data/examples/deep-vol1-d";
import { vol1DeepE } from "@/data/examples/deep-vol1-e";
import { vol2DeepA } from "@/data/examples/deep-vol2-a";
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
  ...vol1DeepE,
  ...vol2DeepA,
  ...infraDeepExamples,
  ...socialDeepExamples,
  ...analyticsDeepExamples,
  ...bookingDeepExamples,
  ...moneyDeepExamples,
  ...storageDeepExamples,
  ...mediaDeepExamples,
  ...collabDeepExamples,
  ...mediaAndMoneyExamples,
];
