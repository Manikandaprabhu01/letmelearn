import { AsyncConcurrencyLab } from "@/components/playgrounds/AsyncConcurrencyLab";
import { BloomFilterLab } from "@/components/playgrounds/BloomFilterLab";
import { BulkheadLab } from "@/components/playgrounds/BulkheadLab";
import { CanaryLab } from "@/components/playgrounds/CanaryLab";
import { CapLab } from "@/components/playgrounds/CapLab";
import { CircuitBreakerLab } from "@/components/playgrounds/CircuitBreakerLab";
import { HashRingLab } from "@/components/playgrounds/HashRingLab";
import { LlmCostLab } from "@/components/playgrounds/LlmCostLab";
import { LoadBalancerLab } from "@/components/playgrounds/LoadBalancerLab";
import { LruLab } from "@/components/playgrounds/LruLab";
import { QuorumLab } from "@/components/playgrounds/QuorumLab";
import { RagRetrievalLab } from "@/components/playgrounds/RagRetrievalLab";
import { RateLimiterLab } from "@/components/playgrounds/RateLimiterLab";
import { SagaLab } from "@/components/playgrounds/SagaLab";
import { SnowflakeLab } from "@/components/playgrounds/SnowflakeLab";
import { UrlShortenerLab } from "@/components/playgrounds/UrlShortenerLab";
import type { ComponentType } from "react";

export const PLAYGROUND_UI: Record<string, ComponentType> = {
  "rate-limiter": RateLimiterLab,
  "consistent-hashing": HashRingLab,
  snowflake: SnowflakeLab,
  "url-shortener": UrlShortenerLab,
  "cap-theorem": CapLab,
  "load-balancer": LoadBalancerLab,
  "lru-cache": LruLab,
  quorum: QuorumLab,
  "bloom-filter": BloomFilterLab,
  "circuit-breaker": CircuitBreakerLab,
  bulkhead: BulkheadLab,
  saga: SagaLab,
  "canary-release": CanaryLab,
  "rag-retrieval": RagRetrievalLab,
  "llm-cost": LlmCostLab,
  "async-concurrency": AsyncConcurrencyLab,
};
