import type { DesignExample } from "@/data/types";

export const vol1DeepE: DesignExample[] = [
  {
    slug: "consistent-hashing",
    title: "Design Consistent Hashing",
    source: "Volume 1",
    chapter: 5,
    difficulty: "intermediate",
    minutes: 20,
    tags: ["hash ring", "sharding", "vnodes", "rebalancing"],
    companies: ["Amazon Dynamo", "Cassandra", "Riak", "Discord", "Akamai"],
    summary:
      "Not a product — a partitioning primitive that the key-value store, the distributed cache and the CDN chapters all stand on. The whole idea is one sentence: hash servers and keys onto the same circle and let a key belong to the first server clockwise. Everything interesting is in what that sentence does not say — how to stop one unlucky host owning a third of the ring, what actually moves when a node joins, and how every replica agrees on the ring in the first place.",
    clarifying: [
      {
        q: "Is this partitioning a cache or a durable store?",
        a: "It changes the answer completely. For a cache, a remapped key is a miss and self-heals; you can change the ring carelessly. For a durable store, a remapped key is data that must physically move before the new owner can serve it, so joins become a streaming operation with a handoff window.",
      },
      {
        q: "How many nodes, and are they the same size?",
        a: "Assume 100–1,000 nodes, heterogeneous. Heterogeneity is the reason weights exist: a host with twice the RAM should own twice the ring, which is expressed as twice the virtual nodes rather than a special case in the lookup.",
      },
      {
        q: "What replication factor?",
        a: "N = 3. This matters because the replica set is derived from the ring — the next N−1 distinct physical nodes clockwise — so the ring is not just a router, it defines durability.",
      },
      {
        q: "Who is allowed to change the ring, and how do nodes learn about it?",
        a: "That is the real distributed-systems question here. Either a coordinator owns the topology (ZooKeeper/etcd, simple, one more dependency) or nodes gossip membership (Dynamo/Cassandra, no single point, but you must handle disagreement). I would name both and pick gossip only if a coordinator is genuinely unavailable.",
      },
      {
        q: "Do clients route directly, or is there a proxy?",
        a: "Client-side routing removes a network hop and is why Memcached and Cassandra clients embed the ring, but it means every client caches topology and can be stale. A proxy centralises the ring at the cost of a hop. I will design for client-side with a ring version so staleness is detectable.",
      },
    ],
    requirements: {
      functional: [
        "Map any key to an owning node, deterministically, from any client",
        "Add or remove a node while moving only that node's share of keys",
        "Derive an ordered replica set (preference list) of N distinct physical nodes for a key",
        "Weight nodes so larger hosts take proportionally more load",
      ],
      nonFunctional: [
        "Lookup in O(log V) with no network call — the ring is local state",
        "Adding one node to a cluster of N remaps roughly 1/N of keys, not all of them",
        "Load spread within a few percent of even, with no manual rebalancing",
        "Every node converges on the same ring within seconds of a membership change",
      ],
    },
    math: [
      {
        label: "Remap fraction, modulo hashing",
        expr: "hash(k) mod N → hash(k) mod (N+1)",
        result: "≈ N/(N+1) of keys move",
        note: "Going from 10 to 11 nodes moves ~91% of keys. For a cache that is a near-total cold start; for a database it is a full data reshuffle.",
      },
      {
        label: "Remap fraction, ring",
        expr: "one node's arc ÷ whole ring",
        result: "≈ 1/(N+1) ≈ 9%",
        note: "Only the arcs the joining node claims move, and they come from its ring successors. Every other pair of nodes is untouched.",
      },
      {
        label: "Load imbalance vs virtual nodes",
        expr: "σ/μ ≈ 1/√V per node",
        result: "V=1 → ~100%, V=100 → ~10%, V=200 → ~7%",
        note: "This is why one point per server is unusable: with 1 vnode the unluckiest host routinely owns 3–5× the mean. 100–256 vnodes per host is the standard operating point.",
      },
      {
        label: "Ring memory",
        expr: "500 nodes × 200 vnodes × (8 B hash + 8 B ref)",
        result: "≈ 1.6 MB",
        note: "Trivially replicated to every client and node. The ring is small — that is what makes client-side routing viable.",
      },
      {
        label: "Bootstrap time for a join",
        expr: "(20 TB ÷ 500 nodes) ÷ 1 Gbps effective",
        result: "≈ 40 GB ≈ 6 min",
        note: "The joining node is not authoritative until this finishes. This window is exactly why durable stores need hinted handoff rather than an instant cutover.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/ring",
        desc: "Current topology — {version, members:[{id, tokens[], weight, state}]}; clients poll or watch",
      },
      {
        method: "POST",
        path: "/v1/members",
        desc: "Register a node as joining; returns its assigned tokens",
      },
      {
        method: "PUT",
        path: "/v1/members/{id}/state",
        desc: "joining → streaming → normal → leaving; state drives read/write routing",
      },
      {
        method: "POST",
        path: "/v1/members/{id}/heartbeat",
        desc: "Liveness; missed heartbeats mark suspect, not dead — eviction is deliberate",
      },
      {
        method: "DELETE",
        path: "/v1/members/{id}",
        desc: "Decommission — drains its arcs to successors before removal",
      },
    ],
    dataModel: [
      {
        entity: "ring_members",
        fields: [
          "node_id (pk)",
          "host, rack, zone (used to spread replicas)",
          "weight (int → vnode count)",
          "state (joining|streaming|normal|leaving|down)",
          "ring_version (idx)",
        ],
      },
      {
        entity: "tokens",
        fields: [
          "token (pk, 64-bit position on the ring)",
          "node_id (fk, idx)",
          "→ one row per virtual node; ~200 per host",
        ],
      },
      {
        entity: "handoff_hints",
        fields: [
          "target_node_id (idx)",
          "key",
          "value_blob",
          "written_at",
          "→ writes accepted on behalf of a node that was down",
        ],
      },
    ],
    architecture: [
      {
        heading: "Why modulo hashing is the wrong starting point",
        lede: "Naming the failure precisely is what earns the ring.",
        diagram: {
          kind: "compare",
          caption:
            "The difference is not performance — it is what happens on the day you add a node.",
          options: [
            {
              title: "hash(key) mod N",
              sub: "the obvious approach",
              good: [
                "One line of code, perfectly even distribution",
                "O(1) lookup with no data structure at all",
              ],
              bad: [
                "Changing N remaps ~N/(N+1) of all keys — essentially everything",
                "A single node failure forces the same total reshuffle",
                "Cannot express heterogeneous host sizes",
              ],
              verdict: "Only when N is genuinely fixed forever, which in practice it never is.",
            },
            {
              title: "Consistent hashing ring",
              sub: "hash both keys and nodes onto a circle",
              tone: "ok",
              good: [
                "A join or leave moves only that node's arcs — ~1/N of keys",
                "Weights fall out naturally as virtual-node counts",
                "The replica set is derivable from the same structure",
              ],
              bad: [
                "Needs virtual nodes to be evenly balanced at all",
                "Every participant must agree on the ring, which is a membership problem",
              ],
              verdict: "The default answer, and the one Dynamo, Cassandra and Riak all landed on.",
            },
            {
              title: "Rendezvous (HRW) hashing",
              sub: "score every node, take the max",
              good: [
                "Perfectly even without virtual nodes",
                "Minimal disruption, and trivially supports weights",
              ],
              bad: [
                "O(N) per lookup rather than O(log V)",
                "No natural ring ordering, so replica sets need extra care",
              ],
              verdict: "Excellent for small N (tens of nodes) — several CDNs use it.",
            },
          ],
        },
        callout: {
          kind: "interview",
          title: "The sentence that scores the point",
          text: '"Modulo hashing is not slow, it is brittle: the cost is not in the lookup, it is that changing the node count invalidates almost every key at once. Consistent hashing trades a slightly more complex lookup for the property that a membership change is proportional to the change, not to the cluster." Say that, then draw the circle.',
        },
      },
      {
        heading: "The ring, precisely",
        lede: "A sorted array and a binary search — the picture is more exotic than the code.",
        diagram: {
          kind: "flow",
          caption: "Lookup is three steps and touches no network.",
          rows: [
            [
              { id: "k", label: "key", sub: '"user:42"' },
              { id: "h", label: "hash → 64-bit", sub: "MurmurHash3 / xxHash", tone: "accent" },
            ],
            [
              { id: "b", label: "binary search", sub: "first token ≥ h, wrapping" },
              { id: "v", label: "virtual node", sub: "token → node_id" },
              { id: "n", label: "physical node", sub: "owner", tone: "ok" },
            ],
          ],
        },
        code: {
          title: "The whole data structure",
          lang: "ts",
          source: `class HashRing {
  // Sorted token positions, and the node that owns each. Parallel arrays keep
  // the binary search cache-friendly; a Map<token, node> would be slower here.
  private tokens: number[] = [];
  private owners: string[] = [];

  constructor(private vnodesPerUnitWeight = 200) {}

  addNode(nodeId: string, weight = 1) {
    const count = this.vnodesPerUnitWeight * weight;
    for (let i = 0; i < count; i++) {
      // Hash of "node#i" — deterministic, so every client builds the same ring
      // from the same membership list without exchanging the ring itself.
      this.insert(hash64(nodeId + "#" + i), nodeId);
    }
  }

  /** Owner of a key: first token clockwise, wrapping at the top of the ring. */
  locate(key: string): string {
    if (this.tokens.length === 0) throw new Error("empty ring");
    const h = hash64(key);
    let lo = 0, hi = this.tokens.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.tokens[mid] < h) lo = mid + 1; else hi = mid;
    }
    // lo === tokens.length means we ran off the end — wrap to the first token.
    return this.owners[lo % this.tokens.length];
  }

  /** Preference list: the next N DISTINCT physical nodes, skipping repeats. */
  replicas(key: string, n: number): string[] {
    const start = this.indexOf(hash64(key));
    const out: string[] = [];
    for (let i = 0; out.length < n && i < this.tokens.length; i++) {
      const node = this.owners[(start + i) % this.tokens.length];
      // Without this check, 200 vnodes per host means all 3 "replicas" can
      // land on the SAME machine — the bug that silently destroys durability.
      if (!out.includes(node)) out.push(node);
    }
    return out;
  }
}`,
        },
        bullets: [
          "The hash must be fast and well-distributed, not cryptographic. MurmurHash3 or xxHash; MD5 works and is what the original papers used, but you are paying for collision resistance you do not need.",
          'Build the ring deterministically from the member list. Then nodes only have to agree on "who is in the cluster", not on the ring itself — a much smaller thing to replicate.',
          "The distinct-physical-node check in the replica walk is the single most important line. Skipping it is the classic bug: three replicas that are all the same box.",
          "Real deployments extend that check to racks and availability zones, so a rack loss cannot take all N replicas.",
        ],
      },
      {
        heading: "Virtual nodes and why 200 is the number",
        lede: "One point per server is not a simplification, it is broken.",
        math: [
          {
            label: "Spread with 1 vnode/host",
            expr: "arcs are exponentially distributed",
            result: "worst host ≈ 3–5× mean",
            note: "A 10-node cluster routinely has one node owning 30% of the key space and another owning 2%.",
          },
          {
            label: "Spread with 200 vnodes/host",
            expr: "σ/μ ≈ 1/√200",
            result: "≈ 7%",
            note: "Good enough that no operator ever thinks about it — which is the actual goal.",
          },
          {
            label: "Cost of 200 vnodes",
            expr: "200 × 16 B × 500 hosts",
            result: "≈ 1.6 MB of ring",
            note: "And log₂(100,000) ≈ 17 comparisons per lookup. Both free.",
          },
        ],
        table: {
          caption: "Virtual nodes are the knob; these are the consequences of turning it.",
          headers: ["vnodes per host", "Load spread", "Ring size", "Keys moved when one host dies"],
          rows: [
            ["1", "Terrible (3–5× skew)", "Tiny", "All to ONE successor — it then falls over too"],
            ["32", "±18%", "Small", "Spread over ~32 nodes"],
            ["200", "±7%", "1.6 MB @ 500 hosts", "Spread over the whole cluster — the point"],
            [
              "4096",
              "±1.5%",
              "33 MB, slower gossip",
              "Rarely worth it; Cassandra moved to 16 with better placement",
            ],
          ],
        },
        callout: {
          kind: "insight",
          text: "The under-appreciated benefit of virtual nodes is not balance, it is failure behaviour. With one vnode per host, a dead node dumps its entire load onto its single successor, which then dies — a cascading failure. With 200, the dead node's work is absorbed in ~0.5% slices by every other host, and nobody notices.",
        },
      },
    ],
    deepDives: [
      {
        heading: "What actually moves on a join",
        lede: "For a cache, nothing. For a database, this is the whole operation.",
        diagram: {
          kind: "sequence",
          caption: "Joining a durable cluster: the new node serves nothing until it has the data.",
          actors: [
            { id: "new", label: "Joining node", sub: "state=joining" },
            { id: "succ", label: "Successors", sub: "current owners" },
            { id: "ring", label: "Membership", sub: "gossip / etcd" },
            { id: "cli", label: "Clients" },
          ],
          messages: [
            { from: "new", to: "ring", label: "1. announce tokens, state=joining", kind: "call" },
            {
              from: "ring",
              to: "cli",
              label: "2. ring v+1: still route reads to successors",
              kind: "async",
            },
            { from: "new", to: "succ", label: "3. stream the arcs I will own", kind: "call" },
            { from: "succ", to: "new", label: "4. bulk transfer (minutes)", kind: "return" },
            {
              from: "succ",
              to: "new",
              label: "5. forward concurrent writes for those arcs",
              kind: "async",
              tone: "warn",
            },
            { from: "new", to: "ring", label: "6. state=normal", kind: "call" },
            {
              from: "ring",
              to: "cli",
              label: "7. ring v+2: route to the new owner",
              kind: "async",
              tone: "ok",
            },
            { from: "succ", to: "succ", label: "8. drop the handed-off arcs", kind: "self" },
          ],
        },
        bullets: [
          "Step 5 is the part people forget. Between the start of streaming and the cutover, writes are still landing on the old owner; without forwarding, every one of them is lost at cutover.",
          "The cutover is a ring-version bump, not a data operation — which is why the ring must be versioned and why clients must be able to notice they are behind.",
          "For caches, all of this collapses: mark the node normal immediately and accept a miss storm. Sizing the miss storm is the real question — a cold 1/N slice against your database at once.",
          "Decommission is the same dance reversed: state=leaving, stream to successors, then remove. Yanking a node instead is a failure event, not a decommission.",
        ],
        callout: {
          kind: "warn",
          title: "The miss storm",
          text: "Adding a cache node moves 1/N of keys, and every one of them is a miss until it is refilled. At 100k reads/s with N=10, that is 10k requests/s hitting the database that were not there a second ago. Add nodes one at a time, warm them if you can, and make sure single-flight is on so 10k misses do not become 10k database queries for the same key.",
        },
      },
      {
        heading: "Replication, preference lists and hinted handoff",
        body: [
          "The ring gives an ordered walk, so the replica set for a key is simply the next N distinct physical nodes clockwise — Dynamo calls this the preference list. Because it is derived rather than stored, every client can compute where a key's replicas are without asking anyone, and failure handling becomes 'walk further clockwise' instead of 'consult a placement table'.",
        ],
        code: {
          title: "Sloppy quorum: keep writing when a replica is down",
          lang: "ts",
          source: `// Strict quorum: if one of the 3 preferred nodes is down, W=2 may still
// succeed — but if two are down the write fails. Sloppy quorum instead walks
// further around the ring and leaves a hint for the rightful owner.
async function write(key: string, value: Blob, { n = 3, w = 2 }) {
  const preferred = ring.replicas(key, n);
  const live = preferred.filter(isUp);
  const substitutes = ring.walkClockwise(key, { skip: preferred, take: n - live.length });

  const targets = [...live, ...substitutes];
  const acks = await Promise.allSettled(
    targets.map((node) =>
      substitutes.includes(node)
        // The substitute stores it as a HINT, not as its own data, and hands
        // it back when the real owner returns. Without the hint, the value is
        // stranded on a node that will never be asked for it.
        ? send(node, { key, value, hintedFor: preferred.find(isDown) })
        : send(node, { key, value }),
    ),
  );

  if (acks.filter((a) => a.status === "fulfilled").length < w) throw new WriteFailed();
}`,
        },
        table: {
          caption: "The ring decides placement; N/R/W decide what a successful operation means.",
          headers: ["Setting", "Meaning", "Consequence"],
          rows: [
            [
              "N = 3",
              "Replicas per key, from the preference list",
              "Survives two node losses if they are distinct hosts",
            ],
            ["W = 2, R = 2", "R + W > N", "Read overlaps write — you see the latest value"],
            [
              "W = 1",
              "Ack after one replica",
              "Fast writes, but a read can miss a just-written value",
            ],
            [
              "R = 1",
              "Nearest replica answers",
              "Lowest latency reads; stale until repair catches up",
            ],
            [
              "Sloppy quorum",
              "Substitute nodes accept hints",
              "Availability during failures, at the cost of temporary divergence",
            ],
          ],
        },
        bullets: [
          "Anti-entropy closes the loop that hints miss: Merkle trees per arc let two replicas find exactly which key ranges differ using a handful of hash comparisons rather than a full scan.",
          "The preference list must skip racks and zones, not just hosts, or a single rack-power event takes all three replicas at once.",
          "Read repair — when a read sees divergent versions, write the winner back — is the cheapest repair mechanism you get and is worth naming.",
        ],
      },
      {
        heading: "Agreeing on the ring",
        lede: "The lookup is easy. The consensus underneath it is the hard part.",
        diagram: {
          kind: "compare",
          caption: "Somebody has to be the source of truth for membership.",
          options: [
            {
              title: "Coordinator (etcd / ZooKeeper)",
              sub: "one authoritative topology, watched by all",
              tone: "ok",
              good: [
                "A single linearizable ring version — no disagreement possible",
                "Trivial to reason about, trivial to debug",
                "Membership changes are atomic and auditable",
              ],
              bad: [
                "A hard dependency that can itself be down",
                "Watch storms when hundreds of clients react to one change",
              ],
              verdict:
                "The right default for most systems. Do not build gossip because it sounds impressive.",
            },
            {
              title: "Gossip (Dynamo / Cassandra)",
              sub: "nodes exchange membership pairwise",
              good: [
                "No central dependency; survives anything short of a full partition",
                "Scales to thousands of nodes with O(log N) rounds to converge",
              ],
              bad: [
                "Temporary disagreement is normal — two nodes can hold different rings",
                "Flapping nodes and split-brain need careful, well-tested handling",
              ],
              verdict:
                "When the store must survive the loss of any component, including the coordinator.",
            },
          ],
        },
        bullets: [
          "Version the ring and put that version on every request. A node that receives a request stamped with an older ring can redirect instead of silently serving the wrong shard.",
          "Distinguish suspect from dead. A node that misses heartbeats for two seconds is probably doing a garbage collection pause; evicting it triggers a pointless multi-minute rebalance.",
          "Never let two nodes claim the same token. Tokens are assigned by the coordinator, or in a gossip design they are chosen randomly from a 64-bit space where collision is effectively impossible.",
          "Automatic rebalancing on failure is usually wrong: a node down for 30 seconds should be waited out with hints, not replaced by moving terabytes.",
        ],
      },
      {
        heading: "When a ring is not the right tool",
        body: [
          "Consistent hashing solves 'spread keys with minimal movement'. It does not solve hot keys — a single viral key is one point on the ring no matter how many virtual nodes you have — and it does not solve range queries, because hashing deliberately destroys key ordering.",
        ],
        table: {
          caption: "Reach for something else when the problem is not actually placement.",
          headers: ["Symptom", "Why the ring does not help", "What to use"],
          rows: [
            [
              "One key takes 40% of traffic",
              "Hashing places it on exactly one node",
              "Replicate the hot key to all nodes, or key-suffix sharding",
            ],
            [
              '"All orders between March and April"',
              "Hashing destroys ordering by design",
              "Range partitioning with a split/merge manager",
            ],
            [
              "Need exactly-even placement, small N",
              "Virtual nodes only approximate evenness",
              "Rendezvous hashing, or jump consistent hash",
            ],
            [
              "Google-scale L4 load balancing",
              "Ring lookups per packet are too slow",
              "Maglev hashing — a lookup table, O(1), minimal disruption",
            ],
            [
              "Tenant must live in one region",
              "Hashing ignores data residency",
              "Directory-based sharding with an explicit map",
            ],
          ],
        },
        callout: {
          kind: "note",
          text: "Jump consistent hash (Lamping & Veach) deserves a mention: seven lines of code, zero memory, perfectly even, and minimal disruption — but it can only map to bucket 0..N-1 with no arbitrary node removal, so it fits stateless shard counts rather than a cluster with named hosts that come and go.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "200 virtual nodes per host",
        pickWhen: "Default for a cluster of tens to hundreds of nodes",
        cost: "~1.6 MB ring and slower gossip convergence than a small token count",
      },
      {
        choice: "Coordinator-managed membership",
        pickWhen: "You already run etcd/ZooKeeper and want one unambiguous ring",
        cost: "A hard dependency on the coordinator's availability",
      },
      {
        choice: "Gossip membership",
        pickWhen: "The store must outlive any single component",
        cost: "Transient disagreement, split-brain handling, much harder to debug",
      },
      {
        choice: "Sloppy quorum + hinted handoff",
        pickWhen: "Writes must succeed during partial failures (shopping carts)",
        cost: "Temporary divergence; needs read repair and anti-entropy to converge",
      },
      {
        choice: "Rendezvous hashing instead of a ring",
        pickWhen: "Small N, and perfectly even placement matters more than lookup cost",
        cost: "O(N) per lookup; replica ordering needs extra work",
      },
    ],
    wrapUp: [
      "The core property is proportionality: a membership change costs work proportional to the change, not to the size of the cluster. Modulo hashing is brittle rather than slow.",
      "Virtual nodes are not optional — without them load is badly skewed and, worse, a node failure dumps everything onto one successor and cascades.",
      "The ring does double duty: it routes keys and it defines the replica set, which is why the distinct-physical-node walk is a correctness requirement, not a nicety.",
      "For a durable store, a join is a streaming operation with a write-forwarding window; for a cache it is instant but produces a miss storm you must size.",
      "The genuinely hard part is membership agreement, not the hash. Version the ring, distinguish suspect from dead, and do not rebalance on a transient failure.",
      "With more time: hot-key mitigation, rack and zone awareness in the preference list, and Merkle-tree anti-entropy.",
    ],
    followUps: [
      {
        q: "You add one node to a 10-node cache. What happens in the next 60 seconds?",
        a: "Roughly 9% of keys change owner, and every one of them is a cache miss on first access, so the database sees a sudden burst of traffic it did not have before — at 100k reads/s that is about 9k/s of new load. I would add nodes one at a time rather than four at once, make sure single-flight is enabled so a thousand concurrent misses for one key become one database query, and if the cache supports it, warm the new node from its successors before making it authoritative. For a durable store the same change is a multi-minute streaming operation instead, and the node must not serve reads until it completes.",
      },
      {
        q: "Your three replicas for a key all end up on the same physical machine. How?",
        a: "Because the replica walk took the next three tokens rather than the next three distinct nodes. With 200 virtual nodes per host, adjacent tokens frequently belong to the same machine, so a naive walk collapses the replica set and you silently have a replication factor of one. The fix is to skip tokens whose owner is already in the list, and in production to extend that to racks and availability zones so a rack loss cannot take all three. It is worth saying that this bug does not show up in testing — everything works until the one machine dies.",
      },
      {
        q: "One key is getting 40% of all traffic. Does consistent hashing help?",
        a: "No, and it is important to say so plainly. Hashing distributes distinct keys; a single key is one point on the ring and lands on exactly one node regardless of how many virtual nodes exist. The fixes are outside the ring: replicate that key to every node and read from a random one, or split it into key#0..key#9 and fan out, or put a small in-process cache in front so most requests never reach the ring at all. Detecting it matters too — track per-key request rates so a hot key is visible before it becomes an outage.",
      },
      {
        q: "Two clients have different versions of the ring. What breaks?",
        a: "They route the same key to different nodes, so a write can land on the old owner while a read goes to the new one and misses it. The defence is to version the ring and stamp requests with that version: a node receiving a request from an older ring can reject or redirect rather than serving as if it were the owner. During a planned move this is why the old owner forwards writes for the arcs being transferred, and why the cutover happens only after streaming completes. Stale clients are inevitable in any client-side routing design, so the protocol must make staleness detectable rather than assuming it away.",
      },
      {
        q: "A node is unreachable for 30 seconds. Do you rebalance?",
        a: "No. Thirty seconds is a garbage collection pause, a network blip or a rolling restart, and rebalancing would move terabytes of data to solve a problem that fixes itself. I would mark it suspect, route around it using the preference list, accept writes on its behalf as hinted handoff, and hand those back when it returns. Real removal should be a deliberate decision — either an operator decommission or an automatic one after a long, explicitly configured timeout in the tens of minutes. Automatic rebalancing on short failures is how a small incident becomes a large one.",
      },
    ],
    related: [
      "/playgrounds/consistent-hashing",
      "/hld/consistent-hashing",
      "/hld/sharding",
      "/examples/kv-store",
      "/examples/distributed-cache",
    ],
    furtherReading: [
      {
        label: "Dynamo paper §4.2 — partitioning and replication",
        href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
      },
      {
        label: "Karger et al. — the original consistent hashing paper",
        href: "https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf",
      },
    ],
    playground: "consistent-hashing",
  },

  {
    slug: "autocomplete",
    title: "Design Search Autocomplete",
    source: "Volume 1",
    chapter: 13,
    difficulty: "intermediate",
    minutes: 20,
    tags: ["trie", "search", "top-k", "prefix index"],
    companies: ["Google", "Amazon", "YouTube", "Elasticsearch"],
    summary:
      "Type-ahead looks like a data-structures question and is really a latency and freshness question. A trie is the expected answer, but the trie alone is a trap: walking the subtree at query time is far too slow for a one-letter prefix serving hundreds of thousands of requests per second. The real design precomputes top-k at every node, ships immutable snapshots from an offline pipeline, and layers a small real-time path on top for things that are trending right now.",
    clarifying: [
      {
        q: "How many suggestions, and are they personalised?",
        a: "Top 5 to 10, and I will design the global case first. Personalisation changes the architecture fundamentally — a global trie can be shared by every user and cached at the edge, while a personalised one cannot — so I would add it as a re-ranking layer over global candidates rather than as a per-user index.",
      },
      {
        q: "How fresh do popularity updates need to be?",
        a: "Daily is acceptable for the long tail, but breaking news is not: if something is trending in the last ten minutes, users expect to see it. That argues for a batch-built snapshot plus a small real-time overlay, which is the classic lambda shape.",
      },
      {
        q: "Do we need typo tolerance?",
        a: "I would scope it out of the core design and mention where it goes. Exact-prefix matching is a trie; fuzzy matching needs edit-distance automata or an n-gram index, and mixing them into the hot path costs an order of magnitude in latency. In production it is a second-tier lookup when the exact prefix returns too few results.",
      },
      {
        q: "What languages, and does the client help?",
        a: "Assume multilingual with Unicode, which rules out a 26-child array per node and matters for CJK where there is no word boundary. And yes — the client debounces keystrokes and caches prefixes locally, which cuts QPS by a large factor before anything reaches us.",
      },
      {
        q: "Do we have to filter anything?",
        a: "Yes, and it is not optional. Autocomplete puts words in the product's mouth, so there is a blocklist for illegal, defamatory and unsafe completions applied at build time and enforceable at query time for emergencies.",
      },
    ],
    requirements: {
      functional: [
        "Return the top-k most popular completions for a prefix, ranked",
        "Update popularity from search logs on a daily cadence",
        "Surface genuinely trending queries within minutes, not days",
        "Enforce a blocklist for unsafe or legally-removed completions",
      ],
      nonFunctional: [
        "p99 under 100 ms end to end — under 50 ms server-side, or the feature feels broken",
        "Extremely read-heavy and extremely skewed: short prefixes dominate",
        "Availability over freshness — serving yesterday's snapshot beats serving nothing",
        "An emergency removal must take effect globally in minutes",
      ],
    },
    math: [
      {
        label: "Raw keystroke volume",
        expr: "10 M DAU × 10 searches × 20 chars",
        result: "≈ 2 B keystrokes/day ≈ 23,000/s",
        note: "Peak ×3 ≈ 70,000/s if every keystroke were a request — which is exactly why the client debounces.",
      },
      {
        label: "After client-side debounce and cache",
        expr: "23,000/s × ~0.3",
        result: "≈ 7,000/s average",
        note: "Debouncing at ~50 ms and caching prefixes already typed removes most of the traffic before it leaves the browser.",
      },
      {
        label: "Prefix skew",
        expr: "single-letter prefixes vs the tail",
        result: "top ~1,000 prefixes ≈ 60–70% of queries",
        note: "This is the single most useful number in the design: a tiny cache absorbs most of the load, and the edge can hold it.",
      },
      {
        label: "Dictionary size after thresholding",
        expr: "10 B queries/day → keep those seen ≥ 50 times",
        result: "≈ 50 M distinct queries",
        note: "Dropping the singleton tail removes ~95% of distinct strings and loses nothing a user would want suggested.",
      },
      {
        label: "Trie memory with cached top-k",
        expr: "50 M queries × ~20 nodes × (edge + 10 refs)",
        result: "≈ 8–15 GB, sharded",
        note: "Fits in memory across a handful of shards. Storing top-k at every node is what costs the memory — and what buys the latency.",
      },
    ],
    apis: [
      {
        method: "GET",
        path: "/v1/suggest?q={prefix}&k=10&locale=en-US",
        desc: "The hot path — returns ranked completions; heavily cached, no auth on the global variant",
      },
      {
        method: "GET",
        path: "/v1/suggest?q={prefix}&session={id}",
        desc: "Personalised variant — global candidates re-ranked with recent session history",
      },
      {
        method: "POST",
        path: "/v1/events/selection",
        desc: "Which suggestion was clicked, and at which rank — the training signal for ranking",
      },
      {
        method: "POST",
        path: "/v1/blocklist",
        desc: "Emergency suppression; applied at query time immediately, folded into the next build",
      },
      {
        method: "GET",
        path: "/v1/snapshots/current",
        desc: "Internal — snapshot id and checksum that serving nodes poll to trigger an atomic swap",
      },
    ],
    dataModel: [
      {
        entity: "query_frequency",
        fields: [
          "query (pk, normalised)",
          "locale (pk)",
          "count_7d (int)",
          "count_1d (int)",
          "last_seen",
          "→ output of the batch aggregation, input to the trie build",
        ],
      },
      {
        entity: "trie_snapshot",
        fields: [
          "snapshot_id (pk)",
          "locale, shard_prefix",
          "blob_url (immutable, in object storage)",
          "checksum, built_at",
          "status (building|ready|serving|retired)",
        ],
      },
      {
        entity: "trending_counters",
        fields: [
          "query (idx)",
          "window_start (5 min buckets)",
          "count",
          "→ Redis/stream state, merged over the snapshot at query time",
        ],
      },
      {
        entity: "blocklist",
        fields: [
          "pattern (pk)",
          "scope (locale|global)",
          "reason (legal|safety)",
          "added_at",
          "→ consulted on the serving path so removals are instant",
        ],
      },
    ],
    architecture: [
      {
        heading: "Two systems, one snapshot between them",
        lede: "Offline builds the index; online only reads it. Nothing is written at query time.",
        diagram: {
          kind: "system",
          caption:
            "The snapshot boundary is the design — the serving tier never mutates its index.",
          columns: [
            {
              title: "Collect",
              nodes: [
                { id: "logs", label: "Search logs", sub: "query + locale + ts" },
                { id: "stream", label: "Event stream", sub: "Kafka" },
              ],
            },
            {
              title: "Build (hourly/daily)",
              nodes: [
                { id: "agg", label: "Aggregate", sub: "count, normalise, threshold" },
                { id: "filter", label: "Safety filter", sub: "blocklist applied" },
                {
                  id: "build",
                  label: "Trie builder",
                  sub: "top-k cached per node",
                  tone: "accent",
                },
                { id: "blob", label: "Snapshot", sub: "immutable, checksummed" },
              ],
            },
            {
              title: "Serve (always)",
              nodes: [
                { id: "cdn", label: "CDN / edge", sub: "hot prefixes, ~30 s TTL", tone: "ok" },
                { id: "api", label: "Suggest API", sub: "stateless" },
                { id: "shard", label: "Trie shards", sub: "in memory, by prefix" },
                { id: "trend", label: "Trending overlay", sub: "last ~30 min" },
              ],
            },
          ],
        },
        steps: [
          {
            title: "Aggregate and normalise",
            text: "Roll raw queries into (query, locale, count) over a trailing window.",
            detail:
              'Normalisation is where quality is won or lost: lowercase, collapse whitespace, strip most punctuation — but not all, because "c++" and "c" are different queries. Keep the display form alongside the normalised key.',
          },
          {
            title: "Threshold the tail",
            text: "Discard queries seen fewer than ~50 times in the window.",
            detail:
              "This removes about 95% of distinct strings, almost all of which are typos or one-off nonsense, and it is also a privacy control — a query typed by one person should never become a public suggestion.",
          },
          {
            title: "Build the trie with top-k at every node",
            text: "Each node stores the k best completions in its own subtree.",
            detail:
              'This is the step that makes the whole thing work. Without it, the prefix "a" requires walking millions of descendants at query time; with it, the answer is already sitting on the node.',
          },
          {
            title: "Ship an immutable snapshot",
            text: "Write to object storage, checksum, then have serving nodes load and atomically swap.",
            detail:
              "Swapping a pointer means no partially-updated index is ever visible, and rollback is just pointing back at the previous snapshot. Nodes update in waves so the cluster never loses capacity.",
          },
        ],
        callout: {
          kind: "interview",
          title: "The mistake the question is testing for",
          text: 'Almost everyone draws a trie and says "walk the subtree and pick the top k". Ask what that costs for the prefix "a" and the answer is millions of nodes, per request, at tens of thousands of requests per second. Precomputing top-k at every node — trading memory for time, at build time rather than query time — is the actual insight.',
        },
      },
      {
        heading: "The serving data structure",
        lede: "A trie is the whiteboard answer; say what you would actually deploy.",
        code: {
          title: "Top-k cached at each node turns a subtree walk into a pointer read",
          lang: "ts",
          source: `type TrieNode = {
  children: Map<string, TrieNode>;
  // The k best completions under THIS node, precomputed at build time.
  // Memory cost: ~k refs per node. Latency benefit: no traversal at all.
  topK: Array<{ query: string; score: number }>;
};

function suggest(root: TrieNode, prefix: string, k: number) {
  let node = root;
  for (const ch of normalise(prefix)) {
    const next = node.children.get(ch);
    if (!next) return [];          // no completions — return fast, do not guess
    node = next;
  }
  // O(prefix length), independent of how many queries sit underneath.
  return node.topK.slice(0, k);
}

// Build time: children are finished before parents, so a parent merges the
// already-computed lists of its children rather than scanning its subtree.
function buildTopK(node: TrieNode, k: number) {
  for (const child of node.children.values()) buildTopK(child, k);
  node.topK = mergeTopK([node.ownScore, ...[...node.children.values()].map((c) => c.topK)], k);
}`,
        },
        bullets: [
          "In production the shipped artefact is usually not a pointer-based trie but a finite-state transducer or a double-array trie — same semantics, a fraction of the memory, and it can be memory-mapped so a process restart does not mean a rebuild.",
          "A perfectly reasonable alternative answer: a sorted table of (prefix, top-k) for prefixes up to length 5, plus a fallback. Prefixes longer than five characters have few enough matches that a simple range scan is fast.",
          "If the organisation already runs Elasticsearch, completion suggesters do this out of the box. Saying so — and then explaining why a dedicated service still wins on p99 and cost at this QPS — is a stronger answer than pretending the option does not exist.",
          "Shard by prefix, not by hash, so a lookup touches exactly one shard. But shard by traffic rather than alphabetically: 's' and 'a' carry vastly more load than 'z', so the shard map is built from measured volume.",
        ],
        table: {
          caption: "What each structure actually costs at 50 M queries.",
          headers: ["Structure", "Memory", "Lookup", "Build / update"],
          rows: [
            ["Pointer trie + top-k", "~15 GB", "O(len), no traversal", "Full rebuild, minutes"],
            [
              "Double-array trie / FST",
              "~2–4 GB",
              "O(len), mmap-able",
              "Slower build, instant load",
            ],
            [
              "Sorted (prefix → top-k) table",
              "~5 GB",
              "One binary search",
              "Trivial to build and diff",
            ],
            [
              "Elasticsearch completion suggester",
              "Cluster-dependent",
              "Higher p99, 10–50 ms",
              "Near-real-time indexing",
            ],
            [
              "Naive trie, walk at query time",
              "~8 GB",
              'Millions of nodes for "a"',
              "Unusable at this QPS",
            ],
          ],
        },
      },
    ],
    deepDives: [
      {
        heading: "Caching, and why the edge does most of the work",
        lede: "The skew is so extreme that the cache is more important than the index.",
        diagram: {
          kind: "flow",
          caption: "Most requests never reach a trie shard at all.",
          rows: [
            [
              { id: "b", label: "Browser", sub: "debounce 50 ms, local LRU", tone: "ok" },
              { id: "cdn", label: "CDN / edge", sub: "~30 s TTL on short prefixes", tone: "ok" },
            ],
            [
              { id: "api", label: "Suggest API", sub: "in-process hot map" },
              { id: "redis", label: "Shared cache", sub: "prefix → top-k" },
              { id: "shard", label: "Trie shard", sub: "the actual index", tone: "accent" },
            ],
          ],
        },
        bullets: [
          'Short prefixes are both the hottest and the most stable: what people mean by "fa" barely changes minute to minute, so a 30-second edge TTL is safe and absorbs the majority of traffic.',
          "Cache the empty result too. Nonsense prefixes are common — often from automated traffic — and a negative cache stops each one costing a shard lookup.",
          "Keep a small in-process map of the top few thousand prefixes on every API node. It removes a network hop for the majority of requests and costs a few hundred megabytes.",
          "The client is part of the architecture: debouncing turns a keystroke stream into a request every ~50 ms of idle, and a local cache of prefixes already typed makes backspace free.",
        ],
        callout: {
          kind: "insight",
          text: "Because suggestions are shared by everyone and cheap to regenerate, this is one of the rare systems where a stale answer is genuinely fine. Design for that: serve the previous snapshot if the current one fails to load, serve cached results if shards are unavailable, and never fail the request — an empty dropdown is a far better outcome than an error.",
        },
      },
      {
        heading: "Keeping up with what is trending",
        body: [
          "A daily snapshot cannot know that something started happening an hour ago, and that is precisely when autocomplete is most valuable. The fix is not a faster rebuild — it is a small, bounded real-time layer merged over the snapshot at query time.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Batch supplies the baseline; the streaming layer supplies the last half hour.",
          actors: [
            { id: "cli", label: "Client" },
            { id: "api", label: "Suggest API" },
            { id: "trie", label: "Trie shard", sub: "yesterday's snapshot" },
            { id: "rt", label: "Trending store", sub: "5-min windows" },
          ],
          messages: [
            { from: "cli", to: "api", label: '1. prefix "ear"', kind: "call" },
            { from: "api", to: "trie", label: "2. top-k from snapshot", kind: "call" },
            { from: "trie", to: "api", label: "3. earbuds, early voting…", kind: "return" },
            { from: "api", to: "rt", label: '4. trending under "ear"?', kind: "call" },
            {
              from: "rt",
              to: "api",
              label: '5. "earthquake" ×40 in 10 min',
              kind: "return",
              tone: "warn",
            },
            {
              from: "api",
              to: "api",
              label: "6. merge + re-rank with a recency boost",
              kind: "self",
            },
            { from: "api", to: "cli", label: "7. earthquake first", kind: "return", tone: "ok" },
          ],
        },
        bullets: [
          "Keep the real-time layer deliberately small — only queries whose rate has spiked well above their baseline, held for perhaps 30 minutes. It is an overlay, not a second index.",
          "Rank by rate of change rather than absolute count, otherwise perennially popular queries drown out the thing that started ten minutes ago.",
          "Spike detection needs a floor, or every low-volume query looks like it is trending the moment it is typed twice.",
          "This is also the abuse surface. Without the count threshold and the blocklist, a small coordinated group can push a phrase into the suggestions of a major product — which has happened, publicly, to more than one company.",
        ],
      },
      {
        heading: "Ranking, personalisation and safety",
        body: [
          "Raw frequency is the starting point, not the answer. The signal that actually matters is whether a suggestion gets clicked when it is shown, which turns ranking into a feedback loop that must be handled carefully — suggestions shown at position one get clicked more simply because they are at position one.",
        ],
        table: {
          caption: "Signals, in roughly the order they are worth adding.",
          headers: ["Signal", "What it captures", "Watch out for"],
          rows: [
            ["Frequency (7-day)", "Broad popularity", "Lags real-world events badly"],
            [
              "Click-through at rank",
              "Whether the suggestion was useful",
              "Position bias — must be normalised by rank",
            ],
            [
              "Recency weighting",
              "Interest that is rising now",
              "Over-weighting makes results jittery between keystrokes",
            ],
            [
              "Locale / region",
              '"football" means different things',
              "Sparse data for small locales; fall back to global",
            ],
            [
              "Session history",
              "What this user just searched",
              "Cannot be cached globally — apply as re-ranking only",
            ],
            [
              "Blocklist",
              "Legal and safety removals",
              "Must apply at query time, not only at build time",
            ],
          ],
        },
        bullets: [
          "Apply personalisation as a re-rank of the global top ~50, never as a per-user index. The global candidates stay cacheable and shared; only the final ordering is private.",
          'Stability matters more than it sounds: if the list reorders wildly between "ear" and "earb", the feature feels broken even when every individual result is defensible.',
          'The blocklist has to be enforceable on the serving path. A legal takedown that requires a full rebuild cycle is not a takedown, and "we will fix it in tomorrow\'s build" is not an acceptable answer for a defamatory completion.',
          "The frequency threshold is doing privacy work as well as quality work — it is what stops a unique, identifying query ever being shown to somebody else.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Precompute top-k at every trie node",
        pickWhen: "Always — this is the core of the design",
        cost: "Roughly doubles index memory and makes updates a full rebuild",
      },
      {
        choice: "Immutable snapshots with atomic swap",
        pickWhen: "Popularity changes slowly and availability beats freshness",
        cost: "Minutes-to-hours staleness, and a rebuild pipeline to operate",
      },
      {
        choice: "Real-time trending overlay",
        pickWhen: "Breaking events must appear within minutes",
        cost: "A second ranking path, merge logic, and a new abuse surface",
      },
      {
        choice: "Shard the trie by prefix",
        pickWhen: "The index no longer fits comfortably in one process",
        cost: "A traffic-weighted shard map, because letter frequency is wildly uneven",
      },
      {
        choice: "Elasticsearch completion suggester",
        pickWhen: "The cluster already exists and fuzzy matching is needed early",
        cost: "Higher p99, more expensive per query, less control over ranking",
      },
      {
        choice: "Personalisation as re-ranking",
        pickWhen: "Per-user relevance matters",
        cost: "Personalised responses cannot be shared by the CDN",
      },
    ],
    wrapUp: [
      "The trie is the expected answer, but the load-bearing decision is precomputing top-k at every node — otherwise a one-letter prefix walks millions of descendants on every keystroke.",
      "Offline builds the index and online only reads it. Immutable, checksummed snapshots swapped atomically give safe rollback and mean no request ever sees a half-updated index.",
      "Traffic is extremely skewed towards short prefixes, so the CDN and an in-process cache serve most requests and the index is protected from its own hot spots.",
      "Batch alone cannot represent breaking news, so a small trending overlay is merged at query time and ranked by rate of change rather than raw volume.",
      "Thresholding rare queries is simultaneously a quality control, a memory control and a privacy control — and the blocklist must be enforceable at query time, not only at build time.",
      "With more time: typo tolerance via an edit-distance automaton as a second-tier lookup, and multilingual segmentation for languages without word boundaries.",
    ],
    followUps: [
      {
        q: "The prefix is a single letter, 'a'. Walk me through what happens.",
        a: "Almost certainly nothing reaches the index: 'a' is one of the hottest prefixes in the system, so it is served from the browser cache, the CDN, or the in-process map on the API node. If it does reach a shard, the lookup is a single character descent to the node for 'a', and the answer is the precomputed top-k list sitting on that node — no subtree traversal at all. The reason to precompute is exactly this case: the naive version would scan millions of descendants for the most common request in the system.",
      },
      {
        q: "How do you get a trending query into suggestions within ten minutes?",
        a: "Not by rebuilding the trie — a rebuild is minutes of compute and a cluster-wide reload, and doing it every ten minutes would be both wasteful and risky. I keep a streaming layer counting queries in five-minute windows, flag ones whose rate is far above their own baseline, and merge that small set over the snapshot results at query time with a recency boost. The important detail is that it is ranked by rate of change rather than absolute count, or established queries would always win, and it needs a volume floor so that two occurrences of an obscure string do not look like a trend.",
      },
      {
        q: "A user types something offensive and it appears as a suggestion for everyone. How did that happen, and how do you stop it?",
        a: "It happens when the frequency threshold is too low or absent, so a small number of coordinated searches is enough to promote a string into the index. The defences are layered: a meaningful count threshold so rare queries never surface, a blocklist applied at build time, spike detection that flags unnatural jumps for review, and — critically — blocklist enforcement on the serving path so an emergency removal takes effect in minutes rather than waiting for the next build. I would also make the removal auditable, because these are frequently legal requests rather than moderation decisions.",
      },
      {
        q: "How do you deploy a new snapshot without dropping requests?",
        a: "The snapshot is immutable and content-addressed in object storage, so serving nodes download and validate it fully before it is used, then swap an internal pointer — requests in flight finish against the old one and new requests get the new one, and no partially-loaded index is ever visible. Nodes update in waves, a fraction of the cluster at a time, so capacity never drops meaningfully, and health checks gate each wave. If the new snapshot fails validation or error rates rise, rollback is pointing the pointer back, which is why keeping the previous snapshot resident is worth the memory.",
      },
      {
        q: "A whole trie shard goes down. What does the user see?",
        a: "Ideally nothing, because prefixes on that shard are partly served from the CDN and the in-process caches, and shards are replicated so a replica takes over. If the whole replica set is unavailable, the correct behaviour is to return an empty suggestion list quickly rather than an error or a slow request — autocomplete is an enhancement, and a dropdown that does not appear is a far smaller failure than a search box that hangs. I would enforce that with a tight timeout on the shard call, maybe 30 milliseconds, and treat a timeout as 'no suggestions' rather than as a failure to propagate.",
      },
    ],
    related: [
      "/hld/caching",
      "/hld/cdn",
      "/examples/google-search",
      "/examples/web-crawler",
      "/lld/lru-cache",
    ],
    furtherReading: [
      {
        label: "algomaster — design search autocomplete",
        href: "https://algomaster.io/learn/system-design-interviews/design-search-autocomplete-system",
      },
      {
        label: "Elasticsearch — completion suggester internals",
        href: "https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html",
      },
    ],
  },

  {
    slug: "google-drive",
    title: "Design Google Drive",
    source: "Volume 1",
    chapter: 15,
    difficulty: "advanced",
    minutes: 24,
    tags: ["storage", "sync", "chunking", "dedup", "conflicts"],
    companies: ["Google Drive", "Dropbox", "OneDrive", "Box"],
    summary:
      "The design splits in two on the first whiteboard line: file bytes go to object storage, file structure goes to a strongly consistent database, and they are joined by content hashes. Once that split exists, the hard problems are all about the sync client — how to upload 50 GB over hotel wifi, how to avoid re-uploading a byte that already exists anywhere in the system, how to tell 200 devices that something changed, and what to do when two of them edited the same file while offline.",
    clarifying: [
      {
        q: "Is this file sync, or collaborative editing?",
        a: "File sync. Real-time collaborative editing on the same document is a fundamentally different system — operational transform or CRDTs on a character stream — and conflating the two is the most common way this interview goes wrong. Drive stores a file; Docs edits one.",
      },
      {
        q: "What is the largest file, and how reliable is the network?",
        a: "Assume up to tens of gigabytes on unreliable, resumable connections. That single assumption forces chunked, resumable uploads and rules out treating a file as one blob in one request.",
      },
      {
        q: "Do we need version history, and for how long?",
        a: "Yes — 30 days of versions, or 100 versions, whichever comes first. Versioning is nearly free once files are lists of immutable content-addressed chunks, which is a good argument for that model beyond deduplication.",
      },
      {
        q: "How strongly consistent does the file tree need to be?",
        a: "The metadata must be strongly consistent — a rename or a permission revoke that is eventually consistent is a security bug and a usability disaster. The bytes can be eventually consistent, because a file that is visible but still transferring is a normal, explainable state.",
      },
      {
        q: "What does sharing look like at the top end?",
        a: "A folder shared with a large organisation — tens of thousands of users. That breaks naive ACL fan-out, so permissions have to be evaluated by walking inherited grants rather than by materialising a row per user per file.",
      },
    ],
    requirements: {
      functional: [
        "Upload, download, rename, move and delete files and folders",
        "Sync a namespace across many devices, including after long offline periods",
        "Share files and folders with users and groups, with inherited permissions",
        "Version history with restore, and a recoverable trash",
      ],
      nonFunctional: [
        "Resumable transfers that survive network loss and client restarts",
        "Never re-upload bytes the system already stores",
        "Strongly consistent metadata; eventually consistent bytes are acceptable",
        "Durability of 11 nines for stored content — losing a file is unrecoverable trust damage",
      ],
    },
    math: [
      {
        label: "Ingest volume",
        expr: "50 M DAU × 10 files/day × 2 MB avg",
        result: "≈ 1 PB/day raw",
        note: "Peak upload ≈ 6,000 files/s. The API tier never touches these bytes — clients write directly to object storage.",
      },
      {
        label: "After deduplication",
        expr: "1 PB × ~0.4 (typical 50–70% dedup)",
        result: "≈ 400 TB/day stored",
        note: "Shared documents, re-uploads and identical attachments across an organisation are why the saving is this large.",
      },
      {
        label: "Metadata QPS",
        expr: "50 M devices polling deltas every 30 s",
        result: "≈ 1.7 M req/s if polled",
        note: "Unacceptable — this is the number that justifies a push notification channel rather than polling.",
      },
      {
        label: "Chunk count",
        expr: "400 TB/day ÷ 4 MB",
        result: "≈ 100 M chunks/day",
        note: "At ~200 B of metadata per chunk that is 20 GB/day of chunk rows alone, which is why chunk metadata is sharded separately from the file tree.",
      },
      {
        label: "Delta sync saving",
        expr: "edit 1 KB inside a 100 MB file",
        result: "1 chunk (4 MB) vs 100 MB",
        note: "A 25× reduction with fixed chunks — and with content-defined chunking an insert near the start does not reshuffle everything after it.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/uploads",
        desc: "Begin — body {path, size, chunkHashes[]}; response names only the chunks the server does not already have",
      },
      {
        method: "PUT",
        path: "/v1/uploads/{id}/chunks/{hash}",
        desc: "Upload one chunk, usually via a pre-signed URL straight to object storage; idempotent by hash",
      },
      {
        method: "POST",
        path: "/v1/uploads/{id}/commit",
        desc: "Atomically create the new file version from the chunk list — the only step that mutates the tree",
      },
      {
        method: "GET",
        path: "/v1/changes?cursor={c}",
        desc: "Delta since the cursor; the sync client's entire view of the world",
      },
      {
        method: "GET",
        path: "/v1/notifications/subscribe",
        desc: "Long poll or WebSocket — tells the client only that the cursor moved",
      },
      {
        method: "POST",
        path: "/v1/files/{id}/permissions",
        desc: "Grant to a user or group, with inheritance to descendants",
      },
    ],
    dataModel: [
      {
        entity: "files",
        fields: [
          "file_id (pk)",
          "parent_id (fk, idx)",
          "owner_id (idx)",
          "name",
          "current_version_id (fk)",
          "is_folder, is_trashed",
          "→ the namespace tree; strongly consistent",
        ],
      },
      {
        entity: "file_versions",
        fields: [
          "version_id (pk)",
          "file_id (fk, idx)",
          "chunk_hashes (ordered list)",
          "size, created_at, created_by",
          "→ immutable; version history is free",
        ],
      },
      {
        entity: "chunks",
        fields: [
          "hash (pk, SHA-256 of content)",
          "size",
          "storage_url",
          "refcount (int)",
          "→ globally deduplicated, content-addressed",
        ],
      },
      {
        entity: "permissions",
        fields: [
          "file_id (pk, idx)",
          "principal_id (pk — user or group)",
          "role (viewer|commenter|editor|owner)",
          "inherited_from (fk, nullable)",
        ],
      },
      {
        entity: "device_cursors",
        fields: [
          "device_id (pk)",
          "user_id (idx)",
          "cursor (monotonic journal position)",
          "last_seen_at",
        ],
      },
      {
        entity: "change_journal",
        fields: [
          "seq (pk, monotonic per namespace)",
          "namespace_id (idx)",
          "file_id, op (create|update|move|delete|acl)",
          "→ the sync protocol reads only this",
        ],
      },
    ],
    architecture: [
      {
        heading: "Metadata and bytes are different systems",
        lede: "Draw this line first; every later decision refers back to it.",
        diagram: {
          kind: "system",
          caption: "Content hashes are the only thing crossing the boundary.",
          columns: [
            {
              title: "Client",
              nodes: [
                { id: "watch", label: "Watcher", sub: "filesystem events" },
                { id: "chunk", label: "Chunker", sub: "split + SHA-256" },
                { id: "queue", label: "Local queue", sub: "survives restart" },
              ],
            },
            {
              title: "Control plane",
              nodes: [
                {
                  id: "meta",
                  label: "Metadata service",
                  sub: "tree, versions, ACLs",
                  tone: "accent",
                },
                { id: "journal", label: "Change journal", sub: "monotonic per namespace" },
                { id: "notify", label: "Notification service", sub: "long poll / WS" },
              ],
            },
            {
              title: "Data plane",
              nodes: [
                { id: "blob", label: "Object storage", sub: "immutable chunks", tone: "ok" },
                { id: "cdn", label: "CDN", sub: "downloads of hot files" },
                { id: "cold", label: "Cold tier", sub: "untouched > 90 days" },
              ],
            },
          ],
        },
        bullets: [
          "The API tier never proxies file bytes. Clients get a pre-signed URL and talk to object storage directly, which keeps a petabyte a day off the application servers entirely.",
          "Chunks are immutable and named by their content hash, so uploads are idempotent, retries are free, and two users storing the same file store it once.",
          "A file version is an ordered list of chunk hashes. That one representation gives deduplication, delta sync, version history and cheap copies all at once.",
          "Metadata lives in a relational store with real transactions, because a move must not be able to half-happen and a permission revoke must be immediately visible.",
        ],
        callout: {
          kind: "interview",
          title: "State the split in one sentence",
          text: '"A file is metadata plus a list of content-addressed chunks; the metadata is strongly consistent and small, the chunks are immutable and enormous, and they scale in completely different ways." Everything else in this design — dedup, delta sync, versioning, resumable upload — is a consequence of that sentence rather than a separate feature.',
        },
      },
      {
        heading: "Upload: ask before you send",
        lede: "The fastest upload is the one that never happens.",
        diagram: {
          kind: "sequence",
          caption: "The client hashes locally and the server replies with only what is missing.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "Metadata service" },
            { id: "s3", label: "Object storage" },
          ],
          messages: [
            { from: "c", to: "c", label: "1. split into 4 MB chunks, SHA-256 each", kind: "self" },
            {
              from: "c",
              to: "api",
              label: "2. POST /uploads {path, size, hashes[]}",
              kind: "call",
            },
            { from: "api", to: "api", label: "3. which hashes are unknown?", kind: "self" },
            {
              from: "api",
              to: "c",
              label: "4. upload only these 3 of 25 + pre-signed URLs",
              kind: "return",
              tone: "ok",
            },
            { from: "c", to: "s3", label: "5. PUT chunks, in parallel, resumable", kind: "call" },
            { from: "s3", to: "c", label: "6. 200 per chunk", kind: "return" },
            { from: "c", to: "api", label: "7. POST /commit", kind: "call" },
            {
              from: "api",
              to: "api",
              label: "8. verify all chunks exist, write version + journal row",
              kind: "self",
              tone: "accent",
            },
            {
              from: "api",
              to: "c",
              label: "9. version id, new cursor",
              kind: "return",
              tone: "ok",
            },
          ],
        },
        steps: [
          {
            title: "Chunk and hash on the client",
            text: "Split into ~4 MB pieces and hash each one before contacting the server.",
            detail:
              "4 MB balances two costs: smaller chunks mean better delta sync but more metadata rows and more requests; larger chunks mean fewer requests but you re-send more for a one-byte change.",
          },
          {
            title: "Negotiate",
            text: "Send the hash list; the server replies with the subset it has never seen.",
            detail:
              "This is where most of the deduplication saving is realised, and it is why re-uploading a file the user already has is nearly instant. It is also the step that creates a privacy problem worth naming.",
          },
          {
            title: "Transfer in parallel, resumably",
            text: "Upload missing chunks directly to object storage, several at a time.",
            detail:
              "Because chunks are addressed by content, a failed or duplicated PUT is harmless — retry is the entire error-handling strategy, and a client restart resumes from whatever is already stored.",
          },
          {
            title: "Commit atomically",
            text: "One transaction creates the version, points the file at it, and appends to the change journal.",
            detail:
              "Until commit, other devices see nothing. This is what makes a partially uploaded 50 GB file invisible rather than corrupt, and it is why the commit is the only step that touches the tree.",
          },
        ],
        callout: {
          kind: "warn",
          title: "Global dedup leaks information",
          text: 'If the server answers "I already have that chunk" for any user\'s content, an attacker can test whether a specific file exists in the system — a confirmation-of-file attack, demonstrated against real products. The mitigations are to scope deduplication per user or per organisation, or to require proof of possession of the full chunk rather than trusting a hash. Naming this trade-off is worth more than the dedup ratio itself.',
        },
      },
    ],
    deepDives: [
      {
        heading: "Sync: a journal and a cursor",
        lede: "The client never asks 'what changed?' — it asks 'what happened after position N?'",
        code: {
          title: "The entire sync protocol",
          lang: "ts",
          source: `// Every namespace has a monotonic journal. A device is nothing more than a
// position in it, which makes sync restartable, auditable and idempotent.
async function syncLoop(device: Device) {
  for (;;) {
    const { changes, cursor, hasMore } = await api.changes({ cursor: device.cursor });

    for (const change of changes) {
      // Apply in journal order. Order is what makes concurrent moves and
      // deletes converge — replaying out of order produces a different tree.
      await applyLocally(change);
    }

    // Persist the cursor only AFTER the changes are durably applied. Crashing
    // in between costs a replay of a few changes, which is safe because every
    // operation is idempotent; the reverse order would silently skip changes.
    device.cursor = cursor;
    await device.save();

    // Long poll rather than fixed polling: 50 M devices at 30 s intervals is
    // ~1.7 M req/s of mostly-empty responses.
    if (!hasMore) await api.waitForChange({ cursor, timeout: 60_000 });
  }
}`,
        },
        bullets: [
          'The notification channel carries no data — it only says "your cursor is stale". That keeps it tiny, makes it safe to drop messages, and means a missed notification costs at most one polling interval of latency.',
          "Cursors make long offline periods work correctly: a laptop opened after a month replays from its position rather than diffing an entire tree.",
          "Journal entries need compaction. A file edited 500 times while a device was offline should replay as one change, not 500.",
          "Deletes are tombstones with a retention window, because a device that returns after the tombstone is collected cannot tell deletion apart from never-existed and will happily resurrect the file.",
        ],
        table: {
          caption: "Why push plus cursor beats the alternatives.",
          headers: ["Approach", "Server cost at 50 M devices", "Latency", "Offline behaviour"],
          rows: [
            ["Poll every 30 s", "~1.7 M req/s, mostly empty", "Up to 30 s", "Fine"],
            ["Long poll + cursor", "~50 M idle connections", "Sub-second", "Fine"],
            ["WebSocket + cursor", "Same, lower per-message overhead", "Sub-second", "Fine"],
            ["Push full state", "Enormous payloads", "Sub-second", "Breaks after long offline"],
          ],
        },
      },
      {
        heading: "Conflicts",
        lede: "Two devices edited the same file offline. There is no correct merge — only honest choices.",
        diagram: {
          kind: "compare",
          caption: "Pick per file type; the wrong default silently destroys work.",
          options: [
            {
              title: "Last writer wins",
              sub: "highest timestamp survives",
              good: ["Trivial to implement", "No user-visible complexity"],
              bad: ["Silently destroys the other edit", "Clock skew decides whose work is lost"],
              verdict: "Acceptable only for genuinely disposable state like cache files.",
            },
            {
              title: "Keep both as a conflicted copy",
              sub: '"report (Ana\'s conflicted copy).xlsx"',
              tone: "ok",
              good: [
                "No edit is ever lost",
                "The user understands exactly what happened",
                "Works for any file format, including opaque binaries",
              ],
              bad: ["Clutters folders", "Pushes the merge onto the user"],
              verdict: "The right default for file sync — this is what Dropbox and Drive do.",
            },
            {
              title: "Operational merge",
              sub: "OT / CRDT on the content",
              good: ["Genuine concurrent editing", "No user-visible conflict at all"],
              bad: ["Only possible for formats you understand", "A substantially larger system"],
              verdict: "This is Google Docs, not Drive. Name it as the next system, not this one.",
            },
          ],
        },
        bullets: [
          'Detect conflicts with version vectors or a parent-version pointer, not timestamps. "This edit was based on version 7, but the file is now at version 9" is a fact; "this clock said it was later" is a guess.',
          "Because chunks are content-addressed, two devices that made identical edits produce identical hashes — that is not a conflict at all, and detecting it avoids a pointless conflicted copy.",
          "Directory conflicts are subtler than file conflicts: two devices creating different files with the same name, or one moving a folder another deleted. Resolve by journal order and make the result explainable.",
          "Never resolve a conflict by deleting. A conflicted copy is annoying; silent data loss is the thing users never forgive.",
        ],
      },
      {
        heading: "Sharing and permissions at scale",
        body: [
          "The naive model — a row per user per file — collapses immediately. A folder shared with 50,000 people, containing 10,000 files, is half a billion rows, and every move within that tree rewrites them. Permissions have to be stored on the grant and evaluated by walking ancestry.",
        ],
        diagram: {
          kind: "er",
          caption: "Grants attach to a node; access is an inherited walk, not a materialised list.",
          entities: [
            {
              name: "files",
              note: "the namespace tree",
              fields: [
                { name: "file_id", type: "uuid", key: "pk" },
                { name: "parent_id", type: "uuid", key: "fk", note: "ancestry walk" },
                { name: "owner_id", type: "uuid", key: "idx" },
              ],
            },
            {
              name: "permissions",
              note: "one row per GRANT, not per user per file",
              fields: [
                { name: "file_id", type: "uuid", key: "pk" },
                { name: "principal_id", type: "uuid", key: "pk", note: "user or group" },
                { name: "role", type: "enum", note: "viewer|editor|owner" },
              ],
            },
            {
              name: "groups",
              note: "indirection that makes org-wide sharing viable",
              fields: [
                { name: "group_id", type: "uuid", key: "pk" },
                { name: "member_id", type: "uuid", key: "idx" },
              ],
            },
          ],
          relations: [
            { from: "files", to: "files", label: "parent of", cardinality: "1:N" },
            { from: "files", to: "permissions", label: "granted on", cardinality: "1:N" },
            { from: "groups", to: "permissions", label: "principal in", cardinality: "1:N" },
          ],
        },
        bullets: [
          "Access check = walk from the file to the root collecting grants, resolve group membership, take the most permissive role. Cache the result per (user, file) with a short TTL and invalidate on any ACL write in that subtree.",
          "Groups are what make organisation-wide sharing tractable: one grant to a group of 50,000 rather than 50,000 grants.",
          "Revocation must be immediate and must invalidate the permission cache and any outstanding pre-signed URLs — a revoked user holding a valid signed URL is a real hole, so keep those TTLs short.",
          "A move can change effective permissions for an entire subtree, which is one more reason the metadata store needs real transactions.",
        ],
      },
      {
        heading: "Storage lifecycle and garbage collection",
        body: [
          "Chunks are shared across versions, files and users, so nothing can be deleted just because a file was. Reference counting is the mechanism, and it is easy to get subtly wrong in a way that either leaks petabytes or — far worse — deletes a chunk somebody still references.",
        ],
        table: {
          caption: "Where the bytes live over their lifetime.",
          headers: ["Age / state", "Tier", "Rationale"],
          rows: [
            ["Active, < 30 days", "Hot object storage + CDN", "Most reads happen here"],
            ["Older versions", "Standard storage", "Rarely read, must stay instant to restore"],
            [
              "Untouched > 90 days",
              "Cold / archival",
              "Large saving; retrieval latency is acceptable",
            ],
            ["Trashed", "Standard, with a 30-day timer", "Must be restorable; not yet collectable"],
            [
              "Refcount 0 for > 7 days",
              "Deleted",
              "The grace period is protection against refcount bugs",
            ],
          ],
        },
        bullets: [
          "Decrement refcounts asynchronously and delete only after a grace period. Immediate deletion on a decrement makes any race or bug permanently destructive.",
          "Run a periodic mark-and-sweep against the version table as a backstop — counters drift, and the authoritative answer is which versions actually reference a hash.",
          "Deleting a user's data for a legal request is harder in a deduplicated store, because their chunk may be identical to someone else's. Removing their reference is usually the correct and defensible answer.",
          "Erasure coding rather than full replication for cold data: comparable durability at roughly half the storage cost, in exchange for slower reconstruction.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Fixed 4 MB chunks",
        pickWhen: "Default — simple, predictable metadata volume",
        cost: "An insert near the start of a file shifts every subsequent chunk boundary",
      },
      {
        choice: "Content-defined chunking (rolling hash)",
        pickWhen: "Large files edited in the middle — VM images, datasets",
        cost: "More CPU on the client and variable chunk sizes to manage",
      },
      {
        choice: "Global deduplication",
        pickWhen: "Storage cost dominates and content is highly shared",
        cost: "Enables confirmation-of-file attacks unless scoped or proof-of-possession is required",
      },
      {
        choice: "Conflicted copies",
        pickWhen: "Always, for opaque file formats",
        cost: "Folder clutter and a merge the user has to perform",
      },
      {
        choice: "Long poll / WebSocket notifications",
        pickWhen: "Millions of devices needing sub-second sync",
        cost: "Tens of millions of idle connections to hold and load-balance",
      },
      {
        choice: "Strongly consistent metadata store",
        pickWhen: "Always — moves, renames and ACLs must be atomic",
        cost: "Sharding by namespace becomes the scaling limit, not throughput",
      },
    ],
    wrapUp: [
      "One line carries the design: a file is metadata plus an ordered list of content-addressed chunks. Deduplication, delta sync, version history and resumable upload are all consequences of it.",
      "Bytes never pass through the API tier. Clients negotiate which chunks are missing, then read and write object storage directly through pre-signed URLs.",
      "Sync is a monotonic journal plus a per-device cursor, with notifications that carry no data — restartable, idempotent, and correct after a month offline.",
      "Conflicts are resolved by keeping both versions, because for opaque formats there is no correct merge and silent loss is unforgivable. Real-time co-editing is a different system.",
      "Permissions are inherited grants evaluated by walking ancestry, with groups as the indirection that makes organisation-wide sharing possible at all.",
      "With more time: cross-region replication and residency, the confirmation-of-file mitigation in detail, and erasure coding for the cold tier.",
    ],
    followUps: [
      {
        q: "A user uploads a 50 GB file on hotel wifi that drops every few minutes. What happens?",
        a: "The client splits it into roughly 12,500 four-megabyte chunks, hashes them, and asks the server which ones it needs — on a retry after a drop, that list is only the chunks not yet stored, so progress is never lost. Each chunk goes directly to object storage as an idempotent PUT keyed by its content hash, so a chunk that was half-sent is simply re-sent and a duplicate is harmless. Nothing is visible to other devices until the final commit, so the file never appears in a truncated state. The only genuinely new requirement for a file this large is that the upload session and its chunk list must outlive a client restart, which means persisting that state locally.",
      },
      {
        q: "Two laptops edit the same spreadsheet while offline, then both come online. Walk me through it.",
        a: "Each client commits based on the version it last saw. The first to arrive commits cleanly and moves the file to version 8. The second arrives claiming a parent version of 7, the server sees the file is already at 8, and that mismatch is the conflict — detected structurally rather than by comparing clocks. Because the format is opaque, there is no safe merge, so the server keeps both: version 8 stays canonical and the second edit becomes a conflicted copy attributed to that user, which then syncs to everyone as an ordinary new file. If the two clients happened to produce byte-identical content, the chunk hashes match and I would treat that as no conflict at all rather than creating a pointless duplicate.",
      },
      {
        q: "How does a device learn about a change without polling?",
        a: "It holds a long poll or WebSocket against the notification service, which knows only which namespaces the device cares about and its current cursor. When the journal for that namespace advances, the service returns — carrying no file data, just the fact that the cursor is stale — and the client then calls the changes endpoint to fetch and apply everything after its position. Keeping data out of the notification is what makes it cheap and safe to drop: a lost notification costs at most one fallback polling interval, and the cursor remains the source of truth. The cost of this design is holding tens of millions of idle connections, which drives connection-oriented load balancing and a fallback to periodic polling when the channel cannot be established.",
      },
      {
        q: "Someone shares a folder with 50,000 people. What breaks?",
        a: "A materialised permission model breaks immediately — a row per user per file across a large tree is hundreds of millions of rows, and a single move rewrites all of them. So the grant is stored once against the folder, ideally against a group rather than 50,000 individuals, and access is evaluated by walking from the file up to the root collecting grants and resolving group membership. That walk is cached per user and file with a short TTL, invalidated on any ACL change in the subtree. The remaining sharp edge is revocation: the cache must be invalidated immediately and any outstanding pre-signed download URLs must be short-lived, or a removed user keeps access until they expire.",
      },
      {
        q: "When is it safe to actually delete a chunk's bytes?",
        a: "Only when no version anywhere references it, and even then not immediately. Chunks are shared across versions, files and — with global dedup — users, so deleting a file decrements references rather than deleting bytes. I would let the count reach zero, wait a grace period of about a week, and then delete, with a periodic mark-and-sweep against the version table as a backstop because counters drift and an undercount is catastrophic while an overcount merely wastes storage. The awkward case is a legal deletion request for content that is byte-identical to another user's file: the honest answer is that you remove that user's reference and their access, not the shared bytes.",
      },
    ],
    related: [
      "/examples/object-storage",
      "/examples/google-docs",
      "/hld/consistency",
      "/hld/replication",
      "/lld/command",
    ],
    furtherReading: [
      {
        label: "algomaster — design Google Drive / Dropbox",
        href: "https://algomaster.io/learn/system-design-interviews/design-dropbox",
      },
      {
        label: "Dropbox engineering — rewriting the sync engine",
        href: "https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine",
      },
    ],
  },
];
