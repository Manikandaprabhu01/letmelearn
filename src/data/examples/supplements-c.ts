import type { DesignExample } from "@/data/types";

export const supplementsC: Record<string, Partial<DesignExample>> = {
  leaderboard: {
    clarifying: [
      {
        q: "How many players, and how often do scores change?",
        a: "Millions of players with continuous updates. That write rate rules out recomputing ranks on read and is why a sorted structure is maintained incrementally.",
      },
      {
        q: "Global only, or also friends and regions?",
        a: "Several leaderboards at once. Each is a separate sorted set, and a player appears in many of them — which multiplies the write cost per score update.",
      },
      {
        q: "Does a player need their exact rank?",
        a: "Ask, because exact rank for a mid-table player is expensive and approximate rank is usually acceptable. Top-N is cheap; 'you are number 4,812,003' is not.",
      },
    ],
    wrapUp: [
      "A sorted set gives O(log n) updates and O(log n + k) top-k reads, which is why Redis is the standard answer here.",
      "Multiple leaderboards mean one score update writes to several sorted sets — global, regional, friends, weekly — so the write amplification is the real cost.",
      "Time-bounded boards (daily, weekly) are separate keys with TTLs rather than filters over one big board.",
      "Exact rank deep in the table is expensive; approximate rank via bucketing is usually the right product answer.",
      "With another hour: persistence and rebuild from the score-of-record store, and anti-cheat validation before a score is accepted.",
    ],
    followUps: [
      {
        q: "How do you get a player's rank without scanning?",
        a: "A sorted set maintains rank as part of its structure, so a rank query is a logarithmic operation rather than a scan. The cost appears when a single sorted set gets very large or when you need many boards, since each update touches all of them. For deep ranks I would consider bucketing — counting how many players are in each score bucket — which gives an approximate rank in constant time.",
      },
      {
        q: "How do you handle ties?",
        a: "Define the rule explicitly, because the naive answer is non-deterministic. The usual approach is to encode a secondary key into the score itself — for example score plus an inverted timestamp — so earlier achievement of the same score ranks higher and the order is stable across reads. Leaving ties to the store's internal ordering produces a leaderboard that reshuffles for no visible reason.",
      },
      {
        q: "What if Redis loses the data?",
        a: "The leaderboard must be reconstructible, so scores are also written to a durable store as the record of truth, and the sorted sets are treated as a derived index. Rebuilding a large board takes time, so I would rebuild the top segment first — which is what almost everyone looks at — and backfill the tail.",
      },
    ],
  },

  "digital-wallet": {
    clarifying: [
      {
        q: "Can a balance go negative?",
        a: "No. That constraint is the whole design: every debit must atomically check and decrement, which rules out eventually consistent balances.",
      },
      {
        q: "Are transfers between users internal or through a bank?",
        a: "Internal ledger movements, which is what makes them fast and atomic. External movement is a separate, slower path with its own reconciliation.",
      },
      {
        q: "What audit requirements apply?",
        a: "Full history, immutable, retained for years. That makes an append-only ledger a requirement rather than a design preference.",
      },
    ],
    wrapUp: [
      "The wallet is a ledger: balances are derived by summing entries, never stored as a mutable field that could drift.",
      "A transfer is one transaction with balanced debit and credit entries, and it must be atomic — a partial transfer is money created or destroyed.",
      "Locking order matters: always lock accounts in a fixed order, or two opposite transfers deadlock.",
      "Idempotency keys make retries safe, which matters because a timed-out transfer will be retried by a user or a client.",
      "With another hour: sharding accounts while keeping transfers within a shard, and the reconciliation process against external rails.",
    ],
    followUps: [
      {
        q: "How do you prevent a double spend?",
        a: "The check and the decrement are one atomic operation — a conditional update that only succeeds when the balance is sufficient, or a row lock held for the duration of the transaction. Reading the balance, deciding in application code, and then writing is the bug, because two concurrent transfers can both read the same sufficient balance.",
      },
      {
        q: "Two users transfer to each other simultaneously. What happens?",
        a: "Without care, a deadlock: each transaction holds one account and wants the other. The fix is a total ordering — always lock the lower account id first — so the cycle cannot form. It is a small detail that is invisible in testing and shows up under production concurrency.",
      },
      {
        q: "How do you shard this?",
        a: "By account, with the strong preference that both sides of a transfer live on the same shard so it stays a local transaction. Where that is impossible, cross-shard transfers need a saga with compensating entries rather than two-phase commit, and each step must be idempotent. That complexity is a good reason to delay sharding a wallet system as long as possible.",
      },
    ],
  },

  "stock-exchange": {
    clarifying: [
      {
        q: "What latency budget?",
        a: "Microseconds. That single answer changes everything — it rules out network hops between components, garbage-collected languages in the hot path, and disk writes on the critical path.",
      },
      {
        q: "How strict is fairness?",
        a: "Strict price-time priority, and it must be auditable. Fairness here is a regulatory requirement, not a nicety.",
      },
      {
        q: "What happens on a crash?",
        a: "Full recovery with no lost orders. That means a sequenced, replicated input log that can be replayed deterministically.",
      },
    ],
    wrapUp: [
      "The matching engine is deliberately single-threaded per symbol: determinism and fairness matter more than parallelism within a book.",
      "Everything sits in memory, and durability comes from an append-only sequenced input log rather than from writing state to disk.",
      "Recovery is replay: the same ordered inputs through the same deterministic engine reproduce the exact book state.",
      "Scaling is by symbol partitioning — different instruments run on different engines — because a single book cannot be parallelised without losing ordering.",
      "With another hour: market data fan-out to thousands of subscribers, and circuit breakers and auction states.",
    ],
    followUps: [
      {
        q: "Why single-threaded?",
        a: "Because price-time priority requires a total order over the book, and any concurrency introduces either locks that dominate the latency budget or non-determinism that makes replay impossible. A single thread processing a sequenced input stream is both the fastest option at this scale and the only one that reproduces exactly on recovery and in audit.",
      },
      {
        q: "How is it durable without writing state to disk?",
        a: "By persisting inputs rather than state. Every order and cancellation is written to a replicated append-only log with a sequence number before being processed. Because the engine is deterministic, replaying that log rebuilds the identical book. Periodic snapshots bound how much has to be replayed, exactly like a database checkpoint plus write-ahead log.",
      },
      {
        q: "How do you scale beyond one machine?",
        a: "By partitioning across symbols — each instrument's book is independent, so different symbols run on different engines. What cannot be split is a single book, since it needs a total order. Cross-symbol operations like basket orders then need coordination above the engines, which is why they carry different guarantees.",
      },
    ],
  },

  "auth-system": {
    clarifying: [
      {
        q: "Session tokens or JWTs?",
        a: "This is the design's central trade: sessions are revocable but need a lookup; JWTs are stateless but cannot be revoked before expiry without reintroducing state.",
      },
      {
        q: "How quickly must revocation take effect?",
        a: "Ask explicitly. 'Immediately' rules out long-lived stateless tokens; 'within fifteen minutes' makes short-lived access tokens plus refresh workable.",
      },
      {
        q: "Do we support third-party login and multiple devices?",
        a: "Yes to both, which means an identity that can have several credentials attached and sessions tracked per device.",
      },
    ],
    wrapUp: [
      "The practical shape is short-lived access tokens plus long-lived refresh tokens, which gets most of the statelessness benefit while keeping revocation possible.",
      "Passwords are stored with a slow, salted hash (argon2 or bcrypt) — never a fast general-purpose hash, and never encrypted-and-decryptable.",
      "Refresh tokens should rotate on use, so a stolen refresh token is detectable when the original is replayed.",
      "Rate limiting and lockout on the login path are part of the design, not an operational add-on.",
      "With another hour: multi-factor enrolment and recovery, and session listing and remote revocation per device.",
    ],
    followUps: [
      {
        q: "JWT or session token?",
        a: "Short-lived JWTs for access plus a stateful refresh token, which is the usual compromise. Pure JWTs cannot be revoked before expiry, so a compromised token stays valid — and adding a denylist reintroduces the lookup they were meant to avoid. Keeping access tokens to a few minutes bounds that exposure while still avoiding a database hit on most requests.",
      },
      {
        q: "How do you store passwords?",
        a: "Hashed with a deliberately slow, memory-hard function — argon2id or bcrypt — with a per-user salt and a work factor tuned so verification takes a meaningful fraction of a second. Never a fast hash like SHA-256, which is designed for speed and therefore for offline cracking, and never anything reversible, because the goal is that a database leak does not yield passwords.",
      },
      {
        q: "How do you handle a stolen refresh token?",
        a: "Rotate refresh tokens on every use and remember the previous one. If an old token is presented again, either the legitimate client or the attacker is replaying it, so the whole token family is revoked and the user re-authenticates. That turns theft from an indefinite compromise into a detectable event.",
      },
    ],
  },

  "distributed-cache": {
    clarifying: [
      {
        q: "Cache-aside or read-through?",
        a: "Cache-aside by default: the application controls the fallback, and a cache outage degrades performance rather than breaking correctness.",
      },
      {
        q: "How stale can data be?",
        a: "The most important question, and the answer differs per key type. Prices and permissions want seconds; a follower count is fine at minutes.",
      },
      {
        q: "What happens when the cache is unavailable?",
        a: "Reads fall through to the database, which must be able to survive that — or you have built a cache that is actually a dependency.",
      },
    ],
    wrapUp: [
      "Nodes are placed on a consistent hash ring so that adding or losing one moves ~1/N of the keys rather than nearly all of them.",
      "Eviction policy and memory limits must be set explicitly — a cache with no eviction policy that fills up starts rejecting writes.",
      "The three failure modes are stampede, penetration and avalanche, and each has a specific fix: single-flight, negative caching, and TTL jitter.",
      "Delete on write rather than update, so two concurrent writers cannot leave the cache holding the older value permanently.",
      "With another hour: replication for hot keys, and client-side near-caching with an invalidation channel.",
    ],
    followUps: [
      {
        q: "A single key gets 50,000 requests per second. What breaks?",
        a: "Consistent hashing sends that key to exactly one node, which becomes a hotspot no matter how well the rest is balanced. The fixes are to put a small in-process cache in front so most requests never leave the application server, or to replicate the key across several nodes and read a random replica. It is worth stating clearly that consistent hashing distributes keys, not traffic.",
      },
      {
        q: "How do you avoid a stampede when a hot key expires?",
        a: "Single-flight: the first request to miss takes a lock on that key and loads it while the others wait on the same result, so one database query serves them all. Better still, refresh probabilistically before expiry so the key never actually goes cold under load, and serve the stale value while the refresh happens.",
      },
      {
        q: "The whole cache tier goes down. What happens?",
        a: "With cache-aside, correctness is unaffected and the full read load lands on the database, which is usually not provisioned for it — so it is a genuine outage mode. I would rate limit or shed load at the edge while it recovers, keep a small in-process cache as a second line of defence, and warm the cache before returning it to service rather than letting it cold-start under full traffic.",
      },
    ],
  },

  "job-scheduler": {
    clarifying: [
      {
        q: "At-least-once or at-most-once execution?",
        a: "At-least-once with idempotent jobs is the practical answer. At-most-once means a crashed worker silently drops work, which is usually worse.",
      },
      {
        q: "Do jobs have dependencies?",
        a: "If yes, this becomes a DAG scheduler rather than a queue, which is a substantially bigger system. Scope it explicitly.",
      },
      {
        q: "How precise must scheduled times be?",
        a: "Seconds is usually fine. Millisecond precision across a distributed scheduler is a much harder and rarely necessary requirement.",
      },
    ],
    wrapUp: [
      "Scheduled jobs are rows with a due time and a lease: workers claim due jobs atomically, extend the lease while running, and release on completion.",
      "The lease is what makes worker death survivable — an expired lease means the job becomes claimable again.",
      "Exactly-once execution is not achievable, so jobs must be idempotent and the design should say so rather than pretend otherwise.",
      "Recurring jobs need catch-up policy: after downtime, do you run every missed occurrence or only the latest?",
      "With another hour: DAG dependencies and backfill, and per-tenant fairness so one customer's jobs cannot starve others.",
    ],
    followUps: [
      {
        q: "How do you stop two workers running the same job?",
        a: "An atomic claim — a conditional update that sets the job's lease owner and expiry only if it is currently unclaimed, or SELECT ... FOR UPDATE SKIP LOCKED so the database hands each worker a different row. Zero rows affected means someone else took it. Reading due jobs and then updating them is the version that double-runs under load.",
      },
      {
        q: "A worker dies mid-job. What happens?",
        a: "Its lease expires and another worker claims the job, which is why long-running jobs must extend their lease periodically as a heartbeat. That guarantees the work is retried, at the cost of possible double execution if the original worker was merely slow rather than dead — which is exactly why jobs must be idempotent.",
      },
      {
        q: "The scheduler was down for two hours. What runs?",
        a: "That is a policy decision that has to be made per job type. A nightly report should run once on recovery, not twelve times; a data sync probably should process every missed window. I would make it an explicit property of the job — catch up all, catch up latest, or skip — rather than letting the recovery behaviour be an accident of implementation.",
      },
    ],
  },
};
