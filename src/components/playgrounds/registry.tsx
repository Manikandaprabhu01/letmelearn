import { CapLab } from "@/components/playgrounds/CapLab";
import { HashRingLab } from "@/components/playgrounds/HashRingLab";
import { LoadBalancerLab } from "@/components/playgrounds/LoadBalancerLab";
import { LruLab } from "@/components/playgrounds/LruLab";
import { QuorumLab } from "@/components/playgrounds/QuorumLab";
import { RateLimiterLab } from "@/components/playgrounds/RateLimiterLab";
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
};
