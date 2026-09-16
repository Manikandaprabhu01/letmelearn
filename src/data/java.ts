import { javaCore } from "@/data/java/ch-05-core";
import { javaData } from "@/data/java/ch-11-data";
import { javaDeploy } from "@/data/java/ch-17-deploy";
import { javaFoundations } from "@/data/java/ch-00-foundations";
import { javaPlatform } from "@/data/java/ch-08-platform";
import { javaQuality } from "@/data/java/ch-15-quality";
import { javaRuntime } from "@/data/java/ch-03-runtime";
import { javaSpring } from "@/data/java/ch-18-spring";
import { javaWeb } from "@/data/java/ch-13-web";
import { springStartup } from "@/data/java/spring/ch-20-startup";
import { springBeanLifecycle } from "@/data/java/spring/ch-21-bean-lifecycle";
import { springConfiguration } from "@/data/java/spring/ch-22-configuration";
import { springAop } from "@/data/java/spring/ch-23-aop";
import { springTransactions } from "@/data/java/spring/ch-24-transactions";
import { springJpaHibernate } from "@/data/java/spring/ch-25-jpa-hibernate";
import { springMvcInternals } from "@/data/java/spring/ch-26-mvc-internals";
import { springSecurityInternals } from "@/data/java/spring/ch-27-security-internals";
import { springThreads } from "@/data/java/spring/ch-28-threads";
import { springCachingScheduling } from "@/data/java/spring/ch-29-caching-scheduling";
import { springKafka } from "@/data/java/spring/ch-30-kafka";
import { springHttpResilience } from "@/data/java/spring/ch-31-http-resilience";
import { springObservability } from "@/data/java/spring/ch-32-observability";
import { springTesting } from "@/data/java/spring/ch-33-testing";
import { javaObjects } from "@/data/java/language/ch-34-objects";
import { javaInheritance } from "@/data/java/language/ch-35-inheritance";
import { javaSealedRecords } from "@/data/java/language/ch-36-sealed-records";
import { javaObjectContracts } from "@/data/java/language/ch-37-object-contracts";
import { javaGenerics } from "@/data/java/language/ch-38-generics";
import { javaCollectionsInternals } from "@/data/java/language/ch-39-collections-internals";
import { javaCollectionsChoosing } from "@/data/java/language/ch-40-collections-choosing";
import { javaCollectionsPitfalls } from "@/data/java/language/ch-41-collections-pitfalls";
import { javaConcurrentCollections } from "@/data/java/language/ch-42-concurrent-collections";
import { javaStreamsCollectors } from "@/data/java/language/ch-43-streams-collectors";
import { javaEightFeatures } from "@/data/java/language/ch-44-java-8";
import { javaNineToSeventeen } from "@/data/java/language/ch-45-java-9-to-17";
import { javaSeventeenToTwentyOne } from "@/data/java/language/ch-46-java-17-to-21";
import { javaTwentyTwoToTwentySix } from "@/data/java/language/ch-47-java-22-to-26";
import { javaJdkMigration } from "@/data/java/language/ch-48-jdk-migration";
import type { Concept } from "@/data/types";

const all: Concept[] = [
  ...javaFoundations,
  ...javaRuntime,
  ...javaCore,
  ...javaPlatform,
  ...javaData,
  ...javaWeb,
  ...javaQuality,
  ...javaDeploy,
  ...javaSpring,
  springStartup,
  springBeanLifecycle,
  springConfiguration,
  springAop,
  springTransactions,
  springJpaHibernate,
  springMvcInternals,
  springSecurityInternals,
  springThreads,
  springCachingScheduling,
  springKafka,
  springHttpResilience,
  springObservability,
  springTesting,
  javaObjects,
  javaInheritance,
  javaSealedRecords,
  javaObjectContracts,
  javaGenerics,
  javaCollectionsInternals,
  javaCollectionsChoosing,
  javaCollectionsPitfalls,
  javaConcurrentCollections,
  javaStreamsCollectors,
  javaEightFeatures,
  javaNineToSeventeen,
  javaSeventeenToTwentyOne,
  javaTwentyTwoToTwentySix,
  javaJdkMigration,
];

