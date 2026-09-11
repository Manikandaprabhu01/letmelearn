import type { DesignExample } from "@/data/types";

const list = "https://github.com/ashishps1/awesome-system-design-resources";

export const storageDeepExamples: DesignExample[] = [
  {
    slug: "object-storage",
    title: "Design S3-like Object Storage",
    source: "Volume 2",
    chapter: 9,
    difficulty: "advanced",
    minutes: 24,
    tags: ["s3", "storage", "erasure coding", "durability", "immutability"],
    companies: ["Amazon S3", "Google Cloud Storage", "Azure Blob", "MinIO"],
    summary:
      "Eleven nines of durability is the requirement that shapes everything, and it is not achieved by being careful — it is achieved by erasure coding across failure domains plus continuous background verification, because disks fail constantly and silently corrupt data even more quietly. The other load-bearing decision is immutability: objects are replaced, never edited, which removes concurrent-write conflicts entirely and makes every other problem tractable.",
    clarifying: [
      {
        q: "Are objects mutable?",
        a: "No — a write replaces the whole object. That single constraint eliminates partial-write conflicts, makes every upload idempotent and retryable, and is why this is fundamentally easier than a filesystem despite storing far more data.",
      },
      {
        q: "What consistency guarantee do we offer?",
        a: "Read-after-write for new objects, and strong consistency for overwrites is the modern expectation. Eventual consistency on overwrite was the historical answer and caused enormous confusion, so I would design for strong read-after-write and be explicit about what that costs on the metadata path.",
      },
      {
        q: "What object sizes?",
        a: "Kilobytes to terabytes, which means two different paths: small objects need packing so they do not waste a disk block each, while large ones need multipart upload with resumability.",
      },
      {
        q: "Is this a flat namespace or a real filesystem?",
        a: "Flat — bucket plus key, where slashes in the key are a display convention rather than directories. That avoids the rename and directory-locking problems that make distributed filesystems hard.",
      },
      {
        q: "What durability and availability are we promising?",
        a: "Eleven nines of durability, four nines of availability. Those are different properties with different mechanisms, and conflating them is a common mistake — data can be perfectly safe and temporarily unreachable.",
      },
    ],
    requirements: {
      functional: [
        "PUT, GET and DELETE objects in buckets, addressed by key",
        "Multipart upload for very large objects, resumable after failure",
        "Object versioning, with lifecycle transitions to colder tiers",
        "Pre-signed URLs so clients read and write directly",
      ],
      nonFunctional: [
        "Eleven nines of durability — data loss is effectively unacceptable",
        "Read-after-write consistency",
        "Throughput scales with the number of storage nodes",
        "Silent corruption must be detected and repaired without operator involvement",
      ],
    },
    math: [
      {
        label: "Replication cost",
        expr: "3 full copies",
        result: "200% storage overhead",
        note: "Simple and fast to reconstruct, but you pay three times for every byte.",
      },
      {
        label: "Erasure coding cost",
        expr: "10 data + 4 parity shards",
        result: "40% overhead, survives 4 losses",
        note: "Better durability than triple replication at a fraction of the cost. This is why large stores use it.",
      },
      {
        label: "Annual disk failure",
        expr: "~1–2% AFR × 100,000 disks",
        result: "≈ 1,000–2,000 failures/year",
        note: "Several every day. Failure is the steady state, not an incident.",
      },
      {
        label: "Silent corruption",
        expr: "~1 unrecoverable read error per 10¹⁴–10¹⁵ bits",
        result: "certain at petabyte scale",
        note: "Which is why every read is checksummed and a scrubber walks the disks continuously.",
      },
      {
        label: "Small-object overhead",
        expr: "1 KB object in a 4 KB block",
        result: "75% wasted",
        note: "Billions of small objects make packing them into larger containers essential.",
      },
    ],
    apis: [
      {
        method: "PUT",
        path: "/{bucket}/{key}",
        desc: "Write an object — whole-object replacement; returns a version id",
      },
      {
        method: "GET",
        path: "/{bucket}/{key}",
        desc: "Read; supports byte ranges so a client fetches part of a large object",
      },
      {
        method: "POST",
        path: "/{bucket}/{key}?uploads",
        desc: "Begin a multipart upload for large objects",
      },
      {
        method: "PUT",
        path: "/{bucket}/{key}?partNumber={n}&uploadId={}",
        desc: "Upload one part — independently retryable, order-independent",
      },
      {
        method: "POST",
        path: "/{bucket}/{key}?uploadId={}",
        desc: "Complete — the atomic commit that makes the object visible",
      },
      {
        method: "GET",
        path: "/{bucket}?prefix={}&continuation-token={}",
        desc: "List by prefix — the one operation the flat namespace makes awkward",
      },
    ],
    dataModel: [
      {
        entity: "buckets",
        fields: [
          "bucket_name (pk, globally unique)",
          "owner_id, region",
          "versioning_enabled, lifecycle_rules",
          "default_encryption",
        ],
      },
      {
        entity: "objects",
        fields: [
          "bucket, key, version_id (pk)",
          "size, etag (content hash)",
          "storage_class, created_at",
          "placement_group_id (fk)",
          "is_delete_marker (bool)",
          "→ sharded by hash(bucket, key)",
        ],
      },
      {
        entity: "placement",
        fields: [
          "placement_group_id (pk)",
          "shard_locations[] (node, disk, offset)",
          "coding_scheme (3x-replica | 10+4-ec)",
          "→ where the bytes physically are",
        ],
      },
      {
        entity: "multipart_uploads",
        fields: [
          "upload_id (pk)",
          "bucket, key, initiated_at",
          "parts[] (number, etag, size)",
          "→ discarded by lifecycle if never completed",
        ],
      },
    ],
    architecture: [
      {
        heading: "Metadata and data scale differently",
        lede: "The same split as Google Drive, for the same reason, at a larger magnitude.",
        diagram: {
          kind: "system",
          caption: "A few kilobytes of metadata decide where many terabytes live.",
          columns: [
            {
              title: "Front",
              nodes: [
                { id: "api", label: "HTTP frontends", sub: "auth, presign, range" },
                { id: "rt", label: "Router", sub: "hash(bucket,key) → shard" },
              ],
            },
            {
              title: "Metadata",
              nodes: [
                { id: "idx", label: "Object index", sub: "sharded KV", tone: "accent" },
                { id: "ver", label: "Version chain", sub: "newest first" },
                { id: "plc", label: "Placement", sub: "shard → node/disk" },
              ],
            },
            {
              title: "Data",
              nodes: [
                { id: "ec", label: "EC encoder", sub: "10 data + 4 parity" },
                { id: "nodes", label: "Storage nodes", sub: "spread across racks", tone: "ok" },
                { id: "scrub", label: "Scrubber", sub: "continuous verification" },
              ],
            },
          ],
        },
        bullets: [
          "Metadata is small, hot and needs strong consistency; data is enormous, cold and needs durability. Storing them in one system forces a compromise that suits neither.",
          "Because objects are immutable, a write creates a new version and the metadata update is what makes it visible. That single atomic pointer swap is where read-after-write consistency comes from.",
          "Shard metadata by a hash of bucket and key, so a single hot bucket does not concentrate on one shard — though it does make prefix listing harder, which is the trade.",
          "Clients read and write bytes directly against storage nodes using a pre-signed capability, so the frontends never proxy the payload.",
        ],
        callout: {
          kind: "insight",
          text: "Immutability is doing an enormous amount of work here. There is no partial write, no read-modify-write race, no locking, and any failed operation can simply be retried because writing the same bytes twice produces the same result. Most of the difficulty in distributed filesystems comes from mutation, and object storage deletes that entire category of problem by refusing to offer it.",
        },
      },
      {
        heading: "Durability: erasure coding, not more copies",
        lede: "Eleven nines is an arithmetic result, not a promise.",
        diagram: {
          kind: "compare",
          caption: "Same durability target, very different economics.",
          options: [
            {
              title: "Triple replication",
              sub: "three whole copies on three nodes",
              good: [
                "Reads served from any copy — trivially fast",
                "Reconstruction is a straight byte copy",
                "Simple to reason about and to operate",
              ],
              bad: [
                "200% storage overhead",
                "A large object costs three times its size in network on write",
              ],
              verdict: "Right for hot, small, latency-sensitive objects.",
            },
            {
              title: "Erasure coding (10+4)",
              sub: "split into 10, compute 4 parity shards",
              tone: "ok",
              good: [
                "40% overhead instead of 200%",
                "Survives any 4 simultaneous losses — better than 3 copies",
                "Shards spread across racks and rooms",
              ],
              bad: [
                "A read touches 10 nodes; one slow node delays it",
                "Reconstruction is CPU-intensive and reads 10 shards to rebuild 1",
              ],
              verdict: "The default for anything large or cold, which is most of the data.",
            },
          ],
        },
        code: {
          title: "Reads survive missing shards, and that is the point",
          lang: "ts",
          source: `// Reed-Solomon 10+4: any 10 of the 14 shards reconstruct the object. That is
// strictly stronger than 3 replicas (which tolerate 2 losses) at a fifth of
// the overhead.
async function readObject(placement: Placement): Promise<Buffer> {
  // Request MORE than the minimum and take the first to arrive. A slow disk
  // is far more common than a dead one, and waiting for a straggler is the
  // main source of tail latency in these systems.
  const shards = await raceForQuorum(placement.shards, { need: 10, request: 12 });

  if (shards.every((s) => s.isData)) return concat(shards);   // fast path, no maths

  // Otherwise reconstruct the missing data shards from parity.
  return reedSolomon.reconstruct(shards, { dataShards: 10, parityShards: 4 });
}

// Placement must spread shards across FAILURE DOMAINS, not just across nodes.
// 14 shards on 14 machines in one rack is one power failure away from loss;
// the arithmetic assumes failures are independent, and same-rack failures
// are not.
function placeShards(nodes: Node[], count: number) {
  return pickSpreadAcross(nodes, count, ["room", "rack", "host"]);
}`,
        },
        bullets: [
          "The durability arithmetic assumes independent failures, so correlated failure is the real enemy: same rack, same power feed, same firmware batch, same operator running the same command everywhere.",
          "Reading more shards than strictly needed and taking the fastest hides slow disks, which matter more in practice than dead ones because a dead disk is detected while a slow one just degrades everything.",
          "Reconstruction is expensive — rebuilding one shard reads ten — so repair is rate-limited to avoid a failed disk causing a rebuild storm that degrades live traffic.",
          "Small objects are packed into larger containers before coding, because coding a 1 KB object into fourteen shards produces fourteen tiny fragments and enormous per-shard overhead.",
        ],
      },
    ],
    deepDives: [
      {
        heading: "Detecting corruption nobody reported",
        lede: "Disks return wrong bytes without an error. At this scale that is a certainty.",
        table: {
          caption: "Layered verification — each catches what the others miss.",
          headers: ["Mechanism", "Catches", "When"],
          rows: [
            ["Checksum per shard on write", "Corruption in transit or at write", "Immediately"],
            [
              "Verify checksum on every read",
              "Bit rot on that shard",
              "On access — only for data people read",
            ],
            [
              "Background scrubber",
              "Rot on cold data nobody reads",
              "Continuously, weeks per full pass",
            ],
            [
              "Cross-shard parity check",
              "A shard that is internally consistent but wrong",
              "During scrub",
            ],
            [
              "End-to-end object hash",
              "Bugs in our own pipeline",
              "On read, against the stored etag",
            ],
          ],
        },
        bullets: [
          "The scrubber is the only thing protecting cold data. An object written once and read in three years will silently rot without it, and by then every copy may be affected.",
          "Checksums must be verified end to end, not just at the disk layer, because the failure being guarded against includes bugs in your own code paths as much as hardware.",
          "On detecting a bad shard, repair from parity and rewrite it — and record it, because a disk producing repeated errors should be drained rather than continuously repaired.",
          "Availability and durability are separate: a node being down means shards are temporarily unreachable but not lost, and the repair decision should distinguish a reboot from a genuinely failed disk before triggering an expensive rebuild.",
        ],
        callout: {
          kind: "warn",
          title: "The dangerous window is during repair",
          text: "When a disk fails, the affected placement groups are running with reduced redundancy until rebuilt — and rebuilds take hours because they are deliberately rate-limited. A second failure in the same group during that window is how data is actually lost, which is why the coding scheme carries more parity than the expected failure rate suggests and why spreading shards across failure domains matters more than the raw shard count.",
        },
      },
      {
        heading: "Multipart upload and atomic visibility",
        body: [
          "A terabyte upload over an imperfect network cannot be a single request. Multipart splits it into independently retryable parts and — crucially — makes the object visible only at completion.",
        ],
        diagram: {
          kind: "sequence",
          caption: "Parts accumulate invisibly; one commit makes the object exist.",
          actors: [
            { id: "c", label: "Client" },
            { id: "api", label: "API" },
            { id: "md", label: "Metadata" },
            { id: "st", label: "Storage nodes" },
          ],
          messages: [
            { from: "c", to: "api", label: "1. initiate multipart", kind: "call" },
            { from: "api", to: "c", label: "2. uploadId", kind: "return" },
            {
              from: "c",
              to: "st",
              label: "3. PUT parts 1..N, in parallel, retryable",
              kind: "call",
              tone: "accent",
            },
            { from: "st", to: "c", label: "4. etag per part", kind: "return" },
            { from: "c", to: "api", label: "5. complete {uploadId, part etags}", kind: "call" },
            {
              from: "api",
              to: "md",
              label: "6. verify all parts, write object version",
              kind: "call",
              tone: "ok",
            },
            {
              from: "md",
              to: "c",
              label: "7. object now visible — atomically",
              kind: "return",
              tone: "ok",
            },
          ],
        },
        bullets: [
          "Nothing is visible until completion, so a client that dies at 90% leaves no partial object — just orphaned parts that a lifecycle rule cleans up after a few days.",
          "Parts are independently retryable and can upload in parallel, which is what makes terabyte uploads practical over ordinary connections.",
          "The completion step verifies every part is present and its checksum matches before writing the metadata pointer, so the atomic commit is also the integrity gate.",
          "Abandoned multipart uploads are a real and commonly overlooked cost — they consume storage indefinitely unless expired explicitly.",
        ],
      },
      {
        heading: "Listing, versioning and deletion",
        body: [
          "The flat namespace makes writes and reads easy and makes listing awkward, because the natural sharding for point lookups is the wrong sharding for prefix scans.",
        ],
        bullets: [
          "Hash sharding by key spreads load evenly but scatters a prefix across every shard, so listing becomes a scatter-gather merge. Range sharding would make listing local but reintroduces hotspots on sequentially-named keys.",
          "A separate index ordered by key per bucket is the usual resolution — a read model maintained asynchronously, which is why listings are eventually consistent even when object reads are strongly consistent.",
          "Deletion with versioning enabled writes a delete marker rather than removing anything, so the object stops appearing in listings while remaining recoverable — and space is reclaimed only by lifecycle expiry.",
          "Lifecycle transitions to colder tiers are where most storage cost is saved. Data older than some threshold moves to slower media, accepting retrieval latency in exchange for a large reduction in price per byte.",
        ],
      },
      {
        heading: "The things that actually go wrong",
        body: [
          "At this scale, the interesting failures are not single-disk failures — those are routine and automated. They are the correlated and systemic ones.",
        ],
        table: {
          caption: "Failure classes and the defence that actually matters.",
          headers: ["Failure", "Why it is dangerous", "Defence"],
          rows: [
            [
              "Rack or room loss",
              "Takes many shards of the same group at once",
              "Placement across failure domains",
            ],
            [
              "Correlated disk batch failure",
              "Same model and age fail together",
              "Mix vendors and ages within a group",
            ],
            [
              "Rebuild storm",
              "Many failures at once saturate the network",
              "Rate-limit repair; prioritise degraded groups",
            ],
            [
              "Metadata shard loss",
              "Data is intact but unreachable",
              "Replicate metadata with consensus",
            ],
            [
              "Operator error applied fleet-wide",
              "Bypasses every redundancy mechanism",
              "Staged rollout, and versioning to recover",
            ],
          ],
        },
        bullets: [
          "Metadata is the single point of failure that people forget: the bytes can be perfectly safe while being completely unfindable, so the object index needs consensus replication of its own.",
          "Versioning is what protects against the failure mode redundancy cannot address — a user or a script deleting or overwriting something they should not have.",
          "Mixing disk vendors and manufacturing batches within a placement group is an unglamorous but genuinely effective defence against correlated failure.",
          "Every automated repair mechanism needs a rate limit and a kill switch, because a repair system reacting to a large correlated failure can do more damage than the failure itself.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Erasure coding",
        pickWhen: "Large or cold objects — most of the data",
        cost: "Reads touch many nodes; reconstruction is CPU and network heavy",
      },
      {
        choice: "Triple replication",
        pickWhen: "Small, hot, latency-sensitive objects",
        cost: "200% storage overhead",
      },
      {
        choice: "Immutable objects",
        pickWhen: "Always — this is the defining constraint",
        cost: "No partial update; changing one byte rewrites the object",
      },
      {
        choice: "Hash-sharded metadata",
        pickWhen: "Even load and no hot shards",
        cost: "Prefix listing becomes a scatter-gather over a separate index",
      },
      {
        choice: "Packing small objects",
        pickWhen: "Billions of small objects",
        cost: "Deletion leaves holes; containers need compaction",
      },
      {
        choice: "Versioning on by default",
        pickWhen: "Protecting against user and script error",
        cost: "Storage grows unless lifecycle rules expire old versions",
      },
    ],
    wrapUp: [
      "Immutability is the decision everything rests on: whole-object replacement removes partial writes, concurrent-edit conflicts and locking, which is why this scales where a distributed filesystem struggles.",
      "Metadata and bytes are separate systems — small, consistent and hot against enormous, durable and cold — joined by a placement record and an atomic pointer swap that provides read-after-write consistency.",
      "Eleven nines comes from erasure coding across failure domains, not from being careful. Ten data plus four parity beats triple replication on durability at a fifth of the overhead.",
      "The arithmetic assumes independent failures, so correlated failure — rack, power, firmware batch, operator error — is the real risk, and placement across domains matters more than the shard count.",
      "Silent corruption is a certainty at petabyte scale, so checksums are verified end to end on every read and a background scrubber continuously protects cold data nobody is reading.",
      "Multipart upload makes terabyte objects practical, with visibility deferred to an atomic completion step that doubles as the integrity gate.",
    ],
    followUps: [
      {
        q: "Why erasure coding rather than three replicas?",
        a: "Because it gives better durability for far less storage. Three replicas tolerate two simultaneous losses at two hundred percent overhead, whereas a ten-plus-four scheme tolerates four losses at forty percent — strictly stronger protection at roughly a fifth of the cost, which at exabyte scale is the difference between a viable business and an unviable one. The trade is on the read path: reconstructing an object touches ten nodes instead of one, so a single slow disk can delay a read, and rebuilding a lost shard requires reading ten to regenerate one. That is why hot, small, latency-sensitive objects often stay replicated while everything large or cold is coded, and why reads request a couple more shards than the minimum and take the fastest to arrive.",
      },
      {
        q: "A disk returns data that is wrong but does not report an error. How do you notice?",
        a: "By never trusting the disk. Every shard is stored with a checksum computed at write time and verified on every read, so corruption on an object someone actually reads is caught immediately and repaired from parity. The harder case is cold data that nobody reads for years, which is why a background scrubber walks every disk continuously, verifying checksums and cross-checking against parity, taking weeks for a full pass. Without it, rot accumulates silently and can eventually affect enough shards in one group to make an object unrecoverable. I would also verify the object's end-to-end hash rather than only per-shard checksums, because the failure being guarded against includes bugs in our own pipeline, not just hardware.",
      },
      {
        q: "Fourteen shards spread across fourteen machines. Is that eleven nines?",
        a: "Only if those failures are independent, and if the fourteen machines share a rack, a power feed or a network spine, they are not. The durability arithmetic multiplies independent probabilities, so a single correlated event — a rack losing power, a switch failing, a firmware bug in one disk batch, an operator running the same bad command fleet-wide — invalidates the whole calculation at once. That is why placement deliberately spreads shards across rooms, racks and hosts rather than simply across node identifiers, and why mixing disk vendors and manufacturing batches within a placement group is worth the operational nuisance. The number on the slide is a result of the placement policy, not of the coding scheme alone.",
      },
      {
        q: "A client uploads 900 GB of a 1 TB object and then crashes. What is stored?",
        a: "Nothing visible. Multipart upload accumulates parts under an upload identifier, and the object does not exist until the completion call, which verifies that every part is present with a matching checksum and only then writes the metadata pointer that makes it readable. So a crash at ninety percent leaves orphaned parts rather than a truncated object that a reader could mistake for complete. The client can resume by uploading the remaining parts, since each is independently addressable and retryable. The cost worth naming is that abandoned parts consume storage indefinitely unless a lifecycle rule expires incomplete uploads after a few days, and that is a commonly overlooked source of unexplained cost.",
      },
      {
        q: "Why is listing objects by prefix harder than reading one?",
        a: "Because the sharding that makes point lookups fast makes prefix scans slow. Metadata is sharded on a hash of the bucket and key so load spreads evenly and no single hot bucket concentrates on one shard — but that hash deliberately destroys key ordering, so every object under a given prefix is scattered across every shard and a listing becomes a scatter-gather merge. Range sharding by key would make listing local but would reintroduce hotspots, since keys are frequently sequential or timestamped. The usual resolution is a separate per-bucket index ordered by key, maintained asynchronously, which is precisely why listings are typically eventually consistent even in a system that offers strong read-after-write for individual objects.",
      },
    ],
    related: [
      "/examples/google-drive",
      "/examples/youtube",
      "/hld/quorum",
      "/hld/replication",
      "/examples/email-service",
    ],
    furtherReading: [
      {
        label: "AWS S3 — architecture and durability",
        href: "https://aws.amazon.com/s3/",
      },
      {
        label: "Facebook f4 — warm blob storage with erasure coding",
        href: "https://www.usenix.org/system/files/conference/osdi14/osdi14-paper-muralidhar.pdf",
      },
    ],
  },

  {
    slug: "email-service",
    title: "Design a Distributed Email Service",
    source: "Volume 2",
    chapter: 8,
    difficulty: "advanced",
    minutes: 22,
    tags: ["smtp", "storage", "search", "spam", "deliverability"],
    companies: ["Gmail", "Outlook", "Fastmail", "Proton"],
    summary:
      "Email is the one design in the catalogue where you do not control the protocol, the other participants, or whether your messages are even accepted. Half the work is an ordinary storage-and-search problem — enormous but tractable — and the other half is deliverability, spam and the reality that SMTP is a decades-old store-and-forward protocol whose failure modes you must simply absorb. Search over a per-user corpus is the interesting technical core.",
    clarifying: [
      {
        q: "Are we building a mail provider or an internal sending service?",
        a: "A full provider — receiving, storing, searching and sending. A transactional sending service is a much narrower problem dominated entirely by deliverability and reputation, which is worth saying since the two are often conflated.",
      },
      {
        q: "How large is a mailbox and how important is search?",
        a: "Tens of gigabytes and hundreds of thousands of messages for heavy users, and search is the primary way people navigate it. That makes per-user full-text indexing the defining technical requirement rather than an add-on.",
      },
      {
        q: "Do we need real-time delivery notification?",
        a: "Yes — users expect a new message to appear immediately on every device, which means a push channel and a sync protocol, not polling. It is the same cursor-and-notification shape as file sync.",
      },
      {
        q: "What are the consistency requirements?",
        a: "Message content is immutable once received, which is a large simplification. Mutable state is small — read flags, labels, folder membership — and can be eventually consistent across devices provided it converges predictably.",
      },
      {
        q: "How much spam should we expect?",
        a: "The majority of inbound connections. Filtering is not a feature bolted on at the end; it is a pipeline stage that most traffic never gets past, and it changes the capacity calculation completely.",
      },
    ],
    requirements: {
      functional: [
        "Receive mail over SMTP and deliver it into the right mailbox",
        "Send outbound mail with retries and bounce handling",
        "Full-text search across a user's entire mail history",
        "Sync state — read, labels, folders — across many devices",
      ],
      nonFunctional: [
        "Never lose an accepted message",
        "Search across a large mailbox in well under a second",
        "Spam filtered with very few false positives — a lost legitimate email is severe",
        "Maintain sending reputation so outbound mail is actually accepted",
      ],
    },
    math: [
      {
        label: "Inbound volume",
        expr: "100 M users × 100 messages/day ÷ 10⁵",
        result: "≈ 120 K/s accepted",
        note: "Before filtering the connection rate is several times higher — most inbound is rejected at the edge.",
      },
      {
        label: "Storage growth",
        expr: "10 B messages/day × ~75 KB average",
        result: "≈ 750 TB/day",
        note: "Attachments dominate. Deduplicating a message sent to many recipients is a large saving.",
      },
      {
        label: "Deduplication",
        expr: "one message to 500 recipients",
        result: "1 body + 500 references",
        note: "Bodies are immutable and content-addressed, so a mailing list costs one copy rather than five hundred.",
      },
      {
        label: "Index size",
        expr: "~30% of message text size",
        result: "≈ 50–100 GB per million messages",
        note: "Per-user indexes, which is what makes search shardable by user.",
      },
      {
        label: "Spam ratio",
        expr: "typical inbound composition",
        result: "~50–85% rejected or filtered",
        note: "Rejecting at connection time rather than after acceptance is the difference between a large system and an enormous one.",
      },
    ],
    apis: [
      {
        method: "SMTP",
        path: "MX :25 (inbound)",
        desc: "Receive — reject as early as possible; accepting means taking responsibility",
      },
      {
        method: "GET",
        path: "/v1/messages?label={}&cursor={}",
        desc: "List a mailbox view — cursor-based, never offset",
      },
      {
        method: "GET",
        path: "/v1/search?q={}&cursor={}",
        desc: "Full-text search scoped to one user's index",
      },
      {
        method: "POST",
        path: "/v1/messages/send",
        desc: "Queue outbound with retry and bounce handling",
      },
      {
        method: "PATCH",
        path: "/v1/messages/{id}",
        desc: "Mutate flags and labels — the only mutable state",
      },
      {
        method: "GET",
        path: "/v1/changes?cursor={}",
        desc: "Delta sync for devices, with a push channel to say the cursor moved",
      },
    ],
    dataModel: [
      {
        entity: "messages",
        fields: [
          "message_id (pk)",
          "body_hash (fk — content-addressed, deduplicated)",
          "from, to[], subject, received_at",
          "size, has_attachments",
          "→ immutable once written",
        ],
      },
      {
        entity: "bodies",
        fields: [
          "body_hash (pk)",
          "storage_url, size",
          "refcount",
          "→ object storage; one copy per distinct content",
        ],
      },
      {
        entity: "mailbox_entries",
        fields: [
          "user_id, message_id (pk)",
          "labels[], is_read, is_starred",
          "thread_id (idx)",
          "→ the per-user mutable view over an immutable message",
        ],
      },
      {
        entity: "search_index",
        fields: [
          "user_id (shard key)",
          "term → posting list of message ids",
          "→ one index per user; never a global index",
        ],
      },
      {
        entity: "outbound_queue",
        fields: [
          "message_id (pk)",
          "recipient_domain (idx)",
          "attempt_count, next_attempt_at",
          "status (queued|sent|bounced|deferred)",
        ],
      },
    ],
    architecture: [
      {
        heading: "Immutable message, mutable view",
        lede: "Separating these is what makes storage cheap and sync simple.",
        diagram: {
          kind: "er",
          caption: "One body, many recipients, one mutable row each.",
          entities: [
            {
              name: "bodies",
              note: "content-addressed, in object storage",
              fields: [
                { name: "body_hash", type: "sha256", key: "pk" },
                { name: "storage_url", type: "text" },
                { name: "refcount", type: "int", note: "for GC" },
              ],
            },
            {
              name: "messages",
              note: "immutable metadata",
              fields: [
                { name: "message_id", type: "uuid", key: "pk" },
                { name: "body_hash", type: "sha256", key: "fk" },
                { name: "received_at", type: "timestamp", key: "idx" },
              ],
            },
            {
              name: "mailbox_entries",
              note: "the only mutable state",
              fields: [
                { name: "user_id", type: "uuid", key: "pk" },
                { name: "message_id", type: "uuid", key: "pk" },
                { name: "labels", type: "text[]" },
                { name: "is_read", type: "bool" },
              ],
            },
          ],
          relations: [
            { from: "bodies", to: "messages", label: "shared by", cardinality: "1:N" },
            { from: "messages", to: "mailbox_entries", label: "appears in", cardinality: "1:N" },
          ],
        },
        bullets: [
          "A message sent to five hundred recipients stores one body and five hundred small rows, which is the single largest storage saving available in this design.",
          "Because bodies are immutable and content-addressed, attachments deduplicate across completely unrelated users at no extra effort.",
          "All mutable state is confined to the per-user entry — read flags, labels, stars — so sync only ever has to reconcile small, simple records.",
          "Labels rather than folders means a message belongs to many views without being copied, which is both a product decision and a storage one.",
        ],
      },
      {
        heading: "Receiving mail, and rejecting most of it",
        lede: "Every message you accept is one you have promised to deliver or bounce.",
        diagram: {
          kind: "sequence",
          caption: "Reject early; accepting transfers responsibility to you.",
          actors: [
            { id: "s", label: "Sending server" },
            { id: "mx", label: "MX edge" },
            { id: "f", label: "Filter pipeline" },
            { id: "st", label: "Storage + index" },
          ],
          messages: [
            { from: "s", to: "mx", label: "1. connect, EHLO", kind: "call" },
            {
              from: "mx",
              to: "mx",
              label: "2. reputation, rate, greylist → reject cheaply",
              kind: "self",
              tone: "warn",
            },
            { from: "s", to: "mx", label: "3. MAIL FROM / RCPT TO", kind: "call" },
            {
              from: "mx",
              to: "mx",
              label: "4. recipient exists? SPF/DKIM/DMARC",
              kind: "self",
              tone: "accent",
            },
            { from: "s", to: "mx", label: "5. DATA — the message body", kind: "call" },
            {
              from: "mx",
              to: "st",
              label: "6. persist BEFORE acknowledging",
              kind: "call",
              tone: "ok",
            },
            {
              from: "mx",
              to: "s",
              label: "7. 250 OK — now it is our responsibility",
              kind: "return",
              tone: "ok",
            },
            { from: "st", to: "f", label: "8. spam scoring, index, notify", kind: "async" },
          ],
        },
        bullets: [
          "The acknowledgement is a contract. Once you return 250 OK the sending server forgets the message, so durability must be established before that response, not after.",
          "Reject at connection time wherever possible — bad reputation, nonexistent recipient, failed authentication — because that costs a fraction of accepting and filtering later.",
          "Rejecting with a permanent failure is better than accepting and silently discarding. Silent discard means a legitimate sender never learns their message vanished.",
          "Greylisting — temporarily deferring unknown senders — remains effective because real mail servers retry and much bulk spam does not.",
        ],
        callout: {
          kind: "warn",
          title: "False positives are worse than false negatives",
          text: "A spam message in the inbox is an annoyance; a job offer or an invoice silently filtered is a serious failure the user may never discover. That asymmetry should shape the whole filtering design — bias thresholds towards delivery, quarantine rather than delete, make the spam folder visible and searchable, and always allow a sender to be marked as trusted.",
        },
      },
    ],
    deepDives: [
      {
        heading: "Search over a personal corpus",
        lede: "Per-user indexes are what make this tractable, and they are a genuinely different design from web search.",
        table: {
          caption: "Personal search inverts almost every assumption of web search.",
          headers: ["Property", "Web search", "Mail search"],
          rows: [
            ["Corpus", "One shared, enormous", "One small corpus per user"],
            ["Ranking", "Relevance across billions", "Usually recency — people want the latest"],
            ["Index shape", "Global inverted index", "Per-user index, sharded by user"],
            ["Freshness", "Minutes to hours", "Immediate — a message must be findable at once"],
            ["Query volume", "Enormous", "Modest, but always against one user's shard"],
          ],
        },
        bullets: [
          "Sharding the index by user means a query touches exactly one shard, so search is fast regardless of how many users exist — the system scales by adding shards rather than by making the index cleverer.",
          "Index on write, synchronously enough that a just-arrived message is findable. Users notice immediately when a message they can see cannot be searched.",
          "Recency usually beats relevance for ranking, which is a simplification web search does not get: most mail searches are for something recent and specific rather than for the best match.",
          "Index the extracted text of attachments too, which is a substantial pipeline of its own and a common gap in naive designs.",
        ],
      },
      {
        heading: "Sending, and why deliverability is the hard part",
        body: [
          "Outbound mail is the part you control least. Whether your message is accepted depends on the receiving provider's opinion of your sending reputation, which is affected by your users' behaviour as much as by your engineering.",
        ],
        bullets: [
          "Authenticate everything: SPF to declare which servers may send for a domain, DKIM to sign messages cryptographically, and DMARC to state what receivers should do when those fail. Without them, mail is treated with suspicion by default.",
          "Reputation attaches to sending IP addresses and domains, and it is earned slowly and lost quickly. A new address must be warmed up gradually, and one compromised account sending bulk spam can damage delivery for every legitimate user.",
          "Separate the sending pools. Transactional mail, bulk mail and user-to-user mail should not share reputation, because a marketing campaign's complaint rate should not affect password resets.",
          "Handle bounces properly: a hard bounce means stop sending to that address permanently, while a soft bounce should be retried with backoff. Continuing to send to dead addresses is one of the fastest ways to damage reputation.",
        ],
        callout: {
          kind: "insight",
          text: "SMTP has no delivery guarantee and no global coordination — it is store-and-forward between independent parties who may defer, reject or silently drop. Much of the engineering is therefore defensive: durable queues, exponential backoff over days, per-domain rate limiting, and accepting that some messages will never arrive and the honest response is to surface that rather than to pretend.",
        },
      },
      {
        heading: "Sync and threading",
        body: [
          "Devices need the same view, and the shape of the problem is identical to file sync: a monotonic change journal per user, a cursor per device, and a notification channel that carries no data.",
        ],
        bullets: [
          "Only the per-user entries change, so the journal is small and replay is cheap even after a long offline period.",
          "Conflicts are mild and convergent — marking a message read on two devices is idempotent, and label additions and removals converge with last-writer-wins per label rather than per message.",
          "Threading is a client-facing construct built from the message identifier headers plus subject heuristics, and it is genuinely imperfect because senders violate the standards constantly.",
          "The notification channel should say only that the cursor moved, keeping it cheap and making a dropped notification cost at most one polling interval.",
        ],
      },
      {
        heading: "Deletion, retention and the awkward realities",
        body: [
          "Because bodies are shared and immutable, deletion is a reference-counting problem, and it collides with legal requirements that pull in opposite directions.",
        ],
        bullets: [
          "Deleting a message removes the user's entry and decrements the body's reference count; bytes are collected only when no entry references them, after a grace period.",
          "A deduplicated body shared with another user cannot be physically deleted on one user's request, so the defensible answer is removing their reference and their access rather than the shared content.",
          "Retention requirements conflict: some jurisdictions require deletion on request, some regulated customers require preservation for years, and both may apply to the same mailbox. Policy must be per account, not global.",
          "Encryption at rest is straightforward; end-to-end encryption is not, because it breaks server-side search and spam filtering entirely — which is precisely why providers offering it have markedly different search capabilities.",
        ],
      },
    ],
    tradeoffs: [
      {
        choice: "Content-addressed deduplicated bodies",
        pickWhen: "Always — mailing lists and attachments dominate storage",
        cost: "Reference counting, and deletion cannot remove shared content",
      },
      {
        choice: "Per-user search index",
        pickWhen: "Always",
        cost: "Many small indexes to operate rather than one large one",
      },
      {
        choice: "Reject at connection time",
        pickWhen: "Always",
        cost: "Aggressive rejection risks turning away legitimate senders",
      },
      {
        choice: "Bias filtering towards delivery",
        pickWhen: "Always — false positives are far worse",
        cost: "More spam reaches the inbox",
      },
      {
        choice: "Separate sending pools by traffic type",
        pickWhen: "Mixed transactional and bulk sending",
        cost: "More address space and reputation to manage",
      },
      {
        choice: "Labels rather than folders",
        pickWhen: "Messages belong in several views",
        cost: "A conceptual model some users find unfamiliar",
      },
    ],
    wrapUp: [
      "The message is immutable and content-addressed while the per-user entry is the only mutable state, which deduplicates mailing lists and attachments and keeps sync records tiny.",
      "Accepting a message is a promise: durability must be established before returning 250 OK, because the sending server forgets it immediately afterwards.",
      "Most inbound traffic should be rejected at connection time on reputation and authentication, since accepting and filtering later costs far more.",
      "Search is the technical core, and per-user indexes make it tractable — one shard per query, recency-ranked, indexed on write so new mail is immediately findable.",
      "Deliverability is the part you control least: SPF, DKIM and DMARC are mandatory, reputation is earned slowly and lost quickly, and sending pools must be separated by traffic type.",
      "Filtering must be biased towards delivery, because a silently filtered invoice is a far worse failure than a spam message that reaches the inbox.",
    ],
    followUps: [
      {
        q: "A message goes to five hundred recipients. How much do you store?",
        a: "One copy of the body and five hundred small rows. The body is content-addressed by its hash and lives once in object storage, while each recipient gets a mailbox entry holding only their mutable state — read flag, labels, thread membership — and a reference to that body. This is the largest storage saving available in the design, and because the addressing is by content hash it extends further than mailing lists: identical attachments deduplicate across entirely unrelated users automatically. The cost is that deletion becomes reference counting rather than deleting bytes, and that a user asking for their data to be erased can only have their reference and access removed if another user legitimately holds the same content.",
      },
      {
        q: "When is it safe to return 250 OK to a sending server?",
        a: "Only once the message is durably stored, because that response is a contract. SMTP is store-and-forward: the sending server holds the message and retries until it receives an acknowledgement, and the moment you acknowledge, it deletes its copy and considers delivery complete. Acknowledging before persisting means a crash loses a message that nobody will ever retry and the sender believes was delivered. Everything after that point — spam scoring, indexing, notifying devices — can be asynchronous, because those can be retried from the stored message. The corollary is that rejecting is often better than accepting: a permanent rejection tells the sender their message did not arrive, whereas accepting and then silently discarding leaves them believing it did.",
      },
      {
        q: "How do you search a mailbox with 500,000 messages quickly?",
        a: "By indexing per user rather than globally. A personal corpus is small in absolute terms, so a full-text index sharded by user means any query touches exactly one shard and never competes with other users' data — the system scales by adding shards rather than by making a single enormous index cleverer. This inverts most of web search's assumptions: the corpus is tiny, freshness must be immediate rather than minutes behind, and ranking is usually by recency because people are looking for a specific recent message rather than the most relevant document. The index is written synchronously enough that a message visible in the mailbox is immediately findable, since users notice that gap at once, and attachment text is extracted and indexed too.",
      },
      {
        q: "Your legitimate mail is landing in other providers' spam folders. What do you do?",
        a: "Treat it as a reputation problem rather than a bug, because deliverability is decided by the receiving provider's opinion of you. First, verify the authentication basics are correct — SPF listing your sending servers, DKIM signing every message, DMARC published — since failures there make mail suspicious by default. Then look at what is damaging reputation: a compromised account sending bulk spam, continued sending to hard-bounced addresses, or a high complaint rate from one traffic type contaminating everything. That last point argues for separating sending pools so marketing volume cannot affect password-reset delivery. A new sending address also needs warming up gradually rather than starting at full volume, and reputation recovers far more slowly than it degrades.",
      },
      {
        q: "Why is filtering biased towards letting spam through?",
        a: "Because the two errors have wildly unequal costs. A spam message in the inbox is a few seconds of irritation that the user notices and can act on. A legitimate message that is silently filtered — a job offer, an invoice, a medical result — may never be discovered at all, and the user's recourse is to not know anything went wrong. So thresholds are set conservatively, suspected spam is quarantined in a visible and searchable folder rather than deleted, and users can always mark a sender as trusted to bypass filtering permanently. It is also why rejecting at connection time is preferable to accepting and filtering: a rejection at least produces a bounce that tells the sender their message did not arrive.",
      },
    ],
    related: [
      "/examples/object-storage",
      "/examples/notification",
      "/examples/google-search",
      "/hld/bloom-filters",
      "/examples/google-drive",
    ],
    furtherReading: [
      {
        label: "SMTP — the protocol",
        href: "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol",
      },
      {
        label: "DMARC — authentication and policy",
        href: "https://dmarc.org/overview/",
      },
    ],
  },

  {
    slug: "job-scheduler",
    title: "Design a Distributed Job Scheduler",
    source: "Source 6",
    difficulty: "intermediate",
    minutes: 20,
    tags: ["cron", "leases", "queues", "idempotency", "at-least-once"],
    companies: ["Airflow", "Quartz", "Kubernetes CronJob", "Sidekiq", "Temporal"],
    summary:
      "A schedule table, a dispatcher and a worker pool — and three details that separate a working scheduler from one that quietly breaks production: every job runs at least once and sometimes twice, so jobs must be idempotent; thousands of schedules set to midnight all fire simultaneously unless you spread them; and a worker that dies holding a job must have it reclaimed without another worker duplicating it in the meantime.",
    clarifying: [
      {
        q: "Recurring schedules, one-off delayed jobs, or both?",
        a: "Both, and they unify nicely: a recurring schedule is a generator of one-off executions. Keeping the schedule definition separate from the individual run is what makes history, retries and backfills coherent.",
      },
      {
        q: "Exactly-once or at-least-once execution?",
        a: "At-least-once, and I would push back on any requirement for exactly-once. A worker can complete a job and die before recording it, and no protocol closes that gap — so the honest design makes jobs idempotent rather than promising something unachievable.",
      },
      {
        q: "How precise must the timing be?",
        a: "Seconds, not milliseconds. That tolerance allows polling for due jobs rather than maintaining precise timers, which is far simpler and far more robust to restarts.",
      },
      {
        q: "Do jobs have dependencies?",
        a: "I would scope to independent jobs and note where a dependency graph fits. Directed-acyclic-graph orchestration is a substantially larger problem — that is the difference between a scheduler and a workflow engine.",
      },
      {
        q: "What happens if the scheduler is down when a job was due?",
        a: "A policy decision that must be explicit: catch up and run the missed executions, or skip them. For a report, catching up is right; for something sending notifications, running twelve missed hourly jobs at once is a disaster.",
      },
    ],
    requirements: {
      functional: [
        "Register recurring schedules and one-off delayed jobs",
        "Dispatch due jobs to a worker pool reliably",
        "Retry failures with backoff and a bounded attempt count",
        "Show execution history, status and logs per job",
      ],
      nonFunctional: [
        "A due job always runs — at least once",
        "A worker crash must not lose or permanently strand a job",
        "Scheduling precision within seconds",
        "A large burst of simultaneous schedules must not overwhelm workers or downstream systems",
      ],
    },
    math: [
      {
        label: "Schedule volume",
        expr: "1 M schedules, most hourly or daily",
        result: "≈ 500–2,000 executions/s average",
        note: "Modest on average, and that average is deeply misleading.",
      },
      {
        label: "The midnight spike",
        expr: "~30% of daily schedules set to 00:00",
        result: "≈ 300 K jobs in one second",
        note: "The defining problem. Humans write cron expressions at round numbers.",
      },
      {
        label: "Polling cost",
        expr: "index on next_run_at, poll every second",
        result: "one range scan per dispatcher",
        note: "Cheap and restart-safe, which is why polling beats in-memory timers here.",
      },
      {
        label: "Lease duration",
        expr: "> p99 job duration + heartbeat slack",
        result: "typically 30–300 s, renewed",
        note: "Too short reclaims live jobs and duplicates them; too long strands work after a crash.",
      },
      {
        label: "Retry backoff",
        expr: "2ⁿ seconds with jitter, 6 attempts",
        result: "~1 s → ~1 min over ~2 min",
        note: "Jitter matters — without it, a downstream outage produces synchronised retry waves.",
      },
    ],
    apis: [
      {
        method: "POST",
        path: "/v1/schedules",
        desc: "Create a recurring schedule — cron expression, payload, timezone, catch-up policy",
      },
      {
        method: "POST",
        path: "/v1/jobs",
        desc: "One-off job, optionally delayed; idempotent on a client key",
      },
      {
        method: "POST",
        path: "/v1/jobs/{id}/claim",
        desc: "Worker claims with a lease — conditional, so only one worker wins",
      },
      {
        method: "POST",
        path: "/v1/jobs/{id}/heartbeat",
        desc: "Extend the lease while work continues",
      },
      {
        method: "POST",
        path: "/v1/jobs/{id}/complete",
        desc: "Report success or failure; failure schedules the next attempt",
      },
      {
        method: "GET",
        path: "/v1/schedules/{id}/runs",
        desc: "Execution history — essential for debugging and for trust",
      },
    ],
    dataModel: [
      {
        entity: "schedules",
        fields: [
          "schedule_id (pk)",
          "cron_expr, timezone",
          "payload, target",
          "next_run_at (idx — the hot index)",
          "enabled, catch_up_policy",
        ],
      },
      {
        entity: "job_runs",
        fields: [
          "run_id (pk)",
          "schedule_id (fk, nullable for one-offs)",
          "scheduled_for, started_at, finished_at",
          "state (pending|claimed|running|succeeded|failed|dead)",
          "attempt (int)",
          "idempotency_key (unique)",
        ],
      },
      {
        entity: "leases",
        fields: [
          "run_id (pk)",
          "worker_id",
          "expires_at (idx)",
          "→ expiry is what makes a crashed worker's job reclaimable",
        ],
      },
      {
        entity: "dead_letter",
        fields: [
          "run_id (pk)",
          "last_error, attempts",
          "→ jobs that exhausted retries; needs a human queue, not silence",
        ],
      },
    ],
    architecture: [
      {
        heading: "Schedule, run, lease",
        lede: "Three tables, and the separation between them is the design.",
        diagram: {
          kind: "flow",
          caption: "A schedule generates runs; a run is claimed under a lease.",
          rows: [
            [
              { id: "s", label: "Schedule", sub: "cron + next_run_at", tone: "accent" },
              { id: "d", label: "Dispatcher", sub: "polls for due" },
              { id: "r", label: "Job run", sub: "one execution attempt" },
            ],
            [
              { id: "q", label: "Work queue", sub: "by priority / tenant" },
              { id: "w", label: "Worker", sub: "claims with a lease" },
              { id: "done", label: "Complete", sub: "or retry with backoff", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "Separating the schedule from its runs is what makes history, retries, backfills and manual re-runs all expressible — a schedule is a definition, a run is a fact.",
          "Dispatchers poll an index on the next due time rather than holding in-memory timers, so a restart loses nothing and adding dispatchers requires no coordination.",
          "Multiple dispatchers can poll safely because claiming is a conditional update — whoever updates the row first owns it and the others see zero rows affected.",
          "Advance the schedule's next run time when the run is created, not when it completes, or a long-running job delays its own next occurrence.",
        ],
      },
      {
        heading: "Claiming without duplicating",
        lede: "The same conditional-update pattern as inventory, applied to work.",
        code: {
          title: "Claim, lease, heartbeat, reclaim",
          lang: "ts",
          source: `// Claiming is a conditional update, so several dispatchers or workers can
// race safely — exactly one changes the row.
async function claim(workerId: string, batchSize = 10) {
  return db.raw(
    \`UPDATE job_runs
        SET state = 'claimed', worker_id = $1, lease_expires_at = now() + interval '60 seconds'
      WHERE run_id IN (
        SELECT run_id FROM job_runs
         WHERE state = 'pending' AND scheduled_for <= now()
            -- Reclaim jobs whose worker died: the lease, not a health check,
            -- is what makes a crashed worker's job available again.
            OR (state = 'claimed' AND lease_expires_at < now())
         ORDER BY scheduled_for
         LIMIT $2
         FOR UPDATE SKIP LOCKED)     -- workers do not queue behind each other
    RETURNING *\`,
    [workerId, batchSize],
  );
}

// The worker renews while it works. If renewal FAILS, it must stop — another
// worker may already have reclaimed the job, and continuing means two copies
// running at once.
async function run(job: JobRun) {
  const lease = startHeartbeat(job, { everyMs: 20_000 });
  try {
    if (!lease.valid()) throw new LeaseLost();
    await execute(job);       // must be idempotent: this may be the second run
  } finally {
    lease.stop();
  }
}`,
        },
        bullets: [
          "Skipping locked rows is what lets many workers claim concurrently without blocking each other — without it, workers serialise behind one another on the same hot rows.",
          "Lease expiry rather than health checking is the reclaim mechanism, for the same reason as distributed locking: a crashed process and a paused one look identical from outside.",
          "A worker whose lease renewal fails must stop immediately. It is now potentially a duplicate, and continuing is exactly the scenario idempotency has to absorb.",
          "Claiming in small batches amortises the round trip without a worker hoarding jobs it will not reach before the lease expires.",
        ],
        callout: {
          kind: "interview",
          title: "Say this plainly",
          text: '"Execution is at-least-once, not exactly-once. A worker can finish a job and crash before recording completion, and no protocol closes that window — so the job runs again. The correct response is to require idempotent jobs and give every run a stable identifier the job can deduplicate on, rather than claiming a guarantee the system cannot provide."',
        },
      },
    ],
    deepDives: [
      {
        heading: "The midnight problem",
        lede: "Humans write cron expressions at round numbers, and the load arrives all at once.",
        diagram: {
          kind: "compare",
          caption: "Same jobs, same day, completely different load profile.",
          options: [
            {
              title: "Honour the schedule exactly",
              sub: "everything at 00:00:00 fires at 00:00:00",
              good: ["Predictable and exactly what the user asked for"],
              bad: [
                "Hundreds of thousands of jobs in one second",
                "Workers saturate and downstream systems are hammered simultaneously",
                "The jobs that matter queue behind a flood of trivial ones",
              ],
              verdict: "Fine at small scale; a self-inflicted outage at large scale.",
            },
            {
              title: "Deterministic jitter",
              sub: "spread within a window, consistently per schedule",
              tone: "ok",
              good: [
                "Load spread smoothly across a window",
                "Deterministic, so each schedule runs at the same offset daily",
                "Invisible to users when the window is small",
              ],
              bad: [
                "Not the exact requested second",
                "Needs explaining for genuinely time-critical jobs",
              ],
              verdict:
                "The right default — jitter derived from the schedule id, not random per run.",
            },
          ],
        },
        bullets: [
          "Derive the offset from a hash of the schedule identifier so it is stable: a job that runs at 00:03:17 should run at 00:03:17 every day, not at a random time each night.",
          "Rate-limit dispatch as well as spreading schedules, so a backlog after an outage drains at a controlled rate instead of arriving as one enormous burst.",
          "Give jobs priorities or separate queues per tenant, or one customer's ten thousand trivial jobs delay everyone else's important ones.",
          "The same spreading logic applies to retries. Without jitter, a downstream outage causes every failed job to retry in perfect synchrony, repeatedly.",
        ],
      },
      {
        heading: "Retries, failure and the dead letter",
        body: [
          "Most jobs that fail will succeed on retry, and a small number never will. Distinguishing those two cases — and not silently losing the second — is where schedulers commonly disappoint.",
        ],
        table: {
          caption: "Failure handling that operators can actually live with.",
          headers: ["Case", "Behaviour", "Rationale"],
          rows: [
            [
              "Transient error",
              "Exponential backoff with jitter, bounded attempts",
              "Most failures are transient",
            ],
            [
              "Permanent error",
              "Fail fast to the dead letter",
              "Retrying a malformed payload six times helps nobody",
            ],
            [
              "Lease expiry mid-run",
              "Another worker reclaims",
              "Counts as an attempt; the job must be idempotent",
            ],
            [
              "Exhausted retries",
              "Dead letter plus an alert",
              "Silence here is how work disappears unnoticed",
            ],
            [
              "Job runs far too long",
              "Kill at a timeout and treat as failure",
              "An unbounded job holds a worker forever",
            ],
          ],
        },
        bullets: [
          "Every job needs a maximum duration. Without one, a hung job holds a worker slot indefinitely and the only symptom is gradually declining throughput.",
          "The dead-letter queue needs a human owner and an alert. A dead letter nobody watches is identical to dropping the work, just with more machinery.",
          "Distinguish job failure from infrastructure failure in the metrics, because they need completely different responses and blend into one unhelpful error rate otherwise.",
          "Make re-running from history a first-class operation. After fixing a bug, the natural next question is always how to re-run everything that failed.",
        ],
      },
      {
        heading: "Time is harder than it looks",
        body: [
          "Scheduling is a timezone problem wearing a distributed-systems costume, and the awkward cases are entirely predictable but rarely handled.",
        ],
        bullets: [
          "Store the timezone with the schedule, not just a UTC time. A user asking for 09:00 local means nine in the morning after the clocks change, not eight.",
          "Daylight saving creates two genuinely ambiguous cases each year: a time that occurs twice, and a time that does not occur at all. Both need a stated policy rather than whatever the date library happens to do.",
          "Catch-up policy after downtime must be explicit per schedule. Running twelve missed hourly notification jobs the moment the system recovers is worse than skipping them.",
          "Never rely on synchronised clocks between dispatchers and workers. The database's clock should be the single reference for what is due and when a lease has expired.",
        ],
        callout: {
          kind: "warn",
          title: "Catch-up is a bigger decision than it appears",
          text: "After a four-hour outage, should a daily report job run once or not at all? Should an hourly one run four times, immediately? Should a job sending customer emails run at all? These have different right answers, which is why catch-up has to be a per-schedule policy — and why the default should probably be to skip and record, since surprising people with a flood of stale executions is the more damaging error.",
        },
      },
    ],
    tradeoffs: [
      {
        choice: "Polling for due jobs",
        pickWhen: "Second-level precision is enough — usually",
        cost: "A constant background query and up to one interval of delay",
      },
      {
        choice: "Lease-based claiming",
        pickWhen: "Always",
        cost: "Lease duration must be tuned; expiry can duplicate a live job",
      },
      {
        choice: "At-least-once with idempotent jobs",
        pickWhen: "Always — the honest guarantee",
        cost: "Every job author must handle being run twice",
      },
      {
        choice: "Deterministic jitter on schedules",
        pickWhen: "Many schedules at round times — always at scale",
        cost: "Jobs do not run at the exact requested second",
      },
      {
        choice: "Per-tenant queues",
        pickWhen: "Multi-tenant workloads",
        cost: "More queues to operate and capacity to allocate",
      },
      {
        choice: "Skip missed runs by default",
        pickWhen: "Jobs with user-visible side effects",
        cost: "Work is genuinely skipped and must be re-run deliberately",
      },
    ],
    wrapUp: [
      "Three concepts carry the design: a schedule is a definition, a run is a single execution attempt, and a lease is temporary ownership of one.",
      "Execution is at-least-once and cannot be otherwise, so jobs must be idempotent and every run needs a stable identifier to deduplicate on.",
      "Claiming is a conditional update with skip-locked, so many workers claim concurrently without blocking, and lease expiry — not health checking — reclaims a crashed worker's job.",
      "The midnight spike is the characteristic failure: deterministic jitter derived from the schedule id spreads load while keeping each job's run time stable day to day.",
      "Retries need backoff with jitter, bounded attempts, a maximum job duration, and a dead-letter queue that someone actually watches.",
      "Timezones, daylight saving and catch-up policy are genuine design decisions, not library details — and skipping missed runs is usually the safer default.",
    ],
    followUps: [
      {
        q: "Can you guarantee a job runs exactly once?",
        a: "No, and I would rather say so than design around a guarantee that does not exist. A worker can complete the work and then crash before recording completion, and from the scheduler's perspective that is indistinguishable from a worker that died before doing anything — so the lease expires and another worker runs it again. Closing that window would require the job's side effect and the completion record to commit atomically, which is only possible when both live in the same transactional system. The practical answer is at-least-once execution plus idempotent jobs: give every run a stable identifier, pass it to the job, and let the job deduplicate on it. That works for retries and duplicates alike, rather than only for the specific race.",
      },
      {
        q: "Thirty percent of your schedules are set to midnight. What happens?",
        a: "Without intervention, hundreds of thousands of jobs become due in the same second, workers saturate instantly, downstream systems get a synchronised hammering, and genuinely important jobs queue behind a flood of trivial ones — a self-inflicted outage on a daily timer. The fix is deterministic jitter: derive an offset from a hash of the schedule identifier and spread executions across a window of a few minutes. Deriving it from the identifier rather than randomly per run matters, because a job should run at the same time each day rather than jumping around. I would also rate-limit dispatch so that a backlog after an outage drains at a controlled pace, and separate queues by tenant or priority so one customer cannot crowd out everyone else.",
      },
      {
        q: "A worker dies mid-job. How does the work get picked up?",
        a: "Through lease expiry rather than through detecting the crash. The worker claimed the run with a lease of perhaps sixty seconds and renews it while working, so when the process dies the renewals stop and the lease lapses. The claim query looks for runs that are pending and due, or claimed with an expired lease, so the next polling worker picks it up naturally — no separate reaper or health check is needed. The important corresponding rule is on the worker side: if a renewal fails, it must stop immediately rather than optimistically continuing, because another worker may already have reclaimed the job and continuing means two copies running at once. That scenario is exactly why jobs must be idempotent.",
      },
      {
        q: "The scheduler was down for four hours. Do you run the missed jobs?",
        a: "It depends on the job, which is why catch-up has to be an explicit per-schedule policy rather than a global default. A daily report should probably run once on recovery, since the work is still wanted and running it twice is harmless. An hourly job that sends customer notifications should almost certainly not fire four times in quick succession — that turns an internal outage into a user-visible one, and the notifications are stale anyway. My default would be to skip missed runs but record them clearly in history so the gap is visible and can be re-run deliberately, because surprising people with a flood of stale executions is the more damaging error. Making re-run from history a first-class operation is what makes skipping safe.",
      },
      {
        q: "How do workers claim jobs without stepping on each other?",
        a: "With a conditional update rather than a lock. The claim is a single statement that selects due runs, marks them claimed by this worker with a lease expiry, and returns what it actually changed — so if several workers race, each ends up with a disjoint set and nobody needs to coordinate. Using skip-locked in the selection is what makes it scale: without it, workers block behind one another on the same hot rows and concurrency collapses to one. It is the same primitive as claiming hotel inventory or seats, applied to work items, and it is worth noticing that this pattern keeps recurring — pushing the race down to a conditional write the database resolves atomically is almost always better than introducing a distributed lock above it.",
      },
    ],
    related: [
      "/hld/message-queues",
      "/examples/distributed-lock",
      "/hld/idempotency",
      "/examples/distributed-mq",
      "/hld/circuit-breaker",
    ],
    furtherReading: [
      {
        label: "algomaster — design a distributed job scheduler",
        href: "https://blog.algomaster.io/p/design-a-distributed-job-scheduler",
      },
      { label: "Source 6 on GitHub", href: list },
    ],
  },
];
