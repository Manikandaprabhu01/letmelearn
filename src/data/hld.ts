import { hldConsistency } from "@/data/concepts/hld-consistency";
import { hldData } from "@/data/concepts/hld-data";
import { hldFundamentals } from "@/data/concepts/hld-fundamentals";
import { hldMessaging } from "@/data/concepts/hld-messaging";
import { hldMicroservicesArchitecture } from "@/data/concepts/hld-microservices-architecture";
import { hldMicroservicesData } from "@/data/concepts/hld-microservices-data";
import { hldMicroservicesOperations } from "@/data/concepts/hld-microservices-operations";
import { hldPlatform } from "@/data/concepts/hld-platform";
import { hldResilience } from "@/data/concepts/hld-resilience";
import type { Concept } from "@/data/types";

/**
 * High-level design curriculum as themed groups, in reading order:
 * fundamentals → data → consistency → messaging → resilience → platform, then
 * microservices, which builds on all of them. The index page renders one
 * section per group.
 */
export const HLD_GROUPS: { title: string; blurb: string; concepts: Concept[] }[] = [
  {
    title: "Fundamentals",
    blurb: "Scaling, load balancing, caching and CDNs — the first boxes on any diagram.",
    concepts: hldFundamentals,
  },
  {
    title: "Data",
    blurb: "Replication, sharding, consistent hashing, and choosing a database.",
    concepts: hldData,
  },
  {
    title: "Consistency",
    blurb: "CAP, consistency models, quorums, consensus and availability.",
    concepts: hldConsistency,
  },
  {
    title: "Messaging",
    blurb: "Queues, pub/sub, real-time delivery, and REST, GraphQL and gRPC.",
    concepts: hldMessaging,
  },
  {
    title: "Resilience",
    blurb: "Rate limiting, circuit breakers, idempotency, and probabilistic structures.",
    concepts: hldResilience,
  },
  {
    title: "Platform",
    blurb: "Gateways, observability, DNS, and back-of-the-envelope estimation.",
    concepts: hldPlatform,
  },
  {
    title: "Microservices — architecture",
    blurb:
      "When to split, where to draw boundaries, how services talk and find each other, and who owns the data.",
    concepts: hldMicroservicesArchitecture,
  },
  {
    title: "Microservices — data and consistency",
    blurb:
      "Sagas, the transactional outbox, CQRS and event sourcing, and evolving contracts safely.",
    concepts: hldMicroservicesData,
  },
  {
    title: "Microservices — operations",
    blurb:
      "Containing failure, service meshes, zero-trust security, Kubernetes and safe deployments.",
    concepts: hldMicroservicesOperations,
  },
];

export const hldConcepts: Concept[] = HLD_GROUPS.flatMap((group) => group.concepts);

export function getHld(slug: string) {
  return hldConcepts.find((c) => c.slug === slug);
}
