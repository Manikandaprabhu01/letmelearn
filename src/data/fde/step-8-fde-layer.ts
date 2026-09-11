import type { Concept } from "@/data/types";

export const fdeLayer: Concept[] = [
  {
    slug: "fde-layer",
    title: "The FDE Layer",
    subtitle:
      "Discovery, requirements, business process, solution architecture, prototyping, integration, deployment, monitoring, support, iteration, impact",
    level: "advanced",
    minutes: 32,
    tags: ["discovery", "requirements", "prototyping", "deployment", "business impact"],
    summary:
      "Steps 1 to 7 make you an AI engineer who can build and run things. This step is what makes you a Forward Deployed Engineer: the same person who maps the problem on day one is the person who answers the page six months later. The distinguishing skill is not technical depth — it is choosing the right problem, in someone else's organisation, and being accountable for the outcome rather than the deliverable.",
    keyPoints: [
      "End-to-end accountability is the defining trait: discovery, build, deploy, support and measurement are one person's remit.",
      "The first job is finding a problem worth solving, which is usually not the one the customer initially asks for.",
      "A prototype exists to kill or confirm an idea in days, not to be the foundation of the product.",
      "If you cannot measure the business impact, the project will be cancelled in the next budget cycle regardless of how good it is.",
    ],
    prerequisites: ["/fde/system-design-for-ai", "/fde/enterprise-integration"],
    sections: [
      {
        heading: "What the role actually is",
        lede: "A pattern Palantir established and the frontier labs have adopted, with models in place of ontologies.",
        body: [
          "A Forward Deployed Engineer embeds with a customer, works out what problem is genuinely worth solving, builds the solution inside their environment, deploys it, and stays accountable for whether it works. The role combines engineering with domain understanding and direct contact with the people who will use the system. Palantir built the template; OpenAI, Anthropic and Google now run comparable functions, embedding engineers with strategic customers to apply generative AI and prove the business case.",
        ],
        diagram: {
          kind: "compare",
          caption: "The same technical skills, aimed at a different accountability.",
          options: [
            {
              title: "Product engineer",
              sub: "builds for many users",
              good: ["Deep focus on one codebase", "Requirements arrive filtered through product"],
              bad: ["Rarely meets a user", "Insulated from whether it created value"],
              verdict: "Optimises a product surface.",
            },
            {
              title: "Consultant",
              sub: "advises, then leaves",
              good: ["Broad exposure across organisations", "Strong at framing and communication"],
              bad: ["Recommends rather than ships", "Not there when it breaks"],
              verdict: "Optimises a recommendation.",
            },
            {
              title: "Forward Deployed Engineer",
              sub: "finds the problem, ships it, owns it",
              tone: "ok",
              good: [
                "Sees the real problem directly, unfiltered",
                "Can change the solution the moment reality disagrees",
                "Learns what generalises and feeds it back to the platform",
              ],
              bad: [
                "Context switching across customers and domains",
                "Carries production accountability in someone else's environment",
              ],
              verdict: "Optimises the customer's outcome — which is why the role exists.",
            },
          ],
        },
        callout: {
          kind: "insight",
          title: "Why the role appeared now",
          text: "Foundation models are general-purpose, and general-purpose capability does not convert into enterprise value on its own. Somebody has to sit inside the customer's context, find the workflow where the capability actually helps, wire it into systems built long before any of this existed, and prove it moved a number. That gap is the FDE's job, and it is why the role commands the compensation it does.",
        },
      },
      {
        heading: "Discovery: finding a problem worth solving",
        lede: "The request you receive is usually a solution someone already picked. Your job is to get back to the problem.",
        body: [
          "Customers rarely arrive with a problem statement; they arrive with 'we want a chatbot for our documentation'. Taking that literally produces a technically successful project that nobody uses. The work of discovery is to trace the request back to the business pain, and then to check whether the pain is worth money and whether AI is the right instrument.",
        ],
        table: {
          caption: "Questions that move from a requested feature to a real problem.",
          headers: ["Question", "What it uncovers"],
          rows: [
            [
              "Walk me through how this is done today",
              "The actual process, including the undocumented parts",
            ],
            [
              "Who does it, and how long does it take?",
              "Volume and cost — the basis of any business case",
            ],
            [
              "What happens when it goes wrong?",
              "Error tolerance, and therefore how much autonomy is acceptable",
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
          "Watch the work being done rather than relying on descriptions of it. The gap between the documented process and the actual one is where most of the opportunity lives — and where the requirements you were given turn out to be wrong.",
          "Good AI candidates share a shape: high volume, unstructured input, fuzzy rules, currently done by expensive people, and tolerant of review. Look for that shape rather than for places to apply a model.",
          "Say no to bad fits early and explain why. Declining a poorly-suited project builds more credibility than delivering a technically impressive system nobody adopts.",
          "The last question matters more than it appears. A system that makes a team's work visible, or threatens headcount, faces resistance that no amount of accuracy overcomes.",
        ],
      },
      {
        heading: "Prototyping: buy information, not code",
        lede: "A prototype is an experiment with a hypothesis and a deadline, not version one.",
        code: {
          title: "Structure a prototype around the question that could kill the project",
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
for path in REAL_CUSTOMER_INVOICES[:100]:       # their data, not a clean sample
    extracted = llm_extract(read(path), schema=ExtractedInvoice)
    truth = GROUND_TRUTH[path]                  # labelled with them, in the room
    results.append(score_fields(extracted, truth))

print(f"field accuracy: {mean(results):.1%}")
print(f"would need review: {sum(r.confidence != 'high' for r in results)}%")

# The output is not a demo. It is a number that answers:
#   - does this clear the bar?
#   - which fields fail, and are those the ones that matter?
#   - what does the review queue actually look like at their volume?
#
# If it fails, you have spent a week instead of a quarter — that is the win.`,
        },
        bullets: [
          "Insist on real data for the prototype, including the awkward cases. A demo built on clean samples proves nothing and sets an expectation you cannot meet in production.",
          "Define the kill criterion before you start, with the customer. Agreeing the bar in advance turns a disappointing result into a shared decision instead of an argument.",
          "Label ground truth alongside the customer's domain experts. It gives you an eval set, and it surfaces disagreements about what 'correct' even means — which are often the real requirement.",
          "Be explicit that prototype code is disposable. The most expensive outcome in this role is a week-one prototype that becomes production by accident, with none of steps 4 to 6 applied.",
        ],
      },
      {
        heading: "Deployment, support and iteration",
        lede: "Shipping is the start of the engagement, not the end of it.",
        diagram: {
          kind: "flow",
          caption: "Widen autonomy as evidence accumulates — never on day one.",
          rows: [
            [
              { id: "shadow", label: "Shadow mode", sub: "runs, output not used", tone: "accent" },
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
        table: {
          caption: "What to watch after go-live, and what each signal actually means.",
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
        bullets: [
          "Deploy in shadow mode first wherever it is possible. Running against real traffic without acting on the output gives a genuine accuracy measurement and costs nothing if it is wrong.",
          "The review queue is the product's feedback loop: every correction is a labelled example, an eval case, and evidence about where the system is weak.",
          "Go and watch people use it a fortnight after launch. What they actually do diverges from what they report, and the divergence is where the next iteration comes from.",
          "Adoption, not accuracy, is the metric that decides renewal. A system at 95% accuracy that people use beats one at 99% that they route around.",
        ],
      },
      {
        heading: "Measuring business impact",
        lede: "The number that decides whether this survives the next budget review.",
        body: [
          "Technical metrics — latency, accuracy, token cost — matter to you and to nobody in the room where funding is decided. The FDE's final responsibility is translating the system's behaviour into the customer's own terms: hours returned, cost avoided, cycle time reduced, revenue protected. This requires a baseline captured before launch, which is why the measurement plan belongs in discovery rather than at the end.",
        ],
        table: {
          caption: "Translating engineering outcomes into the language of the budget holder.",
          headers: ["What you measure", "What they hear", "Requires"],
          rows: [
            [
              "12 min → 90 s handling time",
              "Capacity of 8 additional staff",
              "Baseline timing before launch",
            ],
            ["78% auto-resolved", "$1.4M of annual cost avoided", "Agreed cost per manual case"],
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
        bullets: [
          "Capture the baseline during discovery. Without a credible before, every after is an anecdote — and this is the most common reason a genuinely successful project loses its funding.",
          "Agree the measurement definition with the customer in advance, in writing. Arguing about what counts as an error after launch is unwinnable.",
          "Report honestly, including what did not work. An FDE who says 'this part failed and here is why' is trusted with the next, larger project; one who reports only wins is not believed on either.",
          "Feed what generalises back to the platform. Recognising which parts of a bespoke deployment are actually a repeatable pattern is what turns one customer's solution into a product — and it is explicitly part of how these teams are structured.",
        ],
        callout: {
          kind: "interview",
          title: "The whole role in one sentence",
          text: "Solve real problems, deliver real impact, and stay accountable for both. Steps 1 to 7 are how you build the thing; this step is choosing the right thing to build, proving it worked in the customer's own numbers, and being the person who picks up the phone when it does not.",
        },
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
      {
        label: "Anthropic — Applied AI and forward deployed engineering",
        href: "https://www.anthropic.com/careers",
      },
    ],
  },
];
