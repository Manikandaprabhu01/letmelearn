import type { Concept } from "@/data/types";

export const fdeEnterprise: Concept[] = [
  {
    slug: "enterprise-integration",
    title: "Enterprise Integration",
    subtitle:
      "Auth, OAuth, SSO, RBAC, APIs, webhooks, enterprise DBs, data pipelines, SaaS integrations, CRM/ERP, data privacy, governance",
    level: "advanced",
    minutes: 30,
    tags: ["oauth", "sso", "rbac", "webhooks", "crm", "governance", "privacy"],
    summary:
      "This is the step that separates a demo from a deployment, and it is where most AI projects actually die. The model works; then it has to authenticate against the customer's identity provider, respect permissions defined in their CRM, read from a system of record nobody documented, satisfy a data-privacy review, and survive a governance committee. None of that is AI work, and all of it is on the critical path.",
    keyPoints: [
      "The AI system must inherit the customer's existing permission model, never invent its own — an AI that can read everything is an access-control breach.",
      "SSO and SCIM are usually procurement requirements rather than features; without them the deal stalls.",
      "Systems of record (CRM, ERP) have hard rate limits and brittle APIs — design around them from the start.",
      "Data privacy determines architecture: residency, retention and whether prompts may leave the tenant boundary.",
    ],
    prerequisites: ["/fde/production-ai-engineering"],
    sections: [
      {
        heading: "Identity: inherit the customer's model, never invent one",
        lede: "The fastest way to fail a security review is a system with its own user list.",
        body: [
          "Enterprises already know who their users are and what they may see. An AI application that maintains a separate account list, or that reads documents with a broad service account, is a security finding waiting to happen — and it will be found, because these deployments are reviewed. The correct posture is that the AI system is just another client of the existing identity and authorisation infrastructure.",
        ],
        diagram: {
          kind: "sequence",
          caption:
            "The user's identity travels all the way to the data, and permissions are evaluated there.",
          actors: [
            { id: "u", label: "Employee" },
            { id: "app", label: "AI application" },
            { id: "idp", label: "Identity provider", sub: "Entra ID / Okta" },
            { id: "d", label: "Data sources" },
          ],
          messages: [
            { from: "u", to: "app", label: "1. open assistant", kind: "call" },
            { from: "app", to: "idp", label: "2. OIDC redirect", kind: "call" },
            {
              from: "idp",
              to: "app",
              label: "3. id + access token, groups claim",
              kind: "return",
              tone: "ok",
            },
            {
              from: "app",
              to: "app",
              label: "4. map groups → entitlements",
              kind: "self",
              tone: "accent",
            },
            {
              from: "app",
              to: "d",
              label: "5. retrieve AS THIS USER — filter in the query",
              kind: "call",
              tone: "accent",
            },
            { from: "d", to: "app", label: "6. only what they may see", kind: "return" },
            { from: "app", to: "u", label: "7. grounded answer", kind: "return", tone: "ok" },
          ],
        },
        table: {
          caption: "What an enterprise buyer expects to exist, and what happens without it.",
          headers: ["Capability", "Why they require it", "Absent it"],
          rows: [
            [
              "SSO via OIDC or SAML",
              "No separate passwords to manage",
              "Security review blocks the rollout",
            ],
            [
              "SCIM provisioning",
              "Leavers lose access automatically",
              "Manual offboarding — an audit finding",
            ],
            [
              "Group-based RBAC",
              "Permissions already live in their directory",
              "You rebuild their org chart, badly",
            ],
            [
              "Audit log",
              "Who asked what, and what was shown",
              "Cannot answer a compliance question",
            ],
            [
              "Per-tenant isolation",
              "Their data must not mix with anyone's",
              "Non-starter for regulated industries",
            ],
          ],
        },
        callout: {
          kind: "warn",
          title: "The retrieval permission bug that keeps recurring",
          text: "Retrieving documents with a service account and then filtering the results by the user's permissions is wrong in a way that looks fine in testing. The excluded documents were already fetched, so they sit in memory, in logs and in traces — and one prompt-injection or one logging bug exposes them. Worse, the model may summarise a chunk it should never have seen. Filter inside the query, always.",
        },
      },
      {
        heading: "Integrating with systems of record",
        lede: "CRM and ERP APIs are rate-limited, brittle and business-critical. Treat them accordingly.",
        table: {
          caption: "The constraints that shape any CRM or ERP integration.",
          headers: ["Constraint", "Reality", "Design response"],
          rows: [
            [
              "API rate limits",
              "Often a fixed daily or per-minute quota",
              "Cache aggressively; batch; never call per token",
            ],
            [
              "Slow, heavy endpoints",
              "Seconds per call, complex payloads",
              "Sync into your own read model",
            ],
            [
              "Custom fields everywhere",
              "No two tenants' schemas match",
              "Configuration-driven mapping, not hardcoding",
            ],
            [
              "Writes are business events",
              "A wrong write is a real-world consequence",
              "Human approval; idempotency; full audit",
            ],
            [
              "Sandbox differs from production",
              "The surprise lands at go-live",
              "Insist on realistic test data early",
            ],
          ],
        },
        code: {
          title: "A read model is usually the right integration shape",
          lang: "python",
          source: `# WRONG — call the CRM inside the request path.
# 20k assistant queries a day × 3 lookups each = 60k API calls against a quota
# of 15k, plus seconds of latency the user feels.
def answer(question, user):
    account = salesforce.query(f"SELECT ... WHERE Id = '{user.account_id}'")  # slow + quota
    ...

# RIGHT — sync into a local read model, then serve from it.
# The CRM stays the system of RECORD; you keep a system of REFERENCE.
async def sync_accounts():
    since = await store.last_sync_cursor()
    # Incremental, not full — full syncs blow the quota and take hours.
    async for batch in salesforce.query_updated_since(since, page_size=2000):
        await store.upsert_accounts(batch)        # idempotent on the CRM id
        await store.set_cursor(batch.max_modified)

# Writes still go to the system of record, synchronously and carefully:
def create_case(payload, *, acting_user, idempotency_key):
    require_permission(acting_user, "case.create")
    if existing := store.find_by_idempotency_key(idempotency_key):
        return existing                          # retries must not duplicate cases
    case = salesforce.create("Case", payload, as_user=acting_user)
    audit.record("case.created", case.id, actor=acting_user, source="ai_assistant")
    return case`,
        },
        bullets: [
          "Reads come from your synced read model; writes go to the system of record. This keeps latency and quota under control while preserving the customer's source of truth.",
          "Every write must be idempotent and audited, and must record that an AI assistant originated it. When someone asks 'why is there a duplicate case', that attribution is the whole investigation.",
          "Webhooks are how you stay fresh without polling — but they are at-least-once, arrive out of order, and will be replayed. Handle them idempotently or you will process the same event twice.",
          "Field mapping belongs in configuration. Every tenant has custom fields, and hardcoding one customer's schema guarantees a rewrite for the next.",
        ],
      },
      {
        heading: "Data pipelines: where the delivery time actually goes",
        lede: "The customer says 'our documents'. That phrase hides weeks of work.",
        body: [
          "Scoping a RAG deployment as an AI project is the most reliable way to miss a date. The documents are spread across SharePoint, a wiki, a shared drive and email. They exist in four versions with no indication which is current. The PDFs are scans. The tables lose their structure when parsed. Permissions are inconsistent. None of this is visible in the demo, and all of it is on the critical path.",
        ],
        diagram: {
          kind: "flow",
          caption: "Each stage is a place a delivery estimate quietly doubles.",
          rows: [
            [
              { id: "src", label: "Sources", sub: "SharePoint, Confluence, S3, CRM" },
              { id: "auth", label: "Access", sub: "credentials + permissions", tone: "warn" },
              { id: "ext", label: "Extract", sub: "PDF, DOCX, tables, OCR", tone: "warn" },
            ],
            [
              { id: "norm", label: "Normalise", sub: "dedupe, versioning, authority" },
              { id: "chunk", label: "Chunk + embed", sub: "with ACL metadata", tone: "accent" },
              { id: "idx", label: "Index", sub: "vector + keyword" },
            ],
            [
              { id: "cdc", label: "Incremental sync", sub: "changes, deletes, re-permission" },
              { id: "obs", label: "Freshness monitoring", sub: "staleness alerts", tone: "ok" },
            ],
          ],
        },
        bullets: [
          "Carry permissions through the pipeline as metadata on every chunk. Retrofitting access control onto an index built without it usually means rebuilding the index.",
          "Deletions and permission changes must propagate. A document removed from SharePoint that still answers questions in the assistant is a serious and very visible failure.",
          "Decide what is authoritative when versions conflict, and make it explicit. 'Which of these three policies is current' is a business question, not a technical one — take it back to the customer.",
          "Monitor index freshness as a product metric. Silent sync failure presents to users as the assistant confidently citing last quarter's policy.",
        ],
      },
      {
        heading: "Privacy and governance",
        lede: "These constraints decide the architecture, so surface them in week one.",
        table: {
          caption: "Questions that change the design, and what each answer forces.",
          headers: ["Question", "If yes", "Architectural consequence"],
          rows: [
            [
              "Must data stay in region?",
              "EU / UK / in-country",
              "Regional endpoints or self-hosted models",
            ],
            [
              "May prompts leave the tenant?",
              "Often no for regulated data",
              "Private deployment; redaction before egress",
            ],
            [
              "Can vendors train on it?",
              "Almost always no",
              "Contractual no-training; verify the setting",
            ],
            [
              "Is there a retention limit?",
              "Commonly 30–90 days",
              "TTL on traces, prompts and logs",
            ],
            [
              "Right to erasure?",
              "GDPR and similar",
              "Delete from index, cache, traces and backups",
            ],
            [
              "Do decisions need explanation?",
              "Finance, HR, healthcare",
              "Citations, audit trail, human sign-off",
            ],
          ],
        },
        bullets: [
          "Redact personal data before it reaches the model where the use case allows it. It reduces breach exposure, simplifies the privacy review, and is frequently what makes approval possible at all.",
          "Retention applies to traces too, and traces are exactly where prompts and retrieved customer data accumulate. A 90-day policy with unlimited trace retention is a finding.",
          "Erasure is harder than it looks: a person's data may sit in the vector index, the semantic cache, the trace store and a backup. Design the deletion path deliberately rather than discovering it during an audit.",
          "Regulatory frameworks — the EU AI Act, NIST's AI RMF, ISO/IEC 42001 — are increasingly the vocabulary of these conversations. Knowing roughly what they require is what lets you talk to a governance committee without stalling the project.",
        ],
        callout: {
          kind: "interview",
          title: "Ask these before designing anything",
          text: '"Where may this data live, who may see it, how long may we keep it, and who signs off?" Four questions, asked in the first week, that routinely change the entire architecture — regional deployment, self-hosted models, redaction pipelines, approval workflows. Asking them late is the single most common cause of an AI project being rebuilt rather than shipped.',
        },
      },
    ],
    related: [
      "/fde/system-design-for-ai",
      "/fde/ai-reliability-genaiops",
      "/examples/auth-system",
      "/hld/api-gateway",
    ],
    furtherReading: [
      { label: "OAuth 2.0 and OpenID Connect — overview", href: "https://oauth.net/2/" },
      { label: "EU AI Act — official text", href: "https://artificialintelligenceact.eu/" },
    ],
  },
];
