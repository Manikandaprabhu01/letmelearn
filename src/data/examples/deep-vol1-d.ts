import type { DesignExample } from "@/data/types";

export const vol1DeepD: DesignExample[] = [
  {
    slug: "kv-store",
    title: "Design a Key-Value Store",
    source: "Volume 1",
    chapter: 6,
    difficulty: "advanced",
    minutes: 24,
    tags: ["dynamo", "quorum", "consistent-hashing", "storage"],
    companies: ["DynamoDB", "Cassandra", "Riak", "Voldemort"],
    summary:
      "This chapter is the distributed-systems syllabus in one problem: consistent hashing for placement, replication for durability, quorums for tunable consistency, vector clocks for conflicts, Merkle trees for repair, gossip for membership, and an LSM tree underneath. Nobody expects all of it in 45 minutes — they expect you to pick the parts the requirements demand and justify them.",
    clarifying: [
      {
        q: "Single-node or distributed?",
        a: "Distributed — otherwise it is a hash map with a write-ahead log. State that the interesting requirements are 'survives node loss' and 'scales past one machine'.",
      },
      {
        q: "What consistency do we need?",
        a: "Tunable per operation. Assume the default is eventual with quorum options, Dynamo-style, and note where a strongly consistent read would be needed instead.",
      },
      {
        q: "How big are values, and how big is the dataset?",
        a: "Values up to ~10 KB, dataset in the hundreds of terabytes. Large values would push toward storing them in an object store with a pointer in the KV.",
      },
      {
        q: "What access patterns beyond get and put?",
        a: "Get, put, delete by key. Range scans change the design fundamentally — they require ordered partitioning rather than hashing, so ask explicitly.",
      },
      {
        q: "Availability or consistency during a partition?",
        a: "Assume availability, which is the Dynamo choice, and be explicit that it means the application may have to resolve conflicting versions.",
      },
    ],
    requirements: {
      functional: [
        "get(key) → value, put(key, value), delete(key)",
        "Values up to ~10 KB",
        "Tunable consistency per request (N, W, R)",
        "Automatic partitioning and rebalancing as nodes join and leave",
      ],
      nonFunctional: [
        "p99 under 10 ms for both reads and writes",
        "Survives node and rack failure with no data loss",
        "Available for writes during a network partition",
        "Scales linearly by adding nodes",
      ],
    },
    math: [
      {
        label: "Dataset",
        expr: "10 B keys × 1 KB average value",
        result: "≈ 10 TB",
        note: "×3 replication ≈ 30 TB before compression and overhead.",
      },
      {
        label: "Node count",
        expr: "30 TB ÷ 2 TB usable per node",
        result: "≈ 16 nodes minimum",
        note: "Plus headroom for compaction, which needs free space to work.",
      },
      {
        label: "Throughput",
        expr: "100,000 ops/s ÷ 16 nodes",
        result: "≈ 6,000 ops/s/node",
        note: "Comfortable for an LSM engine on SSD.",
      },
      {
        label: "Quorum latency",
        expr: "W=2 of N=3 → wait for the 2nd fastest, not the slowest",
        result: "median, not tail",
        note: "This is the whole reason quorums beat 'wait for everyone'.",
      },
      {
        label: "Virtual nodes",
        expr: "16 physical × 150 vnodes",
        result: "2,400 ring positions",
        note: "Enough for load standard deviation of a few percent.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "get(key, {consistency})",
        desc: "Read from R replicas, reconcile versions, read-repair stale ones",
      },
      {
        method: "PUT",
        path: "put(key, value, {consistency, context})",
        desc: "Write to W replicas; context carries the version read",
      },
      {
        method: "DELETE",
        path: "delete(key)",
        desc: "Writes a tombstone — deletion is a write in a replicated store",
      },
      {
        method: "ADMIN",
        path: "addNode / removeNode",
        desc: "Ring membership change, triggering range transfer",
      },
    ],
    dataModel: [
      {
        entity: "ring",
        fields: ["position (hash)", "physical_node", "→ 150 vnodes per node, gossiped"],
      },
      {
        entity: "record",
        fields: ["key", "value", "version_vector", "timestamp", "tombstone (bool)"],
      },
      { entity: "memtable", fields: ["in-memory sorted map", "flushed to an SSTable when full"] },
      {
        entity: "sstable",
        fields: ["immutable sorted file", "sparse index", "bloom filter", "→ merged by compaction"],
      },
    ],
    architecture: [
      {
        heading: "Placement: consistent hashing with virtual nodes",
        body: [
          "Hash both keys and nodes onto a ring. A key belongs to the first node clockwise from its position, and its replicas are the next R distinct physical nodes. Adding a node moves roughly 1/n of the data instead of nearly all of it.",
        ],
        diagram: {
          kind: "flow",
          caption:
            "Coordinator for a key is the first vnode clockwise; replicas are the next distinct machines.",
          rows: [
            [{ id: "k", label: "hash('user:42')", sub: "ring position 0x3F1A", tone: "accent" }],
            [
              { id: "n1", label: "Node B", sub: "coordinator", tone: "ok" },
              { id: "n2", label: "Node D", sub: "replica 2", tone: "ok" },
              { id: "n3", label: "Node A", sub: "replica 3", tone: "ok" },
              {
                id: "skip",
                label: "(skip B's other vnodes)",
                sub: "must be distinct machines",
                tone: "warn",
              },
            ],
          ],
        },
        code: {
          title: "Replica selection — the distinct-node detail that matters",
          lang: "ts",
          source: `getPreferenceList(key: string, n = 3): PhysicalNode[] {
  const out: PhysicalNode[] = [];
  let i = this.lowerBound(hash32(key));

  while (out.length < n && out.length < this.distinctNodeCount()) {
    const node = this.ring[i % this.ring.length].node;
    // Skip further vnodes belonging to a machine already chosen — otherwise
    // all three "replicas" can live on one machine and one failure loses everything.
    if (!out.includes(node)) out.push(node);
    i++;
  }
  return out;
}

// Rack awareness goes here too: prefer replicas in distinct racks or
// availability zones, so a rack failure never takes all copies.`,
        },
        bullets: [
          "Virtual nodes are mandatory: with one position per node, load varies by 30-40%; with 150, it is a few percent.",
          "Membership is gossiped rather than held in a central registry, so there is no coordination service in the request path.",
          "A client with a stale ring may send a request to the wrong node; the node forwards it and the client refreshes, so staleness costs a hop rather than correctness.",
        ],
      },
      {
        heading: "Replication and quorums",
        diagram: {
          kind: "sequence",
          caption: "N=3, W=2, R=2: the read set must intersect the write set.",
          actors: [
            { id: "c", label: "Client" },
            { id: "co", label: "Coordinator" },
            { id: "r1", label: "Replica 1" },
            { id: "r2", label: "Replica 2" },
            { id: "r3", label: "Replica 3", sub: "slow" },
          ],
          messages: [
            { from: "c", to: "co", label: "put(k, v)", kind: "call" },
            { from: "co", to: "r1", label: "write v7", kind: "call" },
            { from: "co", to: "r2", label: "write v7", kind: "call" },
            {
              from: "co",
              to: "r3",
              label: "write v7",
              kind: "async",
              tone: "warn",
              note: "no ack needed — W=2 already satisfied",
            },
            { from: "r2", to: "co", label: "ack (2 of 3)", kind: "return", tone: "ok" },
            {
              from: "co",
              to: "c",
              label: "ok",
              kind: "return",
              tone: "ok",
              note: "latency = 2nd fastest replica",
            },
            { from: "c", to: "co", label: "get(k)", kind: "call" },
            { from: "co", to: "r3", label: "returns stale v6", kind: "call", tone: "warn" },
            { from: "co", to: "c", label: "v7 wins by version", kind: "return", tone: "ok" },
            { from: "co", to: "r3", label: "read repair: write v7 back", kind: "async" },
          ],
        },
        table: {
          headers: ["Setting", "Guarantee", "Latency", "Use"],
          rows: [
            [
              "N=3, W=2, R=2",
              "Overlap; survives 1 node down",
              "Median of 2",
              "The balanced default",
            ],
            [
              "N=3, W=3, R=1",
              "Fastest reads",
              "Writes wait for the slowest",
              "Read-mostly config data",
            ],
            [
              "N=3, W=1, R=1",
              "No overlap — eventual only",
              "Fastest both ways",
              "Metrics, counters, telemetry",
            ],
            [
              "N=5, W=3, R=3",
              "Survives 2 nodes down",
              "Median of 3",
              "Higher durability across three AZs",
            ],
          ],
        },
        callout: {
          kind: "warn",
          text: "W + R > N gives overlap, not linearizability. Two clients writing concurrently can each satisfy W without seeing the other, so a later read returns two versions. Detecting that is what version vectors are for; resolving it is the application's job.",
        },
      },
    ],
    deepDives: [
      {
        heading: "Conflict detection and resolution",
        body: [
          "Last-write-wins by wall clock is the tempting answer and it silently loses data whenever clocks disagree — the losing write vanishes with no error anywhere. Version vectors detect genuine concurrency instead of guessing.",
        ],
        code: {
          title: "Version vectors: detect concurrency rather than paper over it",
          lang: "ts",
          source: `type VV = Record<NodeId, number>;

function compare(a: VV, b: VV): "before" | "after" | "concurrent" | "equal" {
  let aGreater = false, bGreater = false;
  for (const node of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[node] ?? 0, y = b[node] ?? 0;
    if (x > y) aGreater = true;
    if (y > x) bGreater = true;
  }
  if (aGreater && bGreater) return "concurrent";   // a real conflict
  if (aGreater) return "after";
  if (bGreater) return "before";
  return "equal";
}

// On a quorum read returning several versions:
//   1. discard any version strictly "before" another
//   2. if one remains, return it
//   3. if several remain, they are concurrent — return siblings and let
//      the application merge. A shopping cart unions its items, which is
//      why Dynamo's canonical example is a cart: merging is well-defined.

// The client passes the context (the vector it read) back on write, so the
// store can tell "I am updating what I saw" from "I am writing blind".`,
        },
        table: {
          headers: ["Strategy", "Data loss?", "Complexity", "When"],
          rows: [
            [
              "Last-write-wins (wall clock)",
              "Yes, silently",
              "Trivial",
              "Only when overwrites are idempotent and loss is acceptable",
            ],
            [
              "Version vectors + siblings",
              "No",
              "High — the app must merge",
              "Carts, sets, anything unionable",
            ],
            [
              "CRDTs",
              "No",
              "Moderate; constrains the data type",
              "Counters, sets, collaborative text",
            ],
            [
              "Single-key linearizability via consensus",
              "No",
              "Highest latency",
              "Counters that must be exact, locks",
            ],
          ],
        },
      },
      {
        heading: "Storage engine: the LSM tree",
        steps: [
          {
            title: "Write to the commit log, then the memtable",
            text: "An append to a write-ahead log makes it durable; an insert into an in-memory sorted structure makes it readable. Writes are therefore sequential on disk — this is why LSM engines have such high write throughput.",
          },
          {
            title: "Flush to an immutable SSTable",
            text: "When the memtable is full, write it out as a sorted file with a sparse index and a Bloom filter. Immutability means no in-place updates and no random writes.",
          },
          {
            title: "Read: memtable, then SSTables newest first",
            text: "The Bloom filter on each SSTable answers 'definitely not here' without touching the disk, which is what keeps reads from degrading as files accumulate.",
            detail:
              "Without Bloom filters, a read for a missing key would touch every SSTable on disk.",
          },
          {
            title: "Compact in the background",
            text: "Merge SSTables, drop superseded versions and expired tombstones. This reclaims space and bounds read amplification — and it competes with live traffic for IO.",
          },
        ],
        diagram: {
          kind: "layers",
          caption: "Sequential writes, sorted files, Bloom filters to skip them.",
          layers: [
            {
              title: "Write path",
              items: ["commit log (append, fsync)", "memtable (sorted, in memory)"],
            },
            { title: "Flush", items: ["SSTable L0", "sparse index", "bloom filter"] },
            {
              title: "Compaction",
              items: ["L0 → L1 → L2 …", "merge, drop tombstones", "background IO"],
            },
            {
              title: "Read path",
              items: ["memtable", "bloom filter per SSTable", "sparse index → block", "row cache"],
            },
          ],
        },
        bullets: [
          "LSM trades read amplification for write throughput; B-trees do the reverse. For a write-heavy KV store the LSM is the right choice, and saying why is the point.",
          "Compaction is the operational pain: it needs free disk and IO headroom, and a node that falls behind on compaction degrades reads badly.",
          "Deletes write tombstones, which take space until compaction removes them — and they must survive long enough that a resurrected replica does not reintroduce the deleted value.",
        ],
      },
      {
        heading: "Failure handling: hinted handoff and anti-entropy",
        bullets: [
          "Hinted handoff: if a replica is down, write to another node with a hint recording where it belongs. When the owner returns, the hint is delivered. This keeps writes available through transient failures.",
          "Sloppy quorum: with hinted handoff, W can be satisfied by nodes that are not the key's home replicas — availability rises and the strict overlap guarantee is suspended until handoff completes.",
          "Read repair: a read that finds a stale replica writes the newer version back. Cheap, and it fixes exactly the keys people are reading.",
          "Anti-entropy with Merkle trees: replicas periodically compare hash trees of their key ranges and exchange only the differing subtrees, so cold data converges too. Read repair alone leaves unread keys stale forever.",
          "Failure detection is gossip-based with indirect probing, so a slow node is not immediately declared dead — and membership converges in logarithmic time.",
        ],
        code: {
          title: "Merkle tree comparison — repair without shipping everything",
          lang: "text",
          source: `Replica A range [0x00, 0x40)          Replica B same range
        root  h(ABCD)                       root  h(ABC D')   <- differs
       /            \\                      /            \\
   h(AB)            h(CD)              h(AB)            h(CD')  <- differs
   /    \\           /    \\             /    \\           /    \\
  A      B         C      D           A      B         C      D'  <- differs

Compare root: differs -> descend
Compare h(AB): equal  -> skip an entire half of the range
Compare h(CD): differs -> descend
Find D vs D': exchange only those keys.

Cost is O(log n) hash comparisons plus the differing keys, instead of
streaming the whole range — which is what makes background repair viable.`,
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Consistent hashing with vnodes",
        pickWhen: "Nodes join and leave routinely",
        cost: "Ring state must be gossiped; replica selection must skip same-machine vnodes",
      },
      {
        choice: "Quorum (W=R=2, N=3)",
        pickWhen: "The balanced default",
        cost: "Two round trips' worth of coordination; still not linearizable",
      },
      {
        choice: "Version vectors and siblings",
        pickWhen: "Concurrent writes to one key are expected and data loss is unacceptable",
        cost: "The application must implement a merge function",
      },
      {
        choice: "Last-write-wins",
        pickWhen: "Overwrites are idempotent, or the value is a full-state snapshot",
        cost: "Silent data loss under clock skew",
      },
      {
        choice: "LSM tree",
        pickWhen: "Write-heavy",
        cost: "Read amplification, and compaction competing with live traffic",
      },
      {
        choice: "Sloppy quorum + hinted handoff",
        pickWhen: "Write availability is the priority",
        cost: "Reads may miss recent writes until handoff completes",
      },
    ],
    wrapUp: [
      "Placement is consistent hashing with virtual nodes and rack awareness; replication is N copies on the next distinct machines clockwise.",
      "Consistency is tunable per request through W and R, and the honest caveat is that quorum overlap detects conflicts rather than preventing them.",
      "Conflicts need version vectors and an application merge, unless you accept the silent data loss of last-write-wins.",
      "The storage engine is an LSM tree: sequential writes, immutable sorted files, Bloom filters on reads, and compaction as the ongoing operational cost.",
      "With another hour: secondary indexes, cross-region replication, and the backpressure story when compaction falls behind.",
    ],
    followUps: [
      {
        q: "How do you handle a node joining the cluster?",
        a: "It claims virtual node positions on the ring, gossips its membership, and streams the key ranges it now owns from the previous owners. Because it takes only the arcs between its positions and their predecessors, roughly 1/n of the data moves rather than nearly all of it. During the transfer, reads can still be served by the old owners, and the new node starts serving a range once it has caught up.",
      },
      {
        q: "Two clients write to the same key at the same time. What happens?",
        a: "Both can satisfy their write quorum without seeing each other, so the store ends up holding two versions whose version vectors are concurrent. A later read returns both as siblings and the application merges them — for a shopping cart that is a union, which is why that is the canonical example. If I used last-write-wins instead, one write would silently disappear, and under clock skew it might be the newer one.",
      },
      {
        q: "How does a stale replica catch up?",
        a: "Two mechanisms with different coverage. Read repair fixes keys as they are read, which handles the hot set for free. Anti-entropy with Merkle trees handles the rest: replicas compare hash trees of a range, descend only where the hashes differ, and exchange just those keys. Without the second mechanism, data that nobody reads stays divergent indefinitely.",
      },
      {
        q: "Why an LSM tree and not a B-tree?",
        a: "Because the workload is write-heavy and an LSM turns random writes into sequential ones — append to a log, sort in memory, flush an immutable file. A B-tree updates pages in place, which means random IO per write and page splits. The cost is read amplification, since a read may consult several SSTables, and that is what the per-file Bloom filters and the block cache are there to bound.",
      },
      {
        q: "How would you support range scans?",
        a: "Not with this design — hash partitioning destroys key ordering, so a range query becomes a scatter-gather over every node. If range scans matter I would use ordered partitioning instead, as HBase and Bigtable do, and accept the hotspot risk that comes with sequential keys. That is a genuine fork in the design, which is why it is worth asking about in the first five minutes.",
      },
    ],
    related: ["/hld/consistent-hashing", "/hld/quorum", "/hld/replication", "/playgrounds/quorum"],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
    playground: "quorum",
  },

  {
    slug: "web-crawler",
    title: "Design a Web Crawler",
    source: "Volume 1",
    chapter: 9,
    difficulty: "advanced",
    minutes: 21,
    tags: ["bfs", "politeness", "dedup", "distributed"],
    companies: ["Google", "Bing", "Common Crawl", "Internet Archive"],
    summary:
      "A crawler is a distributed BFS over a hostile, unbounded graph. The algorithm is trivial; everything hard is about behaving well — not hammering one host, not crawling the same content twice under different URLs, not falling into an infinite space of generated pages, and not losing a week of work when a worker dies.",
    clarifying: [
      {
        q: "What is the crawl for — search indexing, archiving, or a targeted dataset?",
        a: "Assume search indexing. That means freshness matters, coverage matters, and the output feeds an indexing pipeline rather than being the product itself.",
      },
      {
        q: "Scale and time budget?",
        a: "One billion pages a month, which is roughly 400 pages per second sustained. That number is what forces distribution and careful politeness scheduling.",
      },
      {
        q: "Just HTML, or media too?",
        a: "HTML for link extraction, with media URLs recorded but fetched by a separate pipeline. Mixing them makes the fetcher's resource profile unpredictable.",
      },
      {
        q: "How fresh must content be?",
        a: "Adaptive: news sites recrawled hourly, static pages monthly. A uniform recrawl interval either wastes most of your capacity or misses everything that changes.",
      },
      {
        q: "Do we respect robots.txt?",
        a: "Yes, unconditionally, plus crawl-delay and per-host rate limits. This is not a nice-to-have — ignoring it gets you blocked and can be a legal problem.",
      },
    ],
    requirements: {
      functional: [
        "Fetch pages starting from a seed set and follow links",
        "Extract and normalise URLs; enqueue unseen ones",
        "Respect robots.txt, crawl-delay and per-host limits",
        "Detect duplicate content, not just duplicate URLs",
        "Recrawl pages on a schedule based on observed change rate",
      ],
      nonFunctional: [
        "Sustain ~400 pages/second across the fleet",
        "Never overwhelm a single host regardless of how many URLs it has",
        "Survive worker failure without losing or re-crawling large amounts of work",
        "Bounded memory and storage for the seen-URL set",
      ],
    },
    math: [
      {
        label: "Crawl rate",
        expr: "1 B pages/month ÷ (30 × 86,400)",
        result: "≈ 400 pages/s",
        note: "Peak higher; a fetch takes ~500 ms, so ~200 concurrent fetches minimum, realistically thousands.",
      },
      {
        label: "Bandwidth",
        expr: "400/s × 500 KB average page",
        result: "≈ 200 MB/s",
        note: "1.6 Gbps sustained inbound. Bandwidth, not CPU, is often the constraint.",
      },
      {
        label: "Raw storage",
        expr: "1 B × 500 KB",
        result: "≈ 500 TB/month",
        note: "Compressed to roughly 100 TB. Store raw HTML in object storage, not in a database.",
      },
      {
        label: "Seen-URL set",
        expr: "10 B URLs × 10 bits (Bloom filter)",
        result: "≈ 12 GB",
        note: "Storing the URLs themselves would be ~700 GB plus index — this is why a Bloom filter is standard here.",
      },
      {
        label: "Politeness ceiling",
        expr: "1 request/s/host × 10 M hosts",
        result: "10 M pages/s theoretical",
        note: "The constraint is not total rate but distribution across hosts — a queue per host is what makes it work.",
      },
    ],
    apis: [
      {
        method: "INTERNAL",
        path: "frontier.next() → URL",
        desc: "Returns a URL whose host is due, or blocks",
      },
      {
        method: "INTERNAL",
        path: "frontier.add(url, priority)",
        desc: "Enqueue after dedupe and robots check",
      },
      {
        method: "INTERNAL",
        path: "fetcher.get(url) → Response",
        desc: "With timeouts, size caps and redirect limits",
      },
      {
        method: "INTERNAL",
        path: "parser.extract(html) → {links, text, canonical}",
        desc: "Link extraction and content fingerprinting",
      },
      { method: "ADMIN", path: "POST /v1/seeds", desc: "Inject seed URLs and priority overrides" },
    ],
    dataModel: [
      {
        entity: "frontier",
        fields: [
          "host_queue_id",
          "url",
          "priority",
          "scheduled_at",
          "→ queue per host, sorted by priority",
        ],
      },
      {
        entity: "seen_urls",
        fields: ["Bloom filter (memory)", "+ exact set in a KV store for confirmation"],
      },
      {
        entity: "content_hashes",
        fields: ["simhash (64-bit)", "url", "first_seen", "→ near-duplicate detection"],
      },
      {
        entity: "robots_cache",
        fields: ["host (pk)", "rules", "crawl_delay", "fetched_at", "ttl ≈ 24 h"],
      },
      {
        entity: "pages",
        fields: ["url_hash (pk)", "object_key", "http_status", "fetched_at", "etag", "change_rate"],
      },
    ],
    architecture: [
      {
        heading: "The loop, and the frontier that makes it polite",
        diagram: {
          kind: "system",
          caption: "The URL frontier is the heart: it decides what to fetch and, crucially, when.",
          columns: [
            {
              title: "Frontier",
              nodes: [
                {
                  id: "pri",
                  label: "Priority queues",
                  sub: "importance, freshness",
                  tone: "accent",
                },
                {
                  id: "host",
                  label: "Per-host queues",
                  sub: "politeness: one worker per host",
                  tone: "accent",
                },
              ],
            },
            {
              title: "Fetch",
              nodes: [
                { id: "dns", label: "DNS cache", sub: "resolution is a bottleneck" },
                { id: "rob", label: "robots.txt cache", sub: "24 h TTL" },
                { id: "f", label: "Fetchers ×N", sub: "async, timeouts, size caps", tone: "ok" },
              ],
            },
            {
              title: "Process",
              nodes: [
                { id: "p", label: "Parser", sub: "links, text, canonical" },
                { id: "d", label: "Dedupe", sub: "URL bloom + simhash", tone: "warn" },
              ],
            },
            {
              title: "Store",
              nodes: [
                { id: "s3", label: "Object storage", sub: "raw HTML, compressed" },
                { id: "kv", label: "Metadata store", sub: "status, etag, change rate" },
                { id: "idx", label: "→ indexing pipeline", sub: "downstream consumer" },
              ],
            },
          ],
        },
        code: {
          title: "Frontier: two levels of queue, priority and politeness",
          lang: "ts",
          source: `// Front queues rank by importance; back queues enforce one-at-a-time per host.
class Frontier {
  private front: PriorityQueue<Url>[] = range(5).map(() => new PriorityQueue());
  private back = new Map<Host, Queue<Url>>();       // exactly one queue per host
  private due = new MinHeap<{ host: Host; at: number }>();  // when each host is next allowed

  add(url: Url, priority: number) {
    this.front[priority].push(url);
  }

  // A worker calls this; it only ever returns a URL whose host is due.
  next(now: number): Url | null {
    const head = this.due.peek();
    if (!head || head.at > now) return null;         // nothing is due yet

    this.due.pop();
    const q = this.back.get(head.host)!;
    const url = q.pop();

    if (url) {
      const delay = robots.crawlDelay(head.host) ?? DEFAULT_DELAY_MS;
      this.due.push({ host: head.host, at: now + delay });   // re-arm politeness
    }
    return url;
  }

  // Refill back queues from the front queues, preserving priority order.
  private refill() { /* pull from the highest non-empty front queue */ }
}

// The invariant: at most one in-flight request per host, spaced by crawl-delay.
// Without it, a site with a million URLs receives a million near-simultaneous
// requests and you are banned within seconds.`,
        },
        bullets: [
          "One queue per host with a next-allowed timestamp is the standard structure, and it is what makes politeness an invariant rather than a hope.",
          "Priority is separate from politeness: importance decides what to crawl, politeness decides when. Fusing them produces either rudeness or starvation.",
          "The frontier must be durable and distributed — it holds billions of URLs. In practice it is backed by a partitioned store with hosts hashed to partitions, so one worker owns a host's queue.",
          "Partition by host, not by URL. That way politeness is enforced locally and requires no cross-worker coordination.",
        ],
      },
      {
        heading: "Deduplication: URLs and content are different problems",
        table: {
          headers: ["Duplicate type", "Example", "Detection"],
          rows: [
            [
              "Exact URL",
              "The same link found on a thousand pages",
              "Bloom filter over normalised URLs, backed by an exact set",
            ],
            [
              "URL variants",
              "?utm_source=, trailing slash, http vs https, session ids",
              "Aggressive normalisation before hashing",
            ],
            [
              "Canonical duplicates",
              "Print view, mobile subdomain, pagination variants",
              "Respect rel=canonical and Link headers",
            ],
            [
              "Exact content, different URL",
              "Mirrors, syndicated articles",
              "Hash the normalised body (MD5/SHA of extracted text)",
            ],
            [
              "Near-duplicate content",
              "Same article with a different sidebar or timestamp",
              "SimHash or MinHash with a Hamming-distance threshold",
            ],
          ],
        },
        code: {
          title: "URL normalisation, then a Bloom filter",
          lang: "ts",
          source: `function normalise(raw: string): string {
  const u = new URL(raw);
  u.hash = "";                                     // fragments are client-side
  u.protocol = "https:";                           // treat http/https as one
  u.hostname = u.hostname.toLowerCase().replace(/^www\\./, "");
  u.pathname = u.pathname.replace(/\\/+$/, "") || "/";

  // Strip tracking parameters that never change the content
  const drop = ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "ref"];
  for (const p of drop) u.searchParams.delete(p);
  u.searchParams.sort();                            // parameter order is not meaningful

  return u.toString();
}

const seen = new BloomFilter({ expectedItems: 10_000_000_000, falsePositiveRate: 0.001 });

function shouldCrawl(raw: string): boolean {
  const url = normalise(raw);
  if (!seen.mightContain(url)) { seen.add(url); return true; }   // definitely new
  return false;   // "probably seen" — accept the 0.1% we wrongly skip
}

// The false-positive direction is safe here: we skip a page we have not
// crawled. At 0.1% over a billion pages that is a million pages missed —
// acceptable for coverage, and tunable by spending more bits.`,
        },
        callout: {
          kind: "insight",
          text: "Note the deliberate acceptance of Bloom filter false positives: skipping a page you have not seen is a coverage loss, not a correctness bug. Being explicit about which direction of error you can tolerate is exactly the reasoning the structure demands.",
        },
      },
    ],
    deepDives: [
      {
        heading: "Traps: the reason crawlers need defences",
        table: {
          headers: ["Trap", "What happens", "Defence"],
          rows: [
            [
              "Infinite calendar",
              "/events?date=2026-09-11 → next month, forever",
              "Depth limit per host, URL pattern detection, budget per host",
            ],
            [
              "Spider trap / soft 404",
              "Every URL returns 200 with generated content",
              "Content dedupe by simhash; drop hosts with high duplicate rates",
            ],
            ["Redirect loop", "A → B → A", "Cap redirects at ~5 and record the chain"],
            [
              "Huge response",
              "A 10 GB file streamed to your fetcher",
              "Size cap; abort the stream past a few megabytes",
            ],
            [
              "Slow-loris server",
              "Bytes trickle in, holding a worker open",
              "Total request timeout, not just a connect timeout",
            ],
            [
              "Session ids in URLs",
              "Every crawl produces new unique URLs",
              "Normalisation rules that strip known session parameters",
            ],
            [
              "Crawler-hostile host",
              "Serves different content to your user agent",
              "Nothing technical — record and deprioritise",
            ],
          ],
        },
        bullets: [
          "Per-host budgets are the single most effective defence: cap pages per host per crawl cycle, so an infinite space costs you a bounded amount rather than everything.",
          "Depth limits catch the pathological cases that budgets miss, particularly generated hierarchies.",
          "Track per-host duplicate rate and useful-content rate as metrics; hosts that produce nothing useful should be deprioritised automatically rather than by hand.",
        ],
      },
      {
        heading: "Freshness: recrawl what changes",
        body: [
          "Recrawling everything at the same interval wastes most of the budget on pages that never change and still misses the ones that change hourly. Track observed change rate per page and schedule adaptively.",
        ],
        bullets: [
          "Use conditional requests: If-Modified-Since and If-None-Match. A 304 costs almost nothing and tells you the page is unchanged, which feeds the change-rate estimate.",
          "Estimate change rate from history — a page that changed on 3 of the last 10 crawls gets a shorter interval; one unchanged for a year gets a very long one.",
          "Weight by importance as well as change rate: a rarely-changing but heavily-linked page still deserves a reasonable interval.",
          "Use sitemaps and change-notification protocols where hosts publish them; they turn polling into something closer to push.",
          "Cap total recrawl budget as a fraction of capacity — typically a large share, since maintaining an index is mostly recrawling.",
        ],
        math: [
          {
            label: "Recrawl share",
            expr: "1 B pages known, 30-day average interval",
            result: "≈ 380 pages/s just to maintain",
            note: "Nearly the entire budget. Adaptive scheduling is what frees capacity for discovery.",
          },
          {
            label: "Conditional request saving",
            expr: "70% of recrawls return 304 at ~1 KB instead of 500 KB",
            result: "~65% bandwidth saved",
          },
        ],
      },
      {
        heading: "Distribution and failure",
        bullets: [
          "Partition the frontier by host hash, so each worker owns a set of hosts entirely and politeness needs no coordination.",
          "Workers are stateless with respect to the crawl: the frontier and the seen-set are external, so a dead worker loses only its in-flight fetches.",
          "In-flight URLs need a visibility timeout, like a queue message: if a worker dies, the URL becomes available again after the timeout rather than being lost.",
          "DNS is a genuine bottleneck at this rate — run a local caching resolver, and expect DNS failures to be a meaningful share of fetch errors.",
          "Store raw HTML in object storage keyed by URL hash and keep only metadata in the database. Putting half a petabyte of HTML in a relational store is a common early mistake.",
          "Rebalancing when workers join or leave should move whole host queues, so politeness state travels with the host.",
        ],
        diagram: {
          kind: "sequence",
          caption: "One page, end to end, including the checks people forget.",
          actors: [
            { id: "w", label: "Worker" },
            { id: "fr", label: "Frontier" },
            { id: "rb", label: "robots cache" },
            { id: "web", label: "Target host" },
            { id: "st", label: "Storage" },
          ],
          messages: [
            { from: "w", to: "fr", label: "next() — a host that is due", kind: "call" },
            { from: "fr", to: "w", label: "https://example.com/page", kind: "return" },
            {
              from: "w",
              to: "rb",
              label: "allowed? crawl-delay?",
              kind: "call",
              note: "cached 24 h; fetch robots.txt on miss",
            },
            {
              from: "w",
              to: "web",
              label: "GET + If-None-Match",
              kind: "call",
              note: "timeout, size cap, redirect cap",
            },
            { from: "web", to: "w", label: "200 + body (or 304)", kind: "return" },
            { from: "w", to: "st", label: "store raw HTML by url_hash", kind: "async" },
            { from: "w", to: "w", label: "parse → links, simhash", kind: "self" },
            {
              from: "w",
              to: "fr",
              label: "add(new links) after normalise + bloom",
              kind: "call",
              tone: "ok",
            },
            { from: "w", to: "fr", label: "reschedule this URL by change rate", kind: "call" },
          ],
        },
      },
    ],
    tradeoffs: [
      {
        choice: "BFS from seeds",
        pickWhen: "Broad coverage; important pages are near the seeds",
        cost: "Needs politeness enforcement, because BFS naturally concentrates on one host at a time",
      },
      {
        choice: "Priority queue by importance",
        pickWhen: "Limited budget, want the valuable pages first",
        cost: "Importance is an estimate; a feedback loop can entrench it",
      },
      {
        choice: "Bloom filter for the seen set",
        pickWhen: "Billions of URLs",
        cost: "A small fraction of pages silently skipped; cannot delete entries",
      },
      {
        choice: "SimHash for near-duplicates",
        pickWhen: "Syndicated and templated content is common",
        cost: "Threshold tuning; false positives drop legitimate pages",
      },
      {
        choice: "Adaptive recrawl",
        pickWhen: "Maintaining an index rather than a one-off crawl",
        cost: "Per-page change-rate state, and a scheduler to maintain",
      },
    ],
    wrapUp: [
      "The algorithm is BFS; the design is the frontier — priority queues for what to fetch and per-host queues for when, which makes politeness an invariant.",
      "Dedupe is two separate problems: URL normalisation plus a Bloom filter, and content fingerprinting with simhash for near-duplicates.",
      "Traps are not edge cases at this scale — per-host budgets, depth limits, size caps and timeouts are core requirements.",
      "Most of the capacity goes to recrawling, so adaptive scheduling driven by observed change rate is what buys room for discovery.",
      "With another hour: the importance scoring model, JavaScript rendering for client-side sites, and the handoff into the indexing pipeline.",
    ],
    followUps: [
      {
        q: "How do you avoid hammering a single site?",
        a: "One queue per host with a next-allowed timestamp, and at most one in-flight request per host at a time, spaced by robots.txt crawl-delay or a default. Because the frontier is partitioned by host hash, one worker owns a host entirely and no coordination is needed. Without that structure, a BFS over a site with a million pages sends a million near-simultaneous requests and gets you blocked immediately.",
      },
      {
        q: "How do you know you have seen a URL before?",
        a: "Normalise it first — strip fragments and tracking parameters, lowercase the host, sort query parameters — because most 'new' URLs are variants of ones already crawled. Then a Bloom filter over the normalised form, which costs about 12 GB for ten billion URLs instead of hundreds of gigabytes for an exact set. The false positives mean we occasionally skip a genuinely new page, which is a coverage loss rather than a correctness bug.",
      },
      {
        q: "The same article appears on fifty sites. How do you detect that?",
        a: "URL dedupe cannot help, so I fingerprint the extracted text. An exact hash catches perfect mirrors; simhash with a Hamming-distance threshold catches near-duplicates where the boilerplate differs. Then I keep the canonical version — preferring the original publisher where rel=canonical or first-seen timestamps indicate one — and record the rest as duplicates rather than storing them all.",
      },
      {
        q: "A worker dies mid-crawl. What is lost?",
        a: "Only its in-flight fetches. The frontier and the seen-set are external, so URLs handed to a worker carry a visibility timeout and become available again if they are not completed — the same mechanism a queue uses. When the worker is replaced, its host queues are reassigned along with their politeness state, so the new owner does not reset the crawl-delay clock and accidentally burst a host.",
      },
      {
        q: "How do you decide what to crawl next when everything cannot be crawled?",
        a: "Priority, from a combination of estimated importance — inbound links, host reputation, depth from a seed — and freshness need. Then per-host budgets so no single site can consume the crawl. The important structural point is that priority decides what and politeness decides when; keeping them separate is what stops a high-priority host from being crawled rudely.",
      },
    ],
    related: [
      "/hld/bloom-filters",
      "/hld/message-queues",
      "/examples/google-search",
      "/hld/consistent-hashing",
    ],
    furtherReading: [
      {
        label: "awesome-system-design-resources",
        href: "https://github.com/ashishps1/awesome-system-design-resources",
      },
    ],
  },
];
