import type { Concept } from "@/data/types";

const YT = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const fdeLayer: Concept[] = [
  {
    slug: "fde-layer",
    title: "The FDE Layer",
    subtitle:
      "Customer problem discovery, requirements, business process, solution architecture, rapid prototyping, AI engineering, enterprise integration, deployment, monitoring, debugging & support, iteration, business impact",
    level: "advanced",
    minutes: 44,
    tags: ["discovery", "requirements", "prototyping", "deployment", "support", "business impact"],
    summary:
      "Steps 1 to 7 make you an AI engineer who can build and run things. This step is what makes you a Forward Deployed Engineer: the same person who maps the problem on day one answers the page six months later. Each of the twelve activities from the roadmap is broken out below.",
    keyPoints: [
      "End-to-end accountability is the defining trait — discovery, build, deploy, support and measurement are one person's remit.",
      "The first job is finding a problem worth solving, usually not the one the customer first asks for.",
      "A prototype exists to kill or confirm an idea in days, not to become the product.",
      "If you cannot measure business impact, the project is cancelled in the next budget cycle regardless of quality.",
    ],
    prerequisites: ["/fde/system-design-for-ai", "/fde/enterprise-integration"],
    sections: [
      {
        heading: "0. What the role actually is",
        lede: "A pattern Palantir established and the frontier labs have adopted.",
        body: [
          "A Forward Deployed Engineer embeds with a customer, works out what problem is worth solving, builds it inside their environment, deploys it, and stays accountable for whether it works. Palantir built the template — strong engineers embedded with customers, building bespoke software, then folding what generalises back into the platform. OpenAI, Anthropic and Google now run comparable functions with frontier models in place of ontologies.",
        ],
        diagram: {
          kind: "compare",
          caption: "The same technical skills, aimed at a different accountability.",
          options: [
            {
              title: "Product engineer",
              sub: "builds for many users",
              good: ["Deep focus on one codebase", "Requirements filtered through product"],
              bad: ["Rarely meets a user", "Insulated from whether it created value"],
              verdict: "Optimises a product surface.",
            },
            {
              title: "Consultant",
              sub: "advises, then leaves",
              good: ["Broad exposure", "Strong at framing and communication"],
              bad: ["Recommends rather than ships", "Not there when it breaks"],
              verdict: "Optimises a recommendation.",
            },
            {
              title: "Forward Deployed Engineer",
              sub: "finds the problem, ships it, owns it",
              tone: "ok",
              good: [
                "Sees the real problem unfiltered",
                "Can change the solution the moment reality disagrees",
                "Learns what generalises and feeds it back",
              ],
              bad: [
                "Context switching across customers",
                "Production accountability in someone else's environment",
              ],
              verdict: "Optimises the customer's outcome — which is why the role exists.",
            },
          ],
        },
        links: [
          {
            label: "Forward Deployed Engineer — overview",
            href: "https://en.wikipedia.org/wiki/Forward_Deployed_Engineer",
          },
          {
            label: "YouTube search — forward deployed engineer role explained",
            href: YT("forward deployed engineer role palantir openai explained"),
          },
        ],
      },
      {
        heading: "1. Customer problem discovery",
        lede: "The request you receive is usually a solution someone already picked.",
        table: {
          caption: "Questions that move from a requested feature to a real problem.",
          headers: ["Question", "What it uncovers"],
          rows: [
            [
              "Walk me through how this is done today",
              "The actual process, including undocumented parts",
            ],
            [
              "Who does it, and how long does it take?",
              "Volume and cost — the basis of any business case",
            ],
            [
              "What happens when it goes wrong?",
              "Error tolerance, and how much autonomy is acceptable",
            ],
            ["How often does that happen?", "Whether the pain is real or remembered"],
            [
              "Why has it not been fixed already?",
              "Constraints — political, technical, regulatory",
            ],
            [
              "If this worked perfectly, what changes?",
              "The metric to measure; if there is no answer, stop",
            ],
            ["Who would be unhappy if this worked?", "The adoption risk nobody volunteers"],
          ],
        },
        bullets: [
          "Watch the work being done rather than relying on descriptions. The gap between documented and actual process is where the opportunity lives.",
          "Good AI candidates share a shape: high volume, unstructured input, fuzzy rules, expensive people, tolerant of review.",
          "Saying no to a bad fit early builds more credibility than delivering something impressive nobody adopts.",
        ],
        links: [
          {
            label: "Coursera — GenAI for executives: integration strategy",
            href: "https://www.coursera.org/learn/generative-ai-for-executives-and-business-leaders-integration-strategy",
          },
          {
            label: "YouTube search — customer discovery interview techniques",
            href: YT("customer discovery interview techniques mom test"),
          },
        ],
      },
      {
        heading: "2. Requirement gathering",
        lede: "Turn the discovered problem into constraints you can design against.",
        bullets: [
          "Get numbers, not adjectives: volume per day, acceptable latency, accuracy bar, cost ceiling, and what 'wrong' costs.",
          "Agree the definition of correct in writing, with their domain experts. Arguing about what counts as an error after launch is unwinnable.",
          "Capture the non-functional constraints early — residency, retention, approval path — because those change the architecture, not just the backlog.",
          "Write down what is explicitly out of scope. It is the cheapest protection against scope creep in a customer engagement.",
        ],
        links: [
          {
            label: "YouTube search — gathering requirements technical projects",
            href: YT("requirements gathering technical project stakeholder"),
          },
        ],
      },
      {
        heading: "3. Business process understanding",
        lede: "You cannot automate a process you have not watched.",
        bullets: [
          "Map the current process end to end, including the spreadsheet nobody mentions and the person who checks it manually every Friday.",
          "Find the exception paths: the 'normal' flow is often 60% of volume, and the exceptions are where the cost and the risk sit.",
          "Identify who owns each step. Automating across two teams' boundary is an organisational negotiation as much as an engineering task.",
          "Note where a decision currently requires judgement — those are the human-in-the-loop seams from step 5.",
        ],
        links: [
          {
            label: "YouTube search — business process mapping for engineers",
            href: YT("business process mapping value stream for engineers"),
          },
        ],
      },
      {
        heading: "4. Solution architecture",
        lede: "Design against their constraints, not the ideal ones.",
        bullets: [
          "Start from where it must run and what it may touch — steps 4 and 6 are the real constraints, not model choice.",
          "Prefer the simplest architecture that clears the accuracy bar. Every extra component is something their team must operate after you leave.",
          "Design the human seam explicitly: what is automated, what is reviewed, what escalates, and who owns the queue.",
          "Produce one diagram their architect can take into a review board. That artefact frequently matters more than the code.",
        ],
        links: [
          { label: "Site: system design for AI (step 7)", href: "/fde/system-design-for-ai" },
          {
            label: "ByteByteGo — architecture communication",
            href: "https://www.youtube.com/@ByteByteGo",
          },
        ],
      },
      {
        heading: "5. Rapid prototyping",
        lede: "A prototype is an experiment with a hypothesis and a deadline, not version one.",
        code: {
          title: "Example — structure a prototype around the question that could kill the project",
          lang: "python",
          source: `# WEEK 1 PROTOTYPE — the goal is a DECISION, not a system.
#
# Hypothesis: "We can extract line items from their supplier invoices
#              accurately enough that review takes under 30 seconds."
# Kill criterion: < 85% field-level accuracy on 100 REAL invoices.
#
# Deliberately skipped: auth, UI, persistence, scaling, error handling.
# Deliberately NOT skipped: real customer documents, including the messy ones.

results = []
for path in REAL_CUSTOMER_INVOICES[:100]:      # their data, not a clean sample
    extracted = llm_extract(read(path), schema=ExtractedInvoice)
    truth = GROUND_TRUTH[path]                 # labelled WITH them, in the room
    results.append(score_fields(extracted, truth))

print(f"field accuracy: {mean(results):.1%}")
print(f"would need review: {sum(r.confidence != 'high' for r in results)}%")

# The output is a NUMBER that answers: does this clear the bar? which fields
# fail? what does the review queue look like at their volume?
# If it fails, you spent a week instead of a quarter — that is the win.`,
        },
        bullets: [
          "Insist on real data including the awkward cases. A demo on clean samples proves nothing and sets an expectation you cannot meet.",
          "Define the kill criterion before starting, with the customer — it turns a disappointing result into a shared decision rather than an argument.",
          "Be explicit that prototype code is disposable. The most expensive outcome is a week-one prototype becoming production by accident.",
        ],
        links: [
          {
            label: "YouTube search — rapid prototyping MVP validation",
            href: YT("rapid prototyping MVP hypothesis validation engineering"),
          },
        ],
      },
      {
        heading: "6. AI engineering (applied)",
        lede: "Steps 3 and 4, executed inside the customer's constraints.",
        bullets: [
          "The engineering is the same; the constraints are not. Their cloud, their identity provider, their egress rules and their review queue shape every decision.",
          "Build the eval set from their real cases as you go — it is the artefact that lets you change anything safely later.",
          "Keep prompts, configuration and mappings in the repository and versioned, because their team inherits all of it.",
        ],
        links: [
          { label: "Site: AI engineering (step 3)", href: "/fde/ai-engineering" },
          {
            label: "Site: production AI engineering (step 4)",
            href: "/fde/production-ai-engineering",
          },
        ],
      },
      {
        heading: "7. Enterprise integration (applied)",
        lede: "Step 6 executed — and usually the longest pole in the schedule.",
        bullets: [
          "Start the access requests on day one: credentials, network rules and security review routinely take longer than the build.",
          "Integrate against a read model rather than calling their systems of record on the request path.",
          "Every write must be idempotent, permissioned, audited and attributed to the assistant.",
        ],
        links: [
          { label: "Site: enterprise integration (step 6)", href: "/fde/enterprise-integration" },
        ],
      },
      {
        heading: "8. Deployment in the customer environment",
        lede: "Widen autonomy as evidence accumulates — never on day one.",
        diagram: {
          kind: "flow",
          caption: "Each stage earns the next.",
          rows: [
            [
              { id: "shadow", label: "Shadow mode", sub: "runs, output unused", tone: "accent" },
              { id: "assist", label: "Assist", sub: "human decides every case" },
              { id: "conf", label: "Confidence routing", sub: "auto the easy cases", tone: "ok" },
            ],
            [
              { id: "auto", label: "Broad automation", sub: "exceptions escalate" },
              { id: "measure", label: "Measure impact", sub: "against the baseline", tone: "ok" },
              { id: "iterate", label: "Iterate", sub: "from the review queue" },
            ],
          ],
        },
        bullets: [
          "Shadow mode is the highest-value deployment stage: real traffic, real accuracy measurement, zero risk if it is wrong.",
          "Deploy behind a flag you can turn off without a release. In someone else's environment, a fast rollback is worth more than a fast deploy.",
          "Hand over runbooks as you go, not at the end — their on-call team will be paged before your engagement finishes.",
        ],
        links: [
          {
            label: "YouTube search — progressive delivery canary shadow deployment",
            href: YT("shadow mode canary progressive delivery deployment strategy"),
          },
        ],
      },
      {
        heading: "9. Production monitoring",
        lede: "What to watch after go-live, and what each signal actually means.",
        table: {
          caption: "Signals and their real meaning.",
          headers: ["Signal", "Means"],
          rows: [
            [
              "Usage falling week over week",
              "It is not helping — the most important signal there is",
            ],
            ["Escalation rate rising", "Drift, a data change, or a new case type"],
            ["Users working around the system", "The workflow fit is wrong, not the model"],
            ["Cost per task rising", "Prompt growth, retry loops, or cache regression"],
            ["Review queue growing", "Confidence threshold needs tuning, or quality dropped"],
            ["Silence from users", "Usually disengagement, not satisfaction — go and ask"],
          ],
        },
        links: [
          {
            label: "Site: observability and monitoring (step 5)",
            href: "/fde/ai-reliability-genaiops",
          },
        ],
      },
      {
        heading: "10. Debugging & support",
        lede: "You are the on-call for something running inside someone else's walls.",
        bullets: [
          "The trace is the whole toolkit — prompt version, retrieved chunks, tool calls, tokens. If it is not in the trace, you cannot answer the question.",
          "Reproduce from the trace rather than asking the customer to reproduce. Asking a user to recreate a bad answer rarely works and costs goodwill.",
          "Keep a documented escalation path for when the failure is the provider's, not yours — and be able to show which it was.",
          "Log every support finding back into the eval suite so the same class of bug cannot silently return.",
        ],
        links: [{ label: "Site: tracing and observability", href: "/fde/ai-reliability-genaiops" }],
      },
      {
        heading: "11. Iteration based on feedback",
        lede: "The review queue is the product's feedback loop.",
        bullets: [
          "Every correction in the review queue is a labelled example, an eval case, and evidence about where the system is weak.",
          "Go and watch people use it a fortnight after launch. What they do diverges from what they report, and the divergence is the next iteration.",
          "Prioritise by frequency × cost of the failure, not by how interesting the fix is.",
          "Re-tune the confidence threshold periodically — the right cut point moves as the data and the users change.",
        ],
        links: [
          {
            label: "YouTube search — feedback loops product iteration",
            href: YT("product feedback loop iteration user research"),
          },
        ],
      },
      {
        heading: "12. Measure business impact",
        lede: "The number that decides whether this survives the next budget review.",
        table: {
          caption: "Translating engineering outcomes into the budget holder's language.",
          headers: ["What you measure", "What they hear", "Requires"],
          rows: [
            [
              "12 min → 90 s handling time",
              "Capacity of 8 additional staff",
              "Baseline timing before launch",
            ],
            ["78% auto-resolved", "$1.4M annual cost avoided", "Agreed cost per manual case"],
            [
              "Cycle time 3 days → 4 hours",
              "Faster cash collection",
              "Process timestamps both sides",
            ],
            [
              "Error rate 4% → 0.7%",
              "Reduced rework and exposure",
              "Agreed definition of an error",
            ],
            ["Model accuracy 94%", "Nothing", "— avoid presenting this alone"],
          ],
        },
        callout: {
          kind: "interview",
          title: "The whole role in one sentence",
          text: "Solve real problems, deliver real impact, and stay accountable for both. Steps 1 to 7 are how you build the thing; this step is choosing the right thing to build, proving it worked in the customer's own numbers, and being the person who picks up the phone when it does not.",
        },
        bullets: [
          "Capture the baseline during discovery. Without a credible before, every after is an anecdote — the most common reason a successful project loses funding.",
          "Report honestly, including what did not work. An FDE who says 'this part failed and here is why' is trusted with the next, larger project.",
          "Feed what generalises back to the platform — recognising which parts of a bespoke deployment are a repeatable pattern is explicitly part of how these teams are structured.",
        ],
        links: [
          {
            label: "Google Cloud — three proven strategies for optimising AI costs",
            href: "https://cloud.google.com/transform/three-proven-strategies-for-optimizing-ai-costs",
          },
          {
            label: "YouTube search — measuring ROI of AI projects",
            href: YT("measuring business impact ROI AI project baseline metrics"),
          },
        ],
      },
    ],
    related: [
      "/fde/system-design-for-ai",
      "/fde/enterprise-integration",
      "/examples/interview-framework",
    ],
    furtherReading: [
      {
        label: "Forward Deployed Engineer — overview",
        href: "https://en.wikipedia.org/wiki/Forward_Deployed_Engineer",
      },
      { label: "Anthropic — careers and Applied AI", href: "https://www.anthropic.com/careers" },
    ],
  },
];
