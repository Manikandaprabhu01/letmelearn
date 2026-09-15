import type { ReactNode } from "react";
import { MdBullets as Bullets, MdInline, Md } from "@/components/interview/Md";
import { LLD_DIAGRAMS } from "@/data/interview/library/lld-diagrams";
import type {
  Approach,
  CodingAnswer,
  ConceptAnswer,
  HldAnswer,
  LibraryEntry,
  LldAnswer,
  QA,
  Question,
} from "@/data/interview/types";
import { useInterviewPrefs, type CodeLang } from "@/lib/interview-prefs";
import { cn } from "@/lib/utils";

/* ---------- building blocks ---------- */

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-4">
      <h3 className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function QAList({ items }: { items?: QA[] }) {
  if (!items?.length) return null;
  return (
    <dl className="space-y-2.5">
      {items.map((f, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3">
          <dt className="text-[14px] font-medium leading-6 text-fg">
            <span className="mr-2 font-mono text-[11px] text-accent">Q</span>
            <MdInline text={f.q} />
          </dt>
          <dd className="mt-1.5 max-w-prose text-[14px] leading-6 text-muted">
            <span className="mr-2 font-mono text-[11px] text-ok">A</span>
            <MdInline text={f.a} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Figure({
  label,
  actions,
  children,
}: {
  label: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="mt-3 overflow-hidden rounded-lg border border-border bg-inset first:mt-0">
      <figcaption className="flex min-h-9 items-center justify-between gap-3 border-b border-border px-4 py-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">{label}</span>
        {actions}
      </figcaption>
      {children}
    </figure>
  );
}

export function CodeBlock({ source, label }: { source?: string; label: string }) {
  if (!source) return null;
  return (
    <Figure label={label}>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg">
        <code>{source}</code>
      </pre>
    </Figure>
  );
}

const LANG_LABEL: Record<CodeLang, string> = { java: "Java", py: "Python" };

/** Java and Python versions of the same code, following the console's language switch. */
export function CodePair({ java, py }: { java?: string; py?: string }) {
  const preferred = useInterviewPrefs((s) => s.lang);
  const setLang = useInterviewPrefs((s) => s.setLang);
  if (!java && !py) return null;
  const shown: CodeLang = (preferred === "py" ? py : java) ? preferred : java ? "java" : "py";
  const source = shown === "java" ? java : py;
  const both = Boolean(java && py);
  return (
    <Figure
      label={LANG_LABEL[shown]}
      actions={
        both ? (
          <div
            className="flex overflow-hidden rounded border border-border"
            role="group"
            aria-label="Code language"
          >
            {(["java", "py"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={shown === l}
                className={cn(
                  "px-2 py-0.5 font-mono text-[10.5px]",
                  shown === l ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        ) : null
      }
    >
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fg">
        <code>{source}</code>
      </pre>
    </Figure>
  );
}

function Ascii({ text, label }: { text?: string; label: string }) {
  if (!text) return null;
  return (
    <Figure label={label}>
      <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-[1.4] text-fg">
        {text}
      </pre>
    </Figure>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-raised text-[11px] uppercase tracking-wider text-faint">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn("px-3 py-2 align-top text-muted", j === 0 && "font-medium text-fg")}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- answers ---------- */

function ApproachCard({ label, approach }: { label: string; approach: Approach }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-4 first:mt-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-medium text-fg">{label}</span>
        {approach.tc ? (
          <span className="rounded border border-border px-1.5 font-mono text-[10.5px] text-muted">
            Time {approach.tc}
          </span>
        ) : null}
        {approach.sc ? (
          <span className="rounded border border-border px-1.5 font-mono text-[10.5px] text-muted">
            Space {approach.sc}
          </span>
        ) : null}
      </div>
      <Md text={approach.i} className="mt-2" />
      <div className="mt-3">
        <CodePair java={approach.java} py={approach.py} />
      </div>
    </div>
  );
}

function Coding({ it }: { it: CodingAnswer }) {
  return (
    <>
      <Block title="Problem">
        <Md text={it.stmt} />
      </Block>
      <Block title="What they are testing">
        <Md text={it.key} />
      </Block>
      <Block title="Approaches">
        <ApproachCard label="1 · Brute force" approach={it.brute} />
        <ApproachCard label="2 · Optimised" approach={it.opt} />
      </Block>
      {it.fu.length ? (
        <Block title="Follow-ups">
          <QAList items={it.fu} />
        </Block>
      ) : null}
    </>
  );
}

function Lld({ it }: { it: LldAnswer }) {
  const diagram = LLD_DIAGRAMS[it.id];
  return (
    <>
      <Block title="Context">
        <Md text={it.stmt} />
      </Block>
      <Block title={it.playbook ? "Checklist" : "Clarifying questions"}>
        <Bullets items={it.ask} />
      </Block>
      <Block title={it.playbook ? "Running order" : "Functional requirements"}>
        <Bullets items={it.fr} />
      </Block>
      <Block title={it.playbook ? "Habits that score" : "Non-functional requirements"}>
        <Bullets items={it.nfr} />
      </Block>
      {it.ent ? (
        <Block title="Entities and responsibilities">
          <Md text={it.ent} />
        </Block>
      ) : null}
      {diagram ? (
        <Block title="Class diagram">
          <p className="mb-2 text-xs leading-5 text-faint">
            Notation: <code className="font-mono">──▷</code> implements / extends ·{" "}
            <code className="font-mono">◆──</code> composition ·{" "}
            <code className="font-mono">◇──</code> aggregation ·{" "}
            <code className="font-mono">──&gt;</code> uses · <code className="font-mono">«I»</code>{" "}
            interface · <code className="font-mono">«A»</code> abstract
          </p>
          <Ascii text={diagram} label="UML" />
        </Block>
      ) : null}
      {it.cls ? (
        <Block title="Class design">
          <CodePair java={it.cls.java} py={it.cls.py} />
        </Block>
      ) : null}
      {it.pat?.length ? (
        <Block title="Patterns used">
          <Bullets items={it.pat} />
        </Block>
      ) : null}
      {it.conc ? (
        <Block title="Concurrency and thread safety">
          <Md text={it.conc} />
        </Block>
      ) : null}
      {it.ext?.length ? (
        <Block title="Extension points">
          <Bullets items={it.ext} />
        </Block>
      ) : null}
      {it.qa.length ? (
        <Block title="Interview Q&A">
          <QAList items={it.qa} />
        </Block>
      ) : null}
    </>
  );
}

function Hld({ it }: { it: HldAnswer }) {
  const n = (i: number, label: string) => (it.playbook ? label : `${i} · ${label}`);
  return (
    <>
      <Block title="Context">
        <Md text={it.stmt} />
      </Block>
      <Block title={it.playbook ? "The questions to ask" : n(1, "Clarifying questions")}>
        <QAList items={it.ask} />
      </Block>
      <Block title={it.playbook ? "Running order" : n(2, "Functional requirements")}>
        <Bullets items={it.fr} />
      </Block>
      <Block title={it.playbook ? "Habits that score" : n(3, "Non-functional requirements")}>
        <Bullets items={it.nfr} />
      </Block>
      {it.scale ? (
        <Block title={n(4, "Scale estimates")}>
          <Md text={it.scale} />
        </Block>
      ) : null}
      {it.arch ? (
        <Block title={n(5, "Architecture")}>
          <Ascii text={it.arch} label="Architecture" />
        </Block>
      ) : null}
      {it.svc.length ? (
        <Block title={n(6, "Services")}>
          <Table
            head={["Component", "What it does"]}
            rows={it.svc.map((s) => [s.n, <MdInline key="d" text={s.d} />])}
          />
        </Block>
      ) : null}
      {it.seq ? (
        <Block title={n(7, "Sequence chart")}>
          <Ascii text={it.seq} label="Sequence" />
        </Block>
      ) : null}
      {it.db.tables.length || it.db.sql || it.db.nosql ? (
        <Block title={n(8, "Database design")}>
          {it.db.tables.length ? (
            <Table
              head={["Table / store", "Columns", "Notes"]}
              rows={it.db.tables.map((t) => [
                t.n,
                <code key="c" className="font-mono text-[12px] text-fg">
                  {t.cols}
                </code>,
                <MdInline key="n" text={t.notes} />,
              ])}
            />
          ) : null}
          {it.db.sql || it.db.nosql ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="text-[13px] font-medium text-fg">Why SQL here</div>
                <Md text={it.db.sql} className="mt-1.5 text-[14px] leading-6" />
              </div>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="text-[13px] font-medium text-fg">Why NoSQL here</div>
                <Md text={it.db.nosql} className="mt-1.5 text-[14px] leading-6" />
              </div>
            </div>
          ) : null}
          {it.db.verdict ? (
            <div className="mt-3 border-l-2 border-accent pl-4">
              <Md text={it.db.verdict} />
            </div>
          ) : null}
        </Block>
      ) : null}
      {it.fu.length ? (
        <Block title={n(9, "Follow-ups")}>
          <QAList items={it.fu} />
        </Block>
      ) : null}
    </>
  );
}

function Concept({ it }: { it: ConceptAnswer }) {
  return (
    <>
      <Block title="Answer">
        <Md text={it.a} />
      </Block>
      {it.sql ? (
        <Block title="Worked example">
          <CodeBlock source={it.sql} label="SQL / HTTP" />
        </Block>
      ) : null}
      {it.codeLang && it.code ? (
        <Block title="Code">
          <CodeBlock source={it.code} label={it.codeLang} />
        </Block>
      ) : it.java || it.py ? (
        <Block title="Code">
          <CodePair java={it.java} py={it.py} />
        </Block>
      ) : null}
      {it.fu.length ? (
        <Block title="Follow-ups">
          <QAList items={it.fu} />
        </Block>
      ) : null}
    </>
  );
}

export function LibraryAnswer({ entry }: { entry: LibraryEntry }) {
  switch (entry.kind) {
    case "coding":
      return <Coding it={entry.d} />;
    case "lld":
      return <Lld it={entry.d} />;
    case "hld":
      return <Hld it={entry.d} />;
    case "concept":
      return <Concept it={entry.d} />;
  }
}

/** A company-specific question answered on that company's own sheet. */
export function InlineAnswer({ question }: { question: Question }) {
  const { code } = question;
  return (
    <>
      <Block title="Answer">
        <Md text={question.a} />
      </Block>
      {typeof code === "string" ? (
        <Block title="Code">
          <CodeBlock source={code} label={question.codeLang ?? "Code"} />
        </Block>
      ) : code ? (
        <Block title="Code">
          <CodePair java={code.java} py={code.py} />
        </Block>
      ) : null}
      {question.fu?.length ? (
        <Block title="Follow-ups">
          <QAList items={question.fu} />
        </Block>
      ) : null}
    </>
  );
}
