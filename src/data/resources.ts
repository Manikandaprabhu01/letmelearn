import { awesomeRepo } from "@/data/awesome";
import type { ResourceLink } from "@/data/types";

export const resources: ResourceLink[] = [
  {
    title: "roadmap.sh — System Design",
    href: "https://roadmap.sh/system-design",
    blurb:
      "The topic map: load balancers, caches, queues, CDNs, scaling. Lattice's HLD syllabus follows this spine.",
    kind: "roadmap",
  },
  {
    title: "roadmap.sh — System Design questions",
    href: "https://roadmap.sh/questions/system-design",
    blurb:
      "Thirty interview prompts from CAP to YouTube. Each maps onto an example or concept page here.",
    kind: "roadmap",
  },
  {
    title: "Rate limiter playground (LLD)",
    href: "https://rawang9.github.io/LLD/web_content/rate-limiter-playground.html",
    blurb:
      "The interactive five-algorithm visualizer that inspired Lattice's rate-limiter lab. HLD + LLD on one page.",
    kind: "playground",
  },
  {
    title: "System Design Interview — Volume 1 (Alex Xu)",
    href: "https://www.amazon.com/dp/B08CMF2CQF",
    blurb:
      "Scale-from-zero, estimation, the four-step framework, then rate limiter through Google Drive. 16 chapters.",
    kind: "book",
  },
  {
    title: "System Design Interview — Volume 2 (Alex Xu, Sahn Lam)",
    href: "https://www.amazon.com/System-Design-Interview-Insiders-Guide/dp/1736049119",
    blurb:
      "Proximity, maps, Kafka-like queues, metrics, ads, hotels, S3, wallets, matching engines. 13 chapters.",
    kind: "book",
  },
  {
    title: awesomeRepo.title,
    href: awesomeRepo.href,
    blurb: awesomeRepo.blurb,
    kind: "repo",
  },
  {
    title: "ByteByteGo",
    href: "https://blog.bytebytego.com/p/system-design-interview-books-volume",
    blurb:
      "The authors' newsletter and diagrams. Use alongside the books, not as a substitute for working a design on paper.",
    kind: "course",
  },
  {
    title: "Amazon Dynamo paper",
    href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
    blurb:
      "Consistent hashing, sloppy quorum, gossip, hinted handoff — the primary source behind the KV-store example.",
    kind: "article",
  },
  {
    title: "Google SRE — Monitoring distributed systems",
    href: "https://sre.google/sre-book/monitoring-distributed-systems/",
    blurb: "SLIs, alerting on symptoms, and why cardinality hurts. Pairs with the metrics example.",
    kind: "article",
  },
];
