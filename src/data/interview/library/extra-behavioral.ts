// Imported from the Interview Prep Console (lib/extra-behavioral.js).
import type { ConceptAnswer } from "../types";

export const extraBehavioral: ConceptAnswer[] = [
  {
    id: "x-b-method",
    t: "The STAR method and the story bank that covers 30 questions",
    cat: "Behavioural",
    r: 4,
    src: ["Tech Interview Handbook", "IGotAnOffer", "Turing"],
    a: 'Tech Interview Handbook\'s list of the 30 most common behavioural questions collapses into about **eight stories**. Prepare those, not thirty answers.\n\n**The eight**: (1) a project you owned end to end; (2) a conflict with a peer; (3) a disagreement with a manager or a senior engineer; (4) a failure or outage you caused or fixed; (5) a tight deadline and what you cut; (6) hard feedback you received and what changed; (7) someone you mentored or levelled up; (8) something you improved that nobody asked you to.\n\n**STAR, with the weights that matter**: Situation 15% (context only — company, scale, constraint), Task 15% (your specific responsibility, not the team\'s), **Action 50%** (what *you* did, decisions and trade-offs, first person), Result 20% (a number, plus what you learned). Most candidates invert this and spend three minutes on context.\n\n**Rules that separate strong answers**:\n- Quantify. "Cut p99 from 1.8 s to 240 ms" beats "improved performance".\n- Say "I" for your actions and "we" for the team\'s outcome — interviewers are trained to ask "what did *you* do" and vagueness reads as overclaiming.\n- Pick stories where something went wrong. A story with no tension has no signal.\n- Keep each to 2–3 minutes, then stop. Let them ask follow-ups; that is where the conversation gets good.\n- Have at least three stories involving people outside your team — influence without authority is the senior bar.\n\n**Preparation format** that works: one page per story with the numbers, the two decisions you made, the thing you got wrong, and the three questions you expect afterwards.',
    fu: [
      {
        q: "What if I don't have an impressive enough story?",
        a: "Scale is not the criterion; reasoning is. A small system with a clearly explained trade-off beats a vague description of something huge. Interviewers are listening for how you decide, not how many users you had.",
      },
      {
        q: "Can I reuse the same story for different questions?",
        a: "Once or twice, framed differently (the same project can answer 'ownership' and 'conflict' if you foreground different parts). Using it for everything signals a thin body of experience — which is why eight stories, not two.",
      },
      {
        q: "How do I handle a question about something I haven't done?",
        a: "Say so, then give the nearest real analogue and how you would approach the real thing. Fabrication unravels under two follow-ups, and interviewers remember it far longer than a gap.",
      },
    ],
  },
  {
    id: "x-b-fit",
    t: "Why this company, why leave, and what you want next",
    cat: "Behavioural",
    r: 4,
    src: ["Tech Interview Handbook", "IGotAnOffer"],
    a: 'Covers the cluster: *why do you want to work here, why are you leaving, what are you looking for, what would you work on first, where do you see yourself in five years.*\n\n**Why this company** — be specific enough that the answer could not be pasted into another interview. Name the product surface and the engineering problem it implies ("multi-tenant SaaS means noisy-neighbour isolation and per-tenant limits, which is the kind of problem I want next"), one thing you have actually used or read about them, and the connection to your own trajectory. Generic praise ("great culture, great products") reads as no preparation.\n\n**Why leaving** — forward-looking and factual. Name what you want that your current role cannot provide in a reasonable time: larger technical scope, ownership of a system end to end, a domain you care about, or a level of technical depth. Keep criticism brief and specific; a candidate who disparages their current team is assumed to be a future risk. If you were laid off, say it plainly — it is common and carries no stigma.\n\n**What you want next / first 90 days** — show you have thought about contributing rather than being onboarded: learn the system and the on-call rotation, ship something small in week two, find the biggest source of toil and fix it. That answer doubles as evidence you have done this before.\n\n**Five years** — pick a direction (deeper technical ownership, architect track, or management) and say what you would want to be doing in year one to move toward it. Vagueness reads as drift; over-specificity reads as a poor fit if it does not match the role.\n\n**Compensation** belongs with the recruiter, anchored to a researched range for the level and location rather than to your current number.',
    fu: [
      {
        q: "What if my real reason for leaving is my manager?",
        a: "Translate it into what you want rather than what you are escaping: 'I want an environment where technical decisions are made with data and I can own a system end to end.' True, forward-looking, and not a complaint.",
      },
      {
        q: "They ask what I know about the company and I've only read the careers page.",
        a: "Spend twenty minutes before every loop: the product, the customer, the engineering blog, and one recent launch. Then ask a question that shows it — 'how has the move to X changed how the platform team works?' Preparation is visible, and its absence is too.",
      },
      {
        q: "How do I answer 'do you have other offers'?",
        a: "Neutral and honest. If you do, share the timeline rather than the number — it helps scheduling. If you do not, say so; inventing pressure is a poor negotiating position and easy to misjudge.",
      },
    ],
  },
  {
    id: "x-b-conflict",
    t: "Conflict, disagreement and influencing without authority",
    cat: "Behavioural",
    r: 4,
    src: ["Tech Interview Handbook", "Turing", "IGotAnOffer"],
    a: "Covers: *a conflict with a coworker, a disagreement with your manager, a time you had to influence someone, someone you struggled to work with.*\n\n**The shape that works**: state the disagreement as a technical or priority question, not a personality clash. Show you sought their reasoning **first** (most conflicts dissolve once you learn the constraint they were carrying). Make the disagreement cheap to resolve — a spike, a benchmark, a one-page comparison with criteria agreed up front. Then commit to the outcome, including when it was not yours, and describe the relationship afterwards.\n\n**Include a time you were wrong.** A candidate who has only ever been vindicated is either unlucky in their interviewers or not telling the whole story. 'I pushed for X, we tried it, the numbers said Y, and here is what I changed about how I evaluate this' is a stronger answer than any victory.\n\n**Influence without authority** is the senior version of this question. The mechanisms worth naming: framing the decision in the other team's terms (their on-call load, their roadmap risk), building a working prototype rather than arguing in the abstract, finding the one person whose support unlocks the rest, and writing it down so the decision survives the meeting.\n\n**Escalation** is a legitimate tool, not a failure — but late. The order is: understand, propose with evidence, seek a shared criterion, then escalate with both positions represented fairly, which is what makes people trust you to escalate at all.\n\n**Red flags** to avoid: blaming, describing a colleague as incompetent, resolving everything by going over someone's head, or a story where you quietly did it your own way anyway.",
    fu: [
      {
        q: "What if the disagreement was never resolved?",
        a: "That is a usable story if you can say what you learned about the constraint you missed, and what you would do earlier next time. Honest unresolved endings beat invented clean ones — but do not bring one where you are still visibly angry.",
      },
      {
        q: "How do you handle disagreement with someone far more senior?",
        a: "Same mechanics, more preparation: come with data, ask what would change their mind, and be explicit that you will commit either way. Seniority changes the burden of evidence, not your right to raise it.",
      },
      {
        q: "What if they ask for a conflict and I genuinely haven't had one?",
        a: "You have — a design review where two approaches competed, a priority dispute with a product manager, a code review that went several rounds. Conflict does not mean argument; reframe rather than claim a conflict-free career, which nobody believes.",
      },
    ],
  },
  {
    id: "x-b-failure",
    t: "Failure, feedback and the hardest bug",
    cat: "Behavioural",
    r: 4,
    src: ["Tech Interview Handbook", "IGotAnOffer", "Verve"],
    a: "Covers: *a time you failed, your most difficult bug, the most constructive feedback you received, how you handle criticism, what aspects of your work get criticised.*\n\n**Failure story** — pick one where you were genuinely responsible, not one where a vendor let you down. The arc: what you decided, what the consequence was (with a number: downtime, cost, missed date), how you contained it, what the root cause turned out to be, and the **systemic** change you made afterwards. A personal resolution ('I'll be more careful') is weak; a guardrail (a test, an alert, a review step, a rollback plan) is strong. Interviewers are calibrating whether you can be trusted with autonomy after a mistake.\n\n**Hardest bug** — this is a technical storytelling question. Structure it as: symptom → what the data said → hypothesis → how you tested it → root cause → fix → prevention. Quote the actual evidence: the metric, the log line, the flame graph, the query plan, the packet capture. The best answers include a wrong hypothesis you discarded and why — that is what debugging actually looks like.\n\n**Feedback** — name feedback that stung and that you acted on: 'my design docs were too long for anyone to review', 'I was fixing things myself instead of letting the team learn'. Then the change and the evidence it worked. Feedback stories where the feedback was flattering ('they told me I work too hard') fail this question.\n\n**Criticism of your work** — answer with the pattern you know about yourself, not a humble-brag. Something like 'I under-communicate progress on long tasks, so I now post a short weekly update' is credible, specific and shows a mechanism rather than an intention.",
    fu: [
      {
        q: "What if my biggest failure was caused by someone else?",
        a: "Then it is not your story. Find one where your decision was part of the chain — and if you led the team, the team's failure is yours to own. Deflection is the most common way this question is failed.",
      },
      {
        q: "How much detail for the hardest bug?",
        a: "Enough that someone in the domain could follow the deduction, which means naming the tools and the evidence. If they are not in your domain, spend one sentence on context and keep the reasoning visible — the reasoning is the point.",
      },
      {
        q: "Should I admit I caused an outage?",
        a: "Yes, if you can tell it well. Nearly every senior engineer has. What is being tested is whether you detected it, contained it, communicated honestly, and left the system safer — a candidate with no scars usually has no ownership.",
      },
    ],
  },
  {
    id: "x-b-leadership",
    t: "Ownership, mentoring and technical leadership",
    cat: "Behavioural",
    r: 4,
    src: ["Tech Interview Handbook", "IGotAnOffer", "Meta/Amazon loops"],
    a: "Covers: *a project you are most proud of, something you pushed for, something you persevered at for months, a time you met a tight deadline, how you mentor, how you set technical direction.*\n\n**Ownership** — the story must go past the launch. Anyone can describe building something; seniority shows in the operational tail: the alerts you added, the runbook, the on-call handover, the cost six months later, the thing you deprecated. Interviewers at Amazon, Meta and most product companies probe this deliberately.\n\n**Pushing for something** — a technical or product position you held when it was inconvenient, with the cost you paid (a slipped date, extra work, a difficult conversation) and how you brought others along. If nothing was at stake, it is not a story about conviction.\n\n**Perseverance over months** — migrations, deprecations, reliability programmes. These are the least glamorous and most revealing stories: how you kept momentum, how you measured progress, how you handled the middle when everyone had lost interest.\n\n**Tight deadline** — the answer is about **what you cut**, not how hard you worked. Scope negotiated explicitly, quality protected where it mattered (data integrity, security), technical debt taken knowingly and written down with a date. 'We worked weekends' is a red flag, not a badge.\n\n**Mentoring** — name the person's starting point, what you actually did (pairing, review habits, a scoped stretch project, deliberately not taking the interesting work), and where they are now. Vague 'I mentor juniors' claims collapse under one follow-up.\n\n**Technical direction** at Lead and above: how you made a decision that outlived you — a written design with alternatives, agreed criteria, and a review that included the people who disagreed. Bonus points for a decision you let someone else make differently from how you would have.",
    fu: [
      {
        q: "What if I'm not a lead yet but interviewing for a lead role?",
        a: "Leadership evidence does not require the title: owning a service, running a design review, driving a migration, being the person other teams ask. Frame those as the work, and be explicit about the scope you have not yet had rather than inflating it.",
      },
      {
        q: "How do I show impact when my work was infrastructure?",
        a: "Translate into outcomes someone else felt: deploy frequency, incident count, p99, cost per request, engineer hours saved per week. Infrastructure work with no measured effect is indistinguishable from rework — and measuring it is half the job.",
      },
      {
        q: "They ask what I would change about my current team.",
        a: "Answer as a leader would: one specific, fixable thing, what you already tried, and what you learned about why it is hard. Complaints without attempts read as passivity.",
      },
    ],
  },
];
