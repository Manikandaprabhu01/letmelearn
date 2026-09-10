import type { DesignExample } from "@/data/types";

export const supplementsB: Record<string, Partial<DesignExample>> = {
  "distributed-mq": {
    clarifying: [
      {
        q: "Do consumers need to replay history?",
        a: "Assume yes — that single answer forces a log-based design with retention, rather than a queue that deletes on acknowledgement.",
      },
      {
        q: "What ordering guarantee is required?",
        a: "Per key, not globally. Global ordering means a single serialisation point, which is exactly what a distributed system is trying to avoid.",
      },
      {
        q: "How durable must an accepted message be?",
        a: "Replicated to a quorum before acknowledgement. That is the difference between 'we accepted it' and 'we will probably keep it'.",
      },
    ],
    wrapUp: [
      "The core is an append-only, partitioned log: sequential writes, offsets as cursors, and consumers that track their own position.",
      "Partitions are the unit of both ordering and parallelism, so partition count caps how many consumers can work in a group.",
      "Durability comes from replicating each partition and acknowledging after a quorum has it — the in-sync replica set is the mechanism.",
      "Retention is time- or size-based and independent of consumption, which is what makes replay and adding a new consumer group possible.",
      "With another hour: consumer group rebalancing without a stop-the-world pause, and tiered storage for old segments.",
    ],
    followUps: [
      {
        q: "How do you guarantee ordering?",
        a: "Only within a partition, and that is enough if the partition key is chosen so that anything requiring order shares one — all events for an account, for instance. One consumer in a group owns a partition at a time, which is what makes per-partition order meaningful. Global ordering would require a single writer and would sacrifice the scalability the design exists for.",
      },
      {
        q: "What happens when a broker holding a partition leader dies?",
        a: "A new leader is elected from the in-sync replicas — those that have kept up with the log. Because acknowledgement waited for a quorum, no acknowledged message is lost. The window of unavailability is the detection timeout plus the election, and any replica that had fallen behind is excluded from candidacy precisely so it cannot truncate committed data.",
      },
      {
        q: "How do you add capacity?",
        a: "More partitions, and more consumers up to that number. The catch is that increasing partitions changes the key-to-partition mapping, so a key's history is split across old and new partitions and ordering across that boundary is broken. That is why partition count should be chosen with growth in mind rather than treated as freely adjustable.",
      },
    ],
  },

  metrics: {
    clarifying: [
      {
        q: "What cardinality are we dealing with?",
        a: "This is the question. A metric with a user id label is millions of time series; the same metric with bounded labels is hundreds. Cardinality, not volume, is what kills metrics systems.",
      },
      {
        q: "How long do we retain, and at what resolution?",
        a: "Full resolution for hours, downsampled for months. Storing per-second data for a year is orders of magnitude more expensive than anyone needs.",
      },
      {
        q: "Push or pull collection?",
        a: "Pull for services you control — it gives you liveness for free — with a push gateway for short-lived jobs that die before they can be scraped.",
      },
    ],
    wrapUp: [
      "A metrics system is a specialised time-series database: append-heavy, timestamp-ordered, and compressed hard because adjacent values are similar.",
      "Cardinality is the dominant cost driver — every distinct label combination is a separate series with its own index entry and memory footprint.",
      "Downsampling and retention tiers are what make long-term storage affordable; nobody queries per-second data from six months ago.",
      "Querying is over ranges and aggregations, so the storage layout is columnar and partitioned by time.",
      "With another hour: the alerting evaluation loop, and how to keep queries fast when a dashboard fans out to hundreds of series.",
    ],
    followUps: [
      {
        q: "Why is high cardinality such a problem?",
        a: "Because each unique label combination is a separate time series with its own index entry, memory footprint and compression stream. A metric with fifty endpoints and five statuses is 250 series; add a user id and it is millions, which blows up both index memory and query time. The rule is that anything unbounded — ids, URLs with parameters, error messages — belongs in traces or logs, never in a metric label.",
      },
      {
        q: "How do you store years of data affordably?",
        a: "Tiered resolution. Keep raw resolution for a short window, then continuously downsample into coarser rollups — per-minute, then per-hour — and expire the finer tier. Combined with delta-of-delta timestamp encoding and XOR compression on values, which exploit how similar consecutive samples are, the storage cost drops by more than an order of magnitude.",
      },
      {
        q: "Push or pull, and why?",
        a: "Pull for long-running services, because the scrape itself tells you the target is alive, the collector controls the rate so a misbehaving service cannot flood it, and service discovery gives you the target list. Push is necessary for short-lived batch jobs that finish before any scrape, which is what a push gateway exists for — a supplement to the model rather than a replacement.",
      },
    ],
  },

  "ad-click": {
    clarifying: [
      {
        q: "How accurate must the counts be?",
        a: "Exact, eventually — this is billing data. That is a much stronger requirement than analytics and it drives the whole design toward deduplication and reconciliation.",
      },
      {
        q: "How fresh must the dashboard be?",
        a: "Near real time for monitoring, exact by end of day for billing. Two different pipelines over the same events, which is the classic lambda-versus-kappa discussion.",
      },
      {
        q: "What is the volume and the fraud exposure?",
        a: "Billions of events per day, and a meaningful fraction is fraudulent. Fraud filtering is not an afterthought — it changes what 'a click' means.",
      },
    ],
    wrapUp: [
      "Ingestion is append-only into a partitioned log; nothing is aggregated at the edge because raw events are needed for recount and dispute.",
      "Deduplication by event id is essential — at-least-once delivery plus retries means duplicates are routine, and duplicates are billing errors.",
      "A fast approximate path serves dashboards; a slower exact path over the same events produces billing figures, and the two are reconciled.",
      "Time windows must be handled explicitly: late events arrive for hours, so windows stay open with a watermark rather than closing on wall-clock time.",
      "With another hour: the fraud-detection pipeline and how disputed counts are recomputed from raw events.",
    ],
    followUps: [
      {
        q: "How do you avoid counting a click twice?",
        a: "Every click carries an id generated at the edge, and aggregation deduplicates on it within the window. Because this is billing data, I would also keep the raw events so any disputed figure can be recomputed rather than argued about. Deduplication at aggregation time plus retained raw events is what makes the number defensible.",
      },
      {
        q: "An event arrives four hours late. What happens?",
        a: "It still counts, which is why windows are driven by event time with a watermark rather than by wall-clock arrival. The aggregate for that window is updated and downstream consumers see a correction. Systems that close windows on arrival time quietly undercount exactly the traffic from poor networks, which correlates with real users.",
      },
      {
        q: "Do you need both a real-time and a batch path?",
        a: "Historically yes — a fast approximate path for dashboards and a batch recompute for billing. Modern streaming engines with exactly-once semantics and event-time windows can serve both from one pipeline, which removes the duplicated logic that made the two-path design painful. I would still keep the raw events, because the ability to recompute from source is what makes billing disputes resolvable.",
      },
    ],
  },

  "hotel-reservation": {
    clarifying: [
      {
        q: "Can we oversell?",
        a: "No. That single constraint makes this a strong-consistency problem and rules out designs that would be fine for a social feed.",
      },
      {
        q: "How long is inventory held during checkout?",
        a: "Ten to fifteen minutes. That hold is a real state with an expiry, and forgetting it is how rooms become permanently unavailable.",
      },
      {
        q: "What is the read/write ratio?",
        a: "Very read-heavy — searching vastly outnumbers booking. So search can be served from cache and replicas while booking takes the consistent path.",
      },
    ],
    wrapUp: [
      "Search and booking are separated deliberately: search reads a cached, slightly stale view, while booking takes a strongly consistent path against real inventory.",
      "Inventory is decremented with a conditional update, so overselling is prevented structurally rather than by checking first and writing after.",
      "Holds are a first-class state with an expiry and a sweeper, because a hold that never expires removes inventory permanently.",
      "Idempotency keys make a retried booking safe — a timeout during payment must not produce two reservations.",
      "With another hour: overbooking policy as a deliberate business decision, and the multi-room, multi-night atomicity case.",
    ],
    followUps: [
      {
        q: "Two users book the last room simultaneously. What happens?",
        a: "One conditional update succeeds and the other affects zero rows, so exactly one booking is created and the other user is told immediately. The important part is that the check and the decrement are one atomic statement — reading availability, deciding in application code, and then writing is where oversell bugs live.",
      },
      {
        q: "Search says available but booking fails. Is that acceptable?",
        a: "Yes, and it is the right trade. Search is served from a cached view that may be seconds stale, which is what makes it fast at high volume; booking checks the truth. The alternative — strongly consistent search — would put the entire read load on the transactional path for a case that is rare and recoverable with a clear message.",
      },
      {
        q: "How do you handle a booking that spans five nights?",
        a: "All five nights must be reserved atomically or none — a partial booking is worse than a failure. Within one shard that is a single transaction over the five inventory rows, taken in a consistent order to avoid deadlock. If inventory were partitioned such that they could land on different shards, I would keep a hotel's inventory co-located precisely so this stays a local transaction.",
      },
    ],
  },

  "email-service": {
    clarifying: [
      {
        q: "Sending, receiving, or both?",
        a: "Both are distinct systems: sending is a delivery pipeline with reputation management, receiving is storage plus search. Scope explicitly.",
      },
      {
        q: "How much mail per user, and how long retained?",
        a: "Tens of thousands of messages, retained indefinitely. That makes search the dominant read problem and storage the dominant cost.",
      },
      {
        q: "What search quality is expected?",
        a: "Full-text over headers and bodies with fast results. That means a per-user inverted index, which is a very different structure from the message store.",
      },
    ],
    wrapUp: [
      "Mail storage is per-user and append-heavy, with metadata separated from bodies so a mailbox listing never reads message content.",
      "Search needs a per-user inverted index built asynchronously from the message stream — the message store cannot answer full-text queries.",
      "Sending is a queue-and-retry pipeline where sender reputation, bounce handling and suppression lists matter more than throughput.",
      "Attachments go to object storage with deduplication by content hash, since the same attachment often reaches thousands of recipients.",
      "With another hour: spam filtering as a scored pipeline, and threading messages into conversations.",
    ],
    followUps: [
      {
        q: "How do you make search fast over a decade of mail?",
        a: "A per-user inverted index rather than scanning the message store. It is built asynchronously as messages arrive, partitioned by user so a query touches one shard, and it stores just enough to rank and locate — the bodies stay in the message store and are fetched for the results actually displayed. Search and storage are different structures answering different questions.",
      },
      {
        q: "One email is sent to 10,000 recipients. How is it stored?",
        a: "The body and attachments once, content-addressed, with a per-recipient metadata row referencing it. Storing 10,000 copies of the same attachment is the naive version and it is enormously wasteful. Deduplication by content hash also means the storage cost of a broadcast is close to the cost of a single message.",
      },
      {
        q: "What makes outbound delivery hard?",
        a: "Reputation, not throughput. Receiving providers throttle or reject senders based on bounce rates, complaint rates and IP history, so the pipeline needs suppression lists, bounce processing, gradual warm-up of new sending IPs, and per-domain rate shaping. A technically perfect sender with a poor reputation simply does not get delivered.",
      },
    ],
  },

  "object-storage": {
    clarifying: [
      {
        q: "What is the durability target?",
        a: "Eleven nines, which is the industry expectation. That number is what forces erasure coding across failure domains rather than simple replication.",
      },
      {
        q: "Immutable objects or mutable files?",
        a: "Immutable objects with versioning. Allowing in-place mutation would require a completely different consistency model and is why object storage is not a filesystem.",
      },
      {
        q: "What object sizes?",
        a: "Bytes to terabytes, which means multipart upload and range reads are core features rather than extras.",
      },
    ],
    wrapUp: [
      "Metadata and data are separate systems: a partitioned metadata store maps keys to placement, and data lives on storage nodes as immutable chunks.",
      "Durability comes from erasure coding across racks and availability zones — far cheaper than three-way replication for the same durability.",
      "Immutability makes consistency tractable: a new version is a new object, so there is no in-place update to coordinate.",
      "Background repair continuously verifies checksums and rebuilds lost fragments, because at this scale disks fail constantly.",
      "With another hour: lifecycle policies and tiering to cold storage, and the multipart upload state machine.",
    ],
    followUps: [
      {
        q: "Replication or erasure coding?",
        a: "Erasure coding for the bulk of the data. Three-way replication costs 200% overhead; a scheme like 10 data plus 4 parity fragments gives comparable or better durability at around 40%, spread across racks and zones so no single failure domain holds enough fragments to matter. The cost is that reconstructing a lost fragment reads from many nodes, so small hot objects are sometimes replicated instead.",
      },
      {
        q: "How do you get eleven nines of durability?",
        a: "Not from any single mechanism. Fragments spread across independent failure domains, continuous background verification of checksums, automatic reconstruction when a fragment is lost, and enough redundancy that several simultaneous failures are survivable. The number comes from the probability of losing more fragments than the coding tolerates before repair completes — which makes repair speed as important as redundancy level.",
      },
      {
        q: "How does a 5 TB upload work?",
        a: "Multipart: the client initiates an upload, uploads parts independently and in parallel with individual checksums, then signals completion and the service assembles the manifest. A failed part is retried alone rather than restarting five terabytes. Incomplete uploads need a lifecycle rule to clean them up, or orphaned parts accumulate silently and cost real money.",
      },
    ],
  },
};
