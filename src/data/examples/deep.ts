import { frameworkExamples } from "@/data/examples/deep-framework";
import { vol1DeepA } from "@/data/examples/deep-vol1-a";
import { vol1DeepB } from "@/data/examples/deep-vol1-b";
import type { DesignExample } from "@/data/types";

/** Examples rewritten to full chapter depth. Merged over the base set by slug. */
export const deepExamples: DesignExample[] = [...frameworkExamples, ...vol1DeepA, ...vol1DeepB];
