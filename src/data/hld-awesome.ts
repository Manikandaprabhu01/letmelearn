import type { Concept } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

/** Extra HLD vocabulary from source 6 (awesome-system-design-resources). */
export const awesomeHldConcepts: Concept[] = [
  {
    slug: "availability",
    title: "Availability, Reliability, SPOF",
    subtitle: "Nines, failover, and the box whose death takes the product with it.",
    level: "foundational",
    minutes: 10,
    tags: ["reliability", "Awesome list"],
    summary:
      "Source 6's core-concepts spine. Availability is 'the system answers'. Reliability is 'it answers correctly over time'. A single point of failure is a box, disk, AZ, or person whose loss takes the SLO with it.",
    sections: [
      {
        heading: "Nines are a budget",
        table: {
          headers: ["Nines", "Downtime / year", "What it usually costs"],
          rows: [
            ["99% (two)", "3.5 days", "A weekend off-call, a single AZ"],
            ["99.9% (three)", "8.8 hours", "Multi-AZ, automated failover, on-call"],
            ["99.99% (four)", "52 minutes", "Multi-region or very fast AZ failover, load tests, game days"],
            ["99.999% (five)", "5 minutes", "Active-active, and you still miss it on a bad deploy"],
          ],
        },
        body: [
          "Interviewers want the pairing: name the SLO, name the SPOF it implies, name the failover. 'We will be highly available' is not an answer.",
        ],
      },
      {
        heading: "Failover is a designed action",
        bullets: [
          "Health check → remove from the load balancer (soft).",
          "Promote a replica, or shift DNS / anycast to a warm region (hard).",
          "RPO / RTO: how much data you may lose, how long you may be down. A replica that is 30 minutes behind is not a failover plan.",
          "Fault tolerance is remaining correct *during* a failure, not merely recovering after.",
        ],
        callout: {
          kind: "insight",
          title: "SPOF hunt",
          text: "Primary DB, the lock service, the CI system that cannot deploy a fix, the one person who knows the runbook. Draw them. Then say which ones you will actually fix in this interview.",
        },
      },
    ],
    related: ["/hld/scaling", "/hld/replication", "/hld/circuit-breaker", "/hld/consensus"],
    furtherReading: [
      { label: "Awesome list — availability", href: "https://algomaster.io/learn/system-design/availability" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "idempotency",
    title: "Idempotency",
    subtitle: "The same request, twice, is still one effect.",
    level: "foundational",
    minutes: 9,
    tags: ["api", "Awesome list"],
    summary:
      "Retries are how networks survive. Idempotency is how retries do not double-charge. An idempotency key on the write path, stored with the result, turns at-least-once delivery into exactly-once effects.",
    sections: [
      {
        heading: "Where it shows up",
        bullets: [
          "Client retries after a timeout — the server may have applied the write.",
          "Queue at-least-once: the worker died after the side effect, before ack.",
          "Webhook deliveries. Stripe will retry; your handler must not ship twice.",
        ],
        table: {
          headers: ["Pattern", "How"],
          rows: [
            ["PUT / resource-id", "Natural: last write wins, same body"],
            ["Idempotency-Key header", "Store (key → response). Replay the stored response on a duplicate"],
            ["Idempotent consumer", "Dedup table of event ids, unique constraint"],
            ["Ledger", "Insert a journal row keyed by (account, op_id) before mutating balance"],
          ],
        },
        callout: {
          kind: "warn",
          title: "Keys expire",
          text: "Keep the key long enough to cover the retry window (hours, not seconds). A unique constraint in the DB beats a cache you can evict.",
        },
      },
    ],
    related: ["/examples/payment", "/examples/job-scheduler", "/examples/ticket-booking", "/hld/rate-limiting"],
    furtherReading: [
      { label: "Awesome list — idempotency", href: "https://algomaster.io/learn/system-design/idempotency" },
      { label: "Stripe — idempotent requests", href: "https://stripe.com/blog/payment-api-design" },
    ],
  },
  {
    slug: "consensus",
    title: "Consensus (Raft / Paxos)",
    subtitle: "A cluster agrees on the next byte of the log.",
    level: "advanced",
    minutes: 12,
    tags: ["distributed", "Awesome list"],
    summary:
      "Source 6 lists consensus next to heartbeats and gossip. In an interview you do not derive Paxos. You say: a replicated log, a leader, a majority, and why the lock service / config / metadata plane needs this when Dynamo-style quorum does not.",
    sections: [
      {
        heading: "What you actually use",
        table: {
          headers: ["System", "Uses consensus for"],
          rows: [
            ["etcd, ZooKeeper, Chubby", "The whole API — small, strongly consistent state"],
            ["Kafka (KRaft / ZK)", "Controller, membership, partition leaders"],
            ["Spanner / Cockroach", "Per-range Raft groups under the SQL"],
            ["Your product DB", "Usually not — you take RDS/Cloud SQL's word for it"],
          ],
        },
        body: [
          "Raft: elect a leader, leader appends to a log, majority ack, then apply. A minority partition cannot elect a second leader because it cannot gather a majority. That is the whole trick.",
        ],
        diagram: {
          kind: "flow",
          caption: "A 5-node Raft group, majority = 3",
          rows: [
            [
              { id: "l", label: "Leader", tone: "accent" },
              { id: "f1", label: "Follower" },
              { id: "f2", label: "Follower" },
              { id: "f3", label: "Follower" },
              { id: "f4", label: "Follower" },
            ],
          ],
        },
      },
      {
        heading: "Versus Dynamo quorum",
        body: [
          "Sloppy quorum (W + R > N) gives you durability and a high chance of reading the latest, not a single agreed history. If you need 'exactly one primary for this shard', that is consensus. If you need 'the shopping cart eventually merges', that is Dynamo. Do not mix the words.",
        ],
      },
    ],
    related: ["/hld/quorum", "/hld/cap-theorem", "/examples/distributed-lock", "/hld/gossip"],
    furtherReading: [
      { label: "Raft paper (understand this one)", href: "https://raft.github.io/raft.pdf" },
      { label: "Paxos (source 6)", href: "https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf" },
    ],
  },
  {
    slug: "gossip",
    title: "Gossip Protocol",
    subtitle: "Each node tells a few peers the news. The cluster finds out.",
    level: "intermediate",
    minutes: 8,
    tags: ["distributed", "Awesome list"],
    summary:
      "Epidemic dissemination. Used for membership, failure detection, and eventually-consistent metadata (Dynamo, Cassandra, SWIM). Not for the money path.",
    sections: [
      {
        heading: "How it spreads",
        numbered: [
          "Every node keeps a view of the cluster (alive, suspect, dead, plus a version / heartbeat counter).",
          "On a tick, pick a small random set of peers and exchange views. Union, last-write-wins on versions.",
          "If you have not heard from A in T1, mark suspect; after T2, dead. A later gossip can refute.",
        ],
        table: {
          headers: ["Good for", "Bad for"],
          rows: [
            ["Membership, schema version, ring state", "Leader election, once-only side effects"],
            ["Surviving partitions without a coordinator", "Bounded latency to 'everyone knows'"],
          ],
        },
        callout: {
          kind: "note",
          title: "Pair with the KV example",
          text: "Dynamo gossips membership and the token ring. Hinted handoff and sloppy quorum are the write path. Gossip is how nodes learn who is back.",
        },
      },
    ],
    related: ["/examples/kv-store", "/hld/consistent-hashing", "/hld/consensus"],
    furtherReading: [
      { label: "Gossip protocol explained", href: "http://highscalability.com/blog/2023/7/16/gossip-protocol-explained.html" },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
  {
    slug: "rest-vs-graphql",
    title: "REST vs GraphQL vs RPC",
    subtitle: "Three ways to ship a function call over the network.",
    level: "foundational",
    minutes: 9,
    tags: ["api", "Awesome list"],
    summary:
      "Source 6's API spine. REST is resources and verbs. GraphQL is a typed query the client shapes. RPC (gRPC) is methods and protobufs. Pick from payload shape, chattiness, and who owns the contract.",
    sections: [
      {
        heading: "When to open which door",
        table: {
          headers: ["Style", "Pick when", "Cost"],
          rows: [
            ["REST + JSON", "Public HTTP APIs, caching, wide client mix", "Over/under-fetch; versioning via URL or headers"],
            ["GraphQL", "Many clients, nested views, BFF-shaped products", "N+1 resolvers, a hard cache, auth per field"],
            ["gRPC", "Service-to-service, streaming, strict schemas", "Ugly in a browser without a gateway"],
          ],
        },
        bullets: [
          "Idempotency and pagination are API design, not REST-vs-RPC. Cover them either way.",
          "An API gateway can present REST/GraphQL to the world and speak gRPC behind it.",
        ],
      },
    ],
    related: ["/hld/api-gateway", "/hld/websockets", "/hld/idempotency"],
    furtherReading: [
      { label: "Awesome list — REST vs GraphQL", href: "https://blog.algomaster.io/p/rest-vs-graphql" },
      { label: "Awesome list — REST vs RPC", href: "https://blog.algomaster.io/p/106604fb-b746-41de-88fb-60e932b2ff68" },
    ],
  },
  {
    slug: "pub-sub",
    title: "Pub/Sub vs Message Queues",
    subtitle: "Fan-out a fact, or hand a job to one worker.",
    level: "foundational",
    minutes: 8,
    tags: ["async", "Awesome list"],
    summary:
      "Source 6 splits pub/sub from message queues. A queue (work queue) delivers each message to one consumer in a group. Pub/sub delivers a copy to every subscription. Kafka can be both, depending on how you assign consumer groups.",
    sections: [
      {
        heading: "Choose the primitive",
        table: {
          headers: ["Need", "Primitive"],
          rows: [
            ["Thumbnail this upload once", "Work queue (SQS, Rabbit, a Kafka group with one group id)"],
            ["Cache invalidation, 'user updated', metrics", "Pub/sub (SNS, Redis Pub/Sub, NATS, Kafka with many groups)"],
            ["Replay history, several independent downstreams", "A log (Kafka) — each downstream is a consumer group"],
          ],
        },
        callout: {
          kind: "insight",
          title: "CDC sits here",
          text: "Change data capture (Debezium, Dynamo streams) is pub/sub of the database's own log. Source 6 lists it next to queues on purpose.",
        },
      },
    ],
    related: ["/hld/message-queues", "/examples/distributed-mq", "/examples/notification"],
    furtherReading: [
      { label: "Awesome list — pub/sub", href: "https://algomaster.io/learn/system-design/pub-sub" },
      { label: "Awesome list — CDC", href: "https://algomaster.io/learn/system-design/change-data-capture-cdc" },
    ],
  },
];
