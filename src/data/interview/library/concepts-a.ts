// Imported from the Interview Prep Console (lib/data-concepts-a.js).
import type { ConceptAnswer } from "../types";

export const conceptsA: ConceptAnswer[] = [
  {
    id: "c-indexing",
    t: "What is database indexing?",
    cat: "Databases",
    r: 1,
    src: ["L4", "S3", "S1"],
    a: "An index is a separate, ordered data structure that maps column values to row locations so the engine can find rows without scanning the table. Almost all relational indexes are **B+ trees**: sorted, balanced, with all values in the leaves linked together, giving O(log n) lookups and efficient range scans.\n\nThe trade-off is the whole answer: reads get faster, writes get slower (every INSERT/UPDATE/DELETE must maintain every affected index) and storage grows. So index the columns you filter, join and sort on in hot queries — and nothing else.\n\nKey distinctions to name:\n- **Clustered (primary) index** — the table itself is stored in this order, so there is only one. In InnoDB the primary key is clustered and every secondary index stores the primary key as its pointer, which is why a wide primary key is expensive. Postgres heap tables have no clustered index; the primary key is just a unique B-tree.\n- **Composite index** — column order matters. An index on (tenant_id, created_at) serves WHERE tenant_id = ? ORDER BY created_at, and also WHERE tenant_id = ? alone (leftmost prefix), but not WHERE created_at = ? alone.\n- **Covering index** — if every column the query needs is in the index, the engine never touches the table (an index-only scan). In Postgres, INCLUDE adds payload columns for exactly this.\n- **Partial / filtered index** — index only the rows you query: WHERE read_at IS NULL. Much smaller and cheaper to maintain.\n- **Other types** — hash (equality only), GIN (JSONB, arrays, full text), GiST (geometry, ranges), BRIN (huge append-only tables ordered by time).\n\nAn index is not used when the predicate wraps the column in a function (WHERE lower(email) = ?, unless you build an expression index), when a leading wildcard is used (LIKE '%x'), or when the planner estimates the query will touch a large fraction of the table — a sequential scan is genuinely faster then.",
    sql: "-- composite index: equality columns first, then the range/sort column\nCREATE INDEX idx_tickets_tenant_status_created\n  ON tickets (tenant_id, status, created_at DESC);\n\n-- partial index: only the rows you actually query\nCREATE INDEX idx_notifications_unread\n  ON notifications (recipient_id, created_at DESC)\n  WHERE read_at IS NULL;\n\n-- covering index (index-only scan)\nCREATE INDEX idx_orders_customer_covering\n  ON orders (customer_id, placed_at DESC) INCLUDE (total, status);\n\n-- verify it is actually used\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT id, total FROM orders\nWHERE customer_id = 42 ORDER BY placed_at DESC LIMIT 20;",
    fu: [
      {
        q: "How do you decide the column order in a composite index?",
        a: "Equality predicates first, then the range or ORDER BY column. For WHERE tenant_id = ? AND created_at > ? ORDER BY created_at, the index is (tenant_id, created_at). Putting the range column first makes the rest of the index unusable for filtering.",
      },
      {
        q: "How many indexes are too many?",
        a: "When write throughput or bloat becomes the constraint. Look for indexes that are never scanned (pg_stat_user_indexes.idx_scan = 0) and for redundant prefixes — an index on (a) is redundant if (a, b) exists.",
      },
      {
        q: "Why did the planner ignore my index?",
        a: "Stale statistics (run ANALYZE), low selectivity (the value matches 40% of rows), a type mismatch that prevents the index being used, or a function applied to the column. EXPLAIN ANALYZE shows the estimate versus the actual row count — a large gap is the usual culprit.",
      },
    ],
  },
  {
    id: "c-consistenthash",
    t: "What is consistent hashing?",
    cat: "Distributed systems",
    r: 1,
    src: ["L4", "S2"],
    a: "A way to map keys to servers so that adding or removing a server moves only a small fraction of keys instead of remapping everything.\n\nWith naive modulo (hash(key) % N), changing N from 4 to 5 moves roughly 80% of keys — every cache miss at once, which is how a cache resize takes down a database. Consistent hashing places both servers and keys on a conceptual ring of hash values; a key belongs to the first server clockwise from it. Adding a server steals keys only from its immediate neighbour, so about 1/N of keys move.\n\nTwo refinements matter in an interview:\n- **Virtual nodes**: each physical server is placed at many points (100–200) on the ring, which evens out the distribution and makes the impact of a failure spread across all remaining nodes rather than dumping onto one neighbour.\n- **Replication**: walk clockwise to the next R distinct physical nodes to place replicas — this is exactly what Cassandra and DynamoDB do.\n\nWhere it shows up: sharded caches (Redis cluster uses 16,384 hash slots, a related idea), Cassandra/Dynamo partitioning, sticky load balancing, and the session registry in a chat system. The known weakness is hot keys: consistent hashing balances key *counts*, not key *traffic*, so one celebrity key still lands on one node — mitigate with key splitting or a local cache in front.\n\nThe modern alternative worth naming is **rendezvous (highest random weight) hashing**: for each key, compute hash(key, node) for every node and pick the maximum. It needs no ring and gives similar minimal-disruption properties.",
    java: 'class ConsistentHashRing<T> {\n    private final SortedMap<Long, T> ring = new TreeMap<>();\n    private final int virtualNodes;\n\n    ConsistentHashRing(int virtualNodes) { this.virtualNodes = virtualNodes; }\n\n    void addNode(T node) {\n        for (int i = 0; i < virtualNodes; i++)\n            ring.put(hash(node.toString() + "#" + i), node);\n    }\n\n    void removeNode(T node) {\n        for (int i = 0; i < virtualNodes; i++)\n            ring.remove(hash(node.toString() + "#" + i));\n    }\n\n    T nodeFor(String key) {\n        if (ring.isEmpty()) return null;\n        long h = hash(key);\n        SortedMap<Long, T> tail = ring.tailMap(h);        // first node clockwise\n        Long k = tail.isEmpty() ? ring.firstKey() : tail.firstKey();\n        return ring.get(k);\n    }\n\n    private long hash(String s) {\n        return Hashing.murmur3_128().hashUnencodedChars(s).asLong();\n    }\n}',
    py: "import bisect, hashlib\n\nclass ConsistentHashRing:\n    def __init__(self, virtual_nodes=150):\n        self.vnodes = virtual_nodes\n        self.keys = []      # sorted hashes\n        self.nodes = {}     # hash -> node\n\n    def _hash(self, s):\n        return int(hashlib.md5(s.encode()).hexdigest()[:16], 16)\n\n    def add_node(self, node):\n        for i in range(self.vnodes):\n            h = self._hash(f'{node}#{i}')\n            bisect.insort(self.keys, h)\n            self.nodes[h] = node\n\n    def remove_node(self, node):\n        for i in range(self.vnodes):\n            h = self._hash(f'{node}#{i}')\n            self.keys.remove(h)\n            del self.nodes[h]\n\n    def node_for(self, key):\n        if not self.keys:\n            return None\n        h = self._hash(key)\n        i = bisect.bisect(self.keys, h) % len(self.keys)   # wrap around the ring\n        return self.nodes[self.keys[i]]",
    fu: [
      {
        q: "Why virtual nodes?",
        a: "With one point per server, random placement leaves some servers owning far more of the ring than others (load can vary by 2–3×), and removing a node dumps all its keys on a single neighbour. 100–200 virtual nodes per server smooths both.",
      },
      {
        q: "Where would you use it in production?",
        a: "Sharding a Redis cache fleet, routing tenants to processing nodes, sticky WebSocket routing, and partitioning a rate-limiter keyspace. The reason to mention tenants: it keeps a tenant's data on a predictable node without a lookup table.",
      },
      {
        q: "How does Redis Cluster differ?",
        a: "It uses 16,384 fixed hash slots mapped to nodes; resharding moves slots, not individual keys, and the mapping is explicit rather than derived from a ring. It is simpler to reason about and to migrate.",
      },
    ],
  },
  {
    id: "c-cap",
    t: "Explain the CAP theorem",
    cat: "Distributed systems",
    r: 3,
    src: ["L4"],
    a: "For a distributed system, when a **network partition** happens you must choose between **consistency** (every read sees the latest write) and **availability** (every request gets a non-error response). You cannot have both during the partition; when there is no partition you can have both.\n\nThe precise framing matters, because the sloppy version ('pick two of three') is what gets corrected in interviews. Partition tolerance is not optional — networks fail — so real systems are CP or AP, and the choice is per operation, not per company:\n- **CP**: a payment, an inventory decrement, a quota check, leader election. Refusing to serve is better than serving wrong. ZooKeeper, etcd, Spanner, a Postgres primary.\n- **AP**: a feed, a product catalogue, a cache, presence. Serving slightly stale data beats an error page. Cassandra (tunable), DynamoDB (tunable), DNS.\n\nThen add **PACELC**, which is what senior candidates bring up: *if* Partition, choose Availability or Consistency; *else* (normal operation) choose Latency or Consistency. It captures the everyday trade-off CAP ignores — synchronous replication costs latency even when nothing is broken.\n\nA concrete example: in a ticketing product, ticket creation and SLA counters are CP (a lost ticket is unacceptable), while the dashboard's 'tickets resolved today' widget is AP (a few seconds stale is fine). Saying which parts of *your* system sit where is the answer that lands.",
    fu: [
      {
        q: "Is Cassandra AP or CP?",
        a: "Tunable per query. With R + W > RF (for example quorum reads and writes) you get strong-ish consistency at the cost of availability during a partition; with W=1, R=1 you get high availability and eventual consistency. Saying 'it depends on the consistency level' is the correct answer.",
      },
      {
        q: "What is eventual consistency in practice?",
        a: "Replicas converge once writes stop propagating; readers may see stale or out-of-order values in the meantime. Practical mitigations: read-your-own-writes by routing a user's reads to the primary or a sticky replica for a short window, monotonic reads by pinning a session to one replica, and version vectors/last-write-wins for conflict resolution.",
      },
      {
        q: "How does this apply to a single-region SQL database with replicas?",
        a: "The primary is CP; asynchronous read replicas are AP and lag. That lag is the everyday version of this theorem: a user updates their profile, the read hits a replica, and they see the old value. Fix by routing reads after a write to the primary, or by waiting for the replica LSN.",
      },
    ],
  },
  {
    id: "c-sqlnosql",
    t: "When would you choose SQL vs MongoDB vs Cassandra?",
    cat: "Databases",
    r: 3,
    src: ["L4", "S1"],
    a: "Answer with the access pattern first, never with a preference.\n\n**Relational (Postgres/MySQL)** — the default. Choose it when the data is relational, when you need multi-row ACID transactions, when queries will change over time (ad-hoc joins, reporting), and when the working set fits a primary plus replicas (comfortably into single-digit TB). Strengths: joins, constraints, transactions, mature tooling, rich indexing (partial, expression, GIN for JSONB). Weakness: scaling writes past one primary requires sharding, which you build yourself (or with Citus/Vitess).\n\n**MongoDB (document)** — choose it when the unit of work is a self-contained document with a variable shape, read and written whole: product catalogues with heterogeneous attributes, CMS content, per-tenant configuration blobs. Strengths: flexible schema, nested documents avoid joins, sharding built in. Weaknesses: joins are awkward ($lookup), and denormalised copies must be updated in many places — you trade write complexity for read simplicity. Note that Postgres JSONB covers many document use cases while keeping transactions, which is a strong point to raise.\n\n**Cassandra (wide column)** — choose it for very high write volume with a known, fixed access pattern: time series, messages, feeds, event logs, IoT. You design one table per query, the partition key is chosen so each query hits one partition, and data is clustered by time. Strengths: linear write scaling, multi-region masterless writes, TTL, no single point of failure. Weaknesses: no joins, no ad-hoc queries, tunable-but-eventual consistency, and heavy penalties for bad partition keys (hot partitions, unbounded partitions).\n\nThe decision sentence to say out loud: *'relational truth in Postgres; high-volume append-only streams in Cassandra; documents in Mongo only when the shape genuinely varies — and in most systems, all three via polyglot persistence with one clear owner per dataset.'*",
    sql: "-- Cassandra modelling is query-first: one table per query shape\nCREATE TABLE messages_by_conversation (\n  conversation_id uuid,\n  bucket          int,          -- prevents unbounded partitions\n  created_at      timeuuid,\n  message_id      uuid,\n  sender_id       uuid,\n  body            text,\n  PRIMARY KEY ((conversation_id, bucket), created_at)\n) WITH CLUSTERING ORDER BY (created_at DESC);\n\n-- the same data in Postgres, query-flexible instead of query-shaped\nCREATE TABLE messages (\n  message_id      bigserial PRIMARY KEY,\n  conversation_id bigint NOT NULL REFERENCES conversations(id),\n  sender_id       bigint NOT NULL,\n  body            text,\n  created_at      timestamptz NOT NULL DEFAULT now()\n) PARTITION BY RANGE (created_at);\nCREATE INDEX ON messages (conversation_id, created_at DESC);",
    fu: [
      {
        q: "How large can Postgres get before you must shard?",
        a: "Rules of thumb: a single primary handles tens of thousands of transactions per second and low single-digit TB comfortably with good indexing, partitioning and replicas. Before sharding, try read replicas, partitioning, moving blobs out, and archiving cold data — sharding is a one-way door that costs you joins and transactions.",
      },
      {
        q: "What is the biggest mistake people make with Cassandra?",
        a: "Choosing a partition key that grows without bound (all messages for a video, all events for a tenant) or that concentrates traffic on one node. Partitions should stay under ~100 MB; bucket by time or a hash suffix. Second mistake: expecting to add a new query later — you cannot without a new table.",
      },
      {
        q: "Postgres JSONB or MongoDB?",
        a: "If you need transactions and joins alongside flexible documents, JSONB with GIN indexes usually wins and keeps one database to operate. Mongo earns its place when documents are the whole model and horizontal sharding is needed from day one.",
      },
    ],
  },
  {
    id: "c-partition-shard",
    t: "Partitioning vs sharding (and the celebrity problem)",
    cat: "Databases",
    r: 2,
    src: ["S3"],
    a: "**Partitioning** splits one table into pieces *inside a single database instance* — by range (time), list (region) or hash. The engine prunes irrelevant partitions at query time and you can drop an old partition instantly instead of running a huge DELETE. It helps manageability and query performance; it does not add CPU, memory or write capacity.\n\n**Sharding** splits data *across independent database instances*, each holding a subset. It adds capacity — more CPU, memory and write throughput — but costs you cross-shard joins, cross-shard transactions, global uniqueness and easy re-balancing. Routing lives in the application or a proxy (Vitess, Citus).\n\nSo: partition for manageability and pruning, shard for capacity. Partitioning first is nearly always the right order.\n\n**Choosing a shard key** is the whole game: high cardinality, even distribution, and present in most queries so requests route to one shard. For a multi-tenant SaaS, tenant_id is the natural key — it keeps a tenant's data together and most queries are tenant-scoped.\n\n**The celebrity / hot-key problem**: one key attracts a disproportionate share of traffic — a huge tenant, a viral post, a popular product. The shard holding it saturates while others idle. Mitigations, in the order you would try them:\n1. Cache the hot key aggressively (often enough on its own).\n2. Split the key — append a bucket suffix (user_123#0..#9) and fan out reads, which turns one hot partition into ten.\n3. Give the outlier its own dedicated shard (common for enterprise tenants).\n4. Move the hot path off the database entirely — counters into Redis, reads into a read-through cache.\n5. Randomise the write key and aggregate asynchronously for counters.",
    sql: "-- partitioning (one instance): monthly range partitions\nCREATE TABLE events (\n  id bigserial, tenant_id bigint, created_at timestamptz NOT NULL, payload jsonb\n) PARTITION BY RANGE (created_at);\n\nCREATE TABLE events_2026_09 PARTITION OF events\n  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');\n\n-- retention becomes instant instead of a huge DELETE\nDROP TABLE events_2026_03;\n\n-- sharding (many instances) is a routing decision in the app:\n--   shard = consistent_hash(tenant_id) -> connection pool for that shard\n--   cross-shard queries fan out and merge in the application",
    fu: [
      {
        q: "How do you re-shard without downtime?",
        a: "Dual-write to old and new shards, backfill historical data, verify with a comparison job, flip reads per tenant behind a flag, then stop the dual write. Consistent hashing or a tenant→shard lookup table makes moving a subset feasible; modulo sharding does not.",
      },
      {
        q: "How do you generate ids across shards?",
        a: "Snowflake-style ids (timestamp + shard/worker id + sequence) give uniqueness, rough time ordering and no coordination. UUIDv7 is the modern equivalent. Avoid a global auto-increment — it is a single point of contention.",
      },
      {
        q: "How do you detect a hot shard?",
        a: "Per-shard and per-key metrics: QPS, p99 latency, CPU, and a top-keys sampler (Redis has --hotkeys; for SQL, sample pg_stat_statements by parameter). Alert on skew ratio, not absolute load.",
      },
    ],
  },
  {
    id: "c-join",
    t: "Write an SQL inner join (and the rest of the join family)",
    cat: "Databases",
    r: 3,
    src: ["S4", "S1"],
    a: "An **INNER JOIN** returns only rows where the join condition matches on both sides. LEFT JOIN keeps all left rows with NULLs where there is no match, RIGHT JOIN is its mirror, FULL OUTER keeps both sides, and CROSS JOIN is the cartesian product.\n\nThe two traps interviewers use: (1) putting a filter on the right table in the WHERE clause of a LEFT JOIN silently turns it into an inner join — the condition must go in the ON clause instead; (2) forgetting that COUNT(*) counts rows after the join, so a one-to-many join inflates counts unless you COUNT(DISTINCT ...) or aggregate in a subquery.\n\nAlso be ready to name the physical join strategies, because 'why is this query slow' usually ends there: **nested loop** (good when one side is tiny and the other is indexed), **hash join** (good for large unsorted sets, needs memory), **merge join** (good when both inputs are already sorted, typically by an index).",
    sql: "-- inner join: agents and the tickets they own\nSELECT a.id AS agent_id, a.name, t.id AS ticket_id, t.subject, t.status\nFROM agents a\nINNER JOIN tickets t ON t.assignee_id = a.id\nWHERE t.status = 'OPEN'\nORDER BY t.created_at DESC;\n\n-- left join done right: every agent, with their open ticket count (zero included)\nSELECT a.id, a.name, COUNT(t.id) AS open_tickets\nFROM agents a\nLEFT JOIN tickets t\n       ON t.assignee_id = a.id\n      AND t.status = 'OPEN'          -- filter in ON, not WHERE\nGROUP BY a.id, a.name\nORDER BY open_tickets DESC;\n\n-- the bug this avoids: moving the predicate to WHERE drops agents with no open tickets\n-- SELECT ... FROM agents a LEFT JOIN tickets t ON t.assignee_id = a.id\n-- WHERE t.status = 'OPEN';         -- silently an INNER JOIN\n\n-- self join: tickets and their parent ticket\nSELECT c.id AS child_id, p.id AS parent_id, p.subject\nFROM tickets c\nJOIN tickets p ON p.id = c.parent_id;\n\n-- second highest salary (the classic follow-up), window-function version\nSELECT DISTINCT salary\nFROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk\n      FROM employees) ranked\nWHERE rnk = 2;",
    fu: [
      {
        q: "Difference between WHERE and HAVING?",
        a: "WHERE filters rows before grouping; HAVING filters groups after aggregation. HAVING COUNT(*) > 5 is legal, WHERE COUNT(*) > 5 is not.",
      },
      {
        q: "When is a subquery better than a join?",
        a: "EXISTS is usually better than a join for pure existence checks because it short-circuits and cannot duplicate rows; a join is better when you need columns from the other table. NOT IN is the one to avoid — it behaves unexpectedly when the subquery returns NULLs; use NOT EXISTS.",
      },
      {
        q: "How do you debug a slow join?",
        a: "EXPLAIN ANALYZE; look at the join strategy, the estimated versus actual rows, and whether an index is used on the join key. Common fixes: index the foreign key, ANALYZE for fresh statistics, reduce the row count before joining, and check for an implicit type cast on the join column.",
      },
    ],
  },
  {
    id: "c-latency-pool",
    t: "Managing database latency (connection pooling) and high availability",
    cat: "Databases",
    r: 3,
    src: ["S2"],
    a: "**Connection pooling.** Every Postgres connection is an OS process with ~5–10 MB of memory, so 500 app connections is a disaster. A pool keeps a small number of physical connections (a good starting point is cores × 2 + effective spindles, typically 10–30 per instance) and multiplexes requests over them. Use HikariCP inside the JVM, and PgBouncer in transaction mode in front of the database when you have many app pods — the pods' pools multiply otherwise. Watch the pool wait time metric: if threads queue for connections, adding more connections usually makes it worse, not better, because the database is already saturated.\n\nOther latency levers, in the order that usually pays: fix the query and its index; batch round trips (one query returning 100 rows beats 100 queries — the N+1 problem); cache hot reads; move analytics to a replica; make non-critical work asynchronous; and only then scale hardware.\n\n**High availability.** Primary with synchronous or asynchronous replicas, automatic failover (Patroni, RDS Multi-AZ), and a connection string or proxy that follows the new primary. The trade-offs to name:\n- Synchronous replication: no data loss on failover, but every commit waits for a replica — latency cost on every write.\n- Asynchronous: fast commits, but a failover can lose the last few transactions.\n- Read replicas add read capacity but introduce replication lag, so 'read your own write' needs routing to the primary or waiting for the replica's LSN.\n\n**Stickiness** in this context means keeping a user's requests on a node that already has their state — session affinity at the load balancer, or consistent hashing to a cache node. It improves cache hit rates but harms failure behaviour: when that node dies, those users lose their state. So prefer stateless services with shared state in Redis, and use stickiness only where it buys something measurable (WebSocket connections, local caches).",
    java: '// HikariCP: the settings that actually matter\nHikariConfig cfg = new HikariConfig();\ncfg.setJdbcUrl("jdbc:postgresql://db:5432/app");\ncfg.setMaximumPoolSize(20);            // NOT 200 — the DB is the bottleneck\ncfg.setMinimumIdle(5);\ncfg.setConnectionTimeout(3_000);       // fail fast instead of piling up threads\ncfg.setValidationTimeout(1_000);\ncfg.setIdleTimeout(600_000);\ncfg.setMaxLifetime(1_800_000);         // recycle before the DB or LB kills it\ncfg.setLeakDetectionThreshold(20_000); // find the connection you forgot to close\nDataSource ds = new HikariDataSource(cfg);\n\n// N+1: 1 query + N queries per row\nfor (Ticket t : ticketRepo.findAll())\n    t.setAgent(agentRepo.findById(t.getAgentId()));   // N round trips\n\n// fixed: one round trip, then map in memory\nList<Ticket> tickets = ticketRepo.findAll();\nMap<Long, Agent> agents = agentRepo.findAllByIdIn(\n        tickets.stream().map(Ticket::getAgentId).collect(toSet()))\n    .stream().collect(toMap(Agent::getId, identity()));\ntickets.forEach(t -> t.setAgent(agents.get(t.getAgentId())));',
    py: "# psycopg / SQLAlchemy pooling\nfrom sqlalchemy import create_engine\n\nengine = create_engine(\n    'postgresql+psycopg://app@db/app',\n    pool_size=20,          # steady-state connections\n    max_overflow=10,       # burst headroom\n    pool_timeout=3,        # fail fast\n    pool_recycle=1800,     # avoid stale server-side connections\n    pool_pre_ping=True,    # cheap liveness check before handing one out\n)\n\n# N+1 in an ORM, and the fix\n# bad:  for t in session.query(Ticket).all(): print(t.agent.name)\n# good: session.query(Ticket).options(joinedload(Ticket.agent)).all()",
    fu: [
      {
        q: "Why not just raise the pool size when queries are slow?",
        a: "Because the database, not the pool, is saturated: more concurrent queries means more contention, more context switching and worse p99. The correct move is to reduce work per query or queue at the application with a fast failure. Quote the counter-intuitive result — smaller pools often give higher throughput.",
      },
      {
        q: "PgBouncer transaction mode — what breaks?",
        a: "Anything relying on session state: prepared statements (unless handled), advisory locks, temporary tables, SET commands and LISTEN/NOTIFY. Know this before recommending it.",
      },
      {
        q: "How do you measure where the latency goes?",
        a: "Per-query timing (pg_stat_statements), pool wait time, and end-to-end tracing with spans around each database call. Instrument before optimising — the usual finding is one N+1 or one missing index rather than a systemic problem.",
      },
    ],
  },
  {
    id: "c-authnz",
    t: "How do authentication and authorization work?",
    cat: "API & web",
    r: 2,
    src: ["S3"],
    a: "**Authentication** answers 'who are you' — verifying a credential (password, token, certificate, biometric, or an assertion from an identity provider). **Authorization** answers 'what may you do' — evaluating whether that identity may perform an action on a resource. Authentication happens once per session; authorization happens on every request.\n\nA typical flow in a SaaS product: the user posts credentials, the auth service verifies the password hash (bcrypt/argon2id) and any MFA factor, then issues a short-lived signed access token (JWT) plus a long-lived opaque refresh token stored server-side. Each subsequent request carries the access token; services validate the signature locally using the public key from a JWKS endpoint — no network call — and then apply authorization rules.\n\nAuthorization models worth naming:\n- **RBAC** — roles hold permissions, users hold roles. Simple and enough for most products.\n- **ABAC** — decisions from attributes (department, region, resource owner, time). Flexible, harder to audit.\n- **ReBAC** — permissions derived from relationships in a graph (Google Zanzibar, SpiceDB): 'can view because they are a member of the group that owns the folder'. This is what modern SaaS products move to.\n\nThe implementation points that earn credit: enforce authorization in the service that owns the data, not only at the gateway; filter list endpoints in the query rather than post-filtering the response; cache permission lookups with a short TTL because they run on every request; and log every deny for security review.",
    java: '// Spring Security: authentication happens in the filter chain,\n// authorization at the method or query level.\n\n@PreAuthorize("hasRole(\'AGENT\')")\n@GetMapping("/tickets/{id}")\npublic TicketDto get(@PathVariable long id, @AuthenticationPrincipal AppUser user) {\n    Ticket t = repo.findById(id).orElseThrow(NotFound::new);\n\n    // resource-level check: role alone is not enough\n    if (!policy.canView(user, t))\n        throw new AccessDeniedException("not permitted");\n\n    return TicketDto.from(t);\n}\n\n// list endpoints: filter in the QUERY, never in the response\n@GetMapping("/tickets")\npublic Page<TicketDto> list(@AuthenticationPrincipal AppUser user, Pageable page) {\n    return repo.findVisibleTo(user.getTenantId(), user.getGroupIds(), page)\n               .map(TicketDto::from);\n}',
    py: "# FastAPI: dependency injection for authn, explicit policy call for authz\nfrom fastapi import Depends, HTTPException\n\nasync def current_user(token: str = Depends(oauth2_scheme)):\n    try:\n        claims = jwt.decode(token, public_key, algorithms=['RS256'],\n                            audience='api', options={'require': ['exp', 'sub']})\n    except jwt.PyJWTError:\n        raise HTTPException(401, 'invalid token')\n    return User(id=claims['sub'], tenant=claims['tenant'], roles=claims['roles'])\n\n@app.get('/tickets/{ticket_id}')\nasync def get_ticket(ticket_id: int, user: User = Depends(current_user)):\n    ticket = await repo.get(ticket_id)\n    if ticket is None or ticket.tenant_id != user.tenant:\n        raise HTTPException(404)           # 404, not 403: do not leak existence\n    if not policy.can_view(user, ticket):\n        raise HTTPException(403)\n    return ticket",
    fu: [
      {
        q: "Why return 404 instead of 403 sometimes?",
        a: "Returning 403 confirms the resource exists, which leaks information across tenants. For cross-tenant access, 404 is the safer response. Mentioning this unprompted is a strong security signal.",
      },
      {
        q: "Where do you store the JWT on a web client?",
        a: "Not in localStorage if you can avoid it (XSS reads it). Prefer an httpOnly, Secure, SameSite cookie for the refresh token and keep the access token in memory. Then add CSRF protection because cookies are sent automatically.",
      },
      {
        q: "OAuth2 vs OIDC vs SAML?",
        a: "OAuth2 is an authorization framework (delegated access via tokens); OIDC is an identity layer on top of it that adds the ID token so you can authenticate; SAML is the older XML-based enterprise SSO standard. Enterprises still ask for SAML, so a B2B product supports both.",
      },
    ],
  },
  {
    id: "c-patchput",
    t: "PATCH vs PUT (and REST semantics they probe around it)",
    cat: "API & web",
    r: 2,
    src: ["S3"],
    a: "**PUT replaces** the resource at the URI with the representation you send: it is a full update, and any field you omit should be treated as cleared or reset to default. **PATCH applies a partial modification**: only the fields you send change.\n\nThe property interviewers are really testing is **idempotency**. PUT is idempotent — sending the same full representation ten times leaves the same final state. PATCH is *not necessarily* idempotent: a JSON Merge Patch that sets fields is idempotent in practice, but a patch expressed as an operation ('increment count by 1', JSON Patch 'add to array') is not. That distinction decides whether a client may safely retry after a timeout.\n\nSurrounding facts worth having ready:\n- GET, HEAD, PUT, DELETE and OPTIONS are idempotent; POST and PATCH are not guaranteed to be. GET and HEAD are also safe (no side effects).\n- PUT can create a resource when the client chooses the URI (PUT /tickets/123); POST creates when the server assigns the id.\n- Two PATCH media types exist: `application/merge-patch+json` (send a partial object; null deletes a field) and `application/json-patch+json` (an array of explicit operations: add, remove, replace, test).\n- Concurrency: use ETag + If-Match on PATCH/PUT so a client cannot overwrite a change it never saw (optimistic locking over HTTP).\n- Status codes: 200 with the updated body or 204 on success, 404 if it does not exist, 409 on a version conflict, 412 when If-Match fails, 422 for a semantically invalid patch.",
    sql: '# PUT: full replacement — omitted fields are reset\nPUT /api/v2/tickets/42\nIf-Match: "v7"\nContent-Type: application/json\n{ "subject": "Printer offline", "status": "open", "priority": 2, "tags": ["hw"] }\n\n# PATCH (merge patch): only these fields change; null removes\nPATCH /api/v2/tickets/42\nIf-Match: "v7"\nContent-Type: application/merge-patch+json\n{ "priority": 1, "assignee_id": null }\n\n# PATCH (JSON Patch): explicit operations, NOT idempotent when using add\nPATCH /api/v2/tickets/42\nContent-Type: application/json-patch+json\n[ { "op": "test",    "path": "/status",   "value": "open" },\n  { "op": "replace", "path": "/priority", "value": 1 },\n  { "op": "add",     "path": "/tags/-",   "value": "urgent" } ]\n\n# Responses\n200 OK  + updated resource        # or 204 No Content\n412 Precondition Failed           # If-Match did not match -> client must re-read\n409 Conflict                      # version conflict at the application level',
    fu: [
      {
        q: "Is POST ever idempotent?",
        a: "Not by default, which is why payment and order APIs accept an Idempotency-Key header: the server stores the key with the result and replays the same response on retry. Naming that pattern is what the question is fishing for.",
      },
      {
        q: "How do you version an API?",
        a: "URI versioning (/v2/) is the most operationally simple and is what most SaaS products use; header/content negotiation is purist but harder to debug and cache. Whatever you pick, add fields in a backwards-compatible way and deprecate with a sunset header and a timeline.",
      },
      {
        q: "PUT to a collection?",
        a: "Legal but rare — it replaces the whole collection. Almost always a mistake in practice; use POST to add and PATCH to modify.",
      },
    ],
  },
  {
    id: "c-504",
    t: "How do you troubleshoot a 504 Gateway Timeout?",
    cat: "API & web",
    r: 2,
    src: ["S3"],
    a: "A 504 means an intermediary (load balancer, reverse proxy, API gateway) did not receive a response from upstream within its timeout — so the problem is upstream, or in the path to it, not in the client. Separate it from 502 (upstream returned an invalid response or the connection was refused) and 503 (upstream is out of capacity or deliberately shedding load).\n\nA structured triage, which is what the interviewer is grading:\n1. **Scope it.** All endpoints or one? All users or one tenant? Started when? Correlate with a deploy, a config change, a traffic spike, or a downstream incident.\n2. **Follow the hops.** Client → CDN → LB → gateway → service → database/third party. Each hop has its own timeout; find which one fired by comparing the timeout values with the observed duration (a 504 at exactly 60 s usually names the proxy).\n3. **Look at the upstream service.** Request rate, p99 latency, error rate, saturation (CPU, memory, GC pauses, thread pool queue, connection pool wait). A full thread pool with threads blocked on a slow database call is the single most common cause.\n4. **Look at the database.** Slow query log, lock waits, replication lag, connection pool exhaustion. One unindexed query after a data-growth threshold is the classic trigger.\n5. **Look outward.** A slow third-party call without a timeout will consume every worker thread — check for missing client-side timeouts.\n6. **Check the pod/instance level.** Was a deploy rolling? Were health checks failing so traffic concentrated on fewer pods? Is one AZ affected?\n\nThen the fixes, short term and long: raise the specific timeout only if the work legitimately takes that long; add or fix the index; add a client-side timeout and circuit breaker around the slow dependency; make the long operation asynchronous (202 Accepted plus a status endpoint); add bulkheads so one slow dependency cannot exhaust all threads; and shed load with a queue and rate limits.\n\nThe prevention answer: every outbound call has a timeout shorter than the caller's timeout (timeout budgets must decrease down the chain), retries carry jittered backoff and a budget, and every long operation is asynchronous by design.",
    fu: [
      {
        q: "Why can retries make a 504 storm worse?",
        a: "Retrying a request that is still executing upstream multiplies load on an already saturated service — a retry storm. Use bounded retries with exponential backoff and jitter, a retry budget (for example, retries capped at 10% of traffic), and never retry non-idempotent operations without an idempotency key.",
      },
      {
        q: "What do you set the timeouts to?",
        a: "Work backwards from the user-facing SLO: if the client expects a response in 3 s, the gateway gets 3 s, the service 2.5 s, the database call 1 s, and the third-party call 800 ms. Timeouts that increase down the chain guarantee the outer layer gives up while inner work continues, wasting capacity.",
      },
      {
        q: "How do you find the slow hop quickly in production?",
        a: "Distributed tracing with a shared request id: the span waterfall shows exactly which call consumed the budget. Without tracing, correlate logs by request id across services — which is the argument for the logging design in the HLD tab.",
      },
    ],
  },
  {
    id: "c-apispeed",
    t: "How would you speed up a slow API?",
    cat: "API & web",
    r: 1,
    src: ["L5"],
    a: "Measure first, then work down the list in cost order. Candidate reports list the same expected techniques: caching/CDN, rate limiting, database indexing, load balancing, compression and asynchronous processing. A structured version:\n\n**1. Measure.** Profile and trace before changing anything: p50/p95/p99, breakdown by hop (app CPU, database, external calls, serialisation), and which endpoints dominate. Optimising the wrong thing is the common failure.\n\n**2. Fix the database.** Usually the biggest win: add the missing index, eliminate N+1 queries, select only needed columns, paginate with cursors instead of OFFSET, batch writes, and move heavy reporting to a replica.\n\n**3. Cache at the right layer.** Client (Cache-Control, ETag), CDN for anything public and cacheable, an application cache (Redis) for hot computed results, and a local in-process cache for tiny hot reference data. Define the invalidation strategy at the same moment you add the cache.\n\n**4. Do less work in the request.** Move email, webhooks, indexing, thumbnails and analytics onto a queue and return 202. The user does not need to wait for work they do not see.\n\n**5. Shrink the payload.** gzip/brotli compression, field selection or GraphQL for mobile, pagination limits, and avoiding accidental serialisation of entire object graphs.\n\n**6. Scale out and protect.** Horizontal scaling behind a load balancer, connection pooling, HTTP keep-alive, and rate limiting so a single abusive client cannot degrade everyone (the protective, not the performance, part).\n\n**7. Then the harder things.** Precompute/materialise expensive aggregates, denormalise read models (CQRS), and use read replicas per region with edge routing.\n\nFinish with the discipline sentence: *every optimisation gets a before-and-after measurement, and a cache without an invalidation plan is a bug waiting to happen.*",
    fu: [
      {
        q: "What would you check in the first five minutes?",
        a: "The trace for one slow request, then the endpoint's top SQL by total time. Those two views explain most slowdowns without any guessing.",
      },
      {
        q: "Where do you put the cache?",
        a: "As close to the user as correctness allows. Public and immutable → CDN with a long TTL and a content-hashed URL. Per-user and cheap to recompute → local memory with a short TTL. Shared and expensive → Redis with explicit invalidation on write.",
      },
      {
        q: "When does compression hurt?",
        a: "On tiny payloads (the CPU and header cost exceeds the saving) and on already-compressed content (images, video). Set a minimum size threshold, typically around 1 KB.",
      },
    ],
  },
  {
    id: "c-encrypt-encode",
    t: "Difference between encryption and encoding (and hashing)",
    cat: "Security",
    r: 3,
    src: ["S1"],
    a: "Three different purposes, often confused in exactly the way this question is designed to expose:\n\n- **Encoding** transforms data into another format for safe transport or storage — Base64, URL encoding, UTF-8. It uses no key, anyone can reverse it, and it provides **no security whatsoever**. Base64 is not encryption; saying so is the point of the question.\n- **Encryption** transforms data so only a holder of the key can recover it. Symmetric (AES-GCM: one key, fast, for data at rest and in bulk) or asymmetric (RSA/ECC: public key encrypts, private key decrypts, used for key exchange and signatures). It is reversible **with the key**, and it provides confidentiality — and with AEAD modes such as GCM, integrity as well.\n- **Hashing** is a one-way function producing a fixed-size digest — SHA-256 for integrity, bcrypt/scrypt/argon2id for passwords. It cannot be reversed. Password hashes must be slow and salted; SHA-256 alone is the wrong choice for passwords because it is fast enough to brute-force.\n\nRelated distinctions worth adding: **signing** proves origin and integrity (HMAC with a shared secret, or a private-key signature); **tokenisation** replaces a value with a random reference held in a vault (how card numbers avoid PCI scope). And the practical rule: use TLS in transit, AES-256 at rest with keys in a KMS, argon2id for passwords, and never invent a scheme yourself.",
    java: '// encoding — reversible by anyone, NOT security\nString encoded = Base64.getEncoder().encodeToString("secret".getBytes(UTF_8));\nString back    = new String(Base64.getDecoder().decode(encoded), UTF_8);\n\n// encryption — AES-GCM (authenticated: confidentiality + integrity)\nbyte[] iv = new byte[12];\nSecureRandom.getInstanceStrong().nextBytes(iv);          // unique per message\nCipher c = Cipher.getInstance("AES/GCM/NoPadding");\nc.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));\nbyte[] cipherText = c.doFinal(plain.getBytes(UTF_8));    // store iv alongside\n\n// hashing a password — slow and salted on purpose\nString hash = BCrypt.hashpw(password, BCrypt.gensalt(12));\nboolean ok  = BCrypt.checkpw(password, hash);',
    py: "import base64, os\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom argon2 import PasswordHasher\n\n# encoding\nencoded = base64.b64encode(b'secret').decode()\nback = base64.b64decode(encoded)\n\n# encryption (AEAD)\nkey = AESGCM.generate_key(bit_length=256)\nnonce = os.urandom(12)                    # never reuse a nonce with the same key\nct = AESGCM(key).encrypt(nonce, b'card number', associated_data=b'user:42')\npt = AESGCM(key).decrypt(nonce, ct, b'user:42')\n\n# password hashing\nph = PasswordHasher()\nstored = ph.hash('correct horse battery staple')\nph.verify(stored, 'correct horse battery staple')",
    fu: [
      {
        q: "Why is a salt needed?",
        a: "Without it, identical passwords produce identical hashes, so one rainbow table breaks every user at once. A unique random salt per password makes precomputation useless. Modern algorithms (bcrypt, argon2id) generate and embed the salt for you.",
      },
      {
        q: "Symmetric or asymmetric — which for what?",
        a: "Symmetric for bulk data (fast); asymmetric for key exchange, signatures and identity (slow, but no shared secret needed). TLS uses both: asymmetric to agree a session key, then symmetric for the traffic.",
      },
      {
        q: "How do you manage keys?",
        a: "A KMS/HSM holds the master key; data is encrypted with per-object data keys that are themselves encrypted by the master key (envelope encryption). Rotate the master key without re-encrypting all data by re-wrapping the data keys.",
      },
    ],
  },
];
