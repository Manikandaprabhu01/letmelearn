// Imported from the Interview Prep Console (lib/data-concepts-c.js).
import type { ConceptAnswer } from "../types";

export const conceptsC: ConceptAnswer[] = [
  {
    id: "b-values",
    t: "Values / culture-fit round — what it is and how to prepare",
    cat: "Behavioral & HM",
    r: 5,
    src: ["Tech Interview Handbook", "IGotAnOffer", "candidate reports"],
    a: "Take this round seriously. Candidate reports repeatedly describe people clearing every technical round and then failing here — one Lead candidate who got an offer still warned that *'many people got rejected in this round'*. It is not a formality, and at Lead level and above it often carries a veto.\n\n**What it is.** Most companies publish a short list of values or principles and score you against them with behavioural questions. The frames you will actually meet: **Amazon's 16 Leadership Principles** (the most structured — expect two LP questions per interviewer, with deep follow-ups on the numbers), **Meta's competencies** (impact, direction-setting, people, engineering excellence), **Google's 'Googleyness and leadership'**, **Atlassian's values round** (a dedicated, separately scored interview), and the published values of Indian product companies such as Freshworks, Zoho, Flipkart and Razorpay.\n\n**The clusters** behind almost every published list, and the story each one wants:\n- **Customer focus** — a time you changed a technical decision because of what a customer actually needed.\n- **Ownership / bias for action** — something you fixed that was nobody's job, and the tail you then carried.\n- **High standards** — where you refused to ship, and what it cost.\n- **Bold moves / calculated risk** — a decision made on incomplete information, with the guardrail you put around it.\n- **Team over ego** — credit shared, or a decision you lost and then supported.\n- **Learn and be curious** — something you were wrong about and what changed.\n\n**How to prepare**: one STAR story per cluster, each with a number in the result, mapped to that specific company's published list the night before. For a Lead role, at least three stories should involve influencing people outside your direct control — another team, a sceptical manager, a vendor.\n\n**Reads badly**: blaming previous employers, describing every success as entirely your own, having no example of a decision you got wrong, and a vague answer to 'why here'. **Reads well**: specifics, shared credit, a mistake you own with what changed afterwards, and a reason for joining that references what the company actually builds.",
    fu: [
      {
        q: "How do I answer 'tell me about yourself' in this round?",
        a: "90 seconds, forward-looking: current scope and scale in one line, two or three things you have owned with their outcomes, then why this role is the next step. Not a chronological CV reading — they have the CV.",
      },
      {
        q: "They asked whether I'd accept an unusual working arrangement (6-day weeks, fixed office days).",
        a: "Answer honestly and without drama. An answer obviously tailored to please reads as untrustworthy, and a mismatch discovered after joining is worse for both sides. State what matters to you about sustainable delivery, ask what the norm actually is on the team, and say plainly what you would and would not sign up for.",
      },
      {
        q: "What questions should I ask them?",
        a: "Ask things whose answers would change your decision: how the team decides what to build, what the on-call rotation looks like, what the last incident was and what changed after it, and how technical disagreements get resolved. Asking nothing is a negative signal at every level.",
      },
    ],
  },
  {
    id: "b-leadership",
    t: "Director round — technical leadership",
    cat: "Behavioral & HM",
    r: 4,
    src: ["L6", "S1"],
    a: "A Glassdoor Lead report lists a fifth round with a Director focused on technical leadership, and the candidate was rejected there after clearing every technical round. At this level the questions stop being about what you can build and start being about what changes because you are on the team.\n\nPrepare these five stories, each with a measurable outcome:\n1. **A technical decision you drove across teams** — the options, the criteria you used, who disagreed, how it was resolved, and how it turned out. Include what you would do differently.\n2. **Mentoring** — someone you levelled up: what they could not do before, what you actually did (code review habits, pairing, scoped stretch work), and where they are now.\n3. **A delivery under pressure** — how you cut scope rather than quality, what you negotiated with the product side, and how you protected the team.\n4. **A failure you owned** — an outage, a missed estimate, a design that had to be reversed. What broke, the blast radius, your part in it, the fix, and the systemic guardrail that followed. Leaders are expected to have these.\n5. **Improving how the team works** — review turnaround, test flakiness, deploy frequency, on-call load. Quantify before and after.\n\nTwo framing habits separate Lead answers from Senior ones: talk about trade-offs against business constraints (cost, deadline, team capacity, risk) rather than purely technical merit, and use 'we' for the work while being precise about what *you* personally did. Overclaiming is exposed by one follow-up question; so is vagueness.",
    fu: [
      {
        q: "How do you handle disagreement with a senior engineer or your manager?",
        a: "Describe a real case: separate the decision from the person, agree on the criteria first (latency budget, cost, risk, delivery date), bring data or a spike rather than opinion, and commit fully once a decision is made even if it was not yours. If it turned out badly, say what you learned about when to escalate.",
      },
      {
        q: "How do you decide what the team works on?",
        a: "Tie engineering work to customer and business outcomes: a running list of debt with an estimated cost of not doing it, a rough budget split between product work and platform health, and explicit trade-off conversations with the product manager. Concrete percentages and an example of something you deliberately did not do.",
      },
      {
        q: "How do you set technical direction without being the person who writes all the code?",
        a: "Design reviews with written proposals, clear interfaces and ownership, and leaving implementation to the team while staying close enough to spot problems early. Give an example where you deliberately let someone else choose a different approach than yours and what happened.",
      },
    ],
  },
  {
    id: "b-pr",
    t: "Walk us through your PR / code review process",
    cat: "Behavioral & HM",
    r: 2,
    src: ["S3"],
    a: "Asked explicitly in a 2025 loop. Answer with a process you actually run, not an ideal one.\n\n**Before review** — the author's job: small PRs (a few hundred lines is the realistic ceiling for careful review), a description that says why and how to verify, self-review first, CI green (build, tests, linters, static analysis, coverage gate), a feature flag for anything risky, and a migration plan when the schema changes.\n\n**During review** — the reviewer's job: correctness first, then tests, then the design, then names and style (most style points should be automated away by a formatter so humans do not spend attention on them). Separate blocking comments from suggestions explicitly — 'blocking:' and 'nit:' prefixes remove most of the friction. Ask questions instead of issuing instructions when you are unsure of the context. For anything non-trivial, pull the branch and run it.\n\n**Service levels** — a review turnaround target (for example, first response within 4 working hours) matters more than review depth for team throughput; a PR sitting for two days is a bigger cost than an imperfect comment. Rotate reviewers so knowledge spreads rather than routing everything through one person.\n\n**As a Lead**, add: you review the risky and cross-cutting changes yourself, you make sure juniors get reviewed by more than one person, you use reviews as teaching moments rather than gatekeeping, and you escalate design disagreements to a short synchronous conversation rather than a twelve-comment thread.\n\nClose with a measurable improvement you made — 'median time to first review went from 19 hours to 3 after we added review rotation and a bot reminder' — because that converts a process answer into a leadership answer.",
    fu: [
      {
        q: "What do you do when a PR is too large to review?",
        a: "Ask for it to be split, and help define the seams (refactor first, then behaviour change). If it genuinely cannot be split — a framework upgrade, a generated migration — review it synchronously with the author walking through it, and be explicit that the review is shallower and the rollout needs a flag.",
      },
      {
        q: "How do you handle a reviewer who blocks everything on style?",
        a: "Automate the style so the debate disappears (formatter, linter in CI), then agree as a team on what is blocking versus advisory. If it persists, it is a conversation to have directly and privately — that is part of the Lead job.",
      },
      {
        q: "Do you require tests on every PR?",
        a: "Tests proportional to risk: unit tests for logic, an integration test for the flow, and no test for a copy change. Blanket rules produce ceremony. Say what you would insist on: any bug fix comes with a test that fails before the fix.",
      },
    ],
  },
  {
    id: "b-release",
    t: "Walk us through your release process",
    cat: "Behavioral & HM",
    r: 4,
    src: ["S3"],
    a: "Describe the pipeline end to end with the safety mechanisms, because the question is really 'how do you ship without breaking things'.\n\n**Pipeline**: trunk-based development with short-lived branches → CI on every push (build, unit, integration, static analysis, security scan) → artefact built once and promoted through environments (never rebuilt per environment) → automated deploy to staging with smoke tests → production deploy.\n\n**Production rollout**: blue/green or rolling with health checks and automatic rollback on error-rate or latency regression; canary to a small percentage or a single tenant first for risky changes; feature flags so deploy and release are separate events — you can ship code dark on Tuesday and turn it on Thursday, and turn it off in seconds without a deploy.\n\n**Database changes**: expand/contract. Add the new column or table, backfill in batches, dual-write, switch reads, then drop the old one in a later release. Never a breaking migration in the same deploy as the code that needs it, and every migration must be backward compatible with the previous version of the app because during a rolling deploy both versions run at once.\n\n**After the deploy**: watch the golden signals for a defined bake time, have a documented rollback (and know how long it takes), and hold a blameless post-incident review when something does go wrong, with action items that have owners.\n\n**Cadence and ownership**: say what you actually do — daily or weekly releases, who approves, how the on-call handover works, and how release notes reach support and customers. If your current process is worse than this, say so and say what you would change first; honesty plus a plan beats describing a process you do not have.",
    fu: [
      {
        q: "How do you roll back a migration that has already run?",
        a: "You design so you do not have to: expand/contract means nothing is destroyed until the new code is proven. If a destructive change must be rolled back, you restore from backup or replay from an event log — so the real answer is that destructive steps are separated, delayed, and done when the change has been live long enough to trust.",
      },
      {
        q: "How do you release when 200 tenants are on shared infrastructure?",
        a: "Canary by tenant cohort — internal tenants, then small tenants, then everyone — with per-tenant feature flags so a specific customer can be held back or turned on early. This is exactly how a multi-tenant SaaS product ships, and framing it this way is what the question is fishing for.",
      },
      {
        q: "What is your deploy frequency and does it matter?",
        a: "Frequent small deploys are safer than rare big ones: smaller blast radius, easier attribution, faster rollback. Quote the DORA metrics framing (deploy frequency, lead time, change failure rate, time to restore) and give your team's actual numbers.",
      },
    ],
  },
  {
    id: "b-challenging",
    t: "Your most challenging / interesting work — and how you'd improve its architecture",
    cat: "Behavioral & HM",
    r: 4,
    src: ["S5", "S6", "L1"],
    a: "This appears in almost every loop, at every company — in the cross-functional round, the hiring-manager round and the bar raiser. One report notes a candidate who admitted being unprepared for this exact question and said it derailed the whole round.\n\nStructure the answer in five parts and keep it to four minutes before pausing for questions:\n1. **Why it was hard** — name the actual constraint: scale, correctness, legacy migration, an impossible deadline, unclear requirements, or organisational complexity. 'It was a big project' is not a difficulty.\n2. **What you owned** — precisely your part, and who did the rest.\n3. **The key decision** — the options, the criteria, the trade-off you accepted.\n4. **The outcome in numbers** — latency, cost, throughput, defect rate, delivery date, adoption.\n5. **What you would change** — the improvement question is asked directly in two of the reports ('improvements suggested for existing projects', 'how would you enhance the architecture'), so bring it yourself rather than waiting.\n\nGood improvement answers sound like: 'we chose synchronous calls between the two services for speed of delivery; at today's volume I would put a queue between them, which removes the coupling and lets the slower side scale independently — the cost is eventual consistency in the UI, which the product can accept for that flow.' That single sentence contains a decision, a reason, a change and a trade-off, which is the shape they are grading.\n\nPrepare two of these stories, one deeply technical and one where the difficulty was people or process, so you can match whichever the interviewer is probing.",
    fu: [
      {
        q: "What if my most interesting work is confidential?",
        a: "Describe the shape without the specifics: the scale, the constraints, the architecture pattern and the trade-offs, while omitting customer names and proprietary details. Nobody expects you to leak; they do expect you to be able to discuss your own engineering.",
      },
      {
        q: "They keep drilling into details I do not remember.",
        a: "Say what you know and what you would have to check. Fabricating specifics is far more damaging — one report describes exactly that unravelling. 'I do not remember the exact p99, it was in the low hundreds of milliseconds' is a perfectly good answer.",
      },
      {
        q: "How technical should this answer be?",
        a: "Start at architecture level and let them pull you down. In the cross-functional round they explicitly explore the architectural decisions, so have the diagram and the two or three decisions ready — and see the 'Present your current system' card in the HLD tab for the full preparation checklist.",
      },
    ],
  },
  {
    id: "b-why",
    t: "Why are you looking for a change? (the honest version)",
    cat: "Behavioral & HM",
    r: 4,
    src: ["Tech Interview Handbook", "IGotAnOffer", "candidate reports"],
    a: "Asked in the hiring-manager round and again by HR, and the two answers must match.\n\n**Answer forward, not backward.** Name what you want next — larger technical scope, ownership of a system end to end, more product influence, a domain you care about, a level of technical depth — and why your current role cannot provide it in a reasonable timeframe. That framing is true, verifiable and leaves no opening for the follow-up that catches people out ('so what would have to change for you to stay?').\n\n**Keep criticism factual and brief.** One specific, non-personal sentence is fine ('the platform work I want is owned by another org'). A candidate who disparages their current team is assumed to be a future risk, and interviewers are listening for exactly that.\n\n**If the real reason is your manager**, translate it into what you want rather than what you are escaping: 'I want an environment where technical decisions are made with data and I own a system end to end.'\n\n**If you were laid off**, say it plainly and without apology. It is common, it carries no stigma, and an evasive answer is far more damaging than the fact.\n\n**If you are leaving quickly** (under 18 months), name the reason concretely — a re-org, a cancelled product, a role that turned out to be different from the one described — and say what you are looking for that makes the next move stick. Expect a probe here; have the answer ready rather than improvising.\n\n**Compensation** is a legitimate factor but a weak headline. Raise it with the recruiter, where it belongs.",
    fu: [
      {
        q: "What are your salary expectations?",
        a: "Answer to the recruiter, not the interviewer, and anchor with a researched range for the level and location rather than your current number. If pressed early, ask what range the role is budgeted at.",
      },
      {
        q: "Where do you see yourself in five years?",
        a: "Pick a direction (deeper technical ownership, architect track, or engineering management) and say what you would want to be doing in year one to move toward it. Vagueness reads as drift; over-specificity reads as a poor fit if it does not match the role.",
      },
      {
        q: "Do you have other offers?",
        a: "Be honest without using it as leverage in a technical round. If you do, share the timeline rather than the number — it helps scheduling. If you do not, say so; inventing pressure is a poor negotiating position and easy to misjudge.",
      },
    ],
  },
  {
    id: "b-hm",
    t: "The hiring-manager round — what it is really testing",
    cat: "Behavioral & HM",
    r: 4,
    src: ["L1", "L2", "L6", "S3"],
    a: "The reports disagree on the format, and that disagreement is itself the lesson: one Lead candidate described it as 'a casual discussion, nothing much technical'; another got HLD of a parking system, a system design of their own project, an easy coding problem in an online compiler, and motivation questions; a third cleared every technical round and was rejected here. **Prepare for it as a technical round that might turn casual, not the reverse.**\n\nWhat the manager is actually deciding:\n- **Will this person raise the level of my team?** — evidence of mentoring, design leadership and raising standards.\n- **Can I hand them a problem and stop worrying?** — stories where you drove something ambiguous to done.\n- **Do they handle disagreement and failure well?** — a mistake you own, a conflict you resolved.\n- **Do they understand the business?** — why the work matters to customers, not just whether it is interesting.\n- **Will they stay and be happy?** — a coherent reason for joining and realistic expectations of the role.\n\nGo in with: your system diagram (see the HLD tab), three STAR stories with numbers, one failure, one disagreement, and three questions that show you have thought about the team rather than the company brochure. Expect a small coding or design task anyway — two reports mention one — so do not be caught off guard by it.",
    fu: [
      {
        q: "How do I keep a 'casual' round from becoming a lost round?",
        a: "Bring structure yourself: when asked something open, answer in a shape (context → decision → outcome → what I'd change). Interviewers score signals, and unstructured chat produces few of them.",
      },
      {
        q: "What if the manager asks about something I have never done?",
        a: "Say so, then reason about it from first principles and relate it to the closest thing you have done. Reports repeatedly show candidates penalised for bluffing, never for a well-reasoned 'I have not, but here is how I would approach it'.",
      },
      {
        q: "Is it appropriate to ask about on-call and workload here?",
        a: "Yes, and it is a good question at Lead level, phrased as ownership rather than avoidance: 'what does the on-call rotation look like, and how does the team handle the load — is there a budget for reducing paging?'",
      },
    ],
  },
];
