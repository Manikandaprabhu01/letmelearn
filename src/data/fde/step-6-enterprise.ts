import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeEnterprise: Concept[] = [
  {
    slug: "enterprise-integration",
    title: "Enterprise Integration",
    subtitle:
      "Auth, OAuth, SSO, RBAC, APIs, webhooks, enterprise DBs, data pipelines, SaaS integrations, CRM/ERP, data privacy, governance",
    level: "advanced",
    minutes: 48,
    tags: [
      "auth",
      "oauth",
      "sso",
      "rbac",
      "webhooks",
      "pipelines",
      "crm",
      "erp",
      "privacy",
      "governance",
    ],
    summary:
      "The step that separates a demo from a deployment, and where most AI projects actually die. The model works; then it has to authenticate against their identity provider, respect permissions defined in their CRM, read a system of record nobody documented, and survive a governance committee. Each of the twelve concepts is broken out below.",
    keyPoints: [
      "The AI system must inherit the customer's permission model, never invent its own.",
      "Filter at the query, never post-filter retrieved results — that is an access-control bug.",
      "Systems of record have hard rate limits and brittle APIs: sync into a read model.",
      "Privacy and governance determine architecture, so surface them in week one.",
    ],
    prerequisites: ["/fde/production-ai-engineering"],
    sections: [
      {
        heading: "1. Auth (authentication)",
        lede: "Proving who the caller is — and the AI system is just another client of their existing infrastructure.",
        body: [
          "Enterprises already know who their users are. An AI application maintaining a separate account list is a security finding waiting to happen, and it will be found because these deployments are reviewed.",
        ],
        bullets: [
          "Machine-to-machine calls use a service identity; user-facing calls must carry the user's identity all the way down.",
          "Short-lived tokens with refresh, never long-lived static credentials embedded in config.",
          "Every token must be validated on the server — issuer, audience and expiry — not merely decoded.",
        ],
        links: [
          {
            label: "YouTube search — authentication vs authorization explained",
            href: YT("authentication authorization JWT session explained"),
          },
          { label: "Site: designing an auth system end-to-end", href: "/examples/auth-system" },
        ],
      },
      {
        heading: "2. OAuth 2.0",
        lede: "Delegated access — the protocol behind 'connect your Salesforce account'.",
        body: [
          "OAuth lets your application act on a user's behalf against a third-party system without ever seeing their password. For an FDE it is the mechanism behind almost every SaaS integration you will build.",
        ],
        bullets: [
          "Use the authorization code flow with PKCE. The implicit flow is deprecated because it exposes tokens in redirect URLs.",
          "Always validate the state parameter — omitting it is a cross-site request forgery hole in the authorisation flow.",
          "Scopes are least privilege in practice: request the narrowest set that works, because a security reviewer will read them.",
        ],
        links: [
          { label: "OAuth 2.0 — official site and specs", href: "https://oauth.net/2/" },
          {
            label: "YouTube search — OAuth 2.0 and PKCE explained",
            href: YT("OAuth 2.0 authorization code PKCE flow explained"),
          },
        ],
      },
      {
        heading: "3. SSO (single sign-on)",
        lede: "Usually a procurement requirement rather than a feature — without it, the deal stalls.",
        diagram: {
          kind: "sequence",
          caption:
            "The user's identity travels all the way to the data, where permissions are evaluated.",
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
        bullets: [
          "OIDC for modern applications, SAML where the enterprise mandates it — large organisations often still require SAML.",
          "SCIM provisioning matters as much as sign-in: without automatic deprovisioning, a leaver keeps access and that is an audit finding.",
          "Group claims are where their existing org structure enters your system — use them rather than rebuilding the org chart.",
        ],
        links: [
          {
            label: "OpenID Connect — official documentation",
            href: "https://openid.net/developers/how-connect-works/",
          },
          {
            label: "YouTube search — SAML vs OIDC SSO explained",
            href: YT("SAML vs OIDC SSO enterprise explained"),
          },
        ],
      },
      {
        heading: "4. RBAC (role-based access control)",
        lede: "Permissions already live in their directory — inherit them.",
        table: {
          caption: "What an enterprise buyer expects, and what happens without it.",
          headers: ["Capability", "Why they require it", "Absent it"],
          rows: [
            [
              "Group-based roles",
              "Permissions live in their directory",
              "You rebuild their org chart, badly",
            ],
            [
              "Per-tenant isolation",
              "Their data must not mix",
              "Non-starter for regulated industries",
            ],
            [
              "Audit log",
              "Who asked what, and what was shown",
              "Cannot answer a compliance question",
            ],
            [
              "Least privilege for tools",
              "The model can be talked into things",
              "Privilege escalation by prompt",
            ],
          ],
        },
        callout: {
          kind: "warn",
          title: "The retrieval permission bug that keeps recurring",
          text: "Retrieving with a service account and then filtering results by the user's permissions is wrong in a way that looks fine in testing. The excluded documents were already fetched — they sit in memory, in logs and in traces — and one injection or logging bug exposes them. Worse, the model may summarise a chunk it should never have seen. Filter inside the query, always.",
        },
        links: [
          {
            label: "YouTube search — RBAC vs ABAC access control design",
            href: YT("RBAC ABAC access control design explained"),
          },
        ],
      },
      {
        heading: "5. APIs",
        lede: "The contract their systems already know how to consume.",
        bullets: [
          "Version from the first release — you will change the response shape and their integration will already be live.",
          "Idempotency keys on every write endpoint: enterprise clients retry aggressively through proxies and gateways.",
          "Document with OpenAPI. Their integration team may never speak to you, and the spec is the handover.",
          "Rate limit per tenant and return Retry-After, so one integration cannot starve the others.",
        ],
        links: [
          { label: "OpenAPI Specification", href: "https://swagger.io/specification/" },
          { label: "Site: API gateway responsibilities", href: "/hld/api-gateway" },
        ],
      },
      {
        heading: "6. Webhooks",
        lede: "How you stay fresh without polling — and they are at-least-once, out of order, and replayed.",
        code: {
          title: "Example — a webhook receiver that survives reality",
          lang: "python",
          source: `@app.post("/webhooks/salesforce")
async def receive(request: Request, signature: str = Header(alias="X-Signature")):
    raw = await request.body()

    # 1. VERIFY the signature before parsing. An unverified webhook endpoint is
    #    an unauthenticated write API exposed to the internet.
    if not hmac.compare_digest(signature, sign(raw, WEBHOOK_SECRET)):
        raise HTTPException(401)

    event = json.loads(raw)

    # 2. DEDUPE — delivery is at-least-once, so the same event WILL arrive twice.
    if await store.seen(event["id"]):
        return {"ok": True}                    # already handled; return 200

    # 3. ORDER is not guaranteed. Use the source's version/timestamp, and
    #    ignore an event older than what you have already applied.
    if event["version"] <= await store.version_for(event["record_id"]):
        return {"ok": True}

    # 4. Acknowledge FAST, process async. A slow handler causes the sender to
    #    time out and retry, multiplying your load.
    await queue.enqueue(event)
    await store.mark_seen(event["id"])
    return {"ok": True}`,
        },
        bullets: [
          "Return 2xx quickly and do the work asynchronously — slow handlers cause retries, which look like duplicate events.",
          "Always verify signatures; an unverified endpoint is an open write API.",
          "Have a reconciliation job as a backstop: webhooks get dropped, and a periodic sync catches what was missed.",
        ],
        links: [
          {
            label: "YouTube search — webhook design idempotency signature verification",
            href: YT("webhook design idempotency signature verification retry"),
          },
          { label: "Site: idempotency in depth", href: "/hld/idempotency" },
        ],
      },
      {
        heading: "7. Enterprise databases",
        lede: "Oracle, SQL Server, DB2 — the systems of record nobody documented.",
        bullets: [
          "Read replicas only, wherever possible. An AI feature querying the production OLTP database at volume will be noticed, and blamed for unrelated slowness.",
          "Expect no documentation and cryptic column names. The schema walkthrough with their DBA is a scheduled activity, not an afternoon.",
          "Legacy character encodings and date handling cause real extraction bugs — check before promising accuracy numbers.",
          "Ask who owns the data and who approves access. That is often a longer path than the technical work.",
        ],
        links: [
          { label: "Site: SQL vs NoSQL and choosing a store", href: "/hld/sql-vs-nosql" },
          {
            label: "YouTube search — database replication read replica explained",
            href: YT("database read replica replication explained"),
          },
        ],
      },
      {
        heading: "8. Data pipelines",
        lede: "'Our documents' is a phrase that hides weeks of work.",
        diagram: {
          kind: "flow",
          caption: "Each stage is where a delivery estimate quietly doubles.",
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
          "Carry permissions through the pipeline as metadata on every chunk. Retrofitting access control onto an index usually means rebuilding it.",
          "Deletions and permission changes must propagate — a document removed from SharePoint that still answers questions is a serious, visible failure.",
          "Decide what is authoritative when versions conflict. That is a business question; take it back to the customer.",
        ],
        links: [
          {
            label: "YouTube search — data pipeline ETL incremental sync CDC",
            href: YT("data pipeline ETL incremental sync change data capture tutorial"),
          },
        ],
      },
      {
        heading: "9. SaaS integrations",
        lede: "Rate-limited, brittle, and business-critical — treat them accordingly.",
        table: {
          caption: "The constraints that shape every SaaS integration.",
          headers: ["Constraint", "Reality", "Design response"],
          rows: [
            [
              "API rate limits",
              "Fixed daily or per-minute quota",
              "Cache aggressively; batch; never call per token",
            ],
            ["Slow, heavy endpoints", "Seconds per call", "Sync into your own read model"],
            [
              "Custom fields everywhere",
              "No two tenants' schemas match",
              "Configuration-driven mapping",
            ],
            [
              "Sandbox differs from prod",
              "The surprise lands at go-live",
              "Insist on realistic test data early",
            ],
          ],
        },
        links: [
          {
            label: "YouTube search — API rate limiting backoff retry strategies",
            href: YT("API rate limit exponential backoff retry strategy"),
          },
        ],
      },
      {
        heading: "10. CRM / ERP",
        lede: "The system of record — reads from your copy, writes to theirs.",
        code: {
          title: "Example — a read model is usually the right integration shape",
          lang: "python",
          source: `# WRONG — call the CRM inside the request path.
# 20k queries/day x 3 lookups = 60k API calls against a quota of 15k,
# plus seconds of latency the user feels.
def answer(question, user):
    account = salesforce.query(f"SELECT ... WHERE Id = '{user.account_id}'")
    ...

# RIGHT — sync into a local read model; the CRM stays the system of RECORD.
async def sync_accounts():
    since = await store.last_sync_cursor()
    async for batch in salesforce.query_updated_since(since, page_size=2000):
        await store.upsert_accounts(batch)        # idempotent on the CRM id
        await store.set_cursor(batch.max_modified)

# Writes still go to the system of record — carefully, and audited:
def create_case(payload, *, acting_user, idempotency_key):
    require_permission(acting_user, "case.create")
    if existing := store.find_by_idempotency_key(idempotency_key):
        return existing                            # retries must not duplicate
    case = salesforce.create("Case", payload, as_user=acting_user)
    audit.record("case.created", case.id, actor=acting_user, source="ai_assistant")
    return case`,
        },
        bullets: [
          "Every write must record that an AI assistant originated it. When someone asks 'why is there a duplicate case', that attribution is the whole investigation.",
          "Field mapping belongs in configuration — hardcoding one customer's custom fields guarantees a rewrite for the next.",
          "Writes are business events with real-world consequences: human approval, idempotency and audit are not optional.",
        ],
        links: [
          {
            label: "YouTube search — Salesforce API integration best practices",
            href: YT("salesforce API integration bulk sync best practices"),
          },
        ],
      },
      {
        heading: "11. Data privacy",
        lede: "These constraints decide the architecture — surface them in week one.",
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
            ["Retention limit?", "Commonly 30–90 days", "TTL on traces, prompts and logs"],
            [
              "Right to erasure?",
              "GDPR and similar",
              "Delete from index, cache, traces AND backups",
            ],
          ],
        },
        bullets: [
          "Redact personal data before it reaches the model where the use case allows — it reduces breach exposure and is frequently what makes approval possible at all.",
          "Retention applies to traces, and traces are exactly where prompts and retrieved customer data accumulate.",
          "Erasure is harder than it looks: a person's data may sit in the vector index, the semantic cache, the trace store and a backup.",
        ],
        links: [
          { label: "GDPR — official text", href: "https://gdpr-info.eu/" },
          {
            label: "YouTube search — PII redaction data privacy in AI systems",
            href: YT("PII redaction data privacy LLM application"),
          },
        ],
      },
      {
        heading: "12. Governance",
        lede: "The committee that can stop your project — and the vocabulary that gets you through it.",
        bullets: [
          "Know the frameworks by name: the EU AI Act, NIST's AI RMF, ISO/IEC 42001 and sector rules. They are the shared language of these conversations.",
          "High-risk classifications bring documentation, human oversight and transparency obligations — find out early whether the use case falls into one.",
          "Model cards, decision logs and an audit trail are usually what governance actually wants; citations and traces from step 5 supply most of it.",
          "Ask 'who signs off?' in the first week. The approval path is frequently longer than the build.",
        ],
        links: [
          {
            label: "EU AI Act — official text and explorer",
            href: "https://artificialintelligenceact.eu/",
          },
          {
            label: "ISO/IEC 42001 — AI management systems",
            href: "https://www.iso.org/standard/81230.html",
          },
          {
            label: "YouTube search — EU AI Act compliance explained for engineers",
            href: YT("EU AI Act compliance explained engineers risk categories"),
          },
        ],
      },
    ],
    related: ["/fde/system-design-for-ai", "/fde/ai-reliability-genaiops", "/examples/auth-system"],
    furtherReading: [
      { label: "OAuth 2.0", href: "https://oauth.net/2/" },
      { label: "EU AI Act", href: "https://artificialintelligenceact.eu/" },
      { label: "OpenID Connect", href: "https://openid.net/developers/how-connect-works/" },
    ],
  },
];