/**
 * Chapter order. Chapters 0–19 follow the source guide's numbering; 20 onwards
 * is the Spring Boot deep dive. The concepts are grouped into files by theme
 * for editing, but the track reads as one numbered sequence — chapter numbers
 * are how the chapters refer to each other.
 */
const CHAPTER_ORDER = [
  "how-to-use-this-guide",
  "basics",
  "oop",
  "multithreading",
  "exception-handling",
  "networking",
  "collections",
  "strings-and-regex",
  "advanced-topics",
  "file-io-serialization",
  "annotations-reflection",
  "jdbc",
  "testing",
  "web-development",
  "java-8",
  "design-patterns",
  "security",
  "cloud-computing",
  "spring-framework",
  "docker",
  "spring-boot-startup",
  "bean-lifecycle",
  "spring-configuration",
  "spring-aop",
  "spring-transactions",
  "jpa-hibernate",
  "spring-mvc-internals",
  "spring-security-internals",
  "spring-threads",
  "spring-caching-scheduling",
  "spring-kafka",
  "spring-http-resilience",
  "spring-observability",
  "spring-testing",
  "objects-encapsulation",
  "inheritance-polymorphism",
  "sealed-records",
  "object-contracts",
  "generics-in-depth",
  "collections-internals",
  "collections-choosing",
  "collections-pitfalls",
  "concurrent-collections",
  "streams-collectors",
  "java-8-features",
  "java-9-to-17",
  "java-17-to-21",
  "java-22-to-26",
  "jdk-migration",
] as const;

export const javaConcepts: Concept[] = CHAPTER_ORDER.map((slug) => {
  const found = all.find((c) => c.slug === slug);
  if (!found) throw new Error(`java: no concept for chapter slug "${slug}"`);
  return found;
});

export function getJava(slug: string) {
  return javaConcepts.find((c) => c.slug === slug);
}

/** Chapter number as the source guide numbers them, starting at 0. */
export function javaChapterNumber(slug: string): number {
  return javaConcepts.findIndex((c) => c.slug === slug);
}

/** The parts the index page groups chapters into, as inclusive chapter ranges. */
export const JAVA_PARTS: { title: string; blurb: string; from: number; to: number }[] = [
  {
    title: "Start here",
    blurb: "The map of the guide, and the order that gets you productive fastest.",
    from: 0,
    to: 0,
  },
  {
    title: "Part 1 — The Java backend guide",
    blurb:
      "The language and runtime, the bugs that cause incidents, the data and web layers, and a first pass at Spring Boot and shipping it.",
    from: 1,
    to: 19,
  },
  {
    title: "Part 2 — Spring Boot in depth",
    blurb:
      "How Spring Boot behaves in production: startup, beans, configuration, proxies, transactions, JPA, MVC, security, threads, caching, Kafka, resilience, observability and testing.",
    from: 20,
    to: 33,
  },
  {
    title: "Part 3 — Object-oriented Java in depth",
    blurb:
      "What an object costs, encapsulation that holds, dispatch and inheritance, sealed types and records, the contracts collections rely on, and generics.",
    from: 34,
    to: 38,
  },
  {
    title: "Part 4 — Collections in depth",
    blurb:
      "How each structure works in memory, choosing by the operation you need, the pitfalls that reach production, concurrency, and streams with collectors.",
    from: 39,
    to: 43,
  },
  {
    title: "Part 5 — The Java releases, 8 to 26",
    blurb:
      "What each version added and what it is for: lambdas and java.time, modules and records, virtual threads and pattern matching, scoped values and faster startup — and how to migrate.",
    from: 44,
    to: 48,
  },
];
