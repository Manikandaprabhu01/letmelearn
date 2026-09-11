import { supplementsB } from "@/data/examples/supplements-b";
import { supplementsC } from "@/data/examples/supplements-c";
import { supplementsD } from "@/data/examples/supplements-d";
import { supplementsE } from "@/data/examples/supplements-e";
import type { DesignExample } from "@/data/types";

/**
 * Framework sections (scoping questions, wrap-up, follow-ups) layered onto the
 * examples that have not been rewritten to full chapter depth, so every example
 * page walks the same four-step structure.
 */
export const exampleSupplements: Record<string, Partial<DesignExample>> = {
  ...supplementsB,
  ...supplementsC,
  ...supplementsD,
  ...supplementsE,
};
